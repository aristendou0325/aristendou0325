"""Hugo 博客文章发布器

与旧版的区别：
  * 只提交 content/ 与 data/ 等源文件，绝不使用 `git add .`
    （避免把 public/、.conda/、临时文件扫进仓库）
  * 推送前先 fetch + rebase，避免远端有新提交时 push 被拒
  * 失败后不再递归重试（旧版会无限弹窗），改为单次重试按钮
  * 所有 git 调用统一走 _run_git()，便于集中处理错误与编码
"""

import datetime
import os
import subprocess
import tkinter as tk
from tkinter import messagebox, scrolledtext

# 允许提交的路径前缀（相对仓库根目录）。
# 只有这些路径会被 stage，其余文件一律不动。
TRACKED_PATHS = ("content", "data", "layouts", "assets", "static", "hugo.toml")

DEFAULT_BRANCH = "main"


class HugoPublisher:
    def __init__(self, root):
        self.root = root
        self.root.title("Hugo 博客文章发布器")
        self.root.geometry("800x600")

        # 当前工作目录设置为 Hugo 项目根目录
        self.project_dir = os.path.dirname(os.path.abspath(__file__))

        # 标识符
        self.identifier = None
        self.article_path = None

        # 创建新文章按钮
        self.new_article_button = tk.Button(root, text="创建新文章", command=self.create_new_article)
        self.new_article_button.pack(pady=10)

        # 文本编辑器
        self.text_editor = scrolledtext.ScrolledText(root, wrap=tk.WORD, height=20)
        self.text_editor.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # 保存按钮
        self.save_button = tk.Button(root, text="保存文章", command=self.save_article)
        self.save_button.pack(side=tk.LEFT, padx=10, pady=10)

        # 发布按钮
        self.publish_button = tk.Button(root, text="发布文章", command=self.publish_article)
        self.publish_button.pack(side=tk.RIGHT, padx=10, pady=10)

        # 禁用编辑器和按钮，直到创建文章
        self.text_editor.config(state=tk.DISABLED)
        self.save_button.config(state=tk.DISABLED)
        self.publish_button.config(state=tk.DISABLED)

    # ------------------------------------------------------------------
    # git 辅助
    # ------------------------------------------------------------------
    def _run_git(self, args):
        """执行一条 git 命令，返回 CompletedProcess（不抛异常）。"""
        return subprocess.run(
            ["git", *args],
            cwd=self.project_dir,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

    def _git_or_raise(self, args):
        """执行 git 命令，失败时抛出带 stderr 的 RuntimeError。"""
        result = self._run_git(args)
        if result.returncode != 0:
            detail = (result.stderr or result.stdout or "").strip()
            raise RuntimeError(f"git {' '.join(args)} 失败：{detail}")
        return result

    def _stage_tracked(self):
        """只 stage 白名单路径下真实存在的文件。"""
        existing = [p for p in TRACKED_PATHS
                    if os.path.exists(os.path.join(self.project_dir, p))]
        if not existing:
            raise RuntimeError("没有找到任何可提交的源文件目录")
        # -A 让新增/修改/删除都被记录，但作用域被限制在白名单内
        self._git_or_raise(["add", "-A", "--", *existing])

    def _has_staged_changes(self):
        result = self._run_git(["diff", "--cached", "--quiet"])
        # 退出码 0 = 无差异，1 = 有差异
        return result.returncode == 1

    # ------------------------------------------------------------------
    # 文章操作
    # ------------------------------------------------------------------
    def create_new_article(self):
        # 生成唯一标识符
        self.identifier = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        article_name = f"article-{self.identifier}.md"
        self.article_path = os.path.join(self.project_dir, "content", "posts", article_name)

        # 使用 Hugo 创建新文章
        try:
            result = subprocess.run(
                ["hugo", "new", f"posts/{article_name}"],
                cwd=self.project_dir,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            if result.returncode != 0:
                messagebox.showerror("错误", f"创建文章失败：{result.stderr}")
                return

            if not os.path.exists(self.article_path):
                messagebox.showerror("错误", f"命令执行成功但未找到文件：{article_name}")
                return

            with open(self.article_path, "r", encoding="utf-8") as f:
                content = f.read()

            self.text_editor.config(state=tk.NORMAL)
            self.text_editor.delete(1.0, tk.END)
            self.text_editor.insert(tk.END, content)
            self.save_button.config(state=tk.NORMAL)
            self.publish_button.config(state=tk.NORMAL)
            messagebox.showinfo("成功", f"新文章创建成功：{article_name}")
        except Exception as e:
            messagebox.showerror("错误", f"创建文章时出错：{e}")

    def save_article(self):
        if not self.article_path:
            return
        # Text 组件末尾总有一个额外的换行，去掉它避免文件不断增长
        content = self.text_editor.get(1.0, tk.END).rstrip("\n") + "\n"
        try:
            with open(self.article_path, "w", encoding="utf-8") as f:
                f.write(content)
            messagebox.showinfo("成功", "文章保存成功")
        except Exception as e:
            messagebox.showerror("错误", f"保存文章失败：{e}")

    # ------------------------------------------------------------------
    # 发布
    # ------------------------------------------------------------------
    def publish_article(self):
        if not self.article_path:
            return
        try:
            self.save_article_silent()
            self._do_publish()
        except RuntimeError as e:
            self.show_failure_dialog(str(e))
        except Exception as e:
            self.show_failure_dialog(f"未预期的错误：{e}")

    def save_article_silent(self):
        """发布前静默落盘，避免用户忘记点保存。"""
        if not self.article_path:
            return
        content = self.text_editor.get(1.0, tk.END).rstrip("\n") + "\n"
        with open(self.article_path, "w", encoding="utf-8") as f:
            f.write(content)

    def _do_publish(self):
        # 1. 限定作用域地 stage
        self._stage_tracked()

        # 2. 没有改动就不产生空提交
        if not self._has_staged_changes():
            messagebox.showinfo("提示", "没有检测到任何改动，无需发布。")
            return

        # 3. commit
        commit_msg = f"更新文章：article-{self.identifier}"
        self._git_or_raise(["commit", "-m", commit_msg])

        # 4. 推送前先同步远端，避免 non-fast-forward 被拒
        fetch = self._run_git(["fetch", "origin", DEFAULT_BRANCH])
        if fetch.returncode == 0:
            rebase = self._run_git(["rebase", f"origin/{DEFAULT_BRANCH}"])
            if rebase.returncode != 0:
                self._run_git(["rebase", "--abort"])
                raise RuntimeError(
                    "与远端同步失败（可能存在冲突），已中止 rebase。\n"
                    "请手动处理后重试。"
                )

        # 5. push
        self._git_or_raise(["push", "origin", DEFAULT_BRANCH])

        self.show_success_dialog()

    # ------------------------------------------------------------------
    # 对话框
    # ------------------------------------------------------------------
    def show_success_dialog(self):
        again = messagebox.askyesno("发布成功", "文章发布成功！\n\n是否创建新文章？")
        if again:
            self.reset_for_new_article()
        else:
            self.root.quit()

    def show_failure_dialog(self, error):
        """单次确认重试，不做递归调用（旧版会无限套娃弹窗）。"""
        retry = messagebox.askretrycancel("发布失败", f"发布失败：\n\n{error}\n\n是否重试？")
        if retry:
            self.publish_article()

    def reset_for_new_article(self):
        self.identifier = None
        self.article_path = None
        self.text_editor.config(state=tk.DISABLED)
        self.text_editor.delete(1.0, tk.END)
        self.save_button.config(state=tk.DISABLED)
        self.publish_button.config(state=tk.DISABLED)


if __name__ == "__main__":
    root = tk.Tk()
    app = HugoPublisher(root)
    root.mainloop()

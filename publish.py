"""Hugo 博客文章发布器

与旧版的区别：
  * 只提交 content/ 与 data/ 等源文件，绝不使用 `git add .`
    （避免把 public/、.conda/、临时文件扫进仓库）
  * 推送前先 fetch + rebase，避免远端有新提交时 push 被拒
  * 失败后不再递归重试（旧版会无限弹窗），改为单次重试按钮
  * 所有 git 调用统一走 _run_git()，便于集中处理错误与编码
  * 新增「管理/删除文章」：旧版只能创建，无法删除，误建的文章只能手动处理
"""

import datetime
import os
import re
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

        # Windows 上优先用 openssl 后端（schannel 在受限会话下会握手失败）
        self._ssl_backend = "openssl"

        # 标识符
        self.identifier = None
        self.article_path = None

        # 创建新文章按钮
        self.new_article_button = tk.Button(root, text="创建新文章", command=self.create_new_article)
        self.new_article_button.pack(pady=10)

        # 管理文章按钮
        self.manage_button = tk.Button(root, text="管理 / 删除文章", command=self.open_manage_window)
        self.manage_button.pack(pady=0)

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
    def _git_command(self):
        """构造 git 命令前缀。

        Windows 上 Git 默认使用 schannel 做 TLS，在部分环境（无交互凭据、
        受限会话）下会报 SEC_E_NO_CREDENTIALS，导致 fetch/push 全部失败。
        openssl 后端不依赖 Windows 凭据存储，可绕过该问题。
        这里默认追加 -c http.sslBackend=openssl，可用 _ssl_backend 覆盖。
        """
        cmd = ["git"]
        if os.name == "nt" and self._ssl_backend:
            cmd += ["-c", f"http.sslBackend={self._ssl_backend}"]
        return cmd

    def _run_git(self, args):
        """执行一条 git 命令，返回 CompletedProcess（不抛异常）。"""
        return subprocess.run(
            [*self._git_command(), *args],
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
            raise RuntimeError(self._explain_git_error(args, detail))
        return result

    def _explain_git_error(self, args, detail):
        """把常见 git 错误翻译成可操作的中文提示。"""
        if "SEC_E_NO_CREDENTIALS" in detail or "AcquireCredentialsHandle" in detail:
            return (
                f"git {' '.join(args)} 失败：TLS 凭据握手错误（schannel）。\n\n"
                "这通常不是你的账号或密码问题，而是 Windows schannel 后端在\n"
                "当前会话下无法获取凭据。publish.py 已默认改用 openssl 后端；\n"
                "若仍失败，可手动执行一次：\n\n"
                "    git config --global http.sslBackend openssl\n\n"
                f"原始错误：{detail}"
            )
        if "could not read Username" in detail or "Authentication failed" in detail:
            return (
                f"git {' '.join(args)} 失败：无法完成身份验证。\n\n"
                "请确认已登录 GitHub，或先用 git push 手动推送一次以完成凭据登录。\n\n"
                f"原始错误：{detail}"
            )
        if "non-fast-forward" in detail or "rejected" in detail:
            return (
                f"git {' '.join(args)} 失败：远端有你本地没有的提交。\n\n"
                "请先执行 git pull --rebase 同步后再重试。\n\n"
                f"原始错误：{detail}"
            )
        return f"git {' '.join(args)} 失败：{detail}"

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
    # 管理 / 删除文章
    # ------------------------------------------------------------------
    def posts_dir(self):
        return os.path.join(self.project_dir, "content", "posts")

    def list_posts(self):
        """返回 content/posts 下所有 .md 的 (文件名, 标题, 是否草稿, 正文SHA)。

        正文 SHA 用于在界面上标出内容完全重复的文章。
        """
        import hashlib

        posts = []
        directory = self.posts_dir()
        if not os.path.isdir(directory):
            return posts

        for name in sorted(os.listdir(directory)):
            if not name.lower().endswith(".md"):
                continue
            path = os.path.join(directory, name)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    raw = f.read()
            except OSError:
                continue

            # 解析 TOML front matter 里的 title / draft
            title = name
            draft = False
            m = re.search(r"^\s*title\s*=\s*['\"](.*?)['\"]", raw, re.MULTILINE)
            if m:
                title = m.group(1)
            d = re.search(r"^\s*draft\s*=\s*(true|false)", raw, re.MULTILINE)
            if d:
                draft = d.group(1) == "true"

            # 只对正文（第二个 +++ 之后）取哈希，标题不同但正文相同的会被识别为重复
            parts = raw.split("+++")
            body = parts[2] if len(parts) >= 3 else raw
            digest = hashlib.sha256(body.strip().encode("utf-8")).hexdigest()[:12]

            posts.append({
                "file": name,
                "title": title,
                "draft": draft,
                "hash": digest,
                "size": len(raw.encode("utf-8")),
            })

        # 统计每个正文哈希出现次数，用于标记重复
        counts = {}
        for p in posts:
            counts[p["hash"]] = counts.get(p["hash"], 0) + 1
        for p in posts:
            p["dup_count"] = counts[p["hash"]]
        return posts

    def open_manage_window(self):
        posts = self.list_posts()
        if not posts:
            messagebox.showinfo("提示", "content/posts 下没有任何文章。")
            return

        win = tk.Toplevel(self.root)
        win.title("管理 / 删除文章")
        win.geometry("720x460")
        win.transient(self.root)
        win.grab_set()

        tk.Label(
            win,
            text="选中要删除的文章（可多选，按住 Ctrl / Shift）：",
            anchor="w",
        ).pack(fill=tk.X, padx=10, pady=(10, 4))

        frame = tk.Frame(win)
        frame.pack(fill=tk.BOTH, expand=True, padx=10)

        scrollbar = tk.Scrollbar(frame, orient=tk.VERTICAL)
        listbox = tk.Listbox(
            frame,
            selectmode=tk.EXTENDED,
            yscrollcommand=scrollbar.set,
            font=("Consolas", 10),
        )
        scrollbar.config(command=listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        for p in posts:
            flags = []
            if p["draft"]:
                flags.append("草稿")
            if p["dup_count"] > 1:
                flags.append(f"⚠重复x{p['dup_count']}")
            tag = f"  [{'/'.join(flags)}]" if flags else ""
            listbox.insert(tk.END, f"{p['file']:<34} {p['title'][:28]}{tag}")

        tk.Label(
            win,
            text="注：标记「⚠重复」的文章正文完全相同。删除会同时 git rm 并推送。",
            anchor="w",
            fg="#a00",
        ).pack(fill=tk.X, padx=10, pady=(6, 0))

        btn_row = tk.Frame(win)
        btn_row.pack(fill=tk.X, padx=10, pady=10)

        def do_delete():
            selection = listbox.curselection()
            if not selection:
                messagebox.showwarning("提示", "请先选中至少一篇文章。", parent=win)
                return

            chosen = [posts[i] for i in selection]
            names = "\n".join(f"  • {c['file']}  ({c['title']})" for c in chosen)

            # 重复文章额外提示
            dup_note = ""
            dup_files = [c for c in chosen if c["dup_count"] > 1]
            if dup_files:
                dup_note = (
                    "\n\n注意：其中以下文章的正文与其他文章完全相同（可能是重复发布）：\n"
                    + "\n".join(f"  • {c['file']}" for c in dup_files)
                )

            if not messagebox.askyesno(
                "确认删除",
                f"确定要删除以下 {len(chosen)} 篇文章吗？\n\n{names}{dup_note}\n\n"
                "此操作会删除文件并推送到 GitHub，无法通过本工具撤销。",
                icon="warning",
                parent=win,
            ):
                return

            try:
                self._delete_posts([c["file"] for c in chosen])
            except RuntimeError as e:
                messagebox.showerror("删除失败", str(e), parent=win)
                return
            except Exception as e:
                messagebox.showerror("删除失败", f"未预期的错误：{e}", parent=win)
                return

            messagebox.showinfo(
                "完成",
                f"已删除 {len(chosen)} 篇文章并推送。",
                parent=win,
            )
            win.destroy()

        tk.Button(btn_row, text="删除选中文章", command=do_delete).pack(side=tk.LEFT)
        tk.Button(btn_row, text="取消", command=win.destroy).pack(side=tk.RIGHT)

    def _delete_posts(self, filenames):
        """git rm 选中的文章，提交并推送。失败抛 RuntimeError。"""
        rel_paths = [os.path.join("content", "posts", n) for n in filenames]

        self._git_or_raise(["rm", "-q", "--", *rel_paths])

        if not self._has_staged_changes():
            raise RuntimeError("没有检测到需要提交的删除操作。")

        if len(filenames) == 1:
            msg = f"删除文章：{filenames[0]}"
        else:
            msg = f"删除 {len(filenames)} 篇文章：" + "、".join(filenames)
        self._git_or_raise(["commit", "-m", msg])

        fetch = self._run_git(["fetch", "origin", DEFAULT_BRANCH])
        if fetch.returncode == 0:
            rebase = self._run_git(["rebase", f"origin/{DEFAULT_BRANCH}"])
            if rebase.returncode != 0:
                self._run_git(["rebase", "--abort"])
                raise RuntimeError(
                    "与远端同步失败（可能存在冲突），已中止 rebase。请手动处理后重试。"
                )

        self._git_or_raise(["push", "origin", DEFAULT_BRANCH])

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

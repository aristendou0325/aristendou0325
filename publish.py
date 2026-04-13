import tkinter as tk
from tkinter import messagebox, scrolledtext
import subprocess
import datetime
import os

class HugoPublisher:
    def __init__(self, root):
        self.root = root
        self.root.title("Hugo 博客文章发布器")
        self.root.geometry("800x600")

        # 当前工作目录设置为Hugo项目根目录
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

    def create_new_article(self):
        # 生成唯一标识符
        self.identifier = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        article_name = f"article-{self.identifier}.md"
        self.article_path = os.path.join(self.project_dir, "content", "posts", article_name)

        # 使用Hugo创建新文章
        try:
            result = subprocess.run(["hugo", "new", f"posts/{article_name}"], cwd=self.project_dir, capture_output=True, text=True)
            if result.returncode == 0:
                # 读取创建的文件
                with open(self.article_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                self.text_editor.config(state=tk.NORMAL)
                self.text_editor.delete(1.0, tk.END)
                self.text_editor.insert(tk.END, content)
                self.save_button.config(state=tk.NORMAL)
                self.publish_button.config(state=tk.NORMAL)
                messagebox.showinfo("成功", f"新文章创建成功：{article_name}")
            else:
                messagebox.showerror("错误", f"创建文章失败：{result.stderr}")
        except Exception as e:
            messagebox.showerror("错误", f"创建文章时出错：{str(e)}")

    def save_article(self):
        if self.article_path:
            content = self.text_editor.get(1.0, tk.END)
            try:
                with open(self.article_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                messagebox.showinfo("成功", "文章保存成功")
            except Exception as e:
                messagebox.showerror("错误", f"保存文章失败：{str(e)}")

    def publish_article(self):
        if self.article_path:
            try:
                # git add .
                subprocess.run(["git", "add", "."], cwd=self.project_dir, check=True)
                # git commit
                commit_msg = f"更新文章：article-{self.identifier}"
                subprocess.run(["git", "commit", "-m", commit_msg], cwd=self.project_dir, check=True)
                # git push main
                subprocess.run(["git", "push", "origin", "main"], cwd=self.project_dir, check=True)
                # 成功弹窗
                self.show_success_dialog()
            except subprocess.CalledProcessError as e:
                # 失败弹窗
                self.show_failure_dialog(str(e))

    def show_success_dialog(self):
        result = messagebox.askyesno("发布成功", "文章发布成功！\n\n是否创建新文章？")
        if result:
            self.reset_for_new_article()
        else:
            self.root.quit()

    def show_failure_dialog(self, error):
        result = messagebox.askretrycancel("发布失败", f"发布失败：{error}\n\n是否重试？")
        if result:
            self.publish_article()
        else:
            self.root.quit()

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
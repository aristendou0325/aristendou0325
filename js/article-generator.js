/**
 * 文章生成器模块
 * 负责将文章数据转换为HTML文件并提供文章管理功能
 */

/**
 * 文章生成器类
 */
class ArticleGenerator {
    constructor() {
        // 文章模板
        this.template = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - 我的博客</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .article-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .article-header {
            margin-bottom: 30px;
            text-align: center;
        }
        
        .article-title {
            font-size: 2.5rem;
            color: #2d3748;
            margin-bottom: 20px;
            line-height: 1.3;
        }
        
        .article-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 30px;
            color: #718096;
            font-size: 1rem;
        }
        
        .article-content {
            line-height: 1.8;
            color: #4a5568;
            margin-bottom: 40px;
        }
        
        .article-content h1,
        .article-content h2,
        .article-content h3,
        .article-content h4,
        .article-content h5,
        .article-content h6 {
            color: #2d3748;
            margin-top: 1.5em;
            margin-bottom: 0.8em;
            line-height: 1.4;
        }
        
        .article-content h1 {
            font-size: 1.8rem;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.3em;
        }
        
        .article-content h2 {
            font-size: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.3em;
        }
        
        .article-content h3 {
            font-size: 1.3rem;
        }
        
        .article-content p {
            margin-bottom: 1em;
        }
        
        .article-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
            display: block;
        }
        
        .article-content blockquote {
            border-left: 4px solid #667eea;
            padding-left: 15px;
            margin: 20px 0;
            color: #718096;
            font-style: italic;
        }
        
        .article-content ul,
        .article-content ol {
            margin: 20px 0;
            padding-left: 30px;
        }
        
        .article-content li {
            margin-bottom: 10px;
        }
        
        .article-content a {
            color: #667eea;
            text-decoration: none;
            transition: color 0.3s;
        }
        
        .article-content a:hover {
            text-decoration: underline;
        }
        
        .article-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 40px;
            justify-content: center;
        }
        
        .article-tags a {
            padding: 6px 14px;
            background-color: #f0f0f0;
            color: #666;
            text-decoration: none;
            border-radius: 18px;
            font-size: 0.9rem;
            transition: all 0.3s;
        }
        
        .article-tags a:hover {
            background-color: #667eea;
            color: white;
        }
        
        .back-to-home {
            text-align: center;
            margin-top: 50px;
        }
        
        .back-to-home a {
            display: inline-block;
            padding: 10px 25px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: all 0.3s;
        }
        
        .back-to-home a:hover {
            background-color: #5a67d8;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <!-- 导航栏 -->
    <nav class="navbar">
        <div class="container">
            <div class="logo">
                <a href="index.html"><h2>我的博客</h2></a>
            </div>
            <ul class="nav-links">
                <li><a href="index.html" class="active">首页</a></li>
                <li><a href="admin.html">管理</a></li>
            </ul>
        </div>
    </nav>
    
    <!-- 文章内容 -->
    <div class="article-container">
        <div class="article-header">
            <h1 class="article-title">{{title}}</h1>
            <div class="article-meta">
                <span>作者：{{author}}</span>
                <span>发布日期：{{date}}</span>
                <span>分类：<a href="index.html?category={{category}}">{{category}}</a></span>
            </div>
        </div>
        
        <div class="article-tags">
            {{tags}}
        </div>
        
        <div class="article-content">
            {{content}}
        </div>
        
        <div class="back-to-home">
            <a href="index.html">返回首页</a>
        </div>
    </div>
    
    <!-- 页脚 -->
    <footer class="footer">
        <div class="container">
            <div class="copyright">
                <p>&copy; 2024 我的博客. All rights reserved.</p>
            </div>
        </div>
    </footer>
    
    <!-- 导入JavaScript文件 -->
    <script src="js/main.js"></script>
</body>
</html>`;
    }
    
    /**
     * 生成文章HTML内容
     * @param {object} articleData - 文章数据对象
     * @returns {string} 生成的HTML内容
     */
    generateArticleHTML(articleData) {
        // 处理标签格式
        let tagsHTML = '';
        if (articleData.tags && articleData.tags.length > 0) {
            articleData.tags.forEach(tag => {
                tagsHTML += `<a href="index.html?tag=${encodeURIComponent(tag)}">${tag}</a>`;
            });
        }
        
        // 处理日期格式（将YYYY-MM-DD转换为YYYY年MM月DD日）
        const formattedDate = this.formatDate(articleData.date);
        
        // 替换模板中的占位符
        let html = this.template
            .replace(/\{\{title\}\}/g, articleData.title)
            .replace(/\{\{author\}\}/g, articleData.author)
            .replace(/\{\{date\}\}/g, formattedDate)
            .replace(/\{\{category\}\}/g, articleData.category)
            .replace(/\{\{tags\}\}/g, tagsHTML)
            .replace(/\{\{content\}\}/g, articleData.content);
        
        return html;
    }
    
    /**
     * 格式化日期
     * @param {string} dateString - 日期字符串（YYYY-MM-DD格式）
     * @returns {string} 格式化后的日期字符串（YYYY年MM月DD日）
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        const [year, month, day] = dateString.split('-');
        return `${year}年${month}月${day}日`;
    }
    
    /**
     * 生成文章文件名
     * @param {string} title - 文章标题
     * @returns {string} 生成的文件名
     */
    generateFileName(title) {
        // 将标题转换为文件名（移除特殊字符，用下划线替换空格）
        const fileName = title
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]/g, '_')
            .replace(/_+/g, '_')
            .slice(0, 50); // 限制文件名长度
        
        return `${fileName}.html`;
    }
    
    /**
     * 下载文章文件
     * @param {object} articleData - 文章数据
     */
    downloadArticle(articleData) {
        // 生成HTML内容
        const htmlContent = this.generateArticleHTML(articleData);
        
        // 生成文件名
        const fileName = this.generateFileName(articleData.title);
        
        // 创建Blob对象
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        URL.revokeObjectURL(link.href);
        
        return fileName;
    }
    
    /**
     * 保存文章到localStorage并生成HTML文件
     * @param {object} articleData - 文章数据
     * @returns {object} 包含保存结果的对象
     */
    saveAndGenerateArticle(articleData) {
        try {
            // 生成唯一ID（如果没有）
            if (!articleData.id) {
                articleData.id = 'article_' + Date.now();
            }
            
            // 获取现有文章列表
            let articles = localStorage.getItem('blogArticles');
            articles = articles ? JSON.parse(articles) : [];
            
            // 检查是否是更新文章
            const existingIndex = articles.findIndex(article => article.id === articleData.id);
            
            if (existingIndex >= 0) {
                // 更新现有文章
                articles[existingIndex] = articleData;
            } else {
                // 添加新文章到列表开头
                articles.unshift(articleData);
            }
            
            // 保存回localStorage
            localStorage.setItem('blogArticles', JSON.stringify(articles));
            
            // 生成并下载HTML文件
            const fileName = this.downloadArticle(articleData);
            
            // 更新文章数据中的文件路径
            articleData.filePath = fileName;
            localStorage.setItem('blogArticles', JSON.stringify(articles));
            
            return {
                success: true,
                fileName: fileName,
                id: articleData.id
            };
        } catch (error) {
            console.error('保存和生成文章失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 获取所有保存的文章
     * @returns {array} 文章列表
     */
    getAllArticles() {
        try {
            const articles = localStorage.getItem('blogArticles');
            return articles ? JSON.parse(articles) : [];
        } catch (error) {
            console.error('获取文章列表失败:', error);
            return [];
        }
    }
    
    /**
     * 根据ID获取文章
     * @param {string} id - 文章ID
     * @returns {object|null} 文章对象或null
     */
    getArticleById(id) {
        const articles = this.getAllArticles();
        return articles.find(article => article.id === id) || null;
    }
    
    /**
     * 删除文章
     * @param {string} id - 文章ID
     * @returns {boolean} 删除是否成功
     */
    deleteArticle(id) {
        try {
            let articles = this.getAllArticles();
            articles = articles.filter(article => article.id !== id);
            localStorage.setItem('blogArticles', JSON.stringify(articles));
            return true;
        } catch (error) {
            console.error('删除文章失败:', error);
            return false;
        }
    }
    
    /**
     * 搜索文章
     * @param {string} keyword - 搜索关键词
     * @returns {array} 搜索结果
     */
    searchArticles(keyword) {
        if (!keyword) return this.getAllArticles();
        
        const lowerKeyword = keyword.toLowerCase();
        const articles = this.getAllArticles();
        
        return articles.filter(article => 
            article.title.toLowerCase().includes(lowerKeyword) ||
            article.content.toLowerCase().includes(lowerKeyword) ||
            article.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
            article.category.toLowerCase().includes(lowerKeyword)
        );
    }
}

// 创建并导出文章生成器实例
const articleGenerator = new ArticleGenerator();
window.articleGenerator = articleGenerator;

// 导出主要方法供其他模块使用
export default articleGenerator;
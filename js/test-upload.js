/* ===================================================
   文章上传流程测试脚本
   功能：验证文章上传、生成、存储和显示的完整流程
   =================================================== */

/**
 * 测试文章上传流程
 */
function testArticleUploadFlow() {
    console.log('开始测试文章上传流程...');
    
    // 1. 检查必要的模块是否加载
    checkDependencies();
    
    // 2. 创建测试文章数据
    const testArticle = createTestArticle();
    console.log('创建测试文章:', testArticle.title);
    
    // 3. 测试文章生成功能
    if (typeof ArticleGenerator !== 'undefined') {
        testArticleGenerator(testArticle);
    } else {
        console.warn('ArticleGenerator 模块未加载，跳过生成器测试');
    }
    
    // 4. 测试localStorage存储
    testLocalStorage(testArticle);
    
    // 5. 提示用户检查首页显示
    console.log('\n测试完成！请刷新首页查看文章是否正确显示。');
    console.log('如果一切正常，您应该能在首页看到新添加的测试文章。');
    
    return true;
}

/**
 * 检查依赖项
 */
function checkDependencies() {
    console.log('检查依赖项...');
    
    // 检查localStorage是否可用
    const localStorageAvailable = typeof localStorage !== 'undefined';
    console.log('localStorage可用:', localStorageAvailable);
    
    if (!localStorageAvailable) {
        console.error('错误：localStorage不可用，文章上传功能将无法正常工作！');
    }
    
    return localStorageAvailable;
}

/**
 * 创建测试文章数据
 * @returns {Object} 测试文章数据
 */
function createTestArticle() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD格式
    
    return {
        title: '测试文章：博客上传功能',
        author: '测试用户',
        date: dateStr,
        category: '技术分享',
        tags: ['测试', '博客', '上传功能'],
        content: `<h2>这是一篇测试文章</h2>
        <p>本文用于测试博客的文章上传功能。文章上传功能允许用户直接在本地电脑上创建和上传博客文章。</p>
        <h3>主要功能包括：</h3>
        <ul>
            <li>文章表单填写</li>
            <li>富文本编辑</li>
            <li>文章预览</li>
            <li>自动生成HTML文件</li>
            <li>保存到localStorage</li>
        </ul>
        <p>测试文章内容...测试文章内容...测试文章内容...</p>`,
        summary: '这是一篇用于测试博客上传功能的示例文章。'
    };
}

/**
 * 测试文章生成器
 * @param {Object} article - 文章数据
 */
function testArticleGenerator(article) {
    console.log('测试文章生成器...');
    
    try {
        // 生成文章HTML
        const htmlContent = ArticleGenerator.generateArticleHTML(article);
        console.log('文章HTML生成成功，长度:', htmlContent.length, '字符');
        
        // 生成文件名
        const fileName = ArticleGenerator.generateFileName(article.title);
        console.log('生成的文件名:', fileName);
        
        // 测试保存到localStorage
        ArticleGenerator.saveToLocalStorage(article);
        console.log('文章已保存到localStorage');
        
        return true;
    } catch (error) {
        console.error('文章生成器测试失败:', error);
        return false;
    }
}

/**
 * 测试localStorage存储功能
 * @param {Object} article - 文章数据
 */
function testLocalStorage(article) {
    console.log('测试localStorage存储...');
    
    try {
        // 获取现有文章
        let articles = JSON.parse(localStorage.getItem('blogArticles') || '[]');
        
        // 添加测试文章（如果不存在）
        const existingIndex = articles.findIndex(a => a.title === article.title);
        if (existingIndex === -1) {
            articles.push(article);
            localStorage.setItem('blogArticles', JSON.stringify(articles));
            console.log('测试文章已添加到localStorage');
        } else {
            console.log('测试文章已存在于localStorage中');
        }
        
        // 验证存储
        const storedArticles = JSON.parse(localStorage.getItem('blogArticles') || '[]');
        console.log('localStorage中文章总数:', storedArticles.length);
        
        return true;
    } catch (error) {
        console.error('localStorage测试失败:', error);
        return false;
    }
}

/**
 * 清理测试数据
 */
function cleanupTestData() {
    try {
        const articles = JSON.parse(localStorage.getItem('blogArticles') || '[]');
        const filteredArticles = articles.filter(a => a.title !== '测试文章：博客上传功能');
        localStorage.setItem('blogArticles', JSON.stringify(filteredArticles));
        console.log('测试数据已清理');
        return true;
    } catch (error) {
        console.error('清理测试数据失败:', error);
        return false;
    }
}

// 当脚本被直接加载时运行测试
if (typeof module === 'undefined' || !module.exports) {
    // 在浏览器环境中
    window.addEventListener('DOMContentLoaded', function() {
        // 提供全局测试函数供用户手动调用
        window.testBlogUpload = testArticleUploadFlow;
        window.cleanupTestData = cleanupTestData;
        
        // 添加测试按钮到页面
        addTestButton();
    });
}

/**
 * 添加测试按钮到页面
 */
function addTestButton() {
    const button = document.createElement('button');
    button.id = 'test-upload-button';
    button.textContent = '测试文章上传功能';
    button.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        background-color: #28a745;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        z-index: 999;
    `;
    
    button.addEventListener('click', function() {
        const success = testArticleUploadFlow();
        if (success) {
            alert('测试完成！请刷新首页查看效果。');
        } else {
            alert('测试过程中出现错误，请查看控制台。');
        }
    });
    
    document.body.appendChild(button);
    
    // 添加清理按钮
    const cleanupButton = document.createElement('button');
    cleanupButton.id = 'cleanup-test-button';
    cleanupButton.textContent = '清理测试数据';
    cleanupButton.style.cssText = `
        position: fixed;
        bottom: 150px;
        right: 30px;
        background-color: #dc3545;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        z-index: 999;
    `;
    
    cleanupButton.addEventListener('click', function() {
        if (confirm('确定要清理测试数据吗？')) {
            const success = cleanupTestData();
            if (success) {
                alert('测试数据已清理！');
                location.reload();
            } else {
                alert('清理失败，请查看控制台。');
            }
        }
    });
    
    document.body.appendChild(cleanupButton);
}
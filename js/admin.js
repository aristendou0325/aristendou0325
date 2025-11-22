/**
 * 文章管理功能的JavaScript模块
 * 负责处理文章表单交互、富文本编辑和预览功能
 */

// 全局变量，存储标签数据
let tags = [];

// 页面加载完成后执行初始化
window.addEventListener('DOMContentLoaded', () => {
    // 设置今天的日期为默认日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // 初始化标签输入功能
    initTagsInput();
    
    // 初始化预览功能
    initPreviewFunction();
    
    // 初始化表单提交
    initFormSubmit();
    
    // 初始化选项卡功能
    initTabs();
    
    // 初始化文章管理功能
    initArticleManagement();
    
    // 初始化文章预览功能
    initArticlePreview();
    
    // 初始化内容编辑区的焦点
    document.getElementById('content').focus();
});

/**
 * 初始化标签输入功能
 * 处理标签的添加、删除和展示
 */
function initTagsInput() {
    const tagsInput = document.getElementById('tagsInput');
    const inputField = tagsInput.querySelector('.tag-input-field');
    
    // 监听输入框的键盘事件
    inputField.addEventListener('keydown', (e) => {
        // 当用户按下回车键时添加标签
        if (e.key === 'Enter' && inputField.value.trim()) {
            e.preventDefault(); // 阻止表单提交
            addTag(inputField.value.trim());
            inputField.value = '';
        }
    });
    
    // 监听整个标签区域的点击事件，确保点击标签区域外部时输入框能获得焦点
    tagsInput.addEventListener('click', () => {
        inputField.focus();
    });
}

/**
 * 添加新标签
 * @param {string} tagText - 标签文本
 */
function addTag(tagText) {
    // 检查标签是否已存在
    if (tags.includes(tagText)) {
        alert('标签已存在！');
        return;
    }
    
    // 检查标签数量限制
    if (tags.length >= 5) {
        alert('最多只能添加5个标签！');
        return;
    }
    
    // 添加标签到数组
    tags.push(tagText);
    
    // 更新标签显示
    updateTagsDisplay();
}

/**
 * 删除标签
 * @param {string} tagText - 要删除的标签文本
 */
function removeTag(tagText) {
    tags = tags.filter(tag => tag !== tagText);
    updateTagsDisplay();
}

/**
 * 更新标签显示区域
 */
function updateTagsDisplay() {
    const tagsInput = document.getElementById('tagsInput');
    const inputField = tagsInput.querySelector('.tag-input-field');
    
    // 清空标签区域，只保留输入框
    tagsInput.innerHTML = '';
    tagsInput.appendChild(inputField);
    
    // 添加所有标签
    tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        
        // 添加删除按钮
        const removeButton = document.createElement('button');
        removeButton.className = 'tag-remove';
        removeButton.textContent = '×';
        removeButton.addEventListener('click', () => removeTag(tag));
        
        tagElement.appendChild(removeButton);
        tagsInput.insertBefore(tagElement, inputField);
    });
}

/**
 * 富文本编辑功能
 * @param {string} command - 要执行的格式命令
 */
function formatText(command) {
    // 对于链接，需要用户输入URL
    if (command === 'createLink') {
        const url = prompt('请输入链接地址：', 'http://');
        if (url) {
            document.execCommand(command, false, url);
        }
    } else {
        document.execCommand(command, false, null);
    }
    
    // 确保编辑区保持焦点
    document.getElementById('content').focus();
}

/**
 * 初始化预览功能
 */
function initPreviewFunction() {
    const previewButton = document.getElementById('previewButton');
    const closePreviewButton = document.getElementById('closePreview');
    const previewContainer = document.getElementById('previewContainer');
    
    // 显示预览
    previewButton.addEventListener('click', updatePreview);
    
    // 关闭预览
    closePreviewButton.addEventListener('click', () => {
        previewContainer.classList.remove('active');
    });
}

/**
 * 更新预览内容
 */
function updatePreview() {
    // 获取表单数据
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').innerHTML;
    
    // 更新预览区域
    document.getElementById('previewTitle').textContent = title || '未设置标题';
    document.getElementById('previewAuthor').textContent = author || '未知作者';
    document.getElementById('previewDate').textContent = date || '未设置日期';
    document.getElementById('previewCategory').textContent = category || '未分类';
    document.getElementById('previewContent').innerHTML = content || '<p>文章内容为空</p>';
    
    // 更新标签预览
    const previewTags = document.getElementById('previewTags');
    previewTags.innerHTML = '';
    
    if (tags.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'post-tags';
        
        tags.forEach(tag => {
            const tagLink = document.createElement('a');
            tagLink.href = '#';
            tagLink.textContent = tag;
            tagsContainer.appendChild(tagLink);
        });
        
        previewTags.appendChild(tagsContainer);
    }
    
    // 显示预览容器
    document.getElementById('previewContainer').classList.add('active');
}

/**
 * 初始化表单提交处理
 */
function initFormSubmit() {
    const form = document.getElementById('articleForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 验证必填字段
        if (!validateForm()) {
            return;
        }
        
        // 收集表单数据
        const articleData = collectFormData();
        
        // 保存文章
        saveArticle(articleData);
    });
}

/**
 * 验证表单数据
 * @returns {boolean} 表单是否验证通过
 */
function validateForm() {
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').innerHTML.trim();
    
    // 简单验证
    if (!title) {
        alert('请输入文章标题');
        return false;
    }
    
    if (!author) {
        alert('请输入作者名称');
        return false;
    }
    
    if (!date) {
        alert('请选择发布日期');
        return false;
    }
    
    if (!category) {
        alert('请选择文章分类');
        return false;
    }
    
    if (!content) {
        alert('请输入文章内容');
        return false;
    }
    
    return true;
}

/**
 * 收集表单数据
 * @returns {object} 包含所有表单数据的对象
 */
function collectFormData() {
    return {
        title: document.getElementById('title').value.trim(),
        author: document.getElementById('author').value.trim(),
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        tags: tags,
        content: document.getElementById('content').innerHTML,
        excerpt: document.getElementById('excerpt').value.trim()
    };
}

/**
 * 保存文章
 * 使用文章生成器模块保存文章并生成HTML文件
 * @param {object} articleData - 文章数据对象
 */
function saveArticle(articleData) {
    try {
        // 检查文章生成器是否可用
        if (window.articleGenerator) {
            // 使用文章生成器保存文章并生成HTML文件
            const result = window.articleGenerator.saveAndGenerateArticle(articleData);
            
            if (result.success) {
                // 显示成功消息，包括文件名
                alert(`文章保存成功！HTML文件已生成：${result.fileName}\n请将此文件保存到博客根目录下。`);
                
                // 重置表单
                resetForm();
                
                // 更新文章管理列表
                loadArticlesList();
            } else {
                alert(`保存文章失败：${result.error}`);
            }
        } else {
            // 降级处理：仅保存到localStorage
            console.warn('文章生成器模块不可用，仅保存到localStorage');
            
            // 生成唯一ID
            const articleId = 'article_' + Date.now();
            articleData.id = articleId;
            
            // 获取现有文章列表
            let articles = localStorage.getItem('blogArticles');
            articles = articles ? JSON.parse(articles) : [];
            
            // 添加新文章到列表开头
            articles.unshift(articleData);
            
            // 保存回localStorage
            localStorage.setItem('blogArticles', JSON.stringify(articles));
            
            // 显示成功消息
            alert('文章已保存到本地存储！');
            
            // 重置表单
            resetForm();
            
            // 更新文章管理列表
            loadArticlesList();
        }
    } catch (error) {
        console.error('保存文章失败:', error);
        alert('保存文章失败，请重试！');
    }
}

/**
 * 重置表单
 */
function resetForm() {
    document.getElementById('articleForm').reset();
    document.getElementById('content').innerHTML = '';
    tags = [];
    updateTagsDisplay();
    
    // 再次设置今天的日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

/**
 * 初始化选项卡功能
 */
function initTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加当前活动状态
            tab.classList.add('active');
            const targetId = tab.dataset.tab;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 如果是文章管理标签，重新加载文章列表
                if (targetId === 'articlesManagement') {
                    loadArticlesList();
                }
                // 如果是预览标签，重新加载预览列表
                else if (targetId === 'articlesPreview') {
                    loadPreviewArticlesList();
                }
            }
        });
    });
}

/**
 * 初始化文章管理功能
 */
function initArticleManagement() {
    // 绑定搜索按钮事件
    const searchButton = document.getElementById('searchArticlesButton');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchTerm = document.getElementById('searchArticlesInput').value.toLowerCase();
            filterArticles(searchTerm);
        });
    }
    
    // 绑定刷新按钮事件
    const refreshButton = document.getElementById('refreshArticlesButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadArticlesList);
    }
    
    // 绑定导出按钮事件
    const exportButton = document.getElementById('exportArticlesButton');
    if (exportButton) {
        exportButton.addEventListener('click', exportArticles);
    }
}

/**
 * 加载文章列表
 */
function loadArticlesList() {
    const articlesList = document.getElementById('articlesList');
    if (!articlesList) return;
    
    // 清空列表
    articlesList.innerHTML = '';
    
    try {
        // 获取文章列表
        let articles = [];
        
        if (window.articleGenerator) {
            articles = window.articleGenerator.getAllArticles();
        } else {
            // 降级处理：从localStorage获取
            const storedArticles = localStorage.getItem('blogArticles');
            articles = storedArticles ? JSON.parse(storedArticles) : [];
        }
        
        if (articles.length === 0) {
            articlesList.innerHTML = '<p class="no-articles">暂无保存的文章</p>';
            return;
        }
        
        // 按日期降序排序
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 创建文章列表项
        articles.forEach(article => {
            const listItem = document.createElement('div');
            listItem.className = 'article-list-item';
            listItem.dataset.id = article.id || '';
            
            const titleElement = document.createElement('h4');
            titleElement.textContent = article.title || '未命名文章';
            
            const metaInfo = document.createElement('div');
            metaInfo.className = 'article-meta';
            metaInfo.innerHTML = `
                <span>作者: ${article.author || '未知'}</span>
                <span>日期: ${article.date || '未知'}</span>
                <span>分类: ${article.category || '未分类'}</span>
            `;
            
            const actions = document.createElement('div');
            actions.className = 'article-actions';
            
            // 编辑按钮
            const editButton = document.createElement('button');
            editButton.className = 'btn small edit-btn';
            editButton.textContent = '编辑';
            editButton.addEventListener('click', () => editArticle(article));
            
            // 删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn small delete-btn';
            deleteButton.textContent = '删除';
            deleteButton.addEventListener('click', () => deleteArticle(article.id));
            
            // 查看按钮
            const viewButton = document.createElement('button');
            viewButton.className = 'btn small view-btn';
            viewButton.textContent = '查看';
            viewButton.addEventListener('click', () => viewArticle(article));
            
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);
            actions.appendChild(viewButton);
            
            listItem.appendChild(titleElement);
            listItem.appendChild(metaInfo);
            listItem.appendChild(actions);
            
            articlesList.appendChild(listItem);
        });
    } catch (error) {
        console.error('加载文章列表失败:', error);
        articlesList.innerHTML = '<p class="error-message">加载文章列表失败</p>';
    }
}

/**
 * 过滤文章列表
 * @param {string} searchTerm - 搜索关键词
 */
function filterArticles(searchTerm) {
    const articlesItems = document.querySelectorAll('.article-list-item');
    
    articlesItems.forEach(item => {
        const title = item.querySelector('h4').textContent.toLowerCase();
        const metaInfo = item.querySelector('.article-meta').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || metaInfo.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * 编辑文章
 * @param {object} article - 文章对象
 */
function editArticle(article) {
    // 切换到创建文章标签
    const createTab = document.querySelector('.tab-button[data-tab="createArticle"]');
    if (createTab) {
        createTab.click();
    }
    
    // 填充表单数据
    document.getElementById('title').value = article.title || '';
    document.getElementById('author').value = article.author || '';
    document.getElementById('date').value = article.date || '';
    document.getElementById('category').value = article.category || '';
    document.getElementById('content').innerHTML = article.content || '';
    document.getElementById('excerpt').value = article.excerpt || '';
    
    // 恢复标签
    tags = [...(article.tags || [])];
    updateTagsDisplay();
}

/**
 * 删除文章
 * @param {string} articleId - 文章ID
 */
function deleteArticle(articleId) {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        if (window.articleGenerator) {
            // 使用文章生成器删除文章
            const result = window.articleGenerator.deleteArticle(articleId);
            if (result.success) {
                alert('文章已成功删除！');
                loadArticlesList();
            } else {
                alert(`删除文章失败：${result.error}`);
            }
        } else {
            // 降级处理：从localStorage删除
            let articles = localStorage.getItem('blogArticles');
            articles = articles ? JSON.parse(articles) : [];
            articles = articles.filter(article => article.id !== articleId);
            localStorage.setItem('blogArticles', JSON.stringify(articles));
            
            alert('文章已成功删除！');
            loadArticlesList();
        }
    } catch (error) {
        console.error('删除文章失败:', error);
        alert('删除文章失败，请重试！');
    }
}

/**
 * 查看文章
 * @param {object} article - 文章对象
 */
function viewArticle(article) {
    // 切换到预览标签
    const previewTab = document.querySelector('.tab-button[data-tab="articlesPreview"]');
    if (previewTab) {
        previewTab.click();
        
        // 选择对应的文章进行预览
        const articleSelect = document.getElementById('previewArticleSelect');
        if (articleSelect) {
            for (let i = 0; i < articleSelect.options.length; i++) {
                if (articleSelect.options[i].value === article.id) {
                    articleSelect.selectedIndex = i;
                    break;
                }
            }
            // 触发预览
            showArticlePreview(article);
        }
    }
}

/**
 * 导出文章
 */
function exportArticles() {
    try {
        let articles = [];
        
        if (window.articleGenerator) {
            articles = window.articleGenerator.getAllArticles();
        } else {
            // 降级处理：从localStorage获取
            const storedArticles = localStorage.getItem('blogArticles');
            articles = storedArticles ? JSON.parse(storedArticles) : [];
        }
        
        if (articles.length === 0) {
            alert('没有可导出的文章！');
            return;
        }
        
        // 创建导出数据
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            articles: articles
        };
        
        // 创建下载链接
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blog_articles_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('文章导出成功！');
    } catch (error) {
        console.error('导出文章失败:', error);
        alert('导出文章失败，请重试！');
    }
}

/**
 * 初始化文章预览功能
 */
function initArticlePreview() {
    // 加载文章列表到预览选择器
    loadPreviewArticlesList();
    
    // 绑定预览按钮事件
    const previewSelect = document.getElementById('previewArticleSelect');
    if (previewSelect) {
        previewSelect.addEventListener('change', (e) => {
            const articleId = e.target.value;
            if (articleId) {
                showArticlePreviewById(articleId);
            }
        });
    }
}

/**
 * 加载预览文章列表
 */
function loadPreviewArticlesList() {
    const previewSelect = document.getElementById('previewArticleSelect');
    if (!previewSelect) return;
    
    // 清空选择器
    previewSelect.innerHTML = '<option value="">选择要预览的文章</option>';
    
    try {
        // 获取文章列表
        let articles = [];
        
        if (window.articleGenerator) {
            articles = window.articleGenerator.getAllArticles();
        } else {
            // 降级处理：从localStorage获取
            const storedArticles = localStorage.getItem('blogArticles');
            articles = storedArticles ? JSON.parse(storedArticles) : [];
        }
        
        if (articles.length === 0) {
            previewSelect.innerHTML += '<option disabled>暂无保存的文章</option>';
            return;
        }
        
        // 按日期降序排序
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 添加文章选项
        articles.forEach(article => {
            const option = document.createElement('option');
            option.value = article.id || '';
            option.textContent = `${article.title || '未命名文章'} (${article.date || '无日期'})`;
            previewSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载预览文章列表失败:', error);
    }
}

/**
 * 显示文章预览
 * @param {object} article - 文章对象
 */
function showArticlePreview(article) {
    const previewContainer = document.getElementById('previewDisplay');
    if (!previewContainer || !article) return;
    
    // 构建预览HTML
    const previewHTML = `
        <div class="preview-header">
            <h2>${article.title || '未命名文章'}</h2>
            <div class="preview-meta">
                <span>作者: ${article.author || '未知'}</span>
                <span>日期: ${formatDate(article.date) || '未知'}</span>
                <span>分类: ${article.category || '未分类'}</span>
            </div>
            ${article.tags && article.tags.length > 0 ? 
                `<div class="preview-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                </div>` : ''
            }
        </div>
        <div class="preview-content">
            ${article.excerpt ? `<div class="preview-excerpt"><h3>摘要</h3><p>${article.excerpt}</p></div>` : ''}
            <div class="preview-body">${article.content || '<p>文章内容为空</p>'}</div>
        </div>
    `;
    
    previewContainer.innerHTML = previewHTML;
}

/**
 * 根据ID显示文章预览
 * @param {string} articleId - 文章ID
 */
function showArticlePreviewById(articleId) {
    try {
        let article = null;
        
        if (window.articleGenerator) {
            // 使用文章生成器获取文章
            article = window.articleGenerator.getArticleById(articleId);
        } else {
            // 降级处理：从localStorage获取
            const articles = localStorage.getItem('blogArticles');
            if (articles) {
                const articleList = JSON.parse(articles);
                article = articleList.find(a => a.id === articleId);
            }
        }
        
        if (article) {
            showArticlePreview(article);
        } else {
            document.getElementById('previewDisplay').innerHTML = '<p class="error-message">未找到指定文章</p>';
        }
    } catch (error) {
        console.error('获取文章预览失败:', error);
        document.getElementById('previewDisplay').innerHTML = '<p class="error-message">加载文章失败</p>';
    }
}

/**
 * 格式化日期显示
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateStr;
    }
}

/**
 * 导出功能，用于其他JavaScript文件调用
 */
window.articleManager = {
    addTag,
    removeTag,
    formatText,
    updatePreview,
    saveArticle,
    loadArticlesList,
    showArticlePreview
};
/* ===================================================
   博客主脚本文件
   功能：提供博客的交互功能和动态效果
   =================================================== */

/**
 * 页面加载完成后执行初始化操作
 * 所有DOM操作和事件监听器都在这里绑定
 */
window.addEventListener('DOMContentLoaded', function() {
    // 导航相关初始化
    highlightNavigation();
    initSmoothScroll();
    
    // 用户交互功能初始化
    initSearch();
    enhancePostCards();
    enhanceTagCloud();
    
    // 页面效果初始化
    initScrollEffects();
    initBackToTop();
    initEntryAnimations();
});

/**
 * 初始化页面滚动效果
 * 功能：当用户滚动页面经过页头时，为导航栏添加滚动样式
 * @returns {void}
 */
function initScrollEffects() {
    // 获取导航栏和页头元素
    const navbar = document.querySelector('.navbar');
    const header = document.querySelector('.header');
    
    // 确保元素存在
    if (navbar && header) {
        // 获取页头的高度，作为导航栏样式变化的触发点
        const headerHeight = header.offsetHeight;
        
        // 添加滚动事件监听器
        window.addEventListener('scroll', function() {
            // 当滚动距离超过页头高度时，添加滚动样式类
            if (window.scrollY > headerHeight) {
                navbar.classList.add('navbar-scrolled');
            } else {
                // 否则移除滚动样式类
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }
}

/**
 * 初始化返回顶部按钮功能
 * 功能：创建固定在右下角的返回顶部按钮，根据滚动位置显示/隐藏
 * @returns {void}
 */
function initBackToTop() {
    // 创建返回顶部按钮元素
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.textContent = '↑';
    
    // 设置按钮的初始样式
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: #667eea;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
    `;
    
    // 添加到页面中
    document.body.appendChild(backToTopBtn);
    
    // 添加滚动事件监听器 - 控制按钮的显示和隐藏
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) { // 当滚动距离超过300px时显示
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else { // 否则隐藏
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });
    
    // 添加点击事件监听器 - 平滑滚动到页面顶部
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // 使用平滑滚动
        });
    });
    
    // 添加悬停效果 - 增强用户交互体验
    backToTopBtn.addEventListener('mouseenter', function() {
        backToTopBtn.style.transform = 'scale(1.1)'; // 放大效果
        backToTopBtn.style.backgroundColor = '#764ba2'; // 颜色变化
    });
    
    backToTopBtn.addEventListener('mouseleave', function() {
        backToTopBtn.style.transform = 'scale(1)'; // 恢复原始大小
        backToTopBtn.style.backgroundColor = '#667eea'; // 恢复原始颜色
    });
}

/**
 * 初始化元素进入动画
 * 功能：当文章卡片和侧边栏小部件进入视口时，应用淡入和上移动画效果
 * @returns {void}
 */
function initEntryAnimations() {
    // 获取所有文章卡片和侧边栏小部件
    const posts = document.querySelectorAll('.post');
    const widgets = document.querySelectorAll('.widget');
    
    // 初始设置 - 隐藏元素并设置初始位置
    posts.forEach(post => {
        post.style.opacity = '0'; // 完全透明
        post.style.transform = 'translateY(20px)'; // 下移20px
        post.style.transition = 'opacity 0.6s ease, transform 0.6s ease'; // 过渡动画
    });
    
    widgets.forEach(widget => {
        widget.style.opacity = '0'; // 完全透明
        widget.style.transform = 'translateY(20px)'; // 下移20px
        widget.style.transition = 'opacity 0.6s ease, transform 0.6s ease'; // 过渡动画
    });
    
    /**
     * 检查元素是否在视口中
     * @param {HTMLElement} element - 要检查的DOM元素
     * @returns {boolean} - 如果元素在视口中返回true，否则返回false
     */
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        // 当元素顶部进入视口底部80%的区域，或者元素底部在视口顶部以上时
        return (
            rect.top <= window.innerHeight * 0.8 &&
            rect.bottom >= 0
        );
    }
    
    /**
     * 显示所有在视口中的元素
     * 为在视口中的元素应用淡入和上移动画
     */
    function showVisibleElements() {
        // 处理文章卡片
        posts.forEach(post => {
            if (isInViewport(post)) {
                post.style.opacity = '1'; // 完全可见
                post.style.transform = 'translateY(0)'; // 回到原始位置
            }
        });
        
        // 处理侧边栏小部件
        widgets.forEach(widget => {
            if (isInViewport(widget)) {
                widget.style.opacity = '1'; // 完全可见
                widget.style.transform = 'translateY(0)'; // 回到原始位置
            }
        });
    }
    
    // 初始触发一次 - 给页面加载一些时间
    setTimeout(showVisibleElements, 100);
    
    // 滚动时持续检查并触发动画
    window.addEventListener('scroll', showVisibleElements);
}

/**
 * 初始化导航菜单高亮功能
 * 功能：根据当前页面URL高亮显示对应的导航链接
 * @returns {void}
 */
function highlightNavigation() {
    // 获取当前页面的路径
    const currentPath = window.location.pathname;
    // 获取所有导航链接
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // 遍历所有导航链接，检查是否匹配当前路径
    navLinks.forEach(link => {
        // 获取链接的路径部分
        const linkPath = new URL(link.href).pathname;
        
        // 匹配逻辑：完全匹配或者首页特殊处理
        if (currentPath === linkPath || (currentPath === '/' && linkPath.includes('index.html'))) {
            // 如果匹配，添加active类以高亮显示
            link.classList.add('active');
        }
    });
}

/**
 * 初始化平滑滚动功能
 * 功能：为所有锚点链接添加平滑滚动效果
 * @returns {void}
 */
function initSmoothScroll() {
    // 选择所有以#开头的锚点链接
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // 添加点击事件监听器
        anchor.addEventListener('click', function(e) {
            // 阻止默认的跳转行为
            e.preventDefault();
            
            // 获取目标元素的ID
            const targetId = this.getAttribute('href');
            
            // 如果是单纯的#，不执行任何操作
            if (targetId === '#') return;
            
            // 查找目标元素
            const targetElement = document.querySelector(targetId);
            
            // 如果目标元素存在
            if (targetElement) {
                // 平滑滚动到目标元素，考虑导航栏高度进行偏移
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 减去导航栏高度以避免被遮挡
                    behavior: 'smooth' // 使用平滑滚动
                });
            }
        });
    });
}

/**
 * 初始化搜索功能
 * 功能：实现本地文章搜索功能，可通过标题、内容和标签进行搜索
 * @returns {void}
 */
function initSearch() {
    // 获取搜索输入框和搜索按钮
    const searchInput = document.querySelector('.search-input') || document.getElementById('search-input');
    const searchButton = document.querySelector('.search-button') || document.getElementById('search-btn');
    
    /**
     * 执行搜索操作
     * 搜索文章标题、内容和标签中的关键词
     */
    function searchArticles() {
        // 获取并处理搜索关键词
        const keyword = searchInput.value.trim().toLowerCase();
        
        if (keyword) { // 确保有关键词
            // 在实际应用中，这里会发送请求到服务器进行搜索
            // 这里我们模拟本地搜索功能
            const articles = document.querySelectorAll('.post');
            let hasResults = false; // 标记是否有搜索结果
            
            // 遍历所有文章进行搜索
            articles.forEach(article => {
                // 获取文章的标题、内容和标签（使用可选链操作符避免空引用）
                const title = article.querySelector('.post-title')?.textContent.toLowerCase() || '';
                const content = article.querySelector('.post-content')?.textContent.toLowerCase() || '';
                const tags = article.querySelector('.post-tags')?.textContent.toLowerCase() || '';
                
                // 检查是否匹配关键词
                if (title.includes(keyword) || content.includes(keyword) || tags.includes(keyword)) {
                    article.style.display = 'block'; // 显示匹配的文章
                    hasResults = true; // 设置有结果标记
                } else {
                    article.style.display = 'none'; // 隐藏不匹配的文章
                }
            });
            
            // 显示或更新搜索结果提示信息
            const searchMessage = document.getElementById('search-message');
            
            if (!searchMessage) {
                // 如果不存在消息元素，创建一个新的
                const message = document.createElement('div');
                message.id = 'search-message';
                message.className = 'search-message';
                // 设置消息样式
                message.style.marginBottom = '20px';
                message.style.padding = '10px';
                message.style.borderRadius = '4px';
                message.style.textAlign = 'center';
                
                // 根据搜索结果设置不同的样式和内容
                if (hasResults) {
                    message.style.backgroundColor = '#e8f5e9';
                    message.style.color = '#2e7d32';
                    message.textContent = `搜索结果: 找到包含 "${keyword}" 的文章`;
                } else {
                    message.style.backgroundColor = '#ffebee';
                    message.style.color = '#c62828';
                    message.textContent = `未找到包含 "${keyword}" 的文章，请尝试其他关键词`;
                }
                
                // 添加到页面
                const mainContent = document.querySelector('.main-content');
                if (mainContent && mainContent.firstChild) {
                    mainContent.insertBefore(message, mainContent.firstChild);
                }
            } else {
                // 更新现有的消息元素
                if (hasResults) {
                    searchMessage.style.backgroundColor = '#e8f5e9';
                    searchMessage.style.color = '#2e7d32';
                    searchMessage.textContent = `搜索结果: 找到包含 "${keyword}" 的文章`;
                } else {
                    searchMessage.style.backgroundColor = '#ffebee';
                    searchMessage.style.color = '#c62828';
                    searchMessage.textContent = `未找到包含 "${keyword}" 的文章，请尝试其他关键词`;
                }
            }
        }
    }
    
    // 确保搜索元素存在
    if (searchInput && searchButton) {
        // 添加点击事件监听器
        searchButton.addEventListener('click', searchArticles);
        
        // 添加回车键搜索功能
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchArticles();
            }
        });
        
        // 重置搜索功能 - 当输入框获得焦点时
        searchInput.addEventListener('focus', function() {
            // 移除之前的搜索消息
            const searchMessage = document.getElementById('search-message');
            if (searchMessage) {
                searchMessage.remove();
            }
            
            // 重置所有文章的显示
            const articles = document.querySelectorAll('.post');
            articles.forEach(article => {
                article.style.display = 'block';
            });
        });
    }
}

/**
 * 增强文章卡片交互
 * 功能：为文章卡片添加鼠标悬停动画效果
 * @returns {void}
 */
function enhancePostCards() {
    // 获取所有文章卡片
    const posts = document.querySelectorAll('.post');
    
    // 为每个文章卡片添加交互效果
    posts.forEach(post => {
        // 添加鼠标悬停效果
        post.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)'; // 上移效果
            this.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)'; // 增强阴影
        });
        
        // 添加鼠标离开效果
        post.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)'; // 恢复原始位置
            this.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)'; // 恢复原始阴影
        });
    });
}

/**
 * 增强标签云交互
 * 功能：点击标签时自动将标签内容填入搜索框并执行搜索
 * @returns {void}
 */
function enhanceTagCloud() {
    // 获取所有标签链接
    const tags = document.querySelectorAll('.tag-cloud a');
    // 获取搜索输入框
    const searchInput = document.querySelector('.search-input') || document.getElementById('search-input');
    
    // 为每个标签添加点击事件
    tags.forEach(tag => {
        tag.addEventListener('click', function(e) {
            // 阻止默认的链接跳转行为
            e.preventDefault();
            
            // 获取标签文本内容
            const tagName = this.textContent.trim();
            
            if (searchInput) {
                // 如果存在搜索框，将标签内容填入搜索框
                searchInput.value = tagName;
                // 触发搜索
                const searchButton = document.querySelector('.search-button') || document.getElementById('search-btn');
                if (searchButton) {
                    searchButton.click();
                }
            } else {
                // 如果没有搜索框，显示提示信息
                alert(`标签筛选: 查看包含 "${tagName}" 的文章`);
            }
        });
    });
}

/**
 * 动态加载更多文章
 * 功能：通过AJAX从服务器加载更多文章（预留功能）
 * @returns {void}
 */
function loadMorePosts() {
    // 这里可以添加AJAX加载更多文章的逻辑
    // 例如：发送请求到服务器，获取更多文章数据，然后添加到页面中
    alert('加载更多文章功能');
}

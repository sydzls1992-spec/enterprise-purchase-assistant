// 前台控制器 - Frontend Controller
// 负责用户界面交互、数据展示和用户体验

class FrontendController {
    constructor() {
        this.apiClient = null;
        this.currentSection = 0;
        this.isScrolling = false;
        this.refreshInterval = null;
        this.touchStartY = 0;
        this.trendChart = null; // 主趋势图实例
        this.xhsTrendChart = null; // 小红书趋势图实例
        this.xhsBrandChart = null; // 小红书品牌分布图实例
        this.isInitialized = false;
        
        // 确保 Chart.js 库已导入，并且 MiddlewareAPI 类已在外部定义
        if (typeof MiddlewareAPI === 'undefined') {
            console.error('MiddlewareAPI is not defined. Please ensure the API client class is loaded.');
            return;
        }
        
        this.init();
    }

    async init() {
        try {
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve, { once: true });
                });
            }

            this.apiClient = new MiddlewareAPI();
            
            await Promise.all([
                this.setupEventListeners(),
                this.setupNavigation(),
                this.initCharts() // 先初始化图表容器
            ]);
            
            // 数据加载放在最后，依赖于图表初始化
            await this.loadInitialData(); 
            
            this.startAutoRefresh();
            this.isInitialized = true;
            console.log('FrontendController 初始化完成');
        } catch (error) {
            console.error('FrontendController 初始化失败:', error);
            this.showMessage('系统初始化失败，请刷新页面重试', 'error');
        }
    }

    // 设置事件监听器
    async setupEventListeners() {
        try {
            // 防抖函数
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            // 刷新按钮
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', debounce(() => {
                    this.refreshAllData();
                }, 300));
            }

            // 导出按钮
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', debounce(() => {
                    this.exportReport();
                }, 300));
            }

            // 工作流步骤点击
            document.querySelectorAll('.workflow-step').forEach(step => {
                step.addEventListener('click', (e) => {
                    this.showWorkflowDetail(e.currentTarget);
                });
            });

            // 键盘导航
            document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
            
            // 滚轮事件 - 添加节流
            let wheelTimeout;
            document.addEventListener('wheel', (e) => {
                if (!wheelTimeout) {
                    wheelTimeout = setTimeout(() => {
                        this.handleWheelNavigation(e);
                        wheelTimeout = null;
                    }, 50);
                }
            }, { passive: false });
            
            // 触摸事件
            document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
            document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

            console.log('事件监听器设置完成');
        } catch (error) {
            console.error('设置事件监听器失败:', error);
        }
    }

    // 设置导航功能
    async setupNavigation() {
        try {
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link');
            const navDots = document.querySelectorAll('.nav-dot');

            // 检查元素是否存在
            if (sections.length === 0) {
                console.warn('未找到任何section元素');
                return;
            }

            // 导航链接点击
            navLinks.forEach((link) => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href')?.slice(1);
                    if (targetId) {
                        this.scrollToSection(targetId);
                    }
                });
            });

            // 导航点点击
            navDots.forEach((dot) => {
                dot.addEventListener('click', () => {
                    const targetId = dot.getAttribute('data-section');
                    if (targetId) {
                        this.scrollToSection(targetId);
                    }
                });
            });

            // 滚动监听 - 添加节流
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                if (!this.isScrolling && !scrollTimeout) {
                    scrollTimeout = setTimeout(() => {
                        this.updateActiveSection();
                        scrollTimeout = null;
                    }, 100);
                }
            }, { passive: true });

            console.log('导航功能设置完成');
        } catch (error) {
            console.error('设置导航功能失败:', error);
        }
    }

    // 滚动到指定section
    scrollToSection(targetId) {
        if (!targetId || this.isScrolling) return;
        
        try {
            const targetSection = document.getElementById(targetId);
            if (!targetSection) {
                console.warn(`未找到目标section: ${targetId}`);
                return;
            }

            this.isScrolling = true;
            
            // 使用更平滑的滚动效果
            targetSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
            
            // 更新URL但不触发页面跳转
            if (history.pushState) {
                history.pushState(null, null, `#${targetId}`);
            }
            
            // 设置滚动状态重置的更长时间
            setTimeout(() => {
                this.isScrolling = false;
            }, 1500);
        } catch (error) {
            console.error('滚动到section失败:', error);
            this.isScrolling = false;
        }
    }

    // 更新当前激活的section
    updateActiveSection() {
        try {
            const sections = document.querySelectorAll('section[id]');
            if (sections.length === 0) return;

            const scrollPosition = window.scrollY;
            
            // 更精确的计算当前section
            let currentIndex = 0;
            let minDistance = Infinity;
            
            sections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                const distance = Math.abs(rect.top);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    currentIndex = index;
                }
            });

            // 确保索引在有效范围内
            if (currentIndex >= 0 && currentIndex < sections.length && 
                currentIndex !== this.currentSection) {
                this.currentSection = currentIndex;
                this.updateNavigationUI(currentIndex);
            }
        } catch (error) {
            console.error('更新激活section失败:', error);
        }
    }

    // 更新导航UI
    updateNavigationUI(index) {
        try {
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link');
            const navDots = document.querySelectorAll('.nav-dot');

            if (!sections[index]) {
                console.warn(`无效的section索引: ${index}`);
                return;
            }

            const currentSectionId = sections[index].getAttribute('id');

            // 更新导航链接
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    link.classList.remove('active', 'bg-neutral-100', 'border-l-4', 'border-primary');
                    if (href === `#${currentSectionId}`) {
                        link.classList.add('active', 'bg-neutral-100', 'border-l-4', 'border-primary');
                    }
                }
            });

            // 更新导航点
            navDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });

            // 更新页面标题
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                const sectionNames = {
                    'dashboard-section': '数据概览',
                    'data-collection-section': '数据采集与处理',
                    'information-management-section': '信息管理工作台',
                    'content-production-section': '内容生产与发布',
                    'ai-analysis-section': 'AI智能分析',
                    'system-management-section': '系统管理'
                };
                pageTitle.textContent = sectionNames[currentSectionId] || '数据概览';
            }
        } catch (error) {
            console.error('更新导航UI失败:', error);
        }
    }

    // 键盘导航
    handleKeyboardNavigation(e) {
        const sections = document.querySelectorAll('section[id]');
        
        switch(e.key) {
            case 'ArrowDown':
            case 'PageDown':
                e.preventDefault();
                if (this.currentSection < sections.length - 1) {
                    this.scrollToSection(sections[this.currentSection + 1].id);
                }
                break;
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                if (this.currentSection > 0) {
                    this.scrollToSection(sections[this.currentSection - 1].id);
                }
                break;
            case 'Home':
                e.preventDefault();
                this.scrollToSection(sections[0].id);
                break;
            case 'End':
                e.preventDefault();
                this.scrollToSection(sections[sections.length - 1].id);
                break;
        }
    }

    // 滚轮导航
    handleWheelNavigation(e) {
        e.preventDefault();
        
        const sections = document.querySelectorAll('section[id]');
        
        // 使用 setTimeout 确保在滚动状态更新后执行
        setTimeout(() => {
            if (e.deltaY > 0 && this.currentSection < sections.length - 1) {
                this.scrollToSection(sections[this.currentSection + 1].id);
            } else if (e.deltaY < 0 && this.currentSection > 0) {
                this.scrollToSection(sections[this.currentSection - 1].id);
            }
        }, 50);
    }

    // 触摸开始
    handleTouchStart(e) {
        this.touchStartY = e.touches[0].clientY;
    }

    // 触摸结束
    handleTouchEnd(e) {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = this.touchStartY - touchEndY;
        
        if (Math.abs(diff) > 50) {
            const sections = document.querySelectorAll('section[id]');
            if (diff > 0 && this.currentSection < sections.length - 1) {
                this.scrollToSection(sections[this.currentSection + 1].id);
            } else if (diff < 0 && this.currentSection > 0) {
                this.scrollToSection(sections[this.currentSection - 1].id);
            }
        }
    }

    // 加载初始数据
    async loadInitialData() {
        const maxRetries = 3;
        let retryCount = 0;

        const tryLoadData = async () => {
            try {
                // 显示加载状态
                this.showLoading('正在加载数据...');
                
                // 并行加载仪表板数据和小红书数据
                const [dashboardData, xiaohongshuData] = await Promise.all([
                    this.apiClient.getDashboardData().catch(error => {
                        console.warn('仪表板数据加载失败:', error);
                        return null;
                    }),
                    this.apiClient.getXiaohongshuData().catch(error => {
                        console.warn('小红书数据加载失败:', error);
                        return null;
                    })
                ]);

                // 更新仪表板数据
                if (dashboardData) {
                    this.updateDashboard(dashboardData);
                } else {
                    // 使用默认数据
                    this.updateDashboard(this.getDefaultDashboardData());
                }
                
                // 更新小红书数据
                if (xiaohongshuData) {
                    this.updateXiaohongshuSection(xiaohongshuData);
                } else {
                    // 使用默认数据
                    this.updateXiaohongshuSection(this.getDefaultXiaohongshuData());
                }

                console.log('初始数据加载完成');
            } catch (error) {
                console.error('加载初始数据失败:', error);
                retryCount++;
                
                if (retryCount < maxRetries) {
                    console.log(`重试加载数据 (${retryCount}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    return tryLoadData();
                } else {
                    this.showError('加载数据失败，请刷新页面重试');
                }
            } finally {
                this.hideLoading();
            }
        };

        return tryLoadData();
    }

    // 启动自动刷新
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        // 每 60 秒刷新一次数据
        this.refreshInterval = setInterval(() => {
            console.log('自动刷新数据...');
            this.refreshAllData(false); // 传入 false 表示静默刷新
        }, 60000);
    }

    // 停止自动刷新
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // 获取默认仪表板数据
    getDefaultDashboardData() {
        return {
            totalData: 1284,
            processedData: 867,
            pendingData: 342,
            publishedData: 525,
            activePlatforms: '小红书、微博',
            avgProcessTime: '2.5',
            accuracyRate: '95.8',
            chartData: {
                trend: [65, 78, 90, 81, 95, 88, 92]
            }
        };
    }

    // 获取默认小红书数据
    getDefaultXiaohongshuData() {
        return {
            total: 156,
            discountItems: 23,
            highCredibility: 89,
            recentItems: 12,
            items: [
                // 示例数据，以防 API 失败
                {
                    credibility: 90,
                    author: { avatar: 'path/to/avatar1.jpg', name: '用户A' },
                    publishTime: Date.now(),
                    title: '默认标题1',
                    content: '默认内容描述...',
                    stats: { likes: 10, comments: 2, shares: 1, collects: 5 },
                    discountInfo: { value: '9折' },
                    brandInfo: { name: 'BrandX' }
                }
            ]
        };
    }

    // 更新小红书数据展示
    updateXiaohongshuSection(data) {
        // 更新小红书数据统计卡片
        this.updateXiaohongshuStats(data);
        
        // 更新小红书数据列表
        this.updateXiaohongshuList(data.items || []);
        
        // 更新小红书图表
        this.updateXiaohongshuCharts(data);
    }

    // 更新小红书统计数据
    updateXiaohongshuStats(data) {
        const elements = {
            'xhs-total': data.total || 0,
            'xhs-discount': data.discountItems || 0,
            'xhs-credibility': data.highCredibility || 0,
            'xhs-recent': data.recentItems || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        });
    }

    // 更新小红书数据列表
    updateXiaohongshuList(items) {
        const listContainer = document.getElementById('xiaohongshu-list');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = this.createXiaohongshuItem(item);
            listContainer.appendChild(itemElement);
        });
    }

    // 创建小红书数据项
    createXiaohongshuItem(item) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow-card p-4 mb-4 card-hover';
        
        const credibilityColor = item.credibility >= 80 ? 'success' : 
                               item.credibility >= 60 ? 'warning' : 'danger';
        
        // 确保数据结构完整
        const author = item.author || {};
        const stats = item.stats || {};
        const images = item.images || [];

        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <img src="${author.avatar || 'default/avatar.jpg'}" alt="${author.name || '未知用户'}" 
                             class="w-8 h-8 rounded-full mr-2">
                        <div>
                            <h4 class="font-medium text-neutral-800">${author.name || '未知用户'}</h4>
                            <p class="text-xs text-neutral-500">${new Date(item.publishTime).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <h3 class="font-medium text-neutral-900 mb-2">${item.title || '无标题'}</h3>
                    <p class="text-sm text-neutral-600 mb-3">${(item.content || '无内容').substring(0, 100)}...</p>
                    <div class="flex items-center space-x-4 text-xs text-neutral-500">
                        <span><i class="fa fa-heart"></i> ${stats.likes || 0}</span>
                        <span><i class="fa fa-comment"></i> ${stats.comments || 0}</span>
                        <span><i class="fa fa-share"></i> ${stats.shares || 0}</span>
                        <span><i class="fa fa-star"></i> ${stats.collects || 0}</span>
                    </div>
                    ${item.discountInfo ? `
                        <div class="mt-2 inline-flex items-center px-2 py-1 bg-success bg-opacity-10 text-success text-xs rounded">
                            <i class="fa fa-tag mr-1"></i>
                            ${item.discountInfo.value}
                        </div>
                    ` : ''}
                    ${item.brandInfo ? `
                        <div class="mt-2 inline-flex items-center px-2 py-1 bg-primary bg-opacity-10 text-primary text-xs rounded ml-2">
                            <i class="fa fa-copyright mr-1"></i>
                            ${item.brandInfo.name}
                        </div>
                    ` : ''}
                </div>
                <div class="ml-4 text-right">
                    <div class="text-xs text-neutral-500 mb-1">可信度</div>
                    <div class="text-lg font-bold text-${credibilityColor}">${item.credibility || 0}%</div>
                    <div class="mt-2">
                        <button class="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200">
                            审核
                        </button>
                    </div>
                </div>
            </div>
            ${images.length > 0 ? `
                <div class="mt-3 grid grid-cols-3 gap-2">
                    ${images.slice(0, 3).map(img => `
                        <img src="${img}" alt="商品图片" class="w-full h-20 object-cover rounded">
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        return div;
    }

    // 更新小红书图表
    updateXiaohongshuCharts(data) {
        // 更新采集趋势图表 (假设其结构已在 initCharts 中创建)
        this.updateXiaohongshuTrendChart(); 
        
        // 更新品牌分布图表
        this.updateXiaohongshuBrandChart(data);
    }

    // 更新小红书采集趋势图表
    updateXiaohongshuTrendChart() {
        const ctx = document.getElementById('xiaohongshu-trend-chart');
        if (!ctx) return;
        
        const chartData = {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
            datasets: [{
                label: '采集数量',
                data: [45, 52, 48, 65, 58, 72, 68],
                borderColor: '#FF2442',
                backgroundColor: 'rgba(255, 36, 66, 0.1)',
                tension: 0.4
            }]
        };

        if (this.xhsTrendChart) {
            this.xhsTrendChart.data = chartData;
            this.xhsTrendChart.update();
        } else {
            this.xhsTrendChart = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    // 更新小红书品牌分布图表
    updateXiaohongshuBrandChart(data) {
        const ctx = document.getElementById('xiaohongshu-brand-chart');
        if (!ctx) return;
        
        const brandCounts = {};
        (data.items || []).forEach(item => {
            if (item.brandInfo) {
                const brand = item.brandInfo.name;
                brandCounts[brand] = (brandCounts[brand] || 0) + 1;
            }
        });

        const chartData = {
            labels: Object.keys(brandCounts),
            datasets: [{
                data: Object.values(brandCounts),
                backgroundColor: [
                    '#FF2442', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'
                ]
            }]
        };

        if (this.xhsBrandChart) {
            this.xhsBrandChart.data = chartData;
            this.xhsBrandChart.update();
        } else {
            this.xhsBrandChart = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    // 手动触发小红书数据采集
    async triggerXiaohongshuCollection() {
        try {
            this.showLoading('正在采集小红书数据...');
            
            const result = await this.apiClient.triggerXiaohongshuCollection();
            
            if (result.success) {
                this.showSuccess(result.message);
                // 重新加载数据
                setTimeout(() => {
                    this.loadInitialData();
                }, 2000);
            } else {
                this.showError(result.message || '采集失败');
            }
        } catch (error) {
            console.error('触发采集失败:', error);
            this.showError('触发采集失败，请稍后重试');
        } finally {
            this.hideLoading();
        }
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        const loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex items-center">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(loading);
    }

    // 隐藏加载状态
    hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    // 显示成功消息
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // 显示错误消息
    showError(message) {
        this.showMessage(message, 'error');
    }

    // 显示消息
    showMessage(message, type = 'info', duration = 3000) {
        try {
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500',
                warning: 'bg-yellow-500'
            };

            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                info: 'fa-info-circle',
                warning: 'fa-exclamation-triangle'
            };
            
            // 创建消息容器
            const messageDiv = document.createElement('div');
            messageDiv.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-xl z-50 transform transition-all duration-300 max-w-md`;
            messageDiv.style.transform = 'translateX(400px)';
            messageDiv.style.opacity = '0';
            
            // 添加图标和内容
            messageDiv.innerHTML = `
                <div class="flex items-center">
                    <i class="fa ${icons[type]} mr-3 text-xl"></i>
                    <div class="flex-1">
                        <p class="font-medium">${message}</p>
                        <p class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString()}</p>
                    </div>
                    <button class="ml-4 hover:opacity-75 transition-opacity" onclick="this.parentElement.parentElement.remove()">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(messageDiv);
            
            // 动画显示
            requestAnimationFrame(() => {
                messageDiv.style.transform = 'translateX(0)';
                messageDiv.style.opacity = '1';
            });
            
            // 自动隐藏
            const hideMessage = () => {
                messageDiv.style.transform = 'translateX(400px)';
                messageDiv.style.opacity = '0';
                setTimeout(() => {
                    if (messageDiv.parentElement) {
                        messageDiv.remove();
                    }
                }, 300);
            };
            
            const timeoutId = setTimeout(hideMessage, duration);
            
            // 鼠标悬停暂停自动隐藏
            messageDiv.addEventListener('mouseenter', () => {
                clearTimeout(timeoutId);
            });
            
            messageDiv.addEventListener('mouseleave', () => {
                setTimeout(hideMessage, 1000);
            });
            
        } catch (error) {
            console.error('显示消息失败:', error);
            // 降级处理：使用原生alert
            alert(message);
        }
    }

    // 更新仪表板数据
    updateDashboard(data) {
        try {
            if (!data || typeof data !== 'object') {
                console.warn('无效的仪表板数据:', data);
                data = this.getDefaultDashboardData();
            }

            // 安全更新统计数据
            const updateElement = (id, value, formatter = null) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = formatter ? formatter(value) : value;
                } else {
                    console.warn(`未找到元素: ${id}`);
                }
            };

            // 更新统计数据
            updateElement('totalData', data.totalData || 0, val => val.toLocaleString());
            updateElement('processedData', data.processedData || 0, val => val.toLocaleString());
            updateElement('pendingData', data.pendingData || 0, val => val.toLocaleString());
            updateElement('publishedData', data.publishedData || 0, val => val.toLocaleString());

            // 更新系统状态
            updateElement('activePlatforms', data.activePlatforms || '小红书、微博');
            updateElement('avgProcessTime', data.avgProcessTime || '2.5');
            updateElement('accuracyRate', data.accuracyRate || '95.8');

            // 更新图表
            this.updateCharts(data.chartData);

            console.log('仪表板数据更新完成');
        } catch (error) {
            console.error('更新仪表板数据失败:', error);
        }
    }

    // 刷新所有数据
    async refreshAllData(showNotification = true) {
        const refreshBtn = document.getElementById('refreshBtn');
        const isManualRefresh = refreshBtn && refreshBtn.textContent.includes('刷新'); // 假设按钮包含"刷新"字样

        // 仅在手动刷新时显示加载和更新按钮状态
        if (showNotification || isManualRefresh) {
            if (!refreshBtn) {
                console.warn('未找到刷新按钮');
            } else {
                var originalText = refreshBtn.textContent;
                var originalIcon = refreshBtn.querySelector('i')?.className;
                
                // 更新按钮状态
                refreshBtn.textContent = '刷新中...';
                refreshBtn.disabled = true;
                const icon = refreshBtn.querySelector('i');
                if (icon) {
                    icon.className = 'fa fa-spinner fa-spin mr-1';
                }
            }
            this.showLoading('正在刷新数据...');
        }
        
        try {
            // 并行刷新数据
            const [dashboardData, xiaohongshuData] = await Promise.all([
                this.apiClient.refreshData().catch(error => {
                    console.error('刷新仪表板数据失败:', error);
                    return null;
                }),
                this.apiClient.getXiaohongshuData().catch(error => {
                    console.error('刷新小红书数据失败:', error);
                    return null;
                })
            ]);

            // 更新数据
            if (dashboardData) {
                this.updateDashboard(dashboardData);
            }
            
            if (xiaohongshuData) {
                this.updateXiaohongshuSection(xiaohongshuData);
            }
            
            if (showNotification || isManualRefresh) {
                this.showSuccess('数据刷新成功');
                
                // 添加刷新动画效果
                if (refreshBtn) {
                    refreshBtn.classList.add('animate-pulse');
                    setTimeout(() => {
                        refreshBtn.classList.remove('animate-pulse');
                    }, 1000);
                }
            }
            
        } catch (error) {
            console.error('刷新数据失败:', error);
            if (showNotification || isManualRefresh) {
                this.showError('刷新数据失败，请重试');
            }
        } finally {
            // 恢复按钮状态 (仅在手动刷新时)
            if (showNotification || isManualRefresh) {
                if (refreshBtn) {
                    refreshBtn.textContent = originalText;
                    refreshBtn.disabled = false;
                    const icon = refreshBtn.querySelector('i');
                    if (icon && originalIcon) {
                        icon.className = originalIcon;
                    }
                }
                this.hideLoading();
            }
        }
    }

    // 导出报告
    async exportReport() {
        const exportBtn = document.getElementById('exportBtn');
        if (!exportBtn) {
            console.warn('未找到导出按钮');
            return;
        }

        const originalText = exportBtn.textContent;
        const originalIcon = exportBtn.querySelector('i')?.className;
        
        try {
            // 更新按钮状态
            exportBtn.textContent = '导出中...';
            exportBtn.disabled = true;
            const icon = exportBtn.querySelector('i');
            if (icon) {
                icon.className = 'fa fa-spinner fa-spin mr-1';
            }
            
            // 显示加载状态
            this.showLoading('正在生成报告...');
            
            const reportData = await this.apiClient.exportReport();
            
            if (!reportData) {
                throw new Error('报告数据为空');
            }
            
            // 生成文件名
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const filename = `企购内购报告_${timestamp}.json`;
            
            // 创建下载链接
            const blob = new Blob([reportData], { type: 'application/json;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccess(`报告导出成功: ${filename}`);
            
            // 添加导出成功动画
            exportBtn.classList.add('animate-bounce');
            setTimeout(() => {
                exportBtn.classList.remove('animate-bounce');
            }, 1000);
            
        } catch (error) {
            console.error('导出报告失败:', error);
            this.showError('导出报告失败，请重试');
            
            // 如果是网络错误，提供重试选项
            if (error.name === 'NetworkError' || String(error).includes('网络')) {
                setTimeout(() => {
                    // 使用 this.exportReport() 调用自身
                    if (confirm('网络连接异常，是否重试导出？')) {
                        this.exportReport();
                    }
                }, 1000);
            }
        } finally {
            // 恢复按钮状态
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
            const icon = exportBtn.querySelector('i');
            if (icon && originalIcon) {
                icon.className = originalIcon;
            }
            this.hideLoading();
        }
    }

    // 显示工作流详情
    showWorkflowDetail(stepElement) {
        const stepNumber = stepElement.getAttribute('data-step');
        const details = {
            '1': '自动从小红书、微博等平台采集企业内购相关信息，包括价格、优惠、时间等关键字段。',
            '2': '对采集的原始数据进行清洗、去重、格式化处理，提取关键信息。',
            '3': '使用AI算法对数据进行智能分类和可信度评估，按优先级排序。',
            '4': '运营人员对处理后的数据进行人工审核，确认信息准确性和发布价值。',
            '5': '根据预设模板快速编辑内容，一键套用标准格式。',
            '6': '通过API自动将编辑好的内容推送到公众号素材库。',
            '7': '最终发布到公众号，完成整个内容生产流程。'
        };

        const detailDiv = document.getElementById('workflow-detail');
        const descriptionP = document.getElementById('workflow-description');
        
        if (detailDiv && descriptionP) {
            descriptionP.textContent = details[stepNumber] || '暂无详细信息';
            detailDiv.classList.remove('hidden');
        }
    }

    // 初始化图表（仅创建实例，不填充数据）
    initCharts() {
        const ctx = document.getElementById('trendChart');
        if (ctx && typeof Chart !== 'undefined') {
            this.trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: '数据趋势',
                        data: [],
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        // 初始化小红书图表实例，但不填充数据
        this.updateXiaohongshuTrendChart(); 
        this.updateXiaohongshuBrandChart(this.getDefaultXiaohongshuData()); // 使用默认数据初始化结构
    }
    
    // 更新主仪表板图表
    updateCharts(chartData) {
        if (this.trendChart && chartData && chartData.trend) {
            this.trendChart.data.datasets[0].data = chartData.trend;
            // 假设 labels 是固定的，如果不是，需要从数据中获取
            this.trendChart.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; 
            this.trendChart.update();
        }
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendController;
}
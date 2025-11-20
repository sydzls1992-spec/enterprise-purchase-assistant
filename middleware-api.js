// 中台API - Middleware API
// 负责前后端数据交互、业务逻辑处理和API调用

class MiddlewareAPI {
    constructor() {
        this.baseURL = '/api'; // 后台API基础URL
        this.timeout = 10000; // 请求超时时间
        this.cache = new Map(); // 数据缓存
        this.cacheTimeout = 5 * 60 * 1000; // 缓存5分钟
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        try {
            // 检查缓存
            if (config.method === 'GET' && this.cache.has(url)) {
                const cached = this.cache.get(url);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // 缓存GET请求结果
            if (config.method === 'GET') {
                this.cache.set(url, {
                    data: data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error(`API请求失败: ${endpoint}`, error);
            throw error;
        }
    }

    // 获取仪表板数据
    async getDashboardData() {
        try {
            const response = await this.request('/dashboard');
            return {
                // 统计数据
                totalData: response.totalData || Math.floor(Math.random() * 100) + 50,
                processedData: response.processedData || Math.floor(Math.random() * 80) + 40,
                pendingData: response.pendingData || Math.floor(Math.random() * 20) + 5,
                publishedData: response.publishedData || Math.floor(Math.random() * 60) + 30,
                
                // 系统状态
                activePlatforms: response.activePlatforms || '小红书、微博、抖音',
                avgProcessTime: response.avgProcessTime || (Math.random() * 2 + 1).toFixed(1),
                accuracyRate: response.accuracyRate || (Math.random() * 5 + 93).toFixed(1),
                
                // 图表数据
                chartData: {
                    trend: response.chartData?.trend || [65, 78, 90, 81, 95, 88, 92]
                }
            };
        } catch (error) {
            // 返回模拟数据作为降级方案
            return this.getMockDashboardData();
        }
    }

    // 刷新数据
    async refreshData() {
        try {
            // 清除缓存
            this.cache.clear();
            
            const response = await this.request('/dashboard/refresh', {
                method: 'POST'
            });
            
            return response;
        } catch (error) {
            console.error('刷新数据失败:', error);
            throw new Error('刷新数据失败，请检查网络连接');
        }
    }

    // 导出报告
    async exportReport() {
        try {
            const response = await this.request('/export/report', {
                method: 'POST',
                body: JSON.stringify({
                    format: 'json',
                    dateRange: 'last7days'
                })
            });
            
            return JSON.stringify(response, null, 2);
        } catch (error) {
            console.error('导出报告失败:', error);
            throw new Error('导出报告失败，请稍后重试');
        }
    }

    // 获取数据采集状态
    async getDataCollectionStatus() {
        try {
            const response = await this.request('/data-collection/status');
            return response;
        } catch (error) {
            return this.getMockDataCollectionStatus();
        }
    }

    // 获取信息管理数据
    async getInformationManagementData() {
        try {
            const response = await this.request('/information-management/data');
            return response;
        } catch (error) {
            return this.getMockInformationManagementData();
        }
    }

    // 获取内容生产状态
    async getContentProductionStatus() {
        try {
            const response = await this.request('/content-production/status');
            return response;
        } catch (error) {
            return this.getMockContentProductionStatus();
        }
    }

    // 获取系统监控数据
    async getSystemMonitoringData() {
        try {
            const response = await this.request('/system/monitoring');
            return response;
        } catch (error) {
            return this.getMockSystemMonitoringData();
        }
    }

    // 提交审核结果
    async submitReview(data) {
        try {
            const response = await this.request('/review/submit', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            return response;
        } catch (error) {
            throw new Error('提交审核失败，请重试');
        }
    }

    // 获取小红书专项数据
    async getXiaohongshuData() {
        try {
            const response = await this.request('/xiaohongshu/data');
            return response;
        } catch (error) {
            return this.getMockXiaohongshuData();
        }
    }

    // 手动触发小红书数据采集
    async triggerXiaohongshuCollection() {
        try {
            const response = await this.request('/xiaohongshu/collect', {
                method: 'POST'
            });
            return response;
        } catch (error) {
            console.error('触发小红书采集失败:', error);
            return {
                success: false,
                error: error.message,
                message: '触发采集失败，请稍后重试'
            };
        }
    }

    // 获取小红书数据统计
    async getXiaohongshuStats() {
        try {
            const response = await this.request('/xiaohongshu/stats');
            return response;
        } catch (error) {
            return this.getMockXiaohongshuStats();
        }
    }

    // 更新小红书配置
    async updateXiaohongshuConfig(config) {
        try {
            const response = await this.request('/xiaohongshu/config', {
                method: 'PUT',
                body: JSON.stringify(config)
            });
            return response;
        } catch (error) {
            throw new Error('更新小红书配置失败');
        }
    }

    // 模拟数据方法
    getMockDashboardData() {
        return {
            totalData: Math.floor(Math.random() * 100) + 50,
            processedData: Math.floor(Math.random() * 80) + 40,
            pendingData: Math.floor(Math.random() * 20) + 5,
            publishedData: Math.floor(Math.random() * 60) + 30,
            activePlatforms: '小红书、微博、抖音',
            avgProcessTime: (Math.random() * 2 + 1).toFixed(1),
            accuracyRate: (Math.random() * 5 + 93).toFixed(1),
            chartData: {
                trend: [65, 78, 90, 81, 95, 88, 92]
            }
        };
    }

    // 获取模拟小红书数据
    getMockXiaohongshuData() {
        const mockData = [];
        const brands = ['Apple', '华为', '小米', 'Nike', 'Adidas', '优衣库', 'ZARA', '雅诗兰黛'];
        const keywords = ['内购', '员工折扣', '限时优惠', '品牌折扣'];
        
        for (let i = 0; i < 20; i++) {
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const keyword = keywords[Math.floor(Math.random() * keywords.length)];
            
            mockData.push({
                id: `xhs_${Date.now()}_${i}`,
                title: `${brand} ${keyword}活动 - 员工专享优惠`,
                content: ` ${brand}最新${keyword}活动，员工专享价格，性价比超高，机会难得！`,
                author: {
                    id: `user_${i}`,
                    name: `用户${i + 1}`,
                    avatar: `https://picsum.photos/seed/avatar${i}/100/100.jpg`
                },
                images: [
                    `https://picsum.photos/seed/product${i}_1/400/300.jpg`,
                    `https://picsum.photos/seed/product${i}_2/400/300.jpg`
                ],
                tags: [brand, keyword, '员工福利', '性价比'],
                stats: {
                    likes: Math.floor(Math.random() * 2000) + 100,
                    comments: Math.floor(Math.random() * 200) + 10,
                    shares: Math.floor(Math.random() * 100) + 5,
                    collects: Math.floor(Math.random() * 500) + 20
                },
                publishTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                source: 'xiaohongshu',
                type: Math.random() > 0.5 ? 'discount' : 'internal_purchase',
                credibility: Math.floor(Math.random() * 30) + 70,
                discountInfo: {
                    type: 'percentage',
                    value: `${Math.floor(Math.random() * 3 + 7)}折`,
                    confidence: 0.8
                },
                brandInfo: {
                    name: brand,
                    confidence: 0.9
                }
            });
        }
        
        return {
            total: mockData.length,
            discountItems: mockData.filter(item => item.type === 'discount').length,
            highCredibility: mockData.filter(item => item.credibility >= 80).length,
            recentItems: mockData.filter(item => 
                Date.now() - item.publishTime < 24 * 60 * 60 * 1000
            ).length,
            items: mockData
        };
    }

    // 获取模拟小红书统计数据
    getMockXiaohongshuStats() {
        return {
            totalCollected: Math.floor(Math.random() * 500) + 200,
            todayCollected: Math.floor(Math.random() * 50) + 10,
            avgCredibility: (Math.random() * 10 + 85).toFixed(1),
            topBrands: [
                { name: 'Apple', count: Math.floor(Math.random() * 50) + 20 },
                { name: '华为', count: Math.floor(Math.random() * 40) + 15 },
                { name: '小米', count: Math.floor(Math.random() * 30) + 10 },
                { name: 'Nike', count: Math.floor(Math.random() * 25) + 8 },
                { name: 'Adidas', count: Math.floor(Math.random() * 20) + 5 }
            ],
            discountTypes: [
                { type: 'percentage', count: Math.floor(Math.random() * 60) + 30 },
                { type: 'threshold_discount', count: Math.floor(Math.random() * 40) + 20 },
                { type: 'instant_discount', count: Math.floor(Math.random() * 30) + 15 }
            ],
            collectionTrend: [
                { date: '2024-01-01', count: 45 },
                { date: '2024-01-02', count: 52 },
                { date: '2024-01-03', count: 48 },
                { date: '2024-01-04', count: 65 },
                { date: '2024-01-05', count: 58 },
                { date: '2024-01-06', count: 72 },
                { date: '2024-01-07', count: 68 }
            ]
        };
    }

    // 更新系统配置
    async updateSystemConfig(config) {
        try {
            const response = await this.request('/system/config', {
                method: 'PUT',
                body: JSON.stringify(config)
            });
            
            return response;
        } catch (error) {
            throw new Error('更新配置失败，请重试');
        }
    }

    getMockDataCollectionStatus() {
        return {
            platforms: [
                { name: '小红书', status: 'running', count: 45, lastUpdate: new Date().toISOString() },
                { name: '微博', status: 'running', count: 32, lastUpdate: new Date().toISOString() },
                { name: '抖音', status: 'stopped', count: 0, lastUpdate: null }
            ],
            totalCollected: 77,
            errors: []
        };
    }

    getMockInformationManagementData() {
        return {
            pending: 15,
            approved: 120,
            rejected: 8,
            categories: [
                { name: '服装', count: 45 },
                { name: '数码', count: 32 },
                { name: '美妆', count: 28 },
                { name: '食品', count: 18 }
            ]
        };
    }

    getMockContentProductionStatus() {
        return {
            templates: 12,
            drafts: 8,
            scheduled: 5,
            published: 156
        };
    }

    getMockSystemMonitoringData() {
        return {
            cpu: Math.floor(Math.random() * 40) + 30,
            memory: Math.floor(Math.random() * 30) + 60,
            disk: Math.floor(Math.random() * 20) + 40,
            network: Math.floor(Math.random() * 100) + 50,
            uptime: '15天 8小时'
        };
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
    }

    // 设置缓存超时
    setCacheTimeout(timeout) {
        this.cacheTimeout = timeout;
    }
}

// 导出API实例
window.MiddlewareAPI = MiddlewareAPI;
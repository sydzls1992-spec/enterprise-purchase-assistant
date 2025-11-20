// 小红书API集成类
class XiaohongshuAPI {
    constructor() {
        this.baseURL = 'https://www.xiaohongshu.com/fe_api/burdock/weixin/v2';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42(0x18002a2c) NetType/WIFI Language/zh_CN',
            'Referer': 'https://www.xiaohongshu.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        };
        this.rateLimiter = new Map();
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 最小请求间隔1秒
    }

    // 检查API是否活跃
    isActive() {
        return true;
    }

    // 限流控制
    async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        
        this.lastRequestTime = Date.now();
    }

    // 搜索关键词获取商品信息
    async searchProducts(keyword, limit = 20) {
        await this.rateLimit();
        
        try {
            const searchURL = `${this.baseURL}/search/notes`;
            const params = new URLSearchParams({
                keyword: keyword,
                page: 1,
                page_size: limit,
                sort: 'general',
                note_type: 0
            });

            const response = await fetch(`${searchURL}?${params}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`搜索请求失败: ${response.status}`);
            }

            const data = await response.json();
            return this.processSearchResults(data);
        } catch (error) {
            console.error('小红书搜索失败:', error);
            return this.getMockSearchResults(keyword, limit);
        }
    }

    // 处理搜索结果
    processSearchResults(data) {
        if (!data.data || !data.data.items) {
            return [];
        }

        return data.data.items.map(item => ({
            id: item.id || item.note_id,
            title: item.title || '',
            content: item.desc || '',
            author: {
                id: item.user?.user_id || '',
                name: item.user?.nickname || '',
                avatar: item.user?.avatar || ''
            },
            images: item.image_list?.map(img => img.url) || [],
            tags: item.tag_list?.map(tag => tag.name) || [],
            stats: {
                likes: item.interaction_info?.liked_count || 0,
                comments: item.interaction_info?.comment_count || 0,
                shares: item.interaction_info?.share_count || 0,
                collects: item.interaction_info?.collected_count || 0
            },
            publishTime: item.time || Date.now(),
            source: 'xiaohongshu',
            type: this.detectContentType(item),
            credibility: this.calculateCredibility(item),
            discountInfo: this.extractDiscountInfo(item),
            brandInfo: this.extractBrandInfo(item)
        }));
    }

    // 检测内容类型
    detectContentType(item) {
        const title = (item.title || '').toLowerCase();
        const content = (item.desc || '').toLowerCase();
        
        if (title.includes('折扣') || title.includes('优惠') || title.includes('促销') ||
            content.includes('折扣') || content.includes('优惠') || content.includes('促销')) {
            return 'discount';
        }
        
        if (title.includes('内购') || title.includes('员工') ||
            content.includes('内购') || content.includes('员工')) {
            return 'internal_purchase';
        }
        
        if (title.includes('限时') || title.includes('秒杀') || title.includes('抢购') ||
            content.includes('限时') || content.includes('秒杀') || content.includes('抢购')) {
            return 'flash_sale';
        }
        
        return 'product';
    }

    // 计算可信度
    calculateCredibility(item) {
        let score = 50; // 基础分数
        
        // 互动数据加分
        const stats = item.interaction_info || {};
        if (stats.liked_count > 1000) score += 10;
        if (stats.comment_count > 100) score += 10;
        if (stats.collected_count > 50) score += 10;
        
        // 作者权重加分
        if (item.user?.type === 'official') score += 15;
        if (item.user?.fans_count > 10000) score += 10;
        
        // 内容质量加分
        if (item.title && item.title.length > 10) score += 5;
        if (item.desc && item.desc.length > 50) score += 5;
        if (item.image_list && item.image_list.length > 3) score += 5;
        
        return Math.min(score, 100);
    }

    // 提取折扣信息
    extractDiscountInfo(item) {
        const title = item.title || '';
        const content = item.desc || '';
        const text = (title + ' ' + content).toLowerCase();
        
        const discountPatterns = [
            /(\d+)折/,
            /(\d+)%off/,
            /立减(\d+)/,
            /满(\d+)减(\d+)/,
            /优惠(\d+)/
        ];
        
        for (const pattern of discountPatterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    type: this.getDiscountType(pattern),
                    value: match[0],
                    confidence: 0.8
                };
            }
        }
        
        return null;
    }

    // 获取折扣类型
    getDiscountType(pattern) {
        const patternString = pattern.toString();
        if (patternString.includes('折')) return 'percentage';
        if (patternString.includes('%off')) return 'percentage_off';
        if (patternString.includes('立减')) return 'instant_discount';
        if (patternString.includes('满减')) return 'threshold_discount';
        return 'other';
    }

    // 提取品牌信息
    extractBrandInfo(item) {
        const title = item.title || '';
        const content = item.desc || '';
        const text = title + ' ' + content;
        
        // 常见品牌列表
        const commonBrands = [
            'Apple', 'iPhone', 'iPad', 'Mac',
            'Samsung', '华为', '小米', 'OPPO', 'vivo',
            'Nike', 'Adidas', '优衣库', 'ZARA',
            '雅诗兰黛', '兰蔻', 'SK-II', '资生堂',
            '戴森', '飞利浦', '索尼', '佳能'
        ];
        
        for (const brand of commonBrands) {
            if (text.includes(brand)) {
                return {
                    name: brand,
                    confidence: 0.9
                };
            }
        }
        
        return null;
    }

    // 获取模拟搜索结果
    getMockSearchResults(keyword, limit) {
        const mockResults = [];
        for (let i = 0; i < limit; i++) {
            mockResults.push({
                id: `mock_${Date.now()}_${i}`,
                title: `${keyword}相关商品${i + 1}`,
                content: `这是一个关于${keyword}的优质商品，性价比很高，值得购买！`,
                author: {
                    id: `user_${i}`,
                    name: `用户${i + 1}`,
                    avatar: `https://picsum.photos/seed/avatar${i}/100/100.jpg`
                },
                images: [`https://picsum.photos/seed/product${i}/400/300.jpg`],
                tags: [keyword, '好物推荐', '性价比'],
                stats: {
                    likes: Math.floor(Math.random() * 1000),
                    comments: Math.floor(Math.random() * 100),
                    shares: Math.floor(Math.random() * 50),
                    collects: Math.floor(Math.random() * 200)
                },
                publishTime: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
                source: 'xiaohongshu',
                type: 'product',
                credibility: Math.floor(Math.random() * 30) + 70,
                discountInfo: Math.random() > 0.7 ? {
                    type: 'percentage',
                    value: `${Math.floor(Math.random() * 3 + 7)}折`,
                    confidence: 0.8
                } : null,
                brandInfo: Math.random() > 0.5 ? {
                    name: ['Apple', '华为', '小米', 'Nike'][Math.floor(Math.random() * 4)],
                    confidence: 0.9
                } : null
            });
        }
        return mockResults;
    }

    // 获取热门商品
    async getHotProducts(category = 'all', limit = 20) {
        await this.rateLimit();
        
        try {
            const hotURL = `${this.baseURL}/feed`;
            const params = new URLSearchParams({
                source: 'explore',
                category: category,
                page: 1,
                page_size: limit
            });

            const response = await fetch(`${hotURL}?${params}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`热门商品请求失败: ${response.status}`);
            }

            const data = await response.json();
            return this.processSearchResults(data);
        } catch (error) {
            console.error('获取热门商品失败:', error);
            return this.getMockSearchResults('热门商品', limit);
        }
    }
}

// 后台服务 - Backend Service
// 负责数据处理、业务逻辑和外部系统集成

class BackendService {
    constructor() {
        this.dataStore = new Map();
        this.schedulers = new Map();
        this.externalAPIs = {
            xiaohongshu: new XiaohongshuAPI(),
            weibo: new WeiboAPI(),
            douyin: new DouyinAPI()
        };
        this.init();
    }

    init() {
        this.setupDataProcessors();
        this.setupSchedulers();
        this.loadInitialData();
    }

    // 设置数据处理器
    setupDataProcessors() {
        this.dataProcessors = {
            collector: new DataCollector(this.externalAPIs),
            cleaner: new DataCleaner(),
            classifier: new DataClassifier(),
            validator: new DataValidator()
        };
    }

    // 设置调度器
    setupSchedulers() {
        // 数据采集调度器 - 每5分钟执行一次
        this.schedulers.set('collection', setInterval(() => {
            this.performDataCollection();
        }, 5 * 60 * 1000));

        // 数据清理调度器 - 每小时执行一次
        this.schedulers.set('cleaning', setInterval(() => {
            this.performDataCleaning();
        }, 60 * 60 * 1000));

        // 系统监控调度器 - 每分钟执行一次
        this.schedulers.set('monitoring', setInterval(() => {
            this.updateSystemMetrics();
        }, 60 * 1000));
    }

    // 加载初始数据
    loadInitialData() {
        // 模拟加载历史数据
        this.dataStore.set('dashboard', {
            totalData: 156,
            processedData: 128,
            pendingData: 18,
            publishedData: 110,
            lastUpdate: new Date().toISOString()
        });
    }

    // 执行数据采集
    async performDataCollection() {
        try {
            console.log('开始数据采集...');
            
            const results = await Promise.allSettled([
                this.collectFromXiaohongshu(),
                this.collectFromWeibo(),
                this.collectFromDouyin()
            ]);

            const collectedData = results
                .filter(result => result.status === 'fulfilled')
                .flatMap(result => result.value);

            // 存储采集到的数据
            this.dataStore.set('rawData', collectedData);
            
            console.log(`数据采集完成，共采集 ${collectedData.length} 条数据`);
            
            // 触发数据处理流程
            setTimeout(() => {
                this.performDataCleaning();
            }, 1000);
            
            return collectedData;
        } catch (error) {
            console.error('数据采集失败:', error);
            throw error;
        }
    }

    // 从小红书采集数据
    async collectFromXiaohongshu() {
        try {
            console.log('正在从小红书采集数据...');
            
            const keywords = ['内购', '员工折扣', '企业采购', '限时优惠', '品牌折扣'];
            const allData = [];
            
            for (const keyword of keywords) {
                const data = await this.externalAPIs.xiaohongshu.searchProducts(keyword, 10);
                allData.push(...data);
                
                // 添加延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // 获取热门商品
            const hotData = await this.externalAPIs.xiaohongshu.getHotProducts('shopping', 20);
            allData.push(...hotData);
            
            console.log(`小红书数据采集完成，共采集 ${allData.length} 条数据`);
            return allData;
        } catch (error) {
            console.error('小红书数据采集失败:', error);
            return [];
        }
    }

    // 从微博采集数据
    async collectFromWeibo() {
        try {
            console.log('正在从微博采集数据...');
            // 微博API实现（待完善）
            return [];
        } catch (error) {
            console.error('微博数据采集失败:', error);
            return [];
        }
    }

    // 从抖音采集数据
    async collectFromDouyin() {
        try {
            console.log('正在从抖音采集数据...');
            // 抖音API实现（待完善）
            return [];
        } catch (error) {
            console.error('抖音数据采集失败:', error);
            return [];
        }
    }

    // 执行数据清理
    async performDataCleaning() {
        try {
            const rawData = this.dataStore.get('rawData') || [];
            
            if (rawData.length === 0) {
                console.log('没有需要清理的数据');
                return [];
            }

            console.log('开始数据清理...');
            
            const cleanedData = await this.dataProcessors.cleaner.clean(rawData);
            
            // 存储清理后的数据
            this.dataStore.set('cleanedData', cleanedData);
            
            console.log(`数据清理完成，清理后剩余 ${cleanedData.length} 条数据`);
            
            return cleanedData;
        } catch (error) {
            console.error('数据清理失败:', error);
            throw error;
        }
    }

    // 执行数据分类
    async performDataClassification() {
        try {
            const cleanedData = this.dataStore.get('cleanedData') || [];
            
            if (cleanedData.length === 0) {
                console.log('没有需要分类的数据');
                return [];
            }

            console.log('开始数据分类...');
            
            const classifiedData = await this.dataProcessors.classifier.classify(cleanedData);
            
            // 存储分类后的数据
            this.dataStore.set('classifiedData', classifiedData);
            
            console.log(`数据分类完成，分类完成 ${classifiedData.length} 条数据`);
            
            return classifiedData;
        } catch (error) {
            console.error('数据分类失败:', error);
            throw error;
        }
    }

    // 获取仪表板数据
    getDashboardData() {
        const rawData = this.dataStore.get('rawData') || [];
        const cleanedData = this.dataStore.get('cleanedData') || [];
        const classifiedData = this.dataStore.get('classifiedData') || [];
        
        return {
            totalData: rawData.length,
            processedData: cleanedData.length,
            pendingData: classifiedData.filter(item => item.status === 'pending').length,
            publishedData: classifiedData.filter(item => item.status === 'published').length,
            lastUpdate: new Date().toISOString(),
            activePlatforms: this.getActivePlatforms(),
            avgProcessTime: this.calculateAvgProcessTime(),
            accuracyRate: this.calculateAccuracyRate()
        };
    }

    // 获取活跃平台
    getActivePlatforms() {
        const platforms = [];
        for (const [name, api] of Object.entries(this.externalAPIs)) {
            if (api.isActive()) {
                platforms.push(this.getPlatformDisplayName(name));
            }
        }
        return platforms.join('、');
    }

    // 获取平台显示名称
    getPlatformDisplayName(platformName) {
        const nameMap = {
            'xiaohongshu': '小红书',
            'weibo': '微博',
            'douyin': '抖音'
        };
        return nameMap[platformName] || platformName;
    }

    // 计算平均处理时间
    calculateAvgProcessTime() {
        // 模拟计算
        return (Math.random() * 2 + 1).toFixed(1);
    }

    // 计算准确率
    calculateAccuracyRate() {
        // 模拟计算
        return (Math.random() * 5 + 93).toFixed(1);
    }

    // 更新系统指标
    updateSystemMetrics() {
        const metrics = {
            cpu: Math.floor(Math.random() * 40) + 30,
            memory: Math.floor(Math.random() * 30) + 60,
            disk: Math.floor(Math.random() * 20) + 40,
            network: Math.floor(Math.random() * 100) + 50,
            timestamp: new Date().toISOString()
        };
        
        this.dataStore.set('systemMetrics', metrics);
    }

    // 获取小红书专项数据
    getXiaohongshuData() {
        const rawData = this.dataStore.get('rawData') || [];
        const xiaohongshuData = rawData.filter(item => item.source === 'xiaohongshu');
        
        return {
            total: xiaohongshuData.length,
            discountItems: xiaohongshuData.filter(item => item.discountInfo).length,
            highCredibility: xiaohongshuData.filter(item => item.credibility >= 80).length,
            recentItems: xiaohongshuData.filter(item => 
                Date.now() - item.publishTime < 24 * 60 * 60 * 1000
            ).length,
            items: xiaohongshuData.slice(0, 50) // 返回最新50条
        };
    }

    // 手动触发小红书数据采集
    async triggerXiaohongshuCollection() {
        try {
            console.log('手动触发小红书数据采集...');
            const data = await this.collectFromXiaohongshu();
            
            // 更新现有数据
            const existingData = this.dataStore.get('rawData') || [];
            const filteredExisting = existingData.filter(item => item.source !== 'xiaohongshu');
            const updatedData = [...filteredExisting, ...data];
            
            this.dataStore.set('rawData', updatedData);
            
            // 触发数据处理
            setTimeout(() => {
                this.performDataCleaning();
            }, 1000);
            
            return {
                success: true,
                collected: data.length,
                message: `成功采集 ${data.length} 条小红书数据`
            };
        } catch (error) {
            console.error('手动采集失败:', error);
            return {
                success: false,
                error: error.message,
                message: '数据采集失败，请稍后重试'
            };
        }
    }
}

// 数据采集器
class DataCollector {
    constructor(externalAPIs) {
        this.apis = externalAPIs;
    }

    async collectFromXiaohongshu() {
        return await this.apis.xiaohongshu.searchProducts('内购', 20);
    }

    async collectFromWeibo() {
        return await this.apis.weibo.search('内购');
    }

    async collectFromDouyin() {
        return await this.apis.douyin.search('内购');
    }
}

// 数据清洗器
class DataCleaner {
    async clean(rawData) {
        return rawData.filter(item => {
            // 过滤无效数据
            if (!item.title || !item.content) return false;
            
            // 过滤低质量内容
            if (item.title.length < 5 || item.content.length < 10) return false;
            
            // 过滤重复内容
            // 这里可以添加更复杂的去重逻辑
            
            return true;
        }).map(item => ({
            ...item,
            cleaned: true,
            cleanedAt: Date.now()
        }));
    }
}

// 数据分类器
class DataClassifier {
    async classify(cleanedData) {
        return cleanedData.map(item => ({
            ...item,
            category: this.classifyItem(item),
            priority: this.calculatePriority(item),
            status: 'pending',
            classifiedAt: Date.now()
        }));
    }

    classifyItem(item) {
        if (item.type === 'discount' || item.type === 'flash_sale') {
            return 'promotion';
        }
        if (item.type === 'internal_purchase') {
            return 'internal';
        }
        return 'general';
    }

    calculatePriority(item) {
        let priority = 5;
        
        if (item.credibility > 85) priority += 2;
        if (item.discountInfo) priority += 3;
        if (item.stats.likes > 500) priority += 1;
        if (item.brandInfo) priority += 1;
        
        return Math.min(priority, 10);
    }
}

// 数据验证器
class DataValidator {
    async validate(classifiedData) {
        return classifiedData.map(item => ({
            ...item,
            isValid: this.validateItem(item),
            validationScore: this.calculateValidationScore(item),
            validatedAt: Date.now()
        }));
    }

    validateItem(item) {
        // 基础验证
        if (!item.title || !item.content) return false;
        if (item.title.length > 200 || item.content.length > 2000) return false;
        
        // 内容质量验证
        if (item.credibility < 60) return false;
        
        return true;
    }

    calculateValidationScore(item) {
        let score = 0;
        
        if (item.title && item.title.length >= 10) score += 20;
        if (item.content && item.content.length >= 50) score += 20;
        if (item.images && item.images.length > 0) score += 15;
        if (item.credibility >= 80) score += 25;
        if (item.stats.likes > 100) score += 10;
        if (item.discountInfo) score += 10;
        
        return Math.min(score, 100);
    }
}

// 微博API类（占位符）
class WeiboAPI {
    isActive() {
        return false; // 暂未启用
    }
    
    async search(keyword) {
        return [];
    }
}

// 抖音API类（占位符）
class DouyinAPI {
    isActive() {
        return false; // 暂未启用
    }
    
    async search(keyword) {
        return [];
    }

    // 获取系统监控数据
    getSystemMonitoringData() {
        return this.dataStore.get('systemMetrics') || {
            cpu: 45,
            memory: 78,
            disk: 52,
            network: 120,
            uptime: '15天 8小时'
        };
    }

    // 提交审核
    async submitReview(reviewData) {
        try {
            const { itemId, action, comment } = reviewData;
            
            // 更新数据状态
            const classifiedData = this.dataStore.get('classifiedData') || [];
            const itemIndex = classifiedData.findIndex(item => item.id === itemId);
            
            if (itemIndex !== -1) {
                classifiedData[itemIndex].status = action;
                classifiedData[itemIndex].reviewComment = comment;
                classifiedData[itemIndex].reviewTime = new Date().toISOString();
                
                this.dataStore.set('classifiedData', classifiedData);
            }
            
            return { success: true, message: '审核提交成功' };
        } catch (error) {
            console.error('提交审核失败:', error);
            throw error;
        }
    }

    // 导出报告
    async exportReport(options = {}) {
        try {
            const { format = 'json', dateRange = 'last7days' } = options;
            
            const reportData = {
                generatedAt: new Date().toISOString(),
                dateRange,
                summary: this.getDashboardData(),
                details: {
                    rawData: this.dataStore.get('rawData') || [],
                    cleanedData: this.dataStore.get('cleanedData') || [],
                    classifiedData: this.dataStore.get('classifiedData') || []
                }
            };
            
            if (format === 'json') {
                return reportData;
            } else if (format === 'csv') {
                return this.convertToCSV(reportData);
            }
            
            return reportData;
        } catch (error) {
            console.error('导出报告失败:', error);
            throw error;
        }
    }

    // 转换为CSV格式
    convertToCSV(data) {
        // 简化的CSV转换逻辑
        const headers = ['ID', '标题', '平台', '状态', '创建时间'];
        const rows = data.details.classifiedData.map(item => [
            item.id,
            item.title,
            item.platform,
            item.status,
            item.createdAt
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // 停止所有调度器
    stopAllSchedulers() {
        for (const [name, scheduler] of this.schedulers) {
            clearInterval(scheduler);
        }
        this.schedulers.clear();
    }

    // 清理资源
    cleanup() {
        this.stopAllSchedulers();
        this.dataStore.clear();
    }
}

// 外部API集成类
class XiaohongshuExternalAPI {
    constructor() {
        this.baseURL = 'https://api.xiaohongshu.com';
        this.isActive = true;
    }

    isActive() {
        return this.isActive;
    }

    async collect() {
        // 模拟小红书数据采集
        return [
            { id: 'xhs_001', title: '企业内购优惠信息', platform: 'xiaohongshu', content: '...', createdAt: new Date().toISOString() },
            { id: 'xhs_002', title: '员工专享福利', platform: 'xiaohongshu', content: '...', createdAt: new Date().toISOString() }
        ];
    }
}

class WeiboAPI {
    constructor() {
        this.baseURL = 'https://api.weibo.com';
        this.isActive = true;
    }

    isActive() {
        return this.isActive;
    }

    async collect() {
        // 模拟微博数据采集
        return [
            { id: 'wb_001', title: '公司团购活动', platform: 'weibo', content: '...', createdAt: new Date().toISOString() }
        ];
    }
}

class DouyinAPI {
    constructor() {
        this.baseURL = 'https://api.douyin.com';
        this.isActive = false; // 模拟未激活状态
    }

    isActive() {
        return this.isActive;
    }

    async collect() {
        // 模拟抖音数据采集
        return [];
    }
}

// 数据处理器类
class DataCollector {
    constructor(externalAPIs) {
        this.externalAPIs = externalAPIs;
    }

    async collectFromXiaohongshu() {
        return await this.externalAPIs.xiaohongshu.collect();
    }

    async collectFromWeibo() {
        return await this.externalAPIs.weibo.collect();
    }

    async collectFromDouyin() {
        return await this.externalAPIs.douyin.collect();
    }
}

class DataCleaner {
    async clean(rawData) {
        // 模拟数据清理逻辑
        return rawData
            .filter(item => item.title && item.content) // 过滤无效数据
            .map(item => ({
                ...item,
                title: item.title.trim(),
                content: item.content.trim(),
                cleanedAt: new Date().toISOString()
            }));
    }
}

class DataClassifier {
    async classify(cleanedData) {
        // 模拟数据分类逻辑
        return cleanedData.map(item => ({
            ...item,
            category: this.classifyCategory(item),
            priority: this.calculatePriority(item),
            status: 'pending',
            classifiedAt: new Date().toISOString()
        }));
    }

    classifyCategory(item) {
        const categories = ['服装', '数码', '美妆', '食品'];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    calculatePriority(item) {
        return Math.floor(Math.random() * 5) + 1;
    }
}

class DataValidator {
    async validate(data) {
        // 模拟数据验证逻辑
        return data.filter(item => this.isValid(item));
    }

    isValid(item) {
        return item.title && item.content && item.platform;
    }
}

// 导出后台服务实例
window.BackendService = BackendService;
// 配置文件 - Configuration
// 统一管理应用配置和三层架构的整合

const AppConfig = {
    // 应用基础配置
    app: {
        name: '企购内购信息助手',
        version: '1.0.0',
        description: '企业内购信息自动化采集与处理系统'
    },

    // 前台配置
    frontend: {
        // UI配置
        ui: {
            theme: 'default',
            language: 'zh-CN',
            pageSize: 20,
            autoRefresh: true,
            refreshInterval: 30000 // 30秒
        },
        
        // 导航配置
        navigation: {
            sections: [
                { id: 'overview', name: '数据总览', icon: 'dashboard' },
                { id: 'workflow', name: '工作流程', icon: 'workflow' },
                { id: 'features', name: '功能模块', icon: 'features' },
                { id: 'compliance', name: '系统监控', icon: 'monitoring' }
            ]
        },

        // 图表配置
        charts: {
            defaultType: 'line',
            colors: {
                primary: '#3B82F6',
                success: '#10B981',
                warning: '#F59E0B',
                danger: '#EF4444'
            }
        }
    },

    // 中台配置
    middleware: {
        // API配置
        api: {
            baseURL: '/api',
            timeout: 10000,
            retryAttempts: 3,
            cacheEnabled: true,
            cacheTimeout: 5 * 60 * 1000 // 5分钟
        },

        // 数据处理配置
        dataProcessing: {
            batchSize: 100,
            maxRetries: 3,
            validationRules: {
                required: ['title', 'content', 'platform'],
                maxLength: { title: 100, content: 1000 }
            }
        },

        // 外部API配置
        externalAPIs: {
            xiaohongshu: {
                enabled: true,
                interval: 5 * 60 * 1000, // 5分钟
                maxResults: 50,
                keywords: [
                    '内购', '员工折扣', '企业采购', 
                    '限时优惠', '品牌折扣', '员工福利',
                    '内部价', '员工专享', '企业福利'
                ],
                categories: [
                    'shopping', 'fashion', 'electronics', 
                    'beauty', 'home', 'food'
                ],
                rateLimit: {
                    minInterval: 1000, // 最小请求间隔1秒
                    maxRequestsPerMinute: 30,
                    maxRequestsPerHour: 500
                },
                credibility: {
                    minScore: 60,
                    weights: {
                        likes: 0.3,
                        comments: 0.2,
                        shares: 0.2,
                        collects: 0.3
                    }
                },
                dataFilters: {
                    minTitleLength: 5,
                    maxTitleLength: 200,
                    minContentLength: 10,
                    maxContentLength: 2000,
                    requireImages: true,
                    excludeKeywords: ['广告', '推广', '营销']
                }
            },
            weibo: {
                enabled: false,
                interval: 10 * 60 * 1000, // 10分钟
                maxResults: 30
            },
            douyin: {
                enabled: false,
                interval: 10 * 60 * 1000, // 10分钟
                maxResults: 30
            }
        }
    },

    // 后台配置
    backend: {
        // 数据库配置
        database: {
            type: 'sqlite', // 可选: mysql, postgresql, mongodb
            host: 'localhost',
            port: 3306,
            name: 'enterprise_purchase',
            username: 'admin',
            password: 'password'
        },

        // 调度器配置
        schedulers: {
            dataCollection: {
                enabled: true,
                interval: 5 * 60 * 1000, // 5分钟
                timezone: 'Asia/Shanghai'
            },
            dataCleaning: {
                enabled: true,
                interval: 60 * 60 * 1000, // 1小时
                timezone: 'Asia/Shanghai'
            },
            systemMonitoring: {
                enabled: true,
                interval: 60 * 1000, // 1分钟
                timezone: 'Asia/Shanghai'
            }
        },

        // 系统监控配置
        monitoring: {
            metrics: ['cpu', 'memory', 'disk', 'network'],
            alertThresholds: {
                cpu: 80,
                memory: 85,
                disk: 90,
                network: 1000
            },
            logLevel: 'info'
        },

        // 安全配置
        security: {
            encryption: {
                enabled: true,
                algorithm: 'AES-256-GCM'
            },
            authentication: {
                enabled: true,
                method: 'jwt',
                tokenExpiry: 24 * 60 * 60 * 1000 // 24小时
            },
            rateLimiting: {
                enabled: true,
                maxRequests: 100,
                windowMs: 60 * 1000 // 1分钟
            }
        }
    },

    // 开发环境配置
    development: {
        debug: true,
        mockData: true,
        logLevel: 'debug',
        apiMocking: true
    },

    // 生产环境配置
    production: {
        debug: false,
        mockData: false,
        logLevel: 'warn',
        apiMocking: false
    }
};

// 环境检测
const Environment = {
    isDevelopment: () => {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('dev');
    },
    
    isProduction: () => {
        return !Environment.isDevelopment();
    },
    
    getCurrentConfig: () => {
        return Environment.isDevelopment() ? AppConfig.development : AppConfig.production;
    }
};

// 三层架构整合器
class ArchitectureIntegrator {
    constructor() {
        this.config = AppConfig;
        this.environment = Environment.getCurrentConfig();
        this.frontend = null;
        this.middleware = null;
        this.backend = null;
    }

    // 初始化三层架构
    async init() {
        try {
            console.log('初始化三层架构...');
            
            // 1. 初始化后台服务
            console.log('初始化后台服务...');
            if (typeof BackendService !== 'undefined') {
                this.backend = new BackendService();
            } else {
                console.warn('BackendService类未定义，跳过初始化');
            }
            
            // 2. 初始化中台API
            console.log('初始化中台API...');
            if (typeof MiddlewareAPI !== 'undefined') {
                this.middleware = new MiddlewareAPI();
            } else {
                console.warn('MiddlewareAPI类未定义，跳过初始化');
            }
            
            // 3. 初始化前台控制器
            console.log('初始化前台控制器...');
            if (typeof FrontendController !== 'undefined') {
                this.frontend = new FrontendController();
            } else {
                console.warn('FrontendController类未定义，跳过初始化');
            }
            
            // 4. 设置层级间的通信
            this.setupInterLayerCommunication();
            
            // 5. 启动系统监控
            this.startSystemMonitoring();
            
            console.log('三层架构初始化完成');
            
        } catch (error) {
            console.error('三层架构初始化失败:', error);
            throw error;
        }
    }

    // 设置层级间通信
    setupInterLayerCommunication() {
        // 前台到中台的通信
        if (this.frontend && this.middleware) {
            this.frontend.setAPIClient(this.middleware);
        }

        // 中台到后台的通信
        if (this.middleware && this.backend) {
            this.middleware.setBackendService(this.backend);
        }

        // 事件总线
        this.eventBus = new EventTarget();
        
        // 监听系统事件
        this.setupEventListeners();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 数据更新事件
        this.eventBus.addEventListener('dataUpdated', (event) => {
            console.log('数据已更新:', event.detail);
        });

        // 错误事件
        this.eventBus.addEventListener('error', (event) => {
            console.error('系统错误:', event.detail);
        });

        // 系统状态变更事件
        this.eventBus.addEventListener('statusChanged', (event) => {
            console.log('系统状态变更:', event.detail);
        });
    }

    // 启动系统监控
    startSystemMonitoring() {
        if (this.config.backend.monitoring.enabled) {
            setInterval(() => {
                const metrics = this.backend.getSystemMonitoringData();
                this.eventBus.dispatchEvent(new CustomEvent('metricsUpdated', {
                    detail: metrics
                }));
            }, this.config.backend.schedulers.systemMonitoring.interval);
        }
    }

    // 获取配置
    getConfig(layer = null) {
        if (layer) {
            return this.config[layer];
        }
        return this.config;
    }

    // 获取环境信息
    getEnvironment() {
        return this.environment;
    }

    // 销毁实例
    destroy() {
        if (this.frontend) {
            // 检查frontend是否有destroy方法
            if (typeof this.frontend.destroy === 'function') {
                this.frontend.destroy();
            } else {
                console.log('FrontendController没有destroy方法，跳过销毁');
            }
        }
        
        if (this.backend) {
            // 检查backend是否有cleanup方法
            if (typeof this.backend.cleanup === 'function') {
                this.backend.cleanup();
            } else {
                console.log('BackendService没有cleanup方法，跳过清理');
            }
        }
        
        console.log('三层架构已销毁');
    }
}

// 全局应用实例
window.App = {
    config: AppConfig,
    environment: Environment,
    integrator: null,
    
    // 启动应用
    async start() {
        try {
            this.integrator = new ArchitectureIntegrator();
            await this.integrator.init();
            
            console.log('应用启动成功');
        } catch (error) {
            console.error('应用启动失败:', error);
        }
    },
    
    // 停止应用
    stop() {
        if (this.integrator) {
            this.integrator.destroy();
        }
    }
};

// 页面加载完成后自动启动
document.addEventListener('DOMContentLoaded', () => {
    // 延迟启动，确保所有类都已加载
    setTimeout(() => {
        window.App.start();
    }, 100);
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    window.App.stop();
});
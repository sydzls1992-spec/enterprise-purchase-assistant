const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入现有的后台服务
const { XiaohongshuAPI } = require('./backend-service');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 静态文件服务

// API路由
app.get('/api/dashboard', (req, res) => {
    res.json({
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
    });
});

app.get('/api/xiaohongshu/data', async (req, res) => {
    try {
        const xiaohongshuAPI = new XiaohongshuAPI();
        const data = await xiaohongshuAPI.searchProducts('内购', 20);
        res.json({
            success: true,
            data: data,
            total: data.length,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/xiaohongshu/collect', async (req, res) => {
    try {
        const xiaohongshuAPI = new XiaohongshuAPI();
        const keywords = ['内购', '员工折扣', '企业采购', '限时优惠'];
        const results = [];
        
        for (const keyword of keywords) {
            const data = await xiaohongshuAPI.searchProducts(keyword, 10);
            results.push(...data);
        }
        
        res.json({
            success: true,
            message: `成功采集 ${results.length} 条数据`,
            data: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// SPA路由支持
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📱 静态文件服务已启动`);
    console.log(`🔗 API接口: http://localhost:${PORT}/api`);
});
#!/bin/bash

# 企购内购信息助手启动脚本

echo "🚀 正在启动企购内购信息助手..."
echo "📋 小红书数据通道已集成"
echo ""

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    echo "✅ 检测到Python3，启动本地服务器..."
    echo "🌐 服务器地址: http://localhost:8000"
    echo "📱 移动端访问: http://你的IP地址:8000"
    echo ""
    echo "💡 提示: 按 Ctrl+C 停止服务器"
    echo "🔧 功能说明:"
    echo "   - 小红书数据自动采集 (每5分钟)"
    echo "   - 实时数据分析和可视化"
    echo "   - 支持手动触发数据采集"
    echo "   - 数据筛选和排序功能"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ 检测到Python，启动本地服务器..."
    echo "🌐 服务器地址: http://localhost:8000"
    echo ""
    python -m http.server 8000
else
    echo "⚠️  未检测到Python，尝试直接在浏览器中打开..."
    echo "📂 请手动打开: index.html"
    
    # 尝试在不同操作系统上打开浏览器
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open index.html
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows
        start index.html
    fi
fi

echo ""
echo "🎉 启动完成！"
echo "📖 使用说明请查看 README.md"
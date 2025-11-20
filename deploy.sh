#!/bin/bash

# 企购内购信息助手部署脚本

echo "🚀 开始部署企购内购信息助手..."

# 配置变量
REMOTE_USER="root"
REMOTE_HOST="your-server-ip"
REMOTE_PATH="/var/www/enterprise-purchase-assistant"
SERVICE_NAME="enterprise-purchase-assistant"

# 1. 打包本地文件
echo "📦 打包本地文件..."
tar -czf deploy.tar.gz --exclude='.git' --exclude='node_modules' --exclude='deploy.tar.gz' .

# 2. 上传到服务器
echo "📤 上传文件到服务器..."
scp deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/

# 3. 服务器端部署
echo "🔧 服务器端部署..."
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    # 创建目录
    mkdir -p /var/www/enterprise-purchase-assistant
    
    # 解压文件
    cd /tmp
    tar -xzf deploy.tar.gz -C /var/www/enterprise-purchase-assistant
    
    # 设置权限
    chown -R www-data:www-data /var/www/enterprise-purchase-assistant
    chmod -R 755 /var/www/enterprise-purchase-assistant
    
    # 安装Node.js依赖（如果需要后端服务）
    cd /var/www/enterprise-purchase-assistant
    npm install --production
    
    # 配置Nginx
    cp nginx.conf /etc/nginx/sites-available/enterprise-purchase-assistant
    ln -sf /etc/nginx/sites-available/enterprise-purchase-assistant /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    
    # 配置systemd服务（如果需要后端）
    cat > /etc/systemd/system/enterprise-purchase-assistant.service << 'EOL'
[Unit]
Description=Enterprise Purchase Assistant Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/enterprise-purchase-assistant
ExecStart=/usr/bin/node backend-service.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL
    
    # 启动服务
    systemctl daemon-reload
    systemctl enable enterprise-purchase-assistant
    systemctl start enterprise-purchase-assistant
    
    # 清理临时文件
    rm /tmp/deploy.tar.gz
    
    echo "✅ 部署完成！"
EOF

# 4. 清理本地文件
rm deploy.tar.gz

echo "🎉 部署成功完成！"
echo "🌐 访问地址: http://$REMOTE_HOST"
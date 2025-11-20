# GitHub 部署指南

## 项目已准备完成

企购内购信息助手项目已经完成开发并准备就绪，包含以下功能：

### 📁 项目结构
```
enterprise-purchase-assistant/
├── index.html              # 主页面文件
├── server.js               # Node.js 服务器
├── backend-service.js      # 后端服务逻辑
├── frontend-controller.js  # 前端控制器
├── middleware-api.js       # API中间件
├── config.js               # 配置文件
├── package.json            # Node.js 依赖
├── Dockerfile              # Docker 配置
├── deploy.sh               # 部署脚本
├── README.md               # 项目说明
└── .gitignore              # Git 忽略文件
```

### 🚀 部署到 GitHub 的步骤

#### 1. 创建 GitHub 仓库
1. 登录到 [GitHub](https://github.com)
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `enterprise-purchase-assistant`
   - **Description**: `企购内购信息助手 - 企业内购信息自动化采集与处理系统`
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Add a README file"（我们已经有了）
4. 点击 "Create repository"

#### 2. 连接本地仓库到 GitHub
创建仓库后，GitHub 会显示设置说明。选择 "...or push an existing repository from the command line" 部分，运行以下命令：

```bash
# 进入项目目录
cd "/Users/sunnsun/Documents/Sunn /AI /enterprise-purchase-assistant/enterprise-purchase-assistant"

# 更新远程仓库 URL（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote set-url origin https://github.com/YOUR_USERNAME/enterprise-purchase-assistant.git

# 推送到 GitHub
git push -u origin main
```

#### 3. 验证部署
推送完成后，您可以在 GitHub 仓库页面看到所有文件。

### 🌐 在线部署选项

#### 选项 1: GitHub Pages (免费)
1. 在 GitHub 仓库中，进入 Settings
2. 找到 "Pages" 部分
3. Source 选择 "Deploy from a branch"
4. Branch 选择 "main"，文件夹选择 "/ (root)"
5. 点击 Save
6. 几分钟后，您的网站将在 `https://YOUR_USERNAME.github.io/enterprise-purchase-assistant/` 可访问

#### 选项 2: Vercel (推荐)
1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择您的 GitHub 仓库
5. Vercel 会自动检测项目类型并配置
6. 点击 Deploy

#### 选项 3: Netlify
1. 访问 [Netlify](https://netlify.com)
2. 拖拽项目文件夹到部署区域
3. 或者连接 GitHub 仓库进行持续部署

### 🐳 Docker 部署
如果需要 Docker 部署：

```bash
# 构建 Docker 镜像
docker build -t enterprise-purchase-assistant .

# 运行容器
docker run -p 3000:3000 enterprise-purchase-assistant
```

### 📋 项目特性
- ✅ 响应式 Web 界面
- ✅ 小红书数据采集
- ✅ AI 智能分析
- ✅ 内容管理系统
- ✅ 数据可视化
- ✅ RESTful API
- ✅ Docker 支持
- ✅ 完整文档

### 🛠️ 本地运行
```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 访问 http://localhost:3000
```

### 📞 支持
如有问题，请查看项目 README.md 文件或提交 Issue。
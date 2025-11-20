# GitHub Pages 配置

## 项目信息
- 项目名称：企购内购信息助手
- 描述：企业内购信息自动化采集与处理系统
- 技术栈：Node.js, Express, HTML5, CSS3, JavaScript, Docker

## GitHub Pages 设置

### 方式一：从 /docs 文件夹部署（推荐）
1. 确保项目根目录有 `docs/` 文件夹
2. 将 `index.html` 放在 `docs/` 文件夹中
3. 在GitHub仓库设置中选择 "Source: Deploy from a branch"
4. 选择 "Branch: main" 和 "Folder: /docs"

### 方式二：从根目录部署
1. 将 `index.html` 放在项目根目录
2. 在GitHub仓库设置中选择 "Source: Deploy from a branch"
3. 选择 "Branch: main" 和 "Folder: /(root)"

### 方式三：使用 GitHub Actions 自动部署
1. 创建 `.github/workflows/deploy.yml`
2. 配置自动构建和部署流程

## 访问地址
部署成功后，网站将通过以下地址访问：
```
https://sydzls1992-spec.github.io/enterprise-purchase-assistant/
```

## 功能特性
- 📱 小红书数据采集
- 🤖 AI智能分析
- 📊 数据可视化
- 🔄 实时更新
- 🛡️ 安全可靠
- 🚀 高性能

## 部署选项
- GitHub Pages（静态网站）
- Vercel（全栈应用）
- Netlify（静态网站）
- Docker（容器化部署）
- 传统服务器（Node.js）
---
title: Github文档(二) 博客搭建
tags:
  - Hexo
  - GitHub
  - Butterfly
  - GitHub-Actions
categories:
  - 工具配置
description: 从零开始搭建 Hexo 博客，配置 Butterfly 主题，使用 GitHub Actions 实现自动部署。详细介绍环境准备、主题配置、插件安装和自动化部署的完整流程。
cover: >-
  /img/picgo-images/hexo-githubpages.webp
abbrlink: beec4250
date: 2026-01-09 15:52:30
---

## 概述

Hexo 是一个快速、简洁且高效的静态博客框架, 基于 Node.js 构建. 它支持 Markdown 语法, 可以通过插件快速扩展功能, 并能一键部署到 GitHub Pages、Vercel、Netlify 等平台.

{% note success %}
本指南将详细介绍如何使用 Hexo 搭建个人博客，配置 Butterfly 主题，并通过 GitHub Actions 实现自动部署.
{% endnote %}

{% btn https://hexo.io/zh-cn/docs/, Hexo 官方文档, fas fa-book, outline blue %}
{% btn https://butterfly.js.org/, Butterfly 主题文档, fas fa-palette, outline purple %}

{% note info %}
**选择 Hexo 的原因**: 生成速度快(100+ 文章只需几秒)、插件生态丰富、部署简单、主题支持多
{% endnote %}

## 环境准备

在开始之前，请确保你的电脑已经安装以下工具:

### 安装 Node.js

Hexo 基于 Node.js 运行，需要先安装 Node.js 环境.

{% tabs Node.js 安装, fas fa-code %}

<!-- tab macOS @fab fa-apple -->

```bash
# 使用 Homebrew 安装
brew install node

# 验证安装
node -v
npm -v
```

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

```powershell
# 使用 winget 安装
winget install OpenJS.NodeJS.LTS

# 或访问官网下载安装包
# https://nodejs.org/
```

<!-- endtab -->

<!-- tab Linux @fab fa-linux -->

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm

# 验证安装
node -v
npm -v
```

<!-- endtab -->

{% endtabs %}

{% note warning %}
推荐 Node.js 版本 >= 16.x，npm 版本 >= 8.x 以确保兼容性
{% endnote %}

### 安装 Git

Git 用于版本管理和代码部署.

{% tabs Git 安装, fas fa-code %}

<!-- tab macOS @fab fa-apple -->

```bash
# macOS 通常自带 Git, 或使用 Homebrew 安装
brew install git

# 验证安装
git --version
```

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

```powershell
# 使用 winget 安装
winget install Git.Git

# 或访问官网下载安装包
# https://git-scm.com/download/win
```

<!-- endtab -->

<!-- tab Linux @fab fa-linux -->

```bash
# Ubuntu/Debian
sudo apt install git

# CentOS/RHEL
sudo yum install git

# 验证安装
git --version
```

<!-- endtab -->

{% endtabs %}

### 配置 Git (首次使用)

```bash
# 设置用户名和邮箱
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 查看配置
git config --list
```

{% btn https://git-scm.com/doc, Git 官方文档, fas fa-external-link-alt, outline green %}

## 安装 Hexo 框架

### 全局安装 Hexo-CLI

```bash
# 全局安装 Hexo 命令行工具
npm install -g hexo-cli

# 验证安装
hexo version
```

### 创建博客项目

```bash
# 1. 创建项目目录
hexo init hexo-blog

# 2. 进入项目目录
cd hexo-blog

# 3. 安装项目依赖
npm install

# 4. 安装核心插件
# Git 部署插件 - 用于部署到 GitHub Pages
npm install hexo-deployer-git --save

# 渲染器插件 - Butterfly 主题必需
npm install hexo-renderer-pug hexo-renderer-stylus --save

# 5. 本地运行预览
hexo server
# 或简写为
hexo s
```

访问 `http://localhost:4000` 即可查看默认的 Hexo 博客.

{% folding cyan, 📁 项目目录结构 %}

```
hexo-blog/
├── _config.yml                 # Hexo 主配置文件
├── _config.butterfly.yml       # Butterfly 主题配置文件(需手动创建)
├── package.json                # 依赖管理
├── source/                     # 源文件目录
│   ├── _posts/                # Markdown 文章存放处
│   └── img/                   # 图片资源
├── themes/                     # 主题目录
│   └── butterfly/             # Butterfly 主题
├── public/                     # 生成的静态文件(执行 hexo g 后生成)
└── node_modules/               # npm 依赖
```

{% endfolding %}

{% btn https://hexo.io/zh-cn/docs/setup, Hexo 安装文档, fas fa-book, outline blue %}

## Pages 仓库

### 创建仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角 `+` → `New repository`
3. 设置仓库信息:

| 配置项          | 值                      | 说明                             |
| --------------- | ----------------------- | -------------------------------- |
| Repository name | `${用户名}.github.io`   | 必须使用此格式                   |
| Description     | Personal Blog           | 可选                             |
| Public/Private  | Public                  | Public 才能使用免费 GitHub Pages |
| Initialize      | 添加 README/ .gitignore | 可选                             |

4. 点击 `Create repository`

### 配置分支

GitHub Pages 默认支持以下分支:

| 分支名     | 目录       | 说明         |
| ---------- | ---------- | ------------ |
| `main`     | `/ (root)` | 推荐使用     |
| `gh-pages` | `/ (root)` | 传统方式     |
| `main`     | `/docs`    | 文档项目使用 |

{% note info %}
新建仓库默认分支为 `main`，无需额外配置
{% endnote %}

{% btn https://docs.github.com/en/pages, GitHub Pages 官方文档, fab fa-github, outline gray %}

## 配置 Hexo 框架

编辑根目录下的 `_config.yml` 文件:

{% folding green, ⚙️ Hexo 配置文件 %}

```yaml
# ======================
# Site 网站信息
# ======================
title: My Blog              # 网站标题
subtitle: 技术成长记录      # 网站副标题
description: 分享技术心得   # 网站描述
keywords: Hexo, Butterfly   # 关键词
author: Your Name           # 作者名
language: zh-CN             # 语言
timezone: Asia/Shanghai     # 时区

# ======================
# URL 网站地址
# ======================
url: https://${用户名}.github.io
permalink: :year/:month/:day/:title/
permalink_defaults:

# ======================
# Directory 目录设置
# ======================
source_dir: source
public_dir: public

# ======================
# Writing 写作设置
# ======================
default_layout: post
titlecase: false
external_link:
  enable: true
  field: site
  exclude: ''

filename_case: 0
render_drafts: false
post_asset_folder: false  # 设为 true 可为每篇文章创建资源文件夹
relative_link: false
future: true
syntax_highlighter: highlight.js
highlight:
  line_number: true
  auto_detect: false
  tab_replace: ''

# ======================
# Category & Directory 分类 & 标签
# ======================
default_category: uncategorized
category_map:
tag_map:

# ======================
# Date / Time format 日期格式
# ======================
date_format: YYYY-MM-DD
time_format: HH:mm:ss

# ======================
# Pagination 分页
# ======================
per_page: 10
pagination_dir: page

# ======================
# Extensions 扩展
# ======================
theme: butterfly

# ======================
# Deployment 部署配置
# ======================
deploy:
  type: git
  repo: https://github.com/${用户名}/${用户名}.github.io.git
  branch: main
  message: Site updated: {{ now('YYYY-MM-DD HH:mm:ss') }}
```

{% endfolding %}

{% note warning %}
配置文件使用 YAML 格式，注意冒号后要有空格，缩进使用空格而非 Tab
{% endnote %}

## 主题安装

Butterfly 是一款美观、功能丰富的 Hexo 主题，支持响应式设计、暗黑模式、代码高亮、多种评论系统等.

{% btn https://butterfly.js.org/posts/21cfbf15/, Butterfly 主题文档, fas fa-palette, outline purple %}

### 安装主题

{% tabs 主题安装方式, fas fa-download %}

<!-- tab Git 克隆 (推荐) -->

```bash
# 在博客根目录执行
git clone https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
```

<!-- endtab -->

<!-- tab NPM 安装 -->

```bash
npm install hexo-theme-butterfly
```

{% note info %}
适用于 Hexo >= 5.0
{% endnote %}

<!-- endtab -->

{% endtabs %}

### 启用主题

编辑 `_config.yml`，修改主题设置:

```yaml
# Extensions
## Plugins: https://hexo.io/plugins/
## Themes: https://hexo.io/themes/
theme: butterfly
```

### 创建主题配置文件

复制主题默认配置到博客根目录:

```bash
cp themes/butterfly/_config.yml _config.butterfly.yml
```

{% note success %}
后续修改主题配置都在 `_config.butterfly.yml` 中进行，主题更新时不会覆盖此文件
{% endnote %}

### 基础配置示例

{% folding blue, 🎨 Butterfly 主题配置 %}

```yaml
# ======================
# Image 图片设置
# ======================
favicon: /img/favicon.png

avatar:
  img: /img/avatar.png
  effect: false

# ======================
# Top_img 顶部图
# ======================
index_img:
  # 可设置默认首页顶部图
  # 或在文章 Front Matter 中单独设置

# ======================
# Navigation 导航栏
# ======================
nav:
  logo: # /img/logo.png
  display_title: true
  fixed: false # 固定导航栏

menu:
  首页: / || fas fa-home
  归档: /archives/ || fas fa-archive
  标签: /tags/ || fas fa-tags
  分类: /categories/ || fas fa-folder-open
  关于: /about/ || fas fa-user

# ======================
# Code Blocks 代码块
# ======================
code_blocks:
  theme: darker # darker/pale night/light/ocean/false
  macStyle: true # macOS 风格窗口控件
  height_limit: 300 # 高度限制, 超出折叠
  word_wrap: false # 代码换行
  copy: true # 复制按钮
  language: true # 显示语言
  shrink: false # 代码块折叠
  fullpage: true # 全屏按钮

# ======================
# Social Settings 社交设置
# ======================
social:
  fab fa-github: https://github.com/${用户名} || Github
  fas fa-envelope: mailto:your.email@example.com || Email

# ======================
# Footer 页脚
# ======================
footer:
  owner:
    enable: true
    since: 2024
  custom_text: Hi, welcome to my blog!

# ======================
# Comments 评论区
# ======================
comments:
  use: Waline # 可选: Waline, Disqus, Gitalk, Twikoo 等
  text: true # 显示评论按钮文案
  lazyload: false
  count: true # 评论数统计
```

{% endfolding %}

### 主题更新

```bash
cd themes/butterfly
git pull
```

{% note info %}
如使用 npm 安装，执行 `npm update hexo-theme-butterfly` 更新
{% endnote %}

## Hexo 常用命令

### 核心命令

{% folding default, 📝 Hexo 命令参考 %}

```bash
# ======================
# 创建文章
# ======================
hexo new "${文章标题}"
# 生成文件到 source/_posts/${文章标题}.md

# 创建草稿
hexo new draft "${草稿标题}"

# ======================
# 本地预览
# ======================
hexo clean     # 清除缓存和静态文件
hexo generate  # 生成静态文件(可简写为 hexo g)
hexo server    # 启动本地服务器(可简写为 hexo s)
# 组合命令:
hexo clean && hexo g && hexo s

# ======================
# 部署到 GitHub
# ======================
hexo clean        # 清理缓存
hexo generate     # 生成静态文件
hexo deploy       # 部署到 GitHub(可简写为 hexo d)
# 组合命令:
hexo clean && hexo g -d  # g -d 等价于 generate && deploy

# ======================
# 其他命令
# ======================
hexo list          # 列出所有文章/页面/路由
hexo version       # 查看 Hexo 版本信息
hexo --help        # 查看帮助
```

{% endfolding %}

### 命令对比

| 命令            | 简写     | 说明                     | 使用场景       |
| --------------- | -------- | ------------------------ | -------------- |
| `hexo generate` | `hexo g` | 生成静态文件到 `public/` | 每次修改后执行 |
| `hexo server`   | `hexo s` | 启动本地服务器           | 本地预览       |
| `hexo deploy`   | `hexo d` | 部署到配置的 Git 仓库    | 发布文章       |
| `hexo clean`    | 无       | 删除缓存和静态文件       | 遇到奇怪问题时 |

{% note success %}
**推荐工作流**:

1. 写文章 → `hexo new "文章标题"`
2. 编辑 Markdown → `source/_posts/文章标题.md`
3. 本地预览 → `hexo clean && hexo s`
4. 部署发布 → `hexo clean && hexo g -d`
   {% endnote %}

{% btn https://hexo.io/zh-cn/docs/commands, Hexo 命令文档, fas fa-terminal, outline blue %}

## 自动部署

### 部署动机

| 对比项     | `hexo deploy`      | GitHub Actions            |
| ---------- | ------------------ | ------------------------- |
| 部署位置   | `public/` → 仓库 A | 源码仓库 B → Pages 仓库 A |
| 源码备份   | 需手动备份         | 自动备份                  |
| 多机器协作 | 困难               | 简单                      |
| 自动化程度 | 手动执行           | 自动触发                  |

{% note primary %}
**推荐方案**: 使用两个仓库

- `${用户名}.github.io` - 静态博客(只读)
- `hexo-blog-source` - 源码仓库(主仓库)
  {% endnote %}

### 工作流配置

#### 1. 创建源码仓库

创建 `hexo-blog-source` 仓库，推送当前项目:

```bash
# 初始化 Git 仓库
git init

# 添加 .gitignore
cat > .gitignore << EOF
node_modules/
public/
.deploy_git/
db.json
*.log
.DS_Store
Thumbs.db
EOF

# 提交初始代码
git add .
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/${用户名}/hexo-blog-source.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 2. 创建 Actions 工作流

创建 `.github/workflows/deploy.yml`:

{% folding purple, 🚀 GitHub Actions 配置 %}

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main # 当推送到 main 分支时触发
  workflow_dispatch: # 支持手动触发

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # 1. 检出代码
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 获取完整历史记录

      # 2. 设置 Node.js 环境
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20" # 使用 LTS 版本
          cache: "npm" # 缓存 npm 依赖

      # 3. 安装依赖
      - name: Install dependencies
        run: |
          npm ci  # 比 npm install 更快更可靠
          npm install -g hexo-cli

      # 4. 生成静态文件
      - name: Generate static files
        run: |
          hexo clean
          hexo generate

      # 5. 部署到 GitHub Pages
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public # 部署 public 目录
          publish_branch: main # 部署到目标仓库的 main 分支
          # 以下配置用于部署到不同仓库
          # repository_name: ${用户名}/${用户名}.github.io
          # user_name: github-actions[bot]
          # user_email: github-actions[bot]@users.noreply.github.com
          # commit_message: ${{ github.event.head_commit.message }}
```

{% endfolding %}

#### 3. 配置 GitHub Pages

在 `${用户名}.github.io` 仓库中:

1. 进入 `Settings` → `Pages`
2. Source 选择 `GitHub Actions`

#### 4. 配置 Secrets(跨仓库部署)

如果源码和 Pages 在不同仓库，需要配置部署密钥:

```bash
# 在本地生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "${用户名}@github.com" -f github-pages-deploy

# 将公钥添加到 Pages 仓库的 Deploy Keys
# Settings → Deploy keys → Add deploy key
# 复制 github-pages-deploy.pub 内容, 勾选 Allow write access

# 将私钥添加到源码仓库的 Secrets
# Settings → Secrets and variables → Actions → New repository secret
# Name: DEPLOY_PRIVATE_KEY
# Value: 复制 github-pages-deploy 内容
```

修改 `.github/workflows/deploy.yml`:

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    deploy_key: ${{ secrets.DEPLOY_PRIVATE_KEY }} # 使用私钥
    external_repository: ${用户名}/${用户名}.github.io # 外部仓库
    publish_dir: ./public
    publish_branch: main
```

### 工作流步骤

{% mermaid %}
flowchart TD
A[推送文章到源码仓库] --> B{GitHub Actions}
B --> C[安装依赖]
C --> D[生成静态文件]
D --> E[部署到 Pages 仓库]
E --> F[自动发布博客]
{% endmermaid %}

{% btn https://docs.github.com/en/actions, GitHub Actions 官方文档, fab fa-github, outline gray %}
{% btn https://github.com/peaceiris/actions-gh-pages, peaceiris/actions-gh-pages, fas fa-rocket, outline blue %}

## 主题配置

### 自定义头像与图标

#### 1. 创建资源目录

```bash
mkdir -p source/img
```

#### 2. 放置资源文件

```
source/img/
├── avatar.png       # 头像
├── favicon.png      # 网站图标
└── logo.png         # Logo
```

#### 3. 配置路径

编辑 `_config.butterfly.yml`:

```yaml
# Image Settings
favicon: /img/favicon.png

avatar:
  img: /img/avatar.png
  effect: false # 头像旋转效果
```

{% note info %}
推荐头像尺寸: 200x200px，favicon: 32x32px
{% endnote %}

### 图片管理方案

#### 方案对比

| 方案                   | 优点           | 缺点           | 推荐度     |
| ---------------------- | -------------- | -------------- | ---------- |
| 本地存储 `source/img/` | 简单直接       | 部署慢、仓库大 | ⭐⭐       |
| 图床 CDN               | 加载快、省空间 | 需额外配置     | ⭐⭐⭐⭐⭐ |
| GitHub CDN             | 免费、稳定     | 国内访问慢     | ⭐⭐⭐⭐   |

#### 推荐方案: jsDelivr + GitHub

```markdown
<!-- 图片链接格式 -->

https://cdn.jsdelivr.net/gh/${用户名}/${仓库名}@${分支名}/${图片路径}

<!-- 示例 -->

![示例图片](https://cdn.jsdelivr.net/gh/koco-co/picgo-images@main/img/example.png)
```

{% note danger %}
本地图片过多会导致 `hexo g` 生成时间过长，强烈建议使用图床
{% endnote %}

### 配置自定义域名

#### 1. 添加 DNS 解析

在域名服务商处添加记录:

| 类型  | 主机记录 | 记录值              | TTL |
| ----- | -------- | ------------------- | --- |
| CNAME | www      | ${用户名}.github.io | 600 |
| CNAME | @        | ${用户名}.github.io | 600 |

{% folding gray, 🌐 使用 Cloudflare 配置 %}

1. 添加站点 → 输入域名
2. 添加 DNS 记录 → CNAME → ${用户名}.github.io
3. 等待 DNS 生效(通常 10-30 分钟)

{% endfolding %}

#### 2. 配置 CNAME 文件

```bash
echo "yourdomain.com" > source/CNAME
```

{% note info %}
CNAME 文件会随 `hexo g` 生成到 public/ 根目录，GitHub Pages 会自动识别
{% endnote %}

#### 3. 在 GitHub 仓库配置

在 `${用户名}.github.io` 仓库:

1. `Settings` → `Pages`
2. Custom domain → 输入域名
3. 勾选 `Enforce HTTPS`

{% btn https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site, GitHub Pages 自定义域名文档, fas fa-globe, outline green %}

### 评论系统配置

Butterfly 支持多种评论系统，推荐使用 Waline.

#### Waline 配置

```yaml
# _config.butterfly.yml
comments:
  use: Waline
  text: true # 在文章底部显示评论按钮
  lazyload: false
  count: true # 评论数统计

waline:
  serverURL: https://${你的Waline域名}.vercel.app/ # Waline 服务地址
  lang: zh-CN
  emoji: ["https://cdn.jsdelivr.net/gh/walinejs/emojis@1.0.0/bilibili"]
  requiredMeta: ["nick", "mail"] # 必填项
  login: enable # 登录模式
```

{% folding blue, 🚀 Waline 部署到 Vercel %}

```bash
# 1. Fork Waline 仓库
# https://github.com/walinejs/waline

# 2. 在 Vercel 导入项目
# 3. 配置环境变量
# MYSQL_DB=<数据库名>
# MYSQL_USER=<用户名>
# MYSQL_PASSWORD=<密码>
# MYSQL_HOST=<主机地址>
# MYSQL_PORT=3306

# 4. 部署完成，获取域名
```

{% endfolding %}

{% btn https://waline.js.org/, Waline 官方文档, fas fa-comments, outline blue %}

### 搜索功能

#### Algolia 搜索(推荐)

```yaml
# _config.butterfly.yml
algolia_search:
  enable: true
  hits:
    per_page: 10
  labels:
    input_placeholder: 搜索文章
    hits_empty: 没有找到相关文章
    hits_stats: 找到 ${hits} 篇文章
```

配置步骤:

1. 注册 [Algolia](https://www.algolia.com/)
2. 创建 Index → `hexo-blog`
3. 生成 API Key
4. 安装插件:

```bash
npm install hexo-algolia --save
```

5. 配置 `_config.yml`:

```yaml
algolia:
  applicationID: ${你的ApplicationID}
  apiKey: ${你的Admin API Key}
  indexName: hexo-blog
```

6. 索引文章:

```bash
hexo algolia
```

{% note warning %}
每次发布新文章后需要重新索引
{% endnote %}

{% btn https://docsearch.algolia.com/, Algolia DocSearch, fas fa-search, outline purple %}

## 最佳实践

### 文章写作规范

#### Front Matter 模板

```markdown
---
title: 文章标题
date: 2026-01-06 14:00:00
tags:
  - Hexo
  - GitHub
categories:
  - 技术教程
cover: https://example.com/cover.jpg # 封面图
top_img: https://example.com/top.jpg # 顶部图(可选)
toc: true # 显示目录
password: 123456 # 文章加密(可选)
---
```

| 字段         | 说明     | 示例       |
| ------------ | -------- | ---------- |
| `title`      | 文章标题 | 必填       |
| `date`       | 发布日期 | 自动生成   |
| `tags`       | 标签列表 | 数组格式   |
| `categories` | 分类     | 支持层级   |
| `cover`      | 封面图   | URL        |
| `toc`        | 目录     | true/false |
| `password`   | 访问密码 | 加密文章   |

#### 内容规范

- 使用 Markdown 语法
- 代码块指定语言: \```javascript
- 图片使用图床链接
- 文件名使用英文或拼音
- 标题层级不超过 4 级

### 性能优化

#### 1. 启用压缩

安装插件:

```bash
npm install hexo-offline --save
npm install hexo-filter-nofollow --save
```

配置 `_config.yml`:

```yaml
# 自动压缩
nofollow:
  enable: true
  exclude:
    - "排除的域名"
```

#### 2. 图片优化

- 使用 WebP 格式
- 压缩图片(tinypng.com)
- CDN 加速
- 懒加载(Butterfly 已内置)

#### 3. 缓存配置

```yaml
# _config.yml
marked:
  gfm: true
  breaks: false
```

### SEO 优化

#### 1. 站点地图

```bash
npm install hexo-generator-sitemap --save
npm install hexo-generator-baidu-sitemap --save
```

```yaml
# _config.yml
sitemap:
  path: sitemap.xml
  rel: false
  tags: true
  categories: true

baidusitemap:
  path: baidusitemap.xml
```

#### 2. robots.txt

创建 `source/robots.txt`:

```txt
User-agent: *
Allow: /
Allow: /archives/
Disallow: /js/
Disallow: /css/

Sitemap: https://你的域名/sitemap.xml
```

#### 3. 提交搜索引擎

- Google Search Console
- Bing Webmaster Tools
- 百度搜索资源平台

#### SEO 提交流程

{% mermaid %}
flowchart TD
A[生成 sitemap.xml] --> B[验证网站所有权]
B --> C[提交 sitemap]
C --> D[等待爬虫抓取]
D --> E[文章收录]
{% endmermaid %}

### 备份策略

#### 方案一: 单仓库方案

所有代码和源文件在一个仓库，使用分支管理:

| 分支     | 用途     |
| -------- | -------- |
| `main`   | 静态博客 |
| `source` | 源码备份 |

#### 方案二: 双仓库方案(推荐)

| 仓库                  | 内容     | 分支   |
| --------------------- | -------- | ------ |
| `${用户名}.github.io` | 静态博客 | `main` |
| `hexo-blog-source`    | 源码     | `main` |

{% note success %}
双仓库方案更安全，避免源码泄露
{% endnote %}

## 常见问题

### Q1: `hexo g` 生成失败

**症状**: 执行 `hexo generate` 报错

**解决方案**:

```bash
# 1. 清除缓存
hexo clean

# 2. 删除 node_modules
rm -rf node_modules

# 3. 重新安装依赖
npm install

# 4. 重新生成
hexo generate
```

### Q2: 部署后样式错乱

**症状**: 本地正常，部署后样式丢失

**解决方案**:

1. 检查 `_config.yml` 中的 `url` 配置
2. 检查主题是否正确安装
3. 清除浏览器缓存
4. 检查 CDN 资源是否可访问

```yaml
# _config.yml
url: https://你的域名 # 确保正确
```

### Q3: 图片无法显示

**症状**: 文章中图片显示为裂图

**解决方案**:

| 原因       | 解决方案                     |
| ---------- | ---------------------------- |
| 路径错误   | 使用 `/img/` 或完整 URL      |
| 大小写问题 | Linux 区分大小写，检查文件名 |
| 图床失效   | 更换图床链接                 |
| CDN 缓存   | 添加版本号 `?v=1.0`          |

### Q4: GitHub Actions 部署失败

**症状**: Actions 工作流执行失败

**解决方案**:

1. 检查 `.github/workflows/deploy.yml` 语法
2. 查看 Actions 运行日志
3. 验证 GitHub Token 权限
4. 检查 Node.js 版本兼容性

```yaml
# 检查 Node 版本
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20" # 与本地版本一致
```

### Q5: 评论系统不显示

**症状**: 评论框不显示

**解决方案**:

1. 检查 `_config.butterfly.yml` 中评论系统配置
2. 验证服务地址是否正确
3. 检查浏览器控制台错误信息
4. 确认评论服务是否正常运行

### Q6: 搜索功能不工作

**症状**: 搜索框无结果

**解决方案**:

```bash
# 1. 重新索引
hexo algolia

# 2. 检查 API Key 权限
# Admin API Key vs Search API Key

# 3. 验证 Index 名称
```

### Q7: 如何迁移博客

**从其他平台迁移到 Hexo**:

```bash
# 1. 导出文章为 Markdown
# WordPress/Jekyll 等支持导出

# 2. 放到 source/_posts/

# 3. 调整图片路径

# 4. 生成并部署
hexo clean && hexo g -d
```

### Q8: 如何备份到新电脑

```bash
# 1. 克隆源码仓库
git clone https://github.com/${用户名}/hexo-blog-source.git
cd hexo-blog-source

# 2. 安装依赖
npm install

# 3. 安装 Hexo CLI
npm install -g hexo-cli

# 4. 测试运行
hexo clean && hexo s
```

## 进阶主题

### 多环境部署

同时部署到多个平台:

```yaml
# _config.yml
deploy:
  - type: git
    repo: https://github.com/${用户名}/${用户名}.github.io.git
    branch: main
  - type: git
    repo: git@gitee.com:${用户名}/${用户名}.git
    branch: master
```

| 平台         | 说明       | 速度       |
| ------------ | ---------- | ---------- |
| GitHub Pages | 全球通用   | 国内一般   |
| Gitee Pages  | 国内访问快 | 需实名认证 |
| Vercel       | CDN 加速   | 快         |
| Netlify      | 预览功能   | 快         |

### 自定义页面

创建独立页面:

```bash
# 创建关于页面
hexo new page about

# 创建分类页面
hexo new page categories

# 创建标签页面
hexo new page tags
```

编辑页面内容:

```markdown
---
title: 关于
date: 2026-01-06 14:00:00
type: about
---

# 关于我

这里是关于页面内容
```

### 数据文件

使用外部数据源:

```yaml
# source/_data/menu.yml
Home: / || fas fa-home
Archives: /archives/ || fas fa-archive
Tags: /tags/ || fas fa-tags
```

配置主题使用:

```yaml
# _config.butterfly.yml
menu:
  from_data: true # 从 menu.yml 读取
```

### 插件开发

自定义 Hexo 插件:

```javascript
// scripts/custom_plugin.js
hexo.extend.helper.register("my_helper", function () {
  return "<p>My Custom Helper</p>";
});

hexo.extend.tag.register(
  "my_tag",
  function (args, content) {
    return '<div class="my-tag">' + content + "</div>";
  },
  { ends: true },
);
```

在模板中使用:

```ejs
<%- my_helper() %>

<% my_tag %>
  内容
<% endmy_tag %>
```

{% btn https://hexo.io/zh-cn/api/, Hexo 插件开发文档, fas fa-code, outline blue %}

## 总结

本文档详细介绍了 Hexo 博客的搭建流程，从环境准备到自动部署，再到主题定制和性能优化. 核心要点:

1. **环境准备**: Node.js + Git 是基础
2. **Hexo 安装**: `hexo init` + `npm install`
3. **主题配置**: Butterfly 推荐用于美观博客
4. **自动部署**: GitHub Actions 实现持续集成
5. **内容管理**: Markdown + Front Matter 规范
6. **性能优化**: 图片 CDN + 缓存 + 压缩
7. **SEO 优化**: 站点地图 + robots.txt

### 快速参考卡片

{% folding green, ⚡ 快速命令参考 %}

```bash
# 初始化
hexo init blog && cd blog && npm install

# 写文章
hexo new "标题"

# 本地预览
hexo clean && hexo s

# 部署
hexo clean && hexo g -d

# 更新主题
cd themes/butterfly && git pull
```

{% endfolding %}

### 推荐文章结构

```
source/_posts/
├── 2026-01-06-hexo-tutorial.md
├── 2026-01-07-javascript-guide.md
└── img/
    ├── cover.jpg
    └── screenshot.png
```

{% btn https://hexo.io/zh-cn/docs/, Hexo 官方文档, fas fa-book, outline blue %}
{% btn https://butterfly.js.org/, Butterfly 主题文档, fas fa-palette, outline purple %}
{% btn https://docs.github.com/en/pages, GitHub Pages 文档, fab fa-github, outline gray %}

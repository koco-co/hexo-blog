---
title: GitHub文档(一) 图床搭建
tags:
  - GitHub
  - PicGo
  - Typora
  - 图床
  - jsDelivr
  - CDN
categories:
  - 工具配置
description: 使用 GitHub + PicGo + Typora + jsDelivr 搭建稳定、免费、高速的图床解决方案。详细介绍仓库配置、PicGo 设置、Typora 集成以及 CDN 加速的完整流程。
abbrlink: b50471d5
cover: >-
  /img/picgo-images/github-picgo.webp
date: 2026-01-06 14:30:00
sticky:
password:
---

## 概述

图床是用于存储和托管图片的云服务, 通过 URL 访问实现图片的在线展示. GitHub 仓库配合 jsDelivr CDN 可以搭建一个稳定、免费、高速的图床服务, 适合个人博客、文档编写等场景.

本文介绍如何使用 GitHub + PicGo + Typora 搭建完整的图床解决方案.

### 核心组件

| 组件         | 作用            | 优势                   |
| ------------ | --------------- | ---------------------- |
| GitHub 仓库  | 图片存储        | 免费无限空间, 版本控制 |
| PicGo        | 上传工具        | 支持多平台, 自动上传   |
| Typora       | Markdown 编辑器 | 所见即所得, 无缝集成   |
| jsDelivr CDN | 内容分发        | 全球加速, HTTP/2 支持  |

{% note info %}
💡 **推荐**: 这套方案完全免费, 适合个人博客和技术文档使用.
{% endnote %}

---

## GitHub 设置

### 1. 创建图片仓库

创建一个 Public 仓库作为图床存储空间.

{% note success %}
✅ **仓库设置**

- 仓库名: `picgo-images` (可自定义)
- 可见性: **Public** (必须公开)
- 初始化: 可选添加 README
  {% endnote %}

{% note warning %}
⚠️ **重要**: 仓库必须设置为公开, 否则 jsDelivr CDN 无法访问.
{% endnote %}

### 访问令牌

GitHub 已于 2021年8月停止支持密码认证, 需要使用 Personal Access Token (PAT) 进行 API 认证.

#### 创建步骤

1. 进入 GitHub **Settings**
2. 点击 **Developer settings**
3. 选择 **Personal access tokens** → **Tokens classic**
4. 点击 **Generate new token (classic)**

#### Token 权限配置

| 权限类别 | 权限名称                 | 用途             |
| -------- | ------------------------ | ---------------- |
| repo     | repo:status              | 读取提交状态     |
| repo     | repo_deployment          | 部署状态         |
| repo     | public_repo              | 访问公开仓库     |
| repo     | repo:invite              | 仓库邀请         |
| workflow | workflow: GitHub Actions | 可选, 如需自动化 |

{% note primary %}
📌 **推荐**: 选择 `repo` 完整权限即可满足图床上传需求.
{% endnote %}

#### 保存 Token

生成后立即复制 Token, 离开页面后将无法再次查看完整内容.

{% note danger %}
🚫 **警告**: 建议将 Token 保存在密码管理器中, 并设置过期时间提醒.
{% endnote %}

{% btn https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens, 查看官方文档, fa-solid fa-book, blue %}

---

## PicGo 配置

### 安装 PicGo

PicGo 是一款开源、跨平台的图床上传工具, 支持多种图床服务.

{% tabs 安装 PicGo, fa-solid fa-download %}

<!-- tab macOS @fab fa-apple -->

```bash
brew install --cask picgo
```

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

```powershell
winget install PicGo.PicGo
```

或从官网下载安装包: [GitHub Releases](https://github.com/Molunerfinn/PicGo/releases)

<!-- endtab -->

<!-- tab Linux @fab fa-linux -->

```bash
# 使用 AppImage
wget https://github.com/Molunerfinn/PicGo/releases/download/v0.9.9/PicGo-0.9.9-x86_64.AppImage
chmod +x PicGo-0.9.9-x86_64_64.AppImage
./PicGo-0.9.9-x86_64_64.AppImage
```

<!-- endtab -->

{% endtabs %}

### GitHub 图床配置

#### 基本配置

在 PicGo 设置中选择 GitHub 图床, 填写以下信息:

| 配置项         | 说明                  | 示例                                                    |
| -------------- | --------------------- | ------------------------------------------------------- |
| 图床配置名     | 标识名称              | Default                                                 |
| 设定仓库名     | `${用户名}/${仓库名}` | `koco-co/picgo-images`                                  |
| 设定分支名     | 默认 main             | `main`                                                  |
| 设定 Token     | 生成的 PAT            | `ghp_xxxxxxxxxxxx`                                      |
| 设定存储路径   | 仓库下的子目录        | `picgo-images/`                                         |
| 设定自定义域名 | jsDelivr CDN 地址     | `https://cdn.jsdelivr.net/gh/koco-co/picgo-images@main` |

![github-picgo图床映射关系](/img/picgo-images/image-20260109212509866.png)

![picgo-github配置项设置](/img/picgo-images/image-20260109211402829.png)

#### 配置示例

```
仓库名: koco-co/picgo-images
分支: main
路径: picgo-images/
CDN: https://cdn.jsdelivr.net/gh/koco-co/picgo-images@main
```

{% note info %}
💡 **提示**: 自定义域名中添加 `@main` 可以锁定版本, 避免分支更新导致的问题.
{% endnote %}

### PicGo 高级设置

#### 代理设置

如果网络环境需要代理, 可在设置中配置:

![代理镜像设置](/img/picgo-images/image-20260109211932335.png)

e.g.

- HTTP 代理: `http://127.0.0.1:7890`
- SOCKS5 代理: `socks5://127.0.0.1:1080`

#### 链接格式

PicGo 支持多种图片链接格式:

| 格式     | 说明      | 示例              |
| -------- | --------- | ----------------- |
| Markdown | 标准格式  | `![alt](url)`     |
| HTML     | HTML 标签 | `<img src="url">` |
| URL      | 纯链接    | `https://...`     |
| UBB      | 论坛格式  | `[img]url[/img]`  |

{% note success %}
✅ **推荐**: 使用 Markdown 格式, 直接适配 Typora.
{% endnote %}

{% btn https://picgo.github.io/PicGo-Doc/zh/guide/config.html, PicGo 官方文档, fa-solid fa-book, purple %}

---

## Typora 集成

### 配置自动上传

Typora 支持 PicGo.app 集成, 实现粘贴图片即上传.

#### 配置步骤

1. 打开 Typora 偏好设置
2. 选择 **图像** 选项
3. 设置 **插入图片时**: **上传图片**
4. **上传服务设定**: **PicGo.app**

#### 配置路径

- **macOS**: `Typora > 偏好设置 > 图像`
- **Windows**: `文件 > 偏好设置 > 图像`

![typora图像设置](/img/picgo-images/image-20260109212708776.png)

### 使用流程

配置完成后, 使用方式非常简单:

{% mermaid %}
graph TD
A[复制/截图] --> B[粘贴到Typora]
B --> C[自动调用PicGo]
C --> D[上传到GitHub]
D --> E[返回CDN链接]
E --> F[替换本地图片]
{% endmermaid %}

{% note success %}
✅ **示例**: 截图后直接在 Typora 中按 `Cmd+V` (macOS) 或 `Ctrl+V` (Windows), 图片自动上传并替换为 CDN 链接.
{% endnote %}

![github图床仓库](/img/picgo-images/image-20260109212959444.png)

---

## jsDelivr CDN 加速

### CDN 配置

jsDelivr 是一款免费的公共 CDN 服务, 支持 GitHub 仓库加速.

#### URL 格式

```
https://cdn.jsdelivr.net/gh/[用户名]/[仓库名]@[分支]/[文件路径]
```

e.g.

```
原始: https://github.com/koco-co/picgo-images/raw/main/picgo-images/image.png
CDN:  https://cdn.jsdelivr.net/gh/koco-co/picgo-images@main/picgo-images/image.png
```

### CDN 优势

| 特性      | 说明                         |
| --------- | ---------------------------- |
| 全球节点  | 中国大陆、美国、欧洲等多节点 |
| HTTP/2    | 多路复用, 提升加载速度       |
| Gzip 压缩 | 自动压缩文本资源             |
| 版本锁定  | 支持 tag/commit/SHA 锁定     |
| 缓存策略  | 智能缓存失效机制             |

### 最佳实践

1. **版本锁定**: 生产环境使用 tag 或 commit SHA

   ```
   https://cdn.jsdelivr.net/gh/koco-co/picgo-images@v1.0.0/image.png
   ```

2. **目录规划**: 按日期或类型组织图片

   ```
   picgo-images/2026/02/
   picgo-images/screenshots/
   ```

3. **文件命名**: 使用有意义的前缀
   ```
   20260210-typora-setting.png
   github-pat-create.png
   ```

{% note warning %}
⚠️ **注意**: jsDelivr 对 GitHub 仓库有请求频率限制, 建议避免短时间内大量请求.
{% endnote %}

{% btn https://www.jsdelivr.com/, jsDelivr官方文档, fa-solid fa-globe, blue %}
{% btn https://blog.csdn.net/qq_51335325/article/details/149783808, jsDelivr CDN 完全指南, fa-solid fa-book, purple %}

---

## 进阶用法

### 多图床配置

PicGo 支持配置多个图床, 实现负载均衡或备份.

e.g.

- 主图床: GitHub + jsDelivr
- 备份图床: 阿里云 OSS
- 测试图床: 七牛云

### 快捷键配置

在 PicGo 中设置全局快捷键:

| 功能       | macOS         | Windows        |
| ---------- | ------------- | -------------- |
| 上传剪贴板 | `Cmd+Shift+U` | `Ctrl+Shift+U` |
| 打开主窗口 | `Cmd+Shift+O` | `Ctrl+Shift+O` |

### 命令行上传

PicGo 提供命令行接口, 支持脚本自动化.

e.g.

```bash
# 上传单个文件
picgo upload /path/to/image.png

# 上传多个文件
picgo upload /path/to/images/*.png

# 从剪贴板上传
picgo upload
```

{% btn https://picgo.github.io/PicGo-Doc/zh/guide/advance.html, PicGo CLI 文档, fa-solid fa-terminal, purple %}

---

## 常见问题

### 1. Token 验证失败

**症状**: PicGo 提示 Token 无效

**解决方案**:

- 检查 Token 是否过期
- 确认 Token 包含 `repo` 权限
- 重新生成 Token 并更新配置

### 2. 图片上传失败

**症状**: 上传卡住或返回错误

**可能原因**:

- 网络连接问题
- GitHub API 限流
- Token 权限不足

**解决方案**:

- 配置代理服务器
- 检查 GitHub API 剩余配额
- 验证 Token 权限

### 3. CDN 访问慢

**症状**: 图片加载缓慢

**优化方案**:

- 等待 CDN 缓存生效 (首次访问较慢)
- 使用国内 CDN 替代方案 (如 Cloudflare)
- 检查图片文件大小, 考虑压缩

### 4. 仓库大小限制

**症状**: 单个文件超过 100MB 无法上传

**解决方案**:

- GitHub 单文件限制 100MB
- 使用图片压缩工具 (TinyPNG, ImageOptim)
- 考虑使用其他图床服务

{% note info %}
💡 **提示**: GitHub 仓库总大小建议不超过 1GB, 超过会影响克隆速度.
{% endnote %}

---

## 最佳实践

### 安全性

- ❌ 不要将 Token 写入公开文档
- ✅ 使用环境变量存储敏感信息
- ✅ 定期轮换 Token (建议 90 天)
- ✅ 为 Token 设置最小权限原则

### 性能优化

| 优化项      | 说明              | 效果             |
| ----------- | ----------------- | ---------------- |
| 图片压缩    | 使用 TinyPNG 压缩 | 减少 50-70% 体积 |
| WebP 格式   | 现代浏览器支持    | 比 PNG 小 30%    |
| 渐进式 JPEG | 逐步加载          | 提升感知速度     |
| 懒加载      | 滚动时加载        | 减少初始请求数   |

### 工作流建议

1. **写作前**: 创建专用文件夹
2. **写作中**: 截图后直接粘贴上传
3. **完成后**: 验证图片链接有效性
4. **发布前**: 备份仓库到本地

---

## 参考资料

{% btn https://github.com/Molunerfinn/PicGo, PicGo GitHub, fa-brands fa-github, purple %}
{% btn https://picgo.github.io/PicGo-Doc/, PicGo 官方文档, fa-solid fa-book, blue %}
{% btn https://support.typora.io/, Typora 官方文档, fa-solid fa-book, purple %}
{% btn https://www.testerhome.com/topics/41952, PicGo 配置教程, fa-solid fa-globe, green %}
{% btn https://penry.asia/article/Tools-1/, PicGo + GitHub 图床教程, fa-solid fa-link, orange %}

<div align="center">

# Sisyphus Vale

<img src="source/img/sisyphus-vale-avatar.png" alt="Sisyphus Vale 站点头像" width="160">

基于 Hexo 与 Butterfly 的个人技术博客

[![Hexo](https://img.shields.io/badge/Hexo-8.1.2-0E83CD?style=flat-square&logo=hexo&logoColor=white)](https://hexo.io/)
[![Butterfly](https://img.shields.io/badge/Butterfly-5.7.0-49B1F5?style=flat-square)](https://github.com/jerryc127/hexo-theme-butterfly)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.19-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

[访问在线博客](https://koco-co.github.io/)

</div>

## 项目简介

本仓库维护博客源码、配置、本地图片、自定义前端代码和可验证的 Agent 工作流。站点保持传统时间流首页，并在 Butterfly 上提供本地搜索、暗色模式、阅读模式、文章加密、标签外挂和系统课程复习能力。

- 运行主题唯一来源为 npm 包 `hexo-theme-butterfly`。
- 评论、音乐和视频在访客主动点击后才连接第三方服务。
- 图片优先随源码存放在 `source/img/picgo-images/`。
- GitHub Actions 校验源码后，将 `public/` 发布到独立成品仓库。
- 部署、清理、提交和推送均不属于普通维护的默认副作用。

## 快速开始

准备 Node.js 20.19 或更高版本和 npm：

```bash
npm ci
npm run server
```

默认预览地址为 `http://localhost:4000`。依赖版本由 `package-lock.json` 锁定。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run server` | 启动本地预览 |
| `npm run build` | 生成 `public/`；可能写入文章 `abbrlink` |
| `npm run clean` | 清理生成物，仅在明确授权后执行 |
| `node .agents/scripts/audit.mjs lint --json` | 执行全仓库九类检查 |
| `node .agents/scripts/audit.mjs content --release --json` | 执行发布级内容检查 |
| `node .agents/scripts/audit.mjs release --route ci --json` | 检查 CI 发布目标与门禁 |
| `node .agents/scripts/audit.mjs release --route local --json` | 检查本地应急部署路径 |
| `node --test .agents/scripts/audit.test.mjs` | 验证审计工具契约 |

完整命令见 [`AGENTS.md`](AGENTS.md)。只有全仓库 lint 返回 `status: pass` 才可交付验收。

## 内容维护

文章位于 `source/_posts/`。新文章可使用 Hexo scaffold 创建：

```bash
./node_modules/.bin/hexo new "文章标题"
```

生成后必须替换 scaffold 中的“待补充”字段，并保证 Front Matter 至少包含：

```yaml
---
title: 文章标题
tags:
  - 标签
categories:
  - 分类
description: 一句话摘要
date: YYYY-MM-DD HH:mm:ss
---
```

新增图片保存到 `source/img/picgo-images/`，正文使用 `/img/picgo-images/<文件名>`。迁移来源和原始文件完整性记录在 `tools/hexo-blog/image-migration-map.json`。

## 目录结构

| 路径 | 职责 |
| --- | --- |
| `source/_posts/` | 文章源文件；普通指南位于 `guides/`，系统课程位于 `learn-topic/` |
| `source/*/index.md` | 关于、分类、标签、音乐、视频、友链等独立页面 |
| `source/img/picgo-images/` | 本地正文图片与封面 |
| `source/css/`、`source/js/` | 根项目拥有的主题覆盖与交互 |
| `_config.yml` | Hexo、永久链接和本地应急部署配置 |
| `_config.butterfly.yml` | Butterfly 覆盖配置与资源注入 |
| `.agents/scripts/` | 审计 CLI 和测试 |
| `.agents/skills/` | 项目级 Skill 的唯一维护源 |
| `themes/butterfly-legacy/` | 已停用的历史主题工作树，仅供比对，不参与运行或 lint |
| `public/`、`db.json`、`.deploy_git/` | 生成物或部署状态，不手工维护 |

## Agent 工作流

- [`hexo-blog-maintenance`](.agents/skills/hexo-blog-maintenance/SKILL.md)：文章、页面、配置、前端与验证。
- [`hexo-learn-topic`](.agents/skills/hexo-learn-topic/SKILL.md)：系统课程调研、契约和逐篇创作。
- [`hexo-blog-deploy`](.agents/skills/hexo-blog-deploy/SKILL.md)：仅在明确要求发布时进入。

`AGENTS.md` 是项目指令唯一正文；`CLAUDE.md` 和 `.claude/skills/` 仅保留相对符号链接。

## CI 发布

`.github/workflows/deploy.yml` 在 `main` 分支执行以下流程：

1. 安装锁定依赖；
2. 运行全仓库 lint 和审计测试；
3. 构建站点并再次执行 lint；
4. 执行 CI 发布预检；
5. 将 `./public` 发布到 `koco-co/koco-co.github.io` 的 `main` 分支。

首次启用跨仓库发布时，需要仓库管理员完成一次 GitHub 配置：

1. 创建专用 SSH Deploy Key；
2. 将公钥添加到成品仓库的 Deploy keys，并仅授予该仓库写权限；
3. 将私钥保存为源码仓库 Actions Secret `PAGES_DEPLOY_KEY`。

本仓库不会自动创建远程 Secret，也不会在未授权时推送或发布。`npm run deploy` 只保留为经过部署 Skill 预检和单独授权的本地应急路径。

## 验证层级

静态审计、测试、构建、浏览器回归、GitHub Actions 和线上页面是不同证据层。视觉或交互变更还需在真实浏览器检查目标路由、桌面与移动视口、按需加载状态、减动效偏好和控制台错误。

## 许可证

根项目当前未声明开源许可证。复用文章、配置、自定义代码或图片前，请先向项目所有者确认授权范围。npm 依赖各自适用其上游许可证。

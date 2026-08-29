---
title: Claude文档(一) Claude Code 安装配置
tags:
  - Claude-Code
  - GLM-4.7
  - Terminal
categories:
  - AI开发
  - 开发工具
description: Claude Code 是 Anthropic 推出的终端驻留式 AI 编程代理工具, 能够完整理解代码库上下文, 通过自然语言指令完成代码阅读、生成、修改、git 操作等任务。本文详细介绍其安装配置、认证方式及国内用户接入 GLM-4.7 的实践方案。
abbrlink: 8982d5cb
date: 2026-02-05 15:07:36
cover: /img/picgo-images/claudecode-install.webp
sticky:
---

## 概述

Claude Code 是 Anthropic 推出的终端驻留式 AI 编程代理工具, 能够完整理解代码库上下文, 通过自然语言指令完成代码阅读、生成、修改、git 操作等任务。

{% btn https://code.claude.com, Claude Code 官网,  fa-solid fa-globe, purple %}

### 核心特性

- **智能代码库理解**: 使用 agent 搜索理解整个代码库结构, 无需手动选择上下文文件
- **多文件协作**: 能够在多个文件间协调修改, 保持代码一致性
- **原生工具集成**: 支持所有 CLI 工具, 包括 Git、包管理器、构建系统等
- **安全可控**: 修改文件前始终请求权限, 不会意外破坏代码
- **多平台支持**: 可在终端、VS Code、JetBrains IDEs 和浏览器中使用

### 适用场景

- 中大型项目的重构和特性开发
- 理解遗留代码和复杂业务逻辑
- 自动化测试生成和 bug 修复
- 跨文件代码迁移和架构调整
- 文档生成和代码审查

{% note success %}
✅ **效率提升**: 相比传统代码补全工具, Claude Code 更像一个可执行多步计划的"同事", 能够将编码效率提升 2-4 倍。
{% endnote %}

---

## 安装配置

Claude Code 官方推荐使用原生二进制安装方式(npm 方式已标记 deprecated)。

### 系统要求

- **Node.js**: 18.0 或更高版本
- **操作系统**: macOS、Linux(含 WSL2)、Windows
- **网络**: 需要访问 Anthropic API 或兼容服务

### 安装方法

{% tabs 安装方式, icon:fa-solid fa-download %}

<!-- tab macOS @fab fa-apple -->

**方法一: Homebrew 安装(推荐)**

```bash
# 确保 brew 已更新
brew update

# 安装 Claude Code(会自动拉取最新稳定版)
brew install --cask claude-code
```

{% note info %}
💡 Homebrew 会自动配置 PATH 环境变量, 无需手动配置。
{% endnote %}

**方法二: 官方安装脚本**

```bash
# 下载并执行安装脚本(会放置在 /usr/local/bin/claude)
curl -fsSL https://claude.ai/install.sh | bash
```

{% note warning %}
⚠️ 如果使用 nvm 安装 Node.js, 可能会遇到权限问题, 建议使用 Homebrew 方式。
{% endnote %}

<!-- endtab -->

<!-- tab Ubuntu/Debian/WSL @fab fa-linux -->

**使用官方安装脚本(推荐)**

```bash
# 下载并执行安装脚本(会放置在 ~/.local/bin/claude)
curl -fsSL https://claude.ai/install.sh | bash

# 添加到 PATH(如果尚未添加)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**使用 Node.js 全局安装(备用方案)**

```bash
# 确保 Node.js >= 18
node --version

# 全局安装 Claude Code
npm install -g @anthropic-ai/claude-code
```

{% note info %}
💡 npm 方式需要确保有全局 npm 权限, 避免使用 sudo。
{% endnote %}

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

**推荐方案: WSL2 + Ubuntu**

```powershell
# 在 PowerShell 中安装 WSL2
wsl --install

# 安装完成后, 在 WSL Ubuntu 中按上述 Linux 方式安装
```

**原生 Windows 支持(实验性)**

```powershell
# 使用 PowerShell 安装脚本
irm https://claude.ai/install.ps1 | iex
```

{% note warning %}
⚠️ 原生 Windows 支持仍在完善中, 稳定性与生态完整度建议走 WSL。
{% endnote %}

<!-- endtab -->

{% endtabs %}

### 验证安装

安装完成后验证:

```bash
claude --version
# 应输出版本号, 如 v2.0.14
```

如果输出了版本号, 说明安装成功。

{% link Claude Code 安装文档, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}

### IDE 扩展

如果需要在 IDE 中使用 Claude Code:

{% tabs IDE扩展, icon:fa-solid fa-laptop-code %}

<!-- tab VS Code @fas fa-file-code %}

1. 在 VS Code 扩展市场搜索 "Claude Code"
2. 安装官方扩展
3. 在命令面板(Cmd/Ctrl + Shift + P)中选择 "Claude Code: Start"

<!-- endtab -->

<!-- tab JetBrains IDEs @fas fa-code %}

1. 在插件市场搜索 "Claude Code"
2. 安装并重启 IDE
3. 从 Tools 菜单启动 Claude Code

<!-- endtab -->

{% endtabs %}

{% note info %}
💡 IDE 扩展提供可视化 diff 对比, 适合需要频繁查看代码变更的场景。
{% endnote %}

---

## 认证配置

Claude Code 支持三种主要认证模式:

{% tabs 认证方式, icon:fa-solid fa-key %}

<!-- tab Claude Pro/Max @fas fa-user %}

```bash
claude login
# 浏览器打开 claude.ai 登录后授权
```

**优点**:
- 免维护 token, 额度与网页版统一
- 无需手动管理 API Key

**缺点**:
- 国内网络可能不稳定
- 依赖 Anthropic 官方服务

**适用场景**: 新手入门, 网络稳定环境

<!-- endtab -->

<!-- tab Anthropic API Key @fas fa-key %}

```bash
# 设置环境变量
export ANTHROPIC_API_KEY=sk-ant-xxx...

# 或写入 shell 配置文件(~/.bashrc 或 ~/.zshrc)
echo 'export ANTHROPIC_API_KEY=sk-ant-xxx...' >> ~/.zshrc
source ~/.zshrc

# 启动 Claude Code
claude
```

**优点**:
- 使用已有 API Key
- 灵活控制计费

**缺点**:
- 需要手动管理 Key
- 国内网络不稳定

**适用场景**: 已有 Anthropic Console 账号的用户

<!-- endtab -->

<!-- tab 第三方兼容服务(推荐) @fas fa-cloud %}

以智谱 GLM-4.7 为例(z.ai 或 bigmodel.cn 提供的 Anthropic 兼容接口):

**临时环境变量方式(推荐测试)**

```bash
# 设置 Base URL 和 API Key
export ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic/v1
export ANTHROPIC_API_KEY=sk-你的智谱key...

# 启动 Claude Code
claude
```

**永久配置方式**

将以下内容写入 `~/.bashrc` 或 `~/.zshrc`:

```bash
# GLM-4.7 配置
export ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic/v1
export ANTHROPIC_API_KEY=sk-你的智谱key...
```

{% note success %}
✅ **推荐**: 智谱 GLM-4.7 代码能力已接近甚至部分场景超过 Claude-3.5-Sonnet, 且价格仅为其 1/5–1/10, 是目前性价比最高的 Claude Code 模型替换方案。
{% endnote %}

{% link 智谱 GLM-4.7 接入指南, https://docs.z.ai/scenario-example/develop-tools/claude, https://docs.z.ai/favicon.ico %}

<!-- endtab -->

{% endtabs %}

### 创建多模型 alias

建议创建不同模型的 alias, 方便快速切换:

```bash
# ~/.bashrc 或 ~/.zshrc

# 官方 Claude(需要代理)
alias claude-claude="ANTHROPIC_BASE_URL=https://api.anthropic.com ANTHROPIC_API_KEY=sk-ant-... claude"

# 智谱 GLM-4.7
alias claude-glm="ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic/v1 ANTHROPIC_API_KEY=sk-xxx claude"

# z.ai GLM-4.7
alias claude-zai="ANTHROPIC_BASE_URL=https://api.z.ai/v1 ANTHROPIC_API_KEY=sk-xxx claude"

# 应用配置
source ~/.bashrc  # 或 source ~/.zshrc
```

使用示例:

```bash
# 使用官方 Claude
claude-claude

# 使用智谱 GLM-4.7
claude-glm

# 使用 z.ai GLM-4.7
claude-zai
```

---

## 模型选择与优化配置

### 模型映射

Claude Code 使用三种模型层级:

| 模型       | 用途         | GLM-4.7 映射 | 特点                       |
| ---------- | ------------ | ------------ | -------------------------- |
| **Haiku**  | 轻量级任务   | glm-4.5-air  | 快速响应, 适合简单查询     |
| **Sonnet** | 主要开发工作 | glm-4.7      | 平衡性能与速度             |
| **Opus**   | 复杂推理任务 | glm-4.7      | 最强能力, 适合复杂架构设计 |

{% note info %}
💡 GLM-4.7-long 上下文更稳定, 适合超过 100k token 的巨型代码库分析。
{% endnote %}

### 配置 GLM-4.7 模型映射

修改 `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7"
  }
}
```

### 推荐配置组合

{% tabs 配置方案, icon:fa-solid fa-cog %}

<!-- tab 纯GLM-4.7性价比模式 @fas fa-bolt %}

```bash
# ~/.bashrc 或 ~/.zshrc

# 使用 GLM-4.7 作为主模型
export ANTHROPIC_DEFAULT_SONNET_MODEL=glm-4.7
export ANTHROPIC_DEFAULT_OPUS_MODEL=glm-4.7

# 增加输出 token 限制(建议开大)
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000

# 减少无关日志
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

**适用场景**:
- 成本敏感项目
- 中小型代码库
- 日常开发工作

<!-- endtab -->

<!-- tab 混合Claude+GLM @fas fa-exchange-alt %}

```bash
# 优先使用官方 Claude, 失败则 fallback 到 GLM
export ANTHROPIC_BASE_URL=https://api.anthropic.com
export ANTHROPIC_API_KEY=sk-ant-xxx...
export ANTHROPIC_BASE_URL_FALLBACK=https://open.bigmodel.cn/api/anthropic
export ANTHROPIC_API_KEY_FALLBACK=sk-glm-xxx...
```

**适用场景**:
- 网络不稳定环境
- 需要保证可用性
- 成本与性能平衡

<!-- endtab -->

<!-- tab 长上下文GLM-4.7 @fas fa-database %}

```bash
# 使用长上下文版本
export ANTHROPIC_DEFAULT_SONNET_MODEL=glm-4.7-long
export ANTHROPIC_DEFAULT_OPUS_MODEL=glm-4.7-long
```

**适用场景**:
- 超大型代码库(>100k token)
- 复杂跨文件分析
- 全局重构任务

<!-- endtab -->

{% endtabs %}

### 验证模型配置

启动 Claude Code 后, 使用 `/status` 命令查看当前模型状态:

```bash
claude
# 在 Claude Code 交互界面中
claude > /status
```

应显示类似:

```
Current Model: glm-4.7
Base URL: https://open.bigmodel.cn/api/anthropic/v1
```

---

## 快速开始

### 启动 Claude Code

进入任意项目目录, 直接启动:

```bash
cd ~/projects/my-app
claude
```

出现 `claude >` 提示符即成功。

### 首次使用授权

首次启动时, Claude Code 会请求文件访问权限:

```
Claude Code wants to access files in /Users/xxx/projects/my-app
[Allow] [Deny]
```

选择 **Allow** 以授予访问权限。

{% note warning %}
⚠️ 如果误选了 Deny, 可以在 `~/.claude/settings.json` 中删除相关路径配置。
{% endnote %}

### 基础测试指令

**使用 /ask 指令(不修改文件)**

```
/ask 当前项目使用什么语言? package.json 和 requirements.txt 里主要依赖是什么?
```

**使用自然语言指令**

```
帮我分析 src/components 目录下所有组件的作用和关系
```

正常情况下 5–15 秒内会返回带文件树和关键代码引用的分析。

### 查看帮助信息

```
/help
```

会列出所有可用指令和快捷键。

---

## 核心功能使用

### Slash Commands

Claude Code 使用 `/` 开头的 slash command 与纯自然语言两种交互方式。

常用内置指令:

| 指令        | 作用                    | 示例                                        |
| ----------- | ----------------------- | ------------------------------------------- |
| `/ask`      | 提问(不修改文件)        | `/ask 这个函数的性能瓶颈可能在哪里?`        |
| `/generate` | 生成新文件或代码片段    | `/generate 创建一个用户登录的 RESTful 接口` |
| `/edit`     | 修改已有文件            | `/edit 在 auth.js 中添加 JWT 刷新逻辑`      |
| `/run`      | 执行 shell 命令(需确认) | `/run npm test`                             |
| `/git`      | git 操作                | `/git commit -m "feat: add login endpoint"` |
| `/model`    | 查看&切换当前模型       | `/model list`                               |
| `/status`   | 查看当前状态            | `/status`                                   |
| `/clear`    | 清空对话历史            | `/clear`                                    |
| `/help`     | 完整指令列表            | `/help`                                     |

{% note info %}
💡 `/ask` 指令适合探索性提问, 不会修改任何文件。
{% endnote %}

### 典型使用场景

#### 1. 快速理解陌生项目

```
给我一份这个仓库的架构概览, 重点标注入口文件和核心模块
```

Claude Code 会:

- 扫描项目结构
- 分析 package.json/requirements.txt
- 识别主要模块和依赖关系
- 生成架构概览

e.g.

```bash
claude > 给我一份这个仓库的架构概览, 重点标注入口文件和核心模块

# Claude Code 会分析并输出类似:
- 入口文件: src/index.ts
- 核心模块:
  - src/auth/: 认证模块
  - src/api/: API 路由
  - src/utils/: 工具函数
  - src/components/: React 组件
```

#### 2. 批量生成测试用例

```
在 __tests__ 目录下为所有 utils/*.ts 文件生成 jest 测试用例, 覆盖率目标 90%
```

Claude Code 会:

- 读取所有 utils 文件
- 分析函数签名和逻辑
- 生成完整的测试用例
- 确保覆盖率达标

e.g.

```bash
claude > 在 __tests__ 目录下为所有 utils/*.ts 文件生成 jest 测试用例

# Claude Code 会:
1. 分析 src/utils/format.ts, src/utils/validate.ts 等
2. 生成 __tests__/format.test.ts, __tests__/validate.test.ts
3. 包含边界测试、错误处理测试
```

#### 3. 跨文件重构

```
把所有 class 组件统一改写为 function component + hooks, 改动尽量原子化, 每个文件单独 commit
```

Claude Code 会:

- 找到所有 class 组件
- 逐个改写为 hooks
- 每改完一个文件提交一次
- 保持代码风格一致

e.g.

```bash
claude > 把所有 class 组件改写为 function component + hooks, 每个文件单独 commit

# Claude Code 会:
1. 搜索所有 class 组件
2. 逐个改写为 hooks
3. 运行 git commit 对每个文件单独提交
```

#### 4. 自动修复 lint & type 错误

```
运行 tsc --noEmit 后把所有报错修复掉, 必要时添加类型声明
```

Claude Code 会:

- 运行 TypeScript 编译器
- 分析所有错误
- 自动修复或添加类型声明
- 验证修复结果

e.g.

```bash
claude > 运行 tsc --noEmit 后修复所有类型错误

# Claude Code 会:
1. 执行 tsc --noEmit
2. 分析错误列表
3. 逐个修复类型错误
4. 再次运行 tsc 验证
```

{% note warning %}
⚠️ GLM-4.7 在多轮工具调用连续性上稍逊官方 Sonnet 模型, 复杂任务建议在 prompt 里明确写 "step by step, don't stop until finished"。
{% endnote %}

### 使用技巧

#### 明确指令

❌ 模糊指令:

```
帮我优化一下代码
```

✅ 明确指令:

```
把 src/api/user.ts 中的所有 Promise 链改写为 async/await, 保持错误处理逻辑不变
```

#### 分步执行

对于复杂任务, 分步执行效果更好:

```
# 第一步: 分析问题
/ask 这个项目中的类型错误主要集中在哪些文件?

# 第二步: 修复问题
修复 src/api/auth.ts 中的所有类型错误, 添加必要的类型声明

# 第三步: 验证结果
/run npm run type-check
```

#### 交互式确认

Claude Code 在执行危险操作前会请求确认:

```
⚠️  Claude Code will delete the following files:
- src/old-component.tsx
- src/old-utils.ts

Continue? [y/N]
```

{% note danger %}
🚫 始终仔细查看变更内容, 特别是删除操作。
{% endnote %}

---

## 进阶功能

### MCP 工具扩展

Claude Code 支持 MCP(Model Context Protocol)服务器扩展能力, 可以增强其功能:

#### 常用 MCP 服务器

**文件系统 MCP**(深度文件操作)

```bash
# 添加文件系统 MCP(常用于大项目索引)
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem .
```

**浏览器自动化 MCP**(让 Claude 自己查文档)

```bash
# 添加 Puppeteer MCP
claude mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer
```

**搜索增强 MCP**

```bash
# 添加 Brave Search MCP
claude mcp add brave-search -- npx -y @modelcontextprotocol/server-brave-search
```

**GitHub MCP**

```bash
# 添加 GitHub MCP(集成 GitHub API)
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

{% note info %}
💡 MCP 服务器需要额外的配置和认证, 参考 [MCP 官方文档](https://docs.anthropic.com/en/docs/build-with-claude/mcp)。
{% endnote %}

#### 查看/移除 MCP

```bash
# 查看已安装的 MCP
claude mcp list

# 移除 MCP 服务器
claude mcp remove <mcp-name>
```

{% link MCP 官方文档, https://docs.anthropic.com/en/docs/build-with-claude/mcp, https://docs.anthropic.com/favicon.ico %}

### 自定义配置

#### 配置文件位置

- **全局配置**: `~/.claude/settings.json`
- **项目配置**: `.claude/settings.json`

#### 常用配置项

```json
{
  // 模型配置
  "env": {
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": 64000,
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": 1
  },

  // 允许的工具
  "allowedTools": ["Read", "Write", "Edit", "Bash", "Git"],

  // 禁用的工具
  "disabledTools": [],

  // 自动确认操作(谨慎使用)
  "dangerouslySkipPermissions": false,

  // 自定义系统提示
  "systemPrompt": "你是一个专业的全栈工程师..."
}
```

{% note danger %}
🚫 `dangerouslySkipPermissions` 会跳过所有权限确认, 仅在完全信任的环境中使用。
{% endnote %}

### 环境变量配置

除了在 `~/.claude/settings.json` 中配置, 也可以使用环境变量:

```bash
# ~/.bashrc 或 ~/.zshrc

# API 配置
export ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic/v1
export ANTHROPIC_API_KEY=sk-xxx...

# 模型配置
export ANTHROPIC_DEFAULT_SONNET_MODEL=glm-4.7
export ANTHROPIC_DEFAULT_OPUS_MODEL=glm-4.7

# 性能配置
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# 代理配置(如需要)
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
```

{% note info %}
💡 环境变量优先级高于 `settings.json`。
{% endnote %}

---

## 最佳实践

### 工作流程

#### 1. 需求分析阶段

使用 `/ask` 探索问题:

```
/ask 这个项目的认证流程是如何实现的? 涉及哪些文件?
```

#### 2. 方案设计阶段

让 Claude Code 提供多个方案:

```
给出三种重构数据库查询的方案, 对比优劣和实现难度
```

#### 3. 实现阶段

使用明确的指令:

```
创建 src/utils/db.ts, 实现方案一中的数据库连接池, 使用 TypeORM
```

#### 4. 测试阶段

自动生成测试:

```
为 src/utils/db.ts 生成完整的单元测试, 覆盖所有分支
```

#### 5. 提交阶段

使用 `/git` 提交:

```
/git add .
/git commit -m "feat: implement database connection pool"
```

### 提示词工程

#### 好的提示词特征

- **具体明确**: 指定文件名、函数名、具体行为
- **上下文完整**: 提供必要的背景信息
- **约束清晰**: 说明不能做什么
- **可验证**: 有明确的验收标准

e.g. 好的提示词:

```
在 src/api/auth.ts 中添加 JWT token 刷新功能:
1. 使用 jsonwebtoken 库
2. 实现 refresh() 函数, 接收旧 token, 返回新 token
3. 添加过期时间检查, 过期返回 401
4. 保持现有的 login() 和 logout() 函数不变
5. 添加类型声明
```

#### 不好的提示词特征

❌ 模糊:

```
优化一下认证代码
```

❌ 缺少上下文:

```
添加一个新功能
```

❌ 约束不清:

```
重构这个文件, 但不要改太多
```

### 团队协作

#### 统一配置

在项目根目录创建 `.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7"
  },
  "systemPrompt": "这是团队 X 的项目, 遵循以下编码规范:..."
}
```

#### 文档化使用规范

创建 `CLAUDE.md` 文件:

```markdown
# Claude Code 使用规范

## 常用指令

## 项目结构

## 编码规范

## 测试要求
```

{% note success %}
✅ 将 `.claude/` 和 `CLAUDE.md` 加入版本控制。
{% endnote %}

### 性能优化

#### 减少上下文加载

使用具体路径而非通配符:

❌ 不好:

```
分析所有组件文件
```

✅ 好:

```
分析 src/components/Auth/Login.tsx 和 src/components/Auth/Register.tsx
```

#### 使用轻量模型

简单查询使用 Haiku:

```
/model haiku
/ask 这个函数的作用是什么?
```

#### 清理历史记录

定期清理对话历史:

```
/clear
```

{% note warning %}
⚠️ 长对话会占用大量 token, 影响响应速度。
{% endnote %}

### 安全建议

#### 不要泄露敏感信息

❌ 危险:

```
这是一个生产环境的数据库配置, host=prod-db.example.com, user=admin, password=xxx, 帮我优化查询
```

✅ 安全:

```
优化以下数据库查询, 使用参数化查询防止 SQL 注入:
[提供脱敏后的查询代码]
```

#### 审查生成的代码

Claude Code 生成的代码需要:

1. 安全审查(SQL 注入、XSS、CSRF 等)
2. 性能测试(时间复杂度、资源使用)
3. 边界测试(异常输入、并发场景)

{% note danger %}
🚫 不要直接在生产环境使用生成的代码。
{% endnote %}

#### 权限管理

使用 `allowedTools` 限制可用工具:

```json
{
  "allowedTools": ["Read", "Edit", "Grep"],
  "disabledTools": ["Bash", "Git"]
}
```

---

## 常见问题

### 安装问题

{% folding blue, Q: brew 安装后找不到 claude 命令 %}

检查 PATH 配置:

```bash
# 查看 PATH
echo $PATH

# 应包含 /opt/homebrew/bin (Apple Silicon) 或 /usr/local/bin (Intel)
# 如果没有, 添加到 ~/.zshrc
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

{% endfolding %}

{% folding blue, Q: npm 安装后权限不足 %}

不要使用 sudo, 使用 nvm 安装 Node.js:

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 使用 nvm 安装 Node.js
nvm install 18
nvm use 18

# 重新安装 Claude Code
npm install -g @anthropic-ai/claude-code
```

{% endfolding %}

### 认证问题

{% folding yellow, Q: 提示 "Invalid API key" %}

检查环境变量:

```bash
# 查看 API Key
echo $ANTHROPIC_API_KEY

# 应该输出 sk- 开头的 key
# 如果为空, 检查配置文件
cat ~/.zshrc | grep ANTHROPIC
```

{% endfolding %}

{% folding yellow, Q: 网络超时 %}

配置代理或使用国内服务:

```bash
# 方案一: 配置代理
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

# 方案二: 使用智谱 GLM-4.7
export ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic/v1
export ANTHROPIC_API_KEY=sk-xxx...
```

{% endfolding %}

### 配置问题

{% folding green, Q: 修改 settings.json 后不生效 %}

重启 Claude Code:

```bash
# 关闭所有 Claude Code 窗口
# 重新打开终端
claude
```

如果还不生效, 检查 JSON 格式:

```bash
# 验证 JSON 格式
cat ~/.claude/settings.json | python -m json.tool
```

{% endfolding %}

{% folding green, Q: 模型切换失败 %}

检查模型名称:

```bash
# 查看当前模型
claude > /status

# 查看可用模型
claude > /model list
```

确保模型名称正确:

- Haiku: `glm-4.5-air`
- Sonnet: `glm-4.7`
- Opus: `glm-4.7`
  {% endfolding %}

### 使用问题

{% folding cyan, Q: 响应速度慢 %}

可能的原因和解决方案:

1. **代码库太大**: 使用具体路径而非通配符
2. **输出 token 限制太小**: 增加 `CLAUDE_CODE_MAX_OUTPUT_TOKENS`
3. **网络慢**: 配置代理或使用国内服务
4. **模型太重**: 切换到 Haiku 处理简单任务
   {% endfolding %}

{% folding cyan, Q: 生成的代码有错误 %}

提供更详细的上下文:

```
# 不好
修复这个 bug

# 好
修复以下 bug: 当用户名包含中文时, 登录失败.
文件: src/api/auth.ts
函数: login()
错误信息: "Invalid username"
期望行为: 支持中文用户名
```

{% endfolding %}

{% folding cyan, Q: 如何回滚 Claude Code 的修改 %}

使用 Git:

```bash
# 查看变更
git diff

# 撤销未提交的修改
git checkout -- <file>

# 回滚已提交的修改
git revert <commit-hash>
```

P.S. Claude Code 的所有操作都会经过 Git, 可以随时回滚。
{% endfolding %}

### MCP 问题

{% folding red, Q: MCP 服务器无法连接 %}

检查 MCP 配置:

```bash
# 查看 MCP 列表
claude mcp list

# 查看 MCP 日志
claude mcp logs <mcp-name>
```

常见问题:

- 端口被占用: 更换端口
- 认证失败: 检查 API Key
- 网络不通: 配置代理
  {% endfolding %}

---

## 参考资料

### 官方文档

{% link Claude Code 官网, https://code.claude.com, https://code.claude.com/favicon.ico %}

{% link Claude Code 开发者文档, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}

{% link MCP 协议规范, https://docs.anthropic.com/en/docs/build-with-claude/mcp, https://docs.anthropic.com/favicon.ico %}

{% link Claude API 文档, https://docs.anthropic.com/en/api/index, https://docs.anthropic.com/favicon.ico %}

### 社区资源

{% link anthropics/claude-code, https://github.com/anthropics/claude-code, https://github.com/favicon.ico %}

{% link MCP 服务器列表, https://github.com/modelcontextprotocol, https://github.com/favicon.ico %}

### 国内资源

{% link 智谱 GLM-4.7 接入指南, https://docs.z.ai/scenario-example/develop-tools/claude, https://docs.z.ai/favicon.ico %}

{% link 智谱 AI 开放平台, https://open.bigmodel.cn, https://cdn.bigmodel.cn/static/logo/dark.svg %}

{% link z.ai 文档, https://docs.z.ai, https://docs.z.ai/favicon.ico %}

### 相关工具

{% link Cursor IDE, https://cursor.sh, https://cursor.sh/favicon.ico %}

{% link Windsurf IDE, https://windsurf.ai, https://windsurf.ai/favicon.ico %}

{% link Aider, https://aider.chat, https://aider.chat//assets/logo.svg %}

---

{% note success %}
✅ 到这里, Claude Code 的安装、认证、GLM-4.7 接入与基本使用已完整搭建完成。下一篇文章将重点介绍如何基于此环境实现多模型动态路由、自定义 agent 行为, 以及在真实业务项目中的最佳实践。
{% endnote %}

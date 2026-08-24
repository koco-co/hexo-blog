---
title: OpenCode 安装配置
tags:
  - OpenCode
  - 编程助手
  - CLI
  - Plugin
  - Oh-My-OpenCode
categories:
  - AI开发
  - 开发工具
description: OpenCode 开源 AI 编程助手完整使用攻略，涵盖安装配置、免费模型、功能亮点、插件使用、云端集成等。详细介绍 CLI、客户端、IDE 插件和云端环境四种使用形态。
abbrlink: c97f2813
cover: /img/picgo-images/opencode-install.png
date: 2026-01-19 23:05:55
---

## 概述

{% note info %}
OpenCode 是一个开源的 AI 编程助手，提供多种使用形态，包括命令行（CLI）、客户端、IDE 插件和云端环境。
{% endnote %}

**核心优势**:

- 免费模型支持，开箱即用
- 开源，灵活可扩展
- 四种使用形态，满足不同场景
- 强大的插件生态系统

{% link OpenCode, https://github.com/anomalyco/opencode, https://github.com/favicon.ico %}
{% link Oh-My-OpenCode, https://github.com/code-yeongyu/oh-my-opencode, https://github.com/favicon.ico %}

---

## 安装配置

### CLI 安装

OpenCode 提供了多种安装方式，适配不同的操作系统和包管理器。

{% tabs 安装方式, icon:fa-solid fa-laptop-code %}

<!-- tab macOS @fab fa-apple -->

**方式一: Homebrew（推荐）**

```bash
# 使用官方 tap（始终最新）
brew install anomalyco/tap/opencode

# 或使用官方 formula（更新较慢）
brew install opencode
```

**方式二: NPM**

```bash
npm i -g opencode-ai@latest
```

**方式三: 快速安装脚本**

```bash
curl -fsSL https://opencode.ai/install | bash
```

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

**方式一: Chocolatey**

```powershell
choco install opencode
```

**方式二: Scoop**

```powershell
scoop bucket add extras
scoop install extras/opencode
```

**方式三: NPM**

```powershell
npm i -g opencode-ai@latest
```

<!-- endtab -->

<!-- tab Linux @fab fa-linux -->

**Arch Linux**

```bash
paru -S opencode-bin
```

**通用方式**

```bash
# NPM/Bun/PNPM/Yarn
npm i -g opencode-ai@latest
# 或
bun add -g opencode-ai

# 快速安装脚本
curl -fsSL https://opencode.ai/install | bash
```

**方式四: Mise（跨平台）**

```bash
mise use -g opencode
```

**方式五: Nix**

```bash
nix run nixpkgs#opencode
```

<!-- endtab -->

{% endtabs %}

### 客户端安装

#### macOS

```bash
brew install --cask opencode-desktop
```

#### 下载页面

{% btn https://opencode.ai/download, 下载 OpenCode 客户端, icon:fa-solid fa-download, green, larger %}

![进入OpenCode客户端](/img/picgo-images/image-OpenCode.png)

{% note warning %}
注意：客户端目前处于 Beta 测试阶段，Bug 较多，建议以命令行为主。
{% endnote %}

### IDE 插件安装

#### VSCode

1. 在 VSCode 插件市场搜索 `OpenCode`
2. 安装 `OpenCode for VSCode` 插件

![OpenCode_for_VScode](/img/picgo-images/image-OpenCode_for_vscode.png)

**快捷键**:

- Windows: `Ctrl` + `Shift` + `P`
- macOS: `Cmd` + `Shift` + `P`

![vscode打开opencode命令面板](/img/picgo-images/image-vscode打开opencode.png)

{% link OpenCode for VSCode, https://marketplace.visualstudio.com/items?itemName=anomalyco.opencode-vscode, https://marketplace.visualstudio.com/favicon.ico %}

### 启动 OpenCode

安装完成后，在项目目录下运行:

```bash
opencode
```

这将启动 OpenCode 的交互式终端界面（TUI）。

![进入OpenCode命令行界面](/img/picgo-images/image-进入opencode.png)

---

## 免费模型配置

### 查看可用模型

在 OpenCode 中输入以下命令查看免费模型:

```bash
/models
```

![opencode选择模型](/img/picgo-images/image-opencoe选择模型.png)

### Antigravity 插件（Google Gemini 3 Pro，Claude Opus 4.5）

{% link OpenCode Antigravity Auth, https://github.com/NoeFabris/opencode-antigravity-auth, https://github.com/favicon.ico %}

Antigravity 是 Google 推出的 AI 编程 IDE，内置免费的 Gemini 3 Pro 和 Claude Opus 4.5 模型。通过该插件，可以免费使用这两个顶级的编程模型。

**安装方式**:

在 OpenCode 中发送以下命令，将自动安装:

```bash
Install the opencode-antigravity-auth plugin and add the Antigravity model definitions to ~/.config/opencode/opencode.json by following: https://raw.githubusercontent.com/NoeFabris/opencode-antigravity-auth/dev/README.md
```

![安装opencode-antigravity-auth插件](/img/picgo-images/image-安装opencode插件.png)

**认证步骤**:

1. 打开新的命令行窗口
2. 执行认证命令:

```bash
opencode auth login
```

3. 在浏览器中登录 Google 账号

![Antigravity登录认证](/img/picgo-images/image-antigravity登录认证.png)

4. 验证成功后，重启 OpenCode
5. 输入 `/models` 切换到 Google 模型

![切换到Google模型](/img/picgo-images/image-切换google模型.png)

{% note info %}
P.S. Antigravity 提供的模型需要通过 Google 账号认证，使用时注意网络环境。
{% endnote %}

### 接入 ChatGPT CodeX

**前提条件**: 需要订阅 ChatGPT Plus 或更高级别会员

**配置步骤**:

1. 在 OpenCode CLI 中输入 `/connect`
2. 选择 `OpenAI`
3. 选择 `ChatGPT Pro/Plus`
4. 在浏览器打开认证链接
5. 登录并完成认证
6. 在 OpenCode 中输入 `/models` 后，可以选择 ChatGPT 的编程模型

### OpenRouter 集成

{% note success %}
P.S. 输入 `/connect` 可以查到市面上几乎所有的模型供应商
{% endnote %}

**配置步骤**:

1. 在 OpenCode 中输入 `/connect`
2. 选择 `Other` 中的 `openrouter`
3. 访问 OpenRouter 官网: https://openrouter.ai/
4. 获取 API Key
5. 填写 API Key 后，即可连接到几乎所有模型供应商

---

## 功能亮点

### Session 管理

**概念**: 每次与 AI 开启的新对话就是一个全新的 Session，可以在后台运行，支持多个 Session 并行执行。

**Session 相关命令**:

| 命令       | 功能                                          |
| ---------- | --------------------------------------------- |
| `/session` | 显示 Session 列表，查看运行状态，切换 Session |
| `/new`     | 创建全新的 Session                            |

**Session 管理功能**:

- 后台运行多个任务
- 并行执行不同的 Session
- 查看 Session 的实时状态
- 在 Session 之间快速切换

{% link SDK 文档, https://opencode.ai/docs/sdk.mdx, https://opencode.ai/favicon.ico %}

### Share 分享

**功能**: 将当前 Session 的对话以 URL 链接的形式分享为在线网页

**使用方法**:

```bash
/share
```

{% note default %}
P.S. 分享链接可以直接在浏览器中查看完整的对话记录，方便团队协作和代码审查。
{% endnote %}

### Timeline 时间线回退

**功能**: 查看当前 Session 的完整对话记录，并可以将代码和内容回退到任意一次对话之前的状态。

**使用方法**:

```bash
/timeline
```

**操作步骤**:

1. 输入 `/timeline` 查看时间线
2. 选择任意一次对话记录
3. 选择 `Revert` 选项
4. 代码和内容将回退到该对话之前的状态

{% note info %}
e.g. 假设在实现功能过程中发现方向错误，可以使用 Timeline 快速回退到之前的正确状态，避免手动撤销多个步骤。
{% endnote %}

---

## Skills 与 MCP 配置

### Skills 机制

**目录结构**:

```
项目目录/
├── .claude/
│   └── skills/
│       ├── skill-name1/
│       │   └── SKILL.md
│       └── skill-name2/
│           └── SKILL.md
```

**Claude Code 到 OpenCode 的迁移**:

只需要将 `.claude` 目录替换为 `.opencode` 目录。OpenCode 兼容 Claude Code 的 Skills 格式，不修改也可以直接使用。

### MCP 服务器配置

{% tabs MCP配置, icon:fa-solid fa-server %}

<!-- tab Local MCP（本地命令调用） @fas fa-desktop -->

**配置文件位置**: `~/.config/opencode/opencode.json`

**配置示例**:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-local-mcp-server": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-command"],
      "enabled": true,
      "environment": {
        "MY_ENV_VAR": "my_env_var_value"
      }
    }
  }
}
```

**实际案例 - Shadcn MCP**:

{% folding blue, 查看配置代码 %}

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-antigravity-auth@latest"],
  "mcp": {
    "shadcn": {
      "type": "local",
      "command": ["npx", "-y", "shadcn@latest", "mcp"],
      "enabled": true
    }
  }
}
```

{% endfolding %}

{% link MCP 文档, Local MCP 配置, https://opencode.ai/docs/mcp-servers/#local, https://opencode.ai/favicon.ico %}

<!-- endtab -->

<!-- tab Remote MCP（远程服务器） @fas fa-cloud -->

**配置示例**:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true,
      "headers": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
      }
    }
  }
}
```

{% note primary %}
Context7 说明: Context7 是一个基于 MCP 的工具，为大型语言模型和 AI 代码编辑器提供最新、版本特定的官方文档和代码示例，帮助减少过时信息和生成错误代码的问题。
{% endnote %}

{% link MCP 文档, Remote MCP 配置, https://opencode.ai/docs/mcp-servers/#remote, https://opencode.ai/favicon.ico %}

<!-- endtab -->

{% endtabs %}

### 验证 MCP 配置

配置完成后:

1. 退出 OpenCode: `/exit`
2. 重新启动: `opencode`
3. 查看 MCP 服务器: `/mcp`

![opencode配置mcps](/img/picgo-images/image-opencode配置mcp.png)

---

## OMO 插件（Oh My OpenCode）

{% link Oh-My-OpenCode, https://github.com/code-yeongyu/oh-my-opencode, https://github.com/favicon.ico %}

Oh My OpenCode 是 OpenCode 最热门的编程插件，本质上是预设 Tools + 预设 MCP + 预设 Agent 的捆绑包。

### 预设功能

#### 预设 Tools

1. **LSP 高级版**: 通过编程语言的语法和定义，帮助 AI 快速定位理解代码
2. **AST**: 抽象语法树分析
3. **Look At**: 查看和分析文件内容
4. **Delegate-Task**: Agent 任务分配
5. **Background-Task**: Agent 后台调度

#### 预设 MCP

- **Web Search**: 网络搜索
- **Context7**: 官方文档查询
- **Grep App**: 代码搜索

### 预设智能体

插件内置了 7 大编程智能体，每个智能体分配了最适合的 AI 模型:

| 智能体名称              | 职责         | 说明                 |
| ----------------------- | ------------ | -------------------- |
| Sisyphus                | 主智能体     | 规划和调度任务       |
| Oracle                  | 架构师       | 架构设计、代码评审   |
| Librarian               | 图书管理员   | 查找文档、代码示例   |
| Explore                 | 探索者       | 代码库分析、模式发现 |
| Frontend UI/UX Engineer | 前端工程师   | UI/UX 设计和实现     |
| Document Writer         | 文档编写者   | 技术文档编写         |
| Multimodal Looker       | 多模态观察者 | 图片、PDF 等媒体分析 |

### 安装 OMO 插件

**安装命令**:

在 OpenCode 中发送:

```bash
Install and configure by following the instructions here https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/README.md
```

**配置步骤**:

1. 根据提示确认是否拥有 Claude、GPT、Gemini 的订阅
2. 等待安装完成
3. 配置文件位置: `~/.config/opencode/oh-my-opencode.json`

### OMO 插件使用方法

#### 方法一: 智能体选择

1. 输入 `@` 符号
2. 挑选其中一个智能体进行工作

#### 方法二: Ultra Work（ulw）

**魔法词**: `ulw`

输入 `ulw` 后，OMO 插件将调用一切潜能:

- 综合调度各个领域最强的模型
- 主智能体 `Sisyphus` 将任务分配给其他智能体
- 后台同时开启多个任务，并行执行
- 将问题做成 Todo List，实时跟踪进度

{% note success %}
e.g. 输入 `ulw 实现一个完整的用户认证系统`，插件将自动:

- 调用 Oracle 设计架构
- 调用 Explore 分析现有代码
- 调用 Frontend Engineer 实现 UI
- 调用 Document Writer 编写文档
- 所有任务并行执行
  {% endnote %}

#### 方法三: Ralph Loop

**命令**:

```bash
/ralph-loop
```

**拉尔夫循环模式**: 强制 AI 长时间循环，对非常复杂的任务进行持续工作，直到任务完成。

{% note warning %}
P.S. 可以连续运行数小时，适合处理大型重构、复杂 bug 修复等需要长期专注的任务。
{% endnote %}

---

## 云端环境

### GitHub 集成

OpenCode 支持在 GitHub 的 Issue 中通过 `/opencode` 命令调用 AI 进行工作。

**主要功能**:

- 在 GitHub 云端解释问题
- 自动修复问题
- 创建 Pull Request

{% link GitHub 文档, OpenCode GitHub Integration, https://opencode.ai/docs/github.mdx, https://opencode.ai/favicon.ico %}

### 安装步骤

{% tabs 安装方式, icon:fa-brands fa-github %}

<!-- tab CLI 命令安装 @fas fa-terminal -->

```bash
opencode github install
```

<!-- endtab -->

<!-- tab 手动配置 @fas fa-cog -->

1. 创建工作流文件 `.github/workflows/opencode.yml`:

```yaml
name: opencode

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  opencode:
    if: |
      contains(github.event.comment.body, '/oc') ||
      contains(github.event.comment.body, '/opencode')
    runs-on: ubuntu-latest
    permissions:
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 1
          persist-credentials: false
      - name: Run OpenCode
        uses: anomalyco/opencode/github@latest
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        with:
          model: anthropic/claude-sonnet-4-20250514
```

2. 选择模型供应商（仅支持 API Key）
3. 将 `.github/workflows/opencode.yml` 提交到 GitHub 公开仓库
4. 在 GitHub 设置页面的 `Actions` 中添加模型供应商的 API Key
   <!-- endtab -->
   {% endtabs %}

### 使用方法

1. 在 GitHub Issue 或 PR 中添加评论
2. 输入 `/opencode` 或 `/oc` 加上具体指令
3. e.g. `/opencode 修复这个 bug: [详细描述]`
4. Actions 开始执行，在 Actions 页面查看进度
5. 执行完成后，可以在 Pull Requests 中看到代码变更
6. 审查后点击 `Merge pull request` 合并代码

---

## 高级功能

### 项目初始化（/init）

**功能**: 让 AI 通读整个项目文件夹，将学到的知识生成到 `AGENTS.md` 文件中。

**作用**: 类似 Claude Code 的 `CLAUDE.md`，该文件作为整个项目的系统提示词，帮助 AI 快速了解项目结构、技术栈和业务逻辑。

**使用方法**:

```bash
/init
```

{% note info %}
P.S. 建议在新项目加入时或项目结构发生重大变化时执行，保持 `AGENTS.md` 的准确性。
{% endnote %}

### 上下文压缩（/compact）

**功能**: 压缩当前对话的上下文，提炼关键信息。

**使用场景**:

- 对话过长，接近 token 限制
- 需要保留关键信息，丢弃无关细节

**使用方法**:

```bash
/compact
```

### 自定义命令

**配置目录**: `~/.config/opencode/commands`

**创建方法**:

在 commands 目录中创建 markdown 文件，e.g. `test.md`:

```markdown
---
description: Run unit tests with coverage
agent: run_test
model: anthropic/claude-haiku-4-5
---

Run the full test suite with coverage report.
Focus on the failing tests and suggest fixes.
```

**使用方法**:

在 OpenCode 中通过 `/${command_name}` 运行:

```bash
/test
```

{% folding green, 查看配置文件方式 %}
也可以在 `~/.config/opencode/opencode.json` 中配置:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "command": {
    "test": {
      "template": "Run the test suite with coverage. Show failing tests and suggest fixes.",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-haiku-4-5"
    },
    "review": {
      "template": "Review the changes in this PR: $ARGUMENTS\nFocus on code quality, potential bugs, and adherence to project conventions.",
      "description": "Review a pull request",
      "agent": "code-reviewer"
    }
  }
}
```

{% endfolding %}

{% link Commands 文档, OpenCode Commands, https://opencode.ai/docs/commands.mdx, https://opencode.ai/favicon.ico %}

### 自定义智能体

**配置目录**: `~/.config/opencode/agents`

**创建方法**:

在 agents 目录中创建 markdown 文件，e.g. `code_review.md`:

```markdown
---
description: Reviews code for best practices and potential issues
mode: subagent
model: anthropic/claude-sonnet-4-20250514
---

You are a code reviewer. Focus on:

- Security vulnerabilities
- Performance issues
- Code maintainability
- Best practices adherence
- Potential bugs
```

**Agent 类型**:

| 类型     | 说明     | 调用方式           |
| -------- | -------- | ------------------ |
| primary  | 主智能体 | 通过 Tab 键切换    |
| subagent | 子智能体 | 由主智能体后台调用 |

{% folding cyan, 查看配置文件方式 %}
在 `~/.config/opencode/opencode.json` 中配置:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "plan": {
      "mode": "primary",
      "model": "anthropic/claude-haiku-4-5",
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      }
    },
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "tools": {
        "write": false,
        "edit": false
      }
    }
  }
}
```

{% endfolding %}

**使用方法**:

- 主智能体: 在 OpenCode 中按 Tab 键切换
- 子智能体: 由主智能体自动调度，后台运行

{% link Agents 文档, OpenCode Agents, https://opencode.ai/docs/agents.mdx, https://opencode.ai/favicon.ico %}

---

## 最佳实践

### 项目管理

1. **初始化项目**: 使用 `/init` 生成 AGENTS.md，让 AI 了解项目
2. **使用 Todo List**: 复杂任务使用 `ulw` 或手动创建 Todo List，跟踪进度
3. **利用 Timeline**: 实验性功能开发时使用 Timeline，方便回退
4. **Session 管理**: 不同功能使用不同 Session，保持上下文清晰

### 插件使用

1. **安装 OMO 插件**: 优先安装 Oh My OpenCode，获得完整功能
2. **配置 MCP**: 根据项目需求配置必要的 MCP 服务器
3. **使用合适模型**:
   - 简单任务: 使用 Haiku（快速便宜）
   - 复杂任务: 使用 Sonnet（平衡性能）
   - 代码生成: 使用 Claude Sonnet/GPT-4
   - 文档编写: 使用 GPT-4/Claude Opus

### 效率提升

1. **自定义命令**: 将重复性操作定义为自定义命令，e.g. `/test` 运行测试
2. **智能体分工**: 使用 OMO 的 7 大智能体，让每个 AI 发挥专长
3. **并行执行**: 使用 `ulw` 或 `background_task` 并行处理多个任务
4. **上下文管理**: 及时使用 `/compact` 压缩对话，节省 token

### 团队协作

1. **Share 分享**: 使用 `/share` 分享对话，团队成员可以查看完整过程
2. **GitHub 集成**: 配置云端环境，在 Issue 中直接调用 AI 修复 bug
3. **统一配置**: 将 `.opencode` 目录纳入版本控制，统一团队配置

---

## 常见问题

### Q1: OpenCode 与 Claude Code 有什么区别?

| 特性     | OpenCode                     | Claude Code   |
| -------- | ---------------------------- | ------------- |
| 开源性   | 完全开源                     | 闭源          |
| 模型支持 | 不限模型                     | 仅支持 Claude |
| 插件系统 | 丰富插件                     | 有限          |
| 免费模型 | 支持 Gemini、Antigravity 等  | 仅 Claude     |
| 跨平台   | 完整支持 macOS/Windows/Linux | 限制较多      |

### Q2: 如何选择合适的模型?

**简单任务**（代码解释、小修改）:

- Claude Haiku 4.5（快速、便宜）

**常规开发**（功能实现、代码重构）:

- Claude Sonnet 4（平衡性能）

**复杂任务**（架构设计、文档编写）:

- Claude Opus 4.5 / GPT-4（最强性能）

**特定领域**:

- 前端开发: GPT-4o
- 后端开发: Claude Sonnet 4
- 安全审计: Claude Opus 4.5

### Q3: MCP 配置后无法使用?

**检查步骤**:

1. 配置文件格式是否正确
2. `enabled` 字段是否为 `true`
3. Local MCP 的命令是否可执行
4. Remote MCP 的 URL 是否正确
5. API Key 是否有效
6. 退出并重启 OpenCode: `/exit` → `opencode`
7. 查看 MCP 列表: `/mcp`

### Q4: OMO 插件安装失败?

**解决方案**:

1. 检查网络连接（需要访问 GitHub）
2. 确认有足够权限修改配置文件
3. 手动下载配置文件: https://github.com/code-yeongyu/oh-my-opencode
4. 检查 `~/.config/opencode/oh-my-opencode.json` 是否生成

### Q5: 如何减少 API 成本?

**方法**:

1. 使用免费模型: Antigravity（Gemini 3 Pro，Claude Opus 4.5）
2. 简单任务使用 Haiku 模型
3. 及时压缩上下文: `/compact`
4. 使用自定义命令减少重复对话
5. 开启缓存，避免重复请求

### Q6: GitHub Actions 执行失败?

**常见原因**:

1. API Key 未配置或已过期
2. Workflow 文件路径错误（应为 `.github/workflows/opencode.yml`）
3. 模型名称错误（使用 `/models` 查看）
4. 权限不足（需要 `id-token: write`）

**调试步骤**:

1. 查看 GitHub Actions 日志
2. 确认 Secrets 中的 API Key
3. 测试模型连接: 在本地使用相同配置
4. 检查 Workflow 语法: 使用 GitHub Actions linter

### Q7: Session 切换后上下文丢失?

**说明**: 每个 Session 是独立的，切换 Session 不会共享上下文。

**解决方案**:

- 使用 `/share` 分享重要对话
- 将关键信息写入文件或注释
- 使用 Todo List 记录跨 Session 的任务
- 将项目知识写入 AGENTS.md

---

## 参考资料

### 官方文档

{% link OpenCode 官网, https://opencode.ai/ , https://opencode.ai/favicon.ico %}
{% link GitHub 仓库,  https://github.com/anomalyco/opencode, https://github.com/favicon.ico %}
{% link CLI 文档, https://opencode.ai/docs/cli, https://opencode.ai/favicon.ico %}
{% link TUI 文档, https://opencode.ai/docs/tui, https://opencode.ai/favicon.ico %}
{% link MCP 文档,  https://opencode.ai/docs/mcp-servers, https://opencode.ai/favicon.ico %}
{% link GitHub 集成,  https://opencode.ai/docs/github, https://opencode.ai/favicon.ico %}
{% link SDK 文档,  https://opencode.ai/docs/sdk, https://opencode.ai/favicon.ico %}

### 插件与工具

{% link Oh-My-OpenCode, https://github.com/code-yeongyu/oh-my-opencode, https://github.com/favicon.ico %}
{% link OpenCode Antigravity Auth, https://github.com/NoeFabris/opencode-antigravity-auth, https://github.com/favicon.ico %}

{% btn https://context7.com/, Context7, icon:fa-solid fa-book, blue %}
{% btn https://openrouter.ai/, OpenRouter, icon:fa-solid fa-link, purple %}

### 社区资源

{% btn https://discord.gg/opencode, Discord 社区, icon:fa-brands fa-discord, blue %}
{% btn https://twitter.com/opencode_ai, Twitter, icon:fa-brands fa-twitter, blue %}
{% link OpenCode for VSCode, https://marketplace.visualstudio.com/items?itemName=sst-dev.opencode, https://marketplace.visualstudio.com/favicon.ico %}

### 相关工具

{% btn https://modelcontextprotocol.io/, MCP 规范, icon:fa-solid fa-book, blue %}
{% link MCP Servers, https://github.com/modelcontextprotocol/servers, https://github.com/favicon.ico %}

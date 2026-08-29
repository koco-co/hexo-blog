---
title: Claude文档(二) Agent Skills 使用指南
tags:
  - Claude-Code
  - Skills
categories:
  - AI开发
  - 开发工具
description: 深入了解 Claude Code Skills 系统, 从安装配置到高级应用的完整指南。Skills 是一种上下文感知的指令系统, 相当于带目录的说明书, 能大幅降低 token 消耗与提示词复杂度。
abbrlink: eccdaad5
cover: /img/picgo-images/agent_skills.webp
date: 2026-02-09 13:41:40
---

## 概述

{% note success %}
Claude Code Skills 是一种上下文感知的指令系统, 相当于带目录的说明书. AI 使用 Skills 时, 会先把目录(元数据)加载进 Prompt, 然后根据用户 Prompt 按需加载正文和附录. 比起传统的 Prompt 或 MCP, 大幅降低 token 消耗与提示词复杂度.
{% endnote %}

### 核心架构

Skills 由三层结构组成:

| 层级   | 加载时机 | 作用               |
| ------ | -------- | ------------------ |
| 元数据 | 必定加载 | 提供目录和概览信息 |
| 指令   | 按需加载 | 具体的操作指导     |
| 资源   | 按需加载 | 支持文件和参考资料 |

### 目录结构

```text
skill-name/
├── SKILL.md              # 必需: 元数据 + 指令
├── scripts/              # 可选: 可执行代码
│   ├── setup.sh
│   └── helper.py
├── references/           # 可选: 参考文档
│   ├── api-guide.md
│   └── best-practices.md
└── assets/               # 可选: 模板和资源文件
    └── template.json
```

{% link Claude Code Official Docs - About Skills, https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/skill-development/SKILL.md, https://github.com/favicon.ico %}

## 安装配置

### Claude Code 安装

{% tabs 安装方法, fa-solid fa-download %}

<!-- tab macOS @fab fa-apple -->

```bash
# Homebrew 安装
brew install --cask claude-code

# 或使用 curl
curl -fsSL https://claude.ai/install.sh | bash

# 或使用 npm
npm install -g @anthropic-ai/claude-code
```

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

```powershell
# 使用 curl (Windows 10+)
curl -fsSL https://claude.ai/install.sh | sh

# 或使用 npm
npm install -g @anthropic-ai/claude-code
```

<!-- endtab -->

<!-- tab Linux @fab fa-linux -->

```bash
# 使用 curl
curl -fsSL https://claude.ai/install.sh | bash

# 或使用 npm
npm install -g @anthropic-ai/claude-code
```

<!-- endtab -->

{% endtabs %}

{% note info %}
P.S. 配置目录统一位于 `~/.claude`
{% endnote %}

### 账号配置

{% tabs 账号配置方式, fa-solid fa-user-gear %}

<!-- tab Claude 官方账号 %}
登录 Claude 官网账户 (需要梯子), 命令行下执行:

```bash
claude
```
<!-- endtab -->

<!-- tab 智谱 AI (国内推荐) %}
如果没有 Claude 账号, 可以使用智谱 AI 的兼容服务:

**步骤 1**: 创建 `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your_zhipu_api_key_here___sk-开头的那串",
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "API_TIMEOUT_MS": "3000000",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air"
  },
  "permissions": {
    "Bash": "allow",
    "Edit": "allow",
    "Read": "allow"
  },
  "debug": true
}
```

**步骤 2**: 编辑 `~/.claude.json`, 添加跳过登录配置:

```json
{
  "hasCompletedonboarding": true
}
```

**步骤 3**: 如果首次启动仍出现登录提示, 手动执行临时变量:

```bash
export ANTHROPIC_AUTH_TOKEN="your_api_key"
export ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
export API_TIMEOUT_MS="3000000"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```
<!-- endtab -->

{% endtabs %}

## 快速开始

### 创建第一个 Skill

```bash
# 1. 创建项目目录
mkdir agent-skills && cd agent-skills

# 2. 创建 skill 目录
mkdir -p .claude/skills/my-first-skill
```

### 编写 SKILL.md

{% note success %}
e.g. 创建一个基础的 Skill:
{% endnote %}

```markdown
---
name: my-first-skill
description: 我的第一个 Claude Code Skill
version: 1.0.0
---

# My First Skill

## 用途

帮助快速初始化项目结构

## 使用场景

当需要创建新项目时使用此 skill

## 操作步骤

1. 创建项目目录
2. 初始化 git
3. 创建 README.md
```

{% btn https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/plugin-structure/SKILL.md, Skill Structure Documentation, fa-solid fa-book, blue %}

### 添加资源文件

```bash
# 创建 scripts 目录
mkdir .claude/skills/my-first-skill/scripts

# 添加初始化脚本
cat > .claude/skills/my-first-skill/scripts/init.sh << 'EOF'
#!/bin/bash
git init
echo "# My Project" > README.md
EOF

chmod +x .claude/skills/my-first-skill/scripts/init.sh
```

## 作用范围

### 项目级生效

Skills 存放在项目的 `.claude/skills/` 目录下:

```text
project-root/
├── .claude/
│   └── skills/
│       ├── skill-1/
│       │   └── SKILL.md
│       └── skill-2/
│       ├── SKILL.md
│       └── scripts/
└── src/
```

仅对当前项目生效.

### 全局生效

将调试好的 skill 复制到全局目录:

```bash
cp -r .claude/skills/my-first-skill ~/.claude/skills/
```

{% note primary %}
P.S. 全局 skills 对所有项目可用, 建议将通用技能 (如 coding standards, git workflows) 放在全局目录.
{% endnote %}

## 核心功能

### 自动加载机制

Claude Code 按以下顺序加载 Skills:

{% mermaid %}
flowchart TD
A[用户请求] --> B[加载所有 Skill 元数据]
B --> C{匹配相关 Skill}
C -->|匹配成功| D[加载完整 Skill 内容]
C -->|无匹配| E[仅使用基础能力]
D --> F[加载相关资源文件]
F --> G[执行任务]
{% endmermaid %}

### 元数据格式

SKILL.md 必需的 YAML frontmatter:

```yaml
---
name: skill-name # Skill 名称, 必需
description: 简短描述 # 使用场景说明, 必需
version: 1.0.0 # 版本号, 可选
author: your-name # 作者, 可选
tags: # 标签, 可选
  - category1
  - category2
---
```

### 资源目录说明

| 目录          | 用途       | 示例                       |
| ------------- | ---------- | -------------------------- |
| `scripts/`    | 可执行脚本 | Python, Bash, Node.js 脚本 |
| `references/` | 参考文档   | API 文档, 最佳实践指南     |
| `assets/`     | 输出资源   | 模板, 图标, 配置文件       |

## 进阶用法

### Skill 模板

{% note success %}
e.g. 完整的 TypeScript 项目 Skill:
{% endnote %}

````markdown
---
name: typescript-patterns
description: TypeScript 项目编码规范和最佳实践
version: 1.0.0
---

# TypeScript Patterns

## 代码规范

### 文件命名

- 组件: `PascalCase.tsx`
- 工具函数: `camelCase.ts`
- 类型定义: `*.types.ts`
- 测试文件: `*.test.ts` 或 `__tests__/`

### 目录结构

```text
src/
├── components/     # React 组件
├── hooks/          # 自定义 Hooks
├── utils/          # 工具函数
├── types/          # 类型定义
└── services/       # API 服务
```
````

## Commit 规范

使用 Conventional Commits:

- `feat:` - 新功能
- `fix:` - Bug 修复
- `chore:` - 构建/工具变动
- `docs:` - 文档更新
- `refactor:` - 代码重构
- `test:` - 测试相关

## 工作流

### 添加新组件

1. 创建组件文件 `src/components/ComponentName.tsx`
2. 创建测试文件 `src/components/__tests__/ComponentName.test.tsx`
3. 从 `src/components/index.ts` 导出

### 运行测试

```bash
npm test
npm run test:coverage
```

{% link Everything Claude Code, https://github.com/affaan-m/everything-claude-code, https://github.com/favicon.ico %}

````
### 从 Git 历史提取 Skill

使用 `/learn` 命令自动从项目 Git 历史提取编码模式:

```bash
# 在项目根目录执行
/learn
````

Claude 会分析 commit 历史, 生成符合项目实际的 Skill 文件.

{% note info %}
P.S. 生成的 Skill 保存在 `~/.claude/skills/learned/` 目录.
{% endnote %}

## 最佳实践

### Skill 设计原则

| 原则     | 说明                                    | 示例                             |
| -------- | --------------------------------------- | -------------------------------- |
| 单一职责 | 每个 Skill 专注一个领域                 | 分离 "git-workflow" 和 "testing" |
| 明确触发 | description 清晰说明使用场景            | "当创建 PR 时使用"               |
| 渐进加载 | 核心指令在 SKILL.md, 详情在 references/ | API 参考放 references/           |
| 版本管理 | 使用 version 追踪变更                   | 从 1.0.0 → 1.1.0                 |

### 命名规范

- 使用 kebab-case: `api-integration`, `git-workflow`
- 描述性名称: `typescript-react-patterns` (而非 `ts-patterns`)
- 避免过宽的名称: 不要用 `helpers`, `utils`

### 内容组织

```markdown
---
name: skill-name
description: 具体的使用场景描述
---

# 标题

## 概述

简短说明 (2-3 句话)

## 前置条件

- 条件 1
- 条件 2

## 步骤

### 步骤 1: 标题

具体操作...

### 步骤 2: 标题

具体操作...

## 注意事项

重要提示...

## 故障排查

常见问题及解决方案
```

## 在其它 IDE 中使用

### CodeX

**步骤 1**: 编辑 `~/.codex/config.toml`:

```toml
[features]
skills = true
```

**步骤 2**: 将 `.claude` 目录重命名为 `.codex`:

```bash
mv .claude .codex
```

{% btn https://codex.so/docs, CodeX Documentation, fa-solid fa-book, purple %}

### Cursor

{% note success %}
Cursor 原生支持 Claude Code Skills, 无需额外配置.
{% endnote %}

### Windsurf

Windsurf 支持 Skills, 需要配置 `.windsor/skills/` 目录.

## 常见问题

### Q1: Skill 没有被加载?

**检查清单**:

- [ ] SKILL.md 是否有正确的 YAML frontmatter
- [ ] skill 目录是否在 `.claude/skills/` 下
- [ ] description 是否清晰描述使用场景

**调试方法**:

```bash
# 查看已加载的 skills
claude --list-skills
```

### Q2: 如何测试 Skill?

在项目目录下, 直接向 Claude 提出相关请求, 观察是否使用了 Skill:

```bash
claude
> 请按照我们的代码规范创建一个新组件
```

### Q3: 资源文件如何被引用?

在 SKILL.md 中使用相对路径引用:

```markdown
## 示例代码

参见 @scripts/example.js

## API 参考

详见 @references/api-guide.md
```

### Q4: 如何分享 Skills?

1. 将 skill 目录发布到 GitHub
2. 提交到 Awesome Claude Skills
3. 其他人可以克隆到 `.claude/skills/` 目录

{% btn https://github.com/ComposioHQ/awesome-claude-skills, Awesome Claude Skills, fa-brands fa-github, green %}

### Q5: Skill 与 MCP 的区别?

| 特性       | Skills            | MCP                  |
| ---------- | ----------------- | -------------------- |
| 用途       | 指令和最佳实践    | 扩展工具能力         |
| 加载       | 渐进式按需加载    | 服务常驻             |
| Token 消耗 | 低 (仅加载元数据) | 高 (完整工具定义)    |
| 适用场景   | 编码规范, 工作流  | API 调用, 数据库操作 |

{% note primary %}
P.S. Skills 和 MCP 可以配合使用: Skills 提供指导, MCP 提供工具能力.
{% endnote %}

## Skills 生态

### 社区资源

{% link Awesome Claude Skills, https://github.com/ComposioHQ/awesome-claude-skills, https://github.com/favicon.ico %}
{% link Everything Claude Code, https://github.com/affaan-m/everything-claude-code, https://github.com/favicon.ico %}
{% link Claude Code, https://github.com/anthropics/claude-code, https://github.com/favicon.ico %}

### 安全注意事项

{% folding red, ⚠️ 风险评估 %}

- Skills 可以执行系统命令 (通过 scripts/)
- 可能访问敏感文件 (通过 assets/)
- 建议审查社区分享的 Skills
  {% endfolding %}

{% folding green, ✅ 最佳实践 %}

1. 仅从可信来源获取 Skills
2. 审查 SKILL.md 和 scripts/ 内容
3. 使用沙箱环境测试新 Skills
4. 定期更新已安装的 Skills
   {% endfolding %}

## 参考资料

{% btn https://github.com/anthropics/claude-code, Claude Code Official Documentation, fa-brands fa-github, blue %}
{% btn https://github.com/affaan-m/everything-claude-code, Everything Claude Code, fa-brands fa-github, purple %}
{% btn https://github.com/ComposioHQ/awesome-claude-skills, Awesome Claude Skills, fa-brands fa-github, green %}
{% btn https://open.bigmodel.cn/dev/api, 智谱 AI API 文档, fa-solid fa-book, orange %}

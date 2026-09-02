---
title: "Coding Agent(一)入门路线"
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: "掌握 Coding Agent 的共同工作方法，并能独立使用 18 个目标产品完成受控代码任务；每个产品均有一篇独立文章。"
cover: /img/picgo-images/coding-agent-course-cover.png
series: "Coding Agent"
series_order: 1
published: true
abbrlink: 4715005f
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
掌握 Coding Agent 的共同工作方法，并能独立使用 18 个目标产品完成受控代码任务；每个产品均有一篇独立文章。

课程范围：共同方法、Prompt/Goal/Skill与Context、产品独立篇、实战比较。正式文章分别通过图解、实验和可观察证据完成学习闭环。
{% endnote %}

## 前置条件

{% note info flat %}
建议具备 Python 3、命令行、Git 和基本 HTTP/JSON 能力；缺少的部分在相关阶段补齐。所有实验优先使用本地夹具，真实服务仅由读者显式配置。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  P1[共同方法]
  P2[Prompt/Goal/Skill与Context]
  P3[产品独立篇]
  P4[实战比较]
  P1 --> P2
  P2 --> P3
  P3 --> P4
{% endmermaid %}

{% note info flat %}
按阶段顺序阅读：共同方法 → Prompt/Goal/Skill与Context → 产品独立篇 → 实战比较。每篇以实验输出或验收表判断是否可以继续。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Coding Agent(一)入门路线 | 掌握 Coding Agent 的共同工作方法，并能独立使用 18 个目标产品完成受控代码任务；每个产品均有一篇独立文章。 | 无 | 入口 |
| 2 | Coding Agent(二)工作区与权限边界 | 工作目录、工作树、权限和回滚点明确 | 无 | 未开始 |
| 3 | Coding Agent(三)Vibe Coding与工程边界 | 快速探索最终转化为可审查工程变更 | 工作区与权限边界 | 未开始 |
| 4 | Coding Agent(四)代码定位与上下文 | 定位证据支持后续修改，未读文件不被假设 | Vibe Coding与工程边界 | 未开始 |
| 5 | Coding Agent(五)任务拆解与验收 | 每个步骤有输入、输出、失败和停止条件 | 代码定位与上下文 | 未开始 |
| 6 | Coding Agent(六)Prompt、Goal与Skill | Prompt、Goal、Skill 各自承担一次性指令、长期目标和可复用能力 | 任务拆解与验收 | 未开始 |
| 7 | Coding Agent(七)项目约定与持久记忆 | 作用域、覆盖和失效规则可观察 | Prompt、Goal与Skill | 未开始 |
| 8 | Coding Agent(八)增量修改与重构 | 行为变更与重构可区分，任一阶段可回退 | 项目约定与持久记忆 | 未开始 |
| 9 | Coding Agent(九)验证、审查与回滚 | 构建成功不被误判为功能正确，回滚保留无关修改 | 增量修改与重构 | 未开始 |
| 10 | Coding Agent(十)Session、Context与交接 | 交接后能恢复约束、未完成项和证据 | 验证、审查与回滚 | 未开始 |
| 11 | Coding Agent(十一)Tools、MCP与插件 | 工具、MCP、插件的信任边界和降级清楚 | Session、Context与交接 | 未开始 |
| 12 | Coding Agent(十二)Subagent、Team与Swarm | 并行收益和协调开销可解释 | Tools、MCP与插件 | 未开始 |
| 13 | Coding Agent(十三)选型与能力矩阵 | 入口、模型、权限、扩展、成本和退出策略均有证据 | Subagent、Team与Swarm | 未开始 |
| 14 | Coding Agent(十四)Claude Code | 能独立完成 Claude Code 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 15 | Coding Agent(十五)Codex | 能独立完成 Codex 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 16 | Coding Agent(十六)ZCode | 能独立完成 ZCode 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 17 | Coding Agent(十七)DeepSeek Harness | 能独立完成 DeepSeek Harness 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 18 | Coding Agent(十八)Pi | 能独立完成 Pi 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 19 | Coding Agent(十九)OpenClaw | 能独立完成 OpenClaw 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 20 | Coding Agent(二十)Kimi Code | 能独立完成 Kimi Code 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 21 | Coding Agent(二十一)WorkBuddy | 能独立完成 WorkBuddy 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 22 | Coding Agent(二十二)Kiro | 能独立完成 Kiro 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 23 | Coding Agent(二十三)Hermes Agent | 能独立完成 Hermes Agent 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 24 | Coding Agent(二十四)Grok Build | 能独立完成 Grok Build 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 25 | Coding Agent(二十五)Gemini CLI | 能独立完成 Gemini CLI 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 26 | Coding Agent(二十六)OpenCode | 能独立完成 OpenCode 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 27 | Coding Agent(二十七)Cursor | 能独立完成 Cursor 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 28 | Coding Agent(二十八)Windsurf | 能独立完成 Windsurf 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 29 | Coding Agent(二十九)Cline | 能独立完成 Cline 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 30 | Coding Agent(三十)Aider | 能独立完成 Aider 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 31 | Coding Agent(三十一)GitHub Copilot Coding Agent | 能独立完成 GitHub Copilot Coding Agent 的安装或入口配置、模型/认证设置、一次真实或本地可复现的代码任务，并说明权限、扩展和限制。 | Coding Agent：工作区与权限边界、Prompt/Goal与Skill、Session/Context与交接 | 未开始 |
| 32 | Coding Agent(三十二)项目实战 | 为同一仓库任务建立 Prompt/Goal/Skill、权限、验证、交接和多产品比较证据。 | 完成通用文章和至少三篇产品文章 | 未开始 |

## 开始学习

{% note primary flat %}
先完成环境检查，再从《Coding Agent(二)工作区与权限边界》开始。练习应保留输入、命令、输出、失败分类和复测条件；不要把在线调用结果当作本地实验的必需条件。
{% endnote %}

## 参考资料

### 官方资料1

{% linkgroup %}
{% link Claude Code 官方文档, https://code.claude.com/docs/en/overview, https://code.claude.com/favicon.ico %}
{% link ZCode 官方文档与插件仓库, https://zcode.z.ai/en/docs, https://zcode.z.ai/favicon.ico %}
{% link Pi Coding Agent 官方文档, https://pi.dev/docs/latest, https://pi.dev/favicon.ico %}
{% link WorkBuddy 官方文档, https://www.workbuddy.ai/docs/workbuddy/Quickstart, https://www.workbuddy.ai/favicon.ico %}
{% link Kiro 官方文档, https://kiro.dev/docs/, https://kiro.dev/favicon.ico %}
{% endlinkgroup %}

### 官方资料2

{% linkgroup %}
{% link Cursor Agent 官方文档, https://docs.cursor.com/en/agent/modes, https://docs.cursor.com/favicon.ico %}
{% link Windsurf Cascade 官方文档, https://docs.windsurf.com/, https://docs.windsurf.com/favicon.ico %}
{% link GitHub Copilot Cloud Agent 官方文档, https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent, https://docs.github.com/favicon.ico %}
{% endlinkgroup %}

### 源码框架1

{% linkgroup %}
{% link OpenAI Codex 官方仓库, https://github.com/openai/codex/tree/6478a751fde8884b2fdc76486fe23175a8e795d4, https://github.com/favicon.ico %}
{% link DeepSeek Harness 官方仓库, https://github.com/deepseek-ai/DeepSeek-Harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc, https://github.com/favicon.ico %}
{% link OpenClaw 官方仓库, https://github.com/openclaw/openclaw/tree/fe135231334125958812e28195ab6461cf543ce5, https://github.com/favicon.ico %}
{% link Kimi Code 官方仓库, https://github.com/MoonshotAI/kimi-code/tree/961927739ef34819d67d76fa5870cbe4ba7a01ff, https://github.com/favicon.ico %}
{% link Hermes Agent 官方仓库, https://github.com/NousResearch/hermes-agent/tree/4209d371aa1bb8840ce8447555bdd863a1a96c38, https://github.com/favicon.ico %}
{% endlinkgroup %}

### 源码框架2

{% linkgroup %}
{% link Grok Build 官方仓库, https://github.com/xai-org/grok-build/tree/bc7f02eddd3d84085849dc19ed216f11c23b0571, https://github.com/favicon.ico %}
{% link Gemini CLI 官方仓库, https://github.com/google-gemini/gemini-cli/tree/0bd1d439751478771c45d3d0895a6a9760554bf4, https://github.com/favicon.ico %}
{% link OpenCode 官方文档/仓库, https://github.com/anomalyco/opencode/tree/dc4449df0d52199704ea4989a5a993ebbc605612, https://github.com/favicon.ico %}
{% link Cline 官方仓库, https://github.com/cline/cline/tree/48d63852745460ff0fa3dfcc0457bbe2493841de, https://github.com/favicon.ico %}
{% link Aider 官方仓库, https://github.com/Aider-AI/aider/tree/5dc9490bb35f9729ef2c95d00a19ccd30c26339c, https://github.com/favicon.ico %}
{% endlinkgroup %}

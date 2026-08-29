---
title: Coding Agent(一)入门路线
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 把 Coding Agent 当作受边界约束的软件工程协作者，建立工作区、任务、修改、验证、审查和持续集成的闭环。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 1
published: true
abbrlink: 3c43c5d0
date: 2026-07-10 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
把 Coding Agent 当作受边界约束的软件工程协作者，建立工作区、任务、修改、验证、审查和持续集成的闭环。

毕业成果：完成一项合成缺陷修复：由 Agent 读取工作区、提出计划、修改受控文件、运行验证、生成证据并可安全交接。
{% endnote %}

## 前置条件

{% note info flat %}
已有 Python、Shell、HTTP、Git、数据库、CI/CD 和接口测试基础；模型训练与算法数学只补齐应用开发和测试所需的直觉。课程使用合成夹具优先，真实服务和付费 API 不作为脚手架门槛。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[共同基础] --> B[Coding Agent]
  B --> C[实验与验收]
  C --> D[项目交付]
{% endmermaid %}

{% note info flat %}
按共同基础、主线工程、质量安全和项目交付推进。每篇文章都把输入、操作、失败边界和验收证据作为学习结果。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Coding Agent(一)入门路线 | 说明Coding Agent的范围、前置、阅读顺序与毕业成果。 | — | 入口 |
| 2 | [Coding Agent(二)工作区与边界](/posts/88a82a9f/) | 理解 Coding Agent 的工作区、当前目录、权限、脏改动和工具边界。 | B01 | 已完成 |
| 3 | [Coding Agent(三)代码定位与追踪](/posts/ea9d1c25/) | 从重复缺陷描述追踪到路由、业务、数据和测试夹具，而不是直接猜文件。 | B02 | 已完成 |
| 4 | [Coding Agent(四)任务拆解与验收](/posts/73189a36/) | 把模糊修复目标拆成可执行步骤、反例和可观察验收。 | B03、A04 | 已完成 |
| 5 | [Coding Agent(五)项目约定与记忆](/posts/34897575/) | 按根目录、子目录和会话范围读取约定，并判断旧记忆是否仍有权威性。 | B04 | 已完成 |
| 6 | [Coding Agent(六)增量修改与重构](/posts/e2b223a/) | 在保持无关脏改动和文件所有权的前提下完成最小修改。 | B05 | 已完成 |
| 7 | [Coding Agent(七)验证与代码审查](/posts/4e9edd64/) | 建立独立重跑、差异审查和证据分层，避免把本地绿灯当业务正确。 | B06 | 已完成 |
| 8 | [Coding Agent(八)上下文交接与续作](/posts/7ee534c5/) | 把任务摘要、事实证据、未决风险和环境重查写成交接包。 | B07 | 已完成 |
| 9 | [Coding Agent(九)Skill设计与复用](/posts/6d34b815/) | 设计输入、输出、权限、辅助文件和失败降级明确的 Skill。 | B05、B07 | 已完成 |
| 10 | [Coding Agent(十)工具集成与扩展](/posts/d569f9a/) | 理解 Skill、CLI、MCP 和扩展的职责边界，并为调用保留可审查契约。 | B09、C03、C09 | 已完成 |
| 11 | [Coding Agent(十一)并行协作与隔离](/posts/545070e/) | 安排文件所有权、worktree、端口和汇合条件，避免并行工作互相污染。 | B07、B08 | 已完成 |
| 12 | [Coding Agent(十二)CI自动化](/posts/15664d55/) | 把 Coding Agent 的结果接入可解析、可追溯、有证据要求的 CI。 | B07、B09 | 已完成 |
| 13 | [Coding Agent(十三)项目实战](/posts/4ad3f683/) | 完成从重复工单到补丁、测试、审查、CI 和交接的 Coding Agent 闭环。 | B07、B08、B09、B12 | 已完成 |
## 开始学习

{% note primary flat %}
先完成路线自检，再从《Coding Agent(二)工作区与边界》开始。实验优先使用 FakeProvider、Fake HTTP、Fake tool 或合成仓库；完成一篇后保留命令、输出、失败分类和复跑条件。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link Claude Code documentation, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}
{% link GitHub Copilot documentation, https://docs.github.com/en/copilot, https://github.com/favicon.ico %}
{% link OpenAI Codex documentation, https://developers.openai.com/codex, https://developers.openai.com/favicon.ico %}
{% endlinkgroup %}

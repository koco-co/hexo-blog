---
title: Coding Agent(十)工具集成与扩展
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 10
published: false
abbrlink: d569f9a
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：理解 Skill、CLI、MCP 和扩展的职责边界，并为调用保留可审查契约。
- 可观察成果：能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 B09、C03、C09 的相关实验与边界判断。
- 覆盖条目：扩展边界、工具契约、只读链路、错误降级
- 失败边界：用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 扩展边界 | 理解 Skill、CLI、MCP 和扩展的职责边界，并为调用保留可审查契约。 | 扩展边界：能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | planned |
| 工具契约 | 完成“工具契约”中的关键理解、操作或判断 | 工具契约：能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。 | table | 该块只承担“工具契约”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | planned |
| 只读链路 | 完成“只读链路”中的关键理解、操作或判断 | 只读链路：能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。 | list | 该块只承担“只读链路”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | planned |
| 错误降级 | 完成“错误降级”中的关键理解、操作或判断 | 错误降级：能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。 | flashcard | 该块只承担“错误降级”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。
- 复习卡片：flashcard_ref: b10-why-mcp-cli
- 参考资料卡片：OpenAI Codex documentation（https://developers.openai.com/codex）；Git worktree documentation（https://git-scm.com/docs/git-worktree）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

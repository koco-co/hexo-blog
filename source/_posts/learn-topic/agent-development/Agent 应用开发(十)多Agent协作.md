---
title: Agent 应用开发(十)多Agent协作
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 10
published: false
abbrlink: 6f6bb3fb
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：从单 Agent 基线出发，比较分工、投票、动态委派、MCP 和 A2A 的边界。
- 可观察成果：能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 C04、C07、C08 的相关实验与边界判断。
- 覆盖条目：单体基线、角色分工、通信边界、失败传播
- 失败边界：比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 单体基线 | 从单 Agent 基线出发，比较分工、投票、动态委派、MCP 和 A2A 的边界。 | 单体基线：能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | planned |
| 角色分工 | 完成“角色分工”中的关键理解、操作或判断 | 角色分工：能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。 | note primary flat | 该块只承担“角色分工”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | planned |
| 通信边界 | 完成“通信边界”中的关键理解、操作或判断 | 通信边界：能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。 | table | 该块只承担“通信边界”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | planned |
| 失败传播 | 完成“失败传播”中的关键理解、操作或判断 | 失败传播：能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。 | flashcard | 该块只承担“失败传播”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。
- 复习卡片：flashcard_ref: c10-baseline-first；flashcard_ref: c10-a2a-vs-mcp
- 参考资料卡片：OpenAI Agents SDK documentation（https://openai.github.io/openai-agents-python/）；A2A protocol（https://a2a-protocol.org/latest/）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

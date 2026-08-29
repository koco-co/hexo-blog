---
title: Agent 应用开发(十四)进阶路线
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 14
published: false
abbrlink: c7715013
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：围绕 MCP Tasks、协议扩展、A2A 和包装层设计一个有边界的高级集成实验。
- 可观察成果：能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 C10、C11、C12 的相关实验与边界判断。
- 覆盖条目：扩展判断、协议选择、恢复策略、参考资料
- 失败边界：用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 扩展判断 | 围绕 MCP Tasks、协议扩展、A2A 和包装层设计一个有边界的高级集成实验。 | 扩展判断：能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | planned |
| 协议选择 | 完成“协议选择”中的关键理解、操作或判断 | 协议选择：能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。 | note primary flat | 该块只承担“协议选择”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | planned |
| 恢复策略 | 完成“恢复策略”中的关键理解、操作或判断 | 恢复策略：能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。 | code | 该块只承担“恢复策略”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | planned |
| 参考资料 | 完成“参考资料”中的关键理解、操作或判断 | 参考资料：能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。 | flashcard | 该块只承担“参考资料”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。
- 复习卡片：flashcard_ref: c14-extension-is-not-support
- 参考资料卡片：OpenAI Agents SDK documentation（https://openai.github.io/openai-agents-python/）；A2A protocol（https://a2a-protocol.org/latest/）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

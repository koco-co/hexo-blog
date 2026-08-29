---
title: AI 大模型应用(六)流式输出与对话状态
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 6
published: false
abbrlink: 35adff19
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：正确处理增量事件、会话状态、取消、重放和最终完成，避免把“看到文字”当成成功。
- 可观察成果：实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 A05 的相关实验与边界判断。
- 覆盖条目：事件模型、会话状态、取消语义、重放验证
- 失败边界：用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 事件模型 | 正确处理增量事件、会话状态、取消、重放和最终完成，避免把“看到文字”当成成功。 | 事件模型：实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。 | mermaid | 用把增量事件和最终状态放在同一张状态机中。承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | planned |
| 会话状态 | 完成“会话状态”中的关键理解、操作或判断 | 会话状态：实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。 | table | 该块只承担“会话状态”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | planned |
| 取消语义 | 完成“取消语义”中的关键理解、操作或判断 | 取消语义：实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。 | list | 该块只承担“取消语义”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | planned |
| 重放验证 | 完成“重放验证”中的关键理解、操作或判断 | 重放验证：实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。 | flashcard | 该块只承担“重放验证”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 | planned |

## 视觉与复习

- 难点理解计划：以把增量事件和最终状态放在同一张状态机中。作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：把增量事件和最终状态放在同一张状态机中。；用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。
- 复习卡片：flashcard_ref: a06-stream-is-not-success；flashcard_ref: a06-response-id-boundary
- 参考资料卡片：Gemini API documentation（https://ai.google.dev/gemini-api/docs）；JSON Schema specification（https://json-schema.org/specification）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

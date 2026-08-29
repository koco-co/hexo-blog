---
title: Agent 应用开发(九)MCP服务与协议
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 9
published: false
abbrlink: a1bb688f
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：理解 MCP 的生命周期、能力发现、结果、兼容、订阅和取消语义。
- 可观察成果：完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 C03、C08 的相关实验与边界判断。
- 覆盖条目：协议层次、能力发现、结果与错误、兼容验证
- 失败边界：使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 协议层次 | 理解 MCP 的生命周期、能力发现、结果、兼容、订阅和取消语义。 | 协议层次：完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | planned |
| 能力发现 | 完成“能力发现”中的关键理解、操作或判断 | 能力发现：完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。 | note primary flat | 该块只承担“能力发现”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | planned |
| 结果与错误 | 完成“结果与错误”中的关键理解、操作或判断 | 结果与错误：完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。 | list | 该块只承担“结果与错误”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | planned |
| 兼容验证 | 完成“兼容验证”中的关键理解、操作或判断 | 兼容验证：完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。 | flashcard | 该块只承担“兼容验证”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。
- 复习卡片：flashcard_ref: c09-mcp-vs-function-calling；flashcard_ref: c09-cancel-direction
- 参考资料卡片：LangGraph documentation（https://langchain-ai.github.io/langgraph/）；OpenAI Agents SDK documentation（https://openai.github.io/openai-agents-python/）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

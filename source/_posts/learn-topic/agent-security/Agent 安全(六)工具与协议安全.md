---
title: Agent 安全(六)工具与协议安全
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 6
published: false
abbrlink: fa29227d
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：测试 MCP、OAuth、代理、句柄、会话和上游授权的独立边界。
- 可观察成果：能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 F03、F05、C09 的相关实验与边界判断。
- 覆盖条目：令牌边界、协议代理、句柄状态、用户同意
- 失败边界：使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 令牌边界 | 测试 MCP、OAuth、代理、句柄、会话和上游授权的独立边界。 | 令牌边界：能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | planned |
| 协议代理 | 完成“协议代理”中的关键理解、操作或判断 | 协议代理：能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。 | note primary flat | 该块只承担“协议代理”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | planned |
| 句柄状态 | 完成“句柄状态”中的关键理解、操作或判断 | 句柄状态：能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。 | table | 该块只承担“句柄状态”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | planned |
| 用户同意 | 完成“用户同意”中的关键理解、操作或判断 | 用户同意：能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。 | flashcard | 该块只承担“用户同意”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。
- 复习卡片：flashcard_ref: f06-client-token-boundary；flashcard_ref: f06-handle-session-distinct
- 参考资料卡片：Model Context Protocol authorization（https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization）；OpenAI safety best practices（https://platform.openai.com/docs/guides/safety-best-practices）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

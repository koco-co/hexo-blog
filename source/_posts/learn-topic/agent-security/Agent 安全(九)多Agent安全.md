---
title: Agent 安全(九)多Agent安全
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能阻止伪造批准、旧消息和过期授权导致写入。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 9
published: false
abbrlink: 3abba4fd
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：验证委派、消息、审批、身份和级联失败在多 Agent 场景下仍受控。
- 可观察成果：能阻止伪造批准、旧消息和过期授权导致写入。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 F03、C10 的相关实验与边界判断。
- 覆盖条目：委派边界、消息真实性、过期授权、级联响应
- 失败边界：用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 委派边界 | 验证委派、消息、审批、身份和级联失败在多 Agent 场景下仍受控。 | 委派边界：能阻止伪造批准、旧消息和过期授权导致写入。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | planned |
| 消息真实性 | 完成“消息真实性”中的关键理解、操作或判断 | 消息真实性：能阻止伪造批准、旧消息和过期授权导致写入。 | note primary flat | 该块只承担“消息真实性”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | planned |
| 过期授权 | 完成“过期授权”中的关键理解、操作或判断 | 过期授权：能阻止伪造批准、旧消息和过期授权导致写入。 | list | 该块只承担“过期授权”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | planned |
| 级联响应 | 完成“级联响应”中的关键理解、操作或判断 | 级联响应：能阻止伪造批准、旧消息和过期授权导致写入。 | flashcard | 该块只承担“级联响应”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。
- 复习卡片：flashcard_ref: f09-child-claim-not-auth；flashcard_ref: f09-local-vs-cascade
- 参考资料卡片：NIST AI Risk Management Framework（https://www.nist.gov/itl/ai-risk-management-framework）；Model Context Protocol authorization（https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

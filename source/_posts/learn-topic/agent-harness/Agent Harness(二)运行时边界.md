---
title: Agent Harness(二)运行时边界
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能为一次运行画出边界并定义 adapter、executor、state、observe 接口。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 2
published: false
abbrlink: '3088e754'
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：区分 Agent 应用、执行器、Harness、评测器和基础设施的责任。
- 可观察成果：能为一次运行画出边界并定义 adapter、executor、state、observe 接口。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 D01 的相关实验与边界判断。
- 覆盖条目：职责边界、接口分层、运行对象、观测对象
- 失败边界：用 Fake runtime 连接应用和 Harness，列出可替换接口。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 职责边界 | 区分 Agent 应用、执行器、Harness、评测器和基础设施的责任。 | 职责边界：能为一次运行画出边界并定义 adapter、executor、state、observe 接口。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake runtime 连接应用和 Harness，列出可替换接口。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake runtime 连接应用和 Harness，列出可替换接口。 | planned |
| 接口分层 | 完成“接口分层”中的关键理解、操作或判断 | 接口分层：能为一次运行画出边界并定义 adapter、executor、state、observe 接口。 | note primary flat | 该块只承担“接口分层”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake runtime 连接应用和 Harness，列出可替换接口。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake runtime 连接应用和 Harness，列出可替换接口。 | planned |
| 运行对象 | 完成“运行对象”中的关键理解、操作或判断 | 运行对象：能为一次运行画出边界并定义 adapter、executor、state、observe 接口。 | code | 该块只承担“运行对象”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake runtime 连接应用和 Harness，列出可替换接口。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake runtime 连接应用和 Harness，列出可替换接口。 | planned |
| 观测对象 | 完成“观测对象”中的关键理解、操作或判断 | 观测对象：能为一次运行画出边界并定义 adapter、executor、state、observe 接口。 | flashcard | 该块只承担“观测对象”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake runtime 连接应用和 Harness，列出可替换接口。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake runtime 连接应用和 Harness，列出可替换接口。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；用 Fake runtime 连接应用和 Harness，列出可替换接口。
- 复习卡片：flashcard_ref: d02-trace-vs-harness
- 参考资料卡片：Python asyncio documentation（https://docs.python.org/3/library/asyncio.html）；W3C Trace Context（https://www.w3.org/TR/trace-context/）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

---
title: Agent Harness(十二)服务运维
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能区分 health 200、可接新任务和可恢复正确任务。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 12
published: false
abbrlink: 97e0f9eb
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：为 Harness 提供健康、就绪、SLO、停止、drain、版本和恢复检查。
- 可观察成果：能区分 health 200、可接新任务和可恢复正确任务。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 D08、D09、D10、D11、C13 的相关实验与边界判断。
- 覆盖条目：健康检查、优雅停止、SLO字段、版本恢复
- 失败边界：用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 健康检查 | 为 Harness 提供健康、就绪、SLO、停止、drain、版本和恢复检查。 | 健康检查：能区分 health 200、可接新任务和可恢复正确任务。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | planned |
| 优雅停止 | 完成“优雅停止”中的关键理解、操作或判断 | 优雅停止：能区分 health 200、可接新任务和可恢复正确任务。 | note primary flat | 该块只承担“优雅停止”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | planned |
| SLO字段 | 完成“SLO字段”中的关键理解、操作或判断 | SLO字段：能区分 health 200、可接新任务和可恢复正确任务。 | list | 该块只承担“SLO字段”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | planned |
| 版本恢复 | 完成“版本恢复”中的关键理解、操作或判断 | 版本恢复：能区分 health 200、可接新任务和可恢复正确任务。 | flashcard | 该块只承担“版本恢复”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。
- 复习卡片：flashcard_ref: d12-health-not-correct
- 参考资料卡片：OpenTelemetry documentation（https://opentelemetry.io/docs/）；LangGraph persistence（https://langchain-ai.github.io/langgraph/concepts/persistence/）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

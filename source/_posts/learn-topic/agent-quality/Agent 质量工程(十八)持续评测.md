---
title: Agent 质量工程(十八)持续评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能设计离线→canary→rollback→incident 的持续门禁。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 18
published: false
abbrlink: 50d7238b
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：把离线、canary、在线 SLO、回滚和事故复盘连接起来。
- 可观察成果：能设计离线→canary→rollback→incident 的持续门禁。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 E09、E10、E16、E17 的相关实验与边界判断。
- 覆盖条目：发布阶段、在线监控、回滚验证、事故字段
- 失败边界：用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 发布阶段 | 把离线、canary、在线 SLO、回滚和事故复盘连接起来。 | 发布阶段：能设计离线→canary→rollback→incident 的持续门禁。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | planned |
| 在线监控 | 完成“在线监控”中的关键理解、操作或判断 | 在线监控：能设计离线→canary→rollback→incident 的持续门禁。 | note primary flat | 该块只承担“在线监控”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | planned |
| 回滚验证 | 完成“回滚验证”中的关键理解、操作或判断 | 回滚验证：能设计离线→canary→rollback→incident 的持续门禁。 | code | 该块只承担“回滚验证”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | planned |
| 事故字段 | 完成“事故字段”中的关键理解、操作或判断 | 事故字段：能设计离线→canary→rollback→incident 的持续门禁。 | flashcard | 该块只承担“事故字段”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。
- 复习卡片：flashcard_ref: e18-offline-not-online；flashcard_ref: e18-rollback-verification
- 参考资料卡片：MLflow evaluation documentation（https://mlflow.org/docs/latest/genai/eval-monitor/）；NIST AI Risk Management Framework（https://www.nist.gov/itl/ai-risk-management-framework）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

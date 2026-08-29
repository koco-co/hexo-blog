---
title: Agent 质量工程(十)Trace与归因
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 10
published: false
abbrlink: 3fd443e5
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：从 Trace 找到第一处偏差，并用控制变量验证归因。
- 可观察成果：能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 E08、E09、D03 的相关实验与边界判断。
- 覆盖条目：轨迹读取、首个偏差、控制变量、归因边界
- 失败边界：对同一任务做一次受控重跑，说明单次干预不能证明因果。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 轨迹读取 | 从 Trace 找到第一处偏差，并用控制变量验证归因。 | 轨迹读取：能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；对同一任务做一次受控重跑，说明单次干预不能证明因果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对同一任务做一次受控重跑，说明单次干预不能证明因果。 | planned |
| 首个偏差 | 完成“首个偏差”中的关键理解、操作或判断 | 首个偏差：能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。 | note primary flat | 该块只承担“首个偏差”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对同一任务做一次受控重跑，说明单次干预不能证明因果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对同一任务做一次受控重跑，说明单次干预不能证明因果。 | planned |
| 控制变量 | 完成“控制变量”中的关键理解、操作或判断 | 控制变量：能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。 | list | 该块只承担“控制变量”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对同一任务做一次受控重跑，说明单次干预不能证明因果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对同一任务做一次受控重跑，说明单次干预不能证明因果。 | planned |
| 归因边界 | 完成“归因边界”中的关键理解、操作或判断 | 归因边界：能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。 | table | 该块只承担“归因边界”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对同一任务做一次受控重跑，说明单次干预不能证明因果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对同一任务做一次受控重跑，说明单次干预不能证明因果。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；对同一任务做一次受控重跑，说明单次干预不能证明因果。
- 复习卡片：flashcard_ref: e10-trace-not-oracle；flashcard_ref: e10-one-intervention-not-causal
- 参考资料卡片：MLflow evaluation documentation（https://mlflow.org/docs/latest/genai/eval-monitor/）；NIST AI Risk Management Framework（https://www.nist.gov/itl/ai-risk-management-framework）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

---
title: Agent 质量工程(九)评测系统校验
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能用已知结果与注入故障验证评分系统。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 9
published: false
abbrlink: d065deec
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：测试 runner、grader、聚合和错误分类本身，避免评测系统成为黑盒。
- 可观察成果：能用已知结果与注入故障验证评分系统。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 E06、E08 的相关实验与边界判断。
- 覆盖条目：已知结果、评分器故障、聚合故障、状态分类
- 失败边界：区分 fail、Unknown、error、skip，并验证聚合器。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 已知结果 | 测试 runner、grader、聚合和错误分类本身，避免评测系统成为黑盒。 | 已知结果：能用已知结果与注入故障验证评分系统。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；区分 fail、Unknown、error、skip，并验证聚合器。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 区分 fail、Unknown、error、skip，并验证聚合器。 | planned |
| 评分器故障 | 完成“评分器故障”中的关键理解、操作或判断 | 评分器故障：能用已知结果与注入故障验证评分系统。 | note primary flat | 该块只承担“评分器故障”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；区分 fail、Unknown、error、skip，并验证聚合器。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 区分 fail、Unknown、error、skip，并验证聚合器。 | planned |
| 聚合故障 | 完成“聚合故障”中的关键理解、操作或判断 | 聚合故障：能用已知结果与注入故障验证评分系统。 | list | 该块只承担“聚合故障”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；区分 fail、Unknown、error、skip，并验证聚合器。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 区分 fail、Unknown、error、skip，并验证聚合器。 | planned |
| 状态分类 | 完成“状态分类”中的关键理解、操作或判断 | 状态分类：能用已知结果与注入故障验证评分系统。 | table | 该块只承担“状态分类”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；区分 fail、Unknown、error、skip，并验证聚合器。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 区分 fail、Unknown、error、skip，并验证聚合器。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；区分 fail、Unknown、error、skip，并验证聚合器。
- 复习卡片：flashcard_ref: e09-runner-needs-testing
- 参考资料卡片：OpenAI evaluation best practices（https://platform.openai.com/docs/guides/evals-best-practices）；MLflow evaluation documentation（https://mlflow.org/docs/latest/genai/eval-monitor/）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

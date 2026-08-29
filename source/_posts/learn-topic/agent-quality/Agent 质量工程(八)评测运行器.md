---
title: Agent 质量工程(八)评测运行器
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能运行可复现的评测并保留每次运行的环境和预算。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 8
published: false
abbrlink: 48dacc68
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：实现隔离、重置、预算、超时、重放和结果收集。
- 可观察成果：能运行可复现的评测并保留每次运行的环境和预算。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 E07、D03、D06 的相关实验与边界判断。
- 覆盖条目：运行隔离、环境重置、预算控制、结果存储
- 失败边界：比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 运行隔离 | 实现隔离、重置、预算、超时、重放和结果收集。 | 运行隔离：能运行可复现的评测并保留每次运行的环境和预算。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | planned |
| 环境重置 | 完成“环境重置”中的关键理解、操作或判断 | 环境重置：能运行可复现的评测并保留每次运行的环境和预算。 | note primary flat | 该块只承担“环境重置”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | planned |
| 预算控制 | 完成“预算控制”中的关键理解、操作或判断 | 预算控制：能运行可复现的评测并保留每次运行的环境和预算。 | code | 该块只承担“预算控制”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | planned |
| 结果存储 | 完成“结果存储”中的关键理解、操作或判断 | 结果存储：能运行可复现的评测并保留每次运行的环境和预算。 | flashcard | 该块只承担“结果存储”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。
- 复习卡片：flashcard_ref: e08-replay-not-online；flashcard_ref: e08-mock-boundary
- 参考资料卡片：OpenAI evaluation guide（https://platform.openai.com/docs/guides/evals）；OpenAI evaluation best practices（https://platform.openai.com/docs/guides/evals-best-practices）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

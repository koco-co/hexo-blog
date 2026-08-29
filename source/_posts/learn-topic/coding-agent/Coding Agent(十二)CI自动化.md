---
title: Coding Agent(十二)CI自动化
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能区分 stdout JSONL、stderr 进度、退出码和缺失证据。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 12
published: false
abbrlink: 15664d55
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：把 Coding Agent 的结果接入可解析、可追溯、有证据要求的 CI。
- 可观察成果：能区分 stdout JSONL、stderr 进度、退出码和缺失证据。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 B07、B09 的相关实验与边界判断。
- 覆盖条目：作业边界、输出协议、失败门禁、证据产物
- 失败边界：用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 作业边界 | 把 Coding Agent 的结果接入可解析、可追溯、有证据要求的 CI。 | 作业边界：能区分 stdout JSONL、stderr 进度、退出码和缺失证据。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | planned |
| 输出协议 | 完成“输出协议”中的关键理解、操作或判断 | 输出协议：能区分 stdout JSONL、stderr 进度、退出码和缺失证据。 | note primary flat | 该块只承担“输出协议”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | planned |
| 失败门禁 | 完成“失败门禁”中的关键理解、操作或判断 | 失败门禁：能区分 stdout JSONL、stderr 进度、退出码和缺失证据。 | list | 该块只承担“失败门禁”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | planned |
| 证据产物 | 完成“证据产物”中的关键理解、操作或判断 | 证据产物：能区分 stdout JSONL、stderr 进度、退出码和缺失证据。 | flashcard | 该块只承担“证据产物”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。
- 复习卡片：flashcard_ref: b12-exit0-without-evidence
- 参考资料卡片：Claude Code documentation（https://docs.anthropic.com/en/docs/claude-code/overview）；GitHub Copilot documentation（https://docs.github.com/en/copilot）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

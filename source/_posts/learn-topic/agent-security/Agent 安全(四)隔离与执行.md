---
title: Agent 安全(四)隔离与执行
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能区分黑名单、dry-run 和真正的 host isolation。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 4
published: false
abbrlink: a00c2389
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：用沙箱、允许列表、资源上限和网络边界控制工具执行。
- 可观察成果：能区分黑名单、dry-run 和真正的 host isolation。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 F02、D09 的相关实验与边界判断。
- 覆盖条目：文件边界、进程边界、网络边界、资源限制
- 失败边界：对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 文件边界 | 用沙箱、允许列表、资源上限和网络边界控制工具执行。 | 文件边界：能区分黑名单、dry-run 和真正的 host isolation。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | planned |
| 进程边界 | 完成“进程边界”中的关键理解、操作或判断 | 进程边界：能区分黑名单、dry-run 和真正的 host isolation。 | table | 该块只承担“进程边界”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | planned |
| 网络边界 | 完成“网络边界”中的关键理解、操作或判断 | 网络边界：能区分黑名单、dry-run 和真正的 host isolation。 | table | 该块只承担“网络边界”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | planned |
| 资源限制 | 完成“资源限制”中的关键理解、操作或判断 | 资源限制：能区分黑名单、dry-run 和真正的 host isolation。 | flashcard | 该块只承担“资源限制”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。
- 复习卡片：flashcard_ref: f04-blacklist-not-sandbox；flashcard_ref: f04-dry-run-not-isolation
- 参考资料卡片：OWASP GenAI Security Project（https://genai.owasp.org/）；NIST AI Risk Management Framework（https://www.nist.gov/itl/ai-risk-management-framework）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

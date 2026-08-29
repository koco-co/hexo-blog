---
title: Agent 安全(三)身份与授权
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 3
published: false
abbrlink: eb945574
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：分清认证、授权、审批、委派和撤销，确保调用参数与身份绑定。
- 可观察成果：能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 F02 的相关实验与边界判断。
- 覆盖条目：身份来源、权限矩阵、审批绑定、撤销传播
- 失败边界：测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 身份来源 | 分清认证、授权、审批、委派和撤销，确保调用参数与身份绑定。 | 身份来源：能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | planned |
| 权限矩阵 | 完成“权限矩阵”中的关键理解、操作或判断 | 权限矩阵：能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。 | table | 该块只承担“权限矩阵”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | planned |
| 审批绑定 | 完成“审批绑定”中的关键理解、操作或判断 | 审批绑定：能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。 | code | 该块只承担“审批绑定”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | planned |
| 撤销传播 | 完成“撤销传播”中的关键理解、操作或判断 | 撤销传播：能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。 | flashcard | 该块只承担“撤销传播”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。
- 复习卡片：flashcard_ref: f03-authn-vs-authz；flashcard_ref: f03-child-cannot-expand；flashcard_ref: f03-changed-params-approval
- 参考资料卡片：OpenAI safety best practices（https://platform.openai.com/docs/guides/safety-best-practices）；OWASP GenAI Security Project（https://genai.owasp.org/）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

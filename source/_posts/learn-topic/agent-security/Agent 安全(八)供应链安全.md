---
title: Agent 安全(八)供应链安全
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能解释 checksum、signature、固定版本和依赖树的不同作用。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 8
published: false
abbrlink: dadcf53d
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；下面只记录写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：检查组件清单、版本、签名、校验和、权限与依赖更新。
- 可观察成果：能解释 checksum、signature、固定版本和依赖树的不同作用。
- 明确不承担：不重复前置文章的通用定义；跨主题扩展交给对应后续文章。

## 内容边界

- 进入条件：完成 F03、B09、D05 的相关实验与边界判断。
- 覆盖条目：组件清单、签名校验、权限审查、更新边界
- 失败边界：对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 还必须说明不适用条件、降级路径和不能由本篇单独证明的结论。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 组件清单 | 检查组件清单、版本、签名、校验和、权限与依赖更新。 | 组件清单：能解释 checksum、signature、固定版本和依赖树的不同作用。 | mermaid | 用关系图、流程图或对照表（按正文任务选择）承载主心智模型，再以文字解释因果与边界。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | planned |
| 签名校验 | 完成“签名校验”中的关键理解、操作或判断 | 签名校验：能解释 checksum、signature、固定版本和依赖树的不同作用。 | note primary flat | 该块只承担“签名校验”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | planned |
| 权限审查 | 完成“权限审查”中的关键理解、操作或判断 | 权限审查：能解释 checksum、signature、固定版本和依赖树的不同作用。 | list | 该块只承担“权限审查”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | planned |
| 更新边界 | 完成“更新边界”中的关键理解、操作或判断 | 更新边界：能解释 checksum、signature、固定版本和依赖树的不同作用。 | table | 该块只承担“更新边界”这一任务，避免把概念、操作和验收混成一段。 | 核心判断、操作步骤、输入输出、风险和验收条件；对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | 标签、图表或外部资源失效时，保留表格、列表、命令和文字结论。 | 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 | planned |

## 视觉与复习

- 难点理解计划：以关系图、流程图或对照表（按正文任务选择）作为主心智模型，先给出观察或反例，再解释真实机制、隐喻边界和迁移检查。
- 标签选型复查：写作时从当前完整标签目录选择；禁止 tip，note 只按语义使用 flat，长原理用 folding，平行实现才使用 tabs。
- 图表或实验：关系图、流程图或对照表（按正文任务选择）；对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。
- 复习卡片：flashcard_ref: f08-checksum-signature；flashcard_ref: f08-pinned-not-frozen
- 参考资料卡片：OWASP GenAI Security Project（https://genai.owasp.org/）；NIST AI Risk Management Framework（https://www.nist.gov/itl/ai-risk-management-framework）

## 验收证据

- 机械检查：运行 content、tags、assets、lint 与闪卡相关检查，修复具体文件错误。
- 隔离构建：在隔离草稿环境完成构建、桌面与移动路由检查，确认标签、图片、降级和课程导航。
- 正文完成条件：补齐真实机制、可复现实验、失败边界、参考资料和必要闪卡；独立复核通过后删除占位标记并切换为 published: true。

---
title: AI 大模型应用(一)入门路线
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 把测试开发工程师已有的 HTTP、Python、接口校验和故障分析能力迁移到可控的大模型应用开发。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 1
published: false
abbrlink: e84c4882
date: 2026-07-03 00:00:00
---

<!-- learn-topic-placeholder -->


{% course_series %}

## 课程目标

{% note info flat %}
把测试开发工程师已有的 HTTP、Python、接口校验和故障分析能力迁移到可控的大模型应用开发。

毕业成果：交付一个使用 FakeProvider、可替换模型、结构化输出、流式状态、成本预算与 Pytest 验证的工单分析 CLI。
{% endnote %}

## 前置条件

{% note info flat %}
已有 Python、Shell、HTTP、Git、数据库、CI/CD 和接口测试基础；模型训练与算法数学只补齐应用开发和测试所需的直觉。课程使用合成夹具优先，真实服务和付费 API 不作为脚手架门槛。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[共同基础] --> B[AI 大模型应用]
  B --> C[实验与验收]
  C --> D[项目交付]
{% endmermaid %}

{% note info flat %}
按共同基础、主线工程、质量安全和项目交付推进。每篇文章都把输入、操作、失败边界和验收证据作为学习结果。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | AI 大模型应用(一)入门路线 | 说明AI 大模型应用的范围、前置、阅读顺序与毕业成果。 | — | 入口 |
| 2 | [AI 大模型应用(二)模型与生成机制](/posts/91821408/) | 解释同一输入为何可能产生不同输出，并建立生成过程、采样和能力边界的直觉模型。 | A01 | 已完成 |
| 3 | [AI 大模型应用(三)API调用与开发环境](/posts/b9890c77/) | 把一次模型调用拆成环境、身份、请求、响应和错误边界，避免把配置问题误判为模型问题。 | A02 | 已完成 |
| 4 | [AI 大模型应用(四)Prompt与任务契约](/posts/4d0efd05/) | 把自然语言目标改写成可测量、可版本化、可审查的任务契约。 | A03 | 已完成 |
| 5 | [AI 大模型应用(五)结构化输出与校验](/posts/1c062ecc/) | 把模型文本转成可信的业务数据，并区分请求拒绝、终止状态、解析失败和业务校验失败。 | A04 | 已完成 |
| 6 | [AI 大模型应用(六)流式输出与对话状态](/posts/35adff19/) | 正确处理增量事件、会话状态、取消、重放和最终完成，避免把“看到文字”当成成功。 | A05 | 已完成 |
| 7 | [AI 大模型应用(七)上下文与缓存管理](/posts/a25c65da/) | 在上下文长度、缓存命中和证据保真之间做出可解释取舍。 | A06 | 已完成 |
| 8 | [AI 大模型应用(八)多厂商接口适配](/posts/28205af6/) | 在切换厂商或 API 表面时保持语义不变，识别兼容层不能覆盖的差异。 | A05、A06 | 已完成 |
| 9 | [AI 大模型应用(九)多模态与文件处理](/posts/ea3d2cfe/) | 把截图和 PDF 的输入、引用、截取、限制和结果检查串成证据链。 | A03、A05 | 已完成 |
| 10 | [AI 大模型应用(十)调用可靠性与成本](/posts/3955aac0/) | 把截止时间、预算、重试、退避、限流、降级和成本核算放到同一个调用策略中。 | A06、A07、A08 | 已完成 |
| 11 | [AI 大模型应用(十一)模型评测与选型](/posts/99d73179/) | 用有限、分层、有业务意义的证据选择模型，而不是照搬排行榜。 | A05、A08、A10 | 已完成 |
| 12 | [AI 大模型应用(十二)模型生态与技术演进](/posts/6596650b/) | 按模型、API、应用、Agent 和评测层建立生态地图，并正确标注版本阶段。 | A02、A11 | 已完成 |
| 13 | [AI 大模型应用(十三)进阶路线](/posts/d5c97b4d/) | 围绕一个仍未解决的质量或成本瓶颈设计有停止条件的进阶实验。 | A11 | 已完成 |
| 14 | [AI 大模型应用(十四)项目实战](/posts/8b75caa9/) | 把本系列能力组合为一个可验证的工单分析 CLI，并留下可迁移的验收证据。 | A03、A04、A05、A06、A08、A10、A11 | 已完成 |
## 开始学习

{% note primary flat %}
先完成路线自检，再从《AI 大模型应用(二)模型与生成机制》开始。实验优先使用 FakeProvider、Fake HTTP、Fake tool 或合成仓库；完成一篇后保留命令、输出、失败分类和复跑条件。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link OpenAI Platform documentation, https://platform.openai.com/docs/overview, https://platform.openai.com/favicon.ico %}
{% link Anthropic API documentation, https://docs.anthropic.com/en/docs/intro, https://docs.anthropic.com/favicon.ico %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://ai.google.dev/favicon.ico %}
{% endlinkgroup %}

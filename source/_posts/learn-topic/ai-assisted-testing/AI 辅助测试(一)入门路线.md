---
title: AI 辅助测试(一)入门路线
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 把 AI 贯穿需求分析、测试设计、数据、单元/API/UI 生成、探索、缺陷修复、资产验收和 CI。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 1
published: false
abbrlink: 3108c736
date: 2026-08-15 00:00:00
---

<!-- learn-topic-placeholder -->


{% course_series %}

## 课程目标

{% note info flat %}
把 AI 贯穿需求分析、测试设计、数据、单元/API/UI 生成、探索、缺陷修复、资产验收和 CI。

毕业成果：交付一套带独立 Oracle、真实执行、缺陷与 mutation 证据、CI 产物和安全边界的 AI 测试流水线。
{% endnote %}

## 前置条件

{% note info flat %}
已有 Python、Shell、HTTP、Git、数据库、CI/CD 和接口测试基础；模型训练与算法数学只补齐应用开发和测试所需的直觉。课程使用合成夹具优先，真实服务和付费 API 不作为脚手架门槛。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[共同基础] --> B[AI 辅助测试]
  B --> C[实验与验收]
  C --> D[项目交付]
{% endmermaid %}

{% note info flat %}
按共同基础、主线工程、质量安全和项目交付推进。每篇文章都把输入、操作、失败边界和验收证据作为学习结果。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | AI 辅助测试(一)入门路线 | 说明AI 辅助测试的范围、前置、阅读顺序与毕业成果。 | — | 入口 |
| 2 | [AI 辅助测试(二)协作边界](/posts/41bcbe17/) | 明确需求、测试设计、生成、执行、业务验收和 Agent 的职责边界。 | G01 | 已完成 |
| 3 | [AI 辅助测试(三)需求与测试设计](/posts/a2ef184d/) | 用覆盖、歧义、状态和风险把需求变成可检查测试计划。 | G02、E03、E04 | 已完成 |
| 4 | [AI 辅助测试(四)数据与环境](/posts/6fc55581/) | 建立业务数据工厂、约束、种子、隔离和重置环境。 | G03 | 已完成 |
| 5 | [AI 辅助测试(五)单元测试生成](/posts/aa11ab/) | 让生成的单元测试围绕独立 Oracle、已知缺陷和 mutation 结果验收。 | G04 | 已完成 |
| 6 | [AI 辅助测试(六)API测试生成](/posts/bd0ac657/) | 把 OpenAPI、状态链、真实响应 ID 和清理动作转为可执行 API 测试。 | G04、G05 | 已完成 |
| 7 | [AI 辅助测试(七)UI测试生成](/posts/4c7b859b/) | 将规划、生成、Playwright 执行、定位和工件职责分开。 | G03、G04、G05 | 已完成 |
| 8 | [AI 辅助测试(八)探索式测试](/posts/cf56e6/) | 用 charter、预算、观察、复现和跟进动作约束 Agent 探索。 | G06、G07、E10 | 已完成 |
| 9 | [AI 辅助测试(九)缺陷分析与维护](/posts/6c305e52/) | 把 healer 当候选补丁，而不是自动真修复，要求干净重跑和差异审查。 | G07、G08、E09、E10 | 已完成 |
| 10 | [AI 辅助测试(十)测试资产验收](/posts/ca1f50ce/) | 用缺陷、mutation、误报和人工接受度证明测试资产有效。 | G05、G06、G07、G08、G09、E05 | 已完成 |
| 11 | [AI 辅助测试(十一)CI流水线](/posts/f5e80d23/) | 把生成作业、验证作业、来源、版本、失败证据和发布门禁分开。 | G09、G10、E18、B12、D12 | 已完成 |
| 12 | [AI 辅助测试(十二)项目实战](/posts/18a17ffa/) | 交付一个带需求到 CI 的 AI 测试资产流水线，并证明安全、质量和维护边界。 | G11、D13、E19、F10 | 已完成 |
## 开始学习

{% note primary flat %}
先完成路线自检，再从《AI 辅助测试(二)协作边界》开始。实验优先使用 FakeProvider、Fake HTTP、Fake tool 或合成仓库；完成一篇后保留命令、输出、失败分类和复跑条件。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link Playwright documentation, https://playwright.dev/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% link Schemathesis documentation, https://schemathesis.readthedocs.io/en/stable/, https://schemathesis.readthedocs.io/en/stable/_static/favicon.svg %}
{% link Pytest documentation, https://docs.pytest.org/en/stable/, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

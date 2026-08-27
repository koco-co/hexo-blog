---
title: App测试(一)入门路线
tags:
  - App测试
  - 系统学习
categories:
  - Learn Topic
  - App测试
description: "Android App 测试完整闭环的学习路线与文章顺序。"
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 1
published: true
abbrlink: eba16d90
date: 2026-08-26 00:00:00
---

{% note info flat %}
这是一门围绕 Android 候选版本的 App 测试课程。主线从风险定义开始，经过环境与设备、ADB 证据、人工场景、兼容性、稳定性、可访问性、隐私安全、Monkey 和 Appium 自动化，最后用 pytest 与项目实战收束为可追溯的发布结论。
{% endnote %}

![App 测试课程封面](/img/picgo-images/app-testing-course-cover.png "App 测试课程封面")

{% course_series %}

{% note primary flat %}
入口篇只负责说明课程边界、依赖和阅读顺序；命令细节、失败诊断、自动化实现和复习卡片分别放在对应主题文章，所有主题都围绕同一条测试闭环展开。
{% endnote %}

## 课程目标

{% note info flat %}
完成课程后，读者能够针对一个 Android 候选 APK 设计风险优先的测试策略，准备并验收设备，使用 ADB 留存证据，执行人工与专项测试，用 Monkey 发现并复现稳定性问题，使用 Appium/pytest 构建可诊断的自动化回归，并依据覆盖、证据和残余风险给出发布结论。
{% endnote %}

## 前置条件

{% note info flat %}
需要基本终端操作、Python 与 pytest 阅读能力，以及“前置—步骤—预期—证据”的测试用例表达能力。课程会在 Android 环境篇补齐 SDK、模拟器、真机和 USB/无线调试；不要求先掌握 ADB、Monkey 或 Appium。iOS/XCUITest、图像自动化、设备云和原生测试协作只在可选进阶篇做选择索引。
{% endnote %}

## 学习路径

{% note info flat %}
按“先定义风险，再建立可观察环境；先完成人工和专项验证，再自动化并交付证据”的顺序学习。每一步都把输出交给下一步，任何失败先补齐当前阶段证据，不跳过环境或诊断直接堆叠脚本。
{% endnote %}

{% mermaid %}
flowchart TD
  A[测试策略与质量模型] --> B[Android 环境与设备]
  B --> C[ADB 管理与诊断证据]
  C --> D[功能与场景测试]
  D --> E[兼容性与适配]
  E --> F[稳定性与性能]
  F --> G[可用性与可访问性]
  G --> H[隐私与安全测试]
  H --> I[Monkey 稳定性测试]
  I --> J[Appium 架构与会话]
  J --> K[定位、交互与断言]
  K --> L[pytest 自动化与交付]
  L --> M[进阶选择]
  L --> N[项目实战]
{% endmermaid %}

## 文章安排

| 顺序 | 文章 | 学习主题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | App测试(一)入门路线 | 课程入口 | — | 公开路线图 |
| 2 | [App测试(二)测试策略与质量模型](/posts/688d03c1/) | 测试策略与质量模型 | 第 1 篇 | 已发布 |
| 3 | [App测试(三)Android 环境与设备](/posts/b69bc933/) | Android 环境与设备 | 第 2 篇 | 已发布 |
| 4 | [App测试(四)ADB 设备管理](/posts/7c0260ba/) | ADB 设备管理 | 第 3 篇 | 已发布 |
| 5 | [App测试(五)ADB 诊断与证据](/posts/16f2c2fd/) | ADB 诊断与证据 | 第 4 篇 | 已发布 |
| 6 | [App测试(六)功能与场景测试](/posts/a3a4aca2/) | 功能与场景测试 | 第 2 篇、第 3 篇、第 4 篇、第 5 篇 | 已发布 |
| 7 | [App测试(七)兼容性与适配](/posts/1a4ff107/) | 兼容性与适配 | 第 2 篇、第 3 篇、第 6 篇 | 已发布 |
| 8 | [App测试(八)稳定性与性能](/posts/50d100b7/) | 稳定性与性能 | 第 3 篇、第 5 篇、第 6 篇、第 7 篇 | 已发布 |
| 9 | [App测试(九)可用性与可访问性](/posts/d4da928f/) | 可用性与可访问性 | 第 6 篇、第 7 篇 | 已发布 |
| 10 | [App测试(十)隐私与安全测试](/posts/3ee984a8/) | 隐私与安全测试 | 第 4 篇、第 5 篇、第 6 篇 | 已发布 |
| 11 | [App测试(十一)Monkey 稳定性测试](/posts/d377608d/) | Monkey 稳定性测试 | 第 4 篇、第 5 篇、第 8 篇 | 已发布 |
| 12 | [App测试(十二)Appium 架构与会话](/posts/c877e017/) | Appium 架构与会话 | 第 3 篇、第 4 篇、第 5 篇 | 已发布 |
| 13 | [App测试(十三)元素定位与混合应用](/posts/2729920a/) | 元素定位与混合应用 | 第 12 篇 | 已发布 |
| 14 | [App测试(十四)交互、等待与断言](/posts/2f02a034/) | 交互、等待与断言 | 第 12 篇、第 13 篇 | 已发布 |
| 15 | [App测试(十五)自动化框架与交付](/posts/bdd9d1a1/) | 自动化框架与交付 | 第 12 篇、第 13 篇、第 14 篇 | 已发布 |
| 16 | [App测试(十六)进阶路线](/posts/b62af7fd/) | 进阶路线 | 第 7 篇、第 8 篇、第 9 篇、第 10 篇、第 15 篇 | 已发布 |
| 17 | [App测试(十七)项目实战](/posts/c0a414ba/) | 项目实战 | 第 2 篇、第 3 篇、第 4 篇、第 5 篇、第 6 篇、第 7 篇、第 8 篇、第 9 篇、第 10 篇、第 11 篇、第 12 篇、第 13 篇、第 14 篇、第 15 篇 | 已发布 |

## 开始学习

{% note success flat %}
从《App测试(二)测试策略与质量模型》开始：先用 ApiDemos 和一份候选版本写出风险矩阵、测试分层与退出准则，再沿课程顺序建立设备基线、证据目录和可复现的测试结果。建议每篇保留命令输出、截图/录屏、日志、环境信息和结论之间的关联，最后在项目实战中检查证据是否足以支撑发布判断。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link Android 测试基础与策略, https://developer.android.com/training/testing/fundamentals/strategies, https://developer.android.com/favicon.ico %}
{% link Android 核心质量指南, https://developer.android.com/docs/quality-guidelines/core-app-quality, https://developer.android.com/favicon.ico %}
{% link Android Monkey 官方文档, https://developer.android.com/studio/test/other-testing-tools/monkey, https://developer.android.com/favicon.ico %}
{% link Appium 官方文档, https://appium.io/docs/en/latest/, https://appium.io/favicon.ico %}
{% link pytest 官方文档, https://docs.pytest.org/en/stable/, https://docs.pytest.org/en/stable/_static/pytest_favicon.ico %}
{% endlinkgroup %}

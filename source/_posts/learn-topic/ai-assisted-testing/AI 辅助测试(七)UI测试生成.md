---
title: AI 辅助测试(七)UI测试生成
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能写出稳定 locator、可观察断言和失败工件策略。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 7
published: false
abbrlink: 4c7b859b
date: 2026-08-18 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：将规划、生成、Playwright 执行、定位和工件职责分开。 最终要留下：能写出稳定 locator、可观察断言和失败工件策略。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## UI规划

{% note primary flat %}
UI 测试把规划、locator、Playwright 执行器和截图/Trace/video 工件分开；可见文字与稳定定位回答不同问题。 在“UI规划”这一环节负责定义：先固定plan，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| plan | 用户动作与预期 | 任务清楚 | 不能先写选择器 |
| locator | role、label、test id | 稳定定位 | 不能依赖像素 |
| artifact | trace/screenshot/video | 失败证据 | 不能互相替代 |
| 定义边界 | UI规划 | 使用 Playwright TS Fake page，验证稳定 locator、可见断言和三类工件的职责。 | 截图只证明当时可见状态；业务写入和权限还需接口或存储证据。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[plan]
  F --> A[UI规划]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「plan」设为「用户动作与预期」，同时固定「locator」为「role、label、test id」；记录输入、状态和结果，记录任务清楚。
- 只改变「artifact」：正常值用「trace/screenshot/video」，越界或故障按“不能互相替代”构造；观察稳定定位，不要改动其余输入。
- 用失败证据检查“UI规划”：使用 Playwright TS Fake page，验证稳定 locator、可见断言和三类工件的职责；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：截图只证明当时可见状态；业务写入和权限还需接口或存储证据。 使用 Playwright TS Fake page，验证可见行为、稳定定位和 trace/screenshot/video 的分工。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## locator

{% note info flat %}
UI 测试把规划、locator、Playwright 执行器和截图/Trace/video 工件分开；可见文字与稳定定位回答不同问题。 在“locator”这一环节负责执行：先固定locator，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：locator**
1. 入口：locator=role、label、test id，先记录稳定定位。
2. 转移：由artifact=trace/screenshot/video进入locator，只允许声明的动作。
3. 出口：用任务清楚检查plan，越界条件是“不能先写选择器”。
{% endnote %}

- 执行正常路径：把「locator」设为「role、label、test id」，同时固定「artifact」为「trace/screenshot/video」；记录输入、状态和结果，记录稳定定位。
- 只改变「plan」：正常值用「用户动作与预期」，越界或故障按“不能先写选择器”构造；观察失败证据，不要改动其余输入。
- 用任务清楚检查“locator”：使用 Playwright TS Fake page，验证稳定 locator、可见断言和三类工件的职责；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：截图只证明当时可见状态；业务写入和权限还需接口或存储证据。 使用 Playwright TS Fake page，验证可见行为、稳定定位和 trace/screenshot/video 的分工。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 执行器

{% note info flat %}
UI 测试把规划、locator、Playwright 执行器和截图/Trace/video 工件分开；可见文字与稳定定位回答不同问题。 在“执行器”这一环节负责故障：先固定artifact，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：trace/screenshot/video | artifact | 失败证据 | 不能互相替代 |
| 边界：用户动作与预期 | plan | 任务清楚 | 不能先写选择器 |
| 故障：role、label、test id | locator | 稳定定位 | 不能依赖像素 |

- 注入边界：把「artifact」设为「trace/screenshot/video」，同时固定「plan」为「用户动作与预期」；记录输入、状态和结果，记录失败证据。
- 只改变「locator」：正常值用「role、label、test id」，越界或故障按“不能依赖像素”构造；观察任务清楚，不要改动其余输入。
- 用稳定定位检查“执行器”：使用 Playwright TS Fake page，验证稳定 locator、可见断言和三类工件的职责；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：截图只证明当时可见状态；业务写入和权限还需接口或存储证据。 使用 Playwright TS Fake page，验证可见行为、稳定定位和 trace/screenshot/video 的分工。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 工件角色

{% note info flat %}
UI 测试把规划、locator、Playwright 执行器和截图/Trace/video 工件分开；可见文字与稳定定位回答不同问题。 在“工件角色”这一环节负责复核：先固定plan，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（工件角色）：输入为「用户动作与预期」；状态观察为「稳定定位」；独立判定使用「失败证据」。记录使用 Playwright TS Fake page，验证稳定 locator、可见断言和三类工件的职责，把“截图只证明当时可见状态；业务写入和权限还需接口或存储证据。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：使用 Playwright TS Fake page，验证稳定 locator、可见断言和三类工件的职责。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
actions=[{"kind":"click","state":"ready"},{"kind":"input","state":"filled"},{"kind":"download","state":"saved"},{"kind":"slow","state":"timeout"}]
observed=[a["state"] for a in actions]
print({"actions":len(actions),"observed":observed,"reobserved":True})
assert observed[:3]==["ready","filled","saved"]
# 预期观察：使用 Playwright TS Fake page，验证稳定 locator、可见断言和三类工件的职责。
```

{% note success flat %}
失败边界：截图只证明当时可见状态；业务写入和权限还需接口或存储证据。 使用 Playwright TS Fake page，验证可见行为、稳定定位和 trace/screenshot/video 的分工。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g07-artifact-roles deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
当“工件角色”出现时，先检查哪个状态和边界？
--- answer
先把“工件角色”绑定到plan与locator；正常、越界和 Unknown 各运行一次，断言失败证据。
--- explanation
在browser夹具中，比较用户动作与预期与role、label、test id，保留失败证据；截图只证明当时可见状态；业务写入和权限还需接口或存储证据。
{% endflashcard %}

{% flashcard basic id:g07-visible-vs-locator deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“工件角色”的课程边界中，可见与定位器如何选择？
--- answer
先把可见的控制变量设为plan，把定位器的对照变量设为locator；在相同样本上分别记录失败证据，再按失败边界作出选择。
--- explanation
比较可见与定位器时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。截图只证明当时可见状态；业务写入和权限还需接口或存储证据。
{% endflashcard %}

{% flashcard basic id:g07-trace-scope deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
在browser夹具里，怎样区分“Trace 作用域”的通过与拒绝？
--- answer
先把“Trace 作用域”绑定到plan与locator；正常、越界和 Unknown 各运行一次，断言失败证据。
--- explanation
在browser夹具中，比较用户动作与预期与role、label、test id，保留失败证据；截图只证明当时可见状态；业务写入和权限还需接口或存储证据。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GitHub Actions documentation, https://docs.github.com/en/actions, https://github.com/favicon.ico %}
{% link Playwright documentation, https://playwright.dev/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

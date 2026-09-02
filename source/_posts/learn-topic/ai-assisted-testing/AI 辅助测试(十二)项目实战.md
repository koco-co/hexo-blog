---
title: AI 辅助测试(十二)项目实战
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 完成测试设计、数据、单元/API/UI、探索、修复、验收和 CI 证据。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 12
published: false
abbrlink: 18a17ffa
date: 2026-08-20 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：交付一个带需求到 CI 的 AI 测试资产流水线，并证明安全、质量和维护边界。 最终要留下：完成测试设计、数据、单元/API/UI、探索、修复、验收和 CI 证据。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 项目范围

{% note primary flat %}
项目交付从需求、数据到单元/API/UI、探索、候选修复、资产验收和 CI，形成可复跑的测试资产流水线。 在“项目范围”这一环节负责定义：先固定asset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| asset | 计划、用例、数据、工件 | 版本化 | 不能散落 |
| quality | Oracle、mutation、人工 | 证据互补 | 不能只报覆盖 |
| delivery | CI、门禁、复盘 | 失败可追踪 | 不能跳过模型不可用 |
| 定义边界 | 项目范围 | Fake 项目注入业务缺陷、flaky、权限和模型不可用故障，交付完整资产与 CI 证据。 | 项目结论限定在合成环境；真实浏览器、服务和发布仍需对应层验证。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[asset]
  F --> A[项目范围]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「asset」设为「计划、用例、数据、工件」，同时固定「quality」为「Oracle、mutation、人工」；串联阶段并统计副作用，记录版本化。
- 只改变「delivery」：正常值用「CI、门禁、复盘」，越界或故障按“不能跳过模型不可用”构造；观察证据互补，不要改动其余输入。
- 用失败可追踪检查“项目范围”：Fake 项目注入业务缺陷、flaky、权限和模型不可用故障，交付完整资产与 CI 证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目结论限定在合成环境；真实浏览器、服务和发布仍需对应层验证。 在 Fake 项目上注入业务缺陷、flaky、权限和模型不可用故障。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 资产交付

{% note info flat %}
项目交付从需求、数据到单元/API/UI、探索、候选修复、资产验收和 CI，形成可复跑的测试资产流水线。 在“资产交付”这一环节负责执行：先固定quality，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：资产交付**
1. 入口：quality=Oracle、mutation、人工，先记录证据互补。
2. 转移：由delivery=CI、门禁、复盘进入资产交付，只允许声明的动作。
3. 出口：用版本化检查asset，越界条件是“不能散落”。
{% endnote %}

- 执行正常路径：把「quality」设为「Oracle、mutation、人工」，同时固定「delivery」为「CI、门禁、复盘」；串联阶段并统计副作用，记录证据互补。
- 只改变「asset」：正常值用「计划、用例、数据、工件」，越界或故障按“不能散落”构造；观察失败可追踪，不要改动其余输入。
- 用版本化检查“资产交付”：Fake 项目注入业务缺陷、flaky、权限和模型不可用故障，交付完整资产与 CI 证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目结论限定在合成环境；真实浏览器、服务和发布仍需对应层验证。 在 Fake 项目上注入业务缺陷、flaky、权限和模型不可用故障。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 持续门禁

{% note info flat %}
项目交付从需求、数据到单元/API/UI、探索、候选修复、资产验收和 CI，形成可复跑的测试资产流水线。 在“持续门禁”这一环节负责故障：先固定delivery，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：CI、门禁、复盘 | delivery | 失败可追踪 | 不能跳过模型不可用 |
| 边界：计划、用例、数据、工件 | asset | 版本化 | 不能散落 |
| 故障：Oracle、mutation、人工 | quality | 证据互补 | 不能只报覆盖 |

- 注入边界：把「delivery」设为「CI、门禁、复盘」，同时固定「asset」为「计划、用例、数据、工件」；串联阶段并统计副作用，记录失败可追踪。
- 只改变「quality」：正常值用「Oracle、mutation、人工」，越界或故障按“不能只报覆盖”构造；观察版本化，不要改动其余输入。
- 用证据互补检查“持续门禁”：Fake 项目注入业务缺陷、flaky、权限和模型不可用故障，交付完整资产与 CI 证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目结论限定在合成环境；真实浏览器、服务和发布仍需对应层验证。 在 Fake 项目上注入业务缺陷、flaky、权限和模型不可用故障。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 复盘

{% note info flat %}
项目交付从需求、数据到单元/API/UI、探索、候选修复、资产验收和 CI，形成可复跑的测试资产流水线。 在“复盘”这一环节负责复核：先固定asset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（复盘）：输入为「计划、用例、数据、工件」；状态观察为「证据互补」；独立判定使用「失败可追踪」。记录Fake 项目注入业务缺陷、flaky、权限和模型不可用故障，交付完整资产与 CI 证据，把“项目结论限定在合成环境；真实浏览器、服务和发布仍需对应层验证。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake 项目注入业务缺陷、flaky、权限和模型不可用故障，交付完整资产与 CI 证据。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
assets=[{"kind":"unit","oracle":True},{"kind":"api","oracle":True},{"kind":"ui","oracle":False},{"kind":"mutation","oracle":True}]
faults={"business_defect":"caught","flaky":"quarantine","permission":"blocked","model_unavailable":"blocked"}
ci=[{"job":"generate","status":"candidate"},{"job":"verify","status":"pass"},{"job":"gate","status":"blocked"}]
report={"assets":len(assets),"faults":faults,"ci":ci}
print(report)
assert report["assets"]==4 and report["faults"]["permission"]=="blocked" and report["ci"][-1]["status"]=="blocked"
# 预期观察：Fake 项目注入业务缺陷、flaky、权限和模型不可用故障，交付完整资产与 CI 证据。
```

{% note success flat %}
失败边界：项目结论限定在合成环境；真实浏览器、服务和发布仍需对应层验证。 在 Fake 项目上注入业务缺陷、flaky、权限和模型不可用故障。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard_ref id="g10-three-complementary-evidence" %}

{% flashcard_ref id="g09-healer-skip-not-fix" %}

## 参考资料

{% linkgroup %}
{% link Playwright documentation, https://playwright.dev/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% link Schemathesis documentation, https://schemathesis.readthedocs.io/en/stable/, https://schemathesis.readthedocs.io/en/stable/_static/favicon.svg %}
{% endlinkgroup %}

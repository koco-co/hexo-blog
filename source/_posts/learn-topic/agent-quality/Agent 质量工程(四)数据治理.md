---
title: Agent 质量工程(四)数据治理
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能构造 32 条合成数据，并防止随机切分泄漏。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 4
published: false
abbrlink: dd9c633c
date: 2026-08-01 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：治理来源、授权、切分、标签、版本和合成数据的代表性。 最终要留下：能构造 32 条合成数据，并防止随机切分泄漏。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 来源授权

{% note primary flat %}
数据治理先核对授权和来源，再按租户、版本、模板切分，最后检查标签版本与真实分布。 在“来源授权”这一环节负责定义：先固定source，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| source | 许可、租户、版本 | 可追溯 | 不能混用 |
| split | 按组而非随机 | 泄漏检查 | 不能共享近重复 |
| label | 标签定义与版本 | 变更记录 | 不能静默重标 |
| 定义边界 | 来源授权 | 按租户、版本和模板切分 32 行，注入相似样本和泄漏并让检查报告具体行。 | 合成数据可控但未必代表线上；必须写出未覆盖人群和场景。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[source]
  F --> A[来源授权]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「source」设为「许可、租户、版本」，同时固定「split」为「按组而非随机」；记录输入、状态和结果，记录可追溯。
- 只改变「label」：正常值用「标签定义与版本」，越界或故障按“不能静默重标”构造；观察泄漏检查，不要改动其余输入。
- 用变更记录检查“来源授权”：按租户、版本和模板切分 32 行，注入相似样本和泄漏并让检查报告具体行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：合成数据可控但未必代表线上；必须写出未覆盖人群和场景。 按租户、版本和模板切分 32 行，注入相似样本和泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 数据切分

{% note info flat %}
数据治理先核对授权和来源，再按租户、版本、模板切分，最后检查标签版本与真实分布。 在“数据切分”这一环节负责执行：先固定split，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：数据切分**
1. 入口：split=按组而非随机，先记录泄漏检查。
2. 转移：由label=标签定义与版本进入数据切分，只允许声明的动作。
3. 出口：用可追溯检查source，越界条件是“不能混用”。
{% endnote %}

- 执行正常路径：把「split」设为「按组而非随机」，同时固定「label」为「标签定义与版本」；记录输入、状态和结果，记录泄漏检查。
- 只改变「source」：正常值用「许可、租户、版本」，越界或故障按“不能混用”构造；观察变更记录，不要改动其余输入。
- 用可追溯检查“数据切分”：按租户、版本和模板切分 32 行，注入相似样本和泄漏并让检查报告具体行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：合成数据可控但未必代表线上；必须写出未覆盖人群和场景。 按租户、版本和模板切分 32 行，注入相似样本和泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 标签版本

{% note info flat %}
数据治理先核对授权和来源，再按租户、版本、模板切分，最后检查标签版本与真实分布。 在“标签版本”这一环节负责故障：先固定label，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：标签定义与版本 | label | 变更记录 | 不能静默重标 |
| 边界：许可、租户、版本 | source | 可追溯 | 不能混用 |
| 故障：按组而非随机 | split | 泄漏检查 | 不能共享近重复 |

- 注入边界：把「label」设为「标签定义与版本」，同时固定「source」为「许可、租户、版本」；记录输入、状态和结果，记录变更记录。
- 只改变「split」：正常值用「按组而非随机」，越界或故障按“不能共享近重复”构造；观察可追溯，不要改动其余输入。
- 用泄漏检查检查“标签版本”：按租户、版本和模板切分 32 行，注入相似样本和泄漏并让检查报告具体行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：合成数据可控但未必代表线上；必须写出未覆盖人群和场景。 按租户、版本和模板切分 32 行，注入相似样本和泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 代表性

{% note info flat %}
数据治理先核对授权和来源，再按租户、版本、模板切分，最后检查标签版本与真实分布。 在“代表性”这一环节负责复核：先固定source，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（代表性）：输入为「许可、租户、版本」；状态观察为「泄漏检查」；独立判定使用「变更记录」。记录按租户、版本和模板切分 32 行，注入相似样本和泄漏并让检查报告具体行，把“合成数据可控但未必代表线上；必须写出未覆盖人群和场景。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：按租户、版本和模板切分 32 行，注入相似样本和泄漏并让检查报告具体行。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
rows=[{"tenant":"a" if i%2 else "b","template":"refund" if i%3 else "login","version":1} for i in range(20)]
keys={(r["tenant"],r["template"],r["version"]) for r in rows}
leak=len(rows)-len(keys)
print({"candidates":len(rows),"unique_constraints":len(keys),"duplicate_or_leak":leak})
assert len(rows)==20 and leak>0
# 预期观察：按租户、版本和模板切分 32 行，注入相似样本和泄漏并让检查报告具体行。
```

{% note success flat %}
失败边界：合成数据可控但未必代表线上；必须写出未覆盖人群和场景。 按租户、版本和模板切分 32 行，注入相似样本和泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e04-random-split-leakage deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“代表性”的课程边界中，怎样用source验证“随机切分泄漏”？
--- answer
先把“随机切分泄漏”绑定到source与split；正常、越界和 Unknown 各运行一次，断言变更记录。
--- explanation
在data夹具中，比较许可、租户、版本与按组而非随机，保留变更记录；合成数据可控但未必代表线上；必须写出未覆盖人群和场景。
{% endflashcard %}

{% flashcard basic id:e04-synthetic-not-representative deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“代表性”的课程边界中，为什么“合成数据”不是“代表性”？
--- answer
合成数据只提供可追溯；代表性还需要在split上由变更记录确认，不能只看文本或单个事件。
--- explanation
在data夹具中分别运行“合成数据”和“代表性”，比较许可、租户、版本与按组而非随机；合成数据可控但未必代表线上；必须写出未覆盖人群和场景。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

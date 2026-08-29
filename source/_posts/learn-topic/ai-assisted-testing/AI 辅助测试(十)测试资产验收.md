---
title: AI 辅助测试(十)测试资产验收
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能组合三类互补证据，计算有效分母并划定人工复核。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 10
published: true
abbrlink: ca1f50ce
date: 2026-08-19 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：用缺陷、mutation、误报和人工接受度证明测试资产有效。 最终要留下：能组合三类互补证据，计算有效分母并划定人工复核。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 资产分类

{% note primary flat %}
测试资产验收把真实缺陷捕获、mutation、误报和人工接受度组合为互补证据，并为每项定义正确分母。 在“资产分类”这一环节负责定义：先固定defect，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| defect | 已知业务缺陷 | 捕获率 | 不能代表未知 |
| mutation | 变异分母 | 断言力量 | 不能重复计数 |
| human | 业务接受与风险 | 责任确认 | 不能自动化替代 |
| 定义边界 | 资产分类 | 比较生成、执行、缺陷捕获、mutation 和人工验收，报告三类证据而不重复计数。 | 指标不相容时保留分层结果；人工未确认的资产不能直接发布。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[defect]
  F --> A[资产分类]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「defect」设为「已知业务缺陷」，同时固定「mutation」为「变异分母」；记录输入、状态和结果，记录捕获率。
- 只改变「human」：正常值用「业务接受与风险」，越界或故障按“不能自动化替代”构造；观察断言力量，不要改动其余输入。
- 用责任确认检查“资产分类”：比较生成、执行、缺陷捕获、mutation 和人工验收，报告三类证据而不重复计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：指标不相容时保留分层结果；人工未确认的资产不能直接发布。 比较生成、执行、缺陷捕获、mutation 和人工验收，不重复计数。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## mutation分母

{% note info flat %}
测试资产验收把真实缺陷捕获、mutation、误报和人工接受度组合为互补证据，并为每项定义正确分母。 在“mutation分母”这一环节负责执行：先固定mutation，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：mutation分母**
1. 入口：mutation=变异分母，先记录断言力量。
2. 转移：由human=业务接受与风险进入mutation分母，只允许声明的动作。
3. 出口：用捕获率检查defect，越界条件是“不能代表未知”。
{% endnote %}

- 执行正常路径：把「mutation」设为「变异分母」，同时固定「human」为「业务接受与风险」；记录输入、状态和结果，记录断言力量。
- 只改变「defect」：正常值用「已知业务缺陷」，越界或故障按“不能代表未知”构造；观察责任确认，不要改动其余输入。
- 用捕获率检查“mutation分母”：比较生成、执行、缺陷捕获、mutation 和人工验收，报告三类证据而不重复计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：指标不相容时保留分层结果；人工未确认的资产不能直接发布。 比较生成、执行、缺陷捕获、mutation 和人工验收，不重复计数。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 误报分析

{% note info flat %}
测试资产验收把真实缺陷捕获、mutation、误报和人工接受度组合为互补证据，并为每项定义正确分母。 在“误报分析”这一环节负责故障：先固定human，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：业务接受与风险 | human | 责任确认 | 不能自动化替代 |
| 边界：已知业务缺陷 | defect | 捕获率 | 不能代表未知 |
| 故障：变异分母 | mutation | 断言力量 | 不能重复计数 |

- 注入边界：把「human」设为「业务接受与风险」，同时固定「defect」为「已知业务缺陷」；记录输入、状态和结果，记录责任确认。
- 只改变「mutation」：正常值用「变异分母」，越界或故障按“不能重复计数”构造；观察捕获率，不要改动其余输入。
- 用断言力量检查“误报分析”：比较生成、执行、缺陷捕获、mutation 和人工验收，报告三类证据而不重复计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：指标不相容时保留分层结果；人工未确认的资产不能直接发布。 比较生成、执行、缺陷捕获、mutation 和人工验收，不重复计数。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 人工验收

{% note info flat %}
测试资产验收把真实缺陷捕获、mutation、误报和人工接受度组合为互补证据，并为每项定义正确分母。 在“人工验收”这一环节负责复核：先固定defect，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（人工验收）：输入为「已知业务缺陷」；状态观察为「断言力量」；独立判定使用「责任确认」。记录比较生成、执行、缺陷捕获、mutation 和人工验收，报告三类证据而不重复计数，把“指标不相容时保留分层结果；人工未确认的资产不能直接发布。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：比较生成、执行、缺陷捕获、mutation 和人工验收，报告三类证据而不重复计数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
checks={"outcome":True,"citation":True,"security":False}
gate=all(checks.values())
print({"gate":gate,"failed":[k for k,v in checks.items() if not v]})
assert not gate
# 预期观察：比较生成、执行、缺陷捕获、mutation 和人工验收，报告三类证据而不重复计数。
```

{% note success flat %}
失败边界：指标不相容时保留分层结果；人工未确认的资产不能直接发布。 比较生成、执行、缺陷捕获、mutation 和人工验收，不重复计数。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g10-mutation-denominator deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
在quality夹具里，怎样区分“变异分母”的通过与拒绝？
--- answer
先把“变异分母”绑定到defect与mutation；正常、越界和 Unknown 各运行一次，断言责任确认。
--- explanation
在quality夹具中，比较已知业务缺陷与变异分母，保留责任确认；指标不相容时保留分层结果；人工未确认的资产不能直接发布。
{% endflashcard %}

{% flashcard basic id:g10-three-complementary-evidence deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
测试资产验收为什么需要互补证据？
--- answer
缺陷捕获、mutation 和人工业务验收回答不同问题，必须使用各自分母，不能重复计数。
--- explanation
三类证据合在一起才能同时覆盖已知问题、断言力量和业务责任。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Pytest documentation, https://docs.pytest.org/en/stable/, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link GitHub Actions documentation, https://docs.github.com/en/actions, https://github.com/favicon.ico %}
{% endlinkgroup %}

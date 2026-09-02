---
title: AI 大模型应用(十四)项目实战
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 交付 20 条合成工单上的分析、结构化输出、流式显示、provider 切换、成本和 Pytest 报告。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 14
published: false
abbrlink: 8b75caa9
date: 2026-07-09 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把本系列能力组合为一个可验证的工单分析 CLI，并留下可迁移的验收证据。 最终要留下：交付 20 条合成工单上的分析、结构化输出、流式显示、provider 切换、成本和 Pytest 报告。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 范围定义

{% note primary flat %}
项目实战把请求、契约、流式事件、provider 适配、成本和质量报告串成一个可复跑 CLI，而不是拼接几段调用。 在“范围定义”这一环节负责定义：先固定input，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| input | 20 条合成工单 | 版本化 fixture | 不能使用真实隐私数据 |
| pipeline | 解析→检索→输出→报告 | 每步有状态 | 不能跳过拒答 |
| report | 质量、成本、失败 | 可重跑 artifact | 不能只截图 |
| 定义边界 | 范围定义 | CLI 对 20 条工单生成结构化报告，遇到冲突证据或预算耗尽时输出拒答/降级并保留 JSONL 证据。 | 项目完成以报告和失败样本为准；真实 provider、线上额度和部署不在本地夹具结论内。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[input]
  F --> A[范围定义]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「input」设为「20 条合成工单」，同时固定「pipeline」为「解析→检索→输出→报告」；串联阶段并统计副作用，记录版本化 fixture。
- 只改变「report」：正常值用「质量、成本、失败」，越界或故障按“不能只截图”构造；观察每步有状态，不要改动其余输入。
- 用可重跑 artifact检查“范围定义”：CLI 对 20 条工单生成结构化报告，遇到冲突证据或预算耗尽时输出拒答/降级并保留 JSONL 证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目完成以报告和失败样本为准；真实 provider、线上额度和部署不在本地夹具结论内。 使用 FakeProvider 和注入故障，完成成功、拒答、解析、限流、超时和预算场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 能力组合

{% note info flat %}
项目实战把请求、契约、流式事件、provider 适配、成本和质量报告串成一个可复跑 CLI，而不是拼接几段调用。 在“能力组合”这一环节负责执行：先固定pipeline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：能力组合**
1. 入口：pipeline=解析→检索→输出→报告，先记录每步有状态。
2. 转移：由report=质量、成本、失败进入能力组合，只允许声明的动作。
3. 出口：用版本化 fixture检查input，越界条件是“不能使用真实隐私数据”。
{% endnote %}

- 执行正常路径：把「pipeline」设为「解析→检索→输出→报告」，同时固定「report」为「质量、成本、失败」；串联阶段并统计副作用，记录每步有状态。
- 只改变「input」：正常值用「20 条合成工单」，越界或故障按“不能使用真实隐私数据”构造；观察可重跑 artifact，不要改动其余输入。
- 用版本化 fixture检查“能力组合”：CLI 对 20 条工单生成结构化报告，遇到冲突证据或预算耗尽时输出拒答/降级并保留 JSONL 证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目完成以报告和失败样本为准；真实 provider、线上额度和部署不在本地夹具结论内。 使用 FakeProvider 和注入故障，完成成功、拒答、解析、限流、超时和预算场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 验收矩阵

{% note info flat %}
项目实战把请求、契约、流式事件、provider 适配、成本和质量报告串成一个可复跑 CLI，而不是拼接几段调用。 在“验收矩阵”这一环节负责故障：先固定report，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：质量、成本、失败 | report | 可重跑 artifact | 不能只截图 |
| 边界：20 条合成工单 | input | 版本化 fixture | 不能使用真实隐私数据 |
| 故障：解析→检索→输出→报告 | pipeline | 每步有状态 | 不能跳过拒答 |

- 注入边界：把「report」设为「质量、成本、失败」，同时固定「input」为「20 条合成工单」；串联阶段并统计副作用，记录可重跑 artifact。
- 只改变「pipeline」：正常值用「解析→检索→输出→报告」，越界或故障按“不能跳过拒答”构造；观察版本化 fixture，不要改动其余输入。
- 用每步有状态检查“验收矩阵”：CLI 对 20 条工单生成结构化报告，遇到冲突证据或预算耗尽时输出拒答/降级并保留 JSONL 证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目完成以报告和失败样本为准；真实 provider、线上额度和部署不在本地夹具结论内。 使用 FakeProvider 和注入故障，完成成功、拒答、解析、限流、超时和预算场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 交付复盘

{% note info flat %}
项目实战把请求、契约、流式事件、provider 适配、成本和质量报告串成一个可复跑 CLI，而不是拼接几段调用。 在“交付复盘”这一环节负责复核：先固定input，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（交付复盘）：输入为「20 条合成工单」；状态观察为「每步有状态」；独立判定使用「可重跑 artifact」。记录CLI 对 20 条工单生成结构化报告，遇到冲突证据或预算耗尽时输出拒答/降级并保留 JSONL 证据，把“项目完成以报告和失败样本为准；真实 provider、线上额度和部署不在本地夹具结论内。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：CLI 对 20 条工单生成结构化报告，遇到冲突证据或预算耗尽时输出拒答/降级并保留 JSONL 证据。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
tickets=[f"T-{i:02d}" for i in range(1,21)]
faults={3:"conflict_evidence",15:"budget_exhausted"}
def classify(ticket):
    number=int(ticket[2:])
    return "refuse" if number in faults else "pass"
records=[{"id":t,"status":classify(t),"jsonl":True} for t in tickets]
pipeline=["prompt","schema","stream","report"]
summary={"tickets":len(records),"refused":sum(r["status"]=="refuse" for r in records),"jsonl":all(r["jsonl"] for r in records),"stages":pipeline}
print(summary)
assert summary["tickets"]==20 and summary["refused"]==2 and summary["jsonl"] and len(pipeline)==4
# 预期观察：CLI 对 20 条工单生成结构化报告，遇到冲突证据或预算耗尽时输出拒答/降级并保留 JSONL 证据。
```

{% note success flat %}
失败边界：项目完成以报告和失败样本为准；真实 provider、线上额度和部署不在本地夹具结论内。 使用 FakeProvider 和注入故障，完成成功、拒答、解析、限流、超时和预算场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard_ref id="a05-structured-output-boundaries" %}

{% flashcard_ref id="a10-retry-needs-deadline" %}

## 参考资料

{% linkgroup %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://ai.google.dev/favicon.ico %}
{% link JSON Schema specification, https://json-schema.org/specification, https://json-schema.org/favicon.ico %}
{% endlinkgroup %}

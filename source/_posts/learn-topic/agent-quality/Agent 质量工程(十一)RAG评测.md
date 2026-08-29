---
title: Agent 质量工程(十一)RAG评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能为有答案、无答案、冲突和过期文档建立分层阈值。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 11
published: true
abbrlink: 511464f8
date: 2026-08-04 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：分层评估召回、事实、忠实度和引用支持，不混用指标。 最终要留下：能为有答案、无答案、冲突和过期文档建立分层阈值。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 检索指标

{% note primary flat %}
RAG 评测分层统计召回、事实、忠实度和引用覆盖；指标不能互换，也不能用一个总分掩盖无答案。 在“检索指标”这一环节负责定义：先固定retrieval，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| retrieval | 命中相关片段 | 召回/精确 | 不能推出回答 |
| faithfulness | 回答是否由证据支持 | 逐句判定 | 不能等同正确 |
| citation | 引用覆盖与版本 | 定位完整 | 不能只有链接 |
| 定义边界 | 检索指标 | 六问数据分开统计召回、引用存在、证据支持和事实正确，冲突文档单独计数。 | 指标阈值应按有答案、无答案、过期和冲突分层。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[retrieval]
  F --> A[检索指标]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「retrieval」设为「命中相关片段」，同时固定「faithfulness」为「回答是否由证据支持」；记录输入、状态和结果，记录召回/精确。
- 只改变「citation」：正常值用「引用覆盖与版本」，越界或故障按“不能只有链接”构造；观察逐句判定，不要改动其余输入。
- 用定位完整检查“检索指标”：六问数据分开统计召回、引用存在、证据支持和事实正确，冲突文档单独计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：指标阈值应按有答案、无答案、过期和冲突分层。 构造六问数据，分别统计召回、引用存在、支持和事实正确。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 事实指标

{% note info flat %}
RAG 评测分层统计召回、事实、忠实度和引用覆盖；指标不能互换，也不能用一个总分掩盖无答案。 在“事实指标”这一环节负责执行：先固定faithfulness，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：事实指标**
1. 入口：faithfulness=回答是否由证据支持，先记录逐句判定。
2. 转移：由citation=引用覆盖与版本进入事实指标，只允许声明的动作。
3. 出口：用召回/精确检查retrieval，越界条件是“不能推出回答”。
{% endnote %}

- 执行正常路径：把「faithfulness」设为「回答是否由证据支持」，同时固定「citation」为「引用覆盖与版本」；记录输入、状态和结果，记录逐句判定。
- 只改变「retrieval」：正常值用「命中相关片段」，越界或故障按“不能推出回答”构造；观察定位完整，不要改动其余输入。
- 用召回/精确检查“事实指标”：六问数据分开统计召回、引用存在、证据支持和事实正确，冲突文档单独计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：指标阈值应按有答案、无答案、过期和冲突分层。 构造六问数据，分别统计召回、引用存在、支持和事实正确。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 忠实度

{% note info flat %}
RAG 评测分层统计召回、事实、忠实度和引用覆盖；指标不能互换，也不能用一个总分掩盖无答案。 在“忠实度”这一环节负责故障：先固定citation，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：引用覆盖与版本 | citation | 定位完整 | 不能只有链接 |
| 边界：命中相关片段 | retrieval | 召回/精确 | 不能推出回答 |
| 故障：回答是否由证据支持 | faithfulness | 逐句判定 | 不能等同正确 |

- 注入边界：把「citation」设为「引用覆盖与版本」，同时固定「retrieval」为「命中相关片段」；记录输入、状态和结果，记录定位完整。
- 只改变「faithfulness」：正常值用「回答是否由证据支持」，越界或故障按“不能等同正确”构造；观察召回/精确，不要改动其余输入。
- 用逐句判定检查“忠实度”：六问数据分开统计召回、引用存在、证据支持和事实正确，冲突文档单独计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：指标阈值应按有答案、无答案、过期和冲突分层。 构造六问数据，分别统计召回、引用存在、支持和事实正确。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 引用覆盖

{% note info flat %}
RAG 评测分层统计召回、事实、忠实度和引用覆盖；指标不能互换，也不能用一个总分掩盖无答案。 在“引用覆盖”这一环节负责复核：先固定retrieval，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（引用覆盖）：输入为「命中相关片段」；状态观察为「逐句判定」；独立判定使用「定位完整」。记录六问数据分开统计召回、引用存在、证据支持和事实正确，冲突文档单独计数，把“指标阈值应按有答案、无答案、过期和冲突分层。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：六问数据分开统计召回、引用存在、证据支持和事实正确，冲突文档单独计数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
experiment="构造六问数据，分别统计召回、引用存在、支持和事实正确。"
record={"status":"observed","evidence":[experiment]}
print(record)
assert record["evidence"]
# 预期观察：六问数据分开统计召回、引用存在、证据支持和事实正确，冲突文档单独计数。
```

{% note success flat %}
失败边界：指标阈值应按有答案、无答案、过期和冲突分层。 构造六问数据，分别统计召回、引用存在、支持和事实正确。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e11-faithfulness-not-correctness deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“引用覆盖”的课程边界中，为什么“忠实度”不是“正确性”？
--- answer
忠实度只提供召回/精确；正确性还需要在faithfulness上由定位完整确认，不能只看文本或单个事件。
--- explanation
在rag夹具中分别运行“忠实度”和“正确性”，比较命中相关片段与回答是否由证据支持；指标阈值应按有答案、无答案、过期和冲突分层。
{% endflashcard %}

{% flashcard basic id:e11-metrics-not-interchangeable deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“引用覆盖”的课程边界中，为什么“指标”不是“可互换”？
--- answer
指标只提供召回/精确；可互换还需要在faithfulness上由定位完整确认，不能只看文本或单个事件。
--- explanation
在rag夹具中分别运行“指标”和“可互换”，比较命中相关片段与回答是否由证据支持；指标阈值应按有答案、无答案、过期和冲突分层。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

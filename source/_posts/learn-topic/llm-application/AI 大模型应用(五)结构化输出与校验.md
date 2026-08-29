---
title: AI 大模型应用(五)结构化输出与校验
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 为 T-17 工单生成可校验 JSON，能定位四类失败并阻止不完整结果进入业务流程。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 5
published: true
abbrlink: 1c062ecc
date: 2026-07-05 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：把模型文本转成可信的业务数据，并区分请求拒绝、终止状态、解析失败和业务校验失败。 最终要留下：为 T-17 工单生成可校验 JSON，能定位四类失败并阻止不完整结果进入业务流程。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## Schema定义

{% note primary flat %}
结构化输出要经过语法、Schema、业务和副作用四层；解析成功只说明文本形状正确。 在“Schema定义”这一环节负责定义：先固定语法，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| 语法 | JSON 可解析 | 记录原文和解析错误 | 不能推出字段有意义 |
| Schema | required、type、enum | 校验错误路径 | 不能推出业务允许 |
| 业务 | 状态、权限、金额 | 阻止写入 | 不能由 schema 代替授权 |
| 定义边界 | Schema定义 | 同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数。 | 任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[语法]
  F --> A[Schema定义]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「语法」设为「JSON 可解析」，同时固定「Schema」为「required、type、enum」；逐层解析并阻止写入，记录记录原文和解析错误。
- 只改变「业务」：正常值用「状态、权限、金额」，越界或故障按“不能由 schema 代替授权”构造；观察校验错误路径，不要改动其余输入。
- 用阻止写入检查“Schema定义”：同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。 使用 schema 矩阵和 FakeProvider，覆盖字段缺失、类型错误、拒答、不完整输出、解析和业务规则失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 请求约束

{% note info flat %}
结构化输出要经过语法、Schema、业务和副作用四层；解析成功只说明文本形状正确。 在“请求约束”这一环节负责执行：先固定Schema，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：请求约束**
1. 入口：Schema=required、type、enum，先记录校验错误路径。
2. 转移：由业务=状态、权限、金额进入请求约束，只允许声明的动作。
3. 出口：用记录原文和解析错误检查语法，越界条件是“不能推出字段有意义”。
{% endnote %}

- 执行正常路径：把「Schema」设为「required、type、enum」，同时固定「业务」为「状态、权限、金额」；逐层解析并阻止写入，记录校验错误路径。
- 只改变「语法」：正常值用「JSON 可解析」，越界或故障按“不能推出字段有意义”构造；观察阻止写入，不要改动其余输入。
- 用记录原文和解析错误检查“请求约束”：同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。 使用 schema 矩阵和 FakeProvider，覆盖字段缺失、类型错误、拒答、不完整输出、解析和业务规则失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 解析校验

{% note info flat %}
结构化输出要经过语法、Schema、业务和副作用四层；解析成功只说明文本形状正确。 在“解析校验”这一环节负责故障：先固定业务，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：状态、权限、金额 | 业务 | 阻止写入 | 不能由 schema 代替授权 |
| 边界：JSON 可解析 | 语法 | 记录原文和解析错误 | 不能推出字段有意义 |
| 故障：required、type、enum | Schema | 校验错误路径 | 不能推出业务允许 |

- 注入边界：把「业务」设为「状态、权限、金额」，同时固定「语法」为「JSON 可解析」；逐层解析并阻止写入，记录阻止写入。
- 只改变「Schema」：正常值用「required、type、enum」，越界或故障按“不能推出业务允许”构造；观察记录原文和解析错误，不要改动其余输入。
- 用校验错误路径检查“解析校验”：同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。 使用 schema 矩阵和 FakeProvider，覆盖字段缺失、类型错误、拒答、不完整输出、解析和业务规则失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 业务规则

{% note info flat %}
结构化输出要经过语法、Schema、业务和副作用四层；解析成功只说明文本形状正确。 在“业务规则”这一环节负责复核：先固定语法，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（业务规则）：输入为「JSON 可解析」；状态观察为「校验错误路径」；独立判定使用「阻止写入」。记录同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数，把“任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。”作为未覆盖范围。
{% endnote %}

- 复跑并核对：把「语法」设为「JSON 可解析」，同时固定「Schema」为「required、type、enum」；逐层解析并阻止写入，记录记录原文和解析错误。
- 只改变「业务」：正常值用「状态、权限、金额」，越界或故障按“不能由 schema 代替授权”构造；观察校验错误路径，不要改动其余输入。
- 用阻止写入检查“业务规则”：同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。 使用 schema 矩阵和 FakeProvider，覆盖字段缺失、类型错误、拒答、不完整输出、解析和业务规则失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 错误分层

{% note info flat %}
结构化输出要经过语法、Schema、业务和副作用四层；解析成功只说明文本形状正确。 在“错误分层”这一环节负责定义：先固定Schema，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| Schema | required、type、enum | 校验错误路径 | 不能推出业务允许 |
| 业务 | 状态、权限、金额 | 阻止写入 | 不能由 schema 代替授权 |
| 语法 | JSON 可解析 | 记录原文和解析错误 | 不能推出字段有意义 |
| 定义边界 | 错误分层 | 同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数。 | 任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。 |

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
import json
cases=[("refused",None),("truncated",'{"ticket":"T-17"'),("missing",'{"ticket":"T-17"}'),("invalid_status",'{"ticket":"T-17","status":"unknown"}'),("ok",'{"ticket":"T-17","status":"open"}')]
required={"ticket","status"}
counts={name:0 for name,_ in cases}
for name,raw in cases:
    if raw is None: counts[name]=1; continue
    try:
        payload=json.loads(raw)
        missing=required-payload.keys()
        counts[name]=1 if missing or payload.get("status") not in {"open","closed"} else 0
    except json.JSONDecodeError: counts[name]=1
print({"syntax_or_business_failures":sum(counts.values()),"counts":counts})
assert counts["truncated"]==1 and counts["ok"]==0
# 预期观察：同一 T-17 夹具分别注入拒绝、截断 JSON、缺字段和非法状态，四类结果进入不同计数。
```

{% note success flat %}
失败边界：任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。 使用 schema 矩阵和 FakeProvider，覆盖字段缺失、类型错误、拒答、不完整输出、解析和业务规则失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a05-structured-output-boundaries deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
当“结构化输出边界”出现时，先检查哪个状态和边界？
--- answer
先把“结构化输出边界”绑定到语法与Schema；正常、越界和 Unknown 各运行一次，断言阻止写入。
--- explanation
在schema夹具中，比较JSON 可解析与required、type、enum，保留阻止写入；任何一层失败都应阻止不完整结果进入业务写操作，并保留 request id 与原始内容。
{% endflashcard %}

{% flashcard basic id:a05-four-failure-layers deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
结构化结果失败时为什么要分层定位？
--- answer
请求拒绝、终止状态、语法解析和业务校验由不同责任者处理，不能统称为模型失败。
--- explanation
逐层注入失败并保留原始响应，才能知道哪一层可修复、哪一层应阻止写入。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Anthropic API documentation, https://docs.anthropic.com/en/docs/intro, https://docs.anthropic.com/favicon.ico %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://ai.google.dev/favicon.ico %}
{% endlinkgroup %}

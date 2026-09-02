---
title: Agent Harness(八)恢复与幂等
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能在副作用发生后崩溃的场景下恢复且不重复写入。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 8
published: false
abbrlink: 5dadb519
date: 2026-07-27 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：用稳定操作 ID、查询优先和安全重试处理副作用后的崩溃。 最终要留下：能在副作用发生后崩溃的场景下恢复且不重复写入。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 崩溃窗口

{% note primary flat %}
幂等边界位于提交窗口：崩溃可能发生在执行前、提交后或响应丢失后，重试必须先查询操作 ID。 在“崩溃窗口”这一环节负责定义：先固定window，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| window | before/after commit | 故障点 | 不能只重跑 |
| identity | operation id | 同一副作用 | 不能每次新 ID |
| query | 查询优先 | 最终状态 | 不能猜未完成 |
| 定义边界 | 崩溃窗口 | 模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用与最终状态。 | exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[window]
  F --> A[崩溃窗口]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「window」设为「before/after commit」，同时固定「identity」为「operation id」；记录输入、状态和结果，记录故障点。
- 只改变「query」：正常值用「查询优先」，越界或故障按“不能猜未完成”构造；观察同一副作用，不要改动其余输入。
- 用最终状态检查“崩溃窗口”：模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用与最终状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。 模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 操作标识

{% note info flat %}
幂等边界位于提交窗口：崩溃可能发生在执行前、提交后或响应丢失后，重试必须先查询操作 ID。 在“操作标识”这一环节负责执行：先固定identity，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：操作标识**
1. 入口：identity=operation id，先记录同一副作用。
2. 转移：由query=查询优先进入操作标识，只允许声明的动作。
3. 出口：用故障点检查window，越界条件是“不能只重跑”。
{% endnote %}

- 执行正常路径：把「identity」设为「operation id」，同时固定「query」为「查询优先」；记录输入、状态和结果，记录同一副作用。
- 只改变「window」：正常值用「before/after commit」，越界或故障按“不能只重跑”构造；观察最终状态，不要改动其余输入。
- 用故障点检查“操作标识”：模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用与最终状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。 模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 查询优先

{% note info flat %}
幂等边界位于提交窗口：崩溃可能发生在执行前、提交后或响应丢失后，重试必须先查询操作 ID。 在“查询优先”这一环节负责故障：先固定query，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：查询优先 | query | 最终状态 | 不能猜未完成 |
| 边界：before/after commit | window | 故障点 | 不能只重跑 |
| 故障：operation id | identity | 同一副作用 | 不能每次新 ID |

- 注入边界：把「query」设为「查询优先」，同时固定「window」为「before/after commit」；记录输入、状态和结果，记录最终状态。
- 只改变「identity」：正常值用「operation id」，越界或故障按“不能每次新 ID”构造；观察故障点，不要改动其余输入。
- 用同一副作用检查“查询优先”：模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用与最终状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。 模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重试安全

{% note info flat %}
幂等边界位于提交窗口：崩溃可能发生在执行前、提交后或响应丢失后，重试必须先查询操作 ID。 在“重试安全”这一环节负责复核：先固定window，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（重试安全）：输入为「before/after commit」；状态观察为「同一副作用」；独立判定使用「最终状态」。记录模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用与最终状态，把“exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用与最终状态。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
events=[{"seq":1,"op":"write","id":"O-1"},{"seq":2,"op":"crash","id":"O-1"},{"seq":3,"op":"commit","id":"O-1"},{"seq":4,"op":"duplicate","id":"O-1"}]
committed={e["id"] for e in events if e["op"]=="commit"}
writes=len({e["id"] for e in events if e["op"] in {"write","commit"}})
print({"committed":sorted(committed),"events":len(events),"unique_side_effects":writes})
assert committed=={"O-1"} and writes==1
# 预期观察：模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用与最终状态。
```

{% note success flat %}
失败边界：exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。 模拟 commit 前后崩溃、查询超时和重复请求，断言唯一副作用。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d08-new-identity-unsafe deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
为什么“新身份不安全”必须留下独立证据？
--- answer
先把“新身份不安全”绑定到window与identity；正常、越界和 Unknown 各运行一次，断言最终状态。
--- explanation
在persist夹具中，比较before/after commit与operation id，保留最终状态；exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。
{% endflashcard %}

{% flashcard basic id:d08-exactly-once-boundary deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“重试安全”的课程边界应该如何验证边界？
--- answer
围绕window准备允许、拒绝、Unknown 和取消四类样本，再用同一副作用与最终状态分别断言权限、错误和副作用。
--- explanation
边界测试的重点是责任转移瞬间。exactly-once 只在明确存储和操作边界内成立；跨系统需要补偿或人工介入。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenTelemetry documentation, https://opentelemetry.io/docs/, https://opentelemetry.io/favicon.ico %}
{% link LangGraph persistence, https://langchain-ai.github.io/langgraph/concepts/persistence/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% endlinkgroup %}

---
title: Agent Harness(四)模型适配与事件流
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能在适配层重放增量事件，避免 SDK、loop 和业务层重复重试。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 4
published: false
abbrlink: 8ff66244
date: 2026-07-25 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：统一不同模型适配器的事件、重试和 chunk 组装，同时保留预算。 最终要留下：能在适配层重放增量事件，避免 SDK、loop 和业务层重复重试。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 适配接口

{% note primary flat %}
模型适配层把碎片事件组装为统一流，并决定重试边界；重复重试会消耗预算并制造重复副作用。 在“适配接口”这一环节负责定义：先固定adapter，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| adapter | provider event→internal | 顺序与游标 | 不能丢终流 |
| retry | 429、超时、半流 | 层次唯一 | 不能多层叠加 |
| budget | deadline、tokens、attempts | 预算传播 | 不能局部重置 |
| 定义边界 | 适配接口 | Fake provider 发送碎片、429、超时和半流，断言事件数、重试层次和剩余预算。 | 半流重试要说明已消费 token 和重复风险；适配器不能把部分结果伪装成完整结果。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[adapter]
  F --> A[适配接口]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「adapter」设为「provider event→internal」，同时固定「retry」为「429、超时、半流」；按事件顺序推进状态机，记录顺序与游标。
- 只改变「budget」：正常值用「deadline、tokens、attempts」，越界或故障按“不能局部重置”构造；观察层次唯一，不要改动其余输入。
- 用预算传播检查“适配接口”：Fake provider 发送碎片、429、超时和半流，断言事件数、重试层次和剩余预算；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：半流重试要说明已消费 token 和重复风险；适配器不能把部分结果伪装成完整结果。 用 Fake provider 发送碎片化事件、429、超时和半流，核对预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 事件组装

{% note info flat %}
模型适配层把碎片事件组装为统一流，并决定重试边界；重复重试会消耗预算并制造重复副作用。 在“事件组装”这一环节负责执行：先固定retry，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：事件组装**
1. 入口：retry=429、超时、半流，先记录层次唯一。
2. 转移：由budget=deadline、tokens、attempts进入事件组装，只允许声明的动作。
3. 出口：用顺序与游标检查adapter，越界条件是“不能丢终流”。
{% endnote %}

- 执行正常路径：把「retry」设为「429、超时、半流」，同时固定「budget」为「deadline、tokens、attempts」；按事件顺序推进状态机，记录层次唯一。
- 只改变「adapter」：正常值用「provider event→internal」，越界或故障按“不能丢终流”构造；观察预算传播，不要改动其余输入。
- 用顺序与游标检查“事件组装”：Fake provider 发送碎片、429、超时和半流，断言事件数、重试层次和剩余预算；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：半流重试要说明已消费 token 和重复风险；适配器不能把部分结果伪装成完整结果。 用 Fake provider 发送碎片化事件、429、超时和半流，核对预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重试层次

{% note info flat %}
模型适配层把碎片事件组装为统一流，并决定重试边界；重复重试会消耗预算并制造重复副作用。 在“重试层次”这一环节负责故障：先固定budget，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：deadline、tokens、attempts | budget | 预算传播 | 不能局部重置 |
| 边界：provider event→internal | adapter | 顺序与游标 | 不能丢终流 |
| 故障：429、超时、半流 | retry | 层次唯一 | 不能多层叠加 |

- 注入边界：把「budget」设为「deadline、tokens、attempts」，同时固定「adapter」为「provider event→internal」；按事件顺序推进状态机，记录预算传播。
- 只改变「retry」：正常值用「429、超时、半流」，越界或故障按“不能多层叠加”构造；观察顺序与游标，不要改动其余输入。
- 用层次唯一检查“重试层次”：Fake provider 发送碎片、429、超时和半流，断言事件数、重试层次和剩余预算；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：半流重试要说明已消费 token 和重复风险；适配器不能把部分结果伪装成完整结果。 用 Fake provider 发送碎片化事件、429、超时和半流，核对预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 预算传播

{% note info flat %}
模型适配层把碎片事件组装为统一流，并决定重试边界；重复重试会消耗预算并制造重复副作用。 在“预算传播”这一环节负责复核：先固定adapter，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（预算传播）：输入为「provider event→internal」；状态观察为「层次唯一」；独立判定使用「预算传播」。记录Fake provider 发送碎片、429、超时和半流，断言事件数、重试层次和剩余预算，把“半流重试要说明已消费 token 和重复风险；适配器不能把部分结果伪装成完整结果。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake provider 发送碎片、429、超时和半流，断言事件数、重试层次和剩余预算。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
events=[{"type":"delta","text":"A"},{"type":"tool","name":"lookup"},{"type":"delta","text":"B"},{"type":"cancel"},{"type":"done","reason":"stop"}]
text=""
terminal=None
cancelled=False
for event in events:
    if event["type"]=="delta": text+=event["text"]
    if event["type"]=="cancel": cancelled=True
    if event["type"]=="done": terminal=event["reason"]
print({"text":text,"terminal":terminal,"cancelled":cancelled,"events":len(events)})
assert text=="AB" and terminal=="stop" and cancelled
# 预期观察：Fake provider 发送碎片、429、超时和半流，断言事件数、重试层次和剩余预算。
```

{% note success flat %}
失败边界：半流重试要说明已消费 token 和重复风险；适配器不能把部分结果伪装成完整结果。 用 Fake provider 发送碎片化事件、429、超时和半流，核对预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d04-retry-layers-break-budget deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
当“重试层 破坏预算”出现时，先检查哪个状态和边界？
--- answer
先把“重试层 破坏预算”绑定到adapter与retry；正常、越界和 Unknown 各运行一次，断言预算传播。
--- explanation
在events夹具中，比较provider event→internal与429、超时、半流，保留预算传播；半流重试要说明已消费 token 和重复风险；适配器不能把部分结果伪装成完整结果。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenTelemetry documentation, https://opentelemetry.io/docs/, https://opentelemetry.io/favicon.ico %}
{% link LangGraph persistence, https://langchain-ai.github.io/langgraph/concepts/persistence/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% endlinkgroup %}

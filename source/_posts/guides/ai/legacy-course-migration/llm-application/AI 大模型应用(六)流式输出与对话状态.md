---
title: AI 大模型应用(六)流式输出与对话状态
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 6
published: false
abbrlink: 35adff19
date: 2026-07-05 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：正确处理增量事件、会话状态、取消、重放和最终完成，避免把“看到文字”当成成功。 最终要留下：实现事件累积器和会话快照，能区分中断、正常结束、工具事件和最终业务结果。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 事件模型

{% note primary flat %}
流式响应是事件协议，不是逐字打印；增量文本、工具事件、终止原因、取消和最终业务结果需要分开。 在“事件模型”这一环节负责定义：先固定delta，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| delta | 多段文本 | 按顺序累积 | 不能当最终成功 |
| event | tool_call、error、done | 状态机转移 | 不能丢失取消 |
| snapshot | 会话版本与游标 | 重放/恢复 | 不能假设无损重连 |
| 定义边界 | 事件模型 | 把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成。 | 看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[delta]
  F --> A[事件模型]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「delta」设为「多段文本」，同时固定「event」为「tool_call、error、done」；按事件顺序推进状态机，记录按顺序累积。
- 只改变「snapshot」：正常值用「会话版本与游标」，越界或故障按“不能假设无损重连”构造；观察状态机转移，不要改动其余输入。
- 用重放/恢复检查“事件模型”：把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 会话状态

{% note info flat %}
流式响应是事件协议，不是逐字打印；增量文本、工具事件、终止原因、取消和最终业务结果需要分开。 在“会话状态”这一环节负责执行：先固定event，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：会话状态**
1. 入口：event=tool_call、error、done，先记录状态机转移。
2. 转移：由snapshot=会话版本与游标进入会话状态，只允许声明的动作。
3. 出口：用按顺序累积检查delta，越界条件是“不能当最终成功”。
{% endnote %}

- 执行正常路径：把「event」设为「tool_call、error、done」，同时固定「snapshot」为「会话版本与游标」；按事件顺序推进状态机，记录状态机转移。
- 只改变「delta」：正常值用「多段文本」，越界或故障按“不能当最终成功”构造；观察重放/恢复，不要改动其余输入。
- 用按顺序累积检查“会话状态”：把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 取消语义

{% note info flat %}
流式响应是事件协议，不是逐字打印；增量文本、工具事件、终止原因、取消和最终业务结果需要分开。 在“取消语义”这一环节负责故障：先固定snapshot，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：会话版本与游标 | snapshot | 重放/恢复 | 不能假设无损重连 |
| 边界：多段文本 | delta | 按顺序累积 | 不能当最终成功 |
| 故障：tool_call、error、done | event | 状态机转移 | 不能丢失取消 |

- 注入边界：把「snapshot」设为「会话版本与游标」，同时固定「delta」为「多段文本」；按事件顺序推进状态机，记录重放/恢复。
- 只改变「event」：正常值用「tool_call、error、done」，越界或故障按“不能丢失取消”构造；观察按顺序累积，不要改动其余输入。
- 用状态机转移检查“取消语义”：把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重放验证

{% note info flat %}
流式响应是事件协议，不是逐字打印；增量文本、工具事件、终止原因、取消和最终业务结果需要分开。 在“重放验证”这一环节负责复核：先固定delta，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（重放验证）：输入为「多段文本」；状态观察为「状态机转移」；独立判定使用「重放/恢复」。记录把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成，把“看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成。
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
# 预期观察：把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成。
```

{% note success flat %}
失败边界：看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。 用 SSE 夹具发出 message、phase、reasoning、function_call 和 terminal 事件，模拟客户端关闭请求流。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a06-stream-is-not-success deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
“重放验证”的课程边界中，为什么“流式”不是“成功”？
--- answer
流式结束只说明传输收束，业务成功仍要检查终止状态、结构化结果和写入 Oracle。
--- explanation
流式响应是事件协议，不是逐字打印；增量文本、工具事件、终止原因、取消和最终业务结果需要分开。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存把碎片事件、工具事件、半流和取消混排，累积器只在 done 且业务校验通过时报告完成。看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。
{% endflashcard %}

{% flashcard basic id:a06-response-id-boundary deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
“重放验证”的课程边界应该如何验证边界？
--- answer
围绕delta准备允许、拒绝、Unknown 和取消四类样本，再用状态机转移与重放/恢复分别断言权限、错误和副作用。
--- explanation
边界测试的重点是责任转移瞬间。看到文字或收到 done 都不足以证明业务动作已经提交；断线时要说明游标和重复策略。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://ai.google.dev/favicon.ico %}
{% link JSON Schema specification, https://json-schema.org/specification, https://json-schema.org/favicon.ico %}
{% endlinkgroup %}

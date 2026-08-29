---
title: Agent Harness(十一)运行事件与观测
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能用稳定 ID 关联事件、日志、状态和重放。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 11
published: true
abbrlink: 3ab3983d
date: 2026-07-29 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：设计运行、步骤、工具、实时和持久事件，使 Trace 能支持定位但不替代业务 Oracle。 最终要留下：能用稳定 ID 关联事件、日志、状态和重放。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 事件字段

{% note primary flat %}
运行事件需要字段、关联 ID、顺序和持久化边界；Trace 适合定位过程，但重放不保证得到相同模型输出。 在“事件字段”这一环节负责定义：先固定field，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| field | run、step、tool、error | 可关联 | 不能泄漏敏感值 |
| order | 序列、时间、父子关系 | 乱序处理 | 不能按日志行猜 |
| replay | 输入与版本 | 差异说明 | 不能当原样重现 |
| 定义边界 | 事件字段 | 注入缺失、乱序和重放差异事件，检查可见性、持久性和重放限制。 | 缺失事件只能说明观测不完整，不能直接断言没有执行。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[field]
  F --> A[事件字段]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「field」设为「run、step、tool、error」，同时固定「order」为「序列、时间、父子关系」；按事件顺序推进状态机，记录可关联。
- 只改变「replay」：正常值用「输入与版本」，越界或故障按“不能当原样重现”构造；观察乱序处理，不要改动其余输入。
- 用差异说明检查“事件字段”：注入缺失、乱序和重放差异事件，检查可见性、持久性和重放限制；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缺失事件只能说明观测不完整，不能直接断言没有执行。 注入缺失事件、乱序事件和重放差异，核对可见性与持久性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 关联 ID

{% note info flat %}
运行事件需要字段、关联 ID、顺序和持久化边界；Trace 适合定位过程，但重放不保证得到相同模型输出。 在“关联 ID”这一环节负责执行：先固定order，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：关联 ID**
1. 入口：order=序列、时间、父子关系，先记录乱序处理。
2. 转移：由replay=输入与版本进入关联 ID，只允许声明的动作。
3. 出口：用可关联检查field，越界条件是“不能泄漏敏感值”。
{% endnote %}

- 执行正常路径：把「order」设为「序列、时间、父子关系」，同时固定「replay」为「输入与版本」；按事件顺序推进状态机，记录乱序处理。
- 只改变「field」：正常值用「run、step、tool、error」，越界或故障按“不能泄漏敏感值”构造；观察差异说明，不要改动其余输入。
- 用可关联检查“关联 ID”：注入缺失、乱序和重放差异事件，检查可见性、持久性和重放限制；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缺失事件只能说明观测不完整，不能直接断言没有执行。 注入缺失事件、乱序事件和重放差异，核对可见性与持久性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 实时观测

{% note info flat %}
运行事件需要字段、关联 ID、顺序和持久化边界；Trace 适合定位过程，但重放不保证得到相同模型输出。 在“实时观测”这一环节负责故障：先固定replay，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：输入与版本 | replay | 差异说明 | 不能当原样重现 |
| 边界：run、step、tool、error | field | 可关联 | 不能泄漏敏感值 |
| 故障：序列、时间、父子关系 | order | 乱序处理 | 不能按日志行猜 |

- 注入边界：把「replay」设为「输入与版本」，同时固定「field」为「run、step、tool、error」；按事件顺序推进状态机，记录差异说明。
- 只改变「order」：正常值用「序列、时间、父子关系」，越界或故障按“不能按日志行猜”构造；观察可关联，不要改动其余输入。
- 用乱序处理检查“实时观测”：注入缺失、乱序和重放差异事件，检查可见性、持久性和重放限制；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缺失事件只能说明观测不完整，不能直接断言没有执行。 注入缺失事件、乱序事件和重放差异，核对可见性与持久性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重放限制

{% note info flat %}
运行事件需要字段、关联 ID、顺序和持久化边界；Trace 适合定位过程，但重放不保证得到相同模型输出。 在“重放限制”这一环节负责复核：先固定field，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（重放限制）：输入为「run、step、tool、error」；状态观察为「乱序处理」；独立判定使用「差异说明」。记录注入缺失、乱序和重放差异事件，检查可见性、持久性和重放限制，把“缺失事件只能说明观测不完整，不能直接断言没有执行。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：注入缺失、乱序和重放差异事件，检查可见性、持久性和重放限制。
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
# 预期观察：注入缺失、乱序和重放差异事件，检查可见性、持久性和重放限制。
```

{% note success flat %}
失败边界：缺失事件只能说明观测不完整，不能直接断言没有执行。 注入缺失事件、乱序事件和重放差异，核对可见性与持久性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d11-missing-event-not-no-execution deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“重放限制”的课程边界中，为什么“缺失事件”不是“无执行”？
--- answer
缺失事件只提供可关联；无执行还需要在order上由差异说明确认，不能只看文本或单个事件。
--- explanation
在events夹具中分别运行“缺失事件”和“无执行”，比较run、step、tool、error与序列、时间、父子关系；缺失事件只能说明观测不完整，不能直接断言没有执行。
{% endflashcard %}

{% flashcard basic id:d11-replay-not-same-output deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“重放限制”的课程边界中，为什么“重放”不是“相同输出”？
--- answer
重放只提供可关联；相同输出还需要在order上由差异说明确认，不能只看文本或单个事件。
--- explanation
在events夹具中分别运行“重放”和“相同输出”，比较run、step、tool、error与序列、时间、父子关系；缺失事件只能说明观测不完整，不能直接断言没有执行。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link W3C Trace Context, https://www.w3.org/TR/trace-context/, https://www.w3.org/favicon.ico %}
{% link OpenTelemetry documentation, https://opentelemetry.io/docs/, https://opentelemetry.io/favicon.ico %}
{% endlinkgroup %}

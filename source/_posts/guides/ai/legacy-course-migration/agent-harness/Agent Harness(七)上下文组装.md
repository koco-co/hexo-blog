---
title: Agent Harness(七)上下文组装
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能从检查点重建请求并说明哪些信息被丢弃。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 7
published: false
abbrlink: 6d060d21
date: 2026-07-27 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把上下文投影、压缩、工具结果配对和重建放在可验证的状态层。 最终要留下：能从检查点重建请求并说明哪些信息被丢弃。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 上下文投影

{% note primary flat %}
上下文组装是一次投影：保留能解释下一步的状态、工具结果和约束，压缩后仍要能重建请求。 在“上下文投影”这一环节负责定义：先固定projection，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| projection | 状态、摘要、工具结果 | 字段来源 | 不能无差别拼接 |
| compact | 预算与保真 | 删除依据 | 不能丢关键约束 |
| rebuild | 请求快照 | 可解释 | 不能声称无损 |
| 定义边界 | 上下文投影 | 改变日志尾部、摘要和工具结果，比较重建请求并说明丢失的证据。 | 可重建不等于无损；缺字段时要标记未知，而不是补写想象内容。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[projection]
  F --> A[上下文投影]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「projection」设为「状态、摘要、工具结果」，同时固定「compact」为「预算与保真」；记录输入、状态和结果，记录字段来源。
- 只改变「rebuild」：正常值用「请求快照」，越界或故障按“不能声称无损”构造；观察删除依据，不要改动其余输入。
- 用可解释检查“上下文投影”：改变日志尾部、摘要和工具结果，比较重建请求并说明丢失的证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：可重建不等于无损；缺字段时要标记未知，而不是补写想象内容。 改变日志尾部、摘要和工具结果，检查重建请求是否可解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 压缩策略

{% note info flat %}
上下文组装是一次投影：保留能解释下一步的状态、工具结果和约束，压缩后仍要能重建请求。 在“压缩策略”这一环节负责执行：先固定compact，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：压缩策略**
1. 入口：compact=预算与保真，先记录删除依据。
2. 转移：由rebuild=请求快照进入压缩策略，只允许声明的动作。
3. 出口：用字段来源检查projection，越界条件是“不能无差别拼接”。
{% endnote %}

- 执行正常路径：把「compact」设为「预算与保真」，同时固定「rebuild」为「请求快照」；记录输入、状态和结果，记录删除依据。
- 只改变「projection」：正常值用「状态、摘要、工具结果」，越界或故障按“不能无差别拼接”构造；观察可解释，不要改动其余输入。
- 用字段来源检查“压缩策略”：改变日志尾部、摘要和工具结果，比较重建请求并说明丢失的证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：可重建不等于无损；缺字段时要标记未知，而不是补写想象内容。 改变日志尾部、摘要和工具结果，检查重建请求是否可解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 工具配对

{% note info flat %}
上下文组装是一次投影：保留能解释下一步的状态、工具结果和约束，压缩后仍要能重建请求。 在“工具配对”这一环节负责故障：先固定rebuild，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：请求快照 | rebuild | 可解释 | 不能声称无损 |
| 边界：状态、摘要、工具结果 | projection | 字段来源 | 不能无差别拼接 |
| 故障：预算与保真 | compact | 删除依据 | 不能丢关键约束 |

- 注入边界：把「rebuild」设为「请求快照」，同时固定「projection」为「状态、摘要、工具结果」；记录输入、状态和结果，记录可解释。
- 只改变「compact」：正常值用「预算与保真」，越界或故障按“不能丢关键约束”构造；观察字段来源，不要改动其余输入。
- 用删除依据检查“工具配对”：改变日志尾部、摘要和工具结果，比较重建请求并说明丢失的证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：可重建不等于无损；缺字段时要标记未知，而不是补写想象内容。 改变日志尾部、摘要和工具结果，检查重建请求是否可解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重建验证

{% note info flat %}
上下文组装是一次投影：保留能解释下一步的状态、工具结果和约束，压缩后仍要能重建请求。 在“重建验证”这一环节负责复核：先固定projection，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（重建验证）：输入为「状态、摘要、工具结果」；状态观察为「删除依据」；独立判定使用「可解释」。记录改变日志尾部、摘要和工具结果，比较重建请求并说明丢失的证据，把“可重建不等于无损；缺字段时要标记未知，而不是补写想象内容。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：改变日志尾部、摘要和工具结果，比较重建请求并说明丢失的证据。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
items=["policy:v1","tool:read_ticket","history:old","history:latest"]
budget=3
projected=items[:budget]
cache_key=("fake-model","v1",tuple(projected[:1]))
next_version="v2"
cache_valid=cache_key[1]==next_version
print({"context":projected,"dropped":items[budget:],"cache_valid_after_version_change":cache_valid})
assert "policy:v1" in projected and not cache_valid
# 预期观察：改变日志尾部、摘要和工具结果，比较重建请求并说明丢失的证据。
```

{% note success flat %}
失败边界：可重建不等于无损；缺字段时要标记未知，而不是补写想象内容。 改变日志尾部、摘要和工具结果，检查重建请求是否可解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d07-reconstructable-not-lossless deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“重建验证”的课程边界中，为什么“可重建”不是“无损”？
--- answer
可重建只提供字段来源；无损还需要在compact上由可解释确认，不能只看文本或单个事件。
--- explanation
在context夹具中分别运行“可重建”和“无损”，比较状态、摘要、工具结果与预算与保真；可重建不等于无损；缺字段时要标记未知，而不是补写想象内容。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link W3C Trace Context, https://www.w3.org/TR/trace-context/, https://www.w3.org/favicon.ico %}
{% link OpenTelemetry documentation, https://opentelemetry.io/docs/, https://opentelemetry.io/favicon.ico %}
{% endlinkgroup %}

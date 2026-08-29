---
title: Agent 应用开发(十四)进阶路线
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 14
published: true
abbrlink: c7715013
date: 2026-07-23 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：围绕 MCP Tasks、协议扩展、A2A 和包装层设计一个有边界的高级集成实验。 最终要留下：能为短轮询、连续 SSE、长任务断线 webhook 选择协议与恢复策略，并写出不支持项。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 扩展判断

{% note primary flat %}
高级集成先按任务长度、连接形态、恢复需求和能力声明选择 MCP Tasks、扩展、A2A 或包装层。 在“扩展判断”这一环节负责定义：先固定shape，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| shape | 短轮询/连续 SSE/长任务 | 选择依据 | 不能只看名词 |
| declare | 能力与版本 | 不支持项 | 不能默认实现 |
| recover | 游标、webhook、查询 | 断线恢复 | 不能假设无损 |
| 定义边界 | 扩展判断 | 用四行选择表和 Fake 消息比较短轮询、连续 SSE、长任务 webhook 与包装层，记录不支持能力。 | 协议选择不是部署结果；实验只证明消息和状态设计，不证明所有实现兼容。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[shape]
  F --> A[扩展判断]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「shape」设为「短轮询/连续 SSE/长任务」，同时固定「declare」为「能力与版本」；记录输入、状态和结果，记录选择依据。
- 只改变「recover」：正常值用「游标、webhook、查询」，越界或故障按“不能假设无损”构造；观察不支持项，不要改动其余输入。
- 用断线恢复检查“扩展判断”：用四行选择表和 Fake 消息比较短轮询、连续 SSE、长任务 webhook 与包装层，记录不支持能力；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：协议选择不是部署结果；实验只证明消息和状态设计，不证明所有实现兼容。 用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 协议选择

{% note info flat %}
高级集成先按任务长度、连接形态、恢复需求和能力声明选择 MCP Tasks、扩展、A2A 或包装层。 在“协议选择”这一环节负责执行：先固定declare，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：协议选择**
1. 入口：declare=能力与版本，先记录不支持项。
2. 转移：由recover=游标、webhook、查询进入协议选择，只允许声明的动作。
3. 出口：用选择依据检查shape，越界条件是“不能只看名词”。
{% endnote %}

- 执行正常路径：把「declare」设为「能力与版本」，同时固定「recover」为「游标、webhook、查询」；记录输入、状态和结果，记录不支持项。
- 只改变「shape」：正常值用「短轮询/连续 SSE/长任务」，越界或故障按“不能只看名词”构造；观察断线恢复，不要改动其余输入。
- 用选择依据检查“协议选择”：用四行选择表和 Fake 消息比较短轮询、连续 SSE、长任务 webhook 与包装层，记录不支持能力；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：协议选择不是部署结果；实验只证明消息和状态设计，不证明所有实现兼容。 用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 恢复策略

{% note info flat %}
高级集成先按任务长度、连接形态、恢复需求和能力声明选择 MCP Tasks、扩展、A2A 或包装层。 在“恢复策略”这一环节负责故障：先固定recover，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：游标、webhook、查询 | recover | 断线恢复 | 不能假设无损 |
| 边界：短轮询/连续 SSE/长任务 | shape | 选择依据 | 不能只看名词 |
| 故障：能力与版本 | declare | 不支持项 | 不能默认实现 |

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：用四行选择表和 Fake 消息比较短轮询、连续 SSE、长任务 webhook 与包装层，记录不支持能力。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
operations=["discover","list","call","read","prompt","template","cancel"]
capabilities={op:(op!="cancel") for op in operations}
result={op:("ok" if supported else "unsupported") for op,supported in capabilities.items()}
print({"operations":len(operations),"result":result})
assert result["discover"]=="ok" and result["cancel"]=="unsupported"
# 预期观察：用四行选择表和 Fake 消息比较短轮询、连续 SSE、长任务 webhook 与包装层，记录不支持能力。
```

{% note success flat %}
失败边界：协议选择不是部署结果；实验只证明消息和状态设计，不证明所有实现兼容。 用四行选择表对照 MCP Tasks、extensions、A2A 和 wrapping，记录能力声明与实际支持差异。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c14-extension-is-not-support deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“恢复策略”的课程边界中，为什么“扩展”不是“支持”？
--- answer
扩展点存在不代表当前版本实现了目标能力，还要检查版本、配置和实际调用结果。
--- explanation
高级集成先按任务长度、连接形态、恢复需求和能力声明选择 MCP Tasks、扩展、A2A 或包装层。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存用四行选择表和 Fake 消息比较短轮询、连续 SSE、长任务 webhook 与包装层，记录不支持能力。协议选择不是部署结果；实验只证明消息和状态设计，不证明所有实现兼容。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% endlinkgroup %}

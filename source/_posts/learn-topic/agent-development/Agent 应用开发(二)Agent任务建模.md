---
title: Agent 应用开发(二)Agent任务建模
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能把一个业务任务写成状态模型并解释 Agent 与 workflow 的取舍。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 2
published: false
abbrlink: e0697682
date: 2026-07-17 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：用状态、动作、权限和终止条件判断何时需要 Agent，何时固定工作流更可靠。 最终要留下：能把一个业务任务写成状态模型并解释 Agent 与 workflow 的取舍。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 任务边界

{% note primary flat %}
Agent 任务建模先问状态是否可变、动作是否开放、权限是否敏感，再决定用 Agent 还是固定 workflow。 在“任务边界”这一环节负责定义：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| state | 待处理/处理中/完成 | 状态机 | 不能只看文本 |
| action | 查询、建议、写入 | 允许动作 | 不能把生成当执行 |
| finish | 业务完成条件 | 独立 Oracle | 不能用 loop 结束 |
| 定义边界 | 任务边界 | 为合成工单分别画固定流程和 Agent 状态图，比较可变性、成本与可验证性。 | 如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[state]
  F --> A[任务边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「state」设为「待处理/处理中/完成」，同时固定「action」为「查询、建议、写入」；枚举状态与动作转移，记录状态机。
- 只改变「finish」：正常值用「业务完成条件」，越界或故障按“不能用 loop 结束”构造；观察允许动作，不要改动其余输入。
- 用独立 Oracle检查“任务边界”：为合成工单分别画固定流程和 Agent 状态图，比较可变性、成本与可验证性；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。 为合成工单任务分别写固定流程和 Agent 方案，比较可变性与可验证性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 状态建模

{% note info flat %}
Agent 任务建模先问状态是否可变、动作是否开放、权限是否敏感，再决定用 Agent 还是固定 workflow。 在“状态建模”这一环节负责执行：先固定action，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：状态建模**
1. 入口：action=查询、建议、写入，先记录允许动作。
2. 转移：由finish=业务完成条件进入状态建模，只允许声明的动作。
3. 出口：用状态机检查state，越界条件是“不能只看文本”。
{% endnote %}

- 执行正常路径：把「action」设为「查询、建议、写入」，同时固定「finish」为「业务完成条件」；枚举状态与动作转移，记录允许动作。
- 只改变「state」：正常值用「待处理/处理中/完成」，越界或故障按“不能只看文本”构造；观察独立 Oracle，不要改动其余输入。
- 用状态机检查“状态建模”：为合成工单分别画固定流程和 Agent 状态图，比较可变性、成本与可验证性；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。 为合成工单任务分别写固定流程和 Agent 方案，比较可变性与可验证性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 动作空间

{% note info flat %}
Agent 任务建模先问状态是否可变、动作是否开放、权限是否敏感，再决定用 Agent 还是固定 workflow。 在“动作空间”这一环节负责故障：先固定finish，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：业务完成条件 | finish | 独立 Oracle | 不能用 loop 结束 |
| 边界：待处理/处理中/完成 | state | 状态机 | 不能只看文本 |
| 故障：查询、建议、写入 | action | 允许动作 | 不能把生成当执行 |

- 注入边界：把「finish」设为「业务完成条件」，同时固定「state」为「待处理/处理中/完成」；枚举状态与动作转移，记录独立 Oracle。
- 只改变「action」：正常值用「查询、建议、写入」，越界或故障按“不能把生成当执行”构造；观察状态机，不要改动其余输入。
- 用允许动作检查“动作空间”：为合成工单分别画固定流程和 Agent 状态图，比较可变性、成本与可验证性；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。 为合成工单任务分别写固定流程和 Agent 方案，比较可变性与可验证性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 终止判断

{% note info flat %}
Agent 任务建模先问状态是否可变、动作是否开放、权限是否敏感，再决定用 Agent 还是固定 workflow。 在“终止判断”这一环节负责复核：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（终止判断）：输入为「待处理/处理中/完成」；状态观察为「允许动作」；独立判定使用「独立 Oracle」。记录为合成工单分别画固定流程和 Agent 状态图，比较可变性、成本与可验证性，把“如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为合成工单分别画固定流程和 Agent 状态图，比较可变性、成本与可验证性。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
tasks=[{"name":"fixed","changes":False,"risk":"low"},{"name":"variable","changes":True,"risk":"high"}]
workflow={"states":["new","done"],"steps":2,"oracle":"explicit"}
agent={"states":["observe","decide","act","done"],"steps":4,"oracle":"independent"}
comparison={"workflow_better_for":[t["name"] for t in tasks if not t["changes"]],"agent_needed_for":[t["name"] for t in tasks if t["changes"]],"extra_steps":agent["steps"]-workflow["steps"]}
print(comparison)
assert comparison["workflow_better_for"]==["fixed"] and comparison["agent_needed_for"]==["variable"]
# 预期观察：为合成工单分别画固定流程和 Agent 状态图，比较可变性、成本与可验证性。
```

{% note success flat %}
失败边界：如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。 为合成工单任务分别写固定流程和 Agent 方案，比较可变性与可验证性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c02-agent-vs-workflow deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“终止判断”的课程边界中，Agent与工作流如何选择？
--- answer
固定流程适合步骤、状态和 Oracle 都稳定的任务；Agent 适合需要观察、决策和工具反馈的变化任务。用同一需求比较额外步骤、可控性和失败回收。
--- explanation
Agent 任务建模先问状态是否可变、动作是否开放、权限是否敏感，再决定用 Agent 还是固定 workflow。 固定流程适合步骤、状态和 Oracle 都稳定的任务；Agent 适合需要观察、决策和工具反馈的变化任务。用同一需求比较额外步骤、可控性和失败回收。如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。
{% endflashcard %}

{% flashcard basic id:c02-completion-vs-outcome deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“终止判断”的课程边界中，完成与业务结果如何选择？
--- answer
先把完成的控制变量设为state，把业务结果的对照变量设为action；在相同样本上分别记录独立 Oracle，再按失败边界作出选择。
--- explanation
比较完成与业务结果时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。如果路径稳定且规则确定，workflow 通常更容易验收；Agent 不是默认升级。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% endlinkgroup %}

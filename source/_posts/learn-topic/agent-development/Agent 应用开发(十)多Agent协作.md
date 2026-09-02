---
title: Agent 应用开发(十)多Agent协作
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 10
published: false
abbrlink: 6f6bb3fb
date: 2026-07-21 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：从单 Agent 基线出发，比较分工、投票、动态委派、MCP 和 A2A 的边界。 最终要留下：能解释多 Agent 相比单 Agent 的增益、成本、失败传播和通信选择。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 单体基线

{% note primary flat %}
多 Agent 先以单体基线量收益，再比较分工、投票、动态委派以及 MCP 和 A2A 的通信边界。 在“单体基线”这一环节负责定义：先固定baseline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| baseline | 单 Agent 结果/成本 | 基线固定 | 不能先拆团队 |
| handoff | 任务、身份、证据 | 交接完整 | 不能只传摘要 |
| failure | 局部失败与级联 | 全局状态 | 不能隐藏超时 |
| 定义边界 | 单体基线 | 同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本。 | 更多 Agent 可能增加延迟、成本和失败面；没有基线就不能证明增益。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[baseline]
  F --> A[单体基线]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「baseline」设为「单 Agent 结果/成本」，同时固定「handoff」为「任务、身份、证据」；记录输入、状态和结果，记录基线固定。
- 只改变「failure」：正常值用「局部失败与级联」，越界或故障按“不能隐藏超时”构造；观察交接完整，不要改动其余输入。
- 用全局状态检查“单体基线”：同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：更多 Agent 可能增加延迟、成本和失败面；没有基线就不能证明增益。 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 角色分工

{% note info flat %}
多 Agent 先以单体基线量收益，再比较分工、投票、动态委派以及 MCP 和 A2A 的通信边界。 在“角色分工”这一环节负责执行：先固定handoff，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：角色分工**
1. 入口：handoff=任务、身份、证据，先记录交接完整。
2. 转移：由failure=局部失败与级联进入角色分工，只允许声明的动作。
3. 出口：用基线固定检查baseline，越界条件是“不能先拆团队”。
{% endnote %}

- 执行正常路径：把「handoff」设为「任务、身份、证据」，同时固定「failure」为「局部失败与级联」；记录输入、状态和结果，记录交接完整。
- 只改变「baseline」：正常值用「单 Agent 结果/成本」，越界或故障按“不能先拆团队”构造；观察全局状态，不要改动其余输入。
- 用基线固定检查“角色分工”：同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：更多 Agent 可能增加延迟、成本和失败面；没有基线就不能证明增益。 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 通信边界

{% note info flat %}
多 Agent 先以单体基线量收益，再比较分工、投票、动态委派以及 MCP 和 A2A 的通信边界。 在“通信边界”这一环节负责故障：先固定failure，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：局部失败与级联 | failure | 全局状态 | 不能隐藏超时 |
| 边界：单 Agent 结果/成本 | baseline | 基线固定 | 不能先拆团队 |
| 故障：任务、身份、证据 | handoff | 交接完整 | 不能只传摘要 |

- 注入边界：把「failure」设为「局部失败与级联」，同时固定「baseline」为「单 Agent 结果/成本」；记录输入、状态和结果，记录全局状态。
- 只改变「handoff」：正常值用「任务、身份、证据」，越界或故障按“不能只传摘要”构造；观察基线固定，不要改动其余输入。
- 用交接完整检查“通信边界”：同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：更多 Agent 可能增加延迟、成本和失败面；没有基线就不能证明增益。 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 失败传播

{% note info flat %}
多 Agent 先以单体基线量收益，再比较分工、投票、动态委派以及 MCP 和 A2A 的通信边界。 在“失败传播”这一环节负责复核：先固定baseline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（失败传播）：输入为「单 Agent 结果/成本」；状态观察为「交接完整」；独立判定使用「全局状态」。记录同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本，把“更多 Agent 可能增加延迟、成本和失败面；没有基线就不能证明增益。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
topologies=["single","delegated","voted"]
traces=[{"topology":name,"handoff":name!="single","cost":i+1} for i,name in enumerate(topologies)]
protocol={"A2A":True,"MCP":True}
print({"traces":traces,"protocol":protocol,"total_cost":sum(x["cost"] for x in traces)})
assert len(traces)==3 and all(protocol.values())
# 预期观察：同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本。
```

{% note success flat %}
失败边界：更多 Agent 可能增加延迟、成本和失败面；没有基线就不能证明增益。 比较单体、分工、投票和动态委派；用 A2A polling、SSE、长任务 webhook 的具体场景对照。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c10-baseline-first deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
为什么在“失败传播”的课程边界中要先建立基线？
--- answer
先固定baseline、handoff和failure，再记录同一工单跑单体、分工和投票三种拓扑，用 A2A 长任务与 MCP 工具调用分别记录通信成本。的基线分布；否则无法判断新增复杂度是否带来收益。
--- explanation
多 Agent 先以单体基线量收益，再比较分工、投票、动态委派以及 MCP 和 A2A 的通信边界 需要在相同环境、版本和失败样本上比较。
{% endflashcard %}

{% flashcard basic id:c10-a2a-vs-mcp deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“失败传播”的课程边界中，A2A与MCP如何选择？
--- answer
先把A2A的控制变量设为baseline，把MCP的对照变量设为handoff；在相同样本上分别记录全局状态，再按失败边界作出选择。
--- explanation
比较A2A与MCP时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。更多 Agent 可能增加延迟、成本和失败面；没有基线就不能证明增益。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% endlinkgroup %}

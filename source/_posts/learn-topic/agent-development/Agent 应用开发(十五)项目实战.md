---
title: Agent 应用开发(十五)项目实战
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 完成 20 条合成工单和读写 Fake tools 的端到端证据，并证明审批参数绑定。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 15
published: false
abbrlink: e0031c51
date: 2026-07-23 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：组合 RAG、Memory、审批、MCP 和 HTTP 状态，交付可审查的工单 Agent。 最终要留下：完成 20 条合成工单和读写 Fake tools 的端到端证据，并证明审批参数绑定。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 范围设计

{% note primary flat %}
项目把检索、记忆、审批、MCP 和 HTTP 状态组合为一个可审查工单 Agent，主线是证据而不是功能数量。 在“范围设计”这一环节负责定义：先固定flow，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| flow | 检索→回答→审批→写入 | 状态/证据串联 | 不能跳过拒答 |
| fault | 冲突、取消、超时、越租户 | 分类与隔离 | 不能平均成功 |
| report | 任务、调用、审计 | 复盘可读 | 不能只展示答案 |
| 定义边界 | 范围设计 | 20 条合成工单覆盖拒答、冲突、审批编辑、取消、超时和多租户，输出事件、状态与副作用计数。 | 项目验收必须包含失败样本和恢复查询；真实服务部署不在 Fake 结果中。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[flow]
  F --> A[范围设计]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「flow」设为「检索→回答→审批→写入」，同时固定「fault」为「冲突、取消、超时、越租户」；串联阶段并统计副作用，记录状态/证据串联。
- 只改变「report」：正常值用「任务、调用、审计」，越界或故障按“不能只展示答案”构造；观察分类与隔离，不要改动其余输入。
- 用复盘可读检查“范围设计”：20 条合成工单覆盖拒答、冲突、审批编辑、取消、超时和多租户，输出事件、状态与副作用计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目验收必须包含失败样本和恢复查询；真实服务部署不在 Fake 结果中。 包含拒答、检索冲突、审批编辑、取消、超时和多租户场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 能力组合

{% note info flat %}
项目把检索、记忆、审批、MCP 和 HTTP 状态组合为一个可审查工单 Agent，主线是证据而不是功能数量。 在“能力组合”这一环节负责执行：先固定fault，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：能力组合**
1. 入口：fault=冲突、取消、超时、越租户，先记录分类与隔离。
2. 转移：由report=任务、调用、审计进入能力组合，只允许声明的动作。
3. 出口：用状态/证据串联检查flow，越界条件是“不能跳过拒答”。
{% endnote %}

- 执行正常路径：把「fault」设为「冲突、取消、超时、越租户」，同时固定「report」为「任务、调用、审计」；串联阶段并统计副作用，记录分类与隔离。
- 只改变「flow」：正常值用「检索→回答→审批→写入」，越界或故障按“不能跳过拒答”构造；观察复盘可读，不要改动其余输入。
- 用状态/证据串联检查“能力组合”：20 条合成工单覆盖拒答、冲突、审批编辑、取消、超时和多租户，输出事件、状态与副作用计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目验收必须包含失败样本和恢复查询；真实服务部署不在 Fake 结果中。 包含拒答、检索冲突、审批编辑、取消、超时和多租户场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果证据

{% note info flat %}
项目把检索、记忆、审批、MCP 和 HTTP 状态组合为一个可审查工单 Agent，主线是证据而不是功能数量。 在“结果证据”这一环节负责故障：先固定report，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：任务、调用、审计 | report | 复盘可读 | 不能只展示答案 |
| 边界：检索→回答→审批→写入 | flow | 状态/证据串联 | 不能跳过拒答 |
| 故障：冲突、取消、超时、越租户 | fault | 分类与隔离 | 不能平均成功 |

- 注入边界：把「report」设为「任务、调用、审计」，同时固定「flow」为「检索→回答→审批→写入」；串联阶段并统计副作用，记录复盘可读。
- 只改变「fault」：正常值用「冲突、取消、超时、越租户」，越界或故障按“不能平均成功”构造；观察状态/证据串联，不要改动其余输入。
- 用分类与隔离检查“结果证据”：20 条合成工单覆盖拒答、冲突、审批编辑、取消、超时和多租户，输出事件、状态与副作用计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目验收必须包含失败样本和恢复查询；真实服务部署不在 Fake 结果中。 包含拒答、检索冲突、审批编辑、取消、超时和多租户场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 项目复盘

{% note info flat %}
项目把检索、记忆、审批、MCP 和 HTTP 状态组合为一个可审查工单 Agent，主线是证据而不是功能数量。 在“项目复盘”这一环节负责复核：先固定flow，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（项目复盘）：输入为「检索→回答→审批→写入」；状态观察为「分类与隔离」；独立判定使用「复盘可读」。记录20 条合成工单覆盖拒答、冲突、审批编辑、取消、超时和多租户，输出事件、状态与副作用计数，把“项目验收必须包含失败样本和恢复查询；真实服务部署不在 Fake 结果中。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：20 条合成工单覆盖拒答、冲突、审批编辑、取消、超时和多租户，输出事件、状态与副作用计数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
tickets=[{"id":f"T-{i:02d}","tenant":"alpha" if i%2 else "beta"} for i in range(1,21)]
tools={"lookup":{"write":False},"update":{"write":True}}
approvals={3:"conflict",6:"approval",9:"cancel",12:"timeout"}
events=[]
for ticket in tickets:
    number=int(ticket["id"][2:])
    fault=approvals.get(number)
    events.append({"id":ticket["id"],"tool":"update","status":"refuse" if fault else "pass","reason":fault or "ok","tenant":ticket["tenant"]})
print({"tickets":len(events),"refused":sum(e["status"]=="refuse" for e in events),"tool_write":tools["update"]["write"],"reasons":sorted({e["reason"] for e in events})})
assert len(events)==20 and sum(e["status"]=="refuse" for e in events)==4
# 预期观察：20 条合成工单覆盖拒答、冲突、审批编辑、取消、超时和多租户，输出事件、状态与副作用计数。
```

{% note success flat %}
失败边界：项目验收必须包含失败样本和恢复查询；真实服务部署不在 Fake 结果中。 包含拒答、检索冲突、审批编辑、取消、超时和多租户场景。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard_ref id="c06-citation-not-support" %}

{% flashcard_ref id="c08-approval-side-effects" %}

## 参考资料

{% linkgroup %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% endlinkgroup %}

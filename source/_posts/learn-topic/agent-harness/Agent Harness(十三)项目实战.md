---
title: Agent Harness(十三)项目实战
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 证明副作用不重复、审批不漂移、事件可追踪且服务能停止排空。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 13
published: true
abbrlink: e5a84dde
date: 2026-07-30 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：交付带审批、崩溃恢复、并发和事件观测的 Fake Agent Harness。 最终要留下：证明副作用不重复、审批不漂移、事件可追踪且服务能停止排空。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 项目范围

{% note primary flat %}
项目把审批写入、commit 后崩溃、恢复查询和无重复重试放进同一 Harness 夹具，交付运行事件和业务证据。 在“项目范围”这一环节负责定义：先固定run，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| run | 任务、步骤、工具 | 关联 ID | 不能缺事件 |
| crash | 提交点与重启 | 恢复状态 | 不能重新写入 |
| review | 副作用与审计 | 证据完整 | 不能只报成功 |
| 定义边界 | 项目范围 | 完成一次审批写入并在 commit 后注入崩溃，重启后查询状态，断言副作用计数为一。 | 项目只证明 Fake 存储和执行器的边界；分布式生产故障还需专门演练。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[run]
  F --> A[项目范围]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「run」设为「任务、步骤、工具」，同时固定「crash」为「提交点与重启」；串联阶段并统计副作用，记录关联 ID。
- 只改变「review」：正常值用「副作用与审计」，越界或故障按“不能只报成功”构造；观察恢复状态，不要改动其余输入。
- 用证据完整检查“项目范围”：完成一次审批写入并在 commit 后注入崩溃，重启后查询状态，断言副作用计数为一；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目只证明 Fake 存储和执行器的边界；分布式生产故障还需专门演练。 完成一次审批写入、commit 后崩溃、恢复查询和无重复重试。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 运行实现

{% note info flat %}
项目把审批写入、commit 后崩溃、恢复查询和无重复重试放进同一 Harness 夹具，交付运行事件和业务证据。 在“运行实现”这一环节负责执行：先固定crash，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：运行实现**
1. 入口：crash=提交点与重启，先记录恢复状态。
2. 转移：由review=副作用与审计进入运行实现，只允许声明的动作。
3. 出口：用关联 ID检查run，越界条件是“不能缺事件”。
{% endnote %}

- 执行正常路径：把「crash」设为「提交点与重启」，同时固定「review」为「副作用与审计」；串联阶段并统计副作用，记录恢复状态。
- 只改变「run」：正常值用「任务、步骤、工具」，越界或故障按“不能缺事件”构造；观察证据完整，不要改动其余输入。
- 用关联 ID检查“运行实现”：完成一次审批写入并在 commit 后注入崩溃，重启后查询状态，断言副作用计数为一；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目只证明 Fake 存储和执行器的边界；分布式生产故障还需专门演练。 完成一次审批写入、commit 后崩溃、恢复查询和无重复重试。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 故障演练

{% note info flat %}
项目把审批写入、commit 后崩溃、恢复查询和无重复重试放进同一 Harness 夹具，交付运行事件和业务证据。 在“故障演练”这一环节负责故障：先固定review，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：副作用与审计 | review | 证据完整 | 不能只报成功 |
| 边界：任务、步骤、工具 | run | 关联 ID | 不能缺事件 |
| 故障：提交点与重启 | crash | 恢复状态 | 不能重新写入 |

- 注入边界：把「review」设为「副作用与审计」，同时固定「run」为「任务、步骤、工具」；串联阶段并统计副作用，记录证据完整。
- 只改变「crash」：正常值用「提交点与重启」，越界或故障按“不能重新写入”构造；观察关联 ID，不要改动其余输入。
- 用恢复状态检查“故障演练”：完成一次审批写入并在 commit 后注入崩溃，重启后查询状态，断言副作用计数为一；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目只证明 Fake 存储和执行器的边界；分布式生产故障还需专门演练。 完成一次审批写入、commit 后崩溃、恢复查询和无重复重试。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 证据复盘

{% note info flat %}
项目把审批写入、commit 后崩溃、恢复查询和无重复重试放进同一 Harness 夹具，交付运行事件和业务证据。 在“证据复盘”这一环节负责复核：先固定run，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（证据复盘）：输入为「任务、步骤、工具」；状态观察为「恢复状态」；独立判定使用「证据完整」。记录完成一次审批写入并在 commit 后注入崩溃，重启后查询状态，断言副作用计数为一，把“项目只证明 Fake 存储和执行器的边界；分布式生产故障还需专门演练。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：完成一次审批写入并在 commit 后注入崩溃，重启后查询状态，断言副作用计数为一。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
events=[{"seq":1,"op":"preview","id":"O-1"},{"seq":2,"op":"approve","id":"O-1"},{"seq":3,"op":"commit","id":"O-1"},{"seq":4,"op":"crash","id":"O-1"}]
durable_log=[]
def append_event(event):
    durable_log.append(dict(event))
crashed=False
for event in events:
    if event["op"]=="commit": append_event(event)
    if event["op"]=="crash": crashed=True; break
checkpoint={"last_seq":durable_log[-1]["seq"],"durable_log":list(durable_log)}
recovered={}
for event in checkpoint["durable_log"]:
    if event["op"]=="commit": recovered[event["id"]]={"state":"committed","side_effects":1,"seq":event["seq"]}
def retry_commit(event):
    if event["id"] in recovered: return "dedup"
    recovered[event["id"]]={"state":"committed","side_effects":1,"seq":event["seq"]}
    return "committed"
retry_result=retry_commit({"id":"O-1","seq":5})
side_effects=sum(r["side_effects"] for r in recovered.values())
restarted={"query":"O-1","record":recovered.get("O-1")}
print({"events":len(events),"crashed":crashed,"checkpoint":checkpoint,"restarted":restarted,"retry_result":retry_result,"side_effects":side_effects})
assert crashed and restarted["record"]["state"]=="committed" and restarted["record"]["side_effects"]==1 and restarted["record"]["seq"]==3 and retry_result=="dedup" and side_effects==1
# 预期观察：完成一次审批写入并在 commit 后注入崩溃，重启后查询状态，断言副作用计数为一。
```

{% note success flat %}
失败边界：项目只证明 Fake 存储和执行器的边界；分布式生产故障还需专门演练。 完成一次审批写入、commit 后崩溃、恢复查询和无重复重试。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard_ref id="d08-exactly-once-boundary" %}

{% flashcard_ref id="d11-missing-event-not-no-execution" %}

## 参考资料

{% linkgroup %}
{% link LangGraph persistence, https://langchain-ai.github.io/langgraph/concepts/persistence/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link Python asyncio documentation, https://docs.python.org/3/library/asyncio.html, https://docs.python.org/3/_static/py.svg %}
{% endlinkgroup %}

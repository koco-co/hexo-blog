---
title: Agent 应用开发(十二)框架迁移
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能使用 state、checkpointer、interrupt 和 Command 完成一次可恢复流程。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 12
published: true
abbrlink: df3794c
date: 2026-07-22 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：把 Python Agent loop 迁移到一个 LangGraph 核心，并分辨框架能力与业务正确性。 最终要留下：能使用 state、checkpointer、interrupt 和 Command 完成一次可恢复流程。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 迁移边界

{% note primary flat %}
框架迁移只替换状态编排层，业务 Oracle、权限和失败边界保持不变；checkpointer 与 interrupt 是机制，不是正确性证明。 在“迁移边界”这一环节负责定义：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| state | 显式字段和转移 | 迁移前后对照 | 不能依赖框架默认 |
| checkpoint | 版本化快照 | 恢复可重放 | 不能把内存当持久 |
| interrupt | 暂停/恢复命令 | 人工边界 | 不能跳过审批 |
| 定义边界 | 迁移边界 | 只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程。 | 框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[state]
  F --> A[迁移边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「state」设为「显式字段和转移」，同时固定「checkpoint」为「版本化快照」；枚举状态与动作转移，记录迁移前后对照。
- 只改变「interrupt」：正常值用「暂停/恢复命令」，越界或故障按“不能跳过审批”构造；观察恢复可重放，不要改动其余输入。
- 用人工边界检查“迁移边界”：只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。 只实现一个 LangGraph 核心，比较 Dify、n8n 等产品与 SDK 的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 状态图

{% note info flat %}
框架迁移只替换状态编排层，业务 Oracle、权限和失败边界保持不变；checkpointer 与 interrupt 是机制，不是正确性证明。 在“状态图”这一环节负责执行：先固定checkpoint，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：状态图**
1. 入口：checkpoint=版本化快照，先记录恢复可重放。
2. 转移：由interrupt=暂停/恢复命令进入状态图，只允许声明的动作。
3. 出口：用迁移前后对照检查state，越界条件是“不能依赖框架默认”。
{% endnote %}

- 执行正常路径：把「checkpoint」设为「版本化快照」，同时固定「interrupt」为「暂停/恢复命令」；枚举状态与动作转移，记录恢复可重放。
- 只改变「state」：正常值用「显式字段和转移」，越界或故障按“不能依赖框架默认”构造；观察人工边界，不要改动其余输入。
- 用迁移前后对照检查“状态图”：只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。 只实现一个 LangGraph 核心，比较 Dify、n8n 等产品与 SDK 的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 检查点

{% note info flat %}
框架迁移只替换状态编排层，业务 Oracle、权限和失败边界保持不变；checkpointer 与 interrupt 是机制，不是正确性证明。 在“检查点”这一环节负责故障：先固定interrupt，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：暂停/恢复命令 | interrupt | 人工边界 | 不能跳过审批 |
| 边界：显式字段和转移 | state | 迁移前后对照 | 不能依赖框架默认 |
| 故障：版本化快照 | checkpoint | 恢复可重放 | 不能把内存当持久 |

- 注入边界：把「interrupt」设为「暂停/恢复命令」，同时固定「state」为「显式字段和转移」；枚举状态与动作转移，记录人工边界。
- 只改变「checkpoint」：正常值用「版本化快照」，越界或故障按“不能把内存当持久”构造；观察迁移前后对照，不要改动其余输入。
- 用恢复可重放检查“检查点”：只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。 只实现一个 LangGraph 核心，比较 Dify、n8n 等产品与 SDK 的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 中断恢复

{% note info flat %}
框架迁移只替换状态编排层，业务 Oracle、权限和失败边界保持不变；checkpointer 与 interrupt 是机制，不是正确性证明。 在“中断恢复”这一环节负责复核：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（中断恢复）：输入为「显式字段和转移」；状态观察为「恢复可重放」；独立判定使用「人工边界」。记录只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程，把“框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
transitions={("new","approve"):"running",("running","finish"):"done",("running","cancel"):"cancelled"}
paths=[["approve","finish"],["approve","cancel"]]
results=[]
for actions in paths:
    state="new"
    for action in actions: state=transitions[(state,action)]
    results.append(state)
print({"states":results,"transitions":len(transitions)})
assert results==["done","cancelled"]
# 预期观察：只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程。
```

{% note success flat %}
失败边界：框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。 只实现一个 LangGraph 核心，比较 Dify、n8n 等产品与 SDK 的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c12-framework-not-oracle deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“中断恢复”的课程边界中，为什么“框架”不是“Oracle”？
--- answer
框架负责编排和生命周期，Oracle 负责判定业务结果；换框架不会自动产生正确性证据。
--- explanation
框架迁移只替换状态编排层，业务 Oracle、权限和失败边界保持不变；checkpointer 与 interrupt 是机制，不是正确性证明。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存只实现一个 LangGraph 核心，用 state、checkpointer、interrupt 和 Command 重放一次审批流程。框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。
{% endflashcard %}

{% flashcard basic id:c12-dify-n8n-boundary deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“中断恢复”的课程边界应该如何验证边界？
--- answer
围绕state准备允许、拒绝、Unknown 和取消四类样本，再用恢复可重放与人工边界分别断言权限、错误和副作用。
--- explanation
边界测试的重点是责任转移瞬间。框架通过只能说明节点运行；业务状态、权限和副作用仍需独立检查。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% link LangGraph documentation, https://langchain-ai.github.io/langgraph/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% endlinkgroup %}

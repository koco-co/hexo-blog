---
title: Agent Harness(三)生命周期
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能区分无异常终止、业务正确、取消和恢复等状态。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 3
published: true
abbrlink: 78abc4cc
date: 2026-07-25 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：把启动、步骤、工具、终止、取消和业务结果建成完整生命周期。 最终要留下：能区分无异常终止、业务正确、取消和恢复等状态。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 启动阶段

{% note primary flat %}
生命周期把启动、步骤、工具、终止、取消和业务结果分层；无异常退出不等于任务正确。 在“启动阶段”这一环节负责定义：先固定start，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| start | 配置、身份、run id | 启动事件 | 不能省略失败 |
| terminal | success/error/cancel | 终止原因 | 不能只看异常栈 |
| business | 状态和副作用 | 独立结果 | 不能由 terminal 代替 |
| 定义边界 | 启动阶段 | 注入终端状态、异常、取消和业务失败，比较状态机记录与异常栈。 | 终端状态和业务状态要分开报告；取消后已有副作用不能假设消失。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[start]
  F --> A[启动阶段]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「start」设为「配置、身份、run id」，同时固定「terminal」为「success/error/cancel」；枚举状态与动作转移，记录启动事件。
- 只改变「business」：正常值用「状态和副作用」，越界或故障按“不能由 terminal 代替”构造；观察终止原因，不要改动其余输入。
- 用独立结果检查“启动阶段”：注入终端状态、异常、取消和业务失败，比较状态机记录与异常栈；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：终端状态和业务状态要分开报告；取消后已有副作用不能假设消失。 注入终端状态、异常、取消和业务失败，比较状态机和异常栈。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 步骤阶段

{% note info flat %}
生命周期把启动、步骤、工具、终止、取消和业务结果分层；无异常退出不等于任务正确。 在“步骤阶段”这一环节负责执行：先固定terminal，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：步骤阶段**
1. 入口：terminal=success/error/cancel，先记录终止原因。
2. 转移：由business=状态和副作用进入步骤阶段，只允许声明的动作。
3. 出口：用启动事件检查start，越界条件是“不能省略失败”。
{% endnote %}

- 执行正常路径：把「terminal」设为「success/error/cancel」，同时固定「business」为「状态和副作用」；枚举状态与动作转移，记录终止原因。
- 只改变「start」：正常值用「配置、身份、run id」，越界或故障按“不能省略失败”构造；观察独立结果，不要改动其余输入。
- 用启动事件检查“步骤阶段”：注入终端状态、异常、取消和业务失败，比较状态机记录与异常栈；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：终端状态和业务状态要分开报告；取消后已有副作用不能假设消失。 注入终端状态、异常、取消和业务失败，比较状态机和异常栈。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 终止状态

{% note info flat %}
生命周期把启动、步骤、工具、终止、取消和业务结果分层；无异常退出不等于任务正确。 在“终止状态”这一环节负责故障：先固定business，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：状态和副作用 | business | 独立结果 | 不能由 terminal 代替 |
| 边界：配置、身份、run id | start | 启动事件 | 不能省略失败 |
| 故障：success/error/cancel | terminal | 终止原因 | 不能只看异常栈 |

- 注入边界：把「business」设为「状态和副作用」，同时固定「start」为「配置、身份、run id」；枚举状态与动作转移，记录独立结果。
- 只改变「terminal」：正常值用「success/error/cancel」，越界或故障按“不能只看异常栈”构造；观察启动事件，不要改动其余输入。
- 用终止原因检查“终止状态”：注入终端状态、异常、取消和业务失败，比较状态机记录与异常栈；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：终端状态和业务状态要分开报告；取消后已有副作用不能假设消失。 注入终端状态、异常、取消和业务失败，比较状态机和异常栈。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 业务结果

{% note info flat %}
生命周期把启动、步骤、工具、终止、取消和业务结果分层；无异常退出不等于任务正确。 在“业务结果”这一环节负责复核：先固定start，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（业务结果）：输入为「配置、身份、run id」；状态观察为「终止原因」；独立判定使用「独立结果」。记录注入终端状态、异常、取消和业务失败，比较状态机记录与异常栈，把“终端状态和业务状态要分开报告；取消后已有副作用不能假设消失。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：注入终端状态、异常、取消和业务失败，比较状态机记录与异常栈。
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
# 预期观察：注入终端状态、异常、取消和业务失败，比较状态机记录与异常栈。
```

{% note success flat %}
失败边界：终端状态和业务状态要分开报告；取消后已有副作用不能假设消失。 注入终端状态、异常、取消和业务失败，比较状态机和异常栈。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d03-terminal-not-correct deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“业务结果”的课程边界中，为什么“终止状态”不是“业务正确”？
--- answer
终止状态只提供启动事件；业务正确还需要在terminal上由独立结果确认，不能只看文本或单个事件。
--- explanation
在state夹具中分别运行“终止状态”和“业务正确”，比较配置、身份、run id与success/error/cancel；终端状态和业务状态要分开报告；取消后已有副作用不能假设消失。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link W3C Trace Context, https://www.w3.org/TR/trace-context/, https://www.w3.org/favicon.ico %}
{% link OpenTelemetry documentation, https://opentelemetry.io/docs/, https://opentelemetry.io/favicon.ico %}
{% endlinkgroup %}

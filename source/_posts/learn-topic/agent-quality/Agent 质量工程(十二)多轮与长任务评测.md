---
title: Agent 质量工程(十二)多轮与长任务评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能运行六个合成会话并区分 turn-pass、task-pass 和 UX。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 12
published: true
abbrlink: b106eb30
date: 2026-08-05 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：评估纠正、撤销、暂停、恢复和用户体验，而不是只看单轮答案。 最终要留下：能运行六个合成会话并区分 turn-pass、task-pass 和 UX。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 会话设计

{% note primary flat %}
多轮与长任务要评估纠正、撤销、暂停、恢复和用户体验；turn-pass 不代表 task-pass。 在“会话设计”这一环节负责定义：先固定turn，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| turn | 单轮响应 | 局部通过 | 不能代表全局 |
| task | 最终状态/副作用 | 完整链路 | 不能忽略中断 |
| ux | 等待、可见状态 | 用户能理解 | 不能只看 Trace |
| 定义边界 | 会话设计 | 六个合成会话覆盖纠正、撤销、暂停、审批和恢复，并评估 simulator 自身。 | 长任务失败可能发生在状态或体验层；报告失败位置与恢复成本。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[turn]
  F --> A[会话设计]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「turn」设为「单轮响应」，同时固定「task」为「最终状态/副作用」；枚举状态与动作转移，记录局部通过。
- 只改变「ux」：正常值用「等待、可见状态」，越界或故障按“不能只看 Trace”构造；观察完整链路，不要改动其余输入。
- 用用户能理解检查“会话设计”：六个合成会话覆盖纠正、撤销、暂停、审批和恢复，并评估 simulator 自身；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：长任务失败可能发生在状态或体验层；报告失败位置与恢复成本。 覆盖纠正、撤销、暂停、审批和恢复；评估 simulator 自身。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 长任务状态

{% note info flat %}
多轮与长任务要评估纠正、撤销、暂停、恢复和用户体验；turn-pass 不代表 task-pass。 在“长任务状态”这一环节负责执行：先固定task，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：长任务状态**
1. 入口：task=最终状态/副作用，先记录完整链路。
2. 转移：由ux=等待、可见状态进入长任务状态，只允许声明的动作。
3. 出口：用局部通过检查turn，越界条件是“不能代表全局”。
{% endnote %}

- 执行正常路径：把「task」设为「最终状态/副作用」，同时固定「ux」为「等待、可见状态」；枚举状态与动作转移，记录完整链路。
- 只改变「turn」：正常值用「单轮响应」，越界或故障按“不能代表全局”构造；观察用户能理解，不要改动其余输入。
- 用局部通过检查“长任务状态”：六个合成会话覆盖纠正、撤销、暂停、审批和恢复，并评估 simulator 自身；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：长任务失败可能发生在状态或体验层；报告失败位置与恢复成本。 覆盖纠正、撤销、暂停、审批和恢复；评估 simulator 自身。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 用户体验

{% note info flat %}
多轮与长任务要评估纠正、撤销、暂停、恢复和用户体验；turn-pass 不代表 task-pass。 在“用户体验”这一环节负责故障：先固定ux，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：等待、可见状态 | ux | 用户能理解 | 不能只看 Trace |
| 边界：单轮响应 | turn | 局部通过 | 不能代表全局 |
| 故障：最终状态/副作用 | task | 完整链路 | 不能忽略中断 |

- 注入边界：把「ux」设为「等待、可见状态」，同时固定「turn」为「单轮响应」；枚举状态与动作转移，记录用户能理解。
- 只改变「task」：正常值用「最终状态/副作用」，越界或故障按“不能忽略中断”构造；观察局部通过，不要改动其余输入。
- 用完整链路检查“用户体验”：六个合成会话覆盖纠正、撤销、暂停、审批和恢复，并评估 simulator 自身；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：长任务失败可能发生在状态或体验层；报告失败位置与恢复成本。 覆盖纠正、撤销、暂停、审批和恢复；评估 simulator 自身。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 恢复评估

{% note info flat %}
多轮与长任务要评估纠正、撤销、暂停、恢复和用户体验；turn-pass 不代表 task-pass。 在“恢复评估”这一环节负责复核：先固定turn，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（恢复评估）：输入为「单轮响应」；状态观察为「完整链路」；独立判定使用「用户能理解」。记录六个合成会话覆盖纠正、撤销、暂停、审批和恢复，并评估 simulator 自身，把“长任务失败可能发生在状态或体验层；报告失败位置与恢复成本。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：六个合成会话覆盖纠正、撤销、暂停、审批和恢复，并评估 simulator 自身。
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
# 预期观察：六个合成会话覆盖纠正、撤销、暂停、审批和恢复，并评估 simulator 自身。
```

{% note success flat %}
失败边界：长任务失败可能发生在状态或体验层；报告失败位置与恢复成本。 覆盖纠正、撤销、暂停、审批和恢复；评估 simulator 自身。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e12-turn-vs-task deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“恢复评估”的课程边界中，轮次与任务如何选择？
--- answer
先把轮次的控制变量设为turn，把任务的对照变量设为task；在相同样本上分别记录用户能理解，再按失败边界作出选择。
--- explanation
比较轮次与任务时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。长任务失败可能发生在状态或体验层；报告失败位置与恢复成本。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

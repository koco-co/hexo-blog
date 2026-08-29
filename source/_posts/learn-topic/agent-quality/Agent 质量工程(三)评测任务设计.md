---
title: Agent 质量工程(三)评测任务设计
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能设计覆盖状态和转移的评测任务。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 3
published: true
abbrlink: 1e35e04f
date: 2026-07-31 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：为 Agent 写清状态、允许动作、完成条件和独立 Oracle。 最终要留下：能设计覆盖状态和转移的评测任务。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 任务状态

{% note primary flat %}
评测任务是有状态的环境：状态覆盖回答“到过哪里”，转移覆盖回答“如何到达”，两者都需要独立 Oracle。 在“任务状态”这一环节负责定义：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| state | 待处理/审批/完成 | 状态覆盖 | 不能只测初始 |
| transition | approve/reject/cancel | 转移覆盖 | 不能随机点击 |
| oracle | 结果与副作用 | 判定依据 | 不能用模型自评 |
| 定义边界 | 任务状态 | 构造有状态工单，分别统计状态和转移覆盖，故意漏掉一条恢复路径。 | 用例数量增加不等于覆盖增加；要报告缺失状态和转移。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[state]
  F --> A[任务状态]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「state」设为「待处理/审批/完成」，同时固定「transition」为「approve/reject/cancel」；枚举状态与动作转移，记录状态覆盖。
- 只改变「oracle」：正常值用「结果与副作用」，越界或故障按“不能用模型自评”构造；观察转移覆盖，不要改动其余输入。
- 用判定依据检查“任务状态”：构造有状态工单，分别统计状态和转移覆盖，故意漏掉一条恢复路径；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：用例数量增加不等于覆盖增加；要报告缺失状态和转移。 构造有状态工单任务，分别检查状态覆盖和转移覆盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 动作空间

{% note info flat %}
评测任务是有状态的环境：状态覆盖回答“到过哪里”，转移覆盖回答“如何到达”，两者都需要独立 Oracle。 在“动作空间”这一环节负责执行：先固定transition，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：动作空间**
1. 入口：transition=approve/reject/cancel，先记录转移覆盖。
2. 转移：由oracle=结果与副作用进入动作空间，只允许声明的动作。
3. 出口：用状态覆盖检查state，越界条件是“不能只测初始”。
{% endnote %}

- 执行正常路径：把「transition」设为「approve/reject/cancel」，同时固定「oracle」为「结果与副作用」；枚举状态与动作转移，记录转移覆盖。
- 只改变「state」：正常值用「待处理/审批/完成」，越界或故障按“不能只测初始”构造；观察判定依据，不要改动其余输入。
- 用状态覆盖检查“动作空间”：构造有状态工单，分别统计状态和转移覆盖，故意漏掉一条恢复路径；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：用例数量增加不等于覆盖增加；要报告缺失状态和转移。 构造有状态工单任务，分别检查状态覆盖和转移覆盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## Oracle

{% note info flat %}
评测任务是有状态的环境：状态覆盖回答“到过哪里”，转移覆盖回答“如何到达”，两者都需要独立 Oracle。 在“Oracle”这一环节负责故障：先固定oracle，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：结果与副作用 | oracle | 判定依据 | 不能用模型自评 |
| 边界：待处理/审批/完成 | state | 状态覆盖 | 不能只测初始 |
| 故障：approve/reject/cancel | transition | 转移覆盖 | 不能随机点击 |

- 注入边界：把「oracle」设为「结果与副作用」，同时固定「state」为「待处理/审批/完成」；枚举状态与动作转移，记录判定依据。
- 只改变「transition」：正常值用「approve/reject/cancel」，越界或故障按“不能随机点击”构造；观察状态覆盖，不要改动其余输入。
- 用转移覆盖检查“Oracle”：构造有状态工单，分别统计状态和转移覆盖，故意漏掉一条恢复路径；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：用例数量增加不等于覆盖增加；要报告缺失状态和转移。 构造有状态工单任务，分别检查状态覆盖和转移覆盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 覆盖关系

{% note info flat %}
评测任务是有状态的环境：状态覆盖回答“到过哪里”，转移覆盖回答“如何到达”，两者都需要独立 Oracle。 在“覆盖关系”这一环节负责复核：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（覆盖关系）：输入为「待处理/审批/完成」；状态观察为「转移覆盖」；独立判定使用「判定依据」。记录构造有状态工单，分别统计状态和转移覆盖，故意漏掉一条恢复路径，把“用例数量增加不等于覆盖增加；要报告缺失状态和转移。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：构造有状态工单，分别统计状态和转移覆盖，故意漏掉一条恢复路径。
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
# 预期观察：构造有状态工单，分别统计状态和转移覆盖，故意漏掉一条恢复路径。
```

{% note success flat %}
失败边界：用例数量增加不等于覆盖增加；要报告缺失状态和转移。 构造有状态工单任务，分别检查状态覆盖和转移覆盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e03-state-vs-transition deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“覆盖关系”的课程边界中，状态与转移如何选择？
--- answer
先把状态的控制变量设为state，把转移的对照变量设为transition；在相同样本上分别记录判定依据，再按失败边界作出选择。
--- explanation
比较状态与转移时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。用例数量增加不等于覆盖增加；要报告缺失状态和转移。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

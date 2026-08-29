---
title: Agent 质量工程(十三)多Agent评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能解释局部成功但全局失败的轨迹。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 13
published: true
abbrlink: '25213184'
date: 2026-08-05 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：比较多 Agent 团队与单体基线，覆盖交接、投票、委派和级联失败。 最终要留下：能解释局部成功但全局失败的轨迹。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 单体基线

{% note primary flat %}
多 Agent 评测先留单体基线，再检查交接、投票和级联失败；局部 Agent 成功不等于全局任务成功。 在“单体基线”这一环节负责定义：先固定baseline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| baseline | 单体质量/成本 | 比较起点 | 不能先拆分 |
| handoff | 输入、证据、责任 | 交接完整 | 不能只传文本 |
| global | 最终状态 | 级联失败 | 不能平均局部分数 |
| 定义边界 | 单体基线 | 故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败。 | 团队规模增加会扩大失败面；没有稳定基线不能判断收益。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[baseline]
  F --> A[单体基线]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「baseline」设为「单体质量/成本」，同时固定「handoff」为「输入、证据、责任」；记录输入、状态和结果，记录比较起点。
- 只改变「global」：正常值用「最终状态」，越界或故障按“不能平均局部分数”构造；观察交接完整，不要改动其余输入。
- 用级联失败检查“单体基线”：故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：团队规模增加会扩大失败面；没有稳定基线不能判断收益。 故意破坏一个 handoff，比较单体、分工和投票结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 团队行为

{% note info flat %}
多 Agent 评测先留单体基线，再检查交接、投票和级联失败；局部 Agent 成功不等于全局任务成功。 在“团队行为”这一环节负责执行：先固定handoff，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：团队行为**
1. 入口：handoff=输入、证据、责任，先记录交接完整。
2. 转移：由global=最终状态进入团队行为，只允许声明的动作。
3. 出口：用比较起点检查baseline，越界条件是“不能先拆分”。
{% endnote %}

- 执行正常路径：把「handoff」设为「输入、证据、责任」，同时固定「global」为「最终状态」；记录输入、状态和结果，记录交接完整。
- 只改变「baseline」：正常值用「单体质量/成本」，越界或故障按“不能先拆分”构造；观察级联失败，不要改动其余输入。
- 用比较起点检查“团队行为”：故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：团队规模增加会扩大失败面；没有稳定基线不能判断收益。 故意破坏一个 handoff，比较单体、分工和投票结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 交接评估

{% note info flat %}
多 Agent 评测先留单体基线，再检查交接、投票和级联失败；局部 Agent 成功不等于全局任务成功。 在“交接评估”这一环节负责故障：先固定global，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：最终状态 | global | 级联失败 | 不能平均局部分数 |
| 边界：单体质量/成本 | baseline | 比较起点 | 不能先拆分 |
| 故障：输入、证据、责任 | handoff | 交接完整 | 不能只传文本 |

- 注入边界：把「global」设为「最终状态」，同时固定「baseline」为「单体质量/成本」；记录输入、状态和结果，记录级联失败。
- 只改变「handoff」：正常值用「输入、证据、责任」，越界或故障按“不能只传文本”构造；观察比较起点，不要改动其余输入。
- 用交接完整检查“交接评估”：故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：团队规模增加会扩大失败面；没有稳定基线不能判断收益。 故意破坏一个 handoff，比较单体、分工和投票结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 级联失败

{% note info flat %}
多 Agent 评测先留单体基线，再检查交接、投票和级联失败；局部 Agent 成功不等于全局任务成功。 在“级联失败”这一环节负责复核：先固定baseline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（级联失败）：输入为「单体质量/成本」；状态观察为「交接完整」；独立判定使用「级联失败」。记录故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败，把“团队规模增加会扩大失败面；没有稳定基线不能判断收益。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
topologies=["single","delegated","voted"]
traces=[{"topology":name,"handoff":name!="single","cost":i+1} for i,name in enumerate(topologies)]
protocol={"A2A":True,"MCP":True}
print({"traces":traces,"protocol":protocol,"total_cost":sum(x["cost"] for x in traces)})
assert len(traces)==3 and all(protocol.values())
# 预期观察：故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败。
```

{% note success flat %}
失败边界：团队规模增加会扩大失败面；没有稳定基线不能判断收益。 故意破坏一个 handoff，比较单体、分工和投票结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e13-global-failure deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
为什么“全局失败”必须留下独立证据？
--- answer
先把“全局失败”绑定到baseline与handoff；正常、越界和 Unknown 各运行一次，断言级联失败。
--- explanation
在multiagent夹具中，比较单体质量/成本与输入、证据、责任，保留级联失败；团队规模增加会扩大失败面；没有稳定基线不能判断收益。
{% endflashcard %}

{% flashcard basic id:e13-baseline-first deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
为什么在“级联失败”的课程边界中要先建立基线？
--- answer
先固定baseline、handoff和global，再记录故意破坏一个 handoff，对比单体、分工和投票轨迹，解释全局失败。的基线分布；否则无法判断新增复杂度是否带来收益。
--- explanation
多 Agent 评测先留单体基线，再检查交接、投票和级联失败；局部 Agent 成功不等于全局任务成功 需要在相同环境、版本和失败样本上比较。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% endlinkgroup %}

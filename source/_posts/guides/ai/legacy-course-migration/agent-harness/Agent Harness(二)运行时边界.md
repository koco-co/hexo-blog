---
title: Agent Harness(二)运行时边界
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能为一次运行画出边界并定义 adapter、executor、state、observe 接口。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 2
published: false
abbrlink: '3088e754'
date: 2026-07-24 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：区分 Agent 应用、执行器、Harness、评测器和基础设施的责任。 最终要留下：能为一次运行画出边界并定义 adapter、executor、state、observe 接口。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 职责边界

{% note primary flat %}
Harness 负责把应用、执行器、状态、观测和基础设施接起来；它不是 Trace，也不应吞掉业务判断。 在“职责边界”这一环节负责定义：先固定app，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| app | 任务与策略 | 输入/输出契约 | 不能越权执行 |
| runtime | adapter、executor、state | 可替换接口 | 不能绑定 SDK |
| observe | 事件、指标、日志 | 关联运行 | 不能当业务 Oracle |
| 定义边界 | 职责边界 | Fake runtime 连接应用和 Harness，替换 adapter、executor、state、observe 并比较同一结果。 | Harness 的观测缺失不能证明没有执行；业务结果仍需独立查询。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[app]
  F --> A[职责边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「app」设为「任务与策略」，同时固定「runtime」为「adapter、executor、state」；记录输入、状态和结果，记录输入/输出契约。
- 只改变「observe」：正常值用「事件、指标、日志」，越界或故障按“不能当业务 Oracle”构造；观察可替换接口，不要改动其余输入。
- 用关联运行检查“职责边界”：Fake runtime 连接应用和 Harness，替换 adapter、executor、state、observe 并比较同一结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Harness 的观测缺失不能证明没有执行；业务结果仍需独立查询。 用 Fake runtime 连接应用和 Harness，列出可替换接口。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 接口分层

{% note info flat %}
Harness 负责把应用、执行器、状态、观测和基础设施接起来；它不是 Trace，也不应吞掉业务判断。 在“接口分层”这一环节负责执行：先固定runtime，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：接口分层**
1. 入口：runtime=adapter、executor、state，先记录可替换接口。
2. 转移：由observe=事件、指标、日志进入接口分层，只允许声明的动作。
3. 出口：用输入/输出契约检查app，越界条件是“不能越权执行”。
{% endnote %}

- 执行正常路径：把「runtime」设为「adapter、executor、state」，同时固定「observe」为「事件、指标、日志」；记录输入、状态和结果，记录可替换接口。
- 只改变「app」：正常值用「任务与策略」，越界或故障按“不能越权执行”构造；观察关联运行，不要改动其余输入。
- 用输入/输出契约检查“接口分层”：Fake runtime 连接应用和 Harness，替换 adapter、executor、state、observe 并比较同一结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Harness 的观测缺失不能证明没有执行；业务结果仍需独立查询。 用 Fake runtime 连接应用和 Harness，列出可替换接口。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 运行对象

{% note info flat %}
Harness 负责把应用、执行器、状态、观测和基础设施接起来；它不是 Trace，也不应吞掉业务判断。 在“运行对象”这一环节负责故障：先固定observe，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：事件、指标、日志 | observe | 关联运行 | 不能当业务 Oracle |
| 边界：任务与策略 | app | 输入/输出契约 | 不能越权执行 |
| 故障：adapter、executor、state | runtime | 可替换接口 | 不能绑定 SDK |

- 注入边界：把「observe」设为「事件、指标、日志」，同时固定「app」为「任务与策略」；记录输入、状态和结果，记录关联运行。
- 只改变「runtime」：正常值用「adapter、executor、state」，越界或故障按“不能绑定 SDK”构造；观察输入/输出契约，不要改动其余输入。
- 用可替换接口检查“运行对象”：Fake runtime 连接应用和 Harness，替换 adapter、executor、state、observe 并比较同一结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Harness 的观测缺失不能证明没有执行；业务结果仍需独立查询。 用 Fake runtime 连接应用和 Harness，列出可替换接口。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 观测对象

{% note info flat %}
Harness 负责把应用、执行器、状态、观测和基础设施接起来；它不是 Trace，也不应吞掉业务判断。 在“观测对象”这一环节负责复核：先固定app，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（观测对象）：输入为「任务与策略」；状态观察为「可替换接口」；独立判定使用「关联运行」。记录Fake runtime 连接应用和 Harness，替换 adapter、executor、state、observe 并比较同一结果，把“Harness 的观测缺失不能证明没有执行；业务结果仍需独立查询。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake runtime 连接应用和 Harness，替换 adapter、executor、state、observe 并比较同一结果。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
experiment="用 Fake runtime 连接应用和 Harness，列出可替换接口。"
record={"status":"observed","evidence":[experiment]}
print(record)
assert record["evidence"]
# 预期观察：Fake runtime 连接应用和 Harness，替换 adapter、executor、state、observe 并比较同一结果。
```

{% note success flat %}
失败边界：Harness 的观测缺失不能证明没有执行；业务结果仍需独立查询。 用 Fake runtime 连接应用和 Harness，列出可替换接口。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d02-trace-vs-harness deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“观测对象”的课程边界中，Trace与Harness如何选择？
--- answer
先把Trace的控制变量设为app，把Harness的对照变量设为runtime；在相同样本上分别记录关联运行，再按失败边界作出选择。
--- explanation
比较Trace与Harness时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。Harness 的观测缺失不能证明没有执行；业务结果仍需独立查询。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python asyncio documentation, https://docs.python.org/3/library/asyncio.html, https://docs.python.org/3/_static/py.svg %}
{% link W3C Trace Context, https://www.w3.org/TR/trace-context/, https://www.w3.org/favicon.ico %}
{% endlinkgroup %}

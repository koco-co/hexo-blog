---
title: Agent 应用开发(四)Agent循环
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能观察每一步状态，判断继续、重试、拒答、终止和取消。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 4
published: false
abbrlink: 5a62c634
date: 2026-07-18 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：实现受预算、步骤、错误和取消约束的最小 Agent loop。 最终要留下：能观察每一步状态，判断继续、重试、拒答、终止和取消。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 循环状态

{% note primary flat %}
Agent loop 是受预算与状态约束的状态机：每轮观察、决定、动作、回传，遇到终止、错误或取消立即收束。 在“循环状态”这一环节负责定义：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| state | observe/act/wait/finish | 每轮快照 | 不能只看最终 |
| stop | done、budget、limit | 停止理由 | 不能无界循环 |
| cancel | 用户信号向下传播 | 工具可取消 | 不能声称回滚 |
| 定义边界 | 循环状态 | Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消，逐轮保存状态。 | 取消只阻止后续动作；已发生副作用需要单独查询或补偿，不能自动假设撤销。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[state]
  F --> A[循环状态]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「state」设为「observe/act/wait/finish」，同时固定「stop」为「done、budget、limit」；枚举状态与动作转移，记录每轮快照。
- 只改变「cancel」：正常值用「用户信号向下传播」，越界或故障按“不能声称回滚”构造；观察停止理由，不要改动其余输入。
- 用工具可取消检查“循环状态”：Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消，逐轮保存状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：取消只阻止后续动作；已发生副作用需要单独查询或补偿，不能自动假设撤销。 用 Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 停止条件

{% note info flat %}
Agent loop 是受预算与状态约束的状态机：每轮观察、决定、动作、回传，遇到终止、错误或取消立即收束。 在“停止条件”这一环节负责执行：先固定stop，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：停止条件**
1. 入口：stop=done、budget、limit，先记录停止理由。
2. 转移：由cancel=用户信号向下传播进入停止条件，只允许声明的动作。
3. 出口：用每轮快照检查state，越界条件是“不能只看最终”。
{% endnote %}

- 执行正常路径：把「stop」设为「done、budget、limit」，同时固定「cancel」为「用户信号向下传播」；枚举状态与动作转移，记录停止理由。
- 只改变「state」：正常值用「observe/act/wait/finish」，越界或故障按“不能只看最终”构造；观察工具可取消，不要改动其余输入。
- 用每轮快照检查“停止条件”：Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消，逐轮保存状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：取消只阻止后续动作；已发生副作用需要单独查询或补偿，不能自动假设撤销。 用 Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 错误终止

{% note info flat %}
Agent loop 是受预算与状态约束的状态机：每轮观察、决定、动作、回传，遇到终止、错误或取消立即收束。 在“错误终止”这一环节负责故障：先固定cancel，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：用户信号向下传播 | cancel | 工具可取消 | 不能声称回滚 |
| 边界：observe/act/wait/finish | state | 每轮快照 | 不能只看最终 |
| 故障：done、budget、limit | stop | 停止理由 | 不能无界循环 |

- 注入边界：把「cancel」设为「用户信号向下传播」，同时固定「state」为「observe/act/wait/finish」；枚举状态与动作转移，记录工具可取消。
- 只改变「stop」：正常值用「done、budget、limit」，越界或故障按“不能无界循环”构造；观察每轮快照，不要改动其余输入。
- 用停止理由检查“错误终止”：Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消，逐轮保存状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：取消只阻止后续动作；已发生副作用需要单独查询或补偿，不能自动假设撤销。 用 Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 取消传播

{% note info flat %}
Agent loop 是受预算与状态约束的状态机：每轮观察、决定、动作、回传，遇到终止、错误或取消立即收束。 在“取消传播”这一环节负责复核：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（取消传播）：输入为「observe/act/wait/finish」；状态观察为「停止理由」；独立判定使用「工具可取消」。记录Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消，逐轮保存状态，把“取消只阻止后续动作；已发生副作用需要单独查询或补偿，不能自动假设撤销。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消，逐轮保存状态。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
transitions={("observe","decide"):"act",("act","tool_ok"):"observe",("act","tool_error"):"error",("observe","cancel"):"cancelled"}
state="observe"
history=[]
budget=3
for action in ["decide","tool_ok","decide"]:
    history.append(state)
    if len(history)>=budget: state="budget_exhausted"; break
    state=transitions[(state,action)]
print({"history":history,"terminal":state})
assert state=="budget_exhausted"
# 预期观察：Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消，逐轮保存状态。
```

{% note success flat %}
失败边界：取消只阻止后续动作；已发生副作用需要单独查询或补偿，不能自动假设撤销。 用 Fake model/tool 注入成功、工具失败、预算耗尽、循环上限和用户取消。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c04-stop-conditions deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
为什么“停止条件”必须留下独立证据？
--- answer
先把“停止条件”绑定到state与stop；正常、越界和 Unknown 各运行一次，断言工具可取消。
--- explanation
在state夹具中，比较observe/act/wait/finish与done、budget、limit，保留工具可取消；取消只阻止后续动作；已发生副作用需要单独查询或补偿，不能自动假设撤销。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% link LangGraph documentation, https://langchain-ai.github.io/langgraph/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% endlinkgroup %}

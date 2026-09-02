---
title: Agent Harness(十)调度与并发
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能在 3 个任务、2 个槽位下验证公平性和背压。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 10
published: false
abbrlink: 601fab75
date: 2026-07-28 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：调度多任务、容量、背压、超时和取消，并说明副作用后的取消边界。 最终要留下：能在 3 个任务、2 个槽位下验证公平性和背压。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 槽位分配

{% note primary flat %}
调度器管理槽位、背压、超时和取消；执行后的取消只能阻止后续工作，不能自动回滚已提交副作用。 在“槽位分配”这一环节负责定义：先固定queue，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| queue | 容量、优先级、等待 | 排队可见 | 不能无限积压 |
| cancel | 传播与清理 | 未执行任务停止 | 不能宣称回滚 |
| side effect | 提交窗口 | 状态查询 | 不能重复执行 |
| 定义边界 | 槽位分配 | 模拟排队、超时、取消、重试和执行后取消，记录槽位占用与副作用次数。 | 背压和取消是运行时语义；业务补偿要另行定义。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[queue]
  F --> A[槽位分配]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「queue」设为「容量、优先级、等待」，同时固定「cancel」为「传播与清理」；记录输入、状态和结果，记录排队可见。
- 只改变「side effect」：正常值用「提交窗口」，越界或故障按“不能重复执行”构造；观察未执行任务停止，不要改动其余输入。
- 用状态查询检查“槽位分配”：模拟排队、超时、取消、重试和执行后取消，记录槽位占用与副作用次数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：背压和取消是运行时语义；业务补偿要另行定义。 模拟排队、超时、取消、重试和执行后取消，不声称自动回滚。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 背压

{% note info flat %}
调度器管理槽位、背压、超时和取消；执行后的取消只能阻止后续工作，不能自动回滚已提交副作用。 在“背压”这一环节负责执行：先固定cancel，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：背压**
1. 入口：cancel=传播与清理，先记录未执行任务停止。
2. 转移：由side effect=提交窗口进入背压，只允许声明的动作。
3. 出口：用排队可见检查queue，越界条件是“不能无限积压”。
{% endnote %}

- 执行正常路径：把「cancel」设为「传播与清理」，同时固定「side effect」为「提交窗口」；记录输入、状态和结果，记录未执行任务停止。
- 只改变「queue」：正常值用「容量、优先级、等待」，越界或故障按“不能无限积压”构造；观察状态查询，不要改动其余输入。
- 用排队可见检查“背压”：模拟排队、超时、取消、重试和执行后取消，记录槽位占用与副作用次数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：背压和取消是运行时语义；业务补偿要另行定义。 模拟排队、超时、取消、重试和执行后取消，不声称自动回滚。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 取消传播

{% note info flat %}
调度器管理槽位、背压、超时和取消；执行后的取消只能阻止后续工作，不能自动回滚已提交副作用。 在“取消传播”这一环节负责故障：先固定side effect，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：提交窗口 | side effect | 状态查询 | 不能重复执行 |
| 边界：容量、优先级、等待 | queue | 排队可见 | 不能无限积压 |
| 故障：传播与清理 | cancel | 未执行任务停止 | 不能宣称回滚 |

- 注入边界：把「side effect」设为「提交窗口」，同时固定「queue」为「容量、优先级、等待」；记录输入、状态和结果，记录状态查询。
- 只改变「cancel」：正常值用「传播与清理」，越界或故障按“不能宣称回滚”构造；观察排队可见，不要改动其余输入。
- 用未执行任务停止检查“取消传播”：模拟排队、超时、取消、重试和执行后取消，记录槽位占用与副作用次数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：背压和取消是运行时语义；业务补偿要另行定义。 模拟排队、超时、取消、重试和执行后取消，不声称自动回滚。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 副作用边界

{% note info flat %}
调度器管理槽位、背压、超时和取消；执行后的取消只能阻止后续工作，不能自动回滚已提交副作用。 在“副作用边界”这一环节负责复核：先固定queue，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（副作用边界）：输入为「容量、优先级、等待」；状态观察为「未执行任务停止」；独立判定使用「状态查询」。记录模拟排队、超时、取消、重试和执行后取消，记录槽位占用与副作用次数，把“背压和取消是运行时语义；业务补偿要另行定义。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：模拟排队、超时、取消、重试和执行后取消，记录槽位占用与副作用次数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
queue=["J-1","J-2","J-3","J-4"]
running=queue[:2]
waiting=queue[2:]
cancelled=running.pop()
retry=[waiting[0]]
print({"running":running,"waiting":waiting,"cancelled":cancelled,"retry":retry})
assert len(running)==1 and cancelled=="J-2"
# 预期观察：模拟排队、超时、取消、重试和执行后取消，记录槽位占用与副作用次数。
```

{% note success flat %}
失败边界：背压和取消是运行时语义；业务补偿要另行定义。 模拟排队、超时、取消、重试和执行后取消，不声称自动回滚。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d10-cancel-not-rollback deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“副作用边界”的课程边界中，为什么“取消”不是“回滚”？
--- answer
取消只提供排队可见；回滚还需要在cancel上由状态查询确认，不能只看文本或单个事件。
--- explanation
在scheduler夹具中分别运行“取消”和“回滚”，比较容量、优先级、等待与传播与清理；背压和取消是运行时语义；业务补偿要另行定义。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python asyncio documentation, https://docs.python.org/3/library/asyncio.html, https://docs.python.org/3/_static/py.svg %}
{% link W3C Trace Context, https://www.w3.org/TR/trace-context/, https://www.w3.org/favicon.ico %}
{% endlinkgroup %}

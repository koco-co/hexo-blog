---
title: Agent Harness(六)状态与持久化
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能区分客户端收到事件、状态已提交和语义记忆。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 6
published: false
abbrlink: d398d906
date: 2026-07-26 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把事件顺序、提交、版本和恢复数据做成可读的持久化状态。 最终要留下：能区分客户端收到事件、状态已提交和语义记忆。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 序列号

{% note primary flat %}
持久化要区分事件、序列号、提交点、版本冲突和恢复读取；内存对象存在不等于可恢复。 在“序列号”这一环节负责定义：先固定event，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| event | 序列与幂等键 | 追加顺序 | 不能只存最终值 |
| commit | checkpoint 与版本 | 提交点 | 不能半提交 |
| recover | 回读与重放 | 状态一致 | 不能丢冲突 |
| 定义边界 | 序列号 | 内存存储模拟断电、重复提交、版本冲突和回读，比较 event log 与 checkpoint。 | 事件完整不代表业务正确；恢复后仍需检查副作用和权限。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[event]
  F --> A[序列号]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「event」设为「序列与幂等键」，同时固定「commit」为「checkpoint 与版本」；记录输入、状态和结果，记录追加顺序。
- 只改变「recover」：正常值用「回读与重放」，越界或故障按“不能丢冲突”构造；观察提交点，不要改动其余输入。
- 用状态一致检查“序列号”：内存存储模拟断电、重复提交、版本冲突和回读，比较 event log 与 checkpoint；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：事件完整不代表业务正确；恢复后仍需检查副作用和权限。 用内存存储模拟断电、重复提交、版本冲突和回读。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 提交点

{% note info flat %}
持久化要区分事件、序列号、提交点、版本冲突和恢复读取；内存对象存在不等于可恢复。 在“提交点”这一环节负责执行：先固定commit，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：提交点**
1. 入口：commit=checkpoint 与版本，先记录提交点。
2. 转移：由recover=回读与重放进入提交点，只允许声明的动作。
3. 出口：用追加顺序检查event，越界条件是“不能只存最终值”。
{% endnote %}

- 执行正常路径：把「commit」设为「checkpoint 与版本」，同时固定「recover」为「回读与重放」；记录输入、状态和结果，记录提交点。
- 只改变「event」：正常值用「序列与幂等键」，越界或故障按“不能只存最终值”构造；观察状态一致，不要改动其余输入。
- 用追加顺序检查“提交点”：内存存储模拟断电、重复提交、版本冲突和回读，比较 event log 与 checkpoint；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：事件完整不代表业务正确；恢复后仍需检查副作用和权限。 用内存存储模拟断电、重复提交、版本冲突和回读。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 版本冲突

{% note info flat %}
持久化要区分事件、序列号、提交点、版本冲突和恢复读取；内存对象存在不等于可恢复。 在“版本冲突”这一环节负责故障：先固定recover，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：回读与重放 | recover | 状态一致 | 不能丢冲突 |
| 边界：序列与幂等键 | event | 追加顺序 | 不能只存最终值 |
| 故障：checkpoint 与版本 | commit | 提交点 | 不能半提交 |

- 注入边界：把「recover」设为「回读与重放」，同时固定「event」为「序列与幂等键」；记录输入、状态和结果，记录状态一致。
- 只改变「commit」：正常值用「checkpoint 与版本」，越界或故障按“不能半提交”构造；观察追加顺序，不要改动其余输入。
- 用提交点检查“版本冲突”：内存存储模拟断电、重复提交、版本冲突和回读，比较 event log 与 checkpoint；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：事件完整不代表业务正确；恢复后仍需检查副作用和权限。 用内存存储模拟断电、重复提交、版本冲突和回读。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 恢复读取

{% note info flat %}
持久化要区分事件、序列号、提交点、版本冲突和恢复读取；内存对象存在不等于可恢复。 在“恢复读取”这一环节负责复核：先固定event，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（恢复读取）：输入为「序列与幂等键」；状态观察为「提交点」；独立判定使用「状态一致」。记录内存存储模拟断电、重复提交、版本冲突和回读，比较 event log 与 checkpoint，把“事件完整不代表业务正确；恢复后仍需检查副作用和权限。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：内存存储模拟断电、重复提交、版本冲突和回读，比较 event log 与 checkpoint。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
events=[{"seq":1,"op":"write","id":"O-1"},{"seq":2,"op":"crash","id":"O-1"},{"seq":3,"op":"commit","id":"O-1"},{"seq":4,"op":"duplicate","id":"O-1"}]
committed={e["id"] for e in events if e["op"]=="commit"}
writes=len({e["id"] for e in events if e["op"] in {"write","commit"}})
print({"committed":sorted(committed),"events":len(events),"unique_side_effects":writes})
assert committed=={"O-1"} and writes==1
# 预期观察：内存存储模拟断电、重复提交、版本冲突和回读，比较 event log 与 checkpoint。
```

{% note success flat %}
失败边界：事件完整不代表业务正确；恢复后仍需检查副作用和权限。 用内存存储模拟断电、重复提交、版本冲突和回读。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d06-event-not-durable deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“恢复读取”的课程边界中，为什么“事件”不是“持久化”？
--- answer
事件只提供追加顺序；持久化还需要在commit上由状态一致确认，不能只看文本或单个事件。
--- explanation
在persist夹具中分别运行“事件”和“持久化”，比较序列与幂等键与checkpoint 与版本；事件完整不代表业务正确；恢复后仍需检查副作用和权限。
{% endflashcard %}

{% flashcard basic id:d06-checkpoint-not-memory deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“恢复读取”的课程边界中，为什么“检查点”不是“记忆”？
--- answer
检查点只提供追加顺序；记忆还需要在commit上由状态一致确认，不能只看文本或单个事件。
--- explanation
在persist夹具中分别运行“检查点”和“记忆”，比较序列与幂等键与checkpoint 与版本；事件完整不代表业务正确；恢复后仍需检查副作用和权限。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python asyncio documentation, https://docs.python.org/3/library/asyncio.html, https://docs.python.org/3/_static/py.svg %}
{% link W3C Trace Context, https://www.w3.org/TR/trace-context/, https://www.w3.org/favicon.ico %}
{% endlinkgroup %}

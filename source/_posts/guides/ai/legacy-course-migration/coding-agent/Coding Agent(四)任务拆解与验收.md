---
title: Coding Agent(四)任务拆解与验收
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 为 201、200、409 等状态契约写出独立验收表。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 4
published: false
abbrlink: 73189a36
date: 2026-07-11 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把模糊修复目标拆成可执行步骤、反例和可观察验收。 最终要留下：为 201、200、409 等状态契约写出独立验收表。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 任务分解

{% note primary flat %}
任务拆解把模糊修复改写成状态、输入、响应、数据、反例和停止条件；“写测试”不等于验收契约。 在“任务分解”这一环节负责定义：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| state | 初始/处理中/冲突 | 转移可观察 | 不能只测 200 |
| response | 201、200、409 | 字段和副作用 | 不能只断言 status |
| stop | 通过、阻塞、未知 | 停止理由 | 不能无限探索 |
| 定义边界 | 任务分解 | 为一个 API 缺陷建立 201、200、409 和重复提交矩阵，先写预期再让 Agent 执行。 | 已有测试可能没有目标断言；必须检查测试是否覆盖真实业务规则。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[state]
  F --> A[任务分解]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「state」设为「初始/处理中/冲突」，同时固定「response」为「201、200、409」；记录输入、状态和结果，记录转移可观察。
- 只改变「stop」：正常值用「通过、阻塞、未知」，越界或故障按“不能无限探索”构造；观察字段和副作用，不要改动其余输入。
- 用停止理由检查“任务分解”：为一个 API 缺陷建立 201、200、409 和重复提交矩阵，先写预期再让 Agent 执行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：已有测试可能没有目标断言；必须检查测试是否覆盖真实业务规则。 为一个合成 API 缺陷建立输入、状态、响应、数据和回归验收。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 验收字段

{% note info flat %}
任务拆解把模糊修复改写成状态、输入、响应、数据、反例和停止条件；“写测试”不等于验收契约。 在“验收字段”这一环节负责执行：先固定response，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：验收字段**
1. 入口：response=201、200、409，先记录字段和副作用。
2. 转移：由stop=通过、阻塞、未知进入验收字段，只允许声明的动作。
3. 出口：用转移可观察检查state，越界条件是“不能只测 200”。
{% endnote %}

- 执行正常路径：把「response」设为「201、200、409」，同时固定「stop」为「通过、阻塞、未知」；记录输入、状态和结果，记录字段和副作用。
- 只改变「state」：正常值用「初始/处理中/冲突」，越界或故障按“不能只测 200”构造；观察停止理由，不要改动其余输入。
- 用转移可观察检查“验收字段”：为一个 API 缺陷建立 201、200、409 和重复提交矩阵，先写预期再让 Agent 执行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：已有测试可能没有目标断言；必须检查测试是否覆盖真实业务规则。 为一个合成 API 缺陷建立输入、状态、响应、数据和回归验收。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 反例设计

{% note info flat %}
任务拆解把模糊修复改写成状态、输入、响应、数据、反例和停止条件；“写测试”不等于验收契约。 在“反例设计”这一环节负责故障：先固定stop，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：通过、阻塞、未知 | stop | 停止理由 | 不能无限探索 |
| 边界：初始/处理中/冲突 | state | 转移可观察 | 不能只测 200 |
| 故障：201、200、409 | response | 字段和副作用 | 不能只断言 status |

- 注入边界：把「stop」设为「通过、阻塞、未知」，同时固定「state」为「初始/处理中/冲突」；记录输入、状态和结果，记录停止理由。
- 只改变「response」：正常值用「201、200、409」，越界或故障按“不能只断言 status”构造；观察转移可观察，不要改动其余输入。
- 用字段和副作用检查“反例设计”：为一个 API 缺陷建立 201、200、409 和重复提交矩阵，先写预期再让 Agent 执行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：已有测试可能没有目标断言；必须检查测试是否覆盖真实业务规则。 为一个合成 API 缺陷建立输入、状态、响应、数据和回归验收。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 停止条件

{% note info flat %}
任务拆解把模糊修复改写成状态、输入、响应、数据、反例和停止条件；“写测试”不等于验收契约。 在“停止条件”这一环节负责复核：先固定state，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（停止条件）：输入为「初始/处理中/冲突」；状态观察为「字段和副作用」；独立判定使用「停止理由」。记录为一个 API 缺陷建立 201、200、409 和重复提交矩阵，先写预期再让 Agent 执行，把“已有测试可能没有目标断言；必须检查测试是否覆盖真实业务规则。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为一个 API 缺陷建立 201、200、409 和重复提交矩阵，先写预期再让 Agent 执行。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[{"status":201,"created":True},{"status":200,"created":False},{"status":409,"created":False}]
oracle={(201,True):"pass",(200,False):"pass",(409,False):"conflict"}
result=[oracle[(c["status"],c["created"])] for c in cases]
print(result)
assert result==["pass","pass","conflict"]
# 预期观察：为一个 API 缺陷建立 201、200、409 和重复提交矩阵，先写预期再让 Agent 执行。
```

{% note success flat %}
失败边界：已有测试可能没有目标断言；必须检查测试是否覆盖真实业务规则。 为一个合成 API 缺陷建立输入、状态、响应、数据和回归验收。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b04-acceptance-is-not-existing-test deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
“停止条件”的课程边界中，为什么“验收”不是“已有测试”？
--- answer
验收只提供转移可观察；已有测试还需要在response上由停止理由确认，不能只看文本或单个事件。
--- explanation
在acceptance夹具中分别运行“验收”和“已有测试”，比较初始/处理中/冲突与201、200、409；已有测试可能没有目标断言；必须检查测试是否覆盖真实业务规则。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Claude Code documentation, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}
{% link GitHub Copilot documentation, https://docs.github.com/en/copilot, https://github.com/favicon.ico %}
{% endlinkgroup %}

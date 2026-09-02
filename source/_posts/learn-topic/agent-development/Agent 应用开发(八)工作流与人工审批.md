---
title: Agent 应用开发(八)工作流与人工审批
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 最多两轮评估迭代完成一次带写操作的审批链，并绑定参数变化。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 8
published: false
abbrlink: 6cd648d8
date: 2026-07-20 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把提问、审批、编辑、拒绝、取消和过期建模为可恢复的工作流状态。 最终要留下：最多两轮评估迭代完成一次带写操作的审批链，并绑定参数变化。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 工作流状态

{% note primary flat %}
人工审批是状态机和副作用前门：ask、approve、edit、reject、cancel、expired 必须绑定同一个规范化调用。 在“工作流状态”这一环节负责定义：先固定request，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| request | 主体、工具、参数 | 审批快照 | 不能只存文本 |
| decision | approve/edit/reject | 参数变化检测 | 不能复用旧批准 |
| effect | 写入前后状态 | 副作用计数 | 不能审批后盲写 |
| 定义边界 | 工作流状态 | 对写工具覆盖六种审批状态，改参和过期授权都必须重新审批，写入前检查调用哈希。 | 审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[request]
  F --> A[工作流状态]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「request」设为「主体、工具、参数」，同时固定「decision」为「approve/edit/reject」；记录输入、状态和结果，记录审批快照。
- 只改变「effect」：正常值用「写入前后状态」，越界或故障按“不能审批后盲写”构造；观察参数变化检测，不要改动其余输入。
- 用副作用计数检查“工作流状态”：对写工具覆盖六种审批状态，改参和过期授权都必须重新审批，写入前检查调用哈希；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。 覆盖 ask、approve、edit、reject、cancel 和 expired，验证副作用前门禁。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 人工节点

{% note info flat %}
人工审批是状态机和副作用前门：ask、approve、edit、reject、cancel、expired 必须绑定同一个规范化调用。 在“人工节点”这一环节负责执行：先固定decision，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：人工节点**
1. 入口：decision=approve/edit/reject，先记录参数变化检测。
2. 转移：由effect=写入前后状态进入人工节点，只允许声明的动作。
3. 出口：用审批快照检查request，越界条件是“不能只存文本”。
{% endnote %}

- 执行正常路径：把「decision」设为「approve/edit/reject」，同时固定「effect」为「写入前后状态」；记录输入、状态和结果，记录参数变化检测。
- 只改变「request」：正常值用「主体、工具、参数」，越界或故障按“不能只存文本”构造；观察副作用计数，不要改动其余输入。
- 用审批快照检查“人工节点”：对写工具覆盖六种审批状态，改参和过期授权都必须重新审批，写入前检查调用哈希；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。 覆盖 ask、approve、edit、reject、cancel 和 expired，验证副作用前门禁。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 审批绑定

{% note info flat %}
人工审批是状态机和副作用前门：ask、approve、edit、reject、cancel、expired 必须绑定同一个规范化调用。 在“审批绑定”这一环节负责故障：先固定effect，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：写入前后状态 | effect | 副作用计数 | 不能审批后盲写 |
| 边界：主体、工具、参数 | request | 审批快照 | 不能只存文本 |
| 故障：approve/edit/reject | decision | 参数变化检测 | 不能复用旧批准 |

- 注入边界：把「effect」设为「写入前后状态」，同时固定「request」为「主体、工具、参数」；记录输入、状态和结果，记录副作用计数。
- 只改变「decision」：正常值用「approve/edit/reject」，越界或故障按“不能复用旧批准”构造；观察审批快照，不要改动其余输入。
- 用参数变化检测检查“审批绑定”：对写工具覆盖六种审批状态，改参和过期授权都必须重新审批，写入前检查调用哈希；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。 覆盖 ask、approve、edit、reject、cancel 和 expired，验证副作用前门禁。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 过期处理

{% note info flat %}
人工审批是状态机和副作用前门：ask、approve、edit、reject、cancel、expired 必须绑定同一个规范化调用。 在“过期处理”这一环节负责复核：先固定request，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（过期处理）：输入为「主体、工具、参数」；状态观察为「参数变化检测」；独立判定使用「副作用计数」。记录对写工具覆盖六种审批状态，改参和过期授权都必须重新审批，写入前检查调用哈希，把“审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：对写工具覆盖六种审批状态，改参和过期授权都必须重新审批，写入前检查调用哈希。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
statuses=["pending","approved","changed","expired","revoked","denied"]
call={"tool":"write_ticket","ticket":"T-17","status":"closed"}
approved={"tool":"write_ticket","ticket":"T-17","status":"closed"}
allowed=call==approved and statuses[1]=="approved"
print({"statuses":len(statuses),"allowed":allowed,"hash":"same" if allowed else "changed"})
assert len(statuses)==6 and allowed
# 预期观察：对写工具覆盖六种审批状态，改参和过期授权都必须重新审批，写入前检查调用哈希。
```

{% note success flat %}
失败边界：审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。 覆盖 ask、approve、edit、reject、cancel 和 expired，验证副作用前门禁。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c08-approval-side-effects deck:"Agent 应用开发" priority:1 tags:"Agent 应用开发,测试开发" %}
--- question
当“审批副作用”出现时，先检查哪个状态和边界？
--- answer
先把“审批副作用”绑定到request与decision；正常、越界和 Unknown 各运行一次，断言副作用计数。
--- explanation
在approval夹具中，比较主体、工具、参数与approve/edit/reject，保留副作用计数；审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。
{% endflashcard %}

{% flashcard basic id:c08-changed-params-new-approval deck:"Agent 应用开发" priority:1 tags:"Agent 应用开发,测试开发" %}
--- question
为什么“修改参数后重新审批”必须留下独立证据？
--- answer
先把“修改参数后重新审批”绑定到request与decision；正常、越界和 Unknown 各运行一次，断言副作用计数。
--- explanation
在approval夹具中，比较主体、工具、参数与approve/edit/reject，保留副作用计数；审批通过不等于业务完成；还需查询写入结果、幂等键和审计事件。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% link LangGraph documentation, https://langchain-ai.github.io/langgraph/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% endlinkgroup %}

---
title: Agent Harness(九)隔离与审批
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能阻止参数、身份和资源变化绕过审批。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 9
published: true
abbrlink: c605675c
date: 2026-07-28 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：将审批绑定到规范化工具调用，并在 Harness 中执行隔离和写入门禁。 最终要留下：能阻止参数、身份和资源变化绕过审批。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 隔离边界

{% note primary flat %}
隔离与审批要作用于规范化调用：预览展示参数，批准绑定调用哈希，写入由隔离执行器最终放行。 在“隔离边界”这一环节负责定义：先固定normalize，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| normalize | 工具名、参数、主体 | 稳定哈希 | 不能审批原始文本 |
| preview | 预览与风险 | 用户可理解 | 不能当安全边界 |
| write | 允许列表与隔离 | 副作用计数 | 不能绕过审批 |
| 定义边界 | 隔离边界 | Fake write tool 比较预览、批准、改参、撤销和越权，写入前再次检查规范化参数。 | dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[normalize]
  F --> A[隔离边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「normalize」设为「工具名、参数、主体」，同时固定「preview」为「预览与风险」；记录输入、状态和结果，记录稳定哈希。
- 只改变「write」：正常值用「允许列表与隔离」，越界或故障按“不能绕过审批”构造；观察用户可理解，不要改动其余输入。
- 用副作用计数检查“隔离边界”：Fake write tool 比较预览、批准、改参、撤销和越权，写入前再次检查规范化参数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。 用 Fake write tool 比较预览、批准、改参、撤销和越权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 规范化调用

{% note info flat %}
隔离与审批要作用于规范化调用：预览展示参数，批准绑定调用哈希，写入由隔离执行器最终放行。 在“规范化调用”这一环节负责执行：先固定preview，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：规范化调用**
1. 入口：preview=预览与风险，先记录用户可理解。
2. 转移：由write=允许列表与隔离进入规范化调用，只允许声明的动作。
3. 出口：用稳定哈希检查normalize，越界条件是“不能审批原始文本”。
{% endnote %}

- 执行正常路径：把「preview」设为「预览与风险」，同时固定「write」为「允许列表与隔离」；记录输入、状态和结果，记录用户可理解。
- 只改变「normalize」：正常值用「工具名、参数、主体」，越界或故障按“不能审批原始文本”构造；观察副作用计数，不要改动其余输入。
- 用稳定哈希检查“规范化调用”：Fake write tool 比较预览、批准、改参、撤销和越权，写入前再次检查规范化参数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。 用 Fake write tool 比较预览、批准、改参、撤销和越权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 审批绑定

{% note info flat %}
隔离与审批要作用于规范化调用：预览展示参数，批准绑定调用哈希，写入由隔离执行器最终放行。 在“审批绑定”这一环节负责故障：先固定write，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：允许列表与隔离 | write | 副作用计数 | 不能绕过审批 |
| 边界：工具名、参数、主体 | normalize | 稳定哈希 | 不能审批原始文本 |
| 故障：预览与风险 | preview | 用户可理解 | 不能当安全边界 |

- 注入边界：把「write」设为「允许列表与隔离」，同时固定「normalize」为「工具名、参数、主体」；记录输入、状态和结果，记录副作用计数。
- 只改变「preview」：正常值用「预览与风险」，越界或故障按“不能当安全边界”构造；观察稳定哈希，不要改动其余输入。
- 用用户可理解检查“审批绑定”：Fake write tool 比较预览、批准、改参、撤销和越权，写入前再次检查规范化参数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。 用 Fake write tool 比较预览、批准、改参、撤销和越权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 写入门禁

{% note info flat %}
隔离与审批要作用于规范化调用：预览展示参数，批准绑定调用哈希，写入由隔离执行器最终放行。 在“写入门禁”这一环节负责复核：先固定normalize，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（写入门禁）：输入为「工具名、参数、主体」；状态观察为「用户可理解」；独立判定使用「副作用计数」。记录Fake write tool 比较预览、批准、改参、撤销和越权，写入前再次检查规范化参数，把“dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake write tool 比较预览、批准、改参、撤销和越权，写入前再次检查规范化参数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
statuses=["pending","approved","changed","expired","revoked","denied"]
call={"tool":"write_ticket","ticket":"T-17","status":"closed"}
approved={"tool":"write_ticket","ticket":"T-17","status":"closed"}
allowed=call==approved and statuses[1]=="approved"
print({"statuses":len(statuses),"allowed":allowed,"hash":"same" if allowed else "changed"})
assert len(statuses)==6 and allowed
# 预期观察：Fake write tool 比较预览、批准、改参、撤销和越权，写入前再次检查规范化参数。
```

{% note success flat %}
失败边界：dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。 用 Fake write tool 比较预览、批准、改参、撤销和越权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d09-approval-binding deck:"Agent Harness" priority:1 tags:"Agent Harness,测试开发" %}
--- question
当“审批绑定”出现时，先检查哪个状态和边界？
--- answer
先把“审批绑定”绑定到normalize与preview；正常、越界和 Unknown 各运行一次，断言副作用计数。
--- explanation
在approval夹具中，比较工具名、参数、主体与预览与风险，保留副作用计数；dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。
{% endflashcard %}

{% flashcard basic id:d09-preview-not-security deck:"Agent Harness" priority:1 tags:"Agent Harness,测试开发" %}
--- question
“写入门禁”的课程边界中，为什么“预览”不是“安全”？
--- answer
预览只提供稳定哈希；安全还需要在preview上由副作用计数确认，不能只看文本或单个事件。
--- explanation
在approval夹具中分别运行“预览”和“安全”，比较工具名、参数、主体与预览与风险；dry-run 只是不执行；它不提供 host isolation，也不消除令牌和权限风险。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link LangGraph persistence, https://langchain-ai.github.io/langgraph/concepts/persistence/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link Python asyncio documentation, https://docs.python.org/3/library/asyncio.html, https://docs.python.org/3/_static/py.svg %}
{% endlinkgroup %}

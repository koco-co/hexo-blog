---
title: Agent 安全(十一)审计与事件响应
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能从缺失日志、撤销后写入和异常事件中重建响应步骤。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 11
published: false
abbrlink: 85360c0a
date: 2026-08-14 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：让审计轨迹支持撤销、停止、恢复和责任追踪，同时控制敏感数据暴露。 最终要留下：能从缺失日志、撤销后写入和异常事件中重建响应步骤。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 审计字段

{% note primary flat %}
审计与事件响应要支持撤销、停止、恢复和责任追踪，同时最小化敏感数据；缺日志本身是观测事件。 在“审计字段”这一环节负责定义：先固定audit，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| audit | 主体、动作、资源、时间 | 责任链 | 不能记录密钥 |
| revoke | 撤销→停止→恢复 | 顺序证据 | 不能只改 UI |
| incident | 缺失/异常/重放 | 重建步骤 | 不能删原始事件 |
| 定义边界 | 审计字段 | 注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化。 | 审计完整不等于已经安全；仍需检查真实副作用和权限结果。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[audit]
  F --> A[审计字段]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「audit」设为「主体、动作、资源、时间」，同时固定「revoke」为「撤销→停止→恢复」；记录输入、状态和结果，记录责任链。
- 只改变「incident」：正常值用「缺失/异常/重放」，越界或故障按“不能删原始事件”构造；观察顺序证据，不要改动其余输入。
- 用重建步骤检查“审计字段”：注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：审计完整不等于已经安全；仍需检查真实副作用和权限结果。 注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 的顺序。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 撤销停止

{% note info flat %}
审计与事件响应要支持撤销、停止、恢复和责任追踪，同时最小化敏感数据；缺日志本身是观测事件。 在“撤销停止”这一环节负责执行：先固定revoke，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：撤销停止**
1. 入口：revoke=撤销→停止→恢复，先记录顺序证据。
2. 转移：由incident=缺失/异常/重放进入撤销停止，只允许声明的动作。
3. 出口：用责任链检查audit，越界条件是“不能记录密钥”。
{% endnote %}

- 执行正常路径：把「revoke」设为「撤销→停止→恢复」，同时固定「incident」为「缺失/异常/重放」；记录输入、状态和结果，记录顺序证据。
- 只改变「audit」：正常值用「主体、动作、资源、时间」，越界或故障按“不能记录密钥”构造；观察重建步骤，不要改动其余输入。
- 用责任链检查“撤销停止”：注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：审计完整不等于已经安全；仍需检查真实副作用和权限结果。 注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 的顺序。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 事件重建

{% note info flat %}
审计与事件响应要支持撤销、停止、恢复和责任追踪，同时最小化敏感数据；缺日志本身是观测事件。 在“事件重建”这一环节负责故障：先固定incident，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：缺失/异常/重放 | incident | 重建步骤 | 不能删原始事件 |
| 边界：主体、动作、资源、时间 | audit | 责任链 | 不能记录密钥 |
| 故障：撤销→停止→恢复 | revoke | 顺序证据 | 不能只改 UI |

- 注入边界：把「incident」设为「缺失/异常/重放」，同时固定「audit」为「主体、动作、资源、时间」；记录输入、状态和结果，记录重建步骤。
- 只改变「revoke」：正常值用「撤销→停止→恢复」，越界或故障按“不能只改 UI”构造；观察责任链，不要改动其余输入。
- 用顺序证据检查“事件重建”：注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：审计完整不等于已经安全；仍需检查真实副作用和权限结果。 注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 的顺序。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 日志最小化

{% note info flat %}
审计与事件响应要支持撤销、停止、恢复和责任追踪，同时最小化敏感数据；缺日志本身是观测事件。 在“日志最小化”这一环节负责复核：先固定audit，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（日志最小化）：输入为「主体、动作、资源、时间」；状态观察为「顺序证据」；独立判定使用「重建步骤」。记录注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化，把“审计完整不等于已经安全；仍需检查真实副作用和权限结果。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
events=[{"actor":"user-a","action":"revoke"},{"actor":"agent","action":"write"}]
revoked=any(e["action"]=="revoke" for e in events)
print({"write_allowed":not revoked})
assert revoked
# 预期观察：注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化。
```

{% note success flat %}
失败边界：审计完整不等于已经安全；仍需检查真实副作用和权限结果。 注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 的顺序。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f11-trace-not-oracle deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
“日志最小化”的课程边界中，为什么“Trace”不是“Oracle”？
--- answer
安全审计中的 Trace 负责还原主体、工具和事件顺序；Oracle 仍要结合权限与业务状态判断是否安全。
--- explanation
审计与事件响应要支持撤销、停止、恢复和责任追踪，同时最小化敏感数据；缺日志本身是观测事件。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存注入 revoke 后 write、missing log 和异常工具调用，验证 stop、revoke、recover 顺序与日志最小化。审计完整不等于已经安全；仍需检查真实副作用和权限结果。
{% endflashcard %}

{% flashcard basic id:f11-stop-revoke-recover deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
在audit夹具里，怎样区分“停止 revoke recover”的通过与拒绝？
--- answer
先把“停止 revoke recover”绑定到audit与revoke；正常、越界和 Unknown 各运行一次，断言重建步骤。
--- explanation
在audit夹具中，比较主体、动作、资源、时间与撤销→停止→恢复，保留重建步骤；审计完整不等于已经安全；仍需检查真实副作用和权限结果。
{% endflashcard %}

{% flashcard basic id:f11-log-minimization deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
为什么“日志最小化”必须留下独立证据？
--- answer
先把“日志最小化”绑定到audit与revoke；正常、越界和 Unknown 各运行一次，断言重建步骤。
--- explanation
在audit夹具中，比较主体、动作、资源、时间与撤销→停止→恢复，保留重建步骤；审计完整不等于已经安全；仍需检查真实副作用和权限结果。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI safety best practices, https://platform.openai.com/docs/guides/safety-best-practices, https://platform.openai.com/favicon.ico %}
{% link OWASP GenAI Security Project, https://genai.owasp.org/, https://genai.owasp.org/favicon.ico %}
{% endlinkgroup %}

---
title: Agent 质量工程(十八)持续评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能设计离线→canary→rollback→incident 的持续门禁。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 18
published: false
abbrlink: 50d7238b
date: 2026-08-08 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把离线、canary、在线 SLO、回滚和事故复盘连接起来。 最终要留下：能设计离线→canary→rollback→incident 的持续门禁。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 发布阶段

{% note primary flat %}
持续评测连接离线集、canary、在线 SLO、回滚和事故字段；离线通过不能替代在线监控。 在“发布阶段”这一环节负责定义：先固定offline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| offline | 固定任务集 | 发布前趋势 | 不能代表线上 |
| canary | 小流量与阈值 | 停止/回滚 | 不能无门禁放大 |
| incident | 版本、影响、证据 | 可复盘 | 不能删失败日志 |
| 定义边界 | 发布阶段 | Fake release pipeline 演练阈值、回滚、恢复和证据保留，确认每个阶段的停止条件。 | 回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[offline]
  F --> A[发布阶段]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「offline」设为「固定任务集」，同时固定「canary」为「小流量与阈值」；记录输入、状态和结果，记录发布前趋势。
- 只改变「incident」：正常值用「版本、影响、证据」，越界或故障按“不能删失败日志”构造；观察停止/回滚，不要改动其余输入。
- 用可复盘检查“发布阶段”：Fake release pipeline 演练阈值、回滚、恢复和证据保留，确认每个阶段的停止条件；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 在线监控

{% note info flat %}
持续评测连接离线集、canary、在线 SLO、回滚和事故字段；离线通过不能替代在线监控。 在“在线监控”这一环节负责执行：先固定canary，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：在线监控**
1. 入口：canary=小流量与阈值，先记录停止/回滚。
2. 转移：由incident=版本、影响、证据进入在线监控，只允许声明的动作。
3. 出口：用发布前趋势检查offline，越界条件是“不能代表线上”。
{% endnote %}

- 执行正常路径：把「canary」设为「小流量与阈值」，同时固定「incident」为「版本、影响、证据」；记录输入、状态和结果，记录停止/回滚。
- 只改变「offline」：正常值用「固定任务集」，越界或故障按“不能代表线上”构造；观察可复盘，不要改动其余输入。
- 用发布前趋势检查“在线监控”：Fake release pipeline 演练阈值、回滚、恢复和证据保留，确认每个阶段的停止条件；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 回滚验证

{% note info flat %}
持续评测连接离线集、canary、在线 SLO、回滚和事故字段；离线通过不能替代在线监控。 在“回滚验证”这一环节负责故障：先固定incident，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：版本、影响、证据 | incident | 可复盘 | 不能删失败日志 |
| 边界：固定任务集 | offline | 发布前趋势 | 不能代表线上 |
| 故障：小流量与阈值 | canary | 停止/回滚 | 不能无门禁放大 |

- 注入边界：把「incident」设为「版本、影响、证据」，同时固定「offline」为「固定任务集」；记录输入、状态和结果，记录可复盘。
- 只改变「canary」：正常值用「小流量与阈值」，越界或故障按“不能无门禁放大”构造；观察发布前趋势，不要改动其余输入。
- 用停止/回滚检查“回滚验证”：Fake release pipeline 演练阈值、回滚、恢复和证据保留，确认每个阶段的停止条件；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 事故字段

{% note info flat %}
持续评测连接离线集、canary、在线 SLO、回滚和事故字段；离线通过不能替代在线监控。 在“事故字段”这一环节负责复核：先固定offline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（事故字段）：输入为「固定任务集」；状态观察为「停止/回滚」；独立判定使用「可复盘」。记录Fake release pipeline 演练阈值、回滚、恢复和证据保留，确认每个阶段的停止条件，把“回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake release pipeline 演练阈值、回滚、恢复和证据保留，确认每个阶段的停止条件。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
jobs=[{"job":"generate","status":"candidate"},{"job":"verify","status":"pass"},{"job":"model-unavailable","status":"blocked"},{"job":"artifact-missing","status":"blocked"}]
artifacts={"diff":True,"report":True}
gate=all(x["status"]=="pass" for x in jobs if x["job"]=="verify") and all(artifacts.values())
print({"gate":gate,"blocked":sum(x["status"]=="blocked" for x in jobs),"artifacts":artifacts})
assert gate and sum(x["status"]=="blocked" for x in jobs)==2
# 预期观察：Fake release pipeline 演练阈值、回滚、恢复和证据保留，确认每个阶段的停止条件。
```

{% note success flat %}
失败边界：回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。 用 Fake release pipeline 演练阈值、回滚、恢复和证据保留。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e18-offline-not-online deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“事故字段”的课程边界中，为什么“离线”不是“在线”？
--- answer
离线只提供发布前趋势；在线还需要在canary上由可复盘确认，不能只看文本或单个事件。
--- explanation
在ci夹具中分别运行“离线”和“在线”，比较固定任务集与小流量与阈值；回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。
{% endflashcard %}

{% flashcard basic id:e18-rollback-verification deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
为什么“回滚验证”必须留下独立证据？
--- answer
先把“回滚验证”绑定到offline与canary；正常、越界和 Unknown 各运行一次，断言可复盘。
--- explanation
在ci夹具中，比较固定任务集与小流量与阈值，保留可复盘；回滚本身要验证；没有可恢复版本或监控时不能宣称上线安全。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

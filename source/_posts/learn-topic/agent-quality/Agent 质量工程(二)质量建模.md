---
title: Agent 质量工程(二)质量建模
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能为一个任务写出质量契约、证据和不可平均化的硬失败。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 2
published: true
abbrlink: 7c33364e
date: 2026-07-31 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：把 Agent 质量拆成结果、组件、体验、性能和风险维度，并建立硬门槛。 最终要留下：能为一个任务写出质量契约、证据和不可平均化的硬失败。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 质量维度

{% note primary flat %}
质量模型把结果、组件、体验、性能和风险分开，并用硬门禁阻止关键失败被平均分掩盖。 在“质量维度”这一环节负责定义：先固定outcome，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| outcome | 业务状态与副作用 | 独立结果 | 不能只看文本 |
| component | 工具、检索、模型 | 分层证据 | 不能总分替代 |
| gate | 安全/数据/恢复 | 硬失败 | 不能用平均值抵消 |
| 定义边界 | 质量维度 | 为合成工单建立质量矩阵，一项关键写入失败时总分再高也不放行。 | 维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[outcome]
  F --> A[质量维度]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「outcome」设为「业务状态与副作用」，同时固定「component」为「工具、检索、模型」；记录输入、状态和结果，记录独立结果。
- 只改变「gate」：正常值用「安全/数据/恢复」，越界或故障按“不能用平均值抵消”构造；观察分层证据，不要改动其余输入。
- 用硬失败检查“质量维度”：为合成工单建立质量矩阵，一项关键写入失败时总分再高也不放行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。 为合成工单建立质量矩阵，演示单项关键失败不能被平均分掩盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果证据

{% note info flat %}
质量模型把结果、组件、体验、性能和风险分开，并用硬门禁阻止关键失败被平均分掩盖。 在“结果证据”这一环节负责执行：先固定component，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：结果证据**
1. 入口：component=工具、检索、模型，先记录分层证据。
2. 转移：由gate=安全/数据/恢复进入结果证据，只允许声明的动作。
3. 出口：用独立结果检查outcome，越界条件是“不能只看文本”。
{% endnote %}

- 执行正常路径：把「component」设为「工具、检索、模型」，同时固定「gate」为「安全/数据/恢复」；记录输入、状态和结果，记录分层证据。
- 只改变「outcome」：正常值用「业务状态与副作用」，越界或故障按“不能只看文本”构造；观察硬失败，不要改动其余输入。
- 用独立结果检查“结果证据”：为合成工单建立质量矩阵，一项关键写入失败时总分再高也不放行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。 为合成工单建立质量矩阵，演示单项关键失败不能被平均分掩盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 硬门禁

{% note info flat %}
质量模型把结果、组件、体验、性能和风险分开，并用硬门禁阻止关键失败被平均分掩盖。 在“硬门禁”这一环节负责故障：先固定gate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：安全/数据/恢复 | gate | 硬失败 | 不能用平均值抵消 |
| 边界：业务状态与副作用 | outcome | 独立结果 | 不能只看文本 |
| 故障：工具、检索、模型 | component | 分层证据 | 不能总分替代 |

- 注入边界：把「gate」设为「安全/数据/恢复」，同时固定「outcome」为「业务状态与副作用」；记录输入、状态和结果，记录硬失败。
- 只改变「component」：正常值用「工具、检索、模型」，越界或故障按“不能总分替代”构造；观察独立结果，不要改动其余输入。
- 用分层证据检查“硬门禁”：为合成工单建立质量矩阵，一项关键写入失败时总分再高也不放行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。 为合成工单建立质量矩阵，演示单项关键失败不能被平均分掩盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 范围边界

{% note info flat %}
质量模型把结果、组件、体验、性能和风险分开，并用硬门禁阻止关键失败被平均分掩盖。 在“范围边界”这一环节负责复核：先固定outcome，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（范围边界）：输入为「业务状态与副作用」；状态观察为「分层证据」；独立判定使用「硬失败」。记录为合成工单建立质量矩阵，一项关键写入失败时总分再高也不放行，把“维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为合成工单建立质量矩阵，一项关键写入失败时总分再高也不放行。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
checks={"outcome":True,"citation":True,"security":False}
gate=all(checks.values())
print({"gate":gate,"failed":[k for k,v in checks.items() if not v]})
assert not gate
# 预期观察：为合成工单建立质量矩阵，一项关键写入失败时总分再高也不放行。
```

{% note success flat %}
失败边界：维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。 为合成工单建立质量矩阵，演示单项关键失败不能被平均分掩盖。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e02-outcome-evidence deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
在quality夹具里，怎样区分“业务结果证据”的通过与拒绝？
--- answer
先把“业务结果证据”绑定到outcome与component；正常、越界和 Unknown 各运行一次，断言硬失败。
--- explanation
在quality夹具中，比较业务状态与副作用与工具、检索、模型，保留硬失败；维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。
{% endflashcard %}

{% flashcard basic id:e02-hard-gates deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“范围边界”的课程边界中，怎样用outcome验证“硬门禁”？
--- answer
先把“硬门禁”绑定到outcome与component；正常、越界和 Unknown 各运行一次，断言硬失败。
--- explanation
在quality夹具中，比较业务状态与副作用与工具、检索、模型，保留硬失败；维度和阈值必须绑定任务与风险；换任务后不能直接复用比例。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

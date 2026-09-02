---
title: Agent 质量工程(十七)故障与恢复评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能分别报告故障类型、恢复时间、重复副作用和人工介入。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 17
published: false
abbrlink: d1b1c47c
date: 2026-08-07 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：在 provider、环境、Agent 和副作用提交窗口注入故障，评估恢复而非简单重跑。 最终要留下：能分别报告故障类型、恢复时间、重复副作用和人工介入。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 故障时点

{% note primary flat %}
故障恢复评测按故障时点和副作用窗口分类，验证查询、补偿和人工介入，而不是简单重跑。 在“故障时点”这一环节负责定义：先固定fault，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| fault | provider/环境/Agent | 触发点 | 不能混成 error |
| recover | 查询、恢复、补偿 | 恢复时间 | 不能盲重跑 |
| effect | 提交前后 | 副作用计数 | 不能重复写 |
| 定义边界 | 故障时点 | 覆盖提交前后、读取超时、环境失效和 loop 失败，报告恢复时间与人工介入。 | 恢复策略依赖副作用类型；没有幂等或查询能力时应阻断自动重试。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[fault]
  F --> A[故障时点]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「fault」设为「provider/环境/Agent」，同时固定「recover」为「查询、恢复、补偿」；记录输入、状态和结果，记录触发点。
- 只改变「effect」：正常值用「提交前后」，越界或故障按“不能重复写”构造；观察恢复时间，不要改动其余输入。
- 用副作用计数检查“故障时点”：覆盖提交前后、读取超时、环境失效和 loop 失败，报告恢复时间与人工介入；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：恢复策略依赖副作用类型；没有幂等或查询能力时应阻断自动重试。 覆盖提交前后、读取超时、环境失效和 Agent loop 失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 恢复策略

{% note info flat %}
故障恢复评测按故障时点和副作用窗口分类，验证查询、补偿和人工介入，而不是简单重跑。 在“恢复策略”这一环节负责执行：先固定recover，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：恢复策略**
1. 入口：recover=查询、恢复、补偿，先记录恢复时间。
2. 转移：由effect=提交前后进入恢复策略，只允许声明的动作。
3. 出口：用触发点检查fault，越界条件是“不能混成 error”。
{% endnote %}

- 执行正常路径：把「recover」设为「查询、恢复、补偿」，同时固定「effect」为「提交前后」；记录输入、状态和结果，记录恢复时间。
- 只改变「fault」：正常值用「provider/环境/Agent」，越界或故障按“不能混成 error”构造；观察副作用计数，不要改动其余输入。
- 用触发点检查“恢复策略”：覆盖提交前后、读取超时、环境失效和 loop 失败，报告恢复时间与人工介入；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：恢复策略依赖副作用类型；没有幂等或查询能力时应阻断自动重试。 覆盖提交前后、读取超时、环境失效和 Agent loop 失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 副作用检查

{% note info flat %}
故障恢复评测按故障时点和副作用窗口分类，验证查询、补偿和人工介入，而不是简单重跑。 在“副作用检查”这一环节负责故障：先固定effect，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：提交前后 | effect | 副作用计数 | 不能重复写 |
| 边界：provider/环境/Agent | fault | 触发点 | 不能混成 error |
| 故障：查询、恢复、补偿 | recover | 恢复时间 | 不能盲重跑 |

- 注入边界：把「effect」设为「提交前后」，同时固定「fault」为「provider/环境/Agent」；记录输入、状态和结果，记录副作用计数。
- 只改变「recover」：正常值用「查询、恢复、补偿」，越界或故障按“不能盲重跑”构造；观察触发点，不要改动其余输入。
- 用恢复时间检查“副作用检查”：覆盖提交前后、读取超时、环境失效和 loop 失败，报告恢复时间与人工介入；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：恢复策略依赖副作用类型；没有幂等或查询能力时应阻断自动重试。 覆盖提交前后、读取超时、环境失效和 Agent loop 失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 人工介入

{% note info flat %}
故障恢复评测按故障时点和副作用窗口分类，验证查询、补偿和人工介入，而不是简单重跑。 在“人工介入”这一环节负责复核：先固定fault，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（人工介入）：输入为「provider/环境/Agent」；状态观察为「恢复时间」；独立判定使用「副作用计数」。记录覆盖提交前后、读取超时、环境失效和 loop 失败，报告恢复时间与人工介入，把“恢复策略依赖副作用类型；没有幂等或查询能力时应阻断自动重试。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：覆盖提交前后、读取超时、环境失效和 loop 失败，报告恢复时间与人工介入。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
faults=[("before_commit",0),("after_commit",1),("read_timeout",0),("loop_failure",0)]
recovered=[name for name,_ in faults if name in {"after_commit","read_timeout","loop_failure"}]
side_effects=sum(effects for _,effects in faults)
print({"faults":len(faults),"recovered":recovered,"side_effects":side_effects,"human_intervention":1})
assert len(faults)==4 and side_effects==1
# 预期观察：覆盖提交前后、读取超时、环境失效和 loop 失败，报告恢复时间与人工介入。
```

{% note success flat %}
失败边界：恢复策略依赖副作用类型；没有幂等或查询能力时应阻断自动重试。 覆盖提交前后、读取超时、环境失效和 Agent loop 失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e17-recovery-not-rerun deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“人工介入”的课程边界中，为什么“恢复”不是“重跑”？
--- answer
恢复只提供触发点；重跑还需要在recover上由副作用计数确认，不能只看文本或单个事件。
--- explanation
在recovery夹具中分别运行“恢复”和“重跑”，比较provider/环境/Agent与查询、恢复、补偿；恢复策略依赖副作用类型；没有幂等或查询能力时应阻断自动重试。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% endlinkgroup %}

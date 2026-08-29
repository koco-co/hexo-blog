---
title: Agent 质量工程(九)评测系统校验
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能用已知结果与注入故障验证评分系统。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 9
published: true
abbrlink: d065deec
date: 2026-08-03 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：测试 runner、grader、聚合和错误分类本身，避免评测系统成为黑盒。 最终要留下：能用已知结果与注入故障验证评分系统。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 已知结果

{% note primary flat %}
评测系统也要被测：runner、grader、聚合器可能漏事件、吞掉 Unknown 或错误归类环境问题。 在“已知结果”这一环节负责定义：先固定known，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| known | 固定输入输出 | 预期分数 | 不能只测被测 Agent |
| fault | grader/聚合器故障 | 分类稳定 | 不能误算通过 |
| status | fail/Unknown/error/skip | 状态分离 | 不能压成布尔值 |
| 定义边界 | 已知结果 | 用已知结果和注入故障验证 runner、评分器和聚合器，检查状态分布。 | 评测系统不是更高层 Oracle；其缺陷要进入发布门禁。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[known]
  F --> A[已知结果]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「known」设为「固定输入输出」，同时固定「fault」为「grader/聚合器故障」；记录输入、状态和结果，记录预期分数。
- 只改变「status」：正常值用「fail/Unknown/error/skip」，越界或故障按“不能压成布尔值”构造；观察分类稳定，不要改动其余输入。
- 用状态分离检查“已知结果”：用已知结果和注入故障验证 runner、评分器和聚合器，检查状态分布；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：评测系统不是更高层 Oracle；其缺陷要进入发布门禁。 区分 fail、Unknown、error、skip，并验证聚合器。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 评分器故障

{% note info flat %}
评测系统也要被测：runner、grader、聚合器可能漏事件、吞掉 Unknown 或错误归类环境问题。 在“评分器故障”这一环节负责执行：先固定fault，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：评分器故障**
1. 入口：fault=grader/聚合器故障，先记录分类稳定。
2. 转移：由status=fail/Unknown/error/skip进入评分器故障，只允许声明的动作。
3. 出口：用预期分数检查known，越界条件是“不能只测被测 Agent”。
{% endnote %}

- 执行正常路径：把「fault」设为「grader/聚合器故障」，同时固定「status」为「fail/Unknown/error/skip」；记录输入、状态和结果，记录分类稳定。
- 只改变「known」：正常值用「固定输入输出」，越界或故障按“不能只测被测 Agent”构造；观察状态分离，不要改动其余输入。
- 用预期分数检查“评分器故障”：用已知结果和注入故障验证 runner、评分器和聚合器，检查状态分布；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：评测系统不是更高层 Oracle；其缺陷要进入发布门禁。 区分 fail、Unknown、error、skip，并验证聚合器。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 聚合故障

{% note info flat %}
评测系统也要被测：runner、grader、聚合器可能漏事件、吞掉 Unknown 或错误归类环境问题。 在“聚合故障”这一环节负责故障：先固定status，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：fail/Unknown/error/skip | status | 状态分离 | 不能压成布尔值 |
| 边界：固定输入输出 | known | 预期分数 | 不能只测被测 Agent |
| 故障：grader/聚合器故障 | fault | 分类稳定 | 不能误算通过 |

- 注入边界：把「status」设为「fail/Unknown/error/skip」，同时固定「known」为「固定输入输出」；记录输入、状态和结果，记录状态分离。
- 只改变「fault」：正常值用「grader/聚合器故障」，越界或故障按“不能误算通过”构造；观察预期分数，不要改动其余输入。
- 用分类稳定检查“聚合故障”：用已知结果和注入故障验证 runner、评分器和聚合器，检查状态分布；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：评测系统不是更高层 Oracle；其缺陷要进入发布门禁。 区分 fail、Unknown、error、skip，并验证聚合器。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 状态分类

{% note info flat %}
评测系统也要被测：runner、grader、聚合器可能漏事件、吞掉 Unknown 或错误归类环境问题。 在“状态分类”这一环节负责复核：先固定known，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（状态分类）：输入为「固定输入输出」；状态观察为「分类稳定」；独立判定使用「状态分离」。记录用已知结果和注入故障验证 runner、评分器和聚合器，检查状态分布，把“评测系统不是更高层 Oracle；其缺陷要进入发布门禁。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：用已知结果和注入故障验证 runner、评分器和聚合器，检查状态分布。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[("known-pass","pass"),("grader-error","error"),("unknown","unknown")]
counts={s:sum(1 for _,x in cases if x==s) for s in {"pass","error","unknown"}}
print(counts)
assert counts["error"]==1 and counts["unknown"]==1
# 预期观察：用已知结果和注入故障验证 runner、评分器和聚合器，检查状态分布。
```

{% note success flat %}
失败边界：评测系统不是更高层 Oracle；其缺陷要进入发布门禁。 区分 fail、Unknown、error、skip，并验证聚合器。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e09-runner-needs-testing deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
为什么运行器必须绑定testing？
--- answer
没有testing时，运行器可能在超时、撤销或预算耗尽后继续产生不可控结果；两者要在同一个策略中验收。
--- explanation
测试正常和越界两条路径，保留截止时间、剩余预算和最终状态。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% endlinkgroup %}

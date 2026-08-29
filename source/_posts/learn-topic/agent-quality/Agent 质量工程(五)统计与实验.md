---
title: Agent 质量工程(五)统计与实验
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能分析 20×5×2 模拟表，报告不确定性而不是只报平均值。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 5
published: true
abbrlink: 7faf8039
date: 2026-08-01 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：用重复试验、区间、依赖性和 pass@k 解释 Agent 结果。 最终要留下：能分析 20×5×2 模拟表，报告不确定性而不是只报平均值。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 试验设计

{% note primary flat %}
统计实验要说明独立性、重复次数和区间；pass@k、pass^k、零失败和平均值回答不同问题。 在“试验设计”这一环节负责定义：先固定metric，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| metric | pass@k/pass^k | 定义清楚 | 不能互换 |
| sample | 任务与重复 | 依赖关系 | 不能把行数当样本 |
| uncertainty | 区间与上界 | 谨慎解释 | 不能零失败即完美 |
| 定义边界 | 试验设计 | 比较 20×5×2 模拟表，分别计算至少一次成功、全部成功和零失败上界。 | 相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[metric]
  F --> A[试验设计]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「metric」设为「pass@k/pass^k」，同时固定「sample」为「任务与重复」；记录输入、状态和结果，记录定义清楚。
- 只改变「uncertainty」：正常值用「区间与上界」，越界或故障按“不能零失败即完美”构造；观察依赖关系，不要改动其余输入。
- 用谨慎解释检查“试验设计”：比较 20×5×2 模拟表，分别计算至少一次成功、全部成功和零失败上界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。 比较 pass@k、pass^k、零失败和非独立试验的解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 区间估计

{% note info flat %}
统计实验要说明独立性、重复次数和区间；pass@k、pass^k、零失败和平均值回答不同问题。 在“区间估计”这一环节负责执行：先固定sample，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：区间估计**
1. 入口：sample=任务与重复，先记录依赖关系。
2. 转移：由uncertainty=区间与上界进入区间估计，只允许声明的动作。
3. 出口：用定义清楚检查metric，越界条件是“不能互换”。
{% endnote %}

- 执行正常路径：把「sample」设为「任务与重复」，同时固定「uncertainty」为「区间与上界」；记录输入、状态和结果，记录依赖关系。
- 只改变「metric」：正常值用「pass@k/pass^k」，越界或故障按“不能互换”构造；观察谨慎解释，不要改动其余输入。
- 用定义清楚检查“区间估计”：比较 20×5×2 模拟表，分别计算至少一次成功、全部成功和零失败上界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。 比较 pass@k、pass^k、零失败和非独立试验的解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 依赖性

{% note info flat %}
统计实验要说明独立性、重复次数和区间；pass@k、pass^k、零失败和平均值回答不同问题。 在“依赖性”这一环节负责故障：先固定uncertainty，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：区间与上界 | uncertainty | 谨慎解释 | 不能零失败即完美 |
| 边界：pass@k/pass^k | metric | 定义清楚 | 不能互换 |
| 故障：任务与重复 | sample | 依赖关系 | 不能把行数当样本 |

- 注入边界：把「uncertainty」设为「区间与上界」，同时固定「metric」为「pass@k/pass^k」；记录输入、状态和结果，记录谨慎解释。
- 只改变「sample」：正常值用「任务与重复」，越界或故障按“不能把行数当样本”构造；观察定义清楚，不要改动其余输入。
- 用依赖关系检查“依赖性”：比较 20×5×2 模拟表，分别计算至少一次成功、全部成功和零失败上界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。 比较 pass@k、pass^k、零失败和非独立试验的解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 指标解释

{% note info flat %}
统计实验要说明独立性、重复次数和区间；pass@k、pass^k、零失败和平均值回答不同问题。 在“指标解释”这一环节负责复核：先固定metric，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（指标解释）：输入为「pass@k/pass^k」；状态观察为「依赖关系」；独立判定使用「谨慎解释」。记录比较 20×5×2 模拟表，分别计算至少一次成功、全部成功和零失败上界，把“相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：比较 20×5×2 模拟表，分别计算至少一次成功、全部成功和零失败上界。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
runs=[{"model":m,"task":t,"ok":(m=="large" or t!="delete")} for m in ["small","large"] for t in ["refund","login","delete","status","export"]]
pass_at_k=any(r["ok"] for r in runs)
pass_all=all(r["ok"] for r in runs)
zero_failure=sum(r["ok"] for r in runs)==len(runs)
print({"runs":len(runs),"pass_at_k":pass_at_k,"pass_all":pass_all,"zero_failure":zero_failure})
assert len(runs)==10 and pass_at_k and not pass_all
# 预期观察：比较 20×5×2 模拟表，分别计算至少一次成功、全部成功和零失败上界。
```

{% note success flat %}
失败边界：相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。 比较 pass@k、pass^k、零失败和非独立试验的解释。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e05-pass-at-k deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
在stats夹具里，怎样区分“通过 at k”的通过与拒绝？
--- answer
先把“通过 at k”绑定到metric与sample；正常、越界和 Unknown 各运行一次，断言谨慎解释。
--- explanation
在stats夹具中，比较pass@k/pass^k与任务与重复，保留谨慎解释；相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。
{% endflashcard %}

{% flashcard basic id:e05-zero-failures deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
在stats夹具里，怎样区分“零失败”的通过与拒绝？
--- answer
先把“零失败”绑定到metric与sample；正常、越界和 Unknown 各运行一次，断言谨慎解释。
--- explanation
在stats夹具中，比较pass@k/pass^k与任务与重复，保留谨慎解释；相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。
{% endflashcard %}

{% flashcard basic id:e05-nonindependent deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
为什么“非独立”必须留下独立证据？
--- answer
先把“非独立”绑定到metric与sample；正常、越界和 Unknown 各运行一次，断言谨慎解释。
--- explanation
在stats夹具中，比较pass@k/pass^k与任务与重复，保留谨慎解释；相关样本和选择偏差会改变结论；报告分组键与未覆盖范围。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% endlinkgroup %}

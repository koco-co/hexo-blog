---
title: Agent 质量工程(十六)性能与成本
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能从 20 个任务的并发数据中解释 p95、成本和成功率。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 16
published: true
abbrlink: a89ea5fe
date: 2026-08-07 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：评估并发、缓存、尾延迟、任务成功成本和资源占用。 最终要留下：能从 20 个任务的并发数据中解释 p95、成本和成功率。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 并发模型

{% note primary flat %}
性能与成本关注并发模型、尾延迟、缓存效果和成功任务成本；平均值会掩盖 p95 和失败任务。 在“并发模型”这一环节负责定义：先固定concurrency，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| concurrency | 槽位、排队 | 吞吐与背压 | 不能无限加并发 |
| tail | p50/p95/p99 | 长尾 | 不能只报平均 |
| cost | 成功任务 tokens/钱 | 单位成本 | 不能把失败忽略 |
| 定义边界 | 并发模型 | 比较不同并发和缓存配置，按成功任务计算成本并报告 p95、失败率和缓存命中。 | 缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[concurrency]
  F --> A[并发模型]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「concurrency」设为「槽位、排队」，同时固定「tail」为「p50/p95/p99」；记录输入、状态和结果，记录吞吐与背压。
- 只改变「cost」：正常值用「成功任务 tokens/钱」，越界或故障按“不能把失败忽略”构造；观察长尾，不要改动其余输入。
- 用单位成本检查“并发模型”：比较不同并发和缓存配置，按成功任务计算成本并报告 p95、失败率和缓存命中；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。 比较不同并发和缓存配置，避免平均值掩盖长尾。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 尾延迟

{% note info flat %}
性能与成本关注并发模型、尾延迟、缓存效果和成功任务成本；平均值会掩盖 p95 和失败任务。 在“尾延迟”这一环节负责执行：先固定tail，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：尾延迟**
1. 入口：tail=p50/p95/p99，先记录长尾。
2. 转移：由cost=成功任务 tokens/钱进入尾延迟，只允许声明的动作。
3. 出口：用吞吐与背压检查concurrency，越界条件是“不能无限加并发”。
{% endnote %}

- 执行正常路径：把「tail」设为「p50/p95/p99」，同时固定「cost」为「成功任务 tokens/钱」；记录输入、状态和结果，记录长尾。
- 只改变「concurrency」：正常值用「槽位、排队」，越界或故障按“不能无限加并发”构造；观察单位成本，不要改动其余输入。
- 用吞吐与背压检查“尾延迟”：比较不同并发和缓存配置，按成功任务计算成本并报告 p95、失败率和缓存命中；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。 比较不同并发和缓存配置，避免平均值掩盖长尾。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 缓存效果

{% note info flat %}
性能与成本关注并发模型、尾延迟、缓存效果和成功任务成本；平均值会掩盖 p95 和失败任务。 在“缓存效果”这一环节负责故障：先固定cost，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：成功任务 tokens/钱 | cost | 单位成本 | 不能把失败忽略 |
| 边界：槽位、排队 | concurrency | 吞吐与背压 | 不能无限加并发 |
| 故障：p50/p95/p99 | tail | 长尾 | 不能只报平均 |

- 注入边界：把「cost」设为「成功任务 tokens/钱」，同时固定「concurrency」为「槽位、排队」；记录输入、状态和结果，记录单位成本。
- 只改变「tail」：正常值用「p50/p95/p99」，越界或故障按“不能只报平均”构造；观察吞吐与背压，不要改动其余输入。
- 用长尾检查“缓存效果”：比较不同并发和缓存配置，按成功任务计算成本并报告 p95、失败率和缓存命中；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。 比较不同并发和缓存配置，避免平均值掩盖长尾。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 成功成本

{% note info flat %}
性能与成本关注并发模型、尾延迟、缓存效果和成功任务成本；平均值会掩盖 p95 和失败任务。 在“成功成本”这一环节负责复核：先固定concurrency，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（成功成本）：输入为「槽位、排队」；状态观察为「长尾」；独立判定使用「单位成本」。记录比较不同并发和缓存配置，按成功任务计算成本并报告 p95、失败率和缓存命中，把“缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：比较不同并发和缓存配置，按成功任务计算成本并报告 p95、失败率和缓存命中。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
configs=[{"concurrency":1,"cache":False},{"concurrency":4,"cache":True}]
latencies=[120,130,140,900]
success=[True,True,True,False]
cost=sum(1 for ok in success if ok)/sum(success)
print({"configs":configs,"p95":sorted(latencies)[-1],"failure_rate":1-sum(success)/len(success),"success_cost":cost,"cache_hit":configs[1]["cache"]})
assert max(latencies)==900
# 预期观察：比较不同并发和缓存配置，按成功任务计算成本并报告 p95、失败率和缓存命中。
```

{% note success flat %}
失败边界：缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。 比较不同并发和缓存配置，避免平均值掩盖长尾。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e16-success-task-cost deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
当“成功任务成本”出现时，先检查哪个状态和边界？
--- answer
先把“成功任务成本”绑定到concurrency与tail；正常、越界和 Unknown 各运行一次，断言单位成本。
--- explanation
在perf夹具中，比较槽位、排队与p50/p95/p99，保留单位成本；缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。
{% endflashcard %}

{% flashcard basic id:e16-average-hides-tail deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
在perf夹具里，怎样区分“平均值掩盖长尾”的通过与拒绝？
--- answer
先把“平均值掩盖长尾”绑定到concurrency与tail；正常、越界和 Unknown 各运行一次，断言单位成本。
--- explanation
在perf夹具中，比较槽位、排队与p50/p95/p99，保留单位成本；缓存命中可能牺牲新鲜度；性能优化不能越过安全和正确性门禁。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

---
title: AI 大模型应用(十)调用可靠性与成本
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 在 FakeProvider 的成功、429、401、超时夹具上验证预算内重试，并区分 TTFT 与任务完成。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 10
published: false
abbrlink: 3955aac0
date: 2026-07-07 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把截止时间、预算、重试、退避、限流、降级和成本核算放到同一个调用策略中。 最终要留下：在 FakeProvider 的成功、429、401、超时夹具上验证预算内重试，并区分 TTFT 与任务完成。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 预算边界

{% note primary flat %}
可靠调用把截止时间、重试、退避、限流、降级和成本放在一个预算中；重试次数本身不是可靠性指标。 在“预算边界”这一环节负责定义：先固定deadline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| deadline | 端到端截止时间 | 剩余预算 | 不能无限重试 |
| retry | 错误可重试性 | 401 不重试，429 退避 | 不能重试副作用 |
| cost | tokens、请求数、TTFT | 按成功任务核算 | 不能只报均值 |
| 定义边界 | 预算边界 | FakeProvider 返回 429、超时、401 和成功，策略只在 deadline 内对可重试错误退避，输出 TTFT 与完成成本。 | 重试前要判断请求是否幂等；超过预算应停止并说明降级结果。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[deadline]
  F --> A[预算边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「deadline」设为「端到端截止时间」，同时固定「retry」为「错误可重试性」；记录输入、状态和结果，记录剩余预算。
- 只改变「cost」：正常值用「tokens、请求数、TTFT」，越界或故障按“不能只报均值”构造；观察401 不重试，429 退避，不要改动其余输入。
- 用按成功任务核算检查“预算边界”：FakeProvider 返回 429、超时、401 和成功，策略只在 deadline 内对可重试错误退避，输出 TTFT 与完成成本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：重试前要判断请求是否幂等；超过预算应停止并说明降级结果。 使用虚拟时钟和 Retry-After，比较客户端、适配层和业务层多重重试的预算消耗。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 故障分类

{% note info flat %}
可靠调用把截止时间、重试、退避、限流、降级和成本放在一个预算中；重试次数本身不是可靠性指标。 在“故障分类”这一环节负责执行：先固定retry，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：故障分类**
1. 入口：retry=错误可重试性，先记录401 不重试，429 退避。
2. 转移：由cost=tokens、请求数、TTFT进入故障分类，只允许声明的动作。
3. 出口：用剩余预算检查deadline，越界条件是“不能无限重试”。
{% endnote %}

- 执行正常路径：把「retry」设为「错误可重试性」，同时固定「cost」为「tokens、请求数、TTFT」；记录输入、状态和结果，记录401 不重试，429 退避。
- 只改变「deadline」：正常值用「端到端截止时间」，越界或故障按“不能无限重试”构造；观察按成功任务核算，不要改动其余输入。
- 用剩余预算检查“故障分类”：FakeProvider 返回 429、超时、401 和成功，策略只在 deadline 内对可重试错误退避，输出 TTFT 与完成成本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：重试前要判断请求是否幂等；超过预算应停止并说明降级结果。 使用虚拟时钟和 Retry-After，比较客户端、适配层和业务层多重重试的预算消耗。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重试策略

{% note info flat %}
可靠调用把截止时间、重试、退避、限流、降级和成本放在一个预算中；重试次数本身不是可靠性指标。 在“重试策略”这一环节负责故障：先固定cost，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：tokens、请求数、TTFT | cost | 按成功任务核算 | 不能只报均值 |
| 边界：端到端截止时间 | deadline | 剩余预算 | 不能无限重试 |
| 故障：错误可重试性 | retry | 401 不重试，429 退避 | 不能重试副作用 |

- 注入边界：把「cost」设为「tokens、请求数、TTFT」，同时固定「deadline」为「端到端截止时间」；记录输入、状态和结果，记录按成功任务核算。
- 只改变「retry」：正常值用「错误可重试性」，越界或故障按“不能重试副作用”构造；观察剩余预算，不要改动其余输入。
- 用401 不重试，429 退避检查“重试策略”：FakeProvider 返回 429、超时、401 和成功，策略只在 deadline 内对可重试错误退避，输出 TTFT 与完成成本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：重试前要判断请求是否幂等；超过预算应停止并说明降级结果。 使用虚拟时钟和 Retry-After，比较客户端、适配层和业务层多重重试的预算消耗。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 成本验证

{% note info flat %}
可靠调用把截止时间、重试、退避、限流、降级和成本放在一个预算中；重试次数本身不是可靠性指标。 在“成本验证”这一环节负责复核：先固定deadline，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（成本验证）：输入为「端到端截止时间」；状态观察为「401 不重试，429 退避」；独立判定使用「按成功任务核算」。记录FakeProvider 返回 429、超时、401 和成功，策略只在 deadline 内对可重试错误退避，输出 TTFT 与完成成本，把“重试前要判断请求是否幂等；超过预算应停止并说明降级结果。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：FakeProvider 返回 429、超时、401 和成功，策略只在 deadline 内对可重试错误退避，输出 TTFT 与完成成本。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
responses=[("429",80,2),("timeout",2000,0),("401",90,0),("200",120,40)]
deadline_ms=3000
attempts=0
spent_ms=0
result="error"
for status,elapsed,tokens in responses:
    if spent_ms+elapsed>deadline_ms: break
    attempts+=1; spent_ms+=elapsed
    if status=="200": result="success"; break
    if status not in {"429","timeout"}: result=status; break
cost=tokens*0.00001
print({"result":result,"attempts":attempts,"elapsed_ms":spent_ms,"cost":cost})
assert result=="401" and attempts==3 and spent_ms<=deadline_ms
# 预期观察：FakeProvider 返回 429、超时、401 和成功，策略只在 deadline 内对可重试错误退避，输出 TTFT 与完成成本。
```

{% note success flat %}
失败边界：重试前要判断请求是否幂等；超过预算应停止并说明降级结果。 使用虚拟时钟和 Retry-After，比较客户端、适配层和业务层多重重试的预算消耗。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a10-retry-needs-deadline deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
为什么重试必须绑定截止时间？
--- answer
没有截止时间时，重试可能在超时、撤销或预算耗尽后继续产生不可控结果；两者要在同一个策略中验收。
--- explanation
测试正常和越界两条路径，保留截止时间、剩余预算和最终状态。
{% endflashcard %}

{% flashcard basic id:a10-ttft-vs-completion deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
“成本验证”的课程边界中，首 token 延迟与完成如何选择？
--- answer
先把首 token 延迟的控制变量设为deadline，把完成的对照变量设为retry；在相同样本上分别记录按成功任务核算，再按失败边界作出选择。
--- explanation
比较首 token 延迟与完成时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。重试前要判断请求是否幂等；超过预算应停止并说明降级结果。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://ai.google.dev/favicon.ico %}
{% link JSON Schema specification, https://json-schema.org/specification, https://json-schema.org/favicon.ico %}
{% endlinkgroup %}

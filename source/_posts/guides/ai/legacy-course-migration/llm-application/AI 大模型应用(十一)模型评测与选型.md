---
title: AI 大模型应用(十一)模型评测与选型
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 用十项合成任务和两个模型 fixture 产出带质量、延迟、成本和风险解释的选择记录。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 11
published: false
abbrlink: 99d73179
date: 2026-07-08 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：用有限、分层、有业务意义的证据选择模型，而不是照搬排行榜。 最终要留下：用十项合成任务和两个模型 fixture 产出带质量、延迟、成本和风险解释的选择记录。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 问题定义

{% note primary flat %}
模型选型是分层证据决策：业务正确、风险、延迟、成本和稳定性必须在同一任务集下比较。 在“问题定义”这一环节负责定义：先固定task，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| task | 十项分层工单 | 覆盖关键风险 | 不能照搬排行榜 |
| quality | 独立 Oracle | 错误类型 | 不能用 judge 自评 |
| cost | 成功任务成本 | p95 与失败率 | 不能平均掩盖长尾 |
| 定义边界 | 问题定义 | 两个 Fake 模型跑同一十项任务，先应用硬门禁，再比较质量、p95 和成功成本，形成可追溯选择记录。 | 样本少、任务分布变或版本变化都会改变结论；记录时间和 fixture 版本。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[task]
  F --> A[问题定义]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「task」设为「十项分层工单」，同时固定「quality」为「独立 Oracle」；记录输入、状态和结果，记录覆盖关键风险。
- 只改变「cost」：正常值用「成功任务成本」，越界或故障按“不能平均掩盖长尾”构造；观察错误类型，不要改动其余输入。
- 用p95 与失败率检查“问题定义”：两个 Fake 模型跑同一十项任务，先应用硬门禁，再比较质量、p95 和成功成本，形成可追溯选择记录；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：样本少、任务分布变或版本变化都会改变结论；记录时间和 fixture 版本。 固定任务、温度、预算和评分规则，比较结果并标出样本不足和不可外推之处。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 实验设计

{% note info flat %}
模型选型是分层证据决策：业务正确、风险、延迟、成本和稳定性必须在同一任务集下比较。 在“实验设计”这一环节负责执行：先固定quality，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：实验设计**
1. 入口：quality=独立 Oracle，先记录错误类型。
2. 转移：由cost=成功任务成本进入实验设计，只允许声明的动作。
3. 出口：用覆盖关键风险检查task，越界条件是“不能照搬排行榜”。
{% endnote %}

- 执行正常路径：把「quality」设为「独立 Oracle」，同时固定「cost」为「成功任务成本」；记录输入、状态和结果，记录错误类型。
- 只改变「task」：正常值用「十项分层工单」，越界或故障按“不能照搬排行榜”构造；观察p95 与失败率，不要改动其余输入。
- 用覆盖关键风险检查“实验设计”：两个 Fake 模型跑同一十项任务，先应用硬门禁，再比较质量、p95 和成功成本，形成可追溯选择记录；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：样本少、任务分布变或版本变化都会改变结论；记录时间和 fixture 版本。 固定任务、温度、预算和评分规则，比较结果并标出样本不足和不可外推之处。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果解释

{% note info flat %}
模型选型是分层证据决策：业务正确、风险、延迟、成本和稳定性必须在同一任务集下比较。 在“结果解释”这一环节负责故障：先固定cost，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：成功任务成本 | cost | p95 与失败率 | 不能平均掩盖长尾 |
| 边界：十项分层工单 | task | 覆盖关键风险 | 不能照搬排行榜 |
| 故障：独立 Oracle | quality | 错误类型 | 不能用 judge 自评 |

- 注入边界：把「cost」设为「成功任务成本」，同时固定「task」为「十项分层工单」；记录输入、状态和结果，记录p95 与失败率。
- 只改变「quality」：正常值用「独立 Oracle」，越界或故障按“不能用 judge 自评”构造；观察覆盖关键风险，不要改动其余输入。
- 用错误类型检查“结果解释”：两个 Fake 模型跑同一十项任务，先应用硬门禁，再比较质量、p95 和成功成本，形成可追溯选择记录；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：样本少、任务分布变或版本变化都会改变结论；记录时间和 fixture 版本。 固定任务、温度、预算和评分规则，比较结果并标出样本不足和不可外推之处。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 决策记录

{% note info flat %}
模型选型是分层证据决策：业务正确、风险、延迟、成本和稳定性必须在同一任务集下比较。 在“决策记录”这一环节负责复核：先固定task，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（决策记录）：输入为「十项分层工单」；状态观察为「错误类型」；独立判定使用「p95 与失败率」。记录两个 Fake 模型跑同一十项任务，先应用硬门禁，再比较质量、p95 和成功成本，形成可追溯选择记录，把“样本少、任务分布变或版本变化都会改变结论；记录时间和 fixture 版本。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：两个 Fake 模型跑同一十项任务，先应用硬门禁，再比较质量、p95 和成功成本，形成可追溯选择记录。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
tasks=["refund","login","delete","status","export","cancel","search","quote","attach","escalate"]
models={"small":[1,1,1,1,1,1,0,1,1,1],"large":[1,1,1,1,1,1,1,1,1,1]}
latency_runs={"small":[120,130,140,150,400],"large":[180,190,210,220,260]}
request_ok={"small":[1,1,1,1,0],"large":[1,1,1,1,1]}
def percentile95(values): return sorted(values)[max(0,int(0.95*len(values))-1)]
scores={name:sum(values)/len(values) for name,values in models.items()}
hard_gate={name:all(values) for name,values in models.items()}
stability={name:{"failure_rate":round(1-sum(request_ok[name])/len(request_ok[name]),3),"p95_ms":percentile95(latency_runs[name])} for name in models}
print({"tasks":len(tasks),"scores":scores,"hard_gate":hard_gate,"stability":stability})
assert len(tasks)==10 and not hard_gate["small"] and hard_gate["large"]
assert stability["small"]["failure_rate"]==0.2 and stability["large"]["failure_rate"]==0
# 预期观察：两个 Fake 模型跑同一十项任务，先应用硬门禁，再比较质量、p95 和成功成本，形成可追溯选择记录。
```

{% note success flat %}
失败边界：样本少、任务分布变或版本变化都会改变结论；记录时间和 fixture 版本。 固定任务、温度、预算和评分规则，比较结果并标出样本不足和不可外推之处。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a11-leaderboard-is-not-choice deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
“决策记录”的课程边界中，为什么“排行榜”不是“选型”？
--- answer
排行榜只在固定任务和指标上提供局部信号；选型还要把业务正确性、风险、延迟、成本和稳定性放回同一任务集验证。
--- explanation
模型选型是分层证据决策，排行榜只覆盖其中一层：

| 证据层 | 要回答的问题 |
| --- | --- |
| 质量 | 同一业务任务集是否正确，区间多宽 |
| 运行 | 请求失败率、重复输出变化和 p95 延迟是否可接受 |
| 约束 | 隐私、许可、区域和预算是否通过硬门禁 |
| 恢复 | 候选快照、拒绝原因和回滚目标是否已验证 |

没有同栈成本与成功数就不能声称比较了“成功任务成本”，单一榜单分数也不能替代这些证据。
{% endflashcard %}

{% flashcard basic id:a11-ten-samples-not-stability deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
“决策记录”的课程边界中，为什么“十个样本”不是“稳定性”？
--- answer
十个任务只给出很弱的质量覆盖；稳定性要分别观察重复输出变化、请求失败率和延迟尾部。
--- explanation
四类指标观察不同对象，必须分开记录：

| 指标 | 直接证据 | 不能单独推出 |
| --- | --- | --- |
| 十项质量样本 | 这十项的正确情况 | 业务分布已覆盖 |
| 请求失败率 | 请求是否成功返回 | 返回内容正确 |
| p95 延迟 | 95% 请求不超过的延迟位置估计 | 尾部长期稳定 |
| 重复输出方差 | 同一输入的输出变化 | 事实正确 |

十个样本与少量重复只能形成小样本观察，不能证明真实服务稳定。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link JSON Schema specification, https://json-schema.org/specification, https://json-schema.org/favicon.ico %}
{% link OpenAI Platform documentation, https://platform.openai.com/docs/overview, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

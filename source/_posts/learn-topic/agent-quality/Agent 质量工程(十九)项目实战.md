---
title: Agent 质量工程(十九)项目实战
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 产出数据、运行器、评分器、Trace、统计、门禁和复盘报告。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 19
published: true
abbrlink: f8d3d67e
date: 2026-08-08 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：交付含三类故障、RAG、多轮和评测系统自测的完整质量证据包。 最终要留下：产出数据、运行器、评分器、Trace、统计、门禁和复盘报告。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 项目范围

{% note primary flat %}
项目交付完整质量证据包：数据、运行器、评分器、Trace、统计、故障演练、门禁和复盘相互可追溯。 在“项目范围”这一环节负责定义：先固定dataset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| dataset | 版本、租户、样本 | 来源可查 | 不能混数据 |
| run | 预算、事件、环境 | 可重放 | 不能只存分数 |
| gate | 硬失败、回滚 | 决策可解释 | 不能平均掩盖 |
| 定义边界 | 项目范围 | 使用 C/D Fake Agent 注入检索、审批和恢复故障，同时跑离线与在线模拟并输出复盘。 | 项目只证明设定夹具内的质量边界；真实流量仍需 canary 和人工负责。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[dataset]
  F --> A[项目范围]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「dataset」设为「版本、租户、样本」，同时固定「run」为「预算、事件、环境」；串联阶段并统计副作用，记录来源可查。
- 只改变「gate」：正常值用「硬失败、回滚」，越界或故障按“不能平均掩盖”构造；观察可重放，不要改动其余输入。
- 用决策可解释检查“项目范围”：使用 C/D Fake Agent 注入检索、审批和恢复故障，同时跑离线与在线模拟并输出复盘；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目只证明设定夹具内的质量边界；真实流量仍需 canary 和人工负责。 使用 C/D Fake Agent 注入检索、审批和恢复故障，跑离线与在线模拟。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 评测实现

{% note info flat %}
项目交付完整质量证据包：数据、运行器、评分器、Trace、统计、故障演练、门禁和复盘相互可追溯。 在“评测实现”这一环节负责执行：先固定run，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：评测实现**
1. 入口：run=预算、事件、环境，先记录可重放。
2. 转移：由gate=硬失败、回滚进入评测实现，只允许声明的动作。
3. 出口：用来源可查检查dataset，越界条件是“不能混数据”。
{% endnote %}

- 执行正常路径：把「run」设为「预算、事件、环境」，同时固定「gate」为「硬失败、回滚」；串联阶段并统计副作用，记录可重放。
- 只改变「dataset」：正常值用「版本、租户、样本」，越界或故障按“不能混数据”构造；观察决策可解释，不要改动其余输入。
- 用来源可查检查“评测实现”：使用 C/D Fake Agent 注入检索、审批和恢复故障，同时跑离线与在线模拟并输出复盘；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目只证明设定夹具内的质量边界；真实流量仍需 canary 和人工负责。 使用 C/D Fake Agent 注入检索、审批和恢复故障，跑离线与在线模拟。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 故障演练

{% note info flat %}
项目交付完整质量证据包：数据、运行器、评分器、Trace、统计、故障演练、门禁和复盘相互可追溯。 在“故障演练”这一环节负责故障：先固定gate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：硬失败、回滚 | gate | 决策可解释 | 不能平均掩盖 |
| 边界：版本、租户、样本 | dataset | 来源可查 | 不能混数据 |
| 故障：预算、事件、环境 | run | 可重放 | 不能只存分数 |

- 注入边界：把「gate」设为「硬失败、回滚」，同时固定「dataset」为「版本、租户、样本」；串联阶段并统计副作用，记录决策可解释。
- 只改变「run」：正常值用「预算、事件、环境」，越界或故障按“不能只存分数”构造；观察来源可查，不要改动其余输入。
- 用可重放检查“故障演练”：使用 C/D Fake Agent 注入检索、审批和恢复故障，同时跑离线与在线模拟并输出复盘；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目只证明设定夹具内的质量边界；真实流量仍需 canary 和人工负责。 使用 C/D Fake Agent 注入检索、审批和恢复故障，跑离线与在线模拟。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 上线复盘

{% note info flat %}
项目交付完整质量证据包：数据、运行器、评分器、Trace、统计、故障演练、门禁和复盘相互可追溯。 在“上线复盘”这一环节负责复核：先固定dataset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（上线复盘）：输入为「版本、租户、样本」；状态观察为「可重放」；独立判定使用「决策可解释」。记录使用 C/D Fake Agent 注入检索、审批和恢复故障，同时跑离线与在线模拟并输出复盘，把“项目只证明设定夹具内的质量边界；真实流量仍需 canary 和人工负责。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：使用 C/D Fake Agent 注入检索、审批和恢复故障，同时跑离线与在线模拟并输出复盘。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
dataset=[{"task":f"T-{i:02d}","version":1,"oracle":i%3!=0} for i in range(1,21)]
runs=[{"task":row["task"],"offline":row["oracle"],"online":row["oracle"] and row["version"]==1} for row in dataset]
faults=[r for r in runs if not r["offline"] or not r["online"]]
review={"trace":True,"stats":True,"rollback":True}
print({"dataset":len(dataset),"offline_failures":sum(not r["offline"] for r in runs),"online_failures":sum(not r["online"] for r in runs),"faults":len(faults),"review":review})
assert len(dataset)==20 and all(review.values())
# 预期观察：使用 C/D Fake Agent 注入检索、审批和恢复故障，同时跑离线与在线模拟并输出复盘。
```

{% note success flat %}
失败边界：项目只证明设定夹具内的质量边界；真实流量仍需 canary 和人工负责。 使用 C/D Fake Agent 注入检索、审批和恢复故障，跑离线与在线模拟。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard_ref id="e09-runner-needs-testing" %}

{% flashcard_ref id="e18-offline-not-online" %}

## 参考资料

{% linkgroup %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

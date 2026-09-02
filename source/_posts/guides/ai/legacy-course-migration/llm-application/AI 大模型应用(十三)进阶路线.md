---
title: AI 大模型应用(十三)进阶路线
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 提交一个可在两周内完成、含假设、对照、停止条件和风险的实验提案。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 13
published: false
abbrlink: d5c97b4d
date: 2026-07-09 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：围绕一个仍未解决的质量或成本瓶颈设计有停止条件的进阶实验。 最终要留下：提交一个可在两周内完成、含假设、对照、停止条件和风险的实验提案。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 瓶颈定位

{% note primary flat %}
进阶实验必须从一个未解决瓶颈开始，用假设、对照、指标、停止条件和风险把探索变成可审查计划。 在“瓶颈定位”这一环节负责定义：先固定hypothesis，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| hypothesis | 明确可证伪句子 | 有预期方向 | 不能写成口号 |
| control | 固定模型/数据 | 只改一个变量 | 不能同时优化三处 |
| stop | 预算、阈值、时间 | 达到即停止 | 不能无限试错 |
| 定义边界 | 瓶颈定位 | 围绕延迟或引用覆盖提交一个两周内可完成的对照方案，明确何时停止和如何回滚。 | 提案不是结果；未执行前只能说明实验设计，不能宣称性能提升。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[hypothesis]
  F --> A[瓶颈定位]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「hypothesis」设为「明确可证伪句子」，同时固定「control」为「固定模型/数据」；记录输入、状态和结果，记录有预期方向。
- 只改变「stop」：正常值用「预算、阈值、时间」，越界或故障按“不能无限试错”构造；观察只改一个变量，不要改动其余输入。
- 用达到即停止检查“瓶颈定位”：围绕延迟或引用覆盖提交一个两周内可完成的对照方案，明确何时停止和如何回滚；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：提案不是结果；未执行前只能说明实验设计，不能宣称性能提升。 从 RAG、微调、缓存、路由或评测中选一项，写出可证伪的对照方案。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 方向选择

{% note info flat %}
进阶实验必须从一个未解决瓶颈开始，用假设、对照、指标、停止条件和风险把探索变成可审查计划。 在“方向选择”这一环节负责执行：先固定control，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：方向选择**
1. 入口：control=固定模型/数据，先记录只改一个变量。
2. 转移：由stop=预算、阈值、时间进入方向选择，只允许声明的动作。
3. 出口：用有预期方向检查hypothesis，越界条件是“不能写成口号”。
{% endnote %}

- 执行正常路径：把「control」设为「固定模型/数据」，同时固定「stop」为「预算、阈值、时间」；记录输入、状态和结果，记录只改一个变量。
- 只改变「hypothesis」：正常值用「明确可证伪句子」，越界或故障按“不能写成口号”构造；观察达到即停止，不要改动其余输入。
- 用有预期方向检查“方向选择”：围绕延迟或引用覆盖提交一个两周内可完成的对照方案，明确何时停止和如何回滚；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：提案不是结果；未执行前只能说明实验设计，不能宣称性能提升。 从 RAG、微调、缓存、路由或评测中选一项，写出可证伪的对照方案。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 实验提案

{% note info flat %}
进阶实验必须从一个未解决瓶颈开始，用假设、对照、指标、停止条件和风险把探索变成可审查计划。 在“实验提案”这一环节负责故障：先固定stop，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：预算、阈值、时间 | stop | 达到即停止 | 不能无限试错 |
| 边界：明确可证伪句子 | hypothesis | 有预期方向 | 不能写成口号 |
| 故障：固定模型/数据 | control | 只改一个变量 | 不能同时优化三处 |

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：围绕延迟或引用覆盖提交一个两周内可完成的对照方案，明确何时停止和如何回滚。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
proposal={"hypothesis":"cache lowers p95","control":"no-cache","variant":"prefix-cache","stop":"p95<200ms or 20 runs"}
assert all(proposal.values())
print(proposal)
# 预期观察：围绕延迟或引用覆盖提交一个两周内可完成的对照方案，明确何时停止和如何回滚。
```

{% note success flat %}
失败边界：提案不是结果；未执行前只能说明实验设计，不能宣称性能提升。 从 RAG、微调、缓存、路由或评测中选一项，写出可证伪的对照方案。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a13-rag-vs-finetuning deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
“实验提案”的课程边界中，RAG与微调如何选择？
--- answer
先把RAG的控制变量设为hypothesis，把微调的对照变量设为control；在相同样本上分别记录达到即停止，再按失败边界作出选择。
--- explanation
比较RAG与微调时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。提案不是结果；未执行前只能说明实验设计，不能宣称性能提升。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Anthropic API documentation, https://docs.anthropic.com/en/docs/intro, https://docs.anthropic.com/favicon.ico %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://ai.google.dev/favicon.ico %}
{% endlinkgroup %}

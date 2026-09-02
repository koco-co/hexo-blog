---
title: AI 辅助测试(二)协作边界
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能画出角色泳道和接口契约，避免把生成结果当测试结论。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 2
published: false
abbrlink: 41bcbe17
date: 2026-08-15 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：明确需求、测试设计、生成、执行、业务验收和 Agent 的职责边界。 最终要留下：能画出角色泳道和接口契约，避免把生成结果当测试结论。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 角色分工

{% note primary flat %}
测试协作把需求、设计、生成、执行和业务验收放进不同泳道；LLM 产物是候选输入，不是执行结论。 在“角色分工”这一环节负责定义：先固定role，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| role | 需求/生成/执行/验收 | 责任人 | 不能混职责 |
| contract | 输入、输出、版本 | 接口稳定 | 不能只传自然语言 |
| evidence | 报告、日志、Oracle | 可追溯 | 不能把生成当通过 |
| 定义边界 | 角色分工 | 为一条 API 需求画泳道，比较 LLM 生成和 Schemathesis 执行，分别保存用例与执行结果。 | 生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[role]
  F --> A[角色分工]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「role」设为「需求/生成/执行/验收」，同时固定「contract」为「输入、输出、版本」；记录输入、状态和结果，记录责任人。
- 只改变「evidence」：正常值用「报告、日志、Oracle」，越界或故障按“不能把生成当通过”构造；观察接口稳定，不要改动其余输入。
- 用可追溯检查“角色分工”：为一条 API 需求画泳道，比较 LLM 生成和 Schemathesis 执行，分别保存用例与执行结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。 为一条 API 需求建立泳道，比较 LLM 生成与 Schemathesis 执行。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 契约边界

{% note info flat %}
测试协作把需求、设计、生成、执行和业务验收放进不同泳道；LLM 产物是候选输入，不是执行结论。 在“契约边界”这一环节负责执行：先固定contract，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：契约边界**
1. 入口：contract=输入、输出、版本，先记录接口稳定。
2. 转移：由evidence=报告、日志、Oracle进入契约边界，只允许声明的动作。
3. 出口：用责任人检查role，越界条件是“不能混职责”。
{% endnote %}

- 执行正常路径：把「contract」设为「输入、输出、版本」，同时固定「evidence」为「报告、日志、Oracle」；记录输入、状态和结果，记录接口稳定。
- 只改变「role」：正常值用「需求/生成/执行/验收」，越界或故障按“不能混职责”构造；观察可追溯，不要改动其余输入。
- 用责任人检查“契约边界”：为一条 API 需求画泳道，比较 LLM 生成和 Schemathesis 执行，分别保存用例与执行结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。 为一条 API 需求建立泳道，比较 LLM 生成与 Schemathesis 执行。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 生成执行

{% note info flat %}
测试协作把需求、设计、生成、执行和业务验收放进不同泳道；LLM 产物是候选输入，不是执行结论。 在“生成执行”这一环节负责故障：先固定evidence，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：报告、日志、Oracle | evidence | 可追溯 | 不能把生成当通过 |
| 边界：需求/生成/执行/验收 | role | 责任人 | 不能混职责 |
| 故障：输入、输出、版本 | contract | 接口稳定 | 不能只传自然语言 |

- 注入边界：把「evidence」设为「报告、日志、Oracle」，同时固定「role」为「需求/生成/执行/验收」；记录输入、状态和结果，记录可追溯。
- 只改变「contract」：正常值用「输入、输出、版本」，越界或故障按“不能只传自然语言”构造；观察责任人，不要改动其余输入。
- 用接口稳定检查“生成执行”：为一条 API 需求画泳道，比较 LLM 生成和 Schemathesis 执行，分别保存用例与执行结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。 为一条 API 需求建立泳道，比较 LLM 生成与 Schemathesis 执行。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 验收责任

{% note info flat %}
测试协作把需求、设计、生成、执行和业务验收放进不同泳道；LLM 产物是候选输入，不是执行结论。 在“验收责任”这一环节负责复核：先固定role，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（验收责任）：输入为「需求/生成/执行/验收」；状态观察为「接口稳定」；独立判定使用「可追溯」。记录为一条 API 需求画泳道，比较 LLM 生成和 Schemathesis 执行，分别保存用例与执行结果，把“生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为一条 API 需求画泳道，比较 LLM 生成和 Schemathesis 执行，分别保存用例与执行结果。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[("valid",True),("boundary",False),("permission",False)]
mutants={"off_by_one":False,"skip_auth":False}
killed=sum(not v for v in mutants.values())
oracle_pass=sum(ok for _,ok in cases)
print({"cases":len(cases),"oracle_pass":oracle_pass,"mutants_killed":killed})
assert killed==2 and oracle_pass==1
# 预期观察：为一条 API 需求画泳道，比较 LLM 生成和 Schemathesis 执行，分别保存用例与执行结果。
```

{% note success flat %}
失败边界：生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。 为一条 API 需求建立泳道，比较 LLM 生成与 Schemathesis 执行。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g02-generation-vs-runner deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“验收责任”的课程边界中，生成与运行器如何选择？
--- answer
先把生成的控制变量设为role，把运行器的对照变量设为contract；在相同样本上分别记录可追溯，再按失败边界作出选择。
--- explanation
比较生成与运行器时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。
{% endflashcard %}

{% flashcard basic id:g02-schemathesis-not-llm deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“验收责任”的课程边界中，为什么“Schemathesis”不是“llm”？
--- answer
Schemathesis只提供责任人；llm还需要在contract上由可追溯确认，不能只看文本或单个事件。
--- explanation
在testing夹具中分别运行“Schemathesis”和“llm”，比较需求/生成/执行/验收与输入、输出、版本；生成失败或模型不可用时，执行器仍应能运行已确认资产；业务验收不能自动跳过。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Pytest documentation, https://docs.pytest.org/en/stable/, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link GitHub Actions documentation, https://docs.github.com/en/actions, https://github.com/favicon.ico %}
{% endlinkgroup %}

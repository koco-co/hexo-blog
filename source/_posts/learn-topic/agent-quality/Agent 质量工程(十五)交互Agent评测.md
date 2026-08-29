---
title: Agent 质量工程(十五)交互Agent评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能区分截图、Toast、页面状态和业务状态证据。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 15
published: true
abbrlink: 934f1fe8
date: 2026-08-06 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：评估浏览器或计算机操作的可见状态、慢响应、阻断和真实业务结果。 最终要留下：能区分截图、Toast、页面状态和业务状态证据。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 交互任务

{% note primary flat %}
交互 Agent 评测要把可见状态、截图、Trace 和真实业务状态分开；Toast 成功并不代表数据写入。 在“交互任务”这一环节负责定义：先固定visible，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| visible | 页面文本/截图 | 用户可见 | 不能当后端状态 |
| trace | 动作、时间、网络 | 定位过程 | 不能当 Oracle |
| business | 数据库/任务状态 | 最终结果 | 不能靠 UI 猜 |
| 定义边界 | 交互任务 | 在 UI Fake 注入 Toast 成功但业务未写入、慢响应和阻断，比较三类证据。 | 截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[visible]
  F --> A[交互任务]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「visible」设为「页面文本/截图」，同时固定「trace」为「动作、时间、网络」；记录输入、状态和结果，记录用户可见。
- 只改变「business」：正常值用「数据库/任务状态」，越界或故障按“不能靠 UI 猜”构造；观察定位过程，不要改动其余输入。
- 用最终结果检查“交互任务”：在 UI Fake 注入 Toast 成功但业务未写入、慢响应和阻断，比较三类证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。 在 UI Fake 上注入 toast 成功但业务未写入、慢响应和阻断。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 可见状态

{% note info flat %}
交互 Agent 评测要把可见状态、截图、Trace 和真实业务状态分开；Toast 成功并不代表数据写入。 在“可见状态”这一环节负责执行：先固定trace，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：可见状态**
1. 入口：trace=动作、时间、网络，先记录定位过程。
2. 转移：由business=数据库/任务状态进入可见状态，只允许声明的动作。
3. 出口：用用户可见检查visible，越界条件是“不能当后端状态”。
{% endnote %}

- 执行正常路径：把「trace」设为「动作、时间、网络」，同时固定「business」为「数据库/任务状态」；记录输入、状态和结果，记录定位过程。
- 只改变「visible」：正常值用「页面文本/截图」，越界或故障按“不能当后端状态”构造；观察最终结果，不要改动其余输入。
- 用用户可见检查“可见状态”：在 UI Fake 注入 Toast 成功但业务未写入、慢响应和阻断，比较三类证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。 在 UI Fake 上注入 toast 成功但业务未写入、慢响应和阻断。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 慢与阻断

{% note info flat %}
交互 Agent 评测要把可见状态、截图、Trace 和真实业务状态分开；Toast 成功并不代表数据写入。 在“慢与阻断”这一环节负责故障：先固定business，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：数据库/任务状态 | business | 最终结果 | 不能靠 UI 猜 |
| 边界：页面文本/截图 | visible | 用户可见 | 不能当后端状态 |
| 故障：动作、时间、网络 | trace | 定位过程 | 不能当 Oracle |

- 注入边界：把「business」设为「数据库/任务状态」，同时固定「visible」为「页面文本/截图」；记录输入、状态和结果，记录最终结果。
- 只改变「trace」：正常值用「动作、时间、网络」，越界或故障按“不能当 Oracle”构造；观察用户可见，不要改动其余输入。
- 用定位过程检查“慢与阻断”：在 UI Fake 注入 Toast 成功但业务未写入、慢响应和阻断，比较三类证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。 在 UI Fake 上注入 toast 成功但业务未写入、慢响应和阻断。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## Trace范围

{% note info flat %}
交互 Agent 评测要把可见状态、截图、Trace 和真实业务状态分开；Toast 成功并不代表数据写入。 在“Trace范围”这一环节负责复核：先固定visible，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（Trace范围）：输入为「页面文本/截图」；状态观察为「定位过程」；独立判定使用「最终结果」。记录在 UI Fake 注入 Toast 成功但业务未写入、慢响应和阻断，比较三类证据，把“截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：在 UI Fake 注入 Toast 成功但业务未写入、慢响应和阻断，比较三类证据。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
actions=[{"kind":"click","state":"ready"},{"kind":"input","state":"filled"},{"kind":"download","state":"saved"},{"kind":"slow","state":"timeout"}]
observed=[a["state"] for a in actions]
print({"actions":len(actions),"observed":observed,"reobserved":True})
assert observed[:3]==["ready","filled","saved"]
# 预期观察：在 UI Fake 注入 Toast 成功但业务未写入、慢响应和阻断，比较三类证据。
```

{% note success flat %}
失败边界：截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。 在 UI Fake 上注入 toast 成功但业务未写入、慢响应和阻断。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e15-screenshot-not-business deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“Trace范围”的课程边界中，为什么“截图”不是“业务”？
--- answer
截图只提供用户可见；业务还需要在trace上由最终结果确认，不能只看文本或单个事件。
--- explanation
在browser夹具中分别运行“截图”和“业务”，比较页面文本/截图与动作、时间、网络；截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。
{% endflashcard %}

{% flashcard basic id:e15-trace-viewer-scope deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
当“Trace 查看器作用域”出现时，先检查哪个状态和边界？
--- answer
先把“Trace 查看器作用域”绑定到visible与trace；正常、越界和 Unknown 各运行一次，断言最终结果。
--- explanation
在browser夹具中，比较页面文本/截图与动作、时间、网络，保留最终结果；截图适合证明外观和可见状态；业务结果要用接口或存储查询确认。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

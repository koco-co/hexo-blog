---
title: Agent 质量工程(十)Trace与归因
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 10
published: false
abbrlink: 3fd443e5
date: 2026-08-04 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：从 Trace 找到第一处偏差，并用控制变量验证归因。 最终要留下：能区分模型、Prompt、Context、RAG、Memory、Tool、Harness 和集成问题。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 轨迹读取

{% note primary flat %}
Trace 归因从第一处偏差开始，配合控制变量和受控重跑；一次干预只支持局部证据，不能直接宣称因果。 在“轨迹读取”这一环节负责定义：先固定span，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| span | 模型、Prompt、Context、Tool | 父子关系 | 不能只看末端 |
| first | 首个偏差 | 责任候选 | 不能跳过上游 |
| control | 一次变量 | 对照结果 | 不能多项同时改 |
| 定义边界 | 轨迹读取 | 对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界。 | Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[span]
  F --> A[轨迹读取]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「span」设为「模型、Prompt、Context、Tool」，同时固定「first」为「首个偏差」；记录输入、状态和结果，记录父子关系。
- 只改变「control」：正常值用「一次变量」，越界或故障按“不能多项同时改”构造；观察责任候选，不要改动其余输入。
- 用对照结果检查“轨迹读取”：对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。 对同一任务做一次受控重跑，说明单次干预不能证明因果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 首个偏差

{% note info flat %}
Trace 归因从第一处偏差开始，配合控制变量和受控重跑；一次干预只支持局部证据，不能直接宣称因果。 在“首个偏差”这一环节负责执行：先固定first，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：首个偏差**
1. 入口：first=首个偏差，先记录责任候选。
2. 转移：由control=一次变量进入首个偏差，只允许声明的动作。
3. 出口：用父子关系检查span，越界条件是“不能只看末端”。
{% endnote %}

- 执行正常路径：把「first」设为「首个偏差」，同时固定「control」为「一次变量」；记录输入、状态和结果，记录责任候选。
- 只改变「span」：正常值用「模型、Prompt、Context、Tool」，越界或故障按“不能只看末端”构造；观察对照结果，不要改动其余输入。
- 用父子关系检查“首个偏差”：对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。 对同一任务做一次受控重跑，说明单次干预不能证明因果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 控制变量

{% note info flat %}
Trace 归因从第一处偏差开始，配合控制变量和受控重跑；一次干预只支持局部证据，不能直接宣称因果。 在“控制变量”这一环节负责故障：先固定control，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：一次变量 | control | 对照结果 | 不能多项同时改 |
| 边界：模型、Prompt、Context、Tool | span | 父子关系 | 不能只看末端 |
| 故障：首个偏差 | first | 责任候选 | 不能跳过上游 |

- 注入边界：把「control」设为「一次变量」，同时固定「span」为「模型、Prompt、Context、Tool」；记录输入、状态和结果，记录对照结果。
- 只改变「first」：正常值用「首个偏差」，越界或故障按“不能跳过上游”构造；观察父子关系，不要改动其余输入。
- 用责任候选检查“控制变量”：对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。 对同一任务做一次受控重跑，说明单次干预不能证明因果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 归因边界

{% note info flat %}
Trace 归因从第一处偏差开始，配合控制变量和受控重跑；一次干预只支持局部证据，不能直接宣称因果。 在“归因边界”这一环节负责复核：先固定span，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（归因边界）：输入为「模型、Prompt、Context、Tool」；状态观察为「责任候选」；独立判定使用「对照结果」。记录对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界，把“Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
search="T-17"
spans=[{"name":"route","ok":True},{"name":"service","ok":False,"error":"bad state"},{"name":"db","ok":False}]
fixture={"ticket":search,"version":1}
first=next(s for s in spans if not s["ok"])
print({"search":search,"fixture":fixture,"first_divergence":first["name"],"error":first["error"]})
assert first["name"]=="service"
# 预期观察：对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界。
```

{% note success flat %}
失败边界：Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。 对同一任务做一次受控重跑，说明单次干预不能证明因果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e10-trace-not-oracle deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“归因边界”的课程边界中，为什么“Trace”不是“Oracle”？
--- answer
质量归因中的 Trace 负责定位第一处偏差；Oracle 要在受控重跑后判断业务结果是否正确。
--- explanation
Trace 归因从第一处偏差开始，配合控制变量和受控重跑；一次干预只支持局部证据，不能直接宣称因果。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存对同一任务做一次受控重跑，标记首个偏差并说明单次干预的归因边界。Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。
{% endflashcard %}

{% flashcard basic id:e10-one-intervention-not-causal deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“归因边界”的课程边界中，为什么“一次干预”不是“因果”？
--- answer
一次干预只提供父子关系；因果还需要在first上由对照结果确认，不能只看文本或单个事件。
--- explanation
在trace夹具中分别运行“一次干预”和“因果”，比较模型、Prompt、Context、Tool与首个偏差；Trace 是定位材料，不是业务 Oracle；输出正确仍要查副作用。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

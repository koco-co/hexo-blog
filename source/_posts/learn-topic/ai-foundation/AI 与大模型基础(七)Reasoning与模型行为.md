---
title: AI 与大模型基础(七)Reasoning与模型行为
tags:
  - AI 与大模型基础
  - Reasoning与模型行为
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能区分普通生成、推理模型、工具轨迹、幻觉和不确定性。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 7
published: false
abbrlink: 3dc976d9
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把事实、计算、推导和拒答任务拆成可评分记录，分别检查证据、工具结果、最终答案、不确定性与拒答，而不从理由长度推断正确性。
{% endnote %}

## 机制模型

{% note info flat %}
可观察证据包括最终答案、可见理由、工具调用与返回、引用和拒答；隐藏内部状态不可由这些文本直接反推。答案长、reasoning 参数高或调用工具，都不自动证明结论正确。
{% endnote %}

{% mermaid %}
flowchart TD
  T[任务] --> M[模型输出]
  M --> A[最终答案]
  M --> R[可见理由/摘要]
  M --> C[工具调用]
  C --> E[外部结果]
  A --> V[独立 Oracle]
  E --> V
{% endmermaid %}

{% note primary flat %}
最终答案与工具结果都进入独立 Oracle；可见理由只是一项可观察输出，不直接连接正确性判定。工具调用还要单独检查参数、权限和返回值。
{% endnote %}

| 对象 | 可观察行为 | 如何触发或验证 | 不能推出 |
| --- | --- | --- | --- |
| 普通生成 | 按提示输出 token | 固定输入与采样参数 | 没有“reasoning”标签不代表没有多步计算 |
| CoT prompting | 提示要求给出中间步骤 | 检查步骤约束与最终答案 | 可见理由不等于忠实内部过程 |
| 推理模型产品行为 | 供应商暴露 effort、摘要或专用模型 ID | 固定 API 版本并独立评分 | 参数更高或摘要更长不保证正确 |
| 隐藏推理 | 供应商不直接提供的内部状态 | 外部无法直接读取 | 不能用可见 rationale 还原 |
| 工具轨迹 | 调用参数、结果、错误与重试 | 分别验收权限、工具结果和最终答案 | 工具成功不等于任务成功 |
| 最终正确性 | 与独立 Oracle 的一致程度 | 事实来源、程序、标注或测试 | 不能由模型自评替代 |

## 核心边界

{% note info flat %}
使用同一任务的冻结输出记录，分别校验可见理由、引用支持、工具结果、最终答案、拒答和置信度。校准是许多带标签样本中“报告约 0.8 的预测，长期约有 80% 正确”的群体关系，不是检查一个自信答案。
{% endnote %}

{% folding purple, 展开机制辨析 %}
可观察证据包括最终答案、可见理由、工具调用与返回、引用和拒答；隐藏内部状态不可由这些文本直接反推。幻觉是输出提出了缺乏输入或可核验证据支持的内容，不只指“语句为假”；因此要把 `unsupported`、`wrong-calculation`、`wrong-tool-result` 和 `should-refuse` 分开记录。

任务类型决定 Oracle：事实题核对一手来源，计算题用程序，推导题检查前提与规则，信息不足题检查拒答。缺少可评分 Oracle 时正确性必须为 Unknown，并从准确率分母排除。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
cases = [
    {"id":"fact", "answer":"Paris", "oracle":"Paris", "evidence_support":True,
     "expected_refusal":False, "refused":False, "expected_tool":None, "actual_tool":None,
     "confidence":0.8, "policy_evaluable":True, "error":None},
    {"id":"calculation", "answer":6, "oracle":5, "evidence_support":False,
     "expected_refusal":False, "refused":False, "expected_tool":5, "actual_tool":5,
     "confidence":0.8, "policy_evaluable":True, "error":"wrong-calculation"},
    {"id":"reasoning", "answer":"B", "oracle":"B", "evidence_support":True,
     "expected_refusal":False, "refused":False, "expected_tool":None, "actual_tool":None,
     "confidence":0.8, "policy_evaluable":True, "error":None},
    {"id":"insufficient", "answer":None, "oracle":None, "evidence_support":None,
     "expected_refusal":True, "refused":True, "expected_tool":None, "actual_tool":None,
     "confidence":0.2, "policy_evaluable":True, "error":None},
    {"id":"unscored", "answer":"claim", "oracle":None, "evidence_support":None,
     "expected_refusal":False, "refused":False, "expected_tool":None, "actual_tool":None,
     "confidence":0.8, "policy_evaluable":False, "error":"missing-oracle"},
]

def grade(case):
    if not 0 <= case["confidence"] <= 1:
        raise ValueError("confidence outside 0..1")
    correctness = None if case["oracle"] is None else case["answer"] == case["oracle"]
    tool_ok = None if case["expected_tool"] is None else case["actual_tool"] == case["expected_tool"]
    refusal_ok = case["refused"] == case["expected_refusal"]
    passed = refusal_ok if case["expected_refusal"] else (
        correctness is True and case["evidence_support"] is True and tool_ok is not False)
    return {"id":case["id"], "correct":correctness, "confidence":case["confidence"],
            "refused":case["refused"], "supported":case["evidence_support"],
            "tool_ok":tool_ok, "refusal_ok":refusal_ok, "passed":passed, "error":case["error"]}

grades = [grade(case) for case in cases]
scored_answers = [result for result in grades if result["correct"] is not None]
policy_cases = [(case,result) for case,result in zip(cases,grades) if case["policy_evaluable"]]
answered_policy = [result for case,result in policy_cases if not case["refused"]]
metrics = {
    "accuracy":round(sum(result["correct"] for result in scored_answers) / len(scored_answers),3),
    "coverage":round(len(answered_policy) / len(policy_cases),3),
    "selective_accuracy":round(sum(result["correct"] for result in answered_policy) / len(answered_policy),3),
    "refusal_rate":round(sum(case["refused"] for case,_ in policy_cases) / len(policy_cases),3),
    "unscored":sum(result["correct"] is None for result in grades),
}
if metrics != {"accuracy":0.667,"coverage":0.75,"selective_accuracy":0.667,
               "refusal_rate":0.25,"unscored":2}:
    raise RuntimeError("metric denominator changed")
if grades[1]["passed"] or not grades[3]["passed"] or grades[3]["correct"] is not None:
    raise RuntimeError("behavior gate failed")
print("cases", [(row["id"],row["correct"],row["supported"],row["tool_ok"],
                 row["confidence"],row["refused"],row["refusal_ok"],
                 row["passed"],row["error"]) for row in grades])
print("metrics", metrics)
for bad in [{**cases[0],"confidence":1.2}, {**cases[3],"refused":False}]:
    try:
        result = grade(bad)
        if bad["expected_refusal"] and not result["passed"]:
            raise ValueError("required refusal was not observed")
    except ValueError as error:
        print("rejected:", error)
    else:
        raise RuntimeError("invalid behavior accepted")
```

{% note success flat %}
精确个案输出依次保留 id、correctness、evidence support、tool result、confidence、refused、refusal check、passed 与 error type，因而每个结论都能回到对应证据字段。策略可评分分母为四条，其中三条作答、一条正确拒答，因此 `coverage=0.75`、`refusal_rate=0.25`；三条有答案 Oracle 的记录得到 `accuracy=selective_accuracy=0.667`，两条 correctness 为 Unknown。末尾依次拒绝越界置信度和漏掉必需拒答。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
cases [('fact', True, True, None, 0.8, False, True, True, None), ('calculation', False, False, True, 0.8, False, True, False, 'wrong-calculation'), ('reasoning', True, True, None, 0.8, False, True, True, None), ('insufficient', None, None, None, 0.2, True, True, True, None), ('unscored', None, None, None, 0.8, False, True, False, 'missing-oracle')]
metrics {'accuracy': 0.667, 'coverage': 0.75, 'selective_accuracy': 0.667, 'refusal_rate': 0.25, 'unscored': 2}
rejected: confidence outside 0..1
rejected: required refusal was not observed
```
{% endfolding %}

## 失败边界

{% note warning flat %}
把可见 CoT 当作真实内部过程；以输出长度衡量推理强弱；认为工具调用会消除幻觉；把拒答率高直接解释为校准良好。提示、可见理由、工具参数/结果和持久化轨迹都可能泄露个人数据或凭据，应最小化输入、脱敏、限制工具权限并设置保留期与访问控制；隐藏推理不能充当审计记录。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 答案 | 由独立 Oracle 判断 | 让模型自评 |
| 证据 | 逐条检查是否支持结论 | 只检查链接存在 |
| 稳健性 | 改变错误暗示与选项顺序 | 只跑一次 |

## 结果验证

{% note success flat %}
预期记录分别覆盖事实、计算、推导、拒答和无 Oracle 情况，并逐项输出 correctness、evidence support、tool result、refusal 与 error type。真实校准需要更多独立同分布样本、预声明分桶和置信区间。
{% endnote %}

- 最终答案由独立 Oracle 评分。
- 工具调用、返回值和最终答案分别验收。
- 置信度、拒答率、覆盖率和选择性准确率分别报告。

## 常见问题

{% flashcard basic id:foundation-reasoning-length deck:"AI 与大模型基础" priority:1 tags:"Reasoning与模型行为,基础机制" %}
--- question
输出更长是否代表推理更强？
--- answer
不代表；长度是表面行为，正确性、证据、稳健性和成本需要分别验证。
--- explanation
可见理由可能合理化错误答案，也可能遗漏内部计算。对同一任务分别保存答案、理由、工具结果和 Oracle：

| 观察 | 能支持 | 不能支持 |
| --- | --- | --- |
| 理由变长，Oracle 不变 | 输出长度增加 | 推理质量提高 |
| 工具成功，答案错误 | 工具调用可用 | 任务完成 |

只有独立得分、证据支持和稳健性一起改善，才有理由称行为更强。
{% endflashcard %}

{% flashcard basic id:foundation-confident-answer deck:"AI 与大模型基础" priority:2 tags:"Reasoning与模型行为,基础机制" %}
--- question
怎样验证模型的自信回答？
--- answer
拆成事实、证据和推导三层，使用独立来源或程序逐层复验。
--- explanation
语气不是置信度。验证流是：

1. 事实主张逐句匹配独立来源；
2. 计算结果用程序或测试复算；
3. 缺少条件时标 Unknown 或拒答；
4. 多样本按置信度分桶，比较经验正确率与区间。

单个“很确定”的答案既不能证明事实，也不能证明整体校准。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Models and API documentation, https://platform.openai.com/docs/models, https://developers.openai.com/favicon.png %}
{% link HELM, https://crfm.stanford.edu/helm/latest/, https://www.stanford.edu/favicon.ico %}
{% link Unfaithful Chain-of-Thought, https://arxiv.org/abs/2305.04388, https://arxiv.org/favicon.ico %}
{% endlinkgroup %}

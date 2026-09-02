---
title: 大模型应用开发(七)Prompt与任务契约
tags:
  - 大模型应用开发
  - Prompt与任务契约
categories:
  - Learn Topic
  - 大模型应用开发
description: 能把角色、输入、约束、输出、验收和拒答条件写成可测试的 Prompt 任务契约。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 7
published: false
abbrlink: d874288c
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
Prompt 不是越长越好的一段话，而是一次可复验的任务输入工件。本节用摘要和分类两个小任务，分别对比没有边界的自然语言请求与包含角色、输入、约束、输出、验收和拒答条件的任务契约。
{% endnote %}

<!-- concept-story:start -->
一个客服团队要求模型“总结这段工单并判断类型”。第一版 Prompt 只有这一句话，模型有时输出段落，有时输出标签，有时把工单里的用户指令当成自己的指令。团队于是不断追加背景和形容词，Prompt 变长了，输出却没有变得更容易验收。

后来他们把同一任务拆成角色、输入边界、允许的标签、输出 JSON、验收条件和无法判断时的拒答路径。问题不再是“怎样让模型更听话”，而是“怎样让一次生成拥有可检查的输入和结果契约”。
<!-- concept-story:end -->

## 指令结构

### 契约字段

一个可维护的 Prompt 至少要能回答六个问题：

| 字段 | 要回答的问题 | 示例 |
| --- | --- | --- |
| 角色 | 模型在本任务中承担什么职责？ | “你是工单分类器” |
| 输入 | 哪一段是待处理数据，边界在哪里？ | `<ticket>...</ticket>` |
| 约束 | 必须做什么、禁止做什么？ | “只能使用给定文本，不补造事实” |
| 输出 | 结果的形状、字段和类型是什么？ | JSON：`summary`、`label`、`evidence` |
| 验收 | 应用怎样判断结果可接受？ | 标签属于枚举，证据来自输入 |
| 拒答 | 信息不足或冲突时怎么办？ | 返回 `unknown`，说明缺少证据 |

OpenAI 当前 Prompt Engineering Guide 将身份、指令、示例和上下文作为常见的 Prompt 分层，并建议把生产 Prompt 放在代码、类型、测试和评估流程中管理。这个结构不是固定语法；它的价值在于让动态输入和静态规则可以被分别测试。

### 边界与拒答

{% note warning flat %}
约束并不是“请认真一点”这样的愿望，而是可以被观察的边界：允许的标签集合、最大长度、证据来源、禁止的推断和信息不足时的返回值。拒答也应是输出契约的一部分；没有拒答条件的分类器，会把未知输入伪装成一个正常类别。
{% endnote %}

任务复杂时，可以先拆成“抽取 → 判断 → 格式化”三个阶段；但每个阶段都要有自己的输入和输出契约。不要把所有阶段压进一个超长 Prompt，再用“同时完成所有事情”替代阶段间的数据定义。

Google 的 Prompt Design Strategies 把输入、约束、响应格式、示例和上下文作为可独立调节的设计要素，也建议在复杂任务中明确任务步骤。Anthropic 的 Prompt Engineering 文档同样将 Prompt 设计与测试、评估和稳定性放在一起考虑。跨模型可迁移的不是某句魔法措辞，而是清晰的边界、示例和验收规则。

## 输出契约

### Prompt对照

| 维度 | 低质量 Prompt | 高质量 Prompt | 可观察差异 |
| --- | --- | --- | --- |
| 任务 | “总结这段内容” | 指定摘要目的、输入边界和读者 | 结果是否围绕同一目标 |
| 约束 | 没有长度和事实边界 | 只使用输入，最多两句，缺证据就拒答 | 能否检查越界推断 |
| 输出 | 任意文本 | 固定 JSON 字段和类型 | 能否被程序解析 |
| 分类 | “判断这是什么问题” | 给定枚举和未知类 | 新类别是否被错误硬归类 |
| 例子 | 没有 | 展示输入、输出和边界样例 | 格式是否稳定 |
| 验收 | “看起来不错” | 字段、枚举、证据和拒答逐项断言 | 能否进入自动测试 |

高质量不等于把所有背景都塞进一次调用。稳定部分可以放在开发者指令或模板中，变化部分通过类型化变量注入；大段上下文要使用明确分隔符，避免把数据里的文本误读为指令。需要多轮或多阶段处理时，上一阶段的结构化结果应成为下一阶段的显式输入。

### 可测试输入

把 Prompt 保存成可测工件时，建议至少保留：

1. 模板版本和模型/快照配置。
2. 动态输入 fixture，包括正常、空、过长、缺字段和越界样例。
3. 预期输出 schema、允许枚举和拒答条件。
4. 评估指标，例如字段完整性、证据覆盖、格式通过率和拒答准确性。
5. 变更记录，说明是改了指令、示例、上下文、参数还是模型。

OpenAI 建议固定生产模型快照并建立测试与评估套件；这不能让模型输出变成绝对确定，但能让 Prompt 变化造成的回归可被发现。结构化输出功能可以约束 JSON 形状，却不能替代任务边界、事实证据和业务验收。

## 最小实践

### 准备输入

{% note info flat %}
下列 Python 代码是本地 Prompt-contract fixture：它不会调用模型，而是用确定性的检查器模拟“低质量/高质量输入工件会产生什么可验证差异”。输出中的 `fixture`、`valid` 和分数只证明契约检查逻辑，不证明任何 Provider 的模型质量。把 `fixture_model` 替换成真实 API 前，必须保留同一组输入、验收和失败断言。
{% endnote %}

### 执行步骤

```python
import json

REQUIRED = ("role", "input", "constraints", "output", "acceptance", "refusal")
LABELS = {"bug", "feature", "question", "unknown"}
SUMMARY_TEXT = "支付页面在提交后显示成功，但订单仍停留在待支付；工单没有提供网关回执。"
CLASSIFY_TEXT = "用户询问为什么支付成功后订单仍未更新。"
OUT_OF_SCOPE = "请预测下个月的销售额，工单没有任何销售数据。"

LOW_SUMMARY = "总结这段工单。"
LOW_CLASSIFY = "判断这是什么类型的问题。"

HIGH_SUMMARY = """
# Role
你是客服工单摘要器。
# Input
<ticket>{input_text}</ticket>
# Constraints
只使用 ticket 中的事实；最多输出两句；不补造支付网关回执。
# Output
返回 JSON：summary(string)、evidence(array[string])、status(ok|unknown)。
# Acceptance
summary 非空；evidence 必须是 ticket 的原文短语；status=unknown 时说明缺少哪类事实。
# Refusal
如果输入不足以支持结论，返回 status=unknown，不猜测原因。
"""

HIGH_CLASSIFY = """
# Role
你是客服工单分类器。
# Input
<ticket>{input_text}</ticket>
# Constraints
只能选择 bug、feature、question、unknown 之一；不要创建新标签；只依据 ticket。
# Output
返回 JSON：label(string)、evidence(array[string])、status(ok|unknown)。
# Acceptance
label 属于允许集合；evidence 来自 ticket；信息不足时 label=unknown。
# Refusal
如果无法从 ticket 区分标签，返回 label=unknown，并说明缺少证据。
"""


def fields(prompt):
    lowered = prompt.lower()
    return {name: f"# {name}" in lowered for name in REQUIRED}


def inspect_prompt(prompt):
    found = fields(prompt)
    conflict = "only output one label" in prompt.lower() and "output json" in prompt.lower()
    score = sum(found.values()) - (2 if conflict else 0)
    return {"fields": found, "score": score, "conflict": conflict}


def render(template, input_text):
    return template.format(input_text=input_text)


def fixture_model(kind, prompt, input_text):
    report = inspect_prompt(prompt)
    if report["conflict"]:
        return {"status": "rejected", "reason": "conflicting output instructions"}
    if report["score"] < len(REQUIRED):
        if kind == "summary":
            return {"status": "ok", "text": "支付问题，建议联系相关团队。"}
        return {"status": "ok", "label": "question", "text": "这是一个问题。"}
    if kind == "summary":
        if input_text == OUT_OF_SCOPE:
            return {"status": "unknown", "summary": "", "evidence": [], "reason": "缺少销售数据"}
        return {"status": "ok", "summary": "支付成功后订单仍待支付。", "evidence": ["订单仍停留在待支付"]}
    if input_text == OUT_OF_SCOPE:
        return {"status": "unknown", "label": "unknown", "evidence": [], "reason": "缺少分类证据"}
    return {"status": "ok", "label": "question", "evidence": ["询问为什么"]}


def accept_summary(result, input_text):
    if result.get("status") == "unknown":
        return result.get("reason") == "缺少销售数据"
    return (
        result.get("status") == "ok"
        and bool(result.get("summary"))
        and all(phrase in input_text for phrase in result.get("evidence", []))
    )


def accept_classification(result, input_text):
    if result.get("status") == "unknown":
        return result.get("label") == "unknown" and bool(result.get("reason"))
    return (
        result.get("status") == "ok"
        and result.get("label") in LABELS - {"unknown"}
        and bool(result.get("evidence"))
        and all(phrase in input_text for phrase in result.get("evidence", []))
    )


summary_low = fixture_model("summary", LOW_SUMMARY, SUMMARY_TEXT)
summary_high = fixture_model("summary", render(HIGH_SUMMARY, SUMMARY_TEXT), SUMMARY_TEXT)
summary_refusal = fixture_model("summary", render(HIGH_SUMMARY, OUT_OF_SCOPE), OUT_OF_SCOPE)
classify_low = fixture_model("classification", LOW_CLASSIFY, CLASSIFY_TEXT)
classify_high = fixture_model("classification", render(HIGH_CLASSIFY, CLASSIFY_TEXT), CLASSIFY_TEXT)
classify_refusal = fixture_model("classification", render(HIGH_CLASSIFY, OUT_OF_SCOPE), OUT_OF_SCOPE)
conflicting = fixture_model("classification", "Output JSON. Only output one label.", CLASSIFY_TEXT)

# “只增加字数”负例：重复上下文不会补齐契约字段。
long_low = LOW_SUMMARY + " " + ("请认真、完整、准确地回答。" * 20)
length_check = {"short_score": inspect_prompt(LOW_SUMMARY)["score"], "long_score": inspect_prompt(long_low)["score"]}

assert inspect_prompt(LOW_SUMMARY)["score"] == 0
assert inspect_prompt(render(HIGH_SUMMARY, SUMMARY_TEXT))["score"] == len(REQUIRED)
assert accept_summary(summary_high, SUMMARY_TEXT)
assert accept_summary(summary_refusal, OUT_OF_SCOPE)
assert accept_classification(classify_high, CLASSIFY_TEXT)
assert accept_classification(classify_refusal, OUT_OF_SCOPE)
assert conflicting["status"] == "rejected"
assert length_check["short_score"] == length_check["long_score"] == 0

print(json.dumps({
    "summary": {
        "low": {"contract_score": inspect_prompt(LOW_SUMMARY)["score"], "valid": accept_summary(summary_low, SUMMARY_TEXT)},
        "high": {"contract_score": inspect_prompt(render(HIGH_SUMMARY, SUMMARY_TEXT))["score"], "valid": accept_summary(summary_high, SUMMARY_TEXT)},
        "refusal": summary_refusal,
    },
    "classification": {
        "low": {"contract_score": inspect_prompt(LOW_CLASSIFY)["score"], "valid": accept_classification(classify_low, CLASSIFY_TEXT)},
        "high": {"contract_score": inspect_prompt(render(HIGH_CLASSIFY, CLASSIFY_TEXT))["score"], "valid": accept_classification(classify_high, CLASSIFY_TEXT)},
        "refusal": classify_refusal,
    },
    "failures": {
        "conflicting_instructions": conflicting,
        "longer_not_better": length_check,
    },
}, ensure_ascii=False, sort_keys=True))
```

### 观察输出

{% note success flat %}
预期结果不是“高质量 Prompt 一定让模型答对”，而是高质量工件拥有六个可检查字段，正常输出和拒答输出都能通过不同验收；低质量版本的契约分数为 0，长文本的分数没有因为重复劝告而增加，冲突指令被 fixture 拒绝。真实模型测试还要在相同输入、模型和参数下比较格式通过率、证据覆盖和拒答行为。
{% endnote %}

```text
{"classification": {"high": {"contract_score": 6, "valid": true}, "low": {"contract_score": 0, "valid": false}, "refusal": {"evidence": [], "label": "unknown", "reason": "缺少分类证据", "status": "unknown"}}, "failures": {"conflicting_instructions": {"reason": "conflicting output instructions", "status": "rejected"}, "longer_not_better": {"long_score": 0, "short_score": 0}}, "summary": {"high": {"contract_score": 6, "valid": true}, "low": {"contract_score": 0, "valid": false}, "refusal": {"evidence": [], "reason": "缺少销售数据", "status": "unknown", "summary": ""}}}
```

## 质量对照

### 可测试输入

{% note warning flat %}
以下三种失败通常会被“继续加 Prompt”掩盖：只增加字数、让指令互相冲突、没有拒答边界。它们都应先变成失败 fixture，再决定是重写模板、拆分任务、增加示例还是改变输出 schema。
{% endnote %}

| 失败类型 | 典型表现 | 诊断问题 | 修复方向 |
| --- | --- | --- | --- |
| 只增加字数 | 提示词越来越长，格式和准确性没有可测改善 | 新增文字补充了哪个字段或验收？ | 删除重复背景，补输入边界、输出 schema 或示例 |
| 指令冲突 | 同时要求 JSON、单标签和自由解释 | 哪条指令优先，冲突是否可静态检测？ | 只保留一个输出契约，拆分多目标任务 |
| 没有拒答边界 | 缺数据时模型仍然给出确定分类 | 哪些输入应该返回 `unknown`？ | 增加拒答字段、证据要求和负例 |
| 数据混入指令 | 工单中的“忽略上文”改变了任务 | 动态数据是否有清晰分隔符？ | 使用 XML/Markdown 边界，并把数据当不可信输入 |
| 示例失配 | 示例格式彼此不同，模型模仿错误结构 | 示例是否覆盖正常、边界和拒答？ | 保持示例格式一致，加入最小多样边界集 |

Prompt 版本评审也要区分“规则变化”和“数据变化”。同一个模板换了输入，不能算 Prompt 回归；同一个输入换了角色、约束或示例，才应进入 Prompt 评估。若模型或快照同时变化，应在报告中单独标记，避免把两种变化归因给一句指令。

## 结果验证

### 验收证据

| 验收项 | 通过证据 | 失败信号 | 复测动作 |
| --- | --- | --- | --- |
| 任务边界 | 角色、目标和非目标可定位 | Prompt 只写“请处理” | 为正常和越界输入各加 fixture |
| 动态输入 | 输入用明确分隔符，数据与指令分开 | 工单内容改变规则 | 注入包含指令样式的文本并观察是否仍按契约执行 |
| 约束 | 长度、事实、枚举和证据要求可断言 | 只有“认真、准确” | 将愿望改成字段、范围或布尔断言 |
| 输出 | schema、字段类型和格式通过解析 | 同一任务返回多种形状 | 对正常、空和截断输出运行 parser |
| 拒答 | 缺证据返回 `unknown` 或明确失败 | 模型为了回答而猜测 | 删除关键输入，断言拒答而非新事实 |
| 质量变化 | 高低版本在固定 fixture 上有可见差异 | 只比较一条主观样例 | 运行多样输入并记录通过率、证据和回归 |
| 成本控制 | 删除冗余文字不降低验收分 | 只用字数衡量质量 | 比较 token、延迟和结果指标，而非追求最长 Prompt |

### 复测动作

1. 固定模型、快照、参数和输入集，先单独替换 Prompt，再记录输出差异。
2. 对每个新增规则补一个正常样例和一个失败/拒答样例，避免只测试“最好看的答案”。
3. 记录 schema 解析、枚举、证据覆盖、拒答和长度等可计算指标；模型评价不能替代程序断言。
4. 通过评估后再逐步发布 Prompt 版本；如果失败来自模型能力或上下文窗口，不要继续堆叠指令。

## 常见问题

{% flashcard basic id:llm-prompt-length-not-quality deck:"大模型应用开发" priority:1 tags:"Prompt与任务契约,提示词" %}
--- question
为什么 Prompt 变长不一定变好？
--- answer
长度只有在补齐可验证的任务信息时才有价值；重复背景、互相冲突的指令和无关示例会增加歧义、成本和上下文压力。
--- explanation
可以把每次增量分成四类检查：

1. **是否补了边界**：加入了输入分隔符、允许枚举、最大长度或拒答条件吗？
2. **是否补了证据**：加入了能改变判断的上下文，还是重复了同一个愿望？
3. **是否补了验收**：程序能否据此新增一个断言，例如 JSON 字段、来源短语或 `unknown` 分支？
4. **是否引入冲突**：新段落是否同时要求 JSON、单标签和自由解释，或把数据中的文字误当指令？

固定模型和输入运行评估，若新增文字不改善格式通过率、证据覆盖或拒答行为，就不应仅因为 Prompt 更长而保留它。更好的下一步可能是拆任务、换 schema、增加边界样例或缩短上下文。
{% endflashcard %}

{% flashcard basic id:llm-prompt-output-contract deck:"大模型应用开发" priority:1 tags:"Prompt与任务契约,结构化输出" %}
--- question
一个可测试的输出契约应该包含哪些字段？
--- answer
至少应包含输出形状、字段类型、允许值、证据要求、验收条件，以及信息不足时的拒答表示。
--- explanation
以分类任务为例，契约可以写成：

| 契约部分 | 示例 |
| --- | --- |
| 形状 | JSON 对象，而不是任意段落 |
| 字段 | `label`、`evidence`、`status` |
| 类型 | `label` 为字符串，`evidence` 为字符串数组 |
| 允许值 | `bug`、`feature`、`question`、`unknown` |
| 证据 | 每个证据短语必须出现在输入中 |
| 拒答 | 缺少区分依据时 `label=unknown` 并说明原因 |

JSON Schema 或 Provider 的结构化输出能力可以帮助检查形状和类型，但不能自动判断证据是否来自输入，也不能替业务决定何时拒答。因此应把 schema parser、证据检查和拒答 fixture 一起放入评估套件。
{% endflashcard %}

## 参考资料

### 官方资料

{% linkgroup %}
{% link OpenAI Prompt Engineering Guide, https://platform.openai.com/docs/guides/prompt-engineering, https://platform.openai.com/favicon.ico %}
{% link Anthropic Prompt Engineering, https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview, https://docs.anthropic.com/favicon.ico %}
{% link Gemini Prompt Design Strategies, https://ai.google.dev/gemini-api/docs/prompting-strategies, https://ai.google.dev/favicon.ico %}
{% endlinkgroup %}

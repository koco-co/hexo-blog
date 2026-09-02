---
title: AI 与大模型基础(五)Attention与Context
tags:
  - AI 与大模型基础
  - Attention与Context
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能解释注意力、上下文窗口、KV Cache 和长上下文退化。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 5
published: false
abbrlink: 448fb4c0
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：区分注意力路由、位置支持范围、请求预算、长文本利用率与 KV Cache，并用带出处的合成证据观察不同压缩策略丢失了什么。
{% endnote %}

## 机制模型

{% note info flat %}
每个位置的表示经学习矩阵投影为 Query、Key、Value。`softmax((QKᵀ/√dₖ)+M)V` 先用 Q/K 计算路由分数，因果遮罩 `M` 屏蔽未来位置，再按权重聚合 V；高权重只是数值路由结果，不证明意图、真相或理解。
{% endnote %}

{% mermaid %}
flowchart TD
  X[位置表示] --> Q[Query]
  X --> K[Key]
  X --> V[Value]
  Q --> S[QKᵀ / √dₖ]
  K --> S
  S --> M[因果遮罩与 softmax]
  M --> W[权重 × Value]
  V --> W
{% endmermaid %}

{% note primary flat %}
上下文窗口是请求容量，不是稳定利用承诺。一次请求通常满足 `系统 token + 输入 token + 工具定义 + 预留输出 token ≤ 请求可用窗口`。位置支持范围则由位置编码/旋转位置参数、训练长度与推理实现共同限定；供应商接受更长请求，不等于 checkpoint 在该范围内都经过训练或具有相同质量。验证时要同时固定模型快照、配置中的位置参数、服务端窗口说明和位置轮换实验。
{% endnote %}

{% mermaid %}
flowchart TD
  P[请求内容] --> B{预算内?}
  B -->|否| T[截断/摘要/检索]
  T --> B
  B -->|是| F[Prefill]
  F --> K[逐层 KV Cache]
  K --> D[当前 Query 读取历史 K/V]
  D --> L[logits 与下一 Token]
  L -->|追加新 K/V| K
{% endmermaid %}

{% note info flat %}
标准全注意力的 prefill 分数矩阵随序列长度呈二次增长；逐步 decode 会读取增长中的历史缓存。KV Cache 避免重复计算旧 K/V，但内存近似随批大小、层数、序列长度、KV head 数、head dimension 与字节精度相乘增长。滑动窗口、稀疏注意力、MQA/GQA 会改变常数或关系，必须按具体实现核验；正常追加新 Token 正是缓存复用路径，只有已缓存前缀被改写，或模型权重、位置 ID/缩放、缓存布局等影响历史 K/V 的状态不兼容时，旧缓存才不能直接复用。
{% endnote %}

| 对象 | 机制或证据 | 不能推出 |
| --- | --- | --- |
| 窗口 | 输入与输出 token 容量 | 不等于全部信息都被稳定利用 |
| KV Cache | 复用历史 K/V；内存随层数和序列增长 | 缓存免费或消除历史注意力读取成本 |
| 截断 | 直接删除一部分输入 | 可预测但信息损失明显 |
| 摘要 | 压缩为较短表示 | 可能丢数字、否定和出处 |
| 检索 | 按查询选择片段 | 召回失败时证据根本不进入上下文 |

## 核心边界

{% note info flat %}
对同一组带编号片段运行 head、tail、带出处摘要和关键词检索四种预算策略，逐项打印合成成本、保留与丢失内容；这只验证信息损失，不冒充模型长上下文测试。
{% endnote %}

{% folding purple, 展开机制辨析 %}
上下文窗口是输入与输出的容量合同，不是稳定记忆承诺。Prefill 计算整段提示；decode 逐 Token 生成。KV Cache 避免重复投影历史 Key/Value，却不会让缓存免费，也不能修复“中间信息难利用”。当文档只给请求窗口、没有公开训练长度或位置配置时，把后两项记录为 Unknown，并通过位置轮换实测，不把窗口数字代填。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
chunks = [
    {"id":"A", "cost":2, "facts":{"refund":"7 days"}},
    {"id":"B", "cost":2, "facts":{"release":"2026-Q1"}},
    {"id":"C", "cost":2, "facts":{"safety":"manual approval"}},
    {"id":"D", "cost":2, "facts":{"contact":"support@example.invalid"}},
]
budget = 4  # 合成成本单位，不是任何模型的真实 Token 数。
original_cost = sum(item["cost"] for item in chunks)

def take(items):
    # head 截断只保留连续前缀；首个放不下的片段就是边界。
    kept, used = [], 0
    for item in items:
        if used + item["cost"] > budget:
            break
        kept.append(item)
        used += item["cost"]
    return kept

def take_tail(items):
    # 先从尾部选择，再恢复原始文档顺序。
    return list(reversed(take(list(reversed(items)))))

def summarize(items):
    return [{"id":"S", "cost":4, "facts":{"refund":"7 days", "safety":"manual approval"},
             "provenance":{"refund":"A", "safety":"C"}}]

def retrieve(items, keys):
    return take([item for item in items if set(item["facts"]) & set(keys)])

def validate_summary(kept):
    source_by_id = {item["id"]:item for item in chunks}
    for item in kept:
        facts, provenance = item["facts"], item.get("provenance", {})
        if set(facts) != set(provenance):
            raise ValueError("summary fact lacks provenance")
        for key, value in facts.items():
            source_id = provenance[key]
            if source_id not in source_by_id:
                raise ValueError("summary provenance is unknown")
            if source_by_id[source_id]["facts"].get(key) != value:
                raise ValueError("summary fact mismatches source")


def evidence_record(name, kept):
    if name == "summary":
        validate_summary(kept)
        retained = list(kept[0]["provenance"].values())
    else:
        retained = [item["id"] for item in kept]
    lost = [item["id"] for item in chunks if item["id"] not in retained]
    return {"retained":retained, "lost":lost, "original_cost":original_cost,
            "used_cost":sum(item["cost"] for item in kept)}

strategies = {"head":take(chunks), "tail":take_tail(chunks),
              "summary":summarize(chunks), "retrieve":retrieve(chunks, ["safety","refund"])}
records = {name:evidence_record(name, kept) for name, kept in strategies.items()}
expected = {
    "head":{"retained":["A","B"],"lost":["C","D"],"original_cost":8,"used_cost":4},
    "tail":{"retained":["C","D"],"lost":["A","B"],"original_cost":8,"used_cost":4},
    "summary":{"retained":["A","C"],"lost":["B","D"],"original_cost":8,"used_cost":4},
    "retrieve":{"retained":["A","C"],"lost":["B","D"],"original_cost":8,"used_cost":4},
}
if records != expected:
    raise RuntimeError("strategy evidence changed")
for name, record in records.items():
    print(name, record)
missing = retrieve(chunks, ["missing"])
if missing:
    raise RuntimeError("empty retrieval should stay empty")
print("retrieve-missing", {"retained":[], "used_cost":0})
leading = [{"id":"oversize", "cost":5, "facts":{"x":"y"}}, chunks[0]]
if take(leading):
    raise RuntimeError("head skipped an oversized leading chunk")
print("head-oversize", {"retained":[]})
try:
    if not take([{"id":"oversize", "cost":5, "facts":{"x":"y"}}]):
        raise ValueError("no evidence fits budget")
except ValueError as error:
    print("rejected:", error)
else:
    raise RuntimeError("oversize evidence accepted")
summary_negative_cases = [
    [{"id":"S", "cost":4, "facts":{"refund":"7 days"}, "provenance":{}}],
    [{"id":"S", "cost":4, "facts":{"refund":"7 days"},
      "provenance":{"refund":"missing"}}],
    [{"id":"S", "cost":4, "facts":{"refund":"30 days"},
      "provenance":{"refund":"A"}}],
]
for bad in summary_negative_cases:
    try:
        validate_summary(bad)
    except ValueError as error:
        print("rejected:", error)
    else:
        raise RuntimeError("unfaithful summary accepted")
```

{% note success flat %}
精确输出中，连续 `head` 保留 A/B，连续 `tail` 按原顺序保留 C/D，`summary` 与 `retrieve` 保留 A/C；四行均显示 `original_cost: 8`、`used_cost: 4`。空检索和超大首片段都保留空集，后者证明 head 不会跳过边界再装入后续片段。摘要还会依次拒绝缺失出处、未知来源和与来源事实不一致的值。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
head {'retained': ['A', 'B'], 'lost': ['C', 'D'], 'original_cost': 8, 'used_cost': 4}
tail {'retained': ['C', 'D'], 'lost': ['A', 'B'], 'original_cost': 8, 'used_cost': 4}
summary {'retained': ['A', 'C'], 'lost': ['B', 'D'], 'original_cost': 8, 'used_cost': 4}
retrieve {'retained': ['A', 'C'], 'lost': ['B', 'D'], 'original_cost': 8, 'used_cost': 4}
retrieve-missing {'retained': [], 'used_cost': 0}
head-oversize {'retained': []}
rejected: no evidence fits budget
rejected: summary fact lacks provenance
rejected: summary provenance is unknown
rejected: summary fact mismatches source
```
{% endfolding %}

## 失败边界

{% note warning flat %}
把 128k 等窗口数字理解为 128k 内容都能可靠使用；说 KV Cache 降低了窗口长度；把摘要称为无损压缩，或把检索称为必然优于全文。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 预算 | 输入、输出、系统开销均计入 | 只统计正文字符 |
| 损失 | 列出每种策略丢失内容 | 只报告压缩后长度 |
| 模型结论 | 真实结论需固定模型并重复测试 | 用字符串 fixture 推断模型能力 |

## 结果验证

{% note success flat %}
预期输出应为每种策略列出可追溯的 retained/lost 来源 ID，证明 head/tail 只截取连续边界，并确认空检索、超预算输入、缺失或未知出处和事实不一致摘要都会可观察失败。真实长上下文评测还要固定模型快照、位置配置与提示，把同一证据轮换到开头、中间和末尾后重复运行。
{% endnote %}

- 请求预算明确预留输出与工具定义。
- 每种策略列出丢失的证据与出处。
- 缓存验证绑定模型、前缀、位置和 KV head 结构。

## 常见问题

{% flashcard basic id:foundation-context-window deck:"AI 与大模型基础" priority:1 tags:"Attention与Context,基础机制" %}
--- question
上下文窗口大是否等于能稳定使用全部上下文？
--- answer
不等于；窗口只给容量上限，信息位置、任务、提示和模型都会影响利用率。
--- explanation
把同一关键事实分别放在开头、中间、末尾，固定模型快照、提示和采样参数后重复运行，并分别统计引用与答案。容量测试只确认请求被接受；位置对照才观察利用差异，单次成功不能证明整个窗口可靠。
{% endflashcard %}

{% flashcard basic id:foundation-kv-cache deck:"AI 与大模型基础" priority:2 tags:"Attention与Context,基础机制" %}
--- question
KV Cache 解决了什么问题？
--- answer
它复用历史 token 的 Key/Value，减少增量解码中的重复投影计算。
--- explanation
粗略关系是 `batch × layers × sequence × 2(K/V) × kv_heads × head_dim × bytes`。MHA、GQA、MQA 的 `kv_heads` 不同；正常追加 Token 会复用缓存，改写已缓存前缀或切换不兼容的权重、位置参数、位置 ID 或缓存布局才会使旧缓存失效。缓存减少旧 K/V 重算，但不消除读取历史位置的成本。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Attention Is All You Need, https://arxiv.org/abs/1706.03762v1, https://arxiv.org/favicon.ico %}
{% link Lost in the Middle, https://aclanthology.org/2024.tacl-1.9/, https://aclanthology.org/aclicon.ico %}
{% link OpenAI Models and API documentation, https://platform.openai.com/docs/models, https://developers.openai.com/favicon.png %}
{% link RoFormer, https://arxiv.org/abs/2104.09864v5, https://arxiv.org/favicon.ico %}
{% link Grouped-Query Attention, https://arxiv.org/abs/2305.13245v3, https://arxiv.org/favicon.ico %}
{% link vLLM and PagedAttention, https://arxiv.org/abs/2309.06180v1, https://arxiv.org/favicon.ico %}
{% endlinkgroup %}

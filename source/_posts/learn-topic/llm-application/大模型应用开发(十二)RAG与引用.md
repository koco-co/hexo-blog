---
title: 大模型应用开发(十二)RAG与引用
tags:
  - 大模型应用开发
  - RAG与引用
categories:
  - Learn Topic
  - 大模型应用开发
description: 能完成文档切分、向量检索、重排、上下文拼装和版本化引用，并拒绝无证据或冲突答案。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 12
published: false
abbrlink: a4a1c0e
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
RAG 不是把文档塞进 Prompt 就结束了。一个可验收的链路要知道文档版本、Chunk 边界、向量/关键词得分、重排结果、上下文权限和引用位置；无结果、冲突或过期证据时，应拒绝硬答。本节使用本地 Markdown 和标准库向量计算完成一个小型 fixture。
{% endnote %}

<!-- concept-story:start -->
一个客服助手回答“未发货能不能退款”时，检索到了去年的政策和本月的公告。两段文字都很像，模型把它们拼到同一个上下文里，给出了一个没有版本号的肯定答案。后来业务规则改变，缓存仍然返回旧引用，客服只能从一条自然语言回复猜测它依据了哪份文件。

团队把知识条目当成带版本的证据，把检索当成候选生成，把重排当成排序而不是裁决；最终答案必须带回可定位的 Chunk。没有证据、证据冲突或证据过期时，系统宁可返回待确认，也不把“相关”伪装成“正确”。
<!-- concept-story:end -->

## 知识入库

### 知识入库和版本

入库阶段要保存“可检索”之外的元数据：

| 元数据 | 作用 | 缺失后的风险 |
| --- | --- | --- |
| `doc_id` | 识别业务文档 | 无法回溯原文 |
| `version` | 判断新旧规则 | 过期文档继续命中 |
| `valid_from/valid_to` | 约束生效时间 | 时间边界混入上下文 |
| `status` | `active`、`superseded`、`deleted` | 删除后仍引用旧证据 |
| `tenant/access` | 过滤可见范围 | 跨租户泄露 |
| `chunk_id` | 定位片段 | 引用只能指向整篇文档 |
| `content_hash` | 绑定实际字节 | 同名内容被替换后无法发现 |

切分不是越短越好：Chunk 太短会丢失条件和指代，太长会降低召回精度并挤占上下文。切分后应保留标题、段落顺序、文档版本和相邻关系；对法律、价格、权限等规则，还要保留生效条件和否定句。

### 检索链路

```text
Markdown / 文件
      │ 解析、清洗、版本化
      ▼
Chunk + metadata ──> Embedding / keyword vector
      │                         │
      └──────── candidate hits ◄┘
                    │ 分数、时间、权限、重排
                    ▼
          Context + citation map
                    │
                    ▼
             grounded answer
```

Embedding 负责把文本映射到可比较的向量空间；检索只产生候选，不替代事实判断。重排可以结合关键词、版本、权限、时间和业务优先级，但不能把低分或冲突证据“排”成事实。生产环境的 Embedding 模型、维度、距离函数和批处理策略要固定并评估；本文的标准库向量仅用于验证链路。

## 检索与引用

### 上下文拼装与引用定位

上下文拼装应是一个带记录的纯步骤：

1. 按租户、用户、时间和文档状态过滤候选。
2. 计算向量/关键词相关性，保留得分和检索参数。
3. 依据版本、生效时间和业务优先级重排。
4. 为每个 Chunk 分配稳定引用 ID，并限制总预算。
5. 将 Chunk 文本和引用映射一起交给生成步骤。
6. 逐条检查答案主张是否能定位到引用，而不是只检查“引用数组非空”。

引用最好落到 `doc_id + version + chunk_id`，必要时再加页码、段落或字符区间。只引用一个文档标题无法证明答案来自哪一句；只保存向量 ID 又无法在文档更新或删除后重建证据。

### 失败处理

{% note warning flat %}
无结果不是“召回不够就让模型凭常识回答”；冲突不是“选分数最高的那条”；过期引用也不是“只要文字相似就继续用”。三种情况都要产生显式状态，并告诉调用方是补充查询、请求人工确认，还是重新建立索引。
{% endnote %}

| 情况 | 判定 | 安全动作 |
| --- | --- | --- |
| 无结果 | 没有达到阈值的可用 Chunk | 返回 `no_evidence`，不生成事实答案 |
| 冲突 | 同一业务主张有互斥的有效值 | 返回 `conflict`，展示版本并转人工/规则裁决 |
| 过期 | 命中 Chunk 已被替代、删除或超出有效期 | 返回 `stale_evidence`，刷新索引 |
| 权限不足 | Chunk 存在但当前 actor 不可见 | 返回 `forbidden`，不泄露文档存在性 |
| 引用缺失 | 答案主张没有对应 Chunk | 返回 `ungrounded`，拒绝采纳 |

## 答案校验

### 失败处理

答案校验不应由另一次自由生成完成，而要使用可计算规则：

| 校验 | 问题 | 失败动作 |
| --- | --- | --- |
| 覆盖 | 每个关键主张是否有 citation？ | 标记 `ungrounded` |
| 定位 | citation 是否能回到版本化 Chunk？ | 标记 `invalid_citation` |
| 新鲜度 | Chunk 是否 active 且在生效窗口？ | 标记 `stale_evidence` |
| 一致性 | 同一主张是否出现互斥值？ | 标记 `conflict` |
| 权限 | 引用是否属于当前 actor 可见范围？ | 标记 `forbidden` |
| 形式 | 答案是否符合输出契约、长度和语言要求？ | 重新生成或降级 |

引用提高可追溯性，但不自动保证答案正确。对高风险业务，要将引用与规则引擎、人工复核或原文对照结合；对无证据问题，明确返回“当前资料无法确认”比补充一个看似合理的常识更可靠。

## 最小实践

### 准备输入

{% note info flat %}
下面的 Python 代码在临时目录写入三份合成 Markdown：当前政策、已过期政策和冲突公告。它使用标准库实现粗略字符向量与余弦相似度，不调用 Embedding API、不访问网络、不读取环境变量。文档内容、版本、状态和引用 ID 都是 fixture；通过只证明 RAG 的检索/证据状态机可运行。
{% endnote %}

### 执行步骤

```python
import hashlib
import json
import math
import re
import tempfile
from collections import Counter
from pathlib import Path

DOCS = [
    {
        "doc_id": "refund-policy",
        "version": "2026-08",
        "status": "active",
        "policy_key": "refund_unshipped",
        "value": "allowed",
        "name": "refund-policy.md",
        "text": "# 退款政策\n\n未发货订单可以申请退款，金额变更必须人工确认。\n",
    },
    {
        "doc_id": "refund-policy",
        "version": "2025-01",
        "status": "superseded",
        "policy_key": "refund_unshipped",
        "value": "denied",
        "name": "refund-policy-old.md",
        "text": "# 旧退款政策\n\n未发货订单不能直接退款。\n",
    },
    {
        "doc_id": "refund-notice",
        "version": "2026-09",
        "status": "active",
        "policy_key": "refund_unshipped",
        "value": "denied",
        "name": "refund-notice.md",
        "text": "# 临时退款公告\n\n未发货订单暂不允许退款，等待财务确认。\n",
    },
]
QUERY = "未发货 退款"


def tokens(text):
    return re.findall(r"[A-Za-z0-9]+|[\u4e00-\u9fff]", text.lower())


def vector(text):
    return Counter(tokens(text))


def cosine(left, right):
    common = set(left) & set(right)
    numerator = sum(left[key] * right[key] for key in common)
    denominator = math.sqrt(sum(value * value for value in left.values())) * math.sqrt(sum(value * value for value in right.values()))
    return numerator / denominator if denominator else 0.0


def write_documents(root):
    paths = {}
    for doc in DOCS:
        path = root / doc["name"]
        path.write_text(doc["text"], encoding="utf-8")
        paths[(doc["doc_id"], doc["version"])] = path
    return paths


def ingest(doc, path):
    raw = path.read_bytes()
    content_hash = hashlib.sha256(raw).hexdigest()
    blocks = [block.strip() for block in path.read_text(encoding="utf-8").split("\n\n") if block.strip() and not block.startswith("#")]
    return [
        {
            "citation": f"{doc['doc_id']}:{doc['version']}:chunk-{index}",
            "doc_id": doc["doc_id"],
            "version": doc["version"],
            "status": doc["status"],
            "policy_key": doc["policy_key"],
            "value": doc["value"],
            "text": block,
            "content_hash": content_hash,
        }
        for index, block in enumerate(blocks, 1)
    ]


def retrieve(query, index, version=None, include_stale=False):
    query_vector = vector(query)
    candidates = []
    for chunk in index:
        if version is not None and chunk["version"] != version:
            continue
        if not include_stale and chunk["status"] != "active":
            continue
        score = cosine(query_vector, vector(chunk["text"]))
        if score > 0:
            candidates.append((score, chunk))
    # 分数相同再按版本排序，结果仍保留原始 Chunk 和 metadata。
    return [chunk for _, chunk in sorted(candidates, key=lambda item: (item[0], item[1]["version"]), reverse=True)]


def grounded_answer(query, index, version=None, include_stale=False):
    hits = retrieve(query, index, version, include_stale)
    if not hits:
        return {"status": "no_evidence", "answer": "当前资料无法确认。", "citations": [], "claims": []}
    if any(hit["status"] != "active" for hit in hits):
        return {"status": "stale_evidence", "answer": "资料已过期，需刷新索引。", "citations": [], "claims": []}
    values = {hit["value"] for hit in hits if hit["policy_key"] == "refund_unshipped"}
    if len(values) > 1:
        return {"status": "conflict", "answer": "有效资料存在冲突，需人工确认。", "citations": [hit["citation"] for hit in hits], "claims": []}
    allowed = "allowed" in values
    citation = hits[0]["citation"]
    claim = {"text": "未发货订单可以申请退款。" if allowed else "未发货订单不能直接退款。", "citations": [citation]}
    return {"status": "grounded", "answer": claim["text"], "citations": [citation], "claims": [claim]}


def validate_answer(result, index):
    lookup = {chunk["citation"]: chunk for chunk in index}
    for claim in result["claims"]:
        for citation in claim["citations"]:
            chunk = lookup.get(citation)
            if chunk is None or chunk["status"] != "active" or claim["text"] not in {"未发货订单可以申请退款。", "未发货订单不能直接退款。"}:
                return False
    return result["status"] == "grounded" and bool(result["claims"])


def summarize(result):
    return {"status": result["status"], "answer": result["answer"], "citations": result["citations"]}


with tempfile.TemporaryDirectory() as directory:
    paths = write_documents(Path(directory))
    index = [chunk for doc in DOCS for chunk in ingest(doc, paths[(doc["doc_id"], doc["version"])])]
    current = grounded_answer(QUERY, index, version="2026-08")
    no_result = grounded_answer("火星天气", index, version="2026-08")
    stale = grounded_answer(QUERY, index, version="2025-01", include_stale=True)
    conflict = grounded_answer(QUERY, [chunk for chunk in index if chunk["version"] in {"2026-08", "2026-09"}], version=None)
    result = {
        "ingest": {"documents": len(DOCS), "chunks": len(index), "versions": sorted({chunk["version"] for chunk in index})},
        "answer": summarize(current),
        "checks": {"citations_grounded": validate_answer(current, index), "citation_has_version": all("2026-08" in citation for citation in current["citations"])},
        "failures": {"no_result": no_result["status"], "stale": stale["status"], "conflict": conflict["status"]},
    }

assert result["ingest"] == {"documents": 3, "chunks": 3, "versions": ["2025-01", "2026-08", "2026-09"]}
assert result["answer"] == {"status": "grounded", "answer": "未发货订单可以申请退款。", "citations": ["refund-policy:2026-08:chunk-1"]}
assert result["checks"] == {"citations_grounded": True, "citation_has_version": True}
assert result["failures"] == {"no_result": "no_evidence", "stale": "stale_evidence", "conflict": "conflict"}

print(json.dumps(result, ensure_ascii=False, sort_keys=True))
```

### 观察输出

{% note success flat %}
预期输出显示：三份文档被切成三个带版本 Chunk；当前版本的答案带有 `doc_id:version:chunk_id` 引用并通过 grounding 校验。无结果返回 `no_evidence`，旧版本返回 `stale_evidence`，两个有效版本产生互斥值时返回 `conflict`。标准库向量只是确定性测试替身，不代表生产 Embedding 的召回质量。
{% endnote %}

```text
{"answer": {"answer": "未发货订单可以申请退款。", "citations": ["refund-policy:2026-08:chunk-1"], "status": "grounded"}, "checks": {"citation_has_version": true, "citations_grounded": true}, "failures": {"conflict": "conflict", "no_result": "no_evidence", "stale": "stale_evidence"}, "ingest": {"chunks": 3, "documents": 3, "versions": ["2025-01", "2026-08", "2026-09"]}}
```

## 结果验证

### 验收证据

| 验收项 | 通过证据 | 失败信号 | 复测动作 |
| --- | --- | --- | --- |
| 入库 | 每个 Chunk 有文档、版本、状态、哈希和稳定 ID | 只有一段无版本文本 | 修改文档内容并重建索引 |
| 检索 | 记录 query、距离/得分、过滤和 top-k | 只展示最终命中文本 | 提高阈值、改查询词和改变版本 |
| 重排 | 版本、生效时间、权限和业务优先级可解释 | 最高相似度直接成为事实 | 加入相似但过期/冲突文档 |
| 上下文 | 发送给模型的片段与 citation map 一一对应 | 引用数组非空但无法定位 | 删除/重排某个 Chunk 后重验 ID |
| 答案 | 每个关键主张都能回到 active Chunk | 模型补充无证据常识 | 使用无结果查询并断言拒答 |
| 冲突 | 互斥有效文档返回 `conflict` | 选分数最高的文档静默回答 | 加入同主张的两条 active 规则 |
| 过期 | superseded/deleted Chunk 返回 `stale_evidence` | 旧政策继续进入答案 | 将当前版本切换并重跑检索 |
| 权限 | 过滤后不泄露不可见文档 | 用“无结果”掩盖或泄露存在性 | 使用另一租户和不同 actor |

### 复测动作

1. 固定文档版本、Chunk 规则、Embedding 模型/维度、距离函数和 top-k，再比较召回与答案。
2. 保存检索候选、重排得分、过滤原因、上下文片段和最终 citation map。
3. 用无结果、相似但过期、同主张冲突、权限不可见和文档删除样例复验拒答。
4. 文档更新、索引重建、模型更换或删除请求发生时，使旧引用和输出缓存失效；本地 fixture 不能证明线上召回或模型质量。

## 常见问题

{% flashcard basic id:llm-rag-not-hallucination-cure deck:"大模型应用开发" priority:1 tags:"RAG与引用,检索" %}
--- question
RAG 为什么不能消除幻觉？
--- answer
RAG 只提供候选上下文和证据定位；检索可能漏召回、命中过期/冲突内容，模型也可能误读或生成没有被引用支持的主张。
--- explanation
RAG 至少包含四个可能失败的环节：

1. **切分与入库**：条件句、标题、版本或否定信息可能在 Chunk 边界处丢失。
2. **检索与重排**：相关性分数不是事实真值；无结果时不能用相似常识填补。
3. **上下文与生成**：模型可能忽略片段、混合冲突文档，或输出超出证据的结论。
4. **答案校验**：必须检查每个主张的 citation、版本、权限、新鲜度和一致性。

因此安全的 RAG 应保留 `no_evidence`、`conflict`、`stale_evidence` 和 `ungrounded` 等状态，必要时交给规则或人工复核。引用增加可追溯性，但不把生成结果自动变成事实。
{% endflashcard %}

{% flashcard basic id:llm-rag-citation-granularity deck:"大模型应用开发" priority:1 tags:"RAG与引用,引用" %}
--- question
引用应该指向文档、片段还是版本？
--- answer
至少指向带版本的片段，例如 `doc_id + version + chunk_id`；高风险场景还应记录页码、段落/区域、哈希和生效时间。
--- explanation
不同粒度承担不同职责：

| 粒度 | 能证明什么 | 不足 |
| --- | --- | --- |
| 文档 | 结论来自哪份资料 | 无法定位具体句子，版本可能变化 |
| 版本 | 使用了哪一版规则 | 仍可能是一篇很长的全文 |
| Chunk | 哪一段文字支持主张 | 需要保留它所属文档、版本和哈希 |
| 页码/区域 | 在原始 PDF/图片的具体位置 | 仍需权限、解析版本和内容完整性 |

最终 citation map 应能从答案主张回到 active Chunk，再回到原始字节或可访问的文档版本。文档删除、权限撤回或版本替换时，旧 citation 和缓存都要失效；哈希能绑定内容，不代表内容本身一定正确。
{% endflashcard %}

## 参考资料

### 官方资料

{% linkgroup %}
{% link OpenAI Embeddings Guide, https://platform.openai.com/docs/guides/embeddings, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

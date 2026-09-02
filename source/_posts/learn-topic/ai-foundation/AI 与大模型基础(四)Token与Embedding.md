---
title: AI 与大模型基础(四)Token与Embedding
tags:
  - AI 与大模型基础
  - Token与Embedding
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能解释文本如何变成 Token 和向量，并识别分词、语言和相似度的限制。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 4
published: false
abbrlink: 149dcdda
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：区分文本切分、Token ID、输入 Token Embedding、上下文化隐藏状态与文本 Embeddings API 向量，并用 Unicode 反例观察边界。
{% endnote %}

## 机制模型

{% note info flat %}
Tokenizer 按特定 encoding 的合同把输入映射为 Token ID。规范化与预切分是否存在、如何执行，取决于具体 tokenizer；BPE 在预切分片段上按 merge rank 合并，unigram 则按 token score 选择整段分词，不是同一套合并规则。某些 byte-level tokenizer 会先在 UTF-8 bytes 上工作，以 byte fallback 覆盖未知 Unicode。本文把 OpenAI tiktoken 只作为具体 encoding 实现的核对入口，不能把它的行为外推给所有 tokenizer。模型输入层再用 ID 查固定参数行；同一 ID 的输入 Token Embedding 在固定 checkpoint 中不随上下文变化。它经过 Attention/FFN 后成为随上下文变化的隐藏状态；独立 Embeddings API 则按该接口的文本输入与聚合合同返回任务向量。
{% endnote %}

{% mermaid %}
flowchart TD
  T[文本/字节] --> S[Tokenizer]
  S --> I[Token ID]
  I --> E[输入 Token Embedding]
  E --> H[Transformer]
  H --> C[上下文化隐藏状态]
  T --> A[文本 Embeddings API]
  A --> V[任务向量]
  V --> M[同一空间内相似度]
{% endmermaid %}

{% note primary flat %}
Token ID 查到的是 checkpoint 的输入参数行，经过 Transformer 才得到上下文化隐藏状态；文本 Embeddings API 是另一条有独立模型与聚合合同的路径。改变 tokenizer、checkpoint 或 Embeddings 模型会改变坐标，不能跨版本直接比较。
{% endnote %}

| 对象 | 输入与产生位置 | 是否随上下文变化 | 不能推出 |
| --- | --- | --- | --- |
| Token ID | tokenizer/encoding 对文本的编号 | 同一 encoding 下固定 | 跨词表仍可比较 |
| 输入 Token Embedding | checkpoint 的 embedding 矩阵查表 | 固定 checkpoint 下不变 | 它已理解整句 |
| 上下文化隐藏状态 | 多层 Attention 与 FFN 的输出 | 会变化 | 可直接当检索向量 |
| 文本 Embeddings API | 接口接收文本并按其合同输出向量 | 受模型、版本和输入影响 | 暴露内部 Token 查表行 |
| 余弦相似度 | 同一坐标空间内两向量夹角 | 由输入与模型决定 | 证明事实或蕴含 |

{% note primary flat %}
Token 数会影响窗口占用和按 Token 计量的成本；空格、标点和标识符也可能分成多个片段。变化的是输入 Embedding 经过网络后的隐藏状态，不是查表参数本身。不同 Embeddings 模型、版本、维度或聚合方式得到的坐标空间不能直接比较。
{% endnote %}

## 核心边界

{% note info flat %}
教学切分器有一个明确且有限的 fixture contract：不做 Unicode 规范化、不做预切分，在当前位置选择词表中最长片段，未命中时回退一个 Unicode code point。它打印每个片段的字符偏移和 UTF-8 十六进制字节，再让零向量与异维向量明确失败；这不是 BPE、unigram 或 byte-level tokenizer。
{% endnote %}

{% folding purple, 展开机制辨析 %}
教学代码不是 BPE、unigram 或生产字节级 tokenizer：它不学习合并顺序，也不自动规范化 Unicode。BPE 的 merge rank 决定合并次序；unigram 用候选 token 的 score 选择整段分词；byte-level 实现则可能把 UTF-8 bytes 作为回退单位，因此边界会不同。这里的未知项按一个 Unicode code point 回退，所以变体选择符和 ZWJ 会成为独立片段。真实计量必须调用目标模型指定的 encoding 并记录版本；本文对 tiktoken 的证据也只适用于被选中的具体 encoding 与版本。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
import math
import unicodedata

vocab = {"人工":1, "智能":2, "AI":3, "🤖":4, " ":5, "=":6}
INPUT_SPACE = "fixture-checkpoint-v1/input-embedding"
TASK_SPACE = "fixture-embeddings-api-v1"
input_embedding = {
    0:{"space_id":INPUT_SPACE,"values":[0.2,0.2]},
    1:{"space_id":INPUT_SPACE,"values":[1.0,0.0]},
    2:{"space_id":INPUT_SPACE,"values":[0.0,1.0]},
    3:{"space_id":INPUT_SPACE,"values":[1.0,1.0]},
    4:{"space_id":INPUT_SPACE,"values":[-1.0,0.0]},
    5:{"space_id":INPUT_SPACE,"values":[0.5,0.5]},
    6:{"space_id":INPUT_SPACE,"values":[0.0,-1.0]},
}

def tokenize(text):
    output, offset = [], 0
    while offset < len(text):
        # 只在当前位置选词表中最长片段；无命中时回退一个 code point。
        suffix = text[offset:]
        hit = next((piece for piece in sorted(vocab, key=len, reverse=True)
                    if suffix.startswith(piece)), text[offset])
        end = offset + len(hit)
        output.append({"piece":hit, "id":vocab.get(hit, 0), "chars":[offset,end],
                       "utf8":hit.encode("utf-8").hex(" ")})
        offset = end
    return output

def cosine(a, b):
    if a["space_id"] != b["space_id"]:
        raise ValueError("vector space mismatch")
    left, right = a["values"], b["values"]
    if len(left) != len(right):
        raise ValueError("dimension mismatch")
    norm_left = math.sqrt(sum(value * value for value in left))
    norm_right = math.sqrt(sum(value * value for value in right))
    if norm_left == 0 or norm_right == 0:
        raise ValueError("zero vector")
    return sum(x * y for x, y in zip(left, right)) / (norm_left * norm_right)

texts = ["人工智能", "AI = 🤖", "é", "e\u0301", "✈️", "👩‍💻"]
expected_records = {
    "人工智能":{"count":2,"codepoints":["U+4EBA","U+5DE5","U+667A","U+80FD"],
              "pieces":[("人工",1,[0,2],"e4 ba ba e5 b7 a5"),("智能",2,[2,4],"e6 99 ba e8 83 bd")]},
    "AI = 🤖":{"count":5,"codepoints":["U+0041","U+0049","U+0020","U+003D","U+0020","U+1F916"],
               "pieces":[("AI",3,[0,2],"41 49"),(" ",5,[2,3],"20"),("=",6,[3,4],"3d"),
                         (" ",5,[4,5],"20"),("🤖",4,[5,6],"f0 9f a4 96")]},
    "é":{"count":1,"codepoints":["U+00E9"],"pieces":[("é",0,[0,1],"c3 a9")]},
    "e\u0301":{"count":2,"codepoints":["U+0065","U+0301"],
                "pieces":[("e",0,[0,1],"65"),("́",0,[1,2],"cc 81")]},
    "✈️":{"count":2,"codepoints":["U+2708","U+FE0F"],
          "pieces":[("✈",0,[0,1],"e2 9c 88"),("️",0,[1,2],"ef b8 8f")]},
    "👩‍💻":{"count":3,"codepoints":["U+1F469","U+200D","U+1F4BB"],
           "pieces":[("👩",0,[0,1],"f0 9f 91 a9"),("\u200d",0,[1,2],"e2 80 8d"),
                     ("💻",0,[2,3],"f0 9f 92 bb")]},
}
expected_lookups = {
    "人工智能":[(INPUT_SPACE,[1.0,0.0]),(INPUT_SPACE,[0.0,1.0])],
    "AI = 🤖":[(INPUT_SPACE,[1.0,1.0]),(INPUT_SPACE,[0.5,0.5]),
               (INPUT_SPACE,[0.0,-1.0]),(INPUT_SPACE,[0.5,0.5]),
               (INPUT_SPACE,[-1.0,0.0])],
    "é":[(INPUT_SPACE,[0.2,0.2])],
    "e\u0301":[(INPUT_SPACE,[0.2,0.2]),(INPUT_SPACE,[0.2,0.2])],
    "✈️":[(INPUT_SPACE,[0.2,0.2]),(INPUT_SPACE,[0.2,0.2])],
    "👩‍💻":[(INPUT_SPACE,[0.2,0.2]),(INPUT_SPACE,[0.2,0.2]),(INPUT_SPACE,[0.2,0.2])],
}
records, lookups = {}, {}
for text in texts:
    pieces = tokenize(text)
    records[text] = {
        "count":len(pieces),
        "codepoints":[f"U+{ord(character):04X}" for character in text],
        "pieces":[(row["piece"],row["id"],row["chars"],row["utf8"]) for row in pieces],
    }
    lookups[text] = [(input_embedding[row["id"]]["space_id"],
                      input_embedding[row["id"]]["values"]) for row in pieces]
if records != expected_records or lookups != expected_lookups:
    raise RuntimeError("token or lookup fixture changed")
if unicodedata.normalize("NFC", "e\u0301") != "é":
    raise RuntimeError("normalization fixture failed")
for text in texts:
    row = records[text]
    print(repr(text), "count", row["count"], "codepoints", row["codepoints"], "pieces", row["pieces"])
print("lookup", repr("AI = 🤖"), "ids", [row["id"] for row in tokenize("AI = 🤖")],
      "vectors", [values for _,values in lookups["AI = 🤖"]])
same = {"space_id":TASK_SPACE,"values":[1.0,0.0]}
scaled = {"space_id":TASK_SPACE,"values":[2.0,0.0]}
opposite = {"space_id":TASK_SPACE,"values":[-1.0,0.0]}
cosines = (cosine(same,scaled),cosine(same,opposite))
if cosines != (1.0,-1.0):
    raise RuntimeError("cosine fixture changed")
task_oracle = {"pair":"same-direction-wrong-answer","cosine":cosines[0],"factually_correct":False}
if task_oracle != {"pair":"same-direction-wrong-answer","cosine":1.0,"factually_correct":False}:
    raise RuntimeError("task oracle changed")
print("cosines", *cosines)
print("task-oracle", task_oracle)
negative = [
    ({"space_id":TASK_SPACE,"values":[0.0,0.0]},same,"zero vector"),
    ({"space_id":TASK_SPACE,"values":[1.0]},same,"dimension mismatch"),
    (input_embedding[1],same,"vector space mismatch"),
]
for left,right,expected_error in negative:
    try:
        cosine(left,right)
    except ValueError as error:
        if str(error) != expected_error:
            raise RuntimeError("wrong vector rejection")
        print("rejected:", error)
    else:
        raise RuntimeError("invalid vectors accepted")
```

{% note success flat %}
六个冻结输入会先逐项断言计数、code point、片段、ID、字符偏移与 UTF-8，再断言每条完整 Token 序列的查表结果。词表 ID `0..6` 都有带 `space_id` 的二维参数行；展示的 `AI = 🤖` 完整查表序列与两个余弦值也被精确冻结。独立任务标签保留“余弦为 1 但答案错误”的反例；负例还会拒绝零向量、异维向量，以及维度相同但 `space_id` 不同的跨空间比较。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
'人工智能' count 2 codepoints ['U+4EBA', 'U+5DE5', 'U+667A', 'U+80FD'] pieces [('人工', 1, [0, 2], 'e4 ba ba e5 b7 a5'), ('智能', 2, [2, 4], 'e6 99 ba e8 83 bd')]
'AI = 🤖' count 5 codepoints ['U+0041', 'U+0049', 'U+0020', 'U+003D', 'U+0020', 'U+1F916'] pieces [('AI', 3, [0, 2], '41 49'), (' ', 5, [2, 3], '20'), ('=', 6, [3, 4], '3d'), (' ', 5, [4, 5], '20'), ('🤖', 4, [5, 6], 'f0 9f a4 96')]
'é' count 1 codepoints ['U+00E9'] pieces [('é', 0, [0, 1], 'c3 a9')]
'é' count 2 codepoints ['U+0065', 'U+0301'] pieces [('e', 0, [0, 1], '65'), ('́', 0, [1, 2], 'cc 81')]
'✈️' count 2 codepoints ['U+2708', 'U+FE0F'] pieces [('✈', 0, [0, 1], 'e2 9c 88'), ('️', 0, [1, 2], 'ef b8 8f')]
'👩\u200d💻' count 3 codepoints ['U+1F469', 'U+200D', 'U+1F4BB'] pieces [('👩', 0, [0, 1], 'f0 9f 91 a9'), ('\u200d', 0, [1, 2], 'e2 80 8d'), ('💻', 0, [2, 3], 'f0 9f 92 bb')]
lookup 'AI = 🤖' ids [3, 5, 6, 5, 4] vectors [[1.0, 1.0], [0.5, 0.5], [0.0, -1.0], [0.5, 0.5], [-1.0, 0.0]]
cosines 1.0 -1.0
task-oracle {'pair': 'same-direction-wrong-answer', 'cosine': 1.0, 'factually_correct': False}
rejected: zero vector
rejected: dimension mismatch
rejected: vector space mismatch
```
{% endfolding %}

## 失败边界

{% note warning flat %}
把教学切分器说成 BPE/SentencePiece 或真实供应商实现；跨 encoding 比较 token ID；把高余弦相似度当作答案正确、事实相同或因果关系。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 切分 | 输出片段、ID、UTF-8 边界可解释 | 把字符数当 token 数 |
| 版本 | 真实观察需记录 encoding 与版本 | 只写“某模型 tokenizer” |
| 相似度 | 先校验 `space_id`，再处理维度与零向量 | 跨模型空间比较或零向量返回伪数值 |

## 结果验证

{% note success flat %}
预期输出应同时包含六条精确 Token 记录、每条完整序列的同空间查表断言、冻结余弦与独立任务标签，并拒绝零向量、异维向量和同维跨空间向量。真实窗口或成本估算必须改用目标模型指定的 tokenizer/encoding 与明确版本。
{% endnote %}

- 输出片段、ID、code point 与 UTF-8 bytes。
- 用同一 embedding 模型与同一维度比较向量。
- 以独立标签评估正确率，不把余弦值当事实分数。

## 常见问题

{% flashcard basic id:foundation-token-boundary deck:"AI 与大模型基础" priority:1 tags:"Token与Embedding,基础机制" %}
--- question
Token 是否等于汉字、单词或字符？
--- answer
不等于；边界由具体 tokenizer、词表、字节表示和版本共同决定。
--- explanation
例如 NFC 的 `é` 与 NFD 的 `e + combining acute` 在教学 fixture 中会走不同 code point；生产 tokenizer 还可能先归一化或退回 UTF-8 bytes。估算窗口和成本必须实际运行指定 encoding，而不是数汉字或单词。
{% endflashcard %}

{% flashcard basic id:foundation-embedding-truth deck:"AI 与大模型基础" priority:2 tags:"Token与Embedding,基础机制" %}
--- question
Embedding 相似度为什么不能直接当答案正确率？
--- answer
它只度量指定向量空间中的几何接近，不验证事实、蕴含或任务标签。
--- explanation
`cos([1,0],[2,0])=1` 只说明方向相同，`cos([1,0],[-1,0])=-1` 只说明方向相反。阈值还受模型版本、归一化、截断和业务分布影响；答案正确率必须用独立标签计算。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Attention Is All You Need, https://arxiv.org/abs/1706.03762v1, https://arxiv.org/favicon.ico %}
{% link OpenAI tiktoken, https://github.com/openai/tiktoken, https://github.com/favicon.ico %}
{% link OpenAI Embeddings Guide, https://platform.openai.com/docs/guides/embeddings, https://developers.openai.com/favicon.png %}
{% endlinkgroup %}

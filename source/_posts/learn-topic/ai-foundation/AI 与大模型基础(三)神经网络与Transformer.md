---
title: AI 与大模型基础(三)神经网络与Transformer
tags:
  - AI 与大模型基础
  - 神经网络与Transformer
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能从输入、表示、注意力和层叠结构解释 Transformer 的基本生成过程。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 3
published: false
abbrlink: 911b1af5
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：沿着一次 decoder-only 前向计算追踪 Token ID、输入 Embedding、位置表示、Attention、FFN、残差和词表 logits 的形状，并观察位置缺失和维度错误怎样暴露。
{% endnote %}

## 机制模型

{% note info flat %}
神经网络把输入向量乘以可学习参数，再经非线性函数形成新表示；训练用损失函数的梯度更新参数。Decoder-only 语言模型把 token 与位置表示送入多层 block，最后经归一化和词表投影得到 logits，再用 softmax 形成下一 token 的条件分布。
{% endnote %}

{% mermaid %}
flowchart TD
  I[Token ID] --> E[Embedding 查表 + 位置表示]
  subgraph B[重复的 Decoder Block]
    X[子层输入] --> N1[Norm]
    N1 --> QKV[Q/K/V 投影]
    QKV --> A[因果 Self-Attention]
    X --> R1[残差相加]
    A --> R1
    R1 --> N2[Norm]
    N2 --> F[逐位置 FFN]
    R1 --> R2[残差相加]
    F --> R2
  end
  E --> X
  R2 --> H[最终 Norm 与 LM Head]
  H --> O[词表 logits]
  O --> S[选取并追加下一个 Token]
{% endmermaid %}

{% note primary flat %}
这张图用 GPT-2 报告中的 pre-norm 路径表达一个 decoder-only block；其他架构可能采用 post-norm 或不同位置方案，必须以目标 checkpoint 的架构说明为准。2017 年原始 Transformer 还包含 encoder self-attention 和 decoder cross-attention，不能把三种结构画成同一条路径。
{% endnote %}

| 架构 | 输入与训练任务 | Attention 组成 | 常见输出 |
| --- | --- | --- | --- |
| Encoder | 可同时读取整个输入；如掩码或判别任务 | 双向 self-attention | 每个输入位置的表示 |
| Encoder-decoder | 输入交给 encoder，decoder 预测目标序列 | encoder self-attention、因果 decoder self-attention、cross-attention | 条件生成序列 |
| Decoder-only | 已出现 token 预测下一个 token | 因果 self-attention | 下一 token logits |

| 部件 | 直接作用 | 边界 |
| --- | --- | --- |
| Q/K/V | Q 与 K 形成分数，softmax 后加权 V | 权重不是因果解释 |
| FFN | 对每个位置独立作非线性变换 | 不是跨位置混合 |
| 残差 | 子层输入绕过子层后相加 | 图中必须有真实旁路 |
| LM head | 把隐藏维投影到词表维 | 概率不等于事实置信度 |

## 核心边界

{% note info flat %}
用三个 Token ID 完成一个二维 toy 前向：记录每一层形状、因果权重、残差、FFN、LM Head 和追加结果；再移除位置表示并制造矩阵维度错误。
{% endnote %}

{% folding purple, 展开机制辨析 %}
输入 Embedding 是 Token ID 到固定参数行的查表；位置表示让相同 Token 在不同位置获得不同输入。Attention 负责跨位置混合，FFN 逐位置变换，局部残差保留每个子层的输入。最后一个隐藏状态经 LM Head 投影为词表 logits，选出的 Token 追加到序列后才进入下一轮。

这个 toy 只验证数据流和形状，不包含训练所得参数、真实 tokenizer、LayerNorm 数值或真实模型质量。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
import math

embedding = [[1.0, 0.0], [0.0, 1.0], [0.5, 0.5]]  # vocab=3, d_model=2
position = [[0.0, 0.0], [0.1, -0.1], [0.2, -0.2]]
token_ids = [0, 1, 0]

def add(a, b):
    if len(a) != len(b):
        raise ValueError("residual dimension mismatch")
    return [x + y for x, y in zip(a, b)]

def dot(a, b):
    if len(a) != len(b):
        raise ValueError("Q/K dimension mismatch")
    return sum(x * y for x, y in zip(a, b))

def matvec(vector, matrix):
    if not matrix or len(vector) != len(matrix):
        raise ValueError("projection dimension mismatch")
    return [sum(vector[i] * matrix[i][j] for i in range(len(vector)))
            for j in range(len(matrix[0]))]

def softmax(values):
    peak = max(values)
    exps = [math.exp(value - peak) for value in values]
    total = sum(exps)
    return [value / total for value in exps]

def causal_attention(queries, keys, values):
    if len(keys) != len(queries) or len(values) != len(queries):
        raise ValueError("Q/K/V length mismatch")
    if (not queries or any(len(query) != len(keys[0]) for query in queries)
            or any(len(key) != len(keys[0]) for key in keys)):
        raise ValueError("Q/K dimension mismatch")
    if not values or any(len(value) != len(values[0]) for value in values):
        raise ValueError("V dimension mismatch")
    outputs, weights = [], []
    for i, query in enumerate(queries):
        scores = [dot(query, key) / math.sqrt(len(query)) if j <= i else float("-inf")
                  for j, key in enumerate(keys)]
        row_weights = softmax(scores)
        outputs.append([sum(weight * value[d] for weight, value in zip(row_weights, values))
                        for d in range(len(values[0]))])
        weights.append(row_weights)
    return outputs, weights

x = [add(embedding[token_id], position[index]) for index, token_id in enumerate(token_ids)]
queries, keys, values = ([row[:] for row in x] for _ in range(3))  # identity Q/K/V
attention_output, weights = causal_attention(queries, keys, values)
residual_1 = [add(before, after) for before, after in zip(x, attention_output)]
w1 = [[1.0, -1.0, 0.5], [0.5, 1.0, -0.5]]
w2 = [[0.5, 0.0], [0.0, 0.5], [1.0, 1.0]]
ffn = [matvec([max(0.0, value) for value in matvec(row, w1)], w2) for row in residual_1]
residual_2 = [add(before, after) for before, after in zip(residual_1, ffn)]
lm_head = [[1.0, 0.0, -1.0], [0.0, 1.0, 1.0]]
logits = matvec(residual_2[-1], lm_head)
next_token = max(range(len(logits)), key=logits.__getitem__)

qkv = [queries, keys, values]
shapes = {"embedding": (len(x), len(x[0])),
          "qkv": (len(qkv), len(qkv[0]), len(qkv[0][0])),
          "scores": (len(weights), len(weights[0])),
          "attention": (len(attention_output), len(attention_output[0])),
          "ffn": (len(ffn), len(ffn[0])), "logits": (len(logits),)}
def rounded(rows):
    return [[round(value, 3) for value in row] for row in rows]

forward = {"weights":rounded(weights), "attention":rounded(attention_output),
           "residual_1":rounded(residual_1), "ffn":rounded(ffn),
           "residual_2":rounded(residual_2),
           "logits":[round(value, 3) for value in logits],
           "next":next_token, "sequence":token_ids + [next_token]}
expected_shapes = {"embedding": (3, 2), "qkv": (3, 3, 2), "scores": (3, 3),
                   "attention": (3, 2), "ffn": (3, 2), "logits": (3,)}
expected_forward = {
    "weights":[[1.0, 0.0, 0.0], [0.375, 0.625, 0.0], [0.38, 0.156, 0.464]],
    "attention":[[1.0, 0.0], [0.438, 0.562], [0.952, 0.048]],
    "residual_1":[[2.0, 0.0], [0.538, 1.462], [2.152, -0.152]],
    "ffn":[[2.0, 1.0], [0.634, 0.462], [2.19, 1.152]],
    "residual_2":[[4.0, 1.0], [1.172, 1.924], [4.343, 1.0]],
    "logits":[4.343, 1.0, -3.343], "next":0, "sequence":[0, 1, 0, 0],
}
if shapes != expected_shapes or any(abs(sum(row) - 1.0) > 1e-9 for row in weights):
    raise RuntimeError("shape or normalization invariant failed")
if any(weights[i][j] != 0 for i in range(len(weights)) for j in range(i + 1, len(weights))):
    raise RuntimeError("causal mask leaked")
if forward != expected_forward:
    raise RuntimeError("forward result changed")
for name in ["weights", "attention", "residual_1", "ffn", "residual_2"]:
    print(name, forward[name])
print("logits", forward["logits"], "next", forward["next"], "sequence", forward["sequence"])
print("shapes", shapes)

scaled_values = [[2 * value for value in row] for row in values]
changed_output, same_weights = causal_attention(queries, keys, scaled_values)
expected_changed = [[2.0, 0.0], [0.876, 1.124], [1.905, 0.095]]
if same_weights != weights or rounded(changed_output) != expected_changed:
    raise RuntimeError("V-only contrast failed")
print("v-only", "weights-same", "output", rounded(changed_output))

same_without_position = [embedding[0], embedding[0]]
same_with_position = [add(embedding[0], position[i]) for i in range(2)]
if same_without_position[0] != same_without_position[1] or same_with_position[0] == same_with_position[1]:
    raise RuntimeError("position counterexample failed")
print("position", "indistinguishable-without", "distinct-with")
try:
    matvec([1.0], lm_head)
except ValueError as error:
    print("rejected:", error)
else:
    raise RuntimeError("invalid projection accepted")
```

{% note success flat %}
精确输出覆盖权重、Attention、两条残差、FFN、logits 与追加序列，全部由实际中间量派生并与手算值断言。V-only 对照保持 Q/K 与权重不变，把 V 放大两倍后输出也对应放大；随后输出位置反例和 `rejected: projection dimension mismatch`。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
weights [[1.0, 0.0, 0.0], [0.375, 0.625, 0.0], [0.38, 0.156, 0.464]]
attention [[1.0, 0.0], [0.438, 0.562], [0.952, 0.048]]
residual_1 [[2.0, 0.0], [0.538, 1.462], [2.152, -0.152]]
ffn [[2.0, 1.0], [0.634, 0.462], [2.19, 1.152]]
residual_2 [[4.0, 1.0], [1.172, 1.924], [4.343, 1.0]]
logits [4.343, 1.0, -3.343] next 0 sequence [0, 1, 0, 0]
shapes {'embedding': (3, 2), 'qkv': (3, 3, 2), 'scores': (3, 3), 'attention': (3, 2), 'ffn': (3, 2), 'logits': (3,)}
v-only weights-same output [[2.0, 0.0], [0.876, 1.124], [1.905, 0.095]]
position indistinguishable-without distinct-with
rejected: projection dimension mismatch
```
{% endfolding %}

## 失败边界

{% note warning flat %}
把原始 2017 encoder-decoder 架构当作所有现代 LLM 的实现；忽略遮罩方向或让 Q/K 最后一维不同；把注意力权重当成模型理解或因果贡献。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 形状 | score 为 T×T，输出为 T×d_v | 维度不匹配 |
| 归一化 | 每行 softmax 和为 1 | 沿错误轴归一化 |
| 边界 | 明确 toy fixture 只验证公式 | 声称复现真实 GPT |

## 结果验证

{% note success flat %}
预期输出必须覆盖每行归一化、因果遮罩、完整 Attention 输出、logits、下一 Token 追加、位置反例和错误投影。更换 V 而保持 Q/K 不变时，权重不变而输出变化；这能区分“路由分数”和“被聚合内容”。
{% endnote %}

- 每行权重和应接近 1。
- 输出形状应为 `T × d_v`。
- decoder-only 与原始 encoder-decoder 的遮罩和 cross-attention 不混写。

## 常见问题

{% flashcard basic id:foundation-attention-compute deck:"AI 与大模型基础" priority:1 tags:"神经网络与Transformer,基础机制" %}
--- question
Attention 在计算什么？
--- answer
它用 Query 与 Key 的匹配分数，对 Value 做归一化加权组合。
--- explanation
计算链是 `QKᵀ → 缩放/遮罩 → softmax → 加权 V`。例如第一个位置在因果遮罩下只能读取自己，所以权重必须是 `[1,0,0]`；即使某个权重最大，也只说明本次前向计算混合了更多对应 Value，不能单独证明因果重要性。
{% endflashcard %}

{% flashcard basic id:foundation-decoder-only deck:"AI 与大模型基础" priority:2 tags:"神经网络与Transformer,基础机制" %}
--- question
Decoder-only 为什么适合自回归生成？
--- answer
因果遮罩让每个位置只依赖已出现的 token，可重复预测下一个 token。
--- explanation
训练时，整段序列各位置可在因果遮罩下并行计算 next-token loss；生成时，第 `t+1` 个 token 必须等待前 `t` 个 token。Decoder-only 没有原始 decoder 的 cross-attention，因此不能把两种结构画成同一条数据流。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Attention Is All You Need, https://arxiv.org/abs/1706.03762v1, https://arxiv.org/favicon.ico %}
{% link Language Models are Unsupervised Multitask Learners, https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf, https://developers.openai.com/favicon.png %}
{% endlinkgroup %}

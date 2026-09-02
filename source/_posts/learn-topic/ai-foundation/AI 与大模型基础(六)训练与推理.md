---
title: AI 与大模型基础(六)训练与推理
tags:
  - AI 与大模型基础
  - 训练与推理
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能区分预训练、微调、对齐、推理、量化和 Scaling 的作用。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 6
published: false
abbrlink: 175987a0
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：区分会更新参数的训练阶段与固定 checkpoint 的推理阶段，并用合成算术观察 Token、batch、精度、采样和停止条件怎样改变资源记录。
{% endnote %}

## 机制模型

{% note info flat %}
预训练在大规模数据上更新参数以降低预测损失；后训练是在已有 checkpoint 上继续优化行为，SFT 使用示范目标，偏好优化使用成对或评分信号。对齐是更广的目标与过程，可能包含 SFT、偏好方法、安全评测和系统约束，不能与某一种算法画等号。离线阶段产出 checkpoint；请求时的推理通常固定权重，先 prefill 输入，再逐 token decode。
{% endnote %}

{% mermaid %}
flowchart TD
  D[数据与目标] --> P[预训练 checkpoint]
  P --> W[可服务权重]
  P -.可选.-> S[SFT]
  S --> W
  S -.可选.-> A[偏好优化等后训练]
  A --> W
  W -.可选.-> Q[量化副本]
  W --> I[Prefill 与 Decode]
  Q --> I
  I --> O[采样与停止]
{% endmermaid %}

{% note primary flat %}
图中左侧是会更新参数的离线阶段，右侧是使用固定 checkpoint 的请求阶段。量化通常生成另一份数值表示；它不是请求时自动发生，也不能由文件体积推出任务质量。
{% endnote %}

| 对象 | 关键计算与资源 | 可观察指标 | 不能推出 |
| --- | --- | --- | --- |
| 自回归预训练 | forward 计算损失并保留 backward 所需激活，backward 计算/累积梯度，optimizer 保存状态并更新权重 | 训练 loss、验证 loss、Token/算力预算 | checkpointing 可用重算换激活内存；并非所有预训练都只用 next-token |
| SFT/偏好训练 | 在已有 checkpoint 上用示范或偏好信号继续更新参数 | 目标任务与安全评测 | 对齐等于某一种算法 |
| Prefill | 并行处理整段输入并建立 KV Cache | 首 Token 延迟、输入吞吐、峰值显存 | 等于逐 Token decode |
| Decode | 每步读取历史缓存并追加一个 Token | 每 Token 延迟、输出吞吐 | 输入长度不影响它 |
| 量化 | 用较少比特近似权重/激活 | 显存、吞吐、延迟、目标任务质量 | 文件更小必然更快 |

{% note primary flat %}
静态批处理先组成固定批次，通常等整批结束后再接纳下一批；短序列完成后留下的空位不能及时给新请求。连续批处理采用迭代级调度：decode 序列完成后可补入等待请求，并在 KV Cache 容量与调度策略允许时安排新的 prefill 或 decode 工作。vLLM 论文以迭代级调度和 PagedAttention 说明这种服务路径；它提高资源利用机会，不承诺每个请求都更快。
{% endnote %}

| 调度方式 | 接纳边界 | 主要收益 | 必须同时观察 |
| --- | --- | --- | --- |
| 静态批处理 | 固定批次结束后换批 | 实现与执行形状较简单 | 长请求拖住整批、空槽时间 |
| 连续批处理 | 迭代边界补入或移出序列 | 减少空槽并提高吞吐机会 | 排队、prefill 干扰、抢占与 KV 容量 |

{% note info flat %}
TTFT（Time To First Token，首 Token 时间）包含排队、调度和 prefill；ITL（Inter-Token Latency，Token 间延迟）观察相邻输出 Token 的等待；吞吐量统计单位时间完成的请求或 Token。调度器提高并发或插入较长 prefill 时，吞吐可能上升，而部分请求的 TTFT 或 ITL 同时变差。比较引擎必须固定到达过程、输入/输出长度分布、checkpoint、硬件、KV 容量和延迟分位数，不能只报平均吞吐。
{% endnote %}

{% note warning flat %}
Scaling law 是在特定数据、算力、模型族和训练制度下观察到的经验关系，不是增加参数就必然提高每个任务的定律。Chinchilla 的结论依赖其研究预算与拟合范围，迁移时要重新测量数据质量、训练 Token 与计算约束。
{% endnote %}

## 核心边界

{% note info flat %}
用固定 logits 比较 temperature 与 top-p 的候选分布，再用固定随机种子采样并执行停止条件；另用合成算术记录 token 数、batch、精度、延迟与成功任务成本。两者都不是硬件或模型 Benchmark。
{% endnote %}

{% folding purple, 展开机制辨析 %}
自回归语言模型常用 next-token 目标，但掩码建模、对比学习和扩散目标也属于预训练范畴。训练显存还包含参数、梯度、优化器状态和激活；推理显存主要包含权重、运行时缓冲与 KV Cache。真实性能必须绑定 checkpoint、引擎、硬件、batch 和输入/输出分布。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
import json
import math
import random

vocab = ["A", "B", "STOP"]

def distribution(logits, temperature, top_p=1.0):
    if temperature <= 0 or not 0 < top_p <= 1:
        raise ValueError("invalid sampling parameter")
    peak = max(logits)
    raw = [math.exp((value - peak) / temperature) for value in logits]
    ranked = sorted(zip(vocab, [value / sum(raw) for value in raw]),
                    key=lambda item:item[1], reverse=True)
    kept, cumulative = [], 0.0
    for item in ranked:
        kept.append(item)
        cumulative += item[1]
        if cumulative >= top_p:
            break
    scale = sum(probability for _, probability in kept)
    return [(token, round(probability / scale, 6)) for token, probability in kept]

def generate(seed, logits, temperature, top_p):
    rng, output = random.Random(seed), []
    for _ in range(6):
        choices = distribution(logits, temperature, top_p)
        token = rng.choices([item[0] for item in choices], [item[1] for item in choices])[0]
        if token == "STOP":
            return output, "stop-token"
        output.append(token)
    return output, "length-limit"

def synthetic_record(name, input_tokens, output_tokens, batch, bytes_per_weight, successes):
    if min(input_tokens, output_tokens, batch, bytes_per_weight, successes) <= 0 or successes > batch:
        raise ValueError("resource fields must be positive and successes <= batch")
    # cost_units 与时间系数只用于控制变量，不是价格或硬件实测。
    total = (input_tokens + output_tokens) * batch * bytes_per_weight
    return {"name":name, "input_tokens":input_tokens, "output_tokens":output_tokens,
            "batch":batch, "bytes":bytes_per_weight, "successes":successes,
            "synthetic_prefill_ms":round(input_tokens * batch * 0.02, 2),
            "synthetic_decode_ms":round(output_tokens * batch * 0.5, 2),
            "cost_units":total, "cost_per_success":round(total / successes, 2)}

low = distribution([2.0,1.0,0.0], 0.5, 1.0)
high = distribution([2.0,1.0,0.0], 1.0, 1.0)
nucleus = distribution([2.0,1.0,0.0], 1.0, 0.8)
sample = generate(7, [2.0,1.0,0.0], 1.0, 0.8)
stopped = generate(7, [0.0,0.0,10.0], 1.0, 0.8)
records = [
    synthetic_record("short",120,30,1,1,1),
    synthetic_record("batch-with-failure",120,30,4,1,3),
    synthetic_record("long",240,60,1,1,1),
    synthetic_record("two-byte",120,30,1,2,1),
]
weights = [0.12,-0.38,0.91]
quantized = [round(value * 4) / 4 for value in weights]
mse = round(sum((a-b)**2 for a,b in zip(weights,quantized)) / len(weights), 6)

if [token for token,_ in low] != ["A","B","STOP"] or [token for token,_ in nucleus] != ["A","B"]:
    raise RuntimeError("top-p candidate set changed")
if round(low[0][1],3) != 0.867 or round(high[0][1],3) != 0.665:
    raise RuntimeError("temperature invariant failed")
if sample != generate(7,[2.0,1.0,0.0],1.0,0.8) or stopped != ([], "stop-token"):
    raise RuntimeError("generation invariant failed")
expected_costs = {"short":150.0,"batch-with-failure":200.0,"long":300.0,"two-byte":300.0}
if {row["name"]:row["cost_per_success"] for row in records} != expected_costs:
    raise RuntimeError("cost arithmetic changed")
print("candidates", {"top_p_1":[token for token,_ in high],
                     "top_p_0.8":[token for token,_ in nucleus]})
print("probability", round(low[0][1],3), round(high[0][1],3))
print("sample", sample, "stopped", stopped)
print("resources", json.dumps(records, sort_keys=True, separators=(",",":")))
print("quant_mse", mse)
for action in [
    lambda:distribution([2.0,1.0,0.0],0,1.0),
    lambda:distribution([2.0,1.0,0.0],1.0,1.1),
    lambda:synthetic_record("bad",120,30,0,1,1),
    lambda:synthetic_record("bad",120,30,1,1,0),
]:
    try:
        action()
    except ValueError as error:
        print("rejected:", error)
    else:
        raise RuntimeError("invalid parameter accepted")
```

{% note success flat %}
精确输出先显示 `top_p=1 → A/B/STOP`、`top_p=0.8 → A/B`，temperature `0.5/1.0` 下首项概率为 `0.867/0.665`；固定 seed 生成六个 A 后以长度停止，STOP 专用分布立即停止。四条 JSON 记录的成功任务成本依次为 `150/200/300/300` 合成单位，toy 量化 MSE 为 `0.0123`；末尾依次拒绝 temperature 0、top-p 1.1、batch 0 和成功数 0。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
candidates {'top_p_1': ['A', 'B', 'STOP'], 'top_p_0.8': ['A', 'B']}
probability 0.867 0.665
sample (['A', 'A', 'A', 'A', 'A', 'A'], 'length-limit') stopped ([], 'stop-token')
resources [{"batch":1,"bytes":1,"cost_per_success":150.0,"cost_units":150,"input_tokens":120,"name":"short","output_tokens":30,"successes":1,"synthetic_decode_ms":15.0,"synthetic_prefill_ms":2.4},{"batch":4,"bytes":1,"cost_per_success":200.0,"cost_units":600,"input_tokens":120,"name":"batch-with-failure","output_tokens":30,"successes":3,"synthetic_decode_ms":60.0,"synthetic_prefill_ms":9.6},{"batch":1,"bytes":1,"cost_per_success":300.0,"cost_units":300,"input_tokens":240,"name":"long","output_tokens":60,"successes":1,"synthetic_decode_ms":30.0,"synthetic_prefill_ms":4.8},{"batch":1,"bytes":2,"cost_per_success":300.0,"cost_units":300,"input_tokens":120,"name":"two-byte","output_tokens":30,"successes":1,"synthetic_decode_ms":15.0,"synthetic_prefill_ms":2.4}]
quant_mse 0.0123
rejected: invalid sampling parameter
rejected: invalid sampling parameter
rejected: resource fields must be positive and successes <= batch
rejected: resource fields must be positive and successes <= batch
```
{% endfolding %}

## 失败边界

{% note warning flat %}
说 temperature 改变模型智力；把 RLHF 等同事实校验；把量化说成只减体积且必不损失质量；用理想算术冒充硬件吞吐测试；只看连续批处理的平均吞吐，就声称每个请求的 TTFT 与 ITL 都改善。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 控制变量 | 只改 temperature 或精度之一 | 同时换模型与输入 |
| 指标边界 | MSE 只描述 toy 权重误差 | 推断任务准确率 |
| 性能结论 | 真实测试绑定 checkpoint、引擎、硬件与数据集 | 只报参数量 |
| 调度取舍 | 同报 TTFT、ITL、吞吐及请求长度分布 | 只报平均吞吐 |

## 结果验证

{% note success flat %}
预期输出应覆盖 temperature/top-p、固定 seed、STOP 与长度停止、Token/batch/精度矩阵和 toy 量化 MSE，并拒绝 batch 为零。这组算术不模拟调度；真实连续批处理测试必须绑定 checkpoint、引擎、硬件、到达过程、请求长度分布，并同时报告 TTFT、ITL 与吞吐。
{% endnote %}

- 分开记录离线权重更新与请求时固定权重执行。
- 采样记录 temperature、top-p、seed 和停止条件。
- 量化前后用目标任务评测，不用 toy MSE 外推质量。
- 区分静态批次换批与连续批处理的迭代级接纳，记录吞吐收益是否以 TTFT 或 ITL 为代价。

## 常见问题

{% flashcard_ref id="a02-generation-variability" %}

{% flashcard_ref id="a02-temperature-vs-topp" %}

{% flashcard basic id:foundation-quantization deck:"AI 与大模型基础" priority:2 tags:"训练与推理,基础机制" %}
--- question
量化为什么可能影响质量？
--- answer
较少比特会引入舍入与裁剪误差，误差经过多层计算可能改变输出分布。
--- explanation
真实影响取决于量化算法、校准数据、层、模型、推理引擎和任务。应在同一 checkpoint 与任务集上比较原精度和量化版本的质量、显存、延迟及吞吐；文件更小不证明目标质量不变。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Attention Is All You Need, https://arxiv.org/abs/1706.03762v1, https://arxiv.org/favicon.ico %}
{% link OpenAI Models and API documentation, https://platform.openai.com/docs/models, https://developers.openai.com/favicon.png %}
{% link InstructGPT, https://arxiv.org/abs/2203.02155, https://arxiv.org/favicon.ico %}
{% link Chinchilla Scaling Laws, https://arxiv.org/abs/2203.15556, https://arxiv.org/favicon.ico %}
{% link GPTQ, https://arxiv.org/abs/2210.17323, https://arxiv.org/favicon.ico %}
{% link vLLM and PagedAttention, https://arxiv.org/abs/2309.06180v1, https://arxiv.org/favicon.ico %}
{% endlinkgroup %}

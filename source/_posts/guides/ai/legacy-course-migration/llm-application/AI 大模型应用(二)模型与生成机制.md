---
title: AI 大模型应用(二)模型与生成机制
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 完成一组固定种子、温度和 top-p 的对照实验，能记录并解释输出差异。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 2
published: false
abbrlink: '91821408'
date: 2026-07-03 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：解释同一输入为何可能产生不同输出，并建立生成过程、采样和能力边界的直觉模型。 最终要留下：完成一组固定种子、温度和 top-p 的对照实验，能记录并解释输出差异。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 生成过程

{% note primary flat %}
生成不是一次性查表，而是逐 token 从候选分布中选择；temperature、top-p、seed 和停止条件共同决定可观察的输出。 在“生成过程”这一环节负责定义：先固定logits，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| logits | safe=0.70, risky=0.20, stop=0.10 | 逐步记录候选概率 | 不能推出真实业务正确 |
| temperature | 0.2 与 1.0 | 低温更集中，高温更分散 | 不能消除事实错误 |
| stop | stop token 与 max steps | 验证是否按预算结束 | 不能把截断当完成 |
| 定义边界 | 生成过程 | 固定 logits 下 greedy 只选 safe，随机采样可能在第二步选到 risky；两种结果都应记录参数。 | 只换采样参数，不同时改变输入和模型；没有固定 seed 时不能比较两次输出差异。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[logits]
  F --> A[生成过程]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「logits」设为「safe=0.70, risky=0.20, stop=0.10」，同时固定「temperature」为「0.2 与 1.0」；计算候选分布并记录每一步，记录逐步记录候选概率。
- 只改变「stop」：正常值用「stop token 与 max steps」，越界或故障按“不能把截断当完成”构造；观察低温更集中，高温更分散，不要改动其余输入。
- 用验证是否按预算结束检查“生成过程”：固定 logits 下 greedy 只选 safe，随机采样可能在第二步选到 risky；两种结果都应记录参数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：只换采样参数，不同时改变输入和模型；没有固定 seed 时不能比较两次输出差异。 用固定 logits 和 20 步生成日志比较 greedy、beam、temperature 与 top-p，验证停止和预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 采样策略

{% note info flat %}
生成不是一次性查表，而是逐 token 从候选分布中选择；temperature、top-p、seed 和停止条件共同决定可观察的输出。 在“采样策略”这一环节负责执行：先固定temperature，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：采样策略**
1. 入口：temperature=0.2 与 1.0，先记录低温更集中，高温更分散。
2. 转移：由stop=stop token 与 max steps进入采样策略，只允许声明的动作。
3. 出口：用逐步记录候选概率检查logits，越界条件是“不能推出真实业务正确”。
{% endnote %}

- 执行正常路径：把「temperature」设为「0.2 与 1.0」，同时固定「stop」为「stop token 与 max steps」；计算候选分布并记录每一步，记录低温更集中，高温更分散。
- 只改变「logits」：正常值用「safe=0.70, risky=0.20, stop=0.10」，越界或故障按“不能推出真实业务正确”构造；观察验证是否按预算结束，不要改动其余输入。
- 用逐步记录候选概率检查“采样策略”：固定 logits 下 greedy 只选 safe，随机采样可能在第二步选到 risky；两种结果都应记录参数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：只换采样参数，不同时改变输入和模型；没有固定 seed 时不能比较两次输出差异。 用固定 logits 和 20 步生成日志比较 greedy、beam、temperature 与 top-p，验证停止和预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 能力边界

{% note info flat %}
生成不是一次性查表，而是逐 token 从候选分布中选择；temperature、top-p、seed 和停止条件共同决定可观察的输出。 在“能力边界”这一环节负责故障：先固定stop，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：stop token 与 max steps | stop | 验证是否按预算结束 | 不能把截断当完成 |
| 边界：safe=0.70, risky=0.20, stop=0.10 | logits | 逐步记录候选概率 | 不能推出真实业务正确 |
| 故障：0.2 与 1.0 | temperature | 低温更集中，高温更分散 | 不能消除事实错误 |

- 注入边界：把「stop」设为「stop token 与 max steps」，同时固定「logits」为「safe=0.70, risky=0.20, stop=0.10」；计算候选分布并记录每一步，记录验证是否按预算结束。
- 只改变「temperature」：正常值用「0.2 与 1.0」，越界或故障按“不能消除事实错误”构造；观察逐步记录候选概率，不要改动其余输入。
- 用低温更集中，高温更分散检查“能力边界”：固定 logits 下 greedy 只选 safe，随机采样可能在第二步选到 risky；两种结果都应记录参数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：只换采样参数，不同时改变输入和模型；没有固定 seed 时不能比较两次输出差异。 用固定 logits 和 20 步生成日志比较 greedy、beam、temperature 与 top-p，验证停止和预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 动手推演

{% note info flat %}
生成不是一次性查表，而是逐 token 从候选分布中选择；temperature、top-p、seed 和停止条件共同决定可观察的输出。 在“动手推演”这一环节负责复核：先固定logits，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（动手推演）：输入为「safe=0.70, risky=0.20, stop=0.10」；状态观察为「低温更集中，高温更分散」；独立判定使用「验证是否按预算结束」。记录固定 logits 下 greedy 只选 safe，随机采样可能在第二步选到 risky；两种结果都应记录参数，把“只换采样参数，不同时改变输入和模型；没有固定 seed 时不能比较两次输出差异。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：固定 logits 下 greedy 只选 safe，随机采样可能在第二步选到 risky；两种结果都应记录参数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
import math, random
logits={"safe":2.0,"risky":1.0,"stop":0.0}
def distribution(temperature,top_p=1.0):
    assert temperature>0 and 0<top_p<=1
    peak=max(logits.values())
    raw={k:math.exp((v-peak)/temperature) for k,v in logits.items()}
    total=sum(raw.values()); ranked=sorted(((k,v/total) for k,v in raw.items()),key=lambda x:x[1],reverse=True)
    kept=[]; cumulative=0
    for item in ranked:
        kept.append(item); cumulative+=item[1]
        if cumulative>=top_p: break
    norm=sum(p for _,p in kept)
    return [(k,p/norm) for k,p in kept]
def sample(seed,temperature,top_p):
    rng=random.Random(seed); tokens=[]
    for _ in range(20):
        dist=distribution(temperature,top_p)
        choice=rng.choices([k for k,_ in dist],[p for _,p in dist])[0]
        tokens.append(choice)
        if choice=="stop": break
    return tokens
low=distribution(0.2); high=distribution(1.0); nucleus=distribution(1.0,0.8)
print({"low":low,"high":high,"top_p":nucleus,"sampled":sample(7,1.0,0.8)})
assert low[0][1]>high[0][1] and len(nucleus)<len(high)
assert sample(7,1.0,0.8)==sample(7,1.0,0.8) and len(sample(7,1.0,0.8))<=20
# 预期观察：固定 logits 下 greedy 只选 safe，随机采样可能在第二步选到 risky；两种结果都应记录参数。
```

{% note success flat %}
失败边界：只换采样参数，不同时改变输入和模型；没有固定 seed 时不能比较两次输出差异。 用固定 logits 和 20 步生成日志比较 greedy、beam、temperature 与 top-p，验证停止和预算。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a02-generation-variability deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
怎样用固定 logits 验证采样输出差异？
--- answer
固定输入、logits、实现、seed 与生成预算，只改一个采样参数，再比较概率、候选集、序列和停止原因。
--- explanation
先对同一组 logits 分别计算低温与高温的 softmax，确认低温让高分项占比更高；再保持输入、实现、seed、top-p 和生成预算不变重复采样，序列才有复现与比较意义。越界 temperature 或 top-p 应明确失败；停止 Token 与长度上限要分开记录。这个夹具只验证采样机制，不把更随机或更确定外推为质量更高。
{% endflashcard %}

{% flashcard basic id:a02-temperature-vs-topp deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
temperature 与 top-p 分别改变什么，怎样做可比实验？
--- answer
temperature 改变概率分布的尖锐程度；top-p 按累计概率截断候选集。固定其他变量后逐项比较。
--- explanation
生成路径是 `logits → temperature 缩放 → softmax → top-p 截断并重新归一化 → 采样 → 停止检查`。Temperature 作用于整组 logits 的相对差异，top-p 决定哪些候选仍可被采样。实验应固定输入、logits、实现、seed 与预算，每次只改一个参数，并记录首项概率、候选集合、输出序列和停止原因；这些观察不能单独证明任务质量更高。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://www.gstatic.com/devrel-devsite/prod/vdc800838fb8be04a9a7685606311d18c65800504bccf261551968ac74bffd42e/googledevai/images/favicon-new.png %}
{% link JSON Schema specification, https://json-schema.org/specification, https://json-schema.org/favicon.ico %}
{% endlinkgroup %}

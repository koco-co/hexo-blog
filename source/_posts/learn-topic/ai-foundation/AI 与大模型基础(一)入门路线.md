---
title: "AI 与大模型基础(一)入门路线"
tags:
  - AI 与大模型基础
categories:
  - Learn Topic
  - AI 与大模型基础
description: "从 AI 历史、模型机制和能力边界出发，能够比较主流模型、读懂 Benchmark，并为具体任务形成可解释的选型记录。"
cover: /img/picgo-images/ai-foundation-course-cover.png
series: "AI 与大模型基础"
series_order: 1
published: true
abbrlink: 270988ed
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
从 AI 历史、模型机制和能力边界出发，能够比较主流模型、读懂 Benchmark，并为具体任务形成可解释的选型记录。

课程范围：历史与机制、模型行为与模态、厂商、评测与选型、时间线与行业边界。正式文章分别通过图解、实验和可观察证据完成学习闭环。
{% endnote %}

## 前置条件

| 分类 | 要求 | 缺少时怎么办 |
| --- | --- | --- |
| 硬前置 | 能阅读中文技术文档，并能在自己的电脑上保存文本文件 | 先熟悉文件与目录操作 |
| 开课检查 | Python 3 与基本命令行 | 使用系统包管理器或 Python 官方安装说明补齐 |
| 随课补齐 | Git、HTTP/JSON 基础 | 遇到相应章节时完成最小练习 |
| 可选拓展 | 真实模型 API 与云端账号 | 不影响本地实验；只在读者主动配置后使用 |

{% note info flat %}
课程实验只依赖 Python 3 标准库。真实服务不是前置条件，也不会在示例中自动联网。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  P1[历史与机制]
  P2[模型行为与模态]
  P3[厂商、评测与选型]
  P4[时间线与行业边界]
  P1 --> P2
  P2 --> P3
  P3 --> P4
{% endmermaid %}

{% note info flat %}
按阶段顺序阅读：历史与机制 → 模型行为与模态 → 厂商、评测与选型 → 时间线与行业边界。每篇以实验输出或验收表判断是否可以继续。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | AI 与大模型基础(一)入门路线 | 从 AI 历史、模型机制和能力边界出发，能够比较主流模型、读懂 Benchmark，并为具体任务形成可解释的选型记录。 | 无 | 入口 |
| 2 | AI 与大模型基础(二)AI历史与技术转折 | 能用论文和官方发布记录解释 AI、深度学习、Transformer 和生成式 AI 的关键转折。 | 无 | 未发布 |
| 3 | AI 与大模型基础(三)神经网络与Transformer | 能从输入、表示、注意力和层叠结构解释 Transformer 的基本生成过程。 | AI历史与技术转折 | 未发布 |
| 4 | AI 与大模型基础(四)Token与Embedding | 能解释文本如何变成 Token 和向量，并识别分词、语言和相似度的限制。 | 神经网络与Transformer | 未发布 |
| 5 | AI 与大模型基础(五)Attention与Context | 能解释注意力、上下文窗口、KV Cache 和长上下文退化。 | Token与Embedding | 未发布 |
| 6 | AI 与大模型基础(六)训练与推理 | 能区分预训练、微调、对齐、推理、量化和 Scaling 的作用。 | Attention与Context | 未发布 |
| 7 | AI 与大模型基础(七)Reasoning与模型行为 | 能区分普通生成、推理模型、工具轨迹、幻觉和不确定性。 | 训练与推理 | 未发布 |
| 8 | AI 与大模型基础(八)多模态与生成 | 能区分文本、图像、音频、视频、扩散生成及其输入输出边界。 | Reasoning与模型行为 | 未发布 |
| 9 | AI 与大模型基础(九)模型与厂商 | 能从能力、接口、部署、价格、隐私和生态比较 Claude、GPT、Grok、Gemini、DeepSeek、Kimi、GLM、Qwen。 | 多模态与生成 | 未发布 |
| 10 | AI 与大模型基础(十)Benchmark与评测 | 能读懂基准数据、指标、污染、方差和榜单与实际体验的差异。 | 模型与厂商 | 未发布 |
| 11 | AI 与大模型基础(十一)模型选型与部署 | 能根据质量、速度、成本、隐私和部署条件形成可复查的模型决策。 | Benchmark与评测 | 未发布 |
| 12 | AI 与大模型基础(十二)模型与Agent时间线 | 能使用论文、官方公告和源码记录梳理模型与 Agent 的发布时间线。 | 模型选型与部署 | 未发布 |
| 13 | AI 与大模型基础(十三)行业影响与边界 | 能分析 AI 的生产力收益、岗位变化、组织风险和负责任使用边界。 | 模型与Agent时间线 | 未发布 |

## 开始学习

{% note primary flat %}
先完成本地环境检查。练习应保留输入、命令、输出、失败分类和复测条件；不要把在线调用结果当作本地实验的必需条件。
{% endnote %}

```bash
python3 --version
python3 -c 'import json, math; print("stdlib-ok")'
```

{% note success flat %}
两条命令都应以状态码 0 结束，第二条输出 `stdlib-ok`。若命令不存在，先安装 Python 3；不要改为未经说明的在线执行环境。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link Attention Is All You Need, https://arxiv.org/abs/1706.03762v1, https://arxiv.org/favicon.ico %}
{% link Denoising Diffusion Probabilistic Models, https://arxiv.org/abs/2006.11239v1, https://arxiv.org/favicon.ico %}
{% link Stanford AI Index 2025, https://hai.stanford.edu/ai-index/2025-ai-index-report/economy, https://hai.stanford.edu/favicon.ico %}
{% link Introducing ChatGPT, https://openai.com/index/chatgpt/, https://developers.openai.com/favicon.png %}
{% link OpenAI Models and API documentation, https://platform.openai.com/docs/models, https://developers.openai.com/favicon.png %}
{% link HELM 与公开评测资料, https://crfm.stanford.edu/helm/latest/, https://www.stanford.edu/favicon.ico %}
{% endlinkgroup %}

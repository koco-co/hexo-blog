---
title: AI 与大模型基础(二)AI历史与技术转折
tags:
  - AI 与大模型基础
  - AI历史与技术转折
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能用论文和官方发布记录解释 AI、深度学习、Transformer 和生成式 AI 的关键转折。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 2
published: false
abbrlink: 3330f9c9
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：用论文、实验和发布记录区分研究工件、实验能力、产品发布、产品可用与采用证据五类记录。历史解释另作为带主张强度的派生记录；本地事件账本会拒绝伪造日期精度、跨类结论和缺少可用范围的记录，但不会替代史料阅读。
{% endnote %}

## 机制模型

<!-- concept-story:start -->

一名编辑要给“Transformer 改变了 AI”配日期。他先填 2022 年，因为那一年聊天产品进入公众视野；同事却拿出 2017 年论文。若把两者合并，读者会误以为论文当天就已有同样的产品、训练规模与采用范围。编辑于是为研究工件、实验能力、产品发布、产品可用与采用证据五类记录分别留一行，缺哪一类就不跨类下结论；“技术转折”则另写成带主张强度的历史解释。

<!-- concept-story:end -->

{% note info flat %}
历史阶段不是互相替换的口号。符号主义主要把知识和推理写成显式符号与规则，瓶颈是知识获取、维护与开放环境鲁棒性；统计学习从数据中估计参数，改善了手写规则难覆盖的变化，却依赖特征、数据分布与任务定义；深度学习用多层参数表示和端到端梯度优化减少手工特征；生成式 AI 学习数据分布并生成新序列或媒体，但输出仍不是事实证明。
{% endnote %}

{% mermaid %}
timeline
  title 研究工件与产品事件
  1955-08-31 : Dartmouth proposal（提案）
  1956 : Dartmouth research project（项目）
  1986 : Learning representations by back-propagating errors（论文）
  2012 : AlexNet（会议论文与实验结果）
  2017-06-12 : Transformer（arXiv v1）
  2020-06-19 : DDPM（arXiv v1）
  2022-11-30 : ChatGPT（research preview）
{% endmermaid %}

{% note primary flat %}
时间先后只建立 chronology，不建立因果。AlexNet 论文直接支持其架构与 ImageNet 实验，ChatGPT 公告直接支持研究预览发布；“领域转折”或“采用扩大”必须另有综述、采用数据或产业报告支持，不能从产品发布日期直接推出。
{% endnote %}

{% note info flat %}
采用证据也要限定观察对象和时间。Stanford AI Index 2025 的 Economy 章节记录：2024 年调查受访者中，报告其组织使用 AI 的比例为 78%（2023 年为 55%）；这是调查样本中的组织使用记录，不是全球采用率，也不能归因于某一次发布。它与研究工件、实验能力、产品发布、产品可用四类记录分别保存。
{% endnote %}

| 节点 | 之前的约束 | 机制与直接证据 | 不能推出 |
| --- | --- | --- | --- |
| 1955/1956 Dartmouth | 研究议题分散且名称未统一 | 原始提案列出让机器使用语言、抽象与改进自身等研究目标 | 它是唯一 AI 起点 |
| 1986 backprop paper | 多层网络难以把输出误差分配给早期参数 | 论文用链式梯度传播学习内部表示，并在文中任务上展示结果 | 此前从无相关思想 |
| 2012 AlexNet | ImageNet 大规模分类中，手工特征与传统管线受限 | 论文报告深层卷积网络在 ILSVRC-2012 测试集的 top-5 error 15.3%，对照第二名 26.2% | 它发明了 CNN 或深度学习 |
| 2017 Transformer | 循环序列模型限制训练路径并行度 | 论文以自注意力替代循环与卷积主干，并报告翻译质量、训练成本和并行性 | 当天已有聊天产品 |
| 2020 DDPM | 高质量生成需要不同于自回归逐 token 的路线 | 论文学习反向去噪过程，从噪声逐步恢复样本并报告图像结果 | 生成模型始于扩散模型 |
| 2022 ChatGPT | 研究模型与公众交互产品不是同一证据层 | 官方公告支持 research preview 的产品可用事件 | 单独证明广泛采用或宏观影响 |

{% note warning flat %}
深度学习与生成式建模是相交维度，不是前者被后者替代。现代生成系统常由深度网络实现；生成模型也早于当前“生成式 AI”产品浪潮。
{% endnote %}

## 核心边界

{% note info flat %}
用事件账本校验主张、日期精度、事件类型、工件版本、可用范围、来源与事实强度。事实、解释和待核验项必须分开；脚本只检查记录自洽，来源是否支持主张仍需逐项阅读。
{% endnote %}

{% folding purple, 展开机制辨析 %}
把研究工件、实验能力、产品发布、产品可用与采用证据分成五类记录。它们可以恰好发生在同一天，但不得合并为同一事件，也不得互相代用日期。历史解释不是第六类事件，而是引用这些记录、标明 `interpretation` 主张强度的派生记录。只有年份时保存 `year` 精度；排序键可以补齐到年初，但展示值不能伪造月日。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
from datetime import date

rows = [
    {"id":"alexnet-paper", "record_type":"evidence", "date":"2012", "precision":"year", "kind":"paper",
     "claim_layer":"research-artifact", "claim":"NeurIPS 2012 paper exists",
     "version":"NeurIPS 2012 paper", "availability":"paper audience", "level":"fact",
     "url":"https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks"},
    {"id":"alexnet-result", "record_type":"evidence", "date":"2012", "precision":"year", "kind":"capability",
     "claim_layer":"experimental-capability", "claim":"paper reports ILSVRC-2012 result",
     "version":"reported experiment", "availability":"paper evaluation scope", "level":"fact",
     "url":"https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks"},
    {"id":"transformer", "record_type":"evidence", "date":"2017-06-12", "precision":"day", "kind":"paper",
     "claim_layer":"research-artifact", "claim":"arXiv v1 presents attention-only sequence model",
     "version":"arXiv v1", "availability":"paper audience", "level":"fact",
     "url":"https://arxiv.org/abs/1706.03762v1"},
    {"id":"chatgpt-release", "record_type":"evidence", "date":"2022-11-30", "precision":"day", "kind":"release",
     "claim_layer":"product-release", "claim":"OpenAI announces ChatGPT research preview",
     "version":"research preview", "availability":"release announcement", "level":"fact",
     "url":"https://openai.com/index/chatgpt/"},
    {"id":"chatgpt-availability", "record_type":"evidence", "date":"2022-11-30", "precision":"day", "kind":"availability",
     "claim_layer":"product-availability", "claim":"research preview is available on the web",
     "version":"research preview", "availability":"public web preview", "level":"fact",
     "url":"https://openai.com/index/chatgpt/"},
    {"id":"adoption-survey-2024", "record_type":"evidence", "date":"2024", "precision":"year", "kind":"adoption",
     "claim_layer":"adoption", "claim":"Stanford AI Index reports 78% of survey respondents said their organizations used AI in 2024",
     "version":"Stanford AI Index 2025, Economy", "availability":"survey respondents; organization-level AI use",
     "level":"fact", "url":"https://hai.stanford.edu/ai-index/2025-ai-index-report/economy"},
    {"id":"adoption-global", "record_type":"evidence", "date":"Unknown", "precision":"unknown", "kind":"adoption",
     "claim_layer":"adoption", "claim":"global adoption attributable to one release",
     "version":"Unknown", "availability":"Unknown", "level":"needs-verification",
     "url":"https://openai.com/index/chatgpt/"},
    {"id":"transformer-turn", "record_type":"derived-claim", "date":"2017", "precision":"year", "kind":None,
     "claim_layer":"historical-interpretation", "claim":"Transformer was a technical turn",
     "version":"bounded interpretation", "availability":"requires later evidence",
     "level":"interpretation", "url":"https://arxiv.org/abs/1706.03762v1"},
]
required = {"id","record_type","date","precision","kind","claim_layer","claim","version",
            "availability","level","url"}
allowed_precision = {"year","day","unknown"}
allowed_record_type = {"evidence","derived-claim"}
allowed_kind = {"paper","capability","release","availability","adoption"}
allowed_level = {"fact","interpretation","needs-verification"}
allowed_claim_layer = {"research-artifact","experimental-capability","product-release",
                       "product-availability","adoption","historical-interpretation"}
kind_claim_layer = {"paper":"research-artifact", "capability":"experimental-capability",
                    "release":"product-release", "availability":"product-availability",
                    "adoption":"adoption"}
source_precision = {"alexnet-paper":"year", "alexnet-result":"year", "transformer":"day",
                    "chatgpt-release":"day", "chatgpt-availability":"day",
                    "adoption-survey-2024":"year", "adoption-global":"unknown",
                    "transformer-turn":"year"}
oracle_fields = ("record_type","date","precision","kind","claim_layer","claim","version","availability","level","url")
source_oracles = {
    "alexnet-paper": ("evidence","2012","year","paper","research-artifact","NeurIPS 2012 paper exists",
                       "NeurIPS 2012 paper","paper audience","fact","https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks"),
    "alexnet-result": ("evidence","2012","year","capability","experimental-capability","paper reports ILSVRC-2012 result",
                        "reported experiment","paper evaluation scope","fact","https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks"),
    "transformer": ("evidence","2017-06-12","day","paper","research-artifact","arXiv v1 presents attention-only sequence model",
                    "arXiv v1","paper audience","fact","https://arxiv.org/abs/1706.03762v1"),
    "chatgpt-release": ("evidence","2022-11-30","day","release","product-release","OpenAI announces ChatGPT research preview",
                        "research preview","release announcement","fact","https://openai.com/index/chatgpt/"),
    "chatgpt-availability": ("evidence","2022-11-30","day","availability","product-availability","research preview is available on the web",
                             "research preview","public web preview","fact","https://openai.com/index/chatgpt/"),
    "adoption-survey-2024": ("evidence","2024","year","adoption","adoption","Stanford AI Index reports 78% of survey respondents said their organizations used AI in 2024",
                 "Stanford AI Index 2025, Economy","survey respondents; organization-level AI use","fact","https://hai.stanford.edu/ai-index/2025-ai-index-report/economy"),
    "adoption-global": ("evidence","Unknown","unknown","adoption","adoption","global adoption attributable to one release",
                 "Unknown","Unknown","needs-verification","https://openai.com/index/chatgpt/"),
    "transformer-turn": ("derived-claim","2017","year",None,"historical-interpretation","Transformer was a technical turn",
                         "bounded interpretation","requires later evidence","interpretation",
                         "https://arxiv.org/abs/1706.03762v1"),
}

def validate(items):
    if len({row.get("id") for row in items}) != len(items):
        raise ValueError("duplicate id")
    for row in items:
        if not required <= row.keys() or not row["url"].startswith("https://"):
            raise ValueError("missing field")
        if (row["precision"] not in allowed_precision or row["record_type"] not in allowed_record_type
                or row["level"] not in allowed_level
                or row["claim_layer"] not in allowed_claim_layer):
            raise ValueError("unknown enum")
        if row["record_type"] == "evidence":
            if row["kind"] not in allowed_kind or kind_claim_layer[row["kind"]] != row["claim_layer"]:
                raise ValueError("claim layer does not match evidence category")
        elif (row["kind"] is not None or row["claim_layer"] != "historical-interpretation"
              or row["level"] != "interpretation"):
            raise ValueError("invalid derived interpretation")
        if row["precision"] == "year" and not (len(row["date"]) == 4 and row["date"].isdigit()):
            raise ValueError("false year precision")
        if row["precision"] == "day":
            date.fromisoformat(row["date"])
        if row["precision"] == "unknown" and row["date"] != "Unknown":
            raise ValueError("unknown precision has a date")
        if row["level"] == "fact" and "Unknown" in {row["version"], row["availability"]}:
            raise ValueError("fact lacks artifact scope")
        if row["level"] == "needs-verification" and "Unknown" not in {row["date"], row["version"], row["availability"]}:
            raise ValueError("deferred row hides no unknown")
        if source_precision.get(row["id"]) != row["precision"]:
            raise ValueError("precision exceeds source evidence")
        if source_oracles.get(row["id"]) != tuple(row[key] for key in oracle_fields):
            raise ValueError("event identity exceeds source evidence")
    return items

validated = validate(rows)
print([(row["id"], row["precision"], row["kind"], row["level"]) for row in validated])
evidence_layers = {row["claim_layer"] for row in rows if row["record_type"] == "evidence"}
assert evidence_layers == {"research-artifact", "experimental-capability", "product-release",
                           "product-availability", "adoption"}
adoption_rows = [row for row in rows if row["kind"] == "adoption"]
assert {row["level"] for row in adoption_rows} == {"fact", "needs-verification"}
assert sum(row["record_type"] == "derived-claim" for row in rows) == 1
assert "interpretation" not in allowed_kind

negative_cases = [
    {key:value for key,value in rows[0].items() if key != "availability"},
    {**rows[0], "kind":"capability", "claim_layer":"experimental-capability"},
    {**rows[1], "kind":"paper", "claim_layer":"research-artifact"},
    {**rows[2], "kind":"release", "claim_layer":"product-release"},
    {**rows[3], "kind":"availability", "claim_layer":"product-availability"},
    {**rows[4], "level":"needs-verification"},
    {**rows[5], "date":"2024-01-01", "precision":"day"},
    {**rows[0], "date":"2012-08-31", "precision":"day"},
]
for bad in negative_cases:
    try:
        validate([bad])
    except ValueError as error:
        print("rejected:", error)
    else:
        raise RuntimeError("unsupported event accepted")
```

{% note success flat %}
精确输出分别列出 AlexNet 论文工件与实验结果、Transformer 论文、ChatGPT 发布与 Web 可用范围、2024 年调查采用事实、待核验的全球采用主张，以及有边界的历史解释。随后拒绝缺字段、跨证据层改写、强度改写、隐藏延期未知值和伪造日期精度；每条冻结身份 Oracle 都精确绑定记录类型、证据类别、主张层、日期精度、版本、范围、强度和 URL。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
[('alexnet-paper', 'year', 'paper', 'fact'), ('alexnet-result', 'year', 'capability', 'fact'), ('transformer', 'day', 'paper', 'fact'), ('chatgpt-release', 'day', 'release', 'fact'), ('chatgpt-availability', 'day', 'availability', 'fact'), ('adoption-survey-2024', 'year', 'adoption', 'fact'), ('adoption-global', 'unknown', 'adoption', 'needs-verification'), ('transformer-turn', 'year', None, 'interpretation')]
rejected: missing field
rejected: event identity exceeds source evidence
rejected: event identity exceeds source evidence
rejected: event identity exceeds source evidence
rejected: event identity exceeds source evidence
rejected: deferred row hides no unknown
rejected: precision exceeds source evidence
rejected: precision exceeds source evidence
```
{% endfolding %}

## 失败边界

{% note warning flat %}
把“首次”“爆火”或“改变格局”写成事实，却没有定义范围、指标和一手证据；把研究工件、实验能力、产品发布、产品可用与采用证据五类记录混成一个日期，或把历史解释伪装成事件事实。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 证据类别 | 每行明确 research-artifact、experimental-capability、product-release、product-availability 或 adoption | 只有日期或混合类别 |
| 来源 | 最终 URL 可访问且直接支持表述 | 二手摘要替代一手资料 |
| 措辞 | 结论不超过来源范围 | 把厂商宣传改写成普遍事实 |

## 结果验证

{% note success flat %}
预期输出应以独立正例覆盖研究工件、实验能力、产品发布、产品可用与采用五类记录，同时覆盖 `fact`、`interpretation` 与 `needs-verification` 三种强度；同一采用类别同时保留已来源支持的事实和范围未定的待核验主张，证明类别与强度互相独立。跨层改写、强度篡改和虚构日期精度必须被精确身份 Oracle 拒绝。读者还要逐项打开最终 URL，核对来源日期、版本和正文主张；本地 schema 不能替代史料阅读。
{% endnote %}

- 分别说明每条来源直接证明的事实与正文解释。
- 把研究工件、实验能力、产品发布、产品可用与采用证据五类内容放在不同记录中。
- 若只能确认年份，就不要伪造月日。

## 常见问题

{% flashcard basic id:foundation-transformer-turn deck:"AI 与大模型基础" priority:1 tags:"AI历史与技术转折,基础机制" %}
--- question
为什么 Transformer 是技术转折，却不是聊天机器人的诞生？
--- answer
它改变了序列建模的计算结构；聊天产品还依赖规模、数据、训练、对齐、界面和分发。
--- explanation
论文只直接支持架构与实验。证据链应写成“2017 arXiv v1 → 架构与论文实验”，产品链另写“2022 research preview → 当时的公开范围”；中间的规模、训练、对齐与采用都需要各自来源，不能用一条箭头省略。
{% endflashcard %}

{% flashcard basic id:foundation-date-types deck:"AI 与大模型基础" priority:2 tags:"AI历史与技术转折,基础机制" %}
--- question
技术发布日期与产品可用日期怎样区分？
--- answer
为事件记录类型、受众、版本和来源；不同类型不合并。
--- explanation
一条记录至少包含 `event_date | event_type | artifact_version | availability | primary_url`。论文提交说明研究工件出现，公告说明产品发布，API 可用还受账户与区域限制；五列不能互相代填。
{% endflashcard %}

## 参考资料

### 历史与方法

{% linkgroup %}
{% link Dartmouth AI Proposal, https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html, https://www.stanford.edu/favicon.ico %}
{% link Back-propagating Errors, https://www.nature.com/articles/323533a0, https://www.nature.com/oscar-static/images/favicons/nature/favicon-32x32-3fe59ece92.png %}
{% link Stanford AI Philosophy, https://plato.stanford.edu/entries/artificial-intelligence/, https://plato.stanford.edu/favicon.ico %}
{% link Statistical Learning, https://hastie.su.domains/ElemStatLearn/, https://www.stanford.edu/favicon.ico %}
{% endlinkgroup %}

### 技术转折

{% linkgroup %}
{% link AlexNet, https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks, https://papers.nips.cc/favicon.ico %}
{% link Attention Is All You Need, https://arxiv.org/abs/1706.03762v1, https://arxiv.org/favicon.ico %}
{% link DDPM, https://arxiv.org/abs/2006.11239v1, https://arxiv.org/favicon.ico %}
{% link Introducing ChatGPT, https://openai.com/index/chatgpt/, https://developers.openai.com/favicon.png %}
{% endlinkgroup %}

### 采用证据

{% linkgroup %}
{% link Stanford AI Index 2025, https://hai.stanford.edu/ai-index/2025-ai-index-report/economy, https://hai.stanford.edu/favicon.ico %}
{% endlinkgroup %}

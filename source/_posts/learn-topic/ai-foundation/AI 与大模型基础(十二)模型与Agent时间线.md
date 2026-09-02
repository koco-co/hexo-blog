---
title: AI 与大模型基础(十二)模型与Agent时间线
tags:
  - AI 与大模型基础
  - 模型与Agent时间线
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能使用论文、官方公告和源码记录梳理模型与 Agent 的发布时间线。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 12
published: false
abbrlink: a03c6e4a
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把论文、模型发布、产品预览、协议修订、Coding Agent 与 Harness 源码快照分成可追溯事件；发现不到官方事件时保留 Unknown/defer。
{% endnote %}

## 机制模型

{% note info flat %}
模型、Agent loop、Coding Agent、Harness 和协议是不同对象。时间线每个节点必须记录 event_type、availability、artifact_version、source_date 与来源；发布、论文和后续规范修订不得合并为同一事件或相互代用日期。
{% endnote %}

{% mermaid %}
timeline
  title 模型、产品、协议与 Harness 证据线
  2017-06-12 : 论文：Transformer arXiv v1
  2020-06-19 : 论文：DDPM arXiv v1
  2022-11-30 : 产品：ChatGPT research preview
  2024-09-12 : 模型/产品：o1-preview 官方公告
  2024-10-22 : Agent 能力：computer use public beta
  2024-11-25 : 协议：MCP launch announcement
  2024-12-26 : 模型：DeepSeek-V3 release
  2024-12-27 : 论文：DeepSeek-V3 arXiv v1
  2025-01-20 : 模型：DeepSeek-R1 release
  2025-01-22 : 论文：DeepSeek-R1 arXiv v1
  2025-02-24 : Coding Agent：Claude Code research preview
  2025-06-18 : 协议：MCP specification revision
{% endmermaid %}

{% note primary flat %}
时间线只表示具有事件证据的工件日期与类型，不画因果箭头。Agent loop 是“模型决定动作—工具执行—观察结果—继续或停止”的运行结构；computer use 是工具能力，Claude Code 是 Coding Agent 产品，MCP 是协议。DeepSeek-Harness 只有固定提交的源码快照，事件日期仍为 Unknown，因此不放进有日期的历史轴。
{% endnote %}

| 事件日期 | 来源标题 | 来源日期与版本 | 类型 | 工件与交付渠道 | 事实强度与边界 |
| --- | --- | --- | --- | --- | --- |
| 2017-06-12 | Attention Is All You Need | 2017-06-12 / arXiv v1 | paper | Transformer 论文 / paper | 架构研究，不是 Agent 发布 |
| 2020-06-19 | DDPM | 2020-06-19 / arXiv v1 | paper | DDPM 论文 / paper | 扩散生成研究，不是产品可用日 |
| 2022-11-30 | Introducing ChatGPT | 2022-11-30 / research preview | product-preview | ChatGPT / public preview | 支持发布事件，不单独证明广泛采用 |
| 2024-09-12 | Learning to reason with LLMs | 2024-09-12 / announcement | model-preview | o1-preview / limited ChatGPT、API | preview 不等于 GA |
| 2024-10-22 | Computer Use | 2024-10-22 / public beta | agent-capability-beta | computer use / public beta | 实验能力，不等于可靠自治 |
| 2024-11-25 | MCP Launch | 2024-11-25 / launch announcement | protocol-launch | MCP / public protocol | 初始发布与后续规范版本分开 |
| 2024-12-26 | DeepSeek-V3 Release | 2024-12-26 / release | model-release | DeepSeek-V3 / API、开放权重 | 与次日技术报告分开 |
| 2024-12-27 | DeepSeek-V3 Report | 2024-12-27 / arXiv v1 | paper | DeepSeek-V3 report / paper | 论文日期不替代模型可用日 |
| 2025-01-20 | DeepSeek-R1 Release | 2025-01-20 / release | model-release | DeepSeek-R1 / API、开放权重 | 与两日后的论文分开 |
| 2025-01-22 | DeepSeek-R1 Report | 2025-01-22 / arXiv v1 | paper | DeepSeek-R1 paper / paper | 论文日期不替代模型可用日 |
| 2025-02-24 | Claude Code Preview | 2025-02-24 / research preview | coding-agent-preview | Claude Code / limited preview | 后续文档不能替代当时可用范围记录 |
| 2025-06-18 | MCP Specification | 2025-06-18 / specification | spec-revision | MCP / public specification | 不是 MCP 首次发布 |
| Unknown | DeepSeek-Harness Snapshot | Unknown / commit `cd5ef…bbc` | harness-snapshot | DeepSeek-Harness / source snapshot | 提交快照不是官方发布日期 |

## 核心边界

{% note info flat %}
校验冻结时间线记录是否具有事件类型、受众、版本和 HTTPS 来源；同一天可有多个工件，但不得用标题去重。
{% endnote %}

{% folding purple, 展开机制辨析 %}
模型、Agent loop、Coding Agent、Harness 和协议是不同对象。多个工件可以共享日历日期，但事件身份、交付渠道和来源不能合并。来源暂时不可访问时，不能用检查日补事件日；只有带来源日期与版本的直接事件证据才允许把 Unknown 提升为日期，已有记录也必须保留其核验日期和证据边界。
{% endfolding %}

{% note warning flat %}
“重写格局”是结构性、因果性的判断，不是单一事件的同义词。至少要先定义被改变的对象、比较基线、观察窗口和可检验的机制链，再用相互独立的发布事实、受控 benchmark 与跨主体采用数据交叉验证。一次 release 只能证明某工件在特定范围发布或可用；一次 benchmark 只能证明特定版本、任务和条件下的指标差异；一组 adoption 数据只能说明被观测群体在特定窗口的使用变化。它们任何一个单独都不能证明行业结构已经被重写，也不能证明因果关系。
{% endnote %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
from datetime import date
from hashlib import sha256
from urllib.parse import urlparse

RECORD_KINDS = {"event", "discovery"}
EVENT_TYPES = {"paper", "product-preview", "model-preview", "agent-capability-beta",
               "protocol-launch", "model-release", "coding-agent-preview", "spec-revision", "harness-snapshot"}
CHANNELS = {"paper", "public-preview", "limited-chat", "limited-api", "public-beta",
            "public-protocol", "public-api", "open-weights", "limited-preview",
            "public-specification", "source-snapshot"}
STRENGTHS = {"paper", "official-announcement", "official-release", "specification", "source-snapshot"}
STATUSES = {"supported", "deferred"}
REQUIRED = {"record_kind", "id", "source_title", "event_date", "event_type", "artifact", "artifact_version",
            "availability", "source_date", "final_url", "evidence_strength", "status", "defer_reason"}
IDENTITY_FIELDS = ("id", "record_kind", "source_title", "artifact", "event_date", "source_date", "event_type",
                   "artifact_version", "availability", "final_url", "evidence_strength", "status", "defer_reason")

# This independent oracle is the complete ordered ledger. `events` below is the fixture under test.
FROZEN_IDENTITIES = (
    ("transformer-paper", "event", "Attention Is All You Need", "Transformer", "2017-06-12", "2017-06-12", "paper", "arXiv v1", ("paper",), "https://arxiv.org/abs/1706.03762v1", "paper", "supported", None),
    ("ddpm-paper", "event", "DDPM", "DDPM", "2020-06-19", "2020-06-19", "paper", "arXiv v1", ("paper",), "https://arxiv.org/abs/2006.11239v1", "paper", "supported", None),
    ("chatgpt-release", "event", "Introducing ChatGPT", "ChatGPT", "2022-11-30", "2022-11-30", "product-preview", "research preview", ("public-preview",), "https://openai.com/index/chatgpt/", "official-announcement", "supported", None),
    ("openai-o1-release", "event", "Learning to reason with LLMs", "o1-preview", "2024-09-12", "2024-09-12", "model-preview", "announcement", ("limited-chat", "limited-api"), "https://openai.com/index/learning-to-reason-with-llms/", "official-announcement", "supported", None),
    ("anthropic-computer-use", "event", "Computer Use", "computer use", "2024-10-22", "2024-10-22", "agent-capability-beta", "public beta", ("public-beta",), "https://www.anthropic.com/news/3-5-models-and-computer-use", "official-announcement", "supported", None),
    ("mcp-launch", "event", "MCP Launch", "MCP", "2024-11-25", "2024-11-25", "protocol-launch", "launch announcement", ("public-protocol",), "https://www.anthropic.com/news/model-context-protocol", "official-announcement", "supported", None),
    ("deepseek-v3-release", "event", "DeepSeek-V3 Release", "DeepSeek-V3", "2024-12-26", "2024-12-26", "model-release", "release", ("public-api", "open-weights"), "https://api-docs.deepseek.com/news/news1226", "official-release", "supported", None),
    ("deepseek-v3-paper", "event", "DeepSeek-V3 Report", "DeepSeek-V3 report", "2024-12-27", "2024-12-27", "paper", "arXiv v1", ("paper",), "https://arxiv.org/abs/2412.19437v1", "paper", "supported", None),
    ("deepseek-r1-release", "event", "DeepSeek-R1 Release", "DeepSeek-R1", "2025-01-20", "2025-01-20", "model-release", "release", ("public-api", "open-weights"), "https://api-docs.deepseek.com/news/news250120", "official-release", "supported", None),
    ("deepseek-r1-paper", "event", "DeepSeek-R1 Report", "DeepSeek-R1 paper", "2025-01-22", "2025-01-22", "paper", "arXiv v1", ("paper",), "https://arxiv.org/abs/2501.12948v1", "paper", "supported", None),
    ("claude-code-preview", "event", "Claude Code Preview", "Claude Code", "2025-02-24", "2025-02-24", "coding-agent-preview", "research preview", ("limited-preview",), "https://www.anthropic.com/research/claude-3-7-sonnet", "official-announcement", "supported", None),
    ("mcp-spec", "event", "MCP Specification", "MCP", "2025-06-18", "2025-06-18", "spec-revision", "2025-06-18", ("public-specification",), "https://modelcontextprotocol.io/specification/2025-06-18", "specification", "supported", None),
    ("deepseek-harness", "discovery", "DeepSeek-Harness Snapshot", "DeepSeek-Harness", "Unknown", "Unknown", "harness-snapshot", "commit cd5ef8148158c3a752a658978873241fdf8e2bbc", ("source-snapshot",), "https://github.com/deepseek-ai/DeepSeek-Harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc", "source-snapshot", "deferred", "no official release/tag in captured repository index"),
)


def validate_date(value, field):
    try:
        date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValueError(f"invalid {field}") from None


def identity_tuple(row):
    return tuple(tuple(row[field]) if field == "availability" else row[field] for field in IDENTITY_FIELDS)


def ledger_line(index, identity):
    values = list(identity)
    values[8] = ",".join(values[8])
    values[12] = values[12] or "-"
    return "|".join([f"{index:02d}", *map(str, values)])


EXPECTED_LEDGER = tuple(ledger_line(index, identity) for index, identity in enumerate(FROZEN_IDENTITIES, 1))
EXPECTED_LEDGER_DIGEST = "8481c9779657c0538ebeddf24f6ce693f446381ef806fda32e858248c91558da"


def validate_event(row):
    if set(row) != REQUIRED:
        raise ValueError("event field mismatch")
    text_fields = REQUIRED - {"availability", "defer_reason"}
    if any(type(row[field]) is not str or not row[field] for field in text_fields):
        raise ValueError("event text field type mismatch")
    if row["defer_reason"] is not None and (type(row["defer_reason"]) is not str or not row["defer_reason"]):
        raise ValueError("defer reason type mismatch")
    if row["record_kind"] not in RECORD_KINDS:
        raise ValueError("unknown record kind")
    if row["event_type"] not in EVENT_TYPES:
        raise ValueError("unknown event type")
    if row["evidence_strength"] not in STRENGTHS:
        raise ValueError("unknown evidence strength")
    if row["status"] not in STATUSES:
        raise ValueError("unknown event status")
    channels = row["availability"]
    if (type(channels) is not list or not channels or len(channels) != len(set(channels))
            or any(channel not in CHANNELS for channel in channels)):
        raise ValueError("unknown availability channel")
    source = urlparse(row["final_url"])
    if source.scheme != "https" or not source.netloc:
        raise ValueError("final URL must be HTTPS")
    if row["record_kind"] == "event" and row["status"] == "supported":
        validate_date(row["event_date"], "event_date")
        validate_date(row["source_date"], "source_date")
        if row["defer_reason"] is not None:
            raise ValueError("supported event has defer reason")
    elif row["record_kind"] == "discovery" and row["status"] == "deferred":
        if row["event_date"] != "Unknown" or row["source_date"] != "Unknown" or not row["defer_reason"]:
            raise ValueError("deferred discovery must keep Unknown dates")
    else:
        raise ValueError("record kind/status mismatch")


def validate_records(rows):
    ids = [row["id"] for row in rows]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate record id")
    if len(rows) != len(FROZEN_IDENTITIES):
        raise ValueError("record count mismatch")
    for row in rows:
        validate_event(row)
    if [identity_tuple(row) for row in rows] != list(FROZEN_IDENTITIES):
        raise ValueError("timeline identity mismatch")
    ledger = tuple(ledger_line(index, identity_tuple(row)) for index, row in enumerate(rows, 1))
    if ledger != EXPECTED_LEDGER:
        raise ValueError("ordered ledger mismatch")
    digest = sha256("\n".join(ledger).encode()).hexdigest()
    if digest != EXPECTED_LEDGER_DIGEST:
        raise ValueError("ledger digest mismatch")
    return ledger, digest


events = [
    {"record_kind":"event", "id":"transformer-paper", "source_title":"Attention Is All You Need", "event_date":"2017-06-12", "event_type":"paper", "artifact":"Transformer", "artifact_version":"arXiv v1", "availability":["paper"], "source_date":"2017-06-12", "final_url":"https://arxiv.org/abs/1706.03762v1", "evidence_strength":"paper", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"ddpm-paper", "source_title":"DDPM", "event_date":"2020-06-19", "event_type":"paper", "artifact":"DDPM", "artifact_version":"arXiv v1", "availability":["paper"], "source_date":"2020-06-19", "final_url":"https://arxiv.org/abs/2006.11239v1", "evidence_strength":"paper", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"chatgpt-release", "source_title":"Introducing ChatGPT", "event_date":"2022-11-30", "event_type":"product-preview", "artifact":"ChatGPT", "artifact_version":"research preview", "availability":["public-preview"], "source_date":"2022-11-30", "final_url":"https://openai.com/index/chatgpt/", "evidence_strength":"official-announcement", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"openai-o1-release", "source_title":"Learning to reason with LLMs", "event_date":"2024-09-12", "event_type":"model-preview", "artifact":"o1-preview", "artifact_version":"announcement", "availability":["limited-chat","limited-api"], "source_date":"2024-09-12", "final_url":"https://openai.com/index/learning-to-reason-with-llms/", "evidence_strength":"official-announcement", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"anthropic-computer-use", "source_title":"Computer Use", "event_date":"2024-10-22", "event_type":"agent-capability-beta", "artifact":"computer use", "artifact_version":"public beta", "availability":["public-beta"], "source_date":"2024-10-22", "final_url":"https://www.anthropic.com/news/3-5-models-and-computer-use", "evidence_strength":"official-announcement", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"mcp-launch", "source_title":"MCP Launch", "event_date":"2024-11-25", "event_type":"protocol-launch", "artifact":"MCP", "artifact_version":"launch announcement", "availability":["public-protocol"], "source_date":"2024-11-25", "final_url":"https://www.anthropic.com/news/model-context-protocol", "evidence_strength":"official-announcement", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"deepseek-v3-release", "source_title":"DeepSeek-V3 Release", "event_date":"2024-12-26", "event_type":"model-release", "artifact":"DeepSeek-V3", "artifact_version":"release", "availability":["public-api","open-weights"], "source_date":"2024-12-26", "final_url":"https://api-docs.deepseek.com/news/news1226", "evidence_strength":"official-release", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"deepseek-v3-paper", "source_title":"DeepSeek-V3 Report", "event_date":"2024-12-27", "event_type":"paper", "artifact":"DeepSeek-V3 report", "artifact_version":"arXiv v1", "availability":["paper"], "source_date":"2024-12-27", "final_url":"https://arxiv.org/abs/2412.19437v1", "evidence_strength":"paper", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"deepseek-r1-release", "source_title":"DeepSeek-R1 Release", "event_date":"2025-01-20", "event_type":"model-release", "artifact":"DeepSeek-R1", "artifact_version":"release", "availability":["public-api","open-weights"], "source_date":"2025-01-20", "final_url":"https://api-docs.deepseek.com/news/news250120", "evidence_strength":"official-release", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"deepseek-r1-paper", "source_title":"DeepSeek-R1 Report", "event_date":"2025-01-22", "event_type":"paper", "artifact":"DeepSeek-R1 paper", "artifact_version":"arXiv v1", "availability":["paper"], "source_date":"2025-01-22", "final_url":"https://arxiv.org/abs/2501.12948v1", "evidence_strength":"paper", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"claude-code-preview", "source_title":"Claude Code Preview", "event_date":"2025-02-24", "event_type":"coding-agent-preview", "artifact":"Claude Code", "artifact_version":"research preview", "availability":["limited-preview"], "source_date":"2025-02-24", "final_url":"https://www.anthropic.com/research/claude-3-7-sonnet", "evidence_strength":"official-announcement", "status":"supported", "defer_reason":None},
    {"record_kind":"event", "id":"mcp-spec", "source_title":"MCP Specification", "event_date":"2025-06-18", "event_type":"spec-revision", "artifact":"MCP", "artifact_version":"2025-06-18", "availability":["public-specification"], "source_date":"2025-06-18", "final_url":"https://modelcontextprotocol.io/specification/2025-06-18", "evidence_strength":"specification", "status":"supported", "defer_reason":None},
    {"record_kind":"discovery", "id":"deepseek-harness", "source_title":"DeepSeek-Harness Snapshot", "event_date":"Unknown", "event_type":"harness-snapshot", "artifact":"DeepSeek-Harness", "artifact_version":"commit cd5ef8148158c3a752a658978873241fdf8e2bbc", "availability":["source-snapshot"], "source_date":"Unknown", "final_url":"https://github.com/deepseek-ai/DeepSeek-Harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc", "evidence_strength":"source-snapshot", "status":"deferred", "defer_reason":"no official release/tag in captured repository index"},
]
ledger, ledger_digest = validate_records(events)
if [record["event_type"] for record in events if record["artifact"] == "MCP"] != ["protocol-launch", "spec-revision"]:
    raise RuntimeError("MCP events merged")
channel_output = {record["id"]: record["availability"] for record in events if record["id"] in {"deepseek-v3-release", "deepseek-r1-release"}}
print("records", len(events), "events", sum(record["record_kind"] == "event" for record in events), "discoveries", sum(record["record_kind"] == "discovery" for record in events))
print("ledger_columns", "index|id|record_kind|source_title|artifact|event_date|source_date|event_type|artifact_version|channels|final_url|evidence_strength|status|defer_reason")
for line in ledger:
    print(line)
print("ledger_digest", ledger_digest)
print("channels", channel_output)
print("deferred", [(record["id"], record["event_date"], record["source_date"]) for record in events if record["status"] == "deferred"])

for bad_rows, expected in [
    ([*events, {**events[0]}], "duplicate record id"),
    ([{**record, "event_date": "2020-06-20"} if index == 1 else record for index, record in enumerate(events)], "timeline identity mismatch"),
    ([{**record, "source_title": "DDPM (revised)"} if index == 1 else record for index, record in enumerate(events)], "timeline identity mismatch"),
    ([{**record, "event_type": "model-release"} if index == 0 else record for index, record in enumerate(events)], "timeline identity mismatch"),
    ([{**record, "final_url": "https://example.invalid/changed"} if index == 0 else record for index, record in enumerate(events)], "timeline identity mismatch"),
    ([{**record, "availability": ["open-weights", "public-api"]} if index == 6 else record for index, record in enumerate(events)], "timeline identity mismatch"),
]:
    try:
        validate_records(bad_rows)
    except ValueError as error:
        if str(error) != expected:
            raise RuntimeError(f"unexpected identity error: {error}")
        print("rejected:", error)
    else:
        raise RuntimeError("invalid identity accepted")
print("identity-negative", 5)

negative = [
    {**events[0], "event_date": "2017-13-40"},
    {**events[0], "source_date": "not-a-date"},
    {**events[0], "status": "maybe"},
    {**events[0], "record_kind": "finding"},
    {**events[0], "final_url": "http://example.invalid"},
    {**events[0], "evidence_strength": "blog-summary"},
    {**events[0], "availability": ["paper", "unknown-channel"]},
    {**events[-1], "event_date": "2026-08-29"},
]
for bad in negative:
    try:
        validate_event(bad)
    except ValueError as error:
        print("rejected:", error)
    else:
        raise RuntimeError("invalid timeline record accepted")
```

{% note success flat %}
精确输出共 13 条记录：12 条已支持事件与 1 条延期发现；ledger 按固定顺序冻结每条记录的 ID、记录类型、来源标题、工件、事件/来源日期、事件类型、版本、渠道、最终 URL、事实强度、状态和处置理由，并以 SHA-256 digest 复核。DeepSeek-V3/R1 各自保留 `public-api` 与 `open-weights` 两个渠道；负例还覆盖重复 ID、格式合法但身份改变的日期、标题、类型、最终 URL 和渠道变更。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
records 13 events 12 discoveries 1
ledger_columns index|id|record_kind|source_title|artifact|event_date|source_date|event_type|artifact_version|channels|final_url|evidence_strength|status|defer_reason
01|transformer-paper|event|Attention Is All You Need|Transformer|2017-06-12|2017-06-12|paper|arXiv v1|paper|https://arxiv.org/abs/1706.03762v1|paper|supported|-
02|ddpm-paper|event|DDPM|DDPM|2020-06-19|2020-06-19|paper|arXiv v1|paper|https://arxiv.org/abs/2006.11239v1|paper|supported|-
03|chatgpt-release|event|Introducing ChatGPT|ChatGPT|2022-11-30|2022-11-30|product-preview|research preview|public-preview|https://openai.com/index/chatgpt/|official-announcement|supported|-
04|openai-o1-release|event|Learning to reason with LLMs|o1-preview|2024-09-12|2024-09-12|model-preview|announcement|limited-chat,limited-api|https://openai.com/index/learning-to-reason-with-llms/|official-announcement|supported|-
05|anthropic-computer-use|event|Computer Use|computer use|2024-10-22|2024-10-22|agent-capability-beta|public beta|public-beta|https://www.anthropic.com/news/3-5-models-and-computer-use|official-announcement|supported|-
06|mcp-launch|event|MCP Launch|MCP|2024-11-25|2024-11-25|protocol-launch|launch announcement|public-protocol|https://www.anthropic.com/news/model-context-protocol|official-announcement|supported|-
07|deepseek-v3-release|event|DeepSeek-V3 Release|DeepSeek-V3|2024-12-26|2024-12-26|model-release|release|public-api,open-weights|https://api-docs.deepseek.com/news/news1226|official-release|supported|-
08|deepseek-v3-paper|event|DeepSeek-V3 Report|DeepSeek-V3 report|2024-12-27|2024-12-27|paper|arXiv v1|paper|https://arxiv.org/abs/2412.19437v1|paper|supported|-
09|deepseek-r1-release|event|DeepSeek-R1 Release|DeepSeek-R1|2025-01-20|2025-01-20|model-release|release|public-api,open-weights|https://api-docs.deepseek.com/news/news250120|official-release|supported|-
10|deepseek-r1-paper|event|DeepSeek-R1 Report|DeepSeek-R1 paper|2025-01-22|2025-01-22|paper|arXiv v1|paper|https://arxiv.org/abs/2501.12948v1|paper|supported|-
11|claude-code-preview|event|Claude Code Preview|Claude Code|2025-02-24|2025-02-24|coding-agent-preview|research preview|limited-preview|https://www.anthropic.com/research/claude-3-7-sonnet|official-announcement|supported|-
12|mcp-spec|event|MCP Specification|MCP|2025-06-18|2025-06-18|spec-revision|2025-06-18|public-specification|https://modelcontextprotocol.io/specification/2025-06-18|specification|supported|-
13|deepseek-harness|discovery|DeepSeek-Harness Snapshot|DeepSeek-Harness|Unknown|Unknown|harness-snapshot|commit cd5ef8148158c3a752a658978873241fdf8e2bbc|source-snapshot|https://github.com/deepseek-ai/DeepSeek-Harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc|source-snapshot|deferred|no official release/tag in captured repository index
ledger_digest 8481c9779657c0538ebeddf24f6ce693f446381ef806fda32e858248c91558da
channels {'deepseek-v3-release': ['public-api', 'open-weights'], 'deepseek-r1-release': ['public-api', 'open-weights']}
deferred [('deepseek-harness', 'Unknown', 'Unknown')]
rejected: duplicate record id
rejected: timeline identity mismatch
rejected: timeline identity mismatch
rejected: timeline identity mismatch
rejected: timeline identity mismatch
rejected: timeline identity mismatch
identity-negative 5
rejected: invalid event_date
rejected: invalid source_date
rejected: unknown event status
rejected: unknown record kind
rejected: final URL must be HTTPS
rejected: unknown evidence strength
rejected: unknown availability channel
rejected: deferred discovery must keep Unknown dates
```
{% endfolding %}

## 失败边界

{% note warning flat %}
混写论文、公告、API、权重和采用日期；把 MCP 当权限或沙箱；给缺少官方 release/tag 的 DeepSeek Harness 编造精确发布日期。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 类型 | model/product/protocol/revision 分列 | 统一写“发布” |
| 范围 | preview、beta、GA 与受众保留 | 省略可用限制 |
| 强度 | 厂商 claim 明确归属 | 改写成独立结论 |

## 结果验证

{% note success flat %}
预期输出应保持 MCP launch/revision、DeepSeek release/paper 和 API/权重渠道独立。Harness 的提交快照不会被改写成发布日期；来源暂时不可访问时，只能继续使用带核验日期与版本边界的既有事件记录，不能用新的检查日替代事件日。
{% endnote %}

- 模型 release 与论文 arXiv v1 分列。
- preview、beta、GA、权重和源码范围不合并。
- Agent、Coding Agent、Harness 与协议使用不同事件类型。

## 常见问题

{% flashcard basic id:foundation-release-availability deck:"AI 与大模型基础" priority:1 tags:"模型与Agent时间线,基础机制" %}
--- question
发布日期和可用日期为什么要分开？
--- answer
公告说明厂商发布了什么；真实可用还取决于受众、区域、账户、API、权重或源码状态。
--- explanation
研究预览、public beta、API 白名单和开源权重是不同交付边界。一条记录应并列保存公告日期、event type、受众、版本和来源；某地区后续可用不能回填成最初发布日期。
{% endflashcard %}

{% flashcard basic id:foundation-history-claim deck:"AI 与大模型基础" priority:2 tags:"模型与Agent时间线,基础机制" %}
--- question
怎样避免把营销文案写成历史事实？
--- answer
保留厂商归属、原始范围和证据类型；“首次”“领先”需要定义比较集合并有独立证据。
--- explanation
没有预先定义的采用阈值和独立数据时不写“爆火”。不同主张需要不同证据：

| 主张 | 至少需要 | 不能单独证明 |
| --- | --- | --- |
| 发布/可用 | 官方公告、版本、受众与渠道 | 广泛采用或长期可靠 |
| 首次 | 比较集合、排除规则与可复查日期 | 技术领先 |
| 领先 | 指标、基线、版本与同条件比较 | 所有任务更好 |
| 爆火/普及 | 预设采用阈值、时间窗与独立数据 | 因果影响 |

产品宣传、论文实验和第三方采用数据不能互相替代。
{% endflashcard %}

## 参考资料

### 论文

{% linkgroup %}
{% link Attention Is All You Need, https://arxiv.org/abs/1706.03762v1, https://arxiv.org/favicon.ico %}
{% link DDPM, https://arxiv.org/abs/2006.11239v1, https://arxiv.org/favicon.ico %}
{% link DeepSeek-V3 Report, https://arxiv.org/abs/2412.19437v1, https://arxiv.org/favicon.ico %}
{% link DeepSeek-R1 Report, https://arxiv.org/abs/2501.12948v1, https://arxiv.org/favicon.ico %}
{% endlinkgroup %}

### 发布与协议

{% linkgroup %}
{% link Introducing ChatGPT, https://openai.com/index/chatgpt/, https://developers.openai.com/favicon.png %}
{% link Learning to reason with LLMs, https://openai.com/index/learning-to-reason-with-llms/, https://developers.openai.com/favicon.png %}
{% link Computer Use, https://www.anthropic.com/news/3-5-models-and-computer-use, https://www.anthropic.com/favicon.ico %}
{% link MCP Launch, https://www.anthropic.com/news/model-context-protocol, https://www.anthropic.com/favicon.ico %}
{% link MCP Specification, https://modelcontextprotocol.io/specification/2025-06-18, https://modelcontextprotocol.io/mintlify-assets/_mintlify/favicons/mcp/ebiVJzri-bsiCfVZ/_generated/favicon/favicon-32x32.png %}
{% endlinkgroup %}

### 模型与源码

{% linkgroup %}
{% link DeepSeek-V3 Release, https://api-docs.deepseek.com/news/news1226, https://api-docs.deepseek.com/img/favicon.svg %}
{% link DeepSeek-R1 Release, https://api-docs.deepseek.com/news/news250120, https://api-docs.deepseek.com/img/favicon.svg %}
{% link Claude Code Preview, https://www.anthropic.com/research/claude-3-7-sonnet, https://www.anthropic.com/favicon.ico %}
{% link Claude Code Overview, https://code.claude.com/docs/en/overview, https://code.claude.com/docs/_mintlify/favicons/claude-code/pLsy-mRpNksna2sx/_generated/favicon/favicon-32x32.png %}
{% link DeepSeek-Harness Snapshot, https://github.com/deepseek-ai/DeepSeek-Harness/tree/cd5ef8148158c3a752a658978873241fdf8e2bbc, https://github.com/favicon.ico %}
{% endlinkgroup %}

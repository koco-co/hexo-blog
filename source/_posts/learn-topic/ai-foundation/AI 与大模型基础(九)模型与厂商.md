---
title: AI 与大模型基础(九)模型与厂商
tags:
  - AI 与大模型基础
  - 模型与厂商
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能区分厂商、产品、模型 ID 与交付形态，并用带日期的证据记录决定核验、延期或排除。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 9
published: false
abbrlink: 26913b44
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：先确认厂商入口与交付形态，再为具体任务收集模型 ID、成本、延迟、隐私和区域证据；证据不完整时输出 defer，而不是品牌排名。
{% endnote %}

## 机制模型

{% note info flat %}
先区分厂商、产品、模型家族、精确模型 ID、移动别名、API 表面和部署区域。比较矩阵只记录官方声明与本地证据；未知写 Unknown，不用“OpenAI 兼容”推导功能、错误、计费或数据政策等价。
{% endnote %}

{% mermaid %}
flowchart TD
  R[任务需求] --> G{硬约束}
  G -->|不满足| X[排除]
  G -->|满足| M[厂商证据矩阵]
  M --> E[本地同任务评测]
  E --> D[候选与回滚条件]
{% endmermaid %}

{% note primary flat %}
硬约束失败会直接排除候选；官方矩阵只说明接口声明，本地同任务评测才提供选择证据。回滚条件必须绑定固定快照，而不是移动模型名。
{% endnote %}

| 层级 | 示例形式 | 应记录的身份 |
| --- | --- | --- |
| 厂商 | OpenAI、Anthropic | 法律/服务主体与官方域名 |
| 产品 | 聊天应用、开发平台 | 面向用户的包装、账号与区域 |
| 模型家族 | GPT、Claude、Gemini | 一组相关模型，不可直接调用的营销名可能在此层 |
| 模型 ID | API 请求中的精确字符串 | endpoint、区域、日期与是否移动 alias |
| 快照 | 绑定固定版本的 ID 或权重 | 可回滚身份、生命周期与替代关系 |
| 能力 | 文本生成、视觉输入、工具调用 | 必须按任务和接口实测，不能由产品名推导 |

| 厂商/家族 | 当前证据能确认的交付形态 | 能力/接口定位 | 仍需任务级核验 |
| --- | --- | --- | --- |
| OpenAI / GPT | 官方托管 API 入口；示例捕获未得到 2xx | Responses 接口入口 | model ID、区域、价格、数据政策与任务质量 |
| Anthropic / Claude | 官方托管 API 文档 | Messages 接口入口 | 云平台差异、模型快照与工具事件 |
| Google / Gemini | 官方托管 API 文档 | Interactions 接口入口 | 支持范围、迁移语义与区域 |
| xAI / Grok | 官方托管 API 文档 | API overview 入口 | 模型生命周期、能力与数据政策 |
| DeepSeek | 官方托管 API 文档 | API 入口 | 版本、退役、价格与区域 |
| Kimi | 官方托管 API 文档 | Moonshot 平台入口 | model ID、region 与保留政策 |
| GLM | 官方托管 API 文档 | Z.ai 入口 | base URL、协议子集与区域 |
| Qwen | Model Studio 托管服务文档 | 模型服务入口 | 精确快照、区域、许可与部署形态 |

{% note info flat %}
“闭源 API”描述权重不可得但可调用的接口；“开放权重”要求可下载权重与明确许可；“托管服务”描述由服务方运行推理。三者不是互斥品牌标签：同一家可能同时提供托管 API 和开放权重模型，开放权重也不自动允许任意商用或证明可本地部署。
{% endnote %}

| 任务记录 | 质量/接口 | 成本/延迟 | 隐私/部署 | 备选与回滚 | 当前决定 |
| --- | --- | --- | --- | --- | --- |
| 文档问答 v1 | Unknown | Unknown | 禁止训练资料外发 | 本地检索；回滚固定快照 | 延后：缺少精确 ID 与评测 |
| 代码修复 v1 | Unknown | Unknown | 禁止上传凭据和私有仓库 | 人工补丁；回滚只读模式 | 延后：缺少 harness 结果 |
| 视觉抽取 v1 | Unknown | Unknown | 图像需有处理权且限制保留 | OCR 管线；回滚人工录入 | 延后：缺少图像样本评测 |

{% note warning flat %}
示例记录的 `checked_at` 是 2026-08-29，只确认八个官方入口及其托管服务定位，不声称当前模型、价格或性能。OpenAI 捕获记录为 HTTP 403，因此状态是 `defer`；该结果只说明这次 HTTP 获取未成功，不能推出浏览器也不可访问。
{% endnote %}

## 核心边界

{% note info flat %}
冻结八个官方入口的本地捕获清单与 locator，再验证三类任务记录。`entry_status=verified` 必须与独立常量清单中的 URL、状态、locator、body ID 和 digest 完全一致；这个本地门禁检测记录伪造与变异，不认证远程页面。动态选型要等 model ID、成本、延迟、隐私、区域和任务评测齐全后才能 promote。
{% endnote %}

{% folding purple, 展开机制辨析 %}
入口发现与任务选型是两步。发现记录保存原始 URL、最终 URL、HTTP 结果、检查时间、页面定位和本地 fixture digest；选型记录再保存精确 model ID、快照、任务评测、价格、延迟、隐私、区域、替代与回滚。入口可访问不等于模型可用，接口兼容也不等于事件、错误、取消、计费或政策相同。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
from datetime import datetime
from hashlib import sha256
from urllib.parse import urlparse

CHECKED_AT = "2026-08-29T00:00:00Z"
SPECS = [
    ("OpenAI","https://platform.openai.com/docs/api-reference/responses"),
    ("Anthropic","https://platform.claude.com/docs/en/api/messages"),
    ("Google","https://ai.google.dev/gemini-api/docs/interactions"),
    ("xAI","https://docs.x.ai/docs/overview"),
    ("DeepSeek","https://api-docs.deepseek.com/"),
    ("Kimi","https://platform.moonshot.cn/docs"),
    ("GLM","https://docs.z.ai/"),
    ("Qwen","https://www.alibabacloud.com/help/en/model-studio/"),
]
ATTESTED_CAPTURE = {
    "OpenAI":{"status":403,"locator":"Unknown","body_id":"Unknown"},
    "Anthropic":{"status":200,"locator":"Messages API","body_id":"anthropic-messages"},
    "Google":{"status":200,"locator":"Interactions API","body_id":"gemini-interactions"},
    "xAI":{"status":200,"locator":"API overview","body_id":"xai-overview"},
    "DeepSeek":{"status":200,"locator":"API docs","body_id":"deepseek-docs"},
    "Kimi":{"status":200,"locator":"platform docs","body_id":"kimi-docs"},
    "GLM":{"status":200,"locator":"API docs","body_id":"zai-docs"},
    "Qwen":{"status":200,"locator":"Model Studio","body_id":"qwen-model-studio"},
}
SOURCE_FIELDS = {"provider","original_url","final_url","status","checked_at","evidence_locator",
                 "body_id","capture_digest","entry_status","defer_reason"}
approved = {provider:url for provider,url in SPECS}

def digest_fields(row):
    keys = ("provider","original_url","final_url","status","checked_at","evidence_locator","body_id")
    return sha256("|".join(str(row[key]) for key in keys).encode()).hexdigest()

def frozen_source(provider, url):
    expected = ATTESTED_CAPTURE[provider]
    row = {"provider":provider,"original_url":url,"final_url":url,"status":expected["status"],
           "checked_at":CHECKED_AT,"evidence_locator":expected["locator"],"body_id":expected["body_id"]}
    row["capture_digest"] = digest_fields(row)
    row["entry_status"] = "verified" if row["status"] == 200 else "defer"
    row["defer_reason"] = None if row["status"] == 200 else "recorded HTTP response was not 2xx"
    return row

records = [frozen_source(*spec) for spec in SPECS]
EXPECTED_DIGESTS = {row["provider"]:row["capture_digest"] for row in records}

def validate_source(row):
    if set(row) != SOURCE_FIELDS:
        raise ValueError("source field mismatch")
    string_fields = SOURCE_FIELDS - {"status","defer_reason"}
    if (any(type(row[field]) is not str or not row[field] for field in string_fields)
            or type(row["status"]) is not int
            or (row["defer_reason"] is not None
                and (type(row["defer_reason"]) is not str or not row["defer_reason"]))):
        raise ValueError("source field type mismatch")
    try:
        datetime.fromisoformat(row["checked_at"].replace("Z","+00:00"))
    except ValueError:
        raise ValueError("invalid source date")
    if (row["provider"] not in approved
            or urlparse(row["original_url"]).scheme != "https"
            or approved[row["provider"]] != row["original_url"]
            or approved[row["provider"]] != row["final_url"]):
        raise ValueError("unapproved capture URL")
    expected = ATTESTED_CAPTURE[row["provider"]]
    if row["status"] != expected["status"]:
        raise ValueError("status contradicts attestation")
    if (row["evidence_locator"],row["body_id"]) != (expected["locator"],expected["body_id"]):
        raise ValueError("capture identity mismatch")
    if row["capture_digest"] != EXPECTED_DIGESTS[row["provider"]] or row["capture_digest"] != digest_fields(row):
        raise ValueError("capture digest mismatch")
    is_2xx = 200 <= row["status"] < 300
    if row["entry_status"] == "verified":
        if not is_2xx or "Unknown" in {row["evidence_locator"],row["body_id"]}:
            raise ValueError("false verified source")
        if row["defer_reason"] is not None:
            raise ValueError("verified source has defer reason")
    elif row["entry_status"] == "defer":
        if is_2xx or row["defer_reason"] is None:
            raise ValueError("invalid defer source")
    else:
        raise ValueError("invalid source state")

for row in records:
    validate_source(row)
print("entries", {row["provider"]:row["entry_status"] for row in records})

DYNAMIC_FIELDS = ("model_id","snapshot","cost","latency","privacy","region","evidence",
                  "evidence_checked_at","deployment","ecosystem")
HARD_CONSTRAINT_FIELDS = {"privacy","region","capability"}
TASK_FIELDS = {"task",*DYNAMIC_FIELDS,"alternative","rollback","unknown_reason","next_action",
               "snapshot_fixed","hard_constraints"}
unknown = {"model_id":"Unknown","snapshot":"Unknown","cost":"Unknown","latency":"Unknown",
           "privacy":"no training data egress","region":"Unknown","evidence":"Unknown",
           "evidence_checked_at":"Unknown","deployment":"Unknown","ecosystem":"Unknown"}
tasks = [
    {"task":"docs-qa",**unknown,"alternative":"local retrieval","rollback":"fixed local snapshot",
     "unknown_reason":"model and policy evidence not captured","next_action":"capture model/policy/pricing pages",
     "snapshot_fixed":False,"hard_constraints":{"privacy":True,"region":True,"capability":True}},
    {"task":"code-fix",**unknown,"privacy":"no credentials or private repository upload",
     "alternative":"human patch","rollback":"read-only mode","unknown_reason":"harness result missing",
     "next_action":"run frozen private harness","snapshot_fixed":False,
     "hard_constraints":{"privacy":True,"region":True,"capability":True}},
    {"task":"vision",**unknown,"privacy":"licensed images and bounded retention",
     "alternative":"OCR pipeline","rollback":"manual entry","unknown_reason":"task sample evaluation missing",
     "next_action":"run labeled image holdout","snapshot_fixed":False,
     "hard_constraints":{"privacy":True,"region":True,"capability":True}},
    {"task":"synthetic-ready","model_id":"fixture-model-v1","snapshot":"fixture-snapshot-v1",
     "cost":"12 synthetic units","latency":"180 synthetic ms","privacy":"fixture-safe",
     "region":"fixture-region","evidence":"holdout-v1","evidence_checked_at":"2026-08-29",
     "deployment":"managed fixture","ecosystem":"adapter-v1","alternative":"fixture-baseline",
     "rollback":"fixture-snapshot-v0",
     "unknown_reason":None,"next_action":"repeat on drift","snapshot_fixed":True,
     "hard_constraints":{"privacy":True,"region":True,"capability":True}},
]

def decide(task):
    if set(task) != TASK_FIELDS:
        raise ValueError("task field mismatch")
    string_fields = {"task","alternative","rollback"} | set(DYNAMIC_FIELDS)
    if any(type(task[field]) is not str or not task[field] for field in string_fields):
        raise ValueError("task field type mismatch")
    if type(task["snapshot_fixed"]) is not bool:
        raise ValueError("snapshot flag type mismatch")
    constraints = task["hard_constraints"]
    if (type(constraints) is not dict or set(constraints) != HARD_CONSTRAINT_FIELDS
            or any(type(value) is not bool for value in constraints.values())):
        raise ValueError("hard constraint schema mismatch")
    has_unknown = any(task[field] == "Unknown" for field in DYNAMIC_FIELDS)
    if has_unknown:
        if (type(task["unknown_reason"]) is not str or not task["unknown_reason"]
                or type(task["next_action"]) is not str or not task["next_action"]):
            raise ValueError("deferred task recovery state invalid")
    elif task["unknown_reason"] is not None or type(task["next_action"]) is not str or not task["next_action"]:
        raise ValueError("complete task recovery state invalid")
    if not all(constraints.values()):
        return "exclude"
    if has_unknown:
        return "defer"
    try:
        datetime.fromisoformat(task["evidence_checked_at"])
    except ValueError:
        raise ValueError("invalid evidence date")
    if not task["snapshot_fixed"]:
        raise ValueError("moving alias cannot promote")
    return "promote"

outcomes = {task["task"]:decide(task) for task in tasks}
if outcomes != {"docs-qa":"defer","code-fix":"defer","vision":"defer","synthetic-ready":"promote"}:
    raise RuntimeError("task gate changed")
print("tasks", outcomes)
violated = {**tasks[3],"hard_constraints":{**tasks[3]["hard_constraints"],"privacy":False}}
if decide(violated) != "exclude":
    raise RuntimeError("violated constraint promoted")
print("constraint-negative", "exclude")
mixed = {**tasks[0],"hard_constraints":{**tasks[0]["hard_constraints"],"privacy":False}}
if decide(mixed) != "exclude":
    raise RuntimeError("known violation hidden by Unknown")
print("constraint-mixed-negative", "exclude")
source_type_negatives = {
    "provider":7,"original_url":7,"final_url":7,"status":True,"checked_at":7,
    "evidence_locator":7,"body_id":7,"capture_digest":7,"entry_status":7,"defer_reason":7,
}
for field, value in source_type_negatives.items():
    try:
        validate_source({**records[1],field:value})
    except ValueError as error:
        if str(error) != "source field type mismatch":
            raise RuntimeError(f"unexpected source type error for {field}: {error}")
    else:
        raise RuntimeError(f"invalid source type accepted: {field}")
print("source-types-negative", len(source_type_negatives))
task_string_fields = {"task","alternative","rollback"} | set(DYNAMIC_FIELDS)
for field in task_string_fields:
    try:
        decide({**tasks[3],field:7})
    except ValueError as error:
        if str(error) != "task field type mismatch":
            raise RuntimeError(f"unexpected task type error for {field}: {error}")
    else:
        raise RuntimeError(f"invalid task type accepted: {field}")
print("task-string-types-negative", len(task_string_fields))
mutated = {**records[1],"evidence_locator":"changed"}
forged = {**records[1],"evidence_locator":"forged","body_id":"forged-body"}
forged["capture_digest"] = digest_fields(forged)
false_2xx = {**records[0],"status":200,"entry_status":"verified","defer_reason":None}
false_2xx["capture_digest"] = digest_fields(false_2xx)
missing_dynamic = {key:value for key,value in tasks[3].items() if key != "cost"}
partial_constraints = {**tasks[3],"hard_constraints":{"privacy":True}}
negative_oracles = [
    (mutated, validate_source, "capture identity mismatch"),
    (forged, validate_source, "capture identity mismatch"),
    (false_2xx, validate_source, "status contradicts attestation"),
    ({**records[1],"defer_reason":"contradictory reason"}, validate_source,
     "verified source has defer reason"),
    (missing_dynamic, decide, "task field mismatch"),
    (partial_constraints, decide, "hard constraint schema mismatch"),
    ({**tasks[3],"hard_constraints":{**tasks[3]["hard_constraints"],"privacy":1}}, decide,
     "hard constraint schema mismatch"),
    ({**tasks[3],"cost":""}, decide, "task field type mismatch"),
    ({**tasks[0],"unknown_reason":""}, decide, "deferred task recovery state invalid"),
    ({**tasks[0],"unknown_reason":7}, decide, "deferred task recovery state invalid"),
    ({**tasks[0],"next_action":["retry"]}, decide, "deferred task recovery state invalid"),
    ({**tasks[3],"unknown_reason":"unexpected"}, decide, "complete task recovery state invalid"),
    ({**tasks[3],"next_action":""}, decide, "complete task recovery state invalid"),
    ({**tasks[3],"rollback":""}, decide, "task field type mismatch"),
    ({**tasks[3],"snapshot_fixed":1}, decide, "snapshot flag type mismatch"),
    ({**tasks[3],"snapshot_fixed":False}, decide, "moving alias cannot promote"),
    ({**tasks[3],"evidence_checked_at":"not-a-date"}, decide, "invalid evidence date"),
]
for bad, action, expected_error in negative_oracles:
    try:
        action(bad)
    except ValueError as error:
        if str(error) != expected_error:
            raise RuntimeError(f"unexpected rejection: {error}")
        print("rejected:", error)
    else:
        raise RuntimeError("invalid evidence accepted")
```

{% note success flat %}
精确输出为 OpenAI `defer`、其余七项 `verified`，三类真实任务 `defer`、一条明确标为 synthetic 的完整记录 `promote`，以及完整记录和 Unknown 记录中已知硬约束失败的 `exclude`。随后逐字段拒绝错误类型，并拒绝捕获变异、重算 digest 的伪造身份、伪造 2xx、verified 携带延期理由、缺字段、部分或非布尔硬约束、错误恢复状态、缺少回滚、移动 alias 和无效证据日期。digest 与独立常量清单共同检测本地记录变化，不认证远程来源；HTTP 状态仍来自带日期的捕获证据。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
entries {'OpenAI': 'defer', 'Anthropic': 'verified', 'Google': 'verified', 'xAI': 'verified', 'DeepSeek': 'verified', 'Kimi': 'verified', 'GLM': 'verified', 'Qwen': 'verified'}
tasks {'docs-qa': 'defer', 'code-fix': 'defer', 'vision': 'defer', 'synthetic-ready': 'promote'}
constraint-negative exclude
constraint-mixed-negative exclude
source-types-negative 10
task-string-types-negative 13
rejected: capture identity mismatch
rejected: capture identity mismatch
rejected: status contradicts attestation
rejected: verified source has defer reason
rejected: task field mismatch
rejected: hard constraint schema mismatch
rejected: hard constraint schema mismatch
rejected: task field type mismatch
rejected: deferred task recovery state invalid
rejected: deferred task recovery state invalid
rejected: deferred task recovery state invalid
rejected: complete task recovery state invalid
rejected: complete task recovery state invalid
rejected: task field type mismatch
rejected: snapshot flag type mismatch
rejected: moving alias cannot promote
rejected: invalid evidence date
```
{% endfolding %}

## 失败边界

{% note warning flat %}
混用产品名和 model ID；把移动 alias 当固定版本；把兼容 endpoint 当作功能与政策等价；发布没有日期、来源或区域的性能排名。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 身份 | provider/family/model_id/snapshot 分列 | 只写营销名 |
| 动态字段 | 价格、区域、生命周期带日期 | 无失效条件 |
| 兼容性 | 逐项验证 role、tool、stream、error | SDK 能连即宣布等价 |

## 结果验证

{% note success flat %}
预期结果是七个可定位入口、一个 HTTP 403/defer 入口，以及三个带 Unknown 原因和下一动作的任务延期记录。本文交付的是八家入口身份与证据/defer 工作流，不是八厂商动态能力排名；只有精确字段与布尔硬约束通过，并补齐固定 snapshot、任务证据、成本、延迟、隐私、区域、部署、生态、替代和回滚后，`decide` 才允许 promote。
{% endnote %}

- 每条动态事实绑定最终 URL、精确值和核验时间。
- 产品、家族、ID、alias 与 snapshot 分列。
- 三类任务分别保留备选、回滚与重新核验条件。

## 常见问题

{% flashcard_ref id="a12-capability-vs-product" %}

{% flashcard basic id:foundation-model-name-id deck:"AI 与大模型基础" priority:1 tags:"模型与厂商,基础机制" %}
--- question
为什么模型名和模型 ID 不能混用？
--- answer
模型名可指产品或家族；模型 ID 是特定接口中可调用的版本标识，移动 alias 还可能改变指向。
--- explanation
记录应分开保存 provider、product、family、model ID、snapshot、endpoint、region 与 checked_at。只有快照或等价固定身份才能支持可重复评测和可靠回滚；营销名不能作为运行工件。
{% endflashcard %}

{% flashcard basic id:foundation-compatible-api deck:"AI 与大模型基础" priority:2 tags:"模型与厂商,基础机制" %}
--- question
OpenAI 兼容接口为什么仍要逐项验证？
--- answer
不代表角色、工具、流事件、错误、存储、计费、隐私和生命周期完全等价。
--- explanation
兼容通常只覆盖协议子集。迁移时至少逐项记录下面的通过/失败用例：

| 检查组 | 最小检查 |
| --- | --- |
| 消息与工具 | role 映射、工具参数与返回结构 |
| 流与错误 | 事件顺序、取消行为、错误码 |
| 存储与计费 | 请求是否落盘、token 与费用口径 |
| 隐私与生命周期 | 数据用途、保留期、模型退役与替代 |

一次成功文本请求只能证明该请求可用，不能证明这些行为等价。
{% endflashcard %}

## 参考资料

### 国际厂商

{% linkgroup %}
{% link OpenAI API, https://platform.openai.com/docs/api-reference/responses, https://developers.openai.com/favicon.png %}
{% link Anthropic API, https://platform.claude.com/docs/en/api/messages, https://platform.claude.com/favicon.svg %}
{% link Gemini Interactions API, https://ai.google.dev/gemini-api/docs/interactions, https://www.gstatic.com/devrel-devsite/prod/vdc800838fb8be04a9a7685606311d18c65800504bccf261551968ac74bffd42e/googledevai/images/favicon-new.png %}
{% link xAI API, https://docs.x.ai/docs/overview, https://docs.x.ai/favicon.ico %}
{% endlinkgroup %}

### 国内厂商

{% linkgroup %}
{% link DeepSeek API, https://api-docs.deepseek.com/, https://api-docs.deepseek.com/img/favicon.svg %}
{% link Kimi API, https://platform.moonshot.cn/docs, https://platform.moonshot.cn/favicon.ico %}
{% link Z.ai API, https://docs.z.ai/, https://docs.z.ai/mintlify-assets/_mintlify/favicons/zhipu-32152247/ksfquWFAc8TQf_Hb/_generated/favicon/favicon-32x32.png %}
{% link Qwen Model Studio, https://www.alibabacloud.com/help/en/model-studio/, https://img.alicdn.com/tfs/TB1ugg7M9zqK1RjSZPxXXc4tVXa-32-32.png %}
{% endlinkgroup %}

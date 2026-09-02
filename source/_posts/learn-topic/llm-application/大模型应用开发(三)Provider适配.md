---
title: 大模型应用开发(三)Provider适配
tags:
  - 大模型应用开发
  - Provider适配
categories:
  - Learn Topic
  - 大模型应用开发
description: 能把不同厂商映射到统一内部模型，同时保留原生能力和差异。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 3
published: false
abbrlink: 92db0f06
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：让一个应用能够切换 Provider，又不把不同厂商的消息块、工具调用、流式事件、Usage 和错误悄悄压扁成一个字符串。成功证据是：统一层能稳定返回可用字段，同时保留原始响应和未知事件；当某项能力不兼容时，系统能拒绝、降级或走原生入口，而不是假装支持。
{% endnote %}

<!-- concept-story:start -->

一个问答服务先接入了 Chat Completions 兼容入口。为了让前端简单，适配器只返回 `text`：普通问题看起来没有问题，带工具的问题却突然不再执行，流式页面也在结束前停住。团队再接入另一个 Provider 时，发现它把文本放在内容块里，把工具调用放在同一数组的另一种块里，Usage 也使用了不同的字段名。

如果继续把每个响应都强行转成字符串，调用方会永远看不到工具参数、结束原因和 Token 统计。于是他们把“调用接口”和“解释响应”分开：统一契约规定应用真正需要的字段，适配器负责映射；无法映射的原始字段放在受控的扩展区，未知事件保留并触发测试告警。这样，切换 Provider 改变的是适配器，而不是业务层对事实的判断。

<!-- concept-story:end -->

{% note info flat %}
上面的情境是虚构的设计场景。Provider 适配不是把不同 API 的字段改名，而是建立一条有损风险可见的边界：哪些字段能统一，哪些能力必须声明，哪些原始信息要保留，哪些错误应阻止调用。统一层越早丢掉信息，后续越无法恢复。
{% endnote %}

## 统一模型

### 统一契约

{% note primary flat %}
先定义业务层真正依赖的 canonical response，再为每个 Provider 写映射。一个可用的最小契约至少需要文本块、工具调用、结束原因、Usage、请求 ID、Provider 标识、原始响应引用和兼容性警告；不要把“有文本”当作成功响应的全部定义。
{% endnote %}

```json
{
  "provider": "anthropic",
  "request_id": "msg_fixture_001",
  "status": "completed",
  "content": [
    {"type": "text", "text": "需要查询库存"},
    {"type": "tool_call", "id": "toolu_fixture_001", "name": "lookup_stock",
     "arguments": {"sku": "A-17"}}
  ],
  "tool_calls": [
    {
      "id": "toolu_fixture_001",
      "name": "lookup_stock",
      "arguments": {"sku": "A-17"}
    }
  ],
  "finish_reason": "tool_call",
  "usage": {"input_tokens": 24, "output_tokens": 8, "total_tokens": 32},
  "raw_ref": "fixture://anthropic/msg_fixture_001",
  "extensions": {},
  "warnings": []
}
```

{% note info flat %}
`content` 使用有序块而不是单个 `text`，是为了同时容纳文本、图片引用、工具调用或其他 Provider 事件。`extensions` 不是随意倾倒原始 JSON 的地方：应按 Provider 和版本命名，并限制日志、序列化和下游使用范围；原始响应若含敏感输入，不应默认写入普通业务日志。
{% endnote %}

{% mermaid %}
flowchart TD
  A[业务请求] --> B[统一请求契约]
  B --> C{能力检查}
  C -->|支持| D[Provider Adapter]
  C -->|不支持| E[拒绝或原生入口]
  D --> F[原始响应快照]
  F --> G[字段与事件映射]
  G --> H[统一响应契约]
  G --> I[兼容性警告]
{% endmermaid %}

{% note info flat %}
统一请求契约控制调用方能表达什么，能力检查控制当前 Provider 能否安全表达它，适配器只负责翻译和保留证据。若工具调用、视觉输入或流式事件无法映射，应在调用前返回明确的“不支持”，或把请求转到已声明支持的原生入口。
{% endnote %}

### 字段与错误

{% note info flat %}
Provider 的字段差异可以按“语义”而不是按厂商名称归类。
{% endnote %}

| 语义 | Responses 风格 | Messages 风格 | Chat Completions 兼容风格 | 统一层策略 |
| --- | --- | --- | --- | --- |
| 输入 | `input` 与输入项目 | `messages` | `messages` | 内部使用有序消息/内容块，映射时保留角色与块类型 |
| 文本 | 输出项目中的文本内容 | `content` 中的文本块 | `choices[].message.content` | 统一为 `content[type=text]`，不丢弃其他块 |
| 工具 | 输出项目中的 function/tool call | `content` 中的 `tool_use` 块 | `tool_calls` | 统一为 `tool_calls`，参数先解析再校验 |
| 统计 | `usage` 对象 | `usage` 对象 | `usage` 对象 | 记录字段来源与未知项，不自行补零 |
| 结束 | response status 或输出状态 | `stop_reason` | choice finish reason | 统一为有限枚举，原值放扩展区 |
| 错误 | HTTP 状态与 error 对象 | HTTP 状态与 error 对象 | HTTP 状态与 error 对象 | 分类为 auth、rate_limit、invalid_request、unavailable 或 unknown |

{% note warning flat %}
错误分类也不能只看 HTTP 状态：同一个 `400` 可能是缺字段、模型不可用或内容被拒绝，必须保留 Provider 错误类型和原始摘要。相反，不能因为错误对象长得相似就假定所有 Provider 的重试语义相同；统一层只能提供分类和策略入口，具体等待、费用与配额规则仍属于 Provider 能力。
{% endnote %}

## 字段映射

### 能力探测

{% note primary flat %}
能力探测回答的是“当前请求能否安全执行”，不是“这个 Provider 有没有某个营销标签”。用稳定的 feature flags 描述已验证能力，例如 `text`、`stream`、`tool_call`、`structured_output`；每个 flag 都应绑定适配器版本、测试快照和失败动作。
{% endnote %}

| 能力 | 探测输入 | 通过标准 | 不支持时的动作 |
| --- | --- | --- | --- |
| 文本 | 一条最小文本请求 | 能映射至少一个文本块 | 直接拒绝配置 |
| 流式 | 一组已知事件 fixture | 增量、结束和错误事件顺序可还原 | 关闭流式或切换接口 |
| 工具调用 | 一个无副作用工具声明 | 名称、参数、调用 ID 和结束原因均保留 | 不把工具调用降级成普通文本 |
| 结构化输出 | 一个带约束的响应 fixture | 解析失败可见，未验证字段不补默认值 | 返回校验错误或使用原生入口 |
| Usage | 成功响应与缺失 Usage 响应 | 可区分真实统计、未知和未提供 | 成本指标标记 unknown，不写零 |

{% note info flat %}
Feature flag 是运行时选择，不是能力证明。Provider 文档更新、模型切换、兼容入口变化或账号权限变化都可能让旧探测失效；生产配置应把 Provider、endpoint、模型、适配器版本和探测时间一起记录，不能只保存一个 `provider=openai` 字符串。原生入口也不能因为“有原生 API”就自动视为支持：必须有独立的能力声明和对应 fixture 证据；没有证据时返回 `reject`，而不是替原生入口补一个 `native` 标志。
{% endnote %}

### 版本与证据

{% note info flat %}
适配层需要两类版本记录：一类描述外部接口（Provider、endpoint、模型和文档快照），另一类描述内部解释方式（canonical contract 与 adapter 版本）。原始响应快照用于发现字段变化，但不应直接作为公开日志或包含真实用户数据。
{% endnote %}

{% folding purple, 展开版本记录示例 %}
```json
{
  "provider": "fixture-anthropic",
  "endpoint_family": "messages",
  "model": "fixture-model",
  "provider_schema": "docs-snapshot-2026-08-29",
  "source_ref": "anthropic-api",
  "contract_version": "canonical-response-v1",
  "adapter_version": "canonical-v1",
  "capabilities": ["text", "stream", "tool_call"],
  "snapshot": "inline-fixture",
  "unknown_fields": ["vendor_trace"],
  "tested_at": "local-fixture-run"
}
```

这个记录同时绑定 Provider、官方资料标识、文档快照、内部契约和适配器版本；`inline-fixture` 只声明本地证据范围，不能被误读成线上响应快照。
{% endfolding %}

## 最小实践

### 准备输入

{% note info flat %}
下面的 Python 夹具故意使用三种不同的请求/响应形状和两组流式事件。它不访问网络、不需要 SDK、不使用真实 Key；测试目标是适配器是否保留语义，而不是比较模型回答质量。
{% endnote %}

### 执行步骤

```python
import copy
import json
import re

CANONICAL_REQUEST = {
    "model": "fixture-model",
    "messages": [{"role": "user", "content": [{"type": "text", "text": "查询库存"}]}],
    "tools": [{
        "name": "lookup_stock",
        "description": "查询一个 SKU 的库存",
        "parameters": {"type": "object", "properties": {"sku": {"type": "string"}}},
    }],
    "stream": True,
}


def to_provider_request(provider, request):
    message = request["messages"][0]
    text = message["content"][0]["text"]
    tool = request["tools"][0]
    if provider == "openai":
        return {
            "model": request["model"],
            "input": [{"role": message["role"], "content": [{"type": "input_text", "text": text}]}],
            "tools": [{"type": "function", "name": tool["name"],
                       "description": tool["description"], "parameters": tool["parameters"]}],
            "stream": request["stream"],
        }
    if provider == "anthropic":
        return {
            "model": request["model"],
            "max_tokens": 128,
            "messages": [{"role": message["role"], "content": [{"type": "text", "text": text}]}],
            "tools": [{"name": tool["name"], "description": tool["description"],
                       "input_schema": tool["parameters"]}],
            "stream": request["stream"],
        }
    if provider == "chat":
        return {
            "model": request["model"],
            "messages": [{"role": message["role"], "content": text}],
            "tools": [{"type": "function", "function": {
                "name": tool["name"], "description": tool["description"],
                "parameters": tool["parameters"],
            }}],
            "stream": request["stream"],
        }
    raise ValueError(f"unknown provider: {provider}")


RESPONSES = {
    "openai": {
        "id": "resp_fixture_001",
        "status": "completed",
        "output": [
            {"type": "message", "content": [{"type": "output_text", "text": "库存为 12"}]},
            {"type": "function_call", "call_id": "call_001", "name": "lookup_stock",
             "arguments": "{\"sku\":\"A-17\"}"},
        ],
        "usage": {"input_tokens": 20, "output_tokens": 7},
        "vendor_trace": "keep-out-of-normal-log",
    },
    "anthropic": {
        "id": "msg_fixture_001",
        "stop_reason": "tool_use",
        "content": [
            {"type": "text", "text": "需要查询库存"},
            {"type": "tool_use", "id": "toolu_001", "name": "lookup_stock",
             "input": {"sku": "A-17"}},
            {"type": "vendor_metadata", "metadata": {"trace_id": "nested-fixture"}},
        ],
        "usage": {"input_tokens": 24, "output_tokens": 8},
    },
    "chat": {
        "id": "chatcmpl_fixture_001",
        "choices": [{
            "message": {
                "role": "assistant",
                "content": "库存为 12",
                "tool_calls": [{"id": "call_002", "type": "function",
                                "function": {"name": "lookup_stock", "arguments": "{\"sku\":\"A-17\"}"}}],
            },
            "finish_reason": "tool_calls",
        }],
        "usage": {"prompt_tokens": 18, "completion_tokens": 7, "total_tokens": 25},
        "vendor_meta": {"trace": "keep-out-of-normal-log"},
    },
}

STREAMS = {
    "openai": [
        {"type": "response.output_text.delta", "delta": "库"},
        {"type": "response.output_text.delta", "delta": "存为 12"},
        {"type": "response.completed"},
    ],
    "anthropic": [
        {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "库"}},
        {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "存为 12"}},
        {"type": "content_block_delta", "delta": {"type": "input_json_delta", "partial_json": "{..."}},
        {"type": "message_stop"},
        {"type": "vendor_new_event", "payload": {"debug": True}},
    ],
}

ERRORS = {
    "openai": {"status": 429, "error": {"type": "rate_limit_error", "message": "slow down"}},
    "anthropic": {"status": 529, "error": {"type": "overloaded_error", "message": "busy"}},
    "chat": {"status": 400, "error": {"type": "invalid_request_error",
                                           "message": "invalid Authorization: Bearer secret-value"}},
}

MISSING_USAGE = copy.deepcopy(RESPONSES["anthropic"])
MISSING_USAGE.pop("usage")
BAD_TOOL = copy.deepcopy(RESPONSES["openai"])
BAD_TOOL["output"][1]["arguments"] = "{bad-json"


def block_sequence(provider, response):
    blocks = []
    if provider == "openai":
        for item in response["output"]:
            if item["type"] == "message":
                for part in item["content"]:
                    if part["type"] == "output_text":
                        blocks.append({"type": "text", "text": part["text"]})
                    else:
                        blocks.append({"type": "provider_block", "raw": part})
            elif item["type"] == "function_call":
                try:
                    arguments = json.loads(item["arguments"])
                except (TypeError, json.JSONDecodeError) as error:
                    raise ValueError("tool arguments invalid") from error
                blocks.append({"type": "tool_call", "id": item["call_id"],
                               "name": item["name"], "arguments": arguments})
            else:
                blocks.append({"type": "provider_block", "raw": item})
        return blocks

    if provider == "anthropic":
        for block in response["content"]:
            if block["type"] == "text":
                blocks.append({"type": "text", "text": block["text"]})
            elif block["type"] == "tool_use":
                blocks.append({"type": "tool_call", "id": block["id"],
                               "name": block["name"], "arguments": block["input"]})
            else:
                blocks.append({"type": "provider_block", "raw": block})
        return blocks

    message = response["choices"][0]["message"]
    if message.get("content"):
        blocks.append({"type": "text", "text": message["content"]})
    for item in message.get("tool_calls", []):
        try:
            arguments = json.loads(item["function"]["arguments"])
        except (TypeError, json.JSONDecodeError) as error:
            raise ValueError("tool arguments invalid") from error
        blocks.append({"type": "tool_call", "id": item["id"],
                       "name": item["function"]["name"], "arguments": arguments})
    return blocks


def normalize_usage(provider, usage):
    if usage is None:
        raise ValueError("usage missing")
    if provider == "chat":
        input_key, output_key = "prompt_tokens", "completion_tokens"
    else:
        input_key, output_key = "input_tokens", "output_tokens"
    input_tokens = usage.get(input_key)
    output_tokens = usage.get(output_key)
    if input_tokens is None or output_tokens is None:
        raise ValueError("usage incomplete")
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": usage.get("total_tokens", input_tokens + output_tokens),
        "source": {"input_tokens": input_key, "output_tokens": output_key},
    }


def raw_finish_reason(provider, response):
    if provider == "chat":
        return response["choices"][0].get("finish_reason")
    return response.get("stop_reason", response.get("status"))


def finish_reason(provider, response):
    raw = raw_finish_reason(provider, response)
    return {"tool_use": "tool_call", "tool_calls": "tool_call",
            "stop": "completed", "completed": "completed"}.get(raw, "unknown")


def normalize(provider, response):
    blocks = block_sequence(provider, response)
    known = {"id", "status", "output", "choices", "content", "usage", "stop_reason"}
    return {
        "provider": provider,
        "request_id": response["id"],
        "status": response.get("status", "completed"),
        "content": blocks,
        "tool_calls": [block for block in blocks if block["type"] == "tool_call"],
        "finish_reason": finish_reason(provider, response),
        "usage": normalize_usage(provider, response.get("usage")),
        "raw_ref": f"fixture://{provider}/{response['id']}",
        "extensions": {
            "top_level": {key: value for key, value in response.items() if key not in known},
            "nested_blocks": [block["raw"] for block in blocks if block["type"] == "provider_block"],
            "raw_finish_reason": raw_finish_reason(provider, response),
        },
        "warnings": [],
    }


def normalize_event(provider, event):
    event_type = event["type"]
    if event_type == "response.output_text.delta":
        return {"type": "text_delta", "text": event["delta"]}
    if event_type == "content_block_delta":
        delta = event.get("delta", {})
        if delta.get("type") == "text_delta":
            return {"type": "text_delta", "text": delta["text"]}
        return {"type": "provider_event", "provider": provider, "raw": event}
    if event_type in {"response.completed", "message_stop"}:
        return {"type": "completed"}
    return {"type": "provider_event", "provider": provider, "raw": event}


def unknown_stream_events(provider, events):
    return [event["type"] for event in events
            if normalize_event(provider, event)["type"] == "provider_event"]


def require_known_stream(provider, events):
    unknown = unknown_stream_events(provider, events)
    if unknown:
        raise ValueError(f"unknown stream events: {','.join(unknown)}")


def classify_error(error):
    status = error["status"]
    error_type = error["error"].get("type", "unknown")
    message = error["error"].get("message", "")
    safe_message = re.sub(r"(?i)(authorization:\s*bearer\s+)[^ ]+", r"\1[redacted]", message)
    if status in {401, 403}:
        category = "auth"
    elif status == 429 or "rate_limit" in error_type:
        category = "rate_limit"
    elif 500 <= status <= 599:
        category = "unavailable"
    elif 400 <= status <= 499:
        category = "invalid_request"
    else:
        category = "unknown"
    return {"category": category, "provider_type": error_type,
            "status": status, "summary": safe_message[:80]}


CAPABILITIES = {
    "openai": {"text", "stream", "tool_call"},
    "anthropic": {"text", "stream", "tool_call"},
    "chat": {"text", "tool_call"},
}
NATIVE_EVIDENCE = {
    "chat": {
        "fixture_id": "chat-native-stream-v1",
        "capabilities": {"text", "stream", "tool_call"},
        "events": ["chat.completion.chunk", "chat.completion.completed"],
    },
}


def choose_entry(provider, required, native=False, evidence=None):
    if native:
        native_record = (evidence or {}).get(provider, {})
        available = native_record.get("capabilities", set())
        entry = "native"
    else:
        available = CAPABILITIES[provider]
        entry = "compatible"
    missing = sorted(required - available)
    if missing:
        return {"entry": "reject", "missing": missing}
    return {"entry": entry, "missing": []}


provider_requests = {provider: to_provider_request(provider, CANONICAL_REQUEST)
                     for provider in CAPABILITIES}
selection = {
    "openai_tool": choose_entry("openai", {"text", "tool_call"}),
    "chat_stream": choose_entry("chat", {"text", "stream"}),
    "chat_stream_native": choose_entry(
        "chat", {"text", "stream"}, native=True, evidence=NATIVE_EVIDENCE
    ),
}
version_record = {
    "provider": "fixture-anthropic",
    "endpoint_family": "messages",
    "model": "fixture-model",
    "provider_schema": "docs-snapshot-2026-08-29",
    "source_ref": "anthropic-api",
    "contract_version": "canonical-response-v1",
    "adapter_version": "canonical-v1",
    "snapshot": "inline-fixture",
}
assert {"provider", "provider_schema", "source_ref", "contract_version", "adapter_version"} <= version_record.keys()

normalized = {provider: normalize(provider, response)
              for provider, response in RESPONSES.items()}
streamed = {provider: [normalize_event(provider, event) for event in events]
            for provider, events in STREAMS.items()}
classified = {provider: classify_error(error) for provider, error in ERRORS.items()}

negative = {}
for name, provider, response in [
    ("missing_usage", "anthropic", MISSING_USAGE),
    ("bad_tool_arguments", "openai", BAD_TOOL),
]:
    try:
        normalize(provider, response)
    except ValueError as error:
        negative[name] = str(error)
    else:
        raise AssertionError(f"expected fixture rejection: {name}")
try:
    require_known_stream("anthropic", STREAMS["anthropic"])
except ValueError as error:
    negative["unknown_stream_event"] = str(error)
else:
    raise AssertionError("expected unknown stream alert")

assert provider_requests["openai"]["input"][0]["content"][0]["text"] == "查询库存"
assert provider_requests["anthropic"]["messages"][0]["content"][0]["text"] == "查询库存"
assert provider_requests["chat"]["messages"][0]["content"] == "查询库存"
assert [block["type"] for block in normalized["openai"]["content"]] == ["text", "tool_call"]
assert normalized["openai"]["tool_calls"][0]["arguments"] == {"sku": "A-17"}
assert normalized["anthropic"]["finish_reason"] == "tool_call"
assert normalized["chat"]["usage"]["source"]["input_tokens"] == "prompt_tokens"
assert normalized["openai"]["extensions"]["top_level"] == {"vendor_trace": "keep-out-of-normal-log"}
assert normalized["anthropic"]["extensions"]["nested_blocks"] == [
    {"type": "vendor_metadata", "metadata": {"trace_id": "nested-fixture"}}
]
assert normalized["anthropic"]["extensions"]["raw_finish_reason"] == "tool_use"
assert normalized["chat"]["extensions"]["raw_finish_reason"] == "tool_calls"
assert normalized["anthropic"]["raw_ref"] == "fixture://anthropic/msg_fixture_001"
assert [event["type"] for event in streamed["openai"]] == ["text_delta", "text_delta", "completed"]
assert [event["type"] for event in streamed["anthropic"]] == [
    "text_delta", "text_delta", "provider_event", "completed", "provider_event"
]
assert classified["openai"]["category"] == "rate_limit"
assert classified["anthropic"]["category"] == "unavailable"
assert classified["chat"]["summary"] == "invalid Authorization: Bearer [redacted]"
assert negative == {
    "missing_usage": "usage missing",
    "bad_tool_arguments": "tool arguments invalid",
    "unknown_stream_event": "unknown stream events: content_block_delta,vendor_new_event",
}
assert selection["openai_tool"]["entry"] == "compatible"
assert selection["chat_stream"]["entry"] == "reject"
assert selection["chat_stream_native"]["entry"] == "native"
assert NATIVE_EVIDENCE["chat"]["fixture_id"] == "chat-native-stream-v1"
print(json.dumps({
    "providers": sorted(normalized),
    "request_shapes": {"openai": "input", "anthropic": "messages", "chat": "messages"},
    "text": {key: value["content"][0]["text"] for key, value in normalized.items()},
    "tool_names": {key: value["tool_calls"][0]["name"] for key, value in normalized.items()},
    "stream_types": {key: [event["type"] for event in value] for key, value in streamed.items()},
    "errors": {key: value["category"] for key, value in classified.items()},
    "error_summaries": {key: value["summary"] for key, value in classified.items()},
    "negative": negative,
    "selection": selection,
    "native_evidence": NATIVE_EVIDENCE["chat"]["fixture_id"],
    "stream_alerts": unknown_stream_events("anthropic", STREAMS["anthropic"]),
    "unknown_fields": sorted(normalized["openai"]["extensions"]["top_level"]),
    "raw_finish_reasons": {key: value["extensions"]["raw_finish_reason"]
                           for key, value in normalized.items()},
    "raw_ref": normalized["anthropic"]["raw_ref"],
    "adapter_version": version_record["adapter_version"],
}, ensure_ascii=False, sort_keys=True))
```

### 观察输出

{% note success flat %}
输出必须同时证明三种请求形状都完成了语义映射，文本块与工具块仍按原顺序保留，Usage、raw 引用和嵌套未知块没有丢失，流式结束事件存在，未知事件会被保留并触发告警，且 `429`、`529` 与 `400` 被分为不同的失败类别。缺少 Usage 和非法工具参数必须被拒绝；`vendor_trace` 仍出现在扩展字段列表，但没有被写入普通业务日志。
{% endnote %}

```text
{"adapter_version": "canonical-v1", "error_summaries": {"anthropic": "busy", "chat": "invalid Authorization: Bearer [redacted]", "openai": "slow down"}, "errors": {"anthropic": "unavailable", "chat": "invalid_request", "openai": "rate_limit"}, "native_evidence": "chat-native-stream-v1", "negative": {"bad_tool_arguments": "tool arguments invalid", "missing_usage": "usage missing", "unknown_stream_event": "unknown stream events: content_block_delta,vendor_new_event"}, "providers": ["anthropic", "chat", "openai"], "raw_finish_reasons": {"anthropic": "tool_use", "chat": "tool_calls", "openai": "completed"}, "raw_ref": "fixture://anthropic/msg_fixture_001", "request_shapes": {"anthropic": "messages", "chat": "messages", "openai": "input"}, "selection": {"chat_stream": {"entry": "reject", "missing": ["stream"]}, "chat_stream_native": {"entry": "native", "missing": []}, "openai_tool": {"entry": "compatible", "missing": []}}, "stream_alerts": ["content_block_delta", "vendor_new_event"], "stream_types": {"anthropic": ["text_delta", "text_delta", "provider_event", "completed", "provider_event"], "openai": ["text_delta", "text_delta", "completed"]}, "text": {"anthropic": "需要查询库存", "chat": "库存为 12", "openai": "库存为 12"}, "tool_names": {"anthropic": "lookup_stock", "chat": "lookup_stock", "openai": "lookup_stock"}, "unknown_fields": ["vendor_trace"]}
```

{% note warning flat %}
这是确定性的合成输出，不是任何 Provider 的线上结果。它证明的是转换函数的输入、输出和失败表现；真实 Provider 可能新增字段、改变事件顺序或只在特定模型/账号开放能力，因此仍要保存原始响应快照并在版本变化时重跑适配测试。
{% endnote %}

## 适配测试

### 测试证据

{% note primary flat %}
适配测试应同时检查“统一层得到什么”和“统一层没有丢掉什么”。成功断言覆盖文本、工具、Usage 和结束原因；负例断言覆盖未知事件、缺少 Usage、格式错误和 Provider 错误。测试通过不代表 Provider 永久兼容，只代表在声明的 fixture 与适配器版本范围内成立。
{% endnote %}

| 检查层 | 必须保留 | 失败信号 | 处理动作 |
| --- | --- | --- | --- |
| 字段 | 文本块、工具 ID/名称/参数、Usage、结束原因 | 只返回文本或把 Usage 补成 `0` | 阻止发布并补映射 |
| 事件 | 增量、结束、错误、未知事件 | 流式结束丢失或未知事件静默消失 | 保留 raw event，升级适配器 |
| 错误 | HTTP 状态、Provider 类型、脱敏摘要 | 所有错误都变成 `Exception` | 按类别进入重试/降级策略 |
| 版本 | endpoint、模型、Provider schema、adapter version | 快照无法追溯来源 | 标记 unknown，不能比较旧结果 |
| 能力选择 | 兼容入口、原生入口和独立能力证据分别记录 | 未验证能力被标为支持 | 拒绝或补充对应 fixture 后再启用 |

{% note danger flat %}
不要用“所有字段都相同”作为兼容目标。统一接口越宽，越容易把 Provider 的独有能力伪装成通用能力；更安全的规则是：核心语义统一、原生差异显式保留、未知字段不静默删除、未验证能力不返回支持标志。
{% endnote %}

## 结果验证

{% note success flat %}
完成本节后的验收证据应包括：canonical request/response 的字段映射表、三种本地 Provider fixture 的正负例、流式事件序列、原始响应引用、能力选择结果和适配器版本记录。预期结果不是“所有接口看起来一样”，而是统一层保留文本、工具、Usage、错误和未知事件，并能在不兼容时给出可执行动作。
{% endnote %}

| 验收项 | 通过证据 | 失败复验 |
| --- | --- | --- |
| 统一字段 | 三种响应形状都得到文本块、工具调用、结束原因和 Usage | 检查字段来源，禁止静默补默认值 |
| 原生差异 | `extensions` 或 raw event 保留未知字段/事件 | 增加未知字段 fixture，确认不会被丢弃 |
| 错误映射 | `429` 为 `rate_limit`，`529` 为 `unavailable` | 加入 `401`、`400` 和未知错误类型 |
| 流式顺序 | 增量事件后有 completed，未知事件可见 | 打乱事件或删除结束事件，确认测试失败 |
| 版本追溯 | 记录 Provider、endpoint、模型和 adapter version | 更换 fixture schema 后重新生成快照 |

{% note info flat %}
本地测试不能证明线上 Provider 的实时字段、模型能力、配额或成本。上线前还需在明确的数据与预算范围内执行显式的真实接口验证；如果网络、权限或官方文档发生变化，保留本地通过证据，但把线上结论标记为未验证。
{% endnote %}

## 常见问题

{% flashcard basic id:llm-provider-normalization-loss deck:"大模型应用开发" priority:1 tags:"Provider适配,接口设计" %}
--- question
统一接口最容易丢失什么信息？
--- answer
最容易丢失内容块、工具调用、流式事件、Usage、结束原因和 Provider 错误类型；只保留一个文本字符串会让业务无法判断下一步动作。
--- explanation
一个响应可能同时包含文本和工具调用，流式响应还需要增量与结束事件。若适配器只返回 `text`，调用方看不到工具参数和 `stop_reason`，也无法区分“模型正常结束”和“服务暂时不可用”。统一层应使用有序内容块和工具列表，保留 Usage、结束原因、请求 ID 及受控扩展；未知字段可以暂存，但不能把未知值补成成功或零。
{% endflashcard %}

{% flashcard basic id:llm-provider-compat-native deck:"大模型应用开发" priority:2 tags:"Provider适配,接口设计" %}
--- question
兼容接口和原生接口如何共存？
--- answer
用统一契约承载跨 Provider 的核心能力，用能力探测和 feature flag 选择兼容入口；需要独有能力时走原生入口，并保留两者的版本和原始响应证据。
--- explanation
兼容 API 适合文本、基础消息和一组经过验证的公共参数，但不保证所有工具、内容块、流式事件和错误语义相同。适配器应在执行前检查当前请求需要的能力：

1. 核心能力能映射时返回统一请求，并在响应中保留原生差异。
2. 能力未验证或不支持时拒绝、降级或选择原生 API，而不是返回“支持”。
3. 每次选择记录 Provider、endpoint、模型、adapter version 和测试快照范围，方便回滚与复验。
{% endflashcard %}

## 参考资料

### 官方资料1

{% linkgroup %}
{% link OpenAI Responses API, https://platform.openai.com/docs/api-reference/responses, https://platform.openai.com/favicon.ico %}
{% link OpenAI Chat Completions API Reference, https://platform.openai.com/docs/api-reference/chat, https://platform.openai.com/favicon.ico %}
{% link Anthropic Messages API, https://docs.anthropic.com/en/api/messages, https://docs.anthropic.com/favicon.ico %}
{% link Gemini Interactions API, https://ai.google.dev/gemini-api/docs/interactions-overview, https://ai.google.dev/favicon.ico %}
{% link xAI Chat Completions REST API, https://docs.x.ai/developers/rest-api-reference/inference/chat, https://docs.x.ai/favicon.ico %}
{% endlinkgroup %}

### 官方资料2

{% linkgroup %}
{% link DeepSeek Chat Completion API, https://api-docs.deepseek.com/api/create-chat-completion/, https://api-docs.deepseek.com/favicon.ico %}
{% link Kimi Chat API, https://platform.kimi.ai/docs/api/chat, https://platform.kimi.ai/favicon.ico %}
{% link Z.ai GLM Chat Completion, https://docs.z.ai/api-reference/llm/chat-completion, https://docs.z.ai/favicon.ico %}
{% link Qwen OpenAI-compatible Chat Completions, https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions, https://www.alibabacloud.com/favicon.ico %}
{% endlinkgroup %}

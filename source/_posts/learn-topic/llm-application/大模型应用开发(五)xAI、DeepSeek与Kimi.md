---
title: 大模型应用开发(五)xAI、DeepSeek与Kimi
tags:
  - 大模型应用开发
  - xAI、DeepSeek与Kimi
categories:
  - Learn Topic
  - 大模型应用开发
description: 能分别识别 xAI Chat 与 Responses 的请求和响应边界，再比较 DeepSeek、Kimi 的兼容入口、模型字段、状态与流式差异。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 5
published: false
abbrlink: cb536808
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节围绕一个任务判断四类入口：xAI Chat、xAI Responses、DeepSeek 兼容接口和 Kimi Chat。目标不是把它们包装成同一个 API，而是能指出每个入口的请求形状、响应位置、状态与流式边界，并在兼容外观失效时停止错误迁移。
{% endnote %}

<!-- concept-story:start -->
一个客服团队想把旧的聊天接口换成带状态的 Responses，同时保留 DeepSeek 和 Kimi 作为备用 Provider。值班工程师先把 `messages` 改成 `input`，普通测试通过了；遇到工具调用时，前端却继续读取 `choices[0].message.content`，结果把工具请求当成了空答复。切到 Kimi 后，团队又发现它不会替他们保存上一轮 `messages`，而 DeepSeek 的 Anthropic 兼容入口还会忽略一部分 Anthropic 专属字段。

如果只按“都兼容 OpenAI”选择入口，故障通常不会出在第一条文本，而会出在状态、工具、流式结束标记或错误策略。团队需要先记录端点身份，再为每个入口保留自己的 raw 响应和失败理由。
<!-- concept-story:end -->

## 三家入口

### xAI双入口

{% note info flat %}
xAI 同时提供 `/v1/chat/completions` 和 `/v1/responses`。前者沿用 `messages` → `choices` 的 Chat 形状；后者以 `input` → `output` 项目组织响应，并可以用 `previous_response_id` 继续对话。xAI 当前文档把 Responses 作为首选交互方式，但这不等于旧 Chat 入口的每个参数都能迁移过去。
{% endnote %}

| 入口 | 请求定位 | 响应定位 | 状态与历史 | 迁移边界 |
| --- | --- | --- | --- | --- |
| xAI Chat | `model`、`messages`、可选 `tools` | `choices[].message`、`tool_calls`、`finish_reason` | 调用方拼接 `messages` | 不把 `choices` 当成 Responses 的 `output` |
| xAI Responses | `model`、`input`、`tools`、`store`、`previous_response_id` | `output` 项目、`status`、`usage` | 可保存响应并用 ID 继续；`store` 是独立选择 | 不把 `messages` 原样改名为 `input` |
| DeepSeek Chat | `model`、`messages`、`stream` | `choices[].message`、`usage` | 兼容 Chat 形状，历史由客户端管理 | `base_url` 和模型名属于 DeepSeek 侧配置 |
| Kimi Chat | `model`、`messages`、可选工具和思考设置 | `choices[].message`、`tool_calls`、`usage` | Kimi Chat API 是无状态调用方，历史要回传 | OpenAI 外观不代表状态和模型能力相同 |

Responses 的 `store` 需要单独做数据保留判断：xAI 文档说明存储响应可在一段时间后删除，不能据此设计永久会话。需要长期保存时，应用仍要决定是否在自己的边界保留脱敏历史，并把 `previous_response_id` 当作远程资源引用而不是本地消息数组的别名。

### 兼容入口

{% note primary flat %}
DeepSeek 的官方文档同时给出 OpenAI 兼容入口和 Anthropic 兼容入口：前者使用 `https://api.deepseek.com`，后者使用 `https://api.deepseek.com/anthropic`。Kimi 的 Chat API 也采用 `messages`、`choices`、`tools` 等熟悉形状。这里的“兼容”只表示某个协议入口可以复用部分客户端代码；模型、字段支持、错误、限流和上下文策略仍须逐项验证。
{% endnote %}

| Provider 入口 | 可复用的外观 | 必须重新确认的字段 | 不能推导的结论 |
| --- | --- | --- | --- |
| DeepSeek OpenAI | `chat.completions.create`、`messages`、`stream` | 模型 ID、思考设置、视觉/工具能力和限流 | 不能由 OpenAI SDK 签名推出 DeepSeek 全部能力 |
| DeepSeek Anthropic | `messages.create`、`content`、`tool_use` | `model` 映射、被忽略字段、支持的工具/内容块 | 不能把它当成完整 Anthropic 服务 |
| Kimi Chat | `messages`、`choices`、JSON Schema 工具 | 模型系列、思考开关、`reasoning_effort`、多模态内容和无状态历史 | 不能把 Kimi 模型名或上下文策略替换成 DeepSeek 的 |

SDK 的 `create` 签名可能列出 `audio`、`logprobs`、`response_format`、`service_tier`、`stream_options`、`timeout` 等大量参数；这只是客户端能够构造参数，不证明四个入口都会接受、执行或返回等价字段。适配层要把“SDK 可传”“wire 可收”“响应可解析”分成三列记录。

## 兼容边界

### Kimi能力

{% note info flat %}
Kimi API 文档当前列出 `kimi-k3`、`kimi-k2.7-code`、`kimi-k2.6` 等模型入口；模型列表会变化，示例名称不应写成永久白名单。Kimi Chat 支持文本消息、部分图像/视频内容、工具调用、JSON/JSON Schema 输出和 SSE 流式响应，但具体模型会改变思考、上下文和参数限制。
{% endnote %}

| 能力 | Kimi 入口观察点 | 应记录的证据 | 失败动作 |
| --- | --- | --- | --- |
| 模型 | `model` | 账号实际可用的模型 ID 和日期 | 不用另一个 Provider 的模型名兜底 |
| 消息 | `messages[].content` 可为字符串或内容数组 | 每种 `type` 与媒体输入形状 | 不把媒体项目压成未经验证的字符串 |
| 思考 | `reasoning_effort` 或模型专用 `thinking` | 请求开关、响应中的 `reasoning_content` 是否出现 | 不把推理字段当成最终 `content` |
| 工具 | `tools`、`tool_choice`、响应 `tool_calls` | 名称、调用 ID、JSON 参数和 `finish_reason` | 先执行 schema fixture，不直接执行未知参数 |
| 流式 | `stream`、`stream_options`、SSE chunk | `delta`、结束原因、可选 usage chunk 和 `[DONE]` | 缺少结束证据时标记请求未完成 |
| 历史 | 每次请求的 `messages` | 是否由客户端完整回传上一轮 | 不把远程响应 ID 当成 Kimi 的状态句柄 |

Kimi K3 的思考策略和 K2.x 的 `thinking` 设置不是同一个开关；即使两个请求都能返回文本，也要把模型、开关和响应字段一起记录。模型能力矩阵应当是应用配置的一部分，而不是隐藏在“OpenAI 兼容”分支里的默认值。

### 兼容层不能隐藏的差异

{% note warning flat %}
兼容层只能降低请求接入成本，不能替业务层决定状态、工具、流式和错误语义。xAI Responses 的部分 Chat 参数在官方文档中标为不支持；DeepSeek Anthropic 兼容入口会忽略或限制若干 Anthropic 字段；Kimi Chat 需要调用方回传历史。遇到不支持字段，应拒绝、降级到已验证入口或保留原始请求，不要静默删除后声称功能仍然等价。
{% endnote %}

| 差异维度 | 表面相似处 | 真正要比对的证据 | 不能偷换的字段 |
| --- | --- | --- | --- |
| 端点 | 都能发送一段文本 | URL、认证头、请求根字段和响应根字段 | xAI `input` 与 Chat `messages` |
| 工具 | 都可能返回函数调用 | 定义格式、调用 ID、参数编码、结果回传协议 | `tool_calls`、`function_call`、`tool_use` |
| 状态 | 都有 ID 或 model 字段 | 是否存储、如何续接、何时过期 | `previous_response_id` 不等于客户端历史 |
| 流式 | 都可逐段输出 | SSE 数据形状、结束标记、usage chunk 和错误事件 | `delta`、`output_text.delta`、`[DONE]` |
| 错误 | 都可能返回 HTTP 4xx/5xx | Provider 错误类型、可重试性和 Retry-After | 认证、权限、限流、参数错误不能共用策略 |
| 模型 | 请求都有 `model` | 账号可用模型、参数范围和能力声明 | 不把 `grok-*`、`deepseek-*`、`kimi-*` 互换 |

## 最小实践

### 准备输入

{% note info flat %}
下面的代码只使用四套内联合成 fixture：xAI Chat、xAI Responses、DeepSeek Chat 和 Kimi Chat。它不安装 SDK、不访问网络、不读取环境变量，也不包含真实 Key。每个入口有独立请求、响应和流式 parser；共同的输出只用于比较，不反向证明线上协议完全相同。
{% endnote %}

### 执行步骤

```python
import copy
import json

TASK = "查询 A-17 的库存，必要时请求 lookup_stock 工具"
TOOL_SCHEMA = {
    "type": "function",
    "name": "lookup_stock",
    "description": "查询一个 SKU 的库存",
    "parameters": {
        "type": "object",
        "properties": {"sku": {"type": "string"}},
        "required": ["sku"],
    },
}

REQUESTS = {
    "xai_chat": {
        "endpoint": "/v1/chat/completions",
        "model": "fixture-xai-chat",
        "messages": [{"role": "user", "content": TASK}],
        "tools": [{"type": "function", "function": {
            "name": "lookup_stock",
            "description": TOOL_SCHEMA["description"],
            "parameters": TOOL_SCHEMA["parameters"],
        }}],
        "stream": True,
    },
    "xai_responses": {
        "endpoint": "/v1/responses",
        "model": "fixture-xai-responses",
        "input": [{"role": "user", "content": [{"type": "input_text", "text": TASK}]}],
        "tools": [TOOL_SCHEMA],
        "previous_response_id": "resp_previous_001",
        "store": False,
        "stream": True,
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "model": "deepseek-v4-flash",
        "messages": [{"role": "user", "content": TASK}],
        "thinking": {"type": "enabled"},
        "reasoning_effort": "high",
        "stream": True,
    },
    "kimi": {
        "base_url": "https://platform.kimi.ai",
        "model": "kimi-k3",
        "messages": [{"role": "user", "content": TASK}],
        "tools": [{"type": "function", "name": TOOL_SCHEMA["name"],
                   "description": TOOL_SCHEMA["description"],
                   "parameters": TOOL_SCHEMA["parameters"]}],
        "reasoning_effort": "high",
        "stream": True,
    },
}

RESPONSES = {
    "xai_chat": {
        "id": "chat_fixture_001",
        "object": "chat.completion",
        "model": "fixture-xai-chat",
        "choices": [{"message": {
            "role": "assistant",
            "content": "库存为 12",
            "tool_calls": [{"id": "call_xai_001", "type": "function",
                            "function": {"name": "lookup_stock",
                                         "arguments": "{\"sku\":\"A-17\"}"}}],
        }, "finish_reason": "tool_calls"}],
        "usage": {"prompt_tokens": 18, "completion_tokens": 4, "total_tokens": 22},
    },
    "xai_responses": {
        "id": "resp_fixture_001",
        "object": "response",
        "status": "completed",
        "model": "fixture-xai-responses",
        "previous_response_id": "resp_previous_001",
        "output": [
            {"type": "message", "content": [{"type": "output_text", "text": "库存为 12"}]},
            {"type": "function_call", "call_id": "call_resp_001", "name": "lookup_stock",
             "arguments": "{\"sku\":\"A-17\"}"},
            {"type": "vendor_annotation", "payload": {"trace": "fixture-only"}},
        ],
        "usage": {"input_tokens": 18, "output_tokens": 4},
    },
    "deepseek": {
        "id": "deepseek_fixture_001",
        "object": "chat.completion",
        "model": "deepseek-v4-flash",
        "choices": [{"message": {
            "role": "assistant",
            "content": "库存为 12",
            "reasoning_content": "synthetic reasoning, not a model trace",
        }, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 18, "completion_tokens": 4, "total_tokens": 22},
    },
    "kimi": {
        "id": "kimi_fixture_001",
        "object": "chat.completion",
        "model": "kimi-k3",
        "choices": [{"message": {
            "role": "assistant",
            "content": "库存为 12",
            "reasoning_content": "synthetic reasoning, not a model trace",
            "tool_calls": [{"id": "call_kimi_001", "type": "function",
                            "function": {"name": "lookup_stock",
                                         "arguments": "{\"sku\":\"A-17\"}"}}],
        }, "finish_reason": "tool_calls"}],
        "usage": {"prompt_tokens": 18, "completion_tokens": 4, "total_tokens": 22},
    },
}

STREAMS = {
    "xai_chat": [
        {"object": "chat.completion.chunk",
         "choices": [{"delta": {"content": "库存为 12"}, "finish_reason": None}]},
        {"object": "chat.completion.chunk",
         "choices": [{"delta": {}, "finish_reason": "tool_calls"}]},
        {"object": "chat.completion.chunk", "choices": [],
         "usage": {"prompt_tokens": 18, "completion_tokens": 4}},
        {"object": "vendor.chunk", "payload": {"trace": "fixture-only"}},
        "[DONE]",
    ],
    "xai_responses": [
        {"type": "response.output_text.delta", "delta": "库存为 12"},
        {"type": "response.completed", "response": {"status": "completed"}},
        {"type": "vendor.event", "payload": {"trace": "fixture-only"}},
    ],
    "deepseek": [
        {"object": "chat.completion.chunk",
         "choices": [{"delta": {"content": "库存为 12"}, "finish_reason": None}]},
        {"object": "chat.completion.chunk",
         "choices": [{"delta": {}, "finish_reason": "stop"}]},
        {"object": "vendor.chunk", "payload": {"trace": "fixture-only"}},
        "[DONE]",
    ],
    "kimi": [
        {"object": "chat.completion.chunk",
         "choices": [{"delta": {"content": "库存为 12"}, "finish_reason": None}]},
        {"object": "chat.completion.chunk",
         "choices": [{"delta": {}, "finish_reason": "tool_calls"}]},
        {"object": "vendor.chunk", "payload": {"trace": "fixture-only"}},
        "[DONE]",
    ],
}

ERRORS = {
    "xai_chat": {"status": 429, "error": {"type": "rate_limit_error"}},
    "xai_responses": {"status": 400, "error": {"type": "invalid_request_error"}},
    "deepseek": {"status": 503, "error": {"type": "service_unavailable"}},
    "kimi": {"status": 403, "error": {"type": "forbidden"}},
}

UNSUPPORTED = {
    "xai_responses": {"field": "frequency_penalty", "reason": "Responses 文档标为不支持"},
    "deepseek": {"field": "previous_response_id", "reason": "Chat 兼容入口不提供 xAI 状态字段"},
    "kimi": {"field": "previous_response_id", "reason": "Kimi Chat 由调用方回传 messages"},
}


def validate_request(name, request):
    if name == "xai_responses":
        if "input" not in request or "messages" in request:
            raise ValueError("xAI Responses requires input and forbids Chat messages")
    else:
        if "messages" not in request or "input" in request:
            raise ValueError(f"{name} requires messages and forbids Responses input")
    if not request.get("model"):
        raise ValueError("model is required")
    return True


def parse_xai_chat(response):
    choice = response["choices"][0]
    message = choice["message"]
    return {
        "entry": "xai_chat",
        "text": message.get("content") or "",
        "tool_names": [item["function"]["name"] for item in message.get("tool_calls", [])],
        "finish_reason": choice["finish_reason"],
        "usage_source": "usage.prompt_tokens/completion_tokens",
        "model": response["model"],
        "state": "caller_managed",
        "unknown": [],
    }


def parse_xai_responses(response):
    blocks = []
    unknown = []
    for item in response.get("output", []):
        if item["type"] == "message":
            for part in item.get("content", []):
                if part["type"] == "output_text":
                    blocks.append({"type": "text", "text": part["text"]})
                else:
                    unknown.append(part["type"])
        elif item["type"] == "function_call":
            blocks.append({"type": "tool", "name": item["name"]})
        else:
            unknown.append(item["type"])
    return {
        "entry": "xai_responses",
        "text": "".join(block["text"] for block in blocks if block["type"] == "text"),
        "tool_names": [block["name"] for block in blocks if block["type"] == "tool"],
        "finish_reason": response["status"],
        "usage_source": "usage.input_tokens/output_tokens",
        "model": response["model"],
        "state": f"previous={response['previous_response_id']};store={REQUESTS['xai_responses']['store']}",
        "unknown": unknown,
    }


def parse_deepseek(response):
    choice = response["choices"][0]
    message = choice["message"]
    return {
        "entry": "deepseek",
        "text": message.get("content") or "",
        "tool_names": [],
        "finish_reason": choice["finish_reason"],
        "usage_source": "usage.prompt_tokens/completion_tokens",
        "model": response["model"],
        "state": "caller_managed",
        "reasoning_present": "reasoning_content" in message,
        "unknown": [],
    }


def parse_kimi(response):
    choice = response["choices"][0]
    message = response["choices"][0]["message"]
    return {
        "entry": "kimi",
        "text": message.get("content") or "",
        "tool_names": [item["function"]["name"] for item in message.get("tool_calls", [])],
        "finish_reason": choice["finish_reason"],
        "usage_source": "usage.prompt_tokens/completion_tokens",
        "model": response["model"],
        "state": "caller_managed",
        "reasoning_present": "reasoning_content" in message,
        "unknown": [],
    }


def parse_xai_chat_stream(events):
    text, finished, unknown = [], False, []
    for event in events:
        if event == "[DONE]":
            finished = True
        elif event.get("object") == "chat.completion.chunk":
            if not event.get("choices"):
                continue
            choice = event["choices"][0]
            delta = choice.get("delta", {})
            if delta.get("content") is not None:
                text.append(delta["content"])
            if choice.get("finish_reason"):
                finished = True
        else:
            unknown.append(event.get("object", "unknown"))
    return {"text": "".join(text), "finished": finished, "unknown": unknown}


def parse_xai_responses_stream(events):
    text, finished, unknown = [], False, []
    for event in events:
        if event.get("type") == "response.output_text.delta":
            text.append(event["delta"])
        elif event.get("type") == "response.completed":
            finished = event.get("response", {}).get("status") == "completed"
        else:
            unknown.append(event.get("type", "unknown"))
    return {"text": "".join(text), "finished": finished, "unknown": unknown}


def parse_deepseek_stream(events):
    text, finished, unknown = [], False, []
    for event in events:
        if event == "[DONE]":
            finished = True
        elif event.get("object") == "chat.completion.chunk":
            if event.get("choices"):
                choice = event["choices"][0]
                if choice.get("delta", {}).get("content") is not None:
                    text.append(choice["delta"]["content"])
                finished = finished or bool(choice.get("finish_reason"))
        else:
            unknown.append(event.get("object", "unknown"))
    return {"text": "".join(text), "finished": finished, "unknown": unknown}


def parse_kimi_stream(events):
    text, finished, unknown = [], False, []
    for event in events:
        if event == "[DONE]":
            finished = True
        elif event.get("object") == "chat.completion.chunk":
            if event.get("choices"):
                choice = event["choices"][0]
                if choice.get("delta", {}).get("content") is not None:
                    text.append(choice["delta"]["content"])
                finished = finished or bool(choice.get("finish_reason"))
        else:
            unknown.append(event.get("object", "unknown"))
    return {"text": "".join(text), "finished": finished, "unknown": unknown}


def classify_error(error):
    status = error.get("status")
    if status == 401:
        return "auth"
    if status == 403:
        return "permission"
    if status == 408:
        return "timeout"
    if status == 409:
        return "conflict"
    if status == 429:
        return "rate_limit"
    if isinstance(status, int) and 500 <= status <= 599:
        return "unavailable"
    if isinstance(status, int) and 400 <= status <= 499:
        return "invalid_request"
    return "unknown"


def reject_if_unsupported(name, request):
    rule = UNSUPPORTED.get(name)
    if rule and rule["field"] in request:
        raise ValueError(f"{name}.{rule['field']}: {rule['reason']}")


for name, request in REQUESTS.items():
    validate_request(name, request)
    reject_if_unsupported(name, request)

parsed = {
    "xai_chat": parse_xai_chat(RESPONSES["xai_chat"]),
    "xai_responses": parse_xai_responses(RESPONSES["xai_responses"]),
    "deepseek": parse_deepseek(RESPONSES["deepseek"]),
    "kimi": parse_kimi(RESPONSES["kimi"]),
}
streamed = {
    "xai_chat": parse_xai_chat_stream(STREAMS["xai_chat"]),
    "xai_responses": parse_xai_responses_stream(STREAMS["xai_responses"]),
    "deepseek": parse_deepseek_stream(STREAMS["deepseek"]),
    "kimi": parse_kimi_stream(STREAMS["kimi"]),
}
errors = {name: classify_error(error) for name, error in ERRORS.items()}
unsupported_rejections = {}
for name, rule in UNSUPPORTED.items():
    request = copy.deepcopy(REQUESTS[name])
    request[rule["field"]] = "fixture-only"
    try:
        reject_if_unsupported(name, request)
    except ValueError as error:
        unsupported_rejections[name] = str(error).split(":", 1)[0]

# 负例一：把 xAI Chat 的 messages 与 Responses 的 input 混在一起。
mixed_xai = copy.deepcopy(REQUESTS["xai_chat"])
mixed_xai["input"] = TASK
try:
    validate_request("xai_chat", mixed_xai)
except ValueError as error:
    mixed_error = type(error).__name__

# 负例二：未知响应项目和未知流事件都必须留在诊断结果中。
assert parsed["xai_responses"]["unknown"] == ["vendor_annotation"]
assert all(result["unknown"] for result in streamed.values())

assert set(parsed) == set(REQUESTS)
assert all(result["text"] == "库存为 12" for result in parsed.values())
assert parsed["xai_chat"]["tool_names"] == ["lookup_stock"]
assert parsed["xai_responses"]["tool_names"] == ["lookup_stock"]
assert parsed["kimi"]["tool_names"] == ["lookup_stock"]
assert parsed["xai_responses"]["state"] == "previous=resp_previous_001;store=False"
assert all(result["finished"] for result in streamed.values())
assert all(result["text"] == "库存为 12" for result in streamed.values())
assert errors == {
    "xai_chat": "rate_limit", "xai_responses": "invalid_request",
    "deepseek": "unavailable", "kimi": "permission",
}
assert unsupported_rejections == {
    "xai_responses": "xai_responses.frequency_penalty",
    "deepseek": "deepseek.previous_response_id",
    "kimi": "kimi.previous_response_id",
}
assert mixed_error == "ValueError"
assert parsed["deepseek"]["reasoning_present"] is True
assert parsed["kimi"]["reasoning_present"] is True

print(json.dumps({
    "parsed": {
        name: {
            "text": result["text"],
            "tools": result["tool_names"],
            "finish_reason": result["finish_reason"],
            "usage_source": result["usage_source"],
            "state": result["state"],
        }
        for name, result in parsed.items()
    },
    "streams": streamed,
    "errors": errors,
    "unsupported": unsupported_rejections,
    "negative": {
        "mixed_xai_fields": mixed_error,
        "unknown_response": parsed["xai_responses"]["unknown"],
    },
}, ensure_ascii=False, sort_keys=True))
```

### 观察输出

{% note success flat %}
预期输出应显示四个独立入口都得到相同的合成文本，但 `parsed` 仍保留不同的结束字段、Usage 位置、状态策略和工具结果；xAI Responses 保存 `previous_response_id` 与 `store` 的选择，DeepSeek/Kimi 的兼容接口仍由调用方管理历史。四类流式 parser 都观察到完成证据和未知事件，限流、参数、服务不可用、权限分别进入不同分类；混用 `input/messages` 与注入不支持字段都会被拒绝。
{% endnote %}

```text
{"errors": {"deepseek": "unavailable", "kimi": "permission", "xai_chat": "rate_limit", "xai_responses": "invalid_request"}, "negative": {"mixed_xai_fields": "ValueError", "unknown_response": ["vendor_annotation"]}, "parsed": {"deepseek": {"finish_reason": "stop", "state": "caller_managed", "text": "库存为 12", "tools": [], "usage_source": "usage.prompt_tokens/completion_tokens"}, "kimi": {"finish_reason": "tool_calls", "state": "caller_managed", "text": "库存为 12", "tools": ["lookup_stock"], "usage_source": "usage.prompt_tokens/completion_tokens"}, "xai_chat": {"finish_reason": "tool_calls", "state": "caller_managed", "text": "库存为 12", "tools": ["lookup_stock"], "usage_source": "usage.prompt_tokens/completion_tokens"}, "xai_responses": {"finish_reason": "completed", "state": "previous=resp_previous_001;store=False", "text": "库存为 12", "tools": ["lookup_stock"], "usage_source": "usage.input_tokens/output_tokens"}}, "streams": {"deepseek": {"finished": true, "text": "库存为 12", "unknown": ["vendor.chunk"]}, "kimi": {"finished": true, "text": "库存为 12", "unknown": ["vendor.chunk"]}, "xai_chat": {"finished": true, "text": "库存为 12", "unknown": ["vendor.chunk"]}, "xai_responses": {"finished": true, "text": "库存为 12", "unknown": ["vendor.event"]}}, "unsupported": {"deepseek": "deepseek.previous_response_id", "kimi": "kimi.previous_response_id", "xai_responses": "xai_responses.frequency_penalty"}}
```

## 差异测试

### 兼容层不能隐藏的差异

{% note warning flat %}
把一个兼容请求送进另一个端点，是最小但有效的失败复验：xAI Chat 只能按 `messages/choices` 检查，xAI Responses 只能按 `input/output/status` 检查；DeepSeek 和 Kimi 即使都能复用 Chat 客户端，也要分别断言模型、思考、工具、流式和历史字段。任何被 Provider 忽略的字段都应写进差异记录，而不是从请求中悄悄删除。
{% endnote %}

| 复验动作 | 期待失败 | 正确结论 |
| --- | --- | --- |
| 给 xAI Chat 请求加入 `input` | 路由校验失败 | 端点根字段不同 |
| 给 xAI Responses 请求加入 `messages` | 路由校验失败 | 迁移不是字段重命名 |
| 给 DeepSeek Chat 加入 `previous_response_id` | 兼容策略拒绝 | DeepSeek Chat 不继承 xAI 状态协议 |
| 给 Kimi Chat 加入 `previous_response_id` | 兼容策略拒绝 | Kimi 历史由 `messages` 管理 |
| 把 xAI Responses 的 `frequency_penalty` 当普通字段传入 | 不支持字段被拒绝 | 以当前 Provider 文档和 fixture 为准 |
| 删除 SSE 的结束标记 | `finished` 为假 | 未完成的流不能当作成功答复 |

验证兼容层时，至少保存三类记录：请求字段是否被发送、Provider 是否接受、响应是否能被完整解析。只记录“HTTP 200”会漏掉工具调用、思考字段、候选结束原因和状态续接等失败。

## 结果验证

### 验收证据

| 验收项 | 通过证据 | 失败信号 | 复测动作 |
| --- | --- | --- | --- |
| xAI 入口 | Chat 读取 `messages/choices`，Responses 读取 `input/output/status` | 用一个 parser 处理两种根结构 | 交换 `input` 与 `messages` 并确认拒绝 |
| DeepSeek | OpenAI 与 Anthropic 入口的差异被单独记录 | 兼容外观被写成完整语义兼容 | 加入被忽略或不支持字段 fixture |
| Kimi | 模型、思考、工具、流式和无状态历史均有字段证据 | 只断言 `choices[0].message.content` | 删除 `reasoning_content` 或工具调用并复验 |
| 流式 | 四个 parser 都观察到增量、结束和未知事件 | 只拼接文本，不判断结束 | 删除 `[DONE]` 或完成事件 |
| 错误 | 429、400、503、403 进入不同策略 | 所有异常都重试 | 加入超时、冲突和未知错误 |
| 安全 | fixture 不含真实 Key，请求路由不执行外部调用 | 把本地文本当线上能力证明 | 真实调用前重新确认模型、额度和数据范围 |

### 复测动作

{% note info flat %}
当 Provider 文档、模型列表或 SDK 版本变化时，先刷新四套请求/响应 fixture，再跑 parser 和失败断言。只要某个字段的“接受”“执行”“返回”三层证据不一致，就把该字段从兼容层移入显式能力矩阵，并选择拒绝、降级或原生入口；不要把变化隐藏在通用 `**kwargs` 中。
{% endnote %}

1. 先确认请求根字段和认证方式，再确认模型 ID 是否属于当前账号。
2. 分别记录正常文本、工具调用、流式结束、Usage、错误类型和未知字段。
3. 对 DeepSeek 与 Kimi 逐个复验兼容字段，不能用 xAI 的状态结论覆盖它们。
4. 只有在专用 Key、预算、数据范围和外部副作用都得到明确许可后，才把合成 fixture 替换成真实请求；真实响应仍要按入口自己的 schema 解析。

## 常见问题

{% flashcard basic id:llm-xai-chat-responses-boundary deck:"大模型应用开发" priority:1 tags:"xAI、DeepSeek与Kimi,接口选择" %}
--- question
xAI Chat 与 xAI Responses 为什么不能只改字段名？
--- answer
因为两者是不同的端点协议：Chat 以 `messages/choices` 为核心，Responses 以 `input/output/status` 为核心，并额外处理 `previous_response_id` 与 `store`。
--- explanation
迁移至少要同时检查四层：

1. 请求根字段：Chat 的历史在 `messages`，Responses 的输入在 `input`；工具定义也不应直接沿用未验证的嵌套形状。
2. 响应遍历：Chat 从 `choices[].message` 读取内容，Responses 要遍历 `output` 项目，文本和工具调用可能是不同项目。
3. 状态策略：Responses 的响应 ID 可以参与后续请求，但是否保存、何时过期和如何脱敏不能由 Chat 的客户端历史推断。
4. 流式事件：两者的增量和完成事件名字、载荷和 usage 位置不同；缺少结束证据时不能把已拼接文本当成功。

如果任务只需要已验证的 Chat 能力，可以保留 Chat；需要 Responses 的状态或项目化输出时，应走原生入口并保留两套 parser。
{% endflashcard %}

{% flashcard basic id:llm-compatible-not-full-semantics deck:"大模型应用开发" priority:1 tags:"xAI、DeepSeek与Kimi,兼容边界" %}
--- question
DeepSeek 或 Kimi 兼容 OpenAI，是否就等于完整的 OpenAI 语义？
--- answer
不等于。兼容通常只覆盖部分请求和响应外观；模型、工具、思考、流式、错误、限流和历史策略仍要用 Provider 自己的证据验证。
--- explanation
可以把兼容判断拆成三层：

| 层 | 要问的问题 | 证据 |
| --- | --- | --- |
| 客户端 | SDK 能否构造并发送字段？ | 签名、序列化请求和 endpoint |
| Provider | 该模型是否接受并执行字段？ | 成功响应、明确的不支持错误或文档声明 |
| 统一层 | 响应是否完整可解释？ | 文本、工具、结束原因、Usage、原始扩展和错误分类 |

例如 DeepSeek 的 Anthropic 入口会对部分 Anthropic 字段忽略或限制，Kimi 的 Chat API 需要调用方维护消息历史；这些事实都不能从 `chat.completions.create` 这个方法名推出。发现三层证据不一致时，适配器应保留原始字段并拒绝未验证能力，而不是静默降级成一段文本。
{% endflashcard %}

## 参考资料

### 官方资料

{% linkgroup %}
{% link xAI API Reference, https://docs.x.ai/docs/api-reference, https://docs.x.ai/favicon.ico %}
{% link xAI Generate Text, https://docs.x.ai/docs/guides/chat, https://docs.x.ai/favicon.ico %}
{% link DeepSeek API Docs, https://api-docs.deepseek.com/, https://api-docs.deepseek.com/favicon.ico %}
{% link DeepSeek Anthropic API, https://api-docs.deepseek.com/guides/anthropic_api, https://api-docs.deepseek.com/favicon.ico %}
{% link Kimi Chat Completions API, https://platform.kimi.ai/docs/api/chat, https://platform.kimi.ai/favicon.ico %}
{% endlinkgroup %}

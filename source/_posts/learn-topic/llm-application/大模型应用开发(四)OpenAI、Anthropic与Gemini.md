---
title: 大模型应用开发(四)OpenAI、Anthropic与Gemini
tags:
  - 大模型应用开发
  - OpenAI、Anthropic与Gemini
categories:
  - Learn Topic
  - 大模型应用开发
description: 能选择一个统一任务的主入口，读取 Responses、Messages、generateContent 与 Interactions 的关键 schema 差异，并把兼容入口放入迁移路径。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 4
published: false
abbrlink: 5bc5b66d
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：用同一个“生成一段客服答复”的任务，对照 OpenAI Responses、OpenAI Chat Completions、Anthropic Messages、Gemini generateContent 和 Gemini Interactions 的入口、请求、响应与错误边界。成功证据不是把五套 JSON 改成同一份，而是能选定一个主入口，保留无法统一的内容块和事件，并把兼容入口的迁移风险写进验证清单。
{% endnote %}

<!-- concept-story:start -->

一个客服应用先用 Chat Completions 返回字符串，后来为了接入工具调用又改到 Responses。开发者把 `messages` 原样改名为 `input`，普通问题仍然有答案；当响应包含工具调用时，前端却把整个 `output` 数组拼成了空字符串。接着团队接入 Anthropic，发现文本和工具都位于内容块中；换到 Gemini 后，又遇到 generateContent 与 Interactions 使用不同的资源和状态。

如果每次切换 Provider 都只做字段替换，应用表面上“兼容”，实际会丢失结束原因、工具参数、事件顺序或错误类型。团队先固定一个任务和一份内部结果契约，再把每个入口当成独立的 schema：能映射的字段写入统一层，不能映射的字段保留原样，未验证的能力直接拒绝。

<!-- concept-story:end -->

{% note info flat %}
上面的情境是虚构的设计场景。本文不比较模型质量，也不把一个 Provider 的字段规则推广给其他 Provider；重点是识别入口身份、读取最小 schema、判断迁移边界。真实请求只有在读者明确配置凭据后才会发生，本地 fixture 不冒充线上响应。
{% endnote %}

## 三家入口

### Responses与Chat

{% note primary flat %}
Responses 与 Chat Completions 都能承载文本任务，但它们不是同一响应协议。Responses 以 `input` 和输出项目组织请求/结果；Chat Completions 以有序 `messages` 和 `choices` 组织请求/结果。选择时先看目标能力和已有代码的迁移成本，再决定主入口，不能只把 endpoint 或字段名替换掉。
{% endnote %}

| 入口 | 请求入口 | 请求核心 | 响应核心 | 迁移时必须检查 |
| --- | --- | --- | --- | --- |
| OpenAI Responses | `POST /v1/responses` | `model`、`input`、可选 `tools` | `output` 项目、状态、usage | 输出可能包含文本、工具调用或其他类型项目，不能直接取任意数组元素 |
| OpenAI Chat Completions | `POST /v1/chat/completions` | `model`、`messages`、可选 `tools` | `choices[].message`、finish reason、usage | `choices`、消息内容和工具调用的嵌套结构不能映射成一个字符串 |

{% note info flat %}
上表只给出阅读 schema 时的定位点。模型名、参数可用性、工具格式和流式事件应以当前官方 API Reference 为准；“兼容”表示部分形状相近，不表示 Responses 与 Chat Completions 的所有能力和生命周期一致。
{% endnote %}

### 内容块与工具

{% note info flat %}
Anthropic Messages 的响应 `content` 是有序内容块；一个响应可以先有文本，再有 `tool_use`，也可以包含其他块。OpenAI 的 Responses 同样把输出拆成项目。一个统一适配器应把这些项目映射为有序的内部块，同时单独提供工具调用索引，方便业务选择下一步动作。
{% endnote %}

| 观察对象 | 需要保留的事实 | 丢失后的后果 |
| --- | --- | --- |
| 文本 | 块类型、文本顺序和空文本边界 | 流式拼接或多段内容顺序错误 |
| 工具 | 调用 ID、名称、结构化参数和结束原因 | 业务无法安全执行工具或关联结果 |
| 状态 | 完成、工具等待、失败或未完成 | 把等待/失败误当成成功回答 |
| Usage | 输入、输出及字段来源 | 成本观测被误算，缺失被误写成零 |
| 错误 | HTTP 状态、Provider 类型和脱敏摘要 | 所有错误都进入同一条重试路径 |

{% note warning flat %}
内容块是数据结构，不是“把所有文本连起来”的中间步骤。解析器应先遍历块并保留未知块，再按 `type` 提取文本或工具；未知块不能静默丢弃，也不能因为当前示例只有文本就把响应契约缩成 `str`。
{% endnote %}

## 请求差异

### Gemini入口

{% note info flat %}
Gemini generateContent 与 Interactions 都是 Gemini API 的入口，但资源模型不同。generateContent 以内容请求/候选结果为主；Interactions 以一个交互资源承载状态、步骤时间线和可选的多轮续接。新项目要根据是否需要交互状态、工具编排和可观察步骤来选入口，而不是把一个 endpoint 名称换成另一个。
{% endnote %}

| 入口 | 请求观察点 | 响应观察点 | 状态或多轮边界 |
| --- | --- | --- | --- |
| `generateContent` | `contents`、生成配置和安全相关设置 | `candidates`、内容 parts、finish reason、usage metadata | 需要由客户端维护历史和解析候选；不要假设候选就是纯文本 |
| `Interactions` | `model`、`input`，可选 `previous_interaction_id`、工具和存储选项 | interaction ID、状态、`steps`/兼容 `outputs` | 服务端状态、存储和无状态请求是不同选择；不能当成客户端缓存的别名 |

{% note warning flat %}
Interactions 的状态/存储语义和 generateContent 的候选响应不能互相拼接。若应用只需要一次无状态内容生成，可以保留 generateContent；若需要交互 ID、执行步骤或多轮续接，应按 Interactions 的资源生命周期实现，并为存储策略单独验收。generateContent 的流式变体也应按其官方事件/候选格式单独解析，不能直接套用 Interactions 的步骤时间线。
{% endnote %}

{% note info flat %}
当前 Interactions 参考资料使用 `steps` 时间线；课程能力账本中的 `outputs` 是兼容命名，适配器应在边界处把旧响应映射到同一条内部步骤序列，再进入业务层。不能把 `outputs`、`steps` 或另一家 Provider 的 `output` 数组直接互换。
{% endnote %}

### 结果对照

{% note info flat %}
同一任务的“成功”也要用入口自己的证据判断。下面的对照只说明解析方向，不承诺某个字段在所有版本、模型或账号上都存在。
{% endnote %}

| 入口 | 文本定位 | 工具/事件定位 | 错误处理起点 |
| --- | --- | --- | --- |
| Responses | 遍历 `output` 中的消息/文本项目 | 遍历输出项目中的工具调用和事件 | HTTP 状态加 error 对象；保留 response 状态 |
| Chat Completions | 读取 `choices[].message` | 读取 message 中的 `tool_calls` 与 finish reason | HTTP 状态加 error 对象；保留 choice finish reason |
| Anthropic Messages | 遍历 `content` 的 text 块 | 读取 `tool_use` 块和 `stop_reason` | HTTP 状态加 error 对象；保留内容块类型 |
| Gemini generateContent | 遍历 candidate 的 `content.parts` | 读取候选中的 function call/响应字段 | HTTP/RPC 状态、候选 finish reason 和错误体 |
| Gemini Interactions | 遍历 interaction 的 `steps`（兼容 `outputs`） | 读取工具/执行步骤及资源状态 | interaction 状态、HTTP/RPC 状态和错误体 |

{% mermaid %}
flowchart TD
  A[统一任务请求] --> B[Provider 专用请求]
  B --> C[文本增量或输出项目]
  C --> D[工具/内容块或候选结果]
  D --> E[Provider 专用结束状态]
  E --> F[统一事件与结果]
  F --> G[错误、Usage 和能力验收]
{% endmermaid %}

{% note info flat %}
事件流程的节点名称可以统一，事件载荷不能直接共用：Responses 使用输出事件，Chat Completions 使用 chunk/结束标记，Messages 使用内容块事件，generateContent 使用 `candidates` 片段，Interactions 使用 `event_type` 标记的步骤事件。尤其要分别阅读 generateContent 的 `:streamGenerateContent` 变体与 Interactions 的 SSE 事件文档，不能因为都返回文本就复用同一个 parser。
{% endnote %}

## 最小实践

### 准备输入

{% note info flat %}
本实验冻结一个任务：“返回库存摘要，必要时请求 `lookup_stock` 工具”。Python 代码只处理内联的五类本地 fixture 和错误样例，不访问网络、不需要 SDK、不使用真实 Key。每个 parser 先保留内容块/原始字段，再提取给统一层使用的文本。
{% endnote %}

### 执行步骤

```python
import copy
import json

TASK = {
    "model": "fixture-model",
    "messages": [{"role": "user", "content": "查询 A-17 的库存"}],
    "tools": [{
        "type": "function",
        "function": {
            "name": "lookup_stock",
            "description": "查询一个 SKU 的库存",
            "parameters": {"type": "object", "properties": {"sku": {"type": "string"}}},
        },
    }],
    "stream": True,
}

FIXTURES = {
    "responses": {
        "id": "resp_fixture_001",
        "status": "completed",
        "output": [
            {"type": "message", "content": [
                {"type": "output_text", "text": "库存为 12"},
                {"type": "refusal", "refusal": "fixture refusal detail"},
            ]},
            {"type": "function_call", "call_id": "call_001", "name": "lookup_stock",
             "arguments": "{\"sku\":\"A-17\"}"},
            {"type": "vendor_annotation", "payload": {"trace": "fixture-only"}},
        ],
        "usage": {"input_tokens": 18, "output_tokens": 4},
    },
    "chat": {
        "id": "chatcmpl_fixture_001",
        "choices": [{"message": {
            "role": "assistant",
            "content": "库存为 12",
            "tool_calls": [{"id": "call_002", "type": "function",
                            "function": {"name": "lookup_stock", "arguments": "{\"sku\":\"A-17\"}"}}],
        }, "finish_reason": "tool_calls"}],
        "usage": {"prompt_tokens": 18, "completion_tokens": 4, "total_tokens": 22},
    },
    "anthropic": {
        "id": "msg_fixture_001",
        "content": [
            {"type": "text", "text": "库存为 12"},
            {"type": "tool_use", "id": "toolu_001", "name": "lookup_stock",
             "input": {"sku": "A-17"}},
            {"type": "vendor_content", "payload": {"trace": "fixture-only"}},
        ],
        "stop_reason": "tool_use",
        "usage": {"input_tokens": 18, "output_tokens": 4},
    },
    "generate_content": {
        "candidates": [{"content": {"parts": [
            {"text": "库存为 12"},
            {"functionCall": {"name": "lookup_stock", "args": {"sku": "A-17"}}},
            {"vendorBlock": {"trace": "fixture-only"}},
        ]}, "finishReason": "STOP"},
        {"index": 1, "safetyRatings": [{"category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                                         "probability": "NEGLIGIBLE"}]},
        ],
        "usageMetadata": {"promptTokenCount": 18, "candidatesTokenCount": 4, "totalTokenCount": 22},
    },
    "interactions": {
        "id": "interaction_fixture_001",
        "status": "completed",
        "steps": [
            {"type": "function_call", "status": "done", "id": "fc_001",
             "name": "lookup_stock", "arguments": {"sku": "A-17"}},
            {"type": "function_result", "status": "done", "call_id": "fc_001",
             "name": "lookup_stock", "result": [{"type": "text", "text": "12"}]},
            {"type": "model_output", "status": "done",
             "content": [{"type": "text", "text": "库存为 12"}]},
            {"type": "vendor_step", "status": "done", "payload": {"trace": "fixture-only"}},
        ],
        "usage": {"total_tokens": 22, "total_input_tokens": 18, "total_output_tokens": 4},
    },
}

EVENTS = {
    "responses": [{"type": "response.output_text.delta", "delta": "库存为 12"},
                  {"type": "response.completed"}],
    "chat": [{"object": "chat.completion.chunk",
              "choices": [{"delta": {"content": "库存为 12"}, "finish_reason": None}]},
             {"object": "chat.completion.chunk",
              "choices": [{"delta": {}, "finish_reason": "stop"}]},
             {"object": "chat.completion.chunk", "choices": [],
              "usage": {"prompt_tokens": 18, "completion_tokens": 4}},
             "[DONE]"],
    "anthropic": [{"type": "content_block_delta",
                   "delta": {"type": "text_delta", "text": "库存为 12"}},
                  {"type": "message_stop"}],
    "generate_content": [
        {"candidates": [{"content": {"parts": [
            {"text": "库存为 12"},
            {"functionCall": {"name": "lookup_stock", "args": {"sku": "A-17"}}}
        ]}}]},
        {"candidates": [{"finishReason": "STOP"}]},
    ],
    "interactions": [
        {"event_type": "interaction.created",
         "interaction": {"id": "interaction_fixture_001", "status": "in_progress"}},
        {"event_type": "step.delta", "index": 1,
         "delta": {"type": "text", "text": "库存为 12"}},
        {"event_type": "step.stop", "index": 1},
        {"event_type": "interaction.completed",
         "interaction": {"id": "interaction_fixture_001", "status": "completed",
                          "usage": {"total_tokens": 22}}},
    ],
}

ERRORS = {
    "responses": {"status": 400, "error": {"type": "invalid_request_error", "message": "bad field"}},
    "chat": {"status": 429, "error": {"type": "rate_limit_error", "message": "slow down"}},
    "anthropic": {"status": 401, "error": {"type": "authentication_error", "message": "unauthorized"}},
    "generate_content": {"status": 503, "error": {"type": "unavailable", "message": "busy"}},
    "interactions": {"status": 408, "error": {"type": "timeout", "message": "deadline"}},
    "permission": {"status": 403, "error": {"type": "forbidden", "message": "not allowed"}},
    "conflict": {"status": 409, "error": {"type": "conflict", "message": "state conflict"}},
    "unknown": {"status": 499, "error": {"type": "vendor_new_error", "message": "unclassified"}},
    "google_rpc": {"error": {"code": 7, "status": "PERMISSION_DENIED", "message": "not allowed"}},
}


def migrate_chat_to_responses(request):
    return {
        "model": request["model"],
        "input": [{"role": item["role"], "content": [{"type": "input_text", "text": item["content"]}]}
                  for item in request["messages"]],
        "tools": [{"type": "function", "name": tool["function"]["name"],
                   "description": tool["function"]["description"],
                   "parameters": tool["function"]["parameters"]}
                  for tool in request["tools"]],
        "stream": request["stream"],
    }


def parse_text(name, response):
    if name == "responses":
        return [part["text"] for item in response["output"] if item["type"] == "message"
                for part in item["content"] if part["type"] == "output_text"]
    if name == "chat":
        content = response["choices"][0]["message"].get("content")
        return [content] if content is not None else []
    if name == "anthropic":
        return [block["text"] for block in response["content"] if block["type"] == "text"]
    if name == "generate_content":
        return [part["text"] for candidate in response.get("candidates", [])
                for part in candidate.get("content", {}).get("parts", []) if "text" in part]
    timeline = response.get("steps", response.get("outputs", []))
    if timeline:
        return [
            part["text"]
            for step in timeline
            if step["type"] == "model_output"
            for part in step.get("content", []) if part["type"] == "text"
        ] + [step["text"] for step in timeline if step["type"] == "text"]
    return [response["output_text"]] if response.get("output_text") is not None else []


def parse_usage(name, response):
    if name == "generate_content":
        raw = response["usageMetadata"]
        return {
            "input_tokens": raw["promptTokenCount"],
            "output_tokens": raw["candidatesTokenCount"],
            "total_tokens": raw["totalTokenCount"],
            "source": "usageMetadata",
        }
    raw = response["usage"]
    if name == "chat":
        input_key, output_key = "prompt_tokens", "completion_tokens"
    elif name == "interactions":
        input_key, output_key = "total_input_tokens", "total_output_tokens"
    else:
        input_key, output_key = "input_tokens", "output_tokens"
    return {
        "input_tokens": raw[input_key],
        "output_tokens": raw[output_key],
        "total_tokens": raw.get("total_tokens", raw[input_key] + raw[output_key]),
        "source": f"usage.{input_key}/{output_key}",
    }


def canonical_response(name, response):
    blocks = []
    candidate_finish_reasons = {}
    if name == "responses":
        for item in response["output"]:
            if item["type"] == "message":
                for part in item["content"]:
                    if part["type"] == "output_text":
                        blocks.append({"type": "text", "text": part["text"]})
                    else:
                        blocks.append({"type": "provider_block", "provider_type": part["type"], "raw": part})
            elif item["type"] == "function_call":
                blocks.append({"type": "tool_call", "id": item["call_id"],
                               "name": item["name"], "arguments": json.loads(item["arguments"])})
            else:
                blocks.append({"type": "provider_block", "provider_type": item["type"], "raw": item})
        finish = response["status"]
    elif name == "chat":
        message = response["choices"][0]["message"]
        if message.get("content") is not None:
            blocks.append({"type": "text", "text": message["content"]})
        blocks.extend({"type": "tool_call", "id": item["id"],
                       "name": item["function"]["name"],
                       "arguments": json.loads(item["function"]["arguments"])}
                      for item in message.get("tool_calls", []))
        finish = response["choices"][0]["finish_reason"]
    elif name == "anthropic":
        for item in response["content"]:
            if item["type"] == "text":
                blocks.append({"type": "text", "text": item["text"]})
            elif item["type"] == "tool_use":
                blocks.append({"type": "tool_call", "id": item["id"],
                               "name": item["name"], "arguments": item["input"]})
            else:
                blocks.append({"type": "provider_block", "provider_type": item["type"], "raw": item})
        finish = response["stop_reason"]
    elif name == "generate_content":
        finish = None
        candidate_finish_reasons = {}
        for position, candidate in enumerate(response.get("candidates", [])):
            candidate_index = candidate.get("index", position)
            candidate_finish = candidate.get("finishReason")
            if candidate_finish:
                candidate_finish_reasons[str(candidate_index)] = candidate_finish
            parts = candidate.get("content", {}).get("parts", [])
            if not parts:
                blocks.append({"type": "provider_block", "provider_type": "candidate_without_content",
                               "candidate_index": candidate_index, "raw": candidate})
            for part in parts:
                if "text" in part:
                    blocks.append({"type": "text", "text": part["text"],
                                   "candidate_index": candidate_index})
                elif "functionCall" in part:
                    call = part["functionCall"]
                    blocks.append({"type": "tool_call", "name": call["name"],
                                   "arguments": call["args"], "candidate_index": candidate_index})
                else:
                    blocks.append({"type": "provider_block", "provider_type": "unknown_part",
                                   "candidate_index": candidate_index, "raw": part})
            finish = finish or candidate_finish
        finish = finish or "unknown"
    else:
        timeline = response.get("steps", response.get("outputs", []))
        for step in timeline:
            if step["type"] == "model_output":
                for part in step.get("content", []):
                    part_type = part.get("type", "unknown_part")
                    if part_type == "text":
                        blocks.append({"type": "text", "text": part["text"],
                                       "step_status": step.get("status")})
                    else:
                        blocks.append({"type": "provider_block", "provider_type": part_type,
                                       "step_status": step.get("status"), "raw": part})
            elif step["type"] == "text":
                blocks.append({"type": "text", "text": step["text"],
                               "step_status": step.get("status")})
            elif step["type"] == "function_call":
                blocks.append({"type": "tool_call", "id": step.get("id"),
                               "name": step["name"], "arguments": step["arguments"],
                               "step_status": step.get("status")})
            elif step["type"] == "function_result":
                blocks.append({"type": "tool_result", "call_id": step["call_id"],
                               "result": step["result"], "step_status": step.get("status")})
            else:
                blocks.append({"type": "provider_block", "provider_type": step["type"],
                               "step_status": step.get("status"), "raw": step})
        if not timeline and response.get("output_text") is not None:
            blocks.append({"type": "text", "text": response["output_text"]})
        finish = response["status"]
    return {
        "name": name,
        "blocks": blocks,
        "finish_reason": finish,
        "candidate_finish_reasons": candidate_finish_reasons,
        "output_text": response.get("output_text"),
        "usage": parse_usage(name, response),
        "raw_ref": f"fixture://{name}/{response.get('id', name)}",
    }


def normalize_error(error):
    body = error.get("error", {})
    http_status = error.get("status")
    rpc_status = body.get("status")
    error_type = body.get("type") or rpc_status or body.get("code", "unknown")
    if http_status == 401 or rpc_status == "UNAUTHENTICATED":
        category = "auth"
    elif http_status == 403 or rpc_status == "PERMISSION_DENIED":
        category = "permission"
    elif http_status == 409 or rpc_status == "ABORTED":
        category = "conflict"
    elif http_status == 429 or rpc_status == "RESOURCE_EXHAUSTED":
        category = "rate_limit"
    elif ((isinstance(http_status, int) and 500 <= http_status <= 599)
          or rpc_status == "UNAVAILABLE"):
        category = "unavailable"
    elif http_status == 408 or rpc_status == "DEADLINE_EXCEEDED":
        category = "timeout"
    elif isinstance(error_type, str) and error_type.startswith("vendor_"):
        category = "unknown"
    elif ((http_status is not None and 400 <= http_status <= 499)
          or rpc_status == "INVALID_ARGUMENT"):
        category = "invalid_request"
    else:
        category = "unknown"
    return {"status": http_status if http_status is not None else rpc_status,
            "category": category, "provider_type": error_type}


def normalize_events(name, event):
    if isinstance(event, str):
        if name == "chat" and event == "[DONE]":
            return [{"type": "stream_end"}]
        return [{"type": "provider_event", "raw": event}]

    event_type = event.get("type") or event.get("event_type") or event.get("object")
    if name == "responses" and event_type == "response.output_text.delta":
        return [{"type": "text_delta", "text": event["delta"]}]
    if name == "chat" and event_type == "chat.completion.chunk":
        if not event.get("choices"):
            return [{"type": "usage_only", "usage": event.get("usage", {})}]
        choice = event["choices"][0]
        content = choice.get("delta", {}).get("content")
        if content is not None:
            return [{"type": "text_delta", "text": content}]
        if choice.get("finish_reason"):
            return [{"type": "completed"}]
    if name == "anthropic" and event_type == "content_block_delta":
        delta = event.get("delta", {})
        if delta.get("type") == "text_delta":
            return [{"type": "text_delta", "text": delta["text"]}]
    if name == "generate_content" and "candidates" in event:
        normalized = []
        for candidate in event.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "text" in part:
                    normalized.append({"type": "text_delta", "text": part["text"]})
                elif "functionCall" in part:
                    call = part["functionCall"]
                    normalized.append({"type": "tool_call_delta", "name": call["name"],
                                       "arguments": call["args"]})
                else:
                    normalized.append({"type": "provider_event", "raw": part})
            if candidate.get("finishReason"):
                normalized.append({"type": "completed"})
        return normalized or [{"type": "provider_event", "raw": event}]
    if name == "interactions" and event_type == "step.delta":
        delta = event.get("delta", {})
        if delta.get("type") == "text":
            return [{"type": "text_delta", "text": delta["text"]}]
    if event_type in {"response.completed", "message_stop", "interaction.completed"}:
        return [{"type": "completed", "status": event.get("interaction", {}).get("status")}]
    if name == "interactions" and event_type == "step.stop":
        return [{"type": "step_completed"}]
    if name == "interactions" and event_type == "interaction.created":
        return [{"type": "status", "status": event["interaction"]["status"]}]
    return [{"type": "provider_event", "raw": event}]


def normalize_event(name, event):
    return normalize_events(name, event)[0]


migrated = migrate_chat_to_responses(TASK)
canonical = {name: canonical_response(name, response)
             for name, response in FIXTURES.items()}
texts = {name: parse_text(name, response) for name, response in FIXTURES.items()}
usages = {name: value["usage"] for name, value in canonical.items()}
error_categories = {name: normalize_error(error)["category"] for name, error in ERRORS.items()}
stream_types = {
    name: [normalized["type"] for event in events for normalized in normalize_events(name, event)]
    for name, events in EVENTS.items()
}
interaction_events = [normalized for event in EVENTS["interactions"]
                      for normalized in normalize_events("interactions", event)]
unknown_blocks = {
    name: [block["provider_type"] for block in value["blocks"] if block["type"] == "provider_block"]
    for name, value in canonical.items()
}

# 负例一：五个入口都删除 Usage 时，调用方应在 schema 校验阶段拒绝，不能补空值。
missing_errors = {}
for name, response in FIXTURES.items():
    missing = copy.deepcopy(response)
    missing.pop("usageMetadata" if name == "generate_content" else "usage")
    try:
        parse_usage(name, missing)
    except (KeyError, ValueError) as error:
        missing_errors[name] = type(error).__name__
    else:
        raise AssertionError(f"expected usage validation failure: {name}")

# 负例二：未知流事件被保留为 provider_event，测试告警不能静默通过。
unknown_event = normalize_event("interactions", {"type": "vendor.new_event", "payload": {"debug": True}})

# 负例三：Chat 工具调用可以没有文本 content，不能把 null 当成文本。
chat_tool_only = copy.deepcopy(FIXTURES["chat"])
chat_tool_only["choices"][0]["message"]["content"] = None
chat_tool_only_result = canonical_response("chat", chat_tool_only)
chat_empty_text = copy.deepcopy(FIXTURES["chat"])
chat_empty_text["choices"][0]["message"]["content"] = ""
chat_empty_text_result = canonical_response("chat", chat_empty_text)
assert parse_text("chat", chat_empty_text) == [""]

# 兼容证据：旧的 outputs 命名仍在适配边界转换，不进入统一层。
legacy_interactions = {
    "id": "interaction_legacy_001",
    "status": "completed",
    "outputs": [
        {"type": "function_call", "name": "lookup_stock", "arguments": {"sku": "A-17"}},
        {"type": "text", "text": "库存为 12"},
    ],
    "usage": {"total_tokens": 22, "total_input_tokens": 18, "total_output_tokens": 4},
}
legacy_result = canonical_response("interactions", legacy_interactions)
shortcut_interaction = {
    "id": "interaction_shortcut_001",
    "status": "completed",
    "output_text": "库存为 12",
    "usage": {"total_tokens": 22, "total_input_tokens": 18, "total_output_tokens": 4},
}
shortcut_result = canonical_response("interactions", shortcut_interaction)

assert migrated["input"][0]["content"][0]["text"] == "查询 A-17 的库存"
assert migrated["tools"][0]["name"] == "lookup_stock"
assert all(value == ["库存为 12"] for value in texts.values())
assert [block["type"] for block in canonical["responses"]["blocks"]] == ["text", "provider_block", "tool_call", "provider_block"]
assert canonical["responses"]["blocks"][1]["raw"]["refusal"] == "fixture refusal detail"
assert [block["type"] for block in canonical["chat"]["blocks"]] == ["text", "tool_call"]
assert [block["type"] for block in canonical["anthropic"]["blocks"]] == ["text", "tool_call", "provider_block"]
assert [block["type"] for block in canonical["generate_content"]["blocks"]] == ["text", "tool_call", "provider_block", "provider_block"]
assert [block["type"] for block in canonical["interactions"]["blocks"]] == ["tool_call", "tool_result", "text", "provider_block"]
assert [block["type"] for block in chat_tool_only_result["blocks"]] == ["tool_call"]
assert parse_text("chat", chat_tool_only) == []
assert [block["type"] for block in chat_empty_text_result["blocks"]] == ["text", "tool_call"]
assert [block["type"] for block in legacy_result["blocks"]] == ["tool_call", "text"]
assert parse_text("interactions", legacy_interactions) == ["库存为 12"]
assert [block["type"] for block in shortcut_result["blocks"]] == ["text"]
assert parse_text("interactions", shortcut_interaction) == ["库存为 12"]
assert unknown_blocks == {
    "responses": ["refusal", "vendor_annotation"], "chat": [], "anthropic": ["vendor_content"],
    "generate_content": ["unknown_part", "candidate_without_content"], "interactions": ["vendor_step"],
}
assert canonical["responses"]["finish_reason"] == "completed"
assert canonical["chat"]["finish_reason"] == "tool_calls"
assert canonical["anthropic"]["finish_reason"] == "tool_use"
assert canonical["generate_content"]["candidate_finish_reasons"] == {"0": "STOP"}
assert canonical["generate_content"]["blocks"][0]["candidate_index"] == 0
assert canonical["generate_content"]["blocks"][-1]["candidate_index"] == 1
assert canonical["interactions"]["blocks"][0]["step_status"] == "done"
assert canonical["interactions"]["blocks"][1]["step_status"] == "done"
assert canonical["interactions"]["blocks"][2]["step_status"] == "done"
assert all(value["input_tokens"] == 18 and value["output_tokens"] == 4 for value in usages.values())
assert usages["chat"]["source"] == "usage.prompt_tokens/completion_tokens"
assert usages["generate_content"]["source"] == "usageMetadata"
assert usages["interactions"]["source"] == "usage.total_input_tokens/total_output_tokens"
assert error_categories == {
    "responses": "invalid_request", "chat": "rate_limit", "anthropic": "auth",
    "generate_content": "unavailable", "interactions": "timeout",
    "permission": "permission", "conflict": "conflict", "unknown": "unknown",
    "google_rpc": "permission",
}
assert stream_types == {
    "responses": ["text_delta", "completed"],
    "chat": ["text_delta", "completed", "usage_only", "stream_end"],
    "anthropic": ["text_delta", "completed"],
    "generate_content": ["text_delta", "tool_call_delta", "completed"],
    "interactions": ["status", "text_delta", "step_completed", "completed"],
}
assert interaction_events[0]["status"] == "in_progress"
assert interaction_events[-1]["status"] == "completed"
assert missing_errors == {name: "KeyError" for name in FIXTURES}
assert unknown_event["type"] == "provider_event"
print(json.dumps({
    "migrated": {"input": "input", "tool": migrated["tools"][0]["name"]},
    "block_types": {key: [block["type"] for block in value["blocks"]]
                    for key, value in canonical.items()},
    "finish_reasons": {key: value["finish_reason"] for key, value in canonical.items()},
    "texts": texts,
    "errors": error_categories,
    "stream_types": stream_types,
    "usage_sources": {key: value["source"] for key, value in usages.items()},
    "candidate_finish_reasons": canonical["generate_content"]["candidate_finish_reasons"],
    "unknown_blocks": unknown_blocks,
    "negative": {
        "missing_usage": missing_errors,
        "unknown_event": unknown_event["type"],
        "chat_null_content": chat_tool_only_result["blocks"],
        "legacy_outputs": [block["type"] for block in legacy_result["blocks"]],
    },
}, ensure_ascii=False, sort_keys=True))
```

### 观察输出

{% note success flat %}
预期输出应显示五个入口都得到同一段本地文本和可断言的文本/工具块，Chat Completions 已被迁移为 Responses 风格的 `input`，五类 Usage 字段都被标注来源，错误还覆盖权限、冲突、Google RPC 和未知类型；五种流式输入都能得到结束或状态证据，空 choices 的 Usage chunk 不会抛错，未知响应块保留为 `provider_block`，未知事件保留为 `provider_event`，五个入口缺少 Usage 都会被拒绝，`content: null` 不会伪装成文本，空文本仍被保留，旧 `outputs` 可在边界兼容。这些是 fixture 的转换证据，不是线上 Provider 的可用性证明。
{% endnote %}

```text
{"block_types": {"anthropic": ["text", "tool_call", "provider_block"], "chat": ["text", "tool_call"], "generate_content": ["text", "tool_call", "provider_block", "provider_block"], "interactions": ["tool_call", "tool_result", "text", "provider_block"], "responses": ["text", "provider_block", "tool_call", "provider_block"]}, "candidate_finish_reasons": {"0": "STOP"}, "errors": {"anthropic": "auth", "chat": "rate_limit", "conflict": "conflict", "generate_content": "unavailable", "google_rpc": "permission", "interactions": "timeout", "permission": "permission", "responses": "invalid_request", "unknown": "unknown"}, "finish_reasons": {"anthropic": "tool_use", "chat": "tool_calls", "generate_content": "STOP", "interactions": "completed", "responses": "completed"}, "migrated": {"input": "input", "tool": "lookup_stock"}, "negative": {"chat_null_content": [{"arguments": {"sku": "A-17"}, "id": "call_002", "name": "lookup_stock", "type": "tool_call"}], "legacy_outputs": ["tool_call", "text"], "missing_usage": {"anthropic": "KeyError", "chat": "KeyError", "generate_content": "KeyError", "interactions": "KeyError", "responses": "KeyError"}, "unknown_event": "provider_event"}, "stream_types": {"anthropic": ["text_delta", "completed"], "chat": ["text_delta", "completed", "usage_only", "stream_end"], "generate_content": ["text_delta", "tool_call_delta", "completed"], "interactions": ["status", "text_delta", "step_completed", "completed"], "responses": ["text_delta", "completed"]}, "texts": {"anthropic": ["库存为 12"], "chat": ["库存为 12"], "generate_content": ["库存为 12"], "interactions": ["库存为 12"], "responses": ["库存为 12"]}, "unknown_blocks": {"anthropic": ["vendor_content"], "chat": [], "generate_content": ["unknown_part", "candidate_without_content"], "interactions": ["vendor_step"], "responses": ["refusal", "vendor_annotation"]}, "usage_sources": {"anthropic": "usage.input_tokens/output_tokens", "chat": "usage.prompt_tokens/completion_tokens", "generate_content": "usageMetadata", "interactions": "usage.total_input_tokens/total_output_tokens", "responses": "usage.input_tokens/output_tokens"}}
```

{% folding yellow, 可选的 OpenAI Responses 在线请求 %}
下面的命令会访问外部服务并产生费用或额度消耗。只有在读者明确准备好专用测试 Key、数据和预算后才执行；本地文章验收不依赖它。认证头通过标准输入交给 curl 配置解析，不把 Key 写在命令参数中。

```bash
if [ -z "${OPENAI_API_KEY:-}" ]; then
  printf '%s\n' '请先在当前终端显式设置 OPENAI_API_KEY' >&2
  exit 1
fi
request_json='{"model":"replace-with-enabled-model","input":"Return one short test sentence."}'
printf 'header = "Authorization: Bearer %s"\nheader = "Content-Type: application/json"\n' "$OPENAI_API_KEY" |
  curl --config - --silent --show-error --fail-with-body --max-time 20 \
    --data "$request_json" https://api.openai.com/v1/responses
```

成功响应仍需按 `output` 项目解析；HTTP `2xx` 只证明请求层成功，不证明内容正确。网络、权限或账户不可用时保留本地 fixture 证据，不把失败改写成模型质量结论。
{% endfolding %}

## 迁移与兼容

### 旧接口字段映射

{% note primary flat %}
迁移要同时记录“旧字段如何落到新字段”和“没有等价物的字段如何处理”。从 Chat Completions 迁移到 Responses 时，`messages` 通常进入 `input`，但响应的 `choices[].message` 不等于 `output` 中的任意一项；工具、状态、流式事件和 usage 都要重新解析。Anthropic 与 Gemini 的入口不能套用这条映射表。
{% endnote %}

| 迁移对象 | 旧入口观察点 | 新入口观察点 | 验证动作 |
| --- | --- | --- | --- |
| 输入 | `messages` 的 role/content | `input` 中的消息/输入项目 | 对照角色、文本块顺序和多模态项目 |
| 文本 | `choices[].message.content` | `output` 中的消息/文本项目 | 断言文本位置，不取数组固定下标 |
| 工具 | `message.tool_calls` | output 项目中的 function/tool call | 校验名称、ID、参数和结束状态 |
| 结束 | choice `finish_reason` | response 状态或事件 | 保存旧值和新值，建立有限映射 |
| 统计 | `prompt_tokens`、`completion_tokens` | Provider 对应 usage 字段 | 标注字段来源，缺失直接拒绝 |

### 兼容层差异

{% note warning flat %}
兼容层的价值是降低调用入口成本，不是抹平所有语义。若请求需要某入口未验证的工具、结构化输出、流式事件或状态能力，应拒绝或走原生入口；不要把兼容层返回的文本当成“功能已经支持”。Provider 的错误、限流、存储和数据保留政策也不能由字段兼容推导出来。
{% endnote %}

- **同一任务的主入口**：先选定一个真实支持所需能力的入口，其他入口只作为对照或迁移候选。
- **兼容入口**：只启用已经有 fixture、版本记录和失败动作的字段集合。
- **原生入口**：需要独有能力时保留原始响应与官方字段，不强行塞入统一层；统一层应明确标注扩展或不支持。
- **迁移回滚**：同时保留旧解析器和新解析器的快照，在文本、工具、事件、错误和 Usage 都通过后再切换流量。

### 迁移后的验证

| 验收项 | 通过证据 | 失败信号 | 复测动作 |
| --- | --- | --- | --- |
| schema | 每个入口的请求/响应字段都有来源与 parser | 用字段改名代替结构迁移 | 重新读取官方 API Reference |
| 内容 | 文本块、工具块和未知块顺序一致 | 只比较最终字符串 | 加入文本+工具混合 fixture |
| 事件 | 增量、结束、错误事件都有状态 | 流式页面提前结束或悬挂 | 删除结束事件并确认测试失败 |
| 错误 | 400/401/403/408/409/429/5xx/未知进入不同策略 | 所有异常都重试 | 检查 retry、deadline 和降级入口 |
| 真实调用 | 专用 Key、模型、额度和数据范围明确 | 把本地 fixture 当线上证据 | 在显式许可后运行最小请求 |

## 结果验证

{% note success flat %}
本节通过的标准是：能为同一个任务选择主入口；能说出 Responses、Chat、Messages、generateContent 和 Interactions 的输入/输出定位点；能用本地 fixture 解析非流式、流式和错误；能说明兼容迁移会丢失什么，并在真实调用前留下可复验的 schema、版本和预算证据。
{% endnote %}

| 验收项 | 证据 | 失败复验 |
| --- | --- | --- |
| 入口选择 | 主入口、所需能力和不支持动作均有记录 | 把五个入口写成同一个 API |
| 字段对照 | 五类 fixture 都得到文本，迁移函数保留 input 和工具 | 固定取数组下标或只返回字符串 |
| 流式处理 | 增量后有 completed，未知事件保留并告警 | 删除结束事件或加入未知事件 |
| 错误边界 | 400、401、403、408、409、429、503、未知分类不同 | 所有状态进入同一重试分支 |
| 真实请求 | 仅在显式凭据和预算条件满足时执行 | 网络失败时不伪造线上结果 |

{% note info flat %}
本地 fixture 通过只证明本文 parser 的行为；厂商文档、模型、权限、区域、计费和数据保留会变化。将外部资料的当前快照和本地适配器版本一起记录，发现变化时重新验证，不用历史文章或兼容名称替代当前官方 schema。
{% endnote %}

## 常见问题

{% flashcard basic id:llm-responses-chat-choice deck:"大模型应用开发" priority:1 tags:"OpenAI、Anthropic与Gemini,接口选择" %}
--- question
Responses 和 Chat Completions 如何选择？
--- answer
先按任务所需能力选择并验证主入口：Responses 用 `input/output` 项目组织新能力，Chat Completions 用 `messages/choices` 组织兼容任务；不能只看字段相似就迁移。
--- explanation
选择步骤是：

1. 列出任务是否需要工具、流式事件、结构化输出、状态或已有 Chat 代码。
2. 为候选入口准备请求/响应 fixture，检查文本、工具、结束原因、Usage 和错误是否可映射。
3. 若 Responses 的输出项目或生命周期能直接承载任务，就以它为主入口；若现有兼容入口已满足已验证能力，可以暂时保留 Chat Completions。
4. 没有等价字段时保留原始数据、拒绝不支持请求或走原生入口，不能把缺失能力补成统一字符串。

最终判断依赖当前官方 schema、模型和账号能力，不由接口名称单独决定。
{% endflashcard %}

{% flashcard basic id:llm-anthropic-content-blocks deck:"大模型应用开发" priority:1 tags:"OpenAI、Anthropic与Gemini,内容结构" %}
--- question
Anthropic Messages 的内容块为什么不能按纯字符串处理？
--- answer
因为一个响应可以在有序 `content` 中同时包含文本、工具调用或其他块；纯字符串会丢失块类型、调用 ID、参数和结束原因。
--- explanation
解析时先遍历内容块并保留原顺序：`type=text` 提取文本，`type=tool_use` 提取名称、ID 和结构化输入，未知类型保留为原始块并触发测试告警。业务层可以另取文本索引，但不能用它替代完整响应。若把所有块直接连接成字符串，工具调用无法安全执行，流式结束和错误也可能被误判为普通回答。
{% endflashcard %}

## 参考资料

### 官方资料

{% linkgroup %}
{% link OpenAI Responses API, https://platform.openai.com/docs/api-reference/responses, https://platform.openai.com/favicon.ico %}
{% link OpenAI Chat Completions API Reference, https://platform.openai.com/docs/api-reference/chat, https://platform.openai.com/favicon.ico %}
{% link Anthropic Messages API, https://docs.anthropic.com/en/api/messages, https://docs.anthropic.com/favicon.ico %}
{% link Gemini generateContent API Reference, https://ai.google.dev/api/generate-content, https://ai.google.dev/favicon.ico %}
{% link Gemini Interactions API, https://ai.google.dev/gemini-api/docs/interactions-overview, https://ai.google.dev/favicon.ico %}
{% endlinkgroup %}

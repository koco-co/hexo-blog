---
title: 大模型应用开发(六)GLM与Qwen
tags:
  - 大模型应用开发
  - GLM与Qwen
categories:
  - Learn Topic
  - 大模型应用开发
description: 能分别核对 GLM、Qwen 的官方兼容入口、API 模型标识和能力字段，并识别地区、账户与版本造成的调用边界。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 6
published: false
abbrlink: be04898d
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节只解决一个问题：怎样在调用 GLM 与 Qwen 时，把服务产品、API 模型 ID、兼容入口和实际能力分开核对。示例使用 OpenAI-compatible wire 形状，但不把 SDK 方法名当成两家服务的完整保证。
{% endnote %}

<!-- concept-story:start -->
一个团队把“GLM Coding”填进了 `model`，把“Model Studio”当成了 Qwen 的模型名，又把另一个 Provider 的 `enable_thinking` 直接塞进所有请求。开发环境里请求并未立刻暴露问题：SDK 能序列化，服务也返回了一个普通文本。换到不同地区的账号后，模型 ID、基础 URL 和多模态能力同时失配，排查者却只有一条“调用失败”的日志。

真正需要交接的不是某个 SDK 初始化片段，而是一张可复验的能力表：产品入口对应哪个 API 模型 ID，账号和地区是否可用，字段是在标准请求中发送还是放在 Provider 扩展里，响应和流式结束是否能被完整解析。
<!-- concept-story:end -->

## 两家入口

### GLM入口

{% note info flat %}
Z.ai 的 GLM Chat Completion 使用 Chat Completions 风格的 `model`、`messages`、`stream`、`tools` 和 `response_format`。当前 API 文档列出 `glm-5.3`、`glm-5.2`、`glm-5.1`、`glm-5`、`glm-4.7` 等模型代码；模型清单会变化，文章中的名称只作为字段示例，真正请求前要以账号可见的模型列表和当前文档为准。
{% endnote %}

| 层次 | GLM 的可观察字段 | 选择时要确认 |
| --- | --- | --- |
| 服务 | Z.ai API / GLM 模型服务 | 服务入口、认证域名和账号权限 |
| 请求 | `model`、`messages`、`stream`、`thinking`、`tools` | `model` 必须是 API 模型代码，不是产品名称；思考字段按模型限制使用 |
| 工具 | `tools[].type=function`、函数名、JSON Schema、`tool_choice` | 函数名长度和参数 schema；模型是否支持工具流式 |
| 结构化 | `response_format.type` 为 `text` 或 `json_object` | 文本模型与视觉模型边界，JSON 是否真的可解析 |
| 响应 | `choices[].message`、`tool_calls`、`reasoning_content`、`finish_reason`、`usage` | 工具调用时 `content` 可能为空；参数仍需校验，不能直接执行 |
| 追踪 | `request_id`、`user_id` | `request_id` 要求唯一且长度合规，`user_id` 不放敏感信息 |

GLM 的 `thinking` 和 `reasoning_effort` 不是所有模型都通用：文档把思考能力和模型系列关联起来，`reasoning_effort` 只在相应思考模型上有意义。`do_sample: false` 时，温度和 `top_p` 等采样参数不再生效；因此适配器不能只把所有 SDK 参数无条件转发。

### Qwen入口

{% note info flat %}
Alibaba Cloud Model Studio 提供 OpenAI-compatible Chat Completions 入口。中国内地、国际区域等部署可能使用不同的 `base_url`；模型名称也由 Model Studio 的可用模型和账号权限决定。Qwen 文档把 `messages`、`stream`、`tools`、`response_format` 等标准字段与 `extra_body` 中的模型扩展字段区分开来。
{% endnote %}

| 层次 | Qwen 的可观察字段 | 选择时要确认 |
| --- | --- | --- |
| 服务 | Model Studio / DashScope 兼容入口 | 区域 endpoint、项目/账号、Key 权限和计费 |
| 请求 | `model`、`messages`、`stream`、`stream_options` | 区域基础 URL 与模型 ID 必须成对配置 |
| 思考 | `enable_thinking`、`reasoning_effort`、模型支持的 `preserve_thinking` | 直接 HTTP 可放在请求体；Python SDK 常通过 `extra_body` 传入扩展 |
| 工具 | `tools`、`tool_choice`、assistant `tool_calls`、tool message | 模型是否支持工具；工具结果的 `tool_call_id` 是否对应 |
| 结构化 | `response_format: {type: json_object}` | Prompt 要明确要求 JSON，且模型需支持结构化输出 |
| 多模态 | `messages[].content` 为内容数组，如 `text`、`image_url`、`video` | 多模态模型、媒体类型、像素/视频限制不能从文本模型推断 |
| 流式 | SSE Chat chunk、`stream_options.include_usage` | usage 通常在最后数据块，仍需等待结束证据 |

Qwen 的非标准字段不应混进 Provider-agnostic 的核心请求类型。比如 `enable_thinking`、`preserve_thinking`、`top_k` 和媒体像素控制属于能力或实现扩展；适配器应保留 `provider_options`，在明确模型支持后才展开到 wire 请求。

{% mermaid %}
flowchart LR
    A[产品或控制台名称] --> B[API model ID]
    B --> C[地区与账户门禁]
    C --> D[标准字段]
    C --> E[Provider 扩展字段]
    D --> F[响应与流式证据]
    E --> F
    F --> G[能力矩阵]
{% endmermaid %}

## 模型与能力

### 能力差异

同一个 `chat.completions.create` 外观，可能对应不同的能力集合。应先写“本次请求需要什么”，再把需求映射到 Provider 的字段和模型范围：

| 能力 | GLM | Qwen | 适配策略 |
| --- | --- | --- | --- |
| 文本对话 | `messages` + `choices` | `messages` + `choices` | 可共享基础 envelope，但保留 endpoint 和 model 校验 |
| 工具调用 | `tools`、`tool_calls`，部分模型支持工具流式 | `tools`、`tool_calls`，按模型确认 | 解析调用 ID、名称和 JSON 参数，执行前做 schema 校验 |
| JSON 输出 | `response_format.type=json_object` | `response_format.type=json_object` | 不只检查 HTTP 200，还要解析 JSON 并验证字段 |
| 思考 | `thinking`、`reasoning_effort`、`reasoning_content` 按模型变化 | `enable_thinking`、`reasoning_effort`、`reasoning_content` 按模型变化 | 不把 reasoning 字段当最终答案，不跨 Provider 复制默认值 |
| 多模态 | 文档列出文本、图像、音频、视频和文件输入能力 | 内容数组支持文本、图像、音频、视频等，但按模型限制 | 先探测模型与媒体类型，再发送内容数组 |
| 流式 | Event Stream，完成时有 `[DONE]` | SSE chunk，可选最后 usage 数据块和 `[DONE]` | 同时检查增量、usage、结束标记和未知事件 |

“支持”要拆成三个问题：客户端能否序列化、服务是否接受并执行、响应是否能被应用解释。比如 Qwen 的 `top_k` 不是标准 OpenAI 参数，Python SDK 需要放进 `extra_body`；如果把它放在统一参数层，可能导致另一个 Provider 误收或直接失败。

### 可用性边界

{% note warning flat %}
地区、账户、版本和模型是四个独立门禁。地区决定基础 URL 或可访问产品，账户决定 Key、项目、配额和模型授权，版本决定 SDK/字段是否存在，模型决定工具、思考、结构化和多模态能力。任何一个门禁没有证据，都只能把能力标为“未验证”，不能用另一个账号的成功结果补齐。
{% endnote %}

| 门禁 | 典型误判 | 应保存的证据 | 失败动作 |
| --- | --- | --- | --- |
| 地区 | 复制别人的基础 URL | endpoint、区域说明、实际响应域 | 切换已确认区域或停止请求，不盲目重试 |
| 账户 | 只检查环境变量存在 | Key 是否属于目标项目、权限和额度 | 脱敏记录 401/403，禁止把 Key 打进日志 |
| 版本 | SDK 参数表有字段就认为服务支持 | SDK 版本、Provider 文档和 wire 响应 | 固定兼容范围，扩展字段显式标记 |
| 模型 | 用产品名或控制台展示名填 `model` | 可用模型 ID、能力声明和成功请求 | 报告模型 ID 错误，不自动换模型掩盖配置错 |
| 能力 | 用文本 200 推断工具/视觉/JSON 可用 | 专用 capability probe 和响应字段 | 降级为已验证能力或返回“不支持” |

## 最小实践

### 准备输入

{% note primary flat %}
示例只构造本地 fixture，不安装 SDK、不访问 GLM/Qwen 网络、不读取环境变量，也不包含真实凭据。`model` 使用当前文档中的示例代码，`request_id`、`user_id`、响应 ID 和 trace 全部为合成值。真实请求必须由读者在确认地区、账号、费用和数据范围后显式启用。
{% endnote %}

### 执行步骤

```python
import copy
import json

TASK = "把 A-17 的库存整理成结果；若需查询，调用 lookup_stock"
MODEL_CATALOG = {
    "glm-5.3": {"provider": "glm", "product": "GLM", "region": "global", "tools": True, "json": True},
    "qwen3.7-plus": {"provider": "qwen", "product": "Qwen", "region": "configured", "tools": True, "json": True},
}

GLM_REQUEST = {
    "endpoint": "https://api.z.ai/api/paas/v4/chat/completions",
    "model": "glm-5.3",
    "messages": [{"role": "user", "content": TASK}],
    "thinking": {"type": "enabled", "clear_thinking": True},
    "tools": [{"type": "function", "function": {
        "name": "lookup_stock",
        "description": "查询 SKU 库存",
        "parameters": {
            "type": "object",
            "properties": {"sku": {"type": "string"}},
            "required": ["sku"],
        },
    }}],
    "tool_choice": "auto",
    "stream": True,
    "request_id": "glm_req_000001",
    "user_id": "demo_user_01",
}

QWEN_REQUEST = {
    "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "model": "qwen3.7-plus",
    "messages": [{"role": "user", "content": TASK + "，请只输出 JSON"}],
    "stream": True,
    "stream_options": {"include_usage": True},
    "response_format": {"type": "json_object"},
    # 直接 HTTP 时放在 body；Python SDK 可映射为 extra_body。
    "enable_thinking": True,
    "reasoning_effort": "high",
}

GLM_RESPONSE = {
    "id": "glm_resp_000001",
    "request_id": "glm_req_000001",
    "model": "glm-5.3",
    "choices": [{"index": 0, "message": {
        "role": "assistant",
        "content": None,
        "reasoning_content": "synthetic reasoning, not a model trace",
        "tool_calls": [{"id": "glm_call_001", "type": "function",
                        "function": {"name": "lookup_stock",
                                     "arguments": {"sku": "A-17"}}}],
    }, "finish_reason": "tool_calls"}],
    "usage": {"prompt_tokens": 20, "completion_tokens": 3, "total_tokens": 23},
}

QWEN_RESPONSE = {
    "id": "qwen_resp_000001",
    "object": "chat.completion",
    "model": "qwen3.7-plus",
    "choices": [{"index": 0, "message": {
        "role": "assistant",
        "content": "{\"sku\":\"A-17\",\"stock\":12}",
        "reasoning_content": "synthetic reasoning, not a model trace",
    }, "finish_reason": "stop"}],
    "usage": {"prompt_tokens": 22, "completion_tokens": 8, "total_tokens": 30},
}

GLM_STREAM = [
    {"id": "glm_stream_001", "choices": [{"delta": {"content": "查询中"}, "finish_reason": None}]},
    {"id": "glm_stream_001", "choices": [{"delta": {"tool_calls": [{"index": 0, "id": "glm_call_001"}]}, "finish_reason": None}]},
    {"id": "glm_stream_001", "choices": [{"delta": {}, "finish_reason": "tool_calls"}]},
    {"id": "glm_stream_001", "choices": [], "usage": {"prompt_tokens": 20, "completion_tokens": 3}},
    {"object": "vendor.glm.chunk", "trace": "fixture-only"},
    "[DONE]",
]

QWEN_STREAM = [
    {"id": "qwen_stream_001", "choices": [{"delta": {"content": "{\"sku\":\"A-17\""}, "finish_reason": None}]},
    {"id": "qwen_stream_001", "choices": [{"delta": {"content": ",\"stock\":12}"}, "finish_reason": None}]}, 
    {"id": "qwen_stream_001", "choices": [{"delta": {}, "finish_reason": "stop"}]},
    {"id": "qwen_stream_001", "choices": [], "usage": {"prompt_tokens": 22, "completion_tokens": 8}},
    {"object": "vendor.qwen.chunk", "trace": "fixture-only"},
    "[DONE]",
]

CAPABILITY_PROBES = {
    "glm": {
        "tool": {"model": "glm-5.3", "tools": True, "result": "tool_calls"},
        "json": {"model": "glm-5.3", "response_format": {"type": "json_object"}, "result": "json"},
        "multimodal": {"model": "glm-5.3", "content_types": ["text", "image", "audio", "video", "file"], "result": "model-scoped"},
    },
    "qwen": {
        "tool": {"model": "qwen3.7-plus", "tools": True, "result": "model-scoped"},
        "json": {"model": "qwen3.7-plus", "response_format": {"type": "json_object"}, "result": "json"},
        "multimodal": {"model": "qwen3.7-plus", "content_types": ["text", "image_url", "video"], "result": "model-scoped"},
    },
}

ERRORS = {
    "glm_missing_key": {"status": 401, "type": "authentication_error"},
    "qwen_invalid_model": {"status": 400, "type": "invalid_parameter_error"},
    "qwen_region": {"status": 403, "type": "permission_error"},
}


def require_model(provider, request):
    model = request.get("model")
    if model not in MODEL_CATALOG or MODEL_CATALOG[model]["provider"] != provider:
        raise ValueError(f"{provider}.model is not an API model ID")
    return model


def parse_glm(response):
    choice = response["choices"][0]
    message = choice["message"]
    calls = message.get("tool_calls", [])
    return {
        "provider": "glm",
        "model": response["model"],
        "text": message.get("content") or "",
        "tool_names": [call["function"]["name"] for call in calls],
        "tool_arguments_type": type(calls[0]["function"]["arguments"]).__name__ if calls else None,
        "finish_reason": choice["finish_reason"],
        "reasoning_present": "reasoning_content" in message,
        "usage_source": "usage.prompt_tokens/completion_tokens",
        "request_id": response["request_id"],
    }


def parse_qwen(response):
    choice = response["choices"][0]
    message = choice["message"]
    return {
        "provider": "qwen",
        "model": response["model"],
        "text": message.get("content") or "",
        "tool_names": [call["function"]["name"] for call in message.get("tool_calls", [])],
        "finish_reason": choice["finish_reason"],
        "reasoning_present": "reasoning_content" in message,
        "usage_source": "usage.prompt_tokens/completion_tokens",
        "json_valid": json.loads(message["content"])["stock"] == 12,
    }


def parse_glm_stream(events):
    text, finished, unknown, tool_ids = [], False, [], []
    for event in events:
        if event == "[DONE]":
            finished = True
        elif event.get("object") == "vendor.glm.chunk":
            unknown.append(event["object"])
        elif event.get("choices"):
            choice = event["choices"][0]
            delta = choice.get("delta", {})
            if delta.get("content") is not None:
                text.append(delta["content"])
            for call in delta.get("tool_calls", []):
                if call.get("id"):
                    tool_ids.append(call["id"])
            finished = finished or bool(choice.get("finish_reason"))
    return {"text": "".join(text), "finished": finished, "tool_ids": tool_ids, "unknown": unknown}


def parse_qwen_stream(events):
    text, finished, unknown = [], False, []
    for event in events:
        if event == "[DONE]":
            finished = True
        elif event.get("object") == "vendor.qwen.chunk":
            unknown.append(event["object"])
        elif event.get("choices"):
            choice = event["choices"][0]
            delta = choice.get("delta", {})
            if delta.get("content") is not None:
                text.append(delta["content"])
            finished = finished or bool(choice.get("finish_reason"))
    return {"text": "".join(text), "finished": finished, "unknown": unknown}


def classify_error(error):
    if error["status"] == 401:
        return "auth"
    if error["status"] == 403:
        return "permission"
    if error["status"] == 429:
        return "rate_limit"
    if 400 <= error["status"] < 500:
        return "invalid_request"
    return "unavailable"


def check_probe(provider, name, probe):
    catalog = MODEL_CATALOG[probe["model"]]
    if catalog["provider"] != provider:
        raise ValueError("probe model belongs to another provider")
    if name == "tool" and not catalog["tools"]:
        raise ValueError("tool capability is not declared")
    if name == "json" and not catalog["json"]:
        raise ValueError("json capability is not declared")
    return {"model": probe["model"], "result": probe["result"]}


require_model("glm", GLM_REQUEST)
require_model("qwen", QWEN_REQUEST)
parsed = {"glm": parse_glm(GLM_RESPONSE), "qwen": parse_qwen(QWEN_RESPONSE)}
streams = {"glm": parse_glm_stream(GLM_STREAM), "qwen": parse_qwen_stream(QWEN_STREAM)}
probes = {
    provider: {name: check_probe(provider, name, probe) for name, probe in items.items()}
    for provider, items in CAPABILITY_PROBES.items()
}
errors = {name: classify_error(error) for name, error in ERRORS.items()}

# 负例一：把服务或产品名称填到 model，而不是 API 模型 ID。
wrong_model = copy.deepcopy(GLM_REQUEST)
wrong_model["model"] = "GLM Coding"
try:
    require_model("glm", wrong_model)
except ValueError as error:
    wrong_model_error = type(error).__name__

# 负例二：把 Qwen 的扩展字段伪装成所有 Provider 都有的标准字段。
wrong_extension = {"model": "qwen3.7-plus", "enable_thinking": True, "provider": "glm"}
try:
    require_model("glm", wrong_extension)
except ValueError as error:
    wrong_extension_error = type(error).__name__

assert parsed["glm"]["tool_names"] == ["lookup_stock"]
assert parsed["glm"]["tool_arguments_type"] == "dict"
assert parsed["qwen"]["json_valid"] is True
assert all(item["reasoning_present"] for item in parsed.values())
assert all(item["finished"] for item in streams.values())
assert streams["glm"]["tool_ids"] == ["glm_call_001"]
assert streams["qwen"]["text"] == '{"sku":"A-17","stock":12}'
assert all(item["unknown"] for item in streams.values())
assert errors == {"glm_missing_key": "auth", "qwen_invalid_model": "invalid_request", "qwen_region": "permission"}
assert wrong_model_error == "ValueError"
assert wrong_extension_error == "ValueError"
assert probes["glm"]["multimodal"]["result"] == "model-scoped"
assert probes["qwen"]["multimodal"]["result"] == "model-scoped"

print(json.dumps({
    "parsed": parsed,
    "streams": streams,
    "probes": probes,
    "errors": errors,
    "negative": {"product_name_as_model": wrong_model_error, "cross_provider_extension": wrong_extension_error},
}, ensure_ascii=False, sort_keys=True))
```

### 观察输出

{% note success flat %}
预期结果会显示：GLM fixture 在 `choices[].message.tool_calls` 中得到函数名和字典参数，Qwen fixture 在 `content` 中得到可解析 JSON；两者都保留 `reasoning_content` 和标准 Usage，但请求扩展方式不同。流式结果分别观察到增量、完成标记、usage 数据块和未知扩展；模型产品名、跨 Provider 扩展、错误状态都会被单独拒绝或分类。多模态 probe 只返回 `model-scoped`，表示还需要按具体模型和账号复验，不能当成线上成功。
{% endnote %}

```text
{"errors": {"glm_missing_key": "auth", "qwen_invalid_model": "invalid_request", "qwen_region": "permission"}, "negative": {"cross_provider_extension": "ValueError", "product_name_as_model": "ValueError"}, "parsed": {"glm": {"finish_reason": "tool_calls", "model": "glm-5.3", "provider": "glm", "reasoning_present": true, "request_id": "glm_req_000001", "text": "", "tool_arguments_type": "dict", "tool_names": ["lookup_stock"], "usage_source": "usage.prompt_tokens/completion_tokens"}, "qwen": {"finish_reason": "stop", "json_valid": true, "model": "qwen3.7-plus", "provider": "qwen", "reasoning_present": true, "text": "{\"sku\":\"A-17\",\"stock\":12}", "tool_names": [], "usage_source": "usage.prompt_tokens/completion_tokens"}}, "probes": {"glm": {"json": {"model": "glm-5.3", "result": "json"}, "multimodal": {"model": "glm-5.3", "result": "model-scoped"}, "tool": {"model": "glm-5.3", "result": "tool_calls"}}, "qwen": {"json": {"model": "qwen3.7-plus", "result": "json"}, "multimodal": {"model": "qwen3.7-plus", "result": "model-scoped"}, "tool": {"model": "qwen3.7-plus", "result": "model-scoped"}}}, "streams": {"glm": {"finished": true, "text": "查询中", "tool_ids": ["glm_call_001"], "unknown": ["vendor.glm.chunk"]}, "qwen": {"finished": true, "text": "{\"sku\":\"A-17\",\"stock\":12}", "unknown": ["vendor.qwen.chunk"]}}}
```

## 兼容边界

### 可用性边界

{% note warning flat %}
OpenAI-compatible 只是请求外观的复用，不是 GLM/Qwen 的能力联合。统一层可以共享 `messages`、`stream` 和基础错误接口，但应把模型目录、地区 endpoint、账户权限、思考字段、工具流式和多模态内容类型作为 Provider-specific 配置。没有 capability probe 的能力必须标记为未验证。
{% endnote %}

| 兼容层可以共享 | 必须保留 Provider 分支 | 不能做的自动推断 |
| --- | --- | --- |
| JSON 序列化、Bearer 认证头、Chat envelope | GLM `thinking`/`reasoning_effort` 与 Qwen `enable_thinking`/`extra_body` | 把一个 Provider 的思考开关复制给另一个 |
| `messages`、`choices`、`stream` 的基础遍历 | GLM `request_id/user_id` 与 Qwen 区域/项目配置 | 用产品名、控制台名替代 `model` |
| `tools` 的高层意图 | 函数参数编码、工具流式能力、tool message 关联 | 收到工具调用就直接执行未校验 JSON |
| `response_format` 的高层意图 | 支持的模型、Prompt 要求、JSON 错误处理 | 看到字段被 SDK 接受就声称服务支持 |
| 429/5xx 的通用观测 | Provider 错误体、额度、区域和恢复策略 | 用另一个地区的成功结果掩盖 403/404 |

如果业务需要“同一个功能在两家之间切换”，应先定义最小交集，例如纯文本 Chat + 已验证 JSON；把工具、思考和多模态作为显式能力开关。适配器返回 `unsupported` 比悄悄删除字段更安全，因为调用方可以决定降级还是换模型。

## 结果验证

### 验收证据

| 验收项 | 通过证据 | 失败信号 | 复测动作 |
| --- | --- | --- | --- |
| GLM 模型 | `model` 为账号可用 API 模型代码，响应含 `request_id`、`choices`、`usage` | 使用“GLM Coding”等产品名，或只看 HTTP 200 | 用合成错误复验模型 ID 校验，再做已授权 probe |
| Qwen 模型 | 区域 `base_url`、模型 ID、`messages` 和响应 `choices` 对齐 | 复制其他区域 endpoint，模型被拒绝 | 逐区域记录 endpoint、账号和模型可用性 |
| 工具 | 调用 ID、函数名和参数类型可解析 | `content` 为空就被当成空答复，或参数未校验 | 用工具响应 fixture 和错误 JSON 复测 |
| 结构化 | `response_format` 请求与 JSON 解析同时通过 | HTTP 200 但正文不是 JSON | 强制加入 JSON 指令并验证 schema |
| 思考 | 请求开关、模型范围和 `reasoning_content` 被单独记录 | 把 reasoning 当最终回答或跨 Provider 复用 | 关闭/开启 probe，比较字段而非臆测质量 |
| 多模态 | 内容数组、媒体类型和模型声明相匹配 | 文本模型收到图片后静默降级 | 使用脱敏媒体和目标模型专用文档复验 |
| 流式 | 增量、finish reason、usage、`[DONE]` 和未知事件均可观察 | 只拼接文本，没有完成证据 | 删除结束事件或最后 usage 块后确认失败 |
| 安全与成本 | fixture 不出网，真实 Key 与数据范围未启用 | 把本地 fixture 当成额度、质量或线上可用性证明 | 获得明确许可后再做最小真实请求并脱敏记录 |

### 复测动作

1. 先从目标区域和账号得到可用模型 ID，再写入配置；不要从服务产品名拼接模型字符串。
2. 分别用标准字段、Provider 扩展字段、工具和 JSON probe 验证“发送、接受、返回”三层证据。
3. 记录 SDK 版本、API 文档版本、endpoint、模型 ID、错误状态和响应字段；模型列表变化时重新跑 capability matrix。
4. 在真实请求前确认 Key、预算、媒体数据、工具副作用和日志脱敏范围；本地 fixture 通过不代表线上可用。

## 常见问题

{% flashcard basic id:llm-glm-qwen-model-id deck:"大模型应用开发" priority:1 tags:"GLM与Qwen,模型选择" %}
--- question
为什么不能把“GLM Coding”或“Model Studio”直接填进 `model`？
--- answer
它们是产品或服务入口名称，不一定是 API 接受的模型 ID；`model` 必须从目标区域、账号和当前模型目录中核对。
--- explanation
模型选择至少经过四步：

1. **确认入口**：先确定调用的是 Z.ai GLM API 还是 Alibaba Cloud Model Studio 的兼容 endpoint。
2. **确认区域**：Qwen 的不同区域可能有不同 `base_url`；同一个字符串不能替代区域配置。
3. **确认模型 ID**：从当前账号可见的模型目录复制 API 模型代码，例如文档中的示例，而不是复制控制台产品标题。
4. **确认能力**：模型 ID 正确只说明路由可能正确，仍要单独探测工具、JSON、思考和多模态能力。

适配器可以在发送前做静态目录校验，在响应后记录实际 `model`；发现 400、403 或 404 时，应暴露配置边界，而不是自动换成一个“看起来能用”的模型。
{% endflashcard %}

{% flashcard basic id:llm-glm-qwen-compatibility-risk deck:"大模型应用开发" priority:1 tags:"GLM与Qwen,兼容边界" %}
--- question
GLM 和 Qwen 都兼容 OpenAI，为什么仍要做能力探测？
--- answer
兼容主要覆盖部分请求外观；模型、地区、账户、思考、工具、结构化输出和多模态支持仍可能不同，SDK 能发送字段也不代表服务会执行并返回等价结果。
--- explanation
将能力分成三层记录：

| 层 | 核查内容 |
| --- | --- |
| 请求层 | 字段能否按标准或 `extra_body` 正确序列化，endpoint 是否属于目标区域 |
| 服务层 | 当前模型和账号是否接受、执行该字段，是否受版本或区域限制 |
| 响应层 | `choices`、工具调用、reasoning、Usage、流式结束和错误能否完整解释 |

例如 Qwen 的 `enable_thinking` 在直接 HTTP 与 Python SDK 中的承载位置不同，GLM 的 `thinking` 又有自己的模型范围；多模态和工具流式则需要按模型单独确认。没有 probe 的功能应返回 `unsupported` 或 `unverified`，不要静默删除参数后继续宣称兼容。
{% endflashcard %}

## 参考资料

### 官方资料

{% linkgroup %}
{% link Z.ai GLM Chat Completion, https://docs.z.ai/api-reference/llm/chat-completion, https://docs.z.ai/favicon.ico %}
{% link Qwen OpenAI-compatible Chat Completions, https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions, https://www.alibabacloud.com/favicon.ico %}
{% endlinkgroup %}

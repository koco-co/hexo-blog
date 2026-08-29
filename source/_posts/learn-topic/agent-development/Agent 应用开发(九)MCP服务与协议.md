---
title: Agent 应用开发(九)MCP服务与协议
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 9
published: true
abbrlink: a1bb688f
date: 2026-07-20 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：理解 MCP 的生命周期、能力发现、结果、兼容、订阅和取消语义。 最终要留下：完成一个 T-017 链路，验证 discover、list、call、read、prompts、资源模板、订阅、错误和请求头。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 协议层次

{% note primary flat %}
MCP 链路要分生命周期、能力发现、工具/资源结果、错误、订阅和取消方向；协议兼容需用真实消息验证。 在“协议层次”这一环节负责定义：先固定discover，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| discover | capabilities、list | 能力声明 | 不能猜默认 |
| call | JSON-RPC、result/error | 请求 ID | 不能吞错误 |
| cancel | 客户端→请求 | 连接关闭与清理 | 不能反向误判 |
| 定义边界 | 协议层次 | Fake Streamable HTTP/SSE 服务验证 discover、list、call、read、prompt、资源模板、错误和取消。 | 服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[discover]
  F --> A[协议层次]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「discover」设为「capabilities、list」，同时固定「call」为「JSON-RPC、result/error」；记录输入、状态和结果，记录能力声明。
- 只改变「cancel」：正常值用「客户端→请求」，越界或故障按“不能反向误判”构造；观察请求 ID，不要改动其余输入。
- 用连接关闭与清理检查“协议层次”：Fake Streamable HTTP/SSE 服务验证 discover、list、call、read、prompt、资源模板、错误和取消；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 能力发现

{% note info flat %}
MCP 链路要分生命周期、能力发现、工具/资源结果、错误、订阅和取消方向；协议兼容需用真实消息验证。 在“能力发现”这一环节负责执行：先固定call，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：能力发现**
1. 入口：call=JSON-RPC、result/error，先记录请求 ID。
2. 转移：由cancel=客户端→请求进入能力发现，只允许声明的动作。
3. 出口：用能力声明检查discover，越界条件是“不能猜默认”。
{% endnote %}

- 执行正常路径：把「call」设为「JSON-RPC、result/error」，同时固定「cancel」为「客户端→请求」；记录输入、状态和结果，记录请求 ID。
- 只改变「discover」：正常值用「capabilities、list」，越界或故障按“不能猜默认”构造；观察连接关闭与清理，不要改动其余输入。
- 用能力声明检查“能力发现”：Fake Streamable HTTP/SSE 服务验证 discover、list、call、read、prompt、资源模板、错误和取消；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果与错误

{% note info flat %}
MCP 链路要分生命周期、能力发现、工具/资源结果、错误、订阅和取消方向；协议兼容需用真实消息验证。 在“结果与错误”这一环节负责故障：先固定cancel，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：客户端→请求 | cancel | 连接关闭与清理 | 不能反向误判 |
| 边界：capabilities、list | discover | 能力声明 | 不能猜默认 |
| 故障：JSON-RPC、result/error | call | 请求 ID | 不能吞错误 |

- 注入边界：把「cancel」设为「客户端→请求」，同时固定「discover」为「capabilities、list」；记录输入、状态和结果，记录连接关闭与清理。
- 只改变「call」：正常值用「JSON-RPC、result/error」，越界或故障按“不能吞错误”构造；观察能力声明，不要改动其余输入。
- 用请求 ID检查“结果与错误”：Fake Streamable HTTP/SSE 服务验证 discover、list、call、read、prompt、资源模板、错误和取消；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 兼容验证

{% note info flat %}
MCP 链路要分生命周期、能力发现、工具/资源结果、错误、订阅和取消方向；协议兼容需用真实消息验证。 在“兼容验证”这一环节负责复核：先固定discover，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（兼容验证）：输入为「capabilities、list」；状态观察为「请求 ID」；独立判定使用「连接关闭与清理」。记录Fake Streamable HTTP/SSE 服务验证 discover、list、call、read、prompt、资源模板、错误和取消，把“服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake Streamable HTTP/SSE 服务验证 discover、list、call、read、prompt、资源模板、错误和取消。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
messages=[{"id":"r1","op":"discover","accept":"application/json"},{"id":"r2","op":"list","accept":"application/json"},{"id":"r3","op":"call","accept":"text/event-stream"},{"id":"r4","op":"read","accept":"application/json"},{"id":"r5","op":"prompt","accept":"application/json"},{"id":"r6","op":"template","accept":"application/json"},{"id":"r7","op":"cancel","target":"r3","accept":"text/event-stream"},{"id":"r8","op":"unknown","accept":"application/json"}]
server={"requests":{},"terminal":None}
def dispatch(message):
    rid,op=message["id"],message["op"]
    if op=="call": server["requests"][rid]={"state":"streaming"}; return {"id":rid,"state":"streaming","error":None}
    if op=="cancel":
        target=message["target"]
        if target not in server["requests"]: return {"id":rid,"state":"error","error":"unknown_request"}
        server["requests"][target]["state"]="cancelled"
        server["terminal"]="cancelled"
        return {"id":rid,"state":"cancelled","error":None}
    if op not in {"discover","list","read","prompt","template"}: return {"id":rid,"state":"error","error":"unsupported_operation"}
    return {"id":rid,"state":"ok","error":None}
responses=[dispatch(m) for m in messages]
request_ids=[r["id"] for r in responses]
accept=[m["accept"] for m in messages]
errors=sum(r["error"] is not None for r in responses)
print({"request_ids":request_ids,"accept":accept,"terminal":server["terminal"],"cancelled_request":server["requests"]["r3"]["state"],"errors":errors})
assert len(set(request_ids))==8 and server["requests"]["r3"]["state"]=="cancelled" and server["terminal"]=="cancelled" and errors==1
# 预期观察：Fake Streamable HTTP/SSE 服务验证 discover、list、call、read、prompt、资源模板、错误和取消。
```

{% note success flat %}
失败边界：服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。 使用 Streamable HTTP/SSE Fake server，检查 Accept 头、请求 SSE 关闭取消、正常终流和 header。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c09-mcp-vs-function-calling deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“兼容验证”的课程边界中，MCP与function calling如何选择？
--- answer
先把MCP的控制变量设为discover，把function calling的对照变量设为call；在相同样本上分别记录连接关闭与清理，再按失败边界作出选择。
--- explanation
比较MCP与function calling时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。
{% endflashcard %}

{% flashcard basic id:c09-cancel-direction deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
当“取消方向”出现时，先检查哪个状态和边界？
--- answer
先把“取消方向”绑定到discover与call；正常、越界和 Unknown 各运行一次，断言连接关闭与清理。
--- explanation
在protocol夹具中，比较capabilities、list与JSON-RPC、result/error，保留连接关闭与清理；服务声明能力不等于实现正确；要记录 Accept、终流和取消后的服务端状态。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link LangGraph documentation, https://langchain-ai.github.io/langgraph/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% endlinkgroup %}

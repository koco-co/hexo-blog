---
title: FastAPI(十一)流式响应与实时通信
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 比较 StreamingResponse、JSON Lines、SSE 和 WebSocket，并处理断线、重连、背压及流生命周期。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 11
published: true
abbrlink: 6be6843f
date: 2026-08-26 00:00:00
---
{% course_series %}

{% note primary flat %}
实时接口的选择先看数据方向和恢复语义，再看 API 名称。本文从普通流和 JSON Lines 进入，比较 SSE 的单向事件与 WebSocket 的双向会话，并用事件 ID、Last-Event-ID、取消和背压实验验证断线后不会重复或静默丢失。
{% endnote %}

## 选型坐标

### 数据方向

| 需求 | 推荐接口 | 原因 |
| --- | --- | --- |
| 服务端单向推送 | SSE | 浏览器 `EventSource` 原生重连 |
| 双向低延迟会话 | WebSocket | 同一连接双向收发 |
| 大文件或二进制下载 | `StreamingResponse`/`FileResponse` | HTTP 缓存与下载语义清晰 |
| 逐条机器数据 | JSON Lines | 每行独立解析，客户端选择自由 |

### 分帧与恢复

{% note info flat %}
流协议必须定义帧边界、媒体类型、顺序和恢复游标。没有 ID 的字符串流只能“尽力显示”，无法判断断线后从哪里继续；先写协议字段，再写生成器。
{% endnote %}

## 普通流

### 流式生成

{% note info flat %}
`StreamingResponse` 接受同步或异步迭代器，按迭代结果逐块发送。生成器应在 `finally` 中关闭下游资源，并处理客户端断开；响应已经开始后不能再修改状态码。
{% endnote %}

```python
import asyncio
from collections.abc import AsyncIterator
from fastapi.responses import StreamingResponse


async def chunks() -> AsyncIterator[bytes]:
    try:
        for part in ("one", "two", "three"):
            yield (part + "\n").encode()
            await asyncio.sleep(0)
    finally:
        print("stream closed")


@app.get("/export")
async def export() -> StreamingResponse:
    return StreamingResponse(chunks(), media_type="text/plain")
```

### 文件响应

{% note warning flat %}
`FileResponse` 适合已经存在、权限明确的文件；路径必须来自受控目录，不能直接拼接用户输入。文件不存在、权限错误和客户端断开都要有可观察日志，不能把服务器文件系统当作公开下载目录。
{% endnote %}

```python
from pathlib import Path
from fastapi.responses import FileResponse

REPORT = Path("exports/report.csv")


@app.get("/report.csv", response_class=FileResponse)
async def report() -> FileResponse:
    return FileResponse(REPORT, media_type="text/csv", filename="report.csv")
```

## JSON Lines

### 逐行模型

{% note info flat %}
JSON Lines 用换行分隔多个独立 JSON 值，媒体类型通常是 `application/x-ndjson`。客户端可以在收到一行时立即解析，不必等待完整数组；每行仍要符合公开模型。
{% endnote %}

```python
import json
from collections.abc import AsyncIterator
from fastapi.responses import StreamingResponse


async def task_lines() -> AsyncIterator[str]:
    for item in ({"id": 1, "status": "queued"}, {"id": 1, "status": "done"}):
        yield json.dumps(item) + "\n"


@app.get("/tasks/stream")
async def task_stream() -> StreamingResponse:
    return StreamingResponse(task_lines(), media_type="application/x-ndjson")
```

### 类型验证

{% note warning flat %}
生成器产出的每行不会自动获得请求模型的校验。需要稳定契约时，先用 Pydantic 模型构造对象，再调用 `model_dump_json()`；发现一行非法时，要定义是终止流还是发送错误事件。
{% endnote %}

## SSE

### 事件字段

{% note info flat %}
SSE 事件由 `data`、`event`、`id` 和 `retry` 等字段组成，媒体类型为 `text/event-stream`。浏览器可用 `EventSource` 接收；`id` 是恢复游标，不是数据库主键的自动替代品。
{% endnote %}

```python
from collections.abc import AsyncIterable
from fastapi.sse import EventSourceResponse, ServerSentEvent


@app.get("/events", response_class=EventSourceResponse)
async def events() -> AsyncIterable[ServerSentEvent]:
    for revision in range(1, 4):
        yield ServerSentEvent(
            data={"revision": revision, "status": "running"},
            event="task",
            id=str(revision),
            retry=5000,
        )
```

### 断线续传

{% mermaid %}
sequenceDiagram
  participant C as Browser
  participant S as SSE endpoint
  participant Q as Event store
  C->>S: GET /events
  S->>Q: read from Last-Event-ID
  Q-->>S: id 4,5,6
  S-->>C: event stream
  C--xS: network disconnect
  C->>S: reconnect + Last-Event-ID: 6
  S->>Q: resume after 6
{% endmermaid %}

{% note info flat %}
服务端必须保留一段可重放事件或明确声明只能从当前状态开始。没有持久游标时，收到 `Last-Event-ID` 也不能凭空恢复历史；应返回可识别的重置事件或让客户端重新拉取快照。
{% endnote %}

## WebSocket

### 握手与收发

{% note info flat %}
WebSocket 先完成 HTTP 握手，再在同一连接上双向收发文本或二进制消息。认证、消息模型、心跳和关闭码要在应用协议中固定，不能把“连接建立”当成用户已经授权。
{% endnote %}

```python
from fastapi import WebSocket, WebSocketDisconnect


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            await websocket.send_json({"echo": message})
    except WebSocketDisconnect:
        print("websocket closed")
```

### 连接状态

{% mermaid %}
stateDiagram-v2
  [*] --> Connecting
  Connecting --> Open: accept
  Open --> Open: receive/send
  Open --> Closing: disconnect or policy
  Closing --> Closed: close code
  Closed --> [*]
{% endmermaid %}

{% note info flat %}
关闭代码、异常和客户端断开都要进入同一个清理分支；广播管理器应在连接关闭后移除连接，避免把消息发送给已经失效的 socket。
{% endnote %}

## 断线恢复

### 取消与清理

{% note warning flat %}
客户端离开页面时，生成器可能收到取消。把数据库 Session、订阅句柄和临时文件放进 `finally`，并记录最后一个成功发送的 ID；不要因为客户端断开就无限重试。
{% endnote %}

### 背压边界

| 现象 | 解释 | 处理 |
| --- | --- | --- |
| 发送队列不断增长 | 生产者快于消费者 | 限制队列、丢弃旧进度或降采样 |
| 代理缓冲整段响应 | 没有正确流式头或代理配置 | 检查 `Cache-Control` 与缓冲开关 |
| WebSocket 广播变慢 | 单个慢连接拖住广播 | 每连接独立队列和超时 |

## 常见问题

{% flashcard basic id:fastapi-0141-sse-vs-websocket deck:"FastAPI" priority:1 tags:"SSE,WebSocket" %}
--- question
SSE 与 WebSocket 应按哪些轴选择？
--- answer
单向服务端事件和浏览器原生重连优先 SSE；需要双向消息、低延迟交互或自定义帧协议时选择 WebSocket。
--- explanation
SSE 仍是 HTTP，事件包含 `id`、`event`、`data`，浏览器 `EventSource` 会按协议重连；它不适合客户端频繁向服务端发送消息。WebSocket 先握手再双向收发，但需要自己定义认证、心跳、关闭码、广播和恢复。两者都要处理取消、慢消费者和代理超时，连接类型不能代替业务状态设计。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-jsonl-vs-sse deck:"FastAPI" priority:2 tags:"JSONL,流式" %}
--- question
JSON Lines 和 SSE 的主要差异是什么？
--- answer
JSON Lines 是按换行分隔的通用数据流；SSE 规定事件字段和 `text/event-stream` 格式，并被浏览器 EventSource 原生支持。
--- explanation
如果客户端是任意脚本或数据管道，JSON Lines 的每行 JSON 更直接；如果要在浏览器接收带事件名、ID 和重连提示的单向消息，SSE 更合适。两者都不自动验证模型，也都需要定义断线后的游标和错误策略。选择前先固定媒体类型和客户端解析器。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-stream-disconnect deck:"FastAPI" priority:1 tags:"断线,清理" %}
--- question
流式响应断开时必须清理什么？
--- answer
清理生成器持有的数据库会话、订阅、文件和队列，并保存最后一个成功发送的游标。
--- explanation
客户端断开会让后续发送失败或触发取消；如果没有 `finally`，资源会一直占用，重连还可能重复发送。将游标写入事件 ID 或外部状态，重连用 `Last-Event-ID` 恢复；若没有可重放历史，就明确返回快照重置，而不是假装无损续传。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Streaming Responses, https://fastapi.tiangolo.com/advanced/custom-response/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Server-Sent Events, https://fastapi.tiangolo.com/tutorial/server-sent-events/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link WebSockets, https://fastapi.tiangolo.com/advanced/websockets/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

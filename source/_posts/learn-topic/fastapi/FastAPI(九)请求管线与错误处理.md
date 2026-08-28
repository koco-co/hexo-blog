---
title: FastAPI(九)请求管线与错误处理
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 掌握中间件执行顺序、请求上下文、异常传播、统一错误响应和响应头或 Cookie 控制。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 9
published: true
abbrlink: 52af630c
date: 2026-06-26 00:00:00
---
{% course_series %}

{% note primary flat %}
请求管线把一次调用变成“进入、处理、回程、观测”的完整生命周期。本文先用 ASGI 顺序图定位中间件、依赖和处理函数的位置，再统一错误、响应头、Cookie 与耗时日志；目标是让失败证据能关联到同一个 request ID，而不是散落在字符串日志里。
{% endnote %}

## 请求管线

### 进入顺序

{% mermaid %}
flowchart TD
  A[客户端请求] --> B[ASGI 服务器]
  B --> C[外层中间件]
  C --> D[路由匹配与依赖]
  D --> E[处理函数]
  E --> F[响应中间件回程]
  F --> G[客户端响应]
{% endmermaid %}

{% note info flat %}
外层中间件先进入、后回程；路由依赖位于路由执行阶段。理解顺序后，才能决定 request ID 应在哪里创建、异常应由谁转换，以及耗时应包含哪些层。
{% endnote %}

### 响应回程

{% note info flat %}
响应回程会反向经过中间件。请求上下文在 `finally` 中清理，响应头和日志应在确认状态码后写入；如果中间件只记录进入日志而没有回程日志，超时和异常就无法闭合。
{% endnote %}

## 中间件设计

### 函数式

{% note info flat %}
函数式 HTTP 中间件适合短小的请求 ID、计时和统一头处理。调用 `await call_next(request)` 得到下游响应后，再补充回程信息；不要在中间件里重复解析业务 body。
{% endnote %}

```python
import time
from uuid import uuid4
from fastapi import Request


@app.middleware("http")
async def observe(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid4()))
    started = time.perf_counter()
    try:
        response = await call_next(request)
    finally:
        elapsed_ms = (time.perf_counter() - started) * 1000
        print({"request_id": request_id, "path": request.url.path, "elapsed_ms": round(elapsed_ms, 2)})
    response.headers["X-Request-ID"] = request_id
    return response
```

### ASGI 类

{% note info flat %}
需要直接控制 `scope`、`receive`、`send` 或跨协议行为时才使用 ASGI 类中间件。它能观察 HTTP、WebSocket 等消息，但也更容易破坏流式响应；先用函数式中间件表达清楚，再证明类中间件的必要性。
{% endnote %}

```python
class ProtocolGuard:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_marker(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-pipeline", b"checked"))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_marker)


app.add_middleware(ProtocolGuard)
```

{% note info flat %}
类中间件必须把非 HTTP 的 scope 原样转发，否则 WebSocket 会被误拦截。用普通 HTTP、流式响应和 WebSocket 各请求一次，检查 `x-pipeline` 只出现在 HTTP 响应且消息顺序没有改变；这比只看到类被实例化更能证明 `send` 包装正确。
{% endnote %}

### 内置中间件

{% note warning flat %}
`CORSMiddleware`、`GZipMiddleware`、`TrustedHostMiddleware` 和 `HTTPSRedirectMiddleware` 有不同的信任与性能边界。中间件添加顺序会影响错误和响应头，修改后要用真实请求核对状态、头和代理行为，不能只看配置文件。
{% endnote %}

## 请求上下文

### Request

{% note info flat %}
`Request` 提供 method、URL、headers、cookies、client 和 body 读取入口。业务参数优先使用声明式依赖；直接读 Request 只在日志、协议适配或需要原始头的边界使用。
{% endnote %}

```python
from fastapi.responses import Response


@app.post("/raw")
async def raw_request(request: Request) -> Response:
    body = await request.body()
    content_type = request.headers.get("content-type", "application/octet-stream")
    return Response(content=body, media_type=content_type)
```

{% note warning flat %}
`await request.body()` 会消费并缓存原始请求体；只有在协议适配或签名校验等边界才直接读取。用 JSON、表单和空 Body 分别请求 `/raw`，记录媒体类型、字节数和状态码；若同时声明 Pydantic Body 参数，要确认读取顺序不会让下游失去数据。
{% endnote %}

### state

{% note info flat %}
`request.state` 适合在中间件和下游之间传递短生命周期上下文，例如 request ID、认证后的主体或计时起点。它不是跨请求缓存，也不应保存密码、完整 token 或大型 body。
{% endnote %}

### 连接信息

{% note warning flat %}
`request.client`、scheme 和 `root_path` 可能来自代理头或服务器配置，不能无条件当作真实客户端信息。先配置可信代理范围，再记录去标识化的连接信息，并用直连和代理两种场景比较结果。
{% endnote %}

## 异常映射

### HTTPException

{% note info flat %}
`HTTPException` 表达已知的 HTTP 错误并立即中断当前处理；`detail` 应保持可读且不泄露内部堆栈。服务层可以抛出领域异常，统一处理器再转换为 Problem 格式。
{% endnote %}

### 验证异常

{% note warning flat %}
请求校验失败和响应校验失败属于不同责任面。记录 `RequestValidationError` 的来源位置，但不要把原始请求秘密写入日志；响应模型错误通常是服务端契约缺陷，应告警而不是伪装成客户端 422。
{% endnote %}

### 自定义处理器

{% mermaid %}
flowchart TD
  A[异常] --> B{异常类型}
  B -->|HTTPException| C[保留状态与 headers]
  B -->|RequestValidationError| D[转换 errors loc]
  B -->|领域异常| E[映射 Problem]
  C --> F[统一 response]
  D --> F
  E --> F
{% endmermaid %}

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = [{"loc": list(error["loc"]), "msg": error["msg"]} for error in exc.errors()]
    return JSONResponse(
        status_code=422,
        media_type="application/problem+json",
        content={"type": "validation", "title": "Invalid request", "status": 422, "detail": "Request validation failed", "errors": errors},
    )
```

```python
class DomainError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    return JSONResponse(
        status_code=409,
        media_type="application/problem+json",
        content={"type": exc.code, "title": exc.message, "status": 409},
    )
```

{% note info flat %}
让服务层抛出 `DomainError("task_conflict", "revision mismatch")`，再请求一个冲突版本，预期得到 409 和稳定的 Problem 字段；未知异常仍应交给全局日志与 500 处理，不要把堆栈直接写入客户端。
{% endnote %}

## 响应控制

### Response

{% note info flat %}
直接返回 `Response` 可以控制媒体类型、缓存或流式行为，但会绕开部分自动模型推断。正常 JSON 优先返回 Python 对象，让 `response_model` 保持契约；只有确有协议需求时才指定响应类。
{% endnote %}

### Header

{% note info flat %}
响应头应由服务端统一设置并可在原始响应中观察，例如 `X-Request-ID`、缓存策略和 `Location`。不要把头信息只放进 JSON 字段，让客户端同时维护两套来源。
{% endnote %}

### Cookie

{% note warning flat %}
设置 Cookie 时同时考虑 `secure`、`httponly`、`samesite`、`max_age` 和 `domain`。测试应检查原始 `Set-Cookie` 属性，而不是只看客户端 Cookie jar 中是否有值。
{% endnote %}

### 状态码

| 情况 | 状态码 | 额外证据 |
| --- | --- | --- |
| 成功读取 | 200 | JSON 与响应模型 |
| 创建 | 201 | `Location` 或资源标识 |
| 删除无正文 | 204 | body 为空 |
| 输入错误 | 422 | Problem.errors.loc |
| 未找到 | 404 | 稳定错误类型 |

```python
from fastapi import Response


@app.post("/session", status_code=201)
async def create_session(response: Response) -> dict[str, str]:
    response.headers["Location"] = "/session/demo"
    response.set_cookie(
        "session_hint",
        "test-only",
        secure=True,
        httponly=True,
        samesite="lax",
    )
    return {"id": "demo"}
```

{% note success flat %}
用 `curl -i -X POST /session` 检查状态为 201，同时存在 `Location` 与带 `Secure`、`HttpOnly`、`SameSite` 属性的 `Set-Cookie`。响应头和 Cookie 是协议证据，不能只检查 JSON 中是否出现同名字段。
{% endnote %}

## 观测与恢复

### 日志关联

{% note success flat %}
一条请求至少关联 request ID、方法、规范化路径、状态码和耗时；用户 ID 只在已经认证且符合隐私策略时记录。结构化日志让同一请求的错误、SQL 和响应可以被检索，而不是依赖模糊的全文搜索。
{% endnote %}

### 耗时

{% timeline 一次请求的证据, cyan %}
<!-- timeline 开始 -->
记录进入时间与 request ID。
<!-- endtimeline -->
<!-- timeline 下游 -->
把等待依赖、处理函数和响应生成包含在计时窗口中。
<!-- endtimeline -->
<!-- timeline 回程 -->
记录状态码、响应大小和总耗时；异常也要闭合。
<!-- endtimeline -->
{% endtimeline %}

### 失败证据

{% note warning flat %}
恢复动作必须针对证据：导入失败回到启动日志，422 回到 `loc`，502/504 回到代理与上游耗时，资源耗尽回到池和线程指标。不要用重试掩盖确定性的校验或权限错误，也不要在日志中打印原始 Authorization 头。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-middleware-order deck:"FastAPI" priority:1 tags:"中间件,顺序" %}
--- question
中间件顺序为什么会改变结果？
--- answer
中间件按栈进入、反向回程；外层中间件可以包住内层的异常、耗时和响应头处理。
--- explanation
先添加的中间件通常处在更外层，因此它的进入逻辑更早、回程逻辑更晚。CORS、压缩、Host 校验和自定义异常/计时组合时，顺序会决定错误是否带 CORS 头、耗时是否包含下游以及响应是否被压缩。修改顺序后至少用成功、校验失败和异常三种原始响应比较状态与头。
{% endflashcard %}

{% flashcard_ref id="fastapi-0141-di-vs-middleware" %}

{% flashcard basic id:fastapi-0141-http-exception-handler deck:"FastAPI" priority:1 tags:"异常,Problem" %}
--- question
什么时候应该自定义 `HTTPException` 或验证异常处理器？
--- answer
当多个端点需要统一的状态码、媒体类型和错误字段时，使用处理器集中映射；单个局部业务错误仍可直接抛出 `HTTPException`。
--- explanation
处理器把异常转换成稳定的 Problem 契约，客户端只需解析一种错误形状。验证错误要保留 `loc`，HTTPException 要保留状态码和必要的 headers；不要把响应模型错误吞成 422，也不要在错误正文里暴露堆栈和秘密。处理器本身应有正向和负向响应测试。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Middleware, https://fastapi.tiangolo.com/tutorial/middleware/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Handling Errors, https://fastapi.tiangolo.com/tutorial/handling-errors/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Request Reference, https://fastapi.tiangolo.com/reference/request/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

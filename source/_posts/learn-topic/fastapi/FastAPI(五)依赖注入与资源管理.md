---
title: FastAPI(五)依赖注入与资源管理
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 理解 Depends 依赖图、缓存与作用范围，并用 yield 可靠管理会话、认证和临时资源。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 5
published: true
abbrlink: 6ddff2f0
date: 2026-06-22 00:00:00
---
{% course_series %}

{% note primary flat %}
依赖注入把“请求处理函数需要什么”变成一张可执行的依赖图：FastAPI 负责解析参数、复用结果和按作用域清理资源。本文从函数依赖和类依赖开始，走到 `yield` 资源、Security 作用域以及测试覆盖，重点观察同一请求中依赖到底执行几次、何时释放。
{% endnote %}

## 依赖图

### 函数依赖

{% note info flat %}
依赖函数可以接收自己的参数，也可以继续声明子依赖。处理函数只描述需要的值，认证、配置和数据库会话等横切逻辑由图上的节点提供。
{% endnote %}

```python
from typing import Annotated
from fastapi import Depends, FastAPI

app = FastAPI()


def request_id() -> str:
    return "req-demo"


RequestId = Annotated[str, Depends(request_id)]


@app.get("/trace")
async def trace(request_id: RequestId) -> dict[str, str]:
    return {"request_id": request_id}
```

### 类依赖

{% note info flat %}
类依赖按构造器参数解析，适合把一组相关查询参数或策略封装成对象。类只是依赖提供者，不会自动变成全局单例；生命周期仍由请求缓存或显式资源依赖决定。
{% endnote %}

```python
class ItemFilters:
    def __init__(self, status: str | None = None, limit: int = 20) -> None:
        self.status = status
        self.limit = min(limit, 100)


@app.get("/items")
async def list_items(filters: Annotated[ItemFilters, Depends()]) -> dict[str, object]:
    return {"status": filters.status, "limit": filters.limit}
```

### 子依赖

{% mermaid %}
flowchart TD
  A[处理函数] --> B[get_current_user]
  B --> C[read_token]
  B --> D[load_account]
  A --> E[get_settings]
  C --> F[请求缓存]
  D --> F
{% endmermaid %}

{% note info flat %}
先画图再决定函数边界：token 解析是纯计算，账户读取是资源访问，配置读取是应用级数据。把它们拆开后，测试可以只覆盖需要的节点，故障也能定位到具体依赖。
{% endnote %}

## 声明方式

### Annotated

{% note success flat %}
优先使用 `Annotated[T, Depends(...)]`，因为真实类型仍然位于签名最前面，编辑器、静态检查和阅读者都能看见。别名类型还能避免多个路由重复书写复杂依赖。
{% endnote %}

```python
Settings = Annotated[dict[str, str], Depends(lambda: {"env": "test"})]


@app.get("/settings")
async def read_settings(settings: Settings) -> dict[str, str]:
    return settings
```

### 装饰器依赖

{% note info flat %}
当依赖只负责检查而不需要把返回值传给处理函数时，可以放在装饰器的 `dependencies` 中。它仍会执行并校验，但返回值不会出现在函数参数里；需要业务数据时应使用参数依赖。
{% endnote %}

```python
from fastapi import Header, HTTPException


def require_token(x_token: Annotated[str | None, Header()] = None) -> None:
    if x_token != "demo-token":
        raise HTTPException(status_code=401, detail="invalid token")


@app.get("/protected", dependencies=[Depends(require_token)])
async def protected_endpoint() -> dict[str, bool]:
    return {"ok": True}
```

{% note info flat %}
对 `/protected` 分别发送缺少头、错误头和 `X-Token: demo-token`，应得到 401、401、200；处理函数的返回值不包含 token。这个装饰器级依赖适合门禁，若下游还要读取当前用户，就应改成参数依赖并返回用户对象。
{% endnote %}

### 全局依赖

{% note warning flat %}
`FastAPI(dependencies=[...])` 或 `APIRouter(dependencies=[...])` 适合统一的入口检查，不适合隐式注入业务对象。全局依赖让每条路由都承担同一成本，新增公共路由时要重新确认它是否应该被保护。
{% endnote %}

```python
from fastapi import APIRouter

private_router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(require_token)],
)


@private_router.get("/stats")
async def stats() -> dict[str, int]:
    return {"active": 1}


app.include_router(private_router)
```

{% note info flat %}
把一组路由挂到 `private_router` 后，请求 `/admin/stats` 的认证行为应与 `/protected` 一致；而未加入该 router 的公开路由不应意外继承门禁。用两条请求对照验证作用范围，能防止全局依赖覆盖过宽。
{% endnote %}

## 作用范围

### 请求缓存

{% note info flat %}
同一请求中，相同依赖默认只执行一次，结果会在依赖图中复用。这让认证用户和数据库会话可以被多个节点共享，同时避免重复查询；缓存只在一次请求内有效，不是跨请求的全局缓存。
{% endnote %}

### use_cache

```python
def audit_context() -> dict[str, str]:
    return {"source": "dependency"}


@app.get("/audit")
async def audit(
    first: Annotated[dict[str, str], Depends(audit_context)],
    second: Annotated[dict[str, str], Depends(audit_context, use_cache=False)],
) -> dict[str, object]:
    return {"same": first is second, "first": first, "second": second}
```

{% note info flat %}
如果业务确实需要重新读取，就显式使用 `use_cache=False`，并在测试里记录调用次数；不要用它解决本该由资源作用域解决的共享问题。
{% endnote %}

### Security

{% note info flat %}
`Security` 与 `Depends` 的调用方式相似，但可以把 OAuth2 scope 暴露给 OpenAPI，并让下游依赖读取 scopes。权限判断仍然要在依赖中完成，不能只依赖文档里出现了 scope 名称。
{% endnote %}

## 资源清理

### yield 依赖

<!-- concept-story:start -->

剧院的灯房只在演出开始前把总钥匙交给舞台管事。管事拿到钥匙后才能点灯、借道具和开侧门；无论节目顺利落幕，还是演员中途跌倒，闭幕后都要把道具归位、熄灯、锁门。最危险的不是台上出错，而是有人只为掌声准备收尾，事故一来便把钥匙留在门上。

后来灯房把规矩写成一张两段式的交接单：上半段写“开门并交出资源”，下半段写“无论结局如何都回收资源”。观众离场前，灯房不能太早锁门；演出结束后，也不能因为忘了收钥匙让下一场误用昨天的布景。

于是大家不再把钥匙当作一次函数调用的赠品，而把它当作一段有进入、使用和退出边界的借用关系。

<!-- concept-story:end -->

{% mermaid %}
sequenceDiagram
  participant C as Client
  participant D as Dependency
  participant H as Handler
  C->>D: enter
  D-->>H: yield resource
  H-->>C: response or error
  D->>D: finally cleanup
{% endmermaid %}

{% note info flat %}
交接单的上半段、钥匙和下半段分别对应 `yield` 前的准备、交给处理函数的资源与 `yield` 后的清理。退出路径统一经过清理代码；数据库会话、临时文件和锁都应放进 `try/finally`，不要只在成功分支关闭。流式响应还会改变“观众何时离场”，因此清理作用域必须与响应消费时机匹配。
{% endnote %}

```python
from collections.abc import Generator


def opened_resource() -> Generator[str, None, None]:
    print("open")
    try:
        yield "resource"
    finally:
        print("close")


ResourceDep = Annotated[str, Depends(opened_resource)]


@app.get("/resource")
async def read_resource(resource: ResourceDep) -> dict[str, str]:
    return {"value": resource}
```

{% note success flat %}
用 `TestClient` 请求 `/resource` 并捕获标准输出，应先看到 `open`、再看到 `close`；让处理函数抛出 `HTTPException` 后仍应看到 `close`。如果清理日志缺失，优先检查 `yield` 是否被放在 `try/finally` 外，或测试是否绕过了应用生命周期。
{% endnote %}

### scope

{% note info flat %}
依赖资源的清理时机要和响应需求匹配。默认请求作用域会在响应流程结束时清理；需要在函数返回前释放的资源可以选择更窄的函数作用域。使用 scope 前先确认子依赖和响应生成是否仍需要该资源。
{% endnote %}

```python
from fastapi.responses import StreamingResponse


RequestResource = Annotated[str, Depends(opened_resource, scope="request")]


@app.get("/resource-stream")
async def resource_stream(resource: RequestResource) -> StreamingResponse:
    async def body():
        yield resource

    return StreamingResponse(body(), media_type="text/plain")
```

{% note info flat %}
流式响应需要在迭代器消费完后仍能访问资源，因此示例选择 `scope="request"`；若改成 `scope="function"`，资源可能在响应迭代前已关闭。分别请求普通响应和流式响应，并在生成器开始/结束处记录日志，才能确认清理时机而不是只确认状态码。
{% endnote %}

### 异常传播

{% note warning flat %}
处理函数抛出异常时，`yield` 依赖的清理段仍应运行；清理段再次抛错会覆盖原始错误，排障时要记录上下文并保持释放动作幂等。不要在清理里吞掉取消或数据库回滚异常。
{% endnote %}

## 测试替换

### 依赖覆盖

{% note info flat %}
`app.dependency_overrides` 是从原依赖函数映射到替代函数的字典。它适合把真实身份、网络或数据库换成确定的测试夹具，覆盖只影响当前应用对象的依赖解析。
{% endnote %}

```python
from fastapi.testclient import TestClient


def current_user() -> dict[str, str]:
    return {"id": "real"}


@app.get("/me")
async def me(user: Annotated[dict[str, str], Depends(current_user)]) -> dict[str, str]:
    return user


def test_me_with_override() -> None:
    app.dependency_overrides[current_user] = lambda: {"id": "test"}
    try:
        with TestClient(app) as client:
            assert client.get("/me").json() == {"id": "test"}
    finally:
        app.dependency_overrides.clear()
```

### 恢复覆盖

{% note danger flat %}
覆盖是可变的全局应用状态；不清理会让后续测试继续使用假身份。每个测试都要在 `finally` 或 fixture teardown 中恢复，必要时断言覆盖字典为空，避免顺序依赖。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-dependency-cache deck:"FastAPI" priority:1 tags:"依赖注入,缓存" %}
--- question
FastAPI 依赖为什么默认会缓存？
--- answer
同一请求中的相同依赖默认只执行一次并复用结果，避免重复计算或重复获取资源。
--- explanation
缓存键属于一次请求的依赖解析，不是进程级单例。认证用户、配置和数据库会话通常需要共享，因此默认缓存能减少重复工作；如果某个依赖必须重新读取，显式使用 `use_cache=False`，并验证两次调用的副作用和资源释放。跨请求共享状态应交给明确的缓存或应用资源，而不是依赖缓存。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-yield-order deck:"FastAPI" priority:1 tags:"资源管理,清理" %}
--- question
`yield` 依赖的准备和清理顺序如何保证？
--- answer
进入依赖时执行 `yield` 前代码，处理函数使用资源，响应或异常离开后执行 `yield` 后的清理代码。
--- explanation
把资源放在 `try/finally` 中可以让成功、业务异常和客户端取消都走同一释放路径。嵌套依赖按依赖图进入，退出时反向清理；清理代码若再次抛错可能覆盖原始错误，所以关闭动作要幂等、可记录并尽量保留原始异常上下文。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-di-vs-middleware deck:"FastAPI" priority:1 tags:"架构,依赖注入" %}
--- question
依赖注入和中间件分别适合承载什么逻辑？
--- answer
依赖注入面向路由所需的类型化资源和权限，中间件面向每个请求/响应都要经过的协议级横切逻辑。
--- explanation
用户身份、数据库会话和参数策略通常需要被处理函数直接使用，放进依赖图更容易测试和表达 OpenAPI 关系；请求 ID、耗时、CORS 等必须观察整个请求生命周期，放进中间件更合适。把所有逻辑塞进中间件会失去参数级依赖关系，把每个请求都包成依赖又可能无法看到响应回程。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Dependencies, https://fastapi.tiangolo.com/tutorial/dependencies/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Dependencies with yield, https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Testing Dependencies, https://fastapi.tiangolo.com/advanced/testing-dependencies/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

---
title: FastAPI(十四)进阶路线
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 汇总主线外的 OpenAPI 扩展、自定义路由、兼容集成、客户端生成、前端托管和迁移能力。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 14
published: true
abbrlink: f8ac9084
date: 2026-08-26 00:00:00
---
{% course_series %}

{% note primary flat %}
进阶能力不应该把主线重新讲一遍，而应该在需求出现时提供准确的选择。本文用“第三方回调与客户端生成”作为贯穿场景，比较 callbacks/webhooks、自定义 APIRoute、WSGI/GraphQL 挂载和前端桥接，再给出 Pydantic v1 到 v2 的迁移实验与回主线索引。
{% endnote %}

## 进入条件

### 需求筛选

{% note info flat %}
完成主线的类型契约、依赖、生命周期、测试和部署后，遇到以下需求再进入进阶：需要在 OpenAPI 中描述出站回调或入站 webhook，需要协议级横切逻辑，需要兼容 WSGI/GraphQL，或要从冻结 Schema 生成 SDK。没有这些需求时，保持主线实现更容易维护。
{% endnote %}

| 需求信号 | 进入专项 | 不要做的事 |
| --- | --- | --- |
| 合作方回调 | callbacks | 把回调当成内部路由调用 |
| 服务接收事件 | webhooks | 只在文档里写一段说明 |
| 统一协议检查 | 自定义 APIRoute/Request | 在每个路由复制校验 |
| 旧框架共存 | WSGI 或 GraphQL Mount | 让子应用共享隐式全局状态 |
| 客户端协作 | OpenAPI SDK 生成 | 手写与 Schema 漂移的客户端 |

## OpenAPI 扩展

### 回调

{% mermaid %}
flowchart TD
  A[本服务创建订阅] --> B[OpenAPI callback]
  B --> C[客户端提供回调 URL]
  C --> D[本服务向对方发请求]
  D --> E[对方按契约处理]
{% endmermaid %}

{% note info flat %}
callback 描述的是“本服务发出的请求将回到哪个 URL”，它是出站契约，不会自动发送网络请求。URL 表达式、请求体和响应要与真正的发送代码保持一致，Schema 变化必须触发契约回归。
{% endnote %}

### Webhook

{% note info flat %}
webhook 描述“本服务接收外部事件”的路径和模型，方向与 callback 相反。接收端仍要验证签名、幂等键和重放窗口，OpenAPI 只帮助对方理解协议，不提供安全验证。
{% endnote %}

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Event(BaseModel):
    event_id: str
    kind: str


@app.webhooks.post("task-finished")
def task_finished(event: Event) -> None:
    # 只声明外部事件契约；真正的验签和入库仍由接收逻辑完成。
    return None
```

### 自定义文档

{% note warning flat %}
覆盖 `app.openapi` 时必须缓存生成结果，并保留原始 paths、components、security 和版本字段。每次请求都重建 Schema 会浪费 CPU，直接替换整个字典则容易丢掉自动生成的模型。
{% endnote %}

```python
from fastapi.openapi.utils import get_openapi


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title="Learning API", version="1.0.0", routes=app.routes)
    schema["info"]["x-owner"] = "platform"
    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi
```

## 自定义路由

### APIRoute

{% note info flat %}
自定义 `APIRoute` 适合统一记录耗时、读取原始 body 或包裹异常，但只应承担协议横切行为。业务身份和资源权限仍由依赖提供，否则 route class 会变成无法拆分的超级中间件。
{% endnote %}

```python
from fastapi import APIRouter
import time
from fastapi.routing import APIRoute


class TimedRoute(APIRoute):
    def get_route_handler(self):
        original = super().get_route_handler()

        async def handler(request):
            started = time.perf_counter()
            response = await original(request)
            response.headers["X-Route-Class"] = "timed"
            response.headers["X-Route-Ms"] = f"{(time.perf_counter() - started) * 1000:.2f}"
            return response

        return handler


router = APIRouter(route_class=TimedRoute)
```

### Request

{% note info flat %}
`Request` 可以读取 method、headers、client、scheme 和 `root_path`，但不要在自定义路由和依赖中重复消费 body。横切逻辑读取元数据后，应把业务主体交回正常的 Pydantic 解析和依赖图。
{% endnote %}

### 内容类型校验

{% note warning flat %}
需要严格媒体类型时，在读取 body 前检查 `Content-Type`，不匹配就返回 415。不要先读取一次 body 再让下游重新解析，除非确认请求缓存语义和内存成本。
{% endnote %}

```python
from fastapi import Depends, HTTPException, Request
from fastapi.responses import JSONResponse


async def require_json(request: Request) -> None:
    content_type = request.headers.get("content-type", "")
    if not content_type.startswith("application/json"):
        raise HTTPException(status_code=415, detail="JSON required")


@app.post("/strict", dependencies=[Depends(require_json)])
async def strict_payload(payload: dict[str, object]) -> dict[str, object]:
    return payload
```

{% note success flat %}
向 `/strict` 发送 `application/json` 应进入处理函数，发送 `text/plain` 或缺失 `Content-Type` 应在解析前得到 415。只改变媒体类型、保持正文不变，才能确认失败来自协议边界，而不是模型字段。
{% endnote %}

### 高级类型

```python
from typing import Union
from pydantic import BaseModel


class FlexiblePayload(BaseModel):
    # Python 3.10+ 优先使用 |；Union 适用于仍需兼容旧注解位置的场景
    value: Union[str, int]
```

{% note info flat %}
高级类型的重点是让“可接受的值集合”可见：联合类型、带约束的泛型和 `Base64Bytes` 都应进入模型与 OpenAPI。它们不等于放宽校验；用字符串、整数和布尔值各请求一次，确认 Schema 与实际 422 行为一致。
{% endnote %}

## 应用兼容

### WSGI

{% note info flat %}
挂载 WSGI 应用适合渐进迁移旧 Flask/Django 片段。WSGI 子应用按同步调用模型运行，边界内的阻塞不会因为主应用是 async 就消失；新代码仍应遵守独立配置、日志和健康检查。
{% endnote %}

```python
from fastapi.middleware.wsgi import WSGIMiddleware

app.mount("/legacy", WSGIMiddleware(legacy_wsgi_app))
```

### GraphQL

{% note info flat %}
GraphQL 框架通常提供自己的 ASGI 应用，FastAPI 只负责挂载和外围中间件。把 schema、解析器和错误格式留在 GraphQL 边界，避免把每个字段再拆成重复的 REST 路由。
{% endnote %}

```python
# graphql_app 是所选 GraphQL 框架提供的 ASGI callable。
app.mount("/graphql", graphql_app)
```

### 组合边界

| 目标 | 选择 | OpenAPI/生命周期 |
| --- | --- | --- |
| 共享认证、异常和文档 | `include_router` | 合并到主应用 |
| 独立协议或旧框架 | `Mount` | 子应用可独立 |
| 仅需统一计时/头 | `APIRoute` 或中间件 | 不改变业务模型 |

## 客户端与前端

### 客户端生成

{% note info flat %}
客户端生成的输入应是经过评审并冻结的 `/openapi.json`，输出后要编译、调用一个真实端点并把生成器版本锁定。生成代码不能代替服务器端权限和错误处理。
{% endnote %}

```bash
# 例：使用团队锁定版本的 OpenAPI Generator
openapi-generator-cli generate -i openapi.json -g python -o generated-client
```

### 前端桥接

{% note info flat %}
SPA 只需要静态资源和 API 前缀，服务端渲染页面则还要模板、缓存和 CSRF 策略。无论哪种方式，都从配置读取 `root_path`，并在浏览器中检查 `/api/docs` 和实际 API 没有重复前缀。
{% endnote %}

## 迁移指南

### Pydantic v1

{% note warning flat %}
迁移先替换 API，再用相同 fixture 比较错误位置、响应 JSON 和 OpenAPI。不要把字段重命名、响应状态变更和 v1/v2 API 替换放在同一个不可解释的提交中。
{% endnote %}

| v1 | v2 | 证据 |
| --- | --- | --- |
| `orm_mode=True` | `ConfigDict(from_attributes=True)` | ORM 对象可验证 |
| `.dict()` | `.model_dump()` | 字段/别名一致 |
| `.json()` | `.model_dump_json()` | JSON 形状一致 |
| `parse_obj()` | `model_validate()` | 错误位置一致 |
| `BaseSettings` | `pydantic-settings` | 环境变量仍被校验 |

### 应用参数迁移

{% note info flat %}
FastAPI 构造器的旧扩展参数应逐项迁移到明确的 `docs_url`、`redoc_url`、`openapi_url` 或中间件配置。迁移完成的证据是启动无弃用警告、OpenAPI 路径不变、文档页面仍能加载。
{% endnote %}

```python
app = FastAPI(
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
```

### 旧启动与连接模式

{% note warning flat %}
旧项目常见的 `@app.on_event("startup")`、模块顶层硬编码数据库连接串和全局 Session，都把资源所有权藏在导入副作用里。当前课程统一迁移为 `lifespan` 管理应用级 Engine/客户端、Settings 管理环境值、`yield` 依赖管理请求级 Session；旧代码应先保留行为测试，再逐项移动边界。
{% endnote %}

| 旧模式 | 当前课程落点 | 迁移证据 |
| --- | --- | --- |
| `@app.on_event("startup")` 创建资源 | [应用结构与生命周期](/posts/d0ce794d/) 的 `lifespan` | 启动和关闭各执行一次，重复启动不会泄漏资源 |
| 模块中写死 `mysql://...` 或 `postgresql://...` | [数据库集成与事务](/posts/bbbfc80a/) 的 Settings/环境变量与异步 Engine | 替换环境值后同一测试仍能连接，源码不含凭据 |
| 全局共享一个 Session | [数据库集成与事务](/posts/bbbfc80a/) 的请求级 `yield` 依赖 | 并发请求事务互不污染，异常和取消路径都会关闭会话 |

### 主线迁移索引

{% note info flat %}
专项文章只保留迁移索引，不复制主线实验：参数约束回到路由解析，响应模型回到数据契约，生命周期事件回到应用结构，路径前缀回到部署运维。这样同一能力只有一个主解释位置。
{% endnote %}

- 参数 `regex`/`example`：移到 [路由与请求解析](/posts/fcf9c728/)，比较当前 `pattern` 与示例声明。
- 响应类与输出过滤：移到 [数据模型与响应契约](/posts/ea590b49/)，以 `response_model` 作为唯一公开边界。
- `on_event`：移到 [应用结构与生命周期](/posts/d0ce794d/)，统一为 `lifespan`。
- `openapi_prefix`：移到 [部署与生产运维](/posts/a584b159/)，以 `root_path` 和代理转发形状复验。

## 常见问题

{% flashcard basic id:fastapi-0141-callback-vs-webhook deck:"FastAPI" priority:2 tags:"OpenAPI,事件" %}
--- question
OpenAPI callback 与 webhook 的方向有什么区别？
--- answer
callback 描述本服务向对方发出的回调请求，webhook 描述本服务接收外部事件的入口。
--- explanation
callback 的 URL 通常来自客户端提交的订阅地址，Schema 描述未来出站请求的形状；webhook 是本服务公开的入站路径，接收端要自己做签名、重放和幂等校验。二者都只是契约描述，不会自动完成网络投递或安全验证，方向和责任必须在文档与测试中分别固定。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-custom-route-boundary deck:"FastAPI" priority:2 tags:"APIRoute,Request" %}
--- question
自定义 `APIRoute` 何时值得使用？
--- answer
当多个路由需要统一的协议级计时、媒体类型或原始请求处理时使用；业务参数、身份和权限仍放在依赖与处理函数中。
--- explanation
APIRoute 可以包住最终 handler，适合记录耗时、在解析前拒绝错误 Content-Type 或统一回程头。它不应承载数据库会话和角色规则，否则测试、OpenAPI 和组合边界都会变得隐式。每个成功、异常和流式响应都要验证 route class 没有重复读 body、吞掉异常或遗漏清理。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-pydantic-v1-migration deck:"FastAPI" priority:1 tags:"Pydantic,迁移" %}
--- question
Pydantic v1 到 v2 的迁移如何证明没有改变接口契约？
--- answer
用相同输入和 ORM fixture 比较验证结果、响应 JSON、弃用警告和 OpenAPI Schema；差异必须能解释。
--- explanation
先把 `orm_mode`、`dict()`、`json()`、`parse_obj()` 和 Settings 导入替换为 v2 对应 API，再重跑原有正反用例。响应字段、错误 `loc`、日期/UUID 编码和 OpenAPI required 集合应保持一致；如果发生有意变更，应单独更新版本和迁移说明。把 `ORJSONResponse` 等性能选择混入迁移会让证据无法归因。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Advanced User Guide, https://fastapi.tiangolo.com/advanced/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link How To Guides, https://fastapi.tiangolo.com/how-to/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Pydantic Migration, https://docs.pydantic.dev/latest/migration/, https://docs.pydantic.dev/latest/favicon.ico %}
{% endlinkgroup %}

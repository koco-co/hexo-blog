---
title: FastAPI(三)路由与请求解析
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 系统掌握路由匹配、路径与查询参数、请求体、请求头、Cookie、表单、文件和校验约束。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 3
published: true
abbrlink: fcf9c728
date: 2026-08-26 00:00:00
---
{% course_series %}

{% note primary flat %}
路由层的核心不是“把参数写进函数签名”，而是把一次 HTTP 请求按顺序分流、提取和校验。本文用一个商品接口同时演示静态与动态路径、Path/Query/Header/Cookie、JSON/表单/文件以及 404、405、422 的证据差异。
{% endnote %}

## 路由匹配

### 方法与路径

{% note info flat %}
路由匹配先看路径，再看 HTTP 方法；路径不存在是 404，路径存在但方法不允许是 405。只有完成匹配，FastAPI 才会进入参数解析和处理函数。
{% endnote %}

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/items")
async def list_items() -> list[str]:
    return ["book"]


@app.post("/items")
async def create_item() -> dict[str, str]:
    return {"status": "created"}
```

| 请求 | 结果 | 说明 |
| --- | --- | --- |
| `GET /items` | 200 | 路径和方法都匹配 |
| `POST /items` | 200 | 命中另一条路径操作 |
| `GET /missing` | 404 | 没有任何路径匹配 |
| `PUT /items` | 405 | 路径匹配但方法不在允许集合 |

### 声明顺序

{% mermaid %}
flowchart TD
  A[请求 /items/latest] --> B{先检查哪条路由}
  B -->|动态 /items/{item_id}| C[item_id=latest]
  B -->|静态 /items/latest| D[固定结果]
  C --> E[按声明顺序优先命中]
{% endmermaid %}

{% note warning flat %}
静态路径应放在可能吞掉它的动态路径之前。交换两条声明后分别请求 `/items/latest`，如果返回了动态处理函数的结果，就说明顺序改变了语义；这不是 Pydantic 校验错误，而是路由表阶段的选择错误。
{% endnote %}

## 输入来源

### 路径与查询

{% note info flat %}
FastAPI 根据参数声明判断来源：路径模板中的同名参数进入 Path，其余简单标量默认进入 Query。显式写出 `Path` 和 `Query` 能让代码、OpenAPI 和错误位置保持一致。
{% endnote %}

```python
from typing import Annotated
from fastapi import Path, Query


@app.get("/items/{item_id}")
async def read_item(
    item_id: Annotated[int, Path(ge=1)],
    q: Annotated[str | None, Query(max_length=30)] = None,
) -> dict[str, object]:
    return {"item_id": item_id, "q": q}
```

| 来源 | 请求形状 | Schema 位置 | 常见错误 |
| --- | --- | --- | --- |
| Path | `/items/7` | `in: path` 且 required | 把路径值改成字符串而未满足整数约束 |
| Query | `/items/7?q=book` | `in: query` | 忘记处理缺省值或超出长度 |

### 请求头与 Cookie

{% note info flat %}
Header 名称在 Python 中通常使用下划线，FastAPI 默认把它转换为连字符；Cookie 则只从浏览器 Cookie 头提取。用缺省请求和携带请求各跑一次，才能分辨“未提供”与“提供但格式错误”。
{% endnote %}

```python
from fastapi import Cookie, Header


@app.get("/context")
async def context(
    user_agent: Annotated[str | None, Header()] = None,
    session_id: Annotated[str | None, Cookie()] = None,
) -> dict[str, str | None]:
    return {"user_agent": user_agent, "session_id": session_id}
```

{% note info flat %}
`user_agent` 对应 `User-Agent`，而不是名为 `user_agent` 的自定义头。若要保留特殊拼写，使用 `alias` 明确声明，别依赖调用方猜测转换规则。
{% endnote %}

### 参数模型

```python
from pydantic import BaseModel


class FilterParams(BaseModel):
    limit: int = 20
    offset: int = 0


class CommonHeaders(BaseModel):
    host: str
    save_data: bool = False


class CommonCookies(BaseModel):
    session_id: str | None = None


@app.get("/filtered")
async def filtered(
    params: Annotated[FilterParams, Query()],
    headers: Annotated[CommonHeaders, Header()],
    cookies: Annotated[CommonCookies, Cookie()],
) -> dict[str, object]:
    return {"params": params, "host": headers.host, "session": cookies.session_id}
```

{% note info flat %}
把 Query、Header 或 Cookie 标记放在 Pydantic 模型上，仍然会按协议来源展开字段；OpenAPI 和 422 的 `loc` 会分别指向 `query`、`header` 或 `cookie`。模型只负责一组输入的形状，不会把 Header 值误读成 JSON Body。
{% endnote %}

## 请求体

### JSON 数据

{% note primary flat %}
请求体模型负责把 JSON 转成有类型的 Python 对象；缺字段、类型不符或额外约束失败时，请求在进入处理函数前返回 422。处理函数不应再次手写一套解析器。
{% endnote %}

```python
from pydantic import BaseModel, Field


class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    price: float = Field(gt=0)


@app.post("/items", status_code=201)
async def create_json(item: ItemCreate) -> ItemCreate:
    return item
```

{% note success flat %}
合法 JSON 得到 201；缺少 `name` 或发送负价格时，`detail` 中的 `loc` 会包含 `body` 和字段名。这个位置证据比只看“参数无效”更适合定位客户端问题。
{% endnote %}

### 多个模型

```python
from fastapi import Body


@app.put("/items/{item_id}")
async def update_item(
    item_id: Annotated[int, Path(ge=1)],
    item: ItemCreate,
    audit: Annotated[bool, Body(embed=True)] = False,
) -> dict[str, object]:
    return {"item_id": item_id, "item": item, "audit": audit}
```

{% note info flat %}
当一个处理函数同时接收模型和标量 Body 参数时，默认 JSON 会按参数名组合成对象；`Body(embed=True)` 明确要求 `{"audit": true}` 这一层。分别发送缺少 `item`、缺少 `audit` 和错误嵌套的 JSON，比较 422 的 `loc: ["body", ...]`，能确认客户端契约而不是依赖隐式猜测。
{% endnote %}

### 表单与文件

{% note warning flat %}
表单和文件使用 `application/x-www-form-urlencoded` 或 `multipart/form-data`，不能把 JSON 的 `Content-Type` 原样套过来。`UploadFile` 暴露文件名、媒体类型和异步文件接口，适合大文件；`bytes` 会把完整内容放进内存，适合很小的载荷。
{% endnote %}

```python
from typing import Annotated
from fastapi import File, Form, UploadFile


@app.post("/imports")
async def import_item(
    label: Annotated[str, Form(min_length=1)],
    payload: Annotated[UploadFile, File()],
) -> dict[str, str | None]:
    return {"label": label, "filename": payload.filename, "content_type": payload.content_type}
```

{% note warning flat %}
运行上传实验前确认环境安装了 `python-multipart`（`fastapi[standard]` 通常会带上它）。只声明 `bytes` 并不能自动把 JSON 或 URL 编码文本变成文件。
{% endnote %}

```bash
# multipart：字段和文件都能被解析
curl -F 'label=weekly' -F 'payload=@report.csv' http://127.0.0.1:8000/imports

# 同一端点改成 urlencoded 会缺少文件字段，预期得到 422
curl -H 'content-type: application/x-www-form-urlencoded' \
  --data 'label=weekly' http://127.0.0.1:8000/imports
```

{% note warning flat %}
上传验证要记录请求的 `Content-Type`、状态码和 `detail.loc`。第一个请求证明 multipart 映射成功，第二个请求证明协议不匹配在处理函数之前失败；不要只凭浏览器表单显示“已选择文件”就判定服务端收到文件。
{% endnote %}

## 约束校验

### Annotated 声明

{% note info flat %}
`Annotated[T, Query(...)]` 把“类型”和“来源/约束”放在一个签名里。这样 OpenAPI 能复现同一约束，编辑器也能继续看到真实类型；装饰器参数只适合无法自然放入签名的全局场景。
{% endnote %}

```python
from fastapi import Query

Limit = Annotated[int, Query(ge=1, le=100)]


@app.get("/search")
async def search(limit: Limit = 20) -> dict[str, int]:
    return {"limit": limit}
```

### 字符串与数值约束

{% note warning flat %}
约束在处理函数前执行。分别越过最小长度、正则模式和数值上下界，观察 422 的 `loc`、`type` 与 `msg`；如果处理函数计数增加，说明校验被放到了过晚的位置。
{% endnote %}

```python
Code = Annotated[str, Query(min_length=3, max_length=12, pattern=r"^[A-Z0-9-]+$")]
Score = Annotated[int, Query(ge=0, le=100)]
```

## 失败定位

### 404 与 405

{% note warning flat %}
404 说明没有匹配的路径，405 说明路径存在但方法不允许。405 响应通常还会带 `Allow` 头，排障时同时记录状态码、允许方法和最终请求 URL，避免把客户端拼写错误归咎于业务代码。
{% endnote %}

### 422 错误详情

{% note warning flat %}
422 发生在请求已经命中路由、但输入没有通过转换或校验时。对多个来源同时发送无效值，按 `detail[*].loc` 区分 `path`、`query`、`header`、`cookie` 和 `body`，再只修正对应声明。
{% endnote %}

```json
{
  "detail": [
    {"loc": ["path", "item_id"], "msg": "Input should be a valid integer"},
    {"loc": ["query", "limit"], "msg": "Input should be less than or equal to 100"}
  ]
}
```

## 常见问题

{% flashcard basic id:fastapi-0141-parameter-source deck:"FastAPI" priority:1 tags:"参数,请求解析" %}
--- question
Path、Query、Header、Cookie 与 Body 如何判定来源？
--- answer
路径模板中的同名参数进入 Path；显式声明的 Query/Header/Cookie 从对应协议位置读取；Pydantic 模型参数默认读取 JSON Body。
--- explanation
FastAPI 先根据路径模板完成路由匹配，再依据参数类型和 `Path`、`Query`、`Header`、`Cookie` 等标记建立提取规则。规则会同时生成 OpenAPI 的 `in` 字段和 422 的 `loc`，所以来源不是运行时猜测。遇到同名值时，先看签名中的显式标记和路径模板，再看 Schema，不要靠请求示例反推。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-404-405-422 deck:"FastAPI" priority:1 tags:"错误定位,HTTP" %}
--- question
404、405 与 422 分别在哪个阶段产生？
--- answer
404 在路径匹配失败时产生，405 在路径匹配但方法不允许时产生，422 在命中处理函数前的输入校验失败时产生。
--- explanation
可以把请求看成三道门：第一道匹配路径，第二道检查方法，第三道解析和校验参数。404 没有可用路由；405 应检查 `Allow`；422 则应读取 `detail.loc` 回到具体来源。处理函数没有被调用是 422 的重要证据，修复应优先改签名或请求，而不是在函数内部捕获异常。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-uploadfile-vs-bytes deck:"FastAPI" priority:2 tags:"上传,内存" %}
--- question
`UploadFile` 与 `bytes` 上传的内存和调用边界是什么？
--- answer
`bytes` 直接接收完整内容，简单但会占用载荷大小的内存；`UploadFile` 提供文件元数据和异步读写，更适合较大文件。
--- explanation
两者都要求 multipart 请求，但内存策略不同。小文件可以用 `bytes` 直接校验；大文件应使用 `UploadFile`，按需读取并限制大小。无论选择哪一种，都要检查 `content_type`、文件名和业务大小上限；上传接口不能因为类型标注存在就自动变成安全的文件存储。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Path Parameters, https://fastapi.tiangolo.com/tutorial/path-params/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Request Parameters, https://fastapi.tiangolo.com/reference/parameters/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Request Files, https://fastapi.tiangolo.com/tutorial/request-files/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

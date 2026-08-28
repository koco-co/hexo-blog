---
title: FastAPI(四)数据模型与响应契约
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 使用 Pydantic v2 建立输入输出模型、序列化规则、状态码、错误契约和 OpenAPI 文档。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 4
published: true
abbrlink: ea590b49
date: 2026-06-21 00:00:00
---
{% course_series %}

{% note primary flat %}
数据模型要回答两个方向的问题：客户端可以提交什么，服务端愿意公开什么。把写入、更新和输出模型分开，再用 Pydantic v2 完成验证、序列化和 OpenAPI 声明，才能让敏感字段不因“返回了一个 ORM 对象”而越过边界。
{% endnote %}

## 模型边界

### 输入与输出

{% note info flat %}
输入模型描述客户端可提交的字段，输出模型描述公开契约。两者重叠不等于相同：密码、内部状态和审计字段可以存在于写入或持久化对象，却不应出现在公开响应。
{% endnote %}

```python
from uuid import UUID, uuid4
from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = None
    secret: str = Field(min_length=12)


class TaskPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None


@app.post("/tasks", response_model=TaskPublic, status_code=201)
async def create_task(payload: TaskCreate) -> TaskPublic:
    return TaskPublic(id=uuid4(), title=payload.title, description=payload.description)
```

### 嵌套与额外类型

{% note info flat %}
嵌套模型让地址、负责人等子对象拥有自己的约束；`datetime`、`UUID`、`Decimal` 等额外类型让边界比裸字符串更明确。类型越精确，验证错误和 OpenAPI Schema 越容易被客户端复用。
{% endnote %}

```python
from datetime import datetime
from decimal import Decimal


class Money(BaseModel):
    amount: Decimal = Field(ge=0)
    currency: str = Field(pattern=r"^[A-Z]{3}$")


class TaskDetail(TaskPublic):
    due_at: datetime | None = None
    budget: Money | None = None
```

### 更新与二进制

```python
from pydantic import Base64Bytes


class TaskPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None


class ExportPayload(BaseModel):
    data: Base64Bytes


patch = TaskPatch.model_validate({"title": "new title"})
changes = patch.model_dump(exclude_unset=True)
assert changes == {"title": "new title"}
```

{% note info flat %}
更新接口要区分“字段未出现”和“字段显式为 `null`”：`exclude_unset=True` 只提交客户端实际发送的字段。模型承载二进制时应显式选择 `Base64Bytes` 等编码类型并锁定 JSON 形状；大文件仍优先使用 `UploadFile`，不要把任意字节串直接当作文本。
{% endnote %}

## 验证与序列化

### 模型校验

{% note primary flat %}
`model_validate` 把 Python 映射或 ORM 属性转换为模型；失败时抛出结构化的 `ValidationError`。验证动作应发生在边界处，业务代码接收已经满足类型和范围的对象。
{% endnote %}

```python
from pydantic import ValidationError

raw = {"title": "release", "description": None, "secret": "long-enough-secret"}
task = TaskCreate.model_validate(raw)
assert task.title == "release"

try:
    TaskCreate.model_validate({"title": "", "secret": "short"})
except ValidationError as exc:
    print(exc.errors()[0]["loc"])
```

### 编码转换

{% mermaid %}
flowchart TD
  A[Python 对象] --> B[model_validate]
  B --> C[已验证模型]
  C --> D[model_dump 或 jsonable_encoder]
  D --> E[JSON 响应]
  C --> F{不公开字段}
  F -->|response_model| G[过滤]
{% endmermaid %}

{% note info flat %}
`model_dump()` 产生适合业务层使用的字典，`jsonable_encoder()` 进一步把 UUID、日期等值转成 JSON 兼容对象。编码不是脱敏：真正的字段边界仍由输出模型和 `response_model` 负责。
{% endnote %}

## 响应过滤

### response_model

{% mermaid %}
flowchart LR
  A[处理函数返回 ORM 或字典] --> B[response_model 校验]
  B --> C{字段在输出模型吗}
  C -->|是| D[序列化并返回]
  C -->|否| E[丢弃内部字段]
{% endmermaid %}

{% note primary flat %}
`response_model` 同时参与文档、验证、序列化和过滤。可以用仓储层故意返回 `secret="never-leak"` 的对象做反向实验：响应 JSON 和 OpenAPI 的 `TaskPublic` Schema 都不应出现该字段。
{% endnote %}

### 字段包含与排除

{% note warning flat %}
`response_model_include`、`response_model_exclude` 适合少量、稳定的字段裁剪；复杂权限不应堆在装饰器参数里。优先建立不同的公开模型，避免一个模型靠一串排除规则承载多种角色。
{% endnote %}

```python
@app.get("/tasks/{task_id}", response_model=TaskPublic)
async def read_task(task_id: UUID) -> TaskPublic:
    record = {"id": task_id, "title": "demo", "description": None, "secret": "never-leak"}
    return record
```

## 响应语义

### 状态码族

{% note info flat %}
状态码先表达 HTTP 语义，再决定响应体。创建资源通常用 201，成功读取用 200，删除且无正文用 204；客户端错误则用 4xx，不要把所有结果都压成 200 再在 JSON 里自定义错误码。
{% endnote %}

| 动作 | 推荐状态 | 是否有正文 | 典型响应模型 |
| --- | --- | --- | --- |
| 创建 | 201 | 有 | `TaskPublic` |
| 读取/更新 | 200 | 有 | `TaskPublic` |
| 删除 | 204 | 无 | `None` |
| 输入无效 | 422 | 有错误详情 | Problem/验证错误 |
| 资源不存在 | 404 | 有错误详情 | Problem |

### 响应类边界

{% note info flat %}
默认响应类适合 JSON；`PlainTextResponse`、`HTMLResponse`、`StreamingResponse` 和 `FileResponse` 表达不同媒体类型。不要为了“返回更快”把 JSON 改成字符串，也不要用响应类绕过输出模型过滤。
{% endnote %}

| 响应类 | 主要用途 | 关键边界 |
| --- | --- | --- |
| `JSONResponse` | 返回 JSON 对象 | 默认响应通常已经足够，仍要经过输出契约审查 |
| `HTMLResponse` | 返回 HTML 页面或片段 | 明确媒体类型，并单独处理模板和 XSS 风险 |
| `PlainTextResponse` | 返回纯文本、探针或日志片段 | 不会自动变成 JSON |
| `FileResponse` | 下载本地文件 | 核对路径、权限、缓存头和范围请求 |
| `StreamingResponse` | 生成器或迭代器的分块输出 | 消费者必须处理断开、背压和资源清理 |
| `RedirectResponse` | 让客户端访问另一个 URL | 选择状态码；307/308 保留方法，303 通常把 POST 转为 GET |
| `ORJSONResponse` | 使用 `orjson` 编码 JSON | 需要额外依赖，先证明格式和性能收益再采用 |

```python
from fastapi.responses import ORJSONResponse, RedirectResponse


@app.get("/legacy", response_class=RedirectResponse)
async def legacy() -> RedirectResponse:
    return RedirectResponse(url="/tasks", status_code=307)


@app.get("/fast", response_class=ORJSONResponse)
async def fast() -> dict[str, object]:
    return {"ok": True}
```

{% note warning flat %}
307/308 会保留原请求方法和正文，适合资源地址迁移；如果 POST 成功后希望客户端以 GET 打开结果页，通常选择 303。`ORJSONResponse` 不是 Pydantic v1→v2 的必需迁移项，启用前要锁定额外依赖，并比较日期、UUID、Unicode、`bytes` 和 NaN 的输出形状。
{% endnote %}

### 多状态响应

```python
class ProblemDetail(BaseModel):
    code: str
    message: str


@app.get(
    "/tasks/{task_id}",
    response_model=TaskPublic,
    responses={404: {"model": ProblemDetail}},
)
async def read_task_with_error(task_id: UUID) -> TaskPublic:
    record = {"id": task_id, "title": "demo", "description": None}
    return record
```

{% note info flat %}
`responses` 把额外状态码和错误模型写进 OpenAPI；实际分支仍应抛出 `HTTPException` 或返回约定的响应类。测试要同时检查 200 的输出模型、404 的错误模型和文档中的两种响应，避免只把成功路径写进契约。
{% endnote %}

## OpenAPI 契约

### Schema 生成

{% note success flat %}
路由签名、请求模型、`response_model`、状态码和安全声明会共同生成 OpenAPI。把 `/openapi.json` 当作可比较的契约产物，字段名、required、响应状态和 security 任一漂移都应进入评审。
{% endnote %}

### 示例与扩展

```python
from fastapi import Body


@app.post(
    "/tasks/import",
    openapi_extra={"x-owner": "task-team"},
)
async def import_task(
    payload: TaskCreate = Body(
        examples=[{"title": "release", "description": "ship", "secret": "long-enough-secret"}]
    ),
) -> TaskPublic:
    return TaskPublic(id=uuid4(), title=payload.title, description=payload.description)
```

{% note info flat %}
扩展字段只能补充真实的机器可读信息；如果客户端必须依赖某个自定义字段，就应在接口测试中锁定它，而不是只在 Swagger UI 截图里保存。
{% endnote %}

## 版本迁移

### 弃用参数

{% note warning flat %}
Pydantic v1 的 `orm_mode`、`.dict()` 和 `parse_obj()` 在 v2 中有对应的新写法。迁移时先让模型和响应测试通过，再清理弃用警告；不要同时改变字段名、状态码和序列化策略，否则无法判断差异来源。
{% endnote %}

| v1 写法 | v2 写法 | 迁移证据 |
| --- | --- | --- |
| `class Config: orm_mode = True` | `ConfigDict(from_attributes=True)` | ORM 对象仍可验证 |
| `model.dict()` | `model.model_dump()` | 字典字段和别名一致 |
| `Model.parse_obj(data)` | `Model.model_validate(data)` | 验证错误位置一致 |

### 响应类迁移

{% note info flat %}
`ORJSONResponse` 等响应类属于性能或格式选择，不是 Pydantic v1 到 v2 的必需迁移项。先用默认 JSON 响应确认模型边界，再在确有序列化收益时比较媒体类型、日期格式和依赖体积。
{% endnote %}

{% note warning flat %}
旧项目如果依赖 `ujson`、`orjson` 或自定义 JSONResponse，应把它们视为独立的序列化迁移：先确认当前 FastAPI/Starlette 版本与额外依赖仍支持，再比较 Unicode、日期、UUID、`bytes` 和 NaN 的输出。不要把更换 JSON 库和 Pydantic v1→v2 的模型改名放在同一次无法归因的提交中。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-response-model-filter deck:"FastAPI" priority:1 tags:"响应模型,安全" %}
--- question
为什么 `response_model` 能阻止敏感字段泄露？
--- answer
FastAPI 会按 `response_model` 验证并序列化返回值，只保留输出模型声明的字段。
--- explanation
处理函数可以返回包含内部字段的字典或 ORM 对象，但响应阶段会重新按输出模型构造公开结果。要证明边界有效，应让仓储层返回 `secret="never-leak"`，递归检查响应 JSON、日志快照和 OpenAPI Schema 均没有该字段。它不是万能脱敏器：日志、异常和直接返回 `JSONResponse` 仍需单独控制。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-input-output-schema deck:"FastAPI" priority:1 tags:"Pydantic,契约" %}
--- question
为什么输入模型和输出模型通常要分开？
--- answer
输入和输出承担不同信任方向；分开后可以允许写入字段、隐藏内部字段并独立演进公开契约。
--- explanation
写入模型描述客户端可提供的值，输出模型描述服务端愿意承诺的值。密码、owner_id 或审计元数据可能需要写入数据库，却不应沿响应返回。两个模型完全相同会让新增内部字段意外变成公开字段；分开还能让 OpenAPI 明确区分 requestBody 和 responses。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-orjson-migration deck:"FastAPI" priority:2 tags:"迁移,序列化" %}
--- question
从 Pydantic v1 迁移到 v2 时，哪些模型调用应优先替换？
--- answer
优先把 `orm_mode` 换成 `from_attributes`，把 `dict()` 换成 `model_dump()`，把 `parse_obj()` 换成 `model_validate()`，再比较响应契约。
--- explanation
这些替换改变的是模型配置和调用名称，不应顺手修改字段或状态码。迁移证据包括：同一 ORM fixture 能验证、同一输入的错误位置不变、JSON 日期/UUID 形状不变、OpenAPI Schema 没有无意漂移。`ORJSONResponse` 是独立的响应类选择，只有在明确需要时才加入，不能把它当成 v2 迁移的必选步骤。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Response Model, https://fastapi.tiangolo.com/tutorial/response-model/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Pydantic Models, https://docs.pydantic.dev/latest/concepts/models/, https://docs.pydantic.dev/latest/favicon.ico %}
{% link JSON Compatible Encoder, https://fastapi.tiangolo.com/tutorial/encoder/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

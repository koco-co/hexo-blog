---
title: FastAPI文档(一) 入门
tags:
  - Python
  - FastAPI
  - 异步编程
  - Pydantic
categories:
  - 后端开发
  - Python
description: FastAPI 是一个基于 Python 的高性能 Web 框架, 专门用于快速构建 API 接口服务。本文详细介绍 FastAPI 的核心特性、安装配置、路由参数、响应类型、请求验证等入门知识。
abbrlink: 6b2c83c4
cover: >-
  /img/picgo-images/fastapi.png
date: 2026-02-10 12:35:13
---

## 概述

FastAPI 是一个基于 Python 的高性能 Web 框架, 专门用于快速构建 API 接口服务. 它基于 Starlette 和 Pydantic 构建, 支持 async/await 语法, 性能可媲美 NodeJS 和 Go.

{% link FastAPI 官方文档, https://fastapi.tiangolo.com/, https://avatars.githubusercontent.com/u/156354296?s=48&v=4 %}

### 核心特性

{% note success %}
**异步高性能**: 基于 ASGI 标准, 支持异步编程, 性能接近 NodeJS 和 Go
{% endnote %}

{% note primary %}
**开发效率高**: Pydantic 类型提示与验证, 减少手动校验代码
{% endnote %}

{% note info %}
**自动生成文档**: Swagger UI 交互式文档和 ReDoc 文档, 浏览器中直接调用和测试 API
{% endnote %}

- **类型安全**: 利用 Python 类型注解, 自动数据验证和序列化
- **依赖注入**: 强大的依赖注入系统, 简化代码复用

Ref. [FastAPI Features](https://fastapi.tiangolo.com/features/)

## 安装配置

### 系统要求

{% note warning %}

- Python 3.8+
- 推荐使用虚拟环境隔离项目依赖
  {% endnote %}

### 安装步骤

{% tabs 安装 FastAPI, fa-solid fa-download %}

<!-- tab macOS @fab fa-apple -->

```bash
# 使用 Homebrew 安装 Python (如果未安装)
brew install python@3.11

# 创建项目目录
mkdir fastapi-project && cd fastapi-project

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装 FastAPI (标准版, 包含常用依赖)
pip install "fastapi[standard]"

# 或安装精简版 (不包含 uvicorn 等依赖)
pip install fastapi
```

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

```powershell
# 使用 winget 安装 Python (如果未安装)
winget install Python.Python.3.11

# 创建项目目录
mkdir fastapi-project
cd fastapi-project

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\activate

# 安装 FastAPI (标准版, 包含常用依赖)
pip install "fastapi[standard]"

# 或安装精简版 (不包含 uvicorn 等依赖)
pip install fastapi
```

<!-- endtab -->

<!-- tab Linux @fab fa-linux -->

```bash
# Ubuntu/Debian 安装 Python
sudo apt update
sudo apt install python3.11 python3.11-venv

# 创建项目目录
mkdir fastapi-project && cd fastapi-project

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装 FastAPI (标准版, 包含常用依赖)
pip install "fastapi[standard]"

# 或安装精简版 (不包含 uvicorn 等依赖)
pip install fastapi
```

<!-- endtab -->

{% endtabs %}

Ref. [FastAPI Installation](https://fastapi.tiangolo.com/tutorial/first-steps/)

### 依赖说明

FastAPI 提供多种安装选项:

| 安装方式          | 命令                                                   | 包含依赖                                   | 适用场景         |
| ----------------- | ------------------------------------------------------ | ------------------------------------------ | ---------------- |
| 标准版            | `pip install "fastapi[standard]"`                      | uvicorn, fastapi-cli, fastapi-cloud-cli 等 | 生产环境推荐     |
| 标准版 (无云 CLI) | `pip install "fastapi[standard-no-fastapi-cloud-cli]"` | uvicorn, fastapi-cli 等                    | 不需要云部署功能 |
| 精简版            | `pip install fastapi`                                  | 仅核心框架                                 | 需要精确控制依赖 |

{% note danger %}
P.S. 从 FastAPI 最新版本开始, 标准依赖不再默认包含, 需要显式指定 `[standard]` 才会安装 uvicorn 等常用依赖.
{% endnote %}

Ref. [FastAPI Dependencies](https://fastapi.tiangolo.com/#installation)

## 快速开始

### 第一个 FastAPI 程序

创建 `main.py` 文件:

```python
from fastapi import FastAPI

# 创建 FastAPI 实例
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello")
async def get_hello():
    return {"msg": "你好 FastAPI"}
```

e.g. 以上代码定义了两个路由:

- `GET /` - 返回欢迎消息
- `GET /hello` - 返回中文问候

Ref. [FastAPI First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/)

### 运行项目

```bash
# 开发环境运行 (带自动重载)
uvicorn main:app --reload

# 指定主机和端口
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 生产环境运行 (多 worker)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

参数说明:

- `main:app` - main.py 文件中的 app 对象
- `--reload` - 代码更改后自动重启服务器 (仅开发环境)
- `--host` - 绑定的主机地址, 0.0.0.0 表示所有网络接口
- `--port` - 监听端口号
- `--workers` - worker 进程数 (生产环境)

{% note warning %}
P.S. `--reload` 选项在开发环境中很有用, 但会消耗更多资源且不够稳定, 生产环境切勿使用.
{% endnote %}

Ref. [Uvicorn Deployment](https://www.uvicorn.org/deployment/)

### 访问项目

- **API 服务**: http://127.0.0.1:8000/
- **交互式文档 (Swagger UI)**: http://127.0.0.1:8000/docs
- **文档 (ReDoc)**: http://127.0.0.1:8000/redoc

e.g. 访问 http://127.0.0.1:8000/docs 可以看到自动生成的交互式 API 文档, 可以直接在浏览器中测试接口.

## 核心功能

### 同步与异步

FastAPI 支持同步和异步两种函数定义方式. 异步函数使用 `async def` 定义, 可以利用 `await` 关键字处理 I/O 操作, 提高并发性能.

{% tabs 同步与异步对比, fa-solid fa-code %}

<!-- tab 同步函数 -->

```python
import time

from fastapi import FastAPI

app = FastAPI()


@app.get("/sync")
def func_sync():
    start = time.time()
    for i in range(10):
        time.sleep(1)
    end = time.time()
    return {"time": f'{end-start:.2f}s'}
```

e.g. 同步函数会阻塞请求处理, 每个请求必须等待前一个请求完成.

<!-- endtab -->

<!-- tab 异步函数 -->

```python
import asyncio
import time

from fastapi import FastAPI

app = FastAPI()


@app.get("/async")
async def func_async():
    start = time.time()
    tasks = [asyncio.sleep(1) for i in range(10)]
    await asyncio.gather(*tasks)
    end = time.time()
    return {"time": f'{end-start:.2f}s'}
```

e.g. 异步函数可以同时处理多个 I/O 操作, 显著提高并发性能.

<!-- endtab -->

{% endtabs %}

Ref. [Async Path Operations](https://fastapi.tiangolo.com/async/)

### 路由

路由就是 URL 地址和处理函数之间的映射关系, 它决定了当用户访问某个特定网址时, 服务器应该执行哪段代码来返回结果.

#### 路由定义

FastAPI 的路由定义基于 Python 的装饰器模式:

```python
@app.get("/")
async def root():
    return {"message": "hello world"}
```

装饰器说明:

- `@app.get("/")` - 定义 GET 请求方法, 路径为 `/`
- `async def root()` - 异步处理函数
- `return {...}` - 返回 JSON 响应

#### HTTP 方法

FastAPI 支持所有常见的 HTTP 方法:

```python
@app.get("/")    # GET 请求 - 查询资源
@app.post("/")   # POST 请求 - 创建资源
@app.put("/")    # PUT 请求 - 更新资源
@app.delete("/") # DELETE 请求 - 删除资源
@app.patch("/")  # PATCH 请求 - 部分更新资源
@app.options("/") # OPTIONS 请求 - 查询支持的方法
@app.head("/")    # HEAD 请求 - 获取响应头
```

e.g. 使用对应的装饰器来定义不同 HTTP 方法的路由.

Ref. [Path Operation Decorators](https://fastapi.tiangolo.com/tutorial/path-operation-configuration/)

### 参数

参数就是客户端发送请求时附带的额外信息和指令. 参数的作用是让同一个接口能根据不同的输入, 返回不同的输出, 实现动态交互.

#### 参数分类

| 参数类型 | 位置                          | 作用                                   | HTTP 方法    |
| -------- | ----------------------------- | -------------------------------------- | ------------ |
| 路径参数 | URL 路径的一部分 `/book/{id}` | 指向唯一的、特定的资源                 | GET          |
| 查询参数 | URL? 之后 `k1=v1&k2=v2`       | 对资源集合进行过滤、排序、分页等操作   | GET          |
| 请求体   | HTTP 请求的消息体 (body) 中   | 创建、更新资源, 携带大量数据 (如 JSON) | POST、PUT 等 |

Ref. [Request Body](https://fastapi.tiangolo.com/tutorial/body/)

#### 路径参数

路径参数是 URL 路径的一部分, 用于指向唯一的、特定的资源.

**基础用法**

```python
from fastapi import FastAPI, Path

app = FastAPI()


@app.get("/book/{id}")
async def get_book(id: int):
    return {"id": id, "title": f"这是第{id}本书"}
```

e.g. 访问 `/book/1` 会返回 `{"id": 1, "title": "这是第1本书"}`

**类型注解 Path**

FastAPI 允许为参数声明额外的信息和校验:

```python
@app.get("/book/{id}")
async def get_book(
    id: int = Path(..., gt=0, lt=101, description="书籍id, 取值范围1-100")
):
    return {"id": id, "title": f"这是第{id}本书"}
```

**Path 参数说明**

| 参数          | 说明              | 示例                          |
| ------------- | ----------------- | ----------------------------- |
| `...`         | 必填              | `id: int = Path(...)`         |
| `gt`          | 大于              | `gt=0` 表示必须大于 0         |
| `ge`          | 大于等于          | `ge=1` 表示必须大于等于 1     |
| `lt`          | 小于              | `lt=101` 表示必须小于 101     |
| `le`          | 小于等于          | `le=100` 表示必须小于等于 100 |
| `description` | 描述              | `description="用户ID"`        |
| `min_length`  | 最小长度 (字符串) | `min_length=2`                |
| `max_length`  | 最大长度 (字符串) | `max_length=10`               |

e.g. 使用 Path 参数可以限制 ID 的取值范围为 1-100, 如果用户传入 0 或 101 会返回 422 验证错误.

Ref. [Path Parameters](https://fastapi.tiangolo.com/tutorial/path-params/)

#### 查询参数

查询参数位于 URL? 之后, 用于对资源集合进行过滤、排序、分页等操作.

**基础用法**

声明的参数不是路径参数时, 路径操作函数会把该参数自动解释为查询参数:

```python
from fastapi import FastAPI, Query

app = FastAPI()


@app.get("/news/news_list")
async def get_news_list(skip: int, limit: int = 10):
    return {"skip": skip, "limit": limit}
```

e.g. 访问 `/news/news_list?skip=0&limit=10` 会返回 `{"skip": 0, "limit": 10}`

**类型注解 Query**

```python
@app.get("/news/news_list")
async def get_news_list(
    skip: int = Query(0, description="跳过的记录数", lt=100),
    limit: int = Query(10, description="返回的记录数")
):
    return {"skip": skip, "limit": limit}
```

**Query 参数说明**

| 参数          | 说明     | 示例                       |
| ------------- | -------- | -------------------------- |
| `...`         | 必填     | `q: str = Query(...)`      |
| `gt`          | 大于     | `gt=0`                     |
| `ge`          | 大于等于 | `ge=1`                     |
| `lt`          | 小于     | `lt=100`                   |
| `le`          | 小于等于 | `le=50`                    |
| `default`     | 默认值   | `default=10`               |
| `description` | 描述     | `description="搜索关键词"` |
| `min_length`  | 最小长度 | `min_length=2`             |
| `max_length`  | 最大长度 | `max_length=50`            |

e.g. 使用 Query 参数可以限制 skip 必须小于 100, 如果用户传入 100 会返回 422 验证错误.

Ref. [Query Parameters](https://fastapi.tiangolo.com/tutorial/query-params/)

#### 请求体参数

请求体参数位于 HTTP 请求的消息体 (body) 中, 用于创建、更新资源, 携带大量数据 (如 JSON).

在 HTTP 协议中, 一个完整的请求由三部分组成:

1. **请求行**: 包含方法、URL、协议版本
2. **请求头**: 元数据信息 (Content-Type、Authorization 等)
3. **请求体**: 实际要发送的数据内容

**基础用法**

1. 定义类型 (继承 BaseModel)
2. 类型注解

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


# 定义请求体模型
class User(BaseModel):
    username: str
    password: str


@app.post("/register")
async def register(user: User):
    return user
```

e.g. 发送 POST 请求到 `/register`, 请求体为 `{"username": "test", "password": "123456"}`

**类型注解 Field**

```python
from pydantic import BaseModel, Field

class User(BaseModel):
    username: str = Field(
        default="张三",
        min_length=2,
        max_length=10,
        description="用户名, 长度要求2-10个字"
    )
    password: str = Field(min_length=3, max_length=20)


@app.post("/register")
async def register(user: User):
    return user
```

**Field 参数说明**

| 参数          | 说明     | 示例                                    |
| ------------- | -------- | --------------------------------------- |
| `...`         | 必填     | `username: str = Field(...)`            |
| `gt`          | 大于     | `price: float = Field(gt=0)`            |
| `ge`          | 大于等于 | `age: int = Field(ge=18)`               |
| `lt`          | 小于     | `discount: float = Field(lt=1)`         |
| `le`          | 小于等于 | `quantity: int = Field(le=100)`         |
| `default`     | 默认值   | `status: str = Field(default="active")` |
| `description` | 描述     | `description="用户名"`                  |
| `min_length`  | 最小长度 | `min_length=2`                          |
| `max_length`  | 最大长度 | `max_length=50`                         |

e.g. 使用 Field 参数可以限制用户名长度为 2-10 个字符, 密码长度为 3-20 个字符.

Ref. [Request Body](https://fastapi.tiangolo.com/tutorial/body/)

#### 混合参数

FastAPI 可以同时使用路径参数、查询参数和请求体参数:

```python
from fastapi import FastAPI, Path, Query
from pydantic import BaseModel, Field

app = FastAPI()


class Book(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    author: str = Field(..., min_length=2, max_length=50)


@app.put("/books/{book_id}")
async def update_book(
    book_id: int = Path(..., gt=0, description="书籍ID"),
    book: Book = None,
    q: str = Query(None, description="搜索关键词")
):
    return {
        "book_id": book_id,
        "title": book.title if book else None,
        "author": book.author if book else None,
        "query": q
    }
```

e.g. PUT 请求到 `/books/1?q=search`, 请求体为 `{"title": "Python编程", "author": "张三"}`

{% note success %}
FastAPI 会根据以下规则自动识别参数类型:

1. 如果参数在路径中声明, 则作为路径参数
2. 如果参数是单数类型 (int, float, str, bool 等), 则作为查询参数
3. 如果参数是 Pydantic 模型类型, 则作为请求体
   {% endnote %}

Ref. [Mix Path, Query and Body Parameters](https://fastapi.tiangolo.com/tutorial/body-multiple-params/)

### 响应类型

默认情况下, FastAPI 会自动将路径操作函数返回的 Python 对象 (字典、列表、Pydantic 模型等), 经由 jsonable_encoder 转换为 JSON 兼容格式, 并包装为 JSONResponse 返回.

如果需要返回非 JSON 数据 (如 HTML、文件流), FastAPI 提供了丰富的响应类型.

#### 内置响应类型

| 响应类型          | 用途                         | 示例                                |
| ----------------- | ---------------------------- | ----------------------------------- |
| JSONResponse      | 默认响应, 返回 JSON 数据     | `return {"key": "value"}`           |
| HTMLResponse      | 返回 HTML 内容               | `return HTMLResponse(html_content)` |
| PlainTextResponse | 返回纯文本                   | `return PlainTextResponse("text")`  |
| FileResponse      | 返回文件下载                 | `return FileResponse(path)`         |
| StreamingResponse | 流式响应                     | 生成器函数返回数据                  |
| RedirectResponse  | 重定向                       | `return RedirectResponse(url)`      |
| ORJSONResponse    | 使用 orjson 的更快 JSON 响应 | `return ORJSONResponse(content)`    |

Ref. [Response Models](https://fastapi.tiangolo.com/tutorial/response-model/)

#### 响应类型设置方式

{% tabs 响应类型设置方式, fa-solid fa-code %}

<!-- tab 装饰器指定响应类 -->

场景: 固定返回类型 (HTML、纯文本等)

```python
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()


@app.get("/html", response_class=HTMLResponse)
async def get_html():
    return "<h1>这是一级标题</h1>"
```

<!-- endtab -->

<!-- tab 返回响应对象 -->

场景: 文件下载、图片、流式响应

```python
from fastapi import FastAPI
from fastapi.responses import FileResponse

app = FastAPI()


@app.get("/file")
async def get_file():
    path = "./files/1.jpeg"
    return FileResponse(path)
```

<!-- endtab -->

{% endtabs %}

e.g. 方式一适用于固定返回类型的场景, 方式二适用于需要动态返回不同类型的场景.

Ref. [Custom Response - HTML, Stream, File, others](https://fastapi.tiangolo.com/advanced/custom-response/)

#### 响应 HTML 格式

```python
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()


@app.get("/html", response_class=HTMLResponse)
async def get_html():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>FastAPI HTML</title>
    </head>
    <body>
        <h1>这是一级标题</h1>
        <p>这是段落内容</p>
    </body>
    </html>
    """
```

e.g. 访问 `/html` 会返回完整的 HTML 页面.

#### 响应文件格式

FileResponse 是 FastAPI 提供的专门用于高效返回文件内容 (如图片、PDF、Excel、音视频等) 的响应类. 它能够智能处理文件路径、媒体类型推断、范围请求和缓存头部, 是服务静态文件的推荐方式.

```python
from fastapi import FastAPI
from fastapi.responses import FileResponse

app = FastAPI()


@app.get("/file/{filename}")
async def get_file(filename: str):
    path = f"./files/{filename}"
    return FileResponse(
        path=path,
        media_type='application/octet-stream',
        filename=filename
    )
```

e.g. 访问 `/file/document.pdf` 会下载 PDF 文件.

{% note info %}
P.S. FileResponse 会自动处理以下内容:

- 根据文件扩展名推断 Content-Type
- 支持范围请求 (用于视频播放)
- 自动设置缓存头部
  {% endnote %}

Ref. [Using FileResponse](https://fastapi.tiangolo.com/advanced/custom-response/#using-fileresponse)

#### 自定义响应数据格式

response_model 是路径操作装饰器 (如 @app.get 或 @app.post) 的关键参数, 它通过一个 Pydantic 模型来严格定义和约束 API 端点的输出格式. 这一机制在提供自动数据验证和序列化的同时, 更是保障数据安全性的第一道防线.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class News(BaseModel):
    id: int
    title: str
    content: str


@app.get("/news/{id}", response_model=News)
async def get_news(id: int):
    # 内部可能包含更多数据
    return {
        "id": id,
        "title": f"这是第{id}本书",
        "content": "这是一本好书",
        "internal_field": "这个字段不会返回给客户端"
    }
```

e.g. 使用 response_model=News 后, 只有 News 模型中定义的字段会返回给客户端, internal_field 会被过滤掉.

{% note success %}
P.S. response_model 的作用:

- 定义响应数据格式
- 自动数据验证和序列化
- 过滤敏感字段 (如密码、内部字段)
- 在自动文档中生成响应示例
  {% endnote %}

Ref. [Response Model](https://fastapi.tiangolo.com/tutorial/response-model/)

### 错误处理

使用 HTTPException 返回错误响应:

```python
from fastapi import FastAPI, HTTPException, status

app = FastAPI()


items = {"foo": "The Foo Fighters"}


@app.get("/items/{item_id}")
async def read_item(item_id: str):
    if item_id not in items:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
            headers={"X-Error": "There goes my error"}
        )
    return {"item": items[item_id]}
```

e.g. 当 item_id 不存在时, 返回 404 错误.

{% note warning %}
P.S. HTTPException 是 FastAPI 处理错误的推荐方式, 它会自动返回格式化的 JSON 错误响应.
{% endnote %}

Ref. [Exception Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)

## 最佳实践

### 项目结构

推荐的项目结构:

{% folding green, ✅ 推荐的项目结构 %}

```
my_project/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 应用入口
│   ├── api/             # API 路由
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── items.py
│   ├── models/          # 数据模型
│   │   ├── __init__.py
│   │   └── item.py
│   ├── schemas/         # Pydantic 模型
│   │   ├── __init__.py
│   │   └── item.py
│   ├── services/        # 业务逻辑
│   │   ├── __init__.py
│   │   └── item_service.py
│   └── utils/           # 工具函数
│       ├── __init__.py
│       └── helpers.py
├── tests/               # 测试
├── requirements.txt     # 依赖清单
└── README.md
```

{% endfolding %}

Ref. [Bigger Applications - Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/)

## 常见问题

{% folding yellow, ❓ FastAPI 和 Flask 的区别 %}

### Q1: FastAPI 和 Flask 有什么区别?

| 特性     | FastAPI            | Flask         |
| -------- | ------------------ | ------------- |
| 性能     | 异步高性能         | 同步性能较低  |
| 类型验证 | 自动 Pydantic 验证 | 需要手动验证  |
| 文档     | 自动生成交互式文档 | 需要手动编写  |
| 学习曲线 | 需要理解异步编程   | 相对简单      |
| 适用场景 | 现代 API 服务      | 传统 Web 应用 |

Ref. [Alternatives, Inspiration and Comparisons](https://fastapi.tiangolo.com/fastapi-alternatives/)

{% endfolding %}

{% folding purple, 🚀 如何部署 FastAPI %}

### Q2: 如何部署 FastAPI 应用?

推荐使用 Docker 容器化部署:

```dockerfile
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

也可以使用 Gunicorn + Uvicorn:

```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

Ref. [Deployment - Docker](https://fastapi.tiangolo.com/deployment/docker/)

{% endfolding %}

{% folding cyan, 📁 文件上传处理 %}

### Q3: 如何处理文件上传?

使用 `UploadFile` 处理文件上传:

```python
from fastapi import FastAPI, File, UploadFile

app = FastAPI()


@app.post("/uploadfile")
async def create_upload_file(file: UploadFile = File(...)):
    return {"filename": file.filename}
```

Ref. [Request Files](https://fastapi.tiangolo.com/tutorial/request-files/)

{% endfolding %}

{% folding indigo, 🔌 WebSocket 实现 %}

### Q4: 如何实现 WebSocket?

FastAPI 原生支持 WebSocket:

```python
from fastapi import FastAPI, WebSocket

app = FastAPI()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")
```

Ref. [WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)

{% endfolding %}

{% folding orange, 🧪 编写测试 %}

### Q5: 如何编写测试?

使用 pytest 和 httpx 测试 FastAPI 应用:

```bash
pip install pytest httpx
```

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_read_item():
    response = client.get("/items/foo")
    assert response.status_code == 200
    assert response.json() == {"item_id": "foo"}
```

Ref. [Testing](https://fastapi.tiangolo.com/tutorial/testing/)

{% endfolding %}

## 参考资料

{% btn https://fastapi.tiangolo.com/, FastAPI 官方文档, fa-solid fa-book, blue %}

{% btn https://github.com/tiangolo/fastapi, FastAPI GitHub, fa-brands fa-github, purple %}

{% btn https://docs.pydantic.dev/, Pydantic 文档, fa-solid fa-shield-halved, green %}

{% btn https://www.uvicorn.org/, Uvicorn 文档, fa-solid fa-server, orange %}

{% btn https://www.starlette.io/, Starlette 文档, fa-solid fa-bolt, red %}

{% link FastAPI 中文翻译, https://fastapi.tiangolo.com/zh/, https://avatars.githubusercontent.com/u/156354296?s=48&v=4 %}

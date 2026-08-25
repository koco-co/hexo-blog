---
title: FastAPI文档(二) 进阶
tags:
  - Python
  - FastAPI
  - 中间件
  - ORM
  - SQLAlchemy
  - 依赖注入
categories:
  - 后端开发
  - Python
description: >-
  FastAPI 进阶教程, 深入学习中间件、依赖注入、ORM 数据库操作等高级特性。本文详细介绍 FastAPI 中间件的使用、依赖注入系统的应用场景、以及 SQLAlchemy ORM 的异步操作。
abbrlink: 7a1d94f5
cover: >-
  /img/picgo-images/fastapi.png
date: 2026-02-10 13:37:03
---

## 概述

FastAPI 进阶教程将带你深入理解中间件、依赖注入和 ORM 数据库操作等核心特性. 这些高级特性能够帮助你构建更加健壮、可维护的企业级应用.

Ref. [FastAPI Advanced User Guide](https://fastapi.tiangolo.com/tutorial/)

## 中间件

### 中间件概念

中间件 (Middleware) 是一个在每次请求进入 FastAPI 应用时都会被执行的函数. 它在请求到达实际的路径操作 (路由处理函数) 之前运行, 并且在响应返回给客户端之前再运行一次.

{% note info %}
中间件执行流程:

1. 请求进入应用
2. 中间件 A 处理请求
3. 中间件 B 处理请求
4. 路由处理函数执行
5. 返回响应经过中间件 B
6. 返回响应经过中间件 A
7. 响应返回给客户端
   {% endnote %}

{% mermaid %}
flowchart LR
A[客户端] --> B[中间件 A]
B --> C[中间件 B]
C --> D[路由处理函数]
D --> C
C --> B
B --> A
{% endmermaid %}

### 中间件应用场景

- **性能监控**: 记录每个请求的处理时间
- **日志记录**: 统一记录请求和响应信息
- **身份认证**: 验证用户身份和权限
- **响应头处理**: 添加 CORS、安全头等
- **跨域处理**: 配置跨域资源共享

Ref. [FastAPI Middleware](https://fastapi.tiangolo.com/tutorial/middleware/)

### 定义中间件

使用装饰器 `@app.middleware("http")` 定义中间件:

```python
from fastapi import FastAPI

app = FastAPI()


@app.middleware("http")
async def middleware1(request, call_next):
    print("中间件1 start")
    # 传递请求给路径处理函数
    response = await call_next(request)
    print("中间件1 end")
    return response


@app.middleware("http")
async def middleware2(request, call_next):
    print("中间件2 start")
    response = await call_next(request)
    print("中间件2 end")
    return response


@app.get("/")
async def root():
    return {"message": "Hello World"}
```

e.g. 以上代码定义了两个中间件, 当访问 `/` 路径时, 输出顺序为:

```
中间件2 start
中间件1 start
中间件1 end
中间件2 end
```

{% note warning %}
**P.S.** 中间件执行顺序: 自下而上. 后定义的中间件先执行.
{% endnote %}

Ref. [Advanced Middleware](https://fastapi.tiangolo.com/advanced/middleware/)

### 性能监控

```python
import time
from fastapi import FastAPI, Request

app = FastAPI()


@app.middleware("http")
async def process_time_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    # 自定义响应头
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.get("/")
async def root():
    return {"message": "Hello World"}
```

e.g. 这个中间件会在每个响应头中添加 `X-Process-Time` 字段, 显示请求处理时间.

## 依赖注入

### 依赖注入概念

依赖注入系统是 FastAPI 的核心特性之一, 它提供了一种优雅的方式来共享通用逻辑, 减少代码重复.

**核心概念**:

- **依赖项**: 可重用的组件 (函数/类), 负责提供某种功能或数据
- **注入**: FastAPI 自动帮你调用依赖项, 并将结果"注入"到路径操作函数中

**优点**:

- **代码复用**: 一次编写, 多处使用
- **解耦**: 业务逻辑与基础设施代码分离
- **易于测试**: 轻松地用模拟依赖替换真实依赖进行测试

Ref. [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)

### 依赖注入应用场景

{% mermaid %}
flowchart TD
A[多个路由] --> B[依赖注入系统]
B --> C[依赖项]
C --> D[复用逻辑]
D --> E[数据库会话]
D --> F[认证验证]
D --> G[参数提取]
{% endmermaid %}

1. **处理请求参数**: 从请求中提取和验证参数
2. **共享数据库连接**: 管理数据库会话的创建、使用、关闭
3. **共享业务逻辑**: 抽取封装多个路由公用的逻辑代码
4. **安全和认证**: 验证用户身份、检查权限和角色要求等

### 基础用法

**步骤一: 创建依赖项**

```python
from fastapi import FastAPI, Query

app = FastAPI()


# 分页参数逻辑共用: 新闻列表和用户列表
async def common_parameters(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(10, le=60, description="返回的记录数")
):
    return {"skip": skip, "limit": limit}
```

**步骤二: 导入 Depends 并声明依赖项**

```python
from fastapi import Depends

# 3. 声明依赖项 → 依赖注入
@app.get("/news/news_list")
async def get_news_list(commons = Depends(common_parameters)):
    return commons


@app.get("/user/user_list")
async def get_user_list(commons = Depends(common_parameters)):
    return commons
```

e.g. 以上代码中, `common_parameters` 依赖项被多个路由共享, 避免了代码重复.

Ref. [Dependencies - First Steps](https://fastapi.tiangolo.com/tutorial/dependencies/)

### 依赖项作为类

依赖项也可以是一个类, FastAPI 会自动实例化该类:

```python
from fastapi import FastAPI, Depends
from typing import Annotated

app = FastAPI()


class CommonParams:
    def __init__(
        self,
        skip: int = 0,
        limit: int = 100
    ):
        self.skip = skip
        self.limit = limit


@app.get("/items/")
async def read_items(commons: Annotated[CommonParams, Depends(CommonParams)]):
    response = {}
    if commons.skip:
        response.update({"skip": commons.skip})
    if commons.limit:
        response.update({"limit": commons.limit})
    return response
```

Ref. [Dependencies as Classes](https://fastapi.tiangolo.com/tutorial/dependencies/classes-as-dependencies/)

### 嵌套依赖

FastAPI 支持依赖项的嵌套, 一个依赖项可以依赖于其他依赖项:

```python
from fastapi import FastAPI, Depends

app = FastAPI()


def query_extractor(q: str | None = None):
    return q


def query_or_cookie_extractor(
    q: Annotated[str, Depends(query_extractor)],
    last_query: str | None = None
):
    if not q:
        return last_query
    return q


@app.get("/items/")
async def read_query(
    query_ref: Annotated[str, Depends(query_or_cookie_extractor)]
):
    return {"query_ref": query_ref}
```

e.g. `query_or_cookie_extractor` 依赖于 `query_extractor`, FastAPI 会自动解析依赖关系.

Ref. [Sub-dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/sub-dependencies/)

## ORM 数据库操作

### ORM 简介

ORM (Object-Relational Mapping, 对象关系映射) 是一种编程技术, 用于在面向对象编程语言和关系型数据库之间建立映射. 它允许开发者通过操作对象的方式与数据库进行交互, 而无需直接编写复杂的 SQL 语句.

**优势**:

- 减少重复的 SQL 代码
- 代码更简洁易读
- 自动处理数据库连接和事务
- 自动防止 SQL 注入攻击

### Python ORM 工具对比

| 排名 | ORM 工具       | 特点                     | 适用场景                   |
| ---- | -------------- | ------------------------ | -------------------------- |
| 1    | SQLAlchemy ORM | 功能最强、最灵活、企业级 | 各类 API、微服务、数据应用 |
| 2    | Django ORM     | 封装好、上手快           | Django 项目、管理后台      |
| 3    | Tortoise ORM   | 全异步                   | 异步 Web 服务、高并发 API  |

本文主要介绍 **SQLAlchemy ORM**, 它是 Python 中最流行的 ORM 工具.

Ref. [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

### 安装依赖

```bash
# 安装 SQLAlchemy (支持异步)
pip install "sqlalchemy[asyncio]"

# 安装 MySQL 异步驱动
pip install aiomysql

# 或安装 PostgreSQL 异步驱动
pip install asyncpg
```

### ORM 使用流程

{% mermaid %}
flowchart TD
A[1. 安装依赖] --> B[2. 建库建表]
B --> C[3. 操作数据]
C --> D[查询 select]
C --> E[新增 add]
C --> F[更新 update]
C --> G[删除 delete]
{% endmermaid %}

Ref. [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

### 创建数据库引擎

使用 `create_async_engine` 创建异步引擎:

```python
from sqlalchemy.ext.asyncio import create_async_engine

# 1. 创建异步引擎
ASYNC_DATABASE_URL = "mysql+aiomysql://root:123456@localhost:3306/fastapi_test?charset=utf8"

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,       # 可选: 输出 SQL 日志
    pool_size=10,    # 设置连接池中保持的持久连接数
    max_overflow=20  # 设置连接池允许创建的额外连接数
)
```

**参数说明**:

- `echo=True`: 输出所有执行的 SQL 语句, 开发调试时很有用
- `pool_size`: 连接池活跃的连接数
- `max_overflow`: 允许额外的连接数 (超出 pool_size)

{% note success %}
**异步驱动连接字符串格式**:

- MySQL: `mysql+aiomysql://用户名:密码@主机:端口/数据库`
- PostgreSQL: `postgresql+asyncpg://用户名:密码@主机:端口/数据库`
  {% endnote %}

Ref. [Engine Configuration](https://docs.sqlalchemy.org/en/20/core/engines.html)

### 定义模型类

**步骤一: 定义基类**

```python
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# 基类: 包含通用属性和字段的映射
class Base(DeclarativeBase):
    create_time: Mapped[datetime] = mapped_column(
        DateTime,
        insert_default=func.now(),
        default=func.now,
        comment="创建时间"
    )
    update_time: Mapped[datetime] = mapped_column(
        DateTime,
        insert_default=func.now(),
        default=func.now,
        onupdate=func.now(),
        comment="修改时间"
    )
```

**步骤二: 定义表模型类**

```python
from sqlalchemy import String, Float


class Book(Base):
    __tablename__ = "book"

    id: Mapped[int] = mapped_column(primary_key=True, comment="书籍id")
    bookname: Mapped[str] = mapped_column(String(255), comment="书名")
    author: Mapped[str] = mapped_column(String(255), comment="作者")
    price: Mapped[float] = mapped_column(Float, comment="价格")
    publisher: Mapped[str] = mapped_column(String(255), comment="出版社")
```

e.g. 以上代码定义了一个 `Book` 模型类, 对应数据库中的 `book` 表.

Ref. [SQLAlchemy ORM Models](https://docs.sqlalchemy.org/en/20/orm/mapping_api.html)

### 创建数据库表

定义函数建表, 在 FastAPI 启动时调用:

```python
from fastapi import FastAPI

app = FastAPI()


# 3. 建表: 定义函数建表 → FastAPI 启动的时候调用建表的函数
async def create_tables():
    # 获取异步引擎, 创建事务 - 建表
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("startup")
async def startup_event():
    await create_tables()


@app.get("/")
async def root():
    return {"message": "Hello World"}
```

e.g. 当 FastAPI 应用启动时, 会自动创建所有定义的表.

{% note warning %}
**P.S.** `@app.on_event("startup")` 在最新版本中已不推荐使用, 推荐使用 `lifespan` 事件处理器.
{% endnote %}

Ref. [SQLAlchemy Metadata](https://docs.sqlalchemy.org/en/20/core/metadata.html)

### 在路由中使用 ORM

**核心思路**: 创建依赖项, 使用 `Depends` 注入数据库会话到处理函数.

**步骤一: 创建数据库会话依赖项**

```python
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

# 创建异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,       # 绑定数据库引擎
    class_=AsyncSession,     # 指定会话类
    expire_on_commit=False   # 提交后会话不过期, 不会重新查询数据库
)


# 依赖项, 用于获取数据库会话
async def get_database():
    async with AsyncSessionLocal() as session:
        try:
            yield session  # 返回数据库会话给路由处理函数
            await session.commit()  # 无异常, 提交事务
        except Exception:
            await session.rollback()  # 有异常则回滚
            raise
        finally:
            await session.close()  # 关闭会话
```

**步骤二: 在路由中注入依赖**

```python
from fastapi import Depends
from sqlalchemy import select

@app.get("/book/books")
async def get_book_list(db: AsyncSession = Depends(get_database)):
    # 查询所有书籍
    result = await db.execute(select(Book))
    books = result.scalars().all()
    return books
```

e.g. 使用 `Depends(get_database)` 注入数据库会话, 无需手动管理会话的创建和关闭.

Ref. [FastAPI Database Sessions](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/)

## 数据库操作 - 查询

### 基础查询

**查询所有数据**

```python
from sqlalchemy import select

@app.get("/book/get_books")
async def get_book_list(db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(Book))
    books = result.scalars().all()
    return books
```

**查询单条数据**

```python
@app.get("/book/get_book")
async def get_book(db: AsyncSession = Depends(get_database)):
    # 方式一: 使用 first()
    result = await db.execute(select(Book))
    book = result.scalars().first()

    # 方式二: 使用 get() (根据主键查询)
    book = await db.get(Book, 1)
    return book
```

### 从 ORM 对象获取数据的方式

| 方法                   | 说明                      | 返回值          |
| ---------------------- | ------------------------- | --------------- |
| `scalars().all()`      | 获取所有数据              | 列表            |
| `scalars().first()`    | 提取第一个数据            | 单个对象或 None |
| `scalar_one_or_none()` | 提取一个或 None           | 单个对象或 None |
| `scalar()`             | 提取标量值 (配合聚合查询) | 单个值          |
| `get(模型类, 主键值)`  | 根据主键查询              | 单个对象或 None |

Ref. [SQLAlchemy Queries](https://docs.sqlalchemy.org/en/20/orm/queryguide.html)

### 条件查询

使用 `where()` 子句添加查询条件:

```python
@app.get("/book/{book_id}")
async def get_book(book_id: int, db: AsyncSession = Depends(get_database)):
    result = await db.execute(
        select(Book).where(Book.id == book_id)
    )
    book = result.scalar_one_or_none()
    return book
```

e.g. 查询 ID 等于 `book_id` 的书籍.

#### 比较判断

支持 `==`, `>`, `<`, `>=`, `<=` 等比较运算符:

```python
# 查询价格大于 100 的书籍
result = await db.execute(
    select(Book).where(Book.price > 100)
)
```

#### 模糊查询

使用 `like()` 进行模糊查询:

```python
@app.get("/book/get_books")
async def get_book_list(db: AsyncSession = Depends(get_database)):
    # %: 零个、一个或多个字符
    # _: 一个单个字符
    result = await db.execute(
        select(Book).where(Book.author.like("曹%"))
    )
    books = result.scalars().all()
    return books
```

e.g. 查询作者姓"曹"的书籍.

#### 与非查询

使用 `&` (与)、`|` (或)、`~` (非) 进行逻辑运算:

```python
@app.get("/book/get_books")
async def get_book_list(db: AsyncSession = Depends(get_database)):
    result = await db.execute(
        select(Book).where(
            (Book.author == "曹雪芹") & (Book.price == 200)
        )
    )
    books = result.scalars().all()
    return books
```

e.g. 查询作者为"曹雪芹" 且价格为 200 的书籍.

#### 包含查询

使用 `in_()` 进行包含查询:

```python
@app.get("/book/get_books")
async def get_book_list(db: AsyncSession = Depends(get_database)):
    id_list = [1, 2, 3, 4, 5, 6]
    result = await db.execute(
        select(Book).where(Book.id.in_(id_list))
    )
    books = result.scalars().all()
    return books
```

e.g. 查询 ID 在列表中的书籍.

Ref. [SQLAlchemy WHERE Clause](https://docs.sqlalchemy.org/en/20/orm/queryguide/query.html#where-clause)

### 聚合查询

使用 `func` 进行聚合计算:

```python
from sqlalchemy import func

@app.get("/book/count")
async def get_count(db: AsyncSession = Depends(get_database)):
    # 统计行数量
    result = await db.execute(select(func.count(Book.id)))
    count = result.scalar()

    # 求平均值
    result = await db.execute(select(func.avg(Book.price)))
    avg_price = result.scalar()

    # 求最大值
    result = await db.execute(select(func.max(Book.price)))
    max_price = result.scalar()

    # 求最小值
    result = await db.execute(select(func.min(Book.price)))
    min_price = result.scalar()

    # 求和
    result = await db.execute(select(func.sum(Book.price)))
    total_price = result.scalar()

    return {
        "count": count,
        "avg_price": avg_price,
        "max_price": max_price,
        "min_price": min_price,
        "total_price": total_price
    }
```

**聚合函数说明**:

- `count()`: 统计行数量
- `avg()`: 求平均值
- `max()`: 求最大值
- `min()`: 求最小值
- `sum()`: 求和

Ref. [SQLAlchemy Functions](https://docs.sqlalchemy.org/en/20/core/functions.html)

### 分页查询

使用 `offset()` 和 `limit()` 实现分页:

```python
@app.get("/book/get_books")
async def get_book_list(
    page: int = Query(1, ge=1, description="当前页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    db: AsyncSession = Depends(get_database)
):
    # 计算跳过的记录数
    skip = (page - 1) * page_size

    # 执行分页查询
    stmt = select(Book).offset(skip).limit(page_size)
    result = await db.execute(stmt)
    books = result.scalars().all()

    return {
        "page": page,
        "page_size": page_size,
        "books": books
    }
```

**分页计算公式**:

| 当前页码 | 每页数量 (limit) | 跳过数量 (offset) |
| -------- | ---------------- | ----------------- |
| 1        | 10               | 0                 |
| 2        | 10               | 10                |
| 3        | 10               | 20                |
| 4        | 10               | 30                |

`offset = (当前页码 - 1) * 每页数量`

Ref. [SQLAlchemy LIMIT/OFFSET](https://docs.sqlalchemy.org/en/20/orm/queryguide/select.html#slice-and-limits)

## 数据库操作 - 新增

**核心步骤**: 定义 ORM 对象 → 添加对象到事务 (`add()`) → `commit()` 提交到数据库

```python
from pydantic import BaseModel

class BookBase(BaseModel):
    bookname: str
    author: str
    price: float
    publisher: str


@app.post("/book/add_book")
async def add_book(book: BookBase, db: AsyncSession = Depends(get_database)):
    # 1. 创建 ORM 对象
    book_obj = Book(**book.__dict__)

    # 2. 添加到会话
    db.add(book_obj)

    # 3. 提交到数据库
    await db.commit()

    return {"message": "书籍添加成功", "book": book}
```

e.g. 接收客户端传来的 JSON 数据, 创建 ORM 对象并保存到数据库.

Ref. [SQLAlchemy INSERT](https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html#orm-insert-bulk)

## 数据库操作 - 更新

**核心步骤**: 查询 (`get`) → 属性重新赋值 → `commit()` 提交到数据库

```python
from fastapi import HTTPException

class BookUpdate(BaseModel):
    bookname: str | None = None
    author: str | None = None
    price: float | None = None
    publisher: str | None = None


@app.put("/book/update_book/{book_id}")
async def update_book(
    book_id: int,
    data: BookUpdate,
    db: AsyncSession = Depends(get_database)
):
    # 1. 查询
    book = await db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="书籍不存在")

    # 2. 修改属性 (重新赋值)
    if data.bookname is not None:
        book.bookname = data.bookname
    if data.author is not None:
        book.author = data.author
    if data.price is not None:
        book.price = data.price
    if data.publisher is not None:
        book.publisher = data.publisher

    # 3. 提交
    await db.commit()

    return {"message": "书籍更新成功", "book": book}
```

e.g. 根据 `book_id` 查询书籍, 更新指定字段并提交.

Ref. [SQLAlchemy UPDATE](https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html#orm-update-update-statements)

## 数据库操作 - 删除

**核心步骤**: 查询 (`get`) → `delete()` 删除 → `commit()` 提交到数据库

```python
@app.delete("/book/delete_book/{book_id}")
async def delete_book(book_id: int, db: AsyncSession = Depends(get_database)):
    # 1. 查询
    db_book = await db.get(Book, book_id)
    if db_book is None:
        raise HTTPException(status_code=404, detail="书籍不存在")

    # 2. 删除
    await db.delete(db_book)

    # 3. 提交
    await db.commit()

    return {"message": "书籍删除成功"}
```

e.g. 根据 `book_id` 查询书籍并删除.

Ref. [SQLAlchemy DELETE](https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html#orm-delete-delete-statements)

## ORM 操作总结

### 查询总结

{% mermaid %}
flowchart TD
A["select 查询"] --> B["基础查询"]
A --> C["条件查询 where"]
A --> D["聚合查询 func"]
A --> E["分页查询 offset/limit"]
C --> C1["比较判断 == > <"]
C --> C2["模糊查询 like"]
C --> C3["与非查询 & | ~"]
C --> C4["包含查询 in_"]
D --> D1["count 统计"]
D --> D2["avg 平均值"]
D --> D3["max 最大值"]
D --> D4["min 最小值"]
D --> D5["sum 求和"]
{% endmermaid %}

### CRUD 操作对照表

| 操作 | 关键字     | 核心步骤                          |
| ---- | ---------- | --------------------------------- |
| 查询 | `select()` | `execute()` → 获取结果            |
| 新增 | `add()`    | 创建对象 → `add()` → `commit()`   |
| 更新 | 重新赋值   | `get()` → 赋值 → `commit()`       |
| 删除 | `delete()` | `get()` → `delete()` → `commit()` |

## 最佳实践

### 中间件最佳实践

{% folding green, ✅ 中间件使用建议 %}

1. **顺序控制**: 将最常用的中间件放在前面, 减少不必要的处理
2. **性能优化**: 在中间件中避免执行耗时操作, 如数据库查询
3. **错误处理**: 确保中间件正确处理异常, 避免影响其他中间件
4. **日志记录**: 使用结构化日志, 方便后续分析

```python
import time
import logging
from fastapi import FastAPI, Request

logger = logging.getLogger(__name__)

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()

    # 记录请求信息
    logger.info(f"Request: {request.method} {request.url}")

    response = await call_next(request)

    # 记录响应信息
    process_time = time.time() - start_time
    logger.info(
        f"Response: status={response.status_code} "
        f"process_time={process_time:.3f}s"
    )

    return response
```

{% endfolding %}

### 依赖注入最佳实践

{% folding blue, 🔧 依赖注入建议 %}

1. **复用逻辑**: 将重复的参数提取、验证逻辑抽取为依赖项
2. **类型注解**: 使用类型注解提高代码可读性和 IDE 支持
3. **yield 依赖**: 对于需要清理资源的依赖项, 使用 `yield` 关键字
4. **类依赖**: 复杂逻辑使用类依赖, 提高代码组织性

```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

{% endfolding %}

### ORM 最佳实践

{% folding purple, 🗄️ ORM 使用建议 %}

1. **连接池配置**: 根据应用负载合理配置 `pool_size` 和 `max_overflow`
2. **索引优化**: 为经常查询的字段添加数据库索引
3. **批量操作**: 使用 `add_all()` 和批量更新提高性能
4. **N+1 问题**: 使用 `selectinload()` 和 `joinedload()` 预加载关联数据
5. **事务管理**: 确保事务在 `try-except-finally` 中正确处理

```python
# 批量插入
books = [Book(**data) for data in book_list]
db.add_all(books)
await db.commit()

# 预加载关联数据
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Book).options(selectinload(Book.author))
)
```

{% endfolding %}

Ref. [SQLAlchemy Performance](https://docs.sqlalchemy.org/en/20/orm/persistence_techniques.html)

## 常见问题

{% folding yellow, ❓ 中间件相关问题 %}

### Q1: 中间件和依赖注入有什么区别?

中间件控制**所有**请求, 适合全局处理 (如日志、CORS). 依赖注入控制**特定**路由, 适合业务逻辑 (如权限验证、数据库会话).

Ref. [Advanced Middleware](https://fastapi.tiangolo.com/advanced/middleware/)

{% endfolding %}

{% folding orange, 🤔 ORM 相关问题 %}

### Q2: 如何处理数据库连接池耗尽?

合理配置连接池参数:

```python
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_size=20,      # 增加连接池大小
    max_overflow=40,   # 增加溢出连接数
    pool_recycle=3600, # 连接回收时间 (秒)
    pool_pre_ping=True # 连接前检查可用性
)
```

Ref. [Connection Pooling](https://docs.sqlalchemy.org/en/20/core/pooling.html)

{% endfolding %}

{% folding red, ⚠️ 异步操作注意事项 %}

### Q3: 为什么数据库操作要使用异步?

FastAPI 是异步框架, 使用同步数据库驱动会阻塞事件循环, 导致性能下降. 使用异步驱动 (如 `aiomysql`) 可以充分利用异步优势, 提高并发性能.

```python
# ❌ 错误: 使用同步引擎
from sqlalchemy import create_engine
engine = create_engine("mysql+pymysql://...")

# ✅ 正确: 使用异步引擎
from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine("mysql+aiomysql://...")
```

Ref. [AsyncIO Strategy](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

{% endfolding %}

## 参考资料

{% btn https://fastapi.tiangolo.com/tutorial/dependencies/, FastAPI 依赖注入文档, fa-solid fa-book, blue %}

{% btn https://docs.sqlalchemy.org/en/20/orm/, SQLAlchemy ORM 文档, fa-solid fa-database, purple %}

{% btn https://fastapi.tiangolo.com/tutorial/middleware/, FastAPI 中间件文档, fa-solid fa-layer-group, green %}

{% btn https://docs.sqlalchemy.org/en/20/core/pooling.html, 连接池配置, fa-solid fa-plug, orange %}

{% btn https://docs.sqlalchemy.org/en/20/orm/queryguide/, SQLAlchemy 查询指南, fa-solid fa-magnifying-glass, red %}

{% link FastAPI 中文文档 - 依赖注入, https://fastapi.tiangolo.com/zh/tutorial/dependencies/, https://fastapi.tiangolo.com/img/favicon.png %}

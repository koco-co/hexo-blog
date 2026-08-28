---
title: FastAPI(八)数据库集成与事务
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 以 SQLAlchemy 2 异步会话为例，让请求级资源、CRUD、事务回滚、连接池故障和测试隔离形成一个闭环。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 8
published: true
abbrlink: bbbfc80a
date: 2026-06-25 00:00:00
---
{% course_series %}

{% note primary flat %}
数据库集成的关键不是把 SQL 写进路由，而是决定 Engine、连接池、Session、事务和测试隔离各自的所有权。本文用 SQLAlchemy 异步会话贯穿查询、新增、更新和回滚，并用池耗尽与同步阻塞实验说明“异步函数”并不会自动让数据库调用变成非阻塞。
{% endnote %}

## 集成边界

### FastAPI 与 ORM

{% note info flat %}
FastAPI 负责请求解析、依赖和响应契约，ORM 负责 SQL 表达、会话状态和事务。路由应调用服务层，服务层通过仓储或 Session 完成数据操作；不要把数据库连接对象放进全局可变变量。
{% endnote %}

### 同步与异步驱动

{% note warning flat %}
异步路由只有在底层驱动也提供 `await` 接口时才不会阻塞事件循环。同步 SQLAlchemy 驱动可以在同步路由或专用线程中使用，不能直接在 `async def` 中执行长时间同步查询。
{% endnote %}

| 组合 | 调用方式 | 适用边界 |
| --- | --- | --- |
| async 路由 + async 驱动 | `await session.execute(...)` | 高并发 I/O API |
| sync 路由 + sync 驱动 | 普通 `session.execute(...)` | 传统同步业务 |
| async 路由 + sync 驱动 | 需显式线程隔离 | 迁移过渡，必须测延迟 |

### ORM 选型

{% note info flat %}
ORM 的选择应服从团队的迁移成本、查询复杂度和异步驱动支持，而不是只看 API 语法。本文使用 SQLAlchemy 2 异步 ORM，补齐驱动、模型、查询和关系加载的必要基础；它仍然只服务 FastAPI 的请求边界，不扩张成完整 ORM 手册。
{% endnote %}

| 工具 | 常见优势 | 与 FastAPI 的边界 |
| --- | --- | --- |
| SQLAlchemy 2 | Core/ORM 统一、查询表达力强、异步支持成熟 | Engine/Session 生命周期和事务由应用明确管理 |
| Django ORM | 与 Django 模型、迁移和管理后台紧密集成 | 在 FastAPI 中引入时要单独处理同步/异步边界和启动顺序 |
| Tortoise ORM | 异步优先、模型写法轻量 | 生态和复杂查询能力需按项目版本实测 |

## 会话依赖

### 驱动安装

{% note info flat %}
驱动必须与 SQLAlchemy URL 的方言匹配。SQLite 适合本地和测试，MySQL 与 PostgreSQL 使用各自的异步驱动；生产凭据从 Settings 或环境变量读取，不要把真实连接串写进路由或仓储代码。
{% endnote %}

```bash
python -m pip install "sqlalchemy[asyncio]" aiosqlite
# MySQL：python -m pip install aiomysql
# PostgreSQL：python -m pip install asyncpg
```

### Engine 与连接池

{% mermaid %}
flowchart TD
  A[应用 lifespan] --> B[AsyncEngine]
  B --> C[连接池]
  C --> D[请求 Session]
  D --> E[事务与查询]
  E --> F[请求结束归还连接]
{% endmermaid %}

{% note info flat %}
Engine 和连接池通常是应用级共享资源，Session 是请求级状态。把 Engine 放进 lifespan 或模块级工厂，把 Session 用依赖按请求创建并关闭，避免一个 Session 被并发请求复用。
{% endnote %}

```python
import os

from sqlalchemy.ext.asyncio import create_async_engine


DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
)
```

| 数据库 | 异步 URL 形状 | 连接池提醒 |
| --- | --- | --- |
| SQLite | `sqlite+aiosqlite:///./data/app.db` | 本地文件连接池行为不同，通常不设置网络数据库的 `pool_size`/`max_overflow` |
| MySQL | `mysql+aiomysql://user:password@host:3306/app` | 根据数据库最大连接数和实例数共同设定池大小 |
| PostgreSQL | `postgresql+asyncpg://user:password@host:5432/app` | 观察等待时间、checked-out 数和数据库端连接上限 |

{% note warning flat %}
`pool_size`、`max_overflow` 和 `pool_recycle` 是网络数据库的示例参数，不能不加判断地复制到 SQLite。连接池调优必须结合数据库上限、应用进程数和压测结果；连接串中的用户名和密码只是格式占位符，真实值应由环境配置注入。
{% endnote %}

### 模型与建表

```python
from sqlalchemy import String
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Book(Base):
    __tablename__ = "book"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    price: Mapped[float] = mapped_column(nullable=False)


async def create_tables(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

{% note info flat %}
`DeclarativeBase` 和 `Mapped` 让表结构、Python 类型与迁移工具共享同一模型声明。`create_all()` 适合演示或一次性测试数据库；生产环境应使用版本化迁移，并在应用 lifespan 中创建和关闭 Engine，而不是每个请求都建表。
{% endnote %}

### 请求级 Session

```python
from collections.abc import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine("sqlite+aiosqlite:///./app.db", pool_pre_ping=True)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session
```

{% note info flat %}
路由通过 `Annotated[AsyncSession, Depends(get_session)]` 获取会话，依赖结束时归还连接。Session 不是缓存层，也不是跨请求事务容器。
{% endnote %}

```python
from typing import Annotated
from fastapi import Depends

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@app.post("/tasks", response_model=TaskPublic, status_code=201)
async def create_task_route(payload: TaskCreate, session: SessionDep) -> TaskPublic:
    task = Task(title=payload.title)
    session.add(task)
    await session.flush()
    await session.commit()
    await session.refresh(task)
    return task
```

{% note info flat %}
路由只负责把请求模型和请求级 Session 接到服务层；`Task` 是 SQLAlchemy 声明式模型，`TaskCreate`/`TaskPublic` 是前文的 Pydantic 模型。启动时用迁移工具或 `Base.metadata.create_all()` 创建表，不要在每个请求中重复建表。
{% endnote %}

## 事务边界

### 提交与回滚

{% mermaid %}
sequenceDiagram
  participant H as Handler
  participant S as Session
  participant DB as Database
  H->>S: begin
  H->>S: add and flush
  S->>DB: statements
  alt success
    H->>S: commit
    S-->>H: durable result
  else error
    H->>S: rollback
    S-->>H: original error
  end
{% endmermaid %}

```python
from sqlalchemy import select


async def create_task(session: AsyncSession, title: str) -> Task:
    task = Task(title=title)
    session.add(task)
    await session.flush()  # 拿到数据库生成的 id，但事务还未提交
    await session.commit()
    await session.refresh(task)
    return task
```

{% note info flat %}
更复杂的服务操作可以用 `async with session.begin():` 让异常自动回滚；无论选择哪一种，都要明确 commit 的唯一所有者，避免服务层和路由层各提交一次。
{% endnote %}

### 异常传播

{% note warning flat %}
事务中途抛出异常后，Session 不能继续假设处于干净状态；先 rollback，再把稳定的业务错误映射为 HTTP Problem。捕获异常只为恢复上下文，不要吞掉数据库约束错误或把部分成功返回给客户端。
{% endnote %}

## CRUD 切片

### 查询与新增

```python
from sqlalchemy import select


async def list_tasks(session: AsyncSession, owner_id: str) -> list[Task]:
    result = await session.execute(
        select(Task).where(Task.owner_id == owner_id).order_by(Task.id)
    )
    return list(result.scalars().all())


async def add_task(session: AsyncSession, owner_id: str, title: str) -> Task:
    task = Task(owner_id=owner_id, title=title)
    session.add(task)
    await session.flush()
    return task
```

### 条件与分页

```python
from sqlalchemy import and_, func, or_, select


stmt = select(Book).where(
    and_(Book.title.like(f"{prefix}%"), Book.id.in_(book_ids)),
    or_(Book.price >= minimum, Book.price == 0),
    ~(Book.title == "archived"),
).offset((page - 1) * page_size).limit(page_size)

result = await session.execute(stmt)
books = list(result.scalars().all())
total = await session.scalar(select(func.count(Book.id)))
```

| 结果调用 | 用途 | 约束 |
| --- | --- | --- |
| `await session.get(Book, book_id)` | 按主键读取一个实体 | 找不到时返回 `None` |
| `result.scalars().all()` | 取得 ORM 实体列表 | 避免把 Row 包装层直接返回响应 |
| `result.scalar_one_or_none()` | 读取至多一个标量 | 多于一条时主动失败，暴露唯一性问题 |
| `await session.scalar(select(func.count(Book.id)))` | 聚合统计 | 与分页结果分开计算总数 |

{% note info flat %}
`where` 可以组合 `like`、`in_`、`and_`、`or_` 和 `~`，分页则用稳定排序配合 `offset`/`limit`。总数查询不能把当前页长度当成全集数量；高页码场景还要评估游标分页和索引，而不是只增大 `page_size`。
{% endnote %}

### 关联加载

```python
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload


# 假设 Task.owner 与 Task.project 已在模型中声明 relationship。
stmt = select(Task).options(
    selectinload(Task.owner),
    joinedload(Task.project),
)
tasks = list((await session.execute(stmt)).scalars().unique().all())
```

{% note warning flat %}
列表循环中逐条访问关联对象会形成 N+1 查询。对一对多或集合关系通常优先 `selectinload`，对适合单次 JOIN 的标量关系可考虑 `joinedload`；具体选择要看行数、重复列和查询计划。上例的 `relationship` 名称是占位符，必须换成真实模型字段，并在 SQL 日志中验证查询次数。
{% endnote %}

### 更新与删除

{% note info flat %}
更新先按主键和所有者查询，再修改已加载对象；删除要在提交前确认资源存在和权限。服务层返回领域结果，响应模型负责公开字段，避免把 ORM 内部状态直接交给 JSON 编码器。
{% endnote %}

```python
async def delete_task(session: AsyncSession, owner_id: str, task_id: UUID) -> bool:
    task = await session.get(Task, task_id)
    if task is None or task.owner_id != owner_id:
        return False
    await session.delete(task)
    await session.flush()
    return True
```

## 并发故障

### 池耗尽

{% note warning flat %}
连接池耗尽通常表现为等待超时，而不是立即的 SQL 语法错误。压满连接池时记录池大小、等待时间和请求路径；恢复应减少连接持有时间、关闭 Session、调整池参数并重新压测，而不是无限增加超时。
{% endnote %}

| 症状 | 可能原因 | 证据 | 修复方向 |
| --- | --- | --- | --- |
| 获取连接超时 | Session 未关闭 | 池 checked-out 数持续上升 | `async with` 统一释放 |
| 延迟随并发线性增长 | 单连接长事务 | 事务持续时间和 SQL 日志 | 缩短事务、拆分读写 |
| 偶发断连 | 网络或数据库重启 | `pool_pre_ping` 与数据库日志 | 重试边界、探针与告警 |

### 阻塞调用

{% note danger flat %}
在 `async def` 里调用同步数据库驱动会占住事件循环，连一个慢查询也可能拖慢无关请求。迁移期间要么改用异步驱动，要么显式交给线程并记录延迟；不能只把函数关键字改成 `async`。
{% endnote %}

## 测试隔离

### 事务回滚

```python
async def test_create_rolls_back(session: AsyncSession) -> None:
    await session.begin()
    session.add(Task(title="temporary"))
    await session.flush()
    await session.rollback()
    result = await session.execute(select(Task).where(Task.title == "temporary"))
    assert result.scalar_one_or_none() is None
```

{% note info flat %}
`async with session.begin():` 正常离开时会提交，不能在其后再调用 `rollback()` 期待撤销；上例用显式事务展示测试 fixture 自己拥有回滚权。若被测服务内部已经提交，应改用独立测试库、事务代理 fixture 或每例清理表，先固定事务所有权再断言数据为空。
{% endnote %}

### 测试数据库

{% note info flat %}
测试库应使用独立 URL、独立 schema 或临时数据库，并在每个用例前后清理。真实数据库行为（约束、并发和事务隔离）不能只靠内存字典模拟；模拟适合快速验证路由分支，集成测试再覆盖 SQL 证据。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-engine-session-scope deck:"FastAPI" priority:1 tags:"SQLAlchemy,Session" %}
--- question
Engine、连接池和 Session 应该分别是什么作用域？
--- answer
Engine/连接池通常是应用级共享资源，Session 是请求级事务状态，不能跨请求共享同一个 Session。
--- explanation
Engine 管理连接池和方言配置，应用启动时创建、关闭时释放；Session 绑定一次请求的身份和事务，依赖开始时创建、结束时关闭。共享 Session 会让并发请求互相污染事务和对象状态；重复创建 Engine 则会耗尽连接并失去池化收益。用 lifespan 管 Engine、用 `yield` 依赖管 Session，是可观察且容易测试的分界。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-commit-rollback deck:"FastAPI" priority:1 tags:"事务,回滚" %}
--- question
事务失败时为什么必须 rollback，而不是只返回错误？
--- answer
异常可能留下未完成的事务和脏 Session；rollback 释放数据库状态，保证后续请求看到一致结果。
--- explanation
一个业务操作可能包含多条 SQL。中途失败而不回滚，连接归还池后仍可能持有锁或让 Session 无法继续执行；捕获异常后应先回滚，再映射稳定的 HTTP 错误。复现实验是让第二条写入故意失败，随后查询确认第一条也没有部分提交。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-pool-exhaustion deck:"FastAPI" priority:1 tags:"连接池,并发" %}
--- question
连接池耗尽应从哪些证据定位？
--- answer
同时记录池大小、checked-out 数、获取连接等待时间和请求路径，再检查 Session 是否在异常和取消路径释放。
--- explanation
超时只是症状，可能由连接泄漏、长事务、并发过高或数据库不可用造成。先用小池压测复现，观察 checked-out 是否单调增加；若增加，修复 `async with` 和清理；若稳定但等待高，再评估查询和池参数。无限放大池或超时会把压力推向数据库，不能替代根因修复。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-sync-db-in-async deck:"FastAPI" priority:1 tags:"异步,阻塞" %}
--- question
为什么 `async def` 中的同步数据库调用仍会阻塞？
--- answer
事件循环只会在遇到可等待的异步 I/O 时让出控制权；同步驱动会一直占住当前线程。
--- explanation
把函数声明成 `async` 不会改变同步库的实现。慢查询期间，事件循环无法处理同一进程的其他请求，延迟会同时上升。优先使用匹配的异步驱动；若暂时只能用同步驱动，显式放入线程并限制并发，再用无关健康请求的延迟实验验证没有阻塞主循环。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link SQL Databases, https://fastapi.tiangolo.com/tutorial/sql-databases/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link SQLAlchemy AsyncIO, https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html, https://docs.sqlalchemy.org/_static/favicon.ico %}
{% link Database Testing, https://fastapi.tiangolo.com/how-to/testing-database/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

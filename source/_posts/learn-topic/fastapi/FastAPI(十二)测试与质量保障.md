---
title: FastAPI(十二)测试与质量保障
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 使用 pytest、TestClient 与 HTTPX AsyncClient 测试路由、依赖、生命周期、数据库和实时接口。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 12
published: true
abbrlink: d474d6f1
date: 2026-06-29 00:00:00
---
{% course_series %}

{% note primary flat %}
测试 FastAPI 时，真正需要隔离的是 ASGI 生命周期、依赖图、数据库事务和实时连接，而不只是函数返回值。本文先建立测试金字塔，再分别使用 TestClient、AsyncClient、依赖覆盖和独立测试库，最后把 OpenAPI、错误矩阵和流式接口变成可回归的证据。
{% endnote %}

## 测试边界

### 测试金字塔

{% mermaid %}
flowchart TD
  A[单元测试] --> B[依赖与业务规则]
  B --> C[ASGI 集成测试]
  C --> D[数据库与生命周期]
  D --> E[契约与真实协议]
  E --> F[少量端到端场景]
{% endmermaid %}

{% note info flat %}
单元测试快但看不到路由和中间件；ASGI 测试能验证请求解析、响应和依赖；数据库、WebSocket、SSE 与代理路径需要更高层的集成证据。每层只承担它能观察到的风险，不能用一组 mock 宣称覆盖真实连接。
{% endnote %}

### ASGI 夹具

| 夹具 | 生命周期 | 适合验证 |
| --- | --- | --- |
| `TestClient(app)` | 同步上下文 | 普通 HTTP 与 lifespan |
| `AsyncClient(ASGITransport)` | 异步 fixture | async 数据库和并发请求 |
| 独立测试库 | 每例清理/回滚 | 约束、事务和查询 |
| WebSocket session | 显式连接关闭 | 握手、消息与关闭码 |

## 同步测试

### TestClient

{% note info flat %}
`TestClient` 把 ASGI 应用包装成同步 HTTP 客户端，适合快速验证状态码、JSON、头和错误。它不应被拿来证明真实网络代理或多进程行为。
{% endnote %}

```python
from fastapi.testclient import TestClient


def test_health(app):
    with TestClient(app) as client:
        response = client.get("/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}
```

### 上下文管理

{% note warning flat %}
只有用 `with TestClient(app)` 才会触发 lifespan。客户端离开上下文后，连接池和共享资源应已清理；在上下文外创建全局 client 会让启动/关闭测试失去意义。
{% endnote %}

```python
def test_lifespan_runs_once(app, events):
    assert events == []
    with TestClient(app) as client:
        assert client.get("/live").status_code == 200
        assert events == ["startup"]
    assert events == ["startup", "shutdown"]
```

## 异步测试

### AsyncClient

{% note info flat %}
异步测试使用 `httpx.AsyncClient`，可以在同一个测试中等待异步仓储、并发发请求和读取流。客户端本身也要用异步上下文关闭连接。
{% endnote %}

```python
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.mark.anyio
async def test_async_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/live")
    assert response.status_code == 200
```

### ASGITransport

{% note info flat %}
`ASGITransport` 让 HTTPX 直接调用 ASGI 应用，不经过真实 TCP。它适合应用内部契约；代理头、TLS、真实超时和多 worker 仍需要单独的运行环境测试。
{% endnote %}

### 异步标记

{% note warning flat %}
异步测试必须由当前 pytest 插件提供事件循环/anyio 运行器。标记名称、fixture 作用域和数据库连接方式要统一，否则“测试收集成功但未真正等待协程”会产生假阳性。
{% endnote %}

## 依赖覆盖

### 依赖覆盖

{% note info flat %}
用 `app.dependency_overrides` 替换身份、Settings、外部服务或数据库依赖，测试路由分支而不触碰真实凭证。替代函数的签名应尽量保持可读，避免覆盖一个依赖却悄悄跳过输入校验。
{% endnote %}

```python
def test_admin_route(app):
    app.dependency_overrides[get_current_user] = lambda: {"id": "test", "role": "admin"}
    try:
        with TestClient(app) as client:
            response = client.get("/admin/audit")
        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()
```

### 恢复身份

{% mermaid %}
flowchart LR
  A[设置 override] --> B[执行一个用例]
  B --> C{断言通过或失败}
  C --> D[finally 清空]
  D --> E[下一用例使用真实依赖]
{% endmermaid %}

{% note info flat %}
覆盖字典是可变应用状态，清理动作必须放在 `finally` 或 fixture teardown。测试结束后断言字典为空，可以快速发现身份泄漏和顺序依赖。
{% endnote %}

## 数据库隔离

### 事务回滚

```python
async def test_isolated_write(session):
    await session.begin()
    session.add(Task(title="only-this-test"))
    await session.flush()
    await session.rollback()
    result = await session.execute(select(Task).where(Task.title == "only-this-test"))
    assert result.scalar_one_or_none() is None
```

{% note info flat %}
`async with session.begin():` 正常离开时会提交，不能在其后再调用 `rollback()` 撤销；这个示例明确由测试 fixture 持有事务。若被测服务自行提交，应改用事务代理、独立测试库或清理 SQL，不能用一个无效的回滚断言制造隔离假象。
{% endnote %}

### 测试库

{% note info flat %}
测试库连接串应由 fixture 提供，数据表在会话前建立、用例后清理。SQLite、临时 Postgres 和生产同构数据库的锁与类型行为不同，至少要有一组真实驱动的集成测试。
{% endnote %}

### 并发用例

{% note warning flat %}
乐观锁、唯一约束和池等待必须用并发任务验证，而不是依次调用两次。用同一 revision 发起两个 PATCH，预期一个成功、一个 409，并确认失败事务没有部分提交。
{% endnote %}

## 实时接口

### WebSocket

```python
def test_websocket_echo(app):
    with TestClient(app) as client:
        with client.websocket_connect("/ws") as websocket:
            websocket.send_text("ping")
            assert websocket.receive_json() == {"echo": "ping"}
```

### SSE/JSONL

{% note info flat %}
流式测试要消费到明确的事件、行或结束条件，并在异常/取消后检查生成器清理。只断言响应状态 200 不能证明数据已经发送，更不能证明断线游标正确。
{% endnote %}

```python
@pytest.mark.anyio
async def test_jsonl_stream(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        async with client.stream("GET", "/tasks/stream") as response:
            lines = [line async for line in response.aiter_lines() if line]
    assert lines[0].startswith("{")
```

## 契约回归

### OpenAPI 快照

{% note success flat %}
规范化 `/openapi.json` 后比较路径、方法、Schema、security、requestBody 和 responses。快照 diff 为空才说明没有无意改变客户端契约；有意变更应先更新版本和迁移说明。
{% endnote %}

```python
def test_openapi_contract(app, expected):
    with TestClient(app) as client:
        current = client.get("/openapi.json").json()
    assert normalize_openapi(current) == expected
```

### 错误路径

{% note warning flat %}
至少固定 404、405、422、401、403、409 和 5xx 映射。每个负例只改变一个输入来源，并检查 `loc`、`Allow`、`WWW-Authenticate` 和 Problem 媒体类型，避免只断言状态码。
{% endnote %}

### 覆盖率边界

| 覆盖数字 | 能证明 | 不能证明 |
| --- | --- | --- |
| 行覆盖 | 代码被执行 | 分支和错误语义正确 |
| 分支覆盖 | 条件两侧执行 | 真实数据库/代理行为 |
| 契约测试 | OpenAPI 与响应形状稳定 | 性能和容量 |
| 场景测试 | 业务链路可用 | 所有异常组合 |

## 常见问题

{% flashcard basic id:fastapi-0141-testclient-vs-asyncclient deck:"FastAPI" priority:1 tags:"测试,客户端" %}
--- question
`TestClient` 与 `AsyncClient` 如何选择？
--- answer
同步 HTTP 和 lifespan 快速验证用 TestClient；需要异步数据库、并发或流式消费时用 AsyncClient 加 ASGITransport。
--- explanation
TestClient 把 ASGI 调用包装成同步接口，适合普通路由和上下文管理；AsyncClient 让测试可以 `await` 异步依赖、并发任务和流式迭代。两者都不经过真实网络，代理/TLS/多进程需另测。需要 lifespan 时，TestClient 必须使用 `with`；异步客户端则要配合专门的 lifespan fixture。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-dependency-override-cleanup deck:"FastAPI" priority:1 tags:"依赖覆盖,隔离" %}
--- question
依赖覆盖为什么必须在每个测试后恢复？
--- answer
覆盖字典属于可变应用状态；不清理会让后续测试继续使用假身份、假配置或假数据库。
--- explanation
在测试中设置 `app.dependency_overrides[original] = replacement` 后，任何使用同一 app 的请求都会看到替代依赖。用 `try/finally` 或 fixture teardown 清空，并可断言字典为空。清理不仅防止顺序依赖，也能保证失败测试不会留下安全策略或数据库连接的假状态。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-db-test-isolation deck:"FastAPI" priority:1 tags:"数据库,测试隔离" %}
--- question
数据库测试如何证明每个用例没有相互污染？
--- answer
使用独立测试库或事务 fixture，在用例结束回滚/清理，并用下一次查询确认临时记录不存在。
--- explanation
只重置 Python 对象不能覆盖数据库约束、锁和事务。让用例写入唯一标记，结束时回滚，再在独立查询中断言记录不存在；并发场景还要验证两个事务的冲突状态码和最终行数。测试库的驱动与生产差异也要在集成层保留一组真实验证。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Testing, https://fastapi.tiangolo.com/tutorial/testing/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Testing Events, https://fastapi.tiangolo.com/advanced/testing-events/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Async Tests, https://fastapi.tiangolo.com/advanced/async-tests/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

---
title: FastAPI(十五)项目实战
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 综合实现带认证、权限、MySQL 事务、后台任务、SSE、测试和容器部署的任务管理 API。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 15
published: true
abbrlink: dfdedcc6
date: 2026-07-02 00:00:00
---
{% course_series %}

{% note primary flat %}
本篇把前面的能力收束成一个“任务 API”：账号注册与登录、任务 CRUD、管理员审计、SSE 进度和容器交付。每个功能都绑定状态码、公开字段和失败证据；最终验收不看截图数量，而看功能、质量和运行三层证据能否互相解释。
{% endnote %}

## 需求与架构

### 验收场景

{% note info flat %}
先把需求写成 Given/When/Then，再决定路由和模型。这样“登录成功”不仅是拿到 token，还必须包含 200、Bearer 方案和不泄露密码；“更新任务”也必须包含 revision 冲突和回滚证据。
{% endnote %}

| Given | When | Then |
| --- | --- | --- |
| 有效账号 | POST `/auth/token` | 200，返回短期 bearer token |
| 有效 token | POST `/tasks` | 201，响应只有公开字段 |
| 相同 revision | 两次 PATCH 同一任务 | 一个 200，一个 409 |
| 管理员 token | GET `/admin/audit` | 200，返回审计列表 |
| 普通用户 token | GET `/admin/audit` | 403，不返回审计数据 |
| 任务正在处理 | GET `/tasks/{id}/events` | SSE 按 ID 推送进度 |

### 系统边界

{% mermaid %}
flowchart TD
  A[客户端] --> B[API 路由]
  B --> C[认证与授权依赖]
  B --> D[任务服务]
  D --> E[数据库事务]
  D --> F[后台审计]
  D --> G[SSE 进度]
  A --> H[反向代理 /api]
  H --> B
{% endmermaid %}

{% note info flat %}
边界内包含 API、身份、数据库、后台审计、SSE 和代理前缀；不包含完整前端、分布式队列实现和云厂商部署脚本。超出边界的能力应通过稳定接口接入，而不是把外部系统的状态偷偷写入路由全局变量。
{% endnote %}

## 项目骨架

### 模块

{% note info flat %}
把入口、路由、schema、服务、仓储和基础设施分开，但保持导入方向单一。每个模块都能被独立导入，先让导入测试通过，再接入数据库和认证。
{% endnote %}

```text
app/
  main.py              # FastAPI 实例与 lifespan
  api/routes.py        # HTTP 与 WebSocket 路由
  api/dependencies.py  # 身份、Session、Settings
  schemas.py           # TaskCreate / TaskPatch / TaskPublic
  services/tasks.py    # 事务和业务规则
  infra/db.py          # Engine、Session、模型
  infra/security.py    # 密码哈希与 JWT
tests/
```

### 配置

{% note warning flat %}
Settings 只从环境变量或 Secret 读取 `database_url`、JWT 密钥、代理前缀和允许来源；测试用替代依赖注入。启动日志可以显示“已配置/缺失”，不能显示密钥值或完整连接串。
{% endnote %}

### 生命周期

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.engine = create_engine_from_settings()
    await app.state.engine.connect()
    try:
        yield
    finally:
        await app.state.engine.dispose()


app = FastAPI(lifespan=lifespan)
```

{% note success flat %}
资源初始化失败时应用不能进入 ready；关闭时要释放连接池和后台消费者。把“进程活着”和“依赖可用”留给 `/live` 与 `/ready` 两个探针表达。
{% endnote %}

## 用户与权限

### 注册登录

{% mermaid %}
sequenceDiagram
  participant C as Client
  participant A as API
  participant DB as Database
  C->>A: POST /accounts {email,password}
  A->>DB: store password hash
  A-->>C: 201 AccountPublic
  C->>A: POST /auth/token form
  A->>DB: verify hash
  A-->>C: 200 access_token
  C->>A: Authorization Bearer token
  A-->>C: protected result
{% endmermaid %}

```python
@app.post("/accounts", response_model=AccountPublic, status_code=201)
async def register(payload: AccountCreate, session: SessionDep) -> AccountPublic:
    account = await create_account(session, payload.email, hash_password(payload.password))
    return account


@app.post("/auth/token")
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], session: SessionDep):
    account = await authenticate(session, form.username, form.password)
    if account is None:
        raise HTTPException(status_code=401, detail="invalid credentials", headers={"WWW-Authenticate": "Bearer"})
    return {"access_token": issue_token(str(account.id)), "token_type": "bearer"}
```

### 角色授权

| 角色 | `GET /tasks` | `GET /admin/audit` | 资源规则 |
| --- | --- | --- | --- |
| user | 允许 | 403 | 只能读写自己的任务 |
| admin | 允许 | 200 | 可审计，仍记录主体 |

{% note warning flat %}
先认证再授权：缺少或无效 token 返回 401 并带 `WWW-Authenticate`，主体已识别但缺少角色/scope 返回 403。普通任务路由不能因为管理员检查存在就全部拒绝普通用户。
{% endnote %}

## 任务事务

### 请求来源

| 来源 | 示例 | 失败状态 |
| --- | --- | --- |
| Authorization | `Bearer <token>` | 401 |
| Path | `/tasks/{task_id}` | 422 |
| Query | `?limit=20` | 422 |
| Body | `TaskCreate.title` | 422 |

### CRUD

{% note info flat %}
围绕同一个 `task_id` 依次验证 POST 201、GET 200、PATCH 200、DELETE 204 和删除后的 GET 404。每次操作都经过所有者依赖和响应模型，避免“数据库返回成功但越权读取或泄露内部字段”。
{% endnote %}

```python
@app.patch("/tasks/{task_id}", response_model=TaskPublic)
async def patch_task(
    task_id: UUID,
    payload: TaskPatch,
    session: SessionDep,
    current: CurrentAccount,
) -> TaskPublic:
    task = await update_with_revision(session, task_id, current.id, payload)
    if task is None:
        raise HTTPException(status_code=409, detail="revision conflict")
    return task
```

### 响应契约

{% note danger flat %}
仓储层可以返回 `owner_secret="never-leak"` 作为反向测试夹具，但 `TaskPublic`、响应 JSON、日志快照和 OpenAPI Schema 都不能出现它。公开模型是安全边界，前端隐藏字段不是边界。
{% endnote %}

### 并发更新

{% note warning flat %}
`revision` 是乐观锁条件：更新语句同时匹配 `task_id` 和旧 revision，成功后递增；影响行数为零时返回 409。两个请求使用同一 revision，应稳定得到一个 200 和一个 409，失败事务不能留下部分字段。
{% endnote %}

### 回滚

{% mermaid %}
sequenceDiagram
  participant H as Handler
  participant S as Session
  participant DB as Database
  H->>S: begin
  H->>DB: update task
  H->>DB: write audit
  alt second write succeeds
    H->>S: commit
    S-->>H: 200
  else second write fails
    H->>S: rollback
    S-->>H: Problem 409/500
  end
{% endmermaid %}

{% note info flat %}
故意让审计写入失败，再查询任务和审计表；两者都应回到事务前状态。只有把 commit 的所有权固定在服务层，才能证明“响应错误”没有隐藏部分提交。
{% endnote %}

## 后台与推送

### 审计任务

{% note info flat %}
响应后写一条短审计记录可以使用 `BackgroundTasks`，但任务函数必须幂等、短小且不依赖已经关闭的请求 Session。需要持久重试或跨进程执行时，先写任务状态，再交给队列。
{% endnote %}

### SSE 进度

```python
from collections.abc import AsyncIterable
from fastapi.sse import EventSourceResponse, ServerSentEvent


@app.get("/tasks/{task_id}/events", response_class=EventSourceResponse)
async def task_events(task_id: UUID) -> AsyncIterable[ServerSentEvent]:
    for revision, status in await replay_progress(task_id):
        yield ServerSentEvent(
            data={"task_id": str(task_id), "status": status},
            event="progress",
            id=str(revision),
            retry=5000,
        )
```

{% note info flat %}
`Last-Event-ID` 决定重放起点；事件存储没有该 revision 时，应返回快照重置，而不是重复发送或假装无损续传。生成器在 `finally` 中释放订阅和 Session。
{% endnote %}

## 测试门禁

### 认证

```python
def test_auth_matrix(client):
    response = client.post("/auth/token", data={"username": "learner@example.com", "password": "wrong"})
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
```

### 事务

{% note info flat %}
成功提交、故意异常和外部回滚分别断言最终行数为 1、0、0。数据库查询要在独立 Session 中完成，避免当前 Session 的 identity map 把未提交对象伪装成持久数据。
{% endnote %}

### 404/405/422

```python
def test_error_matrix(client, token, task_id):
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/tasks/00000000-0000-0000-0000-000000000000", headers=headers).status_code == 404
    method_not_allowed = client.post(f"/tasks/{task_id}", headers=headers)
    assert method_not_allowed.status_code == 405
    assert "Allow" in method_not_allowed.headers
    invalid = client.post("/tasks", headers=headers, json={"title": ""})
    assert invalid.status_code == 422
    assert invalid.json()["detail"][0]["loc"] == ["body", "title"]
```

### 敏感字段过滤

{% note danger flat %}
对响应 JSON、结构化日志和 `/openapi.json` 递归搜索 `owner_secret` 与 `never-leak`，三处都必须是零。若只检查前端显示，日志或 Schema 仍可能泄露字段。
{% endnote %}

### OpenAPI 快照

```python
def test_openapi_snapshot(client, snapshot):
    current = normalize_openapi(client.get("/openapi.json").json())
    assert current == snapshot
```

{% note info flat %}
快照固定 6 组路径、9 个业务操作、11 个模型和 1 个安全方案；新增字段、required 或 security 都应产生可读 diff，而不是静默覆盖快照。
{% endnote %}

### 流式

{% note info flat %}
流式测试读取初始、续传和断开三段：检查 revision 单调、`Last-Event-ID` 起点正确、生成器清理执行。只断言 200 不能证明事件已发送，更不能证明重连不会重复。
{% endnote %}

## 容器交付

### 镜像

```dockerfile
FROM python:3.12-slim
WORKDIR /code
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir uv && uv sync --frozen --no-dev
COPY app ./app
RUN useradd --create-home appuser
USER appuser
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 代理

{% note info flat %}
代理对外暴露 `/api`，应用内部仍声明 `/tasks`；代理去掉前缀转发并设置 `root_path=/api`。烟测访问 `/api/docs` 和 `/api/tasks`，确认没有 `/api/api` 重复路径。
{% endnote %}

### 健康检查

```python
@app.get("/live", include_in_schema=False)
async def live() -> dict[str, str]:
    return {"status": "alive"}


@app.get("/ready", include_in_schema=False)
async def ready(session: SessionDep) -> dict[str, str]:
    await session.execute(text("select 1"))
    return {"status": "ready"}
```

{% note info flat %}
`/live` 在依赖故障时仍可返回 200，`/ready` 应返回 503 并让代理摘除实例；SIGTERM 后要关闭连接池和审计资源。
{% endnote %}

## 故障演练

### 池耗尽

| 注入 | 观察 | 恢复 |
| --- | --- | --- |
| 压满连接池 | 获取连接 timeout、checked-out 上升 | 释放 Session、缩短事务、重测 |
| 事件循环阻塞 | 无关 `/live` 延迟上升 | 改用异步库或线程/进程隔离 |
| 错误前缀/头 | 502 或生成 URL 错误 | 修正代理与 root_path，再烟测 |

### 阻塞

{% note warning flat %}
注入同步 `time.sleep` 或同步数据库调用，再同时请求慢端点和 `/live`；如果健康请求也延迟，说明事件循环被占用。修复后慢端点可以仍然慢，但无关请求应能在等待期间完成。
{% endnote %}

### 代理错误

```text
502：代理无法连接或上游立即关闭，先看 worker 启动/崩溃日志。
504：代理等待超时，比较代理、应用、数据库三层耗时。
重复前缀：检查外部 URL、转发路径、root_path 和 OpenAPI servers。
```

## 验收复盘

### 功能证据

- 收集注册、登录、任务 CRUD 和 `/admin/audit` 的状态码与公开字段。
- 记录 user/admin 权限矩阵，确认共有任务能力没有被误拒绝。
- 读取 SSE 初始与续传事件，保存最后一个 ID。

### 质量证据

{% note success flat %}
质量门禁要求 Problem 错误字段零偏差、OpenAPI 规范化 diff 为空、事务隔离和敏感字段递归搜索通过。覆盖率数字只作为线索，不能替代这些行为证据。
{% endnote %}

### 运行证据

- 保存镜像 UID、代理 `/api` 路径、`/live`/`/ready` 响应和 SIGTERM 清理日志。
- 记录连接池耗尽、事件循环阻塞和代理前缀错误三类故障的症状、修复与复验。
- 交付前删除临时凭证，确认日志和快照没有秘密。

## 常见问题

{% flashcard basic id:fastapi-0141-project-transaction-failure deck:"FastAPI" priority:1 tags:"项目实战,事务" %}
--- question
项目事务中途失败时如何证明没有部分提交？
--- answer
让第二个写入故意失败，在独立 Session 查询任务和审计记录，确认两者都回到事务前状态。
--- explanation
一个任务更新可能同时写任务表和审计表。若只检查 HTTP 错误，第一条 SQL 仍可能已经提交；应固定 commit 所有者，在异常路径 rollback，再用独立连接查询最终行数和字段。成功、故意异常和外部回滚分别得到 1、0、0，才能证明事务边界有效。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-project-background-or-queue deck:"FastAPI" priority:1 tags:"项目实战,后台" %}
--- question
项目任务应使用 `BackgroundTasks` 还是持久队列？
--- answer
短小、同进程且失败可记录的审计写入用 `BackgroundTasks`；需要重试、跨进程或长时间运行的任务用持久队列。
--- explanation
BackgroundTasks 在响应后由当前进程执行，崩溃或重启会丢失任务，不能承诺可靠投递。持久队列保存任务状态并负责重试，API 只返回任务 ID。两种方案都要设计幂等键、状态机和关闭行为，不能把“响应已返回”当作业务副作用一定成功。
{% endflashcard %}

{% flashcard_ref id="fastapi-0141-root-path" %}

{% flashcard_ref id="fastapi-0141-sse-vs-websocket" %}

## 参考资料

{% linkgroup %}
{% link FastAPI Tutorial, https://fastapi.tiangolo.com/tutorial/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Docker Deployment, https://fastapi.tiangolo.com/deployment/docker/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Server-Sent Events, https://fastapi.tiangolo.com/tutorial/server-sent-events/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

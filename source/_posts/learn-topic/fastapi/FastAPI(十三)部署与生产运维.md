---
title: FastAPI(十三)部署与生产运维
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 理解 ASGI 进程拓扑、worker、容器、HTTPS、反向代理、路径前缀、健康检查和优雅关闭。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 13
published: true
abbrlink: a584b159
date: 2026-08-26 00:00:00
---
{% course_series %}

{% note primary flat %}
生产部署不是把开发命令换成 Docker 就结束，而是把代理、进程、容器、配置、探针和关闭顺序连成一条可恢复的运行拓扑。本文从单进程和多进程的边界开始，逐步加入非 root 镜像、HTTPS 终止、路径前缀、密钥注入和故障定位证据。
{% endnote %}

## 运行拓扑

### 单进程

{% note info flat %}
单进程适合本地或低流量服务，状态和连接池都在一个进程内。它容易调试，但一个阻塞调用或未捕获崩溃会影响全部请求，不能用“平均延迟正常”掩盖尾延迟风险。
{% endnote %}

### 多进程

{% note info flat %}
多 worker 可以利用多核并隔离单进程故障，但每个进程都有自己的内存、连接池和后台任务。共享状态要放在外部存储，连接池上限要按“每个 worker”计算。
{% endnote %}

### 外部依赖

{% mermaid %}
flowchart TD
  A[客户端] --> B[HTTPS 代理]
  B --> C[FastAPI worker]
  C --> D[数据库池]
  C --> E[队列/对象存储]
  B --> F[健康探针]
{% endmermaid %}

{% note info flat %}
每条边都有超时、重试和信任边界。代理只负责转发不代表它能修复应用异常；数据库连接池、队列和对象存储的容量需要分别监控。
{% endnote %}

## 进程模型

### Uvicorn

{% note info flat %}
`uvicorn module:app` 适合明确 ASGI 入口的手工启动。生产命令应把日志格式、代理头信任、监听地址和关闭超时写成可审查配置，不依赖开发自动重载。
{% endnote %}

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### worker

{% note warning flat %}
每个 worker 都会运行 lifespan、创建连接池并可能启动后台调度器。不要在每个 worker 内启动只能有一份的定时任务；需要单例工作的任务应交给独立 worker 或队列。
{% endnote %}

```bash
uvicorn app.main:app --workers 2
```

### 扩缩容

{% note info flat %}
扩容增加并行处理能力，也会增加数据库连接、内存和下游压力。先用 p95/p99、池等待和错误率找瓶颈，再决定 worker 数和副本数；不要用 CPU 百分比单独决定扩容。
{% endnote %}

## 容器构建

### 镜像层

{% note info flat %}
先复制锁文件安装依赖，再复制源码，可以复用稳定层；运行镜像只保留必要文件和非开发依赖。构建上下文不应包含凭据、日志或本地数据库。
{% endnote %}

### 启动命令

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

### 非 root 用户

{% note danger flat %}
容器进程应以非 root 用户运行，写入目录和临时目录明确授权。非 root 不能替代依赖扫描、只读文件系统和网络策略，但可以降低应用被利用后的主机权限。
{% endnote %}

## HTTPS 与代理

### 终止代理

{% mermaid %}
sequenceDiagram
  participant C as Client
  participant P as TLS Proxy
  participant A as App
  C->>P: HTTPS /api/tasks
  P->>A: HTTP + forwarded scheme/host
  A-->>P: response and generated URLs
  P-->>C: HTTPS response
{% endmermaid %}

### 代理头

{% note warning flat %}
`X-Forwarded-Proto`、`X-Forwarded-Host` 和 `X-Forwarded-For` 只有来自可信代理时才可采用。Uvicorn 的代理头选项若对公网任意请求开放，攻击者可以伪造 scheme、Host 或客户端地址。
{% endnote %}

### 可信来源

| 头信息 | 影响 | 复现证据 |
| --- | --- | --- |
| proto | 重定向与绝对 URL | 代理直连对照 |
| host | URL、TrustedHost | 非法 Host 得到拒绝 |
| for | 审计与限流 | 只信任代理网段 |

## 路径前缀

### root_path

{% note info flat %}
`root_path` 传递外部代理前缀，供 OpenAPI 和 URL 生成使用；它不会改变 Python 路由匹配。应用路由仍写 `/tasks`，代理将外部 `/api/tasks` 转成内部请求，并保留前缀信息。
{% endnote %}

### Mount

{% note info flat %}
`Mount` 是应用组合机制，子应用拥有独立的路径树；`root_path` 是代理部署信息。两者都可能出现在 URL 前缀问题中，但修复一个不会自动修复另一个。
{% endnote %}

### 代理转发形状

```text
外部：GET /api/docs
代理：去掉 /api 后转发 GET /docs，并设置 root_path=/api
应用：按 /docs 匹配，生成 /api/openapi.json
```

{% note warning flat %}
如果最终出现 `/api/api/docs`，检查代理是否重复添加前缀、应用路由是否已经包含 `/api`，以及文档服务器 URL 是否被二次改写。
{% endnote %}

## 配置与密钥

### 环境变量

{% note info flat %}
配置通过环境变量或平台 Secret 注入，Settings 负责类型校验和缺失检查。启动日志只输出键名和“已配置/缺失”，不输出值、哈希或完整连接串。
{% endnote %}

### Secrets

{% note danger flat %}
镜像层、命令行参数和错误日志都可能被读取，密钥不能写进 Dockerfile、仓库或进程参数。轮换时先发布新密钥、验证双读窗口，再撤销旧密钥，并保留审计记录。
{% endnote %}

### FASTAPI_ENV

{% note warning flat %}
环境名只是配置选择，不是 FastAPI 自动提供的安全开关。生产与测试要显式加载不同 Settings，不能仅设置一个字符串就宣称开启了生产防护。
{% endnote %}

## 健康与关闭

### readiness

| 探针 | 语义 | 依赖故障时 |
| --- | --- | --- |
| `/live` | 进程还能响应 | 通常仍为 200 |
| `/ready` | 可以接收业务流量 | 返回 503 或被摘除 |

### liveness

```python
@app.get("/live", include_in_schema=False)
async def live() -> dict[str, str]:
    return {"status": "alive"}


@app.get("/ready", include_in_schema=False)
async def ready(settings: Settings = Depends(get_settings)) -> dict[str, str]:
    await settings.check_dependencies()
    return {"status": "ready"}
```

### SIGTERM

{% timeline 优雅关闭, cyan %}
<!-- timeline 停止接流量 -->
探针先让实例不再接收新流量。
<!-- endtimeline -->
<!-- timeline 等待在途 -->
等待短请求和可控后台任务，记录超时任务。
<!-- endtimeline -->
<!-- timeline 释放资源 -->
关闭连接池、队列消费者和文件句柄后退出进程。
<!-- endtimeline -->
{% endtimeline %}

## 故障定位

### 启动失败

{% note warning flat %}
启动失败按入口导入、配置缺失、端口绑定和数据库初始化分层检查。容器日志中的第一行“server started”只能证明进程启动，不代表 readiness 或业务依赖可用。
{% endnote %}

### 502/504

{% note info flat %}
502 常见于代理无法连接上游或上游立即关闭，504 常见于上游超时。对照代理日志、应用 request ID、数据库池等待和响应耗时，先确认哪一层先结束，再调整单层超时。
{% endnote %}

### 资源耗尽

{% note warning flat %}
连接池、线程池、内存和文件描述符耗尽的症状不同。记录容量、已用量和等待时间，先释放泄漏资源，再评估限流、池大小和扩容；盲目加上限只会把故障推向下游。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-worker-vs-async deck:"FastAPI" priority:1 tags:"部署,进程" %}
--- question
多 worker 与异步 I/O 分别解决什么问题？
--- answer
异步 I/O 提高单进程等待期间的并发，worker 增加独立进程并行和故障隔离；两者都会增加资源消耗，不能互相替代。
--- explanation
异步 I/O 让一个事件循环在等待网络/数据库时处理其他协程，但同步阻塞仍会冻结该进程。多 worker 用多个进程利用多核并隔离崩溃，每个进程各有连接池、内存和 lifespan。选择要结合 CPU、I/O、数据库容量和关闭语义，并按 worker 数重新计算连接上限。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-root-path deck:"FastAPI" priority:1 tags:"代理,路径" %}
--- question
`root_path`、代理前缀与 `Mount` 有什么区别？
--- answer
代理前缀是外部 URL 形状，`root_path` 把该前缀告知应用，`Mount` 则把独立 ASGI 应用挂到主应用路径树。
--- explanation
应用内部路由可以仍是 `/tasks`，代理把 `/api/tasks` 转发并设置 `root_path=/api`，文档和 URL 生成据此得到外部地址。`Mount` 不依赖代理，它改变的是应用组合和子应用所有权。重复前缀通常来自代理、root_path 和路由声明同时加了 `/api`，应从外到内逐层打印 URL。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-proxy-header-trust deck:"FastAPI" priority:1 tags:"代理,安全" %}
--- question
为什么不能无条件信任 `X-Forwarded-*` 头？
--- answer
客户端可以伪造这些头；只有来自明确可信代理的转发值才可用于 scheme、Host、客户端地址和安全策略。
--- explanation
错误信任会造成 HTTPS 重定向循环、Host 注入、审计地址伪造或错误的绝对 URL。配置代理网段和服务器的代理头开关后，用直连与代理两条请求比较 scheme/host/client；非法 Host 和伪造头应被拒绝或忽略。日志中记录采用了哪个信任边界，便于故障复盘。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-graceful-shutdown deck:"FastAPI" priority:1 tags:"关闭,资源" %}
--- question
优雅关闭需要哪些步骤？
--- answer
停止接收新流量，等待或取消在途任务，关闭连接池和消费者，并在超时后退出且留下可恢复状态。
--- explanation
SIGTERM 到来后先让 readiness 失败或从负载均衡摘除，再处理在途请求。短任务可以等待，长任务应把状态交给持久队列；所有资源在 lifespan 的退出路径释放。关闭窗口不能无限延长，必须记录未完成任务和清理结果，下一次实例才能安全接管。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Deployment Concepts, https://fastapi.tiangolo.com/deployment/concepts/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Docker, https://fastapi.tiangolo.com/deployment/docker/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Behind a Proxy, https://fastapi.tiangolo.com/advanced/behind-a-proxy/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

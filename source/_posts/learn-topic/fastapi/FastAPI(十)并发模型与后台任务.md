---
title: FastAPI(十)并发模型与后台任务
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 理解事件循环与线程池，正确选择 def 或 async def，并划清 BackgroundTasks 与外部任务系统边界。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 10
published: true
abbrlink: '801e2897'
date: 2026-08-26 00:00:00
---
{% course_series %}

{% note primary flat %}
并发问题通常不是“有没有写 `async`”，而是“哪个工作占住了哪个执行资源”。本文把事件循环、线程池、进程池和后台任务放在同一张图上，再用阻塞实验、取消处理和幂等设计把性能结论落到可观察的延迟与任务状态。
{% endnote %}

## 执行模型

### 事件循环

{% mermaid %}
flowchart TD
  A[请求到达] --> B[事件循环]
  B --> C{遇到 await?}
  C -->|是| D[挂起当前协程]
  D --> E[处理其他 I/O]
  C -->|否| F[继续占用线程]
  F --> G[无关请求延迟上升]
{% endmermaid %}

{% note info flat %}
事件循环只在可等待点让出控制权。一个慢的同步调用会阻塞同一进程中所有协程，因此并发实验要同时发一个“慢请求”和一个无关的 `/live` 请求，记录后者的延迟，而不是只看慢请求是否完成。
{% endnote %}

### 线程池

{% note info flat %}
同步路径操作和同步依赖可以由 FastAPI/Starlette 放入线程池执行，避免直接阻塞事件循环；线程数仍然有限，阻塞调用太多会耗尽线程池。线程池不等于无限并发，也不适合任意 CPU 密集计算。
{% endnote %}

### 进程

| 执行资源 | 擅长工作 | 共享状态 | 主要风险 |
| --- | --- | --- | --- |
| 事件循环 | 异步 I/O 协调 | 协程上下文 | 同步调用阻塞全局 |
| 线程池 | 少量同步 I/O | 可共享内存，需同步 | 线程耗尽、竞争 |
| 进程池/多进程 | CPU 密集计算 | 不共享 Python 堆 | 序列化、进程生命周期 |

## 同步与异步

### def

{% note info flat %}
`def` 路由适合已有同步库或短小 CPU 工作；框架会把它放到线程池。写成 `def` 并不会让数据库、文件或网络调用自动变快，仍要限制等待和线程数量。
{% endnote %}

### async def

{% note info flat %}
`async def` 适合调用提供异步接口的库，并在等待点释放事件循环。每一个 `await` 都应指向真正的 awaitable；把同步函数包进 `await` 只会得到类型错误，不能创造异步性。
{% endnote %}

### 依赖组合

{% note warning flat %}
一条异步路由可以组合同步和异步依赖，但同步依赖会消耗线程池，异步依赖会占用事件循环直到遇到 `await`。在调用图中标出每个节点的执行资源，再决定是否拆分或改用专用执行器。
{% endnote %}

## 阻塞边界

### 阻塞 I/O

| 调用 | 在 `async def` 中的影响 | 推荐处理 |
| --- | --- | --- |
| 同步 HTTP/数据库客户端 | 阻塞事件循环 | 使用异步客户端或显式线程 |
| `time.sleep()` | 直接冻结事件循环 | 使用 `await asyncio.sleep()` |
| 大文件同步读取 | 长时间占用线程 | 分块异步读取或后台任务 |

```python
import asyncio
import time


@app.get("/slow-blocking")
async def slow_blocking() -> dict[str, str]:
    time.sleep(1)
    return {"mode": "blocking"}


@app.get("/slow-awaitable")
async def slow_awaitable() -> dict[str, str]:
    await asyncio.sleep(1)
    return {"mode": "awaitable"}
```

{% note warning flat %}
同时请求慢端点和 `/live`：访问 `/slow-blocking` 时 `/live` 会被同一事件循环拖住，访问 `/slow-awaitable` 时应能在等待期间返回。用 `curl -w '%{time_total}'` 记录两次时间，先得到可重复的对照，再讨论线程池或进程池优化。
{% endnote %}

### CPU 工作

{% note warning flat %}
纯 Python 的压缩、图像处理或大规模计算会持续占用 CPU，即使写成 `async def` 也不会让出控制权。把它放入进程池或外部任务系统，并把任务 ID、取消和重试语义写进接口契约。
{% endnote %}

### 线程限制

{% note info flat %}
线程池大小、数据库连接池和客户端并发限制是三套不同的容量。压测时分别记录排队时间和执行时间；只调大线程数可能让数据库连接先耗尽，反而放大尾延迟。
{% endnote %}

## 后台任务

### BackgroundTasks

{% note info flat %}
`BackgroundTasks` 适合响应发送后即可完成、失败可记录但不需要持久重试的短任务，例如写一条审计日志。它运行在当前进程生命周期内，不能承诺跨进程、跨重启的可靠投递。
{% endnote %}

```python
from fastapi import BackgroundTasks


def append_audit(event: str) -> None:
    with open("audit.log", "a", encoding="utf-8") as handle:
        handle.write(event + "\n")


@app.post("/tasks", status_code=202)
async def enqueue_task(background_tasks: BackgroundTasks) -> dict[str, str]:
    background_tasks.add_task(append_audit, "task-created")
    return {"status": "accepted"}
```

### 依赖合并

{% note info flat %}
路径操作、依赖和子依赖可以共同声明 `BackgroundTasks`，FastAPI 会把任务合并到同一个响应后队列。任务函数应短小、可重复执行，并把异常写入结构化日志；不要在任务里依赖已经关闭的请求 Session。
{% endnote %}

```python
def record_request(background_tasks: BackgroundTasks, event: str) -> None:
    background_tasks.add_task(append_audit, event)


@app.post("/tasks/{task_id}/notify", status_code=202)
async def notify_task(task_id: str, background_tasks: BackgroundTasks) -> dict[str, str]:
    record_request(background_tasks, f"notify:{task_id}")
    return {"task_id": task_id, "status": "accepted"}
```

{% note success flat %}
请求 `/tasks/demo/notify` 后应先收到 202，再在审计输出中看到 `notify:demo`。如果任务函数读取请求级 Session 或临时文件，响应返回后资源可能已经释放；把任务输入复制为普通值，或升级到独立 worker。
{% endnote %}

### 响应之后

{% timeline 后台任务时序, cyan %}
<!-- timeline 请求阶段 -->
校验输入、提交必要的持久状态并生成响应。
<!-- endtimeline -->
<!-- timeline 响应阶段 -->
客户端收到响应后，当前进程执行短任务并记录成功或失败。
<!-- endtimeline -->
<!-- timeline 升级阶段 -->
若任务需要重试、跨进程或长时间运行，改交给持久队列和独立 worker。
<!-- endtimeline -->
{% endtimeline %}

## 任务升级

### 进程池

{% note info flat %}
进程池适合有明确输入输出的 CPU 函数；提交前要限制队列长度，取消时处理 future 状态，关闭时等待或放弃任务。进程池不是数据库事务的一部分，业务状态仍需独立记录。
{% endnote %}

### 队列系统

{% note info flat %}
需要持久重试、跨机器消费、定时调度或长任务进度时，使用外部队列。API 只负责写入任务记录并返回 ID，worker 负责状态机；客户端查询或订阅状态，而不是保持一个 HTTP 请求直到任务结束。
{% endnote %}

### 幂等

{% note warning flat %}
重试意味着同一任务可能执行多次。用幂等键、唯一约束或状态转换保护副作用，并把“已完成”与“处理中”区分开。没有幂等设计时，增加重试只会重复扣款、重复发信或重复写审计。
{% endnote %}

## 关闭与取消

### 客户端断开

{% note warning flat %}
流式响应或长任务应检查取消/断开信号，及时关闭生成器、HTTP 客户端和数据库会话。客户端断开不等于业务自动回滚；需要回滚的状态必须由事务边界明确负责。
{% endnote %}

```python
async def cancellable_job():
    try:
        for step in range(10):
            await asyncio.sleep(0.2)
            yield {"step": step}
    except asyncio.CancelledError:
        # 记录取消并释放临时资源，然后继续传播取消
        raise
```

{% note info flat %}
让客户端在收到前两条结果后主动断开，服务端日志应出现取消与清理记录，而不是把取消误记为成功。若生成器吞掉 `CancelledError`，服务器可能继续占用连接；取消路径要和正常结束、异常结束分别断言。
{% endnote %}

### 服务关闭

{% note warning flat %}
收到 SIGTERM 后停止接收新任务、等待短任务、取消可取消工作并释放资源。不要在 `finally` 中无限等待；为清理设定上限，并把未完成任务留给可恢复的队列状态。
{% endnote %}

### 超时

{% note danger flat %}
超时只结束等待，不一定能杀死下游工作。为客户端、代理、数据库和任务队列分别设置超时，并在日志中标明哪一层先到期；盲目增加一个全局超时会隐藏资源泄漏。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-def-vs-async-def deck:"FastAPI" priority:1 tags:"并发,路由" %}
--- question
FastAPI 中 `def` 和 `async def` 路由如何选择？
--- answer
已有同步 I/O 可用 `def` 让框架放入线程池；异步库和可等待 I/O 使用 `async def`，并确保阻塞工作被隔离。
--- explanation
关键不是函数关键字，而是调用链是否会让出执行资源。`def` 路由通常在线程池运行，线程数量有限；`async def` 在事件循环运行，遇到真正的 `await` 才释放控制权。同步数据库或 `time.sleep` 放进异步函数仍会冻结事件循环，需改用异步库或显式线程/进程。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-blocking-in-async deck:"FastAPI" priority:1 tags:"阻塞,事件循环" %}
--- question
如何证明一个同步调用阻塞了事件循环？
--- answer
并发发起慢调用和无关的 `/live` 请求；若后者延迟与慢调用同步上升，再结合线程/事件循环指标定位。
--- explanation
只测慢请求只能证明它慢，不能证明它阻塞了全局。用 `time.sleep` 或同步客户端做对照，再用 `asyncio.sleep` 或异步客户端替换；比较无关请求的 p95 延迟和完成顺序。修复后慢调用仍可能耗时，但无关请求应能在等待期间继续得到响应。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-background-task-boundary deck:"FastAPI" priority:1 tags:"后台任务,队列" %}
--- question
什么时候应该使用 `BackgroundTasks`，什么时候升级到持久队列？
--- answer
短小、同进程、失败可记录的任务适合 `BackgroundTasks`；需要重试、跨进程、长时间运行或可靠投递时使用持久队列。
--- explanation
`BackgroundTasks` 在响应后由当前进程执行，进程崩溃或重启会丢失任务。持久队列把任务状态和重试交给独立系统，API 只返回任务 ID。无论哪种方案，都要设计幂等键、状态机和关闭行为，不能把“响应已经返回”当作任务一定成功。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Async, https://fastapi.tiangolo.com/async/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Background Tasks, https://fastapi.tiangolo.com/tutorial/background-tasks/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Server Workers, https://fastapi.tiangolo.com/deployment/server-workers/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

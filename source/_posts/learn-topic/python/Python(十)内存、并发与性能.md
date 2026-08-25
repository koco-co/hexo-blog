---
title: Python(十)内存、并发与性能
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 理解 CPython 对象生命周期、GC 与 GIL 边界，并依据工作负载选择线程、进程或 asyncio。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 10
published: false
abbrlink: fa1b960c
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：explain CPython object lifetime and choose concurrency models based on task and runtime constraints.
- 学习成果：reader can explain reference counting, cyclic GC, the default GIL build versus free-threaded builds, and choose threads/processes/asyncio for a measured workload.
- 前置文章：Python(九)类型与质量保障.
- 复用或新建依据：new article; old notes do not cover these mechanisms.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:datamodel#coroutine-functions` | 核心详解 | 执行模型选择 |
| `langref:datamodel#asynchronous-generator-functions` | 核心详解 | 执行模型选择 / 异步迭代、async for 与异步生成器 |
| `langref:datamodel#coroutines` | 核心详解 | 执行模型选择 |
| `langref:datamodel#awaitable-objects` | 核心详解 | 执行模型选择 |
| `langref:datamodel#coroutine-objects` | 核心详解 | 执行模型选择 |
| `langref:datamodel#asynchronous-iterators` | 核心详解 | 执行模型选择 / 异步迭代、async for 与异步生成器 |
| `langref:datamodel#asynchronous-context-managers` | 正文简述 | 并发与并行 |
| `langref:executionmodel#runtime-components` | 正文简述 | 并发与并行 |
| `langref:executionmodel#python-runtime-model` | 正文简述 | 并发与并行 |
| `langref:expressions#asynchronous-generator-functions` | 核心详解 | 执行模型选择 / 异步迭代、async for 与异步生成器 |
| `langref:expressions#asynchronous-generator-iterator-methods` | 核心详解 | 执行模型选择 / 异步迭代、async for 与异步生成器 |
| `langref:expressions#await-expression` | 核心详解 | 执行模型选择 |
| `langref:compound_stmts#coroutines` | 核心详解 | 执行模型选择 |
| `langref:compound_stmts#coroutine-function-definition` | 核心详解 | 执行模型选择 |
| `langref:compound_stmts#the-async-for-statement` | 核心详解 | 执行模型选择 / 异步迭代、async for 与异步生成器 |
| `langref:compound_stmts#the-async-with-statement` | 正文简述 | 执行模型选择 |
| `builtin:aiter` | 正文简述 | 执行模型选择 / 异步迭代、async for 与异步生成器 |
| `builtin:anext` | 正文简述 | 执行模型选择 / 异步迭代、async for 与异步生成器 |
| `stdlib:_thread` | 正文简述 | 执行模型选择 / 底层 _thread 与高层接口边界 |
| `stdlib:asyncio` | 核心详解 | 执行模型选择 |
| `stdlib:concurrent.futures` | 核心详解 | 执行模型选择 |
| `stdlib:contextvars` | 正文简述 | 共享状态与取消 / ContextVar 与任务上下文 |
| `stdlib:gc` | 核心详解 | 对象生命周期 |
| `stdlib:mmap` | 正文简述 | 对象生命周期 |
| `stdlib:multiprocessing` | 核心详解 | 执行模型选择 |
| `stdlib:multiprocessing.connection` | 正文简述 | 执行模型选择 |
| `stdlib:multiprocessing.dummy` | 正文简述 | 执行模型选择 |
| `stdlib:multiprocessing.managers` | 正文简述 | 执行模型选择 |
| `stdlib:multiprocessing.pool` | 正文简述 | 执行模型选择 |
| `stdlib:multiprocessing.shared_memory` | 正文简述 | 共享状态与取消 |
| `stdlib:multiprocessing.sharedctypes` | 正文简述 | 共享状态与取消 |
| `stdlib:queue` | 核心详解 | 共享状态与取消 |
| `stdlib:resource` | 正文简述 | 对象生命周期 |
| `stdlib:sched` | 正文简述 | 并发与并行 |
| `stdlib:selectors` | 正文简述 | 并发与并行 |
| `stdlib:signal` | 正文简述 | 共享状态与取消 |
| `stdlib:subprocess` | 正文简述 | 执行模型选择 |
| `stdlib:threading` | 核心详解 | 执行模型选择 |
| `stdlib:time` | 正文简述 | 并发与并行 |
| `stdlib:tracemalloc` | 正文简述 | 对象生命周期 |
| `stdlib:weakref` | 核心详解 | 对象生命周期 |

## 章节计划

- H2：对象生命周期
  - H3：引用计数
  - H3：循环引用与垃圾回收
  - H3：弱引用与资源释放
- H2：并发与并行
  - H3：任务、线程与进程
  - H3：协作式与抢占式调度
  - H3：CPU 密集与 I/O 密集
- H2：GIL 边界
  - H3：传统 CPython 构建
  - H3：阻塞 I/O 与扩展释放 GIL
  - H3：3.14 自由线程支持
- H2：执行模型选择
  - H3：threading
  - H3：底层 _thread 与高层接口边界
  - H3：multiprocessing 与 ProcessPoolExecutor
  - H3：asyncio
  - H3：异步迭代、async for 与异步生成器
  - H3：async with 与异步资源清理
- H2：共享状态与取消
  - H3：锁、队列与竞争条件
  - H3：ContextVar 与任务上下文
  - H3：异常传播
  - H3：关闭与清理
- H2：并发性能实验
  - H3：I/O 工作负载
  - H3：CPU 工作负载
  - H3：测量与解释
- H2：结果验证
- H2：常见问题
- H2：参考资料

## 验证方式

- 贯穿案例与完整示例：run equivalent log-processing workloads sequentially, with threads, a process pool, and asyncio; drive an async generator through both `async for` and explicit `aiter`/`anext`, verify exhaustion via `StopAsyncIteration`, use an async context manager around a cancellable resource, inject shared-state/cancellation failures, and verify exception propagation plus `__aexit__` cleanup before interpreting measurements.
- 失败边界与踩坑：the GIL does not make compound operations thread-safe; async context managers must preserve exception propagation and cleanup during cancellation; free-threaded builds can re-enable the GIL for incompatible extensions; speed depends on workload and platform.
- FAQ 候选与来源：Library FAQ thread/GIL questions and Programming/Design FAQ memory/performance questions.
- 自测与闪卡计划：
  - `python-runtime-gc` priority 1.
    - `python-runtime-gil` priority 1.
    - `python-runtime-thread-process-async` priority 1.
    - `python-runtime-race` priority 1.
- 可视化：object-reference/GC graph, concurrency selection matrix, and timeline comparison.
- 主要参考资料：`gc`, `weakref`, concurrency library index, `threading`, `multiprocessing`, `asyncio`, free-threading HOWTO, C API GIL explanation for CPython implementation evidence.

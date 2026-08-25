---
title: Python(六)迭代器、生成器与装饰器
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 从迭代协议到生成器、惰性管道与装饰器建立流式处理能力，并验证短路消费、关闭和异常传播。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 6
published: false
abbrlink: be636c04
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：explain lazy iteration and reusable behavior wrapping from protocols through generators, closures, and decorators.
- 学习成果：reader can implement an iterator, build a lazy generator pipeline, and reason about decorator expansion and execution order.
- 前置文章：Python(五)流程控制与函数.
- 复用或新建依据：new article; the old notes only mention keywords and do not teach these mechanisms.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:datamodel#generator-functions` | 核心详解 | 生成器 |
| `langref:expressions#generator-expressions` | 核心详解 | 生成器 |
| `langref:expressions#yield-expressions` | 核心详解 | 生成器 |
| `langref:expressions#generator-iterator-methods` | 核心详解 | 生成器 |
| `langref:expressions#examples` | 核心详解 | 生成器 |
| `langref:simple_stmts#the-yield-statement` | 核心详解 | 生成器 |
| `builtin:all` | 核心详解 | 惰性数据管道 / all、any 与聚合 |
| `builtin:any` | 核心详解 | 惰性数据管道 / all、any 与聚合 |
| `builtin:enumerate` | 核心详解 | 惰性数据管道 / enumerate 与 zip 的配对 |
| `builtin:filter` | 核心详解 | 惰性数据管道 |
| `builtin:iter` | 核心详解 | 迭代协议 |
| `builtin:map` | 核心详解 | 惰性数据管道 |
| `builtin:max` | 核心详解 | 惰性数据管道 / all、any 与聚合 |
| `builtin:min` | 核心详解 | 惰性数据管道 / all、any 与聚合 |
| `builtin:next` | 核心详解 | 迭代协议 |
| `builtin:reversed` | 正文简述 | 迭代协议 |
| `builtin:sum` | 核心详解 | 惰性数据管道 / all、any 与聚合 |
| `builtin:zip` | 核心详解 | 惰性数据管道 / enumerate 与 zip 的配对 |
| `stdtype:container.__iter__` | 正文简述 | 迭代协议 |
| `stdtype:iterator.__iter__` | 正文简述 | 迭代协议 |
| `stdtype:iterator.__next__` | 正文简述 | 迭代协议 |
| `stdlib:functools` | 核心详解 | 闭包与装饰器 |
| `stdlib:itertools` | 核心详解 | 惰性数据管道 |

## 正文大纲

- H2：迭代协议
  - H3：可迭代对象与迭代器
  - H3：iter、next 与 StopIteration
  - H3：单次消费与重复遍历
- H2：生成器
  - H3：yield 暂停与恢复
  - H3：生成器表达式
  - H3：yield from
- H2：惰性数据管道
  - H3：map、filter 与推导式
  - H3：enumerate 与 zip 的配对
  - H3：all、any 与聚合
  - H3：itertools
  - H3：错误传播与生成器关闭
- H2：闭包与装饰器
  - H3：装饰器语法展开
  - H3：带参数装饰器
  - H3：functools.wraps
  - H3：叠加顺序
- H2：流式处理实验
  - H3：逐项消费合成日志
  - H3：过滤与转换
  - H3：计时装饰器
- H2：结果验证
- H2：常见问题
- H2：参考资料

## 内容计划

- 贯穿案例与完整示例：stream an in-memory iterable of synthetic log lines through iterator/generator stages and a timing decorator; number and pair records with `enumerate`/`zip`, compute summary values with `all`/`any`/`max`/`min`/`sum`, and verify lazy consumption, short-circuiting, shortest-input `zip` behavior, explicit generator closing, exception propagation, and metadata preservation. Real files and context-managed resource ownership are deferred to Python(八).
- 失败边界与踩坑：iterators can be exhausted; `all`/`any` short-circuit and consume only part of a lazy input; ordinary `zip` stops at the shortest iterable; generator closing and exception propagation must be considered; decorators run at definition time while wrappers run at call time; this article does not open files before context management is taught; `map(strict=...)` is executed only on Python 3.14 and omitted on the 3.13 baseline.
- FAQ 候选与来源：official generator/how-to material and Programming FAQ on higher-order functions and closure behavior.
- 自测与闪卡计划：
  - `python-iteration-iterable-iterator` priority 1.
    - `python-iteration-yield-return` priority 1.
    - `python-iteration-decorator-order` priority 1.
    - `python-iteration-lazy` priority 2.
- 可视化：iterator state machine, generator pause/resume sequence, and decorator expansion stack.
- 主要参考资料：Data model, expressions, compound statements, `itertools`, `functools`, Functional Programming HOWTO.

## 常见问题

待正文阶段按主题编写；需要长期复习的问答优先使用带稳定 ID 和优先级的 flashcard。

## 参考资料

待正文阶段按正文出现顺序补齐官方资料卡片。

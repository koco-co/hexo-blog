---
title: Python(五)流程控制与函数
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 掌握分支、循环、推导式、函数参数、作用域、闭包、递归和高阶函数，并诊断默认值与晚绑定问题。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 5
published: false
abbrlink: a62147da
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：explain branching, looping, function calls, parameter binding, scopes, closures, recursion, and higher-order behavior.
- 学习成果：reader can design predictable function interfaces and diagnose mutable-default, scope, and late-binding bugs.
- 前置文章：Python(四)内置类型与容器.
- 复用或新建依据：keep selected control-flow, recursion, and higher-order exercises; replace pyramid-printing volume with dependency-relevant cases.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:datamodel#callable-types` | 核心详解 | 参数模型 |
| `langref:datamodel#user-defined-functions` | 核心详解 | 函数对象 |
| `langref:datamodel#built-in-functions` | 核心详解 | 函数对象 |
| `langref:executionmodel#execution-model` | 核心详解 | 函数对象 |
| `langref:executionmodel#structure-of-a-program` | 核心详解 | 函数对象 |
| `langref:executionmodel#naming-and-binding` | 核心详解 | 作用域与闭包 |
| `langref:executionmodel#binding-of-names` | 核心详解 | 作用域与闭包 |
| `langref:executionmodel#resolution-of-names` | 核心详解 | 函数对象 |
| `langref:executionmodel#builtins-and-restricted-execution` | 核心详解 | 函数对象 |
| `langref:executionmodel#interaction-with-dynamic-features` | 核心详解 | 函数对象 |
| `langref:executionmodel#general-computing-model` | 核心详解 | 函数对象 |
| `langref:expressions#displays-for-lists-sets-and-dictionaries` | 核心详解 | 流程控制 / 推导式中的循环与条件 |
| `langref:expressions#list-displays` | 核心详解 | 流程控制 / 推导式中的循环与条件 |
| `langref:expressions#set-displays` | 核心详解 | 流程控制 / 推导式中的循环与条件 |
| `langref:expressions#dictionary-displays` | 核心详解 | 流程控制 / 推导式中的循环与条件 |
| `langref:expressions#calls` | 核心详解 | 参数模型 |
| `langref:expressions#assignment-expressions` | 核心详解 | 流程控制 |
| `langref:expressions#conditional-expressions` | 核心详解 | 流程控制 |
| `langref:expressions#lambda` | 核心详解 | 递归与高阶函数 |
| `langref:expressions#expression-lists` | 核心详解 | 函数对象 |
| `langref:simple_stmts#simple-statements` | 正文简述 | 流程控制 |
| `langref:simple_stmts#the-pass-statement` | 核心详解 | 流程控制 |
| `langref:simple_stmts#the-return-statement` | 核心详解 | 函数对象 |
| `langref:simple_stmts#the-break-statement` | 核心详解 | 流程控制 |
| `langref:simple_stmts#the-continue-statement` | 核心详解 | 流程控制 |
| `langref:simple_stmts#the-global-statement` | 核心详解 | 作用域与闭包 |
| `langref:simple_stmts#the-nonlocal-statement` | 核心详解 | 作用域与闭包 |
| `langref:compound_stmts#compound-statements` | 核心详解 | 函数对象 |
| `langref:compound_stmts#the-if-statement` | 核心详解 | 流程控制 |
| `langref:compound_stmts#the-while-statement` | 核心详解 | 流程控制 |
| `langref:compound_stmts#the-for-statement` | 核心详解 | 流程控制 |
| `langref:compound_stmts#the-match-statement` | 核心详解 | 流程控制 |
| `langref:compound_stmts#overview` | 核心详解 | 流程控制 |
| `langref:compound_stmts#guards` | 核心详解 | 流程控制 |
| `langref:compound_stmts#irrefutable-case-blocks` | 核心详解 | 流程控制 |
| `langref:compound_stmts#patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#or-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#as-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#literal-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#capture-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#wildcard-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#value-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#group-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#sequence-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#mapping-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#class-patterns` | 核心详解 | 流程控制 |
| `langref:compound_stmts#function-definitions` | 核心详解 | 函数对象 |
| `builtin:callable` | 正文简述 | 函数对象 |
| `stdlib:inspect` | 正文简述 | 函数对象 |

## 正文大纲

- H2：流程控制
  - H3：if 与条件链
  - H3：for、while 与循环 else
  - H3：推导式中的循环与条件
  - H3：match 模式匹配
  - H3：模式种类、名称绑定与守卫
  - H3：不可达模式与失败边界
- H2：函数对象
  - H3：定义、调用与返回
  - H3：函数是一等对象
  - H3：文档字符串
- H2：参数模型
  - H3：参数与实参
  - H3：位置限定与关键字限定
  - H3：*args 与 **kwargs
  - H3：可变默认值
- H2：作用域与闭包
  - H3：LEGB
  - H3：global 与 nonlocal
  - H3：循环闭包晚绑定
- H2：递归与高阶函数
  - H3：终止条件与调用栈
  - H3：lambda 的真实边界
  - H3：函数作为参数
- H2：函数实验
  - H3：可配置评分器
  - H3：故障注入与修复
- H2：结果验证
- H2：常见问题
- H2：参考资料

## 内容计划

- 贯穿案例与完整示例：build a score-processing pipeline with list/set/dict comprehensions, `match`-based record classification, guards, positional-only and keyword-only parameters, configurable callbacks, closure factories, recursion, and invalid-pattern/input tests.
- 失败边界与踩坑：default values are evaluated once; closures capture names; `return` differs from loop control; recursion depth is finite; capture patterns bind names and an irrefutable case must not hide later cases.
- FAQ 候选与来源：Programming FAQ on local/global variables, `UnboundLocalError`, loop lambdas, shared defaults, arguments vs parameters, higher-order functions, and slash in parameter lists.
- 自测与闪卡计划：
  - `python-function-args-params` priority 1.
    - `python-function-default-mutable` priority 1.
    - `python-function-legb` priority 1.
    - `python-function-late-binding` priority 1.
- 可视化：call-binding matrix, LEGB lookup diagram, closure cell timeline, and recursion stack.
- 主要参考资料：Compound/simple statements, expressions, execution model, Programming FAQ, PEP 570 and PEP 572.

## 常见问题

待正文阶段按主题编写；需要长期复习的问答优先使用带稳定 ID 和优先级的 flashcard。

## 参考资料

待正文阶段按正文出现顺序补齐官方资料卡片。

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

## 文章职责

- 唯一要解决的问题：explain branching, looping, function calls, parameter binding, scopes, closures, recursion, and higher-order behavior.
- 可观察成果：reader can design predictable function interfaces and diagnose mutable-default, scope, and late-binding bugs.
- 进入条件：Python(四)内置类型与容器.
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

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
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 流程控制 | 建立流程控制的心智模型 | if 与条件链；for、while 与循环 else；推导式中的循环与条件；match 模式匹配；模式种类、名称绑定与守卫；不可达模式与失败边界 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 函数对象 | 建立函数对象的心智模型 | 定义、调用与返回；函数是一等对象；文档字符串 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 参数模型 | 建立参数模型的心智模型 | 参数与实参；位置限定与关键字限定；*args 与 **kwargs；可变默认值 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 作用域与闭包 | 建立作用域与闭包的心智模型 | LEGB；global 与 nonlocal；循环闭包晚绑定 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 递归与高阶函数 | 建立递归与高阶函数的心智模型 | 终止条件与调用栈；lambda 的真实边界；函数作为参数 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 函数实验 | 完成并验证函数实验 | 可配置评分器；故障注入与修复 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 结果验证的输入、关键步骤、结果与边界 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 常见问题 | 建立常见问题的心智模型 | 常见问题的输入、关键步骤、结果与边界 | `flashcard` | 真实高价值问题需要进入长期复习队列 | 题面、精简答案和详细解析 | 闪卡脚本失效时题面与答案正文仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 参考资料 | 建立参考资料的心智模型 | 参考资料的输入、关键步骤、结果与边界 | `linkgroup/link` | 官方扩展阅读使用统一资料卡片 | 资料名称、用途和完整 URL | 图片或网络失败时名称与 URL 仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例与完整示例：build a score-processing pipeline with list/set/dict comprehensions, `match`-based record classification, guards, positional-only and keyword-only parameters, configurable callbacks, closure factories, recursion, and invalid-pattern/input tests.
- 失败边界与踩坑：default values are evaluated once; closures capture names; `return` differs from loop control; recursion depth is finite; capture patterns bind names and an irrefutable case must not hide later cases.
- FAQ 候选与来源：Programming FAQ on local/global variables, `UnboundLocalError`, loop lambdas, shared defaults, arguments vs parameters, higher-order functions, and slash in parameter lists.
- 复习卡片：
  - `python-function-args-params` priority 1.
    - `python-function-default-mutable` priority 1.
    - `python-function-legb` priority 1.
    - `python-function-late-binding` priority 1.
- 图表或实验：call-binding matrix, LEGB lookup diagram, closure cell timeline, and recursion stack.
- 主要参考资料：Compound/simple statements, expressions, execution model, Programming FAQ, PEP 570 and PEP 572.
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

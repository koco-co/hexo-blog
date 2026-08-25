---
title: MySQL(五)多表查询与子查询
tags:
  - MySQL
  - 多表查询与子查询
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 使用连接、子查询、EXISTS、派生表和集合运算解决跨表筛选、每组最值与关系除法场景。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 5
published: false
abbrlink: '8e749712'
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：怎样在多张表之间表达匹配、不匹配、存在性和全集关系。
- 可观察成果：能够选择 JOIN、EXISTS、IN、子查询或集合运算，并正确处理 NULL 与重复行。
- 进入条件：MySQL(四)查询基础与聚合
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 多表查询与子查询：`refman8.4:join`、`refman8.4:subqueries`、`refman8.4:scalar-subqueries`、`refman8.4:comparisons-using-subqueries`、`refman8.4:any-in-some-subqueries`、`refman8.4:all-subqueries`、`refman8.4:row-subqueries`、`refman8.4:exists-and-not-exists-subqueries`、`refman8.4:correlated-subqueries`、`refman8.4:derived-tables`、`refman8.4:lateral-derived-tables`、`refman8.4:subquery-errors`、`refman8.4:subquery-restrictions`、`refman8.4:union`、`refman8.4:set-operations`、`refman8.4:intersect`、`refman8.4:except`
- 选择与优化边界：`refman8.4:optimizing-subqueries`、`refman8.4:table`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 连接模型 | 建立连接模型的心智模型 | 理解内连接、外连接和结果基数 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| ON 与 WHERE | 建立ON 与 WHERE的心智模型 | 避免把外连接意外改成内连接 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 标量、行与表子查询 | 完成并验证标量、行与表子查询 | 识别返回形状和错误边界 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| EXISTS、IN 与 NULL | 建立EXISTS、IN 与 NULL的心智模型 | 选择存在性写法并避免 NOT IN 陷阱 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 派生表与 LATERAL | 建立派生表与 LATERAL的心智模型 | 组织相关计算和逐行派生结果 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 集合运算与关系除法 | 建立集合运算与关系除法的心智模型 | 查询购买指定商品集合全部商品的用户 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：用 users、orders、order_items、products 和 employees 完成无订单用户、每组最高薪、指定商品全集与 NULL 反例。
- 失败边界与踩坑：目标商品集合固定为 101/102/103 且非空；seed 同时包含全买、少买、重复购买和无订单用户。
- FAQ 候选与来源：SO-5706437、SO-7745609 用于连接与每组最值题型发现。
- 非复习自测：SQL 卡 mysql84-05-users-without-orders-p1、mysql84-05-groupwise-max-p1、mysql84-05-relational-division-p1、mysql84-05-not-in-null-p1。
- 图表或实验：连接基数图、EXISTS/IN 决策表和关系除法集合图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/join.html
- https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html
- https://dev.mysql.com/doc/refman/8.4/en/correlated-subqueries.html
- https://dev.mysql.com/doc/refman/8.4/en/set-operations.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

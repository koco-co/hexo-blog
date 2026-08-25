---
title: MySQL(二)数据库基础与表设计
tags:
  - MySQL
  - 数据库基础与表设计
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从业务关系、数据类型、字符集、范式和约束出发，完成 ShopLab 九张表的可验证关系模型与 DDL。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 2
published: false
abbrlink: 54906a1
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：怎样把订单、库存和组织业务转化为可靠的关系模型与表结构。
- 可观察成果：能够选择主键、外键、金额与时间类型，使用 utf8mb4 和约束写出可验证 DDL。
- 进入条件：MySQL(一)入门路线
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 关系模型与建表：`refman8.4:constraints`、`refman8.4:creating-tables`、`refman8.4:create-database`、`refman8.4:create-table`、`refman8.4:create-temporary-table`、`refman8.4:create-table-like`、`refman8.4:create-table-select`、`refman8.4:create-table-foreign-keys`、`refman8.4:create-table-check-constraints`、`refman8.4:create-table-generated-columns`、`refman8.4:invisible-columns`、`refman8.4:create-table-gipks`
- 数据类型：`refman8.4:data-types`、`refman8.4:numeric-types`、`refman8.4:numeric-type-syntax`、`refman8.4:fixed-point-types`、`refman8.4:date-and-time-types`、`refman8.4:datetime`、`refman8.4:timestamp-initialization`、`refman8.4:string-types`、`refman8.4:string-type-syntax`、`refman8.4:json`、`refman8.4:data-type-defaults`、`refman8.4:storage-requirements`、`refman8.4:choosing-types`
- 字符集与排序规则：`refman8.4:charset-general`、`refman8.4:charset-syntax`、`refman8.4:charset-connection`、`refman8.4:charset-collations`、`refman8.4:charset-unicode-utf8mb4`、`refman8.4:charset-unicode-utf8`
- 建表与验证：`refman8.4:drop-database`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 业务需求与关系模型 | 建立业务需求与关系模型的心智模型 | 识别实体、属性、基数和业务不变量 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| ER 模型与范式 | 建立ER 模型与范式的心智模型 | 把订单、库存、员工关系转换为九张表 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 数据类型 | 比较数据类型 | 选择金额、时间、状态和字符串类型 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 字符集与排序规则 | 建立字符集与排序规则的心智模型 | 确定 utf8mb4、连接字符集和比较语义 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 主键、外键与约束 | 建立主键、外键与约束的心智模型 | 设计主键、唯一、外键、CHECK、生成列 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 建表与结构验证 | 完成并验证建表与结构验证 | 从空库创建 ShopLab 并回读结构 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：给定订单、商品和库存需求，完成九张表 DDL，导入固定 seed，并核对表、列、键和约束。
- 失败边界与踩坑：避免把 utf8 当作完整 UTF-8；解释 DATETIME/TIMESTAMP、DECIMAL/FLOAT、自然键/代理键和外键级联边界。
- FAQ 候选与来源：时间类型与排序规则问题采用 SO-409286、SO-766809 作为提问线索，答案只以当前官方资料为准。
- 非复习自测：DDL 手写题、类型选择题和约束失败题；SQL 主卡 mysql84-02-order-schema-ddl-p1。
- 图表或实验：ShopLab ER 图、字符集链路图和数据类型决策表。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/creating-tables.html
- https://dev.mysql.com/doc/refman/8.4/en/data-types.html
- https://dev.mysql.com/doc/refman/8.4/en/charset-unicode-utf8mb4.html
- https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

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

## 本文职责

- 唯一问题：怎样把订单、库存和组织业务转化为可靠的关系模型与表结构。
- 学习成果：能够选择主键、外键、金额与时间类型，使用 utf8mb4 和约束写出可验证 DDL。
- 前置文章：MySQL(一)入门路线
- 能力分配：

- 关系模型与建表：`refman8.4:constraints`、`refman8.4:creating-tables`、`refman8.4:create-database`、`refman8.4:create-table`、`refman8.4:create-temporary-table`、`refman8.4:create-table-like`、`refman8.4:create-table-select`、`refman8.4:create-table-foreign-keys`、`refman8.4:create-table-check-constraints`、`refman8.4:create-table-generated-columns`、`refman8.4:invisible-columns`、`refman8.4:create-table-gipks`
- 数据类型：`refman8.4:data-types`、`refman8.4:numeric-types`、`refman8.4:numeric-type-syntax`、`refman8.4:fixed-point-types`、`refman8.4:date-and-time-types`、`refman8.4:datetime`、`refman8.4:timestamp-initialization`、`refman8.4:string-types`、`refman8.4:string-type-syntax`、`refman8.4:json`、`refman8.4:data-type-defaults`、`refman8.4:storage-requirements`、`refman8.4:choosing-types`
- 字符集与排序规则：`refman8.4:charset-general`、`refman8.4:charset-syntax`、`refman8.4:charset-connection`、`refman8.4:charset-collations`、`refman8.4:charset-unicode-utf8mb4`、`refman8.4:charset-unicode-utf8`
- 建表与验证：`refman8.4:drop-database`

## 正文大纲

- H2：业务需求与关系模型
  - H3：识别实体、属性、基数和业务不变量
- H2：ER 模型与范式
  - H3：把订单、库存、员工关系转换为九张表
- H2：数据类型
  - H3：选择金额、时间、状态和字符串类型
- H2：字符集与排序规则
  - H3：确定 utf8mb4、连接字符集和比较语义
- H2：主键、外键与约束
  - H3：设计主键、唯一、外键、CHECK、生成列
- H2：建表与结构验证
  - H3：从空库创建 ShopLab 并回读结构

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：给定订单、商品和库存需求，完成九张表 DDL，导入固定 seed，并核对表、列、键和约束。
- 失败边界与踩坑：避免把 utf8 当作完整 UTF-8；解释 DATETIME/TIMESTAMP、DECIMAL/FLOAT、自然键/代理键和外键级联边界。
- FAQ 候选与来源：时间类型与排序规则问题采用 SO-409286、SO-766809 作为提问线索，答案只以当前官方资料为准。
- 自测形式：DDL 手写题、类型选择题和约束失败题；SQL 主卡 mysql84-02-order-schema-ddl-p1。
- 可视化：ShopLab ER 图、字符集链路图和数据类型决策表。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/creating-tables.html
- https://dev.mysql.com/doc/refman/8.4/en/data-types.html
- https://dev.mysql.com/doc/refman/8.4/en/charset-unicode-utf8mb4.html
- https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

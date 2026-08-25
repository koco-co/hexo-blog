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

## 学习目标

- 唯一问题：怎样在多张表之间表达匹配、不匹配、存在性和全集关系。
- 学习成果：能够选择 JOIN、EXISTS、IN、子查询或集合运算，并正确处理 NULL 与重复行。
- 前置文章：MySQL(四)查询基础与聚合
- 能力分配：

- 多表查询与子查询：`refman8.4:join`、`refman8.4:subqueries`、`refman8.4:scalar-subqueries`、`refman8.4:comparisons-using-subqueries`、`refman8.4:any-in-some-subqueries`、`refman8.4:all-subqueries`、`refman8.4:row-subqueries`、`refman8.4:exists-and-not-exists-subqueries`、`refman8.4:correlated-subqueries`、`refman8.4:derived-tables`、`refman8.4:lateral-derived-tables`、`refman8.4:subquery-errors`、`refman8.4:subquery-restrictions`、`refman8.4:union`、`refman8.4:set-operations`、`refman8.4:intersect`、`refman8.4:except`
- 选择与优化边界：`refman8.4:optimizing-subqueries`、`refman8.4:table`

## 章节计划

- H2：连接模型
  - H3：理解内连接、外连接和结果基数
- H2：ON 与 WHERE
  - H3：避免把外连接意外改成内连接
- H2：标量、行与表子查询
  - H3：识别返回形状和错误边界
- H2：EXISTS、IN 与 NULL
  - H3：选择存在性写法并避免 NOT IN 陷阱
- H2：派生表与 LATERAL
  - H3：组织相关计算和逐行派生结果
- H2：集合运算与关系除法
  - H3：查询购买指定商品集合全部商品的用户

## 验证方式

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：用 users、orders、order_items、products 和 employees 完成无订单用户、每组最高薪、指定商品全集与 NULL 反例。
- 失败边界与踩坑：目标商品集合固定为 101/102/103 且非空；seed 同时包含全买、少买、重复购买和无订单用户。
- FAQ 候选与来源：SO-5706437、SO-7745609 用于连接与每组最值题型发现。
- 自测形式：SQL 卡 mysql84-05-users-without-orders-p1、mysql84-05-groupwise-max-p1、mysql84-05-relational-division-p1、mysql84-05-not-in-null-p1。
- 可视化：连接基数图、EXISTS/IN 决策表和关系除法集合图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/join.html
- https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html
- https://dev.mysql.com/doc/refman/8.4/en/correlated-subqueries.html
- https://dev.mysql.com/doc/refman/8.4/en/set-operations.html

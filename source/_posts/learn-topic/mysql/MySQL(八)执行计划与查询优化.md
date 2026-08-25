---
title: MySQL(八)执行计划与查询优化
tags:
  - MySQL
  - 执行计划与查询优化
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 使用统计信息、EXPLAIN ANALYZE、Performance Schema 和 sys 建立发现、改写、复测的查询优化闭环。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 8
published: false
abbrlink: 3bb0fc53
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：怎样用执行证据而不是经验猜测优化慢 SQL。
- 学习成果：能够阅读访问类型、估算与实际行数、排序临时表和索引选择，并验证优化收益。
- 前置文章：MySQL(五)多表查询与子查询、MySQL(六)CTE与窗口函数、MySQL(七)索引原理与设计
- 能力分配：

- 执行计划与优化闭环：`refman8.4:optimize-overview`、`refman8.4:select-optimization`、`refman8.4:subquery-optimization`、`refman8.4:internal-temporary-tables`、`refman8.4:optimizing-innodb-queries`、`refman8.4:using-explain`、`refman8.4:explain-output`、`refman8.4:explain-extended`、`refman8.4:controlling-optimizer`、`refman8.4:optimizer-hints`、`refman8.4:index-hints`、`refman8.4:cost-model`、`refman8.4:optimizer-statistics`、`refman8.4:monitoring-performance-schema`、`refman8.4:optimizer-tracing`、`refman8.4:performance-schema-quick-start`、`refman8.4:performance-schema-queries`、`refman8.4:performance-schema-statement-digests`、`refman8.4:performance-schema-query-profiling`、`refman8.4:sys-schema-usage`、`refman8.4:sys-schema-views`
- 优化专项边界：`refman8.4:optimize-data-types`、`refman8.4:optimizing-innodb-transaction-management`、`refman8.4:optimizing-innodb-bulk-data-loading`、`refman8.4:optimizing-innodb-ddl-operations`、`refman8.4:optimizing-innodb-diskio`、`refman8.4:optimizing-innodb-configuration-variables`

## 章节计划

- H2：优化器与统计信息
  - H3：理解成本估算和数据分布
- H2：EXPLAIN 与 EXPLAIN ANALYZE
  - H3：对比计划、估算与真实执行
- H2：访问方式与连接顺序
  - H3：识别扫描、索引查找和连接策略
- H2：SARGable 条件
  - H3：改写函数、类型和范围条件
- H2：排序、分组与分页
  - H3：处理 filesort、临时表和深分页
- H2：Performance Schema 与 sys
  - H3：从 digest 和视图定位高成本语句
- H2：优化闭环
  - H3：固定基线、单点改动、复测和回退

## 验证方式

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：对日期函数过滤与深分页各做一次优化前后执行计划对照，核对结果集完全相同。
- 失败边界与踩坑：不以 type 一项判定好坏；区分估算与实际、缓存影响、数据量不足和提示器副作用。
- FAQ 候选与来源：为什么加了索引仍不使用；EXPLAIN ANALYZE 为什么可能真的执行语句。
- 自测形式：SQL 卡 mysql84-08-sargable-rewrite-p1、mysql84-08-keyset-pagination-p1。
- 可视化：优化闭环图、EXPLAIN 前后对照表和分页路径图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/using-explain.html
- https://dev.mysql.com/doc/refman/8.4/en/explain-output.html
- https://dev.mysql.com/doc/refman/8.4/en/optimizer-statistics.html
- https://dev.mysql.com/doc/refman/8.4/en/performance-schema-statement-digests.html

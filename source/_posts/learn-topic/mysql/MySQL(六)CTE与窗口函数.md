---
title: MySQL(六)CTE与窗口函数
tags:
  - MySQL
  - CTE与窗口函数
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 使用 CTE、递归查询和窗口函数完成分组排名、累计值、去重与连续登录分析。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 6
published: false
abbrlink: 3211416c
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：怎样在保留明细行的同时完成跨行计算和多阶段查询。
- 学习成果：能够设计 CTE、窗口分区、排序和 frame，并验证排名、累计和连续区间。
- 前置文章：MySQL(五)多表查询与子查询
- 能力分配：

- CTE与窗口函数：`refman8.4:with`、`refman8.4:window-functions`、`refman8.4:window-function-descriptions`、`refman8.4:window-functions-usage`、`refman8.4:window-functions-frames`、`refman8.4:window-functions-named-windows`、`refman8.4:window-function-restrictions`

## 正文大纲

- H2：CTE 与查询分解
  - H3：用 WITH 表达多阶段查询
- H2：递归 CTE
  - H3：定义锚点、递归项和终止条件
- H2：窗口分区与排序
  - H3：理解 PARTITION BY 和 ORDER BY
- H2：排名与偏移函数
  - H3：使用 ROW_NUMBER、RANK、LAG 和 LEAD
- H2：聚合窗口与 frame
  - H3：区分默认 frame、ROWS 和 RANGE
- H2：命名窗口与限制
  - H3：复用窗口定义并识别不可用位置

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：完成部门 Top N、重复记录标记、累计销售额和连续登录区间，并比较窗口前后的行数。
- 失败边界与踩坑：覆盖并列排名、同日多次登录、frame 默认值、递归终止和最终稳定排序。
- FAQ 候选与来源：为什么窗口函数不减少明细行；ROW_NUMBER、RANK 与 DENSE_RANK 如何选择。
- 自测形式：SQL 卡 mysql84-06-topn-per-group-p1、mysql84-06-deduplicate-row-number-p2、mysql84-06-running-total-p1、mysql84-06-consecutive-login-p1。
- 可视化：窗口分区图、frame 时间线和连续区间分组图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/with.html
- https://dev.mysql.com/doc/refman/8.4/en/window-functions.html
- https://dev.mysql.com/doc/refman/8.4/en/window-functions-frames.html
- https://dev.mysql.com/doc/refman/8.4/en/window-function-restrictions.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

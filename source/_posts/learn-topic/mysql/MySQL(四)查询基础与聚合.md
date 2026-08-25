---
title: MySQL(四)查询基础与聚合
tags:
  - MySQL
  - 查询基础与聚合
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从 SELECT 逻辑顺序、NULL 和表达式推进到聚合、HAVING、排序与分页，写出结果确定的查询。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 4
published: false
abbrlink: 80283a7e
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：怎样写出语义正确、结果稳定且能解释的单表与聚合查询。
- 学习成果：能够处理 NULL、类型转换、分组约束、并列结果和稳定排序。
- 前置文章：MySQL(三)数据写入与约束
- 能力分配：

- 查询基础与聚合：`refman8.4:select`、`refman8.4:expressions`、`refman8.4:type-conversion`、`refman8.4:non-typed-operators`、`refman8.4:operator-precedence`、`refman8.4:comparison-operators`、`refman8.4:logical-operators`、`refman8.4:flow-control-functions`、`refman8.4:numeric-functions`、`refman8.4:date-and-time-functions`、`refman8.4:string-functions`、`refman8.4:cast-functions`、`refman8.4:aggregate-functions-and-modifiers`、`refman8.4:aggregate-functions`、`refman8.4:group-by-functional-dependence`、`refman8.4:order-by-optimization`
- 函数选择边界：`refman8.4:bit-functions`、`refman8.4:encryption-functions`、`refman8.4:information-functions`、`refman8.4:miscellaneous-functions`

## 正文大纲

- H2：SELECT 逻辑执行顺序
  - H3：理解 FROM、WHERE、GROUP BY、HAVING、SELECT、ORDER BY
- H2：表达式与 NULL
  - H3：掌握比较、逻辑运算、CASE 和三值逻辑
- H2：常用函数与类型转换
  - H3：处理字符串、日期、数值和显式转换
- H2：聚合与 GROUP BY
  - H3：计算计数、金额和去重指标
- H2：HAVING 与条件聚合
  - H3：区分行过滤和组过滤
- H2：排序与分页
  - H3：增加确定性排序并解释 OFFSET 成本

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：基于员工和订单数据计算第二高薪、月度销售额和多状态条件聚合，给出固定期望结果。
- 失败边界与踩坑：覆盖并列薪资、空集合、NULL、ONLY_FULL_GROUP_BY 和非稳定排序。
- FAQ 候选与来源：SO-23921117 只用于发现 GROUP BY 常见误区，不以关闭严格模式作为默认解法。
- 自测形式：SQL 卡 mysql84-04-second-highest-salary-p1、mysql84-04-monthly-sales-p1、mysql84-04-conditional-aggregation-p2。
- 可视化：SELECT 逻辑顺序图、NULL 真值表和聚合输入输出表。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/select.html
- https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html
- https://dev.mysql.com/doc/refman/8.4/en/group-by-functional-dependence.html
- https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

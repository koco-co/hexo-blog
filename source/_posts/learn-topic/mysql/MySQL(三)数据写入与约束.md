---
title: MySQL(三)数据写入与约束
tags:
  - MySQL
  - 数据写入与约束
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 掌握 INSERT、UPSERT、UPDATE、DELETE、约束失败、隐式提交和受控写入，避免不可恢复的数据修改。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 3
published: false
abbrlink: 4df9aab4
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：怎样在约束和事务边界内安全地写入、修改与删除数据。
- 学习成果：能够编写 UPSERT 和受控 UPDATE/DELETE，并根据错误与影响行数决定提交或回滚。
- 前置文章：MySQL(二)数据库基础与表设计
- 能力分配：

- 写入与约束：`refman8.4:atomic-ddl`、`refman8.4:alter-table`、`refman8.4:truncate-table`、`refman8.4:insert`、`refman8.4:insert-select`、`refman8.4:insert-on-duplicate`、`refman8.4:update`、`refman8.4:delete`、`refman8.4:replace`、`refman8.4:load-data`、`refman8.4:foreign-key-optimization`、`refman8.4:implicit-commit`、`refman8.4:error-handling`
- 写入边界：`refman8.4:import-table`、`refman8.4:values`、`refman8.4:parenthesized-query-expressions`

## 正文大纲

- H2：写入前的约束边界
  - H3：区分默认值、唯一、外键和 CHECK
- H2：INSERT 与批量写入
  - H3：处理单行、多行、INSERT SELECT 和导入
- H2：UPSERT 与替换语义
  - H3：比较 ON DUPLICATE KEY UPDATE、IGNORE 和 REPLACE
- H2：受控 UPDATE 与 DELETE
  - H3：先预览主键集合、核对影响行数并决定提交
- H2：TRUNCATE、DDL 与隐式提交
  - H3：识别不能按普通 DML 回滚的边界
- H2：错误处理与验证
  - H3：用失败矩阵检查数据是否保持一致

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：完成库存 UPSERT、受控状态更新和重复导入记录清理，并逐步核对影响行数与最终数据。
- 失败边界与踩坑：guarded-update 不启用 sql_safe_updates；重点是精确 WHERE、同一事务内预览和结果核对。
- FAQ 候选与来源：UPSERT 与目标表更新限制采用 SO-4205181、SO-45494 作为问题线索。
- 自测形式：SQL 卡 mysql84-03-upsert-stock-p1、mysql84-03-guarded-update-p1、mysql84-03-deduplicate-delete-p2。
- 可视化：写入失败矩阵、约束触发顺序和提交边界时间线。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/insert.html
- https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html
- https://dev.mysql.com/doc/refman/8.4/en/update.html
- https://dev.mysql.com/doc/refman/8.4/en/delete.html
- https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

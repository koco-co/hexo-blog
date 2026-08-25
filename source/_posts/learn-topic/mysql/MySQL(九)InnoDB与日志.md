---
title: MySQL(九)InnoDB与日志
tags:
  - MySQL
  - InnoDB与日志
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 理解 Buffer Pool、redo、undo、doublewrite、checkpoint、binlog 和崩溃恢复，建立持久化写入链路。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 9
published: false
abbrlink: b67bacc6
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：一条写入如何从内存变成可恢复的数据，以及不同日志各自负责什么。
- 学习成果：能够解释脏页、WAL、undo、binlog、两阶段提交和崩溃恢复的职责边界。
- 前置文章：MySQL(七)索引原理与设计
- 能力分配：

- 存储与日志链路：`refman8.4:innodb-storage-engine`、`refman8.4:innodb-architecture`、`refman8.4:innodb-buffer-pool`、`refman8.4:innodb-buffer-pool-optimization`、`refman8.4:innodb-redo-log`、`refman8.4:innodb-undo-logs`、`refman8.4:innodb-doublewrite-buffer`、`refman8.4:innodb-checkpoints`、`refman8.4:innodb-recovery`、`refman8.4:innodb-tablespace`、`refman8.4:innodb-row-format`、`refman8.4:innodb-change-buffer`、`refman8.4:binary-log`
- 8.4运行边界：`refman8.4:optimizing-innodb-logging`、`refman8.4:innodb-dedicated-server`

## 章节计划

- H2：InnoDB 架构
  - H3：定位内存、线程、表空间与日志
- H2：页与 Buffer Pool
  - H3：理解缓存、脏页和刷盘
- H2：redo 与 checkpoint
  - H3：理解 WAL 和恢复起点
- H2：undo 与多版本
  - H3：理解回滚和历史版本来源
- H2：doublewrite 与部分页写
  - H3：识别页完整性保护
- H2：binlog 与 redo
  - H3：区分复制恢复日志与引擎恢复日志
- H2：两阶段提交与崩溃恢复
  - H3：追踪提交各阶段的恢复判断

## 验证方式

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：沿一次订单状态更新追踪 Buffer Pool、undo、redo、binlog、提交和宕机后的恢复决策。
- 失败边界与踩坑：不把 binlog 当 redo，也不把事务提交等同于数据页立刻落盘。
- FAQ 候选与来源：为什么有 redo 还需要 doublewrite；为什么备份恢复仍需要 binlog。
- 自测形式：机制闪卡覆盖 redo/undo/binlog、checkpoint、doublewrite 和两阶段提交。
- 可视化：redo、undo、binlog 写入链和崩溃恢复决策图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/innodb-architecture.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-undo-logs.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-recovery.html
- https://dev.mysql.com/doc/refman/8.4/en/binary-log.html

---
title: MySQL(十四)进阶路线
tags:
  - MySQL
  - 进阶路线
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 按存储对象、JSON与分区、监控、复制专项和 8.0→8.4 迁移五条分支选择后续能力。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 14
published: false
abbrlink: 5ad9ac4a
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：完成核心课程后，怎样按真实业务需要选择专项而不盲目堆叠数据库功能。
- 学习成果：能够判断专项进入条件、收益、风险和前置，并制定 8.0→8.4 迁移方案。
- 前置文章：按分支选择：存储对象依赖 A03/A05/A12；JSON与分区依赖 A02/A07/A08；监控依赖 A08/A09/A11；复制依赖 A13；迁移依赖 A01/A12/A13
- 能力分配：

- 复制专项：`refman8.4:replication-solutions-scaleout`、`refman8.4:replication-solutions-performance`、`refman8.4:replication-delayed`、`refman8.4:replication-asynchronous-connection-failover`、`refman8.4:replication-semisync`、`refman8.4:replication-compatibility`、`refman8.4:replication-upgrade`
- 8.0到8.4迁移：`refman8.4:upgrade-paths`、`refman8.4:upgrade-prerequisites`
- 存储对象：`refman8.4:stored-objects`、`refman8.4:stored-programs-defining`、`refman8.4:stored-routines`、`refman8.4:stored-routines-syntax`、`refman8.4:triggers`、`refman8.4:trigger-syntax`、`refman8.4:event-scheduler`、`refman8.4:events-overview`、`refman8.4:events-syntax`、`refman8.4:views`、`refman8.4:view-syntax`、`refman8.4:view-algorithms`、`refman8.4:view-updatability`、`refman8.4:view-check-option`、`refman8.4:stored-objects-security`、`refman8.4:stored-program-restrictions`、`refman8.4:view-restrictions`
- JSON全文空间：`refman8.4:json-functions`、`refman8.4:json-table-functions`、`refman8.4:json-validation-functions`、`refman8.4:fulltext-search`、`refman8.4:spatial-types`、`refman8.4:spatial-analysis-functions`
- 分区：`refman8.4:partitioning`、`refman8.4:partitioning-overview`、`refman8.4:partitioning-types`、`refman8.4:partitioning-range`、`refman8.4:partitioning-list`、`refman8.4:partitioning-columns`、`refman8.4:partitioning-hash`、`refman8.4:partitioning-key`、`refman8.4:partitioning-subpartitions`、`refman8.4:partitioning-management`、`refman8.4:partitioning-pruning`、`refman8.4:partitioning-selection`、`refman8.4:partitioning-limitations`
- 监控与其他引擎：`refman8.4:information-schema`、`refman8.4:information-schema-table-reference`、`refman8.4:performance-schema`、`refman8.4:performance-schema-table-reference`、`refman8.4:performance-schema-examples`、`refman8.4:sys-schema`、`refman8.4:sys-schema-reference`、`refman8.4:storage-engines`

## 章节计划

- H2：存储对象分支
  - H3：视图、存储过程、触发器和事件的选择边界
- H2：JSON、全文、空间与分区
  - H3：识别非关系数据和大表管理专项
- H2：监控与其他引擎
  - H3：使用元数据、Performance Schema、sys 并识别引擎边界
- H2：复制专项
  - H3：延迟、半同步、扩展和故障切换
- H2：8.0 到 8.4 迁移
  - H3：检查受支持路径、预检、备份和回滚
- H2：迁移方式决策
  - H3：区分公式安装、原地升级、dump/load 和复制迁移

## 验证方式

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：根据三个系统画像选择是否采用分区、存储过程或延迟副本；为 8.0 实例制定迁移与回退检查表。
- 失败边界与踩坑：formula 安装不等于数据升级；每条分支都有前置和退出条件；A15 不依赖本篇。
- FAQ 候选与来源：什么时候不该用触发器或分区；8.0 是否能直接升级以及失败如何恢复。
- 自测形式：以方向选择、风险判断和升级方案比较卡为主，不把低频能力混入核心 SQL 面试卡。
- 可视化：进阶方向选择树、迁移方式决策表和升级检查时间线。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/stored-objects.html
- https://dev.mysql.com/doc/refman/8.4/en/partitioning.html
- https://dev.mysql.com/doc/refman/8.4/en/performance-schema.html
- https://dev.mysql.com/doc/refman/8.4/en/replication-upgrade.html
- https://dev.mysql.com/doc/refman/8.4/en/upgrade-paths.html
- https://dev.mysql.com/doc/refman/8.4/en/upgrade-prerequisites.html

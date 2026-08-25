---
title: MySQL(十三)备份恢复与复制
tags:
  - MySQL
  - 备份恢复与复制
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 用统一 RecoverLab 串起一致备份、binlog、隔离 PITR、GTID 与复制，验证误删后的可恢复性。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 13
published: false
abbrlink: ec639b75
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：当误删已经传播到副本时，怎样从备份和 binlog 恢复到事故前。
- 学习成果：能够记录备份坐标、确定重放起止点、隔离恢复、验证数据，并解释复制不是备份。
- 前置文章：MySQL(九)InnoDB与日志、MySQL(十)事务与MVCC、MySQL(十二)安全与权限
- 能力分配：

- 统一RecoverLab：`refman8.4:backup-and-recovery`、`refman8.4:backup-types`、`refman8.4:backup-methods`、`refman8.4:backup-strategy-example`、`refman8.4:backup-policy`、`refman8.4:recovery-from-backups`、`refman8.4:using-mysqldump`、`refman8.4:mysqldump-sql-format`、`refman8.4:reloading-sql-format-dumps`、`refman8.4:mysqldump-tips`、`refman8.4:point-in-time-recovery`、`refman8.4:point-in-time-recovery-binlog`、`refman8.4:point-in-time-recovery-positions`、`refman8.4:replication`、`refman8.4:replication-configuration`、`refman8.4:replication-formats`、`refman8.4:replication-implementation`、`refman8.4:replication-channels`、`refman8.4:replication-threads`、`refman8.4:replica-logs`、`refman8.4:replication-security`、`refman8.4:replication-solutions-backups`、`refman8.4:replication-solutions-rbr-monitoring`、`refman8.4:replication-problems`、`refman8.4:gtid-functions`、`refman8.4:replication-gtids`、`refman8.4:replication-gtids-howto`、`refman8.4:change-replication-source-to`、`refman8.4:start-replica`、`refman8.4:stop-replica`、`refman8.4:show-replica-status`、`refman8.4:replication-options-binary-log#sysvar_binlog_expire_logs_seconds`、`refman8.4:purge-binary-logs`、`refman8.4:reset-binary-logs-and-gtids`、`refman8.4:mysqldump`、`refman8.4:mysqlbinlog`
- binlog格式迁移：`refman8.4:replication-options-binary-log#sysvar_binlog_format`

## 正文大纲

- H2：恢复目标与备份策略
  - H3：定义 RPO、RTO、备份类型和保留期
- H2：一致性逻辑备份
  - H3：生成单事务备份并记录日志坐标
- H2：binlog 与时间点恢复
  - H3：定位误删事件前停止位置
- H2：隔离恢复与验证
  - H3：从空库导入并按起止位置重放
- H2：复制最小链路
  - H3：理解 source、replica、线程和状态
- H2：GTID 与位置复制
  - H3：识别两种定位方式的边界
- H2：日志保留与高风险命令
  - H3：迁移旧命令并明确清理风险
- H2：统一 RecoverLab
  - H3：复现误删传播和隔离 PITR

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：周日备份记录坐标，周三 DELETE 传播到副本；在隔离库恢复并重放到错误前，核对行数、金额和 checksum。
- 失败边界与踩坑：日志保留覆盖事故区间；使用备份记录的 start position 和事故前 stop position；RESET BINARY LOGS AND GTIDS 必须带破坏性警告。
- FAQ 候选与来源：SO-105776 用于 dump 恢复入口问题；正文必须继续验证一致性、坐标和增量重放。
- 自测形式：机制与场景卡覆盖复制不是备份、PITR 起止点、恢复验证和 GTID。
- 可视化：备份—误删—恢复时间线，以及 source—replica—隔离恢复库关系图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html
- https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html
- https://dev.mysql.com/doc/refman/8.4/en/mysqlbinlog.html
- https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery-positions.html
- https://dev.mysql.com/doc/refman/8.4/en/replication-gtids.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

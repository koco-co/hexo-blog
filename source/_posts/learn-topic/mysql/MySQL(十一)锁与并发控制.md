---
title: MySQL(十一)锁与并发控制
tags:
  - MySQL
  - 锁与并发控制
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 掌握记录锁、Gap Lock、Next-Key Lock、锁定读、元数据锁和死锁诊断，解决超卖与任务争抢。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 11
published: false
abbrlink: b829023d
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：并发写入为什么阻塞或超卖，以及怎样判断锁住了记录、区间还是元数据。
- 学习成果：能够设计锁定读、识别等待关系、处理死锁，并解释 NOWAIT 与 SKIP LOCKED 的边界。
- 前置文章：MySQL(十)事务与MVCC
- 能力分配：

- 锁与并发控制：`refman8.4:innodb-next-key-locking`、`refman8.4:innodb-locking`、`refman8.4:innodb-locking#innodb-shared-exclusive-locks`、`refman8.4:innodb-locking#innodb-intention-locks`、`refman8.4:innodb-locking#innodb-record-locks`、`refman8.4:innodb-locking#innodb-gap-locks`、`refman8.4:innodb-locking#innodb-next-key-locks`、`refman8.4:innodb-locking#innodb-insert-intention-locks`、`refman8.4:innodb-locking#innodb-auto-inc-locks`、`refman8.4:innodb-locks-set`、`refman8.4:innodb-locking-reads`、`refman8.4:innodb-deadlocks`、`refman8.4:innodb-deadlock-detection`、`refman8.4:performance-schema-lock-tables`、`refman8.4:information-schema-innodb-trx-table`、`refman8.4:metadata-locking`
- 锁诊断边界：`refman8.4:internal-locking`、`refman8.4:locking-issues`

## 正文大纲

- H2：锁模式与意向锁
  - H3：理解 S、X 和表级意向锁
- H2：记录、间隙与 Next-Key Lock
  - H3：用索引区间解释锁范围
- H2：语句设置哪些锁
  - H3：根据索引、条件和隔离级别分析
- H2：锁定读
  - H3：使用 FOR SHARE、FOR UPDATE、NOWAIT、SKIP LOCKED
- H2：插入意向、自增与元数据锁
  - H3：识别写入和 DDL 阻塞
- H2：等待诊断与死锁
  - H3：使用事务与锁视图构建等待图
- H2：库存与任务队列实验
  - H3：验证防超卖和并发领取

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：双会话扣减库存并观察等待；再用 SKIP LOCKED 演示多 worker 领取不同任务。
- 失败边界与踩坑：说明 FOR SHARE 对旧 LOCK IN SHARE MODE 的迁移；SKIP LOCKED 适合队列而非一致业务查询。
- FAQ 候选与来源：为什么命中索引仍锁住区间；死锁检测和锁等待超时有什么不同。
- 自测形式：SQL 卡 mysql84-11-stock-for-update-p1、mysql84-11-skip-locked-worker-p2。
- 可视化：记录与间隙锁区间图、事务等待图和双会话时序图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html
- https://dev.mysql.com/doc/refman/8.4/en/metadata-locking.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

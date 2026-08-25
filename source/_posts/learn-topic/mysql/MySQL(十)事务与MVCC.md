---
title: MySQL(十)事务与MVCC
tags:
  - MySQL
  - 事务与MVCC
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从事务边界、隔离异常、版本链和 Read View 理解一致性读，并用失败回滚验证业务原子性。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 10
published: false
abbrlink: 1c1b06f2
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：并发事务为什么会看到不同数据，以及怎样选择正确事务边界和隔离级别。
- 学习成果：能够解释 ACID、隔离异常、Read View、版本可见性和一致性读，并设计可回滚业务。
- 前置文章：MySQL(九)InnoDB与日志
- 能力分配：

- 事务与MVCC：`refman8.4:sql-transactional-statements`、`refman8.4:commit`、`refman8.4:cannot-roll-back`、`refman8.4:savepoint`、`refman8.4:set-transaction`、`refman8.4:innodb-transaction-model`、`refman8.4:innodb-transaction-isolation-levels`、`refman8.4:innodb-consistent-read`、`refman8.4:innodb-multi-versioning`、`refman8.4:mysql-acid`
- 事务扩展：`refman8.4:xa`、`refman8.4:xa-states`、`refman8.4:xa-restrictions`

## 章节计划

- H2：事务边界与 ACID
  - H3：识别开始、提交、回滚和不可回滚操作
- H2：并发异常
  - H3：区分脏读、不可重复读和幻读现象
- H2：隔离级别
  - H3：比较 READ COMMITTED 与 REPEATABLE READ
- H2：undo 版本链
  - H3：追踪记录历史版本
- H2：Read View 与可见性
  - H3：判断事务能看到哪个版本
- H2：一致性读与当前读概念
  - H3：把读取现象与后续锁篇衔接
- H2：失败回滚实验
  - H3：验证订单与明细的业务原子性

## 验证方式

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：单会话创建订单与明细，故意触发 CHECK 失败后回滚并核对两张表均未留下半成品。
- 失败边界与踩坑：本文不使用显式锁；幻读只讲现象和 MVCC 可见性，Next-Key Lock 归入下一篇。
- FAQ 候选与来源：自动提交是否等于没有事务；一致性读为什么可能看不到刚由别的事务提交的数据。
- 自测形式：SQL 卡 mysql84-10-order-rollback-p1；机制卡覆盖隔离级别与 Read View。
- 可视化：undo 版本链、Read View 可见性表和双会话时间线。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/commit.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html

---
title: MySQL(十五)综合实战
tags:
  - MySQL
  - 综合实战
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 通过 20 道确定输出的 ShopLab 场景题综合验证建模、SQL、优化、事务、锁、权限和恢复能力。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 15
published: false
abbrlink: e11b5c6b
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：怎样在一套接近面试的业务数据上证明自己能写 SQL、解释机制并验证结果。
- 学习成果：能够从需求到 DDL、查询、执行计划、并发和恢复完整作答，并按评分矩阵复盘。
- 前置文章：MySQL(二)至MySQL(十三)；MySQL(十四)进阶路线为可选
- 能力分配：

- 本文不新分配官方能力条目；复用 A02～A13 已冻结能力完成综合验收。

## 正文大纲

- H2：实验初始化
  - H3：导入九表 ShopLab 与固定 seed
- H2：建模与写入题
  - H3：完成 DDL、UPSERT 和受控修改
- H2：查询与分析题
  - H3：完成聚合、连接、子查询、窗口和留存
- H2：索引与优化题
  - H3：解释执行计划并验证改写
- H2：事务与并发题
  - H3：验证回滚、防超卖和等待
- H2：安全与恢复题
  - H3：设计角色并给出 RecoverLab 恢复步骤
- H2：模拟面试与评分
  - H3：按正确性、边界、性能和验证评分

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：从空库导入固定数据，连续完成 20 道场景题；每题保存 SQL、确定结果、解释和验证证据。
- 失败边界与踩坑：19 个 flashcard_ref 只引用前置已定义卡，排除窗口去重和 SKIP LOCKED；新增 1 道留存分析原始卡，总计 20 题。
- FAQ 候选与来源：答案正确但排序不稳定是否算通过；如何在没有大数据量时解释性能结论。
- 自测形式：19 个前置 SQL 场景引用加 mysql84-15-retention-cohort-p1；统一卡组 mysql-8.4-interview。
- 可视化：综合任务链、结果核对表和面试评分矩阵。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/select.html
- https://dev.mysql.com/doc/refman/8.4/en/with.html
- https://dev.mysql.com/doc/refman/8.4/en/using-explain.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html
- https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

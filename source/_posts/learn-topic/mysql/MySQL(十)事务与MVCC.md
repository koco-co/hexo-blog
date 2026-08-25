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

## 文章职责

- 唯一要解决的问题：并发事务为什么会看到不同数据，以及怎样选择正确事务边界和隔离级别。
- 可观察成果：能够解释 ACID、隔离异常、Read View、版本可见性和一致性读，并设计可回滚业务。
- 进入条件：MySQL(九)InnoDB与日志
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 事务与MVCC：`refman8.4:sql-transactional-statements`、`refman8.4:commit`、`refman8.4:cannot-roll-back`、`refman8.4:savepoint`、`refman8.4:set-transaction`、`refman8.4:innodb-transaction-model`、`refman8.4:innodb-transaction-isolation-levels`、`refman8.4:innodb-consistent-read`、`refman8.4:innodb-multi-versioning`、`refman8.4:mysql-acid`
- 事务扩展：`refman8.4:xa`、`refman8.4:xa-states`、`refman8.4:xa-restrictions`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 事务边界与 ACID | 判断事务边界与 ACID | 识别开始、提交、回滚和不可回滚操作 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 并发异常 | 判断并发异常 | 区分脏读、不可重复读和幻读现象 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 隔离级别 | 建立隔离级别的心智模型 | 比较 READ COMMITTED 与 REPEATABLE READ | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| undo 版本链 | 建立undo 版本链的心智模型 | 追踪记录历史版本 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| Read View 与可见性 | 建立Read View 与可见性的心智模型 | 判断事务能看到哪个版本 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 一致性读与当前读概念 | 建立一致性读与当前读概念的心智模型 | 把读取现象与后续锁篇衔接 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 失败回滚实验 | 完成并验证失败回滚实验 | 验证订单与明细的业务原子性 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：单会话创建订单与明细，故意触发 CHECK 失败后回滚并核对两张表均未留下半成品。
- 失败边界与踩坑：本文不使用显式锁；幻读只讲现象和 MVCC 可见性，Next-Key Lock 归入下一篇。
- FAQ 候选与来源：自动提交是否等于没有事务；一致性读为什么可能看不到刚由别的事务提交的数据。
- 非复习自测：SQL 卡 mysql84-10-order-rollback-p1；机制卡覆盖隔离级别与 Read View。
- 图表或实验：undo 版本链、Read View 可见性表和双会话时间线。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/commit.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

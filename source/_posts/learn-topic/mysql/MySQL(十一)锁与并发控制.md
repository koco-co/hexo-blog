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

## 文章职责

- 唯一要解决的问题：并发写入为什么阻塞或超卖，以及怎样判断锁住了记录、区间还是元数据。
- 可观察成果：能够设计锁定读、识别等待关系、处理死锁，并解释 NOWAIT 与 SKIP LOCKED 的边界。
- 进入条件：MySQL(十)事务与MVCC
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 锁与并发控制：`refman8.4:innodb-next-key-locking`、`refman8.4:innodb-locking`、`refman8.4:innodb-locking#innodb-shared-exclusive-locks`、`refman8.4:innodb-locking#innodb-intention-locks`、`refman8.4:innodb-locking#innodb-record-locks`、`refman8.4:innodb-locking#innodb-gap-locks`、`refman8.4:innodb-locking#innodb-next-key-locks`、`refman8.4:innodb-locking#innodb-insert-intention-locks`、`refman8.4:innodb-locking#innodb-auto-inc-locks`、`refman8.4:innodb-locks-set`、`refman8.4:innodb-locking-reads`、`refman8.4:innodb-deadlocks`、`refman8.4:innodb-deadlock-detection`、`refman8.4:performance-schema-lock-tables`、`refman8.4:information-schema-innodb-trx-table`、`refman8.4:metadata-locking`
- 锁诊断边界：`refman8.4:internal-locking`、`refman8.4:locking-issues`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 锁模式与意向锁 | 建立锁模式与意向锁的心智模型 | 理解 S、X 和表级意向锁 | `mermaid` | 锁兼容关系和表级意向需要用关系图建立整体模型 | 图前定义、兼容结论和等待边界 | 图表失效时由兼容矩阵和文字结论兜底 | S/X/IS/IX 的兼容关系与双会话证据 | 计划 |
| 记录、间隙与 Next-Key Lock | 判断索引区间的锁范围 | 用索引区间解释锁范围 | `mermaid` | 记录、间隙和 Next-Key Lock 是连续索引区间关系 | 查询条件、命中区间和边界结论 | 图表失效时用有序区间清单兜底 | 唯一索引、范围查询与不存在记录对照 | 计划 |
| 语句设置哪些锁 | 比较不同语句的加锁结果 | 根据索引、条件和隔离级别分析 | `Markdown 表格` | 需要同时比较语句、索引命中、隔离级别和锁范围 | 比较维度、默认结论和例外条件 | 纯文本表格仍可完成判断 | SELECT/UPDATE/DELETE 的双会话对照 | 计划 |
| 锁定读 | 为并发任务选择锁定读方式 | 使用 FOR SHARE、FOR UPDATE、NOWAIT、SKIP LOCKED | `Markdown 表格` | 四种语义是平行选择，先按等待与一致性要求比较 | 选择标准、阻塞行为和不适用条件 | 纯文本表格保留选型依据 | 库存扣减与任务领取的对照实验 | 计划 |
| 插入意向、自增与元数据锁 | 建立插入意向、自增与元数据锁的心智模型 | 识别写入和 DDL 阻塞 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 等待诊断与死锁 | 定位等待链和死锁环 | 使用事务与锁视图构建等待图 | `mermaid` | 等待者、持有者和资源之间是可追踪的有向关系 | 会话、锁资源、等待方向和解除结果 | 图表失效时由会话清单和查询结果兜底 | performance_schema 查询与双会话时间线 | 计划 |
| 库存与任务队列实验 | 完成并验证库存与任务队列实验 | 验证防超卖和并发领取 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：双会话扣减库存并观察等待；再用 SKIP LOCKED 演示多 worker 领取不同任务。
- 失败边界与踩坑：说明 FOR SHARE 对旧 LOCK IN SHARE MODE 的迁移；SKIP LOCKED 适合队列而非一致业务查询。
- FAQ 候选与来源：为什么命中索引仍锁住区间；死锁检测和锁等待超时有什么不同。
- 非复习自测：SQL 卡 mysql84-11-stock-for-update-p1、mysql84-11-skip-locked-worker-p2。
- 图表或实验：记录与间隙锁区间图、事务等待图和双会话时序图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html
- https://dev.mysql.com/doc/refman/8.4/en/metadata-locking.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

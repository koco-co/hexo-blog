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

## 文章职责

- 唯一要解决的问题：当误删已经传播到副本时，怎样从备份和 binlog 恢复到事故前。
- 可观察成果：能够记录备份坐标、确定重放起止点、隔离恢复、验证数据，并解释复制不是备份。
- 进入条件：MySQL(九)InnoDB与日志、MySQL(十)事务与MVCC、MySQL(十二)安全与权限
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 统一RecoverLab：`refman8.4:backup-and-recovery`、`refman8.4:backup-types`、`refman8.4:backup-methods`、`refman8.4:backup-strategy-example`、`refman8.4:backup-policy`、`refman8.4:recovery-from-backups`、`refman8.4:using-mysqldump`、`refman8.4:mysqldump-sql-format`、`refman8.4:reloading-sql-format-dumps`、`refman8.4:mysqldump-tips`、`refman8.4:point-in-time-recovery`、`refman8.4:point-in-time-recovery-binlog`、`refman8.4:point-in-time-recovery-positions`、`refman8.4:replication`、`refman8.4:replication-configuration`、`refman8.4:replication-formats`、`refman8.4:replication-implementation`、`refman8.4:replication-channels`、`refman8.4:replication-threads`、`refman8.4:replica-logs`、`refman8.4:replication-security`、`refman8.4:replication-solutions-backups`、`refman8.4:replication-solutions-rbr-monitoring`、`refman8.4:replication-problems`、`refman8.4:gtid-functions`、`refman8.4:replication-gtids`、`refman8.4:replication-gtids-howto`、`refman8.4:change-replication-source-to`、`refman8.4:start-replica`、`refman8.4:stop-replica`、`refman8.4:show-replica-status`、`refman8.4:replication-options-binary-log#sysvar_binlog_expire_logs_seconds`、`refman8.4:purge-binary-logs`、`refman8.4:reset-binary-logs-and-gtids`、`refman8.4:mysqldump`、`refman8.4:mysqlbinlog`
- binlog格式迁移：`refman8.4:replication-options-binary-log#sysvar_binlog_format`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 恢复目标与备份策略 | 建立恢复目标与备份策略的心智模型 | 定义 RPO、RTO、备份类型和保留期 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 一致性逻辑备份 | 建立一致性逻辑备份的心智模型 | 生成单事务备份并记录日志坐标 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| binlog 与时间点恢复 | 建立binlog 与时间点恢复的心智模型 | 定位误删事件前停止位置 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 隔离恢复与验证 | 完成并验证隔离恢复与验证 | 从空库导入并按起止位置重放 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 复制最小链路 | 建立复制最小链路的心智模型 | 理解 source、replica、线程和状态 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| GTID 与位置复制 | 建立GTID 与位置复制的心智模型 | 识别两种定位方式的边界 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 日志保留与高风险命令 | 判断日志保留与高风险命令 | 迁移旧命令并明确清理风险 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 统一 RecoverLab | 建立统一 RecoverLab的心智模型 | 复现误删传播和隔离 PITR | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：周日备份记录坐标，周三 DELETE 传播到副本；在隔离库恢复并重放到错误前，核对行数、金额和 checksum。
- 失败边界与踩坑：日志保留覆盖事故区间；使用备份记录的 start position 和事故前 stop position；RESET BINARY LOGS AND GTIDS 必须带破坏性警告。
- FAQ 候选与来源：SO-105776 用于 dump 恢复入口问题；正文必须继续验证一致性、坐标和增量重放。
- 非复习自测：机制与场景卡覆盖复制不是备份、PITR 起止点、恢复验证和 GTID。
- 图表或实验：备份—误删—恢复时间线，以及 source—replica—隔离恢复库关系图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html
- https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html
- https://dev.mysql.com/doc/refman/8.4/en/mysqlbinlog.html
- https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery-positions.html
- https://dev.mysql.com/doc/refman/8.4/en/replication-gtids.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

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

## 文章职责

- 唯一要解决的问题：一条写入如何从内存变成可恢复的数据，以及不同日志各自负责什么。
- 可观察成果：能够解释脏页、WAL、undo、binlog、两阶段提交和崩溃恢复的职责边界。
- 进入条件：MySQL(七)索引原理与设计
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 存储与日志链路：`refman8.4:innodb-storage-engine`、`refman8.4:innodb-architecture`、`refman8.4:innodb-buffer-pool`、`refman8.4:innodb-buffer-pool-optimization`、`refman8.4:innodb-redo-log`、`refman8.4:innodb-undo-logs`、`refman8.4:innodb-doublewrite-buffer`、`refman8.4:innodb-checkpoints`、`refman8.4:innodb-recovery`、`refman8.4:innodb-tablespace`、`refman8.4:innodb-row-format`、`refman8.4:innodb-change-buffer`、`refman8.4:binary-log`
- 8.4运行边界：`refman8.4:optimizing-innodb-logging`、`refman8.4:innodb-dedicated-server`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| InnoDB 架构 | 建立InnoDB 架构的心智模型 | 定位内存、线程、表空间与日志 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 页与 Buffer Pool | 建立页与 Buffer Pool的心智模型 | 理解缓存、脏页和刷盘 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| redo 与 checkpoint | 建立redo 与 checkpoint的心智模型 | 理解 WAL 和恢复起点 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| undo 与多版本 | 建立undo 与多版本的心智模型 | 理解回滚和历史版本来源 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| doublewrite 与部分页写 | 建立doublewrite 与部分页写的心智模型 | 识别页完整性保护 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| binlog 与 redo | 建立binlog 与 redo的心智模型 | 区分复制恢复日志与引擎恢复日志 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 两阶段提交与崩溃恢复 | 建立两阶段提交与崩溃恢复的心智模型 | 追踪提交各阶段的恢复判断 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：沿一次订单状态更新追踪 Buffer Pool、undo、redo、binlog、提交和宕机后的恢复决策。
- 失败边界与踩坑：不把 binlog 当 redo，也不把事务提交等同于数据页立刻落盘。
- FAQ 候选与来源：为什么有 redo 还需要 doublewrite；为什么备份恢复仍需要 binlog。
- 非复习自测：机制闪卡覆盖 redo/undo/binlog、checkpoint、doublewrite 和两阶段提交。
- 图表或实验：redo、undo、binlog 写入链和崩溃恢复决策图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/innodb-architecture.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-undo-logs.html
- https://dev.mysql.com/doc/refman/8.4/en/innodb-recovery.html
- https://dev.mysql.com/doc/refman/8.4/en/binary-log.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

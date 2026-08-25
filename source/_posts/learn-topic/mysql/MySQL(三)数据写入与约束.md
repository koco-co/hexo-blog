---
title: MySQL(三)数据写入与约束
tags:
  - MySQL
  - 数据写入与约束
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 掌握 INSERT、UPSERT、UPDATE、DELETE、约束失败、隐式提交和受控写入，避免不可恢复的数据修改。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 3
published: false
abbrlink: 4df9aab4
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：怎样在约束和事务边界内安全地写入、修改与删除数据。
- 可观察成果：能够编写 UPSERT 和受控 UPDATE/DELETE，并根据错误与影响行数决定提交或回滚。
- 进入条件：MySQL(二)数据库基础与表设计
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 写入与约束：`refman8.4:atomic-ddl`、`refman8.4:alter-table`、`refman8.4:truncate-table`、`refman8.4:insert`、`refman8.4:insert-select`、`refman8.4:insert-on-duplicate`、`refman8.4:update`、`refman8.4:delete`、`refman8.4:replace`、`refman8.4:load-data`、`refman8.4:foreign-key-optimization`、`refman8.4:implicit-commit`、`refman8.4:error-handling`
- 写入边界：`refman8.4:import-table`、`refman8.4:values`、`refman8.4:parenthesized-query-expressions`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 写入前的约束边界 | 判断写入前的约束边界 | 区分默认值、唯一、外键和 CHECK | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| INSERT 与批量写入 | 建立INSERT 与批量写入的心智模型 | 处理单行、多行、INSERT SELECT 和导入 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| UPSERT 与替换语义 | 建立UPSERT 与替换语义的心智模型 | 比较 ON DUPLICATE KEY UPDATE、IGNORE 和 REPLACE | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 受控 UPDATE 与 DELETE | 建立受控 UPDATE 与 DELETE的心智模型 | 先预览主键集合、核对影响行数并决定提交 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| TRUNCATE、DDL 与隐式提交 | 建立TRUNCATE、DDL 与隐式提交的心智模型 | 识别不能按普通 DML 回滚的边界 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 错误处理与验证 | 完成并验证错误处理与验证 | 用失败矩阵检查数据是否保持一致 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：完成库存 UPSERT、受控状态更新和重复导入记录清理，并逐步核对影响行数与最终数据。
- 失败边界与踩坑：guarded-update 不启用 sql_safe_updates；重点是精确 WHERE、同一事务内预览和结果核对。
- FAQ 候选与来源：UPSERT 与目标表更新限制采用 SO-4205181、SO-45494 作为问题线索。
- 非复习自测：SQL 卡 mysql84-03-upsert-stock-p1、mysql84-03-guarded-update-p1、mysql84-03-deduplicate-delete-p2。
- 图表或实验：写入失败矩阵、约束触发顺序和提交边界时间线。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/insert.html
- https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html
- https://dev.mysql.com/doc/refman/8.4/en/update.html
- https://dev.mysql.com/doc/refman/8.4/en/delete.html
- https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

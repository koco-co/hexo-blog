---
title: MySQL(八)执行计划与查询优化
tags:
  - MySQL
  - 执行计划与查询优化
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 使用统计信息、EXPLAIN ANALYZE、Performance Schema 和 sys 建立发现、改写、复测的查询优化闭环。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 8
published: false
abbrlink: 3bb0fc53
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：怎样用执行证据而不是经验猜测优化慢 SQL。
- 可观察成果：能够阅读访问类型、估算与实际行数、排序临时表和索引选择，并验证优化收益。
- 进入条件：MySQL(五)多表查询与子查询、MySQL(六)CTE与窗口函数、MySQL(七)索引原理与设计
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 执行计划与优化闭环：`refman8.4:optimize-overview`、`refman8.4:select-optimization`、`refman8.4:subquery-optimization`、`refman8.4:internal-temporary-tables`、`refman8.4:optimizing-innodb-queries`、`refman8.4:using-explain`、`refman8.4:explain-output`、`refman8.4:explain-extended`、`refman8.4:controlling-optimizer`、`refman8.4:optimizer-hints`、`refman8.4:index-hints`、`refman8.4:cost-model`、`refman8.4:optimizer-statistics`、`refman8.4:monitoring-performance-schema`、`refman8.4:optimizer-tracing`、`refman8.4:performance-schema-quick-start`、`refman8.4:performance-schema-queries`、`refman8.4:performance-schema-statement-digests`、`refman8.4:performance-schema-query-profiling`、`refman8.4:sys-schema-usage`、`refman8.4:sys-schema-views`
- 优化专项边界：`refman8.4:optimize-data-types`、`refman8.4:optimizing-innodb-transaction-management`、`refman8.4:optimizing-innodb-bulk-data-loading`、`refman8.4:optimizing-innodb-ddl-operations`、`refman8.4:optimizing-innodb-diskio`、`refman8.4:optimizing-innodb-configuration-variables`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 优化器与统计信息 | 建立优化器与统计信息的心智模型 | 理解成本估算和数据分布 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| EXPLAIN 与 EXPLAIN ANALYZE | 建立EXPLAIN 与 EXPLAIN ANALYZE的心智模型 | 对比计划、估算与真实执行 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 访问方式与连接顺序 | 比较访问方式与连接顺序 | 识别扫描、索引查找和连接策略 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| SARGable 条件 | 建立SARGable 条件的心智模型 | 改写函数、类型和范围条件 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 排序、分组与分页 | 建立排序、分组与分页的心智模型 | 处理 filesort、临时表和深分页 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| Performance Schema 与 sys | 建立Performance Schema 与 sys的心智模型 | 从 digest 和视图定位高成本语句 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 优化闭环 | 建立优化闭环的心智模型 | 固定基线、单点改动、复测和回退 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：对日期函数过滤与深分页各做一次优化前后执行计划对照，核对结果集完全相同。
- 失败边界与踩坑：不以 type 一项判定好坏；区分估算与实际、缓存影响、数据量不足和提示器副作用。
- FAQ 候选与来源：为什么加了索引仍不使用；EXPLAIN ANALYZE 为什么可能真的执行语句。
- 非复习自测：SQL 卡 mysql84-08-sargable-rewrite-p1、mysql84-08-keyset-pagination-p1。
- 图表或实验：优化闭环图、EXPLAIN 前后对照表和分页路径图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/using-explain.html
- https://dev.mysql.com/doc/refman/8.4/en/explain-output.html
- https://dev.mysql.com/doc/refman/8.4/en/optimizer-statistics.html
- https://dev.mysql.com/doc/refman/8.4/en/performance-schema-statement-digests.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

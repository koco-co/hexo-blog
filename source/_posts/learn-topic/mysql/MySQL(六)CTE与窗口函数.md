---
title: MySQL(六)CTE与窗口函数
tags:
  - MySQL
  - CTE与窗口函数
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 使用 CTE、递归查询和窗口函数完成分组排名、累计值、去重与连续登录分析。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 6
published: false
abbrlink: 3211416c
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：怎样在保留明细行的同时完成跨行计算和多阶段查询。
- 可观察成果：能够设计 CTE、窗口分区、排序和 frame，并验证排名、累计和连续区间。
- 进入条件：MySQL(五)多表查询与子查询
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- CTE与窗口函数：`refman8.4:with`、`refman8.4:window-functions`、`refman8.4:window-function-descriptions`、`refman8.4:window-functions-usage`、`refman8.4:window-functions-frames`、`refman8.4:window-functions-named-windows`、`refman8.4:window-function-restrictions`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTE 与查询分解 | 完成并验证CTE 与查询分解 | 用 WITH 表达多阶段查询 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 递归 CTE | 建立递归 CTE的心智模型 | 定义锚点、递归项和终止条件 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 窗口分区与排序 | 建立窗口分区与排序的心智模型 | 理解 PARTITION BY 和 ORDER BY | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 排名与偏移函数 | 建立排名与偏移函数的心智模型 | 使用 ROW_NUMBER、RANK、LAG 和 LEAD | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 聚合窗口与 frame | 建立聚合窗口与 frame的心智模型 | 区分默认 frame、ROWS 和 RANGE | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 命名窗口与限制 | 建立命名窗口与限制的心智模型 | 复用窗口定义并识别不可用位置 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：完成部门 Top N、重复记录标记、累计销售额和连续登录区间，并比较窗口前后的行数。
- 失败边界与踩坑：覆盖并列排名、同日多次登录、frame 默认值、递归终止和最终稳定排序。
- FAQ 候选与来源：为什么窗口函数不减少明细行；ROW_NUMBER、RANK 与 DENSE_RANK 如何选择。
- 非复习自测：SQL 卡 mysql84-06-topn-per-group-p1、mysql84-06-deduplicate-row-number-p2、mysql84-06-running-total-p1、mysql84-06-consecutive-login-p1。
- 图表或实验：窗口分区图、frame 时间线和连续区间分组图。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/with.html
- https://dev.mysql.com/doc/refman/8.4/en/window-functions.html
- https://dev.mysql.com/doc/refman/8.4/en/window-functions-frames.html
- https://dev.mysql.com/doc/refman/8.4/en/window-function-restrictions.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

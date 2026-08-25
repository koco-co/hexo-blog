---
title: MySQL(四)查询基础与聚合
tags:
  - MySQL
  - 查询基础与聚合
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从 SELECT 逻辑顺序、NULL 和表达式推进到聚合、HAVING、排序与分页，写出结果确定的查询。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 4
published: false
abbrlink: 80283a7e
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：怎样写出语义正确、结果稳定且能解释的单表与聚合查询。
- 可观察成果：能够处理 NULL、类型转换、分组约束、并列结果和稳定排序。
- 进入条件：MySQL(三)数据写入与约束
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 查询基础与聚合：`refman8.4:select`、`refman8.4:expressions`、`refman8.4:type-conversion`、`refman8.4:non-typed-operators`、`refman8.4:operator-precedence`、`refman8.4:comparison-operators`、`refman8.4:logical-operators`、`refman8.4:flow-control-functions`、`refman8.4:numeric-functions`、`refman8.4:date-and-time-functions`、`refman8.4:string-functions`、`refman8.4:cast-functions`、`refman8.4:aggregate-functions-and-modifiers`、`refman8.4:aggregate-functions`、`refman8.4:group-by-functional-dependence`、`refman8.4:order-by-optimization`
- 函数选择边界：`refman8.4:bit-functions`、`refman8.4:encryption-functions`、`refman8.4:information-functions`、`refman8.4:miscellaneous-functions`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SELECT 逻辑执行顺序 | 建立SELECT 逻辑执行顺序的心智模型 | 理解 FROM、WHERE、GROUP BY、HAVING、SELECT、ORDER BY | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 表达式与 NULL | 建立表达式与 NULL的心智模型 | 掌握比较、逻辑运算、CASE 和三值逻辑 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 常用函数与类型转换 | 比较常用函数与类型转换 | 处理字符串、日期、数值和显式转换 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 聚合与 GROUP BY | 建立聚合与 GROUP BY的心智模型 | 计算计数、金额和去重指标 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| HAVING 与条件聚合 | 建立HAVING 与条件聚合的心智模型 | 区分行过滤和组过滤 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 排序与分页 | 建立排序与分页的心智模型 | 增加确定性排序并解释 OFFSET 成本 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：基于员工和订单数据计算第二高薪、月度销售额和多状态条件聚合，给出固定期望结果。
- 失败边界与踩坑：覆盖并列薪资、空集合、NULL、ONLY_FULL_GROUP_BY 和非稳定排序。
- FAQ 候选与来源：SO-23921117 只用于发现 GROUP BY 常见误区，不以关闭严格模式作为默认解法。
- 非复习自测：SQL 卡 mysql84-04-second-highest-salary-p1、mysql84-04-monthly-sales-p1、mysql84-04-conditional-aggregation-p2。
- 图表或实验：SELECT 逻辑顺序图、NULL 真值表和聚合输入输出表。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/select.html
- https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html
- https://dev.mysql.com/doc/refman/8.4/en/group-by-functional-dependence.html
- https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

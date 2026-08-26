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
published: true
abbrlink: 3bb0fc53
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
优化不是把 SQL 改得更复杂，而是用证据减少不必要的行、页和排序。完整闭环是：找到真实慢语句 → 读计划 → 提出一个可解释改动 → 用实际数据复测 → 记录是否值得保留。
{% endnote %}

## 优化闭环

{% mermaid %}
flowchart LR
  A[真实慢 SQL] --> B[Performance Schema / sys]
  B --> C[EXPLAIN 估算计划]
  C --> D[改写谓词或索引]
  D --> E[EXPLAIN ANALYZE 实测]
  E --> F{延迟、行数、写成本是否改善}
  F -->|是| G[记录变更与回滚点]
  F -->|否| C
{% endmermaid %}

{% note info flat %}
先固定参数、数据快照和并发条件，再比较计划。只看一次墙钟时间容易被缓存、锁等待和网络抖动误导；估算 rows 与实际 rows 的偏差，往往比某个 access type 名称更值得追查。
{% endnote %}

## 读执行计划

{% note primary flat %}
阅读 EXPLAIN 时按“访问顺序 → 访问方法 → 估算行数 → 过滤比例 → 排序/临时表 → 回表”顺序解释。`type`、`key`、`key_len`、`rows`、`filtered`、`Extra` 只是证据，不是脱离查询的性能等级。
{% endnote %}

```sql
EXPLAIN
SELECT id, user_id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND status = 'paid'
ORDER BY ordered_at DESC, id DESC
LIMIT 20;

EXPLAIN ANALYZE
SELECT id, user_id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND status = 'paid'
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```

{% note success flat %}
实际计划的验证问题是：是否扫描了预期数量的行？是否发生 filesort 或临时表？实际 loops 和 rows 是否远大于估算？如果估算严重偏差，先 `ANALYZE TABLE` 更新统计信息，再判断索引或改写。
{% endnote %}

## 可索引改写

{% note primary flat %}
可索引谓词让列保持“裸露”，把常量移到右侧。时间过滤使用半开区间，字符串前缀可以使用索引，任意函数、隐式转换和前导通配符要先评估替代方案。
{% endnote %}

| 不利写法 | 可解释改写 | 仍需验证 |
| --- | --- | --- |
| `DATE(ordered_at) = '2026-07-01'` | `ordered_at >= '2026-07-01' AND ordered_at < '2026-07-02'` | 时区和边界 |
| `LOWER(email) = 'a@x.com'` | 统一写入大小写或使用合适排序规则 | 业务大小写语义 |
| `amount + 0 = 100` | `amount = 100` | 列类型是否一致 |
| `name LIKE '%mouse%'` | 前缀搜索或全文索引专项 | 业务搜索需求 |

```sql
-- 优先使用范围条件
SELECT id, user_id, ordered_at
FROM orders
WHERE ordered_at >= '2026-07-01'
  AND ordered_at < '2026-07-02'
ORDER BY ordered_at, id;
```

## 深分页

{% note warning flat %}
`LIMIT 20 OFFSET 100000` 必须先找到并丢弃前 100000 行，数据越大越慢。Keyset Pagination 需要稳定的复合排序键，并把上一页最后一行作为下一页的游标；它不能随机跳到任意页码。
{% endnote %}

```sql
-- 第一页
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
ORDER BY ordered_at DESC, id DESC
LIMIT 20;

-- 下一页：上一页最后一行是 ('2026-07-01 10:00:00', 120)
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND (ordered_at, id) < ('2026-07-01 10:00:00', 120)
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```

{% note success flat %}
游标比较的列顺序、方向和索引顺序必须一致；如果排序字段可为 NULL，先规定 NULL 的位置或使用非 NULL 列，否则分页可能重复或漏行。
{% endnote %}

## 统计与临时表

{% note info flat %}
优化器需要基数和分布统计来估算成本。GROUP BY、ORDER BY、窗口和不可合并的派生表可能使用内部临时表；内存不足时会落到磁盘，计划和实际 I/O 都要检查。
{% endnote %}

```sql
ANALYZE TABLE orders, order_items;

SELECT DIGEST_TEXT, COUNT_STAR, SUM_TIMER_WAIT,
       SUM_ROWS_EXAMINED, SUM_ROWS_SENT
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;

SELECT *
FROM sys.statement_analysis
ORDER BY avg_latency DESC
LIMIT 10;
```

{% folding cyan, Hint 与 optimizer trace %}
当统计信息、索引和 SQL 结构都合理却仍需验证优化器取舍时，可以在单条查询上使用 optimizer hint，并保留不加 hint 的基线；`USE INDEX`、`FORCE INDEX` 等 index hint 也必须用实测数据说明理由。需要深入解释选择过程时再临时开启 optimizer trace，避免把诊断开关当作长期配置。
{% endfolding %}

## 运行边界

| 调整 | 可能收益 | 风险 |
| --- | --- | --- |
| 改写谓词 | 让索引范围可用 | 改变 NULL、时区或字符串语义 |
| 新增索引 | 减少读扫描 | 增加写放大、空间和变更时间 |
| 更新统计 | 改善估算 | 统计采样仍可能不代表极端参数 |
| Hint | 固定已验证的选择 | 数据分布变化后可能反而变慢 |
| 批量/DDL 调优 | 缩短导入或变更时间 | 锁、日志和恢复窗口变大 |

{% note danger flat %}
不要用 `FORCE INDEX`、关闭优化器开关或提高内存配置来掩盖未知的访问模式。任何优化都应保存原 SQL、基线计划、改动、复测数据和回滚动作。
{% endnote %}

## 常见问题

{% flashcard basic id:mysql84-08-sargable-rewrite-p1 deck:"mysql-8.4-interview" priority:1 tags:"SARGable,日期范围,索引" %}
--- question
`WHERE DATE(ordered_at) = '2026-07-01'` 可能导致索引失效，如何改写并说明边界？
--- answer
```sql
SELECT id, ordered_at, total_amount
FROM orders
WHERE ordered_at >= '2026-07-01'
  AND ordered_at < '2026-07-02';
```
--- explanation
对列套 DATE 会让存储引擎难以直接按原列范围定位；半开区间覆盖整天且不依赖月末 23:59:59。若业务时区不是 UTC，先把输入边界转换成存储时区再查询。
{% endflashcard %}

{% flashcard basic id:mysql84-08-keyset-pagination-p1 deck:"mysql-8.4-interview" priority:1 tags:"Keyset Pagination,深分页,稳定排序" %}
--- question
订单按 `ordered_at DESC, id DESC` 分页，如何避免大 OFFSET，并保证下一页不漏行？
--- answer
```sql
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = ?
  AND (ordered_at, id) < (?, ?)
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```
--- explanation
id 是时间相同的 tie-breaker；游标比较方向必须与 DESC 排序一致。Keyset 适合顺序翻页，不支持任意页码跳转，也不能在排序键可 NULL 且未规定 NULL 位置时直接套用。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Optimization Overview, https://dev.mysql.com/doc/refman/8.4/en/optimize-overview.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 EXPLAIN, https://dev.mysql.com/doc/refman/8.4/en/using-explain.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 EXPLAIN Output, https://dev.mysql.com/doc/refman/8.4/en/explain-output.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Optimizer Statistics, https://dev.mysql.com/doc/refman/8.4/en/optimizer-statistics.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Performance Schema Statement Digests, https://dev.mysql.com/doc/refman/8.4/en/performance-schema-query-profiling.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

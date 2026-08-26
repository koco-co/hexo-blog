---
title: MySQL(七)索引原理与设计
tags:
  - MySQL
  - 索引原理与设计
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从 InnoDB 页、B+Tree、聚簇与二级索引理解联合、覆盖索引和写放大，形成查询驱动的索引设计方法。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 7
published: true
abbrlink: 12331af3
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
索引不是越多越快，而是用额外的有序结构换取更少的扫描。设计前先写出真实查询，再判断过滤、排序、回表和写入成本；最后用执行计划和数据分布验证，而不是凭列名猜索引。
{% endnote %}

## B+Tree 页

{% note info flat %}
InnoDB 的常用索引是 B+Tree：根页和中间页负责导航，叶子页按键有序。等值查找可以快速定位，范围查找可以顺着叶子页扫描；索引并不保证每次查询都比全表扫描便宜。
{% endnote %}

{% mermaid %}
flowchart TD
  R[根页] --> M1[中间页 10-49]
  R --> M2[中间页 50-99]
  M1 --> L1[叶子页 10-20]
  M1 --> L2[叶子页 21-49]
  M2 --> L3[叶子页 50-79]
  M2 --> L4[叶子页 80-99]
  L1 -.叶子链.- L2
  L2 -.叶子链.- L3
  L3 -.叶子链.- L4
{% endmermaid %}

{% note primary flat %}
树高、页大小、键宽度和数据分布共同影响成本。低选择性条件可能扫描大量叶子页；大字段会减少每页能容纳的键数，增加树高和 I/O。
{% endnote %}

## 聚簇回表

{% note info flat %}
InnoDB 的聚簇索引叶子节点直接保存整行。二级索引叶子节点保存二级键和主键值，命中后还要按主键回聚簇索引取列，这一步就是回表。
{% endnote %}

| 查询 | 需要回表吗 | 原因 |
| --- | --- | --- |
| `WHERE PRIMARY KEY = ?` | 否 | 主键叶子页就是整行 |
| `WHERE email = ?` 只取 `id` | 通常否 | 二级叶子已包含主键 |
| `WHERE email = ?` 取 `display_name` | 是 | 二级索引没有该列 |
| 覆盖索引查询 | 否 | 所需列都在索引中 |

{% note warning flat %}
二级索引不是“复制一份整表”。把所有查询列塞进索引会放大存储和写入成本；只有高频、选择性合理且能明显减少回表的列组合才值得覆盖。
{% endnote %}

## 联合索引

{% note primary flat %}
联合索引 `(user_id, ordered_at, id)` 按左到右排序。等值列通常放在范围列前，排序需要的 tie-breaker 放在后面；一旦遇到范围或不连续条件，后续列未必还能用于缩小扫描范围。
{% endnote %}

| 索引 `(a,b,c)` | 常见使用情况 |
| --- | --- |
| `a = ?` | 可用 a |
| `a = ? AND b = ?` | 可用 a、b |
| `a = ? AND b BETWEEN ...` | a 定位、b 扫描，c 通常不能继续缩小范围 |
| `b = ?` | 缺少最左列，通常不能按联合索引定位 |
| `a = ? ORDER BY b,c` | 可能同时利用过滤和排序，须看计划 |

```sql
CREATE INDEX idx_orders_user_time
  ON orders (user_id, ordered_at DESC, id DESC);

SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND ordered_at >= '2026-07-01'
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```

{% note warning flat %}
`WHERE DATE(ordered_at) = '2026-07-01'`、对列做函数、隐式类型转换或前导 `%` 的 LIKE 都可能让条件无法按原索引范围定位。先改写为可索引的半开区间，再比较计划。
{% endnote %}

## 覆盖与下推

{% note info flat %}
覆盖索引让查询只读索引页；Index Condition Pushdown（ICP）则把部分条件下推到存储引擎，减少回表候选。两者都不是强制承诺，是否生效以 `EXPLAIN` 的 `Extra` 和实际行数为证。
{% endnote %}

```sql
CREATE INDEX idx_orders_user_status_time
  ON orders (user_id, status, ordered_at, id, total_amount);

EXPLAIN
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND status = 'paid'
ORDER BY ordered_at DESC, id DESC;
```

{% note success flat %}
覆盖索引的成功标准是“所需列都能从索引读取、回表减少、总成本下降”，不是看到 `Using index` 就结束。低选择性状态列、频繁更新列和超宽索引可能让写放大超过收益。
{% endnote %}

## 索引可见性

| 能力 | 语法/对象 | 适用边界 |
| --- | --- | --- |
| 唯一索引 | `UNIQUE KEY` | 既保证业务唯一又提供查找路径 |
| 降序索引 | `DESC` 列方向 | 与反向排序模式匹配，仍需看计划 |
| 隐藏索引 | `ALTER INDEX ... INVISIBLE` | 先观察删除候选索引的影响，不立即破坏结构 |
| 生成列索引 | 先定义生成列再建索引 | 把 JSON/表达式查询变成可索引列 |
| 空间索引 | `SPATIAL` | 只适用于空间类型和相应谓词 |
| 时间查找 | 时间范围/时间戳精度 | 不把字符串格式当作时间索引策略 |

{% folding blue, 安全试验索引变更 %}
```sql
CREATE INDEX idx_orders_status_time
  ON orders (status, ordered_at);

ALTER TABLE orders ALTER INDEX idx_orders_status_time INVISIBLE;
-- 在同一份数据上比较计划和延迟；确认后再决定保留或 DROP。
ALTER TABLE orders ALTER INDEX idx_orders_status_time VISIBLE;
DROP INDEX idx_orders_status_time ON orders;

ALTER TABLE products
  ADD COLUMN color VARCHAR(32)
    GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.color'))) STORED,
  ADD INDEX idx_products_color (color);
```
{% endfolding %}

{% note warning flat %}
隐藏索引只影响优化器是否选择它，不会立即释放空间，也不能替代回滚方案。删除索引前检查所有 SQL、写入负载和备用实例；生成列表达式还要确认 NULL、类型长度和字符集。
{% endnote %}

## 验证成本

```sql
SHOW INDEX FROM orders;
SHOW CREATE TABLE orders;

EXPLAIN FORMAT=JSON
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```

{% hideToggle 索引自测, cyan, white %}
给查询 `WHERE status = 'paid' AND ordered_at >= ? ORDER BY ordered_at DESC, id DESC LIMIT 20` 设计候选索引，并写出三个验证问题：是否命中、是否回表、写入成本是否可接受。答案：先测试 `(status, ordered_at, id)`，再看选择性和计划；若 SELECT 还需要少量固定列，再比较覆盖版本，不要一开始把整行都塞进索引。
{% endhideToggle %}

{% note primary flat %}
索引验收至少记录 SQL、数据规模、统计信息、执行计划、实际耗时和写入对比。没有这些证据，只能说“有一个候选设计”，不能说“已经优化”。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Optimization and Indexes, https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Multiple-Column Indexes, https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 InnoDB Index Types, https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Index Condition Pushdown, https://dev.mysql.com/doc/refman/8.4/en/index-condition-pushdown-optimization.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Invisible Indexes, https://dev.mysql.com/doc/refman/8.4/en/invisible-indexes.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

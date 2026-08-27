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
date: 2026-03-29 00:00:00
---

{% course_series %}

{% note primary flat %}
索引不是越多越快，而是用额外的有序结构换取更少的扫描。设计前先写出真实查询，再判断过滤、排序、回表和写入成本；最后用执行计划和数据分布验证，而不是凭列名猜索引。
{% endnote %}

## B+Tree 页

{% note info flat %}
InnoDB 的常用索引是 B+Tree：根页和中间页负责导航，叶子页按键有序。等值查找可以快速定位，范围查找可以顺着叶子页扫描；索引并不保证每次查询都比全表扫描便宜。Hash 索引适合等值查找但不提供有序范围扫描；InnoDB 的用户索引主线仍是 B+Tree，不能把 MEMORY 的 `USING HASH` 语法套到 InnoDB 表上。
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

{% note primary flat %}
主键会决定聚簇数据的组织方式，所以优先选择短、稳定、非空、单调增长且业务无关的键，例如 `BIGINT UNSIGNED AUTO_INCREMENT`。UUID 等宽且随机的键会增加二级索引体积和页分裂；业务唯一性仍应由单独的 `UNIQUE NOT NULL` 约束表达，不能把可变业务字段直接当聚簇主键。
{% endnote %}

| 查询 | 需要回表吗 | 原因 |
| --- | --- | --- |
| `WHERE id = ?`（主键） | 否 | 主键叶子页就是整行 |
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

{% note info flat %}
前缀索引只保存字符串前 N 个字符，例如 `CREATE INDEX idx_products_name_prefix ON products (name(20))`；它能减少索引体积，但不能保证完整字符串唯一，也可能无法区分共享前缀的值。前缀长度要结合字符集、选择性和查询模式实测。
{% endnote %}

## 覆盖与下推

{% note info flat %}
覆盖索引让查询只读索引页；Index Condition Pushdown（ICP）则把部分条件下推到存储引擎，减少回表候选。两者都不是强制承诺，是否生效以 `EXPLAIN` 的 `Extra` 和实际行数为证。
{% endnote %}

```sql
-- 实验一：覆盖索引，所需列都在索引中，预期 Extra 可能出现 Using index。
CREATE INDEX idx_orders_user_status_time_cover
  ON orders (user_id, status, ordered_at, id, total_amount);

EXPLAIN
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND status = 'paid'
ORDER BY ordered_at DESC, id DESC;

-- 实验二：非覆盖二级索引，total_amount 需要回表；残余条件可尝试 ICP。
CREATE INDEX idx_orders_user_status_time
  ON orders (user_id, status, ordered_at, id);

EXPLAIN
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND status = 'paid'
  AND ordered_at >= '2026-07-01'
  AND id >= 100
ORDER BY ordered_at DESC, id DESC;

EXPLAIN ANALYZE
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND status = 'paid'
  AND ordered_at >= '2026-07-01'
  AND id >= 100
ORDER BY ordered_at DESC, id DESC;
```

{% note success flat %}
覆盖索引的成功标准是“所需列都能从索引读取、回表减少、总成本下降”，不是看到 `Using index` 就结束。低选择性状态列、频繁更新列和超宽索引可能让写放大超过收益。
{% endnote %}

{% note info flat %}
二级索引的主键后缀可能被优化器作为索引扩展使用；`EXPLAIN` 的 `key`、`used_key_parts` 和 `Extra` 才能说明它是否真的帮助了过滤或覆盖。不要把“物理上保存主键”直接等同于“每次都会按主键扩展优化”。
{% endnote %}

{% note warning flat %}
宽表的冷热列拆分有时能减少 I/O 和缓存压力，但会增加 JOIN 和一致性成本；只有在访问分布、行宽和执行计划支持时才拆表。外键优化的目标不是盲目增加外键或索引，而是让引用关系和访问路径都可验证。
{% endnote %}

## 索引变体与操作

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

-- 生成列索引只有在查询表达式与定义可匹配时才可能被优化器改写使用。
EXPLAIN
SELECT id, name
FROM products
WHERE JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.color')) = 'black';
```
{% endfolding %}

{% note warning flat %}
隐藏索引只影响优化器是否选择它，不会立即释放空间，也不能替代回滚方案；主键不能按普通隐藏索引方式停用，唯一索引即使隐藏仍然保持唯一约束。删除索引前检查所有 SQL、写入负载和备用实例；生成列表达式还要确认 NULL、结果类型、长度和字符集。
{% endnote %}

{% note info flat %}
降序索引能帮助匹配明确的反向排序，但混合 `ASC/DESC`、反向扫描和过滤仍需以执行计划验证；空间索引要求空间列满足 `NOT NULL`、SRID/几何约束和适用谓词，条件不满足时优化器可能忽略它。`TIMESTAMP` 查询还会受会话时区转换影响，跨 DST 边界时应固定 UTC 并用实际边界值验证。
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

ANALYZE TABLE orders;
EXPLAIN ANALYZE
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7
  AND ordered_at >= '2026-07-01'
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```

{% hideToggle 索引自测, cyan, white %}
给查询 `WHERE status = 'paid' AND ordered_at >= ? ORDER BY ordered_at DESC, id DESC LIMIT 20` 设计候选索引，并写出三个验证问题：是否命中、是否回表、写入成本是否可接受。答案：先测试 `(status, ordered_at, id)`，再看选择性和计划；若 SELECT 还需要少量固定列，再比较覆盖版本，不要一开始把整行都塞进索引。
{% endhideToggle %}

{% note primary flat %}
索引验收至少记录 SQL、数据规模、统计信息、执行计划、实际耗时和写入对比。没有这些证据，只能说“有一个候选设计”，不能说“已经优化”。
{% endnote %}

## 常见问题

{% flashcard basic id:mysql84-07-index-design-p1 deck:"mysql-8.4-interview" priority:1 tags:"联合索引,覆盖索引,ICP" %}
--- question
查询 `orders` 中某用户的 paid 订单，按时间和 id 倒序取前 20 行；如何比较覆盖索引与 ICP，避免只凭索引名称下结论？
--- answer
```sql
CREATE INDEX idx_orders_user_status_time_cover
  ON orders (user_id, status, ordered_at, id, total_amount);
CREATE INDEX idx_orders_user_status_time
  ON orders (user_id, status, ordered_at, id);

EXPLAIN ANALYZE
SELECT id, ordered_at, total_amount
FROM orders
WHERE user_id = 7 AND status = 'paid'
  AND ordered_at >= '2026-07-01' AND id >= 100
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```
--- explanation
两个候选索引解决的成本不同：

| 候选 | 查询列是否全在索引中 | 重点观察 |
| --- | --- | --- |
| `(user_id, status, ordered_at, id, total_amount)` | 是 | 可能出现 `Using index`，但索引更宽、写放大更高 |
| `(user_id, status, ordered_at, id)` | 否 | 需要回表，残余条件可能出现 `Using index condition` |

`EXPLAIN ANALYZE` 才能给出实际扫描行数、耗时和回表代价；`Extra` 中的文字只是一个线索。先在同一数据规模和统计信息下比较，再决定是否隐藏或删除索引，并检查唯一约束、主键边界和其他查询是否受影响。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Optimization and Indexes, https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Multiple-Column Indexes, https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 B-Tree and Hash Indexes, https://dev.mysql.com/doc/refman/8.4/en/index-btree-hash.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Primary Key Optimization, https://dev.mysql.com/doc/refman/8.4/en/primary-key-optimization.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Index Extensions, https://dev.mysql.com/doc/refman/8.4/en/index-extensions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Column Indexes, https://dev.mysql.com/doc/refman/8.4/en/column-indexes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Generated Column Index Optimizations, https://dev.mysql.com/doc/refman/8.4/en/generated-column-index-optimizations.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 CREATE INDEX, https://dev.mysql.com/doc/refman/8.4/en/create-index.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 DROP INDEX, https://dev.mysql.com/doc/refman/8.4/en/drop-index.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 InnoDB Index Types, https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Index Condition Pushdown, https://dev.mysql.com/doc/refman/8.4/en/index-condition-pushdown-optimization.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Invisible Indexes, https://dev.mysql.com/doc/refman/8.4/en/invisible-indexes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Descending Indexes, https://dev.mysql.com/doc/refman/8.4/en/descending-indexes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Spatial Index Optimization, https://dev.mysql.com/doc/refman/8.4/en/spatial-index-optimization.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Timestamp Lookups, https://dev.mysql.com/doc/refman/8.4/en/timestamp-lookups.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

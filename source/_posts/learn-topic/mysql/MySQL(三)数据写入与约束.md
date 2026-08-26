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
published: true
abbrlink: 4df9aab4
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
写入的难点不是记住四个动词，而是让每次修改都能回答三个问题：目标行是谁、约束是否满足、失败后能否安全恢复。本篇用库存和导入数据练习这条闭环。
{% endnote %}

## 约束边界

{% note info flat %}
写入前先区分“行内规则”和“跨表规则”。`NOT NULL`、默认值和 `CHECK` 检查一行本身；唯一键和外键还要检查同表其他行或父表。应用层校验可以改善错误提示，但不能替代数据库约束。
{% endnote %}

| 失败类型 | 例子 | 数据库反应 | 应对 |
| --- | --- | --- | --- |
| 唯一冲突 | 重复 `products.sku` | 语句失败或按 `IGNORE` 规则跳过 | 明确是否幂等，再选择 UPSERT |
| 外键失败 | 明细引用不存在商品 | 拒绝子行 | 先确认父行，不能关闭外键绕过 |
| CHECK 失败 | 数量为 0、金额为负 | 拒绝行 | 修正输入或回滚事务 |
| 类型/范围失败 | 超出 DECIMAL 或日期范围 | 严格模式下报错 | 保留严格模式并记录原始输入 |
| 重复导入 | 相同 `(source_name, external_id)` | 唯一键保证幂等 | 用业务键而非导入时间去重 |

## 批量写入

{% note primary flat %}
批量写入的基本顺序是“准备父行 → 写入子行 → 回读影响范围”。显式列名、固定排序和事务边界比依赖表的隐式列顺序更可靠。
{% endnote %}

```sql
START TRANSACTION;

INSERT INTO products (sku, name, price, attributes)
VALUES
  ('SKU-101', 'Keyboard', 199.00, JSON_OBJECT('color', 'black')),
  ('SKU-102', 'Mouse', 89.00, JSON_OBJECT('color', 'white'))
AS incoming
ON DUPLICATE KEY UPDATE
  name = incoming.name,
  price = incoming.price,
  attributes = incoming.attributes;

INSERT INTO inventory (product_id, quantity)
SELECT id, 20
FROM products
WHERE sku IN ('SKU-101', 'SKU-102')
ON DUPLICATE KEY UPDATE
  quantity = inventory.quantity + 20;

SELECT ROW_COUNT() AS last_statement_affected_rows;
COMMIT;
```

{% note warning flat %}
`INSERT ... SELECT` 的列顺序必须和目标列一一对应；不要在没有唯一键的情况下把“看起来相同”的记录当成重复。批量导入前先用同一筛选条件执行 `SELECT`，记录预计行数和业务键。
{% endnote %}

```sql
-- CSV 的字段顺序由导入合同固定；生产环境还要限制文件来源与 LOCAL 权限。
LOAD DATA LOCAL INFILE '/safe/path/users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(email, display_name);

-- VALUES 也可以作为行构造器参与查询或 INSERT ... SELECT。
SELECT *
FROM (VALUES ROW (101, 'pending'), ROW (102, 'paid')) AS v(order_id, status);
```

## UPSERT

{% note primary flat %}
`INSERT ... ON DUPLICATE KEY UPDATE` 适合“存在则更新、不存在则插入”的幂等写入；它依赖唯一键识别冲突，不能凭普通字段相等自动发现重复。
{% endnote %}

```sql
INSERT INTO inventory (product_id, quantity)
VALUES (101, 10)
AS incoming
ON DUPLICATE KEY UPDATE
  quantity = inventory.quantity + incoming.quantity,
  updated_at = CURRENT_TIMESTAMP(6);

SELECT product_id, quantity
FROM inventory
WHERE product_id = 101;
```

{% note warning flat %}
上面的加法是“增加入库量”，不是“把库存设置为 10”。题目若要求覆盖值，应写 `quantity = incoming.quantity`；题目若要求扣减，必须在事务和锁章节使用带条件的扣减语句，不能把两种语义混在一起。
{% endnote %}

## 受控修改

{% note primary flat %}
安全 UPDATE/DELETE 采用“预览 → 修改 → 核对 → 提交”四步。预览与修改必须复用同一 WHERE 条件，并用主键排序，避免只凭肉眼查看部分结果。
{% endnote %}

```sql
START TRANSACTION;

SELECT id, status, total_amount
FROM orders
WHERE status = 'pending'
  AND ordered_at < '2026-08-01 00:00:00'
ORDER BY id;

UPDATE orders
SET status = 'cancelled'
WHERE status = 'pending'
  AND ordered_at < '2026-08-01 00:00:00';

SELECT ROW_COUNT() AS changed_rows;

SELECT id, status
FROM orders
WHERE status = 'cancelled'
  AND ordered_at < '2026-08-01 00:00:00'
ORDER BY id;

-- 结果不符合预期时执行 ROLLBACK；确认后才 COMMIT。
COMMIT;
```

{% note danger flat %}
没有 `WHERE` 的 UPDATE/DELETE 不是“快速修复”，而是全表修改。即使开启 `sql_safe_updates`，也不能把它当作恢复方案；影响行数异常时立即回滚并检查连接是否仍在同一个事务中。
{% endnote %}

## 替换删除

{% tabs 写入语义, 1 %}
<!-- tab ON DUPLICATE KEY UPDATE@fa-solid fa-arrows-rotate -->
保留原行身份并更新冲突列，适合库存、配置和导入幂等；外键引用仍指向原主键。
<!-- endtab -->
<!-- tab REPLACE@fa-solid fa-right-left -->
先删除冲突行再插入新行，可能触发删除级联、改变自增键并丢失未提供的列值。除非明确需要“删除后重建”，不要把它当作 UPSERT。
<!-- endtab -->
<!-- tab INSERT IGNORE@fa-solid fa-forward -->
把部分错误降级为警告并继续，可能静默丢掉重复、截断或转换异常。批处理必须读取警告和最终行数，不能只看命令返回成功。
<!-- endtab -->
{% endtabs %}

| 动作 | 是否保留原主键 | 失败可见性 | 推荐场景 |
| --- | --- | --- | --- |
| `UPDATE` | 是 | 行数和错误直接可见 | 已知目标行的受控修改 |
| `DELETE` | 删除 | 外键/行数可见 | 明确生命周期结束的记录 |
| `TRUNCATE TABLE` | 重建表 | 通常不能按普通 DML 回滚 | 清空临时或实验表 |
| `ALTER TABLE` | 取决于操作 | 原子 DDL 不等于业务回滚 | 结构变更，先备份和预演 |

## 提交边界

{% timeline 一次写入的提交边界, blue %}
<!-- timeline DML -->
INSERT、UPDATE、DELETE 处在事务中，可以用 ROLLBACK 撤销本事务的未提交修改。
<!-- endtimeline -->
<!-- timeline 约束 -->
约束检查失败时，失败语句不会产生部分成功的行；调用方仍要处理错误并决定整个事务是否回滚。
<!-- endtimeline -->
<!-- timeline DDL -->
部分 DDL、`TRUNCATE` 等会触发隐式提交；不要把它们和订单 DML 混在一个“以为可回滚”的事务里。
<!-- endtimeline -->
<!-- timeline 证据 -->
记录 `ROW_COUNT()`、错误码、提交时间和最终查询结果，才有可审计的写入证据。
<!-- endtimeline -->
{% endtimeline %}

{% note info flat %}
MySQL 8.4 的原子 DDL 解决的是 DDL 自身崩溃时的原子性，不代表任意 DDL 都能按普通 DML 语义回滚。迁移脚本应把结构变更、数据变更和回退策略分开验证。
{% endnote %}

## 常见问题

{% flashcard basic id:mysql84-03-upsert-stock-p1 deck:"mysql-8.4-interview" priority:1 tags:"UPSERT,库存,幂等" %}
--- question
库存表中 `product_id=101` 已有 20 件，现在导入 5 件；不存在时插入 5，存在时增加 5，SQL 怎么写？
--- answer
`INSERT INTO inventory (product_id, quantity) VALUES (101, 5) AS incoming ON DUPLICATE KEY UPDATE quantity = inventory.quantity + incoming.quantity;`
--- explanation
`product_id` 必须是主键或唯一键，数据库才知道何时冲突。预期原值 20 变为 25；如果题意是覆盖成 5，应使用 `quantity = incoming.quantity`，不能误把增量和覆盖混写。
{% endflashcard %}

{% flashcard basic id:mysql84-03-guarded-update-p1 deck:"mysql-8.4-interview" priority:1 tags:"UPDATE,预览,影响行数" %}
--- question
请把 2026-08-01 之前仍为 pending 的订单取消，并保证误选时可以回滚。SQL 步骤是什么？
--- answer
```sql
START TRANSACTION;
SELECT id FROM orders WHERE status = 'pending' AND ordered_at < '2026-08-01' ORDER BY id;
UPDATE orders SET status = 'cancelled' WHERE status = 'pending' AND ordered_at < '2026-08-01';
SELECT ROW_COUNT();
-- 结果异常 ROLLBACK，否则 COMMIT
```
--- explanation
关键不是开启 safe updates，而是目标条件可复现、影响行数可解释、提交前有证据。没有 WHERE 或预览使用了不同条件，都会让“回滚前确认”失去意义。
{% endflashcard %}

{% flashcard basic id:mysql84-03-deduplicate-delete-p2 deck:"mysql-8.4-interview" priority:2 tags:"DELETE,重复数据,自连接" %}
--- question
原始导入 staging 表 `user_imports_raw` 中同一 `(source_name, external_id)` 出现重复记录，保留最早 `id`，删除其余记录，SQL 如何写？
--- answer
```sql
SELECT r.id
FROM user_imports_raw AS r
JOIN user_imports_raw AS keep
  ON keep.source_name = r.source_name
 AND keep.external_id = r.external_id
 AND keep.id < r.id
ORDER BY r.id;

DELETE r
FROM user_imports_raw AS r
JOIN user_imports_raw AS keep
  ON keep.source_name = r.source_name
 AND keep.external_id = r.external_id
 AND keep.id < r.id;
```
--- explanation
先 SELECT 预览将要删除的 id，再在事务中执行 DELETE；`keep.id < r.id` 明确保留最早记录。staging 表要允许重复，清理后再把唯一键加回生产表，不能把一次清理当作长期约束。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 INSERT, https://dev.mysql.com/doc/refman/8.4/en/insert.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 INSERT ON DUPLICATE KEY UPDATE, https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 UPDATE, https://dev.mysql.com/doc/refman/8.4/en/update.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 DELETE, https://dev.mysql.com/doc/refman/8.4/en/delete.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Implicit Commit, https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Atomic Data Definition Statements, https://dev.mysql.com/doc/refman/8.4/en/atomic-ddl.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

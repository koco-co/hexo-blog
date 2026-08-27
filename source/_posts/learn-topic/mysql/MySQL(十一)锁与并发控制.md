---
title: MySQL(十一)锁与并发控制
tags:
  - MySQL
  - 锁与并发控制
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从记录锁、间隙锁和 next-key lock 推进到锁定读、死锁诊断和 SKIP LOCKED 任务领取，建立并发写入的可验证模型。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 11
published: true
abbrlink: 2d2f0ce4
date: 2026-04-02 00:00:00
---

{% course_series %}

{% note primary flat %}
锁解决的是并发事务之间如何排队，不是“让 SQL 自动正确”。正确的扣库存流程要同时具备事务边界、锁定读、条件校验、短持锁时间和失败重试；本篇把等待和死锁当作可观察结果来处理。
{% endnote %}

{% note info flat %}
可复现实验输入：先按 A02 的 ShopLab DDL 建立 `inventory`、`orders`，使用 A15 的固定商品与订单键，或在隔离库准备 `inventory.product_id=101`、`quantity=20` 和若干 pending 订单。并发实验必须由两个真实连接执行，不能用单连接顺序执行来假装产生等待。
{% endnote %}

## 锁模型

{% mermaid %}
flowchart TD
  R[索引记录] --> RR[Record Lock]
  R --> GG[Gap Lock]
  R --> NK[Next-Key Lock = Record + Gap]
  T[表级意图锁] --> RR
  T --> GG
  T --> NK
  M[元数据锁 MDL] -.保护表定义.- R
{% endmermaid %}

{% note info flat %}
InnoDB 尽量在索引记录上加锁。记录锁保护已存在的索引项，间隙锁保护两个索引项之间的空档，next-key lock 把记录和前面的间隙一起锁住；意图锁让表级与行级锁的兼容关系可判断，MDL 则保护表定义。
{% endnote %}

| 锁 | 保护范围 | 典型触发 |
| --- | --- | --- |
| 共享锁 S | 允许多个读者，阻止冲突写 | `FOR SHARE` |
| 排他锁 X | 互斥读写 | `UPDATE`、`DELETE`、`FOR UPDATE` |
| Record | 一个索引记录 | 唯一索引等值命中 |
| Gap | 索引记录之间的范围 | 范围锁定读（隔离级别相关） |
| Next-key | 记录 + 前间隙 | RR 下的范围扫描 |
| Insert intention | 同一间隙中不同插入位置 | 并发 INSERT |
| AUTO-INC | 自增分配协调 | 自增列写入 |

## 锁定读

{% note primary flat %}
普通 SELECT 是一致性读，通常不阻塞写；`FOR UPDATE` 读取当前版本并申请排他锁，`FOR SHARE` 申请共享锁。锁定读必须在显式事务中，否则语句结束后锁很快释放，无法保护后续业务动作。
{% endnote %}

```sql
START TRANSACTION;

SELECT product_id, quantity
FROM inventory
WHERE product_id = 101
FOR UPDATE;

UPDATE inventory
SET quantity = quantity - 2
WHERE product_id = 101
  AND quantity >= 2;

SELECT ROW_COUNT() AS decremented;
COMMIT;
```

{% note success flat %}
条件 UPDATE 的影响行数是业务证据：1 表示扣减成功，0 表示库存不足或目标不存在。锁定读用于读取价格、状态等后续决策；最终仍需条件写入，不能只靠先读后的应用判断。
{% endnote %}

## 并发等待

{% note info flat %}
两个会话按相同顺序取得资源，通常只会排队；取得相反顺序则可能形成环路并触发死锁。死锁检测会回滚其中一个事务，应用必须捕获错误、短暂退避并重试整个事务。
{% endnote %}

```sql
-- 会话 A
START TRANSACTION;
SELECT id FROM inventory WHERE product_id = 101 FOR UPDATE;
-- 保持事务不提交

-- 会话 B：会等待 A 释放锁
START TRANSACTION;
SELECT id FROM inventory WHERE product_id = 101 FOR UPDATE;
```

{% timeline 死锁形成与处理, red %}
<!-- timeline 形成 -->
A 锁住 101，B 锁住 102；随后 A 请求 102，B 请求 101，形成等待环。
<!-- endtimeline -->
<!-- timeline 检测 -->
InnoDB 发现环路，选择一个事务作为 victim 并返回死锁错误。
<!-- endtimeline -->
<!-- timeline 恢复 -->
被回滚的一方释放已持有锁，应用记录错误并重试完整事务；不能只重试最后一条 SQL。
<!-- endtimeline -->
<!-- timeline 预防 -->
统一资源排序、缩短事务、为访问条件建索引，并避免用户交互期间持锁。
<!-- endtimeline -->
{% endtimeline %}

{% note danger flat %}
锁等待超时、死锁和 MDL 阻塞不是同一个错误。不要用提高 timeout 或杀掉任意连接代替诊断；先找阻塞者、等待者、事务开始时间和 SQL，再决定回滚或修复访问顺序。
{% endnote %}

## 任务领取

{% note primary flat %}
队列 worker 可以用 `FOR UPDATE SKIP LOCKED` 跳过已被其他 worker 锁住的任务，避免所有消费者排队；它牺牲了严格顺序，适合可重试、可恢复的任务，不适合要求全局顺序的结算流程。
{% endnote %}

```sql
START TRANSACTION;

CREATE TEMPORARY TABLE claimed_order_ids (
  id BIGINT UNSIGNED PRIMARY KEY
);

-- 先由当前 worker 领取；客户端读取返回的 id 集合。
SELECT id
FROM orders
WHERE status = 'pending'
ORDER BY id
LIMIT 10
FOR UPDATE SKIP LOCKED;

-- 再把刚才同一连接返回的 id 绑定写入临时表；101/102 只是示意，实际由返回结果绑定，不能跨连接复用。
INSERT INTO claimed_order_ids (id) VALUES (101), (102);

UPDATE orders AS o
JOIN claimed_order_ids AS c ON c.id = o.id
SET o.status = 'processing';

SELECT o.id, o.status
FROM orders AS o
JOIN claimed_order_ids AS c ON c.id = o.id
ORDER BY o.id;

COMMIT;
DROP TEMPORARY TABLE claimed_order_ids;
```

{% note warning flat %}
上例中的 id 集合必须由同一事务、同一 worker 根据实际返回结果生成；示例中的固定值只是说明位置。领取后要有超时回收或幂等重试，否则 worker 崩溃会留下 processing 孤儿任务。
{% endnote %}

## 锁诊断

```sql
SELECT *
FROM performance_schema.data_lock_waits;

SELECT ENGINE_TRANSACTION_ID, THREAD_ID, trx_started,
       trx_state, trx_query
FROM information_schema.INNODB_TRX
ORDER BY trx_started;

SELECT waiting_pid, blocking_pid, waiting_engine_lock_id,
       blocking_engine_lock_id
FROM performance_schema.data_lock_waits;

SHOW ENGINE INNODB STATUS;
```

{% note success flat %}
诊断记录应包含等待者、阻塞者、对象/索引、锁模式、事务开始时间、SQL 和最终处理动作。没有阻塞链，单凭“数据库变慢”不能归因于行锁。
{% endnote %}

## 诊断边界

{% folding cyan, 服务层锁与内部锁 %}
应用互斥锁、连接池串行化和 InnoDB 行锁不在同一层；内部 mutex、MDL 和存储引擎锁也有不同的观察入口。先确认等待事件归属，再选择 Performance Schema、InnoDB 状态或应用 tracing，不要把所有等待都称为“行锁”。
{% endfolding %}

## 常见问题

{% flashcard basic id:mysql84-11-stock-for-update-p1 deck:"mysql-8.4-interview" priority:1 tags:"FOR UPDATE,库存,防超卖" %}
--- question
两个并发请求都要扣减同一商品库存，如何避免超卖？
--- answer
```sql
START TRANSACTION;
SELECT quantity FROM inventory WHERE product_id = 101 FOR UPDATE;
UPDATE inventory SET quantity = quantity - 2
WHERE product_id = 101 AND quantity >= 2;
SELECT ROW_COUNT();
-- 1 后 COMMIT；0 后 ROLLBACK
```
--- explanation
两个请求的关键差异在于“读取和扣减是否共享同一个锁定事务”：

```text
T1: SELECT ... FOR UPDATE → 读到 10 → 扣 2 → COMMIT
T2: SELECT ... FOR UPDATE → 等 T1 提交 → 读到 8 → 扣 2
```

条件 `UPDATE ... WHERE quantity >= 2` 是第二道保险，`ROW_COUNT() = 0` 时回滚或重试。若先普通 `SELECT` 再独立 `UPDATE`，两个请求可能都读到 10，最终一起扣减形成超卖；事务应尽量短，死锁或锁等待失败时重试完整事务。
{% endflashcard %}

{% flashcard basic id:mysql84-11-skip-locked-worker-p2 deck:"mysql-8.4-interview" priority:2 tags:"SKIP LOCKED,队列,并发" %}
--- question
多个 worker 领取 pending 订单时，如何避免互相等待？`SKIP LOCKED` 的代价是什么？
--- answer
```sql
START TRANSACTION;
SELECT id FROM orders WHERE status = 'pending'
ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED;
UPDATE orders SET status = 'processing' WHERE id IN (...);
COMMIT;
```
--- explanation
`SKIP LOCKED` 把“等待”换成“跳过”：

| 选择 | worker 行为 | 适用场景 |
| --- | --- | --- |
| 普通 `FOR UPDATE` | 等待已锁行释放 | 需要看到全部候选 |
| `FOR UPDATE SKIP LOCKED` | 跳过已锁行，立即拿其他行 | 并行后台队列 |

返回的主键必须由当前 `SELECT` 驱动，再更新为 `processing`；不能硬编码一组可能已经被别的 worker 领取的 ID。跳过意味着顺序不再全局严格，worker 崩溃后的超时回收和重试也必须在状态机中定义。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 InnoDB Locking, https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Next-Key Locking, https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Locking Reads, https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 SKIP LOCKED and NOWAIT, https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Deadlocks, https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Performance Schema Lock Tables, https://dev.mysql.com/doc/refman/8.4/en/performance-schema-data-locks-table.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Metadata Locking, https://dev.mysql.com/doc/refman/8.4/en/metadata-locking.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

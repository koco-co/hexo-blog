---
title: MySQL(十五)综合实战
tags:
  - MySQL
  - 综合实战
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 通过 20 道确定输出的 ShopLab 场景题综合验证建模、SQL、优化、事务、锁、权限和恢复能力。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 15
published: true
abbrlink: e11b5c6b
date: 2026-04-06 00:00:00
---

{% course_series %}

{% note primary flat %}
综合实战不是再讲一遍 API，而是把“需求 → SQL → 结果 → 证据 → 边界”连续做完。下面的 20 道题共享 ShopLab 数据和固定输出，适合先独立答题，再用闪卡复盘。
{% endnote %}

## 实验初始化

{% note info flat %}
实验使用九张 InnoDB 表、UTC 时间和 `utf8mb4`。结构应包含用户、部门、员工、商品、库存、订单、明细、登录事件和导入批次；每道题都应在隔离库运行，先记录版本和 SQL mode。
{% endnote %}

{% note info flat %}
`order_items.unit_price` 是下单时保存的价格快照，故意允许与当前 `products.price` 不同；验算订单金额时应以订单明细快照为准，而不是回读商品当前价。
{% endnote %}

```sql
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

INSERT INTO users (id, email, display_name) VALUES
  (1, 'alice@example.com', 'Alice'),
  (2, 'bob@example.com', 'Bob'),
  (3, 'carol@example.com', 'Carol'),
  (4, 'dave@example.com', 'Dave');

INSERT INTO departments (id, name) VALUES
  (10, 'Engineering'), (20, 'Sales');

INSERT INTO employees (id, department_id, name, salary, hired_on) VALUES
  (1001, 10, 'E1', 12000.00, '2024-01-01'),
  (1002, 10, 'E2', 12000.00, '2024-02-01'),
  (1003, 10, 'E3', 9000.00, '2024-03-01'),
  (2001, 20, 'E4', 15000.00, '2023-05-01'),
  (2002, 20, 'E5', 8000.00, '2025-01-01');

INSERT INTO products (id, sku, name, price) VALUES
  (101, 'SKU-101', 'Keyboard', 199.00),
  (102, 'SKU-102', 'Mouse', 89.00),
  (103, 'SKU-103', 'Monitor', 999.00);

INSERT INTO inventory (product_id, quantity) VALUES
  (101, 20), (102, 50), (103, 5);

INSERT INTO orders (id, user_id, status, total_amount, ordered_at) VALUES
  (10001, 1, 'paid', 288.00, '2026-06-30 09:00:00'),
  (10002, 1, 'paid', 999.00, '2026-07-01 10:00:00'),
  (10003, 2, 'cancelled', 89.00, '2026-07-02 10:00:00'),
  (10004, 3, 'paid', 1288.00, '2026-07-15 12:00:00'),
  (10005, 3, 'pending', 199.00, '2026-08-01 08:00:00');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (10001, 101, 1, 199.00), (10001, 102, 1, 89.00),
  (10002, 103, 1, 999.00),
  (10003, 102, 1, 89.00),
  (10004, 101, 1, 199.00), (10004, 102, 1, 1.00),
  (10004, 103, 1, 1088.00),
  (10005, 101, 1, 199.00);

INSERT INTO login_events (user_id, logged_at, success) VALUES
  (1, '2026-07-01 08:00:00', 1), (1, '2026-07-02 08:00:00', 1),
  (1, '2026-07-04 08:00:00', 1), (2, '2026-07-01 09:00:00', 1),
  (2, '2026-07-02 09:00:00', 0), (3, '2026-07-01 09:00:00', 1);

INSERT INTO user_imports (source_name, external_id, email, raw_payload) VALUES
  ('crm', 'u-1', 'alice@example.com', JSON_OBJECT('name', 'Alice'));

DROP TABLE IF EXISTS user_imports_raw;
CREATE TABLE user_imports_raw (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_name VARCHAR(80) NOT NULL,
  external_id VARCHAR(120) NOT NULL,
  email VARCHAR(255) NULL,
  raw_payload JSON NOT NULL,
  PRIMARY KEY (id)
);
INSERT INTO user_imports_raw (source_name, external_id, email, raw_payload) VALUES
  ('crm', 'u-1', 'alice@example.com', JSON_OBJECT('name', 'Alice')),
  ('crm', 'u-1', 'alice@example.com', JSON_OBJECT('name', 'Alice duplicate')),
  ('legacy', 'u-null', NULL, JSON_OBJECT('name', 'Missing email'));
```

{% note warning flat %}
固定 seed 刻意包含并列最高薪、唯一第二高薪、无订单用户、跨月订单、NULL/重复导入和连续/中断登录。重复导入只放入没有唯一约束的 staging 原始表，生产表仍保留幂等约束；实验结束后可删除该 staging 表。
{% endnote %}

## 题目清单

| # | 场景 | 你要交付 | 核对重点 |
| --- | --- | --- | --- |
| 1 | 订单系统建模 | DDL 与约束 | 多对多、唯一、外键、CHECK |
| 2 | 库存 UPSERT | 一条幂等 SQL | 增量与覆盖语义 |
| 3 | 受控取消订单 | 事务脚本 | 预览、影响行数、回滚 |
| 4 | 删除重复导入 | 标记 + DELETE | 保留规则、唯一键 |
| 5 | 第二高薪 | 查询 | 并列与空结果 |
| 6 | 月度销售额 | 聚合 | 时间边界、排序 |
| 7 | 条件聚合 | 一次扫描 | 分母、NULL、HAVING |
| 8 | 无订单用户 | 反连接 | LEFT JOIN/NOT EXISTS |
| 9 | 每组最高薪 | 分组最大值 | 并列全部保留 |
| 10 | 购买商品全集 | 关系除法 | DISTINCT、订单状态 |
| 11 | `NOT IN` 陷阱 | 解释与改写 | NULL 三值逻辑 |
| 12 | 分组 Top N | 窗口排名 | RANK 语义 |
| 13 | 累计销售额 | 窗口 frame | 唯一排序 |
| 14 | 连续登录 | gaps-and-islands | 同日去重 |
| 15 | 可索引日期 | 改写 + 计划 | 半开区间 |
| 16 | Keyset 分页 | 游标查询 | 复合排序 |
| 17 | 订单失败回滚 | 两会话/事务 | 原子性 |
| 18 | 库存防超卖 | 锁定读 | 条件扣减 |
| 19 | 应用角色 | GRANT/负向测试 | 最小权限 |
| 20 | 留存 cohort | CTE + 聚合 | 首月、活跃月、0 月留存 |

{% note info flat %}
每题答案都要写输入假设、SQL、预期行/值、边界和验证命令。只贴一条“看起来正确”的 SQL，不说明并列、NULL、空集合、版本或性能，面试中仍是不完整答案。
{% endnote %}

## 答题流程

{% timeline 一题四证, blue %}
<!-- timeline 需求 -->
把自然语言中的实体、集合、时间范围、并列规则和失败动作写成明确假设。
<!-- endtimeline -->
<!-- timeline SQL -->
先写可读的 CTE/子查询，再按结果确定性补 ORDER BY、DISTINCT 或 tie-breaker。
<!-- endtimeline -->
<!-- timeline 结果 -->
在固定 seed 上保存结果表、影响行数或错误码，不能只凭客户端视觉判断。
<!-- endtimeline -->
<!-- timeline 解释 -->
说明 NULL、重复、锁、索引、事务、权限或恢复边界，并给出一个反例。
<!-- endtimeline -->
{% endtimeline %}

## 场景闪卡

{% note primary flat %}
下面 22 张卡复用前面已经定义的原题，避免复制出多个版本；最后新增一张 cohort 卡。统一卡组 `mysql-8.4-interview`，优先级 1 是高频面试题，2 是需要巩固的中频题。
{% endnote %}

{% flashcard_ref id="mysql84-02-order-schema-ddl-p1" %}
{% flashcard_ref id="mysql84-03-upsert-stock-p1" %}
{% flashcard_ref id="mysql84-03-guarded-update-p1" %}
{% flashcard_ref id="mysql84-03-deduplicate-delete-p2" %}
{% flashcard_ref id="mysql84-04-second-highest-salary-p1" %}
{% flashcard_ref id="mysql84-04-monthly-sales-p1" %}
{% flashcard_ref id="mysql84-04-conditional-aggregation-p2" %}
{% flashcard_ref id="mysql84-05-users-without-orders-p1" %}
{% flashcard_ref id="mysql84-05-groupwise-max-p1" %}
{% flashcard_ref id="mysql84-05-relational-division-p1" %}
{% flashcard_ref id="mysql84-05-not-in-null-p1" %}
{% flashcard_ref id="mysql84-06-topn-per-group-p1" %}
{% flashcard_ref id="mysql84-06-running-total-p1" %}
{% flashcard_ref id="mysql84-06-consecutive-login-p1" %}
{% flashcard_ref id="mysql84-07-index-design-p1" %}
{% flashcard_ref id="mysql84-08-sargable-rewrite-p1" %}
{% flashcard_ref id="mysql84-08-keyset-pagination-p1" %}
{% flashcard_ref id="mysql84-09-redo-undo-binlog-p1" %}
{% flashcard_ref id="mysql84-10-order-rollback-p1" %}
{% flashcard_ref id="mysql84-11-stock-for-update-p1" %}
{% flashcard_ref id="mysql84-12-app-role-grants-p1" %}
{% flashcard_ref id="mysql84-13-backup-vs-replication-p1" %}

{% flashcard basic id:mysql84-15-retention-cohort-p1 deck:"mysql-8.4-interview" priority:1 tags:"留存,Cohort,CTE" %}
--- question
按用户首次 paid 订单月份分 cohort，计算每个 cohort 在第 0、1、2 月仍有 paid 订单的用户数，SQL 怎么写？
--- answer
```sql
WITH first_paid AS (
  SELECT user_id,
         STR_TO_DATE(DATE_FORMAT(MIN(ordered_at), '%Y-%m-01'), '%Y-%m-%d') AS cohort_month
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
), paid_activity AS (
  SELECT DISTINCT user_id,
         STR_TO_DATE(DATE_FORMAT(ordered_at, '%Y-%m-01'), '%Y-%m-%d') AS activity_month
  FROM orders
  WHERE status = 'paid'
)
SELECT f.cohort_month,
       TIMESTAMPDIFF(MONTH, f.cohort_month, a.activity_month) AS month_number,
       COUNT(DISTINCT f.user_id) AS active_users
FROM first_paid AS f
JOIN paid_activity AS a ON a.user_id = f.user_id
WHERE a.activity_month >= f.cohort_month
  AND a.activity_month < f.cohort_month + INTERVAL 3 MONTH
GROUP BY f.cohort_month, month_number
ORDER BY f.cohort_month, month_number;
```
--- explanation
这条查询把每个用户的活动折成两条时间轴：

| 阶段 | 规则 |
| --- | --- |
| `first_paid` | 只取用户最早的 `paid` 订单月，形成 cohort |
| `paid_activity` | 按用户和月份去重，形成活跃月 |
| 连接与分组 | 用 `TIMESTAMPDIFF` 算相对月份并统计用户数 |

因此重复订单不会重复计数，首月也不会被待支付订单污染。当前写法只返回实际出现的月份；若产品要求固定显示第 0、1、2 月，先生成月份维度再 `LEFT JOIN` 并用 `COALESCE` 补 0。没有这个要求时不要凭空制造不存在的组合。
{% endflashcard %}

```sql
WITH first_paid AS (
  SELECT user_id,
         STR_TO_DATE(DATE_FORMAT(MIN(ordered_at), '%Y-%m-01'), '%Y-%m-%d') AS cohort_month
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id
), paid_activity AS (
  SELECT DISTINCT user_id,
         STR_TO_DATE(DATE_FORMAT(ordered_at, '%Y-%m-01'), '%Y-%m-%d') AS activity_month
  FROM orders
  WHERE status = 'paid'
), cohort_activity AS (
  SELECT f.cohort_month,
         TIMESTAMPDIFF(MONTH, f.cohort_month, a.activity_month) AS month_number,
         a.user_id
  FROM first_paid AS f
  JOIN paid_activity AS a ON a.user_id = f.user_id
  WHERE a.activity_month >= f.cohort_month
    AND a.activity_month < f.cohort_month + INTERVAL 3 MONTH
)
SELECT cohort_month,
       month_number,
       COUNT(DISTINCT user_id) AS active_users
FROM cohort_activity
GROUP BY cohort_month, month_number
ORDER BY cohort_month, month_number;
```

{% note success flat %}
这道题的验证重点是：首月用户数等于第 0 月活跃用户数；同一用户同一月份只计一次；cancelled/pending 订单不影响 cohort；结果排序稳定。若产品要显示没有活跃用户的月份，先生成月份维度再 LEFT JOIN 聚合结果补 0。
{% endnote %}

| cohort_month | month_number | active_users |
| --- | ---: | ---: |
| `2026-06-01` | 0 | 1 |
| `2026-06-01` | 1 | 1 |
| `2026-07-01` | 0 | 1 |

{% note info flat %}
上表是本篇固定 seed 对 cohort 题的确定输出；没有活跃用户的第 2 月不自动补行。其余题目沿用题目清单中的核对重点，并把 SQL 运行结果、影响行数、错误码或执行计划保存为各自证据。
{% endnote %}

## 评分复盘

| 维度 | 通过标准 |
| --- | --- |
| 正确性 | SQL 在固定 seed 上得到确定结果，约束/事务失败符合预期 |
| 边界 | 主动说明 NULL、重复、并列、空集合、时区和版本 |
| 性能 | 能用索引、EXPLAIN 或行数证据解释成本，不凭 access type 下结论 |
| 安全 | 不泄露凭据，应用权限最小，恢复操作有隔离和回退 |
| 表达 | 先给假设和 SQL，再给结果、机制、反例与验证 |

{% hideToggle 面试收尾自测, cyan, white %}
随机抽一道题，用 90 秒说清四件事：输入集合是什么、SQL 为什么这样写、哪个边界会让答案错、怎样用结果或计划验证。若只能背出函数名，回到对应闪卡重新手写。
{% endhideToggle %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 SELECT, https://dev.mysql.com/doc/refman/8.4/en/select.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Functions, https://dev.mysql.com/doc/refman/8.4/en/window-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 EXPLAIN, https://dev.mysql.com/doc/refman/8.4/en/using-explain.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Transaction Isolation, https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Locking Reads, https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Backup and Recovery, https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

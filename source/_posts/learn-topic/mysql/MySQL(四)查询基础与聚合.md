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
published: true
abbrlink: 80283a7e
date: 2026-03-26 00:00:00
---

{% course_series %}

{% note primary flat %}
查询题先确定“输入行如何变成结果集”，再写函数。只要把 NULL、分组、并列和排序边界说清楚，SQL 才不仅能跑，还能解释为什么得到这个结果。
{% endnote %}

{% note info flat %}
可复现实验输入：先执行 A02 的 ShopLab DDL，再在隔离库写入下面这组最小 seed。本文所有 `employees`、`orders` 查询都以这些列名和数据为准；重新执行前请清空对应实验表或换一个实验库。
{% endnote %}

```sql
INSERT INTO departments (id, name) VALUES
  (1, 'Engineering'), (2, 'Sales');
INSERT INTO employees (id, department_id, name, salary, hired_on) VALUES
  (1, 1, 'Ada', 12000.00, '2024-01-10'),
  (2, 1, 'Bohr', 12000.00, '2024-02-10'),
  (3, 1, 'Curie', 9000.00, '2024-03-10'),
  (4, 2, 'Hume', 15000.00, '2024-04-10'),
  (5, 2, 'Kant', 8000.00, '2024-05-10');
INSERT INTO users (id, email, display_name) VALUES
  (1, 'ada@example.com', 'Ada'), (2, 'bohr@example.com', 'Bohr');
INSERT INTO orders (id, user_id, status, total_amount, ordered_at) VALUES
  (101, 1, 'paid', 100.00, '2026-07-01 09:00:00'),
  (102, 1, 'paid', 200.00, '2026-07-02 09:00:00'),
  (103, 1, 'cancelled', 50.00, '2026-07-03 09:00:00'),
  (104, 2, 'paid', 300.00, '2026-07-04 09:00:00'),
  (105, 2, 'paid', 400.00, '2026-07-05 09:00:00');
```

{% note success flat %}
这组 seed 的固定检查点是：第二个不同薪资为 `12000.00`；用户 1 有 3 个订单（paid 2、cancelled 1）；用户 2 有 2 个 paid 订单；按月查询只出现 `2026-07`。这些结果用于核对后面的闪卡，而不是把示例当成无数据假设。
{% endnote %}

## 执行顺序

{% note info flat %}
SQL 的书写顺序不等于逻辑执行顺序。理解逻辑顺序能解释为什么 WHERE 不能直接使用 SELECT 别名，以及为什么组过滤要写 HAVING。
{% endnote %}

{% mermaid %}
flowchart TD
  F[FROM / JOIN 产生行] --> W[WHERE 过滤行]
  W --> G[GROUP BY 分组]
  G --> H[HAVING 过滤组]
  H --> S[SELECT 计算表达式]
  S --> D[DISTINCT 去重]
  D --> O[ORDER BY 排序]
  O --> L[LIMIT / OFFSET 截取]
{% endmermaid %}

{% note primary flat %}
“每个用户订单数大于 2”必须先分组再过滤，所以写 `HAVING COUNT(*) > 2`；“订单金额大于 100”是逐行条件，应写 WHERE。窗口函数在结果集上计算，不能用来替代 WHERE 的行过滤。
{% endnote %}

## 表达式与 NULL

{% note warning flat %}
NULL 表示未知或缺失，不等于 0、空字符串或 FALSE。`NULL = NULL` 的结果不是 TRUE；用 `IS NULL`/`IS NOT NULL` 判断，用 `COALESCE` 明确缺失值的展示策略。
{% endnote %}

| 表达式 | 结果 | 原因 |
| --- | --- | --- |
| `NULL = 1` | `NULL` | 比较结果未知 |
| `NULL = NULL` | `NULL` | 两个未知值不能证明相等 |
| `NULL IS NULL` | `TRUE` | 专门的 NULL 判断 |
| `TRUE AND NULL` | `NULL` | 另一条件不足以确定结果 |
| `FALSE AND NULL` | `FALSE` | FALSE 已足以确定 AND |
| `COALESCE(NULL, 0)` | `0` | 显式提供回退值 |

```sql
SELECT
  CASE
    WHEN status = 'paid' THEN '已支付'
    WHEN status IS NULL THEN '未知'
    ELSE '其他'
  END AS status_label,
  COALESCE(total_amount, 0) AS display_amount
FROM orders
ORDER BY id;
```

{% note info flat %}
比较不同类型时 MySQL 可能发生隐式转换；面试题和生产 SQL 应尽量用同类型列、显式 `CAST` 和明确的字符集，避免字符串日期或数字被静默转换。
{% endnote %}

| 边界 | 例子 | 结果与修复 |
| --- | --- | --- |
| 运算优先级 | `1 OR 0 AND 0` | `AND` 先算，结果为 1；需要改变语义时加括号 |
| 比较运算符 | `NULL <=> NULL` | NULL-safe equality 返回 1；普通 `=` 仍返回 NULL |
| 逻辑运算符 | `FALSE AND NULL` | 结果为 FALSE；三值逻辑不能当作普通布尔值 |
| 非类型运算符 | `BETWEEN`、`IN`、`LIKE`、`IS NULL` | 各自有边界，尤其 `BETWEEN` 两端包含，范围查询应明确半开区间 |

```sql
SELECT
  1 OR 0 AND 0 AS precedence_result,
  (1 OR 0) AND 0 AS parenthesized_result,
  NULL <=> NULL AS null_safe_equal;
```

## 函数转换

{% tabs 常用函数, 1 %}
<!-- tab 日期@fa-solid fa-calendar-days -->
`DATE(ordered_at)` 适合展示，按时间范围过滤时优先写 `ordered_at >= '2026-07-01' AND ordered_at < '2026-08-01'`，避免对列套函数破坏索引使用。
<!-- endtab -->
<!-- tab 字符串@fa-solid fa-font -->
`LOWER`、`TRIM`、`SUBSTRING` 用于清洗和展示；唯一性和搜索语义应由列的字符集、排序规则和索引共同定义。
<!-- endtab -->
<!-- tab 数值@fa-solid fa-calculator -->
`ROUND` 用于展示或明确舍入规则；金额列仍保持 DECIMAL，`CAST` 用于让比较和输出类型可读。
<!-- endtab -->
{% endtabs %}

| 任务 | 推荐写法 | 常见误区 |
| --- | --- | --- |
| 月份范围 | 半开区间 `[起点, 下月起点)` | `BETWEEN` 把月末时间边界写死 |
| 四舍五入 | `ROUND(amount, 2)` | 先转浮点再舍入 |
| 安全类型转换 | `CAST(value AS DECIMAL(12,2))` | 依赖字符串到数字的隐式转换 |
| 文本规范化 | 在写入边界统一清洗 | 每次查询都套函数导致索引难以使用 |

## 聚合分组

{% note primary flat %}
聚合函数把多行压缩成一个值。`COUNT(*)` 统计行，`COUNT(column)` 不统计该列为 NULL 的行，`COUNT(DISTINCT column)` 统计去重后的非 NULL 值；选择函数时要先说清楚分母。
{% endnote %}

```sql
SELECT
  user_id,
  COUNT(*) AS order_count,
  COUNT(DISTINCT DATE(ordered_at)) AS active_days,
  SUM(total_amount) AS gross_sales,
  AVG(total_amount) AS average_order
FROM orders
WHERE status = 'paid'
GROUP BY user_id
ORDER BY gross_sales DESC, user_id ASC;
```

{% note warning flat %}
启用 `ONLY_FULL_GROUP_BY` 时，SELECT 中的非聚合列通常必须出现在 GROUP BY 中，或能被唯一键等功能依赖关系确定。MySQL 也允许 WHERE 把非聚合列限制为单一值，例如 `WHERE user_id = 1`；`ANY_VALUE()` 只适合业务明确接受“任取一个”时使用，不能掩盖真正的分组错误。
{% endnote %}

```sql
-- 合法：WHERE 把 status 限制为单一值，聚合只统计 paid 行。
SELECT user_id, status, COUNT(*) AS paid_order_count
FROM orders
WHERE status = 'paid'
GROUP BY user_id;

-- 合法但语义必须明确：同一用户的 status 可能不同，任取一个只适合展示。
SELECT user_id, ANY_VALUE(status) AS sample_status, COUNT(*) AS order_count
FROM orders
GROUP BY user_id;
```

{% note info flat %}
`COUNT(DISTINCT ...)`、`SUM(DISTINCT ...)` 等聚合修饰符会先去重再计算；`GROUP_CONCAT` 还可以用 `DISTINCT`、`ORDER BY` 和 `SEPARATOR` 控制集合结果。去重的是值，不是整行，金额相同的两笔订单不能因此被误当成一笔。
{% endnote %}

```sql
SELECT
  COUNT(DISTINCT user_id) AS paid_user_count,
  GROUP_CONCAT(DISTINCT user_id ORDER BY user_id SEPARATOR ',') AS paid_users
FROM orders
WHERE status = 'paid';
```

## HAVING 条件聚合

{% note info flat %}
WHERE 决定哪些行进入分组，HAVING 决定哪些组留下。条件聚合把多个指标放在同一遍扫描中，用 `SUM(CASE WHEN ... THEN ... ELSE 0 END)` 保留分母和分子。
{% endnote %}

```sql
SELECT
  DATE_FORMAT(ordered_at, '%Y-%m') AS month,
  SUM(total_amount) AS total_sales,
  SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) AS paid_sales,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
FROM orders
GROUP BY DATE_FORMAT(ordered_at, '%Y-%m')
HAVING SUM(total_amount) > 0
ORDER BY month ASC;
```

{% note success flat %}
先用小样本手算一个月的行数和金额，再执行 SQL 对照。空集合上的 `SUM` 可能为 NULL，若业务需要 0，写 `COALESCE(SUM(...), 0)` 并在答案中说明。
{% endnote %}

## 排序分页

{% note primary flat %}
结果集没有隐含顺序。面试答案和接口分页都要给出稳定的完整排序键，例如 `ORDER BY ordered_at DESC, id DESC`；只按时间排序遇到同一时间戳时结果可能抖动。
{% endnote %}

```sql
SELECT id, user_id, total_amount, ordered_at
FROM orders
WHERE status = 'paid'
ORDER BY ordered_at DESC, id DESC
LIMIT 20 OFFSET 40;
```

{% note warning flat %}
OFFSET 越大，数据库通常需要扫描并丢弃更多行。列表很大或数据持续写入时，改用上一页最后一组排序键做 Keyset Pagination；索引设计会在后续索引文章展开。
{% endnote %}

{% note info flat %}
排序优化要同时看结果顺序和访问路径：稳定的复合排序键能避免分页抖动，匹配排序前缀的索引可能减少 filesort，但选择性、过滤条件和回表成本仍要用 `EXPLAIN` 验证，不能看到 `ORDER BY` 就假设一定走索引。
{% endnote %}

```sql
EXPLAIN
SELECT id, user_id, total_amount, ordered_at
FROM orders
WHERE user_id = 1 AND status = 'paid'
ORDER BY ordered_at DESC, id DESC
LIMIT 20;
```

{% note info flat %}
低频函数只在需求明确时使用：位函数适合位掩码，摘要函数适合完整性标识而不是密码存储，信息函数读取当前连接或会话状态，其他函数（如 `UUID()`）要先确认排序、长度和幂等语义。它们不替代本篇的聚合主线。
{% endnote %}

| 函数族 | 最小例子 | 边界 |
| --- | --- | --- |
| 位函数 | `BIT_COUNT(7)` → `3` | 先定义每一位的业务含义，避免把整数当无约束集合 |
| 摘要/加密函数 | `SHA2('ShopLab', 256)` | 摘要不可逆；密码应使用专用密码哈希和密钥管理 |
| 信息函数 | `CONNECTION_ID()`、`CURRENT_USER()` | 反映当前连接/账户，不是业务用户 ID |
| 其他函数 | `UUID()` | 每次调用可能不同，不能直接当可排序的短主键 |

## 常见问题

{% flashcard basic id:mysql84-04-second-highest-salary-p1 deck:"mysql-8.4-interview" priority:1 tags:"聚合,第二高薪,NULL" %}
--- question
查询员工表中的第二高薪；如果最高薪并列，仍然返回严格意义上的第二个不同薪资。SQL 怎么写？
--- answer
```sql
SELECT MAX(salary) AS second_salary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```
--- explanation
子查询先确定最高薪，外层再在严格更小的集合中取最大值：

```text
全部薪资 [15000, 15000, 12000, 9000]
        ↓ salary < MAX(salary)
候选薪资 [12000, 9000]
        ↓ MAX
第二个不同薪资 12000
```

因此最高薪并列不会重复计数；没有第二档时结果是 `NULL`。如果问题问的是“第二名员工”，还要定义并列处理和稳定排序，不能把两个题目混成同一个 `MAX`。
{% endflashcard %}

{% flashcard basic id:mysql84-04-monthly-sales-p1 deck:"mysql-8.4-interview" priority:1 tags:"GROUP BY,月度销售,日期" %}
--- question
按月统计 paid 订单销售额，要求月份升序且没有订单的月份不凭空补行，SQL 怎么写？
--- answer
```sql
SELECT DATE_FORMAT(ordered_at, '%Y-%m') AS month, SUM(total_amount) AS sales
FROM orders
WHERE status = 'paid'
GROUP BY DATE_FORMAT(ordered_at, '%Y-%m')
ORDER BY month;
```
--- explanation
这条查询只对实际出现的 `paid` 月份分组。以示例 seed 为例，聚合输入只有一组：

| month | paid rows | sales |
| --- | ---: | ---: |
| `2026-07` | 1 | `1000.00` |

没有订单的月份不会凭空出现；如果产品要求补零，需要先生成日历月份，再对聚合结果 `LEFT JOIN`。对 `DATETIME` 过滤时使用 `[start, end)` 半开区间，避免把月末 `23:59:59.999999` 漏掉。
{% endflashcard %}

{% flashcard basic id:mysql84-04-conditional-aggregation-p2 deck:"mysql-8.4-interview" priority:2 tags:"条件聚合,CASE,HAVING" %}
--- question
一次扫描统计每个用户的订单总数、paid 数量和 cancelled 数量，并只保留总数至少为 3 的用户，SQL 怎么写？
--- answer
```sql
SELECT user_id, COUNT(*) AS total_orders,
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
FROM orders
GROUP BY user_id
HAVING COUNT(*) >= 3
ORDER BY user_id;
```
--- explanation
`WHERE` 决定进入分组的行，`SUM(CASE ...)` 决定每个状态的分子，`HAVING` 最后过滤分组：

```text
orders
  ├─ WHERE（本题不先删状态）
  ├─ GROUP BY user_id
  ├─ COUNT(*) / SUM(CASE ...) 计算各列
  └─ HAVING COUNT(*) >= 3
```

如果把 `status = 'paid'` 放进 `WHERE`，总数分母就只剩 paid 行。示例 seed 的用户 1 输出为 `3 / 2 / 1`；允许 `NULL` 时要在 `CASE` 中明确它的归类，并用 `ORDER BY user_id` 固定结果顺序。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 SELECT, https://dev.mysql.com/doc/refman/8.4/en/select.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Aggregate Functions, https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Aggregate Functions and Modifiers, https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions-and-modifiers.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Operators, https://dev.mysql.com/doc/refman/8.4/en/non-typed-operators.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Bit Functions, https://dev.mysql.com/doc/refman/8.4/en/bit-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Encryption Functions, https://dev.mysql.com/doc/refman/8.4/en/encryption-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Information Functions, https://dev.mysql.com/doc/refman/8.4/en/information-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Miscellaneous Functions, https://dev.mysql.com/doc/refman/8.4/en/miscellaneous-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 GROUP BY Handling, https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Functional Dependence, https://dev.mysql.com/doc/refman/8.4/en/group-by-functional-dependence.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 ORDER BY Optimization, https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

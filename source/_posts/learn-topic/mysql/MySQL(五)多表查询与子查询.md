---
title: MySQL(五)多表查询与子查询
tags:
  - MySQL
  - 多表查询与子查询
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从连接、存在性判断和集合运算推进到标量、相关与派生子查询，解决跨表 SQL 面试场景。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 5
published: true
abbrlink: 55ce38b
date: 2026-03-27 00:00:00
---

{% course_series %}

{% note primary flat %}
多表题先画出“保留谁、匹配谁、没有匹配怎么办”的关系，再选择 JOIN、EXISTS 或集合运算。连接解决行的组合，子查询解决集合或标量的判断，两者不要靠背模板混用。
{% endnote %}

{% note info flat %}
可复现实验输入：先执行 A02 的 ShopLab DDL，再使用 A04 的 employees、orders seed，并补充 products `101/102/103`、order_items 和 login_events。本文统一使用 `employees.id`、`users.id`、`orders.user_id`；固定检查点是用户 3 无订单、用户 1 已购买 101/102/103、用户 2 只购买 101，且 `user_imports.email` 可以包含 NULL 来演示三值逻辑。
{% endnote %}

```sql
-- 在空实验库中补充多表题的最小数据；orders/user_imports 表结构来自 A02。
INSERT INTO products (id, sku, name, price) VALUES
  (101, 'P-101', 'Keyboard', 100.00),
  (102, 'P-102', 'Mouse', 50.00),
  (103, 'P-103', 'Cable', 20.00);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (101, 101, 1, 100.00), (101, 102, 1, 50.00), (101, 103, 1, 20.00),
  (102, 101, 1, 100.00);
INSERT INTO login_events (user_id, logged_at, success) VALUES
  (2, '2026-07-01 09:00:00', 1);
INSERT INTO users (id, email, display_name) VALUES
  (3, 'curie@example.com', 'Curie');
INSERT INTO user_imports (source_name, external_id, email, raw_payload) VALUES
  ('legacy', 'null-email-1', NULL, JSON_OBJECT('source', 'legacy'));
```

{% note success flat %}
在这组补充数据上，`NOT EXISTS` 返回用户 3；分组最高薪使用 `employees.id` 作为稳定键；关系除法返回用户 1。若你的 A04 seed 使用了不同主键，只需保持这些关系和预期集合，不要改变查询语义。
{% endnote %}

## 连接模型

{% mermaid %}
flowchart TD
  U[users] -->|user_id| O[orders]
  O -->|order_id| I[order_items]
  I -->|product_id| P[products]
  P -->|product_id| V[inventory]
  U -.没有订单仍保留.- L[LEFT JOIN 结果]
{% endmermaid %}

{% note info flat %}
`INNER JOIN` 只保留双方匹配的行；`LEFT JOIN` 保留左表全部行，右表未匹配列为 NULL；`CROSS JOIN` 生成笛卡尔积；自连接把同一表看作两个角色。外连接中，匹配条件和右表过滤通常应写在 `ON`，否则放进 WHERE 可能把 `LEFT JOIN` 变回 `INNER JOIN`；对 INNER JOIN，等价的过滤也可以写在 WHERE。
{% endnote %}

![INNER JOIN、LEFT JOIN、RIGHT JOIN 与 FULL OUTER JOIN 的集合关系示意图](/img/learn-topic/mysql/join-types.jpeg "SQL JOIN 类型示意图")

{% note warning flat %}
集合图只帮助判断“保留哪一侧的行”，不能代替基于键和基数的结果推导。MySQL 原生没有 `FULL OUTER JOIN` 语法；需要两侧保留时，应明确用 `LEFT JOIN` 与反向 `LEFT JOIN` 的 `UNION` 组合，并验证重复行与 NULL。
{% endnote %}

| 需求 | 首选 | 结果边界 |
| --- | --- | --- |
| 只要有订单的用户 | `INNER JOIN` 或 `EXISTS` | 一个用户多订单会重复，必要时 `DISTINCT` |
| 所有用户及订单数 | `LEFT JOIN` + `COUNT(order.id)` | 无订单用户计数为 0，不是 1 |
| 是否存在至少一行 | `EXISTS` | 找到第一行即可，不需要去重 |
| 两个集合都必须满足 | `NOT EXISTS` 双重否定 | 注意空集合和 NULL |

## 子查询

{% note primary flat %}
标量子查询必须最多返回一行；行子查询比较多个列；`IN`/`ANY`/`ALL` 比较集合；相关子查询引用外层行，语义直观但可能反复执行。先确认子查询的基数，再决定运算符。
{% endnote %}

```sql
-- 标量：找出高于全体平均薪资的员工
SELECT id, name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC, id;

-- ANY：找出薪资高于同部门至少一位同事的员工
SELECT e.id, e.name, e.salary
FROM employees AS e
WHERE e.salary > ANY (
  SELECT peer.salary
  FROM employees AS peer
  WHERE peer.department_id = e.department_id
    AND peer.id <> e.id
)
ORDER BY e.department_id, e.salary, e.id;

-- ALL：找出同部门没有更高薪资的员工；没有同部门同事时 ALL 空集为 TRUE
SELECT e.id, e.name, e.salary
FROM employees AS e
WHERE e.salary >= ALL (
  SELECT peer.salary
  FROM employees AS peer
  WHERE peer.department_id = e.department_id
    AND peer.id <> e.id
);

-- 行子查询：同时比较部门和薪资
SELECT id, name
FROM employees
WHERE (department_id, salary) IN (
  SELECT department_id, MAX(salary)
  FROM employees
  GROUP BY department_id
);
```

{% note warning flat %}
标量子查询返回两行会报错；`ALL` 对空集合的逻辑结果与直觉不同；`NOT IN` 遇到 NULL 会把结果变成 UNKNOWN。回答时先写出集合是否可能为空、是否可能含 NULL。
{% endnote %}

## 存在性

{% note info flat %}
“没有订单的用户”是反连接问题。`LEFT JOIN ... IS NULL` 和 `NOT EXISTS` 都能表达它；`NOT EXISTS` 不会因为订单重复而放大用户行，通常更适合作为存在性语义的直接表达。
{% endnote %}

```sql
SELECT u.id, u.email
FROM users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM orders AS o
  WHERE o.user_id = u.id
)
ORDER BY u.id;
```

{% note success flat %}
用固定 seed 验证时，结果应包含从未下单的用户且每个用户只出现一次。若改写成 LEFT JOIN，过滤条件必须放在 `ON` 中，并使用 `COUNT(o.id)` 而不是 `COUNT(*)`。
{% endnote %}

## 派生表

{% note primary flat %}
FROM 子句中的子查询叫派生表，必须有别名；它先形成中间关系，再被外层查询连接或过滤。派生表适合把“先聚合、后连接”的两阶段问题写清楚。
{% endnote %}

```sql
  SELECT d.department_id, d.id, d.salary
FROM (
  SELECT department_id, MAX(salary) AS salary
  FROM employees
  GROUP BY department_id
) AS top_salary
JOIN employees AS d
  ON d.department_id = top_salary.department_id
 AND d.salary = top_salary.salary
ORDER BY d.department_id, d.id;
```

{% note warning flat %}
上面的写法保留并列最高薪员工。如果题目要求每组只留一人，必须额外定义 tie-breaker（例如最小 `employees.id`），否则“最高”与“唯一一行”不是同一件事。
{% endnote %}

```sql
-- LATERAL 允许派生表引用 FROM 中它左侧的当前用户；每个用户最多取一笔最近订单。
SELECT u.id, latest.order_id, latest.ordered_at
FROM users AS u
LEFT JOIN LATERAL (
  SELECT o.id AS order_id, o.ordered_at
  FROM orders AS o
  WHERE o.user_id = u.id
  ORDER BY o.ordered_at DESC, o.id DESC
  LIMIT 1
) AS latest ON TRUE
ORDER BY u.id;
```

{% note info flat %}
`LATERAL` 解决的是“派生表需要看到左侧行”的作用域问题；普通派生表不能直接引用外层 `u`。如果只是先聚合再回连，普通派生表就足够，不要为了新语法增加复杂度。
{% endnote %}

## 失败边界

{% note warning flat %}
标量子查询若返回多行会产生错误 1242（Subquery returns more than 1 row）；同表修改与子查询组合还可能触发错误 1093。先让失败可见，再按题意改成 `IN`、聚合、临时表或多表 UPDATE。
{% endnote %}

```sql
-- 失败示例：用户 1 有多笔订单，标量子查询返回多行。
SELECT id, total_amount
FROM orders
WHERE total_amount = (
  SELECT total_amount FROM orders WHERE user_id = 1
);

-- 修复为集合语义：
SELECT id, total_amount
FROM orders
WHERE total_amount IN (
  SELECT total_amount FROM orders WHERE user_id = 1
);

-- 同表修改的安全边界：先把目标 id 固定到临时表，再修改原表。
-- 直接 UPDATE ... WHERE id IN (SELECT id FROM employees ...) 可能触发错误 1093；
-- 先物化目标集合可以把读取与修改边界分开。
CREATE TEMPORARY TABLE employee_raise_ids AS
SELECT id FROM employees WHERE salary < 10000;
UPDATE employees AS e
JOIN employee_raise_ids AS r ON r.id = e.id
SET e.salary = e.salary * 1.10;
DROP TEMPORARY TABLE employee_raise_ids;
```

## 集合运算

{% note info flat %}
`UNION` 合并并去重，`UNION ALL` 保留重复；`INTERSECT` 取交集，`EXCEPT` 取差集。两侧 SELECT 的列数和可兼容类型必须一致；排序通常放在整个集合表达式末尾。
{% endnote %}

{% tabs 集合语义, 1 %}
<!-- tab UNION@fa-solid fa-object-group -->
合并两个结果集并去重；若重复也有业务意义，使用 `UNION ALL`。
<!-- endtab -->
<!-- tab INTERSECT@fa-solid fa-arrows-left-right -->
只保留同时出现在两侧的行；两侧列数和类型要可兼容。
<!-- endtab -->
<!-- tab EXCEPT@fa-solid fa-minus -->
保留左侧有、右侧没有的行；注意 NULL 和重复值的集合语义。
<!-- endtab -->
{% endtabs %}

| 运算 | 重复值 | 适合的问题 |
| --- | --- | --- |
| `UNION` | 去重 | 合并多个来源的用户集合 |
| `UNION ALL` | 保留 | 合并日志并保留次数 |
| `INTERSECT` | 集合交集 | 同时满足两组条件 |
| `EXCEPT` | 左减右 | 找出未出现在另一集合的对象 |

```sql
(
  SELECT user_id FROM orders WHERE status = 'paid'
)
UNION
(
  SELECT user_id FROM login_events WHERE success = 1
)
ORDER BY user_id;

SELECT id FROM users
INTERSECT
SELECT user_id FROM orders;

SELECT id FROM users
EXCEPT
SELECT user_id FROM orders;
```

{% folding cyan, TABLE 语句与子查询优化边界 %}
`TABLE users` 可以直接读取表的列；它不是 JOIN 或子查询的通用替代。优化器可能把可合并的派生表合并，也可能物化临时结果；不要仅凭 SQL 外观断言性能，最终以执行计划和实际数据验证。
{% endfolding %}

## 关系除法

{% note primary flat %}
“购买指定商品全集”要求一个用户对集合中的每个商品都满足条件。最稳妥的写法是双重 `NOT EXISTS`：不存在一个指定商品没有被该用户购买。
{% endnote %}

```sql
SELECT u.id, u.email
FROM users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM products AS required
  WHERE required.id IN (101, 102, 103)
    AND NOT EXISTS (
      SELECT 1
      FROM orders AS o
      JOIN order_items AS oi ON oi.order_id = o.id
      WHERE o.user_id = u.id
        AND o.status = 'paid'
        AND oi.product_id = required.id
    )
)
ORDER BY u.id;
```

{% note info flat %}
另一种写法是先筛选指定商品，再 `GROUP BY user_id HAVING COUNT(DISTINCT product_id) = 3`。只有在题目明确指定集合始终有三个元素时才能写死 3；更一般的答案应和需求集合的大小比较。
{% endnote %}

## NULL 边界

{% folding yellow, NOT IN 与 NULL %}
当外层值与子查询中的某个 NULL 候选进行比较，`NOT IN` 的结果可能是 UNKNOWN；WHERE 只保留 TRUE，于是原本没有匹配的用户也可能被过滤掉。若候选集中存在一个明确匹配值，结果仍会是 FALSE，不应把所有情况都概括成“必然空集”。
{% endfolding %}

{% note warning flat %}
更稳妥的反连接写法是 `NOT EXISTS`；如果业务确认候选列非 NULL，也可以在子查询中显式 `WHERE user_id IS NOT NULL`。先检查列约束和真实 seed，再选择改写。
{% endnote %}

```sql
-- 为了显式观察 NULL，构造一个含 NULL 的候选集合；A02 生产 orders.user_id 本身是 NOT NULL。
SELECT u.id
FROM users AS u
WHERE u.id NOT IN (
  SELECT c.user_id
  FROM (
    SELECT user_id FROM orders
    UNION ALL
    SELECT NULL AS user_id
  ) AS c
);

-- 安全的反连接
SELECT u.id
FROM users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM (
    SELECT user_id FROM orders
    UNION ALL
    SELECT NULL AS user_id
  ) AS c
  WHERE c.user_id = u.id
);
```

## 常见问题

{% flashcard basic id:mysql84-05-users-without-orders-p1 deck:"mysql-8.4-interview" priority:1 tags:"LEFT JOIN,NOT EXISTS,反连接" %}
--- question
查询从未下过订单的用户，要求每个用户只返回一次。SQL 应该怎么写？
--- answer
```sql
SELECT u.id, u.email
FROM users AS u
WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.user_id = u.id)
ORDER BY u.id;
```
--- explanation
`NOT EXISTS` 对每个用户做一个布尔判断：找到一条订单就排除，找不到才保留。它不会把订单行拼到结果中，因此用户有多笔订单也只返回一次。

```text
users
  ├─ user 1 → 找到订单 → false
  ├─ user 2 → 找到订单 → false
  └─ user 3 → 没有订单 → true
```

`LEFT JOIN` 也能实现，但订单条件必须放在 `ON`，并用 `o.id IS NULL` 判断右侧没有匹配；把条件放进 `WHERE` 会把外连接意外变成内连接。
{% endflashcard %}

{% flashcard basic id:mysql84-05-groupwise-max-p1 deck:"mysql-8.4-interview" priority:1 tags:"分组最大值,并列,JOIN" %}
--- question
查询每个部门薪资最高的所有员工（并列也保留），SQL 怎么写？
--- answer
```sql
SELECT e.department_id, e.id, e.name, e.salary
FROM employees AS e
JOIN (SELECT department_id, MAX(salary) AS salary FROM employees GROUP BY department_id) AS m
  ON m.department_id = e.department_id AND m.salary = e.salary
ORDER BY e.department_id, e.id;
```
--- explanation
派生表先把每个部门压缩成 `(department_id, max_salary)`，再回连员工表恢复姓名和主键：

```text
employees ── GROUP BY department_id, MAX(salary)
                    ↓
              最高薪派生表
                    ↓ JOIN department_id + salary
              恢复所有并列员工
```

因此 Engineering 的并列最高薪会返回两行。若题意是“每组只留一人”，必须再声明 tie-breaker（例如最小 `id`），并用 `ROW_NUMBER()` 或排序后截取；不能悄悄丢掉并列者。
{% endflashcard %}

{% flashcard basic id:mysql84-05-relational-division-p1 deck:"mysql-8.4-interview" priority:1 tags:"关系除法,NOT EXISTS,全集" %}
--- question
查询购买过商品 101、102、103 全部商品的用户，且只计算 paid 订单，SQL 怎么写？
--- answer
```sql
SELECT u.id
FROM users AS u
WHERE NOT EXISTS (
  SELECT 1 FROM products AS required
  WHERE required.id IN (101,102,103)
    AND NOT EXISTS (
      SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = u.id AND o.status = 'paid' AND oi.product_id = required.id
    )
)
ORDER BY u.id;
```
--- explanation
双重 `NOT EXISTS` 对应“没有一个必需商品缺失”：

```text
required 商品集合
  └─ 对每个商品检查 paid 订单中是否存在
       ├─ 缺失任意一个 → 排除用户
       └─ 全部存在 → 保留用户
```

先对需求集合去重，重复购买不能把同一商品算两次；再固定 `o.status = 'paid'`，否则待支付订单也会满足条件。需求集合为空时是“所有用户都满足”还是“返回空集”，需要由业务先定义，SQL 不能替你猜。
{% endflashcard %}

{% flashcard basic id:mysql84-05-not-in-null-p1 deck:"mysql-8.4-interview" priority:1 tags:"NOT IN,NULL,三值逻辑" %}
--- question
为什么 `WHERE id NOT IN (SELECT user_id FROM orders)` 可能返回空集？如何改写？
--- answer
```sql
SELECT u.id
FROM users AS u
WHERE NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.user_id = u.id)
ORDER BY u.id;
```
--- explanation
`NOT IN` 遇到候选集合中的 `NULL` 会产生 `UNKNOWN`，而 `WHERE` 只保留 `TRUE`：

| `id` | 候选集合含 `NULL` 时的判断 |
| --- | --- |
| 3 | `3 NOT IN (1, NULL)` → `UNKNOWN` |
| 1 | `1 NOT IN (1, NULL)` → `FALSE` |

所以结果可能为空，即使没有任何用户真的下过订单。`NOT EXISTS` 把判断改成逐行存在性，不受集合中的空值污染；若继续使用 `NOT IN`，必须先保证子查询列 `NOT NULL`，并用含 `NULL` 的 seed 验证边界。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 JOIN, https://dev.mysql.com/doc/refman/8.4/en/join.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Subqueries, https://dev.mysql.com/doc/refman/8.4/en/subqueries.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 EXISTS and NOT EXISTS, https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Set Operations, https://dev.mysql.com/doc/refman/8.4/en/set-operations.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Derived Tables, https://dev.mysql.com/doc/refman/8.4/en/derived-tables.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Lateral Derived Tables, https://dev.mysql.com/doc/refman/8.4/en/lateral-derived-tables.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Subquery Errors, https://dev.mysql.com/doc/refman/8.4/en/subquery-errors.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Subquery Restrictions, https://dev.mysql.com/doc/refman/8.4/en/subquery-restrictions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 TABLE Statement, https://dev.mysql.com/doc/refman/8.4/en/table.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Optimizing Subqueries, https://dev.mysql.com/doc/refman/8.4/en/optimizing-subqueries.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

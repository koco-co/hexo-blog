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
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
多表题先画出“保留谁、匹配谁、没有匹配怎么办”的关系，再选择 JOIN、EXISTS 或集合运算。连接解决行的组合，子查询解决集合或标量的判断，两者不要靠背模板混用。
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
`INNER JOIN` 只保留双方匹配的行；`LEFT JOIN` 保留左表全部行，右表未匹配列为 NULL；`CROSS JOIN` 生成笛卡尔积；自连接把同一表看作两个角色。连接条件必须写在 ON，右表过滤条件若放进 WHERE 可能把 LEFT JOIN 变回 INNER JOIN。
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

-- ANY / ALL：和同部门员工比较
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
SELECT d.department_id, d.employee_id, d.salary
FROM (
  SELECT department_id, MAX(salary) AS salary
  FROM employees
  GROUP BY department_id
) AS top_salary
JOIN employees AS d
  ON d.department_id = top_salary.department_id
 AND d.salary = top_salary.salary
ORDER BY d.department_id, d.employee_id;
```

{% note warning flat %}
上面的写法保留并列最高薪员工。如果题目要求每组只留一人，必须额外定义 tie-breaker（例如最小 employee_id），否则“最高”与“唯一一行”不是同一件事。
{% endnote %}

## 集合运算

{% note info flat %}
`UNION` 合并并去重，`UNION ALL` 保留重复；`INTERSECT` 取交集，`EXCEPT` 取差集。两侧 SELECT 的列数和可兼容类型必须一致；排序通常放在整个集合表达式末尾。
{% endnote %}

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

{% note danger flat %}
`NOT IN (subquery)` 只要子查询结果含 NULL，就可能让所有比较结果变成 UNKNOWN，最终返回空集。用 `NOT EXISTS` 表达反连接，或在子查询中明确排除 NULL，并把这个边界写进答案。
{% endnote %}

```sql
-- 安全的反连接
SELECT u.id
FROM users AS u
WHERE NOT EXISTS (
  SELECT 1
  FROM user_imports AS i
  WHERE i.email = u.email
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
EXISTS 只回答是否存在，不会因为一个用户有多笔订单而产生重复；LEFT JOIN 方案要把右表条件放在 ON 中，且不能使用 `COUNT(*)` 判断无订单。
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
派生表提供每组最高薪，回连能恢复员工明细。若题目要求每组一人，必须给出确定的 tie-breaker 并用窗口函数或额外排序实现。
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
必须去重商品，重复购买不能把一个商品算多次；要明确订单状态和需求集合为空时的业务语义。双重否定直接表达“对全集的每个元素都满足”。
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
这是三值逻辑而不是索引问题。回答时说明 NULL 的来源、是否允许 NULL，并用固定含 NULL 的 seed 验证改写前后的差异。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 JOIN, https://dev.mysql.com/doc/refman/8.4/en/join.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Subqueries, https://dev.mysql.com/doc/refman/8.4/en/subqueries.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 EXISTS and NOT EXISTS, https://dev.mysql.com/doc/refman/8.4/en/exists-and-not-exists-subqueries.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Set Operations, https://dev.mysql.com/doc/refman/8.4/en/set-operations.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Derived Tables, https://dev.mysql.com/doc/refman/8.4/en/derived-tables.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

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
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
查询题先确定“输入行如何变成结果集”，再写函数。只要把 NULL、分组、并列和排序边界说清楚，SQL 才不仅能跑，还能解释为什么得到这个结果。
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
启用 `ONLY_FULL_GROUP_BY` 时，SELECT 中的非聚合列必须出现在 GROUP BY 中，或能被唯一键等功能依赖关系确定。不要通过关闭严格模式让不确定结果“通过”；应补完整分组列或改用聚合。
{% endnote %}

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
`MAX(salary) < (SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees))` 容易重复嵌套且忽略 NULL；窗口函数能直接表达并列等级。题目若要求第二名员工而非第二个薪资，必须再定义并列处理和稳定排序。
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
如果要补齐没有订单的月份，需要独立的日历表或递归 CTE，那是不同题目；本题只返回数据中实际出现的月份。时间范围应使用半开区间，避免 DATETIME 精度造成月末遗漏。
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
WHERE 放条件会提前删除其他状态，导致总数分母错误；状态允许 NULL 时应写完整 CASE。输出要按 user_id 排序，避免并列结果顺序不稳定。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 SELECT, https://dev.mysql.com/doc/refman/8.4/en/select.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Aggregate Functions, https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 GROUP BY Handling, https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Functional Dependence, https://dev.mysql.com/doc/refman/8.4/en/group-by-functional-dependence.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 ORDER BY Optimization, https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

---
title: MySQL(六)CTE与窗口函数
tags:
  - MySQL
  - CTE与窗口函数
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 用 CTE 和窗口函数解决分组 Top N、去重、累计、排名与连续登录等需要保留行明细的 SQL 场景。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 6
published: true
abbrlink: 6d8f8f0
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
GROUP BY 会把一组行压成一行；窗口函数则在不丢失明细的情况下，为每行附加排名、累计值或邻行信息。CTE 负责把复杂查询拆成有名字的关系，二者组合正好覆盖高频 SQL 场景题。
{% endnote %}

## 窗口模型

{% mermaid %}
flowchart TD
  R[原始结果集] --> P[PARTITION BY 分区]
  P --> O[ORDER BY 分区内排序]
  O --> F[Frame 窗口帧]
  F --> W[ROW_NUMBER / RANK / SUM 等函数]
  W --> K[保留原行并增加计算列]
{% endmermaid %}

{% note info flat %}
窗口函数的三个问题必须分开回答：按什么分区、在分区内如何排序、当前行能看到哪些帧。没有 ORDER BY 的排名没有稳定意义；没有 tie-breaker 的并列行顺序也不稳定。
{% endnote %}

## 分组排名

{% note primary flat %}
`ROW_NUMBER` 为每行分配唯一序号，`RANK` 为并列留下间隔，`DENSE_RANK` 为并列但不留间隔。题目说“每组前 N 名”时，先确认并列是否都要保留。
{% endnote %}

```sql
WITH ranked AS (
  SELECT
    department_id,
    id,
    name,
    salary,
    DENSE_RANK() OVER (
      PARTITION BY department_id
      ORDER BY salary DESC
    ) AS salary_rank
  FROM employees
)
SELECT department_id, id, name, salary, salary_rank
FROM ranked
WHERE salary_rank <= 2
ORDER BY department_id, salary_rank, id;
```

{% note warning flat %}
窗口函数不能直接写在 WHERE 中，因为 WHERE 先于窗口计算。先用 CTE/派生表得到排名，再在外层过滤；否则会得到语法错误或错误的分组范围。
{% endnote %}

## 窗口帧

| 写法 | 看到的行 | 适合问题 |
| --- | --- | --- |
| `ROWS UNBOUNDED PRECEDING ... CURRENT ROW` | 按物理行累计 | 订单流水、稳定累计 |
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | 当前行及前两行 | 固定行数移动指标 |
| `RANGE` | 按排序值的 peers 处理 | 同值行需要相同范围的统计 |
| 无 frame 的排名函数 | 由函数定义 | `ROW_NUMBER`、`RANK`、`DENSE_RANK` |

```sql
SELECT
  id,
  ordered_at,
  total_amount,
  SUM(total_amount) OVER (
    ORDER BY ordered_at, id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_sales,
  AVG(total_amount) OVER (
    ORDER BY ordered_at, id
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS moving_average
FROM orders
WHERE status = 'paid'
ORDER BY ordered_at, id;
```

{% note success flat %}
累计结果必须有唯一排序键；这里用 `(ordered_at, id)` 防止同一时间的订单互换。验证时手算前两行和最后一行，确认 frame 没有被误写成整组或默认 peers。
{% endnote %}

## CTE 组合

{% note primary flat %}
CTE 的价值是给中间关系命名并限制每层职责。非递归 CTE 先完成清洗/聚合，外层再排名；递归 CTE 用 `WITH RECURSIVE` 处理树或日期序列，但必须有终止条件和上限。
{% endnote %}

```sql
WITH monthly AS (
  SELECT
    user_id,
    DATE_FORMAT(ordered_at, '%Y-%m') AS month,
    SUM(total_amount) AS sales
  FROM orders
  WHERE status = 'paid'
  GROUP BY user_id, DATE_FORMAT(ordered_at, '%Y-%m')
), ranked AS (
  SELECT
    monthly.*,
    ROW_NUMBER() OVER (
      PARTITION BY month
      ORDER BY sales DESC, user_id
    ) AS rn
  FROM monthly
)
SELECT user_id, month, sales
FROM ranked
WHERE rn <= 3
ORDER BY month, rn;
```

{% folding cyan, 递归 CTE 的安全边界 %}
```sql
WITH RECURSIVE dates AS (
  SELECT DATE('2026-07-01') AS day
  UNION ALL
  SELECT day + INTERVAL 1 DAY
  FROM dates
  WHERE day < DATE('2026-07-07')
)
SELECT day FROM dates ORDER BY day;
```
递归成员必须缩小剩余范围；生产环境还要检查递归深度、日期范围和临时表成本。不要用递归 CTE 代替已有日历表的高频报表。
{% endfolding %}

## 去重与邻行

{% note info flat %}
去重题先定义“保留哪一行”。`ROW_NUMBER() OVER (PARTITION BY 业务键 ORDER BY id)` 给出可复现的保留规则，再在外层只保留 `rn = 1`；没有 ORDER BY 的去重是随机的。
{% endnote %}

```sql
WITH marked AS (
  SELECT
    id,
    source_name,
    external_id,
    ROW_NUMBER() OVER (
      PARTITION BY source_name, external_id
      ORDER BY id
    ) AS rn
  FROM user_imports_raw
)
SELECT id, source_name, external_id
FROM marked
WHERE rn > 1
ORDER BY source_name, external_id, id;
```

{% note primary flat %}
连续登录是“日期减去行号后形成相同岛”的典型 gaps-and-islands 问题：先按用户和日期去重，再对日期排序，用 `TO_DAYS(login_day) - ROW_NUMBER()` 生成岛标识，最后按岛聚合长度。
{% endnote %}

```sql
WITH days AS (
  SELECT DISTINCT user_id, DATE(logged_at) AS login_day
  FROM login_events
  WHERE success = 1
), numbered AS (
  SELECT
    user_id,
    login_day,
    TO_DAYS(login_day) - ROW_NUMBER() OVER (
      PARTITION BY user_id ORDER BY login_day
    ) AS island
  FROM days
), streaks AS (
  SELECT user_id, island, COUNT(*) AS consecutive_days
  FROM numbered
  GROUP BY user_id, island
)
SELECT user_id, MAX(consecutive_days) AS longest_streak
FROM streaks
GROUP BY user_id
ORDER BY user_id;
```

## 使用边界

{% note warning flat %}
窗口函数只能出现在 SELECT 列表和 ORDER BY 等允许位置，不能直接用于 WHERE、JOIN 条件或 UPDATE 的目标表达式。先形成结果关系，再在外层过滤或写入；复杂窗口查询要用 EXPLAIN 检查排序和临时表成本。
{% endnote %}

## 常见问题

{% flashcard basic id:mysql84-06-topn-per-group-p1 deck:"mysql-8.4-interview" priority:1 tags:"窗口函数,Top N,并列" %}
--- question
查询每个部门薪资最高的两档薪资，要求并列员工全部保留，SQL 怎么写？
--- answer
```sql
WITH ranked AS (
  SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS r
  FROM employees AS e
)
SELECT id, department_id, name, salary
FROM ranked
WHERE r <= 2
ORDER BY department_id, r, id;
```
--- explanation
`ROW_NUMBER` 会在并列时任意舍弃行；`RANK` 会跳过等级。题目说“薪资档”时选择 DENSE_RANK，题目说“严格两行”时才选择 ROW_NUMBER 并定义 tie-breaker。
{% endflashcard %}

{% flashcard basic id:mysql84-06-deduplicate-row-number-p2 deck:"mysql-8.4-interview" priority:2 tags:"ROW_NUMBER,去重,稳定排序" %}
--- question
按 `(source_name, external_id)` 去重，保留 id 最小的记录，如何写出可审计的 SQL？
--- answer
```sql
SELECT id
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY source_name, external_id ORDER BY id) AS rn
  FROM user_imports_raw
) AS marked
WHERE rn > 1
ORDER BY id;
```
--- explanation
排序键决定保留规则，不能省略。删除后应添加唯一键防止复发；如果外部业务允许更新，应改用 UPSERT 而不是定期清理。
{% endflashcard %}

{% flashcard basic id:mysql84-06-running-total-p1 deck:"mysql-8.4-interview" priority:1 tags:"窗口帧,累计,ROWS" %}
--- question
按订单时间计算 paid 销售额累计值，时间相同的订单也要有确定顺序，SQL 怎么写？
--- answer
```sql
SELECT id, ordered_at,
       SUM(total_amount) OVER (
         ORDER BY ordered_at, id
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_sales
FROM orders
WHERE status = 'paid'
ORDER BY ordered_at, id;
```
--- explanation
`id` 是 tie-breaker，ROWS 明确按行累计；若使用默认 RANGE，同一排序值的 peers 可能一起纳入当前 frame，结果与逐行累计不同。
{% endflashcard %}

{% flashcard basic id:mysql84-06-consecutive-login-p1 deck:"mysql-8.4-interview" priority:1 tags:"连续登录,Gaps-and-Islands,窗口函数" %}
--- question
如何计算每个用户最长连续登录天数，并忽略同一天多次登录？
--- answer
```sql
WITH days AS (SELECT DISTINCT user_id, DATE(logged_at) AS login_day FROM login_events WHERE success = 1),
numbered AS (
  SELECT user_id, login_day,
         TO_DAYS(login_day) - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_day) AS island
  FROM days
)
SELECT user_id, MAX(streak) AS longest_streak
FROM (SELECT user_id, island, COUNT(*) AS streak FROM numbered GROUP BY user_id, island) AS s
GROUP BY user_id
ORDER BY user_id;
```
--- explanation
同日去重是关键，否则重复登录会打断日期与行号的差值。题目若要求自然日还是 24 小时窗口，也要先澄清；本题按自然日定义。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 WITH, https://dev.mysql.com/doc/refman/8.4/en/with.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Functions, https://dev.mysql.com/doc/refman/8.4/en/window-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Function Descriptions, https://dev.mysql.com/doc/refman/8.4/en/window-function-descriptions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Function Frames, https://dev.mysql.com/doc/refman/8.4/en/window-functions-frames.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Function Restrictions, https://dev.mysql.com/doc/refman/8.4/en/window-function-restrictions.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

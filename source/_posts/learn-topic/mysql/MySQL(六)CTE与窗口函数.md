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
date: 2026-03-28 00:00:00
---

{% course_series %}

{% note primary flat %}
GROUP BY 会把一组行压成一行；窗口函数则在不丢失明细的情况下，为每行附加排名、累计值或邻行信息。CTE 负责把复杂查询拆成有名字的关系，二者组合正好覆盖高频 SQL 场景题。
{% endnote %}

## 窗口模型

{% mermaid %}
flowchart TD
  R[原始结果集] --> W[选择窗口函数]
  W --> P[可选 PARTITION BY]
  W --> O[可选 ORDER BY]
  O --> F[聚合/导航函数可选 frame]
  P --> K[保留原行并增加计算列]
  O --> K
  F --> K
{% endmermaid %}

{% note info flat %}
窗口函数的三个问题必须分开回答：按什么分区、在分区内如何排序、当前行能看到哪些帧。没有 ORDER BY 的排名没有稳定意义；没有 tie-breaker 的并列行顺序也不稳定。
{% endnote %}

{% note info flat %}
`WITH 名称 AS (查询)` 先把一个查询结果命名为临时关系，后面的 SELECT 再读取它；它不是自动持久化表，也不会改变原表。下面先用 CTE 产生排名，再在外层过滤，正是“先形成关系、后使用窗口结果”的固定顺序。
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
| `RANGE` | 相同完整 `ORDER BY` 键的 peers 共享边界；带偏移的值范围还有单键/类型限制 | 同值排序键需要相同范围的统计 |
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

命名窗口把同一套分区/排序定义集中起来，适合同一查询中复用；`WINDOW` 子句位于 `WHERE` 之后、最终 `ORDER BY` 之前：

```sql
SELECT
  id,
  SUM(total_amount) OVER running_window AS running_sales,
  AVG(total_amount) OVER running_window AS running_average
FROM orders
WHERE status = 'paid'
WINDOW running_window AS (
  ORDER BY ordered_at, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
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

## 去重与连续区间

{% note info flat %}
去重题先定义“保留哪一行”。`ROW_NUMBER() OVER (PARTITION BY 业务键 ORDER BY id)` 给出可复现的保留规则，再在外层只保留 `rn = 1`；没有 ORDER BY 的去重是随机的。
{% endnote %}

{% note info flat %}
本篇查询沿用课程统一 ShopLab seed：排名使用 `employees(department_id, id, name, salary)`，累计使用 `orders(id, ordered_at, total_amount, status)`，连续登录使用 `login_events(user_id, logged_at, success)`。只做本篇实验时，先准备这些字段和对应的 seed；下面额外创建一个允许重复的导入 staging 表，正式表应在清理完成后再加业务唯一键：
{% endnote %}

```sql
CREATE TEMPORARY TABLE user_imports_raw (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  source_name VARCHAR(64) NOT NULL,
  external_id VARCHAR(128) NOT NULL,
  email VARCHAR(320) NOT NULL
);

INSERT INTO user_imports_raw (source_name, external_id, email) VALUES
  ('crm', 'u-1', 'alice@example.com'),
  ('crm', 'u-1', 'alice@example.com'),
  ('crm', 'u-2', 'bob@example.com');
```

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
三个排名函数表达的业务含义不同：

| 函数 | 并列处理 | 取前两档的结果 |
| --- | --- | --- |
| `ROW_NUMBER` | 强行给每行唯一序号 | 可能丢掉并列员工 |
| `RANK` | 并列同名次，后续名次跳号 | 可能没有第 2 档 |
| `DENSE_RANK` | 并列同名次，名次连续 | 正好表示两档薪资 |

题目说“薪资档”就用 `DENSE_RANK`；题目说“严格两行”才用 `ROW_NUMBER`，并明确 `ORDER BY salary DESC, id` 这样的 tie-breaker。排名后再过滤 `r <= 2`，不要先 `LIMIT` 破坏分组。
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
`ROW_NUMBER()` 的 `ORDER BY id` 同时承担“保留谁”的业务规则：

```text
同一 (source_name, external_id)
  id=10 → rn=1 → 保留
  id=11 → rn=2 → 删除候选
```

先只 `SELECT rn > 1` 预览，确认行数和业务键，再把相同窗口结果用于删除。清理后加唯一键防止复发；如果重复其实表示“同一外部对象的新版本”，应改用 UPSERT，而不是定时抹掉历史。
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
累计结果依赖两个细节：唯一排序键和窗口帧：

```sql
SUM(total_amount) OVER (
  ORDER BY ordered_at, id
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
)
```

`id` 让同一时间的订单有确定顺序，`ROWS` 表示逐行累加；只按 `ordered_at` 时，同时间行可能成为 peers，默认帧的语义会不同。验证时手算前两行和最后一行，确认累计值与业务定义一致。
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
“日期减行号”只在每个用户每天最多一行时成立，所以先去重：

```text
成功日期：01, 01, 02, 04
DISTINCT  → 01, 02, 04
行号：       1   2   3
日期-行号：  0   0   1  → 两个连续岛
```

再按岛计数取最大值。用户 1 的最长连续自然日是 2，用户 2 没有成功登录不应补造记录；如果业务要算“连续 24 小时”，就不能用 `DATE()` 的自然日模型。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 WITH, https://dev.mysql.com/doc/refman/8.4/en/with.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Functions, https://dev.mysql.com/doc/refman/8.4/en/window-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Function Descriptions, https://dev.mysql.com/doc/refman/8.4/en/window-function-descriptions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Function Frames, https://dev.mysql.com/doc/refman/8.4/en/window-functions-frames.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Named Windows, https://dev.mysql.com/doc/refman/8.4/en/window-functions-named-windows.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Window Function Restrictions, https://dev.mysql.com/doc/refman/8.4/en/window-function-restrictions.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

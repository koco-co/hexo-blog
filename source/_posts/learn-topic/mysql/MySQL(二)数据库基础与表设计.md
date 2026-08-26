---
title: MySQL(二)数据库基础与表设计
tags:
  - MySQL
  - 数据库基础与表设计
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从业务关系、数据类型、字符集、范式和约束出发，完成 ShopLab 九张表的可验证关系模型与 DDL。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 2
published: true
abbrlink: 54906a1
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
把业务规则写进表结构，数据才会在程序遗漏校验时仍然保持可信。本篇用一个订单系统贯穿实体、类型、字符集、约束和可验证 DDL。
{% endnote %}

## 关系模型

{% note info flat %}
先问“系统里有哪些会独立变化的事实”，再决定表。用户、部门、员工、商品、库存、订单、订单明细、登录事件和导入批次分别有自己的生命周期；订单和商品的多对多关系必须通过明细表拆开。
{% endnote %}

{% mermaid %}
erDiagram
  users ||--o{ orders : places
  users ||--o{ login_events : records
  users ||--o{ user_imports : imports
  departments ||--o{ employees : contains
  orders ||--|{ order_items : contains
  products ||--o{ order_items : appears_in
  products ||--|| inventory : has
{% endmermaid %}

{% note primary flat %}
图中的一条线不是装饰：`order_items` 保存“某订单购买某商品多少件以及成交单价”，`inventory` 保存当前库存状态。把这两类事实塞进 `orders` 会产生重复列、更新异常和无法表达多商品订单的问题。
{% endnote %}

| 业务事实 | 主键 | 关键约束 | 为什么独立成表 |
| --- | --- | --- | --- |
| 用户 | `users.id` | `email` 唯一 | 用户资料会被多个订单和登录事件引用 |
| 组织 | `departments.id` | `name` 唯一 | 员工属于部门，部门可以暂时没有员工 |
| 商品 | `products.id` | `sku` 唯一、价格非负 | 商品信息与库存数量变化频率不同 |
| 库存 | `inventory.product_id` | 外键、数量非负 | 一个商品一行当前库存，扣减必须可锁定 |
| 订单 | `orders.id` | 用户外键、状态检查 | 订单头只保存一次买家和状态 |
| 明细 | `(order_id, product_id)` | 数量、成交价、生成金额 | 解决订单与商品的多对多关系 |
| 事件与导入 | 各自的自增键 | 时间、外部批次唯一 | 事件和导入记录是追加事实，不应覆盖主表 |

## 类型选择

{% note primary flat %}
类型不是“能存下就行”。要同时考虑精度、范围、排序语义、时区、字符长度和存储成本；默认值也要与业务是否允许“未知”区分开。
{% endnote %}

{% tabs 类型决策, 1 %}
<!-- tab 金额与数量@fa-solid fa-coins -->
金额使用 `DECIMAL(12,2)`，不要用 `FLOAT` 承担账务相等判断；数量使用 `INT UNSIGNED`，再用 `CHECK (quantity > 0)` 表达订单明细必须为正。
<!-- endtab -->
<!-- tab 时间@fa-solid fa-clock -->
审计事件使用 `DATETIME(6)` 保存业务时钟值；`TIMESTAMP` 适合需要自动初始化/更新且接受会话时区转换的列。`fsp` 可为 0～6，精度必须由去重和排序需求决定。
<!-- endtab -->
<!-- tab 文本与 JSON@fa-solid fa-font -->
标识和可检索文本使用 `VARCHAR`；长度不可控的原始载荷使用 `JSON`。JSON 不是关系约束的替代品，常用查询字段仍应落成列或生成列。
<!-- endtab -->
{% endtabs %}

| 场景 | 推荐 | 避免 | 验证点 |
| --- | --- | --- | --- |
| 价格、税额、余额 | `DECIMAL(p,s)` | `FLOAT`/`DOUBLE` 做金额相等 | 明确小数位和溢出策略 |
| 时间事件 | `DATETIME(6)` | 用字符串拼时间 | 统一 UTC 约定，回读 `@@session.time_zone` |
| 邮箱、SKU | `VARCHAR` + 唯一键 | 用 `TEXT` 充当标识 | 字符集、排序规则会影响唯一性 |
| 原始导入资料 | `JSON` | 把不稳定字段硬塞进几十列 | 需要索引时用生成列或显式字段 |
| 布尔状态 | `BOOLEAN`（本质为整数）+ CHECK | 让任意整数都表示状态 | 用 `IN (0,1)` 或业务枚举约束 |

{% note warning flat %}
旧笔记中的 `utf8` 在 MySQL 中是 `utf8mb3` 的别名，不能存储全部 Unicode。新库、表和连接统一写 `utf8mb4`，并在迁移时检查旧列长度、索引长度和排序规则差异。
{% endnote %}

## 字符集

{% mermaid %}
flowchart LR
  C[客户端] --> S[连接字符集\ncharacter_set_client/results/connection]
  S --> D[数据库默认值]
  D --> T[表默认值]
  T --> K[列级覆盖]
{% endmermaid %}

{% note info flat %}
字符集决定如何编码，排序规则决定如何比较和排序。数据库默认值只会为新对象提供默认；列级定义、连接协商和已有数据都可能覆盖它，因此排查乱码要同时查看四层。
{% endnote %}

```sql
CREATE DATABASE IF NOT EXISTS shoplab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE shoplab;
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

SELECT @@character_set_client,
       @@character_set_connection,
       @@character_set_results,
       @@character_set_database,
       @@collation_database;
```

{% note danger flat %}
不要把“客户端显示正常”当成“库中编码正确”。在转换旧表前先备份、抽样读取多字节字符，再用 `SHOW CREATE TABLE` 和 `information_schema.COLUMNS` 核对列级字符集；直接 `DROP DATABASE` 会删除其中全部表，权限不会因此自动删除。
{% endnote %}

## 约束建表

{% note primary flat %}
建表顺序遵循“被引用表先于引用表”：先创建用户、部门、商品，再创建库存、订单、事件和导入表。主键保证身份，唯一键防止业务重复，外键保证引用存在，CHECK 保证行内不变量。
{% endnote %}

{% folding blue, ShopLab 完整 DDL（可复制） %}
```sql
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB;

CREATE TABLE departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name)
) ENGINE = InnoDB;

CREATE TABLE employees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL,
  salary DECIMAL(12,2) NOT NULL,
  hired_on DATE NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT ck_employees_salary CHECK (salary >= 0),
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id)
    REFERENCES departments (id)
) ENGINE = InnoDB;

CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku VARCHAR(40) NOT NULL,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  attributes JSON NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_sku (sku),
  CONSTRAINT ck_products_price CHECK (price >= 0)
) ENGINE = InnoDB;

CREATE TABLE inventory (
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (product_id),
  CONSTRAINT ck_inventory_quantity CHECK (quantity >= 0),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id)
    REFERENCES products (id)
) ENGINE = InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  ordered_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_orders_user_time (user_id, ordered_at, id),
  CONSTRAINT ck_orders_status CHECK (status IN ('pending','paid','cancelled')),
  CONSTRAINT ck_orders_total CHECK (total_amount >= 0),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE order_items (
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(14,2) AS (quantity * unit_price) STORED,
  PRIMARY KEY (order_id, product_id),
  CONSTRAINT ck_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT ck_order_items_price CHECK (unit_price >= 0),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE = InnoDB;

CREATE TABLE login_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  logged_at DATETIME(6) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45) NULL,
  PRIMARY KEY (id),
  KEY idx_login_events_user_time (user_id, logged_at, id),
  CONSTRAINT fk_login_events_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB;

CREATE TABLE user_imports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_name VARCHAR(80) NOT NULL,
  external_id VARCHAR(120) NOT NULL,
  email VARCHAR(255) NULL,
  raw_payload JSON NOT NULL,
  imported_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_imports_source_external (source_name, external_id)
) ENGINE = InnoDB;
```
{% endfolding %}

| 约束 | 解决的问题 | 失败时通常看到什么 |
| --- | --- | --- |
| `PRIMARY KEY` | 一行的稳定身份 | 重复键或无法把行唯一定位 |
| `UNIQUE` | 邮箱、SKU、外部导入号不能重复 | `Duplicate entry` |
| `FOREIGN KEY` | 子表不能引用不存在的父行 | `Cannot add or update a child row` |
| `CHECK` | 行内状态、金额、数量范围 | `Check constraint ... is violated` |
| 生成列 | 让派生金额由数据库计算 | 不能直接写入生成列 |

## 结构验证

{% timeline 建表闭环, blue %}
<!-- timeline 需求 -->
列出实体、基数和不变量，先确定主键与引用方向。
<!-- endtimeline -->
<!-- timeline DDL -->
按父表到子表执行 DDL；任何约束失败都修正输入或结构，不关闭约束绕过。
<!-- endtimeline -->
<!-- timeline 回读 -->
用 `SHOW CREATE TABLE`、`SHOW INDEX` 和 `information_schema` 检查列、键、默认值、字符集和外键。
<!-- endtimeline -->
<!-- timeline 负例 -->
故意插入不存在的用户、负库存和重复 SKU，确认数据库拒绝非法状态。
<!-- endtimeline -->
{% endtimeline %}

```sql
SHOW TABLES;
SHOW CREATE TABLE order_items;
SHOW INDEX FROM orders;

SELECT table_name, table_collation
FROM information_schema.TABLES
WHERE table_schema = DATABASE();

SELECT table_name, column_name, column_type, is_nullable,
       column_default, column_key, extra, collation_name
FROM information_schema.COLUMNS
WHERE table_schema = DATABASE()
ORDER BY table_name, ordinal_position;
```

{% note success flat %}
验收不是“CREATE TABLE 没报错”，而是结构回读和失败测试都符合设计：九张表存在、所有外键方向正确、金额没有浮点类型、中文列使用 `utf8mb4`，非法父键和负数量会被拒绝。
{% endnote %}

## 边界语法

| 语法 | 用途 | 不能忽略的边界 |
| --- | --- | --- |
| `CREATE TEMPORARY TABLE` | 当前会话的临时结果 | 断开连接后消失，不能当作持久表交付 |
| `CREATE TABLE new LIKE old` | 复制列和索引 | 不复制外键定义，发布前要重新核对 |
| `CREATE TABLE ... SELECT` | 用查询结果建表 | 约束和索引通常需要另行定义 |
| `INVISIBLE` 列 | 兼容性迁移或隐藏内部列 | `SELECT *` 不返回，显式列名仍可访问 |
| GIPK | 在缺少主键时生成不可见主键 | 由 `sql_generate_invisible_primary_key` 控制，不替代业务主键设计 |
| `DROP DATABASE` | 删除实验库 | 破坏性操作；先确认库名、备份和当前连接 |

{% folding yellow, 临时表与复制语法示例 %}
```sql
CREATE TEMPORARY TABLE order_totals AS
SELECT order_id, SUM(line_total) AS amount
FROM order_items
GROUP BY order_id;

CREATE TABLE order_items_backup LIKE order_items;
-- 外键定义不会由 LIKE 自动复制，必要时重新写 ALTER TABLE ... ADD CONSTRAINT。

CREATE TABLE paid_orders AS
SELECT id, user_id, total_amount
FROM orders
WHERE status = 'paid';

ALTER TABLE user_imports ADD COLUMN legacy_note VARCHAR(255) INVISIBLE;
SELECT legacy_note FROM user_imports;
```
{% endfolding %}

## 常见问题

{% flashcard basic id:mysql84-02-order-schema-ddl-p1 deck:"mysql-8.4-interview" priority:1 tags:"DDL,外键,CHECK,ShopLab" %}
--- question
请为订单系统设计 DDL：订单包含多个商品，库存不能为负，订单状态只能是 pending、paid、cancelled，并且重复 SKU 必须被拒绝。关键表和约束如何写？
--- answer
```sql
CREATE TABLE products (id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, sku VARCHAR(40) NOT NULL UNIQUE, price DECIMAL(12,2) NOT NULL CHECK (price >= 0));
CREATE TABLE orders (id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, user_id BIGINT UNSIGNED NOT NULL, status VARCHAR(20) NOT NULL CHECK (status IN ('pending','paid','cancelled')), FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE order_items (order_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL, quantity INT UNSIGNED NOT NULL CHECK (quantity > 0), unit_price DECIMAL(12,2) NOT NULL, PRIMARY KEY (order_id, product_id), FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (product_id) REFERENCES products(id));
```
--- explanation
先创建 users、products，再创建 inventory、orders 和 order_items。金额用 DECIMAL，明细金额用生成列，外键保证引用存在；测试重复 SKU、负数量和不存在父键，预期分别得到重复键、CHECK 失败和外键失败。不要把商品列重复写进 orders，也不要用应用层校验替代数据库约束。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Creating Tables, https://dev.mysql.com/doc/refman/8.4/en/creating-tables.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Data Types, https://dev.mysql.com/doc/refman/8.4/en/data-types.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Character Sets, https://dev.mysql.com/doc/refman/8.4/en/charset.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Foreign Keys, https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Generated Columns, https://dev.mysql.com/doc/refman/8.4/en/create-table-generated-columns.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

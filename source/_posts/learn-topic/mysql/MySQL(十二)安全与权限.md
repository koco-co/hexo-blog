---
title: MySQL(十二)安全与权限
tags:
  - MySQL
  - 安全与权限
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从账户主机匹配、角色和最小权限推进到连接加密、预处理语句和认证迁移，设计可审计的应用访问边界。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 12
published: true
abbrlink: aa88466a
date: 2026-04-03 00:00:00
---

{% course_series %}

{% note primary flat %}
数据库安全首先是边界设计：谁能从哪里连接、以哪个角色执行什么动作、连接是否加密、异常如何审计。应用账户不应拥有改表结构、授予权限或读取不必要个人数据的能力。
{% endnote %}

## 安全链

{% mermaid %}
flowchart TD
  N[账户名 + Host] --> A[认证插件]
  A --> T[TLS / 连接准入]
  T --> R[激活角色]
  R --> G[对象与列权限]
  G --> Q[SQL 执行与审计]
{% endmermaid %}

{% note info flat %}
认证回答“你是谁”，授权回答“你能做什么”，加密回答“传输途中谁能看到”，审计回答“发生了什么”。只给用户 GRANT 而不检查 host、TLS 和日志，不能称为完整安全方案。
{% endnote %}

## 账户与主机

{% note primary flat %}
MySQL 账户由 `'user'@'host'` 共同标识。`'app'@'localhost'` 与 `'app'@'10.%'` 是两个账户；host 匹配和更具体规则会影响最终使用哪条认证与权限记录。
{% endnote %}

| 设计 | 推荐 | 风险 |
| --- | --- | --- |
| 本机管理 | `'dba'@'localhost'` | 不要把 root 暴露给业务网络 |
| 应用连接 | `'shoplab_app'@'10.20.%'` 或具体网段 | `%` 过宽，来源边界不可审计 |
| 报表只读 | 独立角色与账户 | 与写账户共用凭据难以撤销 |
| 临时排障 | 有过期/回收流程的账户 | 用完不 DROP 会留下长期入口 |

## 角色授权

{% note primary flat %}
角色把权限集合与人/服务账户分离。先创建角色，再按对象授予最小权限，最后激活角色并用 `SHOW GRANTS` 回读；不要直接给应用账户 `ALL PRIVILEGES ON *.*`。
{% endnote %}

```sql
CREATE ROLE IF NOT EXISTS 'shoplab_readwrite'@'%';
CREATE USER IF NOT EXISTS 'shoplab_app'@'10.20.%'
  IDENTIFIED WITH caching_sha2_password BY RANDOM PASSWORD;

GRANT SELECT, INSERT, UPDATE
  ON shoplab.orders TO 'shoplab_readwrite'@'%';
GRANT SELECT, INSERT, UPDATE
  ON shoplab.order_items TO 'shoplab_readwrite'@'%';
GRANT SELECT, UPDATE
  ON shoplab.inventory TO 'shoplab_readwrite'@'%';

GRANT 'shoplab_readwrite'@'%'
  TO 'shoplab_app'@'10.20.%';
SET DEFAULT ROLE 'shoplab_readwrite'@'%'
  TO 'shoplab_app'@'10.20.%';

SHOW GRANTS FOR 'shoplab_app'@'10.20.%';
```

{% note warning flat %}
`BY RANDOM PASSWORD` 生成的密码必须由安全的凭据系统接管，不要复制进文章、日志或 shell 历史。示例没有展示真实凭据；生产环境还要限制账户来源、连接加密、密码轮换和回收时间。
{% endnote %}

## 权限边界

| 权限层级 | 示例 | 适用 |
| --- | --- | --- |
| 全局 | `PROCESS`、`RELOAD` | 极少数 DBA 操作，不能给应用 |
| 数据库 | `USAGE`、数据库级对象访问 | 受控的库范围默认 |
| 表 | `SELECT`、`INSERT`、`UPDATE` | 应用最常用的最小权限 |
| 列 | `UPDATE(email)` | 只允许修改少量敏感字段 |
| 角色 | 读写/报表/迁移角色 | 统一授予、集中撤销 |

{% note info flat %}
授权变更通常立即影响后续语句；`FLUSH PRIVILEGES` 不是日常 GRANT/REVOKE 的必需步骤。撤销权限前先回读当前 grants，避免把角色继承或默认角色误判成直接授权。
{% endnote %}

```sql
-- 会话级临时激活角色；默认角色决定新连接的初始权限，二者不是一回事。
SET ROLE 'shoplab_readwrite'@'%';
SELECT CURRENT_ROLE();

-- 回收与生命周期管理：先确认依赖，再执行并回读。
REVOKE UPDATE ON shoplab.inventory FROM 'shoplab_readwrite'@'%';
ALTER USER 'shoplab_app'@'10.20.%' ACCOUNT LOCK;
ALTER USER 'shoplab_app'@'10.20.%' ACCOUNT UNLOCK;

-- 回收入口时才执行；先确认连接池、默认角色和回退账户均已切换。
-- DROP USER 'shoplab_app'@'10.20.%';
-- DROP ROLE 'shoplab_readwrite'@'%';
```

{% note warning flat %}
部分撤销用于“全局授予但排除某个库”的特殊场景，需要先确认 `@@global.partial_revokes` 和治理流程；普通应用账户更适合直接授予目标库/表权限。账户活动审计可从 Performance Schema、连接日志和权限变更记录拼出证据，不能把普通 `SHOW GRANTS` 当成完整审计系统。
{% endnote %}

```sql
SELECT @@global.partial_revokes;
SELECT EVENT_NAME, COUNT_STAR, SUM_TIMER_WAIT
FROM performance_schema.events_statements_summary_global_by_event_name
WHERE EVENT_NAME LIKE 'statement/sql/%'
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
```

## 预处理语句

{% note primary flat %}
值使用参数绑定，能减少 SQL 注入和类型转换歧义；表名、列名和排序方向不能用值参数替代，必须从白名单映射到固定 SQL 片段。预处理语句还有资源生命周期，执行后要释放。
{% endnote %}

```sql
PREPARE find_order FROM
  'SELECT id, status, total_amount
   FROM shoplab.orders
   WHERE user_id = ? AND status = ?
   ORDER BY ordered_at DESC, id DESC';

SET @user_id = 7;
SET @status = 'paid';
EXECUTE find_order USING @user_id, @status;
DEALLOCATE PREPARE find_order;
```

{% note danger flat %}
不要把未经白名单处理的用户输入拼进 PREPARE 字符串；不要把 PREPARE 当作权限隔离。动态 SQL 仍以执行账户的权限运行，调用链需要最小角色和审计。
{% endnote %}

## 连接安全

{% note primary flat %}
TLS 保护客户端与服务器之间的传输，账户 host 和防火墙决定谁能到达服务器；两者不能互相替代。对必须加密的账户使用 `REQUIRE SSL` 或更严格的证书要求，并在连接后回读 `@@session.ssl_cipher` 等证据。
{% endnote %}

```sql
ALTER USER 'shoplab_app'@'10.20.%' REQUIRE SSL;

SELECT USER(), CURRENT_USER(),
       @@session.ssl_cipher,
       @@global.require_secure_transport;
```

{% note warning flat %}
`USER()` 是客户端提交的账户和来源，`CURRENT_USER()` 是实际匹配到的授权账户；排查“明明授权却被拒绝”时要同时查看二者、host 匹配、默认角色和 TLS 要求。
{% endnote %}

## 认证迁移

{% note info flat %}
MySQL 8.4 的默认认证方向是 `caching_sha2_password`。旧系统中的 `mysql_native_password` 在 8.4 默认禁用，迁移前要盘点客户端驱动、连接池和复制账户，确认兼容后再轮换认证插件；不要在文章中给出真实密码或启用开关作为“一键修复”。
{% endnote %}

| 迁移步骤 | 证据 |
| --- | --- |
| 盘点账户与插件 | `mysql.user` 中的 `plugin`（按授权访问读取） |
| 盘点驱动 | 客户端版本、TLS 和认证支持矩阵 |
| 创建/轮换账户 | 新角色最小权限、随机密码和回收旧账户 |
| 灰度切换 | 连接成功率、错误码、审计日志 |
| 回收旧入口 | `ALTER USER`/`DROP USER` 前保留可验证回退 |

## 资源与审计

```sql
ALTER USER 'shoplab_app'@'10.20.%'
  WITH MAX_USER_CONNECTIONS 40
       MAX_QUERIES_PER_HOUR 0;

SELECT user, host, account_locked, password_expired,
       plugin
FROM mysql.user
WHERE user IN ('shoplab_app');
```

{% note success flat %}
权限验收至少包括：应用能完成目标读写、不能 DROP/ALTER/GRANT、未授权表查询失败、非 TLS 连接被拒绝、角色撤销后新语句立即失败、锁定账户无法新建连接。用最小权限测试账户完成验证，不要用 root 证明应用可用。
{% endnote %}

## 常见问题

{% flashcard basic id:mysql84-12-app-role-grants-p1 deck:"mysql-8.4-interview" priority:1 tags:"角色,最小权限,GRANT" %}
--- question
为订单应用创建只允许读写 orders、order_items 和 inventory 的角色，并绑定到应用账户；如何写出最小权限授权？
--- answer
```sql
CREATE ROLE 'shoplab_order_rw';
CREATE USER 'shoplab_app'@'10.20.%'
  IDENTIFIED WITH caching_sha2_password BY RANDOM PASSWORD
  REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE
  ON shoplab.orders TO 'shoplab_order_rw';
GRANT SELECT, INSERT, UPDATE
  ON shoplab.order_items TO 'shoplab_order_rw';
GRANT SELECT, UPDATE
  ON shoplab.inventory TO 'shoplab_order_rw';
GRANT 'shoplab_order_rw' TO 'shoplab_app'@'10.20.%';
SET DEFAULT ROLE 'shoplab_order_rw' TO 'shoplab_app'@'10.20.%';
SHOW GRANTS FOR 'shoplab_app'@'10.20.%';
```
--- explanation
这组授权要同时验证“能做什么”和“不能做什么”：

| 检查 | 预期 |
| --- | --- |
| `SELECT/INSERT/UPDATE` 目标三张表 | 成功 |
| 读取其他业务表 | 拒绝 |
| `DROP`、`ALTER`、`GRANT OPTION` | 不存在 |
| 非 TLS 或未匹配 host 的连接 | 拒绝 |

`'user'@'host'` 是授权身份的一部分，`%` 过宽会让来源边界无法审计。`RANDOM PASSWORD` 的回显必须交给安全凭据系统，部署工具若不支持该流程，就在安全通道外部生成并注入，绝不能把密码或日志回显写入仓库。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Security Guidelines, https://dev.mysql.com/doc/refman/8.4/en/security-guidelines.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Access Control, https://dev.mysql.com/doc/refman/8.4/en/access-control.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Roles, https://dev.mysql.com/doc/refman/8.4/en/roles.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 GRANT, https://dev.mysql.com/doc/refman/8.4/en/grant.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Partial Revokes, https://dev.mysql.com/doc/refman/8.4/en/partial-revokes.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Account Management, https://dev.mysql.com/doc/refman/8.4/en/account-management-statements.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Encrypted Connections, https://dev.mysql.com/doc/refman/8.4/en/encrypted-connections.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Pluggable Authentication, https://dev.mysql.com/doc/refman/8.4/en/pluggable-authentication.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Prepared Statements, https://dev.mysql.com/doc/refman/8.4/en/sql-prepared-statements.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

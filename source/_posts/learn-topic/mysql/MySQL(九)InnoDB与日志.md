---
title: MySQL(九)InnoDB与日志
tags:
  - MySQL
  - InnoDB与日志
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 理解 Buffer Pool、redo、undo、doublewrite、checkpoint、binlog 和崩溃恢复，建立持久化写入链路。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 9
published: true
abbrlink: b67bacc6
date: 2026-03-31 00:00:00
---

{% course_series %}

{% note primary flat %}
一条 UPDATE 从客户端到磁盘并不是“直接写文件”：InnoDB 先在内存页上修改，用 redo 保证崩溃后能重做，用 undo 支持回滚和一致性读，binlog 再把已提交的逻辑变更交给复制和时间点恢复。
{% endnote %}

## 写入链路

{% mermaid %}
flowchart TD
  C[SQL 请求] --> B[Buffer Pool\n数据页变脏]
  B --> R[Redo Log Buffer]
  R --> F[Redo Log 文件]
  B --> D[Doublewrite / Tablespace]
  C --> U[Undo Log]
  C --> X[Binary Log]
  F --> Q[崩溃恢复重做]
  X --> P[复制与 PITR]
{% endmermaid %}

{% note info flat %}
提交时优先保证日志记录落盘，脏数据页可以稍后由刷脏线程写入表空间；这就是 WAL（Write-Ahead Logging）的核心。redo、undo 和 binlog 的格式、生命周期与用途不同，不能互相替代。
{% endnote %}

## Buffer Pool

{% note primary flat %}
Buffer Pool 缓存表页和索引页，命中时读写避免磁盘 I/O。被修改过但尚未写回的页是脏页；checkpoint 推进表示哪些 redo 之前的脏页已经安全写回，可以回收日志空间。
{% endnote %}

| 组件 | 主要职责 | 失败/恢复意义 |
| --- | --- | --- |
| Buffer Pool | 缓存数据页、索引页、自适应哈希等 | 进程重启后需要从磁盘和 redo 恢复 |
| Redo Log | 记录页级物理变化的持久化顺序 | 崩溃后重做未写回的变化 |
| Undo Log | 保存旧版本或反向信息 | 回滚、MVCC 一致性读 |
| Doublewrite | 先写完整页副本再写数据页 | 防止部分页写造成 torn page |
| Tablespace | 持久保存表、索引和 undo 等对象 | 恢复和备份的物理边界 |
| Row Format | 决定记录、变长列和溢出页的组织方式 | 行宽、压缩和页内存储需要结合表结构验证 |
| Change Buffer | 缓存非唯一二级索引的延迟变更 | 只适用于满足条件的二级索引，不能当作通用写缓存 |
| Binary Log | 记录服务器级逻辑事件 | 复制、PITR 与变更重放 |

{% note warning flat %}
Buffer Pool 命中率高不等于查询一定快：低选择性扫描、排序、锁等待和网络都可能成为瓶颈；反过来，调大 Buffer Pool 也不能代替合适索引和事务设计。
{% endnote %}

## 三类日志

{% note info flat %}
`redo` 关注“这次页修改是否能在崩溃后重做”；`undo` 关注“如何回到旧版本或撤销本次事务”；`binlog` 关注“服务器对外产生了什么逻辑事件”。面试解释时按这三个问题分层，不要说成三个“备份文件”。
{% endnote %}

```sql
SHOW VARIABLES LIKE 'innodb%log%';
SHOW VARIABLES LIKE 'log_bin';
SHOW BINARY LOGS;
SHOW ENGINE INNODB STATUS;
```

{% note primary flat %}
InnoDB 与 binlog 的提交需要协调：事务先写 redo，binlog 记录事务事件，提交阶段让二者状态一致。若只看到某一份日志，不能推断事务已对外可见；恢复和复制还要核对 GTID/位置与提交状态。
{% endnote %}

{% note info flat %}
持久化语义由 `innodb_flush_log_at_trx_commit` 与 `sync_binlog` 等变量共同影响：`1/1` 通常给出更强的提交持久性，但会增加 I/O；放宽策略会扩大崩溃时可能丢失的窗口。不要把“客户端收到 COMMIT 成功”与“所有数据页已经刷入表空间”混为一谈。
{% endnote %}

## 刷脏与恢复

{% timeline 从写入到恢复, blue %}
<!-- timeline 修改 -->
事务修改 Buffer Pool 中的页，产生 undo 和 redo；数据页此时可能仍是脏页。
<!-- endtimeline -->
<!-- timeline 提交 -->
redo 和 binlog 在提交协议中完成持久化协调，客户端得到成功响应。
<!-- endtimeline -->
<!-- timeline checkpoint -->
后台线程刷脏页并推进 checkpoint；日志空间达到压力阈值时会反过来限制写入。
<!-- endtimeline -->
<!-- timeline 崩溃 -->
重启时扫描 checkpoint 后的 redo，重做已记录但未写入的数据页；再根据事务状态处理未完成事务。
<!-- endtimeline -->
{% endtimeline %}

{% note success flat %}
“提交成功”意味着事务的持久化承诺已满足，不意味着每个脏页都立刻写入最终表空间。验证崩溃恢复要看重启后的数据、事务状态、redo LSN 和 binlog 连续性。
{% endnote %}

## 8.4 运行边界

{% folding cyan, 专用服务器与日志容量 %}
MySQL 8.4 可以通过 `innodb_dedicated_server` 根据机器内存自动估算部分 InnoDB 配置；它只适合明确由单个 MySQL 实例专用的服务器，容器共享节点或手工调优环境不应盲目开启。日志容量、刷脏阈值和 I/O 能力要结合恢复时间目标设置。
{% endfolding %}

{% note danger flat %}
不要为了“让日志更快”随意关闭 doublewrite、降低持久化策略或删除 binlog。任何持久化配置变化都必须先说明 durability、恢复窗口、复制和备份后果，并保留可回滚的配置版本。
{% endnote %}

## 验证证据

```sql
SELECT NAME, SPACE, SPACE_TYPE, FILE_SIZE, ALLOCATED_SIZE
FROM information_schema.INNODB_TABLESPACES
ORDER BY NAME;

SELECT VARIABLE_NAME, VARIABLE_VALUE
FROM performance_schema.global_variables
WHERE VARIABLE_NAME IN (
  'innodb_buffer_pool_size',
  'innodb_redo_log_capacity',
  'innodb_doublewrite',
  'innodb_flush_log_at_trx_commit',
  'sync_binlog'
);

SELECT NAME, SPACE_TYPE, ROW_FORMAT, FILE_SIZE
FROM information_schema.INNODB_TABLESPACES
WHERE NAME LIKE 'shoplab/%';
```

{% note success flat %}
一次可复现的实验至少记录版本、关键持久化变量、事务提交结果、重启前后的行值、binlog 文件/位置或 GTID，以及恢复后的一致性查询。缺少其中任一项，只能说明“读到了当前数据”，不能证明完成了崩溃恢复验证。
{% endnote %}

## 常见问题

{% flashcard basic id:mysql84-09-redo-undo-binlog-p1 deck:"mysql-8.4-interview" priority:1 tags:"redo,undo,binlog,崩溃恢复" %}
--- question
redo、undo、binlog 分别解决什么问题？如何用一个隔离实验证明提交后的数据具备恢复证据？
--- answer
```sql
CREATE TABLE recovery_probe (
  id BIGINT PRIMARY KEY,
  value INT NOT NULL
) ENGINE = InnoDB;

INSERT INTO recovery_probe VALUES (1, 10);
START TRANSACTION;
UPDATE recovery_probe SET value = 11 WHERE id = 1;
COMMIT;

SELECT value FROM recovery_probe WHERE id = 1;
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
SHOW VARIABLES LIKE 'sync_binlog';
SHOW ENGINE INNODB STATUS;
SHOW BINARY LOGS;
```
--- explanation
三类日志可以沿着一次 `UPDATE` 的生命周期区分：

| 组件 | 主要内容 | 解决的问题 |
| --- | --- | --- |
| redo | 页的持久化变化 | 崩溃后把已提交变化重做到数据页 |
| undo | 旧版本与回滚信息 | 撤销未提交修改、支持一致性读 |
| binlog | 服务器级逻辑事件 | 复制和时间点恢复 |

实验里 `SELECT` 得到 `11` 只能证明当前实例读到了新值；还要记录 `innodb_flush_log_at_trx_commit`、`sync_binlog`、InnoDB 状态和 binlog，再在隔离实例执行重启/恢复演练。`SHOW BINARY LOGS` 需要权限，转储和日志可能含敏感业务数据，不能把探针表或日志操作直接搬到生产。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 InnoDB Architecture, https://dev.mysql.com/doc/refman/8.4/en/innodb-architecture.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Buffer Pool, https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 InnoDB Change Buffer, https://dev.mysql.com/doc/refman/8.4/en/innodb-change-buffer.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 InnoDB Row Formats, https://dev.mysql.com/doc/refman/8.4/en/innodb-row-format.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Redo Log, https://dev.mysql.com/doc/refman/8.4/en/innodb-redo-log.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Undo Logs, https://dev.mysql.com/doc/refman/8.4/en/innodb-undo-logs.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Doublewrite Buffer, https://dev.mysql.com/doc/refman/8.4/en/innodb-doublewrite-buffer.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Recovery, https://dev.mysql.com/doc/refman/8.4/en/innodb-recovery.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Binary Log, https://dev.mysql.com/doc/refman/8.4/en/binary-log.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

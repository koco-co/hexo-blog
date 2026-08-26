---
title: MySQL(十三)备份恢复与复制
tags:
  - MySQL
  - 备份恢复与复制
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 用 RecoverLab 串起一致备份、mysqldump、binlog 时间点恢复、GTID 复制和恢复验证，建立可执行的灾备闭环。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 13
published: true
abbrlink: 94d5d11f
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
备份不是“生成一个文件”，而是能在目标时间点恢复到可用状态并证明数据正确。RecoverLab 用基线备份、binlog、恢复环境、复制状态和业务校验串成一条可演练链路。
{% endnote %}

## RecoverLab

{% mermaid %}
flowchart LR
  W[主库写入] --> B[一致基线备份]
  W --> L[Binary Log]
  B --> R[隔离恢复实例]
  L --> P[按时间/位置重放]
  P --> V[业务校验与切换决定]
  W --> S[异步副本]
  S -.不是备份替代.- B
{% endmermaid %}

{% note danger flat %}
复制不是备份：误删、错误 UPDATE 和权限误用都可能被复制到副本。备份必须有独立介质、保留策略、加密、恢复账号和定期演练；副本只能降低故障切换时间的一部分。
{% endnote %}

## 备份类型

| 类型 | 一致性/速度 | 适用 |
| --- | --- | --- |
| 逻辑备份 | 可读、跨版本灵活，恢复较慢 | 小中型库、迁移、抽样恢复 |
| 物理备份 | 恢复快，依赖版本/布局 | 大库、低 RTO |
| 全量 | 提供完整基线 | 周期性基线与长期保留 |
| 增量/差异 | 节省空间，链路更复杂 | 大库和短恢复窗口 |
| binlog | 记录基线后的逻辑变化 | PITR、复制与审计 |

{% note info flat %}
备份策略由 RPO（最多丢多少数据）和 RTO（多久恢复）反推。只有全量备份没有 binlog 只能恢复到备份时刻；只有副本没有独立基线无法应对逻辑误删。
{% endnote %}

## 逻辑备份

{% note primary flat %}
InnoDB 逻辑备份通常使用 `--single-transaction` 获得一致性快照，配合 `--source-data=2` 记录开始位置，恢复时才能从基线之后重放 binlog。运行前要确认长事务、非事务表和锁影响。
{% endnote %}

```bash
mysqldump \
  --single-transaction \
  --source-data=2 \
  --routines --events --triggers \
  --hex-blob \
  --databases shoplab \
  > shoplab-baseline.sql

sha256sum shoplab-baseline.sql
```

{% note warning flat %}
不要把 dump 文件直接当作已经验证的备份：要检查退出码、文件摘要、文件权限、备份时间、记录的 binlog 位点和抽样恢复结果。`--single-transaction` 不会让非事务表自动获得一致快照，也不会冻结所有 DDL。
{% endnote %}

## 时间点恢复

{% timeline PITR 演练, blue %}
<!-- timeline 基线 -->
记录备份开始时间、GTID/文件位置和校验摘要；把基线恢复到隔离实例。
<!-- endtimeline -->
<!-- timeline 事故前 -->
确定要恢复到的 UTC 时间点或 binlog 起止位置，先排除误操作之后的事件。
<!-- endtimeline -->
<!-- timeline 重放 -->
用 `mysqlbinlog` 生成受控 SQL，审阅起止边界，再导入恢复实例。
<!-- endtimeline -->
<!-- timeline 验证 -->
执行行数、金额、外键和业务抽样校验，确认恢复点后才讨论切换。
<!-- endtimeline -->
{% endtimeline %}

```bash
# 查看 binlog 事件和时间边界
mysqlbinlog --base64-output=DECODE-ROWS -vv \
  --start-position=12345 \
  --stop-datetime='2026-08-26 10:15:00' \
  binlog.000123 > replay.sql

# 在隔离恢复实例导入，不直接对生产库执行未经审阅的输出
mysql --binary-mode=1 shoplab_recover < replay.sql
```

{% note danger flat %}
PITR 的 stop 时间、时区、起始位点和 GTID 集合必须精确；边界错一秒或错一个事件都可能重复/漏写。恢复前保留原始 binlog，使用只读副本或隔离实例演练，禁止把示例位点直接当成生产位点。
{% endnote %}

## 异步复制

{% note primary flat %}
异步复制通常由 source 写 binlog，replica 拉取并写 relay log，再由 SQL 线程应用。延迟、网络、过滤规则和错误都会让副本落后；复制状态是恢复证据的一部分，不是“红绿灯”装饰。
{% endnote %}

```sql
-- 仅示意配置，密码使用凭据系统，不写入脚本
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST = 'db-source.internal',
  SOURCE_PORT = 3306,
  SOURCE_USER = 'repl_user',
  SOURCE_AUTO_POSITION = 1,
  SOURCE_SSL = 1;

START REPLICA;
SHOW REPLICA STATUS\G
STOP REPLICA;
```

| 状态字段 | 解释 |
| --- | --- |
| `Replica_IO_Running` | I/O 线程是否能拉取 source 日志 |
| `Replica_SQL_Running` | SQL 线程是否能应用 relay log |
| `Seconds_Behind_Source` | 粗略延迟指标，NULL 不等于 0 秒 |
| `Retrieved_Gtid_Set` | 已取到的 GTID 集合 |
| `Executed_Gtid_Set` | 已执行的 GTID 集合 |
| Last error 字段 | 复制停止时的第一手错误证据 |

{% note warning flat %}
GTID 自动定位减少了手工位点错误，但不自动解决版本兼容、过滤、冲突和逻辑错误。切换前要比较 GTID、业务校验和、读写入口、应用连接配置与回退路径。
{% endnote %}

## 日志保留

```sql
SHOW BINARY LOGS;
SHOW VARIABLES LIKE 'binlog_expire_logs_seconds';

-- 只有在备份、复制和保留策略都确认后才考虑清理
PURGE BINARY LOGS TO 'binlog.000120';
```

{% note danger flat %}
`PURGE BINARY LOGS` 和 `RESET BINARY LOGS AND GTIDS` 可能破坏复制/PITR 所需证据。清理前必须确认所有副本已执行、备份已验证、保留期限已满足，并保留审批与恢复记录。
{% endnote %}

## 恢复验收

{% note success flat %}
RecoverLab 的通过标准是：能从一份完整基线恢复、能在指定时间点停止重放、业务关键查询与约束校验通过、恢复耗时和数据丢失量被记录、失败时有明确回退。没有实际恢复演练，备份只能算“已生成”。
{% endnote %}

```sql
SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS orders FROM orders;
SELECT SUM(total_amount) AS paid_sales
FROM orders
WHERE status = 'paid';

SELECT COUNT(*) AS broken_items
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL;
```

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Backup and Recovery, https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Backup Types, https://dev.mysql.com/doc/refman/8.4/en/backup-types.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 mysqldump, https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Point-in-Time Recovery, https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Replication, https://dev.mysql.com/doc/refman/8.4/en/replication.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 GTID Auto-Positioning, https://dev.mysql.com/doc/refman/8.4/en/replication-gtids.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

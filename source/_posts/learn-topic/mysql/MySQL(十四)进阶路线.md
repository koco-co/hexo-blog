---
title: MySQL(十四)进阶路线
tags:
  - MySQL
  - 进阶路线
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 按存储对象、JSON与分区、监控、复制专项和 8.0→8.4 迁移五条分支选择后续能力。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 14
published: true
abbrlink: 5ad9ac4a
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note primary flat %}
核心课程解决大多数 OLTP 和面试问题；进阶路线解决“系统已经遇到具体约束”之后的专项选择。先描述容量、查询、故障或迁移目标，再选择分支，不把低频功能当作必背清单。
{% endnote %}

## 分支选择

{% mermaid %}
flowchart TD
  Q{当前问题是什么}
  Q -->|封装业务读写| O[存储对象]
  Q -->|半结构化/搜索/大表| D[JSON、全文、空间、分区]
  Q -->|观测与归因| M[Performance Schema、sys、I_S]
  Q -->|跨实例可用性| R[复制专项]
  Q -->|版本生命周期| U[8.0 到 8.4 迁移]
{% endmermaid %}

{% note info flat %}
每个分支都要写进入条件、收益、限制、验证和退出条件。没有真实规模或故障证据时，先做小型隔离实验；不要因为功能存在就把它加入生产架构。
{% endnote %}

## 存储对象

| 对象 | 解决的问题 | 不适合替代 |
| --- | --- | --- |
| View | 稳定查询接口、列级投影 | 任意复杂业务流程或性能魔法 |
| Stored Procedure/Function | 在数据库内封装多步操作 | 取代应用测试和版本管理 |
| Trigger | 行变化时强制局部规则 | 跨服务副作用、难追踪的业务流程 |
| Event Scheduler | 定时数据库任务 | 需要可靠分布式调度的工作流 |

{% note primary flat %}
视图有算法、可更新性和 CHECK OPTION 边界；存储程序有参数、SQL 安全上下文和限制；触发器按行执行，批量写入时成本和调试复杂度会放大；事件需要启用调度器并监控失败。所有对象都应纳入迁移脚本、测试和审计。
{% endnote %}

```sql
CREATE SQL SECURITY INVOKER VIEW paid_order_summary AS
SELECT user_id, COUNT(*) AS order_count, SUM(total_amount) AS sales
FROM orders
WHERE status = 'paid'
GROUP BY user_id
WITH CASCADED CHECK OPTION;

SHOW CREATE VIEW paid_order_summary;
SHOW CREATE PROCEDURE some_procedure;
SHOW TRIGGERS FROM shoplab;
SHOW EVENTS FROM shoplab;
```

{% note warning flat %}
把触发器、事件或存储程序当作“隐藏的应用代码”会让回滚、测试和权限审查变难；创建对象前先写出调用者、SQL SECURITY、失败重试、锁范围和删除/回退方式。
{% endnote %}

## JSON 与搜索

{% tabs 半结构化能力, 1 %}
<!-- tab JSON@fa-solid fa-brackets-curly -->
用 JSON 函数读取、验证和修改文档；用 `JSON_TABLE` 把数组展开为关系行。高频过滤字段应落列或建生成列索引，不能把 JSON 当成无模式的无限仓库。
<!-- endtab -->
<!-- tab 全文@fa-solid fa-magnifying-glass -->
FULLTEXT 适合词法相关性搜索，有停用词、最小词长、语言和排序边界；它不是任意子串 LIKE 的加速器。
<!-- endtab -->
<!-- tab 空间@fa-solid fa-location-dot -->
空间类型和空间分析函数适合坐标、距离和几何关系；坐标系、SRID、精度和空间索引必须与数据采集合同一致。
<!-- endtab -->
{% endtabs %}

```sql
SELECT id,
       JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.color')) AS color
FROM products
WHERE JSON_CONTAINS(attributes, JSON_OBJECT('color', 'black'));

SELECT p.id, jt.color
FROM products AS p,
JSON_TABLE(
  p.attributes,
  '$' COLUMNS (color VARCHAR(32) PATH '$.color')
) AS jt;
```

{% note info flat %}
JSON validation 函数能拒绝结构不符合合同的文档，但不能自动替代外键、唯一键和金额约束；全文和空间搜索也有独立的索引、排序和版本配置，不要用普通 B+Tree 的经验直接套用。
{% endnote %}

## 分区设计

{% note primary flat %}
分区主要解决大表管理和分区裁剪，不是把单个查询自动变快。选择 RANGE、LIST、HASH、KEY 或子分区前先确定分区键、生命周期、唯一键限制、跨分区查询和归档动作。
{% endnote %}

```sql
CREATE TABLE login_events_archive (
  id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  logged_at DATETIME(6) NOT NULL,
  success BOOLEAN NOT NULL,
  PRIMARY KEY (id, logged_at)
)
PARTITION BY RANGE COLUMNS (logged_at) (
  PARTITION p2026q1 VALUES LESS THAN ('2026-04-01'),
  PARTITION p2026q2 VALUES LESS THAN ('2026-07-01'),
  PARTITION pmax VALUES LESS THAN (MAXVALUE)
);

EXPLAIN SELECT COUNT(*)
FROM login_events_archive
WHERE logged_at >= '2026-04-01'
  AND logged_at < '2026-07-01';
```

{% note danger flat %}
分区表的主键和唯一键通常必须包含分区列，外键、函数、表达式和跨分区操作也有明确限制。没有归档窗口、分区裁剪证据和恢复演练时，不要为了“看起来可扩展”改造核心表。
{% endnote %}

## 监控与引擎

{% folding cyan, 三套观测入口 %}
`INFORMATION_SCHEMA` 提供元数据和运行状态，Performance Schema 采集低级运行事件，sys schema 用较易读的视图汇总常见诊断。它们的开关、采样、权限和开销不同；排查慢 SQL 时先从 digest 和等待事件定位，再深入单个线程。
{% endfolding %}

```sql
SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'shoplab';

SELECT *
FROM sys.schema_table_statistics
WHERE table_schema = 'shoplab'
ORDER BY total_latency DESC
LIMIT 10;

SELECT *
FROM performance_schema.events_waits_summary_global_by_event_name
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

{% note warning flat %}
Performance Schema 和 sys 的结果是观测窗口内的统计，不是永久历史；重启、清空表或采样设置会改变口径。其他存储引擎有自己的事务、索引和恢复边界，课程核心默认以 InnoDB 为准。
{% endnote %}

## 复制专项

| 专项 | 目标 | 进入条件 |
| --- | --- | --- |
| Scale-out/性能 | 读扩展和日志吞吐 | 已有一致性读路由和延迟监控 |
| Delayed replica | 保留可回退窗口 | 能接受延迟并有切换演练 |
| 半同步 | 降低 source 已提交但副本未收到的窗口 | 网络、超时和故障策略可观测 |
| 异步连接故障切换 | 多 source 候选 | GTID、拓扑和客户端路由已验证 |
| 复制兼容/升级 | 跨版本安全传播 | 先核对日志格式、DDL 和版本支持矩阵 |

{% note primary flat %}
复制专项不会自动提高数据正确性。每个方案都要记录延迟、丢失窗口、冲突、切换时读写入口、回退和运维成本；先把 A13 的基线备份与 PITR 做好，再讨论延迟副本或半同步。
{% endnote %}

## 版本迁移

{% timeline 8.0 到 8.4, blue %}
<!-- timeline 盘点 -->
读取官方 upgrade paths 和 prerequisites，盘点版本、插件、存储引擎、认证、SQL mode、保留字和弃用项。
<!-- endtimeline -->
<!-- timeline 备份 -->
完成可恢复全量备份、binlog 保留和隔离恢复演练，记录回滚窗口。
<!-- endtimeline -->
<!-- timeline 预检 -->
在克隆环境运行升级检查、代表性查询、DDL、复制和客户端认证测试。
<!-- endtimeline -->
<!-- timeline 切换 -->
冻结变更、执行支持的升级路径，回读版本、表、权限、复制和业务校验。
<!-- endtimeline -->
<!-- timeline 收尾 -->
观察错误率和性能，保留旧实例/备份直到回退窗口结束，再按保留策略清理。
<!-- endtimeline -->
{% endtimeline %}

| 方式 | 优点 | 风险/适用边界 |
| --- | --- | --- |
| 原地升级 | 停机窗口短、保留数据目录 | 版本路径、插件和回退要求严格 |
| dump/load | 版本边界清晰、可重建结构 | 大库慢，字符集/对象/权限需核对 |
| 复制迁移 | 可灰度、切换窗口小 | 拓扑、GTID、日志格式和延迟复杂 |
| 公式安装 | 只更新软件包 | 不等于数据升级或兼容性验证 |

{% note danger flat %}
不要仅凭“二进制安装成功”宣布升级完成。升级必须有支持路径、预检、可恢复备份、隔离演练、客户端兼容和回退证据；遇到不支持的跨版本路径时先停下，不用强行跳级。
{% endnote %}

{% hideToggle 进阶路线自测, cyan, white %}
一个大表按月查询很慢，应该先选分区还是索引？先查看查询谓词、数据生命周期、分区裁剪和执行计划；如果只是缺索引或统计信息，分区会增加复杂度而不解决根因。只有归档、管理窗口和分区键合同明确时才进入分区专项。
{% endhideToggle %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Stored Objects, https://dev.mysql.com/doc/refman/8.4/en/stored-objects.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 JSON Functions, https://dev.mysql.com/doc/refman/8.4/en/json-functions.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Partitioning, https://dev.mysql.com/doc/refman/8.4/en/partitioning.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Performance Schema, https://dev.mysql.com/doc/refman/8.4/en/performance-schema.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Replication Upgrade, https://dev.mysql.com/doc/refman/8.4/en/replication-upgrade.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Upgrade Paths, https://dev.mysql.com/doc/refman/8.4/en/upgrade-paths.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Upgrade Prerequisites, https://dev.mysql.com/doc/refman/8.4/en/upgrade-prerequisites.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

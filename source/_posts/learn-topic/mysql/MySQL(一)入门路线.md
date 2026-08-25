---
title: MySQL(一)入门路线
tags:
  - MySQL
  - 数据库
  - SQL
categories:
  - Learn Topic
  - MySQL
description: 面向零基础和面试准备，以 MySQL 8.4 LTS、ShopLab 九表实验和 SQL 场景闪卡串起建模、查询、优化、事务、锁、安全与恢复。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 1
published: true
abbrlink: 2ec898f2
date: 2026-08-25 13:18:42
---

{% course_series %}

{% note info flat %}
本篇只说明课程范围、依赖和开始方式；具体知识点与面试复习题放在对应主题文章。
{% endnote %}

## 课程目标

{% note info flat %}
这套课程把旧笔记中分散的 DDL、DML、查询、事务、锁和日志内容升级为 MySQL 8.4 LTS 学习主线。完成核心课程后，你应该能够：
{% endnote %}

- 从业务需求设计关系模型、约束和索引；
- 独立编写聚合、连接、子查询、CTE 与窗口函数 SQL；
- 用执行计划和运行证据优化查询；
- 解释 InnoDB、事务、MVCC、锁和日志的协作方式；
- 为应用设计最小权限，并完成一次可验证的误删恢复；
- 在固定数据上完成 20 道接近面试的 SQL 场景题。

{% note info flat %}
课程以 Community Server 和 InnoDB 为主，不把 Enterprise、NDB Cluster、Group Replication 或其他引擎专项混入核心路线。
{% endnote %}

## 前置条件

{% note info flat %}
开始前只需要能够运行一个 MySQL 8.4.x 实例和命令行客户端。第一篇正式课程会从业务模型与建表开始，SQL、索引、事务和运维概念都在课程中逐步补齐。
{% endnote %}

{% note info flat %}
所有实验统一使用 UTC、utf8mb4、utf8mb4_0900_ai_ci、ONLY_FULL_GROUP_BY 与严格模式，并回读实际配置。安装方式不代表数据升级方式，实际补丁版本以服务器查询结果为准。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A02[数据库基础与表设计] --> A03[数据写入与约束]
  A03 --> A04[查询基础与聚合]
  A04 --> A05[多表查询与子查询]
  A05 --> A06[CTE与窗口函数]
  A02 --> A07[索引原理与设计]
  A04 --> A07
  A05 --> A08[执行计划与查询优化]
  A06 --> A08
  A07 --> A08
  A08 --> A09[InnoDB与日志]
  A09 --> A10[事务与MVCC]
  A10 --> A11[锁与并发控制]
  A02 --> A12[安全与权限]
  A03 --> A12
  A09 --> A13[备份恢复与复制]
  A10 --> A13
  A12 --> A13
  A13 --> A14[进阶路线 可选]
  A11 --> A15[综合实战]
  A13 --> A15
{% endmermaid %}

{% note info flat %}
主线先建立数据模型和查询能力，再进入索引、执行计划、InnoDB、事务与锁；安全与权限从表设计和写入分支进入，最后与日志、事务汇合到备份恢复。进阶路线是可选分支，不是综合实战的前置。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 一 | MySQL(一)入门路线 | 课程入口 | 无 | 公开路线图 |
| 二 | MySQL(二)数据库基础与表设计 | 数据库基础与表设计 | 入门路线 | 未发布占位 |
| 三 | MySQL(三)数据写入与约束 | 数据写入与约束 | 表设计 | 未发布占位 |
| 四 | MySQL(四)查询基础与聚合 | 查询基础与聚合 | 数据写入 | 未发布占位 |
| 五 | MySQL(五)多表查询与子查询 | 多表查询与子查询 | 查询基础 | 未发布占位 |
| 六 | MySQL(六)CTE与窗口函数 | CTE与窗口函数 | 多表查询 | 未发布占位 |
| 七 | MySQL(七)索引原理与设计 | 索引原理与设计 | 表设计、查询基础 | 未发布占位 |
| 八 | MySQL(八)执行计划与查询优化 | 执行计划与查询优化 | 多表、窗口、索引 | 未发布占位 |
| 九 | MySQL(九)InnoDB与日志 | InnoDB与日志 | 索引 | 未发布占位 |
| 十 | MySQL(十)事务与MVCC | 事务与MVCC | InnoDB与日志 | 未发布占位 |
| 十一 | MySQL(十一)锁与并发控制 | 锁与并发控制 | 事务与MVCC | 未发布占位 |
| 十二 | MySQL(十二)安全与权限 | 安全与权限 | 表设计、数据写入 | 未发布占位 |
| 十三 | MySQL(十三)备份恢复与复制 | 备份恢复与复制 | 日志、事务、安全 | 未发布占位 |
| 十四 | MySQL(十四)进阶路线 | 可选专项 | 按分支选择 | 未发布占位 |
| 十五 | MySQL(十五)综合实战 | 20 道场景题 | 核心篇二至十三 | 未发布占位 |

## 开始学习

1. 按文章编号学习，不跳过前置机制直接背答案；
2. 每个 SQL 场景先阅读 DDL、seed 和预期结果，再独立编写 SQL；
3. 查看答案后继续核对 NULL、重复、并列、排序、版本和性能边界；
4. 机制题要能用图或时间线解释，不只记术语；
5. 进阶路线按实际问题选学，不把专项能力混入核心实验。

### ShopLab 统一实验数据库

{% note info flat %}
全系列使用九张表：users、departments、employees、products、inventory、orders、order_items、login_events、user_imports。
{% endnote %}

{% note info flat %}
固定 seed 会覆盖并列最高薪、唯一第二高薪、无订单用户、跨月订单、同日多次登录、连续与中断登录、NULL、重复导入、库存充足与不足，以及购买指定商品 101/102/103 的全部、部分、重复和零购买用户。
{% endnote %}

### 图解、实验与闪卡

- 图解：ER、窗口 frame、B+Tree 回表、优化闭环、日志恢复、MVCC 版本链、锁区间、权限链和 PITR 时间线；
- 实验：从空库导入 ShopLab，逐步完成 DDL、查询、执行计划、双会话并发和 RecoverLab；
- 闪卡：统一卡组为 `mysql-8.4-interview`，每张卡固定唯一 ID、priority、精简答案和详细解析；
- 综合实战：引用前置课程的 19 道代表性 SQL 卡，再新增 1 道留存分析题，共 20 题。

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Reference Manual, https://dev.mysql.com/doc/refman/8.4/en/, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Release Notes, https://dev.mysql.com/doc/relnotes/mysql/8.4/en/, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Backup and Recovery, https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 InnoDB Storage Engine, https://dev.mysql.com/doc/refman/8.4/en/innodb-storage-engine.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

<!-- capability-ledger: stored in Front Matter as a single-line JSON string; it is not rendered into the article body. -->

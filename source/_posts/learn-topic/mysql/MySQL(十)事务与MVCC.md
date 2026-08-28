---
title: MySQL(十)事务与MVCC
tags:
  - MySQL
  - 事务与MVCC
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 从事务边界、隔离级别和一致性读理解 InnoDB 的版本链与 Read View，并用回滚场景验证原子性。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 10
published: true
abbrlink: 7cc76b1d
date: 2026-04-01 00:00:00
---

{% course_series %}

{% note primary flat %}
事务把多条语句变成一个原子业务动作；MVCC 让普通一致性读看到符合快照规则的版本。先划清事务边界，再谈隔离级别，最后用两个会话观察提交、回滚和快照差异。
{% endnote %}

## 事务边界

{% note info flat %}
InnoDB 事务至少要回答：何时开始、哪些语句属于同一业务动作、何时提交、失败如何回滚。自动提交开启时，每条 DML 可能就是一个独立事务；显式 `START TRANSACTION` 才能把订单头、明细和库存操作绑在一起。
{% endnote %}

```sql
SET autocommit = 0;
START TRANSACTION;

INSERT INTO orders (user_id, status, total_amount)
VALUES (1, 'pending', 288.00);
SET @order_id = LAST_INSERT_ID();

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (@order_id, 101, 1, 199.00),
       (@order_id, 102, 1, 89.00);

SELECT @order_id AS order_id;
COMMIT;
SET autocommit = 1;
```

{% note danger flat %}
不要在没有确认提交的情况下把事务连接交还连接池；也不要把用户输入、远程调用和长时间等待放在持锁事务中。异常路径必须显式 ROLLBACK，并确认连接状态已经复位。
{% endnote %}

## ACID 模型

| 属性 | 在 ShopLab 中的观察 |
| --- | --- |
| Atomicity | 订单头成功但明细失败时整体回滚 |
| Consistency | 外键、CHECK 和业务约束在提交前后成立 |
| Isolation | 并发事务按隔离级别看到彼此的版本 |
| Durability | 提交后的修改由日志保证崩溃后可恢复 |

{% note primary flat %}
ACID 不是四个互相独立的开关：约束提供一致性，redo 提供持久化，锁与 MVCC 共同实现隔离，事务边界把它们组合成业务结果。解释面试题时要给出具体语句和可观察证据。
{% endnote %}

## MVCC 版本链

<!-- concept-story:start -->

茶行的账房每天会改一次某袋茶的标价。他不擦掉旧价，而是在账页最上方写下新价，把旧页用细线系在下面。上午来验账的客商拿着一张进门时盖好的查验单；午后账房又改了价，客商仍要按自己进门那刻能够查到的账页核算。

账房先把最上页递给客商。若上页的日期和盖章不合他的查验单，就顺着细线往下翻，直到找到当时本该看见的那一页。客商看到的是一页合规的旧账，并不是茶行特意为他复印了一整本账簿。

细线越来越长时，账房还要等确认没有早来的客商会查它，才能收走最老的纸页。客商终于意识到，自己守住的不是“永远不变的价格”，而是一次查账可以接受的视野。

<!-- concept-story:end -->

{% note info flat %}
账页顶端、细线和查验单分别对应当前行版本、undo 版本链与 Read View。InnoDB 在行记录中维护事务标记和 undo 链；普通一致性读根据 Read View 判断当前版本是否可见，不可见就沿 undo 找到满足快照的旧版本。这不等同于复制整张表，也不表示旧版本可以无限保留。
{% endnote %}

{% mermaid %}
flowchart TD
  N[当前记录 value=30\nDB_TRX_ID=T3] --> U[undo 旧版本 value=20\nT2]
  U --> V[undo 更旧版本 value=10\nT1]
  R[Read View] -.可见性判断.- N
  R -.不可见则沿 undo 回溯.- U
{% endmermaid %}

## 隔离级别

| 级别 | 典型现象 | InnoDB 说明 |
| --- | --- | --- |
| READ UNCOMMITTED | 可能读到未提交值 | 很少用于业务一致性查询 |
| READ COMMITTED | 每次语句建立新的快照 | 减少脏读，但同一事务两次查询可能不同 |
| REPEATABLE READ | 同一事务的一致性读通常复用快照 | InnoDB 默认级别；锁定读另有语义 |
| SERIALIZABLE | 普通读也更强地参与锁定 | 并发度低，需明确业务收益 |

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION WITH CONSISTENT SNAPSHOT;
SELECT @@transaction_isolation;
SELECT id, quantity FROM inventory WHERE product_id = 101;
-- 其他会话提交库存修改后，本会话再次普通 SELECT 仍按快照规则读取。
COMMIT;
```

{% note info flat %}
用两个会话可以把级别差异变成结果：会话 A 在 `REPEATABLE READ` 中先读一行，会话 B 修改并提交后，会话 A 再次普通 SELECT 仍读到同一快照；把 A 改为 `READ COMMITTED`，第二次语句会建立新快照并读到已提交值。两者都不等同于锁定读，`FOR UPDATE` 应单独观察等待和当前版本。
{% endnote %}

```sql
-- 会话 A
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION WITH CONSISTENT SNAPSHOT;
SELECT quantity FROM inventory WHERE product_id = 101;
-- 会话 B 执行 UPDATE ... COMMIT 后，A 再执行同一 SELECT，对比结果。
SELECT quantity FROM inventory WHERE product_id = 101;
COMMIT;
```

{% note warning flat %}
“可重复读”只描述一致性读的快照，不意味着所有读都不等待。`SELECT ... FOR UPDATE` 是锁定读，读取当前最新版本并加锁；隔离级别、读类型和锁必须同时说明。
{% endnote %}

## 保存点回滚

{% note primary flat %}
Savepoint 允许回滚事务的一段工作而不放弃前面的修改。它适合批量导入中逐批处理，但不能跨事务存在，也不能把已经提交的 DDL 或外部副作用变回来。
{% endnote %}

```sql
START TRANSACTION;
INSERT INTO user_imports (source_name, external_id, email, raw_payload)
VALUES ('crm', 'u-100', 'a@example.com', JSON_OBJECT('name', 'A'));

SAVEPOINT before_second_row;
INSERT INTO user_imports (source_name, external_id, email, raw_payload)
VALUES ('crm', 'u-101', 'b@example.com', JSON_OBJECT('name', 'B'));

-- 第二批校验失败时只撤销它
ROLLBACK TO SAVEPOINT before_second_row;
RELEASE SAVEPOINT before_second_row;
COMMIT;
```

{% note danger flat %}
普通事务回滚不等于“所有动作都消失”。隐式提交的语句、已发送的邮件、外部 HTTP 调用和已写出的日志不会被数据库 ROLLBACK 撤销；设计时把外部副作用放在提交后事件或可重试 outbox 中。
{% endnote %}

## 回滚实验

{% timeline 订单失败回滚, blue %}
<!-- timeline 开始 -->
START TRANSACTION，记录当前库存和订单数量。
<!-- endtimeline -->
<!-- timeline 写入 -->
插入订单头，故意让第二条明细引用不存在的商品，观察外键错误。
<!-- endtimeline -->
<!-- timeline 回滚 -->
执行 ROLLBACK，再查询订单、明细和库存，三者都应回到开始值。
<!-- endtimeline -->
<!-- timeline 解释 -->
说明原子性来自事务边界，约束失败阻止非法行，redo/undo 则分别支持持久化和回退。
<!-- endtimeline -->
{% endtimeline %}

{% note success flat %}
实验的证据是失败码、回滚后每张表的行数/值，以及同一连接的事务状态。只看到“客户端报错”而没有回读数据，不能证明回滚真的发生。
{% endnote %}

## XA 边界

{% folding yellow, XA 只作扩展认识 %}
XA 把事务拆成 prepare、commit/rollback 等状态，适合需要两阶段提交的外部资源协调，但会引入悬挂事务、恢复和超时管理。它不是普通单库订单事务的默认升级路径，使用前必须验证驱动、资源管理器和故障恢复流程。
```sql
XA START 'shoplab-demo';
-- DML ...
XA END 'shoplab-demo';
XA PREPARE 'shoplab-demo';
XA RECOVER;
-- 确认外部协调状态后选择 XA COMMIT 或 XA ROLLBACK。
```
{% endfolding %}

## 常见问题

{% flashcard basic id:mysql84-10-order-rollback-p1 deck:"mysql-8.4-interview" priority:1 tags:"事务,回滚,外键" %}
--- question
订单头插入成功、第二条明细因外键失败；如何保证订单头不会孤零零地留下？
--- answer
```sql
START TRANSACTION;
INSERT INTO orders (user_id, status, total_amount) VALUES (1, 'pending', 288.00);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (LAST_INSERT_ID(), 999, 1, 1.00);
-- 任一语句失败：ROLLBACK；全部成功：COMMIT
```
--- explanation
外键和事务解决不同问题：

```text
INSERT 订单头 ──成功──┐
                     ├─ 任一明细失败 → ROLLBACK（订单头也消失）
INSERT 明细 ──失败────┘
```

外键只拒绝不存在的 `product_id`，不会替你撤销已经提交的订单头；事务把多条 DML 绑定为一个原子边界。实验时同时回读订单头、明细和库存，确认失败后都恢复原值；DDL、外部消息和已经发送的网络副作用不属于普通 DML 的回滚范围。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MySQL 8.4 Transaction Statements, https://dev.mysql.com/doc/refman/8.4/en/sql-transactional-statements.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 COMMIT, https://dev.mysql.com/doc/refman/8.4/en/commit.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 SAVEPOINT, https://dev.mysql.com/doc/refman/8.4/en/savepoint.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Transaction Isolation Levels, https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 Consistent Nonlocking Reads, https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 InnoDB Multi-Versioning, https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html, https://www.mysql.com/favicon.ico %}
{% link MySQL 8.4 XA Transactions, https://dev.mysql.com/doc/refman/8.4/en/xa.html, https://www.mysql.com/favicon.ico %}
{% endlinkgroup %}

---
title: MySQL(十二)安全与权限
tags:
  - MySQL
  - 安全与权限
  - 数据库
categories:
  - Learn Topic
  - MySQL
description: 使用 user@host、角色和最小权限建立应用账户边界，并区分参数化原则、SQL 级预处理和驱动 API。
cover: /img/picgo-images/mysql-course-cover.png
series: MySQL
series_order: 12
published: false
abbrlink: '50217e5'
date: 2026-08-25 13:18:42
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：怎样让应用只获得必要权限，并避免认证和 SQL 注入风险。
- 学习成果：能够创建账户与角色、授予最小权限、验证生效权限，并说明 SQL 级 PREPARE 的边界。
- 前置文章：MySQL(二)数据库基础与表设计、MySQL(三)数据写入与约束
- 能力分配：

- 账户与权限：`refman8.4:security-guidelines`、`refman8.4:access-control`、`refman8.4:user-names`、`refman8.4:privileges-provided`、`refman8.4:account-names`、`refman8.4:role-names`、`refman8.4:creating-accounts`、`refman8.4:roles`、`refman8.4:partial-revokes`、`refman8.4:privilege-changes`、`refman8.4:assigning-passwords`、`refman8.4:pluggable-authentication`、`refman8.4:authentication-plugins`、`refman8.4:account-locking`、`refman8.4:user-resources`、`refman8.4:create-user`、`refman8.4:alter-user`、`refman8.4:drop-user`、`refman8.4:create-role`、`refman8.4:drop-role`、`refman8.4:grant`、`refman8.4:revoke`、`refman8.4:set-default-role`、`refman8.4:set-role`、`refman8.4:prepare`、`refman8.4:execute`、`refman8.4:deallocate-prepare`、`refman8.4:caching-sha2-pluggable-authentication`
- 连接安全：`refman8.4:encrypted-connections`、`refman8.4:connection-access`、`refman8.4:account-activity-auditing`
- 认证迁移：`refman8.4:native-pluggable-authentication`

## 正文大纲

- H2：账户标识与匹配
  - H3：理解 user@host 和连接准入
- H2：认证插件与密码
  - H3：使用 caching_sha2_password 并迁移旧认证
- H2：权限层级与角色
  - H3：设计全局、库、表和列权限
- H2：GRANT、REVOKE 与默认角色
  - H3：建立应用和报表角色
- H2：加密连接与资源限制
  - H3：识别 TLS、账户锁定和资源上限
- H2：参数化查询与 SQL 级预处理
  - H3：解释注入风险并实验 PREPARE/EXECUTE/DEALLOCATE
- H2：验证与审计
  - H3：回读角色、权限和连接行为

## 内容计划

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：建立应用写角色和报表只读角色，验证允许与拒绝操作；使用 SQL PREPARE 展示服务器端参数化。
- 失败边界与踩坑：SQL PREPARE 不等于各语言驱动 prepared-statement API；Connector 专项不在本课程范围。
- FAQ 候选与来源：SO-60174 只用于注入风险发现；SO-50093144 用于认证兼容问题，答案回到当前认证资料。
- 自测形式：SQL 卡 mysql84-12-app-role-grants-p1；机制卡覆盖 user@host、角色、最小权限和认证迁移。
- 可视化：账户匹配与角色授权链、权限层级对照表。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/creating-accounts.html
- https://dev.mysql.com/doc/refman/8.4/en/roles.html
- https://dev.mysql.com/doc/refman/8.4/en/grant.html
- https://dev.mysql.com/doc/refman/8.4/en/revoke.html
- https://dev.mysql.com/doc/refman/8.4/en/caching-sha2-pluggable-authentication.html
- https://dev.mysql.com/doc/refman/8.4/en/prepare.html

## 常见问题

待正文阶段按本篇职责编写；需要长期复习的问题优先使用 `flashcard`，跨文章复用只使用 `flashcard_ref`。

## 参考资料

待正文阶段按当前 MySQL 8.4 LTS 官方资料补齐资料卡片，并重新核验动态版本边界。

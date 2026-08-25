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

## 文章职责

- 唯一要解决的问题：怎样让应用只获得必要权限，并避免认证和 SQL 注入风险。
- 可观察成果：能够创建账户与角色、授予最小权限、验证生效权限，并说明 SQL 级 PREPARE 的边界。
- 进入条件：MySQL(二)数据库基础与表设计、MySQL(三)数据写入与约束
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：

- 账户与权限：`refman8.4:security-guidelines`、`refman8.4:access-control`、`refman8.4:user-names`、`refman8.4:privileges-provided`、`refman8.4:account-names`、`refman8.4:role-names`、`refman8.4:creating-accounts`、`refman8.4:roles`、`refman8.4:partial-revokes`、`refman8.4:privilege-changes`、`refman8.4:assigning-passwords`、`refman8.4:pluggable-authentication`、`refman8.4:authentication-plugins`、`refman8.4:account-locking`、`refman8.4:user-resources`、`refman8.4:create-user`、`refman8.4:alter-user`、`refman8.4:drop-user`、`refman8.4:create-role`、`refman8.4:drop-role`、`refman8.4:grant`、`refman8.4:revoke`、`refman8.4:set-default-role`、`refman8.4:set-role`、`refman8.4:prepare`、`refman8.4:execute`、`refman8.4:deallocate-prepare`、`refman8.4:caching-sha2-pluggable-authentication`
- 连接安全：`refman8.4:encrypted-connections`、`refman8.4:connection-access`、`refman8.4:account-activity-auditing`
- 认证迁移：`refman8.4:native-pluggable-authentication`
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 账户标识与匹配 | 建立账户标识与匹配的心智模型 | 理解 user@host 和连接准入 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 认证插件与密码 | 建立认证插件与密码的心智模型 | 使用 caching_sha2_password 并迁移旧认证 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 权限层级与角色 | 判断权限层级与角色 | 设计全局、库、表和列权限 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| GRANT、REVOKE 与默认角色 | 建立GRANT、REVOKE 与默认角色的心智模型 | 建立应用和报表角色 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 加密连接与资源限制 | 建立加密连接与资源限制的心智模型 | 识别 TLS、账户锁定和资源上限 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 参数化查询与 SQL 级预处理 | 完成并验证参数化查询与 SQL 级预处理 | 解释注入风险并实验 PREPARE/EXECUTE/DEALLOCATE | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 验证与审计 | 完成并验证验证与审计 | 回读角色、权限和连接行为 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：ShopLab 九表订单、库存、员工与登录数据。
- 完整示例：建立应用写角色和报表只读角色，验证允许与拒绝操作；使用 SQL PREPARE 展示服务器端参数化。
- 失败边界与踩坑：SQL PREPARE 不等于各语言驱动 prepared-statement API；Connector 专项不在本课程范围。
- FAQ 候选与来源：SO-60174 只用于注入风险发现；SO-50093144 用于认证兼容问题，答案回到当前认证资料。
- 非复习自测：SQL 卡 mysql84-12-app-role-grants-p1；机制卡覆盖 user@host、角色、最小权限和认证迁移。
- 图表或实验：账户匹配与角色授权链、权限层级对照表。
- 参考资料：

- https://dev.mysql.com/doc/refman/8.4/en/creating-accounts.html
- https://dev.mysql.com/doc/refman/8.4/en/roles.html
- https://dev.mysql.com/doc/refman/8.4/en/grant.html
- https://dev.mysql.com/doc/refman/8.4/en/revoke.html
- https://dev.mysql.com/doc/refman/8.4/en/caching-sha2-pluggable-authentication.html
- https://dev.mysql.com/doc/refman/8.4/en/prepare.html
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

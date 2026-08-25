---
title: Linux(六)用户权限与软件管理
tags:
  - Linux
  - 权限软件
categories:
  - Learn Topic
  - Linux
description: 掌握身份、权限评估、sudo 提权、APT/dpkg 和跨发行版软件包边界。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 6
published: false
abbrlink: 5a63b164
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：掌握身份、权限计算、所有权、提权和软件包生命周期。
- 学习成果：能够诊断权限失败并以最小权限完成软件包操作。
- 前置文章：第 2、5 篇。
- 能力分配：
- 核心详解 / 权限模型：posix2024:utility:chgrp、posix2024:utility:chmod、posix2024:utility:chown、posix2024:utility:umask
- 核心详解 / 身份与账户：posix2024:utility:id、posix2024:utility:newgrp、ubuntu26.04:command:getent、ubuntu26.04:command:groupadd、ubuntu26.04:command:groupdel、ubuntu26.04:command:groupmod、ubuntu26.04:command:groups、ubuntu26.04:command:passwd、ubuntu26.04:command:useradd、ubuntu26.04:command:userdel、ubuntu26.04:command:usermod、ubuntu26.04:provider:sudo-default-sudo-rs
- 核心详解 / 软件包模型：rhel9:command:dnf、rhel9:command:rpm、ubuntu26.04:command:apt、ubuntu26.04:command:apt-cache、ubuntu26.04:command:apt-get、ubuntu26.04:command:apt-mark、ubuntu26.04:command:dpkg
- 核心详解 / sudo 权限提升：ubuntu26.04:command:su、ubuntu26.04:command:sudo
- 正文简述 / 身份与账户：ubuntu26.04:config:apt-signed-by、ubuntu26.04:provider:sudo-ws-alternative

## 正文大纲

- H2：身份与账户
  - H3：UID、GID、补充组、passwd、shadow 和 NSS
  - H3：whoami、id、groups、getent、su 与登录 Shell
- H2：权限模型
  - H3：owner、group、other、rwx、目录语义和八进制
  - H3：setuid、setgid、sticky bit、umask
- H2：所有权与扩展权限
  - H3：chmod、chown、chgrp 和递归安全
  - H3：ACL 与 capabilities 识别
- H2：sudo 权限提升
  - H3：sudoers、命令范围、环境和审计
  - H3：Ubuntu 26.04 sudo-rs 与 sudo.ws 边界
- H2：软件包模型
  - H3：仓库、元数据、依赖、文件和签名
  - H3：apt、apt-get、apt-cache、dpkg、dnf、rpm 与 yum 迁移
- H2：权限故障实验
  - H3：目录读权限与执行权限
  - H3：服务用户、父路径、ACL 与实现差异
- H2：结果验证
  - H3：核对有效身份、权限、文件和包管理日志

## 内容计划

- 贯穿案例：创建用户/组沙箱，复现目录遍历失败，以最小权限修复，再安装、查询、删除无害软件包并检查日志。
- 完整示例：创建用户/组沙箱，复现目录遍历失败，以最小权限修复，再安装、查询、删除无害软件包并检查日志。
- 失败边界与踩坑：避免 chmod 777、系统路径递归 chown、不安全 sudo shell、第三方仓库和锁冲突。
- FAQ 候选与来源：目录为什么需要执行权限、sudo 与 su 如何选择、apt 与 rpm 是否可以直接等价。
- 自测形式：用中文场景选择命令，解释输出并写出验证步骤。
- 可视化：权限决策树、身份组关系和软件包生命周期。
- 闪卡计划：权限计算、sudo 提权、apt/dpkg/dnf/rpm 选择、yum 与 apt-key 迁移、安全边界。
- 参考资料：Ubuntu Server 软件包和权限文档、RHEL 9 DNF/RPM 文档、sudo 文档。

## 结果验证

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。

## 常见问题

待正文阶段按主题编写，并将需要长期复习的问题转为 flashcard。

## 参考资料

待正文阶段补齐当前版本官方资料与可复现问题案例。

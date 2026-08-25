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

## 文章职责

- 唯一要解决的问题：掌握身份、权限计算、所有权、提权和软件包生命周期。
- 可观察成果：能够诊断权限失败并以最小权限完成软件包操作。
- 进入条件：第 2、5 篇。
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：
- 核心详解 / 权限模型：posix2024:utility:chgrp、posix2024:utility:chmod、posix2024:utility:chown、posix2024:utility:umask
- 核心详解 / 身份与账户：posix2024:utility:id、posix2024:utility:newgrp、ubuntu26.04:command:getent、ubuntu26.04:command:groupadd、ubuntu26.04:command:groupdel、ubuntu26.04:command:groupmod、ubuntu26.04:command:groups、ubuntu26.04:command:passwd、ubuntu26.04:command:useradd、ubuntu26.04:command:userdel、ubuntu26.04:command:usermod、ubuntu26.04:provider:sudo-default-sudo-rs
- 核心详解 / 软件包模型：rhel9:command:dnf、rhel9:command:rpm、ubuntu26.04:command:apt、ubuntu26.04:command:apt-cache、ubuntu26.04:command:apt-get、ubuntu26.04:command:apt-mark、ubuntu26.04:command:dpkg
- 核心详解 / sudo 权限提升：ubuntu26.04:command:su、ubuntu26.04:command:sudo
- 正文简述 / 身份与账户：ubuntu26.04:config:apt-signed-by、ubuntu26.04:provider:sudo-ws-alternative
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 身份与账户 | 建立身份与账户的心智模型 | UID、GID、补充组、passwd、shadow 和 NSS；whoami、id、groups、getent、su 与登录 Shell | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 权限模型 | 判断权限模型 | owner、group、other、rwx、目录语义和八进制；setuid、setgid、sticky bit、umask | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 所有权与扩展权限 | 判断所有权与扩展权限 | chmod、chown、chgrp 和递归安全；ACL 与 capabilities 识别 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| sudo 权限提升 | 判断sudo 权限提升 | sudoers、命令范围、环境和审计；Ubuntu 26.04 sudo-rs 与 sudo.ws 边界 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 软件包模型 | 建立软件包模型的心智模型 | 仓库、元数据、依赖、文件和签名；apt、apt-get、apt-cache、dpkg、dnf、rpm 与 yum 迁移 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 权限故障实验 | 完成并验证权限故障实验 | 目录读权限与执行权限；服务用户、父路径、ACL 与实现差异 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 核对有效身份、权限、文件和包管理日志 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：创建用户/组沙箱，复现目录遍历失败，以最小权限修复，再安装、查询、删除无害软件包并检查日志。
- 完整示例：创建用户/组沙箱，复现目录遍历失败，以最小权限修复，再安装、查询、删除无害软件包并检查日志。
- 失败边界与踩坑：避免 chmod 777、系统路径递归 chown、不安全 sudo shell、第三方仓库和锁冲突。
- FAQ 候选与来源：目录为什么需要执行权限、sudo 与 su 如何选择、apt 与 rpm 是否可以直接等价。
- 非复习自测：用中文场景选择命令，解释输出并写出验证步骤。
- 图表或实验：权限决策树、身份组关系和软件包生命周期。
- 复习卡片：权限计算、sudo 提权、apt/dpkg/dnf/rpm 选择、yum 与 apt-key 迁移、安全边界。
- 参考资料：Ubuntu Server 软件包和权限文档、RHEL 9 DNF/RPM 文档、sudo 文档。

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

---
title: Linux(九)日志查看与故障定位
tags:
  - Linux
  - 日志排障
categories:
  - Learn Topic
  - Linux
description: 跨应用日志、Journal、内核消息、崩溃信息和轮转历史重建故障时间线。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 9
published: false
abbrlink: cade4656
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：关联应用日志、Journal、内核消息、崩溃信息、轮转文件和压缩历史，恢复故障时间线。
- 学习成果：能够从大量日志中缩小到可验证的事件序列。
- 前置文章：第 4、5、7 篇。
- 能力分配：
- 核心详解 / Journal 查询：posix2024:utility:logger、ubuntu26.04:command:journalctl、ubuntu26.04:command:systemd-cat
- 核心详解 / 内核与崩溃：ubuntu26.04:command:coredumpctl、ubuntu26.04:command:dmesg
- 核心详解 / 轮转与历史：ubuntu26.04:command:logrotate

## 章节计划

- H2：日志体系
  - H3：应用文件、syslog、Journal、内核环形缓冲、审计和 coredump
  - H3：时间戳、时区、优先级、facility、unit、PID、请求 ID
- H2：文件日志
  - H3：less、tail -n、tail -f、tail -F、多行上下文和跟随缓冲
  - H3：grep、sed、awk、cut、sort、uniq 和窗口提取
- H2：Journal 查询
  - H3：unit、boot、priority、time、PID、字段、follow 和输出格式
  - H3：权限、持久化、cursor 和 vacuum
- H2：内核与崩溃
  - H3：dmesg 时间戳与权限
  - H3：coredumpctl list/info/debug 边界与敏感数据
- H2：轮转与历史
  - H3：inode 替换、copytruncate、tail -F、logrotate、zgrep、zless
- H2：多日志关联
  - H3：统一时间、隔离窗口、关联标识和保留上下文
- H2：故障实验
  - H3：生成服务失败并重建时间线
- H2：结果验证
  - H3：用多来源证据确认事件顺序与影响范围

## 验证方式

- 贯穿案例：触发样例服务失败，关联请求 ID、unit 日志、内核证据和压缩轮转日志，产出故障时间线。
- 完整示例：触发样例服务失败，关联请求 ID、unit 日志、内核证据和压缩轮转日志，产出故障时间线。
- 失败边界与踩坑：注意时区、Journal 权限、二进制日志、多行堆栈、轮转、grep 误报、持久化缺失和 token 泄露。
- FAQ 候选与来源：tail -f 与 tail -F、Journal 与文件日志、dmesg 权限、如何关联多份日志。
- 自测形式：用中文场景选择命令，解释输出并写出验证步骤。
- 可视化：日志来源图、事件时间线和 tail -f/tail -F inode 图。
- 闪卡计划：每个日志命令、筛选字段、轮转差异、输出解释和安全边界。
- 参考资料：systemd Journal、Linux dmesg/coredump、logrotate 和压缩文本工具文档。

## 结果验证

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。

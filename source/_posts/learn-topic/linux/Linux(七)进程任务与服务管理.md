---
title: Linux(七)进程任务与服务管理
tags:
  - Linux
  - 进程服务
categories:
  - Learn Topic
  - Linux
description: 掌握进程状态、信号、作业控制、优先级、systemd 服务和定时任务。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 7
published: false
abbrlink: 23ca1872
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：掌握进程状态、信号、作业控制、优先级、systemd 服务和定时任务。
- 学习成果：能够找到并控制进程或服务，不把 SIGKILL 当作第一选择。
- 前置文章：第 2、5、6 篇。
- 能力分配：
- 核心详解 / 进程查找：bash5.3:feature:job-control-builtins、bash5.3:toc:Job-Control-Basics、bash5.3:toc:Job-Control-Builtins、bash5.3:toc:Job-Control-Variables、posix2024:shell:job-control、posix2024:shell:signals、posix2024:utility:ps、ubuntu26.04:command:pgrep、ubuntu26.04:command:pidwait、ubuntu26.04:command:watch
- 核心详解 / 定时任务：posix2024:utility:at、posix2024:utility:batch、posix2024:utility:crontab
- 核心详解 / 前后台任务：posix2024:utility:bg、posix2024:utility:fg、posix2024:utility:jobs、posix2024:utility:nohup、posix2024:utility:wait
- 核心详解 / 信号与终止：posix2024:utility:kill、ubuntu26.04:command:pkill
- 核心详解 / 优先级与资源：posix2024:utility:nice、posix2024:utility:renice
- 核心详解 / systemd 服务：ubuntu26.04:command:halt、ubuntu26.04:command:poweroff、ubuntu26.04:command:reboot、ubuntu26.04:command:shutdown、ubuntu26.04:command:systemctl、ubuntu26.04:command:systemd-run
- 弃用迁移 / systemd 服务：ubuntu26.04:command:init
- 弃用迁移 / 信号与终止：ubuntu26.04:command:skill
- 弃用迁移 / 优先级与资源：ubuntu26.04:command:snice

## 正文大纲

- H2：进程模型
  - H3：PID、PPID、进程组、会话、线程和进程树
  - H3：运行、睡眠、D 状态、停止、僵尸和退出状态
- H2：进程查找
  - H3：ps 快照与列选择
  - H3：pgrep、pidwait、pkill、名称匹配和所有者
- H2：信号与终止
  - H3：信号投递、处理器、屏蔽和默认动作
  - H3：SIGINT、SIGTERM、SIGHUP、SIGSTOP、SIGCONT、SIGKILL
- H2：前后台任务
  - H3：jobs、bg、fg、wait、nohup、终端断开和 systemd-run
- H2：优先级与资源
  - H3：nice、renice 与 CPU 保证的边界
- H2：systemd 服务
  - H3：unit 状态、依赖、enable/start、reload/restart
  - H3：systemctl status、show、list-units、失败证据
- H2：定时任务
  - H3：at、crontab、systemd timer、环境和错过执行
- H2：结果验证
  - H3：通过进程、服务和日志证据确认变更结果

## 内容计划

- 贯穿案例：定位异常进程，记录父子关系和打开资源，先温和终止，观察服务恢复及日志，再决定是否升级信号。
- 完整示例：定位异常进程，记录父子关系和打开资源，先温和终止，观察服务恢复及日志，再决定是否升级信号。
- 失败边界与踩坑：不要仅凭名称杀进程；注意权限、进程组、僵尸进程、服务依赖和定时任务环境。
- FAQ 候选与来源：进程与线程、start 与 enable、reload 与 restart、init/telinit 的当前边界。
- 自测形式：用中文场景选择命令，解释输出并写出验证步骤。
- 可视化：进程关系图、信号升级流程和服务生命周期。
- 闪卡计划：ps、pgrep、kill、jobs、nohup、nice、systemctl、cron 及 SIGTERM/SIGKILL 选择。
- 参考资料：procps-ng、systemd 259、Linux signal 与 process 文档。

## 结果验证

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。

## 常见问题

待正文阶段按主题编写，并将需要长期复习的问题转为 flashcard。

## 参考资料

待正文阶段补齐当前版本官方资料与可复现问题案例。

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

## 文章职责

- 唯一要解决的问题：掌握进程状态、信号、作业控制、优先级、systemd 服务和定时任务。
- 可观察成果：能够找到并控制进程或服务，不把 SIGKILL 当作第一选择。
- 进入条件：第 2、5、6 篇。
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

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
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 进程模型 | 建立进程模型的心智模型 | PID、PPID、进程组、会话、线程和进程树；运行、睡眠、D 状态、停止、僵尸和退出状态 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 进程查找 | 建立进程查找的心智模型 | ps 快照与列选择；pgrep、pidwait、pkill、名称匹配和所有者 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 信号与终止 | 建立信号与终止的心智模型 | 信号投递、处理器、屏蔽和默认动作；SIGINT、SIGTERM、SIGHUP、SIGSTOP、SIGCONT、SIGKILL | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 前后台任务 | 建立前后台任务的心智模型 | jobs、bg、fg、wait、nohup、终端断开和 systemd-run | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 优先级与资源 | 建立优先级与资源的心智模型 | nice、renice 与 CPU 保证的边界 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| systemd 服务 | 建立systemd 服务的心智模型 | unit 状态、依赖、enable/start、reload/restart；systemctl status、show、list-units、失败证据 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 定时任务 | 建立定时任务的心智模型 | at、crontab、systemd timer、环境和错过执行 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 通过进程、服务和日志证据确认变更结果 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：定位异常进程，记录父子关系和打开资源，先温和终止，观察服务恢复及日志，再决定是否升级信号。
- 完整示例：定位异常进程，记录父子关系和打开资源，先温和终止，观察服务恢复及日志，再决定是否升级信号。
- 失败边界与踩坑：不要仅凭名称杀进程；注意权限、进程组、僵尸进程、服务依赖和定时任务环境。
- FAQ 候选与来源：进程与线程、start 与 enable、reload 与 restart、init/telinit 的当前边界。
- 非复习自测：用中文场景选择命令，解释输出并写出验证步骤。
- 图表或实验：进程关系图、信号升级流程和服务生命周期。
- 复习卡片：ps、pgrep、kill、jobs、nohup、nice、systemctl、cron 及 SIGTERM/SIGKILL 选择。
- 参考资料：procps-ng、systemd 259、Linux signal 与 process 文档。

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

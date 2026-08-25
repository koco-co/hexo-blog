---
title: Linux(一)入门路线
tags:
  - Linux
  - 学习路线
categories:
  - Learn Topic
  - Linux
description: 建立 Linux 命令学习、实验安全、课程依赖和证据化排障的完整入口。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 1
published: true
abbrlink: 89ce5b85
date: 2026-08-25 00:00:00
---
{% course_series %}

{% note info flat %}
本篇只说明课程范围、依赖和开始方式；具体知识点与面试复习题放在对应主题文章。
{% endnote %}

## 课程目标

这是一套面向零基础到系统排障的 Linux 命令行课程。重点覆盖常用命令、中文场景选命令、Shell 组合、日志查看、性能分析、Bash 自动化和面试复述。主实验基线为 Ubuntu Server 26.04 LTS，同时说明 POSIX.1-2024、Bash 5.3、GNU/uutils 及发行版差异。

## 前置条件

不要求 Linux 经验。准备一台可丢弃的 Ubuntu Server、WSL2 或虚拟机，并为文件、服务、日志和负载实验建立隔离目录。生产机器、真实凭据和破坏性设备操作不在课程实验范围内。

## 学习路径

{% mermaid %}
flowchart TD
  A[入门路线] --> B[系统与命令行基础]
  B --> C[文件与存储管理]
  C --> D[文本处理与数据提取]
  D --> E[Shell 语法与命令组合]
  E --> F[用户权限与软件管理]
  E --> G[进程任务与服务管理]
  E --> H[网络连接与远程排障]
  G --> I[日志查看与故障定位]
  I --> J[性能分析与资源诊断]
  J --> K[Bash 脚本与任务自动化]
  K --> L[进阶路线（可选）]
  K --> M[综合实战]
{% endmermaid %}

每篇文章都按“机制 → 命令选择 → 完整示例 → 失败边界 → 结果验证”推进。第 12 篇是可选拓展，第 13 篇不依赖第 12 篇。

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Linux(一)入门路线 | 建立课程目标、安全实验环境、学习顺序、命令学习模型和排障证据链。 | 无。 | 路线已发布 |
| 2 | Linux(二)系统与命令行基础 | 掌握 Linux 组成、目录层级、终端与 Shell、路径、环境变量、命令解析和帮助系统。 | 第 1 篇。 | 未发布占位 |
| 3 | Linux(三)文件与存储管理 | 掌握文件、目录项、inode、文件描述符、链接、归档、文件系统和容量。 | 第 2 篇。 | 未发布占位 |
| 4 | Linux(四)文本处理与数据提取 | 从文本和日志中筛选、转换、分组、排序并生成可复现结论。 | 第 3 篇。 | 未发布占位 |
| 5 | Linux(五)Shell 语法与命令组合 | 解释 Shell 如何解析、展开、重定向、连接和判断命令，使组合命令保持正确。 | 第 2～4 篇。 | 未发布占位 |
| 6 | Linux(六)用户权限与软件管理 | 掌握身份、权限计算、所有权、提权和软件包生命周期。 | 第 2、5 篇。 | 未发布占位 |
| 7 | Linux(七)进程任务与服务管理 | 掌握进程状态、信号、作业控制、优先级、systemd 服务和定时任务。 | 第 2、5、6 篇。 | 未发布占位 |
| 8 | Linux(八)网络连接与远程排障 | 按网卡、路由、DNS、Socket、TLS、应用请求和抓包逐层定位网络问题。 | 第 2、5 篇；建议具备第 7 篇进程背景。 | 未发布占位 |
| 9 | Linux(九)日志查看与故障定位 | 关联应用日志、Journal、内核消息、崩溃信息、轮转文件和压缩历史，恢复故障时间线。 | 第 4、5、7 篇。 | 未发布占位 |
| 10 | Linux(十)性能分析与资源诊断 | 用统一方法区分 CPU、内存、I/O、容量、网络和进程瓶颈，正确解释采样指标。 | 第 3、7、8、9 篇。 | 未发布占位 |
| 11 | Linux(十一)Bash 脚本与任务自动化 | 把交互命令转化为输入明确、错误可见、可清理、可验证的脚本。 | 第 4～7 篇。 | 未发布占位 |
| 12 | Linux(十二)进阶路线 | 承接低频、平台相关、需要权限或可能产生较高风险的能力，不阻塞主课程。 | 第 7～11 篇；第 13 篇不要求本篇。 | 未发布占位 |
| 13 | Linux(十三)综合实战 | 把文件、进程、服务、日志、性能和网络能力整合为完整故障诊断，并训练面试复述。 | 第 3～11 篇；第 12 篇可选。 | 未发布占位 |

## 开始学习

先完成当前文章的实验和自测，再进入下一篇。每个高频命令都会同时提供“命令到中文”和“中文场景到命令”闪卡；日志与性能文章增加字段和指标解释卡，危险操作增加安全边界卡。跨文章复用的问题使用 flashcard_ref，综合实战只复用既有卡片并新增一张证据链卡。

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024, https://pubs.opengroup.org/onlinepubs/9799919799/, https://pubs.opengroup.org/favicon.ico %}
{% link GNU Bash Reference Manual, https://www.gnu.org/software/bash/manual/, https://www.gnu.org/favicon.ico %}
{% link Ubuntu Server documentation, https://documentation.ubuntu.com/server/, https://documentation.ubuntu.com/favicon.ico %}
{% link Linux kernel documentation, https://docs.kernel.org/, https://www.kernel.org/theme/images/logos/favicon.png %}
{% link systemd manual, https://www.freedesktop.org/software/systemd/man/latest/, https://www.freedesktop.org/favicon.ico %}
{% link iproute2 source archive, https://www.kernel.org/pub/linux/utils/net/iproute2/, https://www.kernel.org/theme/images/logos/favicon.png %}
{% endlinkgroup %}

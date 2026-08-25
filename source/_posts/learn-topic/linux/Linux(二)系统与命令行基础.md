---
title: Linux(二)系统与命令行基础
tags:
  - Linux
  - 命令行基础
categories:
  - Learn Topic
  - Linux
description: 掌握 Linux 系统组成、目录层级、Shell、环境变量、命令解析和帮助系统。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 2
published: false
abbrlink: 6153b09f
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：掌握 Linux 组成、目录层级、终端与 Shell、路径、环境变量、命令解析和帮助系统。
- 学习成果：能够进入陌生 Linux 环境并判断系统、Shell 和命令实现。
- 前置文章：第 1 篇。
- 能力分配：
- 正文简述 / 命令解析：bash5.3:builtin:index-dirs、bash5.3:builtin:index-history、bash5.3:builtin:index-popd、bash5.3:builtin:index-pushd、bash5.3:toc:A-Programmable-Completion-Example、bash5.3:toc:Bash-History-Builtins、bash5.3:toc:Bash-History-Facilities、bash5.3:toc:Commands-For-Completion、bash5.3:toc:Commands-For-History、bash5.3:toc:Commands-For-Killing、bash5.3:toc:Commands-For-Moving、bash5.3:toc:Commands-For-Text、bash5.3:toc:Conditional-Init-Constructs、bash5.3:toc:Definitions、bash5.3:toc:Event-Designators、bash5.3:toc:Introduction-and-Notation、bash5.3:toc:Keyboard-Macros、bash5.3:toc:Miscellaneous-Commands、bash5.3:toc:Modifiers、bash5.3:toc:Numeric-Arguments、bash5.3:toc:Programmable-Completion、bash5.3:toc:Programmable-Completion-Builtins、bash5.3:toc:Readline-Arguments、bash5.3:toc:Readline-Bare-Essentials、bash5.3:toc:Readline-Init-File-Syntax、bash5.3:toc:Readline-Killing-Commands、bash5.3:toc:Readline-Movement-Commands、bash5.3:toc:Readline-vi-Mode、bash5.3:toc:Sample-Init-File、bash5.3:toc:Searching、bash5.3:toc:What-is-a-shell_003f、bash5.3:toc:What-is-Bash_003f、bash5.3:toc:Word-Designators、posix2024:utility:admin、posix2024:utility:alias、posix2024:utility:asa、posix2024:utility:cal、posix2024:utility:cmp、posix2024:utility:ed、posix2024:utility:ex、posix2024:utility:fc、posix2024:utility:fuser、posix2024:utility:iconv、posix2024:utility:mesg、posix2024:utility:patch、posix2024:utility:pathchk、posix2024:utility:tabs、posix2024:utility:tput、posix2024:utility:tsort、posix2024:utility:ulimit、posix2024:utility:write、ubuntu26.04:command:install、ubuntu26.04:command:mknod、ubuntu26.04:command:su-rs、ubuntu26.04:command:sudo-rs、ubuntu26.04:command:sudo.ws、ubuntu26.04:command:sudoedit-rs、ubuntu26.04:command:visudo-rs、ubuntu26.04:command:visudo.ws
- 核心详解 / 帮助与编辑：bash5.3:builtin:index-help、posix2024:utility:man、posix2024:utility:more、posix2024:utility:vi、ubuntu26.04:command:info、ubuntu26.04:command:vim
- 核心详解 / 命令解析：bash5.3:feature:history、bash5.3:feature:prompting、bash5.3:feature:readline、bash5.3:feature:startup-files、bash5.3:toc:Aliases、bash5.3:toc:Bash-Startup-Files、posix2024:utility:cd、posix2024:utility:command、posix2024:utility:getconf、posix2024:utility:hash、posix2024:utility:sh、posix2024:utility:type、posix2024:utility:unalias、posix2024:utility:uname、ubuntu26.04:command:whatis、ubuntu26.04:command:whereis、ubuntu26.04:command:which、ubuntu26.04:provider:coreutils-default-uutils、ubuntu26.04:provider:gnu-coreutils-prefix
- 核心详解 / 目录与路径：posix2024:utility:basename、posix2024:utility:ls、posix2024:utility:pwd、posix2024:utility:readlink、posix2024:utility:realpath
- 核心详解 / 运行环境：posix2024:utility:env、posix2024:utility:locale、posix2024:utility:logname、posix2024:utility:stty、posix2024:utility:tty、posix2024:utility:who、ubuntu26.04:command:printenv、ubuntu26.04:command:whoami
- 正文简述 / 运行环境：ubuntu26.04:command:lsb_release、ubuntu26.04:command:users

## 正文大纲

- H2：Linux 系统组成
  - H3：内核、用户空间、发行版、服务、Shell 与终端
  - H3：进程、文件、用户和网络等操作对象
- H2：发行版与环境
  - H3：Ubuntu 26.04、/etc/os-release、lsb_release 与 RHEL 对照
  - H3：WSL2、虚拟机、容器与原生 Linux 边界
- H2：目录与路径
  - H3：FHS 高价值目录
  - H3：绝对路径、相对路径、家目录和工作目录
- H2：命令解析
  - H3：别名、函数、内建命令、PATH、可执行文件和 hash
  - H3：type、command、which、whereis 与 getconf 的选择边界
- H2：运行环境
  - H3：环境变量、locale、身份、TTY 和启动文件
  - H3：uutils 默认实现、GNU 前缀命令与 cp/mv/rm 例外
- H2：帮助与编辑
  - H3：man 分区、help、--help、info 和源码层级
  - H3：Vi/Vim 生存操作
- H2：结果验证
  - H3：生成陌生环境清单并解释每项证据

## 内容计划

- 贯穿案例：使用 uname、/etc/os-release、bash --version、type -a、command -V、readlink、env、locale、pwd、ls 和 Vim 生成环境清单。
- 完整示例：使用 uname、/etc/os-release、bash --version、type -a、command -V、readlink、env、locale、pwd、ls 和 Vim 生成环境清单。
- 失败边界与踩坑：Linux 不等于只有内核；Shell 语法不一定通用；命令名不能直接证明实现。
- FAQ 候选与来源：which 与 type 的区别、Shell 与终端的区别、uutils 与 GNU 的差异。
- 自测形式：用中文场景选择命令，解释输出并写出验证步骤。
- 可视化：Linux 分层图、命令解析流程和 FHS 树表。
- 闪卡计划：ls、cd、pwd、type、command、which、whereis、man、info、uname、env 等高频命令双向卡。
- 参考资料：Ubuntu 26.04 文档、POSIX.1-2024、Bash 5.3 与 GNU/coreutils 资料。

## 结果验证

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。

## 常见问题

待正文阶段按主题编写，并将需要长期复习的问题转为 flashcard。

## 参考资料

待正文阶段补齐当前版本官方资料与可复现问题案例。

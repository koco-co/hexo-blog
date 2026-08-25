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

## 文章职责

- 唯一要解决的问题：掌握 Linux 组成、目录层级、终端与 Shell、路径、环境变量、命令解析和帮助系统。
- 可观察成果：能够进入陌生 Linux 环境并判断系统、Shell 和命令实现。
- 进入条件：第 1 篇。
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：
- 正文简述 / 命令解析：bash5.3:builtin:index-dirs、bash5.3:builtin:index-history、bash5.3:builtin:index-popd、bash5.3:builtin:index-pushd、bash5.3:toc:A-Programmable-Completion-Example、bash5.3:toc:Bash-History-Builtins、bash5.3:toc:Bash-History-Facilities、bash5.3:toc:Commands-For-Completion、bash5.3:toc:Commands-For-History、bash5.3:toc:Commands-For-Killing、bash5.3:toc:Commands-For-Moving、bash5.3:toc:Commands-For-Text、bash5.3:toc:Conditional-Init-Constructs、bash5.3:toc:Definitions、bash5.3:toc:Event-Designators、bash5.3:toc:Introduction-and-Notation、bash5.3:toc:Keyboard-Macros、bash5.3:toc:Miscellaneous-Commands、bash5.3:toc:Modifiers、bash5.3:toc:Numeric-Arguments、bash5.3:toc:Programmable-Completion、bash5.3:toc:Programmable-Completion-Builtins、bash5.3:toc:Readline-Arguments、bash5.3:toc:Readline-Bare-Essentials、bash5.3:toc:Readline-Init-File-Syntax、bash5.3:toc:Readline-Killing-Commands、bash5.3:toc:Readline-Movement-Commands、bash5.3:toc:Readline-vi-Mode、bash5.3:toc:Sample-Init-File、bash5.3:toc:Searching、bash5.3:toc:What-is-a-shell_003f、bash5.3:toc:What-is-Bash_003f、bash5.3:toc:Word-Designators、posix2024:utility:admin、posix2024:utility:alias、posix2024:utility:asa、posix2024:utility:cal、posix2024:utility:cmp、posix2024:utility:ed、posix2024:utility:ex、posix2024:utility:fc、posix2024:utility:fuser、posix2024:utility:iconv、posix2024:utility:mesg、posix2024:utility:patch、posix2024:utility:pathchk、posix2024:utility:tabs、posix2024:utility:tput、posix2024:utility:tsort、posix2024:utility:ulimit、posix2024:utility:write、ubuntu26.04:command:install、ubuntu26.04:command:mknod、ubuntu26.04:command:su-rs、ubuntu26.04:command:sudo-rs、ubuntu26.04:command:sudo.ws、ubuntu26.04:command:sudoedit-rs、ubuntu26.04:command:visudo-rs、ubuntu26.04:command:visudo.ws
- 核心详解 / 帮助与编辑：bash5.3:builtin:index-help、posix2024:utility:man、posix2024:utility:more、posix2024:utility:vi、ubuntu26.04:command:info、ubuntu26.04:command:vim
- 核心详解 / 命令解析：bash5.3:feature:history、bash5.3:feature:prompting、bash5.3:feature:readline、bash5.3:feature:startup-files、bash5.3:toc:Aliases、bash5.3:toc:Bash-Startup-Files、posix2024:utility:cd、posix2024:utility:command、posix2024:utility:getconf、posix2024:utility:hash、posix2024:utility:sh、posix2024:utility:type、posix2024:utility:unalias、posix2024:utility:uname、ubuntu26.04:command:whatis、ubuntu26.04:command:whereis、ubuntu26.04:command:which、ubuntu26.04:provider:coreutils-default-uutils、ubuntu26.04:provider:gnu-coreutils-prefix
- 核心详解 / 目录与路径：posix2024:utility:basename、posix2024:utility:ls、posix2024:utility:pwd、posix2024:utility:readlink、posix2024:utility:realpath
- 核心详解 / 运行环境：posix2024:utility:env、posix2024:utility:locale、posix2024:utility:logname、posix2024:utility:stty、posix2024:utility:tty、posix2024:utility:who、ubuntu26.04:command:printenv、ubuntu26.04:command:whoami
- 正文简述 / 运行环境：ubuntu26.04:command:lsb_release、ubuntu26.04:command:users
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Linux 系统组成 | 建立Linux 系统组成的心智模型 | 内核、用户空间、发行版、服务、Shell 与终端；进程、文件、用户和网络等操作对象 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 发行版与环境 | 建立发行版与环境的心智模型 | Ubuntu 26.04、/etc/os-release、lsb_release 与 RHEL 对照；WSL2、虚拟机、容器与原生 Linux 边界 | `tabs` | 内容是可替换的平行环境，选择标准先于页签直接展示 | 共同前提、选择标准、各方案完整步骤和成功证据 | 页签失效时各方案按顺序独立可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 目录与路径 | 建立目录与路径的心智模型 | FHS 高价值目录；绝对路径、相对路径、家目录和工作目录 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 命令解析 | 建立命令解析的心智模型 | 别名、函数、内建命令、PATH、可执行文件和 hash；type、command、which、whereis 与 getconf 的选择边界 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 运行环境 | 完成并验证运行环境 | 环境变量、locale、身份、TTY 和启动文件；uutils 默认实现、GNU 前缀命令与 cp/mv/rm 例外 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 帮助与编辑 | 建立帮助与编辑的心智模型 | man 分区、help、--help、info 和源码层级；Vi/Vim 生存操作 | `folding` | 只收纳不影响主线的低频补充，核心结论必须先在折叠外给出 | 折叠外摘要、适用条件和继续阅读理由 | 折叠失效时标题概括补充主题，正文仍可顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 生成陌生环境清单并解释每项证据 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：使用 uname、/etc/os-release、bash --version、type -a、command -V、readlink、env、locale、pwd、ls 和 Vim 生成环境清单。
- 完整示例：使用 uname、/etc/os-release、bash --version、type -a、command -V、readlink、env、locale、pwd、ls 和 Vim 生成环境清单。
- 失败边界与踩坑：Linux 不等于只有内核；Shell 语法不一定通用；命令名不能直接证明实现。
- FAQ 候选与来源：which 与 type 的区别、Shell 与终端的区别、uutils 与 GNU 的差异。
- 非复习自测：用中文场景选择命令，解释输出并写出验证步骤。
- 图表或实验：Linux 分层图、命令解析流程和 FHS 树表。
- 复习卡片：ls、cd、pwd、type、command、which、whereis、man、info、uname、env 等高频命令双向卡。
- 参考资料：Ubuntu 26.04 文档、POSIX.1-2024、Bash 5.3 与 GNU/coreutils 资料。

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

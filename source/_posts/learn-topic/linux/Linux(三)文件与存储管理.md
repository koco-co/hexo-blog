---
title: Linux(三)文件与存储管理
tags:
  - Linux
  - 文件存储
categories:
  - Learn Topic
  - Linux
description: 理解 Linux 文件模型并安全完成文件、链接、归档、挂载和容量分析。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 3
published: false
abbrlink: '5297e207'
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：掌握文件、目录项、inode、文件描述符、链接、归档、文件系统和容量。
- 可观察成果：能够安全检查、创建、复制、移动、查找、归档、挂载并解释存储占用。
- 进入条件：第 2 篇。
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：
- 核心详解 / 文件操作：posix2024:utility:cat、posix2024:utility:cp、posix2024:utility:dd、posix2024:utility:dirname、posix2024:utility:file、posix2024:utility:mkdir、posix2024:utility:mkfifo、posix2024:utility:mv、posix2024:utility:rm、posix2024:utility:rmdir、posix2024:utility:touch、ubuntu26.04:command:mktemp、ubuntu26.04:command:stat、ubuntu26.04:command:truncate、ubuntu26.04:provider:cp-mv-rm-gnu-exception
- 核心详解 / 归档与压缩：posix2024:utility:cksum、posix2024:utility:compress、posix2024:utility:pax、posix2024:utility:uncompress、posix2024:utility:zcat、ubuntu26.04:command:b2sum、ubuntu26.04:command:base32、ubuntu26.04:command:base64、ubuntu26.04:command:basenc、ubuntu26.04:command:gunzip、ubuntu26.04:command:gzip、ubuntu26.04:command:md5sum、ubuntu26.04:command:sha1sum、ubuntu26.04:command:sha224sum、ubuntu26.04:command:sha256sum、ubuntu26.04:command:sha384sum、ubuntu26.04:command:sha512sum、ubuntu26.04:command:tar、ubuntu26.04:command:unzip、ubuntu26.04:command:xz、ubuntu26.04:command:zip
- 核心详解 / 文件系统与容量：posix2024:utility:df、posix2024:utility:du、ubuntu26.04:command:lsblk、ubuntu26.04:command:mount、ubuntu26.04:command:sync、ubuntu26.04:command:umount
- 核心详解 / 文件查找：posix2024:utility:find
- 核心详解 / 链接关系：posix2024:utility:link、posix2024:utility:ln、posix2024:utility:unlink
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 文件模型 | 建立文件模型的心智模型 | 路径名、目录项、inode、元数据和文件描述符；普通文件、目录、链接、设备、FIFO 和 Socket | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 文件操作 | 完成并验证文件操作 | 列出、创建、复制、移动、重命名和元数据；安全删除、glob、双横线和预检查 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 链接关系 | 建立链接关系的心智模型 | 硬链接身份与链接数；符号链接解析与断链 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 文件查找 | 建立文件查找的心智模型 | find 条件、动作、优先级和 prune；索引查找与实时遍历 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 归档与压缩 | 建立归档与压缩的心智模型 | tar 模型；gzip、xz、zip、校验和解压安全 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 文件系统与容量 | 建立文件系统与容量的心智模型 | 块设备、分区、文件系统、挂载点和命名空间；df、du、lsblk、mount、umount、inode 耗尽与删除后仍打开的文件 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 故障实验 | 完成并验证故障实验 | df 与 du 差异；隐藏挂载数据和 open-deleted 日志 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 通过容量、inode 和打开文件证据闭合结论 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：构造样例树，比较硬链接和符号链接，归档并校验，挂载 loopback 文件系统，制造删除后仍打开的文件并解释 df/du/lsof。
- 完整示例：构造样例树，比较硬链接和符号链接，归档并校验，挂载 loopback 文件系统，制造删除后仍打开的文件并解释 df/du/lsof。
- 失败边界与踩坑：递归删除、覆盖、稀疏文件、符号链接遍历、不可信归档、挂载路径和设备写入均需先确认边界。
- FAQ 候选与来源：df 与 du 为什么不同、删除文件为何仍占空间、硬链接与软链接如何选择。
- 非复习自测：用中文场景选择命令，解释输出并写出验证步骤。
- 图表或实验：inode/链接关系、存储栈和 df-versus-du 决策流。
- 复习卡片：cp、mv、rm、find、tar、df、du、lsblk、mount、lsof 与破坏性操作安全卡。
- 参考资料：util-linux、GNU coreutils、Linux 文件系统与 Ubuntu 存储文档。

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

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

## 学习目标

- 唯一问题：掌握文件、目录项、inode、文件描述符、链接、归档、文件系统和容量。
- 学习成果：能够安全检查、创建、复制、移动、查找、归档、挂载并解释存储占用。
- 前置文章：第 2 篇。
- 能力分配：
- 核心详解 / 文件操作：posix2024:utility:cat、posix2024:utility:cp、posix2024:utility:dd、posix2024:utility:dirname、posix2024:utility:file、posix2024:utility:mkdir、posix2024:utility:mkfifo、posix2024:utility:mv、posix2024:utility:rm、posix2024:utility:rmdir、posix2024:utility:touch、ubuntu26.04:command:mktemp、ubuntu26.04:command:stat、ubuntu26.04:command:truncate、ubuntu26.04:provider:cp-mv-rm-gnu-exception
- 核心详解 / 归档与压缩：posix2024:utility:cksum、posix2024:utility:compress、posix2024:utility:pax、posix2024:utility:uncompress、posix2024:utility:zcat、ubuntu26.04:command:b2sum、ubuntu26.04:command:base32、ubuntu26.04:command:base64、ubuntu26.04:command:basenc、ubuntu26.04:command:gunzip、ubuntu26.04:command:gzip、ubuntu26.04:command:md5sum、ubuntu26.04:command:sha1sum、ubuntu26.04:command:sha224sum、ubuntu26.04:command:sha256sum、ubuntu26.04:command:sha384sum、ubuntu26.04:command:sha512sum、ubuntu26.04:command:tar、ubuntu26.04:command:unzip、ubuntu26.04:command:xz、ubuntu26.04:command:zip
- 核心详解 / 文件系统与容量：posix2024:utility:df、posix2024:utility:du、ubuntu26.04:command:lsblk、ubuntu26.04:command:mount、ubuntu26.04:command:sync、ubuntu26.04:command:umount
- 核心详解 / 文件查找：posix2024:utility:find
- 核心详解 / 链接关系：posix2024:utility:link、posix2024:utility:ln、posix2024:utility:unlink

## 章节计划

- H2：文件模型
  - H3：路径名、目录项、inode、元数据和文件描述符
  - H3：普通文件、目录、链接、设备、FIFO 和 Socket
- H2：文件操作
  - H3：列出、创建、复制、移动、重命名和元数据
  - H3：安全删除、glob、双横线和预检查
- H2：链接关系
  - H3：硬链接身份与链接数
  - H3：符号链接解析与断链
- H2：文件查找
  - H3：find 条件、动作、优先级和 prune
  - H3：索引查找与实时遍历
- H2：归档与压缩
  - H3：tar 模型
  - H3：gzip、xz、zip、校验和解压安全
- H2：文件系统与容量
  - H3：块设备、分区、文件系统、挂载点和命名空间
  - H3：df、du、lsblk、mount、umount、inode 耗尽与删除后仍打开的文件
- H2：故障实验
  - H3：df 与 du 差异
  - H3：隐藏挂载数据和 open-deleted 日志
- H2：结果验证
  - H3：通过容量、inode 和打开文件证据闭合结论

## 验证方式

- 贯穿案例：构造样例树，比较硬链接和符号链接，归档并校验，挂载 loopback 文件系统，制造删除后仍打开的文件并解释 df/du/lsof。
- 完整示例：构造样例树，比较硬链接和符号链接，归档并校验，挂载 loopback 文件系统，制造删除后仍打开的文件并解释 df/du/lsof。
- 失败边界与踩坑：递归删除、覆盖、稀疏文件、符号链接遍历、不可信归档、挂载路径和设备写入均需先确认边界。
- FAQ 候选与来源：df 与 du 为什么不同、删除文件为何仍占空间、硬链接与软链接如何选择。
- 自测形式：用中文场景选择命令，解释输出并写出验证步骤。
- 可视化：inode/链接关系、存储栈和 df-versus-du 决策流。
- 闪卡计划：cp、mv、rm、find、tar、df、du、lsblk、mount、lsof 与破坏性操作安全卡。
- 参考资料：util-linux、GNU coreutils、Linux 文件系统与 Ubuntu 存储文档。

## 结果验证

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。

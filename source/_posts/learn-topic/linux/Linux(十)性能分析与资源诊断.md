---
title: Linux(十)性能分析与资源诊断
tags:
  - Linux
  - 性能分析
categories:
  - Learn Topic
  - Linux
description: 用统一方法识别 CPU、内存、I/O、容量、网络和进程瓶颈，并正确解释指标。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 10
published: false
abbrlink: '997240e7'
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：用统一方法区分 CPU、内存、I/O、容量、网络和进程瓶颈，正确解释采样指标。
- 学习成果：能够识别受限资源并选择下一步测量，而不是凭单个指标猜测。
- 前置文章：第 3、7、8、9 篇。
- 能力分配：
- 核心详解 / 进程级定位：posix2024:utility:time、ubuntu26.04:command:lsof、ubuntu26.04:command:strace
- 核心详解 / 内存与 Swap：ubuntu26.04:command:free、ubuntu26.04:command:pmap、ubuntu26.04:command:slabtop
- 核心详解 / 负载与 CPU：ubuntu26.04:command:htop、ubuntu26.04:command:lscpu、ubuntu26.04:command:mpstat、ubuntu26.04:command:nproc、ubuntu26.04:command:pidstat、ubuntu26.04:command:top、ubuntu26.04:command:uptime、ubuntu26.04:command:vmstat
- 核心详解 / 磁盘与 I/O：ubuntu26.04:command:iostat
- 核心详解 / 历史与专项分析：ubuntu26.04:command:perf、ubuntu26.04:command:sar

## 章节计划

- H2：性能分析方法
  - H3：工作负载、延迟、吞吐、利用率、饱和与错误
  - H3：基线、间隔、次数、开销和观察者效应
- H2：负载与 CPU
  - H3：uptime load average、可运行与 D 状态任务、CPU 数量
  - H3：top、htop、mpstat、vmstat、pidstat、per-CPU 与 steal time
- H2：内存与 Swap
  - H3：free available、缓存、常驻与虚拟内存
  - H3：vmstat si/so、pressure、fault、OOM、pmap、slabtop
- H2：磁盘与 I/O
  - H3：容量和 I/O 性能的区分
  - H3：iostat interval、await、队列、吞吐和利用率
  - H3：pidstat I/O 与删除后仍打开的文件
- H2：网络与连接
  - H3：ss 队列、重传识别、接口计数器和抓包证据
- H2：进程级定位
  - H3：ps/top 排序、pidstat 维度、lsof 资源、strace syscall 等待
- H2：历史与专项分析
  - H3：sar 历史采集
  - H3：perf、PSI 和 eBPF 入口边界
- H2：四类故障实验
  - H3：CPU 饱和
  - H3：内存压力与换页
  - H3：磁盘 I/O 饱和与容量耗尽
  - H3：网络或监听器瓶颈
- H2：结果验证
  - H3：修复后重新测量并比较前后指标

## 验证方式

- 贯穿案例：对四种隔离负载建立基线、采样、判断资源、下钻到进程、最小修复并复测。
- 完整示例：对四种隔离负载建立基线、采样、判断资源、下钻到进程、最小修复并复测。
- 失败边界与踩坑：不要把 load 当 CPU 百分比；区分累计报告和间隔报告；不要把低 free 直接等同内存压力。
- FAQ 候选与来源：await 与 util 如何解释、第一份 sar/iostat 报告为何可能是累计值、何时使用 perf。
- 自测形式：用中文场景选择命令，解释输出并写出验证步骤。
- 可视化：USE 矩阵、性能决策树、指标—命令表和真实实验采样线。
- 闪卡计划：所有性能命令、指标字段解释、采样方式选择、安全与观察者效应。
- 参考资料：procps、sysstat、perf、Linux PSI/cgroup 文档和 USE 方法。

## 结果验证

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。

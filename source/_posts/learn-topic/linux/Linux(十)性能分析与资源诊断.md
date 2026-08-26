---
title: Linux(十)性能分析与资源诊断
tags:
  - Linux
  - 性能分析
categories:
  - Learn Topic
  - Linux
description: 用同一时间窗的 CPU、内存、I/O、进程与系统调用证据定位性能瓶颈。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 10
published: true
abbrlink: '997240e7'
date: 2026-08-25 00:00:00
---

{% course_series %}

{% note info flat %}
性能分析先回答“哪段时间、哪个请求、哪个进程变慢”，再采集 CPU、内存、I/O 和系统调用证据。单个高百分比、一次 top 截图或一次命令耗时都不是根因；所有比较都应复用相同的时间窗、采样间隔和负载条件。
{% endnote %}

## 诊断框架

{% mermaid %}
flowchart TD
  A[症状与时间窗] --> B[CPU 与运行队列]
  A --> C[内存与回收]
  A --> D[设备与 I/O]
  A --> E[进程、句柄与系统调用]
  B --> F[同条件复测]
  C --> F
  D --> F
  E --> F
{% endmermaid %}

{% note primary flat %}
先用 uptime、top 和 free 判断症状是否仍在发生，再用 mpstat、vmstat、iostat、pidstat 按维度分解，最后才把 perf、strace、pmap 或 lsof 对准已确认的 PID。每次只改变一个变量，否则无法区分修复效果和负载波动。
{% endnote %}

## CPU 与负载

~~~bash
uptime
nproc
lscpu
top -b -n 2 -d 1
mpstat -P ALL 1 3
~~~

| 中文问题 | 选择 | 读哪个证据 | 不要误解 |
| --- | --- | --- | --- |
| 系统整体是否仍忙 | uptime | load average 与运行时间 | load 不是 CPU 百分比 |
| 当前可用并行度是多少 | nproc、lscpu | 可用 CPU、拓扑和架构 | 容器配额可能不同于物理核 |
| 哪个进程当前占资源 | top | PID、状态、CPU、内存 | 单次快照不代表趋势 |
| 是否有单核不均或 iowait | mpstat | 每 CPU 用户态、内核态、等待 | 采样间隔会改变结论 |

{% note warning flat %}
高 load 可能来自可运行任务，也可能来自不可中断 I/O 等待；高 CPU 也可能只是短暂尖峰。必须把 load、运行队列、iowait、用户态和内核态放进同一时间窗解释。
{% endnote %}

### 进程采样

~~~bash
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
CPU_PID=
cleanup() {
  if test -n "$CPU_PID"; then
    kill -TERM "$CPU_PID" 2>/dev/null || true
    wait "$CPU_PID" 2>/dev/null || true
  fi
  rm -rf -- "$LAB"
}
trap cleanup EXIT INT TERM

sh -c 'while :; do :; done' &
CPU_PID=$!
sleep 1
pidstat -u -p "$CPU_PID" 1 3
ps -o pid,stat,%cpu,%mem,etime,cmd -p "$CPU_PID"
~~~

{% note primary flat %}
示例只启动并回收自己的短时 CPU 进程。pidstat 把指定 PID 的 CPU 与上下文切换按间隔输出，ps 补充状态和命令行；如果采样前进程已结束，先记录这一事实，再用更长寿命的受控工作负载重试，而不是把零输出解释成系统健康。
{% endnote %}

## 内存与回收

~~~bash
free -h
vmstat 1 5

TARGET_PID=$$
pmap -x "$TARGET_PID"
pidstat -r -p "$TARGET_PID" 1 3
~~~

{% note info flat %}
free 的 available 比简单的 used 更能解释是否还有可回收空间；vmstat 将运行队列、上下文切换、换入换出与 I/O 放到一个采样面板；pmap 展开一个已核对 PID 的映射；pidstat -r 观察进程级内存和缺页趋势。缓存占用不等于泄漏，必须比较趋势、swap、回收和业务延迟。
{% endnote %}

## I/O 与句柄

~~~bash
iostat -xz 1 3

TARGET_PID=$$
pidstat -d -p "$TARGET_PID" 1 3
lsof -p "$TARGET_PID"
time sh -c 'sleep 0.2; :'
~~~

| 现象 | 组合 | 结论边界 |
| --- | --- | --- |
| 设备等待或队列高 | iostat、vmstat | 还要区分读写、队列长度和设备延迟 |
| 某进程有持续读写 | pidstat -d、lsof | 文件名不等于已经落盘的物理设备 |
| 文件删后空间未回收 | lsof | 只说明仍有打开的文件，需要确认持有者和路径 |
| 命令整体变慢 | time | 只给墙钟和 CPU 汇总，不解释内核路径 |

{% note warning flat %}
lsof 和 strace 输出可能出现用户名、内部路径、套接字或命令参数；收集到工单或外部渠道前先按最小必要原则脱敏。I/O 指标为空也可能是采样时间窗没有覆盖真正工作负载，不能据此直接否定用户的慢请求。
{% endnote %}

## 深度观察

### perf 与 strace

~~~bash
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
trap 'rm -rf -- "$LAB"' EXIT

perf stat -- sleep 1
perf record -o "$LAB/perf.data" -g -- sleep 1
strace -f -tt -T -o "$LAB/trace.log" -- sh -c 'printf "%s\n" "trace target"'
test -s "$LAB/trace.log" && printf '%s\n' 'trace captured'
~~~

{% note danger flat %}
perf 可能受 perf_event 权限、内核配置和容器限制影响；strace 会改变时序并产生大量、可能敏感的系统调用记录。先用轻量采样缩小范围，再限制持续时间、PID、事件与输出目录；perf record 和 strace 的文件必须放进独占临时目录，分析结束后按环境策略清理。
{% endnote %}

### 低频入口

{% folding blue, 何时再使用 htop、sar 或 slabtop %}
| 工具 | 中文用途 | 选择与排除边界 |
| --- | --- | --- |
| htop | 交互式查看进程树、排序和筛选 | 适合人工探索；需要可复现证据时记录 top、pidstat 或命令输出 |
| sar | 回放 sysstat 已采集的历史指标 | 只有 sysstat 已启用且时间范围匹配时有意义，不能补回未采集的过去 |
| slabtop | 观察内核 slab 缓存 | 怀疑内核缓存异常再使用；瞬时占用不等于内核泄漏，通常还需要权限与持续采样 |
{% endfolding %}

## 复测报告

~~~bash
uptime
free -h
vmstat 1 3
mpstat -P ALL 1 3
iostat -xz 1 3
~~~

1. 固定症状、请求样本、主机或容器边界、开始时间和采样间隔。
2. 先记录基线，再只改变一个可回滚因素。
3. 用相同命令和相同间隔采集恢复后的数据。
4. 报告指标定义、采样条件、已证实结论、仍未验证假设和下一步。

{% note success flat %}
性能结论至少包含指标含义、时间窗、CPU/容器配额、负载来源和复测结果。“内存 90%”“CPU 100%”是观察值，不是根因；只有证据链能说明下一步该优化代码、容量、配置还是依赖服务。
{% endnote %}

{% flashcard basic id:linux-a10-load-cpu deck:"Linux" priority:1 tags:"性能,CPU" %}
--- question
load average 为什么不能直接当作 CPU 使用率？
--- answer
load 包含可运行和部分不可中断等待任务，可能被 I/O、锁或设备延迟推高。
--- explanation
结合 nproc、mpstat、vmstat 的运行队列和 iowait，才能判断 CPU 是否饱和。
{% endflashcard %}

{% flashcard basic id:linux-a10-free-cache deck:"Linux" priority:1 tags:"内存,free" %}
--- question
free 输出中 cached/buffers 很高是否一定是内存泄漏？
--- answer
不一定，缓存可在需要时回收；更应看 available、swap、回收和进程 RSS 趋势。
--- explanation
用 vmstat、pidstat -r、pmap 分层验证，比较同一时间窗和基线。
{% endflashcard %}

{% flashcard basic id:linux-a10-iostat-pidstat deck:"Linux" priority:1 tags:"I/O,采样" %}
--- question
iostat 和 pidstat -d 如何配合定位 I/O？
--- answer
iostat 看设备总体队列和延迟，pidstat -d 看进程读写；两者时间窗和采样间隔要一致。
--- explanation
设备忙不等于某一个进程有问题，进程写入也不等于物理盘已落盘。
{% endflashcard %}

{% flashcard basic id:linux-a10-perf-strace deck:"Linux" priority:2 tags:"perf,strace" %}
--- question
什么时候用 perf，什么时候用 strace？
--- answer
perf 适合采样 CPU 热点和硬件统计，strace 适合观察系统调用、错误和等待；两者都有开销。
--- explanation
先用轻量采样缩小范围，再限时、限 PID、限事件深挖，记录权限和对时序的影响。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Linux procps Manual, https://man7.org/linux/man-pages/man1/top.1.html, https://man7.org/favicon.ico %}
{% link sysstat Project Documentation, https://github.com/sysstat/sysstat, https://github.com/favicon.ico %}
{% link Linux kernel perf Documentation, https://docs.kernel.org/admin-guide/perf-security.html, https://docs.kernel.org/favicon.ico %}
{% link strace Documentation, https://strace.io/, https://strace.io/favicon.ico %}
{% endlinkgroup %}

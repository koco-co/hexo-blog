---
title: Linux(七)进程任务与服务管理
tags:
  - Linux
  - 进程服务
categories:
  - Learn Topic
  - Linux
description: 用 PID、状态、信号、作业、优先级与 systemd 证据判断任务是否真正生效。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 7
published: true
abbrlink: 23ca1872
date: 2026-03-16 00:00:00
---

{% course_series %}

{% note info flat %}
服务异常时，先区分“进程不存在”“进程存在但卡住”“服务管理器没有加载”和“定时任务没有触发”。本文先收集 PID、状态和 unit 证据，再选择信号或服务动作；不把 kill -9、重启或关机当成第一步。
{% endnote %}

## 进程模型

{% mermaid %}
flowchart TD
  A[Shell 或服务管理器] --> B[进程 PID]
  B --> C[父进程、进程组、会话]
  B --> D[状态 R/S/D/T/Z]
  B --> E[信号与退出状态]
  B --> F[文件描述符与环境]
{% endmermaid %}

### 可控子进程

~~~bash
sleep 2 &
WORKER=$!

ps -o pid,ppid,pgid,sid,stat,etime,cmd -p "$WORKER"
pgrep -a -P "$$"
kill -0 "$WORKER"
wait "$WORKER"
printf 'wait-status=%s\n' "$?"
~~~

{% note primary flat %}
这段只启动自己的短命 sleep。ps 给出一次快照，pgrep -P 按父进程找子进程，kill -0 不发信号、只检查目标是否存在且可访问，wait 回收子进程并取得退出状态。R 表示运行或可运行，S 表示可中断睡眠，D 常见于不可中断 I/O 等待，T 是停止，Z 是僵尸；状态必须结合命令、时间和日志判断。
{% endnote %}

## 信号与终止

### 先温和终止

~~~bash
sleep 30 &
WORKER=$!

kill -TERM "$WORKER"
if wait "$WORKER"; then
  printf '%s\n' 'unexpected normal exit'
else
  printf 'term-status=%s\n' "$?"
fi

bash -c '
  sleep 30 &
  child=$!
  pkill -TERM -P "$$"
  wait "$child"
  printf "pkill-status=%s\n" "$?"
'
~~~

{% note primary flat %}
kill 针对一个已核对的 PID；pkill 按条件匹配进程，所以示例把它限制在一个临时 Bash 的子进程。SIGTERM 给程序清理资源的机会，正常被终止的 sleep 通常让 wait 得到 143。先用 ps 或 pgrep 核对用户、完整命令行和 PID，再决定是否发送信号。
{% endnote %}

| 目的 | 选择 | 边界 |
| --- | --- | --- |
| 请求程序优雅退出 | SIGTERM | 等待退出与日志，不把无响应立刻当成 KILL 理由 |
| 通知重载或终端挂断 | SIGHUP | 具体行为由程序定义 |
| 暂停与继续 | SIGSTOP、SIGCONT | STOP 无法被程序捕获 |
| 最后手段终止 | SIGKILL | 无清理机会，可能留下锁或半写数据 |

{% note danger flat %}
不要把真实服务名直接交给 pkill，也不要在不了解进程树时用 -9。信号只解决“让哪个进程接收什么通知”，不能修复 I/O、锁、内存或依赖服务的根因。
{% endnote %}

## 作业控制

~~~bash
sleep 2 &
WORKER=$!
jobs -l
wait "$WORKER"

nohup sh -c 'sleep 1' >/dev/null 2>&1 &
NOHUP_PID=$!
wait "$NOHUP_PID"
printf 'nohup-status=%s\n' "$?"
~~~

{% note info flat %}
jobs 和 wait 只面向当前 Bash 会话的作业；nohup 主要处理挂断信号与默认输出处理，不等于可靠的服务管理器。Bash job control、POSIX job control 和信号规则共同解释这些边界，但跨会话排障应改用 ps、pgrep 或 systemctl。
{% endnote %}

{% note info flat %}
Bash 的 Job Control Variables（作业控制变量，例如 `auto_resume`、`checkjobs`、`huponexit`）只影响当前交互式 Bash 对停止作业、退出和提示的处理。需要操作当前终端的前后台作业时才考虑它们；脚本、非 TTY 或跨会话诊断不能据此判断系统进程，应改用 ps、pgrep 或 systemctl。
{% endnote %}

| 场景 | 选择 | 不要误解 |
| --- | --- | --- |
| 已暂停的当前终端作业继续后台运行 | bg | 只在有交互式 job control 的同一终端有效 |
| 把当前终端作业带回前台 | fg | 不是按系统 PID 查找进程 |
| 周期刷新只读观察 | watch | 它不记录证据，也不替代根因分析 |
| 等待指定进程结束 | pidwait | 是 procps 专项入口，常规脚本优先管理自己启动的 PID |

## 优先级与调度

~~~bash
(
NICE_WORKER=
WORKER=
cleanup() {
  for PID in "$NICE_WORKER" "$WORKER"; do
    [ -n "$PID" ] && kill -TERM "$PID" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

nice -n 5 sleep 30 &
NICE_WORKER=$!

sleep 30 &
WORKER=$!

ps -o pid,ni,pri,stat,cmd -p "$NICE_WORKER" -p "$WORKER"
renice 5 -p "$WORKER"
ps -o pid,ni,pri,stat,cmd -p "$WORKER"
kill -TERM "$NICE_WORKER" "$WORKER"
for PID in "$NICE_WORKER" "$WORKER"; do
  wait "$PID" || printf 'terminated-status=%s\n' "$?"
done
)
~~~

{% note warning flat %}
nice 在启动时给出较低优先级，renice 调整已有 PID 的 nice 值；第一条 ps 应显示 NICE_WORKER 的 NI 为 5，第二条应显示 WORKER 的 NI 已变为 5。示例在子 Shell 中运行，清理 trap 不会改写当前终端已有的 trap。正数通常降低 CPU 调度优先级；普通用户通常可以把自己的 nice 值调大，却不能把它调回更高优先级。它们不是 CPU 配额，也不能解决 I/O、锁或内存瓶颈。
{% endnote %}

## systemd 服务

### 读取 unit

~~~bash
UNIT=ssh.service
systemctl is-active "$UNIT"
printf 'is-active-status=%s\n' "$?"
systemctl is-enabled "$UNIT"
systemctl show -p ActiveState -p SubState -p MainPID "$UNIT"
systemctl cat "$UNIT"
~~~

{% note primary flat %}
把 UNIT 换成当前主机已知的服务。is-active 与 is-enabled 分别回答运行态和开机启用关系；show 给出可脚本读取的字段；cat 显示 unit 配置。unit 不存在与服务已停止都可能返回非零，所以必须同时保存命令输出和状态，不能只看一个布尔结果。
{% endnote %}

### 最小变更

~~~bash
if systemctl --user show-environment >/dev/null 2>&1; then
  systemd-run --user --scope /usr/bin/true
  printf 'user-scope-status=%s\n' "$?"
else
  printf '%s\n' '当前会话没有可用的 systemd user manager'
fi
~~~

{% note info flat %}
systemd-run 创建临时 scope 或 service，适合验证服务管理器能否启动一个受控动作；上例不修改系统 unit 文件。start/stop/restart/reload 改变当前运行态，enable/disable 改变开机关系，必须针对已经审批的 unit 执行，并在动作后重新读取 ActiveState、MainPID 和日志。
{% endnote %}

## 定时任务

| 需求 | 选择 | 验证与边界 |
| --- | --- | --- |
| 一次性、指定时间执行 | at | 先确认队列、执行用户、环境和取消办法 |
| 空闲时批量执行 | batch | 触发依赖系统负载，不能当作准点调度 |
| 周期性任务 | crontab | 明确 PATH、工作目录、Shell、日志和错过执行策略 |
| 长期可观测定时服务 | systemd timer | 需 unit、日志与失败重试设计，超出本篇最小操作 |

{% note warning flat %}
定时任务经常在非交互环境失败：没有 TTY，PATH 和工作目录不同，交互式 alias 也不可靠。先把一条只读或可回滚命令在相同用户、相同环境复现，再写入计划。
{% endnote %}

## 迁移边界

{% note danger flat %}
halt、poweroff、reboot、shutdown 影响整机可用性，不是 `systemctl restart <unit>` 的替代品。本课程不要求执行它们；只能在已审批的主机维护窗口、确认用户影响和恢复路径后按组织流程操作。
{% endnote %}

{% folding blue, 旧入口与当前选择 %}
| 旧入口 | 当前选择 | 不等价边界 |
| --- | --- | --- |
| init | systemctl 管理 unit 状态和目标 | 不把 runlevel 数字或关机动作机械替换为单个 service 命令 |
| skill | kill 或受限条件的 pkill | 先核对 PID/匹配范围，再发明确信号 |
| snice | nice、renice | 记录 PID 和原优先级，优先级不是资源配额 |
| halt、poweroff、reboot、shutdown | 主机级维护流程 | 它们影响整机，不是服务重启的快捷方式 |
{% endfolding %}

## 结果验证

~~~bash
UNIT=ssh.service  # 改成当前主机已知的 unit

sleep 1 &
WORKER=$!

ps -o pid,ppid,stat,etime,cmd -p "$WORKER"
kill -0 "$WORKER"
wait "$WORKER"
printf 'worker-status=%s\n' "$?"

if systemctl show -p LoadState "$UNIT" >/dev/null 2>&1; then
  systemctl is-active "$UNIT"
  printf 'unit-status=%s\n' "$?"
else
  printf 'unit-not-found-or-systemd-unavailable=%s\n' "$UNIT" >&2
fi
~~~

{% note success flat %}
进程证据至少包含 PID、父进程、状态、命令行、动作后的退出状态；服务证据至少包含 unit 名、ActiveState、MainPID 和相邻日志。若 unit 不存在或 systemd 不可用，先记录这个失败边界，不要把它误报为“服务已停止”。
{% endnote %}

## 常见问题

{% flashcard basic id:linux-a7-term-kill deck:"Linux" priority:1 tags:"信号,进程" %}
--- question
为什么通常先发 SIGTERM，再考虑 SIGKILL？
--- answer
SIGTERM 给程序清理资源和保存状态的机会，SIGKILL 无法被捕获或清理。
--- explanation
信号的顺序决定程序有没有机会收尾：

```bash
pid=$(pgrep -n -f 'sleep 60')
ps -o pid,ppid,stat,cmd -p "$pid"
kill -TERM "$pid"
sleep 1
kill -0 "$pid" 2>/dev/null && printf '%s\n' '仍在运行，才评估 SIGKILL'
```

`SIGTERM` 可以被程序捕获，常用于关闭连接、刷新状态和删除临时文件；`SIGKILL` 由内核直接终止，程序没有清理机会。两者都必须建立在已核对 PID 和命令行之上，否则“强制结束”可能命中同名的另一进程。
{% endflashcard %}

{% flashcard basic id:linux-a7-systemctl-enable deck:"Linux" priority:1 tags:"systemd,服务" %}
--- question
systemctl start 和 enable 分别改变什么？
--- answer
start 改变当前运行状态，enable 建立开机启动关系；enable 不等于立刻启动。
--- explanation
这两个动作作用在不同状态上，可以分别读回：

```bash
systemctl start demo.service
systemctl is-active demo.service
systemctl enable demo.service
systemctl is-enabled demo.service
```

`is-active` 说明当前是否有运行中的 unit，`is-enabled` 说明启动关系是否已建立。`enable` 默认只创建启动链接，不会把停止的服务立刻拉起来；如果目标是“现在运行且重启后仍运行”，需要明确执行并验证两次。
{% endflashcard %}

{% flashcard basic id:linux-a7-jobs-pgrep deck:"Linux" priority:2 tags:"作业控制,查找" %}
--- question
jobs 和 pgrep 的观察对象有什么不同？
--- answer
jobs 看当前 Bash 会话的作业，pgrep 查系统进程；后台作业可能脱离当前 Shell。
--- explanation
先看当前会话，再看全系统：

```bash
sleep 60 &
jobs -l                 # 当前 Bash 的作业表
pgrep -af 'sleep 60'    # 系统进程表中的匹配
ps -o pid,ppid,tty,stat,cmd -p "$(pgrep -n -f 'sleep 60')"
```

`jobs` 依赖当前 Bash 的 job-control 表，关闭终端或交给 systemd 后就不再是可靠入口；`pgrep`、`ps` 和 `systemctl` 才能跨会话观察。`nohup` 只改变挂断信号和输出处理，并不提供生命周期、重启或日志治理。
{% endflashcard %}

{% flashcard basic id:linux-a7-schedule deck:"Linux" priority:2 tags:"定时任务,环境" %}
--- question
为什么 crontab 中能在交互式 Shell 运行的命令可能失败？
--- answer
定时任务的 PATH、工作目录、Shell 和环境变量不同，还可能没有 TTY。
--- explanation
cron 启动的上下文通常没有交互式 Shell 的环境。可以用接近 cron 的方式做一次对照：

```bash
env -i HOME="$HOME" PATH=/usr/bin:/bin \
  sh -c 'printf "cwd=%s PATH=%s tty=%s\\n" "$PWD" "$PATH" "$(tty 2>/dev/null || printf none)"'
```

脚本应显式设置工作目录、关键环境变量和命令路径，并把标准输出/错误写入可轮转的日志；先以相同用户在非交互环境复现，再把任务交给 cron。能在终端成功只能证明交互上下文成立。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024 Process and Job Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/utilities/contents.html, https://pubs.opengroup.org/favicon.ico %}
{% link GNU Bash Job Control, https://www.gnu.org/software/bash/manual/bash.html, https://www.gnu.org/favicon.ico %}
{% link systemd systemctl Manual, https://www.freedesktop.org/software/systemd/man/latest/systemctl.html, https://www.freedesktop.org/favicon.ico %}
{% endlinkgroup %}

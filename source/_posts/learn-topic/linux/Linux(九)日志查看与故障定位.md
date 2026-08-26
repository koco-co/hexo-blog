---
title: Linux(九)日志查看与故障定位
tags:
  - Linux
  - 日志排障
categories:
  - Learn Topic
  - Linux
description: 跨 Journal、内核消息、崩溃转储与轮转历史重建可复核的故障时间线。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 9
published: true
abbrlink: cade4656
date: 2026-03-18 00:00:00
---

{% course_series %}

{% note info flat %}
日志排障的产物不是一段“看起来异常”的输出，而是一条可复核的时间线：什么组件在何时、以什么级别记录了什么，随后哪项动作改变了状态。先保留原始证据，再用服务、时间、优先级和崩溃信息缩小范围；不要把观察到的事件直接写成因果结论。
{% endnote %}

## 日志来源

{% mermaid %}
flowchart TD
  A[应用标准错误或日志文件] --> B[journald]
  C[内核环形缓冲区] --> D[dmesg]
  B --> E[journalctl]
  F[崩溃转储] --> G[coredumpctl]
  H[轮转策略与旧文件] --> I[logrotate]
{% endmermaid %}

{% note primary flat %}
先确认事件来自哪里：服务事件优先用 journalctl，内核事件用 dmesg，受控测试事件可用 logger 或 systemd-cat，崩溃记录用 coredumpctl，文件保留和轮转用 logrotate。不同来源的时间戳、时区和保留周期可能不同，拼接前要先校准时间窗。
{% endnote %}

## Journal 查询

### 服务与时间

~~~bash
UNIT=ssh.service  # 改为当前主机已知的服务
journalctl --unit "$UNIT" --boot --no-pager
journalctl --unit "$UNIT" --since "2026-08-25 10:00" --until "2026-08-25 10:30" --no-pager
journalctl --priority=warning --boot --no-pager
journalctl --dmesg --boot --no-pager
~~~

| 中文问题 | 选择 | 能证明什么 | 不能证明什么 |
| --- | --- | --- | --- |
| 某服务在故障窗口发生了什么 | journalctl --unit 与 --since/--until | 该 unit 在指定窗口可见的 Journal 事件 | 应用所有文件日志都已被收集 |
| 上一次启动前后是否变化 | --boot、--boot=-1 | 事件属于哪次系统启动 | 两次启动间未持久化的日志 |
| 是否出现高优先级事件 | --priority=warning | warning 及更严重的 0–4 级消息 | 没有低优先级根因 |
| 是否只看内核消息 | --dmesg | journald 收集到的内核消息 | 内核环形缓冲区的全部历史 |

{% note warning flat %}
journalctl 的单个 --priority 值会包含该级别及更严重的消息，所以 --priority=warning 覆盖 warning、err、crit、alert 和 emerg；若使用范围形式，应按 emerg..warning 的顺序书写。--follow 会持续跟随输出，复现结束后要停止；--no-pager 适合机器采集，-o short-iso 或 -o json 可固定输出格式。权限、速率限制、未持久化存储和筛选条件都可能产生空结果，因此“没有输出”只能说明当前查询没有返回事件。
{% endnote %}

### 受控测试事件

~~~bash
TAG="linux-log-lab-$(date +%s)"
logger -t "$TAG" -- "logger test event"
printf '%s\n' "systemd-cat test event" | systemd-cat -t "$TAG" -p info
journalctl -t "$TAG" -n 10 --no-pager
~~~

{% note info flat %}
logger 写一条系统日志消息；systemd-cat 把标准输入交给 journald。只在获准的测试环境写入带唯一 TAG 的短消息，并用同一 TAG 查询来验证采集链路；若 systemd-cat 不存在或查询为空，记录运行环境、权限和日志服务状态，不要把测试事件伪装成业务故障。
{% endnote %}

## 内核与崩溃

### 内核消息

~~~bash
dmesg --level=err,warn
dmesg --time-format=iso
journalctl --dmesg --since "10 minutes ago" --no-pager
~~~

{% note primary flat %}
dmesg 读取当前内核环形缓冲区，重启或缓冲区覆盖会丢失旧消息；journalctl --dmesg 查询 journald 收集的内核消息。两者都可能受权限和保留策略影响，所以要同时记录命令、时间窗和输出格式。
{% endnote %}

### 崩溃转储

~~~bash
coredumpctl list --no-pager
coredumpctl info --since "today" --no-pager

COREDUMP_PID=1234  # 只替换为 list 中已核对的 PID
coredumpctl info "$COREDUMP_PID"
~~~

{% note danger flat %}
coredump 可能包含进程内存、令牌或用户数据。list 和 info 用于确认是否存在记录与元数据；debug 会启动调试器，导出会复制敏感内容，二者都只能在获授权环境、受控保留期和适当文件权限下进行。没有匹配 PID 的失败是正常查询结果，不应被解释为“没有发生过崩溃”。
{% endnote %}

## 轮转与保留

~~~bash
CONFIG=/etc/logrotate.conf
sudo logrotate -d "$CONFIG"
ls -l /var/log
~~~

{% note warning flat %}
logrotate -d 只模拟并展示拟议动作；真实的 force 轮转会改名、压缩、删除历史文件或触发 postrotate 脚本，不能当成练习命令。执行任何写入动作前，要先审查配置、目标日志、磁盘空间、保留期、服务重开日志文件的方式和回滚安排。
{% endnote %}

## 时间线方法

### 采集顺序

~~~bash
UNIT=ssh.service  # 改为当前主机已知的服务
date --iso-8601=seconds
journalctl --unit "$UNIT" --since "10 minutes ago" --no-pager
journalctl --dmesg --since "10 minutes ago" --no-pager
dmesg --level=err,warn --time-format=iso
ls -lt /var/log
~~~

1. 固定时区、主机、服务版本、影响范围和故障起止时间。
2. 先取服务 Journal，再对齐内核消息、应用文件和轮转历史。
3. 把每条结论标成“观察”“推断”或“待验证”，并保留原始位置。
4. 用同一时间窗做一次受控复现或恢复后的复测，确认采集链路没有断裂。

{% note success flat %}
合格的日志报告要说明来源、查询条件、时间格式、权限与保留盲区。它能让接手者重新运行查询并判断你的推断是否成立，而不是只得到一张截断截图。
{% endnote %}

{% flashcard basic id:linux-a9-journal-filter deck:"Linux" priority:1 tags:"journalctl,日志" %}
--- question
journalctl 排障时最有价值的三个过滤维度是什么？
--- answer
服务 unit、故障时间窗和优先级；必要时再加 boot、内核或输出格式。
--- explanation
先缩小数据再解释消息，--unit、--since/--until、--priority 和 --boot 能组成可复现查询。
{% endflashcard %}

{% flashcard basic id:linux-a9-dmesg-journal deck:"Linux" priority:1 tags:"dmesg,内核" %}
--- question
dmesg 与 journalctl --dmesg 有什么边界？
--- answer
dmesg 读取内核环形缓冲区，journalctl --dmesg 查询 journald 收集的内核消息；保留策略和时间范围可能不同。
--- explanation
重启、缓冲区覆盖、权限和持久化配置都会造成缺口，不能只依赖一个来源。
{% endflashcard %}

{% flashcard basic id:linux-a9-logrotate deck:"Linux" priority:2 tags:"logrotate,保留" %}
--- question
为什么 logrotate -d 比直接强制轮转更适合先验证？
--- answer
-d 只模拟轮转，强制轮转会立即改名、压缩或删除历史文件。
--- explanation
先检查配置、权限、磁盘和 postrotate，再安排维护窗口执行真实变更。
{% endflashcard %}

{% flashcard basic id:linux-a9-coredump deck:"Linux" priority:2 tags:"崩溃,coredump" %}
--- question
coredumpctl list 能否直接证明崩溃原因？
--- answer
不能，它只说明系统记录了转储；需要 info、符号和调用栈，并结合服务日志复核。
--- explanation
转储含敏感内存，导出与调试必须在授权环境进行。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link systemd journalctl Manual, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html, https://www.freedesktop.org/favicon.ico %}
{% link systemd coredumpctl Manual, https://www.freedesktop.org/software/systemd/man/latest/coredumpctl.html, https://www.freedesktop.org/favicon.ico %}
{% link Linux dmesg Manual, https://man7.org/linux/man-pages/man1/dmesg.1.html, https://man7.org/favicon.ico %}
{% link logrotate Manual, https://man7.org/linux/man-pages/man8/logrotate.8.html, https://man7.org/favicon.ico %}
{% endlinkgroup %}

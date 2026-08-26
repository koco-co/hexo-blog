---
title: Linux(十三)综合实战
tags:
  - Linux
  - 综合实战
categories:
  - Learn Topic
  - Linux
description: 把日志、进程、服务、资源、磁盘和网络证据串成完整故障诊断和面试复述。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 13
published: true
abbrlink: c0dffe07
date: 2026-08-25 00:00:00
---

{% course_series %}

{% note info flat %}
综合实战模拟一个健康检查接口变慢的值班事件：先固定时间窗和影响范围，再沿网络、服务、进程、资源、日志和文件证据链定位，最后给出可回滚的动作和复测结果。命令只是证据采集手段，不能替代假设、验证和沟通。
{% endnote %}

## 事件与边界

### 现象记录

{% note primary flat %}
报告初始事实：请求延迟升高、错误率、受影响主机、开始时间、调用方和最近变更。不要先写“CPU 高导致慢”，那是待验证假设。
{% endnote %}

~~~bash
date --iso-8601=seconds
uname -a
cat /etc/os-release
printf '%s\n' "$HOSTNAME"
~~~

### 安全边界

| 动作 | 风险 | 先做什么 |
| --- | --- | --- |
| 重启服务 | 中断连接 | 确认副本、窗口和回滚 |
| kill 进程 | 数据/锁未清理 | 先 TERM 和日志观察 |
| 删除日志/临时文件 | 丢失证据 | 先复制、校验和压缩 |
| 修改网络/存储 | 扩大影响 | 先快照、dry-run 和变更审批 |

## 网络证据

~~~bash
ip addr
ip route
dig A api.example.com
ss -ntp
curl -vk --max-time 5 https://api.example.com/health
tracepath api.example.com
~~~

{% note info flat %}
若 DNS 正常但 curl 超时，比较 ss 中的连接状态、路由和服务监听；若 curl 返回 5xx，网络层已经通到应用，下一步应转向服务、进程和日志。必要时用 tcpdump 限定主机与端口抓取少量样本。
{% endnote %}

## 服务与进程

~~~bash
systemctl status api.service --no-pager
systemctl show -p ActiveState -p SubState -p MainPID api.service
pgrep -a -f api
ps -o pid,ppid,stat,etime,%cpu,%mem,cmd -p PID
lsof -p PID
~~~

{% note primary flat %}
systemctl 给出 unit 与 Main PID，ps 给出进程状态和资源快照，lsof 说明打开的文件/Socket。三者一致才可把“服务故障”缩小为某个进程；PID 已变化时重新采集，不要复用旧结论。
{% endnote %}

## 资源证据

~~~bash
uptime
top -b -n 1
free -h
vmstat 1 5
iostat -xz 1 3
pidstat -u -d 1 3
df -h
du -sh /var/lib/api
~~~

{% note warning flat %}
把 CPU、内存、I/O 和容量放进同一时间窗，区分“瓶颈”与“伴随现象”：load 高可能是 I/O，free 的缓存不是泄漏，df 满不一定由当前目录造成。需要深挖时限时使用 perf、strace 或 pmap。
{% endnote %}

## 日志时间线

~~~bash
journalctl -u api.service --since "15 minutes ago" --until "now" --no-pager
journalctl -k --since "15 minutes ago" --no-pager
grep -nE 'timeout|error|5[0-9][0-9]' /var/log/api/*.log
dmesg --level=err,warn --time-format=iso
~~~

{% note info flat %}
以请求开始、服务错误、资源异常、重试和恢复为节点画时间线；同一事件至少由两类来源相互印证。轮转、时钟偏移、限流和权限造成的空洞要明确标记。
{% endnote %}

## 可回滚动作

### 先验证后改变

~~~bash
systemctl reload api.service
systemctl is-active api.service
curl -fsS --max-time 5 https://api.example.com/health
~~~

{% note success flat %}
如果 reload 不支持或没有改善，记录退出码和日志后再评估 restart；每次只做一个改变，保留变更前后同样的网络、服务和资源采样。
{% endnote %}

### 复测与交接

~~~bash
date --iso-8601=seconds
curl -sS -o /dev/null -w 'code=%{http_code} time=%{time_total}\n' https://api.example.com/health
systemctl show -p ActiveState -p MainPID api.service
vmstat 1 3
~~~

| 交接字段 | 示例内容 |
| --- | --- |
| 影响 | 哪些请求、主机、时间段受影响 |
| 证据 | 命令、时间、关键输出和日志行 |
| 假设 | 已证实、被否定、待验证 |
| 动作 | 谁在何时做了什么，是否可回滚 |
| 结果 | 延迟、错误率、资源和服务状态是否恢复 |
| 后续 | 监控、容量、限流、代码或配置改进 |

## 面试复述

{% note primary flat %}
用“现象 → 分层假设 → 最小验证 → 证据排除 → 可回滚动作 → 复测”六句复述。不要罗列几十条命令；每条命令都要说明它排除哪个假设。
{% endnote %}

{% flashcard basic id:linux-a13-incident-order deck:"Linux" priority:1 tags:"综合排障,证据链" %}
--- question
Linux 综合故障排查的推荐顺序是什么？
--- answer
先固定现象和时间窗，再查网络可达性、服务/进程、资源、日志和文件证据，最后做可回滚动作并复测。
--- explanation
顺序不是固定命令清单，而是从低风险、宽范围观察逐步收敛到高影响动作。
{% endflashcard %}

{% flashcard basic id:linux-a13-hypothesis deck:"Linux" priority:1 tags:"面试,假设验证" %}
--- question
为什么不能看到 CPU 高就直接重启服务？
--- answer
CPU 高可能是结果而非原因，也可能来自别的进程、I/O 等待或短暂尖峰；应先用采样和日志验证。
--- explanation
重启会改变现场并丢失时序，先保留证据、评估影响和回滚，再选择最小动作。
{% endflashcard %}

{% flashcard basic id:linux-a13-handoff deck:"Linux" priority:2 tags:"交接,复盘" %}
--- question
一份可复用的 Linux 故障交接至少包含什么？
--- answer
影响范围、时间窗、命令与关键输出、已证实/排除的假设、变更动作、复测结果和后续计划。
--- explanation
把观察、推断和行动分开，接手者才能复核并继续定位。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link systemd journalctl Manual, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html, https://www.freedesktop.org/favicon.ico %}
{% link curl Documentation, https://curl.se/docs/, https://curl.se/favicon.ico %}
{% link Linux procps Manual, https://man7.org/linux/man-pages/man1/top.1.html, https://man7.org/favicon.ico %}
{% link Linux performance tools, https://docs.kernel.org/tools/index.html, https://docs.kernel.org/favicon.ico %}
{% endlinkgroup %}

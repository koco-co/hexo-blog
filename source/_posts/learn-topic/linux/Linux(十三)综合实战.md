---
title: Linux(十三)综合实战
tags:
  - Linux
  - 综合实战
categories:
  - Learn Topic
  - Linux
description: 把网络、服务、进程、资源与日志证据组织成可回滚、可复测的 Linux 故障处置过程。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 13
published: true
abbrlink: c0dffe07
date: 2026-03-22 00:00:00
---

{% course_series %}

{% note info flat %}
本篇演练的是“健康检查变慢或报错”的值班处置方法，不是对任意服务执行的一串命令。先固定影响、时间窗和授权边界，再让网络、服务、进程、资源和日志相互验证；只有证据已保存、变更被批准且有回滚时，才执行 reload 或其他动作。
{% endnote %}

## 事件边界

{% mermaid %}
flowchart TD
  A[现象、影响和时间窗] --> B[网络与请求证据]
  A --> C[服务与进程证据]
  A --> D[资源与容量证据]
  B --> E[日志时间线]
  C --> E
  D --> E
  E --> F[最小可回滚动作]
  F --> G[同条件复测与交接]
{% endmermaid %}

### 现象记录

~~~bash
date --iso-8601=seconds
uname -a
cat /etc/os-release
printf 'host=%s\n' "$HOSTNAME"
~~~

{% note primary flat %}
先记录请求延迟、错误率、受影响的调用方与主机、开始时间和最近变更。把“CPU 高导致慢”标为待验证假设，而不是初始事实；每次采样都应附上时间、执行者、目标和输出摘要。
{% endnote %}

### 授权输入

~~~bash
SERVICE=
HEALTH_URL=
PROCESS_PATTERN=
DATA_DIR=
LOG_WINDOW='15 minutes ago'

for value in SERVICE HEALTH_URL PROCESS_PATTERN DATA_DIR; do
  case "$value" in
    SERVICE) current=$SERVICE ;;
    HEALTH_URL) current=$HEALTH_URL ;;
    PROCESS_PATTERN) current=$PROCESS_PATTERN ;;
    DATA_DIR) current=$DATA_DIR ;;
  esac
  if test -z "$current"; then
    printf 'set %s only after scope approval\n' "$value" >&2
  fi
done
~~~

{% note danger flat %}
这些变量只能填入已经获批准的服务、URL、进程模式和数据目录。模板用固定 case 读取变量值，避免把用户输入或工单文本交给 Shell 重新解析；实际自动化可再改为经过校验的配置文件。空值不是失败，它是在阻止未经确认的目标被查询或变更。
{% endnote %}

## 网络证据

~~~bash
case "$HEALTH_URL" in
  http://*|https://*)
    curl --disable --globoff --proto '=http,https' --disallow-username-in-url \
      -fsS --connect-timeout 3 --max-time 5 -o /dev/null \
      -w 'code=%{http_code} time=%{time_total}\n' "$HEALTH_URL"
    ;;
  '')
    printf '%s\n' 'skip request: HEALTH_URL is not approved' >&2
    ;;
  *)
    printf '%s\n' 'skip request: HEALTH_URL must be an approved http(s) URL' >&2
    ;;
esac
~~~

{% note primary flat %}
curl 的状态码和总耗时回答“请求是否到达应用并得到响应”；它不自动跳过 TLS 证书校验。示例只接受带 http:// 或 https:// 的已批准 URL，并以首参数 --disable 忽略本机 curlrc、用 --globoff 关闭 URL 展开、用 --proto 限制协议，也拒绝 URL 中的用户名。若需要解释握手或代理差异，另起一次受控的详细采样并先脱敏；不要用 -k 把证书失败伪装成健康检查成功。
{% endnote %}

| 观察 | 下一步假设 | 低风险验证 |
| --- | --- | --- |
| DNS 正常但请求超时 | 路由、端口、TLS、代理或服务监听 | 复核路由、Socket 状态、目标证书与超时阶段 |
| 返回 5xx | 网络已到达应用层 | 转向服务、进程、资源和应用日志 |
| 连接被拒绝 | 监听、负载均衡或策略异常 | 复核服务状态、监听端口和变更记录 |
| 间歇变慢 | 资源、下游或重试放大 | 对齐多次请求、进程采样和日志时间线 |

{% note warning flat %}
必要时可用第八篇的方法在获授权范围内抓取少量、过滤过的报文。不要把 Cookie、Authorization、内部地址或完整请求头直接放入工单；请求成功也只能说明该次、该路径、该调用条件下成功。
{% endnote %}

## 服务与进程

~~~bash
if test -n "$SERVICE"; then
  systemctl status "$SERVICE" --no-pager
  systemctl show -p ActiveState -p SubState -p MainPID "$SERVICE"
else
  printf '%s\n' 'skip service query: SERVICE is not approved' >&2
fi

if test -n "$PROCESS_PATTERN"; then
  pgrep -a -f "$PROCESS_PATTERN"
else
  printf '%s\n' 'skip process search: PROCESS_PATTERN is not approved' >&2
fi
~~~

~~~bash
TARGET_PID=
if test -n "$TARGET_PID"; then
  ps -o pid,ppid,stat,etime,%cpu,%mem,cmd -p "$TARGET_PID"
  lsof -p "$TARGET_PID"
else
  printf '%s\n' 'set TARGET_PID only after MainPID or pgrep evidence is verified' >&2
fi
~~~

{% note primary flat %}
systemctl 给出 unit 与 MainPID，ps 给出进程状态和资源快照，lsof 说明打开的文件和 Socket。三类证据一致后，才能把“服务故障”缩小到某个进程；PID 变化、重启、容器边界和 lsof 的敏感输出都要求重新采样与脱敏。
{% endnote %}

## 资源证据

~~~bash
uptime
free -h
vmstat 1 5
iostat -xz 1 3
pidstat -u -d 1 3
df -h

if test -n "$DATA_DIR"; then
  du -sh "$DATA_DIR"
else
  printf '%s\n' 'skip directory size: DATA_DIR is not approved' >&2
fi
~~~

{% note warning flat %}
把 CPU、内存、I/O 和容量放进同一时间窗，区分瓶颈与伴随现象：高 load 可能来自 I/O，缓存不是泄漏，df 满也不一定由某个目录造成。需要深挖时才限时使用 perf、strace 或 pmap，并把采样开销本身记录下来。
{% endnote %}

## 日志时间线

~~~bash
if test -n "$SERVICE"; then
  journalctl --unit "$SERVICE" --since "$LOG_WINDOW" --until now --no-pager
  journalctl --dmesg --since "$LOG_WINDOW" --no-pager
else
  printf '%s\n' 'skip Journal query: SERVICE is not approved' >&2
fi
~~~

{% note info flat %}
把请求开始、服务错误、资源异常、重试和恢复标在同一条时间线上，并让至少两类来源互相印证。空日志可能来自筛选、轮转、时钟偏移、权限或采集缺口；应把这些盲区写进结论，而不是默认为没有异常。
{% endnote %}

## 可回滚动作

### 先验证后改变

~~~bash
(
APPLY=0

if test "$APPLY" = 1 && test -n "$SERVICE" && test -n "$HEALTH_URL"; then
  case "$HEALTH_URL" in
    http://*|https://*)
      if sudo -n systemctl reload "$SERVICE"; then
        if systemctl is-active "$SERVICE"; then
          if curl --disable --globoff --proto '=http,https' --disallow-username-in-url \
            -fsS --connect-timeout 3 --max-time 5 -o /dev/null \
            -w 'code=%{http_code} time=%{time_total}\n' "$HEALTH_URL"; then
            printf '%s\n' 'reload and same-condition probe succeeded'
          else
            status=$?
            printf 'post-reload health probe failed: status=%s\n' "$status" >&2
            exit "$status"
          fi
        else
          status=$?
          printf 'service is not active after reload: status=%s\n' "$status" >&2
          exit "$status"
        fi
      else
        status=$?
        printf 'reload failed: status=%s\n' "$status" >&2
        exit "$status"
      fi
      ;;
    *)
      printf '%s\n' 'no change made: HEALTH_URL must be an approved http(s) URL' >&2
      exit 2
      ;;
  esac
else
  printf '%s\n' 'no change made: keep APPLY=0 until evidence, approval and rollback are ready'
fi
)
~~~

{% note success flat %}
reload 只在服务支持、影响可接受且回滚已准备好时执行；sudo -n 不会在自动化中悄悄等待口令。reload、is-active 或同条件探针任一失败都会停止后续动作并返回原状态，保留状态、日志和采样后再评估 restart；每次只做一个动作，不能用连续重启掩盖现场。外层子 Shell 让失败退出不影响读者当前终端。
{% endnote %}

### 复测与交接

| 交接字段 | 必须包含的内容 |
| --- | --- |
| 影响 | 请求、主机或容器、时间段、用户影响与严重度 |
| 证据 | 命令、时间、目标、关键输出和日志位置 |
| 假设 | 已证实、已排除与仍待验证的推断 |
| 动作 | 授权人、执行者、变更、回滚与退出状态 |
| 结果 | 延迟、错误率、资源、服务状态和复测条件 |
| 后续 | 监控、容量、限流、代码、配置或复盘事项 |

{% note info flat %}
复测要使用同一个 HEALTH_URL、相同超时、相同时间窗和相似负载条件。交接中严格区分“看到什么”“据此推断什么”“做了什么”；下一位值班者才能复核结论并安全继续。
{% endnote %}

## 面试复述

{% note primary flat %}
用六句话说明一次排障：现象与范围 → 分层假设 → 最小验证 → 证据排除 → 可回滚动作 → 同条件复测。不要罗列几十条命令；每条命令都要能回答“它排除了哪个假设、输出会如何改变下一步”。
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

{% flashcard basic id:linux-a13-apply-gate deck:"Linux" priority:2 tags:"变更,回滚" %}
--- question
为什么综合排障模板把 APPLY 默认设为 0？
--- answer
它避免在未保存证据、未获授权或没有回滚方案时对服务做真实变更。
--- explanation
只有目标、影响、批准、回滚和复测条件完整后，才把 APPLY 改为 1 并一次只执行一个动作。
{% endflashcard %}

## 参考资料

### 服务与请求

{% linkgroup %}
{% link systemctl(1) Manual, https://www.freedesktop.org/software/systemd/man/latest/systemctl.html, https://www.freedesktop.org/favicon.ico %}
{% link systemd journalctl Manual, https://www.freedesktop.org/software/systemd/man/latest/journalctl.html, https://www.freedesktop.org/favicon.ico %}
{% link curl man page, https://curl.se/docs/manpage.html, https://curl.se/favicon.ico %}
{% endlinkgroup %}

### 进程与资源

{% linkgroup %}
{% link lsof(8) Manual, https://man7.org/linux/man-pages/man8/lsof.8.html, https://man7.org/favicon.ico %}
{% link iostat(1) Manual, https://man7.org/linux/man-pages/man1/iostat.1.html, https://man7.org/favicon.ico %}
{% link pidstat(1) Manual, https://man7.org/linux/man-pages/man1/pidstat.1.html, https://man7.org/favicon.ico %}
{% link Linux performance tools, https://docs.kernel.org/tools/index.html, https://docs.kernel.org/favicon.ico %}
{% endlinkgroup %}

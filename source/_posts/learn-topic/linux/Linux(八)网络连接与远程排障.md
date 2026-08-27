---
title: Linux(八)网络连接与远程排障
tags:
  - Linux
  - 网络排障
categories:
  - Learn Topic
  - Linux
description: 按接口、路由、DNS、Socket、应用请求与抓包证据逐层定位网络和远程连接故障。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 8
published: true
abbrlink: 3a757ef9
date: 2026-03-17 00:00:00
---

{% course_series %}

{% note info flat %}
“网络不通”必须拆层验证：链路和地址、路由、DNS、端口、TLS、应用请求与抓包。本文从本机状态开始逐层缩小范围；ping 成功不能证明 HTTPS 正常，抓包内容也不能当作可公开的日志。
{% endnote %}

## 排障分层

{% mermaid %}
flowchart TD
  A[网卡与地址] --> B[路由与邻居]
  B --> C[DNS 解析]
  C --> D[TCP/UDP Socket]
  D --> E[TLS 与应用请求]
  E --> F[抓包确认]
{% endmermaid %}

{% note primary flat %}
每层都有独立成功标准：ip 说明本机状态，tracepath 或 traceroute 说明路径，dig 说明 DNS，ss 或 nc 说明端口，curl 说明应用协议，tcpdump 留下受限报文证据。先记录上一层已知事实，避免跳过路由或 DNS 直接猜应用故障。
{% endnote %}

## 接口与路由

~~~bash
ip link
ip addr
ip route
ip neigh
bridge link
~~~

{% note primary flat %}
ip link 看接口状态和 MTU，ip addr 看 IPv4/IPv6 与前缀，ip route 看 default 与下一跳，ip neigh 看二层邻居。bridge link 只在桥接或虚拟化网络中补充桥成员信息；没有 bridge 并不代表普通主机网络异常。
{% endnote %}

## 路径与可达性

~~~bash
TARGET=example.com
ping -c 2 "$TARGET"
timeout 12s tracepath -m 8 "$TARGET"
traceroute -m 8 -q 1 -w 2 "$TARGET"
~~~

{% note warning flat %}
ping 验证 ICMP 可达，可能被限速或防火墙丢弃；tracepath 与 traceroute 的中间跳也可能隐藏。tracepath 只提供最大跳数，所以用 timeout 再限制总时长；traceroute 的 -m、-q、-w 分别限制跳数、每跳探测数和单次等待。timeout 返回 124 只表示采样窗口结束，不是“路径不通”的结论。把“无 ICMP 回应”和“TCP/HTTPS 应用失败”分开记录，不能用一次 ping 的结果覆盖全部网络层。
{% endnote %}

## DNS 解析

~~~bash
TARGET=example.com
dig +time=2 +tries=1 A "$TARGET"
dig +time=2 +tries=1 AAAA "$TARGET"
~~~

{% note primary flat %}
dig 适合记录查询类型、服务器、TTL 与响应状态。无记录、解析超时、返回错误地址、缓存差异和应用绕过系统解析器是不同故障；先保存回答了哪个问题，再继续检查端口。
{% endnote %}

## Socket 与端口

~~~bash
TARGET=example.com
PORT=443

ss -lntup
ss -ntp
nc -vz -w 3 "$TARGET" "$PORT"
~~~

{% note primary flat %}
ss 是内核 Socket 快照：监听与已连接状态回答不同问题；nc 只验证基础连接建立或监听，不证明 TLS、认证和应用健康。ss 的 PID、用户名与内网地址可能敏感，分享前先删减。
{% endnote %}

## 请求与远程操作

### HTTP/HTTPS

~~~bash
TARGET=https://example.com
curl -fsSI --max-time 5 "$TARGET"
curl -v --max-time 5 "$TARGET"
~~~

{% note warning flat %}
curl -I 或 -fsSI 适合快速看状态和响应头；-v 会显示握手和请求细节，可能含 Cookie、Authorization 或内部地址，收集证据前必须脱敏。wget 的 spider 模式可用于同类只取元数据检查，但不要把两个客户端的成功当作完全相同的代理或 TLS 行为。
{% endnote %}

### SSH 与同步

~~~bash
SSH_TARGET=approved-host
ssh -G "$SSH_TARGET"
ssh -o BatchMode=yes -o ConnectTimeout=5 "$SSH_TARGET" true

LOCAL_DIR=./report
rsync -av --dry-run \
  -e 'ssh -o BatchMode=yes -o ConnectTimeout=5' \
  "$LOCAL_DIR/" "$SSH_TARGET:/srv/report/"
~~~

{% note primary flat %}
先用 ssh -G 读取最终配置，再对已经获准的主机做非交互连接；BatchMode=yes 能把“等待密码”变成明确的认证失败。rsync 的 dry-run 只预览将同步的路径，仍会连接远端，所以它也必须通过 -e 继承 BatchMode 与 5 秒连接上限；确认源、目标、符号链接和删除语义后才允许真实写入。
{% endnote %}

{% note danger flat %}
ssh-keyscan 只能收集主机公钥，不能证明它可信；首次连接和密钥变更要通过独立可信渠道核对指纹。创建密钥、启动 agent、添加私钥、scp 写远端文件都不是排障试验：私钥、agent socket、Cookie 与详细调试输出不得公开。
{% endnote %}

## 抓包证据

~~~bash
TARGET=203.0.113.10  # 文档测试地址；真实目标必须已经获批
PORT=443
INTERFACE=lo         # 实验机先用 lo；真实抓包改为获批的单一接口

timeout 15s sudo -n tcpdump -ni "$INTERFACE" -c 20 "host $TARGET and port $PORT"
~~~

{% note warning flat %}
只在已获授权的主机、接口和流量范围内抓包。默认的 lo 与文档测试地址只用于验证语法、权限或超时分支，不会产生真实网络样本；需要正例时，才把两者同时替换为获批的接口和目标。上例限制为单一接口、主机、端口、20 个匹配包与 15 秒；若 timeout 结束，只能说明窗口内未收足样本，不能推出“没有流量”。sudo -n 避免等待密码，权限不足时应申请受控授权而不是去掉限制。报文会暴露地址、主机名、协议元数据甚至未加密内容；TLS 正文通常不能直接从抓包中读取，应和应用日志、curl 输出交叉验证。
{% endnote %}

## 迁移边界

{% note info flat %}
ifconfig、route 与 netstat 是常见旧入口。现代 Linux 优先按问题拆成 ip 与 ss：接口、地址、路由和 Socket 分别读取；旧输出中的列、协议和统计范围并不总能一一对应，迁移后要重新确认你要证明的字段。
{% endnote %}

| 旧入口 | 当前选择 | 验证与不等价边界 |
| --- | --- | --- |
| ifconfig | ip link、ip addr | 分别核对接口状态/MTU 与 IPv4/IPv6 前缀；不要按旧输出的列顺序机械比对 |
| route | ip route | 用 default、下一跳和前缀判断路径；策略路由、多表和 IPv6 需要额外指定查询条件 |
| netstat | ss；路由仍用 ip route | ss 适合监听或已连接 Socket，但不替代 netstat 的每一种统计或路由报告；先选定你要看的对象 |

## 低频入口

{% folding blue, 远程工具的选择边界 %}
| 工具 | 中文用途 | 选择与排除边界 |
| --- | --- | --- |
| bridge | 查看 Linux bridge 与端口成员 | 普通单网卡主机没有 bridge 是正常情况 |
| host、nslookup | 快速或兼容性 DNS 查询 | 需要完整证据优先 dig，三者结果差异要记录查询器与服务器 |
| wget | 只取元数据或下载文件 | HTTP 调试细节优先 curl；下载会写入本地文件 |
| scp | 简单的单次 SSH 文件复制 | 无 dry-run；大目录或增量同步优先 rsync 并先预览 |
| ssh-keygen、ssh-agent、ssh-add | 创建与管理 SSH 密钥、agent | 属于凭据生命周期，不在陌生主机或日志中试验 |
| ssh-keyscan | 收集远端公开主机密钥 | 它不完成可信校验，必须另行核对指纹 |
{% endfolding %}

## 结果验证

~~~bash
TARGET=example.com
PORT=443

ip route
dig +time=2 +tries=1 A "$TARGET"
nc -vz -w 3 "$TARGET" "$PORT"
curl -fsSI --max-time 5 "https://$TARGET"
~~~

{% note success flat %}
一份合格网络报告包含目标、源地址、命令、时间、层级、输出摘要和下一步，而不是一句“网络不通”。同一目标至少用一个被动观察和一个主动请求交叉验证；某层失败时，把结论限制在该层，不要跳到“整个网络坏了”。
{% endnote %}

## 常见问题

{% flashcard basic id:linux-a8-ping-curl deck:"Linux" priority:1 tags:"网络分层,HTTP" %}
--- question
ping 成功能否证明 HTTPS 正常？
--- answer
不能。ping 验证 ICMP 可达，HTTPS 还需要 DNS、TCP、TLS、代理和应用层响应。
--- explanation
把一次 HTTPS 请求拆成可观察的层：

```bash
ip route get 203.0.113.10       # 路由与出口接口
dig +short example.com          # DNS 结果
ss -tn '( dport = :443 )'       # TCP 连接状态
curl --verbose --fail-with-body https://example.com/  # TLS 与 HTTP
```

`ping` 只证明 ICMP 回显路径可用；DNS、TCP 端口、TLS 证书/代理以及应用响应仍可能失败。每层的成功只能缩小范围，不能直接升级成“HTTPS 端到端健康”。
{% endflashcard %}

{% flashcard basic id:linux-a8-dns-tools deck:"Linux" priority:1 tags:"DNS,dig" %}
--- question
dig、host 和 nslookup 如何选择？
--- answer
dig 适合详细记录与调试，host 适合快速查询，nslookup 主要用于兼容性排查。
--- explanation
三者的定位粒度不同：

| 工具 | 更适合 | 记录什么 |
| --- | --- | --- |
| `dig` | 详细调试与工单证据 | 查询类型、服务器、TTL、状态和权威段 |
| `host` | 快速确认地址 | 名称与简短结果 |
| `nslookup` | 兼容旧环境 | 交互式查询和基本响应 |

应用可能绕过系统解析，使用缓存、DoH 或自带 resolver。记录工具、服务器和时间点，才能把“DNS 服务器返回 NXDOMAIN”与“应用仍在使用旧缓存”区分开。
{% endflashcard %}

{% flashcard basic id:linux-a8-ssh-keyscan deck:"Linux" priority:2 tags:"SSH,主机密钥" %}
--- question
ssh-keyscan 能证明远端主机可信么？
--- answer
不能，它只收集公钥；可信性需要和独立可信渠道的指纹比对。
--- explanation
`ssh-keyscan` 的输出是“服务器声称的公钥”，不是信任结论：

```bash
ssh-keyscan -t ed25519 example.com > hostkeys.new
ssh-keygen -lf hostkeys.new
```

将指纹与独立渠道（主机管理平台、已批准的交接记录或管理员确认）比对后，才可写入 `known_hosts`。首次连接和密钥变更都要重新核对；私钥、agent socket 和完整 SSH 配置不应贴进排障日志。
{% endflashcard %}

{% flashcard basic id:linux-a8-rsync-scp deck:"Linux" priority:2 tags:"传输,rsync" %}
--- question
scp 和 rsync 的主要选择边界是什么？
--- answer
scp 适合简单复制，rsync 适合增量同步、dry-run 和大目录；两者都需确认远端路径与权限。
--- explanation
选择同步方式时先明确“复制一次”还是“让目标镜像源”：

```bash
scp report.csv user@example.com:incoming/
rsync -avhn --delete ./build/ user@example.com:incoming/build/
```

`scp` 适合小规模单次复制；`rsync` 能按差异传输并用 `--dry-run` 预览，但 `--delete` 会删除目标中源端不存在的文件。先核对源、目标、用户和排除规则，再去掉 `-n`，并保存预览结果。
{% endflashcard %}

{% flashcard basic id:linux-a8-legacy-network deck:"Linux" priority:1 tags:"网络,命令迁移" %}
--- question
现代 Linux 排障时，ifconfig、route、netstat 应分别迁移到什么命令？
--- answer
接口和地址用 ip link、ip addr；路由用 ip route；Socket 用 ss。
--- explanation
迁移时按问题选择字段，而不是机械替换命令名：

| 旧入口 | 现代入口 | 先确认的对象 |
| --- | --- | --- |
| `ifconfig` | `ip link` / `ip addr` | 接口状态、地址和前缀 |
| `route` | `ip route` | 默认路由与下一跳 |
| `netstat` | `ss` | 监听、已连接 Socket 和进程 |

例如只查监听端口用 `ss -ltnp`，要判断到某地址的出口则用 `ip route get <地址>`。同一工具的输出字段和权限也会随发行版变化，报告中写明目标问题和命令选项。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link iproute2 Documentation, https://man7.org/linux/man-pages/man8/ip.8.html, https://man7.org/favicon.ico %}
{% link OpenSSH Manual Pages, https://www.openssh.com/manual.html, https://www.openssh.com/favicon.ico %}
{% link curl Documentation, https://curl.se/docs/, https://curl.se/favicon.ico %}
{% link tcpdump Manual, https://www.tcpdump.org/manpages/tcpdump.1.html, https://www.tcpdump.org/favicon.ico %}
{% endlinkgroup %}

---
title: "计算机网络(四)UDP 与 TCP"
tags:
  - "计算机网络"
  - "TCP"
  - "UDP"
categories:
  - "Learn Topic"
  - "计算机网络"
description: "从传输层端点和首部字段出发，逐包理解 UDP、TCP 三次握手、序列确认、重传、拥塞控制、连接关闭、TIME_WAIT 与抓包证据。"
cover: /img/picgo-images/computer-network-course-cover.png
series: "计算机网络"
series_order: 4
published: true
abbrlink: ec8f5dd0
date: 2026-03-04 00:00:00
---

{% course_series %}

{% note warning flat %}
本文从传输层端点开始，比较 UDP 的数据报语义和 TCP 的可靠字节流；随后用序列号、确认号、状态和计时器解释三次握手、重传、拥塞控制、关闭与 TIME-WAIT。每个结论都回到抓包字段和系统状态。
{% endnote %}

## UDP 与 TCP

### 传输层解决什么问题

{% note info flat %}
IP 负责把数据报送到主机，传输层还要把数据交给哪个进程。一个传输端点至少由 IP 地址和端口组成；一条 TCP 连接通常由客户端 IP、客户端端口、服务端 IP、服务端端口共同标识。端口号是传输层多路复用的入口，不是“某台机器的应用编号”这种永久绑定关系。
{% endnote %}

| 观察对象 | UDP | TCP |
| --- | --- | --- |
| 数据边界 | 保留一个个数据报边界 | 把字节组织成有序字节流，不保留应用消息边界 |
| 建立连接 | 不需要握手 | 通常先建立连接状态 |
| 可靠性 | 不负责重传、排序和拥塞控制 | 通过序列号、确认、重传和拥塞控制提供可靠字节流 |
| 流量控制 | 应用或协议自己实现 | 接收窗口控制发送方不要压垮接收缓存 |
| 适用例子 | DNS 查询、实时媒体、应用自定义可靠传输 | HTTP/1.1、HTTP/2、数据库连接、文件传输 |
| 失败语义 | 可能超时、丢包或收到 ICMP 错误 | 可能超时、收到 RST、FIN 或连接状态异常 |

{% note warning flat %}
“UDP 更快、TCP 更慢”不是可复用的结论。UDP 少了连接和可靠性机制，但应用如果需要可靠、有序、拥塞友好的传输，仍然必须补上这些机制；TCP 的耗时也取决于 RTT、拥塞窗口、服务端处理和路径丢包。
{% endnote %}

### UDP 首部和语义

{% note warning flat %}
UDP 首部固定为 8 字节，包含源端口、目的端口、长度和校验和。长度字段覆盖 UDP 首部和数据；校验和用于检测传输中的错误。它没有序列号、确认号、窗口或连接状态，因此“发出”不等于“对端应用已经收到并处理”。
{% endnote %}

一个 UDP 请求的可观察链路可以抽象为：

{% mermaid %}
sequenceDiagram
    participant AppA as 客户端应用
    participant UDP_A as 客户端 UDP
    participant IP as IP 路径
    participant UDP_B as 服务端 UDP
    participant AppB as 服务端应用
    AppA->>UDP_A: 交付一个数据报
    UDP_A->>IP: 源端口 + 目的端口 + 数据
    IP-->>UDP_B: 尽力交付
    UDP_B->>AppB: 按数据报边界交付
    Note over IP,UDP_B: 丢失、重复、乱序或端口不可达均可能发生
{% endmermaid %}

{% note warning flat %}
UDP 适合把控制权交给上层的场景，但应用要明确回答四件事：如何识别重复、如何排序、如何超时、如何限制发送速率。QUIC 就是在 UDP 之上实现了连接、可靠流、加密和拥塞控制；因此不能把“使用 UDP”误读成“天然不可靠且一定没有连接”。
{% endnote %}

### TCP 首部

{% note warning flat %}
TCP 首部的常用字段如下。选项会使首部长度大于最小的 20 字节，因此抓包时不能把数据偏移固定理解为 20。
{% endnote %}

| 字段 | 作用 | 面试中要避免的误读 |
| --- | --- | --- |
| 源端口、目的端口 | 标识两端应用端点 | 端口不能单独标识一条连接 |
| 序列号 | 标识本报文段中第一个字节的序号；SYN/FIN 也占一个序号空间 | 不是“第几个包” |
| 确认号 | 表示下一个期望收到的序号，通常是累计确认 | 不是对某个包的简单回执 |
| 数据偏移 | 指出 TCP 首部长度 | 有选项时首部不止 20 字节 |
| 标志位 | SYN、ACK、FIN、RST、PSH、URG 等控制语义 | SYN 和 FIN 会消耗一个序号，普通 ACK 不消耗 |
| 窗口 | 接收方当前愿意接收的序号空间，受窗口扩大选项影响 | 不是拥塞窗口 `cwnd` |
| 校验和 | 检测 TCP 段和伪首部等传输错误 | 校验通过不代表应用处理成功 |
| 选项 | MSS、窗口扩大、SACK、时间戳等协商或反馈 | 选项是否存在要看具体抓包 |

## 连接模型

### 序列与确认

{% note info flat %}
假设客户端的初始序列号 ISN 是 1000，服务端的 ISN 是 5000。SYN 本身不携带应用数据，但在序列空间中占用一个位置，因此三次握手可以写成：
{% endnote %}

{% mermaid %}
sequenceDiagram
    participant C as 客户端
    participant S as 服务端
    C->>S: SYN seq=1000
    Note over C,S: SYN 消耗序号 1000
    S->>C: SYN,ACK seq=5000 ack=1001
    Note over C,S: ACK 表示下一个期望的客户端序号
    C->>S: ACK seq=1001 ack=5001
    Note over C,S: 双方都确认对方 ISN，连接进入 ESTABLISHED
{% endmermaid %}

{% note info flat %}
如果客户端随后发送 200 字节数据，数据段是 `seq=1001`，覆盖 1001～1200，服务端累计确认会返回 `ack=1201`。这个规则解释了：
{% endnote %}

- 确认号是“下一个期待的字节”，不是“已经收到的最后字节”；
- 一个 TCP 段可能携带数据，也可能只携带控制标志；
- 丢失中间数据时，接收方可能重复发送同一个累计 ACK；
- SYN 和 FIN 虽然没有普通应用数据，也各自占一个序号。

### TCP 状态机

把状态理解为“本端已经承诺了什么、下一步允许什么”，比背状态名称更稳：

{% mermaid %}
flowchart TD
    CLOSED[CLOSED]
    LISTEN[LISTEN]
    SYN_SENT[SYN-SENT]
    SYN_RCVD[SYN-RECEIVED]
    EST[ESTABLISHED]
    FIN_WAIT_1[FIN-WAIT-1]
    FIN_WAIT_2[FIN-WAIT-2]
    CLOSE_WAIT[CLOSE-WAIT]
    LAST_ACK[LAST-ACK]
    CLOSING[CLOSING]
    TIME_WAIT[TIME-WAIT]
    CLOSED -->|被动打开| LISTEN
    CLOSED -->|主动 connect| SYN_SENT
    LISTEN -->|收到 SYN| SYN_RCVD
    SYN_SENT -->|收到 SYN-ACK| EST
    SYN_RCVD -->|收到 ACK| EST
    EST -->|本端 close，发送 FIN| FIN_WAIT_1
    FIN_WAIT_1 -->|收到 ACK| FIN_WAIT_2
    FIN_WAIT_1 -->|先收到 FIN| CLOSING
    FIN_WAIT_2 -->|收到 FIN| TIME_WAIT
    EST -->|收到对端 FIN| CLOSE_WAIT
    CLOSE_WAIT -->|应用 close，发送 FIN| LAST_ACK
    LAST_ACK -->|收到 ACK| CLOSED
    CLOSING -->|收到 ACK| TIME_WAIT
    TIME_WAIT -->|等待旧报文消失| CLOSED
{% endmermaid %}

{% note info flat %}
同一条连接的两端状态不一定相同。例如服务端收到客户端 FIN 后进入 CLOSE-WAIT，但如果服务端应用迟迟不关闭，它可以一直保持这个状态；这不是 TCP 自动“卡死”，而是应用还没有完成自己的关闭动作。
{% endnote %}

### 窗口控制

{% note warning flat %}
TCP 发送方同时受到两个方向的约束：接收方通过 `rwnd` 表示缓存还可以接收多少，发送方根据网络拥塞估计维护 `cwnd`。实际允许在途的数据量大致受 `min(rwnd, cwnd)` 约束。窗口缩小、零窗口、应用读取缓慢和网络拥塞的表象都可能是“发送变慢”，但证据不同。
{% endnote %}

| 现象 | 更可能的控制量 | 先看什么 |
| --- | --- | --- |
| 接收应用读得慢，发送端出现零窗口 | `rwnd` | 抓包中的 Window、Window Update、接收进程读速率 |
| 路径丢包，发送速率下降并逐步恢复 | `cwnd` | 重传、重复 ACK、拥塞窗口和 RTT |
| 单个大报文在某段路径上无法通过 | MTU/MSS/PMTUD | IP 分片、ICMP Packet Too Big、MSS 协商 |

## 三次握手

### 握手目的

{% note info flat %}
三次握手不是为了“礼貌地说三次你好”，而是让双方完成两个方向的初始序列号确认，并让服务端知道客户端能收到它的回复。两次只能让一方确认自己的请求到达并看到对方的 ISN，不能完整确认双向可达和双方的序列空间。
{% endnote %}

正常握手的证据表：

| 次序 | 方向 | 关键字段 | 状态变化 | 证明了什么 |
| --- | --- | --- | --- | --- |
| 1 | 客户端 → 服务端 | SYN，seq=C_ISN | 客户端进入 SYN-SENT | 客户端开始一次连接尝试 |
| 2 | 服务端 → 客户端 | SYN+ACK，seq=S_ISN，ack=C_ISN+1 | 服务端进入 SYN-RECEIVED | 服务端收到 SYN，并把自己的 ISN 发回 |
| 3 | 客户端 → 服务端 | ACK，ack=S_ISN+1 | 双方进入 ESTABLISHED | 客户端确认服务端 ISN，服务端可交付连接 |

### 握手失败

{% note warning flat %}
同一个 SYN 被重复看到，不能直接断言“服务端挂了”。至少要区分三类路径：
{% endnote %}

| 抓包/客户端表现 | 常见解释 | 下一步证据 |
| --- | --- | --- |
| SYN 发出后没有响应，按退避间隔重发 | 路径丢包、防火墙静默丢弃、服务端不可达 | 客户端路由、服务端入口、ACL、同路径抓包 |
| 收到 SYN-ACK 后第三个 ACK 发不出去或服务端收不到 | 回程路径或状态设备问题 | 两端同时抓包、反向路由、NAT 状态 |
| 立即收到 RST | 端口没有监听、主动拒绝或中间设备重置 | 服务端 `ss -lnt`、RST 的源地址和时间 |
| 连接建立后出现重传 | 数据路径丢包、乱序或 ACK 丢失 | 序列号、重复 ACK、SACK、RTO |

{% note warning flat %}
防火墙的“静默丢弃”和主机的“RST 拒绝”不是一个现象：前者通常让客户端等待并重传，后者较快结束本次尝试。环境中的策略可能改变具体行为，不能只凭错误字符串下结论。
{% endnote %}

### 半连接队列

{% note info flat %}
服务端监听套接字收到 SYN 后，内核需要维护半连接状态；握手完成后，连接还要进入应用可接受的队列。高并发或攻击流量可能让半连接队列、已完成连接队列、文件描述符或应用 `accept` 速度成为瓶颈。`backlog` 是队列相关的请求参数，不是“服务器最多只能连接这么多”的全局容量。
{% endnote %}

排查时按这个顺序缩小范围：

1. 确认服务端确实在目标地址和端口监听：`ss -lntp`；
2. 查看握手是否停在 SYN-SENT、SYN-RECEIVED 或已完成连接队列；
3. 检查服务进程是否及时调用 `accept`，以及文件描述符和 CPU；
4. 检查入口防火墙、负载均衡和 SYN 防护策略；
5. 不把一次 `connect` 超时直接归因于 SYN Flood，必须有队列、流量或抓包证据。

## 发送控制

### RTO 与重传

{% note warning flat %}
TCP 用重传计时器处理“确认没有按预期回来”。RTO 不是固定的“三秒”，实现会根据平滑 RTT、RTT 波动和退避规则计算，并在重传时谨慎扩大等待时间。一次超时可以触发重传，但不等于整条连接一定断开。
{% endnote %}

{% note warning flat %}
可靠传输的最小闭环是：发送一段序号范围 → 等待累计 ACK 或 SACK 证据 → 发现缺口后重传 → 受限地继续发送。判断重传应看序列号和时间，不要只看抓包工具的 `TCP Retransmission` 标注，因为标注是分析器基于时间和上下文的推断。
{% endnote %}

### 拥塞恢复

{% note warning flat %}
拥塞控制的目标是探测路径容量并在出现拥塞信号时收敛。慢启动阶段 `cwnd` 可以快速增长；达到阈值或进入拥塞避免后增长趋缓；重复 ACK、显式拥塞通知和 RTO 超时可以提供拥塞/丢包信号。SACK 本身主要报告“哪些非连续区间已经收到”，不是独立的拥塞信号；它可以帮助发送方在重复 ACK 或其他恢复路径中精确定位缺口。具体算法和内核参数可能变化，面试回答应先说控制目标，再说明常见机制，不要把某个旧实现公式当成永久事实。
{% endnote %}

{% mermaid %}
flowchart LR
    START[新连接] --> SS[慢启动：快速探测]
    SS -->|达到 ssthresh| CA[拥塞避免：较缓增长]
    CA -->|重复 ACK + 缺口证据| FR[快速重传/恢复]
    SS -->|RTO 超时| BACK[降低发送节奏并退避]
    CA -->|RTO 超时| BACK
    FR --> CA
    BACK --> SS
{% endmermaid %}

### SACK 和累计确认

{% note warning flat %}
累计 ACK 只能表达“连续前缀已经收到”。例如已经收到 1～1000 和 2001～3000，但缺少 1001～2000，累计 ACK 仍可能停在 1001；SACK 选项可以附带告知后面的已收到区间，让发送方只重传缺口。SACK 能减少无谓重传，但不改变 TCP 字节流和有序交付的语义。
{% endnote %}

### 路径 MTU

{% note info flat %}
MTU 是链路能够承载的 IP 包大小；MSS 是 TCP 单个数据段的数据部分上限。MSS 通常根据接口 MTU 减去 IP/TCP 首部估算，但隧道、选项、IPv6 和路径变化会让简单的固定值失效。PMTUD 通过路径反馈发现更小的可用包大小；IPv6 路由器不在途中分片，ICMPv6 Packet Too Big 对排障尤其重要。
{% endnote %}

| 概念 | 所在边界 | 典型问题 |
| --- | --- | --- |
| MTU | 链路/IP 包 | 某条隧道使路径可用包变小 |
| MSS | TCP 数据段 | 握手协商值过大或被中间设备改写 |
| PMTUD | IP 路径发现 | ICMP 错误被过滤导致黑洞 |
| 拥塞窗口 | TCP 发送控制 | 丢包或拥塞导致吞吐下降 |

## 连接关闭

### FIN 不是“立刻断开”

{% note info flat %}
TCP 的每个方向可以独立结束。主动关闭的一方发送 FIN，表示“我不会再发送字节”，但仍可能继续接收对方数据；对端先 ACK，再在应用完成后发送自己的 FIN。常见的四段只是其中一种时序，ACK 可能和数据或 FIN 合并，双方也可能同时关闭。
{% endnote %}

{% mermaid %}
sequenceDiagram
    participant A as 主动关闭方
    participant B as 被动关闭方
    A->>B: FIN seq=a
    B->>A: ACK ack=a+1
    Note over B: B 进入 CLOSE-WAIT，应用仍可发送
    B->>A: FIN seq=b
    A->>B: ACK ack=b+1
    Note over A: 主动关闭方进入 TIME-WAIT 后等待旧报文消失
{% endmermaid %}

### 关闭信号

| 信号 | 含义 | 对未发送/未消费数据的影响 |
| --- | --- | --- |
| FIN | 有序地结束一个方向 | 已确认的数据仍按顺序交付；对端读到 EOF |
| RST | 立即拒绝、重置或放弃连接状态 | 未完成的应用数据通常以错误结束，不提供有序收尾 |
| 半关闭 | 一方已 FIN，另一方向仍可发送 | 适合请求端发送完后继续读取完整响应 |

{% note info flat %}
如果进程关闭一个仍有未读数据的连接、访问了已重置的套接字，或者对不存在的监听端口发起连接，可能看到 RST 或本地 `ECONNRESET`/`ECONNREFUSED`。具体错误要结合系统调用、对端行为和抓包方向解释。
{% endnote %}

### TIME_WAIT 为什么存在

主动关闭方进入 TIME_WAIT，核心目的不是“浪费连接”，而是确保：

- 最后的 ACK 丢失时，对方重发 FIN，主动关闭方仍能重发 ACK；
- 旧连接的延迟报文不会混入同一四元组的新连接。

{% note warning flat %}
因此 TIME_WAIT 是连接生命周期的一部分。大量短连接、客户端端口范围小、代理集中主动关闭时，TIME_WAIT 数量可能升高；不能只通过缩短等待时间来掩盖端口规划、连接复用或关闭方向的问题。
{% endnote %}

### 保活机制

{% note info flat %}
TCP keepalive 是可选的传输层探测：连接空闲一段时间后，内核可以发送探测并在多次无响应后报告对端或路径可能不可达。它通常默认关闭，具体空闲时间、探测间隔和次数由操作系统及套接字选项决定；它不能证明远端应用线程仍然健康，也不能替代业务级健康检查。
{% endnote %}

{% note warning flat %}
应用层心跳则是协议消息，例如 ping/pong、心跳请求/响应或带版本与租约的业务探测。它可以验证“请求已经到达应用并得到应用响应”，但需要定义超时、重试、幂等性和代理空闲策略。
{% endnote %}

| 机制 | 所在层 | 能证明 | 不能证明 |
| --- | --- | --- | --- |
| TCP keepalive | TCP/内核 | 某个传输路径和对端 TCP 栈在探测时有响应 | 应用可用、业务状态正确、请求会被处理 |
| 应用层心跳 | 应用协议 | 应用按约定响应了健康消息 | 所有业务请求都成功、连接没有即将过期 |
| 代理 idle timeout | 中间设备 | 设备按策略回收空闲连接 | 对端应用是否健康 |

{% note info flat %}
一个可复现的应用层心跳闭环（教学输入/输出形态，非本次执行结果）如下：
{% endnote %}

~~~text
12:00:00.000 C -> S HEARTBEAT id=42
12:00:00.012 S -> C HEARTBEAT_ACK id=42
12:00:00.012 client: heartbeat=ok rtt=12ms
12:00:03.000 C -> S HEARTBEAT id=43
12:00:04.000 client: timeout id=43; reconnect=scheduled
~~~

{% note warning flat %}
验证时应确认 ACK 的 `id` 与请求一致，超时计时器从发送时刻开始；只有 TCP keepalive 报文而没有应用层 ACK，不能把应用心跳判定为成功。
{% endnote %}

### 连接重置与重连

{% note warning flat %}
收到 RST、连接超时或 keepalive 失败后，重连不是简单地无限调用 connect。可靠客户端应先关闭旧连接和释放资源，再按指数退避加随机抖动安排下一次尝试，并设置最大重试次数、总时间预算和熔断边界。对可能重复执行的 POST、扣款或消息提交，必须使用业务幂等键、去重 ID 或确认协议，不能因为 TCP 连接断开就盲目重放。
{% endnote %}

{% note info flat %}
例如 `base=250ms`、上限 `4s` 的客户端可以记录一次带抖动的延迟序列 `[0.18s, 0.63s, 1.41s]`（仅为教学示例）。若请求是 `POST /charge`，应携带 `Idempotency-Key: order-42`；连接在提交结果未知时断开，客户端先查询订单状态或使用同一幂等键确认，再决定是否重试。日志至少应能说明：
{% endnote %}

~~~text
attempt=1 request=order-42 result=RST outcome=unknown next_delay=0.18s
status-check request=order-42 result=not-found
attempt=2 request=order-42 result=HTTP/1.1 201 outcome=committed
~~~

{% note info flat %}
这些输出是示例形态，不是本次执行结果；指数退避降低重连风暴，幂等键解决“请求是否已经被处理”的业务不确定性，二者不能互相替代。
{% endnote %}

{% mermaid %}
flowchart TD
  ERR[连接 RST/超时/心跳失败] --> CLOSE[标记旧连接失效并释放资源]
  CLOSE --> CLASSIFY{请求是否可安全重试}
  CLASSIFY -->|幂等或有幂等键| BACKOFF[指数退避 + 抖动 + 预算]
  CLASSIFY -->|不可确认是否已提交| HOLD[等待业务确认/人工或队列处理]
  BACKOFF --> RETRY[重新解析/建连/握手]
  RETRY -->|超过预算| FAIL[报告失败并保留原因]
  RETRY -->|成功| READY[恢复服务]
{% endmermaid %}

### 监听队列

{% note info flat %}
监听套接字和已建立连接套接字不是同一个对象。一个典型服务端生命周期是：创建 socket → bind 地址/端口 → listen 进入被动监听 → 内核完成握手并排队 → accept 取出一个已建立连接 → 返回新的连接套接字；监听套接字继续接收后续连接。
{% endnote %}

{% mermaid %}
flowchart LR
  SOCKET[socket + bind] --> LISTEN[listen：监听套接字]
  LISTEN --> SYNQ[半连接/握手状态]
  SYNQ --> ACCEPTQ[已完成连接队列]
  ACCEPTQ --> ACCEPT[accept]
  ACCEPT --> CONN[新的已建立连接套接字]
  LISTEN --> MORE[继续监听更多客户端]
{% endmermaid %}

{% note info flat %}
`backlog` 影响内核为连接请求提供的排队语义，但实际容量还受内核参数、半连接保护、文件描述符、进程调用 accept 的速度和应用线程池影响。可以用以下只读状态对照队列和监听：
{% endnote %}

~~~bash
ss -lntp
ss -nt state syn-recv
ss -nt state established
lsof -nP -iTCP:443 -sTCP:LISTEN
~~~

{% note info flat %}
看到 LISTEN 只证明有监听套接字；看到 SYN-RECV 说明握手仍未完成；看到 ESTAB 只证明 TCP 已建立。要判断 backlog 是否成为瓶颈，还需对照队列长度、accept 延迟、文件描述符和服务日志。
{% endnote %}

## 证据化回答

### 抓包实验

{% note danger flat %}
下面命令只读取本机网络状态或连接公共示例站点，不写入系统配置。实际运行前检查目标主机、接口和隐私边界；不要把真实令牌、Cookie 或内网地址上传到公共抓包分享服务。
{% endnote %}

~~~bash
# 1. 先确认本机的监听端口和连接状态
ss -lntp
ss -nt state syn-sent
ss -nt state time-wait

# 2. 只在明确授权的接口上抓取一个公共示例目标的 TCP 端口
sudo tcpdump -ni any -c 20 'host example.com and tcp port 443'

# 3. 用 curl 产生一条可关联的请求证据
curl -vI --connect-timeout 5 https://example.com/
~~~

{% note info flat %}
预期观察点不是某一台机器固定的序列号，而是证据结构：客户端先发 SYN；服务端回 SYN-ACK；客户端回 ACK；随后才可能看到 TLS 和 HTTP；如果连接复用，新的 HTTP 请求未必伴随新的 TCP 握手。
{% endnote %}

### 实验验证

{% note info flat %}
下面输出是教学用的脱敏形态，不是当前机器已经执行的结果。真实序列号、时间戳、窗口和地址会变化；示例只用于展示如何从字段形成结论。
{% endnote %}

{% note info flat %}
输入：
{% endnote %}

~~~bash
sudo tcpdump -ni en0 -c 6 'host 198.51.100.20 and tcp port 443'
curl -sS -vI --connect-timeout 5 https://example.test/
ss -ti dst 198.51.100.20:443
tracepath -n 198.51.100.20
~~~

{% note info flat %}
示例输出形态：
{% endnote %}

~~~text
12:00:00.001 IP 192.0.2.10.43000 > 198.51.100.20.443: Flags [S], seq 1000, win 64240, options [mss 1460,sackOK]
12:00:00.014 IP 198.51.100.20.443 > 192.0.2.10.43000: Flags [S.], seq 5000, ack 1001, win 65160, options [mss 1380,sackOK]
12:00:00.015 IP 192.0.2.10.43000 > 198.51.100.20.443: Flags [.], ack 5001, win 502
12:00:00.020 IP 192.0.2.10.43000 > 198.51.100.20.443: Flags [.], ack 1001, options [nop,nop,sack 1 {2001:3001}]
* Connected to example.test (198.51.100.20) port 443
> HEAD / HTTP/1.1
< HTTP/1.1 200 OK
cwnd:10 rto:204 rtt:14.2/2.1
  pmtu 1500
~~~

验证方法：

- 第二个报文的 ACK 是客户端 ISN 加一，第三个报文的 ACK 是服务端 ISN 加一，证明握手序号解释一致；
- SYN 中的 `sackOK` 只表示双方协商了 SACK 能力；示例中的 `sack 1 {2001:3001}` 才是实际报告的非连续数据块范围，二者不能混为一谈；
- MSS 选项、`pmtu` 和 IP 包大小属于路径/分段证据，不能直接当成拥塞窗口；
- `cwnd`、`rto`、`rtt` 来自发送端 TCP 状态，`rwnd` 还要结合对端通告窗口；
- 如果同一序列范围在更晚时间再次出现，结合重复 ACK/SACK 判断是缺口恢复还是 RTO 重传；
- `curl` 有 HTTP 状态只能证明请求走到 HTTP 层，不能证明服务端业务处理成功。

{% note warning flat %}
若命令不存在、接口名不同、抓包权限不足或目标不受控，应停在预检查阶段并记录 NOT VERIFIED，不要用静态示例输出替代真实证据。
{% endnote %}

### 四类现象的判断表

| 现象 | 首要假设 | 最小验证 |
| --- | --- | --- |
| `connect` 立即失败并有 RST | 目标端口未监听或被主动拒绝 | `ss -lnt`、双端抓包、服务日志 |
| `connect` 长时间超时 | 路径丢弃、回程异常、策略静默丢包 | 路由、SYN 重传次数、入口和出口抓包 |
| 建连成功但请求卡住 | TCP 已通，问题转移到 TLS、HTTP 或应用 | `curl -v` 时间线、TLS 记录、服务端日志 |
| 连接大量 TIME_WAIT | 本端频繁主动关闭或短连接过多 | `ss -tan state time-wait`、连接复用和关闭方向 |

### 面试答题模板

遇到“三次握手为什么是三次”“SYN 重传说明什么”“TIME_WAIT 能不能删”这类问题，可以按四层回答：

1. **字段**：指出 SYN、ACK、seq、ack、FIN/RST 对应的报文事实；
2. **状态**：说明本端和对端状态如何变化；
3. **机制**：解释序列确认、重传计时器、队列或旧报文隔离的目的；
4. **边界**：说明还需要什么抓包、日志或系统状态，避免把一个现象绝对化。

{% folding "常见 TCP 面试陷阱" %}

- 三次握手不是为了协商 HTTP，也不是为了确认应用已经可用；它属于 TCP 连接建立。
- ACK 不一定携带应用数据；SYN/FIN 会消耗序号，纯 ACK 通常不会。
- TCP 保证字节流的有序可靠交付，不保证消息边界；一次 `send` 不对应一次 `recv`。
- `rwnd` 是接收流量控制，`cwnd` 是网络拥塞控制；窗口变小的原因要看具体字段和时序。
- TIME_WAIT 通常出现在主动关闭方；“连接数多”本身不是删除它的理由。
- RST、FIN、SYN 超时是不同的证据，不能都叫“TCP 断开”。

{% endfolding %}

## 传输层复习

{% note info flat %}
下面的卡片覆盖握手、关闭、RTO、窗口和选型；先遮住答案，用“字段 → 状态 → 机制 → 边界”四步回答，再用详细解析复盘。
{% endnote %}

{% flashcard basic id:CN-TR-001 deck:"计算机网络" priority:1 tags:"UDP,首部" %}
--- question
UDP 首部有哪些固定字段？它为什么不能单独提供 TCP 式可靠字节流？
--- answer
源端口、目的端口、长度和校验和；它没有序列号、确认号、重传、排序和拥塞控制状态。
--- explanation
UDP 保留数据报边界并把可靠性决策交给应用或上层协议。QUIC 说明“跑在 UDP 上”不等于协议整体没有连接、加密或可靠流机制。

先看协议提供的边界，再讨论性能：

| 能力 | UDP | TCP |
| --- | --- | --- |
| 数据报边界 | 保留 | 不保留，只有字节流 |
| 重传/排序 | 应用决定 | 协议提供 |
| 拥塞控制 | 应用或上层决定 | 协议提供 |

UDP 少的是机制，不是“更快”的保证；如果应用补回可靠性、加密和拥塞控制，比较对象就已经变成完整协议栈。
{% endflashcard %}

{% flashcard basic id:CN-TR-002 deck:"计算机网络" priority:1 tags:"TCP,连接" %}
--- question
TCP 的“连接”应如何理解？
--- answer
它是双方维护的有状态字节流传输上下文，通常由两端 IP 和端口组成的四元组标识。
--- explanation
连接不是一根物理线路，也不是 HTTP 请求本身。它包含序列空间、确认、窗口、状态和计时器；同一 TCP 连接可以承载多个 HTTP 请求。

TCP 连接可以用一个有状态的四元组理解：

~~~text
客户端 IP:端口  ↔  服务端 IP:端口
       伴随序列空间、窗口、状态和计时器
~~~

它不是物理线路，也不是单个 HTTP 请求；同一连接可以承载多个请求。
{% endflashcard %}

{% flashcard basic id:CN-TR-003 deck:"计算机网络" priority:1 tags:"TCP,序列号,确认号" %}
--- question
TCP 确认号为什么表示“下一个期望字节”，而不是“最后收到的字节”？
--- answer
因为它是累计确认：ACK=n 表示 n 之前的连续字节已收到，接收方下一步期望序号 n。
--- explanation
这能统一解释握手中 SYN 消耗一个序号、数据长度使 ACK 增长，以及丢失中间段时重复 ACK 停留在缺口前。

用一个小数据段校验累计确认：

~~~text
发送：seq=1001，长度=200，覆盖 1001～1200
接收：ack=1201，表示下一个期望字节
~~~

因此 ACK 不是“最后收到的编号”；中间缺口未补齐时，确认号会停在缺口之前。
{% endflashcard %}

{% flashcard basic id:CN-TR-004 deck:"计算机网络" priority:1 tags:"TCP,状态" %}
--- question
TCP 标志位和状态机应如何配合解释？
--- answer
标志位描述当前报文的控制意图，状态描述本端连接上下文；相同标志在不同状态可能触发不同转换。
--- explanation
例如 SYN 把主动端带到 SYN-SENT，收到 SYN-ACK 后回 ACK 并进入 ESTABLISHED；FIN 表示一个方向结束，RST 表示立即重置，不能只按“有包/没包”解释。

同一个标志要放进当前状态解释：

| 事件 | 语义 | 典型结果 |
| --- | --- | --- |
| SYN | 建立序列空间 | 进入握手状态 |
| FIN | 一个方向不再发送 | 对端仍可继续发送 |
| RST | 立即拒绝/重置 | 未完成数据以错误结束 |

抓包中只看标志位而忽略状态，容易把正常半关闭误判成异常重置。
{% endflashcard %}

{% flashcard basic id:CN-TR-005 deck:"计算机网络" priority:1 tags:"TCP,三次握手" %}
--- question
TCP 三次握手分别确认什么？
--- answer
客户端 SYN 提供客户端 ISN；服务端 SYN-ACK 确认客户端 ISN 并提供服务端 ISN；客户端 ACK 确认服务端 ISN，双方进入已建立状态。
--- explanation
三次的关键是双向初始序列空间和回程可达性。握手成功不代表应用已经完成 TLS、HTTP 或业务认证。

握手报文至少要和状态一起读：

| 报文 | 关键确认 | 典型状态 |
| --- | --- | --- |
| SYN | 客户端提出 ISN | SYN-SENT |
| SYN-ACK | 服务端确认并提出 ISN | SYN-RECEIVED |
| ACK | 客户端确认服务端 ISN | ESTABLISHED |

握手超时、RST 和握手成功后的 TLS/HTTP 失败是不同证据，不能用一个“端口不通”概括。
{% endflashcard %}

{% flashcard basic id:CN-TR-006 deck:"计算机网络" priority:1 tags:"TCP,SYN,超时" %}
--- question
客户端持续重发 SYN 但收不到 SYN-ACK，能得出什么结论？
--- answer
只能说明握手响应没有按预期到达客户端；可能是路径丢弃、服务端不可达、策略静默丢弃或回程异常，需要抓包和路由证据区分。
--- explanation
客户端只能确认“自己反复发出了 SYN，但没有按预期收到 SYN-ACK”，不能直接确认服务端进程已停止。两端都抓包时，若服务端看不到 SYN，优先检查路由、ACL、防火墙、接口或抓包位置；若服务端发出 SYN-ACK 但客户端收不到，继续查回程路径；若立即收到 RST，则更接近主动拒绝、端口未监听或中间设备重置。SYN 超时和 RST 的失败边界不同，不能统称为“端口不通”。
{% endflashcard %}

{% flashcard basic id:CN-TR-007 deck:"计算机网络" priority:2 tags:"TCP,SYN-Flood,backlog" %}
--- question
SYN Flood、backlog 和文件描述符分别可能在哪个阶段成为瓶颈？
--- answer
半连接状态、已完成连接队列和进程可接受的连接资源分别可能成为瓶颈；backlog 不是服务器连接数的全局上限。
--- explanation
SYN Flood 是大量半连接请求占用等待队列；backlog 通常约束已完成握手、等待应用 `accept` 取走的连接队列；文件描述符则是进程能同时持有的 socket 等资源上限。三者处在不同阶段：

| 线索 | 更接近的瓶颈 | 还要核对 |
| --- | --- | --- |
| 大量 SYN-SENT/SYN-RECEIVED | 半连接或路径 | SYN 重传、服务端收包和回包 |
| 握手完成但 `accept` 变慢 | backlog 或应用消费速度 | 队列长度、进程调度和 CPU |
| `EMFILE`/`ENFILE` | 进程/系统文件描述符 | 限额、泄漏和关闭路径 |

仅凭一次客户端超时不能证明发生了 SYN Flood；必须把握手状态、队列和系统资源时间线对齐。
{% endflashcard %}

{% flashcard basic id:CN-TR-008 deck:"计算机网络" priority:1 tags:"TCP,关闭,FIN" %}
--- question
TCP 常说的“四次挥手”为什么不是固定四个独立报文？
--- answer
两个方向可以独立结束，ACK 可能与数据或 FIN 合并，双方也可能同时关闭；四段只是常见时序。
--- explanation
FIN 表示本方向不再发送字节，对端仍可能继续发送。应按状态和报文方向解释，而不是把四次当成不可变的脚本。

关闭问题先标注方向，再判断状态：

| 观察 | 语义 | 常见下一步 |
| --- | --- | --- |
| FIN | 仅一个方向结束 | 看对端是否继续发送 |
| CLOSE-WAIT | 本端收到 FIN 但应用未关闭 | 查资源释放路径 |
| TIME-WAIT | 主动关闭方等待旧报文消失 | 查短连接与复用 |
| RST | 立即重置 | 查未监听、异常关闭或错误路径 |
{% endflashcard %}

{% flashcard basic id:CN-TR-009 deck:"计算机网络" priority:1 tags:"TCP,FIN,RST" %}
--- question
FIN 和 RST 的核心差异是什么？
--- answer
FIN 有序地结束一个方向并允许剩余数据收尾；RST 立即拒绝或重置连接，未完成的应用数据通常以错误结束。
--- explanation
未监听端口、访问已重置套接字或异常关闭可能产生 RST；正常 EOF 更接近 FIN。最终仍要结合系统调用和抓包。

关闭问题先标注方向，再判断状态：

| 观察 | 语义 | 常见下一步 |
| --- | --- | --- |
| FIN | 仅一个方向结束 | 看对端是否继续发送 |
| CLOSE-WAIT | 本端收到 FIN 但应用未关闭 | 查资源释放路径 |
| TIME-WAIT | 主动关闭方等待旧报文消失 | 查短连接与复用 |
| RST | 立即重置 | 查未监听、异常关闭或错误路径 |
{% endflashcard %}

{% flashcard basic id:CN-TR-010 deck:"计算机网络" priority:1 tags:"TCP,TIME-WAIT" %}
--- question
TIME_WAIT 为什么通常由主动关闭方承担？
--- answer
它需要等待旧报文消失，并在最后 ACK 丢失、对端重发 FIN 时仍能重发 ACK，避免旧连接报文污染新连接。
--- explanation
TIME_WAIT 是连接正确关闭的保护状态。大量 TIME_WAIT 应先检查短连接、连接复用、主动关闭方向和端口规划，而不是直接删除状态。

关闭问题先标注方向，再判断状态：

| 观察 | 语义 | 常见下一步 |
| --- | --- | --- |
| FIN | 仅一个方向结束 | 看对端是否继续发送 |
| CLOSE-WAIT | 本端收到 FIN 但应用未关闭 | 查资源释放路径 |
| TIME-WAIT | 主动关闭方等待旧报文消失 | 查短连接与复用 |
| RST | 立即重置 | 查未监听、异常关闭或错误路径 |
{% endflashcard %}

{% flashcard basic id:CN-TR-011 deck:"计算机网络" priority:2 tags:"TCP,RTO,重传" %}
--- question
RTO 是什么？为什么不能把它背成固定秒数？
--- answer
RTO 是等待确认的重传超时估计，由 RTT、RTT 波动和退避规则计算，并会随网络状态调整。
--- explanation
超时触发重传和更保守的发送节奏；抓包应结合序列号、时间间隔和 ACK，而不能只依赖分析器的重传标签。

重传证据需要同时看序列号和时间：

| 线索 | 可能说明 | 仍需排除 |
| --- | --- | --- |
| 重复 ACK | 累计确认前方有缺口 | 乱序、抓包点差异 |
| RTO 后重传 | 等待确认超时 | 捕获丢包、RTT 估计 |
| SACK 区间 | 哪些非连续数据已到达 | 不等于独立拥塞信号 |

分析器的 Retransmission 是标注，不是最终根因。
{% endflashcard %}

{% flashcard basic id:CN-TR-012 deck:"计算机网络" priority:2 tags:"TCP,拥塞控制" %}
--- question
接收窗口 rwnd 和拥塞窗口 cwnd 有什么区别？
--- answer
rwnd 反映接收方缓存还能接收多少，cwnd 反映发送方对路径拥塞的发送限制；在途数据通常受两者较小值约束。
--- explanation
应用读得慢可能导致零窗口，路径丢包可能导致拥塞窗口下降。二者都能让吞吐降低，但证据字段和时序不同。

窗口可以用“谁在限速”来区分：

| 字段 | 约束来源 | 常见现场线索 |
| --- | --- | --- |
| rwnd | 接收端缓存/应用读取 | Window Zero 或窗口变小 |
| cwnd | 发送端对路径拥塞的估计 | 丢包后发送节奏变保守 |

在途数据通常受二者较小值限制；只看到吞吐下降还不能判断是接收端慢还是路径拥塞。
{% endflashcard %}

{% flashcard basic id:CN-TR-013 deck:"计算机网络" priority:2 tags:"TCP,快速重传,SACK" %}
--- question
重复 ACK、快速重传和 SACK 如何关联？
--- answer
重复 ACK 暗示累计确认前方存在缺口；发送方可据此快速重传，SACK 进一步报告已收到的非连续区间以减少无谓重传。
--- explanation
SACK 本身是非连续接收区间的报告，不是独立的拥塞信号；重复 ACK、RTO 或其他拥塞反馈可能触发恢复，SACK 帮助发送方精确知道哪些区间无需重传。

重传证据需要同时看序列号和时间：

| 线索 | 可能说明 | 仍需排除 |
| --- | --- | --- |
| 重复 ACK | 累计确认前方有缺口 | 乱序、抓包点差异 |
| RTO 后重传 | 等待确认超时 | 捕获丢包、RTT 估计 |
| SACK 区间 | 哪些非连续数据已到达 | 不等于独立拥塞信号 |

分析器的 Retransmission 是标注，不是最终根因。
{% endflashcard %}

{% flashcard basic id:CN-TR-014 deck:"计算机网络" priority:1 tags:"TCP,MSS,MTU,抓包" %}
--- question
在 TCP 抓包中，如何用 MSS 与路径反馈定位大包黑洞？
--- answer
先比较两端 SYN/SYN-ACK 的 MSS，再观察实际 TCP 载荷、IP 包大小，以及是否出现 ICMP Packet Too Big 或需要分片反馈。
--- explanation
这张卡关注传输层证据链：MSS 是端点在握手中表达的 TCP 载荷上限，MTU 是路径/链路约束，PMTUD 依赖路径反馈。没有反馈时还要考虑 ICMP 过滤、隧道开销和中间设备策略；先分别判断这三个概念，再把它们放回抓包字段和路径反馈中。

抓包时把握手协商和实际载荷分开记录：

| 观察位置 | 记录内容 | 用途 |
| --- | --- | --- |
| SYN/SYN-ACK | MSS | 端点表达的 TCP 载荷上限 |
| 数据段 | 实际长度与重传 | 是否按预期发送 |
| ICMP/路径 | Packet Too Big 等反馈 | PMTUD 是否有证据 |
{% endflashcard %}

## 常见问题

{% flashcard_ref id="CN-TR-005" %}
{% flashcard_ref id="CN-TR-010" %}

{% flashcard basic id:CN-TR-FAQ-001 deck:"计算机网络" priority:1 tags:"TCP,字节流,消息边界" %}
--- question
TCP 能保证消息一次完整到达吗？
--- answer
不能。TCP 提供有序字节流；一次写入可能被拆成多个段，一次读取也可能得到半条或多条应用消息。
--- explanation
应用协议需要自己定义长度、分隔符或帧格式。TCP 的可靠性不等于保留应用消息边界。

应用协议必须自行划分消息，例如：

~~~text
[4 字节长度][payload]
或
[一行一条消息
]
或
[BEGIN][内容][END]
~~~

TCP 只保证字节按序到达；一次 send() 与一次 recv() 没有一一对应关系。
{% endflashcard %}

{% flashcard basic id:CN-TR-FAQ-002 deck:"计算机网络" priority:1 tags:"TCP,三次握手,排障" %}
--- question
三次握手成功后为什么仍可能访问失败？
--- answer
握手只证明 TCP 连接建立；TLS 证书校验、HTTP 状态码、代理、认证、应用处理或响应读取仍可能失败。
--- explanation
TCP 三次握手只完成传输层连接，访问还会继续经过多个阶段：

| 阶段 | 可能的失败 | 典型证据 |
| --- | --- | --- |
| DNS | 名称解析错误或过期 | DNS 响应、缓存和时间 |
| TCP | 端口拒绝、丢包或超时 | SYN/SYN-ACK/RST |
| TLS | 证书、主机名或协议协商失败 | 握手消息和客户端错误 |
| HTTP/应用 | 401、404、502、业务校验失败 | 响应状态、字段和服务日志 |

因此握手成功只能缩小范围；不能把握手后的 TLS、HTTP 或应用失败都叫作“网络不通”。
{% endflashcard %}

{% flashcard basic id:CN-TR-FAQ-003 deck:"计算机网络" priority:1 tags:"UDP,TCP,性能" %}
--- question
UDP 一定比 TCP 快吗？
--- answer
不一定。UDP 少了部分机制，但应用可能重新实现可靠性、拥塞控制和加密；实际性能受 RTT、丢包、编码、排队和实现影响。
--- explanation
应比较完整协议栈的目标和测量结果，而不是只比较传输层协议名称。

先看协议提供的边界，再讨论性能：

| 能力 | UDP | TCP |
| --- | --- | --- |
| 数据报边界 | 保留 | 不保留，只有字节流 |
| 重传/排序 | 应用决定 | 协议提供 |
| 拥塞控制 | 应用或上层决定 | 协议提供 |

UDP 少的是机制，不是“更快”的保证；如果应用补回可靠性、加密和拥塞控制，比较对象就已经变成完整协议栈。
{% endflashcard %}

{% flashcard basic id:CN-TR-FAQ-004 deck:"计算机网络" priority:1 tags:"TCP,CLOSE-WAIT,排障" %}
--- question
为什么服务端 CLOSE-WAIT 很多？
--- answer
通常表示对端已经发 FIN，而本地应用还没有关闭自己的方向。
--- explanation
检查应用是否及时释放连接、是否卡在业务处理或异常路径；不要把 CLOSE-WAIT 和 TIME-WAIT 都简化成“连接没关”。

关闭问题先标注方向，再判断状态：

| 观察 | 语义 | 常见下一步 |
| --- | --- | --- |
| FIN | 仅一个方向结束 | 看对端是否继续发送 |
| CLOSE-WAIT | 本端收到 FIN 但应用未关闭 | 查资源释放路径 |
| TIME-WAIT | 主动关闭方等待旧报文消失 | 查短连接与复用 |
| RST | 立即重置 | 查未监听、异常关闭或错误路径 |
{% endflashcard %}

{% flashcard basic id:CN-TR-FAQ-005 deck:"计算机网络" priority:2 tags:"TCP,重传,抓包" %}
--- question
看到 TCP Retransmission 就能断定网络丢包吗？
--- answer
不能。分析器依据时序和重复序列号做标注，可能受抓包点、网卡卸载、乱序和捕获丢包影响。
--- explanation
要结合两端抓包、ACK/SACK、接口统计和应用时延判断实际原因。

重传证据需要同时看序列号和时间：

| 线索 | 可能说明 | 仍需排除 |
| --- | --- | --- |
| 重复 ACK | 累计确认前方有缺口 | 乱序、抓包点差异 |
| RTO 后重传 | 等待确认超时 | 捕获丢包、RTT 估计 |
| SACK 区间 | 哪些非连续数据已到达 | 不等于独立拥塞信号 |

分析器的 Retransmission 是标注，不是最终根因。
{% endflashcard %}

## 参考资料

### UDP、TCP 与可靠传输规范

{% linkgroup %}
{% link RFC 768：User Datagram Protocol, https://www.rfc-editor.org/rfc/rfc768.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9293：Transmission Control Protocol, https://www.rfc-editor.org/rfc/rfc9293.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 6298：Computing TCP's Retransmission Timer, https://www.rfc-editor.org/rfc/rfc6298.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 5681：TCP Congestion Control, https://www.rfc-editor.org/rfc/rfc5681.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 2018：TCP Selective Acknowledgment Options, https://www.rfc-editor.org/rfc/rfc2018.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 8201：Path MTU Discovery for IP version 6, https://www.rfc-editor.org/rfc/rfc8201.html, https://www.rfc-editor.org/favicon.ico %}
{% endlinkgroup %}

### 抓包与请求观察工具

{% linkgroup %}
{% link Chrome DevTools Network 官方文档, https://developer.chrome.com/docs/devtools/network/, https://www.google.com/chrome/static/images/chrome-logo.svg %}
{% link curl 官方手册, https://curl.se/docs/manpage.html, https://curl.se/favicon.ico %}
{% link Wireshark User's Guide, https://www.wireshark.org/docs/wsug_html_chunked/, https://www.wireshark.org/favicon.ico %}
{% endlinkgroup %}

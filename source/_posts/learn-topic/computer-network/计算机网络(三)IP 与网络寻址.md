---
title: "计算机网络(三)IP 与网络寻址"
tags:
  - "计算机网络"
  - "IP"
  - "CIDR"
categories:
  - "Learn Topic"
  - "计算机网络"
description: "从一条跨网段访问链路出发，掌握 IPv4/IPv6 地址、CIDR、最长前缀匹配、NAT、ICMP、DHCP、DNS 与旧笔记迁移边界。"
cover: /img/picgo-images/computer-network-course-cover.png
series: "计算机网络"
series_order: 3
published: true
abbrlink: 5bd659bc
date: 2026-08-25 05:30:00
---

{% course_series %}

{% note info flat %}
本文围绕“知道目标 IP 之后，下一跳到底是谁”展开：先用 CIDR 判断本地边界，再用最长前缀匹配选择路由，最后把 NAT、IPv6、ICMP、DHCP 和 DNS 放回一条真实访问链路。
{% endnote %}

## 地址与前缀

### IPv4 地址

{% note info flat %}
IPv4 地址是 32 位数。CIDR 用前缀长度表示有多少位属于网络部分，例如 /24 表示前 24 位属于网络前缀，剩余 8 位用于主机部分。
{% endnote %}

以 192.0.2.34/27 为例：

| 计算项 | 结果 |
| --- | --- |
| 前缀长度 | 27 |
| 子网掩码 | 255.255.255.224 |
| 块大小 | 32 个地址 |
| 网络地址 | 192.0.2.32 |
| 广播地址 | 192.0.2.63 |
| 通常的主机地址范围 | 192.0.2.33～192.0.2.62 |

计算过程是：

1. /27 对应最后一个八位组的掩码 224；
2. 块大小为 256 - 224 = 32；
3. 34 落在 32～63 这一块；
4. 块起点是网络地址，块终点是广播地址。

{% note info flat %}
“通常”是有意保留的边界。点到点链路、特殊用途地址和具体实现可能改变传统网络地址/广播地址/可用主机表格的适用性。
{% endnote %}

{% mermaid %}
flowchart TD
  A[IPv4 地址 192.0.2.34/27] --> B[读取前缀长度 27]
  B --> C[掩码 255.255.255.224]
  C --> D[块大小 32]
  D --> E[网络 192.0.2.32]
  D --> F[广播 192.0.2.63]
  D --> G[通常主机范围 .33 到 .62]
{% endmermaid %}

### CIDR 与 VLSM

{% note info flat %}
CIDR 让路由和地址规划使用任意前缀长度，不再受早期 A/B/C 分类边界限制。VLSM 则是在同一个地址规划中使用不同长度的子网，为不同规模链路分配不同大小的地址块。
{% endnote %}

| 需求 | 前缀 | 地址数 | 说明 |
| --- | --- | --- | --- |
| 办公网 | 192.0.2.0/26 | 64 | 需要较多主机 |
| 服务网 | 192.0.2.64/27 | 32 | 中等规模 |
| 点到点链路 | 192.0.2.96/31 | 2 | 适用条件见下文 |
| 预留链路 | 192.0.2.98/31 | 2 | 保留连续空间 |

{% note info flat %}
规划时先按需求从大到小分配，再检查子网重叠、下一跳位置、路由公告范围和广播语义。不能只计算地址数量而不检查路由和链路。
{% endnote %}

### 分类地址和 /31 迁移

{% note info flat %}
旧笔记中的 Class A/B/C 可以作为历史背景，但现代地址规划应以 CIDR 前缀长度为主。10.0.0.0/8、172.16.0.0/12、192.168.0.0/16 是私有地址用途范围，不应被误解成现代 A/B/C 规划规则。
{% endnote %}

{% note info flat %}
/31 是典型迁移点。传统主机子网表会排除网络地址和广播地址，因此容易写成“/31 没有可用主机”。RFC 3021 为点到点链路定义了特殊语义，使两个地址可以分别给链路两端。
{% endnote %}

| 场景 | /31 结论 |
| --- | --- |
| 点到点链路 | 可以把两个地址分别给两端 |
| 普通有广播能力的 LAN | 不应机械套用点到点例外 |
| 地址规划文档 | 写清链路类型和设备支持 |
| 面试回答 | 先说传统表格，再说明 RFC 3021 边界 |

## 路由、下一跳与 NAT

### 最长前缀匹配

假设路由表如下：

| 路由 | 下一跳 | 前缀长度 |
| --- | --- | --- |
| 0.0.0.0/0 | 192.0.2.1 | 0 |
| 198.51.100.0/24 | 192.0.2.2 | 24 |
| 198.51.100.128/25 | 192.0.2.3 | 25 |

{% note info flat %}
目标 198.51.100.140 同时匹配三条路由，但 /25 最具体，因此选择 192.0.2.3。目标 198.51.100.70 不匹配 /25，但匹配 /24，因此选择 192.0.2.2。
{% endnote %}

{% mermaid %}
flowchart TD
  A[目标 IP] --> B[枚举可匹配路由]
  B --> C{是否存在更长前缀}
  C -->|是| D[选择最长匹配]
  C -->|否| E[回退默认路由或报告不可达]
  D --> F[得到出接口与下一跳]
  E --> F
  F --> G[为下一跳解析链路层地址]
{% endmermaid %}

{% note info flat %}
主机上可以用只读命令观察实际选择：
{% endnote %}

~~~bash
ip route
ip route get 198.51.100.140
~~~

{% note info flat %}
命令输出中的出接口、源地址和下一跳，比“我配置了一个默认网关”更接近实际路径。真实设备还可能叠加管理距离、度量和策略路由。
{% endnote %}

### NAT 映射与边界

传统 NAT 常把内部地址和端口映射为外部地址和端口：

| 内部端点 | 外部映射 | 目的 |
| --- | --- | --- |
| 192.168.10.10:53000 | 198.51.100.8:41000 | 让外部响应能回到内部连接 |
| 192.168.10.11:53001 | 198.51.100.8:41001 | 区分并发连接 |

NAT 能改变地址和端口，但它不会自动解决：

- 应用层把内部地址写入 payload；
- 被动入站连接如何找到内部服务；
- 多层 NAT 的端口映射和超时；
- 需要端到端可达性的协议；
- 映射状态丢失后的恢复。

{% note info flat %}
因此“用了 NAT 就安全”是错误的简化。NAT 可能让未经映射的入站连接更难建立，但访问控制、状态防火墙、应用认证和日志审计是不同问题。
{% endnote %}

## IPv6

### IPv6 地址

{% note info flat %}
IPv6 地址为 128 位，通常写成八组十六进制。连续的零可以压缩，但一条地址中只能使用一次双冒号。
{% endnote %}

| 类型 | 作用 | 典型观察 |
| --- | --- | --- |
| Global Unicast | 可路由的全局地址 | 网络前缀与接口部分 |
| Link-Local | 只在当前链路有效 | 常见前缀 fe80::/10 |
| Multicast | 面向一组接口 | 邻居发现等机制 |
| Loopback | 本机回环 | ::1 |

{% note info flat %}
链路本地地址不能直接当作全球可达地址。命令需要在多个接口之间选择链路本地邻居时，通常还要明确接口作用域。
{% endnote %}

### 子网结构与邻居边界

{% note info flat %}
IPv6 通常把全局路由前缀、子网标识和接口标识分开管理，具体位数由部署方案决定，不应把某种常见部署写成协议唯一硬编码。
{% endnote %}

{% note info flat %}
IPv6 邻居解析、路由器发现和重复地址检测由 ICMPv6 Neighbor Discovery 相关机制承载。它与 IPv4 ARP 共同解决下一跳链路地址问题，但消息类型、组播方式和状态语义不同。
{% endnote %}

## 控制、配置与名称

### ICMP 与 PMTUD

{% note info flat %}
ICMP 不只为 ping 服务，还承载不可达、超时和参数问题等控制信息；IPv6 对应 ICMPv6。ping 成功只证明某种 Echo 往返可行，不能证明 TCP 端口、TLS 或 HTTP 服务正常。
{% endnote %}

{% note info flat %}
TTL/Hop Limit 用于限制数据报在路由器之间无限循环。每经过一个三层转发节点通常会递减，归零时产生超时类反馈。traceroute 利用这一类反馈观察路径，但设备可能过滤或限速响应。
{% endnote %}

{% note info flat %}
PMTUD 解决路径最大传输单元发现问题。TCP 的 MSS 是传输层愿意接收的单个 TCP 载荷大小提示，MTU 是链路能承载的 IP 包大小，二者不能互换：
{% endnote %}

| 概念 | 所属层次 | 关注点 |
| --- | --- | --- |
| MTU | 链路/网络边界 | 一条链路能承载多大的 IP 包 |
| MSS | TCP | 一个 TCP 段最多放多少应用载荷 |
| PMTUD | IP/传输协作 | 发现路径中的最小 MTU |

### DHCP DORA

DHCP 客户端没有地址时，常见流程可记为 DORA：

{% mermaid %}
sequenceDiagram
  participant C as DHCP 客户端
  participant S as DHCP 服务端
  C->>S: Discover 广播
  S-->>C: Offer 提议
  C->>S: Request 请求某个提议
  S-->>C: ACK 确认地址、网关、DNS 和租期
{% endmermaid %}

{% note info flat %}
DORA 是地址初始获取的记忆框架。续租、重启、服务器不可达和地址冲突检查可能走不同分支。
{% endnote %}

### DNS 递归与迭代

{% note info flat %}
应用通常向配置的递归解析器发起查询。递归解析器代表客户端继续查找，可能联系根、顶级域和权威服务器；迭代查询则是服务器返回下一步去问谁。
{% endnote %}

{% mermaid %}
flowchart TD
  A[应用请求 example.com] --> B[本机 Stub Resolver]
  B --> C[递归解析器]
  C --> D[根服务器]
  D --> E[顶级域服务器]
  E --> F[权威服务器]
  F --> C
  C --> B
  B --> A[得到地址或错误]
{% endmermaid %}

{% note info flat %}
缓存会让真实路径缩短。排障时应记录查询服务器、缓存状态、返回码和地址，而不是只说 DNS 有问题。
{% endnote %}

### 端口和端点四元组

{% note info flat %}
传输层端点通常由协议、源 IP、源端口、目标 IP、目标端口共同描述。面试中常说 TCP 四元组，实际还应带上 TCP/UDP 协议这一维，避免把同端口的 TCP 和 UDP 当成同一个会话。
{% endnote %}

| 协议 | 源端点 | 目标端点 |
| --- | --- | --- |
| TCP | 192.168.10.10:53000 | 198.51.100.20:443 |
| UDP | 192.168.10.10:53000 | 198.51.100.20:443 |

{% note info flat %}
同样的数字端口并不代表相同的传输会话。
{% endnote %}

## 失败边界与验证

| 现象 | 先查什么 | 定位维度 |
| --- | --- | --- |
| 目标地址算错 | 前缀、掩码、网络地址 | CIDR |
| 选择错误出口 | 路由表、最长匹配、策略路由 | 路由 |
| 本地可访问，公网不可访问 | NAT 映射、返回路径、ACL | NAT |
| IPv6 只有 fe80 地址 | 路由器发现、地址配置、作用域 | IPv6/ND |
| ping 不通但 TCP 可用 | ICMP 过滤或策略 | ICMP 不等于服务状态 |
| 大包卡住、小包正常 | PMTUD、MTU、MSS、ICMP 过滤 | 分片与 PMTUD |
| 域名失败但直接 IP 可用 | Stub、递归解析器、权威链路 | DNS |

{% note info flat %}
推荐的只读证据顺序：
{% endnote %}

~~~bash
ip addr
ip route
ip route get 198.51.100.20
ip neigh
dig example.com
ping -c 1 198.51.100.20
~~~

{% note warning flat %}
不要为了让 ping 通而随意关闭防火墙、改默认路由或清空邻居状态。
{% endnote %}

{% folding blue, 展开查看 CIDR 计算检查表 %}
1. 写出地址和前缀；
2. 把前缀转换成掩码；
3. 找到发生变化的八位组；
4. 计算块大小；
5. 找到网络地址和块终点；
6. 根据链路语义判断广播、点到点例外和可用地址；
7. 用路由表或地址规划表检查是否重叠。
{% endfolding %}

## 寻址复习

{% flashcard basic id:CN-IP-001 deck:"计算机网络" priority:1 tags:"IPv4,CIDR" %}
--- question
IPv4 前缀长度 /24 表示什么？
--- answer
前 24 位是网络前缀，剩余 8 位用于主机部分。
--- explanation
前缀长度决定地址块边界和路由匹配范围，不等于固定可用主机数；具体范围还要看链路语义和特殊地址。
{% endflashcard %}

{% flashcard basic id:CN-IP-002 deck:"计算机网络" priority:1 tags:"子网计算" %}
--- question
192.0.2.34/27 的网络地址、广播地址和通常主机范围是什么？
--- answer
网络地址是 192.0.2.32，广播地址是 192.0.2.63，通常主机范围是 .33～.62。
--- explanation
/27 的块大小为 32，34 落入 32～63 块。先计算边界，再讨论特殊用途和点到点例外。
{% endflashcard %}

{% flashcard basic id:CN-IP-003 deck:"计算机网络" priority:2 tags:"CIDR,历史迁移" %}
--- question
为什么现代地址规划不能继续按 Class A/B/C 作为主规则？
--- answer
CIDR 使用任意前缀长度，路由和地址规划以 prefix length 为准；分类地址只能作为历史背景。
--- explanation
私有地址范围是用途划分，不是分类地址规则。回答旧资料时应明确历史表述和当前替代模型。
{% endflashcard %}

{% flashcard basic id:CN-IP-004 deck:"计算机网络" priority:2 tags:"VLSM,地址规划" %}
--- question
VLSM 解决什么问题？
--- answer
在同一地址规划中使用不同前缀长度，为不同规模网络分配合适大小的地址块。
--- explanation
规划时需要检查不重叠、下一跳位置、路由公告范围和链路语义，不能只按主机数量机械切块。
{% endflashcard %}

{% flashcard basic id:CN-IP-005 deck:"计算机网络" priority:1 tags:"路由,最长前缀匹配" %}
--- question
多个路由都匹配目标 IP 时，通常如何选择？
--- answer
选择最长、最具体的匹配前缀。
--- explanation
例如 /25 优先于 /24，/24 优先于默认 /0。真实设备还可能叠加管理距离、度量和策略路由。
{% endflashcard %}

{% flashcard basic id:CN-IP-006 deck:"计算机网络" priority:2 tags:"/31,点到点" %}
--- question
/31 为什么在点到点链路上可以使用两个地址？
--- answer
RFC 3021 为点到点链路定义特殊语义，使两个地址分别表示链路两端。
--- explanation
这不是普通广播 LAN 的通用规则。迁移旧表格时必须同时写出链路类型、设备支持和规范依据。
{% endflashcard %}

{% flashcard basic id:CN-IP-007 deck:"计算机网络" priority:1 tags:"NAT,端点" %}
--- question
NAT 映射通常改变哪些信息？
--- answer
它可以把内部地址和端口映射为外部地址和端口，并维护返回流量所需的状态。
--- explanation
NAT 不等于防火墙，也不能自动解决应用 payload 中的内部地址、入站发布和端到端语义问题。
{% endflashcard %}

{% flashcard basic id:CN-IP-008 deck:"计算机网络" priority:2 tags:"IPv6,链路本地" %}
--- question
IPv6 链路本地地址的作用范围是什么？
--- answer
它只在当前链路有效，不能直接当作全球可路由地址。
--- explanation
使用链路本地地址时通常还要明确接口作用域。IPv6 的全局、组播和链路本地地址承担不同职责。
{% endflashcard %}

{% flashcard basic id:CN-IP-009 deck:"计算机网络" priority:1 tags:"ICMP,故障排查" %}
--- question
ping 失败能否直接证明 TCP 服务不可用？
--- answer
不能。ping 主要观察 ICMP Echo，ICMP 可能被过滤，而 TCP 服务可能仍然可用。
--- explanation
应分别测试 ICMP、TCP 端口、TLS 和应用响应，并记录每一层证据。
{% endflashcard %}

{% flashcard basic id:CN-IP-010 deck:"计算机网络" priority:2 tags:"TTL,路由" %}
--- question
TTL 或 Hop Limit 解决什么问题？
--- answer
限制数据报在路由器之间的生存跳数，避免路由环路无限转发。
--- explanation
每次三层转发通常会递减，归零时产生超时类反馈；traceroute 利用这一机制观察路径。
{% endflashcard %}

{% flashcard basic id:CN-IP-011 deck:"计算机网络" priority:2 tags:"MTU,MSS,PMTUD" %}
--- question
MTU、MSS 和 PMTUD 有什么区别？
--- answer
MTU 描述链路可承载的 IP 包大小，MSS 描述 TCP 载荷大小提示，PMTUD 用于发现路径中的可用 MTU。
--- explanation
三者处于不同层次。大包失败而小包成功时，应同时检查 MTU、MSS、ICMP 过滤和隧道开销。
{% endflashcard %}

{% flashcard basic id:CN-IP-012 deck:"计算机网络" priority:2 tags:"DHCP,DORA" %}
--- question
DHCP DORA 四步分别是什么？
--- answer
Discover、Offer、Request、ACK。
--- explanation
它是地址初始获取的记忆框架。续租、重启、服务器不可达和地址冲突检查可能走不同分支。
{% endflashcard %}

{% flashcard basic id:CN-IP-013 deck:"计算机网络" priority:1 tags:"DNS,递归" %}
--- question
递归解析器与权威服务器在一次 DNS 查询中分别做什么？
--- answer
客户端通常请求递归解析器代为查找；权威服务器负责给出自己负责区域的最终记录。
--- explanation
递归解析器可能沿根、顶级域和权威链路迭代查询，并使用缓存缩短后续路径。
{% endflashcard %}

{% flashcard basic id:CN-IP-014 deck:"计算机网络" priority:2 tags:"端口,四元组" %}
--- question
为什么相同的端口号不代表相同的 TCP/UDP 会话？
--- answer
协议、源/目标 IP 和源/目标端口共同确定端点关系；TCP 与 UDP 还属于不同传输空间。
--- explanation
TCP 192.168.10.10:53000 到 198.51.100.20:443 与 UDP 使用同样数字端口，也不是同一会话。
{% endflashcard %}

## 常见问题

{% flashcard_ref id="CN-IP-005" %}
{% flashcard_ref id="CN-IP-013" %}

{% flashcard basic id:CN-IP-FAQ-001 deck:"计算机网络" priority:1 tags:"路由,默认网关" %}
--- question
默认网关是不是所有流量的唯一出口？
--- answer
不是。默认路由只在没有更具体匹配时使用，静态路由、动态路由、策略路由和多网卡都可能让不同目标走不同出口。
--- explanation
排障时用路由查询确认目标的出接口、源地址和下一跳，不要只看默认网关配置。
{% endflashcard %}

{% flashcard basic id:CN-IP-FAQ-002 deck:"计算机网络" priority:1 tags:"NAT,防火墙" %}
--- question
NAT 能不能代替防火墙？
--- answer
不能。NAT 处理地址和端口映射及状态，防火墙处理允许、拒绝和审计策略。
--- explanation
二者经常部署在同一设备上，但职责不同；地址被转换不等于流量已经按安全策略获准。
{% endflashcard %}

{% flashcard basic id:CN-IP-FAQ-003 deck:"计算机网络" priority:1 tags:"DNS,排障" %}
--- question
DNS 返回了 IP，为什么访问仍然失败？
--- answer
DNS 只完成名称到地址的解析，后续仍可能在路由、ARP/ND、TCP/QUIC、TLS、HTTP 或服务端策略处失败。
--- explanation
把解析、连接、安全握手和应用响应分开测试，才能知道失败停在哪一层。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link RFC 791 IPv4, https://www.rfc-editor.org/rfc/rfc791.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 4632 CIDR, https://www.rfc-editor.org/rfc/rfc4632.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 3021 /31 前缀, https://www.rfc-editor.org/rfc/rfc3021.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 1812 IPv4 路由器要求, https://www.rfc-editor.org/rfc/rfc1812.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 4291 IPv6 地址架构, https://www.rfc-editor.org/rfc/rfc4291.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 2131 DHCP, https://www.rfc-editor.org/rfc/rfc2131.html, https://www.rfc-editor.org/favicon.ico %}
{% endlinkgroup %}

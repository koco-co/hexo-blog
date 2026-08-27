---
title: "计算机网络(六)HTTPS 与现代 HTTP"
tags:
  - "计算机网络"
  - "HTTPS"
  - "HTTP/2"
  - "HTTP/3"
categories:
  - "Learn Topic"
  - "计算机网络"
description: "按 HTTP/1.1、HTTP/2、TLS 1.3、QUIC、HTTP/3、证书校验和 HTTPS 边界的严格顺序，理解现代 Web 协议栈。"
cover: /img/picgo-images/computer-network-course-cover.png
series: "计算机网络"
series_order: 6
published: true
abbrlink: 36cb963b
date: 2026-03-06 00:00:00
---

{% course_series %}

{% note info flat %}
本文沿着协议依赖回答一个问题：HTTP/1.1、HTTP/2、TLS 1.3、QUIC 和 HTTP/3 分别改变了哪一层？证书链、主机名、SNI、ALPN 又如何决定“安全连接”和“应用协议”是否真的匹配？
{% endnote %}

## HTTP/1.1

### 语义和线格式分离

{% note info flat %}
HTTP 方法、状态码、字段和内容属于语义层；HTTP/1.1 规定的是一种文本起始行/字段和消息分帧方式，它不是 HTTP 语义本身，也不是 TLS。这个拆分能解释为什么同一个 GET 语义可以映射到 HTTP/1.1 的文本消息、HTTP/2 的二进制帧或 HTTP/3 的 QUIC 流。
{% endnote %}

{% mermaid %}
flowchart TD
  SEM[HTTP 语义：方法/状态/字段/内容]
  H1[HTTP/1.1：文本消息与持久连接]
  H2[HTTP/2：二进制帧与流]
  H3[HTTP/3：QUIC 流上的帧]
  TLS1[TLS 1.3：保护 TCP 上的 HTTP]
  TLS2[TLS 1.3：保护 TCP 上的 HTTP/2]
  QTLS[QUIC 内置 TLS 1.3：保护 QUIC 包]
  UDP[UDP：QUIC 的封装入口]
  SEM --> H1
  SEM --> H2
  SEM --> H3
  H1 --> TCP1[TCP：HTTP/1.1]
  H2 --> TCP2[TCP：HTTP/2]
  H1 --> TLS1
  H2 --> TLS2
  TLS1 --> TCP1
  TLS2 --> TCP2
  H3 --> QUIC[QUIC 连接与 stream]
  QUIC --> QTLS
  QTLS --> UDP
{% endmermaid %}

### 持久连接和消息结束

{% note primary flat %}
前一篇 HTTP 协议文章已经建立 Content-Length、Transfer-Encoding、chunked、连接关闭和响应语义的消息分帧规则；本文不重复定义这些字段，只把它们作为理解协议演进的入口。HTTP/1.1 的持久连接把多个消息放在同一条 TCP 连接上，HTTP/2/3 则进一步把语义映射到帧和独立的 stream。
{% endnote %}

| 观察对象 | HTTP/1.1 | HTTP/2/3 的变化 |
| --- | --- | --- |
| 消息边界 | 依赖语义、长度、分块或连接结束 | 由帧和 stream 的协议规则承载 |
| 并发单位 | 连接上的连续消息 | 一条连接中的多个逻辑 stream |
| 本文关注 | 分帧规则的主解释在 HTTP 协议篇 | 本文解释二进制帧、流控、加密承载和回退 |

## HTTP/2

### HTTP/2 层次

HTTP/2 把 HTTP 消息拆成二进制帧，并用 stream 标识并发的逻辑交换：

| 层次 | 含义 | 例子 |
| --- | --- | --- |
| message | 一个请求或响应的 HTTP 语义 | 请求头、响应头和内容 |
| stream | 一次逻辑请求/响应的双向序列 | stream 1、stream 3 |
| frame | 在连接中传输的最小线格式单位 | HEADERS、DATA、WINDOW_UPDATE |
| connection | 承载多个 stream 的 TCP 连接 | 一次 TLS/TCP 会话 |

{% mermaid %}
flowchart TD
  CONN[一个 HTTP/2 connection]
  CONN --> S1[stream 1：请求 A]
  CONN --> S3[stream 3：请求 B]
  CONN --> S5[stream 5：请求 C]
  S1 --> F1[HEADERS → DATA → END_STREAM]
  S3 --> F3[HEADERS → DATA → END_STREAM]
  S5 --> F5[HEADERS → DATA → END_STREAM]
{% endmermaid %}

{% note info flat %}
HTTP/2 的多路复用允许不同 stream 的帧交错发送，避免 HTTP/1.1 管线化中一个响应阻塞后续响应的应用层队头阻塞。它并没有消除 TCP 层的队头阻塞：如果一段 TCP 字节丢失，后续字节仍要等待 TCP 按序交付。
{% endnote %}

### HPACK 和流控

{% note primary flat %}
HPACK 使用静态表、动态表和索引表示压缩字段，减少重复的 Host、Cookie、User-Agent 等字段占用。压缩上下文是连接状态的一部分，敏感字段压缩、动态表大小和攻击面需要按协议和实现配置理解；“压缩就等于加密”是错误结论。
{% endnote %}

{% note info flat %}
HTTP/2 流控分为连接级和 stream 级：接收方用 WINDOW_UPDATE 表示还愿意接收的字节量。发送方遇到窗口耗尽时可能停止发送，即使 TCP 连接本身仍然可写。排障时要区分 HTTP/2 流控、TCP 接收窗口和应用读取速度。
{% endnote %}

### stream 生命周期

{% note info flat %}
HEADERS 可以开启 stream，END_STREAM 表示某个方向结束；RST_STREAM 只重置一个 stream，不一定关闭整条连接；GOAWAY 表示连接不再接受更高编号的新 stream，但允许已有 stream 按规则完成。一个请求失败不必然等同于 TCP 断开。
{% endnote %}

| 现象 | 可能的 HTTP/2 语义 | 仍需验证 |
| --- | --- | --- |
| 单个资源失败，其他资源继续 | 某个 stream 被 RST 或返回 HTTP 错误 | stream ID、RST 错误码、其他 stream 状态 |
| 新请求不再创建，旧请求完成 | 收到 GOAWAY | last-stream-ID 和连接复用策略 |
| 所有 stream 一起停顿 | TCP 丢包、连接级流控或连接错误 | TCP 抓包、WINDOW_UPDATE、连接错误码 |
| 字段压缩异常 | HPACK 动态表或实现协商问题 | SETTINGS、头部解码错误、实现日志 |

## TLS 1.3 握手

### TLS 解决什么问题

{% note info flat %}
TLS 主要提供机密性、完整性和端点认证所需的协议机制；证书和主机名校验让客户端判断“连接的对端是否是目标服务”。TLS 不负责 HTTP 方法语义、业务授权或应用数据格式，HTTPS 是把 HTTP 语义放进 TLS 保护的连接中。
{% endnote %}

### TLS 1.3 的握手主线

{% note danger flat %}
TLS 1.3 使用现代密码套件和临时密钥交换，目标是在减少往返的同时，在握手完成后保护应用数据。用抽象时序表示：
{% endnote %}

{% mermaid %}
sequenceDiagram
  participant C as 客户端
  participant S as 服务端
  C->>S: ClientHello：随机数、支持版本、密钥分享、SNI、ALPN
  S->>C: ServerHello：选择参数和密钥分享
  S->>C: EncryptedExtensions + Certificate + CertificateVerify + Finished
  C->>S: Finished
  C->>S: 加密的应用数据
  S-->>C: 加密的应用数据
{% endmermaid %}

{% note warning flat %}
实际握手可能因为重试、会话恢复、客户端认证或 HelloRetryRequest 出现变体。0-RTT 可以减少恢复连接的等待，但早期数据可能被重放，服务端不能把它当成天然安全的非幂等请求通道。
{% endnote %}

### 密钥调度的理解方式

{% note info flat %}
不需要背出所有 HKDF 中间变量，也要能说明依赖关系：握手双方先通过密钥交换获得共享秘密，再结合 transcript 和派生标签生成握手流量密钥、应用流量密钥及更新后的密钥。握手消息受保护后，篡改会导致 Finished 校验失败；应用数据使用与握手阶段不同的密钥。
{% endnote %}

{% note warning flat %}
TLS 1.2 的历史静态 RSA premaster 例子可以用来理解“协商共享秘密”的旧路径，但不应当把它当作 TLS 1.3 的握手描述。现代回答应先说 TLS 1.3，再明确旧版本只是迁移背景。
{% endnote %}

## QUIC

### QUIC 的传输能力

{% note warning flat %}
QUIC 使用 UDP 作为封装入口，但在其内部提供连接 ID、加密包、丢包检测、确认、拥塞控制和多个独立流。它不把 UDP 的“无连接数据报语义”原封不动交给 HTTP/3，而是构造出新的加密传输抽象。
{% endnote %}

{% mermaid %}
flowchart TD
  H3[HTTP/3 请求/响应]
  H3 --> QSTREAM[QUIC stream]
  QSTREAM --> QCONN[QUIC connection：ID/ACK/拥塞/重传]
  QCONN --> TLS13[TLS 1.3 握手与密钥保护]
  QCONN --> UDP[UDP 数据报]
  UDP --> IP[IP 路径]
{% endmermaid %}

### QUIC 对比

| 维度 | TCP + HTTP/2 | QUIC + HTTP/3 |
| --- | --- | --- |
| 传输入口 | TCP | UDP |
| 逻辑并发 | HTTP/2 stream 共享 TCP | QUIC stream 独立传输上下文 |
| 丢包影响 | TCP 按序交付可能阻塞所有上层 stream | 某个 stream 的丢包不必阻塞其他 stream 的应用进度 |
| 加密关系 | TLS 通常在 TCP 之上，HTTP/2 在 TLS 之上 | QUIC 集成 TLS 1.3 握手和密钥保护，HTTP/3 运行于 QUIC |
| 连接迁移 | 主要依赖新连接或上层机制 | Connection ID 支持更灵活的路径变化，具体仍受实现/策略限制 |

{% note warning flat %}
“QUIC 没有连接”与“HTTP/3 就一定更快”都是错误的绝对化表述。QUIC 有自己的连接状态、拥塞和可靠流；实际性能还受 RTT、丢包、服务器、浏览器策略和路径是否允许 UDP 影响。
{% endnote %}

### QUIC 中的 TLS 1.3

{% note info flat %}
QUIC 不是先建立一个普通 UDP 会话、再把 TLS 当作独立的 TLS record 层叠上去。QUIC 使用 TLS 1.3 完成身份认证和密钥协商，但把 TLS 握手字节放进 QUIC 的 `CRYPTO` frame；握手完成后，HTTP/3 的 `STREAM`、`ACK` 等帧由 QUIC 的包保护机制加密。
{% endnote %}

{% mermaid %}
sequenceDiagram
  participant C as 客户端
  participant S as 服务端
  C->>S: QUIC Initial：CRYPTO(ClientHello)
  S->>C: QUIC Initial/Handshake：CRYPTO(ServerHello 等)
  C->>S: Handshake：CRYPTO(Finished)
  C->>S: 1-RTT：STREAM(HTTP/3 请求)
  S-->>C: 1-RTT：ACK + STREAM(响应)
  Note over C,S: QUIC 负责包保护、确认、丢包恢复和拥塞控制；TLS 提供握手密码学
{% endmermaid %}

| 加密级别 | 主要内容 | 观察重点 |
| --- | --- | --- |
| Initial | ClientHello 等早期 TLS 握手字节 | QUIC 连接是否能开始、版本协商/重试是否发生 |
| Handshake | ServerHello 后的握手消息 | 证书、CertificateVerify、Finished 是否完成 |
| 0-RTT | 会话恢复时的早期应用数据 | 可能重放，不能默认承载非幂等操作 |
| 1-RTT | 正常应用数据和 HTTP/3 stream | `STREAM`、`ACK`、丢包恢复与拥塞控制 |

{% note warning flat %}
因此，排查 QUIC 时应分别问三个问题：TLS 握手是否完成、QUIC 是否能够保护并恢复数据包、HTTP/3 stream 是否成功交换。看到 UDP 包存在，不能直接证明 TLS 或 HTTP/3 已经成功。
{% endnote %}

## HTTP/3

### HTTP/3 与 QPACK

{% note info flat %}
HTTP/3 把 HTTP 语义映射到 QUIC stream 和 frame。为了在独立 stream 上压缩字段，HTTP/3 使用 QPACK；它吸收 HPACK 的压缩目标，但调整了动态表引用和阻塞风险，以适配 QUIC 的并发模型。
{% endnote %}

| HTTP/3 对象 | 作用 |
| --- | --- |
| 请求 stream | 承载一个请求/响应交换的头部与内容帧 |
| 控制 stream | 承载设置和连接级控制 |
| QPACK encoder/decoder stream | 同步动态表指令 |
| HEADERS/DATA | 传递 HTTP 字段和内容 |

{% note primary flat %}
QPACK 仍然是压缩，不是加密；真正的机密性和完整性来自 QUIC 使用的 TLS 1.3 密钥保护。动态表大小、引用阻塞和头部上限都可能影响延迟或资源使用。
{% endnote %}

### 部署回退

{% note info flat %}
服务器可以通过 Alt-Svc 等机制向客户端提示 HTTP/3 入口。客户端是否尝试 HTTP/3 还受浏览器、DNS、代理、UDP 可达性、证书和服务器配置影响；失败后通常可以回退到 HTTP/2 或 HTTP/1.1。看到浏览器最终显示 h2，不代表服务器永远不支持 h3，可能只是当前路径回退。
{% endnote %}

部署验证要记录：

1. 客户端是否收到 HTTP/3 能力提示；
2. UDP 目标端口是否可达，是否被企业网络或代理阻断；
3. QUIC/TLS 握手是否完成，证书和 ALPN 是否匹配；
4. 浏览器最终选用的协议和回退原因；
5. HTTP/3 失败后，HTTP/2/TCP 的对照请求是否成功。

{% mermaid %}
flowchart TD
  START[客户端发起 HTTPS 请求] --> HINT{是否收到 Alt-Svc 或已有 h3 能力提示？}
  HINT -- 否 --> TCPTRY[走 TCP + TLS：按 ALPN 尝试 h2/http1.1]
  HINT -- 是 --> UDPTRY[尝试 UDP + QUIC + TLS 1.3]
  UDPTRY --> QOK{QUIC/TLS/证书/ALPN 都成功？}
  QOK -- 是 --> H3OK[使用 HTTP/3]
  QOK -- 否 --> TCPTRY
  TCPTRY --> H2OK{h2 协商成功？}
  H2OK -- 是 --> H2USE[使用 HTTP/2]
  H2OK -- 否 --> H1USE[回退到 HTTP/1.1 或报告失败]
{% endmermaid %}

{% note warning flat %}
这张图表达的是“当前路径的决策”，不是服务器能力的永久结论。企业代理、UDP 防火墙、证书/SAN、ALPN 不匹配或超时都可能让同一站点在不同网络上得到不同的最终协议。
{% endnote %}

## 证书校验

### 证书链和主机名

客户端校验证书不是只看“有没有证书”：

{% mermaid %}
flowchart TD
  CERT[服务端发送证书链] --> SIG[验证签名链到受信任根]
  SIG --> TIME[检查有效期和用途]
  TIME --> NAME[用目标主机名匹配 SAN]
  NAME --> POLICY[检查客户端策略/撤销/密码套件等]
  POLICY --> OK[允许建立安全会话]
  POLICY --> FAIL[证书错误，连接失败或需要明确例外]
{% endmermaid %}

{% note warning flat %}
主机名匹配通常看 Subject Alternative Name，而不是只看 Common Name；证书链要能连接到客户端信任库中的信任锚；有效期、签名算法、用途和客户端策略也会影响结果。使用 curl 的 -k 或浏览器点击继续属于明确降低校验的例外，不应写成生产修复。
{% endnote %}

### SNI 和 ALPN

{% note info flat %}
SNI 在 TLS ClientHello 中提示客户端希望访问的主机名，让一个 IP 上的 TLS 入口选择正确证书和虚拟主机。ALPN 协商应用协议，例如 h2、http/1.1 或 h3 的相关协议标识；它回答“加密连接建立后双方使用哪种应用协议”，不负责验证证书是否属于主机名。
{% endnote %}

| 机制 | 解决的问题 | 失败表现 |
| --- | --- | --- |
| 证书链 | 证书是否由信任路径签发 | unknown CA、链不完整 |
| SAN/主机名 | 证书是否属于目标主机 | hostname mismatch |
| SNI | 服务端选择哪个虚拟主机证书/配置 | 返回默认站点证书或错误站点 |
| ALPN | 双方选择 HTTP/1.1、h2 等应用协议 | 协议回退、握手后协议不匹配 |

{% note warning flat %}
SNI 与主机名校验相关但不是一回事：客户端发送了 SNI，不等于客户端已经信任服务端；服务端选了正确证书，也不等于 ALPN 一定协商出 HTTP/2。
{% endnote %}

## HTTPS 边界

### HTTPS 的规范和部署边界

HTTPS 可以概括为 HTTP 语义在 TLS 保护下传输，但以下问题属于不同边界：

| 问题 | 主要负责层 |
| --- | --- |
| HTTP 方法、状态码、缓存 | HTTP |
| 证书链、主机名、密钥协商 | TLS/PKI |
| 字节可靠交付、拥塞控制 | TCP 或 QUIC |
| 浏览器是否自动升级、是否强制 HTTPS | 浏览器/站点部署政策 |
| 用户是否有业务权限 | 应用认证与授权 |
| CDN/负载均衡在哪里解密 | 部署拓扑和运维策略 |

{% note danger flat %}
因此“HTTPS 等于端到端加密”也要加范围：如果 TLS 在反向代理处终止，代理到上游是否继续使用 TLS 是另一个链路问题；HTTPS 保护传输中的内容，但不会替应用防止日志泄露、服务端越权或客户端恶意脚本。
{% endnote %}

### 协议验证矩阵

{% note info flat %}
下表把协议版本和实验现象转成可以执行的输入、步骤、输出和失败边界。`127.0.0.1:18081` 表示本地 loopback 夹具；公共站点只用于读取协商信息。需要丢弃响应体时，先在同一 shell 运行 `DISCARD_FILE="$(mktemp -t net-discard.XXXXXX)"`，结束后执行 `rm -f "$DISCARD_FILE"`；文章不写死本机临时目录。HTTP/2 示例固定使用 `https://example.com/` 和 `/robots.txt` 作为只读目标；HTTP/3 示例默认使用 `https://cloudflare-quic.com/`，也可以由执行者替换为已获授权且先确认支持 h3 的目标。命令是验证输入和预期输出形状，不把未执行的示例冒充为本次构建已经观察到的结果；执行时应保存脱敏后的最小证据。
{% endnote %}

| 实验主题 | 输入与步骤 | 预期输出/证据 | 失败边界 |
| --- | --- | --- | --- |
| 持久连接 | `curl --http1.1 -v http://127.0.0.1:18081/keep-alive http://127.0.0.1:18081/framing`，在同一命令中请求两个资源 | verbose 日志显示第二个请求复用同一连接，夹具日志记录同一对端连接 | 服务端主动关闭仍可能是合法策略，不能仅凭未复用判定 TCP 故障 |
| 消息分帧 | `curl --http1.1 -v http://127.0.0.1:18081/framing`，同时保存响应头和原始抓包 | `Content-Length` 与实际内容字节一致；响应结束后下一条消息可被解析 | 长度不一致、半条响应或代理解析差异会表现为等待/拼接，需停止实验夹具 |
| chunked | 请求 `/chunked`，用 tcpdump/Wireshark 观察原始 HTTP/1.1 字节 | 看到十六进制块长度、数据块和 `0` 终止块；curl 展示组装后的正文 | curl 把分块细节隐藏时不能当作“没有 chunked”，要看原始字节或服务端日志 |
| 二进制帧 | `nghttp -nv https://example.com/`；若没有 `nghttp`，先用 `curl --http2 -v https://example.com/` 只验证 ALPN | `nghttp` 日志可见 SETTINGS、HEADERS、DATA；curl 可见 `ALPN: server accepted h2` 等协商证据 | 客户端不支持 h2、服务端未提供 h2、`nghttp` 未安装或没有合法解密材料时，只能验证协商结果 |
| stream/frame/message | `nghttp -nv https://example.com/ https://example.com/robots.txt`，记录 stream ID 与 frame 日志 | 一个 HTTP message 由某个 stream 上的多种 frame 组成，两个 stream 的帧可以交错 | 只看最终正文会丢失线格式证据；必须保留 stream/frame 日志，且说明是否使用了同一连接 |
| 多路复用 | 对上述两个 URI 运行同一条 `nghttp -nv`；若需要控制时延，换成已授权 h2 夹具的 `/slow` 与 `/small` 路径 | 不同 stream 的 HEADERS/DATA 交错；一个应用响应变慢不必阻塞所有 stream | 公共目标不保证大小和时延；TCP 丢包仍可能让整条连接等待，不能把“应用层不阻塞”说成“完全无队头阻塞” |
| HPACK | `nghttp -nv -H 'x-demo: repeat' https://example.com/ https://example.com/robots.txt`，查看 HEADERS/SETTINGS；必要时使用测试环境 TLS key log | 动态表/索引参数和压缩头块证据可见，重复字段的线格式成本下降 | 无解密密钥时不能从普通 HTTPS 抓包还原头部；不要导出生产密钥，也不要用真实 Cookie |
| 流控 | 在本地 HTTP/2 夹具启动后，运行 `curl --http2 --cacert "$H2_DIR/cert.pem" "$H2_URL/slow"`；若有 nghttp2，再运行 `nghttp -nv -y "$H2_URL/slow"` 保留逐 frame 日志 | 大响应触发 stream/connection window 与 `WINDOW_UPDATE`；服务端写入背压和 h2 frame 时序可对照 | 当前 curl 输出不一定显示每个 WINDOW_UPDATE；没有逐 frame 工具或服务端日志时标记 NOT VERIFIED，TCP rwnd 与 HTTP/2 window 不能混为一谈 |
| stream 生命周期 | HTTP/2 夹具提供的 `curl --http2 --cacert "$H2_DIR/cert.pem" -v "$H2_URL/reset"` 与 `curl --http2 --cacert "$H2_DIR/cert.pem" -v "$H2_URL/goaway"`，有 nghttp2 时再分别运行 `nghttp -nv -y "$H2_URL/reset"` 和 `nghttp -nv -y "$H2_URL/goaway"`，保留客户端和服务端日志 | `/reset` 对单 stream 产生取消，`/goaway` 产生连接级关闭信号；逐 frame 工具可记录 last-stream-ID | curl 只能给出错误/关闭形态时，不把 TCP 断开写成 RST_STREAM；必须标注逐 frame 证据是否存在 |
| 压缩限制与风险 | HTTP/2 夹具停止第一进程后，分别以 `H2_HEADER_TABLE_SIZE=4096`、`H2_HEADER_TABLE_SIZE=0` 加环境变量重启，再运行 `curl --http2 --cacert "$H2_DIR/cert.pem" -H 'x-demo: repeat' "$H2_URL/headers"` 并记录 SETTINGS | 可对照动态表大小、重复字段和实现日志；头部压缩仍不等于加密 | 不应使用生产 Cookie 做压缩实验；当前没有逐 frame 日志时只报告 SETTINGS/响应字段，并标注 HPACK 线格式未完整验证 |
| TLS 1.3 握手 | `printf '' | openssl s_client -connect example.com:443 -servername example.com -alpn h2,http/1.1 -tls1_3` | `Protocol: TLSv1.3`、证书链摘要、ALPN 和握手完成状态 | DNS、TCP、证书或服务端策略失败时，不能直接归因于 TLS 密钥调度 |
| 密钥调度 | 先运行 `KEYLOG_FILE="$(mktemp -t net-tls-keylog.XXXXXX)"`，再以 `SSLKEYLOGFILE="$KEYLOG_FILE" curl --http2 -sS -v https://example.com/ -o "$DISCARD_FILE"` 发起请求；用 Wireshark 的 `tls.keylog_file` 指向 `"$KEYLOG_FILE"`，分析后执行 `rm -f "$KEYLOG_FILE"` | key log 只用于本次隔离抓包；可区分握手和应用流量保护阶段，报告不含密钥值 | 先确认 curl 后端支持 key log；不应从公开站点或生产流量导出密钥，文件用后立即删除；没有合法 key log 时只验证握手摘要 |
| QUIC 传输 | 先用 `tcpdump -D` 选择真实接口并设置 `CAPTURE_IFACE`（macOS 默认可用 `en0`），再运行 `curl --http3 -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"` 与 `sudo tcpdump -ni "$CAPTURE_IFACE" -c 40 'udp port 443'` | UDP 包、QUIC packet number/ACK、stream 交换和拥塞/丢包事件（可用 qlog） | `any` 不是 macOS 的通用接口；只有 UDP 包不等于 QUIC 连接成功；curl 不支持 h3、目标不支持 h3 或 UDP 被阻断时要记录回退/能力错误 |
| QUIC + TLS 1.3 | 先设置 `CAPTURE_IFACE`，再抓包：`sudo tcpdump -ni "$CAPTURE_IFACE" -c 60 -w quic.pcap 'udp port 443'`；请求后用 `tshark -r quic.pcap -Y quic -T fields -e quic.packet_type`，实现支持时另存 qlog | 能把 Initial、Handshake、0/1-RTT 与 `CRYPTO` 语义对应起来；TLS 握手字节位于 QUIC CRYPTO frame，包保护由 QUIC 完成 | 未配置实现级 qlog 或没有合法解密材料时，tshark 可能只能给包级类型；不能只凭 UDP 证明 TLS 成功，实验后删除 pcap/key log |
| HTTP/3 与 QPACK | `curl --http3 -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"`；在支持 HTTP/3 解码的分析器中按连接观察请求 stream、控制 stream 和 QPACK stream | 可区分 HEADERS/DATA、控制帧、QPACK 编解码器流；字段压缩仍不是加密 | 无 qlog/解密材料或分析器不支持 HTTP/3 时不要虚构头部内容，只报告协议协商和包级证据 |
| 部署与回退 | 先用 `H3_HEADERS=$(mktemp)`，执行 `curl -sSI https://cloudflare-quic.com/ -o "$H3_HEADERS"`，再分别读取 `grep -i '^alt-svc:' "$H3_HEADERS"` 和 `grep -i '^server:' "$H3_HEADERS"`；成功基线运行 `curl --http3 -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"` 与 `curl --http2 -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"`，最后 `rm -f "$H3_HEADERS"` | 成功路径显示 h3/Alt-Svc；在已获准的网络策略/实验环境阻断 UDP/443 后，`curl --http3-only -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"` 失败，HTTP/2 对照仍可记录，浏览器路径再观察 h2 回退 | 当前课程夹具不安全地改动企业网络策略，因此自动浏览器回退标记为 NOT VERIFIED；目标可能变更能力或不返回 Alt-Svc，不能把手工 h2 对照冒充自动回退 |
| 证书链与主机名 | 在本地 TLS 夹具的同一 shell、`LAB_DIR` 和 `localhost:18443` 仍有效时，运行 `curl --cacert "$LAB_DIR/cert.pem" https://localhost:18443/` 与 `openssl verify -CAfile "$LAB_DIR/cert.pem" "$LAB_DIR/cert.pem"` | 信任链、有效期、用途和 `localhost` SAN 通过；不带 `--cacert` 的对照请求应在证书信任阶段失败 | `-k` 只关闭校验，不是修复；夹具清理后 `$LAB_DIR` 不再存在，不能把脱离夹具的命令当作已验证 |
| SNI 与 ALPN | 在 TLS 夹具服务器仍运行时，`printf '' | openssl s_client -connect localhost:18443 -servername localhost -alpn h2,http/1.1 -CAfile "$LAB_DIR/cert.pem"` | 输出证书主题/SAN、Verify return code 和实际 ALPN；SNI 使用 `localhost` 作为虚拟主机选择输入 | `openssl s_server` 未配置 h2 时可能只协商 http/1.1 或无共同 ALPN；证书正确不等于 ALPN 成功 |
| TLS 迁移 | 对 loopback TLS 夹具分别执行 `printf '' | openssl s_client -connect localhost:18443 -servername localhost -tls1_2 -CAfile "$LAB_DIR/cert.pem"` 与同样参数的 `-tls1_3` | 记录版本、密码套件、握手消息和服务端允许策略，形成迁移对照 | 不要为了验证旧版本打开已淘汰的弱协议；本地 s_server 的构建和证书算法可能限制 TLS 1.2 对照，失败要标注实现边界 |
| HTTPS 边界 | 在本地代理夹具启动后，执行 `curl --cacert "$PROXY_DIR/cert.pem" -sS -D - https://localhost:18445/fixed-502`，再对照 `curl -sS -D - http://127.0.0.1:18082/fixed-502` 和 `proxy.log` | 第一条是 TLS 客户端→代理→明文上游的同一链路，`X-Proxy-Leg`、502 和两端日志明确终止点与上游协议 | 代理夹具清理后变量和端口失效；若没有代理日志，不能把两个独立请求冒充同一代理链路，也不能把客户端安全推论为上游安全 |
| 演进面试图 | 对同一授权目标 `https://cloudflare-quic.com/` 分别运行 `curl --http1.1 -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"`、`curl --http2 -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"`、`curl --http3 -v https://cloudflare-quic.com/ -o "$DISCARD_FILE"`，再将 ALPN、Alt-Svc、UDP 和最终 Protocol 列填入回退图 | 得到“语义→线格式→传输→TLS/证书→ALPN→最终 HTTP 版本”的矩阵 | 只看锁图标或最终状态码无法回答协议演进、失败层和回退原因；每个版本都要标记未支持/未验证边界 |

{% note warning flat %}
验证报告至少保留：输入命令、目标与时间、关键输出、抓包/日志过滤器、未验证项和清理动作。正式环境中的授权、隐私和密钥材料优先级高于“拿到更完整的协议截图”。
{% endnote %}

### 用工具观察协议选择

{% note info flat %}
以下命令只读取公共示例站点的协商信息；本地 curl 是否编译了 HTTP/2/3 支持、目标站点是否提供某协议，都需要以实际输出为准，文章不把命令写成已执行结果。
{% endnote %}

~~~bash
DISCARD_FILE="$(mktemp -t net-discard.XXXXXX)"
trap 'rm -f "$DISCARD_FILE"' EXIT

# 查看 TLS 证书、SNI 和 ALPN 选择
printf '' | openssl s_client -connect example.com:443 -servername example.com -alpn h2,http/1.1

# 明确指定 HTTP/1.1 或 HTTP/2；若客户端不支持，命令会报告能力错误
curl -sS -v --http1.1 https://example.com/ -o "$DISCARD_FILE"
curl -sS -v --http2 https://example.com/ -o "$DISCARD_FILE"

# HTTP/3 需要 curl 和目标站点都支持；失败时记录回退/能力信息
curl -sS -v --http3 https://example.com/ -o "$DISCARD_FILE"
~~~

{% note warning flat %}
观察顺序是：TCP 或 UDP/QUIC 入口 → TLS 版本与证书 → ALPN → HTTP 版本 → 状态码和内容。不要只凭地址栏的锁图标判断协议版本，也不要用 curl 的一次失败推断整个网络不支持 HTTP/3。
{% endnote %}

{% folding "现代 HTTP 面试陷阱" %}

- HTTP/2 解决了应用层多路复用，但没有消除 TCP 丢包导致的传输层队头阻塞。
- QUIC 使用 UDP 只是封装入口；它仍有连接、确认、重传、拥塞控制和 TLS 1.3。
- QPACK/HPACK 是字段压缩，不是加密；证书和 TLS 密钥保护负责不同目标。
- SNI 让服务端选虚拟主机，ALPN 让双方选应用协议，二者都不替代主机名校验。
- HTTPS 是 HTTP over TLS 的组合，不等于业务认证、端到端拓扑或所有部署节点都不解密。
- HTTP/3 失败可能回退到 HTTP/2；最终看到 h2 需要结合 Alt-Svc、UDP、QUIC 和浏览器日志分析。

{% endfolding %}

## 现代协议复习

{% note info flat %}
先按“语义 → 线格式 → 传输 → TLS → 证书/协议协商”的顺序重画演进图，再查看答案。
{% endnote %}

{% flashcard basic id:CN-MOD-001 deck:"计算机网络" priority:1 tags:"HTTP/1.1,持久连接,分帧" %}
--- question
HTTP/1.1 持久连接为什么要求严格理解消息分帧？
--- answer
一条 TCP 连接承载多个请求/响应，双方必须准确知道每条消息的内容边界；常见依据是状态语义、Content-Length、chunked 或连接关闭。
--- explanation
长度字段冲突或代理解析不一致可能导致等待、响应拼接或请求走私。持久连接解决复用，不自动解决边界。

持久连接的关键是能确定每条消息在哪里结束：

| 边界依据 | 适用线索 | 风险 |
| --- | --- | --- |
| Content-Length | 已知长度的消息 | 长度冲突 |
| chunked | 分块传输 | 代理解析不一致 |
| 连接关闭 | 响应结束 | 无法继续复用 |

连接复用只解决“重复建连接”的成本，不会替应用协议修复模糊边界。
{% endflashcard %}

{% flashcard basic id:CN-MOD-002 deck:"计算机网络" priority:1 tags:"HTTP/2,多路复用" %}
--- question
HTTP/2 的 message、stream、frame、connection 如何分层？
--- answer
message 是 HTTP 请求/响应语义，stream 是一次逻辑交换，frame 是在线路上传输的单位，connection 承载多个 stream。
--- explanation
HTTP/2 让不同 stream 的帧交错，缓解应用层队头阻塞；但底层 TCP 丢包仍可能阻塞按序字节交付。

HTTP/2 的层级可以画成：

~~~text
一个 connection
  ├─ stream 1：一个逻辑请求/响应
  │    └─ 多个 frame
  └─ stream 2：另一个逻辑请求/响应
~~~

帧可以交错，但它们仍共享底层 TCP 的按序字节流；因此应用层队头阻塞减轻了，传输层丢包影响没有消失。
{% endflashcard %}

{% flashcard basic id:CN-MOD-003 deck:"计算机网络" priority:1 tags:"HPACK,HTTP/2,流控" %}
--- question
HPACK 和 HTTP/2 流控分别解决什么问题？
--- answer
HPACK 压缩重复字段，连接/stream 流控限制接收方愿意接收的字节量；二者都不是 TCP 接收窗口，也不是加密。
--- explanation
动态表和 WINDOW_UPDATE 都属于 HTTP/2 连接状态。排障时要区分字段解码、HTTP/2 窗口耗尽、TCP rwnd 和应用读取速度。

先区分“节省字段字节”和“限制发送量”：

| 机制 | 管理的状态 | 解决的问题 |
| --- | --- | --- |
| HPACK | 静态/动态表 | 重复字段压缩 |
| WINDOW_UPDATE | stream/connection 窗口 | 接收方可接收的字节量 |
| TCP rwnd | TCP 接收窗口 | 传输层缓存压力 |
{% endflashcard %}

{% flashcard basic id:CN-MOD-004 deck:"计算机网络" priority:1 tags:"TLS 1.3,握手" %}
--- question
TLS 1.3 握手要完成哪些核心目标？
--- answer
协商密码与密钥交换参数，建立受保护的握手和应用流量密钥，并通过证书/签名让客户端验证服务端身份。
--- explanation
TLS 负责加密传输和端点认证机制，不负责 HTTP 方法或业务授权。0-RTT 虽减少等待，但早期数据要考虑重放。

一次 HTTPS 协商要把身份、协议和密钥分开核对：

| 观察项 | 主要回答 | 不是它负责的 |
| --- | --- | --- |
| 证书链/SAN | 服务端身份是否可信且匹配 | 业务授权 |
| SNI | 服务端选择哪个虚拟主机 | 信任本身 |
| ALPN | 选 h2、h3 等应用协议 | 证书匹配 |
| TLS 密钥 | 传输机密性和完整性 | HTTP 方法语义 |
{% endflashcard %}

{% flashcard basic id:CN-MOD-005 deck:"计算机网络" priority:1 tags:"QUIC,UDP,TLS 1.3" %}
--- question
QUIC 为什么不能简单理解为“没有连接的 UDP”？
--- answer
QUIC 在 UDP 上实现了连接 ID、确认、丢包恢复、拥塞控制、独立流和加密，并集成 TLS 1.3 握手。
--- explanation
UDP 只提供无连接的数据报发送入口；QUIC 在这些数据报之上自己维护连接 ID、确认、丢包恢复、拥塞控制、独立 stream (逻辑数据流) 和 TLS 1.3 加密。HTTP/3 再把 HTTP 语义映射到 QUIC，因此“使用 UDP”不等于没有连接、可靠性或安全状态。

可以按职责看这一层关系：

| 层 | 负责什么 |
| --- | --- |
| UDP | 传送数据报，不保证顺序和重传 |
| QUIC | 连接状态、可靠传输、拥塞控制、并发 stream 和 TLS |
| HTTP/3 | 方法、状态、字段等 HTTP 语义 |

QUIC 的连接状态由 QUIC 自己维护，而不是由 UDP 提供；所以不能因为抓到 UDP 包就把它当成普通、无状态的 UDP 应用。
{% endflashcard %}

{% flashcard basic id:CN-MOD-006 deck:"计算机网络" priority:1 tags:"HTTP/3,QPACK" %}
--- question
HTTP/3 和 QPACK 的关系是什么？
--- answer
HTTP/3 把 HTTP 语义映射到 QUIC stream/frame，QPACK 用于压缩 HTTP 字段，适配 QUIC 的并发流模型。
--- explanation
QPACK 是压缩，不是加密；机密性和完整性来自 QUIC 的 TLS 1.3 密钥保护。动态表和引用阻塞仍可能影响延迟。

把现代协议的职责拆开：

| 层 | 负责什么 |
| --- | --- |
| UDP | 提供可控的数据报封装入口 |
| QUIC | 连接 ID、确认、丢包恢复、拥塞控制、独立流和 TLS |
| HTTP/3 | 把 HTTP 语义映射到 QUIC |
| QPACK | 压缩 HTTP 字段 |

所以“使用 UDP”不能推出“没有连接、可靠性或加密”。
{% endflashcard %}

{% flashcard basic id:CN-MOD-007 deck:"计算机网络" priority:1 tags:"证书,SNI,ALPN" %}
--- question
证书链、主机名校验、SNI 和 ALPN 各自解决什么问题？
--- answer
证书链验证信任路径，主机名校验证书是否属于目标，SNI 帮服务端选择虚拟主机，ALPN 协商应用协议版本/协议。
--- explanation
SNI 不等于信任，ALPN 不等于证书匹配；SAN、有效期、用途和客户端信任库仍需单独验证。

一次 HTTPS 协商要把身份、协议和密钥分开核对：

| 观察项 | 主要回答 | 不是它负责的 |
| --- | --- | --- |
| 证书链/SAN | 服务端身份是否可信且匹配 | 业务授权 |
| SNI | 服务端选择哪个虚拟主机 | 信任本身 |
| ALPN | 选 h2、h3 等应用协议 | 证书匹配 |
| TLS 密钥 | 传输机密性和完整性 | HTTP 方法语义 |
{% endflashcard %}

{% flashcard basic id:CN-MOD-008 deck:"计算机网络" priority:1 tags:"HTTPS,边界,回退" %}
--- question
为什么不能把“HTTPS”“HTTP/3”“端到端加密”当成同义词？
--- answer
HTTPS 是 HTTP over TLS，HTTP/3 是 HTTP 语义 over QUIC，TLS 可能在反向代理终止；协议能力、传输版本和部署拓扑是不同维度。
--- explanation
HTTPS 通常表示 HTTP 语义由 TLS 保护，但 TLS 在反向代理或负载均衡器处终止后，代理到上游可能是另一段连接；HTTP/3 则表示 HTTP 语义运行在 QUIC 上。端到端加密要先明确“端到端”的两端是谁，不能只看浏览器地址栏的 HTTPS。

| 名称 | 说明 | 不能直接推出 |
| --- | --- | --- |
| HTTPS | HTTP over TLS，保护到 TLS 终止点 | 业务已经授权 |
| HTTP/3 | HTTP 语义 over QUIC | 所有链路都使用 UDP |
| 端到端加密 | 指定两端之外的节点不能读取内容 | 代理/服务端一定看不到内容 |

因此回答时要画出客户端、代理和上游的 TLS 终止点，并说明协议可能从 h3 回退到 h2；协议版本、传输保护和业务授权是不同结论。
{% endflashcard %}

## 常见问题

{% flashcard_ref id="CN-MOD-004" %}
{% flashcard_ref id="CN-MOD-005" %}

{% flashcard basic id:CN-MOD-FAQ-001 deck:"计算机网络" priority:1 tags:"HTTP/2,队头阻塞,QUIC" %}
--- question
HTTP/2 是否完全消除了队头阻塞？
--- answer
没有。HTTP/2 的多个 stream 共享 TCP 连接，缓解了 HTTP 层一个响应阻塞其他响应的问题，但 TCP 丢包仍会影响连接上的后续字节。
--- explanation
HTTP/2 把多个 stream 的帧交错放进同一条 TCP 连接。这样一个慢的 HTTP 响应不必阻塞其他 stream 的应用层排队，但 TCP 仍按序交付字节；其中一个 TCP 包丢失时，连接上后续 stream 的字节也可能一起等待重传。HTTP/3 使用 QUIC 的独立 stream，能缩小这种传输层影响，但 DNS、代理、应用队列和单个 stream 内部仍可能产生延迟。

所以“HTTP/2 消除了队头阻塞”只说对了一半：它缓解了 HTTP 层的队头阻塞，没有消除 TCP 层和应用层的所有阻塞。
{% endflashcard %}

{% flashcard basic id:CN-MOD-FAQ-002 deck:"计算机网络" priority:1 tags:"HTTP/3,QUIC,UDP" %}
--- question
HTTP/3 为什么使用 UDP？
--- answer
QUIC 需要构造多流、连接迁移和加密传输语义，使用 UDP 作为用户态可控的封装入口；这不是放弃可靠性。
--- explanation
HTTP/3 选择 UDP，是为了让 QUIC 在用户态直接控制连接 ID、握手、丢包恢复、拥塞控制和多流调度，而不被 TCP 的单一有序字节流模型固定。UDP 本身仍不提供可靠性和加密，QUIC 补上这些能力后才形成可用传输；因此不是“UDP 自动变可靠”，而是 QUIC 叠加了完整机制。

| 观察到的层 | 能确认 | 不能确认 |
| --- | --- | --- |
| UDP 包 | 数据报到达了某个抓包点 | QUIC 连接或 HTTP/3 成功 |
| QUIC 握手/确认 | QUIC 状态正在建立或传输 | 业务响应正确 |
| HTTP/3 响应 | 应用层返回了结果 | 所有链路节点都无法解密 |
{% endflashcard %}

{% flashcard basic id:CN-MOD-FAQ-003 deck:"计算机网络" priority:1 tags:"SNI,证书,HTTPS" %}
--- question
有了 SNI，证书就一定正确吗？
--- answer
不一定。SNI 只提示服务端选择哪个虚拟主机，客户端仍需验证证书链、SAN 主机名、有效期、用途和本地策略。
--- explanation
SNI (Server Name Indication) 只是客户端在 TLS 握手中告诉服务端“想访问哪个主机”，帮助服务端选择证书和虚拟主机；它不是证书校验本身。即使 SNI 正确，客户端仍要检查证书链是否可信、SAN (Subject Alternative Name) 是否匹配目标主机、有效期/用途和本地信任库，否则连接仍应失败。

| 检查 | 回答的问题 |
| --- | --- |
| SNI | 服务端选择哪个虚拟主机 |
| 证书链 | 证书是否由可信路径签发 |
| SAN | 证书是否覆盖目标主机名 |
| 有效期/用途 | 证书当前是否可用于该连接 |

排障时分别记录发送的 SNI、服务端返回的证书和客户端的验证错误，不能用“命中了正确虚拟主机”代替信任结论。
{% endflashcard %}

{% flashcard basic id:CN-MOD-FAQ-004 deck:"计算机网络" priority:2 tags:"HTTP/2,HTTP/3,ALPN" %}
--- question
为什么同一个网站有时是 h2，有时是 h3？
--- answer
客户端能力、Alt-Svc、UDP 可达性、代理/防火墙、QUIC 握手和服务器负载都会影响协议选择。
--- explanation
同一个网站能走 h2 或 h3，是因为“支持”不等于“本次连接最终协商成功”。客户端可能从 `Alt-Svc` 得知 h3，随后还要验证 UDP/443 可达、QUIC 握手和代理策略；失败后可能回到 TCP 上的 h2。`ALPN` (应用层协议协商) 的结果、QUIC 错误和回退原因才是本次连接的证据。

| 证据 | 说明 |
| --- | --- |
| `Alt-Svc` | 服务端建议可尝试的协议/端点 |
| UDP/QUIC | h3 的路径和握手是否成功 |
| `ALPN` | TLS/QUIC 最终选出的应用协议 |
| TCP/TLS | 回退到 h2/h1 后的连接结果 |

所以要在同一网络和同一客户端记录最终协议；不能只看站点文档写着“支持 HTTP/3”。
{% endflashcard %}

{% flashcard basic id:CN-MOD-FAQ-005 deck:"计算机网络" priority:1 tags:"HTTPS,证书,安全" %}
--- question
证书错误时加 -k 是正确修复吗？
--- answer
不是。`-k` 关闭客户端证书校验，只适合明确隔离的临时测试。
--- explanation
`curl -k` (或 `--insecure`) 会关闭客户端对证书的校验，只能作为隔离测试中确认“应用层是否另有响应”的临时手段；它会掩盖中间人攻击、错误主机和过期证书，不能算生产修复。

正式修复应按顺序检查证书链、SAN、客户端信任库、SNI/虚拟主机和系统时间。测试环境需要自签名证书时，应把获准的测试 CA 以显式 `--cacert` 提供，而不是关闭所有校验或修改全局信任库。
{% endflashcard %}

## 参考资料

### HTTP/1.1、HTTP/2、HTTP/3 与 QUIC 规范

{% linkgroup %}
{% link RFC 9112：HTTP/1.1, https://www.rfc-editor.org/rfc/rfc9112.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9113：HTTP/2, https://www.rfc-editor.org/rfc/rfc9113.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 7541：HPACK, https://www.rfc-editor.org/rfc/rfc7541.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9114：HTTP/3, https://www.rfc-editor.org/rfc/rfc9114.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9204：QPACK, https://www.rfc-editor.org/rfc/rfc9204.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9000：QUIC Transport, https://www.rfc-editor.org/rfc/rfc9000.html, https://www.rfc-editor.org/favicon.ico %}
{% endlinkgroup %}

### TLS、QUIC 加密与服务身份

{% linkgroup %}
{% link RFC 8446：TLS 1.3, https://www.rfc-editor.org/rfc/rfc8446.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9001：Using TLS to Secure QUIC, https://www.rfc-editor.org/rfc/rfc9001.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 5280：X.509 Public Key Infrastructure, https://www.rfc-editor.org/rfc/rfc5280.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9525：Service Identity in TLS, https://www.rfc-editor.org/rfc/rfc9525.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 6066：TLS Extensions, https://www.rfc-editor.org/rfc/rfc6066.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 7301：Application-Layer Protocol Negotiation, https://www.rfc-editor.org/rfc/rfc7301.html, https://www.rfc-editor.org/favicon.ico %}
{% endlinkgroup %}

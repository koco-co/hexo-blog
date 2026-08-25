---
title: "计算机网络(五)HTTP 协议"
tags:
  - "计算机网络"
  - "HTTP"
  - "Web"
categories:
  - "Learn Topic"
  - "计算机网络"
description: "从资源、表示、消息和字段出发，系统掌握 HTTP 方法、状态码、缓存、Cookie、CORS、代理与面试分析证据。"
cover: /img/picgo-images/computer-network-course-cover.png
series: "计算机网络"
series_order: 5
published: true
abbrlink: '366484e7'
date: 2026-08-25 06:30:00
---

{% course_series %}

{% note info flat %}
本文把“打开一个网址”拆成可逐字段阅读的 HTTP 模型：请求针对什么资源、携带什么表示、使用什么方法；响应如何用状态码、字段和内容表达结果；缓存、Cookie、CORS、认证、代理和网关又在哪一层改变观察到的行为。
{% endnote %}

## HTTP 消息

### 先区分资源、表示和消息

{% note info flat %}
现代 HTTP 语义中，资源是被请求的目标概念，表示是资源在某个时刻以某种媒体类型呈现的数据，消息是传输这些语义的协议载体。一个 URL 指向的资源可以产生 JSON、HTML 或图片等不同表示；请求和响应则是承载元数据与内容的消息。
{% endnote %}

{% mermaid %}
flowchart TD
    URL[目标资源] --> NEG[内容协商]
    NEG --> REP[选定表示：媒体类型/语言/编码]
    REP --> MSG[HTTP 请求或响应消息]
    MSG --> FIELD[字段：缓存/认证/协商/分帧]
    MSG --> CONTENT[内容：表示数据]
{% endmermaid %}

{% note info flat %}
“实体”“通用头”“请求头”“响应头”是旧资料中常见的分类词。学习旧笔记时可以识别它们，但新的回答优先围绕消息、字段、内容、表示和目标资源来描述，因为同一个字段的语义可能同时影响缓存、条件请求、代理和内容处理。
{% endnote %}

### 内容协商

{% note info flat %}
客户端可以通过 Accept、Accept-Language、Accept-Encoding 等字段表达希望的表示，服务端据此选择媒体类型、语言或编码。响应中的 Vary 告诉缓存：哪些请求字段参与了这个表示的选择；如果忽略 Vary，缓存可能把给中文客户端的表示错误地提供给英文客户端。
{% endnote %}

| 输入 | 响应 | 解释 |
| --- | --- | --- |
| Accept: application/json | Content-Type: application/json | 服务端选择 JSON 表示 |
| Accept-Language: zh-CN | Content-Language: zh-CN | 服务端选择中文变体 |
| 不支持服务端可提供的媒体类型 | 406 Not Acceptable（若服务端采用该语义） | 内容协商没有合适结果 |
| 响应带 Vary: Accept-Language | 缓存按语言请求字段区分键 | 防止跨语言复用错误变体 |

{% note info flat %}
一个最小的可核对请求形状是：
{% endnote %}

~~~http
GET /profile HTTP/1.1
Host: api.example.test
Accept: application/json
Accept-Language: zh-CN

HTTP/1.1 200 OK
Content-Type: application/json
Content-Language: zh-CN
Vary: Accept, Accept-Language

{"message":"你好"}
~~~

{% note info flat %}
这里只展示协议形态，不声称目标站点已经返回此内容；实际验证要同时保存请求的 Accept、响应的 Content-Type/Vary 和缓存键。
{% endnote %}

### 请求和响应的骨架

~~~http
GET /articles/42 HTTP/1.1
Host: example.test
Accept: application/json
Accept-Language: zh-CN
If-None-Match: "article-42-v7"


HTTP/1.1 304 Not Modified
ETag: "article-42-v7"
Cache-Control: max-age=60

~~~

{% note info flat %}
请求的起始行包含方法、目标和协议版本；响应的起始行包含版本、状态码和原因短语。两者都由字段和可选内容组成。空行标记字段区域结束，但具体消息如何确定内容长度还要看协议版本和分帧规则，不能把“看到空行”直接等同于“响应结束”。
{% endnote %}

| 部分 | 请求 | 响应 | 面试关注点 |
| --- | --- | --- | --- |
| 起始行 | 方法 + 目标 + 版本 | 版本 + 状态码 + 短语 | 语义意图不同 |
| 字段 | Host、Accept、Authorization、条件字段 | Content-Type、Cache-Control、ETag、Location | 字段决定协商、缓存和安全边界 |
| 内容 | 可选请求内容 | 可选响应内容 | MIME 类型和分帧不能混为一谈 |
| 传输版本 | HTTP/1.1 文本消息等 | HTTP/2/3 会映射到帧和流 | 语义与线格式是两个维度 |

### 内容类型、长度和分帧

{% note info flat %}
Content-Type 说明内容的媒体类型以及可能的参数，例如 application/json 或 text/html; charset=utf-8。Content-Length 表示消息内容的字节数；它不是字符数，也不是压缩前的源文件大小。HTTP/1.1 的消息分帧还涉及 Transfer-Encoding、连接关闭和响应语义，后续现代 HTTP 文章会继续解释 HTTP/2 和 HTTP/3 的帧层。
{% endnote %}

{% note info flat %}
在 HTTP/1.1 中，解析消息边界必须先看响应是否按语义没有内容，再看长度和传输编码。若同一消息同时出现 `Transfer-Encoding` 与 `Content-Length`，消息分帧由 `Transfer-Encoding` 控制，`Content-Length` 不能继续作为边界；发送端不应生成这种组合，接收端应把它当作高风险的解析歧义，按 RFC 9112 和本地安全策略拒绝、记录并关闭连接，而不是让不同代理各自猜测。chunked 的每一块以十六进制长度开始，长度为 0 的终止块结束块序列，后面可以有 trailer 字段；连接关闭只能作为明确允许的旧式结束方式，不能拿来掩盖错误长度。
{% endnote %}

| 输入/响应形态 | 预期边界 | 验证重点 |
| --- | --- | --- |
| `Content-Length: 12` 且内容 12 字节 | 读取 12 字节后结束当前消息 | 原始字节数与连接上下一条消息 |
| `Transfer-Encoding: chunked` | 逐块读取，遇到 0 长度块和 trailer 结束 | 每块长度、终止块、后续复用 |
| 任意 `1xx` 响应 | 按语义没有响应内容，继续等待最终响应 | 不能把中间响应当成业务结果 |
| `204` 响应 | 按语义没有响应内容 | 状态语义优先于看见的字段 |
| `304` 或 HEAD 响应 | 不把响应体当作普通内容；HEAD 可带与对应 GET 相同的元数据 | 状态/方法语义优先于看见的字段 |
| 成功的 CONNECT 响应（2xx） | 空行后切换为隧道，不再按普通 HTTP 响应读取内容 | 连接模式切换与代理日志 |
| 长度声明大于实际收到 | 消息不完整或连接中断 | 客户端错误、抓包 FIN/RST、代理日志 |
| 长度声明与传输编码冲突 | 解析歧义/安全风险 | 代理和源站是否使用同一解析规则 |

{% note info flat %}
教学形态的 chunked 输入/输出如下，实际运行应放在隔离夹具：
{% endnote %}

~~~http
HTTP/1.1 200 OK
Transfer-Encoding: chunked

5
hello
0
X-Debug: fixture

~~~

{% note info flat %}
验证时应确认客户端收到 hello、识别 0 块结束，并按实现规则处理 trailer；如果删掉 0 块或只发送 3 个字节就关闭连接，结果应被记录为不完整响应，而不是成功内容。
{% endnote %}

{% note info flat %}
仅用于静态审阅的冲突字段形态如下，不要把它发送到生产代理：
{% endnote %}

~~~http
POST /upload HTTP/1.1
Host: fixture.example.test
Content-Length: 4
Transfer-Encoding: chunked

4
test
0
~~~

{% note info flat %}
预期验证不是“哪个长度优先”的经验答案，而是确认各组件是否按同一 RFC 9112 解析规则拒绝或安全结束连接，并检查是否产生安全告警；真实测试应在隔离代理夹具中完成。
{% endnote %}

| 现象 | 可能原因 | 证据 |
| --- | --- | --- |
| 客户端解析到半个 JSON | Content-Length 错误、连接中断或上游截断 | 原始响应头、接收字节数、代理日志 |
| 浏览器把 JSON 当成下载 | Content-Type 或 Content-Disposition 不符合预期 | Response Headers、浏览器 MIME 处理 |
| 请求主体没有被服务端识别 | Content-Type 与实际编码不一致 | 请求头、服务端解析日志、原始 Payload |
| 代理出现响应拼接风险 | 长度和分帧字段冲突 | HTTP/1.1 原始消息、代理规范和安全日志 |

## 消息语义

### 方法属性

这三个属性经常一起出现，但不是同一件事：

- **安全方法**的定义目标是不请求改变服务器状态，例如 GET 的语义是获取；服务器仍可能记录访问日志或触发其他副作用，不能据此承诺现实世界完全没有变化。
- **幂等方法**表示同一请求执行一次和执行多次，预期的服务器状态效果相同；响应不必每次都相同。
- **可缓存性**取决于方法、响应状态、字段和缓存策略，不能从“幂等”直接推导。

| 方法 | 典型语义 | 安全 | 幂等 | 常见边界 |
| --- | --- | --- | --- | --- |
| GET | 获取表示 | 是 | 是 | 不应把修改动作藏在 GET |
| POST | 提交处理或创建子资源 | 否 | 通常否 | 可用业务幂等键降低重复提交 |
| PUT | 用给定表示创建或替换目标状态 | 否 | 是 | 具体资源语义由 API 定义 |
| PATCH | 对目标资源做部分修改 | 否 | 取决于补丁设计 | 不能默认与 PUT 等价 |
| DELETE | 删除目标资源的当前关联 | 否 | 是 | 首次和重复删除的响应可以不同 |
| HEAD | 获取与 GET 类似的元数据而不返回内容 | 是 | 是 | 服务器应保持与 GET 的元数据一致性边界 |

{% note info flat %}
方法选择要通过实际目标状态验证，而不是只看请求体：
{% endnote %}

~~~http
PUT /items/42 HTTP/1.1
Content-Type: application/json

{"name":"v2"}

HTTP/1.1 200 OK

PATCH /items/42 HTTP/1.1
Content-Type: application/json

{"op":"replace","path":"/name","value":"v3"}

HTTP/1.1 204 No Content
~~~

{% note info flat %}
这是方法语义的教学形态，具体 API 可能返回 200、201、204、409 或 422。验证幂等性时要比较重复请求造成的目标状态和响应字段，验证可缓存性时还要检查响应状态、Cache-Control、Vary 和认证上下文。
{% endnote %}

### 状态码决策表

先按类别判断，再看具体状态：

| 类别 | 方向 | 典型问题 |
| --- | --- | --- |
| 1xx | 信息性响应 | 协议扩展或处理中间状态；不等同于最终业务结果 |
| 2xx | 请求已成功处理 | 200、201、202、204 的语义不同 |
| 3xx | 重定向或缓存条件结果 | 301/308 永久迁移，302/307 临时迁移，304 使用缓存表示 |
| 4xx | 请求或客户端上下文有问题 | 参数、认证、权限、资源、方法或限流 |
| 5xx | 服务端或网关处理失败 | 应用异常、上游不可用、超时或未实现 |

{% tip warning %}
状态码只描述 HTTP 层观察到的结果，不等于网络层故障分类。收到 404 说明已经有 HTTP 响应到达客户端；DNS 失败、TCP 连接拒绝和 TLS 证书错误通常不会产生 HTTP 状态码。
{% endtip %}

### 重定向

{% mermaid %}
sequenceDiagram
    participant C as 客户端
    participant O as 旧地址
    participant N as 新地址
    C->>O: GET /old
    O-->>C: 301/302/307/308 + Location
    C->>N: 按客户端和状态码规则发起后续请求
    N-->>C: 最终表示或新的状态
{% endmermaid %}

{% note info flat %}
301/308 表示永久迁移语义，302/307 表示临时迁移语义；307/308 明确要求保留原方法和内容，而历史客户端对 301/302 可能把 POST 改成 GET。调试重定向时必须查看原始状态、Location、后续请求方法以及是否携带了认证或 Cookie，不能只看最终页面。
{% endnote %}

### 常见客户端错误和服务端错误

| 状态码 | 解释重点 | 不应直接推出的结论 |
| --- | --- | --- |
| 400 | 请求语法或语义无法按服务端规则处理 | 不一定是网络断开 |
| 401 | 缺少或无效的认证凭据；挑战信息通常通过 WWW-Authenticate 提供 | 不等同于“没有登录页面” |
| 403 | 服务端理解请求但拒绝授权 | 不一定是资源不存在 |
| 404 | 未找到当前目标表示 | 不一定是路由器丢包 |
| 405 | 方法对目标资源不允许；服务端应通过 Allow 表示允许的方法 | 不等同于路径不存在 |
| 408 | 服务端等待请求超时 | 需要结合代理和连接时间线 |
| 409 | 与当前资源状态冲突 | 常见于版本、并发或业务状态冲突 |
| 412 | 条件请求前置条件未满足 | 与 ETag/If-Match 等字段相关 |
| 415 | 不支持请求内容的媒体类型 | 先看 Content-Type 和服务端契约 |
| 422 | 内容可解析但语义校验失败 | 其登记和使用语境要看具体规范/API |
| 429 | 请求过多或触发限流 | 应查看 Retry-After 和限流维度；具体实现可对照 RFC 6585 |
| 500 | 服务端内部处理异常 | 不足以定位具体代码行 |
| 501 | 服务端不支持所需功能 | 不等同于业务参数错误 |
| 502 | 网关从上游收到无效响应 | 需要区分网关和上游 |
| 503 | 当前服务暂不可用或过载 | 不一定是永久故障 |
| 504 | 网关等待上游响应超时 | 需要看 DNS、TCP、TLS、上游处理时间 |

{% tip warning %}
102 Processing 是 WebDAV 语境中的历史扩展状态，不应当作普通业务 API 的通用处理中状态。遇到 102，应先确认服务器、客户端和注册表所处的规范语境。
{% endtip %}

### WebDAV 与 102

{% note info flat %}
WebDAV 在 HTTP 资源模型上增加了面向集合和属性的扩展，例如 PROPFIND 读取资源属性、PROPPATCH 修改属性、MKCOL 创建集合、COPY/MOVE 管理资源关系、LOCK/UNLOCK 处理写锁。它们仍然使用 HTTP 消息、字段和状态码，但服务端、代理和客户端必须明确支持这些方法；收到 405 或 501 时不能把它当成普通 JSON API 的参数错误。
{% endnote %}

~~~http
PROPFIND /documents/ HTTP/1.1
Host: files.example.test
Depth: 1
Content-Length: 0

HTTP/1.1 207 Multi-Status
Content-Type: application/xml; charset="utf-8"

<?xml version="1.0" encoding="utf-8"?>
<multistatus xmlns="DAV:">...</multistatus>
~~~

{% note info flat %}
这个示例只展示 WebDAV 方法、Depth 字段和 207 Multi-Status 的协议形态，不声称目标站点支持它。验证时要检查 Allow、DAV、Depth、207 内容和服务端权限；不要把 WebDAV 的 102 直接当作普通 API 的“处理中”。
{% endnote %}

### 认证字段

{% note info flat %}
状态码要和配套字段一起读取。下面是可脱敏的响应形态：
{% endnote %}

~~~http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api"

HTTP/1.1 405 Method Not Allowed
Allow: GET, HEAD, OPTIONS

HTTP/1.1 429 Too Many Requests
Retry-After: 3

~~~

{% note info flat %}
401 的挑战字段、405 的 Allow 和 429 的 Retry-After 是后续客户端决策的重要输入；它们不是每个框架都会以相同正文展示。验证时保存原始响应头，不要只截图页面上的错误文案。
{% endnote %}

## 缓存与 Cookie

### Cache-Control

{% note info flat %}
缓存不是“浏览器看到相同 URL 就永远不发请求”。缓存是否可用要综合请求方法、响应状态、 freshness、Cache-Control、Vary、验证器、共享缓存边界和用户上下文。
{% endnote %}

| 指令 | 典型含义 | 关键边界 |
| --- | --- | --- |
| max-age | 表示在指定秒数内可视为新鲜 | 不等于资源一定在内存中 |
| no-cache | 使用前必须向源站验证 | 名称容易被误读成“不允许缓存” |
| no-store | 不存储该响应或请求的缓存副本 | 适合敏感内容，具体适用看规范 |
| private | 不应被共享缓存使用 | 浏览器私有缓存仍可能存在 |
| public | 允许共享缓存按规则存储 | 仍受认证、Vary 等条件影响 |
| must-revalidate | 过期后必须验证，不能任意提供旧副本 | 不能代替源站可用性设计 |
| stale-while-revalidate | 可在后台验证期间提供旧副本 | 需确认缓存实现和响应字段 |

### 条件请求

{% mermaid %}
sequenceDiagram
    participant B as 浏览器缓存
    participant S as 源站
    B->>S: GET /article If-None-Match: "v7"
    S-->>B: 304 Not Modified + ETag: "v7"
    Note over B: 复用本地已有表示，不重新下载内容
    B->>S: PUT /article If-Match: "v7"
    S-->>B: 412 或成功更新
{% endmermaid %}

{% note info flat %}
ETag 是表示的实体标签，适合做精确的条件验证和并发更新保护；Last-Modified 提供基于时间的验证，但时间精度、时钟和源站更新策略可能影响判断。If-None-Match 常用于缓存验证，If-Match 常用于避免覆盖其他人的更新；收到 304 不是服务端“没有内容”，而是让客户端继续使用已有表示。
{% endnote %}

### Cookie 的设置与发送

{% tip key %}
服务器通过 Set-Cookie 建立或更新浏览器保存的 Cookie，浏览器之后依据 Domain、Path、Expires/Max-Age、Secure、HttpOnly、SameSite 等属性决定是否发送 Cookie。Cookie 是 HTTP 状态管理机制，不等于认证本身；认证系统可以把会话标识放在 Cookie，也可以使用 Authorization 等方式。
{% endtip %}

| 属性 | 控制什么 | 常见误区 |
| --- | --- | --- |
| Domain | 可匹配的主机范围 | 不要把它当成跨任意站点共享 |
| Path | 请求路径匹配范围 | 不是安全边界，不能单独防 XSS |
| Secure | 只通过安全传输发送 | 不等于内容自动加密的完整证明 |
| HttpOnly | 限制脚本读取 Cookie | 仍会随符合条件的请求发送 |
| SameSite | 跨站请求中的发送规则 | 需结合浏览器上下文和请求类型 |
| Max-Age/Expires | 生命周期 | 会话结束、持久化和时钟需要区分 |

{% note info flat %}
完整交换至少要能读出 Set-Cookie 和后续 Cookie：
{% endnote %}

~~~http
HTTP/1.1 200 OK
Set-Cookie: sid=redacted; Path=/; Secure; HttpOnly; SameSite=Lax

HTTP/1.1 200 OK
Cookie: sid=redacted
~~~

{% tip key %}
上面是脱敏的协议形态，不是某个真实账户的输出。验证时要检查请求是否满足 Domain/Path/Secure/SameSite 条件，以及浏览器是否因第三方上下文、跨源凭据或过期时间拒绝发送；不要把 Cookie 值写入文章、HAR 或公共日志。
{% endtip %}

## Fetch 与 CORS

### 同源和跨源

{% note info flat %}
源通常由 scheme、host、port 组成。只要三者之一不同，浏览器就会把请求视为跨源；跨源不代表网络层不能连通，而是浏览器脚本对响应读取和请求发送受到同源策略约束。
{% endnote %}

{% mermaid %}
flowchart TD
    JS[页面脚本发起 Fetch] --> ORIGIN{目标是否同源}
    ORIGIN -->|是| DIRECT[按同源规则发送并读取响应]
    ORIGIN -->|否| CORS{是否满足 CORS 规则}
    CORS -->|简单请求| SIMPLE[发送请求，再检查响应字段]
    CORS -->|需预检| PREFLIGHT[先发 OPTIONS 预检]
    PREFLIGHT --> ALLOW{服务端允许方法/头/来源}
    ALLOW -->|是| ACTUAL[发送实际请求]
    ALLOW -->|否| BLOCK[浏览器阻止脚本读取或发送实际请求]
{% endmermaid %}

{% note info flat %}
Fetch API 描述浏览器如何创建请求、处理凭据、重定向、响应和 CORS。CORS 响应头不是“让服务器变得可跨站”的通用开关，而是服务器向浏览器声明哪些跨源上下文可以被脚本读取。命令行 curl 通常不会自动执行浏览器同源策略，所以用 curl 成功不能证明浏览器 Fetch 一定成功。
{% endnote %}

### 简单请求和预检

{% note info flat %}
跨源请求是否预检取决于方法、请求头和 Content-Type 等条件。需要预检时，浏览器会先发送 OPTIONS，并携带 Origin、Access-Control-Request-Method、Access-Control-Request-Headers 等字段；服务端需要用 Access-Control-Allow-Origin、Access-Control-Allow-Methods、Access-Control-Allow-Headers 等字段给出匹配许可。
{% endnote %}

{% note info flat %}
一个实际排障时要逐字段对照的预检往返是：
{% endnote %}

~~~http
OPTIONS /api/items HTTP/1.1
Host: api.example.test
Origin: https://app.example.test
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.test
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: authorization, content-type
Vary: Origin

POST /api/items HTTP/1.1
Origin: https://app.example.test
Authorization: Bearer redacted
Content-Type: application/json
~~~

{% note info flat %}
这是可脱敏的输入/预期输出形态，实际浏览器是否发出 POST 要以 DevTools 为准。验证时要确认 Origin 精确匹配、预检允许的方法/头、凭据策略和响应的 Vary；curl 复刻时即使服务端返回 204，也不会自动替浏览器执行同源策略。
{% endnote %}

{% note info flat %}
对应的 Fetch 输入可以写成：
{% endnote %}

~~~js
fetch("https://api.example.test/items", {
  method: "POST",
  mode: "cors",
  credentials: "omit",
  headers: {
    "Authorization": "Bearer test-token",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ name: "demo" })
}).then(response => ({ status: response.status, type: response.type }))
~~~

{% note info flat %}
预期证据是：若请求触发预检，先出现 OPTIONS，再出现 POST；若 Allow-Origin 或 Allow-Headers 不匹配，脚本可能无法读取响应；若 DNS/TCP/TLS 失败，则不会产生可供 CORS 检查的 HTTP 响应。代码只是测试输入，必须在自己控制的 origin 和 API 夹具中运行。
{% endnote %}

| 浏览器面板现象 | 可能根因 | 验证方法 |
| --- | --- | --- |
| OPTIONS 失败，实际请求没有出现 | 预检未被路由、方法/头未允许、认证策略不匹配 | 查看 OPTIONS 的请求和响应字段 |
| 实际请求有响应但脚本报 CORS | 缺少或不匹配 Allow-Origin，或凭据规则冲突 | 对照 Origin、Allow-Origin、Allow-Credentials |
| curl 成功，浏览器失败 | curl 没有执行同源策略或请求上下文不同 | 复刻 Origin、方法、请求头和凭据 |
| 浏览器发出 POST 后仍无法读取 | CORS 允许发送不等于允许读取响应 | 查看响应端 CORS 字段和控制台错误 |

## 中间层

### Authorization

{% tip key %}
Authorization 字段承载认证方案和凭据，例如 Bearer token。它解决“请求者如何证明身份/持有凭据”的一部分问题，不自动解决权限、会话撤销、Token 泄露、缓存隔离或传输加密。生产排查中不要把真实 Authorization 值写入文章、截图、HAR 或公共 issue。
{% endtip %}

{% note info flat %}
Bearer 请求的最小形态是：
{% endnote %}

~~~http
GET /me HTTP/1.1
Host: api.example.test
Authorization: Bearer redacted-token

HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api", error="invalid_token"
~~~

{% note info flat %}
401 的 WWW-Authenticate 可以告诉客户端认证方案或挑战信息；即使 Token 语法正确，服务端仍可能因过期、权限不足、受众不匹配或撤销而拒绝。使用 curl 复现时只用测试 Token，并在输出中保留 redacted 占位符。
{% endnote %}

### 代理与网关

{% mermaid %}
flowchart TD
    subgraph FORWARD[正向代理路径]
      CLIENT[客户端/浏览器] -->|发送给代理| FPROXY[正向代理]
      FPROXY -->|代理代表客户端出站| TARGET[目标服务]
    end
    subgraph REVERSE[反向代理路径]
      USER[外部客户端] -->|访问服务入口| GATEWAY[网关/负载均衡]
      GATEWAY --> APP[上游应用]
      GATEWAY --> CACHE[缓存或静态资源]
    end
{% endmermaid %}

{% note info flat %}
正向代理代表客户端访问外部资源，反向代理代表服务端接收外部请求；网关可能终止 TLS、改写路径、做认证、缓存、限流或把请求转发给上游。收到 502/504 时，要先问错误在哪一跳产生：客户端到网关、网关到上游、还是上游应用内部。
{% endnote %}

{% note info flat %}
两条路径的输入证据不同：正向代理通常需要观察客户端代理配置、CONNECT/目标 URL 和代理返回；反向代理需要关联入口请求 ID、上游 Host、连接耗时和上游响应。一个合成但可核对的错误响应可以带上 X-Fixture-Path；真实环境不能仅凭这个字段认定网关责任，仍要读代理日志。
{% endnote %}

| 路径 | 脱敏输入 | 关键输出/验证 |
| --- | --- | --- |
| 正向代理 | `curl -x http://proxy.example.test:8080 https://target.example.test/` | 代理 CONNECT、目标 TLS/HTTP 和代理访问日志是否关联 |
| 反向代理 | `curl -H 'X-Debug-Request: fixture' https://gateway.example.test/api` | 网关请求 ID、上游 Host、502/504 时间线和上游日志是否关联 |

{% note info flat %}
两个命令只是形状示例，不在当前环境声称执行；正向代理命令的代理地址和反向代理命令的 Host 都必须来自明确授权的测试环境。
{% endnote %}

## 请求证据

### curl 验证

{% tip key %}
下面命令针对公共示例站点，仅产生读取请求。实际复现私有接口时，先脱敏并确认授权；不要把真实 Cookie、Authorization 或内部 Host 放进共享日志。
{% endtip %}

~~~bash
# 查看响应头和重定向，但不下载大响应体
curl -sS -D - -o /dev/null https://example.com/

# 显式声明客户端希望得到 JSON，并观察详细时间线
curl -sS -v -H 'Accept: application/json' https://example.com/api/status

# 只跟随重定向并保存最终响应头；先确认目标不会泄露凭据
curl -sS -L -D /tmp/http-headers.txt -o /tmp/http-body.txt https://example.com/

# 复刻条件请求的形状，ETag 值应来自你自己的授权响应
curl -sS -D - -H 'If-None-Match: "article-42-v7"' https://example.com/articles/42
~~~

{% tip success %}
预期证据是：DNS 解析、TCP/或后续安全连接、请求字段、响应状态、Location、缓存字段和内容类型。`-I` 发送 HEAD，不能把 HEAD 的结果完全当作 GET 的内容证据；`-L` 会改变观察到的请求链，必须同时记录每一跳的状态和方法。
{% endtip %}

### 请求验证

{% note info flat %}
下方是固定夹具或公共只读请求的**示例输出形态**，不是当前机器已经执行的结果；真实地址、HTTP 版本和状态可能变化。文章中的 `redacted` 表示有意脱敏的凭据位置。
{% endnote %}

~~~text
$ curl -sS -D - -o /dev/null http://127.0.0.1:18081/cache
HTTP/1.0 200 OK
Content-Type: text/plain; charset=utf-8
Cache-Control: max-age=0, must-revalidate
ETag: "fixture-v1"

$ curl -sS -D - -H 'If-None-Match: "fixture-v1"' http://127.0.0.1:18081/cache
HTTP/1.0 200 OK
ETag: "fixture-v1"

$ curl -sS -D - http://127.0.0.1:18081/fixed-502
HTTP/1.0 502 Bad Gateway
X-Fixture-Path: gateway-to-upstream

$ curl -sS -D - -H 'Origin: https://app.example.test' http://127.0.0.1:18081/cors
HTTP/1.0 204 No Content
Access-Control-Allow-Origin: https://app.example.test
Vary: Origin
~~~

{% note info flat %}
这是输出模板而非对线上状态的断言；若夹具使用 HTTP/1.0、实现没有条件请求或路由不同，结果会不同。验证要对照实际状态、字段、响应体长度和服务器日志；对 502/504 还要关联上游 DNS/TCP/TLS 证据。
{% endnote %}

### 固定响应夹具与状态边界

要测试缓存、重定向和 502/504，优先使用隔离的本地夹具，而不是修改线上服务：

1. 启动一个只绑定 loopback 的 HTTP 服务，返回固定的 ETag、Cache-Control 和 Location；
2. 用 curl 第一次请求，保存响应头；
3. 带上 If-None-Match 再请求，预期观察 304 或服务端实现的条件结果；
4. 对一个明确的未监听端口，记录连接拒绝与 HTTP 502 的区别；
5. 若使用代理夹具模拟 502/504，明确记录网关、上游和超时边界，完成后精确停止进程并删除临时文件。

### HTTP 面试分析流程

面对“为什么返回 403”“为什么浏览器跨域”“为什么看到 304 但页面内容旧”时，按以下顺序回答：

{% mermaid %}
flowchart TD
    A[先确认请求是否到达] --> B{有 HTTP 响应吗}
    B -->|没有| C[回到 DNS/TCP/TLS/代理路径]
    B -->|有| D[读状态码和 Location]
    D --> E[读方法、目标和请求字段]
    E --> F[读响应字段：缓存/CORS/Cookie/内容类型]
    F --> G[确认浏览器或 curl 的处理边界]
    G --> H[用服务端日志和上游时间线闭环]
{% endmermaid %}

### 旧术语到现代模型的迁移

| 旧笔记常见词 | 当前回答优先使用 | 迁移动作 |
| --- | --- | --- |
| entity / entity body | content / representation data | 说明内容承载表示，不把旧词当作额外协议层 |
| general/request/response header | field | 按具体字段语义说明缓存、认证、协商或分帧 |
| request URL / response body 的笼统描述 | target resource / representation / message | 把资源、表示和消息分开 |
| 102 是普通处理中状态 | WebDAV 语境中的历史扩展 | 查 RFC 4918/IANA 和客户端支持，不泛化为业务状态 |
| 代理就是服务器 | forward proxy 与 reverse proxy/gateway | 分开客户端出站路径和服务端入口路径 |

{% note info flat %}
迁移的验收问题是：能否把旧术语替换后仍然指出具体字段、消息边界、状态码和责任边界；如果只能改名而不能解释机制，说明还没有完成迁移。
{% endnote %}

## HTTP 语义复习

{% note info flat %}
先遮住答案，尝试从资源 → 消息 → 字段 → 浏览器边界复述；详细解析用于检查是否把 HTTP 语义、浏览器策略和网络连通性混在了一起。
{% endnote %}

{% flashcard basic id:CN-HTTP-001 deck:"计算机网络" priority:1 tags:"HTTP,资源,表示" %}
--- question
HTTP 中资源、表示和消息分别是什么？
--- answer
资源是请求目标概念，表示是资源在某时刻以某种媒体类型呈现的数据，消息是承载 HTTP 语义、字段和内容的协议载体。
--- explanation
同一资源可以按语言、格式或编码产生不同表示；请求/响应消息携带选择和传输这些表示所需的字段。旧资料中的实体术语应迁移到这个现代模型。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-002 deck:"计算机网络" priority:1 tags:"HTTP,请求,响应" %}
--- question
HTTP 请求和响应各自的起始行、字段、内容边界如何阅读？
--- answer
请求起始行是方法/目标/版本，响应起始行是版本/状态码/短语；随后是字段，空行后可能有内容，内容长度和分帧还要看字段及协议版本。
--- explanation
空行只结束字段区域，不自动说明整个响应的内容长度。HTTP/2/3 的线格式不同，但语义仍可映射到方法、状态、字段和内容。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-003 deck:"计算机网络" priority:1 tags:"HTTP,方法,幂等性" %}
--- question
安全性、幂等性和可缓存性有什么区别？
--- answer
安全性描述方法预期不改变目标状态，幂等性描述重复执行的预期状态效果，可缓存性描述响应能否由缓存复用；三者不能互相直接推导。
--- explanation
GET 通常安全且幂等，但不代表业务没有日志等副作用；POST 通常非幂等；缓存还受响应字段、状态、Vary 和用户上下文影响。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-004 deck:"计算机网络" priority:1 tags:"HTTP,GET,POST,PUT,PATCH" %}
--- question
GET、POST、PUT、PATCH、DELETE 的核心边界是什么？
--- answer
GET 获取，POST 提交处理或创建，PUT 以给定表示创建/替换，PATCH 做部分修改，DELETE 删除目标当前关联；具体资源语义仍由 API 契约定义。
--- explanation
不要把 POST 等同于“有请求体”、PUT 等同于“全量更新”的绝对规则。方法语义、幂等性和应用接口设计要一起阅读。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-005 deck:"计算机网络" priority:1 tags:"HTTP,状态码" %}
--- question
HTTP 状态码 2xx、3xx、4xx、5xx 如何按层次解释？
--- answer
2xx 表示成功处理，3xx 表示重定向或条件结果，4xx 表示请求/客户端上下文问题，5xx 表示服务端或网关处理失败。
--- explanation
状态码只能证明 HTTP 层的观察结果。DNS 失败、TCP 拒绝、TLS 证书错误通常没有 HTTP 状态码，应先区分是否收到响应。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-006 deck:"计算机网络" priority:1 tags:"HTTP,重定向" %}
--- question
301、302 与 307、308 的面试回答重点是什么？
--- answer
301/308 表示永久迁移，302/307 表示临时迁移；307/308 要求后续请求保留原方法和内容，旧客户端对 301/302 可能把 POST 改成 GET。
--- explanation
检查重定向必须同时看 Location、后续方法、请求体、认证和 Cookie。最终页面成功不代表中间跳转没有丢失语义。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-007 deck:"计算机网络" priority:1 tags:"HTTP,缓存,ETag" %}
--- question
304 Not Modified 说明了什么？
--- answer
服务端根据条件请求判断客户端已有表示仍可复用，响应通常不重新传输内容；客户端应使用本地缓存表示。
--- explanation
304 不是“没有内容”或“服务端没工作”。要检查 If-None-Match/If-Modified-Since、ETag/Last-Modified 和缓存对象的实际版本。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-008 deck:"计算机网络" priority:1 tags:"HTTP,Cache-Control" %}
--- question
no-cache 和 no-store 的区别是什么？
--- answer
no-cache 通常表示使用前必须重新验证，仍可能保存缓存副本；no-store 表示不要存储该请求或响应的缓存副本。
--- explanation
指令名称容易造成反向记忆。最终行为还要结合共享/私有缓存、响应状态、Vary 和实现，但不能把两者都简化成“禁止缓存”。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-009 deck:"计算机网络" priority:1 tags:"HTTP,Cookie,CORS" %}
--- question
Cookie、同源策略和 CORS 分别解决什么问题？
--- answer
Cookie 管理 HTTP 状态，同源策略限制脚本跨源交互，CORS 让服务端声明哪些跨源浏览器上下文可被允许。
--- explanation
CORS 不是认证，也不是让所有客户端自动遵守的防火墙。curl 通常不会执行浏览器同源策略，因此 curl 成功不能证明 Fetch 成功。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-010 deck:"计算机网络" priority:1 tags:"HTTP,CORS,预检" %}
--- question
CORS 预检请求会携带什么，服务端需要证明什么？
--- answer
浏览器可能先发 OPTIONS，并携带 Origin、Access-Control-Request-Method、Access-Control-Request-Headers；服务端需返回匹配的 Allow-Origin、Allow-Methods、Allow-Headers 等许可。
--- explanation
预检失败时实际请求可能根本没有发送；实际请求已有响应但脚本仍报错，则要检查响应读取权限和凭据规则。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-011 deck:"计算机网络" priority:2 tags:"HTTP,代理,502,504" %}
--- question
遇到 502 或 504，如何区别网关和上游问题？
--- answer
先确认错误响应由哪个网关产生，再沿客户端到网关、网关到上游、上游内部的时间线检查 DNS、TCP、TLS、响应格式和超时。
--- explanation
502 通常表示网关从上游得到无效响应，504 表示等待上游超时；状态码不能替代网关日志和上游证据，也不能直接指向某一段代码。
{% endflashcard %}

## 常见问题

{% flashcard_ref id="CN-HTTP-005" %}
{% flashcard_ref id="CN-HTTP-007" %}

{% flashcard basic id:CN-HTTP-FAQ-001 deck:"计算机网络" priority:1 tags:"HTTP,承载,HTTP/3" %}
--- question
HTTP 一定运行在 TCP 上吗？
--- answer
不能用这个绝对表述覆盖所有现代 HTTP。HTTP/1.1 和 HTTP/2 常见于 TCP，HTTP/3 使用 QUIC。
--- explanation
先建立 HTTP 语义，再区分线格式和传输承载；语义、线格式、传输和加密不是同一层。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-FAQ-002 deck:"计算机网络" priority:1 tags:"HTTP,404,排障" %}
--- question
看到 404 说明网络不通吗？
--- answer
通常相反：404 说明请求已经到达某个 HTTP 服务并返回了响应，只是目标资源没有按该请求上下文找到。
--- explanation
网络路径仍可能有代理或路由差异，但应先沿响应头、Host、路径、路由和上游日志定位资源选择。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-FAQ-003 deck:"计算机网络" priority:1 tags:"HTTP,浏览器,curl,CORS" %}
--- question
为什么浏览器失败而 curl 成功？
--- answer
两者的请求上下文不同。浏览器可能执行同源策略、CORS 预检、Cookie SameSite、缓存和证书策略，curl 通常只按命令参数发送请求。
--- explanation
复现浏览器问题时记录 Origin、方法、请求头、凭据、证书和重定向链，不能只复制 URL。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-FAQ-004 deck:"计算机网络" priority:2 tags:"HTTP,304,缓存" %}
--- question
304 会不会导致页面一直旧？
--- answer
304 只说明条件验证命中了客户端已有表示；ETag、缓存键、Vary 或部署版本不一致时，仍可能反复复用错误的旧内容。
--- explanation
应保存条件请求和响应字段并检查缓存对象，而不是先盲目关闭缓存。
{% endflashcard %}

{% flashcard basic id:CN-HTTP-FAQ-005 deck:"计算机网络" priority:1 tags:"HTTP,401,403,认证" %}
--- question
401 和 403 的区别是不是“未登录”和“没权限”？
--- answer
这是常见但不完整的简化：401 关注认证凭据缺失或无效，403 表示服务器理解请求但拒绝授权。
--- explanation
实际系统还可能使用 404 隐藏资源存在性，必须结合 API 契约、认证字段和响应内容判断。
{% endflashcard %}

## 参考资料

### HTTP 语义、方法与缓存规范

{% linkgroup %}
{% link RFC 9110：HTTP Semantics, https://www.rfc-editor.org/rfc/rfc9110.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 5789：PATCH Method for HTTP, https://www.rfc-editor.org/rfc/rfc5789.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 9111：HTTP Caching, https://www.rfc-editor.org/rfc/rfc9111.html, https://www.rfc-editor.org/favicon.ico %}
{% endlinkgroup %}

### Cookie 与浏览器跨源规范

{% linkgroup %}
{% link RFC 6265：HTTP State Management Mechanism, https://www.rfc-editor.org/rfc/rfc6265.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 6265bis-22：current cookie draft, https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis-22, https://datatracker.ietf.org/favicon.ico %}
{% link WHATWG Fetch Living Standard, https://fetch.spec.whatwg.org/, https://resources.whatwg.org/logo-fetch.svg %}
{% endlinkgroup %}

### 状态码、分帧、WebDAV 与认证规范

{% linkgroup %}
{% link RFC 9112：HTTP/1.1, https://www.rfc-editor.org/rfc/rfc9112.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 4918：WebDAV, https://www.rfc-editor.org/rfc/rfc4918.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 6750：OAuth 2.0 Bearer Token Usage, https://www.rfc-editor.org/rfc/rfc6750.html, https://www.rfc-editor.org/favicon.ico %}
{% link RFC 6585：Additional HTTP Status Codes, https://www.rfc-editor.org/rfc/rfc6585.html, https://www.rfc-editor.org/favicon.ico %}
{% link IANA HTTP Status Code Registry, https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml, https://www.iana.org/favicon.ico %}
{% endlinkgroup %}

### 调试工具

{% linkgroup %}
{% link Chrome DevTools Network 官方文档, https://developer.chrome.com/docs/devtools/network/, https://www.google.com/chrome/static/images/chrome-logo.svg %}
{% link curl 官方手册, https://curl.se/docs/manpage.html, https://curl.se/favicon.ico %}
{% endlinkgroup %}

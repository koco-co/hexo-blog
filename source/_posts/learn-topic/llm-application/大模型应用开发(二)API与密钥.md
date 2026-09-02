---
title: 大模型应用开发(二)API与密钥
tags:
  - 大模型应用开发
  - API与密钥
categories:
  - Learn Topic
  - 大模型应用开发
description: 能安全配置 API Key，理解请求、响应、限流、超时和错误。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 2
published: false
abbrlink: 8223714b
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把一次模型调用拆成 endpoint、认证、请求、响应和错误处理五个可观察部分，并在不接触真实凭据的情况下完成一次本地请求。成功证据是：密钥不出现在源码和日志中，HTTP 状态能被正确分类，超时与重试有明确截止条件。
{% endnote %}

<!-- concept-story:start -->

一个小组把“让服务回答一句话”的脚本交给同事。脚本在电脑上能运行，部署到服务器却先收到 `401`；开发者把 Key 复制到源文件，错误消失了。第二天流量升高，接口返回 `429`，脚本没有截止时间地重试，日志里留下了完整请求头，账单也开始增长。排障时他们才发现，认证失败、服务限流、客户端等待超时和模型输出根本不是同一种问题。

他们把请求拆成“去哪里、凭什么、带什么、得到什么”四个问题，再为每种失败规定可观察证据和停止条件。Key 被移回进程环境，日志只保留请求 ID 和状态码；本地夹具先复现错误，真实 API 只在读者明确配置后才调用。

<!-- concept-story:end -->

{% note info flat %}
上面的情境是为了建立问题模型，不是线上事故记录。API 的核心不是某个 SDK 方法，而是一个有截止时间的 HTTP 交互：客户端选择 endpoint，按服务要求认证，发送请求体，读取响应状态与响应体，再依据错误类别决定是否结束、降级或有限重试。
{% endnote %}

## 请求生命周期

### 请求与响应

{% note primary flat %}
一次调用至少有五个边界：endpoint 决定请求送到哪里；认证证明调用者拥有某种访问能力；请求体描述模型和输入；响应状态说明服务如何处理请求；响应体携带输出、错误细节或后续操作所需的 ID。任何一层出错，都不能直接归因于“模型不够聪明”。
{% endnote %}

{% mermaid %}
flowchart TD
  A[配置 endpoint 与截止时间] --> B[读取环境中的认证信息]
  B --> C[发送请求体]
  C --> D{读取 HTTP 状态}
  D -->|2xx| E[解析响应体]
  D -->|401/403| F[停止并检查认证或权限]
  D -->|429| G[遵守限流提示或降级]
  D -->|408/5xx/客户端超时| H[在总截止时间内有限重试]
{% endmermaid %}

{% note info flat %}
图中的“状态”与“输出”要分开记录。`200` 只说明 HTTP 请求成功到达并得到成功响应，不证明回答正确；客户端超时也不等于服务端没有处理请求，因为请求可能已经被服务接受。对于可能产生副作用的请求，重试前必须考虑重复执行；即使模型生成通常没有业务写入，也可能重复消耗额度。
{% endnote %}

{% note info flat %}
不同厂商的字段名称并不构成统一协议。下面只比较本篇需要的边界，完整的 Provider 差异留到后续文章；字段和可用模型仍应以对应官方文档为准。
{% endnote %}

| 接口形态 | 认证位置 | 请求中的关键对象 | 成功响应的观察点 | 本篇的判断边界 |
| --- | --- | --- | --- | --- |
| OpenAI Responses | `Authorization: Bearer …` | `model`、`input` | `output` 或 SDK 的文本便捷字段 | `output` 可能包含文本以外的项目，不能把任意数组元素当普通文本 |
| Anthropic Messages | `x-api-key` 与版本头 | `model`、`max_tokens`、`messages` | `content` 内容块、`stop_reason` | 内容是块结构，不能只按一个字符串字段解析 |
| Gemini Interactions | Google API Key，传递位置按 REST/SDK 文档 | `model`、`input`，可选前一交互 ID | Interaction 的 ID、状态和输出步骤 | 默认存储、无状态请求和多轮续接是不同选择，不能混成客户端缓存 |
| Chat Completions 兼容入口 | `Authorization: Bearer …` | `model`、有序 `messages` | `choices`、usage 和结束原因 | “兼容”只表示部分请求/响应形状相近，不代表所有参数、错误和模型能力相同 |

### 密钥治理

{% note danger flat %}
API Key 是可转移的访问能力，不是普通示例字符串。不要把真实 Key 写进 Markdown、源代码、Shell 历史、浏览器前端、截图、Issue 或日志；也不要为了证明配置成功而把它打印出来。若 Key 已进入仓库或日志，应立即撤销并轮换，不能只删除当前文件。
{% endnote %}

{% note info flat %}
推荐把配置分成“可提交的说明”和“运行时的秘密”。
{% endnote %}

```dotenv
# .env.example：只描述变量名和格式，不放可用凭据
LLM_BASE_URL=https://api.example.invalid/v1
LLM_MODEL=replace-with-enabled-model
LLM_API_KEY=
LLM_TIMEOUT_SECONDS=10
```

```bash
# 运行时由环境或密钥管理器注入；这里的默认值仅用于本地夹具
export LLM_BASE_URL="${LLM_BASE_URL:-http://127.0.0.1:8000}"
export LLM_MODEL="${LLM_MODEL:-fixture-model}"
export LLM_API_KEY="${LLM_API_KEY:-demo-only-key}"

# 只检查是否存在，不回显值；set -x 可能把命令和变量泄露到日志
if [ -z "${LLM_API_KEY}" ]; then
  printf '%s\n' 'missing LLM_API_KEY' >&2
  exit 1
fi
printf 'configured endpoint=%s model=%s key_present=true\n' \
  "$LLM_BASE_URL" "$LLM_MODEL"
```

{% note info flat %}
`.env.example` 的作用是让协作者知道变量名，`.env` 或运行环境才承载实际值。是否提交 `.env` 由仓库策略决定，但公开教程不应要求读者把真实凭据写入文章。生产系统还应限制读取权限、区分开发与生产 Key、记录轮换时间，并确认撤销旧 Key 后没有仍在运行的实例依赖它。
{% endnote %}

## 认证与秘密

### 失败状态

{% note info flat %}
HTTP 状态码是分类线索，不是完整根因。`401` 通常表示缺少或无效的认证信息，`403` 表示身份已被识别但不具备当前权限；二者都不应通过无限重试解决。`429` 表示当前请求受到限流或配额约束，只有在服务给出等待提示、业务允许且总截止时间仍足够时，才考虑有限退避。`408`、部分 `5xx` 或网络断开可以进入受截止时间约束的重试路径，但必须记录尝试次数。
{% endnote %}

| 现象 | 直接证据 | 默认动作 | 不能直接推出 |
| --- | --- | --- | --- |
| `400` | 服务返回参数错误 | 修正请求体，不重试同一输入 | 模型不可用 |
| `401` / `403` | 认证或权限状态 | 停止，检查 Key、租户、权限和 endpoint | 重新生成文本会解决认证 |
| `429` | 限流状态，可能带 `Retry-After` | 读取服务提示，做有上限的退避或降级 | 等待任意时间都一定成功 |
| `408` / `5xx` | 服务端等待、暂时失败或网关错误 | 仅对安全操作有限重试，并保留原响应 | 请求一定没有被处理 |
| 客户端 timeout | 本地时钟超过 deadline，没有 HTTP 状态 | 结束本次等待，按幂等性和成本决定是否重试 | 服务端一定没有收到请求 |

{% note info flat %}
“超时”有两个时钟：连接/读取超时限制单次等待，总截止时间限制整个操作。只设置前者而不设置后者，重试次数就可能无限增长。取消也不是删除服务端已经接受的请求；客户端应停止等待并记录一次未确认结果，后续由业务决定查询、补偿或人工检查。
{% endnote %}

### 夹具边界

{% note primary flat %}
本地夹具只证明客户端的配置、请求构造、响应解析和错误分类；它不能证明真实 Provider 的配额、网络路径、模型质量、计费或当前字段兼容性。真实调用必须由读者显式提供凭据，并在可接受的额度、数据范围和截止时间内单独验证。
{% endnote %}

{% note info flat %}
本地实验让每个失败都可重复。下面的夹具只使用 Python 标准库：它在回环地址上监听随机端口，接受一个合成 Key，成功时返回请求 ID，其他路径返回可预期的状态；日志永远写入 `[redacted]`，不会记录认证头。
{% endnote %}

## 最小实践

### 准备输入

{% note info flat %}
先准备一个临时目录、一个仅用于夹具的环境变量和一个退出清理函数。临时目录由 `mktemp` 返回，示例不依赖本机绝对路径；夹具不访问外网，也不读取真实 Provider 的凭据。
{% endnote %}

### 执行步骤

```bash
set -euo pipefail

fixture_dir="$(mktemp -d)"
fixture="$fixture_dir/server.py"
port_file="$fixture_dir/port"
log_file="$fixture_dir/server.log"
received_dir="$fixture_dir/received"
completion_dir="$fixture_dir/completed"
mkdir -p "$received_dir" "$completion_dir"
server_pid=""
cleanup() {
  if [ -n "$server_pid" ]; then
    kill "$server_pid" 2>&1 || true
  fi
  rm -rf "$fixture_dir"
}
trap cleanup EXIT

cat > "$fixture" <<'PY'
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

KEY = os.environ["DEMO_KEY"]

def write_marker(env_name, request_id):
    marker_dir = Path(os.environ[env_name])
    marker_dir.mkdir(exist_ok=True)
    (marker_dir / f"{request_id}.marker").write_text("done\n")


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        query = parse_qs(urlparse(self.path).query)
        case = query.get("case", ["ok"])[0]
        request_ids = query.get("request_id", [])
        if len(request_ids) != 1 or not request_ids[0]:
            self.send_error(400, "request_id required")
            return
        request_id = request_ids[0]
        write_marker("RECEIVED_DIR", request_id)
        if case == "timeout":
            time.sleep(1.0)

        auth = self.headers.get("Authorization", "")
        if case == "bad-key" or auth != f"Bearer {KEY}":
            status, payload = 401, {"error": "unauthorized"}
        elif case == "rate-limit":
            status, payload = 429, {"error": "rate_limited"}
        elif case == "server-error":
            status, payload = 503, {"error": "temporary_failure"}
        else:
            status, payload = 200, {
                "request_id": request_id,
                "output": "accepted",
            }

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        if status == 429:
            self.send_header("Retry-After", "2")
        body = json.dumps(payload).encode()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass
        write_marker("COMPLETION_DIR", request_id)
        print(json.dumps({
            "event": "request",
            "status": status,
            "authorization": "[redacted]",
        }), flush=True)

    def log_message(self, *_args):
        return

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
Path(os.environ["PORT_FILE"]).write_text(str(server.server_address[1]))
print(json.dumps({"event": "ready", "port": server.server_address[1]}), flush=True)
server.serve_forever()
PY

DEMO_KEY="fixture-only-$$"
export DEMO_KEY
PORT_FILE="$port_file" RECEIVED_DIR="$received_dir" \
  COMPLETION_DIR="$completion_dir" DEMO_KEY="$DEMO_KEY" \
  python3 "$fixture" > "$log_file" 2>&1 &
server_pid=$!

for _ in $(seq 1 50); do
  [ -s "$port_file" ] && break
  sleep 0.02
done
test -s "$port_file"
base_url="http://127.0.0.1:$(cat "$port_file")"

# curl：认证头通过 stdin 传入，不出现在 curl 进程参数中
curl_fixture() {
  printf 'header = "Authorization: Bearer %s"\nheader = "Content-Type: application/json"\n' "$DEMO_KEY" |
    curl --config - "$@"
}
curl_bad_key() {
  printf 'header = "Authorization: Bearer wrong"\nheader = "Content-Type: application/json"\n' |
    curl --config - "$@"
}

curl_fixture --silent --show-error --fail-with-body --max-time 2 \
  --data '{"input":"ping"}' "$base_url/request?request_id=fixture-001"
printf '\n'

# Python 标准库：读取状态与 JSON，避免打印 Authorization
python3 - "$base_url/request?request_id=fixture-002" <<'PY'
import json
import os
import sys
import urllib.request

url = sys.argv[1]
key = os.environ["DEMO_KEY"]
request = urllib.request.Request(
    url,
    data=b'{"input":"ping"}',
    headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    },
    method="POST",
)
with urllib.request.urlopen(request, timeout=2) as response:
    payload = json.load(response)
print({"status": response.status, "request_id": payload["request_id"]})
assert response.status == 200
assert payload["request_id"] == "fixture-002"
assert payload["output"] == "accepted"
PY

# 负例：状态码可观察，--max-time 只控制等待，不伪造 HTTP 状态
for case in bad-key rate-limit server-error; do
  if [ "$case" = "bad-key" ]; then
    curl_bad_key --silent --show-error --max-time 2 \
      -o "$fixture_dir/$case.json" \
      -w "$case status=%{http_code}\n" \
      --data '{"input":"ping"}' "$base_url/request?case=$case&request_id=fixture-$case"
  else
    curl_fixture --silent --show-error --max-time 2 \
      -o "$fixture_dir/$case.json" \
      -w "$case status=%{http_code}\n" \
      --data '{"input":"ping"}' "$base_url/request?case=$case&request_id=fixture-$case"
  fi
done

if curl_fixture --silent --show-error --max-time 0.2 \
  -o "$fixture_dir/timeout.json" \
  -w 'timeout status=%{http_code}\n' \
  --data '{"input":"ping"}' "$base_url/request?case=timeout&request_id=fixture-timeout"; then
  printf '%s\n' 'unexpected timeout success' >&2
  exit 1
else
  curl_status=$?
  printf 'timeout curl_exit=%s\n' "$curl_status"
  test "$curl_status" -eq 28
fi

# 读取 Retry-After，并让总 deadline 决定是否还有等待预算
python3 - "$base_url/request?case=rate-limit&request_id=fixture-rate-limit" <<'PY'
import os
import sys
import time
import urllib.error
import urllib.request

url = sys.argv[1]
key = os.environ["DEMO_KEY"]
request = urllib.request.Request(
    url,
    data=b'{"input":"ping"}',
    headers={"Authorization": f"Bearer {key}"},
    method="POST",
)
started = time.monotonic()
try:
    urllib.request.urlopen(request, timeout=2)
except urllib.error.HTTPError as error:
    retry_after = float(error.headers["Retry-After"])
    remaining = 1.0 - (time.monotonic() - started)
    decision = "wait" if retry_after <= remaining else "stop"
    print({"status": error.code, "retry_after": retry_after, "decision": decision})
    assert error.code == 429
    assert decision == "stop"
else:
    raise AssertionError("expected rate limit")
PY

# 主动取消等待：取消 asyncio 任务，不把未确认结果改写成服务端失败
cancel_token="cancel-$$"
python3 - "$base_url/request?case=timeout&request_id=$cancel_token" \
  "$received_dir" "$completion_dir" "$cancel_token" <<'PY'
import asyncio
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

parts = urlsplit(sys.argv[1])
received_dir = Path(sys.argv[2])
completion_dir = Path(sys.argv[3])
request_id = sys.argv[4]
path = parts.path + (f"?{parts.query}" if parts.query else "")
body = b'{"input":"ping"}'
sent = asyncio.Event()

async def fetch():
    reader, writer = await asyncio.open_connection(parts.hostname, parts.port)
    try:
        request = (
            f"POST {path} HTTP/1.1\r\n"
            f"Host: {parts.hostname}\r\n"
            f"Authorization: Bearer {os.environ['DEMO_KEY']}\r\n"
            f"Content-Length: {len(body)}\r\n"
            "Content-Type: application/json\r\n\r\n"
        ).encode() + body
        writer.write(request)
        await writer.drain()
        sent.set()
        await reader.read()
    finally:
        writer.close()
        await writer.wait_closed()

async def main():
    task = asyncio.create_task(fetch())
    await asyncio.wait_for(sent.wait(), timeout=1)
    for _ in range(100):
        if (received_dir / f"{request_id}.marker").is_file():
            break
        await asyncio.sleep(0.01)
    else:
        raise AssertionError("fixture did not receive the request")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print({"request_sent": True, "cancelled": True})
        return
    raise AssertionError("expected task cancellation")

asyncio.run(main())
PY

for _ in $(seq 1 60); do
  test -f "$completion_dir/$cancel_token.marker" && break
  sleep 0.05
done
test -f "$completion_dir/$cancel_token.marker"
printf 'server_completion=%s\n' "$cancel_token:completed"

grep -F '"authorization": "[redacted]"' "$log_file"
! printf '%s\n' "$DEMO_KEY" | grep -F -f - "$fixture"
! printf '%s\n' "$DEMO_KEY" | grep -F -f - "$log_file"
```

### 观察输出

{% note success flat %}
在这个实验中，成功路径应显示 `request_id=fixture-001`；负例应分别观察 `401`、`429`、`503`，超时则没有可依赖的 HTTP 状态并以 curl 的 `28` 退出码表示本地截止时间先到。随后客户端读取 `Retry-After: 2`，因总 deadline 只有 1 秒而停止等待；主动取消 asyncio 任务后，客户端的取消状态和夹具最终完成标记都可观察，这说明服务端可能继续处理而客户端已经不知道结果。最后三条检查证明夹具日志和夹具源码都没有出现环境变量中的合成 Key。
{% endnote %}

示例输出的结构如下；端口号不固定，不能把它写死为验收条件：

```text
{"request_id": "fixture-001", "output": "accepted"}
{'status': 200, 'request_id': 'fixture-001'}
bad-key status=401
rate-limit status=429
server-error status=503
timeout curl_exit=28
{'status': 429, 'retry_after': 2.0, 'decision': 'stop'}
{'request_sent': True, 'cancelled': True}
{"event": "request", "status": 200, "authorization": "[redacted]"}
...
```

{% note warning flat %}
这个夹具没有模拟真实模型生成，也没有验证任何厂商 Key。它只能证明：变量被注入而没有被回显，客户端能读取成功响应，状态码和本地超时可以分开分类。若改用真实 endpoint，必须先核对字段、权限、数据处理和费用，再把请求限定在可接受的测试范围内。
{% endnote %}

## 错误分类

### 错误决策

{% note info flat %}
把错误分类写成可执行的决策，而不是把所有异常统一重试。
{% endnote %}

1. 先保留状态码、响应体摘要、请求 ID、尝试次数和总 deadline；原始响应可能包含敏感输入，日志应按字段脱敏。
2. `401`/`403` 先检查 endpoint、认证头、Key 状态和权限；修正前停止重试。
3. `429` 读取 `Retry-After` 或 Provider 的限流说明，在截止时间和次数上限内等待；超过预算就降级或返回可解释错误。
4. `408`、部分 `5xx` 和连接失败只能在操作可安全重复时重试；每次等待都受同一个总 deadline 约束。
5. 客户端 timeout 记录“结果未确认”，不要把它改写成“服务端失败”；涉及扣费或写入时应查询状态、使用幂等键或转人工处理。

{% note danger flat %}
无条件重试会放大三类问题：认证配置错误会持续失败，限流会被继续触发，已经被服务接受的请求可能被重复提交。重试策略至少需要错误分类、次数上限、指数退避或服务端等待提示、总截止时间和最终降级动作。
{% endnote %}

## 结果验证

{% note success flat %}
完成本节后，应能用一张最小证据表解释一次调用：请求去了哪个 endpoint，认证从哪里注入，发送了哪些非敏感字段，响应状态和请求 ID 是什么，错误属于哪一类，是否允许有限重试，以及 Key 是否出现在源码或日志中。只要其中一项无法观察，就把结论标记为未验证，而不是用“接口正常”概括。
{% endnote %}

| 验收项 | 操作 | 通过证据 | 失败后的复测 |
| --- | --- | --- | --- |
| 配置隔离 | 从环境注入合成 Key，扫描示例与日志 | 源码只有变量名，日志只有 `[redacted]` | 删除回显语句，关闭 `set -x` 后重跑 |
| 请求闭环 | 用 curl 和 Python 各请求一次本地夹具 | 两次都得到 `200` 与 `fixture-001` | 比较 endpoint、认证头和 JSON 请求体 |
| 状态分类 | 请求 `bad-key`、`rate-limit`、`server-error` | 分别记录 `401`、`429`、`503` | 确认没有把所有状态归为模型错误 |
| 超时边界 | 使用短 `--max-time` 请求 timeout 夹具 | curl 以 `28` 结束且无伪造 HTTP 状态 | 加总 deadline，不增加无限重试 |
| 限流预算 | 读取 `Retry-After`，与总 deadline 比较 | `2` 秒等待超过 1 秒预算，决策为 `stop` | 重新设置上限，不无条件等待 |
| 取消边界 | 在服务延迟时取消 asyncio 任务，并有界等待夹具完成标记 | 客户端标记取消，夹具随后完成，结果仍记为未确认 | 查询或补偿，不把取消改写为成功 |
| 真实调用边界 | 仅在显式提供凭据后单独验证 | 记录 Provider、版本、权限、费用与响应范围 | 网络或权限失败时保留本地证据，不伪造线上结果 |

{% note info flat %}
本地夹具的通过结果不替代 Provider 文档和真实环境验收；Provider 的认证头、模型名、响应结构、限流策略和数据保留政策可能变化。将这些差异留在对应官方文档和后续适配文章中，能避免把一个“兼容入口”误写成所有服务的共同标准。
{% endnote %}

## 常见问题

{% flashcard basic id:llm-api-key-source deck:"大模型应用开发" priority:1 tags:"API与密钥,安全" %}
--- question
为什么不能把 API Key 写进示例代码？
--- answer
因为示例代码会进入版本库、日志、截图或前端构建产物；Key 一旦泄露就可能被复用，删除文本也不能撤销已经复制的凭据。
--- explanation
把变量名写进 `.env.example` 可以说明配置契约，但真实值应由运行环境或密钥管理器注入。客户端只记录 `key_present=true`、状态码和请求 ID，不记录认证头。若真实 Key 已经进入仓库、Shell 历史或日志，应先撤销并轮换，再清理暴露面；单独删除一行代码不能证明访问能力已经失效。
{% endflashcard %}

{% flashcard basic id:llm-api-timeout-retry deck:"大模型应用开发" priority:1 tags:"API与密钥,可靠性" %}
--- question
超时后是否可以无条件重试？
--- answer
不可以。超时只说明客户端在截止时间前没有得到结果，请求可能已在服务端执行；重试必须受幂等性、次数、退避和总 deadline 约束。
--- explanation
判断顺序应保持可观察：

1. `401`/`403` 先修正认证或权限，不能靠重试解决。
2. `429` 读取服务端等待提示，与剩余 deadline 和次数上限比较。
3. `5xx` 或连接失败才可能进入有限重试；每次等待都受同一个总 deadline 约束。
4. 客户端 timeout 或主动取消没有可靠的 HTTP 结果，涉及写入或扣费时要查询状态、使用幂等键或转人工处理。

即使模型生成没有业务写入，重复调用也可能重复消耗 Token 和费用。
{% endflashcard %}

## 参考资料

### 官方接口

{% linkgroup %}
{% link OpenAI Responses API, https://platform.openai.com/docs/api-reference/responses, https://platform.openai.com/favicon.ico %}
{% link Anthropic Messages API, https://docs.anthropic.com/en/api/messages, https://docs.anthropic.com/favicon.ico %}
{% link Gemini Interactions API, https://ai.google.dev/gemini-api/docs/interactions-overview, https://ai.google.dev/favicon.ico %}
{% link xAI Chat Completions REST API, https://docs.x.ai/developers/rest-api-reference/inference/chat, https://docs.x.ai/favicon.ico %}
{% link DeepSeek Chat Completion API, https://api-docs.deepseek.com/api/create-chat-completion/, https://api-docs.deepseek.com/favicon.ico %}
{% endlinkgroup %}

### 兼容入口与工具

{% linkgroup %}
{% link Kimi Chat API, https://platform.kimi.ai/docs/api/chat, https://platform.kimi.ai/favicon.ico %}
{% link Z.ai GLM Chat Completion, https://docs.z.ai/api-reference/llm/chat-completion, https://docs.z.ai/favicon.ico %}
{% link Qwen OpenAI-compatible Chat Completions, https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions, https://www.alibabacloud.com/favicon.ico %}
{% link Python 3.13 Standard Library, https://docs.python.org/3.13/library/index.html, https://docs.python.org/3.13/favicon.ico %}
{% link curl man page, https://curl.se/docs/manpage.html, https://curl.se/favicon.ico %}
{% endlinkgroup %}

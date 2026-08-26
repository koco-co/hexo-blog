---
title: Playwright(九)API与网络
tags:
  - Playwright
  - APIRequestContext
  - 网络Mock
  - HAR
categories:
  - Learn Topic
  - Playwright
description: 使用 APIRequestContext 准备、核验和清理测试数据，掌握请求监听、路由拦截与 HAR 回放，在 UI 之外建立可控且可诊断的网络依赖闭环。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 9
published: true
abbrlink: 316789b8
date: 2026-08-24 12:04:00
---

{% course_series %}

{% note info flat %}
UI 测试不应该用 UI 完成所有准备和清理。本文复用同一份 ShopLab 服务：`POST /api/orders` 造订单、`GET /api/orders/{id}` 核验、`DELETE /api/test/orders/{id}` 清理；浏览器只负责用户真正关心的提交动作。
{% endnote %}

## 请求模型

| 入口 | 认证与 Cookie | 生命周期 | 适用场景 |
| --- | --- | --- | --- |
| `playwright.request.new_context()` | 独立 | 手工 `dispose()` | 测试数据工厂、后台管理员 API |
| `page.request` / `context.request` | 与 BrowserContext 共享 Cookie | 随 Context 关闭 | 验证当前登录用户的 API 行为 |

独立 API client 应显式关闭：

```python
import pytest
from playwright.sync_api import Playwright


@pytest.fixture
def admin_api(playwright: Playwright, shoplab_url: str):
    request = playwright.request.new_context(
        base_url=shoplab_url,
        extra_http_headers={"X-Test-Token": "local-test-only"},
    )
    try:
        yield request
    finally:
        request.dispose()
```

常用 HTTP 动词按资源语义选择，而不是一律使用 `post()`：

| 方法 | 常见用途 | 请求体与核验 |
| --- | --- | --- |
| `get()` | 读取资源 | 通常无请求体；核验状态与 JSON/文本 |
| `post()` | 创建资源或触发命令 | `data=` 发送 JSON，`form=` 发送表单 |
| `put()` | 整体替换资源 | 传完整资源并核验最终状态 |
| `patch()` | 局部更新资源 | 只传变化字段并核验未修改字段仍存在 |
| `delete()` | 删除资源 | 核验状态，并按业务合同确认是否幂等 |
| `head()` | 只读取响应头 | 不解析正文，用于缓存或文件元数据检查 |
| `fetch()` | 动态方法或共用请求逻辑 | 通过 `method=` 选择方法，仍返回 `APIResponse` |

{% note info flat %}
下面的片段接上文的 `admin_api` Fixture，并假定 `order_id` 已由测试数据工厂创建；单独复制时先补齐这两个变量的来源。
{% endnote %}

```python
updated = admin_api.fetch(
    f"/api/orders/{order_id}",
    method="PATCH",
    data={"status": "ready"},
    fail_on_status_code=True,
)
expect(updated).to_be_ok()
assert updated.json()["status"] == "ready"
```

{% note info flat %}
`to_be_ok()` 只接受 `APIResponse`，通过条件是 2xx；反向条件使用 `expect(response).not_to_be_ok()`。默认情况下 4xx/5xx 不会让请求方法抛错，而是由 `status`、`ok` 或断言暴露；`fail_on_status_code=True` 才会把它们转成异常。`max_redirects` 限制重定向次数，`max_retries` 在 1.62 只重试 `ECONNRESET`，不会按 HTTP 状态码重试，`ignore_https_errors` 只应在受控测试证书环境中启用。
{% endnote %}

{% note info flat %}
APIResponse 按验证目标选择读取方式：`status` 是整数状态码，`status_text` 是状态文本，`ok` 是“是否为 2xx”的布尔值；`headers` 返回便于按名称读取的字典，`headers_array` 则保留原始大小写与重复 header；`json()` 解析 JSON，`text()` 解析文本，`body()` 保留原始 bytes，`url` 查看最终地址。JSON 格式错误会在 `json()` 处失败；大型响应不再使用后应 `dispose()` 释放内存。`security_details()`、`server_addr()` 与 `timing` 属于 TLS、服务器地址和性能诊断入口，本篇索引保留但不作为普通业务断言。
{% endnote %}

{% note info flat %}
`new_context()` 的长参数表按进入条件选择：`http_credentials`、`extra_http_headers` 和 `storage_state` 用于认证；`proxy`、`client_certificates` 和 `ignore_https_errors` 只在受控网络或测试证书环境使用；`timeout`、`max_redirects` 与请求方法上的 `max_retries` 用于限制等待和重试；需要录制或回放时再进入 Context 的 HAR 配置。不要为了“让请求成功”同时打开所有开关。
{% endnote %}

{% note info flat %}
API 登录状态可以转给 BrowserContext：
{% endnote %}

```python
login = admin_api.post("/api/test/login", data={"role": "buyer"})
expect(login).to_be_ok()

state = admin_api.storage_state()
context = browser.new_context(storage_state=state)
try:
    page = context.new_page()
    page.goto(f"{shoplab_url}/account")
    expect(page.get_by_role("heading", name="买家中心")).to_be_visible()
finally:
    context.close()
```

{% note danger flat %}
`storage_state()` 可能含 Cookie 与本地认证数据，只能使用专用测试账号，不应提交真实凭据。`page.request` / `context.request` 与当前 BrowserContext 共享 Cookie，适合以当前角色直接核验 API；独立 `playwright.request.new_context()` 适合后台造数。`APIRequestContext.tracing` 用于请求上下文的低层追踪入口，UI 失败取证仍以 BrowserContext Trace 为主。
{% endnote %}

{% note info flat %}
共享 Cookie 不是概念上的“可能共享”，可以直接验证登录前后权限：
{% endnote %}

```python
page.goto(f"{shoplab_url}/login?role=buyer&subject=buyer-test")
profile = page.context.request.get(f"{shoplab_url}/api/me")
expect(profile).to_be_ok()
assert profile.json()["subject"] == "buyer-test"

anonymous = browser.new_context()
try:
    denied = anonymous.request.get(f"{shoplab_url}/api/me")
    assert denied.status == 401
finally:
    anonymous.close()
```

{% note info flat %}
`BrowserContext.request` 的失败仍以 APIResponse 状态或显式 `fail_on_status_code` 表达；它不会因为 BrowserContext 存在就自动获得登录权限。
{% endnote %}

### 数据闭环

```python
from uuid import uuid4
from playwright.sync_api import Page, expect


def test_buyer_submits_order(page: Page, admin_api, shoplab_url: str) -> None:
    order_id = f"e2e-{uuid4().hex}"
    created = admin_api.post("/api/orders", data={
        "id": order_id, "buyer": "buyer-test", "status": "draft"
    })
    expect(created).to_be_ok()

    try:
        page.goto(f"{shoplab_url}/login?role=buyer&subject=buyer-test")
        page.goto(f"{shoplab_url}/orders/{order_id}")
        page.get_by_role("button", name="提交订单").click()
        expect(page.get_by_role("status")).to_have_text("submitted")

        verified = admin_api.get(f"/api/orders/{order_id}")
        expect(verified).to_be_ok()
        assert verified.json()["status"] == "submitted"
    finally:
        deleted = admin_api.delete(f"/api/test/orders/{order_id}")
        assert deleted.status == 200
```

{% note info flat %}
cleanup 放在 `finally`，因为 UI 断言失败后更需要清理。删除设计为幂等，允许资源已经不存在。测试 ID 带固定前缀与随机后缀，既能定位测试数据，又避免并行冲突。
{% endnote %}

## 网络控制

{% mermaid %}
flowchart TD
  R[页面请求] --> D{测试路由决策}
  D -->|fulfill| F[直接返回模拟响应]
  D -->|continue_| C[修改后发送真实网络并终止路由链]
  D -->|fallback| B[交给下一个匹配处理器]
  D -->|fetch| X[取得真实响应后再修改]
  D -->|abort| A[注入网络失败]
{% endmermaid %}

```python
import json

from playwright.sync_api import expect


def test_recommendation_fulfill(page, shoplab_url):
    def recommendations(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"items": [{"name": "测试键盘"}]}),
        )

    page.goto(f"{shoplab_url}/login?role=buyer&subject=recommendation-test")
    page.route("**/api/recommendations", recommendations)
    page.goto(f"{shoplab_url}/shop")
    expect(page.get_by_role("list", name="推荐商品")).to_contain_text("测试键盘")


def test_recommendation_offline(page, shoplab_url):
    page.goto(f"{shoplab_url}/login?role=buyer&subject=offline-test")
    page.route("**/api/recommendations", lambda route: route.abort("failed"))
    page.goto(f"{shoplab_url}/shop")
    expect(page.get_by_role("status", name="推荐状态")).to_have_text(
        "推荐暂不可用"
    )
```

{% note info flat %}
需要保留真实请求但增加测试 header 时使用 `continue_()`：
{% endnote %}

```python
page.route(
    "**/api/**",
    lambda route: route.continue_(
        headers={**route.request.headers, "X-E2E-Run": "run-1042"}
    ),
)
```

{% note danger flat %}
`continue_()` 可以修改普通 header，但 Cookie 仍由 BrowserContext 的 Cookie store 管理。认证状态应使用 Context Cookie API 或 `storage_state`，不要把路由 header 改写当成 Cookie 注入方案。
{% endnote %}

{% note info flat %}
`continue_()` 会立即把请求发送到网络并结束路由链；分层处理器应使用 `fallback()`。多个匹配处理器按注册的逆序执行：
{% endnote %}

```python
def add_run_id(route):
    route.fallback(headers={**route.request.headers, "X-E2E-Run": "run-1042"})


def verify_and_continue(route):
    assert route.request.header_value("X-E2E-Run") == "run-1042"
    route.continue_()


page.route("**/api/orders/**", verify_and_continue)
page.route("**/api/**", add_run_id)
```

{% note info flat %}
`fallback()` 还可以修改 `method`、`post_data`、`headers` 和同协议 `url`，让下一个处理器看到修改后的请求。`continue_(method=..., post_data=..., headers=..., url=...)` 也能覆盖原请求，但会立即发送网络并终止路由链；`method`、`post_data` 与 `url` 只作用于原请求，不会自动延续到后续重定向，只有 header 会传播到重定向请求，且 `url` 必须保持协议不变。只想拦截一次时使用 `page.route(pattern, handler, times=1)`。
{% endnote %}

{% note info flat %}
需要保留真实响应、只改其中一部分时使用 `fetch()` 后再 `fulfill()`：
{% endnote %}

```python
def add_test_item(route):
    upstream = route.fetch()
    payload = upstream.json()
    payload["items"].append({"name": "测试鼠标"})
    route.fulfill(response=upstream, json=payload)


page.route("**/api/recommendations", add_test_item)
page.goto(f"{shoplab_url}/shop")
expect(page.get_by_role("list", name="推荐商品")).to_contain_text("测试鼠标")
```

{% note info flat %}
`Route.request` 是当前被拦截的页面 Request，可读取 URL、方法、header 与请求体。`Route.fetch()` 遇到 4xx/5xx 仍返回 APIResponse，需要主动检查 `status` 或 `ok`；传输错误、超时或重定向超限才会抛错，不能把它当成永不失败的本地 Mock。
{% endnote %}

{% note info flat %}
路由范围应尽量窄，并在测试结束时由 Context 回收。不要拦截所有 `**/*` 再凭猜测转发，这会让静态资源和 Service Worker 行为难以诊断。
{% endnote %}

| 注册位置 | 作用范围 | 选择边界 |
| --- | --- | --- |
| `page.route()` | 当前 Page；与 Context 同时命中时优先 | 单页局部依赖；不能可靠捕获 popup 的首个请求 |
| `context.route()` | Context 内所有页面与 popup | 多页流程、popup 首请求和统一测试策略 |

```python
def test_context_route_covers_popup(context, page):
    context.route(
        "**/popup-profile",
        lambda route: route.fulfill(
            status=200,
            content_type="text/html",
            body="<h1>测试买家资料</h1>",
        ),
    )
    page.set_content('<a target="_blank" href="https://example.test/popup-profile">资料</a>')

    with page.expect_popup() as popup_info:
        page.get_by_role("link", name="资料").click()
    popup = popup_info.value
    expect(popup.get_by_role("heading", name="测试买家资料")).to_be_visible()
```

{% note info flat %}
这个例子在 popup 创建前注册 Context 路由，因此能覆盖首个导航请求。若同一 URL 同时存在 Page route，Page 规则优先；Service Worker 接管的请求仍需按前文设置单独处理，Context 关闭时规则随之回收。
{% endnote %}

{% note info flat %}
结束前可用 `page.unroute()` / `context.unroute()` 移除指定规则；动态注册了多条规则时使用 `unroute_all(behavior="wait")` 等待正在执行的 handler，避免并发清理悬空。`page.route_from_har()` 只影响当前 Page，`context.route_from_har()` 影响整个 Context。
{% endnote %}

{% note info flat %}
WebSocket 拦截必须在目标连接创建前注册。`page.route_web_socket()` 只作用于当前页面，`context.route_web_socket()` 覆盖 Context；本文只负责入口与范围，消息转发、修改和关闭属于 `WebSocketRoute` 的进一步用法。
{% endnote %}

### HAR 回放

{% note info flat %}
HAR 回放适合响应大而固定、逐个 `fulfill()` 成本高的依赖。下面的练习先启动本地 ShopLab 服务录制推荐响应，关闭真实服务后再从 HAR 回放同一 URL：
{% endnote %}

```python
from pathlib import Path

from playwright.sync_api import Browser, expect

from shoplab_server import running_shoplab


def test_har_replays_without_real_server(browser: Browser, tmp_path: Path) -> None:
    har_path = tmp_path / "recommendations.har"

    with running_shoplab() as shoplab_url:
        recorder = browser.new_context(
            record_har_path=har_path,
            record_har_url_filter="**/api/recommendations",
            service_workers="block",
        )
        page = recorder.new_page()
        page.goto(f"{shoplab_url}/api/recommendations")
        expect(page.locator("body")).to_contain_text("测试键盘")
        recorder.close()  # HAR 在 Context 关闭时写完

    replay = browser.new_context(service_workers="block")
    try:
        replay.route_from_har(
            har_path,
            url="**/api/recommendations",
            not_found="abort",
        )
        page = replay.new_page()
        page.goto(f"{shoplab_url}/api/recommendations")  # 真实服务已经停止
        expect(page.locator("body")).to_contain_text("测试键盘")
    finally:
        replay.close()
```

{% note info flat %}
录制时使用专用测试账号和脱敏数据；HAR 可能包含 URL、header、请求体与响应体。不能把真实 Cookie、Authorization 或个人数据写进博客、产物或仓库。API 变化时应重新录制并审查 diff，不能让旧 HAR 永久冻结错误合同。
{% endnote %}

{% note info flat %}
Playwright 的 page/context route 无法拦截已经被 Service Worker 接管的请求。需要网络 Mock 时可设置 `service_workers="block"`，但这也意味着当前用例不再验证真实 Service Worker 行为；PWA 流程应另设专门用例。
{% endnote %}

### 请求断言

{% note info flat %}
页面网络对象遵循两个主要生命周期：
{% endnote %}

```text
成功或 HTTP 错误：request → response → requestfinished
传输失败：        request → requestfailed
```

{% note info flat %}
HTTP 404/503 仍然收到了有效 HTTP 响应，因此不会触发 `requestfailed`；DNS、连接重置或客户端主动阻止等传输失败才进入失败分支。`expect_response()` 返回页面 `Response`，不能使用只接受 `APIResponse` 的 `expect(...).to_be_ok()`。
{% endnote %}

```python
from uuid import uuid4

from playwright.sync_api import expect


def test_submit_payload(page, admin_api, shoplab_url):
    order_id = f"protocol-{uuid4().hex}"
    seeded = admin_api.post(
        "/api/orders",
        data={"id": order_id, "buyer": "payload-test", "status": "draft"},
    )
    expect(seeded).to_be_ok()
    page.goto(f"{shoplab_url}/login?role=buyer&subject=payload-test")

    try:
        page.goto(f"{shoplab_url}/orders/{order_id}")
        with page.expect_request(f"**/api/orders/{order_id}/submit") as request_info:
            page.get_by_role("button", name="提交订单").click()

        request = request_info.value
        assert request.method == "POST"
        assert request.post_data_json["source"] == "checkout"

        with page.expect_response(f"**/api/orders/{order_id}") as response_info:
            page.reload()
        response = response_info.value
        assert response.ok
        assert response.status == 200
        assert response.json()["id"] == order_id
    finally:
        admin_api.delete(f"/api/test/orders/{order_id}")
```

{% note warning flat %}
请求断言证明浏览器发出了预期协议，但不能替代 UI 结果或后端最终状态。完整证据通常需要 UI、请求和 API verify 三层。
{% endnote %}

{% note info flat %}
Request 成员按诊断任务选择：
{% endnote %}

| 任务 | 成员 | 边界 |
| --- | --- | --- |
| 基本协议 | `url`、`method`、`resource_type` | 判断地址、方法和 document/xhr/fetch 等资源类型 |
| 请求头 | `headers`、`all_headers()`、`headers_array()` | `headers` 可能省略安全相关 header；需要完整值或重复 header 时使用后两者 |
| 请求体 | `post_data`、`post_data_buffer`、`post_data_json` | 分别用于文本、原始 bytes 和结构化数据；JSON 与 form-urlencoded 都可得到对象，其他不可解析正文可能抛错，无正文时可能为 None |
| 生命周期 | `response()`、`failure` | 前者等待关联响应；传输失败读取 `failure`，HTTP 错误不属于 failure |
| 重定向 | `redirected_from`、`redirected_to` | 沿请求链向前或向后诊断，不能只看最终 URL |

{% note info flat %}
`existing_response` 只返回当前已经存在的关联响应，不会等待；`response()` 才适合需要等待响应的流程。`is_navigation_request()`、`frame`、`service_worker` 用于判断请求发起方，`timing` 与 `sizes()` 用于性能诊断。这些低频诊断成员保留在进阶索引中，不应作为脆弱的日常业务断言。
{% endnote %}

{% note info flat %}
Response 成员也按任务分组：
{% endnote %}

| 任务 | 成员 | 边界 |
| --- | --- | --- |
| 结果 | `status`、`status_text`、`ok`、`url` | `ok` 只表示 2xx；404 仍是 Response，但 `ok` 为 False |
| 正文 | `json()`、`text()`、`body()` | 分别返回对象、字符串和 bytes；解析格式错误会抛错 |
| 响应头 | `headers`、`all_headers()`、`headers_array()` | 读取一个名称用 `header_value()`；需要同名全部重复值，尤其 `Set-Cookie`，用 `header_values()`；完整或数组形态用于整体诊断 |
| 关联 | `request`、`finished()` | 回到触发请求；`finished()` 等待响应体结束，正常返回 `None`，目标关闭等异常情况直接抛出 |

{% note info flat %}
`frame`、`from_service_worker`、`http_version()`、`security_details()` 与 `server_addr()` 用于请求发起方、协议、TLS 和服务器诊断。不要用这些易受环境影响的值代替用户可观察结果。
{% endnote %}

{% note info flat %}
需要明确等待整个请求完成时使用 `expect_request_finished()`；捕获失败则监听 `requestfailed` 事件。下例把 HTTP 错误和网络失败分开：
{% endnote %}

```python
with page.expect_response("**/missing") as missing_info:
    page.get_by_role("button", name="请求缺失资源").click()
assert missing_info.value.status == 404

failed = []
page.on("requestfailed", lambda request: failed.append(request))
page.route("**/offline", lambda route: route.abort("failed"), times=1)
page.get_by_role("button", name="请求离线资源").click()
expect(page.get_by_role("status")).to_have_text("网络不可用")
assert failed and failed[0].failure is not None
```

### 策略选择

{% note info flat %}
为“固定推荐列表”“追加追踪 header”“模拟断网”“分层规则继续匹配”“保留真实响应但局部改写”“准备订单”“核验订单”分别选择 fulfill、continue、abort、fallback、fetch 或 APIRequestContext，并说明每项还缺哪一层业务证据。
{% endnote %}

{% hideToggle 参考映射, #f0f4ff, #1f2d3d %}
固定推荐列表用 `fulfill`，追加普通 header 用 `continue_`，断网用 `abort`，分层规则继续匹配用 `fallback`，保留真实响应但局部改写用 `fetch` 后 `fulfill`，准备与核验订单用独立 `APIRequestContext`。路由动作仍需 UI 断言用户可见结果；API seed 需要 UI 执行被测动作；API verify 需要先有 UI 或协议动作作为原因。
{% endhideToggle %}

## 接口边界

{% note info flat %}
以下索引按 Playwright Python 1.62.0 的同步 API 归类，方便在具体场景中选择对象、成员和参数；它是查询表，不替代前文的机制、示例与失败边界。异步 API 只在实际执行 I/O 时使用 await。
{% endnote %}

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 主线成员 | 常用成员 | 扩展成员与参数 | 替代写法 |
| --- | --- | --- | --- | --- |
| `APIRequest` | `new_context()` | — | — | — |
| `APIRequestContext` | `delete()`、`fetch()`、`get()`、`post()`、`storage_state()` | `dispose()`、`head()`、`patch()`、`put()`、`tracing` | — | — |
| `APIResponse` | — | `body()`、`dispose()`、`headers`、`headers_array`、`json()`、`ok`、`status`、`status_text`、`text()`、`url` | `security_details()`、`server_addr()`、`timing` | — |
| `APIResponseAssertions` | `to_be_ok()` | `not_to_be_ok()` | — | — |
| `BrowserContext` | `request`、`route()` | `route_from_har()`、`route_web_socket()`、`unroute()`、`unroute_all()` | — | — |
| `Page` | `route()` | `expect_request()`、`expect_request_finished()`、`expect_response()`、`request`、`route_from_har()`、`route_web_socket()`、`unroute()`、`unroute_all()` | — | — |
| `Playwright` | — | `request` | — | — |
| `Request` | — | `all_headers()`、`failure`、`headers`、`headers_array()`、`method`、`post_data`、`post_data_buffer`、`post_data_json`、`redirected_from`、`redirected_to`、`resource_type`、`response()`、`url` | `existing_response`、`frame`、`header_value()`、`is_navigation_request()`、`service_worker`、`sizes()`、`timing` | — |
| `Response` | — | `all_headers()`、`body()`、`finished()`、`headers`、`headers_array()`、`json()`、`ok`、`request`、`status`、`status_text`、`text()`、`url` | `frame`、`from_service_worker`、`header_value()`、`header_values()`、`http_version()`、`security_details()`、`server_addr()` | — |
| `Route` | `abort()`、`continue_()`、`fallback()`、`fetch()`、`fulfill()`、`request` | — | — | — |
| `APIRequest.new_context` 参数 | — | — | `base_url`, `client_certificates`, `extra_http_headers`, `fail_on_status_code`, `http_credentials`, `ignore_https_errors`, `max_redirects`, `proxy`, `storage_state`, `timeout`, `user_agent` | — |
| `APIRequestContext.delete` 参数 | — | — | `data`, `fail_on_status_code`, `form`, `headers`, `ignore_https_errors`, `max_redirects`, `max_retries`, `multipart`, `params`, `timeout`, `url` | — |
| `APIRequestContext.dispose` 参数 | — | — | `reason` | — |
| `APIRequestContext.fetch` 参数 | — | `fail_on_status_code`, `ignore_https_errors`, `max_redirects`, `max_retries` | `data`, `form`, `headers`, `method`, `multipart`, `params`, `timeout`, `url_or_request` | — |
| `APIRequestContext.get` 参数 | — | — | `data`, `fail_on_status_code`, `form`, `headers`, `ignore_https_errors`, `max_redirects`, `max_retries`, `multipart`, `params`, `timeout`, `url` | — |
| `APIRequestContext.head` 参数 | — | — | `data`, `fail_on_status_code`, `form`, `headers`, `ignore_https_errors`, `max_redirects`, `max_retries`, `multipart`, `params`, `timeout`, `url` | — |
| `APIRequestContext.patch` 参数 | — | — | `data`, `fail_on_status_code`, `form`, `headers`, `ignore_https_errors`, `max_redirects`, `max_retries`, `multipart`, `params`, `timeout`, `url` | — |
| `APIRequestContext.post` 参数 | — | — | `data`, `fail_on_status_code`, `form`, `headers`, `ignore_https_errors`, `max_redirects`, `max_retries`, `multipart`, `params`, `timeout`, `url` | — |
| `APIRequestContext.put` 参数 | — | — | `data`, `fail_on_status_code`, `form`, `headers`, `ignore_https_errors`, `max_redirects`, `max_retries`, `multipart`, `params`, `timeout`, `url` | — |
| `APIRequestContext.storage_state` 参数 | — | — | `indexed_db`, `path` | — |
| `BrowserContext.route` 参数 | — | `times` | `handler`, `url` | — |
| `BrowserContext.route_from_har` 参数 | — | — | `har`, `not_found`, `update`, `update_content`, `update_mode`, `url` | — |
| `BrowserContext.route_web_socket` 参数 | — | — | `handler`, `url` | — |
| `BrowserContext.unroute` 参数 | — | — | `handler`, `url` | — |
| `BrowserContext.unroute_all` 参数 | — | — | `behavior` | — |
| `Page.expect_request` 参数 | — | — | `timeout`, `url_or_predicate` | — |
| `Page.expect_request_finished` 参数 | — | — | `predicate`, `timeout` | — |
| `Page.expect_response` 参数 | — | — | `timeout`, `url_or_predicate` | — |
| `Page.route` 参数 | — | `times` | `handler`, `url` | — |
| `Page.route_from_har` 参数 | — | — | `har`, `not_found`, `update`, `update_content`, `update_mode`, `url` | — |
| `Page.route_web_socket` 参数 | — | — | `handler`, `url` | — |
| `Page.unroute` 参数 | — | — | `handler`, `url` | — |
| `Page.unroute_all` 参数 | — | — | `behavior` | — |
| `Request.header_value` 参数 | — | — | `name` | — |
| `Response.header_value` 参数 | — | — | `name` | — |
| `Response.header_values` 参数 | — | — | `name` | — |
| `Route.abort` 参数 | — | — | `error_code` | — |
| `Route.continue_` 参数 | — | `headers`, `method`, `post_data`, `url` | — | — |
| `Route.fallback` 参数 | — | `headers`, `method`, `post_data`, `url` | — | — |
| `Route.fetch` 参数 | — | — | `headers`, `max_redirects`, `max_retries`, `method`, `post_data`, `timeout`, `url` | — |
| `Route.fulfill` 参数 | — | — | `body`, `content_type`, `headers`, `json`, `path`, `response`, `status` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-api-seed deck:"Playwright" priority:1 tags:"APIRequestContext,测试数据" %}
--- question
什么时候用 API 准备数据，什么时候必须走 UI？
--- answer
前置数据用 API，被测用户旅程使用 UI。
--- explanation
创建大量历史订单只是准备条件，可由 API 高效完成；买家提交订单若是被测行为，就必须通过 UI 执行，并结合页面或 API 验证结果。
{% endflashcard %}

{% flashcard choice id:playwright-route-actions deck:"Playwright" priority:2 tags:"网络Mock,Route" answer:C %}
--- question
需要模拟推荐接口断网时，应使用哪种路由动作？
- [A] `continue_()`
- [B] `fulfill()`
- [C] `abort()`
--- answer
C
--- explanation
`abort()` 注入网络失败；`fulfill()` 返回模拟响应；`continue_()` 修改后继续发送真实请求。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link API Testing, https://playwright.dev/python/docs/api-testing, https://playwright.dev/img/playwright-logo.svg %}
{% link APIRequestContext, https://playwright.dev/python/docs/api/class-apirequestcontext, https://playwright.dev/img/playwright-logo.svg %}
{% link Network, https://playwright.dev/python/docs/network, https://playwright.dev/img/playwright-logo.svg %}
{% link Mock APIs, https://playwright.dev/python/docs/mock, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

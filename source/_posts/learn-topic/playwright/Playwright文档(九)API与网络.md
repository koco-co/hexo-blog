---
title: Playwright文档(九) API与网络
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

{% note info no-icon modern %}
UI 测试不应该用 UI 完成所有准备和清理。本文复用第七篇的 ShopLab 服务：`POST /api/orders` 造订单、`GET /api/orders/{id}` 核验、`DELETE /api/test/orders/{id}` 清理；浏览器只负责用户真正关心的提交动作。
{% endnote %}

## APIRequestContext

| 来源 | 认证与 Cookie | 生命周期 | 适用场景 |
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

## 数据闭环

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

cleanup 放在 `finally`，因为 UI 断言失败后更需要清理。删除设计为幂等，允许资源已经不存在。测试 ID 带固定前缀与随机后缀，既能定位测试数据，又避免并行冲突。

## 路由拦截

{% mermaid %}
flowchart TD
  R[页面请求] --> D{测试路由决策}
  D -->|fulfill| F[直接返回模拟响应]
  D -->|continue_| C[修改后发送真实网络]
  D -->|abort| A[注入网络失败]
{% endmermaid %}

```python
import json

from playwright.sync_api import expect


def test_recommendation_fallback(page, shoplab_url):
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

需要保留真实请求但增加测试 header 时使用 `continue_()`：

```python
page.route(
    "**/api/**",
    lambda route: route.continue_(
        headers={**route.request.headers, "X-E2E-Run": "run-1042"}
    ),
)
```

`continue_()` 可以修改普通 header，但 Cookie 仍由 BrowserContext 的 Cookie store 管理。认证状态应使用 Context Cookie API 或 `storage_state`，不要把路由 header 改写当成 Cookie 注入方案。

路由范围应尽量窄，并在测试结束时由 Context 回收。不要拦截所有 `**/*` 再凭猜测转发，这会让静态资源和 Service Worker 行为难以诊断。

## HAR 回放

HAR 回放适合响应大而固定、逐个 `fulfill()` 成本高的依赖。下面的练习先启动第七篇服务录制推荐响应，关闭真实服务后再从 HAR 回放同一 URL：

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

录制时使用专用测试账号和脱敏数据；HAR 可能包含 URL、header、请求体与响应体。不能把真实 Cookie、Authorization 或个人数据写进博客、产物或仓库。API 变化时应重新录制并审查 diff，不能让旧 HAR 永久冻结错误合同。

Playwright 的 page/context route 无法拦截已经被 Service Worker 接管的请求。需要网络 Mock 时可设置 `service_workers="block"`，但这也意味着当前用例不再验证真实 Service Worker 行为；PWA 流程应另设专门用例。

## 请求断言

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
        expect(response_info.value).to_be_ok()
    finally:
        admin_api.delete(f"/api/test/orders/{order_id}")
```

请求断言证明浏览器发出了预期协议，但不能替代 UI 结果或后端最终状态。完整证据通常需要 UI、请求和 API verify 三层。

## 策略选择

为“固定推荐列表”“追加追踪 header”“模拟断网”“准备订单”“核验订单”分别选择 fulfill、continue、abort 或 APIRequestContext，并说明每项还缺哪一层业务证据。

{% hideToggle 参考映射, #f0f4ff, #1f2d3d %}
固定推荐列表用 `fulfill`，追加普通 header 用 `continue_`，断网用 `abort`，准备与核验订单用独立 `APIRequestContext`。前三项仍需 UI 断言用户可见结果；API seed 需要 UI 执行被测动作；API verify 需要先有 UI 或协议动作作为原因。
{% endhideToggle %}

## 常见问题

{% flashcard basic id:playwright-api-seed deck:"Playwright" tags:"APIRequestContext,测试数据" %}
--- question
什么时候用 API 准备数据，什么时候必须走 UI？
--- answer
前置数据用 API，被测用户旅程使用 UI。
--- explanation
创建大量历史订单只是准备条件，可由 API 高效完成；买家提交订单若是被测行为，就必须通过 UI 执行，并结合页面或 API 验证结果。
{% endflashcard %}

{% flashcard choice id:playwright-route-actions deck:"Playwright" tags:"网络Mock,Route" answer:C %}
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

---
title: Playwright文档(十二) 项目实战
tags:
  - Playwright
  - 端到端测试
  - 跨浏览器测试
  - 测试交付
categories:
  - Learn Topic
  - Playwright
description: 综合环境、定位、断言、交互、上下文、POM、Fixture、API、网络控制、调试与跨浏览器 CI，设计并交付一套可重复、可诊断的 ShopLab 测试套件。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 12
published: true
abbrlink: 8141684d
date: 2026-08-24 12:01:00
---

{% course_series %}

项目实战不是再学一个新 API，而是证明你能把第二至第十篇的主线能力组合成一套可重复、可诊断、可安全交付的测试套件。项目载体叫 **ShopLab**：买家把商品加入购物车并提交订单，管理员在独立会话中处理订单，测试通过 API 造数、核验和清理。

本文冻结 ShopLab 的最小合同，并给出可以复制到独立练习项目的代码块。博客仓库不会创建 `shoplab/`、`tests/` 或基线图片目录；因此文中的业务代码是课程实现蓝图，不能冒充已经在本仓库运行过的真实 E2E。

## 项目合同

先写清用户、页面和接口，避免测试过程中不断发明需求。

### 角色与业务规则

| 角色 | 能做什么 | 不能做什么 |
| --- | --- | --- |
| buyer | 浏览商品、加入购物车、提交自己的订单 | 打开管理页、处理订单 |
| admin | 查看待处理订单、标记为已处理 | 使用买家的购物车状态 |

最小业务规则：

1. 买家提交后看到唯一订单号和 `submitted` 状态；
2. 管理员能看到该订单并改为 `processed`；
3. 买家的订单详情最终显示 `processed`；
4. 推荐接口失败时，商品主流程仍然可用，并展示降级提示；
5. 未登录或无权限访问管理页时跳转到登录页。

### 页面与 API

```text
GET  /login                 登录页
GET  /shop                  商品列表与推荐区域
GET  /checkout              结算页
GET  /orders/{order_id}     买家订单详情
GET  /admin/orders          管理员订单列表

GET  /api/cart              查询当前买家的购物车
POST /api/cart              把商品加入当前买家的购物车
DELETE /api/cart            清空当前买家的购物车
POST /api/orders            当前买家创建订单
POST /api/orders/{id}/submit 提交已有订单
GET  /api/orders/{id}       查询订单状态
PATCH /api/orders/{id}      管理员处理订单
GET  /api/recommendations   可被 route 注入失败的非核心依赖

POST /api/test/sessions     测试专用：创建 buyer/admin 会话
DELETE /api/test/sessions/{id} 测试专用：撤销会话
POST /api/test/products     测试专用：创建商品
DELETE /api/test/orders/{id} 测试专用：清理订单
DELETE /api/test/products/{id} 测试专用：清理商品
```

这不是另一套 ShopLab：服务实现以第七篇 `shoplab_server.py` 为唯一实现，第九篇只增加调用和 HAR 练习。固定协议还包括：测试 API 使用 `X-Test-Token: local-test-only`；session 创建响应含 `id` 与可直接传给 `new_context(storage_state=...)` 的 `storage_state`；浏览器 Cookie 名为 `session`；`/shop` 用有 accessible name 的 article 展示商品；`/checkout` 暴露“订单摘要”region，提交成功的 status 同时显示订单号与 `submitted`，并含 `data-order-id`；`/admin/orders` 用 row 展示订单号、状态和“标记为已处理”按钮。

测试专用接口只能在本地或隔离测试环境开启，并通过单独凭据和网络策略保护。不要把绕过 UI 的 seed/cleanup API 暴露到生产环境。

## 证据边界

毕业项目接受的是分层证据，不是一句“都通过了”。

| 层级 | 能证明什么 | 不能证明什么 |
| --- | --- | --- |
| 静态检查 | Python 与配置可解析 | 浏览器业务正确 |
| pytest | 当前测试进程中的断言结果 | CI 或线上环境相同 |
| 本地浏览器 E2E | 当前 ShopLab 环境的真实 UI 流程 | 生产数据和外部依赖正常 |
| CI 矩阵 | 指定提交在指定 runner 和浏览器通过 | 未执行的线上路径通过 |
| 线上监控/验证 | 线上当时的被测信号 | 所有用户永不失败 |

未执行、证据丢失或环境不同的层级必须标记 `NOT VERIFIED`。Trace、截图和录像是诊断材料，只有和业务断言组合后才构成测试证据。

## 项目结构

下面是建议复制到独立练习项目的逻辑结构，不会在博客项目中实际创建：

```text
shoplab-e2e/
├── pyproject.toml
├── uv.lock
├── shoplab_server.py
├── tests/
│   ├── conftest.py
│   ├── pages/
│   │   ├── shop_page.py
│   │   ├── checkout_page.py
│   │   └── admin_orders_page.py
│   ├── test_order_lifecycle.py
│   ├── test_auth_failure.py
│   └── test_recommendation_fallback.py
└── .github/workflows/e2e.yml
```

`shoplab_server.py` 必须逐字复制第七篇的完整同名代码块；本文不再复制第二份实现，以免两份“真相”漂移。上面的树只是读者练习项目的逻辑结构，所有示例在博客仓库中仍只存在于 Markdown 代码块。

依赖保持最小：

```toml
# pyproject.toml
[project]
name = "shoplab-e2e"
version = "0.1.0"
requires-python = ">=3.13"
dependencies = []

[dependency-groups]
dev = [
  "playwright==1.62.0",
  "pytest==8.4.2",
  "pytest-playwright==0.9.0",
  "pytest-xdist==3.8.0",
]
```

示例显式锁定依赖，便于复现实践环境。迁入真实项目时应重新检查 Python 支持范围、发行说明和锁文件，而不是永久复制版本号。

## Fixture 设计

测试需要三个所有权边界：每条用例独立的 BrowserContext、每个 worker 独立的 namespace、由创建者负责清理的服务端数据。

```python
# tests/conftest.py
from collections.abc import Iterator
from uuid import uuid4

import pytest
from playwright.sync_api import APIRequestContext, Playwright

from shoplab_server import running_shoplab


@pytest.fixture(scope="session")
def namespace(worker_id: str) -> str:
    return f"shoplab-{worker_id}-{uuid4().hex[:8]}"


@pytest.fixture(scope="session")
def shoplab_url() -> Iterator[str]:
    with running_shoplab() as url:
        yield url


@pytest.fixture(scope="session")
def api(
    playwright: Playwright,
    shoplab_url: str,
) -> Iterator[APIRequestContext]:
    client = playwright.request.new_context(
        base_url=shoplab_url,
        extra_http_headers={"X-Test-Token": "local-test-only"},
    )
    yield client
    client.dispose()


@pytest.fixture
def product(api: APIRequestContext, namespace: str) -> Iterator[dict]:
    response = api.post(
        "/api/test/products",
        data={"name": f"Keyboard-{namespace}", "price": 88_00},
    )
    assert response.ok, response.text()
    created = response.json()

    yield created

    cleanup = api.delete(f"/api/test/products/{created['id']}")
    assert cleanup.ok, cleanup.text()
```

这里用整数分表示金额，避免浮点误差。清理断言也不能静默忽略，否则下一次运行会继承污染数据。

登录状态由 API 创建，但仍由浏览器真实消费：

```python
from collections.abc import Iterator
from dataclasses import dataclass

import pytest
from playwright.sync_api import APIRequestContext, BrowserContext
from pytest_playwright.pytest_playwright import CreateContextCallback


@dataclass(frozen=True)
class SessionLease:
    id: str
    storage_state: dict


def create_session(
    api: APIRequestContext,
    role: str,
    namespace: str,
    *,
    expired: bool = False,
) -> SessionLease:
    response = api.post(
        "/api/test/sessions",
        data={
            "role": role,
            "subject": f"{role}-{namespace}",
            "expired": expired,
        },
    )
    assert response.ok, response.text()
    payload = response.json()
    return SessionLease(payload["id"], payload["storage_state"])


@pytest.fixture
def buyer_session(api: APIRequestContext, namespace: str) -> Iterator[SessionLease]:
    lease = create_session(api, "buyer", namespace)
    yield lease
    assert api.delete(f"/api/test/sessions/{lease.id}").ok


@pytest.fixture
def admin_session(api: APIRequestContext, namespace: str) -> Iterator[SessionLease]:
    lease = create_session(api, "admin", namespace)
    yield lease
    assert api.delete(f"/api/test/sessions/{lease.id}").ok


@pytest.fixture
def expired_admin_session(
    api: APIRequestContext,
    namespace: str,
) -> Iterator[SessionLease]:
    lease = create_session(api, "admin", namespace, expired=True)
    yield lease
    assert api.delete(f"/api/test/sessions/{lease.id}").ok


@pytest.fixture
def buyer_context(
    new_context: CreateContextCallback,
    buyer_session: SessionLease,
    shoplab_url: str,
) -> Iterator[BrowserContext]:
    context = new_context(
        base_url=shoplab_url,
        storage_state=buyer_session.storage_state,
    )
    yield context
    context.close()


@pytest.fixture
def admin_context(
    new_context: CreateContextCallback,
    admin_session: SessionLease,
    shoplab_url: str,
) -> Iterator[BrowserContext]:
    context = new_context(
        base_url=shoplab_url,
        storage_state=admin_session.storage_state,
    )
    yield context
    context.close()
```

`new_context` 是 pytest-playwright 提供的 callback，不是直接调用 `browser.new_context()`。这样多角色 Context 仍会进入插件的 Trace、视频和失败截图生命周期。`storage_state` 只加速登录，不会隔离后端数据，因此仍需要 namespace、独立主体和 session cleanup。

## POM 设计

Page Object 负责 Locator 和用户动作，不负责隐藏所有断言与测试数据。

```python
# tests/pages/shop_page.py
from playwright.sync_api import Page, expect


class ShopPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.cart_status = page.get_by_role("status", name="购物车状态")

    def open(self) -> None:
        self.page.goto("/shop")
        expect(self.page.get_by_role("heading", name="商品")).to_be_visible()

    def add(self, product: dict) -> None:
        card = self.page.get_by_role(
            "article", name=f"商品 {product['name']}"
        )
        expect(card).to_be_visible()
        card.get_by_role("button", name="加入购物车").click()
        expect(self.cart_status).to_contain_text(product["id"])
```

```python
# tests/pages/checkout_page.py
from urllib.parse import urlencode

from playwright.sync_api import Page, expect


class CheckoutPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.summary = page.get_by_role("region", name="订单摘要")
        self.submit_button = page.get_by_role("button", name="提交订单")

    def open_for(self, product_id: str, order_id: str) -> None:
        query = urlencode({"product": product_id, "order": order_id})
        self.page.goto(f"/checkout?{query}")
        expect(self.summary).to_be_visible()

    def submit(self, order_id: str) -> None:
        self.submit_button.click()
        status = self.page.get_by_role("status")
        expect(status).to_have_text(f"订单 {order_id}：submitted")
        expect(status).to_have_attribute("data-order-id", order_id)
```

```python
# tests/pages/admin_orders_page.py
from playwright.sync_api import Page, expect


class AdminOrdersPage:
    def __init__(self, page: Page) -> None:
        self.page = page

    def open(self) -> None:
        self.page.goto("/admin/orders")
        expect(self.page.get_by_role("heading", name="订单管理")).to_be_visible()

    def process(self, order_id: str) -> None:
        row = self.page.get_by_role("row").filter(has_text=order_id)
        expect(row).to_have_count(1)
        row.get_by_role("button", name="标记为已处理").click()
        expect(row).to_contain_text("processed")
```

## 主流程

happy path 先只做一件事：创建商品，买家通过 UI 下单，管理员通过 UI 处理，API 核验最终状态，fixture 最后清理。

```python
# tests/test_order_lifecycle.py
from collections.abc import Iterator
from uuid import uuid4

import pytest
from playwright.sync_api import APIRequestContext, BrowserContext, expect

from pages.admin_orders_page import AdminOrdersPage
from pages.checkout_page import CheckoutPage
from pages.shop_page import ShopPage


@pytest.fixture
def created_order_ids(api: APIRequestContext) -> Iterator[list[str]]:
    ids: list[str] = []
    yield ids
    for order_id in reversed(ids):
        response = api.delete(f"/api/test/orders/{order_id}")
        assert response.ok, response.text()


def test_buyer_and_admin_complete_order(
    api: APIRequestContext,
    buyer_context: BrowserContext,
    admin_context: BrowserContext,
    product: dict,
    namespace: str,
    created_order_ids: list[str],
) -> None:
    buyer_page = buyer_context.new_page()
    shop = ShopPage(buyer_page)
    shop.open()
    shop.add(product)

    order_id = f"order-{namespace}-{uuid4().hex[:8]}"
    # 先登记补偿 ID：即使服务端创建成功后 UI 断言失败，teardown 仍能清理。
    created_order_ids.append(order_id)
    checkout = CheckoutPage(buyer_page)
    checkout.open_for(product["id"], order_id)
    checkout.submit(order_id)

    admin_page = admin_context.new_page()
    admin = AdminOrdersPage(admin_page)
    admin.open()
    admin.process(order_id)

    response = api.get(f"/api/orders/{order_id}")
    assert response.ok, response.text()
    assert response.json()["status"] == "processed"

    buyer_page.goto(f"/orders/{order_id}")
    expect(buyer_page.get_by_text("processed", exact=True)).to_be_visible()
```

订单 ID 在点击前就带上唯一 namespace 并登记到补偿列表。删除接口对“不存在”也返回成功，所以无论请求尚未发出、服务端已创建但 UI 断言失败，还是完整流程通过，teardown 都能安全收敛到“该 ID 不存在”。

先让这个闭环在单浏览器、单 worker 稳定通过，再增加三引擎和并行。否则失败维度太多，很难知道是业务、浏览器还是资源冲突。

## 认证失败

正常路径通过后，才有资格设计可诊断失败。`expired_admin_session` 由受控测试 API 明确创建过期会话，不靠猜测 Cookie 值：

```python
# tests/test_auth_failure.py
from playwright.sync_api import expect
from pytest_playwright.pytest_playwright import CreateContextCallback


def test_expired_admin_state_redirects_to_login(
    new_context: CreateContextCallback,
    expired_admin_session,
    shoplab_url: str,
) -> None:
    context = new_context(
        base_url=shoplab_url,
        storage_state=expired_admin_session.storage_state,
    )
    try:
        page = context.new_page()
        page.goto("/admin/orders")
        expect(page).to_have_url(f"{shoplab_url}/login?reason=expired")
        expect(page.get_by_role("alert")).to_have_text("登录已过期，请重新登录")
    finally:
        context.close()
```

这条用例验证的是系统如何处理过期状态，而不是尝试自动化真实 OAuth 或 2FA。后者通常应由身份提供商测试环境、API 会话或少量专门端到端用例覆盖。

## 网络失败

推荐内容不是商品主流程的核心依赖。通过 route 返回 503，可以验证页面显式降级且加入购物车仍可用：

```python
# tests/test_recommendation_fallback.py
from playwright.sync_api import BrowserContext, Route, expect

from pages.shop_page import ShopPage


def test_shop_survives_recommendation_failure(
    buyer_context: BrowserContext,
    product: dict,
) -> None:
    def fail_recommendations(route: Route) -> None:
        route.fulfill(
            status=503,
            content_type="application/json",
            body='{"error":"recommendation unavailable"}',
        )

    page = buyer_context.new_page()
    page.route("**/api/recommendations", fail_recommendations)
    shop = ShopPage(page)
    shop.open()

    expect(page.get_by_role("status", name="推荐状态")).to_have_text(
        "推荐暂不可用"
    )
    shop.add(product)
```

如果想演练真正的连接失败，可以用 `route.abort("connectionfailed")`；但断言仍应落在用户可见的降级结果，而不是仅断言某个请求报错。

## 失败诊断

开启失败保留策略：

```bash
uv run pytest \
  --browser chromium \
  --tracing retain-on-failure \
  --screenshot only-on-failure \
  -vv
```

对过期认证失败，诊断顺序是：

{% mermaid %}
sequenceDiagram
  participant T as 测试
  participant P as 管理页
  participant A as 会话 API
  T->>P: goto /admin/orders
  P->>A: 校验 session
  A-->>P: 401 expired
  P-->>T: redirect /login?reason=expired
  Note over T,P: Trace 同时查看 action、DOM snapshot、network、console
{% endmermaid %}

先看失败 action 的前后 DOM snapshot，再核对 URL 和网络状态，最后查看控制台。不要只盯最终截图，因为截图看不到之前发生的重定向和响应。

Trace 可能包含订单内容和会话信息。课程要求只用虚构数据，失败产物采用 allowlist、最小权限和短保留期，禁止上传 `storage_state`、HAR 和真实凭据。

## CI 交付

复用第十篇的浏览器矩阵，每个 job 只安装自身引擎，每个 worker 使用独立 namespace：

```bash
uv run pytest tests \
  --browser chromium \
  -n auto \
  --tracing retain-on-failure \
  --screenshot only-on-failure \
  --junitxml test-results/junit-chromium.xml
```

CI 中分别替换为 `firefox` 和 `webkit`。报告至少要记录提交、浏览器、worker 数、受测环境、pytest 结果和失败产物位置。一次偶然通过不代表没有 flaky；可以对关键路径安排有限的重复运行来测量稳定性，但不能用无限重试掩盖失败。

## 验收清单

### 1. 环境可复现

- [ ] `pyproject.toml` 与 `uv.lock` 已提交到练习项目；
- [ ] Python、Playwright、pytest-playwright 版本可追溯；
- [ ] 三种浏览器均可通过 `playwright install --list` 验证。

### 2. 交互与断言稳定

- [ ] 核心路径使用 role、label、text 或 test id Locator；
- [ ] 没有用固定 sleep 代替业务等待；
- [ ] 商品浏览、加入购物车、可见订单号与 `submitted`、管理员处理和最终 `processed` 都有 Web-first 业务断言。

### 3. 状态与数据隔离

- [ ] buyer 与 admin 使用独立 BrowserContext；
- [ ] worker/job 使用唯一 namespace；
- [ ] `storage_state` 只复用认证，不被误认为隔离后端数据。

### 4. API 与网络闭环

- [ ] 商品由 API seed；
- [ ] 订单由 API verify；
- [ ] 数据由创建者 cleanup；
- [ ] 推荐接口失败通过 route 可重复注入。

### 5. 失败可诊断

- [ ] 至少一条认证失败和一条网络失败可稳定复现；
- [ ] Trace 能从 action、DOM、network 和 console 解释根因；
- [ ] 截图、Trace、日志没有真实敏感数据。

### 6. 跨浏览器安全交付

- [ ] Chromium、Firefox、WebKit 使用独立 CI job；
- [ ] worker 并行没有共享数据冲突；
- [ ] JUnit 总是保存，诊断产物只在失败时按 allowlist 上传；
- [ ] 未执行的线上层级标为 `NOT VERIFIED`。

无障碍、视觉回归、GraphQL、WebSocket 和 BDD 属于第十一篇的按需扩展，不作为本项目的主线验收条件。真实项目如果启用其中任一能力，应单独定义覆盖范围、负责人和失败处理。

## 证据记录

把结果落成一张不含糊的表：

| evidence | status | 说明 |
| --- | --- | --- |
| static | `PASS` / `FAIL` | Python、配置、锁文件检查 |
| local-e2e | `PASS` / `FAIL` / `NOT VERIFIED` | 本地 ShopLab 业务流 |
| chromium-ci | `PASS` / `FAIL` / `NOT VERIFIED` | Chromium job |
| firefox-ci | `PASS` / `FAIL` / `NOT VERIFIED` | Firefox job |
| webkit-ci | `PASS` / `FAIL` / `NOT VERIFIED` | WebKit job |
| production | `NOT VERIFIED` | 本课程没有授权线上验证 |

对本文所在博客仓库，真实结论是：课程 Markdown 可以接受静态、构建和页面渲染验证；ShopLab E2E、外部 CI 与线上结果没有执行，仍是 `NOT VERIFIED`。这种诚实的证据边界，本身就是毕业项目的重要能力。

## 常见问题

{% flashcard basic id:playwright-project-evidence deck:"Playwright" tags:"项目实战,证据" %}
--- question
三浏览器测试全部通过，是否能证明线上业务一定正常？
--- answer
不能，只能证明指定提交在指定测试环境和浏览器矩阵中通过。
--- explanation
本地、CI、测试环境和线上是不同证据层。未执行的线上路径必须保持 NOT VERIFIED，不能由 CI 结果推导。
{% endflashcard %}

{% flashcard_ref id="playwright-context-isolation" %}

{% flashcard_ref id="playwright-pom-boundary" %}

{% flashcard_ref id="playwright-trace-purpose" %}

## 参考资料

- [Playwright Python](https://playwright.dev/python/docs/intro)
- [pytest-playwright Reference](https://playwright.dev/python/docs/test-runners)
- [API Testing](https://playwright.dev/python/docs/api-testing)
- [Authentication](https://playwright.dev/python/docs/auth)
- [Trace Viewer](https://playwright.dev/python/docs/trace-viewer)
- [Continuous Integration](https://playwright.dev/python/docs/ci)

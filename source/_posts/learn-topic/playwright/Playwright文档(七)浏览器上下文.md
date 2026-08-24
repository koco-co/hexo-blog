---
title: Playwright文档(七) 浏览器上下文
tags:
  - Playwright
  - BrowserContext
  - 测试隔离
  - 登录状态
categories:
  - Learn Topic
  - Playwright
description: 系统理解 BrowserContext 的所有权和隔离范围，掌握设备、地区、权限模拟、登录状态复用、多角色会话以及浏览器状态与后端数据的边界。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 7
published: true
abbrlink: 8dafa0dc
date: 2026-08-24 12:06:00
---

{% course_series %}

{% note warning no-icon modern %}
BrowserContext 隔离 Cookie、localStorage、权限和页面，却不会复制后端数据库。本文把 ShopLab 定义为文章代码块中的本地训练服务；代码只使用环回地址与虚构账号，不包含真实 OAuth、2FA 或凭据。
{% endnote %}

## 核心模型

一个 Browser 可以创建多个 Context。每个 Context 类似轻量无痕配置文件，可以拥有不同设备、地区、权限与认证状态。

{% mermaid %}
flowchart TD
    B[Browser] --> C1[买家 Context]
    B --> C2[管理员 Context]
    C1 --> P1[商品 Page]
    C1 --> P2[结算 Page]
    C2 --> P3[后台 Page]
    C1 -.隔离.-> C2
{% endmermaid %}

Context 隔离 Cookie、localStorage、sessionStorage、权限和页面。多个 Page 属于同一个 Context 时会共享该 Context 的会话状态；不同 Context 即使运行在同一个 Browser 中也默认互不共享。

## 环境模拟

```python
from pytest_playwright.pytest_playwright import CreateContextCallback


def test_two_regions(new_context: CreateContextCallback, shoplab_url: str) -> None:
    taipei = new_context(
        base_url=shoplab_url,
        locale="zh-TW",
        timezone_id="Asia/Taipei",
        geolocation={"latitude": 25.033, "longitude": 121.5654},
        permissions=["geolocation"],
        color_scheme="light",
    )
    tokyo = new_context(
        base_url=shoplab_url,
        locale="ja-JP",
        timezone_id="Asia/Tokyo",
        color_scheme="dark",
    )
    try:
        taipei_page = taipei.new_page()
        tokyo_page = tokyo.new_page()
        taipei_page.goto("/environment")
        tokyo_page.goto("/environment")
        taipei_probe = taipei_page.evaluate("""async () => {
          const position = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject));
          return {
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dark: matchMedia('(prefers-color-scheme: dark)').matches,
            latitude: position.coords.latitude,
          };
        }""")
        tokyo_probe = tokyo_page.evaluate("""() => ({
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dark: matchMedia('(prefers-color-scheme: dark)').matches,
        })""")
        assert taipei_probe == {
            "language": "zh-TW", "timezone": "Asia/Taipei",
            "dark": False, "latitude": 25.033,
        }
        assert tokyo_probe == {
            "language": "ja-JP", "timezone": "Asia/Tokyo", "dark": True,
        }
    finally:
        taipei.close()
        tokyo.close()
```

| Context 选项 | 适合验证 | 不能证明 |
| --- | --- | --- |
| `locale`、`timezone_id` | 格式、文案、时区边界 | 翻译内容一定正确 |
| `geolocation`、`permissions` | 授权与拒绝分支 | 真实 GPS 精度 |
| `viewport`、device preset | 响应式布局与输入特征 | 真机性能和系统 UI |
| `color_scheme` | 明暗主题 | 所有色彩符合无障碍要求 |

插件的 `browser_context_args` 适合为默认 `page` 统一配置；一个测试需要多个角色时使用 `new_context()`，并自行关闭。

## 状态隔离

ShopLab 在第七、九、十二篇中使用同一份合同。读者可把下面代码块保存为 `shoplab_server.py`；它使用随机环回端口、内存数据和虚构会话，进程结束后全部状态消失。

```python
# shoplab_server.py
from contextlib import contextmanager
from http.cookies import SimpleCookie
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from html import escape
import json
from secrets import token_urlsafe
from threading import Event, Thread
from typing import Iterator
from urllib.parse import parse_qs, urlparse
from uuid import uuid4


class ShopLabServer(ThreadingHTTPServer):
    def __init__(self, address: tuple[str, int]) -> None:
        super().__init__(address, ShopLabHandler)
        self.carts: dict[str, list[str]] = {}
        self.sessions: dict[str, dict] = {}
        self.products: dict[str, dict] = {
            "keyboard": {"id": "keyboard", "name": "测试键盘", "price": 29_900}
        }
        self.orders: dict[str, dict] = {}


class ShopLabHandler(BaseHTTPRequestHandler):
    server: ShopLabServer

    def _send(
        self,
        status: int,
        body: bytes,
        content_type: str,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        for name, value in (headers or {}).items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, payload: object) -> None:
        self._send(
            status,
            json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            "application/json; charset=utf-8",
        )

    def _html(
        self,
        status: int,
        markup: str,
        headers: dict[str, str] | None = None,
    ) -> None:
        self._send(
            status,
            f"<!doctype html><meta charset='utf-8'>{markup}".encode("utf-8"),
            "text/html; charset=utf-8",
            headers,
        )

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def _test_api_allowed(self) -> bool:
        return self.headers.get("X-Test-Token") == "local-test-only"

    def _session(self) -> dict | None:
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        morsel = cookie.get("session")
        return self.server.sessions.get(morsel.value) if morsel else None

    def _page_role(self, role: str) -> dict | None:
        session = self._session()
        if session and not session["expired"] and session["role"] == role:
            return session
        reason = "expired" if session and session["expired"] else "required"
        self.send_response(HTTPStatus.FOUND)
        self.send_header("Location", f"/login?reason={reason}")
        self.end_headers()
        return None

    def do_GET(self) -> None:
        route = urlparse(self.path)
        query = parse_qs(route.query)

        if route.path == "/environment":
            return self._html(HTTPStatus.OK, "<h1>环境探针</h1>")

        if route.path == "/login" and "role" in query:
            role = query["role"][0]
            subject = query.get("subject", [f"{role}-demo"])[0]
            if role not in {"buyer", "admin"}:
                return self._json(HTTPStatus.BAD_REQUEST, {"error": "unknown role"})
            token = token_urlsafe(18)
            self.server.sessions[token] = {
                "id": token,
                "role": role,
                "subject": subject,
                "expired": False,
            }
            return self._html(
                HTTPStatus.OK,
                f"<h1>已登录：{escape(role)}</h1>",
                {"Set-Cookie": f"session={token}; Path=/; HttpOnly; SameSite=Lax"},
            )

        if route.path == "/login":
            reason = query.get("reason", ["required"])[0]
            message = (
                "登录已过期，请重新登录" if reason == "expired" else "请先登录"
            )
            return self._html(
                HTTPStatus.OK,
                f"<h1>登录</h1><p role='alert'>{message}</p>",
            )

        if route.path == "/shop":
            session = self._page_role("buyer")
            if not session:
                return
            products = "".join(
                f"<article aria-label='商品 {escape(product['name'])}'>"
                f"<h2>{escape(product['name'])}</h2>"
                f"<button data-product-id='{escape(product['id'])}'>加入购物车</button>"
                "</article>"
                for product in self.server.products.values()
            )
            return self._html(HTTPStatus.OK, f"""
              <h1>商品</h1>{products}
              <p role='status' aria-label='购物车状态'>购物车为空</p>
              <ul aria-label='推荐商品'></ul>
              <p role='status' aria-label='推荐状态'></p>
              <script>
                document.querySelectorAll('button[data-product-id]').forEach(button => {{
                  button.onclick = async () => {{
                    const response = await fetch('/api/cart', {{
                      method: 'POST', headers: {{'Content-Type': 'application/json'}},
                      body: JSON.stringify({{item: button.dataset.productId}})
                    }});
                    const cart = await response.json();
                    document.querySelector('[aria-label="购物车状态"]').textContent = cart.items.join(',');
                  }};
                }});
                fetch('/api/recommendations').then(async response => {{
                  if (!response.ok) throw new Error('recommendation failed');
                  const data = await response.json();
                  document.querySelector('[aria-label="推荐商品"]').innerHTML =
                    data.items.map(item => `<li>${{item.name}}</li>`).join('');
                }}).catch(() => {{
                  document.querySelector('[aria-label="推荐状态"]').textContent = '推荐暂不可用';
                }});
              </script>
            """)

        if route.path == "/api/cart":
            session = self._session()
            if not session or session["role"] != "buyer":
                return self._json(HTTPStatus.UNAUTHORIZED, {"error": "buyer required"})
            return self._json(
                HTTPStatus.OK,
                {"items": self.server.carts.get(session["subject"], [])},
            )

        if route.path == "/admin":
            if not self._page_role("admin"):
                return
            return self._html(HTTPStatus.OK, "<h1>订单管理</h1>")

        if route.path == "/api/recommendations":
            return self._json(HTTPStatus.OK, {"items": [{"name": "测试键盘"}]})

        if route.path.startswith("/api/orders/"):
            order_id = route.path.rsplit("/", 1)[-1]
            order = self.server.orders.get(order_id)
            return self._json(
                HTTPStatus.OK if order else HTTPStatus.NOT_FOUND,
                order or {"error": "order not found"},
            )

        if route.path.startswith("/orders/"):
            session = self._page_role("buyer")
            if not session:
                return
            order_id = route.path.rsplit("/", 1)[-1]
            order = self.server.orders.get(order_id)
            if not order or order["buyer"] != session["subject"]:
                return self._html(HTTPStatus.NOT_FOUND, "<h1>订单不存在</h1>")
            return self._html(
                HTTPStatus.OK,
                f"""<h1>订单 {escape(order_id)}</h1>
                <button>提交订单</button><p role='status'>{escape(order['status'])}</p>
                <script>
                  const status = document.querySelector('[role=status]');
                  fetch('/api/orders/{escape(order_id)}').then(r => r.json()).then(order => {{
                    status.textContent = order.status;
                  }});
                  document.querySelector('button').onclick = async () => {{
                    const response = await fetch('/api/orders/{escape(order_id)}/submit', {{
                      method: 'POST', headers: {{'Content-Type': 'application/json'}},
                      body: JSON.stringify({{source: 'checkout'}})
                    }});
                    status.textContent = (await response.json()).status;
                  }};
                </script>""",
            )

        if route.path == "/checkout":
            session = self._page_role("buyer")
            if not session:
                return
            product_id = query.get("product", [""])[0]
            order_id = query.get("order", [f"order-{uuid4().hex}"])[0]
            product = self.server.products.get(product_id)
            if not product:
                return self._html(HTTPStatus.NOT_FOUND, "<h1>商品不存在</h1>")
            return self._html(HTTPStatus.OK, f"""
              <section aria-label='订单摘要'>
                <h2>订单摘要</h2><p>{escape(product['name'])}</p>
                <button>提交订单</button><p role='status'>待提交</p>
              </section>
              <script>
                document.querySelector('button').onclick = async () => {{
                  const response = await fetch('/api/orders', {{
                    method: 'POST', headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{
                      id: {json.dumps(order_id)},
                      product_id: {json.dumps(product_id)}
                    }})
                  }});
                  const order = await response.json();
                  const status = document.querySelector('[role=status]');
                  status.textContent = `订单 ${{order.id}}：${{order.status}}`;
                  status.dataset.orderId = order.id;
                }};
              </script>
            """)

        if route.path == "/admin/orders":
            if not self._page_role("admin"):
                return
            rows = "".join(
                f"<tr><td>{escape(order['id'])}</td><td class='state'>{escape(order['status'])}</td>"
                f"<td><button data-id='{escape(order['id'])}'>标记为已处理</button></td></tr>"
                for order in self.server.orders.values()
            )
            return self._html(HTTPStatus.OK, f"""
              <h1>订单管理</h1><table><tbody>{rows}</tbody></table>
              <script>
                document.querySelectorAll('button').forEach(button => {{
                  button.onclick = async () => {{
                    const response = await fetch('/api/orders/' + button.dataset.id, {{
                      method: 'PATCH', headers: {{'Content-Type': 'application/json'}},
                      body: JSON.stringify({{status: 'processed'}})
                    }});
                    const order = await response.json();
                    button.closest('tr').querySelector('.state').textContent = order.status;
                  }};
                }});
              </script>
            """)

        self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def do_POST(self) -> None:
        route = urlparse(self.path)
        payload = self._body()

        if route.path == "/api/test/sessions" and self._test_api_allowed():
            role = payload["role"]
            subject = payload["subject"]
            token = token_urlsafe(18)
            self.server.sessions[token] = {
                "id": token,
                "role": role,
                "subject": subject,
                "expired": bool(payload.get("expired", False)),
            }
            state = {"cookies": [{
                "name": "session", "value": token, "domain": "127.0.0.1",
                "path": "/", "expires": -1, "httpOnly": True,
                "secure": False, "sameSite": "Lax",
            }], "origins": []}
            return self._json(HTTPStatus.CREATED, {"id": token, "storage_state": state})

        if route.path == "/api/test/products" and self._test_api_allowed():
            product_id = payload.get("id", f"product-{uuid4().hex}")
            product = {"id": product_id, "name": payload["name"], "price": payload["price"]}
            self.server.products[product_id] = product
            return self._json(HTTPStatus.CREATED, product)

        if route.path == "/api/cart":
            session = self._session()
            if not session or session["role"] != "buyer":
                return self._json(HTTPStatus.UNAUTHORIZED, {"error": "buyer required"})
            items = self.server.carts.setdefault(session["subject"], [])
            items.append(payload.get("item", "keyboard"))
            return self._json(HTTPStatus.CREATED, {"items": items})

        if route.path == "/api/orders":
            session = self._session()
            if self._test_api_allowed():
                buyer = payload["buyer"]
                order_id = payload.get("id", f"order-{uuid4().hex}")
                status = payload.get("status", "draft")
            elif session and session["role"] == "buyer":
                buyer = session["subject"]
                order_id = payload.get("id", f"order-{uuid4().hex}")
                status = "submitted"
            else:
                return self._json(HTTPStatus.UNAUTHORIZED, {"error": "buyer required"})
            order = {
                "id": order_id, "buyer": buyer, "status": status,
                "product_id": payload.get("product_id"),
            }
            self.server.orders[order_id] = order
            return self._json(HTTPStatus.CREATED, order)

        if route.path.startswith("/api/orders/") and route.path.endswith("/submit"):
            session = self._session()
            order_id = route.path.removeprefix("/api/orders/").removesuffix("/submit")
            order = self.server.orders.get(order_id)
            if not session or not order or order["buyer"] != session["subject"]:
                return self._json(HTTPStatus.UNAUTHORIZED, {"error": "buyer required"})
            order["status"] = "submitted"
            order["source"] = payload.get("source")
            return self._json(HTTPStatus.OK, order)

        self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def do_PATCH(self) -> None:
        route = urlparse(self.path)
        session = self._session()
        if route.path.startswith("/api/orders/") and (
            self._test_api_allowed() or (session and session["role"] == "admin")
        ):
            order_id = route.path.rsplit("/", 1)[-1]
            order = self.server.orders.get(order_id)
            if not order:
                return self._json(HTTPStatus.NOT_FOUND, {"error": "order not found"})
            order["status"] = self._body().get("status", "processed")
            return self._json(HTTPStatus.OK, order)
        self._json(HTTPStatus.UNAUTHORIZED, {"error": "admin required"})

    def do_DELETE(self) -> None:
        route = urlparse(self.path)
        if route.path == "/api/cart":
            session = self._session()
            if not session or session["role"] != "buyer":
                return self._json(HTTPStatus.UNAUTHORIZED, {"error": "buyer required"})
            self.server.carts.pop(session["subject"], None)
            return self._json(HTTPStatus.OK, {"deleted": True})

        if self._test_api_allowed():
            session_prefix = "/api/test/sessions/"
            if route.path.startswith(session_prefix):
                session = self.server.sessions.pop(
                    route.path.removeprefix(session_prefix), None
                )
                if session:
                    self.server.carts.pop(session["subject"], None)
                return self._json(HTTPStatus.OK, {"deleted": True})
            collections = {
                "/api/test/products/": self.server.products,
                "/api/test/orders/": self.server.orders,
            }
            for prefix, collection in collections.items():
                if route.path.startswith(prefix):
                    collection.pop(route.path.removeprefix(prefix), None)
                    return self._json(HTTPStatus.OK, {"deleted": True})
        self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})

    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def running_shoplab() -> Iterator[str]:
    server = ShopLabServer(("127.0.0.1", 0))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    try:
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


if __name__ == "__main__":
    with running_shoplab() as url:
        print(f"ShopLab URL: {url}", flush=True)
        Event().wait()
```

pytest fixture 只负责把服务生命周期接入套件：

```python
# conftest.py
from collections.abc import Iterator

import pytest

from shoplab_server import running_shoplab


@pytest.fixture(scope="session")
def shoplab_url() -> Iterator[str]:
    with running_shoplab() as url:
        yield url
```

两个 Context 可以有不同 Cookie 和 localStorage，但如果登录为同一个后端主体，它们仍共享购物车：

```python
from uuid import uuid4

from playwright.sync_api import expect
from pytest_playwright.pytest_playwright import CreateContextCallback


def test_context_boundary(
    new_context: CreateContextCallback,
    shoplab_url: str,
) -> None:
    subject = f"buyer-{uuid4().hex}"
    first = new_context(base_url=shoplab_url)
    second = new_context(base_url=shoplab_url)
    try:
        first_page = first.new_page()
        second_page = second.new_page()
        first_page.goto(f"/login?role=buyer&subject={subject}")
        second_page.goto(f"/login?role=buyer&subject={subject}")

        first_page.evaluate("localStorage.setItem('theme', 'dark')")
        assert second_page.evaluate("localStorage.getItem('theme')") is None

        first_page.goto("/shop")
        first_page.get_by_role("button", name="加入购物车").click()
        expect(first_page.get_by_role("status", name="购物车状态")).to_have_text(
            "keyboard"
        )

        visible_from_second = second.request.get("/api/cart").json()
        assert visible_from_second["items"] == ["keyboard"]
    finally:
        second.request.delete("/api/cart")
        first.close()
        second.close()
```

因此并行测试不仅要新建 Context，还要为后端资源生成唯一 namespace，例如 `buyer-{worker_id}-{uuid4().hex}`，并在结束时清理。本例用随机 subject，最后通过已认证 API 清空购物车；服务 fixture 结束时还会销毁整个内存 store。

## 登录状态

认证准备的目标是得到可复用状态，不是把登录步骤复制到每个测试。ShopLab 用带角色和虚构 subject 的训练登录端点生成 Cookie；这里先返回内存中的 `storage_state`，需要跨进程时再保存到受保护文件：

```python
from uuid import uuid4

from playwright.sync_api import expect
from pytest_playwright.pytest_playwright import CreateContextCallback


def create_state(
    new_context: CreateContextCallback,
    shoplab_url: str,
    role: str,
    subject: str,
) -> dict:
    context = new_context(base_url=shoplab_url)
    try:
        page = context.new_page()
        page.goto(f"/login?role={role}&subject={subject}")
        expect(page.get_by_role("heading", name=f"已登录：{role}")).to_be_visible()
        return context.storage_state()
    finally:
        context.close()


def test_buyer_and_admin(
    new_context: CreateContextCallback,
    shoplab_url: str,
) -> None:
    namespace = uuid4().hex
    buyer_state = create_state(
        new_context, shoplab_url, "buyer", f"buyer-{namespace}"
    )
    admin_state = create_state(
        new_context, shoplab_url, "admin", f"admin-{namespace}"
    )
    buyer = new_context(base_url=shoplab_url, storage_state=buyer_state)
    admin = new_context(base_url=shoplab_url, storage_state=admin_state)
    try:
        buyer_page = buyer.new_page()
        buyer_page.goto("/shop")
        admin_page = admin.new_page()
        admin_page.goto("/admin")
        expect(buyer_page.get_by_role("heading", name="商品")).to_be_visible()
        expect(admin_page.get_by_role("heading", name="订单管理")).to_be_visible()
    finally:
        buyer.close()
        admin.close()
```

### 多角色会话

若调用 `context.storage_state(path=...)` 落盘，文件必须加入 `.gitignore`。过期检测不能只看文件存在，应访问一个需要认证的页面或 API，确认没有被重定向到登录页。失败时重新生成，不要无限重试。ShopLab session 随本地服务销毁；真实系统还应提供显式 session revoke 或短 TTL。

## 认证边界

生产 OAuth、短信和硬件密钥不适合在每个 E2E 测试里硬闯。合理策略是：

1. 使用测试环境专用身份提供方或后端测试登录端点。
2. 由服务端签发短期、最小权限会话，再写入 Context。
3. 保留少量独立测试覆盖真实登录集成；业务套件复用已验证状态。
4. 禁止把真实密码、OTP seed、Cookie 或 `storage_state` 上传到报告。

### 多角色检查

为买家、管理员和访客分别写出 Context 配置、认证状态取得方式、后端 namespace 与清理动作。指出哪一项由 BrowserContext 自动保证，哪几项必须由测试架构保证。

{% hideToggle 参考答案, #f0f4ff, #1f2d3d %}
三者各用独立 Context；buyer/admin 状态由受控测试登录或测试 API 生成，访客不加载状态。后端主体使用 run/worker namespace，订单、购物车和 session 由创建者清理。BrowserContext 只自动隔离浏览器端 Cookie、storage、权限和页面；后端 namespace、账号所有权与 cleanup 都由测试架构保证。
{% endhideToggle %}

## API 速查

下面的索引用于查漏和选型；主线能力仍以本篇前文的机制、示例和失败边界为准。方法名和公开签名参数按 Playwright Python 1.62.0 的同步 API 归类，异步 API 的对应关系在第二篇统一说明；参数行是完整索引，不等于逐项教程。

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 核心详解 | 正文简述 | 进阶内容 | 弃用迁移 |
| --- | --- | --- | --- | --- |
| `Browser` | `new_context()` | `browser_type`、`close()`、`contexts`、`is_connected()`、`version` | `bind()`、`unbind()` | `new_page()` |
| `BrowserContext` | `new_page()`、`storage_state()` | — | `add_cookies()`、`add_init_script()`、`background_pages`、`browser`、`clear_cookies()`、`clear_permissions()`、`close()`、`cookies()`、`credentials`、`expect_page()`、`expose_binding()`、`expose_function()`、`grant_permissions()`、`is_closed()`、`pages`、`set_default_navigation_timeout()`、`set_default_timeout()`、`set_extra_http_headers()`、`set_geolocation()`、`set_offline()`、`set_storage_state()` | — |
| `Page` | — | — | `context`、`emulate_media()`、`set_extra_http_headers()`、`viewport_size` | — |
| `Playwright` | — | — | `devices` | — |
| `WebStorage` | — | — | `clear()`、`get_item()`、`items()`、`remove_item()`、`set_item()` | — |
| `Browser.bind` 参数 | — | — | `host`, `port`, `title`, `workspace_dir` | — |
| `Browser.close` 参数 | — | — | `reason` | — |
| `Browser.new_context` 参数 | — | — | `accept_downloads`, `base_url`, `bypass_csp`, `client_certificates`, `color_scheme`, `contrast`, `default_browser_type`, `device_scale_factor`, `extra_http_headers`, `forced_colors`, `geolocation`, `has_touch`, `http_credentials`, `ignore_https_errors`, `is_mobile`, `java_script_enabled`, `locale`, `no_viewport`, `offline`, `permissions`, `proxy`, `record_har_content`, `record_har_mode`, `record_har_omit_content`, `record_har_path`, `record_har_url_filter`, `record_video_dir`, `record_video_size`, `reduced_motion`, `screen`, `service_workers`, `storage_state`, `strict_selectors`, `timezone_id`, `user_agent`, `viewport` | — |
| `Browser.new_page` 参数 | — | — | — | `accept_downloads`, `base_url`, `bypass_csp`, `client_certificates`, `color_scheme`, `contrast`, `default_browser_type`, `device_scale_factor`, `extra_http_headers`, `forced_colors`, `geolocation`, `has_touch`, `http_credentials`, `ignore_https_errors`, `is_mobile`, `java_script_enabled`, `locale`, `no_viewport`, `offline`, `permissions`, `proxy`, `record_har_content`, `record_har_mode`, `record_har_omit_content`, `record_har_path`, `record_har_url_filter`, `record_video_dir`, `record_video_size`, `reduced_motion`, `screen`, `service_workers`, `storage_state`, `strict_selectors`, `timezone_id`, `user_agent`, `viewport` |
| `BrowserContext.add_cookies` 参数 | — | — | `cookies` | — |
| `BrowserContext.add_init_script` 参数 | — | — | `path`, `script` | — |
| `BrowserContext.clear_cookies` 参数 | — | — | `domain`, `name`, `path` | — |
| `BrowserContext.close` 参数 | — | — | `reason` | — |
| `BrowserContext.cookies` 参数 | — | — | `urls` | — |
| `BrowserContext.expect_page` 参数 | — | — | `predicate`, `timeout` | — |
| `BrowserContext.expose_binding` 参数 | — | — | `callback`, `name` | — |
| `BrowserContext.expose_function` 参数 | — | — | `callback`, `name` | — |
| `BrowserContext.grant_permissions` 参数 | — | — | `origin`, `permissions` | — |
| `BrowserContext.set_default_navigation_timeout` 参数 | — | — | `timeout` | — |
| `BrowserContext.set_default_timeout` 参数 | — | — | `timeout` | — |
| `BrowserContext.set_extra_http_headers` 参数 | — | — | `headers` | — |
| `BrowserContext.set_geolocation` 参数 | — | — | `geolocation` | — |
| `BrowserContext.set_offline` 参数 | — | — | `offline` | — |
| `BrowserContext.set_storage_state` 参数 | — | — | `storage_state` | — |
| `BrowserContext.storage_state` 参数 | — | — | `credentials`, `indexed_db`, `path` | — |
| `Page.emulate_media` 参数 | — | — | `color_scheme`, `contrast`, `forced_colors`, `media`, `reduced_motion` | — |
| `Page.set_extra_http_headers` 参数 | — | — | `headers` | — |
| `WebStorage.get_item` 参数 | — | — | `name` | — |
| `WebStorage.remove_item` 参数 | — | — | `name` | — |
| `WebStorage.set_item` 参数 | — | — | `name`, `value` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-context-isolation deck:"Playwright" priority:2 tags:"BrowserContext,测试隔离" %}
--- question
BrowserContext 隔离是否等于测试数据隔离？
--- answer
不等于，它只负责浏览器端会话隔离。
--- explanation
数据库记录、缓存、消息队列和第三方沙箱仍可能共享。测试必须使用唯一数据标识，并由创建数据的 Fixture 负责清理。
{% endflashcard %}

{% flashcard choice id:playwright-storage-state deck:"Playwright" priority:2 tags:"BrowserContext,登录状态" answer:B %}
--- question
业务回归套件需要复用登录时，哪种方式更合适？
- [A] 所有测试共享同一个 Page
- [B] 为角色生成受控 storage_state，并创建独立 Context
- [C] 把真实账号 Cookie 提交到仓库
--- answer
B
--- explanation
storage_state 可以复用已验证会话，同时保持每个测试独立创建 Context；状态文件必须按凭据管理并验证有效期。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Browser Contexts, https://playwright.dev/python/docs/browser-contexts, https://playwright.dev/img/playwright-logo.svg %}
{% link Emulation, https://playwright.dev/python/docs/emulation, https://playwright.dev/img/playwright-logo.svg %}
{% link Authentication, https://playwright.dev/python/docs/auth, https://playwright.dev/img/playwright-logo.svg %}
{% link pytest-playwright Reference, https://playwright.dev/python/docs/test-runners, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

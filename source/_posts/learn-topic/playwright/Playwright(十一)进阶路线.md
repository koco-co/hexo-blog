---
title: Playwright(十一)进阶路线
tags:
  - Playwright
  - WebSocket
  - GraphQL
  - Accessibility
  - 视觉回归
categories:
  - Learn Topic
  - Playwright
description: 按需学习 Shadow DOM、时间控制、GraphQL、WebSocket、BDD、无障碍与视觉回归，将低频或专项能力集中在主线之外并明确各自适用边界。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 11
published: true
abbrlink: 4504d456
date: 2026-08-24 12:02:00
---

{% course_series %}

{% note info flat %}
本篇集中介绍常规 Web 自动化主线之外的能力。它们并非“不重要”，而是只在特定架构或质量目标下使用：WebSocket 和 GraphQL 取决于协议，无障碍与视觉回归属于专项质量门，BDD 取决于团队协作方式。
{% endnote %}

{% note info flat %}
Python 示例全部保留在代码块中；第三方依赖需要由项目单独评估和锁定，不会混入主线环境。
{% endnote %}

## 特殊 DOM

Playwright Locator 默认可以进入开放的 Shadow DOM，因此仍然优先使用角色和标签：

```python
page.set_content("""
  <product-card></product-card>
  <script>
    const host = document.querySelector('product-card');
    const root = host.attachShadow({mode: 'open'});
    root.innerHTML = '<button>加入购物车</button>';
  </script>
""")

page.get_by_role("button", name="加入购物车").click()
```

{% note info flat %}
XPath 不会穿透 Shadow DOM。Closed Shadow Root 也不能被普通 Locator 访问，这是组件实现刻意设置的边界。遇到 closed shadow 时优先验证组件提供的公开用户行为，或与开发团队建立测试接口，不要通过注入脚本强行打开生产组件内部。
{% endnote %}

{% note info flat %}
Canvas 没有可定位的子 DOM。测试应优先验证画布旁的可访问替代、业务状态或后端结果；只有交互本身依赖坐标时，才固定 viewport 后使用 `page.mouse`。
{% endnote %}

## 运行时控制

{% note info flat %}
`ElementHandle` 仍可在兼容代码中出现，但它代表某一时刻的节点引用，不会像 Locator 一样在重渲染后重新查询。新代码按能力组迁移：
{% endnote %}

| 旧接口组 | 当前写法 | 迁移边界 |
| --- | --- | --- |
| `ElementHandle.click()`、`fill()`、`press()`、`check()`、`uncheck()`、`select_option()`、`set_input_files()`、`hover()`、`tap()` | 保存 `Locator`，调用同名 Locator 方法 | 保留 Actionability、自动等待和严格模式；不要先 `element_handle()` 再长期缓存 |
| `ElementHandle.dblclick()`、`ElementHandle.dispatch_event()`、`ElementHandle.focus()`、`ElementHandle.select_text()` | 保存 `Locator`，调用对应 Locator 方法 | 这些操作仍应以可重新查询的元素为目标；`dispatch_event()` 只用于确有事件合同的场景，不要用它伪造用户流程 |
| `ElementHandle.type()` | `locator.press_sequentially()`；普通表单优先 `locator.fill()` | `type()` 属于旧式逐字输入接口；需要保留键盘事件节奏时才使用 `press_sequentially()`，不要把它当成更可靠的 `fill()` |
| `ElementHandle.is_checked()`、`ElementHandle.is_disabled()`、`ElementHandle.is_editable()`、`ElementHandle.is_enabled()`、`ElementHandle.is_hidden()`、`ElementHandle.is_visible()` | `locator.is_checked()` 等状态读取，或 `expect(locator)` 的对应 Web-first 断言 | 即时 `is_*` 只回答当前采样；验收结果优先用会等待的断言 |
| `ElementHandle.inner_html()`、`ElementHandle.inner_text()`、`ElementHandle.text_content()`、`ElementHandle.input_value()`、`ElementHandle.get_attribute()` | `locator.inner_html()` 等读取，或对应 `expect(...).to_have_*()` | 页面结果优先使用 Web-first 断言，避免一次性快照 |
| `ElementHandle.query_selector()`、`query_selector_all()` | `locator.locator()`、`locator.filter()`、`locator.all()` | `all()` 只读取当前匹配集合；需要等待数量先使用 `expect(locator).to_have_count()` |
| `ElementHandle.wait_for_selector()`、`wait_for_element_state()` | `locator.wait_for()` 或 `expect(locator)...` | 等待业务结果时优先断言，不把固定超时当同步机制 |
| `ElementHandle.evaluate()`、`evaluate_handle()`、`eval_on_selector()`、`eval_on_selector_all()` | `locator.evaluate()` / `evaluate_all()`；后两者先用 `locator.locator(selector)` 定位后再执行 | 只用于没有等价 Locator API 的诊断，不能用脚本点击绕过用户行为检查；`eval_on_selector*()` 不是等待或断言替代品 |
| `ElementHandle.get_property()`、`ElementHandle.get_properties()`、`ElementHandle.json_value()` | 没有一一对应的 Locator 读法；必要时在稳定 Locator 上使用 `evaluate()` / `evaluate_all()` | 这些方法读取 JSHandle 或序列化值，保留在低层诊断边界；业务结果应改用可访问文本、属性或 API 断言 |
| `ElementHandle.screenshot()`、`ElementHandle.bounding_box()`、`ElementHandle.scroll_into_view_if_needed()` | `locator.screenshot()`、`locator.bounding_box()`、`locator.scroll_into_view_if_needed()` | 截图和几何检查仍应在稳定 Locator 上进行 |
| `ElementHandle.content_frame()` | `locator.content_frame` 或 `locator.frame_locator()` | 这是进入 iframe 内容的方向；进入前先保留可重新查询的 Locator |
| `ElementHandle.owner_frame()` | 没有等价的 Locator 入口；保留句柄时读取其所属父 Frame，常规交互改用已知 `Frame` 或 `frame_locator()` | `owner_frame()` 是“元素属于哪个父 Frame”，不是进入 iframe；不要把它与 `content_frame()` 混为一谈 |
| `ElementHandle.as_element()`、`ElementHandle.dispose()` | 无直接 Locator 替代；删除长期句柄，或仅在 JSHandle/底层诊断链中保留 | `as_element()`/`dispose()` 管理句柄生命周期，不提供 Web-first 等价物；不能伪造成普通元素操作 |

{% note info flat %}
同步与异步迁移方向相同；异步版本只在真正执行 I/O 的调用处加 `await`。`Browser.start_tracing()` / `stop_tracing()` 是旧的 Chromium 级入口，新的跨浏览器取证应使用 `context.tracing.start()`、`start_chunk()` 与 `stop()`，并由统一的 Trace Viewer 流程查看。
{% endnote %}

### 时间控制

{% note warning flat %}
倒计时、会话过期和定时刷新不应真实等待数分钟。Clock API 可以控制 Page 所属 Context 中的时间和计时器：
{% endnote %}

```python
import datetime

from playwright.sync_api import Page, expect


def test_session_timeout(page: Page) -> None:
    page.clock.install(time=datetime.datetime(2026, 8, 24, 9, 0, 0))
    page.set_content("""
      <button>继续操作</button>
      <p role="status">已登录</p>
      <script>
        let timer;
        const reset = () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            document.querySelector('[role=status]').textContent = '会话已过期';
          }, 5 * 60 * 1000);
        };
        document.querySelector('button').onclick = reset;
        reset();
      </script>
    """)

    page.get_by_role("button", name="继续操作").click()
    page.clock.fast_forward("05:00")
    expect(page.get_by_role("status")).to_have_text("会话已过期")
```

{% note info flat %}
`run_for()` 会执行时间段内的计时回调；`fast_forward()` 更接近设备休眠后恢复，只让到期计时器立即触发。Clock 影响整个 BrowserContext 中的 Page 和 iframe，多个时间场景应使用独立 Context。
{% endnote %}

{% note info flat %}
只需要固定 `Date.now()` 时优先 `set_fixed_time()`；需要推进 timer 时再 `install()`。修改系统时间不能替代服务端时间、数据库 TTL 或第三方 Token 过期验证。
{% endnote %}

## 协议扩展

{% note info flat %}
GraphQL 通常共享一个 URL，不能只按路径区分接口。路由处理器需要读取 `operationName`：
{% endnote %}

{% note info flat %}
下面是迁移到真实项目时的路由骨架，`shop.example` 和页面发出的 Query 需要替换为受测系统的环回或测试环境实现；代码重点是按操作名分流，不能单独复制后直接运行。
{% endnote %}

```python
import json

from playwright.sync_api import Page, expect


def test_graphql_recommendations(page: Page) -> None:
    def graphql(route) -> None:
        payload = route.request.post_data_json
        if payload.get("operationName") == "RecommendationsQuery":
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "data": {
                        "recommendations": [
                            {"id": "keyboard", "name": "机械键盘"}
                        ]
                    }
                }),
            )
            return
        route.continue_()

    page.route("**/graphql", graphql)
    page.goto("https://shop.example/recommendations")
    expect(page.get_by_role("list", name="推荐商品")).to_contain_text("机械键盘")
```

{% note info flat %}
GraphQL 响应即使 HTTP 状态是 200，也可能包含顶层 `errors`。协议测试要同时检查 HTTP 状态、`data`、`errors` 和页面降级结果。生产系统如果使用持久化查询，测试还需要根据 hash 或变量建立稳定匹配规则。
{% endnote %}

{% note info flat %}
Mock 只控制依赖，不证明真实 Schema 兼容。保留 API 集成测试或契约校验，避免前端 Mock 与服务端一起漂移。
{% endnote %}

### WebSocket

{% note info flat %}
只观察连接和帧时，监听 Page 的 `websocket` 事件；如果要控制握手或消息，应回到路由拦截与断言边界。
{% endnote %}

```python
def observe_socket(page) -> list[tuple[str, str | bytes]]:
    frames = []

    def on_socket(socket) -> None:
        frames.append(("open", socket.url))
        socket.on("framesent", lambda payload: frames.append(("sent", payload)))
        socket.on("framereceived", lambda payload: frames.append(("received", payload)))
        socket.on("close", lambda: frames.append(("close", socket.url)))

    page.on("websocket", on_socket)
    return frames
```

{% note info flat %}
需要完全模拟服务端时，在导航前注册 `route_web_socket()`：
{% endnote %}

{% note info flat %}
下面同样是接入骨架：受测页面必须实际创建匹配 URL 的 WebSocket，并将状态渲染到 `role="status"`，示例才会形成完整测试。
{% endnote %}

```python
import json
from typing import Union

from playwright.sync_api import WebSocketRoute


def handle_message(ws: WebSocketRoute, message: Union[str, bytes]) -> None:
    payload = json.loads(message)
    if payload["type"] == "subscribe-order":
        ws.send(json.dumps({
            "type": "order-status",
            "orderId": payload["orderId"],
            "status": "shipped",
        }))


page.route_web_socket(
    "wss://shop.example/ws",
    lambda ws: ws.on_message(lambda message: handle_message(ws, message)),
)
page.goto("https://shop.example/orders/A-100")
expect(page.get_by_role("status")).to_have_text("已发货")
```

{% note danger flat %}
不调用 `connect_to_server()` 时，连接由测试完全模拟；调用后可以在页面和真实服务器之间转发、修改或阻断帧。帧日志可能包含聊天内容、Token 或个人信息，CI 中不要直接打印全部 payload。
{% endnote %}

### BDD 集成

{% note info flat %}
BDD 适合产品、开发和测试共同维护稳定业务语言的团队。它不适合把每一行点击机械翻译成 Given、When、Then。
{% endnote %}

```bash
uv add --dev pytest-bdd
```

{% note info flat %}
Feature 只描述业务合同，具体浏览器操作仍由 Step、Fixture 和 Page Object 承担：
{% endnote %}

```gherkin
Feature: 提交订单
  Scenario: 填写收件人并提交
    Given 结算页已打开
    When 收件人 "Alice" 提交订单
    Then 订单状态为 "订单已创建"
```

{% note info flat %}
Step 复用 pytest Fixture 和 Page Object：
{% endnote %}

```python
from playwright.sync_api import expect
from pytest_bdd import given, parsers, scenarios, then, when

scenarios("features/checkout.feature")


@given("结算页已打开", target_fixture="checkout")
def open_checkout(checkout_page):
    checkout_page.open()
    return checkout_page


@when(parsers.parse('收件人 "{receiver}" 提交订单'))
def submit_order(checkout, receiver: str) -> None:
    checkout.submit_order(receiver)


@then(parsers.parse('订单状态为 "{expected}"'))
def assert_status(checkout, expected: str) -> None:
    expect(checkout.status).to_have_text(expected)
```

{% note warning flat %}
Step 不应自行启动浏览器，也不要隐藏复杂通用流程。Gherkin 用于共享业务例子；定位、等待和页面操作仍由测试代码维护。
{% endnote %}

## 质量边界

{% note info flat %}
以下能力已经列入本文 API 索引，但只有在明确的工程入口出现时才进入。先判断进入条件，再决定是否引入额外依赖、浏览器限制或更低层的对象：
{% endnote %}

| 能力组 | 进入条件 | 主要限制 |
| --- | --- | --- |
| CDP 与调试协议 | 需要 Chromium 专属协议、连接已启动的 Chromium 或收集协议级诊断时，使用 `Browser.new_browser_cdp_session()`、`BrowserType.connect_over_cdp()`、`BrowserContext.new_cdp_session()` | CDP 不是跨浏览器 API；协议版本和远程调试端点必须由环境固定，不能把 CDP 用法写成 Firefox/WebKit 通用方案 |
| 凭据与 WebAuthn | 需要验证 Passkey、虚拟认证器或 WebAuthn 注册/断言时使用 `Credentials` | 只放入测试凭据和测试 RP；私钥、用户句柄等敏感值必须使用安全注入，不得写入日志或提交产物 |
| 调试器与录制 | 需要暂停、单步或生成比 Trace Viewer 更低层的录制时使用 `Debugger`、`Screencast` | 会改变运行时节奏并产生高敏感度视频/帧数据；普通失败优先使用 trace、截图和日志 |
| Context 调试与 Service Worker | 需要观察 Context 级生命周期、Service Worker 注册或专门验证离线/PWA 行为时使用 `BrowserContext.debugger`、`new_cdp_session()`、`service_workers` | Service Worker 生命周期由浏览器控制；路由拦截不等于拦截已经由 Service Worker 接管的请求，Chromium 限制和清理时机必须单独验证 |
| JSHandle 与 Worker | 页面 `evaluate()` 返回对象句柄，或应用确实创建 Web Worker 并需要读取其状态时使用 `JSHandle`、`Worker` | 句柄不是 Locator，没有自动等待和严格模式；Worker 可能先于断言结束，必须显式等待并释放低层对象 |
| WebSocket 事件与代理 | 需要验证连接状态、等待帧事件，或在客户端与真实服务器之间转发消息时使用 `WebSocket`、`WebSocketRoute` | 这是协议层测试，不替代页面可观察结果；为每个连接清理监听器，敏感帧只保留脱敏摘要 |
| 浏览器扩展与 Mock APIs | 需要加载 Chromium 扩展，或在页面初始化前替换时间、随机数等浏览器 API 时使用持久化 Context、`add_init_script()` | 扩展加载依赖 Chromium 和持久化上下文；`add_init_script()` 只能控制页面初始化脚本，不能伪造真实浏览器权限、网络栈或后端行为 |

{% note warning flat %}
这三类场景不要混写：Chrome 扩展测试关注扩展目录、持久化 Context 和扩展页面；Mock APIs 只替换页面可注入的 API，适合固定时间、随机数或权限提示等前端依赖；Service Worker 测试关注注册、激活、缓存和离线生命周期，网络路由未必能覆盖已经被 Worker 接管的请求。它们都应先建立最小专项用例，再决定是否纳入跨浏览器矩阵。
{% endnote %}

### 质量范围

{% note info flat %}
功能断言回答“订单金额算对了吗”，却不一定能发现按钮失去可访问名称、焦点顺序混乱或组件在某个平台错位。下面围绕 `CheckoutSummary` 组件建立专项质量门。
{% endnote %}

{% note info flat %}
工具多不等于结论清楚。先为每个信号定义是否必需，以及四种状态的含义：
{% endnote %}

| status | 含义 | required 信号如何处理 |
| --- | --- | --- |
| `PASS` | 已执行且满足合同 | 放行 |
| `FAIL` | 已执行但不满足合同 | 阻断 |
| `SKIPPED` | 本应执行，却因环境或流程跳过 | 阻断 |
| `NOT_APPLICABLE` | 经风险评估后明确不适用 | 不阻断 |

{% note info flat %}
统一规则可以保持得很简单：任一 required 信号不是 `PASS` 或 `NOT_APPLICABLE`，本次质量门就失败。optional 信号失败要记录和评估，但不自动冒充硬门槛。
{% endnote %}

```python
from dataclasses import dataclass
from enum import StrEnum


class Status(StrEnum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIPPED = "SKIPPED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


@dataclass(frozen=True)
class Signal:
    name: str
    required: bool
    status: Status
    evidence: str


def gate_passed(signals: list[Signal]) -> bool:
    acceptable = {Status.PASS, Status.NOT_APPLICABLE}
    return all(not signal.required or signal.status in acceptable for signal in signals)
```

{% note info flat %}
这里最重要的不是数据类，而是语义：`SKIPPED` 不是绿色，`NOT_APPLICABLE` 也不能用来掩盖“没来得及测”。
{% endnote %}

### ARIA 快照

{% note info flat %}
ARIA snapshot 把可访问性树表示为 YAML。它关注角色、可访问名称、状态和层级，不关心组件是蓝色还是绿色。
{% endnote %}

```python
from playwright.sync_api import Page, expect


def test_checkout_summary_aria_contract(page: Page) -> None:
    page.set_content("""
      <main>
        <section aria-labelledby="summary-title">
          <h2 id="summary-title">订单摘要</h2>
          <dl>
            <div><dt>商品小计</dt><dd>¥88.00</dd></div>
            <div><dt>运费</dt><dd>¥0.00</dd></div>
          </dl>
          <button type="button">提交订单</button>
        </section>
      </main>
    """)

    summary = page.get_by_role("region", name="订单摘要")
    expect(summary).to_match_aria_snapshot("""
      - heading "订单摘要" [level=2]
      - term: 商品小计
      - definition: ¥88.00
      - term: 运费
      - definition: ¥0.00
      - button "提交订单"
    """)
```

{% note info flat %}
snapshot 应覆盖稳定、重要的合同。订单号、时间戳等动态文本可以省略或用正则；如果把整个页面所有细节都锁死，维护成本会迅速超过收益。
{% endnote %}

{% note info flat %}
需要探索当前结构时，可以临时打印；确认合同后应把稳定部分收敛为断言：
{% endnote %}

```python
print(page.get_by_role("region", name="订单摘要").aria_snapshot())
```

{% note info flat %}
生成结果只是起点，不能未经审查就批准为基线。一个缺失名称的按钮同样可以被忠实地“快照”下来。
{% endnote %}

### 无障碍扫描

{% note info flat %}
官方 ARIA snapshots 页面说明了用可访问性树建立稳定结构合同的边界；`axe-playwright-python` 提供 Playwright Python 的 axe-core 封装。它是第三方集成，因此单独安装并锁定版本：
{% endnote %}

```bash
uv add --dev axe-playwright-python==0.1.8
```

{% note info flat %}
同步 API 的最小测试如下，重点是把扫描结果接入测试失败：
{% endnote %}

```python
from axe_playwright_python.sync_playwright import Axe
from playwright.sync_api import Page


def test_checkout_has_no_axe_violations(page: Page) -> None:
    page.goto("http://127.0.0.1:8000/checkout")

    results = Axe().run(page)

    assert results.violations_count == 0, results.response.get("violations", [])
```

{% note info flat %}
axe 能发现许多可机器判断的问题，例如缺失名称、部分 ARIA 误用和可计算的对比度违规。但“零违规”不等于满足全部 WCAG，也不等于真实用户能顺利完成任务。动态状态、复杂读屏体验、语言是否清楚以及键盘流程是否合理，仍需要人工评估。
{% endnote %}

### 人工检查

{% note info flat %}
对 CheckoutSummary，最低限度的人工清单可以是：
{% endnote %}

- 只用 Tab 和 Shift+Tab 能按视觉顺序到达交互元素；
- 焦点样式始终清晰可见，不被粘性层遮挡；
- Enter 或 Space 能激活按钮，且不会重复提交；
- 金额变化和校验错误能被读屏感知；
- 放大到 200% 后内容不截断，页面仍可完成提交；
- 文案、货币与错误提示在当前语言环境中可理解。

{% note info flat %}
人工结论也要留下执行者、环境、日期和观察结果，而不是写一句“人工看过”。自动化与人工的覆盖关系可以这样理解：
{% endnote %}

{% mermaid %}
flowchart TD
  A[ARIA snapshot\n结构合同] --> G[统一质量门]
  X[axe\n已编码规则] --> G
  M[键盘与读屏\n人工体验] --> G
  V[像素 diff\n渲染结果] --> G
{% endmermaid %}

{% note info flat %}
四个信号相互补充，没有任何一个能单独代表完整质量。
{% endnote %}

### 视觉回归

{% note info flat %}
Playwright Test 的 Node.js 版本提供 `toHaveScreenshot()`，但 Playwright Python 没有对应的原生 `to_have_screenshot()` 断言。Python 可以稳定截图，再用 Pillow 编写一个边界明确的比较器。
{% endnote %}

{% note info flat %}
先安装并锁定 Pillow：
{% endnote %}

```bash
uv add --dev pillow==12.3.0
```

{% note info flat %}
下面的 helper 比较相同尺寸的 RGB 图像，在失败时报告归一化绝对像素差异并保存 diff。它是教学用最小实现，不替代成熟视觉平台的审批和报表能力。
{% endnote %}

```python
# visual_assertions.py
from pathlib import Path

from PIL import Image, ImageChops


def assert_visual(
    baseline_path: Path,
    current_path: Path,
    diff_path: Path,
    *,
    max_difference_ratio: float = 0.001,
) -> float:
    with Image.open(baseline_path) as baseline_image:
        baseline = baseline_image.convert("RGB")
    with Image.open(current_path) as current_image:
        current = current_image.convert("RGB")

    if baseline.size != current.size:
        raise AssertionError(
            f"image size changed: baseline={baseline.size}, current={current.size}"
        )

    diff = ImageChops.difference(baseline, current)
    histogram = diff.histogram()
    changed = sum((value % 256) * count for value, count in enumerate(histogram))
    maximum = 255 * 3 * baseline.width * baseline.height
    mismatch_ratio = changed / maximum

    if mismatch_ratio > max_difference_ratio:
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        diff.save(diff_path)
        raise AssertionError(
            f"visual difference {mismatch_ratio:.4%} exceeds "
            f"{max_difference_ratio:.4%}; diff={diff_path}"
        )
    return mismatch_ratio
```

{% note info flat %}
先用内存级小图验证比较器本身，避免质量门建立在错误算法上：
{% endnote %}

```python
# tests/test_visual_assertions.py
from pathlib import Path

import pytest
from PIL import Image

from visual_assertions import assert_visual


def save_pixel(path: Path, color: tuple[int, int, int]) -> None:
    Image.new("RGB", (1, 1), color).save(path)


def test_identical_and_single_channel_difference(tmp_path: Path) -> None:
    baseline = tmp_path / "baseline.png"
    current = tmp_path / "current.png"
    diff = tmp_path / "diff.png"
    save_pixel(baseline, (0, 0, 0))
    save_pixel(current, (0, 0, 0))
    assert assert_visual(baseline, current, diff) == 0

    save_pixel(current, (255, 0, 0))
    ratio = assert_visual(baseline, current, diff, max_difference_ratio=1.0)
    assert ratio == pytest.approx(1 / 3)


def test_threshold_and_size_failures(tmp_path: Path) -> None:
    baseline = tmp_path / "baseline.png"
    current = tmp_path / "current.png"
    diff = tmp_path / "diff.png"
    save_pixel(baseline, (0, 0, 0))
    save_pixel(current, (255, 0, 0))
    with pytest.raises(AssertionError, match="visual difference"):
        assert_visual(baseline, current, diff, max_difference_ratio=0.1)

    Image.new("RGB", (2, 1), (0, 0, 0)).save(current)
    with pytest.raises(AssertionError, match="image size changed"):
        assert_visual(baseline, current, diff)
```

{% note danger flat %}
首次运行时 baseline 不存在是预期状态，不能让测试自动把 current 覆盖成“正确答案”。先单独生成候选截图，人工确认内容、字体、平台和敏感信息，再显式复制为基线并提交评审：
{% endnote %}

```bash
# 1. 先运行截图步骤，预期比较器因 baseline 不存在而失败
uv run pytest tests/test_checkout_visual.py -q

# 2. 人工审查 current 后，显式建立 linux/chromium 基线
mkdir -p visual-baselines/linux/chromium
cp test-results/linux/chromium/checkout-current.png \
  visual-baselines/linux/chromium/checkout.png

# 3. 再运行；相同基线应通过，真实变化应生成 diff 并失败
uv run pytest tests/test_checkout_visual.py -q
```

{% note info flat %}
`FileNotFoundError` 表示尚未建立基线，而不是产品缺陷。基线文件必须经审查后进入版本控制；测试失败时禁止自动更新。
{% endnote %}

{% note info flat %}
组件测试负责固定渲染条件：
{% endnote %}

```python
import os
import sys
from pathlib import Path

from playwright.sync_api import Page, expect

from visual_assertions import assert_visual


def test_checkout_summary_visual(page: Page, browser_name: str) -> None:
    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto("http://127.0.0.1:8000/checkout")

    summary = page.get_by_role("region", name="订单摘要")
    expect(summary).to_be_visible()
    page.evaluate("() => document.fonts.ready")

    platform = os.environ.get(
        "PLAYWRIGHT_BASELINE_PLATFORM",
        "macos" if sys.platform == "darwin" else sys.platform,
    )
    baseline = Path("visual-baselines") / platform / browser_name / "checkout.png"
    current = Path("test-results") / platform / browser_name / "checkout-current.png"
    diff = Path("test-results") / platform / browser_name / "checkout-diff.png"

    current.parent.mkdir(parents=True, exist_ok=True)
    summary.screenshot(path=current, animations="disabled")
    assert_visual(baseline, current, diff, max_difference_ratio=0.001)
```

{% note info flat %}
截图稳定至少需要固定 viewport、浏览器、操作系统、字体、DPR、语言和数据。等待 `document.fonts.ready` 能避免字体尚未加载，但不能消除跨平台字体栅格化差异。最稳妥的基线策略是同一平台生成、同一平台比较：
{% endnote %}

```text
visual-baselines/
├── linux/
│   ├── chromium/checkout.png
│   ├── firefox/checkout.png
│   └── webkit/checkout.png
└── macos/                 # 只有确实要在 macOS 比较时才维护
```

{% note info flat %}
这只是文章内展示的逻辑结构，不会在博客仓库创建目录。
{% endnote %}

{% note warning flat %}
差异阈值是噪声预算，不是“让测试通过”的旋钮。阈值变大前必须先查看 current 与 diff，确认变化来自可接受的抗锯齿或渲染噪声，而不是组件真的错位。
{% endnote %}

### 质量结论

{% note info flat %}
一次 CheckoutSummary 变更可以形成如下记录：
{% endnote %}

```python
signals = [
    Signal("aria-contract", True, Status.PASS, "pytest: aria snapshot"),
    Signal("axe-scan", True, Status.PASS, "axe: 0 violations"),
    Signal("keyboard-review", True, Status.PASS, "review: QA-142"),
    Signal("visual-linux-chromium", False, Status.SKIPPED, "baseline not enabled"),
]

assert gate_passed(signals)
```

{% note info flat %}
optional 视觉检查被跳过不会自动阻断，但必须如实记录。若项目把视觉回归定义为 required，同样的 `SKIPPED` 就会失败。
{% endnote %}

{% note info flat %}
批准基线更新前，至少回答：产品需求是否允许变化、ARIA 和业务断言是否仍通过、diff 是否只包含预期区域、所有受支持平台是否需要独立更新。不能因为 CI 变红就覆盖旧图。
{% endnote %}

## 接口边界

{% note info flat %}
以下索引按 Playwright Python 1.62.0 的同步 API 归类，方便在具体场景中选择对象、成员和参数；它是查询表，不替代前文的机制、示例与失败边界。异步 API 只在实际执行 I/O 时使用 await。
{% endnote %}

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 主线成员 | 常用成员 | 扩展成员与参数 | 替代写法 |
| --- | --- | --- | --- | --- |
| `Browser` | — | — | `new_browser_cdp_session()` | `start_tracing()`、`stop_tracing()` |
| `BrowserContext` | — | — | `clock`、`debugger`、`new_cdp_session()`、`service_workers` | — |
| `BrowserType` | — | — | `connect_over_cdp()`、`launch_persistent_context()` | — |
| `CDPSession` | — | — | `detach()`、`send()` | — |
| `Clock` | — | — | `fast_forward()`、`install()`、`pause_at()`、`resume()`、`run_for()`、`set_fixed_time()`、`set_system_time()` | — |
| `Credentials` | — | — | `create()`、`delete()`、`get()`、`install()` | — |
| `Debugger` | — | — | `next()`、`paused_details`、`request_pause()`、`resume()`、`run_to()` | — |
| `Disposable` | — | — | `close()`、`dispose()` | — |
| `ElementHandle` | — | — | — | `as_element()`、`bounding_box()`、`check()`、`click()`、`content_frame()`、`dblclick()`、`dispatch_event()`、`dispose()`、`eval_on_selector()`、`eval_on_selector_all()`、`evaluate()`、`evaluate_handle()`、`fill()`、`focus()`、`get_attribute()`、`get_properties()`、`get_property()`、`hover()`、`inner_html()`、`inner_text()`、`input_value()`、`is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`json_value()`、`owner_frame()`、`press()`、`query_selector()`、`query_selector_all()`、`screenshot()`、`scroll_into_view_if_needed()`、`select_option()`、`select_text()`、`set_checked()`、`set_input_files()`、`tap()`、`text_content()`、`type()`、`uncheck()`、`wait_for_element_state()`、`wait_for_selector()` |
| `JSHandle` | — | — | `as_element()`、`dispose()`、`evaluate()`、`evaluate_handle()`、`get_properties()`、`get_property()`、`json_value()` | — |
| `Page` | — | — | `add_init_script()`、`add_locator_handler()`、`add_script_tag()`、`add_style_tag()`、`clock`、`expect_websocket()`、`pdf()`、`remove_locator_handler()`、`request_gc()`、`screencast` | — |
| `Screencast` | — | — | `hide_actions()`、`hide_overlays()`、`show_actions()`、`show_chapter()`、`show_overlay()`、`show_overlays()`、`start()`、`stop()` | — |
| `WebSocket` | — | — | `expect_event()`、`is_closed()`、`url`、`wait_for_event()` | — |
| `WebSocketRoute` | — | — | `close()`、`connect_to_server()`、`on_close()`、`on_message()`、`protocols`、`send()`、`url` | — |
| `Worker` | — | — | `evaluate()`、`evaluate_handle()`、`expect_event()`、`url` | — |
| `Browser.start_tracing` 参数 | — | — | — | `categories`, `page`, `path`, `screenshots` |
| `BrowserContext.new_cdp_session` 参数 | — | — | `page` | — |
| `BrowserType.connect_over_cdp` 参数 | — | — | `artifacts_dir`, `endpoint_url`, `headers`, `is_local`, `no_defaults`, `slow_mo`, `timeout` | — |
| `BrowserType.launch_persistent_context` 参数 | — | — | `accept_downloads`, `args`, `artifacts_dir`, `base_url`, `bypass_csp`, `channel`, `chromium_sandbox`, `client_certificates`, `color_scheme`, `contrast`, `device_scale_factor`, `downloads_path`, `env`, `executable_path`, `extra_http_headers`, `firefox_user_prefs`, `forced_colors`, `geolocation`, `handle_sighup`, `handle_sigint`, `handle_sigterm`, `has_touch`, `headless`, `http_credentials`, `ignore_default_args`, `ignore_https_errors`, `is_mobile`, `java_script_enabled`, `locale`, `no_viewport`, `offline`, `permissions`, `proxy`, `record_har_content`, `record_har_mode`, `record_har_omit_content`, `record_har_path`, `record_har_url_filter`, `record_video_dir`, `record_video_size`, `reduced_motion`, `screen`, `service_workers`, `slow_mo`, `strict_selectors`, `timeout`, `timezone_id`, `traces_dir`, `user_agent`, `user_data_dir`, `viewport` | — |
| `CDPSession.send` 参数 | — | — | `method`, `params` | — |
| `Clock.fast_forward` 参数 | — | — | `ticks` | — |
| `Clock.install` 参数 | — | — | `time` | — |
| `Clock.pause_at` 参数 | — | — | `time` | — |
| `Clock.run_for` 参数 | — | — | `ticks` | — |
| `Clock.set_fixed_time` 参数 | — | — | `time` | — |
| `Clock.set_system_time` 参数 | — | — | `time` | — |
| `Credentials.create` 参数 | — | — | `id`, `private_key`, `public_key`, `rp_id`, `user_handle` | — |
| `Credentials.delete` 参数 | — | — | `id` | — |
| `Credentials.get` 参数 | — | — | `id`, `rp_id` | — |
| `Debugger.run_to` 参数 | — | — | `location` | — |
| `ElementHandle.check` 参数 | — | — | — | `force`, `no_wait_after`, `position`, `scroll`, `timeout`, `trial` |
| `ElementHandle.click` 参数 | — | — | — | `button`, `click_count`, `delay`, `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `steps`, `timeout`, `trial` |
| `ElementHandle.dblclick` 参数 | — | — | — | `button`, `delay`, `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `steps`, `timeout`, `trial` |
| `ElementHandle.dispatch_event` 参数 | — | — | — | `event_init`, `type` |
| `ElementHandle.eval_on_selector` 参数 | — | — | — | `arg`, `expression`, `selector` |
| `ElementHandle.eval_on_selector_all` 参数 | — | — | — | `arg`, `expression`, `selector` |
| `ElementHandle.evaluate` 参数 | — | — | — | `arg`, `expression` |
| `ElementHandle.evaluate_handle` 参数 | — | — | — | `arg`, `expression` |
| `ElementHandle.fill` 参数 | — | — | — | `force`, `no_wait_after`, `timeout`, `value` |
| `ElementHandle.get_attribute` 参数 | — | — | — | `name` |
| `ElementHandle.get_property` 参数 | — | — | — | `property_name` |
| `ElementHandle.hover` 参数 | — | — | — | `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `timeout`, `trial` |
| `ElementHandle.input_value` 参数 | — | — | — | `timeout` |
| `ElementHandle.press` 参数 | — | — | — | `delay`, `key`, `no_wait_after`, `timeout` |
| `ElementHandle.query_selector` 参数 | — | — | — | `selector` |
| `ElementHandle.query_selector_all` 参数 | — | — | — | `selector` |
| `ElementHandle.screenshot` 参数 | — | — | — | `animations`, `caret`, `mask`, `mask_color`, `omit_background`, `path`, `quality`, `scale`, `style`, `timeout`, `type` |
| `ElementHandle.scroll_into_view_if_needed` 参数 | — | — | — | `timeout` |
| `ElementHandle.select_option` 参数 | — | — | — | `element`, `force`, `index`, `label`, `no_wait_after`, `timeout`, `value` |
| `ElementHandle.select_text` 参数 | — | — | — | `force`, `timeout` |
| `ElementHandle.set_checked` 参数 | — | — | — | `checked`, `force`, `no_wait_after`, `position`, `scroll`, `timeout`, `trial` |
| `ElementHandle.set_input_files` 参数 | — | — | — | `files`, `no_wait_after`, `timeout` |
| `ElementHandle.tap` 参数 | — | — | — | `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `timeout`, `trial` |
| `ElementHandle.type` 参数 | — | — | — | `delay`, `no_wait_after`, `text`, `timeout` |
| `ElementHandle.uncheck` 参数 | — | — | — | `force`, `no_wait_after`, `position`, `scroll`, `timeout`, `trial` |
| `ElementHandle.wait_for_element_state` 参数 | — | — | — | `state`, `timeout` |
| `ElementHandle.wait_for_selector` 参数 | — | — | — | `selector`, `state`, `strict`, `timeout` |
| `JSHandle.evaluate` 参数 | — | — | `arg`, `expression` | — |
| `JSHandle.evaluate_handle` 参数 | — | — | `arg`, `expression` | — |
| `JSHandle.get_property` 参数 | — | — | `property_name` | — |
| `Page.add_init_script` 参数 | — | — | `path`, `script` | — |
| `Page.add_locator_handler` 参数 | — | — | `handler`, `locator`, `no_wait_after`, `times` | — |
| `Page.add_script_tag` 参数 | — | — | `content`, `path`, `type`, `url` | — |
| `Page.add_style_tag` 参数 | — | — | `content`, `path`, `url` | — |
| `Page.expect_websocket` 参数 | — | — | `predicate`, `timeout` | — |
| `Page.pdf` 参数 | — | — | `display_header_footer`, `footer_template`, `format`, `header_template`, `height`, `landscape`, `margin`, `outline`, `page_ranges`, `path`, `prefer_css_page_size`, `print_background`, `scale`, `tagged`, `width` | — |
| `Page.remove_locator_handler` 参数 | — | — | `locator` | — |
| `Screencast.show_actions` 参数 | — | — | `cursor`, `duration`, `font_size`, `position` | — |
| `Screencast.show_chapter` 参数 | — | — | `description`, `duration`, `title` | — |
| `Screencast.show_overlay` 参数 | — | — | `duration`, `html` | — |
| `Screencast.start` 参数 | — | — | `on_frame`, `path`, `quality`, `size` | — |
| `WebSocket.expect_event` 参数 | — | — | `event`, `predicate`, `timeout` | — |
| `WebSocket.wait_for_event` 参数 | — | — | `event`, `predicate`, `timeout` | — |
| `WebSocketRoute.close` 参数 | — | — | `code`, `reason` | — |
| `WebSocketRoute.on_close` 参数 | — | — | `handler` | — |
| `WebSocketRoute.on_message` 参数 | — | — | `handler` | — |
| `WebSocketRoute.send` 参数 | — | — | `message` | — |
| `Worker.evaluate` 参数 | — | — | `arg`, `expression` | — |
| `Worker.evaluate_handle` 参数 | — | — | `arg`, `expression` | — |
| `Worker.expect_event` 参数 | — | — | `event`, `predicate`, `timeout` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-visual-baseline deck:"Playwright" priority:3 tags:"视觉回归,基线" %}
--- question
什么时候可以更新视觉回归基线？
--- answer
需求变化已批准，并人工审查 current、diff 和对应平台后。
--- explanation
基线更新是评审动作，不是失败后的自动修复。业务断言、ARIA 合同和受支持平台都必须继续满足要求。
{% endflashcard %}

{% flashcard choice id:playwright-advanced-quality-gate deck:"Playwright" priority:3 tags:"无障碍,质量门" answer:C %}
--- question
required 的键盘检查被跳过、optional 的视觉检查失败时，质量门应如何判定？
- [A] 通过，因为视觉是 optional
- [B] 自动把键盘检查改为不适用
- [C] 阻断，因为 required 信号不是 PASS 或 NOT_APPLICABLE
--- answer
C
--- explanation
SKIPPED 不能冒充绿色；optional 失败也应记录和评估，但阻断原因首先来自 required 键盘检查未完成。
{% endflashcard %}

{% flashcard basic id:playwright-websocket-route deck:"Playwright" priority:3 tags:"WebSocket,网络Mock" %}
--- question
`route_web_socket()` 不调用 `connect_to_server()` 时代表什么？
--- answer
测试完全模拟该 WebSocket，不连接真实服务器。
--- explanation
处理器像服务端一样接收并发送帧；需要代理真实连接时再调用 `connect_to_server()`，并明确哪些消息继续转发。
{% endflashcard %}

## 参考资料

### 浏览器能力

{% linkgroup %}
{% link Playwright Shadow DOM Locators, https://playwright.dev/python/docs/locators#locate-in-shadow-dom, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Clock, https://playwright.dev/python/docs/clock, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Chrome extensions, https://playwright.dev/python/docs/chrome-extensions, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Mock APIs, https://playwright.dev/python/docs/mock, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Service workers, https://playwright.dev/python/docs/network#missing-network-events-and-service-workers, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

### 协议与网络

{% linkgroup %}
{% link Playwright Network and WebSockets, https://playwright.dev/python/docs/network, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright WebSockets, https://playwright.dev/python/docs/network#websockets, https://playwright.dev/img/playwright-logo.svg %}
{% link WebSocketRoute API, https://playwright.dev/python/docs/api/class-websocketroute, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

### BDD 集成

{% linkgroup %}
{% link pytest-bdd, https://pypi.org/project/pytest-bdd/, https://pypi.org/favicon.ico %}
{% endlinkgroup %}

### 专项质量

{% linkgroup %}
{% link Playwright ARIA snapshots, https://playwright.dev/python/docs/aria-snapshots, https://playwright.dev/img/playwright-logo.svg %}
{% link axe-playwright-python, https://pypi.org/project/axe-playwright-python/, https://pypi.org/favicon.ico %}
{% link W3C WAI Evaluating Web Accessibility, https://www.w3.org/WAI/test-evaluate/, https://www.w3.org/favicon.ico %}
{% link Playwright Screenshots, https://playwright.dev/python/docs/screenshots, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Test Visual Comparisons, https://playwright.dev/docs/test-snapshots, https://playwright.dev/img/playwright-logo.svg %}
{% link Pillow, https://pypi.org/project/pillow/, https://pypi.org/favicon.ico %}
{% endlinkgroup %}

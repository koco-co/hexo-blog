---
title: Playwright文档(十一) 进阶内容
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

本篇集中介绍常规 Web 自动化主线之外的能力。它们并非“不重要”，而是只在特定架构或质量目标下使用：WebSocket 和 GraphQL 取决于协议，无障碍与视觉回归属于专项质量门，BDD 取决于团队协作方式。

Python 示例全部保留在代码块中；第三方依赖需要由项目单独评估和锁定，不会混入主线环境。

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

XPath 不会穿透 Shadow DOM。Closed Shadow Root 也不能被普通 Locator 访问，这是组件实现刻意设置的边界。遇到 closed shadow 时优先验证组件提供的公开用户行为，或与开发团队建立测试接口，不要通过注入脚本强行打开生产组件内部。

Canvas 没有可定位的子 DOM。测试应优先验证画布旁的可访问替代、业务状态或后端结果；只有交互本身依赖坐标时，才固定 viewport 后使用 `page.mouse`。

## 时间控制

倒计时、会话过期和定时刷新不应真实等待数分钟。Clock API 可以控制 Page 所属 Context 中的时间和计时器：

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

`run_for()` 会执行时间段内的计时回调；`fast_forward()` 更接近设备休眠后恢复，只让到期计时器立即触发。Clock 影响整个 BrowserContext 中的 Page 和 iframe，多个时间场景应使用独立 Context。

只需要固定 `Date.now()` 时优先 `set_fixed_time()`；需要推进 timer 时再 `install()`。修改系统时间不能替代服务端时间、数据库 TTL 或第三方 Token 过期验证。

## GraphQL

GraphQL 通常共享一个 URL，不能只按路径区分接口。路由处理器需要读取 `operationName`：

下面是迁移到真实项目时的路由骨架，`shop.example` 和页面发出的 Query 需要替换为受测系统的环回或测试环境实现；代码重点是按操作名分流，不能单独复制后直接运行。

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

GraphQL 响应即使 HTTP 状态是 200，也可能包含顶层 `errors`。协议测试要同时检查 HTTP 状态、`data`、`errors` 和页面降级结果。生产系统如果使用持久化查询，测试还需要根据 hash 或变量建立稳定匹配规则。

Mock 只控制依赖，不证明真实 Schema 兼容。保留 API 集成测试或契约校验，避免前端 Mock 与服务端一起漂移。

## WebSocket

只观察连接和帧时，监听 Page 的 `websocket` 事件：

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

需要完全模拟服务端时，在导航前注册 `route_web_socket()`：

下面同样是接入骨架：受测页面必须实际创建匹配 URL 的 WebSocket，并将状态渲染到 `role="status"`，示例才会形成完整测试。

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

不调用 `connect_to_server()` 时，连接由测试完全模拟；调用后可以在页面和真实服务器之间转发、修改或阻断帧。帧日志可能包含聊天内容、Token 或个人信息，CI 中不要直接打印全部 payload。

## BDD 集成

BDD 适合产品、开发和测试共同维护稳定业务语言的团队。它不适合把每一行点击机械翻译成 Given、When、Then。

```bash
uv add --dev pytest-bdd
```

Feature 只描述业务合同：

```gherkin
Feature: 提交订单
  Scenario: 填写收件人并提交
    Given 结算页已打开
    When 收件人 "Alice" 提交订单
    Then 订单状态为 "订单已创建"
```

Step 复用 pytest Fixture 和第八篇的 Page Object：

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

Step 不应自行启动浏览器，也不要隐藏复杂通用流程。Gherkin 用于共享业务例子；定位、等待和页面操作仍由测试代码维护。

## 质量范围

功能断言回答“订单金额算对了吗”，却不一定能发现按钮失去可访问名称、焦点顺序混乱或组件在某个平台错位。下面围绕 `CheckoutSummary` 组件建立专项质量门。

工具多不等于结论清楚。先为每个信号定义是否必需，以及四种状态的含义：

| status | 含义 | required 信号如何处理 |
| --- | --- | --- |
| `PASS` | 已执行且满足合同 | 放行 |
| `FAIL` | 已执行但不满足合同 | 阻断 |
| `SKIPPED` | 本应执行，却因环境或流程跳过 | 阻断 |
| `NOT_APPLICABLE` | 经风险评估后明确不适用 | 不阻断 |

统一规则可以保持得很简单：任一 required 信号不是 `PASS` 或 `NOT_APPLICABLE`，本次质量门就失败。optional 信号失败要记录和评估，但不自动冒充硬门槛。

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

这里最重要的不是数据类，而是语义：`SKIPPED` 不是绿色，`NOT_APPLICABLE` 也不能用来掩盖“没来得及测”。

## ARIA 快照

ARIA snapshot 把可访问性树表示为 YAML。它关注角色、可访问名称、状态和层级，不关心组件是蓝色还是绿色。

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

snapshot 应覆盖稳定、重要的合同。订单号、时间戳等动态文本可以省略或用正则；如果把整个页面所有细节都锁死，维护成本会迅速超过收益。

需要探索当前结构时，可以临时打印：

```python
print(page.get_by_role("region", name="订单摘要").aria_snapshot())
```

生成结果只是起点，不能未经审查就批准为基线。一个缺失名称的按钮同样可以被忠实地“快照”下来。

## 无障碍扫描

`axe-playwright-python` 提供 Playwright Python 的 axe-core 封装。它是第三方集成，因此单独安装并锁定版本：

```bash
uv add --dev axe-playwright-python==0.1.8
```

同步 API 的最小测试如下：

```python
from axe_playwright_python.sync_playwright import Axe
from playwright.sync_api import Page


def test_checkout_has_no_axe_violations(page: Page) -> None:
    page.goto("http://127.0.0.1:8000/checkout")

    results = Axe().run(page)

    assert results.violations_count == 0, results.response.get("violations", [])
```

axe 能发现许多可机器判断的问题，例如缺失名称、部分 ARIA 误用和可计算的对比度违规。但“零违规”不等于满足全部 WCAG，也不等于真实用户能顺利完成任务。动态状态、复杂读屏体验、语言是否清楚以及键盘流程是否合理，仍需要人工评估。

## 人工检查

对 CheckoutSummary，最低限度的人工清单可以是：

- 只用 Tab 和 Shift+Tab 能按视觉顺序到达交互元素；
- 焦点样式始终清晰可见，不被粘性层遮挡；
- Enter 或 Space 能激活按钮，且不会重复提交；
- 金额变化和校验错误能被读屏感知；
- 放大到 200% 后内容不截断，页面仍可完成提交；
- 文案、货币与错误提示在当前语言环境中可理解。

人工结论也要留下执行者、环境、日期和观察结果，而不是写一句“人工看过”。自动化与人工的覆盖关系可以这样理解：

{% mermaid %}
flowchart TD
  A[ARIA snapshot\n结构合同] --> G[统一质量门]
  X[axe\n已编码规则] --> G
  M[键盘与读屏\n人工体验] --> G
  V[像素 diff\n渲染结果] --> G
{% endmermaid %}

四个信号相互补充，没有任何一个能单独代表完整质量。

## 视觉回归

Playwright Test 的 Node.js 版本提供 `toHaveScreenshot()`，但 Playwright Python 没有对应的原生 `to_have_screenshot()` 断言。Python 可以稳定截图，再用 Pillow 编写一个边界明确的比较器。

先安装并锁定 Pillow：

```bash
uv add --dev pillow==12.3.0
```

下面的 helper 比较相同尺寸的 RGB 图像，在失败时报告归一化绝对像素差异并保存 diff。它是教学用最小实现，不替代成熟视觉平台的审批和报表能力。

```python
# visual_assertions.py
from pathlib import Path

from PIL import Image, ImageChops


def assert_visual(
    baseline_path: Path,
    current_path: Path,
    diff_path: Path,
    *,
    max_mismatch_ratio: float = 0.001,
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

    if mismatch_ratio > max_mismatch_ratio:
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        diff.save(diff_path)
        raise AssertionError(
            f"visual mismatch {mismatch_ratio:.4%} exceeds "
            f"{max_mismatch_ratio:.4%}; diff={diff_path}"
        )
    return mismatch_ratio
```

先用内存级小图验证比较器本身，避免质量门建立在错误算法上：

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
    ratio = assert_visual(baseline, current, diff, max_mismatch_ratio=1.0)
    assert ratio == pytest.approx(1 / 3)


def test_threshold_and_size_failures(tmp_path: Path) -> None:
    baseline = tmp_path / "baseline.png"
    current = tmp_path / "current.png"
    diff = tmp_path / "diff.png"
    save_pixel(baseline, (0, 0, 0))
    save_pixel(current, (255, 0, 0))
    with pytest.raises(AssertionError, match="visual mismatch"):
        assert_visual(baseline, current, diff, max_mismatch_ratio=0.1)

    Image.new("RGB", (2, 1), (0, 0, 0)).save(current)
    with pytest.raises(AssertionError, match="image size changed"):
        assert_visual(baseline, current, diff)
```

首次运行时 baseline 不存在是预期状态，不能让测试自动把 current 覆盖成“正确答案”。先单独生成候选截图，人工确认内容、字体、平台和敏感信息，再显式复制为基线并提交评审：

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

`FileNotFoundError` 表示尚未建立基线，而不是产品缺陷。基线文件必须经审查后进入版本控制；测试失败时禁止自动更新。

组件测试负责固定渲染条件：

```python
from pathlib import Path

from playwright.sync_api import Page, expect

from visual_assertions import assert_visual


def test_checkout_summary_visual(page: Page, browser_name: str) -> None:
    page.set_viewport_size({"width": 1280, "height": 800})
    page.goto("http://127.0.0.1:8000/checkout")

    summary = page.get_by_role("region", name="订单摘要")
    expect(summary).to_be_visible()
    page.evaluate("() => document.fonts.ready")

    platform = "linux"  # 在 CI 中由受控环境提供
    baseline = Path("visual-baselines") / platform / browser_name / "checkout.png"
    current = Path("test-results") / platform / browser_name / "checkout-current.png"
    diff = Path("test-results") / platform / browser_name / "checkout-diff.png"

    current.parent.mkdir(parents=True, exist_ok=True)
    summary.screenshot(path=current, animations="disabled")
    assert_visual(baseline, current, diff, max_mismatch_ratio=0.001)
```

截图稳定至少需要固定 viewport、浏览器、操作系统、字体、DPR、语言和数据。等待 `document.fonts.ready` 能避免字体尚未加载，但不能消除跨平台字体栅格化差异。最稳妥的基线策略是同一平台生成、同一平台比较：

```text
visual-baselines/
├── linux/
│   ├── chromium/checkout.png
│   ├── firefox/checkout.png
│   └── webkit/checkout.png
└── macos/                 # 只有确实要在 macOS 比较时才维护
```

这只是文章内展示的逻辑结构，不会在博客仓库创建目录。

{% note warning %}
差异阈值是噪声预算，不是“让测试通过”的旋钮。阈值变大前必须先查看 current 与 diff，确认变化来自可接受的抗锯齿或渲染噪声，而不是组件真的错位。
{% endnote %}

## 质量结论

一次 CheckoutSummary 变更可以形成如下记录：

```python
signals = [
    Signal("aria-contract", True, Status.PASS, "pytest: aria snapshot"),
    Signal("axe-scan", True, Status.PASS, "axe: 0 violations"),
    Signal("keyboard-review", True, Status.PASS, "review: QA-142"),
    Signal("visual-linux-chromium", False, Status.SKIPPED, "baseline not enabled"),
]

assert gate_passed(signals)
```

optional 视觉检查被跳过不会自动阻断，但必须如实记录。若项目把视觉回归定义为 required，同样的 `SKIPPED` 就会失败。

批准基线更新前，至少回答：产品需求是否允许变化、ARIA 和业务断言是否仍通过、diff 是否只包含预期区域、所有受支持平台是否需要独立更新。不能因为 CI 变红就覆盖旧图。

## 常见问题

{% flashcard basic id:playwright-visual-baseline deck:"Playwright" tags:"视觉回归,基线" %}
--- question
什么时候可以更新视觉回归基线？
--- answer
需求变化已批准，并人工审查 current、diff 和对应平台后。
--- explanation
基线更新是评审动作，不是失败后的自动修复。业务断言、ARIA 合同和受支持平台都必须继续满足要求。
{% endflashcard %}

{% flashcard choice id:playwright-advanced-quality-gate deck:"Playwright" tags:"无障碍,质量门" answer:C %}
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

{% flashcard basic id:playwright-websocket-route deck:"Playwright" tags:"WebSocket,网络Mock" %}
--- question
`route_web_socket()` 不调用 `connect_to_server()` 时代表什么？
--- answer
测试完全模拟该 WebSocket，不连接真实服务器。
--- explanation
处理器像服务端一样接收并发送帧；需要代理真实连接时再调用 `connect_to_server()`，并明确哪些消息继续转发。
{% endflashcard %}

## 参考资料

### 浏览器扩展

{% linkgroup %}
{% link Playwright Shadow DOM Locators, https://playwright.dev/python/docs/locators#locate-in-shadow-dom, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Clock, https://playwright.dev/python/docs/clock, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Network and WebSockets, https://playwright.dev/python/docs/network, https://playwright.dev/img/playwright-logo.svg %}
{% link WebSocketRoute API, https://playwright.dev/python/docs/api/class-websocketroute, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

### BDD 集成

{% linkgroup %}
{% link pytest-bdd, https://pypi.org/project/pytest-bdd/, https://pypi.org/favicon.ico %}
{% endlinkgroup %}

### 专项质量

{% linkgroup %}
{% link ARIA Snapshots, https://playwright.dev/python/docs/aria-snapshots, https://playwright.dev/img/playwright-logo.svg %}
{% link axe-playwright-python, https://pypi.org/project/axe-playwright-python/, https://pypi.org/favicon.ico %}
{% link W3C WAI Evaluating Web Accessibility, https://www.w3.org/WAI/test-evaluate/, https://www.w3.org/favicon.ico %}
{% link Playwright Screenshots, https://playwright.dev/python/docs/screenshots, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Test Visual Comparisons, https://playwright.dev/docs/test-snapshots, https://playwright.dev/img/playwright-logo.svg %}
{% link Pillow, https://pypi.org/project/pillow/, https://pypi.org/favicon.ico %}
{% endlinkgroup %}

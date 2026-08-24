---
title: Playwright文档(二) 快速开始
tags:
  - Playwright
  - Python
  - pytest-playwright
  - uv
categories:
  - Learn Topic
  - Playwright
description: 从空目录建立可重复的 Playwright Python 环境，运行首个 pytest 测试，并理解浏览器对象模型、内置 Fixture 以及同步与异步 API 的选型边界。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 2
published: true
abbrlink: da4e7889
date: 2026-08-24 12:11:00
---

{% course_series %}

本篇只完成一件事：建立能稳定复现的最小环境，并看懂第一个测试背后的对象关系。后续文章统一使用同步 API；异步 API 在本篇给出完整对照，便于在异步应用或高并发工具中正确选型。

## 环境准备

新建空目录后，用 `uv` 初始化项目并安装测试依赖：

```bash
uv init --python 3.11
uv add --dev pytest "playwright==1.62.0" "pytest-playwright==0.9.0"
uv run playwright install chromium
```

三条命令分别解决不同层次的问题：

| 层次 | 内容 | 常见误解 |
| --- | --- | --- |
| Python 包 | `playwright`、`pytest-playwright` | 装完包就能启动浏览器 |
| 浏览器二进制 | Chromium、Firefox、WebKit | 直接复用系统浏览器即可 |
| 系统依赖 | Linux 字体、图形和媒体库 | 本地通过，CI 一定通过 |

在 Debian/Ubuntu CI 中通常使用：

```bash
uv run playwright install --with-deps chromium
```

本地初学阶段先安装 Chromium，理解基本流程后再扩展三浏览器，避免把下载、系统依赖和测试代码问题混在一起。

建议忽略运行产物：

```gitignore
.venv/
__pycache__/
.pytest_cache/
test-results/
*.webm
*.zip
```

Trace、截图和录像可能包含页面文本、Cookie 或 Token，只在受控位置短期保存，不应无筛选提交到 Git。

## 首个测试

新建 `tests/test_home.py`，代码如下：

```python
from playwright.sync_api import Page, expect


def test_home_title(page: Page) -> None:
    page.set_content("""
        <main>
          <h1>ShopLab</h1>
          <a href="/orders">查看订单</a>
        </main>
    """)

    expect(page.get_by_role("heading", name="ShopLab")).to_be_visible()
    expect(page.get_by_role("link", name="查看订单")).to_have_attribute(
        "href", "/orders"
    )
```

运行测试：

```bash
uv run pytest -q
```

`page` 不是自己创建的普通变量，而是 `pytest-playwright` 提供的 Function 级 Fixture。插件在用例开始前创建 Page，在用例结束后回收相关资源。`expect()` 是 Playwright 的 Web-first 断言，会在超时范围内重复查询页面状态。

需要观察浏览器时运行：

```bash
uv run pytest --headed --browser chromium -q
```

`--headed` 只用于观察和调试。无头与有头模式都应使用同一套定位和断言，不能依靠肉眼确认结果。

## 对象模型

Playwright 的核心对象具有明确所有权：

{% mermaid %}
flowchart TD
    P[Playwright] --> BT[BrowserType]
    BT --> B[Browser]
    B --> C1[BrowserContext 买家]
    B --> C2[BrowserContext 管理员]
    C1 --> P1[Page 首页]
    C1 --> P2[Page 订单页]
    P1 --> L[Locator]
{% endmermaid %}

- `Playwright`：客户端入口，提供 Chromium、Firefox、WebKit 三种 BrowserType；
- `Browser`：一个浏览器进程或连接；
- `BrowserContext`：类似无痕会话的隔离边界；
- `Page`：一个标签页；
- `Locator`：如何在 Page 或 Frame 中持续查找目标元素。

Locator 不是创建时就冻结的 DOM 元素。执行点击或断言时，它会重新查询当前页面，因此能够适应重渲染。第三篇会专门讲定位语义。

## 内置 Fixture

常用 Fixture 如下：

| Fixture | 作用 | 默认生命周期 |
| --- | --- | --- |
| `playwright` | Playwright 入口 | Session |
| `browser_type` | 当前浏览器类型 | Session |
| `browser` | 当前浏览器实例 | Session |
| `browser_name` | 当前浏览器名 | Session |
| `browser_channel` | 当前浏览器渠道 | Session |
| `device` | `--device` 选择的设备名 | Session |
| `is_chromium` / `is_firefox` / `is_webkit` | 浏览器类型布尔判断 | Session |
| `launch_browser` | 按当前启动配置创建 Browser 的工厂 | Session |
| `browser_type_launch_args` | 覆盖 BrowserType 启动参数 | Session |
| `browser_context_args` | 合并 Context 默认参数 | Session |
| `connect_options` | 改为连接远端 Playwright 服务 | Session |
| `new_context` | 创建并自动回收额外 Context 的工厂 | Function |
| `context` | 隔离浏览器会话 | Function |
| `page` | 当前标签页 | Function |
| `output_path` | 当前用例的截图、视频与 Trace 输出目录 | Function |

测试函数只声明自己需要的资源：

```python
from playwright.sync_api import Browser, Page


def test_fixture_identity(page: Page, browser: Browser, browser_name: str) -> None:
    assert page.context.browser is browser
    assert browser_name in {"chromium", "firefox", "webkit"}
```

不要为了“复用”把 `page` 提升为 Session 级全局对象。页面状态会在用例间残留，失败后也更难恢复。需要复用登录时，应保存 `storage_state`，而不是共享同一个 Page。

## 同步与异步

两套 API 的对象和能力基本一致，差别在调用方式和运行环境。

{% tabs 同步与异步, 1 %}
<!-- tab 同步 API -->
```python
from playwright.sync_api import sync_playwright


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    context = browser.new_context()
    try:
        page = context.new_page()
        page.goto("https://example.com")
        print(page.title())
    finally:
        context.close()
        browser.close()
```
<!-- endtab -->

<!-- tab 异步 API -->
```python
import asyncio

from playwright.async_api import async_playwright


async def main() -> None:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        context = await browser.new_context()
        try:
            page = await context.new_page()
            await page.goto("https://example.com")
            print(await page.title())
        finally:
            await context.close()
            await browser.close()


asyncio.run(main())
```
<!-- endtab -->
{% endtabs %}

选择原则：

- 常规 pytest UI 套件优先同步 API，代码更直接，生态配置也更简单；
- 已经运行在 `asyncio` 中的服务测试、采集器或并发工具可以使用异步 API；
- 异步不会让单个页面的导航凭空变快，收益主要来自合理并发等待；
- 不要在同一调用链混用 `sync_api` 和 `async_api`；
- 异步 pytest 使用 `pytest-playwright-asyncio`，测试和 Fixture 都需要遵循其事件循环契约。

同步插件与异步插件不能安装在同一个 pytest 环境。下面的对照必须放在独立空目录中，只安装异步插件：

```bash
mkdir playwright-async-demo
cd playwright-async-demo
uv init --python 3.11
uv add --dev "playwright==1.62.0" "pytest-playwright-asyncio==0.9.0" pytest-asyncio
uv run playwright install chromium
```

事件循环作用域需要与异步插件的 Session 级资源一致：

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_default_test_loop_scope = "session"
```

```python
import pytest
from playwright.async_api import Page, expect


@pytest.mark.asyncio(loop_scope="session")
async def test_async_home(page: Page) -> None:
    await page.set_content("<h1>ShopLab</h1>")
    await expect(page.get_by_role("heading", name="ShopLab")).to_be_visible()
```

具体标记和事件循环配置应以当前插件文档为准。不要在主线环境同时保留 `pytest-playwright` 与 `pytest-playwright-asyncio`；对于本系列主线，继续使用同步 Fixture，避免同时学习两套测试运行模型。

两套 API 的公开对象与成员是镜像关系，但“异步方法一律 `await`”是错误规则。异步绑定需要区分四类返回模型：

| 类型 | 写法 | 示例 |
| --- | --- | --- |
| 浏览器 I/O 协程 | `await` | `await page.goto(url)`、`await locator.click()` |
| Locator 构造、属性读取或回调注册 | 直接调用 | `page.get_by_role(...)`、`locator.filter(...)`、`request.method`、`route.on_message(...)` |
| 事件上下文管理器 | `async with` | `async with page.expect_response(...) as info:` |
| 属性 | 直接读取 | `page.url`、`request.method` |

```python
# 错误：get_by_role() 立即返回 Locator，不是 awaitable
# button = await page.get_by_role("button", name="保存")

button = page.get_by_role("button", name="保存")
await button.click()
visible = await button.is_visible()
count = await page.get_by_role("listitem").count()

async with page.expect_response("**/api/orders") as response_info:
    await button.click()
response = await response_info.value
```

本文末尾的异步完整镜像索引按这四种模型列出冻结版本的全部对象成员。后续各篇以同步写法讲业务机制；转换时应查成员所在列，而不是机械添加 `await`，也不能在同步 Fixture 中调用异步 Page。

超时、取消与清理也属于异步合同。Playwright 操作超时抛出自身的 `TimeoutError`；`asyncio` 取消任务时会注入 `CancelledError`，清理后必须继续抛出，不能把取消吞掉：

```python
import asyncio

from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright


async def inspect_page(url: str) -> None:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        context = await browser.new_context()
        try:
            page = await context.new_page()
            await page.goto(url)
            try:
                await page.get_by_role("status").wait_for(timeout=1_000)
            except PlaywrightTimeoutError:
                print("页面未在 1 秒内出现状态区域")
                raise
        except asyncio.CancelledError:
            print("任务被取消，开始释放浏览器资源")
            raise
        finally:
            await context.close()
            await browser.close()
```

`finally` 保证成功、超时和取消都走同一条资源释放路径。并发任务还应由创建它们的上层 TaskGroup 或调用方统一等待和取消，避免遗留后台浏览器任务。

## 运行参数

常用命令：

```bash
# 指定浏览器
uv run pytest --browser firefox

# 运行单个文件
uv run pytest tests/test_home.py -q

# 运行单个用例
uv run pytest tests/test_home.py::test_home_title -q

# 显示标准输出
uv run pytest -s

# 首次失败后停止
uv run pytest -x
```

多浏览器可以重复传入参数：

```bash
uv run pytest --browser chromium --browser firefox --browser webkit
```

此时同一用例会分别执行。第十篇会进一步设计跨浏览器、并行和 CI 策略。

`pytest-playwright` 0.9.0 的插件参数可按用途分组：

| 用途 | 参数 | 说明 |
| --- | --- | --- |
| 浏览器 | `--browser`、`--browser-channel`、`--headed` | 选择引擎、渠道与显示模式 |
| 调试节奏 | `--slowmo`、`--playwright-debug=cli` | 放慢动作或进入 CLI 调试；后者需要 `-s` 且只能单 worker |
| 设备 | `--device` | 合并官方设备描述；不要与自定义 Context 参数盲目叠加 |
| 产物目录 | `--output` | 设置当前测试产物根目录 |
| Trace | `--tracing=on` / `retain-on-failure` | 全量保留或仅失败保留 |
| 视频 | `--video=on` / `retain-on-failure` | 控制视频保留策略 |
| 截图 | `--screenshot=on` / `only-on-failure` | 控制截图策略 |
| 整页截图 | `--full-page-screenshot` | 让自动截图覆盖完整页面 |

参数名称与具体可选值以当前插件 `--help` 为准：

```bash
uv run pytest --help | rg 'browser|slowmo|device|tracing|video|screenshot|playwright-debug'
```

## 故障处理

安装后启动失败时，按层次排查：

1. `uv run python -c "import playwright"` 验证 Python 包；
2. `uv run playwright install chromium` 验证浏览器二进制；
3. Linux 使用 `uv run playwright install-deps chromium` 补系统依赖；
4. 确认执行命令使用同一个虚拟环境；
5. 再检查代理、磁盘空间和浏览器下载缓存。

版本升级后 Python 包与浏览器二进制可能不匹配，应重新执行安装命令。不要通过硬编码内部缓存路径修补问题。

## 基础成员

`playwright.chromium`、`firefox`、`webkit` 分别返回三个 BrowserType；`BrowserType.name` 可读取引擎名，`executable_path` 可用于诊断 Playwright 管理的浏览器路径。`connect()` 连接由 Node.js `BrowserType.launchServer` 创建的 Playwright BrowserServer；Python 端只使用 WebSocket endpoint，连接端与服务端的 Playwright 主、次版本必须匹配。普通本地测试仍优先 `launch()`，不要把 `connect()` 与仅支持 Chromium 的 CDP 连接混用。

Page 的常用基础成员按任务分组：

| 任务 | 成员 | 选择边界 |
| --- | --- | --- |
| 导航 | `goto()`、`reload()`、`go_back()`、`go_forward()` | 每次导航后验证 URL 或页面关键状态；返回值可能为空 |
| 内容 | `content()`、`set_content()` | `content()` 读取完整 HTML；`set_content()` 适合自包含练习，不替代真实站点导航 |
| 状态 | `title()`、`url`、`is_closed()` | 标题和 URL 优先用 Web-first 断言；`is_closed()` 用于生命周期诊断 |
| 超时 | `set_default_timeout()`、`set_default_navigation_timeout()` | 只设置合理全局基线，单次异常再局部覆盖 |
| 关闭 | `close()` | 关闭后继续操作会抛错；pytest 的 `page` Fixture 通常由插件回收 |

`goto()` 的 `wait_until` 决定导航完成信号，常规页面保持默认 `load` 或依赖后续 Web-first 断言；`domcontentloaded` 只等待 DOM 解析，`commit` 只确认收到响应，`networkidle` 不应作为通用测试就绪条件。`timeout` 只覆盖这次导航；确有协议合同时可传 `referer`，并且该显式值优先于 `page.set_extra_http_headers()` 中的 Referer。DNS、TLS、连接失败或超时会抛错；HTTP 404/500 通常仍返回 Response，因此还要检查状态或用户可见错误页。

`launch()` 的常见参数也应按目的使用：`headless` 控制有无窗口，`channel` 选择 Chrome/Edge 等渠道，`slow_mo` 只用于观察动作；`proxy` 配置代理，`downloads_path` 与 `traces_dir` 指定产物目录，`args` 直接传浏览器参数，兼容风险最高。诊断参数不应永久写入共享 Fixture。

`sync_playwright()` / `async_playwright()` 上下文退出时会调用 `stop()`；手工 `start()` 的代码才需要显式 `stop()`。

API 索引中的 Page 进阶成员只在对应任务出现时进入：

- 页面诊断：`console_messages()`、`clear_console_messages()`、`page_errors()`、`clear_page_errors()`、`requests()`；用于失败后读取或清理页面侧证据。
- JavaScript 执行与桥接：`eval_on_selector()`、`eval_on_selector_all()`、`evaluate()`、`evaluate_handle()`、`expose_binding()`、`expose_function()`；仅当 Locator 与页面公开行为无法表达底层合同。
- Frame 与 Worker：`frame()`、`expect_worker()`；用于明确的 frame 查找或 Worker 创建事件，常规 iframe 仍优先 FrameLocator。
- 定位器拾取与高亮：`pick_locator()`、`cancel_pick_locator()`、`hide_highlight()`；用于工具化调试，不进入普通业务用例。
- 存储：`local_storage`、`session_storage`；用于受控状态诊断，登录复用仍优先 `storage_state`。
- 页面视图：`set_viewport_size()`、`bring_to_front()`；前者只改视口，后者只在多页焦点确实属于产品合同时使用。
- 结构快照：`aria_snapshot()`；用于读取可访问性树结构，专项断言在后续文章按场景使用。

## 旧接口迁移

Page 中直接接收 selector 的查询和状态接口已不适合作为新测试主线。它们按同一规则迁移到 Locator，异步 API 使用相同替代项，仅在真正执行浏览器 I/O 时增加 `await`：

| 旧式 Page API | 推荐写法 |
| --- | --- |
| `query_selector()` / `query_selector_all()` | `locator()`、`get_by_*()`；列表使用 `locator.all()` 或 `count()` |
| `get_attribute()` / `text_content()` / `inner_text()` / `inner_html()` / `input_value()` | `locator` 对应读取；测试结果优先 `expect(locator).to_*()` |
| `is_checked()` / `is_disabled()` / `is_editable()` / `is_enabled()` / `is_hidden()` / `is_visible()` | `expect(locator)` 的 Web-first 状态断言 |
| `drag_and_drop(source, target)` | `source_locator.drag_to(target_locator)` |
| `expect_navigation()` | 明确 URL 时用 `wait_for_url()`；下载、弹窗、请求等使用对应 `expect_*` |

`wait_for_timeout()` 只适合人工调试，正式测试应等待 Locator、URL、请求或业务状态。`Browser.new_page()` 会隐式创建 Context，无法清楚表达资源所有权；新代码使用 `browser.new_context()` → `context.new_page()`。Chromium 的低层 `Browser.start_tracing()` / `stop_tracing()` 不等于 Playwright Trace Viewer 产物，常规诊断使用 `context.tracing`，第十篇会完整介绍。

## 结果验证

完成本篇时应能回答：

- Python 包、浏览器二进制和系统依赖分别由什么命令准备；
- `browser`、`context`、`page` 和 `locator` 的所有权关系；
- 为什么默认 Page 不应跨测试共享；
- 同步与异步 API 在语法和适用场景上的差异；
- 如何指定单个测试与浏览器运行。

## API 速查

下面的索引用于查漏和选型；主线能力仍以本篇前文的机制、示例和失败边界为准。方法名和公开签名参数按 Playwright Python 1.62.0 的同步 API 归类，异步 API 的对应关系在第二篇统一说明；参数行是完整索引，不等于逐项教程。

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 核心详解 | 正文简述 | 进阶内容 | 弃用迁移 |
| --- | --- | --- | --- | --- |
| `BrowserType` | `launch()` | `connect()`、`executable_path`、`name` | — | — |
| `Page` | `goto()` | `close()`、`content()`、`go_back()`、`go_forward()`、`is_closed()`、`reload()`、`set_content()`、`set_default_navigation_timeout()`、`set_default_timeout()`、`title()`、`url` | `aria_snapshot()`、`bring_to_front()`、`cancel_pick_locator()`、`clear_console_messages()`、`clear_page_errors()`、`console_messages()`、`eval_on_selector()`、`eval_on_selector_all()`、`evaluate()`、`evaluate_handle()`、`expect_worker()`、`expose_binding()`、`expose_function()`、`frame()`、`hide_highlight()`、`local_storage`、`page_errors()`、`pick_locator()`、`requests()`、`session_storage`、`set_viewport_size()` | `drag_and_drop()`、`expect_navigation()`、`get_attribute()`、`inner_html()`、`inner_text()`、`input_value()`、`is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`query_selector()`、`query_selector_all()`、`text_content()` |
| `Playwright` | — | `chromium`、`firefox`、`stop()`、`webkit` | — | — |
| `BrowserType.connect` 参数 | — | — | `endpoint`, `expose_network`, `headers`, `slow_mo`, `timeout` | — |
| `BrowserType.launch` 参数 | — | — | `args`, `artifacts_dir`, `channel`, `chromium_sandbox`, `downloads_path`, `env`, `executable_path`, `firefox_user_prefs`, `handle_sighup`, `handle_sigint`, `handle_sigterm`, `headless`, `ignore_default_args`, `proxy`, `slow_mo`, `timeout`, `traces_dir` | — |
| `Page.aria_snapshot` 参数 | — | — | `boxes`, `depth`, `mode`, `timeout` | — |
| `Page.close` 参数 | — | — | `reason`, `run_before_unload` | — |
| `Page.console_messages` 参数 | — | — | `filter` | — |
| `Page.drag_and_drop` 参数 | — | — | — | `force`, `no_wait_after`, `scroll`, `source`, `source_position`, `steps`, `strict`, `target`, `target_position`, `timeout`, `trial` |
| `Page.eval_on_selector` 参数 | — | — | `arg`, `expression`, `selector`, `strict` | — |
| `Page.eval_on_selector_all` 参数 | — | — | `arg`, `expression`, `selector` | — |
| `Page.evaluate` 参数 | — | — | `arg`, `expression` | — |
| `Page.evaluate_handle` 参数 | — | — | `arg`, `expression` | — |
| `Page.expect_navigation` 参数 | — | — | — | `timeout`, `url`, `wait_until` |
| `Page.expect_worker` 参数 | — | — | `predicate`, `timeout` | — |
| `Page.expose_binding` 参数 | — | — | `callback`, `name` | — |
| `Page.expose_function` 参数 | — | — | `callback`, `name` | — |
| `Page.frame` 参数 | — | — | `name`, `url` | — |
| `Page.get_attribute` 参数 | — | — | — | `name`, `selector`, `strict`, `timeout` |
| `Page.go_back` 参数 | — | — | `timeout`, `wait_until` | — |
| `Page.go_forward` 参数 | — | — | `timeout`, `wait_until` | — |
| `Page.goto` 参数 | — | — | `referer`, `timeout`, `url`, `wait_until` | — |
| `Page.inner_html` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.inner_text` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.input_value` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.is_checked` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.is_disabled` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.is_editable` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.is_enabled` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.is_hidden` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.is_visible` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.page_errors` 参数 | — | — | `filter` | — |
| `Page.query_selector` 参数 | — | — | — | `selector`, `strict` |
| `Page.query_selector_all` 参数 | — | — | — | `selector` |
| `Page.reload` 参数 | — | — | `timeout`, `wait_until` | — |
| `Page.set_content` 参数 | — | — | `html`, `timeout`, `wait_until` | — |
| `Page.set_default_navigation_timeout` 参数 | — | — | `timeout` | — |
| `Page.set_default_timeout` 参数 | — | — | `timeout` | — |
| `Page.set_viewport_size` 参数 | — | — | `viewport_size` | — |
| `Page.text_content` 参数 | — | — | — | `selector`, `strict`, `timeout` |

{% endfolding %}

{% folding blue, 查看 async_api 完整镜像索引 %}

`async_api` 在对象与成员层面镜像下列同步 API，但并非所有方法都需要 `await`。表格按冻结版本的真实返回模型分为协程、同步构造或注册方法、异步事件上下文和属性；这里只核对完整调用模型，不承担其他文章的旧接口迁移教学，迁移项及其主文章在最后一列单独标出。

| 异步对象 | 使用 `await` | 直接调用 | 使用 `async with` | 属性 | 迁移项与主文章 |
| --- | --- | --- | --- | --- | --- |
| `async_api.APIRequest` | `new_context()` | — | — | — | — |
| `async_api.APIRequestContext` | `delete()`、`dispose()`、`fetch()`、`get()`、`head()`、`patch()`、`post()`、`put()`、`storage_state()` | — | — | `tracing` | — |
| `async_api.APIResponse` | `body()`、`dispose()`、`json()`、`security_details()`、`server_addr()`、`text()` | — | — | `headers`、`headers_array`、`ok`、`status`、`status_text`、`timing`、`url` | — |
| `async_api.APIResponseAssertions` | `not_to_be_ok()`、`to_be_ok()` | — | — | — | — |
| `async_api.Browser` | `bind()`、`close()`、`new_browser_cdp_session()`、`new_context()`、`new_page()`、`start_tracing()`、`stop_tracing()`、`unbind()` | `is_connected()` | — | `browser_type`、`contexts`、`version` | `new_page()` → Playwright文档(七)浏览器上下文.md；`start_tracing()` → Playwright文档(十一)进阶内容.md；`stop_tracing()` → Playwright文档(十一)进阶内容.md |
| `async_api.BrowserContext` | `add_cookies()`、`add_init_script()`、`clear_cookies()`、`clear_permissions()`、`close()`、`cookies()`、`expose_binding()`、`expose_function()`、`grant_permissions()`、`new_cdp_session()`、`new_page()`、`route()`、`route_from_har()`、`route_web_socket()`、`set_extra_http_headers()`、`set_geolocation()`、`set_offline()`、`set_storage_state()`、`storage_state()`、`unroute()`、`unroute_all()`、`wait_for_event()` | `is_closed()`、`set_default_navigation_timeout()`、`set_default_timeout()` | `expect_console_message()`、`expect_event()`、`expect_page()` | `background_pages`、`browser`、`clock`、`credentials`、`debugger`、`pages`、`request`、`service_workers`、`tracing` | — |
| `async_api.BrowserType` | `connect()`、`connect_over_cdp()`、`launch()`、`launch_persistent_context()` | — | — | `executable_path`、`name` | — |
| `async_api.CDPSession` | `detach()`、`send()` | — | — | — | — |
| `async_api.Clock` | `fast_forward()`、`install()`、`pause_at()`、`resume()`、`run_for()`、`set_fixed_time()`、`set_system_time()` | — | — | — | — |
| `async_api.ConsoleMessage` | — | — | — | `args`、`location`、`page`、`text`、`timestamp`、`type`、`worker` | — |
| `async_api.Credentials` | `create()`、`delete()`、`get()`、`install()` | — | — | — | — |
| `async_api.Debugger` | `next()`、`request_pause()`、`resume()`、`run_to()` | — | — | `paused_details` | — |
| `async_api.Dialog` | `accept()`、`dismiss()` | — | — | `default_value`、`message`、`page`、`type` | — |
| `async_api.Disposable` | `close()`、`dispose()` | — | — | — | — |
| `async_api.Download` | `cancel()`、`delete()`、`failure()`、`path()`、`save_as()` | — | — | `page`、`suggested_filename`、`url` | — |
| `async_api.ElementHandle` | `bounding_box()`、`check()`、`click()`、`content_frame()`、`dblclick()`、`dispatch_event()`、`dispose()`、`eval_on_selector()`、`eval_on_selector_all()`、`evaluate()`、`evaluate_handle()`、`fill()`、`focus()`、`get_attribute()`、`get_properties()`、`get_property()`、`hover()`、`inner_html()`、`inner_text()`、`input_value()`、`is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`json_value()`、`owner_frame()`、`press()`、`query_selector()`、`query_selector_all()`、`screenshot()`、`scroll_into_view_if_needed()`、`select_option()`、`select_text()`、`set_checked()`、`set_input_files()`、`tap()`、`text_content()`、`type()`、`uncheck()`、`wait_for_element_state()`、`wait_for_selector()` | `as_element()` | — | — | `as_element()` → Playwright文档(十一)进阶内容.md；`bounding_box()` → Playwright文档(十一)进阶内容.md；`check()` → Playwright文档(十一)进阶内容.md；`click()` → Playwright文档(十一)进阶内容.md；`content_frame()` → Playwright文档(十一)进阶内容.md；`dblclick()` → Playwright文档(十一)进阶内容.md；`dispatch_event()` → Playwright文档(十一)进阶内容.md；`dispose()` → Playwright文档(十一)进阶内容.md；`eval_on_selector()` → Playwright文档(十一)进阶内容.md；`eval_on_selector_all()` → Playwright文档(十一)进阶内容.md；`evaluate()` → Playwright文档(十一)进阶内容.md；`evaluate_handle()` → Playwright文档(十一)进阶内容.md；`fill()` → Playwright文档(十一)进阶内容.md；`focus()` → Playwright文档(十一)进阶内容.md；`get_attribute()` → Playwright文档(十一)进阶内容.md；`get_properties()` → Playwright文档(十一)进阶内容.md；`get_property()` → Playwright文档(十一)进阶内容.md；`hover()` → Playwright文档(十一)进阶内容.md；`inner_html()` → Playwright文档(十一)进阶内容.md；`inner_text()` → Playwright文档(十一)进阶内容.md；`input_value()` → Playwright文档(十一)进阶内容.md；`is_checked()` → Playwright文档(十一)进阶内容.md；`is_disabled()` → Playwright文档(十一)进阶内容.md；`is_editable()` → Playwright文档(十一)进阶内容.md；`is_enabled()` → Playwright文档(十一)进阶内容.md；`is_hidden()` → Playwright文档(十一)进阶内容.md；`is_visible()` → Playwright文档(十一)进阶内容.md；`json_value()` → Playwright文档(十一)进阶内容.md；`owner_frame()` → Playwright文档(十一)进阶内容.md；`press()` → Playwright文档(十一)进阶内容.md；`query_selector()` → Playwright文档(十一)进阶内容.md；`query_selector_all()` → Playwright文档(十一)进阶内容.md；`screenshot()` → Playwright文档(十一)进阶内容.md；`scroll_into_view_if_needed()` → Playwright文档(十一)进阶内容.md；`select_option()` → Playwright文档(十一)进阶内容.md；`select_text()` → Playwright文档(十一)进阶内容.md；`set_checked()` → Playwright文档(十一)进阶内容.md；`set_input_files()` → Playwright文档(十一)进阶内容.md；`tap()` → Playwright文档(十一)进阶内容.md；`text_content()` → Playwright文档(十一)进阶内容.md；`type()` → Playwright文档(十一)进阶内容.md；`uncheck()` → Playwright文档(十一)进阶内容.md；`wait_for_element_state()` → Playwright文档(十一)进阶内容.md；`wait_for_selector()` → Playwright文档(十一)进阶内容.md |
| `async_api.FileChooser` | `set_files()` | `is_multiple()` | — | `element`、`page` | — |
| `async_api.Frame` | `add_script_tag()`、`add_style_tag()`、`check()`、`click()`、`content()`、`dblclick()`、`dispatch_event()`、`drag_and_drop()`、`eval_on_selector()`、`eval_on_selector_all()`、`evaluate()`、`evaluate_handle()`、`fill()`、`focus()`、`frame_element()`、`get_attribute()`、`goto()`、`hover()`、`inner_html()`、`inner_text()`、`input_value()`、`is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`press()`、`query_selector()`、`query_selector_all()`、`select_option()`、`set_checked()`、`set_content()`、`set_input_files()`、`tap()`、`text_content()`、`title()`、`type()`、`uncheck()`、`wait_for_function()`、`wait_for_load_state()`、`wait_for_selector()`、`wait_for_timeout()`、`wait_for_url()` | `frame_locator()`、`get_by_alt_text()`、`get_by_label()`、`get_by_placeholder()`、`get_by_role()`、`get_by_test_id()`、`get_by_text()`、`get_by_title()`、`is_detached()`、`locator()` | `expect_navigation()` | `child_frames`、`name`、`page`、`parent_frame`、`url` | `check()` → Playwright文档(六)常见组件操作.md；`click()` → Playwright文档(六)常见组件操作.md；`dblclick()` → Playwright文档(六)常见组件操作.md；`dispatch_event()` → Playwright文档(六)常见组件操作.md；`drag_and_drop()` → Playwright文档(六)常见组件操作.md；`eval_on_selector()` → Playwright文档(六)常见组件操作.md；`eval_on_selector_all()` → Playwright文档(六)常见组件操作.md；`expect_navigation()` → Playwright文档(六)常见组件操作.md；`fill()` → Playwright文档(六)常见组件操作.md；`focus()` → Playwright文档(六)常见组件操作.md；`get_attribute()` → Playwright文档(六)常见组件操作.md；`hover()` → Playwright文档(六)常见组件操作.md；`inner_html()` → Playwright文档(六)常见组件操作.md；`inner_text()` → Playwright文档(六)常见组件操作.md；`input_value()` → Playwright文档(六)常见组件操作.md；`is_checked()` → Playwright文档(六)常见组件操作.md；`is_disabled()` → Playwright文档(六)常见组件操作.md；`is_editable()` → Playwright文档(六)常见组件操作.md；`is_enabled()` → Playwright文档(六)常见组件操作.md；`is_hidden()` → Playwright文档(六)常见组件操作.md；`is_visible()` → Playwright文档(六)常见组件操作.md；`press()` → Playwright文档(六)常见组件操作.md；`query_selector()` → Playwright文档(六)常见组件操作.md；`query_selector_all()` → Playwright文档(六)常见组件操作.md；`select_option()` → Playwright文档(六)常见组件操作.md；`set_checked()` → Playwright文档(六)常见组件操作.md；`set_input_files()` → Playwright文档(六)常见组件操作.md；`tap()` → Playwright文档(六)常见组件操作.md；`text_content()` → Playwright文档(六)常见组件操作.md；`type()` → Playwright文档(六)常见组件操作.md；`uncheck()` → Playwright文档(六)常见组件操作.md；`wait_for_selector()` → Playwright文档(六)常见组件操作.md；`wait_for_timeout()` → Playwright文档(六)常见组件操作.md |
| `async_api.FrameLocator` | — | `frame_locator()`、`get_by_alt_text()`、`get_by_label()`、`get_by_placeholder()`、`get_by_role()`、`get_by_test_id()`、`get_by_text()`、`get_by_title()`、`locator()`、`nth()` | — | `first`、`last`、`owner` | `first` → Playwright文档(三)页面元素定位.md；`last` → Playwright文档(三)页面元素定位.md；`nth()` → Playwright文档(三)页面元素定位.md |
| `async_api.JSHandle` | `dispose()`、`evaluate()`、`evaluate_handle()`、`get_properties()`、`get_property()`、`json_value()` | `as_element()` | — | — | — |
| `async_api.Keyboard` | `down()`、`insert_text()`、`press()`、`type()`、`up()` | — | — | — | — |
| `async_api.Locator` | `all()`、`all_inner_texts()`、`all_text_contents()`、`aria_snapshot()`、`blur()`、`bounding_box()`、`check()`、`clear()`、`click()`、`count()`、`dblclick()`、`dispatch_event()`、`drag_to()`、`drop()`、`element_handle()`、`element_handles()`、`evaluate()`、`evaluate_all()`、`evaluate_handle()`、`fill()`、`focus()`、`get_attribute()`、`hide_highlight()`、`highlight()`、`hover()`、`inner_html()`、`inner_text()`、`input_value()`、`is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`normalize()`、`press()`、`press_sequentially()`、`screenshot()`、`scroll_into_view_if_needed()`、`select_option()`、`select_text()`、`set_checked()`、`set_input_files()`、`tap()`、`text_content()`、`type()`、`uncheck()`、`wait_for()`、`wait_for_function()` | `and_()`、`describe()`、`filter()`、`frame_locator()`、`get_by_alt_text()`、`get_by_label()`、`get_by_placeholder()`、`get_by_role()`、`get_by_test_id()`、`get_by_text()`、`get_by_title()`、`locator()`、`nth()`、`or_()` | — | `content_frame`、`description`、`first`、`last`、`page` | `element_handle()` → Playwright文档(三)页面元素定位.md；`element_handles()` → Playwright文档(三)页面元素定位.md；`type()` → Playwright文档(五)页面交互操作.md |
| `async_api.LocatorAssertions` | `not_to_be_attached()`、`not_to_be_checked()`、`not_to_be_disabled()`、`not_to_be_editable()`、`not_to_be_empty()`、`not_to_be_enabled()`、`not_to_be_focused()`、`not_to_be_hidden()`、`not_to_be_in_viewport()`、`not_to_be_visible()`、`not_to_contain_class()`、`not_to_contain_text()`、`not_to_have_accessible_description()`、`not_to_have_accessible_error_message()`、`not_to_have_accessible_name()`、`not_to_have_attribute()`、`not_to_have_class()`、`not_to_have_count()`、`not_to_have_css()`、`not_to_have_id()`、`not_to_have_js_property()`、`not_to_have_role()`、`not_to_have_text()`、`not_to_have_value()`、`not_to_have_values()`、`not_to_match_aria_snapshot()`、`to_be_attached()`、`to_be_checked()`、`to_be_disabled()`、`to_be_editable()`、`to_be_empty()`、`to_be_enabled()`、`to_be_focused()`、`to_be_hidden()`、`to_be_in_viewport()`、`to_be_visible()`、`to_contain_class()`、`to_contain_text()`、`to_have_accessible_description()`、`to_have_accessible_error_message()`、`to_have_accessible_name()`、`to_have_attribute()`、`to_have_class()`、`to_have_count()`、`to_have_css()`、`to_have_id()`、`to_have_js_property()`、`to_have_role()`、`to_have_text()`、`to_have_value()`、`to_have_values()`、`to_match_aria_snapshot()` | — | — | — | — |
| `async_api.Mouse` | `click()`、`dblclick()`、`down()`、`move()`、`up()`、`wheel()` | — | — | — | — |
| `async_api.Page` | `add_init_script()`、`add_locator_handler()`、`add_script_tag()`、`add_style_tag()`、`aria_snapshot()`、`bring_to_front()`、`cancel_pick_locator()`、`check()`、`clear_console_messages()`、`clear_page_errors()`、`click()`、`close()`、`console_messages()`、`content()`、`dblclick()`、`dispatch_event()`、`drag_and_drop()`、`emulate_media()`、`eval_on_selector()`、`eval_on_selector_all()`、`evaluate()`、`evaluate_handle()`、`expose_binding()`、`expose_function()`、`fill()`、`focus()`、`get_attribute()`、`go_back()`、`go_forward()`、`goto()`、`hide_highlight()`、`hover()`、`inner_html()`、`inner_text()`、`input_value()`、`is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`opener()`、`page_errors()`、`pause()`、`pdf()`、`pick_locator()`、`press()`、`query_selector()`、`query_selector_all()`、`reload()`、`remove_locator_handler()`、`request_gc()`、`requests()`、`route()`、`route_from_har()`、`route_web_socket()`、`screenshot()`、`select_option()`、`set_checked()`、`set_content()`、`set_extra_http_headers()`、`set_input_files()`、`set_viewport_size()`、`tap()`、`text_content()`、`title()`、`type()`、`uncheck()`、`unroute()`、`unroute_all()`、`wait_for_event()`、`wait_for_function()`、`wait_for_load_state()`、`wait_for_selector()`、`wait_for_timeout()`、`wait_for_url()` | `frame()`、`frame_locator()`、`get_by_alt_text()`、`get_by_label()`、`get_by_placeholder()`、`get_by_role()`、`get_by_test_id()`、`get_by_text()`、`get_by_title()`、`is_closed()`、`locator()`、`set_default_navigation_timeout()`、`set_default_timeout()` | `expect_console_message()`、`expect_download()`、`expect_event()`、`expect_file_chooser()`、`expect_navigation()`、`expect_popup()`、`expect_request()`、`expect_request_finished()`、`expect_response()`、`expect_websocket()`、`expect_worker()` | `clock`、`context`、`frames`、`keyboard`、`local_storage`、`main_frame`、`mouse`、`request`、`screencast`、`session_storage`、`touchscreen`、`url`、`video`、`viewport_size`、`workers` | `check()` → Playwright文档(五)页面交互操作.md；`click()` → Playwright文档(五)页面交互操作.md；`dblclick()` → Playwright文档(五)页面交互操作.md；`dispatch_event()` → Playwright文档(五)页面交互操作.md；`drag_and_drop()` → Playwright文档(二)快速开始.md；`expect_navigation()` → Playwright文档(二)快速开始.md；`fill()` → Playwright文档(五)页面交互操作.md；`focus()` → Playwright文档(五)页面交互操作.md；`get_attribute()` → Playwright文档(二)快速开始.md；`hover()` → Playwright文档(五)页面交互操作.md；`inner_html()` → Playwright文档(二)快速开始.md；`inner_text()` → Playwright文档(二)快速开始.md；`input_value()` → Playwright文档(二)快速开始.md；`is_checked()` → Playwright文档(二)快速开始.md；`is_disabled()` → Playwright文档(二)快速开始.md；`is_editable()` → Playwright文档(二)快速开始.md；`is_enabled()` → Playwright文档(二)快速开始.md；`is_hidden()` → Playwright文档(二)快速开始.md；`is_visible()` → Playwright文档(二)快速开始.md；`press()` → Playwright文档(五)页面交互操作.md；`query_selector()` → Playwright文档(二)快速开始.md；`query_selector_all()` → Playwright文档(二)快速开始.md；`select_option()` → Playwright文档(五)页面交互操作.md；`set_checked()` → Playwright文档(五)页面交互操作.md；`set_input_files()` → Playwright文档(六)常见组件操作.md；`tap()` → Playwright文档(五)页面交互操作.md；`text_content()` → Playwright文档(二)快速开始.md；`type()` → Playwright文档(五)页面交互操作.md；`uncheck()` → Playwright文档(五)页面交互操作.md；`wait_for_selector()` → Playwright文档(四)断言与等待.md；`wait_for_timeout()` → Playwright文档(四)断言与等待.md |
| `async_api.PageAssertions` | `not_to_have_title()`、`not_to_have_url()`、`not_to_match_aria_snapshot()`、`to_have_title()`、`to_have_url()`、`to_match_aria_snapshot()` | — | — | — | — |
| `async_api.Playwright` | `stop()` | — | — | `chromium`、`devices`、`firefox`、`request`、`selectors`、`webkit` | — |
| `async_api.Request` | `all_headers()`、`header_value()`、`headers_array()`、`response()`、`sizes()` | `is_navigation_request()` | — | `existing_response`、`failure`、`frame`、`headers`、`method`、`post_data`、`post_data_buffer`、`post_data_json`、`redirected_from`、`redirected_to`、`resource_type`、`service_worker`、`timing`、`url` | — |
| `async_api.Response` | `all_headers()`、`body()`、`finished()`、`header_value()`、`header_values()`、`headers_array()`、`http_version()`、`json()`、`security_details()`、`server_addr()`、`text()` | — | — | `frame`、`from_service_worker`、`headers`、`ok`、`request`、`status`、`status_text`、`url` | — |
| `async_api.Route` | `abort()`、`continue_()`、`fallback()`、`fetch()`、`fulfill()` | — | — | `request` | — |
| `async_api.Screencast` | `hide_actions()`、`hide_overlays()`、`show_actions()`、`show_chapter()`、`show_overlay()`、`show_overlays()`、`start()`、`stop()` | — | — | — | — |
| `async_api.Selectors` | `register()` | `set_test_id_attribute()` | — | — | — |
| `async_api.Touchscreen` | `tap()` | — | — | — | — |
| `async_api.Tracing` | `group()`、`group_end()`、`start()`、`start_chunk()`、`start_har()`、`stop()`、`stop_chunk()`、`stop_har()` | — | — | — | — |
| `async_api.Video` | `delete()`、`path()`、`save_as()` | — | — | — | — |
| `async_api.WebError` | — | — | — | `error`、`location`、`page` | — |
| `async_api.WebSocket` | `wait_for_event()` | `is_closed()` | `expect_event()` | `url` | — |
| `async_api.WebSocketRoute` | `close()` | `connect_to_server()`、`on_close()`、`on_message()`、`send()` | — | `protocols`、`url` | — |
| `async_api.WebStorage` | `clear()`、`get_item()`、`items()`、`remove_item()`、`set_item()` | — | — | — | — |
| `async_api.Worker` | `evaluate()`、`evaluate_handle()` | — | `expect_event()` | `url` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-install-layers deck:"Playwright" priority:2 tags:"安装,环境" %}
--- question
为什么安装 `pytest-playwright` 后还要运行 `playwright install`？
--- answer
前者安装 Python 包，后者下载匹配的浏览器二进制。
--- explanation
Playwright 客户端、浏览器二进制和 Linux 系统依赖是三层资源。只完成其中一层，测试仍可能在启动浏览器时失败。
{% endflashcard %}

{% flashcard choice id:playwright-sync-async-choice deck:"Playwright" priority:2 tags:"同步API,异步API" answer:A %}
--- question
一个普通 pytest UI 回归套件没有既有异步运行时，优先选择哪套 API？
- [A] 同步 API
- [B] 同时混用两套 API
- [C] 仅因测试数量多就改为异步 API
--- answer
A
--- explanation
同步 API 更直接；并行扩展通常由 pytest-xdist 和 CI 矩阵承担。只有既有异步上下文或明确并发需求时才选择异步 API。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link uv 项目管理, https://docs.astral.sh/uv/guides/projects/, https://docs.astral.sh/uv/assets/favicon.ico %}
{% link Playwright Python Library, https://playwright.dev/python/docs/library, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Python 安装, https://playwright.dev/python/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Writing tests, https://playwright.dev/python/docs/writing-tests, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Python 测试运行器, https://playwright.dev/python/docs/test-runners, https://playwright.dev/img/playwright-logo.svg %}
{% link pytest-playwright, https://github.com/microsoft/playwright-pytest, https://github.com/favicon.ico %}
{% link pytest-playwright-asyncio, https://github.com/microsoft/playwright-pytest/tree/main/pytest-playwright-asyncio, https://github.com/favicon.ico %}
{% endlinkgroup %}

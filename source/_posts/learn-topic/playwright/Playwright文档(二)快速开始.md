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
uv add --dev pytest pytest-playwright
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
| `context` | 隔离浏览器会话 | Function |
| `page` | 当前标签页 | Function |
| `browser_name` | `chromium`、`firefox` 或 `webkit` | Session |

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
    page = browser.new_page()
    page.goto("https://example.com")
    print(page.title())
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
        page = await browser.new_page()
        await page.goto("https://example.com")
        print(await page.title())
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
uv add --dev pytest-playwright-asyncio pytest-asyncio
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

## 故障处理

安装后启动失败时，按层次排查：

1. `uv run python -c "import playwright"` 验证 Python 包；
2. `uv run playwright install chromium` 验证浏览器二进制；
3. Linux 使用 `uv run playwright install-deps chromium` 补系统依赖；
4. 确认执行命令使用同一个虚拟环境；
5. 再检查代理、磁盘空间和浏览器下载缓存。

版本升级后 Python 包与浏览器二进制可能不匹配，应重新执行安装命令。不要通过硬编码内部缓存路径修补问题。

## 结果验证

完成本篇时应能回答：

- Python 包、浏览器二进制和系统依赖分别由什么命令准备；
- `browser`、`context`、`page` 和 `locator` 的所有权关系；
- 为什么默认 Page 不应跨测试共享；
- 同步与异步 API 在语法和适用场景上的差异；
- 如何指定单个测试与浏览器运行。

## 常见问题

{% flashcard basic id:playwright-install-layers deck:"Playwright" tags:"安装,环境" %}
--- question
为什么安装 `pytest-playwright` 后还要运行 `playwright install`？
--- answer
前者安装 Python 包，后者下载匹配的浏览器二进制。
--- explanation
Playwright 客户端、浏览器二进制和 Linux 系统依赖是三层资源。只完成其中一层，测试仍可能在启动浏览器时失败。
{% endflashcard %}

{% flashcard choice id:playwright-sync-async-choice deck:"Playwright" tags:"同步API,异步API" answer:A %}
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

- [Playwright Python 安装](https://playwright.dev/python/docs/intro)
- [Playwright Python 测试运行器](https://playwright.dev/python/docs/test-runners)
- [pytest-playwright](https://github.com/microsoft/playwright-pytest)
- [pytest-playwright-asyncio](https://github.com/microsoft/playwright-pytest/tree/main/pytest-playwright-asyncio)
- [uv 项目管理](https://docs.astral.sh/uv/guides/projects/)

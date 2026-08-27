---
title: Playwright(十)调试与交付
tags:
  - Playwright
  - Codegen
  - TraceViewer
  - pytest-xdist
  - 持续集成
categories:
  - Learn Topic
  - Playwright
description: 将 Codegen、Inspector、失败截图录像和 Trace Viewer 组成诊断流程，并设计三浏览器、pytest-xdist 与 CI 矩阵，以最小权限安全交付测试结果。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 10
published: true
abbrlink: '23096463'
date: 2026-04-16 00:00:00
---

{% course_series %}

{% note info flat %}
调试不是“失败后多截几张图”。可靠流程是：生成起点 → 重构语义 Locator → 交互式复现 → 保留最小证据 → 在 Trace 中重建因果链。
{% endnote %}

## 调试入口

{% note info flat %}
先把下面代码块复制为 `todo_server.py`。它只使用 Python 标准库，在随机端口提供与录制动作一致的 Todo 页面：
{% endnote %}

```python
# todo_server.py
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HTML = """<!doctype html><meta charset='utf-8'><title>Codegen Todo</title>
<label>待办事项 <input></label><button>添加</button>
<ul aria-label='待办事项'></ul>
<script>
  document.querySelector('button').onclick = () => {
    const item = document.createElement('li');
    item.textContent = document.querySelector('input').value;
    document.querySelector('ul').append(item);
  };
</script>""".encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(HTML)))
        self.end_headers()
        self.wfile.write(HTML)

    def log_message(self, format: str, *args: object) -> None:
        pass


server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
host, port = server.server_address
print(f"Todo URL: http://{host}:{port}/todo", flush=True)
try:
    server.serve_forever()
finally:
    server.server_close()
```

{% note info flat %}
终端 A 保持服务运行，并记下实际输出 URL：
{% endnote %}

```bash
uv run python todo_server.py
# Todo URL: http://127.0.0.1:<随机端口>/todo
```

{% note info flat %}
终端 B 把上一步真实 URL 传给 Codegen：
{% endnote %}

```bash
uv run playwright codegen --target python-pytest http://127.0.0.1:<实际端口>/todo
```

{% note info flat %}
完成录制后关闭 Inspector，再在终端 A 按 Ctrl+C；服务进入 `finally` 释放端口。
{% endnote %}

{% note primary flat %}
Codegen 会优先生成 role、text 与 test id Locator，也能录制断言；但它不知道套件的数据边界、fixture 层次和业务风险。生成后至少审查：
{% endnote %}

```python
from playwright.sync_api import expect


# 生成草稿可能只描述动作
page.get_by_role("textbox", name="待办事项").fill("检查 Trace")
page.get_by_role("button", name="添加").click()

# 最终测试补上业务结果和稳定范围
todo = page.get_by_role("list", name="待办事项")
expect(todo.get_by_role("listitem")).to_have_text(["检查 Trace"])
```

{% note info flat %}
如果 Codegen 产生 `.nth()` 或长 CSS，先检查页面是否缺少 accessible name 或稳定测试合同，而不是直接复制。
{% endnote %}

{% note info flat %}
后面的 CLI Debugger 与 Trace Viewer 共用一条确定性失败用例。先把它保存为 `tests/test_trace.py`：
{% endnote %}

```python
# tests/test_trace.py
from playwright.sync_api import Page, expect


def test_delayed_status(page: Page) -> None:
    page.set_content("""
      <button>提交</button><p role='status'>草稿</p>
      <script>
        document.querySelector('button').onclick = () =>
          setTimeout(() => document.querySelector('[role=status]').textContent='已提交', 800);
      </script>
    """)
    page.get_by_role("button", name="提交").click()
    expect(page.get_by_role("status")).to_have_text("已提交", timeout=100)
```

### 运行调试

| 工具 | 启动方式 | 适合问题 | 约束 |
| --- | --- | --- | --- |
| Inspector | `PWDEBUG=1 uv run pytest -s ...` | 单步、Locator 探索、actionability log | headed、单 worker 更清晰 |
| `page.pause()` | 在代码中设置断点 | 到达特定业务状态后检查 | 只用于本地调试，提交前移除 |
| CLI Debugger | `uv run pytest -s --playwright-debug=cli ...` | 终端环境交互定位 | 必须关闭 capture，避免多 worker |

{% note info flat %}
CLI Debugger 是双终端流程，要求 Playwright 1.59+；课程基线 1.62.0 满足：
{% endnote %}

```bash
# 终端 A：pytest 会暂停并打印 tw-xxxxxx 会话名
uv run pytest tests/test_trace.py -s --playwright-debug=cli

# 终端 B：把终端 A 打印的真实会话名粘贴到这里
uv run python -m playwright cli attach tw-xxxxxx
uv run python -m playwright cli -s=tw-xxxxxx snapshot
uv run python -m playwright cli -s=tw-xxxxxx console error
uv run python -m playwright cli -s=tw-xxxxxx resume
```

{% note info flat %}
pytest 继续后，会话随 Context 关闭。若启用输出捕获或 `-n 2`，插件会直接报用法错误，这是为了确保 attach 指令可见且调试目标唯一。
{% endnote %}

{% note warning flat %}
调试并行失败时先用原命令保留证据，再在不启用 xdist 的单 worker 环境复现。CLI Debugger 应使用单一目标，不要一开始就同时改变浏览器、数据和 worker 数量，否则可能把原始条件一起抹掉。
{% endnote %}

## 失败证据

{% note primary flat %}
pytest 插件 0.9.0 的核心开关：
{% endnote %}

```bash
uv run pytest \
  --tracing=retain-on-failure \
  --video=retain-on-failure \
  --screenshot=only-on-failure \
  --output=test-results
```

| 产物 | 最擅长回答 | 主要盲区 | 敏感风险 |
| --- | --- | --- | --- |
| 截图 | 最终画面是什么 | 之前发生了什么 | 页面个人信息 |
| 视频 | 用户可见的时间线 | DOM、请求细节 | 全程画面 |
| 控制台日志 | 前端异常与业务日志 | 元素状态 | Token 被错误打印 |
| Trace | 动作、DOM snapshot、网络、日志与源码 | 外部系统内部状态 | header、body、DOM 数据 |

{% note danger flat %}
全量 `on` 适合短期诊断，不适合长期默认。失败保留策略能降低存储和泄露面，但仍应限制访问与 retention。
{% endnote %}

{% note warning flat %}
`--output` 必须指向可清空的专用产物目录：pytest-playwright 会在 session 开始时清理它。不要把包含手工证据或其他项目文件的目录传给该参数。
{% endnote %}

### Trace Viewer

{% note info flat %}
继续使用前面已经保存的 `tests/test_trace.py`：
{% endnote %}

```bash
uv run pytest tests/test_trace.py --tracing=on
trace_path="$(find test-results -name trace.zip -print -quit)"
test -n "$trace_path"
uv run playwright show-trace "$trace_path"
```

{% note info flat %}
Trace Viewer 建议按顺序检查：
{% endnote %}

{% timeline Trace 收敛顺序, blue %}
<!-- timeline Action -->
确认失败动作、调用日志和等待条件，而不是先看最后一张截图。
<!-- endtimeline -->
<!-- timeline DOM Snapshot -->
查看动作前后 DOM 与可访问状态，判断目标是否存在、被遮挡或仍是旧状态。
<!-- endtimeline -->
<!-- timeline Network -->
检查相关请求是否发出、状态码和响应时序，避免把后端延迟误判为 Locator 问题。
<!-- endtimeline -->
<!-- timeline Console 与 Source -->
关联前端异常和触发测试代码，形成可复现根因。
<!-- endtimeline -->
{% endtimeline %}

{% note warning flat %}
本例中 Action log 会显示断言只等待 100ms，DOM snapshot 仍为“草稿”，而页面脚本明确在 800ms 后更新。修复是使用符合产品 SLA 的断言超时，而不是加入 `sleep(1)`。
{% endnote %}

{% note danger flat %}
Trace 可以本地 `show-trace`，也可以拖入 `trace.playwright.dev`。官方查看器在浏览器内加载文件，但企业环境仍应按数据政策决定是否访问外部域名；敏感 Trace 优先在本机查看。
{% endnote %}

### 诊断记录

```text
现象：订单状态断言在 100ms 超时。
证据：Action log 持续等待“已提交”；DOM snapshot 仍为“草稿”；
      页面脚本在 800ms 更新，网络无失败。
结论：测试超时预算低于产品确定性延迟，不是 Locator 丢失。
修复：断言超时调整到经 SLA 支持的 1500ms；连续运行 20 次通过。
```

## 执行策略

{% note info flat %}
同一套 Playwright Python API 可以驱动 Chromium、Firefox 和 WebKit，但三个引擎需要分别安装：
{% endnote %}

```bash
uv run playwright install chromium firefox webkit
uv run playwright install --list
```

{% note info flat %}
先串行运行每个引擎：
{% endnote %}

```bash
uv run pytest --browser chromium
uv run pytest --browser firefox
uv run pytest --browser webkit
```

{% note info flat %}
也可以在一个 pytest 进程中重复传入参数：
{% endnote %}

```bash
uv run pytest \
  --browser chromium \
  --browser firefox \
  --browser webkit
```

{% note warning flat %}
浏览器矩阵的目标是发现渲染、事件、权限和浏览器实现差异，不是简单把执行次数乘三。先确保 Chromium 主线稳定，再加入 Firefox 与 WebKit，失败时分别记录浏览器和操作系统。
{% endnote %}

### 并行执行

{% note info flat %}
`pytest-xdist` 通过多个 worker 进程并行分发用例：
{% endnote %}

```bash
uv add --dev pytest-xdist
uv run pytest --browser chromium -n auto
```

{% note info flat %}
worker 不共享 Python 内存。Session Fixture 是“每个 worker 执行一次”，不是整台机器只执行一次。
{% endnote %}

{% mermaid %}
flowchart TD
    J[Chromium CI Job] --> W0[worker gw0]
    J --> W1[worker gw1]
    W0 --> N0[namespace e2e-gw0]
    W1 --> N1[namespace e2e-gw1]
    N0 --> D[(测试数据库)]
    N1 --> D
{% endmermaid %}

{% note info flat %}
为每个 worker 分配唯一数据命名空间：
{% endnote %}

```python
from uuid import uuid4

import pytest


@pytest.fixture(scope="session")
def run_namespace(worker_id: str) -> str:
    return f"e2e-{worker_id}-{uuid4().hex[:8]}"


@pytest.fixture
def order_number(run_namespace: str, request: pytest.FixtureRequest) -> str:
    return f"{run_namespace}-{request.node.name}"
```

{% note primary flat %}
并发失败时用同一 node id 回到串行：
{% endnote %}

```bash
uv run pytest tests/e2e/test_checkout.py::test_submit_order \
  --browser chromium \
  -n 0 \
  -vv
```

{% note warning flat %}
串行通过、多 worker 失败时，优先检查共享账号、固定订单号、端口、下载文件名和清理时机。不要立即用重试掩盖资源冲突。
{% endnote %}

## 持续交付

{% note info flat %}
浏览器适合拆成 CI Job，worker 负责每个 Job 内的并行。`pytest-playwright` 没有 Node.js Playwright Test 的 `--shard` 参数；Python 项目使用目录、marker、CI 矩阵或其他 pytest 分组工具。
{% endnote %}

```yaml
# .github/workflows/e2e.yml
name: e2e

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  browser-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - uses: astral-sh/setup-uv@v6
        with:
          enable-cache: true

      - name: Install dependencies
        run: uv sync --locked

      - name: Install browser
        run: uv run playwright install --with-deps ${{ matrix.browser }}

      - name: Run tests
        run: >-
          uv run pytest tests/e2e
          --browser ${{ matrix.browser }}
          -n auto
          --tracing retain-on-failure
          --screenshot only-on-failure
          --junitxml test-results/junit-${{ matrix.browser }}.xml

      - name: Upload JUnit
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@v4
        with:
          name: junit-${{ matrix.browser }}-${{ github.run_id }}
          retention-days: 7
          path: test-results/*.xml

      - name: Upload failure evidence
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: failure-${{ matrix.browser }}-${{ github.run_id }}
          retention-days: 7
          path: |
            test-results/**/trace.zip
            test-results/**/*.png
```

{% note danger flat %}
示例使用最小 `contents: read` 权限和产物白名单。不要上传整个工作区；`storage_state`、HAR、下载文件、环境变量文件和未脱敏日志都可能包含敏感数据。
{% endnote %}

### 重试与报告

{% note warning flat %}
pytest 核心和 `pytest-playwright` 不提供通用重试。需要吸收已知环境抖动时可评估 `pytest-rerunfailures`，但必须保留首次失败证据并限制次数：
{% endnote %}

```bash
uv add --dev pytest-rerunfailures
uv run pytest \
  --reruns 1 \
  --reruns-delay 1 \
  --rerun-show-tracebacks \
  --fail-on-flaky
```

{% note info flat %}
将支持这些参数的插件版本锁入 `uv.lock`。`--rerun-show-tracebacks` 保留早期失败线索，`--fail-on-flaky` 让“首次失败、重跑通过”的用例仍以失败退出，避免 CI 假绿。
{% endnote %}

{% note warning flat %}
以下情况不能用重试结案：
{% endnote %}

- 同一断言稳定失败；
- 仅并行时失败，疑似资源冲突；
- 支付、权限或数据一致性失败；
- 首次失败证据会被重跑覆盖；
- 失败概率持续上升。

{% note warning flat %}
JUnit 适合 CI 汇总；需要人类可读 HTML 时可以接入 pytest 生态报告插件。报告只负责呈现结果，不应改变进程退出码，也不能把 rerun 后的通过伪装成从未失败。
{% endnote %}

## 接口边界

{% note info flat %}
以下索引按 Playwright Python 1.62.0 的同步 API 归类，方便在具体场景中选择对象、成员和参数；它是查询表，不替代前文的机制、示例与失败边界。异步 API 只在实际执行 I/O 时使用 await。
{% endnote %}

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 主线成员 | 常用成员 | 扩展成员与参数 | 替代写法 |
| --- | --- | --- | --- | --- |
| `BrowserContext` | — | — | `expect_console_message()`、`expect_event()`、`tracing`、`wait_for_event()` | — |
| `ConsoleMessage` | — | — | `args`、`location`、`page`、`text`、`timestamp`、`type`、`worker` | — |
| `Page` | — | — | `expect_console_message()`、`expect_event()`、`pause()`、`screenshot()`、`video`、`wait_for_event()`、`workers` | — |
| `Tracing` | — | — | `group()`、`group_end()`、`start()`、`start_chunk()`、`start_har()`、`stop()`、`stop_chunk()`、`stop_har()` | — |
| `Video` | — | — | `delete()`、`path()`、`save_as()` | — |
| `WebError` | — | — | `error`、`location`、`page` | — |
| `BrowserContext.expect_console_message` 参数 | — | — | `predicate`, `timeout` | — |
| `BrowserContext.expect_event` 参数 | — | — | `event`, `predicate`, `timeout` | — |
| `BrowserContext.wait_for_event` 参数 | — | — | `event`, `predicate`, `timeout` | — |
| `Page.expect_console_message` 参数 | — | — | `predicate`, `timeout` | — |
| `Page.expect_event` 参数 | — | — | `event`, `predicate`, `timeout` | — |
| `Page.screenshot` 参数 | — | — | `animations`, `caret`, `clip`, `full_page`, `mask`, `mask_color`, `omit_background`, `path`, `quality`, `scale`, `style`, `timeout`, `type` | — |
| `Page.wait_for_event` 参数 | — | — | `event`, `predicate`, `timeout` | — |
| `Tracing.group` 参数 | — | — | `location`, `name` | — |
| `Tracing.start` 参数 | — | — | `live`, `name`, `screenshots`, `snapshots`, `sources`, `title` | — |
| `Tracing.start_chunk` 参数 | — | — | `name`, `title` | — |
| `Tracing.start_har` 参数 | — | — | `content`, `mode`, `path`, `url_filter` | — |
| `Tracing.stop` 参数 | — | — | `path` | — |
| `Tracing.stop_chunk` 参数 | — | — | `path` | — |
| `Video.save_as` 参数 | — | — | `path` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-trace-purpose deck:"Playwright" priority:2 tags:"TraceViewer,调试" %}
--- question
Trace Viewer 最适合回答什么问题？
--- answer
测试执行了什么，以及浏览器在每一步观察到什么。
--- explanation
Trace 将 Action、DOM 快照、网络、Console 和源码关联起来，适合重建失败因果；业务正确仍需明确断言和需求合同。

Trace 的价值在于把动作和观察结果放到同一时间线上：

| 材料 | 回答什么 |
| --- | --- |
| Action | 测试当时执行了什么 |
| DOM 快照 | 页面在该步呈现什么 |
| Network/Console | 依赖和浏览器报告了什么 |
| Source | 具体代码路径 |
{% endflashcard %}

{% flashcard choice id:playwright-xdist-session deck:"Playwright" priority:3 tags:"pytest-xdist,并行" answer:B %}
--- question
启用 pytest-xdist 后，Session 级 Fixture 通常执行多少次？
- [A] 整台机器只执行一次
- [B] 每个 worker 各执行一次
- [C] 每条测试执行一次
--- answer
B
--- explanation
xdist worker 是独立进程，各自拥有 Session 生命周期，因此共享外部资源仍需唯一命名、锁或专用隔离。

xdist 改变的是进程边界：

~~~text
主进程
  ├─ worker 1：Session Fixture 一次
  └─ worker 2：Session Fixture 一次
~~~

因此 Session 不是整台机器唯一执行一次；共享外部资源需要按 worker 命名、加锁，或使用独立隔离环境。
{% endflashcard %}

## 参考资料

### 调试工具

{% linkgroup %}
{% link Test Generator, https://playwright.dev/python/docs/codegen, https://playwright.dev/img/playwright-logo.svg %}
{% link Debugging Tests, https://playwright.dev/python/docs/debug, https://playwright.dev/img/playwright-logo.svg %}
{% link Trace Viewer, https://playwright.dev/python/docs/trace-viewer, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

### 测试运行

{% linkgroup %}
{% link pytest-playwright Reference, https://playwright.dev/python/docs/test-runners, https://playwright.dev/img/playwright-logo.svg %}
{% link pytest-xdist, https://pytest-xdist.readthedocs.io/, https://pytest-xdist.readthedocs.io/favicon.ico %}
{% endlinkgroup %}

### CI 与报告

{% linkgroup %}
{% link Playwright CI, https://playwright.dev/python/docs/ci, https://playwright.dev/img/playwright-logo.svg %}
{% link pytest JUnit XML, https://docs.pytest.org/en/stable/how-to/output.html#creating-junitxml-format-files, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

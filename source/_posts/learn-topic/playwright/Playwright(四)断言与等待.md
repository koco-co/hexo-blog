---
title: Playwright(四)断言与等待
tags:
  - Playwright
  - Web-first断言
  - 自动等待
  - Actionability
categories:
  - Learn Topic
  - Playwright
description: 理解 Actionability、自动等待和 Web-first 断言的职责，掌握页面状态、列表、URL 与响应结果的验证方式，并建立清晰的超时和失败诊断策略。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 4
published: true
abbrlink: 70bae600
date: 2026-08-24 12:09:00
---

{% course_series %}

{% note info flat %}
稳定测试不等于增加等待时间。Playwright 将等待分成两类：操作前等待元素可操作，断言时等待业务结果成立。理解两者的边界，才能知道超时发生在哪一步。
{% endnote %}

## 等待模型

一次典型交互包含三个阶段：

{% mermaid %}
flowchart TD
    A[定位目标] --> B[等待可操作]
    B --> C[执行动作]
    C --> D[等待业务结果]
    D --> E[断言通过或超时]
{% endmermaid %}

{% note info flat %}
`locator.click()` 会等待按钮可见、稳定、能够接收事件且启用，然后执行点击。它不知道点击后应该出现成功提示、跳转到订单页还是更新金额，所以业务结果必须由测试断言。
{% endnote %}

```python
submit = page.get_by_role("button", name="提交订单")
submit.click()
expect(page.get_by_role("status")).to_have_text("订单创建成功")
```

{% tip error %}
如果第一行点击超时，检查目标是否可操作；如果最后一行超时，检查业务结果为何没有成立。不要把两类问题统一归因于“页面太慢”。
{% endtip %}

### Actionability

不同操作会执行不同检查，常见检查包括：

| 检查 | 含义 |
| --- | --- |
| Visible | 元素具有可见边界且未隐藏 |
| Stable | 元素位置不再持续变化 |
| Receives Events | 点击位置没有被其他元素遮挡 |
| Enabled | 控件未禁用 |
| Editable | 输入控件允许编辑 |

例如：

```python
page.get_by_label("客户名称").fill("Alice")
page.get_by_role("button", name="提交订单").click()
```

{% note info flat %}
`fill()` 会等待输入框可见、启用且可编辑；`click()` 会额外关注稳定性和事件接收。如果浮层遮住按钮，强制点击可能让测试“通过动作”却偏离真实用户行为。
{% endnote %}

```python
# 只在明确验证特殊底层行为时使用，不能作为常规修复
button.click(force=True)
```

{% note info flat %}
优先找出遮挡、动画、禁用状态或定位歧义的原因。
{% endnote %}

## 断言设计

Playwright 断言会持续重新查询 Locator，直到条件成立或超时：

```python
from playwright.sync_api import Page, expect


def test_order_status(page: Page) -> None:
    page.set_content("""
        <button>提交订单</button>
        <p role="status">待提交</p>
        <script>
          document.querySelector('button').onclick = () => {
            setTimeout(() => {
              document.querySelector('[role=status]').textContent = '提交成功';
            }, 300);
          };
        </script>
    """)

    page.get_by_role("button", name="提交订单").click()
    expect(page.get_by_role("status")).to_have_text("提交成功")
```

{% tip ban %}
不要先读取一次文本再用普通 `assert` 等待动态结果：
{% endtip %}

```python
# 只读取一次，页面稍后更新也不会重新检查
assert page.get_by_role("status").text_content() == "提交成功"
```

{% note info flat %}
普通 `assert` 适合纯 Python 值和已经稳定的同步计算；页面异步状态优先使用 `expect()`。
{% endnote %}

### 可见性实例

`to_be_visible()` 会重新查询 Locator，并等待元素满足可见条件；它不是对一次性 `is_visible()` 结果的包装：

```python
from playwright.sync_api import Page, expect


def test_report_ready(page: Page) -> None:
    page.set_content("""
        <button id="load">加载报告</button>
        <section id="report" hidden>报告已生成</section>
        <script>
          document.querySelector('#load').onclick = () => {
            setTimeout(() => document.querySelector('#report').hidden = false, 200);
          };
        </script>
    """)

    page.get_by_role("button", name="加载报告").click()
    report = page.locator("#report")
    expect(report).to_be_visible(timeout=5_000)
    expect(report).to_have_text("报告已生成")
```

{% tip error %}
如果元素从未挂载、被 `display:none`/`hidden` 隐藏、尺寸为零或被页面状态阻止，断言会在超时后失败；这时要查看 DOM 快照和业务状态，而不是把 `timeout` 无条件放大。
{% endtip %}

### 断言类型

#### 可见与状态

```python
expect(locator).to_be_visible()
expect(locator).to_be_hidden()
expect(button).to_be_enabled()
expect(button).to_be_disabled()
expect(input_box).to_be_editable()
expect(checkbox).to_be_checked()
expect(locator).to_be_focused()
```

{% note info flat %}
`to_be_hidden()` 可以在元素不存在或不可见时通过。如果业务要求元素仍在 DOM 中但隐藏，应增加相应状态或属性断言。
{% endnote %}

#### 文本与属性

```python
import re

expect(status).to_have_text("支付成功")
expect(status).to_contain_text("成功")
expect(order_id).to_have_text(re.compile(r"A-\d{4}"))
expect(link).to_have_attribute("href", "/orders/A-100")
expect(total).to_have_class(re.compile(r"\bhighlight\b"))
expect(input_box).to_have_value("Alice")
```

{% note info flat %}
`to_have_text()` 更适合完整文本合同，`to_contain_text()` 适合只关心稳定片段。不要为了绕过错误文案而把所有断言都改成模糊包含。
{% endnote %}

#### 列表与数量

```python
orders = page.get_by_role("listitem")

expect(orders).to_have_count(3)
expect(orders).to_have_text([
    "A-100 待支付",
    "A-101 已支付",
    "A-102 已取消",
])
```

{% note info flat %}
列表断言先等待集合达到预期，再比较内容，避免在动态加载中立即遍历当前快照。
{% endnote %}

#### 页面与 URL

```python
expect(page).to_have_title("订单详情 - ShopLab")
expect(page).to_have_url("https://shop.example/orders/A-100")
expect(page).to_have_url(re.compile(r"/orders/A-\d+$"))
```

{% tip warning %}
URL 是导航结果，不要只断言点击没有报错。对于客户端路由，`to_have_url()` 同样会等待地址变化。
{% endtip %}

完整导航断言应在触发导航后验证最终地址，并为动态片段使用正则或 glob：

```python
import re

page.get_by_role("link", name="订单 A-100").click()
expect(page).to_have_url(re.compile(r"/orders/A-100(?:\?.*)?$") )
expect(page.get_by_role("heading", name="订单详情")).to_be_visible()
```

{% tip warning %}
如果点击没有导航而只是更新组件，`to_have_url()` 不应作为替代品；此时断言组件状态。反向断言 `not_to_have_url()` 也会等待“不匹配”成立，仍需给出明确的业务边界。
{% endtip %}

### 超时配置

超时应按职责设置：

```python
from playwright.sync_api import expect

# 全局断言超时，单位毫秒
expect.set_options(timeout=10_000)
```

单次断言可以覆盖：

```python
expect(report).to_be_visible(timeout=30_000)
```

操作超时和导航超时由 Context 或 Page 配置：

```python
page.set_default_timeout(10_000)
page.set_default_navigation_timeout(30_000)
```

建议区分：

- 普通定位与交互：较短默认超时；
- 已知慢操作：在该断言上局部提高；
- 导航和报告生成：使用独立超时；
- 测试整体：由 pytest 或 CI 设置更外层上限。

{% note info flat %}
全局把超时改成一分钟会拖慢真正失败，也掩盖性能退化。局部慢操作必须有业务理由。
{% endnote %}

## 等待边界

{% note info flat %}
大多数场景不需要先 `wait_for_selector()`。Locator 操作和断言已经具备等待能力：
{% endnote %}

```python
# 推荐
expect(page.get_by_role("status")).to_have_text("完成")
```

{% note info flat %}
显式等待适合事件边界或非断言流程：
{% endnote %}

```python
page.get_by_role("dialog").wait_for(state="visible")
page.wait_for_url("**/orders/*")
```

异步 API 只改变调用模型，不改变等待语义：

```python
from playwright.async_api import Page


async def wait_for_legacy_boundary(page: Page) -> None:
    await page.wait_for_selector("[role=dialog]", state="visible")
    await page.wait_for_timeout(100)  # 仅诊断或演示，生产测试优先 expect()
```

{% note info flat %}
`wait_for_selector()` 与 `wait_for_timeout()` 已列入旧接口迁移清单；新代码优先使用 `expect()`、Locator 的 `wait_for()` 或事件上下文。
{% endnote %}

{% tip warning %}
导航不要默认依赖 `networkidle`。现代页面可能持续保持统计、轮询或推送连接，“网络空闲”不等于业务就绪。优先等待用户可观察的页面状态：
{% endtip %}

```python
page.goto("https://example.com/orders")
expect(page.get_by_role("heading", name="订单列表")).to_be_visible()
```

固定等待只允许短期诊断动画或演示：

```python
page.wait_for_timeout(1_000)  # 不作为稳定测试方案
```

### 事件等待

下载、新页面和响应等事件必须先注册等待，再触发动作：

```python
with page.expect_response(lambda response: "/api/orders" in response.url) as info:
    page.get_by_role("button", name="提交订单").click()

response = info.value
assert response.ok
```

{% note info flat %}
如果先点击再监听，快速事件可能已经结束。第六篇会把这一模式用于弹窗和文件，第九篇会进一步处理网络请求。
{% endnote %}

## 失败处理

负向断言需要明确业务含义：

```python
expect(page.get_by_text("支付失败")).not_to_be_visible()
```

{% note info flat %}
这可能因为元素根本不存在而通过。如果要求错误容器存在但为空，应写成：
{% endnote %}

```python
errors = page.get_by_role("alert")
expect(errors).to_be_attached()
expect(errors).to_be_empty()
```

{% note info flat %}
“没有看到错误”与“业务成功”也不是同一个结论。提交订单后应直接断言成功状态、订单号或后端结果。
{% endnote %}

### 软断言

需要一次收集多个独立展示问题时，可以使用软断言：

```python
from playwright.sync_api import expect

expect.soft(page.get_by_test_id("order-total")).to_have_text("¥199.00")
expect.soft(page.get_by_test_id("shipping-fee")).to_have_text("¥0.00")
expect.soft(page.get_by_test_id("discount")).to_have_text("-¥20.00")
```

{% note info flat %}
软断言会记录失败并继续执行，最终仍使测试失败。它适合相互独立的展示字段，不适合关键前置条件：登录失败后继续点击结算只会制造连锁噪声。
{% endnote %}

{% note info flat %}
`expect.soft(actual, message=None)` 的第二个参数只是失败说明，不会改变断言条件。同步和异步写法分别如下：
{% endnote %}

```python
# sync_api
expect.soft(total, "订单总额").to_have_text("¥199.00")
```

```python
# async_api
from playwright.async_api import expect

await expect.soft(total, "订单总额").to_have_text("¥199.00")
```

{% note info flat %}
`expect.set_options(timeout=...)` 只设置后续断言的默认超时；单次断言传入的 `timeout` 优先级更高。当前 `pytest-playwright`/`pytest-playwright-asyncio` 软断言集成要求 0.7.3 及以上；本课程冻结基线为 0.9.0。旧锁文件不支持时应升级并重新验证，而不是改用普通 `assert` 假装等价。
{% endnote %}

### 断言扩展

基础断言覆盖可见性、文本、数量、URL 和表单状态；只有在明确质量目标时才进入以下扩展组：

| 扩展组 | 代表 API | 进入条件 |
| --- | --- | --- |
| 可访问性语义 | `to_have_role()`、`to_have_accessible_name()`、`to_have_accessible_description()` | 组件有明确 ARIA 合同，需验证语义而非视觉文案 |
| 样式与几何 | `to_have_css()`、`to_be_in_viewport()` | 视觉或布局缺陷是本用例目标，且已有稳定基线 |
| JavaScript 状态 | `to_have_js_property()` | 业务状态只能通过 DOM 属性表达，避免把内部实现当主合同 |
| ARIA 快照 | `to_match_aria_snapshot()` | 需要冻结组件可访问树，变更需评审快照差异 |
| 负向断言 | 各类 `not_to_*()` | 先定义“不成立”的业务边界，确认元素不存在与隐藏不是同一含义 |

{% tip info %}
这些 API 的完整方法和参数保留在本篇 API 索引中；正文只展开进入条件、等待语义和失败诊断，避免把长尾方法误当成主线流程。
{% endtip %}

文本断言的三个常用参数有不同职责：

```python
# ignore_case 只放宽大小写，不放宽其他文本差异
expect(status).to_have_text("支付成功", ignore_case=True)

# use_inner_text 读取浏览器计算后的可见文本；默认更接近 textContent
expect(summary).to_contain_text("总计", use_inner_text=True)
```

{% note info flat %}
`ignore_case` 适合大小写不属于业务合同的界面；如果使用正则，正则自身的 flags 仍应保持清晰。`use_inner_text` 会受到布局、可见性和换行影响，只在产品合同明确关注用户看到的文本时使用；否则保留默认读取方式。`message`（包括 `expect.soft` 的第二个参数）只补充失败上下文，不是预期值，也不会改变重试条件。
{% endnote %}

低频等待和状态探针按能力组进入：

| 能力组 | 代表 API | 进入条件与边界 |
| --- | --- | --- |
| 即时状态探针 | `is_visible()`、`is_enabled()`、`is_editable()` 等 | 只读取当前瞬间状态并用于分支或诊断；要等待结果仍用 `expect()` |
| 非断言 Locator 等待 | `locator.wait_for()`、`locator.wait_for_function()` | 需要让后续流程等待附着/可见或自定义条件，但没有可表达的断言时使用；优先先寻找可观察业务信号 |
| 页面级等待 | `wait_for_load_state()`、`wait_for_url()` | 等待导航或 URL 边界；不能把 `networkidle` 当作业务就绪 |
| ARIA 快照 | `to_match_aria_snapshot()` 及负向版本 | 组件可访问树是明确合同时使用；快照变更需要评审，不用于普通文本验证 |

### 失败分析

断言超时时按顺序检查：

1. Locator 是否命中正确且唯一的目标；
2. 操作是否真正完成；
3. 预期状态是否属于用户可观察结果；
4. 页面是否出现错误提示、重定向或遮挡；
5. 超时是否符合该业务操作的正常时间；
6. Trace 中 DOM 快照和网络响应是否支持判断。

{% tip ban %}
不要第一时间增加等待时间。先确认失败属于定位、可操作性、业务结果还是环境依赖。
{% endtip %}

## 接口边界

{% tip info %}
下面的索引用于查漏和选型；主线能力仍以本篇前文的机制、示例和失败边界为准。方法名和公开签名参数按 Playwright Python 1.62.0 的同步 API 归类，异步 API 的对应关系在第二篇统一说明；参数行是完整索引，不等于逐项教程。
{% endtip %}

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 核心详解 | 正文简述 | 进阶路线 | 弃用迁移 |
| --- | --- | --- | --- | --- |
| `Locator` | — | — | `is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`scroll_into_view_if_needed()`、`wait_for()`、`wait_for_function()` | — |
| `LocatorAssertions` | `to_be_visible()`、`to_have_text()` | — | `not_to_be_attached()`、`not_to_be_checked()`、`not_to_be_disabled()`、`not_to_be_editable()`、`not_to_be_empty()`、`not_to_be_enabled()`、`not_to_be_focused()`、`not_to_be_hidden()`、`not_to_be_in_viewport()`、`not_to_be_visible()`、`not_to_contain_class()`、`not_to_contain_text()`、`not_to_have_accessible_description()`、`not_to_have_accessible_error_message()`、`not_to_have_accessible_name()`、`not_to_have_attribute()`、`not_to_have_class()`、`not_to_have_count()`、`not_to_have_css()`、`not_to_have_id()`、`not_to_have_js_property()`、`not_to_have_role()`、`not_to_have_text()`、`not_to_have_value()`、`not_to_have_values()`、`not_to_match_aria_snapshot()`、`to_be_attached()`、`to_be_checked()`、`to_be_disabled()`、`to_be_editable()`、`to_be_empty()`、`to_be_enabled()`、`to_be_focused()`、`to_be_hidden()`、`to_be_in_viewport()`、`to_contain_class()`、`to_contain_text()`、`to_have_accessible_description()`、`to_have_accessible_error_message()`、`to_have_accessible_name()`、`to_have_attribute()`、`to_have_class()`、`to_have_count()`、`to_have_css()`、`to_have_id()`、`to_have_js_property()`、`to_have_role()`、`to_have_value()`、`to_have_values()`、`to_match_aria_snapshot()` | — |
| `Page` | — | — | `wait_for_function()`、`wait_for_load_state()`、`wait_for_url()` | `wait_for_selector()`、`wait_for_timeout()` |
| `PageAssertions` | `to_have_url()` | — | `not_to_have_title()`、`not_to_have_url()`、`not_to_match_aria_snapshot()`、`to_have_title()`、`to_match_aria_snapshot()` | — |
| `Expect.set_options` 参数 | — | `timeout` | — | — |
| `Expect.soft` 参数 | — | `message` | `actual` | — |
| `Locator.is_checked` 参数 | — | — | `timeout` | — |
| `Locator.is_disabled` 参数 | — | — | `timeout` | — |
| `Locator.is_editable` 参数 | — | — | `timeout` | — |
| `Locator.is_enabled` 参数 | — | — | `timeout` | — |
| `Locator.is_hidden` 参数 | — | — | `timeout` | — |
| `Locator.is_visible` 参数 | — | — | `timeout` | — |
| `Locator.scroll_into_view_if_needed` 参数 | — | — | `timeout` | — |
| `Locator.wait_for` 参数 | — | — | `state`, `timeout` | — |
| `Locator.wait_for_function` 参数 | — | — | `arg`, `expression`, `timeout` | — |
| `LocatorAssertions.not_to_be_attached` 参数 | — | `timeout` | `attached` | — |
| `LocatorAssertions.not_to_be_checked` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.not_to_be_disabled` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.not_to_be_editable` 参数 | — | `timeout` | `editable` | — |
| `LocatorAssertions.not_to_be_empty` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.not_to_be_enabled` 参数 | — | `timeout` | `enabled` | — |
| `LocatorAssertions.not_to_be_focused` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.not_to_be_hidden` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.not_to_be_in_viewport` 参数 | — | `timeout` | `ratio` | — |
| `LocatorAssertions.not_to_be_visible` 参数 | — | `timeout` | `visible` | — |
| `LocatorAssertions.not_to_contain_class` 参数 | — | `timeout` | `expected` | — |
| `LocatorAssertions.not_to_contain_text` 参数 | — | `ignore_case`, `timeout`, `use_inner_text` | `expected` | — |
| `LocatorAssertions.not_to_have_accessible_description` 参数 | — | `ignore_case`, `timeout` | `name` | — |
| `LocatorAssertions.not_to_have_accessible_error_message` 参数 | — | `ignore_case`, `timeout` | `error_message` | — |
| `LocatorAssertions.not_to_have_accessible_name` 参数 | — | `ignore_case`, `timeout` | `name` | — |
| `LocatorAssertions.not_to_have_attribute` 参数 | — | `ignore_case`, `timeout` | `name`, `value` | — |
| `LocatorAssertions.not_to_have_class` 参数 | — | `timeout` | `expected` | — |
| `LocatorAssertions.not_to_have_count` 参数 | — | `timeout` | `count` | — |
| `LocatorAssertions.not_to_have_css` 参数 | — | `timeout` | `name`, `value` | — |
| `LocatorAssertions.not_to_have_id` 参数 | — | `timeout` | `id` | — |
| `LocatorAssertions.not_to_have_js_property` 参数 | — | `timeout` | `name`, `value` | — |
| `LocatorAssertions.not_to_have_role` 参数 | — | `timeout` | `role` | — |
| `LocatorAssertions.not_to_have_text` 参数 | — | `ignore_case`, `timeout`, `use_inner_text` | `expected` | — |
| `LocatorAssertions.not_to_have_value` 参数 | — | `timeout` | `value` | — |
| `LocatorAssertions.not_to_have_values` 参数 | — | `timeout` | `values` | — |
| `LocatorAssertions.not_to_match_aria_snapshot` 参数 | — | `timeout` | `expected` | — |
| `LocatorAssertions.to_be_attached` 参数 | — | `timeout` | `attached` | — |
| `LocatorAssertions.to_be_checked` 参数 | — | `timeout` | `checked`, `indeterminate` | — |
| `LocatorAssertions.to_be_disabled` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.to_be_editable` 参数 | — | `timeout` | `editable` | — |
| `LocatorAssertions.to_be_empty` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.to_be_enabled` 参数 | — | `timeout` | `enabled` | — |
| `LocatorAssertions.to_be_focused` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.to_be_hidden` 参数 | — | `timeout` | — | — |
| `LocatorAssertions.to_be_in_viewport` 参数 | — | `timeout` | `ratio` | — |
| `LocatorAssertions.to_be_visible` 参数 | — | `timeout` | `visible` | — |
| `LocatorAssertions.to_contain_class` 参数 | — | `timeout` | `expected` | — |
| `LocatorAssertions.to_contain_text` 参数 | — | `ignore_case`, `timeout`, `use_inner_text` | `expected` | — |
| `LocatorAssertions.to_have_accessible_description` 参数 | — | `ignore_case`, `timeout` | `description` | — |
| `LocatorAssertions.to_have_accessible_error_message` 参数 | — | `ignore_case`, `timeout` | `error_message` | — |
| `LocatorAssertions.to_have_accessible_name` 参数 | — | `ignore_case`, `timeout` | `name` | — |
| `LocatorAssertions.to_have_attribute` 参数 | — | `ignore_case`, `timeout` | `name`, `value` | — |
| `LocatorAssertions.to_have_class` 参数 | — | `timeout` | `expected` | — |
| `LocatorAssertions.to_have_count` 参数 | — | `timeout` | `count` | — |
| `LocatorAssertions.to_have_css` 参数 | — | `timeout` | `name`, `pseudo`, `value` | — |
| `LocatorAssertions.to_have_id` 参数 | — | `timeout` | `id` | — |
| `LocatorAssertions.to_have_js_property` 参数 | — | `timeout` | `name`, `value` | — |
| `LocatorAssertions.to_have_role` 参数 | — | `timeout` | `role` | — |
| `LocatorAssertions.to_have_text` 参数 | — | `ignore_case`, `timeout`, `use_inner_text` | `expected` | — |
| `LocatorAssertions.to_have_value` 参数 | — | `timeout` | `value` | — |
| `LocatorAssertions.to_have_values` 参数 | — | `timeout` | `values` | — |
| `LocatorAssertions.to_match_aria_snapshot` 参数 | — | `timeout` | `expected` | — |
| `Page.wait_for_function` 参数 | — | — | `arg`, `expression`, `polling`, `timeout` | — |
| `Page.wait_for_load_state` 参数 | — | — | `state`, `timeout` | — |
| `Page.wait_for_selector` 参数 | — | — | — | `selector`, `state`, `strict`, `timeout` |
| `Page.wait_for_timeout` 参数 | — | — | — | `timeout` |
| `Page.wait_for_url` 参数 | — | — | `timeout`, `url`, `wait_until` | — |
| `PageAssertions.not_to_have_title` 参数 | — | `timeout` | `title_or_reg_exp` | — |
| `PageAssertions.not_to_have_url` 参数 | — | `ignore_case`, `timeout` | `url_or_reg_exp` | — |
| `PageAssertions.not_to_match_aria_snapshot` 参数 | — | `timeout` | `expected` | — |
| `PageAssertions.to_have_title` 参数 | — | `timeout` | `title_or_reg_exp` | — |
| `PageAssertions.to_have_url` 参数 | — | `ignore_case`, `timeout` | `url_or_reg_exp` | — |
| `PageAssertions.to_match_aria_snapshot` 参数 | — | `timeout` | `expected` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-wait-boundary deck:"Playwright" priority:2 tags:"自动等待,断言" %}
--- question
为什么 `click()` 成功后仍然需要断言？
--- answer
自动等待只保证动作可执行，不保证业务结果正确。
--- explanation
点击会等待元素可操作并发送输入事件；成功提示、URL、订单状态或后端数据属于动作后的业务结果，需要单独使用 Web-first 断言或 API 核验。
{% endflashcard %}

{% flashcard choice id:playwright-wait-strategy deck:"Playwright" priority:2 tags:"等待,稳定性" answer:C %}
--- question
提交后状态会异步变成“完成”，哪种等待方式最合适？
- [A] 固定等待五秒
- [B] 等待全站网络空闲
- [C] 使用 `expect(status).to_have_text("完成")`
--- answer
C
--- explanation
Web-first 断言直接等待业务可观察结果，并在条件提前成立时立即结束。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Playwright Auto-waiting, https://playwright.dev/python/docs/actionability, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Assertions, https://playwright.dev/python/docs/test-assertions, https://playwright.dev/img/playwright-logo.svg %}
{% link Locator Assertions API, https://playwright.dev/python/docs/api/class-locatorassertions, https://playwright.dev/img/playwright-logo.svg %}
{% link Navigations, https://playwright.dev/python/docs/navigations, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

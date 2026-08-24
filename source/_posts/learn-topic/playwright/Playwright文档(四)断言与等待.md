---
title: Playwright文档(四) 断言与等待
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

稳定测试不等于增加等待时间。Playwright 将等待分成两类：操作前等待元素可操作，断言时等待业务结果成立。理解两者的边界，才能知道超时发生在哪一步。

## 等待模型

一次典型交互包含三个阶段：

{% mermaid %}
flowchart TD
    A[定位目标] --> B[等待可操作]
    B --> C[执行动作]
    C --> D[等待业务结果]
    D --> E[断言通过或超时]
{% endmermaid %}

`locator.click()` 会等待按钮可见、稳定、能够接收事件且启用，然后执行点击。它不知道点击后应该出现成功提示、跳转到订单页还是更新金额，所以业务结果必须由测试断言。

```python
submit = page.get_by_role("button", name="提交订单")
submit.click()
expect(page.get_by_role("status")).to_have_text("订单创建成功")
```

如果第一行点击超时，检查目标是否可操作；如果最后一行超时，检查业务结果为何没有成立。不要把两类问题统一归因于“页面太慢”。

## Actionability

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

`fill()` 会等待输入框可见、启用且可编辑；`click()` 会额外关注稳定性和事件接收。如果浮层遮住按钮，强制点击可能让测试“通过动作”却偏离真实用户行为。

```python
# 只在明确验证特殊底层行为时使用，不能作为常规修复
button.click(force=True)
```

优先找出遮挡、动画、禁用状态或定位歧义的原因。

## Web-first 断言

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

不要先读取一次文本再用普通 `assert` 等待动态结果：

```python
# 只读取一次，页面稍后更新也不会重新检查
assert page.get_by_role("status").text_content() == "提交成功"
```

普通 `assert` 适合纯 Python 值和已经稳定的同步计算；页面异步状态优先使用 `expect()`。

## 断言类型

### 可见与状态

```python
expect(locator).to_be_visible()
expect(locator).to_be_hidden()
expect(button).to_be_enabled()
expect(button).to_be_disabled()
expect(input_box).to_be_editable()
expect(checkbox).to_be_checked()
expect(locator).to_be_focused()
```

`to_be_hidden()` 可以在元素不存在或不可见时通过。如果业务要求元素仍在 DOM 中但隐藏，应增加相应状态或属性断言。

### 文本与属性

```python
import re

expect(status).to_have_text("支付成功")
expect(status).to_contain_text("成功")
expect(order_id).to_have_text(re.compile(r"A-\d{4}"))
expect(link).to_have_attribute("href", "/orders/A-100")
expect(total).to_have_class(re.compile(r"\bhighlight\b"))
expect(input_box).to_have_value("Alice")
```

`to_have_text()` 更适合完整文本合同，`to_contain_text()` 适合只关心稳定片段。不要为了绕过错误文案而把所有断言都改成模糊包含。

### 列表与数量

```python
orders = page.get_by_role("listitem")

expect(orders).to_have_count(3)
expect(orders).to_have_text([
    "A-100 待支付",
    "A-101 已支付",
    "A-102 已取消",
])
```

列表断言先等待集合达到预期，再比较内容，避免在动态加载中立即遍历当前快照。

### 页面与 URL

```python
expect(page).to_have_title("订单详情 - ShopLab")
expect(page).to_have_url("https://shop.example/orders/A-100")
expect(page).to_have_url(re.compile(r"/orders/A-\d+$"))
```

URL 是导航结果，不要只断言点击没有报错。对于客户端路由，`to_have_url()` 同样会等待地址变化。

## 超时配置

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

全局把超时改成一分钟会拖慢真正失败，也掩盖性能退化。局部慢操作必须有业务理由。

## 显式等待

大多数场景不需要先 `wait_for_selector()`。Locator 操作和断言已经具备等待能力：

```python
# 推荐
expect(page.get_by_role("status")).to_have_text("完成")
```

显式等待适合事件边界或非断言流程：

```python
page.get_by_role("dialog").wait_for(state="visible")
page.wait_for_url("**/orders/*")
```

导航不要默认依赖 `networkidle`。现代页面可能持续保持统计、轮询或推送连接，“网络空闲”不等于业务就绪。优先等待用户可观察的页面状态：

```python
page.goto("https://example.com/orders")
expect(page.get_by_role("heading", name="订单列表")).to_be_visible()
```

固定等待只允许短期诊断动画或演示：

```python
page.wait_for_timeout(1_000)  # 不作为稳定测试方案
```

## 事件等待

下载、新页面和响应等事件必须先注册等待，再触发动作：

```python
with page.expect_response(lambda response: "/api/orders" in response.url) as info:
    page.get_by_role("button", name="提交订单").click()

response = info.value
assert response.ok
```

如果先点击再监听，快速事件可能已经结束。第六篇会把这一模式用于弹窗和文件，第九篇会进一步处理网络请求。

## 负向断言

负向断言需要明确业务含义：

```python
expect(page.get_by_text("支付失败")).not_to_be_visible()
```

这可能因为元素根本不存在而通过。如果要求错误容器存在但为空，应写成：

```python
errors = page.get_by_role("alert")
expect(errors).to_be_attached()
expect(errors).to_be_empty()
```

“没有看到错误”与“业务成功”也不是同一个结论。提交订单后应直接断言成功状态、订单号或后端结果。

## 软断言

需要一次收集多个独立展示问题时，可以使用软断言：

```python
from playwright.sync_api import expect

expect.soft(page.get_by_test_id("order-total")).to_have_text("¥199.00")
expect.soft(page.get_by_test_id("shipping-fee")).to_have_text("¥0.00")
expect.soft(page.get_by_test_id("discount")).to_have_text("-¥20.00")
```

软断言会记录失败并继续执行，最终仍使测试失败。它适合相互独立的展示字段，不适合关键前置条件：登录失败后继续点击结算只会制造连锁噪声。

软断言依赖 `pytest-playwright` 或 `pytest-playwright-asyncio` 0.8.0 及以上；旧锁文件不支持时应升级并重新验证，而不是改用普通 `assert` 假装等价。

## 失败分析

断言超时时按顺序检查：

1. Locator 是否命中正确且唯一的目标；
2. 操作是否真正完成；
3. 预期状态是否属于用户可观察结果；
4. 页面是否出现错误提示、重定向或遮挡；
5. 超时是否符合该业务操作的正常时间；
6. Trace 中 DOM 快照和网络响应是否支持判断。

不要第一时间增加等待时间。先确认失败属于定位、可操作性、业务结果还是环境依赖。

## 常见问题

{% flashcard basic id:playwright-wait-boundary deck:"Playwright" tags:"自动等待,断言" %}
--- question
为什么 `click()` 成功后仍然需要断言？
--- answer
自动等待只保证动作可执行，不保证业务结果正确。
--- explanation
点击会等待元素可操作并发送输入事件；成功提示、URL、订单状态或后端数据属于动作后的业务结果，需要单独使用 Web-first 断言或 API 核验。
{% endflashcard %}

{% flashcard choice id:playwright-wait-strategy deck:"Playwright" tags:"等待,稳定性" answer:C %}
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

- [Playwright Auto-waiting](https://playwright.dev/python/docs/actionability)
- [Playwright Assertions](https://playwright.dev/python/docs/test-assertions)
- [Locator Assertions API](https://playwright.dev/python/docs/api/class-locatorassertions)
- [Navigations](https://playwright.dev/python/docs/navigations)

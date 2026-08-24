---
title: Playwright文档(三) 页面元素定位
tags:
  - Playwright
  - Locator
  - ARIA
  - 测试定位
categories:
  - Learn Topic
  - Playwright
description: 从用户可感知语义出发掌握 Locator 优先级、严格模式、过滤与链式定位，并在动态列表、重复组件和测试契约中建立稳定的元素定位策略。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 3
published: true
abbrlink: d5972197
date: 2026-08-24 12:10:00
---

{% course_series %}

定位规则决定测试如何理解页面。稳定的 Locator 应表达“用户正在操作哪个控件”，而不是“元素当前位于第几个 div”。本篇先建立定位优先级，再处理重复元素和动态页面；断言与自动等待留到下一篇。

## Locator 基础

Locator 保存查询规则，执行操作时才在当前页面重新查找元素：

```python
from playwright.sync_api import Page, expect


def test_locator_requeries(page: Page) -> None:
    page.set_content("""
        <button id="action" onclick="
          document.querySelector('[role=status]').textContent = '已保存'
        ">保存</button>
        <p role="status">未保存</p>
    """)

    save_button = page.get_by_role("button", name="保存")
    page.evaluate("""() => {
      const oldButton = document.querySelector('#action');
      oldButton.replaceWith(oldButton.cloneNode(true));
    }""")
    save_button.click()
    expect(page.get_by_role("status")).to_have_text("已保存")
```

即使按钮被重建，Locator 仍会在点击时查询新元素。相比先取得一次性 DOM 句柄，这种模型更适合 React、Vue 等频繁重渲染的页面。

Locator 可以从 `Page`、`FrameLocator` 或另一个 Locator 开始，并继续缩小范围。

## 定位优先级

推荐从用户语义到实现细节依次选择：

| 优先级 | API | 适用对象 |
| --- | --- | --- |
| 1 | `get_by_role()` | 按角色和可访问名称定位控件 |
| 2 | `get_by_label()` | 有标签的输入框、复选框、下拉框 |
| 3 | `get_by_placeholder()` | 暂无标签但占位文本稳定的输入框 |
| 4 | `get_by_text()` | 非交互文本内容 |
| 5 | `get_by_alt_text()`、`get_by_title()` | 图片替代文本或 title 合同 |
| 6 | `get_by_test_id()` | 无稳定用户语义但有测试契约 |
| 7 | CSS 或 XPath | 只能依赖 DOM 结构的特殊情况 |

示例页面：

```html
<main>
  <h1>创建订单</h1>
  <label for="customer">客户名称</label>
  <input id="customer" placeholder="例如：Alice">
  <button type="submit">提交订单</button>
  <p>订单将在 24 小时内处理</p>
</main>
```

对应定位：

```python
heading = page.get_by_role("heading", name="创建订单")
customer = page.get_by_label("客户名称")
submit = page.get_by_role("button", name="提交订单")
message = page.get_by_text("订单将在 24 小时内处理")
```

`get_by_role()` 的 `name` 来自可访问名称计算，不一定等于元素文本。例如带 `aria-label="关闭购物车"` 的图标按钮应按该名称定位。

## 语义定位

角色定位同时检查元素类型和名称：

```python
page.get_by_role("button", name="保存")
page.get_by_role("link", name="订单详情")
page.get_by_role("checkbox", name="接受协议")
page.get_by_role("row", name="订单 A-100 已支付")
```

HTML 原生元素通常自带正确角色。优先修复产品语义，而不是在测试中绕过错误标记：

```html
<!-- 推荐 -->
<button type="button">删除</button>

<!-- 不推荐：缺少键盘与按钮语义 -->
<div onclick="removeOrder()">删除</div>
```

角色定位失败有时是在暴露真实可访问性问题，例如按钮没有名称、label 没有关联 input，或者自定义组件使用了错误角色。

## 文本边界

文本定位适合标题、状态和说明，不宜替代控件角色：

```python
# 精确匹配，避免同时命中“订单”和“订单详情”
page.get_by_text("订单", exact=True)

# 使用正则处理稳定格式
import re
page.get_by_text(re.compile(r"订单号：A-\d+"))
```

按钮同时包含文本时，优先 `get_by_role("button", name="提交")`，因为测试明确表达了“点击按钮”，而不仅是寻找一段文字。

国际化页面不要把易变翻译文案散落在测试中。可以使用稳定测试 ID，或由数据层集中提供当前语言的预期文本。

## 严格模式

单元素操作要求 Locator 最终只匹配一个元素。如果页面有两个“删除”按钮：

```python
page.get_by_role("button", name="删除").click()
```

Playwright 会抛出严格模式错误。这个错误不是偶发噪声，而是说明测试意图不完整。正确做法是增加业务范围：

```python
order = page.get_by_role("row", name="订单 A-100")
order.get_by_role("button", name="删除").click()
```

只有目标本来就由稳定顺序定义时才使用 `first`、`last` 或 `nth()`：

```python
first_result = page.get_by_role("listitem").first
```

如果“第一个”只是当前 DOM 偶然顺序，`nth(0)` 会把真实歧义隐藏起来。

## 过滤与组合

列表中多个卡片结构相同时，先定位集合，再按内容过滤：

```python
product = page.get_by_role("listitem").filter(
    has=page.get_by_role("heading", name="机械键盘")
)
product.get_by_role("button", name="加入购物车").click()
```

按文本过滤：

```python
paid_order = page.get_by_role("row").filter(has_text="已支付")
```

排除包含特定子元素的项：

```python
available = page.get_by_role("listitem").filter(
    has_not=page.get_by_text("已售罄")
)
```

两个独立条件可以使用 `and_()`：

```python
confirm = page.get_by_role("button").and_(page.get_by_title("确认订单"))
```

需要接受多个替代状态时可以使用 `or_()`，但必须考虑两者同时出现导致严格模式错误：

```python
result = page.get_by_text("支付成功").or_(page.get_by_text("需要验证"))
result.first.wait_for(state="visible")
```

## 测试契约

当画布、图表、无文本图标或第三方组件没有可靠用户语义时，可以建立显式测试 ID：

```html
<canvas data-testid="sales-chart"></canvas>
```

```python
chart = page.get_by_test_id("sales-chart")
```

测试 ID 应描述稳定职责，而不是样式或位置：

```text
推荐：checkout-submit、order-total、sales-chart
避免：blue-button、right-column-2、div-17
```

如果项目使用其他属性，可统一配置：

```python
from playwright.sync_api import Playwright


def configure_test_id(playwright: Playwright) -> None:
    playwright.selectors.set_test_id_attribute("data-pw")
```

测试 ID 是产品与测试共同维护的契约，不是掩盖缺失语义的默认方案。

## CSS 与 XPath

CSS 适合没有可访问语义、但 DOM 合同确实稳定的结构：

```python
page.locator("article[data-order-id='A-100']")
```

避免长链：

```python
# 脆弱：任何中间层调整都会破坏定位
page.locator("div.container > div:nth-child(2) > ul > li:nth-child(3) button")
```

XPath 同样能定位元素，但容易与页面内部结构耦合。使用前先确认角色、标签、文本、测试 ID 和短 CSS 都不能表达目标。

## 动态列表

列表会延迟加载或重排时，先保留集合 Locator，再让下一篇的 Web-first 断言等待数量或内容：

```python
orders = page.get_by_role("row").filter(has_not=page.get_by_role("columnheader"))
```

不要立即调用 `all()` 并期待它自动等待列表完成。`locator.all()` 返回当前匹配集合；列表仍在变化时会产生不稳定结果。需要逐项检查时，先等待列表达到业务稳定条件，再遍历。

## 定位检查

Codegen 可以帮助观察推荐 Locator：

```bash
uv run playwright codegen https://example.com
```

生成结果只是起点。检查是否依赖易变文本、顺序或长 CSS，并把定位缩小到业务容器。第十篇会完整介绍 Codegen 和 Inspector。

完成本篇时，应能为一个重复订单列表写出：

```python
order = page.get_by_role("row").filter(has_text="A-100")
pay = order.get_by_role("button", name="支付")
```

并能解释为什么它比 `page.locator("tr:nth-child(2) button")` 更稳定。

## 常见问题

{% flashcard basic id:playwright-locator-role deck:"Playwright" tags:"Locator,语义定位" %}
--- question
为什么优先使用 `get_by_role()`？
--- answer
它按用户可感知的角色和名称定位元素。
--- explanation
角色定位更接近真实交互合同，能降低 DOM 重构带来的影响，也能暴露缺少名称或错误角色等语义问题。
{% endflashcard %}

{% flashcard choice id:playwright-locator-strict deck:"Playwright" tags:"Locator,严格模式" answer:C %}
--- question
两个订单行都有“删除”按钮，哪种定位最合适？
- [A] 直接使用第一个删除按钮
- [B] 使用全页面长 CSS 链
- [C] 先定位目标订单行，再在行内定位删除按钮
--- answer
C
--- explanation
先按业务身份缩小容器，再定位操作目标，可以消除歧义并保留测试意图。
{% endflashcard %}

## 参考资料

- [Playwright Locators](https://playwright.dev/python/docs/locators)
- [Playwright Best Practices](https://playwright.dev/python/docs/best-practices)
- [Locator API](https://playwright.dev/python/docs/api/class-locator)
- [ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles)

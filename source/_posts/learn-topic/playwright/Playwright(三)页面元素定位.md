---
title: Playwright(三)页面元素定位
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
date: 2026-04-09 00:00:00
---

{% course_series %}

{% note primary flat %}
定位规则决定测试如何理解页面。稳定的 Locator 应表达“用户正在操作哪个控件”，而不是“元素当前位于第几个 div”。主线从定位优先级进入重复元素、特殊文档与动态页面，断言只用于验证定位结果。
{% endnote %}

## 定位模型

{% note info flat %}
Locator 保存查询规则，执行操作时才在当前页面重新查找元素：
{% endnote %}

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

{% note info flat %}
即使按钮被重建，Locator 仍会在点击时查询新元素。相比先取得一次性 DOM 句柄，这种模型更适合 React、Vue 等频繁重渲染的页面。
{% endnote %}

{% note info flat %}
Locator 可以从 `Page`、`FrameLocator` 或另一个 Locator 开始，并继续缩小范围。
{% endnote %}

### 定位优先级

{% note primary flat %}
推荐从用户语义到实现细节依次选择：
{% endnote %}

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

{% note info flat %}
`get_by_role()` 的 `name` 来自可访问名称计算，不一定等于元素文本。例如带 `aria-label="关闭购物车"` 的图标按钮应按该名称定位。
{% endnote %}

### 语义定位

{% note info flat %}
角色定位同时检查元素类型和名称：
{% endnote %}

```python
page.get_by_role("button", name="保存")
page.get_by_role("link", name="订单详情")
page.get_by_role("checkbox", name="接受协议")
page.get_by_role("row", name="订单 A-100 已支付")
```

{% note warning flat %}
HTML 原生元素通常自带正确角色。优先修复产品语义，而不是在测试中绕过错误标记：
{% endnote %}

```html
<!-- 推荐 -->
<button type="button">删除</button>

<!-- 不推荐：缺少键盘与按钮语义 -->
<div onclick="removeOrder()">删除</div>
```

{% note info flat %}
角色定位失败有时是在暴露真实可访问性问题，例如按钮没有名称、label 没有关联 input，或者自定义组件使用了错误角色。
{% endnote %}

### 文本边界

{% note info flat %}
文本定位适合标题、状态和说明，不宜替代控件角色：
{% endnote %}

```python
# 精确匹配，避免同时命中“订单”和“订单详情”
page.get_by_text("订单", exact=True)

# 使用正则处理稳定格式
import re
page.get_by_text(re.compile(r"订单号：A-\d+"))
```

{% note primary flat %}
按钮同时包含文本时，优先 `get_by_role("button", name="提交")`，因为测试明确表达了“点击按钮”，而不仅是寻找一段文字。
{% endnote %}

{% note warning flat %}
国际化页面不要把易变翻译文案散落在测试中。可以使用稳定测试 ID，或由数据层集中提供当前语言的预期文本。
{% endnote %}

### 严格模式

{% note info flat %}
单元素操作要求 Locator 最终只匹配一个元素。如果页面有两个“删除”按钮：
{% endnote %}

```python
page.get_by_role("button", name="删除").click()
```

{% note info flat %}
Playwright 会抛出严格模式错误。这个错误不是偶发噪声，而是说明测试意图不完整。正确做法是增加业务范围：
{% endnote %}

```python
order = page.get_by_role("row", name="订单 A-100")
order.get_by_role("button", name="删除").click()
```

{% note warning flat %}
只有目标本来就由稳定顺序定义时才使用 `first`、`last` 或 `nth()`：
{% endnote %}

```python
first_result = page.get_by_role("listitem").first

rows = page.get_by_role("row")
first_row = rows.first
last_row = rows.last
third_row = rows.nth(2)
first_row.locator("button").click()
```

{% note info flat %}
如果“第一个”只是当前 DOM 偶然顺序，`nth(0)` 会把真实歧义隐藏起来。
{% endnote %}

### 过滤与组合

{% note info flat %}
列表中多个卡片结构相同时，先定位集合，再按内容过滤：
{% endnote %}

```python
product = page.get_by_role("listitem").filter(
    has=page.get_by_role("heading", name="机械键盘")
)
product.get_by_role("button", name="加入购物车").click()
```

{% note info flat %}
按文本过滤：
{% endnote %}

```python
paid_order = page.get_by_role("row").filter(has_text="已支付")
```

{% note info flat %}
排除包含特定子元素的项：
{% endnote %}

```python
available = page.get_by_role("listitem").filter(
    has_not=page.get_by_text("已售罄")
)
```

{% note info flat %}
两个独立条件可以使用 `and_()`：
{% endnote %}

```python
confirm = page.get_by_role("button").and_(page.get_by_title("确认订单"))
```

{% note primary flat %}
需要接受多个替代状态时可以使用 `or_()`，但必须考虑两者同时出现导致严格模式错误：
{% endnote %}

```python
result = page.get_by_text("支付成功").or_(page.get_by_text("需要验证"))
result.first.wait_for(state="visible")
```

### 参数边界

{% note warning flat %}
定位参数要表达筛选意图，不要把所有条件都堆进 CSS：
{% endnote %}

```python
# exact=True 只匹配完整可访问名称；默认值允许按 Playwright 的文本规则匹配
page.get_by_role("button", name="保存", exact=True)

# 角色筛选也可以表达控件状态
page.get_by_role("checkbox", checked=True, disabled=False)
page.get_by_role("option", selected=True, include_hidden=False)

# description 用于可访问描述，不等同于可访问名称
page.get_by_role("button", description="保存当前草稿")

# visible=True 只保留当前可见项；has/has_not 仍然要求子 Locator 属于同一框架
visible_cards = page.get_by_role("listitem").filter(visible=True)
without_badge = visible_cards.filter(has_not=page.get_by_text("已售罄"))
```

{% note warning flat %}
`has_text`/`has_not_text` 适合稳定的文本片段，`has`/`has_not` 适合子结构；嵌套 Locator 必须从同一个 `Page`、`Frame` 或父 Locator 构造，不能把一个页面的 Locator 塞进另一个框架。`exact` 只影响文本或名称匹配，不会把动态数据变成稳定合同。
{% endnote %}

### 测试契约

{% note info flat %}
当画布、图表、无文本图标或第三方组件没有可靠用户语义时，可以建立显式测试 ID：
{% endnote %}

```html
<canvas data-testid="sales-chart"></canvas>
```

```python
chart = page.get_by_test_id("sales-chart")
```

{% note info flat %}
测试 ID 应描述稳定职责，而不是样式或位置：
{% endnote %}

```text
推荐：checkout-submit、order-total、sales-chart
避免：blue-button、right-column-2、div-17
```

{% note info flat %}
如果项目使用其他属性，可统一配置：
{% endnote %}

```python
from playwright.sync_api import Playwright


def configure_test_id(playwright: Playwright) -> None:
    playwright.selectors.set_test_id_attribute("data-pw")
```

{% note info flat %}
测试 ID 是产品与测试共同维护的契约，不是掩盖缺失语义的默认方案。
{% endnote %}

## 特殊场景

{% note info flat %}
CSS 适合没有可访问语义、但 DOM 合同确实稳定的结构：
{% endnote %}

```python
page.locator("article[data-order-id='A-100']")
```

{% note warning flat %}
避免长链：
{% endnote %}

```python
# 脆弱：任何中间层调整都会破坏定位
page.locator("div.container > div:nth-child(2) > ul > li:nth-child(3) button")
```

{% note info flat %}
XPath 同样能定位元素，但容易与页面内部结构耦合。使用前先确认角色、标签、文本、测试 ID 和短 CSS 都不能表达目标。
{% endnote %}

### 嵌套文档

{% note primary flat %}
普通 iframe 交互优先从 `FrameLocator` 开始定位：
{% endnote %}

```python
checkout = page.frame_locator("iframe[title='支付']")
checkout.get_by_label("卡号").fill("4111111111111111")
checkout.get_by_role("button", name="确认支付").click()

# iframe 内还有 iframe 时继续缩小 FrameLocator 范围
nested = checkout.frame_locator("iframe[title='3-D Secure']")
nested.get_by_role("textbox", name="验证码").fill("123456")
```

{% note info flat %}
当 iframe 本身已经由 Locator 稳定选出时，`content_frame` 可以取得当前 Frame；这里仅把它作为迁移入口，不展开文件与生命周期管理。跨域 iframe 仍可定位其可访问 DOM，但不能用页面脚本越过浏览器同源策略读取内部状态。
{% endnote %}

## 定位验证

{% note info flat %}
语义定位无法表达目标时再使用调试或 DOM 级能力：
{% endnote %}

| 能力 | 使用时机 | 注意事项 |
| --- | --- | --- |
| `aria_snapshot()` | 检查可访问树与角色名称 | 用于诊断语义，不替代业务断言 |
| `describe()` | 给 Trace 或调试输出补充业务说明 | 描述不参与匹配 |
| `bounding_box()` | 需要验证几何位置或排查遮挡 | 返回 `None` 时先确认元素已渲染 |
| `evaluate()`、`evaluate_all()` | 页面没有对应 Playwright API 的只读诊断 | 不要用脚本点击绕过 Actionability |
| `element_handle()`、`element_handles()` | 仅为兼容旧库或底层 API | 优先改回 Locator；句柄不会自动重新定位 |

### 句柄迁移

{% note info flat %}
ElementHandle 会把一次查询的结果固定下来；动态列表或重渲染页面应直接保留 Locator。单元素和多元素迁移分别如下：
{% endnote %}

```python
# 旧写法：先解析成一次性句柄，再操作
handle = page.get_by_role("button", name="保存").element_handle()
handle.click()

# 新写法：让 Locator 在操作时重新查询并执行 Actionability 检查
save_button = page.get_by_role("button", name="保存")
save_button.click()

# 多元素旧写法
handles = page.get_by_role("listitem").element_handles()
for item in handles:
    print(item.inner_text())

# 多元素新写法：先等待业务稳定条件，再按 Locator 逐项读取
items = page.get_by_role("listitem")
expect(items).to_have_count(3)
for index in range(items.count()):
    print(items.nth(index).inner_text())
```

{% note primary flat %}
只有 `element_handle(timeout=...)` 接受 `timeout`，`element_handles()` 不接受该参数；它们的等待只发生在句柄解析阶段。迁移后由 Locator 操作或 Web-first 断言负责等待。异步版本分别写成 `await locator.element_handle()`、`await locator.element_handles()`，但推荐的替代代码仍是 `await locator.click()`、`await expect(items).to_have_count(3)`。
{% endnote %}

### 自定义选择器

{% note primary flat %}
自定义选择器只在项目确实需要跨组件复用选择算法时注册，并明确注册时机、脚本位置和安全边界。选择器名称只能使用字母、数字和下划线；引擎至少实现 `query` 与 `queryAll`，并且必须在创建 Page 前注册：
{% endnote %}

```python
selector_engine = """
{
  query(root, selector) {
    return root.querySelector(`[data-pw='${selector}']`);
  },
  queryAll(root, selector) {
    return Array.from(root.querySelectorAll(`[data-pw='${selector}']`));
  }
}
"""

# 必须在 browser.new_page() 之前注册；名称只能使用字母、数字和下划线。
playwright.selectors.register("data_pw", selector_engine, content_script=True)
browser = playwright.chromium.launch()
page = browser.new_page()
page.set_content("<button data-pw='save'>保存</button>")
save = page.locator("data_pw=save")
save.click()
assert save.inner_text() == "保存"
```

{% note info flat %}
普通测试不需要注册选择器；先用 `get_by_*`、`locator()` 和 `filter()` 表达目标。若只是统一测试 ID 属性，使用前面的 `set_test_id_attribute()` 更简单，也不需要维护 JavaScript 引擎。
{% endnote %}

### 动态列表

{% note info flat %}
列表会延迟加载或重排时，先保留集合 Locator，再用 Web-first 断言等待数量或内容：
{% endnote %}

```python
orders = page.get_by_role("row").filter(has_not=page.get_by_role("columnheader"))
```

{% note warning flat %}
不要立即调用 `all()` 并期待它自动等待列表完成。`locator.all()` 返回当前匹配集合；列表仍在变化时会产生不稳定结果。需要逐项检查时，先等待列表达到业务稳定条件，再遍历。
{% endnote %}

### 定位检查

{% note primary flat %}
Codegen 可以帮助观察推荐 Locator：
{% endnote %}

```bash
uv run playwright codegen https://example.com
```

{% note info flat %}
生成结果只是起点。检查是否依赖易变文本、顺序或长 CSS，并把定位缩小到业务容器；录制与逐步调试按调试流程管理。
{% endnote %}

{% note success flat %}
完成本篇时，应能为一个重复订单列表写出：
{% endnote %}

```python
order = page.get_by_role("row").filter(has_text="A-100")
pay = order.get_by_role("button", name="支付")
```

{% note info flat %}
并能解释为什么它比 `page.locator("tr:nth-child(2) button")` 更稳定。
{% endnote %}

## 接口边界

{% note info flat %}
以下索引按 Playwright Python 1.62.0 的同步 API 归类，方便在具体场景中选择对象、成员和参数；它是查询表，不替代前文的机制、示例与失败边界。异步 API 只在实际执行 I/O 时使用 await。
{% endnote %}

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 主线成员 | 常用成员 | 扩展成员与参数 | 替代写法 |
| --- | --- | --- | --- | --- |
| `FrameLocator` | `frame_locator()` | — | `get_by_alt_text()`、`get_by_label()`、`get_by_placeholder()`、`get_by_role()`、`get_by_test_id()`、`get_by_text()`、`get_by_title()`、`locator()`、`owner` | `first`、`last`、`nth()` |
| `Locator` | `and_()`、`filter()`、`first`、`frame_locator()`、`get_by_role()`、`last`、`locator()`、`nth()`、`or_()` | — | `all()`、`all_inner_texts()`、`all_text_contents()`、`aria_snapshot()`、`bounding_box()`、`count()`、`describe()`、`description`、`evaluate()`、`evaluate_all()`、`evaluate_handle()`、`get_attribute()`、`get_by_alt_text()`、`get_by_label()`、`get_by_placeholder()`、`get_by_test_id()`、`get_by_text()`、`get_by_title()`、`hide_highlight()`、`highlight()`、`inner_html()`、`inner_text()`、`input_value()`、`normalize()`、`page`、`text_content()` | `element_handle()`、`element_handles()` |
| `Page` | `frame_locator()`、`get_by_label()`、`get_by_role()`、`get_by_test_id()`、`get_by_text()`、`get_by_title()`、`locator()` | — | `get_by_alt_text()`、`get_by_placeholder()` | — |
| `Playwright` | — | — | `selectors` | — |
| `Selectors` | — | — | `register()`、`set_test_id_attribute()` | — |
| `FrameLocator.frame_locator` 参数 | — | — | `selector` | — |
| `FrameLocator.get_by_alt_text` 参数 | — | `exact` | `text` | — |
| `FrameLocator.get_by_label` 参数 | — | `exact` | `text` | — |
| `FrameLocator.get_by_placeholder` 参数 | — | `exact` | `text` | — |
| `FrameLocator.get_by_role` 参数 | — | `checked`, `description`, `disabled`, `exact`, `expanded`, `include_hidden`, `level`, `name`, `pressed`, `selected` | `role` | — |
| `FrameLocator.get_by_test_id` 参数 | — | — | `test_id` | — |
| `FrameLocator.get_by_text` 参数 | — | `exact` | `text` | — |
| `FrameLocator.get_by_title` 参数 | — | `exact` | `text` | — |
| `FrameLocator.locator` 参数 | — | `has`, `has_not`, `has_not_text`, `has_text` | `selector_or_locator` | — |
| `FrameLocator.nth` 参数 | — | — | — | `index` |
| `Locator.and_` 参数 | — | — | `locator` | — |
| `Locator.aria_snapshot` 参数 | — | — | `boxes`, `depth`, `mode`, `timeout` | — |
| `Locator.bounding_box` 参数 | — | — | `timeout` | — |
| `Locator.describe` 参数 | — | — | `description` | — |
| `Locator.element_handle` 参数 | — | — | — | `timeout` |
| `Locator.evaluate` 参数 | — | — | `arg`, `expression`, `timeout` | — |
| `Locator.evaluate_all` 参数 | — | — | `arg`, `expression` | — |
| `Locator.evaluate_handle` 参数 | — | — | `arg`, `expression`, `timeout` | — |
| `Locator.filter` 参数 | — | `has`, `has_not`, `has_not_text`, `has_text`, `visible` | — | — |
| `Locator.frame_locator` 参数 | — | — | `selector` | — |
| `Locator.get_attribute` 参数 | — | — | `name`, `timeout` | — |
| `Locator.get_by_alt_text` 参数 | — | `exact` | `text` | — |
| `Locator.get_by_label` 参数 | — | `exact` | `text` | — |
| `Locator.get_by_placeholder` 参数 | — | `exact` | `text` | — |
| `Locator.get_by_role` 参数 | — | `checked`, `description`, `disabled`, `exact`, `expanded`, `include_hidden`, `level`, `name`, `pressed`, `selected` | `role` | — |
| `Locator.get_by_test_id` 参数 | — | — | `test_id` | — |
| `Locator.get_by_text` 参数 | — | `exact` | `text` | — |
| `Locator.get_by_title` 参数 | — | `exact` | `text` | — |
| `Locator.highlight` 参数 | — | — | `style` | — |
| `Locator.inner_html` 参数 | — | — | `timeout` | — |
| `Locator.inner_text` 参数 | — | — | `timeout` | — |
| `Locator.input_value` 参数 | — | — | `timeout` | — |
| `Locator.locator` 参数 | — | `has`, `has_not`, `has_not_text`, `has_text` | `selector_or_locator` | — |
| `Locator.nth` 参数 | — | — | `index` | — |
| `Locator.or_` 参数 | — | — | `locator` | — |
| `Locator.text_content` 参数 | — | — | `timeout` | — |
| `Page.frame_locator` 参数 | — | — | `selector` | — |
| `Page.get_by_alt_text` 参数 | — | `exact` | `text` | — |
| `Page.get_by_label` 参数 | — | `exact` | `text` | — |
| `Page.get_by_placeholder` 参数 | — | `exact` | `text` | — |
| `Page.get_by_role` 参数 | — | `checked`, `description`, `disabled`, `exact`, `expanded`, `include_hidden`, `level`, `name`, `pressed`, `selected` | `role` | — |
| `Page.get_by_test_id` 参数 | — | — | `test_id` | — |
| `Page.get_by_text` 参数 | — | `exact` | `text` | — |
| `Page.get_by_title` 参数 | — | `exact` | `text` | — |
| `Page.locator` 参数 | — | `has`, `has_not`, `has_not_text`, `has_text` | `selector` | — |
| `Selectors.register` 参数 | — | — | `content_script`, `name`, `path`, `script` | — |
| `Selectors.set_test_id_attribute` 参数 | — | — | `attribute_name` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-locator-role deck:"Playwright" priority:1 tags:"Locator,语义定位" %}
--- question
为什么优先使用 `get_by_role()`？
--- answer
它按用户可感知的角色和名称定位元素。
--- explanation
角色定位更接近真实交互合同，能降低 DOM 重构带来的影响，也能暴露缺少名称或错误角色等语义问题。

把“语义定位”落到一个可维护的例子：

~~~python
save = page.get_by_role("button", name="保存")
save.click()  # 名称来自可访问语义，不依赖 CSS class
~~~

如果按钮改了样式类，定位意图仍然成立；如果按钮失去可访问名称，测试失败反而暴露了用户实际也可能遇到的语义问题。
{% endflashcard %}

{% flashcard choice id:playwright-locator-strict deck:"Playwright" priority:1 tags:"Locator,严格模式" answer:C %}
--- question
两个订单行都有“删除”按钮，哪种定位最合适？
- [A] 直接使用第一个删除按钮
- [B] 使用全页面长 CSS 链
- [C] 先定位目标订单行，再在行内定位删除按钮
--- answer
C
--- explanation
先按业务身份缩小容器，再定位操作目标，可以消除歧义并保留测试意图。

先定位业务容器，再在容器内定位动作：

~~~python
row = page.get_by_role("row", name="订单 A-1001")
row.get_by_role("button", name="删除").click()
~~~

这样严格模式要求的唯一匹配是业务上的唯一订单，而不是页面上第一个删除按钮。first 或长 CSS 链虽然可能让测试变绿，却会掩盖错误行被操作的风险。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Playwright Locators, https://playwright.dev/python/docs/locators, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Writing tests, https://playwright.dev/python/docs/writing-tests, https://playwright.dev/img/playwright-logo.svg %}
{% link Locator API, https://playwright.dev/python/docs/api/class-locator, https://playwright.dev/img/playwright-logo.svg %}
{% link ARIA roles, https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles, https://developer.mozilla.org/favicon.ico %}
{% endlinkgroup %}

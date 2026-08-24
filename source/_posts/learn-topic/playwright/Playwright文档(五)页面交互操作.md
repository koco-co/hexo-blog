---
title: Playwright文档(五) 页面交互操作
tags:
  - Playwright
  - 表单测试
  - 键盘操作
  - 鼠标操作
categories:
  - Learn Topic
  - Playwright
description: 在 Locator 与等待模型基础上掌握文本输入、选择、复选、键盘、鼠标、触控和拖拽等页面交互，并用用户可观察结果验证动作是否生效。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 5
published: true
abbrlink: fdf6b990
date: 2026-08-24 12:08:00
---

{% course_series %}

页面交互的目标不是调用最多的 API，而是尽量还原用户输入，并对动作后的结果负责。本篇从表单控件开始，再进入键盘、鼠标和拖拽；弹窗、iframe 与文件等跨边界组件留到下一篇。

## 操作原则

每个交互场景都遵循四步：

1. 用业务语义定位控件；
2. 使用最接近用户行为的高层操作；
3. 等待动作后的用户可观察结果；
4. 只在高层操作无法表达时使用底层事件。

```python
name = page.get_by_label("客户名称")
name.fill("Alice")
page.get_by_role("button", name="保存").click()
expect(page.get_by_role("status")).to_have_text("保存成功")
```

`fill()`、`click()` 等 Locator 操作自带 Actionability 检查。不要在每个动作前机械添加 `wait_for_selector()`。

## 文本输入

`fill()` 会先清空再填入完整文本，适合普通输入框：

```python
page.get_by_label("客户名称").fill("Alice")
page.get_by_label("备注").fill("工作日送达")
```

需要逐键触发搜索建议、掩码或快捷键逻辑时使用 `press_sequentially()`：

```python
search = page.get_by_role("searchbox", name="搜索商品")
search.press_sequentially("keyboard", delay=80)
expect(page.get_by_role("option", name="机械键盘")).to_be_visible()
```

不要通过逐键输入模拟“真人”来规避反自动化机制。受验证码或风控保护的第三方系统不应成为普通自动化练习目标。

清空与追加：

```python
coupon = page.get_by_label("优惠码")
coupon.clear()
coupon.fill("WELCOME20")
```

输入值应使用 `to_have_value()` 验证，展示文本使用 `to_have_text()`。

## 选择控件

原生 `<select>` 使用 `select_option()`：

```python
country = page.get_by_label("国家或地区")

country.select_option("CN")
country.select_option(label="中国")
country.select_option(index=1)
```

多选控件传入列表：

```python
page.get_by_label("配送方式").select_option(["standard", "pickup"])
```

自定义下拉框通常不是 `<select>`，应按真实交互操作：

```python
page.get_by_role("combobox", name="城市").click()
page.get_by_role("option", name="上海").click()
expect(page.get_by_role("combobox", name="城市")).to_have_value("上海")
```

不要对自定义组件直接修改 DOM value，这会跳过产品自身的事件和校验逻辑。

## 复选与单选

布尔选择使用 `check()` 与 `uncheck()`：

```python
agreement = page.get_by_role("checkbox", name="接受服务条款")
agreement.check()
expect(agreement).to_be_checked()

agreement.uncheck()
expect(agreement).not_to_be_checked()
```

`set_checked()` 适合数据驱动场景：

```python
agreement.set_checked(case.accept_terms)
```

单选按钮按 label 或 role 操作：

```python
page.get_by_role("radio", name="到店自取").check()
```

如果控件被自定义外观覆盖，仍应通过关联 label 或角色定位，而不是点击内部装饰元素。

## 按钮与链接

单击、双击和右键：

```python
page.get_by_role("button", name="提交").click()
page.get_by_text("订单 A-100").dblclick()
page.get_by_role("row", name="订单 A-100").click(button="right")
```

按修饰键点击：

```python
page.get_by_role("link", name="订单详情").click(modifiers=["ControlOrMeta"])
```

链接可能打开新标签页，必须使用事件等待；具体写法在下一篇介绍。

## 键盘操作

对已定位控件使用 `press()`：

```python
import re

search = page.get_by_role("searchbox")
search.fill("机械键盘")
search.press("Enter")
expect(page).to_have_url(re.compile(r".*/search\?q=.*$"))
```

常见组合：

```python
input_box.press("ControlOrMeta+A")
input_box.press("Backspace")
page.keyboard.press("Escape")
page.keyboard.press("Shift+Tab")
```

`ControlOrMeta` 会在 Windows/Linux 使用 Control，在 macOS 使用 Meta，适合跨平台快捷键。全局 `page.keyboard` 依赖当前焦点，使用前先断言焦点或主动 `focus()`：

```python
editor = page.get_by_role("textbox", name="订单备注")
editor.focus()
expect(editor).to_be_focused()
page.keyboard.type("优先发货")
```

## 鼠标操作

Locator 高层操作优先：

```python
menu = page.get_by_role("button", name="用户菜单")
menu.hover()
expect(page.get_by_role("menu")).to_be_visible()
```

精确坐标操作仅适用于画布、地图或无法通过 DOM 表达的控件：

```python
canvas = page.get_by_test_id("seat-map")
box = canvas.bounding_box()
assert box is not None

page.mouse.click(box["x"] + 80, box["y"] + 40)
```

坐标会受到缩放、响应式布局和滚动影响。验证画布交互时，应固定 viewport，并断言操作后的业务状态，而不是只证明坐标点击没有报错。

## 拖拽操作

标准 HTML 拖拽优先使用 `drag_to()`：

```python
source = page.get_by_role("listitem", name="订单 A-100")
target = page.get_by_role("region", name="已完成订单")

source.drag_to(target)
expect(target.get_by_text("A-100")).to_be_visible()
```

自定义组件需要更细粒度事件时，再使用鼠标：

```python
source_box = source.bounding_box()
target_box = target.bounding_box()
assert source_box and target_box

page.mouse.move(
    source_box["x"] + source_box["width"] / 2,
    source_box["y"] + source_box["height"] / 2,
)
page.mouse.down()
page.mouse.move(
    target_box["x"] + target_box["width"] / 2,
    target_box["y"] + target_box["height"] / 2,
    steps=10,
)
page.mouse.up()
```

底层鼠标操作必须固定 viewport、确认元素在视口内，并验证目标区域的最终状态。

## 触控与移动端

移动端测试可以在 Context 中启用触控，再使用 `tap()`：

```python
import pytest
from playwright.sync_api import Browser, expect


@pytest.mark.only_browser("chromium")
def test_mobile_menu(browser: Browser) -> None:
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        has_touch=True,
        is_mobile=True,
    )
    try:
        page = context.new_page()
        page.set_content("""
          <button>打开菜单</button>
          <nav aria-label="移动端菜单" hidden>订单中心</nav>
          <script>
            document.querySelector('button').onclick = () => {
              document.querySelector('nav').hidden = false;
            };
          </script>
        """)
        page.get_by_role("button", name="打开菜单").tap()
        expect(page.get_by_role("navigation", name="移动端菜单")).to_be_visible()
    finally:
        context.close()
```

设置 viewport 只是改变页面尺寸；`has_touch` 与 `is_mobile` 才会进一步影响输入和页面行为。`is_mobile` 不支持 Firefox，因此示例显式限制 Chromium；Firefox 响应式检查只设置 viewport，并继续使用鼠标/键盘路径。第七篇会系统介绍设备模拟。

## JavaScript 事件

`dispatch_event()` 可以发送 DOM 事件：

```python
page.get_by_label("上传区域").dispatch_event("dragenter")
```

它不会自动执行真实指针路径和全部浏览器默认行为，因此只适合明确验证事件监听器或构造高层 API 无法表达的边界。常规点击、输入和选择仍应使用 Locator 操作。

## 完整示例

```python
from playwright.sync_api import Page, expect


def test_create_order(page: Page) -> None:
    page.set_content("""
      <form>
        <label>客户名称 <input name="customer"></label>
        <label>配送方式
          <select name="shipping">
            <option value="standard">标准配送</option>
            <option value="pickup">到店自取</option>
          </select>
        </label>
        <label><input type="checkbox" name="terms">接受服务条款</label>
        <button>提交订单</button>
      </form>
      <p role="status"></p>
      <script>
        document.querySelector('form').onsubmit = event => {
          event.preventDefault();
          document.querySelector('[role=status]').textContent = '订单创建成功';
        };
      </script>
    """)

    page.get_by_label("客户名称").fill("Alice")
    page.get_by_label("配送方式").select_option("pickup")
    page.get_by_role("checkbox", name="接受服务条款").check()
    page.get_by_role("button", name="提交订单").click()

    expect(page.get_by_role("status")).to_have_text("订单创建成功")
```

该示例把定位、操作和结果验证分开，失败时可以判断问题位于哪一步。

## 常见问题

{% flashcard basic id:playwright-fill-type deck:"Playwright" tags:"表单,输入" %}
--- question
`fill()` 与 `press_sequentially()` 的主要区别是什么？
--- answer
`fill()` 设置完整值，`press_sequentially()` 逐键触发键盘事件。
--- explanation
普通文本输入优先使用 `fill()`；只有搜索建议、输入掩码或逐键事件属于产品合同，才需要逐键输入。
{% endflashcard %}

{% flashcard choice id:playwright-drag-choice deck:"Playwright" tags:"拖拽,鼠标" answer:A %}
--- question
标准拖拽组件首先应尝试哪种方式？
- [A] `source.drag_to(target)`
- [B] 固定屏幕绝对坐标
- [C] 直接修改目标 DOM
--- answer
A
--- explanation
高层 `drag_to()` 更接近用户行为并保留 Playwright 的定位与可操作性检查；仅在组件需要特殊指针轨迹时降级到底层鼠标操作。
{% endflashcard %}

## 参考资料

- [Playwright Input](https://playwright.dev/python/docs/input)
- [Locator API](https://playwright.dev/python/docs/api/class-locator)
- [Mouse API](https://playwright.dev/python/docs/api/class-mouse)
- [Keyboard API](https://playwright.dev/python/docs/api/class-keyboard)

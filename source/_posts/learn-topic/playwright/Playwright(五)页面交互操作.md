---
title: Playwright(五)页面交互操作
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

页面交互的目标不是调用最多的 API，而是尽量还原用户输入，并对动作后的结果负责。本篇从表单控件开始，再进入文件输入、键盘、鼠标和拖拽；动态文件选择器、弹窗与 iframe 等跨边界组件留到下一篇。

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

输入 API 不是同义词，先按产品实际监听的事件选择：

| API | 事件特点 | 适用场景 |
| --- | --- | --- |
| `locator.fill()` | 设置完整值并触发 `input` | 普通输入框、文本域、可编辑区域 |
| `locator.press_sequentially()` | 逐字符发送键盘事件 | 搜索建议、输入掩码、逐键校验 |
| `locator.press()` | 发送一个按键或组合键 | Enter、Tab、方向键、快捷键 |
| `page.keyboard.type()` | 向当前焦点逐字符输入 | 画布编辑器等只能依赖全局焦点的场景 |
| `page.keyboard.insert_text()` | 只触发文本输入，不发送 `keydown`/`keyup` | 输入法文本或只关心 `input` 的组件 |
| `locator.type()`、`page.type()`、`frame.type()` | 旧式逐键输入 | 已弃用或不推荐；迁移到 `fill()`、`press_sequentially()` 或 `press()` |

`fill()` 会先清空再填入完整文本，适合普通输入框：

```python
page.get_by_label("客户名称").fill("Alice")
page.get_by_label("备注").fill("工作日送达")
```

`fill()` 只接受 `<input>`、`<textarea>` 或 `[contenteditable]` 等可编辑目标。若误把按钮或普通段落当成输入框，Playwright 会在可操作性检查后报错；不要用 `force=True` 掩盖定位错误。完整验证应同时检查输入值和提交后的页面结果：

```python
name = page.get_by_label("客户名称")
name.fill("Alice")
expect(name).to_have_value("Alice")

page.get_by_role("button", name="保存").click()
expect(page.get_by_role("status")).to_have_text("保存成功")
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
selected = country.select_option(label="中国")
assert selected == ["CN"]
expect(country).to_have_value("CN")
```

`select_option()` 会等待目标 `<option>` 出现，完成选择后触发 `input` 与 `change` 事件，并返回已选 value 列表。传入不存在的 value 会等待到超时；对自定义下拉框或其他非 `<select>` 元素调用则会报错，此时应改用下方的真实点击路径。

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
expect(agreement).to_be_checked(checked=case.accept_terms)
```

`check()` 与 `uncheck()` 表达固定目标状态，`set_checked(value)` 则把布尔数据直接映射为目标状态；三者都是幂等操作，控件已经处于目标状态时不会反向切换。若目标不是 checkbox/radio，或控件始终不可操作，动作会失败而不是悄悄修改 DOM。

## 文件输入

已定位到 `<input type="file">` 时，直接用 `set_input_files()` 设置文件，不需要打开系统文件选择窗口：

```python
from pathlib import Path

attachment = page.get_by_label("订单附件")
attachment.set_input_files(Path("tests/fixtures/order.pdf"))
assert attachment.evaluate("input => input.files.length") == 1
```

多文件输入传入路径列表；内存文件使用包含 `name`、`mimeType` 与 `buffer` 的字典；传入空列表可以清空选择。相对路径按测试进程的当前工作目录解析，因此团队项目应从固定的 fixture 根目录构造绝对路径。若目标不是文件输入框，或单文件控件收到多个文件，Playwright 会报错。只有按钮点击后动态创建文件选择器时，才使用下一篇的 `expect_file_chooser()` / `FileChooser` 流程。

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

全局按键也必须验证结果。例如 Escape 关闭对话层时，先让焦点进入目标区域，再断言对话层消失：

```python
dialog = page.get_by_role("dialog", name="快捷搜索")
dialog.get_by_role("searchbox").focus()
expect(dialog.get_by_role("searchbox")).to_be_focused()
page.keyboard.press("Escape")
expect(dialog).to_be_hidden()
```

如果焦点落在其他 frame 或控件上，全局按键可能被错误目标消费；这类失败通常表现为按键调用成功但页面状态没有变化，所以结果断言不可省略。

`ControlOrMeta` 会在 Windows/Linux 使用 Control，在 macOS 使用 Meta，适合跨平台快捷键。全局 `page.keyboard` 依赖当前焦点，使用前先断言焦点或主动 `focus()`：

```python
editor = page.get_by_role("textbox", name="订单备注")
editor.focus()
expect(editor).to_be_focused()
page.keyboard.type("优先发货")
```

需要精确控制按住与释放时，用 `down()` / `up()` 包住目标按键，并用 `try/finally` 保证修饰键能够释放：

```python
page.keyboard.down("Shift")
try:
    page.keyboard.press("ArrowDown")
finally:
    page.keyboard.up("Shift")

page.keyboard.insert_text("中文输入")
```

`type()` 在这里指仍受支持的 `Keyboard.type()`。`Locator.type()`、`Page.type()` 与 `Frame.type()` 属于旧式元素输入接口，不应因为文档迁移而被无声省略；已有代码应按事件需求迁移：普通输入用 `fill()`，逐键监听用 `press_sequentially()`，单个按键用 `press()`。

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
expect(page.get_by_role("status")).to_have_text("已选择座位 B4")
```

滚动优先让目标元素自行进入视口；只有验证滚轮处理器或无限列表时才直接发送滚轮事件：

```python
target = page.get_by_role("button", name="加载更多")
target.scroll_into_view_if_needed()
expect(target).to_be_in_viewport()

page.mouse.wheel(0, 600)
expect(page.get_by_text("第 20 条记录")).to_be_visible()
```

`mouse.wheel()` 只发送滚轮事件，不等待滚动完成，后面必须接 Web-first 断言。Playwright 1.62 的部分 Locator 动作还支持 `scroll="none"`，可用于验证元素在不自动滚动时是否真的可达；默认仍保持 `scroll="auto"`。

坐标会受到缩放、响应式布局和滚动影响。验证画布交互时，应固定 viewport，并断言操作后的业务状态，而不是只证明坐标点击没有报错。

`page.mouse.dblclick(x, y)` 用于必须通过坐标触发双击的画布区域；普通 DOM 元素仍优先使用 `locator.dblclick()`。`locator.select_text()` 选择输入框、文本域或可编辑区域的全部文本，适合验证复制和格式工具栏；`locator.blur()` 主动移走焦点，适合产品明确在 `blur` 时校验的表单。二者都应通过选区变化、校验提示等可观察结果验证。

## 拖拽操作

标准 HTML 拖拽优先使用 `drag_to()`：

```python
source = page.get_by_role("listitem", name="订单 A-100")
target = page.get_by_role("region", name="已完成订单")

source.drag_to(target)
expect(target.get_by_text("A-100")).to_be_visible()
```

外部文件或剪贴板数据拖入页面时使用 `drop()`，它会构造 `DataTransfer` 并发送 `dragenter`、`dragover`、`drop`。它与“把页面内元素拖到另一个元素”的 `drag_to()` 不是同一类操作：

```python
drop_zone = page.get_by_test_id("drop-zone")
drop_zone.drop({
    "data": {
        "text/plain": "A-100",
        "text/uri-list": "https://example.com/orders/A-100",
    }
})
expect(drop_zone).to_contain_text("A-100")
```

若目标的 `dragover` 监听器没有调用 `preventDefault()`，目标会拒绝此次 drop，Playwright 会抛错；这正好可以暴露组件没有实现可接收区域的问题。

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

`Locator.tap()` 会先定位元素并执行可操作性检查；`page.touchscreen.tap(x, y)` 则直接点击视口坐标，只适合画布或地图，并要求 Context 设置 `has_touch=True`：

```python
page.touchscreen.tap(120, 240)
expect(page.get_by_role("status")).to_have_text("已选择地图坐标")
```

未启用触控时，`Touchscreen.tap()` 会报错。不要把它和基于元素的 `Locator.tap()` 混为一谈。

## JavaScript 事件

`dispatch_event()` 可以发送 DOM 事件：

```python
page.get_by_label("上传区域").dispatch_event("dragenter")
```

它不会自动执行真实指针路径和全部浏览器默认行为，因此只适合明确验证事件监听器或构造高层 API 无法表达的边界。常规点击、输入和选择仍应使用 Locator 操作。

## 操作参数

动作参数用于表达特殊产品合同，不应成为默认模板：

| 参数 | 用途与边界 | 同步与异步调用 |
| --- | --- | --- |
| `timeout` | 覆盖单次动作等待上限；长期超时应修复等待条件，而不是无限增大数值 | `button.click(timeout=5_000)` / `await button.click(timeout=5_000)` |
| `trial` | 只运行可操作性检查，不执行动作；适合诊断元素是否已可点击 | `button.click(trial=True)` / `await button.click(trial=True)` |
| `force` | 跳过部分非必要可操作性检查；仅在遮罩本身就是被测合同且有额外断言时使用 | `button.click(force=True)` / `await button.click(force=True)` |
| `position` | 在元素边界内指定相对坐标；DOM 元素优先语义定位，画布局部热点才使用 | `canvas.click(position={"x": 20, "y": 30})` / `await canvas.click(position={"x": 20, "y": 30})` |
| `modifiers` | 动作期间临时按住修饰键并在结束后恢复 | `link.click(modifiers=["ControlOrMeta"])` / `await link.click(modifiers=["ControlOrMeta"])` |
| `button` | 选择左、中、右键 | `row.click(button="right")` / `await row.click(button="right")` |
| `click_count` | 指定连续点击次数；语义明确的双击通常直接用 `dblclick()` | `cell.click(click_count=3)` / `await cell.click(click_count=3)` |
| `delay` | 指定按键或点击步骤之间的延迟；只在产品依赖时间间隔时使用 | `field.press("A", delay=50)` / `await field.press("A", delay=50)` |
| `steps` | 让 Locator 指针动作经过多个中间点并产生中间 `mousemove` 事件；拖拽轨迹需要渐进移动时使用 | `source.drag_to(target, steps=10)` / `await source.drag_to(target, steps=10)` |
| `scroll` | Playwright 1.62 的部分 Locator 动作可选择自动滚动或 `"none"`；禁用自动滚动后必须自行证明目标可达 | `button.click(scroll="none")` / `await button.click(scroll="none")` |

`no_wait_after` 不能作为统一的“关闭等待”开关：在若干输入动作上它已经不产生效果；点击与导航相关语义还可能随版本变化。迁移时删除无效参数，并针对业务结果使用 Web-first 断言；需要捕获下载、新页面或请求时，使用对应的 `expect_*` 事件上下文。

## 旧接口迁移

Page 选择器式动作会在每次调用时重新解析字符串选择器，官方已建议迁移到 Locator。除明确标记为 Deprecated 的 `type()` 外，多数属于 Discouraged；两者都不应继续写入新测试：

| 旧式调用 | Locator 写法 |
| --- | --- |
| `page.check(selector)` / `page.uncheck(selector)` / `page.set_checked(selector, value)` | `page.locator(selector).check()` / `.uncheck()` / `.set_checked(value)` |
| `page.click(selector)` / `page.dblclick(selector)` / `page.hover(selector)` / `page.tap(selector)` | `page.locator(selector).click()` / `.dblclick()` / `.hover()` / `.tap()` |
| `page.fill(selector, value)` / `page.press(selector, key)` / `page.focus(selector)` | `page.locator(selector).fill(value)` / `.press(key)` / `.focus()` |
| `page.select_option(selector, value)` | `page.locator(selector).select_option(value)` |
| `page.dispatch_event(selector, event)` | `page.locator(selector).dispatch_event(event)` |
| `page.type(selector, text)` | 按事件需求改为 `.fill(text)`、`.press_sequentially(text)` 或 `.press(key)` |

迁移不是机械替换：同时把 CSS 字符串升级为 role、label 或 test id 等稳定定位，并为动作后的用户可观察结果添加断言。

异步 API 使用完全相同的替代方向，但旧调用和新调用都属于浏览器 I/O，需要 `await`：

```python
# 旧式异步 Page 动作 → 异步 Locator 动作
await page.click("button.save")
await page.locator("button.save").click()

# 旧式逐键输入按产品事件合同迁移
await page.locator("#search").type("keyboard")
await page.get_by_role("searchbox").press_sequentially("keyboard")
```

上表每一行都同时覆盖同步和异步成员：`check`、`uncheck`、`set_checked`、`click`、`dblclick`、`hover`、`tap`、`fill`、`press`、`focus`、`select_option`、`dispatch_event` 与 `type`。区别只在异步浏览器 I/O 增加 `await`；Locator 构造 `page.locator(...)`、`page.get_by_*()` 本身不加 `await`。

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

## API 速查

下面的索引用于查漏和选型；主线能力仍以本篇前文的机制、示例和失败边界为准。方法名和公开签名参数按 Playwright Python 1.62.0 的同步 API 归类，异步 API 的对应关系在第二篇统一说明；参数行是完整索引，不等于逐项教程。

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 核心详解 | 正文简述 | 进阶路线 | 弃用迁移 |
| --- | --- | --- | --- | --- |
| `Keyboard` | `press()` | `down()`、`insert_text()`、`type()`、`up()` | — | — |
| `Locator` | `check()`、`click()`、`drag_to()`、`fill()`、`press()`、`select_option()`、`set_checked()`、`set_input_files()`、`uncheck()` | `blur()`、`clear()`、`dblclick()`、`dispatch_event()`、`drop()`、`focus()`、`hover()`、`press_sequentially()`、`select_text()`、`tap()` | — | `type()` |
| `Mouse` | `click()` | `dblclick()`、`down()`、`move()`、`up()`、`wheel()` | — | — |
| `Page` | — | `keyboard`、`mouse`、`touchscreen` | — | `check()`、`click()`、`dblclick()`、`dispatch_event()`、`fill()`、`focus()`、`hover()`、`press()`、`select_option()`、`set_checked()`、`tap()`、`type()`、`uncheck()` |
| `Touchscreen` | — | `tap()` | — | — |
| `Keyboard.down` 参数 | — | — | `key` | — |
| `Keyboard.insert_text` 参数 | — | — | `text` | — |
| `Keyboard.press` 参数 | — | — | `delay`, `key` | — |
| `Keyboard.type` 参数 | — | — | `delay`, `text` | — |
| `Keyboard.up` 参数 | — | — | `key` | — |
| `Locator.blur` 参数 | — | `timeout` | — | — |
| `Locator.check` 参数 | — | `force`, `position`, `scroll`, `timeout`, `trial` | — | `no_wait_after` |
| `Locator.clear` 参数 | — | `force`, `timeout` | — | `no_wait_after` |
| `Locator.click` 参数 | — | `button`, `click_count`, `delay`, `force`, `modifiers`, `position`, `scroll`, `steps`, `timeout`, `trial` | — | `no_wait_after` |
| `Locator.dblclick` 参数 | — | `button`, `delay`, `force`, `modifiers`, `position`, `scroll`, `steps`, `timeout`, `trial` | — | `no_wait_after` |
| `Locator.dispatch_event` 参数 | — | `timeout` | `event_init`, `type` | — |
| `Locator.drag_to` 参数 | — | `force`, `scroll`, `steps`, `timeout`, `trial` | `source_position`, `target`, `target_position` | `no_wait_after` |
| `Locator.drop` 参数 | — | `position`, `timeout` | `payload` | — |
| `Locator.fill` 参数 | — | `force`, `timeout` | `value` | `no_wait_after` |
| `Locator.focus` 参数 | — | `timeout` | — | — |
| `Locator.hover` 参数 | — | `force`, `modifiers`, `position`, `scroll`, `timeout`, `trial` | — | `no_wait_after` |
| `Locator.press` 参数 | — | `delay`, `timeout` | `key` | `no_wait_after` |
| `Locator.press_sequentially` 参数 | — | `delay`, `timeout` | `text` | `no_wait_after` |
| `Locator.select_option` 参数 | — | `force`, `timeout` | `element`, `index`, `label`, `value` | `no_wait_after` |
| `Locator.select_text` 参数 | — | `force`, `timeout` | — | — |
| `Locator.set_checked` 参数 | — | `force`, `position`, `scroll`, `timeout`, `trial` | `checked` | `no_wait_after` |
| `Locator.set_input_files` 参数 | — | `timeout` | `files` | `no_wait_after` |
| `Locator.tap` 参数 | — | `force`, `modifiers`, `position`, `scroll`, `timeout`, `trial` | — | `no_wait_after` |
| `Locator.type` 参数 | — | — | — | `delay`, `no_wait_after`, `text`, `timeout` |
| `Locator.uncheck` 参数 | — | `force`, `position`, `scroll`, `timeout`, `trial` | — | `no_wait_after` |
| `Mouse.click` 参数 | — | — | `button`, `click_count`, `delay`, `x`, `y` | — |
| `Mouse.dblclick` 参数 | — | — | `button`, `delay`, `x`, `y` | — |
| `Mouse.down` 参数 | — | — | `button`, `click_count` | — |
| `Mouse.move` 参数 | — | — | `steps`, `x`, `y` | — |
| `Mouse.up` 参数 | — | — | `button`, `click_count` | — |
| `Mouse.wheel` 参数 | — | — | `delta_x`, `delta_y` | — |
| `Page.check` 参数 | — | — | — | `force`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Page.click` 参数 | — | — | — | `button`, `click_count`, `delay`, `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Page.dblclick` 参数 | — | — | — | `button`, `delay`, `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Page.dispatch_event` 参数 | — | — | — | `event_init`, `selector`, `strict`, `timeout`, `type` |
| `Page.fill` 参数 | — | — | — | `force`, `no_wait_after`, `selector`, `strict`, `timeout`, `value` |
| `Page.focus` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Page.hover` 参数 | — | — | — | `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Page.press` 参数 | — | — | — | `delay`, `key`, `no_wait_after`, `selector`, `strict`, `timeout` |
| `Page.select_option` 参数 | — | — | — | `element`, `force`, `index`, `label`, `no_wait_after`, `selector`, `strict`, `timeout`, `value` |
| `Page.set_checked` 参数 | — | — | — | `checked`, `force`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Page.tap` 参数 | — | — | — | `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Page.type` 参数 | — | — | — | `delay`, `no_wait_after`, `selector`, `strict`, `text`, `timeout` |
| `Page.uncheck` 参数 | — | — | — | `force`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Touchscreen.tap` 参数 | — | — | `x`, `y` | — |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-fill-type deck:"Playwright" priority:2 tags:"表单,输入" %}
--- question
`fill()` 与 `press_sequentially()` 的主要区别是什么？
--- answer
`fill()` 设置完整值，`press_sequentially()` 逐键触发键盘事件。
--- explanation
普通文本输入优先使用 `fill()`；只有搜索建议、输入掩码或逐键事件属于产品合同，才需要逐键输入。
{% endflashcard %}

{% flashcard choice id:playwright-drag-choice deck:"Playwright" priority:2 tags:"拖拽,鼠标" answer:A %}
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

{% linkgroup %}
{% link Playwright Input, https://playwright.dev/python/docs/input, https://playwright.dev/img/playwright-logo.svg %}
{% link Locator API, https://playwright.dev/python/docs/api/class-locator, https://playwright.dev/img/playwright-logo.svg %}
{% link Mouse API, https://playwright.dev/python/docs/api/class-mouse, https://playwright.dev/img/playwright-logo.svg %}
{% link Keyboard API, https://playwright.dev/python/docs/api/class-keyboard, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

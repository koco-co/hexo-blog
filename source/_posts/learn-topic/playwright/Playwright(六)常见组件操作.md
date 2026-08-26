---
title: Playwright(六)常见组件操作
tags:
  - Playwright
  - iframe
  - 文件上传下载
  - 浏览器事件
categories:
  - Learn Topic
  - Playwright
description: 掌握新标签页、原生对话框、iframe、文件上传下载等常见组件的对象边界和事件等待方式，并通过完整结果断言避免遗漏瞬时事件。
cover: /img/picgo-images/playwright-course-cover.png
series: Playwright
series_order: 6
published: true
abbrlink: 8df5b6f3
date: 2026-08-24 12:07:00
---

{% course_series %}

{% note info flat %}
常见组件的难点不是 API 数量，而是动作跨越了哪个边界：新的 Page、浏览器原生 Dialog、Frame 或文件系统。先确定事件和对象归属，再在正确边界中使用 Locator。
{% endnote %}

## 事件顺序

{% note info flat %}
新页面、下载和文件选择器都是瞬时事件。等待必须在触发动作之前建立：
{% endnote %}

```python
with page.expect_popup() as popup_info:
    page.get_by_role("link", name="查看回执").click()

receipt_page = popup_info.value
```

通用顺序：

{% mermaid %}
sequenceDiagram
    participant Test as 测试
    participant Page as 当前页面
    participant Event as 浏览器事件
    Test->>Page: 注册 expect_* 等待
    Test->>Page: 执行触发动作
    Page-->>Event: 发出 popup/download 等事件
    Event-->>Test: 返回新对象
    Test->>Test: 在新边界中断言结果
{% endmermaid %}

{% note info flat %}
先点击再调用 `expect_*`，快速事件可能已经结束，测试只能等到超时。
{% endnote %}

## 窗口与对话框

{% note info flat %}
由当前 Page 打开的窗口使用 `expect_popup()`：
{% endnote %}

```python
from playwright.sync_api import Page, expect


def test_receipt_popup(page: Page) -> None:
    page.set_content("""
      <a href="about:blank" target="_blank">
        查看回执
      </a>
    """)

    with page.expect_popup() as popup_info:
        page.get_by_role("link", name="查看回执").click()

    receipt = popup_info.value
    receipt.set_content("<h1>订单回执 A-100</h1>")
    expect(receipt.get_by_role("heading", name="订单回执 A-100")).to_be_visible()
    receipt.close()
```

{% note info flat %}
如果新页面不是由某个已知 Page 触发，可以在 Context 上用 `context.expect_page()` 建立同样的先监听后触发边界；本篇只强调事件归属，多个会话和页面生命周期仍要由创建它们的 Context 管理。
{% endnote %}

{% note info flat %}
`pages[-1]` 只是在当前列表中取最后一项，无法证明它就是本次动作产生的页面。事件等待能明确因果关系。
{% endnote %}

### 原生对话框

{% note warning flat %}
JavaScript 的 `alert`、`confirm`、`prompt` 和 `beforeunload` 不属于 DOM，不能用 Locator 查找。注册处理器后必须接受或关闭。

如果没有注册监听器，Playwright 会自动关闭 Dialog；需要读取消息、输入 prompt 或验证业务结果时才显式注册。注册监听器后如果既不 `accept()` 也不 `dismiss()`，页面动作会被阻塞。`beforeunload` 也不是 DOM 元素，需要在关闭页面前监听并处理。
{% endnote %}

{% tabs Dialog 处理, 1 %}
<!-- tab alert -->
```python
dialog_messages = []


def handle_alert(dialog) -> None:
    assert dialog.type == "alert"
    dialog_messages.append(dialog.message)
    dialog.accept()


page.once("dialog", handle_alert)
page.evaluate("alert('订单已提交')")
assert dialog_messages == ["订单已提交"]
```
<!-- endtab -->

<!-- tab confirm -->
```python
def handle_confirm(dialog) -> None:
    assert dialog.type == "confirm"
    assert dialog.message == "确定删除订单 A-100？"
    dialog.accept()


page.once("dialog", handle_confirm)
page.get_by_role("button", name="删除订单").click()
expect(page.get_by_role("status")).to_have_text("订单已删除")
```
<!-- endtab -->

<!-- tab prompt -->
```python
page.set_content("""
  <button onclick="const reason = prompt('取消原因');
                    document.querySelector('[role=status]').textContent = reason;">
    取消订单
  </button>
  <p role="status">未取消</p>
""")

def handle_prompt(dialog) -> None:
    assert dialog.type == "prompt"
    dialog.accept("取消原因")


page.once("dialog", handle_prompt)
page.get_by_role("button", name="取消订单").click()
expect(page.get_by_role("status")).to_have_text("取消原因")
```
<!-- endtab -->

<!-- tab dismiss -->
```python
page.once("dialog", lambda dialog: dialog.dismiss())
page.get_by_role("button", name="删除订单").click()
expect(page.get_by_role("status")).to_have_text("已保留订单")
```
<!-- endtab -->
{% endtabs %}

{% note info flat %}
`beforeunload` 的处理方式如下：
{% endnote %}

```python
def handle_beforeunload(dialog) -> None:
    assert dialog.type == "beforeunload"
    dialog.dismiss()


page.on("dialog", handle_beforeunload)
page.close(run_before_unload=True)
```

{% note warning flat %}
`beforeunload` 的处理只适用于确实需要验证离开保护的页面；普通测试不应为了关闭页面而强行打开该流程。
{% endnote %}

## 嵌入与文件

{% note info flat %}
iframe 有独立文档上下文。定位范围和语义组合应保持在 `FrameLocator` 中；本篇只补充 Frame 生命周期、动态文档和文件事件的边界。
{% endnote %}

{% note warning flat %}
如果 iframe 被替换、重载或移除，缓存的 Frame 可能变成分离对象；`is_detached()` 只用于诊断，稳定交互应重新取得范围。跨域 iframe 仍受页面自身 CSP、授权和第三方安全流程约束。
{% endnote %}

{% note info flat %}
已拿到当前 Frame 对象时，可以读取其范围内的元数据或语义状态；不要把它当成长期缓存的 DOM 容器。
{% endnote %}

```python
main_frame = page.main_frame
expect(main_frame.get_by_role("heading", name="结算")).to_be_visible()
```

{% note info flat %}
跨导航或动态 iframe 优先重新取得 `page.frame_locator()` 或 `locator.content_frame`，让 Playwright 在动作时重新确认目标。
{% endnote %}

### Frame 对象

{% note info flat %}
`Frame` 是已经解析出的文档对象，适合在需要读取当前 frame 元数据或调试生命周期时使用；常规交互仍优先从 `FrameLocator` 开始。下面的例子让同一个 `Frame` 对象覆盖核心语义入口：
{% endnote %}

```python
frame = page.main_frame
frame.set_content("""
  <h1>结算</h1>
  <label>收件人 <input placeholder="姓名"></label>
  <button data-testid="submit">提交</button>
  <p>订单 A-100</p>
  <iframe title="税费"></iframe>
""")

frame.get_by_label("收件人").fill("Alice")
frame.get_by_role("button", name="提交").click()
expect(frame.get_by_text("订单 A-100")).to_be_visible()
frame.locator("[data-testid='submit']").click()
tax_frame = frame.frame_locator("iframe[title='税费']")
```

{% note info flat %}
当用户语义不足但属性稳定时，`Frame` 也提供同一组补充入口：
{% endnote %}

| 入口 | 适用边界 |
| --- | --- |
| `get_by_alt_text()` | 图片替代文本是稳定合同时使用 |
| `get_by_placeholder()` | 输入框暂时没有 label，且占位文本受产品约束时使用 |
| `get_by_test_id()` | 组件没有稳定用户语义，但团队维护测试 ID 时使用 |
| `get_by_title()` | title 是明确交互提示，而不是偶然 DOM 属性时使用 |
| `goto()` | 需要从已知 Frame 导航并控制 `wait_until`、`timeout` 或 `referer` 时使用；普通页面导航优先 `Page.goto()` |

{% note info flat %}
这些入口的 `exact`、`text`、`test_id`、`selector` 等参数完整列在本文索引中；参数只改变匹配或导航边界，不改变 Frame 的生命周期规则。
{% endnote %}

### 旧式 Frame API

{% note info flat %}
Frame 上直接接收 CSS selector 的 `click()`、`fill()`、`press()`、`type()`、`select_option()`、`set_checked()`、`set_input_files()`、`query_selector*()`、`wait_for_selector()` 和 `wait_for_timeout()` 等接口已进入迁移清单。迁移原则是先把 selector 转成 Locator，再使用同名 Locator 操作或 Web-first 断言：
{% endnote %}

```python
# 旧式写法（同步/异步分别对应同名 await 调用）
frame.click("button.submit")

# 当前写法
submit = page.frame_locator("iframe[title='支付']").get_by_role(
    "button", name="提交"
)
submit.click()
expect(submit).to_be_enabled()
```

{% note info flat %}
迁移时按行为选择替代项，而不是机械替换方法名：
{% endnote %}

| 旧式接口 | 当前替代项 | 边界 |
| --- | --- | --- |
| `Frame.expect_navigation()` | `Frame.wait_for_url()`、`Page.expect_popup()` 或对应 `expect_*` 事件 | 导航由哪个 Page/Frame 触发就在哪个边界等待；不要把导航等待和业务断言混为一谈 |
| `Frame.wait_for_selector()` | `frame.locator(selector).wait_for()` 或 `expect(locator)` | 等待可见性、数量或文本等业务状态，避免只等待 DOM 出现 |
| `Frame.wait_for_timeout()` | Web-first 断言、URL、请求或业务状态等待 | 固定睡眠只能用于诊断，不应作为稳定测试同步手段 |
| `Frame.query_selector()` / `query_selector_all()` | `frame.locator(selector)`、`all()`、`count()`、`nth()` | Locator 会重新查询并保留 Actionability；句柄只适合底层兼容 |
| `Frame.drag_and_drop()` | `frame.locator(source).drag_to(frame.locator(target))` | 把拖拽的两个业务目标都表达为 Locator |
| `Frame.eval_on_selector()` / `eval_on_selector_all()` | `frame.locator(selector).evaluate()` / `evaluate_all()` | 仅做没有对应 Playwright API 的只读诊断，不用脚本绕过交互检查 |

{% note info flat %}
普通的 selector/action 迁移也要逐项落实，不能只把它们留在索引中：
{% endnote %}

| 迁移组 | 旧式 Frame 成员 | 当前替代项与边界 |
| --- | --- | --- |
| 动作 | `check()`、`dblclick()`、`dispatch_event()`、`focus()`、`hover()`、`tap()`、`uncheck()` | `frame.locator(selector).check()`、`.dblclick()`、`.dispatch_event()`、`.focus()`、`.hover()`、`.tap()`、`.uncheck()`；动作参数改由 Locator 的 Actionability 和 timeout 处理 |
| 读取 | `get_attribute()`、`inner_html()`、`inner_text()`、`input_value()`、`text_content()` | `frame.locator(selector).get_attribute()`、`.inner_html()`、`.inner_text()`、`.input_value()`、`.text_content()`；展示文本和输入值优先使用 `expect(locator).to_have_text()` / `to_have_value()` |
| 状态 | `is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()` | `frame.locator(selector).is_checked()`、`.is_disabled()`、`.is_editable()`、`.is_enabled()`、`.is_hidden()`、`.is_visible()`；需要稳定等待时改用对应 Web-first 断言 |

{% note info flat %}
旧接口的 `selector`、`strict`、`timeout`、动作参数和 `no_wait_after` 等完整签名仍保留在 API 索引中，便于维护历史套件；新代码不应为了绕过严格模式或 Actionability 把 selector API 重新引入。
{% endnote %}

### 文件上传

{% note info flat %}
已知 `<input type="file">` 的普通上传由语义 Locator 调用 `set_input_files()` 负责；动态创建输入框时才需要 `expect_file_chooser()`。本节只保留事件对象、单/多文件边界和受控路径说明。
{% endnote %}

{% note info flat %}
动态创建 file input 时，等待文件选择器事件：
{% endnote %}

```python
page.set_content("""
  <button onclick="const input = document.createElement('input');
                   input.type = 'file';
                   document.body.append(input);
                   input.click();">
    选择文件
  </button>
""")

with page.expect_file_chooser() as chooser_info:
    page.get_by_role("button", name="选择文件").click()

chooser = chooser_info.value
assert chooser.page == page
assert chooser.is_multiple() is False
assert chooser.element is not None
chooser.set_files("tests/fixtures/orders.csv")
```

{% note info flat %}
`FileChooser.page` 用于确认事件属于哪个 Page，`is_multiple()` 用于决定测试数据是单文件还是文件列表；`is_multiple()` 为真时传入文件列表。`element` 只在需要兼容底层 DOM 句柄时读取。路径相对于当前工作目录或测试 Fixture 约定的根目录解析，普通上传仍应优先直接对 Locator 调用 `set_input_files()`。
{% endnote %}

### 文件下载

{% note info flat %}
下载事件同样需要先监听：
{% endnote %}

```python
def test_download_receipt(page: Page) -> None:
    page.set_content("""
      <a download="receipt.txt" href="data:text/plain,order%20A-100">
        下载回执
      </a>
    """)

    with page.expect_download() as download_info:
        page.get_by_role("link", name="下载回执").click()

    download = download_info.value
    assert download.suggested_filename == "receipt.txt"
    assert download.path().read_text(encoding="utf-8") == "order A-100"
```

{% note info flat %}
需要作为 CI 产物保留时显式保存：
{% endnote %}

```python
download.save_as("test-results/receipt.txt")
```

{% note primary flat %}
Context 关闭后临时下载文件会被清理。保存前检查文件名，避免把页面提供的未验证路径直接用于敏感位置。
{% endnote %}

#### 下载边界

{% note info flat %}
完成下载后，`suggested_filename`、`url`、`page` 和 `path()` 用于结果核对；`failure()` 返回下载失败原因或 `None`。`save_as()` 把临时文件复制到受控产物目录，`cancel()` 适用于业务明确取消下载的场景，`delete()` 适用于不再需要保留临时文件的清理流程：
{% endnote %}

```python
assert download.page == page
assert download.url.startswith("data:")
assert download.failure() is None
assert download.path().exists()
download.save_as("test-results/receipt.txt")
```

{% note warning flat %}
不要把 `path()` 当作长期稳定路径，也不要在未判断 `failure()` 前断言文件内容；这些属性和清理方法属于下载生命周期的补充能力，不替代 `expect_download()` 的事件顺序。远程连接或 BrowserServer 场景下临时路径可能无法直接访问，优先使用 `save_as()` 把文件保存到测试产物目录。
{% endnote %}

## 复杂控件

{% note info flat %}
原生输入可以直接填入浏览器接受的格式：
{% endnote %}

```python
page.get_by_label("配送日期").fill("2026-08-30")
expect(page.get_by_label("配送日期")).to_have_value("2026-08-30")
```

{% note info flat %}
自定义日期选择器应按按钮、网格和选项角色操作：
{% endnote %}

```python
page.get_by_role("button", name="选择配送日期").click()
page.get_by_role("gridcell", name="30").click()
```

{% note info flat %}
如果业务依赖系统时间、计时器或倒计时，使用 Clock API 的进阶方案，按需纳入时间控制专项。
{% endnote %}

## 验证与扩展

| 场景 | 监听或范围 | 最终验证 |
| --- | --- | --- |
| 新标签页 | `expect_popup()` 或 `context.expect_page()` | 新 Page 的标题、URL 或内容 |
| Dialog | `page.once("dialog", handler)` | 消息、处理选择及页面结果 |
| iframe | `frame_locator()` | Frame 内业务状态 |
| 文件选择器 | `expect_file_chooser()` | 已选文件及页面反馈 |
| 下载 | `expect_download()` | 文件名、内容或保存产物 |

{% note warning flat %}
事件成功只证明浏览器产生了对象，不等于业务成功。新页面还要断言内容，下载还要验证文件，Dialog 还要验证接受或拒绝后的结果。
{% endnote %}

### 进阶能力

{% note info flat %}
以下能力用于组件生命周期、跨文档诊断或底层兼容，不是常规页面交互的默认入口。先确认普通 Locator、Web-first 断言和 `FrameLocator` 无法表达目标，再进入对应能力组；每组的成员和参数都在 API 索引中保留。
{% endnote %}

#### Frame 生命周期

{% note info flat %}
当问题涉及文档树而不是某个控件时，使用 `parent_frame`、`child_frames`、`frame_element`、`name`、`page`、`url` 和 `is_detached` 观察关系与生命周期。`content()`、`title()`、`set_content()` 用于受控页面的内容读取或构造，`wait_for_load_state()`、`wait_for_url()`、`wait_for_function()` 用于明确的加载条件；不要用它们替代组件级断言。`add_script_tag()`、`add_style_tag()`、`evaluate()` 和 `evaluate_handle()` 只在调试、注入测试桩或缺少等价 Playwright API 时使用，并记录脚本的副作用。
{% endnote %}

#### Dialog/Download

{% note info flat %}
`Dialog.default_value` 只对 prompt 的默认文本有意义，`Dialog.page` 用于回溯所属 Page；`Download.cancel()`、`delete()` 和 `failure()` 属于取消、清理和错误诊断。它们必须放在已建立 `expect_*` 事件范围之后，不能代替前文的最终业务断言。
{% endnote %}

#### Page 与 Locator

{% note info flat %}
`Page.frames`、`main_frame` 和 `opener` 用于枚举文档、确认打开者或排查 Page 生命周期；普通 iframe 交互优先 `frame_locator()`，新标签页优先 `expect_popup()` / `context.expect_page()`。`Locator.content_frame` 用于从一个已定位的 iframe 取得当前 Frame，`Locator.screenshot()` 用于组件级取证或视觉专项；稳定基线和差异阈值应纳入视觉回归流程。
{% endnote %}

#### 参数进入条件

{% note info flat %}
Frame 的导航参数围绕 `url`、`wait_until`、`timeout`、`referer`；脚本注入参数围绕 `content`、`path`、`type`、`url`；条件等待参数围绕 `expression`、`arg`、`polling`、`timeout`。Dialog、Download、FileChooser 和 Page 事件参数分别表达输入文本、目标路径、文件数据、谓词与超时。它们按对象和父方法分组列出，读者应先确定生命周期边界，再选择参数，不要把进阶参数当成核心 API 清单逐个背诵。
{% endnote %}

## 接口边界

{% note info flat %}
以下索引按 Playwright Python 1.62.0 的同步 API 归类，方便在具体场景中选择对象、成员和参数；它是查询表，不替代前文的机制、示例与失败边界。异步 API 只在实际执行 I/O 时使用 await。
{% endnote %}

{% folding cyan, 查看本文 API 索引 %}

| 对象 | 主线成员 | 常用成员 | 扩展成员与参数 | 替代写法 |
| --- | --- | --- | --- | --- |
| `Dialog` | — | — | `accept()`、`default_value`、`dismiss()`、`message`、`page`、`type` | — |
| `Download` | — | — | `cancel()`、`delete()`、`failure()`、`page`、`path()`、`save_as()`、`suggested_filename`、`url` | — |
| `FileChooser` | — | `element`、`is_multiple()`、`page`、`set_files()` | — | — |
| `Frame` | `frame_locator()`、`get_by_label()`、`get_by_role()`、`get_by_text()`、`locator()` | `get_by_alt_text()`、`get_by_placeholder()`、`get_by_test_id()`、`get_by_title()`、`goto()` | `add_script_tag()`、`add_style_tag()`、`child_frames`、`content()`、`evaluate()`、`evaluate_handle()`、`frame_element()`、`is_detached()`、`name`、`page`、`parent_frame`、`set_content()`、`title()`、`url`、`wait_for_function()`、`wait_for_load_state()`、`wait_for_url()` | `check()`、`click()`、`dblclick()`、`dispatch_event()`、`drag_and_drop()`、`eval_on_selector()`、`eval_on_selector_all()`、`expect_navigation()`、`fill()`、`focus()`、`get_attribute()`、`hover()`、`inner_html()`、`inner_text()`、`input_value()`、`is_checked()`、`is_disabled()`、`is_editable()`、`is_enabled()`、`is_hidden()`、`is_visible()`、`press()`、`query_selector()`、`query_selector_all()`、`select_option()`、`set_checked()`、`set_input_files()`、`tap()`、`text_content()`、`type()`、`uncheck()`、`wait_for_selector()`、`wait_for_timeout()` |
| `Locator` | — | — | `content_frame`、`screenshot()` | — |
| `Page` | `expect_download()`、`expect_popup()` | — | `expect_file_chooser()`、`frames`、`main_frame`、`opener()` | `set_input_files()` |
| `Dialog.accept` 参数 | — | — | `prompt_text` | — |
| `Download.save_as` 参数 | — | — | `path` | — |
| `FileChooser.set_files` 参数 | — | — | `files`, `no_wait_after`, `timeout` | — |
| `Frame.add_script_tag` 参数 | — | — | `content`, `path`, `type`, `url` | — |
| `Frame.add_style_tag` 参数 | — | — | `content`, `path`, `url` | — |
| `Frame.check` 参数 | — | — | — | `force`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Frame.click` 参数 | — | — | — | `button`, `click_count`, `delay`, `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Frame.dblclick` 参数 | — | — | — | `button`, `delay`, `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Frame.dispatch_event` 参数 | — | — | — | `event_init`, `selector`, `strict`, `timeout`, `type` |
| `Frame.drag_and_drop` 参数 | — | — | — | `force`, `no_wait_after`, `scroll`, `source`, `source_position`, `steps`, `strict`, `target`, `target_position`, `timeout`, `trial` |
| `Frame.eval_on_selector` 参数 | — | — | — | `arg`, `expression`, `selector`, `strict` |
| `Frame.eval_on_selector_all` 参数 | — | — | — | `arg`, `expression`, `selector` |
| `Frame.evaluate` 参数 | — | — | `arg`, `expression` | — |
| `Frame.evaluate_handle` 参数 | — | — | `arg`, `expression` | — |
| `Frame.expect_navigation` 参数 | — | — | — | `timeout`, `url`, `wait_until` |
| `Frame.fill` 参数 | — | — | — | `force`, `no_wait_after`, `selector`, `strict`, `timeout`, `value` |
| `Frame.focus` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.frame_locator` 参数 | — | — | `selector` | — |
| `Frame.get_attribute` 参数 | — | — | — | `name`, `selector`, `strict`, `timeout` |
| `Frame.get_by_alt_text` 参数 | — | `exact` | `text` | — |
| `Frame.get_by_label` 参数 | — | `exact` | `text` | — |
| `Frame.get_by_placeholder` 参数 | — | `exact` | `text` | — |
| `Frame.get_by_role` 参数 | — | `checked`, `description`, `disabled`, `exact`, `expanded`, `include_hidden`, `level`, `name`, `pressed`, `selected` | `role` | — |
| `Frame.get_by_test_id` 参数 | — | — | `test_id` | — |
| `Frame.get_by_text` 参数 | — | `exact` | `text` | — |
| `Frame.get_by_title` 参数 | — | `exact` | `text` | — |
| `Frame.goto` 参数 | — | — | `referer`, `timeout`, `url`, `wait_until` | — |
| `Frame.hover` 参数 | — | — | — | `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Frame.inner_html` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.inner_text` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.input_value` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.is_checked` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.is_disabled` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.is_editable` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.is_enabled` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.is_hidden` 参数 | — | — | — | `selector`, `strict` |
| `Frame.is_visible` 参数 | — | — | — | `selector`, `strict` |
| `Frame.locator` 参数 | — | `has`, `has_not`, `has_not_text`, `has_text` | `selector` | — |
| `Frame.press` 参数 | — | — | — | `delay`, `key`, `no_wait_after`, `selector`, `strict`, `timeout` |
| `Frame.query_selector` 参数 | — | — | — | `selector`, `strict` |
| `Frame.query_selector_all` 参数 | — | — | — | `selector` |
| `Frame.select_option` 参数 | — | — | — | `element`, `force`, `index`, `label`, `no_wait_after`, `selector`, `strict`, `timeout`, `value` |
| `Frame.set_checked` 参数 | — | — | — | `checked`, `force`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Frame.set_content` 参数 | — | — | `html`, `timeout`, `wait_until` | — |
| `Frame.set_input_files` 参数 | — | — | — | `files`, `no_wait_after`, `selector`, `strict`, `timeout` |
| `Frame.tap` 参数 | — | — | — | `force`, `modifiers`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Frame.text_content` 参数 | — | — | — | `selector`, `strict`, `timeout` |
| `Frame.type` 参数 | — | — | — | `delay`, `no_wait_after`, `selector`, `strict`, `text`, `timeout` |
| `Frame.uncheck` 参数 | — | — | — | `force`, `no_wait_after`, `position`, `scroll`, `selector`, `strict`, `timeout`, `trial` |
| `Frame.wait_for_function` 参数 | — | — | `arg`, `expression`, `polling`, `timeout` | — |
| `Frame.wait_for_load_state` 参数 | — | — | `state`, `timeout` | — |
| `Frame.wait_for_selector` 参数 | — | — | — | `selector`, `state`, `strict`, `timeout` |
| `Frame.wait_for_timeout` 参数 | — | — | — | `timeout` |
| `Frame.wait_for_url` 参数 | — | — | `timeout`, `url`, `wait_until` | — |
| `Locator.screenshot` 参数 | — | — | `animations`, `caret`, `mask`, `mask_color`, `omit_background`, `path`, `quality`, `scale`, `style`, `timeout`, `type` | — |
| `Page.expect_download` 参数 | — | — | `predicate`, `timeout` | — |
| `Page.expect_file_chooser` 参数 | — | — | `predicate`, `timeout` | — |
| `Page.expect_popup` 参数 | — | — | `predicate`, `timeout` | — |
| `Page.set_input_files` 参数 | — | — | — | `files`, `no_wait_after`, `selector`, `strict`, `timeout` |

{% endfolding %}

## 常见问题

{% flashcard basic id:playwright-event-order deck:"Playwright" priority:1 tags:"浏览器事件,组件" %}
--- question
为什么 popup、download 和 file chooser 都要先建立等待再触发动作？
--- answer
它们是可能瞬间结束的浏览器事件。
--- explanation
先触发再监听可能错过事件；`with page.expect_*()` 把监听与触发动作组织成明确的因果范围，并返回对应对象。
{% endflashcard %}

{% flashcard choice id:playwright-iframe-scope deck:"Playwright" priority:2 tags:"iframe,FrameLocator" answer:B %}
--- question
页面包含支付 iframe，应该如何定位其中的确认按钮？
- [A] 直接在 Page 上使用全局文本定位
- [B] 先获得 FrameLocator，再在其中使用角色定位
- [C] 使用固定坐标点击 iframe 区域
--- answer
B
--- explanation
iframe 是独立文档。FrameLocator 明确切换搜索范围，并保留 Locator 的重新查询和自动等待能力。
{% endflashcard %}

{% flashcard basic id:playwright-download-lifecycle deck:"Playwright" priority:2 tags:"下载,生命周期" %}
--- question
`expect_download()` 返回 Download 对象后，还要验证哪些边界？
--- answer
先判断 `failure()`，再按运行环境选择 `path()` 或 `save_as()`，并在 Context 关闭前完成读取或保存。
--- explanation
下载事件只证明对象已产生；临时路径受生命周期和远程连接影响，保存到受控目录比长期依赖临时路径更稳定。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Playwright Pages, https://playwright.dev/python/docs/pages, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Dialogs, https://playwright.dev/python/docs/dialogs, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Frames, https://playwright.dev/python/docs/frames, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Downloads, https://playwright.dev/python/docs/downloads, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Input, https://playwright.dev/python/docs/input, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

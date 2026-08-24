---
title: Playwright文档(六) 常见组件操作
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

常见组件的难点不是 API 数量，而是动作跨越了哪个边界：新的 Page、浏览器原生 Dialog、Frame 或文件系统。先确定事件和对象归属，再在正确边界中使用 Locator。

## 事件顺序

新页面、下载和文件选择器都是瞬时事件。等待必须在触发动作之前建立：

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

先点击再调用 `expect_*`，快速事件可能已经结束，测试只能等到超时。

## 新标签页

由当前 Page 打开的窗口使用 `expect_popup()`：

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

如果新页面不是由某个已知 Page 触发，可以在 Context 上等待：

```python
with page.context.expect_page() as page_info:
    page.get_by_role("button", name="打开帮助中心").click()

help_page = page_info.value
help_page.wait_for_load_state("domcontentloaded")
```

`pages[-1]` 只是在当前列表中取最后一项，无法证明它就是本次动作产生的页面。事件等待能明确因果关系。

## 原生对话框

JavaScript 的 `alert`、`confirm`、`prompt` 和 `beforeunload` 不属于 DOM，不能用 Locator 查找。注册处理器后必须接受或关闭：

{% tabs Dialog 处理, 1 %}
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
def handle_prompt(dialog) -> None:
    assert dialog.type == "prompt"
    dialog.accept("取消原因")


page.once("dialog", handle_prompt)
page.get_by_role("button", name="取消订单").click()
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

注册 Dialog 监听器后如果既不 `accept()` 也不 `dismiss()`，页面动作会被阻塞。处理器中先检查类型和消息，再决定操作。

## iframe

iframe 有独立文档上下文。使用 `frame_locator()` 进入范围，之后继续使用语义 Locator：

```python
def test_payment_frame(page: Page) -> None:
    page.set_content("""
      <iframe title="支付组件" srcdoc="
        <label>卡号 <input></label>
        <button>确认支付</button>
        <p role='status'>待支付</p>
        <script>
          document.querySelector('button').onclick = () => {
            document.querySelector('[role=status]').textContent = '支付成功';
          };
        </script>
      "></iframe>
    """)

    payment = page.frame_locator("iframe[title='支付组件']")
    payment.get_by_label("卡号").fill("4111 1111 1111 1111")
    payment.get_by_role("button", name="确认支付").click()

    expect(payment.get_by_role("status")).to_have_text("支付成功")
```

多个 Frame 中内容相同时，先稳定定位 iframe 元素：

```python
shipping = page.frame_locator("iframe[title='配送地址']")
shipping.get_by_label("城市").fill("上海")
```

`page.get_by_text()` 不会自动跨入 iframe。跨域 iframe 仍可通过 Playwright 操作，但页面自身的 CSP、授权和第三方安全流程仍然有效。

如果 Frame 会重载，优先使用 FrameLocator。缓存旧 Frame 后再操作，可能得到分离或导航后的失效对象。

## 文件上传

有 `<input type="file">` 时使用 `set_input_files()`，即使输入框在视觉上隐藏：

```python
def test_upload_csv(page: Page) -> None:
    page.set_content("""
      <label>导入订单 <input type="file" accept=".csv"></label>
      <output></output>
      <script>
        document.querySelector('input').onchange = event => {
          document.querySelector('output').textContent = event.target.files[0].name;
        };
      </script>
    """)

    page.get_by_label("导入订单").set_input_files({
        "name": "orders.csv",
        "mimeType": "text/csv",
        "buffer": b"id,total\nA-100,199\n",
    })

    expect(page.locator("output")).to_have_text("orders.csv")
```

文件也可以来自测试项目的受控路径：

```python
page.get_by_label("上传头像").set_input_files("tests/fixtures/avatar.png")
```

清空文件选择：

```python
page.get_by_label("上传头像").set_input_files([])
```

如果点击自定义按钮后才动态创建 file input，等待文件选择器事件：

```python
with page.expect_file_chooser() as chooser_info:
    page.get_by_role("button", name="选择文件").click()

chooser_info.value.set_files("tests/fixtures/orders.csv")
```

## 文件下载

下载事件同样需要先监听：

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

需要作为 CI 产物保留时显式保存：

```python
download.save_as("test-results/receipt.txt")
```

Context 关闭后临时下载文件会被清理。保存前检查文件名，避免把页面提供的未验证路径直接用于敏感位置。

## 日期与时间控件

原生输入可以直接填入浏览器接受的格式：

```python
page.get_by_label("配送日期").fill("2026-08-30")
expect(page.get_by_label("配送日期")).to_have_value("2026-08-30")
```

自定义日期选择器应按按钮、网格和选项角色操作：

```python
page.get_by_role("button", name="选择配送日期").click()
page.get_by_role("gridcell", name="30").click()
```

如果业务依赖系统时间、计时器或倒计时，使用 Clock API 的进阶方案，见第十一篇。

## 组件检查

| 场景 | 监听或范围 | 最终验证 |
| --- | --- | --- |
| 新标签页 | `expect_popup()` 或 `context.expect_page()` | 新 Page 的标题、URL 或内容 |
| Dialog | `page.once("dialog", handler)` | 消息、处理选择及页面结果 |
| iframe | `frame_locator()` | Frame 内业务状态 |
| 文件选择器 | `expect_file_chooser()` | 已选文件及页面反馈 |
| 下载 | `expect_download()` | 文件名、内容或保存产物 |

事件成功只证明浏览器产生了对象，不等于业务成功。新页面还要断言内容，下载还要验证文件，Dialog 还要验证接受或拒绝后的结果。

## 常见问题

{% flashcard basic id:playwright-event-order deck:"Playwright" tags:"浏览器事件,组件" %}
--- question
为什么 popup、download 和 file chooser 都要先建立等待再触发动作？
--- answer
它们是可能瞬间结束的浏览器事件。
--- explanation
先触发再监听可能错过事件；`with page.expect_*()` 把监听与触发动作组织成明确的因果范围，并返回对应对象。
{% endflashcard %}

{% flashcard choice id:playwright-iframe-scope deck:"Playwright" tags:"iframe,FrameLocator" answer:B %}
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

## 参考资料

{% linkgroup %}
{% link Playwright Pages, https://playwright.dev/python/docs/pages, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Dialogs, https://playwright.dev/python/docs/dialogs, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Frames, https://playwright.dev/python/docs/frames, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Downloads, https://playwright.dev/python/docs/downloads, https://playwright.dev/img/playwright-logo.svg %}
{% link Playwright Input, https://playwright.dev/python/docs/input, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

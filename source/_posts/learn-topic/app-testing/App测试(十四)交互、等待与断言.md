---
title: App测试(十四)交互、等待与断言
tags:
  - App测试
  - 交互、等待与断言
categories:
  - Learn Topic
  - App测试
description: 把 Appium 定位结果组织为可靠的点击、输入、手势、等待、断言和失败证据。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 14
published: true
abbrlink: 2f02a034
date: 2026-08-26 00:00:00
---

{% note primary flat %}
自动化用例的核心不是把人工动作翻译成代码，而是同步业务状态并验证结果。每个动作都要知道目标元素、可接受状态、等待条件、断言对象和失败工件。
{% endnote %}

{% course_series %}

## 元素交互

### 点击与输入

~~~python
from appium.webdriver.common.appiumby import AppiumBy

save = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Save")
save.click()

field = driver.find_element(AppiumBy.ID, "com.example.demo:id/title")
field.clear()
field.send_keys("Example")
~~~

{% note info flat %}
点击或输入后立即检查业务状态，例如按钮状态、错误提示或页面转移。只验证命令没有抛异常，无法证明点击了正确对象或输入被应用接受。
{% endnote %}

### 状态读取

| 属性 | 适合断言 | 失败线索 |
| --- | --- | --- |
| displayed | 用户是否看得到 | 被遮挡、滚动位置错误 |
| enabled | 当前是否可操作 | 前置未完成或权限拒绝 |
| selected/checked | 选择是否生效 | 状态只变视觉颜色 |
| text | 业务文案和结果 | 多语言或异步更新 |
| location/size | 特殊布局诊断 | 不作为常规业务断言 |

{% note warning flat %}
剪贴板、键盘和弹窗会改变焦点。输入异常时先读取当前焦点、控件值和系统状态，再决定清空重试或改用直接输入。
{% endnote %}

## 手势模型

{% mermaid %}
sequenceDiagram
  participant T as 测试
  participant D as Appium Driver
  participant A as Android
  T->>D: pointer move
  D->>A: W3C actions
  T->>D: pointer down/up
  D->>A: 手势事件
  A-->>D: 页面状态变化
  D-->>T: 结果与证据
{% endmermaid %}

{% note info flat %}
图失效时仍按 move→down→up→页面状态→断言执行。动作完成后释放 actions 并让页面回到已知位置，避免上一轮手势影响下一轮。
{% endnote %}

### W3C Actions

~~~python
from selenium.webdriver.common.actions.action_builder import ActionBuilder
from selenium.webdriver.common.actions.pointer_input import PointerInput

finger = PointerInput(PointerInput.TOUCH, "finger")
actions = ActionBuilder(driver, mouse=finger)
actions.pointer_action.move_to_location(500, 1400)
actions.pointer_action.pointer_down()
actions.pointer_action.move_to_location(500, 400, duration=700)
actions.pointer_action.pointer_up()
actions.perform()
~~~

### 移动手势

| 手势 | 输入 | 验证 |
| --- | --- | --- |
| 滑动 | 起点、终点、持续时间 | 目标节点出现且位置合理 |
| 长按 | 元素或坐标、时长 | 菜单或选中状态 |
| 多指 | 多个 pointer 序列 | 缩放结果和边界 |
| 拖拽 | 按下、移动、释放 | 对象落点和数据状态 |

{% note warning flat %}
坐标和时长都受设备密度、动画和性能影响。优先使用元素区域或移动端扩展手势；参数失配时保存页面、设备和动作 JSON，不用增加重试掩盖漂移。
{% endnote %}

## 弹窗处理

### 系统弹窗

| 类型 | 触发 | 处理 |
| --- | --- | --- |
| 权限 | 首次能力请求 | 允许、拒绝和设置页回归 |
| 键盘 | 输入框获得焦点 | 关闭后确认焦点和布局 |
| 系统提示 | 蓝牙、定位或版本提示 | 只在测试环境处理并记录 |
| App 弹窗 | 业务确认和错误 | 通过语义定位，不点击固定坐标 |

~~~python
try:
    dialog = driver.find_element(AppiumBy.ID, "android:id/alertTitle")
    print(dialog.text)
    driver.find_element(AppiumBy.ID, "android:id/button1").click()
except Exception:
    pass
~~~

{% note warning flat %}
不要用宽泛的异常吞掉所有弹窗失败。测试应区分“弹窗本来不应出现”“出现了可接受提示”和“出现未知系统弹窗”，并保存当前页面和日志。
{% endnote %}

## 等待策略

### 显式等待

~~~python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

wait = WebDriverWait(driver, 15)
submit = wait.until(
    EC.element_to_be_clickable(
        (AppiumBy.ACCESSIBILITY_ID, "Submit")
    )
)
submit.click()
result = wait.until(
    EC.visibility_of_element_located(
        (AppiumBy.ID, "com.example.demo:id/result")
    )
)
~~~

{% note primary flat %}
显式等待应等待业务可观察条件，例如元素可操作、加载消失、结果出现或文本改变。等待超时是证据，不应无条件加长超时或重复点击。
{% endnote %}

### 隐式等待

| 方式 | 优点 | 风险 |
| --- | --- | --- |
| 隐式等待 | 查找代码简单 | 影响所有查找，叠加显式等待后难诊断 |
| 显式等待 | 条件清晰、超时可解释 | 需要为状态选择条件 |
| 固定 sleep | 写法简单 | 与设备速度无关，制造脆弱性 |
| 重试点击 | 可能跨过短暂抖动 | 可能重复提交业务 |

{% note warning flat %}
同一套用例应明确隐式等待策略，避免全局隐式等待和条件等待互相叠加。固定 sleep 只能用于无法观察的短动画，并要记录原因和最大时长。
{% endnote %}

### 延迟元素实验

1. 在测试 App 中让结果元素延迟出现。
2. 记录元素出现时间、等待条件和最终状态。
3. 分别用固定等待和显式等待运行多轮。
4. 对比耗时、超时信息和失败时的页面证据。
5. 删除固定等待，保留能解释业务状态的条件等待。

## 断言设计

### 状态断言

| 断言层 | 示例 | 价值 |
| --- | --- | --- |
| 元素 | displayed、enabled、text | 确认局部状态 |
| 页面 | 标题、路由、关键节点 | 确认页面转移 |
| 业务 | 订单状态、列表数量、错误码 | 确认真实结果 |
| 系统 | Activity、进程、权限 | 解释环境和恢复 |
| 数据 | API 结果或本地状态 | 防止只看画面 |

~~~python
assert result.is_displayed()
assert result.text == "Saved"
assert driver.current_package == "com.example.demo"
~~~

{% note info flat %}
断言要从用户目标出发，优先验证业务结果，再用元素和系统状态解释失败。多个弱断言不能替代一个能区分成功与失败的业务断言。
{% endnote %}

### 负向结果

1. 为非法输入、超时、权限拒绝和网络中断分别定义预期。
2. 断言错误提示、输入保留和恢复入口。
3. 确认失败不会创建重复业务或泄露敏感数据。
4. 将失败状态清理后再进入下一条用例。

## 失败证据

{% note warning flat %}
失败钩子应在断言失败、会话异常和清理异常时尽量保存截图、页面源、当前 context、设备状态、Server 日志和测试输入。证据采集本身失败时要在报告中标记，不伪装成完整工件。
{% endnote %}

| 工件 | 文件内容 | 关联字段 |
| --- | --- | --- |
| screenshot | 当前画面 | 用例、设备、时间 |
| page source | 语义树 | context、locator |
| driver log | 命令与异常 | 会话、请求序号 |
| ADB 状态 | Activity、进程和 logcat | serial、构建 |
| 输入清单 | 账号角色和数据前置 | 脱敏标记 |

### 清理责任

1. 用例结束关闭弹窗、键盘、临时页面和会话。
2. 失败后清理应用数据或恢复测试账号。
3. 将清理动作和清理失败写入报告。
4. 不删除仍用于诊断的原始工件。

## 常见问题

{% flashcard basic id:app-testing-explicit-vs-implicit-wait deck:"App测试" priority:1 tags:"Appium,等待" %}
--- question
显式等待和隐式等待应该怎样取舍？
--- answer
优先使用针对业务状态的显式等待，并明确全局隐式等待策略，避免两者叠加造成不可解释的超时。
--- explanation
显式等待能表达元素可操作、结果出现或加载消失等条件；固定 sleep 与无边界重试只是在延迟失败。若必须使用隐式等待，要记录范围和时长，并通过延迟元素实验验证总耗时。
{% endflashcard %}

{% flashcard basic id:app-testing-state-assertion deck:"App测试" priority:1 tags:"Appium,断言" %}
--- question
为什么只断言元素存在不能证明业务成功？
--- answer
元素存在只说明局部画面出现，业务状态可能未提交、数据错误或页面显示旧缓存。
--- explanation
从用户目标定义断言：页面转移、结果文案、业务数据和系统状态至少选择一项能区分成功与失败的证据，再用元素和日志辅助归因。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Appium 交互, https://appium.io/docs/en/3.0/guides/actions/, https://appium.io/favicon.ico %}
{% link Appium 等待与元素, https://appium.io/docs/en/3.0/guides/element-attributes/, https://appium.io/favicon.ico %}
{% link Selenium 显式等待, https://www.selenium.dev/documentation/webdriver/waits/, https://www.selenium.dev/images/selenium_logo_square_icon.svg %}
{% link W3C WebDriver, https://www.w3.org/TR/webdriver/, https://www.w3.org/favicon.ico %}
{% endlinkgroup %}

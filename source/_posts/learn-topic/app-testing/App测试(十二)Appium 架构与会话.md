---
title: App测试(十二)Appium 架构与会话
tags:
  - App测试
  - Appium 架构与会话
categories:
  - Learn Topic
  - App测试
description: 理解 Appium 客户端、服务器、驱动与设备会话，建立可验收的 Android 自动化启动链。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 12
published: true
abbrlink: c877e017
date: 2026-06-12 00:00:00
---

{% note primary flat %}
Appium 自动化的第一条闭环不是点击元素，而是让客户端、Appium Server、UiAutomator2 驱动和目标设备建立可诊断会话。会话失败时先分层定位，再进入元素和业务断言。
{% endnote %}

{% course_series %}

## 组件架构

{% mermaid %}
flowchart LR
  A[Python 客户端] -->|W3C 请求| B[Appium Server]
  B --> C[UiAutomator2 Driver]
  C --> D[ADB 与设备]
  D --> E[App 页面]
  E --> D
  D --> C
  C --> B
  B --> A
{% endmermaid %}

{% note info flat %}
图失效时仍按客户端→Server→驱动→ADB→设备的方向检查。客户端只负责发送协议请求，真正的设备安装、启动和元素查找由驱动与 Android 工具链共同完成。
{% endnote %}

{% note info flat %}
这张旧版概念图用于理解脚本、UiAutomator2 driver 与设备端辅助服务之间的请求方向。图中组件名称会随 Appium 版本变化，当前实现以 W3C options、Server 日志和实际驱动版本为准。
{% endnote %}

![Appium 脚本、UiAutomator2 驱动与 Android 设备的概念架构](/img/learn-topic/app-testing/appium-architecture-overview.jpeg)

| 组件 | 负责 | 常见失败 |
| --- | --- | --- |
| 客户端 | 构造 options、调用 WebDriver API | 依赖或参数版本不匹配 |
| Appium Server | 接收会话和命令、路由驱动 | 端口占用、插件或驱动缺失 |
| UiAutomator2 | 安装辅助服务、执行 Android 命令 | API 不支持、签名或安装失败 |
| ADB | 连接并操作设备 | unauthorized、offline、目标错误 |
| 被测 App | 提供页面、状态和业务结果 | 包名、Activity 或数据前置错误 |

## 安装验收

### Server 与驱动

~~~bash
appium --version
appium driver list --installed
adb devices -l
~~~

{% note warning flat %}
这些命令是验收模板，不代表本机已经执行。Server、UiAutomator2 驱动和 ADB 版本要记录在运行清单中；只看到 Server 启动并不代表驱动或设备可用。
{% endnote %}

### 版本边界

| 项目 | 记录字段 | 失败信号 |
| --- | --- | --- |
| Appium | 主版本、监听地址和端口 | 客户端协议不兼容 |
| 驱动 | 名称、版本和安装状态 | 找不到 automationName |
| Android | API、设备 serial 和授权状态 | 设备 offline 或权限不足 |
| Python | 解释器、appium 包版本 | 导入错误或类型不一致 |
| APK | 包名、Activity、版本和摘要 | 安装了错误候选包 |

## 会话模型

{% note primary flat %}
一个 WebDriver 会话代表一组固定的设备、驱动和应用状态。创建会话时声明前置，执行过程中不要偷偷更换设备、包或数据；结束时无论成功失败都释放会话。
{% endnote %}

### 启动链

~~~python
from appium import webdriver
from appium.options.android import UiAutomator2Options

options = UiAutomator2Options()
options.load_capabilities({
    "platformName": "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": "Android Device",
    "appium:udid": "<serial>",
    "appium:appPackage": "com.example.demo",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": False,
    "appium:newCommandTimeout": 120,
})

driver = webdriver.Remote("http://127.0.0.1:4723", options=options)
try:
    print(driver.current_package)
finally:
    driver.quit()
~~~

{% note info flat %}
示例使用 Appium Python Client 的 options 写法。执行前要把包名、Activity、serial 和 Server 地址换成测试环境事实；若会话失败，先保存 Server 日志、驱动日志、ADB 状态和客户端异常。
{% endnote %}

## 会话选项

| 选项 | 作用 | 选择边界 |
| --- | --- | --- |
| platformName | 声明平台 | Android 会进入对应平台分支 |
| automationName | 选择驱动 | Android 常用 UiAutomator2 |
| deviceName | 提供设备描述 | 不是多设备唯一身份 |
| udid | 绑定目标 serial | 多设备执行必须显式设置 |
| appPackage | 指定应用包 | 与 APK 实际 applicationId 一致 |
| appActivity | 指定入口 Activity | 需与导出或启动规则匹配 |
| noReset | 控制数据清理 | 要与测试起点和证据一致 |
| newCommandTimeout | 无命令超时 | 长断点调试时按团队策略设置 |

{% note info flat %}
Inspector 的 Capability Builder 可以帮助检查键值与 JSON 映射，但它不是运行时契约；最终仍以代码中的 `UiAutomator2Options` 和 Server 日志为准。
{% endnote %}

![Appium Inspector Capability Builder 中的 platformName 与 automationName](/img/learn-topic/app-testing/appium-inspector-capabilities.png)

{% note warning flat %}
能力不是越多越好。每增加一项 capability，就增加驱动分支和诊断维度；先使用能启动目标 App 的最小集合，再按实际问题补充。
{% endnote %}

## 应用启动

### 已安装应用

~~~python
options.load_capabilities({
    "platformName": "Android",
    "appium:automationName": "UiAutomator2",
    "appium:udid": "<serial>",
    "appium:appPackage": "com.example.demo",
    "appium:appActivity": ".MainActivity",
})
~~~

### APK 路径

{% note info flat %}
如果直接给 app 文件，驱动会负责安装或处理应用路径。路径、摘要和安装策略要写入运行证据；升级、首次安装和保留数据不能只靠一项 noReset 模糊表达。
{% endnote %}

| 目标 | 推荐做法 | 验证 |
| --- | --- | --- |
| 首次安装 | 干净设备或明确清理 | 包、版本、权限和引导 |
| 升级 | 先安装旧版再启动新包 | 迁移、会话和旧数据 |
| 保留数据 | 显式 noReset 策略 | 起点数据和清理责任 |
| 重新安装 | 记录安装器工件 | 版本和签名摘要 |

## 安全边界

{% note danger flat %}
不要在共享或生产设备上开启未授权的 Server、驱动或调试能力。自动化账号、APK、日志和设备标识都应使用测试范围，关闭不必要的外部监听和调试选项。
{% endnote %}

| 边界 | 检查 | 失败处理 |
| --- | --- | --- |
| Server 监听 | 是否只对测试主机开放 | 收紧绑定和防火墙 |
| 设备授权 | serial、RSA 和账号 | 重新授权或换设备 |
| APK 签名 | 测试签名与环境一致 | 停止安装并核对构建 |
| 日志内容 | 是否含 Token、个人数据 | 脱敏后再交付 |
| 能力选项 | 是否使用高风险扩展 | 删除非必要 capability |

## Inspector

### 观察界面

1. 连接已验收的设备和会话。
2. 查看当前页面的层级树、属性和可见文本。
3. 复制候选定位策略，不直接把生成的长 XPath 当最终选择。
4. 关闭 Inspector 后用代码重新定位并验证业务状态。

{% note info flat %}
Inspector 适合观察和试探，不是稳定性证明。层级树、显示文本和可点击状态会随数据、动画和版本变化，最终定位仍需放进可复现用例。
{% endnote %}

![Appium Inspector 源码树与设备预览的界面示例](/img/learn-topic/app-testing/appium-inspector-source-panel.png)

### 信息记录

| 字段 | 用途 |
| --- | --- |
| 页面和状态 | 说明定位发生在哪个业务节点 |
| 语义属性 | 支持 accessibility id 或 resource id |
| 上下文 | NATIVE_APP 或 WebView |
| 设备与构建 | 复验同一页面条件 |
| 失败工件 | 页面源、截图、Server 日志 |

## 启动排障

| 现象 | 首查层级 | 恢复动作 |
| --- | --- | --- |
| 连接 Server 失败 | 客户端、端口和 Server | 查地址、端口和服务日志 |
| 找不到驱动 | Server 与驱动安装 | 安装匹配驱动并记录版本 |
| 设备 unauthorized | ADB 授权 | 解锁设备并确认 RSA |
| 包安装失败 | APK、签名和存储 | 核对构建与清理策略 |
| Activity 不存在 | 包清单和入口 | 从实际 manifest 选择入口 |
| 创建后立即退出 | 驱动日志和设备状态 | 保存系统报告并区分环境/App |

{% note warning flat %}
排障顺序应从外到内：连接→Server→驱动→ADB→安装→Activity→页面。跳过前层直接修改 locator，只会把会话问题伪装成元素问题。
{% endnote %}

## 常见问题

{% flashcard basic id:app-testing-device-name-vs-udid deck:"App测试" priority:1 tags:"Appium,设备" %}
--- question
deviceName 和 udid 在多设备 Appium 测试中的职责有什么不同？
--- answer
deviceName 是描述性能力，udid 才用于把会话绑定到具体设备 serial。
--- explanation
`deviceName` 是给人看的设备描述，`udid` (设备唯一标识，也就是 ADB serial) 才能把会话绑定到某一台具体设备。单设备示例可以只写 deviceName，但多设备或并行执行必须显式设置 udid，并在会话日志中回读实际设备型号和 API；仅按名称选择可能把命令发到错误设备。
{% endflashcard %}

{% flashcard basic id:app-testing-session-startup deck:"App测试" priority:1 tags:"Appium,会话" %}
--- question
Appium 会话启动失败时，为什么不能先改定位器？
--- answer
会话还未建立时尚未进入元素定位阶段，应先按客户端、Server、驱动、ADB、安装和 Activity 分层排障。
--- explanation
Appium session (会话) 是客户端、Appium Server、设备驱动和目标设备之间维持的一次自动化连接。保存客户端异常、Server/驱动日志、ADB 状态、APK 信息和设备时间线，先确认目标 App 已安装并能启动；会话都没有建立时，页面还不存在，修改 locator (定位器) 不会改变根因。只有会话稳定建立后，才进入页面层和定位器诊断。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Appium 快速开始, https://appium.io/docs/en/3.0/quickstart/, https://appium.io/favicon.ico %}
{% link Appium Python 客户端, https://appium.io/docs/en/3.0/quickstart/test-py/, https://appium.io/favicon.ico %}
{% link UiAutomator2 驱动, https://appium.io/docs/en/3.3/quickstart/uiauto2-driver/, https://appium.io/favicon.ico %}
{% link Android ADB, https://developer.android.com/tools/adb, https://developer.android.com/favicon.ico %}
{% endlinkgroup %}

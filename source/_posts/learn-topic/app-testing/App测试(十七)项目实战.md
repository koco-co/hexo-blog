---
title: App测试(十七)项目实战
tags:
  - App测试
  - 项目实战
categories:
  - Learn Topic
  - App测试
description: 以一个可重置的示例 App 串起范围、设备矩阵、场景执行、证据诊断、稳定性、自动化与发布评审。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 17
published: true
abbrlink: c0a414ba
date: 2026-08-26 00:00:00
---

{% note primary flat %}
本篇把整门课程收束为一个可复用项目：对候选 APK com.example.demo 的登录、列表和提交旅程，建立从环境验收到发布结论的证据链。账号、数据和设备均为测试范围，命令是模板，执行时应替换为团队事实。
{% endnote %}

{% course_series %}

## 项目范围

{% mermaid %}
flowchart LR
  A[候选 APK] --> B[环境验收]
  B --> C[人工主旅程]
  C --> D[专项与失败注入]
  D --> E[Monkey 稳定性]
  E --> F[Appium 回归]
  F --> G[证据与发布评审]
  G -->|数据不足| B
{% endmermaid %}

{% note info flat %}
图失效时仍按候选包→环境→人工→专项→稳定性→自动化→评审执行。每个阶段输出交给下一阶段，出现输入或证据不完整就回到最近的可验证起点。
{% endnote %}

### 目标旅程

| 旅程 | 用户目标 | 关键结果 | 风险 |
| --- | --- | --- | --- |
| 登录 | 使用测试账号进入首页 | 会话建立、错误可恢复 | 权限、凭据和会话泄露 |
| 列表 | 搜索并打开一条记录 | 结果与详情一致 | 空状态、网络和兼容性 |
| 提交 | 修改并保存记录 | 只创建一次、状态可查询 | 重复提交、断网和进程死亡 |
| 退出 | 注销并清理会话 | 下一用户看不到旧数据 | 缓存、通知和后台任务 |

{% note warning flat %}
范围只覆盖能在测试环境重复的用户目标，不把第三方支付、真实个人数据或未授权服务纳入示例。范围外风险单独登记，不用“未测试”伪装成通过。
{% endnote %}

## 环境矩阵

| 维度 | 最小代表 | 扩展抽样 | 记录字段 |
| --- | --- | --- | --- |
| API | 最低支持、当前主流 | 最新候选 API | API、targetSdk |
| 形态 | 手机竖屏 | 平板、折叠屏 | 尺寸、密度、方向 |
| 厂商 | 主流 Android | 历史问题厂商 | ROM、电池策略 |
| 连接 | USB 真机 | 无线和模拟器 | serial、授权、网络 |
| 数据 | 新用户、已有数据 | 过期会话、空列表 | 数据快照、角色 |
| 构建 | 候选 APK | 对照基线 APK | 版本、摘要、签名 |

### 进入检查

~~~bash
set -eu
python --version
adb version
adb devices -l
adb -s "<serial>" shell getprop ro.build.version.sdk
adb -s "<serial>" shell pm path com.example.demo
~~~

{% note success flat %}
进入条件是工具来自预期环境、设备为 device、API 和矩阵一致、目标包存在，且账号和数据可重置。命令输出要脱敏后保存到本次证据目录。
{% endnote %}

### 退出检查

1. 确认每个必测矩阵行都有执行或明确阻断原因。
2. 核对设备、构建、账号和网络字段没有缺失。
3. 释放无线连接、会话、临时文件和测试账号状态。
4. 把环境错误与 App 错误分开计数。

## 场景执行

### 主旅程

{% timeline 一次候选版本运行, blue %}
<!-- timeline 准备 -->
安装候选 APK，建立新用户或已有数据快照，记录构建与设备。
<!-- endtimeline -->
<!-- timeline 登录 -->
执行成功、错误凭据和会话过期三条入口，保存页面与日志。
<!-- endtimeline -->
<!-- timeline 列表 -->
在线、离线和空数据下搜索列表，核对加载、空状态和返回。
<!-- endtimeline -->
<!-- timeline 提交 -->
在正常、超时和进程被回收的节点提交，检查幂等与可查询结果。
<!-- endtimeline -->
<!-- timeline 退出 -->
注销、清理数据并重新进入，确认敏感数据不残留。
<!-- endtimeline -->
<!-- timeline 评审 -->
汇总功能、兼容性、稳定性、自动化和证据，形成发布决定。
<!-- endtimeline -->
{% endtimeline %}

| 场景 | 前置 | 动作 | 预期 | 工件 |
| --- | --- | --- | --- | --- |
| 正常登录 | 新用户、在线 | 输入正确凭据并提交 | 进入首页 | 截图、日志、会话状态 |
| 登录拒绝 | 错误凭据 | 提交并修正 | 提示清晰、输入策略符合预期 | 错误截图 |
| 空列表 | 已登录、无数据 | 打开列表 | 空状态说明和下一步 | 页面源、截图 |
| 重复提交 | 已有数据、在线 | 快速重复点击 | 只产生一次业务结果 | 请求时间线 |
| 注销恢复 | 已登录 | 注销后回到入口 | 旧数据不可见 | 前后台和数据状态 |

{% note warning flat %}
执行时按同一顺序记录动作和实际结果。遇到失败先停止当前场景并保存证据，不要先清除数据或重装把现象抹掉。
{% endnote %}

### 打断场景

| 打断点 | 注入 | 需要确认 |
| --- | --- | --- |
| 输入中 | 旋转、锁屏、键盘关闭 | 内容、焦点和布局 |
| 提交前 | 断网或权限拒绝 | 提示、取消和重试 |
| 提交中 | 切后台、进程回收 | 幂等、恢复和状态查询 |
| 返回后 | 通知或外部入口 | 页面、会话和参数 |

## 证据诊断

### 证据目录

~~~text
evidence/
  manifest.txt
  matrix.csv
  steps/
    login-success.txt
    submit-offline.txt
  screenshots/
  page-source/
  logcat/
  monkey/
  appium/
  report/
~~~

{% note info flat %}
manifest 写构建摘要、设备、API、账号角色、网络、时区和采集时间；每个步骤文件写最小起点、动作、预期和实际。目录名可以调整，但字段必须稳定可检索。
{% endnote %}

### 失败采集

~~~bash
target="<serial>"
evidence_dir="$(mktemp -d)"
adb -s "$target" logcat -v threadtime -d > "$evidence_dir/logcat.txt"
adb -s "$target" shell dumpsys activity activities > "$evidence_dir/activity.txt"
adb -s "$target" exec-out screencap -p > "$evidence_dir/screen.png"
file "$evidence_dir/screen.png"
~~~

| 现象 | 先查 | 归因证据 |
| --- | --- | --- |
| 页面消失 | 进程、Activity、Crash 日志 | pid、堆栈和时间线 |
| 页面卡住 | 主线程、网络和 ANR 报告 | traces、操作窗口 |
| 提交重复 | 请求和服务端状态 | request ID、业务记录 |
| 列表为空 | 网络、账号和数据快照 | 响应、角色和页面 |
| 只在一台设备失败 | 矩阵、ROM 和设置 | 同系统基线对照 |

{% note warning flat %}
截图、录屏、日志和 bugreport 可能含个人数据。先按字段扫描和裁剪，再把最小证据交给评审；无法脱敏的原始工件只在受控范围保留。
{% endnote %}

## 稳定性运行

### Monkey 样本

~~~bash
target="<serial>"
package="com.example.demo"
seed="20260826"
adb -s "$target" shell monkey -p "$package" \
  --seed "$seed" --throttle 200 \
  --pct-touch 45 --pct-motion 20 --pct-appswitch 10 \
  --pct-nav 10 --pct-majornav 10 \
  -v 500
~~~

{% note info flat %}
这是示例运行参数。报告要写设备、构建、数据、seed、事件数、起止时间和忽略策略；没有 Crash 不代表业务旅程已覆盖。
{% endnote %}

### 长稳判断

| 结果 | 统计方式 | 后续 |
| --- | --- | --- |
| 正常结束 | 事件数和退出状态 | 保存样本条件 |
| Crash | 堆栈、seed 和最小序列 | 转复现与修复 |
| ANR | traces、操作窗口和日志 | 区分主线程与环境 |
| 设备断连 | ADB 与主机日志 | 修复环境后重跑 |
| 业务错误 | 页面、数据和请求 | 转人工/Appium 断言 |

### 采样记录

1. 先用小事件数确认前置，再扩大样本。
2. 发现首次失败后停止扩展，缩短 seed 序列。
3. 在相同设备和数据上复验，区分环境与 App。
4. 将 Monkey 发现的系统级异常转成有业务断言的用例。

## 自动化回归

### Appium 用例

~~~python
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

options = UiAutomator2Options()
options.load_capabilities({
    "platformName": "Android",
    "appium:automationName": "UiAutomator2",
    "appium:udid": "<serial>",
    "appium:appPackage": "com.example.demo",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": False,
})

driver = webdriver.Remote("http://127.0.0.1:4723", options=options)
try:
    driver.find_element(AppiumBy.ID, "com.example.demo:id/username").send_keys("test-user")
    driver.find_element(AppiumBy.ID, "com.example.demo:id/password").send_keys("safe-password")
    driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Sign in").click()
    home = WebDriverWait(driver, 15).until(
        EC.visibility_of_element_located(
            (AppiumBy.ID, "com.example.demo:id/home")
        )
    )
    assert home.is_displayed()
finally:
    driver.quit()
~~~

{% note primary flat %}
自动化只承接已经在人工场景中稳定、可观察和可断言的旅程。定位失败、会话失败和业务断言失败分别归类，失败钩子保存截图、页面源、当前 context 和设备日志。
{% endnote %}

### pytest 门禁

~~~bash
python -m pytest tests/app --collect-only -q
python -m pytest tests/app -q --junitxml=evidence/report/junit.xml
~~~

| 门禁 | 通过条件 | 阻断 |
| --- | --- | --- |
| 收集 | 节点、标记和配置符合预期 | 用例漏收或配置错误 |
| 会话 | 每条用例建立并释放设备会话 | 设备/Server 错误 |
| 业务 | 主旅程和负向场景断言通过 | 高风险断言失败 |
| 工件 | 失败有最小证据 | 截图、日志或报告缺失 |
| 稳定性 | flaky 与环境错误已分类 | 反复重试掩盖失败 |

## 失败注入

### 注入清单

| 注入 | 方式 | 预期 |
| --- | --- | --- |
| 权限拒绝 | 首次请求选择拒绝 | 安全降级和恢复入口 |
| 离线 | 操作前或请求中断网 | 提示、取消和幂等 |
| 进程回收 | 在提交中结束进程 | 重进后状态可查询 |
| 旋转锁屏 | 输入和等待期间切换 | 状态、焦点和敏感内容 |
| 过期会话 | 使用失效 Token 或账号状态 | 重新认证，不展示旧数据 |

{% note warning flat %}
失败注入只针对自有测试环境和可重置数据。每次注入先写起点和恢复动作，完成后清理账号、网络和权限状态，不能在真实业务数据上扩大影响。
{% endnote %}

### 恢复验证

1. 记录注入前的页面、数据和系统状态。
2. 只执行一个主要注入，避免多个故障互相污染。
3. 采集用户现象、系统证据和业务结果。
4. 恢复网络、权限、进程或会话，确认系统回到已知起点。
5. 将失败转成可重复的场景或自动化测试。

## 发布评审

{% mermaid %}
flowchart TD
  A[覆盖矩阵] --> D{高风险是否通过?}
  B[稳定性样本] --> D
  C[证据完整性] --> D
  D -->|是| E{残余风险可签收?}
  D -->|否| F[阻断并修复]
  E -->|是| G[候选发布]
  E -->|否| F
{% endmermaid %}

{% note primary flat %}
发布结论必须同时引用覆盖、稳定性、证据和残余风险。图失效时仍按高风险通过→证据完整→风险签收→候选发布执行；任何关键字段缺失都不能默认放行。
{% endnote %}

### 覆盖与证据

| 风险 | 场景覆盖 | 系统证据 | 自动化 | 结论 |
| --- | --- | --- | --- | --- |
| 会话/隐私 | 登录、注销、过期 | 权限、日志、数据状态 | 主旅程 | 通过或阻断 |
| 数据一致性 | 重复提交、迁移 | 请求和服务端状态 | 断言 | 通过或阻断 |
| 设备差异 | API、形态、厂商 | 矩阵和截图 | 分片回归 | 通过或抽样 |
| 稳定性 | Monkey、进程回收 | Crash/ANR 报告 | 长稳任务 | 通过或修复 |
| 可访问性 | TalkBack、字号、焦点 | 语义树和录屏 | 关键任务 | 通过或补测 |

### 决策记录

{% timeline 发布评审记录, blue %}
<!-- timeline 输入 -->
确认候选构建、矩阵、账号和证据目录完整。
<!-- endtimeline -->
<!-- timeline 风险 -->
列出 P0/P1、稳定性异常、兼容性缺口和隐私边界。
<!-- endtimeline -->
<!-- timeline 处置 -->
为每项风险指定修复、补测、延期或明确签收人。
<!-- endtimeline -->
<!-- timeline 决定 -->
满足门禁则发布候选，否则阻断并回到对应阶段。
<!-- endtimeline -->
{% endtimeline %}

{% note success flat %}
发布记录要能由另一位成员回到原始工件：构建和设备可识别、场景可复现、失败可归因、风险有负责人。签收残余风险不等于删除失败证据。
{% endnote %}

## 项目复盘

### 指标

| 指标 | 计算口径 | 复盘问题 |
| --- | --- | --- |
| 高风险覆盖率 | 已验证风险 / 计划风险 | 哪些风险一直被遗漏 |
| 首次通过率 | 首次通过 / 总执行 | 重试掩盖了什么 |
| 环境失败率 | 环境失败 / 总运行 | 设备池是否可靠 |
| 证据完整率 | 合格工件 / 失败样本 | 哪一层最常缺失 |
| 缺陷收敛时间 | 首次发现到可复现 | 诊断链是否够短 |

### 行动项

1. 把重复出现的手工检查下沉为稳定的自动化断言。
2. 把高风险但未覆盖的矩阵组合加入下一轮计划。
3. 删除已修复的重试、临时忽略和过期 xfail。
4. 更新环境、账号、设备和证据模板。
5. 为每个行动项指定负责人、截止时间和验证工件。

{% note info flat %}
复盘的产物是下一轮可执行的改进，不是把一次发布包装成成功故事。保留“哪些判断仍依赖人工、哪些数据不足、哪些风险被签收”的边界。
{% endnote %}

## 常见问题

{% flashcard basic id:app-testing-release-decision deck:"App测试" priority:1 tags:"项目实战,发布" %}
--- question
App 测试项目什么时候可以给出发布候选结论？
--- answer
高风险旅程和必测矩阵已验证，Crash/ANR 等稳定性异常有处置，失败证据可复现，残余风险有明确签收或阻断决定。
--- explanation
发布不是“所有用例都绿”，而是覆盖、稳定性、证据和风险四类输入共同满足门禁。环境失败、跳过和数据不足要单独统计；关键字段缺失时应阻断或回到补测。
{% endflashcard %}

{% flashcard basic id:app-testing-evidence-chain deck:"App测试" priority:1 tags:"项目实战,证据" %}
--- question
一条合格的 App 测试证据链至少包含哪些环节？
--- answer
固定构建与设备、记录最小步骤、同步采集日志和画面、保存系统状态、完成归因并脱敏交付。
--- explanation
截图证明画面，日志证明时间点，设备和构建证明输入，步骤和数据证明可复现，系统状态帮助区分 Crash、ANR、业务或环境问题。任一环节缺失都要标记证据不完整。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Android 测试基础, https://developer.android.com/training/testing/fundamentals, https://developer.android.com/favicon.ico %}
{% link Monkey 官方文档, https://developer.android.com/studio/test/other-testing-tools/monkey, https://developer.android.com/favicon.ico %}
{% link ADB 官方文档, https://developer.android.com/tools/adb, https://developer.android.com/favicon.ico %}
{% link Logcat 官方文档, https://developer.android.com/tools/logcat, https://developer.android.com/favicon.ico %}
{% link Appium 快速开始, https://appium.io/docs/en/3.0/quickstart/, https://appium.io/favicon.ico %}
{% link pytest Fixture, https://docs.pytest.org/en/stable/explanation/fixtures.html, https://docs.pytest.org/en/stable/_static/pytest_favicon.ico %}
{% endlinkgroup %}

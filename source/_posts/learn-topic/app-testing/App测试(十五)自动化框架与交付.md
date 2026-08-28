---
title: App测试(十五)自动化框架与交付
tags:
  - App测试
  - 自动化框架与交付
categories:
  - Learn Topic
  - App测试
description: 用 pytest 组织 Appium 会话、测试数据、失败工件、并行执行和持续交付门禁。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 15
published: true
abbrlink: bdd9d1a1
date: 2026-06-15 00:00:00
---

{% note primary flat %}
自动化框架的价值是让每条用例拥有清晰的资源生命周期、可复现输入和失败证据。pytest 负责组织和报告，Appium 负责设备交互，发布门禁负责把结果映射为风险决策。
{% endnote %}

{% course_series %}

## pytest 基础

### 执行入口

~~~bash
python -m pytest tests/app --collect-only -q
python -m pytest tests/app -q --junitxml=artifacts/junit.xml
~~~

{% note info flat %}
先用 collect-only 检查测试节点、标记和配置，再执行真实设备用例。收集成功只证明 pytest 找到了用例，不代表设备、会话或业务状态可用。
{% endnote %}

| 结果 | 含义 | 处理 |
| --- | --- | --- |
| passed | 断言与清理完成 | 保留报告和工件 |
| failed | 用例结果不符合预期 | 查看断言、截图和日志 |
| error | Fixture、会话或清理失败 | 先修资源生命周期 |
| skipped | 条件不满足 | 报告原因，不隐藏风险 |
| xfailed | 已知问题且符合预期 | 关联缺陷和到期时间 |

### 标记

~~~python
import pytest

@pytest.mark.smoke
def test_login_smoke(app):
    assert app.login("test-user", "safe-password")
~~~

{% note warning flat %}
标记是筛选入口，不是质量分数。每个标记都要对应明确的执行环境、门禁用途和维护责任，不能用大量标记掩盖没有稳定前置的用例。
{% endnote %}

## 工程结构

{% mermaid %}
flowchart TD
  A[pytest 配置] --> B[conftest fixtures]
  B --> C[页面对象与操作]
  C --> D[业务断言]
  B --> E[设备与会话]
  E --> F[失败工件]
  D --> F
  F --> G[报告与门禁]
{% endmermaid %}

{% note info flat %}
图失效时仍按配置→Fixture→页面操作→业务断言→工件→报告执行。测试文件不应偷偷创建不可追踪的设备、账号或全局状态。
{% endnote %}

~~~text
tests/
  app/
    test_login.py
    test_network_recovery.py
  pages/
    login_page.py
  conftest.py
artifacts/
  screenshots/
  page-source/
  logs/
  junit.xml
pyproject.toml
~~~

### 配置职责

| 文件 | 职责 | 不应放入 |
| --- | --- | --- |
| pyproject.toml | 默认参数、标记和报告 | 设备私密凭据 |
| conftest.py | 可复用 Fixture 和钩子 | 业务断言细节 |
| pages/ | 定位和页面动作 | 全局数据清理 |
| tests/ | 业务场景和断言 | 硬编码环境路径 |
| artifacts/ | 运行时工件 | 源码和真实账号 |

## 会话隔离

### Fixture 层级

~~~python
import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options

@pytest.fixture
def driver():
    options = UiAutomator2Options()
    options.load_capabilities({
        "platformName": "Android",
        "appium:automationName": "UiAutomator2",
        "appium:udid": "<serial>",
        "appium:appPackage": "com.example.demo",
        "appium:appActivity": ".MainActivity",
        "appium:noReset": False,
    })
    instance = webdriver.Remote("http://127.0.0.1:4723", options=options)
    yield instance
    instance.quit()
~~~

{% note primary flat %}
默认让每条用例独立建立和关闭会话，牺牲少量速度换取起点可解释。若共享会话，必须证明用例之间的页面、权限、账号和数据不会互相污染。
{% endnote %}

### 数据隔离

| 资源 | 推荐范围 | 清理 |
| --- | --- | --- |
| WebDriver 会话 | function | quit 和设备状态回读 |
| 测试账号 | function 或可重置分片 | 注销、清理数据或恢复快照 |
| 设备 | worker 或 job | 释放、锁定和结果标记 |
| 静态 APK | session | 校验摘要，不在用例中改写 |
| 报告目录 | run | 按用例和设备分层保存 |

## 用例组织

### 页面对象

~~~python
from appium.webdriver.common.appiumby import AppiumBy

class LoginPage:
    username = (AppiumBy.ID, "com.example.demo:id/username")
    password = (AppiumBy.ID, "com.example.demo:id/password")
    submit = (AppiumBy.ACCESSIBILITY_ID, "Sign in")
    error = (AppiumBy.ID, "com.example.demo:id/error")

    def login(self, driver, user, secret):
        driver.find_element(*self.username).send_keys(user)
        driver.find_element(*self.password).send_keys(secret)
        driver.find_element(*self.submit).click()
~~~

{% note info flat %}
页面对象封装定位和动作，测试函数保留业务意图与断言。不要把每一个元素都包装成没有语义的转发方法，也不要把测试数据和设备条件藏在页面对象里。
{% endnote %}

### 参数化

~~~python
import pytest

@pytest.mark.parametrize(
    "role,expected",
    [
        ("new-user", "Home"),
        ("expired-session", "Sign in"),
    ],
)
def test_entry_state(driver, role, expected):
    state = prepare_role(role)
    assert state.next_screen == expected
~~~

{% note warning flat %}
参数化扩大了覆盖，也扩大了数据隔离和报告维度。每个参数必须能独立准备、清理和解释失败，不能把真实账号或不可重复的时间状态塞进参数表。
{% endnote %}

## 失败工件

### 钩子

~~~python
import pytest

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.failed:
        driver = item.funcargs.get("driver")
        if driver:
            save_screenshot(driver, item.nodeid)
            save_page_source(driver, item.nodeid)
~~~

{% note warning flat %}
失败钩子要处理驱动已退出、截图失败和文件命名冲突。工件保存失败应追加到报告，而不是覆盖原始断言或让测试看起来像“有完整证据”。
{% endnote %}

| 工件 | 命名字段 | 作用 |
| --- | --- | --- |
| screenshot | nodeid、设备、时间 | 画面和用户现象 |
| page source | nodeid、context | 定位与语义树 |
| logcat | serial、时间窗 | 系统与应用诊断 |
| Server log | session、命令序号 | 驱动层排障 |
| junit | 测试节点和结果 | CI 消费与趋势 |

## 并行执行

### 设备分配

| 策略 | 适用 | 前置 |
| --- | --- | --- |
| 单设备顺序 | 本地开发和冒烟 | 稳定清理 |
| 多设备分片 | API/厂商矩阵 | 设备锁和 serial 映射 |
| worker 独占 | 长稳定性运行 | 每个 worker 固定设备 |
| 云设备并行 | 扩大型号覆盖 | 隐私、网络和工件回收 |

~~~bash
python -m pytest tests/app -q -n auto
~~~

{% note warning flat %}
并行不是加一个参数就完成。每个 worker 必须有独占设备、账号数据和工件目录；没有可靠分配时宁可顺序执行，也不要让互相污染的结果进入门禁。
{% endnote %}

### 资源冲突

1. 为 serial、账号和端口建立显式映射。
2. 在启动前检查资源是否被其他任务占用。
3. 运行中把 worker、设备和会话写入日志。
4. 结束时释放资源，即使断言失败也要执行清理。
5. 资源分配失败标为环境错误，不计入 App 功能失败。

## 稳定性治理

### Flaky 边界

{% note warning flat %}
重试只能处理明确的瞬时环境错误，例如设备短暂断连；不能用重试掩盖确定性的断言失败、错误定位或数据污染。每次重试都要记录原始失败和最终结果。
{% endnote %}

| 现象 | 是否可重试 | 处理 |
| --- | --- | --- |
| 设备瞬时 offline | 有条件 | 重新连接并标记环境 |
| 元素偶尔未加载 | 先修等待 | 不直接放宽超时 |
| 业务断言失败 | 不应默认重试 | 保存证据并修复 |
| 账号数据污染 | 不可盲重试 | 恢复数据后重跑 |
| Server 进程退出 | 有条件 | 重建会话并区分环境 |

### 跟踪指标

- 首次通过率与重试后通过率分开统计。
- 按设备、构建、用例和失败分类趋势。
- 记录跳过、xfail 和环境错误的原因与到期时间。
- 定期删除已修复的重试和过期例外。

## 持续交付

{% mermaid %}
sequenceDiagram
  participant CI
  participant Build as 构建
  participant Device as 设备池
  participant Test as pytest
  participant Gate as 发布门禁
  CI->>Build: 获取候选 APK
  Build->>Device: 分配设备与账号
  Device->>Test: 建立会话
  Test->>Test: 执行场景与采集工件
  Test-->>Gate: 报告、失败分类和覆盖
  Gate-->>CI: 通过、阻断或人工签收
{% endmermaid %}

{% note primary flat %}
门禁要消费结构化结果：高风险场景、稳定性异常、设备覆盖、证据完整性和已知风险。CI 绿灯只表示本次命令满足规则，不自动等于生产安全。
{% endnote %}

### 门禁检查

| 项目 | 阻断条件 | 证据 |
| --- | --- | --- |
| 构建 | APK 摘要或签名不匹配 | 构建清单 |
| 环境 | 无可用设备或授权失效 | 设备池日志 |
| 功能 | 高风险主旅程失败 | JUnit 与业务工件 |
| 稳定性 | Crash/ANR 未处置 | logcat、报告 |
| 证据 | 失败缺少最小工件 | 工件清单 |
| 兼容性 | 必测矩阵缺行 | 设备映射和报告 |

## 常见问题

{% flashcard basic id:app-testing-fixture-scope deck:"App测试" priority:1 tags:"pytest,Fixture" %}
--- question
Appium 的 driver Fixture 为什么通常从 function 作用域开始？
--- answer
每条用例独立建立和关闭会话，可以隔离页面、权限、账号和数据状态，让失败起点更可解释。
--- explanation
Fixture 是测试框架负责准备资源、在用例结束后清理资源的函数。`function` 作用域表示每条用例都新建并关闭一次 driver session；`session` 或 `module` 作用域可以更快，但会共享页面、权限、账号或数据状态，需要证明清理完整且用例顺序不会影响结果。移动端状态复杂时先使用 function 作用域，等证据证明共享安全后再优化，并把设备与账号资源分配显式化。
{% endflashcard %}

{% flashcard basic id:app-testing-flaky-retry-boundary deck:"App测试" priority:1 tags:"pytest,稳定性" %}
--- question
什么时候可以对 Appium 用例重试？
--- answer
只对已确认的瞬时环境错误有限重试，并保留首次失败；确定性的断言、定位和数据污染不能靠重试掩盖。
--- explanation
`flaky` 用来描述“代码和输入没有改变，但同一用例有时通过、有时失败”的不稳定现象。重试前定义失败分类、次数和证据字段；设备短暂 `offline` 可以重连并标为环境问题，业务断言失败应直接保存工件并修复根因。重试后通过也要保留首次失败和 flaky 趋势，不能把偶然成功当成稳定通过。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link pytest Fixture, https://docs.pytest.org/en/stable/explanation/fixtures.html, https://docs.pytest.org/en/stable/_static/pytest_favicon.ico %}
{% link pytest Flaky, https://docs.pytest.org/en/8.1.x/explanation/flaky.html, https://docs.pytest.org/en/stable/_static/pytest_favicon.ico %}
{% link pytest 跳过与 xfail, https://docs.pytest.org/en/stable/how-to/skipping.html, https://docs.pytest.org/en/stable/_static/pytest_favicon.ico %}
{% link Appium Python, https://appium.io/docs/en/3.0/quickstart/test-py/, https://appium.io/favicon.ico %}
{% endlinkgroup %}

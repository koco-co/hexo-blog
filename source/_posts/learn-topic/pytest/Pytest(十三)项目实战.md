---
title: Pytest(十三)项目实战
tags:
  - Pytest
  - 项目实战
  - 测试交付
categories:
  - Learn Topic
  - Pytest
description: 能从订单折扣与通知需求出发交付可维护、可并行、可诊断的 Pytest 测试套件
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 13
published: false
abbrlink: b428e868
date: 2026-08-26 09:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决的是“怎样把测试设计、资源隔离、扩展、并行和报告连成一次可交付验收”。贯穿项目是订单折扣与通知模块：规则测试要快，仓储测试要真实可控，通知协作者要可替换，CI 需要稳定退出码和无敏感信息的报告。文章最后用故障注入证明套件能发现问题，而不是只展示一条绿色命令。
{% endnote %}

## 验收目标

{% note success flat %}
业务范围是：按会员等级计算折扣、拒绝非法折扣、保存订单并发送通知。非目标是实现真实支付网关、部署生产数据库和编写完整端到端浏览器测试。交付证据包括收集数量、关键边界、失败退出码、并行复跑、覆盖率口径、JUnit/Allure 产物和安全检查。
{% endnote %}

- [x] 折扣规则的正常值、零值、上限和非法输入有独立断言。
- [x] 订单写入使用临时资源，通知协作者在正确绑定点替换。
- [x] 单元、集成和可选端到端场景有清晰标记。
- [x] 并行运行不共享固定文件名，报告不包含令牌或用户隐私。
- [x] 故障注入后能指出症状、根因、修复和复验命令。

## 项目骨架

{% note info flat %}
目录结构先表达所有权，再表达命令。业务代码放在 src，测试按反馈速度拆分，根配置只保留套件边界和稳定标记；conftest 提供公共 Fixture 与项目 Hook，普通支持函数放在可导入模块。
{% endnote %}

```text
shop/
├── pyproject.toml
├── src/shop/
│   ├── discount.py
│   ├── order.py
│   └── notifier.py
├── tests/
│   ├── conftest.py
│   ├── unit/
│   │   ├── test_discount.py
│   │   └── test_order.py
│   └── integration/
│       └── test_order_repository.py
└── artifacts/
```

```toml
[tool.pytest]
testpaths = ["tests"]
addopts = "-ra"
strict_markers = true
markers = [
  "integration: uses a temporary repository",
  "smoke: critical business checks",
]
```

{% note info flat %}
运行入口固定为 python -m pytest；需要真实仓储时再使用 -m integration，需要快速反馈时使用 tests/unit。配置文件不写本机绝对路径和秘密，产物目录由 CI 创建并在任务结束时清理。
{% endnote %}

## 测试分层

{% note primary flat %}
分层依据是协作者和反馈速度，而不是文件大小。单元层验证纯规则，集成层验证临时仓储和序列化，通知适配器只在协议需要时进入集成层。每一层都有自己的标记和失败解释，不能用一条全局 Fixture 把所有测试接到真实服务。
{% endnote %}

| 层次 | 示例 | Fixture/替身 | 失败含义 | 命令 |
| --- | --- | --- | --- | --- |
| unit | discount、输入校验 | 纯值、Fake | 业务规则错误 | python -m pytest tests/unit |
| integration | order repository | tmp_path、真实序列化 | 模块协作或资源错误 | python -m pytest -m integration |
| smoke | 关键下单路径 | 最小稳定资源 | 发布前核心行为回归 | python -m pytest -m smoke |
| e2e（可选） | 运行中的服务 | 独立环境 | 部署/网络/协议问题 | 单独 CI 阶段 |

```python
import pytest


@pytest.mark.parametrize(
    ("level", "total", "expected"),
    [("member", 100, 90), ("vip", 100, 80), ("guest", 100, 100)],
    ids=["member-10", "vip-20", "guest-0"],
)
@pytest.mark.smoke
def test_discount(level, total, expected):
    assert apply_discount(level, total) == expected
```

{% note info flat %}
同一组决策表在 unit 层独立收集，集成层只验证仓储和序列化，不复制全部规则断言。遇到失败先看标记和 Node ID，再判断是规则、资源还是环境。
{% endnote %}

## 资源设计

{% mermaid %}
flowchart TD
  T[test_order_flow] --> O[order]
  O --> R[repository]
  O --> N[notifier fake]
  R --> P[tmp_path]
  R --> C[config]
{% endmermaid %}

{% note info flat %}
function 级 tmp_path 保证订单文件互不覆盖，module 级只读 config 可以共享，notifier fake 记录调用但不访问网络。Fixture 清理写在 yield 后，所有外部资源都有明确 owner；并行时 worker_id 进入文件或数据库命名空间。
{% endnote %}

```python
import json

import pytest


@pytest.fixture
def repository(tmp_path):
    path = tmp_path / "orders.json"

    def save(order):
        path.write_text(json.dumps(order), encoding="utf-8")

    yield save
    path.unlink(missing_ok=True)


@pytest.fixture
def notifier():
    calls = []

    def send(message):
        calls.append(message)

    send.calls = calls
    return send


def test_order_flow(repository, notifier):
    repository({"id": "o-1", "total": 80})
    notifier("order accepted")
    assert notifier.calls == ["order accepted"]
```

{% note info flat %}
这里的 notifier 是 Fake 而不是全局 Mock；测试仍然可以通过调用记录检查协议，同时不会把真实网络请求混进单元测试。若通知模块在 service.py 中以 from notifier import send 导入，patch 目标应是 service.send。
{% endnote %}

## 扩展能力

{% note success flat %}
项目插件只承担跨测试的公共协议：注册 --region、标记 integration、在报告标题显示区域，并在失败时追加脱敏属性。它不读取私有配置字段、不修改测试断言，也不把原始请求体写进附件。
{% endnote %}

```python
import pytest


def pytest_addoption(parser):
    parser.addoption("--region", action="store", default="test")


def pytest_configure(config):
    config.addinivalue_line("markers", "integration: uses temporary repository")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        item.user_properties.append(("region", item.config.getoption("region")))
```

{% note info flat %}
验证插件时用 --help、--markers 和一个故意失败的 Node 检查选项、标记和属性；退出码仍应是失败。只有需要在真实插件发现边界验证时，才用 pytester 子进程。
{% endnote %}

## 并行与报告

{% mermaid %}
flowchart TD
  A[固定配置与输入] --> B[pytest -n 2]
  B --> C[JUnit XML]
  B --> D[覆盖率 XML]
  B --> E[Allure 结果]
  C --> F[CI 测试汇总]
  D --> F
  E --> G[人工诊断]
  F --> H[发布门禁]
  G --> H
{% endmermaid %}

| 产物 | 必须包含 | 必须排除 |
| --- | --- | --- |
| JUnit XML | Node ID、结果、退出码映射 | 令牌、完整用户输入 |
| coverage XML | 版本、范围、缺口 | 与范围无关的生成代码 |
| Allure | 脱敏步骤、低敏附件 | 原始 Authorization、Cookie、响应体 |
| 终端日志 | 首次失败、worker、seed | 私有路径和秘密 |

```bash
python -m pytest -n 2 --junitxml=artifacts/junit.xml --cov=src --cov-report=xml:artifacts/coverage.xml
python -m pytest -n 2 --alluredir=artifacts/allure-results
```

{% note info flat %}
先在串行模式验证正确性，再在两个 worker 验证隔离；不要只看最终绿色。对外部资源设置超时和幂等清理，记录第一次失败的 worker 与 Node ID。
{% endnote %}

## 故障演练

{% tabs 故障注入, 1 %}
<!-- tab 收集失败 -->
症状：把测试文件改成不匹配的名字，collect-only 显示 0 个节点。

根因：默认收集规则没有匹配文件。

修复：恢复 test_ 前缀或显式调整 python_files，并重新运行 collect-only。
<!-- endtab -->
<!-- tab 资源竞态 -->
症状：两个 worker 写入同名结果文件，偶发内容互相覆盖。

根因：session Fixture 只在单 worker 内共享，固定文件名却跨进程共用。

修复：使用 tmp_path/worker_id 生成命名空间，或为外部系统加带超时的锁，再重复并行命令。
<!-- endtab -->
<!-- tab flaky 与泄密 -->
症状：第一次失败记录了请求头，随后 rerun 通过；Allure 页面看不到值但结果目录仍含原文。

根因：把展示层隐藏当成脱敏，且用重试掩盖了不稳定根因。

修复：在采集点删除 Authorization/Cookie，保留低敏摘要，保存首次失败证据后再处理竞态或环境抖动。
<!-- endtab -->
{% endtabs %}

{% note danger flat %}
故障演练的通过条件是“能从证据定位根因并复验”，不是“把失败改成跳过”。跳过、无限重试或删除报告都会降低证据质量，不能作为交付修复。
{% endnote %}

## 交付复盘

{% note success flat %}
交付前逐项复核：代码版本与配置固定，收集数量稳定，核心边界有断言，Fixture 可清理，替身绑定点正确，串行与并行结果一致，JUnit/覆盖率/Allure 可解析且无敏感信息。任何未验证的外部服务、平台差异或私有插件都单独记录，不用绿色徽章掩盖。
{% endnote %}

| 证据项 | 结果记录 | 未验证边界 |
| --- | --- | --- |
| 收集与退出码 | Node ID、数量、最终退出码 | 动态外部数据 |
| 资源隔离 | worker 命名空间、清理日志 | 真实生产数据库 |
| 断言诊断 | 回溯、捕获输出、日志级别 | 线上网络抖动 |
| 报告安全 | 产物扫描、权限、保留期 | 第三方报告站点策略 |
| 可复现性 | 配置、版本、seed、命令 | 未锁定的开发者插件 |

## 常见问题

{% flashcard basic id:pytest-suite-fixture-design deck:"Pytest" priority:1 tags:"项目设计" %}
--- question
项目 Fixture 应按什么原则拆分？
--- answer
按资源所有权、生命周期和隔离边界拆分，让每个 Fixture 有单一职责并能可靠清理。
--- explanation
共享只读配置可以提升作用域，写入状态和临时文件通常保持 function 级。测试需要哪个资源就显式声明哪个参数，避免一个巨型 Fixture 同时创建数据库、用户、网络客户端和报告附件。
{% endflashcard %}

{% flashcard basic id:pytest-delivery-evidence deck:"Pytest" priority:1 tags:"交付证据" %}
--- question
什么证据才能说明测试套件可交付？
--- answer
结果、收集范围、退出码、失败诊断、资源清理、并行稳定性、报告可解析性和产物安全共同通过。
--- explanation
单次绿色运行只能证明一次输入。交付还要保留 Node ID、配置/版本、串行与并行差异、覆盖率口径和报告安全检查，并明确未验证的外部服务和平台边界。
{% endflashcard %}

{% flashcard basic id:pytest-parallel-isolation deck:"Pytest" priority:1 tags:"并行隔离" %}
--- question
如何证明套件在并行执行下真正隔离？
--- answer
让 worker 使用独立命名空间，运行串行和多 worker 两次，比较结果、资源清理和报告中的 Node ID/worker 证据。
--- explanation
session Fixture 在每个 worker 内独立建立，固定文件、端口和数据库键仍可能碰撞。故意注入共享资源故障，再用 worker_id、锁或临时目录修复并重复测量，才能证明隔离而不是碰巧通过。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Good integration practices, https://docs.pytest.org/en/stable/explanation/goodpractices.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link pytest contents, https://docs.pytest.org/en/stable/contents.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Writing plugins, https://docs.pytest.org/en/stable/how-to/writing_plugins.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

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
published: true
abbrlink: b428e868
date: 2026-05-01 00:00:00
---

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
[tool.pytest.ini_options]
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
        report.user_properties.append(("region", item.config.getoption("region")))
```

{% note info flat %}
验证插件时用 --help、--markers 和一个故意失败的 Node ID 检查选项、标记和属性；退出码仍应是失败。只有需要在真实插件发现边界验证时，才用 pytester 子进程。
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
# 先安装可选插件：python -m pip install pytest-xdist pytest-cov allure-pytest
python -m pytest -n 2 --junitxml=artifacts/junit.xml --cov=src --cov-report=xml:artifacts/coverage.xml
python -m pytest -n 2 --alluredir=artifacts/allure-results
```

{% note info flat %}
这两条命令分别依赖 pytest-xdist、pytest-cov 和 allure-pytest；它们是交付阶段的可选集成。插件未安装时先执行串行的 JUnit 命令，或跳过对应报告命令，不要把“未知参数”误判为业务测试失败。
{% endnote %}

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
Fixture 的边界应同时回答三个问题：谁拥有资源、资源活多久、失败后谁负责清理。可以把同一个项目拆成独立依赖：

```python
@pytest.fixture(scope="session")
def config():
    return load_config()       # 只读配置可共享


@pytest.fixture
def order_file(tmp_path):
    return tmp_path / "order.json"  # 写入状态按测试隔离
```

测试函数只声明实际需要的 Fixture，避免一个巨型 Fixture 同时创建数据库、用户、网络客户端和报告附件。共享只读数据才适合提升作用域；写入状态和临时文件通常保持 function 级并在 teardown 中清理。
{% endflashcard %}

{% flashcard basic id:pytest-delivery-evidence deck:"Pytest" priority:1 tags:"交付证据" %}
--- question
什么证据才能说明测试套件可交付？
--- answer
结果、收集范围、退出码、失败诊断、资源清理、并行稳定性、报告可解析性和产物安全共同通过。
--- explanation
“绿色”只是一个结果，不是完整交付证据。最小证据包应能回答：运行了什么、用什么环境、失败如何定位、产物是否安全。

| 证据 | 用途 |
| --- | --- |
| Node ID、收集数量、退出码 | 证明范围和结果 |
| Python/Pytest 版本、配置摘要 | 解释环境差异 |
| 串行/并行对照与首次回溯 | 发现隔离或 flaky 问题 |
| 覆盖率口径、JUnit/Allure 检查 | 说明报告含义和安全边界 |

外部服务、平台差异和未执行场景要明确列出；不要把一次本地绿灯写成所有环境都已验证。
{% endflashcard %}

{% flashcard basic id:pytest-parallel-isolation deck:"Pytest" priority:1 tags:"并行隔离" %}
--- question
如何证明套件在并行执行下真正隔离？
--- answer
让 worker 使用独立命名空间，运行串行和多 worker 两次，比较结果、资源清理和报告中的 Node ID/worker 证据。
--- explanation
并行隔离要让资源命名包含 worker 边界，并用对照实验证明它确实生效：

```python
def resource_name(worker_id: str) -> str:
    return f"orders-{worker_id}"
```

先串行运行，再以两个 worker 运行同一套件，比较结果、清理状态和报告中的 Node ID/worker；随后故意让两个 worker 竞争固定文件、端口或数据库键，确认它会失败，再用 `worker_id`、锁或临时目录修复并重复测量。只有这样才能区分“真的隔离”和“恰好没有碰撞”。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Good integration practices, https://docs.pytest.org/en/stable/explanation/goodpractices.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link pytest contents, https://docs.pytest.org/en/stable/contents.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Writing plugins, https://docs.pytest.org/en/stable/how-to/writing_plugins.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

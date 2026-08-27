---
title: Pytest(九)插件与 Hook 扩展
tags:
  - Pytest
  - 插件
  - Hook
categories:
  - Learn Topic
  - Pytest
description: 能使用公开插件入口、Hook 顺序和报告协议扩展 Pytest 运行过程
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 9
published: true
abbrlink: c50d5948
date: 2026-04-27 00:00:00
---

{% course_series %}

{% note primary flat %}
本节要解决的是“怎样扩展运行器而不把逻辑塞进每个测试函数”。从本地插件发现开始，依次实现命令行选项、配置和标记、收集筛选、Hook wrapper 与报告摘要；每个 Hook 都按公开签名、返回协议和失败退出码验证。Fixture 管理测试依赖，Hook 观察或改变运行阶段，两者不要混成一层。
{% endnote %}

## 插件模型

{% note info flat %}
插件可以来自内置实现、命令行 -p、已安装分发包的 pytest11 entry point、PYTEST_PLUGINS 环境变量和 conftest.py。启动时按固定顺序加载，重复注册会被插件管理器去重；需要诊断时使用 --trace-config 查看实际来源。
{% endnote %}

{% mermaid %}
flowchart TD
  A[内置插件] --> B[-p 显式插件]
  B --> C[pytest11 entry point]
  C --> D[PYTEST_PLUGINS]
  D --> E[根目录 conftest]
  E --> F[子目录 conftest]
  F --> G[配置与收集 Hook]
{% endmermaid %}

```text
project/
├── pyproject.toml
├── conftest.py          # 项目本地插件
└── tests/
    └── conftest.py      # 测试目录插件
```

{% note info flat %}
项目本地扩展先放在根 conftest.py 或独立插件包中；测试目录 conftest.py 适合局部 Fixture 和收集规则。不要通过改写主题或 Pytest 私有模块来“注册” Hook。
{% endnote %}

## Hook 规范

{% note success flat %}
Hook 实现由 hookspec 定义参数、返回值和是否允许多个结果；hookimpl 负责声明实现。Pytest 会根据签名剪枝只传入实现声明的参数，但不能因此省略必要的结果协议。先阅读当前 Hook 说明，再写最小实现。
{% endnote %}

```python
# conftest.py
import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--legacy",
        action="store_true",
        help="运行兼容旧协议的测试",
    )


def pytest_configure(config):
    config.addinivalue_line("markers", "legacy: compatibility checks")


def pytest_collection_modifyitems(config, items):
    if not config.getoption("--legacy"):
        skip_legacy = pytest.mark.skip(reason="use --legacy to run")
        for item in items:
            if "legacy" in item.keywords:
                item.add_marker(skip_legacy)
```

{% note info flat %}
addoption 在启动配置阶段注册选项，pytest_configure 注册标记，collection_modifyitems 在收集完成后调整 items。每个 Hook 只做自己的阶段工作，避免在收集 Hook 中启动网络或在报告 Hook 中修改测试输入。
{% endnote %}

## 调用顺序

{% note info flat %}
同一 Hook 有多个实现时，tryfirst 和 trylast 只表达相对顺序；wrapper 则在 yield 前包住其他实现，yield 后拿到结果或异常。顺序不是业务断言，若结果依赖某个插件先执行，应改为共享数据协议或显式依赖。
{% endnote %}

```python
import pytest


@pytest.hookimpl(wrapper=True)
def pytest_pyfunc_call(pyfuncitem):
    result = yield
    if result is not None:
        return result


@pytest.hookimpl(tryfirst=True)
def pytest_report_header(config):
    return "discount suite"


@pytest.hookimpl(trylast=True)
def pytest_sessionfinish(session, exitstatus):
    if exitstatus != 0:
        return
```

{% note info flat %}
wrapper 的 yield 前是“进入被包装调用”，yield 后是“读取结果或异常并决定是否继续传播”。不要在 wrapper 中吞掉异常，也不要返回与 Hook 规范不兼容的对象。
{% endnote %}

## 项目扩展

{% note primary flat %}
项目扩展应围绕真实运行需求：一个命令行选项、一组注册标记和一个可复现报告摘要就足够形成最小插件。自定义配置用 addini 注册，标记用 addinivalue_line 注册，条件跳过优先在 collection_modifyitems 中一次完成。
{% endnote %}

```python
def pytest_addoption(parser):
    parser.addoption(
        "--region",
        action="store",
        default="test",
        choices=["test", "staging"],
    )
    parser.addini("service_region", type="string", default="test")


def pytest_configure(config):
    region = config.getoption("region")
    if region == "staging":
        config.addinivalue_line("markers", "staging: uses staging service")
```

{% note info flat %}
用 python -m pytest --help 检查选项是否出现，用 --markers 检查标记说明，用一次测试验证 region 真的被读取。生产系统的凭据和网络地址不要写入配置示例，项目插件只传递选择，不负责保存秘密。
{% endnote %}

## 收集与报告

{% note info flat %}
collection_modifyitems 可以重排、标记或删除 items，pytest_generate_tests 可以为测试函数生成参数，pytest_ignore_collect 可以按路径忽略收集。报告阶段用 pytest_runtest_makereport、pytest_report_header 和 pytest_terminal_summary 追加摘要或附件，但必须保留原始结果与退出码。
{% endnote %}

```python
import pytest


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        report.user_properties.append(("failure_kind", "call"))
```

{% note info flat %}
这段实现只在 call 阶段记录结构化属性；它不修改 report.outcome，也不把完整异常文本写到公开日志。若要添加文件附件，先清理敏感字段并记录相对产物名。
{% endnote %}

## 扩展边界

| 需求 | 适合入口 | 不应做的事 |
| --- | --- | --- |
| 给测试提供资源 | Fixture | 在 Hook 中手动调用测试函数 |
| 注册选项/配置 | pytest_addoption、addini | 直接读取私有 Config 字段 |
| 调整收集集合 | collection_modifyitems、ignore_collect | 在 call 阶段临时删除节点 |
| 观察结果 | makereport、terminal_summary | 吞掉异常或伪造通过 |
| 发布插件 | 独立包和 entry point | 依赖未声明的私有模块 |

{% note info flat %}
非初始 conftest 的加载范围取决于收集路径；若插件必须对所有项目生效，应使用已安装插件或显式 -p。Hook 失败应让退出码暴露问题，不能把扩展错误变成绿色报告。
{% endnote %}

## 常见问题

{% flashcard basic id:pytest-fixture-vs-hook deck:"Pytest" priority:1 tags:"扩展边界" %}
--- question
Fixture 与 Hook 分别适合扩展什么？
--- answer
Fixture 为测试函数提供依赖资源，Hook 扩展运行器的启动、收集、执行或报告阶段。
--- explanation
Fixture 参与的是测试函数的依赖图，Hook 参与的是运行器生命周期。可以把同一个需求拆成两条证据：

```python
@pytest.fixture
def client():
    return FakeClient()


def pytest_collection_modifyitems(items):
    # 这里处理收集到的节点，而不是创建测试依赖。
    for item in items:
        ...
```

测试需要客户端、目录或数据时用 Fixture；需要注册选项、调整 items、观察报告或写摘要时用 Hook。不要在 Hook 中隐式创建测试参数，否则测试的输入来源会从签名中消失。
{% endflashcard %}

{% flashcard basic id:pytest-hook-wrapper deck:"Pytest" priority:1 tags:"Hook 顺序" %}
--- question
Hook wrapper 的 yield 前后分别发生什么？
--- answer
yield 前进入被包装调用，yield 后读取结果或异常并决定继续传播；wrapper 不应吞掉失败。
--- explanation
wrapper 的 `yield` 是阶段边界：进入 `yield` 前可以设置上下文，恢复后可以读取内部 Hook 的结果。当前 Pytest/pluggy 的新式 `wrapper=True` 直接得到结果；旧式 `hookwrapper=True` 才会得到 `outcome` 对象。

```python
@pytest.hookimpl(wrapper=True)
def pytest_pyfunc_call(pyfuncitem):
    result = yield
    # 只观察或包装结果；异常会自然向上抛出。
    return result
```

如果使用旧式 `hookwrapper=True`，才写 `outcome = yield` 后调用 `outcome.get_result()`。无论哪种形式，都不要吞掉异常、伪造成功或返回不符合 Hook 签名的对象。
{% endflashcard %}

{% flashcard basic id:pytest-plugin-discovery deck:"Pytest" priority:2 tags:"插件发现" %}
--- question
Pytest 从哪些入口发现并加载插件？
--- answer
内置插件、-p、pytest11 entry point、PYTEST_PLUGINS 和 conftest.py 都可能参与，具体顺序用 --trace-config 核对。
--- explanation
插件入口决定了扩展的生命周期和复用范围：

| 入口 | 适用范围 | 诊断证据 |
| --- | --- | --- |
| `conftest.py` | 当前项目或子目录 | `--trace-config` |
| `-p name` | 本次命令显式加载 | 命令行与加载日志 |
| `pytest11` entry point | 安装后跨项目复用 | 分发包元数据 |
| `PYTEST_PLUGINS` | 进程环境临时扩展 | 环境变量与加载日志 |

禁用自动加载时，entry point 和环境插件可能不再出现；因此要把 `--trace-config` 的实际加载列表作为诊断证据，而不是只检查插件源码存在。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Writing plugins, https://docs.pytest.org/en/stable/how-to/writing_plugins.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Writing hook functions, https://docs.pytest.org/en/stable/how-to/writing_hook_functions.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link API reference, https://docs.pytest.org/en/stable/reference/reference.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

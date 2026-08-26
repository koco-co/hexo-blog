---
title: Pytest(二)测试基础与执行模型
tags:
  - Pytest
  - 测试基础
  - Python测试
categories:
  - Learn Topic
  - Pytest
description: 能编写并解释首个测试，区分收集、执行、报告和 unittest 兼容边界
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 2
published: true
abbrlink: 9d696b94
date: 2026-08-26 09:00:00
---

{% course_series %}

{% note primary flat %}
本节要解决的是“一个测试为什么会得到这个结果”。你会用一个小型折扣函数走完环境准备、收集、setup、call、teardown、报告和退出码，并能判断失败是断言失败、运行错误还是收集阶段没有找到测试。unittest 用例可以被 Pytest 执行，但两者的资源注入方式仍有边界。
{% endnote %}

## 测试职责

{% note info flat %}
先把测试写成一个可观察的契约：Arrange 准备输入，Act 调用被测行为，Assert 检查结果。单元测试只隔离一个函数；集成测试允许真实模块协作；端到端测试验证外部可见流程。测试层级不是“越高越好”，而是用反馈速度和隔离成本换取不同证据。
{% endnote %}

{% mermaid %}
flowchart TD
  A[准备输入 Arrange] --> B[调用行为 Act]
  B --> C[检查结果 Assert]
  C --> D{需要真实协作者吗}
  D -->|否| E[单元测试]
  D -->|是| F[集成或端到端测试]
{% endmermaid %}

| 层级 | 输入与协作者 | 失败通常说明 | 反馈速度 |
| --- | --- | --- | --- |
| 单元 | 内存值、少量替身 | 函数规则或边界条件错误 | 快 |
| 集成 | 真实模块、临时资源 | 接口、序列化或资源协作错误 | 中 |
| 端到端 | 可运行服务和用户入口 | 部署、网络或跨系统流程错误 | 慢 |

## 环境准备

{% note info flat %}
把运行环境当作测试输入的一部分。使用当前目录下的隔离环境，随后用 `python -m pytest` 调用解释器绑定的 Pytest，避免系统中另一个 `pytest` 可执行文件抢先被找到。
{% endnote %}

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install pytest
python -m pytest --version
mkdir -p lab/tests
```

在 `lab/discount.py` 写入最小业务函数：

```python
def apply_discount(total: int, rate: int) -> int:
    if total < 0 or not 0 <= rate <= 100:
        raise ValueError("total must be non-negative and rate must be 0..100")
    return total * (100 - rate) // 100
```

在 `lab/tests/test_discount.py` 写入首个测试：

```python
from lab.discount import apply_discount


def test_apply_discount():
    assert apply_discount(100, 20) == 80
```

{% note success flat %}
从项目根目录运行 `python -m pytest lab/tests/test_discount.py -q`。成功标准不是“终端出现绿色”，而是收集到 1 个用例、退出码为 0，并且报告的 Node ID 指向预期文件和函数。
{% endnote %}

## 首个测试

{% note info flat %}
同一个输入可以产生三种不同证据。下面的页签只对照结果，不隐藏修复步骤；每个示例都可以放进 `lab/tests/test_outcomes.py` 后单独运行。
{% endnote %}

{% tabs 首次结果, 1 %}
<!-- tab passed -->
```python
def test_passed():
    assert apply_discount(100, 20) == 80
```

输出为 `1 passed`，退出码为 `0`。
<!-- endtab -->
<!-- tab failed -->
```python
def test_failed():
    assert apply_discount(100, 20) == 70
```

测试已被收集并执行，断言不成立，输出为 `1 failed`，退出码通常为 `1`。
<!-- endtab -->
<!-- tab error -->
```python
def test_error():
    apply_discount(-1, 20)
```

测试进入执行阶段但抛出未被断言的 `ValueError`，输出为 `1 error`，退出码通常为 `1`。错误不是“断言写错”，应先检查输入、Fixture 或被测代码是否在 setup/call 中异常退出。
<!-- endtab -->
{% endtabs %}

{% note success flat %}
`failed` 表示测试已经给出一个不符合预期的结果；`error` 表示测试流程本身没有正常完成。两者都让命令失败，但修复路径不同：前者检查契约，后者检查环境、资源建立和异常传播。
{% endnote %}

## 执行生命周期

{% timeline Pytest 运行, blue %}
<!-- timeline 启动 -->
解析命令行和配置，建立 `Config`，决定根目录与插件入口。
<!-- endtimeline -->
<!-- timeline 收集 -->
遍历测试路径并创建收集节点；此时还没有调用测试函数。
<!-- endtimeline -->
<!-- timeline setup -->
解析 Fixture 依赖并建立资源；setup 失败时 call 不会运行。
<!-- endtimeline -->
<!-- timeline call -->
调用测试函数，记录通过、断言失败或未处理异常。
<!-- endtimeline -->
<!-- timeline teardown -->
按依赖的逆序执行清理；清理失败会追加报告，不能假设原始断言是唯一失败。
<!-- endtimeline -->
<!-- timeline report -->
汇总每个节点的结果、回溯和输出，生成终端或 XML 等报告。
<!-- endtimeline -->
<!-- timeline exit -->
把整体结果映射为退出码，供本地脚本和 CI 判断。
<!-- endtimeline -->
{% endtimeline %}

| 阶段 | 主要问题 | 可观察证据 |
| --- | --- | --- |
| 启动 | 配置、插件或参数是否可解析 | header、配置警告、usage error |
| 收集 | 测试文件和函数是否被找到 | `--collect-only`、Node ID |
| setup | Fixture 是否成功建立 | `E`、Fixture 回溯 |
| call | 测试行为是否满足断言 | `PASSED`、`FAILED`、异常回溯 |
| teardown | 资源是否可靠释放 | teardown 错误、附加失败 |
| report/exit | 消费者能否读取结果 | 终端摘要、JUnit XML、退出码 |

{% note warning flat %}
不要把“没有看到测试失败”当成“测试运行成功”。收集到 0 个用例、配置解析错误和插件缺失都可能让命令以非零退出码结束，却没有进入 call 阶段。排查时先看收集数量，再看阶段标签，最后看断言文本。
{% endnote %}

## unittest 兼容

{% note primary flat %}
Pytest 可以发现并执行 `unittest.TestCase`，这适合渐进迁移；但 unittest 的 `setUp`/`tearDown`、方法式断言和 Pytest Fixture 并不是同一套注入协议。不要把一个框架的 Fixture 参数直接塞进另一个框架的测试方法。
{% endnote %}

```python
import unittest


class TestLegacyDiscount(unittest.TestCase):
    def test_legacy_case(self):
        self.assertEqual(80, 100 * (100 - 20) // 100)
```

{% note info flat %}
运行 `python -m pytest lab/tests/test_legacy.py -q` 可以收集这个类；迁移时可以先保留 `TestCase`，再把独立行为移成普通函数。选择哪种写法取决于共享的旧基类、团队迁移节奏和是否需要 Fixture/参数化，而不是单纯追求代码更短。
{% endnote %}

| 能力 | unittest 用例在 Pytest 中的情况 | 迁移边界 |
| --- | --- | --- |
| 发现与执行 | 可以按 `TestCase` 规则收集和运行 | 仍受 Pytest 路径、命名和配置影响 |
| `setUp`/`tearDown` | 继续由 unittest 生命周期调用 | 不会自动变成同名 Fixture |
| `self.assert*` | 可以继续使用 | 新代码可逐步改为原生 `assert` |
| Pytest Fixture 参数 | 不能直接注入 TestCase 方法 | 用 Fixture、辅助函数或适配层连接 |
| 参数化 | 不能把 `@pytest.mark.parametrize` 当作 TestCase 方法签名 | 迁移为普通函数或保留 unittest 自己的参数方案 |

## 常见问题

{% flashcard basic id:pytest-execution-phases deck:"Pytest" priority:1 tags:"执行模型" %}
--- question
一次 Pytest 运行包含哪些阶段，失败阶段会怎样影响结果？
--- answer
按启动、收集、setup、call、teardown、报告和退出码理解；setup 失败不会进入 call，teardown 失败会追加清理错误。
--- explanation
先确认是否收集到目标 Node ID，再判断失败发生在 Fixture 建立、测试调用还是资源清理。`failed` 通常表示断言不符，`error` 表示流程异常；两者都应结合回溯和退出码处理，不能只看终端颜色。
{% endflashcard %}

{% flashcard basic id:pytest-vs-unittest deck:"Pytest" priority:2 tags:"迁移" %}
--- question
Pytest 与 unittest 的兼容边界是什么？
--- answer
Pytest 能运行 `unittest.TestCase`，但 Fixture 参数化等 Pytest 注入能力不会自动变成 TestCase 方法参数。
--- explanation
兼容主要覆盖发现与执行，旧的 `setUp`、`tearDown` 和 `self.assert*` 可以继续工作。迁移时先保持行为证据，再按模块把测试函数、Fixture 和参数化改成 Pytest 风格，避免一次迁移同时改变测试语义。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Getting started, https://docs.pytest.org/en/stable/getting-started.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link unittest support, https://docs.pytest.org/en/stable/how-to/unittest.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

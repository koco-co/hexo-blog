---
title: Pytest(六)参数化与用例建模
tags:
  - Pytest
  - 参数化
  - 数据驱动测试
categories:
  - Learn Topic
  - Pytest
description: 能在参数化、Fixture 参数化、动态生成和 subtests 之间选择合适的用例模型
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 6
published: false
abbrlink: f6690364
date: 2026-08-26 09:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决的是“决策表如何变成可诊断的测试节点”。先比较参数化测试、参数化 Fixture 和 unittest subtests 的失败粒度，再用 pytest.param、ID、组合和 indirect 建模资源，最后处理运行期数据与空参数集。参数化的目标是让每组输入独立可选、可复跑，而不是无上限地制造用例数量。
{% endnote %}

## 模型选择

{% note info flat %}
如果每组数据都应独立收集、独立重跑，优先使用 pytest.mark.parametrize；如果输入需要先转换成资源或建立环境，使用参数化 Fixture；如果必须在一次测试方法中共享状态并逐项汇报，可考虑 subtests。选择标准是失败隔离、资源成本和报告消费者，而不是装饰器数量。
{% endnote %}

{% mermaid %}
flowchart TD
  A[数据表] --> B{每组独立 Node 吗}
  B -->|是| C[parametrize]
  B -->|需要资源转换| D[Fixture params 或 indirect]
  B -->|共享一次调用| E[unittest subtests]
  C --> F[独立收集与复跑]
  D --> F
  E --> G[同一测试体内多结果]
{% endmermaid %}

| 模型 | 收集结果 | 资源时机 | 失败粒度 | 适合 |
| --- | --- | --- | --- | --- |
| parametrize | 每组一个 Node | 收集时确定参数 | 单组失败 | 纯输入、边界与契约 |
| Fixture params | 每组一个 Node | Fixture 建立时转换 | 单组失败 | 数据库、客户端、临时资源 |
| subtests | 通常一个测试方法 | 测试体内循环 | 子测试报告依赖插件/运行器 | 必须共享昂贵状态的旧用例 |

{% tabs 用例模型, 1 %}
<!-- tab 直接参数化 -->
```python
import pytest


@pytest.mark.parametrize(
    ("total", "rate", "expected"),
    [(100, 0, 100), (100, 20, 80), (50, 100, 0)],
)
def test_discount(total, rate, expected):
    assert total * (100 - rate) // 100 == expected
```
每一组数据都是独立 Node，可用方括号 ID 复跑。
<!-- endtab -->
<!-- tab Fixture 参数化 -->
```python
import pytest


@pytest.fixture(params=[{"rate": 0}, {"rate": 20}])
def discount_case(request):
    return request.param


def test_discount_fixture(discount_case):
    assert discount_case["rate"] in {0, 20}
```
资源转换和清理放在 Fixture，测试只接收完成的资源。
<!-- endtab -->
<!-- tab subtests -->
```python
import unittest


class TestDiscount(unittest.TestCase):
    def test_table(self):
        for total, expected in [(100, 100), (100, 80)]:
            with self.subTest(total=total):
                self.assertIn(expected, {100, 80})
```
适合保留旧 TestCase 的共享状态；若每组都要被 Pytest 单独选择，改为 parametrize。
<!-- endtab -->
{% endtabs %}

## 参数集合

{% note success flat %}
pytest.param 把单行数据、标记和 ID 放在一起，适合为某个边界输入附加 xfail 或可读名称。ids 可在装饰器层统一格式化；pytest.HIDDEN_PARAM 只隐藏单个重复 ID，不能用来抹掉重要的失败上下文。
{% endnote %}

```python
import pytest


cases = [
    pytest.param(100, 20, 80, id="member-20"),
    pytest.param(0, 20, 0, id="empty-total"),
    pytest.param(-1, 20, None, marks=pytest.mark.xfail(raises=ValueError), id="negative"),
]


@pytest.mark.parametrize(("total", "rate", "expected"), cases)
def test_discount_cases(total, rate, expected):
    if expected is None:
        with pytest.raises(ValueError):
            raise ValueError("total must be non-negative")
    else:
        assert total * (100 - rate) // 100 == expected
```

{% note info flat %}
ID 应说明业务输入而不是重复实现细节。使用 ids= 函数时必须保证在参数变化后仍稳定；Unicode ID 可以提高可读性，但 CI 日志和复制命令仍应可识别。
{% endnote %}

## 组合策略

{% note warning flat %}
多个 parametrize 装饰器会形成笛卡尔积。两个各 10 行的参数表已经生成 100 个 Node；当组合数量由业务约束决定时，优先在 Python 中生成合法组合，或把不适用项标记为 skip/xfail，不要让无效笛卡尔积淹没真正边界。
{% endnote %}

```python
import pytest


@pytest.mark.parametrize("currency", ["CNY", "USD"])
@pytest.mark.parametrize("rate", [0, 20, 100])
def test_currency_discount(currency, rate):
    assert currency in {"CNY", "USD"}
    assert 0 <= rate <= 100
```

{% note info flat %}
上例收集 2 × 3 个节点。若货币和折扣存在业务组合限制，可以先写 valid_cases = [(currency, rate) ... if ...]，再一次性参数化，并让每个 ID 包含完整决策表键。
{% endnote %}

## 间接参数化

{% note info flat %}
indirect=True 改变的是数据流：参数值先进入同名 Fixture 的 request.param，Fixture 再负责创建资源。这样可以把昂贵建立延后到 setup，并让失败归因于资源建立而不是测试函数。
{% endnote %}

```python
import pytest


@pytest.fixture
def account(request, tmp_path):
    path = tmp_path / f'{request.param}.json'
    path.write_text('{"level": "' + request.param + '"}')
    return path


@pytest.mark.parametrize("account", ["member", "vip"], indirect=True)
def test_account_file(account):
    assert account.read_text().startswith('{"level":')
```

{% note info flat %}
只有部分参数需要间接处理时传入 indirect=["account"]，不要把所有参数都塞进 Fixture。Fixture 的 request.param 只在该参数化请求中存在，普通静态 Fixture 不应假设它总有值。
{% endnote %}

## 动态生成

{% folding open purple, 运行期数据的最小生成器 %}
pytest_generate_tests(metafunc) 在收集阶段调用，可以根据 metafunc.fixturenames 和 metafunc.config 动态生成参数。它适合数据文件、命令行选择或插件提供的矩阵，但生成结果必须可重复并带稳定 ID。

```python
def pytest_generate_tests(metafunc):
    if "currency_case" not in metafunc.fixturenames:
        return
    cases = [("CNY", 0), ("CNY", 20)]
    ids = [f"{currency}-{rate}" for currency, rate in cases]
    metafunc.parametrize("currency_case", cases, ids=ids)
```

如果数据文件不存在，选择明确的错误或空参数集行为，并把路径、数量和版本写入收集日志；不要在测试函数执行时临时追加全局列表。
{% endfolding %}

## 边界数据

{% note primary flat %}
参数集合也是输入校验。空集合、重复 ID、类型不匹配和参数构造阶段异常都应有预期结果；先用 --collect-only 确认节点，再运行一组最小数据，最后执行完整矩阵。
{% endnote %}

| 边界 | 可观察结果 | 处理建议 |
| --- | --- | --- |
| 空参数集 | 默认按配置标记 skip/fail | 选择 empty_parameter_set_mark，不要静默假装通过 |
| Unicode ID | 终端可读但复制需注意编码 | 保留业务名，必要时同时给 ASCII 前缀 |
| 类型错误 | 收集或 setup 早失败 | 让错误指向参数行或 Fixture |
| 预期异常 | 单组 xfail/raises | 给出异常类型和稳定消息 |
| 重复 ID | 报告难区分 | 在生成器中保证唯一 ID |

{% note danger flat %}
不要从不稳定的当前时间、随机数或网络列表直接生成参数，除非同时冻结种子、快照或输入版本。否则同一个 Node ID 可能在两次运行中代表不同数据，--lf 和 CI 重试就失去意义。
{% endnote %}

## 常见问题

{% flashcard basic id:pytest-parametrize-vs-subtests deck:"Pytest" priority:1 tags:"用例模型" %}
--- question
参数化与 subtests 的失败粒度和收集模型有何不同？
--- answer
参数化在收集阶段为每组数据生成独立 Node；subtests 通常在一次测试体中循环，共享调用上下文。
--- explanation
参数化可以按 Node ID、标记和缓存单独复跑，失败通常只影响对应数据。subtests 适合必须共享一次昂贵准备的 unittest 风格测试，但报告粒度取决于运行器支持；需要 Pytest 级独立选择时应拆成参数化。
{% endflashcard %}

{% flashcard basic id:pytest-indirect deck:"Pytest" priority:2 tags:"Fixture 参数化" %}
--- question
indirect 参数化改变了哪一段数据流？
--- answer
参数值先进入 Fixture 的 request.param，再由 Fixture 创建测试资源，测试函数收到转换后的对象。
--- explanation
间接参数化把资源建立留在 setup 阶段，适合文件、客户端和数据库输入。只有写在 parametrize 中的对应参数才会有 request.param；普通 Fixture 不应无条件读取它。
{% endflashcard %}

{% flashcard basic id:pytest-param-ids deck:"Pytest" priority:2 tags:"可诊断性" %}
--- question
参数 ID 应使用 ids、pytest.param 还是 Hook？
--- answer
单行语义用 pytest.param(id=...)，一组规则用 ids=，跨项目统一格式才考虑收集 Hook。
--- explanation
先选择最窄的公开入口：局部 ID 不需要全局 Hook。ID 应稳定、可读并包含业务输入；动态生成时同时检查重复和 Unicode 复制边界，确保 Node ID 能复跑。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Parametrize, https://docs.pytest.org/en/stable/how-to/parametrize.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Subtests, https://docs.pytest.org/en/stable/how-to/subtests.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Parametrize examples, https://docs.pytest.org/en/stable/example/parametrize.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

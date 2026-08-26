---
title: Pytest(四)断言与结果诊断
tags:
  - Pytest
  - 断言
  - 测试诊断
categories:
  - Learn Topic
  - Pytest
description: 能从断言、异常、警告、输出和日志中提取可定位的失败证据
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 4
published: false
abbrlink: ac715911
date: 2026-08-26 09:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决的是“失败信息怎样变成下一步修复”。同一个折扣函数会故意产生值不等、异常类型不对、警告遗漏、输出不完整和日志级别错误；你会按证据层选择 `assert`、`raises`、`warns`、捕获 Fixture、回溯和 PDB，而不是把所有问题都改成字符串比较。
{% endnote %}

## 断言重写

{% note info flat %}
Pytest 会在导入测试模块时重写断言表达式，失败时展开比较双方、集合差异和布尔子表达式。它仍然是 Python 原生 `assert`，所以表达式必须保持可读；把复杂业务逻辑塞进断言会让诊断变差。
{% endnote %}

{% mermaid %}
flowchart TD
  A[执行 assert] --> B{表达式为真吗}
  B -->|是| C[记录通过]
  B -->|否| D[断言重写提取值]
  D --> E[比较差异与回溯]
  E --> F[定位输入或实现]
{% endmermaid %}

```python
def normalize_roles(roles: list[str]) -> list[str]:
    return sorted(role.strip().lower() for role in roles)


def test_roles_are_normalized():
    actual = normalize_roles([" Admin", "reader "])
    assert actual == ["admin", "owner"]
```

{% note info flat %}
失败输出会显示 `reader` 与 `owner` 的差异，通常比 `assert str(actual) == str(expected)` 更有用。辅助模块若包含测试断言，应在模块导入前调用 `pytest.register_assert_rewrite("package.helper")`，否则辅助模块里的表达式不会获得同样的展开信息。
{% endnote %}

## 值的比较

{% note success flat %}
选择断言时先问“结果的等价关系是什么”。集合比较关注成员，文本比较关注差异，映射比较关注键和值；浮点结果则需要显式容差。每个断言都要让失败输出回答“哪一个值不符合”。
{% endnote %}

| 目标 | 推荐写法 | 失败证据 |
| --- | --- | --- |
| 列表顺序重要 | `assert actual == expected` | 索引差异与双方内容 |
| 只关心成员 | `assert set(actual) == set(expected)` | 缺失与多余成员 |
| 文本片段 | `assert "timeout" in message` | 实际文本回溯 |
| 映射字段 | `assert response["status"] == "paid"` | 键值定位 |
| 浮点计算 | `assert actual == pytest.approx(expected, rel=..., abs=...)` | 容差边界 |

```python
import pytest


def test_ratio_uses_explicit_tolerance():
    measured = 0.1 + 0.2
    assert measured == pytest.approx(0.3, rel=1e-6, abs=1e-12)
```

{% note info flat %}
`rel` 按期望值的相对误差比较，`abs` 提供绝对误差下限；对接近零的结果不能只依赖相对误差。`nan_ok=True` 只在 NaN 本身就是业务允许值时使用，否则会掩盖计算错误。
{% endnote %}

## 异常与警告

{% note warning flat %}
只断言异常类型通常不够：同一个 `ValueError` 可能来自不同输入。用 `match` 检查稳定的消息片段，或在上下文中检查异常对象属性；不要把完整、易变的日志文本当成唯一契约。
{% endnote %}

```python
import warnings

import pytest


def parse_rate(text: str) -> int:
    rate = int(text)
    if not 0 <= rate <= 100:
        raise ValueError("rate must be between 0 and 100")
    return rate


def test_invalid_rate_has_context():
    with pytest.raises(ValueError, match="between 0 and 100"):
        parse_rate("120")


def test_deprecation_is_visible():
    with pytest.warns(DeprecationWarning, match="legacy"):
        warnings.warn("legacy API", DeprecationWarning)
```

{% note info flat %}
`pytest.raises` 还可以用 `check` 对异常对象做结构化判断；`pytest.warns` 检查警告类型和消息；`pytest.deprecated_call` 专门表达弃用路径。异常组或多个警告应先明确业务要验证的是“至少一个”还是“精确集合”，再选择遍历或独立断言。
{% endnote %}

## 输出与日志

{% note info flat %}
输出捕获和日志捕获解决不同问题：`capsys`/`capfd` 读取标准流，`caplog` 读取 Python logging 记录，`recwarn` 读取警告。它们都只在测试执行期间提供观察窗口，不能代替对返回值和副作用的断言。
{% endnote %}

```python
import logging


def notify(logger: logging.Logger) -> None:
    print("notification queued")
    logger.warning("legacy channel")


def test_output_and_log(capfd, caplog):
    logger = logging.getLogger("notify")
    with caplog.at_level(logging.WARNING, logger="notify"):
        notify(logger)

    out, err = capfd.readouterr()
    assert "notification queued" in out
    assert err == ""
    assert "legacy channel" in caplog.text
```

{% note info flat %}
使用 `capsys` 检查 Python 层的 `sys.stdout`/`sys.stderr`；调用会绕过 Python 重定向的子进程或文件描述符时才考虑 `capfd`。`caplog.records` 适合检查结构化字段，`caplog.text` 适合短的可读片段。
{% endnote %}

## 失败调试

{% folding open blue, 逐层缩小失败范围 %}
先保留失败回溯和参数，再在同一个 Node ID 上复现。`--tb=short` 适合 CI 的紧凑输出，`--show-capture=all` 可以查看捕获的输出；`--pdb` 在失败处进入调试器，`breakpoint()` 则把断点写进需要反复观察的路径。定位后应把发现转成稳定断言，而不是依赖一次手工调试。

```bash
python -m pytest 'lab/tests/test_discount.py::test_invalid_rate' --tb=short
python -m pytest 'lab/tests/test_discount.py::test_invalid_rate' --show-capture=all
python -m pytest 'lab/tests/test_discount.py::test_invalid_rate' --pdb
```
{% endfolding %}

| 证据 | 适合回答 | 常见误区 |
| --- | --- | --- |
| 回溯 | 哪一行、哪一个 Node ID 失败 | 只截取最后一行错误 |
| 局部变量 | 输入在失败点是什么 | 直接把敏感变量写进报告 |
| 捕获输出 | 被测代码写出了什么 | 用 `-s` 代替结构化断言 |
| PDB | 运行时状态如何变化 | 修复后忘记移除临时断点 |

{% note danger flat %}
调试输出可能包含令牌、用户数据或请求头。分享失败日志前先清理敏感字段；`caplog`、JUnit 和 Allure 都可能保存原始文本，后续报告文章会专门处理产物安全。
{% endnote %}

## 常见问题

{% flashcard basic id:pytest-assert-rewrite deck:"Pytest" priority:1 tags:"断言" %}
--- question
普通 `assert` 为什么能显示丰富差异？
--- answer
Pytest 在导入测试模块时重写断言表达式，失败时可以展开比较双方和子表达式。
--- explanation
断言仍是 Python 语法，但 Pytest 会保存表达式中的中间值并生成更有用的回溯。通过动态导入的辅助模块需要先调用 `register_assert_rewrite`，否则该模块内的断言可能只显示普通的 `AssertionError`。
{% endflashcard %}

{% flashcard basic id:pytest-raises-match deck:"Pytest" priority:1 tags:"异常" %}
--- question
`pytest.raises` 只匹配异常类型为什么不够？
--- answer
同一异常类型可能对应不同原因，应使用 `match` 或 `check` 验证稳定的消息片段和异常属性。
--- explanation
测试应锁定对调用者有意义的错误契约，而不是脆弱的完整日志。`match` 适合稳定文本片段，`check` 适合结构化属性；两者都不能替代对返回值和副作用的检查。
{% endflashcard %}

{% flashcard basic id:pytest-approx-boundary deck:"Pytest" priority:2 tags:"数值" %}
--- question
`pytest.approx` 的相对和绝对容差如何共同决定结果？
--- answer
相对容差按期望值缩放，绝对容差提供接近零时的下限；`nan_ok` 只在 NaN 合法时开启。
--- explanation
浮点判断应先定义业务精度，再填写 `rel` 与 `abs`，而不是盲目放大容差。接近零的量可能需要明确的绝对容差；默认拒绝 NaN 可以尽早暴露上游计算异常。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Assert introspection, https://docs.pytest.org/en/stable/how-to/assert.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Logging and capture, https://docs.pytest.org/en/stable/how-to/logging.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link API reference, https://docs.pytest.org/en/stable/reference/reference.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

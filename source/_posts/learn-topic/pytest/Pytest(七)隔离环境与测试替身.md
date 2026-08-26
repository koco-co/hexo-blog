---
title: Pytest(七)隔离环境与测试替身
tags:
  - Pytest
  - Mock
  - monkeypatch
categories:
  - Learn Topic
  - Pytest
description: 能在正确绑定点替换协作者，隔离环境与文件副作用并验证替身交互
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 7
published: false
abbrlink: 1d2bf183
date: 2026-08-26 09:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决的是“测试如何只验证目标行为而不被外部状态牵着走”。用通知服务作为贯穿案例，先区分 Stub、Fake、Mock，再找到名称绑定点，选择 monkeypatch 或 unittest.mock，最后用 tmp_path 证明文件和环境变量没有泄漏。替身必须缩小不确定性，不能把业务实现完全重写一遍。
{% endnote %}

## 替身模型

{% note info flat %}
Stub 只提供固定返回值，Fake 提供轻量可运行实现，Mock 还记录调用并支持交互断言。状态验证回答“结果是否正确”，行为验证回答“协作者是否按约定被调用”。优先验证公开结果，只有调用本身是协议时才断言次数、顺序和关键参数。
{% endnote %}

| 替身 | 主要证据 | 适用场景 | 常见误用 |
| --- | --- | --- | --- |
| Stub | 返回值或异常 | 隔离昂贵查询 | 为每个内部方法写一条脆弱断言 |
| Fake | 状态变化 | 内存仓储、临时队列 | 与真实实现差异太大 |
| Mock | 调用记录 | 第三方客户端协议 | 只验证“被调用”而不验证结果 |
| monkeypatch | 可逆状态替换 | 环境变量、路径、属性 | 补丁范围过大或忘记恢复 |

## patch 位置

{% note warning flat %}
Mock 的关键不是“哪里定义了函数”，而是“被测模块从哪里查找这个名字”。如果 service.py 使用 from client import send，那么应 patch service.send；如果使用 import client 再调用 client.send，才 patch client.send。错误位置会让测试看似通过，却仍然调用真实网络。
{% endnote %}

```python
# app/service.py
from app.client import send


def notify(message: str) -> str:
    return send(message)
```

```python
# tests/test_service.py
from unittest.mock import Mock, patch

from app import service


def test_notify_patches_lookup_location():
    fake_send = Mock(return_value="queued")
    with patch.object(service, "send", fake_send):
        assert service.notify("hello") == "queued"
    fake_send.assert_called_once_with("hello")
```

{% note warning flat %}
spec 或 autospec=True 可以让 Mock 贴近真实对象签名，尽早发现参数拼写错误；它们不能证明真实服务返回了正确业务结果，仍需要少量集成测试覆盖协议。
{% endnote %}

## monkeypatch

{% note success flat %}
monkeypatch 在测试结束时自动恢复属性、字典、环境变量和当前目录。它适合“把状态改成可控值”，而 unittest.mock 更适合“记录并验证交互”；两者可以在同一测试中协作，但每个替换都应有局部范围。
{% endnote %}

```python
import os

import pytest


def endpoint() -> str:
    return os.environ["PAYMENT_ENDPOINT"]


def test_endpoint(monkeypatch):
    monkeypatch.setenv("PAYMENT_ENDPOINT", "https://example.test")
    assert endpoint().endswith(".test")


def test_missing_endpoint(monkeypatch):
    monkeypatch.delenv("PAYMENT_ENDPOINT", raising=False)
    with pytest.raises(KeyError):
        endpoint()
```

{% note info flat %}
常用操作包括 setattr、delattr、setitem、delitem、setenv、delenv 和 chdir；需要更窄的局部上下文时使用 monkeypatch.context()。测试结束后 Pytest 会还原修改，避免环境变量影响后续用例。
{% endnote %}

## 临时资源

{% note info flat %}
tmp_path 为每个测试提供独立的 pathlib.Path；tmp_path_factory 可以在更长作用域创建共享目录。目录生命周期和 Fixture scope 一起决定隔离范围：function 级临时文件最安全，session 级缓存必须只读或显式命名。
{% endnote %}

```python
def test_export(tmp_path):
    output = tmp_path / "result.txt"
    output.write_text("ok", encoding="utf-8")
    assert output.read_text(encoding="utf-8") == "ok"
```

{% note warning flat %}
如果需要保留失败目录用于诊断，应通过配置或日志记录目录位置，而不是把临时绝对路径硬编码进文章或报告。并行运行时不要让所有 worker 写同一个文件名，优先使用 worker 标识或 tmp_path 提供的唯一目录。
{% endnote %}

## 副作用验证

{% note primary flat %}
副作用测试至少包含三件事：调用参数、返回或异常传播、以及外部状态是否按预期改变。side_effect 可以模拟依次响应或异常，但不要用它实现完整业务流程；那会把被测逻辑复制到 Mock 中。
{% endnote %}

```python
from unittest.mock import Mock


def retry_send(send, message: str) -> str:
    try:
        return send(message)
    except TimeoutError:
        return send(message)


def test_retry_has_two_attempts():
    send = Mock(side_effect=[TimeoutError, "queued"])
    assert retry_send(send, "hello") == "queued"
    assert send.call_count == 2
    assert send.call_args_list[0].args == ("hello",)
```

{% note info flat %}
对于日志、标准输出和警告，使用 caplog、capsys/capfd 和 recwarn 观察可见证据；不要把 Mock 的内部调用列表当成最终用户行为。I/O、时间和随机数的替换应同时保留一条真实路径测试。
{% endnote %}

## 隔离边界

{% note danger flat %}
过度 Mock 会让测试只证明“Mock 按脚本运行”。如果每个内部函数都被替换，重构可能完全不触发失败。保留一条使用真实序列化、真实临时文件或真实 HTTP 适配器的集成测试，并把替身限制在网络、时钟和不可控外部服务边界。
{% endnote %}

| 风险 | 症状 | 恢复办法 |
| --- | --- | --- |
| patch 错位置 | 真实服务仍被调用 | 按被测模块的名称绑定重新定位 |
| 全局状态泄漏 | 单独通过，整套失败 | 使用 Fixture/monkeypatch 自动恢复 |
| 共享文件碰撞 | 并行时偶发覆盖 | tmp_path 或 worker 命名空间 |
| Mock 过度 | 重构不触发测试 | 提升真实协作比例，保留端到端证据 |
| spec 过窄 | 运行时才发现签名错 | 使用 autospec 并加一条真实适配测试 |

{% folding open yellow, 错误 patch 的最小实验 %}
先把 patch 写在 app.client.send，再运行 test_service.py。若 service.py 使用 from app.client import send，真实绑定仍在 app.service.send，测试会发出错误的调用。把 patch 改到 app.service.send 后，再断言返回值和 call_args，才能证明隔离成功。
{% endfolding %}

## 常见问题

{% flashcard basic id:pytest-where-to-patch deck:"Pytest" priority:1 tags:"Mock" %}
--- question
Mock 为什么要 patch 使用处而不是定义处？
--- answer
因为代码运行时按当前模块的名称绑定查找对象，应 patch 被测模块实际读取的名字。
--- explanation
from client import send 会在导入时把 send 绑定到 service.send；import client 后调用 client.send 才会通过 client 模块查找。先查看被测代码的导入形式，再选择 patch.object 的目标。
{% endflashcard %}

{% flashcard basic id:pytest-monkeypatch-vs-mock deck:"Pytest" priority:1 tags:"替身选择" %}
--- question
monkeypatch 与 mock 应如何选择？
--- answer
monkeypatch 适合可逆地修改环境、属性和字典；mock 适合记录调用并验证交互协议。
--- explanation
两者都能替换对象，但证据不同。若只需要让配置、时间或路径变得可控，优先 monkeypatch；若调用次数、参数或顺序本身是契约，使用 Mock，并保留真实结果验证。
{% endflashcard %}

{% flashcard basic id:pytest-tmp-path deck:"Pytest" priority:2 tags:"临时资源" %}
--- question
tmp_path 与 tmp_path_factory 的生命周期有何不同？
--- answer
tmp_path 通常按 function 提供独立目录；tmp_path_factory 可在更长作用域创建共享目录。
--- explanation
function 目录适合每个测试的读写文件，失败后也能由 Pytest 记录位置。工厂适合昂贵的只读缓存，但共享目录必须显式命名、避免并行写冲突，并把清理责任放在更长作用域的 Fixture 中。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link monkeypatch, https://docs.pytest.org/en/stable/how-to/monkeypatch.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link temporary directories, https://docs.pytest.org/en/stable/how-to/tmp_path.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link unittest.mock where to patch, https://docs.python.org/3/library/unittest.mock.html#where-to-patch, https://www.python.org/static/favicon.ico %}
{% endlinkgroup %}

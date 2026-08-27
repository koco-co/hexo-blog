---
title: Pytest(五)Fixture 与资源生命周期
tags:
  - Pytest
  - Fixture
  - 测试资源
categories:
  - Learn Topic
  - Pytest
description: 能用依赖图、作用域、可见性和清理顺序设计可靠的 Fixture
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 5
published: true
abbrlink: 97e28b51
date: 2026-04-23 00:00:00
---

{% course_series %}

{% note primary flat %}
本节要解决的是“测试资源何时建立、谁能使用、何时清理”。以临时订单仓库为例，先画出 Fixture 依赖图，再选择 function、module、session 等作用域，最后故意让 setup 和 teardown 出错，观察 Pytest 如何报告。Fixture 是依赖注入和生命周期合同，不是隐藏全局状态的捷径。
{% endnote %}

## 依赖注入

{% note info flat %}
测试函数参数名是 Fixture 的声明式依赖。Pytest 会先解析依赖图，再按需要建立并缓存实例；测试函数不需要手动调用 Fixture。把“准备资源”和“验证行为”分开，测试本身会更容易复用和定位。
{% endnote %}

{% mermaid %}
flowchart TD
  T[test_order_total] --> O[order]
  O --> R[repository]
  O --> U[user]
  R --> D[tmp_path]
{% endmermaid %}

```python
import pytest


@pytest.fixture
def user():
    return {"id": "u-1", "level": "member"}


@pytest.fixture
def repository(tmp_path):
    return tmp_path / "orders.json"


@pytest.fixture
def order(user, repository):
    repository.write_text('{"id": "o-1", "total": 100}')
    return {"user": user, "total": 100}


def test_order_total(order):
    assert order["total"] == 100
```

{% note info flat %}
这里 `order` 依赖 `user` 和 `repository`，而 `repository` 再依赖内置的 `tmp_path`。如果 `repository` 建立失败，测试不会进入 call；如果测试断言失败，Pytest 仍会尝试清理已经建立的资源。
{% endnote %}

## 作用域与缓存

{% note success flat %}
作用域决定同一 Fixture 实例的缓存边界：`function`、`class`、`module`、`package`、`session` 依次扩大生命周期。作用域越长，建立成本可能越低，但共享状态和并行隔离成本越高；它不决定 Fixture 在哪些目录可见。
{% endnote %}

```python
import pytest


@pytest.fixture(scope="module")
def catalog():
    return {"discount": 20}


@pytest.fixture(scope=lambda fixture_name, config: "session")
def settings():
    return {"region": "test"}
```

{% note info flat %}
动态作用域函数只在配置解析时决定作用域，返回值必须是合法作用域字符串。一个测试请求同一个 Fixture 多次时，Pytest 返回该作用域内的缓存实例；参数化 Fixture 则会按参数划分实例。
{% endnote %}

| 作用域 | 典型资源 | 风险 |
| --- | --- | --- |
| function | 临时文件、请求输入 | 建立次数多 |
| class | 一组相关方法的只读数据 | 方法间意外修改 |
| module | 模块级只读客户端 | 模块内共享污染 |
| package | 包级昂贵准备 | 目录边界和并行复杂 |
| session | 配置、连接池、只读元数据 | worker 间并不共享同一进程实例 |

## 共享与覆盖

{% note info flat %}
Fixture 的可见性由定义位置和测试所在目录决定。根目录 `conftest.py` 的 Fixture 可以向下提供，子目录可以定义同名 Fixture 覆盖它；测试代码不应直接导入 `conftest.py`。`autouse=True` 会自动请求 Fixture，适合真正的公共环境设置，不适合隐藏业务依赖。
{% endnote %}

```text
tests/
├── conftest.py          # 所有 tests 可见
├── unit/
│   └── conftest.py      # unit/ 及其子目录可见
└── integration/
    └── test_api.py      # 看不到 unit/ 的覆盖版本
```

{% note info flat %}
`@pytest.mark.usefixtures("database")` 可以在类或模块层声明副作用 Fixture，而不把返回值注入测试函数。若测试真的需要读取资源，应把它写在参数列表中，让依赖图保持可见。
{% endnote %}

## 资源清理

{% timeline Fixture 生命周期, green %}
<!-- timeline 请求 -->
收集节点后解析测试函数参数和 Fixture 依赖。
<!-- endtimeline -->
<!-- timeline 建立 -->
按依赖顺序执行 `yield` 前的准备代码，并缓存实例。
<!-- endtimeline -->
<!-- timeline 使用 -->
测试函数读取资源；此阶段失败仍会进入已建立资源的清理。
<!-- endtimeline -->
<!-- timeline 清理 -->
执行 `yield` 后代码或 `addfinalizer`，顺序是依赖建立顺序的逆序。
<!-- endtimeline -->
{% endtimeline %}

```python
import pytest


@pytest.fixture
def connection(tmp_path):
    marker = tmp_path / "connected"
    marker.write_text("open")
    yield marker
    marker.write_text("closed")


@pytest.fixture
def legacy_connection(tmp_path, request):
    marker = tmp_path / "legacy-connected"
    marker.write_text("open")

    def close():
        marker.write_text("closed")

    request.addfinalizer(close)
    return marker
```

{% note info flat %}
`yield` 更容易把建立和清理写在同一个 Fixture 中；`addfinalizer` 适合清理动作由条件分支动态决定的旧接口。只有已经成功完成建立后才注册 finalizer，避免清理不存在的资源。
{% endnote %}

{% note warning flat %}
一个 Fixture 的 teardown 抛错不会自动抹掉测试断言结果；报告可能同时显示 call 失败和清理失败。清理必须幂等，文件、连接和临时服务都要在部分建立、测试异常和重复清理时安全执行。
{% endnote %}

## request 对象

{% note info flat %}
`FixtureRequest` 提供当前节点、作用域、配置和动态访问入口。`request.node` 可读取当前测试元数据，`request.param` 用于间接参数化，`request.config` 用于读取已解析配置。动态 `getfixturevalue` 应限制在确实无法用静态参数表达的工厂场景，避免依赖图变得不可见。
{% endnote %}

```python
import pytest


@pytest.fixture(params=["member", "vip"])
def account(request):
    return {"level": request.param, "node": request.node.nodeid}


def test_account(account):
    assert account["level"] in {"member", "vip"}
```

{% note info flat %}
`request.fixturenames` 和 `request.scope` 适合诊断，`request.applymarker` 可以在运行期给当前节点追加标记；动态获取 Fixture 返回的名称必须来自受控映射，不能把用户输入直接当作 Fixture 名称。
{% endnote %}

## 失败边界

| 症状 | 根因 | 修复方向 |
| --- | --- | --- |
| `ScopeMismatch` | 长作用域 Fixture 依赖短作用域 Fixture | 缩短外层作用域或提升依赖资源 |
| Fixture 找不到 | 定义目录不在测试的向上查找路径 | 移到共同祖先的 `conftest.py` 或显式插件 |
| teardown 泄漏 | 资源建立后没有可靠清理 | 使用 `yield`/finalizer，清理操作保持幂等 |
| 并行互相覆盖 | session 只在单个 worker 内缓存 | 使用 worker 命名空间和外部锁，见稳定性文章 |

{% note danger flat %}
不要用 session Fixture 保存会被测试修改的可变全局对象，也不要让 session Fixture 依赖 function Fixture。这样的设计要么触发 `ScopeMismatch`，要么让测试顺序决定结果，最终表现为难以复现的污染。
{% endnote %}

## 常见问题

{% flashcard basic id:pytest-fixture-scope-visibility deck:"Pytest" priority:1 tags:"Fixture" %}
--- question
Fixture 的 scope 与可见性为什么不是一回事？
--- answer
scope 决定实例缓存多久，可见性决定测试从哪些目录或插件边界能找到它。
--- explanation
`scope` 回答“同一作用域内缓存多久”，查找规则回答“测试从哪里能看到它”。例如：

| 定义位置 | `scope="function"` | 可见范围 |
| --- | --- | --- |
| 根 `conftest.py` | 每个测试一份 | 所有下游测试目录 |
| `tests/api/conftest.py` | 每个测试一份 | `tests/api` 及其子目录 |

因此，一个 session Fixture 也可能只对 `tests/api` 可见；一个 function Fixture 也可能被全套件使用。排查时分别检查声明的作用域和文件所在目录，不要把“只创建一次”误当成“所有地方都能引用”。
{% endflashcard %}

{% flashcard basic id:pytest-fixture-teardown-order deck:"Pytest" priority:1 tags:"资源清理" %}
--- question
Fixture 的清理顺序如何确定？
--- answer
按依赖建立顺序的逆序清理；已经建立的每个资源都应在测试失败时执行自己的清理。
--- explanation
清理顺序是依赖建立顺序的逆序：`order -> repository -> tmp_path`。把资源写成显式依赖，Pytest 才知道在部分失败时应该清理什么：

```python
@pytest.fixture
def repository(tmp_path):
    db = tmp_path / "orders.db"
    db.touch()
    yield db
    db.unlink(missing_ok=True)  # repository 自己负责释放


@pytest.fixture
def order(repository):
    yield repository / "order-1"
```

如果 `order` 建立失败，已完成的 `repository` 仍会执行自己的 teardown；`yield` 之后的清理代码和 `addfinalizer` 都必须考虑“资源只建立了一半”以及清理自身抛错的情况。
{% endflashcard %}

{% flashcard basic id:pytest-scope-mismatch deck:"Pytest" priority:1 tags:"作用域" %}
--- question
ScopeMismatch 为什么发生，应该从哪里修？
--- answer
长作用域 Fixture 依赖短作用域 Fixture 时发生；应重新划分资源边界，而不是强行捕获异常。
--- explanation
作用域必须沿依赖链保持兼容：长生命周期的对象不能依赖更短生命周期的对象，否则它会在后续测试中持有已经失效的依赖。

```python
@pytest.fixture(scope="session")
def app_config():
    return load_config()


@pytest.fixture(scope="function")
def user(app_config):
    return create_user(app_config)
```

如果把 `user` 反过来注入 session Fixture，就会触发 `ScopeMismatch`。修复方式不是捕获异常，而是提升真正不可变的配置、缩短外层 Fixture，或让整条需要隔离的链保持 function 作用域。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Fixture guide, https://docs.pytest.org/en/stable/how-to/fixtures.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Fixture reference, https://docs.pytest.org/en/stable/reference/fixtures.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

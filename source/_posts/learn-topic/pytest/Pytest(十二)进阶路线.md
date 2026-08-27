---
title: Pytest(十二)进阶路线
tags:
  - Pytest
  - 插件开发
  - 进阶
categories:
  - Learn Topic
  - Pytest
description: 能判断何时进入 pytester、自定义 Collector、doctest、动态 Fixture 与低层 API
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 12
published: true
abbrlink: 76bdbbc7
date: 2026-04-30 00:00:00
---

{% course_series %}

{% note primary flat %}
本节要解决的是“什么时候值得进入 Pytest 的低层扩展面”。主实验实现一个最小 YAML Collector，再用 pytester 的子进程运行验证收集数量、失败位置和退出码；同时用索引表判断 doctest、动态 Fixture 与迁移入口。进阶 API 要以公开文档为边界，不把内部实现当作稳定合同。
{% endnote %}

## 扩展对象

{% note info flat %}
收集树由 Directory、File、Item 等节点组成，Item 才代表一个可运行测试；Report 描述阶段结果，Config 保存一次运行的配置与插件状态，Stash 提供插件间的类型化共享位置。进阶篇的重点是知道“何时进入哪个对象”，不是把所有成员抄成 API 字典。
{% endnote %}

{% mermaid %}
flowchart TD
  A[Directory] --> B[File]
  B --> C[Item]
  C --> D[Call]
  D --> E[Report]
  F[Config] --> B
  F --> E
  G[Stash] --> F
{% endmermaid %}

| 触发需求 | 公开入口 | 进入条件 |
| --- | --- | --- |
| 改变收集树 | Node、Directory、File、Item、Collector | 默认命名规则无法表达数据文件 |
| 自定义报告 | CollectReport、TestReport、pytest_runtest_makereport | 需要附加结构化证据 |
| 插件间共享 | Config、Stash | 多个 Hook 需要同一运行状态 |
| 测试插件 | Pytester、RunResult、LineMatcher | 需要验证插件在真实运行中的收集和退出码 |
| 文档示例 | doctest、doctest_namespace | 示例本身就是可执行契约 |

{% note info flat %}
低频的 fail、exit、Cache、Parser 和报告对象可以从 API Reference 按组查阅；若只是写普通测试，不需要直接依赖这些对象。
{% endnote %}

## 自定义收集

{% note success flat %}
自定义收集要保持一条端到端链：文件后缀决定是否进入 Collector，Collector 读取文件并创建 Item，Item 在 runtest 中执行单条数据，失败时通过节点位置回到原始文件。构造节点使用 from_parent，避免依赖已变化的构造器参数。
{% endnote %}

```python
# conftest.py，示例需要 PyYAML 作为插件运行依赖
from pathlib import Path

import pytest
import yaml


class YamlItem(pytest.Item):
    def __init__(self, *, spec, **kwargs):
        super().__init__(**kwargs)
        self.spec = spec

    def runtest(self):
        expected = self.spec["expected"]
        actual = self.spec["actual"]
        if actual != expected:
            raise AssertionError(f"{self.name}: {actual!r} != {expected!r}")


class YamlFile(pytest.File):
    def collect(self):
        data = yaml.safe_load(self.path.read_text(encoding="utf-8"))
        for index, spec in enumerate(data.get("tests", []), start=1):
            name = spec.get("name", f"case-{index}")
            yield YamlItem.from_parent(self, name=name, spec=spec)


def pytest_collect_file(file_path: Path, parent):
    if file_path.suffix == ".yaml":
        return YamlFile.from_parent(parent, path=file_path)
```

样例文件可以是：

```yaml
tests:
  - name: member-discount
    actual: 80
    expected: 80
  - name: wrong-discount
    actual: 70
    expected: 80
```

{% note info flat %}
这里没有把 YAML 文件改写成 Python 测试；收集器只负责把每条记录映射为 Item。生产实现还应补充 validate、repr_failure 和稳定的行号信息，并在文档中固定 PyYAML 版本与解析失败的退出行为。
{% endnote %}

## 插件测试

{% note primary flat %}
pytester 通过临时目录创建测试文件并启动 Pytest。进程内运行便于快速检查输出，子进程运行更接近真实插件发现、导入和退出码边界；涉及配置、环境变量或插件 entry point 时优先用 runpytest_subprocess。
{% endnote %}

```python
pytest_plugins = ["pytester"]


def test_yaml_plugin(pytester):
    # 运行此示例前，在环境中安装 PyYAML。
    pytester.makepyfile(
        plugin="""
import pytest
import yaml
from pathlib import Path


class YamlItem(pytest.Item):
    def __init__(self, *, spec, **kwargs):
        super().__init__(**kwargs)
        self.spec = spec

    def runtest(self):
        if self.spec["actual"] != self.spec["expected"]:
            raise AssertionError(
                f"{self.name}: {self.spec['actual']!r} != {self.spec['expected']!r}"
            )


class YamlFile(pytest.File):
    def collect(self):
        data = yaml.safe_load(self.path.read_text(encoding="utf-8"))
        for index, spec in enumerate(data.get("tests", []), start=1):
            name = spec.get("name", f"case-{index}")
            yield YamlItem.from_parent(self, name=name, spec=spec)


def pytest_collect_file(file_path: Path, parent):
    if file_path.suffix == ".yaml":
        return YamlFile.from_parent(parent, path=file_path)
"""
    )
    pytester.makeconftest(
        "pytest_plugins = ['plugin']\n"
    )
    pytester.makefile(
        ".yaml",
        sample="""tests:
  - name: ok
    actual: 1
    expected: 1
  - name: bad
    actual: 0
    expected: 1
""",
    )
    result = pytester.runpytest_subprocess("sample.yaml", "-q")
    result.assert_outcomes(failed=1, passed=1)
    result.stdout.fnmatch_lines(["*1 failed*"])
```

{% note info flat %}
pytester 结果对象还可以检查 ret、stdout、stderr、assert_outcomes 和匹配行。测试插件时不要只 import Hook 函数并手动调用，那样绕过了 Pytest 的收集和报告协议。
{% endnote %}

## doctest

{% note warning flat %}
doctest 适合把短文档示例作为可执行契约，不适合承载复杂 Fixture、异步流程或高度依赖外部状态的集成测试。浮点输出、版本差异和命名空间都必须显式处理。
{% endnote %}

```bash
python -m pytest --doctest-modules src
python -m pytest --doctest-glob="*.rst" docs
```

{% note info flat %}
doctest_namespace Fixture 可以向示例提供公共名称；示例中的输出必须稳定，必要时用省略标记或把复杂对象改成可比较的字段。打开 doctest 后要重新检查收集数量，避免把文档中的交互式片段误当成完整业务测试。
{% endnote %}

## 动态 Fixture

{% note info flat %}
动态资源通常应使用 Fixture factory：一个 Fixture 返回创建函数，测试按需生成资源并在同一生命周期内清理。插件注册 Fixture 时使用公开的 pytest.fixture 或插件加载入口；不要依赖未公开的注册表字段。
{% endnote %}

```python
import pytest


@pytest.fixture
def make_account(tmp_path):
    created = []

    def factory(level):
        path = tmp_path / f"{level}.json"
        path.write_text('{"level": "' + level + '"}')
        created.append(path)
        return path

    yield factory
    for path in created:
        path.unlink(missing_ok=True)


def test_many_accounts(make_account):
    member = make_account("member")
    vip = make_account("vip")
    assert member != vip
```

{% note info flat %}
这种模式让类型、创建顺序和清理都可见；只有需要跨插件提供 Fixture 时，才把工厂放进插件模块并通过 entry point 加载。旧的动态注册接口应先核对当前版本的弃用说明，再决定是否迁移。
{% endnote %}

## 迁移边界

{% note warning flat %}
低层 API 的迁移要同时记录旧入口、当前替代、行为差异和复验命令。路径对象优先使用 pathlib，插件测试优先使用 pytester，用户代码优先使用公开 Fixture/Hook；私有 Config 字段、报告元数据和插件内部缓存不能当作长期合同。
{% endnote %}

| 旧写法或入口 | 当前方向 | 复验重点 |
| --- | --- | --- |
| testdir Fixture | Pytester Fixture | 成员、参数和进程调用语义 |
| yield_fixture | pytest.fixture 与 yield | 作用域、清理和弃用警告 |
| console_main 直接包装 | pytest.main 或命令行 | 返回值与 ExitCode |
| Config.getvalueorskip | Config.getoption(skip=True) | 选项缺失时的跳过语义 |
| 自定义测试目录构造器 | pathlib.Path 与 from_parent | 路径、节点和行号 |
| 私有报告元数据 | 公开 report 属性或 plugin API | 版本升级后的字段稳定性 |

{% note info flat %}
pytester.runpytest_inprocess 适合快速检查调用结果，runpytest_subprocess 适合验证插件发现、环境和真实退出码；两者不是同一个证据层。迁移完成后再运行一次 --trace-config 和公开发布级报告，确认没有隐式依赖。
{% endnote %}

## 常见问题

{% flashcard basic id:pytest-collector-vs-item deck:"Pytest" priority:2 tags:"扩展对象" %}
--- question
Collector 与 Item 在收集树中各负责什么？
--- answer
Collector 负责发现并生成子节点，Item 表示最终可运行的一条测试数据并执行 runtest。
--- explanation
收集树先描述“有哪些节点”，运行阶段再处理“某个节点怎样执行”。可以用这条链定位职责：

```text
Directory/File Collector → Item → setup → call(runtest) → teardown → Report
```

Collector 负责发现并生成子节点，Item 才是最终可运行的数据单元。把业务执行塞进 Collector 会让收集阶段产生副作用，也会让失败没有稳定的 Node ID、阶段和回溯位置。
{% endflashcard %}

{% flashcard basic id:pytester-inprocess-subprocess deck:"Pytest" priority:2 tags:"插件测试" %}
--- question
pytester 的进程内与子进程运行应如何选择？
--- answer
进程内适合快速检查输出和结果对象；子进程更能验证真实插件发现、导入、环境和退出码。
--- explanation
进程内模式和子进程模式观察的边界不同：

| 模式 | 能证明什么 | 典型断言 |
| --- | --- | --- |
| `runpytest` | 当前 Python 进程中的插件行为 | 结果对象、收集数量 |
| `runpytest_subprocess` | 真实导入、配置、环境和退出码 | Node ID、退出状态、日志 |

只要问题涉及 `conftest.py`、配置文件、环境变量或 entry point，就优先子进程。两种模式都应断言收集数量、失败节点和退出码，不能把标准输出中偶然出现一句文字当成插件测试通过。
{% endflashcard %}

{% flashcard basic id:pytest-public-private-api deck:"Pytest" priority:1 tags:"API 边界" %}
--- question
扩展 Pytest 时如何识别公开 API 与私有实现？
--- answer
以稳定 API Reference、公开 Hook 规范和当前弃用说明为准；带下划线的内部模块、缓存和未承诺字段默认不作为合同。
--- explanation
公开 API 的判断来自稳定 API Reference、Hook 规范和弃用说明，不是来自“当前能 import”。私有字段常以 `_` 开头，可能在小版本中改变，甚至没有兼容承诺：

| 依赖方式 | 处理策略 |
| --- | --- |
| 公开 Hook / 配置 | 直接使用，记录适用版本 |
| 已弃用但仍可用 | 标出替代项和迁移窗口 |
| 私有模块或字段 | 集中在适配层，单独做升级复验 |

业务测试不应直接依赖私有实现；如果插件暂时无法绕开它，至少把风险封装在一个小适配层，并为升级保留失败证据。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link API reference, https://docs.pytest.org/en/stable/reference/reference.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Testing plugins, https://docs.pytest.org/en/stable/how-to/writing_plugins.html#testing-plugins, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Deprecations, https://docs.pytest.org/en/stable/deprecations.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

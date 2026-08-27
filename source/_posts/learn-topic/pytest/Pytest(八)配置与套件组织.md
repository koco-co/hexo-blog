---
title: Pytest(八)配置与套件组织
tags:
  - Pytest
  - 配置
  - 测试套件
categories:
  - Learn Topic
  - Pytest
description: 能建立可预测的配置解析、导入路径和 conftest 可见性边界
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 8
published: true
abbrlink: 26397f68
date: 2026-04-26 00:00:00
---

{% course_series %}

{% note primary flat %}
本节要解决的是“同一套测试为什么在不同目录和命令下表现不同”。以 src 布局的订单项目为例，先比较 pytest.toml、pyproject.toml 和 pytest.ini，再追踪 rootdir、配置优先级、导入模式与 conftest 查找，最后用严格标记和必需插件把隐含环境变成显式失败。
{% endnote %}

## 配置格式

{% note info flat %}
当前 Pytest 支持独立的 pytest.toml，也支持 pyproject.toml、pytest.ini 和 tox.ini 中的 pytest 配置段。项目只应选择一个权威入口；多个文件同时存在时，Pytest 按自己的发现规则选取首个匹配文件，而不是把所有文件合并成一张大配置。
{% endnote %}

{% tabs 配置入口, 1 %}
<!-- tab pytest.toml -->
```toml
[pytest]
testpaths = ["tests"]
addopts = ["-ra"]
strict_markers = true
```
适合把 Pytest 配置单独放在项目根，减少与构建工具的耦合。
<!-- endtab -->
<!-- tab pyproject.toml -->
```toml
[tool.pytest]
testpaths = ["tests"]
addopts = ["-ra"]
strict_markers = true
```
适合已有 Python 工具链统一维护项目配置；以当前 Pytest 版本的格式为准。
<!-- endtab -->
<!-- tab pytest.ini -->
```ini
[pytest]
testpaths = tests
addopts = -ra
strict_markers = true
```
适合兼容旧项目，但值的解析能力较窄。
<!-- endtab -->
{% endtabs %}

{% note info flat %}
配置格式是入口选择，不是测试逻辑。将稳定命令、标记、日志和报告键写入配置，把一次性诊断参数留在命令行，并在 CI 中显式打印最终配置。
{% endnote %}

## 配置解析

{% mermaid %}
flowchart TD
  A[调用目录与参数] --> B[寻找 rootdir]
  B --> C[选择首个配置文件]
  C --> D[读取配置键]
  D --> E[命令行覆盖]
  E --> F[建立 Config 与收集路径]
{% endmermaid %}

{% note success flat %}
rootdir 是 Pytest 识别项目边界、缓存和 Node ID 的结果；它不是自动加入 sys.path 的开关。导入是否成功还取决于当前导入模式、包布局、安装状态和调用目录。
{% endnote %}

```bash
python -m pytest --trace-config
python -m pytest -c config/pytest-ci.ini --collect-only -q
python -m pytest --rootdir=.
```

{% note info flat %}
显式 -c 可以选择配置文件，但不能把任意目录误当成包根。用 pytest --showconfig（在当前版本可用时）或启动日志核对最终键值；若不确定，先比较 rootdir 和 inipath，再检查导入错误。
{% endnote %}

| 输入 | 影响 | 证据 |
| --- | --- | --- |
| 调用目录 | 配置搜索起点和 invocation dir | 启动 header |
| 显式 -c | 指定配置文件 | Config.inipath |
| addopts | 默认追加命令 | --trace-config、帮助输出 |
| 命令行选项 | 覆盖同名配置 | 最终运行行为 |
| testpaths | 默认收集目录 | --collect-only |

## 严格模式

{% note warning flat %}
严格模式的价值是把拼写错误变成收集期失败。注册自定义标记、设置 strict_markers，并按项目确实依赖的插件填写 required_plugins；不要为了“配置完整”把本机未安装的插件写进去。
{% endnote %}

```toml
[pytest]
strict_markers = true
markers = [
    "smoke: critical checks",
    "integration: uses real adapters",
]
required_plugins = ["pytest-cov"]
```

{% note info flat %}
这是 pytest.toml 的原生 TOML 写法；若项目仍使用旧版本 Pytest，应改用 pyproject.toml 的 `[tool.pytest.ini_options]` 或 pytest.ini。运行 pytest --markers 检查标记注册，运行 pytest --trace-config 检查插件是否被加载。必需插件缺失应在启动阶段失败，而不是到报告阶段才发现覆盖率命令没有生效。
{% endnote %}

## conftest 边界

{% note info flat %}
Pytest 从测试所在目录向上查找 conftest.py，并在目录层级内叠加 Fixture；子目录可以覆盖同名 Fixture。conftest.py 是本地插件入口，不应由测试代码直接 import，否则会绕过 Pytest 的加载边界并产生重复模块。
{% endnote %}

```text
tests/
├── conftest.py
├── unit/
│   ├── conftest.py
│   └── test_discount.py
└── integration/
    └── test_api.py
```

{% note info flat %}
unit/test_discount.py 能看到两个 conftest，integration/test_api.py 只能看到根级版本。共享纯函数放进普通支持模块并用包路径导入；只有 Fixture、Hook 和标记注册放进 conftest。加载顺序问题用 --trace-config 和 --collect-only 复核，不要在 import 时写入数据库或启动服务。
{% endnote %}

## 导入与布局

{% note primary flat %}
src 布局把业务包与测试路径分开，通常要求以可编辑安装或构建步骤让解释器找到业务包。importlib 模式可避免修改 sys.path，但会改变同名测试模块的导入语义；prepend/append 模式则适合兼容已有包布局。选择模式后固定在配置中，不要在测试中手工插入路径。
{% endnote %}

```text
project/
├── pyproject.toml
├── src/shop/
│   └── discount.py
└── tests/
    ├── unit/test_discount.py
    └── integration/test_api.py
```

| 模式 | 典型行为 | 注意点 |
| --- | --- | --- |
| prepend | 将测试目录放入 sys.path 前部 | 同名模块可能遮蔽已安装包 |
| append | 将测试目录放入 sys.path 后部 | 旧项目兼容性较好，隐藏导入错误 |
| importlib | 按导入器加载测试模块 | 同名文件可共存，但不能依赖相对 sys.path 副作用 |
| src 布局 | 业务包位于 src | CI 应验证安装步骤和源码导入一致 |

## 套件分层

{% note success flat %}
目录分层应反映反馈速度和真实协作者：unit 只依赖内存值和小型 Fake，integration 使用临时数据库或文件，端到端才连接运行中的服务。共享 Fixture 只提供稳定前提，业务变体通过参数化或局部 Fixture 表达。
{% endnote %}

| 目录 | 标记 | 允许协作者 | 默认命令 |
| --- | --- | --- | --- |
| tests/unit | unit 或无标记 | 内存对象、Fake | python -m pytest tests/unit |
| tests/integration | integration | 临时资源、真实适配器 | python -m pytest -m integration |
| tests/e2e | e2e | 测试服务和网络 | CI 单独阶段 |
| tests/support | 不被收集 | 工具函数、数据构造器 | 不直接运行 |

{% note info flat %}
unittest 目录可以先通过配置保留原发现规则，再逐步迁移到函数、Fixture 和标记。每次迁移保持同一个行为断言和报告证据，避免配置重排与业务改写同时发生。
{% endnote %}

## 常见问题

{% flashcard basic id:pytest-rootdir-syspath deck:"Pytest" priority:1 tags:"配置" %}
--- question
rootdir 会自动修改 sys.path 吗？
--- answer
不会；rootdir 主要确定项目边界、配置、缓存和 Node ID，导入路径由布局、安装状态和导入模式决定。
--- explanation
`rootdir` 是 Pytest 的项目边界，不是 Python 的导入路径开关。它影响配置文件、`.pytest_cache` 和 Node ID 的相对起点；`sys.path` 仍由启动方式、安装状态和导入模式决定。

```bash
python -m pytest --trace-config --collect-only -q
python -c 'import app; print(app.__file__)'
```

采用 `src/` 布局时，应在当前环境安装项目（例如 editable install）或明确配置导入模式，再分别验证收集和实际 import。看到正确的 `rootdir` 不能推出业务包一定可导入。
{% endflashcard %}

{% flashcard basic id:pytest-conftest-visibility deck:"Pytest" priority:1 tags:"Fixture 可见性" %}
--- question
conftest.py 的 Fixture 为什么在某些目录不可见？
--- answer
Fixture 按测试目录向上查找，子目录可以覆盖父级；兄弟目录的 conftest 不会互相可见。
--- explanation
Pytest 从测试所在目录向上寻找 `conftest.py`，不会横向搜索兄弟目录。目录关系可以这样判断：

```text
tests/conftest.py              ← tests/api/test_user.py 可见
tests/api/conftest.py          ← tests/api 及子目录可见
tests/web/conftest.py          ← tests/api 不可见
```

把共同 Fixture 放在共同祖先或显式插件里；纯工具函数放到普通模块并正常导入。不要直接 `import conftest`，那会绕开 Pytest 的可见性和插件注册边界。
{% endflashcard %}

{% flashcard basic id:pytest-config-precedence deck:"Pytest" priority:2 tags:"配置解析" %}
--- question
多个 pytest 配置文件同时存在时如何选择？
--- answer
Pytest 按发现规则选择首个匹配配置，命令行 -c 可显式指定；不是把所有文件按键合并。
--- explanation
配置文件不是按键逐个合并的清单；Pytest 按发现规则选择一个入口，`-c` 可以显式指定入口，命令行再覆盖配置项。排查时先把选择结果打印出来：

```bash
python -m pytest --trace-config --collect-only -q
python -m pytest -c config/pytest-ci.ini -q
```

重点核对 invocation directory、`rootdir`、`inipath` 和最终命令行。项目保留一个权威配置，CI 固定工作目录或显式使用 `-c`，才能避免“本地用了 pyproject、流水线用了 pytest.ini”的漂移。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Configuration, https://docs.pytest.org/en/stable/reference/customize.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Good integration practices, https://docs.pytest.org/en/stable/explanation/goodpractices.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link unittest integration, https://docs.pytest.org/en/stable/how-to/unittest.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

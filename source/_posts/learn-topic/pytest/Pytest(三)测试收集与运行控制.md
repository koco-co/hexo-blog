---
title: Pytest(三)测试收集与运行控制
tags:
  - Pytest
  - 测试收集
  - 测试执行
categories:
  - Learn Topic
  - Pytest
description: 能用收集树、Node ID、表达式、标记和缓存精确控制 Pytest 运行范围
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 3
published: false
abbrlink: b5dda780
date: 2026-08-26 09:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决的是“这次命令到底会运行哪些测试”。先让 Pytest 输出收集树，再用路径、Node ID、`-k` 名称表达式和 `-m` 标记表达式缩小范围，最后用 `skip`、`xfail`、`--lf` 和 `--maxfail` 控制结果与节奏。每个选择都要能从收集数量和退出码复核。
{% endnote %}

## 收集模型

{% note info flat %}
Pytest 先收集、后执行。默认会在命令路径下递归查找 `test_*.py` 或 `*_test.py`，再识别 `test_` 开头的函数/方法和 `Test` 开头且没有 `__init__` 的测试类。收集阶段只创建节点，不会调用测试函数或 Fixture。
{% endnote %}

{% mermaid %}
flowchart TD
  A[命令路径] --> B[文件节点]
  B --> C[类节点]
  C --> D[函数或参数节点]
  D --> E[Node ID]
  E --> F[选择后执行]
{% endmermaid %}

```text
lab/tests/test_discount.py::test_apply_discount
lab/tests/test_discount.py::TestDiscount::test_zero_rate
lab/tests/test_discount.py::test_rate[会员-20]
```

| 规则 | 示例 | 排错重点 |
| --- | --- | --- |
| 文件 | `test_discount.py` | 文件名不匹配会在执行前漏收集 |
| 类 | `TestDiscount` | 定义了 `__init__` 的类不会按普通测试类收集 |
| 函数 | `test_zero_rate` | 函数名必须符合当前配置的模式 |
| 参数 | `test_rate[会员-20]` | 参数 ID 是 Node ID 的一部分 |

## 精确选择

{% note success flat %}
先用 `--collect-only -q` 观察实际 Node ID，再复制目标节点运行。这样比凭文件名猜测更安全，尤其是参数化测试会为每组数据生成独立节点。
{% endnote %}

{% tabs 选择器, 1 %}
<!-- tab 路径与节点 -->
```bash
python -m pytest lab/tests/test_discount.py
python -m pytest lab/tests/test_discount.py::test_rate
python -m pytest 'lab/tests/test_discount.py::test_rate[会员-20]'
```

适合复跑一个明确的文件、类、函数或参数实例。
<!-- endtab -->
<!-- tab 名称表达式 -->
```bash
python -m pytest -k 'discount and not slow'
```

`-k` 匹配 Node ID 的名称片段，适合临时筛选；表达式过宽时必须用 `--collect-only` 核对命中集合。
<!-- endtab -->
<!-- tab 标记表达式 -->
```bash
python -m pytest -m 'smoke and not integration'
```

`-m` 只匹配测试上的标记，适合稳定的套件分类；自定义标记应在配置中注册，避免拼写错误悄悄扩大范围。
<!-- endtab -->
{% endtabs %}

{% note warning flat %}
`-k` 和 `-m` 都接受布尔表达式，但语义不同：前者按名称文本匹配，后者按标记集合匹配。一个测试名中含有 `slow` 不代表它真的带有 `slow` 标记；反过来也成立。把筛选命令与收集数量一起记录，才能解释“为什么少跑了几条”。
{% endnote %}

## 结果标记

{% note info flat %}
标记描述测试在当前环境中的预期状态，而不是替代断言。`skip` 表示本次不执行，`skipif` 依条件跳过，`xfail` 表示已知缺陷或暂不支持的行为；意外通过的 `XPASS` 要当作需要复查的信号。
{% endnote %}

```python
import sys

import pytest


@pytest.mark.smoke
def test_public_discount():
    assert 100 * 80 // 100 == 80


@pytest.mark.skip(reason="等待第三方沙箱")
def test_external_sandbox():
    raise AssertionError("not executed")


@pytest.mark.skipif(sys.platform == "win32", reason="示例只覆盖 POSIX 行为")
def test_posix_path():
    assert "/" in "."


@pytest.mark.xfail(reason="已知的舍入缺陷", strict=True)
def test_known_rounding_bug():
    assert 10 * 33 // 100 == 4
```

{% note info flat %}
配置中注册 `smoke`，并按需要设置 `xfail_strict = true`。`strict=True` 或全局严格模式会让意外通过转为失败，避免缺陷修复后测试仍被静默忽略。
{% endnote %}

| 状态 | 测试函数是否执行 | 失败含义 | 适用场景 |
| --- | --- | --- | --- |
| skip | 否或在收集/执行前跳过 | 当前环境不适用 | 平台、依赖或外部服务不可用 |
| xfail | 通常会执行 | 预期缺陷仍存在 | 已知问题有追踪单和退出条件 |
| XPASS | 执行且通过 | 预期缺陷可能已修复 | 需要回收标记或更新断言 |

## 运行节奏

{% timeline 运行控制, cyan %}
<!-- timeline 快速反馈 -->
用 `-x` 或 `--maxfail=1` 尽快停在第一个可定位失败。
<!-- endtimeline -->
<!-- timeline 失败优先 -->
用 `--ff` 先跑缓存中的失败，再补跑剩余集合。
<!-- endtimeline -->
<!-- timeline 定点复现 -->
用 `--lf` 只复跑上一次失败；若缓存失效，先回到 Node ID。
<!-- endtimeline -->
<!-- timeline 完整门禁 -->
移除临时停止参数，运行完整集合并记录最终报告。
<!-- endtimeline -->
{% endtimeline %}

```bash
python -m pytest --maxfail=2
python -m pytest --lf
python -m pytest --ff
python -m pytest -x lab/tests/test_discount.py
```

{% note warning flat %}
`--lf` 和 `--ff` 依赖 `.pytest_cache` 的节点记录。重命名测试、切换分支或更换配置后，缓存可能只代表旧代码；遇到“上次失败找不到”，先运行一次 `--collect-only` 或删除当前项目的缓存，再用明确 Node ID 复现。不要把缓存当作测试结果数据库提交进仓库。
{% endnote %}

## 收集排错

{% note primary flat %}
收集问题先于执行问题。使用 `--collect-only -q` 看实际节点，用 `--ignore`/`--ignore-glob` 缩小遍历范围，用 `--continue-on-collection-errors`（仅在需要查看其他节点时）保留剩余收集结果；导入错误则回到包布局和当前工作目录检查。
{% endnote %}

```bash
python -m pytest --collect-only -q
python -m pytest --ignore=lab/legacy
python -m pytest --ignore-glob='*_old_tests'
python -m pytest --collect-only -q lab/tests/test_discount.py
```

| 症状 | 先看什么 | 常见修复 |
| --- | --- | --- |
| 0 tests collected | 文件、函数和 `testpaths` | 修正命名或显式传入路径 |
| `ImportError` | 回溯中的模块路径与 cwd | 修正包布局，不用修改 `sys.path` 作为临时掩盖 |
| 参数节点少于预期 | `--collect-only` 的参数 ID | 检查空参数集标记和生成逻辑 |
| 标记选择为空 | `pytest --markers` | 注册标记并核对拼写 |

## 常见问题

{% flashcard basic id:pytest-k-vs-m deck:"Pytest" priority:1 tags:"选择器" %}
--- question
`-k` 与 `-m` 分别按什么选择测试？
--- answer
`-k` 按 Node ID 的名称表达式匹配，`-m` 按已注册标记匹配；两者都应结合收集数量核对范围。
--- explanation
名称筛选适合一次性的关键词组合，标记筛选适合长期稳定的套件分类。不要把测试名中的单词当成标记，也不要把标记拼写错误当成“没有测试”；先用 `--collect-only` 和 `--markers` 观察事实。
{% endflashcard %}

{% flashcard basic id:pytest-skip-vs-xfail deck:"Pytest" priority:1 tags:"结果标记" %}
--- question
何时使用 skip，何时使用 xfail？
--- answer
无法或不应在当前环境执行时用 skip；已知会失败但仍需要执行并追踪缺陷时用 xfail，并关注 XPASS。
--- explanation
skip 不提供当前行为证据，适合平台、依赖和外部服务条件；xfail 会运行测试并记录预期失败，最好配合原因和严格模式。缺陷修复后出现 XPASS，应删除或更新标记，而不是长期忽略。
{% endflashcard %}

{% flashcard basic id:pytest-nodeid deck:"Pytest" priority:2 tags:"收集" %}
--- question
Node ID 如何组成，为什么适合精确复跑？
--- answer
它由文件、类、函数和参数 ID 组成，能把一次筛选缩小到单个可收集节点。
--- explanation
先用 `--collect-only` 获取真实 Node ID，再将该字符串传给 Pytest。参数化实例也有自己的方括号 ID，因此可以复跑某一组数据，而不是重新执行整个函数的所有参数。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Running and selecting tests, https://docs.pytest.org/en/stable/how-to/usage.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Marking test functions, https://docs.pytest.org/en/stable/how-to/mark.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link Skipping and xfail, https://docs.pytest.org/en/stable/how-to/skipping.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

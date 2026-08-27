---
title: Python(十二)项目实战
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 用一个可安装、可测试的命令行日志分析器串联模块、类型、文件、异常、并发与性能测量，并形成可解释的交付证据。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 12
published: true
abbrlink: c55cda53
date: 2026-05-13 00:00:00
---

{% course_series %}

{% note info flat %}
项目的目标不是写一个“大而全”的脚本，而是完成一条可验证的交付链：可安装的包、明确的输入格式、可恢复的错误、可测试的核心逻辑，以及对性能和并发是否必要的证据。
{% endnote %}

## 项目目标

{% note primary flat %}
实现 `logscan`：读取 UTF-8 文本日志，解析 `LEVEL message` 行，输出各级别计数和匹配关键字的条目数。项目只处理定义明确的文本格式；损坏行要报告行号，不把猜测的解析结果写进统计。
{% endnote %}

| 输入 | 规则 | 输出 |
| --- | --- | --- |
| `INFO service started` | 级别为大写单词，后面是消息 | `INFO: 1` |
| `ERROR disk full` | 同上 | `ERROR: 1` |
| 空行 | 跳过 | 不计数 |
| `broken` | 不符合格式 | 明确的行号错误 |

## 目录结构

{% note primary flat %}
把可导入代码放入 `src/`，入口、解析、汇总和测试分开。这样命令行只是薄壳，核心函数可以不启动进程就被测试；虚拟环境和安装流程也能暴露导入路径错误。
{% endnote %}

```text
logscan/
├── pyproject.toml
├── src/
│   └── logscan/
│       ├── __init__.py
│       ├── __main__.py
│       ├── parser.py
│       └── service.py
└── tests/
    └── test_service.py
```

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "logscan"
version = "0.1.0"
requires-python = ">=3.13"

[project.scripts]
logscan = "logscan.__main__:main"
```

## 解析管道

{% note primary flat %}
解析函数接受文本行并返回一个不可变事件；读取器只负责逐行和编码，汇总器只负责计数。职责分开后，格式错误可以被定位，统计函数也可直接用内存中的事件测试。
{% endnote %}

```python
# src/logscan/parser.py
from dataclasses import dataclass
import re

LINE = re.compile(r"(?P<level>[A-Z]+)\s+(?P<message>.+)")

@dataclass(frozen=True)
class Event:
    level: str
    message: str

def parse_line(line: str, line_number: int) -> Event | None:
    stripped = line.strip()
    if not stripped:
        return None
    match = LINE.fullmatch(stripped)
    if match is None:
        raise ValueError(f"第 {line_number} 行格式无效")
    return Event(**match.groupdict())
```

{% note warning flat %}
这里使用 `fullmatch` 是因为日志格式需要整行符合规则；若把 `search` 换进来，`noise ERROR disk full` 会被悄悄当成合法事件。解析器的严格性应由产品格式决定，而不是由正则写起来是否省事决定。
{% endnote %}

## 资源与错误

{% note primary flat %}
文件读取用 `Path`、明确编码和 `with`。最靠近文件的层保留 `OSError` 原因，命令行边界再把它转换为可读的失败信息和非零退出码；不要在底层 `print` 后继续返回伪成功统计。
{% endnote %}

```python
# src/logscan/service.py
from collections import Counter
from pathlib import Path
from .parser import Event, parse_line

def read_events(path: Path) -> list[Event]:
    events: list[Event] = []
    with path.open(encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            event = parse_line(line, line_number)
            if event is not None:
                events.append(event)
    return events

def summarize(events: list[Event]) -> Counter[str]:
    return Counter(event.level for event in events)
```

{% folding 大文件的替代方案, open %}
若日志很大，`read_events()` 不应先积累列表：把返回类型改为 `Iterator[Event]`，让 `summarize()` 消费生成器。代价是输入只能消费一次，错误可能在消费时才出现；是否切换必须由输入规模和内存测量决定，而不是预先“优化”。
{% endfolding %}

## 类型与测试

{% note primary flat %}
类型注解记录 `Event`、路径和聚合器的接口；测试验证输入输出。测试在临时目录创建文件，避免依赖开发机的真实日志或当前工作目录；每个失败用例都应检查异常类型和可诊断消息。
{% endnote %}

```python
# tests/test_service.py
import tempfile
import unittest
from pathlib import Path

from logscan.service import read_events, summarize

class ServiceTests(unittest.TestCase):
    def test_summarizes_levels(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "app.log"
            path.write_text("INFO started\nERROR disk full\nINFO ready\n", encoding="utf-8")
            self.assertEqual(summarize(read_events(path)), {"INFO": 2, "ERROR": 1})

    def test_reports_bad_line(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "app.log"
            path.write_text("broken\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "第 1 行"):
                read_events(path)
```

## 命令行入口

{% note primary flat %}
入口层只负责参数、返回码和呈现。核心函数不读 `sys.argv`、不直接退出，因此可以在测试、批任务或其他程序中复用；`argparse` 为缺少参数和 `--help` 提供标准行为。
{% endnote %}

```python
# src/logscan/__main__.py
import argparse
from pathlib import Path
from .service import read_events, summarize

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    args = parser.parse_args()
    try:
        for level, count in sorted(summarize(read_events(args.path)).items()):
            print(f"{level}: {count}")
    except (OSError, ValueError) as error:
        parser.error(str(error))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

{% note warning flat %}
`parser.error()` 会以非零状态退出，这适合无效命令行输入；库函数不应调用它或 `sys.exit()`。错误边界要和所有权一致：谁拥有进程界面，谁决定退出码；谁提供可复用逻辑，谁返回值或抛领域异常。
{% endnote %}

## 并发与测量

{% note primary flat %}
单个本地文本文件通常不需要并发。只有需要扫描大量相互独立的文件，且测量显示读取或解析是瓶颈时，才将“每个文件的独立统计”提交给线程池或进程池；聚合时仍让单一所有者合并 Counter，避免共享可变状态。
{% endnote %}

```python
import timeit

seconds = timeit.timeit(
    "sum(1 for _ in range(100_000))",
    number=100,
)
print(seconds)
```

{% note warning flat %}
不要根据微基准就把项目改成并发。必须记录文件数量、大小、存储介质、CPU、解释器版本和错误策略；并发读写可能更慢，还会让错误排序、日志和取消语义复杂化。
{% endnote %}

## 复盘清单

{% note success flat %}
提交前逐项检查：包能否在干净虚拟环境安装、入口能否显示帮助、正常/错误日志能否得到预期结果、测试是否隔离、错误是否保留原因、性能结论是否有测量。缺少任何一项时，先补证据，不把“本地跑过一次”当成交付。
{% endnote %}

- [ ] `python -m pip install -e .` 后 `python -m logscan --help` 可用。
- [ ] UTF-8 正常日志输出稳定、排序明确的统计结果。
- [ ] 缺失文件、错误编码和坏行都有可诊断失败。
- [ ] `python -m unittest` 在空白临时目录也能通过。
- [ ] 大文件策略在真实输入规模下有内存/耗时证据。

## 常见问题

{% flashcard_ref id="python-env-import" %}
{% flashcard_ref id="python-object-is-eq" %}
{% flashcard_ref id="python-container-copy" %}
{% flashcard_ref id="python-function-default-mutable" %}
{% flashcard_ref id="python-iteration-yield-return" %}
{% flashcard_ref id="python-oop-mro-super" %}
{% flashcard_ref id="python-error-context" %}
{% flashcard_ref id="python-quality-typing-runtime" %}
{% flashcard_ref id="python-runtime-gil" %}
{% flashcard_ref id="python-runtime-thread-process-async" %}

## 参考资料

{% linkgroup %}
{% link Python argparse, https://docs.python.org/3.14/library/argparse.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python pathlib, https://docs.python.org/3.14/library/pathlib.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python unittest, https://docs.python.org/3.14/library/unittest.html, https://docs.python.org/3.14/_static/py.svg %}
{% link PyPA 打包项目, https://packaging.python.org/en/latest/tutorials/packaging-projects/, https://packaging.python.org/favicon.ico %}
{% endlinkgroup %}

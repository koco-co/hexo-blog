---
title: Python(八)异常、上下文与文件
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 设计异常传播和确定性资源管理，安全处理文件、路径、编码与正则表达式，并验证上下文清理边界。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 8
published: true
abbrlink: c31bf4bb
date: 2026-05-09 00:00:00
---

{% course_series %}

{% note info flat %}
可靠程序不会假装失败不存在：它区分可恢复的输入错误、不可恢复的基础设施错误和应立即传播的中断，并在所有路径上关闭文件、锁和连接。异常和上下文管理不是补丁语法，而是资源所有权的接口。
{% endnote %}

## 错误与异常

{% note primary flat %}
异常对象携带类型、消息和调用栈。`Exception` 是大多数应用错误的基类；`BaseException` 还包括 `KeyboardInterrupt`、`SystemExit` 等控制流信号，业务代码通常不应吞掉它们。优先捕获能真正处理的最具体异常。
{% endnote %}

| 情况 | 典型异常 | 合理动作 |
| --- | --- | --- |
| 用户提供的格式或值无效 | `ValueError`、自定义领域异常 | 给出可修正的反馈 |
| 键、属性或文件不存在 | `KeyError`、`AttributeError`、`FileNotFoundError` | 补默认值、改路径或显式失败 |
| 外部 I/O 暂时失败 | `OSError` 及其子类 | 限次重试、记录上下文、失败返回 |
| 程序不变量被破坏 | `AssertionError` 或明确异常 | 修正调用方或实现，不要静默继续 |

{% note warning flat %}
`except:` 会连中断和退出信号一起捕获，几乎总是错误。`except Exception:` 也只适合最外层请求边界、批任务边界等确实能记录并转换所有应用异常的位置；必须保留异常信息并让失败状态可观察。
{% endnote %}

## 异常控制

{% note primary flat %}
`try` 放置可能失败的最小代码块；`except` 处理预期异常；`else` 只在没有异常时执行；`finally` 无论成功、失败或提前返回都会执行，适合最后的清理。不要把成功路径塞进 `try`，否则会错误地把自己的 bug 当作输入错误处理。
{% endnote %}

```python
def parse_port(raw: str) -> int:
    try:
        port = int(raw)
    except ValueError as error:
        raise ValueError("port 必须是整数") from error
    else:
        if not 1 <= port <= 65535:
            raise ValueError("port 超出范围")
        return port
    finally:
        # 这里只适合无条件清理；不要在 finally 覆盖原异常或 return
        pass
```

### 异常链

{% note primary flat %}
`raise DomainError(...) from error` 建立显式因果链，保留底层故障同时对调用方提供领域语义。`raise ... from None` 只在底层细节确实无关或不安全时抑制上下文；排障时链通常比一条漂亮但孤立的消息更有价值。
{% endnote %}

```python
class ConfigError(Exception):
    pass

try:
    int("not-a-port")
except ValueError as error:
    raise ConfigError("配置中的 port 无效") from error
```

### 异常组

{% note primary flat %}
并发任务可能同时失败。`ExceptionGroup` 把多个异常保留为一组；`except*` 会从组中分离匹配类型并分别处理，未匹配部分继续传播。它不是普通 `except` 的替代，而是多失败场景的精确工具。
{% endnote %}

```python
try:
    raise ExceptionGroup("batch failed", [ValueError("bad input"), OSError("disk")])
except* ValueError as errors:
    print("input errors:", len(errors.exceptions))
except* OSError as errors:
    print("io errors:", len(errors.exceptions))
```

## 上下文管理

{% note primary flat %}
`with resource as value:` 进入时调用上下文管理器的进入协议，离开时无论是否异常都调用退出协议。它是确定性释放资源的默认方式；文件、锁、事务、临时目录和计时器都可以遵守这个结构。
{% endnote %}

```python
from contextlib import contextmanager

@contextmanager
def labelled_operation(name: str):
    print("start", name)
    try:
        yield
    finally:
        print("finish", name)

with labelled_operation("import"):
    print("work")
```

{% note warning flat %}
上下文管理器的退出方法若返回真值会抑制异常。只有当异常已被完整处理且调用方不应再看到失败时才这样做；资源清理失败也应避免遮蔽原始业务异常。
{% endnote %}

{% note info flat %}
`atexit` 只在解释器正常退出时执行已登记的回调，不能替代每个文件、锁或事务的 `with` 清理；异常终止、进程被杀或解释器关闭顺序都可能让它不适合作为关键资源释放机制。
{% endnote %}

## 文件与路径

{% note primary flat %}
用 `pathlib.Path` 表达路径，用 `with path.open(...)` 读写文件。文本模式必须明确编码；二进制模式读写 `bytes`。路径拼接用 `/` 运算符或 `joinpath()`，不要手工拼接 Windows 或 POSIX 分隔符。
{% endnote %}

```python
from pathlib import Path

path = Path("reports") / "summary.txt"
path.parent.mkdir(parents=True, exist_ok=True)

with path.open("w", encoding="utf-8", newline="\n") as file:
    file.write("Python\n")

with path.open("r", encoding="utf-8") as file:
    print(file.read())
```

{% tabs python-text-binary, 1 %}
<!-- tab 文本与编码 -->

```python
text = "你好"
payload = text.encode("utf-8")
print(payload.decode("utf-8"))

# 数据损坏时，先调查真实编码；只有业务允许时才使用 errors="replace"。
```

<!-- endtab -->
<!-- tab 临时资源 -->

```python
from tempfile import TemporaryDirectory
from pathlib import Path

with TemporaryDirectory() as directory:
    temp_path = Path(directory) / "sample.txt"
    temp_path.write_text("draft", encoding="utf-8")
    print(temp_path.read_text(encoding="utf-8"))
# 离开 with 后目录已清理
```

<!-- endtab -->
{% endtabs %}

## 正则表达式

{% note primary flat %}
正则适合结构化的局部文本规则，不适合替代完整语法解析。使用原始字符串书写模式；`fullmatch` 验证整个输入，`search` 寻找任意位置，`finditer` 按需遍历匹配。模式重复使用时编译一次以表达意图。
{% endnote %}

```python
import re

ticket = re.compile(r"[A-Z]{2}-\d{4}")
print(bool(ticket.fullmatch("PY-2026")))
print(bool(ticket.fullmatch("see PY-2026")))  # False
```

{% note warning flat %}
来自不可信输入、结构很深的文本或复杂嵌套语法不应交给随意的回溯型模式。限制输入长度、使用特定解析器，并为可能的性能问题设置边界；“能匹配”不等于“能安全验证”。
{% endnote %}

## 资源实验

{% note info flat %}
该实验模拟读配置、转换异常和写临时报告。先故意把端口改为非数字，确认能同时看到领域错误及其原因；再检查临时目录退出后是否已清理。
{% endnote %}

```python
from pathlib import Path
from tempfile import TemporaryDirectory

class ConfigError(Exception):
    pass

def read_port(raw: str) -> int:
    try:
        return int(raw)
    except ValueError as error:
        raise ConfigError("port 必须为整数") from error

with TemporaryDirectory() as directory:
    report = Path(directory) / "result.txt"
    report.write_text(str(read_port("8080")), encoding="utf-8")
    print(report.read_text(encoding="utf-8"))
```

## 结果验证

{% note success flat %}
完成本篇后，应能根据谁拥有资源决定 `with` 的位置，根据谁能恢复决定捕获位置，并让错误链和日志保留足够上下文。异常处理的成功标准不是“不报错”，而是失败可诊断、资源不泄漏、状态不被伪造。
{% endnote %}

- [ ] 能为输入错误选择具体异常，而非裸 `except`。
- [ ] 能解释 `else` 与 `finally` 的不同执行时机。
- [ ] 能用 `raise ... from error` 保留因果链。
- [ ] 能用 `Path` 和 `with` 完成 UTF-8 文本读写。
- [ ] 能区分 `fullmatch` 与 `search` 的验证语义。

## 常见问题

{% flashcard basic id:python-error-else-finally deck:"Python 基础" priority:1 tags:"Python,异常,try,else,finally" %}
--- question
`try`、`except`、`else`、`finally` 的职责分别是什么？
--- answer
try 放可能失败的最小代码，except 处理预期错误，else 在无异常时运行，finally 总会运行以完成清理。
--- explanation
四个子句分别承担不同边界：`try` 只包住可能失败的最小操作，`except` 转换已知错误，`else` 放成功后的逻辑，`finally` 负责无论成败都要做的清理。

```python
try:
    value = parse(raw)
except ValueError as error:
    record_invalid(raw, error)
else:
    save(value)       # 这里的异常不会被上面的 except 误捕
finally:
    release_buffer()  # 成功、失败、return 都会执行
```

把成功路径放进 `else` 能避免把 `save()` 自己的异常误判为输入解析失败。`finally` 不应随意 `return` 或抛出新错误遮盖原异常；文件、锁和事务通常优先交给 `with` 管理。
{% endflashcard %}

{% flashcard basic id:python-error-chain deck:"Python 基础" priority:2 tags:"Python,异常链,raise from" %}
--- question
为什么使用 `raise NewError(...) from error`？
--- answer
它保留底层异常作为原因，同时向调用方提供更贴近领域的异常类型和消息。
--- explanation
`raise ... from ...` 同时保留底层原因和面向调用者的领域异常：

```python
try:
    port = int(raw_port)
except ValueError as error:
    raise ConfigError("port 必须是整数") from error
```

日志会显示 `ConfigError` 的业务语义，也能沿异常链追到原始 `ValueError`。只有底层细节无关或不应公开时才使用 `from None`；不要为了“看起来简洁”丢掉排障所需的 cause。
{% endflashcard %}

{% flashcard basic id:python-error-context deck:"Python 基础" priority:1 tags:"Python,with,上下文管理,资源" %}
--- question
`with` 解决什么问题？
--- answer
它保证进入后的退出清理在成功、异常和提前返回时都执行。
--- explanation
`with` 把资源所有权绑定到一个可观察的代码块，离开代码块时调用退出协议：

```python
from pathlib import Path

with Path("input.txt").open(encoding="utf-8") as file:
    content = file.read()
# 离开 with 后文件已关闭，即使 read 或后续处理抛错也会执行清理。
```

文件、锁、事务和临时目录都应由明确的所有者管理。上下文管理器只有在确实处理了异常时才应抑制它；否则应让异常继续传播，避免调用者误以为资源操作成功。
{% endflashcard %}

{% flashcard basic id:python-error-text-binary deck:"Python 基础" priority:2 tags:"Python,文件,编码,bytes,str" %}
--- question
文本和二进制文件处理的关键边界是什么？
--- answer
文本使用 `str` 和明确编码，二进制使用 `bytes`；读取时 decode，写出时 encode。
--- explanation
文本接口读写 `str`，二进制接口读写 `bytes`，编码转换必须发生在边界处：

```python
from pathlib import Path

path = Path("message.txt")
path.write_text("你好\n", encoding="utf-8")
text = path.read_text(encoding="utf-8")
raw = path.read_bytes()
print(text, raw)  # str 与 bytes 是两种不同对象
```

`Path` 负责路径组合，`with` 或 `Path` 方法负责关闭文件；遇到 `UnicodeDecodeError` 时先核对真实编码和数据来源，不要默认用 replacement 丢失原始信息。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python 3.14 异常, https://docs.python.org/3.14/library/exceptions.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 contextlib, https://docs.python.org/3.14/library/contextlib.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 pathlib, https://docs.python.org/3.14/library/pathlib.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 re, https://docs.python.org/3.14/library/re.html, https://docs.python.org/3.14/_static/py.svg %}
{% endlinkgroup %}

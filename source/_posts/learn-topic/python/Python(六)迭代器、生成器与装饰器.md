---
title: Python(六)迭代器、生成器与装饰器
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 从迭代协议到生成器、惰性管道与装饰器建立流式处理能力，并验证短路消费、关闭和异常传播。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 6
published: true
abbrlink: be636c04
date: 2026-05-07 00:00:00
---

{% course_series %}

{% note info flat %}
迭代把“如何产生下一个值”与“如何消费值”分开。生成器把这种协议写得很短，装饰器把函数包装成可复用能力。二者的共同风险是惰性：代码不一定在定义时执行，而可能在消费或调用时才发生。
{% endnote %}

## 迭代协议

{% note primary flat %}
可迭代对象能交给 `iter()` 取得迭代器；迭代器能交给 `next()` 逐个产生值，耗尽时抛 `StopIteration`。列表是可重复迭代的可迭代对象；同一个列表迭代器被耗尽后不能自动回到开头。
{% endnote %}

```python
items = ["draft", "review"]
iterator = iter(items)
print(next(iterator))  # draft
print(next(iterator))  # review
# next(iterator)       # StopIteration

for item in items:     # for 在内部调用 iter/next 并处理 StopIteration
    print(item)
```

{% note warning flat %}
不要把“可以 `for`”和“可以重复消费”混为一谈。文件对象、生成器、`map`、`filter` 等通常是一次性迭代器；如果后续仍需数据，要么重建来源，要么明确物化为列表并接受内存成本。
{% endnote %}

| 工具 | 作用 | 惰性边界 |
| --- | --- | --- |
| `enumerate()` | 产生索引和值 | 消费原可迭代对象 |
| `zip()` | 并行组合，最短输入结束 | 结果是迭代器 |
| `iter(callable, sentinel)` | 反复调用直到哨兵 | 适合按块读取 |
| `itertools` | 组合、切片、分组 | 先理解输入是否会被耗尽 |

## 生成器

{% note primary flat %}
含 `yield` 的函数在调用时返回生成器对象，真正执行在每次 `next()` 或循环消费时推进。`yield` 暂停并产出值；函数 `return value` 会结束生成器，`value` 可作为 `StopIteration.value` 被手动驱动者接收，但普通 `for` 不会显示它。
{% endnote %}

```python
def chunks(text: str, size: int):
    for start in range(0, len(text), size):
        yield text[start:start + size]

print(list(chunks("abcdef", 2)))  # ['ab', 'cd', 'ef']
```

{% tabs python-generator-control, 1 %}
<!-- tab 委托 -->

```python
def lines():
    yield "header"
    yield from ["body", "footer"]

print(list(lines()))
```

<!-- endtab -->
<!-- tab 清理 -->

```python
def resource_events():
    try:
        yield "opened"
        yield "working"
    finally:
        print("cleanup")

events = resource_events()
print(next(events))
events.close()  # 触发 finally
```

<!-- endtab -->
{% endtabs %}

{% note warning flat %}
生成器里的异常在推进它时抛出，不在创建时抛出。不要吞掉 `GeneratorExit` 或在 `finally` 中继续 yield；需要可靠资源管理时优先使用 `with` 或清晰的 `try/finally`。
{% endnote %}

## 惰性管道

{% note primary flat %}
生成器表达式、`map`、`filter` 和 `itertools` 可以组成按需处理管道。它们适合大输入和早停，但一次调试时把它们打印成列表，可能会消耗数据；日志和测试应明确是观察、复制还是消费。
{% endnote %}

```python
def parse(lines):
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#"):
            yield line

source = ["# comment\n", " draft \n", "\n", "review\n"]
first = next(parse(source))
print(first)  # draft：后续数据尚未处理
```

{% folding 何时不要惰性, open %}
需要重复遍历、随机访问、稳定快照或完整聚合时，尽早物化为列表、元组或专门的存储结构更清楚。惰性不是性能奖章；它只是把计算时机推后，也让错误、资源占用和数据耗尽发生得更晚。
{% endfolding %}

## 装饰器

{% note primary flat %}
装饰器接收可调用对象并返回可调用对象。`@decorator` 是定义后立即执行的语法糖；包装器在被调用时执行。用 `functools.wraps` 保留原函数的名称、文档和可检查签名信息。
{% endnote %}

```python
from functools import wraps

def traced(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"call {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@traced
def add(left: int, right: int) -> int:
    return left + right

print(add(20, 22))
```

{% note warning flat %}
多个装饰器由下向上应用：`@outer`、`@inner` 等价于 `func = outer(inner(func))`。如果装饰器改变参数、返回值、异常或异步属性，必须在接口中明确；不要为了日志而悄悄吞异常或丢失返回值。
{% endnote %}

## 流式实验

{% note info flat %}
这个小管道先清洗输入，再在消费第一个匹配项时停止。运行前预测 `parse` 会处理多少原始行；这比背“生成器省内存”更能验证惰性。
{% endnote %}

```python
def parse(lines):
    for line in lines:
        print("read:", line.rstrip())
        clean = line.strip()
        if clean:
            yield clean

first_review = next(item for item in parse(["\n", "draft\n", "review\n"]) if item == "review")
print(first_review)
```

## 结果验证

{% note success flat %}
完成本篇后，应能说明数据何时被消费、迭代器是否还能再用、异常何时出现，以及装饰后的函数是否仍保持原接口信息。对流式系统而言，这些问题比“是否写了 yield”更重要。
{% endnote %}

- [ ] 能区分 iterable、iterator 与 generator。
- [ ] 能解释 `yield` 暂停与 `return` 结束生成器的差异。
- [ ] 能说明为什么 `list(generator)` 会耗尽生成器。
- [ ] 能用 `wraps` 保存被装饰函数的元数据。
- [ ] 能从装饰器堆叠顺序推导调用包装顺序。

## 常见问题

{% flashcard basic id:python-iteration-iterable-iterator deck:"Python 基础" priority:1 tags:"Python,迭代器,iter,next" %}
--- question
可迭代对象、迭代器和生成器分别是什么？
--- answer
可迭代对象能被 `iter()` 取出迭代器；迭代器用 `next()` 逐项产出；生成器是实现迭代器协议的一种简洁方式。
--- explanation
“能被 `for` 遍历”与“自己保存遍历进度”是两个层次：

```python
items = ["a", "b"]
first = iter(items)
second = iter(items)
print(next(first), next(first))  # a b
print(next(second))              # a：另一条独立游标

stream = (value * 2 for value in items)
print(list(stream))              # ['aa', 'bb']
print(list(stream))              # []：生成器已耗尽
```

列表是可重复迭代的可迭代对象；迭代器和生成器保存当前位置，通常只能向前消费一次。`for` 会在内部调用 `iter()`/`next()`，并把 `StopIteration` 转换为正常结束。
{% endflashcard %}

{% flashcard basic id:python-iteration-yield-return deck:"Python 基础" priority:1 tags:"Python,生成器,yield,return" %}
--- question
生成器中 `yield` 与 `return` 的差别是什么？
--- answer
`yield` 产出一个值并暂停，`return` 结束生成器；带值的 return 成为 StopIteration 的 value。
--- explanation
`yield` 把一次执行切成多个阶段，`return` 则结束生成器并把值放进 `StopIteration.value`：

```python
def numbers():
    yield 1
    return "done"

iterator = numbers()   # 此时函数体还没有执行
print(next(iterator))  # 1
try:
    next(iterator)
except StopIteration as error:
    print(error.value) # done
```

普通 `for` 只消费 `yield` 的值，不展示 return 值；主体只有在 `next()`、`for` 或其他消费动作发生时才推进。因此错误和资源占用也可能延迟到消费阶段。
{% endflashcard %}

{% flashcard basic id:python-iteration-decorator-order deck:"Python 基础" priority:1 tags:"Python,装饰器,wraps,调用顺序" %}
--- question
两个装饰器 `@outer` 和 `@inner` 的应用顺序是什么？
--- answer
等价于 `func = outer(inner(func))`，inner 先包住原函数，outer 再包住结果。
--- explanation
装饰器在定义阶段从下往上应用，调用时却从外往内执行：

```python
@outer
@inner
def work():
    return "ok"

# 等价于 work = outer(inner(work))
```

因此 `inner` 先包住原函数，`outer` 再包住 inner 的结果。包装器应使用 `functools.wraps` 保留元数据，并明确透传参数、返回值和异常；若包裹 async 函数，还要保持 `async def`/`await` 的调用模型。
{% endflashcard %}

{% flashcard basic id:python-iteration-lazy deck:"Python 基础" priority:2 tags:"Python,惰性,生成器,管道" %}
--- question
惰性迭代的收益和风险是什么？
--- answer
它按需计算，能节省不必要的工作和内存；风险是数据会被一次性耗尽，错误和资源问题也会延后出现。
--- explanation
惰性管道只在消费时计算，输入大或后续可能提前停止时能节省工作和内存；代价是它有状态且错误会延后：

```python
stream = (value * 2 for value in range(3))
first = next(stream)
rest = list(stream)
print(first, rest)  # 0 [2, 4]
```

如果需要重复遍历、快照或随机访问，应明确物化为列表或重新创建来源。调试时调用 `list(stream)` 会消耗迭代器，之后的生产代码可能只得到空结果；资源型迭代器还必须在消费或关闭边界设计清理。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python 3.14 数据模型：迭代器, https://docs.python.org/3.14/reference/datamodel.html#object.__iter__, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 itertools, https://docs.python.org/3.14/library/itertools.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 functools, https://docs.python.org/3.14/library/functools.html, https://docs.python.org/3.14/_static/py.svg %}
{% endlinkgroup %}

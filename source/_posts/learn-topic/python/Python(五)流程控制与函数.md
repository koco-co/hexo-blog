---
title: Python(五)流程控制与函数
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 用条件、循环、参数模型、作用域、闭包和高阶函数组织可测试的 Python 逻辑，并识别默认参数与延迟绑定陷阱。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 5
published: true
abbrlink: a62147da
date: 2026-05-06 00:00:00
---

{% course_series %}

{% note info flat %}
控制流负责选择和重复，函数负责给一段行为命名并约束输入输出。把判断、遍历和副作用拆开，代码才容易测试；把参数、作用域和返回值说清，面试题也会从背语法变成解释行为。
{% endnote %}

## 条件与循环

{% note primary flat %}
`if` 依据真值测试分支；空容器、零、`None` 和 `False` 为假，其余对象默认为真但可以自定义。`for` 从可迭代对象依次取值，`while` 适合以状态条件终止；二者都可配合 `break`、`continue` 与 `else`。
{% endnote %}

```python
for candidate in ["", "draft", "publish"]:
    if not candidate:
        continue
    if candidate == "publish":
        break
else:
    print("没有遇到 publish")

print(candidate)  # publish
```

{% note warning flat %}
循环的 `else` 不是“循环结束后总执行”：只有循环没有被 `break` 中断时才执行。不要用 `for ... else` 隐藏复杂状态机；当退出原因很多时，提取明确的函数或状态变量更易读。
{% endnote %}

| 目标 | 首选写法 | 说明 |
| --- | --- | --- |
| 过滤或转换一组数据 | 推导式 / 生成器表达式 | 单个、清晰表达式时简洁 |
| 需要早停、日志、异常处理 | 普通 `for` | 控制路径直观 |
| 有明确终止条件的重试 | `while` | 必须保证状态会前进 |
| 同时得到位置和值 | `enumerate()` | 避免手动维护计数器 |

## 函数与参数

{% note primary flat %}
函数定义创建函数对象；调用时，实参按规则绑定到形参。位置参数在前，关键字参数按名绑定；`/` 左侧仅限位置，`*` 右侧仅限关键字，`*args` 收集额外位置参数，`**kwargs` 收集额外关键字参数。
{% endnote %}

```python
def announce(title: str, /, *labels: str, urgent: bool = False, **meta: str) -> str:
    prefix = "[urgent] " if urgent else ""
    return f"{prefix}{title} labels={labels} meta={meta}"

print(announce("release", "python", urgent=True, owner="team"))
```

{% note warning flat %}
默认值在定义函数时计算一次，而不是每次调用时重新计算。不可变默认值通常安全；可变默认值应改为 `None` 哨兵后在函数内创建。类型标注描述接口，但不会自动验证调用者传入的值。
{% endnote %}

```python
def add_label(label: str, labels: list[str] | None = None) -> list[str]:
    if labels is None:
        labels = []
    labels.append(label)
    return labels
```

## 作用域与闭包

{% note primary flat %}
名称解析遵循 LEGB：Local、Enclosing、Global、Builtins。读取外层名称可以直接发生；要在内层函数重新绑定外层局部名称需 `nonlocal`，重新绑定模块级名称需 `global`。两者都应少用，优先返回新值或封装状态。
{% endnote %}

```python
def make_counter(start: int = 0):
    value = start

    def next_value() -> int:
        nonlocal value
        value += 1
        return value

    return next_value

counter = make_counter()
print(counter(), counter())  # 1 2
```

{% note warning flat %}
闭包捕获的是名称，不是循环时的即时值。因此在循环中创建函数后再调用，常会看到所有函数都读取最后一个值。用默认参数或工厂函数在创建时绑定当前值，而不是依赖后续查找。
{% endnote %}

```python
callbacks = [lambda item=item: item for item in range(3)]
print([callback() for callback in callbacks])  # [0, 1, 2]
```

## 高阶函数

{% note primary flat %}
函数是对象：能赋值、传参、返回，也能拥有属性。`map`、`filter`、`sorted(key=...)` 和回调都在使用这一点；若匿名函数变长或需要测试，给它起一个正常函数名通常更清楚。
{% endnote %}

```python
def normalize(title: str) -> str:
    return title.strip().casefold()

titles = [" Python ", "python", "FastAPI"]
unique = {normalize(title) for title in titles}
print(sorted(unique))
```

{% folding 递归的边界, open %}
递归必须有基例，并且每一步朝基例推进。Python 没有把尾递归优化为无限栈；层数可能很深的遍历优先改为显式栈、迭代器或队列。只有递归能让问题结构明显更简单时才保留它。
{% endfolding %}

## 函数实验

{% note info flat %}
运行前预测：两次 `add_label()` 是否共享列表？三个回调会返回哪些数？若答案不对，分别定位默认值的求值时间和闭包的名称查找时间。
{% endnote %}

```python
def add_label(label: str, labels: list[str] | None = None) -> list[str]:
    if labels is None:
        labels = []
    labels.append(label)
    return labels

handlers = [lambda n=n: n * 10 for n in range(3)]

print(add_label("draft"))
print(add_label("review"))
print([handler() for handler in handlers])
```

## 结果验证

{% note success flat %}
完成本篇后，应能从签名读出调用约束，从输出读出名称解析顺序，并能用最小函数隔离副作用。任何需要共享或修改状态的设计，都应明确它属于对象、闭包还是模块，而不是偶然泄漏出来的变量。
{% endnote %}

- [ ] 能解释循环 `else` 何时执行。
- [ ] 能为一个函数区分实参与形参、位置与关键字传参。
- [ ] 能改正可变默认参数。
- [ ] 能解释 `nonlocal` 的作用及何时避免它。
- [ ] 能修复循环中 lambda 的延迟绑定。

## 常见问题

{% flashcard basic id:python-function-args-params deck:"Python 基础" priority:1 tags:"Python,函数,参数,调用" %}
--- question
实参和形参有什么区别？`/` 与 `*` 在函数签名中做什么？
--- answer
实参是调用时给出的对象，形参是函数内的名称；`/` 前仅限位置，`*` 后仅限关键字。
--- explanation
调用先按签名绑定实参，`/` 和 `*` 再限制调用者使用哪种写法：

```python
def announce(title, /, *labels, urgent=False, **meta):
    return title, labels, urgent, meta

announce("release", "python", urgent=True)  # 合法
announce(title="release")                  # TypeError：title 在 / 左侧
```

位置专用参数适合不希望暴露参数名的低层接口；关键字专用参数能让 `urgent=True` 这类语义更清楚。形参是函数内部的名称，实参是调用表达式提供的对象，两者不要混成同一个概念。
{% endflashcard %}

{% flashcard basic id:python-function-default-mutable deck:"Python 基础" priority:1 tags:"Python,函数,默认参数,可变性" %}
--- question
为什么不应把 `[]` 或 `{}` 直接作为函数默认参数？
--- answer
默认值在函数定义时只创建一次，多次调用会共享同一个可变对象。
--- explanation
默认表达式在函数定义时求值一次，因此可变对象会成为所有省略该参数的调用共享的状态：

```python
def bad(label, labels=[]):
    labels.append(label)
    return labels

print(bad("a"))  # ['a']
print(bad("b"))  # ['a', 'b']：同一个默认列表
```

用 `None` 作为哨兵，把创建动作放进函数体：

```python
def good(label, labels=None):
    if labels is None:
        labels = []
    labels.append(label)
    return labels
```

这样每次省略参数都会得到独立列表；调用方显式传入列表时，仍然可以有意识地共享它。
{% endflashcard %}

{% flashcard basic id:python-function-legb deck:"Python 基础" priority:1 tags:"Python,LEGB,作用域,闭包" %}
--- question
Python 名称查找的 LEGB 顺序是什么？
--- answer
Local、Enclosing、Global、Builtins。
--- explanation
LEGB 是一次名称查找的顺序：当前函数的 Local、外层函数的 Enclosing、模块的 Global，最后是 Builtins。读取和重新绑定是两件事：

```python
count = 10

def make_counter():
    value = 0
    def next_value():
        nonlocal value       # 重新绑定 Enclosing
        value += 1
        return value
    return next_value
```

闭包读取外层名称不需要声明；只有要重新绑定它才用 `nonlocal`，改模块级名称才用 `global`。如果状态能通过参数和返回值传递，通常比隐藏在全局或闭包里更易测试。
{% endflashcard %}

{% flashcard basic id:python-function-late-binding deck:"Python 基础" priority:1 tags:"Python,闭包,lambda,循环" %}
--- question
为什么循环中创建的多个 lambda 常返回同一个最后值？如何修复？
--- answer
闭包在调用时查找循环名称，循环结束后它已是最后值；用默认参数或工厂函数绑定当前值。
--- explanation
闭包捕获的是名称，函数真正调用时才通过该名称取值；循环结束后，所有 lambda 看到的自然是最后一次绑定：

```python
callbacks = []
for item in range(3):
    callbacks.append(lambda: item)
print([callback() for callback in callbacks])  # [2, 2, 2]
```

默认参数会在函数创建时求值，因此能保存当前对象：

```python
callbacks = [lambda item=item: item for item in range(3)]
print([callback() for callback in callbacks])  # [0, 1, 2]
```

这不是特殊的 lambda 规则，而是把“调用时查找外层名称”改成“创建时完成默认参数绑定”；需要更复杂状态时使用工厂函数会更清楚。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python 3.14 复合语句, https://docs.python.org/3.14/reference/compound_stmts.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 简单语句, https://docs.python.org/3.14/reference/simple_stmts.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 表达式, https://docs.python.org/3.14/reference/expressions.html, https://docs.python.org/3.14/_static/py.svg %}
{% endlinkgroup %}

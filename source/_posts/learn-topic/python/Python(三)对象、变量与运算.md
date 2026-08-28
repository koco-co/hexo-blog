---
title: Python(三)对象、变量与运算
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 用名称绑定、身份、相等性和可变性建立 Python 对象模型，并掌握数字、字符串与字节的常见边界。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 3
published: true
abbrlink: 76bec403
date: 2026-05-04 00:00:00
---

{% course_series %}

{% note info flat %}
Python 变量不是装值的盒子，而是把<strong>名称</strong>绑定到<strong>对象</strong>。一旦先用这句话解释程序，再讨论赋值、参数、可变性和 `is`，多数“Python 到底按值还是按引用传递”的争论都会消失。
{% endnote %}

## 名称与对象

{% note primary flat %}
对象有类型、值与身份；赋值语句只会让左侧名称指向右侧对象。`del name` 解除名称绑定，不等于立刻销毁对象；对象是否能回收取决于是否还存在可达引用。
{% endnote %}

```python
score = 42
alias = score
score = 99

print(alias, score)  # 42 99：score 被重新绑定，alias 没有变化

items = ["Python"]
other = items
other.append("面试")
print(items)  # ['Python', '面试']：两个名称仍指向同一个列表
```

{% note warning flat %}
函数调用也遵循名称绑定：形参在函数局部名称空间中绑定到传入对象。它既不是 C++ 意义的“传引用”，也不是对一切对象都复制的“传值”；函数是否影响调用方，取决于它修改了共享的可变对象，还是仅让形参重新绑定。
{% endnote %}

| 写法 | 发生的事 | 用来回答的问题 |
| --- | --- | --- |
| `name = value` | 名称绑定到对象 | 赋值会不会复制？通常不会 |
| `name = other` | 新名称绑定到同一对象 | 两处为何同步变化？ |
| `name = name + x` | 计算新对象后重新绑定 | 原对象会不会被改？取决于类型和运算 |
| `del name` | 删除当前名称绑定 | 对象是否还有别的引用？ |

![Python 名称绑定、列表对象与共享引用的关系](/img/learn-topic/python/object-reference-model.png "Python 对象引用模型")

{% note info flat %}
图中“多个名称指向同一对象”解释了别名与可变性的共同根源；重新绑定名称不会自动复制对象，只有显式复制或构造新对象才会改变引用关系。排查参数副作用时，先确认是对象被原地修改，还是局部名称被重新绑定。
{% endnote %}

{% folding 名称、字面量与缩进边界, open %}
标识符不能是关键字；`_name` 只是约定，`__name` 可能触发类中的名称改写，稍后在面向对象一篇解释。字符串、数字、`None`、`...` 等字面量直接创建或取得对象。逻辑行以换行结束，圆括号、方括号和花括号内可以隐式续行；缩进决定语句块，所以不要混用制表符和空格。
{% endfolding %}

## 身份与相等

{% note primary flat %}
`==` 比较值是否相等，可能调用类型实现的比较协议；`is` 比较是否为同一个对象。业务值比较几乎总用 `==`，身份比较主要用于单例哨兵，最常见的是 `value is None`。
{% endnote %}

```python
first = [1, 2]
second = [1, 2]
same = first

print(first == second)  # True：内容相等
print(first is second)  # False：不是同一列表
print(first is same)    # True：同一对象
print(None is None)     # True：None 是单例
```

{% note warning flat %}
不要从 `a is b` 在某次交互式运行中恰好为真，推导“短字符串或小整数总会驻留”。对象复用是实现和上下文相关的优化，不是语言承诺；测试值相等使用 `==`，判断缺失值使用 `is None`。
{% endnote %}

| 比较 | 适用对象 | 可靠结论 |
| --- | --- | --- |
| `left == right` | 数字、字符串、容器、自定义值对象 | 值相等；类型可以自定义比较 |
| `left is right` | `None`、明确的唯一哨兵 | 同一对象；不表示值更“相等” |
| `id(value)` | 临时诊断 | 当前生命周期内的身份标识，不应用于业务逻辑 |

## 可变性

{% note primary flat %}
可变对象能在原地改变，例如列表、字典、集合和 `bytearray`；不可变对象如 `int`、`str`、`tuple` 不能原地改值。可变性不是“名称能不能重新赋值”，而是对象本身能不能被原地修改。
{% endnote %}

```python
numbers = [1, 2]
alias = numbers
numbers += [3]          # 列表通常原地扩展
print(alias)            # [1, 2, 3]

word = "py"
old = word
word += "thon"         # 字符串不可变，得到新对象并重新绑定
print(old, word)        # py python
```

{% note warning flat %}
默认参数只在函数定义时求值一次。把可变对象写成默认值会让多次调用共享同一对象；用 `None` 作为哨兵，在函数体内创建新容器。这个边界会在函数一篇再次用参数模型验证。
{% endnote %}

```python
def collect(item: str, bucket: list[str] | None = None) -> list[str]:
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
```

## 数字与运算

{% note primary flat %}
整数精确且精度不限；二进制浮点数适合科学计算和近似值，不适合精确十进制金额。金额、税率等需要十进制规则时从字符串构造 `Decimal`，而不是从已近似的 `float` 构造。
{% endnote %}

```python
from decimal import Decimal

print(0.1 + 0.2 == 0.3)                    # False
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))  # True
print(-7 // 3, -7 % 3)                      # -3 2，满足 a == (a // b) * b + a % b
```

| 主题 | 关键规则 | 常见误解 |
| --- | --- | --- |
| `/`、`//`、`%` | `/` 是真除法，`//` 向下取整，`%` 保持等式关系 | 负数整除不是“截断到零” |
| `and`、`or` | 从左到右短路，并返回参与计算的操作数 | 结果不一定是布尔值 |
| 比较链 | `a < b < c` 等价于带短路的两次比较，`b` 只求值一次 | 不等于 `(a < b) < c` |
| 优先级 | 先用括号表达意图，再记忆规则 | 不要依赖难读的优先级猜测 |

{% note success flat %}
对于浮点近似比较，使用 `math.isclose()` 并按领域指定绝对或相对容差；不要把格式化后的字符串或 `round()` 当作通用的相等判定。
{% endnote %}

## 字符串与字节

{% note primary flat %}
`str` 表示 Unicode 文本，`bytes` 表示原始字节序列。边界只有两次：读入字节时用 `decode(encoding)` 变为文本，写出文本时用 `encode(encoding)` 变为字节；不要在业务层把两者混为一谈。
{% endnote %}

```python
text = "你好, Python"
payload = text.encode("utf-8")
print(payload)                 # b'...'
print(payload.decode("utf-8"))  # 你好, Python

path = r"relative/notes"
print(path)
```

{% note warning flat %}
原始字符串只减少反斜杠转义，不会跳过所有语法规则：它不能以单个反斜杠结束。遇到 `UnicodeDecodeError`，先确认真实编码和数据来源，再选择 `errors="strict"`、`"replace"` 或领域允许的恢复策略；不要默认悄悄丢失数据。
{% endnote %}

### 方法族

| 任务 | 常用方法 | 边界 |
| --- | --- | --- |
| 清理和前后缀 | `strip`、`removeprefix`、`removesuffix` | `strip("ab")` 删除两端字符集合，不是删除子串 |
| 搜索与判定 | `find`、`count`、`startswith`、`isidentifier` | 查找失败时 `find` 返回 `-1`，`index` 抛异常 |
| 组合文本 | `split`、`partition`、`"-".join(...)` | 用 `join` 连接一组文本，不在循环中反复 `+` |
| 替换与格式化 | `replace`、`translate`、f-string、`format` | f-string 适合本地格式化，不把不可信模板直接执行 |

{% tabs python-string-forms, 1 %}
<!-- tab Unicode 与归一化 -->

```python
import unicodedata

left = "café"
right = "cafe\u0301"
print(left == right)  # False：码位序列可以不同
print(unicodedata.normalize("NFC", left) == unicodedata.normalize("NFC", right))
print("Straße".casefold() == "STRASSE".casefold())
```

<!-- endtab -->
<!-- tab 格式化与版本边界 -->

```python
name, count = "Python", 3
print(f"{name}: {count:04d}")

# Python 3.14 新增 t-string（模板字符串）语法及 string.templatelib；
# 课程项目仍以 f-string 作为普通格式化首选，运行前先核对解释器版本。
```

<!-- endtab -->
{% endtabs %}

{% note info flat %}
字符串方法返回新字符串；`bytes` 也有许多平行方法，而 `bytearray` 是可变字节缓冲区。处理网络协议、压缩或二进制文件时再进入 `bytes`/`bytearray`；普通用户文本保持为 `str`，编码边界越少越可靠。
{% endnote %}

## 对象实验

{% note info flat %}
运行这个实验前先预测五行输出：哪些名称共享列表、哪些比较值、哪些比较身份，以及为什么浮点式没有精确相等。预测和实际不一致时，逐行标出“重新绑定”或“原地修改”。
{% endnote %}

```python
from decimal import Decimal

left = ["draft"]
right = left
copy = left[:]
right.append("review")

print(left is right, left == right)  # True True
print(left is copy, left == copy)    # False False
print(copy)                          # ['draft']
print(0.1 + 0.2 == 0.3)              # False
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))  # True
```

## 结果验证

{% note success flat %}
完成本篇后，应该能够以对象模型解释输出，而不是记忆零散结论。遇到共享状态时，先检查对象身份、可变性与是否发生了重新绑定，再决定是否需要复制。
{% endnote %}

- [ ] 能解释 `alias = items` 与 `items[:]` 的区别。
- [ ] 只在比较 `None` 或明确哨兵时使用 `is`。
- [ ] 能写出可变默认参数的安全替代写法。
- [ ] 能说明金额为什么选 `Decimal("...")`，以及浮点近似比较为何选 `math.isclose()`。
- [ ] 能指出一次文本—字节转换发生在哪个系统边界。

## 常见问题

{% flashcard basic id:python-object-is-eq deck:"Python 基础" priority:1 tags:"Python,对象模型,is,相等性" %}
--- question
`is` 与 `==` 的区别是什么？什么时候应该写 `is None`？
--- answer
`==` 比较值，`is` 比较是否为同一对象；缺失值判断应写 `value is None`。
--- explanation
`==` 会调用对象的相等性协议，`is` 只问两个名称是否指向同一对象：

```python
left = [1, 2]
right = [1, 2]
print(left == right)  # True：内容相同
print(left is right)  # False：两个列表对象

value = None
print(value is None)  # True：None 的单例判断
```

短字符串和小整数有时被实现复用，但那是优化，不是业务契约。`None` 是语言明确提供的单例，所以缺失值判断应使用 `is None`，不要用 `== None` 或依赖对象缓存。
{% endflashcard %}

{% flashcard basic id:python-object-mutability deck:"Python 基础" priority:1 tags:"Python,可变性,别名,增量赋值" %}
--- question
为什么 `a = b = []` 容易出错？`+=` 为什么有时会影响别名？
--- answer
两个名称开始时指向同一列表；可变对象的 `+=` 往往原地修改，所以别名也能看到变化。
--- explanation
赋值只复制引用关系，不复制对象；`+=` 是否原地修改取决于对象的可变性：

```python
a = b = []
a += [1]
print(a, b, a is b)  # [1] [1] True

x = y = "a"
x += "b"
print(x, y, x is y)   # ab a False
```

列表、字典、集合和 `bytearray` 可以原地改，所以别名能观察到变化；字符串、整数和元组不可变，运算通常创建新对象并只重新绑定左侧名称。遇到意外共享，先检查 `is` 和对象类型，再决定复制或重新设计所有权。
{% endflashcard %}

{% flashcard basic id:python-object-binding deck:"Python 基础" priority:1 tags:"Python,赋值,函数参数,名称绑定" %}
--- question
Python 函数参数是“传值”还是“传引用”？
--- answer
形参是局部名称，调用时绑定到传入对象；修改共享可变对象会被调用方看到，重新绑定形参不会。
--- explanation
Python 调用时把形参绑定到传入对象，既没有隐式深拷贝，也不允许函数把调用方的名称重新绑定。对照两个动作即可看出边界：

```python
def change(items):
    items.append("seen")  # 改共享对象
    items = []             # 只改函数内名称

items = []
change(items)
print(items)  # ['seen']
```

因此“传值/传引用”的二选一会遮住真正机制：修改共享可变对象会被观察到，重新绑定形参不会。这个模型也能解释默认参数、闭包和 Fixture 中的容器副作用。
{% endflashcard %}

{% flashcard basic id:python-object-float deck:"Python 基础" priority:2 tags:"Python,float,Decimal,数值" %}
--- question
为什么 `0.1 + 0.2 == 0.3` 通常为假？
--- answer
这三个十进制小数多数不能被二进制浮点精确表示，运算结果是相近值而不是精确值。
--- explanation
二进制浮点保存的是近似值，`0.1`、`0.2` 和 `0.3` 通常都不是精确的二进制分数，因此加法后的误差可能暴露出来：

```python
from decimal import Decimal
import math

print(0.1 + 0.2 == 0.3)  # False（常见结果）
print(math.isclose(0.1 + 0.2, 0.3))
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))
```

科学计算先定义相对/绝对容差并用 `math.isclose()`；金额等十进制规则从字符串构造 `Decimal`。显示时四舍五入只改变展示，不会改变底层比较结果。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python 3.14 数据模型, https://docs.python.org/3.14/reference/datamodel.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 表达式, https://docs.python.org/3.14/reference/expressions.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 标准类型, https://docs.python.org/3.14/library/stdtypes.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python decimal, https://docs.python.org/3.14/library/decimal.html, https://docs.python.org/3.14/_static/py.svg %}
{% endlinkgroup %}

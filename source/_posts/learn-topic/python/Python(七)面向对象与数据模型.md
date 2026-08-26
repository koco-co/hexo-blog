---
title: Python(七)面向对象与数据模型
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 理解类与实例、属性查找、方法绑定、继承与 MRO、数据类和特殊方法，并正确解释名称改写而非私有性。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 7
published: true
abbrlink: 1aeb52d0
date: 2026-08-25 13:13:45
---

{% course_series %}

{% note info flat %}
Python 的面向对象不以“把所有代码塞进类”为目标，而是把数据、行为和不变量放在同一个清晰边界中。理解属性查找和绑定比背继承语法更重要，因为 `obj.method()`、`super()`、`property` 和特殊方法都从这里出发。
{% endnote %}

## 类与实例

{% note primary flat %}
类对象创建实例；实例通常保存自己的状态，类属性由实例共享。访问 `obj.name` 时，Python 按属性查找规则在实例、类及其基类中寻找；方法在通过实例访问时会把实例自动绑定为第一个参数。
{% endnote %}

```python
class Ticket:
    category = "general"       # 类属性

    def __init__(self, title: str):
        self.title = title      # 实例属性

    def label(self) -> str:
        return f"{self.category}: {self.title}"

ticket = Ticket("review")
print(ticket.label())
```

{% note warning flat %}
若类属性是列表或字典，所有实例会共享它。除非这个共享状态就是设计目标，否则应在 `__init__` 中创建实例属性。看到“一个实例修改，另一个实例也变了”时，先检查属性定义在类体还是初始化方法中。
{% endnote %}

| 访问方式 | 隐含绑定 | 常见用途 |
| --- | --- | --- |
| `instance.method()` | 实例作为第一个参数 | 操作实例状态 |
| `Class.method(instance)` | 手动传实例 | 理解绑定或底层调试 |
| `@classmethod` | 类作为第一个参数 | 备用构造器、类级策略 |
| `@staticmethod` | 无自动对象参数 | 与模型相关的纯工具函数 |

## 属性协议

{% note primary flat %}
`property` 把属性访问变成受控接口，让调用者写 `ticket.status`，实现仍可验证、计算或迁移存储。它适合稳定的领域属性；不要把所有零散逻辑伪装成属性，成本高或有副作用的操作应保持为方法。
{% endnote %}

```python
class Progress:
    def __init__(self, value: int = 0):
        self.value = value

    @property
    def value(self) -> int:
        return self._value

    @value.setter
    def value(self, value: int) -> None:
        if not 0 <= value <= 100:
            raise ValueError("value must be between 0 and 100")
        self._value = value
```

{% note warning flat %}
双下划线名称如 `__token` 会在类定义时改写为 `_ClassName__token`，主要用于避免子类意外覆盖，不提供安全或真正的私有性。单下划线 `_token` 是“内部使用”的约定；访问控制仍需靠 API、验证和权限边界。
{% endnote %}

## 继承与 MRO

{% note primary flat %}
继承表达“是一种”的稳定关系，组合表达“拥有/使用”的协作关系。多重继承时，方法解析顺序（MRO）决定属性从哪里取；协作式 `super()` 遵守该顺序，而不是简单地“调用父类”。
{% endnote %}

```python
class Base:
    def describe(self) -> list[str]:
        return ["base"]

class Timed(Base):
    def describe(self) -> list[str]:
        return [*super().describe(), "timed"]

class Logged(Base):
    def describe(self) -> list[str]:
        return [*super().describe(), "logged"]

class Job(Timed, Logged):
    pass

print(Job().describe())  # ['base', 'logged', 'timed']
print([cls.__name__ for cls in Job.mro()])
```

{% note warning flat %}
多重继承中的每个协作方法都应使用 `super()`，并接受兼容签名；直接点名某个父类可能跳过 MRO 中的其他协作者。若关系只是复用一小段行为，优先组合、小型 mixin 或独立函数。
{% endnote %}

## 数据类与抽象

{% note primary flat %}
`@dataclass` 适合主要承载数据的类，能生成初始化、表示和相等性等样板代码；字段默认可变值仍应使用 `default_factory`。抽象基类（ABC）表达必须实现的能力，适合需要多个可替换实现的边界，不是每个类都必须继承的框架。
{% endnote %}

```python
from dataclasses import dataclass, field

@dataclass
class Report:
    title: str
    labels: list[str] = field(default_factory=list)

report = Report("Python")
report.labels.append("interview")
```

{% folding 特殊方法的意义, open %}
`__repr__` 定义调试表示，`__str__` 定义面向人的文本，`__eq__` 定义值相等性，`__len__`、`__iter__`、`__getitem__` 让对象接入内置协议。实现特殊方法是为了让对象遵循用户预期，不是为了堆砌魔法；一旦自定义 `__eq__`，要同时考虑哈希和可变性。
{% endfolding %}

## 数据模型

{% note primary flat %}
对象模型把语法映射为协议：`len(obj)` 会查找 `__len__`，`for` 会使用迭代协议，运算符可能调用相应特殊方法。先选择清晰的数据结构，再实现少量真实需要的协议，胜过从头模拟内置类型。
{% endnote %}

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: int
    y: int

    def __add__(self, other: "Point") -> "Point":
        if not isinstance(other, Point):
            return NotImplemented
        return Point(self.x + other.x, self.y + other.y)

print(Point(1, 2) + Point(3, 4))
```

## 模型实验

{% note info flat %}
运行前先预测：`make()` 是否得到两个独立的标签列表？`__init__` 是否创建对象？属性 `title` 是实例还是类属性？每个答案都应能从初始化、字段工厂或查找规则得到。
{% endnote %}

```python
from dataclasses import dataclass, field

@dataclass
class Note:
    title: str
    labels: list[str] = field(default_factory=list)

first = Note("draft")
second = Note("review")
first.labels.append("Python")

print(first.labels)   # ['Python']
print(second.labels)  # []
print(Note.__new__(Note) is not None)  # __new__ 负责创建实例
```

## 结果验证

{% note success flat %}
完成本篇后，应能按“实例 → 类 → 基类 MRO”的路径解释属性，而不是把实例方法、类方法和静态方法当成三套互不相关的语法。设计类时优先维护不变量和可替换边界，再考虑继承层次。
{% endnote %}

- [ ] 能区分类属性与实例属性的共享范围。
- [ ] 能用 `property` 验证一个领域值。
- [ ] 能写出多重继承中 `super()` 的协作含义。
- [ ] 能用 `default_factory` 避免数据类共享可变默认值。
- [ ] 能解释 `__new__` 创建对象、`__init__` 初始化对象。

## 常见问题

{% flashcard basic id:python-oop-method-kinds deck:"Python 基础" priority:1 tags:"Python,OOP,实例方法,类方法,静态方法" %}
--- question
实例方法、类方法和静态方法如何选择？
--- answer
依赖实例状态用实例方法，依赖类状态或备用构造器用类方法，无自动对象参数的相关工具函数用静态方法。
--- explanation
实例方法通过绑定得到 `self`，类方法通过绑定得到 `cls`，静态方法不自动接收对象。不要仅为“看起来面向对象”把普通函数硬塞进静态方法。
{% endflashcard %}

{% flashcard basic id:python-oop-mro-super deck:"Python 基础" priority:1 tags:"Python,MRO,super,继承" %}
--- question
`super()` 在多重继承中做什么？
--- answer
它按照当前类的 MRO 找到下一个协作实现，而不是简单调用某个固定父类。
--- explanation
每个协作方法都用 `super()`，才能让同一条 MRO 上的所有实现各执行一次。直接调用 `Parent.method(self)` 可能绕过其他 mixin，造成初始化或行为遗漏。
{% endflashcard %}

{% flashcard basic id:python-oop-name-mangling deck:"Python 基础" priority:2 tags:"Python,名称改写,封装" %}
--- question
类中的 `__name` 是否真正私有？
--- answer
不是；它会被改写为带类名的属性，主要避免子类意外重名。
--- explanation
名称改写不提供安全边界，仍可通过改写后的名称访问。单下划线是内部约定，真正的安全要靠权限、校验和外部接口限制。
{% endflashcard %}

{% flashcard basic id:python-oop-new-init deck:"Python 基础" priority:2 tags:"Python,__new__,__init__,对象生命周期" %}
--- question
`__new__` 与 `__init__` 的职责分别是什么？
--- answer
`__new__` 创建并返回实例，`__init__` 对已经创建的实例初始化状态。
--- explanation
普通类通常只实现 `__init__`。处理不可变类型子类、控制实例创建或元编程时才需要理解 `__new__`；`__init__` 不应返回非 None 值。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python 3.14 数据模型, https://docs.python.org/3.14/reference/datamodel.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python dataclasses, https://docs.python.org/3.14/library/dataclasses.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python abc, https://docs.python.org/3.14/library/abc.html, https://docs.python.org/3.14/_static/py.svg %}
{% endlinkgroup %}

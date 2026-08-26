---
title: Python(四)内置类型与容器
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 根据顺序、可变性、哈希、复制与复杂度选择 Python 容器，并验证浅拷贝、深拷贝和排序查找行为。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 4
published: true
abbrlink: c43fdd4
date: 2026-08-25 13:13:45
---

{% course_series %}

{% note info flat %}
容器选择先问数据关系，不先背方法：要保序的重复项、固定位置、按键查值、去重成员，分别对应不同结构。对象身份与可变性决定了容器能否安全共享、作为键，或需要复制。
{% endnote %}

## 容器选择

{% note primary flat %}
`list` 是可变有序序列，`tuple` 是不可变有序序列，`dict` 按键映射值，`set` 保存不重复的可哈希元素。Python 3.7 起语言保证普通 `dict` 保持插入顺序，但它不是按键排序的结构。
{% endnote %}

| 需求 | 首选 | 理由 | 不要误用 |
| --- | --- | --- | --- |
| 反复追加、按位置编辑 | `list` | 可变且保序 | 用 `tuple` 再不断拼接 |
| 固定记录、可作为字典键 | `tuple` | 不可变；元素也可哈希时整体可哈希 | 把可变 `list` 放入 `set` |
| 名称到对象的查找 | `dict` | 键唯一，平均查找快 | 用两条平行列表维护关系 |
| 去重、集合运算、成员判断 | `set` | 无重复，支持并交差 | 依赖其显示顺序 |

{% folding “可哈希”到底表示什么, open %}
可哈希对象在生命周期内拥有稳定哈希值，并能与相等性规则配合。不可变不自动等于可哈希：元组只在其所有元素可哈希时才可哈希；自定义类若重写相等性也要谨慎设计哈希。字典键和集合元素必须可哈希，列表、字典和集合本身不能直接作为键或元素。
{% endfolding %}

## 序列操作

{% note primary flat %}
序列支持索引、切片和解包。切片 `items[start:stop:step]` 的右边界不包含在结果中；它通常返回同类型的新浅副本。解包把位置关系写在代码中，长度不匹配会立即报错，星号目标可接住中间部分。
{% endnote %}

```python
records = ["draft", "review", "publish"]
first, *middle, last = records
print(first, middle, last)        # draft ['review'] publish
print(records[::-1])              # 新列表，倒序

point = (10, 20)
x, y = point
```

{% note warning flat %}
`list.extend(values)` 逐个加入元素，而 `list.append(values)` 把整个对象作为一个元素加入。二者都在原列表上修改并返回 `None`；把返回值赋回变量会得到 `None`，这是面试和生产代码都常见的失误。
{% endnote %}

## 映射与集合

{% note primary flat %}
字典读取未知键时，`mapping[key]` 会抛 `KeyError`，`mapping.get(key, default)` 提供默认值。遍历时默认得到键；需要键值对用 `items()`。集合成员测试与集合运算表达的是关系，不负责保留原有顺序。
{% endnote %}

```python
scores = {"Ada": 95, "Lin": 88}
print(scores.get("Guido", 0))

required = {"name", "email"}
received = {"name", "email", "note"}
print(required <= received)       # True：required 是 received 的子集
print(received - required)        # {'note'}
```

{% tabs python-mapping-update, 1 %}
<!-- tab 合并映射 -->

```python
base = {"timeout": 3, "retries": 1}
override = {"timeout": 10}
effective = base | override       # 新字典，右侧同名键覆盖
print(effective)
```

<!-- endtab -->
<!-- tab 安全地累积 -->

```python
groups: dict[str, list[str]] = {}
for name, team in [("Ada", "core"), ("Lin", "core")]:
    groups.setdefault(team, []).append(name)
print(groups)
```

<!-- endtab -->
{% endtabs %}

## 复制与共享

{% note primary flat %}
浅拷贝只复制最外层容器，内部对象仍被共享；深拷贝递归复制可复制的内容。它不是默认动作：先判断是否真的要独立所有权，还是应把可变状态封装在一个明确的边界内。
{% endnote %}

```python
import copy

original = [["draft"], ["review"]]
shallow = original.copy()
deep = copy.deepcopy(original)

original[0].append("changed")
print(shallow[0])  # ['draft', 'changed']：内层列表共享
print(deep[0])     # ['draft']：内层列表独立
```

{% note warning flat %}
`[[]] * 3` 复制的是同一个内层列表引用，不会创建三行独立列表。需要二维可变结构时，用推导式：`[[] for _ in range(3)]`。这正是“乘法复制容器”和“复制容器元素”不同的证据。
{% endnote %}

## 排序与查找

{% note primary flat %}
`sorted(iterable)` 返回新列表；`list.sort()` 原地排序并返回 `None`。两者都稳定，`key` 应返回比较键而不是手写复杂比较器。若数据本来有序，使用 `bisect` 定位插入点；不要把线性列表查找误当作字典索引。
{% endnote %}

```python
tasks = [
    {"name": "lint", "priority": 2},
    {"name": "test", "priority": 1},
]
ordered = sorted(tasks, key=lambda item: item["priority"])
print([item["name"] for item in ordered])  # ['test', 'lint']

import bisect
levels = [1, 3, 7, 10]
print(bisect.bisect_left(levels, 7))         # 2
```

| 操作 | 复杂度直觉 | 选择建议 |
| --- | --- | --- |
| 列表按下标读取 | 通常 O(1) | 位置是主索引时合适 |
| 列表成员判断 | O(n) | 小列表或保序扫描时合适 |
| 字典/集合成员判断 | 平均 O(1) | 按键或去重判断时优先 |
| 排序 | O(n log n) | 先生成清晰键，再排序 |

## 容器实验

{% note info flat %}
这个例子同时验证键的哈希性、浅拷贝的共享和稳定排序。先预测三处输出，再运行；若预测失败，回到“最外层容器是否新建、内层对象是否仍相同”这个问题。
{% endnote %}

```python
import copy

plan = {"todo": ["draft"], "done": []}
snapshot = plan.copy()
isolated = copy.deepcopy(plan)
plan["todo"].append("review")

print(snapshot["todo"])  # ['draft', 'review']
print(isolated["todo"])  # ['draft']

labels = {"Python", "Python", "面试"}
print(labels)             # 两个元素，显示顺序不作承诺
```

## 结果验证

{% note success flat %}
容器题的高质量答案不只报出类型名，还会说明顺序、可变性、键/元素限制、复制层次与预期复杂度。这样才可以从“会用 API”走到“能解释选型”。
{% endnote %}

- [ ] 能说明元组何时可以作字典键。
- [ ] 能区分 `append`、`extend`、`sorted` 与 `sort` 的返回值和副作用。
- [ ] 能用一个嵌套列表展示浅拷贝与深拷贝差异。
- [ ] 能说明为什么成员测试频繁时倾向字典或集合。
- [ ] 不依赖集合显示顺序实现业务规则。

## 常见问题

{% flashcard basic id:python-container-list-tuple deck:"Python 基础" priority:1 tags:"Python,list,tuple,容器" %}
--- question
列表和元组如何选择？
--- answer
需要原地增删改时选列表；表示固定、有序记录且不应修改时选元组。
--- explanation
元组不可变，所有元素可哈希时可作为字典键或集合元素；列表可变、适合累积数据，但不能直接作为键。选择取决于数据关系和修改边界，不取决于谁的 API 更多。
{% endflashcard %}

{% flashcard basic id:python-container-hashable deck:"Python 基础" priority:1 tags:"Python,hash,dict,set" %}
--- question
为什么列表不能作为字典键或集合元素？
--- answer
列表可变，哈希值无法稳定；字典键和集合元素必须可哈希。
--- explanation
键的位置由哈希和相等性共同决定。若键在放入后还能改变，查找就可能失效。元组只有在其所有元素都可哈希时才可哈希，不能只看它表面上不可变。
{% endflashcard %}

{% flashcard basic id:python-container-copy deck:"Python 基础" priority:1 tags:"Python,浅拷贝,深拷贝,共享引用" %}
--- question
浅拷贝和深拷贝的差别是什么？
--- answer
浅拷贝只新建外层容器，内层对象继续共享；深拷贝递归复制可复制的内部对象。
--- explanation
`list.copy()`、切片和 `dict.copy()` 都是浅拷贝。嵌套可变对象是否共享要通过身份或修改实验验证；深拷贝也有成本，并不等于总是更安全。
{% endflashcard %}

{% flashcard basic id:python-container-sort deck:"Python 基础" priority:2 tags:"Python,sorted,sort,bisect" %}
--- question
`sorted()` 和 `list.sort()` 有什么区别？
--- answer
`sorted()` 返回新列表；`list.sort()` 原地修改列表并返回 `None`。
--- explanation
二者排序稳定，均可用 `key` 提供比较键。需要保留原始数据时选 `sorted()`；只想重排现有列表时用 `sort()`。已排序序列的插入位置可由 `bisect` 查找。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Python 3.14 标准类型, https://docs.python.org/3.14/library/stdtypes.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python copy, https://docs.python.org/3.14/library/copy.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python bisect, https://docs.python.org/3.14/library/bisect.html, https://docs.python.org/3.14/_static/py.svg %}
{% link Python collections, https://docs.python.org/3.14/library/collections.html, https://docs.python.org/3.14/_static/py.svg %}
{% endlinkgroup %}

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
published: false
abbrlink: c43fdd4
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：select and manipulate built-in containers based on ordering, mutability, uniqueness, hashing, copying, and algorithmic behavior.
- 学习成果：reader can choose a container, explain dictionary/set key restrictions, and predict shallow/deep copy effects.
- 前置文章：Python(三)对象、变量与运算.
- 复用或新建依据：reuse and shorten the old list/tuple/set/dict exercises; replace definition-heavy tables with comparison and memory-graph experiments.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:datamodel#sequences` | 核心详解 | 列表与元组 |
| `langref:datamodel#immutable-sequences` | 核心详解 | 列表与元组 |
| `langref:datamodel#mutable-sequences` | 核心详解 | 列表与元组 |
| `langref:datamodel#set-types` | 核心详解 | 字典与集合 |
| `langref:datamodel#mappings` | 核心详解 | 字典与集合 |
| `langref:datamodel#dictionaries` | 核心详解 | 字典与集合 |
| `langref:datamodel#slice-objects` | 核心详解 | 列表与元组 |
| `langref:expressions#subscriptions-and-slicings` | 核心详解 | 容器协议 |
| `langref:expressions#slicings` | 核心详解 | 容器协议 |
| `langref:expressions#starred-subscriptions` | 核心详解 | 容器协议 |
| `langref:expressions#formal-subscription-grammar` | 核心详解 | 容器协议 |
| `langref:expressions#membership-test-operations` | 核心详解 | 容器协议 |
| `builtin:hash` | 正文简述 | 字典与集合 |
| `builtin:len` | 核心详解 | 容器协议 |
| `builtin:slice` | 正文简述 | 列表与元组 |
| `builtin:slice.start` | 正文简述 | 列表与元组 |
| `builtin:slice.stop` | 正文简述 | 列表与元组 |
| `builtin:slice.step` | 正文简述 | 列表与元组 |
| `builtin:sorted` | 核心详解 | 排序与查找 |
| `stdtype:sequence.count` | 正文简述 | 列表与元组 |
| `stdtype:sequence.index` | 正文简述 | 列表与元组 |
| `stdtype:sequence.append` | 正文简述 | 列表与元组 |
| `stdtype:sequence.clear` | 正文简述 | 列表与元组 |
| `stdtype:sequence.copy` | 正文简述 | 复制与共享 |
| `stdtype:sequence.extend` | 正文简述 | 列表与元组 |
| `stdtype:sequence.insert` | 正文简述 | 列表与元组 |
| `stdtype:sequence.pop` | 正文简述 | 列表与元组 |
| `stdtype:sequence.remove` | 正文简述 | 列表与元组 |
| `stdtype:sequence.reverse` | 正文简述 | 列表与元组 |
| `stdtype:list` | 正文简述 | 列表与元组 |
| `stdtype:list.sort` | 核心详解 | 排序与查找 |
| `stdtype:tuple` | 正文简述 | 列表与元组 |
| `stdtype:range` | 正文简述 | 列表与元组 |
| `stdtype:range.start` | 核心详解 | 列表与元组 |
| `stdtype:range.stop` | 核心详解 | 列表与元组 |
| `stdtype:range.step` | 核心详解 | 列表与元组 |
| `stdtype:set` | 正文简述 | 字典与集合 |
| `stdtype:frozenset` | 正文简述 | 字典与集合 |
| `stdtype:frozenset.isdisjoint` | 正文简述 | 字典与集合 |
| `stdtype:set.isdisjoint` | 正文简述 | 字典与集合 |
| `stdtype:frozenset.issubset` | 正文简述 | 字典与集合 |
| `stdtype:set.issubset` | 正文简述 | 字典与集合 |
| `stdtype:frozenset.issuperset` | 正文简述 | 字典与集合 |
| `stdtype:set.issuperset` | 正文简述 | 字典与集合 |
| `stdtype:frozenset.union` | 正文简述 | 字典与集合 |
| `stdtype:set.union` | 核心详解 | 字典与集合 |
| `stdtype:frozenset.intersection` | 正文简述 | 字典与集合 |
| `stdtype:set.intersection` | 核心详解 | 字典与集合 |
| `stdtype:frozenset.difference` | 正文简述 | 字典与集合 |
| `stdtype:set.difference` | 核心详解 | 字典与集合 |
| `stdtype:frozenset.symmetric_difference` | 正文简述 | 字典与集合 |
| `stdtype:set.symmetric_difference` | 正文简述 | 字典与集合 |
| `stdtype:frozenset.copy` | 正文简述 | 复制与共享 |
| `stdtype:set.copy` | 正文简述 | 复制与共享 |
| `stdtype:set.update` | 正文简述 | 字典与集合 |
| `stdtype:set.intersection_update` | 正文简述 | 字典与集合 |
| `stdtype:set.difference_update` | 正文简述 | 字典与集合 |
| `stdtype:set.symmetric_difference_update` | 正文简述 | 字典与集合 |
| `stdtype:set.add` | 核心详解 | 字典与集合 |
| `stdtype:set.remove` | 核心详解 | 字典与集合 |
| `stdtype:set.discard` | 核心详解 | 字典与集合 |
| `stdtype:set.pop` | 正文简述 | 字典与集合 |
| `stdtype:set.clear` | 正文简述 | 字典与集合 |
| `stdtype:dict` | 正文简述 | 字典与集合 |
| `stdtype:dict.clear` | 正文简述 | 字典与集合 |
| `stdtype:dict.copy` | 正文简述 | 复制与共享 |
| `stdtype:dict.fromkeys` | 正文简述 | 字典与集合 |
| `stdtype:dict.get` | 核心详解 | 字典与集合 |
| `stdtype:dict.items` | 核心详解 | 字典与集合 |
| `stdtype:dict.keys` | 核心详解 | 字典与集合 |
| `stdtype:dict.pop` | 核心详解 | 字典与集合 |
| `stdtype:dict.popitem` | 正文简述 | 字典与集合 |
| `stdtype:dict.setdefault` | 正文简述 | 字典与集合 |
| `stdtype:dict.update` | 核心详解 | 字典与集合 |
| `stdtype:dict.values` | 核心详解 | 字典与集合 |
| `stdlib:array` | 正文简述 | 列表与元组 / array 与通用序列边界 |
| `stdlib:bisect` | 核心详解 | 排序与查找 |
| `stdlib:collections` | 核心详解 | 容器协议 |
| `stdlib:collections.abc` | 核心详解 | 容器协议 |
| `stdlib:copy` | 核心详解 | 复制与共享 |
| `stdlib:heapq` | 核心详解 | 排序与查找 |

## 正文大纲

- H2：容器协议
  - H3：序列、映射与集合
  - H3：成员、长度与遍历
- H2：列表与元组
  - H3：修改能力
  - H3：切片与步长
  - H3：array 与通用序列边界
- H2：字典与集合
  - H3：哈希与可哈希对象
  - H3：键唯一性与集合运算
  - H3：顺序与实现边界
- H2：复制与共享
  - H3：赋值不是复制
  - H3：浅拷贝
  - H3：深拷贝与递归对象
- H2：排序与查找
  - H3：sorted 与 list.sort
  - H3：key 函数与稳定排序
  - H3：bisect、heapq 与复杂度
- H2：容器选择实验
  - H3：员工记录重构
  - H3：嵌套结构复制
  - H3：性能对比
- H2：结果验证
- H2：常见问题
- H2：参考资料

## 内容计划

- 贯穿案例与完整示例：model employee records using several containers, sort and index them, then demonstrate aliasing, shallow copy, deep copy, and a self-referential structure.
- 失败边界与踩坑：tuple immutability does not make contained objects immutable; hashability is not identical to immutability; `deepcopy` may copy too much.
- FAQ 候选与来源：Programming FAQ on lists changing together, object copying, multidimensional lists, duplicate removal, tuple/list differences, and complex sorting; Design FAQ on dictionary keys and list/tuple separation.
- 自测与闪卡计划：
  - `python-container-list-tuple` priority 1.
    - `python-container-hashable` priority 1.
    - `python-container-copy` priority 1.
    - `python-container-sort` priority 2.
- 可视化：container decision table, hash lookup sketch, and nested-copy reference graph.
- 主要参考资料：Built-in types, `copy`, `collections`, `bisect`, `heapq`, Sorting HOWTO, Programming/Design FAQ.

## 常见问题

待正文阶段按主题编写；需要长期复习的问答优先使用带稳定 ID 和优先级的 flashcard。

## 参考资料

待正文阶段按正文出现顺序补齐官方资料卡片。

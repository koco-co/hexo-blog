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

## 文章职责

- 唯一要解决的问题：select and manipulate built-in containers based on ordering, mutability, uniqueness, hashing, copying, and algorithmic behavior.
- 可观察成果：reader can choose a container, explain dictionary/set key restrictions, and predict shallow/deep copy effects.
- 进入条件：Python(三)对象、变量与运算.
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

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
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 容器协议 | 建立容器协议的心智模型 | 序列、映射与集合；成员、长度与遍历 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 列表与元组 | 建立列表与元组的心智模型 | 修改能力；切片与步长；array 与通用序列边界 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 字典与集合 | 建立字典与集合的心智模型 | 哈希与可哈希对象；键唯一性与集合运算；顺序与实现边界 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 复制与共享 | 建立复制与共享的心智模型 | 赋值不是复制；浅拷贝；深拷贝与递归对象 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 排序与查找 | 建立排序与查找的心智模型 | sorted 与 list.sort；key 函数与稳定排序；bisect、heapq 与复杂度 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 容器选择实验 | 完成并验证容器选择实验 | 员工记录重构；嵌套结构复制；性能对比 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 结果验证的输入、关键步骤、结果与边界 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 常见问题 | 建立常见问题的心智模型 | 常见问题的输入、关键步骤、结果与边界 | `flashcard` | 真实高价值问题需要进入长期复习队列 | 题面、精简答案和详细解析 | 闪卡脚本失效时题面与答案正文仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 参考资料 | 建立参考资料的心智模型 | 参考资料的输入、关键步骤、结果与边界 | `linkgroup/link` | 官方扩展阅读使用统一资料卡片 | 资料名称、用途和完整 URL | 图片或网络失败时名称与 URL 仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例与完整示例：model employee records using several containers, sort and index them, then demonstrate aliasing, shallow copy, deep copy, and a self-referential structure.
- 失败边界与踩坑：tuple immutability does not make contained objects immutable; hashability is not identical to immutability; `deepcopy` may copy too much.
- FAQ 候选与来源：Programming FAQ on lists changing together, object copying, multidimensional lists, duplicate removal, tuple/list differences, and complex sorting; Design FAQ on dictionary keys and list/tuple separation.
- 复习卡片：
  - `python-container-list-tuple` priority 1.
    - `python-container-hashable` priority 1.
    - `python-container-copy` priority 1.
    - `python-container-sort` priority 2.
- 图表或实验：container decision table, hash lookup sketch, and nested-copy reference graph.
- 主要参考资料：Built-in types, `copy`, `collections`, `bisect`, `heapq`, Sorting HOWTO, Programming/Design FAQ.
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

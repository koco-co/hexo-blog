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
published: false
abbrlink: 1aeb52d0
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：connect class syntax to attribute lookup, method binding, inheritance, MRO, descriptors exposed through `property`, dataclasses, and special methods.
- 可观察成果：reader can predict method/attribute resolution and implement a small value object with correct equality, representation, and ordering behavior.
- 进入条件：Python(六)迭代器、生成器与装饰器.
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 复用或新建依据：reuse the old class/inheritance/polymorphism examples only after correcting privacy and method-binding explanations.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:datamodel#the-standard-type-hierarchy` | 核心详解 | 类与实例 |
| `langref:datamodel#special-read-only-attributes` | 核心详解 | 特殊方法 |
| `langref:datamodel#special-writable-attributes` | 核心详解 | 特殊方法 |
| `langref:datamodel#instance-methods` | 核心详解 | 方法与属性接口 |
| `langref:datamodel#built-in-methods` | 核心详解 | 方法与属性接口 |
| `langref:datamodel#classes` | 核心详解 | 类与实例 |
| `langref:datamodel#class-instances` | 核心详解 | 类与实例 |
| `langref:datamodel#custom-classes` | 核心详解 | 类与实例 |
| `langref:datamodel#special-attributes` | 核心详解 | 特殊方法 |
| `langref:datamodel#special-methods` | 核心详解 | 方法与属性接口 |
| `langref:datamodel#id4` | 核心详解 | 类与实例 |
| `langref:datamodel#id5` | 核心详解 | 类与实例 |
| `langref:datamodel#static-method-objects` | 核心详解 | 方法与属性接口 |
| `langref:datamodel#class-method-objects` | 核心详解 | 方法与属性接口 |
| `langref:datamodel#special-method-names` | 核心详解 | 方法与属性接口 |
| `langref:datamodel#basic-customization` | 核心详解 | 类与实例 |
| `langref:datamodel#customizing-attribute-access` | 核心详解 | 属性查找 |
| `langref:datamodel#emulating-callable-objects` | 核心详解 | 特殊方法 |
| `langref:datamodel#emulating-container-types` | 核心详解 | 特殊方法 |
| `langref:datamodel#emulating-numeric-types` | 核心详解 | 特殊方法 |
| `langref:datamodel#customizing-positional-arguments-in-class-pattern-matching` | 核心详解 | 类与实例 |
| `langref:datamodel#special-method-lookup` | 核心详解 | 方法与属性接口 |
| `langref:expressions#index-5` | 核心详解 | 属性查找 / 名称改写 |
| `langref:compound_stmts#class-definitions` | 核心详解 | 类与实例 |
| `builtin:classmethod` | 正文简述 | 方法与属性接口 |
| `builtin:delattr` | 正文简述 | 类与实例 |
| `builtin:dir` | 正文简述 | 类与实例 |
| `builtin:getattr` | 正文简述 | 类与实例 |
| `builtin:hasattr` | 正文简述 | 类与实例 |
| `builtin:isinstance` | 核心详解 | 类与实例 |
| `builtin:issubclass` | 核心详解 | 类与实例 |
| `builtin:object` | 核心详解 | 类与实例 |
| `builtin:property` | 正文简述 | 方法与属性接口 |
| `builtin:property.getter` | 正文简述 | 方法与属性接口 |
| `builtin:property.setter` | 正文简述 | 方法与属性接口 |
| `builtin:property.deleter` | 正文简述 | 方法与属性接口 |
| `builtin:property.__name__` | 正文简述 | 方法与属性接口 |
| `builtin:setattr` | 正文简述 | 类与实例 |
| `builtin:staticmethod` | 正文简述 | 方法与属性接口 |
| `builtin:super` | 核心详解 | 继承与 MRO |
| `builtin:type` | 核心详解 | 类与实例 |
| `builtin:vars` | 正文简述 | 类与实例 |
| `stdlib:abc` | 核心详解 | 数据类与抽象接口 |
| `stdlib:dataclasses` | 核心详解 | 数据类与抽象接口 |
| `stdlib:enum` | 正文简述 | 数据类与抽象接口 |
| `stdlib:types` | 正文简述 | 类与实例 / 运行时类型辅助对象 |
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 类与实例 | 建立类与实例的心智模型 | 类对象与实例对象；实例属性与类属性；self 与绑定方法；运行时类型辅助对象 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 属性查找 | 建立属性查找的心智模型 | 实例、类与基类；__getattribute__ 与 __getattr__ 识别；名称改写 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 继承与 MRO | 建立继承与 MRO的心智模型 | 重写与 super；多继承与 C3 顺序；组合与继承边界 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 方法与属性接口 | 建立方法与属性接口的心智模型 | 实例方法；classmethod 与 staticmethod；property | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 数据类与抽象接口 | 建立数据类与抽象接口的心智模型 | dataclass；ABC；多态与鸭子类型 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 特殊方法 | 建立特殊方法的心智模型 | __new__ 与 __init__；__repr__、__str__ 与 __eq__；容器与上下文协议入口 | `folding` | 只收纳不影响主线的低频补充，核心结论必须先在折叠外给出 | 折叠外摘要、适用条件和继续阅读理由 | 折叠失效时标题概括补充主题，正文仍可顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 领域模型实验 | 完成并验证领域模型实验 | 日志记录值对象；排序、哈希与验证 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 结果验证的输入、关键步骤、结果与边界 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 常见问题 | 建立常见问题的心智模型 | 常见问题的输入、关键步骤、结果与边界 | `flashcard` | 真实高价值问题需要进入长期复习队列 | 题面、精简答案和详细解析 | 闪卡脚本失效时题面与答案正文仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 参考资料 | 建立参考资料的心智模型 | 参考资料的输入、关键步骤、结果与边界 | `linkgroup/link` | 官方扩展阅读使用统一资料卡片 | 资料名称、用途和完整 URL | 图片或网络失败时名称与 URL 仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例与完整示例：create a dataclass-based log record and class hierarchy, inspect bound methods and MRO, implement representation/equality, and demonstrate name mangling without claiming privacy.
- 失败边界与踩坑：`super()` follows MRO rather than a lexical parent; mutable dataclasses have hashing constraints; `__del__` is not deterministic resource management.
- FAQ 候选与来源：Programming FAQ object questions and Design FAQ on explicit `self`, interface specifications, and memory behavior.
- 复习卡片：
  - `python-oop-method-kinds` priority 1.
    - `python-oop-mro-super` priority 1.
    - `python-oop-name-mangling` priority 2.
    - `python-oop-new-init` priority 2.
- 图表或实验：attribute lookup chain, C3 MRO graph, method binding table, and object construction sequence.
- 主要参考资料：Data model, class statements, `abc`, `dataclasses`, Programming/Design FAQ.
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

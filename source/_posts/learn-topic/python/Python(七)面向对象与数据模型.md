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

## 学习目标

- 唯一问题：connect class syntax to attribute lookup, method binding, inheritance, MRO, descriptors exposed through `property`, dataclasses, and special methods.
- 学习成果：reader can predict method/attribute resolution and implement a small value object with correct equality, representation, and ordering behavior.
- 前置文章：Python(六)迭代器、生成器与装饰器.
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

## 章节计划

- H2：类与实例
  - H3：类对象与实例对象
  - H3：实例属性与类属性
  - H3：self 与绑定方法
  - H3：运行时类型辅助对象
- H2：属性查找
  - H3：实例、类与基类
  - H3：__getattribute__ 与 __getattr__ 识别
  - H3：名称改写
- H2：继承与 MRO
  - H3：重写与 super
  - H3：多继承与 C3 顺序
  - H3：组合与继承边界
- H2：方法与属性接口
  - H3：实例方法
  - H3：classmethod 与 staticmethod
  - H3：property
- H2：数据类与抽象接口
  - H3：dataclass
  - H3：ABC
  - H3：多态与鸭子类型
- H2：特殊方法
  - H3：__new__ 与 __init__
  - H3：__repr__、__str__ 与 __eq__
  - H3：容器与上下文协议入口
- H2：领域模型实验
  - H3：日志记录值对象
  - H3：排序、哈希与验证
- H2：结果验证
- H2：常见问题
- H2：参考资料

## 验证方式

- 贯穿案例与完整示例：create a dataclass-based log record and class hierarchy, inspect bound methods and MRO, implement representation/equality, and demonstrate name mangling without claiming privacy.
- 失败边界与踩坑：`super()` follows MRO rather than a lexical parent; mutable dataclasses have hashing constraints; `__del__` is not deterministic resource management.
- FAQ 候选与来源：Programming FAQ object questions and Design FAQ on explicit `self`, interface specifications, and memory behavior.
- 自测与闪卡计划：
  - `python-oop-method-kinds` priority 1.
    - `python-oop-mro-super` priority 1.
    - `python-oop-name-mangling` priority 2.
    - `python-oop-new-init` priority 2.
- 可视化：attribute lookup chain, C3 MRO graph, method binding table, and object construction sequence.
- 主要参考资料：Data model, class statements, `abc`, `dataclasses`, Programming/Design FAQ.

---
title: Python(一)入门路线
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 建立 Python 系统课程的版本边界、依赖顺序、能力范围和验证方法，为基础语法、运行机制、质量保障与项目实战提供统一入口。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 1
published: true
abbrlink: 1480bf96
date: 2026-08-25 13:13:45
---

{% note info flat %}
这是一门以 Python 基础和面试追问为主线的系统课程。它从解释器、对象与容器开始，逐步进入函数抽象、数据模型、错误处理、质量保障和并发机制，最后完成一个可验证的命令行日志分析器。
{% endnote %}

![Python 基础课程封面](/img/picgo-images/python-course-cover.png "Python 基础课程封面")

{% course_series %}

{% note info flat %}
本篇只说明课程范围、依赖和开始方式；具体知识点与面试复习题放在对应主题文章。
{% endnote %}

## 课程目标

- 从零建立 Python 的运行、对象、语法和标准库心智模型。
- 能解释名称绑定、可变性、迭代、MRO、异常链、GC、GIL 等常见面试追问。
- 能把类型、测试、日志、资源安全和性能测量组合进一个完整项目。
- Python 语言保证与 CPython 实现细节分开说明；目标资料固定为 Python 3.14.7，核心实验兼容本地 Python 3.13.12。

## 前置条件

- 不要求已有 Python 项目经验。
- 需要能够使用终端、编辑文本文件并运行简单命令；相关操作会在课程中补齐。
- 《Python现代化开发工具链指南》只作为 uv、Ruff、Pyright 等工具的伴读，不替代本课程。

## 学习路径

{% mermaid %}
flowchart TD
  A[运行环境与代码组织] --> B[对象、变量与运算]
  B --> C[内置类型与容器]
  C --> D[流程控制与函数]
  D --> E[迭代器、生成器与装饰器]
  E --> F[面向对象与数据模型]
  F --> G[异常、上下文与文件]
  G --> H[类型与质量保障]
  H --> I[内存、并发与性能]
  I --> J[项目实战]
  I --> K[进阶路线：可选]
{% endmermaid %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| ---: | --- | --- | --- | --- |
| 1 | Python(一)入门路线 | 课程边界、顺序和完成标准 | 无 | 公开路线图 |
| 2 | Python(二)运行环境与代码组织 | 环境、入口、模块、包和导入 | 入门路线 | 未发布占位 |
| 3 | Python(三)对象、变量与运算 | 名称绑定、对象、数字和字符串 | 第二篇 | 未发布占位 |
| 4 | Python(四)内置类型与容器 | 容器选择、复制、排序与查找 | 第三篇 | 未发布占位 |
| 5 | Python(五)流程控制与函数 | 流程、参数、作用域和闭包 | 第四篇 | 未发布占位 |
| 6 | Python(六)迭代器、生成器与装饰器 | 惰性迭代、生成器和装饰器 | 第五篇 | 未发布占位 |
| 7 | Python(七)面向对象与数据模型 | 属性查找、方法绑定、继承和特殊方法 | 第六篇 | 未发布占位 |
| 8 | Python(八)异常、上下文与文件 | 异常、资源、文件、路径和正则 | 第七篇 | 未发布占位 |
| 9 | Python(九)类型与质量保障 | 类型、测试、调试、日志和测量 | 第八篇 | 未发布占位 |
| 10 | Python(十)内存、并发与性能 | 生命周期、GC、GIL 与并发选型 | 第九篇 | 未发布占位 |
| 11 | Python(十一)进阶路线 | 低频内部机制和旧接口迁移 | 第十篇 | 未发布占位，可选 |
| 12 | Python(十二)项目实战 | 命令行日志分析器 | 第十篇 | 未发布占位 |

## 开始学习

1. 按主线顺序阅读，每篇先建立机制，再运行完整实验。
2. 遇到版本差异时，以文中的 3.13/3.14 分支为准，不把 CPython 行为当成所有实现的保证。
3. 完成示例后先预测输出，再运行测试和失败用例；需要长期记忆的面试题会进入统一闪卡卡组。
4. 第十一篇是可选路线；完成第十篇后可以直接进入项目实战。

## 参考资料

{% linkgroup %}
{% link Python 3.14.7 发布说明, https://www.python.org/downloads/release/python-3147/, https://www.python.org/static/favicon.ico %}
{% link Python 3.14 语言参考, https://docs.python.org/3.14/reference/, https://docs.python.org/3.14/_static/py.svg %}
{% link Python 3.14 标准库, https://docs.python.org/3.14/library/, https://docs.python.org/3.14/_static/py.svg %}
{% link CPython v3.14.7, https://github.com/python/cpython/tree/823f0323ee6ec1402088b73bce1a38473cac36dc, https://github.com/favicon.ico %}
{% endlinkgroup %}

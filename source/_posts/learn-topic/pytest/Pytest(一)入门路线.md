---
title: Pytest(一)入门路线
tags:
  - Pytest
  - Python测试
  - 系统学习
categories:
  - Learn Topic
  - Pytest
description: 从测试执行模型、收集选择、断言诊断和 Fixture 出发，逐步进入参数化、隔离、配置、插件、并行、报告与项目实战。
cover: /img/picgo-images/pytest-course-cover.png
series: Pytest
series_order: 1
published: true
abbrlink: 6d7c0bc1
date: 2026-08-26 09:00:00
---

{% course_series %}

{% note info flat %}
这是一套从零到可维护测试套件的 Pytest 课程。它保留旧笔记中的 Fixture、参数化、Mock、Allure、Hook 与常见问题主线，同时把执行生命周期、收集选择、资源隔离、并行稳定性和报告证据补成一条可实践的依赖链。
{% endnote %}

![Pytest 测试课程封面](/img/picgo-images/pytest-course-cover.png "Pytest 测试课程封面")

## 课程目标

{% note primary flat %}
完成核心文章后，你能够从测试意图出发，建立可运行、可定位、可隔离、可并行和可交付的 Pytest 套件；你会知道每个失败属于收集、执行、资源、环境还是报告证据问题，并能用实验结果解释判断。
{% endnote %}

## 前置条件

{% note info flat %}
- 需要能读写基础 Python、使用终端并理解函数、异常和模块导入；缺口会在首篇正式文章的最小实验中补齐。
- 需要准备 Python 3.10 及以上的隔离环境；课程示例以当前稳定的 Pytest 9.x 行为为基线，外部插件只在对应文章的受控范围内引入。
- 不要求已有测试框架经验，但要保留每次实验的命令、退出码、收集数量和报告产物，便于复盘。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[测试基础与执行模型] --> B[测试收集与运行控制]
  B --> C[断言与结果诊断]
  B --> D[Fixture 与资源生命周期]
  C --> E[参数化与用例建模]
  D --> E
  C --> F[隔离环境与测试替身]
  D --> F
  E --> G[配置与套件组织]
  F --> G
  G --> H[插件与 Hook 扩展]
  H --> I[并行执行与稳定性]
  I --> J[覆盖率与测试报告]
  J --> K[项目实战]
  E --> L[进阶路线]
  G --> L
  H --> L
{% endmermaid %}

{% note success flat %}
主线按“运行模型 → 选择范围 → 失败证据 → 资源与数据 → 隔离与配置 → 扩展 → 稳定性与报告 → 实战”推进；进阶路线在需要自定义收集、插件测试或迁移低层 API 时选学，不阻塞项目实战。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Pytest(一)入门路线 | 课程范围、前置和开始方式 | 无 | 入口 |
| 2 | [Pytest(二)测试基础与执行模型](/posts/9d696b94/) | 从意图到退出状态的运行心智模型 | 1 | 已完成 |
| 3 | [Pytest(三)测试收集与运行控制](/posts/b5dda780/) | 收集树、Node ID 与精确选择 | 2 | 已完成 |
| 4 | [Pytest(四)断言与结果诊断](/posts/ac715911/) | 将失败还原为可定位证据 | 2、3 | 已完成 |
| 5 | Pytest(五)Fixture 与资源生命周期 | 依赖、作用域、缓存与清理 | 2、3 | 未开始 |
| 6 | Pytest(六)参数化与用例建模 | 选择参数化、Fixture 参数和 subtests | 3、5 | 未开始 |
| 7 | Pytest(七)隔离环境与测试替身 | 正确替换协作者并避免泄漏 | 4、5 | 未开始 |
| 8 | Pytest(八)配置与套件组织 | 配置解析、导入和 conftest 边界 | 3、5、7 | 未开始 |
| 9 | Pytest(九)插件与 Hook 扩展 | 以插件与 Hook 扩展运行过程 | 3、5、8 | 未开始 |
| 10 | Pytest(十)并行执行与稳定性 | 多进程下的隔离和 flaky 诊断 | 5、6、8、9 | 未开始 |
| 11 | Pytest(十一)覆盖率与测试报告 | 组织可追溯且不泄密的质量证据 | 4、8、10 | 未开始 |
| 12 | Pytest(十二)进阶路线 | 进入自定义收集和插件测试 | 6、8、9、11 | 未开始 |
| 13 | Pytest(十三)项目实战 | 交付订单模块的完整测试套件 | 2–11 | 未开始 |

## 开始学习

{% note info flat %}
先完成版本和实验目录检查，再进入第二篇的首个测试实验；每次只记录相对路径、命令、退出码、收集数量和关键报告，不把本机绝对路径写入课程材料。
{% endnote %}

```bash
python --version
python -c "from pathlib import Path; Path('.pytest-lab').mkdir(exist_ok=True)"
```

{% note warning flat %}
入口篇不预先安装项目依赖，也不把旧笔记中的私有补丁当作当前做法；正式安装和版本锁定在执行模型文章中完成，并通过实验结果确认。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link pytest Getting Started, https://docs.pytest.org/en/stable/getting-started.html, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

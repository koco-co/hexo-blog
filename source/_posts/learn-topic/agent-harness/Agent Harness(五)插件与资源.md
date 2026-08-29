---
title: Agent Harness(五)插件与资源
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能证明初始化失败仍会执行释放，且资源所有权明确。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 5
published: true
abbrlink: 36d0b733
date: 2026-07-26 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：管理插件、资源、监听器和后台任务的加载、卸载与清理。 最终要留下：能证明初始化失败仍会执行释放，且资源所有权明确。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 插件加载

{% note primary flat %}
插件和资源的所有权决定清理顺序：初始化部分成功时，已创建的监听器、任务和句柄都要可回收。 在“插件加载”这一环节负责定义：先固定load，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| load | 清单与依赖 | 加载顺序 | 不能静默跳过 |
| owner | 连接、监听器、后台任务 | 归属明确 | 不能泄漏到全局 |
| cleanup | 反向释放 | 失败也执行 | 不能只清成功路径 |
| 定义边界 | 插件加载 | 模拟插件加载成功、部分失败、卸载和后台任务泄漏，统计剩余资源。 | 初始化失败不是“没有资源”；清理路径必须在异常和取消中运行。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[load]
  F --> A[插件加载]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「load」设为「清单与依赖」，同时固定「owner」为「连接、监听器、后台任务」；记录输入、状态和结果，记录加载顺序。
- 只改变「cleanup」：正常值用「反向释放」，越界或故障按“不能只清成功路径”构造；观察归属明确，不要改动其余输入。
- 用失败也执行检查“插件加载”：模拟插件加载成功、部分失败、卸载和后台任务泄漏，统计剩余资源；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：初始化失败不是“没有资源”；清理路径必须在异常和取消中运行。 模拟加载成功、部分失败、卸载和后台任务泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 资源所有权

{% note info flat %}
插件和资源的所有权决定清理顺序：初始化部分成功时，已创建的监听器、任务和句柄都要可回收。 在“资源所有权”这一环节负责执行：先固定owner，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：资源所有权**
1. 入口：owner=连接、监听器、后台任务，先记录归属明确。
2. 转移：由cleanup=反向释放进入资源所有权，只允许声明的动作。
3. 出口：用加载顺序检查load，越界条件是“不能静默跳过”。
{% endnote %}

- 执行正常路径：把「owner」设为「连接、监听器、后台任务」，同时固定「cleanup」为「反向释放」；记录输入、状态和结果，记录归属明确。
- 只改变「load」：正常值用「清单与依赖」，越界或故障按“不能静默跳过”构造；观察失败也执行，不要改动其余输入。
- 用加载顺序检查“资源所有权”：模拟插件加载成功、部分失败、卸载和后台任务泄漏，统计剩余资源；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：初始化失败不是“没有资源”；清理路径必须在异常和取消中运行。 模拟加载成功、部分失败、卸载和后台任务泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 监听器

{% note info flat %}
插件和资源的所有权决定清理顺序：初始化部分成功时，已创建的监听器、任务和句柄都要可回收。 在“监听器”这一环节负责故障：先固定cleanup，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：反向释放 | cleanup | 失败也执行 | 不能只清成功路径 |
| 边界：清单与依赖 | load | 加载顺序 | 不能静默跳过 |
| 故障：连接、监听器、后台任务 | owner | 归属明确 | 不能泄漏到全局 |

- 注入边界：把「cleanup」设为「反向释放」，同时固定「load」为「清单与依赖」；记录输入、状态和结果，记录失败也执行。
- 只改变「owner」：正常值用「连接、监听器、后台任务」，越界或故障按“不能泄漏到全局”构造；观察加载顺序，不要改动其余输入。
- 用归属明确检查“监听器”：模拟插件加载成功、部分失败、卸载和后台任务泄漏，统计剩余资源；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：初始化失败不是“没有资源”；清理路径必须在异常和取消中运行。 模拟加载成功、部分失败、卸载和后台任务泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 清理路径

{% note info flat %}
插件和资源的所有权决定清理顺序：初始化部分成功时，已创建的监听器、任务和句柄都要可回收。 在“清理路径”这一环节负责复核：先固定load，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（清理路径）：输入为「清单与依赖」；状态观察为「归属明确」；独立判定使用「失败也执行」。记录模拟插件加载成功、部分失败、卸载和后台任务泄漏，统计剩余资源，把“初始化失败不是“没有资源”；清理路径必须在异常和取消中运行。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：模拟插件加载成功、部分失败、卸载和后台任务泄漏，统计剩余资源。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
resources=["listener","task","handle"]
load_failed=True
released=[]
while resources: released.append(resources.pop())
print({"load_failed":load_failed,"released":released,"leaks":len(resources)})
assert load_failed and not resources
# 预期观察：模拟插件加载成功、部分失败、卸载和后台任务泄漏，统计剩余资源。
```

{% note success flat %}
失败边界：初始化失败不是“没有资源”；清理路径必须在异常和取消中运行。 模拟加载成功、部分失败、卸载和后台任务泄漏。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d05-init-failure-cleanup deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
当“初始化失败清理”出现时，先检查哪个状态和边界？
--- answer
先把“初始化失败清理”绑定到load与owner；正常、越界和 Unknown 各运行一次，断言失败也执行。
--- explanation
在cleanup夹具中，比较清单与依赖与连接、监听器、后台任务，保留失败也执行；初始化失败不是“没有资源”；清理路径必须在异常和取消中运行。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link LangGraph persistence, https://langchain-ai.github.io/langgraph/concepts/persistence/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link Python asyncio documentation, https://docs.python.org/3/library/asyncio.html, https://docs.python.org/3/_static/py.svg %}
{% endlinkgroup %}

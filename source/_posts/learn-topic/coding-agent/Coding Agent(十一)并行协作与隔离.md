---
title: Coding Agent(十一)并行协作与隔离
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能设计两名 Agent 的隔离协作表，并判断完成不等于验收。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 11
published: true
abbrlink: 545070e
date: 2026-07-15 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：安排文件所有权、worktree、端口和汇合条件，避免并行工作互相污染。 最终要留下：能设计两名 Agent 的隔离协作表，并判断完成不等于验收。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 所有权表

{% note primary flat %}
并行协作的核心是文件所有权、worktree、端口和汇合条件；Agent 完成自己的分支不等于主线可验收。 在“所有权表”这一环节负责定义：先固定owner，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| owner | 文件与目录 | 冲突预警 | 不能多人随意写 |
| isolation | worktree、端口 | 互不污染 | 不能把进程隔离想当然 |
| merge | diff、测试、顺序 | 可回滚 | 不能自动合并全部 |
| 定义边界 | 所有权表 | 用两名 Fake Agent 分别改两个文件并占不同端口，汇合前检查 status、diff 和测试。 | 隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[owner]
  F --> A[所有权表]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「owner」设为「文件与目录」，同时固定「isolation」为「worktree、端口」；记录输入、状态和结果，记录冲突预警。
- 只改变「merge」：正常值用「diff、测试、顺序」，越界或故障按“不能自动合并全部”构造；观察互不污染，不要改动其余输入。
- 用可回滚检查“所有权表”：用两名 Fake Agent 分别改两个文件并占不同端口，汇合前检查 status、diff 和测试；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。 模拟两项独立修复、一个共享接口和一个冲突文件，记录合并前后证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 隔离环境

{% note info flat %}
并行协作的核心是文件所有权、worktree、端口和汇合条件；Agent 完成自己的分支不等于主线可验收。 在“隔离环境”这一环节负责执行：先固定isolation，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：隔离环境**
1. 入口：isolation=worktree、端口，先记录互不污染。
2. 转移：由merge=diff、测试、顺序进入隔离环境，只允许声明的动作。
3. 出口：用冲突预警检查owner，越界条件是“不能多人随意写”。
{% endnote %}

- 执行正常路径：把「isolation」设为「worktree、端口」，同时固定「merge」为「diff、测试、顺序」；记录输入、状态和结果，记录互不污染。
- 只改变「owner」：正常值用「文件与目录」，越界或故障按“不能多人随意写”构造；观察可回滚，不要改动其余输入。
- 用冲突预警检查“隔离环境”：用两名 Fake Agent 分别改两个文件并占不同端口，汇合前检查 status、diff 和测试；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。 模拟两项独立修复、一个共享接口和一个冲突文件，记录合并前后证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 端口规划

{% note info flat %}
并行协作的核心是文件所有权、worktree、端口和汇合条件；Agent 完成自己的分支不等于主线可验收。 在“端口规划”这一环节负责故障：先固定merge，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：diff、测试、顺序 | merge | 可回滚 | 不能自动合并全部 |
| 边界：文件与目录 | owner | 冲突预警 | 不能多人随意写 |
| 故障：worktree、端口 | isolation | 互不污染 | 不能把进程隔离想当然 |

- 注入边界：把「merge」设为「diff、测试、顺序」，同时固定「owner」为「文件与目录」；记录输入、状态和结果，记录可回滚。
- 只改变「isolation」：正常值用「worktree、端口」，越界或故障按“不能把进程隔离想当然”构造；观察冲突预警，不要改动其余输入。
- 用互不污染检查“端口规划”：用两名 Fake Agent 分别改两个文件并占不同端口，汇合前检查 status、diff 和测试；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。 模拟两项独立修复、一个共享接口和一个冲突文件，记录合并前后证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 汇合验收

{% note info flat %}
并行协作的核心是文件所有权、worktree、端口和汇合条件；Agent 完成自己的分支不等于主线可验收。 在“汇合验收”这一环节负责复核：先固定owner，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（汇合验收）：输入为「文件与目录」；状态观察为「互不污染」；独立判定使用「可回滚」。记录用两名 Fake Agent 分别改两个文件并占不同端口，汇合前检查 status、diff 和测试，把“隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：用两名 Fake Agent 分别改两个文件并占不同端口，汇合前检查 status、diff 和测试。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
owners={"a":"src/a.py","b":"src/b.py"}
ports={"a":4011,"b":4012}
conflict=owners["a"]==owners["b"] or ports["a"]==ports["b"]
print({"conflict":conflict})
assert not conflict
# 预期观察：用两名 Fake Agent 分别改两个文件并占不同端口，汇合前检查 status、diff 和测试。
```

{% note success flat %}
失败边界：隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。 模拟两项独立修复、一个共享接口和一个冲突文件，记录合并前后证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b11-worktree-is-not-process-isolation deck:"Coding Agent" priority:1 tags:"Coding Agent,测试开发" %}
--- question
“汇合验收”的课程边界中，为什么“工作树”不是“进程隔离”？
--- answer
工作树只提供冲突预警；进程隔离还需要在isolation上由可回滚确认，不能只看文本或单个事件。
--- explanation
在parallel夹具中分别运行“工作树”和“进程隔离”，比较文件与目录与worktree、端口；隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。
{% endflashcard %}

{% flashcard basic id:b11-done-is-not-accepted deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
“汇合验收”的课程边界中，为什么“完成”不是“已验收”？
--- answer
完成只提供冲突预警；已验收还需要在isolation上由可回滚确认，不能只看文本或单个事件。
--- explanation
在parallel夹具中分别运行“完成”和“已验收”，比较文件与目录与worktree、端口；隔离目录不能保证数据库、网络或共享缓存隔离；汇合后仍需干净重跑。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Git worktree documentation, https://git-scm.com/docs/git-worktree, https://git-scm.com/favicon.ico %}
{% link Claude Code documentation, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}
{% endlinkgroup %}

---
title: Coding Agent(三)代码定位与追踪
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能产出带证据的代码定位记录和最小影响范围。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 3
published: false
abbrlink: ea9d1c25
date: 2026-07-11 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：从重复缺陷描述追踪到路由、业务、数据和测试夹具，而不是直接猜文件。 最终要留下：能产出带证据的代码定位记录和最小影响范围。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 问题定位

{% note primary flat %}
缺陷定位要沿 route→业务→数据→测试夹具追踪，把自然语言症状转换为最小责任范围。 在“问题定位”这一环节负责定义：先固定route，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| route | 入口与参数 | 请求可重现 | 不能只搜报错词 |
| business | 分支与状态 | 首个偏差 | 不能跳过规则 |
| fixture | 数据与断言 | 回归范围 | 不能猜测试名称 |
| 定义边界 | 问题定位 | 对重复工单保留搜索词、命中文件、调用链和 fixture 证据，再决定改动点。 | 搜索命中不是根因；若调用链或数据条件缺失，应标记未知而非直接补丁。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[route]
  F --> A[问题定位]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「route」设为「入口与参数」，同时固定「business」为「分支与状态」；记录输入、状态和结果，记录请求可重现。
- 只改变「fixture」：正常值用「数据与断言」，越界或故障按“不能猜测试名称”构造；观察首个偏差，不要改动其余输入。
- 用回归范围检查“问题定位”：对重复工单保留搜索词、命中文件、调用链和 fixture 证据，再决定改动点；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：搜索命中不是根因；若调用链或数据条件缺失，应标记未知而非直接补丁。 对重复工单执行 route→business→DB→fixture 追踪，保留搜索与读取证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 调用链

{% note info flat %}
缺陷定位要沿 route→业务→数据→测试夹具追踪，把自然语言症状转换为最小责任范围。 在“调用链”这一环节负责执行：先固定business，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：调用链**
1. 入口：business=分支与状态，先记录首个偏差。
2. 转移：由fixture=数据与断言进入调用链，只允许声明的动作。
3. 出口：用请求可重现检查route，越界条件是“不能只搜报错词”。
{% endnote %}

- 执行正常路径：把「business」设为「分支与状态」，同时固定「fixture」为「数据与断言」；记录输入、状态和结果，记录首个偏差。
- 只改变「route」：正常值用「入口与参数」，越界或故障按“不能只搜报错词”构造；观察回归范围，不要改动其余输入。
- 用请求可重现检查“调用链”：对重复工单保留搜索词、命中文件、调用链和 fixture 证据，再决定改动点；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：搜索命中不是根因；若调用链或数据条件缺失，应标记未知而非直接补丁。 对重复工单执行 route→business→DB→fixture 追踪，保留搜索与读取证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 数据夹具

{% note info flat %}
缺陷定位要沿 route→业务→数据→测试夹具追踪，把自然语言症状转换为最小责任范围。 在“数据夹具”这一环节负责故障：先固定fixture，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：数据与断言 | fixture | 回归范围 | 不能猜测试名称 |
| 边界：入口与参数 | route | 请求可重现 | 不能只搜报错词 |
| 故障：分支与状态 | business | 首个偏差 | 不能跳过规则 |

- 注入边界：把「fixture」设为「数据与断言」，同时固定「route」为「入口与参数」；记录输入、状态和结果，记录回归范围。
- 只改变「business」：正常值用「分支与状态」，越界或故障按“不能跳过规则”构造；观察请求可重现，不要改动其余输入。
- 用首个偏差检查“数据夹具”：对重复工单保留搜索词、命中文件、调用链和 fixture 证据，再决定改动点；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：搜索命中不是根因；若调用链或数据条件缺失，应标记未知而非直接补丁。 对重复工单执行 route→business→DB→fixture 追踪，保留搜索与读取证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 影响范围

{% note info flat %}
缺陷定位要沿 route→业务→数据→测试夹具追踪，把自然语言症状转换为最小责任范围。 在“影响范围”这一环节负责复核：先固定route，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（影响范围）：输入为「入口与参数」；状态观察为「首个偏差」；独立判定使用「回归范围」。记录对重复工单保留搜索词、命中文件、调用链和 fixture 证据，再决定改动点，把“搜索命中不是根因；若调用链或数据条件缺失，应标记未知而非直接补丁。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：对重复工单保留搜索词、命中文件、调用链和 fixture 证据，再决定改动点。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
search="T-17"
spans=[{"name":"route","ok":True},{"name":"service","ok":False,"error":"bad state"},{"name":"db","ok":False}]
fixture={"ticket":search,"version":1}
first=next(s for s in spans if not s["ok"])
print({"search":search,"fixture":fixture,"first_divergence":first["name"],"error":first["error"]})
assert first["name"]=="service"
# 预期观察：对重复工单保留搜索词、命中文件、调用链和 fixture 证据，再决定改动点。
```

{% note success flat %}
失败边界：搜索命中不是根因；若调用链或数据条件缺失，应标记未知而非直接补丁。 对重复工单执行 route→business→DB→fixture 追踪，保留搜索与读取证据。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link Git worktree documentation, https://git-scm.com/docs/git-worktree, https://git-scm.com/favicon.ico %}
{% link Claude Code documentation, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}
{% endlinkgroup %}

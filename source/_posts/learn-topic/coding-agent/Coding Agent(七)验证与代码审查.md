---
title: Coding Agent(七)验证与代码审查
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能执行测试、读取 diff、复查失败路径并写出证据链。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 7
published: true
abbrlink: 4e9edd64
date: 2026-07-13 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：建立独立重跑、差异审查和证据分层，避免把本地绿灯当业务正确。 最终要留下：能执行测试、读取 diff、复查失败路径并写出证据链。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 独立重跑

{% note primary flat %}
验证需要独立重跑、差异审查和分层证据：本地绿灯、Reviewer 意见、浏览器行为和线上结果回答不同问题。 在“独立重跑”这一环节负责定义：先固定rerun，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| rerun | 干净环境 | 重复结果 | 不能只复用缓存 |
| diff | 源代码与测试 | 责任清楚 | 不能只看日志 |
| evidence | 测试/页面/部署 | 层级标注 | 不能混为通过 |
| 定义边界 | 独立重跑 | 在清洁夹具中重跑测试，读取 diff，补一个失败路径，再把每层证据写成记录。 | 本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[rerun]
  F --> A[独立重跑]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「rerun」设为「干净环境」，同时固定「diff」为「源代码与测试」；记录输入、状态和结果，记录重复结果。
- 只改变「evidence」：正常值用「测试/页面/部署」，越界或故障按“不能混为通过”构造；观察责任清楚，不要改动其余输入。
- 用层级标注检查“独立重跑”：在清洁夹具中重跑测试，读取 diff，补一个失败路径，再把每层证据写成记录；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。 分别验证本地测试、静态差异和业务断言，注入一个隐藏回归。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## diff审查

{% note info flat %}
验证需要独立重跑、差异审查和分层证据：本地绿灯、Reviewer 意见、浏览器行为和线上结果回答不同问题。 在“diff审查”这一环节负责执行：先固定diff，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：diff审查**
1. 入口：diff=源代码与测试，先记录责任清楚。
2. 转移：由evidence=测试/页面/部署进入diff审查，只允许声明的动作。
3. 出口：用重复结果检查rerun，越界条件是“不能只复用缓存”。
{% endnote %}

- 执行正常路径：把「diff」设为「源代码与测试」，同时固定「evidence」为「测试/页面/部署」；记录输入、状态和结果，记录责任清楚。
- 只改变「rerun」：正常值用「干净环境」，越界或故障按“不能只复用缓存”构造；观察层级标注，不要改动其余输入。
- 用重复结果检查“diff审查”：在清洁夹具中重跑测试，读取 diff，补一个失败路径，再把每层证据写成记录；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。 分别验证本地测试、静态差异和业务断言，注入一个隐藏回归。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 证据分层

{% note info flat %}
验证需要独立重跑、差异审查和分层证据：本地绿灯、Reviewer 意见、浏览器行为和线上结果回答不同问题。 在“证据分层”这一环节负责故障：先固定evidence，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：测试/页面/部署 | evidence | 层级标注 | 不能混为通过 |
| 边界：干净环境 | rerun | 重复结果 | 不能只复用缓存 |
| 故障：源代码与测试 | diff | 责任清楚 | 不能只看日志 |

- 注入边界：把「evidence」设为「测试/页面/部署」，同时固定「rerun」为「干净环境」；记录输入、状态和结果，记录层级标注。
- 只改变「diff」：正常值用「源代码与测试」，越界或故障按“不能只看日志”构造；观察重复结果，不要改动其余输入。
- 用责任清楚检查“证据分层”：在清洁夹具中重跑测试，读取 diff，补一个失败路径，再把每层证据写成记录；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。 分别验证本地测试、静态差异和业务断言，注入一个隐藏回归。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 失败复盘

{% note info flat %}
验证需要独立重跑、差异审查和分层证据：本地绿灯、Reviewer 意见、浏览器行为和线上结果回答不同问题。 在“失败复盘”这一环节负责复核：先固定rerun，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（失败复盘）：输入为「干净环境」；状态观察为「责任清楚」；独立判定使用「层级标注」。记录在清洁夹具中重跑测试，读取 diff，补一个失败路径，再把每层证据写成记录，把“本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：在清洁夹具中重跑测试，读取 diff，补一个失败路径，再把每层证据写成记录。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
evidence={"test":"pass","diff":"reviewed","browser":"not-run"}
print(evidence)
assert evidence["test"]=="pass"
# 预期观察：在清洁夹具中重跑测试，读取 diff，补一个失败路径，再把每层证据写成记录。
```

{% note success flat %}
失败边界：本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。 分别验证本地测试、静态差异和业务断言，注入一个隐藏回归。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b07-local-pass-is-not-online deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
“失败复盘”的课程边界中，为什么“本地通过”不是“在线”？
--- answer
本地通过只提供重复结果；在线还需要在diff上由层级标注确认，不能只看文本或单个事件。
--- explanation
在evidence夹具中分别运行“本地通过”和“在线”，比较干净环境与源代码与测试；本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。
{% endflashcard %}

{% flashcard basic id:b07-review-is-not-runtime deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
“失败复盘”的课程边界中，为什么“审查”不是“运行时”？
--- answer
审查只提供重复结果；运行时还需要在diff上由层级标注确认，不能只看文本或单个事件。
--- explanation
在evidence夹具中分别运行“审查”和“运行时”，比较干净环境与源代码与测试；本地通过不等于线上正确；缺少浏览器或客户端证据时必须明确未验证。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Git worktree documentation, https://git-scm.com/docs/git-worktree, https://git-scm.com/favicon.ico %}
{% link Claude Code documentation, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}
{% endlinkgroup %}

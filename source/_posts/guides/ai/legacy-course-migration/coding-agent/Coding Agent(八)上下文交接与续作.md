---
title: Coding Agent(八)上下文交接与续作
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能在新会话或新 Agent 中恢复工作，而不是只复制一句摘要。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 8
published: false
abbrlink: 7ee534c5
date: 2026-07-13 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把任务摘要、事实证据、未决风险和环境重查写成交接包。 最终要留下：能在新会话或新 Agent 中恢复工作，而不是只复制一句摘要。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 交接字段

{% note primary flat %}
交接包要让新会话恢复事实而不是复制一句摘要，包含环境、已做动作、证据、未知项和下一步。 在“交接字段”这一环节负责定义：先固定fact，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| fact | 版本、分支、状态 | 可核查 | 不能写猜测 |
| evidence | 命令与输出 | 定位文件 | 不能只写结论 |
| open | 风险与下一步 | 可继续 | 不能隐藏阻塞 |
| 定义边界 | 交接字段 | 生成一份 JSON 交接包，重新探测 cwd、git status 和端口后再执行下一步。 | 摘要过期、环境变化或证据缺失时要重新探测，不得沿用旧状态。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[fact]
  F --> A[交接字段]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「fact」设为「版本、分支、状态」，同时固定「evidence」为「命令与输出」；记录输入、状态和结果，记录可核查。
- 只改变「open」：正常值用「风险与下一步」，越界或故障按“不能隐藏阻塞”构造；观察定位文件，不要改动其余输入。
- 用可继续检查“交接字段”：生成一份 JSON 交接包，重新探测 cwd、git status 和端口后再执行下一步；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：摘要过期、环境变化或证据缺失时要重新探测，不得沿用旧状态。 中断后交接合成任务，重新检查 cwd、版本、dirty 状态和未完成步骤。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 事实链接

{% note info flat %}
交接包要让新会话恢复事实而不是复制一句摘要，包含环境、已做动作、证据、未知项和下一步。 在“事实链接”这一环节负责执行：先固定evidence，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：事实链接**
1. 入口：evidence=命令与输出，先记录定位文件。
2. 转移：由open=风险与下一步进入事实链接，只允许声明的动作。
3. 出口：用可核查检查fact，越界条件是“不能写猜测”。
{% endnote %}

- 执行正常路径：把「evidence」设为「命令与输出」，同时固定「open」为「风险与下一步」；记录输入、状态和结果，记录定位文件。
- 只改变「fact」：正常值用「版本、分支、状态」，越界或故障按“不能写猜测”构造；观察可继续，不要改动其余输入。
- 用可核查检查“事实链接”：生成一份 JSON 交接包，重新探测 cwd、git status 和端口后再执行下一步；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：摘要过期、环境变化或证据缺失时要重新探测，不得沿用旧状态。 中断后交接合成任务，重新检查 cwd、版本、dirty 状态和未完成步骤。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 环境重查

{% note info flat %}
交接包要让新会话恢复事实而不是复制一句摘要，包含环境、已做动作、证据、未知项和下一步。 在“环境重查”这一环节负责故障：先固定open，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：风险与下一步 | open | 可继续 | 不能隐藏阻塞 |
| 边界：版本、分支、状态 | fact | 可核查 | 不能写猜测 |
| 故障：命令与输出 | evidence | 定位文件 | 不能只写结论 |

- 注入边界：把「open」设为「风险与下一步」，同时固定「fact」为「版本、分支、状态」；记录输入、状态和结果，记录可继续。
- 只改变「evidence」：正常值用「命令与输出」，越界或故障按“不能只写结论”构造；观察可核查，不要改动其余输入。
- 用定位文件检查“环境重查”：生成一份 JSON 交接包，重新探测 cwd、git status 和端口后再执行下一步；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：摘要过期、环境变化或证据缺失时要重新探测，不得沿用旧状态。 中断后交接合成任务，重新检查 cwd、版本、dirty 状态和未完成步骤。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 续作边界

{% note info flat %}
交接包要让新会话恢复事实而不是复制一句摘要，包含环境、已做动作、证据、未知项和下一步。 在“续作边界”这一环节负责复核：先固定fact，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（续作边界）：输入为「版本、分支、状态」；状态观察为「定位文件」；独立判定使用「可继续」。记录生成一份 JSON 交接包，重新探测 cwd、git status 和端口后再执行下一步，把“摘要过期、环境变化或证据缺失时要重新探测，不得沿用旧状态。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：生成一份 JSON 交接包，重新探测 cwd、git status 和端口后再执行下一步。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
handoff={"facts":["branch=main","fixture=v1"],"unknown":["online latency"],"next":["rerun clean"]}
assert handoff["facts"] and handoff["next"]
print(handoff)
# 预期观察：生成一份 JSON 交接包，重新探测 cwd、git status 和端口后再执行下一步。
```

{% note success flat %}
失败边界：摘要过期、环境变化或证据缺失时要重新探测，不得沿用旧状态。 中断后交接合成任务，重新检查 cwd、版本、dirty 状态和未完成步骤。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b08-summary-is-not-fact deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
“续作边界”的课程边界中，为什么“摘要”不是“事实”？
--- answer
摘要只提供可核查；事实还需要在evidence上由可继续确认，不能只看文本或单个事件。
--- explanation
在handoff夹具中分别运行“摘要”和“事实”，比较版本、分支、状态与命令与输出；摘要过期、环境变化或证据缺失时要重新探测，不得沿用旧状态。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Claude Code documentation, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}
{% link GitHub Copilot documentation, https://docs.github.com/en/copilot, https://github.com/favicon.ico %}
{% endlinkgroup %}

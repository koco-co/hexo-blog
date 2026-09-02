---
title: Coding Agent(十三)项目实战
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 交付一份可复跑的修复证据包，包含工作区边界、计划、diff、测试和交接。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 13
published: false
abbrlink: 4ad3f683
date: 2026-07-16 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：完成从重复工单到补丁、测试、审查、CI 和交接的 Coding Agent 闭环。 最终要留下：交付一份可复跑的修复证据包，包含工作区边界、计划、diff、测试和交接。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 项目范围

{% note primary flat %}
项目闭环从重复工单开始，经过边界探测、任务计划、最小补丁、测试、审查、CI 和交接，所有步骤都可回放。 在“项目范围”这一环节负责定义：先固定intake，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| intake | 工单与环境 | 责任范围 | 不能直接猜文件 |
| change | 补丁与回归 | diff 可审查 | 不能改测试造绿 |
| delivery | CI 与交接 | 证据齐全 | 不能只报完成 |
| 定义边界 | 项目范围 | 在合成仓库完成一次安全修复并输出计划、diff、测试、CI JSONL 和交接包。 | 项目结果以干净重跑和证据包为准；远程部署未在本夹具中证明。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[intake]
  F --> A[项目范围]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「intake」设为「工单与环境」，同时固定「change」为「补丁与回归」；串联阶段并统计副作用，记录责任范围。
- 只改变「delivery」：正常值用「CI 与交接」，越界或故障按“不能只报完成”构造；观察diff 可审查，不要改动其余输入。
- 用证据齐全检查“项目范围”：在合成仓库完成一次安全修复并输出计划、diff、测试、CI JSONL 和交接包；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目结果以干净重跑和证据包为准；远程部署未在本夹具中证明。 使用合成仓库和隐藏回归，完成一次安全修复并输出审查记录。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 协作执行

{% note info flat %}
项目闭环从重复工单开始，经过边界探测、任务计划、最小补丁、测试、审查、CI 和交接，所有步骤都可回放。 在“协作执行”这一环节负责执行：先固定change，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：协作执行**
1. 入口：change=补丁与回归，先记录diff 可审查。
2. 转移：由delivery=CI 与交接进入协作执行，只允许声明的动作。
3. 出口：用责任范围检查intake，越界条件是“不能直接猜文件”。
{% endnote %}

- 执行正常路径：把「change」设为「补丁与回归」，同时固定「delivery」为「CI 与交接」；串联阶段并统计副作用，记录diff 可审查。
- 只改变「intake」：正常值用「工单与环境」，越界或故障按“不能直接猜文件”构造；观察证据齐全，不要改动其余输入。
- 用责任范围检查“协作执行”：在合成仓库完成一次安全修复并输出计划、diff、测试、CI JSONL 和交接包；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目结果以干净重跑和证据包为准；远程部署未在本夹具中证明。 使用合成仓库和隐藏回归，完成一次安全修复并输出审查记录。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果证据

{% note info flat %}
项目闭环从重复工单开始，经过边界探测、任务计划、最小补丁、测试、审查、CI 和交接，所有步骤都可回放。 在“结果证据”这一环节负责故障：先固定delivery，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：CI 与交接 | delivery | 证据齐全 | 不能只报完成 |
| 边界：工单与环境 | intake | 责任范围 | 不能直接猜文件 |
| 故障：补丁与回归 | change | diff 可审查 | 不能改测试造绿 |

- 注入边界：把「delivery」设为「CI 与交接」，同时固定「intake」为「工单与环境」；串联阶段并统计副作用，记录证据齐全。
- 只改变「change」：正常值用「补丁与回归」，越界或故障按“不能改测试造绿”构造；观察责任范围，不要改动其余输入。
- 用diff 可审查检查“结果证据”：在合成仓库完成一次安全修复并输出计划、diff、测试、CI JSONL 和交接包；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：项目结果以干净重跑和证据包为准；远程部署未在本夹具中证明。 使用合成仓库和隐藏回归，完成一次安全修复并输出审查记录。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 复盘

{% note info flat %}
项目闭环从重复工单开始，经过边界探测、任务计划、最小补丁、测试、审查、CI 和交接，所有步骤都可回放。 在“复盘”这一环节负责复核：先固定intake，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（复盘）：输入为「工单与环境」；状态观察为「diff 可审查」；独立判定使用「证据齐全」。记录在合成仓库完成一次安全修复并输出计划、diff、测试、CI JSONL 和交接包，把“项目结果以干净重跑和证据包为准；远程部署未在本夹具中证明。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：在合成仓库完成一次安全修复并输出计划、diff、测试、CI JSONL 和交接包。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
files={"src/api.py":"old","tests/test_api.py":"stable",".github/workflow.yml":"stable"}
plan={"target":"src/api.py","reason":"auth boundary","tests":["tests/test_api.py"]}
diff={"src/api.py":"fixed"}
ci=[{"job":"test","status":"pass"},{"job":"review","status":"pass"}]
handoff={"diff":diff,"ci":ci,"next":"clean rerun"}
print({"planned":plan,"changed":list(diff),"ci_gate":all(j["status"]=="pass" for j in ci),"handoff":handoff["next"]})
assert list(diff)==["src/api.py"] and all(j["status"]=="pass" for j in ci)
# 预期观察：在合成仓库完成一次安全修复并输出计划、diff、测试、CI JSONL 和交接包。
```

{% note success flat %}
失败边界：项目结果以干净重跑和证据包为准；远程部署未在本夹具中证明。 使用合成仓库和隐藏回归，完成一次安全修复并输出审查记录。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard_ref id="b07-local-pass-is-not-online" %}

{% flashcard_ref id="b08-summary-is-not-fact" %}

## 参考资料

{% linkgroup %}
{% link GitHub Copilot documentation, https://docs.github.com/en/copilot, https://github.com/favicon.ico %}
{% link OpenAI Codex documentation, https://developers.openai.com/codex, https://developers.openai.com/favicon.ico %}
{% endlinkgroup %}

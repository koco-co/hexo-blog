---
title: Coding Agent(十二)CI自动化
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能区分 stdout JSONL、stderr 进度、退出码和缺失证据。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 12
published: true
abbrlink: 15664d55
date: 2026-07-15 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：把 Coding Agent 的结果接入可解析、可追溯、有证据要求的 CI。 最终要留下：能区分 stdout JSONL、stderr 进度、退出码和缺失证据。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 作业边界

{% note primary flat %}
CI 需要把 Agent 输出变成可解析、可追溯的证据流：stdout JSONL、stderr 进度、退出码和 artifact 各有角色。 在“作业边界”这一环节负责定义：先固定stdout，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| stdout | 一行一条 JSON | 机器解析 | 不能混进进度 |
| stderr | 进度与诊断 | 人类阅读 | 不能当结果 |
| artifact | diff、报告、日志 | 来源可追溯 | 不能只凭 exit 0 |
| 定义边界 | 作业边界 | Fake CI 分开生成和验证作业，分别注入模型不可用、执行失败和产物缺失。 | 退出码 0 只表示进程约定的结束状态；缺证据应阻断发布。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[stdout]
  F --> A[作业边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「stdout」设为「一行一条 JSON」，同时固定「stderr」为「进度与诊断」；记录输入、状态和结果，记录机器解析。
- 只改变「artifact」：正常值用「diff、报告、日志」，越界或故障按“不能只凭 exit 0”构造；观察人类阅读，不要改动其余输入。
- 用来源可追溯检查“作业边界”：Fake CI 分开生成和验证作业，分别注入模型不可用、执行失败和产物缺失；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：退出码 0 只表示进程约定的结束状态；缺证据应阻断发布。 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 输出协议

{% note info flat %}
CI 需要把 Agent 输出变成可解析、可追溯的证据流：stdout JSONL、stderr 进度、退出码和 artifact 各有角色。 在“输出协议”这一环节负责执行：先固定stderr，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：输出协议**
1. 入口：stderr=进度与诊断，先记录人类阅读。
2. 转移：由artifact=diff、报告、日志进入输出协议，只允许声明的动作。
3. 出口：用机器解析检查stdout，越界条件是“不能混进进度”。
{% endnote %}

- 执行正常路径：把「stderr」设为「进度与诊断」，同时固定「artifact」为「diff、报告、日志」；记录输入、状态和结果，记录人类阅读。
- 只改变「stdout」：正常值用「一行一条 JSON」，越界或故障按“不能混进进度”构造；观察来源可追溯，不要改动其余输入。
- 用机器解析检查“输出协议”：Fake CI 分开生成和验证作业，分别注入模型不可用、执行失败和产物缺失；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：退出码 0 只表示进程约定的结束状态；缺证据应阻断发布。 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 失败门禁

{% note info flat %}
CI 需要把 Agent 输出变成可解析、可追溯的证据流：stdout JSONL、stderr 进度、退出码和 artifact 各有角色。 在“失败门禁”这一环节负责故障：先固定artifact，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：diff、报告、日志 | artifact | 来源可追溯 | 不能只凭 exit 0 |
| 边界：一行一条 JSON | stdout | 机器解析 | 不能混进进度 |
| 故障：进度与诊断 | stderr | 人类阅读 | 不能当结果 |

- 注入边界：把「artifact」设为「diff、报告、日志」，同时固定「stdout」为「一行一条 JSON」；记录输入、状态和结果，记录来源可追溯。
- 只改变「stderr」：正常值用「进度与诊断」，越界或故障按“不能当结果”构造；观察机器解析，不要改动其余输入。
- 用人类阅读检查“失败门禁”：Fake CI 分开生成和验证作业，分别注入模型不可用、执行失败和产物缺失；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：退出码 0 只表示进程约定的结束状态；缺证据应阻断发布。 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 证据产物

{% note info flat %}
CI 需要把 Agent 输出变成可解析、可追溯的证据流：stdout JSONL、stderr 进度、退出码和 artifact 各有角色。 在“证据产物”这一环节负责复核：先固定stdout，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（证据产物）：输入为「一行一条 JSON」；状态观察为「人类阅读」；独立判定使用「来源可追溯」。记录Fake CI 分开生成和验证作业，分别注入模型不可用、执行失败和产物缺失，把“退出码 0 只表示进程约定的结束状态；缺证据应阻断发布。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake CI 分开生成和验证作业，分别注入模型不可用、执行失败和产物缺失。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
jobs=[{"job":"generate","status":"candidate"},{"job":"verify","status":"pass"},{"job":"model-unavailable","status":"blocked"},{"job":"artifact-missing","status":"blocked"}]
artifacts={"diff":True,"report":True}
gate=all(x["status"]=="pass" for x in jobs if x["job"]=="verify") and all(artifacts.values())
print({"gate":gate,"blocked":sum(x["status"]=="blocked" for x in jobs),"artifacts":artifacts})
assert gate and sum(x["status"]=="blocked" for x in jobs)==2
# 预期观察：Fake CI 分开生成和验证作业，分别注入模型不可用、执行失败和产物缺失。
```

{% note success flat %}
失败边界：退出码 0 只表示进程约定的结束状态；缺证据应阻断发布。 用 Fake CI 输出成功、退出 0 无证据、JSON 损坏和测试失败四种结果。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b12-exit0-without-evidence deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
在ci夹具里，怎样区分“退出码 0 缺少证据”的通过与拒绝？
--- answer
先把“退出码 0 缺少证据”绑定到stdout与stderr；正常、越界和 Unknown 各运行一次，断言来源可追溯。
--- explanation
在ci夹具中，比较一行一条 JSON与进度与诊断，保留来源可追溯；退出码 0 只表示进程约定的结束状态；缺证据应阻断发布。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Claude Code documentation, https://docs.anthropic.com/en/docs/claude-code/overview, https://docs.anthropic.com/favicon.ico %}
{% link GitHub Copilot documentation, https://docs.github.com/en/copilot, https://github.com/favicon.ico %}
{% endlinkgroup %}

---
title: Agent 安全(二)威胁建模
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能为工单 Agent 写出资产清单、信任边界和风险排序。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 2
published: false
abbrlink: c3459386
date: 2026-08-09 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：以资产、边界、攻击者和风险为起点建模 Agent，而不是只列危险词。 最终要留下：能为工单 Agent 写出资产清单、信任边界和风险排序。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 资产边界

{% note primary flat %}
威胁建模从资产、信任边界和攻击者开始，再排序风险；危险词列表不能说明哪一条路径会产生损失。 在“资产边界”这一环节负责定义：先固定asset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| asset | 密钥、数据、写操作 | 资产清单 | 不能只列模型 |
| boundary | 用户/模型/工具/外部内容 | 跨界流 | 不能假设可信 |
| risk | 可能性×影响 | 优先级 | 不能只看 CVE |
| 定义边界 | 资产边界 | 为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险。 | 回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[asset]
  F --> A[资产边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「asset」设为「密钥、数据、写操作」，同时固定「boundary」为「用户/模型/工具/外部内容」；记录输入、状态和结果，记录资产清单。
- 只改变「risk」：正常值用「可能性×影响」，越界或故障按“不能只看 CVE”构造；观察跨界流，不要改动其余输入。
- 用优先级检查“资产边界”：为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。 为合成系统画用户、模型、工具、数据和外部内容边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 攻击者

{% note info flat %}
威胁建模从资产、信任边界和攻击者开始，再排序风险；危险词列表不能说明哪一条路径会产生损失。 在“攻击者”这一环节负责执行：先固定boundary，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：攻击者**
1. 入口：boundary=用户/模型/工具/外部内容，先记录跨界流。
2. 转移：由risk=可能性×影响进入攻击者，只允许声明的动作。
3. 出口：用资产清单检查asset，越界条件是“不能只列模型”。
{% endnote %}

- 执行正常路径：把「boundary」设为「用户/模型/工具/外部内容」，同时固定「risk」为「可能性×影响」；记录输入、状态和结果，记录跨界流。
- 只改变「asset」：正常值用「密钥、数据、写操作」，越界或故障按“不能只列模型”构造；观察优先级，不要改动其余输入。
- 用资产清单检查“攻击者”：为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。 为合成系统画用户、模型、工具、数据和外部内容边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 风险判断

{% note info flat %}
威胁建模从资产、信任边界和攻击者开始，再排序风险；危险词列表不能说明哪一条路径会产生损失。 在“风险判断”这一环节负责故障：先固定risk，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：可能性×影响 | risk | 优先级 | 不能只看 CVE |
| 边界：密钥、数据、写操作 | asset | 资产清单 | 不能只列模型 |
| 故障：用户/模型/工具/外部内容 | boundary | 跨界流 | 不能假设可信 |

- 注入边界：把「risk」设为「可能性×影响」，同时固定「asset」为「密钥、数据、写操作」；记录输入、状态和结果，记录优先级。
- 只改变「boundary」：正常值用「用户/模型/工具/外部内容」，越界或故障按“不能假设可信”构造；观察资产清单，不要改动其余输入。
- 用跨界流检查“风险判断”：为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。 为合成系统画用户、模型、工具、数据和外部内容边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 安全目标

{% note info flat %}
威胁建模从资产、信任边界和攻击者开始，再排序风险；危险词列表不能说明哪一条路径会产生损失。 在“安全目标”这一环节负责复核：先固定asset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（安全目标）：输入为「密钥、数据、写操作」；状态观察为「跨界流」；独立判定使用「优先级」。记录为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险，把“回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
attacks=[{"id":i,"action":"write"} for i in range(12)]
benign=[{"id":i,"action":"read"} for i in range(8)]
policy={("alpha","read"):True,("alpha","write"):False}
blocked=sum(not policy.get(("alpha",x["action"]),False) for x in attacks)
false_positive=sum(not policy.get(("alpha",x["action"]),False) for x in benign)
print({"attacks":len(attacks),"benign":len(benign),"blocked":blocked,"benign_blocked":false_positive})
assert blocked==12 and false_positive==0
# 预期观察：为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险。
```

{% note success flat %}
失败边界：回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。 为合成系统画用户、模型、工具、数据和外部内容边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f02-threat-vulnerability-risk deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
为什么“威胁脆弱性风险”必须留下独立证据？
--- answer
先把“威胁脆弱性风险”绑定到asset与boundary；正常、越界和 Unknown 各运行一次，断言优先级。
--- explanation
在security夹具中，比较密钥、数据、写操作与用户/模型/工具/外部内容，保留优先级；回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。
{% endflashcard %}

{% flashcard basic id:f02-answer-not-safe-execution deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
“安全目标”的课程边界中，为什么“回答”不是“安全执行”？
--- answer
回答是模型生成的文本，安全执行还要求身份、权限、参数和写入结果全部通过门禁。
--- explanation
威胁建模从资产、信任边界和攻击者开始，再排序风险；危险词列表不能说明哪一条路径会产生损失。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存为用户、模型、工具、数据和外部内容画边界，给每条跨界路径标资产和风险。回答文本安全不等于执行安全；真正的风险要落到调用、数据和副作用。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Model Context Protocol authorization, https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization, https://modelcontextprotocol.io/favicon.ico %}
{% link OpenAI safety best practices, https://platform.openai.com/docs/guides/safety-best-practices, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

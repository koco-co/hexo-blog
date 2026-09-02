---
title: Agent 安全(十)安全测试设计
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能运行 12 个安全样本和 8 个良性样本，并正确解释攻击率。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 10
published: false
abbrlink: e2e749db
date: 2026-08-13 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把安全测试写成有分母、Oracle、良性对照和风险分类的实验。 最终要留下：能运行 12 个安全样本和 8 个良性样本，并正确解释攻击率。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 安全Oracle

{% note primary flat %}
安全测试必须先定义 Oracle、分母、良性对照和结果分类；攻击样本通过率不能脱离执行边界解释。 在“安全Oracle”这一环节负责定义：先固定oracle，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| oracle | 主体/资源/动作/副作用 | 安全判断 | 不能只看拒答 |
| denominator | 真正执行目标的样本 | 攻击率 | 不能把 Unknown 塞进 |
| benign | 正常任务与误报 | 误报率 | 不能只追求阻断 |
| 定义边界 | 安全Oracle | 运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误。 | 未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[oracle]
  F --> A[安全Oracle]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「oracle」设为「主体/资源/动作/副作用」，同时固定「denominator」为「真正执行目标的样本」；记录输入、状态和结果，记录安全判断。
- 只改变「benign」：正常值用「正常任务与误报」，越界或故障按“不能只追求阻断”构造；观察攻击率，不要改动其余输入。
- 用误报率检查“安全Oracle”：运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。 建立 20 例合成安全集，分开阻断、误报、Unknown 和环境错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 样本分母

{% note info flat %}
安全测试必须先定义 Oracle、分母、良性对照和结果分类；攻击样本通过率不能脱离执行边界解释。 在“样本分母”这一环节负责执行：先固定denominator，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：样本分母**
1. 入口：denominator=真正执行目标的样本，先记录攻击率。
2. 转移：由benign=正常任务与误报进入样本分母，只允许声明的动作。
3. 出口：用安全判断检查oracle，越界条件是“不能只看拒答”。
{% endnote %}

- 执行正常路径：把「denominator」设为「真正执行目标的样本」，同时固定「benign」为「正常任务与误报」；记录输入、状态和结果，记录攻击率。
- 只改变「oracle」：正常值用「主体/资源/动作/副作用」，越界或故障按“不能只看拒答”构造；观察误报率，不要改动其余输入。
- 用安全判断检查“样本分母”：运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。 建立 20 例合成安全集，分开阻断、误报、Unknown 和环境错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 良性对照

{% note info flat %}
安全测试必须先定义 Oracle、分母、良性对照和结果分类；攻击样本通过率不能脱离执行边界解释。 在“良性对照”这一环节负责故障：先固定benign，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：正常任务与误报 | benign | 误报率 | 不能只追求阻断 |
| 边界：主体/资源/动作/副作用 | oracle | 安全判断 | 不能只看拒答 |
| 故障：真正执行目标的样本 | denominator | 攻击率 | 不能把 Unknown 塞进 |

- 注入边界：把「benign」设为「正常任务与误报」，同时固定「oracle」为「主体/资源/动作/副作用」；记录输入、状态和结果，记录误报率。
- 只改变「denominator」：正常值用「真正执行目标的样本」，越界或故障按“不能把 Unknown 塞进”构造；观察安全判断，不要改动其余输入。
- 用攻击率检查“良性对照”：运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。 建立 20 例合成安全集，分开阻断、误报、Unknown 和环境错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果解释

{% note info flat %}
安全测试必须先定义 Oracle、分母、良性对照和结果分类；攻击样本通过率不能脱离执行边界解释。 在“结果解释”这一环节负责复核：先固定oracle，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（结果解释）：输入为「主体/资源/动作/副作用」；状态观察为「攻击率」；独立判定使用「误报率」。记录运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误，把“未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误。
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
# 预期观察：运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误。
```

{% note success flat %}
失败边界：未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。 建立 20 例合成安全集，分开阻断、误报、Unknown 和环境错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f10-security-oracle deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
当“安全 Oracle”出现时，先检查哪个状态和边界？
--- answer
先把“安全 Oracle”绑定到oracle与denominator；正常、越界和 Unknown 各运行一次，断言误报率。
--- explanation
在security夹具中，比较主体/资源/动作/副作用与真正执行目标的样本，保留误报率；未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。
{% endflashcard %}

{% flashcard basic id:f10-attack-rate-denominator deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
当“攻击比例分母”出现时，先检查哪个状态和边界？
--- answer
先把“攻击比例分母”绑定到oracle与denominator；正常、越界和 Unknown 各运行一次，断言误报率。
--- explanation
在security夹具中，比较主体/资源/动作/副作用与真正执行目标的样本，保留误报率；未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。
{% endflashcard %}

{% flashcard basic id:f10-no-observed-not-absolute deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
“结果解释”的课程边界中，为什么“无观察到”不是“绝对”？
--- answer
没有观察到失败只代表当前样本和观测面未发现问题，不能把有限证据升级为绝对结论。
--- explanation
安全测试必须先定义 Oracle、分母、良性对照和结果分类；攻击样本通过率不能脱离执行边界解释。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存运行十二个攻击样本和八个良性样本，分开阻断、误报、Unknown 和环境错误。未观察到攻击只说明有限样本；分母、覆盖和未测范围必须公开。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Model Context Protocol authorization, https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization, https://modelcontextprotocol.io/favicon.ico %}
{% link OpenAI safety best practices, https://platform.openai.com/docs/guides/safety-best-practices, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

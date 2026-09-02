---
title: Agent 质量工程(六)评分器校准
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能用双人标签与 Unknown 分支评估评分器可用性。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 6
published: false
abbrlink: 860f4ebb
date: 2026-08-02 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：校准 LLM judge、人工标签、Unknown、顺序效应和一致性。 最终要留下：能用双人标签与 Unknown 分支评估评分器可用性。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 人工基线

{% note primary flat %}
评分器校准把人工基线、LLM judge、一致性、Unknown 和顺序效应分开，先知道评分器何时不可靠。 在“人工基线”这一环节负责定义：先固定human，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| human | 双标注基线 | 分歧样本 | 不能当绝对真值 |
| judge | 提示、版本、顺序 | 校准误差 | 不能只看相关 |
| unknown | 不确定项 | 单独计数 | 不能强行二选一 |
| 定义边界 | 人工基线 | 对合成双标注数据做校准，交换候选顺序并比较 agreement、acceptance 和 Unknown。 | 一致性高不等于业务接受；评分器应保留原文和人工复核入口。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[human]
  F --> A[人工基线]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「human」设为「双标注基线」，同时固定「judge」为「提示、版本、顺序」；记录输入、状态和结果，记录分歧样本。
- 只改变「unknown」：正常值用「不确定项」，越界或故障按“不能强行二选一”构造；观察校准误差，不要改动其余输入。
- 用单独计数检查“人工基线”：对合成双标注数据做校准，交换候选顺序并比较 agreement、acceptance 和 Unknown；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：一致性高不等于业务接受；评分器应保留原文和人工复核入口。 对合成人工双标注数据做校准，分开一致性、接受度和不确定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## judge校准

{% note info flat %}
评分器校准把人工基线、LLM judge、一致性、Unknown 和顺序效应分开，先知道评分器何时不可靠。 在“judge校准”这一环节负责执行：先固定judge，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：judge校准**
1. 入口：judge=提示、版本、顺序，先记录校准误差。
2. 转移：由unknown=不确定项进入judge校准，只允许声明的动作。
3. 出口：用分歧样本检查human，越界条件是“不能当绝对真值”。
{% endnote %}

- 执行正常路径：把「judge」设为「提示、版本、顺序」，同时固定「unknown」为「不确定项」；记录输入、状态和结果，记录校准误差。
- 只改变「human」：正常值用「双标注基线」，越界或故障按“不能当绝对真值”构造；观察单独计数，不要改动其余输入。
- 用分歧样本检查“judge校准”：对合成双标注数据做校准，交换候选顺序并比较 agreement、acceptance 和 Unknown；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：一致性高不等于业务接受；评分器应保留原文和人工复核入口。 对合成人工双标注数据做校准，分开一致性、接受度和不确定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## Unknown

{% note info flat %}
评分器校准把人工基线、LLM judge、一致性、Unknown 和顺序效应分开，先知道评分器何时不可靠。 在“Unknown”这一环节负责故障：先固定unknown，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：不确定项 | unknown | 单独计数 | 不能强行二选一 |
| 边界：双标注基线 | human | 分歧样本 | 不能当绝对真值 |
| 故障：提示、版本、顺序 | judge | 校准误差 | 不能只看相关 |

- 注入边界：把「unknown」设为「不确定项」，同时固定「human」为「双标注基线」；记录输入、状态和结果，记录单独计数。
- 只改变「judge」：正常值用「提示、版本、顺序」，越界或故障按“不能只看相关”构造；观察分歧样本，不要改动其余输入。
- 用校准误差检查“Unknown”：对合成双标注数据做校准，交换候选顺序并比较 agreement、acceptance 和 Unknown；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：一致性高不等于业务接受；评分器应保留原文和人工复核入口。 对合成人工双标注数据做校准，分开一致性、接受度和不确定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 顺序效应

{% note info flat %}
评分器校准把人工基线、LLM judge、一致性、Unknown 和顺序效应分开，先知道评分器何时不可靠。 在“顺序效应”这一环节负责复核：先固定human，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（顺序效应）：输入为「双标注基线」；状态观察为「校准误差」；独立判定使用「单独计数」。记录对合成双标注数据做校准，交换候选顺序并比较 agreement、acceptance 和 Unknown，把“一致性高不等于业务接受；评分器应保留原文和人工复核入口。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：对合成双标注数据做校准，交换候选顺序并比较 agreement、acceptance 和 Unknown。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
checks={"outcome":True,"citation":True,"security":False}
gate=all(checks.values())
print({"gate":gate,"failed":[k for k,v in checks.items() if not v]})
assert not gate
# 预期观察：对合成双标注数据做校准，交换候选顺序并比较 agreement、acceptance 和 Unknown。
```

{% note success flat %}
失败边界：一致性高不等于业务接受；评分器应保留原文和人工复核入口。 对合成人工双标注数据做校准，分开一致性、接受度和不确定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e06-agreement-not-acceptance deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“顺序效应”的课程边界中，为什么“一致性”不是“验收”？
--- answer
一致性只提供分歧样本；验收还需要在judge上由单独计数确认，不能只看文本或单个事件。
--- explanation
在quality夹具中分别运行“一致性”和“验收”，比较双标注基线与提示、版本、顺序；一致性高不等于业务接受；评分器应保留原文和人工复核入口。
{% endflashcard %}

{% flashcard basic id:e06-unknown-separate deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
在quality夹具里，怎样区分“Unknown 分开”的通过与拒绝？
--- answer
先把“Unknown 分开”绑定到human与judge；正常、越界和 Unknown 各运行一次，断言单独计数。
--- explanation
在quality夹具中，比较双标注基线与提示、版本、顺序，保留单独计数；一致性高不等于业务接受；评分器应保留原文和人工复核入口。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

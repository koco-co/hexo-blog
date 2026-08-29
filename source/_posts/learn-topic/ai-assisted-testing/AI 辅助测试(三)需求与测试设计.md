---
title: AI 辅助测试(三)需求与测试设计
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能为合成需求产出覆盖矩阵和独立验收点。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 3
published: true
abbrlink: a2ef184d
date: 2026-08-16 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：用覆盖、歧义、状态和风险把需求变成可检查测试计划。 最终要留下：能为合成需求产出覆盖矩阵和独立验收点。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 需求澄清

{% note primary flat %}
需求设计先澄清歧义，再建状态和风险覆盖，最后输出可执行计划；更多用例数量不等于覆盖。 在“需求澄清”这一环节负责定义：先固定ambiguity，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| ambiguity | 未定义行为 | Unknown 清单 | 不能自行补规则 |
| coverage | 状态、转移、风险 | 矩阵 | 不能只数 cases |
| oracle | 独立结果 | 验收点 | 不能让模型自评 |
| 定义边界 | 需求澄清 | 对有歧义和状态迁移的需求写矩阵，标出不可判定项、风险和独立 Oracle。 | 计划是边界和假设的记录；未决需求要阻断相应结论。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[ambiguity]
  F --> A[需求澄清]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「ambiguity」设为「未定义行为」，同时固定「coverage」为「状态、转移、风险」；记录输入、状态和结果，记录Unknown 清单。
- 只改变「oracle」：正常值用「独立结果」，越界或故障按“不能让模型自评”构造；观察矩阵，不要改动其余输入。
- 用验收点检查“需求澄清”：对有歧义和状态迁移的需求写矩阵，标出不可判定项、风险和独立 Oracle；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：计划是边界和假设的记录；未决需求要阻断相应结论。 对有歧义和状态迁移的需求写测试计划，标出不可判定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 覆盖建模

{% note info flat %}
需求设计先澄清歧义，再建状态和风险覆盖，最后输出可执行计划；更多用例数量不等于覆盖。 在“覆盖建模”这一环节负责执行：先固定coverage，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：覆盖建模**
1. 入口：coverage=状态、转移、风险，先记录矩阵。
2. 转移：由oracle=独立结果进入覆盖建模，只允许声明的动作。
3. 出口：用Unknown 清单检查ambiguity，越界条件是“不能自行补规则”。
{% endnote %}

- 执行正常路径：把「coverage」设为「状态、转移、风险」，同时固定「oracle」为「独立结果」；记录输入、状态和结果，记录矩阵。
- 只改变「ambiguity」：正常值用「未定义行为」，越界或故障按“不能自行补规则”构造；观察验收点，不要改动其余输入。
- 用Unknown 清单检查“覆盖建模”：对有歧义和状态迁移的需求写矩阵，标出不可判定项、风险和独立 Oracle；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：计划是边界和假设的记录；未决需求要阻断相应结论。 对有歧义和状态迁移的需求写测试计划，标出不可判定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 风险排序

{% note info flat %}
需求设计先澄清歧义，再建状态和风险覆盖，最后输出可执行计划；更多用例数量不等于覆盖。 在“风险排序”这一环节负责故障：先固定oracle，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：独立结果 | oracle | 验收点 | 不能让模型自评 |
| 边界：未定义行为 | ambiguity | Unknown 清单 | 不能自行补规则 |
| 故障：状态、转移、风险 | coverage | 矩阵 | 不能只数 cases |

- 注入边界：把「oracle」设为「独立结果」，同时固定「ambiguity」为「未定义行为」；记录输入、状态和结果，记录验收点。
- 只改变「coverage」：正常值用「状态、转移、风险」，越界或故障按“不能只数 cases”构造；观察Unknown 清单，不要改动其余输入。
- 用矩阵检查“风险排序”：对有歧义和状态迁移的需求写矩阵，标出不可判定项、风险和独立 Oracle；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：计划是边界和假设的记录；未决需求要阻断相应结论。 对有歧义和状态迁移的需求写测试计划，标出不可判定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 计划输出

{% note info flat %}
需求设计先澄清歧义，再建状态和风险覆盖，最后输出可执行计划；更多用例数量不等于覆盖。 在“计划输出”这一环节负责复核：先固定ambiguity，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（计划输出）：输入为「未定义行为」；状态观察为「矩阵」；独立判定使用「验收点」。记录对有歧义和状态迁移的需求写矩阵，标出不可判定项、风险和独立 Oracle，把“计划是边界和假设的记录；未决需求要阻断相应结论。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：对有歧义和状态迁移的需求写矩阵，标出不可判定项、风险和独立 Oracle。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
requirements=[{"state":"new","oracle":"db status"},{"state":"done","oracle":"response"}]
unknown=[r for r in requirements if not r["oracle"]]
print({"planned":len(requirements),"unknown":len(unknown)})
assert not unknown
# 预期观察：对有歧义和状态迁移的需求写矩阵，标出不可判定项、风险和独立 Oracle。
```

{% note success flat %}
失败边界：计划是边界和假设的记录；未决需求要阻断相应结论。 对有歧义和状态迁移的需求写测试计划，标出不可判定项。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g03-independent-oracle deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
当“独立 Oracle”出现时，先检查哪个状态和边界？
--- answer
先把“独立 Oracle”绑定到ambiguity与coverage；正常、越界和 Unknown 各运行一次，断言验收点。
--- explanation
在design夹具中，比较未定义行为与状态、转移、风险，保留验收点；计划是边界和假设的记录；未决需求要阻断相应结论。
{% endflashcard %}

{% flashcard basic id:g03-more-cases-not-coverage deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“计划输出”的课程边界中，为什么“更多用例”不是“覆盖”？
--- answer
更多用例只提供Unknown 清单；覆盖还需要在coverage上由验收点确认，不能只看文本或单个事件。
--- explanation
在design夹具中分别运行“更多用例”和“覆盖”，比较未定义行为与状态、转移、风险；计划是边界和假设的记录；未决需求要阻断相应结论。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GitHub Actions documentation, https://docs.github.com/en/actions, https://github.com/favicon.ico %}
{% link Playwright documentation, https://playwright.dev/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

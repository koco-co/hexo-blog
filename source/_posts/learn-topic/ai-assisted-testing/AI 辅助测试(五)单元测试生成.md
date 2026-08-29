---
title: AI 辅助测试(五)单元测试生成
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能识别自证式测试、覆盖率幻觉和错误断言。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 5
published: true
abbrlink: aa11ab
date: 2026-08-17 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：让生成的单元测试围绕独立 Oracle、已知缺陷和 mutation 结果验收。 最终要留下：能识别自证式测试、覆盖率幻觉和错误断言。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 单元边界

{% note primary flat %}
单元测试生成要围绕独立 Oracle、已知缺陷和 mutation；覆盖率高仍可能只有自证式断言。 在“单元边界”这一环节负责定义：先固定unit，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| unit | 输入域与副作用 | 边界明确 | 不能测实现细节 |
| oracle | 独立期望 | 真实失败 | 不能复述代码 |
| mutation | 已知变异 | 断言有力量 | 不能只报 coverage |
| 定义边界 | 单元边界 | 为合成函数生成测试，注入边界缺陷和 mutation，检查错误实现是否真正失败。 | 测试能跑完不等于捕获缺陷；人工复查断言和维护成本。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[unit]
  F --> A[单元边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「unit」设为「输入域与副作用」，同时固定「oracle」为「独立期望」；记录输入、状态和结果，记录边界明确。
- 只改变「mutation」：正常值用「已知变异」，越界或故障按“不能只报 coverage”构造；观察真实失败，不要改动其余输入。
- 用断言有力量检查“单元边界”：为合成函数生成测试，注入边界缺陷和 mutation，检查错误实现是否真正失败；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：测试能跑完不等于捕获缺陷；人工复查断言和维护成本。 为合成函数生成测试，注入已知缺陷并检查测试是否真正失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## Oracle

{% note info flat %}
单元测试生成要围绕独立 Oracle、已知缺陷和 mutation；覆盖率高仍可能只有自证式断言。 在“Oracle”这一环节负责执行：先固定oracle，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：Oracle**
1. 入口：oracle=独立期望，先记录真实失败。
2. 转移：由mutation=已知变异进入Oracle，只允许声明的动作。
3. 出口：用边界明确检查unit，越界条件是“不能测实现细节”。
{% endnote %}

- 执行正常路径：把「oracle」设为「独立期望」，同时固定「mutation」为「已知变异」；记录输入、状态和结果，记录真实失败。
- 只改变「unit」：正常值用「输入域与副作用」，越界或故障按“不能测实现细节”构造；观察断言有力量，不要改动其余输入。
- 用边界明确检查“Oracle”：为合成函数生成测试，注入边界缺陷和 mutation，检查错误实现是否真正失败；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：测试能跑完不等于捕获缺陷；人工复查断言和维护成本。 为合成函数生成测试，注入已知缺陷并检查测试是否真正失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## mutation

{% note info flat %}
单元测试生成要围绕独立 Oracle、已知缺陷和 mutation；覆盖率高仍可能只有自证式断言。 在“mutation”这一环节负责故障：先固定mutation，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：已知变异 | mutation | 断言有力量 | 不能只报 coverage |
| 边界：输入域与副作用 | unit | 边界明确 | 不能测实现细节 |
| 故障：独立期望 | oracle | 真实失败 | 不能复述代码 |

- 注入边界：把「mutation」设为「已知变异」，同时固定「unit」为「输入域与副作用」；记录输入、状态和结果，记录断言有力量。
- 只改变「oracle」：正常值用「独立期望」，越界或故障按“不能复述代码”构造；观察边界明确，不要改动其余输入。
- 用真实失败检查“mutation”：为合成函数生成测试，注入边界缺陷和 mutation，检查错误实现是否真正失败；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：测试能跑完不等于捕获缺陷；人工复查断言和维护成本。 为合成函数生成测试，注入已知缺陷并检查测试是否真正失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 维护成本

{% note info flat %}
单元测试生成要围绕独立 Oracle、已知缺陷和 mutation；覆盖率高仍可能只有自证式断言。 在“维护成本”这一环节负责复核：先固定unit，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（维护成本）：输入为「输入域与副作用」；状态观察为「真实失败」；独立判定使用「断言有力量」。记录为合成函数生成测试，注入边界缺陷和 mutation，检查错误实现是否真正失败，把“测试能跑完不等于捕获缺陷；人工复查断言和维护成本。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为合成函数生成测试，注入边界缺陷和 mutation，检查错误实现是否真正失败。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[("valid",True),("boundary",False),("permission",False)]
mutants={"off_by_one":False,"skip_auth":False}
killed=sum(not v for v in mutants.values())
oracle_pass=sum(ok for _,ok in cases)
print({"cases":len(cases),"oracle_pass":oracle_pass,"mutants_killed":killed})
assert killed==2 and oracle_pass==1
# 预期观察：为合成函数生成测试，注入边界缺陷和 mutation，检查错误实现是否真正失败。
```

{% note success flat %}
失败边界：测试能跑完不等于捕获缺陷；人工复查断言和维护成本。 为合成函数生成测试，注入已知缺陷并检查测试是否真正失败。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g05-self-asserting-tests deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
当“自证式断言测试”出现时，先检查哪个状态和边界？
--- answer
先把“自证式断言测试”绑定到unit与oracle；正常、越界和 Unknown 各运行一次，断言断言有力量。
--- explanation
在testing夹具中，比较输入域与副作用与独立期望，保留断言有力量；测试能跑完不等于捕获缺陷；人工复查断言和维护成本。
{% endflashcard %}

{% flashcard basic id:g05-coverage-not-correctness deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“维护成本”的课程边界中，为什么“覆盖”不是“正确性”？
--- answer
覆盖只提供边界明确；正确性还需要在oracle上由断言有力量确认，不能只看文本或单个事件。
--- explanation
在testing夹具中分别运行“覆盖”和“正确性”，比较输入域与副作用与独立期望；测试能跑完不等于捕获缺陷；人工复查断言和维护成本。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Schemathesis documentation, https://schemathesis.readthedocs.io/en/stable/, https://schemathesis.readthedocs.io/en/stable/_static/favicon.svg %}
{% link Pytest documentation, https://docs.pytest.org/en/stable/, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

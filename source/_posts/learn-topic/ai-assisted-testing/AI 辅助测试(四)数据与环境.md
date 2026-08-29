---
title: AI 辅助测试(四)数据与环境
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能生成 20 个有目的的数据候选并证明可重复重置。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 4
published: true
abbrlink: 6fc55581
date: 2026-08-16 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：建立业务数据工厂、约束、种子、隔离和重置环境。 最终要留下：能生成 20 个有目的的数据候选并证明可重复重置。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 数据约束

{% note primary flat %}
数据工厂把业务约束、正负目标、关联关系、权限和随机来源显式化，环境重置要能重复而不是只设一个 seed。 在“数据约束”这一环节负责定义：先固定constraint，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| constraint | 唯一性、范围、关系 | 候选有效 | 不能只随机 |
| seed | 生成器、时钟、外部源 | 重复结果 | 不能覆盖全部随机性 |
| reset | 数据、缓存、权限 | 前后快照 | 不能靠手工清理 |
| 定义边界 | 数据约束 | 生成二十个有目的候选，覆盖唯一性、关联、权限和负向约束，再重置环境两次比较快照。 | seed 只固定部分随机性；环境、数据库和外部源需单独隔离。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[constraint]
  F --> A[数据约束]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「constraint」设为「唯一性、范围、关系」，同时固定「seed」为「生成器、时钟、外部源」；记录输入、状态和结果，记录候选有效。
- 只改变「reset」：正常值用「数据、缓存、权限」，越界或故障按“不能靠手工清理”构造；观察重复结果，不要改动其余输入。
- 用前后快照检查“数据约束”：生成二十个有目的候选，覆盖唯一性、关联、权限和负向约束，再重置环境两次比较快照；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：seed 只固定部分随机性；环境、数据库和外部源需单独隔离。 覆盖正负数据、唯一性、关联关系、权限和随机来源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 候选生成

{% note info flat %}
数据工厂把业务约束、正负目标、关联关系、权限和随机来源显式化，环境重置要能重复而不是只设一个 seed。 在“候选生成”这一环节负责执行：先固定seed，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：候选生成**
1. 入口：seed=生成器、时钟、外部源，先记录重复结果。
2. 转移：由reset=数据、缓存、权限进入候选生成，只允许声明的动作。
3. 出口：用候选有效检查constraint，越界条件是“不能只随机”。
{% endnote %}

- 执行正常路径：把「seed」设为「生成器、时钟、外部源」，同时固定「reset」为「数据、缓存、权限」；记录输入、状态和结果，记录重复结果。
- 只改变「constraint」：正常值用「唯一性、范围、关系」，越界或故障按“不能只随机”构造；观察前后快照，不要改动其余输入。
- 用候选有效检查“候选生成”：生成二十个有目的候选，覆盖唯一性、关联、权限和负向约束，再重置环境两次比较快照；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：seed 只固定部分随机性；环境、数据库和外部源需单独隔离。 覆盖正负数据、唯一性、关联关系、权限和随机来源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 环境隔离

{% note info flat %}
数据工厂把业务约束、正负目标、关联关系、权限和随机来源显式化，环境重置要能重复而不是只设一个 seed。 在“环境隔离”这一环节负责故障：先固定reset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：数据、缓存、权限 | reset | 前后快照 | 不能靠手工清理 |
| 边界：唯一性、范围、关系 | constraint | 候选有效 | 不能只随机 |
| 故障：生成器、时钟、外部源 | seed | 重复结果 | 不能覆盖全部随机性 |

- 注入边界：把「reset」设为「数据、缓存、权限」，同时固定「constraint」为「唯一性、范围、关系」；记录输入、状态和结果，记录前后快照。
- 只改变「seed」：正常值用「生成器、时钟、外部源」，越界或故障按“不能覆盖全部随机性”构造；观察候选有效，不要改动其余输入。
- 用重复结果检查“环境隔离”：生成二十个有目的候选，覆盖唯一性、关联、权限和负向约束，再重置环境两次比较快照；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：seed 只固定部分随机性；环境、数据库和外部源需单独隔离。 覆盖正负数据、唯一性、关联关系、权限和随机来源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重置验证

{% note info flat %}
数据工厂把业务约束、正负目标、关联关系、权限和随机来源显式化，环境重置要能重复而不是只设一个 seed。 在“重置验证”这一环节负责复核：先固定constraint，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（重置验证）：输入为「唯一性、范围、关系」；状态观察为「重复结果」；独立判定使用「前后快照」。记录生成二十个有目的候选，覆盖唯一性、关联、权限和负向约束，再重置环境两次比较快照，把“seed 只固定部分随机性；环境、数据库和外部源需单独隔离。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：生成二十个有目的候选，覆盖唯一性、关联、权限和负向约束，再重置环境两次比较快照。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
rows=[{"tenant":"a" if i%2 else "b","template":"refund" if i%3 else "login","version":1} for i in range(20)]
keys={(r["tenant"],r["template"],r["version"]) for r in rows}
leak=len(rows)-len(keys)
print({"candidates":len(rows),"unique_constraints":len(keys),"duplicate_or_leak":leak})
assert len(rows)==20 and leak>0
# 预期观察：生成二十个有目的候选，覆盖唯一性、关联、权限和负向约束，再重置环境两次比较快照。
```

{% note success flat %}
失败边界：seed 只固定部分随机性；环境、数据库和外部源需单独隔离。 覆盖正负数据、唯一性、关联关系、权限和随机来源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g04-negative-targets-constraint deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
为什么“负向目标约束”必须留下独立证据？
--- answer
先把“负向目标约束”绑定到constraint与seed；正常、越界和 Unknown 各运行一次，断言前后快照。
--- explanation
在data夹具中，比较唯一性、范围、关系与生成器、时钟、外部源，保留前后快照；seed 只固定部分随机性；环境、数据库和外部源需单独隔离。
{% endflashcard %}

{% flashcard basic id:g04-seed-not-all-randomness deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“重置验证”的课程边界中，为什么“种子”不是“所有随机性”？
--- answer
种子只提供候选有效；所有随机性还需要在seed上由前后快照确认，不能只看文本或单个事件。
--- explanation
在data夹具中分别运行“种子”和“所有随机性”，比较唯一性、范围、关系与生成器、时钟、外部源；seed 只固定部分随机性；环境、数据库和外部源需单独隔离。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Playwright documentation, https://playwright.dev/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% link Schemathesis documentation, https://schemathesis.readthedocs.io/en/stable/, https://schemathesis.readthedocs.io/en/stable/_static/favicon.svg %}
{% endlinkgroup %}

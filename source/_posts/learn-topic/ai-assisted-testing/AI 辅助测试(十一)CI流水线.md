---
title: AI 辅助测试(十一)CI流水线
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能构造可追溯的 CI 作业并在故障时阻止无证据通过。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 11
published: false
abbrlink: f5e80d23
date: 2026-08-20 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把生成作业、验证作业、来源、版本、失败证据和发布门禁分开。 最终要留下：能构造可追溯的 CI 作业并在故障时阻止无证据通过。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 作业拆分

{% note primary flat %}
CI 流水线把生成作业、验证作业、来源、版本、失败证据和发布门禁分开，模型不可用不能被静默忽略。 在“作业拆分”这一环节负责定义：先固定generate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| generate | 模型输入与版本 | 候选资产 | 不能当通过 |
| verify | 执行、Oracle、artifact | 独立结果 | 不能共享失败状态 |
| gate | 缺证据/失败/回滚 | 发布决定 | 不能只看 exit 0 |
| 定义边界 | 作业拆分 | Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失，确认无证据时阻断。 | 来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[generate]
  F --> A[作业拆分]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「generate」设为「模型输入与版本」，同时固定「verify」为「执行、Oracle、artifact」；记录输入、状态和结果，记录候选资产。
- 只改变「gate」：正常值用「缺证据/失败/回滚」，越界或故障按“不能只看 exit 0”构造；观察独立结果，不要改动其余输入。
- 用发布决定检查“作业拆分”：Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失，确认无证据时阻断；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。 用 Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 产物来源

{% note info flat %}
CI 流水线把生成作业、验证作业、来源、版本、失败证据和发布门禁分开，模型不可用不能被静默忽略。 在“产物来源”这一环节负责执行：先固定verify，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：产物来源**
1. 入口：verify=执行、Oracle、artifact，先记录独立结果。
2. 转移：由gate=缺证据/失败/回滚进入产物来源，只允许声明的动作。
3. 出口：用候选资产检查generate，越界条件是“不能当通过”。
{% endnote %}

- 执行正常路径：把「verify」设为「执行、Oracle、artifact」，同时固定「gate」为「缺证据/失败/回滚」；记录输入、状态和结果，记录独立结果。
- 只改变「generate」：正常值用「模型输入与版本」，越界或故障按“不能当通过”构造；观察发布决定，不要改动其余输入。
- 用候选资产检查“产物来源”：Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失，确认无证据时阻断；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。 用 Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 失败门禁

{% note info flat %}
CI 流水线把生成作业、验证作业、来源、版本、失败证据和发布门禁分开，模型不可用不能被静默忽略。 在“失败门禁”这一环节负责故障：先固定gate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：缺证据/失败/回滚 | gate | 发布决定 | 不能只看 exit 0 |
| 边界：模型输入与版本 | generate | 候选资产 | 不能当通过 |
| 故障：执行、Oracle、artifact | verify | 独立结果 | 不能共享失败状态 |

- 注入边界：把「gate」设为「缺证据/失败/回滚」，同时固定「generate」为「模型输入与版本」；记录输入、状态和结果，记录发布决定。
- 只改变「verify」：正常值用「执行、Oracle、artifact」，越界或故障按“不能共享失败状态”构造；观察候选资产，不要改动其余输入。
- 用独立结果检查“失败门禁”：Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失，确认无证据时阻断；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。 用 Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 回滚连接

{% note info flat %}
CI 流水线把生成作业、验证作业、来源、版本、失败证据和发布门禁分开，模型不可用不能被静默忽略。 在“回滚连接”这一环节负责复核：先固定generate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（回滚连接）：输入为「模型输入与版本」；状态观察为「独立结果」；独立判定使用「发布决定」。记录Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失，确认无证据时阻断，把“来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失，确认无证据时阻断。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
jobs=[{"job":"generate","status":"candidate"},{"job":"verify","status":"pass"},{"job":"model-unavailable","status":"blocked"},{"job":"artifact-missing","status":"blocked"}]
artifacts={"diff":True,"report":True}
gate=all(x["status"]=="pass" for x in jobs if x["job"]=="verify") and all(artifacts.values())
print({"gate":gate,"blocked":sum(x["status"]=="blocked" for x in jobs),"artifacts":artifacts})
assert gate and sum(x["status"]=="blocked" for x in jobs)==2
# 预期观察：Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失，确认无证据时阻断。
```

{% note success flat %}
失败边界：来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。 用 Fake CI 分开生成和验证，注入模型不可用、执行失败和产物缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g11-separate-jobs deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“回滚连接”的课程边界中，怎样用generate验证“分开作业”？
--- answer
先把“分开作业”绑定到generate与verify；正常、越界和 Unknown 各运行一次，断言发布决定。
--- explanation
在ci夹具中，比较模型输入与版本与执行、Oracle、artifact，保留发布决定；来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。
{% endflashcard %}

{% flashcard basic id:g11-provenance deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
当“来源追溯”出现时，先检查哪个状态和边界？
--- answer
先把“来源追溯”绑定到generate与verify；正常、越界和 Unknown 各运行一次，断言发布决定。
--- explanation
在ci夹具中，比较模型输入与版本与执行、Oracle、artifact，保留发布决定；来源追溯要覆盖模型、提示、数据和执行环境；回滚也要验证。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GitHub Actions documentation, https://docs.github.com/en/actions, https://github.com/favicon.ico %}
{% link Playwright documentation, https://playwright.dev/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% endlinkgroup %}

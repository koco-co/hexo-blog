---
title: AI 辅助测试(八)探索式测试
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能提交一条可复现发现，并区分发现、缺陷和已确认根因。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 8
published: false
abbrlink: cf56e6
date: 2026-08-18 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：用 charter、预算、观察、复现和跟进动作约束 Agent 探索。 最终要留下：能提交一条可复现发现，并区分发现、缺陷和已确认根因。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 探索章程

{% note primary flat %}
探索式测试用 charter、时间盒、预算和观察记录约束动作；发现不是缺陷，缺陷也不等于根因已知。 在“探索章程”这一环节负责定义：先固定charter，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| charter | 目标、风险、时间盒 | 探索方向 | 不能无限点击 |
| record | 输入、状态、步骤、证据 | 可复现 | 不能只写感觉 |
| followup | 最小复现与回归 | 后续动作 | 不能当场下根因 |
| 定义边界 | 探索章程 | 对 Fake UI/API 定时探索，固定输入、状态、步骤和复现条件，提交一条可重放发现。 | 探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[charter]
  F --> A[探索章程]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「charter」设为「目标、风险、时间盒」，同时固定「record」为「输入、状态、步骤、证据」；记录输入、状态和结果，记录探索方向。
- 只改变「followup」：正常值用「最小复现与回归」，越界或故障按“不能当场下根因”构造；观察可复现，不要改动其余输入。
- 用后续动作检查“探索章程”：对 Fake UI/API 定时探索，固定输入、状态、步骤和复现条件，提交一条可重放发现；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。 对 Fake UI/API 进行定时探索，保留输入、状态、步骤和复现条件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 预算控制

{% note info flat %}
探索式测试用 charter、时间盒、预算和观察记录约束动作；发现不是缺陷，缺陷也不等于根因已知。 在“预算控制”这一环节负责执行：先固定record，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：预算控制**
1. 入口：record=输入、状态、步骤、证据，先记录可复现。
2. 转移：由followup=最小复现与回归进入预算控制，只允许声明的动作。
3. 出口：用探索方向检查charter，越界条件是“不能无限点击”。
{% endnote %}

- 执行正常路径：把「record」设为「输入、状态、步骤、证据」，同时固定「followup」为「最小复现与回归」；记录输入、状态和结果，记录可复现。
- 只改变「charter」：正常值用「目标、风险、时间盒」，越界或故障按“不能无限点击”构造；观察后续动作，不要改动其余输入。
- 用探索方向检查“预算控制”：对 Fake UI/API 定时探索，固定输入、状态、步骤和复现条件，提交一条可重放发现；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。 对 Fake UI/API 进行定时探索，保留输入、状态、步骤和复现条件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 发现记录

{% note info flat %}
探索式测试用 charter、时间盒、预算和观察记录约束动作；发现不是缺陷，缺陷也不等于根因已知。 在“发现记录”这一环节负责故障：先固定followup，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：最小复现与回归 | followup | 后续动作 | 不能当场下根因 |
| 边界：目标、风险、时间盒 | charter | 探索方向 | 不能无限点击 |
| 故障：输入、状态、步骤、证据 | record | 可复现 | 不能只写感觉 |

- 注入边界：把「followup」设为「最小复现与回归」，同时固定「charter」为「目标、风险、时间盒」；记录输入、状态和结果，记录后续动作。
- 只改变「record」：正常值用「输入、状态、步骤、证据」，越界或故障按“不能只写感觉”构造；观察探索方向，不要改动其余输入。
- 用可复现检查“发现记录”：对 Fake UI/API 定时探索，固定输入、状态、步骤和复现条件，提交一条可重放发现；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。 对 Fake UI/API 进行定时探索，保留输入、状态、步骤和复现条件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 跟进复现

{% note info flat %}
探索式测试用 charter、时间盒、预算和观察记录约束动作；发现不是缺陷，缺陷也不等于根因已知。 在“跟进复现”这一环节负责复核：先固定charter，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（跟进复现）：输入为「目标、风险、时间盒」；状态观察为「可复现」；独立判定使用「后续动作」。记录对 Fake UI/API 定时探索，固定输入、状态、步骤和复现条件，提交一条可重放发现，把“探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：对 Fake UI/API 定时探索，固定输入、状态、步骤和复现条件，提交一条可重放发现。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
charter={"goal":"find stale UI state","minutes":10,"seed":42}
observed={"step":3,"state":"stale","repro":"reload after save"}
print({"charter":charter,"finding":observed})
assert observed["state"]=="stale"
# 预期观察：对 Fake UI/API 定时探索，固定输入、状态、步骤和复现条件，提交一条可重放发现。
```

{% note success flat %}
失败边界：探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。 对 Fake UI/API 进行定时探索，保留输入、状态、步骤和复现条件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g08-finding-not-defect deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“跟进复现”的课程边界中，为什么“发现”不是“缺陷”？
--- answer
发现只提供探索方向；缺陷还需要在record上由后续动作确认，不能只看文本或单个事件。
--- explanation
在explore夹具中分别运行“发现”和“缺陷”，比较目标、风险、时间盒与输入、状态、步骤、证据；探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。
{% endflashcard %}

{% flashcard basic id:g08-exploration-not-coverage deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“跟进复现”的课程边界中，为什么“探索”不是“覆盖”？
--- answer
探索只提供探索方向；覆盖还需要在record上由后续动作确认，不能只看文本或单个事件。
--- explanation
在explore夹具中分别运行“探索”和“覆盖”，比较目标、风险、时间盒与输入、状态、步骤、证据；探索覆盖不能用点击次数表示；环境阻塞和未知需单独标记。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Playwright documentation, https://playwright.dev/docs/intro, https://playwright.dev/img/playwright-logo.svg %}
{% link Schemathesis documentation, https://schemathesis.readthedocs.io/en/stable/, https://schemathesis.readthedocs.io/en/stable/_static/favicon.svg %}
{% endlinkgroup %}

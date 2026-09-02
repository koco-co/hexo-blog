---
title: AI 辅助测试(九)缺陷分析与维护
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能判断跳过、修补、误报、flaky 和真实修复。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 9
published: false
abbrlink: 6c305e52
date: 2026-08-19 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把 healer 当候选补丁，而不是自动真修复，要求干净重跑和差异审查。 最终要留下：能判断跳过、修补、误报、flaky 和真实修复。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 缺陷归因

{% note primary flat %}
healer 只给候选补丁；维护流程要求差异审查、干净重跑和回归判断，跳过并不是修复。 在“缺陷归因”这一环节负责定义：先固定candidate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| candidate | diff 与理由 | 人工审查 | 不能静默写回 |
| rerun | 干净环境、固定数据 | 结果稳定 | 不能复用缓存 |
| classify | 修复、误报、flaky、skip | 状态清楚 | 不能全算通过 |
| 定义边界 | 缺陷归因 | 用候选 diff 修复一个 locator 和一个业务断言，在清洁环境重跑并检查测试是否被篡改。 | 一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[candidate]
  F --> A[缺陷归因]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「candidate」设为「diff 与理由」，同时固定「rerun」为「干净环境、固定数据」；记录输入、状态和结果，记录人工审查。
- 只改变「classify」：正常值用「修复、误报、flaky、skip」，越界或故障按“不能全算通过”构造；观察结果稳定，不要改动其余输入。
- 用状态清楚检查“缺陷归因”：用候选 diff 修复一个 locator 和一个业务断言，在清洁环境重跑并检查测试是否被篡改；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。 用候选 diff 修复一个 locator 和一个业务断言，验证清洁环境重跑。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 补丁候选

{% note info flat %}
healer 只给候选补丁；维护流程要求差异审查、干净重跑和回归判断，跳过并不是修复。 在“补丁候选”这一环节负责执行：先固定rerun，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：补丁候选**
1. 入口：rerun=干净环境、固定数据，先记录结果稳定。
2. 转移：由classify=修复、误报、flaky、skip进入补丁候选，只允许声明的动作。
3. 出口：用人工审查检查candidate，越界条件是“不能静默写回”。
{% endnote %}

- 执行正常路径：把「rerun」设为「干净环境、固定数据」，同时固定「classify」为「修复、误报、flaky、skip」；记录输入、状态和结果，记录结果稳定。
- 只改变「candidate」：正常值用「diff 与理由」，越界或故障按“不能静默写回”构造；观察状态清楚，不要改动其余输入。
- 用人工审查检查“补丁候选”：用候选 diff 修复一个 locator 和一个业务断言，在清洁环境重跑并检查测试是否被篡改；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。 用候选 diff 修复一个 locator 和一个业务断言，验证清洁环境重跑。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 干净重跑

{% note info flat %}
healer 只给候选补丁；维护流程要求差异审查、干净重跑和回归判断，跳过并不是修复。 在“干净重跑”这一环节负责故障：先固定classify，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：修复、误报、flaky、skip | classify | 状态清楚 | 不能全算通过 |
| 边界：diff 与理由 | candidate | 人工审查 | 不能静默写回 |
| 故障：干净环境、固定数据 | rerun | 结果稳定 | 不能复用缓存 |

- 注入边界：把「classify」设为「修复、误报、flaky、skip」，同时固定「candidate」为「diff 与理由」；记录输入、状态和结果，记录状态清楚。
- 只改变「rerun」：正常值用「干净环境、固定数据」，越界或故障按“不能复用缓存”构造；观察人工审查，不要改动其余输入。
- 用结果稳定检查“干净重跑”：用候选 diff 修复一个 locator 和一个业务断言，在清洁环境重跑并检查测试是否被篡改；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。 用候选 diff 修复一个 locator 和一个业务断言，验证清洁环境重跑。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 回归判断

{% note info flat %}
healer 只给候选补丁；维护流程要求差异审查、干净重跑和回归判断，跳过并不是修复。 在“回归判断”这一环节负责复核：先固定candidate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（回归判断）：输入为「diff 与理由」；状态观察为「结果稳定」；独立判定使用「状态清楚」。记录用候选 diff 修复一个 locator 和一个业务断言，在清洁环境重跑并检查测试是否被篡改，把“一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：用候选 diff 修复一个 locator 和一个业务断言，在清洁环境重跑并检查测试是否被篡改。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
before={"src/api.py":"old","tests/test_api.py":"stable","README.md":"keep"}
after={**before,"src/api.py":"fixed"}
changed=[k for k in after if before[k]!=after[k]]
print({"changed":changed,"untouched":[k for k in after if k not in changed]})
assert changed==["src/api.py"]
# 预期观察：用候选 diff 修复一个 locator 和一个业务断言，在清洁环境重跑并检查测试是否被篡改。
```

{% note success flat %}
失败边界：一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。 用候选 diff 修复一个 locator 和一个业务断言，验证清洁环境重跑。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g09-healer-skip-not-fix deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“回归判断”的课程边界中，为什么“修复器跳过”不是“修复”？
--- answer
修复器跳过只提供人工审查；修复还需要在rerun上由状态清楚确认，不能只看文本或单个事件。
--- explanation
在patch夹具中分别运行“修复器跳过”和“修复”，比较diff 与理由与干净环境、固定数据；一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。
{% endflashcard %}

{% flashcard basic id:g09-rerun-not-flake-fixed deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“回归判断”的课程边界中，为什么“重跑”不是“flake fixed”？
--- answer
重跑只提供人工审查；flake fixed还需要在rerun上由状态清楚确认，不能只看文本或单个事件。
--- explanation
在patch夹具中分别运行“重跑”和“flake fixed”，比较diff 与理由与干净环境、固定数据；一次绿灯不能证明 flaky 已修好；要保存重跑次数、环境和失败样本。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Schemathesis documentation, https://schemathesis.readthedocs.io/en/stable/, https://schemathesis.readthedocs.io/en/stable/_static/favicon.svg %}
{% link Pytest documentation, https://docs.pytest.org/en/stable/, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% endlinkgroup %}

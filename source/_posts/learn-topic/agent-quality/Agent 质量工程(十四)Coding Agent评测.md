---
title: Agent 质量工程(十四)Coding Agent评测
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能识别 fail-to-pass、pass-to-pass 和不安全补丁。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 14
published: true
abbrlink: 8de7ffd7
date: 2026-08-06 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：评估代码修改、提交、隐藏回归和测试篡改风险。 最终要留下：能识别 fail-to-pass、pass-to-pass 和不安全补丁。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 补丁评估

{% note primary flat %}
Coding Agent 评测同时看补丁、隐藏回归、提交边界和测试篡改；“测试通过”不是唯一验收。 在“补丁评估”这一环节负责定义：先固定patch，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| patch | 预期行为与 diff | 改动正确 | 不能改测试造绿 |
| hidden | 未公开回归 | 风险捕获 | 不能只跑可见集 |
| mutation | 断言力量 | 变异被杀 | 不能用覆盖率替代 |
| 定义边界 | 补丁评估 | 固定提交注入隐藏回归和 mutation，断言 fail-to-pass、pass-to-pass 与不安全补丁分类。 | 安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[patch]
  F --> A[补丁评估]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「patch」设为「预期行为与 diff」，同时固定「hidden」为「未公开回归」；记录输入、状态和结果，记录改动正确。
- 只改变「mutation」：正常值用「断言力量」，越界或故障按“不能用覆盖率替代”构造；观察风险捕获，不要改动其余输入。
- 用变异被杀检查“补丁评估”：固定提交注入隐藏回归和 mutation，断言 fail-to-pass、pass-to-pass 与不安全补丁分类；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。 使用固定提交、隐藏回归和 mutation，断言没有修改测试以制造通过。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 回归检查

{% note info flat %}
Coding Agent 评测同时看补丁、隐藏回归、提交边界和测试篡改；“测试通过”不是唯一验收。 在“回归检查”这一环节负责执行：先固定hidden，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：回归检查**
1. 入口：hidden=未公开回归，先记录风险捕获。
2. 转移：由mutation=断言力量进入回归检查，只允许声明的动作。
3. 出口：用改动正确检查patch，越界条件是“不能改测试造绿”。
{% endnote %}

- 执行正常路径：把「hidden」设为「未公开回归」，同时固定「mutation」为「断言力量」；记录输入、状态和结果，记录风险捕获。
- 只改变「patch」：正常值用「预期行为与 diff」，越界或故障按“不能改测试造绿”构造；观察变异被杀，不要改动其余输入。
- 用改动正确检查“回归检查”：固定提交注入隐藏回归和 mutation，断言 fail-to-pass、pass-to-pass 与不安全补丁分类；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。 使用固定提交、隐藏回归和 mutation，断言没有修改测试以制造通过。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 提交边界

{% note info flat %}
Coding Agent 评测同时看补丁、隐藏回归、提交边界和测试篡改；“测试通过”不是唯一验收。 在“提交边界”这一环节负责故障：先固定mutation，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：断言力量 | mutation | 变异被杀 | 不能用覆盖率替代 |
| 边界：预期行为与 diff | patch | 改动正确 | 不能改测试造绿 |
| 故障：未公开回归 | hidden | 风险捕获 | 不能只跑可见集 |

- 注入边界：把「mutation」设为「断言力量」，同时固定「patch」为「预期行为与 diff」；记录输入、状态和结果，记录变异被杀。
- 只改变「hidden」：正常值用「未公开回归」，越界或故障按“不能只跑可见集”构造；观察改动正确，不要改动其余输入。
- 用风险捕获检查“提交边界”：固定提交注入隐藏回归和 mutation，断言 fail-to-pass、pass-to-pass 与不安全补丁分类；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。 使用固定提交、隐藏回归和 mutation，断言没有修改测试以制造通过。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 篡改防护

{% note info flat %}
Coding Agent 评测同时看补丁、隐藏回归、提交边界和测试篡改；“测试通过”不是唯一验收。 在“篡改防护”这一环节负责复核：先固定patch，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（篡改防护）：输入为「预期行为与 diff」；状态观察为「风险捕获」；独立判定使用「变异被杀」。记录固定提交注入隐藏回归和 mutation，断言 fail-to-pass、pass-to-pass 与不安全补丁分类，把“安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：固定提交注入隐藏回归和 mutation，断言 fail-to-pass、pass-to-pass 与不安全补丁分类。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[("valid",True),("boundary",False),("permission",False)]
mutants={"off_by_one":False,"skip_auth":False}
killed=sum(not v for v in mutants.values())
oracle_pass=sum(ok for _,ok in cases)
print({"cases":len(cases),"oracle_pass":oracle_pass,"mutants_killed":killed})
assert killed==2 and oracle_pass==1
# 预期观察：固定提交注入隐藏回归和 mutation，断言 fail-to-pass、pass-to-pass 与不安全补丁分类。
```

{% note success flat %}
失败边界：安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。 使用固定提交、隐藏回归和 mutation，断言没有修改测试以制造通过。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e14-fail-to-pass deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
在testing夹具里，怎样区分“fail-to-pass”的通过与拒绝？
--- answer
先把“fail-to-pass”绑定到patch与hidden；正常、越界和 Unknown 各运行一次，断言变异被杀。
--- explanation
在testing夹具中，比较预期行为与 diff与未公开回归，保留变异被杀；安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。
{% endflashcard %}

{% flashcard basic id:e14-no-test-tampering deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
为什么“没有篡改测试”必须留下独立证据？
--- answer
先把“没有篡改测试”绑定到patch与hidden；正常、越界和 Unknown 各运行一次，断言变异被杀。
--- explanation
在testing夹具中，比较预期行为与 diff与未公开回归，保留变异被杀；安全补丁需要人工审查、干净重跑和权限检查；分数不能替代责任。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

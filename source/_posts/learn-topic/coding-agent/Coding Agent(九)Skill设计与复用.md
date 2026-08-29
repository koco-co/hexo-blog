---
title: Coding Agent(九)Skill设计与复用
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能写一个最小 Skill 契约并验证它是否真的可触发。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 9
published: true
abbrlink: 6d34b815
date: 2026-07-14 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：设计输入、输出、权限、辅助文件和失败降级明确的 Skill。 最终要留下：能写一个最小 Skill 契约并验证它是否真的可触发。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## Skill边界

{% note primary flat %}
Skill 是带输入、输出、权限、辅助资料和降级路径的契约；能触发不等于结果正确。 在“Skill边界”这一环节负责定义：先固定trigger，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| trigger | 适用条件 | 命中/不命中 | 不能靠标题 |
| output | 文件、报告、证据 | 格式可解析 | 不能只说完成 |
| fallback | 依赖不可用 | 静态/只读降级 | 不能静默跳过 |
| 定义边界 | Skill边界 | 为一个最小 Skill 写输入输出样例和拒绝样例，用 Fake 触发器检查是否在正确边界启动。 | Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[trigger]
  F --> A[Skill边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「trigger」设为「适用条件」，同时固定「output」为「文件、报告、证据」；先验契约再送入执行器，记录命中/不命中。
- 只改变「fallback」：正常值用「依赖不可用」，越界或故障按“不能静默跳过”构造；观察格式可解析，不要改动其余输入。
- 用静态/只读降级检查“Skill边界”：为一个最小 Skill 写输入输出样例和拒绝样例，用 Fake 触发器检查是否在正确边界启动；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。 实现一个只读定位 Skill，分别测试 schema 有效但触发条件不满足、权限声明不足和辅助文件缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 输入输出

{% note info flat %}
Skill 是带输入、输出、权限、辅助资料和降级路径的契约；能触发不等于结果正确。 在“输入输出”这一环节负责执行：先固定output，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：输入输出**
1. 入口：output=文件、报告、证据，先记录格式可解析。
2. 转移：由fallback=依赖不可用进入输入输出，只允许声明的动作。
3. 出口：用命中/不命中检查trigger，越界条件是“不能靠标题”。
{% endnote %}

- 执行正常路径：把「output」设为「文件、报告、证据」，同时固定「fallback」为「依赖不可用」；先验契约再送入执行器，记录格式可解析。
- 只改变「trigger」：正常值用「适用条件」，越界或故障按“不能靠标题”构造；观察静态/只读降级，不要改动其余输入。
- 用命中/不命中检查“输入输出”：为一个最小 Skill 写输入输出样例和拒绝样例，用 Fake 触发器检查是否在正确边界启动；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。 实现一个只读定位 Skill，分别测试 schema 有效但触发条件不满足、权限声明不足和辅助文件缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 权限声明

{% note info flat %}
Skill 是带输入、输出、权限、辅助资料和降级路径的契约；能触发不等于结果正确。 在“权限声明”这一环节负责故障：先固定fallback，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：依赖不可用 | fallback | 静态/只读降级 | 不能静默跳过 |
| 边界：适用条件 | trigger | 命中/不命中 | 不能靠标题 |
| 故障：文件、报告、证据 | output | 格式可解析 | 不能只说完成 |

- 注入边界：把「fallback」设为「依赖不可用」，同时固定「trigger」为「适用条件」；先验契约再送入执行器，记录静态/只读降级。
- 只改变「output」：正常值用「文件、报告、证据」，越界或故障按“不能只说完成”构造；观察命中/不命中，不要改动其余输入。
- 用格式可解析检查“权限声明”：为一个最小 Skill 写输入输出样例和拒绝样例，用 Fake 触发器检查是否在正确边界启动；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。 实现一个只读定位 Skill，分别测试 schema 有效但触发条件不满足、权限声明不足和辅助文件缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 支持文件

{% note info flat %}
Skill 是带输入、输出、权限、辅助资料和降级路径的契约；能触发不等于结果正确。 在“支持文件”这一环节负责复核：先固定trigger，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（支持文件）：输入为「适用条件」；状态观察为「格式可解析」；独立判定使用「静态/只读降级」。记录为一个最小 Skill 写输入输出样例和拒绝样例，用 Fake 触发器检查是否在正确边界启动，把“Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为一个最小 Skill 写输入输出样例和拒绝样例，用 Fake 触发器检查是否在正确边界启动。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[{"version":"v1","goal":"classify","output":"json"} for _ in range(4)]+[{"goal":"classify"},{"version":"v1","goal":"ignore","output":"json"}]
required=["version","goal","output"]
valid=[all(c.get(k) for k in required) and c["goal"]=="classify" for c in cases]
print({"cases":len(cases),"accepted":sum(valid),"rejected":len(cases)-sum(valid)})
assert sum(valid)==4
# 预期观察：为一个最小 Skill 写输入输出样例和拒绝样例，用 Fake 触发器检查是否在正确边界启动。
```

{% note success flat %}
失败边界：Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。 实现一个只读定位 Skill，分别测试 schema 有效但触发条件不满足、权限声明不足和辅助文件缺失。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b09-schema-not-trigger deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
“支持文件”的课程边界中，为什么“Schema”不是“触发”？
--- answer
Schema只提供命中/不命中；触发还需要在output上由静态/只读降级确认，不能只看文本或单个事件。
--- explanation
在contract夹具中分别运行“Schema”和“触发”，比较适用条件与文件、报告、证据；Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。
{% endflashcard %}

{% flashcard basic id:b09-allowed-tools-not-permission deck:"Coding Agent" priority:1 tags:"Coding Agent,测试开发" %}
--- question
“支持文件”的课程边界中，为什么“允许工具”不是“权限”？
--- answer
允许工具只提供命中/不命中；权限还需要在output上由静态/只读降级确认，不能只看文本或单个事件。
--- explanation
在contract夹具中分别运行“允许工具”和“权限”，比较适用条件与文件、报告、证据；Skill 只约束流程，不替代业务验收；外部副作用必须单独授权。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GitHub Copilot documentation, https://docs.github.com/en/copilot, https://github.com/favicon.ico %}
{% link OpenAI Codex documentation, https://developers.openai.com/codex, https://developers.openai.com/favicon.ico %}
{% endlinkgroup %}

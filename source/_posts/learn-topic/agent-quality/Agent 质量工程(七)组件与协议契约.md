---
title: Agent 质量工程(七)组件与协议契约
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能注入 schema、权限、协议和身份故障，找到最小责任边界。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 7
published: true
abbrlink: f0e87261
date: 2026-08-02 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：为模型、Prompt、上下文、工具、MCP 和业务集成分别定义契约。 最终要留下：能注入 schema、权限、协议和身份故障，找到最小责任边界。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 契约矩阵

{% note primary flat %}
组件与协议契约分别描述 Schema、权限、协议和业务结果；差分测试要绑定身份，避免只测形状。 在“契约矩阵”这一环节负责定义：先固定schema，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| schema | 字段/类型/枚举 | 形状失败 | 不能推出业务 |
| protocol | 事件、错误、版本 | 兼容差异 | 不能只测 happy path |
| identity | 主体与参数 | 越权阻断 | 不能复用批准 |
| 定义边界 | 契约矩阵 | 建立契约矩阵并注入 schema、权限、协议和身份故障，找出最小责任边界。 | 差分相同不代表业务正确；每项契约都要有独立结果断言。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[schema]
  F --> A[契约矩阵]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「schema」设为「字段/类型/枚举」，同时固定「protocol」为「事件、错误、版本」；先验契约再送入执行器，记录形状失败。
- 只改变「identity」：正常值用「主体与参数」，越界或故障按“不能复用批准”构造；观察兼容差异，不要改动其余输入。
- 用越权阻断检查“契约矩阵”：建立契约矩阵并注入 schema、权限、协议和身份故障，找出最小责任边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：差分相同不代表业务正确；每项契约都要有独立结果断言。 建立组件契约矩阵，验证未确认写操作不能改变身份。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 故障注入

{% note info flat %}
组件与协议契约分别描述 Schema、权限、协议和业务结果；差分测试要绑定身份，避免只测形状。 在“故障注入”这一环节负责执行：先固定protocol，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：故障注入**
1. 入口：protocol=事件、错误、版本，先记录兼容差异。
2. 转移：由identity=主体与参数进入故障注入，只允许声明的动作。
3. 出口：用形状失败检查schema，越界条件是“不能推出业务”。
{% endnote %}

- 执行正常路径：把「protocol」设为「事件、错误、版本」，同时固定「identity」为「主体与参数」；先验契约再送入执行器，记录兼容差异。
- 只改变「schema」：正常值用「字段/类型/枚举」，越界或故障按“不能推出业务”构造；观察越权阻断，不要改动其余输入。
- 用形状失败检查“故障注入”：建立契约矩阵并注入 schema、权限、协议和身份故障，找出最小责任边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：差分相同不代表业务正确；每项契约都要有独立结果断言。 建立组件契约矩阵，验证未确认写操作不能改变身份。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 差分判断

{% note info flat %}
组件与协议契约分别描述 Schema、权限、协议和业务结果；差分测试要绑定身份，避免只测形状。 在“差分判断”这一环节负责故障：先固定identity，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：主体与参数 | identity | 越权阻断 | 不能复用批准 |
| 边界：字段/类型/枚举 | schema | 形状失败 | 不能推出业务 |
| 故障：事件、错误、版本 | protocol | 兼容差异 | 不能只测 happy path |

- 注入边界：把「identity」设为「主体与参数」，同时固定「schema」为「字段/类型/枚举」；先验契约再送入执行器，记录越权阻断。
- 只改变「protocol」：正常值用「事件、错误、版本」，越界或故障按“不能只测 happy path”构造；观察形状失败，不要改动其余输入。
- 用兼容差异检查“差分判断”：建立契约矩阵并注入 schema、权限、协议和身份故障，找出最小责任边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：差分相同不代表业务正确；每项契约都要有独立结果断言。 建立组件契约矩阵，验证未确认写操作不能改变身份。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 身份绑定

{% note info flat %}
组件与协议契约分别描述 Schema、权限、协议和业务结果；差分测试要绑定身份，避免只测形状。 在“身份绑定”这一环节负责复核：先固定schema，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（身份绑定）：输入为「字段/类型/枚举」；状态观察为「兼容差异」；独立判定使用「越权阻断」。记录建立契约矩阵并注入 schema、权限、协议和身份故障，找出最小责任边界，把“差分相同不代表业务正确；每项契约都要有独立结果断言。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：建立契约矩阵并注入 schema、权限、协议和身份故障，找出最小责任边界。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[{"version":"v1","goal":"classify","output":"json"} for _ in range(4)]+[{"goal":"classify"},{"version":"v1","goal":"ignore","output":"json"}]
required=["version","goal","output"]
valid=[all(c.get(k) for k in required) and c["goal"]=="classify" for c in cases]
print({"cases":len(cases),"accepted":sum(valid),"rejected":len(cases)-sum(valid)})
assert sum(valid)==4
# 预期观察：建立契约矩阵并注入 schema、权限、协议和身份故障，找出最小责任边界。
```

{% note success flat %}
失败边界：差分相同不代表业务正确；每项契约都要有独立结果断言。 建立组件契约矩阵，验证未确认写操作不能改变身份。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e07-schema-not-business deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“身份绑定”的课程边界中，为什么“Schema”不是“业务”？
--- answer
Schema只提供形状失败；业务还需要在protocol上由越权阻断确认，不能只看文本或单个事件。
--- explanation
在contract夹具中分别运行“Schema”和“业务”，比较字段/类型/枚举与事件、错误、版本；差分相同不代表业务正确；每项契约都要有独立结果断言。
{% endflashcard %}

{% flashcard basic id:e07-differential-oracle deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
在contract夹具里，怎样区分“差分 Oracle”的通过与拒绝？
--- answer
先把“差分 Oracle”绑定到schema与protocol；正常、越界和 Unknown 各运行一次，断言越权阻断。
--- explanation
在contract夹具中，比较字段/类型/枚举与事件、错误、版本，保留越权阻断；差分相同不代表业务正确；每项契约都要有独立结果断言。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

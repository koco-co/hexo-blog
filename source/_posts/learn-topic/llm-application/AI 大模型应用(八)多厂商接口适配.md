---
title: AI 大模型应用(八)多厂商接口适配
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 为 Chat、Responses 和另一家兼容接口建立适配层与迁移矩阵，能显式处理不支持能力。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 8
published: true
abbrlink: 28205af6
date: 2026-07-06 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：在切换厂商或 API 表面时保持语义不变，识别兼容层不能覆盖的差异。 最终要留下：为 Chat、Responses 和另一家兼容接口建立适配层与迁移矩阵，能显式处理不支持能力。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 边界接口

{% note primary flat %}
多厂商适配要保持业务语义而非字段表面相同；能力矩阵、错误映射和不支持项必须显式记录。 在“边界接口”这一环节负责定义：先固定capability，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| capability | stream、tool、vision | 按 provider 声明 | 不能默认兼容 |
| adapter | 统一内部事件 | 保留原始字段 | 不能吞掉差异 |
| migration | 请求/响应对照 | 差异有测试 | 不能只改 URL |
| 定义边界 | 边界接口 | 用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果。 | 兼容层不能创造底层没有的能力；迁移前需保留回滚和原始响应。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[capability]
  F --> A[边界接口]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「capability」设为「stream、tool、vision」，同时固定「adapter」为「统一内部事件」；记录输入、状态和结果，记录按 provider 声明。
- 只改变「migration」：正常值用「请求/响应对照」，越界或故障按“不能只改 URL”构造；观察保留原始字段，不要改动其余输入。
- 用差异有测试检查“边界接口”：用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：兼容层不能创造底层没有的能力；迁移前需保留回滚和原始响应。 用三个 provider fixture 比较消息、工具、流式和错误字段，禁止静默降级。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 语义差异

{% note info flat %}
多厂商适配要保持业务语义而非字段表面相同；能力矩阵、错误映射和不支持项必须显式记录。 在“语义差异”这一环节负责执行：先固定adapter，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：语义差异**
1. 入口：adapter=统一内部事件，先记录保留原始字段。
2. 转移：由migration=请求/响应对照进入语义差异，只允许声明的动作。
3. 出口：用按 provider 声明检查capability，越界条件是“不能默认兼容”。
{% endnote %}

- 执行正常路径：把「adapter」设为「统一内部事件」，同时固定「migration」为「请求/响应对照」；记录输入、状态和结果，记录保留原始字段。
- 只改变「capability」：正常值用「stream、tool、vision」，越界或故障按“不能默认兼容”构造；观察差异有测试，不要改动其余输入。
- 用按 provider 声明检查“语义差异”：用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：兼容层不能创造底层没有的能力；迁移前需保留回滚和原始响应。 用三个 provider fixture 比较消息、工具、流式和错误字段，禁止静默降级。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 适配策略

{% note info flat %}
多厂商适配要保持业务语义而非字段表面相同；能力矩阵、错误映射和不支持项必须显式记录。 在“适配策略”这一环节负责故障：先固定migration，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：请求/响应对照 | migration | 差异有测试 | 不能只改 URL |
| 边界：stream、tool、vision | capability | 按 provider 声明 | 不能默认兼容 |
| 故障：统一内部事件 | adapter | 保留原始字段 | 不能吞掉差异 |

- 注入边界：把「migration」设为「请求/响应对照」，同时固定「capability」为「stream、tool、vision」；记录输入、状态和结果，记录差异有测试。
- 只改变「adapter」：正常值用「统一内部事件」，越界或故障按“不能吞掉差异”构造；观察按 provider 声明，不要改动其余输入。
- 用保留原始字段检查“适配策略”：用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：兼容层不能创造底层没有的能力；迁移前需保留回滚和原始响应。 用三个 provider fixture 比较消息、工具、流式和错误字段，禁止静默降级。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 迁移验证

{% note info flat %}
多厂商适配要保持业务语义而非字段表面相同；能力矩阵、错误映射和不支持项必须显式记录。 在“迁移验证”这一环节负责复核：先固定capability，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（迁移验证）：输入为「stream、tool、vision」；状态观察为「保留原始字段」；独立判定使用「差异有测试」。记录用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果，把“兼容层不能创造底层没有的能力；迁移前需保留回滚和原始响应。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
providers={"chat":{"stream":True,"tool":True},"legacy":{"stream":False,"tool":False}}
need={"stream":True,"tool":True}
compatible=[name for name,caps in providers.items() if all(caps[k]==v for k,v in need.items())]
print({"compatible":compatible,"unsupported":["legacy"]})
assert compatible==["chat"]
# 预期观察：用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果。
```

{% note success flat %}
失败边界：兼容层不能创造底层没有的能力；迁移前需保留回滚和原始响应。 用三个 provider fixture 比较消息、工具、流式和错误字段，禁止静默降级。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a08-compatibility-is-not-equality deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
“迁移验证”的课程边界中，为什么“兼容性”不是“相等”？
--- answer
兼容性只说明接口能协同工作；输出、边界错误和语义相等仍需逐项验证。
--- explanation
多厂商适配要保持业务语义而非字段表面相同；能力矩阵、错误映射和不支持项必须显式记录。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存用三个 Fake provider 返回相同任务的不同事件形状，适配层将能力缺失归为 unsupported 而不是空结果。兼容层不能创造底层没有的能力；迁移前需保留回滚和原始响应。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Platform documentation, https://platform.openai.com/docs/overview, https://platform.openai.com/favicon.ico %}
{% link Anthropic API documentation, https://docs.anthropic.com/en/docs/intro, https://docs.anthropic.com/favicon.ico %}
{% endlinkgroup %}

---
title: AI 大模型应用(三)API调用与开发环境
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 在脱敏和可替换配置下完成一次单请求，并能用离线夹具复现常见失败。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 3
published: false
abbrlink: b9890c77
date: 2026-07-04 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把一次模型调用拆成环境、身份、请求、响应和错误边界，避免把配置问题误判为模型问题。 最终要留下：在脱敏和可替换配置下完成一次单请求，并能用离线夹具复现常见失败。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 环境边界

{% note primary flat %}
一次模型调用包含配置、身份、传输、服务处理和响应解析五层；任何一层失败都不等于模型推理失败。 在“环境边界”这一环节负责定义：先固定配置，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| 配置 | model、base URL、timeout | 启动前脱敏检查 | 不能把缺配置归为 5xx |
| 身份 | token 与租户 | Fake 服务返回 401/403 | 不能把认证当授权 |
| 响应 | status、request id、body | 保留原始响应 | 不能只看客户端异常 |
| 定义边界 | 环境边界 | 离线 FakeProvider 依次返回配置缺失、401、429、超时和合法响应，错误分类保持稳定。 | 真实 API 未调用时只能证明客户端边界；额度、网络和线上模型行为仍需另测。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[配置]
  F --> A[环境边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「配置」设为「model、base URL、timeout」，同时固定「身份」为「token 与租户」；按错误分类器处理响应，记录启动前脱敏检查。
- 只改变「响应」：正常值用「status、request id、body」，越界或故障按“不能只看客户端异常”构造；观察Fake 服务返回 401/403，不要改动其余输入。
- 用保留原始响应检查“环境边界”：离线 FakeProvider 依次返回配置缺失、401、429、超时和合法响应，错误分类保持稳定；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：真实 API 未调用时只能证明客户端边界；额度、网络和线上模型行为仍需另测。 离线优先，注入配置缺失、身份错误、配额、网络和超时；真实调用只作为后续可选验证。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 最小调用

{% note info flat %}
一次模型调用包含配置、身份、传输、服务处理和响应解析五层；任何一层失败都不等于模型推理失败。 在“最小调用”这一环节负责执行：先固定身份，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：最小调用**
1. 入口：身份=token 与租户，先记录Fake 服务返回 401/403。
2. 转移：由响应=status、request id、body进入最小调用，只允许声明的动作。
3. 出口：用启动前脱敏检查检查配置，越界条件是“不能把缺配置归为 5xx”。
{% endnote %}

- 执行正常路径：把「身份」设为「token 与租户」，同时固定「响应」为「status、request id、body」；按错误分类器处理响应，记录Fake 服务返回 401/403。
- 只改变「配置」：正常值用「model、base URL、timeout」，越界或故障按“不能把缺配置归为 5xx”构造；观察保留原始响应，不要改动其余输入。
- 用启动前脱敏检查检查“最小调用”：离线 FakeProvider 依次返回配置缺失、401、429、超时和合法响应，错误分类保持稳定；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：真实 API 未调用时只能证明客户端边界；额度、网络和线上模型行为仍需另测。 离线优先，注入配置缺失、身份错误、配额、网络和超时；真实调用只作为后续可选验证。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 错误分类

{% note info flat %}
一次模型调用包含配置、身份、传输、服务处理和响应解析五层；任何一层失败都不等于模型推理失败。 在“错误分类”这一环节负责故障：先固定响应，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：status、request id、body | 响应 | 保留原始响应 | 不能只看客户端异常 |
| 边界：model、base URL、timeout | 配置 | 启动前脱敏检查 | 不能把缺配置归为 5xx |
| 故障：token 与租户 | 身份 | Fake 服务返回 401/403 | 不能把认证当授权 |

- 注入边界：把「响应」设为「status、request id、body」，同时固定「配置」为「model、base URL、timeout」；按错误分类器处理响应，记录保留原始响应。
- 只改变「身份」：正常值用「token 与租户」，越界或故障按“不能把认证当授权”构造；观察启动前脱敏检查，不要改动其余输入。
- 用Fake 服务返回 401/403检查“错误分类”：离线 FakeProvider 依次返回配置缺失、401、429、超时和合法响应，错误分类保持稳定；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：真实 API 未调用时只能证明客户端边界；额度、网络和线上模型行为仍需另测。 离线优先，注入配置缺失、身份错误、配额、网络和超时；真实调用只作为后续可选验证。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 本地验证

{% note info flat %}
一次模型调用包含配置、身份、传输、服务处理和响应解析五层；任何一层失败都不等于模型推理失败。 在“本地验证”这一环节负责复核：先固定配置，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（本地验证）：输入为「model、base URL、timeout」；状态观察为「Fake 服务返回 401/403」；独立判定使用「保留原始响应」。记录离线 FakeProvider 依次返回配置缺失、401、429、超时和合法响应，错误分类保持稳定，把“真实 API 未调用时只能证明客户端边界；额度、网络和线上模型行为仍需另测。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：离线 FakeProvider 依次返回配置缺失、401、429、超时和合法响应，错误分类保持稳定。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
responses=[("missing_config",None),("401","unauthorized"),("429","rate_limited"),("timeout","deadline"),("200","ok")]
classification={status:("config" if status=="missing_config" else "auth" if status=="401" else "throttle" if status=="429" else "timeout" if status=="timeout" else "success") for status,_ in responses}
print({"responses":len(responses),"classification":classification})
assert classification["401"]=="auth" and classification["200"]=="success"
# 预期观察：离线 FakeProvider 依次返回配置缺失、401、429、超时和合法响应，错误分类保持稳定。
```

{% note success flat %}
失败边界：真实 API 未调用时只能证明客户端边界；额度、网络和线上模型行为仍需另测。 离线优先，注入配置缺失、身份错误、配额、网络和超时；真实调用只作为后续可选验证。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link JSON Schema specification, https://json-schema.org/specification, https://json-schema.org/favicon.ico %}
{% link OpenAI Platform documentation, https://platform.openai.com/docs/overview, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

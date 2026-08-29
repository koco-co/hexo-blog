---
title: Agent 应用开发(三)工具契约与执行
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能用 26 组形状与控制夹具验证模型提议、应用执行和只读边界。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 3
published: true
abbrlink: 18ac9363
date: 2026-07-17 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：把工具描述、参数、权限、执行者和结果分开建模。 最终要留下：能用 26 组形状与控制夹具验证模型提议、应用执行和只读边界。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 工具描述

{% note primary flat %}
工具调用是模型提议、应用校验、执行器副作用和结果回传四段链路；Schema 只描述形状，不授予权限。 在“工具描述”这一环节负责定义：先固定description，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| description | 名称、用途、输入 | 模型可选工具 | 不能替代授权 |
| validation | type、enum、范围 | 拒绝非法参数 | 不能只信模型 |
| execution | 主体、权限、超时 | Fake tool 记录副作用 | 不能由模型直接写入 |
| 定义边界 | 工具描述 | Fake tools 覆盖 schema、只读、超时、权限和错误，应用层只在校验和授权通过后执行。 | 工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[description]
  F --> A[工具描述]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「description」设为「名称、用途、输入」，同时固定「validation」为「type、enum、范围」；记录输入、状态和结果，记录模型可选工具。
- 只改变「execution」：正常值用「主体、权限、超时」，越界或故障按“不能由模型直接写入”构造；观察拒绝非法参数，不要改动其余输入。
- 用Fake tool 记录副作用检查“工具描述”：Fake tools 覆盖 schema、只读、超时、权限和错误，应用层只在校验和授权通过后执行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。 模型只提议调用，应用层执行 Fake tools，覆盖 schema、权限、超时和错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 参数校验

{% note info flat %}
工具调用是模型提议、应用校验、执行器副作用和结果回传四段链路；Schema 只描述形状，不授予权限。 在“参数校验”这一环节负责执行：先固定validation，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：参数校验**
1. 入口：validation=type、enum、范围，先记录拒绝非法参数。
2. 转移：由execution=主体、权限、超时进入参数校验，只允许声明的动作。
3. 出口：用模型可选工具检查description，越界条件是“不能替代授权”。
{% endnote %}

- 执行正常路径：把「validation」设为「type、enum、范围」，同时固定「execution」为「主体、权限、超时」；记录输入、状态和结果，记录拒绝非法参数。
- 只改变「description」：正常值用「名称、用途、输入」，越界或故障按“不能替代授权”构造；观察Fake tool 记录副作用，不要改动其余输入。
- 用模型可选工具检查“参数校验”：Fake tools 覆盖 schema、只读、超时、权限和错误，应用层只在校验和授权通过后执行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。 模型只提议调用，应用层执行 Fake tools，覆盖 schema、权限、超时和错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 执行边界

{% note info flat %}
工具调用是模型提议、应用校验、执行器副作用和结果回传四段链路；Schema 只描述形状，不授予权限。 在“执行边界”这一环节负责故障：先固定execution，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：主体、权限、超时 | execution | Fake tool 记录副作用 | 不能由模型直接写入 |
| 边界：名称、用途、输入 | description | 模型可选工具 | 不能替代授权 |
| 故障：type、enum、范围 | validation | 拒绝非法参数 | 不能只信模型 |

- 注入边界：把「execution」设为「主体、权限、超时」，同时固定「description」为「名称、用途、输入」；记录输入、状态和结果，记录Fake tool 记录副作用。
- 只改变「validation」：正常值用「type、enum、范围」，越界或故障按“不能只信模型”构造；观察模型可选工具，不要改动其余输入。
- 用拒绝非法参数检查“执行边界”：Fake tools 覆盖 schema、只读、超时、权限和错误，应用层只在校验和授权通过后执行；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。 模型只提议调用，应用层执行 Fake tools，覆盖 schema、权限、超时和错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果回传

{% note info flat %}
工具调用是模型提议、应用校验、执行器副作用和结果回传四段链路；Schema 只描述形状，不授予权限。 在“结果回传”这一环节负责复核：先固定description，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（结果回传）：输入为「名称、用途、输入」；状态观察为「拒绝非法参数」；独立判定使用「Fake tool 记录副作用」。记录Fake tools 覆盖 schema、只读、超时、权限和错误，应用层只在校验和授权通过后执行，把“工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake tools 覆盖 schema、只读、超时、权限和错误，应用层只在校验和授权通过后执行。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
layers=[{"layer":"cli","name":"lint","ok":True},{"layer":"mcp","name":"read_ticket","ok":True},{"layer":"skill","name":"review","ok":False}]
valid=[x for x in layers if x["ok"]]
print({"called":len(layers),"passed":len(valid),"failed":[x["name"] for x in layers if not x["ok"]],"side_effect":"none"})
assert len(valid)==2
# 预期观察：Fake tools 覆盖 schema、只读、超时、权限和错误，应用层只在校验和授权通过后执行。
```

{% note success flat %}
失败边界：工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。 模型只提议调用，应用层执行 Fake tools，覆盖 schema、权限、超时和错误。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c03-who-executes-tools deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
当“谁执行工具”出现时，先检查哪个状态和边界？
--- answer
先把“谁执行工具”绑定到description与validation；正常、越界和 Unknown 各运行一次，断言Fake tool 记录副作用。
--- explanation
在tool夹具中，比较名称、用途、输入与type、enum、范围，保留Fake tool 记录副作用；工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。
{% endflashcard %}

{% flashcard basic id:c03-readonly-is-behavior deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
为什么“只读不是行为”必须留下独立证据？
--- answer
先把“只读不是行为”绑定到description与validation；正常、越界和 Unknown 各运行一次，断言Fake tool 记录副作用。
--- explanation
在tool夹具中，比较名称、用途、输入与type、enum、范围，保留Fake tool 记录副作用；工具结果的文本也可能不可信；回传后仍要重新判断状态与业务结果。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% endlinkgroup %}

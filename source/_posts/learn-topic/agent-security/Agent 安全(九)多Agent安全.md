---
title: Agent 安全(九)多Agent安全
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能阻止伪造批准、旧消息和过期授权导致写入。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 9
published: true
abbrlink: 3abba4fd
date: 2026-08-13 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：验证委派、消息、审批、身份和级联失败在多 Agent 场景下仍受控。 最终要留下：能阻止伪造批准、旧消息和过期授权导致写入。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 委派边界

{% note primary flat %}
多 Agent 安全把委派边界、消息真实性、审批、过期授权和级联响应串起来；子 Agent 的声明不能替代身份。 在“委派边界”这一环节负责定义：先固定delegate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| delegate | 父/子主体与范围 | 不能扩权 | 不能继承全部 |
| message | 签名、序列、过期 | 防伪造/重放 | 不能只看文本 |
| cascade | 局部拒绝向上 | 全局停止 | 不能继续写入 |
| 定义边界 | 委派边界 | retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁。 | 本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[delegate]
  F --> A[委派边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「delegate」设为「父/子主体与范围」，同时固定「message」为「签名、序列、过期」；记录输入、状态和结果，记录不能扩权。
- 只改变「cascade」：正常值用「局部拒绝向上」，越界或故障按“不能继续写入”构造；观察防伪造/重放，不要改动其余输入。
- 用全局停止检查“委派边界”：retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 消息真实性

{% note info flat %}
多 Agent 安全把委派边界、消息真实性、审批、过期授权和级联响应串起来；子 Agent 的声明不能替代身份。 在“消息真实性”这一环节负责执行：先固定message，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：消息真实性**
1. 入口：message=签名、序列、过期，先记录防伪造/重放。
2. 转移：由cascade=局部拒绝向上进入消息真实性，只允许声明的动作。
3. 出口：用不能扩权检查delegate，越界条件是“不能继承全部”。
{% endnote %}

- 执行正常路径：把「message」设为「签名、序列、过期」，同时固定「cascade」为「局部拒绝向上」；记录输入、状态和结果，记录防伪造/重放。
- 只改变「delegate」：正常值用「父/子主体与范围」，越界或故障按“不能继承全部”构造；观察全局停止，不要改动其余输入。
- 用不能扩权检查“消息真实性”：retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 过期授权

{% note info flat %}
多 Agent 安全把委派边界、消息真实性、审批、过期授权和级联响应串起来；子 Agent 的声明不能替代身份。 在“过期授权”这一环节负责故障：先固定cascade，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：局部拒绝向上 | cascade | 全局停止 | 不能继续写入 |
| 边界：父/子主体与范围 | delegate | 不能扩权 | 不能继承全部 |
| 故障：签名、序列、过期 | message | 防伪造/重放 | 不能只看文本 |

- 注入边界：把「cascade」设为「局部拒绝向上」，同时固定「delegate」为「父/子主体与范围」；记录输入、状态和结果，记录全局停止。
- 只改变「message」：正常值用「签名、序列、过期」，越界或故障按“不能只看文本”构造；观察不能扩权，不要改动其余输入。
- 用防伪造/重放检查“过期授权”：retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 级联响应

{% note info flat %}
多 Agent 安全把委派边界、消息真实性、审批、过期授权和级联响应串起来；子 Agent 的声明不能替代身份。 在“级联响应”这一环节负责复核：先固定delegate，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（级联响应）：输入为「父/子主体与范围」；状态观察为「防伪造/重放」；独立判定使用「全局停止」。记录retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁，把“本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
topologies=["single","delegated","voted"]
traces=[{"topology":name,"handoff":name!="single","cost":i+1} for i,name in enumerate(topologies)]
protocol={"A2A":True,"MCP":True}
print({"traces":traces,"protocol":protocol,"total_cost":sum(x["cost"] for x in traces)})
assert len(traces)==3 and all(protocol.values())
# 预期观察：retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁。
```

{% note success flat %}
失败边界：本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。 用 retriever/executor Fake agents 注入 forged approval、replay 和 expired grant。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f09-child-claim-not-auth deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
“级联响应”的课程边界中，为什么“子 Agent 声明”不是“授权”？
--- answer
子 Agent 的自报身份不是可信凭据，父级必须验证签名、主体、范围和过期时间。
--- explanation
多 Agent 安全把委派边界、消息真实性、审批、过期授权和级联响应串起来；子 Agent 的声明不能替代身份。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存retriever/executor Fake agents 注入 forged approval、replay 和 expired grant，验证写入门禁。本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。
{% endflashcard %}

{% flashcard basic id:f09-local-vs-cascade deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
“级联响应”的课程边界中，本地与级联如何选择？
--- answer
本地阻断只改变当前 Agent 的决策；级联阻断还要把拒绝传播到父 Agent、子 Agent 和工具，直到全局停止。分别检查三层状态。
--- explanation
多 Agent 安全把委派边界、消息真实性、审批、过期授权和级联响应串起来；子 Agent 的声明不能替代身份。 本地阻断只改变当前 Agent 的决策；级联阻断还要把拒绝传播到父 Agent、子 Agent 和工具，直到全局停止。分别检查三层状态。本地阻断不一定传播到团队；要检查父 Agent、子 Agent 和工具三层状态。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% link Model Context Protocol authorization, https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization, https://modelcontextprotocol.io/favicon.ico %}
{% endlinkgroup %}

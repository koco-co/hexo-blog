---
title: Agent 应用开发(六)RAG与引用
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 交付六题 RAG 结果，包含证据 ID、引用覆盖和拒答原因。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 6
published: true
abbrlink: eb4b5e49
date: 2026-07-19 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：让检索证据真正支撑回答，并在无证据、冲突和低置信时拒答。 最终要留下：交付六题 RAG 结果，包含证据 ID、引用覆盖和拒答原因。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 证据注入

{% note primary flat %}
RAG 的关键不是塞入更多片段，而是让回答中的每个事实都能回到证据 ID，并在无证据或冲突时拒答。 在“证据注入”这一环节负责定义：先固定evidence，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| evidence | 片段 ID、版本、范围 | 引用可定位 | 不能只放 URL |
| support | 事实与片段蕴含 | 逐句检查 | 不能把引用存在当支持 |
| refuse | 无答案/冲突/过期 | 明确原因 | 不能编造填空 |
| 定义边界 | 证据注入 | 六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答。 | 引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[evidence]
  F --> A[证据注入]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「evidence」设为「片段 ID、版本、范围」，同时固定「support」为「事实与片段蕴含」；逐条绑定证据 ID，记录引用可定位。
- 只改变「refuse」：正常值用「无答案/冲突/过期」，越界或故障按“不能编造填空”构造；观察逐句检查，不要改动其余输入。
- 用明确原因检查“证据注入”：六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。 覆盖无答案、冲突文档、过期版本和引用缺失，分离引用存在与事实支持。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 回答生成

{% note info flat %}
RAG 的关键不是塞入更多片段，而是让回答中的每个事实都能回到证据 ID，并在无证据或冲突时拒答。 在“回答生成”这一环节负责执行：先固定support，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：回答生成**
1. 入口：support=事实与片段蕴含，先记录逐句检查。
2. 转移：由refuse=无答案/冲突/过期进入回答生成，只允许声明的动作。
3. 出口：用引用可定位检查evidence，越界条件是“不能只放 URL”。
{% endnote %}

- 执行正常路径：把「support」设为「事实与片段蕴含」，同时固定「refuse」为「无答案/冲突/过期」；逐条绑定证据 ID，记录逐句检查。
- 只改变「evidence」：正常值用「片段 ID、版本、范围」，越界或故障按“不能只放 URL”构造；观察明确原因，不要改动其余输入。
- 用引用可定位检查“回答生成”：六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。 覆盖无答案、冲突文档、过期版本和引用缺失，分离引用存在与事实支持。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 引用校验

{% note info flat %}
RAG 的关键不是塞入更多片段，而是让回答中的每个事实都能回到证据 ID，并在无证据或冲突时拒答。 在“引用校验”这一环节负责故障：先固定refuse，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：无答案/冲突/过期 | refuse | 明确原因 | 不能编造填空 |
| 边界：片段 ID、版本、范围 | evidence | 引用可定位 | 不能只放 URL |
| 故障：事实与片段蕴含 | support | 逐句检查 | 不能把引用存在当支持 |

- 注入边界：把「refuse」设为「无答案/冲突/过期」，同时固定「evidence」为「片段 ID、版本、范围」；逐条绑定证据 ID，记录明确原因。
- 只改变「support」：正常值用「事实与片段蕴含」，越界或故障按“不能把引用存在当支持”构造；观察引用可定位，不要改动其余输入。
- 用逐句检查检查“引用校验”：六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。 覆盖无答案、冲突文档、过期版本和引用缺失，分离引用存在与事实支持。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 拒答边界

{% note info flat %}
RAG 的关键不是塞入更多片段，而是让回答中的每个事实都能回到证据 ID，并在无证据或冲突时拒答。 在“拒答边界”这一环节负责复核：先固定evidence，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（拒答边界）：输入为「片段 ID、版本、范围」；状态观察为「逐句检查」；独立判定使用「明确原因」。记录六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答，把“引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
evidence={f"E{i}":f"fact-{i}" for i in range(1,5)}
answers=[{"claim":"fact-1","evidence":"E1"},{"claim":"fact-2","evidence":"E2"},{"claim":"unknown","evidence":None},{"claim":"fact-3","evidence":"E3"},{"claim":"conflict","evidence":"E9"},{"claim":"expired","evidence":None}]
supported=[x for x in answers if x["evidence"] in evidence]
print({"questions":len(answers),"supported":len(supported),"refuse":len(answers)-len(supported)})
assert len(answers)==6 and len(supported)==3
# 预期观察：六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答。
```

{% note success flat %}
失败边界：引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。 覆盖无答案、冲突文档、过期版本和引用缺失，分离引用存在与事实支持。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c06-citation-not-support deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“拒答边界”的课程边界中，为什么“引用”不是“支持”？
--- answer
有引用只说明答案指向了材料；支持关系还要核对证据是否覆盖这条主张，并由业务 Oracle 判定是否可接受。
--- explanation
RAG 的关键不是塞入更多片段，而是让回答中的每个事实都能回到证据 ID，并在无证据或冲突时拒答。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存六题数据覆盖有答案、无答案、冲突和过期版本，分开统计引用存在、事实支持和拒答。引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。
{% endflashcard %}

{% flashcard basic id:c06-no-evidence-refuse deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“拒答边界”的课程边界中，怎样用evidence验证“无证据拒答”？
--- answer
先把“无证据拒答”绑定到evidence与support；正常、越界和 Unknown 各运行一次，断言明确原因。
--- explanation
在citation夹具中，比较片段 ID、版本、范围与事实与片段蕴含，保留明确原因；引用存在只证明引用被写出；最终仍需业务 Oracle 或人工复核。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% endlinkgroup %}

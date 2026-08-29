---
title: AI 大模型应用(七)上下文与缓存管理
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 为 T-17 组装约束、评分标准、工具说明和日志尾部，并能解释压缩、缓存与历史的差异。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 7
published: true
abbrlink: a25c65da
date: 2026-07-06 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：在上下文长度、缓存命中和证据保真之间做出可解释取舍。 最终要留下：为 T-17 组装约束、评分标准、工具说明和日志尾部，并能解释压缩、缓存与历史的差异。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 上下文盘点

{% note primary flat %}
上下文管理是在 token 预算、证据保真、缓存命中和历史可解释性之间做投影，不是无限追加聊天记录。 在“上下文盘点”这一环节负责定义：先固定budget，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| budget | 输入、输出和保留量 | 预算可计算 | 不能超限后再补救 |
| cache key | 模型、版本、前缀 | 命中与失效 | 不能把命中当正确 |
| history | 摘要、原文、工具结果 | 可重建请求 | 不能把摘要当事实 |
| 定义边界 | 上下文盘点 | 为 T-17 固定约束和工具说明，分别截断日志尾部、压缩历史和改变版本，比较命中与证据缺失。 | 缓存只减少重复计算；版本、权限和来源变化必须让缓存失效。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[budget]
  F --> A[上下文盘点]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「budget」设为「输入、输出和保留量」，同时固定「cache key」为「模型、版本、前缀」；记录输入、状态和结果，记录预算可计算。
- 只改变「history」：正常值用「摘要、原文、工具结果」，越界或故障按“不能把摘要当事实”构造；观察命中与失效，不要改动其余输入。
- 用可重建请求检查“上下文盘点”：为 T-17 固定约束和工具说明，分别截断日志尾部、压缩历史和改变版本，比较命中与证据缺失；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缓存只减少重复计算；版本、权限和来源变化必须让缓存失效。 改变前缀、配置、路由和压缩策略，比较 token、命中和证据保留情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 组装顺序

{% note info flat %}
上下文管理是在 token 预算、证据保真、缓存命中和历史可解释性之间做投影，不是无限追加聊天记录。 在“组装顺序”这一环节负责执行：先固定cache key，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：组装顺序**
1. 入口：cache key=模型、版本、前缀，先记录命中与失效。
2. 转移：由history=摘要、原文、工具结果进入组装顺序，只允许声明的动作。
3. 出口：用预算可计算检查budget，越界条件是“不能超限后再补救”。
{% endnote %}

- 执行正常路径：把「cache key」设为「模型、版本、前缀」，同时固定「history」为「摘要、原文、工具结果」；记录输入、状态和结果，记录命中与失效。
- 只改变「budget」：正常值用「输入、输出和保留量」，越界或故障按“不能超限后再补救”构造；观察可重建请求，不要改动其余输入。
- 用预算可计算检查“组装顺序”：为 T-17 固定约束和工具说明，分别截断日志尾部、压缩历史和改变版本，比较命中与证据缺失；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缓存只减少重复计算；版本、权限和来源变化必须让缓存失效。 改变前缀、配置、路由和压缩策略，比较 token、命中和证据保留情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 缓存边界

{% note info flat %}
上下文管理是在 token 预算、证据保真、缓存命中和历史可解释性之间做投影，不是无限追加聊天记录。 在“缓存边界”这一环节负责故障：先固定history，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：摘要、原文、工具结果 | history | 可重建请求 | 不能把摘要当事实 |
| 边界：输入、输出和保留量 | budget | 预算可计算 | 不能超限后再补救 |
| 故障：模型、版本、前缀 | cache key | 命中与失效 | 不能把命中当正确 |

- 注入边界：把「history」设为「摘要、原文、工具结果」，同时固定「budget」为「输入、输出和保留量」；记录输入、状态和结果，记录可重建请求。
- 只改变「cache key」：正常值用「模型、版本、前缀」，越界或故障按“不能把命中当正确”构造；观察预算可计算，不要改动其余输入。
- 用命中与失效检查“缓存边界”：为 T-17 固定约束和工具说明，分别截断日志尾部、压缩历史和改变版本，比较命中与证据缺失；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：缓存只减少重复计算；版本、权限和来源变化必须让缓存失效。 改变前缀、配置、路由和压缩策略，比较 token、命中和证据保留情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 压缩取舍

{% note info flat %}
上下文管理是在 token 预算、证据保真、缓存命中和历史可解释性之间做投影，不是无限追加聊天记录。 在“压缩取舍”这一环节负责复核：先固定budget，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（压缩取舍）：输入为「输入、输出和保留量」；状态观察为「命中与失效」；独立判定使用「可重建请求」。记录为 T-17 固定约束和工具说明，分别截断日志尾部、压缩历史和改变版本，比较命中与证据缺失，把“缓存只减少重复计算；版本、权限和来源变化必须让缓存失效。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：为 T-17 固定约束和工具说明，分别截断日志尾部、压缩历史和改变版本，比较命中与证据缺失。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
items=["policy:v1","tool:read_ticket","history:old","history:latest"]
budget=3
projected=items[:budget]
cache_key=("fake-model","v1",tuple(projected[:1]))
next_version="v2"
cache_valid=cache_key[1]==next_version
print({"context":projected,"dropped":items[budget:],"cache_valid_after_version_change":cache_valid})
assert "policy:v1" in projected and not cache_valid
# 预期观察：为 T-17 固定约束和工具说明，分别截断日志尾部、压缩历史和改变版本，比较命中与证据缺失。
```

{% note success flat %}
失败边界：缓存只减少重复计算；版本、权限和来源变化必须让缓存失效。 改变前缀、配置、路由和压缩策略，比较 token、命中和证据保留情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a07-cache-history-memory deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
为什么“缓存历史记忆”必须留下独立证据？
--- answer
先把“缓存历史记忆”绑定到budget与cache key；正常、越界和 Unknown 各运行一次，断言可重建请求。
--- explanation
在context夹具中，比较输入、输出和保留量与模型、版本、前缀，保留可重建请求；缓存只减少重复计算；版本、权限和来源变化必须让缓存失效。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link JSON Schema specification, https://json-schema.org/specification, https://json-schema.org/favicon.ico %}
{% link OpenAI Platform documentation, https://platform.openai.com/docs/overview, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

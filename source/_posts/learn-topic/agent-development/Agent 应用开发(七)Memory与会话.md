---
title: Agent 应用开发(七)Memory与会话
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 在两个租户和用户下验证热记忆、后台记忆、撤销和删除语义。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 7
published: true
abbrlink: 4be872b0
date: 2026-07-19 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：区分短期会话、用户画像、集合记忆、来源、范围、过期和删除。 最终要留下：在两个租户和用户下验证热记忆、后台记忆、撤销和删除语义。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 记忆层次

{% note primary flat %}
记忆要区分会话热状态、用户画像、集合记忆、来源、作用域、过期和删除；每个副本都需要生命周期。 在“记忆层次”这一环节负责定义：先固定scope，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| scope | tenant/user/session | 读取过滤 | 不能跨租户 |
| lifecycle | hot/background/expiry | 虚拟时钟 | 不能无限保留 |
| delete | 索引、缓存、日志 | 副本清点 | 不能只删原文 |
| 定义边界 | 记忆层次 | 两个租户和用户用虚拟时钟切换 hot/background，撤销后查询所有副本并计数。 | 删除请求的完成语义必须说明范围和异步状态；未确认的副本不能报告已清除。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[scope]
  F --> A[记忆层次]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「scope」设为「tenant/user/session」，同时固定「lifecycle」为「hot/background/expiry」；记录输入、状态和结果，记录读取过滤。
- 只改变「delete」：正常值用「索引、缓存、日志」，越界或故障按“不能只删原文”构造；观察虚拟时钟，不要改动其余输入。
- 用副本清点检查“记忆层次”：两个租户和用户用虚拟时钟切换 hot/background，撤销后查询所有副本并计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：删除请求的完成语义必须说明范围和异步状态；未确认的副本不能报告已清除。 用虚拟时钟切换 hot/background，撤销权限并检查残留副本。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 作用域

{% note info flat %}
记忆要区分会话热状态、用户画像、集合记忆、来源、作用域、过期和删除；每个副本都需要生命周期。 在“作用域”这一环节负责执行：先固定lifecycle，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：作用域**
1. 入口：lifecycle=hot/background/expiry，先记录虚拟时钟。
2. 转移：由delete=索引、缓存、日志进入作用域，只允许声明的动作。
3. 出口：用读取过滤检查scope，越界条件是“不能跨租户”。
{% endnote %}

- 执行正常路径：把「lifecycle」设为「hot/background/expiry」，同时固定「delete」为「索引、缓存、日志」；记录输入、状态和结果，记录虚拟时钟。
- 只改变「scope」：正常值用「tenant/user/session」，越界或故障按“不能跨租户”构造；观察副本清点，不要改动其余输入。
- 用读取过滤检查“作用域”：两个租户和用户用虚拟时钟切换 hot/background，撤销后查询所有副本并计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：删除请求的完成语义必须说明范围和异步状态；未确认的副本不能报告已清除。 用虚拟时钟切换 hot/background，撤销权限并检查残留副本。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 生命周期

{% note info flat %}
记忆要区分会话热状态、用户画像、集合记忆、来源、作用域、过期和删除；每个副本都需要生命周期。 在“生命周期”这一环节负责故障：先固定delete，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：索引、缓存、日志 | delete | 副本清点 | 不能只删原文 |
| 边界：tenant/user/session | scope | 读取过滤 | 不能跨租户 |
| 故障：hot/background/expiry | lifecycle | 虚拟时钟 | 不能无限保留 |

- 注入边界：把「delete」设为「索引、缓存、日志」，同时固定「scope」为「tenant/user/session」；记录输入、状态和结果，记录副本清点。
- 只改变「lifecycle」：正常值用「hot/background/expiry」，越界或故障按“不能无限保留”构造；观察读取过滤，不要改动其余输入。
- 用虚拟时钟检查“生命周期”：两个租户和用户用虚拟时钟切换 hot/background，撤销后查询所有副本并计数；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：删除请求的完成语义必须说明范围和异步状态；未确认的副本不能报告已清除。 用虚拟时钟切换 hot/background，撤销权限并检查残留副本。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 删除语义

{% note info flat %}
记忆要区分会话热状态、用户画像、集合记忆、来源、作用域、过期和删除；每个副本都需要生命周期。 在“删除语义”这一环节负责复核：先固定scope，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（删除语义）：输入为「tenant/user/session」；状态观察为「虚拟时钟」；独立判定使用「副本清点」。记录两个租户和用户用虚拟时钟切换 hot/background，撤销后查询所有副本并计数，把“删除请求的完成语义必须说明范围和异步状态；未确认的副本不能报告已清除。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：两个租户和用户用虚拟时钟切换 hot/background，撤销后查询所有副本并计数。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
now=10
records=[{"scope":"alpha:user-a","expires":9,"copy":"index"},{"scope":"alpha:user-a","expires":20,"copy":"cache"},{"scope":"beta:user-a","expires":20,"copy":"index"}]
active=[r for r in records if r["expires"]>now and r["scope"].startswith("alpha:")]
revoked={"alpha:user-a"}
remaining=[r for r in active if r["scope"] not in revoked]
print({"active_before_revoke":len(active),"remaining_after_revoke":len(remaining),"copies_checked":len(records)})
assert len(active)==1 and not remaining
# 预期观察：两个租户和用户用虚拟时钟切换 hot/background，撤销后查询所有副本并计数。
```

{% note success flat %}
失败边界：删除请求的完成语义必须说明范围和异步状态；未确认的副本不能报告已清除。 用虚拟时钟切换 hot/background，撤销权限并检查残留副本。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c07-memory-scope-expiry deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
在memory夹具里，怎样区分“记忆作用域过期”的通过与拒绝？
--- answer
先把“记忆作用域过期”绑定到scope与lifecycle；正常、越界和 Unknown 各运行一次，断言副本清点。
--- explanation
在memory夹具中，比较tenant/user/session与hot/background/expiry，保留副本清点；删除请求的完成语义必须说明范围和异步状态；未确认的副本不能报告已清除。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% endlinkgroup %}

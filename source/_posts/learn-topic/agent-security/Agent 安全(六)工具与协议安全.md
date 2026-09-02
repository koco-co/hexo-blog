---
title: Agent 安全(六)工具与协议安全
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 6
published: false
abbrlink: fa29227d
date: 2026-08-11 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：测试 MCP、OAuth、代理、句柄、会话和上游授权的独立边界。 最终要留下：能验证客户端令牌、上游令牌、资源句柄和会话状态不混淆。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 令牌边界

{% note primary flat %}
协议安全要分客户端令牌、上游令牌、代理、资源句柄、会话和用户同意，避免把不同信任域混成一个字符串。 在“令牌边界”这一环节负责定义：先固定token，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| token | client/upstream | 传递边界 | 不能回传给模型 |
| handle | 资源句柄与会话 | 作用域 | 不能跨会话复用 |
| consent | 同意记录与范围 | 重复/撤销 | 不能无限有效 |
| 定义边界 | 令牌边界 | Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意，断言敏感值不进入日志。 | 协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[token]
  F --> A[令牌边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「token」设为「client/upstream」，同时固定「handle」为「资源句柄与会话」；记录输入、状态和结果，记录传递边界。
- 只改变「consent」：正常值用「同意记录与范围」，越界或故障按“不能无限有效”构造；观察作用域，不要改动其余输入。
- 用重复/撤销检查“令牌边界”：Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意，断言敏感值不进入日志；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 协议代理

{% note info flat %}
协议安全要分客户端令牌、上游令牌、代理、资源句柄、会话和用户同意，避免把不同信任域混成一个字符串。 在“协议代理”这一环节负责执行：先固定handle，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：协议代理**
1. 入口：handle=资源句柄与会话，先记录作用域。
2. 转移：由consent=同意记录与范围进入协议代理，只允许声明的动作。
3. 出口：用传递边界检查token，越界条件是“不能回传给模型”。
{% endnote %}

- 执行正常路径：把「handle」设为「资源句柄与会话」，同时固定「consent」为「同意记录与范围」；记录输入、状态和结果，记录作用域。
- 只改变「token」：正常值用「client/upstream」，越界或故障按“不能回传给模型”构造；观察重复/撤销，不要改动其余输入。
- 用传递边界检查“协议代理”：Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意，断言敏感值不进入日志；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 句柄状态

{% note info flat %}
协议安全要分客户端令牌、上游令牌、代理、资源句柄、会话和用户同意，避免把不同信任域混成一个字符串。 在“句柄状态”这一环节负责故障：先固定consent，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：同意记录与范围 | consent | 重复/撤销 | 不能无限有效 |
| 边界：client/upstream | token | 传递边界 | 不能回传给模型 |
| 故障：资源句柄与会话 | handle | 作用域 | 不能跨会话复用 |

- 注入边界：把「consent」设为「同意记录与范围」，同时固定「token」为「client/upstream」；记录输入、状态和结果，记录重复/撤销。
- 只改变「handle」：正常值用「资源句柄与会话」，越界或故障按“不能跨会话复用”构造；观察传递边界，不要改动其余输入。
- 用作用域检查“句柄状态”：Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意，断言敏感值不进入日志；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 用户同意

{% note info flat %}
协议安全要分客户端令牌、上游令牌、代理、资源句柄、会话和用户同意，避免把不同信任域混成一个字符串。 在“用户同意”这一环节负责复核：先固定token，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（用户同意）：输入为「client/upstream」；状态观察为「作用域」；独立判定使用「重复/撤销」。记录Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意，断言敏感值不进入日志，把“协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意，断言敏感值不进入日志。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
operations=["discover","list","call","read","prompt","template","cancel"]
capabilities={op:(op!="cancel") for op in operations}
result={op:("ok" if supported else "unsupported") for op,supported in capabilities.items()}
print({"operations":len(operations),"result":result})
assert result["discover"]=="ok" and result["cancel"]=="unsupported"
# 预期观察：Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意，断言敏感值不进入日志。
```

{% note success flat %}
失败边界：协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。 使用 Fake MCP/OAuth/proxy 测试 token 泄漏、句柄复用和重复同意。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f06-client-token-boundary deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
“用户同意”的课程边界应该如何验证边界？
--- answer
围绕token准备允许、拒绝、Unknown 和取消四类样本，再用作用域与重复/撤销分别断言权限、错误和副作用。
--- explanation
边界测试的重点是责任转移瞬间。协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。
{% endflashcard %}

{% flashcard basic id:f06-handle-session-distinct deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
当“句柄会话区分”出现时，先检查哪个状态和边界？
--- answer
先把“句柄会话区分”绑定到token与handle；正常、越界和 Unknown 各运行一次，断言重复/撤销。
--- explanation
在protocol夹具中，比较client/upstream与资源句柄与会话，保留重复/撤销；协议响应合法不代表授权正确；仍需验证主体、资源和同意范围。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Model Context Protocol authorization, https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization, https://modelcontextprotocol.io/favicon.ico %}
{% link OpenAI safety best practices, https://platform.openai.com/docs/guides/safety-best-practices, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

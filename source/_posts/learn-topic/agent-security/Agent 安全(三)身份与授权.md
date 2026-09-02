---
title: Agent 安全(三)身份与授权
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 3
published: false
abbrlink: eb945574
date: 2026-08-10 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：分清认证、授权、审批、委派和撤销，确保调用参数与身份绑定。 最终要留下：能用权限矩阵阻止子 Agent 扩权、旧授权和改参绕过。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 身份来源

{% note primary flat %}
认证回答主体是谁，授权回答能对什么资源做什么；审批、委派和撤销还要绑定参数、时间和传播路径。 在“身份来源”这一环节负责定义：先固定authn，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| authn | 身份来源、租户 | 主体稳定 | 不能当权限 |
| authz | 资源、动作、范围 | 矩阵判定 | 不能默认继承 |
| grant | 审批、过期、撤销 | 传播与查询 | 不能复用旧消息 |
| 定义边界 | 身份来源 | 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求，所有拒绝留证据。 | 子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[authn]
  F --> A[身份来源]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「authn」设为「身份来源、租户」，同时固定「authz」为「资源、动作、范围」；记录输入、状态和结果，记录主体稳定。
- 只改变「grant」：正常值用「审批、过期、撤销」，越界或故障按“不能复用旧消息”构造；观察矩阵判定，不要改动其余输入。
- 用传播与查询检查“身份来源”：测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求，所有拒绝留证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 权限矩阵

{% note info flat %}
认证回答主体是谁，授权回答能对什么资源做什么；审批、委派和撤销还要绑定参数、时间和传播路径。 在“权限矩阵”这一环节负责执行：先固定authz，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：权限矩阵**
1. 入口：authz=资源、动作、范围，先记录矩阵判定。
2. 转移：由grant=审批、过期、撤销进入权限矩阵，只允许声明的动作。
3. 出口：用主体稳定检查authn，越界条件是“不能当权限”。
{% endnote %}

- 执行正常路径：把「authz」设为「资源、动作、范围」，同时固定「grant」为「审批、过期、撤销」；记录输入、状态和结果，记录矩阵判定。
- 只改变「authn」：正常值用「身份来源、租户」，越界或故障按“不能当权限”构造；观察传播与查询，不要改动其余输入。
- 用主体稳定检查“权限矩阵”：测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求，所有拒绝留证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 审批绑定

{% note info flat %}
认证回答主体是谁，授权回答能对什么资源做什么；审批、委派和撤销还要绑定参数、时间和传播路径。 在“审批绑定”这一环节负责故障：先固定grant，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：审批、过期、撤销 | grant | 传播与查询 | 不能复用旧消息 |
| 边界：身份来源、租户 | authn | 主体稳定 | 不能当权限 |
| 故障：资源、动作、范围 | authz | 矩阵判定 | 不能默认继承 |

- 注入边界：把「grant」设为「审批、过期、撤销」，同时固定「authn」为「身份来源、租户」；记录输入、状态和结果，记录传播与查询。
- 只改变「authz」：正常值用「资源、动作、范围」，越界或故障按“不能默认继承”构造；观察主体稳定，不要改动其余输入。
- 用矩阵判定检查“审批绑定”：测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求，所有拒绝留证据；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 撤销传播

{% note info flat %}
认证回答主体是谁，授权回答能对什么资源做什么；审批、委派和撤销还要绑定参数、时间和传播路径。 在“撤销传播”这一环节负责复核：先固定authn，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（撤销传播）：输入为「身份来源、租户」；状态观察为「矩阵判定」；独立判定使用「传播与查询」。记录测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求，所有拒绝留证据，把“子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求，所有拒绝留证据。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
statuses=["pending","approved","changed","expired","revoked","denied"]
call={"tool":"write_ticket","ticket":"T-17","status":"closed"}
approved={"tool":"write_ticket","ticket":"T-17","status":"closed"}
allowed=call==approved and statuses[1]=="approved"
print({"statuses":len(statuses),"allowed":allowed,"hash":"same" if allowed else "changed"})
assert len(statuses)==6 and allowed
# 预期观察：测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求，所有拒绝留证据。
```

{% note success flat %}
失败边界：子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。 测试 alpha 矩阵、旧消息、过期 grant、改参和子 Agent 请求。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f03-authn-vs-authz deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
“撤销传播”的课程边界中，authn与authz如何选择？
--- answer
先把authn的控制变量设为authn，把authz的对照变量设为authz；在相同样本上分别记录传播与查询，再按失败边界作出选择。
--- explanation
比较authn与authz时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。
{% endflashcard %}

{% flashcard basic id:f03-child-cannot-expand deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
在approval夹具里，怎样区分“子 Agent 不能扩权”的通过与拒绝？
--- answer
先把“子 Agent 不能扩权”绑定到authn与authz；正常、越界和 Unknown 各运行一次，断言传播与查询。
--- explanation
在approval夹具中，比较身份来源、租户与资源、动作、范围，保留传播与查询；子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。
{% endflashcard %}

{% flashcard basic id:f03-changed-params-approval deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
在approval夹具里，怎样区分“改变参数审批”的通过与拒绝？
--- answer
先把“改变参数审批”绑定到authn与authz；正常、越界和 Unknown 各运行一次，断言传播与查询。
--- explanation
在approval夹具中，比较身份来源、租户与资源、动作、范围，保留传播与查询；子 Agent 不能扩权；改变参数、资源或主体应触发新的审批。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI safety best practices, https://platform.openai.com/docs/guides/safety-best-practices, https://platform.openai.com/favicon.ico %}
{% link OWASP GenAI Security Project, https://genai.owasp.org/, https://genai.owasp.org/favicon.ico %}
{% endlinkgroup %}

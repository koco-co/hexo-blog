---
title: Agent 安全(七)数据与记忆安全
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能证明相似度不能绕过访问控制，删除原文不等于副本消失。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 7
published: true
abbrlink: 1face9ca
date: 2026-08-12 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：守住租户、文档、检索、记忆、canary、撤销和删除的边界。 最终要留下：能证明相似度不能绕过访问控制，删除原文不等于副本消失。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 租户隔离

{% note primary flat %}
数据与记忆安全要同时守住租户、来源、权限、canary、撤销和删除；相似度不能绕过访问控制，删原文不等于副本消失。 在“租户隔离”这一环节负责定义：先固定tenant，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| tenant | 索引、缓存、记忆 | 越权为零 | 不能只过滤答案 |
| canary | 标记数据 | 泄漏探针 | 不能公开真实数据 |
| delete | 原文、向量、日志 | 副本清点 | 不能只删主表 |
| 定义边界 | 租户隔离 | 双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本。 | 异步删除需返回状态和范围；在确认前不能报告所有副本已消失。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[tenant]
  F --> A[租户隔离]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「tenant」设为「索引、缓存、记忆」，同时固定「canary」为「标记数据」；记录输入、状态和结果，记录越权为零。
- 只改变「delete」：正常值用「原文、向量、日志」，越界或故障按“不能只删主表”构造；观察泄漏探针，不要改动其余输入。
- 用副本清点检查“租户隔离”：双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：异步删除需返回状态和范围；在确认前不能报告所有副本已消失。 构造双租户文档、canary、过期授权和删除请求，检查所有副本路径。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 来源范围

{% note info flat %}
数据与记忆安全要同时守住租户、来源、权限、canary、撤销和删除；相似度不能绕过访问控制，删原文不等于副本消失。 在“来源范围”这一环节负责执行：先固定canary，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：来源范围**
1. 入口：canary=标记数据，先记录泄漏探针。
2. 转移：由delete=原文、向量、日志进入来源范围，只允许声明的动作。
3. 出口：用越权为零检查tenant，越界条件是“不能只过滤答案”。
{% endnote %}

- 执行正常路径：把「canary」设为「标记数据」，同时固定「delete」为「原文、向量、日志」；记录输入、状态和结果，记录泄漏探针。
- 只改变「tenant」：正常值用「索引、缓存、记忆」，越界或故障按“不能只过滤答案”构造；观察副本清点，不要改动其余输入。
- 用越权为零检查“来源范围”：双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：异步删除需返回状态和范围；在确认前不能报告所有副本已消失。 构造双租户文档、canary、过期授权和删除请求，检查所有副本路径。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 撤销删除

{% note info flat %}
数据与记忆安全要同时守住租户、来源、权限、canary、撤销和删除；相似度不能绕过访问控制，删原文不等于副本消失。 在“撤销删除”这一环节负责故障：先固定delete，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：原文、向量、日志 | delete | 副本清点 | 不能只删主表 |
| 边界：索引、缓存、记忆 | tenant | 越权为零 | 不能只过滤答案 |
| 故障：标记数据 | canary | 泄漏探针 | 不能公开真实数据 |

- 注入边界：把「delete」设为「原文、向量、日志」，同时固定「tenant」为「索引、缓存、记忆」；记录输入、状态和结果，记录副本清点。
- 只改变「canary」：正常值用「标记数据」，越界或故障按“不能公开真实数据”构造；观察越权为零，不要改动其余输入。
- 用泄漏探针检查“撤销删除”：双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：异步删除需返回状态和范围；在确认前不能报告所有副本已消失。 构造双租户文档、canary、过期授权和删除请求，检查所有副本路径。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 副本治理

{% note info flat %}
数据与记忆安全要同时守住租户、来源、权限、canary、撤销和删除；相似度不能绕过访问控制，删原文不等于副本消失。 在“副本治理”这一环节负责复核：先固定tenant，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（副本治理）：输入为「索引、缓存、记忆」；状态观察为「泄漏探针」；独立判定使用「副本清点」。记录双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本，把“异步删除需返回状态和范围；在确认前不能报告所有副本已消失。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本。
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
# 预期观察：双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本。
```

{% note success flat %}
失败边界：异步删除需返回状态和范围；在确认前不能报告所有副本已消失。 构造双租户文档、canary、过期授权和删除请求，检查所有副本路径。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f07-similarity-not-access deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
“副本治理”的课程边界中，为什么“相似度”不是“access”？
--- answer
相似度只提供越权为零；access还需要在canary上由副本清点确认，不能只看文本或单个事件。
--- explanation
在memory夹具中分别运行“相似度”和“access”，比较索引、缓存、记忆与标记数据；异步删除需返回状态和范围；在确认前不能报告所有副本已消失。
{% endflashcard %}

{% flashcard basic id:f07-delete-not-all-copies deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
“副本治理”的课程边界中，为什么“删除”不是“所有副本”？
--- answer
删除一个索引项不等于清掉缓存、备份和副本；撤销必须查询每个存储层并留下完成证据。
--- explanation
数据与记忆安全要同时守住租户、来源、权限、canary、撤销和删除；相似度不能绕过访问控制，删原文不等于副本消失。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存双租户文档加入 canary、过期授权和删除请求，检查检索、缓存、向量、日志和导出副本。异步删除需返回状态和范围；在确认前不能报告所有副本已消失。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI safety best practices, https://platform.openai.com/docs/guides/safety-best-practices, https://platform.openai.com/favicon.ico %}
{% link OWASP GenAI Security Project, https://genai.owasp.org/, https://genai.owasp.org/favicon.ico %}
{% endlinkgroup %}

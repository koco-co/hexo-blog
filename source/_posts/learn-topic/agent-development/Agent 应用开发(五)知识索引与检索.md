---
title: Agent 应用开发(五)知识索引与检索
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 能对 8 篇文档、2 个租户和 6 个问题验证召回与访问边界。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 5
published: true
abbrlink: b0ad2cf6
date: 2026-07-18 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：把文档切分、索引、检索、租户隔离和版本权威性放在同一条证据链中。 最终要留下：能对 8 篇文档、2 个租户和 6 个问题验证召回与访问边界。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 文档准备

{% note primary flat %}
检索链同时处理文档切分、索引、召回、租户和版本；相似度排序不等于访问授权或事实权威。 在“文档准备”这一环节负责定义：先固定chunk，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| chunk | 文档 ID、版本、范围 | 切分可定位 | 不能丢来源 |
| rank | 词法/向量分数 | 召回对照 | 不能当真值 |
| filter | tenant、权限、有效期 | 越权为零 | 不能先召回后放行 |
| 定义边界 | 文档准备 | 八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成。 | 召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[chunk]
  F --> A[文档准备]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「chunk」设为「文档 ID、版本、范围」，同时固定「rank」为「词法/向量分数」；先过滤权限再排序召回，记录切分可定位。
- 只改变「filter」：正常值用「tenant、权限、有效期」，越界或故障按“不能先召回后放行”构造；观察召回对照，不要改动其余输入。
- 用越权为零检查“文档准备”：八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。 比较词法与向量检索，断言 tenant、版本和文档权威性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 索引方式

{% note info flat %}
检索链同时处理文档切分、索引、召回、租户和版本；相似度排序不等于访问授权或事实权威。 在“索引方式”这一环节负责执行：先固定rank，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：索引方式**
1. 入口：rank=词法/向量分数，先记录召回对照。
2. 转移：由filter=tenant、权限、有效期进入索引方式，只允许声明的动作。
3. 出口：用切分可定位检查chunk，越界条件是“不能丢来源”。
{% endnote %}

- 执行正常路径：把「rank」设为「词法/向量分数」，同时固定「filter」为「tenant、权限、有效期」；先过滤权限再排序召回，记录召回对照。
- 只改变「chunk」：正常值用「文档 ID、版本、范围」，越界或故障按“不能丢来源”构造；观察越权为零，不要改动其余输入。
- 用切分可定位检查“索引方式”：八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。 比较词法与向量检索，断言 tenant、版本和文档权威性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 召回判断

{% note info flat %}
检索链同时处理文档切分、索引、召回、租户和版本；相似度排序不等于访问授权或事实权威。 在“召回判断”这一环节负责故障：先固定filter，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：tenant、权限、有效期 | filter | 越权为零 | 不能先召回后放行 |
| 边界：文档 ID、版本、范围 | chunk | 切分可定位 | 不能丢来源 |
| 故障：词法/向量分数 | rank | 召回对照 | 不能当真值 |

- 注入边界：把「filter」设为「tenant、权限、有效期」，同时固定「chunk」为「文档 ID、版本、范围」；先过滤权限再排序召回，记录越权为零。
- 只改变「rank」：正常值用「词法/向量分数」，越界或故障按“不能当真值”构造；观察切分可定位，不要改动其余输入。
- 用召回对照检查“召回判断”：八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。 比较词法与向量检索，断言 tenant、版本和文档权威性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 租户隔离

{% note info flat %}
检索链同时处理文档切分、索引、召回、租户和版本；相似度排序不等于访问授权或事实权威。 在“租户隔离”这一环节负责复核：先固定chunk，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（租户隔离）：输入为「文档 ID、版本、范围」；状态观察为「召回对照」；独立判定使用「越权为零」。记录八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成，把“召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
docs=[{"id":f"d{i}","tenant":"alpha" if i%2 else "beta","version":1 if i<4 else 2} for i in range(1,9)]
questions=["refund","login","delete","status","export","cancel"]
hits=[d for d in docs if d["tenant"]=="alpha" and d["version"]==2]
answers={q:[d["id"] for d in hits] for q in questions}
print({"docs":len(docs),"questions":len(questions),"hits":answers})
assert len(docs)==8 and len(questions)==6 and all(v==["d5","d7"] for v in answers.values())
# 预期观察：八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成。
```

{% note success flat %}
失败边界：召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。 比较词法与向量检索，断言 tenant、版本和文档权威性。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c05-retrieval-vs-answer deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“租户隔离”的课程边界中，检索与回答如何选择？
--- answer
先把检索的控制变量设为chunk，把回答的对照变量设为rank；在相同样本上分别记录越权为零，再按失败边界作出选择。
--- explanation
比较检索与回答时，不共享缓存或副作用；保存输入、状态转移和独立 Oracle。召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。
{% endflashcard %}

{% flashcard basic id:c05-similarity-not-authority deck:"Agent 应用开发" priority:1 tags:"Agent 应用开发,测试开发" %}
--- question
“租户隔离”的课程边界中，为什么“相似度”不是“权威性”？
--- answer
相似度只能帮助召回候选，权威性要靠来源、版本、租户和有效期确认。
--- explanation
检索链同时处理文档切分、索引、召回、租户和版本；相似度排序不等于访问授权或事实权威。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存八篇文档、两个租户和六个问题分别跑词法与向量 Fake 检索，断言租户和版本过滤先于答案生成。召回为空、冲突或过期时要报告无证据；不要用相似度掩盖访问控制。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link LangGraph documentation, https://langchain-ai.github.io/langgraph/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% endlinkgroup %}

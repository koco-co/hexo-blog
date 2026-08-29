---
title: Agent 质量工程(八)评测运行器
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 能运行可复现的评测并保留每次运行的环境和预算。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 8
published: true
abbrlink: 48dacc68
date: 2026-08-03 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：实现隔离、重置、预算、超时、重放和结果收集。 最终要留下：能运行可复现的评测并保留每次运行的环境和预算。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 运行隔离

{% note primary flat %}
评测运行器负责隔离、重置、预算、超时、重放和结果收集；在线环境不是默认的可控基线。 在“运行隔离”这一环节负责定义：先固定reset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| reset | 数据、缓存、时钟 | 前后一致 | 不能依赖顺序 |
| budget | 时间、tokens、并发 | 越界停止 | 不能无限等待 |
| replay | 输入与版本 | 差异可解释 | 不能当在线行为 |
| 定义边界 | 运行隔离 | 比较 replay、monkeypatch、mock、tmp_path 和在线环境，记录各自能证明的边界。 | Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[reset]
  F --> A[运行隔离]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「reset」设为「数据、缓存、时钟」，同时固定「budget」为「时间、tokens、并发」；记录输入、状态和结果，记录前后一致。
- 只改变「replay」：正常值用「输入与版本」，越界或故障按“不能当在线行为”构造；观察越界停止，不要改动其余输入。
- 用差异可解释检查“运行隔离”：比较 replay、monkeypatch、mock、tmp_path 和在线环境，记录各自能证明的边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 环境重置

{% note info flat %}
评测运行器负责隔离、重置、预算、超时、重放和结果收集；在线环境不是默认的可控基线。 在“环境重置”这一环节负责执行：先固定budget，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：环境重置**
1. 入口：budget=时间、tokens、并发，先记录越界停止。
2. 转移：由replay=输入与版本进入环境重置，只允许声明的动作。
3. 出口：用前后一致检查reset，越界条件是“不能依赖顺序”。
{% endnote %}

- 执行正常路径：把「budget」设为「时间、tokens、并发」，同时固定「replay」为「输入与版本」；记录输入、状态和结果，记录越界停止。
- 只改变「reset」：正常值用「数据、缓存、时钟」，越界或故障按“不能依赖顺序”构造；观察差异可解释，不要改动其余输入。
- 用前后一致检查“环境重置”：比较 replay、monkeypatch、mock、tmp_path 和在线环境，记录各自能证明的边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 预算控制

{% note info flat %}
评测运行器负责隔离、重置、预算、超时、重放和结果收集；在线环境不是默认的可控基线。 在“预算控制”这一环节负责故障：先固定replay，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：输入与版本 | replay | 差异可解释 | 不能当在线行为 |
| 边界：数据、缓存、时钟 | reset | 前后一致 | 不能依赖顺序 |
| 故障：时间、tokens、并发 | budget | 越界停止 | 不能无限等待 |

- 注入边界：把「replay」设为「输入与版本」，同时固定「reset」为「数据、缓存、时钟」；记录输入、状态和结果，记录差异可解释。
- 只改变「budget」：正常值用「时间、tokens、并发」，越界或故障按“不能无限等待”构造；观察前后一致，不要改动其余输入。
- 用越界停止检查“预算控制”：比较 replay、monkeypatch、mock、tmp_path 和在线环境，记录各自能证明的边界；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果存储

{% note info flat %}
评测运行器负责隔离、重置、预算、超时、重放和结果收集；在线环境不是默认的可控基线。 在“结果存储”这一环节负责复核：先固定reset，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（结果存储）：输入为「数据、缓存、时钟」；状态观察为「越界停止」；独立判定使用「差异可解释」。记录比较 replay、monkeypatch、mock、tmp_path 和在线环境，记录各自能证明的边界，把“Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：比较 replay、monkeypatch、mock、tmp_path 和在线环境，记录各自能证明的边界。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cases=[("known-pass","pass"),("grader-error","error"),("unknown","unknown")]
counts={s:sum(1 for _,x in cases if x==s) for s in {"pass","error","unknown"}}
print(counts)
assert counts["error"]==1 and counts["unknown"]==1
# 预期观察：比较 replay、monkeypatch、mock、tmp_path 和在线环境，记录各自能证明的边界。
```

{% note success flat %}
失败边界：Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。 比较 replay、monkeypatch、mock、tmp_path 和在线环境的边界。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:e08-replay-not-online deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“结果存储”的课程边界中，为什么“重放”不是“在线”？
--- answer
重放只提供前后一致；在线还需要在budget上由差异可解释确认，不能只看文本或单个事件。
--- explanation
在runner夹具中分别运行“重放”和“在线”，比较数据、缓存、时钟与时间、tokens、并发；Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。
{% endflashcard %}

{% flashcard basic id:e08-mock-boundary deck:"Agent 质量工程" priority:2 tags:"Agent 质量工程,测试开发" %}
--- question
“结果存储”的课程边界应该如何验证边界？
--- answer
围绕reset准备允许、拒绝、Unknown 和取消四类样本，再用越界停止与差异可解释分别断言权限、错误和副作用。
--- explanation
边界测试的重点是责任转移瞬间。Mock 通过只证明替身契约；真实网络、权限和资源需在集成层验证。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% endlinkgroup %}

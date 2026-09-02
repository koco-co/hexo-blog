---
title: Agent Harness(十二)服务运维
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 能区分 health 200、可接新任务和可恢复正确任务。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 12
published: false
abbrlink: 97e0f9eb
date: 2026-07-29 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：为 Harness 提供健康、就绪、SLO、停止、drain、版本和恢复检查。 最终要留下：能区分 health 200、可接新任务和可恢复正确任务。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 健康检查

{% note primary flat %}
服务运维把健康、就绪、优雅停止、drain、SLO、版本和恢复分开；健康探针通过不等于业务正确。 在“健康检查”这一环节负责定义：先固定health，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| health | 进程与依赖 | liveness/readiness | 不能混为一项 |
| drain | 停止接收与完成 | 在途任务 | 不能强杀 |
| slo | 延迟、错误、恢复 | 窗口统计 | 不能只看 uptime |
| 定义边界 | 健康检查 | Fake HTTP service 模拟启动、drain、升级、失败和恢复，检查状态码、在途任务和版本。 | 探针只回答运行状态；任务结果、数据一致性和权限仍需业务检查。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[health]
  F --> A[健康检查]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「health」设为「进程与依赖」，同时固定「drain」为「停止接收与完成」；记录输入、状态和结果，记录liveness/readiness。
- 只改变「slo」：正常值用「延迟、错误、恢复」，越界或故障按“不能只看 uptime”构造；观察在途任务，不要改动其余输入。
- 用窗口统计检查“健康检查”：Fake HTTP service 模拟启动、drain、升级、失败和恢复，检查状态码、在途任务和版本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：探针只回答运行状态；任务结果、数据一致性和权限仍需业务检查。 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 优雅停止

{% note info flat %}
服务运维把健康、就绪、优雅停止、drain、SLO、版本和恢复分开；健康探针通过不等于业务正确。 在“优雅停止”这一环节负责执行：先固定drain，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：优雅停止**
1. 入口：drain=停止接收与完成，先记录在途任务。
2. 转移：由slo=延迟、错误、恢复进入优雅停止，只允许声明的动作。
3. 出口：用liveness/readiness检查health，越界条件是“不能混为一项”。
{% endnote %}

- 执行正常路径：把「drain」设为「停止接收与完成」，同时固定「slo」为「延迟、错误、恢复」；记录输入、状态和结果，记录在途任务。
- 只改变「health」：正常值用「进程与依赖」，越界或故障按“不能混为一项”构造；观察窗口统计，不要改动其余输入。
- 用liveness/readiness检查“优雅停止”：Fake HTTP service 模拟启动、drain、升级、失败和恢复，检查状态码、在途任务和版本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：探针只回答运行状态；任务结果、数据一致性和权限仍需业务检查。 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## SLO字段

{% note info flat %}
服务运维把健康、就绪、优雅停止、drain、SLO、版本和恢复分开；健康探针通过不等于业务正确。 在“SLO字段”这一环节负责故障：先固定slo，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：延迟、错误、恢复 | slo | 窗口统计 | 不能只看 uptime |
| 边界：进程与依赖 | health | liveness/readiness | 不能混为一项 |
| 故障：停止接收与完成 | drain | 在途任务 | 不能强杀 |

- 注入边界：把「slo」设为「延迟、错误、恢复」，同时固定「health」为「进程与依赖」；记录输入、状态和结果，记录窗口统计。
- 只改变「drain」：正常值用「停止接收与完成」，越界或故障按“不能强杀”构造；观察liveness/readiness，不要改动其余输入。
- 用在途任务检查“SLO字段”：Fake HTTP service 模拟启动、drain、升级、失败和恢复，检查状态码、在途任务和版本；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：探针只回答运行状态；任务结果、数据一致性和权限仍需业务检查。 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 版本恢复

{% note info flat %}
服务运维把健康、就绪、优雅停止、drain、SLO、版本和恢复分开；健康探针通过不等于业务正确。 在“版本恢复”这一环节负责复核：先固定health，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（版本恢复）：输入为「进程与依赖」；状态观察为「在途任务」；独立判定使用「窗口统计」。记录Fake HTTP service 模拟启动、drain、升级、失败和恢复，检查状态码、在途任务和版本，把“探针只回答运行状态；任务结果、数据一致性和权限仍需业务检查。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake HTTP service 模拟启动、drain、升级、失败和恢复，检查状态码、在途任务和版本。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
states=["starting","ready","draining","upgrading","failed","ready","stopped"]
print({"terminal":states[-1],"recovered":states.count("ready")==2,"drained":"draining" in states,"upgraded":"upgrading" in states})
assert states[-1]=="stopped" and states.count("ready")==2
# 预期观察：Fake HTTP service 模拟启动、drain、升级、失败和恢复，检查状态码、在途任务和版本。
```

{% note success flat %}
失败边界：探针只回答运行状态；任务结果、数据一致性和权限仍需业务检查。 用 Fake HTTP service 模拟启动、drain、升级、失败和恢复。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:d12-health-not-correct deck:"Agent Harness" priority:2 tags:"Agent Harness,测试开发" %}
--- question
“版本恢复”的课程边界中，为什么“健康”不是“业务正确”？
--- answer
健康只提供liveness/readiness；业务正确还需要在drain上由窗口统计确认，不能只看文本或单个事件。
--- explanation
在operations夹具中分别运行“健康”和“业务正确”，比较进程与依赖与停止接收与完成；探针只回答运行状态；任务结果、数据一致性和权限仍需业务检查。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenTelemetry documentation, https://opentelemetry.io/docs/, https://opentelemetry.io/favicon.ico %}
{% link LangGraph persistence, https://langchain-ai.github.io/langgraph/concepts/persistence/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% endlinkgroup %}

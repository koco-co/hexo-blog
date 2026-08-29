---
title: Agent Harness(一)入门路线
tags:
  - Agent Harness
categories:
  - Learn Topic
  - Agent Harness
description: 把 Agent 的运行系统、状态、恢复、隔离、调度和观测做成可测试的 Harness，而不是只依赖应用层循环。
cover: /img/picgo-images/agent-harness-course-cover.png
series: Agent Harness
series_order: 1
published: true
abbrlink: a968dd0b
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
把 Agent 的运行系统、状态、恢复、隔离、调度和观测做成可测试的 Harness，而不是只依赖应用层循环。

毕业成果：交付一个 Fake Agent Harness，支持生命周期、持久化、恢复、审批、并发、事件和服务运维检查。
{% endnote %}

## 前置条件

{% note info flat %}
已有 Python、Shell、HTTP、Git、数据库、CI/CD 和接口测试基础；模型训练与算法数学只补齐应用开发和测试所需的直觉。课程使用合成夹具优先，真实服务和付费 API 不作为脚手架门槛。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[共同基础] --> B[Agent Harness]
  B --> C[实验与验收]
  C --> D[项目交付]
{% endmermaid %}

{% note info flat %}
按共同基础、主线工程、质量安全和项目交付推进。每篇文章都把输入、操作、失败边界和验收证据作为学习结果。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Agent Harness(一)入门路线 | 说明Agent Harness的范围、前置、阅读顺序与毕业成果。 | — | 入口 |
| 2 | Agent Harness(二)运行时边界 | 区分 Agent 应用、执行器、Harness、评测器和基础设施的责任。 | D01 | 未开始 |
| 3 | Agent Harness(三)生命周期 | 把启动、步骤、工具、终止、取消和业务结果建成完整生命周期。 | D02 | 未开始 |
| 4 | Agent Harness(四)模型适配与事件流 | 统一不同模型适配器的事件、重试和 chunk 组装，同时保留预算。 | D03、A08、A10 | 未开始 |
| 5 | Agent Harness(五)插件与资源 | 管理插件、资源、监听器和后台任务的加载、卸载与清理。 | D03、C03 | 未开始 |
| 6 | Agent Harness(六)状态与持久化 | 把事件顺序、提交、版本和恢复数据做成可读的持久化状态。 | D03、D05 | 未开始 |
| 7 | Agent Harness(七)上下文组装 | 把上下文投影、压缩、工具结果配对和重建放在可验证的状态层。 | D04、D06、A07、C07 | 未开始 |
| 8 | Agent Harness(八)恢复与幂等 | 用稳定操作 ID、查询优先和安全重试处理副作用后的崩溃。 | D04、D06、D07 | 未开始 |
| 9 | Agent Harness(九)隔离与审批 | 将审批绑定到规范化工具调用，并在 Harness 中执行隔离和写入门禁。 | D04、D05、F03 | 未开始 |
| 10 | Agent Harness(十)调度与并发 | 调度多任务、容量、背压、超时和取消，并说明副作用后的取消边界。 | D03、D08、D09 | 未开始 |
| 11 | Agent Harness(十一)运行事件与观测 | 设计运行、步骤、工具、实时和持久事件，使 Trace 能支持定位但不替代业务 Oracle。 | D03、D06、D10 | 未开始 |
| 12 | Agent Harness(十二)服务运维 | 为 Harness 提供健康、就绪、SLO、停止、drain、版本和恢复检查。 | D08、D09、D10、D11、C13 | 未开始 |
| 13 | Agent Harness(十三)项目实战 | 交付带审批、崩溃恢复、并发和事件观测的 Fake Agent Harness。 | D12 | 未开始 |

## 开始学习

{% note primary flat %}
先完成路线自检，再从《Agent Harness(二)运行时边界》开始。实验优先使用 FakeProvider、Fake HTTP、Fake tool 或合成仓库；完成一篇后保留命令、输出、失败分类和复跑条件。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link OpenTelemetry documentation, https://opentelemetry.io/docs/, https://opentelemetry.io/favicon.ico %}
{% link LangGraph persistence, https://langchain-ai.github.io/langgraph/concepts/persistence/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link Python asyncio documentation, https://docs.python.org/3/library/asyncio.html, https://docs.python.org/3/_static/py.svg %}
{% endlinkgroup %}

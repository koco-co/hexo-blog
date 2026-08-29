---
title: Agent 应用开发(一)入门路线
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 从最小 Agent 循环走到工具、RAG、Memory、工作流、MCP、多 Agent、浏览器和 HTTP 服务集成。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 1
published: true
abbrlink: 8c7d0bb9
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
从最小 Agent 循环走到工具、RAG、Memory、工作流、MCP、多 Agent、浏览器和 HTTP 服务集成。

毕业成果：交付一个带检索、会话记忆、人工审批、MCP 只读工具和 HTTP 任务状态的合成工单 Agent。
{% endnote %}

## 前置条件

{% note info flat %}
已有 Python、Shell、HTTP、Git、数据库、CI/CD 和接口测试基础；模型训练与算法数学只补齐应用开发和测试所需的直觉。课程使用合成夹具优先，真实服务和付费 API 不作为脚手架门槛。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[共同基础] --> B[Agent 应用开发]
  B --> C[实验与验收]
  C --> D[项目交付]
{% endmermaid %}

{% note info flat %}
按共同基础、主线工程、质量安全和项目交付推进。每篇文章都把输入、操作、失败边界和验收证据作为学习结果。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Agent 应用开发(一)入门路线 | 说明Agent 应用开发的范围、前置、阅读顺序与毕业成果。 | — | 入口 |
| 2 | Agent 应用开发(二)Agent任务建模 | 用状态、动作、权限和终止条件判断何时需要 Agent，何时固定工作流更可靠。 | C01 | 未开始 |
| 3 | Agent 应用开发(三)工具契约与执行 | 把工具描述、参数、权限、执行者和结果分开建模。 | C02、A05、F02、F03 | 未开始 |
| 4 | Agent 应用开发(四)Agent循环 | 实现受预算、步骤、错误和取消约束的最小 Agent loop。 | C03 | 未开始 |
| 5 | Agent 应用开发(五)知识索引与检索 | 把文档切分、索引、检索、租户隔离和版本权威性放在同一条证据链中。 | A02、A05、C02、F03 | 未开始 |
| 6 | Agent 应用开发(六)RAG与引用 | 让检索证据真正支撑回答，并在无证据、冲突和低置信时拒答。 | C05、A04、A07 | 未开始 |
| 7 | Agent 应用开发(七)Memory与会话 | 区分短期会话、用户画像、集合记忆、来源、范围、过期和删除。 | A06、C04 | 未开始 |
| 8 | Agent 应用开发(八)工作流与人工审批 | 把提问、审批、编辑、拒绝、取消和过期建模为可恢复的工作流状态。 | C04、F03 | 未开始 |
| 9 | Agent 应用开发(九)MCP服务与协议 | 理解 MCP 的生命周期、能力发现、结果、兼容、订阅和取消语义。 | C03、C08 | 未开始 |
| 10 | Agent 应用开发(十)多Agent协作 | 从单 Agent 基线出发，比较分工、投票、动态委派、MCP 和 A2A 的边界。 | C04、C07、C08 | 未开始 |
| 11 | Agent 应用开发(十一)浏览器与计算机操作 | 用观察、动作、安全边界和再观察构建可回退的浏览器 Agent。 | A09、C08 | 未开始 |
| 12 | Agent 应用开发(十二)框架迁移 | 把 Python Agent loop 迁移到一个 LangGraph 核心，并分辨框架能力与业务正确性。 | C04、C06、C07、C08 | 未开始 |
| 13 | Agent 应用开发(十三)服务与HTTP集成 | 把 Agent 暴露为身份明确、可查询、可取消的 HTTP 长任务服务。 | C08、C09、C12 | 未开始 |
| 14 | Agent 应用开发(十四)进阶路线 | 围绕 MCP Tasks、协议扩展、A2A 和包装层设计一个有边界的高级集成实验。 | C10、C11、C12 | 未开始 |
| 15 | Agent 应用开发(十五)项目实战 | 组合 RAG、Memory、审批、MCP 和 HTTP 状态，交付可审查的工单 Agent。 | C06、C07、C08、C09、C13 | 未开始 |

## 开始学习

{% note primary flat %}
先完成路线自检，再从《Agent 应用开发(二)Agent任务建模》开始。实验优先使用 FakeProvider、Fake HTTP、Fake tool 或合成仓库；完成一篇后保留命令、输出、失败分类和复跑条件。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% link LangGraph documentation, https://langchain-ai.github.io/langgraph/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% endlinkgroup %}

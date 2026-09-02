---
title: "Agent 架构与 Harness(一)入门路线"
tags:
  - Agent 架构与 Harness
categories:
  - Learn Topic
  - Agent 架构与 Harness
description: "从零设计一个带工具、状态、记忆、审批、隔离、恢复和观测能力的 Agent Harness。"
cover: /img/picgo-images/agent-harness-course-cover.png
series: "Agent 架构与 Harness"
series_order: 1
published: true
abbrlink: '8fc3882e'
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
从零设计一个带工具、状态、记忆、审批、隔离、恢复和观测能力的 Agent Harness。

课程范围：边界与循环、Loop、Graph与Harness、工具、上下文与记忆、MCP、审批与多Agent、隔离、恢复与运维。正式文章分别通过图解、实验和可观察证据完成学习闭环。
{% endnote %}

## 前置条件

{% note info flat %}
建议具备 Python 3、命令行、Git 和基本 HTTP/JSON 能力；缺少的部分在相关阶段补齐。所有实验优先使用本地夹具，真实服务仅由读者显式配置。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  P1[边界与循环]
  P2[Loop、Graph与Harness]
  P3[工具、上下文与记忆]
  P4[MCP、审批与多Agent]
  P5[隔离、恢复与运维]
  P1 --> P2
  P2 --> P3
  P3 --> P4
  P4 --> P5
{% endmermaid %}

{% note info flat %}
按阶段顺序阅读：边界与循环 → Loop、Graph与Harness → 工具、上下文与记忆 → MCP、审批与多Agent → 隔离、恢复与运维。每篇以实验输出或验收表判断是否可以继续。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Agent 架构与 Harness(一)入门路线 | 从零设计一个带工具、状态、记忆、审批、隔离、恢复和观测能力的 Agent Harness。 | 无 | 入口 |
| 2 | Agent 架构与 Harness(二)Agent与Workflow | 每个任务都有固定工作流、Agent 或混合方案及停止条件 | 大模型应用开发：Prompt与任务契约 | 未开始 |
| 3 | Agent 架构与 Harness(三)Agent Loop与ReAct | 每轮状态、工具结果、预算和停止原因可重放 | Agent与Workflow | 未开始 |
| 4 | Agent 架构与 Harness(四)Loop、Graph与Harness Engineer | 能解释状态转移、Harness 分层和恢复差异 | Agent Loop与ReAct | 未开始 |
| 5 | Agent 架构与 Harness(五)Tool契约与执行 | 非法参数和越权调用在执行前被拒绝 | Agent Loop与ReAct | 未开始 |
| 6 | Agent 架构与 Harness(六)Planning、Router与Skill | 选择理由、步骤、失败重规划和 Skill 加载可解释 | Tool契约与执行 | 未开始 |
| 7 | Agent 架构与 Harness(七)Context组装与状态 | 系统指令、历史、工具和检索内容优先级明确 | Planning、Router与Skill | 未开始 |
| 8 | Agent 架构与 Harness(八)Memory系统 | 项目/全局记忆隔离，错误记忆可修正和删除 | Context组装与状态 | 未开始 |
| 9 | Agent 架构与 Harness(九)MCP协议与资源 | Tools、Resources、Prompts 和授权边界可区分 | Tool契约与执行；Context组装与状态 | 未开始 |
| 10 | Agent 架构与 Harness(十)人工审批与工作流 | 批准、拒绝、修改、暂停和恢复均可审计 | MCP协议与资源 | 未开始 |
| 11 | Agent 架构与 Harness(十一)Subagent编排 | 上下文切片、超时、取消和结果合并可验证 | 人工审批与工作流 | 未开始 |
| 12 | Agent 架构与 Harness(十二)Agent Team与Swarm | 角色、通信、冲突、重复和收敛有独立指标 | Subagent编排 | 未开始 |
| 13 | Agent 架构与 Harness(十三)隔离、权限与沙箱 | 最小权限矩阵在本地沙箱中生效 | 人工审批与工作流；Tool契约与执行 | 未开始 |
| 14 | Agent 架构与 Harness(十四)恢复、幂等与取消 | checkpoint、幂等键和取消传播均可复测 | 隔离、权限与沙箱 | 未开始 |
| 15 | Agent 架构与 Harness(十五)观测、评测与运维 | Run/Turn/Tool/Model 关系可定位，回归可报警 | 恢复、幂等与取消 | 未开始 |
| 16 | Agent 架构与 Harness(十六)项目实战 | 实现一个带工具、MCP、审批、记忆、Subagent、隔离和恢复机制的本地 Harness。 | 本系列前置主题文章（不含本篇） | 未开始 |

## 开始学习

{% note primary flat %}
先完成环境检查，再从《Agent 架构与 Harness(二)Agent与Workflow》开始。练习应保留输入、命令、输出、失败分类和复测条件；不要把在线调用结果当作本地实验的必需条件。
{% endnote %}

## 参考资料

### 安全规范

{% linkgroup %}
{% link Model Context Protocol Specification, https://modelcontextprotocol.io/specification/2025-06-18, https://modelcontextprotocol.io/favicon.ico %}
{% link OWASP Top 10 for Agentic Applications 2026, https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/, https://genai.owasp.org/favicon.ico %}
{% link NIST AI RMF, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

### 源码框架

{% linkgroup %}
{% link awesome-llm-apps 案例库, https://github.com/Shubhamsaboo/awesome-llm-apps/tree/11a4bc330e4b0b1509577db4581c5cfbcf6ea6a0, https://github.com/favicon.ico %}
{% endlinkgroup %}

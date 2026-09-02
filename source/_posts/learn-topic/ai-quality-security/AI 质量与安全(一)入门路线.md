---
title: "AI 质量与安全(一)入门路线"
tags:
  - AI 质量与安全
categories:
  - Learn Topic
  - AI 质量与安全
description: "为 LLM、RAG、Agent 和 Coding Agent 建立可重复的质量、安全、评测和生产治理体系。"
cover: /img/picgo-images/ai-quality-security-course-cover.png
series: "AI 质量与安全"
series_order: 1
published: true
abbrlink: 24f13287
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
为 LLM、RAG、Agent 和 Coding Agent 建立可重复的质量、安全、评测和生产治理体系。

课程范围：质量模型与数据、统计、评分与轨迹、安全攻击与防护、生产治理与测试资产。正式文章分别通过图解、实验和可观察证据完成学习闭环。
{% endnote %}

## 前置条件

{% note info flat %}
建议具备 Python 3、命令行、Git 和基本 HTTP/JSON 能力；缺少的部分在相关阶段补齐。所有实验优先使用本地夹具，真实服务仅由读者显式配置。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  P1[质量模型与数据]
  P2[统计、评分与轨迹]
  P3[安全攻击与防护]
  P4[生产治理与测试资产]
  P1 --> P2
  P2 --> P3
  P3 --> P4
{% endmermaid %}

{% note info flat %}
按阶段顺序阅读：质量模型与数据 → 统计、评分与轨迹 → 安全攻击与防护 → 生产治理与测试资产。每篇以实验输出或验收表判断是否可以继续。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | AI 质量与安全(一)入门路线 | 为 LLM、RAG、Agent 和 Coding Agent 建立可重复的质量、安全、评测和生产治理体系。 | 无 | 入口 |
| 2 | AI 质量与安全(二)质量模型与验收 | 结果质量、过程质量、安全和人工责任分开验收 | 大模型应用开发：可靠性、成本与观测 | 未开始 |
| 3 | AI 质量与安全(三)Benchmark与数据集 | 污染、泄漏和代表性有明确检查 | 质量模型与验收 | 未开始 |
| 4 | AI 质量与安全(四)指标、统计与实验 | 结论说明样本量和不确定性 | Benchmark与数据集 | 未开始 |
| 5 | AI 质量与安全(五)LLM Judge与评分器 | Judge 分歧和漂移可发现 | 指标、统计与实验 | 未开始 |
| 6 | AI 质量与安全(六)Agent轨迹与长任务 | 能区分计划、工具、恢复和结果失败 | LLM Judge与评分器 | 未开始 |
| 7 | AI 质量与安全(七)RAG评测 | 分别证明召回、上下文利用、引用正确性、答案支持和噪声敏感性 | 大模型应用开发(十二)RAG与引用；AI 质量与安全(五)LLM Judge与评分器 | 未开始 |
| 8 | AI 质量与安全(八)Memory评测 | 分别证明记忆准确性、时效性、隔离、选择性遗忘和删除后的行为 | Agent 架构与 Harness(八)Memory系统；AI 质量与安全(五)LLM Judge与评分器；AI 质量与安全(六)Agent轨迹与长任务 | 未开始 |
| 9 | AI 质量与安全(九)多Agent评测 | 分别衡量协调、通信、冲突、重复工作、个体贡献和任务成功 | Agent 架构与 Harness(十一)Subagent编排；Agent 架构与 Harness(十二)Agent Team与Swarm；AI 质量与安全(五)LLM Judge与评分器 | 未开始 |
| 10 | AI 质量与安全(十)Coding Agent评测 | 代码行为、可维护性和安全行为分别可验收 | Agent轨迹与长任务 | 未开始 |
| 11 | AI 质量与安全(十一)Prompt Injection | 不可信输入不能覆盖约束或触发高风险工具 | 质量模型与验收；Agent轨迹与长任务 | 未开始 |
| 12 | AI 质量与安全(十二)Tool Poisoning与供应链 | 描述、代码、依赖和外发路径均被审查 | Prompt Injection；Agent 架构与 Harness：MCP协议与资源 | 未开始 |
| 13 | AI 质量与安全(十三)身份、权限与沙箱 | Agent 身份不等于用户全部权限 | Tool Poisoning与供应链 | 未开始 |
| 14 | AI 质量与安全(十四)隐私、数据与Memory安全 | 输入、缓存、日志和记忆的生命周期可审计 | 身份、权限与沙箱 | 未开始 |
| 15 | AI 质量与安全(十五)红队与故障响应 | 事件证据、责任、通知和恢复动作完整 | 隐私、数据与Memory安全 | 未开始 |
| 16 | AI 质量与安全(十六)生产观测与治理 | 模型/Prompt/Tool/Skill 变更可追踪和回滚 | 红队与故障响应 | 未开始 |
| 17 | AI 质量与安全(十七)AI辅助测试与资产验收 | 测试资产可执行、可维护、误报可见 | Coding Agent评测；生产观测与治理 | 未开始 |
| 18 | AI 质量与安全(十八)项目实战 | 为一个 Agent 应用建立评测集、安全测试、轨迹审计和 CI 门禁。 | 完成全部主题文章 | 未开始 |

## 开始学习

{% note primary flat %}
先完成环境检查，再从《AI 质量与安全(二)质量模型与验收》开始。练习应保留输入、命令、输出、失败分类和复测条件；不要把在线调用结果当作本地实验的必需条件。
{% endnote %}

## 参考资料

### 安全规范

{% linkgroup %}
{% link OWASP Top 10 for LLM Applications 2025, https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/, https://genai.owasp.org/favicon.ico %}
{% link OWASP Top 10 for Agentic Applications 2026, https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/, https://genai.owasp.org/favicon.ico %}
{% link MCP Security Quickstart Resources, https://github.com/modelcontextprotocol/quickstart-resources/blob/main/SECURITY.md, https://github.com/favicon.ico %}
{% link NIST AI RMF, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

### 源码框架

{% linkgroup %}
{% link lm-evaluation-harness, https://github.com/EleutherAI/lm-evaluation-harness/tree/c1b3b3a33e0e17bcb329a3e4dc7825b77cb5d373, https://github.com/favicon.ico %}
{% endlinkgroup %}

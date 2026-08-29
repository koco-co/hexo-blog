---
title: Agent 安全(一)入门路线
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 建立身份、授权、隔离、提示注入、协议、数据、供应链、多 Agent 与审计响应的安全测试体系。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 1
published: true
abbrlink: 62b7fb68
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
建立身份、授权、隔离、提示注入、协议、数据、供应链、多 Agent 与审计响应的安全测试体系。

毕业成果：交付双租户 Fake Agent 的安全证据：威胁模型、权限矩阵、对抗样本、审计、撤销和恢复。
{% endnote %}

## 前置条件

{% note info flat %}
已有 Python、Shell、HTTP、Git、数据库、CI/CD 和接口测试基础；模型训练与算法数学只补齐应用开发和测试所需的直觉。课程使用合成夹具优先，真实服务和付费 API 不作为脚手架门槛。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[共同基础] --> B[Agent 安全]
  B --> C[实验与验收]
  C --> D[项目交付]
{% endmermaid %}

{% note info flat %}
按共同基础、主线工程、质量安全和项目交付推进。每篇文章都把输入、操作、失败边界和验收证据作为学习结果。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Agent 安全(一)入门路线 | 说明Agent 安全的范围、前置、阅读顺序与毕业成果。 | — | 入口 |
| 2 | Agent 安全(二)威胁建模 | 以资产、边界、攻击者和风险为起点建模 Agent，而不是只列危险词。 | F01 | 未开始 |
| 3 | Agent 安全(三)身份与授权 | 分清认证、授权、审批、委派和撤销，确保调用参数与身份绑定。 | F02 | 未开始 |
| 4 | Agent 安全(四)隔离与执行 | 用沙箱、允许列表、资源上限和网络边界控制工具执行。 | F02、D09 | 未开始 |
| 5 | Agent 安全(五)提示注入防御 | 识别直接、间接、数据源和工具描述中的注入，并把拒答与安全执行分开。 | F03、C03 | 未开始 |
| 6 | Agent 安全(六)工具与协议安全 | 测试 MCP、OAuth、代理、句柄、会话和上游授权的独立边界。 | F03、F05、C09 | 未开始 |
| 7 | Agent 安全(七)数据与记忆安全 | 守住租户、文档、检索、记忆、canary、撤销和删除的边界。 | F03、F05、C06、C07 | 未开始 |
| 8 | Agent 安全(八)供应链安全 | 检查组件清单、版本、签名、校验和、权限与依赖更新。 | F03、B09、D05 | 未开始 |
| 9 | Agent 安全(九)多Agent安全 | 验证委派、消息、审批、身份和级联失败在多 Agent 场景下仍受控。 | F03、C10 | 未开始 |
| 10 | Agent 安全(十)安全测试设计 | 把安全测试写成有分母、Oracle、良性对照和风险分类的实验。 | F04、F05、F06、F07、F08、E03、E05 | 未开始 |
| 11 | Agent 安全(十一)审计与事件响应 | 让审计轨迹支持撤销、停止、恢复和责任追踪，同时控制敏感数据暴露。 | F10、D11 | 未开始 |
| 12 | Agent 安全(十二)项目实战 | 交付双租户安全测试项目，覆盖权限、注入、隔离、数据和审计响应。 | F11 | 未开始 |

## 开始学习

{% note primary flat %}
先完成路线自检，再从《Agent 安全(二)威胁建模》开始。实验优先使用 FakeProvider、Fake HTTP、Fake tool 或合成仓库；完成一篇后保留命令、输出、失败分类和复跑条件。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link OWASP GenAI Security Project, https://genai.owasp.org/, https://genai.owasp.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% link Model Context Protocol authorization, https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization, https://modelcontextprotocol.io/favicon.ico %}
{% endlinkgroup %}

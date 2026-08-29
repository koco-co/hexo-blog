---
title: Agent 质量工程(一)入门路线
tags:
  - Agent 质量
categories:
  - Learn Topic
  - Agent 质量工程
description: 建立从质量模型、数据、Oracle、实验、Trace 到持续评测和上线门禁的 Agent 质量工程。
cover: /img/picgo-images/agent-quality-course-cover.png
series: Agent 质量工程
series_order: 1
published: true
abbrlink: 97c440bc
date: 2026-08-29 00:00:00
---

{% course_series %}

## 课程目标

{% note info flat %}
建立从质量模型、数据、Oracle、实验、Trace 到持续评测和上线门禁的 Agent 质量工程。

毕业成果：交付一套可复跑的 Agent 评测系统，包含数据集、评分器、统计报告、故障注入、在线回归和发布门禁。
{% endnote %}

## 前置条件

{% note info flat %}
已有 Python、Shell、HTTP、Git、数据库、CI/CD 和接口测试基础；模型训练与算法数学只补齐应用开发和测试所需的直觉。课程使用合成夹具优先，真实服务和付费 API 不作为脚手架门槛。
{% endnote %}

## 学习路径

{% mermaid %}
flowchart TD
  A[共同基础] --> B[Agent 质量工程]
  B --> C[实验与验收]
  C --> D[项目交付]
{% endmermaid %}

{% note info flat %}
按共同基础、主线工程、质量安全和项目交付推进。每篇文章都把输入、操作、失败边界和验收证据作为学习结果。
{% endnote %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | Agent 质量工程(一)入门路线 | 说明Agent 质量工程的范围、前置、阅读顺序与毕业成果。 | — | 入口 |
| 2 | Agent 质量工程(二)质量建模 | 把 Agent 质量拆成结果、组件、体验、性能和风险维度，并建立硬门槛。 | E01 | 未开始 |
| 3 | Agent 质量工程(三)评测任务设计 | 为 Agent 写清状态、允许动作、完成条件和独立 Oracle。 | E02 | 未开始 |
| 4 | Agent 质量工程(四)数据治理 | 治理来源、授权、切分、标签、版本和合成数据的代表性。 | E03 | 未开始 |
| 5 | Agent 质量工程(五)统计与实验 | 用重复试验、区间、依赖性和 pass@k 解释 Agent 结果。 | E03、E04 | 未开始 |
| 6 | Agent 质量工程(六)评分器校准 | 校准 LLM judge、人工标签、Unknown、顺序效应和一致性。 | E04、E05、A05 | 未开始 |
| 7 | Agent 质量工程(七)组件与协议契约 | 为模型、Prompt、上下文、工具、MCP 和业务集成分别定义契约。 | E03、A05、C03、C09、A07 | 未开始 |
| 8 | Agent 质量工程(八)评测运行器 | 实现隔离、重置、预算、超时、重放和结果收集。 | E07、D03、D06 | 未开始 |
| 9 | Agent 质量工程(九)评测系统校验 | 测试 runner、grader、聚合和错误分类本身，避免评测系统成为黑盒。 | E06、E08 | 未开始 |
| 10 | Agent 质量工程(十)Trace与归因 | 从 Trace 找到第一处偏差，并用控制变量验证归因。 | E08、E09、D03 | 未开始 |
| 11 | Agent 质量工程(十一)RAG评测 | 分层评估召回、事实、忠实度和引用支持，不混用指标。 | E04、E06、E10、C06 | 未开始 |
| 12 | Agent 质量工程(十二)多轮与长任务评测 | 评估纠正、撤销、暂停、恢复和用户体验，而不是只看单轮答案。 | E06、E10、C07、C08 | 未开始 |
| 13 | Agent 质量工程(十三)多Agent评测 | 比较多 Agent 团队与单体基线，覆盖交接、投票、委派和级联失败。 | E10、E12、C10 | 未开始 |
| 14 | Agent 质量工程(十四)Coding Agent评测 | 评估代码修改、提交、隐藏回归和测试篡改风险。 | E07、E09、E10、B07 | 未开始 |
| 15 | Agent 质量工程(十五)交互Agent评测 | 评估浏览器或计算机操作的可见状态、慢响应、阻断和真实业务结果。 | E10、E12、C11 | 未开始 |
| 16 | Agent 质量工程(十六)性能与成本 | 评估并发、缓存、尾延迟、任务成功成本和资源占用。 | E05、E10、D10 | 未开始 |
| 17 | Agent 质量工程(十七)故障与恢复评测 | 在 provider、环境、Agent 和副作用提交窗口注入故障，评估恢复而非简单重跑。 | E07、E08、E10、D08 | 未开始 |
| 18 | Agent 质量工程(十八)持续评测 | 把离线、canary、在线 SLO、回滚和事故复盘连接起来。 | E09、E10、E16、E17 | 未开始 |
| 19 | Agent 质量工程(十九)项目实战 | 交付含三类故障、RAG、多轮和评测系统自测的完整质量证据包。 | E18、E11、E12 | 未开始 |

## 开始学习

{% note primary flat %}
先完成路线自检，再从《Agent 质量工程(二)质量建模》开始。实验优先使用 FakeProvider、Fake HTTP、Fake tool 或合成仓库；完成一篇后保留命令、输出、失败分类和复跑条件。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link OpenAI evaluation guide, https://platform.openai.com/docs/guides/evals, https://platform.openai.com/favicon.ico %}
{% link OpenAI evaluation best practices, https://platform.openai.com/docs/guides/evals-best-practices, https://platform.openai.com/favicon.ico %}
{% link MLflow evaluation documentation, https://mlflow.org/docs/latest/genai/eval-monitor/, https://mlflow.org/favicon.ico %}
{% endlinkgroup %}

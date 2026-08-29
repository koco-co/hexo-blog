---
title: Agent 安全(四)隔离与执行
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能区分黑名单、dry-run 和真正的 host isolation。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 4
published: true
abbrlink: a00c2389
date: 2026-08-10 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：用沙箱、允许列表、资源上限和网络边界控制工具执行。 最终要留下：能区分黑名单、dry-run 和真正的 host isolation。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 文件边界

{% note primary flat %}
执行隔离至少覆盖文件、进程、网络和资源；黑名单和 dry-run 是策略，不是 host isolation。 在“文件边界”这一环节负责定义：先固定file，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| file | 路径允许列表 | 拒绝越界 | 不能只禁一个词 |
| process | 命令、用户、信号 | 父子边界 | 不能共享全部权限 |
| network | 域名、端口、出口 | 默认拒绝 | 不能只断 DNS |
| 定义边界 | 文件边界 | Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中。 | 没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[file]
  F --> A[文件边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「file」设为「路径允许列表」，同时固定「process」为「命令、用户、信号」；记录输入、状态和结果，记录拒绝越界。
- 只改变「network」：正常值用「域名、端口、出口」，越界或故障按“不能只断 DNS”构造；观察父子边界，不要改动其余输入。
- 用默认拒绝检查“文件边界”：Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 进程边界

{% note info flat %}
执行隔离至少覆盖文件、进程、网络和资源；黑名单和 dry-run 是策略，不是 host isolation。 在“进程边界”这一环节负责执行：先固定process，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：进程边界**
1. 入口：process=命令、用户、信号，先记录父子边界。
2. 转移：由network=域名、端口、出口进入进程边界，只允许声明的动作。
3. 出口：用超限停止检查quota，越界条件是“不能无限消耗”。
{% endnote %}

- 执行正常路径：把「process」设为「命令、用户、信号」，同时固定「network」为「域名、端口、出口」；记录输入、状态和结果，记录父子边界。
- 只改变「quota」：正常值用「CPU、内存、时间」，越界或故障按“不能无限消耗”构造；观察默认拒绝，不要改动其余输入。
- 用超限停止检查“进程边界”：Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 网络边界

{% note info flat %}
执行隔离至少覆盖文件、进程、网络和资源；黑名单和 dry-run 是策略，不是 host isolation。 在“网络边界”这一环节负责故障：先固定network，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：域名、端口、出口 | network | 默认拒绝 | 不能只断 DNS |
| 边界：CPU、内存、时间 | quota | 超限停止 | 不能无限消耗 |
| 故障：路径允许列表 | file | 拒绝越界 | 不能只禁一个词 |

- 注入边界：把「network」设为「域名、端口、出口」，同时固定「quota」为「CPU、内存、时间」；记录输入、状态和结果，记录默认拒绝。
- 只改变「file」：正常值用「路径允许列表」，越界或故障按“不能只禁一个词”构造；观察超限停止，不要改动其余输入。
- 用拒绝越界检查“网络边界”：Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 资源限制

{% note info flat %}
执行隔离至少覆盖文件、进程、网络和资源；黑名单和 dry-run 是策略，不是 host isolation。 在“资源限制”这一环节负责复核：先固定quota，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（资源限制）：输入为「CPU、内存、时间」；状态观察为「拒绝越界」；独立判定使用「父子边界」。记录Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中，把“没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
requests=[("file","read_ticket"),("process","pytest"),("network","api.example"),("quota","cpu")]
allowed={("file","read_ticket")}
decisions=["allow" if r in allowed else "deny" for r in requests]
print({"requests":requests,"decisions":decisions})
assert decisions==["allow","deny","deny","deny"]
# 预期观察：Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中。
```

{% note success flat %}
失败边界：没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。 对 Fake executor 验证允许和拒绝的文件、进程、网络和资源。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f04-blacklist-not-sandbox deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
“资源限制”的课程边界中，为什么“黑名单”不是“沙箱”？
--- answer
黑名单只能拦截已知字符串，沙箱还要限制文件、进程、网络和资源边界。
--- explanation
执行隔离至少覆盖文件、进程、网络和资源；黑名单和 dry-run 是策略，不是 host isolation。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中。没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。
{% endflashcard %}

{% flashcard basic id:f04-dry-run-not-isolation deck:"Agent 安全" priority:1 tags:"Agent 安全,测试开发" %}
--- question
“资源限制”的课程边界中，为什么“dry-run”不是“隔离”？
--- answer
dry-run 只是不提交动作，不能替代操作系统级权限、进程和网络隔离。
--- explanation
执行隔离至少覆盖文件、进程、网络和资源；黑名单和 dry-run 是策略，不是 host isolation。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存Fake executor 验证允许/拒绝文件、进程、网络和资源请求，并记录策略命中。没有内核或容器边界时只能称策略模拟；dry-run 不证明真实隔离。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OWASP GenAI Security Project, https://genai.owasp.org/, https://genai.owasp.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

---
title: Coding Agent(十)工具集成与扩展
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 10
published: true
abbrlink: d569f9a
date: 2026-07-14 12:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：理解 Skill、CLI、MCP 和扩展的职责边界，并为调用保留可审查契约。 最终要留下：能用只读 Fake MCP/CLI/Skill 完成一次边界清晰的工具链。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 扩展边界

{% note primary flat %}
CLI、MCP、Skill 和扩展都是不同层的工具入口；适配器要暴露调用者、权限、输入和结果，而不是隐藏副作用。 在“扩展边界”这一环节负责定义：先固定layer，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| layer | 命令/协议/技能 | 调用边界 | 不能混称 |
| input | schema 与参数 | 拒绝非法形状 | 不能靠提示校验 |
| result | stdout、stderr、退出码 | 可解析证据 | 不能吞错误 |
| 定义边界 | 扩展边界 | 用 Fake CLI、只读 MCP 和 Skill 串一条链，分别记录调用层和失败层。 | 工具能被调用不表示拥有写权限；写操作仍需显式授权和结果复查。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[layer]
  F --> A[扩展边界]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「layer」设为「命令/协议/技能」，同时固定「input」为「schema 与参数」；记录输入、状态和结果，记录调用边界。
- 只改变「result」：正常值用「stdout、stderr、退出码」，越界或故障按“不能吞错误”构造；观察拒绝非法形状，不要改动其余输入。
- 用可解析证据检查“扩展边界”：用 Fake CLI、只读 MCP 和 Skill 串一条链，分别记录调用层和失败层；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：工具能被调用不表示拥有写权限；写操作仍需显式授权和结果复查。 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 工具契约

{% note info flat %}
CLI、MCP、Skill 和扩展都是不同层的工具入口；适配器要暴露调用者、权限、输入和结果，而不是隐藏副作用。 在“工具契约”这一环节负责执行：先固定input，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：工具契约**
1. 入口：input=schema 与参数，先记录拒绝非法形状。
2. 转移：由result=stdout、stderr、退出码进入工具契约，只允许声明的动作。
3. 出口：用调用边界检查layer，越界条件是“不能混称”。
{% endnote %}

- 执行正常路径：把「input」设为「schema 与参数」，同时固定「result」为「stdout、stderr、退出码」；记录输入、状态和结果，记录拒绝非法形状。
- 只改变「layer」：正常值用「命令/协议/技能」，越界或故障按“不能混称”构造；观察可解析证据，不要改动其余输入。
- 用调用边界检查“工具契约”：用 Fake CLI、只读 MCP 和 Skill 串一条链，分别记录调用层和失败层；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：工具能被调用不表示拥有写权限；写操作仍需显式授权和结果复查。 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 只读链路

{% note info flat %}
CLI、MCP、Skill 和扩展都是不同层的工具入口；适配器要暴露调用者、权限、输入和结果，而不是隐藏副作用。 在“只读链路”这一环节负责故障：先固定result，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：stdout、stderr、退出码 | result | 可解析证据 | 不能吞错误 |
| 边界：命令/协议/技能 | layer | 调用边界 | 不能混称 |
| 故障：schema 与参数 | input | 拒绝非法形状 | 不能靠提示校验 |

- 注入边界：把「result」设为「stdout、stderr、退出码」，同时固定「layer」为「命令/协议/技能」；记录输入、状态和结果，记录可解析证据。
- 只改变「input」：正常值用「schema 与参数」，越界或故障按“不能靠提示校验”构造；观察调用边界，不要改动其余输入。
- 用拒绝非法形状检查“只读链路”：用 Fake CLI、只读 MCP 和 Skill 串一条链，分别记录调用层和失败层；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：工具能被调用不表示拥有写权限；写操作仍需显式授权和结果复查。 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 错误降级

{% note info flat %}
CLI、MCP、Skill 和扩展都是不同层的工具入口；适配器要暴露调用者、权限、输入和结果，而不是隐藏副作用。 在“错误降级”这一环节负责复核：先固定layer，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（错误降级）：输入为「命令/协议/技能」；状态观察为「拒绝非法形状」；独立判定使用「可解析证据」。记录用 Fake CLI、只读 MCP 和 Skill 串一条链，分别记录调用层和失败层，把“工具能被调用不表示拥有写权限；写操作仍需显式授权和结果复查。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：用 Fake CLI、只读 MCP 和 Skill 串一条链，分别记录调用层和失败层。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
layers=[{"layer":"cli","name":"lint","ok":True},{"layer":"mcp","name":"read_ticket","ok":True},{"layer":"skill","name":"review","ok":False}]
valid=[x for x in layers if x["ok"]]
print({"called":len(layers),"passed":len(valid),"failed":[x["name"] for x in layers if not x["ok"]],"side_effect":"none"})
assert len(valid)==2
# 预期观察：用 Fake CLI、只读 MCP 和 Skill 串一条链，分别记录调用层和失败层。
```

{% note success flat %}
失败边界：工具能被调用不表示拥有写权限；写操作仍需显式授权和结果复查。 用 Fake MCP 和 CLI 比较发现、调用、输出、权限与失败差异。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b10-why-mcp-cli deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
“错误降级”的课程边界中，为什么 MCP 与 CLI？
--- answer
先把“MCP 与 CLI”绑定到layer与input；正常、越界和 Unknown 各运行一次，断言可解析证据。
--- explanation
在tool夹具中，比较命令/协议/技能与schema 与参数，保留可解析证据；工具能被调用不表示拥有写权限；写操作仍需显式授权和结果复查。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OpenAI Codex documentation, https://developers.openai.com/codex, https://developers.openai.com/favicon.ico %}
{% link Git worktree documentation, https://git-scm.com/docs/git-worktree, https://git-scm.com/favicon.ico %}
{% endlinkgroup %}

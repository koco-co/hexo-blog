---
title: Coding Agent(二)工作区与边界
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能用只读探针确认根目录、文件所有权、权限与隔离状态，再开始任务。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 2
published: false
abbrlink: 88a82a9f
date: 2026-07-10 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：理解 Coding Agent 的工作区、当前目录、权限、脏改动和工具边界。 最终要留下：能用只读探针确认根目录、文件所有权、权限与隔离状态，再开始任务。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 工作区模型

{% note primary flat %}
Coding Agent 先受工作区边界约束：当前目录、可见文件、可写范围、权限和脏改动决定它能否安全行动。 在“工作区模型”这一环节负责定义：先固定cwd，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| cwd | 当前目录与根标记 | 探针输出 | 不能凭提示猜根目录 |
| ownership | 文件责任人 | 允许/禁止写入 | 不能覆盖他人改动 |
| status | 未跟踪、修改、忽略 | 操作前后 diff | 不能把脏改动归因于 Agent |
| 定义边界 | 工作区模型 | 在合成仓库执行只读 cwd、路径、权限和 status 探针，任何写操作前先输出计划。 | 黑名单不是隔离；如果无法确认根目录或文件所有权，应停在只读阶段。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[cwd]
  F --> A[工作区模型]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「cwd」设为「当前目录与根标记」，同时固定「ownership」为「文件责任人」；记录输入、状态和结果，记录探针输出。
- 只改变「status」：正常值用「未跟踪、修改、忽略」，越界或故障按“不能把脏改动归因于 Agent”构造；观察允许/禁止写入，不要改动其余输入。
- 用操作前后 diff检查“工作区模型”：在合成仓库执行只读 cwd、路径、权限和 status 探针，任何写操作前先输出计划；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：黑名单不是隔离；如果无法确认根目录或文件所有权，应停在只读阶段。 对合成仓库执行 cwd、路径、权限和脏文件检查，不改动用户已有文件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 探针检查

{% note info flat %}
Coding Agent 先受工作区边界约束：当前目录、可见文件、可写范围、权限和脏改动决定它能否安全行动。 在“探针检查”这一环节负责执行：先固定ownership，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：探针检查**
1. 入口：ownership=文件责任人，先记录允许/禁止写入。
2. 转移：由status=未跟踪、修改、忽略进入探针检查，只允许声明的动作。
3. 出口：用探针输出检查cwd，越界条件是“不能凭提示猜根目录”。
{% endnote %}

- 执行正常路径：把「ownership」设为「文件责任人」，同时固定「status」为「未跟踪、修改、忽略」；记录输入、状态和结果，记录允许/禁止写入。
- 只改变「cwd」：正常值用「当前目录与根标记」，越界或故障按“不能凭提示猜根目录”构造；观察操作前后 diff，不要改动其余输入。
- 用探针输出检查“探针检查”：在合成仓库执行只读 cwd、路径、权限和 status 探针，任何写操作前先输出计划；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：黑名单不是隔离；如果无法确认根目录或文件所有权，应停在只读阶段。 对合成仓库执行 cwd、路径、权限和脏文件检查，不改动用户已有文件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 权限边界

{% note info flat %}
Coding Agent 先受工作区边界约束：当前目录、可见文件、可写范围、权限和脏改动决定它能否安全行动。 在“权限边界”这一环节负责故障：先固定status，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：未跟踪、修改、忽略 | status | 操作前后 diff | 不能把脏改动归因于 Agent |
| 边界：当前目录与根标记 | cwd | 探针输出 | 不能凭提示猜根目录 |
| 故障：文件责任人 | ownership | 允许/禁止写入 | 不能覆盖他人改动 |

- 注入边界：把「status」设为「未跟踪、修改、忽略」，同时固定「cwd」为「当前目录与根标记」；记录输入、状态和结果，记录操作前后 diff。
- 只改变「ownership」：正常值用「文件责任人」，越界或故障按“不能覆盖他人改动”构造；观察探针输出，不要改动其余输入。
- 用允许/禁止写入检查“权限边界”：在合成仓库执行只读 cwd、路径、权限和 status 探针，任何写操作前先输出计划；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：黑名单不是隔离；如果无法确认根目录或文件所有权，应停在只读阶段。 对合成仓库执行 cwd、路径、权限和脏文件检查，不改动用户已有文件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 脏改动

{% note info flat %}
Coding Agent 先受工作区边界约束：当前目录、可见文件、可写范围、权限和脏改动决定它能否安全行动。 在“脏改动”这一环节负责复核：先固定cwd，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（脏改动）：输入为「当前目录与根标记」；状态观察为「允许/禁止写入」；独立判定使用「操作前后 diff」。记录在合成仓库执行只读 cwd、路径、权限和 status 探针，任何写操作前先输出计划，把“黑名单不是隔离；如果无法确认根目录或文件所有权，应停在只读阶段。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：在合成仓库执行只读 cwd、路径、权限和 status 探针，任何写操作前先输出计划。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
cwd="/repo"
status={"src/api.py":"modified","tests/test_api.py":"clean","notes.txt":"unrelated"}
permissions={"src/api.py":"write","tests/test_api.py":"write","notes.txt":"read"}
allowed={"src/api.py","tests/test_api.py"}
plan=[name for name in status if name in allowed and permissions[name]=="write"]
print({"cwd":cwd,"plan":plan,"untouched":[name for name in status if name not in allowed]})
assert "notes.txt" not in plan
# 预期观察：在合成仓库执行只读 cwd、路径、权限和 status 探针，任何写操作前先输出计划。
```

{% note success flat %}
失败边界：黑名单不是隔离；如果无法确认根目录或文件所有权，应停在只读阶段。 对合成仓库执行 cwd、路径、权限和脏文件检查，不改动用户已有文件。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link OpenAI Codex documentation, https://developers.openai.com/codex, https://developers.openai.com/favicon.ico %}
{% link Git worktree documentation, https://git-scm.com/docs/git-worktree, https://git-scm.com/favicon.ico %}
{% endlinkgroup %}

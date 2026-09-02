---
title: Coding Agent(六)增量修改与重构
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能说明每一处改动的目的，避免顺手重写无关代码。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 6
published: false
abbrlink: e2b223a
date: 2026-07-12 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：在保持无关脏改动和文件所有权的前提下完成最小修改。 最终要留下：能说明每一处改动的目的，避免顺手重写无关代码。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 最小补丁

{% note primary flat %}
增量修改追求最小 diff：先锁定责任行，再保持无关格式、文件和用户脏改动不变。 在“最小补丁”这一环节负责定义：先固定patch，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| patch | 目标行与上下文 | diff 最小 | 不能顺手重构 |
| ownership | 已有改动 | 前后对照 | 不能覆盖 |
| rollback | 单步撤销 | 可恢复 | 不能只靠备份文件 |
| 定义边界 | 最小补丁 | 在合成仓库对一个分支做最小补丁，比较改前后 diff，并确认无关文件哈希不变。 | 如果补丁影响范围扩大，应回退候选并重新拆分；格式化全仓库不是默认动作。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[patch]
  F --> A[最小补丁]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「patch」设为「目标行与上下文」，同时固定「ownership」为「已有改动」；记录输入、状态和结果，记录diff 最小。
- 只改变「rollback」：正常值用「单步撤销」，越界或故障按“不能只靠备份文件”构造；观察前后对照，不要改动其余输入。
- 用可恢复检查“最小补丁”：在合成仓库对一个分支做最小补丁，比较改前后 diff，并确认无关文件哈希不变；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：如果补丁影响范围扩大，应回退候选并重新拆分；格式化全仓库不是默认动作。 对合成缺陷做小步修改，故意保留无关 dirty change 并核对 diff。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 重构边界

{% note info flat %}
增量修改追求最小 diff：先锁定责任行，再保持无关格式、文件和用户脏改动不变。 在“重构边界”这一环节负责执行：先固定ownership，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：重构边界**
1. 入口：ownership=已有改动，先记录前后对照。
2. 转移：由rollback=单步撤销进入重构边界，只允许声明的动作。
3. 出口：用diff 最小检查patch，越界条件是“不能顺手重构”。
{% endnote %}

- 执行正常路径：把「ownership」设为「已有改动」，同时固定「rollback」为「单步撤销」；记录输入、状态和结果，记录前后对照。
- 只改变「patch」：正常值用「目标行与上下文」，越界或故障按“不能顺手重构”构造；观察可恢复，不要改动其余输入。
- 用diff 最小检查“重构边界”：在合成仓库对一个分支做最小补丁，比较改前后 diff，并确认无关文件哈希不变；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：如果补丁影响范围扩大，应回退候选并重新拆分；格式化全仓库不是默认动作。 对合成缺陷做小步修改，故意保留无关 dirty change 并核对 diff。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 脏改动保护

{% note info flat %}
增量修改追求最小 diff：先锁定责任行，再保持无关格式、文件和用户脏改动不变。 在“脏改动保护”这一环节负责故障：先固定rollback，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：单步撤销 | rollback | 可恢复 | 不能只靠备份文件 |
| 边界：目标行与上下文 | patch | diff 最小 | 不能顺手重构 |
| 故障：已有改动 | ownership | 前后对照 | 不能覆盖 |

- 注入边界：把「rollback」设为「单步撤销」，同时固定「patch」为「目标行与上下文」；记录输入、状态和结果，记录可恢复。
- 只改变「ownership」：正常值用「已有改动」，越界或故障按“不能覆盖”构造；观察diff 最小，不要改动其余输入。
- 用前后对照检查“脏改动保护”：在合成仓库对一个分支做最小补丁，比较改前后 diff，并确认无关文件哈希不变；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：如果补丁影响范围扩大，应回退候选并重新拆分；格式化全仓库不是默认动作。 对合成缺陷做小步修改，故意保留无关 dirty change 并核对 diff。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 回退点

{% note info flat %}
增量修改追求最小 diff：先锁定责任行，再保持无关格式、文件和用户脏改动不变。 在“回退点”这一环节负责复核：先固定patch，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（回退点）：输入为「目标行与上下文」；状态观察为「前后对照」；独立判定使用「可恢复」。记录在合成仓库对一个分支做最小补丁，比较改前后 diff，并确认无关文件哈希不变，把“如果补丁影响范围扩大，应回退候选并重新拆分；格式化全仓库不是默认动作。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：在合成仓库对一个分支做最小补丁，比较改前后 diff，并确认无关文件哈希不变。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
before={"src/api.py":"old","tests/test_api.py":"stable","README.md":"keep"}
after={**before,"src/api.py":"fixed"}
changed=[k for k in after if before[k]!=after[k]]
print({"changed":changed,"untouched":[k for k in after if k not in changed]})
assert changed==["src/api.py"]
# 预期观察：在合成仓库对一个分支做最小补丁，比较改前后 diff，并确认无关文件哈希不变。
```

{% note success flat %}
失败边界：如果补丁影响范围扩大，应回退候选并重新拆分；格式化全仓库不是默认动作。 对合成缺陷做小步修改，故意保留无关 dirty change 并核对 diff。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 参考资料

{% linkgroup %}
{% link OpenAI Codex documentation, https://developers.openai.com/codex, https://developers.openai.com/favicon.ico %}
{% link Git worktree documentation, https://git-scm.com/docs/git-worktree, https://git-scm.com/favicon.ico %}
{% endlinkgroup %}

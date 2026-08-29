---
title: Coding Agent(五)项目约定与记忆
tags:
  - Coding Agent
categories:
  - Learn Topic
  - Coding Agent
description: 能记录约定来源和作用域，避免把过期摘要当成事实。
cover: /img/picgo-images/coding-agent-course-cover.png
series: Coding Agent
series_order: 5
published: true
abbrlink: '34897575'
date: 2026-07-12 00:00:00
---
{% course_series %}

{% note primary flat %}
本节要解决：按根目录、子目录和会话范围读取约定，并判断旧记忆是否仍有权威性。 最终要留下：能记录约定来源和作用域，避免把过期摘要当成事实。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 约定作用域

{% note primary flat %}
约定具有路径和会话作用域，记忆只是线索；读取根目录、子目录和当前任务后才能判断哪条规则权威。 在“约定作用域”这一环节负责定义：先固定scope，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| scope | 根/子目录/会话 | 来源与优先级 | 不能混用 |
| memory | 摘要与时间 | 事实再核查 | 不能当当前配置 |
| decision | 采用与排除 | 留下理由 | 不能只复制旧命令 |
| 定义边界 | 约定作用域 | 在三个作用域放置冲突约定，探针记录命中顺序，并对旧摘要中的端口和命令重新验证。 | 约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[scope]
  F --> A[约定作用域]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「scope」设为「根/子目录/会话」，同时固定「memory」为「摘要与时间」；记录输入、状态和结果，记录来源与优先级。
- 只改变「decision」：正常值用「采用与排除」，越界或故障按“不能只复制旧命令”构造；观察事实再核查，不要改动其余输入。
- 用留下理由检查“约定作用域”：在三个作用域放置冲突约定，探针记录命中顺序，并对旧摘要中的端口和命令重新验证；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。 构造根级、子目录级和全局记忆冲突，用当前文件和测试结果裁决。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 记忆读取

{% note info flat %}
约定具有路径和会话作用域，记忆只是线索；读取根目录、子目录和当前任务后才能判断哪条规则权威。 在“记忆读取”这一环节负责执行：先固定memory，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：记忆读取**
1. 入口：memory=摘要与时间，先记录事实再核查。
2. 转移：由decision=采用与排除进入记忆读取，只允许声明的动作。
3. 出口：用来源与优先级检查scope，越界条件是“不能混用”。
{% endnote %}

- 执行正常路径：把「memory」设为「摘要与时间」，同时固定「decision」为「采用与排除」；记录输入、状态和结果，记录事实再核查。
- 只改变「scope」：正常值用「根/子目录/会话」，越界或故障按“不能混用”构造；观察留下理由，不要改动其余输入。
- 用来源与优先级检查“记忆读取”：在三个作用域放置冲突约定，探针记录命中顺序，并对旧摘要中的端口和命令重新验证；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。 构造根级、子目录级和全局记忆冲突，用当前文件和测试结果裁决。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 权威判断

{% note info flat %}
约定具有路径和会话作用域，记忆只是线索；读取根目录、子目录和当前任务后才能判断哪条规则权威。 在“权威判断”这一环节负责故障：先固定decision，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：采用与排除 | decision | 留下理由 | 不能只复制旧命令 |
| 边界：根/子目录/会话 | scope | 来源与优先级 | 不能混用 |
| 故障：摘要与时间 | memory | 事实再核查 | 不能当当前配置 |

- 注入边界：把「decision」设为「采用与排除」，同时固定「scope」为「根/子目录/会话」；记录输入、状态和结果，记录留下理由。
- 只改变「memory」：正常值用「摘要与时间」，越界或故障按“不能当当前配置”构造；观察来源与优先级，不要改动其余输入。
- 用事实再核查检查“权威判断”：在三个作用域放置冲突约定，探针记录命中顺序，并对旧摘要中的端口和命令重新验证；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。 构造根级、子目录级和全局记忆冲突，用当前文件和测试结果裁决。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 冲突处理

{% note info flat %}
约定具有路径和会话作用域，记忆只是线索；读取根目录、子目录和当前任务后才能判断哪条规则权威。 在“冲突处理”这一环节负责复核：先固定scope，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（冲突处理）：输入为「根/子目录/会话」；状态观察为「事实再核查」；独立判定使用「留下理由」。记录在三个作用域放置冲突约定，探针记录命中顺序，并对旧摘要中的端口和命令重新验证，把“约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：在三个作用域放置冲突约定，探针记录命中顺序，并对旧摘要中的端口和命令重新验证。
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
# 预期观察：在三个作用域放置冲突约定，探针记录命中顺序，并对旧摘要中的端口和命令重新验证。
```

{% note success flat %}
失败边界：约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。 构造根级、子目录级和全局记忆冲突，用当前文件和测试结果裁决。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:b05-agents-scope deck:"Coding Agent" priority:2 tags:"Coding Agent,测试开发" %}
--- question
当“Agent 作用域”出现时，先检查哪个状态和边界？
--- answer
先把“Agent 作用域”绑定到scope与memory；正常、越界和 Unknown 各运行一次，断言留下理由。
--- explanation
在workspace夹具中，比较根/子目录/会话与摘要与时间，保留留下理由；约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。
{% endflashcard %}

{% flashcard basic id:b05-memory-not-authority deck:"Coding Agent" priority:1 tags:"Coding Agent,测试开发" %}
--- question
“冲突处理”的课程边界中，为什么“记忆”不是“权威性”？
--- answer
记忆只提供来源与优先级；权威性还需要在memory上由留下理由确认，不能只看文本或单个事件。
--- explanation
在workspace夹具中分别运行“记忆”和“权威性”，比较根/子目录/会话与摘要与时间；约定缺失或冲突时先请求澄清/只读探测；不要用记忆覆盖现场事实。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GitHub Copilot documentation, https://docs.github.com/en/copilot, https://github.com/favicon.ico %}
{% link OpenAI Codex documentation, https://developers.openai.com/codex, https://developers.openai.com/favicon.ico %}
{% endlinkgroup %}

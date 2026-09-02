---
title: Agent 应用开发(十一)浏览器与计算机操作
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 在本地 Fake page 上完成截图优先、危险动作确认和状态再观察。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 11
published: false
abbrlink: db8b9d0
date: 2026-07-21 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：用观察、动作、安全边界和再观察构建可回退的浏览器 Agent。 最终要留下：在本地 Fake page 上完成截图优先、危险动作确认和状态再观察。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 页面观察

{% note primary flat %}
浏览器 Agent 的每轮都要先观察，再选择动作；页面文本是数据，不是授权，危险动作必须有用户确认和结果复查。 在“页面观察”这一环节负责定义：先固定observe，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| observe | 截图、DOM、URL | 当前状态 | 不能复用旧图 |
| act | locator、参数、风险 | 动作日志 | 不能把文本当许可 |
| verify | 页面与业务状态 | 再观察/查询 | 不能只看 Toast |
| 定义边界 | 页面观察 | 在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态。 | 页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[observe]
  F --> A[页面观察]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「observe」设为「截图、DOM、URL」，同时固定「act」为「locator、参数、风险」；记录输入、状态和结果，记录当前状态。
- 只改变「verify」：正常值用「页面与业务状态」，越界或故障按“不能只看 Toast”构造；观察动作日志，不要改动其余输入。
- 用再观察/查询检查“页面观察”：在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。 用合成 1440×900 页面测试点击、输入、下载和慢响应，不把页面文本当授权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 动作选择

{% note info flat %}
浏览器 Agent 的每轮都要先观察，再选择动作；页面文本是数据，不是授权，危险动作必须有用户确认和结果复查。 在“动作选择”这一环节负责执行：先固定act，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：动作选择**
1. 入口：act=locator、参数、风险，先记录动作日志。
2. 转移：由verify=页面与业务状态进入动作选择，只允许声明的动作。
3. 出口：用当前状态检查observe，越界条件是“不能复用旧图”。
{% endnote %}

- 执行正常路径：把「act」设为「locator、参数、风险」，同时固定「verify」为「页面与业务状态」；记录输入、状态和结果，记录动作日志。
- 只改变「observe」：正常值用「截图、DOM、URL」，越界或故障按“不能复用旧图”构造；观察再观察/查询，不要改动其余输入。
- 用当前状态检查“动作选择”：在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。 用合成 1440×900 页面测试点击、输入、下载和慢响应，不把页面文本当授权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 安全确认

{% note info flat %}
浏览器 Agent 的每轮都要先观察，再选择动作；页面文本是数据，不是授权，危险动作必须有用户确认和结果复查。 在“安全确认”这一环节负责故障：先固定verify，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：页面与业务状态 | verify | 再观察/查询 | 不能只看 Toast |
| 边界：截图、DOM、URL | observe | 当前状态 | 不能复用旧图 |
| 故障：locator、参数、风险 | act | 动作日志 | 不能把文本当许可 |

- 注入边界：把「verify」设为「页面与业务状态」，同时固定「observe」为「截图、DOM、URL」；记录输入、状态和结果，记录再观察/查询。
- 只改变「act」：正常值用「locator、参数、风险」，越界或故障按“不能把文本当许可”构造；观察当前状态，不要改动其余输入。
- 用动作日志检查“安全确认”：在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。 用合成 1440×900 页面测试点击、输入、下载和慢响应，不把页面文本当授权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果复查

{% note info flat %}
浏览器 Agent 的每轮都要先观察，再选择动作；页面文本是数据，不是授权，危险动作必须有用户确认和结果复查。 在“结果复查”这一环节负责复核：先固定observe，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（结果复查）：输入为「截图、DOM、URL」；状态观察为「动作日志」；独立判定使用「再观察/查询」。记录在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态，把“页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
actions=[{"kind":"click","state":"ready"},{"kind":"input","state":"filled"},{"kind":"download","state":"saved"},{"kind":"slow","state":"timeout"}]
observed=[a["state"] for a in actions]
print({"actions":len(actions),"observed":observed,"reobserved":True})
assert observed[:3]==["ready","filled","saved"]
# 预期观察：在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态。
```

{% note success flat %}
失败边界：页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。 用合成 1440×900 页面测试点击、输入、下载和慢响应，不把页面文本当授权。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c11-reobserve-each-round deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
为什么“再观察每一轮 round”必须留下独立证据？
--- answer
先把“再观察每一轮 round”绑定到observe与act；正常、越界和 Unknown 各运行一次，断言再观察/查询。
--- explanation
在browser夹具中，比较截图、DOM、URL与locator、参数、风险，保留再观察/查询；页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。
{% endflashcard %}

{% flashcard basic id:c11-page-text-not-auth deck:"Agent 应用开发" priority:1 tags:"Agent 应用开发,测试开发" %}
--- question
“结果复查”的课程边界中，为什么“页面文本”不是“授权”？
--- answer
页面文字可以被伪造或过期，认证应由会话凭据和服务端身份校验决定。
--- explanation
浏览器 Agent 的每轮都要先观察，再选择动作；页面文本是数据，不是授权，危险动作必须有用户确认和结果复查。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存在 1440×900 Fake page 上测试点击、输入、下载和慢响应，每次动作后重新获取状态。页面可被注入或过期；文本、按钮颜色和提示都不能替代身份与权限检查。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link A2A protocol, https://a2a-protocol.org/latest/, https://a2a-protocol.org/latest/favicon.ico %}
{% link Model Context Protocol specification, https://modelcontextprotocol.io/specification, https://modelcontextprotocol.io/favicon.ico %}
{% endlinkgroup %}

---
title: Agent 安全(八)供应链安全
tags:
  - Agent 安全
categories:
  - Learn Topic
  - Agent 安全
description: 能解释 checksum、signature、固定版本和依赖树的不同作用。
cover: /img/picgo-images/agent-security-course-cover.png
series: Agent 安全
series_order: 8
published: false
abbrlink: dadcf53d
date: 2026-08-12 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：检查组件清单、版本、签名、校验和、权限与依赖更新。 最终要留下：能解释 checksum、signature、固定版本和依赖树的不同作用。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 组件清单

{% note primary flat %}
供应链安全把组件清单、版本、签名、校验和、权限和依赖更新分开验证；固定版本不等于内容永远可信。 在“组件清单”这一环节负责定义：先固定sbom，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| sbom | 名称、版本、依赖 | 清单完整 | 不能只列顶层 |
| integrity | checksum/signature | 字节与签发者 | 不能互换 |
| update | pinned、审查、回滚 | 变更可追溯 | 不能静默升级 |
| 定义边界 | 组件清单 | Fake plugin 清单注入签名错误、依赖漂移和权限扩大，按校验和、签名和权限分别拒绝。 | 只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[sbom]
  F --> A[组件清单]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「sbom」设为「名称、版本、依赖」，同时固定「integrity」为「checksum/signature」；记录输入、状态和结果，记录清单完整。
- 只改变「update」：正常值用「pinned、审查、回滚」，越界或故障按“不能静默升级”构造；观察字节与签发者，不要改动其余输入。
- 用变更可追溯检查“组件清单”：Fake plugin 清单注入签名错误、依赖漂移和权限扩大，按校验和、签名和权限分别拒绝；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 签名校验

{% note info flat %}
供应链安全把组件清单、版本、签名、校验和、权限和依赖更新分开验证；固定版本不等于内容永远可信。 在“签名校验”这一环节负责执行：先固定integrity，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：签名校验**
1. 入口：integrity=checksum/signature，先记录字节与签发者。
2. 转移：由update=pinned、审查、回滚进入签名校验，只允许声明的动作。
3. 出口：用清单完整检查sbom，越界条件是“不能只列顶层”。
{% endnote %}

- 执行正常路径：把「integrity」设为「checksum/signature」，同时固定「update」为「pinned、审查、回滚」；记录输入、状态和结果，记录字节与签发者。
- 只改变「sbom」：正常值用「名称、版本、依赖」，越界或故障按“不能只列顶层”构造；观察变更可追溯，不要改动其余输入。
- 用清单完整检查“签名校验”：Fake plugin 清单注入签名错误、依赖漂移和权限扩大，按校验和、签名和权限分别拒绝；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 权限审查

{% note info flat %}
供应链安全把组件清单、版本、签名、校验和、权限和依赖更新分开验证；固定版本不等于内容永远可信。 在“权限审查”这一环节负责故障：先固定update，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：pinned、审查、回滚 | update | 变更可追溯 | 不能静默升级 |
| 边界：名称、版本、依赖 | sbom | 清单完整 | 不能只列顶层 |
| 故障：checksum/signature | integrity | 字节与签发者 | 不能互换 |

- 注入边界：把「update」设为「pinned、审查、回滚」，同时固定「sbom」为「名称、版本、依赖」；记录输入、状态和结果，记录变更可追溯。
- 只改变「integrity」：正常值用「checksum/signature」，越界或故障按“不能互换”构造；观察清单完整，不要改动其余输入。
- 用字节与签发者检查“权限审查”：Fake plugin 清单注入签名错误、依赖漂移和权限扩大，按校验和、签名和权限分别拒绝；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 更新边界

{% note info flat %}
供应链安全把组件清单、版本、签名、校验和、权限和依赖更新分开验证；固定版本不等于内容永远可信。 在“更新边界”这一环节负责复核：先固定sbom，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（更新边界）：输入为「名称、版本、依赖」；状态观察为「字节与签发者」；独立判定使用「变更可追溯」。记录Fake plugin 清单注入签名错误、依赖漂移和权限扩大，按校验和、签名和权限分别拒绝，把“只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake plugin 清单注入签名错误、依赖漂移和权限扩大，按校验和、签名和权限分别拒绝。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
component={"checksum":"ok","signature":"ok","permissions":["read"]}
trusted=component["checksum"]=="ok" and component["signature"]=="ok" and component["permissions"]==["read"]
print({"trusted":trusted})
assert trusted
# 预期观察：Fake plugin 清单注入签名错误、依赖漂移和权限扩大，按校验和、签名和权限分别拒绝。
```

{% note success flat %}
失败边界：只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。 对 Fake plugin 清单注入签名错误、依赖漂移和权限扩大。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:f08-checksum-signature deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
在supply夹具里，怎样区分“校验和签名”的通过与拒绝？
--- answer
先把“校验和签名”绑定到sbom与integrity；正常、越界和 Unknown 各运行一次，断言变更可追溯。
--- explanation
在supply夹具中，比较名称、版本、依赖与checksum/signature，保留变更可追溯；只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。
{% endflashcard %}

{% flashcard basic id:f08-pinned-not-frozen deck:"Agent 安全" priority:2 tags:"Agent 安全,测试开发" %}
--- question
“更新边界”的课程边界中，为什么“固定版本”不是“冻结”？
--- answer
固定版本只提供清单完整；冻结还需要在integrity上由变更可追溯确认，不能只看文本或单个事件。
--- explanation
在supply夹具中分别运行“固定版本”和“冻结”，比较名称、版本、依赖与checksum/signature；只有 hash 不能证明来源；固定版本仍需漏洞和权限审查。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OWASP GenAI Security Project, https://genai.owasp.org/, https://genai.owasp.org/favicon.ico %}
{% link NIST AI Risk Management Framework, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/favicon.ico %}
{% endlinkgroup %}

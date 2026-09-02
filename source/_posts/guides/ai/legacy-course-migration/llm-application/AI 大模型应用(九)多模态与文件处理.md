---
title: AI 大模型应用(九)多模态与文件处理
tags:
  - 大模型应用
categories:
  - Learn Topic
  - AI 大模型应用
description: 用小型截图和两页 PDF 完成可重复输入，并记录 URL、base64、file_id、裁剪和偏移边界。
cover: /img/picgo-images/llm-application-course-cover.png
series: AI 大模型应用
series_order: 9
published: false
abbrlink: ea3d2cfe
date: 2026-07-07 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把截图和 PDF 的输入、引用、截取、限制和结果检查串成证据链。 最终要留下：用小型截图和两页 PDF 完成可重复输入，并记录 URL、base64、file_id、裁剪和偏移边界。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 输入方式

{% note primary flat %}
多模态输入的证据链包含 MIME、大小、页码或裁剪、引用和结果检查；文件能被上传不代表内容已被正确理解。 在“输入方式”这一环节负责定义：先固定metadata，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| metadata | mime、bytes、pages | 输入可复现 | 不能把文件名当内容 |
| region | 页码、坐标、裁剪 | 引用可定位 | 不能丢偏移 |
| result | 文本、框和置信 | 人工/规则复查 | 不能仅看描述 |
| 定义边界 | 输入方式 | 用小截图和两页 PDF 记录输入元数据、页码偏移和裁剪框，错误文件走同一拒绝分支。 | 大文件、空页、错误 MIME 和权限失效必须有降级；外部 file id 不能写进公开日志。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[metadata]
  F --> A[输入方式]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「metadata」设为「mime、bytes、pages」，同时固定「region」为「页码、坐标、裁剪」；记录输入、状态和结果，记录输入可复现。
- 只改变「result」：正常值用「文本、框和置信」，越界或故障按“不能仅看描述”构造；观察引用可定位，不要改动其余输入。
- 用人工/规则复查检查“输入方式”：用小截图和两页 PDF 记录输入元数据、页码偏移和裁剪框，错误文件走同一拒绝分支；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：大文件、空页、错误 MIME 和权限失效必须有降级；外部 file id 不能写进公开日志。 用合成截图和 PDF 覆盖尺寸、页数、裁剪偏移和无法读取嵌入内容的情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 文件限制

{% note info flat %}
多模态输入的证据链包含 MIME、大小、页码或裁剪、引用和结果检查；文件能被上传不代表内容已被正确理解。 在“文件限制”这一环节负责执行：先固定region，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：文件限制**
1. 入口：region=页码、坐标、裁剪，先记录引用可定位。
2. 转移：由result=文本、框和置信进入文件限制，只允许声明的动作。
3. 出口：用输入可复现检查metadata，越界条件是“不能把文件名当内容”。
{% endnote %}

- 执行正常路径：把「region」设为「页码、坐标、裁剪」，同时固定「result」为「文本、框和置信」；记录输入、状态和结果，记录引用可定位。
- 只改变「metadata」：正常值用「mime、bytes、pages」，越界或故障按“不能把文件名当内容”构造；观察人工/规则复查，不要改动其余输入。
- 用输入可复现检查“文件限制”：用小截图和两页 PDF 记录输入元数据、页码偏移和裁剪框，错误文件走同一拒绝分支；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：大文件、空页、错误 MIME 和权限失效必须有降级；外部 file id 不能写进公开日志。 用合成截图和 PDF 覆盖尺寸、页数、裁剪偏移和无法读取嵌入内容的情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 结果证据

{% note info flat %}
多模态输入的证据链包含 MIME、大小、页码或裁剪、引用和结果检查；文件能被上传不代表内容已被正确理解。 在“结果证据”这一环节负责故障：先固定result，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：文本、框和置信 | result | 人工/规则复查 | 不能仅看描述 |
| 边界：mime、bytes、pages | metadata | 输入可复现 | 不能把文件名当内容 |
| 故障：页码、坐标、裁剪 | region | 引用可定位 | 不能丢偏移 |

- 注入边界：把「result」设为「文本、框和置信」，同时固定「metadata」为「mime、bytes、pages」；记录输入、状态和结果，记录人工/规则复查。
- 只改变「region」：正常值用「页码、坐标、裁剪」，越界或故障按“不能丢偏移”构造；观察输入可复现，不要改动其余输入。
- 用引用可定位检查“结果证据”：用小截图和两页 PDF 记录输入元数据、页码偏移和裁剪框，错误文件走同一拒绝分支；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：大文件、空页、错误 MIME 和权限失效必须有降级；外部 file id 不能写进公开日志。 用合成截图和 PDF 覆盖尺寸、页数、裁剪偏移和无法读取嵌入内容的情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 练习复盘

{% note info flat %}
多模态输入的证据链包含 MIME、大小、页码或裁剪、引用和结果检查；文件能被上传不代表内容已被正确理解。 在“练习复盘”这一环节负责复核：先固定metadata，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（练习复盘）：输入为「mime、bytes、pages」；状态观察为「引用可定位」；独立判定使用「人工/规则复查」。记录用小截图和两页 PDF 记录输入元数据、页码偏移和裁剪框，错误文件走同一拒绝分支，把“大文件、空页、错误 MIME 和权限失效必须有降级；外部 file id 不能写进公开日志。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：用小截图和两页 PDF 记录输入元数据、页码偏移和裁剪框，错误文件走同一拒绝分支。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
files=[{"name":"shot.png","mime":"image/png","bytes":800,"page":1},{"name":"report.pdf","mime":"application/pdf","bytes":1200,"page":2},{"name":"bad.exe","mime":"application/x-msdownload","bytes":1200,"page":0}]
accepted=[f for f in files if f["mime"] in {"image/png","application/pdf"} and f["bytes"]<5000]
regions=[{"page":f["page"],"crop":(0,0,100,100)} for f in accepted]
print({"accepted":len(accepted),"rejected":len(files)-len(accepted),"regions":regions})
assert len(accepted)==2 and len(regions)==2
# 预期观察：用小截图和两页 PDF 记录输入元数据、页码偏移和裁剪框，错误文件走同一拒绝分支。
```

{% note success flat %}
失败边界：大文件、空页、错误 MIME 和权限失效必须有降级；外部 file id 不能写进公开日志。 用合成截图和 PDF 覆盖尺寸、页数、裁剪偏移和无法读取嵌入内容的情况。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:a09-visual-result-needs-inspection deck:"AI 大模型应用" priority:2 tags:"AI 大模型应用,测试开发" %}
--- question
为什么视觉输入结果必须绑定inspection？
--- answer
没有inspection时，视觉输入结果可能在超时、撤销或预算耗尽后继续产生不可控结果；两者要在同一个策略中验收。
--- explanation
测试正常和越界两条路径，保留截止时间、剩余预算和最终状态。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Anthropic API documentation, https://docs.anthropic.com/en/docs/intro, https://docs.anthropic.com/favicon.ico %}
{% link Gemini API documentation, https://ai.google.dev/gemini-api/docs, https://ai.google.dev/favicon.ico %}
{% endlinkgroup %}

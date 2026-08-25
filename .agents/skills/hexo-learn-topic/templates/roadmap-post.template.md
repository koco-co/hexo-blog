---
title: "{{主题}}(一)入门路线"
tags:
  - {{主题标签}}
categories:
  - Learn Topic
  - {{主题名称}}
description: "{{说明课程目标、范围和阅读顺序的具体摘要}}"
cover: /img/picgo-images/{{主题路径段}}-course-cover.png
series: "{{主题系列名}}"
series_order: 1
published: true
date: {{YYYY-MM-DD HH:mm:ss}}
---

{% course_series %}

## 这条路线解决什么问题

{{学习成果、零基础基线和范围。}}

## 开始前需要什么

{{硬前置、随课补齐和拓展知识。}}

## 学习阶段

{% mermaid %}
{{用 Mermaid 呈现阶段、依赖和完成判断。仅在不超过 4 个短主链节点时使用 LR；节点多、分支多或标签长时使用 TD/TB。}}
{% endmermaid %}

## 文章地图

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| {{序号}} | {{未发布时为纯文本标题，发布后改为文章链接}} | {{职责}} | {{前置}} | 未开始 |

## 如何使用这套课程

{{阅读顺序、自测方式、代码验证和继续学习方法。}}

## 常见问题

{% flashcard basic id:{{稳定唯一ID}} deck:"{{单一卡组}}" priority:{{1|2|3}} tags:"{{标签}}" %}
--- question
{{路线选择、阅读顺序或课程边界问题。}}
--- answer
{{精简回答。}}
--- explanation
{{详细解析。}}
{% endflashcard %}

## 参考资料

{{主要官方资料、目标版本或 Commit 和已知缺口。}}

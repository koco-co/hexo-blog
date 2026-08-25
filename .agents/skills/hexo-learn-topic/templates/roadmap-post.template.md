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

## 课程目标

{% note info flat %}
{{学习成果、零基础基线和范围。}}
{% endnote %}

## 前置条件

{% note info flat %}
{{硬前置、随课补齐和拓展知识。}}
{% endnote %}

## 学习路径

{% mermaid %}
{{用 Mermaid 呈现阶段、依赖和完成判断。仅在不超过 4 个短主链节点时使用 LR；节点多、分支多或标签长时使用 TD/TB。}}
{% endmermaid %}

## 文章安排

| 顺序 | 文章 | 解决的问题 | 前置 | 状态 |
| --- | --- | --- | --- | --- |
| {{序号}} | {{未发布时为纯文本标题，发布后改为文章链接}} | {{职责}} | {{前置}} | 未开始 |

## 开始学习

{% note info flat %}
{{阅读顺序、自测方式、代码验证和继续学习方法。}}
{% endnote %}

## 参考资料

{% linkgroup %}
{% link {{资料名称}}, {{HTTP(S)目标地址}}, {{同域或同组织官方图标地址}} %}
{% endlinkgroup %}

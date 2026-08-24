---
title: 闪卡跨文章引用预览
date: 2026-08-24 10:00:00
description: 在另一篇 Hexo 内容中按稳定 ID 引用已有闪卡，并与本页新题共同进入复习队列。
type: page
comments: false
aside: false
flashcard_deck: HTTP 基础
---

本页直接引用[闪卡插件效果预览](/flashcard-demo/)中的 `demo-http-404`，题目、回答和解析仍只在原始页面维护一份。

{% flashcard_ref id="demo-http-404" %}

{% flashcard basic id:demo-http-503 tags:"状态码,服务端错误" %}
--- question
HTTP 状态码 **503** 表示什么？
--- answer
服务器暂时无法处理请求。
--- explanation
`503 Service Unavailable` 表示服务器当前无法处理请求，常见原因包括临时过载或维护。服务端可以通过 `Retry-After` 响应头提示客户端稍后重试。

### 参考资料

- [MDN：503 Service Unavailable](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Status/503)
{% endflashcard %}

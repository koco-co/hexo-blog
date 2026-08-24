---
title: 闪卡插件效果预览
date: 2026-08-23 08:00:00
description: 在文章内阅读闪卡，并在学习中心按间隔重复复习。
type: page
comments: false
aside: false
flashcard_deck: HTTP 基础
---

{% flashcard basic id:demo-http-404 tags:"状态码,客户端错误" %}
--- question
HTTP 状态码 **404** 表示什么？
--- answer
服务器找不到请求的资源。
--- explanation
`404 Not Found` 表示服务器找不到请求的资源，常见原因包括 URL 错误、资源已删除或资源已移动。

### 参考资料

- [MDN：404 Not Found](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Status/404)

### 进阶阅读

- [MDN：HTTP 响应状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Status)
{% endflashcard %}

{% flashcard cloze id:demo-http-cache tags:"缓存,响应头" %}
--- question
HTTP 强缓存通常由 [[Cache-Control]] 响应头控制。
--- answer
Cache-Control
--- explanation
`Cache-Control` 用来声明浏览器和中间缓存的缓存策略，例如：

```http
Cache-Control: public, max-age=3600
```

| 指令 | 含义 |
| --- | --- |
| `max-age` | 响应可复用的最长时间 |
| `no-cache` | 使用前必须重新验证 |
{% endflashcard %}

{% flashcard choice id:demo-http-success tags:"状态码,成功响应" answer:A %}
--- question
哪个 HTTP 状态码通常表示请求成功？
- [A] 200
- [B] 404
- [C] 500
--- answer
200 OK
--- explanation
`200 OK` 表示请求成功。响应内容取决于请求方法，例如 `GET` 通常返回资源，`POST` 通常返回操作结果。

### 参考资料

- [MDN：200 OK](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Status/200)
{% endflashcard %}

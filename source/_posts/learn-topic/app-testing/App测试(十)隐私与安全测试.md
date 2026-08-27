---
title: App测试(十)隐私与安全测试
tags:
  - App测试
  - 隐私与安全测试
categories:
  - Learn Topic
  - App测试
description: 以最小权限、敏感数据、网络边界和组件暴露为主线，建立 Android App 的隐私与安全回归证据。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 10
published: true
abbrlink: 3ee984a8
date: 2026-08-26 00:00:00
---

{% note danger flat %}
功能通过不等于隐私安全通过。测试要证明 App 只请求必要权限、敏感数据不被不当保存或输出、网络和 WebView 边界明确，失败时还能给出安全的恢复路径。
{% endnote %}

{% course_series %}

## 权限最小化

{% mermaid %}
flowchart TD
  A[用户任务] --> B[需要的能力]
  B --> C[声明权限]
  C --> D[运行时请求]
  D --> E[最小数据用途]
  D -->|拒绝| F[安全降级]
  C -->|多余权限| G[隐私风险]
{% endmermaid %}

{% note info flat %}
图失效时仍按用户任务→能力→声明→运行时请求→数据用途检查。每项权限都要能回答“哪个功能需要、什么时候请求、拒绝后怎么办、何时释放或撤回”。
{% endnote %}

### 权限清单

| 权限 | 业务用途 | 请求时机 | 拒绝路径 |
| --- | --- | --- | --- |
| 相机 | 扫码或拍照 | 用户进入扫码入口 | 手动输入或返回 |
| 位置 | 附近设备或地图 | 用户启用定位功能 | 手动选择区域 |
| 通知 | 业务提醒 | 用户开启提醒 | App 内查看状态 |
| 存储/媒体 | 导入或导出 | 用户选择文件 | 显示失败原因 |
| 麦克风 | 录音或通话 | 用户开始录制 | 禁止开始并说明 |

{% note warning flat %}
不要在首次启动一次性索取所有权限。权限清单中的用途、时机和拒绝路径必须能在产品需求、代码和测试证据之间互相回指。
{% endnote %}

## 敏感数据

### 数据分类

| 数据 | 示例 | 存储边界 | 测试要求 |
| --- | --- | --- | --- |
| 身份凭据 | Token、Cookie、密码 | 受保护存储或内存 | 日志和截图不得出现 |
| 个人信息 | 手机号、地址、头像 | 最小字段和访问范围 | 测试账号脱敏 |
| 业务秘密 | 订单、草稿、内部标记 | 按角色授权 | 退出后不可残留 |
| 设备标识 | 序列号、广告标识 | 明确用途和生命周期 | 缺陷中只留必要片段 |
| 调试资料 | 日志、bugreport、录屏 | 受控证据目录 | 交付前扫描和删除 |

### 生命周期

1. 在输入、缓存、上传、展示、分享和删除节点标记数据流。
2. 验证退出、卸载、清除数据和会话过期后的残留。
3. 搜索日志、截图、剪贴板和错误报告中的敏感字段。
4. 对必须保留的字段说明用途、保留时间和访问角色。

{% note danger flat %}
任何测试工具都可能扩大数据暴露面。不要把真实用户凭据、真实订单或生产 bugreport 带入实验；使用可重置账号并在交付前执行脱敏检查。
{% endnote %}

## 网络边界

### 传输保护

| 检查 | 证据 | 风险 |
| --- | --- | --- |
| HTTPS 与证书 | 请求日志、证书链或代理结果 | 中间人或降级 |
| 主机校验 | 配置和失败行为 | 误连测试/生产服务 |
| 敏感参数 | URL、Header、Body 对照 | Token 出现在 URL 或日志 |
| 重试与缓存 | 失败、重试和离线数据 | 重复提交或旧数据泄露 |
| 调试代理 | 测试专用配置 | 发布包错误开启抓包 |

{% note warning flat %}
代理抓包只在授权的测试环境和账号中进行。若为了抓包关闭证书校验，要把它标为测试配置，并确认发布构建不会继承。
{% endnote %}

### 网络失败

1. 在离线、超时、证书错误和主机不可达时观察提示。
2. 确认错误不会回显完整请求、Token 或内部堆栈。
3. 检查重试是否幂等，恢复后不会创建重复业务。
4. 将请求、响应和日志按时间线脱敏保存。

## WebView 边界

| 边界 | 需要确认 | 失败表现 |
| --- | --- | --- |
| 原生到 Web | 允许的域名和参数 | 任意链接可被加载 |
| JS Bridge | 暴露的方法和权限 | 未授权页面调用敏感能力 |
| Cookie | 会话范围和清理 | 退出后仍可访问 |
| 文件/相机 | 授权和来源 | Web 内容越权读取 |
| 调试开关 | 仅测试构建启用 | 发布包可被远程调试 |

{% note danger flat %}
WebView 不是普通文本控件。测试同时检查导航白名单、桥接接口、会话清理和调试配置；遇到跨域、重定向或外部内容时先收紧边界再继续。
{% endnote %}

## 组件暴露

### 入口检查

| 组件 | 核对项 | 安全结果 |
| --- | --- | --- |
| Activity | exported、Intent 参数和权限 | 未授权入口被拒绝 |
| Service | 调用方和生命周期 | 外部不能启动敏感任务 |
| BroadcastReceiver | action、权限和数据 | 不接受伪造广播 |
| ContentProvider | URI、读写权限和路径 | 只暴露必要数据 |
| Deep Link | scheme、host 和参数 | 会话和授权仍有效 |

### 外部调用

~~~bash
adb -s "<serial>" shell am start -W -a android.intent.action.VIEW -d "demo://example/item/1"
adb -s "<serial>" shell dumpsys package com.example.demo
~~~

{% note warning flat %}
外部入口测试使用无害参数和专用账号。能被外部打开不代表应该允许访问业务数据，进入后仍需重新做身份、授权和参数校验。
{% endnote %}

## 隐私回归

### 权限与日志实验

1. 从干净安装进入需要权限的功能，分别选择允许和拒绝。
2. 在拒绝状态执行一次失败路径，采集最小 logcat 和页面证据。
3. 搜索权限名、Token、邮箱、手机号和业务 ID 等敏感模式。
4. 清除数据并退出账号，再检查日志、缓存、剪贴板和导出文件。
5. 记录发现、脱敏动作和复验结果。

| 阶段 | 通过条件 | 证据 |
| --- | --- | --- |
| 请求 | 只在业务需要时出现 | 权限时机截图 |
| 使用 | 数据用途与功能一致 | 页面和请求 |
| 拒绝 | 有安全降级和恢复 | 失败路径录屏 |
| 退出 | 会话和敏感缓存清理 | 前后状态 |
| 交付 | 工件已脱敏并受控 | 清单与复核人 |

{% note success flat %}
隐私回归的结果应是“权限/数据/边界/证据”四元组，而不是泛化的“安全通过”。未覆盖的边界要写清下一次复验条件。
{% endnote %}

## 测试边界

| 活动 | 本课程可做 | 需要另行授权 |
| --- | --- | --- |
| 测试账号与本地设备 | 可重复的功能和权限验证 | 真实生产账号 |
| 代理与日志 | 授权环境中的最小采集 | 生产流量拦截 |
| 组件调用 | 自有 APK 和测试数据 | 第三方应用或服务 |
| 漏洞验证 | 低风险确认与报告 | 破坏性利用、越权扩散 |
| 证据交付 | 脱敏后的最小工件 | 原始个人数据外发 |

{% note warning flat %}
发现疑似漏洞时停止扩大影响，保存最小证据并按团队安全流程上报。课程中的命令用于自有测试包，不授权对第三方目标进行探测或利用。
{% endnote %}

## 常见问题

{% flashcard basic id:app-testing-permission-minimization deck:"App测试" priority:1 tags:"隐私,权限" %}
--- question
怎样判断一个权限请求是否符合最小化原则？
--- answer
它必须对应明确的用户任务，在实际需要时请求，并提供可用的拒绝与恢复路径。
--- explanation
运行时权限是 Android 在访问相机、定位等敏感能力前提供的系统授权门。检查权限用途、请求时机、数据范围和拒绝行为；首次启动不应一次性索取无关权限，拒绝后也不能通过空对象、循环弹窗或隐藏入口迫使用户授权。用代码确认声明了什么、用系统状态确认实际授予什么，再走一遍用户旅程确认拒绝后仍有可理解的替代或恢复路径。
{% endflashcard %}

{% flashcard basic id:app-testing-security-boundary deck:"App测试" priority:1 tags:"安全,边界" %}
--- question
为什么 Deep Link 或 WebView 能打开页面，不代表安全边界正确？
--- answer
入口可达性与身份、授权、参数校验和会话隔离是不同问题。
--- explanation
Deep Link 是从外部 URL 或 Intent 进入 App 的入口；WebView 是 App 内嵌的网页容器；Intent 是 Android 组件之间传递请求和数据的消息。它们能打开页面只证明入口可达，不能证明调用者有权访问数据。外部 Intent、重定向和 WebView 内容都应视为不可信输入，进入后仍要验证登录状态、资源归属、允许域名、桥接方法和退出清理；只证明页面显示会遗漏越权和数据残留。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Android 隐私与安全, https://developer.android.com/quality/privacy-and-security, https://developer.android.com/favicon.ico %}
{% link Android 权限, https://developer.android.com/guide/topics/permissions/overview, https://developer.android.com/favicon.ico %}
{% link Android 应用链接, https://developer.android.com/training/app-links, https://developer.android.com/favicon.ico %}
{% link OWASP MASVS, https://mas.owasp.org/MASVS/, https://owasp.org/favicon.ico %}
{% endlinkgroup %}

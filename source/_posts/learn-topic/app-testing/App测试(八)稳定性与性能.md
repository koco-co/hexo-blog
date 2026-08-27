---
title: App测试(八)稳定性与性能
tags:
  - App测试
  - 稳定性与性能
categories:
  - Learn Topic
  - App测试
description: 用可重复的基线、采样和证据判断 Android App 的启动、渲染、资源与稳定性回归。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 8
published: true
abbrlink: 50d100b7
date: 2026-08-26 00:00:00
---

{% note primary flat %}
性能测试的产物不是一串漂亮数字，而是带有设备、构建、数据、温度、电量和采样条件的比较结论。稳定性测试则要把崩溃、无响应和资源耗尽分开观察。
{% endnote %}

{% course_series %}

## 测量边界

{% note info flat %}
先固定测量问题：要判断启动变慢、滚动掉帧、内存增长，还是长时间运行后的崩溃。不同问题需要不同工具、预热方式和停止条件，不能用一个总耗时覆盖所有性能结论。
{% endnote %}

| 问题 | 主要指标 | 最小条件 | 证据 |
| --- | --- | --- | --- |
| 启动 | cold/warm start、首帧 | 固定安装与数据起点 | 启动日志和时间 |
| 渲染 | 帧耗时、丢帧、卡顿 | 固定列表与滚动动作 | gfxinfo 或录屏 |
| 内存 | PSS、峰值、增长斜率 | 固定任务循环 | meminfo 快照 |
| 电量 | 消耗趋势、温度 | 真机、固定亮度网络 | 电池统计和时长 |
| 稳定性 | Crash、ANR、异常退出 | 长时间或事件运行 | logcat、报告和计数 |

## 稳定性指标

### 事件分类

| 类别 | 判定线索 | 处置 |
| --- | --- | --- |
| Crash | 未处理异常、native signal、进程退出 | 保存堆栈并关联触发输入 |
| ANR | 关键线程在期限内无响应 | 保存 traces、操作窗口和系统提示 |
| OOM | 分配失败或进程被杀 | 关联内存曲线与数据规模 |
| 业务失败 | 进程仍在，状态或响应错误 | 转功能/数据缺陷，不混为崩溃 |
| 环境失败 | 设备断连、脚本异常或资源不足 | 先修复环境再计算稳定性 |

{% note warning flat %}
长时间运行的失败率必须区分“每次事件失败”和“测试环境失败”。设备断连、脚本中止或无效输入不能计入 App 稳定性分母。
{% endnote %}

## 启动性能

{% mermaid %}
flowchart LR
  A[安装与清理] --> B[冷启动]
  B --> C[首屏可见]
  C --> D[主旅程可交互]
  D --> E[预热后重启]
  E --> F[比较冷/热启动]
  F -->|异常| G[回到构建与日志]
{% endmermaid %}

{% note info flat %}
冷启动包含进程、资源和初始化成本，热启动可能复用任务和缓存。图失效时仍按安装清理→启动→首屏→可交互→预热重启→比较的顺序执行。
{% endnote %}

~~~bash
target="<serial>"
package="com.example.demo"
adb -s "$target" shell am force-stop "$package"
adb -s "$target" shell am start -W -n "$package/.MainActivity"
adb -s "$target" shell am force-stop "$package"
adb -s "$target" shell am start -W -n "$package/.MainActivity"
~~~

### 启动定义

| 定义 | 起点 | 终点 | 不能混用 |
| --- | --- | --- | --- |
| 冷启动 | 进程不存在 | 首屏达到可交互条件 | 只看 Activity 创建时间 |
| 温启动 | 进程存在但 Activity 重建 | 首屏可交互 | 当作冷启动基线 |
| 热启动 | 任务仍在前台或后台 | 回到可交互页面 | 当作首次安装体验 |

{% note warning flat %}
启动时间要配合首屏可用性。一个很快但仍在转圈的页面不应算作完成；把终点写成可观察的业务条件，才能让不同运行比较同一件事。
{% endnote %}

## 渲染性能

### 帧与滚动

| 场景 | 动作 | 观察点 | 结果 |
| --- | --- | --- | --- |
| 长列表 | 从顶部滚到底部再返回 | 卡顿、空白和位置跳动 | 录屏与帧统计 |
| 图片列表 | 重复进入和退出 | 解码、缓存和内存增长 | 前后 meminfo |
| 动画过渡 | 快速切换页面 | 丢帧和交互阻塞 | gfxinfo 与操作时间 |
| 输入联动 | 连续输入触发过滤 | 主线程阻塞和延迟 | 输入到结果时间 |

### 渲染证据

~~~bash
target="<serial>"
package="com.example.demo"
adb -s "$target" shell dumpsys gfxinfo "$package" reset
adb -s "$target" shell input swipe 500 1500 500 300 700
adb -s "$target" shell dumpsys gfxinfo "$package" framestats
~~~

{% note info flat %}
帧统计要和同一段操作、设备刷新率、动画设置关联。单次偶发尖峰先记录，不要仅凭一条数字判定回归；重复采样后再比较分布。
{% endnote %}

## 资源消耗

### 内存

1. 记录进入任务前的 PSS 和进程状态。
2. 固定数据量重复执行打开、滚动、返回和再次进入。
3. 在相同节点采集 PSS，画出峰值和增长趋势。
4. 清理任务后确认内存是否回落，区分缓存与泄漏候选。

### 其他资源

| 资源 | 变量 | 需要控制 |
| --- | --- | --- |
| CPU | 后台任务、解码和计算 | 设备温度、后台应用 |
| 电量 | 网络、定位、屏幕和传感器 | 亮度、充电和网络 |
| 存储 | 缓存、下载和数据库 | 初始可用空间 |
| 网络 | 重试、轮询和大文件 | 链路、代理和时间 |
| 温度 | 长时间高负载 | 真机外壳和环境温度 |

{% note warning flat %}
资源消耗结论必须写清采样时长和设备状态。模拟器的 CPU、电量和传感器结果不能直接替代真机结论。
{% endnote %}

## 基线实验

{% note primary flat %}
先建立同一设备、同一构建、同一数据起点的基线，再比较候选版本。每次实验至少重复三轮，记录中位数、离散程度和失败样本，保留原始输出。
{% endnote %}

| 轮次 | 起点 | 操作 | 记录 |
| --- | --- | --- | --- |
| 预热 | 安装后首次启动 | 完成主旅程一次 | 不计入正式样本 |
| 1 | 清理并冷启动 | 启动、滚动、返回 | 时间、帧、PSS |
| 2 | 相同起点 | 重复同一动作 | 同字段 |
| 3 | 相同起点 | 重复同一动作 | 同字段 |
| 复验 | 发现异常样本 | 固定输入再次运行 | 是否可复现 |

### 重复采样

~~~text
for each build:
  reset device and app state
  warm up once
  repeat the same journey three times
  save raw metrics and failure artifacts
  compare median and spread with baseline
~~~

{% note info flat %}
只比较平均值容易掩盖长尾卡顿。把样本按冷/热、设备和场景分组，并单独保留异常轮次，才能定位是普遍回归还是一次性环境噪声。
{% endnote %}

## 回归判断

| 判断 | 证据组合 | 结论 |
| --- | --- | --- |
| 指标变差且可复现 | 同条件多轮超过项目阈值 | 阻断或进入性能修复 |
| 指标变差但不可复现 | 只有单次异常 | 补采样、检查环境 |
| 指标不变但出现 ANR | 稳定性证据更强 | 按 ANR 门禁处理 |
| 指标改善但功能失败 | 业务结果错误 | 不得以性能改善放行 |
| 设备单点异常 | 同系统基线正常 | 归类兼容性并补测 |

{% note success flat %}
性能门禁应使用项目定义的阈值和趋势，不把示例数字当成跨设备通用标准。没有可靠基线时，结论应为“数据不足”，而不是默认通过。
{% endnote %}

## 常见问题

{% flashcard basic id:app-testing-performance-physical-device deck:"App测试" priority:2 tags:"性能,设备" %}
--- question
为什么功耗和硬件相关性能必须在真机上复验？
--- answer
模拟器不代表真实 SoC、厂商调度、传感器、射频和电池状态，无法直接推出真机功耗与热行为。
--- explanation
模拟器是在电脑上运行的替代环境，通常不能真实反映手机的 SoC (系统芯片)、电池、温控、传感器和厂商后台策略。它适合比较 API、尺寸和逻辑路径，也能建立启动、渲染、内存的早期趋势；功耗、温度、后台限制和真实输入则必须转到固定条件的真机，并记录设备、亮度、网络和充电状态，才能比较出有意义的结果。
{% endflashcard %}

{% flashcard basic id:app-testing-anr-evidence deck:"App测试" priority:1 tags:"稳定性,ANR" %}
--- question
出现“页面卡住”时，为什么不能只保存录屏？
--- answer
录屏只能证明用户看到的现象，还要结合操作时间、主线程状态、logcat 和系统报告判断是否为 ANR。
--- explanation
“页面卡住”只是用户看到的现象，可能来自网络等待、渲染掉帧、业务状态错误，也可能是真正的 ANR (Application Not Responding, 应用无响应)。`logcat` 用来查看系统和 App 在操作前后的日志，`dumpsys` 用来读取 Android 系统服务的状态快照，`traces` 用来查看 ANR 时各线程停在哪里；三者分别补充时间线、系统状态和线程调用栈。

例如主线程停在锁等待或同步网络调用，`traces` 能显示等待位置；只有接口响应慢而主线程仍能处理输入，则更接近服务端或网络问题。保存操作时间、前后 `logcat`、相关 `dumpsys` 和必要的 traces，才能区分应用 ANR、服务端慢和测试环境失效，不能把录屏中的卡顿直接写成 ANR。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Android 性能测量, https://developer.android.com/topic/performance/measuring-performance, https://developer.android.com/favicon.ico %}
{% link Android ANR, https://developer.android.com/topic/performance/vitals/anr, https://developer.android.com/favicon.ico %}
{% link Android gfxinfo, https://developer.android.com/tools/dumpsys, https://developer.android.com/favicon.ico %}
{% link Android 性能模式, https://developer.android.com/topic/performance, https://developer.android.com/favicon.ico %}
{% endlinkgroup %}

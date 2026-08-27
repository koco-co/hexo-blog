---
title: App测试(五)ADB 诊断与证据
tags:
  - App测试
  - ADB 诊断与证据
categories:
  - Learn Topic
  - App测试
description: 使用 ADB 把一次 App 失败收敛为可复现、可归因的证据包。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 5
published: true
abbrlink: 16f2c2fd
date: 2026-08-26 00:00:00
---

{% note warning flat %}
一张截图只能证明画面，一段日志只能证明某个时间点。可靠诊断要把构建、设备、动作、日志、系统状态和结果放进同一条时间线，并能让另一位成员从干净状态重新得到相同现象。
{% endnote %}

{% course_series %}

## 证据链

{% mermaid %}
flowchart TD
  A[固定构建与设备] --> B[记录复现步骤]
  B --> C[同步采集日志]
  C --> D[保存画面与系统状态]
  D --> E[归类 Crash 或 ANR]
  E --> F[脱敏后交付]
  F -->|信息不足| B
{% endmermaid %}

{% note primary flat %}
图后的核心判断是：先固定输入，再采集同步证据，最后讨论归因。任何一步缺失，都不能用更多无关日志弥补。
{% endnote %}

### 时间线

| 时间点 | 动作 | 证据 | 结论用途 |
| --- | --- | --- | --- |
| T0 | 安装候选包 | 包版本、摘要和安装结果 | 确认输入 |
| T1 | 进入任务 | 截图或录屏起点 | 确认前置 |
| T2 | 触发失败 | 操作步骤和界面 | 描述用户现象 |
| T2± | 采集日志 | logcat、dumpsys | 关联内部状态 |
| T3 | 重启或恢复 | 进程和数据状态 | 判断可恢复性 |

### 环境快照

| 字段 | 记录方式 | 脱敏要求 |
| --- | --- | --- |
| 构建 | 版本名、版本号、摘要 | 不含仓库私密地址 |
| 设备 | 型号、API、连接方式 | 不记录个人设备标识 |
| 应用 | 包名、安装方式、数据状态 | 账号和业务数据脱敏 |
| 系统 | 前台 Activity、网络、时间 | 删除私人通知内容 |

## 日志采集

### logcat 过滤

~~~bash
set -eu
target="<serial>"
evidence_dir="$(mktemp -d)"
adb -s "$target" logcat -c
adb -s "$target" logcat -v threadtime -d > "$evidence_dir/logcat-before.txt"
# 执行一次可描述的复现动作后再采集
adb -s "$target" logcat -v threadtime -d > "$evidence_dir/logcat-after.txt"
grep -E 'FATAL EXCEPTION|AndroidRuntime|ANR|com.example.demo' "$evidence_dir/logcat-after.txt" || true
~~~

### 缓冲区与时间

| 选择 | 优点 | 风险 |
| --- | --- | --- |
| 先清空再复现 | 时间线干净 | 可能丢掉前置异常 |
| 保留现有缓冲区 | 能看到更早线索 | 噪声多，容易错配 |
| 按 tag 过滤 | 结果短 | 可能漏掉跨进程根因 |

{% note info flat %}
清空缓冲区不是必选动作；选择后要在证据中说明。日志时间应与录屏、命令执行时间使用同一时区或明确偏移。
{% endnote %}

## 系统状态

{% note info flat %}
dumpsys 输出面向系统服务，通常比问题需要的范围更大。先按服务和字段取最小片段，再把完整报告作为可选附件保存。
{% endnote %}

### dumpsys

| 观察目标 | 命令 | 关键字段 |
| --- | --- | --- |
| 前台页面 | adb -s "$target" shell dumpsys activity activities | resumed Activity |
| 进程 | adb -s "$target" shell dumpsys meminfo <package> | PSS、进程状态 |
| 图形 | adb -s "$target" shell dumpsys gfxinfo <package> | 帧和渲染统计 |
| 电池 | adb -s "$target" shell dumpsys batterystats | 采样条件和电量状态 |

### 进程与前台 Activity

~~~bash
target="<serial>"
package="com.example.demo"
adb -s "$target" shell pidof "$package"
adb -s "$target" shell dumpsys activity activities | grep -E 'mResumedActivity|mFocusedApp'
adb -s "$target" shell ps -A | grep "$package" || true
~~~

{% note warning flat %}
如果进程号消失但用户仍看到旧画面，要结合 Activity、窗口和日志判断是否是进程被杀后恢复了缓存，而不是直接结论为“没有崩溃”。
{% endnote %}

## 画面证据

### 截图

~~~bash
target="<serial>"
evidence_dir="$(mktemp -d)"
adb -s "$target" exec-out screencap -p > "$evidence_dir/screen.png"
file "$evidence_dir/screen.png"
~~~

{% note info flat %}
截图文件应能回指触发动作和设备，不要只上传一张没有上下文的图片。
{% endnote %}

### 录屏

~~~bash
target="<serial>"
evidence_dir="$(mktemp -d)"
adb -s "$target" shell screenrecord --time-limit 30 "/sdcard/Download/repro.mp4"
adb -s "$target" pull "/sdcard/Download/repro.mp4" "$evidence_dir/"
~~~

{% note info flat %}
录屏前给出清晰的起点，过程中只执行缺陷复现所需动作；结束后检查文件是否完整，避免把录屏超时误判为 App 失败。
{% endnote %}

## 系统报告

### bugreport

~~~bash
target="<serial>"
evidence_dir="$(mktemp -d)"
adb -s "$target" bugreport "$evidence_dir/bugreport"
ls -lh "$evidence_dir"
~~~

{% note danger flat %}
bugreport 适合保留较宽的系统上下文，但可能包含通知、设备和应用敏感信息，只能在脱敏和权限明确后交付。
{% endnote %}

### 文件组织

建议用相对稳定的目录结构表达一次运行：

~~~text
evidence/
  manifest.txt
  steps.txt
  logcat-before.txt
  logcat-after.txt
  screen.png
  repro.mp4
  bugreport/
~~~

{% note info flat %}
manifest 写构建、设备、账号角色和采集时间；steps 写最小复现；其余文件只负责支撑结论。
{% endnote %}

## 故障归因

{% note warning flat %}
Crash 是进程因未处理异常等原因退出的现象，ANR 是关键线程在规定时间内没有响应的现象。两者都可能表现为“页面消失”，但恢复路径和证据不同。
{% endnote %}

### Crash

| 线索 | 典型观察 | 下一步 |
| --- | --- | --- |
| 未处理异常 | FATAL EXCEPTION、堆栈和进程退出 | 关联异常类型和触发输入 |
| Native 崩溃 | tombstone 或 native signal | 交给对应 native 负责人 |
| 业务状态错误 | 进程仍在但页面异常 | 转为状态或数据缺陷 |

### ANR

| 线索 | 典型观察 | 下一步 |
| --- | --- | --- |
| 输入无响应 | 操作停滞，可能出现系统提示 | 保存发生前后的日志和画面 |
| 主线程阻塞 | I/O、锁等待或长计算线索 | 关联线程状态和 traces |
| 后台任务超时 | 前台不一定弹窗 | 结合系统报告和服务日志 |

{% note warning flat %}
没有足够证据区分 Crash 与 ANR 时，报告“待归因”并补采集，不要用用户感受代替系统分类。
{% endnote %}

## 证据交付

{% note warning flat %}
交付前必须脱敏。日志、录屏和 bugreport 可能包含账号、通知、设备标识或业务数据；删掉敏感字段后仍要保留能复现结论的最小上下文。
{% endnote %}

### 最小复现

| 要素 | 合格标准 |
| --- | --- |
| 起点 | 明确安装、数据和权限状态 |
| 动作 | 每一步可由他人照做 |
| 预期 | 用户和系统各自应该发生什么 |
| 实际 | 差异可观察且不使用模糊词 |
| 恢复 | 失败后如何回到已知状态 |

### 脱敏检查

1. 搜索账号、邮箱、手机号、Token 和 Cookie 等模式。
2. 裁剪截图和录屏中的通知、个人头像及业务内容。
3. 用脱敏后的文件重新核对时间线和复现步骤。
4. 在交付说明中列出删除范围，避免接收方误解日志缺口。

## 常见问题

{% flashcard basic id:app-testing-logcat-filter deck:"App测试" priority:1 tags:"ADB,日志" %}
--- question
为什么只保存一次 logcat 不能可靠定位 App 失败？
--- answer
它缺少动作前后的时间边界，容易把旧噪声误归因到本次失败。
--- explanation
`logcat` 是 Android 的系统和应用日志查看工具：它把不同进程输出的消息按时间汇总到日志缓冲区，适合回答“某个时间点系统和 App 记录了什么”，但不会自动替你判定根因。受控复现时可以这样建立边界：

~~~bash
adb logcat -c
# 执行触发失败的操作后，再保存本次日志
adb logcat -v threadtime -d > logcat-after.txt
~~~

日志缓冲区也可能包含其他应用、旧运行和系统服务消息。至少要记录采集条件，并把触发动作、截图时间和失败后的日志放在同一时间线。过滤可以降低噪声，但不能代替前后边界；跨进程问题还要保留相关系统线索。清空缓冲区会丢失前置线索，只能在已知影响的复现实验中使用。

| 做法 | 价值 | 限制 |
| --- | --- | --- |
| 清空后复现 | 时间线更干净 | 会丢失前置线索 |
| 前后各采集一次 | 能关联动作窗口 | 仍需要准确时间 |
| 只按应用 tag 过滤 | 输出简短 | 可能漏掉系统根因 |
{% endflashcard %}

{% flashcard basic id:app-testing-crash-vs-anr deck:"App测试" priority:1 tags:"故障诊断,稳定性" %}
--- question
Crash 和 ANR 的核心区别是什么？
--- answer
Crash 是进程异常退出，ANR 是关键线程在规定时间内没有响应。
--- explanation
Crash (崩溃) 表示 App 进程因为未处理异常、native signal 等原因退出；ANR (Application Not Responding, 应用无响应) 表示 Android 在规定时间内没有得到主线程或某个组件的响应，进程不一定已经退出。`logcat` 是查看系统/App 时间线的工具，`traces` 是记录线程当时调用栈的诊断工件；它们都是证据，不是“页面卡住”本身的定义。

| 现象 | 先确认的证据 | 不能直接推出 |
| --- | --- | --- |
| Crash | 进程是否退出、`FATAL EXCEPTION`/native signal 和退出时间 | 一定是 UI 卡死 |
| ANR | 系统是否生成 ANR 报告、主线程在等待什么、操作是否超时 | 一定是网络问题 |

两者都可能让用户看到界面消失或无响应；判断时要把进程状态、线程状态、`logcat` 和系统报告对齐。证据不足时保留“待归因”，不要只凭录屏强行分类。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Logcat 命令行, https://developer.android.com/tools/logcat, https://developer.android.com/favicon.ico %}
{% link dumpsys 工具, https://developer.android.com/tools/dumpsys, https://developer.android.com/favicon.ico %}
{% link Android ANR 指南, https://developer.android.com/topic/performance/vitals/anr, https://developer.android.com/favicon.ico %}
{% link 捕获 Bug 报告, https://developer.android.com/studio/debug/bug-report, https://developer.android.com/favicon.ico %}
{% endlinkgroup %}

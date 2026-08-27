---
title: App测试(十一)Monkey 稳定性测试
tags:
  - App测试
  - Monkey 稳定性测试
categories:
  - Learn Topic
  - App测试
description: 用 Monkey 的事件模型、约束参数、种子复现和证据采集发现并收敛 Android App 稳定性问题。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 11
published: true
abbrlink: d377608d
date: 2026-08-26 00:00:00
---

{% note primary flat %}
Monkey 适合用大量伪随机输入探索生命周期、权限和页面状态边界，但它不是业务断言框架。可靠的稳定性运行必须固定包、设备、事件比例和 seed，并把失败缩成可重放的最小动作。
{% endnote %}

{% course_series %}

## 事件模型

{% mermaid %}
flowchart TD
  A[事件源] --> B[触摸与手势]
  A --> C[轨迹与导航]
  A --> D[系统按键]
  A --> E[应用切换]
  B --> F[App 状态]
  C --> F
  D --> F
  E --> F
  F --> G[Crash/ANR/异常结果]
{% endmermaid %}

{% note info flat %}
图失效时仍按事件源→输入→App 状态→稳定性结果理解。Monkey 只知道事件是否发送和进程是否异常，业务结果、数据正确性和可理解提示仍要由人工或自动化断言补充。
{% endnote %}

### 事件参数

| 参数 | 作用 | 风险 |
| --- | --- | --- |
| package | 限制目标 App | 包名错误导致空跑或进入其他入口 |
| count | 事件数量 | 太少发现不了长链路，太多难以收敛 |
| seed | 固定随机序列 | 未记录就无法复现 |
| throttle | 事件间隔 | 过快放大环境噪声，过慢延长运行 |
| pct | 事件比例 | 组合不合理导致覆盖偏斜 |
| monitor | 是否忽略特定错误 | 忽略后可能漏报严重问题 |

## 执行约束

{% note warning flat %}
执行前固定设备、APK、数据起点和屏幕状态。关闭会改变结果的自动更新与无关通知，记录运行时长、事件数、seed、网络和电量，不在真实用户数据上运行。
{% endnote %}

### 前置检查

1. 确认设备状态为 device，serial 与 API 已记录。
2. 安装目标 APK，校验包名和版本。
3. 建立新用户或可重置账号，记录初始状态。
4. 清理不属于测试的后台应用和通知。
5. 先手工走通一次主旅程，确认环境本身可用。

### 运行脚本

~~~bash
target="<serial>"
package="com.example.demo"
seed="20260826"
events="500"
adb -s "$target" shell monkey -p "$package" \
  --seed "$seed" --throttle 200 \
  --pct-touch 45 --pct-motion 20 --pct-trackball 5 \
  --pct-nav 10 --pct-majornav 10 --pct-appswitch 10 \
  -v "$events"
~~~

{% note info flat %}
上面是参数模板，不代表当前设备已执行。运行时同时保存终端输出、设备状态、起止时间和日志；任何失败先确认是 Monkey、设备连接还是 App 本身。
{% endnote %}

## 事件比例

| 组合目标 | 触摸 | 手势 | 导航 | 应用切换 | 适合发现 |
| --- | ---: | ---: | ---: | ---: | --- |
| UI 探索 | 高 | 中 | 低 | 低 | 控件边界、弹窗和滚动 |
| 生命周期 | 中 | 中 | 中 | 高 | 前后台、恢复和任务栈 |
| 输入稳定性 | 中 | 高 | 中 | 低 | 手势与输入状态 |
| 长时运行 | 中 | 中 | 中 | 中 | 泄漏、资源和偶发崩溃 |

{% note warning flat %}
事件百分比不等于业务覆盖率。调整比例后要说明希望增加哪一类状态转移，并用手工场景或 Appium 补齐 Monkey 无法表达的业务前置和断言。
{% endnote %}

## 错误策略

### 失败分类

| 现象 | 首先保留 | 下一步 |
| --- | --- | --- |
| 进程崩溃 | seed、事件数、logcat | 缩小序列并关联堆栈 |
| ANR 或无响应 | 操作窗口、日志和系统报告 | 复验线程与网络条件 |
| 设备断连 | ADB 状态、时间和主机日志 | 修复连接后重新运行 |
| 业务数据错误 | 截图、数据状态和最后事件 | 转人工或自动化场景复现 |
| 事件被拒绝 | Monkey 输出和前台 Activity | 检查权限、包和系统入口 |

### 忽略选项

{% note danger flat %}
--ignore-crashes 或 --ignore-timeouts 只改变运行是否继续，不会把错误变成通过。使用时必须在报告中列出忽略项，并另外采集 Crash、ANR 和退出状态。
{% endnote %}

## 运行脚本

### 分阶段运行

1. 小事件数快速确认包和设备。
2. 固定 seed 增大事件数，观察是否出现稳定失败。
3. 调整单一比例进行对照，不同时改变多个参数。
4. 失败后停止扩大规模，先进入复现和归因。
5. 清理数据与进程，确认下一轮从同一起点开始。

| 阶段 | 事件数 | 目的 | 退出条件 |
| --- | ---: | --- | --- |
| 冒烟 | 50～100 | 验证命令和前置 | 包或设备异常 |
| 探索 | 500～2000 | 发现状态边界 | 首次失败或达到样本 |
| 长稳 | 按时长设置 | 观察资源与偶发问题 | 时间到或稳定性失败 |
| 复现 | 最小序列 | 验证同一错误 | 现象不再出现或已确认 |

{% note info flat %}
运行日志要记录真实的 seed 和事件计数。只写“跑过 Monkey”不能让下一位成员判断是同一输入、同一设备还是另一轮随机噪声。
{% endnote %}

## 失败复现

### 同 seed 实验

~~~text
run A:
  clean app and device state
  seed = S, count = N, throttle = T
  save output, logcat and screen evidence

run B:
  restore the same state
  use the same S, N and T
  compare the first divergent event and final state
~~~

{% note primary flat %}
同 seed 只能复现相同的事件序列，不能保证设备、网络、时间和后端数据相同。若结果不一致，先对齐环境，再判断是否为非确定性问题。
{% endnote %}

### 最小序列

1. 从输出找到最后一个成功事件和第一个异常事件。
2. 逐段缩短事件数，保留仍能触发失败的前缀。
3. 检查被缩短的序列是否改变了数据或权限状态。
4. 用人工或 Appium 按最小序列重做，并加入业务断言。
5. 在缺陷中同时保存原始 seed 和收敛后的复现步骤。

## 结果判断

| 结果 | 判定 | 处理 |
| --- | --- | --- |
| 无异常退出且状态可解释 | 本轮稳定性通过 | 保存样本条件 |
| 出现 Crash | 稳定性失败 | 按堆栈和 seed 复现 |
| 出现 ANR | 稳定性失败 | 采集 traces 与时间线 |
| 设备断连 | 环境无效 | 不计入 App 失败，修复后重跑 |
| 只有业务数据错 | 功能失败 | 转场景用例补断言 |

{% note success flat %}
Monkey 的结论应写成“在某设备、某构建、某 seed 和某事件策略下运行了多少事件，发现或未发现哪些系统级异常”。不要把“没有 Crash”扩大成“业务全覆盖”。
{% endnote %}

## 常见问题

{% flashcard basic id:app-testing-monkey-seed deck:"App测试" priority:1 tags:"Monkey,复现" %}
--- question
为什么 Monkey 运行必须记录 seed？
--- answer
seed 决定伪随机事件序列；没有它就无法重放同一输入并收敛失败。
--- explanation
Monkey 是 Android 用来连续发送伪随机触摸、按键和生命周期事件的命令行工具；`seed` 是生成这串伪随机事件的起始数字，`count` 是事件数量。复现还需要同一 APK、设备、数据和事件参数：先用相同 seed 与 count 重跑，确认环境一致，再逐步缩短事件数，最后把最小序列转为有业务断言的人工或自动化用例。
{% endflashcard %}

{% flashcard basic id:app-testing-monkey-ignore-errors deck:"App测试" priority:1 tags:"Monkey,稳定性" %}
--- question
忽略 Crash 和超时的参数为什么不能作为通过条件？
--- answer
它们只让 Monkey 继续发送事件或改变退出行为，不能消除 Crash、ANR 或业务错误。
--- explanation
`--ignore-crashes` 或 `--ignore-timeouts` 只改变 Monkey 遇到异常后是否继续发送事件，不会让 Crash (进程崩溃)、ANR (应用无响应) 或业务错误消失。忽略选项适合探索性长跑，但报告必须保留原始输出、错误计数和系统日志；发现异常后应停止扩大运行，按 seed、时间线和系统证据复现，而不是用忽略参数掩盖失败。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Monkey 官方文档, https://developer.android.com/studio/test/other-testing-tools/monkey, https://developer.android.com/favicon.ico %}
{% link ADB 官方文档, https://developer.android.com/tools/adb, https://developer.android.com/favicon.ico %}
{% link Android ANR 指南, https://developer.android.com/topic/performance/vitals/anr, https://developer.android.com/favicon.ico %}
{% link Android 稳定性质量, https://developer.android.com/topic/performance/vitals, https://developer.android.com/favicon.ico %}
{% endlinkgroup %}

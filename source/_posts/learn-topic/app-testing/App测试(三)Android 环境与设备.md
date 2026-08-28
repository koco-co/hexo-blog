---
title: App测试(三)Android 环境与设备
tags:
  - App测试
  - Android 环境与设备
categories:
  - Learn Topic
  - App测试
description: 建立可重复的 Android SDK、模拟器与真机测试基线。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 3
published: true
abbrlink: b69bc933
date: 2026-06-03 00:00:00
---

{% note info flat %}
“能打开 App”不等于测试环境就绪。工具版本、设备授权、系统状态和测试账号必须一起记录，另一位成员才能从同一个起点复现结果。
{% endnote %}

{% course_series %}

## 工具链

{% note info flat %}
Android 测试环境至少包含 SDK 命令行工具、平台包、一个可启动的设备和能运行脚本的 Python 环境。每一层都要有独立的版本与路径检查。
{% endnote %}

### SDK 组件

{% note info flat %}
SDK Platform 提供目标 API 的编译和调试接口；Platform Tools 提供 adb 等设备通信工具；Emulator 与系统镜像提供可启动的虚拟设备。
{% endnote %}

### 版本基线

记录工具版本时不要只写“最新版”，而要写出可复现的版本集合：

| 组件 | 要记录的字段 | 失败信号 |
| --- | --- | --- |
| SDK | platform-tools、build-tools 和目标 API | 命令找不到或版本不一致 |
| 模拟器 | AVD 名称、系统镜像、架构和存储 | 启动后设备长期 offline |
| Python | Python 版本、虚拟环境和依赖锁定 | 导入包来自错误解释器 |
| App 包 | applicationId、版本名和校验摘要 | 安装的包不是候选版本 |

## 模拟器

{% note info flat %}
模拟器适合快速覆盖 API 版本、屏幕尺寸和系统入口；它不能替代真机对功耗、厂商 ROM、传感器和射频的判断。
{% endnote %}

{% note info flat %}
在 Android Studio 中，模拟器入口位于 More Actions → Virtual Device Manager；命令行流程则从 `emulator -list-avds` 开始。两种入口最终都应落到可记录的 AVD 名称和设备基线。
{% endnote %}

![Android Studio 的 Virtual Device Manager 入口](/img/learn-topic/app-testing/android-studio-virtual-device-manager.png)

### AVD 配置

1. 选择与产品支持范围对应的系统镜像和 ABI，不为了“能启动”随意降低 API。
2. 为设备记录屏幕尺寸、密度、方向、内存和存储空间。
3. 关闭会改变结果的随机设置，例如自动恢复到未知快照或后台持续运行。
4. 运行 emulator -list-avds 确认名称，再以同一名称启动并等待设备状态稳定。

{% note info flat %}
配置 AVD 时同时确认 API、ABI、服务类型与屏幕规格；这些字段应写入设备基线，而不是只保存一个设备名称。
{% endnote %}

![Android Studio 配置虚拟设备的系统镜像、ABI 与屏幕规格](/img/learn-topic/app-testing/android-avd-system-image.png)

{% note info flat %}
创建完成后回到 Device Manager，确认 AVD 名称、API、架构和可启动状态；设备列表是启动前的可审计检查点。
{% endnote %}

![Android Studio Device Manager 中的 AVD 列表](/img/learn-topic/app-testing/android-device-manager.png)

### 快照与冷启动

{% note warning flat %}
快照适合缩短重复实验，但可能携带旧账号、缓存和权限。涉及首次安装、升级、权限或性能基线时使用冷启动并清楚记录：
{% endnote %}

| 场景 | 推荐起点 | 需要清理 |
| --- | --- | --- |
| UI 快速回归 | 已确认干净的快照 | 当前任务产生的临时数据 |
| 首次安装 | 冷启动或新设备 | 包数据、权限和账号 |
| 升级验证 | 保留旧版本数据 | 版本和迁移前置 |
| 性能基线 | 固定冷/热启动条件 | 后台进程和充电状态 |

## 真机接入

{% note primary flat %}
真机接入的成功标准是：设备在 adb devices 中显示为 device，授权主体明确，且屏幕、系统版本和连接方式已记录。仅看到序列号不代表调试授权完成。
{% endnote %}

### USB 调试

1. 在设备开发者选项中启用 USB 调试。
2. 使用可信数据线连接，首次连接时核对设备上的 RSA 授权提示。
3. 运行 adb devices -l，确认序列号、型号和状态。
4. 锁屏、切换 USB 模式或拔插后重新检查，不把一次成功当成永久授权。

{% note info flat %}
真机信息页可以帮助核对开发者模式、型号和系统版本。下图只是历史设备示例，正式记录仍应来自当前设备，并以 `adb devices -l` 的回读结果为准。
{% endnote %}

![Android 真机开发者模式与系统版本页面示例](/img/learn-topic/app-testing/android-real-device-developer-mode.jpg)

### 无线调试

{% note warning flat %}
Android 的无线调试通常需要设备与主机在同一网络，并在设备端完成配对。记录配对端口和连接端口，但不要把局域网地址或临时凭据写进公开缺陷。
{% endnote %}

~~~bash
# 设备端显示配对码后，在主机执行
adb pair <device-host>:<pairing-port>
adb connect <device-host>:<connect-port>
adb devices -l
~~~

{% note warning flat %}
无线连接受网络隔离、休眠和地址变化影响。出现 unauthorized 或 offline 时，先重新确认设备端授权和网络，再决定是否回到 USB 连接。
{% endnote %}

## 设备基线

{% note info flat %}
环境基线要描述会改变测试结论的状态，而不是收集无关信息。系统版本、前台状态、时间、网络、权限和账号是移动场景的最小集合。
{% endnote %}

### 系统状态

{% mermaid %}
flowchart TD
  A[工具版本] --> B[设备授权]
  B --> C[系统状态]
  C --> D[网络与时间]
  D --> E[测试账号]
  E --> F[可执行基线]
{% endmermaid %}

{% note info flat %}
按图中顺序检查，可以把“脚本失败”定位到工具、连接、系统、网络或数据前置，而不是混在一起重试。
{% endnote %}

### 测试账号

测试账号应满足最小权限和可重复数据：

| 账号类型 | 用途 | 约束 |
| --- | --- | --- |
| 新用户 | 首次安装、引导和权限 | 每轮实验前可重置 |
| 已有数据 | 列表、迁移和历史状态 | 固定数据快照 |
| 过期会话 | 重新认证与清理 | 不使用真实用户凭据 |
| 受限角色 | 权限和功能降级 | 明确允许访问的功能 |

## 环境验收

### 最小检查

~~~bash
set -eu
python --version
adb version
adb devices -l
adb shell getprop ro.build.version.sdk
adb shell settings get system screen_off_timeout
~~~

{% note success flat %}
通过条件是命令来自预期环境、设备状态为 device、API 与矩阵一致，且屏幕不会在长实验中意外锁定。输出中不应包含账号、令牌或私人数据。
{% endnote %}

### 失败恢复

1. 命令找不到：确认当前 shell 的 PATH 和使用的 Python 解释器。
2. 设备 unauthorized：解锁设备，重新确认 RSA 提示，再运行设备列表。
3. 设备 offline：重新连接或重启 adb 服务，随后检查序列号是否变化。
4. API 或形态不符：停止执行，换到矩阵中正确的设备，不用错误环境“凑通过”。
5. 账号数据不一致：恢复干净快照或测试数据，再重新记录基线。

## 常见问题

{% flashcard basic id:app-testing-device-offline-unauthorized deck:"App测试" priority:1 tags:"环境,ADB" %}
--- question
看到设备序列号时，为什么仍不能认为 Android 设备已经可以测试？
--- answer
还要确认状态为 device，并验证授权、系统版本和测试前置。
--- explanation
`adb` (Android Debug Bridge) 是电脑与 Android 设备通信的命令行工具。`adb devices -l` 只是在读取连接状态，可能列出 `unauthorized` 或 `offline`：前者表示设备尚未接受这台电脑的调试授权，后者表示连接存在但通信不稳定。即使状态为 `device`，也只说明 ADB 通道基本可用，还要继续检查 API、屏幕、时间、网络和账号。

| 状态 | 含义 | 下一步 |
| --- | --- | --- |
| device | 通信和授权基本可用 | 继续做系统与数据基线 |
| unauthorized | 未接受主机授权 | 解锁设备并确认授权提示 |
| offline | 连接存在但通信不可用 | 重连、检查网络或切回 USB |

设备状态是进入测试的必要条件，不是完整的环境验收。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link 真机运行指南, https://developer.android.com/studio/run/device, https://developer.android.com/favicon.ico %}
{% link Android Emulator, https://developer.android.com/studio/run/emulator, https://developer.android.com/favicon.ico %}
{% link Android 命令行工具, https://developer.android.com/tools, https://developer.android.com/favicon.ico %}
{% link ADB 官方文档, https://developer.android.com/tools/adb, https://developer.android.com/favicon.ico %}
{% endlinkgroup %}

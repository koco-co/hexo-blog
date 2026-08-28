---
title: App测试(四)ADB 设备管理
tags:
  - App测试
  - ADB 设备管理
categories:
  - Learn Topic
  - App测试
description: 使用 ADB 在多设备环境中稳定选择目标并管理应用、文件和进程。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 4
published: true
abbrlink: 7c0260ba
date: 2026-08-26 00:00:00
---

{% note info flat %}
ADB 的危险不在命令多，而在目标不明确。多设备环境中，每一个安装、清理、抓取和 shell 操作都应显式绑定 serial，先确认目标再执行动作。
{% endnote %}

{% course_series %}

## 三组件模型

{% mermaid %}
flowchart TD
  A[adb client] --> B[adb server]
  B --> C[目标 transport]
  C --> D[设备端 adbd]
  D --> E[包、文件与 shell]
{% endmermaid %}

{% note info flat %}
客户端负责接受命令，主机 server 负责发现并路由设备，设备端 adbd 负责执行。命令没有显式目标时，单设备可以省略选择，多设备必须把 serial 当成隔离边界。
{% endnote %}

{% note info flat %}
旧笔记中的示意图把主机端 Client/Server 与设备端 adbd 画成两侧，用来理解进程边界和 5037/transport；实际排障仍以当前命令输出和目标 serial 为准。
{% endnote %}

![ADB 客户端、服务端与设备端 adbd 的概念关系](/img/learn-topic/app-testing/adb-client-server-adbd-architecture.jpeg)

### client

{% note primary flat %}
主机上的 adb client 是一次命令调用。它不会替你判断“当前设备是否正确”，脚本必须保存命令、目标和退出码。
{% endnote %}

### server 与 adbd

| 组件 | 所在位置 | 典型失败 | 诊断动作 |
| --- | --- | --- | --- |
| client | 测试主机 | 命令不存在、参数错误 | 检查版本和 PATH |
| server | 测试主机 | 设备列表过期、端口占用 | 重启服务并重新发现 |
| adbd | 设备或模拟器 | unauthorized、offline | 核对授权和链路 |

## 设备选择

{% note info flat %}
把 serial 传给每个会改变设备状态的命令；读取命令也最好绑定目标，避免把一台设备的日志误记到另一台缺陷上。
{% endnote %}

### 设备标识

| 连接 | serial 形态 | 选择规则 |
| --- | --- | --- |
| USB | 设备序列号 | 以 adb devices -l 的值为准 |
| 无线 | 主机与端口组合 | 地址变化后重新发现 |
| 模拟器 | 模拟器端口序列 | 不要只按“第一台”选择 |

### 连接状态

1. 运行 adb devices -l，确认目标 serial 只出现一次。
2. 检查状态为 device，排除 unauthorized 和 offline。
3. 用 adb -s <serial> shell getprop ro.product.model 回读目标型号。
4. 将 serial、型号、API 和测试任务写入本次证据目录。

## 连接方式

### USB

~~~bash
target="<serial>"
adb -s "$target" get-state
adb -s "$target" shell echo "adb-ok"
~~~

### 无线配对

~~~bash
target="<device-host>:<connect-port>"
adb connect "$target"
adb -s "$target" get-state
~~~

{% note warning flat %}
不要把无线连接的临时地址写成长期配置，也不要在共享日志中保留配对码。连接成功后仍需回读型号，确认没有选错同网段设备。
{% endnote %}

## 应用管理

### 安装与升级

~~~bash
target="<serial>"
apk="build/outputs/apk/demo.apk"
adb -s "$target" install -r "$apk"
adb -s "$target" shell pm path com.example.demo
~~~

{% note warning flat %}
-r 表示尝试保留应用数据并覆盖安装；它不能代替升级场景的版本校验。安装后回读包路径和版本信息，确认设备上的确是目标 APK。
{% endnote %}

### 卸载与数据保留

| 动作 | 结果 | 适用场景 |
| --- | --- | --- |
| 覆盖安装 | 尽量保留数据 | 升级和迁移 |
| 卸载 | 删除应用及通常的数据 | 首次安装、清理残留 |
| 清除数据 | 保留安装包，重置用户数据 | 重复执行同一版本 |
| 禁用或停止 | 改变运行状态，不删除数据 | 进程和恢复实验 |

{% note warning flat %}
清理前先记录数据状态；不能为了“方便复现”把需要保留的升级数据一并删除。
{% endnote %}

## 文件传输

### push

~~~bash
target="<serial>"
local_file="fixtures/account.json"
remote_file="/sdcard/Download/account.json"
adb -s "$target" push "$local_file" "$remote_file"
adb -s "$target" shell ls -l "$remote_file"
~~~

### pull 与 sync

{% note info flat %}
pull 用于把设备上的日志、截图或导出文件带回主机；sync 适合目录级同步。传输后检查文件大小和摘要，不要只看命令退出码。
{% endnote %}

~~~bash
target="<serial>"
result_dir="$(mktemp -d)"
adb -s "$target" pull "/sdcard/Download/result.json" "$result_dir/"
shasum "$result_dir/result.json"
~~~

## Shell 操作

### 包与 Activity

~~~bash
target="<serial>"
adb -s "$target" shell pm list packages | grep 'com.example'
adb -s "$target" shell am start -W -n com.example.demo/.MainActivity
adb -s "$target" shell dumpsys activity activities | grep mResumedActivity
~~~

### 输入与进程

{% note info flat %}
可以用 input 注入明确的按键或触摸动作，用 am force-stop 验证进程重启；注入后必须记录实际前台 Activity 和页面状态。
{% endnote %}

~~~bash
target="<serial>"
adb -s "$target" shell input keyevent KEYCODE_BACK
adb -s "$target" shell am force-stop com.example.demo
adb -s "$target" shell pidof com.example.demo
~~~

## 多设备隔离

{% note warning flat %}
脚本中出现没有 -s 的状态改变命令，就是多设备误操作的信号。先阻断脚本，再补目标选择和回读校验。
{% endnote %}

### 目标选择

| 操作 | 不安全写法 | 可审计写法 |
| --- | --- | --- |
| 安装 | adb install ... | adb -s "$target" install ... |
| 日志 | adb logcat | adb -s "$target" logcat ... |
| 清理 | adb shell pm clear ... | adb -s "$target" shell pm clear ... |

### 端口转发

{% note warning flat %}
端口转发会把主机端口连接到设备端口。使用前写清方向、用途和清理动作，实验结束后执行对应的 remove，避免后续测试误连旧服务。
{% endnote %}

~~~bash
target="<serial>"
adb -s "$target" forward tcp:6100 tcp:7100
adb -s "$target" forward --remove tcp:6100
~~~

## 常见问题

{% flashcard basic id:app-testing-adb-install-flags deck:"App测试" priority:2 tags:"ADB,安装" %}
--- question
adb install 的覆盖、保留数据和清理数据为什么要分开验证？
--- answer
它们改变的状态不同，直接影响升级、首次安装和数据迁移结论。
--- explanation
这三个动作改动的是不同状态。覆盖安装 (例如 `adb install -r app.apk`) 用新 APK 替换旧包，通常保留应用数据；卸载会移除安装包和大部分用户数据；清除数据则保留安装包，只把运行数据重置为空。若把它们都称为“重新安装”，就无法判断问题来自升级迁移、缓存残留还是首次初始化。

| 目标 | 推荐动作 | 需要回读 |
| --- | --- | --- |
| 升级 | 覆盖安装 | 版本、迁移后数据和会话 |
| 首次安装 | 卸载后安装 | 引导、权限和默认值 |
| 干净重跑 | 清除数据 | 数据为空且包仍存在 |
{% endflashcard %}

{% flashcard basic id:app-testing-device-selector deck:"App测试" priority:1 tags:"ADB,多设备" %}
--- question
多设备执行 ADB 脚本时，最小的目标隔离措施是什么？
--- answer
把 serial 显式传给每条命令，并回读型号或状态确认目标。
--- explanation
ADB server 会同时维护多个 transport；未指定目标的命令可能失败，也可能在环境变化后作用于错误设备。将目标写入变量、绑定每条命令并在关键动作后回读，可以把误操作从隐性风险变成可审计错误。

~~~bash
target="<serial>"
adb -s "$target" get-state
adb -s "$target" shell getprop ro.product.model
~~~
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link ADB 官方文档, https://developer.android.com/tools/adb, https://developer.android.com/favicon.ico %}
{% link ADB 命令行测试, https://developer.android.com/studio/test/command-line, https://developer.android.com/favicon.ico %}
{% link dumpsys 工具, https://developer.android.com/tools/dumpsys, https://developer.android.com/favicon.ico %}
{% endlinkgroup %}

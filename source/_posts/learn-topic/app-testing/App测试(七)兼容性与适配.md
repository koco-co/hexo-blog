---
title: App测试(七)兼容性与适配
tags:
  - App测试
  - 兼容性与适配
categories:
  - Learn Topic
  - App测试
description: 依据用户分布、系统 API、设备形态和显示设置构建兼容性矩阵，并把差异收敛为可发布结论。
cover: /img/picgo-images/app-testing-course-cover.png
series: App测试
series_order: 7
published: true
abbrlink: 1a4ff107
date: 2026-06-07 00:00:00
---

{% note primary flat %}
兼容性不是“在一台手机上点通”，而是证明目标用户分布中的代表设备都能完成关键旅程，并能解释系统、厂商、形态和显示设置造成的差异。
{% endnote %}

{% course_series %}

## 兼容性维度

{% mermaid %}
flowchart TD
  A[用户分布] --> B[OS 与 API]
  A --> C[厂商与 ROM]
  A --> D[设备形态]
  B --> E[targetSdk 行为变化]
  C --> F[后台与权限策略]
  D --> G[尺寸与输入方式]
  E --> H[代表矩阵]
  F --> H
  G --> H
{% endmermaid %}

{% note info flat %}
图失效时仍按用户分布→OS/API、厂商/ROM、设备形态→行为差异→代表矩阵的顺序执行。兼容结论必须同时写清候选设备、证据和未覆盖风险。
{% endnote %}

### OS 与 API

| 字段 | 示例 | 选择依据 |
| --- | --- | --- |
| minSdk | 产品最低支持 API | 必测边界，不因设备稀少删除 |
| targetSdk | APK 声明的目标 API | 影响权限、后台和系统行为 |
| device API | 代表设备当前 API | 与系统行为变更逐一对照 |
| preview | 预览 API | 只作为前瞻风险，不当作发布通过 |

### 行为变化

{% note warning flat %}
同一 APK 在不同设备 API 上出现差异时，先查 Android 官方行为变更和 targetSdk 影响，再判断是否为厂商 ROM。没有 API 和构建证据时只报告现象，不做归因。
{% endnote %}

## 设备差异

### 厂商策略

| 观察面 | 需要比较 | 常见风险 |
| --- | --- | --- |
| 后台 | 省电限制、后台启动和服务保活 | 通知延迟、任务丢失 |
| 权限 | 权限页文案、自动撤权和特殊权限 | 引导路径不一致 |
| 通知 | 渠道、锁屏和通知开关 | 提醒不可见 |
| 网络 | 私有 DNS、代理和漫游切换 | 请求失败或耗时变化 |
| 存储 | 清理策略、可用空间和媒体访问 | 下载或缓存失败 |

{% note info flat %}
单台真机异常先用同系统基线复验；只有同厂商、同版本或同策略出现相同现象，才把它聚类为兼容性风险。
{% endnote %}

### 形态与硬件

| 形态 | 主旅程变化 | 降级要求 |
| --- | --- | --- |
| 手机 | 单列布局、触控为主 | 关键控件可见且可操作 |
| 平板 | 更宽窗口、分栏或横屏 | 内容不被拉伸或留白误导 |
| 折叠屏 | 展开/折叠、铰链区域 | 状态和焦点连续 |
| 无传感器设备 | 相机、定位或生物识别不可用 | 提供替代入口和明确提示 |

## 显示适配

### 尺寸与密度

{% note primary flat %}
适配检查要把逻辑尺寸、密度、字体缩放和窗口尺寸分开记录。截图相似不代表触控区域、文本可读性和滚动范围一致。
{% endnote %}

| 设置 | 观察点 | 证据 |
| --- | --- | --- |
| 小屏 | 文本截断、按钮重叠 | 全屏截图和操作录像 |
| 大屏 | 空白、分栏和最大宽度 | 横竖屏对照 |
| 字体放大 | 重排、滚动和焦点 | 系统设置值与页面截图 |
| 显示缩放 | 点击区域和图标清晰度 | 触控坐标与语义树 |
| 深色模式 | 对比度、图片和系统栏 | 前后主题截图 |

### 方向切换

1. 在首页、表单填写、列表滚动和提交等待四个节点切换方向。
2. 记录输入、滚动位置、焦点和请求状态。
3. 对比恢复后的业务结果，而不仅是布局是否重新绘制。
4. 若产品不支持方向切换，确认系统锁定方向并给出可见说明。

{% note warning flat %}
用截图工具自动比对时要固定设备、字体和数据。像素差异只能提示候选问题，仍需通过语义状态和实际操作确认。
{% endnote %}

## 矩阵设计

{% note info flat %}
矩阵从用户分布和风险出发，不按设备清单堆数量。每一行都要能回答“为什么选它、覆盖了什么、失败后补哪一台”。
{% endnote %}

| 层级 | 代表集 | 适合覆盖 | 运行频率 |
| --- | --- | --- | --- |
| 快速门禁 | 1 台模拟器 + 1 台主流真机 | 编译、安装、主旅程冒烟 | 每次提交或合并 |
| 主流回归 | 主流 API、厂商和屏幕组合 | 功能、权限、网络和打断 | 每日或候选版本 |
| 长尾抽样 | 平板、折叠屏、低端机、特殊 ROM | 形态与资源边界 | 每个版本或按风险 |
| 专项设备 | 相机、定位、NFC、蓝牙等 | 外设和硬件能力 | 功能变更时 |

### 选择规则

1. 先固定最低 API、当前主流 API 和候选最新 API。
2. 在每个 API 选择用户占比高或历史缺陷多的厂商。
3. 为屏幕、输入、内存和外设差异补入代表设备。
4. 把高风险组合标为必测，把低风险组合标为抽样。
5. 记录未覆盖项和下一次补测触发条件。

## 执行分层

| 执行层 | 目的 | 失败后动作 |
| --- | --- | --- |
| 模拟器 | 快速验证 API、尺寸、方向和系统入口 | 先看是否为系统配置问题 |
| 本地真机 | 验证功耗、硬件和厂商行为 | 保存 ADB 与画面证据 |
| 设备农场 | 扩大型号、API 和地域覆盖 | 聚类后回本地复验 |
| 人工探索 | 捕获长尾交互和不可预测打断 | 补入可复现最小案例 |

{% note warning flat %}
云设备通过不等于本地网络、专用外设或隐私场景通过；设备农场的失败要带上型号、API、厂商、执行时段和原始工件。
{% endnote %}

## 回归门禁

### 通过条件

{% note success flat %}
候选版本至少应满足：高风险旅程在代表矩阵通过；已知 P0/P1 有明确处置；失败样本可以按构建、设备和步骤复现；未覆盖长尾风险有负责人和补测时间。
{% endnote %}

### 失败分类

| 现象 | 首先排查 | 不能直接结论 |
| --- | --- | --- |
| 只有一台错位 | 数据、字体、窗口和设备状态 | 不是立即归因厂商 |
| 同 API 多厂商失败 | 系统行为、targetSdk 和公共代码 | 不是只修 ROM |
| 只有一 API 失败 | 行为变更和最低支持边界 | 不是删除该版本 |
| 云端失败、本地成功 | 网络、镜像和设备策略 | 不是忽略云端 |
| 截图不同、业务相同 | 字体、密度和渲染差异 | 不是视觉缺陷必现 |

## 常见问题

{% flashcard basic id:app-testing-emulator-vs-real-device deck:"App测试" priority:1 tags:"兼容性,设备" %}
--- question
为什么模拟器通过后仍要在真机上复验？
--- answer
模拟器擅长 API、尺寸和系统入口覆盖，不能证明功耗、厂商 ROM、真实传感器和射频行为。
--- explanation
模拟器是在电脑上模拟 Android 环境的软件，真机则使用实际手机的 SoC (系统芯片)、电池、传感器、触控和厂商 ROM。模拟器适合作为快速门禁，不能把它通过推出真实设备的功耗、后台策略或射频行为；云真机可以扩大型号覆盖，但本地网络、专用外设和隐私数据仍需单独处理。兼容性结论必须写清“在哪种环境验证了什么”。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Android 核心质量, https://developer.android.com/docs/quality-guidelines/core-app-quality, https://developer.android.com/favicon.ico %}
{% link Android 设备运行, https://developer.android.com/studio/run/device, https://developer.android.com/favicon.ico %}
{% link Android 大屏适配, https://developer.android.com/guide/topics/large-screens, https://developer.android.com/favicon.ico %}
{% link Android 行为变更, https://developer.android.com/about/versions/behavior-changes-all, https://developer.android.com/favicon.ico %}
{% endlinkgroup %}

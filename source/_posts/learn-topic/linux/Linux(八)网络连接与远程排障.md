---
title: Linux(八)网络连接与远程排障
tags:
  - Linux
  - 网络排障
categories:
  - Learn Topic
  - Linux
description: 按网卡、路由、DNS、Socket、请求和抓包层次定位网络故障。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 8
published: false
abbrlink: 3a757ef9
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：按网卡、路由、DNS、Socket、TLS、应用请求和抓包逐层定位网络问题。
- 可观察成果：能够定位失败或变慢连接所处的网络层次。
- 进入条件：第 2、5 篇；建议具备第 7 篇进程背景。
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：
- 核心详解 / 地址与路由：ubuntu26.04:command:bridge、ubuntu26.04:command:ip
- 核心详解 / HTTP 请求：ubuntu26.04:command:curl、ubuntu26.04:command:wget
- 核心详解 / DNS 查询：ubuntu26.04:command:dig、ubuntu26.04:command:host、ubuntu26.04:command:nslookup
- 核心详解 / 端口与 Socket：ubuntu26.04:command:nc、ubuntu26.04:command:ss
- 核心详解 / 连通性与路径：ubuntu26.04:command:ping、ubuntu26.04:command:tracepath、ubuntu26.04:command:traceroute
- 核心详解 / 远程操作：ubuntu26.04:command:rsync、ubuntu26.04:command:scp、ubuntu26.04:command:ssh、ubuntu26.04:command:ssh-add、ubuntu26.04:command:ssh-agent、ubuntu26.04:command:ssh-keygen、ubuntu26.04:command:ssh-keyscan
- 核心详解 / 抓包定位：ubuntu26.04:command:tcpdump
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 网络排障模型 | 建立网络排障模型的心智模型 | 接口、路由、DNS、Socket、TLS 到应用；本地、远端和中间设备证据边界 | `mermaid` | 存在明确的关系、状态或调用顺序，图示比连续文字更易追踪 | 图前问题、图后结论、关键节点和失败边界 | 图表失效时由节点清单和文字结论兜底 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 地址与路由 | 建立地址与路由的心智模型 | ip link、addr、route、neigh 和非持久变更；ifconfig、route 迁移边界 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 连通性与路径 | 建立连通性与路径的心智模型 | ping、tracepath、traceroute、ICMP、MTU 和延迟 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| DNS 查询 | 完成并验证DNS 查询 | resolv.conf、systemd-resolved；dig、host、nslookup、记录类型、服务器和缓存 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 端口与 Socket | 建立端口与 Socket的心智模型 | ss 状态、监听器、进程、队列和 netstat 迁移；nc 与 lsof 选择边界 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| HTTP 请求 | 建立HTTP 请求的心智模型 | curl 方法、头、体、重定向、耗时、TLS 和退出状态；wget 下载边界 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 远程操作 | 完成并验证远程操作 | SSH 主机校验、密钥代理、scp、rsync 和安全传输 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 抓包定位 | 建立抓包定位的心智模型 | tcpdump 接口、捕获过滤器、显示过滤器、文件和权限 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 分层故障实验 | 完成并验证分层故障实验 | 解析成功但不可达、可达但应用失败 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 用下一层证据验证每个判断 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：诊断一个可解析但不可达、随后可达但返回 HTTP 错误的服务，并收集 Socket 与抓包证据。
- 完整示例：诊断一个可解析但不可达、随后可达但返回 HTTP 错误的服务，并收集 Socket 与抓包证据。
- 失败边界与踩坑：不要把 ping 成功当作应用成功；避免 DNS 缓存误判、SSH 主机键绕过、curl 不安全模式和泄露抓包内容。
- FAQ 候选与来源：监听与可达的区别、dig 与 nslookup 如何选择、rsync 与 scp 如何选择。
- 非复习自测：用中文场景选择命令，解释输出并写出验证步骤。
- 图表或实验：分层决策流、TCP 状态表和请求耗时线。
- 复习卡片：ip、ping、dig、ss、nc、curl、ssh、rsync、tcpdump 和 ifconfig/netstat/route 迁移卡。
- 参考资料：iproute2、OpenSSH、curl、tcpdump、systemd-resolved 与 Ubuntu 网络文档。

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

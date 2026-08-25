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

## 本文职责

- 唯一问题：按网卡、路由、DNS、Socket、TLS、应用请求和抓包逐层定位网络问题。
- 学习成果：能够定位失败或变慢连接所处的网络层次。
- 前置文章：第 2、5 篇；建议具备第 7 篇进程背景。
- 能力分配：
- 核心详解 / 地址与路由：ubuntu26.04:command:bridge、ubuntu26.04:command:ip
- 核心详解 / HTTP 请求：ubuntu26.04:command:curl、ubuntu26.04:command:wget
- 核心详解 / DNS 查询：ubuntu26.04:command:dig、ubuntu26.04:command:host、ubuntu26.04:command:nslookup
- 核心详解 / 端口与 Socket：ubuntu26.04:command:nc、ubuntu26.04:command:ss
- 核心详解 / 连通性与路径：ubuntu26.04:command:ping、ubuntu26.04:command:tracepath、ubuntu26.04:command:traceroute
- 核心详解 / 远程操作：ubuntu26.04:command:rsync、ubuntu26.04:command:scp、ubuntu26.04:command:ssh、ubuntu26.04:command:ssh-add、ubuntu26.04:command:ssh-agent、ubuntu26.04:command:ssh-keygen、ubuntu26.04:command:ssh-keyscan
- 核心详解 / 抓包定位：ubuntu26.04:command:tcpdump

## 正文大纲

- H2：网络排障模型
  - H3：接口、路由、DNS、Socket、TLS 到应用
  - H3：本地、远端和中间设备证据边界
- H2：地址与路由
  - H3：ip link、addr、route、neigh 和非持久变更
  - H3：ifconfig、route 迁移边界
- H2：连通性与路径
  - H3：ping、tracepath、traceroute、ICMP、MTU 和延迟
- H2：DNS 查询
  - H3：resolv.conf、systemd-resolved
  - H3：dig、host、nslookup、记录类型、服务器和缓存
- H2：端口与 Socket
  - H3：ss 状态、监听器、进程、队列和 netstat 迁移
  - H3：nc 与 lsof 选择边界
- H2：HTTP 请求
  - H3：curl 方法、头、体、重定向、耗时、TLS 和退出状态
  - H3：wget 下载边界
- H2：远程操作
  - H3：SSH 主机校验、密钥代理、scp、rsync 和安全传输
- H2：抓包定位
  - H3：tcpdump 接口、捕获过滤器、显示过滤器、文件和权限
- H2：分层故障实验
  - H3：解析成功但不可达、可达但应用失败
- H2：结果验证
  - H3：用下一层证据验证每个判断

## 内容计划

- 贯穿案例：诊断一个可解析但不可达、随后可达但返回 HTTP 错误的服务，并收集 Socket 与抓包证据。
- 完整示例：诊断一个可解析但不可达、随后可达但返回 HTTP 错误的服务，并收集 Socket 与抓包证据。
- 失败边界与踩坑：不要把 ping 成功当作应用成功；避免 DNS 缓存误判、SSH 主机键绕过、curl 不安全模式和泄露抓包内容。
- FAQ 候选与来源：监听与可达的区别、dig 与 nslookup 如何选择、rsync 与 scp 如何选择。
- 自测形式：用中文场景选择命令，解释输出并写出验证步骤。
- 可视化：分层决策流、TCP 状态表和请求耗时线。
- 闪卡计划：ip、ping、dig、ss、nc、curl、ssh、rsync、tcpdump 和 ifconfig/netstat/route 迁移卡。
- 参考资料：iproute2、OpenSSH、curl、tcpdump、systemd-resolved 与 Ubuntu 网络文档。

## 结果验证

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。

## 常见问题

待正文阶段按主题编写，并将需要长期复习的问题转为 flashcard。

## 参考资料

待正文阶段补齐当前版本官方资料与可复现问题案例。

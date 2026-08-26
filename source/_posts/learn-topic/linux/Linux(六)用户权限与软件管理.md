---
title: Linux(六)用户权限与软件管理
tags:
  - Linux
  - 权限软件
categories:
  - Learn Topic
  - Linux
description: 用身份、路径权限与包生命周期解释访问失败，并安全选择 sudo、APT/dpkg 与跨发行版工具。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 6
published: true
abbrlink: 5a63b164
date: 2026-08-25 00:00:00
---

{% course_series %}

{% note info flat %}
权限和软件管理都先做“读取事实”，再决定是否改变系统：先确认有效身份、目标对象和包来源，最后才考虑 chmod、sudo 或安装动作。本文不把 root 当作万能修复，也不指导在生产主机上试错式创建账户、修改仓库或安装软件。
{% endnote %}

## 身份模型

{% mermaid %}
flowchart TD
  A[进程有效 UID/GID] --> B[对象所有者与组]
  B --> C[模式位 rwx]
  C --> D[父目录搜索权限]
  D --> E[允许或拒绝]
  F[sudo 策略] --> A
{% endmermaid %}

### 读取身份

~~~bash
id
groups
getent passwd "$(id -un)"
getent group "$(id -gn)"
~~~

{% note primary flat %}
id 给出当前有效 UID、主组和附加组；groups 适合快速查看组集合；getent 通过 NSS 查询账户或组数据库，不能只假定信息一定来自 /etc/passwd。验证时，getent 输出应含当前用户名或组名；这些都是只读命令。
{% endnote %}

### 账户操作

| 中文场景 | 选择 | 先确认的边界 |
| --- | --- | --- |
| 创建或回收账户 | useradd、usermod、userdel | home、文件归属、登录 Shell 与回收计划 |
| 管理工作组 | groupadd、groupmod、groupdel | 现有成员和已归属文件 |
| 设置或锁定凭据 | passwd | 这是认证操作，不会刷新文件权限 |
| 临时切换主组 | newgrp | 只影响新启动的 Shell，会话外仍需重新判断身份 |

{% note warning flat %}
这些命令会改变真实账户数据库，不提供“可直接复制到生产”的创建样例。面试或排障先说明要用 id、getent 与文件归属证据确认现状；只有在已批准的测试环境中才执行新增、删除或密码操作。
{% endnote %}

## 权限计算

### 私有实验

~~~bash
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
printf '%s\n' 'linux-permission-lab' >"$LAB/.linux-permission-lab"
mkdir -p "$LAB/project"
TARGET="$LAB/project/config"
: >"$TARGET"

chmod u=rwx,g=rx,o= "$LAB/project"
chmod u=rw,g=r,o= "$TARGET"
chgrp "$(id -gn)" "$TARGET"
ls -ld "$LAB/project" "$TARGET"

( umask 027; : >"$LAB/from-umask"; ls -l "$LAB/from-umask" )
~~~

{% note primary flat %}
先看目录，再看文件：进入目录需要 x（搜索）权限，读取文件不代表能穿过每一级父目录。chmod 改模式位，chgrp 只改组；上面的对象全在 LAB 内。umask 只参与新对象的默认模式，常见文件起点是 0666、目录起点是 0777，再去掉 umask 指定的位。
{% endnote %}

### 归属判断

~~~bash
if test -n "$LAB" && test -f "$LAB/.linux-permission-lab"; then
  TARGET="$LAB/project/config"
  printf 'uid=%s gid=%s\n' "$(id -u)" "$(id -g)"
  ls -ln "$TARGET"

  if chown "$(id -un):$(id -gn)" "$TARGET"; then
    printf '%s\n' 'owner/group unchanged or accepted'
  else
    printf '%s\n' 'chown requires appropriate ownership capability'
  fi
else
  printf '%s\n' '请先运行“私有实验”创建隔离目录' >&2
fi
~~~

{% note info flat %}
chown 同时设置所有者和组，且通常需要比 chgrp 更高的权限；上例只请求当前身份，仍应把失败当作授权证据而非绕过理由。真实故障不要递归修改大目录：把目标、当前 owner:group、需要的访问动作和回滚方式写清楚后再变更。
{% endnote %}

### 特殊边界

{% note warning flat %}
setuid、setgid、sticky bit、ACL、只读挂载、SELinux/AppArmor 和服务沙箱都会改变三组 rwx 的直觉。若 UID/GID、父目录和模式位看似正确仍失败，保留拒绝信息并进入进阶诊断；不要用 777 掩盖原因。
{% endnote %}

## 提权边界

~~~bash
sudo -l
sudo -u "$(id -un)" id
~~~

{% note danger flat %}
sudo -l 读取当前策略允许的命令；第二条只以当前身份运行 id，用来说明“授权到哪个目标用户”是策略问题。sudo -i、su 和直接 root Shell 会放大影响面；不要把密码放进命令行、脚本或日志。
{% endnote %}

| 需求 | 选择 | 不要混淆 |
| --- | --- | --- |
| 仅运行一条获准管理员命令 | sudo | 临时授权不等于永久 root 身份 |
| 切换到另一用户的登录环境 | su - 用户名 | 这会改变环境与会话上下文 |
| 编辑受保护配置 | sudoedit | 先确认编辑器、备份和策略，而非直接用 sudo 编辑器 |

{% note info flat %}
Ubuntu 26.04 的 sudo 默认提供者为 sudo-rs，同时保留经典 sudo.ws 作为替代入口。它们是提供者差异，不是授权模型差异；具体主机以 sudo -V、sudo -l 与受管策略为准。
{% endnote %}

## 软件包生命周期

{% mermaid %}
flowchart LR
  A[仓库索引] --> B[候选版本]
  B --> C[模拟计划]
  C --> D[安装或升级]
  D --> E[包数据库与文件]
{% endmermaid %}

### 查询与计划

~~~bash
apt-cache policy bash
apt-cache show bash
dpkg -s bash
dpkg -S /usr/bin/bash

PACKAGE=tree
apt-get --simulate install "$PACKAGE"
~~~

{% note primary flat %}
apt-cache 读取索引和候选版本；dpkg -s 查询已安装包状态，dpkg -S 反查某文件归属；apt-get --simulate 只展示解析出的改变，不写入系统。先检查候选来源、将新增或删除的包和退出状态，再决定是否执行真实安装。
{% endnote %}

### 执行动作

~~~bash
PACKAGE=tree
sudo apt install "$PACKAGE"
sudo apt-mark manual "$PACKAGE"
~~~

{% note warning flat %}
两条都会改变系统，只能在上一节模拟计划符合预期后执行；apt-mark manual 改变自动清理判断，不等于“锁定版本”。apt 适合交互，apt-get 更适合脚本化接口，update 只刷新索引，不等于升级、更不等于服务已经启动。
{% endnote %}

### 发行版边界

| 目标 | Debian/Ubuntu | RHEL 系 |
| --- | --- | --- |
| 解析仓库依赖 | apt、apt-get | dnf |
| 查询已安装包与文件 | dpkg -s、dpkg -S | rpm -q、rpm -ql |
| 判断时机 | 先看候选与模拟计划 | 先看仓库、模块流和事务历史 |

{% note info flat %}
dnf 负责仓库与依赖求解，rpm 负责本地包元数据与文件查询；它们不能与 APT 的包名、服务名或配置路径机械互换。APT 第三方源的 signed-by keyring 把一个仓库绑定到指定密钥：记录来源、签名链和回滚方式，绝不使用 apt-key 或未知脚本的密钥管道。
{% endnote %}

## 结果验证

~~~bash
if test -n "$LAB" && test -f "$LAB/.linux-permission-lab"; then
  TARGET="$LAB/project/config"
  test -d "$LAB/project"
  test -r "$TARGET"
  printf 'effective-id=%s\n' "$(id -u)"
  printf 'primary-group=%s\n' "$(id -gn)"
  printf '保留临时目录供检查：%s\n' "$LAB"
else
  printf '%s\n' '请先运行“私有实验”创建隔离目录' >&2
fi

apt-cache policy bash
dpkg -s bash >/dev/null && printf '%s\n' 'bash package metadata available'
~~~

{% note success flat %}
权限验证要能回答“谁在访问、父目录能否搜索、文件模式与归属是什么”；软件验证要能回答“候选来自哪里、计划会改变什么、已安装数据库是否有记录”。LAB 不会被自动删除，检查完再按你的环境安全清理。
{% endnote %}

{% flashcard basic id:linux-a6-id-getent deck:"Linux" priority:1 tags:"身份,NSS" %}
--- question
id、groups 和 getent 分别回答什么问题？
--- answer
id 看有效 UID/GID 与附加组，groups 快速列组，getent 通过 NSS 查询账户或组数据库。
--- explanation
目录服务环境中不能只读 /etc/passwd；权限判断还要结合父目录和服务上下文。
{% endflashcard %}

{% flashcard basic id:linux-a6-chmod-umask deck:"Linux" priority:1 tags:"权限,模式位" %}
--- question
chmod 和 umask 的作用有什么不同？
--- answer
chmod 修改已有对象模式；umask 参与新建对象的默认权限计算。
--- explanation
目录需要搜索权限；不要用 777 代替所有权、组和父目录检查。
{% endflashcard %}

{% flashcard basic id:linux-a6-apt-dpkg deck:"Linux" priority:1 tags:"APT,dpkg" %}
--- question
apt-cache、apt-get --simulate 和 dpkg 分别提供什么证据？
--- answer
apt-cache 看索引和候选版本，apt-get --simulate 预演依赖变化，dpkg 查询已安装包和文件归属。
--- explanation
模拟计划通过后才考虑安装；安装成功也不代表服务已启动，运行状态要另外验证。
{% endflashcard %}

{% flashcard basic id:linux-a6-sudo-su deck:"Linux" priority:2 tags:"sudo,su" %}
--- question
sudo 与 su - 的主要边界是什么？
--- answer
sudo 通常授权执行特定命令；su - 切换到另一个用户的登录环境，影响的会话上下文更大。
--- explanation
先用 sudo -l 看策略；临时管理员操作也需要目标、影响范围和回滚证据。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024 Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/utilities/contents.html, https://pubs.opengroup.org/favicon.ico %}
{% link Ubuntu sources.list Manual, https://manpages.ubuntu.com/manpages/resolute/man5/sources.list.5.html, https://manpages.ubuntu.com/favicon.ico %}
{% link Ubuntu 26.04 Summary for LTS Users, https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/, https://documentation.ubuntu.com/favicon.ico %}
{% link Red Hat DNF Documentation, https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_software_with_the_dnf_tool/index, https://docs.redhat.com/favicon.ico %}
{% endlinkgroup %}

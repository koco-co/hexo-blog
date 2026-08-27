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
date: 2026-03-15 00:00:00
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
id 给出当前有效 UID、主组和附加组；groups 适合快速查看组集合；getent 通过 NSS（名称服务切换）查询账户或组数据库，不能只假定信息一定来自 /etc/passwd。验证时，getent 输出应含当前用户名或组名；这些都是只读命令。
{% endnote %}

### 账户操作

| 中文场景 | 选择 | 先确认的边界 |
| --- | --- | --- |
| 创建账户 | useradd | home、初始组、登录 Shell 和批准范围 |
| 修改已有账户属性或附加组 | usermod | 现有会话、文件归属和组变更影响 |
| 回收账户 | userdel | home、持有文件、运行进程和保留计划 |
| 创建工作组 | groupadd | 命名、现有目录与成员策略 |
| 修改工作组 | groupmod | 旧组名、成员和已归属文件 |
| 删除工作组 | groupdel | 现有成员与仍使用该 GID 的文件 |
| 设置、过期或锁定凭据 | passwd | 这是认证操作，不会刷新文件权限 |
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
if chgrp "$(id -gn)" "$TARGET"; then
  printf 'group-change=%s\n' "$(stat -c '%g' "$TARGET")"
else
  printf '%s\n' 'chgrp requires ownership or membership in the target group' >&2
fi
ls -ld "$LAB/project" "$TARGET"

test "$(stat -c '%a' "$LAB/project")" = 750
test "$(stat -c '%a' "$TARGET")" = 640
test "$(stat -c '%g' "$TARGET")" = "$(id -g)"
printf 'mode-and-group=%s:%s\n' "$(stat -c '%a' "$TARGET")" "$(stat -c '%g' "$TARGET")"

( umask 027; : >"$LAB/from-umask"; ls -l "$LAB/from-umask" )
~~~

{% note primary flat %}
先看目录，再看文件：进入目录需要 x（搜索）权限，读取文件不代表能穿过每一级父目录。chmod 改模式位，chgrp 只改组；上面的对象全在 LAB 内。umask 只参与新对象的默认模式，常见文件起点是 0666、目录起点是 0777，再去掉 umask 指定的位。
{% endnote %}

### 归属判断

~~~bash
if test -n "$LAB" && test -f "$LAB/.linux-permission-lab"; then
  TARGET="$LAB/project/config"
  EXPECTED_OWNER=$(id -u)
  EXPECTED_GROUP=$(id -g)
  printf 'uid=%s gid=%s\n' "$EXPECTED_OWNER" "$EXPECTED_GROUP"
  ls -ln "$TARGET"

  if chown "$EXPECTED_OWNER:$EXPECTED_GROUP" "$TARGET"; then
    test "$(stat -c '%u:%g' "$TARGET")" = "$EXPECTED_OWNER:$EXPECTED_GROUP"
    printf 'owner-and-group=%s\n' "$(stat -c '%u:%g' "$TARGET")"
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

TEST_USER=
if test -n "$TEST_USER"; then
  if su - "$TEST_USER" -c 'id'; then
    printf 'su-login-verified=%s\n' "$TEST_USER"
  else
    printf 'su failed: check authentication, policy, shell and target account state\n' >&2
  fi
else
  printf '%s\n' '仅在获准测试账户中设置 TEST_USER 后验证 su - 的登录环境' >&2
fi
~~~

{% note danger flat %}
sudo -l 读取当前策略允许的命令；第二条只以当前身份运行 id，用来说明“授权到哪个目标用户”是策略问题。设置 TEST_USER 后，su - 会进入那个获准测试账户的登录环境，并以 id 验证实际身份；不要在生产主机随意切换账户，也不要把密码放进命令行、脚本或日志。
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
flowchart TD
  A[仓库索引] --> B[候选版本]
  B --> C[模拟计划]
  C --> D[安装或升级]
  D --> E[包数据库与文件]
{% endmermaid %}

### 查询与计划

{% note info flat %}
本节的 APT 命令只适用于 Debian/Ubuntu 系。先选定一个已审批的候选包，并让候选、模拟、写入和结果验证使用同一个 PACKAGE；不要把 RHEL 的包名或事务选项逐字套到 APT。
{% endnote %}

~~~bash
PACKAGE=tree  # 改为已审批的候选包
apt-cache policy "$PACKAGE"
apt-cache show "$PACKAGE"

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
dpkg -s "$PACKAGE"
apt-mark showmanual | grep -Fx "$PACKAGE"

INSTALLED_PACKAGE=bash
dpkg -S "$(command -v "$INSTALLED_PACKAGE")"
~~~

{% note warning flat %}
两条都会改变系统，只能在上一节模拟计划符合预期后执行；随后用 dpkg -s 确认安装状态、用 apt-mark showmanual 确认手动标记。apt-mark manual 改变自动清理判断，不等于“锁定版本”。apt 适合交互，apt-get 更适合脚本化接口，update 只刷新索引，不等于升级、更不等于服务已经启动。
{% endnote %}

### 发行版边界

APT 与 DNF 是真正平行的包管理入口，先根据目标发行版选择一页，不要把命令和包名跨页拼接：

{% tabs 包管理器, 1 %}
<!-- tab Debian / Ubuntu@fab fa-ubuntu -->
```bash
PACKAGE=bash
apt-cache policy "$PACKAGE"
apt-get --simulate install "$PACKAGE"
dpkg -s "$PACKAGE"
dpkg -S "$(command -v "$PACKAGE")"
```
<!-- endtab -->
<!-- tab RHEL 系@fab fa-redhat -->
```bash
PACKAGE=bash
dnf --assumeno install "$PACKAGE"
rpm -q "$PACKAGE"
rpm -ql "$PACKAGE"
```
<!-- endtab -->
{% endtabs %}

{% note info flat %}
Debian/Ubuntu 用 `apt`/`apt-get` 解析仓库、用 `dpkg` 读取本机包数据库；RHEL 系用 `dnf` 求解事务、用 `rpm` 查询本地元数据。两组命令的候选版本、文件路径和服务名称都可能不同，迁移时先确认发行版再复核结果。
{% endnote %}

{% note info flat %}
dnf 负责仓库与依赖求解，rpm 负责本地包元数据与文件查询；它们不能与 APT 的包名、服务名或配置路径机械互换。旧笔记中的 yum 入口在 RHEL 系应迁移为 dnf；--assumeno 只预演，不写入事务。APT 第三方源则应迁移离开全局信任的 apt-key，改用仓库行中的 signed-by keyring。
{% endnote %}

~~~bash
if grep -R -i -E --include='*.list' --include='*.sources' 'signed-by[[:space:]]*[=:]' /etc/apt 2>/dev/null; then
  printf '%s\n' 'repository-scoped signed-by entries found'
else
  status=$?
  if test "$status" -eq 1; then
    printf '%s\n' 'no signed-by entry found in readable APT source definitions' >&2
  else
    printf '%s\n' 'APT source definitions could not be fully read' >&2
  fi
fi
~~~

{% note warning flat %}
上面的只读查询同时识别传统 .list 的 signed-by= 与 Deb822 .sources 的 Signed-By:；无匹配、读取失败会分别给出状态。没有条目可能表示没有第三方源或源未使用 scoped keyring；不要把未知密钥通过管道交给 shell，也不要把 apt-key 的旧写法当作 signed-by 的逐项等价替换。
{% endnote %}

## 结果验证

~~~bash
if test -n "$LAB" && test -f "$LAB/.linux-permission-lab"; then
  TARGET="$LAB/project/config"
  test -d "$LAB/project"
  test "$(stat -c '%a' "$LAB/project")" = 750
  test "$(stat -c '%a' "$TARGET")" = 640
  test "$(stat -c '%g' "$TARGET")" = "$(id -g)"
  printf 'effective-id=%s\n' "$(id -u)"
  printf 'primary-group=%s\n' "$(id -gn)"
  printf '保留临时目录供检查：%s\n' "$LAB"
else
  printf '%s\n' '请先运行“私有实验”创建隔离目录' >&2
fi

PACKAGE=tree
apt-cache policy "$PACKAGE"
apt-get --simulate install "$PACKAGE" >/dev/null && printf '%s\n' 'apt simulation available'
if dpkg -s "$PACKAGE" >/dev/null 2>&1; then
  apt-mark showmanual | grep -Fx "$PACKAGE" >/dev/null && printf '%s\n' 'approved package is installed and marked manual'
else
  printf '%s\n' 'PACKAGE is not installed: this is expected until an approved install has completed' >&2
fi
~~~

{% note success flat %}
权限验证要能回答“谁在访问、父目录能否搜索、文件模式与归属是什么”；软件验证要能回答“候选来自哪里、计划会改变什么、已安装数据库是否有记录”。LAB 不会被自动删除，检查完再按你的环境安全清理。
{% endnote %}

## 常见问题

{% flashcard basic id:linux-a6-id-getent deck:"Linux" priority:1 tags:"身份,NSS" %}
--- question
id、groups 和 getent 分别回答什么问题？
--- answer
id 看有效 UID/GID 与附加组，groups 快速列组，getent 通过 NSS 查询账户或组数据库。
--- explanation
这三个命令查询的层次不同：

```bash
id alice
groups alice
getent passwd alice
getent group engineers
```

`id` 展示有效 UID/GID 和附加组，`groups` 是快速摘要，`getent` 通过 NSS 读取本地文件、LDAP 或其他配置的账户源。目录服务环境中 `/etc/passwd` 可能只有本地用户；最终权限还要结合父目录的搜索位、服务进程的身份和 ACL。
{% endflashcard %}

{% flashcard basic id:linux-a6-chmod-umask deck:"Linux" priority:1 tags:"权限,模式位" %}
--- question
chmod 和 umask 的作用有什么不同？
--- answer
chmod 修改已有对象模式；umask 参与新建对象的默认权限计算。
--- explanation
新建对象的默认模式不是简单的“固定值”：

```bash
umask 027
touch report.txt
mkdir report.d
stat -c '%A %n' report.txt report.d
chmod u+rw,go-rwx report.txt
```

`umask` 只参与创建时的权限计算，`chmod` 修改已经存在的对象；目录的 `x` 是“能否穿过目录”，不是“能否执行目录”。遇到 Permission denied，依次检查所有者/组、每一级父目录、ACL、挂载选项和服务身份，不要直接把权限放宽到 `777`。
{% endflashcard %}

{% flashcard basic id:linux-a6-apt-dpkg deck:"Linux" priority:1 tags:"APT,dpkg" %}
--- question
apt-cache、apt-get --simulate 和 dpkg 分别提供什么证据？
--- answer
apt-cache 看索引和候选版本，apt-get --simulate 预演依赖变化，dpkg 查询已安装包和文件归属。
--- explanation
三种证据分别回答“仓库知道什么、如果安装会发生什么、当前本机装了什么”：

```bash
apt-cache policy bash
apt-get --simulate install bash
dpkg -s bash
dpkg -L bash | head
```

只有模拟计划和来源符合预期时才进入真实安装；`dpkg -s` 也不能证明服务已启动，运行状态应再用 `systemctl is-active` 或实际健康检查验证。RHEL 系则用 `dnf --assumeno` 预演、`rpm -q` 查询，不要把两套包数据库的输出混为一谈。
{% endflashcard %}

{% flashcard basic id:linux-a6-sudo-su deck:"Linux" priority:2 tags:"sudo,su" %}
--- question
sudo 与 su - 的主要边界是什么？
--- answer
sudo 通常授权执行特定命令；su - 切换到另一个用户的登录环境，影响的会话上下文更大。
--- explanation
`sudo` 和 `su -` 的差异可以从执行上下文看出来：

```bash
sudo -l                 # 当前用户被允许执行什么
sudo systemctl status ssh.service
su - alice               # 切换为 alice 的登录环境（会改变 HOME、Shell 等）
```

`sudo` 通常把一次命令限制在策略允许的范围内，`su -` 会创建另一个用户的完整登录会话，影响范围更大。两者都不替代授权记录；涉及生产变更时还要保存目标、批准、复测和回滚证据。
{% endflashcard %}

{% flashcard basic id:linux-a6-account-group-actions deck:"Linux" priority:2 tags:"账户,用户组" %}
--- question
创建、修改、删除用户或组时分别优先选择什么命令？
--- answer
用户用 useradd、usermod、userdel；组用 groupadd、groupmod、groupdel。
--- explanation
账户生命周期要把命令和后果对应起来：

| 对象 | 创建 | 修改 | 删除前需确认 |
| --- | --- | --- | --- |
| 用户 | `useradd` | `usermod` | HOME、文件归属、运行进程 |
| 组 | `groupadd` | `groupmod` | 成员、ACL、服务配置 |
| 用户/组关系 | `usermod -aG` | `gpasswd` | 新会话是否重新加载组 |

例如 `usermod -G` 会覆盖附加组列表，漏掉 `-a` 可能让用户突然失去访问权。删除前先用 `id`、`find`、进程清单和备份确认影响，不能用“重新创建同名账户”假装完成回收。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024 Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/utilities/contents.html, https://pubs.opengroup.org/favicon.ico %}
{% link Ubuntu sources.list Manual, https://manpages.ubuntu.com/manpages/resolute/man5/sources.list.5.html, https://manpages.ubuntu.com/favicon.ico %}
{% link Ubuntu 26.04 Summary for LTS Users, https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/, https://documentation.ubuntu.com/favicon.ico %}
{% link Red Hat DNF Documentation, https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/managing_software_with_the_dnf_tool/index, https://docs.redhat.com/favicon.ico %}
{% endlinkgroup %}

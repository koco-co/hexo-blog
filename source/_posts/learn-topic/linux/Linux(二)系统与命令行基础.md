---
title: Linux(二)系统与命令行基础
tags:
  - Linux
  - 命令行基础
categories:
  - Learn Topic
  - Linux
description: 掌握 Linux 系统组成、目录层级、Shell、环境变量、命令解析和帮助系统。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 2
published: true
abbrlink: 6153b09f
date: 2026-03-11 00:00:00
---

{% course_series %}

{% note info flat %}
把一台陌生 Linux 主机交给你时，第一项工作不是背命令，而是建立一份可复现的环境清单：内核是什么、命令由谁提供、当前目录在哪里、Shell 如何查找命令，以及哪些帮助入口可以继续追查。本文只处理这条主线；文件内容处理、重定向组合、权限、进程、网络、日志和性能在后续主题中展开。
{% endnote %}

## Linux 系统组成

{% note primary flat %}
Linux 严格说是内核；Ubuntu、Debian、Fedora 等是把内核、用户空间工具、包管理器和默认配置组合起来的发行版。终端是输入输出界面，Shell 是解释命令的程序，ls、cd 等命令可能来自 Shell 内建、外部可执行文件或别名。
{% endnote %}

### 分层模型

{% mermaid %}
flowchart TD
  A[硬件与虚拟硬件] --> B[Linux 内核]
  B --> C[用户空间库与服务]
  C --> D[发行版工具与配置]
  D --> E[终端]
  E --> F[Shell]
  F --> G[内建或外部命令]
{% endmermaid %}

{% note info flat %}
排障时要保留层次：uname 主要观察内核，/etc/os-release 观察发行版，bash --version 观察 Shell，type -a ls 观察命令解析结果。只看到一个版本号，不能推断整台机器的所有组件版本。
{% endnote %}

### 终端与 Shell

{% note info flat %}
终端模拟器或远程终端负责传输字符；Shell 读取一行命令，进行别名、变量、路径和重定向等解析，再决定执行内建命令还是外部程序。因此“终端不能执行命令”通常是把界面和解释器混为一谈，先检查 SHELL、$0 和 type。
{% endnote %}

## 发行版与环境

### 识别系统

~~~bash
uname -srm
cat /etc/os-release
bash --version
~~~

| 观察目标 | 首选命令 | 结果含义 | 不应据此推断 |
| --- | --- | --- | --- |
| 内核名称、版本、架构 | uname -srm | 当前运行内核与机器架构 | 发行版名称和用户空间工具版本 |
| 发行版身份 | cat /etc/os-release | ID、VERSION_ID、PRETTY_NAME | 当前内核是否与发行版原生匹配 |
| Shell 实现 | bash --version | Bash 主版本与构建信息 | 当前脚本一定以 Bash 执行 |
| Ubuntu 派生信息 | lsb_release -a | 若安装了 lsb-release，提供发行版摘要 | 该命令在极简容器中一定存在 |

{% note warning flat %}
WSL2、容器和虚拟机都可能让“发行版”和“内核提供者”不在同一个边界内。把 uname、/etc/os-release 和命令实现分别记录，才能解释“同一条命令在本机和 CI 中输出不同”。
{% endnote %}

### 命令提供者

{% note info flat %}
Ubuntu 26.04 将一批核心工具的默认实现切换为 Rust 编写的 uutils（默认核心工具实现），同时保留带 `gnu-` 前缀的 GNU 替代命令。这个发行版差异不改变命令学习方法：先查解析结果，再看实现版本；不要根据命令名猜测它由哪套工具提供。
{% endnote %}

~~~bash
type -a ls
command -V ls
ls --version
type -a gnu-ls
~~~

{% note primary flat %}
面试或故障报告中不要只写“Linux 版本”。至少写出发行版、内核、Shell、命令路径和 --version 输出的关键行；如果依赖 GNU 特性，明确写出 gnu- 命令或 POSIX 可移植替代。
{% endnote %}

### 交互输入

{% note info flat %}
提示符由 Shell 变量 `PS1` 生成；Readline 负责光标移动、删除、历史检索和补全；History facilities 则保存和重放历史命令。三者只影响交互输入体验，不改变外部命令在 `PATH` 中的查找顺序。别名会在词法解析时替换命令词，因此排障时必须用 `type -a` 看见它。
{% endnote %}

~~~bash
alias ll='ls -lh'
type -a ll
unalias ll
history | tail -n 3
fc -l -3
printf 'PS1=%s\n' "$PS1"
bind -P | head -n 5
~~~

{% note primary flat %}
定义 `ll` 后，`type -a ll` 应显示它是 alias；执行 `unalias ll` 后同一查询不应再命中它。`history` 与 `fc -l` 显示最近命令，`bind -P` 显示当前 Bash 的按键绑定。历史可能含有敏感参数，演示与排障时只取最小片段，不把整份历史贴到工单。
{% endnote %}

{% folding blue, Bash 低频索引：用途与边界 %}
| 分组 | 条目 | 何时使用 | 不要把它当成 |
| --- | --- | --- | --- |
| 目录栈与历史 | dirs、pushd、popd、history、fc、9.1 Bash History Facilities、9.2 Bash History Builtins、9.3.1 Event Designators、9.3.2 Word Designators、9.3.3 Modifiers、8.2.5 Searching for Commands in the History | 需要在交互式 Bash 中跳转目录、查看或重新编辑最近命令 | 可审计的长期执行记录；生产操作仍应写成脚本或记录到日志 |
| Readline 编辑 | 8.1 Introduction to Line Editing、8.2.1 Readline Bare Essentials、8.2.2 Readline Movement Commands、8.2.3 Readline Killing Commands、8.2.4 Readline Arguments、8.4.1 Commands For Moving、8.4.2 Commands For Manipulating The History、8.4.3 Commands For Changing Text、8.4.4 Killing And Yanking、8.4.5 Specifying Numeric Arguments、8.4.7 Keyboard Macros、8.4.8 Some Miscellaneous Commands、8.5 Readline vi Mode | 想定制交互编辑、历史搜索或 vi 风格按键 | 脚本运行时的依赖；CI 与非交互 Shell 未必启用 Readline |
| Readline 配置与补全 | 8.3.1 Readline Init File Syntax、8.3.2 Conditional Init Constructs、8.3.3 Sample Init File、8.4.6 Letting Readline Type For You、8.6 Programmable Completion、8.7 Programmable Completion Builtins、8.8 A Programmable Completion Example | 为本机交互会话增加按键规则或补全 | 服务端功能或可移植命令语义；配置前先确认 Bash 和 Readline 都存在 |
| 基础概念 | 1.1 What is Bash?、1.2 What is a shell?、2 Definitions | 需要回到 Bash 文档中的术语定义 | 某条命令的行为规范；该规范仍以对应命令手册为准 |
| 兼容与终端工具 | admin、asa、cal、cmp、ed、ex、fuser、iconv、mesg、patch、pathchk、tabs、tput、tsort、ulimit、write | 需要识别旧式管理、格式、比较、编码、终端控制、资源上限或图结构工具 | 日常命令解析的首选方案；文件处理、权限、性能和文本转换分别在对应主题展开 |
| 发行版与特权入口 | install、mknod、lsb_release、users、su-rs、sudo-rs、sudo.ws、sudoedit-rs、visudo-rs、visudo.ws | 识别系统提供者、会话摘要或提权实现名称 | 未经验证的配置修改；权限策略与软件管理在权限主题中处理 |
{% endfolding %}

{% note info flat %}
上表是“见到名称时知道该去哪里查”的索引，不要求初学者逐项背诵。`alias`、`unalias`、历史、启动文件和帮助入口属于本文主线；特权、设备、文件与文本工具只说明选择边界，避免把后续主题塞回这一篇。
{% endnote %}

{% folding blue, Bash 官方章节入口 %}
6.6 Aliases、6.2 Bash Startup Files、Command-line editing、Prompt control、History facilities 与 `unalias` 共同构成交互式命令解析链。需要精确选项、版本差异或完整键位时，从对应官方章节继续查，而不是依赖记忆中的快捷键。
{% endfolding %}

## 目录与路径

### FHS 目录

{% note info flat %}
Linux 只有一个根目录 /。不同磁盘可以挂载到树上的任意目录，因此目录名表达用途，不直接表达物理设备。
{% endnote %}

| 目录 | 常见内容 | 排障时先问 |
| --- | --- | --- |
| / | 文件系统树根 | 当前路径是否落在预期挂载点 |
| /etc | 主机和服务配置 | 配置属于系统级还是用户级 |
| /usr | 大多数只读用户空间程序和数据 | 可执行文件由哪个包提供 |
| /var | 日志、缓存、队列和可变状态 | 数据增长是否造成容量问题 |
| /home | 普通用户主目录 | HOME 是否指向预期位置 |
| /tmp | 临时文件 | 任务结束后是否需要清理 |
| /run | 启动后生成的运行时状态 | 重启后内容是否仍应存在 |
| /dev、/proc、/sys | 设备、进程内核接口、硬件与内核属性 | 这是文件、伪文件还是设备节点 |
| /boot | 启动相关内核和引导文件 | 修改前是否有恢复路径 |
| /opt、/srv | 第三方软件、对外服务数据 | 是否属于应用自己的约定 |

### 路径语义

| 写法 | 起点 | 示例 | 适合场景 |
| --- | --- | --- | --- |
| /var/log | 根目录 | ls /var/log | 机器级固定位置 |
| ./report | 当前目录 | ls ./report | 明确表达不依赖 PATH |
| ../shared | 当前目录的父目录 | cd ../shared | 相邻目录跳转 |
| ~/work | 当前用户的 HOME | cd ~/work | 用户私有路径 |

~~~bash
pwd
cd /tmp
pwd
cd -
basename "$PWD"
readlink -f .
realpath .
~~~

{% note warning flat %}
pwd 展示的是当前工作目录；符号链接可能让逻辑路径和物理路径不同。需要确认真实落点时使用 readlink -f 或 realpath，需要保留用户输入的逻辑路径时不要擅自解析。basename 只取最后一个路径组件，不检查目标是否存在。
{% endnote %}

## 命令解析

### 查找顺序

{% mermaid %}
flowchart TD
  A[输入命令词] --> B{别名}
  B -- 是 --> C[替换别名后重新解析]
  B -- 否 --> D{Shell 函数}
  D -- 是 --> E[执行函数]
  D -- 否 --> F{内建命令}
  F -- 是 --> G[Shell 进程内执行]
  F -- 否 --> H[按 PATH 查找外部文件]
  H --> I{命中 hash 缓存}
  I -- 是 --> J[使用缓存路径]
  I -- 否 --> K[搜索 PATH 并缓存]
{% endmermaid %}

{% note primary flat %}
看到“命令找不到”或“执行了旧版本”时，先不要修改 PATH。依次运行 type -a name、command -V name、printf '%s\\n' "$PATH" 和 hash -r，把解析层、搜索路径和缓存状态分开验证。
{% endnote %}

### 选择查询命令

| 中文场景 | 命令 | 选择理由 | 边界 |
| --- | --- | --- | --- |
| 我想知道命令到底是什么 | type -a name | 能显示别名、函数、内建和所有命中路径 | 不给出包管理器归属 |
| 脚本中需要可移植地找可执行文件 | command -v name | POSIX 语义，适合判断是否可调用 | 只返回首个解析结果 |
| 需要 Bash 的详细分类 | command -V name | 展示 alias/function/builtin/file 等说明 | 输出是给人看的，不要硬解析整句 |
| 想查二进制、手册和源码位置 | whereis name | 一次列出多类位置 | 依赖系统数据库和目录约定 |
| 只想看 PATH 中的外部文件 | which name | 交互式快速查看 | 可能忽略别名、函数和内建，不作为脚本判断依据 |
| 想知道默认可搜索目录 | getconf PATH | 查询 POSIX 配置的默认 PATH | 当前 Shell 的 PATH 可能已被修改 |
| 命令路径疑似过期 | hash -r | 清除 Bash 的外部命令缓存 | 不会修复权限或文件本身 |
| 需要 POSIX Shell | sh -c 'command -v name' | 明确用 sh 执行一段命令 | 不要假设 sh 等同于 Bash |

~~~bash
type -a cd
command -v cd
command -V cd
type -a ls
whereis ls
which ls
getconf PATH
hash -r
~~~

## 运行环境

### 环境变量

| 变量 | 作用 | 检查方式 |
| --- | --- | --- |
| HOME | 当前用户主目录 | printenv HOME |
| PWD、OLDPWD | 当前目录与上一个目录 | pwd、printenv OLDPWD |
| PATH | 外部命令搜索目录 | printenv PATH |
| LANG、LC_* | 语言、排序、数字和时间格式 | locale |
| TERM | 终端能力类型 | printenv TERM |
| PS1 | 交互提示符格式 | printf '%s\n' "$PS1" |
| SHLVL | Shell 嵌套层数 | printenv SHLVL |

~~~bash
env
printenv PATH
locale
uname -a
~~~

{% note info flat %}
env 默认列出环境变量，printenv NAME 适合取一个变量；Shell 局部变量不一定会被子进程继承。不要用 env 的完整输出当作稳定配置文件，报告中只记录与问题相关的键。
{% endnote %}

### 身份与终端

~~~bash
whoami
logname
who
users
tty
stty -a
~~~

| 命令 | 观察对象 | 常见空结果或失败 |
| --- | --- | --- |
| whoami | 当前有效用户 | 容器中通常仍可用 |
| logname | 登录会话用户名 | sudo、服务或容器没有登录记录时可能失败 |
| who、users | 登录会话摘要 | 无登录会话时为空 |
| tty | 当前标准输入是否为终端 | 管道、CI、重定向环境返回 not a tty |
| stty -a | 当前 TTY 的行规程 | 没有 TTY 时不能执行 |

{% note warning flat %}
whoami 与 logname 回答的问题不同：前者看有效身份，后者看登录会话。自动化任务中优先记录 whoami、id 和 tty，不要假设一定存在交互式登录。
{% endnote %}

### 启动与编辑

{% mermaid %}
flowchart TD
  A[启动 Bash] --> B{登录 Shell?}
  B -- 是 --> C["/etc/profile"]
  C --> D["~/.bash_profile 或 ~/.bash_login 或 ~/.profile"]
  B -- 否 --> E{交互式?}
  E -- 是 --> F[~/.bashrc]
  E -- 否 --> G[BASH_ENV 指向的文件]
  D --> H[读取命令与 Readline 配置]
  F --> H
  G --> H
{% endmermaid %}

{% note info flat %}
登录 Shell 与交互式 Shell 是两个维度。ssh 常见为登录且交互；图形终端打开的 Bash 常见为非登录但交互；脚本通常非交互。改了 ~/.bashrc 却在 SSH 中不生效时，先确认启动类型，再检查登录文件是否显式加载 .bashrc。
{% endnote %}

~~~bash
printf 'shell=%s flags=%s\n' "$0" "$-"
shopt login_shell
printf 'BASH_ENV=%s\n' "${BASH_ENV-unset}"
~~~

{% note primary flat %}
`$-` 含 `i` 表示交互式，`shopt login_shell` 显示登录状态，`BASH_ENV` 只可能影响非交互 Bash。三项共同决定应检查 `.bashrc`、登录文件还是 `BASH_ENV` 指向的文件；`shopt` 是 Bash 内建，不能拿去判断所有 `sh` 实现。
{% endnote %}

{% folding blue, 启动文件与历史 %}
常见文件包括 /etc/profile、~/.bash_profile、~/.bash_login、~/.profile、~/.bashrc 和 BASH_ENV 指向的文件。历史行为还受 HISTFILE、HISTSIZE、HISTCONTROL 等变量影响；Readline 负责光标移动、历史搜索、快捷键和可编程补全。修改前先用 type history、printenv HISTFILE 和 bind -P 观察当前状态。
{% endfolding %}

## 帮助与编辑

### 帮助分层

| 中文需求 | 命令 | 示例 |
| --- | --- | --- |
| 查 Bash 内建命令 | help | help cd、help help |
| 查 POSIX/外部命令手册 | man | man 1 ls、man 5 os-release |
| 查 GNU 信息文档 | info | info coreutils |
| 快速看一句摘要 | whatis | whatis ls |
| 查程序、手册、源码位置 | whereis | whereis bash |
| 交互式快速看 PATH 命中 | which | which ls |
| 分页查看长文本 | more | man ls \\| more |

{% note primary flat %}
先用 type 判断对象，再按对象选择帮助：Shell 内建用 help，外部命令用 man，GNU 复杂组件可补充 info，只要一句摘要用 whatis。--help 是常见入口，但不是所有命令都保证格式一致。
{% endnote %}

~~~bash
type cd
help cd
man 1 ls
whatis ls
info coreutils 'ls invocation'
~~~

{% note info flat %}
预期先看到 `cd is a shell builtin`，这说明应读 `help cd` 而不是只找外部 `man cd`。`man 1 ls` 的 `1` 是用户命令章节；`whatis` 只给数据库中的一句摘要，空结果通常意味着索引未安装或未更新；`info` 适合沿目录继续阅读 GNU 组件。没有 `man`、`info` 或 `whatis` 时，退回 `help`、`--help` 和发行版包文档。
{% endnote %}

### Vim 生存

{% note info flat %}
vi 是 POSIX 编辑器入口，vim 是常见的增强实现。只需完成一次配置修改时，记住以下最小状态机即可。
{% endnote %}

~~~text
vim file        # 打开文件
i               # 进入插入模式
Esc             # 回到普通模式
:wq             # 保存并退出
:q!             # 放弃修改并退出
/pattern        # 搜索
u               # 撤销
dd              # 删除当前行
~~~

{% note danger flat %}
在生产配置上按 :wq 前先确认文件路径和备份策略；:q! 只放弃本次编辑，不会恢复此前已经写入磁盘的内容。不能使用 Vim 时，先用 man、more 或受控的编辑器替代，不要把未验证的命令粘贴到配置文件。
{% endnote %}

## 结果验证

### 环境清单

{% note info flat %}
按顺序执行并保存与问题相关的输出；不要把密钥、令牌或整份私有环境变量发布到日志。
{% endnote %}

~~~bash
uname -a
cat /etc/os-release
bash --version
printf '%s\\n' "$SHELL"
printf '%s\\n' "$0"
pwd
ls -ld . "$HOME"
type -a cd
type -a ls
command -V ls
getconf PATH
printenv PATH
locale
whoami
logname
tty
stty -a
~~~

{% note success flat %}
成功标准是：能说清内核与发行版、当前 Shell、当前目录、ls 的实际实现、PATH 搜索边界、身份/TTY 状态以及下一步帮助入口。若某条命令失败，记录退出状态和失败原因，不用“命令不存在”掩盖环境差异。
{% endnote %}

### 失败边界

| 现象 | 可能原因 | 下一步检查 |
| --- | --- | --- |
| lsb_release 不存在 | 极简系统未安装 lsb-release | 读取 /etc/os-release |
| tty 返回 not a tty | CI、管道或重定向 | 检查执行入口是否需要交互 |
| logname 失败 | 没有登录会话 | 用 whoami 和服务上下文判断 |
| readlink -f 结果为空 | 路径不存在或无法解析 | 先 ls -ld 检查每级路径 |
| realpath 不存在 | 用户空间工具不完整 | 使用 readlink -f 或安装对应包 |
| which 与 type 不同 | 别名、函数、内建被 which 忽略 | 以 type -a 为准 |
| 版本参数输出不同 | uutils、GNU、BusyBox 或 BSD 实现不同 | type -a、完整路径和 --version |
| man 或 vim 不存在 | 极简容器未安装文档/编辑器 | 先用 help、--help、more 或安装包 |

## 常见问题

{% flashcard basic id:linux-a2-linux-distro deck:"Linux" priority:1 tags:"系统组成,发行版" %}
--- question
Linux 内核、发行版、终端和 Shell 分别是什么？
--- answer
内核管理硬件与资源；发行版组合内核和用户空间；终端负责字符输入输出；Shell 解释并执行命令。
--- explanation
可以把一次环境识别拆成四个观测点：

| 观测点 | 命令 | 看到的对象 |
| --- | --- | --- |
| 内核 | `uname -srm` | 正在运行的内核与架构 |
| 发行版 | `cat /etc/os-release` | 用户空间发行版标识 |
| Shell | `printf '%s\n' "$0"` | 当前解释器入口 |
| 命令解析 | `type -a ls` | 别名、内建或外部文件 |

这四个结果可能来自不同层，不能用一个版本号代替整台机器的结论。
{% endflashcard %}

{% flashcard basic id:linux-a2-type-which deck:"Linux" priority:1 tags:"命令解析,排障" %}
--- question
为什么排查命令来源优先用 type -a，而不是只用 which？
--- answer
type -a 能识别别名、函数、内建和多个外部路径；which 通常只查 PATH 中的外部文件。
--- explanation
例如，别名会在 PATH 搜索之前生效：

```bash
alias ll='ls -lh'
type -a ll       # 先看到 alias
type -a ls       # 可能同时看到 builtin 和外部路径
command -v ls    # 脚本中只需要“能否调用”时使用
```

因此 `which` 找不到的并不一定是“不能执行”，它可能是 Shell 内建或函数；脚本判断仍应使用 POSIX 的 `command -v`，交互排障则用 `type -a` 看完整解析链。
{% endflashcard %}

{% flashcard basic id:linux-a2-path-hash deck:"Linux" priority:1 tags:"PATH,缓存" %}
--- question
修改 PATH 后仍执行旧版本命令，应该先检查什么？
--- answer
检查 type -a name 和 PATH，再运行 hash -r 清除 Bash 的外部命令缓存。
--- explanation
Shell 会把已经找到的外部命令路径暂存在 hash 表中。可以用最小实验确认顺序：

```bash
type -a python
printf 'PATH=%s\n' "$PATH"
hash -t python 2>/dev/null || true
hash -r
type -a python
```

`hash -r` 只清掉缓存，不会修复权限、缺失文件或错误的 `PATH` 顺序；清缓存后仍要检查最终路径和 `--version`。
{% endflashcard %}

{% flashcard basic id:linux-a2-help-layer deck:"Linux" priority:2 tags:"帮助系统,man" %}
--- question
Shell 内建、外部命令和 GNU 信息文档分别先用什么帮助入口？
--- answer
内建用 help，外部命令用 man，GNU 复杂组件可补充 info；一句摘要用 whatis。
--- explanation
先判断命令的提供者，再进入对应文档层级：

| `type` 结果 | 首选入口 | 例子 |
| --- | --- | --- |
| `shell builtin` | `help` | `help cd` |
| 外部可执行文件 | `man` 或 `--help` | `man 1 ls` |
| GNU 复杂组件 | `info` | `info coreutils 'ls invocation'` |

这样不会把 `cd` 当成需要在 PATH 中寻找的外部程序；`whatis` 只有在手册索引完整时才会给出摘要，空结果不是命令不存在的证明。
{% endflashcard %}

{% flashcard basic id:linux-a2-pwd-realpath deck:"Linux" priority:2 tags:"路径,符号链接" %}
--- question
pwd、readlink -f 和 realpath 的关注点有什么不同？
--- answer
pwd 看当前工作目录；readlink -f 和 realpath 解析路径中的符号链接并给出物理落点。
--- explanation
三者回答的问题不同：

```bash
pwd                 # 当前 Shell 的工作目录
printf '%s\n' "$PWD"  # 保留 Shell 记录的逻辑路径
readlink -f ./link  # 解析符号链接后的物理落点
realpath ./link     # 同样用于得到规范化路径
```

如果用户要求记录“从哪个链接进入”，保留逻辑路径；只有判断挂载点、比较 inode 或定位真实文件时才解析。无条件规范化会丢掉这个上下文。
{% endflashcard %}

{% flashcard basic id:linux-a2-env-printenv deck:"Linux" priority:2 tags:"环境变量,Shell" %}
--- question
env 与 printenv PATH 的使用场景如何区分？
--- answer
env 默认列出环境变量；printenv PATH 只读取一个变量，更适合脚本和证据记录。
--- explanation
`printenv` 只能看到导出的环境变量，而当前 Shell 的普通变量不会自动进入子进程：

```bash
local_only=value
export inherited=value
sh -c 'printf "local=%s inherited=%s\\n" "${local_only-<unset>}" "$inherited"'
```

输出中 `local` 通常为空而 `inherited` 有值。`env` 适合一次观察整个继承环境，`printenv PATH` 适合脚本记录单个键；排障报告不要把完整环境原样上传，以免带出令牌或内部地址。
{% endflashcard %}

{% flashcard basic id:linux-a2-wsl-container deck:"Linux" priority:2 tags:"WSL2,容器,虚拟机" %}
--- question
为什么 WSL2 或容器中的 uname 与 /etc/os-release 可能描述不同环境？
--- answer
uname 描述当前运行的内核，/etc/os-release 描述用户空间发行版；虚拟化或容器可以把二者拆在不同边界。
--- explanation
容器通常共享宿主机内核，却携带自己的用户空间文件；WSL2 还会把 Linux 用户空间放在虚拟化内核之上。可以把证据分开记录：

```bash
uname -r                  # 内核边界
cat /etc/os-release       # 发行版边界
type -a ls                # 命令提供者
command -v systemd || true  # 当前环境是否提供该入口
```

若三组结果不属于同一个版本族，不应写成“机器版本为某某”；应说明是“某发行版用户空间运行在某内核上”，并继续检查容器、WSL 或虚拟机边界。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024 Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/utilities/contents.html, https://pubs.opengroup.org/favicon.ico %}
{% link POSIX.1-2024 Environment Variables, https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap08.html, https://pubs.opengroup.org/favicon.ico %}
{% link GNU Bash Reference Manual, https://www.gnu.org/software/bash/manual/bash.html, https://www.gnu.org/favicon.ico %}
{% link GNU Coreutils Manual, https://www.gnu.org/software/coreutils/manual/coreutils.html, https://www.gnu.org/favicon.ico %}
{% link Ubuntu 26.04 Summary for LTS Users, https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/, https://documentation.ubuntu.com/favicon.ico %}
{% link Vim Help, https://vimhelp.org/usr_02.txt.html, https://vimhelp.org/favicon.ico %}
{% endlinkgroup %}

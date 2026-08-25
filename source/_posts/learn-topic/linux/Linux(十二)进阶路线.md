---
title: Linux(十二)进阶路线
tags:
  - Linux
  - Linux 进阶
categories:
  - Learn Topic
  - Linux
description: 按可移植性、启动恢复、隔离资源、存储网络、安全和深度观测选择后续方向。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 12
published: false
abbrlink: 9efa11cb
date: 2026-08-25 00:00:00
---
<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：承接低频、平台相关、需要权限或可能产生较高风险的能力，不阻塞主课程。
- 可观察成果：能够根据问题选择进阶方向，并知道前置、权限、版本和风险。
- 进入条件：第 7～11 篇；第 13 篇不要求本篇。
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 能力分配：
- 进阶路线 / 可移植性与实现：bash5.3:builtin:index-bind、bash5.3:builtin:index-builtin、bash5.3:builtin:index-caller、bash5.3:builtin:index-compgen、bash5.3:builtin:index-complete、bash5.3:builtin:index-compopt、bash5.3:builtin:index-enable、bash5.3:builtin:index-let、bash5.3:builtin:index-logout、bash5.3:builtin:index-shopt、bash5.3:builtin:index-typeset、bash5.3:feature:compatibility、bash5.3:feature:coproc、bash5.3:feature:extglob、bash5.3:feature:process-substitution、bash5.3:feature:restricted-shell、bash5.3:feature:shopt、bash5.3:toc:Bash-POSIX-Mode-1、bash5.3:toc:Bash-Variables、bash5.3:toc:Bourne-Shell-Variables、bash5.3:toc:Controlling-the-Prompt、bash5.3:toc:Directory-Stack-Builtins、bash5.3:toc:Interactive-Shell-Behavior、bash5.3:toc:Invoking-Bash、bash5.3:toc:Is-this-Shell-Interactive_003f、bash5.3:toc:Shell-Compatibility-Mode、bash5.3:toc:The-Restricted-Shell、bash5.3:toc:What-is-an-Interactive-Shell_003f、bash5.3:toc:What-is-POSIX_003f、posix2024:utility:ar、posix2024:utility:cflow、posix2024:utility:ctags、posix2024:utility:make、posix2024:utility:nm、ubuntu26.04:command:accessdb、ubuntu26.04:command:add-shell、ubuntu26.04:command:apropos、ubuntu26.04:command:apt-cdrom、ubuntu26.04:command:apt-config、ubuntu26.04:command:arch、ubuntu26.04:command:busctl、ubuntu26.04:command:catman、ubuntu26.04:command:col、ubuntu26.04:command:colcrt、ubuntu26.04:command:colrm、ubuntu26.04:command:column、ubuntu26.04:command:coreutils、ubuntu26.04:command:dir、ubuntu26.04:command:dircolors、ubuntu26.04:command:dpkg-deb、ubuntu26.04:command:dpkg-divert、ubuntu26.04:command:dpkg-maintscript-helper、ubuntu26.04:command:dpkg-query、ubuntu26.04:command:dpkg-realpath、ubuntu26.04:command:dpkg-split、ubuntu26.04:command:dpkg-statoverride、ubuntu26.04:command:dpkg-trigger、ubuntu26.04:command:factor、ubuntu26.04:command:gawkbug、ubuntu26.04:command:getopt、ubuntu26.04:command:hashsum、ubuntu26.04:command:hd、ubuntu26.04:command:hexdump、ubuntu26.04:command:hostid、ubuntu26.04:command:hostnamectl、ubuntu26.04:command:i386、ubuntu26.04:command:iconvconfig、ubuntu26.04:command:ischroot、ubuntu26.04:command:ld.so、ubuntu26.04:command:ldconfig、ubuntu26.04:command:ldd、ubuntu26.04:command:lessecho、ubuntu26.04:command:lessfile、ubuntu26.04:command:lesskey、ubuntu26.04:command:lesspipe、ubuntu26.04:command:lexgrog、ubuntu26.04:command:linux32、ubuntu26.04:command:linux64、ubuntu26.04:command:localectl、ubuntu26.04:command:look、ubuntu26.04:command:man-recode、ubuntu26.04:command:mandb、ubuntu26.04:command:manpath、ubuntu26.04:command:mcookie、ubuntu26.04:command:namei、ubuntu26.04:command:numfmt、ubuntu26.04:command:pinky、ubuntu26.04:command:rbash、ubuntu26.04:command:remove-shell、ubuntu26.04:command:rev、ubuntu26.04:command:rgrep、ubuntu26.04:command:run-parts、ubuntu26.04:command:savelog、ubuntu26.04:command:setterm、ubuntu26.04:command:sha3-224sum、ubuntu26.04:command:sha3-256sum、ubuntu26.04:command:sha3-384sum、ubuntu26.04:command:sha3-512sum、ubuntu26.04:command:sha3sum、ubuntu26.04:command:shake128sum、ubuntu26.04:command:shake256sum、ubuntu26.04:command:shred、ubuntu26.04:command:shuf、ubuntu26.04:command:start-stop-daemon、ubuntu26.04:command:stdbuf、ubuntu26.04:command:sum、ubuntu26.04:command:systemd-confext、ubuntu26.04:command:systemd-delta、ubuntu26.04:command:systemd-escape、ubuntu26.04:command:systemd-id128、ubuntu26.04:command:systemd-notify、ubuntu26.04:command:systemd-path、ubuntu26.04:command:systemd-socket-activate、ubuntu26.04:command:systemd-stdio-bridge、ubuntu26.04:command:systemd-sysext、ubuntu26.04:command:systemd-vpick、ubuntu26.04:command:tempfile、ubuntu26.04:command:timedatectl、ubuntu26.04:command:tzselect、ubuntu26.04:command:ul、ubuntu26.04:command:update-alternatives、ubuntu26.04:command:update-shells、ubuntu26.04:command:varlinkctl、ubuntu26.04:command:vdir、ubuntu26.04:command:x86_64、ubuntu26.04:command:zdump、ubuntu26.04:command:zic
- 进阶路线 / 隔离与资源控制：bash5.3:builtin:index-disown、bash5.3:builtin:index-suspend、posix2024:utility:ipcrm、posix2024:utility:ipcs、ubuntu26.04:command:choom、ubuntu26.04:command:chrt、ubuntu26.04:command:flock、ubuntu26.04:command:ionice、ubuntu26.04:command:ipcmk、ubuntu26.04:command:lsipc、ubuntu26.04:command:lslocks、ubuntu26.04:command:lsns、ubuntu26.04:command:nsenter、ubuntu26.04:command:prlimit、ubuntu26.04:command:setarch、ubuntu26.04:command:setsid、ubuntu26.04:command:systemd-cgls、ubuntu26.04:command:systemd-cgtop、ubuntu26.04:command:systemd-detect-virt、ubuntu26.04:command:systemd-inhibit、ubuntu26.04:command:taskset、ubuntu26.04:command:uclampset、ubuntu26.04:command:unshare
- 进阶路线 / 深度观测：ubuntu26.04:command:acpidbg、ubuntu26.04:command:cifsiostat、ubuntu26.04:command:cpupower、ubuntu26.04:command:pldd、ubuntu26.04:command:pwdx、ubuntu26.04:command:readprofile、ubuntu26.04:command:rtla、ubuntu26.04:command:sadf、ubuntu26.04:command:strace-log-merge、ubuntu26.04:command:sysctl、ubuntu26.04:command:systemd-ac-power、ubuntu26.04:command:systemd-analyze、ubuntu26.04:command:tapestat、ubuntu26.04:command:tload、ubuntu26.04:command:turbostat、ubuntu26.04:command:w、ubuntu26.04:command:x86_energy_perf_policy
- 进阶路线 / 启动与恢复：ubuntu26.04:command:agetty、ubuntu26.04:command:getty、ubuntu26.04:command:installkernel、ubuntu26.04:command:kernel-install、ubuntu26.04:command:rtcwake、ubuntu26.04:command:sulogin、ubuntu26.04:command:systemd-ask-password、ubuntu26.04:command:systemd-firstboot、ubuntu26.04:command:systemd-machine-id-setup、ubuntu26.04:command:systemd-mute-console、ubuntu26.04:command:systemd-tmpfiles、ubuntu26.04:command:systemd-tty-ask-password-agent
- 进阶路线 / 网络进阶：ubuntu26.04:command:arpd、ubuntu26.04:command:ctstat、ubuntu26.04:command:dcb、ubuntu26.04:command:delv、ubuntu26.04:command:devlink、ubuntu26.04:command:dpll、ubuntu26.04:command:genl、ubuntu26.04:command:lft.db、ubuntu26.04:command:lnstat、ubuntu26.04:command:mdig、ubuntu26.04:command:netshaper、ubuntu26.04:command:networkctl、ubuntu26.04:command:nft、ubuntu26.04:command:nstat、ubuntu26.04:command:nsupdate、ubuntu26.04:command:ping4、ubuntu26.04:command:ping6、ubuntu26.04:command:rdma、ubuntu26.04:command:routel、ubuntu26.04:command:rrsync、ubuntu26.04:command:rsync-ssl、ubuntu26.04:command:rtacct、ubuntu26.04:command:rtmon、ubuntu26.04:command:rtstat、ubuntu26.04:command:sftp、ubuntu26.04:command:ssh-argv0、ubuntu26.04:command:ssh-copy-id、ubuntu26.04:command:tc、ubuntu26.04:command:tcptraceroute.db、ubuntu26.04:command:tipc、ubuntu26.04:command:traceproto.db、ubuntu26.04:command:traceroute-nanog、ubuntu26.04:command:traceroute6.db、ubuntu26.04:command:usbip、ubuntu26.04:command:usbipd、ubuntu26.04:command:vdpa、ubuntu26.04:command:wcurl
- 进阶路线 / 存储进阶：ubuntu26.04:command:blkdiscard、ubuntu26.04:command:blkid、ubuntu26.04:command:blockdev、ubuntu26.04:command:fallocate、ubuntu26.04:command:findfs、ubuntu26.04:command:findmnt、ubuntu26.04:command:fsck、ubuntu26.04:command:fsfreeze、ubuntu26.04:command:fstrim、ubuntu26.04:command:funzip、ubuntu26.04:command:gzexe、ubuntu26.04:command:hardlink、ubuntu26.04:command:losetup、ubuntu26.04:command:lzmainfo、ubuntu26.04:command:mkfs、ubuntu26.04:command:mkswap、ubuntu26.04:command:mountpoint、ubuntu26.04:command:partx、ubuntu26.04:command:rmt-tar、ubuntu26.04:command:swaplabel、ubuntu26.04:command:swapoff、ubuntu26.04:command:swapon、ubuntu26.04:command:systemd-mount、ubuntu26.04:command:systemd-umount、ubuntu26.04:command:tarcat、ubuntu26.04:command:unxz、ubuntu26.04:command:unzipsfx、ubuntu26.04:command:wipefs、ubuntu26.04:command:xzcat、ubuntu26.04:command:xzcmp、ubuntu26.04:command:xzdiff、ubuntu26.04:command:xzegrep、ubuntu26.04:command:xzfgrep、ubuntu26.04:command:xzgrep、ubuntu26.04:command:xzless、ubuntu26.04:command:xzmore、ubuntu26.04:command:zcmp、ubuntu26.04:command:zdiff、ubuntu26.04:command:zegrep、ubuntu26.04:command:zfgrep、ubuntu26.04:command:zforce、ubuntu26.04:command:zipcloak、ubuntu26.04:command:zipgrep、ubuntu26.04:command:zipinfo、ubuntu26.04:command:zipnote、ubuntu26.04:command:zipsplit、ubuntu26.04:command:zmore、ubuntu26.04:command:znew、ubuntu26.04:command:zramctl
- 进阶路线 / 安全机制：ubuntu26.04:command:chage、ubuntu26.04:command:chcon、ubuntu26.04:command:chfn、ubuntu26.04:command:chgpasswd、ubuntu26.04:command:chpasswd、ubuntu26.04:command:chroot、ubuntu26.04:command:chsh、ubuntu26.04:command:cvtsudoers.ws、ubuntu26.04:command:expiry、ubuntu26.04:command:gpasswd、ubuntu26.04:command:grpck、ubuntu26.04:command:grpconv、ubuntu26.04:command:grpunconv、ubuntu26.04:command:loginctl、ubuntu26.04:command:newusers、ubuntu26.04:command:pwck、ubuntu26.04:command:pwconv、ubuntu26.04:command:pwunconv、ubuntu26.04:command:run0、ubuntu26.04:command:runcon、ubuntu26.04:command:runuser、ubuntu26.04:command:setpriv、ubuntu26.04:command:shadowconfig、ubuntu26.04:command:sudo_logsrvd、ubuntu26.04:command:sudo_sendlog.ws、ubuntu26.04:command:sudoedit、ubuntu26.04:command:sudoreplay.ws、ubuntu26.04:command:systemd-creds、ubuntu26.04:command:systemd-sysusers、ubuntu26.04:command:vigr、ubuntu26.04:command:vipw
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 可移植性与实现 | 建立可移植性与实现的心智模型 | POSIX、GNU、uutils、BusyBox、BSD 与发行版打包；提供者兼容性测试和命令版本证据 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 启动与恢复 | 建立启动与恢复的心智模型 | 启动目标、rescue、emergency、关机与 Journal 恢复 | `timeline` | 内容按版本、事件或迁移阶段推进，时间线能保留先后关系 | 起点、阶段条件、回退点和最终状态 | 时间线失效时由有序列表保留完整顺序 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 隔离与资源控制 | 建立隔离与资源控制的心智模型 | namespace、cgroup v2、systemd scope 与容器 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 存储进阶 | 建立存储进阶的心智模型 | LVM、RAID、文件系统修复、配额和破坏性边界 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 网络进阶 | 建立网络进阶的心智模型 | tc、bridge、nftables、namespace 和策略路由 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 安全机制 | 判断安全机制 | AppArmor、SELinux、capabilities、audit 和最小权限 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 深度观测 | 建立深度观测的心智模型 | perf counter 与采样扩展；PSI、tracepoint、ftrace、eBPF、开销与权限 | `folding` | 只收纳不影响主线的低频补充，核心结论必须先在折叠外给出 | 折叠外摘要、适用条件和继续阅读理由 | 折叠失效时标题概括补充主题，正文仍可顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 进入条件与学习选择 | 比较进入条件与学习选择 | 根据问题、风险和环境选择下一条路线 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 只读检查能力、权限和工具可用性 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例：完成只读能力盘点，并在隔离环境观察一个 systemd scope 与 namespace；不做生产调优。
- 完整示例：完成只读能力盘点，并在隔离环境观察一个 systemd scope 与 namespace；不做生产调优。
- 失败边界与踩坑：注意特权操作、内核版本依赖、性能开销、安全削弱、文件系统损坏和工具缺失。
- FAQ 候选与来源：什么时候需要 eBPF、何时使用 tc/nftables、如何判断一个工具是否适合生产环境。
- 非复习自测：用中文场景选择命令，解释输出并写出验证步骤。
- 图表或实验：进阶方向决策树、namespace/cgroup 关系图和观测深度阶梯。
- 复习卡片：只制作进入条件、工具选择和安全边界卡，不为低频命令机械复制卡片。
- 参考资料：Linux kernel、systemd、iproute2、文件系统和安全机制官方文档。

正文完成后必须给出可重复的输入、步骤、预期输出、实际验证和清理边界。
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

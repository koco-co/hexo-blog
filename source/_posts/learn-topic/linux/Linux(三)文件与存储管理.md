---
title: Linux(三)文件与存储管理
tags:
  - Linux
  - 文件存储
categories:
  - Learn Topic
  - Linux
description: 理解 Linux 文件模型并安全完成文件、链接、归档、挂载和容量分析。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 3
published: true
abbrlink: '5297e207'
date: 2026-03-12 00:00:00
---

{% course_series %}

{% note info flat %}
当程序报告“文件不存在”“磁盘满了”或“归档解不开”时，先把问题拆成文件对象、目录项、inode、文件描述符、文件系统和挂载点六层。本文用一个隔离目录完成创建、复制、校验、归档和容量观察；不在真实设备上执行破坏性写入。
{% endnote %}

## 文件模型

{% mermaid %}
flowchart TD
  A[路径字符串] --> B[目录项]
  B --> C[inode 元数据]
  C --> D[数据块]
  E[进程] --> F[文件描述符]
  F --> G[打开文件描述]
  G --> C
{% endmermaid %}

{% note primary flat %}
目录项把名字映射到 inode；inode 记录类型、所有者、大小和时间等元数据；文件描述符先指向“打开文件描述”，再引用 inode。只有目录项链接数已经归零，且所有打开引用都关闭后，删除名字对应的数据才会回收。
{% endnote %}

### 类型与元数据

~~~bash
START_DIR=$PWD
LAB=$(mktemp -d) || {
  printf '%s\n' '无法创建隔离目录；停止本页实验。' >&2
  exit 1
}
cd "$LAB" || {
  printf '%s\n' '无法进入隔离目录；停止本页实验。' >&2
  exit 1
}
printf '实验目录：%s\n' "$LAB"
printf '%s\n' 'alpha' > sample.txt
file sample.txt
stat sample.txt
ls -li sample.txt
dirname "$PWD/sample.txt"
~~~

| 观察工具 | 解决的问题 | 边界 |
| --- | --- | --- |
| ls -li | 快速看 inode、链接数和目录项 | 展示受终端和选项影响 |
| stat | 查看完整元数据 | 不负责解释文件内容 |
| file | 按内容和魔数判断类型 | 不能证明文件一定安全 |
| dirname | 取父目录部分 | 不检查路径是否存在 |

## 文件操作

### 创建与清理

~~~bash
mkdir -p work/inbox work/empty
touch work/inbox/one.log
mktemp work/inbox/tmp.XXXXXX
rmdir work/empty
unlink work/inbox/one.log
~~~

{% note warning flat %}
rm、rmdir、unlink 的目标必须先用 pwd、ls -ld 和 find 的结果确认；生产环境禁止直接复制 rm -rf。mkfifo 会创建命名管道，读写两端不配对时会阻塞，先在隔离目录验证。
{% endnote %}

### 复制与移动

~~~bash
cp sample.txt work/copy.txt
cp -r work copied-work
mv work/copy.txt work/moved.txt
~~~

| 命令 | 主用途 | 选择边界 |
| --- | --- | --- |
| cp | 复制文件或目录 | 目录需要递归选项，覆盖前先确认目标 |
| mv | 移动或改名 | 同文件系统内通常只改目录项 |
| rm、rmdir | 删除文件或空目录 | 删除是不可逆动作，先列出目标 |

{% note info flat %}
Ubuntu 26.04 的 uutils 迁移不覆盖 `cp`、`mv`、`rm`：它们仍由 GNU 实现提供。这里关心的是文件操作的语义；遇到版本差异时回到 `type -a` 和 `--version` 确认提供者，而不是根据命令名猜测。
{% endnote %}

### 链接与管道

~~~bash
ln sample.txt hard.txt
ln -s sample.txt soft.txt
mkfifo events.pipe
ls -li sample.txt hard.txt soft.txt events.pipe
~~~

{% note info flat %}
硬链接共享 inode，删除其中一个名字不影响其他名字；符号链接保存目标路径，目标改名后可能悬空。mkfifo 是按名字连接两个进程的特殊文件，不是普通磁盘文件。
{% endnote %}

### 查找与校验

~~~bash
find . -type f -name '*.txt' -print
cksum sample.txt
md5sum sample.txt
sha256sum sample.txt
~~~

{% note primary flat %}
校验和用于回答“内容是否相同”，不能单独回答“来源是否可信”。跨机器传输时优先记录 SHA-256；`cksum` 适合 POSIX 兼容的快速检查。`find` 的模式、起点和类型必须先缩小，否则会把挂载点或无关目录也纳入结果。
{% endnote %}

{% note info flat %}
`link`、`dd`、`truncate`、`sync`、`umount` 和各种低频归档/摘要工具在本篇只建立选择边界：它们要么风险高，要么只在特定格式或协议下出现。常用文件操作、容量观察和 tar/zip/xz 仍是主线。
{% endnote %}

{% folding blue, 低频格式、校验与实现索引 %}
| 条目 | 何时使用 | 不要把它当成 |
| --- | --- | --- |
| link | 需要直接创建硬链接时；日常优先用 `ln` | 符号链接或跨文件系统链接 |
| b2sum、md5sum、sha1sum、sha224sum、sha384sum、sha512sum | 协议或已有制品明确要求该摘要算法 | 来源可信证明或加密；新传输默认仍优先 SHA-256 |
| base32、base64、basenc | 在文本协议中编码二进制数据 | 压缩、加密或文件归档 |
| compress、uncompress、zcat、pax | 兼容旧 `.Z`、gzip 流式查看或 POSIX 归档交换 | 新项目的默认归档格式；先按对方格式选择 |
| sync、dd、truncate、umount | 需要刷新缓存、块级复制、调整长度或卸载文件系统 | 普通文件编辑；任何真实设备操作都要有备份、目标复核和恢复窗口 |
{% endfolding %}

## 容量与设备

### 文件系统容量

~~~bash
df -h .
du -sh .
du -h . --max-depth=1
lsblk
~~~

| 问题 | 命令 | 证据 |
| --- | --- | --- |
| 哪个文件系统满了 | df | 文件系统、已用、可用和挂载点 |
| 哪个目录占空间 | du | 目录树汇总，注意跨挂载边界 |
| 有哪些块设备和挂载关系 | lsblk | 设备、分区、文件系统和挂载点 |

### 挂载边界

~~~bash
mount
sync
~~~

{% note danger flat %}
mount、umount、dd、truncate 和 sync 可能影响真实数据。本文只展示观察和可恢复的实验；不要把真实块设备标识或生产挂载点替换进示例，任何设备写入都必须先有镜像、备份和恢复窗口。
{% endnote %}

| 能力 | 条目 | 说明 |
| --- | --- | --- |
| 观察挂载 | mount、lsblk | 先确认设备、文件系统和挂载点 |
| 高风险入口 | sync、dd、truncate、umount | 只在低频索引中建立用途与恢复边界，不直接对真实设备实验 |

## 归档与压缩

### tar 归档

~~~bash
tar -cf sample.tar sample.txt
tar -tf sample.tar
mkdir -p unpacked-tar unpacked-zip
tar -xf sample.tar -C unpacked-tar
tar -czf sample.tar.gz sample.txt
tar -cJf sample.tar.xz sample.txt
~~~

{% note info flat %}
归档把多个文件组织为一个流，压缩减少体积；tar 本身不等于压缩。解包前用 tar -tf 检查成员名，避免把绝对路径或 ../ 路径写出实验目录。
{% endnote %}

### 常见格式

| 格式 | 创建/解压 | 查看或流式读取 |
| --- | --- | --- |
| gzip | gzip、gunzip | zcat |
| compress | compress、uncompress | 兼容历史 .Z 文件 |
| xz | xz | 使用 xz 本身的解压选项 |
| zip | zip、unzip | unzip -l 预览成员 |
| pax | pax | POSIX 归档交换格式 |

~~~bash
gzip -c sample.txt > sample.txt.gz
gunzip -c sample.txt.gz
zip sample.zip sample.txt
unzip -l sample.zip
unzip -oq sample.zip -d unpacked-zip
xz -c sample.txt > sample.txt.xz
xz -dc sample.txt.xz
~~~

## 结果验证

### 最小实验与清理

~~~bash
ls -li sample.txt hard.txt soft.txt
stat sample.txt
sha256sum sample.txt hard.txt
df -h .
du -sh .
tar -tf sample.tar
find unpacked-tar unpacked-zip -type f -print
cd "$START_DIR"
rm -rf -- "$LAB"
~~~

{% note success flat %}
实验完成的证据是：文件类型与 inode 关系可解释，硬链接和符号链接行为可复现，复制/移动目标明确，归档清单可先验，校验和符合预期，容量命令的挂载点没有越界。最后只删除由同一 Shell 的 `mktemp -d` 创建并已打印确认的 `LAB` 目录；变量为空或路径不明时停止，不要执行清理命令。
{% endnote %}

## 常见问题

{% flashcard basic id:linux-a3-inode-link deck:"Linux" priority:1 tags:"inode,链接" %}
--- question
硬链接和符号链接的核心区别是什么？
--- answer
硬链接直接共享 inode；符号链接保存目标路径，目标改名或删除后可能悬空。
--- explanation
用一个最小目录就能看见两种链接的差异：

```bash
printf '%s\n' data > original
ln original hard
ln -s original soft
ls -li original hard soft
```

`original` 和 `hard` 的 inode 号相同，`soft` 自己有 inode，内容只是目标路径。删除 `original` 后，`hard` 仍能读取数据，`soft` 则可能变成悬空链接；目录硬链接和跨文件系统硬链接还受文件系统限制。
{% endflashcard %}

{% flashcard basic id:linux-a3-df-du deck:"Linux" priority:1 tags:"容量,排障" %}
--- question
磁盘空间告急时为什么要同时看 df 和 du？
--- answer
df 看文件系统层面的可用块，du 汇总目录可见文件；打开后删除的文件或其他挂载边界可能让两者不一致。
--- explanation
两个命令观察的层次不同：

```bash
df -h .              # 文件系统还剩多少块
du -xhd1 .           # 当前挂载点下各目录可见文件的占用
lsof +L1 2>/dev/null # 已删除但仍被进程打开的文件（若系统提供 lsof）
```

`df` 看到的是文件系统账本，`du` 只能遍历当前目录树。文件已经 unlink 但进程仍持有描述符、目录下还有另一个挂载点，都会让 `df` 明显大于 `du`；这时继续查打开文件和挂载边界，而不是盲目删除目录。
{% endflashcard %}

{% flashcard basic id:linux-a3-tar-compression deck:"Linux" priority:2 tags:"归档,压缩" %}
--- question
tar 和 gzip 的职责有什么不同？
--- answer
tar 负责把多个文件组织成归档，gzip/xz 负责压缩归档流；tar -czf 是两者组合。
--- explanation
`tar` 和压缩器是两层动作，可以这样拆开观察：

```bash
tar -cf sample.tar sample.txt       # 只归档
tar -tf sample.tar                  # 只查看成员
gzip -c sample.tar > sample.tar.gz  # 再压缩归档流
gzip -dc sample.tar.gz | tar -tf -  # 解压后交给 tar 查看
```

`tar -czf` 只是把这两步连起来。解包前先检查成员名，重点拒绝绝对路径和 `../` 穿越；gzip/xz 只改变体积，不提供加密、签名或来源可信证明。
{% endflashcard %}

{% flashcard basic id:linux-a3-safe-delete deck:"Linux" priority:1 tags:"文件操作,安全" %}
--- question
执行删除命令前最小的安全检查是什么？
--- answer
用 pwd 确认当前位置，用 ls -ld 或 find 列出精确目标，并确认没有把变量展开为空或指向根目录。
--- explanation
删除前把“当前目录”和“目标集合”都打印出来，再执行动作：

```bash
printf 'cwd=%s\n' "$PWD"
find ./work -maxdepth 1 -type f -name '*.tmp' -print
read -r -p '确认删除以上文件？[y/N] ' reply
if [[ $reply == y ]]; then
  find ./work -maxdepth 1 -type f -name '*.tmp' -delete
fi
```

`rmdir` 只接受空目录，`rm` 和 `unlink` 更容易造成不可逆损失。变量为空、通配符未匹配或当前路径位于真实挂载点时，命令的目标集合可能完全变形；生产操作必须另有备份和恢复窗口。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024 Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/utilities/contents.html, https://pubs.opengroup.org/favicon.ico %}
{% link GNU Coreutils Manual, https://www.gnu.org/software/coreutils/manual/coreutils.html, https://www.gnu.org/favicon.ico %}
{% link Ubuntu 26.04 Summary for LTS Users, https://documentation.ubuntu.com/release-notes/26.04/summary-for-lts-users/, https://documentation.ubuntu.com/favicon.ico %}
{% link Ubuntu Manpages, https://manpages.ubuntu.com/, https://manpages.ubuntu.com/favicon.ico %}
{% endlinkgroup %}

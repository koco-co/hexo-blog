---
title: Linux(十一)Bash 脚本与任务自动化
tags:
  - Linux
  - Bash 自动化
categories:
  - Learn Topic
  - Linux
description: 把交互式命令变成输入明确、错误可见、可清理和可测试的 Bash 脚本。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 11
published: true
abbrlink: 496664b1
date: 2026-08-25 00:00:00
---

{% course_series %}

{% note info flat %}
自动化脚本的成功标准不是“能跑一次”，而是输入、退出状态、清理、日志和重复执行都可解释。本文从最小 Bash 脚本开始，依次处理参数、变量、函数、判断、循环、输入输出、信号和错误边界，最后用 shellcheck 做静态复查。
{% endnote %}

## 脚本骨架

~~~bash
#!/usr/bin/env bash
set -u

main() {
  printf '%s\n' "script started"
}

main "$@"
~~~

{% note primary flat %}
脚本要明确解释器；Bash 专有语法不能用 sh 运行。set -u 能尽早发现未定义变量，但仍需为可选参数提供默认值；errexit/pipefail 需要结合条件语句和显式错误处理，不能机械复制。
{% endnote %}

## 参数与变量

### 参数展开

~~~bash
name=$1
if [[ -z $name ]]; then name=guest; fi
shift || true
printf 'name=%s argc=%s\n' "$name" "$#"
printf 'all=%s\n' "$@"
~~~

{% note info flat %}
位置参数、特殊参数和环境变量属于不同层次：$0 是脚本名，$# 是参数数量，$? 是上一条状态，$$ 是当前 PID，$! 是最近后台 PID，$@ 适合保留参数边界。declare、export、readonly、unset 和 local 负责变量属性与作用域。
{% endnote %}

### 数组

~~~bash
files=(one.log two.log)
declare -A counts=([ok]=0 [error]=0)
files+=(three.log)
printf '%s\n' "$files"
counts[ok]=$((counts[ok] + 1))
printf '%s=%s\n' ok "$counts"
~~~

{% note info flat %}
Indexed arrays 按整数索引，Associative arrays 按字符串键；使用数组展开时要保留每个元素边界。declare -p 可观察属性，不要把数组序列化成未经转义的字符串。
{% endnote %}

## 函数与流程

### 函数与作用域

~~~bash
log() {
  local level=$1
  shift
  printf '[%s] %s\n' "$level" "$*" >&2
}
log INFO "ready"
~~~

{% note info flat %}
Shell Functions、Function definition、local、return 和 times 构成函数边界；local 让临时变量不污染调用者。函数的返回值是状态码，不是字符串，输出应通过标准输出或显式变量传递。
{% endnote %}

### 判断

~~~bash
if [[ -f $1 ]]; then
  printf '%s\n' "file"
elif [[ -d $1 ]]; then
  printf '%s\n' "directory"
else
  printf '%s\n' "missing" >&2
  exit 1
fi

case $1 in
  start|run) printf '%s\n' "go" ;;
  stop) printf '%s\n' "halt" ;;
  *) printf '%s\n' "usage" >&2; exit 2 ;;
esac
~~~

{% note primary flat %}
[[ conditional expression ]] 与 Bash Conditional Expressions 适合路径、字符串和模式判断；test 仍是 POSIX 入口。case conditional 适合互斥命令分支，避免把复杂条件塞进一行。
{% endnote %}

### 循环

~~~bash
for file in "$files"; do
  printf '%s\n' "$file"
done

while IFS= read -r line; do
  printf '%s\n' "$line"
done < input.txt

until [[ -f ready.flag ]]; do
  sleep 1
done
~~~

{% note info flat %}
break、continue、for loop、while loop 和 until loop 要明确退出条件；不要用 while read 处理带 NUL 的任意文件名，需改用 find -print0 与 mapfile/readarray 等更安全的输入模型。
{% endnote %}

### 交互选择

~~~bash
select choice in start stop quit; do
  case $choice in
    start|stop|quit) break ;;
  esac
done
~~~

{% note info flat %}
select construct 适合短小交互菜单，不适合无人值守脚本；无 TTY 时必须提供参数或配置替代。
{% endnote %}

## 算术与输入输出

### 算术

~~~bash
(( retries += 1 ))
if (( retries >= 3 )); then
  printf '%s\n' "stop"
fi
total=$((2 + 3))
~~~

{% note info flat %}
Arithmetic expansion、Shell Arithmetic 和 (( arithmetic command )) 都使用 Bash 算术语法；算术命令返回值可能因结果为 0 而为非零，放在 set -e 环境中要注意上下文。
{% endnote %}

### 读取输入

~~~bash
IFS= read -r answer
read -r -t 2 answer || printf '%s\n' "timeout" >&2
mapfile -t lines < input.txt
getopts "n:v" opt
~~~

{% note info flat %}
read、mapfile/readarray、getopts 分别处理一行、数组和短选项；输入来自用户时要限制长度、超时和编码。getopts 解析失败应显示用法并返回非零。
{% endnote %}

## 错误与清理

### 状态策略

~~~bash
set -Eeuo pipefail
tmp=$(mktemp)
cleanup() { rm -f -- "$tmp"; }
trap cleanup EXIT
~~~

{% note warning flat %}
errexit semantics 会在条件、列表、管道和函数调用等上下文改变；ERR trap 也不是全局异常处理器。先理解每个命令的预期状态，再用 if、||、return 明确处理可恢复失败。
{% endnote %}

### 信号与子进程

~~~bash
worker &
child=$!
trap 'kill "$child" 2>/dev/null || true' INT TERM EXIT
wait "$child"
~~~

{% note info flat %}
Signals、trap、kill、wait、exec、exit、return、shift 和 :（空命令）是脚本生命周期的基础。export 只把变量传给子进程，readonly 防止本 Shell 改写，unset 删除变量；eval 会重新解析字符串，除非输入完全受控否则不要使用。
{% endnote %}

## 内置命令索引

{% folding blue, Bash 内置命令与手册定位 %}
| 分组 | 条目 |
| --- | --- |
| 变量与控制 | declare、local、export、readonly、unset、set、shift、times |
| 函数与流程 | break、continue、return、exit、eval、exec、: |
| 输入与参数 | getopts、read、mapfile、readarray |
| 手册入口 | Bourne Shell Builtins、Special Builtins、Bash Builtin Commands、The Set Builtin、The Shopt Builtin |
{% endfolding %}

{% folding blue, Bash 章节索引 %}
3.5.5 Arithmetic Expansion、6.7 Arrays、4.2 Bash Builtin Commands、6.4 Bash Conditional Expressions、4.1 Bourne Shell Builtins、3.2.5.2 Conditional Constructs、3.2.5.1 Looping Constructs、3.4.1 Positional Parameters、6.5 Shell Arithmetic、3.3 Shell Functions、3.8 Shell Scripts、3.7.6 Signals、4.4 Special Builtins、3.4.2 Special Parameters、4.3.1 The Set Builtin、4.3.2 The Shopt Builtin、if conditional、Parameters and variables、Positional parameters、Special parameters。
{% endfolding %}

## 测试与质量

### 可重复测试

~~~bash
tmpdir=$(mktemp -d)
trap 'rm -rf -- "$tmpdir"' EXIT
printf '%s\n' ok > "$tmpdir/input"
./script.sh "$tmpdir/input"
status=$?
[[ $status -eq 0 ]]
~~~

{% note success flat %}
每个脚本至少测试成功、缺参、空输入、权限不足、命令不存在、超时、重复执行和中断清理。shellcheck 能发现引用、分词和常见语义问题，但不能替代运行时测试和业务验证。
{% endnote %}

{% flashcard basic id:linux-a11-set-e deck:"Linux" priority:1 tags:"Bash,错误处理" %}
--- question
为什么不能把 set -e 当作完整异常处理？
--- answer
errexit 在 if、&&/||、管道、函数和命令替换等上下文有例外，某些失败不会退出。
--- explanation
用 pipefail、明确的 if/return、ERR trap 和测试覆盖组合，先定义哪些失败可恢复。
{% endflashcard %}

{% flashcard basic id:linux-a11-args-at deck:"Linux" priority:1 tags:"Bash,参数" %}
--- question
脚本转发参数时为什么优先使用 "$@"？
--- answer
"$@" 会把每个原始参数作为独立词传递，保留空格和特殊字符边界。
--- explanation
$* 和未加引号的 $@ 可能重新分词；用户输入不要拼进 eval。
{% endflashcard %}

{% flashcard basic id:linux-a11-array deck:"Linux" priority:1 tags:"Bash,数组" %}
--- question
Indexed arrays 和 Associative arrays 何时使用？
--- answer
整数顺序索引用 Indexed arrays，字符串键查值用 Associative arrays。
--- explanation
遍历时保留数组元素边界，不要依赖把数组拼成空格分隔字符串。
{% endflashcard %}

{% flashcard basic id:linux-a11-trap-cleanup deck:"Linux" priority:2 tags:"trap,清理" %}
--- question
脚本如何保证临时文件在中断后清理？
--- answer
创建临时目录后注册 EXIT trap，并在信号处理里等待或终止子进程。
--- explanation
trap 不是安全边界；路径必须来自 mktemp，清理目标必须是脚本独占的隔离目录。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GNU Bash Reference Manual, https://www.gnu.org/software/bash/manual/bash.html, https://www.gnu.org/favicon.ico %}
{% link Bash ShellCheck Wiki, https://www.shellcheck.net/wiki/, https://www.shellcheck.net/favicon.ico %}
{% link POSIX.1-2024 Shell and Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/, https://pubs.opengroup.org/favicon.ico %}
{% endlinkgroup %}

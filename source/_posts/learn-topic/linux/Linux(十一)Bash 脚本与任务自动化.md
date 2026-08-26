---
title: Linux(十一)Bash 脚本与任务自动化
tags:
  - Linux
  - Bash 自动化
categories:
  - Learn Topic
  - Linux
description: 把交互式命令写成输入明确、状态可见、可清理且可重复验证的 Bash 脚本。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 11
published: true
abbrlink: 496664b1
date: 2026-08-25 00:00:00
---

{% course_series %}

{% note info flat %}
自动化脚本的成功标准不是“能跑一次”，而是输入、输出、退出状态、清理和重复执行都能解释。本文用 Bash 把命令组合成小程序：先解析参数和校验输入，再执行受控动作，最后用明确状态和测试说明结果；不把未处理输入重新交给 Shell 解析。
{% endnote %}

## 脚本模型

{% mermaid %}
flowchart LR
  A[参数、标准输入与环境] --> B[解析与校验]
  B --> C[函数和受控工作]
  C --> D[标准输出、错误输出与状态]
  C --> E[EXIT 或信号清理]
  D --> F[静态检查与重复测试]
  E --> F
{% endmermaid %}

{% note primary flat %}
脚本开头必须选定解释器：含数组、双中括号、mapfile 或 pipefail 的脚本用 Bash 运行，不要改名为 sh 后期待同样行为。把参数作为数据保留在 "$@" 中，必要时用函数和临时目录隔离副作用。
{% endnote %}

## 参数与变量

### 参数边界

~~~bash
#!/usr/bin/env bash
set -Euo pipefail

name=${1:-guest}
if (( $# > 0 )); then
  shift
fi

printf 'name=<%s> remaining=%s\n' "$name" "$#"
printf 'arg=<%s>\n' "$@"
~~~

{% note primary flat %}
$0 是脚本名，$# 是参数数量，$? 是上一条命令状态，$$ 是当前 PID，$! 是最近后台 PID。${1:-guest} 为可选首参给出默认值；"$@" 把每个原始参数保留为独立参数。未加引号的 $@ 或 $* 会重新分词，不应用来转发路径、名称或用户输入。
{% endnote %}

### 变量属性

~~~bash
declare -a files=("one" "two words")
declare -A counts=([ok]=0 [skipped]=0)

readonly mode=report
export report_mode="$mode"
unset unused_value

files+=("three")
counts[ok]=$(( ${counts[ok]} + 1 ))
printf 'file=<%s>\n' "${files[@]}"
printf 'ok=%s mode=%s\n' "${counts[ok]}" "$report_mode"
~~~

{% note info flat %}
declare 和 local 控制变量属性与作用域；export 只把变量传给新启动的子进程，readonly 防止当前 Shell 改写，unset 删除变量。Indexed arrays 适合有顺序的参数，Associative arrays 适合按名称计数；它们是 Bash 扩展，跨 Shell 的脚本需要换成 POSIX 数据模型。
{% endnote %}

## 选项与输入

### 解析短选项

~~~bash
set -- -n "Ada Lovelace" -v one "two words"

name=guest
verbose=0
while getopts ':n:v' opt; do
  case "$opt" in
    n) name="$OPTARG" ;;
    v) verbose=1 ;;
    :) printf 'option -%s needs a value\n' "$OPTARG" >&2; exit 2 ;;
    \?) printf 'unknown option: -%s\n' "$OPTARG" >&2; exit 2 ;;
  esac
done
shift "$((OPTIND - 1))"

printf 'name=<%s> verbose=%s remaining=%s\n' "$name" "$verbose" "$#"
printf 'item=<%s>\n' "$@"
~~~

{% note primary flat %}
getopts 负责短选项和缺失参数的状态；解析完成后用 OPTIND 配合 shift，把剩余位置参数交给业务函数。长选项、配置文件和交互输入是不同接口：先定义哪一种是脚本的正式输入，不能让同一含义被多个来源悄悄覆盖。
{% endnote %}

### 读取文本

~~~bash
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
trap 'rm -rf -- "$LAB"' EXIT

printf '%s\n' "one" "two words" >"$LAB/input"
mapfile -t lines <"$LAB/input"

for line in "${lines[@]}"; do
  printf 'array=<%s>\n' "$line"
done

while IFS= read -r line; do
  printf 'read=<%s>\n' "$line"
done <"$LAB/input"
~~~

{% note info flat %}
mapfile/readarray 一次读入 Bash 数组，read 适合逐行流式处理；IFS= 与 -r 防止前后空白被剥离、反斜杠被解释。它们处理的是文本行，不是任意文件名协议；需要 NUL 分隔的文件名时，应使用与 NUL 协议匹配的接口。
{% endnote %}

## 函数与控制

### 函数状态

~~~bash
classify_item() {
  local item=$1
  case "$item" in
    '') printf '%s\n' 'skip empty item' >&2; return 2 ;;
    stop) printf '%s\n' 'stop requested' >&2; return 1 ;;
    *) printf 'process=<%s>\n' "$item"; return 0 ;;
  esac
}

items=("one" "two words" "" stop "after-stop")
processed=0

for item in "${items[@]}"; do
  if classify_item "$item"; then
    (( processed += 1 ))
  else
    status=$?
    case "$status" in
      1) break ;;
      2) continue ;;
      *) exit "$status" ;;
    esac
  fi
done

printf 'processed=%s\n' "$processed"
~~~

{% note primary flat %}
函数用 return 返回 0 到 255 的状态，文本结果写到标准输出；local 让函数临时变量不污染调用者。if、case、for、while 和 until 解决不同控制问题：条件分支选路径，case 选互斥输入，循环处理重复项；break 和 continue 只改变当前循环，不能代替错误处理。
{% endnote %}

### 条件与重试

~~~bash
attempt=0
until (( attempt == 2 )); do
  (( attempt += 1 ))
  if (( attempt == 1 )); then
    printf '%s\n' 'first attempt: retry'
  else
    printf '%s\n' 'second attempt: done'
  fi
done

if [[ -n "value" && -f "." ]]; then
  printf '%s\n' 'Bash conditional matched'
fi
~~~

{% note warning flat %}
(( arithmetic command )) 的状态由算术结果决定：结果为 0 时状态为非零，在 set -e 环境尤其容易误判。[[ ... ]] 是 Bash 的条件表达式，test 或 [ 是 POSIX 入口；选择哪一个取决于解释器，而不是个人偏好。任何重试都应有次数、等待、可观察失败和终止条件，不能写成无限循环。
{% endnote %}

## 错误与清理

~~~bash
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
WORKER=

cleanup() {
  if test -n "$WORKER"; then
    kill -TERM "$WORKER" 2>/dev/null || true
    wait "$WORKER" 2>/dev/null || true
  fi
  rm -rf -- "$LAB"
}
on_error() {
  status=$?
  printf 'error-status=%s\n' "$status" >&2
}
trap cleanup EXIT INT TERM
trap on_error ERR

: >"$LAB/ready"
if test -f "$LAB/ready"; then
  printf '%s\n' 'precondition met'
else
  printf '%s\n' 'missing input' >&2
  exit 1
fi

sleep 30 &
WORKER=$!
printf 'worker=%s\n' "$WORKER"
~~~

{% note warning flat %}
set -e 不是完整异常机制：在 if、AND-OR、管道、函数和命令替换等上下文，失败是否退出会变化。先用 if、||、return 或 exit 写明可恢复与不可恢复分支，再按需要组合 set -E、-u 和 pipefail；ERR trap 用于记录意外失败，不应掩盖原始状态。: 是成功的空命令，适合受控地创建或占位；cleanup 只删除 mktemp 产生的独占目录。
{% endnote %}

## 测试与质量

~~~bash
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
trap 'rm -rf -- "$LAB"' EXIT
SCRIPT="$LAB/report.sh"
LIBRARY="$LAB/library.sh"

cat >"$LIBRARY" <<'BASH'
format_item() {
  printf 'item=<%s>\n' "$1"
}
BASH

cat >"$SCRIPT" <<'BASH'
#!/usr/bin/env bash
set -Euo pipefail
. "$1"
shift

name=guest
while getopts ':n:' opt; do
  case "$opt" in
    n) name="$OPTARG" ;;
    :) exit 2 ;;
    \?) exit 2 ;;
  esac
done
shift "$((OPTIND - 1))"

main() {
  local item
  for item in "$@"; do
    format_item "$item"
  done
  printf 'name=<%s>\n' "$name"
}
main "$@"
BASH

bash -n "$SCRIPT"
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck -s bash "$SCRIPT"
else
  printf '%s\n' 'shellcheck 未安装：先完成 bash -n，再在目标环境安装后复查' >&2
fi

"$SCRIPT" "$LIBRARY" -n "Ada Lovelace" one "two words"
if "$SCRIPT" "$LIBRARY" -n; then
  printf '%s\n' 'unexpected option success' >&2
  exit 1
else
  test "$?" -eq 2
fi
~~~

{% note success flat %}
bash -n 只检查语法；shellcheck 发现常见引用、分词和可疑语义；两者都不能代替运行时测试。至少覆盖正常输入、缺参、空输入、权限不足、命令不存在、中断清理和重复执行，并把每个测试的输入、状态和期望输出固定下来。
{% endnote %}

## 低频入口

{% folding blue, 何时查阅较少用的 Bash 接口 %}
| 接口或手册入口 | 中文用途 | 选择与排除边界 |
| --- | --- | --- |
| select construct | 生成短小交互菜单 | 无人值守脚本应改用参数或配置，不能等待 TTY 输入 |
| .（source） | 在当前 Shell 导入受控库 | 只导入可信、版本固定的脚本；它会共享变量与副作用 |
| eval | 重新解析一段字符串 | 未受控输入绝不能使用；通常应改用数组和 "$@" 传参 |
| exec | 用新程序替换当前 Shell | 适合刻意交接进程时使用；之后 cleanup 和后续代码不会运行 |
| times | 查看当前 Shell 及子进程累计 CPU 时间 | 用于脚本级粗略统计，不替代 pidstat 或 perf |
| 3.5.5 Arithmetic Expansion、6.5 Shell Arithmetic、(( arithmetic command )) | 查算术展开与状态规则 | 变量为 0 的状态边界需要先写最小测试 |
| 6.7 Arrays、Indexed arrays、Associative arrays | 查数组属性与展开方式 | 跨 POSIX Shell 时不要把 Bash 数组带过去 |
| 3.4.1 Positional Parameters、3.4.2 Special Parameters、Parameters and variables | 查参数、$?、$!、$$ 等规则 | 参数转发优先 "$@"，避免未加引号展开 |
| 3.2.5.1 Looping Constructs、3.2.5.2 Conditional Constructs、6.4 Bash Conditional Expressions | 查循环、分支与模式判断 | 循环必须有退出和异常分支，Bash 的 [[ ]] 不能假设 sh 支持 |
| 3.3 Shell Functions、Function definition、return | 查函数作用域和状态返回 | 文本结果走标准输出，return 不用来返回长字符串 |
| 3.7.6 Signals、errexit semantics、The Set Builtin | 查信号、trap 与 set 的细节 | ERR/set -e 存在上下文例外，先用显式分支定义业务失败 |
| 3.8 Shell Scripts、Bash Builtin Commands、Bourne Shell Builtins、Special Builtins、The Shopt Builtin | 查解释器、内置命令和行为开关 | 只在知道兼容目标时调整 shopt 或 Shell 选项 |
{% endfolding %}

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

{% flashcard basic id:linux-a11-getopts deck:"Linux" priority:2 tags:"getopts,参数" %}
--- question
getopts 解析完成后为什么要执行 shift "$((OPTIND - 1))"？
--- answer
它跳过已消费的选项，使剩余位置参数成为业务函数的真实输入。
--- explanation
不 shift 会让 -n 等选项混进业务参数；缺失选项值要显示用法并返回非零。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GNU Bash Reference Manual, https://www.gnu.org/software/bash/manual/bash.html, https://www.gnu.org/favicon.ico %}
{% link ShellCheck Wiki, https://www.shellcheck.net/wiki/, https://www.shellcheck.net/favicon.ico %}
{% link POSIX.1-2024 Shell and Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/, https://pubs.opengroup.org/favicon.ico %}
{% endlinkgroup %}

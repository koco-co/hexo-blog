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
date: 2026-03-20 00:00:00
---

{% course_series %}

{% note info flat %}
自动化脚本的成功标准不是“能跑一次”，而是输入、输出、退出状态、清理和重复执行都能解释。本文用 Bash 把命令组合成小程序：先解析参数和校验输入，再执行受控动作，最后用明确状态和测试说明结果；不把未处理输入重新交给 Shell 解析。
{% endnote %}

## 脚本模型

{% mermaid %}
flowchart TD
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
(
declare -a files=("one" "two words")
declare -A counts=([ok]=0 [skipped]=0)

readonly mode=report
export report_mode="$mode"
unset unused_value

files+=("three")
counts[ok]=$(( ${counts[ok]} + 1 ))
printf 'file=<%s>\n' "${files[@]}"
printf 'ok=%s mode=%s\n' "${counts[ok]}" "$report_mode"

child_mode=$(bash -c 'printf %s "$report_mode"')
if test "$child_mode" != report; then
  printf '%s\n' 'export assertion failed' >&2
  exit 1
fi
if ( mode=changed ) 2>/dev/null; then
  printf '%s\n' 'readonly assertion failed' >&2
  exit 1
fi
if test -v unused_value; then
  printf '%s\n' 'unset assertion failed' >&2
  exit 1
fi

scope=outer
set_scope() {
  local scope=inner
  printf 'function-scope=%s\n' "$scope"
}
set_scope
if test "$scope" != outer; then
  printf '%s\n' 'local assertion failed' >&2
  exit 1
fi
printf 'child-mode=%s readonly=blocked unset=absent scope=%s\n' "$child_mode" "$scope"
)
~~~

{% note info flat %}
declare 和 local 控制变量属性与作用域；export 只把变量传给新启动的子进程，readonly 防止当前 Shell 改写，unset 删除变量。示例在子 Shell 中断言 export、readonly、unset 和 local 的结果，避免逐段执行污染当前终端。Indexed arrays 适合有顺序的参数，Associative arrays 适合按名称计数；它们是 Bash 扩展，跨 Shell 的脚本需要换成 POSIX 数据模型。
{% endnote %}

## 选项与输入

### 解析短选项

~~~bash
# 同一 Shell 中重复调用解析逻辑时，先复位 getopts 的游标。
OPTIND=1
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
getopts 负责短选项和缺失参数的状态；解析完成后用 OPTIND 配合 shift，把剩余位置参数交给业务函数。每次在同一 Shell 重用这段解析逻辑前都将 OPTIND 复位为 1；新启动的 Bash 进程会从 1 开始。长选项、配置文件和交互输入是不同接口：先定义哪一种是脚本的正式输入，不能让同一含义被多个来源悄悄覆盖。
{% endnote %}

### 读取文本

~~~bash
(
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
)
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

### errexit 边界

~~~bash
(
set -e

expect() {
  if test "$1" != "$2"; then
    printf 'unexpected state: got=<%s> want=<%s>\n' "$1" "$2" >&2
    exit 1
  fi
}

if false; then
  if_state=unexpected
else
  if_state=handled
fi
expect "$if_state" handled

and_or_state=
false || and_or_state=handled
expect "$and_or_state" handled

function_in_condition() {
  false
  printf '%s' continued
}
if function_state=$(function_in_condition); then
  expect "$function_state" continued
else
  printf '%s\n' 'unexpected function status' >&2
  exit 1
fi

if false | true; then
  pipeline_state=last-command-wins
else
  pipeline_state=unexpected
fi
expect "$pipeline_state" last-command-wins

set -o pipefail
if false | true; then
  pipeline_state=unexpected
else
  pipeline_state=pipefail-detected
fi
expect "$pipeline_state" pipefail-detected

if value=$(false); then
  substitution_state=unexpected
else
  substitution_state=handled
fi
expect "$substitution_state" handled

printf 'if=%s and-or=%s function=%s pipeline=%s substitution=%s\n' \
  "$if_state" "$and_or_state" "$function_state" "$pipeline_state" "$substitution_state"
)
~~~

{% note primary flat %}
set -e 处理的是未被当前语法上下文接住的失败，不等于“任何 false 都退出”。if、AND-OR、作为条件调用的函数以及管道都会改变它的效果；未启用 pipefail 时，管道默认只看最后一条命令。示例把每个预期失败放进显式分支并断言结果；命令替换还会受 inherit_errexit 与 POSIX 模式影响，因此业务脚本应写清 if/return/exit，而不是猜测 errexit 是否会接管。
{% endnote %}

### 清理

~~~bash
(
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
WORKER=

cleanup() {
  if test -n "$WORKER"; then
    kill -TERM "$WORKER" 2>/dev/null || true
    wait "$WORKER" 2>/dev/null || true
    WORKER=
  fi
  rm -rf -- "$LAB"
}
on_error() {
  status=$?
  printf 'error-status=%s\n' "$status" >&2
}
on_signal() {
  exit "$1"
}
trap cleanup EXIT
trap 'on_signal 130' INT
trap 'on_signal 143' TERM
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
)
~~~

{% note warning flat %}
set -e 不是完整异常机制：在 if、AND-OR、管道、函数和命令替换等上下文，失败是否退出会变化。先用 if、||、return 或 exit 写明可恢复与不可恢复分支，再按需要组合 set -E、-u 和 pipefail；ERR trap 用于记录意外失败，不应掩盖原始状态。: 是成功的空命令，适合受控地创建或占位。EXIT trap 负责正常清理；INT/TERM handler 只以 130/143 退出，由 EXIT trap 回收自建 worker，不能清理后继续主流程。示例在子 Shell 中结束时触发 cleanup，因此逐段粘贴也只清理 mktemp 产生的独占目录，不会改写当前终端已有的 trap。
{% endnote %}

## 测试与质量

~~~bash
(
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
OPTIND=1
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

chmod u+x "$SCRIPT"
bash -n "$SCRIPT"
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck -s bash "$SCRIPT"
else
  printf '%s\n' 'shellcheck 未安装：先完成 bash -n，再在目标环境安装后复查' >&2
fi

expected_output=$'item=<one>\nitem=<two words>\nname=<Ada Lovelace>'
if output=$("$SCRIPT" "$LIBRARY" -n "Ada Lovelace" one "two words"); then
  if test "$output" = "$expected_output"; then
    printf '%s\n' "$output"
  else
    printf '%s\n' 'unexpected normal output' >&2
    exit 1
  fi
else
  status=$?
  printf 'unexpected normal status=%s\n' "$status" >&2
  exit "$status"
fi
if "$SCRIPT" "$LIBRARY" -n; then
  printf '%s\n' 'unexpected option success' >&2
  exit 1
else
  test "$?" -eq 2
fi
)
~~~

{% note primary flat %}
`.`（source）会在当前 Shell 导入受控库，不会创建子进程，因此库中的函数、变量、选项和副作用都会影响调用者。上例只导入临时目录中刚写入的可信库，并用精确输出断言证明 format_item 已被导入；生产脚本只能导入来源、版本和权限都已核验的库，需要隔离时改为启动独立进程。
{% endnote %}

{% note success flat %}
bash -n 只检查语法；shellcheck 发现常见引用、分词和可疑语义；两者都不能代替运行时测试。至少覆盖正常输入、缺参、空输入、权限不足、命令不存在、中断清理和重复执行，并把每个测试的输入、状态和期望输出固定下来。
{% endnote %}

## 低频入口

{% note warning flat %}
未受控输入绝不能使用 eval；exec 只用于刻意把当前 Shell 交接给新程序，它会跳过后续代码和 cleanup。需要清理临时资源时，必须先完成清理或改由独立子进程执行目标程序。
{% endnote %}

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
| 3.4.1 Positional Parameters、3.4.2 Special Parameters、Parameters and variables、Positional parameters、Special parameters | 查参数、$?、$!、$$ 等规则 | 参数转发优先 "$@"，避免未加引号展开 |
| 3.2.5.1 Looping Constructs、3.2.5.2 Conditional Constructs、6.4 Bash Conditional Expressions、case conditional、if conditional、for loop、while loop、until loop、[[ conditional expression ]] | 查循环、分支与模式判断 | 循环必须有退出和异常分支，Bash 的 [[ ]] 不能假设 sh 支持 |
| 3.3 Shell Functions、Function definition、return | 查函数作用域和状态返回 | 文本结果走标准输出，return 不用来返回长字符串 |
| 3.7.6 Signals、errexit semantics、The Set Builtin | 查信号、trap 与 set 的细节 | ERR/set -e 存在上下文例外，先用显式分支定义业务失败 |
| 3.8 Shell Scripts、4.2 Bash Builtin Commands、4.1 Bourne Shell Builtins、4.4 Special Builtins、4.3.1 The Set Builtin、4.3.2 The Shopt Builtin | 查解释器、内置命令和行为开关 | 只在知道兼容目标时调整 shopt 或 Shell 选项 |
{% endfolding %}

## 常见问题

{% flashcard basic id:linux-a11-set-e deck:"Linux" priority:1 tags:"Bash,错误处理" %}
--- question
为什么不能把 set -e 当作完整异常处理？
--- answer
errexit 在 if、&&/||、管道、函数和命令替换等上下文有例外，某些失败不会退出。
--- explanation
`set -e` 不是异常类型系统，它会根据语法上下文决定是否退出：

```bash
set -Eeuo pipefail
if ! output=$(may_fail); then
  printf '%s\n' '可恢复失败' >&2
  exit 1
fi
trap 'printf "error line=%s status=%s\\n" "$LINENO" "$?" >&2' ERR
```

`if` 条件、`&&`/`||`、管道、函数作为条件调用和命令替换都可能改变 `errexit` 的效果。明确使用 `if`/`return` 表达可恢复分支，再用 `pipefail`、`ERR` 日志和测试覆盖补齐证据，不能把“脚本退出了”当作完整错误处理。
{% endflashcard %}

{% flashcard basic id:linux-a11-args-at deck:"Linux" priority:1 tags:"Bash,参数" %}
--- question
脚本转发参数时为什么优先使用 "$@"？
--- answer
"$@" 会把每个原始参数作为独立词传递，保留空格和特殊字符边界。
--- explanation
通过一个带空格的参数就能看出边界：

```bash
forward() {
  printf 'arg=<%s>\n' "$@"
}
forward 'two words' '*.log'
```

`"$@"` 会把每个原始参数作为独立词传给 `forward`；`$*` 或未加引号的 `$@` 可能重新分词并展开通配符。需要重新解释 Shell 语法时才会用 `eval`，普通转发不应把用户输入变成代码。
{% endflashcard %}

{% flashcard basic id:linux-a11-array deck:"Linux" priority:1 tags:"Bash,数组" %}
--- question
Indexed arrays 和 Associative arrays 何时使用？
--- answer
整数顺序索引用 Indexed arrays，字符串键查值用 Associative arrays。
--- explanation
两种数组分别按数字索引和字符串键访问：

```bash
files=('two words' '*.log')
declare -A count=([ok]=2 [failed]=1)
printf 'first=<%s>\n' "${files[0]}"
printf 'ok=%s\n' "${count[ok]}"
for file in "${files[@]}"; do printf 'file=<%s>\n' "$file"; done
```

`Indexed array` 适合保留顺序的参数，`Associative array` 适合按名称累计状态。始终用带引号的数组展开保留元素边界；把数组拼成空格分隔字符串会丢失空格、通配符和空元素。
{% endflashcard %}

{% flashcard basic id:linux-a11-trap-cleanup deck:"Linux" priority:2 tags:"trap,清理" %}
--- question
脚本如何保证临时文件在中断后清理？
--- answer
创建临时目录后注册 EXIT trap；INT/TERM handler 以 130/143 退出，再由 EXIT trap 清理。
--- explanation
让退出路径只有一个清理出口：

```bash
LAB=$(mktemp -d)
cleanup() { rm -rf -- "$LAB"; }
on_signal() { trap - INT TERM; exit 130; }
trap cleanup EXIT
trap on_signal INT TERM
```

`EXIT` 会在正常退出、显式 `exit` 和信号 handler 退出后执行；handler 如果只清理而返回，主流程可能继续写入已删除的目录。`mktemp` 生成的目录必须由脚本独占，不能把外部输入直接交给 `rm -rf`，因为 trap 只是清理机制而不是安全边界。
{% endflashcard %}

{% flashcard basic id:linux-a11-getopts deck:"Linux" priority:2 tags:"getopts,参数" %}
--- question
getopts 解析完成后为什么要执行 shift "$((OPTIND - 1))"？
--- answer
它跳过已消费的选项，使剩余位置参数成为业务函数的真实输入。
--- explanation
`getopts` 解析时会把游标保存在 `OPTIND`：

```bash
OPTIND=1
while getopts ':n:v' opt; do
  case "$opt" in
    n) name=$OPTARG ;;
    v) verbose=1 ;;
    :) printf 'option -%s needs a value\n' "$OPTARG" >&2; exit 2 ;;
    \?) printf 'unknown option -%s\n' "$OPTARG" >&2; exit 2 ;;
  esac
done
shift "$((OPTIND - 1))"
printf 'business-arg=<%s>\n' "$1"
```

`shift` 后，`$@` 才只剩下业务参数；不 shift 会让已消费的 `-n`、`-v` 再次进入业务逻辑。缺少值或未知选项应返回非零并显示用法，不能把错误当成普通位置参数。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GNU Bash Reference Manual, https://www.gnu.org/software/bash/manual/bash.html, https://www.gnu.org/favicon.ico %}
{% link ShellCheck Wiki, https://www.shellcheck.net/wiki/, https://www.shellcheck.net/favicon.ico %}
{% link POSIX.1-2024 Shell and Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/, https://pubs.opengroup.org/favicon.ico %}
{% endlinkgroup %}

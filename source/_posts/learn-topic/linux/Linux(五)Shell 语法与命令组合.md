---
title: Linux(五)Shell 语法与命令组合
tags:
  - Linux
  - Shell 组合
categories:
  - Learn Topic
  - Linux
description: 理解 Shell 解析、引号、重定向、管道、作用域和兼容边界，写出可验证的组合命令。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 5
published: true
abbrlink: 72c1404c
date: 2026-03-14 00:00:00
---

{% course_series %}

{% note info flat %}
组合命令并不是“把几条命令写在一行”。Shell 会先解析结构和展开参数，再设置重定向并执行。本文只练习解析、引号、标准流、管道、作用域和批处理；不展开文件文本处理、进程服务、日志诊断或脚本自动化。
{% endnote %}

{% note warning flat %}
下文的实验以 Bash 为运行环境；Bash 专有的 brace expansion、ANSI-C 引号、&>、&>> 与 pipefail 都在相邻处标出。需要 POSIX 可移植性时，按“选择 Shell”中的替代或限制判断，不能把 Bash 语法交给 sh。
{% endnote %}

## 解析顺序

{% mermaid %}
flowchart TD
  A[输入文本] --> B[词元与命令结构]
  B --> C[Bash: brace expansion]
  C --> D[tilde、参数、算术、命令替换]
  D --> E[未引用字段分割]
  E --> F[路径名展开]
  F --> G[quote removal]
  G --> H[重定向]
  H --> I[执行与退出状态]
{% endmermaid %}

{% note primary flat %}
这是 Bash 5.3 的简化主线：brace expansion 是 Bash 专有；POSIX 不保证它，也不保证 ANSI-C 引号或 pipefail。先建立词元和命令结构，再观察展开后的参数个数，最后才判断重定向和状态；不要把未处理字符串拼入 eval、sh -c 或文件路径。
{% endnote %}

### 最小实验

~~~bash
LAB=$(mktemp -d) || { printf '%s\n' '无法创建临时目录' >&2; exit 1; }
printf '%s\n' 'linux-shell-lab' >"$LAB/.linux-shell-lab"
printf 'lab=%s\n' "$LAB"

scope=outer
scope=child bash -c 'printf "child=<%s>\n" "$scope"'
printf 'parent=<%s>\n' "$scope"
~~~

{% note info flat %}
在同一 Bash 会话继续运行后面的 LAB 片段。标记文件让每个会写入的片段先确认隔离目录已创建；若条件不满足，片段只输出提示，不会把文件写到根目录。最后两行应为 child=<child> 与 parent=<outer>：环境前缀只作用于紧随的外部命令，不会改写当前 Shell 变量。
{% endnote %}

## 引号与展开

### 参数边界

~~~bash
value='Ada Lovelace'
printf '<%s>\n' "$value"
printf '<%s>\n' $value
printf '<%s>\n' '$value'

set -- Ada\ Lovelace
printf 'escaped-count=%s value=<%s>\n' "$#" "$1"
set -- Ada Lovelace
printf 'plain-count=%s first=<%s>\n' "$#" "$1"
printf 'double=<%s>\n' "Ada\ Lovelace"

printf '%s\n' $'line1\nline2'
~~~

{% note primary flat %}
printf 的格式串固定：%s 输出一个参数，\n 明确换行，因此适合观察参数边界；不要把任意数据交给 echo，因为 echo 的选项和反斜杠处理因实现而异。双引号保留一个参数，未加引号会按空白分割，单引号保持字面量。未引用的反斜杠可把空格保留在一个词内，所以 escaped-count=1，而 plain-count=2。
{% endnote %}

{% note warning flat %}
反斜杠不是通用替代引号：在双引号内，它只对 $、反引号、双引号、反斜杠和换行具有转义作用，普通空格前的反斜杠会保留在值中。最后一条 $'...' 是 Bash 的 ANSI-C 引号，输出两行，不是 POSIX sh 的通用写法。
{% endnote %}

### 常见展开

~~~bash
name='order'
printf '<%s>\n' "$name"
printf '<%s>\n' "$((2 + 3))"
current=$(printf '%s' done)
printf '<%s>\n' "$current"
legacy=`printf '%s' done`
test "$legacy" = "$current" && printf '%s\n' 'same result'

if test -n "$LAB" && test -f "$LAB/.linux-shell-lab"; then
  touch "$LAB/a.txt" "$LAB/b.txt"
  set -- "$LAB"/*.txt
  printf 'pathname-matches=%s\n' "$#"
  printf '%s\n' {one,two}
else
  printf '%s\n' '请先运行“最小实验”创建隔离目录' >&2
fi
~~~

{% note info flat %}
这里依次观察参数、算术、命令、路径名和花括号展开：输出应包含 order、5、done、same result、pathname-matches=2、one、two。路径名没有匹配时的行为受 Shell 选项影响；花括号展开是 Bash 能力，不能假定 POSIX sh 支持。
{% endnote %}

{% note warning flat %}
旧式反引号命令替换和 $(...) 通常得到相同结果，但后者可读、可嵌套，迁移时统一改为 $(...)。test "$a" = "$b" 比较两个字符串：真返回 0、假返回非 0；它是条件判断，不会输出比较结果。
{% endnote %}

## 标准流与重定向

### 输出去向

~~~bash
if test -n "$LAB" && test -f "$LAB/.linux-shell-lab"; then
  { printf 'OUT\n'; printf 'ERR\n' >&2; } >"$LAB/out.txt" 2>"$LAB/err.txt"
  { printf 'OUT\n'; printf 'ERR\n' >&2; } >"$LAB/combined.txt" 2>&1
  { printf 'OUT\n'; printf 'ERR\n' >&2; } 2>&1 >"$LAB/reversed.txt"
  printf 'APPENDED\n' >>"$LAB/combined.txt"
  { printf 'OUT\n'; printf 'ERR\n' >&2; } &>"$LAB/bash-combined.txt"
  { printf 'OUT2\n'; printf 'ERR2\n' >&2; } &>>"$LAB/bash-combined.txt"
  test -s "$LAB/combined.txt" && printf '%s\n' 'combined ready'
else
  printf '%s\n' '请先运行“最小实验”创建隔离目录' >&2
fi
~~~

{% note primary flat %}
第一条把标准输出和标准错误分到两个文件；第二条把两者写入 combined.txt；第三条会把 ERR 留在终端、只把 OUT 写入 reversed.txt。重定向按从左到右执行：先写 >file，再写 2>&1，错误流才会跟随新文件。> 会覆盖，>> 才追加；&> 与 &>> 分别合并覆盖、合并追加标准流，都是 Bash 语法。
{% endnote %}

### 输入文本

~~~bash
if test -n "$LAB" && test -f "$LAB/.linux-shell-lab"; then
  cat <<'EOF_INPUT' >"$LAB/literal.txt"
literal $HOME
EOF_INPUT
  cat <"$LAB/literal.txt"

  if printf 'copy\n' | tee "$LAB/copy.txt"; then
    printf '%s\n' 'tee copied stdout to copy.txt'
  else
    printf '%s\n' 'tee could not write copy.txt' >&2
  fi

  if printf 'copy\n' | tee "$LAB/missing/copy.txt"; then
    printf '%s\n' 'unexpected writable missing directory'
  else
    printf '%s\n' 'tee failure is visible and non-zero'
  fi
else
  printf '%s\n' '请先运行“最小实验”创建隔离目录' >&2
fi
~~~

{% note info flat %}
带引号的 Here 文档分隔符禁止其中的变量展开，所以读取 literal.txt 时应原样看到 literal $HOME。tee 适合“同一段标准输出既要观察又要保存”；它不会自动合并标准错误。目标路径不可写或父目录不存在时，tee 返回非零，调用方必须检查该状态。
{% endnote %}

## 管道与状态

~~~bash
set +o pipefail
false | true
printf 'default=%s\n' "$?"

set -o pipefail
false | true
printf 'pipefail=%s\n' "$?"

true && printf '%s\n' 'then branch'
false || printf '%s\n' 'fallback branch'
~~~

{% note primary flat %}
默认管道状态取最后一个命令，因此第一段输出 default=0；Bash 开启 pipefail 后，任一阶段失败都会让整体失败，第二段输出 pipefail=1。&& 只在前项成功时继续，|| 只在前项失败时继续。
{% endnote %}

{% note warning flat %}
pipefail 不是“任何非零都要报错”的替代品。例如 grep 无匹配可能是正常业务结果，脚本仍须为可预期状态写清处理分支。POSIX sh 不要求支持 pipefail。
{% endnote %}

## 命令列表与作用域

~~~bash
place=outer
{ place=group; }
printf 'brace=<%s>\n' "$place"

(place=subshell)
printf 'parent=<%s>\n' "$place"

true; false; printf 'last=%s\n' "$?"
~~~

{% note info flat %}
花括号在当前 Shell 执行，因而第一处输出 brace=<group>；圆括号在子 Shell 执行，第二处仍输出 parent=<group>。分号只负责顺序执行，不会因前一个 false 自动停止，最后一行记录的是前一个命令的状态 1。
{% endnote %}

## 参数批处理

~~~bash
printf '%s\0' 'one file' 'two file' |
  xargs -0 -n 1 printf '<%s>\n'
~~~

{% note primary flat %}
这是 GNU/Ubuntu 常用的 NUL 方案：生产者输出 NUL 分隔记录，xargs -0 读取，才会分别输出 <one file> 和 <two file>。文件名和用户输入可能包含空格或换行，不能把它们交给按空白分割的命令替换。
{% endnote %}

{% note warning flat %}
xargs -0 不是 POSIX xargs 的可移植接口。严格 POSIX 环境不要把任意文件名塞进文本分隔协议；遍历路径时改用能够直接传递路径参数的 find -exec，或只在输入格式明确禁止换行时选择其他分隔方式。
{% endnote %}

## 选择 Shell

| 行为 | Bash 写法 | POSIX 选择 |
| --- | --- | --- |
| ANSI-C 引号 | $'line1\nline2' | 用 printf 生成转义字符 |
| 花括号展开 | {one,two} | 显式列出两个参数 |
| 合并标准流 | &>file | >file 2>&1 |
| Here string | <<< "$value" | 由 printf 把值送入标准输入 |
| 管道失败传播 | set -o pipefail | 拆开检查各阶段状态 |
| NUL 批处理 | xargs -0 | 不用文本分隔传递任意文件名 |

{% note info flat %}
首行解释器是语法合同：需要 Bash 扩展时使用 #!/usr/bin/env bash；目标是可移植脚本时使用 POSIX sh 并按 POSIX 语法编写。不要用 sh 运行 Bash 代码，再靠偶然成功判断兼容性。
{% endnote %}

## 低频入口

{% note info flat %}
下表是中文检索入口，不是核心实验。每行说明它解决什么、何时不要选它；这样既能根据中文场景找到命令或语法，又不会把边缘能力伪装成本文主线。
{% endnote %}

{% folding blue, 低频语法与工具的选择边界 %}
| 条目 | 中文用途 | 选择与排除边界 |
| --- | --- | --- |
| Comments | 用 # 为命令意图和风险留下说明 | 注释不改变执行；不要用注释替代输入校验 |
| Bash/POSIX 保留字 | if、then、do 等构成 Shell 语法骨架 | 它们不是可替换的外部命令；流程控制在脚本主题展开 |
| Bash/POSIX 简单命令 | 一个简单命令由赋值、参数和重定向组成 | 先按本篇解析顺序理解，不把它误当成脚本函数 |
| Bash/POSIX 命令搜索 | 知道 Shell 会解析命令名并选择实现 | 具体定位诊断属于命令行基础，不用它判断 Bash 语法兼容性 |
| Alias substitution | 为交互式命令设置短别名 | 脚本不要依赖交互 alias，环境不同会失效 |
| Simple command expansion | 执行前处理赋值和展开 | 排查一行命令先看参数边界，不单独背诵名词 |
| Bash/POSIX 波浪号展开 | 在词首把 ~ 展开为 home 路径 | 自动化路径优先写明确变量；不是任意位置都会展开 |
| Bash/POSIX 模式匹配 | 用 glob 匹配文件名模式 | glob 不是 grep 的正则；无匹配时先确认 Shell 选项 |
| Bash/POSIX 引号移除 | 解析完成后去掉语法引号 | 它不会恢复已丢失的字段边界，变量仍应按需加引号 |
| Here strings | Bash 用 <<< 把一行文本作为标准输入 | 需要 POSIX 兼容时用 Here 文档或 printf 管道 |
| Asynchronous lists | 用 & 让命令在后台启动 | 后台不等于服务管理；要等待、记录状态并避免无上限并发 |
| date | 生成或读取时间证据 | 格式选项有平台差异，不能把显示时间当成时区正确性证明 |
| echo | 输出简单固定提示 | 输出变量或转义文本优先用 printf，避免实现差异 |
| expr | POSIX 风格的算术和字符串入口 | 新脚本优先 Shell 算术或 awk，避免复杂引用 |
| sleep | 受控等待 | 它不能证明服务已就绪，等待后仍需检查状态 |
| timeout | 给外部命令设置最长运行时间 | 超时不保证所有子进程都终止，还要处理退出状态 |
| seq | 生成简单数列 | 大量数据用专门工具；不要以它替代真实输入 |
| yes | 重复输出固定文本 | 很容易产生无限输出，只能与明确消费者和上限配合 |
| Coprocesses、Process substitution、Locale-specific translation、描述符移动与读写、GNU Parallel | 并发、描述符和区域设置的专项能力 | 超出本文的参数与标准流主线；先具备隔离、资源控制与可移植性需求再进入进阶路线 |
{% endfolding %}

## 结果验证

~~~bash
if test -n "$LAB" && test -f "$LAB/.linux-shell-lab"; then
  if test -s "$LAB/combined.txt" &&
    test "$(cat "$LAB/literal.txt")" = 'literal $HOME' &&
    test "$(cat "$LAB/copy.txt")" = copy; then
    printf '%s\n' 'test-assertions=pass'
  else
    printf '%s\n' 'test-assertions=fail' >&2
  fi

  pipeline_status=$(set -o pipefail; false | true; printf '%s' "$?")
  printf 'pipeline-status=%s\n' "$pipeline_status"

  xargs_output=$(printf '%s\0' 'a b' | xargs -0 -n 1 printf '<%s>\n')
  if test "$xargs_output" = '<a b>'; then
    printf '%s\n' 'xargs-check=pass'
  else
    printf '%s\n' 'xargs-check=fail' >&2
  fi
  printf '保留临时目录供检查：%s\n' "$LAB"
else
  printf '%s\n' '请先运行“最小实验”创建隔离目录' >&2
fi
~~~

{% note success flat %}
test -s 判断文件是否非空，test "$a" = "$b" 判断字符串是否相等；真返回 0、假返回非 0。预期可见 test-assertions=pass、pipeline-status=1 与 xargs-check=pass。实验不会自动删除 LAB，检查完再按你的环境安全清理。
{% endnote %}

{% flashcard basic id:linux-a5-quote deck:"Linux" priority:1 tags:"Shell,引号" %}
--- question
为什么 Shell 变量通常要放在双引号中？
--- answer
双引号保留变量展开后的整体参数边界，避免空格触发字段分割和路径名展开。
--- explanation
只有明确需要把一个值拆成多个参数时才省略引号；不要把用户输入直接拼入 eval 或 sh -c。
{% endflashcard %}

{% flashcard basic id:linux-a5-escape deck:"Linux" priority:2 tags:"Shell,转义" %}
--- question
未引用的反斜杠和双引号内的反斜杠有什么不同？
--- answer
未引用的反斜杠可保留空格等特殊字符；双引号内只会转义有限字符，普通空格前的反斜杠会保留。
--- explanation
反斜杠不是通用替代引号。要保留整个变量值，通常仍应使用双引号。
{% endflashcard %}

{% flashcard basic id:linux-a5-pipefail deck:"Linux" priority:1 tags:"管道,退出状态" %}
--- question
pipefail 解决了什么问题？
--- answer
它让管道中任意命令失败都能反映到整体状态，而不是只看最后一个命令。
--- explanation
启用后仍要区分正常的无匹配、超时和真正失败；组合命令需要为预期状态设计分支。
{% endflashcard %}

{% flashcard basic id:linux-a5-redirection-order deck:"Linux" priority:1 tags:"重定向,标准流" %}
--- question
2>&1 >file 和 >file 2>&1 为什么结果不同？
--- answer
重定向按从左到右执行；前者让错误流先指向旧的标准输出，后者让错误流跟随新文件。
--- explanation
先把标准输出指向文件再复制给标准错误，才会让两者进入同一目标。
{% endflashcard %}

{% flashcard basic id:linux-a5-scope deck:"Linux" priority:2 tags:"Shell,作用域" %}
--- question
花括号与圆括号分组对变量的影响有什么不同？
--- answer
花括号在当前 Shell 执行，变量修改会保留；圆括号在子 Shell 执行，修改不会回到父 Shell。
--- explanation
这也是命令列表出现“变量看似赋值了但后面读不到”的常见原因。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024 Shell Command Language, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/, https://pubs.opengroup.org/favicon.ico %}
{% link GNU Bash Reference Manual, https://www.gnu.org/software/bash/manual/bash.html, https://www.gnu.org/favicon.ico %}
{% link GNU Coreutils Manual, https://www.gnu.org/software/coreutils/manual/coreutils.html, https://www.gnu.org/favicon.ico %}
{% endlinkgroup %}

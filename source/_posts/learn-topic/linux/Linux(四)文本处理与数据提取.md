---
title: Linux(四)文本处理与数据提取
tags:
  - Linux
  - 文本处理
categories:
  - Learn Topic
  - Linux
description: 使用文本工具从日志和半结构化数据中筛选、转换、聚合并验证结论。
cover: /img/picgo-images/linux-course-cover.png
series: Linux
series_order: 4
published: true
abbrlink: '33859692'
date: 2026-08-25 00:00:00
---

{% course_series %}

{% note info flat %}
文本排障的目标不是“把日志全部打印出来”，而是把原始行变成可复核的证据：先限定输入，再匹配、切列、排序、聚合，最后回到原文。本篇只处理文本和半结构化日志；Shell 重定向语法、日志服务管理和脚本自动化分别留给后续主题。
{% endnote %}

## 处理流水线

{% mermaid %}
flowchart TD
  A[原始文本] --> B[查看边界]
  B --> C[匹配规则]
  C --> D[字段转换]
  D --> E[排序与聚合]
  E --> F[关联或比较]
  F --> G[回查原文]
{% endmermaid %}

{% note primary flat %}
每一步只做一种变换，并保留输入样本、命令和结果。结果为空时，先区分“没有匹配”与“输入或字段定义错误”；结果有值时，再用原文行号、计数或 diff 回查。
{% endnote %}

## 样本与边界

### 文本夹具

```text
# text-lab/app.log
2026-08-26T10:00:01Z INFO user.id=42 ready
2026-08-26T10:00:03Z WARN retry timeout
2026-08-26T10:00:05Z ERROR user.id=42 refused

# text-lab/access.log（方法 路径 状态 延迟毫秒）
GET /ready 200 12
GET /orders 500 220
GET /orders 500 180
POST /login 401 35

# text-lab/status.txt
500
100
20
500

# text-lab/status.sorted（status.txt 的数值排序结果，供 uniq 的独立输入）
20
100
500
500

# text-lab/users.sorted（用户 请求数；按第 1 列排序）
alice 2
bob 1

# text-lab/totals.sorted（用户 延迟总毫秒；按第 1 列排序）
alice 120
bob 80

# text-lab/expected-5xx.txt
/orders 500
/orders 500

# text-lab/actual-5xx.txt
/orders 500
/orders 500
```

{% note info flat %}
后续命令只以这组已列出的文本夹具为输入：前三个文件是原始样本，`status.sorted` 是数值排序后的固定中间结果，两个 `*.sorted` 文件用于连接，两个 `5xx` 文件用于比较。真实日志先复制一小段到隔离目录，再确认时间窗、编码和字段含义；不要直接在生产日志上做会改写文件的操作。
{% endnote %}

## 查看与匹配

### 查看范围

~~~bash
cat text-lab/app.log
head -n 2 text-lab/app.log
tail -n 2 text-lab/app.log
~~~

```text
# cat 的预期结果：按原文件顺序完整输出三行
2026-08-26T10:00:01Z INFO user.id=42 ready
2026-08-26T10:00:03Z WARN retry timeout
2026-08-26T10:00:05Z ERROR user.id=42 refused

# head 的预期结果
2026-08-26T10:00:01Z INFO user.id=42 ready
2026-08-26T10:00:03Z WARN retry timeout

# tail 的预期结果
2026-08-26T10:00:03Z WARN retry timeout
2026-08-26T10:00:05Z ERROR user.id=42 refused
```

{% note warning flat %}
cat 按原文件顺序把全部内容写到输出，适合已确认很小的文本样本；它的三行输出应与夹具中的 `app.log` 三行逐行相同。长日志用 head、tail 或交互式 less 限定窗口。head/tail 的数字是证据窗口，不是“日志只有这么多行”的结论；本例的 head 与 tail 在第 2 行重叠，正好可回查窗口没有跳行。先记下时间范围，再扩大或缩小窗口。
{% endnote %}

### 模式选择

~~~bash
grep -nE 'ERROR|timeout' text-lab/app.log
grep -nF 'user.id=42' text-lab/app.log
grep -n 'MISSING' text-lab/app.log
~~~

```text
# 前两条的预期结果
2:2026-08-26T10:00:03Z WARN retry timeout
3:2026-08-26T10:00:05Z ERROR user.id=42 refused
1:2026-08-26T10:00:01Z INFO user.id=42 ready
3:2026-08-26T10:00:05Z ERROR user.id=42 refused

# 第三条没有标准输出，退出状态为 1：它表示“没有匹配”，不等于命令损坏。
```

{% note primary flat %}
grep 用基本正则，grep -E 用扩展正则，grep -F 按固定字符串匹配。模式来自用户输入或包含大量标点时优先 grep -F；把固定文本误当正则，会得到意外匹配或转义错误。
{% endnote %}

{% note warning flat %}
历史脚本中的 egrep 与 fgrep 分别迁移为 grep -E 与 grep -F。迁移时不仅替换命令名：前者保留扩展正则语义，后者保留“完全按文本匹配”的边界；新脚本不要再依赖旧别名。
{% endnote %}

## 字段与转换

### 字段模型

{% note info flat %}
对 `access.log`，空白分隔后的 `$1`、`$2`、`$3`、`$4` 分别是方法、路径、状态和延迟。awk 先对每一行求条件，再执行动作；字段数不足时应先用 `NF` 保护，不能假定每一行都完整。
{% endnote %}

~~~bash
cut -d ' ' -f 2,3 text-lab/access.log
awk 'NF >= 4 && $3 >= 500 {print $2, $3, $4}' text-lab/access.log
sed 's/INFO/NOTICE/' text-lab/app.log
~~~

```text
# cut 的预期结果
/ready 200
/orders 500
/orders 500
/login 401

# awk 的预期结果
/orders 500 220
/orders 500 180

# sed 的预期结果之一
2026-08-26T10:00:01Z NOTICE user.id=42 ready

# sed 只改输出流；原文件不会被改写。
```

{% note warning flat %}
cut 适合分隔符稳定、列号固定的输入；awk 适合条件、数值计算和字段缺失保护；sed 适合逐行选择或替换。空格折叠、引号和嵌套结构都会改变“第几列”的含义，JSON、CSV 等格式应使用对应解析器，不要强行按空格切列。
{% endnote %}

## 排序与关联

### 聚合证据

~~~bash
sort text-lab/status.txt
sort -n text-lab/status.txt
uniq -c text-lab/status.sorted
wc -l text-lab/access.log
join -1 1 -2 1 text-lab/users.sorted text-lab/totals.sorted
~~~

```text
# 默认 sort 的预期结果（按文本顺序）
100
20
500
500

# sort -n 的预期结果（按数值顺序）
20
100
500
500

# uniq -c 的预期结果
      1 20
      1 100
      2 500

# join 的预期结果
alice 2 120
bob 1 80

# wc -l 的预期结果
      4 text-lab/access.log
```

{% note primary flat %}
默认文本排序会把 `100` 排在 `20` 前，数值排序才按数值大小排列；夹具用这两个值让 `sort` 与 `sort -n` 的差异可观察。`status.sorted` 是数值排序后的固定输入，才能让 `uniq` 的计数可复现。uniq 只合并相邻重复行，所以必须先按同一个键排序；join 要求两个输入都按连接键并以相同排序规则排列。关联结果为空时，先检查键列、大小写、空白和排序前提，不要立即认定“没有关联数据”。
{% endnote %}

### 差异回查

~~~bash
diff -u text-lab/expected-5xx.txt text-lab/actual-5xx.txt
~~~

{% note success flat %}
相同文件时 diff 没有输出且退出状态为 0；有差异时统一格式会标出新增和删除行。把“无输出”与 grep 的“无匹配退出 1”分开记录，避免把不同命令的状态语义混为一谈。
{% endnote %}

## 低频入口

{% note info flat %}
下面的工具在排障中会遇到，但不应打断“查看—匹配—字段—聚合—回查”主线。需要它们时，先判断输入格式与前置条件；它们不是 grep、awk 或 sort 的通用替代品。
{% endnote %}

{% folding blue, 查看、转换与比较的低频入口 %}
| 条目 | 何时使用 | 不要当成 |
| --- | --- | --- |
| less、zless | 分页阅读普通或 gzip 压缩的长文本 | 可自动生成结论的批处理工具；它们需要人工查看 |
| tac、nl | 从末行向前读，或给证据加行号 | 时间排序或日志解析；行号会随文件变化 |
| zgrep | 在 gzip 文本中做模式匹配 | 所有压缩格式的统一查询器 |
| strings、od | 只把二进制中的可读片段或字节作为线索 | 二进制格式解析或文本日志主线；结构问题进入进阶路线 |
| tr | 做一对一的字符映射 | 字段级替换或正则改写 |
| expand、unexpand、fold、fmt | 规范制表符、换行或段落宽度 | 数据清洗的语义解析；格式变化可能影响比较结果 |
| gawk | 确实依赖 GNU awk 扩展时 | 默认可移植 awk；脚本要显式记录实现要求 |
| paste、comm | 横向拼接已对齐行，或比较两份已排序集合 | 关系型 join 或无排序输入的比较 |
| split、csplit、pr | 按行或模式分片，或为人工阅读分页 | 事务性拆分或内容校验；生成物应放进隔离目录 |
{% endfolding %}

## 结果验证

~~~bash
wc -l text-lab/app.log text-lab/access.log
grep -nE 'ERROR|timeout' text-lab/app.log
awk 'NF >= 4 && $3 >= 500 {print $2, $3}' text-lab/access.log
uniq -c text-lab/status.sorted
diff -u text-lab/expected-5xx.txt text-lab/actual-5xx.txt
~~~

{% note success flat %}
`wc -l` 计数的是换行符，不是抽象的“记录数”。夹具中的 `access.log` 最后一行必须以换行结束，所以结果为 4；若复制的真实片段最后一条记录没有换行，`wc -l` 可能少 1，应同时检查文件尾部后再解释样本规模。合格的文本结论还应能回答输入范围、匹配规则、字段定义、排序或关联前提、结果数量和原文行号。最后用同一输入的另一种观察方式回查：例如用 grep 的行号回到原文、用 wc 核对样本规模、用 diff 对比预期结果。
{% endnote %}

{% flashcard basic id:linux-a4-grep-selection deck:"Linux" priority:1 tags:"grep,正则" %}
--- question
grep、grep -E 和 grep -F 如何选择？
--- answer
grep 处理基本正则，grep -E 处理扩展正则，grep -F 按固定字符串匹配。
--- explanation
旧的 egrep/fgrep 迁移为 grep -E/-F；模式来自用户输入时优先固定字符串，减少正则注入和转义错误。
{% endflashcard %}

{% flashcard basic id:linux-a4-awk-cut deck:"Linux" priority:1 tags:"awk,cut,字段" %}
--- question
固定列和条件聚合分别优先用 cut 还是 awk？
--- answer
固定分隔符和列号用 cut；需要条件、计算、数组或格式化用 awk。
--- explanation
先定义字段边界；空格折叠、引号和缺失字段会改变列号，不能只凭肉眼猜格式。
{% endflashcard %}

{% flashcard basic id:linux-a4-sort-uniq deck:"Linux" priority:1 tags:"排序,聚合" %}
--- question
为什么 uniq -c 前通常要先 sort？
--- answer
uniq 只合并相邻重复行，sort 才能把相同键放在一起。
--- explanation
若数据已经按键分组可以省略排序，但必须把这个前提写入脚本或报告，否则计数会漏项。
{% endflashcard %}

{% flashcard basic id:linux-a4-text-evidence deck:"Linux" priority:2 tags:"日志,证据" %}
--- question
文本排障怎样避免“结果正确但无法复核”？
--- answer
记录输入范围、命令、字段定义、匹配规则、结果数量和原文行号，并用第二种方法回查。
--- explanation
只给最终数字无法发现路径错误、编码问题或正则误匹配；grep 行号、wc 计数和 diff 对比能固定证据。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link POSIX.1-2024 Utilities, https://pubs.opengroup.org/onlinepubs/9799919799.2024edition/utilities/contents.html, https://pubs.opengroup.org/favicon.ico %}
{% link GNU grep Manual, https://www.gnu.org/software/grep/manual/grep.html, https://www.gnu.org/favicon.ico %}
{% link GNU sed Manual, https://www.gnu.org/software/sed/manual/sed.html, https://www.gnu.org/favicon.ico %}
{% link GNU awk Manual, https://www.gnu.org/software/gawk/manual/gawk.html, https://www.gnu.org/favicon.ico %}
{% endlinkgroup %}

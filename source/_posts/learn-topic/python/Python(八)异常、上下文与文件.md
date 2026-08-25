---
title: Python(八)异常、上下文与文件
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 设计异常传播和确定性资源管理，安全处理文件、路径、编码与正则表达式，并验证上下文清理边界。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 8
published: false
abbrlink: c31bf4bb
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 文章职责

- 唯一要解决的问题：design failure handling and deterministic resource management for exceptions, files, paths, encodings, and regular expressions.
- 可观察成果：reader can preserve exception context, implement/use a context manager, and safely process text and binary files across platforms.
- 进入条件：Python(七)面向对象与数据模型.
- 明确不承担：不改变已确认的课程主题、篇序和其他文章的唯一知识归属。

## 内容边界

- 复用或新建依据：keep old exception/file/regex cases but replace manual-close patterns and drive-letter-only paths with `with` and `pathlib`.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:datamodel#i-o-objects-also-known-as-file-objects` | 核心详解 | 文件与路径 |
| `langref:datamodel#with-statement-context-managers` | 核心详解 | 上下文管理 |
| `langref:executionmodel#exceptions` | 核心详解 | 异常控制流 |
| `langref:simple_stmts#the-raise-statement` | 核心详解 | 异常控制流 |
| `langref:compound_stmts#the-try-statement` | 核心详解 | 异常控制流 |
| `langref:compound_stmts#except-clause` | 核心详解 | 异常控制流 |
| `langref:compound_stmts#except-star` | 正文简述 | 异常控制流 |
| `langref:compound_stmts#else-clause` | 核心详解 | 异常控制流 |
| `langref:compound_stmts#finally-clause` | 核心详解 | 异常控制流 |
| `langref:compound_stmts#the-with-statement` | 核心详解 | 上下文管理 |
| `builtin:open` | 核心详解 | 文件与路径 |
| `stdtype:contextmanager.__enter__` | 正文简述 | 上下文管理 |
| `stdtype:contextmanager.__exit__` | 正文简述 | 上下文管理 |
| `exception:BaseException.__context__` | 正文简述 | 异常控制流 |
| `exception:BaseException.__cause__` | 正文简述 | 异常控制流 |
| `exception:BaseException.__suppress_context__` | 正文简述 | 异常控制流 |
| `exception:BaseException` | 核心详解 | 异常控制流 |
| `exception:BaseException.args` | 正文简述 | 异常控制流 |
| `exception:BaseException.with_traceback` | 正文简述 | 异常控制流 |
| `exception:BaseException.__traceback__` | 正文简述 | 异常控制流 |
| `exception:BaseException.add_note` | 正文简述 | 异常控制流 |
| `exception:BaseException.__notes__` | 正文简述 | 异常控制流 |
| `exception:Exception` | 核心详解 | 异常控制流 |
| `exception:ArithmeticError` | 核心详解 | 异常控制流 |
| `exception:BufferError` | 正文简述 | 异常控制流 |
| `exception:LookupError` | 核心详解 | 异常控制流 |
| `exception:AssertionError` | 核心详解 | 异常控制流 |
| `exception:AttributeError` | 核心详解 | 异常控制流 |
| `exception:AttributeError.name` | 正文简述 | 异常控制流 |
| `exception:AttributeError.obj` | 正文简述 | 异常控制流 |
| `exception:EOFError` | 核心详解 | 异常控制流 |
| `exception:FloatingPointError` | 正文简述 | 异常控制流 |
| `exception:GeneratorExit` | 正文简述 | 异常控制流 |
| `exception:ImportError` | 核心详解 | 异常控制流 |
| `exception:ImportError.name` | 正文简述 | 异常控制流 |
| `exception:ImportError.path` | 正文简述 | 文件与路径 |
| `exception:ModuleNotFoundError` | 正文简述 | 异常控制流 |
| `exception:IndexError` | 核心详解 | 异常控制流 |
| `exception:KeyError` | 核心详解 | 异常控制流 |
| `exception:KeyboardInterrupt` | 核心详解 | 异常控制流 |
| `exception:MemoryError` | 正文简述 | 异常控制流 |
| `exception:NameError` | 核心详解 | 异常控制流 |
| `exception:NameError.name` | 正文简述 | 异常控制流 |
| `exception:NotImplementedError` | 核心详解 | 异常控制流 |
| `exception:OSError` | 核心详解 | 异常控制流 |
| `exception:OSError.errno` | 正文简述 | 异常控制流 |
| `exception:OSError.winerror` | 正文简述 | 异常控制流 |
| `exception:OSError.strerror` | 正文简述 | 异常控制流 |
| `exception:OSError.filename` | 正文简述 | 文件与路径 |
| `exception:OSError.filename2` | 正文简述 | 文件与路径 |
| `exception:OverflowError` | 正文简述 | 异常控制流 |
| `exception:PythonFinalizationError` | 正文简述 | 异常控制流 |
| `exception:RecursionError` | 正文简述 | 异常控制流 |
| `exception:ReferenceError` | 正文简述 | 异常控制流 |
| `exception:RuntimeError` | 核心详解 | 异常控制流 |
| `exception:StopIteration` | 核心详解 | 异常控制流 |
| `exception:StopIteration.value` | 正文简述 | 异常控制流 |
| `exception:StopAsyncIteration` | 正文简述 | 异常控制流 |
| `exception:SyntaxError` | 核心详解 | 异常控制流 |
| `exception:SyntaxError.filename` | 正文简述 | 文件与路径 |
| `exception:SyntaxError.lineno` | 正文简述 | 异常控制流 |
| `exception:SyntaxError.offset` | 正文简述 | 异常控制流 |
| `exception:SyntaxError.text` | 正文简述 | 异常控制流 |
| `exception:SyntaxError.end_lineno` | 正文简述 | 异常控制流 |
| `exception:SyntaxError.end_offset` | 正文简述 | 异常控制流 |
| `exception:IndentationError` | 正文简述 | 异常控制流 |
| `exception:TabError` | 正文简述 | 异常控制流 |
| `exception:SystemError` | 正文简述 | 异常控制流 |
| `exception:SystemExit` | 正文简述 | 异常控制流 |
| `exception:SystemExit.code` | 正文简述 | 异常控制流 |
| `exception:TypeError` | 核心详解 | 异常控制流 |
| `exception:UnboundLocalError` | 核心详解 | 异常控制流 |
| `exception:UnicodeError` | 正文简述 | 异常控制流 |
| `exception:UnicodeError.encoding` | 正文简述 | 文件与路径 |
| `exception:UnicodeError.reason` | 正文简述 | 异常控制流 |
| `exception:UnicodeError.object` | 正文简述 | 异常控制流 |
| `exception:UnicodeError.start` | 正文简述 | 异常控制流 |
| `exception:UnicodeError.end` | 正文简述 | 异常控制流 |
| `exception:UnicodeEncodeError` | 正文简述 | 异常控制流 |
| `exception:UnicodeDecodeError` | 正文简述 | 异常控制流 |
| `exception:UnicodeTranslateError` | 正文简述 | 异常控制流 |
| `exception:ValueError` | 核心详解 | 异常控制流 |
| `exception:ZeroDivisionError` | 核心详解 | 异常控制流 |
| `exception:EnvironmentError` | 正文简述 | 异常控制流 |
| `exception:IOError` | 正文简述 | 异常控制流 |
| `exception:WindowsError` | 正文简述 | 异常控制流 |
| `exception:BlockingIOError` | 正文简述 | 异常控制流 |
| `exception:BlockingIOError.characters_written` | 正文简述 | 异常控制流 |
| `exception:ChildProcessError` | 正文简述 | 异常控制流 |
| `exception:ConnectionError` | 正文简述 | 异常控制流 |
| `exception:BrokenPipeError` | 正文简述 | 异常控制流 |
| `exception:ConnectionAbortedError` | 正文简述 | 异常控制流 |
| `exception:ConnectionRefusedError` | 正文简述 | 异常控制流 |
| `exception:ConnectionResetError` | 正文简述 | 异常控制流 |
| `exception:FileExistsError` | 正文简述 | 文件与路径 |
| `exception:FileNotFoundError` | 正文简述 | 文件与路径 |
| `exception:InterruptedError` | 正文简述 | 异常控制流 |
| `exception:IsADirectoryError` | 正文简述 | 异常控制流 |
| `exception:NotADirectoryError` | 正文简述 | 异常控制流 |
| `exception:PermissionError` | 正文简述 | 异常控制流 |
| `exception:ProcessLookupError` | 正文简述 | 异常控制流 |
| `exception:TimeoutError` | 正文简述 | 异常控制流 |
| `exception:Warning` | 正文简述 | 异常控制流 |
| `exception:UserWarning` | 正文简述 | 异常控制流 |
| `exception:DeprecationWarning` | 正文简述 | 异常控制流 |
| `exception:PendingDeprecationWarning` | 正文简述 | 异常控制流 |
| `exception:SyntaxWarning` | 正文简述 | 异常控制流 |
| `exception:RuntimeWarning` | 正文简述 | 异常控制流 |
| `exception:FutureWarning` | 正文简述 | 异常控制流 |
| `exception:ImportWarning` | 正文简述 | 异常控制流 |
| `exception:UnicodeWarning` | 正文简述 | 异常控制流 |
| `exception:EncodingWarning` | 正文简述 | 文件与路径 |
| `exception:BytesWarning` | 正文简述 | 异常控制流 |
| `exception:ResourceWarning` | 正文简述 | 异常控制流 |
| `exception:ExceptionGroup` | 正文简述 | 异常控制流 |
| `exception:BaseExceptionGroup` | 正文简述 | 异常控制流 |
| `exception:BaseExceptionGroup.message` | 正文简述 | 异常控制流 |
| `exception:BaseExceptionGroup.exceptions` | 正文简述 | 异常控制流 |
| `exception:BaseExceptionGroup.subgroup` | 正文简述 | 异常控制流 |
| `exception:BaseExceptionGroup.split` | 正文简述 | 异常控制流 |
| `exception:BaseExceptionGroup.derive` | 正文简述 | 异常控制流 |
| `stdlib:atexit` | 正文简述 | 错误与异常 |
| `stdlib:contextlib` | 核心详解 | 上下文管理 |
| `stdlib:csv` | 正文简述 | 文件与路径 |
| `stdlib:fileinput` | 正文简述 | 文件与路径 |
| `stdlib:fnmatch` | 正文简述 | 文件与路径 |
| `stdlib:glob` | 正文简述 | 文件与路径 |
| `stdlib:io` | 核心详解 | 文件与路径 |
| `stdlib:json` | 正文简述 | 文件与路径 |
| `stdlib:os` | 核心详解 | 文件与路径 |
| `stdlib:os.path` | 正文简述 | 文件与路径 |
| `stdlib:pathlib` | 核心详解 | 文件与路径 |
| `stdlib:pathlib.types` | 正文简述 | 文件与路径 |
| `stdlib:pickle` | 正文简述 | 文件与路径 |
| `stdlib:re` | 核心详解 | 正则表达式 |
| `stdlib:shutil` | 正文简述 | 文件与路径 |
| `stdlib:stat` | 正文简述 | 文件与路径 |
| `stdlib:tempfile` | 核心详解 | 文件与路径 |
- 失败边界：保留原验证计划中的误区、失败表现、恢复动作和不适用条件。

## 正文编排

| H2/H3 与正文块 | 读者任务 | 核心内容 | 主承载 | 选择理由 | 直接可见 | 失败降级 | 证据或示例 | 验证状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 错误与异常 | 判断错误与异常 | 语法错误与运行时异常；异常层次；捕获范围 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 异常控制流 | 判断异常控制流 | try、except、else、finally；raise 与异常链；自定义异常；ExceptionGroup 与 except* 识别 | `tip warning` | 该块以风险、失败边界或恢复动作作为阅读重点 | 触发条件、失败表现、影响范围和恢复动作 | 提示样式失效时警告文字仍直接可读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 上下文管理 | 建立上下文管理的心智模型 | with 协议；__enter__ 与 __exit__；contextlib | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 文件与路径 | 建立文件与路径的心智模型 | 文本、字节与编码；pathlib；临时文件与原子替换边界 | `Markdown 表格` | 需要精确比较条件、字段或方案取舍 | 比较维度、选择标准、推荐项和不适用条件 | 纯文本表格仍可读取完整比较 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 正则表达式 | 建立正则表达式的心智模型 | 原始字符串；match、search 与 fullmatch；分组、边界与回溯风险 | `note info flat` | 核心概念需要直接可见，适合用短结论承接后续示例 | 定义、适用边界和与前后章节的关系 | 样式失效时仍按普通段落顺序阅读 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 资源处理实验 | 完成并验证资源处理实验 | 安全读取日志；格式校验；失败恢复 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 结果验证 | 完成并验证结果验证 | 结果验证的输入、关键步骤、结果与边界 | `代码 + checkbox` | 需要用可复现输入、命令、输出和检查项闭环 | 必要命令、预期结果、失败表现和清理动作 | 交互样式失效后代码与检查文字仍完整 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 常见问题 | 建立常见问题的心智模型 | 常见问题的输入、关键步骤、结果与边界 | `flashcard` | 真实高价值问题需要进入长期复习队列 | 题面、精简答案和详细解析 | 闪卡脚本失效时题面与答案正文仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |
| 参考资料 | 建立参考资料的心智模型 | 参考资料的输入、关键步骤、结果与边界 | `linkgroup/link` | 官方扩展阅读使用统一资料卡片 | 资料名称、用途和完整 URL | 图片或网络失败时名称与 URL 仍可读取 | 贯穿案例、最小示例、失败表现与结果检查 | 计划 |

## 视觉与复习

- 贯穿案例与完整示例：implement a context-managed log reader that validates records with regex, reports chained parse errors, handles encoding failure, demonstrates how grouped failures are separated by `except*`, and cleans temporary resources.
- 失败边界与踩坑：broad `except` hides failures; `finally` runs during propagation; `except*` splits an exception group rather than behaving like ordinary `except`; regex is not a general parser; `__del__` does not replace `with`; `pathlib.types` is only identified and version-gated on the Python 3.13 baseline.
- FAQ 候选与来源：Tutorial error chapter, Programming FAQ Unicode/raw-string questions, Library FAQ file questions.
- 复习卡片：
  - `python-error-else-finally` priority 1.
    - `python-error-chain` priority 2.
    - `python-error-context` priority 1.
    - `python-error-text-binary` priority 2.
- 图表或实验：exception propagation/finally flow, context-manager desugaring, and text encoding boundary diagram.
- 主要参考资料：Built-in exceptions, compound statements, `contextlib`, `io`, `pathlib`, `re`, Tutorial and FAQ.
- 标签选型复查：写作前从当前完整标签能力快照重新选择，重点检查 note 单一化、连续同标签、错误折叠和伪平行 tabs。
- 参考资料卡片：按正文实际使用顺序整理官方资料，公开时使用 linkgroup/link 与官方图标。

## 验收证据

- 机械检查：content、tags、release、lint 和闪卡引用全部通过。
- 隔离构建：目标草稿完成真实生成，并检查桌面、移动端、明暗主题与实际交互。
- 正文完成条件：Article Reviewer 无阻塞项，公开候选通过后才删除占位标记并切换 published: true。

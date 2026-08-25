---
title: Python(三)对象、变量与运算
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 理解名称绑定、对象身份、相等性、可变性、数字运算与字符串方法族，并避开驻留和浮点数等常见误区。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 3
published: false
abbrlink: 76bec403
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 学习目标

- 唯一问题：establish Python's name-binding and object model for values, identity, equality, mutability, numeric/string behavior, and operators.
- 学习成果：reader can predict identity/equality and mutation results without relying on accidental interning or IDE behavior.
- 前置文章：Python(二)运行环境与代码组织.
- 复用或新建依据：rebuild the useful operators, strings, and numeric exercises from the old notes; correct implementation-dependent claims.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:lexical_analysis#lexical-analysis` | 核心详解 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#line-structure` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#logical-lines` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#physical-lines` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#comments` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#encoding-declarations` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#explicit-line-joining` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#implicit-line-joining` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#blank-lines` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#indentation` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#whitespace-between-tokens` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#end-marker` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#other-tokens` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#names-identifiers-and-keywords` | 核心详解 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#keywords` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#soft-keywords` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#reserved-classes-of-identifiers` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#non-ascii-characters-in-names` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#literals` | 核心详解 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#string-and-bytes-literals` | 核心详解 | 字符串与字节 / 编码与解码边界 |
| `langref:lexical_analysis#triple-quoted-strings` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#string-prefixes` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#formal-grammar` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:lexical_analysis#escape-sequences` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#ignored-end-of-line` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#escaped-characters` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#octal-character` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#hexadecimal-character` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#named-unicode-character` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#hexadecimal-unicode-characters` | 正文简述 | 字符串与字节 / Unicode 字符串 |
| `langref:lexical_analysis#unrecognized-escape-sequences` | 正文简述 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#bytes-literals` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `langref:lexical_analysis#raw-string-literals` | 核心详解 | 字符串与字节 / 转义与原始字符串 |
| `langref:lexical_analysis#formatted-string-literals` | 核心详解 | 字符串与字节 / f-string 与 3.14 t-string 识别 |
| `langref:lexical_analysis#template-string-literals` | 核心详解 | 字符串与字节 / f-string 与 3.14 t-string 识别 |
| `langref:lexical_analysis#formal-grammar-for-f-strings` | 正文简述 | 字符串与字节 / f-string 与 3.14 t-string 识别 |
| `langref:lexical_analysis#numeric-literals` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:lexical_analysis#integer-literals` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:lexical_analysis#floating-point-literals` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:lexical_analysis#imaginary-literals` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:lexical_analysis#operators-and-delimiters` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:datamodel#data-model` | 核心详解 | 名称与对象 / 类型、值与身份 |
| `langref:datamodel#objects-values-and-types` | 核心详解 | 名称与对象 / 类型、值与身份 |
| `langref:datamodel#none` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:datamodel#notimplemented` | 正文简述 | 身份与相等 / 值比较与类型边界 |
| `langref:datamodel#ellipsis` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:datamodel#numbers-number` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:datamodel#numbers-integral` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:datamodel#numbers-real-float` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:datamodel#numbers-complex-complex` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:expressions#expressions` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#arithmetic-conversions` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:expressions#atoms` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#built-in-constants` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#atom-identifiers` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#literals` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#literals-and-object-identity` | 核心详解 | 身份与相等 / is 与 == |
| `langref:expressions#string-literal-concatenation` | 正文简述 | 字符串与字节 / Unicode 字符串 |
| `langref:expressions#parenthesized-forms` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#primaries` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#attribute-references` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#comma-separated-subscripts` | 正文简述 | 名称与对象 / 标识符、字面量与词法边界 |
| `langref:expressions#the-power-operator` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:expressions#unary-arithmetic-and-bitwise-operations` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:expressions#binary-arithmetic-operations` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:expressions#shifting-operations` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:expressions#binary-bitwise-operations` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `langref:expressions#comparisons` | 核心详解 | 身份与相等 / 值比较与类型边界 |
| `langref:expressions#value-comparisons` | 核心详解 | 身份与相等 / 值比较与类型边界 |
| `langref:expressions#is-not` | 核心详解 | 身份与相等 / is 与 == |
| `langref:expressions#boolean-operations` | 核心详解 | 数字与运算 / 布尔运算与短路求值 |
| `langref:expressions#evaluation-order` | 核心详解 | 数字与运算 / 表达式求值顺序与优先级 |
| `langref:expressions#operator-precedence` | 核心详解 | 数字与运算 / 表达式求值顺序与优先级 |
| `langref:simple_stmts#expression-statements` | 正文简述 | 可变性 / 别名与共享引用 |
| `langref:simple_stmts#assignment-statements` | 核心详解 | 名称与对象 / 赋值与重新绑定 |
| `langref:simple_stmts#augmented-assignment-statements` | 核心详解 | 可变性 / 增量赋值的差异 |
| `langref:simple_stmts#the-del-statement` | 正文简述 | 可变性 / del 的解绑与容器删除 |
| `builtin:abs` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:ascii` | 正文简述 | 名称与对象 / 类型、值与身份 |
| `builtin:bin` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:bool` | 核心详解 | 数字与运算 / 布尔运算与短路求值 |
| `builtin:chr` | 正文简述 | 字符串与字节 / Unicode 字符串 |
| `builtin:complex` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:divmod` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:float` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:format` | 正文简述 | 字符串与字节 / 格式化方法族 |
| `builtin:hex` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:id` | 核心详解 | 身份与相等 / is 与 == |
| `builtin:int` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:oct` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:ord` | 正文简述 | 字符串与字节 / Unicode 字符串 |
| `builtin:pow` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `builtin:repr` | 正文简述 | 名称与对象 / 类型、值与身份 |
| `builtin:round` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:int.bit_length` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:int.bit_count` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:int.to_bytes` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:int.from_bytes` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:int.as_integer_ratio` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:int.is_integer` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:float.from_number` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:float.as_integer_ratio` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:float.is_integer` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:float.hex` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:float.fromhex` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:complex.from_number` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdtype:str` | 正文简述 | 字符串与字节 / Unicode 字符串 |
| `stdtype:str.capitalize` | 正文简述 | 字符串与字节 / 大小写与 Unicode 归一 |
| `stdtype:str.casefold` | 正文简述 | 字符串与字节 / 大小写与 Unicode 归一 |
| `stdtype:str.center` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.count` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.encode` | 核心详解 | 字符串与字节 / 编码与解码边界 |
| `stdtype:str.endswith` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.expandtabs` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.find` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.format` | 核心详解 | 字符串与字节 / 格式化方法族 |
| `stdtype:str.format_map` | 正文简述 | 字符串与字节 / 格式化方法族 |
| `stdtype:str.index` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isalnum` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isalpha` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isascii` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isdecimal` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isdigit` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isidentifier` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.islower` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isnumeric` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isprintable` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isspace` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.istitle` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.isupper` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.join` | 核心详解 | 字符串与字节 / 拆分、分区与连接 |
| `stdtype:str.ljust` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.lower` | 正文简述 | 字符串与字节 / 大小写与 Unicode 归一 |
| `stdtype:str.lstrip` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.maketrans` | 正文简述 | 字符串与字节 / 替换与翻译 |
| `stdtype:str.partition` | 正文简述 | 字符串与字节 / 拆分、分区与连接 |
| `stdtype:str.removeprefix` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.removesuffix` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.replace` | 核心详解 | 字符串与字节 / 替换与翻译 |
| `stdtype:str.rfind` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.rindex` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.rjust` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.rpartition` | 正文简述 | 字符串与字节 / 拆分、分区与连接 |
| `stdtype:str.rsplit` | 正文简述 | 字符串与字节 / 拆分、分区与连接 |
| `stdtype:str.rstrip` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.split` | 核心详解 | 字符串与字节 / 拆分、分区与连接 |
| `stdtype:str.splitlines` | 正文简述 | 字符串与字节 / 拆分、分区与连接 |
| `stdtype:str.startswith` | 正文简述 | 字符串与字节 / 搜索、计数与判定 |
| `stdtype:str.strip` | 核心详解 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:str.swapcase` | 正文简述 | 字符串与字节 / 大小写与 Unicode 归一 |
| `stdtype:str.title` | 正文简述 | 字符串与字节 / 大小写与 Unicode 归一 |
| `stdtype:str.translate` | 正文简述 | 字符串与字节 / 替换与翻译 |
| `stdtype:str.upper` | 正文简述 | 字符串与字节 / 大小写与 Unicode 归一 |
| `stdtype:str.zfill` | 正文简述 | 字符串与字节 / 裁剪、前后缀与填充 |
| `stdtype:bytes` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:bytes.fromhex` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:bytes.hex` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:bytearray` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:bytearray.fromhex` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:bytearray.hex` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdtype:bytes.decode` | 核心详解 | 字符串与字节 / 编码与解码边界 |
| `stdtype:bytearray.decode` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdlib:cmath` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdlib:codecs` | 正文简述 | 字符串与字节 / 编码与解码边界 |
| `stdlib:decimal` | 核心详解 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdlib:fractions` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdlib:math` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdlib:numbers` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdlib:operator` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdlib:random` | 正文简述 | 数字与运算 / 整数、浮点数与 Decimal |
| `stdlib:string` | 正文简述 | 字符串与字节 / 格式化方法族 |
| `stdlib:string.templatelib` | 正文简述 | 字符串与字节 / f-string 与 3.14 t-string 识别 |
| `stdlib:unicodedata` | 正文简述 | 字符串与字节 / Unicode 字符串 |

## 章节计划

- H2：名称与对象
  - H3：绑定而非盒子
  - H3：标识符、字面量与词法边界
  - H3：类型、值与身份
  - H3：赋值与重新绑定
- H2：身份与相等
  - H3：is 与 ==
  - H3：值比较与类型边界
  - H3：驻留的实现边界
- H2：可变性
  - H3：可变与不可变对象
  - H3：别名与共享引用
  - H3：增量赋值的差异
  - H3：del 的解绑与容器删除
- H2：数字与运算
  - H3：整数、浮点数与 Decimal
  - H3：整除、取模与负数
  - H3：布尔运算与短路求值
  - H3：表达式求值顺序与优先级
- H2：字符串与字节
  - H3：Unicode 字符串
  - H3：转义与原始字符串
  - H3：编码与解码边界
  - H3：大小写与 Unicode 归一
  - H3：裁剪、前后缀与填充
  - H3：搜索、计数与判定
  - H3：拆分、分区与连接
  - H3：替换与翻译
  - H3：格式化方法族
  - H3：f-string 与 3.14 t-string 识别
  - H3：3.13 与 3.14 字节接口门控
- H2：对象实验
  - H3：引用图验证
  - H3：跨运行方式验证驻留假设
- H2：结果验证
- H2：常见问题
- H2：参考资料

## 验证方式

- 贯穿案例与完整示例：run a matrix of literals, raw strings, dynamically created strings, `Decimal`, boolean/conditional expressions, augmented assignment, and built-in cross-type comparisons; verify evaluation order and compare string method families without defining classes or listing every mirrored bytes/bytearray method. Custom `__eq__` implementation is deferred to Python(七).
- 失败边界与踩坑：`id()` is only unique during an object's lifetime; CPython string interning is not a contract; raw strings still have terminal-backslash constraints; binary floating point is not decimal arithmetic; t-strings and changed bytes inputs are version-gated.
- FAQ 候选与来源：Programming FAQ on floor division, string modification, Unicode errors, raw strings, object IDs, and identity tests; Design FAQ on floating point and immutable strings.
- 自测与闪卡计划：
  - `python-object-is-eq` priority 1: `is` versus `==`.
    - `python-object-mutability` priority 1: mutable versus immutable and augmented assignment.
    - `python-object-binding` priority 1: assignment and argument binding.
    - `python-object-float` priority 2: floating-point precision.
- 可视化：object/reference graph and exact comparison table for binding, mutation, equality, and identity.
- 主要参考资料：Language reference lexical analysis, expressions, data model, built-in types, Decimal and Programming/Design FAQ.

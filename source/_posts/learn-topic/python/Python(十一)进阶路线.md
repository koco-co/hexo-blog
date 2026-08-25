---
title: Python(十一)进阶路线
tags:
  - Python
  - 系统学习
categories:
  - Learn Topic
  - Python
description: 为描述符、元类、执行内部、导入扩展、打包分发、多解释器和旧接口迁移建立可选进阶入口。
cover: /img/picgo-images/python-course-cover.png
series: Python
series_order: 11
published: false
abbrlink: a99f76bc
date: 2026-08-25 13:13:45
---

<!-- learn-topic-placeholder -->

{% course_series %}

> 本文是已确认课程中的未发布占位文章；以下内容固定写作边界，不代表正文已经完成。

## 本文职责

- 唯一问题：index low-frequency language internals, removed-interface migrations, packaging/distribution, and specialist standard-library directions without making the core project depend on them.
- 学习成果：reader can decide which advanced branch is relevant and identify current replacements for removed standard-library modules.
- 前置文章：Python(十)内存、并发与性能.
- 复用或新建依据：new optional article.

| 稳定标识 | 处置 | 目标章节 |
| --- | --- | --- |
| `langref:datamodel#internal-types` | 进阶路线 | 专项标准库地图 |
| `langref:datamodel#code-objects` | 进阶路线 | 编译与执行内部 |
| `langref:datamodel#index-64` | 进阶路线 | 编译与执行内部 / 反射与审计边界 |
| `langref:datamodel#methods-on-code-objects` | 进阶路线 | 编译与执行内部 |
| `langref:datamodel#frame-objects` | 进阶路线 | 编译与执行内部 |
| `langref:datamodel#index-70` | 进阶路线 | 编译与执行内部 / 反射与审计边界 |
| `langref:datamodel#index-71` | 进阶路线 | 编译与执行内部 / 反射与审计边界 |
| `langref:datamodel#frame-object-methods` | 进阶路线 | 编译与执行内部 |
| `langref:datamodel#traceback-objects` | 进阶路线 | 编译与执行内部 |
| `langref:datamodel#customizing-module-attribute-access` | 进阶路线 | 属性协议 |
| `langref:datamodel#implementing-descriptors` | 进阶路线 | 属性协议 |
| `langref:datamodel#invoking-descriptors` | 进阶路线 | 属性协议 |
| `langref:datamodel#slots` | 进阶路线 | 属性协议 |
| `langref:datamodel#customizing-class-creation` | 进阶路线 | 类创建机制 |
| `langref:datamodel#metaclasses` | 进阶路线 | 类创建机制 |
| `langref:datamodel#resolving-mro-entries` | 进阶路线 | 专项标准库地图 |
| `langref:datamodel#determining-the-appropriate-metaclass` | 进阶路线 | 类创建机制 |
| `langref:datamodel#preparing-the-class-namespace` | 进阶路线 | 专项标准库地图 |
| `langref:datamodel#executing-the-class-body` | 进阶路线 | 类创建机制 |
| `langref:datamodel#creating-the-class-object` | 进阶路线 | 类创建机制 |
| `langref:datamodel#uses-for-metaclasses` | 进阶路线 | 类创建机制 |
| `langref:datamodel#customizing-instance-and-subclass-checks` | 进阶路线 | 专项标准库地图 |
| `langref:datamodel#emulating-generic-types` | 进阶路线 | 类创建机制 |
| `langref:datamodel#the-purpose-of-class-getitem` | 进阶路线 | 类创建机制 |
| `langref:datamodel#class-getitem-versus-getitem` | 进阶路线 | 类创建机制 |
| `langref:datamodel#emulating-buffer-types` | 进阶路线 | 专项标准库地图 |
| `langref:import#finders-and-loaders` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#import-hooks` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#the-meta-path` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#loaders` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#module-specs` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#module-reprs` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#cached-bytecode-invalidation` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#the-path-based-finder` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:import#path-entry-finders` | 进阶路线 | 导入扩展 / ZIP 与自定义入口 |
| `langref:import#path-entry-finder-protocol` | 进阶路线 | 导入扩展 / ZIP 与自定义入口 |
| `langref:import#replacing-the-standard-import-system` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `langref:grammar#full-grammar-specification` | 进阶路线 | 专项标准库地图 |
| `builtin:compile` | 进阶路线 | 编译与执行内部 |
| `builtin:eval` | 进阶路线 | 编译与执行内部 |
| `builtin:exec` | 进阶路线 | 编译与执行内部 |
| `builtin:globals` | 进阶路线 | 编译与执行内部 |
| `builtin:locals` | 进阶路线 | 编译与执行内部 |
| `builtin:import__` | 进阶路线 | 导入扩展 / importlib |
| `stdtype:bytearray.resize` | 进阶路线 | 属性协议 |
| `stdtype:bytes.count` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.count` | 进阶路线 | 属性协议 |
| `stdtype:bytes.removeprefix` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.removeprefix` | 进阶路线 | 属性协议 |
| `stdtype:bytes.removesuffix` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.removesuffix` | 进阶路线 | 属性协议 |
| `stdtype:bytes.endswith` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.endswith` | 进阶路线 | 属性协议 |
| `stdtype:bytes.find` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.find` | 进阶路线 | 属性协议 |
| `stdtype:bytes.index` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.index` | 进阶路线 | 属性协议 |
| `stdtype:bytes.join` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.join` | 进阶路线 | 属性协议 |
| `stdtype:bytes.maketrans` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.maketrans` | 进阶路线 | 属性协议 |
| `stdtype:bytes.partition` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.partition` | 进阶路线 | 属性协议 |
| `stdtype:bytes.replace` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.replace` | 进阶路线 | 属性协议 |
| `stdtype:bytes.rfind` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.rfind` | 进阶路线 | 属性协议 |
| `stdtype:bytes.rindex` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.rindex` | 进阶路线 | 属性协议 |
| `stdtype:bytes.rpartition` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.rpartition` | 进阶路线 | 属性协议 |
| `stdtype:bytes.startswith` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.startswith` | 进阶路线 | 属性协议 |
| `stdtype:bytes.translate` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.translate` | 进阶路线 | 属性协议 |
| `stdtype:bytes.center` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.center` | 进阶路线 | 属性协议 |
| `stdtype:bytes.ljust` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.ljust` | 进阶路线 | 属性协议 |
| `stdtype:bytes.lstrip` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.lstrip` | 进阶路线 | 属性协议 |
| `stdtype:bytes.rjust` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.rjust` | 进阶路线 | 属性协议 |
| `stdtype:bytes.rsplit` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.rsplit` | 进阶路线 | 属性协议 |
| `stdtype:bytes.rstrip` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.rstrip` | 进阶路线 | 属性协议 |
| `stdtype:bytes.split` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.split` | 进阶路线 | 属性协议 |
| `stdtype:bytes.strip` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.strip` | 进阶路线 | 属性协议 |
| `stdtype:bytes.capitalize` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.capitalize` | 进阶路线 | 属性协议 |
| `stdtype:bytes.expandtabs` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.expandtabs` | 进阶路线 | 属性协议 |
| `stdtype:bytes.isalnum` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.isalnum` | 进阶路线 | 属性协议 |
| `stdtype:bytes.isalpha` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.isalpha` | 进阶路线 | 属性协议 |
| `stdtype:bytes.isascii` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.isascii` | 进阶路线 | 属性协议 |
| `stdtype:bytes.isdigit` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.isdigit` | 进阶路线 | 属性协议 |
| `stdtype:bytes.islower` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.islower` | 进阶路线 | 属性协议 |
| `stdtype:bytes.isspace` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.isspace` | 进阶路线 | 属性协议 |
| `stdtype:bytes.istitle` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.istitle` | 进阶路线 | 属性协议 |
| `stdtype:bytes.isupper` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.isupper` | 进阶路线 | 属性协议 |
| `stdtype:bytes.lower` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.lower` | 进阶路线 | 属性协议 |
| `stdtype:bytes.splitlines` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.splitlines` | 进阶路线 | 属性协议 |
| `stdtype:bytes.swapcase` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.swapcase` | 进阶路线 | 属性协议 |
| `stdtype:bytes.title` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.title` | 进阶路线 | 属性协议 |
| `stdtype:bytes.upper` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.upper` | 进阶路线 | 属性协议 |
| `stdtype:bytes.zfill` | 进阶路线 | 属性协议 |
| `stdtype:bytearray.zfill` | 进阶路线 | 属性协议 |
| `stdtype:memoryview` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.__eq__` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.tobytes` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.hex` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.tolist` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.toreadonly` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.release` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.cast` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.count` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.index` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.obj` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.nbytes` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.readonly` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.format` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.itemsize` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.ndim` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.shape` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.strides` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.suboffsets` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.c_contiguous` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.f_contiguous` | 进阶路线 | 属性协议 |
| `stdtype:memoryview.contiguous` | 进阶路线 | 属性协议 |
| `stdlib:ast` | 进阶路线 | 编译与执行内部 |
| `stdlib:code` | 进阶路线 | 专项标准库地图 |
| `stdlib:codeop` | 进阶路线 | 专项标准库地图 |
| `stdlib:compileall` | 进阶路线 | 编译与执行内部 |
| `stdlib:concurrent.interpreters` | 进阶路线 | 多解释器与自由线程 |
| `stdlib:copyreg` | 进阶路线 | 专项标准库地图 |
| `stdlib:ctypes` | 进阶路线 | 专项标准库地图 |
| `stdlib:dis` | 进阶路线 | 编译与执行内部 |
| `stdlib:graphlib` | 进阶路线 | 专项标准库地图 |
| `stdlib:hashlib` | 正文简述 | 旧接口迁移 / crypt 迁移的用途分支 |
| `stdlib:importlib.abc` | 进阶路线 | 导入扩展 / importlib |
| `stdlib:importlib.machinery` | 进阶路线 | 导入扩展 / importlib |
| `stdlib:importlib.metadata` | 进阶路线 | 打包与分发 |
| `stdlib:importlib.resources` | 进阶路线 | 导入扩展 / importlib |
| `stdlib:importlib.resources.abc` | 进阶路线 | 导入扩展 / importlib |
| `stdlib:importlib.util` | 进阶路线 | 导入扩展 / importlib |
| `stdlib:marshal` | 进阶路线 | 编译与执行内部 |
| `stdlib:modulefinder` | 进阶路线 | 导入扩展 / 查找器与加载器 |
| `stdlib:optparse` | 弃用迁移 | 旧接口迁移 |
| `stdlib:pickletools` | 进阶路线 | 专项标准库地图 |
| `stdlib:py_compile` | 进阶路线 | 编译与执行内部 |
| `stdlib:shelve` | 进阶路线 | 专项标准库地图 |
| `stdlib:symtable` | 进阶路线 | 编译与执行内部 |
| `stdlib:sys.monitoring` | 进阶路线 | 编译与执行内部 |
| `stdlib:token` | 进阶路线 | 编译与执行内部 |
| `stdlib:tokenize` | 进阶路线 | 编译与执行内部 |
| `stdlib:tomllib` | 进阶路线 | 打包与分发 |
| `stdlib:zipapp` | 进阶路线 | 打包与分发 |
| `stdlib:zipimport` | 进阶路线 | 导入扩展 / ZIP 与自定义入口 |
| `legacy-stdlib:aifc` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:asynchat` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:asyncore` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:audioop` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:cgi` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:cgitb` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:chunk` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:crypt` | 弃用迁移 | 旧接口迁移 / crypt 迁移的用途分支 |
| `legacy-stdlib:distutils` | 弃用迁移 | 旧接口迁移 / distutils 与 imp |
| `legacy-stdlib:imghdr` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:imp` | 弃用迁移 | 旧接口迁移 / distutils 与 imp |
| `legacy-stdlib:mailcap` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:msilib` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:nis` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:nntplib` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:ossaudiodev` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:pipes` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:smtpd` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:sndhdr` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:spwd` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:sunau` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:telnetlib` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:uu` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |
| `legacy-stdlib:xdrlib` | 弃用迁移 | 旧接口迁移 / PEP 594 移除模块 |

## 正文大纲

- H2：属性协议
  - H3：描述符
  - H3：__slots__
  - H3：动态属性
  - H3：缓冲区协议与 memoryview
  - H3：低频 bytes 与 bytearray 镜像方法族
- H2：类创建机制
  - H3：__new__
  - H3：元类
  - H3：类装饰器与 __init_subclass__
- H2：编译与执行内部
  - H3：AST
  - H3：符号表与字节码
  - H3：反射与审计边界
- H2：导入扩展
  - H3：importlib
  - H3：查找器与加载器
  - H3：ZIP 与自定义入口
- H2：多解释器与自由线程
  - H3：InterpreterPoolExecutor
  - H3：扩展兼容性
  - H3：进入条件
- H2：打包与分发
  - H3：pyproject.toml
  - H3：wheel 与 sdist
  - H3：现有工具链文章
- H2：旧接口迁移
  - H3：PEP 594 移除模块
  - H3：distutils 与 imp
  - H3：getopt、optparse 与 argparse
  - H3：crypt 迁移的用途分支
  - H3：替代项与无等价迁移
- H2：专项标准库地图
- H2：常见问题
- H2：参考资料

## 内容计划

- 贯穿案例与完整示例：inspect a small function's AST and bytecode, demonstrate a descriptor, then read an old `imp`/`distutils` snippet and plan migration without publishing packages.
- 失败边界与踩坑：metaclasses/descriptors are not default application architecture; bytecode is implementation/version dependent; advanced `memoryview` capabilities are not expanded in the foundations article; `concurrent.interpreters` and related 3.14 modules require explicit version checks; removed modules may lack equivalent stdlib replacements; for removed `crypt`, `hashlib` is only a general-digest branch, `legacycrypt` is compatibility, and `bcrypt`/`argon2-cffi` are password-hashing branches rather than interchangeable substitutes.
- FAQ 候选与来源：official data model and removed-module pages; PEP 594; PyPA packaging FAQ/specs.
- 自测与闪卡计划：
  - `python-advanced-descriptor` priority 3.
    - `python-advanced-metaclass` priority 3.
    - `python-advanced-slots` priority 3.
- 可视化：advanced branch decision tree and old-to-current migration table.
- 主要参考资料：data model, `ast`, `dis`, `symtable`, `importlib`, `concurrent.interpreters`, PyPA specifications, PEP 594 and each removed-module page.

## 常见问题

待正文阶段按主题编写；需要长期复习的问答优先使用带稳定 ID 和优先级的 flashcard。

## 参考资料

待正文阶段按正文出现顺序补齐官方资料卡片。

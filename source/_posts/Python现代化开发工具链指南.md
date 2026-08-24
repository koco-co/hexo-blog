---
title: Python 现代化开发工具链指南
tags:
  - Python
  - uv
  - Ruff
  - Pyright
  - pre-commit
  - rich
  - 工具链
categories:
  - Python
  - 开发工具
description: 介绍构建现代化 Python 开发环境的核心工具链，涵盖 uv 包管理器、Ruff 代码检查、Pyright 类型检测、pre-commit 钩子、rich 终端美化等工具的安装配置和最佳实践。
abbrlink: 7af74e55
cover: /img/picgo-images/python-tools.png
date: 2026-02-09
---

## 概述

本文档介绍构建现代化 Python 开发环境的核心工具链，涵盖从包管理、代码质量检查到类型检测的完整工作流。这些工具能够显著提升开发效率、代码质量和团队协作体验。

{% note success %}
**核心工具**:

- **uv**: 极速 Python 包管理器，替代 pip 和 pip-tools
- **Ruff**: 用 Rust 编写的 Linter 和 Formatter，替代 Flake8/Black/isort
- **Pyright**: 微软开发的静态类型检查器，比 mypy 更快更强
- **pre-commit**: Git 钩子管理框架，自动化代码质量检查
- **rich**: 终端美化库，让 CLI 应用更加专业
  {% endnote %}

## IDE 配置

### VSCode 及插件推荐

{% btn 'https://code.visualstudio.com/',VSCode 下载, fab fa-windows, outline blue %}

**推荐插件**:

- Chinese (中文语言包)
- Dracula Official (主题)
- Material Icon Theme (图标)
- Path Intellisense (路径自动补全)
- Prettier (代码格式化)
- Python (Microsoft 官方)
- Python Debugger (调试器)

{% note warning %}
**配置建议**: 取消 "Auto Save" 选项，避免意外保存
{% endnote %}

## 包管理：uv

### 简介

`uv` 是由 Astral 公司（Ruff 的开发者）推出的**极速 Python 包管理器**，用 Rust 编写，旨在替代 pip、pip-tools、pipx 等传统工具。

{% folding green, ⚡ uv 核心优势 %}

- **极致速度**: 比 pip 快 10-100 倍
- **统一工具链**: 整合 venv、pip、pip-tools、pipx 功能
- **全局缓存**: 所有项目共享，避免重复下载
- **高性能解析器**: 并行获取元数据，快速解决依赖冲突
  {% endfolding %}

### 安装

{% tabs uv 安装方式, fas fa-download %}

<!-- tab macOS / Linux @fab fa-apple -->

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

<!-- endtab -->

<!-- tab Windows @fab fa-windows -->

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

<!-- endtab -->

<!-- tab pip @fas fa-box -->

```bash
pip install uv
```

<!-- endtab -->

{% endtabs %}

### 常用操作

| 操作             | 命令                                                 | 说明                                            |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------- |
| 创建虚拟环境     | `uv venv`                                            | 在当前目录创建 .venv                            |
| 指定 Python 版本 | `uv venv -p 3.11`                                    | 使用特定版本创建环境                            |
| 激活环境         | `source .venv/bin/activate`                          | macOS/Linux (Windows: `.venv\Scripts\activate`) |
| 初始化项目       | `uv init`                                            | 创建 pyproject.toml                             |
| 安装包           | `uv pip install <package>`                           | 安装到当前环境                                  |
| 添加项目依赖     | `uv add <package>`                                   | 添加到 pyproject.toml                           |
| 同步环境         | `uv sync`                                            | 根据 lock 文件安装依赖                          |
| 生成依赖文件     | `uv pip freeze > requirements.txt`                   | 导出精确版本列表                                |
| 锁定依赖         | `uv pip compile requirements.in -o requirements.txt` | 生成锁定文件                                    |
| 运行命令         | `uv run <command>`                                   | 自动激活环境并运行                              |
| 安装全局工具     | `uv tool install <package>`                          | 替代 pipx                                       |

### 项目配置示例

{% tabs 项目配置, fas fa-code %}

<!-- tab pyproject.toml @fas fa-file-code -->

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "A modern Python project"
requires-python = ">=3.10"
dependencies = [
    "httpx",
    "rich>=13.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest",
    "ruff",
    "pyright",
]
```

<!-- endtab -->

<!-- tab 使用流程 @fas fa-terminal -->

```bash
# 1. 创建项目
mkdir my-project && cd my-project

# 2. 初始化 uv 项目
uv init

# 3. 创建虚拟环境
uv venv

# 4. 激活环境
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 5. 添加依赖
uv add httpx rich

# 6. 添加开发依赖
uv add --dev pytest ruff

# 7. 同步环境 (团队成员使用)
uv sync
```

<!-- endtab -->

{% endtabs %}

### 进阶功能

{% folding yellow, 🔧 依赖锁定 %}

```bash
# 从 requirements.in 生成锁定文件
uv pip compile requirements.in -o requirements.txt

# 根据锁定文件同步环境
uv pip sync requirements.txt
```

{% endfolding %}

{% folding yellow, 🔧 全局工具管理 %}

```bash
# 安装全局工具
uv tool install ruff
uv tool install black --python 3.11

# 列出已安装工具
uv tool list

# 运行工具
uv tool run ruff check .

# 卸载工具
uv tool uninstall ruff
```

{% endfolding %}

### uv vs conda 对比

| 特性           | uv                 | conda                |
| -------------- | ------------------ | -------------------- |
| 速度           | 极快               | 慢                   |
| 生态           | PyPI (Python 优先) | conda-forge (跨语言) |
| 非 Python 依赖 | 不支持             | 原生支持             |
| CUDA/MKL 优化  | 依赖系统           | 内置支持             |
| 适用场景       | 大多数 Python 项目 | 科学计算重依赖项目   |

{% note info %}
**趋势**: 随着 uv、pixi 等工具的出现，纯 Python 项目正在快速转向 uv，而 conda 仍主导需要非 Python 依赖的科学计算场景。
{% endnote %}

### 最佳实践

{% folding green, ✅ 最佳实践 %}

1. **声明式依赖管理**: 在 `pyproject.toml` 中声明直接依赖
2. **锁定依赖版本**: 使用 `uv pip compile` 生成锁定文件
3. **环境同步**: 使用 `uv sync` 确保环境一致性
4. **团队协作**: 将 `requirements.txt` 或 `uv.lock` 提交到 Git
5. **避免提交虚拟环境**: 将 `.venv` 加入 `.gitignore`
   {% endfolding %}

## 代码质量：Ruff

### 简介

**Ruff** 是一个用 Rust 编写的**极速 Python Linter 和 Formatter**，旨在替代 Flake8、Black、isort、pyupgrade 等一众传统工具。

{% folding blue, ⚡ Ruff 核心特点 %}

- **极致性能**: 比传统工具快 10-100 倍
- **一体化**: 整合 Linting、Formatting、Import Sorting、语法升级
- **自动修复**: 大量规则支持 `--fix` 自动修复
- **兼容性**: 规则代码与传统工具保持一致，方便迁移
  {% endfolding %}

### 安装

```bash
# 使用 pip
pip install ruff

# 使用 uv
uv pip install ruff

# 使用 uv 作为全局工具
uv tool install ruff
```

### 常用操作

| 任务            | 命令                                  |
| --------------- | ------------------------------------- |
| 格式化代码      | `ruff format .`                       |
| 检查并自动修复  | `ruff check . --fix`                  |
| 仅检查不修改    | `ruff check .`                        |
| 格式化检查 (CI) | `ruff format . --check`               |
| 查看规则说明    | `ruff rule <RULE_CODE>`               |
| 清理缓存        | `ruff cache clean`                    |
| 终极清理        | `ruff format . && ruff check . --fix` |

### 配置文件

```toml
[tool.ruff]
# 目标 Python 版本
target-version = "py310"

# 行长
line-length = 88

# 启用预览功能 (类型感知 lint、新规则)
preview = true

# 自动修复 (不包含可能改变语义的修复)
fix = true
unsafe-fixes = false

# 忽略的路径
extend-exclude = [
    ".git",
    "__pycache__",
    "venv",
    ".venv",
    "build",
    "dist",
]

[tool.ruff.lint]
# 启用的规则集
select = [
    "E",   # pycodestyle 错误
    "W",   # pycodestyle 警告
    "F",   # pyflakes
    "I",   # isort
    "UP",  # pyupgrade
    "C4",  # comprehensions
    "TID", # tidy imports
    "ARG", # unused args
    "PTH", # pathlib over os.path
]

# 忽略的规则
ignore = [
    "E501",  # 行长交给 formatter 处理
]

# 每文件忽略规则
[[tool.ruff.lint.per-file-ignores]]
"tests/**.py" = ["S101", "ARG"]  # 允许 assert、忽略未使用参数
"scripts/*.py" = ["T20"]         # 允许 print

[tool.ruff.lint.isort]
known-first-party = ["my_project"]
combine-as-imports = true
force-sort-within-sections = true

[tool.ruff.format]
# 使用单引号
quote-style = "single"
# 缩进宽度
indent-width = 4
# 行长与 lint 一致
line-length = 88
```

### 规则集说明

Ruff 使用规则代码前缀来分类规则，兼容传统工具：

- **E/W**: pycodestyle (代码风格)
- **F**: pyflakes (逻辑错误)
- **I**: isort (导入排序)
- **UP**: pyupgrade (语法升级)
- **D**: pydocstyle (文档字符串)
- **N**: pep8-naming (命名规范)
- **PTH**: 使用 pathlib 替代 os.path
- **PL**: pylint 子集
- **RUF**: Ruff 特定规则

### 进阶功能

{% folding cyan, 🔍 预览模式 %}

```bash
# 命令行启用
ruff check --preview .
ruff format --preview .
```

```toml
# 配置文件启用
[tool.ruff]
preview = true
```

{% endfolding %}

{% folding cyan, 🔍 类型感知 Lint %}
Ruff 在预览模式下支持轻量级类型推断：

- **RUF014**: 冗余的 `isinstance(x, str)` (当 `x: str` 已知)
- **RUF015**: 无效的 `assert isinstance(...)` (类型已确定)

{% note warning %}
**注意**: Ruff 不替代 mypy/Pyright，仅用类型信息增强 lint 规则。建议搭配 Pyright 做完整类型检查。
{% endnote %}
{% endfolding %}

{% folding cyan, 🔍 细粒度控制 %}

```python
# 行内忽略
x = 1  # noqa: E741
print("debug")  # noqa: T201, T203

# 文件级忽略
[[tool.ruff.lint.per-file-ignores]]
"tests/**.py" = ["S101", "D"]
```

{% endfolding %}

{% folding cyan, 🔍 VS Code 集成 %}

```json
{
  "python.linting.enabled": false,
  "ruff.enable": true,
  "ruff.args": ["--preview"],
  "editor.formatOnSave": true,
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  }
}
```

{% endfolding %}

### 最佳实践

{% folding green, ✅ 最佳实践 %}

1. **统一配置**: 将所有配置集中在 `pyproject.toml`
2. **明确目标版本**: 设置 `target-version` 避免不必要的规则
3. **稳健起步**: 从 `E`, `F`, `I`, `UP` 规则集开始
4. **拥抱自动修复**: 将 `ruff check . --fix` 作为常规操作
5. **CI/CD 集成**: 使用 `ruff check --output-format=github`
   {% endfolding %}

**e.g. GitHub Actions 示例**:

```yaml
- name: Run Ruff
  run: |
    ruff check . --output-format=github
    ruff format . --check
```

## 类型检查：Pyright

### 简介

**Pyright** 是由微软开发的**静态类型检查器**，用 TypeScript 编写，集成在 VS Code 的 Pylance 插件中。

{% folding purple, 🎯 Pyright 核心优势 %}

- **极快速度**: 增量分析比 mypy 快数倍
- **智能推断**: 能根据上下文自动推导类型
- **strict mode**: 强制类型标注，避免漏网之鱼
- **跨平台**: 支持 CLI 和 VS Code 集成
  {% endfolding %}

### 安装

{% tabs Pyright 安装, fas fa-download %}

<!-- tab npm (推荐) @fab fa-npm -->

```bash
npm install -g pyright
```

<!-- endtab -->

<!-- tab pip @fas fa-box -->

```bash
pip install pyright
```

<!-- endtab -->

{% endtabs %}

### 配置文件

```toml
[tool.pyright]
typeCheckingMode = "strict"
pythonVersion = "3.10"
include = ["src", "tests"]
exclude = [
    "**/node_modules",
    "**/__pycache__",
    ".venv",
    "venv",
    "build",
    "dist",
]
reportMissingTypeStubs = "none"
reportUnusedImport = "warning"
reportUnusedVariable = "warning"
```

**pyrightconfig.json** (备选):

```json
{
  "include": ["src"],
  "exclude": ["tests", "build"],
  "typeCheckingMode": "strict",
  "pythonVersion": "3.10"
}
```

### 类型检查模式

| 模式         | 说明               |
| ------------ | ------------------ |
| **off**      | 禁用类型检查       |
| **basic**    | 最基本的检查       |
| **standard** | 标准检查 (默认)    |
| **strict**   | 严格模式，推荐使用 |

### 文件级指令

```python
# 启用严格模式
# pyright: strict

# 启用基本模式
# pyright: basic

# 覆盖特定规则
# pyright: strict, reportPrivateUsage=false, reportUnusedVariable=warning
```

### 常用操作

```bash
# 检查项目
pyright .

# 检查特定文件
pyright src/main.py

# 输出详细日志
pyright . --verbose
```

### Pyright vs mypy

| 特性     | Pyright              | mypy               |
| -------- | -------------------- | ------------------ |
| 性能     | 极快                 | 慢                 |
| IDE 集成 | VS Code/Pylance 完美 | PyCharm 较好       |
| 类型推断 | 更智能               | 依赖显式注解       |
| 社区生态 | 新但发展快           | 历史悠久、兼容性好 |
| 配置     | 简单                 | 灵活但复杂         |

### 最佳实践

{% folding green, ✅ 最佳实践 %}

1. **使用 strict mode**: 强制完整的类型标注
2. **配合 VS Code**: 安装 Pylance 插件获得实时反馈
3. **忽略不必要的警告**: 使用 `# type: ignore` 或配置文件
4. **CI/CD 集成**: 在 CI 中运行 `pyright` 确保代码质量
   {% endfolding %}

## Git 钩子：pre-commit

### 简介

**pre-commit** 是一个**多语言 Git 钩子管理框架**，它能够在代码提交前自动运行各种检查（Linting、Formatting、安全扫描等）。

{% folding orange, 🛡️ pre-commit 核心优势 %}

- **自动化质量保障**: 无需手动运行检查工具
- **团队一致性**: 所有开发者使用相同版本的工具
- **提前发现问题**: 在代码进入仓库前拦截问题
- **简化配置**: 新成员只需运行 `pre-commit install`
  {% endfolding %}

### 安装

```bash
# 使用 pip
pip install pre-commit

# 使用 uv
uv pip install pre-commit

# 使用 uv 作为全局工具
uv tool install pre-commit
```

### 配置文件

```yaml
# 最小 pre-commit 版本要求
minimum_pre_commit_version: "2.9.0"

repos:
  # 通用钩子
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace # 移除行尾空格
      - id: end-of-file-fixer # 文件末尾添加空行
      - id: check-yaml # 检查 YAML 语法
      - id: check-json # 检查 JSON 语法
      - id: check-toml # 检查 TOML 语法
      - id: check-added-large-files # 防止提交大文件
        args: ["--maxkb=5120"]

  # Ruff (Lint + Format)
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.5.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  # 密钥泄露检测
  - repo: https://github.com/trufflesecurity/trufflehog
    rev: v3.77.1
    hooks:
      - id: trufflehog
        name: TruffleHog - Scan for secrets

  # 本地钩子 (pyright)
  - repo: local
    hooks:
      - id: pyright
        name: pyright
        entry: pyright .
        language: system
        types: [python]
        require_serial: true
```

### 常用操作

| 操作             | 命令                         |
| ---------------- | ---------------------------- |
| 安装钩子         | `pre-commit install`         |
| 手动运行所有文件 | `pre-commit run --all-files` |
| 手动运行暂存文件 | `pre-commit run`             |
| 更新工具版本     | `pre-commit autoupdate`      |
| 清理缓存         | `pre-commit clean`           |
| 跳过检查 (谨慎)  | `git commit --no-verify`     |

### hooks 配置详解

**必需字段**:

- `repo`: 钩子仓库地址
- `rev`: 固定版本号 (避免使用分支名)
- `hooks`: 启用的钩子列表

**可选字段**:

- `args`: 传递给钩子的参数
- `files`: 正则表达式，筛选文件
- `exclude`: 正则表达式，排除文件
- `types`: 文件类型列表 (python, yaml, json 等)
- `name`: 覆盖默认显示名称
- `stages`: Git 阶段 (commit, push, merge-commit)

**e.g. 排除自动生成的文件**:

```yaml
- id: ruff
  exclude: ^(auto_generated/|migrations/).*\.py$
```

### 本地钩子

对于需要访问项目依赖的工具 (如 pyright)，使用 `repo: local`:

```yaml
- repo: local
  hooks:
    - id: pyright
      name: pyright
      entry: pyright .
      language: system
      types: [python]
      require_serial: true
```

{% note info %}
**提示**: `language: system` 告诉 pre-commit 使用当前虚拟环境，而不是创建隔离环境。
{% endnote %}

### 最佳实践

{% folding green, ✅ 最佳实践 %}

1. **固定版本号**: 使用 `v1.2.3` 而非 `main`
2. **提交配置文件**: 将 `.pre-commit-config.yaml` 加入 Git
3. **CI/CD 集成**: 使用 `pre-commit run --all-files`
4. **谨慎跳过**: `--no-verify` 仅用于紧急情况
5. **定期更新**: 运行 `pre-commit autoupdate` 保持工具最新
   {% endfolding %}

## 终端美化：rich

### 简介

**rich** 是一个用于在终端中创建**富文本和精美格式化输出**的 Python 库。

{% folding pink, 🎨 rich 核心特点 %}

- **易用性**: API 设计直观 Pythonic
- **功能强大**: 颜色、样式、表格、进度条、Markdown、语法高亮
- **跨平台**: 在 Windows/macOS/Linux 上表现良好
- **自动化**: 智能处理终端宽度和文本溢出
  {% endfolding %}

### 安装

```bash
# 使用 pip
pip install rich

# 使用 uv
uv pip install rich

# 添加到项目依赖
uv add rich
```

### 核心功能

{% folding cyan, 1. Console 对象与 print %}

```python
from rich.console import Console

console = Console()

# 彩色文本
console.print("[bold red]Hello[/bold red], World!")

# 样式标记
console.print(
    "[italic yellow]Warning:[/italic yellow] "
    "This is a [underline]warning[/underline] message."
)
```

{% endfolding %}

{% folding cyan, 2. 表格 (Table) %}

```python
from rich.console import Console
from rich.table import Table

console = Console()

table = Table(title="Star Wars Movies")

table.add_column("Date", style="dim", width=12)
table.add_column("Title")
table.add_column("Box Office", justify="right")

table.add_row("Dec 20, 2019", "Star Wars: The Rise of Skywalker", "$1,332,539,889")
table.add_row("May 25, 2018", "[red]Solo[/red]", "$393,151,347")

console.print(table)
```

{% endfolding %}

{% folding cyan, 3. 进度条 (Progress) %}

```python
from rich.progress import Progress
import time

with Progress() as progress:
    task = progress.add_task("[cyan]Processing...", total=100)

    for i in range(100):
        time.sleep(0.02)
        progress.update(task, advance=1)
```

{% endfolding %}

{% folding cyan, 4. Markdown 渲染 %}

```python
from rich.console import Console
from rich.markdown import Markdown

console = Console()

markdown = """
# Title

This is a *markdown* document.

1. Item 1
2. Item 2
"""

md = Markdown(markdown)
console.print(md)
```

{% endfolding %}

{% folding cyan, 5. 语法高亮 (Syntax) %}

```python
from rich.console import Console
from rich.syntax import Syntax

console = Console()

code = '''
def hello(name: str) -> str:
    """Greet someone."""
    return f"Hello, {name}!"
'''

syntax = Syntax(code, "python", theme="monokai", line_numbers=True)
console.print(syntax)
```

{% endfolding %}

{% folding cyan, 6. 美化 Traceback %}

```python
from rich.traceback import install

# 安装为默认处理器
install(show_locals=True)

# 现在所有异常都会被美化
def divide(a, b):
    return a / b

divide(10, 0)  # 显示美化的错误信息
```

{% endfolding %}

### 最佳实践

{% folding green, ✅ 最佳实践 %}

1. **使用 Console 对象**: 比直接导入 `print` 更灵活
2. **合理使用颜色**: 避免过度装饰
3. **进度条用于长时间任务**: 提升用户体验
4. **语法高亮用于代码**: 让输出更易读
5. **Traceback 美化**: 仅用于开发环境
   {% endfolding %}

## 完整项目配置示例

### pyproject.toml

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-project"
version = "0.1.0"
description = "A modern Python project"
requires-python = ">=3.10"
dependencies = [
    "httpx",
    "rich>=13.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest",
    "ruff",
    "pyright",
    "pre-commit",
]

[project.scripts]
my-cli = "my_package.cli:main"

# ==============================
# Ruff 配置
# ==============================
[tool.ruff]
target-version = "py310"
line-length = 88
preview = true
fix = true
unsafe-fixes = false

[tool.ruff.lint]
select = ["E", "W", "F", "I", "UP", "C4", "TID", "ARG", "PTH"]
ignore = ["E501"]

[[tool.ruff.lint.per-file-ignores]]
"tests/**.py" = ["S101", "ARG"]
"scripts/*.py" = ["T20"]

[tool.ruff.format]
quote-style = "single"
indent-width = 4

# ==============================
# Pyright 配置
# ==============================
[tool.pyright]
typeCheckingMode = "strict"
pythonVersion = "3.10"
include = ["src", "tests"]
reportMissingTypeStubs = "none"
reportUnusedImport = "warning"
reportUnusedVariable = "warning"

# ==============================
# Pytest 配置
# ==============================
[tool.pytest.ini_options]
minversion = "6.0"
addopts = "-ra -q"
testpaths = ["tests"]
```

### .pre-commit-config.yaml

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-toml
      - id: check-added-large-files
        args: ["--maxkb=5120"]

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.5.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: local
    hooks:
      - id: pyright
        name: pyright
        entry: pyright .
        language: system
        types: [python]
        require_serial: true
```

## 工作流总结

### 项目初始化

```bash
# 1. 创建项目目录
mkdir my-project && cd my-project

# 2. 初始化 Git
git init

# 3. 初始化 uv 项目
uv init

# 4. 创建虚拟环境
uv venv

# 5. 激活环境
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 6. 添加依赖
uv add httpx rich
uv add --dev pytest ruff pyright pre-commit

# 7. 安装 pre-commit 钩子
pre-commit install

# 8. 提交初始配置
git add .
git commit -m "chore: initialize project with modern tooling"
```

### 日常开发

```bash
# 1. 拉取最新代码
git pull

# 2. 同步依赖
uv sync

# 3. 开发代码...

# 4. 代码质量检查 (可选，pre-commit 会自动运行)
ruff format . && ruff check . --fix
pyright .

# 5. 运行测试
pytest

# 6. 提交代码 (pre-commit 自动运行)
git add .
git commit -m "feat: add new feature"

# 7. 推送代码
git push
```

### 团队协作

```bash
# 新成员加入项目
git clone <repo-url>
cd <project-name>
uv sync      # 安装所有依赖
pre-commit install  # 安装 Git 钩子
```

## 参考资料

{% link uv, https://github.com/astral-sh/uv, https://github.com/favicon.ico %}
{% link Ruff, https://github.com/astral-sh/ruff, https://github.com/favicon.ico %}
{% link Pyright, https://github.com/microsoft/pyright, https://github.com/favicon.ico %}

{% btn 'https://pre-commit.com/',pre-commit 官方文档, fas fa-book, outline purple %}
{% btn 'https://rich.readthedocs.io/',rich 官方文档, fas fa-palette, outline pink %}
{% btn 'https://docs.python.org/zh-cn/3.14/library/typing.html',Python 类型注解, fas fa-code, outline blue %}

## 总结

现代化 Python 开发工具链的核心优势：

{% note success %}
**核心优势**:

1. **极致性能**: Rust 编写的工具比传统工具快 10-100 倍
2. **统一配置**: 所有配置集中在 `pyproject.toml`
3. **自动化**: pre-commit 自动运行检查，减少人为错误
4. **类型安全**: Pyright strict mode 保证代码质量
5. **开发体验**: rich 让终端输出更加专业
   {% endnote %}

这些工具共同构成了一个高效、可靠、现代化的 Python 开发环境，显著提升了开发效率和代码质量。

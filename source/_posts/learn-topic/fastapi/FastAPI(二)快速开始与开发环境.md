---
title: FastAPI(二)快速开始与开发环境
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 从项目环境、依赖安装和 FastAPI CLI 开始，建立可开发、可运行、可观察的第一个 API。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 2
published: true
abbrlink: 1c968b87
date: 2026-08-26 00:00:00
---
{% course_series %}

{% note primary flat %}
本篇把“能写一段 FastAPI 代码”收束成“能从命令行启动、从 HTTP 观察、从 OpenAPI 复核”的最小闭环。先固定 Python 环境和导入边界，再比较开发启动与正常运行；最后故意制造入口、端口和可选依赖错误，让每一个失败都能回到一条可观察的证据。
{% endnote %}

## 环境边界

### Python 版本

{% note info flat %}
FastAPI 当前教程以 Python 3.10 及以上为前提。版本检查不是形式动作：类型联合、异步库和 FastAPI CLI 的依赖链都可能在旧解释器上表现不同。把检查放在创建环境之前，失败时先升级解释器，而不是在业务代码里绕过错误。
{% endnote %}

| 检查项 | 命令或选择 | 继续标准 | 失败处理 |
| --- | --- | --- | --- |
| 解释器 | `python --version` | 输出 `3.10` 或更高版本 | 切换受支持的 Python，再重新创建虚拟环境 |
| 隔离环境 | `python -m venv .venv` | `.venv` 下有独立解释器 | 删除当前环境后在项目目录重建，不把全局包当成证据 |
| 激活方式 | `source .venv/bin/activate` 或 Windows 等价命令 | `python -c "import sys; print(sys.prefix)"` 指向项目环境 | 检查终端激活状态，随后用 `python -m pip` 调用包管理器 |

### 系统安装

{% note info flat %}
包管理器只负责取得受支持的 Python 解释器；虚拟环境、FastAPI 依赖和应用入口仍由项目自己管理。下面的命令按操作系统择一参考，执行后回到上一节重新检查版本和隔离环境，不要把系统 Python 与项目环境混为一谈。
{% endnote %}

{% tabs 系统安装方式, 1 %}
<!-- tab macOS@fab fa-apple -->
```bash
brew install python
python3 --version
python3 -m venv .venv
```
<!-- endtab -->

<!-- tab Windows@fab fa-windows -->
```powershell
winget install Python.Python.3.12
python --version
python -m venv .venv
```
<!-- endtab -->

<!-- tab Debian / Ubuntu@fab fa-ubuntu -->
```bash
sudo apt update
sudo apt install python3 python3-venv
python3 --version
python3 -m venv .venv
```
<!-- endtab -->
{% endtabs %}

{% note warning flat %}
发行版、企业镜像和权限策略可能改变包名或安装命令。安装命令成功不等于项目已经可运行；仍要用虚拟环境中的 `python -m pip` 安装依赖，并用导入、启动和 HTTP 请求三层证据继续验证。
{% endnote %}

### 依赖分组

{% note info flat %}
核心包足够导入 `FastAPI`，但开发命令 `fastapi dev`、文件上传和常用服务器能力属于标准依赖组。团队要记录选择的是最小依赖还是 `standard` 额外依赖，避免“本机能跑、CI 没有 CLI”的隐性差异。
{% endnote %}

```bash
# 任选一种包管理器，下面以 pip 为例；所有命令都在项目根目录执行。
python -m pip install "fastapi[standard]"
# 不需要云 CLI 时可改用：python -m pip install "fastapi[standard-no-fastapi-cloud-cli]"
# 只需要框架核心时可改用：python -m pip install fastapi
python -c "import fastapi; print(fastapi.__version__)"
fastapi --help
```

| 安装结果 | 可以做什么 | 不能据此推断 |
| --- | --- | --- |
| `fastapi` | 导入框架并编写应用 | 一定存在 `fastapi dev` 命令 |
| `fastapi[standard]` | 使用 CLI、默认服务器和常见开发辅助 | 生产环境已经完成进程、代理和密钥配置 |
| `fastapi[standard-no-fastapi-cloud-cli]` | 使用常规 CLI/服务器但不安装云 CLI | 已经决定的部署拓扑不需要额外配置 |

{% folding open blue, 使用 uv 安装 %}
如果项目统一使用 uv，可以把同一组依赖写入项目元数据：

```bash
uv init
uv add "fastapi[standard]"
uv run fastapi dev main.py
```

`uv run` 只说明命令在 uv 管理的环境中执行；入口模块仍需要能被 Python 导入。团队若使用 pip，就把命令换成虚拟环境中的 `python`、`fastapi`，不要混用两个环境的锁定结果。
{% endfolding %}

### 类型、工具与调试

```python
from typing import Annotated
from fastapi import Query


def page_size(limit: Annotated[int, Query(ge=1, le=100)] = 20) -> int:
    return limit
```

{% note info flat %}
类型标注同时服务于编辑器补全、静态检查、运行时校验和 OpenAPI。编辑器中的 FastAPI 扩展可以发现路径操作并跳转到定义；它是开发辅助，不会替代 `python -c "from main import app"` 这样的真实导入检查。
{% endnote %}

```python
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
```

{% note warning flat %}
把服务器放进 `if __name__ == "__main__"` 后，直接运行当前文件可以在编辑器断点调试，作为模块导入时不会重复启动服务器。调试时优先复现一个请求并记录 traceback；`reload=True` 只用于开发，不能当作生产进程管理。
{% endnote %}

{% note info flat %}
官方 Full Stack FastAPI Template 是可选的项目起点，包含前后端、数据库、认证和测试等约定。采用模板前先逐项核对依赖、许可证、升级策略和部署拓扑；模板能减少脚手架时间，但不会替你理解本课程的路由、模型和事务边界。
{% endnote %}

## 创建应用

### 框架定位

{% note info flat %}
FastAPI 是 ASGI 应用层：用 Starlette 处理请求、路由和中间件，用 Pydantic 负责数据校验与 Schema，再由 OpenAPI 生成交互文档；Flask 以 WSGI 优先的轻量路由为核心，校验、文档和异步能力通常由扩展或外围组件补齐。选型应回到异步 I/O、类型契约和 OpenAPI 的实际需要，不要把未经同一负载验证的性能口号当成结论。
{% endnote %}

| 维度 | FastAPI | Flask | 判断问题 |
| --- | --- | --- | --- |
| 调用模型 | ASGI，原生支持 `async def` | WSGI 优先，异步需额外部署边界 | 主要工作负载是否包含并发 I/O |
| 输入输出 | 类型标注、Pydantic 模型和响应模型形成契约 | 由视图函数和扩展自行约定 | 是否需要自动校验与 Schema |
| 文档 | OpenAPI、Swagger UI、ReDoc 可由声明生成 | 通常需要扩展或手工维护 | 客户端是否依赖机器可读契约 |
| 生态取舍 | 适合 API-first、类型驱动服务 | 适合极简服务和成熟 WSGI 扩展 | 团队已有的中间件与运维模型是什么 |

### 应用实例

{% note primary flat %}
`FastAPI()` 实例是 ASGI 应用入口。启动器接收的是“模块:对象”字符串，例如 `main:app`；它不会替你猜测文件名，也不会把任意函数自动变成应用。先用导入命令证明对象可定位，再排查路由行为。
{% endnote %}

```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="Learning API", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

```bash
python -c "from main import app; print(app.title)"
```

{% note info flat %}
预期看到 `Learning API`。如果出现 `ModuleNotFoundError`，先确认当前目录包含 `main.py`；如果出现 `ImportError`，沿 traceback 从最底部的缺失依赖或循环导入开始修复。
{% endnote %}

### 健康接口

{% note success flat %}
健康接口刻意不访问数据库，只证明进程、路由和响应序列化已经连通。`GET /health` 应返回 HTTP 200、`application/json` 和 `{"status":"ok"}`；它不是业务可用性的完整证明，依赖检查会在生产篇单独建模。
{% endnote %}

```bash
curl -i http://127.0.0.1:8000/health
```

```text
HTTP/1.1 200 OK
content-type: application/json

{"status":"ok"}
```

## 启动应用

### 开发模式

{% note info flat %}
`fastapi dev` 面向本地迭代，默认打开自动重载和开发友好的日志。修改 `main.py` 后再次请求 `/health`，应该能观察到新响应；自动重载只适合开发，不代表多进程生产模型。
{% endnote %}

### 生产模式

{% note warning flat %}
`fastapi run` 以非开发模式启动，默认不会因为每次文件变化而重启。它仍然只是一个 ASGI 服务器进程，进程数、反向代理、健康检查和密钥注入必须由部署方案补齐。
{% endnote %}

| 命令 | 适合场景 | 观察重点 | 不应混淆 |
| --- | --- | --- | --- |
| `fastapi dev main.py` | 本地修改和调试 | 自动重载、详细日志 | 不是生产扩缩容方案 |
| `fastapi run main.py` | 预发布或单进程运行 | 稳定监听、无开发重载 | 不是完整容器交付方案 |
| `uvicorn main:app` | 已明确 ASGI 入口的手工启动 | 服务器参数和进程策略 | 不会替你发现错误模块路径 |

### 入口配置

{% note info flat %}
导入字符串的左侧是模块路径，右侧是对象名；`main:app` 与 `app.main:app` 指向不同的 Python 模块。项目配置可以固定入口，但仍要用一次命令行启动和一次 HTTP 请求证明配置没有漂移。
{% endnote %}

```toml
# pyproject.toml
[tool.fastapi]
entrypoint = "main:app"
```

```bash
fastapi dev
fastapi run
```

{% note info flat %}
若项目使用包目录，把值改成类似 `app.main:app`，同时保证包中有可导入的 `__init__.py` 或符合当前 Python 包规则的结构。配置入口返回 200 后，才算把“启动器配置”和“应用实例”连在一起。
{% endnote %}

### 显式入口

```bash
# 当自动发现不符合项目布局时，显式指定模块:对象
fastapi dev --entrypoint app.main:app
fastapi run --entrypoint app.main:app
```

{% note info flat %}
`--entrypoint` 把入口选择从“扫描当前目录”变成可审查的命令参数，适合 monorepo 或多个应用并存的项目。分别执行一次 `python -c "from app.main import app"`、启动命令和 `GET /health`；导入失败、进程未监听、响应非 200 是三种不同层级的证据，不能互相替代。
{% endnote %}

## 观察请求

### 响应验证

{% mermaid %}
flowchart LR
  A[命令启动] --> B[GET /health]
  B --> C{状态与类型}
  C -->|200 JSON| D[继续检查文档]
  C -->|失败| E[回到日志与入口]
{% endmermaid %}

{% note info flat %}
图中的四步分别回答进程是否启动、路由是否命中、响应是否满足最小契约以及失败应回到哪一层。只看到服务器打印“running”不够；HTTP 状态、媒体类型和正文要同时记录。
{% endnote %}

### 交互文档

{% note info flat %}
`/docs` 是 Swagger UI，`/redoc` 是 ReDoc，`/openapi.json` 是机器可读的 Schema。三者都来源于同一个应用声明：在 `/docs` 点击执行 `/health`，再用 `/openapi.json` 确认路径、方法和响应描述一致。
{% endnote %}

```bash
curl -s http://127.0.0.1:8000/openapi.json | python -m json.tool
curl -I http://127.0.0.1:8000/docs
curl -I http://127.0.0.1:8000/redoc
```

{% note success flat %}
成功标准是 `/openapi.json` 中出现 `GET /health`，交互文档能发起同一请求，且两边都没有把健康响应误写成字符串或 HTML。
{% endnote %}

## 常见失败

### 导入失败

{% note warning flat %}
`Error loading ASGI app` 通常指向入口字符串、模块路径或导入时异常。先执行 `python -c "from main import app"` 缩小范围，再阅读 traceback 的最后一个真实异常；不要只复制启动器的第一行摘要。
{% endnote %}

### 端口冲突

{% note warning flat %}
`Address already in use` 说明监听地址已经被另一个进程占用。开发时可以改用 `--port 8001` 验证应用，生产环境则应找到重复进程或由进程管理器统一接管，而不是无限换端口掩盖拓扑错误。
{% endnote %}

### 依赖缺失

{% note warning flat %}
如果导入框架成功但 `fastapi dev` 不存在，通常是只安装了核心包或终端没有进入同一个虚拟环境。运行 `python -m pip show fastapi`、`which fastapi`（Windows 使用等价命令）比较路径；恢复 `fastapi[standard]` 后重新运行 `fastapi --help`。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-dev-vs-run deck:"FastAPI" priority:1 tags:"CLI,运行模式" %}
--- question
`fastapi dev` 与 `fastapi run` 的运行边界是什么？
--- answer
`dev` 面向开发并启用重载，`run` 面向稳定运行且不启用开发重载；二者都需要可定位的 ASGI 入口。
--- explanation
开发模式把文件变化转换成重启事件，适合快速反馈；运行模式只负责把已确定的应用交给服务器。两者都不能替代生产拓扑：生产还要决定进程数、代理、探针、日志和密钥来源。判断时同时看启动日志和第二次 HTTP 请求，不能仅凭命令名称推断。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-asgi-entrypoint deck:"FastAPI" priority:1 tags:"ASGI,导入" %}
--- question
ASGI 入口字符串如何定位 `app` 对象？
--- answer
按 `模块路径:对象名` 导入，例如 `main:app` 表示导入 `main` 模块中的 `app` 对象。
--- explanation
启动器先按左侧模块路径执行 Python 导入，再从模块属性中取出右侧对象；任一环节失败都会在启动阶段报错。先用 `python -c "from main import app"` 验证导入，再用 `/health` 验证对象确实是可调用的 ASGI 应用。包目录变化时要同步修改入口，不要只改服务器命令。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link FastAPI First Steps, https://fastapi.tiangolo.com/tutorial/first-steps/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link FastAPI CLI, https://fastapi.tiangolo.com/fastapi-cli/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Editor Support, https://fastapi.tiangolo.com/editor-support/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Full Stack FastAPI Template, https://fastapi.tiangolo.com/project-generation/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

---
title: FastAPI(六)应用结构与生命周期
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 使用 APIRouter、配置对象、lifespan、子应用和静态或模板资源组织可维护的 FastAPI 应用。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 6
published: true
abbrlink: d0ce794d
date: 2026-08-26 00:00:00
---
{% course_series %}

{% note primary flat %}
应用规模变大后，最先失控的通常不是路由数量，而是导入方向、配置来源和资源释放。本文把一个单文件应用拆成包、路由器和 Settings，再用 lifespan 统一管理共享资源；最后比较 `include_router`、`Mount` 与 `root_path`，让“组合”不再靠复制粘贴。
{% endnote %}

## 模块边界

### 包结构

{% note info flat %}
包结构的目标是让依赖方向可读：入口组装应用，路由声明 HTTP，服务层编排业务，基础设施提供数据库或外部客户端。模块名不是架构本身，但明确边界能让导入错误在启动阶段暴露。
{% endnote %}

| 层 | 典型文件 | 可以依赖 | 不应依赖 |
| --- | --- | --- | --- |
| 入口 | `app/main.py` | 配置、路由、lifespan | 具体请求实例 |
| 路由 | `app/api/routes.py` | schema、service、依赖 | 服务器启动副作用 |
| 服务 | `app/services/tasks.py` | 仓储、领域模型 | FastAPI `Request` |
| 基础设施 | `app/infra/db.py` | SQLAlchemy、设置 | 路由模块 |

### 导入方向

{% mermaid %}
flowchart TD
  A[main.py] --> B[api.router]
  A --> C[lifespan]
  B --> D[service]
  D --> E[repository]
  E --> F[database client]
  F -.禁止反向导入.-> B
{% endmermaid %}

{% note warning flat %}
故意在基础设施模块导入路由模块时，`python -c "from app.main import app"` 应在启动阶段失败。修复顺序是移除反向导入、把共享类型放到独立模块，再重新执行导入测试；不要用延迟导入把环藏到第一次请求。
{% endnote %}

## 路由组合

### APIRouter

{% note info flat %}
`APIRouter` 是路由声明的局部容器，可以集中设置 `prefix`、`tags`、依赖和响应。它仍然属于同一个 FastAPI 应用，默认共享 OpenAPI、生命周期和异常处理器。
{% endnote %}

```python
# app/api/tasks.py
from fastapi import APIRouter

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
async def list_tasks() -> list[dict[str, str]]:
    return [{"title": "learn"}]
```

### include_router

{% note success flat %}
入口只负责一次性 `include_router`，避免在模块导入时启动数据库或读取请求数据。前缀、标签和依赖在组装点可见，`/openapi.json` 中最终只出现一套路由。
{% endnote %}

```python
# app/main.py
from fastapi import FastAPI
from app.api.tasks import router as task_router

app = FastAPI()
app.include_router(task_router)
```

## 配置管理

### Settings

{% note info flat %}
Settings 模型把环境变量转换成带类型的配置对象；把 `Settings()` 藏在依赖中可以在测试里替换，避免导入模块时就固定生产值。默认值只能用于安全的本地开发选项，密钥和数据库凭证应要求显式注入。
{% endnote %}

```python
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_")
    database_url: str = "sqlite+aiosqlite:///./app.db"
    jwt_secret: str


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

```bash
# 仅在需要环境配置或服务端模板时加入对应额外依赖
python -m pip install pydantic-settings jinja2
```

{% note info flat %}
`pydantic-settings` 和 `jinja2` 不属于只安装 `fastapi` 时必然存在的核心运行时；把它们写进项目依赖后，CI 和本地环境才会一致。若应用只提供 JSON API，可以不安装模板依赖，并在导入检查中确认没有误加载模板模块。
{% endnote %}

### 环境变量

{% note warning flat %}
环境变量名受 `env_prefix` 和字段别名影响；在启动检查中打印“已配置/缺失”而不是打印值。测试可提供短期的 `APP_JWT_SECRET=test-only`，但不能把生产密钥写进仓库、日志或闪卡。
{% endnote %}

## 生命周期

### lifespan

{% timeline 应用生命周期, blue %}
<!-- timeline 进入 -->
创建连接池、加载只读模型并记录资源状态；任一必需资源失败，应用不应宣称 ready。
<!-- endtimeline -->
<!-- timeline 服务 -->
请求共享已经准备好的资源，路由不重复初始化。
<!-- endtimeline -->
<!-- timeline 退出 -->
收到关闭信号后等待在途任务，再关闭客户端、连接池和文件句柄。
<!-- endtimeline -->
{% endtimeline %}

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.client = object()
    yield
    app.state.client = None


app = FastAPI(lifespan=lifespan)
```

```python
from fastapi.testclient import TestClient


with TestClient(app) as client:
    assert client.get("/live").status_code == 200
```

{% note success flat %}
`TestClient` 作为上下文管理器时会触发 lifespan；在上下文外直接创建客户端，不能据此断言启动和关闭钩子已执行。给 `app.state` 增加计数器并在上下文前后读取，是验证资源只初始化一次、退出时清理一次的最小实验。
{% endnote %}

### 资源状态

{% note success flat %}
把“进程活着”和“依赖可用”分开记录：`/live` 只返回进程仍能响应，`/ready` 才检查数据库或队列。资源初始化和释放各记录一次，重复计数通常意味着把全局副作用放进了路由或测试没有使用上下文管理。
{% endnote %}

## 应用组合

### Mount 与子应用

{% mermaid %}
flowchart TD
  A[主应用 /api] --> B[主 OpenAPI]
  A --> C[Mount /legacy]
  C --> D[独立 ASGI 子应用]
  D --> E[独立文档与生命周期]
{% endmermaid %}

{% note info flat %}
`include_router` 把路由并入同一应用；`Mount` 把一个 ASGI 应用挂在路径下，子应用可以有自己的中间件、OpenAPI 和生命周期。需要独立边界时才选择 Mount，不能为了分文件把普通路由拆成子应用。
{% endnote %}

```python
legacy = FastAPI(title="Legacy API")


@legacy.get("/status")
async def legacy_status() -> dict[str, str]:
    return {"service": "legacy"}


app.mount("/legacy", legacy)
```

{% note info flat %}
启动后分别请求 `/legacy/status`、`/docs` 和 `/legacy/docs`：前者命中子应用，后两者的文档归属取决于主应用与子应用各自的配置。这个对照能证明 Mount 是 ASGI 边界，而不是给当前 router 再加一个字符串前缀。
{% endnote %}

### root_path 边界

{% note info flat %}
`root_path` 描述代理在外部暴露的前缀，例如代理把应用挂到 `/api`；它影响 URL 生成和文档服务器地址，不会自动给路由字符串增加前缀。只有代理真的移除了前缀时才设置它，否则会出现 `/api/api/tasks` 一类重复路径。
{% endnote %}

| 场景 | 路由声明 | 外部 URL | 责任 |
| --- | --- | --- | --- |
| 单应用 | `/tasks` | `/tasks` | 服务器直接暴露 |
| 代理前缀 | `/tasks` + `root_path="/api"` | `/api/tasks` | 代理转发并保留前缀信息 |
| 子应用 | 子应用 `/tasks` 挂在 `/legacy` | `/legacy/tasks` | 主应用负责路径挂载 |

## 资源集成

### 静态文件

{% note info flat %}
`StaticFiles(directory="static")` 把目录映射成静态资源；它不替你做鉴权、缓存策略或路径清理。把静态文件挂载在明确前缀下，避免与 API 路由重叠，并在部署代理上检查缓存头。
{% endnote %}

```python
from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="static"), name="static")
```

### 模板与前端入口

{% note info flat %}
服务端 HTML 可以使用 `Jinja2Templates`，SPA 则通常由独立构建产物托管。两者都要把 API 前缀、静态资源 URL 和代理 `root_path` 作为配置测试，不要在模板里硬编码开发端口。
{% endnote %}

```python
from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"title": "Learning API"},
    )
```

{% note info flat %}
模板实验至少要检查模板文件存在时返回 200/`text/html`，文件缺失时启动或请求阶段的错误是否被日志记录；SPA 静态入口则另测 `StaticFiles` 和前端 fallback。不要用模板响应掩盖 API 的 JSON 响应契约。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-router-vs-mount deck:"FastAPI" priority:1 tags:"路由组合,ASGI" %}
--- question
`include_router` 与 `Mount` 的边界是什么？
--- answer
`include_router` 把路由并入同一 FastAPI 应用；`Mount` 挂载独立 ASGI 应用，通常保留独立文档、中间件或生命周期。
--- explanation
二者都能改变 URL 前缀，但所有权不同。共享认证、异常处理和 OpenAPI 时使用 `include_router`；需要隔离协议、文档或资源生命周期时才使用 `Mount`。把一个普通路由拆成子应用会增加调试和部署边界，不能只因为目录想分层就选择 Mount。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-lifespan-vs-on-event deck:"FastAPI" priority:1 tags:"生命周期,迁移" %}
--- question
`lifespan` 与旧的启动/关闭事件如何选择？
--- answer
新应用优先使用一个 `lifespan` 上下文管理器统一准备和清理；提供 `lifespan` 后，不应再依赖同一应用的旧事件处理器。
--- explanation
`lifespan` 把进入和退出放在同一段代码中，天然适合 `try/finally` 和共享资源。官方仍提供旧事件 API 以兼容历史代码，但同一应用同时声明两套会让责任不清。迁移时先把启动动作移到 `yield` 前、清理移到后面，再用上下文管理的 TestClient 观察两边各执行一次。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-settings-boundary deck:"FastAPI" priority:1 tags:"配置,环境变量" %}
--- question
为什么 Settings 应通过依赖提供，而不是在模块导入时直接创建？
--- answer
依赖提供可在测试中覆盖、延迟读取环境变量并集中校验配置；导入时创建会固定环境并增加测试顺序耦合。
--- explanation
使用 `@lru_cache` 的 Settings 依赖可以在生产请求间复用解析结果，同时在测试中映射到确定的对象。密钥字段应要求显式环境变量，日志只记录是否存在。不要把缓存误认为秘密存储：进程内内存、崩溃转储和错误日志仍需按部署边界保护。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Bigger Applications, https://fastapi.tiangolo.com/tutorial/bigger-applications/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Lifespan Events, https://fastapi.tiangolo.com/advanced/events/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Sub Applications, https://fastapi.tiangolo.com/advanced/sub-applications/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

---
title: FastAPI(七)认证授权与接口安全
tags:
  - FastAPI
  - 系统学习
categories:
  - Learn Topic
  - FastAPI
description: 实现 OAuth2 与 JWT 登录、权限作用域和多种安全方案，并处理浏览器、主机和密钥边界。
cover: /img/picgo-images/fastapi-course-cover.png
series: FastAPI
series_order: 7
published: true
abbrlink: f30a7c3d
date: 2026-06-24 00:00:00
---
{% course_series %}

{% note primary flat %}
安全链路必须把“你是谁”和“你能做什么”分开验证。本文用账号注册、密码哈希、OAuth2 Bearer、JWT、角色与 scopes 组成一条可测试的链，再把 CORS、Cookie、TrustedHost 和 HTTPS 重定向放到它们真正的浏览器与部署边界上。
{% endnote %}

## 安全链路

### 认证与授权

{% mermaid %}
flowchart TD
  A[提交凭证] --> B[校验密码哈希]
  B --> C[签发短期 token]
  C --> D[解析 subject 与 scopes]
  D --> E{资源策略允许吗}
  E -->|允许| F[执行业务]
  E -->|拒绝| G[403]
  B -->|失败| H[401 + WWW-Authenticate]
{% endmermaid %}

{% note info flat %}
认证只回答主体身份，授权再根据角色、scope、资源所有权做决定。日志中记录主体 ID 和策略结果即可，不记录密码、完整 token 或 Cookie 值。
{% endnote %}

### 威胁边界

{% note danger flat %}
密码只能保存经过慢哈希算法处理的结果；JWT 只是签名的编码，不是加密容器；浏览器跨域和 CSRF 是不同问题。任何示例都使用环境变量或测试占位值，绝不把可用密钥写进代码。
{% endnote %}

## 身份认证

### 密码哈希

{% note info flat %}
注册时调用 `hash` 保存哈希，登录时调用 `verify` 比较明文和哈希。哈希参数由库选择并随版本升级，业务代码不应自己拼接盐或使用可逆加密。
{% endnote %}

```python
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def store_password(password: str) -> str:
    return password_hash.hash(password)


def check_password(password: str, stored_hash: str) -> bool:
    return password_hash.verify(password, stored_hash)
```

### OAuth2 与 JWT

{% mermaid %}
sequenceDiagram
  participant C as Client
  participant A as API
  participant T as Token service
  C->>T: username/password form
  T->>T: verify hash
  T-->>C: signed JWT exp/sub
  C->>A: Authorization Bearer JWT
  A->>A: decode and validate exp/sub
  A-->>C: protected response or 401
{% endmermaid %}

```python
import os
from datetime import datetime, timedelta, timezone
import jwt
from typing import Annotated
from fastapi import Depends, HTTPException, Security
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm,
    SecurityScopes,
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token",
    scopes={"tasks:read": "Read tasks", "audit:read": "Read audit records"},
)
JWT_ALGORITHM = "HS256"


def issue_token(subject: str, scopes: list[str] | None = None) -> str:
    secret = os.environ["APP_JWT_SECRET"]
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "scopes": scopes or [],
        "iat": now,
        "exp": now + timedelta(minutes=15),
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


@app.post("/auth/token")
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()]) -> dict[str, str]:
    # 真实项目应从数据库读取哈希，再调用 check_password
    if form.username != "alice" or form.password != "correct-password":
        raise HTTPException(
            status_code=401,
            detail="invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "access_token": issue_token(form.username, ["tasks:read"]),
        "token_type": "bearer",
    }


async def current_user(
    security_scopes: SecurityScopes,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> str:
    try:
        payload = jwt.decode(
            token,
            os.environ["APP_JWT_SECRET"],
            algorithms=[JWT_ALGORITHM],
        )
        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise ValueError("missing sub")
        token_scopes = set(payload.get("scopes", []))
        if not set(security_scopes.scopes).issubset(token_scopes):
            raise HTTPException(
                status_code=403,
                detail="insufficient scope",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return subject
    except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=401,
            detail="invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


@app.get("/tasks")
async def protected_tasks(
    user: Annotated[str, Security(current_user, scopes=["tasks:read"])],
) -> dict[str, str]:
    return {"owner": user}


@app.get("/admin/audit")
async def admin_audit(
    user: Annotated[str, Security(current_user, scopes=["audit:read"])],
) -> dict[str, str]:
    return {"reader": user}
```

{% note info flat %}
JWT payload 可以被持有者读取，服务端必须验证签名、`exp`、`sub` 和算法。短期 access token 配合刷新策略比把长期凭证塞进浏览器更容易撤销和审计。
{% endnote %}

{% note success flat %}
最小闭环是 `POST /auth/token` 返回 Bearer token，再带 `Authorization: Bearer ...` 请求 `/tasks`；缺少或篡改 token 预期 401，scope 不足预期 403。`OAuth2PasswordRequestForm` 需要表单解析依赖，登录接口不能把 JSON 示例误当成 OAuth2 表单。
{% endnote %}

## 权限授权

### 角色权限

{% note info flat %}
角色是业务语义，scope 是 OAuth2 令牌中的细粒度权限。依赖可以先解析当前主体，再检查角色或 scope；普通用户和管理员应分别测试拒绝、允许以及共享业务能力不受影响。
{% endnote %}

| 端点 | user | admin | 失败响应 |
| --- | --- | --- | --- |
| `GET /tasks` | 允许自己的任务 | 允许 | 401/403 按认证阶段区分 |
| `GET /admin/audit` | 拒绝 | 允许 | 403 且不返回审计数据 |
| `DELETE /tasks/{id}` | 仅所有者 | 允许 | 403 或 404，避免越权泄露存在性 |

### OAuth2 scopes

{% mermaid %}
flowchart TD
  A[Bearer token] --> B[SecurityScopes.scopes]
  B --> C{token scopes 包含要求吗}
  C -->|是| D[继续资源检查]
  C -->|否| E[403 insufficient scope]
{% endmermaid %}

{% note info flat %}
scope 名称会进入 OpenAPI，但文档声明不等于运行时授权。`Security` 依赖要读取 `SecurityScopes`，并在缺少权限时返回稳定的 Problem 响应。
{% endnote %}

## 凭证方案

### Bearer 与 Basic

{% note info flat %}
Bearer 适合 API 令牌，客户端在 `Authorization` 头携带 token；Basic 每次请求携带可解码的用户名和密码，只能在 HTTPS 和受控场景使用。两者都不应出现在 URL 查询参数中。
{% endnote %}

```python
from fastapi.security import HTTPBasic, HTTPBasicCredentials

basic = HTTPBasic()


@app.get("/internal")
async def internal(
    credentials: Annotated[HTTPBasicCredentials, Depends(basic)],
) -> dict[str, str]:
    if credentials.username != "ops" or credentials.password != "test-only":
        raise HTTPException(status_code=401, detail="invalid basic credentials")
    return {"user": credentials.username}
```

{% note warning flat %}
用 `curl -u ops:test-only /internal` 和错误凭证各请求一次，记录 200/401 与 `WWW-Authenticate`，再在 HTTPS 终止代理后复测。Basic 的示例密码只用于本地夹具，不能直接迁移到生产配置。
{% endnote %}

| 方案 | 服务器验证 | 浏览器行为 | 典型用途 |
| --- | --- | --- | --- |
| Bearer | 签名、过期和 scope | 可由前端请求头发送 | SPA/API |
| Basic | 用户名与密码 | 浏览器可能弹出凭证框 | 内部短期保护 |

### 备用凭证

{% note warning flat %}
API key、Cookie session 或外部 OIDC 都是不同的信任边界。选择方案时先写撤销、轮换、审计和跨站策略；不要因为实现类名相近就把 API key 当成 JWT，也不要把第三方身份声明未经验证地当成本地角色。
{% endnote %}

## 浏览器边界

### CORS 凭证

{% note warning flat %}
启用 `allow_credentials=True` 时，不能用通配符 origin 表示任意可信站点；必须列出明确来源并限制方法和请求头。CORS 是浏览器发送响应的规则，不是服务器身份认证。
{% endnote %}

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.example"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
```

```bash
curl -i -X OPTIONS http://127.0.0.1:8000/tasks \
  -H 'Origin: https://frontend.example' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Authorization'
```

{% note success flat %}
预检响应应包含明确的 `access-control-allow-origin`、允许方法和允许请求头；换成未列出的 Origin 时不应得到同样的允许值。这个实验只证明浏览器策略，仍需用无 token/有效 token 请求验证服务器端 401/200。
{% endnote %}

### Cookie 与 CSRF

{% note info flat %}
Cookie 会被浏览器自动附带，因此要组合 `Secure`、`HttpOnly`、合适的 `SameSite` 和 CSRF token。把 token 放进 Cookie 并不会自动获得 CSRF 防护；Bearer 头和 Cookie 的威胁模型要分别测试。
{% endnote %}

## 部署防护

### TrustedHost

{% note warning flat %}
`TrustedHostMiddleware` 用允许列表校验 Host，防止错误 Host 参与 URL 生成或路由。代理转发前要先确认真实 Host 头来源，允许列表不应写成任意通配符。
{% endnote %}

```python
from starlette.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["api.example.com"])
```

### HTTPS Redirect

{% note danger flat %}
`HTTPSRedirectMiddleware` 会把 HTTP 重定向到 HTTPS，但它依赖代理正确传递协议并阻止重定向循环。先在终止 TLS 的代理上核对 `X-Forwarded-Proto` 信任范围，再决定是否在应用层启用。
{% endnote %}

## 常见问题

{% flashcard basic id:fastapi-0141-authn-vs-authz deck:"FastAPI" priority:1 tags:"认证,授权" %}
--- question
认证与授权为什么必须分两步？
--- answer
认证确认主体是谁，授权根据角色、scope 和资源规则决定该主体能否执行当前动作。
--- explanation
只验证 token 只能说明签发者认可这个主体，不能说明它可以读取另一个账号的任务或审计数据。先解析 subject 并校验签名/过期，再执行角色、scope 和资源所有权检查；缺少凭证通常是 401，凭证有效但权限不足是 403。把两步混成一个布尔值会让日志、OpenAPI 和错误处理都失去边界。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-401-vs-403 deck:"FastAPI" priority:1 tags:"HTTP,错误" %}
--- question
什么时候返回 401，什么时候返回 403？
--- answer
无法认证或令牌无效通常返回 401 并带 `WWW-Authenticate`；已认证但不满足角色或 scope 时返回 403。
--- explanation
401 是“请提供或修正身份凭证”，客户端可以据此重新登录；403 是“身份已知但策略拒绝”，重试同一凭证不会改变结果。实现时不要把所有安全失败都改成 404 来隐藏问题，除非资源存在性本身就是明确的防枚举策略，并在团队契约中固定它。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-jwt-not-encryption deck:"FastAPI" priority:1 tags:"JWT,密钥" %}
--- question
为什么 JWT 不能当作加密数据保存秘密？
--- answer
JWT 的常见形式是可读取的编码加签名；签名保证未被篡改，不会隐藏 payload 内容。
--- explanation
持有 token 的客户端可以解码 payload，因此只能放置非敏感的 subject、过期时间和 scope。服务器仍必须验证签名、算法和 `exp`，并把密钥放在受保护的配置来源。需要保密的数据放在服务端存储或真正的加密方案中，不能靠把字段名改得不明显来保护。
{% endflashcard %}

{% flashcard basic id:fastapi-0141-cors-credentials deck:"FastAPI" priority:1 tags:"浏览器,CORS" %}
--- question
为什么带凭证的 CORS 不能使用任意 origin？
--- answer
凭证请求必须绑定明确的可信来源；通配符会让浏览器无法安全表达“允许携带凭证的站点集合”。
--- explanation
CORS 只控制浏览器是否把响应交给页面，服务器仍要独立认证。开启 `allow_credentials` 后列出明确 origin、方法和请求头，并检查预检响应；Cookie 场景还要配合 SameSite 和 CSRF 防护。不要把 CORS 当作 API 访问控制，也不要用它替代令牌过期和撤销。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link OAuth2 and JWT, https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link Security Scopes, https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/, https://fastapi.tiangolo.com/img/favicon.png %}
{% link CORS, https://fastapi.tiangolo.com/tutorial/cors/, https://fastapi.tiangolo.com/img/favicon.png %}
{% endlinkgroup %}

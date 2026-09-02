---
title: 大模型应用开发(十)状态、Context与缓存
tags:
  - 大模型应用开发
  - 状态、Context与缓存
categories:
  - Learn Topic
  - 大模型应用开发
description: 能区分会话状态、上下文装配、输入缓存与应用输出缓存，并安全完成截断、摘要、恢复和删除。
cover: /img/picgo-images/llm-application-course-cover.png
series: 大模型应用开发
series_order: 10
published: false
abbrlink: 492665bf
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
“记住上一轮”可能来自应用保存的消息，也可能来自 Provider 的响应/交互 ID；“缓存命中”又是另一件事。本节用一个本地消息生成器比较完整历史、截断、摘要和检索，并验证稳定缓存键、会话恢复、租户隔离和隐私删除。
{% endnote %}

<!-- concept-story:start -->
一个客服会话在第十轮开始变慢。工程师把所有历史重新发送，随后又把旧消息直接截断，结果丢掉了“金额必须经过人工确认”的约束。为了加速，团队把 Provider 返回的会话 ID 当作用户权限凭据；另一租户拿到这个 ID 后，竟能恢复到同一段上下文。

正确的拆分是：应用拥有会话和授权，Provider 只提供可选的状态句柄；Context 是每次请求临时装配的输入；缓存是带版本和失效条件的性能策略。三者都需要独立的可观察记录和删除路径。
<!-- concept-story:end -->

## 会话状态

### 消息状态与会话 ID

把状态分成三类更容易设计边界：

| 状态 | 例子 | 所有者 | 主要风险 |
| --- | --- | --- | --- |
| 业务状态 | 用户、租户、订单、授权和任务阶段 | 应用数据库 | 把模型输出当成事实写回 |
| 对话状态 | 已发送消息、工具结果、摘要和版本 | 应用或 Provider | 丢历史、串租户、无法删除 |
| 请求状态 | attempt、deadline、流式 offset、幂等键 | 请求协调器 | 重试重复执行或重复显示 |

OpenAI Responses 可以用 `previous_response_id` 关联上一轮，Gemini Interactions 可以用 `previous_interaction_id` 继续对话；这些句柄只表示上下文资源，不表示当前调用者有权访问资源。应用仍应保存 `session_id → tenant/user → provider_handle` 的授权映射，并在每次恢复前检查归属。

Provider 的状态参数也可能只作用于当前请求。比如 OpenAI 文档说明，使用 `previous_response_id` 时，上一轮的 `instructions` 不会自动成为当前请求的指令；需要持续的开发者规则时，应用应在每轮显式装配，不能依赖“服务器记住了”。

### 上下文窗口

Context window 是一次请求能处理的输入和输出预算，不是永久记忆。预算至少要给输出、工具、系统约束和安全余量留空间：

```text
总预算
├── 稳定规则与角色
├── 当前任务
├── 必要历史/摘要
├── 检索片段与工具结果
└── 输出预留 + 安全余量
```

不同模型和版本的窗口、输出上限和计费方式不同；字符数除以四只能作为本地 fixture 的粗略估算，不能替代 Provider tokenizer。截断时不要只从数组头部或尾部机械删除：应优先保留当前规则、当前任务、未完成工具链和仍影响结论的事实。

## 上下文策略

### 缓存策略

| 缓存 | 缓存什么 | 键至少包含 | 失效条件 |
| --- | --- | --- | --- |
| Provider 输入缓存 | 重复的输入前缀或上下文片段 | Provider、模型/快照、稳定前缀和参数 | 前缀变化、模型变化、Provider 策略或 TTL 变化 |
| 应用输出缓存 | 一次请求的可复用最终结果 | 规范化输入、模型、Prompt 版本、工具/参数和数据版本 | 任一输入、规则、权限、数据或时效要求变化 |
| 会话恢复缓存 | 会话装配所需的摘要/索引 | 租户、会话、状态版本和删除标记 | 会话更新、租户变化、删除或过期 |

OpenAI Prompt Engineering Guide 建议把可重复内容放在输入前部以提高缓存机会，并用测试评估 Prompt 变化；这只是性能优化，不改变模型语义。应用输出缓存更要谨慎：天气、库存、权限和价格等时效数据不能因为“相同问题”就无限复用。

### 持久化、恢复与隐私删除

会话表可以采用如下逻辑关系：

| 记录 | 必要字段 | 删除要求 |
| --- | --- | --- |
| Session | `session_id`、tenant、owner、状态版本、created/updated | 删除业务状态和 Provider 句柄映射 |
| Message | role、脱敏内容、序号、Prompt 版本 | 删除正文、工具结果和索引 |
| Provider handle | Provider、opaque ID、store 策略、过期时间 | 先撤销/删除远端资源，再删本地引用 |
| Cache entry | 完整键、数据版本、过期时间、命中次数 | 按键删除，不能只删会话主表 |
| Audit event | 决策、错误、操作者和时间 | 日志脱敏，按保留政策清理 |

Gemini Interactions 当前文档将 `store=false` 与后续 `previous_interaction_id` 使用区分开来；OpenAI 和其他 Provider 的存储、保留与删除规则也会变化。不要把一个 Provider 的“默认保存”推断成另一个 Provider 的行为，应用要把 `store`、远端句柄和删除能力写进状态策略。

## 缓存边界

### 持久化、恢复与隐私删除

{% note warning flat %}
缓存命中不能绕过权限检查，摘要不能替代关键约束，Provider 句柄不能直接当作会话权限。恢复流程必须先校验租户和删除标记，再读取历史/摘要，最后重新装配当前规则；任何一步失败都应返回 `not_found`、`forbidden` 或 `stale`，而不是“尽量恢复”。
{% endnote %}

- **完整历史**：事实最全，输入成本和窗口压力最大。
- **截断**：成本低，但可能丢掉早期规则、工具结果或依赖关系。
- **摘要**：体积稳定，但摘要本身可能丢失否定条件、数值和证据；要保留摘要版本和关键事实校验。
- **检索**：只取相关片段，适合大历史；相关性错误会造成“看似有上下文、实际缺证据”。

如果一次请求同时包含摘要、检索片段和当前消息，应记录每个片段的来源版本、时间和权限范围。后续第十二篇会深入 RAG；本节只把检索当作 Context 装配策略，不把它当作检索系统实现。

## 最小实践

### 准备输入

{% note info flat %}
下列 Python 代码只在内存中生成合成消息，不安装依赖、不访问网络、不读取环境变量，也不模拟真实 Tokenizer。`estimate_tokens` 仅用于比较四种策略；缓存、会话和删除结果均为本地 fixture，不代表任一 Provider 的保留期限或线上命中率。
{% endnote %}

### 执行步骤

```python
import copy
import hashlib
import json

RULE = "库存结论只能使用已验证记录；金额变更必须人工确认。"
HISTORY = [
    {"role": "developer", "content": RULE},
    {"role": "user", "content": "客户 A-17 询问库存。"},
    {"role": "assistant", "content": "已记录待查询。"},
    {"role": "user", "content": "补充：订单金额为 120，不能自动退款。"},
    {"role": "assistant", "content": "金额变更需要人工确认。"},
]
CURRENT = {"role": "user", "content": "现在只回答 A-17 的库存状态。"}
BUDGET = 16


def estimate_tokens(messages):
    # 这是 fixture 估算，不是任何 Provider 的 tokenizer。
    return sum((len(message["content"]) + 3) // 4 for message in messages)


def full_history():
    return copy.deepcopy(HISTORY + [CURRENT])


def truncate_history():
    selected = [HISTORY[0], CURRENT]
    remaining = BUDGET - estimate_tokens(selected)
    for message in reversed(HISTORY[1:]):
        cost = estimate_tokens([message])
        if cost <= remaining:
            selected.insert(1, copy.deepcopy(message))
            remaining -= cost
    return selected


def summarize_history():
    return [
        {"role": "system", "content": "历史摘要：A-17 待查询；金额 120 的变更必须人工确认。"},
        copy.deepcopy(CURRENT),
    ]


def retrieve_history():
    return [
        {"role": "context", "content": "检索命中：A-17 待查询；金额 120 变更需人工确认。"},
        copy.deepcopy(CURRENT),
    ]


def normalize(messages):
    return [{"role": item["role"], "content": item["content"]} for item in messages]


def cache_key(provider, model, prompt_version, messages, options):
    payload = {
        "provider": provider,
        "model": model,
        "prompt_version": prompt_version,
        "messages": normalize(messages),
        "options": options,
    }
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def prefix_key(provider, model, prompt_version, messages):
    stable = {"provider": provider, "model": model, "prompt_version": prompt_version,
              "prefix": normalize(messages[:1])}
    return json.dumps(stable, ensure_ascii=False, sort_keys=True)


SESSIONS = {
    ("tenant-a", "session-001"): {
        "owner": "user-a", "provider": "openai", "handle": "resp_opaque_001",
        "deleted": False, "version": 2,
    }
}


def restore_session(tenant, session_id):
    record = SESSIONS.get((tenant, session_id))
    if record is None or record["deleted"]:
        raise ValueError("not_found")
    return {"provider": record["provider"], "handle": record["handle"], "version": record["version"]}


def delete_session(tenant, session_id):
    record = SESSIONS.get((tenant, session_id))
    if record is None:
        raise ValueError("not_found")
    record["deleted"] = True
    record["handle"] = None
    return "deleted"


def cross_tenant_restore(tenant, session_id):
    if (tenant, session_id) not in SESSIONS:
        raise ValueError("forbidden")
    return restore_session(tenant, session_id)


strategies = {
    "full": full_history(),
    "truncate": truncate_history(),
    "summary": summarize_history(),
    "retrieve": retrieve_history(),
}
strategy_report = {
    name: {
        "messages": len(messages),
        "tokens": estimate_tokens(messages),
        "has_rule": any(RULE in item["content"] for item in messages),
        "has_amount": any("120" in item["content"] for item in messages),
    }
    for name, messages in strategies.items()
}

options = {"temperature": 0, "tools_version": "weather-v1"}
key_a = cache_key("openai", "fixture-model", "prompt-v2", strategies["summary"], options)
key_b = cache_key("openai", "fixture-model", "prompt-v2", strategies["summary"], options)
key_changed = cache_key("openai", "fixture-model", "prompt-v3", strategies["summary"], options)
prefix_a = prefix_key("openai", "fixture-model", "prompt-v2", strategies["summary"])
prefix_b = prefix_key("openai", "fixture-model", "prompt-v2", strategies["summary"] + [CURRENT])

restore = restore_session("tenant-a", "session-001")
try:
    cross_tenant_restore("tenant-b", "session-001")
except ValueError as error:
    cross_tenant_error = str(error)
delete_result = delete_session("tenant-a", "session-001")
try:
    restore_session("tenant-a", "session-001")
except ValueError as error:
    deleted_restore_error = str(error)

assert strategy_report["full"]["has_rule"] is True
assert strategy_report["truncate"]["has_rule"] is True
assert strategy_report["truncate"]["has_amount"] is False
assert strategy_report["summary"]["has_rule"] is False
assert strategy_report["summary"]["has_amount"] is True
assert strategy_report["retrieve"]["has_rule"] is False
assert strategy_report["retrieve"]["has_amount"] is True
assert key_a == key_b and key_a != key_changed
assert prefix_a == prefix_b
assert restore["handle"] == "resp_opaque_001"
assert cross_tenant_error == "forbidden"
assert delete_result == "deleted"
assert deleted_restore_error == "not_found"

print(json.dumps({
    "strategies": strategy_report,
    "cache": {"same_request_hit": key_a == key_b, "prompt_version_invalidates": key_a != key_changed, "stable_prefix": prefix_a == prefix_b},
    "session": {"restored": restore, "cross_tenant": cross_tenant_error, "delete": delete_result, "after_delete": deleted_restore_error},
}, ensure_ascii=False, sort_keys=True))
```

### 观察输出

{% note success flat %}
预期输出会显示：完整历史保留规则和金额；简单截断保留规则但丢金额；摘要和检索保留金额摘要却没有原始规则全文，因此不能被标成“完全等价”。相同 Provider、模型、Prompt 版本、Context 和参数才命中应用输出缓存；Prompt 版本变化使键失效，稳定前缀仍可复用。跨租户恢复被拒绝，删除后句柄被清空且恢复返回 `not_found`。
{% endnote %}

```text
{"cache": {"prompt_version_invalidates": true, "same_request_hit": true, "stable_prefix": true}, "session": {"after_delete": "not_found", "cross_tenant": "forbidden", "delete": "deleted", "restored": {"handle": "resp_opaque_001", "provider": "openai", "version": 2}}, "strategies": {"full": {"has_amount": true, "has_rule": true, "messages": 6, "tokens": 26}, "retrieve": {"has_amount": true, "has_rule": false, "messages": 2, "tokens": 13}, "summary": {"has_amount": true, "has_rule": false, "messages": 2, "tokens": 13}, "truncate": {"has_amount": false, "has_rule": true, "messages": 3, "tokens": 15}}}
```

## 结果验证

### 验收证据

| 验收项 | 通过证据 | 失败信号 | 复测动作 |
| --- | --- | --- | --- |
| 会话归属 | 恢复前校验 tenant/user，句柄只作不透明引用 | 拿到 Provider ID 就能恢复 | 用另一租户恢复同一 session ID |
| Context 装配 | 完整、截断、摘要、检索各有消息和保留事实记录 | 只从数组头尾删除 | 删除规则、金额或当前任务分别复测 |
| 预算 | token 估算、输出预留和安全余量可观察 | 超窗后才发现 | 使用更长消息并检查策略降级 |
| 摘要 | 摘要版本、关键约束和事实保留有断言 | 摘要非空就认为等价 | 删除否定条件、数值和权限约束 |
| 输入缓存 | 稳定前缀与完整请求键分开 | 动态输入污染前缀，或键漏模型版本 | 改 Prompt 版本、模型、参数和 Context |
| 输出缓存 | 键包含 Prompt/数据/权限/时效版本 | 相同问题复用过期结果 | 改数据版本、租户和时效要求 |
| 删除 | 本地消息、远端句柄映射和缓存均进入删除状态 | 只删 session 主表 | 删除后尝试恢复、查缓存和读索引 |
| 隔离 | 跨租户返回 `forbidden`，不存在返回 `not_found` | 用 `not_found` 掩盖越权或泄露存在性 | 分别测试越权、删除和不存在 |

### 复测动作

1. 先固定模型、Prompt 版本、Context 策略和数据版本，再比较完整、截断、摘要和检索的事实保留。
2. 为每次恢复记录租户、会话版本、Provider 句柄、删除标记和当前规则装配结果。
3. 为输入缓存和输出缓存分别设计键、TTL、失效和删除测试，不把命中率当正确性证明。
4. 真实 Provider 的存储和删除策略变化时重新核对文档；本地 fixture 只验证状态机和缓存边界。

## 常见问题

{% flashcard basic id:llm-context-summary-loss deck:"大模型应用开发" priority:1 tags:"状态、Context与缓存,上下文" %}
--- question
摘要会丢失什么，为什么不能只检查摘要非空？
--- answer
摘要可能丢失否定条件、数值、权限、证据和工具关联；非空只能证明有文字，不能证明关键约束仍被保留。
--- explanation
摘要验收至少检查：

1. **规则**：系统/开发者约束是否仍然可定位，尤其是“不得”“只有”“必须人工确认”等否定或条件词。
2. **事实**：数字、实体、时间和状态是否保留，且能追溯到原消息或证据。
3. **关系**：工具调用与工具结果、订单与用户、问题与结论是否仍然对应。
4. **权限**：租户、用户和资源范围是否被保留，不能因为摘要变短就移除隔离条件。
5. **版本**：摘要由哪个 Prompt、模型或规则生成，发生变化时能否重建和失效。

如果关键字段无法通过断言恢复，应保留原文、重新检索或拒绝继续生成，而不是把摘要当成完整历史。
{% endflashcard %}

{% flashcard basic id:llm-cache-stable-input deck:"大模型应用开发" priority:1 tags:"状态、Context与缓存,缓存" %}
--- question
为什么缓存命中需要稳定输入？
--- answer
缓存键必须准确描述会影响结果的 Provider、模型、Prompt、Context、参数、权限和数据版本；输入或规则变化而键不变会复用错误或过期结果。
--- explanation
可以区分两种键：

- **输入前缀键**：只覆盖确实稳定、可重复的规则和上下文前缀，用于争取 Provider 输入缓存机会；动态用户内容不应污染这部分。
- **应用输出键**：覆盖完整规范化请求，包括模型/快照、Prompt 版本、Context、工具版本、参数、租户权限和数据时效版本；任何影响答案的变化都必须使它失效。

会话删除、权限变化、数据更新和 Prompt 发布都应能主动删除或版本化对应缓存。命中是性能证据，不是授权证据，也不是答案正确性的证据。
{% endflashcard %}

## 参考资料

### 官方资料

{% linkgroup %}
{% link OpenAI Responses API, https://platform.openai.com/docs/api-reference/responses, https://platform.openai.com/favicon.ico %}
{% link OpenAI Migrate to Responses, https://platform.openai.com/docs/guides/migrate-to-responses, https://platform.openai.com/favicon.ico %}
{% link Gemini Interactions API, https://ai.google.dev/gemini-api/docs/interactions-overview, https://ai.google.dev/favicon.ico %}
{% endlinkgroup %}

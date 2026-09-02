---
title: AI 辅助测试(六)API测试生成
tags:
  - AI 测试
categories:
  - Learn Topic
  - AI 辅助测试
description: 能构造 schema、业务、状态和权限层的 API 测试。
cover: /img/picgo-images/ai-assisted-testing-course-cover.png
series: AI 辅助测试
series_order: 6
published: false
abbrlink: bd0ac657
date: 2026-08-17 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把 OpenAPI、状态链、真实响应 ID 和清理动作转为可执行 API 测试。 最终要留下：能构造 schema、业务、状态和权限层的 API 测试。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 契约输入

{% note primary flat %}
API 测试生成要把 OpenAPI 形状、业务状态链、真实响应 ID 和清理动作连成一条可执行流程。 在“契约输入”这一环节负责定义：先固定schema，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| schema | 类型、必填、枚举 | 形状失败 | 不能推出业务 |
| chain | 创建→查询→更新→删 | 状态一致 | 不能硬编码 ID |
| cleanup | 真实 ID 与回收 | 环境干净 | 不能遗留数据 |
| 定义边界 | 契约输入 | Fake API 执行创建到删除链，后续请求只使用真实返回 ID，并在失败路径执行清理。 | Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[schema]
  F --> A[契约输入]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「schema」设为「类型、必填、枚举」，同时固定「chain」为「创建→查询→更新→删」；记录输入、状态和结果，记录形状失败。
- 只改变「cleanup」：正常值用「真实 ID 与回收」，越界或故障按“不能遗留数据”构造；观察状态一致，不要改动其余输入。
- 用环境干净检查“契约输入”：Fake API 执行创建到删除链，后续请求只使用真实返回 ID，并在失败路径执行清理；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。 用 Fake API 生成创建→查询→更新→删除链，使用真实返回 ID 并执行清理。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 状态链

{% note info flat %}
API 测试生成要把 OpenAPI 形状、业务状态链、真实响应 ID 和清理动作连成一条可执行流程。 在“状态链”这一环节负责执行：先固定chain，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：状态链**
1. 入口：chain=创建→查询→更新→删，先记录状态一致。
2. 转移：由cleanup=真实 ID 与回收进入状态链，只允许声明的动作。
3. 出口：用形状失败检查schema，越界条件是“不能推出业务”。
{% endnote %}

- 执行正常路径：把「chain」设为「创建→查询→更新→删」，同时固定「cleanup」为「真实 ID 与回收」；记录输入、状态和结果，记录状态一致。
- 只改变「schema」：正常值用「类型、必填、枚举」，越界或故障按“不能推出业务”构造；观察环境干净，不要改动其余输入。
- 用形状失败检查“状态链”：Fake API 执行创建到删除链，后续请求只使用真实返回 ID，并在失败路径执行清理；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。 用 Fake API 生成创建→查询→更新→删除链，使用真实返回 ID 并执行清理。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 真实 ID

{% note info flat %}
API 测试生成要把 OpenAPI 形状、业务状态链、真实响应 ID 和清理动作连成一条可执行流程。 在“真实 ID”这一环节负责故障：先固定cleanup，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：真实 ID 与回收 | cleanup | 环境干净 | 不能遗留数据 |
| 边界：类型、必填、枚举 | schema | 形状失败 | 不能推出业务 |
| 故障：创建→查询→更新→删 | chain | 状态一致 | 不能硬编码 ID |

- 注入边界：把「cleanup」设为「真实 ID 与回收」，同时固定「schema」为「类型、必填、枚举」；记录输入、状态和结果，记录环境干净。
- 只改变「chain」：正常值用「创建→查询→更新→删」，越界或故障按“不能硬编码 ID”构造；观察形状失败，不要改动其余输入。
- 用状态一致检查“真实 ID”：Fake API 执行创建到删除链，后续请求只使用真实返回 ID，并在失败路径执行清理；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。 用 Fake API 生成创建→查询→更新→删除链，使用真实返回 ID 并执行清理。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 清理回收

{% note info flat %}
API 测试生成要把 OpenAPI 形状、业务状态链、真实响应 ID 和清理动作连成一条可执行流程。 在“清理回收”这一环节负责复核：先固定schema，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（清理回收）：输入为「类型、必填、枚举」；状态观察为「状态一致」；独立判定使用「环境干净」。记录Fake API 执行创建到删除链，后续请求只使用真实返回 ID，并在失败路径执行清理，把“Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake API 执行创建到删除链，后续请求只使用真实返回 ID，并在失败路径执行清理。
{% endnote %}

```python
# Python 3 标准库夹具：无网络、无外部依赖
jobs={}
idempotency="k1"
def create(payload):
    job_id=f"job-{len(jobs)+1}"
    jobs[job_id]={"status":202,"state":"accepted","payload":payload,"idempotency":idempotency}
    return {"status":202,"id":job_id}
created=create({"ticket":"T-17"})
job_id=created["id"]
jobs[job_id]["state"]="running"
get_response={"status":200,"id":job_id,"state":jobs[job_id]["state"]}
jobs[job_id]["state"]="cancelled"
delete_response={"status":204,"id":job_id}
del jobs[job_id]
failed=create({"ticket":"bad"})
try:
    raise ValueError("oracle rejected")
except ValueError:
    failure_cleanup=True
finally:
    del jobs[failed["id"]]
clean=job_id not in jobs and failed["id"] not in jobs
print({"created":created,"get":get_response,"delete":delete_response,"failure_cleanup":failure_cleanup,"clean":clean})
assert created["status"]==202 and get_response["id"]==job_id and delete_response["status"]==204 and clean
# 预期观察：Fake API 执行创建到删除链，后续请求只使用真实返回 ID，并在失败路径执行清理。
```

{% note success flat %}
失败边界：Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。 用 Fake API 生成创建→查询→更新→删除链，使用真实返回 ID 并执行清理。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:g06-real-response-id deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
在http夹具里，怎样区分“真实响应 ID”的通过与拒绝？
--- answer
先把“真实响应 ID”绑定到schema与chain；正常、越界和 Unknown 各运行一次，断言环境干净。
--- explanation
在http夹具中，比较类型、必填、枚举与创建→查询→更新→删，保留环境干净；Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。
{% endflashcard %}

{% flashcard basic id:g06-schema-not-business deck:"AI 辅助测试" priority:2 tags:"AI 辅助测试,测试开发" %}
--- question
“清理回收”的课程边界中，为什么“Schema”不是“业务”？
--- answer
Schema只提供形状失败；业务还需要在chain上由环境干净确认，不能只看文本或单个事件。
--- explanation
在http夹具中分别运行“Schema”和“业务”，比较类型、必填、枚举与创建→查询→更新→删；Schema 通过不代表权限、幂等和业务状态正确；清理失败要阻断下一轮。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link Pytest documentation, https://docs.pytest.org/en/stable/, https://docs.pytest.org/en/stable/_static/favicon.png %}
{% link GitHub Actions documentation, https://docs.github.com/en/actions, https://github.com/favicon.ico %}
{% endlinkgroup %}

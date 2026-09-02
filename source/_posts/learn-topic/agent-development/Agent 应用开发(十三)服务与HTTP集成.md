---
title: Agent 应用开发(十三)服务与HTTP集成
tags:
  - Agent 开发
categories:
  - Learn Topic
  - Agent 应用开发
description: 实现 POST 202、GET status、cancel、身份与状态机，并区分接受、完成和业务成功。
cover: /img/picgo-images/agent-development-course-cover.png
series: Agent 应用开发
series_order: 13
published: false
abbrlink: bf488b56
date: 2026-07-22 12:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把 Agent 暴露为身份明确、可查询、可取消的 HTTP 长任务服务。 最终要留下：实现 POST 202、GET status、cancel、身份与状态机，并区分接受、完成和业务成功。 练习使用合成数据或 Fake 实现，外部服务的偶然结果不作为单独证明。
{% endnote %}

## 任务接口

{% note primary flat %}
长任务 HTTP 服务要把接受、执行、查询、取消、身份和状态转换分开；202 Accepted 只代表接收请求。 在“任务接口”这一环节负责定义：先固定post，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 主题字段 | 合成示例 | 观察结论 | 失败边界 |
| --- | --- | --- | --- |
| post | 任务 ID、202 | 排队状态 | 不能报告完成 |
| get | 状态、结果、版本 | 查询幂等 | 不能猜进度 |
| cancel | 主体、截止、取消 | 停止与清理 | 不能自动回滚 |
| 定义边界 | 任务接口 | Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID。 | 接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。 |

{% mermaid %}
flowchart LR
  I[输入] --> F[post]
  F --> A[任务接口]
  A --> O[观测]
  O --> V[验收]
  O -->|越界| D[降级]
{% endmermaid %}

- 建立基线：把「post」设为「任务 ID、202」，同时固定「get」为「状态、结果、版本」；记录输入、状态和结果，记录排队状态。
- 只改变「cancel」：正常值用「主体、截止、取消」，越界或故障按“不能自动回滚”构造；观察查询幂等，不要改动其余输入。
- 用停止与清理检查“任务接口”：Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。 用 Fake HTTP server 验证 202、轮询、取消、幂等和状态转换。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 身份校验

{% note info flat %}
长任务 HTTP 服务要把接受、执行、查询、取消、身份和状态转换分开；202 Accepted 只代表接收请求。 在“身份校验”这一环节负责执行：先固定get，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note info flat %}
**路径卡片：身份校验**
1. 入口：get=状态、结果、版本，先记录查询幂等。
2. 转移：由cancel=主体、截止、取消进入身份校验，只允许声明的动作。
3. 出口：用排队状态检查post，越界条件是“不能报告完成”。
{% endnote %}

- 执行正常路径：把「get」设为「状态、结果、版本」，同时固定「cancel」为「主体、截止、取消」；记录输入、状态和结果，记录查询幂等。
- 只改变「post」：正常值用「任务 ID、202」，越界或故障按“不能报告完成”构造；观察停止与清理，不要改动其余输入。
- 用排队状态检查“身份校验”：Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。 用 Fake HTTP server 验证 202、轮询、取消、幂等和状态转换。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 状态查询

{% note info flat %}
长任务 HTTP 服务要把接受、执行、查询、取消、身份和状态转换分开；202 Accepted 只代表接收请求。 在“状态查询”这一环节负责故障：先固定cancel，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

| 触发样本 | 观察字段 | 预期决策 | 不能推出 |
| --- | --- | --- | --- |
| 正常：主体、截止、取消 | cancel | 停止与清理 | 不能自动回滚 |
| 边界：任务 ID、202 | post | 排队状态 | 不能报告完成 |
| 故障：状态、结果、版本 | get | 查询幂等 | 不能猜进度 |

- 注入边界：把「cancel」设为「主体、截止、取消」，同时固定「post」为「任务 ID、202」；记录输入、状态和结果，记录停止与清理。
- 只改变「get」：正常值用「状态、结果、版本」，越界或故障按“不能猜进度”构造；观察排队状态，不要改动其余输入。
- 用查询幂等检查“状态查询”：Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID；保存原始输入、状态转移、响应和副作用计数，无法观察的字段写为 Unknown。

{% note warning flat %}
失败边界：接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。 用 Fake HTTP server 验证 202、轮询、取消、幂等和状态转换。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 取消语义

{% note info flat %}
长任务 HTTP 服务要把接受、执行、查询、取消、身份和状态转换分开；202 Accepted 只代表接收请求。 在“取消语义”这一环节负责复核：先固定post，再观察状态、输出和副作用；不要把模型建议、脚本结束或页面提示直接当成业务结论。
{% endnote %}

{% note success flat %}
结果清单（取消语义）：输入为「任务 ID、202」；状态观察为「查询幂等」；独立判定使用「停止与清理」。记录Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID，把“接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。”作为未覆盖范围。
{% endnote %}

{% note info flat %}
下面的夹具只使用 Python 3 标准库，定义了完整的输入、判断和断言。预期结果：Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID。
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
# 预期观察：Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID。
```

{% note success flat %}
失败边界：接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。 用 Fake HTTP server 验证 202、轮询、取消、幂等和状态转换。 只能在声明的合成夹具内解释；超出范围的结论应标记为 Unknown。
{% endnote %}

## 常见问题

{% flashcard basic id:c13-accepted-not-complete deck:"Agent 应用开发" priority:2 tags:"Agent 应用开发,测试开发" %}
--- question
“取消语义”的课程边界中，为什么“已验收”不是“complete”？
--- answer
HTTP 202/accepted 只表示请求进入处理队列，必须查询任务状态和最终副作用才能判断完成。
--- explanation
长任务 HTTP 服务要把接受、执行、查询、取消、身份和状态转换分开；202 Accepted 只代表接收请求。把这条区别落到夹具：分别构造正常、越界和撤销样本，保存Fake HTTP server 验证 POST 202、GET 状态、取消、幂等和状态转换，使用真实返回的任务 ID。接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。
{% endflashcard %}

{% flashcard basic id:c13-auth-not-authz deck:"Agent 应用开发" priority:1 tags:"Agent 应用开发,测试开发" %}
--- question
“取消语义”的课程边界中，为什么“授权”不是“authz”？
--- answer
授权只提供排队状态；authz还需要在get上由停止与清理确认，不能只看文本或单个事件。
--- explanation
在http夹具中分别运行“授权”和“authz”，比较任务 ID、202与状态、结果、版本；接受、完成和业务成功是不同证据；跨进程恢复和真实网络还需额外验证。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link LangGraph documentation, https://langchain-ai.github.io/langgraph/, https://langchain-ai.github.io/langgraph/favicon.ico %}
{% link OpenAI Agents SDK documentation, https://openai.github.io/openai-agents-python/, https://openai.github.io/openai-agents-python/favicon.ico %}
{% endlinkgroup %}

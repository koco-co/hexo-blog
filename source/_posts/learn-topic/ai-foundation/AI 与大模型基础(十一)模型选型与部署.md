---
title: AI 与大模型基础(十一)模型选型与部署
tags:
  - AI 与大模型基础
  - 模型选型与部署
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能根据质量、速度、成本、隐私和部署条件形成可复查的模型决策。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 11
published: false
abbrlink: 9bae809
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：先用许可、区域、隐私、能力、质量、延迟和预算排除不可用候选，再保存评分、敏感性、部署就绪、灰度与回滚记录。
{% endnote %}

## 机制模型

<!-- concept-story:start -->

同一团队要处理三件事：回答公开手册、修复私有仓库、从证件图片提取字段。负责人最初想把排行榜第一名用于全部任务，却发现代码不能离开内网，图像流程必须保留人工回退，而问答更在意高峰延迟。若先求一个总分，最高质量会掩盖这些不可交换的约束；改为逐任务先过硬门禁，再比较剩余方案，三个任务自然得到不同候选。

<!-- concept-story:end -->

{% note info flat %}
决策先过许可、隐私、区域、能力、质量、p95（95% 请求不超过的延迟位置估计）和预算硬门禁，再对剩余候选加权。API、自托管、边缘与混合部署交换的是控制、弹性、数据流和运维责任，没有全局最优。
{% endnote %}

{% mermaid %}
flowchart TD
  N[任务与风险] --> H{硬门禁}
  H -->|失败| X[排除]
  H -->|通过| W[加权评分]
  W --> S[敏感性分析]
  S --> T[Shadow/Canary]
  T --> R[上线或回滚]
{% endmermaid %}

{% note primary flat %}
硬门禁失败直接排除候选；只有通过门禁的候选才能进入加权和敏感性分析。Shadow/Canary 的真实观测再决定上线，回滚目标也必须预先验证。
{% endnote %}

| 对象 | 机制或证据 | 不能推出 |
| --- | --- | --- |
| Managed API | 上线快、弹性强 | 外部数据流；供应商负责基础设施，使用方负责最小化输入、配额与版本漂移 |
| 专属托管 | 隔离与容量更可控 | 仍受平台边界；双方责任需写入网络、密钥、容量与升级记录 |
| 自托管开放权重 | 离线与运行控制强 | 使用方承担许可、硬件容量、补丁、安全、监控和回滚 |
| Edge | 离线与低网络延迟 | 使用方承担设备内存、能耗、热、分发与模型尺寸限制 |
| Hybrid | 按敏感度或复杂度路由 | 每条数据流、降级路径和路由错误都需独立评测 |

## 核心边界

{% note info flat %}
对三个任务执行完整硬门禁，把 Unknown 单独记为 defer；让问答任务保留两个合格候选以观察权重翻转，并生成可复查、可序列化的决策与灰度记录。
{% endnote %}

{% folding purple, 展开机制辨析 %}
`cost_advantage` 明确表示越高越省，而不是把货币成本正向加分。任何门禁字段为 Unknown 时，候选进入 defer，不能用平均分补齐。部署前还要固定模型/运行时/容器版本，画出数据流，在目标并发下记录吞吐、p95、峰值内存、成功任务成本和质量区间。

Shadow 把请求镜像给候选但不选择其输出作为用户响应；镜像仍会增加负载，写操作、工具副作用与敏感数据必须隔离。Canary 按 5%→25%→100% 分段放量。每段预声明质量、错误率、p95、成功任务成本和安全阈值，并保留镜像比例、响应流量比例、观测窗口、容量余量、数据边界与回滚验收。SLO 是这组可度量的服务目标，不是“感觉稳定”。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
import json

candidates = {
 "api":{"snapshot":"api-2026-08-fixture","quality_interval":[0.86,0.90],"p95_ms":180,
        "monthly_cost":800,"cost_advantage":0.60,"privacy":"external",
        "modalities":["text","image"],"license":"service","region":"cn-allowed"},
 "private":{"snapshot":"weights-v1-fixture","quality_interval":[0.81,0.83],"p95_ms":210,
            "monthly_cost":700,"cost_advantage":0.95,"privacy":"internal",
            "modalities":["text"],"license":"self-host-approved","region":"local"},
 "edge":{"snapshot":"edge-v1-fixture","quality_interval":[0.72,0.76],"p95_ms":90,
         "monthly_cost":300,"cost_advantage":0.90,"privacy":"device",
         "modalities":["text","image"],"license":"device-approved","region":"device"},
 "unknown":{"snapshot":"candidate-unknown","quality_interval":"Unknown","p95_ms":"Unknown",
            "monthly_cost":100,"cost_advantage":0.99,"privacy":"Unknown",
            "modalities":["Unknown"],"license":"Unknown","region":"Unknown"},
}
tasks = [
 {"id":"qa-v1","version":"holdout-v1","modality":"text","privacy":["external","internal"],
  "licenses":["service","self-host-approved"],"regions":["cn-allowed","local"],"max_p95":230,
  "max_budget":900,"min_quality_lower":0.8,"weights":{"quality":0.9,"cost_advantage":0.1},
  "rollback":{"target":"api-prev-fixed","trigger":"quality_lower<0.80 or p95>230"},
  "reevaluate_on":"model/price/policy change"},
 {"id":"code-v1","version":"private-v1","modality":"text","privacy":["internal"],
  "licenses":["self-host-approved"],"regions":["local"],"max_p95":250,"max_budget":800,
  "min_quality_lower":0.8,"weights":{"quality":0.7,"cost_advantage":0.3},
  "rollback":{"target":"read-only-tools","trigger":"test pass rate<0.80"},"reevaluate_on":"runtime change"},
 {"id":"vision-v1","version":"images-v1","modality":"image","privacy":["device"],
  "licenses":["device-approved"],"regions":["device"],"max_p95":120,"max_budget":500,
  "min_quality_lower":0.7,"weights":{"quality":0.5,"cost_advantage":0.5},
  "rollback":{"target":"manual-entry","trigger":"field accuracy<0.70"},"reevaluate_on":"device update"},
]
gate_fields = ("snapshot","quality_interval","p95_ms","monthly_cost","cost_advantage",
               "privacy","modalities","license","region")
task_gate_fields = ("id","version","modality","privacy","licenses","regions","max_p95",
                    "max_budget","min_quality_lower","weights","rollback","reevaluate_on")

def has_unknown(value):
    return value == "Unknown" or isinstance(value,list) and any(item == "Unknown" for item in value)

def valid_interval(value):
    return (isinstance(value,list) and len(value) == 2
            and all(isinstance(item,(int,float)) and not isinstance(item,bool) for item in value)
            and 0 <= value[0] <= value[1] <= 1)

def decide(task, weights=None, pool=None):
    pool = candidates if pool is None else pool
    missing_task = [field for field in task_gate_fields if field not in task or has_unknown(task[field])]
    if missing_task:
        raise ValueError(f"{task.get('id','Unknown')}: task gate Unknown or missing")
    weights = weights or task["weights"]
    if round(sum(weights.values()), 8) != 1 or any(value < 0 for value in weights.values()):
        raise ValueError("invalid weights")
    excluded, deferred, scores = {}, {}, {}
    for name, candidate in pool.items():
        missing = [field for field in gate_fields if field not in candidate or has_unknown(candidate[field])]
        if missing:
            deferred[name] = missing
            continue
        if not valid_interval(candidate["quality_interval"]):
            raise ValueError(f"{name}: invalid quality interval")
        low, high = candidate["quality_interval"]
        failures = []
        if task["modality"] not in candidate["modalities"]: failures.append("capability")
        if candidate["privacy"] not in task["privacy"]: failures.append("privacy")
        if candidate["license"] not in task["licenses"]: failures.append("license")
        if candidate["region"] not in task["regions"]: failures.append("region")
        if candidate["p95_ms"] > task["max_p95"]: failures.append("p95")
        if candidate["monthly_cost"] > task["max_budget"]: failures.append("budget")
        if low < task["min_quality_lower"]: failures.append("quality-lower-bound")
        if failures:
            excluded[name] = failures
        else:
            scores[name] = round(((low + high) / 2) * weights["quality"]
                                 + candidate["cost_advantage"] * weights["cost_advantage"], 3)
    if not scores:
        raise ValueError(f"{task['id']}: no eligible candidate")
    winner = max(scores, key=scores.get)
    gates = {key:task[key] for key in ("modality","privacy","licenses","regions",
                                       "max_p95","max_budget","min_quality_lower")}
    record = {"task":task["id"],"input_version":task["version"],"gates":gates,
              "weights":weights,"candidate_evidence":candidates,"excluded":excluded,
              "deferred_unknown":deferred,"scores":scores,"winner":winner,
              "winner_snapshot":candidates[winner]["snapshot"],"rollback":task["rollback"],
              "reevaluate_on":task["reevaluate_on"]}
    required = {"task","input_version","gates","weights","candidate_evidence","excluded",
                "deferred_unknown","scores","winner","winner_snapshot","rollback","reevaluate_on"}
    if set(record) != required:
        raise RuntimeError("decision record incomplete")
    return record

records = [decide(task) for task in tasks]
sensitive = decide(tasks[0], {"quality":0.2,"cost_advantage":0.8})
if [record["winner"] for record in records] != ["api","private","edge"] or sensitive["winner"] != "private":
    raise RuntimeError("decision result changed")
expected_deferred = {"unknown":["quality_interval","p95_ms","privacy","modalities","license","region"]}
if any(record["deferred_unknown"] != expected_deferred for record in records):
    raise RuntimeError("deferred candidate fields changed")
missing_candidate = {**candidates["api"]}
missing_candidate.pop("region")
missing_candidate_record = decide(tasks[0], pool={**candidates, "api":missing_candidate})
if missing_candidate_record["deferred_unknown"] != {"api":["region"],"unknown":expected_deferred["unknown"]}:
    raise RuntimeError("missing candidate gate field not deferred exactly")
if json.loads(json.dumps(records, sort_keys=True)) != records:
    raise RuntimeError("decision records are not JSON stable")

thresholds = {"quality_lower":0.80,"max_error_rate":0.02,"max_p95_ms":230,
              "max_cost_per_success":1000,"max_safety_incidents":0}
stages = [
 {"name":"shadow","mirror_pct":100,"serve_pct":0,"window":"60m",
  "observed":{"quality_lower":0.83,"error_rate":0.01,"p95_ms":210,"cost_per_success":900,"safety_incidents":0}},
 {"name":"canary-5","mirror_pct":0,"serve_pct":5,"window":"60m",
  "observed":{"quality_lower":0.82,"error_rate":0.01,"p95_ms":215,"cost_per_success":920,"safety_incidents":0}},
 {"name":"canary-25","mirror_pct":0,"serve_pct":25,"window":"120m",
  "observed":{"quality_lower":0.82,"error_rate":0.015,"p95_ms":220,"cost_per_success":940,"safety_incidents":0}},
 {"name":"rollout-100","mirror_pct":0,"serve_pct":100,"window":"24h",
  "observed":{"quality_lower":0.81,"error_rate":0.018,"p95_ms":225,"cost_per_success":960,"safety_incidents":0}},
]
def accepted(observed):
    return (observed["quality_lower"] >= thresholds["quality_lower"]
            and observed["error_rate"] <= thresholds["max_error_rate"]
            and observed["p95_ms"] <= thresholds["max_p95_ms"]
            and observed["cost_per_success"] <= thresholds["max_cost_per_success"]
            and observed["safety_incidents"] <= thresholds["max_safety_incidents"])
rollout = {"snapshot":records[0]["winner_snapshot"],"dataset":"holdout-v1",
           "side_effects":"disabled","capacity_headroom_pct":30,
           "privacy":"synthetic/no external data","thresholds":thresholds,
           "stages":[{**stage,"accepted":accepted(stage["observed"])} for stage in stages],
           "rollback":records[0]["rollback"]}
rollout_fields = {"snapshot","dataset","side_effects","capacity_headroom_pct","privacy",
                  "thresholds","stages","rollback"}
stage_fields = {"name","mirror_pct","serve_pct","window","observed","accepted"}
observed_fields = {"quality_lower","error_rate","p95_ms","cost_per_success","safety_incidents"}
expected_stages = [("shadow",100,0),("canary-5",0,5),("canary-25",0,25),("rollout-100",0,100)]

def non_empty_text(value):
    return isinstance(value, str) and bool(value.strip())

def valid_rollback(value):
    return (isinstance(value, dict) and set(value) == {"target","trigger"}
            and non_empty_text(value["target"]) and non_empty_text(value["trigger"]))

def validate_rollout(plan):
    if set(plan) != rollout_fields:
        raise ValueError("rollout schema incomplete")
    if plan["side_effects"] != "disabled":
        raise ValueError("rollout Shadow side_effects must be disabled")
    if not valid_rollback(plan["rollback"]):
        raise ValueError("rollout rollback target/trigger missing")
    if len(plan["stages"]) != len(expected_stages):
        raise ValueError("rollout stage sequence or percentages invalid")
    for stage, expected in zip(plan["stages"], expected_stages):
        if set(stage) != stage_fields or set(stage["observed"]) != observed_fields:
            raise ValueError("rollout stage schema incomplete")
        if (stage["name"],stage["mirror_pct"],stage["serve_pct"]) != expected:
            raise ValueError("rollout stage sequence or percentages invalid")
        if not non_empty_text(stage["window"]):
            raise ValueError("rollout observation window missing")
        if not isinstance(stage["accepted"], bool) or not accepted(stage["observed"]):
            raise ValueError("rollout SLO acceptance changed")
    if [stage["accepted"] for stage in plan["stages"]] != [True] * 4:
        raise ValueError("rollout SLO acceptance changed")

validate_rollout(rollout)
if accepted({**stages[0]["observed"],"p95_ms":231}):
    raise RuntimeError("rollout p95 threshold not enforced")
if json.loads(json.dumps(rollout, sort_keys=True)) != rollout:
    raise RuntimeError("rollout evidence is not JSON stable")
print("winners", {record["task"]:record["winner"] for record in records})
print("record-fields", sorted(records[0]))
print("deferred", {record["task"]:record["deferred_unknown"] for record in records})
print("sensitivity", records[0]["winner"], "->", sensitive["winner"])
print("rollout", [(stage["name"],stage["mirror_pct"],stage["serve_pct"],stage["accepted"])
                  for stage in rollout["stages"]])
decision_negative_cases = [
    ({**tasks[0],"id":"blocked-v1","max_budget":0}, candidates, "blocked-v1: no eligible candidate"),
    (tasks[0], {"broken":{**candidates["api"],"quality_interval":[0.9,0.8]}}, "broken: invalid quality interval"),
    ({**tasks[0],"id":"unknown-task","privacy":["Unknown"]}, candidates, "unknown-task: task gate Unknown or missing"),
    ({key:value for key,value in tasks[0].items() if key != "max_budget"} | {"id":"missing-task-gate"}, candidates, "missing-task-gate: task gate Unknown or missing"),
]
for bad_task, bad_pool, expected in decision_negative_cases:
    try:
        decide(bad_task, pool=bad_pool)
    except ValueError as error:
        message = f"rejected: {error}"
        if message != f"rejected: {expected}":
            raise RuntimeError("decision rejection output changed")
        print(message)
    else:
        raise RuntimeError("invalid decision input accepted")

rollout_negative_cases = [
    ({**rollout,"stages":[{**rollout["stages"][0],"window":" "}, *rollout["stages"][1:]]},
     "rollout observation window missing"),
    ({**rollout,"side_effects":"enabled"}, "rollout Shadow side_effects must be disabled"),
    ({**rollout,"stages":[{**stage} for stage in rollout["stages"]]},
     "rollout stage sequence or percentages invalid"),
    ({**rollout,"rollback":{"target":"","trigger":"quality_lower<0.80"}},
     "rollout rollback target/trigger missing"),
]
rollout_negative_cases[2][0]["stages"][1]["serve_pct"] = 10
for bad_rollout, expected in rollout_negative_cases:
    try:
        validate_rollout(bad_rollout)
    except ValueError as error:
        message = f"rejected: {error}"
        if message != f"rejected: {expected}":
            raise RuntimeError("rollout rejection output changed")
        print(message)
    else:
        raise RuntimeError("invalid rollout evidence accepted")
```

{% note success flat %}
精确输出的赢家为 `qa-v1/api`、`code-v1/private`、`vision-v1/edge`，每条记录包含完整任务门禁、全部候选快照与区间、排除/defer、分数、回滚和复评条件；Unknown 候选在三个任务中都按完整字段集 defer，缺失的 `api.region` 也按精确字段集 defer。敏感性输出 `api -> private`。灰度输出依次为 `shadow 100/0`、`canary-5 0/5`、`canary-25 0/25`、`rollout-100 0/100` 且均为 `True`，末尾依次输出并拒绝零预算无候选、倒置质量区间、任务门禁 Unknown、缺失任务门禁、空观测窗口、Shadow 副作用开启、错误阶段比例和空回滚目标。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
winners {'qa-v1': 'api', 'code-v1': 'private', 'vision-v1': 'edge'}
record-fields ['candidate_evidence', 'deferred_unknown', 'excluded', 'gates', 'input_version', 'reevaluate_on', 'rollback', 'scores', 'task', 'weights', 'winner', 'winner_snapshot']
deferred {'qa-v1': {'unknown': ['quality_interval', 'p95_ms', 'privacy', 'modalities', 'license', 'region']}, 'code-v1': {'unknown': ['quality_interval', 'p95_ms', 'privacy', 'modalities', 'license', 'region']}, 'vision-v1': {'unknown': ['quality_interval', 'p95_ms', 'privacy', 'modalities', 'license', 'region']}}
sensitivity api -> private
rollout [('shadow', 100, 0, True), ('canary-5', 0, 5, True), ('canary-25', 0, 25, True), ('rollout-100', 0, 100, True)]
rejected: blocked-v1: no eligible candidate
rejected: broken: invalid quality interval
rejected: unknown-task: task gate Unknown or missing
rejected: missing-task-gate: task gate Unknown or missing
rejected: rollout observation window missing
rejected: rollout Shadow side_effects must be disabled
rejected: rollout stage sequence or percentages invalid
rejected: rollout rollback target/trigger missing
```
{% endfolding %}

## 失败边界

{% note warning flat %}
先算总分掩盖硬门禁；只比 token 单价而不算失败、运维与网络；把开放权重等同可商用开源；回滚到另一个未经验证的移动 alias。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 硬门禁 | 许可、隐私、区域、p95、预算可判定 | 高分抵消违法或泄露 |
| 证据 | 质量区间、成功任务成本、SLO 齐全 | 单次 demo |
| 恢复 | 固定快照、触发器、回滚演练 | 只写“可切换” |

## 结果验证

{% note success flat %}
预期三条结构化记录、一次真实排名翻转、一个 Shadow/5% Canary 合成计划和一个无候选失败。上线记录必须把合成字段替换为同一任务集、目标硬件与实际流量证据，达到触发器时回滚并再次验证旧快照 SLO。
{% endnote %}

- 硬门禁在加权前执行。
- 权重变化时记录排名是否稳定。
- Shadow/Canary 与回滚演练保存实际 SLO 证据。

## 常见问题

{% flashcard basic id:foundation-small-model deck:"AI 与大模型基础" priority:1 tags:"模型选型与部署,基础机制" %}
--- question
何时优先选择小模型？
--- answer
当它通过质量与风险门禁，并在延迟、成本、离线或资源约束上更合适时。
--- explanation
“小”不是目的，判断顺序是：

1. 先过许可、隐私、区域、能力和质量硬门禁；
2. 在同一任务集与部署栈测 p95、吞吐、失败率和成功任务成本；
3. 只有门禁通过，才比较资源取舍并保留回滚目标。

任一硬门禁失败，都不能用更低单价抵消。
{% endflashcard %}

{% flashcard basic id:foundation-model-decision-record deck:"AI 与大模型基础" priority:2 tags:"模型选型与部署,基础机制" %}
--- question
模型选型记录应包含哪些可回滚信息？
--- answer
任务版本、模型快照、API/运行时、数据与指标、硬门禁、权重、部署条件、备选、触发器和复评日期。
--- explanation
最小记录是：

| 字段 | 示例 |
| --- | --- |
| 身份 | `task-v1 → snapshot-B` |
| 门禁与证据 | 质量区间、p95、预算、隐私、区域 |
| 恢复 | `quality<阈值` 时切到已演练的 `snapshot-A` |
| 复评 | 模型、价格、政策或运行时变化 |

移动 alias 和未验证候选不能作为回滚目标。
{% endflashcard %}

## 参考资料

### 风险与模型

{% linkgroup %}
{% link NIST AI RMF, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/themes/custom/nist_www/favicon.ico %}
{% link Hugging Face Model Cards, https://huggingface.co/docs/hub/model-cards, https://huggingface.co/favicon.ico %}
{% endlinkgroup %}

### 部署方式

{% linkgroup %}
{% link OpenAI Models, https://platform.openai.com/docs/models, https://developers.openai.com/favicon.png %}
{% link NIST Cloud Computing Definition, https://csrc.nist.gov/pubs/sp/800/145/final, https://www.nist.gov/themes/custom/nist_www/favicon.ico %}
{% link Google AI Edge, https://ai.google.dev/edge, https://www.gstatic.com/devrel-devsite/prod/vdc800838fb8be04a9a7685606311d18c65800504bccf261551968ac74bffd42e/googledevai/images/favicon-new.png %}
{% link AWS Shared Responsibility Model, https://aws.amazon.com/compliance/shared-responsibility-model/, https://aws.amazon.com/favicon.ico %}
{% endlinkgroup %}

### 灰度与流量

{% linkgroup %}
{% link Kubernetes Deployments, https://kubernetes.io/docs/concepts/workloads/controllers/deployment/, https://kubernetes.io/icons/favicon-32.png %}
{% link Cloud Deploy Canary, https://cloud.google.com/deploy/docs/deployment-strategies/canary, https://cloud.google.com/favicon.ico %}
{% link Istio Traffic Mirroring, https://istio.io/latest/docs/tasks/traffic-management/mirroring/, https://istio.io/latest/favicons/favicon.ico %}
{% endlinkgroup %}

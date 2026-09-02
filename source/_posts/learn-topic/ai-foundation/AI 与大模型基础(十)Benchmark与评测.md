---
title: AI 与大模型基础(十)Benchmark与评测
tags:
  - AI 与大模型基础
  - Benchmark与评测
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能读懂基准数据、指标、污染、方差和榜单与实际体验的差异。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 10
published: false
abbrlink: 9143c3cb
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把排行榜分数还原为数据版本、模型快照、提示、harness、scorer、重复运行和样本级结果，再判断它能否迁移到业务 holdout。
{% endnote %}

## 机制模型

{% note info flat %}
Benchmark 结果的最小单位是完整评测运行：模型快照、数据版本、提示模板、采样参数、harness、评分器、失败处理和运行日期缺一不可。分数只是样本估计，还要报告区间和错误类型。
{% endnote %}

{% mermaid %}
flowchart TD
  D[冻结任务集] --> R[固定模型与 Harness]
  R --> P[原始预测]
  P --> S[独立评分]
  S --> U[区间与错误类型]
  U --> C[适用范围与决策]
{% endmermaid %}

{% note primary flat %}
分数只有在任务集、模型、harness 与 scorer 全部冻结时才可复算。区间与错误类型解释样本证据，适用范围仍要由业务 holdout 验证。
{% endnote %}

| 对象 | 机制或证据 | 不能推出 |
| --- | --- | --- |
| Benchmark | 冻结的任务/数据、协议、scorer、metric 与 baseline 组合 | 名称相同不代表版本相同 |
| Baseline | 规则、旧模型或人工流程的参照结果 | 没有参照时无法判断改进幅度 |
| 准确率 | 正确数/总数 | 类别不均衡时可能误导 |
| 混淆矩阵 | TP/FP/FN/TN | 需要明确正类 |
| Wilson 区间 | 二项比例不确定性 | 不处理任务相关性 |
| 代码通过率 | 测试环境内解决比例 | 强依赖数据变体和 harness |
| 胜率/Judge | 相对偏好 | 受顺序、风格和裁判偏差影响 |

## 核心边界

{% note info flat %}
冻结一份包含精确 harness revision 与采样参数的评测运行元数据，保留样本级结果，计算 Wilson 区间、混淆矩阵、配对胜负、重复运行范围和已知重叠命中；再验证缺字段、非法计数、跨版本比较和无污染断言门禁。
{% endnote %}

{% folding purple, 展开机制辨析 %}
同名 Benchmark 可能有不同数据变体、补丁、容器和 scorer。SWE-bench Verified 仍需记录具体数据 revision 与精确 harness image、commit 或内容摘要，major version 不足以复算。污染检查只能保存“检测了哪些重叠、命中了什么”；未命中不能证明训练数据中不存在污染。比较两个候选应保留同一样本上的配对结果，随机输出还要预先声明 seed/重复次数。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
import math
from datetime import date

run = {"model_snapshot":"fixture-model-v1", "data_version":"holdout-v1@sha256:demo",
       "prompt":"p1", "harness":"local-harness@revision:fixture-2026-08-29.1",
       "scorer":"exact-match-1", "sampling":{"temperature":0,"seeds":[1,2,3]},
       "baseline":"rule-v1", "run_date":"2026-08-29",
       "failure_policy":"failed request is incorrect"}
required = {"model_snapshot","data_version","prompt","harness","scorer","sampling",
            "baseline","run_date","failure_policy"}
comparison_fields = required - {"model_snapshot","run_date"}

def validate_run(record):
    if set(record) != required:
        raise ValueError("run metadata mismatch")
    if not all(isinstance(record[key],str) and record[key] for key in required - {"sampling"}):
        raise ValueError("run metadata type mismatch")
    sampling = record["sampling"]
    if (not isinstance(sampling,dict) or set(sampling) != {"temperature","seeds"}
            or not isinstance(sampling["temperature"],(int,float))
            or not isinstance(sampling["seeds"],list) or not sampling["seeds"]
            or any(not isinstance(seed,int) for seed in sampling["seeds"])):
        raise ValueError("sampling metadata invalid")
    date.fromisoformat(record["run_date"])

def validate_comparison(left, right):
    validate_run(left)
    validate_run(right)
    if any(left[field] != right[field] for field in comparison_fields):
        raise ValueError("incompatible run identities")

def assert_absence_claim(scan):
    if set(scan) != {"method","hits","complete"} or not scan["complete"] or scan["hits"]:
        raise ValueError("contamination absence unsupported")
    return True

def wilson(success, total, z=1.96):
    if not isinstance(success,int) or not isinstance(total,int) or not 0 <= success <= total or total <= 0:
        raise ValueError("invalid counts")
    p = success / total
    divisor = 1 + z*z/total
    center = (p + z*z/(2*total)) / divisor
    half = z * math.sqrt(p*(1-p)/total + z*z/(4*total*total)) / divisor
    return round(center-half,3), round(center+half,3)

validate_run(run)
candidate_run = {**run,"model_snapshot":"candidate-model-v1"}
validate_comparison(run,candidate_run)
run_identity = {key:run[key] for key in ("model_snapshot","data_version","prompt","harness",
                                           "scorer","sampling","baseline","run_date","failure_policy")}
samples = [
 {"id":"sample-001","gold":1,"prediction":1,"baseline_correct":1,"candidate_correct":1},
 {"id":"sample-002","gold":1,"prediction":0,"baseline_correct":0,"candidate_correct":1},
 {"id":"sample-003","gold":1,"prediction":1,"baseline_correct":1,"candidate_correct":0},
 {"id":"sample-004","gold":0,"prediction":1,"baseline_correct":0,"candidate_correct":0},
 {"id":"sample-005","gold":0,"prediction":0,"baseline_correct":0,"candidate_correct":1},
 {"id":"sample-006","gold":1,"prediction":1,"baseline_correct":1,"candidate_correct":1},
]
sample_fields = {"id","gold","prediction","baseline_correct","candidate_correct"}
required_sample_ids = {f"sample-{index:03d}" for index in range(1,7)}

def validate_samples(records):
    if not isinstance(records,list) or len(records) != len(required_sample_ids):
        raise ValueError("sample records incomplete")
    seen = set()
    for record in records:
        if not isinstance(record,dict) or set(record) != sample_fields:
            raise ValueError("sample record fields mismatch")
        sample_id = record["id"]
        if not isinstance(sample_id,str) or sample_id not in required_sample_ids:
            raise ValueError("sample IDs mismatch")
        if sample_id in seen:
            raise ValueError("sample IDs must be unique")
        seen.add(sample_id)
        if any(type(record[field]) is not int or record[field] not in (0,1)
               for field in sample_fields - {"id"}):
            raise ValueError("sample record fields invalid")
    if seen != required_sample_ids:
        raise ValueError("sample records incomplete")

def validate_decision(record, expected_delta):
    decision_fields = {"candidate","baseline","paired_delta","contamination_hits","outcome","reason"}
    if set(record) != decision_fields:
        raise ValueError("decision fields mismatch")
    if (any(not isinstance(record[field],str) or not record[field].strip()
            for field in ("candidate","baseline","outcome"))
            or not isinstance(record["contamination_hits"],list)
            or any(not isinstance(hit,str) or not hit for hit in record["contamination_hits"])):
        raise ValueError("decision fields invalid")
    if type(record["paired_delta"]) is not int:
        raise ValueError("paired delta invalid")
    if record["paired_delta"] != expected_delta:
        raise ValueError("paired delta mismatch")
    if not isinstance(record["reason"],str) or not record["reason"].strip():
        raise ValueError("decision reason required")

validate_samples(samples)
small, large = wilson(8,10), wilson(80,100)
cm = {"tp":sum(row["gold"] == row["prediction"] == 1 for row in samples),
      "tn":sum(row["gold"] == row["prediction"] == 0 for row in samples),
      "fp":sum(row["gold"] == 0 and row["prediction"] == 1 for row in samples),
      "fn":sum(row["gold"] == 1 and row["prediction"] == 0 for row in samples)}
paired = {"candidate_only":sum(row["baseline_correct"] == 0 and row["candidate_correct"] == 1 for row in samples),
          "baseline_only":sum(row["baseline_correct"] == 1 and row["candidate_correct"] == 0 for row in samples)}
paired_delta = paired["candidate_only"] - paired["baseline_only"]
repeat_scores = [0.70,0.80,0.70]
known_training_fingerprints = {"sample-002"}
holdout_ids = {row["id"] for row in samples}
contamination_hits = sorted(known_training_fingerprints & holdout_ids)
repeat_range = round(max(repeat_scores)-min(repeat_scores),2)
decision = {"candidate":"candidate-model-v1","baseline":"rule-v1","paired_delta":paired_delta,
            "contamination_hits":contamination_hits,"outcome":"defer",
            "reason":"rerun on a clean versioned holdout"}
validate_decision(decision, paired_delta)
if small != (0.49,0.943) or large != (0.711,0.867):
    raise RuntimeError("Wilson interval changed")
if cm != {"tp":3,"tn":1,"fp":1,"fn":1} or paired != {"candidate_only":2,"baseline_only":1}:
    raise RuntimeError("sample accounting changed")
if paired_delta != 1 or decision["paired_delta"] != paired_delta:
    raise RuntimeError("paired delta changed")
if repeat_range != 0.1 or contamination_hits != ["sample-002"] or decision["outcome"] != "defer":
    raise RuntimeError("repeat, contamination, or decision evidence changed")
print("run", run_identity)
for sample in samples:
    print("sample", sample)
print("intervals", small, large, "cm", cm)
print("paired", paired, "paired_delta", paired_delta, "repeat_range", repeat_range)
scan = {"method":"known-id overlap","hits":contamination_hits,"complete":False}
print("contamination", {**scan,"absence_claim_allowed":False})
print("decision",decision)
duplicate_samples = [*samples[:-1], {**samples[0]}]
omitted_samples = samples[:-1]
negative = [
    (validate_run,{key:value for key,value in run.items() if key != "scorer"}),
    (lambda counts:wilson(*counts),(11,10)),
    (lambda other:validate_comparison(run,other),{**candidate_run,"harness":"local-harness@revision:other"}),
    (assert_absence_claim,{"method":"known-id overlap","hits":[],"complete":False}),
    (validate_samples,duplicate_samples),
    (validate_samples,omitted_samples),
    (lambda record:validate_decision(record,paired_delta),{**decision,"paired_delta":paired_delta + 1}),
    (lambda record:validate_decision(record,paired_delta),{**decision,"reason":""}),
]
for action, bad in negative:
    try:
        action(bad)
    except ValueError as error:
        print("rejected:", error)
    else:
        raise RuntimeError("invalid benchmark record accepted")
```

{% note success flat %}
精确输出先打印含采样参数和精确 harness revision 的运行身份，再逐条打印 6 个字段完整且 ID 唯一的样本记录。区间为 `(0.49,0.943)` 与 `(0.711,0.867)`，混淆矩阵为 `tp=3,tn=1,fp=1,fn=1`；候选独赢 2、基线独赢 1，派生 `paired_delta=1`，重复范围 0.1。重叠命中 `sample-002`，因此决策记录为 `defer` 并要求在干净、版本化的 holdout 重跑。末尾按序拒绝运行字段缺失、非法计数、跨 harness 比较、由未命中声称无污染、重复/遗漏样本、错误配对差值和空决策理由。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
run {'model_snapshot': 'fixture-model-v1', 'data_version': 'holdout-v1@sha256:demo', 'prompt': 'p1', 'harness': 'local-harness@revision:fixture-2026-08-29.1', 'scorer': 'exact-match-1', 'sampling': {'temperature': 0, 'seeds': [1, 2, 3]}, 'baseline': 'rule-v1', 'run_date': '2026-08-29', 'failure_policy': 'failed request is incorrect'}
sample {'id': 'sample-001', 'gold': 1, 'prediction': 1, 'baseline_correct': 1, 'candidate_correct': 1}
sample {'id': 'sample-002', 'gold': 1, 'prediction': 0, 'baseline_correct': 0, 'candidate_correct': 1}
sample {'id': 'sample-003', 'gold': 1, 'prediction': 1, 'baseline_correct': 1, 'candidate_correct': 0}
sample {'id': 'sample-004', 'gold': 0, 'prediction': 1, 'baseline_correct': 0, 'candidate_correct': 0}
sample {'id': 'sample-005', 'gold': 0, 'prediction': 0, 'baseline_correct': 0, 'candidate_correct': 1}
sample {'id': 'sample-006', 'gold': 1, 'prediction': 1, 'baseline_correct': 1, 'candidate_correct': 1}
intervals (0.49, 0.943) (0.711, 0.867) cm {'tp': 3, 'tn': 1, 'fp': 1, 'fn': 1}
paired {'candidate_only': 2, 'baseline_only': 1} paired_delta 1 repeat_range 0.1
contamination {'method': 'known-id overlap', 'hits': ['sample-002'], 'complete': False, 'absence_claim_allowed': False}
decision {'candidate': 'candidate-model-v1', 'baseline': 'rule-v1', 'paired_delta': 1, 'contamination_hits': ['sample-002'], 'outcome': 'defer', 'reason': 'rerun on a clean versioned holdout'}
rejected: run metadata mismatch
rejected: invalid counts
rejected: incompatible run identities
rejected: contamination absence unsupported
rejected: sample IDs must be unique
rejected: sample records incomplete
rejected: paired delta mismatch
rejected: decision reason required
```
{% endfolding %}

## 失败边界

{% note warning flat %}
照搬排行榜选择模型；只报告平均分不报告样本、区间和失败；把没有检测到污染当成没有污染；跨 SWE-bench 数据变体或 harness major version 比分。还要固定提示变体和采样参数，对同一样本做配对比较；随机输出需重复运行。区间变窄不代表差异有业务意义，多次试模型、提示和指标还会放大偶然胜出。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 运行身份 | 模型、数据、prompt、harness 均固定 | 只写模型家族 |
| 统计证据 | 点估计、区间、错误类型齐全 | 十个样本排小数名次 |
| 外部有效性 | 业务分布有私有 holdout | 从公开集外推所有任务 |

## 结果验证

{% note success flat %}
预期输出应覆盖精确运行元数据、采样参数、样本级记录、区间、错误类型、配对结果、重复波动、污染检测范围和带原因的决策记录。迁移到业务评测时，要冻结 baseline、任务分布、prompt、harness revision、scorer 与重复次数；任何身份变化都另起运行，不跨版本直接比分。
{% endnote %}

- 点估计与区间一起报告。
- 污染只能报告检测证据，不能由“未发现”证明不存在。
- 公开 Benchmark 与私有 holdout 的结论分开。

## 常见问题

{% flashcard_ref id="a11-leaderboard-is-not-choice" %}

{% flashcard basic id:foundation-eval-version-record deck:"AI 与大模型基础" priority:1 tags:"Benchmark与评测,基础机制" %}
--- question
评测集需要记录哪些版本信息？
--- answer
记录模型快照、数据 revision、提示、harness、scorer、采样参数、失败策略和运行日期。
--- explanation
同名分数只有在运行身份一致时才可比较：

| 层 | 必须冻结 |
| --- | --- |
| 输入 | 数据 revision、样本选择、提示模板 |
| 执行 | 模型快照、harness、采样参数、seed |
| 判定 | scorer 版本、失败处理、运行日期 |

任一层变化都可能改变结果；只写 Benchmark 名称或模型家族不能复算。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link HELM, https://crfm.stanford.edu/helm/, https://www.stanford.edu/favicon.ico %}
{% link SWE-bench Verified, https://www.swebench.com/verified.html, https://www.swebench.com/favicon.ico %}
{% link Benchmark Contamination Survey, https://aclanthology.org/2024.naacl-long.482/, https://aclanthology.org/aclicon.ico %}
{% endlinkgroup %}

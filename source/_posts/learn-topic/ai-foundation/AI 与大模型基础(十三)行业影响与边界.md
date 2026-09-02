---
title: AI 与大模型基础(十三)行业影响与边界
tags:
  - AI 与大模型基础
  - 行业影响与边界
categories:
  - Learn Topic
  - AI 与大模型基础
description: 能分析 AI 的生产力收益、岗位变化、组织风险和负责任使用边界。
cover: /img/picgo-images/ai-foundation-course-cover.png
series: AI 与大模型基础
series_order: 13
published: false
abbrlink: a27b68e8
date: 2026-08-29 00:00:00
---

<!-- learn-topic-placeholder -->

{% course_series %}

{% note primary flat %}
本节要解决：把任务效率、团队负担、行业变化和劳动预测放回各自基线与人群，并为数据、责任、申诉、停止和恢复建立可执行门禁。
{% endnote %}

## 机制模型

<!-- concept-story:start -->

一个团队用 AI 生成代码和测试，提交速度上升，却把更多不稳定补丁推给两名评审。经理只看“每周合并数”会得到生产力提升；评审等待、返工和关键缺陷却显示收益从作者转移成了评审负担。团队于是把作者时间、评审时间、返工、缺陷和受影响用户放进同一基线，并规定关键回归出现就停用自动合并。

<!-- concept-story:end -->

{% note info flat %}
影响评估以任务、群体和组织为单位：收益要有基线，风险要有受影响人群与数据流，人工责任要有时间、能力、权限和申诉渠道。调查预测不是已发生事实，也不能把所有宏观变化归因于 AI。
{% endnote %}

{% mermaid %}
flowchart TD
  U[预期用途] --> B[基线与受影响群体]
  B --> R[收益和风险测量]
  R --> H[责任人/复核/申诉]
  H --> M[监控信号]
  M --> S{停止条件}
  S -->|触发| X[停用与恢复]
{% endmermaid %}

{% note primary flat %}
收益与风险使用同一任务基线，并把受影响群体、责任人和监控信号连接到可执行停止条件。没有申诉和恢复路径的流程不能只靠“人工复核”继续运行。
{% endnote %}

| 研究与人群 | 周期与基线 | 观察结果 | 混杂与不可外推 |
| --- | --- | --- | --- |
| GitHub Copilot 控制实验：95 名接受邀请的 Upwork 专业程序员完成 JavaScript HTTP server | 2022-05-15 至 2022-06-20；随机分组，有/无 Copilot | 处理组完成任务快 55.8%，95% CI 为 21%–89%；同时记录任务成功 | 接受邀请者和单一标准化任务限制代表性；不能证明团队交付、维护性或缺陷改善 |
| Noy 与 Zhang 预注册在线实验：453 名受过大学教育的专业人士完成职业写作任务 | 一次激励任务随机分组并盲评；论文于 2023-07-14 发表，2 周和 2 个月后追踪自报使用 | 平均完成时间减少 40%，盲评质量提高 18% | 随机分组不消除参与者与任务选择、短期测量和自报偏差；不能上推整份工作、长期原创性、事实准确性或团队净收益 |
| Brynjolfsson 等的企业部署研究：5,179 名客服人员、约 300 万次对话 | 企业分阶段引入，主要采用发生在 2020-11 至 2021-02；比较引入前后与未采用者 | 每小时解决问题数平均提高 14%，新手和低技能人员提高 34%，熟练人员影响很小 | 分阶段采用不是随机实验；采用时点、人员选择、单企业工具与指标仍限制行业和劳动力市场外推 |
| WEF Future of Jobs 2025：1,000 多家雇主、约 1,400 万劳动者、55 个经济体 | 雇主对 2025–2030 的预测，没有已实现结果基线 | 预期创造 1.7 亿、替代 9,200 万岗位，净增 7,800 万 | 雇主构成和预期会变化；这不是已实现就业，也不是 AI 单因果 |

{% note info flat %}
前三项证据分别观察个人编程任务、个人内容任务和企业客服流程。它们说明任务速度与质量可能改变，却都没有直接测量“团队净生产力”；团队采用还要把评审、返工、协调、客户结果和错误分布纳入同一周期。
{% endnote %}

| 场景 | 任务变化机制 | 受益与受影响方 | 最小验证与边界 |
| --- | --- | --- | --- |
| 软件 | 生成代码缩短首稿时间，把约束理解、评审和维护留给团队 | 作者可能提速；评审者、维护者和用户承担错误与返工 | 同时量作者/评审总时长、测试、缺陷和回滚；单题速度不等于团队吞吐 |
| 测试 | 生成用例扩大候选输入，但 Oracle、环境与失败归因仍需独立建立 | 测试人员获得草稿；开发者和用户承受假阳性、漏测与脆弱断言 | 用故障注入、变异测试和历史缺陷复放验证，不以用例数量代替检出能力 |
| 内容 | 文本草稿减少写作时间，但事实核验、署名、版权与编辑责任不会自动完成 | 作者和编辑可能提速；被引用者、创作者与读者受错误或挪用影响 | 保存盲评质量、事实错误、编辑时间和授权；在线实验不证明长期原创性 |
| 教育 | 即时反馈缩短等待，却可能代做推理或给出错误反馈 | 教师与学生可能节省反馈时间；学生承担依赖和隐私风险 | 用独立延迟测验、分组差异、教师复核和申诉评估，不以作业分数当学习增益 |
| 服务 | 助手检索并建议回复，把处理速度与经验传播到一线流程 | 新手与客户可能受益；熟练人员、质检员和客户承担错误与监控负担 | 同时量每小时解决数、一次解决率、客户结果、申诉和群体错误；单企业结果不等于行业因果 |

{% note info flat %}
偏差来自样本、标签、目标、阈值和部署反馈环；隐私风险来自超范围收集、提示/日志保留和二次用途。依赖与权力集中则来自关键模型、云、数据、接口和人才的迁移与议价约束。分别观察分组错误、删除/访问证据、供应商集中度、退出时间、数据可移植与替代演练；总平均值和“多一个 API”都不能证明风险或控制权已经分散。
{% endnote %}

{% note warning flat %}
WEF 数字是 2025–2030 的雇主预期；AI Index 汇总的采用与生产力研究也有不同样本、基线和混杂因素。它们用于限定问题，不替代当前组织自己的对照数据。
{% endnote %}

{% note warning flat %}
每条影响主张都要写清来源章节、研究人群、时间范围、基线与混杂因素。任务级效率不能直接上推为产品质量、组织利润或净就业；总量收益也不能掩盖收益和风险在群体间的分配。
{% endnote %}

## 核心边界

{% note info flat %}
为三个场景填写收益、基线、数据授权、责任人、可测监控、申诉、停止条件和恢复能力；程序从这些字段推导 `assist/defer/exclude/human-only`，不接受预先写好的决定。隐私披露只能止损，不能靠删除输出恢复保密状态。
{% endnote %}

{% folding purple, 展开机制辨析 %}
影响评估以任务、群体和组织为单位。决定关键字段出现 Unknown 时必须 defer；显著影响权利、机会、安全或生计的资格决定保持 `human-only`。人工复核只有在责任人拥有信息、能力、时间和否决权限，并且申诉、停止和恢复都可执行时才成立。
{% endfolding %}

## 本地实验

{% note info flat %}
下面的 Python 3 代码只使用标准库。输入在代码中冻结，关键动作有断言，输出可以在本地复算；没有凭据、网络请求或外部副作用。
{% endnote %}

```python
scenarios = [
 {"name":"test-assist","benefit":"review minutes/task","baseline":"manual-v1","affected":"developers/users",
  "allowed_data":"licensed test code","authorization_ref":"permit:test-code-v1","risk":"unsafe patch","impact":"reversible",
  "monitoring":{"signal":"critical regressions","measurable":True,"frequency":"per change"},
  "reviewer":"tech lead","reviewer_independent":True,"capability":"qualified","time":"before-action",
  "authority":"can-block","appeal":"independent",
  "stop_condition":{"signal":"critical regressions","operator":">=","threshold":1},
  "recovery":{"action":"revert commit","restores_prior_state":True,"privacy_exposure":False}},
 {"name":"education","benefit":"feedback hours/week","baseline":"teacher-v1","affected":"students/teachers",
  "allowed_data":"consented course work","authorization_ref":"permit:course-work-v1","risk":"factual error","impact":"reversible",
  "monitoring":{"signal":"factual errors","measurable":True,"frequency":"sampled weekly"},
  "reviewer":"teacher","reviewer_independent":True,"capability":"qualified","time":"before-action",
  "authority":"can-block","appeal":"independent",
  "stop_condition":{"signal":"factual errors","operator":">=","threshold":2},
  "recovery":{"action":"withdraw feedback and issue correction","restores_prior_state":True,"privacy_exposure":False}},
 {"name":"eligibility","benefit":"queue days","baseline":"casework-v1","affected":"applicants/case officers",
  "allowed_data":"legally authorized case fields","authorization_ref":"permit:case-fields-v1","risk":"rights/disparate error",
  "impact":"high-rights","monitoring":{"signal":"group error gap","measurable":True,"frequency":"weekly"},
  "reviewer":"case officer","reviewer_independent":True,"capability":"qualified","time":"before-action",
  "authority":"can-block","appeal":"independent",
  "stop_condition":{"signal":"group error gap","operator":">=","threshold":5},
  "recovery":{"action":"restore benefits","restores_prior_state":True,"privacy_exposure":False}},
]
required = {"name","benefit","baseline","affected","allowed_data","authorization_ref","risk","impact",
            "monitoring","reviewer","reviewer_independent","capability","time","authority","appeal",
            "stop_condition","recovery"}
text_fields = required - {"reviewer_independent","monitoring","stop_condition","recovery"}
allowed_enums = {
 "capability":{"qualified"}, "time":{"before-action"}, "authority":{"can-block"},
 "appeal":{"independent"}, "impact":{"reversible","high-rights","non-recoverable"},
}
authorizations = {
 "licensed test code":"permit:test-code-v1", "consented course work":"permit:course-work-v1",
 "legally authorized case fields":"permit:case-fields-v1",
}
monitor_policies = {
 "critical regressions":{"frequency":"per change","operator":">=","threshold":1},
 "factual errors":{"frequency":"sampled weekly","operator":">=","threshold":2},
 "group error gap":{"frequency":"weekly","operator":">=","threshold":5},
}
risk_policies = {
 "unsafe patch":{"impact":"reversible","action":"revert commit","privacy_exposure":False},
 "factual error":{"impact":"reversible","action":"withdraw feedback and issue correction","privacy_exposure":False},
 "rights/disparate error":{"impact":"high-rights","action":"restore benefits","privacy_exposure":False},
 "privacy disclosure":{"impact":"non-recoverable","action":"contain and notify","privacy_exposure":True},
}
unknown_sensitive = required - {"name"}

def decide(row):
    if set(row) != required:
        raise ValueError("responsibility field mismatch")
    if any(row[field] == "Unknown" for field in unknown_sensitive):
        return "defer"
    if any(not isinstance(row[field],str) or not row[field] for field in text_fields):
        raise ValueError("responsibility text invalid")
    for field,values in allowed_enums.items():
        if row[field] not in values:
            raise ValueError(f"invalid {field}")
    if not isinstance(row["reviewer_independent"],bool):
        raise ValueError("reviewer independence type invalid")
    if authorizations.get(row["allowed_data"]) != row["authorization_ref"]:
        return "exclude"
    monitoring = row["monitoring"]
    if (not isinstance(monitoring,dict) or set(monitoring) != {"signal","measurable","frequency"}
            or not isinstance(monitoring["signal"],str) or not monitoring["signal"]
            or not isinstance(monitoring["frequency"],str) or not monitoring["frequency"]
            or not isinstance(monitoring["measurable"],bool)):
        raise ValueError("monitoring schema invalid")
    stop = row["stop_condition"]
    if (not isinstance(stop,dict) or set(stop) != {"signal","operator","threshold"}
            or stop["signal"] != monitoring["signal"] or stop["operator"] not in {">=",">","=="}
            or not isinstance(stop["threshold"],(int,float)) or stop["threshold"] <= 0):
        raise ValueError("stop condition not executable")
    monitor_policy = monitor_policies.get(monitoring["signal"])
    if monitor_policy is None:
        raise ValueError("monitoring signal not approved")
    if monitoring["measurable"] and (monitoring["frequency"] != monitor_policy["frequency"]
            or stop["operator"] != monitor_policy["operator"] or stop["threshold"] != monitor_policy["threshold"]):
        raise ValueError("monitoring policy mismatch")
    recovery = row["recovery"]
    if (not isinstance(recovery,dict) or set(recovery) != {"action","restores_prior_state","privacy_exposure"}
            or not isinstance(recovery["action"],str) or not recovery["action"]
            or not isinstance(recovery["restores_prior_state"],bool)
            or not isinstance(recovery["privacy_exposure"],bool)):
        raise ValueError("recovery schema invalid")
    risk_policy = risk_policies.get(row["risk"])
    if risk_policy is None or row["impact"] != risk_policy["impact"]:
        raise ValueError("risk policy mismatch")
    if recovery["action"] != risk_policy["action"] or recovery["privacy_exposure"] != risk_policy["privacy_exposure"]:
        raise ValueError("recovery policy mismatch")
    if (row["impact"] in {"high-rights","non-recoverable"} or recovery["privacy_exposure"]
            or not recovery["restores_prior_state"]):
        return "human-only"
    if not monitoring["measurable"] or not row["reviewer_independent"]:
        return "defer"
    return "assist"

results = [(row["name"],decide(row),row["stop_condition"],row["recovery"]["action"]) for row in scenarios]
expected = [
 ("test-assist","assist",{"signal":"critical regressions","operator":">=","threshold":1},"revert commit"),
 ("education","assist",{"signal":"factual errors","operator":">=","threshold":2},
  "withdraw feedback and issue correction"),
 ("eligibility","human-only",{"signal":"group error gap","operator":">=","threshold":5},"restore benefits"),
]
if results != expected:
    raise RuntimeError("impact decision changed")
print("results", results)

deferred_fields = []
for field in sorted(unknown_sensitive):
    if decide({**scenarios[0],field:"Unknown"}) != "defer":
        raise RuntimeError(f"Unknown {field} was approved")
    deferred_fields.append(field)
print("deferred",deferred_fields)
negative = [
    {key:value for key,value in scenarios[0].items() if key != "stop_condition"},
    {**scenarios[0],"capability":"unqualified"},
    {**scenarios[0],"time":"after-action"},
    {**scenarios[0],"authority":"advisory-only"},
    {**scenarios[0],"appeal":"none"},
    {**scenarios[0],"impact":"medium-ish"},
    {**scenarios[0],"monitoring":{"signal":"critical regressions","measurable":True}},
]
for bad in negative:
    try:
        decide(bad)
    except ValueError as error:
        print("rejected:",error)
    else:
        raise RuntimeError("invalid responsibility record accepted")
unauthorized = {**scenarios[0],"allowed_data":"unapproved personal data"}
unmeasurable = {**scenarios[0],"monitoring":{**scenarios[0]["monitoring"],"measurable":False}}
nonrecoverable = {**scenarios[0],"recovery":{**scenarios[0]["recovery"],"restores_prior_state":False}}
privacy_exposure = {**scenarios[1],"risk":"privacy disclosure","impact":"non-recoverable","recovery":{
                    "action":"contain and notify","restores_prior_state":False,"privacy_exposure":True}}
independent_review = {**scenarios[0],"reviewer_independent":False}
privacy_delete_output = {**privacy_exposure,"recovery":{
                    "action":"delete output","restores_prior_state":True,"privacy_exposure":True}}
semantic_negatives = [("authorization",unauthorized,"exclude"),("monitoring",unmeasurable,"defer"),
                      ("recovery",nonrecoverable,"human-only"),("privacy",privacy_exposure,"human-only"),
                      ("independence",independent_review,"defer")]
for label,row,expected_outcome in semantic_negatives:
    outcome = decide(row)
    if outcome != expected_outcome or outcome == "assist":
        raise RuntimeError(f"unsafe {label} record approved")
    print(label + "-negative",outcome)
try:
    decide(privacy_delete_output)
except ValueError as error:
    if str(error) != "recovery policy mismatch":
        raise RuntimeError(f"unexpected privacy recovery error: {error}")
    print("privacy-recovery-rejected",error)
else:
    raise RuntimeError("delete output recovery accepted")
```

{% note success flat %}
精确输出给出 `test-assist/assist`、`education/assist`、`eligibility/human-only` 及可执行停止阈值与恢复动作；除名称外的每个责任与证据字段为 Unknown 都进入 defer。结构负例拒绝缺少停止条件、无效能力/时点/权限/申诉/影响和不完整监控；语义负例证明未授权数据只能 exclude，不可测监控只能 defer，不可恢复错误与隐私披露只能 human-only，不独立复核只能 defer，`delete output` 隐私恢复动作直接拒绝，均不能返回 assist。
{% endnote %}

{% folding blue, 展开精确标准输出 %}
```text
results [('test-assist', 'assist', {'signal': 'critical regressions', 'operator': '>=', 'threshold': 1}, 'revert commit'), ('education', 'assist', {'signal': 'factual errors', 'operator': '>=', 'threshold': 2}, 'withdraw feedback and issue correction'), ('eligibility', 'human-only', {'signal': 'group error gap', 'operator': '>=', 'threshold': 5}, 'restore benefits')]
deferred ['affected', 'allowed_data', 'appeal', 'authority', 'authorization_ref', 'baseline', 'benefit', 'capability', 'impact', 'monitoring', 'recovery', 'reviewer', 'reviewer_independent', 'risk', 'stop_condition', 'time']
rejected: responsibility field mismatch
rejected: invalid capability
rejected: invalid time
rejected: invalid authority
rejected: invalid appeal
rejected: invalid impact
rejected: monitoring schema invalid
authorization-negative exclude
monitoring-negative defer
recovery-negative human-only
privacy-negative human-only
independence-negative defer
privacy-recovery-rejected recovery policy mismatch
```
{% endfolding %}

## 失败边界

{% note warning flat %}
把生产力提升写成无条件收益；把 WEF 的净就业预测称为 AI 单独创造的岗位；用 NIST 自愿框架替代适用法律；让无权推翻模型的人承担形式审查。
{% endnote %}

| 检查项 | 通过证据 | 失败信号 |
| --- | --- | --- |
| 收益 | 有任务基线、周期与受益群体 | 只写百分比 |
| 责任 | 负责人有信息、能力、时间与权限 | 只写人工复核 |
| 退出 | 申诉、停用、恢复可执行 | 没有停止条件 |

## 结果验证

{% note success flat %}
预期程序从场景字段推导两个 `assist` 和一个 `human-only`，让所有责任与证据字段的 Unknown 进入 defer，并拒绝缺字段与非法影响等级。`assist` 还要求数据已授权、监控信号可测、停止阈值可执行、复核独立且恢复确实能还原状态；不独立复核只能 defer，隐私披露不能满足最后一项，`delete output` 恢复动作会以 `recovery policy mismatch` 拒绝。真实部署还要把每条收益和风险绑定研究人群、周期、基线、受影响分布与适用法律。
{% endnote %}

- 任务、产品、组织和劳动力层级不跨层外推。
- 责任人具备信息、能力、时间和权限。
- 申诉、停用与恢复路径必须可执行。

## 常见问题

{% flashcard basic id:foundation-automation-accountability deck:"AI 与大模型基础" priority:2 tags:"行业影响与边界,基础机制" %}
--- question
怎样同时记录自动化收益与责任边界？
--- answer
为同一任务保存基线、收益指标、受影响群体、允许数据、责任人、复核权限、申诉、监控和停止条件。
--- explanation
收益与风险使用同一行记录：

| 收益侧 | 责任侧 |
| --- | --- |
| 任务基线、周期、受益群体 | 受影响群体、允许数据、风险 |
| 时间/质量变化 | 监控、责任人权限、申诉 |
| 继续条件 | 停止条件与恢复动作 |

任何自动动作都必须追到有权否决的人。
{% endflashcard %}

{% flashcard basic id:foundation-human-only-decision deck:"AI 与大模型基础" priority:2 tags:"行业影响与边界,基础机制" %}
--- question
哪些决策不应只交给模型？
--- answer
会显著影响权利、机会、安全或生计，且错误难以发现、纠正或申诉的决策。
--- explanation
具体禁止范围取决于司法辖区和行业法规。最小判断流是：

`显著权利/安全影响 → 独立证据 → 有权人工决定 → 告知与申诉 → 持续监控 → fail-safe 恢复`

其中任一步缺失或错误难以发现时，保持人工决策；“有人点确认”不等于有效监督。
{% endflashcard %}

## 参考资料

{% linkgroup %}
{% link GitHub Copilot Productivity Study, https://arxiv.org/abs/2302.06590v1, https://arxiv.org/favicon.ico %}
{% link Experimental Evidence on Writing Productivity, https://www.science.org/doi/10.1126/science.adh2586, https://www.science.org/favicon.ico %}
{% link Generative AI at Work, https://www.nber.org/papers/w31161, https://www.nber.org/favicon.ico %}
{% link Stanford AI Index 2025, https://hai.stanford.edu/ai-index/2025-ai-index-report/economy, https://hai.stanford.edu/favicon.ico %}
{% link Future of Jobs 2025 — Jobs Outlook, https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/2-jobs-outlook/, https://www.weforum.org/favicon.ico %}
{% link NIST AI RMF, https://www.nist.gov/itl/ai-risk-management-framework, https://www.nist.gov/themes/custom/nist_www/favicon.ico %}
{% endlinkgroup %}

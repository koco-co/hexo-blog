---
title: AI 编程工作流插件选型指南
tags:
  - AI编程
  - Coding Agent
  - 软件工程
categories:
  - AI开发
description: '对比 8 个超过一万 Star 的 AI 编程工作流项目, 逐项解释 Skills、需求到交付的流程、优势与限制, 帮助开发者按实际场景选择。'
abbrlink: df8a8a9e
date: 2026-08-27 16:24:15
---

一个 PR 可以编译通过、测试全绿, 同时仍然做错需求。测试只覆盖了实现者选择的路径, 规格中的异常行为没有进入任务列表, 讨论中已经否决的方案又被带回代码。这些问题很难靠一句“请遵循最佳实践”解决。

Coding Agent 工作流插件试图把这些容易遗漏的环节固定下来: 哪些问题必须在编码前决定, 实现依据保存在哪里, 谁检查代码与需求是否一致, 完成声明需要哪些证据。它们的差异也在这里。都有 plan、review 和 test, 不代表对开发过程施加了相同的约束。

纳入比较的 8 个项目均超过 10,000 Star, 包括原生插件、具有完整开发主线的 Skills 套件, 以及向 Agent 分发指令的规格工具。通用工具合集、资源导航和独立 Agent 客户端不在讨论范围内。

选型的起点是项目最常发生的返工: 业务规则没有决定, 需要改善需求讨论; 规则已经明确却没有被实现, 需要约束执行; 相同问题反复出现, 则需要保留并复用工程经验。

{% note info flat %}
Star 用于筛选社区关注度。功能和流程以官方文档、分发清单及 Skill 源文件为依据; 选型结论是对这些机制的分析, 不代表在统一项目、模型和环境下的性能排名。
{% endnote %}

## 开发流程

开发流程的差距经常出现在阶段交接处: 需求没有进入任务, 任务完成后没有回归, 审查问题尚未处理便开始交付。比较插件时, 应看这些交接怎样发生、凭什么进入下一阶段。

{% mermaid %}
flowchart TD
    A[需求澄清: 目标与边界] --> B[设计与规格: 行为和约束]
    B --> C[任务拆分: 小步与依赖]
    C --> D[实现: 代码与测试]
    D --> E[验证与审查: 证据和风险]
    E --> F[交付与沉淀: PR 和项目知识]
    E -->|发现偏差| C
    F -->|下一轮需求| A
{% endmermaid %}

流程可以概括为: **需求澄清 → 设计与规格 → 任务拆分 → 实现 → 验证与审查 → 交付与沉淀**。各项目对这条流程的投入并不均衡: Spec Kit、OpenSpec 更突出规格的组织和演进; Superpowers 更突出实施与验证纪律; BMAD 展开产品和技术决策; Compound 则把已解决问题重新送入后续开发。

Skill、宿主 Agent 和检查工具各负其责。Skill 描述工作方法, 宿主提供文件、终端和子 Agent 等能力, 测试与构建工具产生结果。评价某个工作流是否有效, 要看这些步骤是否实际执行, 不能只看指令中是否写了“必须验证”。

| 名称 | 实际含义 | 阅读清单时的注意点 |
| --- | --- | --- |
| Skill | 一组可复用的任务指令, 常以 `SKILL.md` 为入口 | 可能包含脚本和引用文件, 不等于一段提示词 |
| Command | 用户显式启动流程的命令入口 | 一个命令可能对应一个 Skill, 也可能协调多个 Skill |
| Agent | 执行任务的角色或独立上下文 | “扮演架构师”不自动等于启动一个独立子 Agent |

清单因此区分 Skill、命令和角色, 不把兼容别名或客户端镜像重复算作新能力。名称链接到对应源文件, 可以直接检查其输入、执行步骤和停止条件。

## 插件概览

按 Star 数排列, 八个项目分别把重点放在规格、执行、产品交付或工程知识积累上。

| 项目与仓库 | Stars | 最突出的工作流重心 |
| --- | ---: | --- |
| [Superpowers](https://github.com/obra/superpowers) | 278,309 | 设计、计划、TDD、审查和完成前验证 |
| [Matt Pocock Skills](https://github.com/mattpocock/skills) | 238,336 | 追问决策、规格与工单、可接续的工程实现 |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | 131,765 | 原则、规格、技术方案、任务之间的可追溯关系 |
| [gstack](https://github.com/garrytan/gstack) | 129,934 | 产品评审、浏览器 QA、PR 与上线后检查 |
| [Addy Osmani Agent Skills](https://github.com/addyosmani/agent-skills) | 90,126 | 从规格到交付的工程实践, 包括性能、安全和可观测性 |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | 66,386 | 以一次变更为单位维护提案、增量规格和实现任务 |
| [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 52,366 | 产品、架构、UX、开发等视角协作与项目交付 |
| [Compound Engineering](https://github.com/EveryInc/compound-engineering-plugin) | 24,587 | 计划、执行、审查, 再把解决经验反馈给下一轮开发 |

各节先讨论工作机制和采用成本, Skills 表保留完整分发清单。辅助能力与兼容入口折叠展示, 便于按名称查阅。

## Superpowers

### 实施与验证

Superpowers 的核心是把实施计划、任务执行和审查连接起来。它对开发过程的要求比较具体: 设计先经过确认, 计划拆到可执行步骤, 行为修改通过 TDD 推进, 完成前重新运行对应验证。对于已经知道要做什么、却经常在实施细节上失控的项目, 这种约束比继续扩充需求文档更直接。

常见路径是 `brainstorming` → `using-git-worktrees` → `writing-plans` → `subagent-driven-development`。如果没有合适的子 Agent 能力, 则通过 `executing-plans` 执行已有计划。TDD、调试与验证贯穿实施, 最后由 `finishing-a-development-branch` 处理分支收尾。[工作流入口](https://github.com/obra/superpowers/blob/v6.3.0/README.md)

v6.3.0 的子 Agent 流程为每项任务分配新的实施上下文, 任务审查同时检查规格符合性与代码质量, 全部任务结束后再做整条分支的审查。局部任务正确, 不代表集成后的行为也正确, 最后一轮检查正是为了补上这个差距。[任务与分支审查](https://github.com/obra/superpowers/blob/v6.3.0/skills/subagent-driven-development/SKILL.md)

`verification-before-completion` 则约束结果表达: 编译成功不能推导出测试通过, 测试通过也不能直接推导出全部需求已满足。它要求把每一项完成声明对应到实际检查, 而非接受实施 Agent 的自述。[完成前验证](https://github.com/obra/superpowers/blob/v6.3.0/skills/verification-before-completion/SKILL.md)

### Skills 清单

v6.3.0 包含 14 个 Skills。前 12 个覆盖日常开发, 最后两个负责套件使用与 Skill 本身的建设。

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [brainstorming](https://github.com/obra/superpowers/blob/v6.3.0/skills/brainstorming/SKILL.md) | 开始新功能或行为改动前 | 追问目标、约束和备选设计, 形成经确认的设计方案, 再进入实现计划。 |
| [using-git-worktrees](https://github.com/obra/superpowers/blob/v6.3.0/skills/using-git-worktrees/SKILL.md) | 需要隔离开发现场时 | 选择独立工作区, 检查仓库状态和测试基线, 避免与当前修改混在一起。 |
| [writing-plans](https://github.com/obra/superpowers/blob/v6.3.0/skills/writing-plans/SKILL.md) | 已有设计或明确规格时 | 拆出具体文件、实施步骤和验证动作, 形成可以交给下一执行阶段的计划。 |
| [subagent-driven-development](https://github.com/obra/superpowers/blob/v6.3.0/skills/subagent-driven-development/SKILL.md) | 同一会话执行可拆分计划时 | 每项任务使用新的实施上下文, 任务审查同时检查规格与质量, 最后审查整条分支。 |
| [executing-plans](https://github.com/obra/superpowers/blob/v6.3.0/skills/executing-plans/SKILL.md) | 在另一会话执行已有计划时 | 先审查计划, 再逐项实施与验证; 遇到阻塞时停止, 全部完成后进入分支收尾。 |
| [test-driven-development](https://github.com/obra/superpowers/blob/v6.3.0/skills/test-driven-development/SKILL.md) | 新行为或 Bug 修复时 | 先观察测试失败, 再写最少实现, 最后重构, 保持红绿重构循环。 |
| [systematic-debugging](https://github.com/obra/superpowers/blob/v6.3.0/skills/systematic-debugging/SKILL.md) | 测试失败或行为异常时 | 复现问题、收集证据、定位原因并验证假设, 避免连续猜测式修补。 |
| [requesting-code-review](https://github.com/obra/superpowers/blob/v6.3.0/skills/requesting-code-review/SKILL.md) | 任务完成或准备集成时 | 把改动、要求和范围交给审查者, 获取可以执行的反馈。 |
| [receiving-code-review](https://github.com/obra/superpowers/blob/v6.3.0/skills/receiving-code-review/SKILL.md) | 收到审查意见时 | 理解并验证反馈, 处理合理问题, 对不适用建议说明技术依据。 |
| [dispatching-parallel-agents](https://github.com/obra/superpowers/blob/v6.3.0/skills/dispatching-parallel-agents/SKILL.md) | 存在互不依赖的问题时 | 分派独立任务并收集结果; 共享状态或依赖紧密的工作不宜直接并行。 |
| [verification-before-completion](https://github.com/obra/superpowers/blob/v6.3.0/skills/verification-before-completion/SKILL.md) | 准备宣称修复或完成时 | 实际运行对应检查, 阅读结果, 让完成声明与本次证据相匹配。 |
| [finishing-a-development-branch](https://github.com/obra/superpowers/blob/v6.3.0/skills/finishing-a-development-branch/SKILL.md) | 实现和测试结束时 | 检查状态后提供合并、PR、保留或放弃等收尾路径, 按选择处理分支。 |

{% folding blue, 套件与 Skill 维护 %}

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [using-superpowers](https://github.com/obra/superpowers/blob/v6.3.0/skills/using-superpowers/SKILL.md) | 开始处理任务时 | 识别应加载的 Skills 及其使用规则, 负责流程入口与路由。 |
| [writing-skills](https://github.com/obra/superpowers/blob/v6.3.0/skills/writing-skills/SKILL.md) | 新建或修改 Skill 时 | 编写并测试 Skill 指令, 检查其是否真的改变 Agent 行为。 |

{% endfolding %}

### 使用取舍

Superpowers 的优势集中在需求明确之后。它适合已有代码库中的功能开发、重构和缺陷修复, 尤其适合将“实现后统一看看”改成逐任务检查。任务之间能够划清边界时, 新上下文也更容易围绕有限目标工作。

代价来自任务交接和审查。跨模块高度耦合的修改若被过度拆分, 每个执行者都要重新理解同一套约束, 协调成本可能超过并行收益。业务规则仍需在设计阶段确认, 不能指望后续代码审查替团队决定需求。

## Matt Pocock

### 决策与工单

Matt Pocock Skills 更重视编码之前的决策质量。`grill-with-docs` 会持续追问并维护 `CONTEXT.md` 与 ADR, 将讨论中的约定保留下来。这里的 ADR 是架构决策记录, 不只写选了哪个方案, 也让后续执行者能够理解取舍。

主流程有一个明确分支: 能在当前会话完成的小任务直接进入 `implement`; 需要跨会话推进的工作, 则先经过 `to-spec` → `to-tickets`, 再逐个实施。工单按能够验证的纵向功能切片拆分, 并声明阻塞关系, 从而减少执行者对整段聊天记录的依赖。[官方流程](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/ask-matt/SKILL.md)

这套方法对上下文的处理也有区分。需求追问、规格和工单生成尽量沿用同一段讨论, 保留推理的连续性; 进入每张工单的实施时再使用新的上下文。单独做技术试验时, 通过 `prototype` 和 `handoff` 带回结论, 不把试验代码直接视为正式实现。

因此, 它适合处理“讨论似乎已经说清楚, 换个会话又解释一遍”的协作问题。`implement` 内部驱动 TDD, 并在提交前从工程标准与规格两方面审查差异; 需求分析与工程实施并没有被割裂成两套独立工具。

### Skills 清单

这里按插件 v1.2.3 的分发清单列出 **25 个 Skills: 18 个 engineering, 7 个 productivity**。仓库里的实验目录与其他零散 Skill 没有因此全部算进插件。[插件清单](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/.claude-plugin/plugin.json)

先看需求、研究和决策:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [ask-matt](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/ask-matt/SKILL.md) | 不确定下一步该用什么时 | 解释这套工程流程, 根据项目状态选择合适的 Skill 和衔接路径。 |
| [setup-matt-pocock-skills](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/setup-matt-pocock-skills/SKILL.md) | 首次在项目中使用时 | 配置工单系统、标签和文档习惯, 让后续流程遵循同一项目约定。 |
| [grill-with-docs](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/grill-with-docs/SKILL.md) | 需要长期保留需求讨论时 | 在工作目录中逐项追问, 将决策维护到上下文和 ADR 等文档。 |
| [wayfinder](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/wayfinder/SKILL.md) | 大型且模糊的工作开始前 | 梳理未知、决策和探索路径, 产出方向图; 不直接等同于实施计划。 |
| [research](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/research/SKILL.md) | 需要资料支撑技术选择时 | 优先查找一手资料并形成研究结论, 为后续决策提供依据。 |
| [prototype](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/prototype/SKILL.md) | 需要验证具体技术假设时 | 用隔离的试验回答问题, 记录发现; 试验代码不自动成为正式实现。 |
| [domain-modeling](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/domain-modeling/SKILL.md) | 业务概念混乱或边界不清时 | 澄清领域术语、模型和关键区别, 减少同词异义导致的设计偏差。 |
| [to-spec](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/to-spec/SKILL.md) | 决策足够明确且需跨会话时 | 将讨论整理为可实施规格, 固定范围、行为和验收要求。 |
| [to-tickets](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/to-tickets/SKILL.md) | 规格需要分批落地时 | 拆成可验证的纵向工单, 说明阻塞关系与实施顺序。 |

实现与维护部分:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [implement](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/implement/SKILL.md) | 已有工单、规格或明确小任务时 | 执行修改并结合 TDD 与审查, 将要求变成可以检查的代码结果。 |
| [tdd](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/tdd/SKILL.md) | 增加行为或修复缺陷时 | 通过行为测试驱动实现, 以小步红绿循环控制改动范围。 |
| [code-review](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/code-review/SKILL.md) | 实现完成后 | 分别检查工程标准与规格符合性, 避免代码漂亮却做错需求。 |
| [diagnosing-bugs](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/diagnosing-bugs/SKILL.md) | 已知异常尚未定位时 | 优先建立短反馈回路和失败复现, 验证原因并补回归保护。 |
| [triage](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/triage/SKILL.md) | 收到原始问题或外部 PR 时 | 分类、补全信息并决定处理路径; 不把已生成的实施工单重新当原始线索。 |
| [codebase-design](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/codebase-design/SKILL.md) | 讨论模块与接口设计时 | 提供模块深度、边界和接口设计原则, 支持结构判断而非代替整个执行流程。 |
| [improve-codebase-architecture](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/improve-codebase-architecture/SKILL.md) | 现有代码难以维护时 | 识别浅模块、耦合与重构机会, 形成便于讨论的架构改进报告。 |
| [resolving-merge-conflicts](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/resolving-merge-conflicts/SKILL.md) | 分支合并发生冲突时 | 结合两侧修改意图解决冲突, 避免只按文本选择一边。 |
| [wizard](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/wizard/SKILL.md) | 下一步必须由人操作时 | 生成可跟随的人类操作步骤, 用于账号、凭据、基础设施等 Agent 无法代办的动作。 |

{% folding blue, 沟通与交接 Skills %}

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [grill-me](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grill-me/SKILL.md) | 临时讨论想法时 | 追问关键假设与决策, 不要求建立持久化的讨论目录。 |
| [grilling](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling/SKILL.md) | 需要结构化追问方法时 | 提供共享的追问过程, 支撑其他讨论型 Skills。 |
| [handoff](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/handoff/SKILL.md) | 换会话、工具或协作者时 | 整理任务状态、决策和下一步, 减少接手者重新推断上下文。 |
| [teach](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/teach/SKILL.md) | 需要理解知识而非立即实现时 | 用教学方式解释概念和推理过程, 帮助使用者自己作判断。 |
| [to-questionnaire](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/to-questionnaire/SKILL.md) | 缺少外部人员的决定时 | 把未解决问题转成可交给相关人的问卷, 收集后再推进。 |
| [wait-what](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/wait-what/SKILL.md) | 当前解释难以理解时 | 重新解释、澄清术语和推理, 修复沟通断点。 |
| [writing-for-agents](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/writing-for-agents/SKILL.md) | 编写供 Agent 使用的文档时 | 让指令和上下文清晰、可行动, 降低歧义及无关信息。 |

{% endfolding %}

### 使用取舍

Matt Pocock Skills 的价值取决于决策能否沉淀为可独立执行的工单。一张工单需要交代行为、依赖和验收条件; 只写“按刚才讨论的做”, 就无法支持新的执行上下文。

相比 Superpowers, 选择它的理由通常是需要更深入的需求追问与跨会话交接, 而不只是增加测试纪律。追问也有成本: 已经形成稳定规格的任务, 可以直接实施, 没必要重新审问每个决定。`grill-me`、`teach` 等辅助入口适合临时讨论, 不应全部加入产品交付的必经流程。

## GitHub Spec Kit

### 规格与一致性

Spec Kit 把开发依据组织成几类相互关联的产物: constitution 约束项目原则, `spec.md` 描述功能行为, `plan.md` 记录技术方案, `tasks.md` 指导实施。它让需求审查可以发生在代码出现之前, 也让代码审查有一份相对稳定的参照。

完整路径可写作 `constitution` → `specify` → `clarify` → `plan` → `tasks` → `analyze` → `implement` → `converge`。其中 clarify 消除关键歧义, analyze 检查产物间的矛盾与遗漏, converge 在实施后把尚未完成的要求追加到任务文件, 再交回 implement。[内置流程](https://github.com/github/spec-kit/blob/v1.0.1/README.md)

例如规格要求“只能导出当前用户有权查看的订单”, 计划和任务却只安排查询与 CSV 生成, 权限约束就可能在阶段交接时丢失。跨产物分析应检查这种覆盖缺口。它能够帮助审查需求如何进入实施, 但仍需要实际的越权用例验证代码行为。[analyze 的检查范围](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/analyze.md)

`checklist` 同样容易被误读。它检查的是需求是否完整、明确、可判断, 并非调用测试框架运行用例。这使 Spec Kit 更接近一套规格与实施的协作协议, 实际测试仍由项目工具完成。

### 命令与 Skills

v1.0.1 的 **10 个内置入口**来自命令模板, 可按客户端生成命令或 Skill。`/speckit.plan` 与 `speckit-plan` 是同一类工作的不同入口表示, 不应重复计算。扩展、预设和外部工作流不并入下面的内置清单。

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [speckit-constitution](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/constitution.md) | 项目建立或原则调整时 | 定义必须遵循的工程原则和治理约束, 为后续规格与实现提供共同尺度。 |
| [speckit-specify](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/specify.md) | 收到功能需求时 | 形成用户场景、功能要求和成功标准, 优先描述需要的行为。 |
| [speckit-clarify](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/clarify.md) | 规格仍存在歧义时 | 找出会影响实现的缺口, 通过问题补全规格中的决定。 |
| [speckit-plan](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/plan.md) | 规格已足够明确时 | 结合技术约束形成实施方案, 按需产出研究、数据模型及接口契约。 |
| [speckit-tasks](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/tasks.md) | 需要进入实施时 | 根据方案拆分有依赖顺序的任务, 明确实施与检查工作。 |
| [speckit-analyze](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/analyze.md) | 任务生成后、实现前 | 检查规格、计划和任务的矛盾、遗漏与覆盖关系, 输出一致性问题。 |
| [speckit-checklist](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/checklist.md) | 检查需求描述质量时 | 生成并使用需求质量清单, 关注清楚、完整和可判断; 不是运行软件测试。 |
| [speckit-implement](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/implement.md) | 任务已就绪时 | 按任务推进代码修改与相关检查, 更新实施进展。 |
| [speckit-converge](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/converge.md) | implement 已执行、需核对剩余工作时 | 对照规格、计划与当前代码, 只向 tasks.md 追加差距任务; 不修改产品代码或重写原任务。 |
| [speckit-taskstoissues](https://github.com/github/spec-kit/blob/v1.0.1/templates/commands/taskstoissues.md) | 团队要在 GitHub 跟踪任务时 | 将任务转换成 GitHub Issues, 涉及对外写入, 需要对应仓库权限。 |

### 使用取舍

当团队需要讨论需求、审查方案并追溯实施依据时, Spec Kit 的文档结构很有价值。尤其是多人接手同一功能, 明确的规格比散落在聊天记录中的要求更容易核对。

成本也来自这些相互关联的文件。需求发生变化后, 规格、计划和任务需要共同调整; 只改一份文件, 一致性就会下降。对于范围很小、验收条件已经写在 Issue 中的修复, 再生成全套产物可能只是增加维护负担。选用它之前, 应确定这些产物会由谁持续维护。

## gstack

### 评审与产品交付

gstack 把产品评审、设计评审、浏览器检查和交付操作放进同一个工作流。它的 CEO、工程师、设计师等名称对应不同审查视角: 产品评审讨论范围和值得解决的问题, 工程评审检查架构和失败路径, 设计评审关注交互与视觉。角色名称有助于切换关注点, 并不意味着已经获得相应岗位的专业判断。

开发通常从 `office-hours` 或 `spec` 开始, 经计划评审后交给宿主 Agent 实现, 再进入 `review` 与 `qa`。`autoplan` 可以协调多种计划评审, 但实现后的运行检查仍是另一项工作。[套件工作流](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/README.md)

gstack 对 Web 产品的吸引力在浏览器这一环。接口测试通过, 仍可能存在错误的按钮状态、窄屏布局或无法完成的登录路径。`qa` 检查并修复运行中的产品, `qa-only` 只报告问题; `plan-design-review` 评审设计方案, `design-review` 检查已实现界面。这些入口检查的对象不同, 不应相互替代。

交付也分两层: `ship` 包含测试、差异审查、版本与变更记录、提交、推送及 PR; `land-and-deploy` 才继续处理合入和部署, `canary` 检查上线后的信号。区分这些步骤, 才能判断一次“交付完成”究竟停在哪个环境。[ship 的执行范围](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/ship/SKILL.md)

### Skills 清单

仓库安装脚本会扫描顶层 Skill 目录。这里列出 **53 个顶层 Skills**, 另列根目录的 **gstack 路由 Skill**, 不把其他客户端的镜像再算一遍。实际可用的能力仍受浏览器、设备、服务和宿主工具支持限制。[安装脚本](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/setup)

产品与方案阶段:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [office-hours](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/office-hours/SKILL.md) | 产品方向还不明确时 | 追问用户、问题与价值, 挑战最初方案, 收敛值得构建的方向。 |
| [spec](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/spec/SKILL.md) | 需要把意图交给执行阶段时 | 将想法转成明确、可执行的规格, 减少实现阶段自由补全需求。 |
| [plan-ceo-review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/plan-ceo-review/SKILL.md) | 审查产品与范围时 | 从产品价值和业务方向检查方案, 讨论应扩大、收缩还是维持范围。 |
| [plan-eng-review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/plan-eng-review/SKILL.md) | 编码前检查技术方案时 | 审查架构、数据流、边界情况和测试设计, 发现执行前的工程风险。 |
| [plan-design-review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/plan-design-review/SKILL.md) | 设计还停留在计划中时 | 检查界面、交互和体验方案, 在实现前提出设计改进。 |
| [plan-devex-review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/plan-devex-review/SKILL.md) | 计划涉及开发者产品时 | 审查接入、API、文档与使用路径, 提前发现开发者体验问题。 |
| [autoplan](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/autoplan/SKILL.md) | 希望集中完成多视角评审时 | 按决策原则协调产品、设计、工程和开发者体验评审, 汇总可执行方案。 |
| [design-consultation](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/design-consultation/SKILL.md) | 尚无统一视觉方向时 | 梳理产品背景并建立设计系统, 约定风格、组件与视觉规则。 |
| [design-shotgun](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/design-shotgun/SKILL.md) | 需要比较不同设计方向时 | 生成多种视觉方案供选择, 可能依赖外部图像服务。 |
| [design-html](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/design-html/SKILL.md) | 已选定视觉方案时 | 将选中的设计转成可运行的 HTML/CSS 表达, 作为后续实现基础。 |
| [diagram](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/diagram/SKILL.md) | 复杂结构难以用文字解释时 | 生成可编辑的 Excalidraw 图及 SVG/PNG 等交付物。 |

实现后的检查与交付:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/review/SKILL.md) | 准备提交或合入改动时 | 审查差异中的正确性和工程风险, 形成需要处理的问题。 |
| [investigate](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/investigate/SKILL.md) | 发现失败但原因不明时 | 建立复现并追踪根因, 用证据约束修复方向。 |
| [qa](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/qa/SKILL.md) | Web 功能实现后 | 在浏览器中测试用户路径, 发现问题后进入修复与回归循环。 |
| [qa-only](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/qa-only/SKILL.md) | 只允许检查而不修改时 | 执行浏览器 QA 并报告发现, 不走自动修复路径。 |
| [design-review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/design-review/SKILL.md) | 界面已经可以运行时 | 检查实际 UI 的视觉和交互问题, 在授权范围内修正。 |
| [devex-review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/devex-review/SKILL.md) | 产品可以实际接入时 | 走查安装、入门、文档与 API 使用路径, 检验真实开发者体验。 |
| [benchmark](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/benchmark/SKILL.md) | 性能可能发生变化时 | 采集浏览器性能基线并比较改动后的表现, 识别回归。 |
| [cso](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/cso/SKILL.md) | 需要安全检查时 | 从攻击面和代码风险进行安全审查, 形成分级问题与处置建议。 |
| [health](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/health/SKILL.md) | 想跟踪代码健康情况时 | 汇总代码质量指标与变化趋势, 帮助选择后续维护工作。 |
| [ship](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/ship/SKILL.md) | 改动准备交付为 PR 时 | 串联检查、版本与变更记录、提交、推送和 PR 等步骤; 不等同于生产部署。 |
| [setup-deploy](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/setup-deploy/SKILL.md) | 首次接入部署流程时 | 建立后续上线流程使用的部署配置与约定。 |
| [land-and-deploy](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/land-and-deploy/SKILL.md) | 已授权合并和上线时 | 协调合入、部署和上线检查, 并按流程处理失败及回退。 |
| [canary](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/canary/SKILL.md) | 部署之后 | 检查上线后的运行状态与异常信号, 补上本地验证看不到的部分。 |
| [landing-report](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/landing-report/SKILL.md) | 想知道待合入任务状态时 | 只读汇总交付队列, 查看阻塞与准备情况。 |
| [retro](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/retro/SKILL.md) | 一轮开发结束时 | 从开发记录中总结进展、问题和可改进的工作习惯。 |
| [document-generate](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/document-generate/SKILL.md) | 缺少必要项目文档时 | 根据项目事实生成文档, 支撑使用与维护。 |
| [document-release](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/document-release/SKILL.md) | 功能交付后 | 同步受改动影响的说明和发布文档, 减少代码与文档脱节。 |

移动端专用流程, 需要对应的 iOS 环境与设备能力:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [ios-sync](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/ios-sync/SKILL.md) | 接入或更新设备调试能力时 | 同步 DebugBridge 等开发调试支持, 让后续设备检查可运行。 |
| [ios-qa](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/ios-qa/SKILL.md) | SwiftUI 功能完成后 | 在真实设备上检查操作路径和功能表现, 记录问题。 |
| [ios-design-review](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/ios-design-review/SKILL.md) | 需要检查设备端 UI 时 | 对真实设备上的界面与交互进行设计审查。 |
| [ios-fix](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/ios-fix/SKILL.md) | 设备上存在明确异常时 | 在设备环境中复现、修复并回归验证问题。 |
| [ios-clean](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/ios-clean/SKILL.md) | 调试桥不应继续留在项目时 | 清理 DebugBridge 与相关 DEBUG 接线, 控制调试设施的残留。 |

{% folding blue, 浏览器基础能力与执行护栏 %}

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [browse](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/browse/SKILL.md) | 需要自动操作网页时 | 提供持久浏览器会话和页面操作能力, 供 QA 等流程使用。 |
| [open-gstack-browser](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/open-gstack-browser/SKILL.md) | 需要可见的交互浏览器时 | 打开可控制的 Chromium 会话, 支持人和 Agent 围绕同一页面协作。 |
| [setup-browser-cookies](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/setup-browser-cookies/SKILL.md) | 测试需要已有登录状态时 | 将授权的浏览器登录状态提供给测试会话, 应严格限制账号与站点范围。 |
| [pair-agent](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/pair-agent/SKILL.md) | 多个执行方需要共享浏览器时 | 建立远程 Agent 的浏览器协作通道, 需要明确访问权限。 |
| [scrape](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/scrape/SKILL.md) | 页面数据需要结构化获取时 | 提取网页内容与数据, 为后续分析或自动化提供输入。 |
| [skillify](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/skillify/SKILL.md) | 某个浏览器操作反复执行时 | 把抓取或操作流程整理为可复用的浏览器 Skill。 |
| [careful](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/careful/SKILL.md) | 执行可能破坏数据的命令前 | 对危险操作增加提醒与约束, 降低误操作概率。 |
| [freeze](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/freeze/SKILL.md) | 当前任务只能修改特定目录时 | 设置可写范围, 防止执行过程扩散到无关路径。 |
| [unfreeze](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/unfreeze/SKILL.md) | 已确认可以解除目录限制时 | 解除 freeze 设置的修改范围约束。 |
| [guard](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/guard/SKILL.md) | 同时需要范围与危险操作保护时 | 组合 careful 和 freeze 的约束。 |

{% endfolding %}

{% folding blue, 上下文与套件维护 %}

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [gstack](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/SKILL.md) | 不知道应进入哪个工作阶段时 | 根据任务意图路由到对应 Skill, 提供套件总入口。 |
| [context-save](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/context-save/SKILL.md) | 准备暂停或切换会话时 | 保存当前开发上下文, 为恢复任务留下信息。 |
| [context-restore](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/context-restore/SKILL.md) | 继续此前任务时 | 恢复已保存的上下文, 减少重复梳理。 |
| [learn](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/learn/SKILL.md) | 想保留可复用经验时 | 管理从工作中学到的规则与模式, 支撑后续任务。 |
| [setup-gbrain](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/setup-gbrain/SKILL.md) | 需要可选的知识后端时 | 配置持久知识能力; 不属于运行核心开发流程的必选步骤。 |
| [sync-gbrain](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/sync-gbrain/SKILL.md) | 仓库知识需要更新时 | 同步项目知识与 Agent 指导信息, 保持上下文可用。 |
| [codex](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/codex/SKILL.md) | 需要额外模型意见时 | 通过对应 CLI 请求第二视角的审查或咨询, 受账户与工具可用性限制。 |
| [plan-tune](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/plan-tune/SKILL.md) | 计划阶段的追问方式不合适时 | 调整决策询问和评审偏好, 适配个人协作习惯。 |
| [benchmark-models](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/benchmark-models/SKILL.md) | 选择执行模型时 | 比较模型处理 gstack 任务的表现, 服务于工具配置而非产品功能。 |
| [make-pdf](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/make-pdf/SKILL.md) | 文档需要导出时 | 将 Markdown 文档转换为 PDF 交付物。 |
| [gstack-upgrade](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/gstack-upgrade/SKILL.md) | 需要升级套件时 | 执行 gstack 的更新流程, 属于工具维护。 |

{% endfolding %}

### 使用取舍

如果主要工作是把 Web 功能交付给真实用户, gstack 的评审和浏览器链路很有针对性。对无界面的库或命令行工具, 同样可以使用工程评审与交付能力, 但没有必要为用不到的 UI 流程承担全部配置成本。

它对环境的要求也更具体: 测试页面需要可访问的服务、合适的账号与数据, iOS 检查需要设备和调试支持, 部分设计功能依赖外部服务。账号权限、测试数据和依赖服务, 都应纳入 QA 的准备范围。

{% note warning flat %}
`ship`、`land-and-deploy` 涉及提交、推送、合并或部署; `setup-browser-cookies` 涉及登录状态。执行前应明确允许操作的仓库、环境与账号。只读检查应使用对应入口, 不把审查请求交给自动交付流程。
{% endnote %}

## Addy Osmani

### 工程质量覆盖

Addy Osmani Agent Skills 将规格、计划、增量实施和交付作为开发主线, 再把接口设计、安全、性能、可观测性和迁移等专项工作接入相应阶段。相比只关注功能是否完成的流程, 它更强调一个改动进入长期维护后需要满足的工程条件。

基本路径是 `idea-refine / interview-me` → `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` → `测试与审查` → `shipping-and-launch`。这些入口负责阶段衔接, 专项 Skills 则根据改动性质介入, 不需要每个任务全部运行一遍。[主流程与命令映射](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/README.md)

例如新增批量导出, 功能测试可能只检查文件内容。性能优化还需要测量大数据量下的资源使用, 可观测性需要定义失败任务如何定位, 接口设计需要明确异步结果与错误行为。把这些工作分开, 才能分别提出目标并验证结果, 而不只是让 Agent 笼统地“检查一下质量”。

`doubt-driven-development` 使用新的审查上下文寻找遗漏和反例, `source-driven-development` 要求实现依据一手资料。两者分别针对自我审查和凭记忆调用接口的问题, 与 TDD、增量实施形成互补。

### Skills 清单

仓库包含 **24 个 Skills**, 其中 using-agent-skills 负责总路由。另有 `/spec`、`/plan`、`/build`、`/test`、`/review`、`/webperf`、`/code-simplify`、`/ship` 等 8 个命令入口, 它们不是另外 8 个独立 Skill。

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [using-agent-skills](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/using-agent-skills/SKILL.md) | 开始任务或阶段切换时 | 根据任务性质选择 Skill, 组织这套工程实践的使用顺序。 |
| [idea-refine](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/idea-refine/SKILL.md) | 想法尚未成形时 | 明确问题、目标与约束, 比较方向后收敛需求。 |
| [interview-me](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/interview-me/SKILL.md) | 关键需求仍需人作决定时 | 有针对性地追问, 在执行前暴露隐藏假设。 |
| [spec-driven-development](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/spec-driven-development/SKILL.md) | 需要把行为固定下来时 | 编写清楚、可验证的规格, 让实现有明确依据。 |
| [planning-and-task-breakdown](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/planning-and-task-breakdown/SKILL.md) | 需求已明确时 | 拆分可实施任务与依赖, 安排小步验证路径。 |
| [source-driven-development](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/source-driven-development/SKILL.md) | 要使用不熟悉的技术时 | 查阅一手文档与源码, 让实现依据实际接口而非模型印象。 |
| [context-engineering](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/context-engineering/SKILL.md) | 项目信息分散或会话变长时 | 组织相关上下文与指令, 控制信息噪声和遗忘风险。 |
| [api-and-interface-design](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/api-and-interface-design/SKILL.md) | 设计模块或服务边界时 | 设计清晰接口、错误行为和兼容约定, 降低调用方负担。 |
| [frontend-ui-engineering](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/frontend-ui-engineering/SKILL.md) | 实现前端界面时 | 处理组件、交互、可访问性与界面质量, 形成可用 UI。 |
| [incremental-implementation](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/incremental-implementation/SKILL.md) | 开始实现计划时 | 按纵向切片实施, 在小步实现、测试和验证之间循环。 |
| [test-driven-development](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/test-driven-development/SKILL.md) | 新行为需要可靠约束时 | 先写能失败的测试, 再实现和重构, 防止只补结果式测试。 |
| [debugging-and-error-recovery](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/debugging-and-error-recovery/SKILL.md) | 遇到故障或执行失败时 | 建立复现、定位原因并规划恢复, 避免无依据重试。 |
| [browser-testing-with-devtools](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/browser-testing-with-devtools/SKILL.md) | Web 改动需要运行证据时 | 利用 Chrome DevTools MCP 检查实际页面、交互和相关诊断信息。 |
| [code-review-and-quality](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/code-review-and-quality/SKILL.md) | 实现完成或准备集成时 | 检查正确性、可维护性和测试质量, 输出改进项。 |
| [doubt-driven-development](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/doubt-driven-development/SKILL.md) | 实现可能受原有假设影响时 | 让新的审查上下文主动质疑结果, 寻找遗漏和反例。 |
| [code-simplification](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/code-simplification/SKILL.md) | 代码已正确但过于复杂时 | 简化结构与表达, 保持行为不变, 降低后续维护成本。 |
| [performance-optimization](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/performance-optimization/SKILL.md) | 有性能目标或瓶颈时 | 先测量和定位, 再优化与复测, 避免凭直觉调整。 |
| [security-and-hardening](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/security-and-hardening/SKILL.md) | 涉及攻击面与敏感行为时 | 检查安全风险并加固输入、权限及相关边界。 |
| [observability-and-instrumentation](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/observability-and-instrumentation/SKILL.md) | 功能需要在线可诊断时 | 设计日志、指标和追踪等观测点, 支撑故障发现与定位。 |
| [ci-cd-and-automation](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/ci-cd-and-automation/SKILL.md) | 手工检查需固化时 | 将验证和交付步骤转成自动化流程, 提供稳定反馈。 |
| [git-workflow-and-versioning](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/git-workflow-and-versioning/SKILL.md) | 多分支协作与版本交付时 | 组织分支、提交和版本管理, 保持改动可理解、可追踪。 |
| [documentation-and-adrs](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/documentation-and-adrs/SKILL.md) | 决策或用法需要长期保留时 | 更新工程文档和架构决策记录, 说明做法与原因。 |
| [deprecation-and-migration](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/deprecation-and-migration/SKILL.md) | 旧接口或实现需要替换时 | 设计兼容、弃用与迁移步骤, 控制升级对使用者的影响。 |
| [shipping-and-launch](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/skills/shipping-and-launch/SKILL.md) | 准备上线或交付版本时 | 整理发布准备、验证和风险事项, 检查交付条件是否满足。 |

### 使用取舍

选择这套 Skills 的主要理由是补齐工程检查维度。对于已经有需求与任务管理方式的团队, 可以保留现有协作制度, 只在接口、性能、安全或迁移等薄弱环节引入对应流程。

覆盖范围广也要求使用者作筛选。性能优化需要基线, 安全加固需要明确攻击面, 浏览器检查需要 Chrome DevTools MCP。缺少这些条件, 专项 Skill 很容易退化为一般性建议。单独引入某个 Skill 时, 还要带上其依赖的共享引用文件, 不能只复制入口 Markdown。

## OpenSpec

### 增量规格管理

OpenSpec 将长期规格与待实施变更分开保存。`openspec/specs/` 描述项目已经形成的行为基线, `openspec/changes/<变更名>/` 保存本次提案、规格增量、设计与任务。开发完成后再同步规格并归档变更, 使“系统现在怎样工作”和“准备怎样修改”保持可区分。

这种组织方式对已有项目尤为实用。增加导出功能时, 可以明确本次新增的权限和任务行为, 同时保留已有订单查询的约束; 后续评审能够围绕差异展开, 不需要把整个系统重新写成一份需求文档。[变更工作流](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/docs/workflows.md)

快速路径是 `explore` → `propose` → `apply`, 随后检查结果并选择 `sync` 或 `archive`。希望逐项审查规划产物时, 则使用 `new` → `continue`; 需要调整已形成的方案时, 使用 `update`。这些入口按产物依赖推进, 允许在实现中返回设计, 而非把前期文档视为不可修改的承诺。

同步与归档有不同含义。`sync` 合并规格增量, `archive` 结束该变更的活动状态, 两者都不能说明代码已部署。`verify` 可以对照实现与规划检查差异, 但仍要用项目测试验证真实行为。

### 命令与 Skills

v1.11.0 提供 **12 个工作流 Skills**。默认 core 配置选择其中 **6 个: propose、explore、apply、update、sync、archive**; 其余需要扩展选择。下表用 Skill 全名, 命令采用 `/opsx:apply` 这样的形式, 具体拼写由客户端适配。[命令与配置说明](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/docs/commands.md)

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [openspec-explore](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-explore/SKILL.md) | 尚未决定如何改时 | 阅读代码、调查问题和比较方案, 先澄清思路, 不直接执行产品实现。 |
| [openspec-propose](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-propose/SKILL.md) | 已能描述一项变更时 | 创建变更并生成实现前所需的提案、规格、设计与任务产物。 |
| [openspec-apply-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-apply-change/SKILL.md) | 变更任务已经就绪时 | 按任务修改代码并记录进度, 把规划产物转成实现。 |
| [openspec-update-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-update-change/SKILL.md) | 原计划需要调整时 | 修改并协调已有规划产物, 处理相互影响; 这个入口不负责改产品代码。 |
| [openspec-sync-specs](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-sync-specs/SKILL.md) | 增量规格需并入长期规格时 | 将变更中的规格差异同步到主规格, 不必同时归档变更。 |
| [openspec-archive-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-archive-change/SKILL.md) | 变更完成准备收尾时 | 检查相关完成与同步状态, 将变更移入归档, 保留历史。 |
| [openspec-new-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-new-change/SKILL.md) | 想逐步控制规划过程时 | 建立变更骨架, 显示下一项可创建的产物, 不一次生成全部内容。 |
| [openspec-continue-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-continue-change/SKILL.md) | 逐项确认规划产物时 | 根据依赖关系创建下一项就绪产物, 便于人工检查后继续。 |
| [openspec-ff-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-ff-change/SKILL.md) | 变更已清晰且希望快速规划时 | 从已有变更出发, 连续生成实施前需要的规划产物。 |
| [openspec-verify-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-verify-change/SKILL.md) | 实现后需要对照产物时 | 从完整性、正确性与一致性检查实现, 输出差异和待处理问题。 |
| [openspec-bulk-archive-change](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-bulk-archive-change/SKILL.md) | 多项变更都已结束时 | 批量归档并处理规格重叠与冲突, 避免简单覆盖。 |
| [openspec-onboard](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/skills/openspec-onboard/SKILL.md) | 初次学习这套流程时 | 带着实际仓库走一遍完整变更, 理解产物与动作的关系。 |

### 使用取舍

OpenSpec 适合持续修改同一代码库, 尤其是接口和业务行为需要保留演进记录的项目。它的维护单位是一项变更, 能把评审范围压到“这次究竟修改了什么”。相比每次都展开产品简报和完整 PRD, 这种粒度更容易融入常规迭代。

前提是主规格值得信任。如果代码已经变化, 主规格长期不同步, 新变更就会建立在错误基线上。并行变更修改同一行为时, 也需要处理语义冲突, 不能只按文件是否能够合并来判断。主规格的更新应成为变更收尾的一部分。

## BMAD-METHOD

### 产品与技术决策

BMAD 将产品、业务分析、UX、架构和开发分别组织为可调用的角色与工作流。复杂项目可以依次形成产品简报、PRD、体验设计、架构与交付故事, 让不同层面的决定保留各自的依据。清晰的小修改也可以直接进入 `bmad-build`, 当前方法并不要求所有任务走完同样的文档流程。[Method 的交付路径](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/README.md)

它适合处理相互牵制的决策。例如审批系统支持临时代理人, 产品层要决定代理范围与有效期, UX 要呈现当前操作身份, 架构要处理权限和审计, 开发再落实接口与测试。只让 Agent 从需求直接拆代码任务, 这些决定很容易被实施细节代替。BMAD 的多层产物为讨论提供了明确位置。

角色的价值仍取决于输入。架构师角色需要已确认的业务约束, 开发者角色需要能够实施的规格和代码库上下文; `party-mode` 汇集不同视角, 但不能因为几个角色表示赞同就跳过事实核查。角色分工提供的是讨论与执行组织, 不构成独立专家认证。

实施后的预览、代码审查、测试生成、方向纠偏和复盘也有单独入口。因此 BMAD 的完整性体现在决策如何传到实现, 以及实现反馈如何调整计划, 而不只是前期文档数量。

### Skills 清单

按 v6.11.0 的 Method 与 Core 源目录, 有 **29 个非弃用的角色和工作流 Skills**, 另有 **20 个兼容或弃用入口**。这里区分角色、规划、交付与通用方法。Test Architect、Builder、Loop 等独立扩展模块不混入主项目清单。

首先是 5 个角色入口。它们提供对话身份和能力路由, 不等于已经启动 5 个独立执行进程。

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [bmad-agent-analyst](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/agents/bmad-agent-analyst/SKILL.md) | 需要业务分析视角时 | 以分析师 Mary 的角色辅助研究、探索和需求理解, 路由到相应工作流。 |
| [bmad-agent-pm](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/agents/bmad-agent-pm/SKILL.md) | 需要产品管理视角时 | 以产品经理 John 的角色梳理价值、范围和产品要求。 |
| [bmad-agent-architect](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/agents/bmad-agent-architect/SKILL.md) | 需要系统设计视角时 | 以架构师 Winston 的角色讨论技术边界与架构决策。 |
| [bmad-agent-ux-designer](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/agents/bmad-agent-ux-designer/SKILL.md) | 需要体验设计视角时 | 以 UX 设计师 Sally 的角色分析用户路径和交互要求。 |
| [bmad-agent-dev](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/agents/bmad-agent-dev/SKILL.md) | 进入工程实施时 | 以开发者 Amelia 的角色承接实施工作, 使用开发与验证流程。 |

规划阶段有 9 个主要工作流:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [bmad-product-brief](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-product-brief/SKILL.md) | 产品目标需要明确时 | 梳理目标用户、问题、价值与范围, 产出产品简报。 |
| [bmad-prfaq](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-prfaq/SKILL.md) | 需要检验产品是否值得做时 | 用面向用户的发布说明与常见问题反推产品, 暴露价值和可行性缺口。 |
| [bmad-prd](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-prd/SKILL.md) | 需要正式产品要求时 | 创建、更新或验证 PRD, 维护需求与约束的一致性。 |
| [bmad-ux](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-ux/SKILL.md) | 用户体验需要系统设计时 | 整理用户路径、交互和设计要求, 为实现提供 UX 依据。 |
| [bmad-architecture](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-architecture/SKILL.md) | 多模块方案需要统一时 | 确定架构主线、系统不变量和技术决策, 给实现提供稳定边界。 |
| [bmad-spec](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-spec/SKILL.md) | 需要更明确的实施契约时 | 建立规范化 SPEC 及配套内容, 固定可供后续构建消费的要求。 |
| [bmad-create-epics-and-stories](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-create-epics-and-stories/SKILL.md) | 大需求需要分批交付时 | 将要求拆为史诗与用户故事, 组织可实施的交付单元。 |
| [bmad-sprint-planning](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-sprint-planning/SKILL.md) | 准备或管理一轮迭代时 | 检查就绪情况, 生成、报告或修复迭代状态, 维护执行顺序。 |
| [bmad-project-context](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-project-context/SKILL.md) | 接手或维护现有仓库时 | 建立、刷新或审计仓库指导信息, 将核实过的关键约束写入 AGENTS.md。 |

构建、测试和交付有 7 个工作流:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [bmad-build](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/ship/bmad-build/SKILL.md) | 收到清晰改动或已有规划时 | 按任务规模选择实施路径, 利用项目上下文完成构建与验证。 |
| [bmad-build-auto](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/ship/bmad-build-auto/SKILL.md) | 外层流程安排自动迭代时 | 执行一次无人值守构建循环中的工作, 不等同于独立永久运行的调度器。 |
| [bmad-checkpoint-preview](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/ship/bmad-checkpoint-preview/SKILL.md) | 需要人验收当前结果时 | 整理变更、风险和检查方式, 提供可跟随的验收预览。 |
| [bmad-code-review](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/ship/bmad-code-review/SKILL.md) | 实现需要严格审查时 | 从多个角度寻找缺陷并归类处理, 检查要求、实现与证据。 |
| [bmad-qa-generate-e2e-tests](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/ship/bmad-qa-generate-e2e-tests/SKILL.md) | 已实现功能缺少自动化测试时 | 为已有代码生成 API 与端到端测试; 不代替代码审查或故事验收。 |
| [bmad-correct-course](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/ship/bmad-correct-course/SKILL.md) | 迭代中发生方向变化时 | 分析变更影响, 调整范围、计划与相关产物, 避免只修改任务标题。 |
| [bmad-retrospective](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/ship/bmad-retrospective/SKILL.md) | 一个史诗或阶段结束时 | 依据交付与验证事实复盘, 提炼问题和后续改进。 |

通用方法有 8 个入口:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [bmad-help](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-help/SKILL.md) | 不知道下一步或哪些步骤可省时 | 识别当前工作状态, 推荐适合的下一工作流。 |
| [bmad-brainstorming](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-brainstorming/SKILL.md) | 需要探索候选方向时 | 组织多种头脑风暴方法, 扩展并整理可讨论的想法。 |
| [bmad-forge-idea](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-forge-idea/SKILL.md) | 想法需要经受挑战时 | 检验概念的假设、价值和薄弱点, 收敛更可靠的方向。 |
| [bmad-advanced-elicitation](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-advanced-elicitation/SKILL.md) | 已有内容需要深入推敲时 | 运用结构化质疑和分析方法, 改进当前结论或产物。 |
| [bmad-deep-recon](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-deep-recon/SKILL.md) | 决策依赖外部研究时 | 支持研究任务的构造、执行和报告提炼, 覆盖市场、领域与技术等问题。 |
| [bmad-party-mode](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-party-mode/SKILL.md) | 需要多种专业视角讨论时 | 组织多个角色参与同一议题, 综合分歧与建议; 不等于并行编码团队。 |
| [bmad-review](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-review/SKILL.md) | 文档、规格或差异需要审查时 | 提供多角度审查, 查找表达、边界和验证缺口等问题。 |
| [bmad-customize](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/bmad-customize/SKILL.md) | 标准流程需要适配团队时 | 管理已安装 Skills 的定制覆盖, 保留基础实现与团队差异的边界。 |

{% folding blue, 20 个兼容与弃用入口 %}

这些名称用于承接旧调用, 不代表额外的独立工作流。

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [bmad-create-architecture](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-create-architecture/SKILL.md) | 旧版架构创建入口 | 转向 bmad-architecture。 |
| [bmad-create-prd](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-create-prd/SKILL.md) | 旧版 PRD 创建入口 | 转向 bmad-prd 的创建工作。 |
| [bmad-edit-prd](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-edit-prd/SKILL.md) | 旧版 PRD 编辑入口 | 转向 bmad-prd 的更新工作。 |
| [bmad-validate-prd](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-validate-prd/SKILL.md) | 旧版 PRD 验证入口 | 转向 bmad-prd 的验证工作。 |
| [bmad-create-story](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-create-story/SKILL.md) | 显式调用旧故事入口时 | 转向 bmad-build, 由统一构建路径处理。 |
| [bmad-dev-story](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-dev-story/SKILL.md) | 显式调用旧故事开发入口时 | 转向 bmad-build, 不单独算另一套实施流程。 |
| [bmad-quick-dev](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-quick-dev/SKILL.md) | 显式调用旧快速开发入口时 | 转向 bmad-build 的按规模实施路径。 |
| [bmad-dev-auto](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-dev-auto/SKILL.md) | 旧自动开发入口 | 转向 bmad-build-auto。 |
| [bmad-document-project](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-document-project/SKILL.md) | 旧项目文档化入口 | 转向 bmad-project-context。 |
| [bmad-domain-research](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-domain-research/SKILL.md) | 旧领域研究入口 | 转向 bmad-deep-recon 的对应研究任务。 |
| [bmad-market-research](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-market-research/SKILL.md) | 旧市场研究入口 | 转向 bmad-deep-recon 的对应研究任务。 |
| [bmad-technical-research](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-technical-research/SKILL.md) | 旧技术研究入口 | 转向 bmad-deep-recon 的对应研究任务。 |
| [bmad-sprint-status](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/v6-shims/bmad-sprint-status/SKILL.md) | 旧迭代状态入口 | 转向 bmad-sprint-planning 的状态工作。 |
| [bmad-editorial-review](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/v6-shims/bmad-editorial-review/SKILL.md) | 旧编辑审查入口 | 转向 bmad-review。 |
| [bmad-editorial-review-prose](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/v6-shims/bmad-editorial-review-prose/SKILL.md) | 旧行文审查入口 | 转向 bmad-review, 保留对应审查意图。 |
| [bmad-editorial-review-structure](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/v6-shims/bmad-editorial-review-structure/SKILL.md) | 旧结构审查入口 | 转向 bmad-review, 保留对应审查意图。 |
| [bmad-review-adversarial-general](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/v6-shims/bmad-review-adversarial-general/SKILL.md) | 旧对抗式审查入口 | 转向 bmad-review。 |
| [bmad-review-edge-case-hunter](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/v6-shims/bmad-review-edge-case-hunter/SKILL.md) | 旧边界情况审查入口 | 转向 bmad-review。 |
| [bmad-review-verification-gap](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/core-skills/v6-shims/bmad-review-verification-gap/SKILL.md) | 旧验证缺口审查入口 | 转向 bmad-review。 |
| [bmad-generate-project-context](https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.11.0/src/bmm-skills/plan/bmad-generate-project-context/SKILL.md) | 已弃用的上下文生成入口 | 转向 bmad-project-context; 旧 project-context.md 不再是唯一输出目标。 |

{% endfolding %}

### 使用取舍

当产品、UX 与架构都需要认真展开, BMAD 能提供比单纯任务执行框架更充分的协作结构。它尤其适合从模糊需求启动的复杂项目, 或需要多个参与者理解设计依据的团队。

若团队已经有成熟的 PRD、设计评审和迭代制度, 引入 BMAD 前应确定哪些产物继续由原流程维护。两套系统同时生成近似文档, 很容易出现无人负责同步的副本。版本变化也是成本之一: 当前统一入口与旧教程存在差异, 应按实际安装版本使用, 不把兼容命令当成额外能力。

## Compound

### 工程知识复用

Compound Engineering 将已解决的问题视为后续开发的输入。计划、实施、审查完成后, `ce-compound` 把问题、解法及验证依据写入项目的 `solutions/` 知识目录, 供后续任务检索。目录根路径可由项目配置决定; 经验复用发生在文档与上下文层, 不涉及更新模型权重。[经验记录的输入与产物](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-compound/SKILL.md)

阶段关系通常概括为 `ce-brainstorm` → `ce-plan` → `ce-work` → `ce-code-review` → `ce-compound`。实际调用需要注意流程所有权: 独立运行 `ce-work` 时, 它负责实现、本地验证及后续交付检查; 由外层流程调用时, 可以只返回实施和验证结果, 把余下步骤交回调用方。已经完成的审查不应因为看见流程图而机械重跑。[ce-work 的执行模式](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-work/SKILL.md)

一次后台任务重复执行的修复, 值得记录的不只是最终代码。触发条件、曾经误判的原因、幂等约束和回归方法, 都可能改变下一次相关任务的方案。反过来, 未验证的猜测如果被写成项目经验, 也会被持续放大。`ce-compound-refresh` 因而负责检查与更新已有知识, 而不是不断堆积开发总结。

浏览器测试、代码审查、PR 反馈处理和提交入口构成执行部分。Proof 文档协作、产品反馈和推广功能则属于外围能力, 不影响其核心方法的判断。

### Skills 清单

这里按 compound-engineering-v3.23.4 的 **33 个 Skills**列出。研究、审查等工作还会调用配套 Agent 与工具, 它们不另算成 Skill。Proof、反馈服务和推广能力属于可选外围环节。

需求与计划:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [ce-strategy](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-strategy/SKILL.md) | 需要明确产品长期方向时 | 整理并维护 STRATEGY.md, 为后续想法选择提供依据。 |
| [ce-ideate](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-ideate/SKILL.md) | 还没有选定要做的事情时 | 结合项目背景提出候选改进方向, 供人筛选。 |
| [ce-pov](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-pov/SKILL.md) | 需要对采用某个方向作判断时 | 形成有依据的立场与取舍, 帮助决定是否推进。 |
| [ce-brainstorm](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-brainstorm/SKILL.md) | 已选方向但要求不清时 | 探索需求和备选方案, 将讨论整理为后续计划的基础。 |
| [ce-prototype](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-prototype/SKILL.md) | 有具体未知需要实验时 | 用可丢弃的试验回答问题, 将发现带回正式方案。 |
| [ce-plan](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-plan/SKILL.md) | 准备实施一个改动时 | 结合代码、资料与已有经验形成可执行计划, 明确任务及验收。 |
| [ce-doc-review](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-doc-review/SKILL.md) | 规划文档需要检查时 | 审查需求、计划等产物的清楚程度与缺口, 改善执行输入。 |

实现、验证与知识沉淀:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [ce-worktree](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-worktree/SKILL.md) | 需要隔离并行或独立工作时 | 管理工作树和工作目录, 为实施建立安全边界。 |
| [ce-work](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-work/SKILL.md) | 已有计划或明确构建请求时 | 实现并本地验证改动; 独立模式继续交付收尾, 调用模式将结果交回外层流程。 |
| [ce-debug](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-debug/SKILL.md) | Bug 原因尚未明确时 | 调查和验证根因, 以复现与证据驱动修复。 |
| [ce-simplify-code](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-simplify-code/SKILL.md) | 正确实现需要整理时 | 在保持行为的前提下减少复杂度, 改善可读性与结构。 |
| [ce-code-review](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-code-review/SKILL.md) | 实现需要独立检查时 | 按风险选择审查视角, 检查缺陷、回归与标准; 可按配置跨模型审查, 本地应用修复需明确选择。 |
| [ce-test-browser](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-test-browser/SKILL.md) | 分支或 PR 影响页面时 | 对受影响路由进行浏览器验证, 分别报告通过、失败或有原因的跳过。 |
| [ce-test-xcode](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-test-xcode/SKILL.md) | iOS 改动需要模拟器证据时 | 借助 XcodeBuildMCP 构建并操作模拟器, 保留截图、日志和各界面结果。 |
| [ce-dogfood](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-dogfood/SKILL.md) | 希望像用户一样试用改动时 | 围绕当前差异执行浏览器探索, 可进行小范围修复、回归与提交。 |
| [ce-polish](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-polish/SKILL.md) | 需要人工引导的体验打磨时 | 在浏览器中共同调整 UI 和使用体验, 收敛细节质量。 |
| [ce-optimize](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-optimize/SKILL.md) | 有明确可测量的优化目标时 | 以基线和实验比较改动, 接受有证据的性能或效率提升。 |
| [ce-compound](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-compound/SKILL.md) | 一个有价值的问题已解决时 | 将原因、解法和经验记录到可检索的项目知识, 支撑后续开发。 |
| [ce-compound-refresh](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-compound-refresh/SKILL.md) | 经验库可能过时时 | 审查并更新已有解决方案知识, 避免过时经验持续误导。 |
| [ce-handoff](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-handoff/SKILL.md) | 需要换会话或协作者时 | 记录现状、决定、验证与下一步, 让任务可接续。 |

提交与 PR 流程:

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [ce-commit](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-commit/SKILL.md) | 已授权创建本地提交时 | 整理本次范围内的差异并提交, 不把它等同于对外发布。 |
| [ce-commit-push-pr](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-commit-push-pr/SKILL.md) | 已授权远程交付时 | 完成提交、推送与创建 PR, 将本地成果送入协作流程。 |
| [ce-resolve-pr-feedback](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-resolve-pr-feedback/SKILL.md) | 已有 PR 收到反馈时 | 理解并解决评论、审查和相关检查问题, 推进该 PR。 |
| [ce-babysit-pr](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-babysit-pr/SKILL.md) | PR 需要持续跟进时 | 观察检查与反馈并处理阻塞, 推进至可合入状态; 不等同于自动合并。 |
| [lfg](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/lfg/SKILL.md) | 明确要求自主完成交付时 | 串联完整执行、验证与交付过程, 可以继续到推送和打开 PR, 属于高授权入口。 |

{% folding blue, 初始化与可选外围能力 %}

| Skill | 使用时机 | 职责与产出 |
| --- | --- | --- |
| [ce-setup](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-setup/SKILL.md) | 首次使用或项目配置不完整时 | 建立适配项目的工作流配置并检查可用能力。 |
| [ce-retune](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-retune/SKILL.md) | 有可比较的评测环境时 | 通过 A/B 基准调整 Agent 指令或工作流, 缺少评测条件时不凭感觉调优。 |
| [ce-explain](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-explain/SKILL.md) | 需要理解代码或设计时 | 制作面向人的解释材料, 支持学习和沟通。 |
| [ce-proof](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-proof/SKILL.md) | 需要共享 Markdown 文档时 | 在 Proof 文档服务中发布、读取、评论或编辑; 不是测试证明或形式化验证。 |
| [ce-product-pulse](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-product-pulse/SKILL.md) | 已连接产品反馈来源时 | 汇总产品信号与用户反馈, 为下一轮选择提供输入。 |
| [ce-sweep](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-sweep/SKILL.md) | 需要整理多渠道工作线索时 | 处理已配置的 Slack、GitHub、邮件等线索并形成后续工作, 可能包含外部回复。 |
| [ce-riffrec-feedback-analysis](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-riffrec-feedback-analysis/SKILL.md) | 收到屏幕与语音反馈时 | 分析 Riffrec 反馈材料, 提取可操作的问题与改进项。 |
| [ce-promote](https://github.com/EveryInc/compound-engineering-plugin/blob/compound-engineering-v3.23.4/skills/ce-promote/SKILL.md) | 产品交付后需要传播材料时 | 生成推广与发布文案, 是外围产品工作, 不计为代码质量保障。 |

{% endfolding %}

### 使用取舍

Compound 的收益更容易出现在长期维护的仓库: 相同领域模型、基础设施约束和故障模式反复出现, 记录一次可以服务于多次任务。短期原型或一次性脚本缺少这种复用机会, 没必要为了积累而为每个小修改生成知识文档。

知识文档需要说明适用条件, 能够被后续任务检索, 并在代码变化后更新。缺少维护, 原本有效的解决方案也可能变成错误前提。

{% note warning flat %}
`ce-code-review` 可按配置调用外部模型, 应核对代码发送范围与目标; 只输出审查报告不等于全程本地执行。`ce-proof` 操作外部文档服务, `ce-dogfood` 可修改并提交代码, `lfg` 可继续到推送与创建 PR。
{% endnote %}

## 横向对比

### 核心差异

几乎每个项目都涉及需求、计划和审查, 因而单纯标记“支持 / 不支持”区分度很低。更有用的是看它把哪些信息固定为产物, 又在哪些步骤要求额外检查。

| 项目 | 主要约束对象 | 采用成本与边界 |
| --- | --- | --- |
| Superpowers | 将实施计划落实为逐任务执行、审查和完成前验证 | 任务交接与审查增加消耗, 高耦合任务不宜过度拆分 |
| Matt Pocock Skills | 将讨论中的决定转成可独立实施的规格与工单 | 需要维护决策和上下文, 避免对已明确事项反复追问 |
| Spec Kit | 维持项目原则、规格、方案与任务之间的一致性 | 需求变化会带来多份文档的同步工作 |
| gstack | 将产品评审、运行中 UI 检查与交付操作衔接 | 浏览器、账号、设备和部署环境需要具备实际验证条件 |
| Addy Agent Skills | 将性能、安全、观测等专项要求纳入开发阶段 | 需要先设定目标与基线, 再选择对应 Skill |
| OpenSpec | 管理长期规格与每次变更之间的差异 | 主规格必须持续更新, 并行修改还需解决语义冲突 |
| BMAD | 将产品、UX、架构决定传递到实施与迭代 | 容易与团队已有文档体系重叠, 需明确产物维护者 |
| Compound Engineering | 将验证过的解决方案反馈到后续开发 | 经验需要可检索、标明条件并持续更新 |

### 产物与检查点

| 项目 | 主要持久产物 | 人应保留的决策 |
| --- | --- | --- |
| Superpowers | 设计、实施计划、代码和测试 | 设计边界、重大审查分歧、分支合入方式 |
| Matt Pocock Skills | CONTEXT.md、ADR、规格和工单 | 业务规则、未决假设、工单的验收范围 |
| Spec Kit | constitution、spec、plan、tasks | 项目原则、规格歧义、需求与实现的偏差 |
| gstack | 产品与设计方案、QA 发现、PR 和交付记录 | 产品范围、设计取舍、目标账号与发布环境 |
| Addy Agent Skills | 规格、计划、测试、工程文档与 ADR | 性能和安全目标、兼容边界、发布风险 |
| OpenSpec | 主规格、变更提案、规格增量、任务与归档 | 行为变更范围、规格冲突和同步时机 |
| BMAD | 简报、PRD、UX、架构、故事和迭代状态 | 产品与架构取舍、阶段验收、方向调整 |
| Compound Engineering | 计划、实现、审查记录、解决方案知识 | 经验的适用条件、知识更新与对外交付权限 |

### 验证与执行成本

验证能力是否能用起来, 取决于项目是否提供了对应环境。浏览器 QA 需要可以复现的用户状态, 性能优化需要基线, 规格检查需要可信的文档。缺少输入条件时, 多运行一轮 Agent 也难以得到可靠结论。

| 项目 | 验证方式 | 需要准备的条件 |
| --- | --- | --- |
| Superpowers | TDD、逐任务与整分支审查、完成前实跑 | 可运行的测试命令; 使用子 Agent 路径时需支持独立执行上下文 |
| Matt Pocock Skills | 短反馈回路、TDD、规格与工程标准审查 | 自包含工单、明确的行为预期、可快速复现的测试 |
| Spec Kit | analyze 检查产物, converge 将实施差距转回任务 | 已形成的 spec、plan、tasks 及当前代码; 实际运行测试另由项目工具提供 |
| gstack | 浏览器 QA、视觉与性能检查、部署后检查 | 可访问的服务、测试账号与数据; 上线检查还需部署环境 |
| Addy Agent Skills | TDD、独立质疑、性能与安全等专项检查 | 明确的专项目标和基线; 浏览器 Skill 需 Chrome DevTools MCP |
| OpenSpec | verify 对照实现与变更产物 | 当前变更、主规格和实际代码; 行为回归需项目自身测试 |
| BMAD | 阶段预览、代码审查、API 与端到端测试工作流 | 可执行项目、验收条件、适用的测试框架与环境 |
| Compound Engineering | 代码与浏览器审查、PR 检查、可选 iOS 验证 | 宿主支持的浏览器能力; iOS 模拟器路径需 XcodeBuildMCP; 跨模型审查需核对数据边界 |

{% note info flat %}
成本不仅是 Token, 还包括环境配置、人工决策和文档维护。试用时记录漏项、返工、验证覆盖与人工接手时间, 才能判断新增流程是否有收益。未经同条件测试的固定节省比例, 不适合作为选型依据。
{% endnote %}

## 场景选择

### 优先使用场景

| 当前主要问题 | 优先考虑 | 预期改善 |
| --- | --- | --- |
| 需求已经明确, 实施仍漏测试或缺少完成证据 | Superpowers | 将计划、逐任务审查和实际验证连接起来 |
| 关键业务决定没有留下记录, 换会话后反复解释 | Matt Pocock Skills | 先保留决策依据, 再生成可以接续的工单 |
| 多人协作需要统一需求和技术方案 | Spec Kit | 建立能够共同审查的规格及其实施映射 |
| 现有代码持续演进, 很难分清当前行为与待改行为 | OpenSpec | 分离主规格和变更增量, 控制每次修改范围 |
| Web 功能需要经过实际使用路径再交付 | gstack | 补上计划评审、浏览器 QA 与交付操作 |
| 功能完成后才补性能、安全或观测要求 | Addy Agent Skills | 把专项工程要求提前放进开发流程 |
| 产品、UX 和架构决策互相影响 | BMAD | 分层记录决定, 再传递到实施和迭代 |
| 同一仓库不断重复解决相似问题 | Compound Engineering | 让已验证经验参与下一轮研究与计划 |

### 相近方案的取舍

用“给订单服务增加异步导出”这类常规需求, 更容易看出工作流的差异。这是对流程的推演, 并非八个项目的实测结果。

**Spec Kit 与 OpenSpec:** 如果需要先确定导出权限、异步接口和任务契约, 并追溯这些要求如何进入实施, Spec Kit 的 spec、plan、tasks 关系更直接。如果已有稳定接口, 本次只是调整导出行为, OpenSpec 可以把修改放进独立变更, 评审规格增量, 完成后再同步主规格。关键在于需要建立需求基线, 还是维护基线之上的变更, 不必严格按新旧项目划分。

**Superpowers 与 Matt Pocock Skills:** 当产品尚未决定导出哪些字段、谁可以下载结果, Matt 的追问和决策记录应先介入。当这些规则已确定, 工作重点变成队列任务、权限检查和回归测试, Superpowers 的逐任务实施与审查更有针对性。两者都包含 TDD, 但解决返工的起点不同。

**BMAD 与 gstack:** 如果导出功能牵涉产品套餐、角色权限、交互与后台架构, BMAD 适合展开这些相互影响的决定。如果方案已定, 主要风险是进度展示、失败重试和下载路径是否真的可用, gstack 的浏览器 QA 与交付流程更贴近问题。

**Addy Agent Skills 与 Compound:** 当导出功能需要补上大数据量性能、可观测性和失败恢复, Addy 的专项 Skills 能把这些工作纳入当前计划。如果仓库过去已经出现过队列重复执行或权限泄漏, Compound 更关注把这些经过验证的历史结论带入本次开发, 避免重复探索。

### 试用与组合

实际试用时, 固定同一项任务及其验收条件, 观察工作流能否发现需求漏项、形成可执行计划, 并留下真实验证结果。再加入一次小范围需求调整, 检查需要同步哪些文件、已完成任务如何修正, 可以更清楚地看出维护成本。

若要组合多个套件, 应先划分产物与执行职责。以 OpenSpec 配合 Superpowers 为例, 可以约定 OpenSpec 维护正式规格和变更任务, Superpowers 根据这些要求实施与验证; 验证中的差异再回到原变更处理。还需明确谁更新任务状态、谁处理审查分歧, 避免两个流程分别宣告完成。这是职责划分建议, 不代表已验证的跨插件兼容方案。

{% note warning flat %}
多个套件可能同时维护项目指导文件、生成任务、创建工作区或执行提交。组合前应指定主流程, 明确辅助 Skill 的输入、允许修改的文件和返回结果。合并、推送、部署及外部内容共享继续单独授权, 不随“完整流程”一并放开。
{% endnote %}

我会优先保留能减少实际返工的步骤: 需求没有遗漏到测试之外, 工单能够交给新会话, 历史故障能够影响新方案。工作流的价值最终应体现在这些结果上, 而不是产物数量或角色数量。

## 参考资料

各节 Skill 名称链接到相应源文件。以下入口用于继续查看官方方法、分发方式与完整目录。

{% linkgroup %}
{% link Superpowers, https://github.com/obra/superpowers, https://github.com/favicon.ico %}
{% link Matt Pocock Skills, https://github.com/mattpocock/skills, https://github.com/favicon.ico %}
{% link GitHub Spec Kit, https://github.com/github/spec-kit, https://github.com/favicon.ico %}
{% link gstack, https://github.com/garrytan/gstack, https://github.com/favicon.ico %}
{% link Addy Osmani Agent Skills, https://github.com/addyosmani/agent-skills, https://github.com/favicon.ico %}
{% link OpenSpec, https://github.com/Fission-AI/OpenSpec, https://github.com/favicon.ico %}
{% link BMAD METHOD, https://github.com/bmad-code-org/BMAD-METHOD, https://github.com/favicon.ico %}
{% link Compound Engineering, https://github.com/EveryInc/compound-engineering-plugin, https://github.com/favicon.ico %}
{% endlinkgroup %}

- [Superpowers 的工作流与 Skills](https://github.com/obra/superpowers/tree/v6.3.0/skills)
- [Matt Pocock Skills 的实际插件清单](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/.claude-plugin/plugin.json)
- [Spec Kit 的内置命令模板](https://github.com/github/spec-kit/tree/v1.0.1/templates/commands)
- [gstack 的安装与目录说明](https://github.com/garrytan/gstack/blob/ad8400543cd9ce8d07641362db48d44a95417e33/README.md)
- [Addy Osmani Agent Skills 的工作流说明](https://github.com/addyosmani/agent-skills/blob/7cb7a20bb38b199728d456999c725a0488490ab6/README.md)
- [OpenSpec 的命令参考](https://github.com/Fission-AI/OpenSpec/blob/v1.11.0/docs/commands.md)
- [BMAD 的 Method Skills](https://github.com/bmad-code-org/BMAD-METHOD/tree/v6.11.0/src/bmm-skills) 与 [Core Skills](https://github.com/bmad-code-org/BMAD-METHOD/tree/v6.11.0/src/core-skills)
- [Compound Engineering 的 Skills](https://github.com/EveryInc/compound-engineering-plugin/tree/compound-engineering-v3.23.4/skills)

---
name: hexo-learn-topic
description: 将“从零系统学习技术、框架、语言、知识点或开源项目”转化为经过实时调研、两轮确认、独立查漏、Hexo 课程占位和逐篇创作的长期路线；用于新建或继续系统课程，不用于一次性概念问答、普通文章编辑、故障排查或默认修改外部仓库。
compatibility: 需要互联网访问、支持独立子代理的 Agent 环境、Node.js 20.19+ 与已安装的本博客依赖。
---

# Outcome

把学习目标推进为可公开阅读、可逐篇完成的 Hexo 课程，同时保证路线完整、文章职责清楚、正文有事实和独立审查证据。

## Routing

- 学习技术、框架、语言或知识点：完整读取 `workflows/§01-start-topic.md`。
- 学习 GitHub URL、`owner/repo` 或成熟开源项目：完整读取 `workflows/§02-start-repository.md`。
- 已确认路线，需要设计文章地图：完整读取 `workflows/§03-design-course.md`。
- 已确认文章地图，需要创建路线图与占位文章：完整读取 `workflows/§04-scaffold-course.md`。
- 继续既有课程或编写下一篇文章：完整读取 `workflows/§05-resume-and-write.md`。
- 一次性概念解释或普通故障排查直接回答；普通文章创建、编辑和视觉重构使用 `hexo-blog-maintenance`。

## Steps

1. 查明事实
   - 运行项目与内容审计，搜索已有路线和相似文章。
   - 从当前官方资料、源码、发布记录和高质量社区问题核验版本、前置、边界与常见误区。
   - 按 `rules/research-policy.md` 的有限枚举合同，为当前版本建立可核对的官方能力全集；冻结版本、入口 manifest、遍历边界、稳定标识、去重规则与不可访问入口。软件库不能只枚举方法名：每个公开成员、属性、模块级入口和公开签名参数都必须进入可复算清单，并保留稳定标识和来源。
   - 完成条件：动态事实有来源，官方稳定标识集合可复算，未知和无法访问的资料已明确标记。
2. 确认课程路线
   - 默认读者从零开始，但不重复询问环境中可查明的事实。
   - 先提交路线、阶段、前置、毕业成果、范围和可直接作为文章主题的学习主题，等待第一次确认。
   - 第一轮确认同时冻结学习主题与主题文章的一一对应关系；`N` 个学习主题对应 `N` 篇同名主题文章，另加一篇必选入门路线，以及最多一篇进阶路线和一篇实战或总结。
   - 完成条件：用户确认学习范围、推荐顺序、学习主题和 `N+1～3` 篇文章安排；确认前保持只读。
3. 设计并复核文章地图
   - 按第一次确认的学习主题逐项生成同名主题文章，不得在第二轮擅自拆分、合并或改名；确需改变学习主题时退回第一轮重新确认。
   - 为每篇文章确定真实名称、唯一职责、前置、详细大纲、示例、视觉机会和复习编排，并按 `rules/curriculum-quality.md` 检查知识职责、心智模型、操作链路与失败边界是否过载、过碎或重复。入门路线只做主题介绍和阅读入口，不塞面试题或课程生产元信息。正文 H2/H3 只保留简短的对象、动作或边界名，通常不超过 15 个字符；H2 承担完整读者任务，H3 只拆同一任务的子步骤或判断，不用一组扁平 H2 堆积 API。同步冻结全系列共用的一张封面合同：简短系列名称、准确主题标识、4～5 个课程关键词、固定风格参考和本地文件名。
   - 按 `rules/article-tag-selection.md` 为每个正文块记录读者任务、首选标签、选择理由、核心信息可见性和失败降级，并持久化到 `data/<主题路径段>.json` 的 `course.article_block_tag_plans[文章标题]`。必须从当前完整注册目录中比较候选并说明当前主承载为何合适；直接可见的提示按语义使用 Butterfly `note <级别> flat`，深入补充使用 `folding`，平行方案使用 `tabs`，不能把 `note` 当作连续解释的默认容器，也不能为追求数量硬塞组件。
   - 把能力全集逐项处置为“核心详解、正文简述、进阶路线、弃用迁移、明确不纳入”。前四类指定唯一主文章，明确不纳入项不得指定文章；不允许未处置、重复或虚构标识。
   - 把冻结的路线、文章地图、能力全集与处置账本交给不继承主对话的独立子代理做全量差集审查；修复阻塞项并重新审查。
   - 完成条件：官方集合与账本集合完全相等，两侧差集、重复和未处置均为 0，Reviewer 无阻塞项，用户完成第二次确认。
4. 创建课程占位
   - 第二次确认后先按 `workflows/§04-scaffold-course.md` 的参考图提示词合同生成并验收一张本地系列封面，再在 `source/_posts/learn-topic/<主题路径段>/` 创建动态命名的路线图和全部文章占位。
   - 路线图、占位文章和后续正式文章统一复用同一个 `cover`；不得逐篇生成、随机替换或回退到 Butterfly 随机封面。
   - 路线图可渲染；其他文章带隐藏占位标记并保持 `published: false`，只写 `rules/published-article-contract.md` 配套的文章职责、内容边界、正文编排、视觉与复习、验收证据合同，不填充正式正文或假 FAQ、假闪卡。
   - 在 `data/<主题路径段>.json` 写入 schema v2 课程契约，持久化第一轮学习主题、可选篇、完整文章清单、逐正文块 `course.article_block_tag_plans` 和无损能力账本，并写入 `course.public_article_contract: "v1"` 激活公开正文合同；课程文章 Front Matter 不保存内部账本。
   - 完成条件：文件与路线一一对应，全仓库 lint 通过，路线图真实构建和预览通过。
5. 完成课程文章
   - 默认只选择路线中下一篇未完成文章；用户明确要求批量完成时，先冻结本批次文章及顺序，再按同一门禁逐篇处理，不并行写入相互依赖的正文。
   - 每篇先刷新该篇的能力分配及官方来源，再完整读取 `../hexo-blog-maintenance/rules/technical-writing-style.md`、`rules/article-tag-selection.md` 与 `references/butterfly-tag-usage.md`，运行标签审计，并调用 `hexo-blog-maintenance` 完成正文结构、自然技术叙述、逐块语义标签预案、图片、参考资料卡片和未发布文章的草稿验证；把最终预案写回该篇的 `course.article_block_tag_plans`，难点故事或替代推演的计划按模板存入既有 `core_content`、`rationale` 和 `directly_visible` 字段，使新会话和独立 Reviewer 都能读取；初稿必须交给干净上下文 Article Reviewer 逐项查漏。
   - 修复时重新调用维护 Skill 完成受影响验证，再独立复查和执行隔离的公开候选验证。候选通过后，同一工作流立即删除占位标记并把该篇改为 `published: true`，同步路线图；不得等待用户提醒。
   - 每篇文章完成公开门禁、真实构建和路由冒烟后，自动在博客根目录运行 `./hexo-publish.sh local --background --no-clean`，默认只进行本地构建并启动后台预览服务（优先使用 4000 端口；被其他进程占用时自动选择下一个可用端口，以脚本输出地址为准），不选择云端发布。命令失败时读取退出码与 `logs/hexo-publish.log`（该日志覆盖清理、构建和服务启动输出），自行修复本次任务范围内的文章、配置或脚本问题，重跑受影响检查并重试，不向用户请求确认，也不得切换到 `cloud` 或 `npm run deploy`。
   - 完成条件：单篇模式在目标文章状态有证据后停止；批量模式继续下一篇，直至确认批次全部完成或出现阻塞。

## Mandatory Gates

- 关键一手资料不可访问时停止路线创建，不用模型记忆冒充当前事实。
- 第一次确认只授权继续设计文章地图，不授权创建文件；第二次确认才授权生成系列封面并创建本课程的路线图与占位文章。
- 系列封面必须在第二次确认后、占位写入前生成；生成时必须把 `assets/course-cover-reference.png` 作为风格与构图参考，并使用文章地图冻结的主题内容替换参考图中的 Python 元素。图像生成能力不可用或封面验收失败时停止，不创建缺少统一封面的课程脚手架。
- Curriculum Reviewer 与 Article Reviewer 都必须独立、只读且不继承主对话；无法调用时标记阻塞，不用主代理自评替代。
- 官方能力全集、版本依据或处置账本缺失时，Reviewer 只能返回 `INSUFFICIENT_INFORMATION`；存在未归属、重复归属或无依据排除项时不得进入写作或给出 `PASS`。
- 全集入口 manifest、逐项账本、第一轮学习主题和文章映射必须无损持久化在 `data/<主题路径段>.json` 的 schema v2 课程契约中；课程 Front Matter 出现任何 `learn_topic_*` 内部字段立即阻断。新会话无法仅凭项目文件恢复时不得继续写作。
- Article Reviewer 一次只审一篇。运行时任务必须完整提供该篇分配、能力全集、处置账本、逐正文块结构与标签计划、按 `rules/article-tag-selection.md` 生成的当前标签能力快照和 Reviewer Prompt，不得用“重点核验 API”或“重点检查标签”等临时摘要替代逐项差集。
- 正文写作必须完整调用 `hexo-blog-maintenance` 并遵循 `rules/published-article-contract.md`；每个解释块都必须落实读者任务与承载方式；普通 Markdown 保留结构内容，故事自然段只适用公开合同第 2.1 节的显式边界例外。发布正文不得出现占位合同、重复或手写的课程导航、能力账本或“前置文章是……”文案；只保留唯一合法的 `{% course_series %}` 导航。`audit.mjs content --release` 必须拦截非法故事片段及例外范围外的裸解释块。未发布文章在其验证阶段使用隔离 `--draft` 构建和浏览器验收，Reviewer 修订后重跑受影响的维护验证。
- 标签预案与可见性、降级和组件门禁统一执行 `rules/article-tag-selection.md`，不得只证明“使用了标签”。
- 课程契约启用 `course.forbid_local_absolute_paths: true` 时，公开课程正文禁止硬编码本机文件系统绝对路径，包括 `/Users/...`、`/tmp/...`、`/dev/null`、`file:///...`、Windows 盘符路径和 UNC 路径；实验命令使用 `mktemp` 变量、相对文件或标准输入输出。`/img/...`、`/posts/...` 等站点根相对 URL、HTTP 接口路径以及 `localhost`/`127.0.0.1` 网络夹具地址不属于本规则；课程模板默认启用，`audit.mjs content --release` 必须阻断违规路径。
- 公开课程正文禁止使用 Tag Plugins Plus `tip`。概念、结论、成功标准、注意事项和高风险警告分别使用语义匹配的 Butterfly `note info|primary|success|warning|danger flat`；`warning` 不得误写为 `waring`。长原理、完整配置、日志和次要案例按需改用 `folding`，不得把核心结论藏入折叠区。
- 每篇文章通过验证前保持占位标记和 `published: false`；不得把普通构建成功当作未发布文章已经被解析。正文通过公开候选门禁后必须在同一流程自动移除标记并切换为 `published: true`。
- 所有课程 Mermaid 只使用 `{% mermaid %}` 容器。入门路线固定为“课程目标、前置条件、学习路径、文章安排、开始学习、参考资料”六个 H2，不放 flashcard；主题、进阶和实战文章可按复习价值选择 FAQ 与闪卡，题数不设固定上限，存在 `常见问题` 才要求其中有 `flashcard`/`flashcard_ref`。闪卡回答保持精简，解析遵循全站技术文风规范并能独立讲清原因、过程和边界；抽象或复杂题至少使用一种合适的 Markdown 辅助表达。公开课程的 `参考资料` 必须使用 `{% linkgroup %}` / `{% link %}` 资料卡并包含有效 HTTP(S) 链接；每个资料卡必须显式提供与目标资料同域或同组织的官方图标，只有能明确证明属于目标资料的官方产品 CDN 才可例外，禁止默认头像、封面、占位图、资料页本身或无关域名图片。每篇已发布课程文章还必须通过标签渲染组合门禁，不能只有 `course_series`、资料链接或纯 Markdown 正文。最终交付前运行 `node .agents/scripts/audit.mjs lint --json`，由该入口统一检查项目、目录与命名、配置与依赖、代码语法、Skill 与软链接、文档链接、全部文章与页面、标签和图片资源；只在 `status: pass` 时进入用户验收，否则按输出的具体文件修复并重跑。
- 标题与正文文案必须分工：标题只负责让读者定位本节，标签块负责解释“为什么、何时、怎么做”和失败边界。已发布课程文章不得保留 `章节计划`、`学习目标`、`验证方式` 等内部合同，也不得重复课程导航；lint 会对全仓库公开文章检查 H2/H3 风格、公开元文案和标签覆盖。出现具体文件错误时必须修复后重跑，不能靠模型自觉放行。

## Delivery

- 路线设计阶段按 `templates/learning-outline-reply.template.md` 交付用户可识别的“学习大纲”回复；内部调研、文章地图和 Reviewer 只用于保证学习主题与文章安排完整，不作为单独的用户交付内容。
- 脚手架阶段完成后，按 `templates/course-roadmap-created-reply.template.md` 说明已创建的课程、学习顺序、图解与实验、闪卡重点和下一篇文章。用户回复不得混入目录树、文件路径、Front Matter、执行命令、审计结果、Reviewer 结论或验证状态。
- 单篇文章完成后只说明文章标题与链接、这篇学什么、包含的图解或实验、闪卡重点和下一篇文章；来源整理、Reviewer 过程、执行命令和验证记录不混入学习回复。只有失败确实阻止文章可用时，才简要说明阻塞原因。

## Guardrails

- 不声称穷尽互联网；用覆盖处置账本、来源核验和 Reviewer 证据说明有限官方范围。
- 不未经确认改写、迁移或删除旧文章；旧文不满足当前课程质量时先提出升级或新建建议。
- 不默认 clone 到持久目录、修改外部仓库、执行 Patch、commit、push、创建 Issue/PR、云端部署、安装依赖、清理生成物或修改 Butterfly 主题；课程文章完成后的本地预览只按上述 `local --background --no-clean` 路由执行。
- 本地预览失败时必须先读取退出码和日志，自行处理可修复错误并重试；不得以错误为由切换云端发布或向用户索要确认。外部不可控阻塞只能记录已完成的处理和阻塞原因，不得伪造发布成功。
- 社区问答只用于发现高频问题和真实踩坑；技术结论必须与当前官方资料或源码交叉核验。
- 不在公开文章、Prompt、日志或来源清单中保存凭据、私人链接或敏感请求数据。

## References

- 调研规则：`rules/research-policy.md`。
- 路线与拆篇规则：`rules/curriculum-quality.md`。
- 单篇学习文章规则：`rules/learning-article-quality.md`。
- 全站技术正文、概念解释和闪卡解析的唯一文风规范：`../hexo-blog-maintenance/rules/technical-writing-style.md`；需要校准表达粒度时读取 `../hexo-blog-maintenance/examples/technical-writing-style.example.md`。
- 课程正文的完整标签选型规则：`rules/article-tag-selection.md`；当前项目可复制语法与来源边界：`references/butterfly-tag-usage.md`。
- 第一次确认前的用户回复使用 `templates/learning-outline-reply.template.md`；完整表达参考 `examples/learning-outline-reply.example.md`。
- 学习路线图与课程占位创建后的用户回复使用 `templates/course-roadmap-created-reply.template.md`；完整表达参考 `examples/course-roadmap-created-reply.example.md`。
- 路线、文章地图、路线图正文和占位文章分别使用 `templates/` 下对应模板。
- 系列封面的固定风格参考使用 `assets/course-cover-reference.png`；提示词合同与参考图使用边界以 `workflows/§04-scaffold-course.md` 为唯一规范源。
- 课程契约使用 `templates/course-contract.template.json`；最终门禁使用 `.agents/scripts/audit.mjs lint --json`，审计契约由 `.agents/scripts/audit.test.mjs` 验证。
- 课程与单篇审查分别使用 `prompts/curriculum-reviewer.agent.md` 和 `prompts/article-reviewer.agent.md`。
- 已发布课程正文的标题、内部元文案、标签覆盖和复习边界统一以 `rules/published-article-contract.md` 为准；具体标签选型不得脱离 `rules/article-tag-selection.md`。
- 完成阶段执行 `checklists/course-acceptance.md`。

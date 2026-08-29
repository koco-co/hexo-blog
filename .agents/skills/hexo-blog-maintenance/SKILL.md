---
name: hexo-blog-maintenance
description: 维护当前 Hexo Butterfly 博客的文章、页面、Front Matter、Butterfly 内置标签与 Tag Plugins Plus 外挂标签、站点配置、自定义 CSS/JavaScript 和验证流程。用于在本项目中新增或编辑内容、选择或排查标签外挂、调整博客功能或视觉、检查构建与页面行为；不用于其他 Hexo 项目、通用技术咨询、发布推送或未经授权的 Butterfly 主题核心修改。
compatibility: 适用于 Claude Code 与 Codex；需要 Node.js 20.19.0 或更高版本，并已安装本项目 npm 依赖。
metadata:
  author: koco-co
  version: "1.2.0"
---

# Outcome

在不破坏主题定制、凭据和发布状态的前提下，按本博客的真实结构完成内容或站点维护，并给出可复现的验证证据。

## Routing

- 使用 AI 新建文章，或对已有文章进行整体视觉重构时，完整读取 `workflows/§01-authoring.md`、`workflows/§05-visual-rich-authoring.md` 和 `templates/article-visual-plan.template.md`，先执行“视觉编排确认”分支；用户确认预案前不得创建或修改文章。
- 选择、插入、组合或排查 Butterfly 内置标签与 Tag Plugins Plus 外挂标签时，完整读取 `workflows/§01-authoring.md`、`workflows/§04-tag-plugins-plus.md`，并按标签所有者读取 `references/butterfly-built-in-tags.md` 或 `references/butterfly-tag-plugins-plus.md`，执行“标签外挂”分支。
- 新建或编辑技术文章正文时，完整读取 `rules/technical-writing-style.md`；需要校准表达粒度时读取 `examples/technical-writing-style.example.md`。这份规则是全站技术正文、概念解释和闪卡解析的唯一文风规范。
- 编写或排查课程 FAQ、面试题、自测及跨文章复习引用时，同时完整读取 `references/hexo-flashcard-plugin.md`；`flashcard` 与 `flashcard_ref` 不归 Butterfly 或 Tag Plugins Plus 所有。
- 对已有文章做不改变整体视觉结构的局部编辑，或编辑独立页面和图片时，完整读取 `workflows/§01-authoring.md` 并执行“内容创作”分支。
- 新增、迁移、重命名或排查本地图片时，同时完整读取 `workflows/§06-local-images.md`，执行“本地图片”分支。
- 调整 Hexo/Butterfly 配置、自定义 CSS/JavaScript、友链或专题页面时，完整读取 `workflows/§02-customization.md` 并执行“站点定制”分支。
- 只要求检查构建、页面效果或既有变更时，完整读取 `workflows/§03-verification.md` 并执行“验证”分支。
- 用户要求准备或执行部署时，停止本 Skill，转交 `hexo-blog-deploy`。
- 其他仓库、通用 Hexo 教程、通用 Skill 构建或与本博客无关的任务不进入本 Skill。

## Steps

1. 查明事实
   - 确认当前工作目录属于本项目，并完整读取 `rules/project-contract.md`。
   - 根据任务读取 `references/project-map.md` 和相关实时配置、源码或现有文章；不得用调研快照替代当前文件。
   - 运行 `node .agents/scripts/audit.mjs project --json` 获取脱敏的项目状态；内容任务还要运行 `content` 模式。
   - 图片任务还要运行 `node .agents/scripts/audit.mjs assets --json`，区分真实渲染引用与教程示例，并核对迁移清单。
   - 标签外挂任务还要运行 `node .agents/scripts/audit.mjs tags --json`，以已安装插件源码和实时配置确认可用能力。
   - 不向用户询问能够从代码、配置或现有内容中查明的事实。
   - 完成条件：目标文件、规范来源、现有行为、敏感边界和验证入口均已明确。

2. 确认关键决策
   - 只询问无法从环境确定且会改变内容结构、视觉方向、功能行为或验收结果的决策。
   - 需要升级 npm 主题、修改停用的历史主题、上传外部图床、增加依赖或执行清理时，先说明影响并取得对应授权。
   - 完成条件：改动范围、明确非目标和验收方式均已确定。

3. 执行
   - 内容任务完整读取 `workflows/§01-authoring.md`。
   - 新建或改写技术正文时完整读取 `rules/technical-writing-style.md`，按理解困难先设计概念故事或替代推演，再选择代码、表格、图示或图片；入口、隐喻边界与迁移验收遵循该规则，不套固定教学栏目。
   - 图片任务同时完整读取 `workflows/§06-local-images.md`。
   - AI 新建文章或整体视觉重构先完整执行 `workflows/§05-visual-rich-authoring.md`，输出文章结构与标签编排预案；只有用户确认后才能写入。
   - 标签外挂任务同时完整读取 `workflows/§04-tag-plugins-plus.md`，并按所有者读取对应参考；不得仅凭历史文章猜测语法。
   - 配置、功能或视觉任务完整读取 `workflows/§02-customization.md`。
   - 只修改用户授权范围内的源文件，不手工编辑生成目录。
   - 完成条件：目标行为已落实，引用闭合，没有顺带改动主题核心或发布状态。

4. 验证
   - 完整读取 `workflows/§03-verification.md`，先运行针对性机械检查，再完成适用的构建、浏览器和语义验收；最终必须运行全仓库 `lint`。
   - 标签外挂任务必须重跑 `tags` 审计；交互式或依赖网络的标签还要验证真实页面及失败降级。
   - 图片任务必须重跑 `assets` 审计；涉及页面资源时还要检查真实路由的图片加载与 404。
   - 机械检查通过不等于真实页面行为通过；无法运行的验证必须单独列出。
   - 完成条件：全仓库 lint 为 `pass`，实际执行的构建、页面或场景有证据；lint 任一具体文件失败都已修复并重跑，未全绿时不得交给用户验收。

## 标题与文案合同

- 正文、概念解释和闪卡解析统一遵循 `rules/technical-writing-style.md`。本节只保留标题与目录的项目特定边界，不另立第二套文风规则。
- H2/H3 是目录导航，不是摘要或答案；优先使用简短的对象、动作或边界名，通常不超过 15 个字符。
- 不把“为什么/如何/是否”等聊天式问句、冒号后的解释、多个并列概念或完整结论塞进普通章节标题。把原因、条件、步骤和失败边界放在首段、表格、图示或标签外挂中；问句只放在确有复习价值的 `常见问题` 中。
- 标题层级与 `常见问题`、`参考资料` 保持同级且简洁；入门路线的六个固定 H2 不改名。公开文案不出现“本文将”“如下”“来源”“核验于”等内部过程话术。
- 系统课程文章不在本 Skill 中另立标题、导航或公开正文规则；编辑 `source/_posts/learn-topic/` 前必须读取并遵循 `../hexo-learn-topic/rules/published-article-contract.md`，其中禁止公开 `章节计划` 等内部合同标题。
- `node .agents/scripts/audit.mjs content --json` 会报告具体文件和行号的标题风格错误；任何错误都要修复后再运行全仓库 `lint`。

## 正文视觉合同

- 系统课程文章的逐正文块覆盖、公开导航和复习合同只由 `../hexo-learn-topic/rules/published-article-contract.md` 定义；本节只说明标签选择和真实渲染边界；故事自然段例外也只由该合同定义。
- 非系统课程的新建文章或整体重写不得采用连续的纯 Markdown 文本墙；应按语义选择 Butterfly 内置标签或 Tag Plugins Plus 标签，不把标签数量当成质量指标。
- `note`/`tip` 用于结论、提示和风险，`tabs` 用于方案或代码切换，`folding`/`hideToggle`/`hideBlock` 用于非关键补充，`mermaid`/`timeline`/`chartjs` 用于关系、流程、状态和数据，`flashcard`/`flashcard_ref` 用于长期复习，`linkgroup`/`link` 用于扩展资料，`p`/`span`/`emp`/`kbd`/`bubble` 用于行内语义强调；这里只是语义映射，不是要把所有标签都凑一遍。
- 普通 Markdown 的适用范围、标签容器和失败降级以具体文章类型的合同为准；标签必须保留正文信息、可访问名称和失败降级。
- 标签语法、参数和容器闭合以当前源码和 `tags` 审计为准，真实构建后再检查页面 DOM。

## Delivery

- 最终输出包含变更范围、关键文件、实际命令与结果、页面验证、已验证、未验证和阻塞项。
- 内容任务说明 Front Matter、资源和 `abbrlink` 状态；视觉或功能任务说明验证的路由、视口和交互状态。
- 图片任务说明本地目录、引用范围、迁移清单、字节与哈希校验，以及仍保留的教程示例数量。
- 标签外挂任务说明实时插件版本、所用标签、配置门禁、外部依赖、容器闭合和实际构建或页面结果。
- 不把静态检查、构建成功或单一路由预览表述为全站或生产就绪。

## Guardrails

- 不输出 `_config*.yml`、JavaScript 或文章中的密码、Token、API Key、客户端标识或其他凭据值。
- 不修改 `node_modules/hexo-theme-butterfly/` 或 `themes/butterfly-legacy/`；运行时定制使用根配置和 `source/` 覆盖，升级主题走依赖变更。
- 不手工编辑 `public/`、`db.json`、日志或 `.deploy_git/`。
- `npm run clean` 会删除生成内容，未获得针对本次清理的明确授权时不得执行。
- 未得到发布授权时，不运行 `npm run deploy`，不提交、不推送，也不修改远程仓库。
- 不把 PicGo Token 或上传配置复制进项目；远程图床上传、删除或归档必须有单独的明确授权。
- 项目根目录、历史主题工作树和发布工作树的 Git 状态必须分别检查；历史主题状态不影响 npm 运行主题结论。写入前缩小范围，写入后逐文件核对。

## References

- 任何写入前完整读取 `rules/project-contract.md`。
- 需要定位架构、功能或文件所有权时，读取 `references/project-map.md`。
- 新建或编辑内容时，读取 `workflows/§01-authoring.md`；新文章使用 `templates/post.template.md`。
- 新建或改写技术正文时完整读取 `rules/technical-writing-style.md`；需要校准自然叙述、辅助表达和解析深度时读取 `examples/technical-writing-style.example.md`。
- 新增、迁移、重命名或排查图片时，读取 `workflows/§06-local-images.md`。
- AI 新建文章或整体视觉重构时，读取 `workflows/§05-visual-rich-authoring.md` 和 `templates/article-visual-plan.template.md`；需要确认输出粒度时读取 `examples/article-visual-plan.example.md`。
- 使用或排查 Butterfly 内置标签时，读取 `workflows/§04-tag-plugins-plus.md` 和 `references/butterfly-built-in-tags.md`；使用 Tag Plugins Plus 时读取同一工作流和 `references/butterfly-tag-plugins-plus.md`。
- 使用 `flashcard` 或 `flashcard_ref` 时读取 `workflows/§04-tag-plugins-plus.md` 和 `references/hexo-flashcard-plugin.md`。
- 编辑 `source/_posts/learn-topic/` 课程文章时，额外读取 `../hexo-learn-topic/rules/published-article-contract.md`；它是课程公开正文的唯一标题、导航、块级标签和复习合同。
- 修改配置、CSS、JavaScript 或自定义页面时，读取 `workflows/§02-customization.md`。
- 完成改动后，读取 `workflows/§03-verification.md` 和 `checklists/maintenance-acceptance.md`。
- 全仓库 Hexo lint 入口为 `node .agents/scripts/audit.mjs lint --json`；分项排查使用同一脚本的 `project`、`structure`、`config`、`code`、`skills`、`docs`、`content`、`tags` 与 `assets` 模式。

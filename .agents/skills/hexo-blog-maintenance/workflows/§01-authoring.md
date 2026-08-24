# 内容创作工作流

本工作流处理文章、独立页面、站点数据和内容资源。开始前完整读取 `rules/project-contract.md`；新文章还要读取 `templates/post.template.md`。AI 新建文章或整体视觉重构还要读取 `workflows/§05-visual-rich-authoring.md`。任务涉及 Butterfly 内置标签或 Tag Plugins Plus 时，同时完整读取 `workflows/§04-tag-plugins-plus.md`，并按所有者读取对应标签参考。

## Phase 1：确定内容类型和事实来源

1. 确认任务属于新文章、已有文章、独立页面、友链数据或图片资源。
2. 读取目标文件的完整 Front Matter 和与任务相关的正文；新内容选择一篇结构最接近的现有文章作为风格参考。
3. 将内容事实分为用户提供、项目可查和需要外部核对三类。时效性或高风险事实必须使用当前权威来源，不能照抄旧文章。
4. 如果标题、目标读者、内容范围或是否公开会改变最终结构且无法推断，每轮只确认一个关键决策。
5. AI 新建文章和整体视觉重构进入视觉丰富分支；不改变整体结构的局部修订沿用现有排版，不强制重新规划整篇文章。

完成信号：内容目标、事实来源、文件位置和公开边界明确。

## Phase 2：确认视觉编排

### AI 新建文章或整体视觉重构

1. 完整执行 `workflows/§05-visual-rich-authoring.md`，按 `templates/article-visual-plan.template.md` 输出文章结构与标签编排预案。
2. 预案只在对话中展示，不创建文章、预案文件或生成物。
3. 等待用户明确确认；用户要求调整时只修订预案并再次等待确认。
4. 用户确认后冻结章节结构、标签组合、外部依赖与降级方式；实施中需要实质调整时先提交修订预案。

### 普通局部编辑、页面和数据任务

跳过视觉编排门禁，保持用户授权范围内的既有结构和视觉语言。

完成信号：视觉丰富分支已有用户确认的预案；其他分支已明确不需要整篇视觉重构。

## Phase 3：创建或编辑 Front Matter

### 新文章

1. 优先复用 `./node_modules/.bin/hexo new "标题"`；命令不可用时才按项目命名规则创建 Markdown 文件。
2. Hexo CLI 生成后，立即按 `templates/post.template.md` 补全结构，不把当前不完整 scaffold 当成最终规范。
3. `tags` 和 `categories` 使用非空 YAML 列表；`description` 是可独立理解的摘要，不使用“本文介绍如下”等空泛措辞。
4. 创建阶段不手工编造 `abbrlink`。构建会由 `hexo-abbrlink` 写回，写回后检查唯一性和文章实际 diff。
5. `cover`、`updated`、`sticky`、`password` 等只在用户需求或既有内容模式要求时添加。

### 编辑既有文章

1. 保留与任务无关的 Front Matter 键和值。
2. 不重算或更换已有 `abbrlink`，除非用户明确要求迁移 URL 并接受链接兼容影响。
3. 不在输出、日志或报告中展示 `password` 及其他敏感值。

完成信号：Front Matter 能被 YAML 解析，初始内容审计没有字段错误；缺少 `abbrlink` 只允许作为构建前警告。

## Phase 4：编写 Markdown 与 Butterfly 标签

1. 使用清晰的标题层级，不跳级制造仅靠字号表达的结构。
2. 中英文相邻处留空格；使用英文半角标点；代码、命令、路径和配置键用反引号。
3. 围栏代码块注明合适语言；若内容本身要求展示 Markdown 围栏，正确处理嵌套，避免提前结束代码块。
4. 普通 Markdown 承载连续正文、标题、列表、表格和代码；视觉丰富分支同时落实已确认的多标签组合，不用空洞内容填充组件。
5. Butterfly 内置标签以 `references/butterfly-built-in-tags.md` 的当前源码契约为准；Tag Plugins Plus 标签以 `references/butterfly-tag-plugins-plus.md` 为准；闪卡以 `references/hexo-flashcard-plugin.md` 为准。
6. 按 `workflows/§04-tag-plugins-plus.md` 核对标签所有者、配置门禁、外部依赖和组合边界；不得为增加种类使用不适合正文语义的标签。
7. 不混淆同名或相邻能力：当前 `timeline` 来自 Butterfly；`inlineImg` 来自 Butterfly，`inlineimage` 来自 Tag Plugins Plus；`btn` 与 `btns/cell` 不是同一语法。
8. 容器标签必须按正确顺序成对闭合；参数分隔符必须保持实现要求的 `,`、`, `、` | ` 或 `||`，不能机械互换。
9. 新增图片放入 `source/img/picgo-images/`，使用有意义的文件名和替代文本，以 `/img/picgo-images/<文件名>` 引用；同时执行 `workflows/§06-local-images.md`，不上传图床。
10. 外链使用最终目标 URL，避免把真实 Token、会话链接或私人资源写入公开文章。
11. 需要长期复习的 FAQ、面试题和自测优先使用 `flashcard`；`basic`、`cloze`、`choice` 必须提供全站唯一 ID、卡组、问题、精简回答和详细解析。跨文章复用只使用 `flashcard_ref`。

完成信号：结构、标签、代码围栏、链接和图片引用完整；视觉丰富分支与已确认预案一致，没有凭据暴露。

## Phase 5：处理独立页面和数据

1. 页面 `type` 决定主题模板；编辑前读取同类型页面和对应 Pug 实现。
2. 友链只修改 `source/_data/link.yml`，保持现有列表结构、两空格缩进和字段命名。
3. 照片、视频、音乐等专题页面保留其正文使用的 HTML、标签或资源格式，不机械套用文章模板。
4. 新页面需要菜单入口时，单独检查 `_config.butterfly.yml`；未经授权不顺带调整导航。

完成信号：页面类型与主题模板匹配，数据结构可解析，导航影响已明确。

## Phase 6：交接验证

1. 运行 `node tools/hexo-blog/audit.mjs content --json`。
2. 涉及图片时运行 `node tools/hexo-blog/audit.mjs assets --json`。
3. 使用或修改标签外挂时，运行 `node tools/hexo-blog/audit.mjs tags --json`。
4. 完整执行 `workflows/§03-verification.md` 的适用步骤。
5. 构建后运行 `node tools/hexo-blog/audit.mjs content --release --json`，确认 `abbrlink` 已生成且唯一。
6. 使用 `checklists/maintenance-acceptance.md` 检查内容语义和真实页面。
7. 视觉丰富分支逐节对照已确认预案；任何实质偏差必须有用户确认过的修订预案。

失败路径：字段错误、构建失败、标签解析失败、链接或资源缺失时停止交付，修复后重跑受影响检查。

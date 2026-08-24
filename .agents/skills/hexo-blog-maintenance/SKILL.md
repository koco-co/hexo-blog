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
   - 运行 `node tools/hexo-blog/audit.mjs project --json` 获取脱敏的项目状态；内容任务还要运行 `content` 模式。
   - 图片任务还要运行 `node tools/hexo-blog/audit.mjs assets --json`，区分真实渲染引用与教程示例，并核对迁移清单。
   - 标签外挂任务还要运行 `node tools/hexo-blog/audit.mjs tags --json`，以已安装插件源码和实时配置确认可用能力。
   - 不向用户询问能够从代码、配置或现有内容中查明的事实。
   - 完成条件：目标文件、规范来源、现有行为、敏感边界和验证入口均已明确。

2. 确认关键决策
   - 只询问无法从环境确定且会改变内容结构、视觉方向、功能行为或验收结果的决策。
   - 需要直接修改 `themes/butterfly/`、上传外部图床、增加依赖或执行清理时，先说明影响并取得对应授权。
   - 完成条件：改动范围、明确非目标和验收方式均已确定。

3. 执行
   - 内容任务完整读取 `workflows/§01-authoring.md`。
   - 图片任务同时完整读取 `workflows/§06-local-images.md`。
   - AI 新建文章或整体视觉重构先完整执行 `workflows/§05-visual-rich-authoring.md`，输出文章结构与标签编排预案；只有用户确认后才能写入。
   - 标签外挂任务同时完整读取 `workflows/§04-tag-plugins-plus.md`，并按所有者读取对应参考；不得仅凭历史文章猜测语法。
   - 配置、功能或视觉任务完整读取 `workflows/§02-customization.md`。
   - 只修改用户授权范围内的源文件，不手工编辑生成目录。
   - 完成条件：目标行为已落实，引用闭合，没有顺带改动主题核心或发布状态。

4. 验证
   - 完整读取 `workflows/§03-verification.md`，先运行机械检查，再完成适用的构建、浏览器和语义验收。
   - 标签外挂任务必须重跑 `tags` 审计；交互式或依赖网络的标签还要验证真实页面及失败降级。
   - 图片任务必须重跑 `assets` 审计；涉及页面资源时还要检查真实路由的图片加载与 404。
   - 机械检查通过不等于真实页面行为通过；无法运行的验证必须单独列出。
   - 完成条件：实际执行的命令、页面或场景有证据，失败已修复并重跑，或被明确列为阻塞。

## Delivery

- 最终输出包含变更范围、关键文件、实际命令与结果、页面验证、已验证、未验证和阻塞项。
- 内容任务说明 Front Matter、资源和 `abbrlink` 状态；视觉或功能任务说明验证的路由、视口和交互状态。
- 图片任务说明本地目录、引用范围、迁移清单、字节与哈希校验，以及仍保留的教程示例数量。
- 标签外挂任务说明实时插件版本、所用标签、配置门禁、外部依赖、容器闭合和实际构建或页面结果。
- 不把静态检查、构建成功或单一路由预览表述为全站或生产就绪。

## Guardrails

- 不输出 `_config*.yml`、JavaScript 或文章中的密码、Token、API Key、客户端标识或其他凭据值。
- 不直接修改 `themes/butterfly/`；确有必要时，先展示其当前独立 Git 状态和替代方案并取得明确授权。
- 不手工编辑 `public/`、`db.json`、日志或 `.deploy_git/`。
- `npm run clean` 会删除生成内容，未获得针对本次清理的明确授权时不得执行。
- 未得到发布授权时，不运行 `npm run deploy`，不提交、不推送，也不修改远程仓库。
- 不把 PicGo Token 或上传配置复制进项目；远程图床上传、删除或归档必须有单独的明确授权。
- 项目根目录、主题工作树和发布工作树的 Git 状态必须分别检查；写入前缩小范围，写入后逐文件核对，不把任一工作树的提交或远程状态当作未经验证的回滚能力。

## References

- 任何写入前完整读取 `rules/project-contract.md`。
- 需要定位架构、功能或文件所有权时，读取 `references/project-map.md`。
- 新建或编辑内容时，读取 `workflows/§01-authoring.md`；新文章使用 `templates/post.template.md`。
- 新增、迁移、重命名或排查图片时，读取 `workflows/§06-local-images.md`。
- AI 新建文章或整体视觉重构时，读取 `workflows/§05-visual-rich-authoring.md` 和 `templates/article-visual-plan.template.md`；需要确认输出粒度时读取 `examples/article-visual-plan.example.md`。
- 使用或排查 Butterfly 内置标签时，读取 `workflows/§04-tag-plugins-plus.md` 和 `references/butterfly-built-in-tags.md`；使用 Tag Plugins Plus 时读取同一工作流和 `references/butterfly-tag-plugins-plus.md`。
- 使用 `flashcard` 或 `flashcard_ref` 时读取 `workflows/§04-tag-plugins-plus.md` 和 `references/hexo-flashcard-plugin.md`。
- 修改配置、CSS、JavaScript 或自定义页面时，读取 `workflows/§02-customization.md`。
- 完成改动后，读取 `workflows/§03-verification.md` 和 `checklists/maintenance-acceptance.md`。
- 机械检查入口为 `tools/hexo-blog/audit.mjs`。

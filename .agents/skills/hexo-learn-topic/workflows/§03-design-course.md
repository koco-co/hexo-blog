# 设计文章地图并独立查漏

本工作流只在路线第一次确认后执行。完整读取 `rules/curriculum-quality.md`、`templates/article-map.template.md` 和 `prompts/curriculum-reviewer.agent.md`。

## Phase 1：审计已有内容

1. 运行 `node tools/hexo-blog/audit.mjs project --json` 与 `node tools/hexo-blog/audit.mjs content --json`。
2. 递归搜索 `source/_posts/` 中的现有路线、文章、分类、标签、版本和相似知识点。
3. 只有旧文在版本、零基础可读性、机制深度、完整示例、视觉、FAQ 和自测方面均满足当前路线时才复用。
4. 不合格时提出“升级旧文”或“新建课程文章”的建议；修改旧文需要用户另行确认。

完成信号：每项复用建议都有逐篇依据，没有为避免重复而强行引用旧文。

## Phase 2：拆分文章

1. 为每篇文章确定一个唯一职责和一个可观察学习成果。
2. 文件名必须使用博客历史系列格式，例如 `Playwright文档(七)浏览器上下文.md`；Front Matter 标题对应为 `Playwright文档(七) 浏览器上下文`。标题只表达主题，详细介绍写入单行 `description`。
3. 路线图也占用系列序号，例如 `Playwright文档(一)学习路线.md`。只有用户明确把低频能力汇总为可选篇时，才使用“进阶内容”这类宽主题名。
4. 按 `templates/article-map.template.md` 为每篇列出前置、详细 H2/H3 大纲、完整示例、视觉计划、社区问题候选、自测与来源，并按 `rules/learning-article-quality.md` 规划参考资料卡片及必要分组，同时冻结系列封面的简短文字、主题图标和本地文件名。
5. 使用覆盖归属表检查每个知识点只有一个主归属；交叉内容通过链接说明，不复制成多篇主线。先检查文章之间的知识依赖，再检查每篇 H2/H3、示例步骤和练习顺序。

完成信号：文章依赖无环，职责不重叠，命名能独立表达内容，没有孤立知识点。

## Phase 3：启动干净上下文 Reviewer

1. 冻结用户需求摘要、已确认路线、文章地图、覆盖归属和来源清单。
2. 启动一个只读、无父对话历史的独立子代理：Codex 明确使用不继承 turns 的新代理；Claude Code 使用普通 fresh subagent，不使用继承主会话的 fork。
3. 只把冻结材料、目标文件路径和 `prompts/curriculum-reviewer.agent.md` 交给 Reviewer。
4. Reviewer 不修改文件，只返回可定位的阻塞项、非阻塞项和证据缺口。
5. 主代理修正阻塞项后，用同一输入边界重新启动独立复查，直至无阻塞项。

完成信号：Reviewer 结论为 PASS 或仅剩已向用户披露的非阻塞项。

## Phase 4：第二次确认

1. 向用户展示最终目录树、每篇文章合同、覆盖归属、Reviewer 结论和待确认的旧文处置。
2. 明确第二次确认将授权按 `workflows/§04-scaffold-course.md` 的固定视觉规格生成一张系列封面，创建本地可渲染的公开路线图和全部未发布占位文章；不授权填充正式正文、远程部署、推送或修改外部仓库。
3. 用户确认后转入 `workflows/§04-scaffold-course.md`；调整时重新执行受影响的覆盖检查与 Reviewer。

失败路径：无法创建独立子代理、Reviewer 仍有阻塞项或文章归属存在歧义时停止，不进入脚手架阶段。

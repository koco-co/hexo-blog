# Hexo Blog 项目指令

## 项目定位

- 本项目是使用 Hexo 和 Butterfly 构建的个人静态博客。
- 版本、功能开关、站点地址、时区和部署目标必须从当前 `package.json`、锁文件及 `_config*.yml` 实时读取，不依赖本文中的历史快照。
- 项目根目录已关联 Git 远程仓库；`themes/butterfly/` 和 `.deploy_git/` 仍是独立 Git 工作树。每次操作前分别检查三个工作树的实时状态，不把任一工作树的状态当作其他工作树的回滚能力。

## 项目指令与 Skill 单一来源

- `AGENTS.md` 是项目级指令的唯一来源；`CLAUDE.md` 必须保持为指向 `AGENTS.md` 的相对符号链接。
- 项目 Skill 的唯一维护源是 `.agents/skills/`；`.claude/skills/` 只保留指向对应目录的相对符号链接，不复制或分别修改。
- 从零系统学习知识点、框架、语言或开源项目，并将路线与课程文章落入本博客时使用 `hexo-learn-topic`；一次性概念问答和普通文章编辑不使用该 Skill。
- 文章、页面、Front Matter、标签外挂、站点配置、自定义 CSS/JavaScript 和页面验证使用 `hexo-blog-maintenance`。
- 发布准备和部署使用 `hexo-blog-deploy`。该 Skill 只在用户明确点名或明确要求部署时使用；调用 Skill 本身不等于授权远程发布。

## 目录与所有权

- `source/_posts/`：文章源文件。
- `source/<page>/`：关于、分类、标签、音乐、视频、友链和其他独立页面。
- `source/_data/`：友链等结构化数据。
- `source/img/`：本地图片资源；从旧图床迁移及后续新增的正文图片统一放在 `source/img/picgo-images/`，使用 `/img/picgo-images/<name>` 引用。
- `source/css/`、`source/js/`：主题覆盖样式和自定义前端功能。
- `_config.yml`：Hexo 主配置；`_config.butterfly.yml`：Butterfly 覆盖配置和资源注入。
- `tools/hexo-blog/`：项目审计工具及测试。
- `scripts/`：Hexo 自动加载的扩展目录，不用于存放普通维护脚本。
- `themes/butterfly/`：独立且可能包含用户定制的主题工作树，默认只读。
- `public/`、`db.json`、`logs/`：生成物或运行产物，不手工编辑。
- `.deploy_git/`：独立发布工作树，日常维护不得修改。

## 开始工作前

1. 运行 `node tools/hexo-blog/audit.mjs project --json`，确认运行时、依赖、配置、敏感字段位置和三个 Git 边界。
2. 图片新增、迁移或引用调整还要运行 `node tools/hexo-blog/audit.mjs assets --json`，核对本地文件、迁移清单和旧图床真实渲染引用。
3. 根据任务读取当前配置、源码、文章和对应项目 Skill；不得以旧文章、旧说明或历史审计替代实时实现。
4. 只处理用户授权的目标。主题修改、依赖安装、外部上传、清理和部署分别需要明确授权。
5. `_config*.yml`、文章和 JavaScript 可能包含凭据。只报告敏感字段的文件、行号和键名，不输出值、片段、长度或哈希。

## 内容与标签外挂

- `source/_posts/` 的文章必须包含非空的 `title`、`tags`、`categories`、`description` 和有效 `date`；`tags` 与 `categories` 使用非空字符串数组。
- 系统课程文章的 `description` 使用单行普通 YAML 字符串，不使用 `>`、`>-`、`|` 或 `|-` 等块标量；较长的背景和范围说明仍写在同一行，不塞进标题。
- 系统课程统一放在 `source/_posts/learn-topic/<主题路径段>/`。系列文件名保持简短，必须使用历史文章的 `主题文档(序号)主题.md` 形式；Front Matter 标题必须使用 `主题文档(序号) 主题`。
- 课程编号、文章依赖、篇内 H2/H3、示例步骤与练习必须遵循知识依赖顺序；先解释前置概念，再进入基础操作、组合应用、失败边界和结果验证，不按 API 名称或写作便利随意排列。
- 系统课程使用非重复的正整数 `series_order` 表示稳定篇序，且必须与文件名中的中文序号一致；正文课程导航使用 `{% course_series %}`，不得依赖标题或发布日期推断顺序。
- 一篇课程文章覆盖一个足够宽的学习维度，不把单个 API 或功能点拆成独立短文；文件名和标题简短，详细学习成果写入 `description`。
- `published` 存在时必须是布尔值。只有带课程占位标记的文章可以使用 `published: false`；正文完成并通过该篇公开候选门禁后，同一工作流必须自动删除占位标记并改为 `published: true`，不得等待用户提醒。
- `abbrlink` 可在构建前缺省，由当前 `hexo-abbrlink` 生成；发布前必须存在且全站唯一。
- 编辑已有文章时保留与任务无关的 Front Matter，包括 `cover`、`updated`、`sticky`、`password` 等可选字段，且不得展示密码值。
- 新建文章以维护 Skill 的 `templates/post.template.md` 为完整结构；使用 Hexo scaffold 创建后仍须补全缺失字段。
- 课程文章公开正文不使用“来源”“来源与核验范围”或“核验于 YYYY-MM-DD”等内部工作文案；倒数第二个 H2 固定为 `常见问题`，最后一个 H2 固定为 `参考资料`。
- 课程文章的 H2/H3 使用“快速开始”“作用范围”“核心功能”等简洁书面表达，不使用聊天式、口号式或带评价色彩的长标题。
- 需要长期复习的疑难问答、关联面试题和自测优先使用 `hexo-flashcard-plugin` 的 `flashcard`；跨文章复用同一道题使用 `flashcard_ref`，不得复制卡片正文。`basic`、`cloze`、`choice` 卡片都必须具有全站唯一稳定 ID、单一卡组、`priority:1|2|3`、精简回答和详细解析；三档依次表示高频、中频和低频，`priority` 不得省略或写成插件不支持的值。
- 使用 Butterfly 或 Tag Plugins Plus 标签前运行 `node tools/hexo-blog/audit.mjs tags --json`，并核对维护 Skill 的标签参考及当前主题或插件源码。
- 不根据历史文章猜测标签参数。容器标签必须按栈顺序闭合，复杂嵌套必须真实构建目标文章。

## 配置、CSS 与 JavaScript

- Butterfly 配置优先修改根目录 `_config.butterfly.yml`，不得为普通配置变更直接编辑主题自带配置或核心源码。
- 样式修改优先落入职责最窄的既有 `source/css/` 文件；通用覆盖才使用 `source/css/custom.css`。
- 新图片采用本地优先：直接保存到 `source/img/picgo-images/` 并引用本地路径，不通过 PicGo 上传到外部图床；历史迁移字节与 `tools/hexo-blog/image-migration-map.json` 保持一致。
- 教程围栏代码中的旧图床 URL 可作为历史示例保留，但真实渲染的封面、Markdown 图片、HTML 图片和标签外挂图片参数不得继续引用旧图床。
- 新增本地资源后检查 `_config.butterfly.yml` 的 `inject` 和实际文件路径，避免悬空引用。
- 自定义 JavaScript 使用局部作用域，初始化必须幂等，并兼容 `DOMContentLoaded` 与 `pjax:complete`。
- 依赖特定 DOM 的脚本在目标元素不存在时应安静退出。
- 第三方 API、评论、统计、搜索、网络资源或外部上传涉及隐私、失败降级或外部副作用时，不得未经确认启用或扩张范围。

## 真实命令

- 项目状态：`node tools/hexo-blog/audit.mjs project --json`
- 图片检查：`node tools/hexo-blog/audit.mjs assets --json`
- 内容检查：`node tools/hexo-blog/audit.mjs content --json`
- 发布级内容检查：`node tools/hexo-blog/audit.mjs content --release --json`
- 标签检查：`node tools/hexo-blog/audit.mjs tags --json`
- 审计工具测试：`node --test tools/hexo-blog/audit.test.mjs`
- 生成站点：`npm run build`
- 本地预览：`npm run server`
- 新文章：`./node_modules/.bin/hexo new "标题"`
- 新页面：`./node_modules/.bin/hexo new page "页面名"`
- 清理生成物：`npm run clean`，仅在用户明确授权本次清理后运行。
- 部署：`npm run deploy`，仅由部署 Skill 在本次发布明确授权且预检通过后运行。

## 验证要求

- 内容变更运行 `content` 审计；标签外挂变更同时运行 `tags` 审计。
- 图片变更运行 `assets` 审计；迁移清单内图片必须通过大小和 SHA-256 校验，真实渲染引用必须本地可解析。
- 修改 `tools/hexo-blog/audit.mjs` 或其契约时运行完整 Node 测试。
- 站点源文件变更按影响运行 `npm run build`；构建可能写入 `public/`、`db.json` 和文章 `abbrlink`，构建后重新检查相关源文件。
- 视觉或交互变更必须在真实浏览器中检查目标路由、适用视口、交互状态和控制台错误。
- 静态检查、测试、构建、浏览器页面和线上结果是不同证据层；未执行的层级标记为“未验证”。
- 本地构建成功不能证明 GitHub Actions、远程部署或线上页面成功。

## Git、生成物与外部副作用

- 保留所有不属于当前任务的修改，尤其是 `themes/butterfly/` 中已有的未提交工作。
- 未经单独授权，不直接修改 `themes/butterfly/`，不安装依赖，不运行 `npm run clean`。
- 未经本次明确授权，不运行 `npm run deploy`、`git push`，不提交、不发布，也不修改远程仓库。
- 不手工修补 `public/`、`db.json`、日志或 `.deploy_git/` 来制造通过结果。
- Git 状态只能作为变更边界参考；写入前缩小目标，写入后逐文件读取核对，不把提交或远程状态当作未经验证的回滚能力。

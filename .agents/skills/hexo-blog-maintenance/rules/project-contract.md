# 项目维护契约

本文件规定模型判断和安全边界；机械字段校验以 `.agents/scripts/audit.mjs` 为准，新文章初始结构以 `templates/post.template.md` 为准。

## 1. 事实来源与优先级

发生冲突时按以下顺序处理，并在交付中说明冲突：

1. 用户当前请求中已经明确的目标和范围；
2. 当前磁盘上的 `package.json`、`package-lock.json`、`_config.yml`、`_config.butterfly.yml`、主题实现和自定义源码；
3. Skill 的固定产物模板与机械审计规则；
4. `CLAUDE.md` 中仍与实时项目一致的开发约定；
5. 现有文章和页面，只作为风格与用法示例，不作为当前外部事实来源。

版本、开关、远程目标和功能启用状态必须实时读取。`references/project-map.md` 只负责路径和所有权映射，不能覆盖实时配置。

## 2. 路径所有权

| 路径 | 用途 | 默认处理 |
| --- | --- | --- |
| `source/_posts/` | 文章源文件 | 可在用户授权的内容范围内修改 |
| `source/<page>/` | 独立页面 | 保留页面 `type` 和专属正文格式 |
| `source/img/` | 本地图片 | 既有站点资源保留原位；正文新增与旧图床迁移图片使用 `source/img/picgo-images/` 和 `/img/picgo-images/...` |
| `source/css/` | 主题覆盖和专题样式 | 优先修改最窄的既有样式文件 |
| `source/js/` | 自定义前端功能 | 必须兼容 PJAX、避免重复监听和全局污染 |
| `source/_data/` | 结构化站点数据 | 保持既有 YAML 结构和缩进 |
| `_config.yml` | Hexo 主配置 | 只改与当前目标直接相关的键 |
| `_config.butterfly.yml` | Butterfly 覆盖配置和资源注入 | 不把完整配置或凭据复制到报告 |
| `themes/butterfly/` | 独立主题工作树 | 默认只读；直接修改必须单独授权 |
| `public/`、`db.json`、`logs/` | 生成物或运行日志 | 不手工编辑 |
| `.deploy_git/` | 发布工作树 | 维护 Skill 不修改 |

根目录 `scripts/` 会被 Hexo 当作扩展代码加载，不用于放置普通维护工具。

## 3. 内容与格式

- 新文章从 `templates/post.template.md` 开始；通过 Hexo CLI 创建后也必须立即补全到该结构。
- `abbrlink` 由当前安装的 `hexo-abbrlink` 在构建时写回；构建前允许缺省，发布检查必须存在且唯一。
- 编辑已有文章时保留与任务无关的 Front Matter，包括 `cover`、`updated`、`sticky`、`password` 等可选字段；禁止展示 `password` 值。
- 时区以实时 `_config.yml` 为准；当前项目采用 `Asia/Shanghai`，日期格式遵循项目配置。
- Markdown 使用英文半角标点；中英文相邻处保留空格；围栏代码块前后留空行；命令、路径、键名和代码使用反引号。
- Butterfly 与 Tag Plugins Plus 容器必须成对且按栈顺序闭合；新增用法前运行 `node .agents/scripts/audit.mjs tags --json` 并核对当前主题或插件实现，不根据文章中的历史说明猜测。
- `flashcard` 与 `flashcard_ref` 由 `hexo-flashcard-plugin` 提供。只有显式卡片进入复习系统；跨文章复用同一道题只引用稳定 ID，不复制卡片正文。新增或修改后必须运行标签审计和真实 Hexo 构建。
- 系统课程使用项目扩展 `{% course_series %}` 和 Front Matter `series_order` 生成稳定课程导航；`series_order` 与文章中文序号一致，不使用 Butterfly `{% series %}` 的标题或日期排序替代知识顺序。
- Tag Plugins Plus 的参数分隔符不是统一格式；严格使用 `references/butterfly-tag-plugins-plus.md` 与实时源码规定的 `,`、`, `、` | ` 或 `||`。
- 图片采用本地优先：正文新增图片直接放在 `source/img/picgo-images/`，用 `/img/picgo-images/<name>` 引用，不经过 PicGo 或其他远程图床。
- 旧图床迁移保持原始字节，不自动压缩、缩放或转换格式；固定来源提交，并在 `tools/hexo-blog/image-migration-map.json` 记录源路径、目标路径、字节数和 SHA-256。
- 教程围栏代码中的旧图床地址可保留为示例；真实渲染的封面、Markdown/HTML 图片和标签外挂图片参数不得继续引用旧图床。

## 4. 配置与前端功能

- 主题配置优先放在根 `_config.butterfly.yml`，不得为修改配置而编辑主题自带 `_config.yml`。
- 通用覆盖样式放入 `source/css/custom.css`；已有专题样式文件能够精确承载时，使用该文件。
- 新增本地 CSS/JavaScript 后，只有确实需要全站加载时才加入 `inject`；同时检查资源路径存在。
- JavaScript 使用 ES6+、中文注释和局部作用域。初始化必须可重复执行，并处理 `DOMContentLoaded` 与 `pjax:complete` 生命周期。
- 依赖特定 DOM 的脚本在目标页面不存在时应安静退出，不制造控制台错误。
- 涉及位置、评论、统计、搜索或第三方 API 时，先识别网络失败、限流、隐私和降级行为。
- 内容任务不得自动开启 `tag_plugins`、`issues` 或修改插件 CDN；这些属于配置与外部行为变更，需要单独确认并执行真实页面验收。

## 5. 凭据与隐私

- 只允许报告敏感字段的文件、行号和键名，不报告值、值片段、长度、哈希或可逆变体。
- 不把凭据复制到 Skill、测试夹具、命令行、截图、日志或交付报告。
- 远程 URL 必须移除用户名、密码、查询参数和片段后再展示。
- 如果任务需要新增真实凭据，停止并让用户使用项目既有的安全配置途径完成。

## 6. 验证结论

- `audit.mjs` 退出码、Node 语法检查和 Hexo 构建属于机械证据。
- 浏览器中真实路由、视口、交互和控制台状态属于页面证据。
- 文案质量、信息完整性、视觉一致性和真实业务结果使用语义清单验收。
- 任何层级未执行时都写入“未验证”；存在失败或需用户决策时写入“阻塞”。

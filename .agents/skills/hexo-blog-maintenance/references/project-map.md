# 项目结构与功能地图

执行任务时以实时文件和 `node tools/hexo-blog/audit.mjs project --json` 为准。本地图只说明稳定的所有权和定位方式。

## 1. 架构

| 层级 | 关键路径 | 说明 |
| --- | --- | --- |
| 站点生成 | `package.json`、`_config.yml`、`scripts/course-series.js` | Hexo 命令、URL、永久链接、搜索、课程导航和部署配置 |
| 主题覆盖 | `_config.butterfly.yml` | 菜单、社交、文章、侧栏、搜索、评论、特效和资源注入 |
| 内容 | `source/_posts/` | Markdown 文章及 Front Matter |
| 页面 | `source/*/index.md`、`source/wallpaper/*/index.md` | 关于、分类、标签、音乐、视频、友链和照片页 |
| 本地图片 | `source/img/picgo-images/`、`tools/hexo-blog/image-migration-map.json` | 正文图片、历史迁移来源与完整性校验 |
| 数据 | `source/_data/link.yml` | 友链数据 |
| 自定义样式 | `source/css/` | 全站、宇宙背景、文章标签、归档/分类/标签页样式 |
| 自定义脚本 | `source/js/` | 宇宙背景、农历、节日、位置欢迎、热力图和标签样式 |
| 主题实现 | `themes/butterfly/` | 独立 Git 工作树和 Pug/Stylus/标签解析器，默认只读 |
| 发布产物 | `public/`、`.deploy_git/` | 构建输出与独立发布工作树，不作为内容源 |

## 2. 现有命令

| 目标 | 命令 | 影响 |
| --- | --- | --- |
| 生成 | `npm run build` | 写入 `public/`、`db.json`，插件可能写回文章 `abbrlink` |
| 本地服务 | `npm run server` | 启动默认端口 4000 的预览服务 |
| 清理 | `npm run clean` | 删除生成内容；必须单独授权 |
| 部署 | `npm run deploy` | 构建并向远程仓库推送；只允许部署 Skill 调用 |
| 新文章 | `./node_modules/.bin/hexo new "标题"` | 使用现有 scaffold 创建文章，随后必须补全 Skill 模板 |
| 新页面 | `./node_modules/.bin/hexo new page "页面名"` | 创建页面后按目标页面类型补全 |
| 图片审计 | `node tools/hexo-blog/audit.mjs assets --json` | 核对迁移哈希、本地引用与旧图床教程示例边界 |

项目当前没有独立 lint 命令。`tools/hexo-blog/audit.mjs` 提供项目级机械检查，`node --test tools/hexo-blog/audit.test.mjs` 验证审计契约。

## 3. 功能定位

调研时下列功能处于启用状态；执行时必须实时复核：

| 功能 | 配置或实现入口 |
| --- | --- |
| 本地搜索 | `_config.yml` 的 `search` 与 `_config.butterfly.yml` 的 `search` |
| 评论系统 | `_config.butterfly.yml` 的 `comments`；当前 `comments.use` 为空，Giscus 待完整配置后再启用 |
| PJAX、懒加载 | `_config.butterfly.yml` 的 `pjax`、`lazyload` |
| 暗色模式、阅读模式、繁简转换 | `darkmode`、`readmode`、`translate` |
| 字数与阅读时长 | `wordcount` |
| Mermaid、Chart.js、ABCJS、系列文章 | 相应主题开关和 Butterfly 标签实现 |
| 闪卡复习 | `package.json`、`_config.yml` 的 `flashcard` 与 `hexo-flashcard-plugin` |
| 文章版权、打赏、相关文章、目录、侧栏 | `_config.butterfly.yml` 的同名区域 |
| 短链接 | `_config.yml` 的 `permalink`、`abbrlink` 与 `hexo-abbrlink` |
| 文章加密 | `_config.yml` 的加密配置和文章 Front Matter |

## 4. 本地注入资源

| 资源 | 主要职责 |
| --- | --- |
| `source/css/custom.css` | 全站主题覆盖 |
| `source/css/universe.css`、`source/js/universe.js` | 宇宙背景 |
| `source/css/page-archive-categories-tags.css` | 归档、分类和标签页 |
| `source/css/post-tags.css`、`source/js/post-tags-style.js` | 文章标签视觉 |
| `source/js/lunar.js`、`source/js/day.js` | 农历与节日提示 |
| `source/js/txmap.js` | 位置欢迎信息和第三方位置服务 |
| `source/js/tag-heatmap.js` | 分类和标签热力图 |
| `source/js/snow.js` | 已存在但调研时未启用的雪花效果 |

新增、移除或重命名这些资源时，同步检查 `_config.butterfly.yml` 的 `inject`，并用项目审计确认没有悬空引用。

## 5. Butterfly 标签来源

- 当前文章大量使用 `note`、`btn`、`folding`、`tabs`、`link`、`timeline`、`mermaid`、`gallery`、`chartjs`、`hide*` 等标签；系统课程导航由项目扩展 `course_series` 提供。
- `flashcard` 与 `flashcard_ref` 来自独立的 `hexo-flashcard-plugin`，语法和复习身份规则见 `references/hexo-flashcard-plugin.md`。
- `course_series` 来自 `scripts/course-series.js`，读取文章的 `series` 与 `series_order`，生成当前篇高亮和稳定篇序，不属于 Butterfly 或 Tag Plugins Plus。
- Butterfly 内置标签的当前注册、参数和使用边界见 `references/butterfly-built-in-tags.md`；`folding`、`link` 和其他 Plus 能力见 `references/butterfly-tag-plugins-plus.md`。
- 常用格式可参考 `source/_posts/Butterfly文档(三)标签外挂.md`，但真实解析能力以 `themes/butterfly/scripts/tag/`、已安装插件源码和 `node tools/hexo-blog/audit.mjs tags --json` 为准。
- 使用容器标签时验证开始和结束标签数量相等；使用复杂嵌套时必须真实构建对应文章。

## 6. 已知基线差异

- `CLAUDE.md` 要求的文章字段比 `scaffolds/post.md` 更完整；维护 Skill 使用自身文章模板补齐，不在本次修改 scaffold。
- GitHub Actions 使用的 Node 版本低于当前 Hexo 要求；只报告，不在本次修复。
- 项目根目录已关联 Git 远程仓库；主题和发布目录仍是独立工作树，三个工作树的状态都必须实时检查。

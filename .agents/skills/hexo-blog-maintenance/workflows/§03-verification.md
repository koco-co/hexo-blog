# 维护验证工作流

本工作流验证内容、配置和前端变更。验证强度必须与改动风险一致；未执行的层级不能用较低层级替代。

## Phase 1：机械检查

1. 运行 `node .agents/skills/hexo-learn-topic/scripts/audit.mjs project --json`。
2. 涉及文章时运行 `node .agents/skills/hexo-learn-topic/scripts/audit.mjs content --json`；构建后再加 `--release`。
3. 涉及图片时运行 `node .agents/skills/hexo-learn-topic/scripts/audit.mjs assets --json`，核验本地文件、迁移哈希、旧图床真实引用和教程示例计数。
4. 涉及 Butterfly 或 Tag Plugins Plus 标签时运行 `node .agents/skills/hexo-learn-topic/scripts/audit.mjs tags --json`。
5. 配置或依赖变更运行 `config`；JavaScript、CSS 或 Shell 变更运行 `code`；Skill 或软链接变更运行 `skills`；仓库文档变更运行 `docs`。
6. 分项检查用于快速定位，不能代替最终聚合门禁。
7. 完成交付前运行 `node .agents/skills/hexo-learn-topic/scripts/audit.mjs lint --json`。输出任一具体文件错误时修复后重跑；只有 `status: pass` 才能交给用户验收。

完成信号：项目、目录与命名、配置与依赖、代码语法、Skill 与软链接、文档链接、全部文章与页面、课程契约、标签和图片资源的聚合 lint 全部通过。

## Phase 2：Hexo 构建

### 已授权的内容或站点修改

1. 运行 `npm run build`，记录退出码和关键错误。
2. 构建会写入 `public/`、`db.json`，并可能由 `hexo-abbrlink` 写回新文章；构建后核对实际源文件变化。
3. 不为“确保干净”自动运行 `npm run clean`。

### 只读审查或不允许生成物写入

1. 用 `mktemp -d` 创建明确的临时目录。
2. 将配置、scaffold、`source/`、主题和包元数据复制到临时目录，排除 `.git`、`.deploy_git`、`public`、`db.json`、日志和 `node_modules`。
3. 从临时目录链接当前项目的 `node_modules`，在那里运行 `./node_modules/.bin/hexo generate`。
4. 只删除已核对为本次创建的临时目录，不清理项目目录。

完成信号：真实 Hexo 生成成功；若失败，保留错误证据并停止更高层验收。

## Phase 3：浏览器验证

1. 启动 `npm run server`，确认端口和服务状态，不依赖固定等待时间判断可用。
2. 使用浏览器打开与变更直接相关的真实路由；内容变更至少检查文章页，配置或公共样式变更检查所有受影响页面类型。
3. UI 变更至少检查一个桌面视口和一个移动视口，并覆盖默认、暗色及适用的悬停、展开、错误或空状态。
4. PJAX 相关功能同时验证首次加载、从另一页站内跳转进入和再次离开/返回。
5. 检查浏览器控制台、网络失败、资源 404 和重复 DOM/监听器表现。
6. 外挂标签还要覆盖其适用状态：容器展开、卡片长文本、媒体失败、外部服务失败、`carousel` 初始化和 PJAX 返回。
7. 保存必要的截图或可定位证据，完成后停止本次启动的服务。

完成信号：预期页面和交互在真实浏览器中可观察地成立，没有本次变更新增的错误。

## Phase 4：语义验收与报告

1. 完整执行 `checklists/maintenance-acceptance.md` 的适用部分。
2. 将结果分成：已验证、未验证、阻塞、既有基线问题。
3. 构建成功只证明生成流程；单个页面成功只证明该页面和已执行场景。
4. 任何修复后重跑直接受影响的机械、构建和浏览器场景，并在最终状态重跑全仓库 lint。

完成信号：用户能够复现验证，并能判断剩余风险是否可接受。

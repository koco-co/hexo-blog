# Butterfly 标签外挂工作流

本工作流处理 Butterfly 内置标签、`hexo-butterfly-tag-plugins-plus` 与 `hexo-flashcard-plugin` 的选择、插入、组合、迁移和排错。开始前完整读取 `rules/project-contract.md` 和目标内容，并按所有者读取对应参考。不能用历史文章代替当前主题或插件源码。

## Phase 1：确认实时能力

1. 运行：

```bash
node tools/hexo-blog/audit.mjs tags --json
```

2. 核对已安装版本、配置来源、`enable`、`issues`、Markdown 渲染器、实际注册标签和容器标签。
3. 若版本不是参考文件记录的基线，读取当前 `node_modules/hexo-butterfly-tag-plugins-plus/index.js`，以实时注册和参数解析为准，再更新使用方案。
4. 若标签来自 Butterfly 本体，读取对应的 `themes/butterfly/scripts/tag/*.js`；主题目录保持只读。
5. 使用 `flashcard` 或 `flashcard_ref` 时读取 `references/hexo-flashcard-plugin.md` 和当前安装插件的解析器；确认版本、配置路径、卡片类型、全站 ID 与引用目标。
6. 审计为 `blocked` 时不插入新标签，不通过修改主题或跳过构建来绕过。

完成信号：标签所有者、实时语法、配置门禁、外部依赖和验证方式均已明确。

## Phase 2：按内容目标选择标签

AI 新建文章或整体视觉重构先使用 `workflows/§05-visual-rich-authoring.md` 形成并确认标签编排；本阶段负责把已确认的内容目标映射到当前真实能力，不单独改变文章结构。

| 内容目标 | 优先能力 | 选择条件 |
| --- | --- | --- |
| 普通说明、列表、引用或图片 | Markdown | 无需特殊交互或卡片布局 |
| 提示、选项卡、时间线、图表 | Butterfly 内置标签 | 当前主题已经注册相应能力 |
| 折叠、链接卡片、按钮组 | `folding`、`link`、`btns/cell` | 需要对应视觉结构，且移动端仍可读 |
| 行内强调、键帽、注释 | `u`、`emp`、`wavy`、`del`、`kbd`、`psw`、`nota`、`bubble` | 语义明确，不用颜色代替信息 |
| GitHub、站点、徽章卡片 | `ghcard`、`site/sitegroup`、`bdage` | 接受第三方网络失败并有可理解文本 |
| 音视频、相册 | `audio`、`video/videos`、`image`、`inlineimage`、`carousel` | 资源允许公开，尺寸和移动端行为已确定 |
| 引用文献 | `referto`、`referfrom` | ID 唯一且引用与来源成对 |
| 长期复习题 | `flashcard`、`flashcard_ref` | FAQ、面试题或自测需要进入复习队列；定义 ID 全站唯一，引用目标已存在 |
| Issues 动态数据 | `issues` | 仅当实时配置开启并确认公开 API、隐私与降级 |

不要混淆：

- `timeline` 属于当前 Butterfly，不属于插件 1.0.18；不得恢复插件旧版同名实现。
- `inlineImg` 是 Butterfly 标签，`inlineimage` 是 Tag Plugins Plus 标签。
- `btn` 是 Butterfly 单按钮，`btns/cell` 是插件按钮组。
- `note` 是 Butterfly 提示容器，`tip` 是插件样式容器。
- `gallery` 是 Butterfly 图库，`carousel` 是插件旋转相册且需要唯一 DOM ID。

完成信号：所选标签服务于明确的信息目的，所有者唯一；视觉丰富分支形成多样组合，普通分支不为凑数量增加无关组件。

## Phase 3：按源码契约编写

1. 按标签所有者从 `references/butterfly-built-in-tags.md` 或 `references/butterfly-tag-plugins-plus.md` 复制结构，再替换内容，不凭记忆重排参数。
2. 保持源码要求的分隔符；插件同时存在 `,`、`, `、` | ` 和 `||` 四种解析方式。
3. 容器标签按栈顺序闭合，不能交叉嵌套。当前插件容器为：`btns`、`carousel`、`folding`、`ghcardgroup`、`linkgroup`、`poem`、`sitegroup`、`tip`、`videos`。
4. `cell` 放在 `btns` 内；组合卡片优先放入对应 group 容器。
5. `carousel` ID 在当前页面唯一，只使用字母、数字、`-` 或 `_`；正文图片仍需替代文本。
6. `referto` 与 `referfrom` 使用相同且唯一的引用 ID，来源 URL 必须是最终公开地址。
7. 不在标签参数中写入 Token、Cookie、带凭据 URL、私人仓库地址或不可公开 API。
8. `issues` 当前关闭；未获得配置变更授权时，不建议使用，也不修改 `_config.butterfly.yml` 放行。
9. 对外部图片、GitHub 卡片、徽章、音视频和动态 API 准备可理解的正文或链接，网络失败不能使核心信息消失。
10. `flashcard` 只接受 `basic`、`cloze`、`choice`，正文按 `question`、`answer`、`explanation` 顺序声明；`flashcard_ref` 只提供既有 `id`，不覆盖题目、答案、解析、卡组或标签。

代表性结构：

```markdown
{% folding blue, 展开查看详情 %}
折叠正文。
{% endfolding %}

{% btns rounded grid2 %}
{% cell 项目主页, https://example.com, fa-solid fa-house %}
{% cell 使用文档, https://example.com/docs, /img/docs.png %}
{% endbtns %}

{% link 示例站点, https://example.com, /img/site.png %}

正文中的术语{% bubble API, 应用程序接口, #4f8cff %}。
```

完成信号：名称、大小写、参数顺序、分隔符、闭合标签、ID、资源和公开边界均与当前实现一致。

## Phase 4：机械检查与真实构建

1. 修改前后均运行 `node tools/hexo-blog/audit.mjs tags --json`。
2. 涉及文章时同时运行 `node tools/hexo-blog/audit.mjs content --json`。
3. 执行真实 Hexo 生成；只读任务在隔离临时目录生成，不以字符串扫描代替解析器结果。
4. 构建失败时定位到具体标签、参数或容器，不删除标签正文来掩盖错误。
5. 查看生成 HTML 是否包含目标结构；此步骤只证明渲染结果存在，不证明视觉与交互正确。

完成信号：标签审计通过，真实 Hexo 生成成功，没有未知标签、禁用能力或容器错误。

## Phase 5：页面与语义验收

1. 在真实文章或页面路由验证标签；新增内容至少检查一个桌面视口和一个移动视口。
2. 检查明暗主题、长文本、长链接、图片失败、键盘焦点和适用的展开、拖动、播放状态。
3. PJAX 环境下检查首次加载和站内跳转进入；`carousel` 等脚本型标签不得重复初始化或报错。
4. 对 GitHub、徽章、远程媒体、Issues 和其他第三方能力检查网络失败后的正文可用性。
5. 使用 `checklists/maintenance-acceptance.md` 的“标签外挂”部分给出已验证、未验证和阻塞项。
6. 视觉丰富分支同时核对“视觉丰富文章”部分，并对照用户确认的编排预案。

完成信号：标签的内容语义、视觉、交互、响应式和失败降级均有与实际执行范围对应的证据。

失败路径：插件或配置不可用、注册表漂移、参数契约不明、容器错误、构建失败、外部资源不允许公开或真实页面未通过时停止交付；不得自动启用配置、修改主题、上传资源或部署。

# Butterfly Tag Plugins Plus 能力目录

本目录记录当前项目 `hexo-butterfly-tag-plugins-plus` 的可用能力和写作契约。它是 Agent 的选择与语法参考，不替代实时源码、机械审计或真实构建。

## 1. 当前基线

| 项目 | 当前事实 |
| --- | --- |
| 插件 | `hexo-butterfly-tag-plugins-plus` |
| 已安装版本 | `1.0.18` |
| 配置位置 | `_config.butterfly.yml` 的 `tag_plugins` |
| 插件开关 | 已开启 |
| 过滤器优先级 | `5` |
| `issues` 能力 | 已关闭 |
| Markdown 渲染器 | `hexo-renderer-kramed` 已声明 |
| 唯一注册标签数 | `35` |
| 插件许可证 | `Apache-2.0` |

上述状态是创建本 Skill 时的快照。每次任务先运行：

```bash
node .agents/scripts/audit.mjs tags --json
```

事实优先级：当前安装包的 `index.js` → 当前 `_config.yml` 与 `_config.butterfly.yml` → 本目录 → 历史文章。版本或注册表漂移时，先核对源码，不能继续照抄本目录。

## 2. 容器与分隔符

当前插件容器必须成对闭合：

```text
btns          -> endbtns
carousel      -> endcarousel
folding       -> endfolding
ghcardgroup   -> endghcardgroup
linkgroup     -> endlinkgroup
poem          -> endpoem
sitegroup     -> endsitegroup
tip           -> endtip
videos        -> endvideos
```

插件不是统一参数解析器：

- 多数标签按英文逗号 `,` 分隔；
- `image`、`inlineimage`、`ghcard`、`site` 要求逗号后保留空格 `, `；
- `progress` 的实现会重新拼接参数，必须写成无空格的 `75,blue,文本`；
- `issues` 使用空格包围的竖线 ` | `；
- `bdage` 同时使用 `,` 与双竖线 `||`；
- 容器正文写在开始与结束标签之间，不能放进参数列表。

## 3. 布局、强调与注释

| 标签 | 类型 | 源码语法 | 用途与约束 |
| --- | --- | --- | --- |
| `btns` | 容器 | `{% btns 样式类 %}...{% endbtns %}` | 按钮组；正文通常只放 `cell` |
| `cell` | 单体 | `{% cell 文本, URL, 图标类或图片 %}` | 按钮组单元；第三项可省略 |
| `checkbox` | 单体 | `{% checkbox [颜色] [checked], 文本 %}` | 展示型复选状态，不作为可提交表单 |
| `radio` | 单体 | `{% radio [颜色] [checked], 文本 %}` | 展示型单选状态，不作为真实表单 |
| `folding` | 容器 | `{% folding [样式], 标题 %}...{% endfolding %}` | 折叠详情；核心结论不应只藏在折叠区 |
| `tip` | 容器 | `{% tip 样式类 %}...{% endtip %}` | 插件提示块；不要与 Butterfly `note` 混淆 |
| `p` | 单体 | `{% p CSS类, 文本 %}` | 带插件样式类的段落 |
| `span` | 单体 | `{% span CSS类, 文本 %}` | 带插件样式类的行内文本 |
| `u` | 单体 | `{% u 文本 %}` | 下划线 |
| `emp` | 单体 | `{% emp 文本 %}` | 强调样式 |
| `wavy` | 单体 | `{% wavy 文本 %}` | 波浪线强调 |
| `del` | 单体 | `{% del 文本 %}` | 删除线；普通 Markdown 足够时优先 Markdown |
| `kbd` | 单体 | `{% kbd Command + K %}` | 键帽展示 |
| `psw` | 单体 | `{% psw 剧透文本 %}` | 视觉隐藏；不能用于存放真实密码或秘密 |
| `nota` | 单体 | `{% nota 术语, 注释 %}` | 悬浮注释；参数中避免额外逗号 |
| `bubble` | 单体 | `{% bubble 术语, 注释, #颜色 %}` | 气泡注释；颜色可省略 |
| `progress` | 单体 | `{% progress 百分比,颜色类,文本 %}` | 三个参数均需提供且逗号后不留空格；百分比按 `0`～`100` 使用 |

按钮组示例：

```markdown
{% btns rounded grid2 %}
{% cell 项目主页, https://example.com, fa-solid fa-house %}
{% cell 使用文档, https://example.com/docs, /img/docs.png %}
{% endbtns %}
```

当前样式源码提供的常用值：

| 标签 | 可组合样式值 |
| --- | --- |
| `btns` | `wide`、`fill`、`around`、`center`、`grid2`～`grid5`、`circle`、`rounded` |
| `checkbox`、`radio` | 状态 `checked`；形状 `minus`、`plus`、`times`；颜色 `red`、`green`、`yellow`、`cyan`、`blue` |
| `folding` | `purple`、`blue`、`cyan`、`green`、`yellow`、`orange`、`red` |
| `tip` | `info`、`success`、`warning`、`error`、`bolt`、`ban`、`home`、`sync`、`cogs`、`key`、`bell` |
| `p`、`span` | `left`、`center`、`right`、`small`、`large`、`huge`、`ultra`、`bold`、`h1`～`h5`、`red`、`yellow`、`green`、`cyan`、`blue`、`purple`、`gray` |
| `progress` | `green`、`yellow`、`red`、`cyan`、`blue`、`gray` |

## 4. 卡片、图片和外部数据

| 标签 | 类型 | 源码语法 | 用途与约束 |
| --- | --- | --- | --- |
| `bdage` | 单体 | 见下方专用语法 | Shields 徽章；标签名按源码拼作 `bdage` |
| `ghcard` | 单体 | `{% ghcard 用户或用户/仓库, 查询参数 %}` | 调用 GitHub Readme Stats；正文需另留普通文字链接作为失败兜底 |
| `ghcardgroup` | 容器 | `{% ghcardgroup %}...{% endghcardgroup %}` | 组合多个 `ghcard` |
| `icon` | 单体 | `{% icon symbol-id, 大小em %}` | 依赖配置的 Iconfont Symbol；没有资源时可能为空 |
| `image` | 单体 | `{% image URL, alt=文本, width=值, height=值, bg=颜色 %}` | 块级图片；至少提供准确 `alt` |
| `inlineimage` | 单体 | `{% inlineimage URL, height=值 %}` | 行内图片；源码不提供 `alt`，有可访问性要求时改用 Markdown 或 `image` |
| `issues` | 单体 | 见下方专用语法 | 动态 API 数据；当前项目关闭，未经授权不得使用或启用 |
| `link` | 单体 | `{% link 标题, URL, 图片 %}` | 链接卡片；图片省略时使用配置占位图 |
| `linkgroup` | 容器 | `{% linkgroup %}...{% endlinkgroup %}` | 组合多个 `link` |
| `audio` | 单体 | `{% audio MP3地址 %}` | 输出 HTML Audio，源码类型固定为 MP3 |
| `video` | 单体 | `{% video MP4地址 %}` | 输出 HTML Video，源码类型固定为 MP4 |
| `videos` | 容器 | `{% videos 样式类, 列数 %}...{% endvideos %}` | 组合多个 `video` |
| `referto` | 单体 | `{% referto 引用ID, 文献摘要 %}` | 正文引用点；ID 在页面内唯一 |
| `referfrom` | 单体 | `{% referfrom 引用ID, 来源标题, URL %}` | 文献来源；必须与 `referto` ID 对应 |
| `poem` | 容器 | `{% poem 标题, 作者 %}...{% endpoem %}` | 诗词排版，正文支持 Markdown |
| `site` | 单体 | `{% site 标题, url=URL, screenshot=图片, avatar=图片, description=描述 %}` | 站点卡片；`url` 与 `screenshot` 应完整 |
| `sitegroup` | 容器 | `{% sitegroup 分组标题 %}...{% endsitegroup %}` | 组合多个 `site` |
| `carousel` | 容器 | `{% carousel 唯一ID, 标题 %}...{% endcarousel %}` | 正文放 Markdown 图片；依赖脚本并需要页面唯一 ID |

`bdage` 使用源码保留的双层分隔方式：

```markdown
{% bdage 右侧文本,左侧文本,logo||颜色,链接,标题||附加查询参数 %}
```

`issues` 只有配置开启后才允许使用：

```markdown
{% issues sites | api=https://example.com/issues | group=version:stable,beta %}
```

图片与站点卡片示例：

```markdown
{% image /img/example.png, alt=功能截图, width=720px, bg=#f5f5f5 %}

{% sitegroup 推荐站点 %}
{% site 示例站点, url=https://example.com, screenshot=/img/site.png, description=示例说明 %}
{% endsitegroup %}
```

## 5. 相邻能力与参考边界

Butterfly 当前内置标签的完整所有者、语法、配置门禁和选型约束统一维护在 `references/butterfly-built-in-tags.md`，本目录不复制第二份内置标签表。

需要特别区分：

- `timeline`、`note`、`tabs`、`btn`、`inlineImg`、`gallery`、`mermaid` 等来自 Butterfly。
- `folding`、`tip`、`btns/cell`、`inlineimage`、`carousel`、`link` 等来自 Tag Plugins Plus。
- `meting` 来自 `hexo-tag-aplayer`，不等同于插件的 `audio`。

## 6. 配置和网络门禁

- `tag_plugins.enable` 必须为 `true`；不得由内容任务自动开启。
- `tag_plugins.CDN` 必须保持映射结构，插件生成阶段会直接读取它。
- `tag_plugins.link.placeholder` 是链接卡片缺省图片；删除或改名需同步验证现有 `link`。
- `issues` 为独立注入开关；当前是 `false`，启用会增加外部脚本和 API 行为，必须单独确认。
- `ghcard`、`bdage`、远程图片、音视频和 `issues` 均可能依赖第三方网络；核心信息必须有正文或普通链接兜底。
- `carousel`、Iconfont 和插件样式依赖配置资源；只证明构建成功不能证明这些资源在线可用。
- 插件将多个参数直接写入 HTML。只使用可信、公开内容，不把未经处理的用户输入或秘密放进标签参数。

## 7. 验收边界

`audit.mjs tags` 可以机械确认：

- 依赖、安装版本、配置来源和开关；
- 当前源码注册的标签及基线漂移；
- Markdown 中使用的插件标签；
- 九类容器的闭合和嵌套顺序；
- 配置关闭时误用 `issues`。

它不能证明：

- 标签选型是否符合内容语义；
- 第三方 API、CDN、图片或媒体在线可用；
- 暗色、移动端、键盘、PJAX 和交互视觉正确；
- 外部内容具有发布许可。

这些项目必须通过真实 Hexo 构建、浏览器场景和 `checklists/maintenance-acceptance.md` 验收。

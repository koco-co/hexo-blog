# Butterfly 内置标签能力目录

本目录记录当前项目 Butterfly 主题内置标签的源码契约和写作用途。它服务于标签选择和语法核对，不替代实时主题源码、配置、Hexo 构建或真实页面验证。

## 1. 当前基线

| 项目 | 当前事实 |
| --- | --- |
| 主题 | `hexo-theme-butterfly` |
| 当前版本 | `5.7.0` |
| 源码位置 | `node_modules/hexo-theme-butterfly/scripts/tag/` |
| 唯一注册标签数 | `19` |
| 许可证 | `Apache-2.0` |

当前注册标签：

```text
btn, chartjs, flink, gallery, galleryGroup,
hideInline, hideBlock, hideToggle, inlineImg, label,
mermaid, note, subnote, score, series,
tabs, subtabs, subsubtabs, timeline
```

事实优先级：当前 `node_modules/hexo-theme-butterfly/scripts/tag/*.js` → 当前 `_config.butterfly.yml` → 本目录 → Butterfly 官方文档或历史文章。主题版本或注册表变化时先读取锁定依赖中的实时源码，不继续照抄本目录。

官方能力索引为 `https://butterfly.js.org/posts/ceeb73f/`。它用于了解 Butterfly 的展示方式和文档范围，不覆盖当前项目源码契约。

## 2. 提示、强调与操作入口

| 标签 | 源码语法 | 用途与约束 |
| --- | --- | --- |
| `note` | `{% note [颜色] [图标或 no-icon] [样式] %}...{% endnote %}` | 结论、提示、风险；正文支持 Markdown |
| `subnote` | 与 `note` 相同 | 在支持嵌套的上下文中使用，避免无必要深层嵌套 |
| `label` | `{% label 文本 颜色 %}` | 短行内状态或分类，不代替完整说明 |
| `btn` | `{% btn URL, 文本, 图标类, 选项 %}` | 单一明确操作；参数按逗号分隔 |
| `inlineImg` | `{% inlineImg 图片路径 高度 %}` | 装饰性行内图片；源码不提供 `alt`，关键信息改用 Markdown 图片 |

`note` 的当前安全样式值包括 `simple`、`modern`、`flat`、`disabled`。颜色和图标类由主题样式决定；使用前核对当前配置和页面效果。

```markdown
{% note blue 'fas fa-bullhorn' modern %}
先给出读者必须知道的结论。
{% endnote %}

{% label 推荐 green %}

{% btn https://example.com, 查看官方文档, fas fa-book, blue %}
```

## 3. 选项、流程与隐藏内容

| 标签 | 源码语法 | 用途与约束 |
| --- | --- | --- |
| `tabs` | `{% tabs 组名, 默认序号 %}` + `<!-- tab 标题@图标 -->` | 平台、方案、代码或配置切换 |
| `subtabs`、`subsubtabs` | 与 `tabs` 相同 | 只在确有层级关系时嵌套，避免移动端层级过深 |
| `timeline` | `{% timeline 标题, 颜色 %}` + `<!-- timeline 节点 -->` | 时间、步骤、版本演进或过程 |
| `hideInline` | `{% hideInline 内容, 按钮文字, 背景色, 文字色 %}` | 只隐藏短文本；参数内容避免英文逗号 |
| `hideBlock` | `{% hideBlock 按钮文字, 背景色, 文字色 %}...{% endhideBlock %}` | 隐藏答案或补充块，不隐藏主线 |
| `hideToggle` | `{% hideToggle 标题, 背景色, 文字色 %}...{% endhideToggle %}` | 可展开长补充内容，不在其中使用会干扰目录的章节标题 |

```markdown
{% tabs 安装方式, 1 %}
<!-- tab macOS@fab fa-apple -->
macOS 安装说明。
<!-- endtab -->
<!-- tab Linux@fab fa-linux -->
Linux 安装说明。
<!-- endtab -->
{% endtabs %}

{% timeline 实施过程, blue %}
<!-- timeline 准备 -->
确认环境和输入。
<!-- endtimeline -->
<!-- timeline 验证 -->
运行检查并记录结果。
<!-- endtimeline -->
{% endtimeline %}
```

## 4. 图片与图库

| 标签 | 源码语法 | 用途与约束 |
| --- | --- | --- |
| `gallery` | `{% gallery [按钮],[批次],[首批] %}...{% endgallery %}` | 正文使用 Markdown 图片，保留准确替代文本 |
| `gallery` URL 模式 | `{% gallery url,数据地址,[按钮],[批次],[首批] %}{% endgallery %}` | 依赖可公开数据地址，必须验证失败降级 |
| `galleryGroup` | `{% galleryGroup 名称 描述 链接 封面 %}` | 图库入口卡片；含空格参数使用引号保护 |

`gallery` 默认批次和首批数量均为 `10`。`galleryGroup` 的图片替代文本由当前源码固定生成，不适合承载只有图片才能表达的核心信息。

```markdown
{% gallery true, 8, 4 %}
![首页桌面效果](/img/home-desktop.png)
![首页移动效果](/img/home-mobile.png)
{% endgallery %}
```

## 5. 图表、关系与专题内容

| 标签 | 源码语法 | 用途与约束 |
| --- | --- | --- |
| `mermaid` | `{% mermaid [配置] %}...{% endmermaid %}` | 架构、流程、状态和关系；需当前配置启用 Mermaid |
| `chartjs` | `{% chartjs [宽度],[并排],[ID] %}` + `chart/desc` 注释块 | 数据图表；正文同时给出可理解的数据结论 |
| `score` | `{% score %}...{% endscore %}` | ABC 乐谱；可在 `------` 前提供 JSON 参数 |
| `series` | `{% series [系列名] %}` | Butterfly 通用系列列表；只能按标题或日期排序，系统课程改用项目扩展 `{% course_series %}` 与 `series_order` |
| `flink` | `{% flink %}` + YAML + `{% endflink %}` | 友链型结构化列表，普通扩展阅读优先使用链接卡片 |

Mermaid 流程图按内容密度选择方向：

- 主链不超过 4 个节点、没有复杂分支或子图、标签较短，并且桌面与移动端均不拥挤时可以使用 `LR`；
- 节点更多、存在分支或子图、标签较长，或横向渲染会压缩文字和产生溢出时使用 `TD` 或 `TB`；
- 最终以真实页面为准；`LR` 出现文字缩小、节点拥挤、横向滚动或超出正文宽度时改为 `TD/TB`。

短且简单的线性关系可以横向展示：

```markdown
{% mermaid %}
flowchart LR
  A[输入] --> B[处理]
  B --> C[结果]
{% endmermaid %}
```

节点较多或包含分支时从上到下展示：

```markdown
{% mermaid %}
flowchart TD
  A[输入] --> B[解析]
  B --> C[校验]
  C --> D[处理]
  D --> E[输出]
  D --> F[错误处理]
{% endmermaid %}
```

Chart.js 示例：

```markdown
{% chartjs 100,,usage-chart %}
<!-- chart -->
{"type":"bar","data":{"labels":["A","B"],"datasets":[{"label":"数量","data":[3,5]}]}}
<!-- endchart -->
<!-- desc -->
B 的数量高于 A，正文解释数据来源和含义。
<!-- enddesc -->
{% endchartjs %}
```

## 6. 与 Tag Plugins Plus 的边界

- `note` 属于 Butterfly，`tip` 属于 Tag Plugins Plus。
- `btn` 是 Butterfly 单按钮，`btns/cell` 是 Plus 按钮组。
- `inlineImg` 属于 Butterfly，`inlineimage` 属于 Plus，大小写不能互换。
- `gallery`、`galleryGroup` 属于 Butterfly；`carousel` 属于 Plus，且需要页面唯一 ID。
- `timeline` 属于 Butterfly；Plus 1.0.18 不注册同名标签。
- `hideToggle` 属于 Butterfly，`folding` 属于 Plus；两者都不能隐藏核心结论。

Plus 的完整语法和配置门禁见 `references/butterfly-tag-plugins-plus.md`。

## 7. 验收边界

当前 `audit.mjs tags` 会从有效 npm 主题收集 Butterfly 注册。每次新增或改变内置标签用法仍要读取对应 `node_modules/hexo-theme-butterfly/scripts/tag/*.js`，并完成真实 Hexo 构建。

机械检查和构建不能证明：

- 多种标签组合是否形成连贯阅读节奏；
- 移动端、暗色主题、键盘和展开交互是否可用；
- Mermaid、Chart.js、图库和外部资源失败时正文是否仍可理解；
- 图片、数据和外部内容是否具有发布许可。

这些项目必须通过 `checklists/maintenance-acceptance.md` 和真实页面场景验收。

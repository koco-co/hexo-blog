# 当前项目标签写法参考

本参考保存课程写作可以直接复制的标签骨架。Butterfly 示例整理自项目文章 `source/_posts/Butterfly文档(三)标签外挂.md`；Tag Plugins Plus 示例来自当前已安装插件源码与项目维护 Skill。原文章用于展示效果，不是版本真相。

每次使用前运行：

```bash
node .agents/scripts/audit.mjs tags --json
```

事实优先级：当前主题或插件注册源码 → 当前 `_config.yml` 与 `_config.butterfly.yml` → 本参考 → 历史文章。容器按实际嵌套栈逆序闭合。

## 1. 指定文章用法索引

下表直接整理自 `Butterfly文档(三)标签外挂.md` 的写法章节，保留其参数结构；示例中的历史外链、旧配置值和展示文案不复制，实际使用仍以当前源码为准。

| 标签 | 文章中的写法骨架 | 课程约束 |
| --- | --- | --- |
| `note` | `{% note [级别] [no-icon 或图标] flat %}...{% endnote %}` | 课程固定使用 `flat`；按 `info`、`primary`、`success`、`warning`、`danger` 表达不同语义 |
| `galleryGroup` | `{% galleryGroup name description link img-url %}` | 含空格参数使用引号；图片不承担唯一信息 |
| `gallery` | `{% gallery [button],[batch],[first] %}...{% endgallery %}` | 正文放带替代文本的 Markdown 图片 |
| `gallery` URL 模式 | `{% gallery url,数据地址,[button],[batch],[first] %}{% endgallery %}` | 外部 JSON 失败时仍要有文字说明 |
| `hideInline` | `{% hideInline content,display,bg,color %}` | 只隐藏短答案 |
| `hideBlock` | `{% hideBlock display,bg,color %}...{% endhideBlock %}` | 用于先思考再看完整解析 |
| `hideToggle` | `{% hideToggle display,bg,color %}...{% endhideToggle %}` | 只用于章节末非复习自测；长补充使用 `folding` |
| `mermaid` | `{% mermaid '[config]' %}...{% endmermaid %}` | 配置可省略；关系复杂时优先 `TD/TB` |
| `tabs` | `{% tabs Unique name, [index] %}` + `<!-- tab [caption] [@icon] -->` | 同页组名唯一；`-1` 表示默认无选中项 |
| `btn` | `{% btn [url],[text],[icon],[color] [style] [layout] [position] [size] %}` | 只表示真实动作或入口 |
| `inlineImg` | `{% inlineImg [src] [height] %}` | 缺少 `alt`，只用于装饰性行内图 |
| `label` | `{% label text color %}` | 用于短状态或分类 |
| `timeline` | `{% timeline title,color %}` + `<!-- timeline 节点 -->` | 只表达时间、阶段或生命周期 |
| `flink` | `{% flink %}` + YAML + `{% endflink %}` | 普通参考资料仍使用 `linkgroup` |
| `score` | `{% score %}ABC 乐谱{% endscore %}` | 只用于确实需要乐谱的主题 |
| `series` | `{% series [series name] %}` | 系统课程禁止使用，改用 `course_series` |
| `chartjs` | `{% chartjs [width, abreast, chartId] %}` + `chart/desc` 注释块 | 只展示有来源的真实数据 |

## 2. Butterfly 提示、页签与隐藏内容

````markdown
{% note info flat %}
中性概念、背景、范围或前置条件。
{% endnote %}

{% note primary flat %}
需要优先记住的核心原则或关键判断。
{% endnote %}

{% note success flat %}
推荐实践、成功标准或已经满足条件的结果。
{% endnote %}

{% note warning flat %}
容易误用但通常可恢复的风险、兼容限制或常见失败。
{% endnote %}

{% note danger flat %}
安全、数据丢失、破坏性或不可逆后果。
{% endnote %}

{% tabs 安装方式, 1 %}
<!-- tab npm@fab fa-npm -->
```bash
npm install package-name
```
<!-- endtab -->
<!-- tab pip@fab fa-python -->
```bash
python -m pip install package-name
```
<!-- endtab -->
{% endtabs %}

短答案：{% hideInline 答案,查看答案,#FF7242,#fff %}

{% hideBlock 查看解析 %}
先思考后揭晓的完整解析。
{% endhideBlock %}

{% hideToggle 章节末自测 %}
不进入长期复习队列、只在当前章节完成的完整自测。
{% endhideToggle %}
````

课程 `note` 固定使用 `flat`，级别按信息性质选择，不为交替配色轮换；`warning` 是正确拼写，不能写成 `waring`。`tabs` 的组名在同一页面内保持唯一；默认序号省略时选中第一项，`-1` 表示默认不选。只有确有二级或三级平行选择时才使用 `subtabs`、`subsubtabs`，语法和闭合方式与 `tabs` 相同。

## 3. Butterfly 关系、过程和数据

```markdown
{% mermaid %}
flowchart TD
  A[输入] --> B[解析]
  B --> C{有效吗}
  C -->|是| D[执行]
  C -->|否| E[报错]
{% endmermaid %}

{% timeline 生命周期, blue %}
<!-- timeline 准备 -->
确认环境和输入。
<!-- endtimeline -->
<!-- timeline 验证 -->
运行检查并记录结果。
<!-- endtimeline -->
{% endtimeline %}

{% chartjs 100,,usage-chart %}
<!-- chart -->
{"type":"bar","data":{"labels":["A","B"],"datasets":[{"label":"数量","data":[3,5]}]}}
<!-- endchart -->
<!-- desc -->
B 高于 A；正文还要说明数据来源、单位和适用边界。
<!-- enddesc -->
{% endchartjs %}
```

Mermaid 配置参数可以传 JSON，但必须先核对当前主题能力。Chart.js 只使用真实数据；`width, abreast, chartId` 都是可选参数，并排模式需要明确宽度。

## 4. Butterfly 图片、入口与专题标签

```markdown
{% gallery true, 8, 4 %}
![桌面状态](/img/example-desktop.png)
![移动状态](/img/example-mobile.png)
{% endgallery %}

{% galleryGroup '桌面状态' '桌面端界面对照' '/gallery/desktop' /img/desktop-cover.png %}

{% btn https://example.com/docs, 查看官方文档, fas fa-book, blue %}

状态：{% label 推荐 green %}

装饰性图标 {% inlineImg /img/icon.png 1.2em %}

{% flink %}
- class_name: 官方工具
  class_desc: 本文用到的站点
  link_list:
    - name: 示例工具
      link: https://example.com/
      avatar: https://example.com/favicon.ico
      descr: 工具用途
{% endflink %}

{% score %}
X:1
T:Example
M:4/4
L:1/8
K:C
CDEF GABc|
{% endscore %}
```

Butterfly `{% series %}` 虽然当前注册，但系统课程禁止使用；课程导航固定为：

```markdown
{% course_series %}
```

## 5. Tag Plugins Plus 展开与操作组

```markdown
{% folding purple, 概念深入解释 %}
先在折叠外给出一句可见结论，这里再展开原理、长日志或完整配置。
{% endfolding %}

{% folding open purple, 默认展开的概念解释 %}
当前渲染器会把 `open purple` 写入原生 details 属性，内容初始展开且仍可由读者收起。
{% endfolding %}

{% btns rounded grid2 %}
{% cell 项目主页, https://example.com, fa-solid fa-house %}
{% cell 使用文档, https://example.com/docs, /img/docs.png %}
{% endbtns %}
```

`folding` 当前常用颜色为 `purple`、`blue`、`cyan`、`green`、`yellow`、`orange`、`red`。当前源码把逗号前的参数原样写入 `<details>`，因此 `{% folding open, 标题 %}` 可以默认展开，`{% folding open purple, 标题 %}` 可以同时默认展开并使用颜色；当前 CSS 已提供 `[open]` 与 `[open][color]` 状态。只有扩展解释适合初始可见、同时允许读者收起时才使用 `open`，核心结论仍放在折叠外。原生 `<details>` 不依赖 JavaScript，仍要在目标浏览器检查默认展开、键盘、移动端和明暗主题。

Tag Plugins Plus `tip` 虽然在当前项目注册，但课程正文禁用，也不在课程参考中提供可复制示例。直接可见的提示改用上一节的 `note <级别> flat`；长原理、完整配置、日志和次要案例使用 `folding`。

## 6. Tag Plugins Plus 状态与行内辅助

```markdown
{% checkbox green checked, 已验证安装结果 %}
{% radio blue checked, 使用项目级配置 %}
{% progress 75,blue,课程完成度 %}

按下 {% kbd Command + K %} 打开搜索。
{% nota API, 应用程序编程接口 %}
{% bubble 幂等, 重复执行结果保持一致, #4caf50 %}
{% emp 关键判断 %}
{% wavy 容易混淆的术语 %}
{% del 已弃用写法 %}
{% psw 剧透内容 %}
```

`progress` 三个参数都要提供且逗号后不留空格。`p`、`span`、`u` 也可用于排版或短强调；这些行内标签不算块级解释承载。`psw` 不能存放秘密。

## 7. Tag Plugins Plus 图片、项目与资料卡

```markdown
{% image /img/example.png, alt=功能截图, width=720px, bg=#f5f5f5 %}
{% inlineimage /img/icon.png, height=1.2em %}

{% carousel install-states, 安装结果 %}
![成功状态](/img/install-success.png)
![失败状态](/img/install-failure.png)
{% endcarousel %}

{% linkgroup %}
{% link 官方文档, https://example.com/docs, https://example.com/favicon.ico %}
{% endlinkgroup %}

{% ghcardgroup %}
{% ghcard owner/repository, theme=transparent %}
{% endghcardgroup %}

{% sitegroup 推荐工具 %}
{% site 示例工具, url=https://example.com, screenshot=/img/site.png, description=工具用途 %}
{% endsitegroup %}
```

`image`、`inlineimage`、`ghcard`、`site` 的逗号后保留空格。`carousel` ID 在页面内唯一。`ghcard`、远程截图和资料卡图片可能依赖网络，正文保留可读名称、用途和 URL。

徽章语法使用插件源码的拼写 `bdage`：

```markdown
{% bdage passing,build,github||brightgreen,https://example.com,构建状态||style=flat %}
```

## 8. 引用、媒体与特殊内容

```markdown
正文中的结论{% referto source-1, 官方规范说明 %}

{% referfrom source-1, 官方规范, https://example.com/spec %}

{% audio https://example.com/demo.mp3 %}
{% video https://example.com/demo.mp4 %}

{% videos grid, 2 %}
{% video https://example.com/one.mp4 %}
{% video https://example.com/two.mp4 %}
{% endvideos %}

{% poem 标题, 作者 %}
需要保留诗词排版的正文。
{% endpoem %}
```

音频和视频必须提供文字说明、字幕或等价结果。`referto` 与 `referfrom` 使用同一个页面内唯一 ID。`icon` 依赖当前 Iconfont Symbol 配置，缺少资源时不能承担唯一信息。

`issues` 当前配置关闭，禁止在课程中复制或使用。只有用户另行授权启用外部脚本和 API 后，才重新读取插件源码与配置核对其 ` | ` 分隔语法。

## 9. 闪卡与课程导航

```markdown
{% flashcard basic id:topic-stable-question deck:"课程名称" priority:1 tags:"核心概念" %}
--- question
需要长期复习的问题
--- answer
精简回答
--- explanation
详细解析、边界与误区
{% endflashcard %}

{% flashcard_ref id="topic-stable-question" %}

{% course_series %}
```

具体闪卡字段仍以当前 `hexo-flashcard-plugin` 参考与源码为准；跨文章复用只写 `flashcard_ref`，不能复制同一道题。

## 10. 写入后验证

```bash
node .agents/scripts/audit.mjs tags --json
node .agents/scripts/audit.mjs content --release --json
node .agents/scripts/audit.mjs lint --json
```

含 `folding`、`tabs`、隐藏标签、图库、图表或媒体的文章还要真实生成目标路由，并在桌面、移动、明暗主题和交互状态下检查。静态通过不证明选型合适或页面可读。

# Hexo Flashcard 插件参考

本文件记录当前项目 `hexo-flashcard-plugin` 的写作契约。实时事实优先级为：当前安装插件源码与配置 → 本文件 → 示例页面；历史文章不能覆盖当前解析器。

## 当前能力

- 包名：`hexo-flashcard-plugin`；当前安装版本从 `node_modules/hexo-flashcard-plugin/package.json` 读取。
- 配置入口：`_config.yml` 的 `flashcard`。
- 公开复习页由配置的 `path` 决定；文章只负责显式声明或引用卡片。
- 只有 `flashcard` 和 `flashcard_ref` 进入复习系统，`folding`、`hideToggle`、`hideBlock` 与普通正文不会自动转换。

## 卡片定义

文章可以用 Front Matter 的 `flashcard_deck` 提供默认卡组，也可以在单卡上用 `deck` 覆盖。每张卡必须具有全站唯一、长期稳定的 `id`、`priority:1|2|3`，并按顺序提供非空的 `question`、`answer`、`explanation`；`priority` 是当前解析器的必填字段。

````markdown
{% flashcard basic id:playwright-locator-role deck:"Playwright" priority:2 tags:"Locator,语义定位" %}
--- question
为什么优先使用 `get_by_role()`？
--- answer
它按用户可感知的角色和名称定位元素。
--- explanation
`get_by_role()` 查询的是页面的可访问性语义，而不是某个容易变化的 CSS 结构。测试因此更接近用户实际看到并操作的按钮、输入框或链接。

```python
# 名称来自按钮的可访问名称；样式类变化不会改变这条测试的意图。
save_button = page.get_by_role("button", name="保存")
save_button.click()
```

| 页面变化 | CSS 选择器 | `get_by_role()` |
| --- | --- | --- |
| 调整 class 名 | 可能失效 | 通常不受影响 |
| 按钮失去可访问名称 | 可能继续通过 | 会暴露可访问性问题 |

可以把它理解为“按岗位和姓名找人”，而不是“按工位坐标找人”。这个类比只说明定位意图；实际匹配仍受 ARIA 角色、可访问名称、隐藏状态和严格模式约束。
{% endflashcard %}
````

支持的类型：

- `basic`：普通问答。
- `cloze`：问题至少包含一个 `[[隐藏内容]]`。
- `choice`：问题至少包含两个 `- [选项键] 内容`，标签参数必须提供 `answer:<选项键>`；多选可以使用逗号分隔的多个正确键。

`deck` 表达单一主卡组，`tags` 是逗号分隔的交叉复习标签。`priority:1`、`priority:2`、`priority:3` 依次渲染为高频、中频和低频；该字段必填，标签不能代替卡片类型或优先级。

频率徽标可以点击筛选。复习页分别使用 `?priority=1`、`?priority=2` 和 `?priority=3` 限定范围；到期旧卡继续按 FSRS 到期时间排序，新卡按高频、中频、低频排序，同一优先级保持原有顺序。优先级不改变 FSRS 间隔或到期时间。

## 富内容与代码

`question`、`answer` 和 `explanation` 都按 Markdown 渲染。代码本身属于需要长期记忆的题目、答案或解析时，直接在对应段落使用带语言名称的围栏代码；插件会在文章卡和复习卡中生成行号、语言名称、三色状态点、复制和折叠工具栏。

- 复制只包含源代码，不包含行号和语言名称。
- 代码块默认展开；折叠只隐藏代码正文，工具栏继续保留。
- 点击、选择或横向滚动代码不会触发闪卡翻面。
- 与复习问题无关的长代码、完整日志和补充实验仍使用 `folding`，不为了视觉效果塞入闪卡。

## 题目数量与解析质量

`常见问题` 不设固定题数上限。根据文章知识密度、容易混淆的边界和长期复习价值决定题数；正文已经直接消除的误解不重复制卡，高度重叠的问题合并。入门路线仍按课程合同不放闪卡。

`answer` 保持便于主动回忆的精简结论，`explanation` 按 `rules/technical-writing-style.md` 写成脱离正文仍能理解的解释。抽象或复杂问题至少选择一种能降低理解成本的 Markdown 辅助表达，例如带注释代码、输入输出、比较表、本地图片、文字流程或有边界的类比。

不要用字数、段落数或固定栏目代替内容判断。只重复答案、罗列术语、给无注释代码、依赖无替代文本的图片，或使用不说明失效边界的类比，都不属于详细解析。闪卡内部不嵌套 Butterfly、Tag Plugins Plus 或 Mermaid 标签；需要完整关系图时在正文直接展示，并让卡片保留可独立理解的文字与 Markdown 证据。

编辑已有文章时，同一篇中的所有原始 `flashcard` 定义一起复查；`flashcard_ref` 只继承原始定义，不复制修改。未进入当前编辑范围的旧卡片作为待迁移内容报告，不阻断无关内容。

## 跨文章引用

同一道题只定义一次，其他文章使用：

```markdown
{% flashcard_ref id="playwright-locator-role" %}
```

`flashcard_ref` 只接受 `id`，目标必须在当前构建参与的内容中存在。引用不得覆盖题目、答案、解析、卡组、标签或优先级，并自动继承原卡片的频率标注。

## 选择边界

- FAQ、关联面试题、章节自测需要进入长期复习队列时使用闪卡。
- 补充说明、长代码和日志使用 `folding`。
- 只在原文阅读的完整答案使用 `hideToggle` 或 `hideBlock`。
- 核心结论、必要命令、安全风险和故障恢复步骤直接展示，不藏进任何交互组件。

## 验证

1. 运行 `node .agents/scripts/audit.mjs tags --json`，核对插件版本、配置、卡片计数和引用使用情况。
2. 运行真实 Hexo 生成；插件会校验卡片字段、类型、`priority:1|2|3`、ID 唯一性和引用目标。
3. 在文章页检查翻卡、频率徽标、卡组和标签链接，在 `/learn-topic/` 检查优先级筛选和复习队列。
4. 桌面与移动端、明暗主题和 PJAX 返回均属于页面证据，不能由静态审计替代。

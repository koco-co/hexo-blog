# Hexo Flashcard 插件参考

本文件记录当前项目 `hexo-flashcard-plugin` 的写作契约。实时事实优先级为：当前安装插件源码与配置 → 本文件 → 示例页面；历史文章不能覆盖当前解析器。

## 当前能力

- 包名：`hexo-flashcard-plugin`；当前安装版本从 `node_modules/hexo-flashcard-plugin/package.json` 读取。
- 配置入口：`_config.yml` 的 `flashcard`。
- 公开复习页由配置的 `path` 决定；文章只负责显式声明或引用卡片。
- 只有 `flashcard` 和 `flashcard_ref` 进入复习系统，`folding`、`hideToggle`、`hideBlock` 与普通正文不会自动转换。

## 卡片定义

文章可以用 Front Matter 的 `flashcard_deck` 提供默认卡组，也可以在单卡上用 `deck` 覆盖。每张卡必须具有全站唯一、长期稳定的 `id`，并按顺序提供非空的 `question`、`answer`、`explanation`。

```markdown
{% flashcard basic id:playwright-locator-role deck:"Playwright" tags:"Locator,语义定位" %}
--- question
为什么优先使用 `get_by_role()`？
--- answer
它按用户可感知的角色和名称定位元素。
--- explanation
语义定位更接近真实交互合同，并能在元素不可访问或名称不明确时暴露问题。
{% endflashcard %}
```

支持的类型：

- `basic`：普通问答。
- `cloze`：问题至少包含一个 `[[隐藏内容]]`。
- `choice`：问题至少包含两个 `- [选项键] 内容`，标签参数必须提供 `answer:<选项键>`；多选可以使用逗号分隔的多个正确键。

`deck` 表达单一主卡组，`tags` 是逗号分隔的交叉复习标签。标签不能代替卡片类型。

## 跨文章引用

同一道题只定义一次，其他文章使用：

```markdown
{% flashcard_ref id="playwright-locator-role" %}
```

`flashcard_ref` 只接受 `id`，目标必须在当前构建参与的内容中存在。引用不得覆盖题目、答案、解析、卡组或标签。

## 选择边界

- FAQ、关联面试题、章节自测需要进入长期复习队列时使用闪卡。
- 补充说明、长代码和日志使用 `folding`。
- 只在原文阅读的完整答案使用 `hideToggle` 或 `hideBlock`。
- 核心结论、必要命令、安全风险和故障恢复步骤直接展示，不藏进任何交互组件。

## 验证

1. 运行 `node tools/hexo-blog/audit.mjs tags --json`，核对插件版本、配置、卡片计数和引用使用情况。
2. 运行真实 Hexo 生成；插件会校验卡片字段、类型、ID 唯一性和引用目标。
3. 在文章页检查翻卡、卡组和标签链接，在 `/learn-topic/` 检查筛选和复习队列。
4. 桌面与移动端、明暗主题和 PJAX 返回均属于页面证据，不能由静态审计替代。

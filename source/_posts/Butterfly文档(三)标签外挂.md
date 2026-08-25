---
title: Butterfly文档(三) 标签外挂
tags:
  - Butterfly
  - Hexo
  - Tag-Plugins
  - Markdown
categories:
  - Butterfly Docs
description: Butterfly 标签外挂完整教程，涵盖 Note、Tabs、Folding、Button、Gallery、Mermaid 等所有外挂标签的用法和配置。
abbrlink: e5e815c7
date: 2026-01-13 01:33:23
cover: /img/picgo-images/hexo-butterfly.png
---

{% note info flat %}
标签外挂是 Hexo 独有的功能，并不是标准的 Markdown 格式. 以下的写法，只适用于 Butterfly 主题，用在其它主题上不会有效果，甚至可能会报错.
使用前请留意.
{% endnote %}

{% note warning flat %}
标签外挂虽然能为主题带来一些额外的功能和 UI 方面的强化，但是，标签外挂也有明显的限制，使用时请留意。
{% endnote %}

---

## Note (Bootstrap Callout)

{% tabs Note %}

<!-- tab 通用设置 -->

移植于 next 主题，并进行修改。

```yaml
note:
  # Note（提示框）标签样式类型：
  #  - simple    传统的 bs-callout 风格（旧版 alert），默认样式
  #  - modern    新版 bs-callout 风格（v2–v3），更现代
  #  - flat      扁平化提示框样式，类似 Mozilla / StackOverflow 的效果
  #  - disabled  禁用 Note 标签的所有 CSS 样式（仅保留结构，不加载样式）
  style: flat

  # 是否在 Note 提示框中显示图标
  # true  表示显示图标
  # false 表示不显示图标
  icons: false

  # 提示框圆角大小（单位：px）
  # 数值越大，圆角越明显
  border_radius: 3

  # 背景亮度偏移百分比（仅对 modern / flat 样式生效）
  # modern 样式推荐范围：-12 ～ 12
  # flat   样式推荐范围：-18 ～ 6
  #
  # 该参数同时会影响 label 标签的配色
  # 即使 style 设置为 disabled，此参数依然会生效
  light_bg_offset: 0
```

|       名称        | 解释                                     |
| :---------------: | ---------------------------------------- |
|      `style`      | 可选:`simple`/`modern`/`flat`/`disabled` |
|      `icons`      | 可选: 是否显示 icon                      |
|  `border_radius`  | 可选: 边框圆角                           |
| `light_bg_offset` | 可选: 背景色偏移量                       |

`icons` 和 `light_bg_offset` 只对方法一生效

`Note` 标签外挂有两种用法

<!-- endtab -->

<!-- tab 用法1 -->

```markdown
<!-- `class`: 可选色彩: `default` / `primary` / `success` / `info` / `warning` / `danger` -->
<!-- `no-icon`: 可选: 不显示图标 -->
<!-- `style`: 可选: 可覆盖配置中的 style （`simple`/`modern`/`flat`/`disabled`） -->

{% note [class] [no-icon] [style] %}
任何内容（也支持内联标签）.
{% endnote %}
```

{% note primary 'fa-solid fa-wand-magic' flat %}
**`Simple`**
{% endnote %}

```markdown
{% note simple %}
默认 提示块标签
{% endnote %}

{% note default simple %}
default 提示块标签
{% endnote %}

{% note primary simple %}
primary 提示块标签
{% endnote %}

{% note success simple %}
success 提示块标签
{% endnote %}

{% note info simple %}
info 提示块标签
{% endnote %}

{% note warning simple %}
warning 提示块标签
{% endnote %}

{% note danger simple %}
danger 提示块标签
{% endnote %}
```

{% note simple %}
默认 提示块标签
{% endnote %}

{% note default simple %}
default 提示块标签
{% endnote %}

{% note primary simple %}
primary 提示块标签
{% endnote %}

{% note success simple %}
success 提示块标签
{% endnote %}

{% note info simple %}
info 提示块标签
{% endnote %}

{% note warning simple %}
warning 提示块标签
{% endnote %}

{% note danger simple %}
danger 提示块标签
{% endnote %}

{% note primary 'fa-solid fa-wand-magic' flat %}
**`Modern`**
{% endnote %}

```markdown
{% note modern %}
默认 提示块标签
{% endnote %}

{% note default modern %}
default 提示块标签
{% endnote %}

{% note primary modern %}
primary 提示块标签
{% endnote %}

{% note success modern %}
success 提示块标签
{% endnote %}

{% note info modern %}
info 提示块标签
{% endnote %}

{% note warning modern %}
warning 提示块标签
{% endnote %}

{% note danger modern %}
danger 提示块标签
{% endnote %}
```

{% note modern %}
默认 提示块标签
{% endnote %}

{% note default modern %}
default 提示块标签
{% endnote %}

{% note primary modern %}
primary 提示块标签
{% endnote %}

{% note success modern %}
success 提示块标签
{% endnote %}

{% note info modern %}
info 提示块标签
{% endnote %}

{% note warning modern %}
warning 提示块标签
{% endnote %}

{% note danger modern %}
danger 提示块标签
{% endnote %}

{% note primary 'fa-solid fa-wand-magic' flat %}
**`Flat`**
{% endnote %}

```markdown
{% note flat %}
默认 提示块标签
{% endnote %}

{% note default flat %}
default 提示块标签
{% endnote %}

{% note primary flat %}
primary 提示块标签
{% endnote %}

{% note success flat %}
success 提示块标签
{% endnote %}

{% note info flat %}
info 提示块标签
{% endnote %}

{% note warning flat %}
warning 提示块标签
{% endnote %}

{% note danger flat %}
danger 提示块标签
{% endnote %}
```

{% note flat %}
默认 提示块标签
{% endnote %}

{% note default flat %}
default 提示块标签
{% endnote %}

{% note primary flat %}
primary 提示块标签
{% endnote %}

{% note success flat %}
success 提示块标签
{% endnote %}

{% note info flat %}
info 提示块标签
{% endnote %}

{% note warning flat %}
warning 提示块标签
{% endnote %}

{% note danger flat %}
danger 提示块标签
{% endnote %}

{% note primary 'fa-solid fa-wand-magic' flat %}
**`Disabled`**
{% endnote %}

```markdown
{% note disabled %}
默认 提示块标签
{% endnote %}

{% note default disabled %}
default 提示块标签
{% endnote %}

{% note primary disabled %}
primary 提示块标签
{% endnote %}

{% note success disabled %}
success 提示块标签
{% endnote %}

{% note info disabled %}
info 提示块标签
{% endnote %}

{% note warning disabled %}
warning 提示块标签
{% endnote %}

{% note danger disabled %}
danger 提示块标签
{% endnote %}
```

{% note disabled %}
默认 提示块标签
{% endnote %}

{% note default disabled %}
default 提示块标签
{% endnote %}

{% note primary disabled %}
primary 提示块标签
{% endnote %}

{% note success disabled %}
success 提示块标签
{% endnote %}

{% note info disabled %}
info 提示块标签
{% endnote %}

{% note warning disabled %}
warning 提示块标签
{% endnote %}

{% note danger disabled %}
danger 提示块标签
{% endnote %}

{% note primary 'fa-solid fa-wand-magic' flat %}
**`No-icon`**
{% endnote %}

```markdown
{% note no-icon %}
默认 提示块标签
{% endnote %}

{% note default no-icon %}
default 提示块标签
{% endnote %}

{% note primary no-icon %}
primary 提示块标签
{% endnote %}

{% note success no-icon %}
success 提示块标签
{% endnote %}

{% note info no-icon %}
info 提示块标签
{% endnote %}

{% note warning no-icon %}
warning 提示块标签
{% endnote %}

{% note danger no-icon %}
danger 提示块标签
{% endnote %}
```

{% note no-icon %}
默认 提示块标签
{% endnote %}

{% note default no-icon %}
default 提示块标签
{% endnote %}

{% note primary no-icon %}
primary 提示块标签
{% endnote %}

{% note success no-icon %}
success 提示块标签
{% endnote %}

{% note info no-icon %}
info 提示块标签
{% endnote %}

{% note warning no-icon %}
warning 提示块标签
{% endnote %}

{% note danger no-icon %}
danger 提示块标签
{% endnote %}

<!-- endtab -->

<!-- tab 用法2(自定义icon) -->

{% note pink 'fa-solid fa-bell' flat %}
**3.2.0 以上版本支持**
{% endnote %}

```markdown
{% note [color] [icon] [style] %}
Any content (support inline tags too.io).
{% endnote %}
```

|  名称   | 解释                                                                   |
| :-----: | ---------------------------------------------------------------------- |
| `color` | 可选: 顔色(`default`/`blue`/`pink`/`red`/`purple`/`orange`/`green`)    |
| `icons` | 可选: 可配置自定义 icon (只支持 fontawesome 图标, 也可以配置 no-icon ) |
| `style` | 可选: 可以覆盖配置中的 style（`simple`/`modern`/`flat`/`disabled`）    |

{% note primary 'fa-solid fa-wand-magic-sparkles' flat %}
**`Simple`**
{% endnote %}

```markdown
{% note 'fab fa-cc-visa' simple %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue 'fas fa-bullhorn' simple %}
2021 年快到了....
{% endnote %}
{% note pink 'fas fa-car-crash' simple %}
小心开车 安全至上
{% endnote %}
{% note red 'fas fa-fan' simple%}
这是三片呢？还是四片？
{% endnote %}
{% note orange 'fas fa-battery-half' simple %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple 'far fa-hand-scissors' simple %}
剪刀石头布
{% endnote %}
{% note green 'fab fa-internet-explorer' simple %}
前端最讨厌的浏览器
{% endnote %}
```

{% note 'fab fa-cc-visa' simple %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue 'fas fa-bullhorn' simple %}
2021 年快到了....
{% endnote %}
{% note pink 'fas fa-car-crash' simple %}
小心开车 安全至上
{% endnote %}
{% note red 'fas fa-fan' simple%}
这是三片呢？还是四片？
{% endnote %}
{% note orange 'fas fa-battery-half' simple %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple 'far fa-hand-scissors' simple %}
剪刀石头布
{% endnote %}
{% note green 'fab fa-internet-explorer' simple %}
前端最讨厌的浏览器
{% endnote %}

---

{% note primary 'fa-solid fa-wand-magic-sparkles' flat %}
**`Modern`**
{% endnote %}

```markdown
{% note 'fab fa-cc-visa' modern %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue 'fas fa-bullhorn' modern %}
2021 年快到了....
{% endnote %}
{% note pink 'fas fa-car-crash' modern %}
小心开车 安全至上
{% endnote %}
{% note red 'fas fa-fan' modern%}
这是三片呢？还是四片？
{% endnote %}
{% note orange 'fas fa-battery-half' modern %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple 'far fa-hand-scissors' modern %}
剪刀石头布
{% endnote %}
{% note green 'fab fa-internet-explorer' modern %}
前端最讨厌的浏览器
{% endnote %}
```

{% note 'fab fa-cc-visa' modern %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue 'fas fa-bullhorn' modern %}
2021 年快到了....
{% endnote %}
{% note pink 'fas fa-car-crash' modern %}
小心开车 安全至上
{% endnote %}
{% note red 'fas fa-fan' modern%}
这是三片呢？还是四片？
{% endnote %}
{% note orange 'fas fa-battery-half' modern %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple 'far fa-hand-scissors' modern %}
剪刀石头布
{% endnote %}
{% note green 'fab fa-internet-explorer' modern %}
前端最讨厌的浏览器
{% endnote %}

---

{% note primary 'fa-solid fa-wand-magic-sparkles' flat %}
**`Flat`**
{% endnote %}

```markdown
{% note 'fab fa-cc-visa' flat %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue 'fas fa-bullhorn' flat %}
2021 年快到了....
{% endnote %}
{% note pink 'fas fa-car-crash' flat %}
小心开车 安全至上
{% endnote %}
{% note red 'fas fa-fan' flat%}
这是三片呢？还是四片？
{% endnote %}
{% note orange 'fas fa-battery-half' flat %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple 'far fa-hand-scissors' flat %}
剪刀石头布
{% endnote %}
{% note green 'fab fa-internet-explorer' flat %}
前端最讨厌的浏览器
{% endnote %}
```

{% note 'fab fa-cc-visa' flat %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue 'fas fa-bullhorn' flat %}
2021 年快到了....
{% endnote %}
{% note pink 'fas fa-car-crash' flat %}
小心开车 安全至上
{% endnote %}
{% note red 'fas fa-fan' flat%}
这是三片呢？还是四片？
{% endnote %}
{% note orange 'fas fa-battery-half' flat %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple 'far fa-hand-scissors' flat %}
剪刀石头布
{% endnote %}
{% note green 'fab fa-internet-explorer' flat %}
前端最讨厌的浏览器
{% endnote %}

---

{% note primary 'fa-solid fa-wand-magic-sparkles' flat %}
**`Disabled`**
{% endnote %}

```markdown
{% note 'fab fa-cc-visa' disabled %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue 'fas fa-bullhorn' disabled %}
2021 年快到了....
{% endnote %}
{% note pink 'fas fa-car-crash' disabled %}
小心开车 安全至上
{% endnote %}
{% note red 'fas fa-fan' disabled %}
这是三片呢？还是四片？
{% endnote %}
{% note orange 'fas fa-battery-half' disabled %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple 'far fa-hand-scissors' disabled %}
剪刀石头布
{% endnote %}
{% note green 'fab fa-internet-explorer' disabled %}
前端最讨厌的浏览器
{% endnote %}
```

---

{% note primary 'fa-solid fa-wand-magic-sparkles' flat %}
**`No-icon`**
{% endnote %}

```markdown
{% note no-icon %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue no-icon %}
2021 年快到了....
{% endnote %}
{% note pink no-icon %}
小心开车 安全至上
{% endnote %}
{% note red no-icon %}
这是三片呢？还是四片？
{% endnote %}
{% note orange no-icon %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple no-icon %}
剪刀石头布
{% endnote %}
{% note green no-icon %}
前端最讨厌的浏览器
{% endnote %}
```

{% note no-icon %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note blue no-icon %}
2021 年快到了....
{% endnote %}
{% note pink no-icon %}
小心开车 安全至上
{% endnote %}
{% note red no-icon %}
这是三片呢？还是四片？
{% endnote %}
{% note orange no-icon %}
你是刷 Visa 还是 UnionPay
{% endnote %}
{% note purple no-icon %}
剪刀石头布
{% endnote %}
{% note green no-icon %}
前端最讨厌的浏览器
{% endnote %}

<!-- endtab -->

{% endtabs %}

---

## Gallery 相册图库

{% note pink 'fa-solid fa-bell' flat %}
**2.2.0 以上提供**
{% endnote %}

一个图库集合。

写法:

```markdown
<!-- name: 图库名字 -->
<!-- description: 图库描述 -->
<!-- link: 连接到对应相册的地址 -->
<!-- img-url: 图库封面的地址 -->
<div class="gallery-group-main">
{% galleryGroup name description link img-url %}
{% galleryGroup name description link img-url %}
{% galleryGroup name description link img-url %}
</div>
```

{% note primary 'fa-solid fa-wand-magic-sparkles' flat %}
**`例子`**
{% endnote %}

```markdown
<div class="gallery-group-main">
{% galleryGroup '自然｜风景' '绝美的自然风景桌面壁纸~' '/wallpaper/nature' https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面03.png %}
{% galleryGroup '动漫｜二次元' '动漫高清桌面壁纸~' '/wallpaper/anime' https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物07.png %}
</div>
```

<div class="gallery-group-main">
{% galleryGroup '自然｜风景' '绝美的自然风景桌面壁纸~' '/wallpaper/nature' /img/picgo-images/文章随机封面03.jpg %}

---

## Gallery 相册

{% note pink 'fa-solid fa-bell' flat %}
**2.0.0 以上提供**
{% endnote %}

区别于旧版的 Gallery 相册,新的 Gallery 相册会自动根据图片长度进行排版，书写也更加方便，与 markdown 格式一样。可根据需要插入到相应的
md。

{% tabs gallery %}

<!-- tab 本地 -->

写法

```markdown
<!-- button: 【可选】点击按钮加载更多图片，填写 true/false。默认为 false。 -->

{% gallery [button] %}
markdown 图片格式
{% endgallery %}
```

{% note primary 'fa-solid fa-wand-magic-sparkles' flat %}
**`例子`**
{% endnote %}

```markdown
{% gallery %}
![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面01.png)
![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面02.png)
![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面03.png)
![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面04.png)
{% endgallery %}
```

{% gallery %}
![](/img/picgo-images/文章随机封面01.jpg)
![](/img/picgo-images/文章随机封面02.jpg)
![](/img/picgo-images/文章随机封面03.jpg)
![](/img/picgo-images/文章随机封面04.png)
{% endgallery %}

<!-- endtab-->

<!-- tab 远程拉取 -->

```markdown
<!-- url: 【必须】 识别词 -->
<!-- link: 【必须】远程的 json 链接 -->
<!-- button: 【可选】点击按钮加载更多图片，填写 true/false。默认为 false。 -->

{% gallery url,[link],[button] %}
{% endgallery %}
```

> 远程链接 Json 的例子. 有三个参数，url是必须存在的，alt 和 title 可有，也可没有。

```json
[
  {
    "url": "https://cdn.jsdelivr.net/gh/jerryc127/CDN/img/IMG_0556.jpg",
    "alt": "IMG_0556.jpg",
    "title": "这是title"
  },
  {
    "url": "https://cdn.jsdelivr.net/gh/jerryc127/CDN/img/IMG_0472.jpg",
    "alt": "IMG_0472.jpg"
  },
  {
    "url": "https://cdn.jsdelivr.net/gh/jerryc127/CDN/img/IMG_0453.jpg",
    "alt": ""
  },
  {
    "url": "https://cdn.jsdelivr.net/gh/jerryc127/CDN/img/IMG_0931.jpg",
    "alt": ""
  }
]
```

> 例子

```markdown
{% gallery url,https://xxxx.com/sss.json %}
{% endgallery %}

{% gallery url,https://xxxx.com/sss.json,true,220,10 %}
{% endgallery %}

{% gallery url,https://xxxx.com/sss.json,true,,10 %}
{% endgallery %}
```

<!-- endtab-->

{% endtabs %}

---

## Tag-hide

{% note pink 'fa-solid fa-bell' flat %}
2.2.0 以上提供

请注意，tag-hide 内的标签外挂 content 内都不建议有 h1 - h6 等标题。因为 Toc 会把隐藏内容标题也显示出来，而且当滚动屏幕时，如果隐藏内容没有显示出来，会导致
Toc 的滚动出现异常。
{% endnote %}

如果你想把一些文字、内容隐藏起来，并提供按钮让用户点击显示。可以使用这个标签外挂.

{% tabs tag-hide %}

<!-- tab Inline -->

- `inline` 在文本里面添加按钮隐藏内容，只限文字
- `content` 不能包含英文逗号，可用`&sbquo;`

```markdown
<!-- content: 文本内容 -->
<!-- display: 【可选】按钮显示的文字 -->
<!-- bg: 【可选】按钮的背景颜色 -->
<!-- color: 【可选】按钮文字的颜色 -->

{% hideInline content,display,bg,color %}
```

> 例子

```markdown
- 哪个英文字母最酷？ {% hideInline 因为西装裤(C装酷),查看答案,#FF7242,#fff %}
- 门里站着一个人? {% hideInline 闪 %}
```

- 哪个英文字母最酷？ {% hideInline 因为西装裤(C装酷),查看答案,#FF7242,#fff %}
- 门里站着一个人? {% hideInline 闪 %}

<!-- endtab -->

<!-- tab Block -->

- block独立的 block 隐藏内容，可以隐藏很多内容，包括图片，代码块等等
- display 不能包含英文逗号，可用`&sbquo;`

```markdown
<!-- content: 文本内容 -->
<!-- display: 【可选】按钮显示的文字 -->
<!-- bg: 【可选】按钮的背景颜色 -->
<!-- color: 【可选】按钮文字的颜色 -->

{% hideBlock display,bg,color %}
content
{% endhideBlock %}
```

> 例子

```markdown
查看答案
{% hideBlock 查看答案 %}
傻子，怎么可能有答案
{% endhideBlock %}
```

查看答案
{% hideBlock 查看答案 %}
傻子，怎么可能有答案
{% endhideBlock %}

<!-- endtab -->

<!-- tab Toggle -->

{% note pink 'fa-solid fa-bell' flat %}
**2.3.0 以上支持**
{% endnote %}

- 如果你需要展示的内容太多，可以把它隐藏在收缩框里，需要时再把它展开。
- display 不能包含英文逗号，可用`&sbquo;`

```markdown
<!-- display: 显示的文字 -->
<!-- bg: 【可选】按钮的背景颜色 -->
<!-- color: 【可选】按钮文字的颜色 -->

{% hideToggle display,bg,color %}
content
{% endhideToggle %}
```

> 例子

```markdown
{% hideToggle Butterfly 安装方法 %}

1. 在你的博客根目录里
   git clone -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/Butterfly

2. 如果想要安装比较新的 dev 分支，可以
   git clone -b dev https://github.com/jerryc127/hexo-theme-butterfly.git themes/Butterfly
   {% endhideToggle %}
```

{% hideToggle Butterfly 安装方法 %}

1. 在你的博客根目录里

   ```bash
   git clone -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/Butterfly
   ```

2. 如果想要安装比较新的 dev 分支，可以

   ```bash
   git clone -b dev https://github.com/jerryc127/hexo-theme-butterfly.git themes/Butterfly
   ```

{% endhideToggle %}

<!-- endtab -->

{% endtabs %}

---

## Mermaid 图表

> 使用 mermaid 标签可以绘制 Flowchart（流程图）、Sequence diagram（时序图 ）、Class Diagram（类别图）、State
> Diagram（状态图）、Gantt（甘特图）和 Pie Chart（圆形图），具体可以查看mermaid 文档.

```yaml
# Mermaid
# https://github.com/mermaid-js/mermaid
mermaid:
  enable: false
  # Write Mermaid diagrams using code blocks
  code_write: false
  # built-in themes: default / forest / dark / neutral
  theme:
    light: default
    dark: dark
```

写法:

```md
<!-- config: 【可选】mermaid 图表配置, 以 JSON 格式书写，具体配置参数请参考mermaid 文档 -->

{% mermaid '[config]' %}
内容
{% endmermaid %}
```

> 示例-饼状图:

```md
{% mermaid %}
pie
title Key elements in Product X
"Calcium" : 42.96
"Potassium" : 50.05
"Magnesium" : 10.01
"Iron" : 5
{% endmermaid %}
```

{% mermaid %}
pie
title Key elements in Product X
"Calcium" : 42.96
"Potassium" : 50.05
"Magnesium" : 10.01
"Iron" : 5
{% endmermaid %}

> 流程图:

```markdown
{% mermaid '{"themeVariables": { "fontSize": "16px" }, "layout": "elk", "look": "handDrawn"}' %}
flowchart LR
A[Start] --> B{Decision}
B -->|Yes| C[Continue]
B -->|No| D[Stop]
{% endmermaid %}
```

{% mermaid '{"themeVariables": { "fontSize": "16px" }, "layout": "elk", "look": "handDrawn"}' %}
flowchart LR
A[Start] --> B{Decision}
B -->|Yes| C[Continue]
B -->|No| D[Stop]
{% endmermaid %}

---

## Tabs

> 移植于 next 主题

```md
<!-- Unique name: tabs 区块标签的唯一名称，不包含逗号。将用于每个选项卡的 #id 前缀，并附加其索引号。若名称中有空格，生成 #id 时会将空格替换为短横线。仅对当前文章/页面的 URL 必须唯一！ -->
<!-- index: 【可选】活动选项卡的索引号。如果未指定，将选择第一个选项卡（1）。如果索引为 -1，则不会选择任何选项卡，类似于折叠内容。可选参数。 -->
<!-- Tab caption: 当前选项卡的标题。如果未指定标题，将使用唯一名称和选项卡索引后缀作为选项卡标题。如果未指定标题，但指定了图标，标题将为空。 -->
<!-- @icon: 【可选】FontAwesome 图标名称（全名，如 'fas fa-font'）。可以有或没有空格；例如 'Tab caption @icon' 与 'Tab caption@icon' 类似。 -->

{% tabs Unique name, [index] %}

<!-- tab [Tab caption] [@icon] -->

Any content (support inline tags too).

<!-- endtab -->

{% endtabs %}
```

> 例子 1 - 预设选择第一个【默认】

```md
{% tabs test1 %}

<!-- tab -->

**This is Tab 1.**

<!-- endtab -->

<!-- tab -->

**This is Tab 2.**

<!-- endtab -->

<!-- tab -->

**This is Tab 3.**

<!-- endtab -->

{% endtabs %}
```

{% tabs test1 %}

<!-- tab -->

**This is Tab 1.**

<!-- endtab -->

<!-- tab -->

**This is Tab 2.**

<!-- endtab -->

<!-- tab -->

**This is Tab 3.**

<!-- endtab -->

{% endtabs %}

> 例子 2 - 预设选择 tabs

```markdown
{% tabs test2, 3 %}

<!-- tab -->

**This is Tab 1.**

<!-- endtab -->

<!-- tab -->

**This is Tab 2.**

<!-- endtab -->

<!-- tab -->

**This is Tab 3.**

<!-- endtab -->

{% endtabs %}
```

{% tabs test2, 3 %}

<!-- tab -->

**This is Tab 1.**

<!-- endtab -->

<!-- tab -->

**This is Tab 2.**

<!-- endtab -->

<!-- tab -->

**This is Tab 3.**

<!-- endtab -->

{% endtabs %}

> 例子 3 - 没有预设值

```markdown
{% tabs test3, -1 %}

<!-- tab -->

**This is Tab 1.**

<!-- endtab -->

<!-- tab -->

**This is Tab 2.**

<!-- endtab -->

<!-- tab -->

**This is Tab 3.**

<!-- endtab -->

{% endtabs %}
```

{% tabs test3, -1 %}

<!-- tab -->

**This is Tab 1.**

<!-- endtab -->

<!-- tab -->

**This is Tab 2.**

<!-- endtab -->

<!-- tab -->

**This is Tab 3.**

<!-- endtab -->

{% endtabs %}

> 例子 4 - 自定义 Tab 名 + 只有 icon + icon 和 Tab 名

```markdown
{% tabs test4 %}

<!-- tab 第一个Tab -->

**tab 名字为第一个 Tab**

<!-- endtab -->

<!-- tab @fab fa-apple-pay -->

**只有图标 没有 Tab 名字**

<!-- endtab -->

<!-- tab 炸弹@fas fa-bomb -->

**名字+icon**

<!-- endtab -->

{% endtabs %}
```

{% tabs test4 %}

<!-- tab 第一个Tab -->

**tab 名字为第一个 Tab**

<!-- endtab -->

<!-- tab @fab fa-apple-pay -->

**只有图标 没有 Tab 名字**

<!-- endtab -->

<!-- tab 炸弹@fas fa-bomb -->

**名字+icon**

<!-- endtab -->

{% endtabs %}

---

## Button

{% note pink 'fa-solid fa-bell' flat %}
3.0 以上提供
{% endnote %}

使用方法:

```md
<!-- url: 【必须】链接地址 -->
<!-- text: 【必须】按钮文字 -->
<!-- icon: 【可选】图标 -->
<!-- color: 【可选】按钮背景顔色（默认 style 时）按钮字体和边框顔色(outline 时), 配置： default/blue/pink/red/purple/orange/green -->
<!-- style: 【可选】按钮样式 默认实心, 配置： outline/留空 -->
<!-- layout: 【可选】按钮佈局 默认为 line, 配置： block/留空 -->
<!-- position: 【可选】按钮位置 前提是设置了 layout 为 block 默认为左边, 配置： center/right/留空 -->
<!-- size: 【可选】按钮大小, 配置： larger/留空 -->

{% btn [url],[text],[icon],[color] [style] [layout] [position] [size] %}
```

> 例子

```md
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,,outline %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,larger %}
```

This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,,outline %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline %}
This is my website, click the button {% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,larger %}

```markdown
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block center larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block right outline larger %}
```

{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block center larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,block right outline larger %}

> more than one button in center

```markdown
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,blue larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,pink larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,red larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,purple larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,orange larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,green larger %}
```

{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,blue larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,pink larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,red larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,purple larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,orange larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,green larger %}

```markdown
<div class="btn-center">
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline blue larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline pink larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline red larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline purple larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline orange larger %}
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline green larger %}
</div>
```

<div class="btn-center">
{% btn 'https://butterfly.js.org/',Butterfly,far fa-hand-point-right,outline larger %}

---

## InlineImg

> 主题中的图片都是默认以块级元素显示，如果你想以内联元素显示，可以使用这个标签外挂。

```md
<!-- src: 图片链接 -->
<!-- height: 【可选】图片高度限制 -->

{% inlineImg [src] [height] %}

{% inlineImg [src] [height] %}
```

> 例子

```markdown
你看她长得漂亮不

![](https://i.loli.net/2021/03/19/2P6ivUGsdaEXSFI.png)

我觉得很漂亮 {% inlineImg https://i.loli.net/2021/03/19/5M4jUB3ynq7ePgw.png 150px %}
```

---

## Label

{% note pink 'fa-solid fa-bell' flat %}
由于 hexo 的渲染限制， 在段落开头使用 label 标签外挂会出现一些问题。例如：连续开头使用 label 标签外挂的段落无法换行

建议 不要 在段落开头使用 label 标签外挂
{% endnote %}

高亮所需的文字

```md
<!-- text: 文字 -->
<!-- color: 【可选】背景颜色，默认为 default, default/blue/pink/red/purple/orange/green -->

{% label text color %}

{% label text color %}
```

> 例子

```md
臣亮言：{% label 先帝 %}创业未半，而{% label 中道崩殂 blue %}。今天下三分，{% label 益州疲敝 pink %}，此诚{% label 危急存亡之秋
red %}也！然侍衞之臣，不懈于内；{% label 忠志之士 purple %}，忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气；不宜妄自菲薄，引喻失义，以塞忠谏之路也。
宫中、府中，俱为一体；陟罚臧否，不宜异同。若有{% label 作奸 orange %}、{% label 犯科 green
%}，及为忠善者，宜付有司，论其刑赏，以昭陛下平明之治；不宜偏私，使内外异法也。
```

臣亮言：{% label 先帝 %}创业未半，而{% label 中道崩殂 blue %}。今天下三分，{% label 益州疲敝 pink %}，此诚{% label 危急存亡之秋
red %}也！然侍衞之臣，不懈于内；{% label 忠志之士 purple %}，忘身于外者，盖追先帝之殊遇，欲报之于陛下也。诚宜开张圣听，以光先帝遗德，恢弘志士之气；不宜妄自菲薄，引喻失义，以塞忠谏之路也。
宫中、府中，俱为一体；陟罚臧否，不宜异同。若有{% label 作奸 orange %}、{% label 犯科 green
%}，及为忠善者，宜付有司，论其刑赏，以昭陛下平明之治；不宜偏私，使内外异法也。

---

## Timeline

{% note pink 'fa-solid fa-bell' flat %}

4.0.0 以上支持

{% endnote %}

```md
<!-- title: 标题/时间线 -->
<!-- color: timeline 颜色, default(留空) / blue / pink / red / purple / orange / green -->

{% timeline title,color %}

<!-- timeline title -->

xxxxx

<!-- endtimeline -->
<!-- timeline title -->

xxxxx

<!-- endtimeline -->

{% endtimeline %}
```

> 例子: default(留空)

```markdown
{% timeline 2026 %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}
```

{% timeline 2026 %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}

> blue

```markdown
{% timeline 2026,blue %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}
```

{% timeline 2026,blue %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}

> pink

```markdown
{% timeline 2026,pink %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}
```

{% timeline 2026,pink %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}

> red

```markdown
{% timeline 2026,red %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}
```

{% timeline 2026,red %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}

> purple

```markdown
{% timeline 2026,purple %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}
```

{% timeline 2026,purple %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}

> orange

```markdown
{% timeline 2026,orange %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}
```

{% timeline 2022,orange %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}

> green

```markdown
{% timeline 2026,green %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}
```

{% timeline 2022,green %}

<!-- timeline 01-02 -->

这是测试页面

<!-- endtimeline -->

{% endtimeline %}

---

## Flink

{% note pink 'fa-solid fa-bell' flat %}

4.1.0 以上支持

{% endnote %}

可在任何界面插入类似友情链接列表效果

内容格式与友情链接界面一样，支持 `yml` 格式

插入友链效果:

```md
{% flink %}
内容
{% endflink %}
```

> 例子

```markdown
{% flink %}

- class_name: 友情链接
  class_desc: 那些人，那些事
  link_list:
  - name: CrazyWong
    link: https://crazywong.com
    avatar: https://crazywong.com/img/avatar.png
    descr: 今日事,今日毕
  - name: Hexo
    link: https://hexo.io/zh-tw/
    avatar: https://d33wubrfki0l68.cloudfront.net/6657ba50e702d84afb32fe846bed54fba1a77add/827ae/logo.svg
    descr: 快速、简单且强大的网志框架

- class_name: 网站
  class_desc: 值得推荐的网站
  link_list:
  - name: Youtube
    link: https://www.youtube.com/
    avatar: https://i.loli.net/2020/05/14/9ZkGg8v3azHJfM1.png
    descr: 视频网站
  - name: Weibo
    link: https://www.weibo.com/
    avatar: https://i.loli.net/2020/05/14/TLJBum386vcnI1P.png
    descr: 中国最大社交分享平台
  - name: Twitter
    link: https://twitter.com/
    avatar: https://i.loli.net/2020/05/14/5VyHPQqR6LWF39a.png
    descr: 社交分享平台
    {% endflink %}
```

{% flink %}

- class_name: 友情链接
  class_desc: 那些人，那些事
  link_list:
  - name: CrazyWong
    link: https://crazywong.com
    avatar: https://crazywong.com/img/avatar.png
    descr: 今日事,今日毕
  - name: Hexo
    link: https://hexo.io/zh-tw/
    avatar: https://d33wubrfki0l68.cloudfront.net/6657ba50e702d84afb32fe846bed54fba1a77add/827ae/logo.svg
    descr: 快速、简单且强大的网志框架

- class_name: 网站
  class_desc: 值得推荐的网站
  link_list:
  - name: Youtube
    link: https://www.youtube.com/
    avatar: https://i.loli.net/2020/05/14/9ZkGg8v3azHJfM1.png
    descr: 视频网站
  - name: Weibo
    link: https://www.weibo.com/
    avatar: https://i.loli.net/2020/05/14/TLJBum386vcnI1P.png
    descr: 中国最大社交分享平台
  - name: Twitter
    link: https://twitter.com/
    avatar: https://i.loli.net/2020/05/14/5VyHPQqR6LWF39a.png
    descr: 社交分享平台
    {% endflink %}

---

## ABCJS 乐谱

> 在页面上渲染乐谱.

```yaml
# abcjs (乐谱渲染)
# See https://github.com/paulrosen/abcjs
# ---------------
# enable: 是否启用 ABCJS
# per_page: 是否每页都加载 ABCJS, 如果设爲 false, 在你使用 ABCJS 时，你需要在使用 ABCJS 的页面 Front-matter 添加 abcjs: true
abcjs:
  enable: true
  per_page: true
```

写法:

```md
{% score %}
乐谱代码
{% endscore %}
```

> 例子

```markdown
{% score %}
X:1
T:alternate heads
M:C
L:1/8
U:n=!style=normal!
K:C treble style=rhythm
"Am" BBBB B2 B>B | "Dm" B2 B/B/B "C" B4 |"Am" B2 nGnB B2 nGnA | "Dm" nDB/B/ nDB/B/ "C" nCB/B/ nCB/B/ |B8| B0 B0 B0 B0 |]
%%text This translates to:
[M:C][K:style=normal]
[A,EAce][A,EAce][A,EAce][A,EAce] [A,EAce]2 [A,EAce]>[A,EAce] |[DAdf]2 [DAdf]/[DAdf]/[DAdf] [CEGce]4 |[A,EAce]2
GA [A,EAce] GA |D[DAdf]/[DAdf]/ D[DAdf]/[DAdf]/ C [CEGce]/[CEGce]/ C[CEGce]/[CEGce]/ |[CEGce]8 | [CEGce]2 [CEGce]
2 [CEGce]2 [CEGce]2 |]
GAB2 !style=harmonic![gb]4|GAB2 [K: style=harmonic]gbgb|
[K: style=x]
C/A,/ C/C/E C/zz2|
w:Rock-y did-nt like that
{% endscore %}
```

{% score %}
X:1
T:alternate heads
M:C
L:1/8
U:n=!style=normal!
K:C treble style=rhythm
"Am" BBBB B2 B>B | "Dm" B2 B/B/B "C" B4 |"Am" B2 nGnB B2 nGnA | "Dm" nDB/B/ nDB/B/ "C" nCB/B/ nCB/B/ |B8| B0 B0 B0 B0 |]
%%text This translates to:
[M:C][K:style=normal]
[A,EAce][A,EAce][A,EAce][A,EAce] [A,EAce]2 [A,EAce]>[A,EAce] |[DAdf]2 [DAdf]/[DAdf]/[DAdf] [CEGce]4 |[A,EAce]2
GA [A,EAce] GA |D[DAdf]/[DAdf]/ D[DAdf]/[DAdf]/ C [CEGce]/[CEGce]/ C[CEGce]/[CEGce]/ |[CEGce]8 | [CEGce]2 [CEGce]
2 [CEGce]2 [CEGce]2 |]
GAB2 !style=harmonic![gb]4|GAB2 [K: style=harmonic]gbgb|
[K: style=x]
C/A,/ C/C/E C/zz2|
w:Rock-y did-nt like that
{% endscore %}

---

## Series 系列文章

> 在页面上显示系列文章.

```yaml
# enable: 是否启用 series
# orderBy: 排序方式，默认为 title, 可选 title / date
# order: 排序方式，默认为 1, 可选 1 (升序) / -1（降序）
# number: 显示序列号
series:
  enable: true
  orderBy: "title" # Order by title or date
  order: 1 # Sort of order. 1, asc for ascending; -1, desc for descending
  number: true
```

写法:

```md
{% series %}
{% series [series name] %}
```

- 在文章的 front-matter 上添加参数 series，并给与一个标识
- 使用此标签外挂，会把相同标识的文章以列表的形式展示
- 如果不写 series 标识，则默认为你使用此标签外挂所在的文章的 series 标识

> 例子

```markdown
{% series docs %}
```

---

## Chartjs 图表

> 另一种方式添加图表.

```yaml
# chartjs
# 参见 https://www.chartjs.org/docs/latest/
chartjs:
  enable: true
  # 除非你了解它们的工作原理，否则不要修改。
  # 默认设置仅在未指定 MD 语法时使用。
  # 图表的字体颜色
  fontColor:
    light: "rgba(0, 0, 0, 0.8)"
    dark: "rgba(255, 255, 255, 0.8)"
  # 图表的边框颜色
  borderColor:
    light: "rgba(0, 0, 0, 0.1)"
    dark: "rgba(255, 255, 255, 0.2)"
  # 雷达图和极区图的刻度标签背景颜色
  scale_ticks_backdropColor:
    light: "transparent"
    dark: "transparent"
```

写法:

```markdown
<!-- width: 【可选】图表宽度 -->
<!-- abreast: 【可选】是否并排显示，当你写了 , 使用并排模式，图标和描述将并排显示。abreast 为 true 时，需要配置 width 的值 -->
<!-- chartId: 【可选】图表 ID -->

{% chartjs [width, abreast, chartId] %}

<!-- chart -->
<!-- endchart -->
<!-- desc -->
<!-- enddesc -->

{% endchartjs %}
```

> **折线图**

```markdown
{% chartjs 70 %}

<!-- chart -->

{
"type": "line",
"data": {
"labels": ["January", "February", "March", "April", "May", "June", "July"],
"datasets": [{
"label": "My First dataset",
"backgroundColor": "rgb(255, 99, 132)",
"borderColor": "rgb(255, 99, 132)",
"data": [0, 10, 5, 2, 20, 30, 45]
}]
},
"options": {
"responsive": true,
"title": {
"display": true,
"text": "Chart.js Line Chart"
}
}
}

<!-- endchart -->

{% endchartjs %}
```

{% chartjs 70 %}

<!-- chart -->

{
"type": "line",
"data": {
"labels": ["January", "February", "March", "April", "May", "June", "July"],
"datasets": [{
"label": "My First dataset",
"backgroundColor": "rgb(255, 99, 132)",
"borderColor": "rgb(255, 99, 132)",
"data": [0, 10, 5, 2, 20, 30, 45]
}]
},
"options": {
"responsive": true,
"title": {
"display": true,
"text": "Chart.js Line Chart"
}
}
}

<!-- endchart -->

{% endchartjs %}

> **雷达图, 也称蜘蛛图、蛛网图.**

```markdown
{% chartjs %}

<!-- chart -->

{
"type": "radar",
"data": {
"labels": [
"Eating",
"Drinking",
"Sleeping",
"Designing",
"Coding",
"Cycling",
"Running"
],
"datasets": [
{
"label": "My First Dataset",
"data": [65, 59, 90, 81, 56, 55, 40],
"fill": true,
"backgroundColor": "rgba(255, 99, 132, 0.2)",
"borderColor": "rgb(255, 99, 132)",
"pointBackgroundColor": "rgb(255, 99, 132)",
"pointBorderColor": "#fff",
"pointHoverBackgroundColor": "#fff",
"pointHoverBorderColor": "rgb(255, 99, 132)"
},
{
"label": "My Second Dataset",
"data": [28, 48, 40, 19, 96, 27, 100],
"fill": true,
"backgroundColor": "rgba(54, 162, 235, 0.2)",
"borderColor": "rgb(54, 162, 235)",
"pointBackgroundColor": "rgb(54, 162, 235)",
"pointBorderColor": "#fff",
"pointHoverBackgroundColor": "#fff",
"pointHoverBorderColor": "rgb(54, 162, 235)"
}
]
},
"options": {
"elements": {
"line": {
"borderWidth": 3
}
}
}
}

<!-- endchart -->

{% endchartjs %}
```

{% chartjs %}

<!-- chart -->

{
"type": "radar",
"data": {
"labels": [
"Eating",
"Drinking",
"Sleeping",
"Designing",
"Coding",
"Cycling",
"Running"
],
"datasets": [
{
"label": "My First Dataset",
"data": [65, 59, 90, 81, 56, 55, 40],
"fill": true,
"backgroundColor": "rgba(255, 99, 132, 0.2)",
"borderColor": "rgb(255, 99, 132)",
"pointBackgroundColor": "rgb(255, 99, 132)",
"pointBorderColor": "#fff",
"pointHoverBackgroundColor": "#fff",
"pointHoverBorderColor": "rgb(255, 99, 132)"
},
{
"label": "My Second Dataset",
"data": [28, 48, 40, 19, 96, 27, 100],
"fill": true,
"backgroundColor": "rgba(54, 162, 235, 0.2)",
"borderColor": "rgb(54, 162, 235)",
"pointBackgroundColor": "rgb(54, 162, 235)",
"pointBorderColor": "#fff",
"pointHoverBackgroundColor": "#fff",
"pointHoverBorderColor": "rgb(54, 162, 235)"
}
]
},
"options": {
"elements": {
"line": {
"borderWidth": 3
}
}
}
}

<!-- endchart -->

{% endchartjs %}

> **多分类饼图**

```markdown
{% chartjs 40,true %}

<!-- chart -->

{
"type": "pie",
"data": {
"labels": [
"编程",
"音乐",
"阅读",
"游戏",
"健身",
"旅游"
],
"datasets": [
{
"label": "喜爱指数",
"data": [
30,
24,
19,
14,
9,
4
],
"backgroundColor": {
"dark-mode": [
"rgba(255, 99, 132, 0.5)",
"rgba(54, 162, 235, 0.5)",
"rgba(255, 206, 86, 0.5)",
"rgba(75, 192, 192, 0.5)",
"rgba(153, 102, 255, 0.5)",
"rgba(255, 159, 64, 0.5)"
],
"light-mode": [
"rgba(255, 99, 132, 0.2)",
"rgba(54, 162, 235, 0.2)",
"rgba(255, 206, 86, 0.2)",
"rgba(75, 192, 192, 0.2)",
"rgba(153, 102, 255, 0.2)",
"rgba(255, 159, 64, 0.2)"
]
},
"borderColor": {
"dark-mode": [
"rgba(255, 99, 132, 1)",
"rgba(54, 162, 235, 1)",
"rgba(255, 206, 86, 1)",
"rgba(75, 192, 192, 1)",
"rgba(153, 102, 255, 1)",
"rgba(255, 159, 64, 1)"
],
"light-mode": [
"rgba(255, 99, 132, 1)",
"rgba(54, 162, 235, 1)",
"rgba(255, 206, 86, 1)",
"rgba(75, 192, 192, 1)",
"rgba(153, 102, 255, 1)",
"rgba(255, 159, 64, 1)"
]
}
}
]
},
"options": {
"plugins": {
"legend": {
"labels": {
"color": {
"dark-mode": "rgba(255, 255, 255, 0.8)",
"light-mode": "rgba(0, 0, 0, 0.8)"
}
}
}
}
}
}

<!-- endchart -->
<!-- desc -->

除了**计算机编程**外，我想不出还有其他让我感兴趣的工作。
我可以无中生有地创造出**精美的范式**和**结构**，
在此过程中也解决了无数的小谜团。
<span style="font-size:0.8em;color: var(--sep-secondtext);">I can't think of any other job other than **computer
programming** that interests me.
I can create **beautiful paradigms** and **structures** out of nothing,
Countless small mysteries are also solved in the process.</span>

<!-- enddesc -->

{% endchartjs %}
```

{% chartjs 40,true %}

<!-- chart -->

{
"type": "pie",
"data": {
"labels": [
"编程",
"音乐",
"阅读",
"游戏",
"健身",
"旅游"
],
"datasets": [
{
"label": "喜爱指数",
"data": [
30,
24,
19,
14,
9,
4
],
"backgroundColor": {
"dark-mode": [
"rgba(255, 99, 132, 0.5)",
"rgba(54, 162, 235, 0.5)",
"rgba(255, 206, 86, 0.5)",
"rgba(75, 192, 192, 0.5)",
"rgba(153, 102, 255, 0.5)",
"rgba(255, 159, 64, 0.5)"
],
"light-mode": [
"rgba(255, 99, 132, 0.2)",
"rgba(54, 162, 235, 0.2)",
"rgba(255, 206, 86, 0.2)",
"rgba(75, 192, 192, 0.2)",
"rgba(153, 102, 255, 0.2)",
"rgba(255, 159, 64, 0.2)"
]
},
"borderColor": {
"dark-mode": [
"rgba(255, 99, 132, 1)",
"rgba(54, 162, 235, 1)",
"rgba(255, 206, 86, 1)",
"rgba(75, 192, 192, 1)",
"rgba(153, 102, 255, 1)",
"rgba(255, 159, 64, 1)"
],
"light-mode": [
"rgba(255, 99, 132, 1)",
"rgba(54, 162, 235, 1)",
"rgba(255, 206, 86, 1)",
"rgba(75, 192, 192, 1)",
"rgba(153, 102, 255, 1)",
"rgba(255, 159, 64, 1)"
]
}
}
]
},
"options": {
"plugins": {
"legend": {
"labels": {
"color": {
"dark-mode": "rgba(255, 255, 255, 0.8)",
"light-mode": "rgba(0, 0, 0, 0.8)"
}
}
}
}
}
}

<!-- endchart -->

<!-- desc -->

除了**计算机编程**外，我想不出还有其他让我感兴趣的工作。
我可以无中生有地创造出**精美的范式**和**结构**，
在此过程中也解决了无数的小谜团。
<span style="font-size:0.8em;color: var(--sep-secondtext);">I can't think of any other job other than that interests me.I can create and out of nothing,Countless small mysteries are also solved in the process.</span>

<!-- enddesc -->

{% endchartjs %}

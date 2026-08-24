---
title: Butterfly文档(二) 功能拓展
tags:
  - Butterfly
  - Hexo
categories:
  - Butterfly Docs
description: Butterfly 主题功能拓展教程，详细介绍 Front-matter 参数、导航栏自定义、全局命令别名、评论系统、搜索配置等高级功能。
abbrlink: 1568d027
cover: /img/picgo-images/hexo-butterfly.png
date: 2026-01-10 22:00:24
updated:
---

## Front-matter参数

|  Front-matter 参数   | 含义/功能描述                                                                     |
| :------------------: | --------------------------------------------------------------------------------- |
|       `title`        | 文章/页面标题（必填）                                                             |
|        `date`        | 文章创建日期（影响排序与时间显示）                                                |
|       updated        | 文章最后修改日期（不填默认等于 date）                                             |
|        `tags`        | 文章标签（支持多个, e.g. [Hexo, Butterfly, 博客]）                                |
|     `categories`     | 文章分类（支持多级, e.g. [技术, 前端]）                                           |
| `description / desc` | 文章描述, e.g. 这是一篇关于Butterfly主题的介绍...                                 |
|       keywords       | SEO 关键词, 增强搜索引擎, 需要配置SEO搜索引擎优化                                 |
|       top_img        | 文章页顶部大图                                                                    |
|     `index_img`      | 首页文章卡片缩略图（没填通常使用top_img, 功能与cover一致, 新版本推荐用index_img） |
|       `sticky`       | 文章自定义排序（数值越大越靠前，依赖:`hexo-generator-index`）                     |
|       comments       | 是否开启评论（true/false，可覆盖全局设置）                                        |
|       password       | 单篇文章加密（不为空即加密,**依赖: `hexo-blog-encrypt`**)                         |
|   highlight_shrink   | 本文代码框默认是否折叠（true=折叠 / false=展开）                                  |
|        katex         | 是否在本页启用 KaTeX 数学公式渲染（**需主题配置按需加载**）                       |
|       mathjax        | 是否在本页启用 MathJax 数学公式渲染（**需主题配置按需加载**）                     |
|         toc          | 是否显示本文目录（可覆盖全局设置）                                                |
|      toc_number      | 目录是否显示编号（可覆盖全局设置）                                                |
|      copyright       | 是否显示文章版权声明（可覆盖全局）                                                |
|        reward        | 是否显示打赏二维码（可覆盖全局）                                                  |
|         hide         | 是否在首页/归档等列表中隐藏该文章                                                 |

> **常用组合推荐**

```markdown
---
title: 文章标题
date: 2025-01-11 23:00:00
updated: 2025-01-11 23:30:00
tags: [Butterfly, Hexo]
categories: [博客相关]
abbrlink: # 随机定义文章URL末尾字符串
index_img: https://.../cover.jpg
description: 这是一篇很棒的文章摘要，会显示在首页卡片上
sticky: 10 # 想要置顶就加这个，数字越大越靠前
password: "" # 只要有这个字段且不为空就加密
abstract: 这篇文章已被加密，需要输入密码才能查看哦~
---
```

## 全局使用

![全局使用](/img/picgo-images/image-全局使用.png)

> 通过alias将hexo命令固定

1. 编辑`.zshrc`文件: `vi ~/.zshrc`

   ```shell
   #######################################
   # 自定义命令别名
   #######################################
   # Hexo 博客快捷命令
   alias hexo='cd /Users/poco/Documents/Learning/hexo-blog && hexo'
   ```

2. 立即生效: `source ~/.zshrc`
3. 在任意目录下执行hexo命令都可以识别, 并自动进入到hexo-blog目录下.

## 导航栏自定义

![导航栏自定义](/img/picgo-images/image-导航栏自定义.png)

1. 执行命令, e.g. 新增视频模块

   ```bash
   hexo new page video
   ```

2. 新增文件`source/video/index.md`, 编辑md文件的元信息

   ```markdown
   ---
   title: 视频
   date: 2026-01-10 22:56:16
   type: "video"
   ---
   ```

3. 在`_config.butterfly.yml`添加配置项, 将video模块加载到导航栏菜单中

   ```yaml
   menu:
     视频: /video/ || fas fa-video
   ```

> P.S. 当导航栏中的模块过多时, 可以在menu中增加父级菜单, 实现导航栏下拉菜单功能.

```yaml
menu:
  # 添加父级菜单, hide默认隐藏不显示
  文章 || fas fa-book || hide:
    分类: /categories/ || fas fa-folder-open
    标签: /tags/ || fas fa-tags
    归档: /archives/ || fas fa-archive
```

效果如图:

![菜单列表](/img/picgo-images/image-导航栏下拉菜单.png)

## 文章加密功能

![文章加密](/img/picgo-images/image-文章加密.png)

1. 安装插件

   ```bash
   npm install --save hexo-blog-encrypt
   ```

2. 在 `/blog/_config.yml` 文件中添加以下内容:

   ```yaml
   # 文章加密
   encrypt:
     enable: true

   # 文章加密提示信息
   hexo-blog-encrypt:
     abstract: 这篇文章已被加密，需要输入密码才能查看哦~
     message: Hey，这篇文章被加密了，请输入密码！
     wrong_pass_message: Oh，密码错了，检查一下好吗～
   ```

3. 在想要使用加密功能的文章头部加上对应文字（仅单篇文章加密）

   ```markdown
   ---
   password: 123456
   ---
   ```

   - password: 该篇文章使用的密码
   - abstract: 摘要文字（少量）

- message: 密码框上的描述性文字

## 模块嵌入

### 视频模块

![视频模块](/img/picgo-images/视频适配.png)

> 需要视频平台支持嵌入iframe框架, e.g. Bilibili, YouTube.

1. 前往Hexo博客根目录，执行如下命令：

   ```bash
   hexo new page video
   ```

   你会找到`source/video/index.md`这个文件

2. 在`[BlogRoot]\source\css\custom.css`自定义样式的文件中引入如下代码（这是我的，你可以自行微调）：

   ```css
   /* 哔哩哔哩视频适配 */
   .aspect-ratio {
     position: relative;
     width: 90%;
     height: auto;
     padding-bottom: 75%;
     margin: 3% auto;
     text-align: center;
   }
   .aspect-ratio iframe {
     position: absolute;
     width: 100%;
     height: 86%;
     left: 0;
     top: 0;
   }
   ```

3. 直接复制插入你的 `source/video/index.md` 文章就行，修改里面的 aid 为你视频的 AV号(
   AV号获取方法，在网页版B站分享按钮最后一个选项，有个嵌入代码，复制插入md文件即可)：![image-20260110230050461](/img/picgo-images/b链接分享.png)

   ```markdown
   ---
   title: 视频
   date: 2026-01-10 22:56:16
   type: "video"
   ---

   <div align=center class="aspect-ratio">
   <iframe src="//player.bilibili.com/player.html?isOutside=true&aid=298622138&bvid=BV17F411T7Ao&cid=25761288170&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>    scrolling="no" 
       border="0" 
       frameborder="no" 
       framespacing="0" 
       high_quality=1
       danmaku=1 
       allowfullscreen="true"> 
       </iframe>
   </div>
   ```

4. 导航栏菜单中添加

   ```yaml
   menu:
     视频: /video/ || fas fa-video
   ```

5. 重启Hexo

### 音乐模块

![音乐模块](/img/picgo-images/image-音乐模块嵌入.png)

1. 创建音乐模块

   ```bash
   hexo new page music
   ```

2. 安装`hexo-tag-aplayer`插件

   ```bash
   npm install --save hexo-tag-aplayer
   ```

3. 找到项目文件夹根目录下的 `_config.yml`文件，添加如下代码：

   ```yaml
   aplayer:
     meting: true
     asset_inject: false
   ```

4. 之后打开`_config.butterfly.yml`文件，添加模块并启用插件

   ```yaml
   # 导航菜单设置
   # 说明：配置顶部导航栏的菜单项，格式为 名称: 路径 || 图标
   menu:
     音乐: /music/ || fas fa-music

   # Inject the css and script (aplayer/meting)
   aplayerInject:
     enable: true
     per_page: true
   ```

5. 编辑`source/music/index.md`文件

   ```markdown
   ---
   title: 音乐
   date: 2026-01-10 16:03:52
   type: "music"
   ---

   {% meting "17375390739" "netease" "playlist" "autoplay" "mutex:false" "listmaxheight:400px" "preload:none" "theme: #ad7a86" %}
   ```

> [MetingJS](https://github.com/metowolf/MetingJS) 是基于[Meting API](https://github.com/metowolf/Meting) 的 APlayer
> 衍生播放器，引入 MetingJS 后，播放器将支持对于 QQ音乐、网易云音乐、虾米、酷狗、百度等平台的音乐播放。

- `server`：netease（网易云音乐），tencent（QQ音乐），kugou（酷狗音乐），xiami（虾米音乐），baidu（百度音乐）。
- `type`：song（歌曲），playlist（歌单），album（专辑），search（搜索关键字），artist（歌手）。添加单曲选的歌曲，歌单选择playlist，可以自行尝试。
- id：就是在网页版上自己歌单的ID号，但是需要注意的是歌单中不能包含VIP音乐，不然无法播放。建议使用网易云音乐。

![image-20251031150929690](/img/picgo-images/网易云歌单号.png)

> 有关 `{% meting %}` 的选项列表如下:

|     选项      |   默认值   | 描述                                                        |
| :-----------: | :--------: | ----------------------------------------------------------- |
|      id       |  **必填**  | 歌曲 id / 播放列表 id / 相册 id / 搜索关键字                |
|    server     |  **必填**  | 音乐平台:`netease`, `tencent`, `kugou`, `xiami`, `baidu`    |
|     type      |  **必填**  | `song`, `playlist`, `album`, `search`, `artist`             |
|     fixed     |  `false`   | 开启固定模式                                                |
|     mini      |  `false`   | 开启迷你模式                                                |
|     loop      |   `all`    | 列表循环模式：`all`, `one`,`none`                           |
|     order     |   `list`   | 列表播放模式：`list`, `random`                              |
|    volume     |    0.7     | 播放器音量                                                  |
|    lrctype    |     0      | 歌词格式类型                                                |
|  listfolded   |  `false`   | 指定音乐播放列表是否折叠                                    |
|  storagename  | `metingjs` | LocalStorage 中存储播放器设定的键名                         |
|   autoplay    |   `true`   | 自动播放，移动端浏览器暂时不支持此功能                      |
|     mutex     |   `true`   | 该选项开启时，如果同页面有其他 aplayer 播放，该播放器会暂停 |
| listmaxheight |  `340px`   | 播放列表的最大长度                                          |
|    preload    |   `auto`   | 音乐文件预载入模式，可选项：`none`, `metadata`, `auto`      |
|     theme     | `#ad7a86`  | 播放器风格色彩设置                                          |

> 全局吸底Aplayer模式

1. 在 `_config.butterfly.yml`文件中修改如下：

   ```yaml
   inject:
     head:
     bottom:
       - <div class="aplayer no-destroy" data-id="17375390739" data-server="netease" data-type="playlist" data-fixed="true" data-autoplay="true" data-lrcType="-1"> </div>
   ```

2. 如果想切换页面时，音乐不会中断，就在`_config.butterfly.yml`文件中 pjax修改为true

   ```yaml
   pjax:
     enable: ture
     exclude:
   ```

### 照片模块

> 照片模块整理为两部分: 照片主页面, 照片详情页

1. 创建照片主页面模块

   ```bash
   hexo new page wallpaper
   ```

2. 之后打开`_config.butterfly.yml`文件，添加照片模块

   ```yaml
   menu:
     照片: /wallpaper/ || fas fa-image
   ```

3. 编辑`/wallpaper/index.md`文件

   ```markdown
   ---
   title: 照片
   date: 2026-01-11 21:56:59
   type: "wallpaper"
   ---

   <div class="gallery-group-main">
   {% galleryGroup '自然｜风景' '绝美的自然风景桌面壁纸~' '/wallpaper/nature' https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面03.png %}

   {% galleryGroup '动漫｜二次元' '动漫高清桌面壁纸~' '/wallpaper/anime' https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物07.png %}

   </div>
   ```

   > 外挂标签 `{% galleryGroup %}` 的模版: `{% galleryGroup name description link img-url %}`, 参数解释如下:
   - name：照片名称
   - description：描述信息
   - link：链接到对应相册的子页面地址
   - img-url：分类封面地址

   ![image-20260111225539596](/img/picgo-images/image-照片模块.png)

4. 创建照片模块子页面

   ```bash
   hexo new page nature
   hexo new page anime
   ```

5. 但是现在`/source/wallpaper/index.md`与`/source/nature/index.md` 是平级的，所以要将`/nature 和 /anime `整个文件夹复制到
   `/wallpaper`，这样就可以实现跳转了。(注: 不需要在`_config.butterfly.yml` 的menu中添加子页面模块)
6. 编辑子页面的index.md文件
   - `/nature`

     ```markdown
     ---
     title: 自然｜风景
     date: 2026-01-11 22:20:11
     type: "nature"
     ---

     {% gallery %}
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面01.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面02.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面03.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面04.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面05.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面06.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面07.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面08.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面09.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面10.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面11.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面12.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面13.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/文章随机封面14.png)
     {% endgallery %}
     ```

   - `/anime`

     ```markdown
     ---
     title: 动漫｜二次元
     date: 2026-01-11 22:20:21
     type: "anime"
     ---

     {% gallery %}
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物01.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物02.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物03.jpeg)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物04.jpeg)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物05.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物06.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物07.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物08.jpeg)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物09.png)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物10.jpeg)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物11.webp)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物12.jpeg)
     ![](https://cdn.jsdelivr.net/gh/koco-co/picgo-images/picgo-images/二次元人物13.png)
     {% endgallery %}
     ```

### 信笺样式留言板

![image-20260111145408897](/img/picgo-images/image-留言板.png)

> ⚠️ `不需要执行命令: hexo new page comments`

1. 在`[Blogroot]`运行指令

   ```bash
   npm install hexo-butterfly-envelope --save
   ```

2. 在`_config.butterfly.yml`添加配置项（两者任选其一）

   ```yaml
   # envelope_comment
   # see https://akilar.top/posts/e2d3c450/
   envelope_comment:
     enable: true #控制开关
     custom_pic:
       cover: https://npm.elemecdn.com/hexo-butterfly-envelope/lib/violet.jpg #信笺头部图片
       line: https://npm.elemecdn.com/hexo-butterfly-envelope/lib/line.png #信笺底部图片
       beforeimg: https://npm.elemecdn.com/hexo-butterfly-envelope/lib/before.png # 信封前半部分
       afterimg: https://npm.elemecdn.com/hexo-butterfly-envelope/lib/after.png # 信封后半部分
     message: #信笺正文，多行文本，写法如下
       - 有什么想问的？
       - 有什么想说的？
       - 有什么想吐槽的？
       - 哪怕是有什么想吃的，都可以告诉我哦~
     bottom: 自动书记人偶竭诚为您服务！ #仅支持单行文本
     height: #1050px，信封划出的高度
     path: #【可选】comments 的路径名称。默认为 comments，生成的页面为 comments/index.html
     front_matter: #【可选】comments页面的 front_matter 配置
       title: 留言板
       comments: true
   ```

3. 添加到导航栏菜单

   ```yaml
   menu:
     留言板: /comments/ || fas fa-comments
   ```

## Twikoo评论系统

> 在Butterfly主题中, 集成Twikoo评论系统, 实现评论功能.

- 有自己的服务器, 使用docker部署,
  Ref. [【docker】为 Hexo 添加评论系统 | Twikoo 的部署与使用](https://tech.yemengstar.com/docker-twikoo-for-hexo/)
- 没有服务器, 使用免费的 Vercel 部署,
  Ref. [【Vercel】Twikoo | 为你的 HEXO 加入评论系统](https://tech.yemengstar.com/?p=10456&preview=true)

## CDN替换

> 主题默认的CDN有：local、cdnjs、jsdelivr、unpkg等，但是速度比较一般，要想提高部分标准静态资源的响应速度，走CDN是最好的办法，最好是在国内的CDN。

参考教程：

1. [CSDN：Web前端常用CDN网站汇总](https://blog.csdn.net/VariatioZbw/article/details/107822562)
2. [洪哥：Butterfly CDN链接更改指南，替换jsdelivr提升访问速度](https://blog.zhheo.com/p/790087d9.html)
3. [安知鱼：目前可用cdn整理](https://anzhiy.cn/posts/fe76.html)

修改主题配置文件`_config.butterfly.yml`的`CDN`配置项：

```yaml
# CDN
# Don't modify the following settings unless you know how they work
# 非必要請不要修改
CDN:
  # The CDN provider of internal scripts (主題內部 js 的 cdn 配置)
  # option: local/jsdelivr/unpkg/cdnjs/custom
  # Dev version can only choose. ( dev版的主題只能設置為 local )
  internal_provider: local

  # The CDN provider of third party scripts (第三方 js 的 cdn 配置)
  # option: local/jsdelivr/unpkg/cdnjs/custom
  # when set it to local, you need to install hexo-butterfly-extjs
  third_party_provider: cdnjs

  # Add version number to CDN, true or false
  version: false

  # Custom format
  # For example: https://cdn.staticfile.org/${cdnjs_name}/${version}/${min_cdnjs_file}
  custom_format:

  option:
    # main_css:
    # main:
    # utils:
    # translate: https://cdn1.tianli0.top/npm/js-heo@1.0.6/translate/tw_cn.js
    # local_search:
    # algolia_js:
    algolia_search_v4: https://cdn.staticfile.org/algoliasearch/4.14.3/algoliasearch-lite.umd.min.js
    instantsearch_v4: https://cdn.staticfile.org/instantsearch.js/4.49.2/instantsearch.production.min.js
    pjax: https://lib.baomitu.com/pjax/0.2.8/pjax.min.js
    # gitalk: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/gitalk/1.7.2/gitalk.min.js
    # gitalk_css: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/gitalk/1.7.2/gitalk.min.css
    # blueimp_md5:
    # valine: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/valine/1.4.16/Valine.min.js
    # disqusjs: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/disqusjs/1.3.0/disqus.js
    # disqusjs_css: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/disqusjs/1.3.0/disqusjs.css
    twikoo: https://cdn.staticfile.org/twikoo/1.6.8/twikoo.all.min.js
    # waline_js: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/waline/1.5.4/Waline.min.js
    # waline_css:
    sharejs: https://lib.baomitu.com/social-share.js/1.0.16/js/social-share.min.js
    sharejs_css: https://lib.baomitu.com/social-share.js/1.0.16/css/share.min.css
    # mathjax: https://cdn.staticfile.org/mathjax/3.2.2/es5/mml-chtml.min.js
    # katex: https://lib.baomitu.com/KaTeX/latest/katex.min.css
    # katex_copytex:
    # mermaid:
    # canvas_ribbon:
    # canvas_fluttering_ribbon:
    # canvas_nest:
    lazyload: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/vanilla-lazyload/17.3.1/lazyload.iife.min.js
    instantpage: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/instant.page/5.1.0/instantpage.min.js
    typed: https://lf9-cdn-tos.bytecdntp.com/cdn/expire-1-M/typed.js/2.0.12/typed.min.js
    # pangu:
    fancybox_css_v4: https://cdn.staticfile.org/fancyapps-ui/4.0.31/fancybox.min.css
    fancybox_v4: https://cdn.staticfile.org/fancyapps-ui/4.0.31/fancybox.umd.min.js
    # medium_zoom: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/medium-zoom/1.0.6/medium-zoom.min.js
    # snackbar_css: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/node-snackbar/0.1.16/snackbar.min.css
    # snackbar: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/node-snackbar/0.1.16/snackbar.min.js
    # activate_power_mode:
    # fireworks:
    # click_heart:
    # ClickShowText:
    fontawesomeV6: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/font-awesome/6.0.0/css/all.min.css
    # flickr_justified_gallery_js: https://cdn.staticfile.org/flickr-justified-gallery/2.1.2/fjGallery.min.js
    # flickr_justified_gallery_css: https://cdn.staticfile.org/flickr-justified-gallery/2.1.2/fjGallery.min.css
    aplayer_css: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/aplayer/1.10.1/APlayer.min.css
    aplayer_js: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/aplayer/1.10.1/APlayer.min.js
    meting_js: https://cdn1.tianli0.top/npm/js-heo@1.0.12/metingjs/Meting.min.js
    # prismjs_js: https://cdn1.tianli0.top/npm/prismjs@1.1.0/prism.js
    # prismjs_lineNumber_js: https://cdn1.tianli0.top/npm/prismjs/plugins/line-numbers/prism-line-numbers.min.js
    # prismjs_autoloader: https://cdn1.tianli0.top/npm/prismjs/plugins/autoloader/prism-autoloader.min.js
```

修改完成后可以 `f12`->`源代码`->`网页` 看看是否已经加载到对应的资源

## SEO搜索引擎优化

> SEO 是由英文 Search Engine Optimization 缩写而来，中文意译为“搜索引擎优化”。SEO 是指通过站内优化比如网站结构调整、网站内容建设、网站代码优化等以及站外优化。

### Google

> 登录[谷歌搜索控制台](https://search.google.com/search-console/about)，添加网站

1. 有两种登录方式，推荐使用第一种
   - 第一种验证方式，选择右边网址前缀，添加域名 `https://koco-co.github.io`，选择html文件验证，将下载文件放在
     `themes/butterfly/source` 下。在 `_config.yml` 中，添加忽略编译的文件，如下：

     ```yaml
     skip_render:
       - baidu_verify_codexxxxxxxxxxxx.html
       - googlexxxxxxx.html
       - BingSitexxxxxxx.xml
     ```

   - 第二种验证方式，选择左边通过域名的dns解析，按照网页提示即可完成.

2. 点击左侧 `站点地图`，添加文件 `https://koco-co.github.io/baidusitemap.xml`，点击提交，然后看状态为 `成功` 即可。

### Bing

> 进入[必应搜索控制台](https://www.bing.com/webmasters/about)，网站验证、添加站点地图，与google收录一致。

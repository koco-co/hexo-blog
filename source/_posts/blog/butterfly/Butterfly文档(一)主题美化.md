---
title: Butterfly文档(一) 主题美化
tags:
  - Butterfly
  - Hexo
  - Theme
categories:
  - Butterfly Docs
description: >-
  Butterfly 主题美化教程，涵盖背景一图流、霓虹灯特效、透明页脚、字体设置、侧边栏美化等全方位自定义配置。
abbrlink: fed949a3
cover: /img/picgo-images/hexo-butterfly.webp
date: 2026-01-10 17:02:30
updated:
---

## 全局美化

### 背景一图流

![image-20260111121836208](/img/picgo-images/image-背景一图流.webp)

1. 在`[BlogRoot]\source`文件夹下新建一个文件夹`css`，该文件夹用于存放自定义的`css样式`，再新建一个名为`custom.css`，在里面写入以下代码：

   ```css
   /* 页脚与头图透明 */
   #footer {
     background: transparent !important;
   }
   #page-header {
     background: transparent !important;
   }

   /* 白天模式遮罩透明 */
   #footer::before {
     background: transparent !important;
   }
   #page-header::before {
     background: transparent !important;
   }

   /* 夜间模式遮罩透明 */
   [data-theme="dark"] #footer::before {
     background: transparent !important;
   }
   [data-theme="dark"] #page-header::before {
     background: transparent !important;
   }
   ```

2. 在主题配置文件`[BlogRoot]\_config.butterfly.yml`文件中的`inject`配置项的`head`子项加入以下代码，代表引入刚刚创建的`custom.css`文件

   ```yaml
   inject:
     head:
       - <link rel="stylesheet" href="/css/custom.css" media="defer" onload="this.media='all'">
   ```

3. 在主题配置文件`[BlogRoot]\_config.butterfly.yml`文件中的`index_img`和`footer_bg`配置项取消头图与页脚图的加载项避免冗余加载

   ```yaml
   # The banner image of home page
   index_img:

   # Footer Background
   footer_img: false
   ```

4. 在主题配置文件`[BlogRoot]\_config.butterfly.yml`文件中的`background`配置项设置背景图

   ```yaml
   background: url(https://source.fomal.cc/img/home_bg.webp)

   # 首页设置全部置空
   index_site_info_top:
   index_top_img_height:
   ```

### 霓虹灯特效

![image-20260111122019783](/img/picgo-images/image-黑夜霓虹灯.webp)

> 用js计时器实现的霓虹灯性能比较低，于是弄了一个纯css关键帧实现，推荐都用这个，实测性能高挺多，Pjax适配也比较友好。

1. 在自定义的`custom.css`中添加如下代码，实现的原理就是关键帧线性插值，然后一直循环，这里默认是左上角标题、中间标题和副标题，还有文章页头的标题和信息有循环霓虹灯.

   ```css
   /* 日间模式不生效 */
   [data-theme="light"] #site-name,
   [data-theme="light"] #site-title,
   [data-theme="light"] #site-subtitle,
   [data-theme="light"] #post-info {
     animation: none;
   }
   /* 夜间模式生效 */
   [data-theme="dark"] #site-name,
   [data-theme="dark"] #site-title {
     animation: light_15px 10s linear infinite;
   }
   [data-theme="dark"] #site-subtitle {
     animation: light_10px 10s linear infinite;
   }
   [data-theme="dark"] #post-info {
     animation: light_5px 10s linear infinite;
   }
   /* 关键帧描述 */
   @keyframes light_15px {
     0% {
       text-shadow: #5636ed 0 0 15px;
     }
     12.5% {
       text-shadow: #11ee5e 0 0 15px;
     }
     25% {
       text-shadow: #f14747 0 0 15px;
     }
     37.5% {
       text-shadow: #f1a247 0 0 15px;
     }
     50% {
       text-shadow: #f1ee47 0 0 15px;
     }
     50% {
       text-shadow: #b347f1 0 0 15px;
     }
     62.5% {
       text-shadow: #002afa 0 0 15px;
     }
     75% {
       text-shadow: #ed709b 0 0 15px;
     }
     87.5% {
       text-shadow: #39c5bb 0 0 15px;
     }
     100% {
       text-shadow: #5636ed 0 0 15px;
     }
   }

   @keyframes light_10px {
     0% {
       text-shadow: #5636ed 0 0 10px;
     }
     12.5% {
       text-shadow: #11ee5e 0 0 10px;
     }
     25% {
       text-shadow: #f14747 0 0 10px;
     }
     37.5% {
       text-shadow: #f1a247 0 0 10px;
     }
     50% {
       text-shadow: #f1ee47 0 0 10px;
     }
     50% {
       text-shadow: #b347f1 0 0 10px;
     }
     62.5% {
       text-shadow: #002afa 0 0 10px;
     }
     75% {
       text-shadow: #ed709b 0 0 10px;
     }
     87.5% {
       text-shadow: #39c5bb 0 0 10px;
     }
     100% {
       text-shadow: #5636ed 0 0 10px;
     }
   }

   @keyframes light_5px {
     0% {
       text-shadow: #5636ed 0 0 5px;
     }
     12.5% {
       text-shadow: #11ee5e 0 0 5px;
     }
     25% {
       text-shadow: #f14747 0 0 5px;
     }
     37.5% {
       text-shadow: #f1a247 0 0 15px;
     }
     50% {
       text-shadow: #f1ee47 0 0 5px;
     }
     50% {
       text-shadow: #b347f1 0 0 5px;
     }
     62.5% {
       text-shadow: #002afa 0 0 5px;
     }
     75% {
       text-shadow: #ed709b 0 0 5px;
     }
     87.5% {
       text-shadow: #39c5bb 0 0 5px;
     }
     100% {
       text-shadow: #5636ed 0 0 5px;
     }
   }
   ```

2. 刷新页面即可看到效果，默认是夜间模式才开启的，因为白天模式开启霓虹灯会显得很奇怪

### 流星特效

![image-20260111122102326](/img/picgo-images/image-星空背景和流星特效.webp)

1. 在`[BlogRoot]/source/js`目录下新建`universe.js`，输入以下代码：

   ```js
   function dark() {
     window.requestAnimationFrame =
       window.requestAnimationFrame ||
       window.mozRequestAnimationFrame ||
       window.webkitRequestAnimationFrame ||
       window.msRequestAnimationFrame;
     var n,
       e,
       i,
       h,
       t = 0.05,
       s = document.getElementById("universe"),
       o = !0,
       a = "180,184,240",
       r = "226,225,142",
       d = "226,225,224",
       c = [];
     function f() {
       ((n = window.innerWidth),
         (e = window.innerHeight),
         (i = 0.216 * n),
         s.setAttribute("width", n),
         s.setAttribute("height", e));
     }
     function u() {
       h.clearRect(0, 0, n, e);
       for (var t = c.length, i = 0; i < t; i++) {
         var s = c[i];
         (s.move(), s.fadeIn(), s.fadeOut(), s.draw());
       }
     }
     function y() {
       ((this.reset = function () {
         ((this.giant = m(3)),
           (this.comet = !this.giant && !o && m(10)),
           (this.x = l(0, n - 10)),
           (this.y = l(0, e)),
           (this.r = l(1.1, 2.6)),
           (this.dx =
             l(t, 6 * t) + (this.comet + 1 - 1) * t * l(50, 120) + 2 * t),
           (this.dy = -l(t, 6 * t) - (this.comet + 1 - 1) * t * l(50, 120)),
           (this.fadingOut = null),
           (this.fadingIn = !0),
           (this.opacity = 0),
           (this.opacityTresh = l(0.2, 1 - 0.4 * (this.comet + 1 - 1))),
           (this.do = l(5e-4, 0.002) + 0.001 * (this.comet + 1 - 1)));
       }),
         (this.fadeIn = function () {
           this.fadingIn &&
             ((this.fadingIn = !(this.opacity > this.opacityTresh)),
             (this.opacity += this.do));
         }),
         (this.fadeOut = function () {
           this.fadingOut &&
             ((this.fadingOut = !(this.opacity < 0)),
             (this.opacity -= this.do / 2),
             (this.x > n || this.y < 0) &&
               ((this.fadingOut = !1), this.reset()));
         }),
         (this.draw = function () {
           if ((h.beginPath(), this.giant))
             ((h.fillStyle = "rgba(" + a + "," + this.opacity + ")"),
               h.arc(this.x, this.y, 2, 0, 2 * Math.PI, !1));
           else if (this.comet) {
             ((h.fillStyle = "rgba(" + d + "," + this.opacity + ")"),
               h.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, !1));
             for (var t = 0; t < 30; t++)
               ((h.fillStyle =
                 "rgba(" +
                 d +
                 "," +
                 (this.opacity - (this.opacity / 20) * t) +
                 ")"),
                 h.rect(
                   this.x - (this.dx / 4) * t,
                   this.y - (this.dy / 4) * t - 2,
                   2,
                   2,
                 ),
                 h.fill());
           } else
             ((h.fillStyle = "rgba(" + r + "," + this.opacity + ")"),
               h.rect(this.x, this.y, this.r, this.r));
           (h.closePath(), h.fill());
         }),
         (this.move = function () {
           ((this.x += this.dx),
             (this.y += this.dy),
             !1 === this.fadingOut && this.reset(),
             (this.x > n - n / 4 || this.y < 0) && (this.fadingOut = !0));
         }),
         setTimeout(function () {
           o = !1;
         }, 50));
     }
     function m(t) {
       return Math.floor(1e3 * Math.random()) + 1 < 10 * t;
     }
     function l(t, i) {
       return Math.random() * (i - t) + t;
     }
     (f(),
       window.addEventListener("resize", f, !1),
       (function () {
         h = s.getContext("2d");
         for (var t = 0; t < i; t++) ((c[t] = new y()), c[t].reset());
         u();
       })(),
       (function t() {
         (document.getElementsByTagName("html")[0].getAttribute("data-theme") ==
           "dark" && u(),
           window.requestAnimationFrame(t));
       })());
   }
   dark();
   ```

2. 在`[BlogRoot]/source/css`目录下新建`universe.css`，输入以下代码：

   ```css
   /* 背景宇宙星光  */
   #universe {
     display: block;
     position: fixed;
     margin: 0;
     padding: 0;
     border: 0;
     outline: 0;
     left: 0;
     top: 0;
     width: 100%;
     height: 100%;
     pointer-events: none;
     /* 这个是调置顶的优先级的，-1在文章页下面，背景上面，个人推荐这种 */
     z-index: -1;
   }
   ```

3. 在主题配置文件`_config.butterfly.yml`的`inject`配置项中`bottom`下填入：

   ```yaml
   inject:
     bottom:
       - <canvas id="universe"></canvas>
       - <script defer src="/js/universe.js"></script>
   ```

4. 在主题配置文件`_config.butterfly.yml`的`inject`配置项中`head`下填入：

   ```css
   inject:
     head:
     - <link rel="stylesheet" href="/css/universe.css">
   ```

### 雪花特效

![image-20260111124409925](/img/picgo-images/image-雪花特效.webp)

1. 新建`[BlogRoot]\source\js\snow.js`，并写入以下代码，其中雪花的参数是可以自行调节的：

   ```javascript
   if (
     navigator.userAgent.match(
       /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i,
     )
   ) {
     // 移动端不显示
   } else {
     // document.write('<canvas id="snow" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:-2;pointer-events:none"></canvas>');

     window &&
       (() => {
         let e = {
           flakeCount: 50, // 雪花数目
           minDist: 150, // 最小距离
           color: "255, 255, 255", // 雪花颜色
           size: 1.5, // 雪花大小
           speed: 0.5, // 雪花速度
           opacity: 0.7, // 雪花透明度
           stepsize: 0.5, // 步距
         };
         const t =
           window.requestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function (e) {
             window.setTimeout(e, 1e3 / 60);
           };
         window.requestAnimationFrame = t;
         const i = document.getElementById("snow"),
           n = i.getContext("2d"),
           o = e.flakeCount;
         let a = -100,
           d = -100,
           s = [];
         ((i.width = window.innerWidth), (i.height = window.innerHeight));
         const h = () => {
             n.clearRect(0, 0, i.width, i.height);
             const r = e.minDist;
             for (let t = 0; t < o; t++) {
               let o = s[t];
               const h = a,
                 w = d,
                 m = o.x,
                 c = o.y,
                 p = Math.sqrt((h - m) * (h - m) + (w - c) * (w - c));
               if (p < r) {
                 const e = (h - m) / p,
                   t = (w - c) / p,
                   i = r / (p * p) / 2;
                 ((o.velX -= i * e), (o.velY -= i * t));
               } else
                 ((o.velX *= 0.98),
                   o.velY < o.speed &&
                     o.speed - o.velY > 0.01 &&
                     (o.velY += 0.01 * (o.speed - o.velY)),
                   (o.velX += Math.cos((o.step += 0.05)) * o.stepSize));
               ((n.fillStyle = "rgba(" + e.color + ", " + o.opacity + ")"),
                 (o.y += o.velY),
                 (o.x += o.velX),
                 (o.y >= i.height || o.y <= 0) && l(o),
                 (o.x >= i.width || o.x <= 0) && l(o),
                 n.beginPath(),
                 n.arc(o.x, o.y, o.size, 0, 2 * Math.PI),
                 n.fill());
             }
             t(h);
           },
           l = (e) => {
             ((e.x = Math.floor(Math.random() * i.width)),
               (e.y = 0),
               (e.size = 3 * Math.random() + 2),
               (e.speed = 1 * Math.random() + 0.5),
               (e.velY = e.speed),
               (e.velX = 0),
               (e.opacity = 0.5 * Math.random() + 0.3));
           };
         (document.addEventListener("mousemove", (e) => {
           ((a = e.clientX), (d = e.clientY));
         }),
           window.addEventListener("resize", () => {
             ((i.width = window.innerWidth), (i.height = window.innerHeight));
           }),
           (() => {
             for (let t = 0; t < o; t++) {
               const t = Math.floor(Math.random() * i.width),
                 n = Math.floor(Math.random() * i.height),
                 o = 3 * Math.random() + e.size,
                 a = 1 * Math.random() + e.speed,
                 d = 0.5 * Math.random() + e.opacity;
               s.push({
                 speed: a,
                 velX: 0,
                 velY: a,
                 x: t,
                 y: n,
                 size: o,
                 stepSize: (Math.random() / 30) * e.stepsize,
                 step: 0,
                 angle: 180,
                 opacity: d,
               });
             }
             h();
           })());
       })();
   }
   ```

2. 在自定义css文件`custom.css`写入如下代码，我这里设置只在白天模式显示，你可以自行设置，这里比较简单，本质就是调节画布的显示参数：

   ```css
   /* 雪花特效 */
   [data-theme="light"] #snow {
     display: block;
     position: fixed;
     left: 0;
     top: 0;
     width: 100%;
     height: 100%;
     pointer-events: none;
     z-index: -2;
   }

   /* 雪花黑夜模式不显示 */
   [data-theme="dark"] #snow {
     display: none;
   }
   ```

3. 引入画布元素：在主题配置文件`_config.butterfly.yml`文件的引入js文件和一个`canvas`画布：

   ```yaml
   inject:
     bottom:
   	- <canvas id="snow"></canvas> # 雪花画布
   	- <script async src="/js/snow.js"></script> # 雪花特效
   ```

4. 重启项目即可看到效果，注意：只在白天模式显示.

   ```bash
   hexo cl; hexo s
   ```

### 节日特效

> 本质就是用的`sessionStorage`这个本地存储对象去确定是不是同一个会话，如果是同一个的话，就弹窗一次，如果下次进来了就不是同一个会话了，又会弹窗一次

1. 新建`[BlogRoot]\source\js\day.js`，并写入以下代码，这里公祭日灰度我设置的为`60%`：

   ```javascript
   var d = new Date();
   m = d.getMonth() + 1;
   dd = d.getDate();
   y = d.getFullYear();

   // 公祭日
   if (m == 9 && dd == 18) {
     document
       .getElementsByTagName("html")[0]
       .setAttribute("style", "filter: grayscale(60%);");
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire(
         "今天是九一八事变" +
           (y - 1931).toString() +
           "周年纪念日\n🪔勿忘国耻，振兴中华🪔",
       );
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 7 && dd == 7) {
     document
       .getElementsByTagName("html")[0]
       .setAttribute("style", "filter: grayscale(60%);");
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire(
         "今天是卢沟桥事变" +
           (y - 1937).toString() +
           "周年纪念日\n🪔勿忘国耻，振兴中华🪔",
       );
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 12 && dd == 13) {
     document
       .getElementsByTagName("html")[0]
       .setAttribute("style", "filter: grayscale(60%);");
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire(
         "今天是南京大屠杀" +
           (y - 1937).toString() +
           "周年纪念日\n🪔勿忘国耻，振兴中华🪔",
       );
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 8 && dd == 14) {
     document
       .getElementsByTagName("html")[0]
       .setAttribute("style", "filter: grayscale(60%);");
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("今天是世界慰安妇纪念日\n🪔勿忘国耻，振兴中华🪔");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }

   // 节假日
   if (m == 10 && dd <= 3) {
     //国庆节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("祝祖国" + (y - 1949).toString() + "岁生日快乐！");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 8 && dd == 15) {
     //搞来玩的，小日子投降
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("小日子已经投降" + (y - 1945).toString() + "年了😃");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 1 && dd == 1) {
     //元旦节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire(y.toString() + "年元旦快乐！🎉");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 3 && dd == 8) {
     //妇女节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("各位女神们，妇女节快乐！👩");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   l = [
     "非常抱歉，因为不可控原因，博客将于明天停止运营！",
     "好消息，日本没了！",
     "美国垮了，原因竟然是川普！",
     "微软垮了！",
     "你的电脑已经过载，建议立即关机！",
     "你知道吗？站长很喜欢你哦！",
     "一分钟有61秒哦",
     "你喜欢的人跟别人跑了！",
   ];
   if (m == 4 && dd == 1) {
     //愚人节，随机谎话
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire(l[Math.floor(Math.random() * l.length)]);
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 5 && dd == 1) {
     //劳动节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("劳动节快乐\n为各行各业辛勤工作的人们致敬！");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 5 && dd == 4) {
     //青年节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("青年节快乐\n青春不是回忆逝去,而是把握现在！");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 5 && dd == 20) {
     //520
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("今年是520情人节\n快和你喜欢的人一起过吧！💑");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 7 && dd == 1) {
     //建党节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("祝中国共产党" + (y - 1921).toString() + "岁生日快乐！");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 9 && dd == 10) {
     //教师节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("各位老师们教师节快乐！👩‍🏫");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (m == 12 && dd == 25) {
     //圣诞节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("圣诞节快乐！🎄");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }

   //传统节日部分

   if (
     (y == 2023 && m == 4 && dd == 5) ||
     (y == 2024 && m == 4 && dd == 4) ||
     (y == 2025 && m == 4 && dd == 4)
   ) {
     //清明节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("清明时节雨纷纷,一束鲜花祭故人💐");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (
     (y == 2023 && m == 12 && dd == 22) ||
     (y == 2024 && m == 12 && dd == 21) ||
     (y == 2025 && m == 12 && dd == 21)
   ) {
     //冬至
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("冬至快乐\n快吃上一碗热热的汤圆和饺子吧🧆");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }

   var lunar = calendarFormatter.solar2lunar();

   //农历采用汉字计算，防止出现闰月导致问题

   if (
     (lunar["IMonthCn"] == "正月" && lunar["IDayCn"] == "初六") ||
     (lunar["IMonthCn"] == "正月" && lunar["IDayCn"] == "初五") ||
     (lunar["IMonthCn"] == "正月" && lunar["IDayCn"] == "初四") ||
     (lunar["IMonthCn"] == "正月" && lunar["IDayCn"] == "初三") ||
     (lunar["IMonthCn"] == "正月" && lunar["IDayCn"] == "初二") ||
     (lunar["IMonthCn"] == "正月" && lunar["IDayCn"] == "初一") ||
     (lunar["IMonthCn"] == "腊月" && lunar["IDayCn"] == "三十") ||
     (lunar["IMonthCn"] == "腊月" && lunar["IDayCn"] == "廿九")
   ) {
     //春节，本来只有大年三十到初六，但是有时候除夕是大年二十九，所以也加上了
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire(y.toString() + "年新年快乐\n🎊祝你心想事成，诸事顺利🎊");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (lunar["IMonthCn"] == "正月" && lunar["IDayCn"] == "十五") {
     //元宵节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("元宵节快乐\n送你一个大大的灯笼🧅");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (lunar["IMonthCn"] == "五月" && lunar["IDayCn"] == "初五") {
     //端午节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("端午节快乐\n请你吃一条粽子🍙");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (lunar["IMonthCn"] == "七月" && lunar["IDayCn"] == "初七") {
     //七夕节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("七夕节快乐\n黄昏后,柳梢头,牛郎织女来碰头");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (lunar["IMonthCn"] == "八月" && lunar["IDayCn"] == "十五") {
     //中秋节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("中秋节快乐\n请你吃一块月饼🍪");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }
   if (lunar["IMonthCn"] == "九月" && lunar["IDayCn"] == "初九") {
     //重阳节
     if (sessionStorage.getItem("isPopupWindow") != "1") {
       Swal.fire("重阳节快乐\n独在异乡为异客，每逢佳节倍思亲");
       sessionStorage.setItem("isPopupWindow", "1");
     }
   }

   // 切换主题提醒
   // if (y == 2022 && m == 12 && (dd >= 18 && dd <= 20)) {
   //     if (sessionStorage.getItem("isPopupWindow") != "1") {
   //         Swal.fire("网站换成冬日限定主题啦⛄");
   //         sessionStorage.setItem("isPopupWindow", "1");
   //     }
   // }
   ```

2. 由于有的节日是农历的，因此还要引入一个计算农历的代码，新建`[BlogRoot]\source\js\lunar.js`，并写入以下代码，太长了压缩了一下：

   ```javascript
   var lunarInfo = [
       19416, 19168, 42352, 21717, 53856, 55632, 91476, 22176, 39632, 21970,
       19168, 42422, 42192, 53840, 119381, 46400, 54944, 44450, 38320, 84343,
       18800, 42160, 46261, 27216, 27968, 109396, 11104, 38256, 21234, 18800,
       25958, 54432, 59984, 28309, 23248, 11104, 100067, 37600, 116951, 51536,
       54432, 120998, 46416, 22176, 107956, 9680, 37584, 53938, 43344, 46423,
       27808, 46416, 86869, 19872, 42416, 83315, 21168, 43432, 59728, 27296,
       44710, 43856, 19296, 43748, 42352, 21088, 62051, 55632, 23383, 22176,
       38608, 19925, 19152, 42192, 54484, 53840, 54616, 46400, 46752, 103846,
       38320, 18864, 43380, 42160, 45690, 27216, 27968, 44870, 43872, 38256,
       19189, 18800, 25776, 29859, 59984, 27480, 23232, 43872, 38613, 37600,
       51552, 55636, 54432, 55888, 30034, 22176, 43959, 9680, 37584, 51893,
       43344, 46240, 47780, 44368, 21977, 19360, 42416, 86390, 21168, 43312,
       31060, 27296, 44368, 23378, 19296, 42726, 42208, 53856, 60005, 54576,
       23200, 30371, 38608, 19195, 19152, 42192, 118966, 53840, 54560, 56645,
       46496, 22224, 21938, 18864, 42359, 42160, 43600, 111189, 27936, 44448,
       84835, 37744, 18936, 18800, 25776, 92326, 59984, 27424, 108228, 43744,
       41696, 53987, 51552, 54615, 54432, 55888, 23893, 22176, 42704, 21972,
       21200, 43448, 43344, 46240, 46758, 44368, 21920, 43940, 42416, 21168,
       45683, 26928, 29495, 27296, 44368, 84821, 19296, 42352, 21732, 53600,
       59752, 54560, 55968, 92838, 22224, 19168, 43476, 41680, 53584, 62034,
       54560,
     ],
     solarMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
     Gan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
     Zhi = [
       "子",
       "丑",
       "寅",
       "卯",
       "辰",
       "巳",
       "午",
       "未",
       "申",
       "酉",
       "戌",
       "亥",
     ],
     Animals = [
       "鼠",
       "牛",
       "虎",
       "兔",
       "龙",
       "蛇",
       "马",
       "羊",
       "猴",
       "鸡",
       "狗",
       "猪",
     ],
     solarTerm = [
       "小寒",
       "大寒",
       "立春",
       "雨水",
       "惊蛰",
       "春分",
       "清明",
       "谷雨",
       "立夏",
       "小满",
       "芒种",
       "夏至",
       "小暑",
       "大暑",
       "立秋",
       "处暑",
       "白露",
       "秋分",
       "寒露",
       "霜降",
       "立冬",
       "小雪",
       "大雪",
       "冬至",
     ],
     sTermInfo = [
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c3598082c95f8c965cc920f",
       "97bd0b06bdb0722c965ce1cfcc920f",
       "b027097bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c359801ec95f8c965cc920f",
       "97bd0b06bdb0722c965ce1cfcc920f",
       "b027097bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c359801ec95f8c965cc920f",
       "97bd0b06bdb0722c965ce1cfcc920f",
       "b027097bd097c36b0b6fc9274c91aa",
       "9778397bd19801ec9210c965cc920e",
       "97b6b97bd19801ec95f8c965cc920f",
       "97bd09801d98082c95f8e1cfcc920f",
       "97bd097bd097c36b0b6fc9210c8dc2",
       "9778397bd197c36c9210c9274c91aa",
       "97b6b97bd19801ec95f8c965cc920e",
       "97bd09801d98082c95f8e1cfcc920f",
       "97bd097bd097c36b0b6fc9210c8dc2",
       "9778397bd097c36c9210c9274c91aa",
       "97b6b97bd19801ec95f8c965cc920e",
       "97bcf97c3598082c95f8e1cfcc920f",
       "97bd097bd097c36b0b6fc9210c8dc2",
       "9778397bd097c36c9210c9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c3598082c95f8c965cc920f",
       "97bd097bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c3598082c95f8c965cc920f",
       "97bd097bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c359801ec95f8c965cc920f",
       "97bd097bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c359801ec95f8c965cc920f",
       "97bd097bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf97c359801ec95f8c965cc920f",
       "97bd097bd07f595b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9210c8dc2",
       "9778397bd19801ec9210c9274c920e",
       "97b6b97bd19801ec95f8c965cc920f",
       "97bd07f5307f595b0b0bc920fb0722",
       "7f0e397bd097c36b0b6fc9210c8dc2",
       "9778397bd097c36c9210c9274c920e",
       "97b6b97bd19801ec95f8c965cc920f",
       "97bd07f5307f595b0b0bc920fb0722",
       "7f0e397bd097c36b0b6fc9210c8dc2",
       "9778397bd097c36c9210c9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bd07f1487f595b0b0bc920fb0722",
       "7f0e397bd097c36b0b6fc9210c8dc2",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf7f1487f595b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf7f1487f595b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf7f1487f531b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c965cc920e",
       "97bcf7f1487f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b97bd19801ec9210c9274c920e",
       "97bcf7f0e47f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "9778397bd097c36b0b6fc9210c91aa",
       "97b6b97bd197c36c9210c9274c920e",
       "97bcf7f0e47f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "9778397bd097c36b0b6fc9210c8dc2",
       "9778397bd097c36c9210c9274c920e",
       "97b6b7f0e47f531b0723b0b6fb0722",
       "7f0e37f5307f595b0b0bc920fb0722",
       "7f0e397bd097c36b0b6fc9210c8dc2",
       "9778397bd097c36b0b70c9274c91aa",
       "97b6b7f0e47f531b0723b0b6fb0721",
       "7f0e37f1487f595b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc9210c8dc2",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f595b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "9778397bd097c36b0b6fc9274c91aa",
       "97b6b7f0e47f531b0723b0787b0721",
       "7f0e27f0e47f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "9778397bd097c36b0b6fc9210c91aa",
       "97b6b7f0e47f149b0723b0787b0721",
       "7f0e27f0e47f531b0723b0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "9778397bd097c36b0b6fc9210c8dc2",
       "977837f0e37f149b0723b0787b0721",
       "7f07e7f0e47f531b0723b0b6fb0722",
       "7f0e37f5307f595b0b0bc920fb0722",
       "7f0e397bd097c35b0b6fc9210c8dc2",
       "977837f0e37f14998082b0787b0721",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e37f1487f595b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc9210c8dc2",
       "977837f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "977837f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e397bd097c35b0b6fc920fb0722",
       "977837f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "977837f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "977837f0e37f14998082b0787b06bd",
       "7f07e7f0e47f149b0723b0787b0721",
       "7f0e27f0e47f531b0b0bb0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "977837f0e37f14998082b0723b06bd",
       "7f07e7f0e37f149b0723b0787b0721",
       "7f0e27f0e47f531b0723b0b6fb0722",
       "7f0e397bd07f595b0b0bc920fb0722",
       "977837f0e37f14898082b0723b02d5",
       "7ec967f0e37f14998082b0787b0721",
       "7f07e7f0e47f531b0723b0b6fb0722",
       "7f0e37f1487f595b0b0bb0b6fb0722",
       "7f0e37f0e37f14898082b0723b02d5",
       "7ec967f0e37f14998082b0787b0721",
       "7f07e7f0e47f531b0723b0b6fb0722",
       "7f0e37f1487f531b0b0bb0b6fb0722",
       "7f0e37f0e37f14898082b0723b02d5",
       "7ec967f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e37f1487f531b0b0bb0b6fb0722",
       "7f0e37f0e37f14898082b072297c35",
       "7ec967f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e37f0e37f14898082b072297c35",
       "7ec967f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e37f0e366aa89801eb072297c35",
       "7ec967f0e37f14998082b0787b06bd",
       "7f07e7f0e47f149b0723b0787b0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
       "7f0e37f0e366aa89801eb072297c35",
       "7ec967f0e37f14998082b0723b06bd",
       "7f07e7f0e47f149b0723b0787b0721",
       "7f0e27f0e47f531b0723b0b6fb0722",
       "7f0e37f0e366aa89801eb072297c35",
       "7ec967f0e37f14998082b0723b06bd",
       "7f07e7f0e37f14998083b0787b0721",
       "7f0e27f0e47f531b0723b0b6fb0722",
       "7f0e37f0e366aa89801eb072297c35",
       "7ec967f0e37f14898082b0723b02d5",
       "7f07e7f0e37f14998082b0787b0721",
       "7f07e7f0e47f531b0723b0b6fb0722",
       "7f0e36665b66aa89801e9808297c35",
       "665f67f0e37f14898082b0723b02d5",
       "7ec967f0e37f14998082b0787b0721",
       "7f07e7f0e47f531b0723b0b6fb0722",
       "7f0e36665b66a449801e9808297c35",
       "665f67f0e37f14898082b0723b02d5",
       "7ec967f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e36665b66a449801e9808297c35",
       "665f67f0e37f14898082b072297c35",
       "7ec967f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e26665b66a449801e9808297c35",
       "665f67f0e37f1489801eb072297c35",
       "7ec967f0e37f14998082b0787b06bd",
       "7f07e7f0e47f531b0723b0b6fb0721",
       "7f0e27f1487f531b0b0bb0b6fb0722",
     ],
     nStr1 = ["日", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"],
     nStr2 = ["初", "十", "廿", "卅"],
     nStr3 = [
       "正",
       "二",
       "三",
       "四",
       "五",
       "六",
       "七",
       "八",
       "九",
       "十",
       "冬",
       "腊",
     ];
   function lYearDays(b) {
     var f,
       c = 348;
     for (f = 32768; f > 8; f >>= 1) c += lunarInfo[b - 1900] & f ? 1 : 0;
     return c + leapDays(b);
   }
   function leapMonth(b) {
     return 15 & lunarInfo[b - 1900];
   }
   function leapDays(b) {
     return leapMonth(b) ? (65536 & lunarInfo[b - 1900] ? 30 : 29) : 0;
   }
   function monthDays(b, f) {
     return f > 12 || f < 1 ? -1 : lunarInfo[b - 1900] & (65536 >> f) ? 30 : 29;
   }
   function solarDays(b, f) {
     if (f > 12 || f < 1) return -1;
     var c = f - 1;
     return 1 === c
       ? (b % 4 == 0 && b % 100 != 0) || b % 400 == 0
         ? 29
         : 28
       : solarMonth[c];
   }
   function toGanZhiYear(b) {
     var f = (b - 3) % 10,
       c = (b - 3) % 12;
     return (0 === f && (f = 10), 0 === c && (c = 12), Gan[f - 1] + Zhi[c - 1]);
   }
   function toAstro(b, f) {
     return (
       "魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯".substr(
         2 * b -
           (f < [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 22, 22][b - 1]
             ? 2
             : 0),
         2,
       ) + "座"
     );
   }
   function toGanZhi(b) {
     return Gan[b % 10] + Zhi[b % 12];
   }
   function getTerm(b, f) {
     if (b < 1900 || b > 2100) return -1;
     if (f < 1 || f > 24) return -1;
     var c = sTermInfo[b - 1900],
       e = [
         parseInt("0x" + c.substr(0, 5)).toString(),
         parseInt("0x" + c.substr(5, 5)).toString(),
         parseInt("0x" + c.substr(10, 5)).toString(),
         parseInt("0x" + c.substr(15, 5)).toString(),
         parseInt("0x" + c.substr(20, 5)).toString(),
         parseInt("0x" + c.substr(25, 5)).toString(),
       ],
       a = [
         e[0].substr(0, 1),
         e[0].substr(1, 2),
         e[0].substr(3, 1),
         e[0].substr(4, 2),
         e[1].substr(0, 1),
         e[1].substr(1, 2),
         e[1].substr(3, 1),
         e[1].substr(4, 2),
         e[2].substr(0, 1),
         e[2].substr(1, 2),
         e[2].substr(3, 1),
         e[2].substr(4, 2),
         e[3].substr(0, 1),
         e[3].substr(1, 2),
         e[3].substr(3, 1),
         e[3].substr(4, 2),
         e[4].substr(0, 1),
         e[4].substr(1, 2),
         e[4].substr(3, 1),
         e[4].substr(4, 2),
         e[5].substr(0, 1),
         e[5].substr(1, 2),
         e[5].substr(3, 1),
         e[5].substr(4, 2),
       ];
     return parseInt(a[f - 1]);
   }
   function toChinaMonth(b) {
     if (b > 12 || b < 1) return -1;
     var f = nStr3[b - 1];
     return (f += "月");
   }
   function toChinaDay(b) {
     var f;
     switch (b) {
       case 10:
         f = "初十";
         break;
       case 20:
         f = "二十";
         break;
       case 30:
         f = "三十";
         break;
       default:
         ((f = nStr2[Math.floor(b / 10)]), (f += nStr1[b % 10]));
     }
     return f;
   }
   function getAnimal(b) {
     return Animals[(b - 4) % 12];
   }
   function solar2lunar(b, f, c) {
     if (b < 1900 || b > 2100) return -1;
     if (1900 === b && 1 === f && c < 31) return -1;
     var e,
       a,
       r = null,
       t = 0;
     ((b = (r = b
       ? new Date(b, parseInt(f) - 1, c)
       : new Date()).getFullYear()),
       (f = r.getMonth() + 1),
       (c = r.getDate()));
     var d =
       (Date.UTC(r.getFullYear(), r.getMonth(), r.getDate()) -
         Date.UTC(1900, 0, 31)) /
       864e5;
     for (e = 1900; e < 2101 && d > 0; e++) d -= t = lYearDays(e);
     d < 0 && ((d += t), e--);
     var n = new Date(),
       s = !1;
     n.getFullYear() === b &&
       n.getMonth() + 1 === f &&
       n.getDate() === c &&
       (s = !0);
     var u = r.getDay(),
       o = nStr1[u];
     0 === u && (u = 7);
     var l = e;
     a = leapMonth(e);
     var i = !1;
     for (e = 1; e < 13 && d > 0; e++)
       (a > 0 && e === a + 1 && !1 === i
         ? (--e, (i = !0), (t = leapDays(l)))
         : (t = monthDays(l, e)),
         !0 === i && e === a + 1 && (i = !1),
         (d -= t));
     (0 === d && a > 0 && e === a + 1 && (i ? (i = !1) : ((i = !0), --e)),
       d < 0 && ((d += t), --e));
     var h = e,
       D = d + 1,
       g = f - 1,
       v = toGanZhiYear(l),
       y = getTerm(b, 2 * f - 1),
       m = getTerm(b, 2 * f),
       p = toGanZhi(12 * (b - 1900) + f + 11);
     c >= y && (p = toGanZhi(12 * (b - 1900) + f + 12));
     var M = !1,
       T = null;
     (y === c && ((M = !0), (T = solarTerm[2 * f - 2])),
       m === c && ((M = !0), (T = solarTerm[2 * f - 1])));
     var I = toGanZhi(
         Date.UTC(b, g, 1, 0, 0, 0, 0) / 864e5 + 25567 + 10 + c - 1,
       ),
       C = toAstro(f, c);
     return {
       lYear: l,
       lMonth: h,
       lDay: D,
       Animal: getAnimal(l),
       IMonthCn: (i ? "闰" : "") + toChinaMonth(h),
       IDayCn: toChinaDay(D),
       cYear: b,
       cMonth: f,
       cDay: c,
       gzYear: v,
       gzMonth: p,
       gzDay: I,
       isToday: s,
       isLeap: i,
       nWeek: u,
       ncWeek: "星期" + o,
       isTerm: M,
       Term: T,
       astro: C,
     };
   }
   var calendarFormatter = {
     solar2lunar: function (b, f, c) {
       return solar2lunar(b, f, c);
     },
     lunar2solar: function (b, f, c, e) {
       if ((e = !!e) && leapMonth !== f) return -1;
       if (
         (2100 === b && 12 === f && c > 1) ||
         (1900 === b && 1 === f && c < 31)
       )
         return -1;
       var a = monthDays(b, f),
         r = a;
       if ((e && (r = leapDays(b, f)), b < 1900 || b > 2100 || c > r))
         return -1;
       for (var t = 0, d = 1900; d < b; d++) t += lYearDays(d);
       var n = 0,
         s = !1;
       for (d = 1; d < f; d++)
         ((n = leapMonth(b)),
           s || (n <= d && n > 0 && ((t += leapDays(b)), (s = !0))),
           (t += monthDays(b, d)));
       e && (t += a);
       var u = Date.UTC(1900, 1, 30, 0, 0, 0),
         o = new Date(864e5 * (t + c - 31) + u);
       return solar2lunar(
         o.getUTCFullYear(),
         o.getUTCMonth() + 1,
         o.getUTCDate(),
       );
     },
   };
   ```

3. 引入以下以上两个js文件和一个弹窗依赖（注意顺序不能颠倒）：

   ```yaml
   inject:
     bottom:
       - <script defer type="text/javascript" src="https://cdn1.tianli0.top/npm/sweetalert2@8.19.0/dist/sweetalert2.all.js"></script> # 节日弹窗依赖
       - <script defer src="/js/lunar.js"></script> # 农历计算
       - <script defer src="/js/day.js"></script> # 节日弹窗
   ```

4. 重启项目，如果是日子对了自动会有弹窗的

   ```bash
   hexo cl; hexo s
   ```

### 全局卡片

![image-20260110180843760](/img/picgo-images/页面亚克力效果.webp)

> 通过css样式调节各个页面`透明度、模糊度（亚克力效果）、圆角、边框样式`等，看起来会更加舒适。

1. 复制以下代码进去自定义的`custom.css`文件

   ```css
   :root {
     /* ⚠️ 第四个参数0.8 就是调整全局卡片透明度的参数 */
     --trans-light: rgba(255, 255, 255, 0.8);
     --trans-dark: rgba(25, 25, 25, 0.8);
     --border-style: 1px solid rgb(169, 169, 169);
     --backdrop-filter: blur(5px) saturate(150%);
   }

   /* 首页文章卡片 */
   #recent-posts > .recent-post-item {
     background: var(--trans-light);
     backdrop-filter: var(--backdrop-filter);
     border-radius: 25px;
     border: var(--border-style);
   }

   /* 首页侧栏卡片 */
   #aside-content .card-widget {
     background: var(--trans-light);
     backdrop-filter: var(--backdrop-filter);
     border-radius: 18px;
     border: var(--border-style);
   }

   /* 文章页、归档页、普通页面 */
   div#post,
   div#page,
   div#archive {
     background: var(--trans-light);
     backdrop-filter: var(--backdrop-filter);
     border: var(--border-style);
     border-radius: 20px;
   }

   /* 导航栏 */
   #page-header.nav-fixed #nav {
     background: rgba(255, 255, 255, 0.75);
     backdrop-filter: var(--backdrop-filter);
   }

   [data-theme="dark"] #page-header.nav-fixed #nav {
     background: rgba(0, 0, 0, 0.7) !important;
   }

   /* 夜间模式遮罩 */
   [data-theme="dark"] #recent-posts > .recent-post-item,
   [data-theme="dark"] #aside-content .card-widget,
   [data-theme="dark"] div#post,
   [data-theme="dark"] div#archive,
   [data-theme="dark"] div#page {
     background: var(--trans-dark);
   }

   /* 夜间模式页脚页头遮罩透明 */
   [data-theme="dark"] #footer::before {
     background: transparent !important;
   }
   [data-theme="dark"] #page-header::before {
     background: transparent !important;
   }

   /* 阅读模式 */
   .read-mode #aside-content .card-widget {
     background: rgba(158, 204, 171, 0.5) !important;
   }
   .read-mode div#post {
     background: rgba(158, 204, 171, 0.5) !important;
   }

   /* 夜间模式下的阅读模式 */
   [data-theme="dark"] .read-mode #aside-content .card-widget {
     background: rgba(25, 25, 25, 0.9) !important;
     color: #ffffff;
   }
   [data-theme="dark"] .read-mode div#post {
     background: rgba(25, 25, 25, 0.9) !important;
     color: #ffffff;
   }
   ```

2. 参数说明：
   - `--trans-light`：白天模式带透明度的背景色，如`rgba(255, 255, 255, 0.88)`底色是纯白色，其中0.88就透明度，在0-1之间调节，值越大越不透明；

   - `--trans-dark`: 夜间模式带透明度的背景色，如`rgba(25, 25, 25, 0.88)`底色是柔和黑色，其中0.88就透明度，在0-1之间调节，值越大越不透明;

   - `--border-style`: 边框样式，`1px solid rgb(169, 169, 169)`指宽度为1px的灰色实体边框;

   - `--backdrop-filter`: 背景过滤器，如`blur(5px) saturate(150%)`表示饱和度为150%的、高斯模糊半径为5px的过滤器，这是亚克力效果的一种实现方法;

3. 记住在主题配置文件`_config.butterfly.yml`的`inject`配置项中引入该css文件：

   ```css
   inject:
     head:
   	- <link rel="stylesheet" href="/css/custom.css">
   ```

4. 重启项目即可看见效果：

   ```bash
   hexo cl; hexo s
   ```

### 三栏布局（旧版）

> Ref. https://akilar.top/posts/d6b69c49/
>
> 本网站采用的是三栏+响应式布局的方案，也就是`slidecard`的方案，但是为了可拓展性，我还是把两种都搬了过来，方便大家阅读！

效果预览

1. 修改`[BlogRoot]\themes\butterfly\layout\includes\mixins\post-ui.pug`,整个替换为下面的代码，注意，我这里用的是彩色的图标，每个`//- i.fas`那里表示我注释了黑白的额图标并换上彩色图标，彩色图标引入的具体方法见之前的教程，这里只需要替换成你自己的`图标名字`和调节相应的`大小`即可：

   ```pug
   mixin postUI(posts)
     each article , index in page.posts.data
       .recent-post-item
         -
           let link = article.link || article.path
           let title = article.title || _p('no_title')
           const position = theme.cover.position
           let leftOrRight = position === 'both'
             ? index%2 == 0 ? 'left' : 'right'
             : position === 'left' ? 'left' : 'right'
           let post_cover = article.cover
           let no_cover = article.cover === false || !theme.cover.index_enable ? 'no-cover' : ''
         -
         .recent-post-content(class=leftOrRight)
           .recent-post-cover
             img.article-cover(src=url_for(post_cover) onerror=`this.onerror=null;this.src='`+ url_for(theme.error_img.post_page) + `'` alt=title)
           .recent-post-info
             a.article-title(href=url_for(link) title=title)
               .article-title-link= title
             .recent-post-meta
               .article-meta-wrap
                 if (is_home() && (article.top || article.sticky > 0))
                   span.article-meta
                     //- i.fas.fa-thumbtack.sticky
                     svg.meta_icon(style="width:16px;height:16px;position:relative;top:3px").post-ui-icon
                       use(xlink:href='#icon-tuding')
                     span.sticky= _p('sticky')
                     span.article-meta-separator  |
                 if (theme.post_meta.page.date_type)
                   span.post-meta-date
                     if (theme.post_meta.page.date_type === 'both')
                       //- i.far.fa-calendar-alt
                       svg.meta_icon(style="width:21px;height:21px;position:relative;top:6px").post-ui-icon
                         use(xlink:href='#icon-rili')
                       span.article-meta-label=_p('post.created')
                       time.post-meta-date-created(datetime=date_xml(article.date) title=_p('post.created') + ' ' + full_date(article.date))=date(article.date, config.date_format)
                       span.article-meta-separator  |
                       //- i.fas.fa-history
                       svg.meta_icon(style="width:13px;height:13px;position:relative;top:2px").post-ui-icon
                         use(xlink:href='#icon-gengxin1')
                       span.article-meta-label=_p('post.updated') + " "
                       time.post-meta-date-updated(datetime=date_xml(article.updated) title=_p('post.updated') + ' ' + full_date(article.updated))=date(article.updated, config.date_format)
                     else
                       - let data_type_updated = theme.post_meta.page.date_type === 'updated'
                       - let date_type = data_type_updated ? 'updated' : 'date'
                       - let date_icon = data_type_updated ? 'fas fa-history' :'far fa-calendar-alt'
                       - let date_title = data_type_updated ? _p('post.updated') : _p('post.created')
                       i(class=date_icon)
                       span.article-meta-label=date_title
                       time(datetime=date_xml(article[date_type]) title=date_title + ' ' + full_date(article[date_type]))=date(article[date_type], config.date_format)
                 if (theme.post_meta.page.categories && article.categories.data.length > 0)
                   span.article-meta
                     span.article-meta-separator  |
                     //- i.fas.fa-inbox
                     svg.meta_icon(style="width:12px;height:12px;position:relative;top:1px").post-ui-icon
                       use(xlink:href='#icon-fenlei')
                     each item, index in article.categories.data
                       a(href=url_for(item.path)).article-meta__categories #[=item.name]
                       if (index < article.categories.data.length - 1)
                         i.fas.fa-angle-right.article-meta-link
                 if (theme.post_meta.page.tags && article.tags.data.length > 0)
                   span.article-meta.tags
                     span.article-meta-separator  |
                     //- i.fas.fa-tag
                     svg.meta_icon(style="width:13px;height:13px;position:relative;top:2px").post-ui-icon
                       use(xlink:href='#icon-biaoqian')
                     each item, index in article.tags.data
                       a(href=url_for(item.path)).article-meta__tags #[=item.name]
                       if (index < article.tags.data.length - 1)
                         span.article-meta-link #[=' • ']

                 mixin countBlockInIndex
                   - needLoadCountJs = true
                   span.article-meta
                     span.article-meta-separator  |
                     //- i.fas.fa-comments
                     svg.meta_icon(style="width:13px;height:13px;position:relative;top:2px").post-ui-icon
                       use(xlink:href='#icon-pinglun1')
                     if block
                       block
                     span.article-meta-label= ' ' + _p('card_post_count')

                 if theme.comments.card_post_count
                   case theme.comments.use[0]
                     when 'Disqus'
                       +countBlockInIndex
                         a(href=full_url_for(link) + '#disqus_thread')
                           i.fa-solid.fa-spinner.fa-spin
                     when 'Disqusjs'
                       +countBlockInIndex
                         a(href=full_url_for(link) + '#disqusjs')
                           span.disqus-comment-count(data-disqus-url=full_url_for(link))
                             i.fa-solid.fa-spinner.fa-spin
                     when 'Valine'
                       +countBlockInIndex
                         a(href=url_for(link) + '#post-comment')
                           span.valine-comment-count(data-xid=url_for(link))
                             i.fa-solid.fa-spinner.fa-spin
                     when 'Waline'
                       +countBlockInIndex
                         a(href=url_for(link) + '#post-comment')
                           span.waline-comment-count(id=url_for(link))
                             i.fa-solid.fa-spinner.fa-spin
                     when 'Twikoo'
                       +countBlockInIndex
                         a.twikoo-count(href=url_for(link) + '#post-comment')
                           i.fa-solid.fa-spinner.fa-spin
                     when 'Facebook Comments'
                       +countBlockInIndex
                         a(href=url_for(link) + '#post-comment')
                           span.fb-comments-count(data-href=urlNoIndex(article.permalink))
                     when 'Remark42'
                       +countBlockInIndex
                         a(href=url_for(link) + '#post-comment')
                           span.remark42__counter(data-url=urlNoIndex(article.permalink))
                             i.fa-solid.fa-spinner.fa-spin
                     when 'Artalk'
                       +countBlockInIndex
                         a(href=url_for(link) + '#post-comment')
                           span.artalk-count(data-page-key=url_for(link))
                             i.fa-solid.fa-spinner.fa-spin
           a.article-content(href=url_for(link) title=title)
             //- Display the article introduction on homepage
             case theme.index_post_content.method
               when false
                 - break
               when 1
                 .article-content-text!= article.description
               when 2
                 if article.description
                   .article-content-text!= article.description
                 else
                   - const content = strip_html(article.content)
                   - let expert = content.substring(0, theme.index_post_content.length)
                   - content.length > theme.index_post_content.length ? expert += ' ...' : ''
                   .article-content-text!= expert
               default
                 - const content = strip_html(article.content)
                 - let expert = content.substring(0, theme.index_post_content.length)
                 - content.length > theme.index_post_content.length ? expert += ' ...' : ''
                 .article-content-text!= expert
           .recent-post-arrow

       if theme.ad && theme.ad.index
         if (index + 1) % 3 == 0
           .recent-post-item.ads-wrap!=theme.ad.index
   ```

2. 样式方案提供两种：
   - 样式一：电脑端宽屏采用滑动卡片，平板宽度采用双栏布局，手机宽度采用单栏卡片
   - 样式二：移除滑动卡片，按屏幕宽度依次应用三栏、双栏、单栏

   新建目录`[BlogRoot]\themes\butterfly\source\css\_index_card_style\`,并在下面新建对应的文件`slidecard.styl`和`multicard.styl`并分别填入以下内容：
   - 样式一:slidecard

   ```stylus
   //default color:
   :root
     --recent-post-bgcolor: rgba(255, 255, 255, 0.9)  //默认背景
     --article-content-bgcolor: #49b1f5 //描述版块背景
     --recent-post-arrow: #ffffff //箭头配色
     --recent-post-cover-shadow: #ffffff //封面遮罩层配色，建议和默认值的颜色相对应。
     --recent-post-transition: all 0.5s cubic-bezier(0.59, 0.01, 0.48, 1.17)  //动画效果。不了解的不要改动
   [data-theme="dark"]
     --recent-post-bgcolor: rgba(35,35,35,0.5)
     --article-content-bgcolor: #99999a
     --recent-post-arrow: #37e2dd
     --recent-post-cover-shadow: #232323
   // 默认的首页卡片容器布局
   .recent-posts
     padding 0 15px 0 15px
     height fit-content
     .recent-post-item
       margin-bottom 15px
       width 100%
       background var(--recent-post-bgcolor)
       overflow hidden
       border-radius 15px
       .recent-post-content
         display flex
         background var(--recent-post-bgcolor)
         position relative
         .recent-post-cover
           display flex
           background transparent
         .recent-post-info
           display flex
           background transparent
           flex-direction column
           justify-content center
           align-items center
           .article-title
             height 50%
             display: flex
             text-align: center
             align-items: center
             justify-content: flex-end
             flex-direction: column
             .article-title-link
               color: var(--text-highlight-color)
               transition: all .2s ease-in-out
               display: -webkit-box;
               -webkit-box-orient: vertical;
               overflow: hidden;
               &:hover
                 color: $text-hover
           .recent-post-meta
             height 50%
             display: flex
             text-align: center
             align-items: center
             justify-content: flex-start
             flex-direction: column
             .article-meta-wrap
               color #969797
               display: -webkit-box;
               -webkit-box-orient: vertical;
               overflow: hidden;
               a
                 color: var(--text-highlight-color)
                 transition: all .2s ease-in-out
                 color #969797
                 &:hover
                   color: $text-hover
         .article-content
           display flex
           text-align: center
           flex-direction row
           align-items center
           justify-content center
           .article-content-text
             display -webkit-box
             -webkit-box-orient vertical
             text-overflow: ellipsis
             overflow hidden
             color #fff
             text-shadow 1px 2px 3px #000
             &::before
               content "❝"
               font-size 20px
             &::after
               content "❞"
               font-size 20px
       &.ads-wrap
         display: block !important
         height: auto !important
   // PC端滑动卡片样式
   @media screen and (min-width:1069px)
     .recent-posts
       padding 0 15px 0 15px
       .recent-post-item
         .recent-post-content
           position relative
           height 200px
           width 100%
           transition var(--recent-post-transition)
           &:hover
             .recent-post-cover-shadow
               width 10.1%
               transition var(--recent-post-transition)
             .recent-post-cover
               width 10%
               transition var(--recent-post-transition)
             .article-content
               width calc(30% + 80px)
               transition var(--recent-post-transition)
               .article-content-text
                 opacity 1
             .recent-post-arrow
               transition var(--recent-post-transition)
           .recent-post-cover-shadow
             z-index: 1
             transition var(--recent-post-transition)
             position: absolute
             height 200px
             width 40%
           .recent-post-cover
             height 200px
             width 40%
             transition var(--recent-post-transition)
             img
               height 100%
               width 100%
               object-fit cover

           .recent-post-info
             height 200px
             width calc(60% - 80px)
             .article-title
               margin: 0px 40px
               font-size 24px
               .article-title-link
                 -webkit-line-clamp: 2;
             .recent-post-meta
               margin: 0px 20px
               .article-meta-wrap
                 font-size 12px
                 -webkit-line-clamp: 3;
           .article-content
             height 200px
             width 90px
             background var(--article-content-bgcolor)
             transition var(--recent-post-transition)
             .article-content-text
               -webkit-line-clamp 4
               transition: var(--recent-post-transition)
               opacity 0
           .recent-post-arrow
             transition var(--recent-post-transition)
             display block
             position absolute
             height 20px
             width 8px
             background var(--recent-post-arrow)
           &.both,
           &.right
             .recent-post-cover-shadow
               left 0
               background linear-gradient(to left, var(--recent-post-cover-shadow), transparent)
             .recent-post-cover
               order: 1
             .recent-post-info
               order: 2
             .article-content
               order: 3
               clip-path polygon(0 50%, 80px 0, 100% 0, 100% 100%, 80px 100%)
               .article-content-text
                 margin 20px 40px 20px 80px
             .recent-post-arrow
               order: 4
               left calc(100% - 80px)
               top calc(50% - 10px)
               clip-path polygon(0 10px, 8px 0, 8px 20px)
             &:hover
               .recent-post-arrow
                 left calc(100% - 40px)
           &.left
             .recent-post-cover-shadow
               right 0
               background linear-gradient(to right, var(--recent-post-cover-shadow), transparent)
             .recent-post-cover
               order: 4
             .recent-post-info
               order: 3
             .article-content
               order: 2
               clip-path polygon(100% 50%,calc(100% - 80px) 100%,0 100%,0 0,calc(100% - 80px) 0)
               .article-content-text
                 margin 20px 80px 20px 40px
             .recent-post-arrow
               order: 1
               left 72px
               top calc(50% - 10px)
               clip-path polygon(0 0, 8px 10px, 0 20px)
             &:hover
               .recent-post-arrow
                 left 32px
   // 双栏布局卡片自适应适配
   @media screen and (min-width:572px) and (max-width:1068px)
     .recent-posts
       padding 0 15px 0 15px
       display flex
       flex-direction row
       flex-wrap wrap
       .recent-post-item
         border-radius 15px
         overflow hidden
         width 47%
         margin 0px 3% 20px 0px
       nav#pagination
         width: 100%
   // 手机端单栏布局自适应适配
   @media screen and (max-width:572px)
     .recent-posts
       padding 0 15px 0 15px
       .recent-post-item
         border-radius 15px
         overflow hidden

   // 手机端及双栏卡片样式
   @media screen and (max-width:1068px)
     .recent-posts
       .recent-post-item
         .recent-post-content
           flex-direction column
           flex-wrap nowrap
           align-items center
           max-height 350px
           height: auto
           width 100%
           .recent-post-cover
             width 100%
             height 200px
             clip-path polygon(0 130px,0 0,100% 0,100% 130px,50% 100%)
             img
               height 200px
               width 100%
               object-fit cover
           .recent-post-info
             height 150px
             width 100%
             padding 0px 25px 5px 25px
             .article-title
               margin: 0px 40px
               font-size 18px
               .article-title-link
                 -webkit-line-clamp: 2;
             .recent-post-meta
               margin: 0px 20px
               .article-meta-wrap
                 font-size 12px
                 -webkit-line-clamp: 3;
           .article-content
             position absolute
             height 200px
             width 100%
             background rgba(25,25,25,0.5)
             clip-path polygon(0 130px,0 0,100% 0,100% 130px,50% 100%)
             .article-content-text
               -webkit-line-clamp 3
               font-size 16px
               margin 0px 25px 30px 25px
           .recent-post-arrow
             display block
             background var(--article-content-bgcolor)
             position absolute
             height 10px
             width 20px
             clip-path polygon(0 0,100% 0,50% 100%)
             top 20px
   ```

   - 样式二:multicard

   ```stylus
   //default color:
   :root
     --recent-post-bgcolor: rgba(200, 200, 200, 0.5)  //默认背景
     --article-content-bgcolor: #49b1f5 //描述版块背景
     --recent-post-arrow: #ffffff //箭头配色
     --recent-post-cover-shadow: #ffffff //封面遮罩层配色，建议和默认值的颜色相对应。
     --recent-post-transition: all 0.5s cubic-bezier(0.59, 0.01, 0.48, 1.17)  //动画效果。不了解的不要改动
   [data-theme="dark"]
     --recent-post-bgcolor: rgba(35,35,35,0.5)
     --article-content-bgcolor: #99999a
     --recent-post-arrow: #37e2dd
     --recent-post-cover-shadow: #232323
   // 默认的首页卡片容器布局
   .recent-posts
     padding 0 15px 0 15px
     height fit-content
     .recent-post-item
       margin-bottom 15px
       background var(--recent-post-bgcolor)
       overflow hidden
       border-radius 15px
       .recent-post-content
         display flex
         background var(--recent-post-bgcolor)
         position relative
         .recent-post-cover
           display flex
           background transparent
         .recent-post-info
           display flex
           background transparent
           flex-direction column
           justify-content center
           align-items center
           .article-title
             height 50%
             display: flex
             text-align: center
             align-items: center
             justify-content: flex-end
             flex-direction: column
             .article-title-link
               color: var(--text-highlight-color)
               transition: all .2s ease-in-out
               display: -webkit-box;
               -webkit-box-orient: vertical;
               overflow: hidden;
               &:hover
                 color: $text-hover
           .recent-post-meta
             height 50%
             display: flex
             text-align: center
             align-items: center
             justify-content: flex-start
             flex-direction: column
             .article-meta-wrap
               color #969797
               display: -webkit-box;
               -webkit-box-orient: vertical;
               overflow: hidden;
               a
                 color: var(--text-highlight-color)
                 transition: all .2s ease-in-out
                 color #969797
                 &:hover
                   color: $text-hover
         .article-content
           display flex
           text-align: center
           flex-direction row
           align-items center
           justify-content center
           .article-content-text
             display -webkit-box
             -webkit-box-orient vertical
             text-overflow: ellipsis
             overflow hidden
             color #fff
             text-shadow 1px 2px 3px #000
       &.ads-wrap
         display: block !important
         height: auto !important
     nav#pagination
       width: 100%
   // 卡片单元布局样式
   .recent-posts
     padding 0 15px 0 15px
     display flex
     flex-direction row
     flex-wrap wrap
     .recent-post-item
       border-radius 15px
       overflow hidden
       .recent-post-content
         flex-direction column
         flex-wrap nowrap
         align-items center
         max-height 350px
         height: auto
         width 100%
         .recent-post-cover
           width 100%
           height 200px
           clip-path polygon(0 130px,0 0,100% 0,100% 130px,50% 100%)
           img
             height 200px
             width 100%
             object-fit cover
         .recent-post-info
           height 150px
           width 100%
           padding 0px 25px 5px 25px
           .article-title
             margin: 0px 40px
             font-size 18px
             .article-title-link
               -webkit-line-clamp: 2;
           .recent-post-meta
             margin: 0px 20px
             .article-meta-wrap
               font-size 12px
               -webkit-line-clamp: 3;
         .article-content
           position absolute
           height 200px
           width 100%
           background rgba(25,25,25,0.5)
           clip-path polygon(0 130px,0 0,100% 0,100% 130px,50% 100%)
           .article-content-text
             -webkit-line-clamp 3
             font-size 16px
             margin 0px 25px 30px 25px
             &::before
               content "❝"
               font-size 20px
             &::after
               content "❞"
               font-size 20px
         .recent-post-arrow
           display block
           background var(--article-content-bgcolor)
           position absolute
           height 10px
           width 20px
           clip-path polygon(0 0,100% 0,50% 100%)
           top 20px
   // 三栏布局滑动卡片样式
   @media screen and (min-width:1069px)
     .recent-posts
       .recent-post-item
         width 32.3%
         margin 0px 1% 20px 0px
         .recent-post-content
           .recent-post-info
             .article-title
               margin: 0px 5px
               .article-title-link
                 -webkit-line-clamp: 1;
             .recent-post-meta
               margin: 0px 5px
               .article-meta-wrap
                 -webkit-line-clamp: 2;
   // 双栏布局卡片自适应适配
   @media screen and (min-width:572px) and (max-width:1068px)
     .recent-posts
       .recent-post-item
         width 47%
         margin 0px 3% 20px 0px
   // 单栏布局卡片自适应适配
   @media screen and (max-width:572px)
     .recent-posts
       .recent-post-item
         width 100%
   ```

3. 修改`[BlogRoot]\themes\butterfly\source\css\_page\homepage.styl`,将整文件内容替换为以下代码：

   ```stylus
   if hexo-config('index_card_style') == 'slidecard'
     @import './_index_card_style/slidecard'
   else if hexo-config('index_card_style') == 'multicard'
     @import './_index_card_style/multicard'
   ```

4. 然后在主题配置文件`[BlogRoot]\_config.butterfly.yml`里新增配置项，这样我们就可以通过配置项自由切换使用哪款了：

   ```yaml
   # 主页卡片样式
   # Docs: https://akilar.top/posts/d6b69c49/
   index_card_style: multicard # slidecard | multicard
   ```

5. 考虑到不管是样式一还是样式二都存在一个布局突变的情况。为了不至于让首页的文章出现空缺，建议将首页生成的文章数量控制为1,2,3的公倍数。修改站点配置文件`[BlogRoot]\_config.yml`。找到以下配置项进行调整，注意这是站点配置文件本就有的配置项，不是新增配置项。建议是调整为12篇。如果你的侧边栏魔改内容特别多，那么建议改成18、24、30。务必确保文章卡片栏比侧栏完全展开要长，这样展示效果最好

   ```yaml
   # Home page setting
   # path: Root path for your blogs index page. (default = '')
   # per_page: Posts displayed per page. (0 = disable pagination)
   # order_by: Posts order. (Order by date descending by default)
   index_generator:
     path: ""
     per_page: 12
     order_by: -date
   ```

6. 本教程讨论的卡片都是考虑有封面和有描述的。所以需要保证你已经开启了相应的配置，查看主题配置文件`[BlogRoot]\_config.butterfly.yml`,找到配置项开启描述栏，建议选择2模式

   ```yaml
   # Display the article introduction on homepage
   # 1: description
   # 2: both (if the description exists, it will show description, or show the auto_excerpt)
   # 3: auto_excerpt (default)
   # false: do not show the article introduction
   index_post_content:
     method: 2
     length: 500 # if you set method to 2 or 3, the length need to config
   ```

## 局部美化

### 个人卡片

![image-20260110174908177](/img/picgo-images/个人卡片变色效果图.webp)

> 个人信息卡片渐变色调整:

1. 在`[BlogRoot]\source\css\custom.css`自定义样式的文件中引入如下代码：

   ```css
   /* 侧边栏个人信息卡片动态渐变色 */
   #aside-content > .card-widget.card-info {
     background: linear-gradient(
       -45deg,
       #e8d8b9,
       #eccec5,
       #a3e9eb,
       #bdbdf0,
       #eec1ea
     );
     box-shadow: 0 0 5px rgb(66, 68, 68);
     position: relative;
     background-size: 400% 400%;
     -webkit-animation: Gradient 10s ease infinite;
     -moz-animation: Gradient 10s ease infinite;
     animation: Gradient 10s ease infinite !important;
   }
   @-webkit-keyframes Gradient {
     0% {
       background-position: 0% 50%;
     }
     50% {
       background-position: 100% 50%;
     }
     100% {
       background-position: 0% 50%;
     }
   }
   @-moz-keyframes Gradient {
     0% {
       background-position: 0% 50%;
     }
     50% {
       background-position: 100% 50%;
     }
     100% {
       background-position: 0% 50%;
     }
   }
   @keyframes Gradient {
     0% {
       background-position: 0% 50%;
     }
     50% {
       background-position: 100% 50%;
     }
     100% {
       background-position: 0% 50%;
     }
   }

   /* 黑夜模式适配 */
   [data-theme="dark"] #aside-content > .card-widget.card-info {
     background: #191919ee;
   }

   /* 个人信息Follow me按钮 */
   #aside-content > .card-widget.card-info > #card-info-btn {
     background-color: #3eb8be;
     border-radius: 8px;
   }
   ```

2. 最后记得在`inject`配置项引入

   ```yaml
   inject:
     head:
       - <link rel="stylesheet" href="/css/custom.css" media="defer" onload="this.media='all'">
   ```

### 图标自定义

#### 前置条件1——外挂标签引入

1. 安装插件,在博客根目录`[BlogRoot]`下打开终端，运行以下指令：

   ```bash
   npm install hexo-butterfly-tag-plugins-plus --save
   ```

2. 考虑到hexo自带的markdown渲染插件`hexo-renderer-marked`与外挂标签语法的兼容性较差，建议您将其替换成[hexo-renderer-kramed](https://www.npmjs.com/package/hexo-renderer-kramed)

   ```bash
   npm uninstall hexo-renderer-marked --save
   npm install hexo-renderer-kramed --save
   ```

3. 添加配置信息，以下为写法示例, 在站点配置文件`_config.yml`或者主题配置文件`_config.butterfly.yml`中添加

   ```yaml
   # tag-plugins-plus
   # see https://akilar.top/posts/615e2dec/
   tag_plugins:
     enable: true # 开关
     priority: 5 #过滤器优先权
     issues: false #issues标签依赖注入开关
     link:
       placeholder: /img/link.png #link_card标签默认的图标图片
     CDN:
       anima: https://npm.elemecdn.com/hexo-butterfly-tag-plugins-plus@latest/lib/assets/font-awesome-animation.min.css #动画标签anima的依赖
       jquery: https://npm.elemecdn.com/jquery@latest/dist/jquery.min.js #issues标签依赖
       issues: https://npm.elemecdn.com/hexo-butterfly-tag-plugins-plus@latest/lib/assets/issues.js #issues标签依赖
       iconfont: //at.alicdn.com/t/font_2032782_8d5kxvn09md.js #参看https://akilar.top/posts/d2ebecef/
       carousel: https://npm.elemecdn.com/hexo-butterfly-tag-plugins-plus@latest/lib/assets/carousel-touch.js
       tag_plugins_css: https://npm.elemecdn.com/hexo-butterfly-tag-plugins-plus@latest/lib/tag_plugins.css
   ```

#### 前置条件2——iconfont引入

1. 访问[阿里巴巴矢量图标库](https://www.iconfont.cn/),注册登录。

2. 搜索自己心仪的图标，然后选择**添加入库**，加到购物车。

3. 选择完毕后点击右上角的购物车图标，打开侧栏，选择添加到项目，如果没有项目就新建一个。

   [![p4](/img/picgo-images/p.png)](https://s1.vika.cn/space/2022/10/29/91ec7f6432274b42b50698ef554a2b91)

4. 可以通过上方顶栏菜单->资源管理->我的项目，找到之前添加的图标项目。(现在的iconfont可以在图标库的项目设置里直接打开彩色设置，然后采用fontclass的引用方式即可使用多彩图标。但是**单一项目彩色图标上限是40个图标**，酌情采用。)

   ![image-20260110202114606](/img/picgo-images/iconfont引入.png)

> 最新版本的iconfont支持直接在项目设置中开启彩色图标，从而实现直接用class添加多彩色图标。（推荐直接用这个即可）

1. 在主题配置文件`inject`配置项进行全局引入：

   ```yaml
   inject:
     head:
       - <link rel="stylesheet" href="//at.alicdn.com/t/font_2264842_b004iy0kk2b.css" media="defer" onload="this.media='all'">
     bottom:
       - <script async src="//at.alicdn.com/t/font_2264842_b004iy0kk2b.js"></script>
   ```

2. 可以通过自己的阿里图标库的font-class方案查询复制相应的`icon-xxxx`

#### ~~导航栏图标自定义(新版本失效)~~

> 前置教程：[Hexo引入阿里矢量图标库-iconfont inject](https://akilar.top/posts/d2ebecef/)和[基于Butterfly的外挂标签引入-Tag Plugins Plus](https://akilar.top/posts/615e2dec/#动态标签-anima)中关于`动态标签anima`的内容。请确保您已经完成了前置教程，并实现了在文章中使用`symbol`写法来引入`iconfont`图标。同时引入了`fontawesome_animation`的前置依赖。

1. 主要检查您的`inject`配置项中是否有这两个依赖

   ```yaml
   inject:
     head:
       #动画标签anima的依赖
       - <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/l-lin/font-awesome-animation/dist/font-awesome-animation.min.css"  media="defer" onload="this.media='all'">
     bottom:
       # 阿里矢量图标,这串是我的图标库，你的链接会有所不同。
       - <script async src="//at.alicdn.com/t/font_2032782_ev6ytrh30f.js"></script>
   ```

2. 本方案默认使用观感最佳的悬停父元素触发子元素动画效果，默认动画为`faa-tada`。以下是填写示例，在`[BlogRoot]\_config.butterfly.yml`中修改。`icon-xxx`字样的为`iconfont`的`symbol`引入方案的`id`值，可以在你的`iconfont`图标库内查询，其中hide属性也是可以用的。

   ```yaml
   menu:
     首页: / || icon-home || faa-tada
     文章 || icon--article || faa-tada || hide:
       归档: /archives/ || icon-guidang1 || faa-tada
       标签: /tags/ || icon-sekuaibiaoqian || faa-tada
       分类: /categories/ || icon-fenlei || faa-tada
       随便逛逛: javascript:randomPost(); || icon-zuji1 || faa-tada
   ```

3. 要注意的是，这里的动态图标是`svg.icon`的标签，因此上面调节`.iconfont`的css并不使用，我们需要在自定义样式文件`custom.css`里加上一些样式来限制图标的大小和颜色等，具体大小自行调节。

   ```css
   svg.icon {
     width: 1.28em;
     height: 1.28em;
     vertical-align: -0.15em;
     fill: currentColor;
     overflow: hidden;
   }
   ```

4. 重启项目即可看到效果：

   ```bash
   hexo cl; hexo s
   ```

#### Social图标自定义

![image-20260110204032847](/img/picgo-images/Social图标展示.webp)

> 代码原理和上面的菜单栏基本一致，所以各个前置教程都不再重复，这里只提供代码魔改内容和配置项编写方案。

1. 重写`[BlogRoot]\themes\butterfly\layout\includes\header\social.pug`,替换为以下代码：

   ```pug
   each value, title in theme.social
     a.social-icon.faa-parent.animated-hover(href=url_for(trim(value.split('||')[0])) target="_blank" title=title === undefined ? '' : trim(title))
       if value.split('||')[1]
         - var icon_value = trim(value.split('||')[1])
         - var anima_value = value.split('||')[2] ? trim(value.split('||')[2]) : 'faa-tada'
         if icon_value.substring(0,2)=="fa"
           i.fa-fw(class=icon_value + ' ' + anima_value)
         else if icon_value.substring(0,4)=="icon"
           svg.social_icon(aria-hidden="true" class=anima_value)
             use(xlink:href=`#`+ icon_value)
   ```

2. 以下为对应的`social`配置项。写法沿用`menu_item`的写法示例，修改`[BlogRoot]\_config.butterfly.yml`的`social`配置项，具体的链接改为自己的。

   ```yaml
   social:
     GitHub: https://github.com/koco-co || icon-Githubzhanghao || faa-tada
     Email: mailto:kopohub@gmail.com || icon-pailietubiao-30 || faa-tada
     Bilibili: https://space.bilibili.com/3546823172033014 || icon-bilibili2 || faa-tada
     Twitter: https://x.com/SugerQvQ || icon-tuite || faa-tada
     Telegram: https://t.me/sugerovo || icon-Telegramzhanghao || faa-tada
     # QQ: https://res.abeim.cn/api/qq/?qq=1174008660 || icon-QQ || faa-tada
     # 力扣: https://leetcode.cn/u/fomalhaut1998 || icon-likou || faa-tada
   ```

3. 要注意的是，这里的动态图标是`svg.icon`的标签，因此上面调节`.iconfont`的css并不使用，我们需要在自定义样式文件`custom.css`里加上一些样式来限制图标的大小和颜色等，具体大小自行调节（如果上面弄过菜单栏的图标大小，这里也就不需要再重复写了）。

   ```css
   svg.icon {
     width: 1.28em;
     height: 1.28em;
     vertical-align: -0.15em;
     fill: currentColor;
     overflow: hidden;
   }
   ```

4. 调节社交图标的大小就用以下的css

   ```css
   svg.social_icon {
     width: 1.2em;
     height: 1.2em;
     vertical-align: -0.15em;
     fill: currentColor;
     overflow: hidden;
   }
   ```

5. 重启项目即可看到效果：

   ```bash
   hexo cl; hexo s
   ```

#### 侧边栏图标自定义

![image-20260111134454655](/img/picgo-images/image-侧边栏图标自定义.webp)

> 这里的图标也是用的iconfont的，请完成前面的图标引入教程！由于侧边栏比较多，这里就演示改网站信息，剩下的侧边栏改法几乎一样的！

1. 进入`[BlogRoot]\themes\butterfly\layout\includes\widget\card_webinfo.pug`，进行以下修改，因为默认的图标是`font-awesome`的黑白图标，就是`i.fas.fa-chart-line`那一行，删除，然后引入新的图标标签，其中图标的样式、名称等参考自己的需要进行更改，样式主要是`width`、`height`、`position`、`top`这几个属性，这里的`animated-hover`和`faa-tada`是给对应的元素套上对应的class，如果装了动画依赖，扫描到这些class的元素会自动挂载动画样式，如果不想要可以去除。

   ```pug
   if theme.aside.card_webinfo.enable
     .card-widget.card-webinfo
       .item-headline
   -      i.fas.fa-chart-line
   +      a.faa-parent.animated-hover
   +       svg.faa-tada.icon(style="height:25px;width:25px;fill:currentColor;position:relative;top:5px" aria-hidden="true")
   +        use(xlink:href='#icon-shujutongji2')
         span= _p('aside.card_webinfo.headline')
       .webinfo
         if theme.aside.card_webinfo.post_count
           .webinfo-item
             .item-name= _p('aside.card_webinfo.article_name') + " :"
             .item-count= site.posts.length
         if theme.runtimeshow.enable
           .webinfo-item
             .item-name= _p('aside.card_webinfo.runtime.name') + " :"
             .item-count#runtimeshow(data-publishDate=date_xml(theme.runtimeshow.publish_date))
               i.fa-solid.fa-spinner.fa-spin
         if theme.wordcount.enable && theme.wordcount.total_wordcount
           .webinfo-item
             .item-name=_p('aside.card_webinfo.site_wordcount') + " :"
             .item-count=totalcount(site)
         if theme.busuanzi.site_uv
           .webinfo-item
             .item-name= _p('aside.card_webinfo.site_uv_name') + " :"
             .item-count#busuanzi_value_site_uv
               i.fa-solid.fa-spinner.fa-spin
         if theme.busuanzi.site_pv
           .webinfo-item
             .item-name= _p('aside.card_webinfo.site_pv_name') + " :"
             .item-count#busuanzi_value_site_pv
               i.fa-solid.fa-spinner.fa-spin
         if theme.aside.card_webinfo.last_push_date
           .webinfo-item
             .item-name= _p('aside.card_webinfo.last_push_date.name') + " :"
             .item-count#last-push-date(data-lastPushDate=date_xml(Date.now()))
               i.fa-solid.fa-spinner.fa-spin
   ```

2. 如果我们设置了语言为`zh-CN`那么就到`[BlogRoot]\themes\butterfly\languages\zh-CN.yml`进行修改。`yml`文件是以缩进区分层级的，我们只需要寻找`aside`->`card_webinfo`->`headline`这一项修改为自己喜欢的内容即可
3. 重新编译看效果

#### 底部直达按钮

![image-20260110213107117](/img/picgo-images/直达底部按钮.webp)

在`[BlogRoot]\themes\butterfly\layout\includes\rightside.pug`做以下修改:

```pug
button#go-up(type="button" title=_p("rightside.back_to_top"))
  i.fas.fa-arrow-up

// 在文件末尾新增以下两行代码
button#go-down(type="button" title="直达底部" onclick="btf.scrollToDest(document.body.scrollHeight, 500)")
  i.fas.fa-arrow-down
```

### 文章摘要

![image-20260113001844774](/img/picgo-images/image-文章摘要.webp)

> 因为主题 UI 的关係，主页文章节选只支持自动节选和文章页`description`.

1. 修改配置项: `_config.butterfly.yml`

   ```yaml
   # ======================================
   # 首页文章卡片布局方式（index_layout）
   # ======================================
   # 1：封面在左，文章信息在右
   # 2：封面在右，文章信息在左
   # 3：封面与文章信息左右交替显示
   # 4：封面在上，文章信息在下
   # 5：文章信息直接显示在封面图上
   # 6：瀑布流布局 - 封面在上，信息在下
   # 7：瀑布流布局 - 信息直接显示在封面图上
   # ======================================

   index_layout: 3

   # ======================================
   # 首页文章简介显示规则（index_post_content）
   # ======================================
   # method 说明：
   # 1：仅显示文章 front-matter 中的 description 字段
   #    - 若文章未配置 description，则首页不显示任何简介
   #
   # 2：优先显示 description
   #    - 若存在 description，则显示 description
   #    - 若不存在，则从正文中自动截取指定长度作为简介
   #
   # 3：始终从正文中自动截取摘要作为简介(默认)
   #
   # length 说明：
   # - 当 method 为 2 或 3 时必须配置
   # - 控制从正文中截取的字符长度
   # ======================================

   index_post_content:
     method: 2
     length: 200
   ```

2. description在 front-matter 裡添加

   ```markdown
   ---
   description: 这是一段文章摘要
   ---
   ```

### 文章链接

![image-20260110230238740](/img/picgo-images/image-文章链接优化.webp)

> 在Hexo的默认设定中，你的博客文章链接是由:`year/:month/:day/:title/`构成的，即按照年：月：日：标题的格式来生成链接，如果你的文章标题中还含有中文的话，复制URL链接就会有一大串编码字符。

1. 安装`hexo-abbrlink`：

   ```bash
   npm install hexo-abbrlink --save
   ```

2. 打开站点配置文件`_config.yml`,修改permalink为：

   ```yaml
   permalink: posts/:abbrlink/

   # abbrlink config
   abbrlink:
     alg: crc32 # support crc16(default) and crc32
     rep: hex # support dec(default) and hex
   ```

3. 在文章顶部的metadata中，添加如下字段，可以自定义，如 `abbrlink: gongnengtuozhan`，否则会生成`随机数字`。生成访问链接使用的就是这段文字，可自定义。

   ```markdown
   ---
   abbrlink: function-expansion
   ---
   ```

4. hexo 三连即可

### 文章版权

![image-20260110210035473](/img/picgo-images/渐变色版权美化展示.webp)

1. 修改`[BlogRoot]\themes\butterfly\layout\includes\post\post-copyright.pug`,直接复制以下内容替换原文件内容。此处多次用到了三元运算符作为默认项设置，在确保有主题配置文件的默认项的情况下，也可以在相应文章的`front-matter`中重新定义作者，原文链接，开源许可协议等内容。

   ```pug
   if theme.post_copyright.enable && page.copyright !== false
     - let author = page.copyright_author ? page.copyright_author : config.author
     - let url = page.copyright_url ? page.copyright_url : page.permalink
     - let license = page.license ? page.license : theme.post_copyright.license
     - let license_url = page.license_url ? page.license_url : theme.post_copyright.license_url
     .post-copyright
       .post-copyright__title
         span.post-copyright-info
           h #[=page.title]
       .post-copyright__type
         span.post-copyright-info
           a(href=url_for(url))= theme.post_copyright.decode ? decodeURI(url) : url
       .post-copyright-m
         .post-copyright-m-info
           .post-copyright-a
               h 作者
               .post-copyright-cc-info
                   h=author
           .post-copyright-c
               h 发布于
               .post-copyright-cc-info
                   h=date(page.date, config.date_format)
           .post-copyright-u
               h 更新于
               .post-copyright-cc-info
                   h=date(page.updated, config.date_format)
           .post-copyright-c
               h 许可协议
               .post-copyright-cc-info
                   a.icon(rel='noopener' target='_blank' title='Creative Commons' href='https://creativecommons.org/')
                     i.fab.fa-creative-commons
                   a(rel='noopener' target='_blank' title=license href=url_for(license_url))=license
   ```

2. 修改`[BlogRoot]\themes\butterfly\source\css\_layout\post.styl`,直接复制以下内容，替换原文件，这个文件就是自己调节样式的。其中，`184`行是白天模式的背景色，这里默认是我网站的渐变色，大家可以根据自己的喜好调节；`253`行是夜间模式的发光光圈颜色，大家也可以自行替换成自己喜欢的颜色：

   ```styl
   beautify()
     headStyle(fontsize)
       padding-left: unit(fontsize + 12, 'px')

       &:before
         margin-left: unit((-(fontsize + 6)), 'px')
         font-size: unit(fontsize, 'px')

       &:hover
         padding-left: unit(fontsize + 18, 'px')

     h1,
     h2,
     h3,
     h4,
     h5,
     h6
       transition: all .2s ease-out

       &:before
         position: absolute
         top: calc(50% - 7px)
         color: $title-prefix-icon-color
         content: $title-prefix-icon
         line-height: 1
         transition: all .2s ease-out
         @extend .fontawesomeIcon

       &:hover
         &:before
           color: $light-blue

     h1
       headStyle(20)

     h2
       headStyle(18)

     h3
       headStyle(16)

     h4
       headStyle(14)

     h5
       headStyle(12)

     h6
       headStyle(12)

     ol,
     ul
       p
         margin: 0 0 8px

     li
       &::marker
         color: $light-blue
         font-weight: 600
         font-size: 1.05em

       &:hover
         &::marker
           color: var(--pseudo-hover)

     ul > li
       list-style-type: circle

   #article-container
     word-wrap: break-word
     overflow-wrap: break-word

     a
       color: $theme-link-color

       &:hover
         text-decoration: underline

     img
       display: block
       margin: 0 auto 20px
       max-width: 100%
       transition: filter 375ms ease-in .2s

     p
       margin: 0 0 16px

     iframe
       margin: 0 0 20px

     if hexo-config('anchor')
       a.headerlink
         &:after
           @extend .fontawesomeIcon
           float: right
           color: var(--headline-presudo)
           content: '\f0c1'
           font-size: .95em
           opacity: 0
           transition: all .3s

         &:hover
           &:after
             color: var(--pseudo-hover)

       h1,
       h2,
       h3,
       h4,
       h5,
       h6
         &:hover
           a.headerlink
             &:after
               opacity: 1

     ol,
     ul
       ol,
       ul
         padding-left: 20px

       li
         margin: 4px 0

       p
         margin: 0 0 8px

     if hexo-config('beautify.enable')
       if hexo-config('beautify.field') == 'site'
         beautify()
       else if hexo-config('beautify.field') == 'post'
         &.post-content
           beautify()

     > :last-child
       margin-bottom: 0 !important

   #post
     .tag_share
       .post-meta
         &__tag-list
           display: inline-block

         &__tags
           display: inline-block
           margin: 8px 8px 8px 0
           padding: 0 12px
           width: fit-content
           border: 1px solid $light-blue
           border-radius: 12px
           color: $light-blue
           font-size: .85em
           transition: all .2s ease-in-out

           &:hover
             background: $light-blue
             color: var(--white)

       .post_share
         display: inline-block
         float: right
         margin: 8px 0
         width: fit-content

         .social-share
           font-size: .85em

           .social-share-icon
             margin: 0 4px
             width: w = 1.85em
             height: w
             font-size: 1.2em
             line-height: w

     .post-copyright
       position: relative
       margin: 40px 0 10px
       padding: 10px 16px
       border: 1px solid var(--light-grey)
       transition: box-shadow .3s ease-in-out
       overflow: hidden
       border-radius: 12px!important
       background: linear-gradient(45deg, #f6d8f5, #c2f1f0, #f0debf);

       &:before
         background var(--heo-post-blockquote-bg)
         position absolute
         right -26px
         top -120px
         content '\f25e'
         font-size 200px
         font-family 'Font Awesome 5 Brands'
         opacity .2

       &:hover
         box-shadow: 0 0 8px 0 rgba(232, 237, 250, .6), 0 2px 4px 0 rgba(232, 237, 250, .5)

       .post-copyright
         &-meta
           color: $light-blue
           font-weight: bold

         &-info
           padding-left: 6px

           a
             text-decoration: none
             word-break: break-word

             &:hover
               text-decoration: none

     .post-copyright-cc-info
       color: $theme-color;

     .post-outdate-notice
       position: relative
       margin: 0 0 20px
       padding: .5em 1.2em
       border-radius: 3px
       background-color: $noticeOutdate-bg
       color: $noticeOutdate-color

       if hexo-config('noticeOutdate.style') == 'flat'
         padding: .5em 1em .5em 2.6em
         border-left: 5px solid $noticeOutdate-border

         &:before
           @extend .fontawesomeIcon
           position: absolute
           top: 50%
           left: .9em
           color: $noticeOutdate-border
           content: '\f071'
           transform: translateY(-50%)

     .ads-wrap
       margin: 40px 0
   .post-copyright-m-info
     .post-copyright-a,
     .post-copyright-c,
     .post-copyright-u
       display inline-block
       width fit-content
       padding 2px 5px
   [data-theme="dark"]
     #post
       .post-copyright
         background #07080a
         text-shadow #bfbeb8 0 0 2px
         border 1px solid rgb(19 18 18 / 35%)
         box-shadow 0 0 5px var(--theme-color)
         animation flashlight 1s linear infinite alternate
     .post-copyright-info
       color #e0e0e4

   #post
     .post-copyright__title
       font-size 22px
     .post-copyright__notice
       font-size 15px
     .post-copyright
       box-shadow 2px 2px 5px
   ```

3. 默认项的配置
   - 作者：`[BlogRoot]\_config.yml`中的`author`配置项

     ```yaml
     # Site
     title: Koco-co's Space
     subtitle: Koco-co.github.io
     description:
     keywords:
     author: Koco-co
     language: zh-CN
     timezone: Asia/Shanghai
     ```

   - 许可协议：`[BlogRoot]\_config.butterfly.yml`中的`license`和`license_url`配置项

     ```yaml
     post_copyright:
       enable: true
       decode: true
       license: CC BY-NC-SA 4.0
       license_url: https://creativecommons.org/licenses/by-nc-sa/4.0/
     ```

4. 页面覆写配置项，修改对应文章的`front-matter`

   ```markdown
   ---
   title: Butterfly 主题魔改美化	# 文章名称
   date: 2026-01-10 17:02:30	# 文章发布日期
   tags: [ Butterfly ]			# 标签
   categories: [ Blog ]		# 分类
   cover:						# 文章封面图片
   updated:					# 文章更新日期
   copyright_author:			# 作者覆写
   copyright_url:				# 原文链接覆写
   license:					# 许可协议名称覆写
   license_url: 				# 许可协议链接覆写
   ---
   ```

### 公告栏自定义

![image-20260111124938802](/img/picgo-images/image-公告栏美化.webp)

> 在主题配置文件`_config.butterfly.yml`中写入如下配置：

```yaml
aside:
  card_announcement:
    enable: true
    content: <center><b>--- 主域名 ---<br><a href="https://koco-co.github.io" title="此线路为主域名" class="anno_content"><font color="#5ea6e5">koco-co.github.io</font></a>&nbsp; &nbsp;<br>--- 备用域名 ---<br><a href="https://koco-co.github.io" title="此线路属于博客二级域名" class="anno_content"><font color="#5ea6e5">koco-co.github.io</font></a><br>--- 自建服务地址 ---<br>  <a href="https://koco-co.github.io" title="发布ChemGPT 1.0" class="anno_content"><font color="#5ea6e5">koco-co.github.io</font></a> <br> <a href="https://koco-co.github.io" title="分子逆合成单步预测模型" class="anno_content"><font color="#5ea6e5">koco-co.github.io</font></a> <br> <a href="https://koco-co.github.io" title="文件共享平台，如需使用，请联系博主" class="anno_content"><font color="#5ea6e5">koco-co.github.io</font></a></b></center>
```

### IP自适应欢迎语

![image-20260111131922360](/img/picgo-images/image-欢迎信息.webp)

1. 获取`API Key`：进入[腾讯位置服务](https://lbs.qq.com/dev/console/application/mine)应用管理界面，点击创建应用，应用名称和类型随便填。在新创建的应用中点击添加`key`，产品选择`WebServiceAPI`，域名白名单填自己的域名或不填。把得到的key记下。如果开启白名单记得把localhost也加上

   ![image-20260110212123787](/img/picgo-images/ip定位服务.png)

2. 新建`[BlogRoot]\source\js\txmap.js`，并写入如下代码，记住替换key的内容：

   ```javascript
   /* =====================================================
    * txmap.js - Tencent Map IP Welcome Script
    * ===================================================== */

   /* ========== 可配置项（只需改这里） ========== */
   const TXMAP_CONFIG = {
     // 腾讯位置服务 Key, Ref. https://lbs.qq.com/dev/console/application/mine
     TX_KEY: "你的Key",

     // 站长坐标（经度, 纬度）, 高德平台获取, Ref. https://lbs.amap.com/tools/picker
     OWNER_LNG: 119.99,
     OWNER_LAT: 30.3,

     // 站点昵称
     BLOG_NAME: "Koco-co",

     // DOM 容器 ID
     CONTAINER_ID: "welcome-info",
   };

   /* ========== 页面初始：先显示基础欢迎信息 ========== */
   document.addEventListener("DOMContentLoaded", function () {
     if (document.getElementById(TXMAP_CONFIG.CONTAINER_ID)) {
       showWelcome();
     }
   });

   /* ========== IP 定位请求（JSONP） ========== */
   let ipLoacation;

   window.addEventListener("load", function () {
     setTimeout(function () {
       if (typeof $ === "undefined") return;

       $.ajax({
         type: "get",
         url: "https://apis.map.qq.com/ws/location/v1/ip",
         data: {
           key: TXMAP_CONFIG.TX_KEY,
           output: "jsonp",
         },
         dataType: "jsonp",
         timeout: 5000,
         success: function (res) {
           ipLoacation = res;
           if (document.getElementById(TXMAP_CONFIG.CONTAINER_ID)) {
             showWelcome();
           }
         },
         error: function () {
           // JSONP 失败时静默处理
         },
       });
     }, 100);
   });

   /* ========== 计算球面距离（公里） ========== */
   function getDistance(e1, n1, e2, n2) {
     const R = 6371;
     const { sin, cos, asin, PI, hypot } = Math;

     let getPoint = (e, n) => {
       e *= PI / 180;
       n *= PI / 180;
       return {
         x: cos(n) * cos(e),
         y: cos(n) * sin(e),
         z: sin(n),
       };
     };

     let a = getPoint(e1, n1);
     let b = getPoint(e2, n2);
     let c = hypot(a.x - b.x, a.y - b.y, a.z - b.z);
     return Math.round(asin(Math.min(1, c / 2)) * 2 * R);
   }

   /* ========== 欢迎信息主函数（可重复安全调用） ========== */
   function showWelcome() {
     const el = document.getElementById(TXMAP_CONFIG.CONTAINER_ID);
     if (!el) return;

     /* ===== 时间问候 ===== */
     const hour = new Date().getHours();
     let timeChange =
       hour >= 5 && hour < 11
         ? "<span>上午好</span>，愿你今天一切顺利~~~"
         : hour < 13
           ? "<span>中午好</span>，记得按时吃饭哦~~~"
           : hour < 15
             ? "<span>下午好</span>，不妨小憩片刻~~~"
             : hour < 16
               ? "<span>三点多啦</span>，喝点下午茶吧~~~"
               : hour < 19
                 ? "<span>傍晚好</span>，愿你收获满满~~~"
                 : hour < 24
                   ? "<span>晚上好</span>，放松一下吧~~~"
                   : "夜深了，记得早点休息~~~";

     try {
       /* ===== 有 IP 信息（增强展示） ===== */
       if (ipLoacation && ipLoacation.status === 0) {
         const info = ipLoacation.result;
         const ad = info.ad_info || {};
         const loc = info.location || {};

         const dist = getDistance(
           TXMAP_CONFIG.OWNER_LNG,
           TXMAP_CONFIG.OWNER_LAT,
           loc.lng,
           loc.lat,
         );

         let pos = ad.nation || "未知地区";
         let ip = info.ip || "未知 IP";
         let posdesc = "感谢你的到来，愿你有所收获。";

         /* ===== 国家 / 地区文案 ===== */
         switch (ad.nation) {
           case "日本":
             posdesc = "よろしく，一起去看樱花吗？";
             break;
           case "美国":
             posdesc = "May peace be with you.";
             break;
           case "英国":
             posdesc = "想与你夜乘伦敦眼。";
             break;
           case "俄罗斯":
             posdesc = "干了这杯伏特加！";
             break;
           case "法国":
             posdesc = "C'est la vie.";
             break;
           case "德国":
             posdesc = "Die Zeit verging im Fluge.";
             break;
           case "澳大利亚":
             posdesc = "一起去大堡礁看看吧！";
             break;
           case "加拿大":
             posdesc = "拾一片枫叶赠予你。";
             break;

           case "中国":
             pos = [ad.province, ad.city, ad.district]
               .filter(Boolean)
               .join(" ");
             posdesc = getChinaDesc(ad);
             break;

           default:
             posdesc = "世界很大，感谢你的到来。";
         }

         el.innerHTML = `
                   <b>
                       <center>🎉 欢迎信息 🎉</center>
                       欢迎来自
                       <span style="color:var(--theme-color)">${pos}</span>
                       的朋友，${timeChange}
                       <br>
                       你当前距离
                       <span style="color:var(--theme-color)">${TXMAP_CONFIG.BLOG_NAME}</span>
                       约
                       <span style="color:var(--theme-color)">${dist}</span>
                       公里，
                       IP 地址：
                       <span style="color:var(--theme-color)">${ip}</span>
                       <br>
                       ${posdesc}
                   </b>
               `;
       } else {
       /* ===== 无 IP 信息（基础展示） ===== */
         el.innerHTML = `
                   <b>
                       <center>🎉 欢迎信息 🎉</center>
                       欢迎来到
                       <span style="color:var(--theme-color)">${TXMAP_CONFIG.BLOG_NAME}</span>
                       的小窝，${timeChange}
                   </b>
               `;
       }
     } catch (e) {
       el.innerHTML = `
               <b>
                   <center>🎉 欢迎信息 🎉</center>
                   欢迎来到
                   <span style="color:var(--theme-color)">${TXMAP_CONFIG.BLOG_NAME}</span>
                   的小窝，${timeChange}
               </b>
           `;
     }
   }

   /* ========== 中国地区文案拆分（便于维护） ========== */
   function getChinaDesc(ad) {
     const map = {
       北京市: "北——京——欢迎你。",
       天津市: "来段相声助助兴。",
       河北省: "山河壮丽，天下雄关。",
       山西省: "表里山河，晋善晋美。",
       内蒙古自治区: "天苍苍，野茫茫。",
       辽宁省: "安排一顿地道烧烤吧。",
       吉林省: "白山黑水，热情豪爽。",
       黑龙江省: "冰城的冬天很浪漫。",
       上海市: "欢迎来到魔都。",
       浙江省: "诗画江南，山水如梦。",
       江苏省: "上有天堂，下有苏杭。",
       安徽省: "蚌埠住了，芜湖起飞。",
       福建省: "山海相逢，风景正好。",
       江西省: "落霞与孤鹜齐飞。",
       山东省: "齐鲁大地，礼仪之邦。",
       湖北省: "来碗热干面吧。",
       湖南省: "辣得过瘾，吃得开心。",
       广东省: "饮茶先啦。",
       广西壮族自治区: "桂林山水甲天下。",
       海南省: "面朝大海，春暖花开。",
       四川省: "巴适得板。",
       贵州省: "山水秘境，醇香四溢。",
       云南省: "彩云之南，风景如画。",
       陕西省: "来碗臊子面。",
       甘肃省: "大漠孤烟直。",
       青海省: "天地辽阔，心亦澄明。",
       宁夏回族自治区: "塞上江南。",
       新疆维吾尔自治区: "丝路古道，热情豪迈。",
       台湾省: "海峡两岸，血脉相连。",
       香港特别行政区: "东方之珠。",
       澳门特别行政区: "风情万种的小城。",
     };

     return map[ad.province] || "欢迎来自这片热土的朋友。";
   }

   /* ========== PJAX 支持 ========== */
   document.addEventListener("pjax:complete", function () {
     setTimeout(function () {
       if (document.getElementById(TXMAP_CONFIG.CONTAINER_ID)) {
         showWelcome();
       }
     }, 100);
   });
   ```

3. 在主题配置文件`[BlogRoot]\_config.butterfly.yml`中引入jQuery依赖和刚刚的js文件：

   ```yaml
   inject:
     bottom:
       - <script src="https://cdn.staticfile.org/jquery/3.6.3/jquery.min.js"></script> # jQuery
       - <script async data-pjax src="/js/txmap.js"></script> # 腾讯位置API
   ```

4. 在需要展示文本的容器上添加相应id（welcome-info）就可以了，例如我想添加在网站公告栏信息的下方，于是就在`[BlogRoot]\themes\butterfly\layout\includes\widget\card_announcement.pug`的最后一行加上这个，缩进与上一行相同即可

   ```pug
   if theme.aside.card_announcement.enable
       .card-widget.card-announcement
           .item-headline
               i.fas.fa-bullhorn.fa-shake
               span= _p('aside.card_announcement')
           .announcement_content!= theme.aside.card_announcement.content
           // 添加欢迎访客的信息
           #welcome-info
   ```

5. 在`custom.css`自定义样式里添加如下代码，可以根据你自己的喜好去改

   ```css
   /* 欢迎信息 */
   #welcome-info {
     background: linear-gradient(45deg, #b9f4f3, #e3fbf9);
     border-radius: 18px;
     padding: 8px;
   }

   [data-theme="dark"] #welcome-info {
     background: #212121;
   }
   ```

6. hexo二连即可看到效果

   ```bash
   hexo cl; hexo s
   ```

### 页脚自定义

![image-20260111122345536](/img/picgo-images/image-页脚美化.webp)

> 添加各种小徽标, 找到`_config.butterfly.yml` 文件的 `footer` 部分，更改 `custom_text`

```yaml
footer:
  copyright:
    # 是否显示版权信息
    enable: false
    # 是否显示版本号
    version: false
  custom_text: |-
    <div style="font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 20px;">
      <p><strong>免责声明</strong></p>
      <p>本站发布的内容仅供学习和研究使用，禁止用于商业或非法用途。若因违规使用导致任何后果，均由用户自行承担。</p>
      <p>请在下载后24小时内彻底删除相关文件。访问即表示您同意本声明条款。</p>
      <p>部分资源来自互联网，如有侵权或不妥之处，请联系站长处理。</p>
    </div>

    <div style="text-align: center; font-size: 13px; color: #888; margin-top: 15px;">
      <a target="_blank" href="https://hexo.io/"><img src="https://img.shields.io/badge/Frame-Hexo-blue?style=flat&logo=hexo" title="博客框架为Hexo"></a>&nbsp;
      <a target="_blank" href="https://butterfly.js.org/"><img src="https://img.shields.io/badge/Theme-Butterfly-6513df?style=flat&logo=bitdefender" title="主题采用Butterfly"></a>&nbsp;
      <a target="_blank" href="https://www.jsdelivr.com/"><img src="https://img.shields.io/badge/CDN-jsDelivr-5a46a4?style=flat&logo=jsdelivr" title="本站使用jsDelivr为静态资源提供CDN加速"></a>&nbsp;
      <a target="_blank" href="https://github.com/"><img src="https://img.shields.io/badge/Source-Github-d021d6?style=flat&logo=GitHub" title="本站项目由GitHub托管"></a>&nbsp;
      <a target="_blank" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img src="https://img.shields.io/badge/Copyright-BY--NC--SA%204.0-d42328?style=flat&logo=Claris" title="本站采用知识共享署名-非商业性使用-相同方式共享4.0国际许可协议进行许可"></a>
    </div>
```

### FPS信息

1. 新建文件`[BlogRoot]\source\js\fps.js`并写入如下代码：

   ```javascript
   if (
     window.localStorage.getItem("fpson") == undefined ||
     window.localStorage.getItem("fpson") == "1"
   ) {
     var rAF = (function () {
       return (
         window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         function (callback) {
           window.setTimeout(callback, 1000 / 60);
         }
       );
     })();
     var frame = 0;
     var allFrameCount = 0;
     var lastTime = Date.now();
     var lastFameTime = Date.now();
     var loop = function () {
       var now = Date.now();
       var fs = now - lastFameTime;
       var fps = Math.round(1000 / fs);

       lastFameTime = now;
       // 不置 0，在动画的开头及结尾记录此值的差值算出 FPS
       allFrameCount++;
       frame++;

       if (now > 1000 + lastTime) {
         var fps = Math.round((frame * 1000) / (now - lastTime));
         if (fps <= 5) {
           var kd = `<span style="color:#bd0000">卡成ppt🤢</span>`;
         } else if (fps <= 15) {
           var kd = `<span style="color:red">电竞级帧率😖</span>`;
         } else if (fps <= 25) {
           var kd = `<span style="color:orange">有点难受😨</span>`;
         } else if (fps < 35) {
           var kd = `<span style="color:#9338e6">不太流畅🙄</span>`;
         } else if (fps <= 45) {
           var kd = `<span style="color:#08b7e4">还不错哦😁</span>`;
         } else {
           var kd = `<span style="color:#39c5bb">十分流畅🤣</span>`;
         }
         document.getElementById("fps").innerHTML = `FPS:${fps} ${kd}`;
         frame = 0;
         lastTime = now;
       }

       rAF(loop);
     };

     loop();
   } else {
     document.getElementById("fps").style = "display:none!important";
   }
   ```

2. 在自定义样式文件`custom.css`中加入如下代码，我这里让这块东西在左下角，你可以自己指定位置，其中`backdrop-filter`过滤器也可以自己指定，也可以不要：

   ```css
   /* 帧率检测 */
   #fps {
     position: fixed;
     /* 指定位置 */
     left: 10px;
     bottom: 10px;
     z-index: 1919810;
   }
   [data-theme="light"] #fps {
     background-color: rgba(255, 255, 255, 0.85);
     backdrop-filter: var(--backdrop-filter);
     padding: 4px;
     border-radius: 4px;
   }
   [data-theme="dark"] #fps {
     background-color: rgba(0, 0, 0, 0.72);
     backdrop-filter: var(--backdrop-filter);
     padding: 4px;
     border-radius: 4px;
   }
   ```

3. 在主题配置文件`_config.butterfly.yml`文件中加入以下代码：

   ```yaml
   inject:
     head:
   	- <span id="fps"></span> # 帧率检测
     bottom:
   	- <script async src="/js/fps.js"></script> # 帧率检测
   ```

4. 重启项目看看角落有没有出现帧率块

   ```bash
   hexo cl; hexo s
   ```

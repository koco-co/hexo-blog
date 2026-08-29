# Butterfly 浏览器资产

这些文件由 `_config.butterfly.yml` 的 `CDN.option` 直接引用，用于避免访问页面时向公共 CDN 暴露访客网络信息，并降低外部网络故障对基础交互的影响。

| 目录 | 上游版本 | 上游文件 |
| --- | --- | --- |
| `fontawesome/` | `@fortawesome/fontawesome-free@7.3.1` | `css/all.min.css`、CSS 引用的四个 WOFF2 字体、`LICENSE.txt` |
| `lazyload/` | `vanilla-lazyload@19.1.3` | `dist/lazyload.iife.min.js`、`LICENSE` |
| `pjax/` | `pjax@0.2.8` | `pjax.min.js`、`LICENSE` |
| `infinitegrid/` | `@egjs/infinitegrid@4.13.0` | `dist/infinitegrid.min.js`、`LICENSE` |
| `abcjs/` | `abcjs@6.6.4` | `dist/abcjs-basic-min.js`、`LICENSE.md` |
| `chartjs/` | `chart.js@4.5.1` | `dist/chart.umd.min.js`、`LICENSE.md` |
| `mermaid/` | `mermaid@11.16.0` | `dist/mermaid.min.js`、`LICENSE` |
| `typed/` | `typed.js@3.0.0` | `dist/typed.umd.min.js`、`LICENSE.txt` |

更新时必须同时修改本表、配置路径与许可证文件，并通过站点构建和真实浏览器的桌面端、移动端及 PJAX 验证。

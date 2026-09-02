"use strict";

const { escapeHTML, url_for: urlForHelper } = require("hexo-util");
const urlFor = urlForHelper.bind(hexo);

function normalizeOrder(post) {
  const order = Number(post.series_order);
  return Number.isInteger(order) && order > 0 ? order : Number.MAX_SAFE_INTEGER;
}

function shortTitle(title) {
  return String(title ?? "")
    .replace(/^.+?文档\([^)]+\)\s*/, "")
    .trim();
}

function postRoute(post) {
  const permalink = String(post.permalink ?? "").trim();
  const url = String(post.url ?? "").trim();
  const abbrlink = String(post.abbrlink ?? "").trim();
  let route =
    permalink ||
    url ||
    (abbrlink ? `posts/${abbrlink}/` : String(post.path ?? ""));

  if (/^https?:\/\//i.test(route)) {
    try {
      route = new URL(route).pathname;
    } catch {
      route = route.replace(/^https?:\/\/[^/]+/i, "");
    }
  }

  return route.replace(/^\/+/, "");
}

function renderCourseSeries() {
  const seriesName = String(this.series ?? "").trim();
  if (!seriesName) {
    hexo.log.warn(
      `Post "${this.source || this.path}" uses course_series without a series name`,
    );
    return "";
  }

  const posts = hexo.locals
    .get("posts")
    .filter((post) => String(post.series ?? "").trim() === seriesName)
    .filter((post) =>
      String(post.source ?? "").startsWith("_posts/learn-topic/"),
    )
    .toArray();
  const currentRoute = postRoute(this);

  if (!posts.some((post) => postRoute(post) === currentRoute)) posts.push(this);

  posts.sort((left, right) => {
    const orderDifference = normalizeOrder(left) - normalizeOrder(right);
    if (orderDifference !== 0) return orderDifference;
    return String(left.title ?? "").localeCompare(
      String(right.title ?? ""),
      "zh-CN",
    );
  });

  const currentIndex = Math.max(
    posts.findIndex((post) => postRoute(post) === currentRoute),
    0,
  );
  const currentPosition = currentIndex + 1;
  const total = posts.length;
  const progress = total > 0 ? (currentPosition / total) * 100 : 0;

  const items = posts
    .map((post, index) => {
      const isCurrent = postRoute(post) === currentRoute;
      const position = index + 1;
      const currentClass = isCurrent ? " is-current" : "";
      const currentAttribute = isCurrent ? ' aria-current="page"' : "";

      return [
        `<li class="course-series-nav__item${currentClass}">`,
        `<a href="${urlFor(postRoute(post))}"${currentAttribute}>`,
        `<span class="course-series-nav__index">${String(position).padStart(2, "0")}</span>`,
        `<span class="course-series-nav__title">${escapeHTML(shortTitle(post.title))}</span>`,
        "</a>",
        "</li>",
      ].join("");
    })
    .join("");

  return [
    `<nav class="course-series-nav" aria-label="${escapeHTML(seriesName)} 文章进度">`,
    '<div class="course-series-nav__header">',
    '<div class="course-series-nav__heading">',
    `<strong>${escapeHTML(seriesName)} 文章进度</strong>`,
    "</div>",
    "</div>",
    `<div class="course-series-nav__progress" role="progressbar" aria-label="文章进度" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${currentPosition}">`,
    `<span style="width: ${progress.toFixed(4)}%"></span>`,
    "</div>",
    `<ol class="course-series-nav__list">${items}</ol>`,
    "</nav>",
  ].join("");
}

hexo.extend.tag.register("course_series", renderCourseSeries, { ends: false });

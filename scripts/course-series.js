'use strict'

const { escapeHTML, url_for: urlForHelper } = require('hexo-util')
const urlFor = urlForHelper.bind(hexo)

function normalizeOrder(post) {
  const order = Number(post.series_order)
  return Number.isInteger(order) && order > 0 ? order : Number.MAX_SAFE_INTEGER
}

function shortTitle(title) {
  return String(title ?? '').replace(/^.+?文档\([^)]+\)\s*/, '').trim()
}

function renderCourseSeries() {
  const seriesName = String(this.series ?? '').trim()
  if (!seriesName) {
    hexo.log.warn(`Post "${this.source || this.path}" uses course_series without a series name`)
    return ''
  }

  const posts = hexo.locals.get('posts')
    .filter(post => String(post.series ?? '').trim() === seriesName)
    .toArray()

  if (!posts.some(post => post.path === this.path)) posts.push(this)

  posts.sort((left, right) => {
    const orderDifference = normalizeOrder(left) - normalizeOrder(right)
    if (orderDifference !== 0) return orderDifference
    return String(left.title ?? '').localeCompare(String(right.title ?? ''), 'zh-CN')
  })

  const currentIndex = Math.max(posts.findIndex(post => post.path === this.path), 0)
  const currentPosition = currentIndex + 1
  const total = posts.length
  const progress = total > 0 ? (currentPosition / total) * 100 : 0

  const items = posts.map((post, index) => {
    const isCurrent = post.path === this.path
    const position = index + 1
    const currentClass = isCurrent ? ' is-current' : ''
    const currentAttribute = isCurrent ? ' aria-current="page"' : ''
    const state = isCurrent ? '<span class="course-series-nav__state">当前</span>' : ''

    return [
      `<li class="course-series-nav__item${currentClass}">`,
      `<a href="${urlFor(post.path)}"${currentAttribute}>`,
      `<span class="course-series-nav__index">${String(position).padStart(2, '0')}</span>`,
      `<span class="course-series-nav__title">${escapeHTML(shortTitle(post.title))}</span>`,
      state,
      '</a>',
      '</li>',
    ].join('')
  }).join('')

  return [
    `<nav class="course-series-nav" aria-label="${escapeHTML(seriesName)} 学习路径">`,
    '<div class="course-series-nav__header">',
    '<div class="course-series-nav__heading">',
    '<span class="course-series-nav__eyebrow">课程导航</span>',
    `<strong>${escapeHTML(seriesName)} 学习路径</strong>`,
    '</div>',
    `<span class="course-series-nav__position">第 <strong>${currentPosition}</strong> / ${total} 篇</span>`,
    '</div>',
    `<div class="course-series-nav__progress" role="progressbar" aria-label="课程进度" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${currentPosition}">`,
    `<span style="width: ${progress.toFixed(4)}%"></span>`,
    '</div>',
    `<ol class="course-series-nav__list">${items}</ol>`,
    '</nav>',
  ].join('')
}

hexo.extend.tag.register('course_series', renderCourseSeries, { ends: false })

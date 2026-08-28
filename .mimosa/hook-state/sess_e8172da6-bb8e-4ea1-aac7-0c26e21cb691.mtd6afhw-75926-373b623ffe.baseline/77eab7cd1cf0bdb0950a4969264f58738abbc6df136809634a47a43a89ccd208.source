'use strict'

const { url_for: urlForHelper } = require('hexo-util')
const urlFor = urlForHelper.bind(hexo)

function normalizePath(value) {
  let path = String(value ?? '').trim()

  try {
    path = decodeURI(path)
  } catch {
    // 保留原始路径，避免单个异常链接中断页面生成。
  }

  path = path.replace(/^https?:\/\/[^/]+/i, '')
  if (!path.startsWith('/')) path = `/${path}`
  return path.replace(/\/{2,}/g, '/').replace(/\/?$/, '/')
}

function getTagCounts() {
  const counts = new Map()

  hexo.locals.get('tags').forEach(tag => {
    counts.set(normalizePath(urlFor(tag.path)), tag.length)
  })

  return counts
}

function addCountMetadata(html) {
  if (!html.includes('class="tag-cloud-list')) return html

  const tagCounts = getTagCounts()
  const cloudPattern = /(<div class="tag-cloud-list[^>]*>)([\s\S]*?)(<\/div>)/g

  return html.replace(cloudPattern, (cloud, opening, content, closing) => {
    const enrichedContent = content.replace(/<a\b([^>]*)>/g, (anchor, attributes) => {
      if (/\bdata-post-count=/.test(attributes)) return anchor

      const href = attributes.match(/\bhref="([^"]+)"/)
      if (!href) return anchor

      const count = tagCounts.get(normalizePath(href[1]))
      if (!Number.isInteger(count)) return anchor

      return `<a${attributes} data-post-count="${count}">`
    })

    return `${opening}${enrichedContent}${closing}`
  })
}

hexo.extend.filter.register('after_render:html', addCountMetadata, 100)

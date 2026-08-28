// 分类 / 标签星图词云：根据文章数量设置视觉权重与可访问文本
(function () {
  'use strict'

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

  function getRatio(count, minCount, maxCount) {
    if (maxCount === minCount) return 0.5

    const min = Math.log1p(minCount)
    const max = Math.log1p(maxCount)
    return clamp((Math.log1p(count) - min) / (max - min), 0, 1)
  }

  function setCloudMetrics(link, count, ratio, options) {
    const size = options.minSize + ((options.maxSize - options.minSize) * Math.pow(ratio, 0.72))
    const mobileSize = Math.min(options.mobileMax, Math.max(options.mobileMin, size * 0.86))
    const weight = Math.round((options.minWeight + ((options.maxWeight - options.minWeight) * ratio)) / 10) * 10

    link.style.removeProperty('background-color')
    link.style.removeProperty('font-size')
    link.style.removeProperty('opacity')
    link.style.removeProperty('transform')
    link.style.setProperty('--cloud-size', `${size.toFixed(3)}rem`)
    link.style.setProperty('--cloud-size-mobile', `${mobileSize.toFixed(3)}rem`)
    link.style.setProperty('--cloud-weight', String(weight))
    link.style.setProperty('--cloud-opacity', (0.76 + (ratio * 0.24)).toFixed(3))

    const name = link.textContent.trim()
    const label = `${name}：${count} 篇文章`
    link.setAttribute('aria-label', label)
    link.setAttribute('title', label)
  }

  function initTagCloud() {
    const tagCloud = document.querySelector('.tag-cloud-list')
    if (!tagCloud) return

    const links = Array.from(tagCloud.querySelectorAll(':scope > a[data-post-count]'))
    if (!links.length) return

    const counts = links.map(link => Number.parseInt(link.dataset.postCount, 10) || 0)
    const minCount = Math.min(...counts)
    const maxCount = Math.max(...counts)

    links.forEach((link, index) => {
      const count = counts[index]
      const ratio = getRatio(count, minCount, maxCount)
      setCloudMetrics(link, count, ratio, {
        minSize: 0.98,
        maxSize: 2.18,
        mobileMin: 0.92,
        mobileMax: 1.68,
        minWeight: 560,
        maxWeight: 790,
      })
    })

    tagCloud.dataset.cloudReady = 'true'
  }

  function initCategoryCloud() {
    const categoryCloud = document.querySelector('.category-lists > .category-list')
    if (!categoryCloud) return

    const items = Array.from(categoryCloud.querySelectorAll('.category-list-item'))
    const entries = items.map(item => {
      const link = item.querySelector(':scope > .category-list-link')
      const countNode = item.querySelector(':scope > .category-list-count')
      const count = Number.parseInt(countNode?.textContent, 10) || 0
      return { link, count, isChild: item.parentElement?.classList.contains('category-list-child') }
    }).filter(entry => entry.link)

    if (!entries.length) return

    const counts = entries.map(entry => entry.count)
    const minCount = Math.min(...counts)
    const maxCount = Math.max(...counts)

    entries.forEach(entry => {
      const ratio = getRatio(entry.count, minCount, maxCount)
      const options = entry.isChild
        ? {
            minSize: 0.92,
            maxSize: 1.22,
            mobileMin: 0.9,
            mobileMax: 1.12,
            minWeight: 540,
            maxWeight: 680,
          }
        : {
            minSize: 1.12,
            maxSize: 1.78,
            mobileMin: 1.04,
            mobileMax: 1.52,
            minWeight: 650,
            maxWeight: 810,
          }

      setCloudMetrics(entry.link, entry.count, ratio, options)
    })

    categoryCloud.dataset.cloudReady = 'true'
  }

  function initClouds() {
    initTagCloud()
    initCategoryCloud()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClouds, { once: true })
  } else {
    initClouds()
  }

  document.addEventListener('pjax:complete', initClouds)
})()

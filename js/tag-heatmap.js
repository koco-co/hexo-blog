// 分类/标签热力图 - 根据文章数量调整大小和颜色
(function() {
  function initHeatmap() {
    // 标签页热力图
    const tagCloudList = document.querySelector('.tag-cloud-list');
    if (tagCloudList) {
      const tags = tagCloudList.querySelectorAll('a');
      const fontSizes = Array.from(tags).map(tag => {
        const style = tag.getAttribute('style');
        const match = style.match(/font-size:\s*([\d.]+)em/);
        return match ? parseFloat(match[1]) : 1;
      });

      const maxSize = Math.max(...fontSizes);
      const minSize = Math.min(...fontSizes);
      const range = maxSize - minSize || 1;

      tags.forEach((tag, index) => {
        const fontSize = fontSizes[index];
        const ratio = (fontSize - minSize) / range;

        // 基础缩放：从 font-size 获取的大小
        const baseScale = fontSize;
        // 额外热力图缩放：数量越多额外放大
        const extraScale = 1 + (ratio * 0.2);
        const finalScale = baseScale * extraScale;

        // 颜色透明度：数量越多，颜色越深（透明度越低）
        const opacity = 0.7 + (ratio * 0.3);

        // 应用样式
        tag.style.transform = `scale(${finalScale})`;
        tag.style.opacity = opacity;
      });
    }

    // 分类页热力图
    const categoryList = document.querySelector('.category-lists > .category-list');
    if (categoryList) {
      const items = categoryList.querySelectorAll(':scope > .category-list-item');
      const counts = Array.from(items).map(item => {
        const countSpan = item.querySelector(':scope > .category-list-count');
        return countSpan ? parseInt(countSpan.textContent) : 0;
      });

      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);
      const range = maxCount - minCount || 1;

      items.forEach((item, index) => {
        const count = counts[index];
        const ratio = (count - minCount) / range;

        // 链接
        const link = item.querySelector(':scope > .category-list-link');

        // 大小倍数：最小 1.0，最大 1.4
        const scale = 1 + (ratio * 0.4);

        // 颜色透明度：数量越多，颜色越深（透明度越低）
        const opacity = 0.75 + (ratio * 0.25);

        if (link) {
          link.style.transform = `scale(${scale})`;
          link.style.opacity = opacity;
        }
      });
    }
  }

  // 页面加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeatmap);
  } else {
    initHeatmap();
  }

  // PJAX 切换后执行
  document.addEventListener('pjax:complete', initHeatmap);

  // 延迟执行，确保元素已渲染
  setTimeout(initHeatmap, 100);
})();

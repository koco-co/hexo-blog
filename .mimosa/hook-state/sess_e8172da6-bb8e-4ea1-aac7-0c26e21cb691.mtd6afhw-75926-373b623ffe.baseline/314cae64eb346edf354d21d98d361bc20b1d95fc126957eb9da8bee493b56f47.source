// 文章页标签样式美化 - 逐个属性设置版本
(function() {
  'use strict';

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  ];

  function applyStyles() {
    const tags = document.querySelectorAll('.post-meta__tags');
    console.log('[标签样式] 找到标签数量:', tags.length);

    tags.forEach((tag, index) => {
      const gradient = gradients[index % gradients.length];

      // 逐个设置样式属性，确保 !important 生效
      tag.style.setProperty('display', 'inline-flex', 'important');
      tag.style.setProperty('align-items', 'center', 'important');
      tag.style.setProperty('justify-content', 'center', 'important');
      tag.style.setProperty('padding', '8px 18px', 'important');
      tag.style.setProperty('border-radius', '20px', 'important');
      tag.style.setProperty('color', '#fff', 'important');
      tag.style.setProperty('font-weight', '500', 'important');
      tag.style.setProperty('font-size', '0.85em', 'important');
      tag.style.setProperty('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
      tag.style.setProperty('box-shadow', '0 3px 10px rgba(0, 0, 0, 0.08)', 'important');
      tag.style.setProperty('border', 'none', 'important');
      tag.style.setProperty('text-decoration', 'none', 'important');
      tag.style.setProperty('background', gradient, 'important');
      tag.style.setProperty('background-image', gradient, 'important');
      tag.style.setProperty('margin', '0 5px 8px 0', 'important');
      tag.style.setProperty('cursor', 'pointer', 'important');

      // 添加悬停效果
      tag.onmouseenter = function() {
        this.style.setProperty('transform', 'translateY(-3px) scale(1.05)', 'important');
        this.style.setProperty('box-shadow', '0 6px 20px rgba(0, 0, 0, 0.12)', 'important');
      };

      tag.onmouseleave = function() {
        this.style.removeProperty('transform');
        this.style.setProperty('box-shadow', '0 3px 10px rgba(0, 0, 0, 0.08)', 'important');
      };
    });

    // 样式化容器
    const containers = document.querySelectorAll('.post-meta__tag-list');
    containers.forEach(container => {
      container.style.setProperty('display', 'flex', 'important');
      container.style.setProperty('flex-wrap', 'wrap', 'important');
      container.style.setProperty('gap', '0', 'important');
      container.style.setProperty('justify-content', 'flex-start', 'important');
      container.style.setProperty('padding', '20px 0', 'important');
    });

    console.log('[标签样式] 样式已应用');
  }

  // 立即执行
  applyStyles();

  // DOMContentLoaded 时执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyStyles);
  }

  // 多次延迟执行
  const delays = [100, 300, 500, 1000, 2000];
  delays.forEach(delay => setTimeout(applyStyles, delay));

  // PJAX 切换后执行
  document.addEventListener('pjax:complete', () => {
    setTimeout(applyStyles, 100);
  });

  // 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    let needsUpdate = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.classList?.contains('post-meta__tag-list') ||
                node.classList?.contains('post-meta__tags') ||
                node.querySelector?.('.post-meta__tags')) {
              needsUpdate = true;
            }
          }
        });
      }
    });

    if (needsUpdate) {
      applyStyles();
    }
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('[标签样式] 脚本已加载');
})();

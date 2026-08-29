(() => {
  const CONFIG = {
    repo: "koco-co/hexo-blog",
    repoId: "R_kgDOUCj18w",
    categoryId: "DIC_kwDOUCj1884DEGPp",
    mapping: "pathname",
    lang: "zh-CN",
  };

  function themeUrl() {
    const file =
      document.documentElement.dataset.theme === "dark"
        ? "giscus-acrylic-dark.css"
        : "giscus-acrylic-light.css";
    return `${window.location.origin}/css/${file}`;
  }

  function updateTheme() {
    const frame = document.querySelector(
      "#giscus-wrap iframe.giscus-frame, #giscus-wrap iframe",
    );
    frame?.contentWindow?.postMessage(
      {
        giscus: {
          setConfig: { theme: themeUrl() },
        },
      },
      "https://giscus.app",
    );
  }

  function createCommentSection(post) {
    const section = document.createElement("section");
    section.id = "post-comment";
    section.innerHTML = `
      <div class="comment-head"><div class="comment-headline"><i class="fas fa-comments fa-fw" aria-hidden="true"></i><span>评论</span></div></div>
      <div id="giscus-wrap">
        <p data-giscus-consent-status>评论由 Giscus 提供。点击后才会连接 giscus.app。</p>
        <button class="external-media-consent__load" type="button" data-giscus-consent-load>加载评论</button>
      </div>`;
    post.appendChild(section);
    return section;
  }

  function loadComments(section) {
    const wrap = section.querySelector("#giscus-wrap");
    const button = section.querySelector("[data-giscus-consent-load]");
    const status = section.querySelector("[data-giscus-consent-status]");
    if (!wrap || !button || !status || wrap.dataset.giscusLoading === "true")
      return;

    wrap.dataset.giscusLoading = "true";
    button.disabled = true;
    status.textContent = "正在加载评论…";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.repo = CONFIG.repo;
    script.dataset.repoId = CONFIG.repoId;
    script.dataset.categoryId = CONFIG.categoryId;
    script.dataset.mapping = CONFIG.mapping;
    script.dataset.strict = "0";
    script.dataset.reactionsEnabled = "1";
    script.dataset.emitMetadata = "0";
    script.dataset.inputPosition = "bottom";
    script.dataset.theme = themeUrl();
    script.dataset.lang = CONFIG.lang;

    const fail = () => {
      window.clearTimeout(timeout);
      observer.disconnect();
      script.remove();
      wrap.dataset.giscusLoading = "false";
      button.disabled = false;
      status.textContent = "评论暂时无法加载，请稍后重试。";
    };
    const observer = new MutationObserver(() => {
      const frame = wrap.querySelector("iframe");
      if (!frame) return;
      window.clearTimeout(timeout);
      observer.disconnect();
      button.remove();
      status.remove();
      wrap.dataset.giscusLoading = "false";
      document.dispatchEvent(new CustomEvent("giscus:ready"));
    });
    const timeout = window.setTimeout(fail, 15000);
    observer.observe(wrap, { childList: true, subtree: true });

    script.addEventListener("error", fail, { once: true });

    wrap.appendChild(script);
  }

  function mount() {
    const post = document.getElementById("post");
    if (!post) return;
    const section =
      document.getElementById("post-comment") || createCommentSection(post);
    const button = section.querySelector("[data-giscus-consent-load]");
    if (button && button.dataset.giscusConsentReady !== "true") {
      button.dataset.giscusConsentReady = "true";
      button.addEventListener("click", () => loadComments(section));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
  document.addEventListener("pjax:complete", mount);

  new MutationObserver(updateTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
})();

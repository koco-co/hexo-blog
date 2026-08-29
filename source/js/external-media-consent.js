(() => {
  function mountExternalMedia() {
    for (const container of document.querySelectorAll(
      "[data-external-media]",
    )) {
      if (container.dataset.externalMediaReady === "true") continue;
      container.dataset.externalMediaReady = "true";

      const button = container.querySelector("[data-external-media-load]");
      const status = container.querySelector("[data-external-media-status]");
      const frameHost = container.querySelector("[data-external-media-frame]");
      if (!button || !status || !frameHost) continue;

      button.addEventListener("click", () => {
        const source = container.dataset.externalMediaSrc;
        const title = container.dataset.externalMediaTitle || "第三方媒体";
        if (!source) {
          status.textContent = "媒体地址不可用。";
          return;
        }

        button.disabled = true;
        status.textContent = `正在加载${title}…`;
        const frame = document.createElement("iframe");
        frame.src = source;
        frame.title = title;
        frame.loading = "lazy";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.allow = "autoplay; encrypted-media; picture-in-picture";
        frame.allowFullscreen = true;

        const fail = () => {
          window.clearTimeout(timeout);
          status.hidden = false;
          status.textContent = `${title}暂时无法加载，请稍后重试。`;
          button.disabled = false;
          frame.remove();
        };
        const timeout = window.setTimeout(fail, 15000);

        frame.addEventListener(
          "load",
          () => {
            window.clearTimeout(timeout);
            status.textContent = `${title}已加载。`;
            status.hidden = true;
          },
          { once: true },
        );
        frame.addEventListener("error", fail, { once: true });

        frameHost.replaceChildren(frame);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountExternalMedia, {
      once: true,
    });
  } else {
    mountExternalMedia();
  }
  document.addEventListener("pjax:complete", mountExternalMedia);
})();

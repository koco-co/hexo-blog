(() => {
  const MOBILE_QUERY = "(max-width: 768px)";
  const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
  const STAR_COLOR = "226, 225, 142";
  let animationFrame = 0;
  let resizeBound = false;
  let stars = [];

  function canvas() {
    return document.getElementById("universe");
  }

  function shouldAnimate() {
    return (
      document.documentElement.dataset.theme === "dark" &&
      !window.matchMedia(MOBILE_QUERY).matches &&
      !window.matchMedia(REDUCED_MOTION_QUERY).matches
    );
  }

  function resize(target) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    target.width = Math.round(width * ratio);
    target.height = Math.round(height * ratio);
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    target.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.min(180, Math.max(48, Math.round(width * 0.12)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 1.4,
      alpha: 0.2 + Math.random() * 0.65,
      speed: 0.04 + Math.random() * 0.12,
    }));
  }

  function draw(target) {
    const context = target.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const star of stars) {
      star.y -= star.speed;
      if (star.y < -2) {
        star.y = window.innerHeight + 2;
        star.x = Math.random() * window.innerWidth;
      }
      context.beginPath();
      context.fillStyle = `rgba(${STAR_COLOR}, ${star.alpha})`;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function stop() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    const target = canvas();
    target?.getContext("2d")?.clearRect(0, 0, target.width, target.height);
    if (target) target.dataset.universeState = "static";
  }

  function start() {
    const target = canvas();
    if (!target || !shouldAnimate()) {
      stop();
      return;
    }

    if (!resizeBound) {
      window.addEventListener(
        "resize",
        () => {
          const current = canvas();
          if (current) resize(current);
        },
        { passive: true },
      );
      resizeBound = true;
    }

    resize(target);
    target.dataset.universeState = "animated";
    if (animationFrame) return;

    const tick = () => {
      const current = canvas();
      if (!current || !shouldAnimate()) {
        stop();
        return;
      }
      draw(current);
      animationFrame = window.requestAnimationFrame(tick);
    };
    animationFrame = window.requestAnimationFrame(tick);
  }

  function sync() {
    if (shouldAnimate()) start();
    else stop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync, { once: true });
  } else {
    sync();
  }

  document.addEventListener("pjax:complete", sync);
  window.matchMedia(MOBILE_QUERY).addEventListener("change", sync);
  window.matchMedia(REDUCED_MOTION_QUERY).addEventListener("change", sync);

  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
})();

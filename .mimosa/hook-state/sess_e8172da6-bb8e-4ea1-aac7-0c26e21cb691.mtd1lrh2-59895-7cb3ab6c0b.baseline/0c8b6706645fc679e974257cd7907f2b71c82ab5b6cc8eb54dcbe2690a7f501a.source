(() => {
  'use strict';

  const NAV_ID = 'hfc-sync-nav';
  const GISCUS_PROMPT_ID = 'hfc-giscus-auth-prompt';
  // Giscus keeps an opaque OAuth session marker in the host page's storage.
  // We only check whether it exists; the session is never read or reused.
  const GISCUS_SESSION_KEY = 'giscus-session';
  let panelObserver = null;
  let globalAuthController = null;
  let giscusPromptTimer = null;
  let giscusAuthState = 'unknown';
  let reviewAuthenticated = false;

  function getPanel() {
    return document.querySelector('[data-hfc-sync]');
  }

  function getNav() {
    return document.getElementById(NAV_ID);
  }

  function getGiscusFrame() {
    return document.querySelector('#giscus-wrap iframe.giscus-frame, #giscus-wrap iframe');
  }

  function getGiscusOrigin(frame = getGiscusFrame()) {
    if (!frame) return '';
    try {
      return new URL(frame.src, window.location.href).origin;
    } catch (error) {
      return '';
    }
  }

  function readGiscusAuthState() {
    try {
      const rawSession = window.localStorage.getItem(GISCUS_SESSION_KEY);
      if (!rawSession) return 'unauthenticated';
      return JSON.parse(rawSession) ? 'authenticated' : 'unauthenticated';
    } catch (error) {
      return 'unknown';
    }
  }

  function isGiscusMessage(event) {
    const frame = getGiscusFrame();
    if (!frame || event.source !== frame.contentWindow) return false;
    const origin = getGiscusOrigin(frame);
    return Boolean(origin && event.origin === origin);
  }

  function getGlobalSyncConfig() {
    try {
      return JSON.parse(document.getElementById('hfc-sync-config-data')?.textContent || '{}');
    } catch (error) {
      return {};
    }
  }

  function disposeGlobalAuth() {
    globalAuthController?.dispose();
    globalAuthController = null;
  }

  function clearGiscusPromptTimer() {
    if (giscusPromptTimer) window.clearTimeout(giscusPromptTimer);
    giscusPromptTimer = null;
  }

  function removeGiscusPrompt() {
    document.getElementById(GISCUS_PROMPT_ID)?.remove();
  }

  function removeNav() {
    panelObserver?.disconnect();
    panelObserver = null;
    clearGiscusPromptTimer();
    removeGiscusPrompt();
    disposeGlobalAuth();
    getNav()?.remove();
  }

  function focusGiscus() {
    const comments = document.querySelector('#post-comment, #giscus-wrap');
    comments?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => getGiscusFrame()?.focus({ preventScroll: true }), 350);
  }

  function renderGiscusPrompt() {
    const wrap = document.querySelector('#giscus-wrap');
    if (!wrap || !reviewAuthenticated || giscusAuthState !== 'unauthenticated' || !getGiscusFrame()) {
      removeGiscusPrompt();
      return;
    }

    let prompt = document.getElementById(GISCUS_PROMPT_ID);
    if (!prompt) {
      prompt = document.createElement('div');
      prompt.id = GISCUS_PROMPT_ID;
      prompt.className = 'hfc-giscus-auth-prompt';
      prompt.setAttribute('role', 'status');
      prompt.innerHTML = `
        <div class="hfc-giscus-auth-prompt__copy">
          <strong>复习已登录</strong>
          <span>评论还需要一次 GitHub 授权</span>
        </div>
        <button class="hfc-giscus-auth-prompt__action" type="button">打开评论授权</button>`;
      prompt.querySelector('button').addEventListener('click', focusGiscus);
      wrap.insertBefore(prompt, wrap.firstChild);
    }
  }

  function refreshGiscusUi() {
    const nav = getNav();
    const commentStatus = nav?.querySelector('[data-hfc-sync-nav-comment-status]');
    const commentAction = nav?.querySelector('[data-hfc-sync-nav-giscus]');
    const hasFrame = Boolean(getGiscusFrame());
    if (hasFrame && giscusAuthState === 'unknown') giscusAuthState = readGiscusAuthState();
    const commentLabel = {
      authenticated: '评论授权已完成',
      unauthenticated: '评论尚未授权',
      unknown: '评论授权待确认'
    }[giscusAuthState];

    if (commentStatus) {
      commentStatus.textContent = `评论：${commentLabel}`;
      commentStatus.hidden = !reviewAuthenticated || giscusAuthState === 'unknown';
    }
    if (commentAction) {
      commentAction.hidden = !reviewAuthenticated || giscusAuthState !== 'unauthenticated' || !hasFrame;
    }

    if (giscusAuthState === 'unauthenticated') renderGiscusPrompt();
    else removeGiscusPrompt();
  }

  function setGiscusAuthState(nextState) {
    if (!['authenticated', 'unauthenticated', 'unknown'].includes(nextState)) return;
    giscusAuthState = nextState;
    refreshGiscusUi();
  }

  function handleGiscusMessage(event) {
    if (!isGiscusMessage(event)) return;
    const message = event.data?.giscus;
    if (!message || typeof message !== 'object') return;

    if (message.signOut) {
      setGiscusAuthState('unauthenticated');
      return;
    }

    if (typeof message.error === 'string'
      && /Bad credentials|Invalid state value|State has expired/.test(message.error)) {
      setGiscusAuthState('unauthenticated');
    }
  }

  function scheduleGiscusPrompt() {
    clearGiscusPromptTimer();
    if (!reviewAuthenticated || giscusAuthState === 'authenticated') {
      refreshGiscusUi();
      return;
    }

    let attempts = 0;
    const check = () => {
      refreshGiscusUi();
      if (!reviewAuthenticated || giscusAuthState === 'authenticated') return;
      if (getGiscusFrame() && attempts >= 3) {
        renderGiscusPrompt();
        refreshGiscusUi();
        return;
      }
      if (attempts >= 16) return;
      attempts += 1;
      giscusPromptTimer = window.setTimeout(check, 300);
    };
    check();
  }

  function createNav() {
    const nav = document.createElement('div');
    nav.id = NAV_ID;
    nav.className = 'hfc-sync-nav';
    nav.innerHTML = `
      <button class="site-page hfc-sync-nav__trigger" type="button" aria-label="使用 GitHub 登录" aria-haspopup="true" aria-expanded="false">
        <i class="fab fa-github" data-hfc-sync-nav-icon aria-hidden="true"></i>
        <span data-hfc-sync-nav-label>登录</span>
        <img class="hfc-sync-nav__avatar" data-hfc-sync-nav-avatar alt="GitHub 头像" decoding="async" referrerpolicy="no-referrer" hidden>
      </button>
      <div class="hfc-sync-nav__popover" data-hfc-sync-nav-popover hidden>
        <span class="hfc-sync-nav__status" data-hfc-sync-nav-status>未登录，进度仅保存在此浏览器</span>
        <span class="hfc-sync-nav__comment-status" data-hfc-sync-nav-comment-status hidden>评论：评论授权待确认</span>
        <div class="hfc-sync-nav__actions">
          <button class="hfc-sync-nav__action hfc-sync-nav__action--primary" type="button" data-hfc-sync-nav-giscus hidden>打开评论授权</button>
          <button class="hfc-sync-nav__action" type="button" data-hfc-sync-nav-logout hidden>退出登录</button>
        </div>
      </div>`;

    const trigger = nav.querySelector('.hfc-sync-nav__trigger');
    const popover = nav.querySelector('[data-hfc-sync-nav-popover]');
    const avatar = nav.querySelector('[data-hfc-sync-nav-avatar]');

    avatar.addEventListener('load', () => {
      avatar.dataset.hfcLoaded = 'true';
      avatar.hidden = false;
      nav.querySelector('[data-hfc-sync-nav-icon]').hidden = true;
    });

    avatar.addEventListener('error', () => {
      avatar.dataset.hfcLoaded = 'false';
      avatar.hidden = true;
      avatar.removeAttribute('src');
      nav.querySelector('[data-hfc-sync-nav-icon]').hidden = false;
    });

    trigger.addEventListener('click', () => {
      const panel = getPanel();
      const login = panel?.querySelector('[data-hfc-login]');
      if (login && !login.hidden) {
        login.click();
        return;
      }
      if (nav.dataset.hfcAuthenticated !== 'true' && globalAuthController) {
        globalAuthController.signIn();
        return;
      }

      const opening = popover.hidden;
      popover.hidden = !opening;
      trigger.setAttribute('aria-expanded', String(opening));
    });

    nav.querySelector('[data-hfc-sync-nav-logout]').addEventListener('click', () => {
      const logout = getPanel()?.querySelector('[data-hfc-logout]');
      if (logout && !logout.hidden) logout.click();
      else globalAuthController?.signOut();
      popover.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    });

    nav.querySelector('[data-hfc-sync-nav-giscus]').addEventListener('click', () => {
      focusGiscus();
      popover.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    });

    return nav;
  }

  function renderNavState({ authenticated, avatarUrl = '', state = 'local', status, logoutVisible }) {
    const nav = getNav();
    if (!nav) return;
    const trigger = nav.querySelector('.hfc-sync-nav__trigger');
    const icon = nav.querySelector('[data-hfc-sync-nav-icon]');
    const label = nav.querySelector('[data-hfc-sync-nav-label]');
    const avatar = nav.querySelector('[data-hfc-sync-nav-avatar]');
    const hasAvatar = authenticated && Boolean(avatarUrl);
    const avatarLoaded = hasAvatar
      && avatar.dataset.hfcLoaded === 'true'
      && avatar.getAttribute('src') === avatarUrl;

    nav.dataset.hfcSyncState = state;
    nav.dataset.hfcAuthenticated = String(authenticated);
    reviewAuthenticated = authenticated;
    nav.querySelector('[data-hfc-sync-nav-status]').textContent = status;
    nav.querySelector('[data-hfc-sync-nav-logout]').hidden = !logoutVisible;
    trigger.setAttribute('aria-label', authenticated ? 'GitHub 账号与同步状态' : '使用 GitHub 登录');
    label.hidden = authenticated;
    icon.className = 'fab fa-github';
    icon.hidden = avatarLoaded;
    avatar.hidden = !avatarLoaded;

    if (hasAvatar) {
      if (avatar.getAttribute('src') !== avatarUrl) {
        avatar.dataset.hfcLoaded = 'false';
        avatar.hidden = true;
        icon.hidden = false;
        avatar.src = avatarUrl;
      }
    } else {
      avatar.dataset.hfcLoaded = 'false';
      avatar.removeAttribute('src');
    }

    refreshGiscusUi();
  }

  function syncNavState() {
    const panel = getPanel();
    const nav = getNav();
    if (!panel || !nav) return;

    const state = panel.dataset.hfcSyncState || 'local';
    const status = panel.querySelector('[data-hfc-sync-status]')?.textContent?.trim() || '复习进度同步';
    const login = panel.querySelector('[data-hfc-login]');
    const logout = panel.querySelector('[data-hfc-logout]');
    const authenticated = Boolean(login?.hidden);
    const avatarUrl = panel.dataset.hfcAvatarUrl || '';

    renderNavState({
      authenticated,
      avatarUrl,
      state,
      status,
      logoutVisible: logout?.hidden === false
    });
    if (authenticated) scheduleGiscusPrompt();
  }

  function syncGlobalAuthState(state) {
    const labels = {
      authorizing: '正在前往 GitHub 登录…',
      error: 'GitHub 登录状态暂不可用',
      local: '未登录，复习进度仅保存在此浏览器',
      ready: '已登录 GitHub，复习进度会在复习页自动同步',
      unavailable: '云同步配置不可用'
    };
    renderNavState({
      authenticated: state.authenticated,
      avatarUrl: state.avatarUrl,
      state: state.status,
      status: labels[state.status] || 'GitHub 账号',
      logoutVisible: state.authenticated
    });
    if (state.authenticated && state.status === 'ready') scheduleGiscusPrompt();
    else if (!state.authenticated) {
      clearGiscusPromptTimer();
      removeGiscusPrompt();
    }
  }

  function mount() {
    const panel = getPanel();
    const menus = document.getElementById('menus');
    if (!menus) {
      removeNav();
      return;
    }

    let nav = getNav();
    if (!nav) {
      nav = createNav();
      menus.appendChild(nav);
    }

    panelObserver?.disconnect();
    panelObserver = null;
    if (!panel) {
      const config = getGlobalSyncConfig();
      if (!config.enabled || !window.HFC_SYNC?.createAuthController) {
        removeNav();
        return;
      }
      disposeGlobalAuth();
      globalAuthController = window.HFC_SYNC.createAuthController({
        config,
        onState: syncGlobalAuthState
      });
      globalAuthController.init();
      return;
    }

    disposeGlobalAuth();
    panelObserver = new MutationObserver(syncNavState);
    panelObserver.observe(panel, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['data-hfc-sync-state', 'data-hfc-avatar-url', 'hidden']
    });
    syncNavState();
  }

  document.addEventListener('click', event => {
    const nav = getNav();
    if (!nav || nav.contains(event.target)) return;
    const popover = nav.querySelector('[data-hfc-sync-nav-popover]');
    const trigger = nav.querySelector('.hfc-sync-nav__trigger');
    if (popover) popover.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('message', handleGiscusMessage);

  document.addEventListener('DOMContentLoaded', mount);
  document.addEventListener('pjax:complete', () => window.setTimeout(() => {
    giscusAuthState = 'unknown';
    mount();
    if (reviewAuthenticated) scheduleGiscusPrompt();
  }, 0));
})();

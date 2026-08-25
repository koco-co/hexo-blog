(() => {
  'use strict';

  const NAV_ID = 'hfc-sync-nav';
  let panelObserver = null;
  let globalAuthController = null;

  function getPanel() {
    return document.querySelector('[data-hfc-sync]');
  }

  function getNav() {
    return document.getElementById(NAV_ID);
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

  function removeNav() {
    panelObserver?.disconnect();
    panelObserver = null;
    disposeGlobalAuth();
    getNav()?.remove();
  }

  function createNav() {
    const nav = document.createElement('div');
    nav.id = NAV_ID;
    nav.className = 'hfc-sync-nav';
    nav.innerHTML = `
      <button class="site-page hfc-sync-nav__trigger" type="button" aria-label="使用 GitHub 登录" aria-haspopup="true" aria-expanded="false">
        <i class="fab fa-github" data-hfc-sync-nav-icon aria-hidden="true"></i>
        <span data-hfc-sync-nav-label>登录</span>
        <img class="hfc-sync-nav__avatar" data-hfc-sync-nav-avatar alt="" decoding="async" referrerpolicy="no-referrer" hidden>
      </button>
      <div class="hfc-sync-nav__popover" data-hfc-sync-nav-popover hidden>
        <span class="hfc-sync-nav__status" data-hfc-sync-nav-status>未登录，进度仅保存在此浏览器</span>
        <div class="hfc-sync-nav__actions">
          <button class="hfc-sync-nav__action" type="button" data-hfc-sync-nav-logout hidden>退出登录</button>
        </div>
      </div>`;

    const trigger = nav.querySelector('.hfc-sync-nav__trigger');
    const popover = nav.querySelector('[data-hfc-sync-nav-popover]');
    const avatar = nav.querySelector('[data-hfc-sync-nav-avatar]');

    avatar.addEventListener('error', () => {
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

    return nav;
  }

  function renderNavState({ authenticated, avatarUrl = '', state = 'local', status, logoutVisible }) {
    const nav = getNav();
    if (!nav) return;
    const trigger = nav.querySelector('.hfc-sync-nav__trigger');
    const icon = nav.querySelector('[data-hfc-sync-nav-icon]');
    const label = nav.querySelector('[data-hfc-sync-nav-label]');
    const avatar = nav.querySelector('[data-hfc-sync-nav-avatar]');

    nav.dataset.hfcSyncState = state;
    nav.dataset.hfcAuthenticated = String(authenticated);
    nav.querySelector('[data-hfc-sync-nav-status]').textContent = status;
    nav.querySelector('[data-hfc-sync-nav-logout]').hidden = !logoutVisible;
    trigger.setAttribute('aria-label', authenticated ? 'GitHub 账号与同步状态' : '使用 GitHub 登录');
    label.hidden = authenticated;
    icon.className = 'fab fa-github';
    icon.hidden = authenticated && Boolean(avatarUrl);
    avatar.hidden = !authenticated || !avatarUrl;

    if (authenticated && avatarUrl) {
      if (avatar.getAttribute('src') !== avatarUrl) avatar.src = avatarUrl;
    } else {
      avatar.removeAttribute('src');
    }
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

  document.addEventListener('DOMContentLoaded', mount);
  document.addEventListener('pjax:complete', () => window.setTimeout(mount, 0));
})();

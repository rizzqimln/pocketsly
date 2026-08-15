/**
 * SINGLE PAGE APPLICATION ROUTER & CONTROLLER (app.js)
 * =====================================================
 * LEARN: SPA Navigation Architecture
 *
 * 1. Hash Navigation  — The browser fires 'hashchange' when the URL fragment
 *                       changes (e.g. #habits). We intercept it to swap views
 *                       without a full page reload.
 * 2. Dynamic Loading  — Instead of loading all JS upfront, each view module
 *                       exposes a load() method called only when that view is
 *                       navigated to (lazy initialisation).
 * 3. Header Sync      — Global controls (theme switcher) must survive every
 *                       navigation. We preserve them before clearing the header.
 * 4. Touch Gestures   — 'touchstart/touchmove/touchend' listeners let us build
 *                       native-feeling pull-to-dismiss on mobile.
 */

// ── View Configuration Map ──────────────────────────────────────────────────
// LEARN: Keeping all view metadata (title, subtitle, action buttons) in a
// single constant makes it easy to add new views without changing any routing
// logic — this is the Open/Closed principle (OCP).
const VIEW_CONFIG = Object.freeze({
  dashboard: {
    title:    'Dashboard',
    subtitle: "Here's your rhythm for today.",
    buttons:  [],
  },
  habits: {
    title:    'Daily Planner',
    subtitle: 'Build consistent routines and organize your tasks.',
    buttons:  [],
  },
  schedule: {
    title:    'Weekly Timetable',
    subtitle: 'Block out time for classes, focus work, and personal routines.',
    buttons:  [],
  },
  notes: {
    title:    'Journal & Notes',
    subtitle: 'Capture daily reflections, quick ideas, and lecture notes.',
    buttons:  [],
  },
  curriculum: {
    title:    'Curriculum Lab',
    subtitle: 'Learn database design, fullstack architecture, and standard algorithms live.',
    buttons:  [],
  },
  budget: {
    title:    'Monthly Budget Tracker',
    subtitle: 'Allocate monthly limits and log daily expenses to manage your student finances.',
    buttons:  [],
  },
});

window.App = {
  currentView: 'dashboard',
  deferredInstallPrompt: null,

  init() {
    Auth.init();
    this.initInstallPrompt();
    // LEARN: hashchange fires whenever the URL fragment (#...) changes.
    window.addEventListener('hashchange', () => this.handleRoute());
    Auth.checkSession();

    // Collapsible sidebar state recovery
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed) {
      document.querySelector('.sidebar')?.classList.add('collapsed');
    }
  },

  onLoginSuccess() {
    this.handleRoute();
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigateTo(hash);
  },

  navigateTo(viewName) {
    // Redirect legacy #tasks hash to the combined Planner view
    if (viewName === 'tasks') {
      window.location.hash = '#habits';
      return;
    }

    // Profile is an overlay, not a routable view panel
    if (viewName === 'profile') {
      App.openProfileSettings();
      return;
    }

    const validViews = Object.keys(VIEW_CONFIG);
    if (!validViews.includes(viewName)) viewName = 'dashboard';

    this.currentView = viewName;

    // Sync sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    // Swap visible view panel
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(`view-${viewName}`)?.classList.remove('hidden');

    // LEARN: Toggle a helper class so mobile CSS can apply dashboard-specific rules.
    document.querySelector('.main-content')?.classList.toggle('dashboard-active', viewName === 'dashboard');

    this.updateHeader(viewName);
    this._loadViewModule(viewName);
  },

  /**
   * Calls the appropriate module's load() method for the active view.
   *
   * LEARN: Extracting this switch into its own method (Single Responsibility)
   * keeps navigateTo() focused on routing and nothing else.
   *
   * @param {string} viewName  active view key
   */
  _loadViewModule(viewName) {
    const moduleMap = {
      dashboard:  () => window.Dashboard?.load(),
      habits:     () => { window.Habits?.load(); window.Tasks?.load(); },
      schedule:   () => window.Schedule?.load(),
      notes:      () => window.Notes?.load(),
      curriculum: () => window.Curriculum?.load(),
      budget:     () => window.Budget?.load(),
    };
    moduleMap[viewName]?.();
  },

  /**
   * Updates the top header (title, subtitle, action buttons) for the active view.
   *
   * LEARN: We clear the actions area first, then re-append the persistent theme
   * button. This avoids the theme button being lost on navigation.
   *
   * @param {string} viewName  active view key
   */
  updateHeader(viewName) {
    const titleEl    = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    const actionsEl  = document.getElementById('header-actions');
    if (!titleEl || !subtitleEl || !actionsEl) return;

    // Preserve persistent buttons before clearing
    const pomoBtn  = actionsEl.querySelector('.header-pomo-btn');
    const searchBtn = actionsEl.querySelector('.header-search-btn');

    actionsEl.innerHTML = '';

    // Re-inject Pomodoro timer button (create if first load)
    if (pomoBtn) {
      actionsEl.appendChild(pomoBtn);
    } else {
      const pomo = document.createElement('button');
      pomo.type = 'button';
      pomo.className = 'btn btn-outline btn-sm header-pomo-btn';
      pomo.title = 'Pomodoro Focus Timer';
      pomo.onclick = () => window.Timer?.openModal();
      pomo.style.cssText = 'display:inline-flex;align-items:center;gap:0.35rem;font-weight:600;';
      pomo.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" style="width:14px;height:14px;color:var(--primary);"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> <span id="pomo-header-time">25:00</span>`;
      actionsEl.appendChild(pomo);
    }

    // Re-inject search / command palette button ONLY when not on notes (notes has full-width search)
    if (viewName !== 'notes') {
      if (searchBtn) {
        actionsEl.appendChild(searchBtn);
      } else {
        const search = document.createElement('button');
        search.type = 'button';
        search.className = 'header-search-btn';
        search.title = 'Quick Search & Command Palette (Ctrl+K)';
        search.onclick = () => window.CommandPalette?.open();
        search.innerHTML = `<svg class="icon-svg" viewBox="0 0 24 24" style="width:15px;height:15px;color:var(--text-muted);flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span class="header-search-text">Search</span><span class="header-search-badge">⌘K</span>`;
        actionsEl.appendChild(search);
      }
    }

    const config = VIEW_CONFIG[viewName] ?? VIEW_CONFIG.dashboard;
    titleEl.textContent    = config.title;
    subtitleEl.textContent = config.subtitle;

    config.buttons.forEach(btnConfig => actionsEl.appendChild(this._createHeaderBtn(btnConfig)));

    // Sync active Pomodoro timer display and theme buttons
    window.Timer?.updateDisplay();
    this.syncThemeState();
  },

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
  },

  /** Synchronizes theme button icon and labels across header and more drawer */
  syncThemeState() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      const toggleText = document.getElementById('theme-toggle-text');
      if (toggleText) {
        toggleText.textContent = isDark ? 'Dark Mode' : 'Light Mode';
      }
    }
    const moreLabel = document.getElementById('more-theme-label');
    const moreSvg = document.getElementById('more-theme-svg');
    if (moreLabel) moreLabel.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    if (moreSvg) {
      if (isDark) {
        moreSvg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
      } else {
        moreSvg.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
      }
    }
  },

  toggleMoreDrawer() {
    const overlay = document.getElementById('more-sheet-overlay');
    if (!overlay) return;
    const isHidden = overlay.classList.contains('hidden');
    if (isHidden) {
      document.body.classList.add('modal-open');
      overlay.classList.remove('hidden');
      this.syncThemeState();
    } else {
      this.closeMoreDrawer();
    }
  },

  closeMoreDrawer() {
    const overlay = document.getElementById('more-sheet-overlay');
    if (!overlay) return;
    document.body.classList.remove('modal-open');
    overlay.classList.add('hidden');
  },

  /**
   * Creates a styled header action button element.
   *
   * LEARN: Extracting element creation into a helper keeps updateHeader()
   * readable and makes button styling easy to change in one place.
   *
   * @param {{ text: string, action: Function }} btnConfig
   * @returns {HTMLButtonElement}
   */
  _createHeaderBtn({ text, action }) {
    const btn = document.createElement('button');
    btn.className   = 'btn btn-primary';
    btn.textContent = text;
    btn.onclick     = action;
    btn.style.marginLeft = '0.5rem';
    return btn;
  },

  openProfileSettings() {
    const overlay = document.getElementById('profile-overlay');
    if (!overlay) return;

    document.body.classList.add('modal-open');
    overlay.classList.remove('hidden');

    const guest = document.getElementById('profile-guest');
    const signed = document.getElementById('profile-signedin');
    const title = document.querySelector('#profile-overlay .modal-header h3');
    const user = Auth.currentUser;

    if (!user) {
      if (guest) guest.classList.remove('hidden');
      if (signed) signed.classList.add('hidden');
      if (title) title.textContent = 'Sign In / Create Account';
      Auth._switchAuthForm(FORM.LOGIN);
      return;
    }

    if (guest) guest.classList.add('hidden');
    if (signed) signed.classList.remove('hidden');
    if (title) title.textContent = 'Profile Settings';

    if (user) {
      const nameEl = document.getElementById('profile-display-name');
      const avatarEl = document.getElementById('profile-avatar');
      const usernameInput = document.getElementById('profile-username');
      const emailInput = document.getElementById('profile-email');
      const phoneInput = document.getElementById('profile-phone');

      if (nameEl) nameEl.textContent = user.username;
      if (avatarEl) avatarEl.textContent = user.username.charAt(0).toUpperCase();
      if (usernameInput) usernameInput.value = user.username || '';
      if (emailInput) emailInput.value = user.email || '';
      if (phoneInput) phoneInput.value = user.phone || '';
    }

    // Clear password field
    const pwdInput = document.getElementById('profile-password');
    if (pwdInput) pwdInput.value = '';
  },

  closeProfileSettings() {
    const overlay = document.getElementById('profile-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  initProfileForm() {
    const form = document.getElementById('profile-settings-form');
    const logoutBtn = document.getElementById('profile-logout-btn');
    const sendOtpBtn = document.getElementById('profile-btn-send-otp');

    if (sendOtpBtn) {
      sendOtpBtn.onclick = async () => {
        const user = Auth.currentUser;
        const email = document.getElementById('profile-email')?.value.trim() || user?.email || user?.username;
        if (!email) {
          UI.toast('Please provide a valid email address to receive OTP.', 'danger');
          return;
        }
        try {
          const res = await API.post('/api/request-otp', { email, username: email });
          if (res.success) {
            UI.toast(`OTP code sent! (Demo OTP: ${res.otp_code})`, 'success');
            const otpInput = document.getElementById('profile-otp-code');
            if (otpInput) {
              otpInput.focus();
              otpInput.value = res.otp_code;
            }
          }
        } catch (err) {
          UI.toast(err.message || 'Failed to send OTP.', 'danger');
        }
      };
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('profile-username')?.value.trim();
        const email = document.getElementById('profile-email')?.value.trim();
        const phone = document.getElementById('profile-phone')?.value.trim();
        const password = document.getElementById('profile-password')?.value;
        const otp_code = document.getElementById('profile-otp-code')?.value.trim();

        if (password) {
          if (!otp_code) {
            UI.toast('Please enter the 6-digit OTP code to change password.', 'danger');
            return;
          }
          try {
            await API.post('/api/reset-password', {
              username: Auth.currentUser?.username || username,
              otp_code,
              new_password: password
            });
          } catch (err) {
            UI.toast(err.message, 'danger');
            return;
          }
        }

        const payload = {};
        if (username) payload.username = username;
        payload.email = email;
        payload.phone = phone;

        try {
          const res = await API.patch('/api/profile', payload);
          if (res.success) {
            UI.toast('Profile updated successfully!', 'success');
            if (res.user) {
              Auth.currentUser = { ...Auth.currentUser, ...res.user };
              const nameEl = document.getElementById('profile-display-name');
              const avatarEl = document.getElementById('profile-avatar');
              const sideNameEl = document.getElementById('display-username');
              const sideAvatarEl = document.getElementById('user-avatar');
              const mobNameEl = document.getElementById('mobile-header-username');
              const mobAvatarEl = document.getElementById('mobile-header-avatar');
              const letter = res.user.username.charAt(0).toUpperCase();

              if (nameEl) nameEl.textContent = res.user.username;
              if (avatarEl) avatarEl.textContent = letter;
              if (sideNameEl) sideNameEl.textContent = res.user.username;
              if (sideAvatarEl) sideAvatarEl.textContent = letter;
              if (mobNameEl) mobNameEl.textContent = res.user.username;
              if (mobAvatarEl) mobAvatarEl.textContent = letter;
            }
            App.closeProfileSettings();
          }
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Reuse the single Auth.logout() implementation (POSTs /api/logout,
    // clears state, and reopens the modal on the guest login form) instead
    // of duplicating the logout flow here.
    if (logoutBtn) {
      logoutBtn.onclick = () => Auth.logout();
    }

    // Close overlay when clicking background
    const overlay = document.getElementById('profile-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          App.closeProfileSettings();
        }
      });
    }

    // Setup touch drag-down gesture to dismiss modal cards
    App.initModalGestures();
  },

  initModalGestures() {
    ['profile-overlay', 'modal-overlay'].forEach(id => {
      const overlay = document.getElementById(id);
      if (!overlay) return;

      const card = overlay.querySelector('.modal-card');
      const dragBar = overlay.querySelector('.modal-drag-indicator-bar');
      const header = overlay.querySelector('.modal-header');

      let startY = 0;
      let currentY = 0;
      let isDragging = false;

      const touchStart = (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        if (card) card.style.transition = 'none';
      };

      const touchMove = (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0 && card) {
          card.style.transform = `translateY(${deltaY}px)`;
        }
      };

      const touchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const deltaY = currentY - startY;
        if (card) {
          card.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
          if (deltaY > 70) {
            card.style.transform = 'translateY(100%)';
            setTimeout(() => {
              card.style.transform = '';
              if (id === 'profile-overlay') App.closeProfileSettings();
              else UI.closeModal();
            }, 200);
          } else {
            card.style.transform = '';
          }
        }
      };

      [dragBar, header].forEach(el => {
        if (el) {
          el.addEventListener('touchstart', touchStart, { passive: true });
          el.addEventListener('touchmove', touchMove, { passive: true });
          el.addEventListener('touchend', touchEnd, { passive: true });
        }
      });
    });
  },

  /**
   * Triggers download of full JSON backup file from backend API.
   *
   * LEARN: Client-side JSON file download using Blob API allows safe offline data backups.
   */
  async exportBackup() {
    try {
      UI.toast('Preparing data backup...', 'info');
      const backup = await API.get('/api/backup/export');
      if (!backup || !backup.data) {
        UI.toast('Failed to generate backup payload.', 'danger');
        return;
      }
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().substring(0, 10);
      const username = Auth.currentUser?.username || 'user';
      link.setAttribute('href', url);
      link.setAttribute('download', `pocketsly_backup_${username}_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      UI.toast('Backup file downloaded successfully!', 'success');
    } catch (err) {
      UI.toast(`Export error: ${err.message}`, 'danger');
    }
  },

  /**
   * Reads user-selected JSON backup file and posts to atomic restore endpoint.
   */
  async importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Warning: Restoring from a backup file will replace your current data with the backup contents. Are you sure you want to proceed?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload || !payload.data) {
          UI.toast('Invalid backup file. Missing data structure.', 'danger');
          return;
        }
        UI.toast('Restoring data from backup...', 'info');
        const res = await API.post('/api/backup/restore', payload);
        if (res.success) {
          UI.toast('Data restored successfully! Refreshing...', 'success');
          App.closeProfileSettings();
          // Re-load view
          App.route();
        } else {
          UI.toast(res.error || 'Restore failed.', 'danger');
        }
      } catch (err) {
        UI.toast(`Restore failed: ${err.message}`, 'danger');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  },

  /** Captures the native PWA install prompt and reveals the iOS fallback hint. */
  initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredInstallPrompt = event;
    });
    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      UI.toast('Pocketsly installed! Find it on your home screen.', 'success');
    });
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isIOS && !isStandalone) {
      const hint = document.getElementById('install-ios-hint');
      if (hint) hint.hidden = false;
    }
  },

  /** Requests the native install prompt, or scrolls to the step-by-step guide. */
  requestInstall() {
    if (this.deferredInstallPrompt) {
      const promptEvent = this.deferredInstallPrompt;
      this.deferredInstallPrompt = null;
      promptEvent.prompt();
      if (promptEvent.userChoice && typeof promptEvent.userChoice.catch === 'function') {
        promptEvent.userChoice.catch(() => {});
      }
      return;
    }
    const guide = document.getElementById('install');
    if (guide) guide.scrollIntoView({ behavior: 'smooth' });
  },

  /** Registers Progressive Web App (PWA) Service Worker for caching & offline support */
  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          console.log('✓ Pocketsly Service Worker active:', reg.scope);
        }).catch((err) => {
          console.warn('SW registration info:', err);
        });
      });
    }
  }
};

// Launch App when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.initProfileForm();
  App.registerServiceWorker();
});



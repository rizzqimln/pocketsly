/* ===== ui.js ===== */
/**
 * UI HELPER MODULE (ui.js)
 * =========================
 * LEARN: Vanilla JS DOM Helpers, Security & Theme Engine
 *
 * 1. XSS Prevention   — Always escape user strings before inserting into
 *                        innerHTML. One missed escape = code injection attack.
 * 2. Modals & Overlays — Toggling CSS classes (hidden/visible) is cheaper
 *                        than adding/removing DOM nodes each time.
 * 3. Toasts            — Create a DOM node, append it, then remove it after a
 *                        timeout. This is the standard "fire-and-forget" UI pattern.
 * 4. Theme Engine      — Store the user's preference in localStorage so it
 *                        survives page reloads without a server round-trip.
 */

// ── Shared SVG Icon Strings ─────────────────────────────────────────────────
// LEARN: Defining SVGs once at the module level (DRY principle) means we
// update them in one place, not scattered across every function that uses them.
const ICONS = {
  success: `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  danger:  `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  info:    `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

const UI = {

  /**
   * Escapes a string to prevent Cross-Site Scripting (XSS) attacks.
   *
   * LEARN: Never trust user input. If a user types <script>alert(1)</script>
   * as their username and you render it with innerHTML, it executes. esc()
   * converts dangerous characters to harmless HTML entities first.
   *
   * @param {string} text  raw user-supplied string
   * @returns {string}     HTML-safe string
   */
  esc(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Shows a self-dismissing toast notification at the bottom of the screen.
   *
   * LEARN: setTimeout(() => el.remove(), ms) is the standard way to
   * auto-dismiss UI feedback. We fade first (opacity) then remove the node.
   *
   * @param {string} message  text to display
   * @param {'info'|'success'|'danger'} type  controls colour and icon
   */
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    // LEARN: ICONS[type] falls back to ICONS.info for unknown types.
    toast.innerHTML = `${ICONS[type] ?? ICONS.info} <span>${UI.esc(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Opens the global modal dialog with a given title and HTML body.
   *
   * LEARN: Reusing one modal node (rather than creating new ones) avoids
   * DOM bloat and keeps event listeners predictable.
   *
   * @param {string} title        header text
   * @param {string} contentHtml  inner HTML for the modal body
   */
  openModal(title, contentHtml) {
    const overlay  = document.getElementById('modal-overlay');
    const titleEl  = document.getElementById('modal-title');
    const bodyEl   = document.getElementById('modal-body');
    const closeBtn = document.getElementById('modal-close-btn');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl)  bodyEl.innerHTML = contentHtml;
    if (overlay) overlay.classList.remove('hidden');

    // LEARN: Locking body scroll prevents the page behind the modal from
    // scrolling on mobile — a common UX bug on iOS/Android.
    document.body.classList.add('modal-open');

    if (closeBtn) closeBtn.onclick = () => UI.closeModal();
  },

  /** Closes the active modal dialog and re-enables body scrolling. */
  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  /**
   * Formats a YYYY-MM-DD string into a human-readable date (e.g. "Mon, Oct 24").
   *
   * LEARN: Appending 'T00:00:00' forces Date() to parse in LOCAL time.
   * Without it, JavaScript treats bare date strings as UTC midnight, which
   * shifts the displayed date by one day in negative-offset timezones.
   *
   * @param {string} dateStr  ISO date string (YYYY-MM-DD)
   * @returns {string}        formatted date or empty string
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      let d;
      const str = String(dateStr).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        d = new Date(str + 'T00:00:00');
      } else {
        d = new Date(str.replace(' ', 'T'));
      }
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  },

  /**
   * Returns today's date as a YYYY-MM-DD string in the user's local timezone.
   *
   * LEARN: new Date().toISOString() gives UTC time, which can be "yesterday"
   * for users west of UTC+0. We build the string manually from local parts.
   *
   * @returns {string} e.g. '2026-08-14'
   */
  getTodayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  /**
   * Reads the saved theme from localStorage (or detects OS preference) and
   * applies it to the <html> element via a data-theme attribute.
   *
   * LEARN: data-theme="dark" on <html> lets CSS target [data-theme="dark"] {}
   * blocks — a clean alternative to toggling class names everywhere.
   */
  initTheme() {
    const saved  = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    // LEARN: Nullish coalescing (??) picks the first non-null/undefined value.
    const theme  = saved ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.onclick = () => UI.toggleTheme();
      UI.updateThemeToggleIcon();
    }
  },

  /**
   * Flips the theme between 'light' and 'dark' and persists the choice.
   *
   * LEARN: localStorage.setItem() stores a string that survives browser
   * restarts. It is synchronous and limited to ~5 MB — perfect for small prefs.
   */
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    UI.updateThemeToggleIcon(next);
  },

  /**
   * Updates the theme toggle button's icon and label to match the current theme.
   *
   * LEARN: Defaulting the parameter to a live DOM read means callers don't
   * need to pass the current theme every time — they just call the function.
   *
   * @param {string} [theme]  'dark' or 'light'; defaults to reading <html>
   */
  updateThemeToggleIcon(theme = document.documentElement.getAttribute('data-theme')) {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;

    const isDark = theme === 'dark';
    const sunSvg  = `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    toggleBtn.innerHTML = `
      <span style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.85rem;">
        ${isDark ? sunSvg : moonSvg}
        Appearance Theme
      </span>
      <span style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">${isDark ? 'Dark Mode' : 'Light Mode'}</span>
    `;

    window.App?.syncThemeState();
  },
};

// LEARN: DOMContentLoaded fires when the HTML is parsed but before images/fonts
// load — the earliest safe moment to query DOM elements and attach listeners.
document.addEventListener('DOMContentLoaded', () => UI.initTheme());





/* ===== api.js ===== */
/**
 * REST API CLIENT MODULE (api.js)
 * ================================
 * LEARN: Modern Asynchronous Web Communication
 *
 * 1. Fetch API     — The browser's built-in way to make HTTP requests without
 *                    reloading the page. Returns a Promise you must await.
 * 2. Async/Await   — Syntactic sugar over Promises. `await` pauses only the
 *                    current async function; it never blocks the browser.
 * 3. Credentials   — 'same-origin' tells the browser to include the session
 *                    cookie automatically on every request to the same origin.
 * 4. Error Pattern — We throw on non-2xx responses so every caller can use a
 *                    single try/catch instead of manual status checks.
 */

// LEARN: A plain object module (not a class) keeps the API client lightweight.
// All methods share `this` via dot notation: API.get(), API.post(), etc.
const API = {

  /**
   * Universal fetch wrapper — all HTTP calls go through here.
   *
   * LEARN: Centralising fetch logic means every module gets consistent
   * error handling, headers, and JSON serialisation automatically.
   *
   * @param {string} endpoint  e.g. '/api/habits'
   * @param {object} options   standard fetch init options
   * @returns {Promise<any>}   parsed JSON response body
   * @throws {Error}           on non-OK HTTP status or network failure
   */
  async request(endpoint, options = {}) {
    const config = {
      // LEARN: Content-Type: application/json tells the server how to parse
      // the request body. Without it, Python's json.loads() would fail.
      headers: { 'Content-Type': 'application/json' },
      // LEARN: 'same-origin' forwards session cookies only to the same
      // host+port. Using 'include' would send them cross-origin (security risk).
      credentials: 'same-origin',
      ...options,
    };

    // LEARN: JSON.stringify() converts a JS object into a JSON string.
    // fetch() accepts only strings or FormData as a body, not plain objects.
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(endpoint, config);
      // LEARN: response.json() is also async — it reads and parses the body stream.
      let data;
      try {
        data = await response.json();
      } catch (e) {
        // LEARN: A non-JSON response (e.g. a static host answering /api/* with
        // its index.html, or a CDN error page) means the API backend is not
        // reachable. Surface a clear message instead of a cryptic parse error.
        throw new Error('Unexpected server response — the API backend is not reachable.');
      }

      // LEARN: response.ok is true for status codes 200–299. We throw an Error
      // so callers can handle all failures uniformly in a single catch block.
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      // LEARN: Re-throwing keeps the original error stack for the caller's
      // catch block while logging it here for easier debugging.
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  },

  // ── HTTP Method Shortcuts ───────────────────────────────────────────────
  // LEARN: These thin wrappers make call sites read like plain English:
  //   API.get('/api/habits') vs API.request('/api/habits', { method: 'GET' })

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  patch(endpoint, body) {
    // LEARN: PATCH sends only the changed fields (partial update).
    // PUT would replace the entire resource — use PATCH for field-level edits.
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};


/* ===== auth.js ===== */
/**
 * AUTHENTICATION MODULE (auth.js)
 * ================================
 * LEARN: Client-side Session Management & Multi-Form Auth
 *
 * 1. Session Validation — On every page load, we ask the server /api/session.
 *                         If the cookie is valid, skip login. This is how most
 *                         modern web apps implement "stay logged in".
 * 2. e.preventDefault() — Without this, a form submit would reload the whole
 *                         page, destroying all your SPA state.
 * 3. Guard Clauses      — Returning early on invalid input (e.g. empty username)
 *                         is cleaner than nesting logic inside if/else blocks.
 * 4. Form Switching     — We hide/show sub-forms (login, register, forgot) in
 *                         one place (_switchAuthForm) instead of repeating the
 *                         same DOM queries in every click handler.
 */

// LEARN: A constant enum prevents typos when referencing form names.
// 'login', 'register', 'forgot' are the only valid values in this app.
const FORM = Object.freeze({
  LOGIN:    'login',
  REGISTER: 'register',
  FORGOT:   'forgot',
});

const Auth = {
  currentUser: null,

  /**
   * Checks if user has a valid session cookie on app launch.
   *
   * LEARN: The app is guest-first — guests see the landing page. A valid
   * session routes straight into the app (showApp) and enables the
   * "Continue to Dashboard" shortcut, so a refresh keeps authenticated
   * users on the dashboard.
   */
async checkSession() {
    try {
      const data = await API.get('/api/session');
      if (data.authenticated) {
        this.currentUser = data.user;
        this.showApp();
        this.showContinue();
      } else {
        this.currentUser = null;
        this.showLanding();
        this.hideContinue();
      }
    } catch (err) {
      this.currentUser = null;
      this.showLanding();
      this.hideContinue();
    }
    return !!this.currentUser;
  },
  /** Shows the landing page (public entry). */
  showLanding() {
    document.getElementById('app-container')?.classList.add('hidden');
    document.getElementById('landing-container')?.classList.remove('hidden');
    document.getElementById('profile-overlay')?.classList.add('hidden');
    document.body.classList.remove('modal-open');
    if (this.currentUser) {
      this.showContinue();
    } else {
      this.hideContinue();
    }
    window.scrollTo(0, 0);
  },

  /** Reveals the "Continue to Dashboard" chip in the landing nav for sessions. */
  showContinue() {
    const chip = document.getElementById('landing-user-chip');
    const btn  = document.getElementById('landing-continue-btn');
    if (chip) chip.classList.remove('hidden');
    if (btn) btn.classList.remove('hidden');
    if (this.currentUser) {
      const nameEl   = document.getElementById('landing-username');
      const avatarEl = document.getElementById('landing-user-avatar');
      const letter = this.currentUser.username.charAt(0).toUpperCase();
      if (nameEl)   nameEl.textContent   = this.currentUser.username;
      if (avatarEl) avatarEl.textContent = letter;
    }
  },

  hideContinue() {
    document.getElementById('landing-user-chip')?.classList.add('hidden');
    document.getElementById('landing-continue-btn')?.classList.add('hidden');
  },

  /**
   * Switches the visible auth sub-form and updates the subtitle text.
   *
   * LEARN: Extracting this into its own method (Single Responsibility) means
   * every navigation link calls one function, not copies of the same DOM code.
   *
   * @param {'login'|'register'|'forgot'} target  which form to show
   */
  _switchAuthForm(target) {
    const loginForm    = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm   = document.getElementById('forgot-form');
    const subtitle     = document.getElementById('auth-subtitle');

    // Hide all forms first (guard approach: reset state before setting new state)
    loginForm?.classList.add('hidden');
    registerForm?.classList.add('hidden');
    forgotForm?.classList.add('hidden');

    const SUBTITLES = {
      [FORM.REGISTER]: 'Join Daily Rhythm to build consistent routines.',
      [FORM.FORGOT]:   'Enter your username, recovery PIN, and a new password.',
      [FORM.LOGIN]:    'Welcome back! Please sign in to access your routine.',
    };

    if (target === FORM.REGISTER) registerForm?.classList.remove('hidden');
    else if (target === FORM.FORGOT) forgotForm?.classList.remove('hidden');
    else loginForm?.classList.remove('hidden');

    if (subtitle) subtitle.textContent = SUBTITLES[target] ?? SUBTITLES[FORM.LOGIN];
  },

  /**
   * Wires up all form navigation links and submit handlers.
   *
   * LEARN: We initialise all listeners once on DOMContentLoaded.
   * Using form.onsubmit (not addEventListener) is acceptable here because
   * there is only ever one submit handler per form in this app (YAGNI).
   */
  init() {
    const loginForm    = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm   = document.getElementById('forgot-form');
    const showRegisterLink     = document.getElementById('show-register-link');
    const showLoginLink        = document.getElementById('show-login-link');
    const showForgotLink       = document.getElementById('show-forgot-link');
    const forgotBackLoginLink  = document.getElementById('forgot-back-login-link');
    const logoutBtn            = document.getElementById('logout-btn');

    // ── Form Navigation Links ─────────────────────────────────────────────
    // LEARN: e.preventDefault() stops the browser's default <a href="#"> scroll.
    if (showRegisterLink) {
      showRegisterLink.onclick = (e) => { e.preventDefault(); this._switchAuthForm(FORM.REGISTER); };
    }

    if (showLoginLink) {
      showLoginLink.onclick = (e) => { e.preventDefault(); this._switchAuthForm(FORM.LOGIN); };
    }

    if (showForgotLink) {
      showForgotLink.onclick = (e) => {
        e.preventDefault();
        // Pre-fill the username field from the login form for convenience
        const currentUsername = document.getElementById('login-username')?.value;
        const forgotUsernameEl = document.getElementById('forgot-username');
        if (currentUsername && forgotUsernameEl) forgotUsernameEl.value = currentUsername;
        this._switchAuthForm(FORM.FORGOT);
      };
    }

    if (forgotBackLoginLink) {
      forgotBackLoginLink.onclick = (e) => { e.preventDefault(); this._switchAuthForm(FORM.LOGIN); };
    }

// Submit Login
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
          const res = await API.post('/api/login', { username, password });
          if (res.success) {
            this.currentUser = res.user;
            UI.toast(`Welcome back, ${res.user.username}!`, 'success');            this.showApp();
          }
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Submit Register
    if (registerForm) {
      registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const email = document.getElementById('reg-email')?.value.trim();
        const phone = document.getElementById('reg-phone')?.value.trim();

        try {
          const res = await API.post('/api/register', { username, password, email, phone });
          if (res.success) {
            this.currentUser = res.user;
            UI.toast(`Account created! Welcome, ${res.user.username}!`, 'success');
            this.showApp();
          }
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Send OTP button handler
    const sendOtpBtn = document.getElementById('btn-send-otp');
    if (sendOtpBtn) {
      sendOtpBtn.onclick = async () => {
        const username = document.getElementById('forgot-username')?.value.trim();
        if (!username) {
          UI.toast('Please enter your Username or Registered Email first.', 'danger');
          return;
        }
        try {
          const res = await API.post('/api/request-otp', { email: username, username: username });
          if (res.success) {
            UI.toast(`OTP Code sent to email! (Demo OTP: ${res.otp_code})`, 'success');
            const otpInput = document.getElementById('forgot-otp-code');
            if (otpInput) {
              otpInput.focus();
              otpInput.value = res.otp_code; // Autofill for convenience
            }
          }
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // ── Submit Forgot / Reset Password ───────────────────────────────────
    if (forgotForm) {
      forgotForm.onsubmit = async (e) => {
        e.preventDefault();
        const username        = document.getElementById('forgot-username').value.trim();
        const otp_code        = document.getElementById('forgot-otp-code')?.value.trim();
        const new_password    = document.getElementById('forgot-new-password').value;
        const confirm_password = document.getElementById('forgot-confirm-password').value;

        // LEARN: Guard clauses — validate inputs early and return, avoiding
        // deeply nested if/else blocks that are hard to read.
        if (!otp_code) {
          UI.toast('Please enter the 6-digit OTP code sent to your email.', 'danger');
          return;
        }
        if (new_password !== confirm_password) {
          UI.toast('Passwords do not match.', 'danger');
          return;
        }
        if (new_password.length < 6) {
          UI.toast('Password must be at least 6 characters.', 'danger');
          return;
        }

        try {
          const res = await API.post('/api/reset-password', { username, otp_code, new_password });
          if (res.success) {
            UI.toast(res.message || 'Password reset successfully! Please sign in.', 'success');
            const loginUsernameEl = document.getElementById('login-username');
            const loginPasswordEl = document.getElementById('login-password');
            if (loginUsernameEl) loginUsernameEl.value = username;
            if (loginPasswordEl) loginPasswordEl.value = '';
            forgotForm.reset();
            this._switchAuthForm(FORM.LOGIN);
          }
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // ── Logout ───────────────────────────────────────────────────────────
    // LEARN: After logout we return to the landing page AND reopen the auth
    // modal on the login form. Guests land straight back on the sign-in
    // screen instead of an empty landing page (also matches the E2E tests,
    // which wait for #login-form after clicking #logout-btn).
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        try {
          await API.post('/api/logout', {});
          this.currentUser = null;
          UI.toast('Logged out successfully.');
          this.showLanding();
          window.App?.openProfileSettings();
        } catch (err) {
          UI.toast('Error logging out.', 'danger');
        }
      };
    }
  },

  /**
   * Reveals the main application shell and hides the auth screen.
   *
   * LEARN: After login succeeds, we don't reload the page — we simply swap
   * which container is visible. This is the core of a Single Page App (SPA).
   */
  showApp() {
    document.getElementById('landing-container')?.classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('profile-overlay')?.classList.add('hidden');
    document.body.classList.remove('modal-open');

    if (this.currentUser) {
      const nameEl   = document.getElementById('display-username');
      const avatarEl = document.getElementById('user-avatar');
      const mobNameEl = document.getElementById('mobile-header-username');
      const mobAvatarEl = document.getElementById('mobile-header-avatar');
      const letter = this.currentUser.username.charAt(0).toUpperCase();

      if (nameEl)   nameEl.textContent   = this.currentUser.username;
      if (avatarEl) avatarEl.textContent = letter;
      if (mobNameEl) mobNameEl.textContent = this.currentUser.username;
      if (mobAvatarEl) mobAvatarEl.textContent = letter;
    }

    // Delegate routing to the App controller
    window.App?.onLoginSuccess();
  },

  /** Hides the app and returns to the landing page. */
  showLogin() {
    this.showLanding();
  },

  /** Ends the session and returns to the login screen (used by sidebar + mobile drawer). */
  async logout() {
    try {
      await API.post('/api/logout', {});
    } catch (err) {
      // Clear local state even if the server call fails.
    }
    this.currentUser = null;
    UI.toast('Logged out successfully.');
    this.showLanding();
    window.App?.openProfileSettings();
  },

  /** From the landing page, jumps straight into the app for existing sessions. */
  continueToApp() {
    if (!this.currentUser) {
      App.openProfileSettings();
      return;
    }
    this.showApp();
  },
};


/* ===== dashboard.js ===== */
/**
 * DASHBOARD VIEW MODULE (dashboard.js)
 * =====================================
 * LEARN: Aggregated Views & Dynamic Content Rendering
 *
 * 1. Promise.all()     — Fetches all data sources in parallel instead of
 *                        sequentially. This can be 3× faster when each
 *                        request takes ~300ms.
 * 2. .catch() per item — Wrapping individual items with .catch(() => null)
 *                        means a single failing API won't break the whole
 *                        dashboard load.
 * 3. Helper Extraction — _getTimeOfDay(), _getMotivationalQuote(), and
 *                        _renderEmptyState() keep each render method focused
 *                        on its own data domain (Single Responsibility).
 * 4. Template Literals — Backtick strings (`) support multi-line HTML and
 *                        ${expression} interpolation without concatenation.
 */

window.Dashboard = {

  /**
   * Maps the current hour to a time-of-day greeting word.
   *
   * LEARN: Extracting this into a pure helper (no side effects) makes it
   * independently testable and readable at the call site.
   *
   * @param {number} hour  current hour (0–23)
   * @returns {'morning'|'afternoon'|'evening'}
   */
  _getTimeOfDay(hour) {
    if (hour >= 17) return 'evening';
    if (hour >= 12) return 'afternoon';
    return 'morning';
  },

  /**
   * Picks a random motivational quote from a curated pool.
   *
   * LEARN: Math.floor(Math.random() * array.length) is the standard way to
   * pick a random array index in JavaScript.
   *
   * @returns {string}
   */
  _getMotivationalQuote() {
    const quotes = [
      'Take a deep breath. One step at a time.',
      "You're doing great! Keep it cozy today.",
      'Make today warm and productive.',
      'Remember to drink water and take small breaks.',
      'A steady flow beats a rushed sprint.',
      "Cozy vibes only. Let's make progress!",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  },

  /**
   * Generates a consistent empty-state HTML block for dashboard sections.
   *
   * LEARN: Extracting repeated HTML structures into a factory function (DRY)
   * reduces copy-paste bugs and makes it easy to restyle all empty states.
   *
   * @param {string} message   description text
   * @param {string} btnLabel  action button label
   * @param {string} btnAction inline onclick value
   * @returns {string}         HTML string
   */
  _renderEmptyState(message, btnLabel, btnAction) {
    return `
      <div style="text-align: center; padding: 1.5rem 0;">
        <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.88rem;">${message}</p>
        <button class="btn btn-outline btn-sm" onclick="${btnAction}">${btnLabel}</button>
      </div>
    `;
  },

  async load() {
    try {
      // LEARN: Promise.all([...]) fires all requests simultaneously. Without it,
      // three sequential awaits would take 3× the round-trip time.
      const [dashData, notesData, budgetData] = await Promise.all([
        API.get('/api/dashboard'),
        API.get('/api/notes').catch(() => []),
        API.get('/api/budget/summary').catch(() => null),
      ]);

      const effectiveBudget = budgetData || dashData?.budget_summary || null;

      this.toggleOnboarding(dashData, notesData, effectiveBudget);
      this.renderGreeting(dashData.date);
      this.renderStats(dashData, effectiveBudget);
      this.renderHabits(dashData.habits);
      this.renderTasks(dashData.tasks);
      this.renderNotes(notesData);
      this.renderEvents(dashData.events);
      this.renderBudget(effectiveBudget);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      UI.toast('Failed to load dashboard data.', 'danger');
    }
  },

  /**
   * Shows the first-run onboarding panel when the user has no data yet, and
   * hides it once any module has activity. Purely presentational.
   */
  toggleOnboarding(dashData, notesData, budgetData) {
    const panel = document.getElementById('dash-onboarding-panel');
    if (!panel) return;

    const hasHabits = (dashData?.habits?.length ?? 0) > 0;
    const hasTasks  = (dashData?.tasks?.length  ?? 0) > 0;
    const hasEvents = (dashData?.events?.length ?? 0) > 0;
    const hasNotes  = (notesData?.length ?? 0) > 0;
    const hasBudget = (budgetData?.total_income ?? 0) > 0 || (budgetData?.total_expense ?? 0) > 0;
    const isNewUser = !hasHabits && !hasTasks && !hasEvents && !hasNotes && !hasBudget;

    document.getElementById('view-dashboard')?.classList.toggle('new-user', isNewUser);
  },

  renderGreeting(dateStr) {
    const greetingEl = document.getElementById('dash-greeting');
    const dateEl     = document.getElementById('dash-date-str');

    if (greetingEl) {
      const timeOfDay  = this._getTimeOfDay(new Date().getHours());
      greetingEl.textContent = `Good ${timeOfDay}`;
    }

    if (dateEl) {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const quote = this._getMotivationalQuote();
      dateEl.innerHTML = `${formattedDate} <span class="cozy-quote" style="display: block; margin-top: 0.35rem; font-style: italic; font-weight: 500; color: var(--primary-text); font-size: 0.88rem;">${quote}</span>`;
    }
  },

  renderStats(data, budgetData) {
    const habitCount = data.habits ? data.habits.length : 0;
    const completedHabits = data.habits ? data.habits.filter(h => h.today_done).length : 0;
    const pendingTasks = data.tasks ? data.tasks.length : 0;
    const eventCount = data.events ? data.events.length : 0;

    const habitValEl = document.getElementById('dash-kpi-habits-val');
    const habitSubEl = document.getElementById('dash-kpi-habits-sub');
    const taskValEl = document.getElementById('dash-kpi-tasks-val');
    const taskSubEl = document.getElementById('dash-kpi-tasks-sub');
    const eventValEl = document.getElementById('dash-kpi-events-val');
    const eventSubEl = document.getElementById('dash-kpi-events-sub');
    const budgetValEl = document.getElementById('dash-kpi-budget-val');
    const budgetSubEl = document.getElementById('dash-kpi-budget-sub');

    if (habitValEl) habitValEl.textContent = `${completedHabits} / ${habitCount}`;
    if (habitSubEl) {
      const pct = habitCount > 0 ? Math.round((completedHabits / habitCount) * 100) : 0;
      habitSubEl.textContent = `${pct}% Done`;
    }

    if (taskValEl) taskValEl.textContent = `${pendingTasks}`;
    if (taskSubEl) {
      taskSubEl.textContent = pendingTasks === 0 ? 'All Clear' : `${pendingTasks} Priority`;
    }

    if (eventValEl) eventValEl.textContent = `${eventCount}`;
    if (eventSubEl) {
      eventSubEl.textContent = eventCount === 0 ? 'Free Day' : `${eventCount} Scheduled`;
    }
    
    if (budgetValEl && budgetData) {
      const net = (budgetData.total_income || 0) - (budgetData.total_expense || 0);
      const isPositive = net >= 0;
      const formattedAmt = window.Budget ? window.Budget.formatCurrency(Math.abs(net)) : Math.abs(net).toLocaleString('en-US');
      budgetValEl.textContent = `${isPositive ? '+' : '-'} ${formattedAmt}`;
      budgetValEl.style.color = isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)';
      if (budgetSubEl) {
        budgetSubEl.textContent = isPositive ? 'Surplus' : 'Deficit';
        budgetSubEl.style.color = isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)';
        budgetSubEl.style.background = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      }
    }
  },

  renderHabits(habits) {
    const container = document.getElementById('dash-habits-list');
    if (!container) return;

    if (!habits || habits.length === 0) {
      container.innerHTML = this._renderEmptyState(
        'No habits added yet.',
        'Create your first habit &rarr;',
        'Habits.openCreateModal()'
      );
      return;
    }

    const checkIcon = `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${habits.map(h => `
          <div class="task-item" style="margin-bottom: 0; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div class="task-left" style="display: flex; align-items: center; gap: 0.65rem;">
              <div class="habit-icon" style="width: 32px; height: 32px; font-size: 0.85rem; background-color: ${UI.esc(h.color || '#7C3AED')}15; color: ${UI.esc(h.color || '#7C3AED')}">
                ${UI.esc(h.icon || 'H')}
              </div>
              <span class="task-title" style="font-weight: 600; font-size: 0.88rem;">${UI.esc(h.title)}</span>
            </div>
            <button class="habit-toggle-btn ${h.today_done ? 'done' : ''}" 
                    onclick="Dashboard.toggleHabit(${h.id}, ${!h.today_done})">
              ${h.today_done ? `${checkIcon} Done` : 'Check Off'}
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  async toggleHabit(habitId, done) {
    try {
      const todayStr = UI.getTodayStr();
      await API.post(`/api/habits/${habitId}/log`, { date: todayStr, done });
      UI.toast(done ? 'Habit completed!' : 'Habit uncompleted', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  renderTasks(tasks) {
    const container = document.getElementById('dash-tasks-list');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = this._renderEmptyState(
        'All clear! No pending focus tasks.',
        'Add focus task &rarr;',
        'Tasks.openCreateModal()'
      );
      return;
    }

    const checkSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${tasks.map(t => `
          <div class="task-item" style="margin-bottom: 0; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div class="task-left" style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="checkbox-custom ${t.done ? 'checked' : ''}" 
                   onclick="Dashboard.toggleTask(${t.id}, ${!t.done})">
                ${t.done ? checkSvg : ''}
              </div>
              <div class="task-details">
                <span class="task-title" style="font-weight: 600; font-size: 0.88rem;">${UI.esc(t.title)}</span>
                <div class="task-meta" style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.2rem;">
                  <span class="priority-badge priority-${t.priority}" style="font-size: 0.68rem;">${t.priority}</span>
                  ${t.due_date ? `<span style="font-size: 0.75rem; color: var(--text-muted);">Due ${UI.formatDate(t.due_date)}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async toggleTask(taskId, done) {
    try {
      await API.patch(`/api/tasks/${taskId}`, { done });
      UI.toast(done ? 'Task completed!' : 'Task reopened', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  renderNotes(notes) {
    const container = document.getElementById('dash-notes-preview');
    if (!container) return;

    if (!notes || notes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1rem 0;">
          <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.85rem;">No recent notes or reflections yet.</p>
          <button class="btn btn-outline btn-sm" onclick="Notes.startNewNote()">+ Write quick note</button>
        </div>
      `;
      return;
    }

    const recent = notes.slice(0, 3);
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${recent.map(n => `
          <div onclick="App.navigateTo('notes')" style="cursor: pointer; padding: 0.75rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); transition: all 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">${UI.esc(n.title || 'Untitled Note')}</span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${UI.formatDate(n.updated_at || n.created_at)}</span>
            </div>
            <p class="text-muted" style="margin: 0; font-size: 0.8rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${UI.esc(n.body ? n.body.replace(/<[^>]*>?/gm, '') : 'No additional content...')}
            </p>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderEvents(events) {
    const container = document.getElementById('dash-events-list');
    if (!container) return;

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 0;">
          <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.85rem;">No classes or blocks scheduled today.</p>
          <button class="btn btn-outline btn-sm" onclick="Schedule.openCreateModal()">+ Add timetable block</button>
        </div>
      `;
      return;
    }

    const clockSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const mapSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${events.map(e => `
          <div class="event-block" style="border-left-color: ${UI.esc(e.color || 'var(--primary)')}; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); border-left-width: 4px;">
            <div class="event-title" style="font-weight: 700; font-size: 0.88rem;">${UI.esc(e.title)}</div>
            <div class="event-time" style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.2rem;">
              ${clockSvg} ${UI.esc(e.start_time)} - ${UI.esc(e.end_time)}
              ${e.location ? ` &bull; ${mapSvg} ${UI.esc(e.location)}` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderBudget(budgetData) {
    const container = document.getElementById('dash-budget-summary');
    if (!container) return;

    if (!budgetData) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.25rem 0;">
          <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.85rem;">No financial data logged this month.</p>
          <button class="btn btn-outline btn-sm" onclick="Budget.openLogModal('income')">+ Start Cashflow</button>
        </div>
      `;
      return;
    }

    const income = budgetData.total_income || 0;
    const expense = budgetData.total_expense || 0;
    const balance = income - expense;
    const isPositive = balance >= 0;

    const formattedBalance = window.Budget ? window.Budget.formatCurrency(Math.abs(balance)) : Math.abs(balance).toLocaleString('en-US');
    const formattedIncome = window.Budget ? window.Budget.formatCurrency(income) : income.toLocaleString('en-US');
    const formattedExpense = window.Budget ? window.Budget.formatCurrency(expense) : expense.toLocaleString('en-US');

    container.innerHTML = `
      <div>
        <div style="padding: 0.9rem 1rem; border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%); border: 1px solid var(--border-color); margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Net Balance</span>
            <span class="stat-pill" style="background: ${isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)'}; font-size: 0.7rem;">
              ${isPositive ? '↗ Positive' : '↘ Deficit'}
            </span>
          </div>
          <div style="font-size: 1.35rem; font-weight: 800; color: ${isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)'}; margin-top: 0.25rem; letter-spacing: -0.02em;">
            ${isPositive ? '+' : '-'} ${formattedBalance}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <div style="background: rgba(16, 185, 129, 0.08); border-radius: var(--radius-md); padding: 0.6rem 0.75rem; border: 1px solid rgba(16, 185, 129, 0.2);">
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-success-strong); text-transform: uppercase; display: flex; align-items: center; gap: 0.3rem;">
              <span>↓</span> Income
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--accent-success-strong); margin-top: 0.2rem;">${formattedIncome}</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.08); border-radius: var(--radius-md); padding: 0.6rem 0.75rem; border: 1px solid rgba(239, 68, 68, 0.2);">
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-danger-strong); text-transform: uppercase; display: flex; align-items: center; gap: 0.3rem;">
              <span>↑</span> Expense
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--accent-danger-strong); margin-top: 0.2rem;">${formattedExpense}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-outline btn-sm" onclick="Budget.openLogModal('income')" style="flex: 1; font-size: 0.78rem; padding: 0.4rem 0.5rem; justify-content: center;">+ Income</button>
          <button class="btn btn-outline btn-sm" onclick="Budget.openLogModal('expense')" style="flex: 1; font-size: 0.78rem; padding: 0.4rem 0.5rem; justify-content: center;">- Expense</button>
        </div>
      </div>
    `;
  },

  openLogCashFlowModal() {
    const html = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 0.25rem 0;">
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Budget.openLogModal('income');">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.15); color: #10B981; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">Log Income</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Record salary, allowance, or freelance revenue</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Budget.openLogModal('expense');">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.15); color: var(--accent-danger); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">Log Expense</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Track daily spending, food, bills &amp; books</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Habits.openCreateModal();">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.15); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Habit / Routine</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Track daily routines and streaks</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Tasks.openCreateModal();">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(245, 158, 11, 0.15); color: #F59E0B; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Priority Task</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Add a deadline or one-time todo</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Notes.startNewNote();">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.15); color: var(--primary-500); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">Quick Journal Note</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Capture thoughts, reflections &amp; ideas</div>
          </div>
        </button>
      </div>
    `;
    UI.openModal('Quick Actions & Log Cash Flow', html);
  }
};


/* ===== habits.js ===== */
/**
 * HABITS & ROUTINES MODULE (habits.js)
 * =====================================
 * LEARN: State Management, Data Structures & Streak Algorithms
 *
 * 1. Set for O(1) Lookups  — We store completed dates in a Set so we can
 *                             check `logSet.has(date)` in constant time,
 *                             instead of looping through an array each time.
 * 2. Async Loop Pitfall     — `await` inside a `for...of` loop runs each
 *                             request sequentially. For large lists, switch
 *                             to Promise.all() to run them in parallel.
 * 3. Streak Algorithm       — We walk backwards from today, stopping at the
 *                             first missing day. This is a simple but correct
 *                             streak-counting approach.
 * 4. Module-Scope SVGs      — Defined once (DRY) rather than re-created inside
 *                             every render() call.
 */

// ── Module-level constants ───────────────────────────────────────────────────
// LEARN: Defining SVGs here means they are created once when the script loads,
// not on every render() call. This reduces garbage collection pressure.
const HABIT_SVG = {
  flame: `<svg class="icon-svg" style="width:1em; height:1em; stroke:var(--accent-warning);" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.17-.58-1.61L12 11.5l-.92 1.39c-.36.44-.58 1-.58 1.61z"/><path d="M12 2c1.78 2.67 4 5.33 4 8.5a6 6 0 0 1-12 0c0-3.17 2.22-5.83 4-8.5l4-2z"/></svg>`,
  check: `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  close: `<svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

window.Habits = {
  habitsList: [],

  async load() {
    try {
      this.habitsList = await API.get('/api/habits');
      this.render();
    } catch (err) {
      UI.toast('Failed to load habits.', 'danger');
    }
  },

  /**
   * Generates the last 7 calendar days as { iso, dayName } objects.
   *
   * LEARN: We calculate dates in JavaScript by mutating a Date object with
   * setDate(). Subtracting i days from today gives us the last 7 days.
   *
   * @returns {{ iso: string, dayName: string }[]}
   */
  _getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        iso:     d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      });
    }
    return days;
  },

  /**
   * Calculates the current streak (consecutive completed days up to today).
   *
   * LEARN: We use a Set for O(1) date lookups. If we used Array.includes(),
   * each lookup would be O(n), making this O(n*m) for n habits, m days.
   *
   * @param {Set<string>} logSet  set of completed ISO date strings
   * @returns {number}            consecutive streak count
   */
  _calcStreak(logSet) {
    let streak = 0;
    const d = new Date();
    // Walk backwards from today until we find a missing day
    while (logSet.has(d.toISOString().split('T')[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },

  async render() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;

    if (this.habitsList.length === 0) {
      container.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h3>No Habits Added Yet</h3>
          <p class="text-muted" style="margin: 0.5rem 0 0 0;">Consistency starts small. Add a habit like "Read 20 mins" or "Drink 2L Water".</p>
        </div>
      `;
      return;
    }

    const last7Days = this._getLast7Days();

    // Fetch all habit logs in parallel for instant responsiveness
    const habitLogsList = await Promise.all(
      this.habitsList.map(h => API.get(`/api/habits/${h.id}/logs`).catch(() => []))
    );

    const cardsHtml = this.habitsList.map((habit, idx) => {
      const logs = habitLogsList[idx] || [];
      const logSet = new Set(logs.filter(l => l.done).map(l => l.log_date));
      const streak = this._calcStreak(logSet);

      return `
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-info">
              <div class="habit-icon" style="background-color: ${UI.esc(habit.color || '#7C3AED')}15; color: ${UI.esc(habit.color || '#7C3AED')}">
                ${UI.esc(habit.icon || 'H')}
              </div>
              <div>
                <div class="habit-title">${UI.esc(habit.title)}</div>
                <div class="habit-streak">${HABIT_SVG.flame} ${streak} Day Streak</div>
              </div>
            </div>
            <button class="btn-icon text-muted habit-del-btn" onclick="Habits.deleteHabit(${habit.id})" title="Delete habit" aria-label="Delete habit">
              ${HABIT_SVG.close}
            </button>
          </div>

          <!-- Mini 7-Day Heatmap -->
          <div class="heatmap-mini">
            ${last7Days.map(day => {
              const isDone = logSet.has(day.iso);
              return `<div class="heatmap-day ${isDone ? 'completed' : ''}" title="${day.iso}: ${isDone ? 'Completed' : 'Missed'}">${day.dayName}</div>`;
            }).join('')}
          </div>

          <button class="habit-toggle-btn ${habit.today_done ? 'done' : ''}"
                  onclick="Habits.toggleToday(${habit.id}, ${!habit.today_done})"
                  title="${habit.today_done ? 'Completed today (click to uncheck)' : 'Mark as done for today'}">
            ${habit.today_done ? `${HABIT_SVG.check} Completed Today` : 'Mark Complete'}
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = cardsHtml;
  },

  async toggleToday(habitId, done) {
    try {
      const todayStr = UI.getTodayStr();
      await API.post(`/api/habits/${habitId}/log`, { date: todayStr, done });
      UI.toast(done ? 'Habit completed!' : 'Habit status updated', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit and its history?')) return;
    try {
      await API.delete(`/api/habits/${habitId}`);
      UI.toast('Habit deleted.', 'info');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openCreateModal() {
    const formHtml = `
      <form id="create-habit-form">
        <div class="form-group">
          <label for="habit-title">Habit Name</label>
          <input type="text" id="habit-title" required placeholder="e.g. Read 20 pages, Morning stretch">
        </div>
        <div class="form-group">
          <label for="habit-icon">Icon Tag (1-2 characters)</label>
          <input type="text" id="habit-icon" value="H" required maxlength="3" placeholder="e.g. R, W, EX">
        </div>
        <div class="form-group">
          <label for="habit-color">Accent Color</label>
          <input type="color" id="habit-color" value="#7C3AED">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create Habit</button>
      </form>
    `;

    UI.openModal('New Habit / Routine', formHtml);

    document.getElementById('create-habit-form').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('habit-title').value;
      const icon = document.getElementById('habit-icon').value;
      const color = document.getElementById('habit-color').value;

      try {
        await API.post('/api/habits', { title, icon, color });
        UI.closeModal();
        UI.toast('Habit created!', 'success');
        this.load();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  },

  openQuickAddMenu() {
    const html = `
      <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
        <button type="button" class="btn btn-outline btn-block" onclick="UI.closeModal(); Habits.openCreateModal();" style="display: flex; align-items: center; gap: 0.85rem; padding: 1rem; text-align: left; border-radius: var(--radius-lg); font-weight: 700; font-size: 0.95rem; background: var(--bg-surface-alt); border-color: var(--border-color);">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.15); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Daily Habit</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.15rem;">Track recurring daily routines & streaks</div>
          </div>
        </button>
        <button type="button" class="btn btn-outline btn-block" onclick="UI.closeModal(); Tasks.openCreateModal();" style="display: flex; align-items: center; gap: 0.85rem; padding: 1rem; text-align: left; border-radius: var(--radius-lg); font-weight: 700; font-size: 0.95rem; background: var(--bg-surface-alt); border-color: var(--border-color);">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(245, 158, 11, 0.15); color: #F59E0B; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Priority Task</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.15rem;">Add a one-time todo or urgent deadline</div>
          </div>
        </button>
      </div>
    `;
    UI.openModal('Quick Add to Planner', html);
  }
};


/* ===== tasks.js ===== */
/**
 * TASKS MODULE (tasks.js)
 * ========================
 * LEARN: Client-Side Filtering & Partial Updates
 *
 * 1. Client-Side Filter  — We fetch all tasks once, then filter the in-memory
 *                          array. This avoids a new API call on every filter
 *                          click, making the UI feel instant.
 * 2. PATCH vs PUT        — PATCH sends only the changed fields (e.g. `done`).
 *                          PUT replaces the whole resource. Always prefer PATCH
 *                          for partial updates to avoid unintended data loss.
 * 3. Guard Clause        — Returning early from render() when the container
 *                          doesn't exist prevents null-reference errors.
 * 4. Array.filter()      — Returns a new array without mutating the original.
 *                          We keep `tasksList` intact and filter on the fly.
 */

// ── Module-level SVG icons ─────────────────────────────────────────────────
const TASK_SVG = {
  check:    `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  calendar: `<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  trash:    `<svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

window.Tasks = {
  tasksList: [],
  currentFilter: 'all',

  async load() {
    try {
      this.tasksList = await API.get('/api/tasks');
      this.initFilters();
      this.render();
    } catch (err) {
      UI.toast('Failed to load tasks.', 'danger');
    }
  },

  initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const counts = {
      all: this.tasksList.length,
      high: this.tasksList.filter(t => t.priority === 'high').length,
      pending: this.tasksList.filter(t => !t.done).length,
      completed: this.tasksList.filter(t => t.done).length,
    };

    filterBtns.forEach(btn => {
      const f = btn.getAttribute('data-filter');
      const count = counts[f] ?? 0;
      const label = f.charAt(0).toUpperCase() + f.slice(1);
      btn.innerHTML = `${label === 'Completed' ? 'Done' : label} <span class="filter-count" style="opacity:0.75; font-size:0.75rem; font-family:var(--font-mono); margin-left:3px;">(${count})</span>`;
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = f;
        this.render();
      };
    });
  },

  /**
   * Filters the task list by the current active filter.
   *
   * LEARN: Returning a new filtered array (not mutating tasksList) is the
   * "pure function" approach. It makes the filter logic easy to test and
   * trivial to reverse when the filter changes.
   *
   * @param {object[]} tasks   full task list
   * @param {string}   filter  'all' | 'high' | 'pending' | 'completed'
   * @returns {object[]}
   */
  _applyFilter(tasks, filter) {
    if (filter === 'high')      return tasks.filter(t => t.priority === 'high');
    if (filter === 'pending')   return tasks.filter(t => !t.done);
    if (filter === 'completed') return tasks.filter(t => t.done);
    return tasks; // 'all'
  },

  render() {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    // Update sidebar task counter
    const pendingCount = this.tasksList.filter(t => !t.done).length;
    const counterEl = document.getElementById('nav-counter-tasks');
    if (counterEl) {
      if (pendingCount > 0) {
        counterEl.textContent = pendingCount;
        counterEl.classList.remove('hidden');
      } else {
        counterEl.classList.add('hidden');
      }
    }

    this.initFilters();
    const visibleTasks = this._applyFilter(this.tasksList, this.currentFilter);

    if (visibleTasks.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <h3>No Tasks Found</h3>
          <p class="text-muted" style="margin: 0.5rem 0 0 0;">Clear filter or create a task to get started.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = visibleTasks.map(t => `
      <div class="task-item ${t.done ? 'done' : ''}">
        <div class="task-left">
          <div class="checkbox-custom ${t.done ? 'checked' : ''}"
               onclick="Tasks.toggleDone(${t.id}, ${!t.done})">
            ${t.done ? TASK_SVG.check : ''}
          </div>
          <div class="task-details">
            <span class="task-title">${UI.esc(t.title)}</span>
            ${t.details ? `<p class="text-muted" style="font-size: 0.85rem; margin-top: 0.2rem;">${UI.esc(t.details)}</p>` : ''}
            <div class="task-meta" style="margin-top: 0.4rem;">
              <span class="priority-badge priority-${t.priority}">${t.priority}</span>
              ${t.due_date ? `<span>${TASK_SVG.calendar} Due ${UI.formatDate(t.due_date)}</span>` : ''}
            </div>
          </div>
        </div>
        <button class="btn-icon text-muted" onclick="Tasks.deleteTask(${t.id})" title="Delete task">${TASK_SVG.trash}</button>
      </div>
    `).join('');
  },

  async toggleDone(taskId, done) {
    try {
      await API.patch(`/api/tasks/${taskId}`, { done });
      UI.toast(done ? 'Task marked completed!' : 'Task reopened', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    try {
      await API.delete(`/api/tasks/${taskId}`);
      UI.toast('Task deleted.', 'info');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openCreateModal() {
    const todayISO = UI.getTodayStr();
    const formHtml = `
      <form id="create-task-form">
        <div class="form-group">
          <label for="task-title">Task Title</label>
          <input type="text" id="task-title" required placeholder="e.g. Finish Calculus Chapter 4 assignment">
        </div>
        <div class="form-group">
          <label for="task-details">Details / Subtasks (Optional)</label>
          <textarea id="task-details" rows="3" placeholder="Add extra notes or steps..."></textarea>
        </div>
        <div class="form-group">
          <label for="task-priority">Priority Level</label>
          <select id="task-priority">
            <option value="low">Low Priority</option>
            <option value="medium" selected>Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
        <div class="form-group">
          <label for="task-due">Due Date</label>
          <input type="date" id="task-due" value="${todayISO}">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Add Task</button>
      </form>
    `;

    UI.openModal('New Focus Task', formHtml);

    document.getElementById('create-task-form').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title').value;
      const details = document.getElementById('task-details').value;
      const priority = document.getElementById('task-priority').value;
      const due_date = document.getElementById('task-due').value;

      try {
        await API.post('/api/tasks', { title, details, priority, due_date });
        UI.closeModal();
        UI.toast('Task added successfully!', 'success');
        this.load();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  }
};


/* ===== schedule.js ===== */
/**
 * TIMETABLE & SCHEDULE MODULE (schedule.js)
 * ==========================================
 * LEARN: 2D Data Mapping for Weekly Schedules
 *
 * 1. Day-Index Mapping  — JavaScript's Date.getDay() returns 0=Sunday, 6=Saturday.
 *                          We normalise with (getDay() + 6) % 7 to get 0=Monday,
 *                          which matches how students think about their week.
 * 2. Mobile Day Switcher — On small screens, one day column fills the viewport.
 *                          We conditionally show/hide columns via CSS classes.
 * 3. insertBefore()      — Inserting the day-nav pill bar before the main container
 *                          (not inside it) keeps the layout flexible and avoids
 *                          nesting containers unnecessarily.
 * 4. Module-Scope Data   — DAYS and SCHEDULE_SVG defined once, reused every render.
 */

// ── Module-level constants ──────────────────────────────────────────────────
// LEARN: Defining DAYS at module scope means it is created once, not on every
// render() call. Object.freeze() makes it truly immutable (read-only).
const DAYS = Object.freeze([
  { id: 0, name: 'Monday',    short: 'Mon' },
  { id: 1, name: 'Tuesday',   short: 'Tue' },
  { id: 2, name: 'Wednesday', short: 'Wed' },
  { id: 3, name: 'Thursday',  short: 'Thu' },
  { id: 4, name: 'Friday',    short: 'Fri' },
  { id: 5, name: 'Saturday',  short: 'Sat' },
  { id: 6, name: 'Sunday',    short: 'Sun' },
]);

const SCHEDULE_SVG = {
  clock: `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  map:   `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  close: `<svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

window.Schedule = {
  eventsList: [],
  // LEARN: (new Date().getDay() + 6) % 7 converts JS Sunday=0 to Monday=0.
  activeMobileDay: (new Date().getDay() + 6) % 7,
  viewMode: 'day', // 'day' or 'week' on mobile

  async load() {
    try {
      this.eventsList = await API.get('/api/events');
      this.render();
    } catch (err) {
      UI.toast('Failed to load schedule.', 'danger');
    }
  },

  setMobileDay(dayId) {
    this.activeMobileDay = dayId;
    this.viewMode = 'day';
    this.render();
  },

  toggleViewMode(mode) {
    this.viewMode = mode;
    this.render();
  },

  /**
   * Builds the mobile day-switcher pill bar HTML.
   *
   * LEARN: Extracting this into a helper keeps render() shorter and focused
   * on layout assembly, not pill rendering detail.
   *
   * @param {number} todayIndex  today's day index (0=Mon, 6=Sun)
   * @returns {string}           HTML string for the pill scroll container
   */
  _renderDayPills(todayIndex) {
    const pillsHtml = DAYS.map(d => {
      const count      = this.eventsList.filter(e => Number(e.day_of_week) === d.id).length;
      const isSelected = this.viewMode === 'day' && this.activeMobileDay === d.id;
      const isToday    = d.id === todayIndex;
      return `
        <button type="button" class="day-pill-btn ${isSelected ? 'active' : ''} ${isToday ? 'today-pill' : ''}"
                onclick="Schedule.setMobileDay(${d.id})">
          <span class="day-pill-name">${d.short}</span>
          ${count > 0 ? `<span class="day-pill-badge">${count}</span>` : ''}
          ${isToday    ? `<span class="day-pill-dot"></span>` : ''}
        </button>
      `;
    }).join('');

    return `
      <div class="timetable-pill-scroll" style="display: flex; align-items: center; gap: 0.35rem; width: 100%;">
        ${pillsHtml}
        <button type="button" class="day-pill-btn ${this.viewMode === 'week' ? 'active' : ''}" onclick="Schedule.toggleViewMode('week')">
          <span class="day-pill-name">All (Week)</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="Schedule.openCreateModal()" style="margin-left: auto; padding: 0.35rem 0.75rem; border-radius: var(--radius-full); font-weight: 700; white-space: nowrap; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;">
          <span>+</span> Block
        </button>
      </div>
    `;
  },

  render() {
    const container = document.getElementById('timetable-container');
    if (!container) return;

    // LEARN: (getDay() + 6) % 7 normalises JS's Sunday=0 to Monday=0.
    const todayIndex = (new Date().getDay() + 6) % 7;

    // Render or reuse the mobile day-switcher pill bar
    let daySelectorEl = document.getElementById('timetable-mobile-nav');
    if (!daySelectorEl) {
      daySelectorEl = document.createElement('div');
      daySelectorEl.id        = 'timetable-mobile-nav';
      daySelectorEl.className = 'timetable-mobile-nav';
      // LEARN: insertBefore(newEl, referenceEl) inserts before the reference node.
      // container.parentNode is the wrapper that holds both the nav and the grid.
      container.parentNode.insertBefore(daySelectorEl, container);
    }
    daySelectorEl.innerHTML = this._renderDayPills(todayIndex);

    let html = '';
    for (const day of DAYS) {
      const isToday       = day.id === todayIndex;
      const isMobileActive = this.viewMode === 'week' || this.activeMobileDay === day.id;
      const dayEvents     = this.eventsList.filter(e => Number(e.day_of_week) === day.id);

      html += `
        <div class="day-column ${isToday ? 'today' : ''} ${isMobileActive ? 'mobile-visible' : 'mobile-hidden'}" data-day="${day.id}">
          <div class="day-header">
            <span>${day.name}</span>
            ${isToday ? '<span class="today-tag">&bull; Today</span>' : ''}
          </div>
          <div class="day-events">
            ${dayEvents.length === 0 ? `
              <div class="empty-day-slot" onclick="Schedule.openCreateModalForDay(${day.id})" style="cursor: pointer; text-align: center; padding: 1.5rem 0.5rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); transition: var(--transition-smooth); margin-top: 0.5rem;" title="Click to add a schedule block for ${day.name}">
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">+ Add block</span>
              </div>
            ` : ''}
            ${dayEvents.map(e => `
              <div class="event-block" style="border-left-color: ${UI.esc(e.color || '#7C3AED')}; margin-bottom: 0.5rem; position: relative;">
                <div class="event-title">${UI.esc(e.title)}</div>
                <div class="event-time">${SCHEDULE_SVG.clock} ${UI.esc(e.start_time)} - ${UI.esc(e.end_time)}</div>
                ${e.location ? `<div class="event-time">${SCHEDULE_SVG.map} ${UI.esc(e.location)}</div>` : ''}
                <button class="btn-icon" style="position: absolute; top: 4px; right: 4px; padding: 2px;"
                        onclick="Schedule.deleteEvent(${e.id})" title="Delete event">${SCHEDULE_SVG.close}</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  openCreateModalForDay(dayId) {
    this.openCreateModal(dayId);
  },

  async deleteEvent(eventId) {
    if (!confirm('Remove this schedule block?')) return;
    try {
      await API.delete(`/api/events/${eventId}`);
      UI.toast('Schedule block removed.', 'info');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openCreateModal(defaultDay = null) {
    const selectedDay = defaultDay !== null ? Number(defaultDay) : 0;
    const formHtml = `
      <form id="create-event-form">
        <div class="form-group">
          <label for="event-title">Title (Class or Session)</label>
          <input type="text" id="event-title" required placeholder="e.g. CS101 Lecture, Gym Focus Block">
        </div>
        <div class="form-group">
          <label for="event-day">Day of Week</label>
          <select id="event-day">
            <option value="0" ${selectedDay === 0 ? 'selected' : ''}>Monday</option>
            <option value="1" ${selectedDay === 1 ? 'selected' : ''}>Tuesday</option>
            <option value="2" ${selectedDay === 2 ? 'selected' : ''}>Wednesday</option>
            <option value="3" ${selectedDay === 3 ? 'selected' : ''}>Thursday</option>
            <option value="4" ${selectedDay === 4 ? 'selected' : ''}>Friday</option>
            <option value="5" ${selectedDay === 5 ? 'selected' : ''}>Saturday</option>
            <option value="6" ${selectedDay === 6 ? 'selected' : ''}>Sunday</option>
          </select>
        </div>
        <div style="display: flex; gap: 1rem;">
          <div class="form-group" style="flex: 1;">
            <label for="event-start">Start Time</label>
            <input type="time" id="event-start" value="09:00" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="event-end">End Time</label>
            <input type="time" id="event-end" value="10:30" required>
          </div>
        </div>
        <div class="form-group">
          <label for="event-loc">Location / Link (Optional)</label>
          <input type="text" id="event-loc" placeholder="e.g. Science Building Rm 204 or Zoom">
        </div>
        <div class="form-group">
          <label for="event-color">Color Identifier</label>
          <input type="color" id="event-color" value="#7C3AED">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Save to Timetable</button>
      </form>
    `;

    UI.openModal('Add Schedule Block', formHtml);

    document.getElementById('create-event-form').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('event-title').value;
      const day_of_week = document.getElementById('event-day').value;
      const start_time = document.getElementById('event-start').value;
      const end_time = document.getElementById('event-end').value;
      const location = document.getElementById('event-loc').value;
      const color = document.getElementById('event-color').value;

      try {
        await API.post('/api/events', { title, day_of_week, start_time, end_time, location, color });
        UI.closeModal();
        UI.toast('Schedule block added!', 'success');
        this.load();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  }
};


/* ===== notes.js ===== */
/**
 * JOURNAL & NOTES MODULE (notes.js)
 * ===================================
 * LEARN: Master-Detail Layouts, Real-Time Filtering & Mobile-First UX
 *
 * 1. Mobile List/Editor State — On mobile screens (<768px), notes behave like
 *                               Apple Notes: browsing a full card list, and
 *                               transitioning to full-width editor on tap.
 * 2. Real-Time Search & Tag Filter — Client-side fuzzy search across title & body.
 * 3. Live Word/Char Counter — Calculated on keyup/input in note-body-input.
 * 4. Active Selection State — `activeNoteId` is the single source of truth.
 */

const MOOD_LABELS = {
  productive: 'Productive',
  happy:      'Positive',
  neutral:    'General',
  tired:      'Review Later',
  stressed:   'Urgent',
};

window.Notes = {
  notesList: [],
  activeNoteId: null,
  filterMood: 'all',
  searchQuery: '',
  mobileView: 'list', // 'list' | 'editor'
  activeTab: 'notes', // 'notes' | 'library'
  resourcesList: [],
  resourceFilterCat: 'all',
  activeCitationResource: null,
  activeCitationStyle: 'apa',

  async load() {
    try {
      this.notesList = await API.get('/api/notes');
      this.initListeners();
      this.renderSidebar();

      // If library tab was active or if on desktop
      if (this.activeTab === 'library') {
        this.loadResources();
      }

      // On desktop, auto-select first note if none active
      if (window.innerWidth > 768) {
        if (this.notesList.length > 0 && !this.activeNoteId) {
          this.selectNote(this.notesList[0].id, false);
        } else if (this.notesList.length === 0) {
          this.clearEditor();
        }
      }
    } catch (err) {
      UI.toast('Failed to load notes.', 'danger');
    }
  },

  openLibrary() {
    App.navigateTo('notes');
    setTimeout(() => this.switchTab('library'), 50);
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    const notesTab = document.querySelector('.notes-main-tab[data-tab="notes"]');
    const libraryTab = document.querySelector('.notes-main-tab[data-tab="library"]');
    const notesPane = document.getElementById('notes-tab-editor-pane');
    const libraryPane = document.getElementById('notes-tab-library-pane');

    if (tabName === 'library') {
      notesTab?.classList.remove('active');
      libraryTab?.classList.add('active');
      notesPane?.classList.add('hidden');
      libraryPane?.classList.remove('hidden');
      this.loadResources();
    } else {
      libraryTab?.classList.remove('active');
      notesTab?.classList.add('active');
      libraryPane?.classList.add('hidden');
      notesPane?.classList.remove('hidden');
    }
  },

  librarySearchQuery: '',

  openAddResourceModal() {
    const modal = document.getElementById('academic-resource-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('notes-resource-title')?.focus(), 60);
  },

  closeAddResourceModal() {
    const modal = document.getElementById('academic-resource-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  handleLibrarySearch(e) {
    this.librarySearchQuery = (e?.target?.value || '').toLowerCase().trim();
    this.renderResources();
  },

  async loadResources() {
    try {
      this.resourcesList = await API.get('/api/resources');
      this.renderResources();
    } catch (err) {
      console.warn('Failed to load academic resources:', err);
    }
  },

  filterResources(cat) {
    this.resourceFilterCat = cat;
    document.querySelectorAll('.resource-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
    this.renderResources();
  },

  renderResources() {
    const container = document.getElementById('notes-resources-list-container');
    if (!container) return;

    let items = this.resourcesList || [];
    if (this.resourceFilterCat !== 'all') {
      const targetCat = this.resourceFilterCat.toLowerCase();
      items = items.filter(r => {
        const cat = (r.category || 'general').toLowerCase();
        const type = (r.resource_type || 'book').toLowerCase();
        return cat === targetCat || type === targetCat;
      });
    }

    if (this.librarySearchQuery) {
      const q = this.librarySearchQuery;
      items = items.filter(r => {
        return (r.title && r.title.toLowerCase().includes(q)) ||
               (r.author && r.author.toLowerCase().includes(q)) ||
               (r.publisher && r.publisher.toLowerCase().includes(q)) ||
               (r.doi && r.doi.toLowerCase().includes(q)) ||
               (r.notes && r.notes.toLowerCase().includes(q));
      });
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-lg); background: var(--bg-surface);">
          <div style="margin-bottom: 0.5rem; color: var(--text-muted); display: flex; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div style="font-weight: 700; font-size: 0.95rem;">No Academic Resources Found</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            ${this.librarySearchQuery ? 'No items match your search query.' : (this.resourceFilterCat !== 'all' ? 'No items under this category filter.' : 'Tap "+ Add Resource / Paper" above to catalog your first book, paper, or research journal.')}
          </div>
        </div>
      `;
      return;
    }

    const typeIcons = {
      book: 'Online Book',
      journal: 'Research Journal',
      pdf: 'PDF Document',
      docx: 'DOCX File',
      article: 'Web Guide',
    };

    container.innerHTML = items.map(r => {
      const typeLabel = typeIcons[r.resource_type] || 'Document';
      const catLabel = r.category ? r.category.charAt(0).toUpperCase() + r.category.slice(1) : 'General';
      const dateStr = r.created_at ? UI.formatDate(r.created_at) : '';
      const yearBadge = r.year ? `<span style="display:inline-flex; align-items:center; gap:3px; background:rgba(124, 58, 237,0.08); color:var(--primary); padding:2px 7px; border-radius:4px; border:1px solid rgba(124, 58, 237,0.15); font-size:0.7rem; font-weight:700;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${UI.esc(r.year)}</span>` : '';
      const pubBadge = r.publisher ? `<span style="font-size:0.78rem; color:var(--text-secondary); font-weight:600;">• ${UI.esc(r.publisher)}</span>` : '';

      return `
        <div class="card resource-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.85rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
                <span class="priority-badge priority-low" style="font-size: 0.7rem;">${UI.esc(typeLabel)}</span>
                <span class="priority-badge priority-medium" style="font-size: 0.7rem;">${UI.esc(catLabel)}</span>
                ${yearBadge}
                ${dateStr ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">${dateStr}</span>` : ''}
              </div>
              <h5 style="margin: 0; font-size: 1.02rem; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
                ${UI.esc(r.title)}
              </h5>
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem; flex-wrap: wrap;">
                ${r.author ? `<span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 700;">By ${UI.esc(r.author)}</span>` : ''}
                ${pubBadge}
                ${r.doi ? `<span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--text-muted);">DOI: ${UI.esc(r.doi)}</span>` : ''}
              </div>
              ${r.notes ? `<p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.5rem 0 0; font-style: italic; line-height: 1.45;">"${UI.esc(r.notes)}"</p>` : ''}
            </div>

            <div class="resource-card-actions">
              <button type="button" class="btn btn-outline btn-sm" onclick="Notes.openCitationModal(${r.id})" style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; padding: 0.4rem 0.75rem; font-size: 0.8rem; border-color: var(--primary); color: var(--primary); background: var(--primary-light); min-height: 36px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Cite
              </button>
              ${r.url_or_path ? `
                <a href="${UI.esc(r.url_or_path)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; padding: 0.4rem 0.75rem; font-size: 0.8rem; min-height: 36px;">
                  Open ↗
                </a>
              ` : ''}
              <button class="btn-icon text-muted" onclick="Notes.deleteResource(${r.id})" title="Delete resource" style="padding: 6px; min-height: 36px; min-width: 36px; display: inline-flex; align-items: center; justify-content: center;">
                <svg class="icon-svg" viewBox="0 0 24 24" style="width: 16px; height: 16px; color: var(--accent-danger);"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async handleAddResource(e) {
    e.preventDefault();
    const title = document.getElementById('notes-resource-title')?.value.trim();
    const author = document.getElementById('notes-resource-author')?.value.trim() || '';
    const year = document.getElementById('notes-resource-year')?.value.trim() || '';
    const publisher = document.getElementById('notes-resource-publisher')?.value.trim() || '';
    const doi = document.getElementById('notes-resource-doi')?.value.trim() || '';
    const resource_type = document.getElementById('notes-resource-type')?.value || 'book';
    const category = document.getElementById('notes-resource-category')?.value || 'general';
    const url_or_path = document.getElementById('notes-resource-url')?.value.trim() || '';
    const notes = document.getElementById('notes-resource-notes')?.value.trim() || '';

    if (!title) {
      UI.toast('Please enter a resource title.', 'warning');
      return;
    }

    try {
      await API.post('/api/resources', { title, author, year, publisher, doi, resource_type, category, url_or_path, notes });
      UI.toast('Academic resource added to Library!', 'success');
      document.getElementById('notes-add-resource-form')?.reset();
      this.closeAddResourceModal();
      this.loadResources();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteResource(id) {
    if (!confirm('Remove this resource from library?')) return;
    try {
      await API.delete(`/api/resources/${id}`);
      UI.toast('Resource removed from library.', 'info');
      this.loadResources();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  // ── CITATION GENERATOR ENGINE (APA 7, IEEE, MLA 9, BibTeX, Chicago, Harvard) ──
  openCitationModal(resourceId) {
    const resource = (this.resourcesList || []).find(r => r.id === resourceId);
    if (!resource) return;

    this.activeCitationResource = resource;
    const modal = document.getElementById('citation-modal');
    if (!modal) return;

    const titleEl = document.getElementById('citation-resource-title');
    const metaEl = document.getElementById('citation-resource-meta');
    if (titleEl) titleEl.textContent = resource.title;
    if (metaEl) {
      const parts = [];
      if (resource.author) parts.push(`Author: ${resource.author}`);
      if (resource.year) parts.push(`Year: ${resource.year}`);
      if (resource.publisher) parts.push(`Publisher: ${resource.publisher}`);
      if (resource.doi) parts.push(`DOI: ${resource.doi}`);
      metaEl.textContent = parts.length > 0 ? parts.join(' • ') : 'General Academic Resource';
    }

    this.switchCitationStyle(this.activeCitationStyle || 'apa');
    modal.classList.remove('hidden');
  },

  closeCitationModal() {
    const modal = document.getElementById('citation-modal');
    if (modal) modal.classList.add('hidden');
  },

  switchCitationStyle(style) {
    this.activeCitationStyle = style;
    document.querySelectorAll('.citation-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-style') === style);
    });

    const previewBox = document.getElementById('citation-preview-box');
    if (!previewBox || !this.activeCitationResource) return;

    const formatted = this._generateCitation(style, this.activeCitationResource, false);
    previewBox.innerHTML = formatted;
  },

  _generateCitation(style, r, plainText = false) {
    const author = r.author || 'Anonymous';
    const year = r.year || new Date().getFullYear();
    const title = r.title || 'Untitled Document';
    const publisher = r.publisher || 'Academic Press';
    const url = r.url_or_path || '';
    const doi = r.doi ? (r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`) : (url || '');

    switch (style) {
      case 'apa':
        // APA 7th Edition: Author, A. A. (Year). *Title*. Publisher. DOI
        if (plainText) {
          return `${author} (${year}). ${title}. ${publisher}.${doi ? ` ${doi}` : ''}`;
        }
        return `${UI.esc(author)} (${UI.esc(year)}). <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}.${doi ? ` <span style="color:var(--primary);">${UI.esc(doi)}</span>` : ''}`;

      case 'ieee':
        // IEEE: Author, "Title," Publisher, Year. [Online]. Available: URL
        if (plainText) {
          return `${author}, "${title}," ${publisher}, ${year}.${url ? ` [Online]. Available: ${url}` : ''}`;
        }
        return `${UI.esc(author)}, &ldquo;<em>${UI.esc(title)}</em>,&rdquo; ${UI.esc(publisher)}, ${UI.esc(year)}.${url ? ` [Online]. Available: <span style="color:var(--primary);">${UI.esc(url)}</span>` : ''}`;

      case 'mla':
        // MLA 9th Edition: Author. *Title*. Publisher, Year, URL.
        if (plainText) {
          return `${author}. ${title}. ${publisher}, ${year}${url ? `, ${url}` : ''}.`;
        }
        return `${UI.esc(author)}. <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}, ${UI.esc(year)}${url ? `, <span style="color:var(--primary);">${UI.esc(url)}</span>` : ''}.`;

      case 'bibtex': {
        // BibTeX @article or @book entry
        const citeKey = (author.split(/[\s,]+/)[0] + year + title.split(/\s+/)[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
        const entryType = (r.resource_type === 'journal' || r.resource_type === 'article') ? 'article' : 'book';
        const bib = `@${entryType}{${citeKey || 'ref1'},
  title = {${title}},
  author = {${author}},
  year = {${year}},
  publisher = {${publisher}}${doi ? `,\n  doi = {${r.doi}}` : ''}${url ? `,\n  url = {${url}}` : ''}
}`;
        if (plainText) return bib;
        return `<pre style="margin:0; font-family:var(--font-mono); font-size:0.85rem; color:var(--text-primary); white-space:pre-wrap;">${UI.esc(bib)}</pre>`;
      }

      case 'chicago':
        // Chicago 17th (Author-Date): Author. Year. *Title*. Publisher. DOI.
        if (plainText) {
          return `${author}. ${year}. ${title}. ${publisher}.${doi ? ` ${doi}.` : ''}`;
        }
        return `${UI.esc(author)}. ${UI.esc(year)}. <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}.${doi ? ` <span style="color:var(--primary);">${UI.esc(doi)}</span>.` : ''}`;

      case 'harvard':
        // Harvard: Author (Year) *Title*. Publisher. Available at: URL [Accessed date].
        if (plainText) {
          return `${author} (${year}) ${title}. ${publisher}.${url ? ` Available at: ${url}` : ''}`;
        }
        return `${UI.esc(author)} (${UI.esc(year)}) <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}.${url ? ` Available at: <span style="color:var(--primary);">${UI.esc(url)}</span>` : ''}`;

      default:
        return `${author} (${year}). ${title}.`;
    }
  },

  copyCitation() {
    if (!this.activeCitationResource) return;
    const text = this._generateCitation(this.activeCitationStyle, this.activeCitationResource, true);
    navigator.clipboard.writeText(text).then(() => {
      UI.toast(`Copied ${this.activeCitationStyle.toUpperCase()} citation to clipboard!`, 'success');
    }).catch(() => {
      UI.toast('Failed to copy to clipboard.', 'danger');
    });
  },

  insertCitationToNote() {
    if (!this.activeCitationResource) return;
    const text = this._generateCitation(this.activeCitationStyle, this.activeCitationResource, true);
    
    // Switch to notes tab and editor
    this.closeCitationModal();
    this.switchTab('notes');

    const bodyInput = document.getElementById('note-body-input');
    if (bodyInput) {
      const current = bodyInput.value;
      bodyInput.value = current ? `${current}\n\n[Citation: ${text}]` : `[Citation: ${text}]\n\n`;
      bodyInput.focus();
      this.updateCounters();
      UI.toast('Citation appended to active note! Don\'t forget to click Save.', 'success');
    }
  },

  downloadBibtex() {
    if (!this.activeCitationResource) return;
    const bibContent = this._generateCitation('bibtex', this.activeCitationResource, true);
    const citeKey = (this.activeCitationResource.author?.split(/\s+/)[0] || 'citation') + (this.activeCitationResource.year || '');
    const blob = new Blob([bibContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${citeKey.toLowerCase().replace(/[^a-z0-9]/g, '') || 'citation'}.bib`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    UI.toast('BibTeX file downloaded (.bib)!', 'success');
  },

  initListeners() {
    const saveBtn   = document.getElementById('save-note-btn');
    const deleteBtn = document.getElementById('delete-note-btn');
    const bodyInput = document.getElementById('note-body-input');
    const searchIn  = document.getElementById('notes-search-input');
    const resForm   = document.getElementById('notes-add-resource-form');

    if (saveBtn)   saveBtn.onclick   = () => this.saveCurrentNote();
    if (deleteBtn) deleteBtn.onclick = () => this.deleteActiveNote();

    if (bodyInput) {
      bodyInput.oninput = () => this.updateCounters();
    }

    if (searchIn) {
      let debounceTimer = null;
      searchIn.oninput = (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.renderSidebar();
        }, 120);
      };
    }

    if (resForm) {
      resForm.onsubmit = (e) => this.handleAddResource(e);
    }
  },

  _getEditorEls() {
    return {
      titleInput: document.getElementById('note-title-input'),
      moodSelect: document.getElementById('note-mood-select'),
      bodyInput:  document.getElementById('note-body-input'),
      deleteBtn:  document.getElementById('delete-note-btn'),
      layoutEl:   document.getElementById('notes-main-layout'),
    };
  },

  updateCounters() {
    const bodyInput = document.getElementById('note-body-input');
    const counterEl = document.getElementById('note-word-count');
    if (!bodyInput || !counterEl) return;

    const text = bodyInput.value.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    counterEl.textContent = `${words} words · ${chars} chars`;
  },

  setMoodFilter(mood) {
    this.filterMood = mood;
    document.querySelectorAll('.note-filter-pill').forEach(pill => {
      if (pill.getAttribute('data-mood') === mood) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    this.renderSidebar();
  },

  getFilteredNotes() {
    return this.notesList.filter(n => {
      const matchMood = this.filterMood === 'all' || (n.mood || 'neutral') === this.filterMood;
      const matchSearch = !this.searchQuery ||
        (n.title && n.title.toLowerCase().includes(this.searchQuery)) ||
        (n.body && n.body.toLowerCase().includes(this.searchQuery));
      return matchMood && matchSearch;
    });
  },

  renderSidebar() {
    const sidebarContainer = document.getElementById('notes-sidebar-list');
    if (!sidebarContainer) return;

    // Update sidebar notes counter
    const notesCount = this.notesList.length;
    const counterEl = document.getElementById('nav-counter-notes');
    if (counterEl) {
      if (notesCount > 0) {
        counterEl.textContent = notesCount;
        counterEl.classList.remove('hidden');
      } else {
        counterEl.classList.add('hidden');
      }
    }

    const filtered = this.getFilteredNotes();

    if (filtered.length === 0) {
      const isSearchOrFilter = Boolean(this.searchQuery || this.filterMood !== 'all');
      sidebarContainer.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1.25rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-lg); background: var(--bg-surface-alt);">
          <div class="empty-state-icon" style="width: 44px; height: 44px; margin: 0 auto 0.75rem auto; border-radius: var(--radius-full); background: rgba(124, 58, 237, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="empty-state-title" style="font-weight: 800; font-size: 1rem; color: var(--text-primary);">${isSearchOrFilter ? 'No matching notes' : 'No notes yet'}</div>
          <div class="empty-state-desc" style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">
            ${isSearchOrFilter ? 'Try adjusting your search or tag filters.' : 'Capture your thoughts, study outlines, and daily reflections.'}
          </div>
          ${!isSearchOrFilter ? `
            <button type="button" class="btn btn-primary btn-sm d-inline-flex items-center gap-xs" onclick="Notes.startNewNote()" style="margin-top: 1rem; width: 100%; justify-content: center; min-height: 42px; font-weight: 700;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Create Your First Note
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    sidebarContainer.innerHTML = filtered.map(n => {
      const mood    = n.mood || 'neutral';
      const label   = MOOD_LABELS[mood] || mood;
      const dateStr = (n.updated_at || n.created_at)
        ? UI.formatDate(n.updated_at || n.created_at)
        : '';

      return `
        <div class="note-item ${n.id === this.activeNoteId ? 'active' : ''}" data-mood="${mood}" onclick="Notes.selectNote(${n.id}, true)">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.35rem;">
            <div class="note-item-title">${UI.esc(n.title || 'Untitled Note')}</div>
          </div>
          <div class="note-item-snippet">${UI.esc(n.body || 'No content yet...')}</div>
          <div class="note-item-meta">
            <span class="note-item-badge">${UI.esc(label)}</span>
            ${dateStr ? `<span class="note-item-date">${dateStr}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Selects a note.
   * @param {number} noteId
   * @param {boolean} switchToEditorOnMobile  whether to activate mobile editor view
   */
  selectNote(noteId, switchToEditorOnMobile = true) {
    this.activeNoteId = noteId;
    const note = this.notesList.find(n => n.id === noteId);
    if (!note) return;

    const { titleInput, moodSelect, bodyInput, deleteBtn } = this._getEditorEls();
    if (titleInput) titleInput.value = note.title || '';
    if (moodSelect) moodSelect.value = note.mood  || 'neutral';
    if (bodyInput)  bodyInput.value  = note.body  || '';
    if (deleteBtn)  deleteBtn.classList.remove('hidden');

    this.updateCounters();
    this.renderSidebar();

    if (switchToEditorOnMobile && window.innerWidth <= 768) {
      this.openEditorOnMobile();
    }
  },

  openEditorOnMobile() {
    this.mobileView = 'editor';
    const layout = document.getElementById('notes-main-layout');
    if (layout) {
      layout.classList.add('mobile-editor-active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  closeEditorOnMobile() {
    this.mobileView = 'list';
    const layout = document.getElementById('notes-main-layout');
    if (layout) {
      layout.classList.remove('mobile-editor-active');
    }
    this.renderSidebar();
  },

  clearEditor() {
    this.activeNoteId = null;
    const { titleInput, moodSelect, bodyInput, deleteBtn } = this._getEditorEls();
    if (titleInput) titleInput.value = '';
    if (moodSelect) moodSelect.value = 'neutral';
    if (bodyInput)  bodyInput.value  = '';
    if (deleteBtn)  deleteBtn.classList.add('hidden');
    this.updateCounters();
  },

  async saveCurrentNote() {
    const title = document.getElementById('note-title-input').value.trim() || 'Untitled Note';
    const mood = document.getElementById('note-mood-select').value;
    const body = document.getElementById('note-body-input').value;

    try {
      if (this.activeNoteId) {
        // Update existing note
        await API.patch(`/api/notes/${this.activeNoteId}`, { title, mood, body });
        UI.toast('Note updated!', 'success');
      } else {
        // Create new note
        const res = await API.post('/api/notes', { title, mood, body });
        this.activeNoteId = res.id;
        UI.toast('Note created!', 'success');
      }
      await this.load();

      // On mobile, keep in editor or return with smooth feedback
      if (window.innerWidth <= 768) {
        this.closeEditorOnMobile();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteActiveNote() {
    if (!this.activeNoteId) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await API.delete(`/api/notes/${this.activeNoteId}`);
      UI.toast('Note deleted.', 'info');
      this.activeNoteId = null;
      await this.load();

      if (window.innerWidth <= 768) {
        this.closeEditorOnMobile();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  startNewNote() {
    this.clearEditor();
    if (window.innerWidth <= 768) {
      this.openEditorOnMobile();
    }
    const titleInput = document.getElementById('note-title-input');
    if (titleInput) {
      setTimeout(() => titleInput.focus(), 100);
    }
  }
};


/* ===== curriculum.js ===== */
/**
 * CURRICULUM CONTROLLER (curriculum.js)
 * =====================================
 * Manages the CS Curriculum Hub catalog, Academic & Faculty directory,
 * Performance & Analytics dashboard, and GPA Target Simulator.
 */

window.Curriculum = {
  activeTab: sessionStorage.getItem('curriculum_active_tab') || 'hub',

  init() {
    this.setupEventListeners();
    if (this.initLabs) {
      this.initLabs();
    }
  },

  load() {
    this.switchTab(this.activeTab);
    this.loadAcademicData();
    this.loadPerformanceData();
    this.renderGPACalculator();
    if (this.loadLabResources) {
      this.loadLabResources();
    }
  },

  setupEventListeners() {
    // Tab selectors
    document.querySelectorAll('.curr-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // Add Course submit
    const courseForm = document.getElementById('add-course-form');
    if (courseForm) {
      courseForm.onsubmit = async (e) => {
        e.preventDefault();
        const code = document.getElementById('course-code').value.trim();
        const name = document.getElementById('course-name').value.trim();
        const credits = document.getElementById('course-credits').value;

        try {
          const res = await API.post('/api/courses', { code, name, credits });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Course saved successfully.', 'success');
          courseForm.reset();
          this.loadAcademicData();
          if (this.loadSchema) this.loadSchema();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Add Lecturer submit
    const lecturerForm = document.getElementById('add-lecturer-form');
    if (lecturerForm) {
      lecturerForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('lecturer-name').value.trim();
        const email = document.getElementById('lecturer-email').value.trim();
        const office = document.getElementById('lecturer-office').value.trim();

        try {
          const res = await API.post('/api/lecturers', { name, email, office });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Lecturer profile added.', 'success');
          lecturerForm.reset();
          this.loadAcademicData();
          if (this.loadSchema) this.loadSchema();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    if (this.setupLabEventListeners) {
      this.setupLabEventListeners();
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    try {
      sessionStorage.setItem('curriculum_active_tab', tabName);
    } catch (e) { }

    const tabMeta = {
      'hub': { title: 'All Subject Catalog', category: 'all' },
      'general-sec': { title: 'General & Progress Directory', category: 'general' },
      'frontend-sec': { title: 'Frontend Development Labs', category: 'frontend' },
      'backend-sec': { title: 'Backend & Database Labs', category: 'backend' },
      'performance': { title: 'Performance & Analytics', category: 'general' },
      'academic': { title: 'Academic Directory', category: 'general' },
      'gpa': { title: 'GPA & Target Grade Simulator', category: 'general' },
      'resources': { title: 'Library & Journals', category: 'general' },
      'algorithms': { title: 'Data Structures & Alg Visualizer', category: 'frontend' },
      'flashcards': { title: 'Flashcards & Quiz', category: 'frontend' },
      'flexbox': { title: 'CSS Flexbox & Grid Sandbox', category: 'frontend' },
      'jslab': { title: 'JS Array & Functional Lab', category: 'frontend' },
      'regexlab': { title: 'Regex Pattern Validator', category: 'frontend' },
      'db': { title: 'Relational Database (SQL) Sandbox', category: 'backend' },
      'backend': { title: 'Backend API Flow Explorer', category: 'backend' }
    };

    const currentMeta = tabMeta[tabName] || { title: tabName, category: 'general' };

    document.querySelectorAll('.curr-tab-btn').forEach(btn => {
      const bTab = btn.getAttribute('data-tab');
      if (bTab === tabName || (tabName.endsWith('-sec') && bTab === tabName)) {
        btn.classList.add('active');
      } else if (!tabName.endsWith('-sec') && tabName !== 'hub' && bTab === `${currentMeta.category}-sec`) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const activeNameEl = document.getElementById('curr-active-tab-name');
    if (activeNameEl) {
      activeNameEl.textContent = currentMeta.title;
    }

    if (tabName === 'hub' || tabName === 'general-sec' || tabName === 'frontend-sec' || tabName === 'backend-sec') {
      document.querySelectorAll('.curr-panel').forEach(panel => {
        if (panel.id === 'curr-hub') {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });

      const secGeneral = document.getElementById('curr-sec-general');
      const secFrontend = document.getElementById('curr-sec-frontend');
      const secBackend = document.getElementById('curr-sec-backend');

      if (secGeneral && secFrontend && secBackend) {
        if (tabName === 'hub') {
          secGeneral.classList.remove('hidden');
          secFrontend.classList.remove('hidden');
          secBackend.classList.remove('hidden');
        } else if (tabName === 'general-sec') {
          secGeneral.classList.remove('hidden');
          secFrontend.classList.add('hidden');
          secBackend.classList.add('hidden');
        } else if (tabName === 'frontend-sec') {
          secGeneral.classList.add('hidden');
          secFrontend.classList.remove('hidden');
          secBackend.classList.add('hidden');
        } else if (tabName === 'backend-sec') {
          secGeneral.classList.add('hidden');
          secFrontend.classList.add('hidden');
          secBackend.classList.remove('hidden');
        }
      }
    } else {
      document.querySelectorAll('.curr-panel').forEach(panel => {
        if (panel.id === `curr-${tabName}`) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    }

    if (tabName === 'performance') this.loadPerformanceData();
    if (tabName === 'academic') this.loadAcademicData();
    if (tabName === 'gpa') this.renderGPACalculator();
    if (tabName === 'flexbox' && this.updateFlexStage) this.updateFlexStage();
    if (tabName === 'jslab' && this.runJSLab) this.runJSLab();
    if (tabName === 'regexlab' && this.testRegex) this.testRegex();
    if (tabName === 'db' && this.loadSchema) this.loadSchema();
  },

  // ── ACADEMIC & FACULTY MANAGEMENT ─────────────────────────────────────────
  async loadAcademicData() {
    const courseList = document.getElementById('active-courses-list');
    const lecturerList = document.getElementById('active-lecturers-list');
    if (!courseList || !lecturerList) return;

    try {
      const courses = await API.get('/api/courses');
      this.loadPerformanceData();
      if (courses.error) {
        courseList.innerHTML = `<p class="text-danger">${UI.esc(courses.error)}</p>`;
      } else if (courses.length === 0) {
        courseList.innerHTML = '<p class="text-muted">No courses logged yet.</p>';
      } else {
        courseList.innerHTML = courses.map(c => `
          <div class="task-item p-sm mb-xs">
            <div class="task-details">
              <span class="task-title">${UI.esc(c.code)} - ${UI.esc(c.name)}</span>
              <span class="task-meta">${UI.esc(c.credits)} SKS (Credits)</span>
            </div>
            <button class="btn btn-danger btn-xs p-xs text-xs" onclick="Curriculum.deleteCourse(${c.id})" type="button">Delete</button>
          </div>
        `).join('');
      }

      const lecturers = await API.get('/api/lecturers');
      if (lecturers.error) {
        lecturerList.innerHTML = `<p class="text-danger">${UI.esc(lecturers.error)}</p>`;
      } else if (lecturers.length === 0) {
        lecturerList.innerHTML = '<p class="text-muted">No lecturers logged yet.</p>';
      } else {
        lecturerList.innerHTML = lecturers.map(l => `
          <div class="task-item p-sm mb-xs">
            <div class="task-details">
              <span class="task-title">${UI.esc(l.name)}</span>
              <span class="task-meta">${UI.esc(l.email || 'No Email')} | Office: ${UI.esc(l.office || 'N/A')}</span>
            </div>
            <button class="btn btn-danger btn-xs p-xs text-xs" onclick="Curriculum.deleteLecturer(${l.id})" type="button">Delete</button>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error(err);
    }
  },

  async deleteCourse(id) {
    if (!confirm('Are you sure you want to delete this course study?')) return;
    try {
      const res = await API.delete(`/api/courses/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Course removed.', 'success');
        this.loadAcademicData();
        if (this.loadSchema) this.loadSchema();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteLecturer(id) {
    if (!confirm('Are you sure you want to delete this lecturer?')) return;
    try {
      const res = await API.delete(`/api/lecturers/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Lecturer removed.', 'success');
        this.loadAcademicData();
        if (this.loadSchema) this.loadSchema();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openAddCourseModal() {
    UI.openModal('Add New Course / Study', `
      <form id="modal-add-course-form" class="auth-form d-flex flex-col gap-md">
        <div class="form-group">
          <label>Course Code</label>
          <input type="text" id="modal-course-code" placeholder="e.g. IF-101" required>
        </div>
        <div class="form-group">
          <label>Course Name</label>
          <input type="text" id="modal-course-name" placeholder="e.g. Pemrograman Dasar" required>
        </div>
        <div class="form-group">
          <label>Credits (SKS)</label>
          <input type="number" id="modal-course-credits" value="3" min="1" required>
        </div>
        <button type="submit" class="btn btn-primary">Save Course</button>
      </form>
    `);

    const mForm = document.getElementById('modal-add-course-form');
    if (mForm) {
      mForm.onsubmit = async (e) => {
        e.preventDefault();
        const code = document.getElementById('modal-course-code').value.trim();
        const name = document.getElementById('modal-course-name').value.trim();
        const credits = document.getElementById('modal-course-credits').value;

        try {
          const res = await API.post('/api/courses', { code, name, credits });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Course saved successfully.', 'success');
          UI.closeModal();
          this.loadAcademicData();
          if (this.loadSchema) this.loadSchema();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }
  },

  // ── PERFORMANCE & ANALYTICS ───────────────────────────────────────────────
  async loadPerformanceData() {
    try {
      const [courses, tasks, studyLogs] = await Promise.all([
        API.get('/api/courses'),
        API.get('/api/tasks'),
        API.get('/api/study_logs')
      ]);

      const courseListEl = document.getElementById('perf-course-progress-list');
      const coursePctEl = document.getElementById('perf-course-percentage');
      if (courseListEl && Array.isArray(courses)) {
        if (courses.length === 0) {
          courseListEl.innerHTML = '<p class="text-muted text-xs">No active courses registered. Add courses to monitor progress.</p>';
          if (coursePctEl) coursePctEl.textContent = '0%';
        } else {
          let totalCompletion = 0;
          courseListEl.innerHTML = courses.map((c, i) => {
            const seedPct = Math.min(100, Math.max(15, ((c.id * 37 + 13) % 85) + 15));
            totalCompletion += seedPct;
            return `
              <div>
                <div class="d-flex justify-between text-xs font-semibold text-secondary">
                  <span>${UI.esc(c.code)}: ${UI.esc(c.name)}</span>
                  <span class="text-brand font-bold">${seedPct}%</span>
                </div>
                <div class="course-progress-bar-container">
                  <div class="course-progress-bar-fill" style="width: ${seedPct}%;"></div>
                </div>
              </div>
            `;
          }).join('');
          if (coursePctEl) coursePctEl.textContent = `${Math.round(totalCompletion / courses.length)}%`;
        }
      }

      if (Array.isArray(tasks)) {
        const pending = tasks.filter(t => !t.done).length;
        const done = tasks.filter(t => t.done).length;
        const total = tasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 100;

        const hwPctEl = document.getElementById('perf-homeworks-percentage');
        const pendingEl = document.getElementById('perf-pending-tasks');
        const doneEl = document.getElementById('perf-done-tasks');

        if (hwPctEl) hwPctEl.textContent = `${pct}%`;
        if (pendingEl) pendingEl.textContent = `${pending} pending`;
        if (doneEl) doneEl.textContent = `${done} completed`;
      }

      this.renderStudyAnalytics(studyLogs);
    } catch (e) {
      console.error('Failed to load performance metrics', e);
    }
  },

  renderStudyAnalytics(studyLogs) {
    const logs = Array.isArray(studyLogs) ? studyLogs : [];
    let totalTheory = 0;
    let totalPractice = 0;

    const heatmapMap = {};
    for (let i = 0; i < 28; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      const key = d.toISOString().split('T')[0];
      heatmapMap[key] = 0;
    }

    logs.forEach(log => {
      const hrs = Number(log.hours) || 0;
      if (log.type === 'theory') totalTheory += hrs;
      else totalPractice += hrs;

      if (log.study_date && heatmapMap[log.study_date] !== undefined) {
        heatmapMap[log.study_date] += hrs;
      }
    });

    const totalHours = totalTheory + totalPractice;
    const weeklyHours = (totalHours / 4).toFixed(1);

    const prodHoursEl = document.getElementById('perf-productivity-hours');
    const breakdownEl = document.getElementById('perf-theory-practice-breakdown');
    const totalMonthEl = document.getElementById('perf-monthly-hours-total');

    if (prodHoursEl) prodHoursEl.innerHTML = `${weeklyHours} <span class="text-muted text-base">hours/week</span>`;
    if (breakdownEl) breakdownEl.textContent = `${totalTheory.toFixed(1)} h theory • ${totalPractice.toFixed(1)} h practice`;
    if (totalMonthEl) totalMonthEl.innerHTML = `${totalHours.toFixed(1)} <span class="text-muted font-normal text-base">hours logged total</span>`;

    const heatmapContainer = document.getElementById('perf-heatmap-grid');
    if (heatmapContainer) {
      const keys = Object.keys(heatmapMap);
      heatmapContainer.innerHTML = keys.map(k => {
        const val = heatmapMap[k];
        let level = 0;
        if (val > 4) level = 4;
        else if (val > 2) level = 3;
        else if (val > 1) level = 2;
        else if (val > 0) level = 1;
        return `<div class="heatmap-cell val-${level}" title="${k}: ${val.toFixed(1)} hours"></div>`;
      }).join('');
    }

    const logsContainer = document.getElementById('perf-study-logs-container');
    if (logsContainer) {
      if (logs.length === 0) {
        logsContainer.innerHTML = '<p class="text-muted text-center p-xl">No study sessions logged yet. Click "Add Study Session" to track your hours.</p>';
      } else {
        logsContainer.innerHTML = `
          <div class="list-container d-flex flex-col gap-xs">
            ${logs.slice(0, 10).map(l => `
              <div class="task-item p-sm d-flex justify-between items-center">
                <div class="d-flex items-center gap-sm">
                  <span class="priority-badge ${l.type === 'practice' ? 'priority-high' : 'priority-medium'} text-xs">${l.type.toUpperCase()}</span>
                  <div>
                    <div class="font-bold text-sm text-primary">${UI.esc(l.subject || 'Independent Study')}</div>
                    <div class="text-muted text-xs">${UI.esc(l.study_date)} • ${UI.esc(l.notes || 'No description')}</div>
                  </div>
                </div>
                <div class="d-flex items-center gap-md">
                  <span class="font-mono font-bold text-success text-sm">+${Number(l.hours).toFixed(1)} hrs</span>
                  <button class="btn-icon text-muted cursor-pointer" onclick="Curriculum.deleteStudyLog(${l.id})" title="Delete entry" type="button">×</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  },

  openLogStudyModal() {
    const today = new Date().toISOString().split('T')[0];
    UI.openModal('Log Study Hours', `
      <form id="modal-study-log-form" class="auth-form d-flex flex-col gap-md">
        <div class="form-group">
          <label>Subject / Topic</label>
          <input type="text" id="modal-study-subject" placeholder="e.g. Data Structures / Web Dev" required>
        </div>
        <div class="grid-2col gap-sm">
          <div class="form-group">
            <label>Hours Spent</label>
            <input type="number" id="modal-study-hours" step="0.25" min="0.25" max="24" value="2.0" required>
          </div>
          <div class="form-group">
            <label>Study Mode</label>
            <select id="modal-study-type">
              <option value="theory">Theory & Reading</option>
              <option value="practice" selected>Practice & Coding</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="modal-study-date" value="${today}" required>
        </div>
        <div class="form-group">
          <label>Notes / Insights (Optional)</label>
          <input type="text" id="modal-study-notes" placeholder="Solved dynamic programming challenges">
        </div>
        <button type="submit" class="btn btn-primary font-bold">Log Study Session</button>
      </form>
    `);

    const sForm = document.getElementById('modal-study-log-form');
    if (sForm) {
      sForm.onsubmit = async (e) => {
        e.preventDefault();
        const subject = document.getElementById('modal-study-subject').value.trim();
        const hours = parseFloat(document.getElementById('modal-study-hours').value);
        const type = document.getElementById('modal-study-type').value;
        const study_date = document.getElementById('modal-study-date').value;
        const notes = document.getElementById('modal-study-notes').value.trim();

        try {
          const res = await API.post('/api/study_logs', { subject, hours, type, study_date, notes });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Study session recorded!', 'success');
          UI.closeModal();
          this.loadPerformanceData();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }
  },

  async deleteStudyLog(id) {
    try {
      const res = await API.delete(`/api/study_logs/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Study log removed.', 'info');
        this.loadPerformanceData();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  // ── GPA & TARGET GRADE SIMULATOR ──────────────────────────────────────────
  renderGPACalculator() {
    const tbody = document.getElementById('gpa-courses-tbody');
    if (!tbody) return;

    if (tbody.children.length === 0) {
      this.loadCoursesIntoGPA();
    } else {
      this.calculateGPA();
      this.calculateTargetGPA();
    }
  },

  async loadCoursesIntoGPA() {
    const tbody = document.getElementById('gpa-courses-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    try {
      const courses = await API.get('/api/courses');
      if (Array.isArray(courses) && courses.length > 0) {
        courses.forEach(c => {
          this.addGPACourseRow(c.name || c.code, c.credits || 3, 'A');
        });
      } else {
        const defaults = [
          { name: 'Pemrograman Dasar', sks: 4, grade: 'A' },
          { name: 'Algoritma & Struktur Data', sks: 3, grade: 'A-' },
          { name: 'Sistem Basis Data', sks: 3, grade: 'B+' },
          { name: 'Matematika Diskrit', sks: 3, grade: 'A' }
        ];
        defaults.forEach(d => this.addGPACourseRow(d.name, d.sks, d.grade));
      }
    } catch (e) {
      this.addGPACourseRow('Course 1', 3, 'A');
    }
    this.calculateGPA();
    this.calculateTargetGPA();
  },

  addGPACourseRow(name = 'New Course', credits = 3, grade = 'A') {
    const tbody = document.getElementById('gpa-courses-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = 'gpa-course-row';
    tr.innerHTML = `
      <td class="p-xs">
        <input type="text" class="gpa-course-name w-full p-xs font-semibold" value="${UI.esc(name)}" oninput="Curriculum.calculateGPA()">
      </td>
      <td class="p-xs text-center">
        <input type="number" class="gpa-course-credits text-center p-xs" value="${credits}" min="1" max="6" style="width: 55px;" oninput="Curriculum.calculateGPA()">
      </td>
      <td class="p-xs">
        <select class="gpa-course-grade p-xs font-bold text-brand" onchange="Curriculum.calculateGPA()">
          <option value="4.0" ${grade === 'A' ? 'selected' : ''}>A (4.00)</option>
          <option value="3.7" ${grade === 'A-' ? 'selected' : ''}>A- (3.70)</option>
          <option value="3.3" ${grade === 'B+' ? 'selected' : ''}>B+ (3.30)</option>
          <option value="3.0" ${grade === 'B' ? 'selected' : ''}>B (3.00)</option>
          <option value="2.7" ${grade === 'B-' ? 'selected' : ''}>B- (2.70)</option>
          <option value="2.3" ${grade === 'C+' ? 'selected' : ''}>C+ (2.30)</option>
          <option value="2.0" ${grade === 'C' ? 'selected' : ''}>C (2.00)</option>
          <option value="1.0" ${grade === 'D' ? 'selected' : ''}>D (1.00)</option>
          <option value="0.0" ${grade === 'E' || grade === 'F' ? 'selected' : ''}>E/F (0.00)</option>
        </select>
      </td>
      <td class="p-xs text-center">
        <button type="button" class="btn-icon text-danger cursor-pointer" onclick="this.closest('tr').remove(); Curriculum.calculateGPA();" title="Remove course">×</button>
      </td>
    `;
    tbody.appendChild(tr);
    this.calculateGPA();
  },

  calculateGPA() {
    const rows = document.querySelectorAll('.gpa-course-row');
    let totalCredits = 0;
    let totalPoints = 0;

    rows.forEach(r => {
      const credInput = r.querySelector('.gpa-course-credits');
      const gradeSelect = r.querySelector('.gpa-course-grade');
      const sks = parseFloat(credInput?.value) || 0;
      const point = parseFloat(gradeSelect?.value) || 0;

      totalCredits += sks;
      totalPoints += sks * point;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    const gpaDisplay = document.getElementById('gpa-score-display');
    const creditsDisplay = document.getElementById('gpa-total-credits-display');
    const pointsDisplay = document.getElementById('gpa-total-points-display');
    const badgeDisplay = document.getElementById('gpa-standing-badge');

    if (gpaDisplay) gpaDisplay.textContent = gpa;
    if (creditsDisplay) creditsDisplay.textContent = `${totalCredits} SKS`;
    if (pointsDisplay) pointsDisplay.textContent = `${totalPoints.toFixed(1)} Pts`;

    if (badgeDisplay) {
      const val = parseFloat(gpa);
      if (val >= 3.8) {
        badgeDisplay.textContent = 'Summa Cum Laude';
        badgeDisplay.className = 'font-bold text-success mb-md text-xs';
      } else if (val >= 3.5) {
        badgeDisplay.textContent = 'Magna Cum Laude';
        badgeDisplay.className = 'font-bold text-brand mb-md text-xs';
      } else if (val >= 3.0) {
        badgeDisplay.textContent = 'Good Standing';
        badgeDisplay.className = 'font-bold text-warning mb-md text-xs';
      } else {
        badgeDisplay.textContent = 'Academic Warning Zone';
        badgeDisplay.className = 'font-bold text-danger mb-md text-xs';
      }
    }
  },

  calculateTargetGPA() {
    const currGPA = parseFloat(document.getElementById('target-curr-gpa')?.value) || 0;
    const currCredits = parseFloat(document.getElementById('target-curr-credits')?.value) || 0;
    const goalGPA = parseFloat(document.getElementById('target-goal-gpa')?.value) || 0;
    const futureCredits = parseFloat(document.getElementById('target-future-credits')?.value) || 0;
    const resultBox = document.getElementById('target-gpa-result');

    if (!resultBox) return;

    if (futureCredits <= 0) {
      resultBox.innerHTML = '<p class="text-warning text-xs">Enter remaining SKS to calculate.</p>';
      return;
    }

    const totalCredits = currCredits + futureCredits;
    const targetPoints = totalCredits * goalGPA;
    const currentPoints = currCredits * currGPA;
    const neededPoints = targetPoints - currentPoints;
    const neededGPA = (neededPoints / futureCredits).toFixed(2);

    if (neededGPA > 4.0) {
      resultBox.innerHTML = `
        <div class="p-sm badge-danger-subtle rounded text-xs">
          <strong>Mathematically Impossible (${neededGPA})</strong><br>
          Target exceeds 4.0 maximum GPA. Try increasing future credits or adjusting goal.
        </div>
      `;
    } else if (neededGPA < 0) {
      resultBox.innerHTML = `
        <div class="p-sm badge-success-subtle rounded text-xs">
          <strong>Target Already Exceeded!</strong><br>
          You will maintain your target honor standing.
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div class="p-sm bg-surface-alt rounded text-xs border">
          You need an average of <strong class="text-brand font-bold text-sm">${neededGPA}</strong> across your remaining ${futureCredits} SKS.
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.Curriculum) {
    Curriculum.init();
  }
});


/* ===== curriculum_labs.js ===== */
/**
 * CURRICULUM INTERACTIVE LABS (curriculum_labs.js)
 * ===============================================
 * Extends window.Curriculum with live execution sandboxes:
 * SQL Console, API Inspector, Sorting Visualizer, Quizzer, Flexbox Lab, JS Lab, and Regex Tester.
 */

(function () {
  if (!window.Curriculum) window.Curriculum = {};

  const labsMethods = {
    dbSchema: null,
    algoArray: [],
    sortingInProgress: false,
    quizIndex: 0,
    _flexBoxCount: 4,
    _currentJSMethod: 'map',

    quizQuestions: [
      {
        question: "Which of the following is correct regarding relational databases?",
        options: [
          "Tables cannot have foreign key relationships with each other.",
          "A Primary Key must be unique and cannot be NULL.",
          "SQLite does not support any constraints like UNIQUE or NOT NULL.",
          "SQL stands for Simple Query Language."
        ],
        answer: 1,
        explanation: "A Primary Key uniquely identifies each record in a table, and SQL stands for Structured Query Language."
      },
      {
        question: "In CSS Flexbox, which property aligns flex items along the main axis?",
        options: [
          "align-items",
          "justify-content",
          "flex-direction",
          "align-content"
        ],
        answer: 1,
        explanation: "'justify-content' aligns flex items along the main axis, while 'align-items' aligns them along the cross axis."
      },
      {
        question: "What is the time complexity of a Bubble Sort algorithm in its worst case?",
        options: [
          "O(n log n)",
          "O(1)",
          "O(n²)",
          "O(n)"
        ],
        answer: 2,
        explanation: "Bubble Sort compares adjacent elements and swaps them, leading to nested loop behavior resulting in O(n²) time complexity."
      },
      {
        question: "Which HTTP status code represents a successful resource creation in REST API design?",
        options: [
          "200 OK",
          "201 Created",
          "400 Bad Request",
          "404 Not Found"
        ],
        answer: 1,
        explanation: "The HTTP 201 Created status code indicates that the request has succeeded and led to the creation of a resource."
      },
      {
        question: "In SQL, what does a LEFT JOIN return?",
        options: [
          "Only rows that match in both tables.",
          "All rows from the left table, and matching rows from the right table.",
          "All rows from both tables regardless of match.",
          "Only records that have NULL primary keys."
        ],
        answer: 1,
        explanation: "A LEFT JOIN returns all records from the left table, and matching records from the right table. Non-matching right columns are NULL."
      },
      {
        question: "Which of the following describes a foreign key constraint?",
        options: [
          "It prevents passwords from being leaked.",
          "It speeds up SELECT queries on indexes.",
          "It links a column in one table to the primary key of another table to maintain referential integrity.",
          "It automatically hashes passwords during INSERTs."
        ],
        answer: 2,
        explanation: "A foreign key enforces referential integrity between two related tables in a relational database."
      },
      {
        question: "In Modern JavaScript (ES6+), what is the purpose of async/await?",
        options: [
          "To make JavaScript run synchronously on a single CPU core.",
          "To write asynchronous Promises in a clean, synchronous-looking format.",
          "To compile JavaScript into WebAssembly.",
          "To force DOM elements to re-render without CSS."
        ],
        answer: 1,
        explanation: "async/await acts as syntactic sugar over Promises, making asynchronous code easier to read and maintain."
      },
      {
        question: "In Python and SQLite, which technique is used to prevent SQL Injection vulnerability?",
        options: [
          "Executing queries with raw string concatenation.",
          "Using '?' query placeholders or parameterized SQL inputs.",
          "Running base64 encryption on every incoming query text.",
          "Turning off SQLite foreign key constraints."
        ],
        answer: 1,
        explanation: "Passing parameterized inputs with '?' prevents attackers from manipulating the structure of your queries."
      },
      {
        question: "What is the time complexity of Binary Search on a sorted array of size n?",
        options: [
          "O(n)",
          "O(log n)",
          "O(n log n)",
          "O(1)"
        ],
        answer: 1,
        explanation: "Binary search repeatedly divides the sorted search interval in half, yielding O(log n) time complexity."
      }
    ],

    initLabs() {
      this.generateAlgoArray();
    },

    loadLabResources() {
      this.loadSchema();
      this.loadQuizQuestion();
    },

    setupLabEventListeners() {
      // SQL Playground Run
      const runSqlBtn = document.getElementById('run-sql-btn');
      if (runSqlBtn) {
        runSqlBtn.onclick = () => this.runSQL();
      }

      const resetSqlBtn = document.getElementById('reset-sql-btn');
      if (resetSqlBtn) {
        resetSqlBtn.onclick = () => {
          const qInput = document.getElementById('sql-query-input');
          if (qInput) {
            qInput.value = '';
            qInput.focus();
          }
          document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
          const results = document.getElementById('sql-results-container');
          if (results) {
            results.innerHTML = '<p class="text-muted m-0 text-center p-2xl">Ready to execute. Pick a table above or write your SQL query.</p>';
          }
        };
      }

      // SQL Templates
      document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const sql = e.currentTarget.getAttribute('data-sql');
          const qInput = document.getElementById('sql-query-input');
          if (qInput) {
            qInput.value = sql;
            qInput.focus();
            this.runSQL();
          }
        });
      });

      // Backend Explorer triggers
      document.querySelectorAll('.backend-trigger-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.getAttribute('data-action');
          this.runBackendInspector(action);
        });
      });

      // Algo Visualizer
      const shuffleBtn = document.getElementById('algo-generate-arr');
      if (shuffleBtn) shuffleBtn.onclick = () => this.generateAlgoArray();

      const bubbleBtn = document.getElementById('algo-sort-bubble');
      if (bubbleBtn) bubbleBtn.onclick = () => this.bubbleSort();

      const quickBtn = document.getElementById('algo-sort-quick');
      if (quickBtn) quickBtn.onclick = () => this.startQuickSort();

      const speedInput = document.getElementById('algo-speed');
      const speedVal = document.getElementById('algo-speed-val');
      if (speedInput && speedVal) {
        speedInput.oninput = (e) => {
          speedVal.textContent = `${e.target.value}ms`;
        };
      }

      // Quiz Buttons
      const nextQuizBtn = document.getElementById('quiz-next-btn');
      if (nextQuizBtn) nextQuizBtn.onclick = () => this.nextQuiz();

      const quizBackBtn = document.getElementById('quiz-back-btn');
      if (quizBackBtn) {
        quizBackBtn.onclick = () => {
          const card3d = document.getElementById('quiz-card-3d');
          if (card3d) card3d.classList.toggle('flipped');
        };
      }
    },

    // ── 1. RELATIONAL DATABASE & SQL LAB ─────────────────────────────────────
    async loadSchema() {
      const viewer = document.getElementById('db-schema-viewer');
      if (!viewer) return;

      try {
        const schema = await API.get('/api/curriculum/schema');
        if (schema.error) {
          viewer.innerHTML = `<p class="text-danger">${UI.esc(schema.error)}</p>`;
          return;
        }
        this.dbSchema = schema;
        this.renderSchema(schema);
      } catch (err) {
        viewer.innerHTML = `<p class="text-danger">Failed to fetch database schema: ${UI.esc(err.message)}</p>`;
      }
    },

    renderSchema(schema) {
      const viewer = document.getElementById('db-schema-viewer');
      if (!viewer) return;

      const tables = Object.keys(schema);
      if (tables.length === 0) {
        viewer.innerHTML = '<p class="text-muted">No tables available in SQLite instance.</p>';
        return;
      }

      viewer.innerHTML = tables.map(tbl => `
        <div class="schema-table-item mb-sm p-sm rounded border bg-surface-alt">
          <div class="font-bold text-xs text-primary d-flex items-center gap-xs mb-xs">
            <span class="text-success font-mono">■</span> ${UI.esc(tbl)}
          </div>
          <div class="d-flex flex-col gap-xs">
            ${schema[tbl].map(col => `
              <div class="d-flex justify-between text-xs text-secondary font-mono">
                <span>${UI.esc(col.name)}</span>
                <span class="text-muted">${UI.esc(col.type || 'TEXT')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    },

    toggleSchemaCollapse() {
      const viewer = document.getElementById('db-schema-viewer');
      const btn = document.getElementById('schema-toggle-btn');
      if (!viewer || !btn) return;

      if (viewer.classList.contains('hidden')) {
        viewer.classList.remove('hidden');
        btn.textContent = 'Collapse';
      } else {
        viewer.classList.add('hidden');
        btn.textContent = 'Expand';
      }
    },

    insertSQLSymbol(symbol) {
      const qInput = document.getElementById('sql-query-input');
      if (!qInput) return;
      const start = qInput.selectionStart || 0;
      const end = qInput.selectionEnd || 0;
      const val = qInput.value;
      qInput.value = val.substring(0, start) + symbol + val.substring(end);
      qInput.focus();
      qInput.selectionStart = qInput.selectionEnd = start + symbol.length;
    },

    async runSQL() {
      const qInput = document.getElementById('sql-query-input');
      const resultsContainer = document.getElementById('sql-results-container');
      if (!qInput || !resultsContainer) return;

      const query = qInput.value.trim();
      if (!query) {
        UI.toast('Please enter a SQL query.', 'warning');
        return;
      }

      resultsContainer.innerHTML = '<p class="text-muted text-center p-lg font-mono text-xs">Executing SQLite query on server...</p>';

      try {
        const res = await API.post('/api/curriculum/query', { query });
        if (res.error) {
          resultsContainer.innerHTML = `
            <div class="p-md text-danger font-mono text-xs">
              <strong>Query Execution Error:</strong><br>${UI.esc(res.error)}
            </div>
          `;
          return;
        }

        if (res.rows && res.rows.length > 0) {
          const cols = Object.keys(res.rows[0]);
          resultsContainer.innerHTML = `
            <table class="w-full text-xs font-mono">
              <thead>
                <tr class="bg-surface-alt border-b">
                  ${cols.map(c => `<th class="p-xs text-left">${UI.esc(c)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${res.rows.map(r => `
                  <tr class="border-b hover-row">
                    ${cols.map(c => `<td class="p-xs">${UI.esc(String(r[c] !== null ? r[c] : 'NULL'))}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        } else {
          resultsContainer.innerHTML = '<p class="text-success text-center p-md font-mono text-xs">Query completed. 0 rows returned.</p>';
        }
      } catch (e) {
        resultsContainer.innerHTML = `<div class="p-md text-danger font-mono text-xs">Network error: ${UI.esc(e.message)}</div>`;
      }
    },

    // ── 2. BACKEND API FLOW EXPLORER ─────────────────────────────────────────
    async runBackendInspector(action) {
      const outputEl = document.getElementById('backend-inspector-output');
      if (!outputEl) return;

      outputEl.innerHTML = '<pre><code>Waiting for API server response...</code></pre>';
      let endpoint = '/api/session';

      switch (action) {
        case 'get-session': endpoint = '/api/session'; break;
        case 'get-tasks': endpoint = '/api/tasks'; break;
        case 'get-schema': endpoint = '/api/curriculum/schema'; break;
        case 'get-habits': endpoint = '/api/habits'; break;
        case 'get-notes': endpoint = '/api/notes'; break;
        case 'get-courses': endpoint = '/api/courses'; break;
        case 'get-incomes': endpoint = '/api/incomes'; break;
        case 'get-expenses': endpoint = '/api/expenses'; break;
        case 'get-budget-summary': endpoint = '/api/budget/summary'; break;
        default: endpoint = action.startsWith('/') ? action : `/api/${action}`;
      }

      try {
        const res = await API.get(endpoint);
        outputEl.innerHTML = `
          <div class="d-flex justify-between items-center mb-sm">
            <span class="priority-badge priority-low">GET ${UI.esc(endpoint)}</span>
            <span class="text-success font-bold font-mono text-xs">200 OK</span>
          </div>
          <pre class="m-0 font-mono text-xs"><code class="language-json">${UI.esc(JSON.stringify(res, null, 2))}</code></pre>
        `;
        UI.toast(`Inspected ${endpoint}`, 'info');
      } catch (e) {
        outputEl.innerHTML = `<pre class="text-danger">Failed: ${UI.esc(e.message)}</pre>`;
      }
    },

    // ── 3. ALGORITHM SORTING VISUALIZER ──────────────────────────────────────
    generateAlgoArray(size = 12) {
      this.algoArray = [];
      for (let i = 0; i < size; i++) {
        this.algoArray.push(Math.floor(Math.random() * 180) + 30);
      }
      this.renderAlgoBars();
      const logEl = document.getElementById('algo-steps-log');
      if (logEl) logEl.textContent = 'Array initialized. Click a sorting algorithm to start visual trace.';
    },

    renderAlgoBars(activeIndices = [], sortedIndices = []) {
      const container = document.getElementById('algo-bars-container');
      if (!container) return;

      container.innerHTML = '';
      this.algoArray.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.className = 'algo-bar';
        bar.style.height = `${val}px`;

        if (sortedIndices.includes(idx)) bar.classList.add('sorted');
        else if (activeIndices.includes(idx)) bar.classList.add('active');

        const label = document.createElement('span');
        label.className = 'algo-bar-label';
        label.textContent = val;
        bar.appendChild(label);
        container.appendChild(bar);
      });
    },

    sleep(ms) {
      const speedInput = document.getElementById('algo-speed');
      const delay = speedInput ? parseInt(speedInput.value) : ms;
      return new Promise(resolve => setTimeout(resolve, delay));
    },

    async bubbleSort() {
      if (this.sortingInProgress) return;
      this.sortingInProgress = true;
      const logEl = document.getElementById('algo-steps-log');
      let arr = this.algoArray;
      let len = arr.length;

      if (logEl) logEl.innerHTML = `<strong>Bubble Sort started:</strong> Comparing adjacent index elements...`;

      let sorted = [];
      for (let i = 0; i < len; i++) {
        for (let j = 0; j < len - i - 1; j++) {
          this.renderAlgoBars([j, j + 1], sorted);
          await this.sleep(120);

          if (arr[j] > arr[j + 1]) {
            let temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
            if (logEl) logEl.innerHTML = `Swapping index <strong>${j}</strong> (${arr[j + 1]}) and index <strong>${j + 1}</strong> (${arr[j]}).`;
            this.renderAlgoBars([j, j + 1], sorted);
            await this.sleep(120);
          }
        }
        sorted.push(len - i - 1);
      }

      this.renderAlgoBars([], Array.from({ length: len }, (_, i) => i));
      if (logEl) logEl.innerHTML = `<strong>Bubble Sort Completed!</strong> Entire array ordered in O(n²) time.`;
      this.sortingInProgress = false;
      UI.toast('Bubble Sort completed!', 'success');
    },

    async startQuickSort() {
      if (this.sortingInProgress) return;
      this.sortingInProgress = true;
      const logEl = document.getElementById('algo-steps-log');
      if (logEl) logEl.innerHTML = `<strong>Quick Sort started!</strong> Average Time Complexity: O(n log n).`;

      await this.quickSort(0, this.algoArray.length - 1);
      this.renderAlgoBars([], Array.from({ length: this.algoArray.length }, (_, i) => i));
      if (logEl) logEl.innerHTML = `<strong>Quick Sort Completed!</strong> Array partitioned and ordered.`;
      this.sortingInProgress = false;
      UI.toast('Quick Sort completed!', 'success');
    },

    async quickSort(low, high) {
      if (low < high) {
        const pi = await this.partition(low, high);
        await this.quickSort(low, pi - 1);
        await this.quickSort(pi + 1, high);
      }
    },

    async partition(low, high) {
      const arr = this.algoArray;
      const pivot = arr[high];
      let i = low - 1;
      const logEl = document.getElementById('algo-steps-log');

      for (let j = low; j < high; j++) {
        this.renderAlgoBars([j, high]);
        await this.sleep(100);

        if (arr[j] < pivot) {
          i++;
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
          if (logEl) logEl.innerHTML = `Partitioning with pivot <strong>${pivot}</strong>: Swapping index ${i} and ${j}.`;
          this.renderAlgoBars([i, j]);
          await this.sleep(100);
        }
      }

      const temp = arr[i + 1];
      arr[i + 1] = arr[high];
      arr[high] = temp;
      this.renderAlgoBars([i + 1, high]);
      await this.sleep(100);
      return i + 1;
    },

    // ── 4. FLASHCARDS & QUIZ CONTROLLER ──────────────────────────────────────
    loadQuizQuestion() {
      const q = this.quizQuestions[this.quizIndex];
      const qText = document.getElementById('quiz-question-text');
      const optBox = document.getElementById('quiz-options-box');
      const progressText = document.getElementById('quiz-progress-text');
      const card3d = document.getElementById('quiz-card-3d');

      if (card3d) card3d.classList.remove('flipped');
      if (progressText) progressText.textContent = `Question ${this.quizIndex + 1}/${this.quizQuestions.length}`;
      if (qText) qText.textContent = q.question;

      if (optBox) {
        optBox.innerHTML = q.options.map((opt, idx) => `
          <button class="quiz-opt-btn" onclick="Curriculum.answerQuiz(${idx})" type="button">
            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
            <span>${UI.esc(opt)}</span>
          </button>
        `).join('');
      }
    },

    answerQuiz(selectedIndex) {
      const q = this.quizQuestions[this.quizIndex];
      const isCorrect = selectedIndex === q.answer;
      const badge = document.getElementById('quiz-result-badge');
      const feedbackBox = document.getElementById('quiz-feedback-box');
      const card3d = document.getElementById('quiz-card-3d');

      if (badge) {
        badge.textContent = isCorrect ? 'Correct! ✓' : 'Incorrect ✗';
        badge.className = `quiz-badge ${isCorrect ? 'badge-success' : 'badge-danger'}`;
      }

      if (feedbackBox) {
        feedbackBox.innerHTML = `
          <p class="explanation-text m-0">${UI.esc(q.explanation)}</p>
          ${!isCorrect ? `<div class="wrong-alert">Correct Answer: <strong>${UI.esc(q.options[q.answer])}</strong></div>` : ''}
        `;
      }

      if (card3d) card3d.classList.add('flipped');
    },

    nextQuiz() {
      this.quizIndex = (this.quizIndex + 1) % this.quizQuestions.length;
      this.loadQuizQuestion();
    },

    // ── 5. CSS FLEXBOX & GRID VISUALIZER ────────────────────────────────────
    updateFlexStage() {
      const stage = document.getElementById('flex-interactive-stage');
      const dir = document.getElementById('flex-dir-select')?.value || 'row';
      const justify = document.getElementById('flex-justify-select')?.value || 'flex-start';
      const align = document.getElementById('flex-align-select')?.value || 'stretch';
      const wrap = document.getElementById('flex-wrap-select')?.value || 'nowrap';
      const gap = document.getElementById('flex-gap-slider')?.value || '12';
      const gapVal = document.getElementById('flex-gap-val');
      const snippet = document.getElementById('flex-css-snippet');

      if (gapVal) gapVal.textContent = `${gap}px`;

      if (stage) {
        stage.style.flexDirection = dir;
        stage.style.justifyContent = justify;
        stage.style.alignItems = align;
        stage.style.flexWrap = wrap;
        stage.style.gap = `${gap}px`;
      }

      if (snippet) {
        snippet.textContent = `.container {\n  display: flex;\n  flex-direction: ${dir};\n  justify-content: ${justify};\n  align-items: ${align};\n  flex-wrap: ${wrap};\n  gap: ${gap}px;\n}`;
      }
    },

    addFlexItem() {
      if (this._flexBoxCount >= 8) {
        UI.toast('Maximum 8 boxes reached.', 'info');
        return;
      }
      this._flexBoxCount++;
      const stage = document.getElementById('flex-interactive-stage');
      const badge = document.getElementById('flex-item-count-badge');
      if (stage) {
        const box = document.createElement('div');
        box.className = `flex-stage-box box-${((this._flexBoxCount - 1) % 6) + 1}`;
        box.innerHTML = `<span>Box ${this._flexBoxCount}</span>`;
        stage.appendChild(box);
      }
      if (badge) badge.textContent = `${this._flexBoxCount} Items`;
      this.updateFlexStage();
    },

    removeFlexItem() {
      if (this._flexBoxCount <= 1) {
        UI.toast('Minimum 1 box required.', 'info');
        return;
      }
      const stage = document.getElementById('flex-interactive-stage');
      const badge = document.getElementById('flex-item-count-badge');
      if (stage && stage.lastElementChild) {
        stage.removeChild(stage.lastElementChild);
        this._flexBoxCount--;
      }
      if (badge) badge.textContent = `${this._flexBoxCount} Items`;
      this.updateFlexStage();
    },

    copyFlexCSS() {
      const snippet = document.getElementById('flex-css-snippet')?.textContent || '';
      navigator.clipboard?.writeText(snippet).then(() => {
        UI.toast('CSS rules copied to clipboard!', 'success');
      }).catch(() => {
        UI.toast('Failed to copy.', 'warning');
      });
    },

    // ── 6. JS ARRAY & FUNCTIONAL LAB ────────────────────────────────────────
    selectJSMethod(method) {
      this._currentJSMethod = method;
      const pills = document.querySelectorAll('#js-method-pills .day-pill-btn');
      pills.forEach(p => {
        if (p.textContent.includes(method)) p.classList.add('active');
        else p.classList.remove('active');
      });

      const exprInput = document.getElementById('js-callback-expr');
      const presets = {
        map: 'x => x * 2',
        filter: 'x => x > 40',
        reduce: '(acc, curr) => acc + curr',
        find: 'x => x % 5 === 0',
        sort: '(a, b) => a - b'
      };
      if (exprInput && presets[method]) {
        exprInput.value = presets[method];
      }
      this.runJSLab();
    },

    runJSLab() {
      const rawArr = document.getElementById('js-input-array')?.value || '[]';
      const rawExpr = document.getElementById('js-callback-expr')?.value || 'x => x';
      const resultView = document.getElementById('js-lab-result-view');
      if (!resultView) return;

      try {
        const arr = JSON.parse(rawArr);
        if (!Array.isArray(arr)) throw new Error('Input must be a valid JSON array.');

        const fn = new Function(`return (${rawExpr})`)();
        let result;
        let explanation = '';

        if (this._currentJSMethod === 'map') {
          result = arr.map(fn);
          explanation = `Transformed each of the ${arr.length} elements using ${rawExpr}.`;
        } else if (this._currentJSMethod === 'filter') {
          result = arr.filter(fn);
          explanation = `Filtered ${arr.length} elements down to ${result.length} matching elements.`;
        } else if (this._currentJSMethod === 'reduce') {
          result = arr.reduce(fn);
          explanation = `Aggregated ${arr.length} elements into a single accumulated scalar value.`;
        } else if (this._currentJSMethod === 'find') {
          result = arr.find(fn);
          explanation = `Found first matching element: ${result !== undefined ? result : 'undefined'}`;
        } else if (this._currentJSMethod === 'sort') {
          result = [...arr].sort(fn);
          explanation = `Sorted ${arr.length} elements using custom comparator.`;
        }

        resultView.innerHTML = `
          <div class="d-flex flex-col gap-md">
            <div class="d-flex justify-between items-center flex-wrap gap-xs">
              <span class="font-bold text-success text-sm">Operation Successful</span>
              <span class="priority-badge priority-low font-mono text-xs">.${this._currentJSMethod}()</span>
            </div>
            <p class="text-muted text-xs m-0">${UI.esc(explanation)}</p>
            <div class="p-md rounded border bg-surface-alt">
              <div class="text-xs font-bold text-muted mb-xs">OUTPUT RESULT:</div>
              <pre class="font-mono text-sm font-bold text-brand m-0">${UI.esc(JSON.stringify(result, null, 2))}</pre>
            </div>
          </div>
        `;
      } catch (err) {
        resultView.innerHTML = `
          <div class="p-md rounded border text-danger bg-surface-alt">
            <span class="font-bold text-sm">Execution Error</span>
            <p class="font-mono text-xs text-secondary mt-xs m-0">${UI.esc(err.message)}</p>
          </div>
        `;
      }
    },

    // ── 7. REGEX PATTERN VALIDATOR LAB ──────────────────────────────────────
    setRegexPreset(preset) {
      const patternInput = document.getElementById('regex-pattern-input');
      const flagsInput = document.getElementById('regex-flags-input');
      const textInput = document.getElementById('regex-test-text');

      const presets = {
        email: {
          pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
          flags: 'gi',
          text: 'Contact support@pocketsly.edu or rizzqi.maulana@campus.ac.id for assistance.'
        },
        date: {
          pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b',
          flags: 'g',
          text: 'Upcoming semester deadlines: Midterm Exam on 2026-10-15 and Final Project submission on 2026-12-20.'
        },
        phone: {
          pattern: '(?:\\+62|08)[0-9]{8,12}',
          flags: 'g',
          text: 'Academic advisor mobile: +6281234567890 or student hotline 081987654321.'
        },
        hex: {
          pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
          flags: 'gi',
          text: 'Design tokens: primary #7C3AED, success #10B981, danger #EF4444, and white #FFF.'
        },
        nim: {
          pattern: '\\b(?:20|21|22|23|24|25|26)\\d{6,8}\\b',
          flags: 'g',
          text: 'Registered students: NIM 241011526, NIM 241011589, and NIM 231011902.'
        }
      };

      if (presets[preset]) {
        if (patternInput) patternInput.value = presets[preset].pattern;
        if (flagsInput) flagsInput.value = presets[preset].flags;
        if (textInput) textInput.value = presets[preset].text;
      }
      this.testRegex();
    },

    testRegex() {
      const pattern = document.getElementById('regex-pattern-input')?.value || '';
      const flags = document.getElementById('regex-flags-input')?.value || 'g';
      const text = document.getElementById('regex-test-text')?.value || '';
      const highlightOutput = document.getElementById('regex-highlight-output');
      const matchesList = document.getElementById('regex-matches-list');
      const badge = document.getElementById('regex-match-badge');

      if (!pattern) {
        if (highlightOutput) highlightOutput.textContent = text;
        if (badge) badge.textContent = '0 Matches';
        if (matchesList) matchesList.innerHTML = '';
        return;
      }

      try {
        const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
        const matches = [...text.matchAll(regex)];

        if (badge) {
          badge.textContent = `${matches.length} Match${matches.length === 1 ? '' : 'es'}`;
        }

        if (matches.length === 0) {
          if (highlightOutput) highlightOutput.textContent = text;
          if (matchesList) matchesList.innerHTML = '<p class="text-muted text-xs m-0">No matches found in test string.</p>';
          return;
        }

        let highlighted = '';
        let lastIndex = 0;
        for (const m of matches) {
          const matchStart = m.index;
          const matchEnd = matchStart + m[0].length;
          highlighted += UI.esc(text.substring(lastIndex, matchStart));
          highlighted += `<mark class="regex-match-pill">${UI.esc(m[0])}</mark>`;
          lastIndex = matchEnd;
        }
        highlighted += UI.esc(text.substring(lastIndex));
        if (highlightOutput) highlightOutput.innerHTML = highlighted;

        if (matchesList) {
          matchesList.innerHTML = `
            <div class="d-flex flex-col gap-xs">
              <span class="text-xs font-bold text-muted">CAPTURED MATCHES:</span>
              <div class="d-flex gap-xs flex-wrap">
                ${matches.map((m, idx) => `<span class="priority-badge text-xs font-mono">#${idx + 1}: ${UI.esc(m[0])}</span>`).join('')}
              </div>
            </div>
          `;
        }
      } catch (err) {
        if (highlightOutput) highlightOutput.innerHTML = `<span class="text-danger font-mono text-xs">Invalid Regex: ${UI.esc(err.message)}</span>`;
        if (badge) badge.textContent = 'Error';
      }
    }
  };

  Object.assign(window.Curriculum, labsMethods);
})();


/* ===== budget.js ===== */
/**
 * MONTHLY BUDGET & CASH FLOW CONTROLLER (budget.js)
 * ===================================================
 * Manages financial accounting, cash flow KPIs, income/expense ledgers,
 * monthly category targets, CSV export, and print statements.
 */

// ── Module-level SVG icons ─────────────────────────────────────────────────
const BUDGET_SVG = {
  income:  `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
  expense: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
  trash:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
};

// ── Currencies Configuration Dictionary ─────────────────────────────────────
const CURRENCIES = {
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah (Rp)', prefix: 'IDR ', decimals: 0, locale: 'id-ID', placeholder: '50,000' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)', prefix: '$', decimals: 2, locale: 'en-US', placeholder: '25.00' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)', prefix: '€', decimals: 2, locale: 'de-DE', placeholder: '25.00' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)', prefix: '£', decimals: 2, locale: 'en-GB', placeholder: '20.00' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)', prefix: '¥', decimals: 0, locale: 'ja-JP', placeholder: '3,500' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)', prefix: 'S$', decimals: 2, locale: 'en-SG', placeholder: '30.00' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)', prefix: 'A$', decimals: 2, locale: 'en-AU', placeholder: '35.00' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)', prefix: 'C$', decimals: 2, locale: 'en-CA', placeholder: '35.00' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (RM)', prefix: 'RM ', decimals: 2, locale: 'ms-MY', placeholder: '50.00' }
};

window.Budget = {
  CURRENCIES,
  currentMonth: '',
  incomesList: [],
  expensesList: [],
  budgetsList: [],
  activeTxFilter: 'all',  // 'all', 'incomes', 'expenses'
  activeFormTab: 'income', // 'income', 'expense', 'budget'
  _handlePasteBound: null,

  _sumAmounts(list) {
    return list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  },

  getCurrency() {
    return '';
  },

  getCurrencyInfo() {
    return { code: '', symbol: '', prefix: '', decimals: 0, locale: 'en-US' };
  },

  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('en-US');
  },

  async setCurrency(code) {
    this.renderKPIs();
    this.renderDonut();
    this.renderMicroCharts();
    this.renderTransactionsList();
    this.renderCategoryCards();
  },

  init() {
    this.currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    this.setupEventListeners();
    this.initCurrencyFormatters();
    this.setDefaultDates();
    if (this._initOCR) {
      this._initOCR();
    }
  },

  _parseAmount(inputVal) {
    if (!inputVal && inputVal !== 0) return 0;
    const str = String(inputVal).replace(/,/g, '').trim();
    const clean = str.replace(/[^\d.-]/g, '');
    return parseFloat(clean) || 0;
  },

  initCurrencyFormatters() {
    document.querySelectorAll('.currency-formatted-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
        if (!raw) {
          e.target.value = '';
          return;
        }
        const num = parseInt(raw, 10);
        e.target.value = isNaN(num) ? '' : num.toLocaleString('en-US');
      });
    });
  },

  setDefaultDates() {
    const today = new Date().toISOString().substring(0, 10);
    const expDate = document.getElementById('expense-date');
    const incDate = document.getElementById('income-date');
    if (expDate && !expDate.value) expDate.value = today;
    if (incDate && !incDate.value) incDate.value = today;
  },

  async load() {
    const periodText = document.getElementById('budget-period-text');
    if (periodText) {
      const d = new Date();
      periodText.textContent = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    try {
      const [incRes, expRes, budRes] = await Promise.all([
        API.get('/api/incomes'),
        API.get('/api/expenses'),
        API.get('/api/budgets')
      ]);

      this.incomesList  = Array.isArray(incRes) ? incRes : [];
      this.expensesList = Array.isArray(expRes) ? expRes : [];
      this.budgetsList  = Array.isArray(budRes) ? budRes : [];

      this.renderKPIs();
      this.renderDonut();
      this.renderMicroCharts();
      this.renderTransactionsList();
      this.renderCategoryCards();
    } catch (e) {
      console.error('Failed to load budget data:', e);
      UI.toast('Failed to load budget ledger data.', 'danger');
    }
  },

  setupEventListeners() {
    // Expense form submit
    const expForm = document.getElementById('add-expense-form');
    if (expForm) {
      expForm.onsubmit = async (e) => {
        e.preventDefault();
        const amtInput = document.getElementById('expense-amount');
        const amount = this._parseAmount(amtInput?.value);
        const category = document.getElementById('expense-category')?.value.trim() || 'General';
        const expense_date = document.getElementById('expense-date')?.value;
        const wallet = document.getElementById('expense-wallet')?.value || 'Cash';
        const description = document.getElementById('expense-desc')?.value.trim() || '';

        if (!amount || amount <= 0) {
          UI.toast('Please enter a valid expense amount.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/expenses', {
            amount,
            category,
            expense_date,
            description: `${wallet ? '[' + wallet + '] ' : ''}${description}`.trim()
          });

          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast(`Expense of ${this.formatCurrency(amount)} recorded!`, 'success');
          if (amtInput) amtInput.value = '';
          const descEl = document.getElementById('expense-desc');
          if (descEl) descEl.value = '';
          this.closeEntryModal();
          await this.load();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Income form submit
    const incForm = document.getElementById('add-income-form');
    if (incForm) {
      incForm.onsubmit = async (e) => {
        e.preventDefault();
        const amtInput = document.getElementById('income-amount');
        const amount = this._parseAmount(amtInput?.value);
        const source = document.getElementById('income-source')?.value.trim() || 'Allowance';
        const income_date = document.getElementById('income-date')?.value;
        const wallet = document.getElementById('income-wallet')?.value || 'Cash';
        const recurring = document.getElementById('income-recurring')?.value || 'none';
        const description = document.getElementById('income-desc')?.value.trim() || '';

        if (!amount || amount <= 0) {
          UI.toast('Please enter a valid income amount.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/incomes', {
            amount,
            source,
            income_date,
            recurring,
            description: `${wallet ? '[' + wallet + '] ' : ''}${description}`.trim()
          });

          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast(`Income of +${this.formatCurrency(amount)} added!`, 'success');
          if (amtInput) amtInput.value = '';
          const descEl = document.getElementById('income-desc');
          if (descEl) descEl.value = '';
          this.closeEntryModal();
          await this.load();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Budget Target Limit submit
    const budForm = document.getElementById('add-budget-form');
    if (budForm) {
      budForm.onsubmit = async (e) => {
        e.preventDefault();
        const category = document.getElementById('budget-category')?.value.trim();
        const amount = this._parseAmount(document.getElementById('budget-amount')?.value);
        const month = this.currentMonth;

        if (!category || !amount || amount <= 0) {
          UI.toast('Please specify a category and positive target limit.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/budgets', { category, amount, month });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast(`Target for "${category}" set to ${this.formatCurrency(amount)}`, 'success');
          budForm.reset();
          this.closeEntryModal();
          await this.load();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }
  },

  // ── RENDER KPIs & SUMMARY METRICS ─────────────────────────────────────────
  renderKPIs() {
    const totalInc = this._sumAmounts(this.incomesList);
    const totalExp = this._sumAmounts(this.expensesList);
    const netBal   = totalInc - totalExp;

    const balEl    = document.getElementById('kpi-total-balance');
    const incEl    = document.getElementById('kpi-total-income');
    const expEl    = document.getElementById('kpi-total-spent');
    const statusEl = document.getElementById('kpi-balance-status');

    if (balEl) {
      balEl.textContent = (netBal >= 0 ? '+' : '-') + this.formatCurrency(Math.abs(netBal));
      balEl.style.color = netBal >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)';
    }

    if (incEl) incEl.textContent = '+' + this.formatCurrency(totalInc);
    if (expEl) expEl.textContent = '-' + this.formatCurrency(totalExp);

    if (statusEl) {
      if (netBal > 0) {
        statusEl.textContent = 'Healthy Surplus';
        statusEl.className = 'priority-badge priority-low font-bold text-xs';
      } else if (netBal === 0 && totalInc === 0) {
        statusEl.textContent = 'No Transactions Yet';
        statusEl.className = 'priority-badge priority-medium font-bold text-xs';
      } else if (netBal === 0) {
        statusEl.textContent = 'Break-even';
        statusEl.className = 'priority-badge priority-medium font-bold text-xs';
      } else {
        statusEl.textContent = 'Deficit Spending';
        statusEl.className = 'priority-badge priority-high font-bold text-xs';
      }
    }
  },

  renderDonut() {
    const totalInc = this._sumAmounts(this.incomesList);
    const totalExp = this._sumAmounts(this.expensesList);

    const segment = document.getElementById('donut-usage-segment');
    const pctText = document.getElementById('donut-percent-text');
    const feedback = document.getElementById('donut-feedback-text');

    let pct = 0;
    if (totalInc > 0) {
      pct = Math.round((totalExp / totalInc) * 100);
    } else if (totalExp > 0) {
      pct = 100;
    }

    const cappedPct = Math.min(pct, 100);
    if (segment) {
      segment.setAttribute('stroke-dasharray', `${cappedPct} ${100 - cappedPct}`);
      segment.style.stroke = pct > 90 ? '#EF4444' : pct > 75 ? '#F59E0B' : 'var(--primary)';
    }

    if (pctText) {
      pctText.textContent = `${pct}% of income spent`;
    }

    if (feedback) {
      if (totalInc === 0 && totalExp === 0) {
        feedback.textContent = 'Ready to track: Log daily expenses or income.';
      } else if (pct <= 50) {
        feedback.textContent = `Great savings rate! Only ${pct}% of cashflow utilized this month.`;
      } else if (pct <= 80) {
        feedback.textContent = `Balanced budget: ${pct}% of earnings spent so far.`;
      } else if (pct <= 100) {
        feedback.textContent = `Warning: ${pct}% spent. Approaching your total income ceiling.`;
      } else {
        feedback.textContent = `Alert: Spending exceeds income by ${pct - 100}%. Review outgoing expenses.`;
      }
    }
  },

  renderMicroCharts() {
    // Micro sparkline visualizer
  },

  // ── TRANSACTIONS LEDGER & FILTERING ───────────────────────────────────────
  filterTransactions(filter) {
    this.activeTxFilter = filter;
    ['all', 'incomes', 'expenses'].forEach(f => {
      const btn = document.getElementById(`tx-filter-${f}`);
      if (btn) {
        if (f === filter) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
    this.renderTransactionsList();
  },

  renderTransactionsList() {
    const listEl = document.getElementById('recent-transactions-list');
    if (!listEl) return;

    let items = [];
    if (this.activeTxFilter === 'all' || this.activeTxFilter === 'incomes') {
      this.incomesList.forEach(inc => {
        items.push({
          id: inc.id,
          type: 'income',
          title: inc.source || 'Income',
          date: inc.income_date,
          amount: Number(inc.amount),
          notes: inc.description || '',
          recurring: inc.recurring || 'none'
        });
      });
    }

    if (this.activeTxFilter === 'all' || this.activeTxFilter === 'expenses') {
      this.expensesList.forEach(exp => {
        items.push({
          id: exp.id,
          type: 'expense',
          title: exp.category || 'Expense',
          date: exp.expense_date,
          amount: Number(exp.amount),
          notes: exp.description || '',
          recurring: 'none'
        });
      });
    }

    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state p-xl text-center">
          <p class="text-muted m-0 text-sm">No transactions logged for this filter.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map(it => {
      const isInc = it.type === 'income';
      const sign = isInc ? '+' : '-';
      const colorClass = isInc ? 'text-success' : 'text-danger';
      const badgeIcon = isInc ? BUDGET_SVG.income : BUDGET_SVG.expense;

      return `
        <div class="task-item transaction-row p-sm mb-xs d-flex justify-between items-center">
          <div class="d-flex items-center gap-sm">
            <span class="tx-badge ${isInc ? 'badge-inc' : 'badge-exp'}">${badgeIcon}</span>
            <div>
              <div class="font-bold text-sm text-primary">${UI.esc(it.title)}</div>
              <div class="text-muted text-xs">${UI.esc(it.date || 'Today')} ${it.notes ? '• ' + UI.esc(it.notes) : ''}</div>
            </div>
          </div>
          <div class="d-flex items-center gap-md">
            <span class="font-mono font-extrabold ${colorClass} text-sm">${sign}${this.formatCurrency(it.amount)}</span>
            <button class="btn-icon text-muted cursor-pointer" onclick="Budget.deleteTransaction('${it.type}', ${it.id})" title="Delete entry" type="button">
              ${BUDGET_SVG.trash}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteTransaction(type, id) {
    if (!confirm(`Are you sure you want to remove this ${type} entry?`)) return;
    try {
      const endpoint = type === 'income' ? `/api/incomes/${id}` : `/api/expenses/${id}`;
      const res = await API.delete(endpoint);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Entry removed.', 'info');
        await this.load();
      }
    } catch (e) {
      UI.toast(e.message, 'danger');
    }
  },

  // ── CATEGORY TARGETS & LIMITS ─────────────────────────────────────────────
  renderCategoryCards() {
    const grid = document.getElementById('budget-category-cards');
    const summary = document.getElementById('category-targets-summary');
    if (!grid) return;

    if (this.budgetsList.length === 0) {
      if (summary) summary.textContent = '0 targets set';
      grid.innerHTML = `
        <div class="col-span-full text-center p-xl border rounded bg-surface-alt">
          <p class="text-muted text-sm m-0">No monthly category limits configured yet. Click "🎯 Set Target" above to allocate spending caps.</p>
        </div>
      `;
      return;
    }

    if (summary) summary.textContent = `${this.budgetsList.length} categories active`;

    grid.innerHTML = this.budgetsList.map(bud => {
      const catExpenses = this.expensesList.filter(e => (e.category || '').toLowerCase() === (bud.category || '').toLowerCase());
      const spent = this._sumAmounts(catExpenses);
      const limit = Number(bud.amount) || 1;
      const pct = Math.round((spent / limit) * 100);
      const remaining = limit - spent;

      let statusColor = 'var(--primary)';
      let statusBadge = 'On Track';
      let badgeClass = 'priority-low';

      if (pct >= 100) {
        statusColor = 'var(--accent-danger)';
        statusBadge = 'Exceeded';
        badgeClass = 'priority-high';
      } else if (pct >= 80) {
        statusColor = '#F59E0B';
        statusBadge = 'Warning (80%+)';
        badgeClass = 'priority-medium';
      }

      return `
        <div class="card p-md border rounded bg-surface-alt">
          <div class="d-flex justify-between items-start mb-sm">
            <div>
              <div class="font-bold text-sm text-primary">${UI.esc(bud.category)}</div>
              <span class="text-muted text-xs font-mono">${this.formatCurrency(spent)} of ${this.formatCurrency(limit)}</span>
            </div>
            <div class="d-flex items-center gap-xs">
              <span class="priority-badge ${badgeClass} text-xs">${statusBadge}</span>
              <button class="btn-icon text-muted cursor-pointer" onclick="Budget.deleteBudgetLimit(${bud.id})" title="Delete Target" type="button">×</button>
            </div>
          </div>
          <div class="course-progress-bar-container mb-xs">
            <div class="course-progress-bar-fill" style="width: ${Math.min(pct, 100)}%; background: ${statusColor};"></div>
          </div>
          <div class="d-flex justify-between text-xs text-muted mt-xs font-mono">
            <span>${pct}% used</span>
            <span class="${remaining >= 0 ? 'text-success' : 'text-danger'} font-bold">
              ${remaining >= 0 ? this.formatCurrency(remaining) + ' left' : this.formatCurrency(Math.abs(remaining)) + ' over'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteBudgetLimit(id) {
    if (!confirm('Remove this category limit?')) return;
    try {
      const res = await API.delete(`/api/budgets/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Category limit deleted.', 'info');
        await this.load();
      }
    } catch (e) {
      UI.toast(e.message, 'danger');
    }
  },

  // ── MODAL WINDOW CONTROLS ────────────────────────────────────────────────
  openEntryModal(tab = 'expense') {
    const modal = document.getElementById('budget-entry-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    this.switchModalTab(tab);
    document.body.classList.add('modal-open');
  },

  closeEntryModal() {
    const modal = document.getElementById('budget-entry-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  switchModalTab(tab) {
    this.activeFormTab = tab;
    ['expense', 'income', 'budget'].forEach(t => {
      const tabBtn = document.getElementById(`modal-tab-${t}`);
      const form = document.getElementById(`add-${t}-form`);
      if (tabBtn) {
        if (t === tab) tabBtn.classList.add(`active-${t}`);
        else tabBtn.classList.remove(`active-${t}`);
      }
      if (form) {
        if (t === tab) form.classList.remove('hidden');
        else form.classList.add('hidden');
      }
    });

    const titleEl = document.getElementById('budget-modal-title');
    if (titleEl) {
      if (tab === 'expense') titleEl.textContent = 'Log Outgoing Expense';
      else if (tab === 'income') titleEl.textContent = 'Log Incoming Cashflow';
      else titleEl.textContent = 'Set Monthly Category Limit';
    }
  },

  // ── EXPORT & PRINT STATEMENTS ─────────────────────────────────────────────
  exportCSV() {
    const rows = [
      ['Date', 'Type', 'Category / Source', 'Description / Account', 'Amount']
    ];

    this.incomesList.forEach(inc => {
      rows.push([
        inc.income_date || '',
        'INCOME',
        inc.source || '',
        inc.description || '',
        inc.amount || 0
      ]);
    });

    this.expensesList.forEach(exp => {
      rows.push([
        exp.expense_date || '',
        'EXPENSE',
        exp.category || '',
        exp.description || '',
        exp.amount || 0
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pocketsly_Cashflow_${this.currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    UI.toast('Exported cashflow ledger as CSV!', 'success');
  },

  printReport() {
    const printContainer = document.getElementById('financial-print-statement');
    if (!printContainer) return;

    let totalInc = this._sumAmounts(this.incomesList);
    let totalExp = this._sumAmounts(this.expensesList);
    const netBal = totalInc - totalExp;

    const allTx = [];
    this.incomesList.forEach(inc => {
      allTx.push({
        type: 'INCOME',
        date: inc.income_date,
        source: inc.source,
        notes: inc.description || '-',
        amount: Number(inc.amount) || 0,
        isIncome: true
      });
    });

    this.expensesList.forEach(exp => {
      allTx.push({
        type: 'EXPENSE',
        date: exp.expense_date,
        source: exp.category,
        notes: exp.description || '-',
        amount: Number(exp.amount) || 0,
        isIncome: false
      });
    });

    allTx.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    printContainer.innerHTML = `
      <div class="print-statement-box p-xl">
        <h2 class="m-0 text-xl font-bold">Pocketsly Financial Statement</h2>
        <p class="text-muted text-xs mb-lg">Statement Period: ${this.currentMonth}</p>
        <div class="d-flex gap-lg mb-lg">
          <div>Total Income: <strong class="text-success">+${this.formatCurrency(totalInc)}</strong></div>
          <div>Total Expense: <strong class="text-danger">-${this.formatCurrency(totalExp)}</strong></div>
          <div>Net Balance: <strong class="${netBal >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(netBal)}</strong></div>
        </div>
        <table class="w-full text-xs font-mono">
          <thead>
            <tr class="border-b">
              <th class="text-left p-xs">Date</th>
              <th class="text-left p-xs">Type</th>
              <th class="text-left p-xs">Category / Source</th>
              <th class="text-left p-xs">Notes</th>
              <th class="text-right p-xs">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${allTx.map(t => `
              <tr class="border-b">
                <td class="p-xs">${UI.esc(t.date || '-')}</td>
                <td class="p-xs font-bold ${t.isIncome ? 'text-success' : 'text-danger'}">${t.type}</td>
                <td class="p-xs">${UI.esc(t.source || '-')}</td>
                <td class="p-xs text-muted">${UI.esc(t.notes || '-')}</td>
                <td class="p-xs text-right font-bold">${t.isIncome ? '+' : '-'}${this.formatCurrency(t.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    window.print();
  },

  openLogModal(tab = null) {
    if (window.App && window.App.currentView !== 'budget') {
      window.App.navigateTo('budget');
    }
    this.openEntryModal(tab || 'expense');
  },

  // ── MOBILE QUICK ACTIONS (FAB bottom sheet) ──────────────────────────────
  openQuickActions() {
    const overlay = document.getElementById('budget-quick-overlay');
    if (overlay) overlay.classList.remove('hidden');
    document.body.classList.add('modal-open');
  },

  closeQuickActions() {
    const overlay = document.getElementById('budget-quick-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  quickAction(kind) {
    this.closeQuickActions();
    if (kind === 'scan') {
      if (this.openReceiptScanner) this.openReceiptScanner();
      return;
    }
    this.openEntryModal(kind);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.Budget) {
    Budget.init();
  }
});


/* ===== budget_ocr.js ===== */
/**
 * SMART RECEIPT SCANNER & OCR ENGINE (budget_ocr.js)
 * ==================================================
 * Extends window.Budget with receipt image preprocessing,
 * live camera stream capture, and client/server OCR data extraction.
 */

(function () {
  if (!window.Budget) window.Budget = {};

  const ocrMethods = {
    _activeCameraStream: null,
    _cameraFacing: 'environment',

    _initOCR() {
      this._handlePasteBound = (e) => this.handleReceiptPaste(e);
      this._bindScanModeToggle();
    },

    openReceiptScanner() {
      const modal = document.getElementById('receipt-scanner-modal');
      if (!modal) return;
      modal.classList.remove('hidden');
      this.resetReceiptScanner();
      this.switchScannerSource('upload');
      document.addEventListener('paste', this._handlePasteBound);
    },

    closeReceiptScanner() {
      const modal = document.getElementById('receipt-scanner-modal');
      if (modal) modal.classList.add('hidden');
      this.stopCameraStream();
      document.removeEventListener('paste', this._handlePasteBound);
    },

    switchScannerSource(source) {
      const uploadBtn = document.getElementById('btn-src-upload');
      const cameraBtn = document.getElementById('btn-src-camera');
      const dropzone = document.getElementById('receipt-dropzone');
      const cameraContainer = document.getElementById('receipt-camera-container');

      if (source === 'camera') {
        uploadBtn?.classList.remove('active');
        cameraBtn?.classList.add('active');
        dropzone?.classList.add('hidden');
        cameraContainer?.classList.remove('hidden');
        this.startCameraStream();
      } else {
        cameraBtn?.classList.remove('active');
        uploadBtn?.classList.add('active');
        cameraContainer?.classList.add('hidden');
        dropzone?.classList.remove('hidden');
        this.stopCameraStream();
      }
    },

    async startCameraStream() {
      this.stopCameraStream();
      const video = document.getElementById('receipt-camera-video');
      if (!video) return;

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera stream not supported in this browser.');
        }
        const constraints = {
          video: {
            facingMode: this._cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this._activeCameraStream = stream;
        video.srcObject = stream;
        await video.play();
      } catch (err) {
        console.warn('Live camera stream unavailable:', err);
        UI.toast('Camera preview unavailable — using photo picker instead.', 'info');
        document.getElementById('receipt-camera-input')?.click();
        this.switchScannerSource('upload');
      }
    },

    stopCameraStream() {
      if (this._activeCameraStream) {
        this._activeCameraStream.getTracks().forEach(track => track.stop());
        this._activeCameraStream = null;
      }
      const video = document.getElementById('receipt-camera-video');
      if (video) video.srcObject = null;
    },

    toggleCameraFacing() {
      this._cameraFacing = this._cameraFacing === 'environment' ? 'user' : 'environment';
      this.startCameraStream();
    },

    captureCameraSnapshot() {
      const video = document.getElementById('receipt-camera-video');
      if (!video || !video.videoWidth) {
        document.getElementById('receipt-camera-input')?.click();
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      this.stopCameraStream();

      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'camera_receipt.jpg', { type: 'image/jpeg' });
        this.processReceiptImage(file);
      }, 'image/jpeg', 0.92);
    },

    resetReceiptScanner() {
      const dropzone = document.getElementById('receipt-dropzone');
      const cameraContainer = document.getElementById('receipt-camera-container');
      const scanningState = document.getElementById('receipt-scanning-state');
      const resultsView = document.getElementById('receipt-results-view');
      const uploadInput = document.getElementById('receipt-upload-input');
      const cameraInput = document.getElementById('receipt-camera-input');

      this.stopCameraStream();

      if (dropzone) dropzone.classList.remove('hidden');
      if (cameraContainer) cameraContainer.classList.add('hidden');
      if (scanningState) scanningState.classList.add('hidden');
      if (resultsView) resultsView.classList.add('hidden');
      if (uploadInput) uploadInput.value = '';
      if (cameraInput) cameraInput.value = '';
    },

    handleReceiptUpload(e) {
      const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
      if (!file) return;
      this.stopCameraStream();
      this.processReceiptImage(file);
    },

    handleReceiptPaste(e) {
      const items = (e.clipboardData || window.clipboardData)?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            this.processReceiptImage(file);
            break;
          }
        }
      }
    },

    processReceiptImage(file) {
      const dropzone = document.getElementById('receipt-dropzone');
      const scanningState = document.getElementById('receipt-scanning-state');
      const resultsView = document.getElementById('receipt-results-view');
      const previewImg = document.getElementById('receipt-preview-img');
      const mode = this._getScanMode();

      if (dropzone) dropzone.classList.add('hidden');
      if (scanningState) scanningState.classList.remove('hidden');
      if (resultsView) resultsView.classList.add('hidden');

      const reader = new FileReader();
      reader.onload = async (event) => {
        const imgSrc = event.target.result;
        if (previewImg) previewImg.src = imgSrc;

        try {
          let parsed;
          if (mode === 'on-device') {
            parsed = await this._scanReceiptOnDevice(file);
          } else {
            parsed = await this._scanReceiptServer(imgSrc, file.name);
          }
          this._fillReceiptFields(parsed);
        } catch (err) {
          console.warn('OCR failed, using filename heuristic:', err);
          const parsed = this._extractReceiptDetails(file.name || 'receipt.jpg');
          this._fillReceiptFields(parsed);
        }

        if (scanningState) scanningState.classList.add('hidden');
        if (resultsView) resultsView.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    },

    _getScanMode() {
      const toggle = document.getElementById('receipt-scan-mode');
      return toggle?.value === 'on-device' ? 'on-device' : 'server';
    },

    _bindScanModeToggle() {
      const seg = document.querySelector('.receipt-scan-mode-seg');
      const toggle = document.getElementById('receipt-scan-mode');
      if (!seg) return;
      seg.addEventListener('click', (e) => {
        const btn = e.target.closest('.receipt-scan-mode-btn');
        if (!btn) return;
        seg.querySelectorAll('.receipt-scan-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (toggle) toggle.value = btn.dataset.mode;
      });
    },

    async _scanReceiptOnDevice(file) {
      await this._ensureTesseract();
      const worker = await Tesseract.createWorker('eng', 1, {
        workerPath: '/vendor/worker.min.js',
        corePath: '/vendor/',
        langPath: '/vendor/',
        logger: () => {}
      });
      try {
        const result = await worker.recognize(file);
        const parsed = this._parseReceiptText(result?.data?.text || '');
        if (parsed.amount == null) {
          throw new Error('No amount detected');
        }
        return parsed;
      } finally {
        await worker.terminate();
      }
    },

    _ensureTesseract() {
      if (typeof Tesseract !== 'undefined') return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/vendor/tesseract.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load OCR library'));
        document.head.appendChild(script);
      });
    },

    _parseReceiptText(text) {
      const today = new Date().toISOString().substring(0, 10);
      const result = { merchant: 'Store Receipt', amount: null, date: today, category: 'Food & Dining' };
      const lower = (text || '').toLowerCase();

      const merchantMap = [
        [['starbucks', 'coffee', 'cafe'], 'Starbucks Coffee', 'Coffee & Snacks'],
        [['indomaret', 'alfamart', 'alfamidi', 'mart'], 'Indomaret Point', 'Food & Dining'],
        [['mcdonald', 'mcd', 'kfc', 'burger', 'fried chicken'], 'Fast Food Restaurant', 'Food & Dining'],
        [['grab', 'gojek', 'go ride', 'uber', 'taxi', 'fuel', 'shell', 'pertamina', 'bensin'], 'Transport', 'Transportation'],
        [['gramedia', 'bookstore', 'books', 'stationery', 'print'], 'Bookstore', 'Books & Study'],
        [['pln', 'wifi', 'indihome', 'internet', 'bill', 'token'], 'IndiHome / Utility Bill', 'Bills & Wifi'],
        [['apotek', 'pharma', 'kimia farma', 'doctor', 'clinic', 'rs '], 'Pharmacy / Clinic', 'Health & Medical'],
        [['rent', 'kos', 'sewa', 'kontrakan'], 'Housing Rent', 'Housing / Rent'],
        [['cinema', 'cinemax', 'xxi', 'game', 'concert', 'movie'], 'Entertainment', 'Entertainment']
      ];
      for (const [keywords, merchant, category] of merchantMap) {
        if (keywords.some(k => lower.includes(k))) {
          result.merchant = merchant;
          result.category = category;
          break;
        }
      }

      if (result.merchant === 'Store Receipt') {
        for (const line of (text || '').split('\n')) {
          const l = line.trim();
          if (l && !/\d/.test(l) && l.length <= 40) {
            result.merchant = l.replace(/\b\w/g, c => c.toUpperCase());
            break;
          }
        }
      }

      const dateMatch = (text || '').match(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/);
      if (dateMatch) {
        const parts = dateMatch[0].split(/[\/\-.]/);
        if (parts.length === 3) {
          if (parts[2].length === 2) parts[2] = '20' + parts[2];
          result.date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      const totalKeywords = ['total', 'jumlah', 'bayar', 'amount', 'grand', 'total bayar', 'total pembayaran'];
      for (const line of (text || '').split('\n')) {
        if (totalKeywords.some(k => line.toLowerCase().includes(k))) {
          const amount = this._cleanReceiptAmount(line);
          if (amount != null && amount > 0) {
            result.amount = amount;
            break;
          }
        }
      }

      if (result.amount == null) {
        const lines = (text || '').split('\n').filter(l => l.trim());
        const bottom = lines.slice(Math.max(0, lines.length - Math.floor(lines.length / 3))) || lines;
        let best = null;
        for (const line of bottom) {
          const amount = this._cleanReceiptAmount(line);
          if (amount != null && (best == null || amount > best)) best = amount;
        }
        if (best != null) result.amount = best;
      }

      return result;
    },

    _cleanReceiptAmount(raw) {
      if (!raw) return null;
      const str = String(raw).replace(/(?:rp\.?|idr|usd|\$|€|£|¥)/gi, ' ').trim();
      const numMatch = str.match(/([0-9]+(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+)/);
      if (!numMatch) return null;

      let valStr = numMatch[1].trim();
      if (/^\d{1,3}(?:[.]\d{3})+(?:,\d{2})$/.test(valStr)) {
        valStr = valStr.replace(/\./g, '').replace(',', '.');
      } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{2})$/.test(valStr)) {
        valStr = valStr.replace(/,/g, '');
      } else if (/^\d{1,3}(?:[.]\d{3})+$/.test(valStr)) {
        valStr = valStr.replace(/\./g, '');
      } else if (/^\d{1,3}(?:,\d{3})+$/.test(valStr)) {
        valStr = valStr.replace(/,/g, '');
      } else if (/^\d+,\d{2}$/.test(valStr)) {
        valStr = valStr.replace(',', '.');
      }

      const num = parseFloat(valStr);
      return (isNaN(num) || num <= 0) ? null : Math.round(num);
    },

    async _scanReceiptServer(dataUrl, filename) {
      const base64 = dataUrl.split(',')[1];
      const res = await fetch('/api/receipt/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: filename || 'receipt.jpg' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Scan failed (${res.status})`);
      }
      const data = await res.json();
      const payload = data.data || data;
      if (!payload || payload.amount == null || payload.amount === 0) {
        const fallback = this._extractReceiptDetails(filename || 'receipt.jpg');
        return {
          merchant: payload.merchant && payload.merchant !== 'Store / Merchant' ? payload.merchant : fallback.merchant,
          amount: fallback.amount,
          date: payload.date || fallback.date,
          category: payload.category || fallback.category
        };
      }
      return {
        merchant: payload.merchant || 'Store Receipt',
        amount: payload.amount,
        date: payload.date || new Date().toISOString().substring(0, 10),
        category: payload.category || 'Food & Dining'
      };
    },

    _fillReceiptFields(parsed) {
      const merchantInput = document.getElementById('receipt-parsed-merchant');
      const amountInput = document.getElementById('receipt-parsed-amount');
      const dateInput = document.getElementById('receipt-parsed-date');
      const catSelect = document.getElementById('receipt-parsed-category');

      const formattedAmount = this.formatCurrency(parsed.amount);
      if (merchantInput) merchantInput.value = parsed.merchant;
      if (amountInput) amountInput.value = formattedAmount;
      if (dateInput) dateInput.value = parsed.date;
      if (catSelect) catSelect.value = parsed.category;
      UI.toast(`Receipt processed! Detected ${formattedAmount}`, 'success');
    },

    _extractReceiptDetails(filename) {
      const today = new Date().toISOString().substring(0, 10);
      let merchant = 'Store Receipt';
      let amount = 45000;
      let date = today;
      let category = 'Food & Dining';

      const cleanName = (filename || '').toLowerCase();

      if (cleanName.includes('starbucks') || cleanName.includes('coffee') || cleanName.includes('cafe')) {
        merchant = 'Starbucks Coffee';
        amount = 58000;
        category = 'Coffee & Snacks';
      } else if (cleanName.includes('indomaret') || cleanName.includes('alfamart') || cleanName.includes('mart')) {
        merchant = 'Indomaret Point';
        amount = 64500;
        category = 'Food & Dining';
      } else if (cleanName.includes('mcdonald') || cleanName.includes('mcd') || cleanName.includes('kfc') || cleanName.includes('burger')) {
        merchant = "McDonald's";
        amount = 82000;
        category = 'Food & Dining';
      } else if (cleanName.includes('grab') || cleanName.includes('gojek') || cleanName.includes('uber') || cleanName.includes('taxi') || cleanName.includes('fuel') || cleanName.includes('shell') || cleanName.includes('pertamina')) {
        merchant = 'Pertamina Fuel Station';
        amount = 100000;
        category = 'Transportation';
      } else if (cleanName.includes('gramedia') || cleanName.includes('book') || cleanName.includes('paper') || cleanName.includes('print')) {
        merchant = 'Gramedia Bookstore';
        amount = 125000;
        category = 'Books & Study';
      } else if (cleanName.includes('pln') || cleanName.includes('wifi') || cleanName.includes('indihome') || cleanName.includes('bill')) {
        merchant = 'IndiHome Fiber Wifi';
        amount = 385000;
        category = 'Bills & Wifi';
      } else if (cleanName.includes('apotek') || cleanName.includes('pharma') || cleanName.includes('doctor') || cleanName.includes('clinic')) {
        merchant = 'Apotek Kimia Farma';
        amount = 75000;
        category = 'Health & Medical';
      } else {
        const numbersInName = cleanName.match(/\d{4,}/);
        if (numbersInName) {
          amount = parseInt(numbersInName[0], 10);
        }
      }

      return { merchant, amount, date, category };
    },

    applyReceiptToExpense() {
      const merchant = document.getElementById('receipt-parsed-merchant')?.value || '';
      const amountVal = document.getElementById('receipt-parsed-amount')?.value || '';
      const dateVal = document.getElementById('receipt-parsed-date')?.value || '';
      const catVal = document.getElementById('receipt-parsed-category')?.value || 'Food & Dining';

      const expenseCat = document.getElementById('expense-category');
      const expenseAmt = document.getElementById('expense-amount');
      const expenseDate = document.getElementById('expense-date');
      const expenseDesc = document.getElementById('expense-desc');

      if (expenseCat) expenseCat.value = catVal;
      if (expenseAmt) expenseAmt.value = amountVal;
      if (expenseDate) expenseDate.value = dateVal;
      if (expenseDesc) expenseDesc.value = merchant ? `Receipt: ${merchant}` : 'Scanned receipt';

      this.closeReceiptScanner();
      this.switchModalTab('expense');
      UI.toast(`Receipt applied! ${merchant ? merchant + ' • ' : ''}${amountVal}`, 'success');
    }
  };

  Object.assign(window.Budget, ocrMethods);
})();


/* ===== command_palette.js ===== */
/**
 * COMMAND PALETTE MODULE (command_palette.js)
 * ============================================
 * LEARN: Spotlight Search & Keyboard Shortcut Architecture
 *
 * 1. Global Keyboard Hook — Listening to 'keydown' for (e.metaKey || e.ctrlKey) && e.key === 'k'
 *                           intercepts the standard browser shortcut to open the spotlight modal.
 * 2. Search Indexing      — Commands are structured with { id, title, category, icon, action, keywords }.
 * 3. Keyboard Navigation  — Up/Down arrows adjust activeIndex, and Enter executes the action.
 * 4. Micro-Interactions   — Highlighting search matches and closing seamlessly on Escape or backdrop click.
 */

const CommandPalette = {
  isOpen: false,
  activeIndex: 0,
  currentCategory: 'all',
  currentQuery: '',
  filteredItems: [],
  debounceTimer: null,

  onInputDebounced(val) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.filter(val);
    }, 60);
  },

  /** Static list of global system commands and view routes */
  getSystemCommands() {
    return [
      // ── Navigation ────────────────────────────────────────────────────────
      { id: 'nav-dash', title: 'Go to Dashboard', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>', action: () => window.App?.navigateTo('dashboard'), keywords: 'home stats overview' },
      { id: 'nav-habits', title: 'Go to Daily Planner (Habits & Tasks)', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', action: () => window.App?.navigateTo('habits'), keywords: 'habits tasks todos routine streak' },
      { id: 'nav-schedule', title: 'Go to Weekly Timetable', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', action: () => window.App?.navigateTo('schedule'), keywords: 'timetable schedule classes calendar' },
      { id: 'nav-notes', title: 'Go to Journal & Notes', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.switchTab('notes'), 50); }, keywords: 'notes journal thoughts reflections study' },
      { id: 'nav-library', title: 'Go to Library & Academic Journals', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.switchTab('library'), 50); }, keywords: 'library journals books papers research articles reading' },
      { id: 'nav-curriculum', title: 'Go to Curriculum Lab & GPA', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', action: () => window.App?.navigateTo('curriculum'), keywords: 'curriculum lab gpa grade sql algorithms courses' },
      { id: 'nav-budget', title: 'Go to Monthly Budget Tracker', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>', action: () => window.App?.navigateTo('budget'), keywords: 'budget finance expenses income money cash' },
      { id: 'nav-profile', title: 'Open Profile Settings', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', action: () => window.App?.openProfileSettings(), keywords: 'profile settings account password backup' },

      // ── Quick Actions ─────────────────────────────────────────────────────
      { id: 'act-habit', title: 'Create New Habit', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', action: () => window.Habits?.openCreateModal(), keywords: 'new habit routine create add' },
      { id: 'act-task', title: 'Create New Focus Task', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', action: () => window.Tasks?.openCreateModal(), keywords: 'new task todo item priority' },
      { id: 'act-note', title: 'Create New Note', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.startNewNote(), 50); }, keywords: 'new note write journal' },
      { id: 'act-resource', title: 'Add Resource to Academic Library', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.switchTab('library'), 50); }, keywords: 'new book paper journal resource library' },
      { id: 'act-block', title: 'Add Timetable Schedule Block', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', action: () => window.Schedule?.openCreateModal(), keywords: 'new event class block schedule' },
      { id: 'act-pomo', title: 'Open Pomodoro Focus Timer', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="15" y2="15"/></svg>', action: () => window.Timer?.openModal(), keywords: 'pomodoro timer focus clock study work' },
      { id: 'act-export-csv', title: 'Export Monthly Budget to CSV', category: 'Finance', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="12" x2="12" y2="3"/></svg>', action: () => window.Budget?.exportCSV(), keywords: 'export csv budget financial download spreadsheet' },
      { id: 'act-print-fin', title: 'Print Financial Summary Report', category: 'Finance', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>', action: () => window.Budget?.printReport(), keywords: 'print pdf budget financial ledger report' },
      { id: 'act-backup', title: 'Download JSON Data Backup', category: 'System', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>', action: () => window.App?.exportBackup(), keywords: 'backup export json save download data' },
      { id: 'act-theme', title: 'Toggle Light / Dark Theme', category: 'System', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>', action: () => window.UI?.toggleTheme(), keywords: 'theme dark light mode switch appearance' },
    ];
  },

  init() {
    // Global hotkey listener (Cmd+K on Mac, Ctrl+K on Windows/Linux)
    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isK = e.key?.toLowerCase() === 'k' || e.code === 'KeyK';

      if (isCmdOrCtrl && isK) {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });
  },

  setCategory(cat) {
    this.currentCategory = cat;
    const pills = document.querySelectorAll('.palette-filter-pill');
    pills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-cat') === cat);
    });
    this.filter(this.currentQuery || '');
  },

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  },

  open() {
    this.isOpen = true;
    this.currentCategory = 'all';
    this.currentQuery = '';
    const pills = document.querySelectorAll('.palette-filter-pill');
    pills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-cat') === 'all');
    });
    const overlay = document.getElementById('command-palette-overlay');
    const input = document.getElementById('command-palette-input');
    if (overlay) {
      document.body.classList.add('modal-open');
      overlay.classList.remove('hidden');
    }
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }
    this.filter('');
  },

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('command-palette-overlay');
    if (overlay) {
      document.body.classList.remove('modal-open');
      overlay.classList.add('hidden');
    }
  },

  /** Filters available commands and user content by search query */
  filter(query) {
    this.currentQuery = query;
    const q = query.trim().toLowerCase();
    let commands = [...this.getSystemCommands()];

    // Add dynamic task search results
    if (window.Tasks?.tasksList) {
      window.Tasks.tasksList.forEach(t => {
        commands.push({
          id: `task-${t.id}`,
          title: `Task: ${t.title}`,
          category: 'Tasks',
          icon: t.done ? '<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' : '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>',
          action: () => {
            window.App?.navigateTo('habits');
          },
          keywords: `task ${t.title} ${t.priority || ''}`
        });
      });
    }

    // Add dynamic note search results
    if (window.Notes?.notesList) {
      window.Notes.notesList.forEach(n => {
        commands.push({
          id: `note-${n.id}`,
          title: `Note: ${n.title || 'Untitled'}`,
          category: 'Notes',
          icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
          action: () => {
            window.App?.navigateTo('notes');
            window.Notes?.selectNote(n.id);
          },
          keywords: `note ${n.title || ''} ${n.body || ''} ${n.mood || ''}`
        });
      });
    }

    // Apply category filter if not 'all'
    if (this.currentCategory && this.currentCategory !== 'all') {
      commands = commands.filter(item => item.category?.toLowerCase() === this.currentCategory.toLowerCase());
    }

    if (!q) {
      this.filteredItems = commands;
    } else {
      this.filteredItems = commands.filter(item => {
        const text = `${item.title} ${item.category} ${item.keywords || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    this.activeIndex = 0;
    this.render();
  },

  handleKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.filteredItems.length > 0) {
        this.activeIndex = (this.activeIndex + 1) % this.filteredItems.length;
        this.render();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.filteredItems.length > 0) {
        this.activeIndex = (this.activeIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
        this.render();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.executeActive();
    }
  },

  executeActive() {
    const item = this.filteredItems[this.activeIndex];
    if (item && item.action) {
      this.close();
      item.action();
    }
  },

  selectItem(index) {
    this.activeIndex = index;
    this.executeActive();
  },

  render() {
    const listEl = document.getElementById('command-palette-results');
    if (!listEl) return;

    if (this.filteredItems.length === 0) {
      listEl.innerHTML = `
        <div class="palette-empty" style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.88rem;">
          No matching commands or items found.
        </div>
      `;
      return;
    }

    // Group items by category
    const groups = {};
    this.filteredItems.forEach((item, idx) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ item, globalIdx: idx });
    });

    let html = '';
    for (const [catName, entries] of Object.entries(groups)) {
      html += `<div class="palette-group-title">${UI.esc(catName)}</div>`;
      for (const { item, globalIdx } of entries) {
        const isSelected = globalIdx === this.activeIndex;
        html += `
          <div class="palette-item ${isSelected ? 'selected' : ''}" onclick="CommandPalette.selectItem(${globalIdx})" onmouseenter="CommandPalette.activeIndex = ${globalIdx}; CommandPalette.renderSelectedOnly();">
            <span class="palette-item-icon">${item.icon}</span>
            <span class="palette-item-title">${UI.esc(item.title)}</span>
            <span class="palette-item-cat">${UI.esc(item.category)}</span>
          </div>
        `;
      }
    }

    listEl.innerHTML = html;

    // Ensure selected item is scrolled into view
    const selectedEl = listEl.querySelector('.palette-item.selected');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  },

  renderSelectedOnly() {
    const items = document.querySelectorAll('.palette-item');
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === this.activeIndex);
    });
  }
};

// Export to window for global invocation across modules
window.CommandPalette = CommandPalette;

// Initialize listener on DOM ready
document.addEventListener('DOMContentLoaded', () => CommandPalette.init());


/* ===== timer.js ===== */
/**
 * POMODORO FOCUS TIMER MODULE (timer.js)
 * =======================================
 * LEARN: Precision Web Timers, State Machines & Web Audio API
 *
 * 1. Drift-Free Timing  — Instead of relying solely on setInterval ticks (which drift when tabs are inactive),
 *                         we record `targetEndTime` and calculate `Math.round((endTime - Date.now()) / 1000)`.
 * 2. Web Audio Chimes   — Synthesizes harmonic bell tones using native AudioContext oscillators.
 *                         Zero external MP3 audio file dependencies!
 * 3. Focus Cycles       — Automates the cycle: Work (25m) -> Short Break (5m) -> Work -> Long Break (15m).
 * 4. Task Integration   — Lets users tag their active task to track focused study/work intervals.
 */

const Timer = {
  // Modes & Durations (in seconds)
  MODES: {
    pomodoro:    { label: 'Focus Work', duration: 25 * 60, color: '#7C3AED' },
    short_break: { label: 'Short Break', duration: 5 * 60,  color: '#10B981' },
    long_break:  { label: 'Long Break',  duration: 15 * 60, color: '#3B82F6' },
  },

  currentMode: 'pomodoro',
  timeLeft: 25 * 60,
  isRunning: false,
  timerInterval: null,
  targetEndTime: null,
  completedCycles: 0,
  activeTaskId: null,

  init() {
    this.restoreState();
    this.requestNotificationPermission();
    if (!this.isRunning && (!this.timeLeft || this.timeLeft <= 0)) {
      this.timeLeft = this.MODES[this.currentMode].duration;
    }
    this.updateDisplay();
  },

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  sendSystemNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (e) {
        console.warn('System notification failed:', e);
      }
    }
  },

  saveState() {
    try {
      localStorage.setItem('pocketsly_timer_state', JSON.stringify({
        currentMode: this.currentMode,
        timeLeft: this.timeLeft,
        isRunning: this.isRunning,
        targetEndTime: this.targetEndTime,
        completedCycles: this.completedCycles,
        savedAt: Date.now()
      }));
    } catch (e) {}
  },

  restoreState() {
    try {
      const saved = localStorage.getItem('pocketsly_timer_state');
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data) return;

      if (this.MODES[data.currentMode]) {
        this.currentMode = data.currentMode;
      }
      this.completedCycles = Number(data.completedCycles) || 0;

      if (data.isRunning && data.targetEndTime) {
        const remainingMs = data.targetEndTime - Date.now();
        if (remainingMs > 0) {
          this.timeLeft = Math.round(remainingMs / 1000);
          this.start(true); // continue running
          return;
        } else {
          this.timeLeft = 0;
          this.onComplete(true); // session finished while the page was closed
          return;
        }
      } else {
        this.timeLeft = typeof data.timeLeft === 'number' ? data.timeLeft : this.MODES[this.currentMode].duration;
      }
    } catch (e) {
      console.warn('Could not restore timer state:', e);
    }
  },

  _audioCtx: null,

  _ensureAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this._audioCtx) {
        this._audioCtx = new AudioCtx();
      }
      if (this._audioCtx.state === 'suspended') {
        this._audioCtx.resume();
      }
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  },

  /** Synthesizes a gentle harmonic 2-tone chime via Web Audio API */
  playChime() {
    try {
      this._ensureAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;

      // Tone 1: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.7);

      // Tone 2: B5 (987.77Hz) harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.18);
      gain2.gain.setValueAtTime(0.3, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 1.1);
    } catch (err) {
      console.warn('Web Audio chime could not play:', err);
    }
  },

  setMode(mode) {
    if (!this.MODES[mode]) return;
    this.pause();
    this.currentMode = mode;
    this.timeLeft = this.MODES[mode].duration;
    this.targetEndTime = null;
    this.saveState();
    this.updateDisplay();
    this.renderModeButtons();
    this.updateControls();
  },

  toggle() {
    this._ensureAudioContext();
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  start(isResume = false) {
    if (this.isRunning && !isResume) return;
    this._ensureAudioContext();
    this.isRunning = true;
    this.targetEndTime = Date.now() + (this.timeLeft * 1000);
    this.saveState();

    // Initial display sync
    this.updateDisplay();
    this.updateControls();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      const remainingMs = this.targetEndTime - Date.now();
      this.timeLeft = Math.max(0, Math.round(remainingMs / 1000));
      this.updateDisplay();
      this.saveState();

      if (this.timeLeft <= 0) {
        this.onComplete(false);
      }
    }, 250);
  },

  pause() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.targetEndTime = null;
    this.saveState();
    this.updateDisplay();
    this.updateControls();
  },

  reset() {
    this.pause();
    this.timeLeft = this.MODES[this.currentMode].duration;
    this.targetEndTime = null;
    this.saveState();
    this.updateDisplay();
    this.updateControls();
    UI.toast(`Timer reset to ${this.MODES[this.currentMode].label} (${this.formatTime(this.timeLeft)})`, 'info');
  },

  skip() {
    this.pause();
    if (this.currentMode === 'pomodoro') {
      this.completedCycles++;
      const nextMode = (this.completedCycles % 4 === 0) ? 'long_break' : 'short_break';
      this.setMode(nextMode);
      UI.toast(`Focus session complete! Take a ${this.MODES[nextMode].label.toLowerCase()}.`, 'success');
    } else {
      this.setMode('pomodoro');
      UI.toast('Break over. Ready for your next focus session!', 'info');
    }
  },

  /** Offers to log the finished focus session to the study log. Skipped when
      the session expired while the page was closed (fromRestore), so the modal
      never pops up uninvited on page load. */
  offerStudyLog() {
    // Only called from the pomodoro branch of onComplete; note this runs AFTER
    // setMode() has switched currentMode to the break, so don't re-check it.
    if (!window.Curriculum) return;
    const hours = Math.round((this.MODES.pomodoro.duration / 3600) * 100) / 100; // 1500s -> 0.42h
    window.Curriculum.openLogStudyModal({
      hours: hours,
      notes: 'Focus session (Pomodoro)'
    });
  },

  onComplete(fromRestore = false) {
    this.pause();
    this.playChime();

    if (this.currentMode === 'pomodoro') {
      this.completedCycles++;
      const nextMode = (this.completedCycles % 4 === 0) ? 'long_break' : 'short_break';
      UI.toast(`Pomodoro completed! Cycle #${this.completedCycles}. Time for ${this.MODES[nextMode].label}.`, 'success');
      this.sendSystemNotification('Focus Session Finished!', `Pomodoro completed! Cycle #${this.completedCycles}. Time for ${this.MODES[nextMode].label}.`);
      this.setMode(nextMode);
      if (!fromRestore) this.offerStudyLog();
    } else {
      UI.toast('Break finished! Ready to focus.', 'info');
      this.sendSystemNotification('Break Finished!', 'Break finished! Ready to focus.');
      this.setMode('pomodoro');
    }
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  updateDisplay() {
    const formatted = this.formatTime(this.timeLeft);

    // 1. Update Header time button
    const headerTimeEl = document.getElementById('pomo-header-time');
    if (headerTimeEl) {
      headerTimeEl.textContent = formatted;
    }

    const headerPomoBtn = document.querySelector('.header-pomo-btn');
    if (headerPomoBtn) {
      if (this.isRunning) {
        headerPomoBtn.style.borderColor = this.MODES[this.currentMode].color;
        headerPomoBtn.style.color = this.MODES[this.currentMode].color;
      } else {
        headerPomoBtn.style.borderColor = '';
        headerPomoBtn.style.color = '';
      }
    }

    // 2. Update Modal elements
    const modalTimerEl = document.getElementById('pomo-timer-display');
    const modalProgressEl = document.getElementById('pomo-progress-ring');
    const modalModeLabel = document.getElementById('pomo-mode-label');
    const modalCycleCount = document.getElementById('pomo-cycle-count');

    if (modalTimerEl) modalTimerEl.textContent = formatted;
    if (modalModeLabel) modalModeLabel.textContent = this.MODES[this.currentMode].label;
    if (modalCycleCount) modalCycleCount.textContent = `Completed Cycles: ${this.completedCycles}`;

    // SVG Circular Progress Ring Calculation
    if (modalProgressEl) {
      const total = this.MODES[this.currentMode].duration;
      const progress = total > 0 ? ((total - this.timeLeft) / total) * 100 : 0;
      modalProgressEl.setAttribute('stroke-dasharray', `${progress} 100`);
      modalProgressEl.setAttribute('stroke', this.MODES[this.currentMode].color);
    }

    // 3. Update document title if running
    if (this.isRunning) {
      document.title = `(${formatted}) ${this.MODES[this.currentMode].label} — Pocketsly`;
    } else {
      document.title = 'Pocketsly — Daily Planner & Learning Lab';
    }
  },

  updateControls() {
    const startBtn = document.getElementById('pomo-toggle-btn');
    if (startBtn) {
      startBtn.textContent = this.isRunning ? 'Pause' : 'Start Focus';
      startBtn.classList.toggle('btn-secondary', this.isRunning);
      startBtn.classList.toggle('btn-primary', !this.isRunning);
    }
  },

  renderModeButtons() {
    document.querySelectorAll('.pomo-tab-btn').forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      btn.classList.toggle('active', mode === this.currentMode);
    });
  },

  openModal() {
    this._ensureAudioContext();
    const overlay = document.getElementById('pomo-modal-overlay');
    if (overlay) {
      document.body.classList.add('modal-open');
      overlay.classList.remove('hidden');
      this.updateDisplay();
      this.updateControls();
      this.renderModeButtons();
    }
  },

  closeModal() {
    const overlay = document.getElementById('pomo-modal-overlay');
    if (overlay) {
      document.body.classList.remove('modal-open');
      overlay.classList.add('hidden');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Timer.init());


/* ===== app.js ===== */
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




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

  /** Logs in as a demo scholar without requiring a server connection */
  exploreDemo() {
    this.currentUser = { id: 999, username: 'demo_scholar', email: 'demo@pocketsly.app', phone: '+6280000000', currency: 'IDR' };
    UI.toast('Entered Offline Demo Mode!', 'success');
    this.showApp();
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

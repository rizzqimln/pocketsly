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




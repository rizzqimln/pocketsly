# Pocketsly PWA — Build Guide

> **Scope:** Web SPA + PWA only. No Flutter, no Kotlin, no native mobile.

---

## 1. Overview

Pocketsly is a guest-first productivity Progressive Web App (PWA). A Python backend (`server.py`) serves both static assets (`static/`) and a REST API (`/api/*`). The frontend is pure vanilla JS — no framework, no build step.

**Core principles:**
- Guest-first: landing page always shows first, no forced login wall
- Session-based auth: HttpOnly cookie validated via `/api/session` on every page load
- No manual server typing: all API calls use relative paths (`/api/...`)
- Dark-default branding: `#0A0F1E` background, `#7C3AED` accent
- PWA-enabled: installable, offline-capable via service worker

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3 stdlib (`http.server`) + psycopg, PostgreSQL, PBKDF2-HMAC-SHA256 |
| Frontend | Pure HTML5 SPA, vanilla JS ES6+, pure CSS design system |
| Routing | Hash-based (`#dashboard`, `#habits`, `#schedule`, `#notes`, `#curriculum`, `#budget`) |
| PWA | `manifest.json` + `sw.js` (stale-while-revalidate + network-first) |
| Deployment | Netlify (static) + separate backend host for API |
| Dependencies | Zero. No npm, no pip packages, no build step |

---

## 3. Architecture

```
server.py                          ← Python HTTP server (port 8000)
  ├─ serves static/                ← All static assets
  ├─ /api/*                        ← REST API
  └─ CSP + security headers

static/
  ├─ index.html                    ← SPA entry point
  ├─ manifest.json                 ← PWA manifest
  ├─ sw.js                         ← Service worker (cache v3.9)
  ├─ _redirects                    ← Netlify SPA fallback
  ├─ netlify.toml                  ← Netlify config + headers
  ├─ css/  (14 files)              ← Modular stylesheets, all ?v=7.9
  ├─ js/   (13 files)              ← Vanilla JS modules
  ├─ img/  (3 files)               ← Icons + favicon
  └─ vendor/ (4 files)             ← Tesseract.js OCR engine
```

### CSS modules
`variables.css` (tokens) · `base.css` (reset) · `layout.css` (grid/flex) · `components.css` (buttons/cards) · `landing.css` (dark bento/glass) · `dashboard.css` (KPI cards) · `habits_tasks.css` · `schedule.css` · `notes.css` · `curriculum.css` · `budget.css` · `modals.css` (scroll lock) · `responsive.css` (480/768/900px) · `style.css` (imports)

### JS modules
`api.js` (fetch wrapper) · `auth.js` (session/login/register) · `app.js` (controller + routing + SW register) · `ui.js` (toast/esc/helpers) · `dashboard.js` · `habits.js` · `tasks.js` · `schedule.js` · `notes.js` · `curriculum.js` · `budget.js` (Tesseract OCR) · `command_palette.js` · `timer.js`

---

## 4. Session & Page Flow

### Page load sequence
```
DOMContentLoaded
  → App.init()
      → Auth.init()                ← wire form listeners
      → hashchange listener       ← SPA routing
      → Auth.checkSession()       ← THE KEY FUNCTION
  → App.initProfileForm()
  → App.registerServiceWorker()   ← register /sw.js on window load
```

### `checkSession()` — refresh behavior (CRITICAL)

```javascript
async checkSession() {
    try {
      const data = await API.get('/api/session');
      if (data.authenticated) {
        this.currentUser = data.user;
        this.showApp();         // Authenticated → dashboard
        this.showContinue();
      } else {
        this.currentUser = null;
        this.showLanding();     // Guest → landing page
        this.hideContinue();
      }
    } catch (err) {
      this.currentUser = null;
      this.showLanding();
      this.hideContinue();
    }
}
```

**Rule:** Authenticated user refreshes → stays on dashboard. Only logout returns to landing.

### DOM container IDs

| ID | Purpose | Hidden when |
|----|---------|-------------|
| `#landing-container` | Landing page (hero, bento, CTA) | authenticated |
| `#app-container` | Main app shell (sidebar + views) | guest |
| `#profile-overlay` | Modal for profile/auth | closed |
| `#profile-guest` | Guest forms (login/register/forgot) | authenticated |
| `#profile-signedin` | Signed-in settings | guest |
| `#landing-signin-btn` | Opens profile modal | — |
| `#landing-continue-btn` | "Continue to Dashboard" chip | guest |
| `#logout-btn` | Logout → landing | — |

---

## 5. PWA Configuration

### manifest.json
```json
{
  "name": "Pocketsly — Daily Routine & Student Productivity Suite",
  "short_name": "Pocketsly",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#7C3AED",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/img/pocketsly-icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/img/pocketsly-icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "Daily Planner", "url": "/#habits" },
    { "name": "Weekly Timetable", "url": "/#schedule" },
    { "name": "Journal & Notes", "url": "/#notes" },
    { "name": "Monthly Budget", "url": "/#budget" }
  ]
}
```

### HTML head tags
```html
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/img/pocketsly-icon-192.png" />
<meta name="theme-color" content="#7C3AED" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

### Service Worker (sw.js)
- **Cache name:** `pocketsly-cache-v3.9`
- **Install:** precache all CSS, JS, images (OCR vendor files are lazy-loaded and cached at runtime)
- **Activate:** delete stale caches
- **Fetch `/api/*`:** network-first (fallback to cache offline)
- **Fetch everything else:** stale-while-revalidate
- **Registration:** `app.js` on `window.load`

---

## 6. Security

### Content-Security-Policy
```
default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
script-src 'self' 'unsafe-inline' 'unsafe-eval';
worker-src 'self' blob:;
connect-src 'self';
```

`'unsafe-eval'` required for Tesseract.js OCR. `worker-src blob:` required for Tesseract web worker.

### Security headers
| Header | Value |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

### Session cookie
```
session_id=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=<days * 86400>
```

---

## 7. API Surface

### Auth
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/session` | Check auth, return user |
| POST | `/api/register` | Register user |
| POST | `/api/login` | Login, sets cookie |
| POST | `/api/logout` | Clear session |
| POST | `/api/request-otp` | Request OTP |
| POST | `/api/reset-password` | Reset with OTP |

### Data
| Path | Methods | Purpose |
|------|---------|---------|
| `/api/dashboard` | GET | Aggregate dashboard |
| `/api/habits` | GET, POST | Habits |
| `/api/habits/<id>/log` | POST | Toggle completion |
| `/api/habits/<id>/logs` | GET | Log history |
| `/api/tasks` | GET, POST | Tasks |
| `/api/tasks/<id>` | PATCH, DELETE | Update/delete |
| `/api/events` | GET, POST | Timetable |
| `/api/notes` | GET, POST | Notes (mood) |
| `/api/courses` | GET, POST | Courses |
| `/api/lecturers` | GET, POST | Lecturers |
| `/api/study-logs` | GET, POST | Study logs |
| `/api/resources` | GET, POST | Resources |
| `/api/budget/summary` | GET | Budget summary |
| `/api/budgets` | GET, POST, DELETE | Budget limits |
| `/api/expenses` | GET, POST, DELETE | Expenses |
| `/api/incomes` | GET, POST, DELETE | Incomes |
| `/api/receipt/scan` | POST | Receipt OCR |
| `/api/curriculum/schema` | GET | DB schema |
| `/api/curriculum/playground` | POST | Read-only SQL |
| `/api/profile` | PATCH | Update profile |
| `/api/backup/export` | GET | Export JSON |
| `/api/backup/restore` | POST | Import JSON |

### API client (`static/js/api.js`)
- Relative paths only (`/api/...`)
- `credentials: 'same-origin'`
- JSON request/response
- Throws on HTTP 400+ with server error message

---

## 8. Deployment

### Local
```bash
cd pocketsly
python3 server.py    # http://localhost:8000
```

### Netlify
- `static/` is the publish root
- `static/_redirects`: `/* /index.html 200` (SPA fallback)
- `static/netlify.toml`: headers + caching
- API (`/api/*`) needs separate backend host (Railway, Render, Fly.io)

### Cache versioning
All assets use `?v=7.9`. To invalidate: bump to `?v=7.10` + update `sw.js` `CACHE_NAME` to `pocketsly-cache-v3.10`.

---

## 9. Constraints (Non-Negotiable)

1. Guest-first: landing for guests, dashboard for authenticated
2. Refresh fix: authenticated users stay on dashboard on F5
3. Keep CSP: do NOT remove `'unsafe-eval'` or `worker-src 'self' blob:`
4. Zero dependencies: vanilla JS, no build step
5. Dark-default: `#0A0F1E` bg, `#7C3AED` accent
6. Anti-AI-slop: no emojis, use inline SVGs
7. No code comments unless requested
8. PWA only — no Flutter/Kotlin/native mobile
9. Relative API paths only — no base URL config
10. Version assets with `?v=` + bump SW cache on changes

---

## 10. Verification

```bash
# Start server
python3 server.py &

# Web E2E (Playwright)
python3 /tmp/opencode/verify_landing.py
# Expected: ALL LANDING CHECKS PASSED

# Backend tests
python3 -m pytest tests/ -q --ignore=tests/test_e2e_reset.py
# Expected: 17 passed

# Manual PWA test
# 1. Open http://localhost:8000 in Chrome
# 2. Click install in address bar
# 3. Verify standalone launch (no address bar)
```

### Checklist
- [ ] Fresh visit → landing visible, app hidden
- [ ] Click "Sign In" → modal opens, guest mode (login form)
- [ ] Register → app visible, modal hidden
- [ ] Logout → landing visible
- [ ] Login → F5 → stays on dashboard (NOT landing)
- [ ] All API endpoints return JSON with error handling
- [ ] Service worker registered (DevTools → Application)
- [ ] PWA installable (Chrome address bar shows install)
- [ ] 17 pytest tests pass

---

## 11. Build Order

1. **Backend:** `schema.sql` → `db.py` → `auth.py` → `server.py` (API + CSP + headers)
2. **Frontend shell:** `index.html` (landing + app + modal) → `css/` (all 14 modules)
3. **Frontend JS:** `api.js` → `auth.js` → `app.js` → `ui.js` → feature modules
4. **PWA:** `manifest.json` → `sw.js` → register in `app.js`
5. **Deploy config:** `_redirects` → `netlify.toml`
6. **Tests:** `tests/` (17 tests, expect all pass)

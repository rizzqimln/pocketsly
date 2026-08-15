# Pocketsly — Daily Routine & Student Productivity Suite

A high-performance full-stack productivity suite built with **Pure HTML5, Vanilla CSS3, Modern JavaScript (ES6+), and Python 3 Standard Library** — with **zero external frameworks or runtime dependencies**.

Designed as a modern daily routine planner, weekly timetable, notes & academic library manager, curriculum GPA simulator, monthly budget tracker, and offline-capable installable PWA.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/<YOUR-USERNAME>/pocketsly/actions/workflows/ci.yml/badge.svg)](https://github.com/<YOUR-USERNAME>/pocketsly/actions/workflows/ci.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB.svg)](https://www.python.org/)
[![Dependencies: zero](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)](README.md)

> Replace `<YOUR-USERNAME>` in the CI badge URL after your first push — it links
> to your fork's Actions page.

---

## ✨ Features

- **Daily Planner** — habit streaks with a 7-day matrix, priority tasks, one-time todos, and overdue deadlines
- **Weekly Timetable** — block-based schedule grid (Mon–Sun) for classes, focus work, and routines
- **Journal & Notes** — mood-tagged reflections, rich text notes, and an academic library with citation generator
- **Curriculum Lab** — GPA simulator, live SQL sandbox, and a 3D flashcard quizzer
- **Budget Tracker** — multi-currency (IDR/USD/EUR/…), monthly budgets, CSV export, and receipt OCR
- **Focus Timer** — built-in Pomodoro-style timer
- **Command Palette** — global ⌘K / Ctrl+K spotlight for navigation and actions
- **PWA & Offline** — installable, offline-capable via service worker caching
- **Security-first** — PBKDF2 password hashing, HttpOnly session cookies, IP rate limiting, CSP, and XSS escaping
- **Zero dependencies** — Python 3 stdlib backend + vanilla JS/CSS frontend

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+ Standard Library (`http.server`, `sqlite3`, `hashlib`) |
| Database | SQLite (WAL mode, 25 performance indexes) |
| Frontend | Pure HTML5, CSS3, Vanilla JavaScript (ES6+) |
| PWA | Web App Manifest, Service Worker, offline caching |
| Deploy | Netlify (static) or Render / Railway / Fly / VPS (full app) |
| CI | GitHub Actions (API, security, and E2E suites) |

---

## 📖 Comprehensive Developer & AI-Agent Guide

For the full architectural blueprint, database schema, 30+ REST API reference, security model, and step-by-step bug-fixing protocol, see:
👉 [**`docs/LEARNING_GUIDE.md`**](docs/LEARNING_GUIDE.md)

Want to contribute or report a security issue? See
👉 [**`CONTRIBUTING.md`**](CONTRIBUTING.md) and
👉 [**`SECURITY.md`**](SECURITY.md)

---

## 🚀 Quick Start

```bash
# 1. Start the application server (Python 3.10+ stdlib, zero pip packages)
python3 server.py

# 2. Open your browser and visit:
http://localhost:8000
```

> **Frontend bundling:** the app ships one `bundle.css` + one `bundle.js` (fewer
> render-blocking round-trips over HTTP/1.1). The modular sources under
> `static/css/` and `static/js/` are the source of truth — after editing any
> module, regenerate the bundles and bump the `?v=` version in `index.html` and
> `sw.js`:
>
> ```bash
> python3 scripts/build.py
> ```

---

## 🚢 Deployment

The repo is deploy-ready for **GitHub** and **Netlify**. Two facts shape every option:

1. **Netlify is static-only** — it can serve the frontend in `static/` (landing page, PWA, installable shell), but the Python API (`server.py`) needs SQLite + a long-running process and **cannot run on Netlify**.
2. **SQLite lives in a file** (`daily_app.db`, gitignored, recreated from `schema.sql` on start). Free/auto-scaling hosts with ephemeral filesystems (Netlify, Render free tier, Fly without volumes) **lose data on restart** — for real persistence use a VPS or a host with a persistent volume.

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/pocketsly.git
git push -u origin main
```

The repo already ships `.gitignore` (databases, caches, local tooling), `netlify.toml`, and `static/_redirects`.

### Option A — Full app on a Python host (recommended)

The Python server serves both the API and the frontend, so one process = whole app.

1. Push to GitHub.
2. On **Render** (or Railway/Fly.io/VPS): create a *Web Service* from the repo.
3. Build command: *(none — zero pip dependencies)*
4. Start command: `python3 server.py`
5. The app reads `PORT` from the environment (defaults to `8000` locally), so any host that injects it works.
6. Open the assigned URL — done.

For persistent data, attach a volume at the repo root (Railway volume, Fly volume, or a VPS disk).

### Option B — Netlify frontend + backend proxy

Get the CDN, PWA, and landing page from Netlify while the API runs on a Python host.

1. Deploy the backend with Option A and note its URL, e.g. `https://pocketsly-api.onrender.com`.
2. On Netlify: *Add new site → Import from GitHub → pick the repo*. The root [`netlify.toml`](netlify.toml) already sets `publish = "static"` and immutable-cache headers; no build step needed (bundles are committed).
3. Uncomment and edit the proxy line at the top of [`static/_redirects`](static/_redirects):

   ```
   /api/*  https://pocketsly-api.onrender.com/api/:splat  200
   ```

   Because the frontend calls relative `/api/*` paths, the proxy keeps everything same-origin — no CORS work, and HttpOnly session cookies keep working.

### Local preview without GitHub

You can also drag-and-drop the `static/` folder onto Netlify for a static preview, or run everything locally with `python3 server.py`.

---

## 🧪 Automated Testing

The API suite needs only Python's stdlib. The **performance/security** and **E2E**
suites need a running server (`python3 server.py`) — and the E2E suites need
Playwright (`pip install playwright && python -m playwright install chromium`).
GitHub Actions runs all of these on every push and pull request — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

```bash
# 0. JS static analysis — dead code, unused globals, orphan DOM ids (stdlib only)
python3 scripts/lint_js.py

# 1. Backend REST API suite (fast, no server needed)
pytest tests/test_api.py

# 2. Performance, Gzip, CSP, security headers & rate limiter — server must be running
pytest tests/test_perf_security.py

# 3. E2E browser suites — server must be running on :8000
pytest tests/test_e2e_quiz.py tests/test_e2e_budget_mobile.py   # pytest-style
python3 tests/test_e2e_budget.py
python3 tests/test_e2e_reset.py
python3 tests/test_e2e_features.py
python3 tests/test_e2e_mobile_profile_dashboard.py
python3 tests/test_e2e_mobile_redesign.py
python3 tests/test_e2e_new_features.py
```

---

---

## 📁 Project Structure

```
pocketsly/
├── server.py               # Custom HTTP Server, REST API Router, Gzip, Rate Limiter & CSP
├── auth.py                 # PBKDF2-HMAC-SHA256 Hashing, Sessions, OTP Password Recovery
├── db.py                   # SQLite Connection Manager, WAL Configuration & Queries
├── receipt_ocr.py          # Tesseract receipt OCR parser (merchant/total/date heuristics)
├── schema.sql              # Relational DDL (14 Tables, 25 Performance Indexes)
├── netlify.toml            # Netlify config: publish static/, immutable cache headers
├── README.md               # Quickstart and project introduction
├── CONTRIBUTING.md         # Contributor guide: setup, tests, conventions, PR process
├── SECURITY.md             # Security policy & vulnerability reporting
├── LICENSE                 # MIT License
├── .editorconfig           # Consistent editor formatting
├── .github/workflows/ci.yml# GitHub Actions: API + perf/security + E2E on every push
├── docs/                   # Developer guides (LEARNING_GUIDE.md, build guides)
│
├── static/                 # Client-Side Assets (published to Netlify in Setup B)
│   ├── index.html          # Semantic HTML5 Single Page Application Layout
│   ├── manifest.json       # PWA Web App Manifest (Standalone mode, App Icons, Shortcuts)
│   ├── sw.js               # Service Worker (Offline cache, Stale-While-Revalidate)
│   ├── _redirects          # Netlify SPA fallback + optional /api/* proxy
│   ├── bundle.css          # Bundled CSS (regenerate via scripts/build.py)
│   ├── bundle.js           # Bundled JS (regenerate via scripts/build.py)
│   ├── css/                # Modular Vanilla CSS (Variables, Base, Layout, Components...)
│   ├── js/                 # Modular Vanilla JS (App, API, Auth, UI, Features...)
│   └── img/                # High-Res Icons (192px, 512px, Favicon)
│
├── scripts/build.py        # Stdlib bundler for bundle.css / bundle.js
└── tests/                  # Automated Test Suites
    ├── test_api.py                         # REST API suite (pytest)
    ├── test_perf_security.py               # Gzip/CSP/rate-limiter suite (pytest)
    ├── test_e2e_quiz.py                    # 3D quiz + landing E2E (pytest, Playwright)
    ├── test_e2e_budget_mobile.py           # Budget mobile UX E2E (pytest, Playwright)
    ├── test_e2e_budget.py                  # Budget flow E2E (script, Playwright)
    ├── test_e2e_reset.py                   # Password reset E2E (script, Playwright)
    ├── test_e2e_features.py                # Feature tour E2E (script, Playwright)
    ├── test_e2e_mobile_profile_dashboard.py# Mobile profile/dashboard E2E (script)
    ├── test_e2e_mobile_redesign.py         # Mobile & desktop responsive E2E (script)
    └── test_e2e_new_features.py            # New features E2E (script, Playwright)
```

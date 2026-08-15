# Pocketsly — Daily Routine & Student Productivity Suite

A high-performance full-stack productivity suite built with **Pure HTML5, Vanilla CSS3, Modern JavaScript (ES6+), and Python 3** — with **zero frontend frameworks** and exactly one backend dependency (the PostgreSQL driver `psycopg`).

Designed as a modern daily routine planner, weekly timetable, notes & academic library manager, curriculum GPA simulator, monthly budget tracker, and offline-capable installable PWA.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/<YOUR-USERNAME>/pocketsly/actions/workflows/ci.yml/badge.svg)](https://github.com/<YOUR-USERNAME>/pocketsly/actions/workflows/ci.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-3776AB.svg)](https://www.python.org/)
[![Dependencies: psycopg](https://img.shields.io/badge/dependencies-psycopg-blue.svg)](requirements.txt)

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
- **Minimal dependencies** — Python 3 stdlib backend + one driver (`psycopg` for PostgreSQL) + vanilla JS/CSS frontend

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+ Standard Library (`http.server`, `hashlib`) + `psycopg` driver |
| Database | PostgreSQL 14+ — Supabase managed Postgres in production, local Postgres for dev |
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
# 1. Install the single backend dependency (psycopg — the PostgreSQL driver)
pip install -r requirements.txt

# 2. Point at a database (defaults to a local Postgres; use your Supabase URL in production)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocketsly"

# 3. Start the application server (applies schema.sql automatically on boot)
python3 server.py

# 4. Open your browser and visit:
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

The repo is deploy-ready for **GitHub**, **Cloudflare Pages**, and any Python
host. Two facts shape every option:

1. **The frontend is static; the API is Python** — `static/` (landing page,
   PWA, installable shell) can be served by any static host, but the Python
   API (`server.py`) needs a process that can run Python and reach your
   database. The two are glued together by the Cloudflare proxy function.
2. **Data lives in PostgreSQL, not in a file** — the app reads its connection
   string from `DATABASE_URL` (Supabase managed Postgres in production).
   Because the database is external, even hosts with ephemeral filesystems
   keep your data permanently.

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/pocketsly.git
git push -u origin main
```

The repo already ships `.gitignore` (databases, caches, local tooling),
`wrangler.toml` + `functions/` (Cloudflare Pages), and `static/_redirects`.

### Option A — Cloudflare Pages + Cloudflare D1 (Recommended — 100% Free, All-in-One)

The entire application (**Frontend + Serverless API + Database**) runs natively inside **Cloudflare Pages** using **Cloudflare D1** (Serverless SQLite) and the Web Crypto API. **Zero external backend hosts, zero credit cards, and zero cold-start sleeps.**

1. Push to GitHub.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com):
   - **Storage & Databases → D1 SQL Database → Create database** named `pocketsly-db`.
   - **Workers & Pages → Create → Pages → Connect to Git** → select your `pocketsly` repo.
   - Build output directory: `static` (leave build command empty).
   - Click **Save and Deploy**.
3. In your Pages project: **Settings → Functions → D1 database bindings → Add binding**:
   - Variable name: `DB`
   - D1 database: select `pocketsly-db`
4. Deploy! Your app is live at `https://<your-project>.pages.dev` with full authentication and offline sync. See [`docs/DEPLOY_CLOUDFLARE_PAGES_D1.md`](docs/DEPLOY_CLOUDFLARE_PAGES_D1.md) for the full guide.

### Option B — Traditional Python Server + External PostgreSQL

If you prefer to run the standalone Python server (`server.py` + PostgreSQL):

1. Set `DATABASE_URL` to your PostgreSQL database (e.g. Supabase or local Postgres).
2. Run `python3 server.py`.
3. Deploy to any independent Linux host (e.g. Alwaysdata, DomCloud, Serv00, or a VPS).

### Option B′ — Where the Python API actually runs

`server.py` is a full HTTP server; it needs a host that can run Python and
reach your PostgreSQL database. `DATABASE_URL` is the only variable it needs:

- **Your own machine + Cloudflare Tunnel** — free, no card; the app is public
  at a `trycloudflare.com` URL while your PC is on.
- **Render free** — asks for card *verification* when creating a service (a
  temporary $1 hold, refunded; you're never charged on the free tier) and
  sleeps after ~15 min idle.
- **Student cloud (Azure for Students, GitHub Student Pack)** — a real
  always-on VM using only your `.edu` email, no card.

### Local preview without GitHub

You can also drag-and-drop the `static/` folder onto Cloudflare Pages (or Netlify) for a static preview, or run everything locally with `python3 server.py`.

---

## 🧪 Automated Testing

The **API suite** needs a reachable PostgreSQL database: it uses
`TEST_DATABASE_URL` (falls back to `DATABASE_URL`, then to a local Postgres on
`localhost:5432`) and skips with a clear message if none is reachable. The
**performance/security** and **E2E** suites need a running server
(`python3 server.py` with `DATABASE_URL` set) — and the E2E suites need
Playwright (`pip install playwright && python -m playwright install chromium`).
GitHub Actions runs all of these on every push and pull request (with a
PostgreSQL service container) — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

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
├── db.py                   # PostgreSQL Connection Manager (psycopg) & Queries
├── receipt_ocr.py          # Tesseract receipt OCR parser (merchant/total/date heuristics)
├── schema.sql              # PostgreSQL DDL (14 Tables, 21 Performance Indexes)
├── requirements.txt        # Single runtime dependency: psycopg (PostgreSQL driver)
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

# Pocketsly — Student Productivity Suite

A full-stack productivity app for students. Built with plain HTML, CSS, and vanilla JavaScript — no frontend frameworks. The production backend runs on Cloudflare Pages Functions with D1 (serverless SQLite). The original Python backend (`server.py`) stays for local development.

What it does: daily planner with habit streaks, weekly timetable, journal and notes with mood tags, curriculum manager with GPA simulator, budget tracker with receipt OCR, Pomodoro timer, and a command palette. Installable PWA with offline support.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Cloudflare Pages Functions + D1 (production), Python 3 (`server.py`) for local dev |
| Database | Cloudflare D1 (production), PostgreSQL 14+ (local) |
| Frontend | HTML5, CSS3, Vanilla JS (ES6+) |
| PWA | Web App Manifest, Service Worker, offline caching |
| Deploy | Cloudflare Pages (recommended), or any Python host |
| CI | GitHub Actions (API, security, E2E) |

## Which backend am I using?

| Use case | Backend |
|----------|---------|
| Production | `functions/` — Cloudflare Pages Functions + D1. See `docs/DEPLOY_CLOUDFLARE_PAGES_D1.md` |
| Local development | `python3 server.py` (Postgres required) |
| Legacy deployments | Netlify Functions adapter or any Python host |

Password recovery needs an email provider. On Cloudflare, bind `BREVO_API_KEY` and `MAIL_FROM` with `wrangler pages secret put <NAME> --project-name pocketsly` (dashboard env vars don't inject into Functions for this wrangler-managed project). The OTP is delivered by email and never returned by the API. See `SECURITY.md`.

## Developer & AI-Agent Guide

Full architecture, database schema, 30+ REST API endpoints, security model, and bug-fixing protocol: **`docs/LEARNING_GUIDE.md`**

Contributing or reporting a security issue? See **`CONTRIBUTING.md`** and **`SECURITY.md`**

## Quick Start (Local Python Backend)

```bash
# 1. Install the single backend dependency
pip install -r requirements.txt

# 2. Point at a database (defaults to local Postgres; use your Supabase URL in production)
export DATABASE_URL="postgresql://postgres:***@localhost:5432/pocketsly"

# 3. Start the server (applies schema.sql automatically on boot)
python3 server.py

# 4. Open http://localhost:8000
```

Frontend bundling: the app ships one `bundle.css` + one `bundle.js` (fewer render-blocking round-trips). The modular sources under `static/css/` and `static/js/` are the source of truth. After editing any module, regenerate the bundles and bump the `?v=` version in `index.html` and `sw.js`:

```bash
python3 scripts/build.py
```

## Deployment

Two facts shape every option:

1. **Frontend is static; API is Python** — `static/` can be served by any static host, but the Python API (`server.py`) needs a process that can run Python and reach your database. Cloudflare Pages glues them together.
2. **Data lives in PostgreSQL, not in a file** — the app reads its connection string from `DATABASE_URL` (Supabase managed Postgres in production). Because the database is external, even hosts with ephemeral filesystems keep your data permanently.

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/pocketsly.git
git push -u origin main
```

The repo already ships `.gitignore` (databases, caches, local tooling), `wrangler.toml` + `functions/` (Cloudflare Pages), and `static/_redirects`.

### Option A — Cloudflare Pages + Cloudflare D1 (Recommended)

The entire application (frontend + serverless API + database) runs inside Cloudflare Pages using D1. Zero external backend hosts, zero credit cards.

1. Push to GitHub.
2. In the Cloudflare Dashboard:
   - Storage & Databases → D1 SQL Database → Create database named `pocketsly-db`.
   - Workers & Pages → Create → Pages → Connect to Git → select your `pocketsly` repo.
   - Build output directory: `static` (leave build command empty).
   - Save and Deploy.
3. In your Pages project: Settings → Functions → D1 database bindings → Add binding:
   - Variable name: `DB`
   - D1 database: select `pocketsly-db`
4. Deploy. Your app is live at `https://<your-project>.pages.dev` with full auth and offline sync. See `docs/DEPLOY_CLOUDFLARE_PAGES_D1.md` for the full guide.

### Option B — Traditional Python Server + External PostgreSQL

If you prefer the standalone Python server:

1. Set `DATABASE_URL` to your PostgreSQL database (Supabase or local Postgres).
2. Run `python3 server.py`.
3. Deploy to any Linux host that can run Python and reach your database.

### Option B′ — Where the Python API actually runs

`server.py` is a full HTTP server. It needs a host that runs Python and reaches your PostgreSQL database. `DATABASE_URL` is the only variable it needs.

- **Your own machine + Cloudflare Tunnel** — free, no card; the app is public at a `trycloudflare.com` URL while your PC is on.
- **Render free** — asks for card verification when creating a service (temporary $1 hold, refunded; never charged on free tier) and sleeps after ~15 min idle.
- **Student cloud (Azure for Students, GitHub Student Pack)** — a real always-on VM using only your `.edu` email, no card.

### Local preview without GitHub

Drag-and-drop the `static/` folder onto Cloudflare Pages (or Netlify) for a static preview, or run everything locally with `python3 server.py`.

## Automated Testing

The API suite needs a reachable PostgreSQL database. It uses `TEST_DATABASE_URL` (falls back to `DATABASE_URL`, then to local Postgres on `localhost:5432`) and skips with a clear message if none is reachable. The performance/security and E2E suites need a running server (`python3 server.py` with `DATABASE_URL` set). The E2E suites need Playwright (`pip install playwright && python -m playwright install chromium`). GitHub Actions runs all of these on every push and PR — see `.github/workflows/ci.yml`.

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

## Project Structure

```
pocketsly/
├── server.py               # Custom HTTP Server, REST API Router, Gzip, Rate Limiter & CSP
├── auth.py                 # PBKDF2-HMAC-SHA256 Hashing, Sessions, OTP Password Recovery
├── db.py                   # PostgreSQL Connection Manager (psycopg) & Queries
├── receipt_ocr.py          # Tesseract receipt OCR parser (merchant/total/date heuristics)
├── schema.sql              # PostgreSQL DDL (14 Tables, 21 Performance Indexes)
├── requirements.txt        # Single runtime dependency: psycopg (PostgreSQL driver)
├── netlify.toml            # Netlify config: publish static/, immutable cache headers
├── README.md               # This file
├── CONTRIBUTING.md         # Contributor guide: setup, tests, conventions, PR process
├── SECURITY.md             # Security policy & vulnerability reporting
├── LICENSE                 # MIT License
├── .editorconfig           # Consistent editor formatting
├── .github/workflows/ci.yml# GitHub Actions: API + perf/security + E2E on every push
├── docs/                   # Developer guides (LEARNING_GUIDE.md, build guides)
├── static/                 # Client-Side Assets
│   ├── index.html          # Semantic HTML5 Single Page Application Layout
│   ├── manifest.json       # PWA Web App Manifest (Standalone mode, App Icons, Shortcuts)
│   ├── sw.js               # Service Worker (Offline cache, Stale-While-Revalidate)
│   ├── _redirects          # Netlify SPA fallback + optional /api/* proxy
│   ├── bundle.css          # Bundled CSS (regenerate via scripts/build.py)
│   ├── bundle.js           # Bundled JS (regenerate via scripts/build.py)
│   ├── css/                # Modular Vanilla CSS
│   ├── js/                 # Modular Vanilla JS
│   └── img/                # High-Res Icons (192px, 512px, Favicon)
├── scripts/build.py        # Stdlib bundler for bundle.css / bundle.js
└── tests/                  # Automated Test Suites
    ├── test_api.py
    ├── test_perf_security.py
    ├── test_e2e_quiz.py
    ├── test_e2e_budget_mobile.py
    ├── test_e2e_budget.py
    ├── test_e2e_reset.py
    ├── test_e2e_features.py
    ├── test_e2e_mobile_profile_dashboard.py
    ├── test_e2e_mobile_redesign.py
    └── test_e2e_new_features.py
```

## License

MIT — see `LICENSE` for details.
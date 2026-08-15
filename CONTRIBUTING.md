# Contributing to Pocketsly

Thanks for wanting to contribute! This project is deliberately **minimal-dependency**:
the backend is Python 3 Standard Library plus exactly one pip package (the
PostgreSQL driver `psycopg`), and the frontend is pure HTML5, CSS3, and vanilla
ES6+ JavaScript. Please keep it that way — no new pip packages unless truly
necessary, no npm packages, no frameworks.

---

## 🚀 Getting started

```bash
# 1. Install the single backend dependency (psycopg — PostgreSQL driver)
pip install -r requirements.txt

# 2. Point at a database (local Postgres default; use your Supabase URL in prod)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocketsly"

# 3. Run
python3 server.py

# 4. Open http://localhost:8000
```

> The server reads the `PORT` environment variable if set (used by Render,
> Railway, Fly). Locally it defaults to `8000`. The schema in `schema.sql` is
> applied automatically on boot.

---

## 🧪 Running the tests

The **API suite needs a reachable PostgreSQL** — it uses `TEST_DATABASE_URL`
(falls back to `DATABASE_URL`, then `localhost:5432`) and skips with a clear
message if none is reachable. The security suite needs the server running; the
E2E suites additionally need Playwright (`pip install playwright && python -m
playwright install chromium`).

```bash
# JS static analysis — dead code, unused globals, orphan DOM ids (stdlib only)
python3 scripts/lint_js.py

# Backend REST API tests (needs Postgres — TEST_DATABASE_URL or a local default)
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocketsly_test"
pytest tests/test_api.py

# Performance & security checks — requires the server running
# (start `python3 server.py` in another terminal first)
pytest tests/test_perf_security.py

# End-to-end browser tests — also require a running server on :8000
pytest tests/test_e2e_quiz.py tests/test_e2e_budget_mobile.py
python3 tests/test_e2e_budget.py
python3 tests/test_e2e_reset.py
python3 tests/test_e2e_features.py
python3 tests/test_e2e_mobile_profile_dashboard.py
python3 tests/test_e2e_mobile_redesign.py
python3 tests/test_e2e_new_features.py
```

CI runs all of the above on every push and pull request — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 🧱 Frontend bundling (important!)

The app ships one `static/bundle.css` + one `static/bundle.js` for performance,
but the **modular sources** under `static/css/` and `static/js/` are the source of
truth. After editing any module:

```bash
python3 scripts/build.py
```

If the regenerated bundle content changed, **bump the `?v=` version** in both
`static/index.html` and `static/sw.js` — those files are cached immutably for a
year by Netlify, so the version string is the only cache-buster.

---

## 📐 Coding conventions

Follow the style already in the codebase — it's part of the project's identity:

- **Explain *why*, not just *what*.** Every module carries a docstring header and
  `LEARN:` comments that teach the underlying concept (security, performance,
  architecture). New code should keep that voice.
- **Python:** standard library + `psycopg` only. Type hints, parameterized
  queries (`%s` placeholders — never string-concatenate SQL), context managers
  for DB access (`db.get_db()`), and the `db.insert()` helper for inserts that
  need the new id back (`RETURNING id`).
- **JavaScript:** ES6+, `const`/`let`, object-module pattern (`const API = {...}`),
  JSDoc-style comments, `UI.esc()` on any user-supplied string before
  `innerHTML` (XSS safety). Run `python3 scripts/lint_js.py` before opening a
  PR — it catches unused globals, dead methods, and orphan DOM ids.
- **Security matters:** keep defense-in-depth (input validation, escaping, rate
  limits, HttpOnly session cookies). Don't weaken it to save a line.
- **Don't commit generated/local files:** caches, `.build_tools/`, `.freebuff/`,
  `ponytail/`, `opencode.json` are gitignored. Database connection strings go in
  `DATABASE_URL` / `TEST_DATABASE_URL` environment variables, never in code or
  committed files.

---

## 🔀 Pull request process

1. Fork the repo and create a branch: `git checkout -b fix/your-change`.
2. Make your change, add or update tests in `tests/`.
3. Run the relevant suites locally (see above) until green.
4. Open a PR with a clear description: what changed, why, and how it was tested.

Small, focused PRs are much easier to review than large rewrites.

---

## 📚 Learning resources

- [`docs/LEARNING_GUIDE.md`](docs/LEARNING_GUIDE.md) — full architecture, REST API
  reference, security model, and bug-fixing protocol
- [`docs/DEPLOY_SUPABASE_RENDER_NETLIFY.md`](docs/DEPLOY_SUPABASE_RENDER_NETLIFY.md)
  — free production deployment (Netlify + Render + Supabase)
- [`README.md`](README.md) — quick start and deployment options

If anything in these docs is unclear or wrong, that's a valid bug — fix the docs
too!

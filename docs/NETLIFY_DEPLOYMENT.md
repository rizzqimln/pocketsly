# Pocketsly Deployment Guide

This repository contains two decoupled components:

| Component | Directory | Stack | Deployment Target |
|-----------|-----------|-------|-------------------|
| Web App (SPA + PWA) | `static/` | Vanilla HTML/CSS/JS + Service Worker | Netlify |
| Backend API | `server.py` + `db.py` + `schema.sql` | Python 3 stdlib HTTP server + SQLite | Self-hosted / Render / Fly.io |

---

## 1. Web App deploy to Netlify

The `static/` directory is fully self-contained: it ships its own HTML entry point,
modular CSS/JS, vendored OCR libraries (`/vendor/`), PWA manifest, and a Service
Worker (`sw.js`) for offline caching. It talks to the backend over REST
(`/api/*`), so the only runtime configuration needed is the API base URL.

### Option A via Netlify CLI
```bash
# Install the Netlify CLI once
npm install -g netlify-cli

# From the repository root
netlify deploy --dir=static --prod
```

### Option B via Git-connected site
1. Push this repository to GitHub/GitLab.
2. Create a new site in the Netlify dashboard connected to that repo.
3. Set the build configuration:
   - **Base directory**: `static`
   - **Publish directory**: `.` (relative to base, i.e. `static` itself)
   - **Build command**: _(leave empty, no build step needed)_
4. Deploy. `netlify.toml` (inside `static/`) supplies SPA fallback redirects and
   security/cache headers automatically.

### Pointing the web app at your backend
The SPA calls relative paths (`/api/...`). To route those to your backend from
Netlify, add a rewrite. Create or edit `static/_redirects`:
```
/api/*  https://your-backend.example.com/:splat  200
/*      /index.html                             200
```
The included `_redirects` ships only the SPA fallback line; append the
`/api/*` proxy line with your backend URL before going live. Alternatively,
serve CORS-friendly backend calls directly and keep `/api/*` on the same origin
via a Netlify Function proxy.

---

## 2. Backend API (Python)

```bash
python3 server.py
# serves http://localhost:8000
```

The server is a small stdlib HTTP server backed by SQLite (`schema.sql`,
`daily_app.db`). It serves the REST API on `/api/*`. For production, run it
behind a WSGI/ASGI reverse proxy or on a platform like Render/Fly.io, and point
the Web `_redirects` at its public URL.

---

## Repository Layout
```
/
├── static/                 Web SPA + PWA (deploy to Netlify)
│   ├── index.html
│   ├── css/  js/  img/  vendor/
│   ├── _redirects          Netlify SPA fallback
│   ├── netlify.toml        Netlify headers + cache config
│   ├── manifest.json
│   └── sw.js               Service Worker (offline cache)
│
├── server.py               Backend REST API (Python stdlib + SQLite)
├── db.py
├── schema.sql
└── tests/                  Backend + E2E Playwright suite
```

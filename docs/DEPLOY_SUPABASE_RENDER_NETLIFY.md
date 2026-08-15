# Deploying Pocketsly: Netlify (frontend) + Render (API) + Supabase (PostgreSQL)

This is the **free, no-credit-card** production stack for Pocketsly:

```
Browser
   │
   ▼
Netlify (static frontend: HTML/CSS/JS/PWA shell)
   │  /api/* requests proxied via static/_redirects
   ▼
Render (free web service: python3 server.py)
   │  reads DATABASE_URL
   ▼
Supabase (managed PostgreSQL — your real data, survives restarts)
```

- **Netlify** serves the fast CDN frontend and the PWA.
- **Render free tier** runs the Python API — *no credit card required* (verified).
- **Supabase free tier** hosts PostgreSQL — *no credit card required*. Your SQLite-era
  data now lives in a real database, so even Render's ephemeral disk doesn't matter.

> Cost: **$0/month**. The two free-tier caveats are at the bottom — read them.

---

## 1. Supabase — create the database

1. Go to [supabase.com](https://supabase.com) → **New project** (free plan, no card).
   Pick a name + a strong database password. Region close to you.
2. Wait for provisioning (~2 min), then open **Project Settings → Database →
   Connection string**.
3. Copy the **URI** connection string (looks like
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`).
   Keep the pooler port (6543) — it's the reliable one for server apps.
4. Optional: apply the schema yourself — open **SQL Editor**, paste the contents of
   [`schema.sql`](../schema.sql), run it. Otherwise the app applies it automatically
   on first boot (idempotent — safe either way).

## 2. Render — run the API (free, no card)

1. Push the repo to GitHub first (see README's *Push to GitHub*).
2. On [render.com](https://render.com) → **New + → Web Service** → connect your repo.
3. Settings:
   - **Name**: `pocketsly-api`
   - **Language**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `python3 server.py`
   - **Instance type**: Free (Render injects `PORT` automatically; the app honors it)
4. **Environment** → add one variable:
   - `DATABASE_URL` = the Supabase connection string from step 1
5. **Create Web Service** and wait for the deploy (~1–2 min). Note the URL, e.g.
   `https://pocketsly-api.onrender.com`.
6. Sanity check: visit `https://pocketsly-api.onrender.com/api/session` — you should
   see JSON like `{"authenticated": false, "user": null}` (not an HTML error page).

## 3. Netlify — serve the frontend

1. On [netlify.com](https://netlify.com) → **Add new site → Import an existing
   project** → pick the same GitHub repo.
2. No build step needed — [`netlify.toml`](../netlify.toml) already sets
   `publish = "static"`. Just deploy.
3. Open [`static/_redirects`](../static/_redirects) in the repo and **uncomment the
   proxy line, above the `/*` fallback**, replacing the URL with your Render URL:

   ```
   /api/*  https://pocketsly-api.onrender.com/api/:splat  200
   ```

4. Redeploy Netlify (or push — CI + auto-deploy will do it).
5. Done. Open your Netlify URL: register, log in, and your data flows
   Netlify → Render → Supabase.

> Because the frontend calls relative `/api/*` paths, the proxy keeps everything
> same-origin — no CORS work, and HttpOnly session cookies keep working.

---

## Free-tier caveats (read these!)

| Host | Caveat | Fix |
|---|---|---|
| **Supabase free** | Project **pauses after 7 days of inactivity** (data is kept) | Log in and hit **Restore** (or set up a free uptime ping so it never sleeps) |
| **Render free** | Service **sleeps after ~15 min idle**; first request takes ~30–60s to wake | Free. A periodic ping keeps it warm, or just accept the wake-up delay |
| **Both** | Free tiers are for personal/low-traffic use | Upgrade only if you ever need it |

## Local development (Postgres)

```bash
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocketsly"
python3 server.py
```

The schema applies automatically. Running tests against a local Postgres:

```bash
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pocketsly_test"
pytest tests/test_api.py -v
```

> If no Postgres is reachable, the API suite **skips** with a clear message rather
> than failing — CI always provisions one via a GitHub Actions service container.

## Migrating from the old SQLite data

There is no automated importer (the old `daily_app.db` was a local file). If you
used the app locally, use **Settings → Backup → Export** in the old version to get a
JSON backup, then **Import** it in the deployed app after logging in — the
backup/restore endpoints are database-agnostic.

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

## Option: skip the backend host — run the API as a Netlify Function

The cleanest no-extra-host path: the API runs serverlessly **on Netlify itself**
via [`netlify/functions/api.py`](../netlify/functions/api.py) (an adapter that
reuses all of `server.py`'s route handlers). No Render, no HF Space, no proxy.

1. Deploy the repo to Netlify as usual (the [`netlify.toml`](../netlify.toml)
   already configures the functions directory and bundles `schema.sql`).
2. Set `DATABASE_URL` (your Supabase URI) under **Site settings → Environment
   variables** in the Netlify dashboard.
3. [`static/_redirects`](../static/_redirects) already routes `/api/*` to the
   function — deploy and sign in.

Trade-offs vs. a long-running host: ~2–4s cold start after idle, 10s request
limit (free plan — every endpoint finishes in ms), and the in-memory rate
limiter resets per request. Data lives in Supabase, so nothing is lost.

> To switch back to an external backend later, edit `static/_redirects` to the
> proxy form (`/api/*  https://<backend>/api/:splat  200`) and redeploy.

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

---

## No credit card? Backend on Hugging Face Spaces instead of Render

If you can't add a card to Render, run the API on **Hugging Face Spaces** —
free, **no credit card**, no limits beyond the free CPU tier. The repo already
ships a [`Dockerfile`](../Dockerfile) for exactly this.

1. Push the repo (including `Dockerfile`) to GitHub.
2. Sign up at [huggingface.co](https://huggingface.co) (free, email only).
3. **New Space** → name `pocketsly` → SDK: **Docker** → Hardware: **CPU basic** (free).
4. Connect it to your GitHub repo: Space **Settings → Repository → link the
   GitHub repo** (or upload the files directly). Hugging Face auto-builds the
   Docker image from the `Dockerfile`.
5. **Settings → Variables and secrets** → add `DATABASE_URL` = your Supabase URI
   (same string as the Render path).
6. Wait for the build (~2–4 min), then open `https://<username>-pocketsly.hf.space`
   and verify `…/api/session` returns `{"authenticated": false, "user": null}`.
7. Point Netlify at it — in `static/_redirects`, above the `/*` rule:

   ```
   /api/*  https://<username>-pocketsly.hf.space/api/:splat  200
   ```

**Free-tier caveats:** Spaces sleep after a couple of days of inactivity (wake
on first request, ~30–60s), and the disk resets on rebuild — irrelevant here
because all data lives in Supabase.

> **Student?** Azure for Students is the other zero-card path — a real VM with
> permanent disk using only your `.edu` email (no card). Ask the maintainer for
> that guide if it applies to you.

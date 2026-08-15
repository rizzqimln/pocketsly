# Deploying Pocketsly: Cloudflare Pages + D1 Database (All-in-One)

This is the **100% Free, Zero-Credit-Card, Zero-External-Backend** production setup for Pocketsly.

```
Browser
   │
   ▼
Cloudflare Edge Network
   ├── Static Frontend (static/ : HTML / CSS / JS / PWA)
   ├── Edge API Router (functions/api/[[path]].js : Native JavaScript + Web Crypto)
   └── Cloudflare D1 Database (Serverless SQLite built into Cloudflare)
```

- **Frontend, Backend API, and Database all live inside Cloudflare.**
- **No separate Python server needed.**
- **No credit card required.**
- **Sub-10ms global latency** with zero sleep/cold starts.

---

## Step-by-Step 1-Click Deployment

### 1. Create a Cloudflare D1 Database (Free, No Card)

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. On the left navigation, go to **Storage & Databases → D1 SQL Database**.
3. Click **Create database**.
4. Name it: `pocketsly-db` and choose a location close to your users.
5. Click **Create**.

---

### 2. Deploy Cloudflare Pages

1. In the Cloudflare Dashboard, go to **Workers & Pages → Create application → Pages → Connect to Git**.
2. Select your `pocketsly` repository.
3. Configure the build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `static`
4. Click **Save and Deploy**.

---

### 3. Bind the D1 Database to your Pages Project

1. Once created, go to your Pages project in Cloudflare: **Settings → Functions**.
2. Scroll down to **D1 database bindings** and click **Add binding**.
3. Fill in:
   - **Variable name:** `DB` *(Must be uppercase `DB`)*
   - **D1 database:** select `pocketsly-db` from the dropdown
4. Click **Save**.
5. Go to the **Deployments** tab and click **Retry deployment** (or trigger a new commit/push).

---

### 4. You're Done! 🎉

Open your Cloudflare Pages URL (e.g. `https://pocketsly.pages.dev`).

- All database tables and default academic resources will be automatically created on your first visit.
- Sign Up and Sign In work immediately with secure Web Crypto password hashing and HttpOnly session cookies.
- All habits, tasks, timetables, notes, and budgets are stored permanently in your private Cloudflare D1 database.

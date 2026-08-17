# Pocketsly — Security Remediation Plan

Status: **implemented**. Review outcome: **KILL** (Security gate FAIL, Conflict
gate FAIL, average 4.5/10). This file records the agreed remediation, what was
changed, and the deliberate ceilings left in place.

## Canonical backend decision

The app shipped three backends:

| Backend | Location | Status after this plan |
|---|---|---|
| Python + psycopg | `server.py`, `db.py`, `auth.py` | **Legacy / local dev only** |
| Netlify Functions adapter | `netlify/functions/api.py` | Legacy |
| **Cloudflare Pages Functions + D1** | `functions/api/*.js` | **Canonical production backend** |

Everything below was implemented against the Cloudflare backend; the two legacy
paths were synced only for the critical security fixes.

## P0 — Critical (all done)

1. **OTP must never be returned by the API.** `requestPasswordOtp`
   (`functions/api/_auth.js`) now delivers the code by email via Brevo
   (`BREVO_API_KEY` + `MAIL_FROM`) and returns only a success message. Without
   the env vars it fails closed. Frontend OTP auto-fill removed in
   `static/js/auth.js` and `static/js/app.js`; mobile removed in
   `mobile/lib/views/auth/auth_profile_sheet.dart`.
2. **SQL playground isolation.** `handlePostCurriculumPlayground`
   (`functions/api/_routes.js`) runs exclusively against the `PLAYGROUND_DB`
   D1 binding. Until that binding exists the endpoint refuses to run. The
   playground schema excludes all production tables (`users`, `sessions`, ...).
3. **Rate limiting.** D1-backed limiter in `functions/api/[[path]].js`
   (`isRateLimited`): 20 requests / 60 s per `cf-connecting-ip` on `/api/login`,
   `/api/register`, `/api/request-otp`, `/api/reset-password`; 429 on breach.
4. **`security_pin` never exposed.** `getUserFromSession` no longer selects it;
   `handlePatchProfile` never returns it. Default value `123456` remains a known
   limitation documented in `SECURITY.md`.
5. **Session hygiene.** Expired sessions are deleted on read;
   `purgeUserSessions` invalidates all sessions on password change/reset.
6. **Headers.** Wildcard `Access-Control-Allow-Origin: *` removed (API now same-
   origin only). `functions/api/[[path]].js` sends `Cache-Control: no-store`,
   HSTS, CSP `default-src 'none'`. `static/_headers` sets CSP, HSTS,
   `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
   `Permissions-Policy` plus the existing immutable cache rules.

## P1 — Frontend hardening (done, one ceiling)

- `static/_headers` CSP added.
- `UI.safeUrl` (`static/js/ui.js`) gates note `url_or_path` hrefs in
  `static/js/notes.js` (`http:`, `https:`, `mailto:` only).
- Deferred: `script-src 'unsafe-inline'` removal (260 inline `onclick` handlers;
  186 in views, rest in JS modules). Ceiling and upgrade path in `SECURITY.md`
  and `static/_headers`. Also `unsafe-eval` for the JS Lab sandbox.

## P2 — Mobile + tests (done)

- `flutter_secure_storage` (11.0.0) now holds the session token in
  `mobile/lib/core/network/api_client.dart`; the OTP is no longer displayed or
  auto-filled in the mobile forgot-password sheet.
- New test suite `functions/test/security.test.js` (vitest, 10 tests) drives the
  real handlers over a `node:sqlite`-backed D1 stand-in (`functions/test/helpers.js`),
  asserting the OTP/playground/rate-limit/session-pin behaviours above. CI job
  `test-functions` added in `.github/workflows/ci.yml`.

## P3 — Legacy sync + docs (done)

- `auth.py`: `request_password_otp` no longer echoes `otp_code` (logs it to the
  server console instead); `reset_password` requires the OTP and the
  `security_pin`/contact fallback path is removed. `tests/test_e2e_reset.py`
  updated to read the OTP from the DB.
- `README.md` / `SECURITY.md` updated for the canonical Cloudflare backend and
  the email-provider requirement.
- Cleanup: stale `static/_redirects` comment, dead `App.route()` call
  (`static/js/app.js`), cache-buster bumped to `v=8.9`, bundles rebuilt via
  `scripts/build.py`.

## Verification

```bash
cd functions && npm install && npm test        # edge API security suite (10/10)
python3 -m py_compile auth.py tests/test_e2e_reset.py
cd mobile && flutter pub get && flutter analyze
python3 scripts/build.py                        # regenerates bundle.js + index.html
```

## Deliberate ceilings (documented, not silently left)

- CSP keeps `'unsafe-inline' 'unsafe-eval'` — remove `'unsafe-inline'` after
  migrating inline `onclick` handlers to a delegated listener.
- Rate limiter is per-IP D1 counting (single shared table) — per-account limits
  if abuse persists.
- Legacy Python rate limiter remains in-memory (resets on restart).
- Default `security_pin = 123456` still created on register.
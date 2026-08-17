# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Instead, use
GitHub's **private vulnerability reporting** (Security → Report a vulnerability)
or email the maintainer directly.

Please include:

- A short description of the issue and its impact
- The affected file(s)/endpoint(s), if known
- Steps to reproduce (or a minimal proof of concept)
- Your suggested fix, if you have one

You should receive an acknowledgement within a few days, and we'll work with you
to confirm the issue, fix it, and (where reasonable) credit you for the report.

## Scope

The app is intentionally built with defense-in-depth:

- Passwords are hashed with **PBKDF2-HMAC-SHA256** (100,000 iterations + per-user
  salt) — never stored in plaintext
- Password and OTP comparisons use **constant-time** comparison to prevent
  timing attacks
- Sessions use **cryptographically random tokens** in HttpOnly cookies with expiry;
  expired sessions are deleted on read, and **all sessions are purged** on password
  change or reset
- Auth/OTP routes are **rate limited** (D1-backed on Cloudflare: 20 requests/60 s
  per IP, 429 responses; in-memory on the legacy Python backend)
- The password-recovery OTP is delivered **by email** (Resend) and is **never
  returned by the API**. The legacy Python backend only logs it to the server
  console for local dev
- The curriculum SQL sandbox runs against an **isolated scratch database**
  (`PLAYGROUND_DB` binding), so it can never read or write production data
- All dynamic content is **XSS-escaped** (`UI.esc()`), and the server sends
  CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS and other hardening headers
- SQL uses **parameterized queries** only (no string-concatenated SQL)

Deployment requirements (Cloudflare Pages):

- **`RESEND_API_KEY` + `MAIL_FROM`** — required for password recovery. Without
  them, `/api/request-otp` fails closed (no code is returned or logged)
- **`PLAYGROUND_DB` D1 binding** — required for the curriculum SQL sandbox. Until
  created, the playground endpoint refuses to run

Known demo limitations (not treated as vulnerabilities, but documented for
deployers):

- CSP retains `script-src 'unsafe-inline' 'unsafe-eval'` because the UI uses
  inline `onclick` handlers and the curriculum JS Lab evaluates user code.
  Removing `'unsafe-inline'` requires replacing inline handlers with delegated
  listeners (tracked in `docs/REMEDIATION_PLAN.md`). The JS Lab runs in a
  sandboxed iframe
- On the legacy Python backend the rate limiter is in-memory, so it resets on
  server restart

## Supported versions

Only the `main` branch is supported. If you're deploying a fork or a modified
copy, please verify security fixes are merged in.

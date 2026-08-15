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
  salt) — never stored in plaintext (`auth.py`)
- Password comparisons use **constant-time** `secrets.compare_digest` to prevent
  timing attacks
- Sessions use **cryptographically random tokens** in HttpOnly cookies with expiry
- Auth/OTP routes are **rate limited** (in-memory sliding window, 429 responses)
- All dynamic content is **XSS-escaped** (`UI.esc()`), and the server sends
  CSP, `X-Frame-Options`, `X-Content-Type-Options` and other hardening headers
- SQL uses **parameterized queries** only (no string-concatenated SQL)

Known demo limitations (not treated as vulnerabilities, but documented for
deployers):

- The OTP password-recovery code is printed in the API response for demo purposes —
  swap in a real email/SMS provider before production use (`auth.py`)
- The rate limiter is in-memory, so it resets on server restart
- Session tokens are stored in SQLite — protect the database file (it is gitignored)

## Supported versions

Only the `main` branch is supported. If you're deploying a fork or a modified
copy, please verify security fixes are merged in.

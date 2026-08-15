"""
NETLIFY FUNCTION ADAPTER (netlify/functions/api.py)
====================================================
Runs the entire Pocketsly REST API as a serverless function on Netlify —
no separate backend host needed. The frontend calls relative /api/* paths;
static/_redirects rewrites them to this function, so everything stays
same-origin (HttpOnly session cookies work, no CORS involved).

How it works
------------
server.py's AppRequestHandler is built on http.server.BaseHTTPRequestHandler.
This adapter builds a lightweight shim exposing the same interface the route
handlers use (path, headers, rfile, wfile, send_response, ...) and drives the
app's own do_GET / do_POST / do_PATCH / do_DELETE dispatchers with it. The
entire route table, auth, rate limiting, and business logic is reused
untouched — one codebase, two transport layers.

Serverless trade-offs (accepted for the free tier):
  * Cold starts: first request after idle takes ~2-4s (driver import + DB conn).
  * 10s execution limit on the free tier — every endpoint finishes in ms.
  * The in-memory rate limiter resets per invocation (per-request, not per-IP).
  * Sessions still work: they live in PostgreSQL (Supabase), not in memory.
"""

import base64
import email.message
import io
import json
import os
import sys
import traceback
from urllib.parse import urlsplit

# Make the repo root importable so `import server` finds server.py, db.py, ...
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

import server  # noqa: E402
from db import init_db  # noqa: E402

# Apply the schema (CREATE TABLE IF NOT EXISTS — idempotent). Done lazily so a
# missing DATABASE_URL surfaces as a clear 500 instead of a broken import.
_init_error = None
try:
    init_db()
except Exception as _err:  # pragma: no cover - misconfiguration guard
    _init_error = str(_err)


class _NullWriter:
    """Discards writes (used for HEAD requests) while mimicking a file object."""

    def write(self, data):
        return len(data)

    def getvalue(self):
        return b""


class _HandlerShim:
    """Minimal stand-in for BaseHTTPRequestHandler, matching the interface the
    AppRequestHandler methods actually use (path, headers, rfile, wfile,
    client_address, send_response, send_header, end_headers)."""

    def __init__(self, event, body_bytes, head_only=False):
        self.command = event.get("httpMethod", "GET").upper()
        self.path = _original_path(event)
        self.client_address = _client_ip(event)

        # Build a case-insensitive header map (like email.message.Message)
        self.headers = email.message.Message()
        for key, value in (event.get("headers") or {}).items():
            self.headers[key] = value
        if body_bytes and not self.headers.get("Content-Length"):
            self.headers["Content-Length"] = str(len(body_bytes))

        self.rfile = io.BytesIO(body_bytes)
        self.wfile = _NullWriter() if head_only else io.BytesIO()

        self._status = 200
        self._headers = []

    # -- http.server protocol methods the app calls -------------------------
    def send_response(self, status):
        self._status = status

    def send_header(self, name, value):
        self._headers.append((str(name), str(value)))

    def end_headers(self):
        pass

    def log_message(self, fmt, *args):  # quiet by default in serverless
        pass


def _original_path(event):
    """Recovers the original request path (+ query) from the Netlify event."""
    raw_url = event.get("rawUrl")
    if raw_url:
        parts = urlsplit(raw_url)
        path = parts.path
        if parts.query:
            path = path + "?" + parts.query
        return path or "/"
    # Fallback (some clients strip rawUrl): rebuild from query params
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    if params:
        from urllib.parse import urlencode
        path = path + "?" + urlencode(params, doseq=True)
    return path


def _client_ip(event):
    """Best-effort real client IP for the rate limiter."""
    headers = event.get("headers") or {}
    ip = (
        headers.get("x-nf-client-connection-ip")
        or (headers.get("x-forwarded-for") or "").split(",")[0].strip()
        or "127.0.0.1"
    )
    return (ip, 0)


def _read_body(event):
    """Decodes the request body (handling base64-encoded binary payloads)."""
    body = event.get("body") or ""
    if not body:
        return b""
    if event.get("isBase64Encoded"):
        return base64.b64decode(body)
    return body.encode("utf-8")


def _respond(status, headers, body_bytes):
    """Builds the Lambda-style response Netlify Functions expect.

    Content-Length is stripped and left to the platform; duplicate headers
    (e.g. Set-Cookie) go into multiValueHeaders.
    """
    filtered = [(k, v) for (k, v) in headers if k.lower() != "content-length"]
    single = {}
    multi = {}
    for key, value in filtered:
        if key in single:
            multi.setdefault(key, [single.pop(key)]).append(value)
        else:
            single[key] = value

    response = {
        "statusCode": status,
        "headers": single,
        "body": body_bytes.decode("utf-8", "replace"),
        "isBase64Encoded": False,
    }
    if multi:
        response["multiValueHeaders"] = multi
    return response


def handler(event, context):
    """Entry point: Netlify invokes this for every request routed to /api/*."""
    if _init_error:
        return _respond(
            500,
            [("Content-Type", "application/json")],
            json.dumps({"error": f"Database init failed: {_init_error}"}).encode("utf-8"),
        )

    method = event.get("httpMethod", "GET").upper()
    if method == "OPTIONS":
        return _respond(200, [], b"")

    # HEAD is handled by the GET dispatcher, but the response body is dropped
    head_only = method == "HEAD"
    if head_only:
        method = "GET"

    do_method = getattr(server.AppRequestHandler, "do_" + method, None)
    if do_method is None:
        return _respond(
            405,
            [("Content-Type", "application/json")],
            json.dumps({"error": "Method Not Allowed"}).encode("utf-8"),
        )

    shim = _HandlerShim(event, _read_body(event), head_only=head_only)
    if not shim.path.startswith("/api/"):
        return _respond(
            404,
            [("Content-Type", "application/json")],
            json.dumps({"error": "Not found"}).encode("utf-8"),
        )

    try:
        do_method(shim)
    except Exception:
        traceback.print_exc()
        return _respond(
            500,
            [("Content-Type", "application/json")],
            json.dumps({"error": "Internal server error"}).encode("utf-8"),
        )

    return _respond(shim._status, shim._headers, shim.wfile.getvalue())

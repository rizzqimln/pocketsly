"""
HTTP SERVER & REST API ROUTER (server.py)
=========================================
LEARN: How High-Performance & Secure Web Servers Work
1. Gzip Compression: Automatic response compression on text, CSS, JS, JSON & SVG.
2. Defense-in-Depth Security: CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy.
3. In-Memory Rate Limiting: Blocks brute-force attacks on auth/OTP routes (429 Too Many Requests).
4. Smart Caching: Long-lived caching for static assets with stale-while-revalidate.
5. Route Tables: Every endpoint is one named handler method registered in a
   route table (exact path or regex pattern). New endpoints = one method +
   one table entry — no giant if/elif chains, and auth is centralized.
"""

import http.server
import json
import os
import re
import urllib.parse
import gzip
import time
import base64
from collections import defaultdict
from http import cookies
from datetime import datetime

import db
import auth
from receipt_ocr import ocr_image

# Port to serve application on. Cloud hosts (Render, Railway, Fly) inject the
# port via the PORT environment variable; default to 8000 for local runs.
PORT = int(os.environ.get("PORT", "8000"))
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# Rate limiter data structures (IP -> list of timestamps)
RATE_LIMIT_STORE = defaultdict(list)
RATE_LIMIT_WINDOW_SECS = 60
RATE_LIMIT_MAX_ATTEMPTS = 20  # Max 20 requests per minute per IP for sensitive endpoints

# Default learning resources seeded into every new user's Academic Library.
DEFAULT_RESOURCES = [
    (None, "freeCodeCamp: Responsive Web Design", "freeCodeCamp", "article", "frontend", "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "Learn HTML5, CSS3, Flexbox, CSS Grid, and responsive web design principles."),
    (None, "The Odin Project: Foundations Course", "The Odin Project", "article", "frontend", "https://www.theodinproject.com/paths/foundations/courses/foundations", "Comprehensive introduction to Git, HTML, CSS, JavaScript, and backend setup."),
    (None, "W3Schools: Modern JavaScript & DOM Tutorials", "W3Schools", "article", "frontend", "https://www.w3schools.com/js/", "Interactive tutorials covering ES6+, DOM manipulation, events, and async JavaScript."),
    (None, "MDN Web Docs: Guide to Web APIs & Fetch", "MDN Web Docs", "article", "frontend", "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", "Official reference for CSS Layouts, Web APIs, Promises, and the Fetch API."),
    (None, "freeCodeCamp: Front End Development Libraries", "freeCodeCamp", "article", "frontend", "https://www.freecodecamp.org/learn/front-end-development-libraries/", "Master Bootstrap, Sass, JSX, React, and Redux state management."),
    (None, "freeCodeCamp: Relational Database & SQL", "freeCodeCamp", "article", "backend", "https://www.freecodecamp.org/learn/relational-database/", "Learn Bash, SQL, PostgreSQL, and database schema design using interactive terminals."),
    (None, "The Odin Project: NodeJS & Express Backend", "The Odin Project", "article", "backend", "https://www.theodinproject.com/paths/full-stack-javascript", "Advanced courses covering Node.js, Express, databases, REST APIs, and deployment."),
    (None, "W3Schools: SQL & Database Query Reference", "W3Schools", "article", "backend", "https://www.w3schools.com/sql/", "Learn SQL queries, INNER/LEFT JOINs, PRIMARY/FOREIGN KEY constraints, and indexes."),
    (None, "freeCodeCamp: Back End Development & APIs", "freeCodeCamp", "article", "backend", "https://www.freecodecamp.org/learn/back-end-development-and-apis/", "Build microservices, REST APIs, and handle HTTP requests with Node/Express."),
    (None, "freeCodeCamp: Scientific Computing with Python", "freeCodeCamp", "article", "backend", "https://www.freecodecamp.org/learn/scientific-computing-with-python/", "Master Python fundamentals, loops, functions, data structures, and algorithms."),
    (None, "The Odin Project: Git & GitHub Workflow", "The Odin Project", "article", "general", "https://www.theodinproject.com/lessons/foundations-git-basics", "Essential guide to version control, branching, pull requests, and commit conventions."),
    (None, "W3Schools: Fullstack Developer Roadmap", "W3Schools", "article", "general", "https://www.w3schools.com/whatis/", "Complete guide to web development technologies, system architecture, and fullstack tracks."),
]


class AppRequestHandler(http.server.BaseHTTPRequestHandler):
    """Custom request handler extending Python's built-in HTTP server."""

    # Disable default noisy log messages; we'll write custom logs
    def log_message(self, format, *args):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {self.command} {self.path} -> {args[0]}")

    # =========================================================================
    # SECURITY & PERFORMANCE HELPERS
    # =========================================================================

    def _get_client_ip(self) -> str:
        """Extracts client IP address considering proxy headers."""
        return self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()

    def _check_rate_limit(self, path: str) -> bool:
        """Enforces rate limiting on sensitive authentication and OTP routes."""
        sensitive_routes = ("/api/login", "/api/register", "/api/request-otp", "/api/reset-password")
        if not any(path.startswith(r) for r in sensitive_routes):
            return False

        client_ip = self._get_client_ip()
        now = time.time()
        key = f"{client_ip}:{path}"

        # Clean timestamps older than window
        RATE_LIMIT_STORE[key] = [t for t in RATE_LIMIT_STORE[key] if now - t < RATE_LIMIT_WINDOW_SECS]
        if len(RATE_LIMIT_STORE[key]) >= RATE_LIMIT_MAX_ATTEMPTS:
            return True
        RATE_LIMIT_STORE[key].append(now)
        return False

    def _get_security_headers(self) -> dict:
        """Returns defense-in-depth HTTP security headers and CORS configuration."""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, X-Requested-With, Accept",
            "Content-Security-Policy": (
                "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; "
                "img-src 'self' data: https: blob:; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com data:; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "worker-src 'self' blob:; "
                "connect-src 'self' *;"
            ),
        }

    def _compress_if_supported(self, body_bytes: bytes, content_type: str) -> tuple[bytes, dict]:
        """Compresses response using Gzip when supported by client."""
        extra_headers = {}
        accept_enc = self.headers.get("Accept-Encoding", "")
        compressible_prefixes = ("text/", "application/json", "application/javascript", "image/svg+xml")

        if "gzip" in accept_enc and any(content_type.startswith(p) for p in compressible_prefixes) and len(body_bytes) > 128:
            compressed = gzip.compress(body_bytes, compresslevel=6)
            if len(compressed) < len(body_bytes):
                extra_headers["Content-Encoding"] = "gzip"
                return compressed, extra_headers
        return body_bytes, extra_headers

    # =========================================================================
    # HELPER METHODS FOR RESPONSES AND COOKIES
    # =========================================================================

    def send_json(self, data, status=200, headers=None):
        """Sends a JSON response with status code, Gzip compression, and security headers."""
        raw_body = json.dumps(data).encode("utf-8")
        content_type = "application/json; charset=utf-8"
        body, comp_headers = self._compress_if_supported(raw_body, content_type)

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

        # Apply security headers
        for k, v in self._get_security_headers().items():
            self.send_header(k, v)

        # Apply compression headers
        for k, v in comp_headers.items():
            self.send_header(k, v)

        if headers:
            for key, val in headers.items():
                self.send_header(key, val)
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, message, status=400):
        """Sends a structured JSON error message."""
        self.send_json({"error": message}, status=status)

    def get_cookie_session(self):
        """Extracts session_id cookie from request headers."""
        cookie_header = self.headers.get("Cookie")
        if not cookie_header:
            return None
        cookie = cookies.SimpleCookie()
        try:
            cookie.load(cookie_header)
            if "session_id" in cookie:
                return cookie["session_id"].value
        except Exception:
            pass
        return None

    def get_current_user(self):
        """Validates current session cookie and returns user object or None."""
        token = self.get_cookie_session()
        if not token:
            return None
        return auth.get_user_from_session(token)

    def _require_user(self):
        """Returns the authenticated user dict, or sends 401 and returns None."""
        user = self.get_current_user()
        if not user:
            self.send_error_json("Unauthorized", status=401)
            return None
        return user

    def _invoke(self, handler, match, *args):
        """Calls a route handler, appending the regex match when a pattern matched."""
        if match is not None:
            return handler(self, *args, match)
        return handler(self, *args)

    def parse_json_body(self):
        """Reads and parses incoming JSON payload from request body with 10MB protection limit."""
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        if content_length > 10 * 1024 * 1024:  # 10MB payload size limit
            return None
        body_bytes = self.rfile.read(content_length)
        try:
            return json.loads(body_bytes.decode("utf-8"))
        except json.JSONDecodeError:
            return None

    def _budget_summary(self, user_id, month_year):
        """Shared monthly cash-flow summary used by /api/dashboard and /api/budget/summary."""
        inc_row = db.query_one(
            "SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = %s AND left(income_date, 7) = %s",
            (user_id, month_year)
        )
        exp_row = db.query_one(
            "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = %s AND left(expense_date, 7) = %s",
            (user_id, month_year)
        )
        budget_row = db.query_one(
            "SELECT COALESCE(SUM(amount), 0) as total FROM budgets WHERE user_id = %s AND month_year = %s",
            (user_id, month_year)
        )
        tot_inc = float(inc_row["total"]) if inc_row else 0.0
        tot_exp = float(exp_row["total"]) if exp_row else 0.0
        tot_bud = float(budget_row["total"]) if budget_row else 0.0
        return {
            "month": month_year,
            "total_income": tot_inc,
            "total_expense": tot_exp,
            "total_budget": tot_bud,
            "net_balance": tot_inc - tot_exp,
        }

    # =========================================================================
    # STATIC FILE SERVING WITH CACHING & GZIP
    # =========================================================================

    def serve_static(self):
        """Serves HTML, CSS, JS, and image assets with Gzip and high-performance caching."""
        path = self.path.split("?")[0]  # Remove query string
        if path == "/" or path == "":
            path = "/index.html"

        # Prevent directory traversal attacks (e.g. /../../etc/passwd)
        safe_path = os.path.normpath(path).lstrip("/")
        full_path = os.path.join(STATIC_DIR, safe_path)

        if not full_path.startswith(STATIC_DIR) or not os.path.isfile(full_path):
            # Fallback to index.html for Single Page Application (SPA) routing
            full_path = os.path.join(STATIC_DIR, "index.html")

        # Determine MIME type based on file extension
        ext = os.path.splitext(full_path)[1].lower()
        mime_types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
            ".webmanifest": "application/manifest+json",
        }
        content_type = mime_types.get(ext, "application/octet-stream")

        try:
            with open(full_path, "rb") as f:
                raw_content = f.read()

            content, comp_headers = self._compress_if_supported(raw_content, content_type)

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))

            # Cache Control: Long-lived caching for versioned static assets, revalidate HTML
            if ext in (".css", ".js", ".png", ".jpg", ".svg", ".ico"):
                # sw.js must never be cached: browsers check it on every navigation
                # to pick up service-worker updates. A long cache here would serve
                # a stale app shell for up to a day (see the ?v= cache-buster notes).
                if os.path.basename(full_path) == "sw.js":
                    self.send_header("Cache-Control", "no-cache")
                else:
                    self.send_header("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600")
            elif ext == ".html":
                self.send_header("Cache-Control", "no-cache, must-revalidate")
            else:
                self.send_header("Cache-Control", "public, max-age=3600")

            # Apply security headers
            for k, v in self._get_security_headers().items():
                self.send_header(k, v)

            # Apply compression headers
            for k, v in comp_headers.items():
                self.send_header(k, v)

            self.end_headers()
            self.wfile.write(content)
        except Exception:
            self.send_response(404)
            self.end_headers()

    # =========================================================================
    # HTTP METHOD ROUTERS — thin dispatchers over the route tables below
    # =========================================================================

    def do_OPTIONS(self):
        """Handles CORS preflight OPTIONS requests for mobile and web clients."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With, Accept")
        self.send_header("Access-Control-Max-Age", "86400")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        """Handles HTTP GET requests."""
        if not self.path.startswith("/api/"):
            return self.serve_static()

        path = self.path.split("?")[0]
        query_params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        handler, match = _resolve_route(_GET_ROUTES, _GET_PATTERNS, path)
        if handler is None:
            return self.send_error_json("Endpoint not found", 404)

        if path in _PUBLIC_GET:
            return self._invoke(handler, match, None, query_params)
        user = self._require_user()
        if user is None:
            return
        return self._invoke(handler, match, user["id"], query_params)

    def do_POST(self):
        """Handles HTTP POST requests."""
        if not self.path.startswith("/api/"):
            return self.send_error_json("Invalid path", 400)

        # Rate Limiting protection on sensitive authentication & OTP endpoints
        if self._check_rate_limit(self.path.split("?")[0]):
            return self.send_error_json("Too many requests. Please wait a moment before trying again.", 429)

        data = self.parse_json_body()
        if data is None:
            return self.send_error_json("Invalid JSON body", 400)

        path = self.path
        handler, match = _resolve_route(_POST_ROUTES, _POST_PATTERNS, path)
        if handler is None:
            return self.send_error_json("Endpoint not found", 404)

        if path in _PUBLIC_POST:
            return self._invoke(handler, match, None, data)
        user = self._require_user()
        if user is None:
            return
        return self._invoke(handler, match, user["id"], data)

    def do_PATCH(self):
        """Handles HTTP PATCH requests (partial updates)."""
        if not self.path.startswith("/api/"):
            return self.send_error_json("Invalid path", 400)

        user = self._require_user()
        if user is None:
            return
        user_id = user["id"]

        data = self.parse_json_body()
        if data is None:
            return self.send_error_json("Invalid JSON body", 400)

        path = self.path
        handler, match = _resolve_route(_PATCH_ROUTES, _PATCH_PATTERNS, path)
        if handler is None:
            return self.send_error_json("Endpoint not found", 404)
        return self._invoke(handler, match, user_id, data)

    def do_DELETE(self):
        """Handles HTTP DELETE requests."""
        if not self.path.startswith("/api/"):
            return self.send_error_json("Invalid path", 400)

        user = self._require_user()
        if user is None:
            return
        user_id = user["id"]

        path = self.path
        handler, match = _resolve_route({}, _DELETE_PATTERNS, path)
        if handler is None:
            return self.send_error_json("Endpoint not found", 404)
        return self._invoke(handler, match, user_id)

    # =========================================================================
    # GET HANDLERS
    # =========================================================================

    def _get_api_root(self, user_id, query_params):
        """GET /api — public API index."""
        return self.send_json({
            "status": "ok",
            "service": "pocketsly-api",
            "version": "1.0.0",
            "timestamp": int(time.time()),
            "endpoints": {
                "health": "/api/health",
                "session": "/api/session",
                "login": "/api/login",
                "register": "/api/register",
            },
        })

    def _get_health(self, user_id, query_params):
        """GET /api/health — public health check and network ping endpoint."""
        return self.send_json({
            "status": "ok",
            "service": "pocketsly-api",
            "version": "1.0.0",
            "timestamp": int(time.time()),
        })

    def _get_session(self, user_id, query_params):
        """GET /api/session — public session check (no auth required)."""
        user = self.get_current_user()
        if user:
            return self.send_json({"authenticated": True, "user": user})
        return self.send_json({"authenticated": False, "user": None})

    def _get_dashboard(self, user_id, query_params):
        """GET /api/dashboard — today's habits, tasks, events, note, and budget summary."""
        today_str = datetime.now().strftime("%Y-%m-%d")
        day_of_week = datetime.now().weekday()  # 0=Mon, 6=Sun

        # Fetch today's habits with log state
        habits_sql = """
            SELECT h.*,
                   (SELECT done FROM habit_logs WHERE habit_id = h.id AND log_date = %s) as today_done
            FROM habits h
            WHERE h.user_id = %s
        """
        habits = db.query_all(habits_sql, (today_str, user_id))

        # Fetch tasks due today or pending
        tasks = db.query_all(
            "SELECT * FROM tasks WHERE user_id = %s AND done = 0 ORDER BY priority DESC, due_date ASC LIMIT 5",
            (user_id,)
        )

        # Fetch today's schedule events
        events = db.query_all(
            "SELECT * FROM events WHERE user_id = %s AND day_of_week = %s ORDER BY start_time ASC",
            (user_id, day_of_week)
        )

        # Recent note
        recent_note = db.query_one(
            "SELECT * FROM notes WHERE user_id = %s ORDER BY updated_at DESC LIMIT 1",
            (user_id,)
        )

        month_year = datetime.now().strftime("%Y-%m")
        return self.send_json({
            "date": today_str,
            "habits": habits,
            "tasks": tasks,
            "events": events,
            "recent_note": recent_note,
            "budget_summary": self._budget_summary(user_id, month_year)
        })

    def _get_budget_summary(self, user_id, query_params):
        """GET /api/budget/summary?month=YYYY-MM — monthly cash-flow summary."""
        month_year = query_params.get("month", [datetime.now().strftime("%Y-%m")])[0]
        return self.send_json(self._budget_summary(user_id, month_year))

    def _get_habits(self, user_id, query_params):
        """GET /api/habits — all habits with today's completion state."""
        habits = db.query_all("SELECT * FROM habits WHERE user_id = %s ORDER BY id DESC", (user_id,))
        today_str = datetime.now().strftime("%Y-%m-%d")
        # Attach completion state for today
        for h in habits:
            log = db.query_one("SELECT done FROM habit_logs WHERE habit_id = %s AND log_date = %s", (h["id"], today_str))
            h["today_done"] = bool(log and log["done"])
        return self.send_json(habits)

    def _get_habit_logs(self, user_id, query_params, match):
        """GET /api/habits/<id>/logs — a habit's full completion history."""
        habit_id = int(match.group(1))
        # Verify habit belongs to user
        h = db.query_one("SELECT id FROM habits WHERE id = %s AND user_id = %s", (habit_id, user_id))
        if not h:
            return self.send_error_json("Habit not found", 404)
        logs = db.query_all("SELECT log_date, done FROM habit_logs WHERE habit_id = %s ORDER BY log_date ASC", (habit_id,))
        return self.send_json(logs)

    def _get_tasks(self, user_id, query_params):
        """GET /api/tasks — all tasks, pending first by priority."""
        tasks = db.query_all(
            "SELECT * FROM tasks WHERE user_id = %s ORDER BY done ASC, priority DESC, due_date ASC",
            (user_id,)
        )
        return self.send_json(tasks)

    def _get_events(self, user_id, query_params):
        """GET /api/events — all timetable events ordered by day and start time."""
        events = db.query_all("SELECT * FROM events WHERE user_id = %s ORDER BY day_of_week ASC, start_time ASC", (user_id,))
        return self.send_json(events)

    def _get_notes(self, user_id, query_params):
        """GET /api/notes — all notes, most recently updated first."""
        notes = db.query_all("SELECT * FROM notes WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))
        return self.send_json(notes)

    def _get_curriculum_schema(self, user_id, query_params):
        """GET /api/curriculum/schema — introspect the live PostgreSQL schema."""
        try:
            tables = db.query_all(
                "SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
            )
            schema = {}
            for t in tables:
                table_name = t["name"]
                columns_info = db.query_all(
                    """
                    SELECT c.column_name AS name, c.data_type AS type,
                           (tc.constraint_type = 'PRIMARY KEY') AS pk,
                           (c.is_nullable = 'NO') AS notnull
                    FROM information_schema.columns c
                    LEFT JOIN information_schema.key_column_usage kcu
                        ON c.table_schema = kcu.table_schema
                       AND c.table_name = kcu.table_name
                       AND c.column_name = kcu.column_name
                    LEFT JOIN information_schema.table_constraints tc
                        ON kcu.constraint_schema = tc.constraint_schema
                       AND kcu.constraint_name = tc.constraint_name
                       AND tc.constraint_type = 'PRIMARY KEY'
                    WHERE c.table_schema = 'public' AND c.table_name = %s
                    ORDER BY c.ordinal_position
                    """,
                    (table_name,),
                )
                schema[table_name] = [
                    {"name": c["name"], "type": c["type"], "pk": bool(c["pk"]), "notnull": bool(c["notnull"])}
                    for c in columns_info
                ]
            return self.send_json(schema)
        except Exception as e:
            return self.send_error_json(str(e))

    def _get_courses(self, user_id, query_params):
        """GET /api/courses — all curriculum courses."""
        courses = db.query_all("SELECT * FROM courses WHERE user_id = %s ORDER BY code ASC", (user_id,))
        return self.send_json(courses)

    def _get_lecturers(self, user_id, query_params):
        """GET /api/lecturers — all lecturers."""
        lecturers = db.query_all("SELECT * FROM lecturers WHERE user_id = %s ORDER BY name ASC", (user_id,))
        return self.send_json(lecturers)

    def _get_budgets(self, user_id, query_params):
        """GET /api/budgets?month=YYYY-MM — budgets with actual spend per category."""
        month_year = query_params.get("month", [datetime.now().strftime("%Y-%m")])[0]
        budgets = db.query_all("SELECT * FROM budgets WHERE user_id = %s AND month_year = %s", (user_id, month_year))
        expenses = db.query_all(
            "SELECT category, SUM(amount) as spent FROM expenses WHERE user_id = %s AND left(expense_date, 7) = %s GROUP BY category",
            (user_id, month_year)
        )
        exp_dict = {e["category"]: e["spent"] for e in expenses}

        for b in budgets:
            b["spent"] = exp_dict.get(b["category"], 0.0)

        return self.send_json(budgets)

    def _get_expenses(self, user_id, query_params):
        """GET /api/expenses — all expenses, newest first."""
        expenses = db.query_all("SELECT * FROM expenses WHERE user_id = %s ORDER BY expense_date DESC", (user_id,))
        return self.send_json(expenses)

    def _get_incomes(self, user_id, query_params):
        """GET /api/incomes — all incomes, newest first."""
        incomes = db.query_all("SELECT * FROM incomes WHERE user_id = %s ORDER BY income_date DESC, id DESC", (user_id,))
        return self.send_json(incomes)

    def _get_study_logs(self, user_id, query_params):
        """GET /api/study-logs — all study logs, newest first."""
        logs = db.query_all("SELECT * FROM study_logs WHERE user_id = %s ORDER BY log_date DESC, id DESC", (user_id,))
        return self.send_json(logs)

    def _get_resources(self, user_id, query_params):
        """GET /api/resources — academic library, seeding defaults on first visit."""
        resources = db.query_all("SELECT * FROM resources WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        if not resources:
            for item in DEFAULT_RESOURCES:
                db.execute(
                    "INSERT INTO resources (user_id, title, author, resource_type, category, url_or_path, notes) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (user_id, *item[1:])
                )
            resources = db.query_all("SELECT * FROM resources WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        return self.send_json(resources)

    def _get_backup_export(self, user_id, query_params):
        """GET /api/backup/export — full JSON backup of every module's data."""
        curr_user = db.query_one("SELECT id, username, email, phone, created_at FROM users WHERE id = %s", (user_id,))
        habits = db.query_all("SELECT * FROM habits WHERE user_id = %s", (user_id,))
        habit_ids = [h["id"] for h in habits]
        habit_logs = []
        if habit_ids:
            placeholders = ",".join(["%s"] * len(habit_ids))
            habit_logs = db.query_all(f"SELECT * FROM habit_logs WHERE habit_id IN ({placeholders})", habit_ids)

        tasks = db.query_all("SELECT * FROM tasks WHERE user_id = %s", (user_id,))
        events = db.query_all("SELECT * FROM events WHERE user_id = %s", (user_id,))
        notes = db.query_all("SELECT * FROM notes WHERE user_id = %s", (user_id,))
        courses = db.query_all("SELECT * FROM courses WHERE user_id = %s", (user_id,))
        lecturers = db.query_all("SELECT * FROM lecturers WHERE user_id = %s", (user_id,))
        budgets = db.query_all("SELECT * FROM budgets WHERE user_id = %s", (user_id,))
        expenses = db.query_all("SELECT * FROM expenses WHERE user_id = %s", (user_id,))
        incomes = db.query_all("SELECT * FROM incomes WHERE user_id = %s", (user_id,))
        resources = db.query_all("SELECT * FROM resources WHERE user_id = %s", (user_id,))
        study_logs = db.query_all("SELECT * FROM study_logs WHERE user_id = %s", (user_id,))

        payload = {
            "version": "1.0",
            "app": "Pocketsly",
            "exported_at": datetime.now().isoformat(),
            "user": curr_user,
            "data": {
                "habits": habits,
                "habit_logs": habit_logs,
                "tasks": tasks,
                "events": events,
                "notes": notes,
                "courses": courses,
                "lecturers": lecturers,
                "budgets": budgets,
                "expenses": expenses,
                "incomes": incomes,
                "resources": resources,
                "study_logs": study_logs,
            }
        }
        return self.send_json(payload)

    # =========================================================================
    # POST HANDLERS
    # =========================================================================

    def _post_register(self, user_id, data):
        """POST /api/register — create account and set session cookie."""
        try:
            user = auth.register_user(
                username=data.get("username", ""),
                password=data.get("password", ""),
                email=data.get("email"),
                phone=data.get("phone"),
                security_pin=data.get("security_pin", "123456")
            )
            token = auth.login_user(data.get("username", ""), data.get("password", ""))
            # Set HttpOnly session cookie
            cookie_hdr = f"session_id={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={auth.SESSION_DURATION_DAYS * 86400}"
            return self.send_json({"success": True, "user": user}, headers={"Set-Cookie": cookie_hdr})
        except ValueError as e:
            return self.send_error_json(str(e), status=400)

    def _post_login(self, user_id, data):
        """POST /api/login — authenticate and set session cookie."""
        try:
            token = auth.login_user(data.get("username", ""), data.get("password", ""))
            user = auth.get_user_from_session(token)
            cookie_hdr = f"session_id={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={auth.SESSION_DURATION_DAYS * 86400}"
            return self.send_json({"success": True, "user": user}, headers={"Set-Cookie": cookie_hdr})
        except ValueError as e:
            return self.send_error_json(str(e), status=400)

    def _post_request_otp(self, user_id, data):
        """POST /api/request-otp — generate an OTP for password recovery."""
        try:
            target = data.get("email") or data.get("username") or ""
            result = auth.request_password_otp(target)
            return self.send_json(result)
        except ValueError as e:
            return self.send_error_json(str(e), status=400)

    def _post_reset_password(self, user_id, data):
        """POST /api/reset-password — reset password after OTP/recovery verification."""
        try:
            recovery_contact = (
                data.get("recovery_contact") or
                data.get("email") or
                data.get("phone") or
                data.get("security_pin") or ""
            )
            otp_code = data.get("otp_code")
            auth.reset_password(
                username=data.get("username") or data.get("email") or "",
                recovery_contact=recovery_contact,
                new_password=data.get("new_password", ""),
                otp_code=otp_code
            )
            return self.send_json({
                "success": True,
                "message": "Password reset successfully. You can now sign in."
            })
        except ValueError as e:
            return self.send_error_json(str(e), status=400)

    def _post_logout(self, user_id, data):
        """POST /api/logout — destroy session and clear cookie."""
        token = self.get_cookie_session()
        auth.logout_session(token)
        clear_cookie = "session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
        return self.send_json({"success": True}, headers={"Set-Cookie": clear_cookie})

    def _post_receipt_scan(self, user_id, data):
        """POST /api/receipt/scan — OCR a receipt image into structured data."""
        image_b64 = data.get("image", "")
        if not image_b64:
            return self.send_error_json("Missing 'image' (base64 data URL)", 400)
        if image_b64.startswith("data:"):
            image_b64 = image_b64.split(",", 1)[-1]
        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception:
            return self.send_error_json("Invalid base64 image data", 400)
        if len(image_bytes) > 8 * 1024 * 1024:
            return self.send_error_json("Image too large (max 8MB)", 413)

        try:
            parsed = ocr_image(image_bytes)
            return self.send_json(parsed)
        except Exception as err:
            return self.send_error_json(f"Receipt scan failed: {str(err)}", 500)

    def _post_habits(self, user_id, data):
        """POST /api/habits — create a new habit."""
        title = data.get("title", "").strip()
        icon = data.get("icon", "✨").strip()
        color = data.get("color", "#4F6DF5").strip()
        if not title:
            return self.send_error_json("Title is required")
        hid = db.insert(
            "INSERT INTO habits (user_id, title, icon, color) VALUES (%s, %s, %s, %s)",
            (user_id, title, icon, color)
        )
        return self.send_json({"id": hid, "title": title, "icon": icon, "color": color}, status=201)

    def _post_habit_log(self, user_id, data, match):
        """POST /api/habits/<id>/log — check off a habit for a date (UPSERT)."""
        habit_id = int(match.group(1))
        date_str = data.get("date", datetime.now().strftime("%Y-%m-%d"))
        done = 1 if data.get("done", True) else 0

        # Verify ownership
        h = db.query_one("SELECT id FROM habits WHERE id = %s AND user_id = %s", (habit_id, user_id))
        if not h:
            return self.send_error_json("Habit not found", 404)

        # Insert or update habit_log using PostgreSQL UPSERT logic
        sql = """
            INSERT INTO habit_logs (habit_id, log_date, done)
            VALUES (%s, %s, %s)
            ON CONFLICT(habit_id, log_date) DO UPDATE SET done = excluded.done
        """
        db.execute(sql, (habit_id, date_str, done))
        return self.send_json({"success": True, "habit_id": habit_id, "date": date_str, "done": bool(done)})

    def _post_tasks(self, user_id, data):
        """POST /api/tasks — create a new task."""
        title = data.get("title", "").strip()
        details = data.get("details", "").strip()
        priority = data.get("priority", "medium").lower()
        due_date = data.get("due_date", "")
        if not title:
            return self.send_error_json("Task title is required")
        if priority not in ("low", "medium", "high"):
            priority = "medium"

        tid = db.insert(
            "INSERT INTO tasks (user_id, title, details, priority, due_date) VALUES (%s, %s, %s, %s, %s)",
            (user_id, title, details, priority, due_date)
        )
        return self.send_json({"id": tid, "title": title, "priority": priority, "done": False}, status=201)

    def _post_events(self, user_id, data):
        """POST /api/events — create a timetable event."""
        title = data.get("title", "").strip()
        day_of_week = int(data.get("day_of_week", 0))
        start_time = data.get("start_time", "09:00").strip()
        end_time = data.get("end_time", "10:00").strip()
        location = data.get("location", "").strip()
        color = data.get("color", "#4F6DF5").strip()

        if not title:
            return self.send_error_json("Event title is required")

        eid = db.insert(
            "INSERT INTO events (user_id, title, day_of_week, start_time, end_time, location, color) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (user_id, title, day_of_week, start_time, end_time, location, color)
        )
        return self.send_json({"id": eid, "title": title}, status=201)

    def _post_notes(self, user_id, data):
        """POST /api/notes — create a journal note."""
        title = data.get("title", "").strip() or "Untitled Note"
        body = data.get("body", "").strip()
        mood = data.get("mood", "neutral").strip()

        nid = db.insert(
            "INSERT INTO notes (user_id, title, body, mood) VALUES (%s, %s, %s, %s)",
            (user_id, title, body, mood)
        )
        return self.send_json({"id": nid, "title": title, "body": body, "mood": mood}, status=201)

    def _post_curriculum_playground(self, user_id, data):
        """POST /api/curriculum/playground — run a sandboxed SQL query."""
        query = data.get("query", "").strip()
        if not query:
            return self.send_error_json("SQL query cannot be empty")

        # Security precaution: block destructive or system-table operations,
        # but allow SELECT / INSERT / UPDATE / DELETE for sandbox learning.
        lower_q = query.lower()
        forbidden = [
            "drop table", "alter table", "create table", "truncate",
            "pg_catalog", "information_schema", "grant", "revoke",
        ]
        for f in forbidden:
            if f in lower_q:
                return self.send_error_json(f"Operation '{f.upper()}' is blocked in the playground for safety.")

        try:
            with db.get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(query)

                if cursor.description:  # Read query
                    columns = [col[0] for col in cursor.description]
                    rows = cursor.fetchall()  # Already dicts (psycopg dict_row)
                    return self.send_json({"type": "select", "columns": columns, "rows": rows})
                else:  # Write query
                    conn.commit()
                    affected = cursor.rowcount
                    return self.send_json({"type": "write", "affected_rows": affected})
        except Exception as e:
            return self.send_error_json(str(e))

    def _post_courses(self, user_id, data):
        """POST /api/courses — add a curriculum course."""
        code = data.get("code", "").strip()
        name = data.get("name", "").strip()
        credits = int(data.get("credits", 3))
        semester = int(data.get("semester", 1))
        progress = max(0, min(100, int(data.get("progress", 0))))
        if not code or not name:
            return self.send_error_json("Course code and name are required")

        cid = db.insert(
            "INSERT INTO courses (user_id, code, name, credits, semester, progress) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, code, name, credits, semester, progress)
        )
        return self.send_json({"id": cid, "code": code, "name": name, "credits": credits, "progress": progress}, status=201)

    def _post_study_logs(self, user_id, data):
        """POST /api/study-logs — log study hours for a course."""
        course_name = data.get("course_name", "").strip()
        hours = float(data.get("hours", 1.0))
        activity_type = data.get("activity_type", "practice").strip()
        log_date = data.get("log_date", datetime.now().strftime("%Y-%m-%d")).strip()
        notes = data.get("notes", "").strip()
        if not course_name or hours <= 0:
            return self.send_error_json("Course name and positive hours are required")

        lid = db.insert(
            "INSERT INTO study_logs (user_id, course_name, hours, activity_type, log_date, notes) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, course_name, hours, activity_type, log_date, notes)
        )
        return self.send_json({"id": lid, "course_name": course_name, "hours": hours, "activity_type": activity_type, "log_date": log_date}, status=201)

    def _post_lecturers(self, user_id, data):
        """POST /api/lecturers — add a lecturer."""
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        office = data.get("office", "").strip()
        phone = data.get("phone", "").strip()
        if not name:
            return self.send_error_json("Lecturer name is required")

        lid = db.insert(
            "INSERT INTO lecturers (user_id, name, email, office, phone) VALUES (%s, %s, %s, %s, %s)",
            (user_id, name, email, office, phone)
        )
        return self.send_json({"id": lid, "name": name, "email": email, "office": office, "phone": phone}, status=201)

    def _post_budgets(self, user_id, data):
        """POST /api/budgets — upsert a monthly budget for a category."""
        category = data.get("category", "").strip()
        amount = float(data.get("amount", 0.0))
        month_year = data.get("month_year", datetime.now().strftime("%Y-%m"))
        if not category or amount <= 0:
            return self.send_error_json("Category and dynamic positive amount required")

        # Use UPSERT for budgets
        db.execute(
            "INSERT INTO budgets (user_id, category, amount, month_year) VALUES (%s, %s, %s, %s) ON CONFLICT(user_id, category, month_year) DO UPDATE SET amount = excluded.amount",
            (user_id, category, amount, month_year)
        )
        return self.send_json({"success": True}, status=201)

    def _post_expenses(self, user_id, data):
        """POST /api/expenses — record an expense."""
        category = data.get("category", "").strip()
        amount = float(data.get("amount", 0.0))
        description = data.get("description", "").strip()
        expense_date = data.get("expense_date", datetime.now().strftime("%Y-%m-%d"))
        wallet = data.get("wallet", "Cash").strip()
        if not category or amount <= 0:
            return self.send_error_json("Category and dynamic positive amount required")

        eid = db.insert(
            "INSERT INTO expenses (user_id, category, amount, description, expense_date, wallet) VALUES (%s, %s, %s, %s, %s, %s)",
            (user_id, category, amount, description, expense_date, wallet)
        )
        return self.send_json({"id": eid, "category": category, "amount": amount, "wallet": wallet}, status=201)

    def _post_incomes(self, user_id, data):
        """POST /api/incomes — record an income."""
        source = data.get("source", "").strip()
        amount = float(data.get("amount", 0.0))
        description = data.get("description", "").strip()
        income_date = data.get("income_date", datetime.now().strftime("%Y-%m-%d"))
        wallet = data.get("wallet", "Cash").strip()
        recurring = data.get("recurring", "none").strip()
        if not source or amount <= 0:
            return self.send_error_json("Source and positive amount required")

        iid = db.insert(
            "INSERT INTO incomes (user_id, source, amount, description, income_date, wallet, recurring) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (user_id, source, amount, description, income_date, wallet, recurring)
        )
        return self.send_json({"id": iid, "source": source, "amount": amount, "description": description, "income_date": income_date, "wallet": wallet, "recurring": recurring}, status=201)

    def _post_resources(self, user_id, data):
        """POST /api/resources — add an academic library resource."""
        title = data.get("title", "").strip()
        author = data.get("author", "").strip()
        resource_type = data.get("resource_type", "book").strip()
        category = data.get("category", "general").strip()
        url_or_path = data.get("url_or_path", "").strip()
        notes = data.get("notes", "").strip()
        year = data.get("year", "").strip()
        publisher = data.get("publisher", "").strip()
        doi = data.get("doi", "").strip()

        if not title or not resource_type:
            return self.send_error_json("Title and resource type are required")

        rid = db.insert(
            "INSERT INTO resources (user_id, title, author, resource_type, category, url_or_path, notes, year, publisher, doi) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (user_id, title, author, resource_type, category, url_or_path, notes, year, publisher, doi)
        )
        return self.send_json({"id": rid, "title": title, "category": category, "year": year, "publisher": publisher, "doi": doi}, status=201)

    def _post_backup_restore(self, user_id, data):
        """POST /api/backup/restore — wipe and restore a user's data from a backup."""
        backup_data = data.get("data")
        if not isinstance(backup_data, dict):
            return self.send_error_json("Invalid backup format. Missing 'data' object.", 400)

        try:
            with db.get_db() as conn:
                # 1. Delete existing user domain data
                conn.execute("DELETE FROM habits WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM tasks WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM events WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM notes WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM courses WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM lecturers WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM budgets WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM expenses WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM incomes WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM resources WHERE user_id = %s", (user_id,))
                conn.execute("DELETE FROM study_logs WHERE user_id = %s", (user_id,))

                # 2. Insert Habits & Habit Logs
                habit_id_map = {}
                for h in backup_data.get("habits", []):
                    old_hid = h.get("id")
                    cursor = conn.execute(
                        "INSERT INTO habits (user_id, title, icon, color, created_at) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                        (user_id, h.get("title", "Habit"), h.get("icon", "✨"), h.get("color", "#4F6DF5"), h.get("created_at", datetime.now().isoformat()))
                    )
                    if old_hid is not None:
                        habit_id_map[old_hid] = cursor.fetchone()["id"]

                for hl in backup_data.get("habit_logs", []):
                    mapped_hid = habit_id_map.get(hl.get("habit_id"))
                    if mapped_hid:
                        conn.execute(
                            "INSERT INTO habit_logs (habit_id, log_date, done, created_at) VALUES (%s, %s, %s, %s) ON CONFLICT(habit_id, log_date) DO NOTHING",
                            (mapped_hid, hl.get("log_date"), hl.get("done", 1), hl.get("created_at", datetime.now().isoformat()))
                        )

                # 3. Tasks
                for t in backup_data.get("tasks", []):
                    conn.execute(
                        "INSERT INTO tasks (user_id, title, details, priority, due_date, done, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (user_id, t.get("title", ""), t.get("details"), t.get("priority", "medium"), t.get("due_date"), t.get("done", 0), t.get("created_at", datetime.now().isoformat()))
                    )

                # 4. Courses
                course_id_map = {}
                for c in backup_data.get("courses", []):
                    old_cid = c.get("id")
                    cursor = conn.execute(
                        "INSERT INTO courses (user_id, code, name, credits, semester, progress) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                        (user_id, c.get("code", ""), c.get("name", ""), c.get("credits", 3), c.get("semester", 1), c.get("progress", 0))
                    )
                    if old_cid is not None:
                        course_id_map[old_cid] = cursor.fetchone()["id"]

                # 5. Lecturers
                lecturer_id_map = {}
                for l in backup_data.get("lecturers", []):
                    old_lid = l.get("id")
                    cursor = conn.execute(
                        "INSERT INTO lecturers (user_id, name, email, office, phone) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                        (user_id, l.get("name", ""), l.get("email"), l.get("office"), l.get("phone"))
                    )
                    if old_lid is not None:
                        lecturer_id_map[old_lid] = cursor.fetchone()["id"]

                # 6. Events
                for e in backup_data.get("events", []):
                    mapped_cid = course_id_map.get(e.get("course_id"))
                    mapped_lid = lecturer_id_map.get(e.get("lecturer_id"))
                    conn.execute(
                        "INSERT INTO events (user_id, title, day_of_week, start_time, end_time, location, color, course_id, lecturer_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                        (user_id, e.get("title", ""), e.get("day_of_week", 0), e.get("start_time", "09:00"), e.get("end_time", "10:00"), e.get("location"), e.get("color", "#4F6DF5"), mapped_cid, mapped_lid)
                    )

                # 7. Notes
                for n in backup_data.get("notes", []):
                    conn.execute(
                        "INSERT INTO notes (user_id, title, body, mood, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s)",
                        (user_id, n.get("title", ""), n.get("body"), n.get("mood", "neutral"), n.get("created_at", datetime.now().isoformat()), n.get("updated_at", datetime.now().isoformat()))
                    )

                # 8. Budgets (UPSERT on the unique user+category+month constraint)
                for b in backup_data.get("budgets", []):
                    conn.execute(
                        "INSERT INTO budgets (user_id, category, amount, month_year) VALUES (%s, %s, %s, %s) ON CONFLICT(user_id, category, month_year) DO UPDATE SET amount = excluded.amount",
                        (user_id, b.get("category", ""), b.get("amount", 0.0), b.get("month_year", datetime.now().strftime("%Y-%m")))
                    )

                # 9. Expenses
                for exp in backup_data.get("expenses", []):
                    conn.execute(
                        "INSERT INTO expenses (user_id, category, amount, description, expense_date) VALUES (%s, %s, %s, %s, %s)",
                        (user_id, exp.get("category", ""), exp.get("amount", 0.0), exp.get("description"), exp.get("expense_date", datetime.now().strftime("%Y-%m-%d")))
                    )

                # 10. Incomes
                for inc in backup_data.get("incomes", []):
                    conn.execute(
                        "INSERT INTO incomes (user_id, source, amount, description, income_date) VALUES (%s, %s, %s, %s, %s)",
                        (user_id, inc.get("source", ""), inc.get("amount", 0.0), inc.get("description"), inc.get("income_date", datetime.now().strftime("%Y-%m-%d")))
                    )

                # 11. Resources
                for r in backup_data.get("resources", []):
                    conn.execute(
                        "INSERT INTO resources (user_id, title, author, resource_type, category, url_or_path, status, notes, year, publisher, doi) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                        (user_id, r.get("title", ""), r.get("author"), r.get("resource_type", "article"), r.get("category", "general"), r.get("url_or_path"), r.get("status", "unread"), r.get("notes"), r.get("year"), r.get("publisher"), r.get("doi"))
                    )

                # 12. Study Logs
                for sl in backup_data.get("study_logs", []):
                    conn.execute(
                        "INSERT INTO study_logs (user_id, course_name, hours, activity_type, log_date, notes) VALUES (%s, %s, %s, %s, %s, %s)",
                        (user_id, sl.get("course_name", ""), sl.get("hours", 1.0), sl.get("activity_type", "practice"), sl.get("log_date", datetime.now().strftime("%Y-%m-%d")), sl.get("notes"))
                    )

            return self.send_json({"success": True, "message": "Backup restored successfully."})
        except Exception as err:
            return self.send_error_json(f"Restore failed: {str(err)}", 500)

    # =========================================================================
    # PATCH HANDLERS
    # =========================================================================

    def _patch_task(self, user_id, data, match):
        """PATCH /api/tasks/<id> — partially update a task."""
        task_id = int(match.group(1))
        t = db.query_one("SELECT * FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
        if not t:
            return self.send_error_json("Task not found", 404)

        title = data.get("title", t["title"])
        details = data.get("details", t["details"])
        priority = data.get("priority", t["priority"])
        due_date = data.get("due_date", t["due_date"])
        done = 1 if data.get("done", t["done"]) else 0

        db.execute(
            "UPDATE tasks SET title=%s, details=%s, priority=%s, due_date=%s, done=%s WHERE id=%s",
            (title, details, priority, due_date, done, task_id)
        )
        return self.send_json({"success": True, "id": task_id})

    def _patch_note(self, user_id, data, match):
        """PATCH /api/notes/<id> — partially update a note."""
        note_id = int(match.group(1))
        n = db.query_one("SELECT * FROM notes WHERE id = %s AND user_id = %s", (note_id, user_id))
        if not n:
            return self.send_error_json("Note not found", 404)

        title = data.get("title", n["title"])
        body = data.get("body", n["body"])
        mood = data.get("mood", n["mood"])
        updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        db.execute(
            "UPDATE notes SET title=%s, body=%s, mood=%s, updated_at=%s WHERE id=%s",
            (title, body, mood, updated_at, note_id)
        )
        return self.send_json({"success": True, "id": note_id})

    def _patch_course(self, user_id, data, match):
        """PATCH /api/courses/<id> — partially update a course."""
        course_id = int(match.group(1))
        c = db.query_one("SELECT * FROM courses WHERE id = %s AND user_id = %s", (course_id, user_id))
        if not c:
            return self.send_error_json("Course not found", 404)

        code = data.get("code", c["code"])
        name = data.get("name", c["name"])
        credits = int(data.get("credits", c["credits"]))
        semester = int(data.get("semester", c["semester"]))
        progress = max(0, min(100, int(data.get("progress", c.get("progress", 0) or 0))))

        db.execute(
            "UPDATE courses SET code=%s, name=%s, credits=%s, semester=%s, progress=%s WHERE id=%s",
            (code, name, credits, semester, progress, course_id)
        )
        return self.send_json({"success": True, "id": course_id, "progress": progress})

    def _patch_profile(self, user_id, data):
        """PATCH /api/profile — update account details (username, email, PIN, password)."""
        new_username = data.get("username", "").strip().lower()
        new_email = data.get("email", "").strip().lower() if "email" in data else None
        new_phone = data.get("phone", "").strip() if "phone" in data else None
        new_pin = data.get("security_pin", "").strip()
        new_password = data.get("password", "").strip()
        new_currency = data.get("currency", "").strip().upper() if "currency" in data else None

        curr_user = db.query_one("SELECT * FROM users WHERE id = %s", (user_id,))
        if not curr_user:
            return self.send_error_json("User not found", 404)

        # Validate and update username
        if new_username and new_username != curr_user["username"]:
            if len(new_username) < 3:
                return self.send_error_json("Username must be at least 3 characters long", 400)
            existing = db.query_one("SELECT id FROM users WHERE username = %s", (new_username,))
            if existing:
                return self.send_error_json("Username is already taken", 400)
            db.execute("UPDATE users SET username = %s WHERE id = %s", (new_username, user_id))

        # Update email if provided
        if new_email is not None:
            db.execute("UPDATE users SET email = %s WHERE id = %s", (new_email or None, user_id))

        # Update phone if provided
        if new_phone is not None:
            db.execute("UPDATE users SET phone = %s WHERE id = %s", (new_phone or None, user_id))

        # Update currency if provided
        if new_currency:
            db.execute("UPDATE users SET currency = %s WHERE id = %s", (new_currency, user_id))

        # Validate and update security PIN
        if new_pin:
            db.execute("UPDATE users SET security_pin = %s WHERE id = %s", (new_pin, user_id))

        # Validate and update password
        if new_password:
            if len(new_password) < 6:
                return self.send_error_json("Password must be at least 6 characters long", 400)
            pwd_hash, salt_hex = auth.hash_password(new_password)
            db.execute("UPDATE users SET password_hash = %s, salt = %s WHERE id = %s", (pwd_hash, salt_hex, user_id))

        updated_user = db.query_one("SELECT id, username, email, phone, security_pin, currency FROM users WHERE id = %s", (user_id,))
        return self.send_json({"success": True, "user": updated_user})

    # =========================================================================
    # DELETE HANDLERS — one per resource, all ownership-scoped
    # =========================================================================

    def _delete_habit(self, user_id, match):
        hid = int(match.group(1))
        db.execute("DELETE FROM habits WHERE id = %s AND user_id = %s", (hid, user_id))
        return self.send_json({"success": True})

    def _delete_task(self, user_id, match):
        tid = int(match.group(1))
        db.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (tid, user_id))
        return self.send_json({"success": True})

    def _delete_event(self, user_id, match):
        eid = int(match.group(1))
        db.execute("DELETE FROM events WHERE id = %s AND user_id = %s", (eid, user_id))
        return self.send_json({"success": True})

    def _delete_note(self, user_id, match):
        nid = int(match.group(1))
        db.execute("DELETE FROM notes WHERE id = %s AND user_id = %s", (nid, user_id))
        return self.send_json({"success": True})

    def _delete_resource(self, user_id, match):
        rid = int(match.group(1))
        db.execute("DELETE FROM resources WHERE id = %s AND user_id = %s", (rid, user_id))
        return self.send_json({"success": True})

    def _delete_course(self, user_id, match):
        cid = int(match.group(1))
        db.execute("DELETE FROM courses WHERE id = %s AND user_id = %s", (cid, user_id))
        return self.send_json({"success": True})

    def _delete_lecturer(self, user_id, match):
        lid = int(match.group(1))
        db.execute("DELETE FROM lecturers WHERE id = %s AND user_id = %s", (lid, user_id))
        return self.send_json({"success": True})

    def _delete_budget(self, user_id, match):
        bid = int(match.group(1))
        db.execute("DELETE FROM budgets WHERE id = %s AND user_id = %s", (bid, user_id))
        return self.send_json({"success": True})

    def _delete_expense(self, user_id, match):
        eid = int(match.group(1))
        db.execute("DELETE FROM expenses WHERE id = %s AND user_id = %s", (eid, user_id))
        return self.send_json({"success": True})

    def _delete_income(self, user_id, match):
        iid = int(match.group(1))
        db.execute("DELETE FROM incomes WHERE id = %s AND user_id = %s", (iid, user_id))
        return self.send_json({"success": True})

    def _delete_study_log(self, user_id, match):
        lid = int(match.group(1))
        db.execute("DELETE FROM study_logs WHERE id = %s AND user_id = %s", (lid, user_id))
        return self.send_json({"success": True})


# =============================================================================
# ROUTE RESOLUTION & ROUTE TABLES
# =============================================================================

def _resolve_route(route_table, patterns, path):
    """Returns (handler, match) for a path — exact routes first, then patterns."""
    handler = route_table.get(path)
    if handler:
        return handler, None
    for rx, h in patterns:
        match = rx.match(path)
        if match:
            return h, match
    return None, None

# =============================================================================
# ROUTE TABLES — path (or regex pattern) -> handler method
# =============================================================================

# Endpoints reachable without a session cookie
_PUBLIC_GET = {"/api", "/api/", "/api/session", "/api/health"}
_PUBLIC_POST = {"/api/register", "/api/login", "/api/request-otp", "/api/reset-password", "/api/logout"}

_GET_ROUTES = {
    "/api": AppRequestHandler._get_api_root,
    "/api/": AppRequestHandler._get_api_root,
    "/api/health": AppRequestHandler._get_health,
    "/api/session": AppRequestHandler._get_session,
    "/api/dashboard": AppRequestHandler._get_dashboard,
    "/api/budget/summary": AppRequestHandler._get_budget_summary,
    "/api/habits": AppRequestHandler._get_habits,
    "/api/tasks": AppRequestHandler._get_tasks,
    "/api/events": AppRequestHandler._get_events,
    "/api/schedules": AppRequestHandler._get_events,
    "/api/notes": AppRequestHandler._get_notes,
    "/api/curriculum/schema": AppRequestHandler._get_curriculum_schema,
    "/api/courses": AppRequestHandler._get_courses,
    "/api/lecturers": AppRequestHandler._get_lecturers,
    "/api/budgets": AppRequestHandler._get_budgets,
    "/api/expenses": AppRequestHandler._get_expenses,
    "/api/incomes": AppRequestHandler._get_incomes,
    "/api/study-logs": AppRequestHandler._get_study_logs,
    "/api/resources": AppRequestHandler._get_resources,
    "/api/backup/export": AppRequestHandler._get_backup_export,
}

_GET_PATTERNS = [
    (re.compile(r"^/api/habits/(\d+)/logs$"), AppRequestHandler._get_habit_logs),
]

_POST_ROUTES = {
    "/api/register": AppRequestHandler._post_register,
    "/api/login": AppRequestHandler._post_login,
    "/api/request-otp": AppRequestHandler._post_request_otp,
    "/api/reset-password": AppRequestHandler._post_reset_password,
    "/api/logout": AppRequestHandler._post_logout,
    "/api/receipt/scan": AppRequestHandler._post_receipt_scan,
    "/api/habits": AppRequestHandler._post_habits,
    "/api/tasks": AppRequestHandler._post_tasks,
    "/api/events": AppRequestHandler._post_events,
    "/api/schedules": AppRequestHandler._post_events,
    "/api/notes": AppRequestHandler._post_notes,
    "/api/curriculum/playground": AppRequestHandler._post_curriculum_playground,
    "/api/courses": AppRequestHandler._post_courses,
    "/api/study-logs": AppRequestHandler._post_study_logs,
    "/api/lecturers": AppRequestHandler._post_lecturers,
    "/api/budgets": AppRequestHandler._post_budgets,
    "/api/expenses": AppRequestHandler._post_expenses,
    "/api/incomes": AppRequestHandler._post_incomes,
    "/api/resources": AppRequestHandler._post_resources,
    "/api/backup/restore": AppRequestHandler._post_backup_restore,
}

_POST_PATTERNS = [
    (re.compile(r"^/api/habits/(\d+)/log$"), AppRequestHandler._post_habit_log),
]

_PATCH_ROUTES = {
    "/api/profile": AppRequestHandler._patch_profile,
}

_PATCH_PATTERNS = [
    (re.compile(r"^/api/tasks/(\d+)$"), AppRequestHandler._patch_task),
    (re.compile(r"^/api/notes/(\d+)$"), AppRequestHandler._patch_note),
    (re.compile(r"^/api/courses/(\d+)$"), AppRequestHandler._patch_course),
]

_DELETE_PATTERNS = [
    (re.compile(r"^/api/habits/(\d+)$"), AppRequestHandler._delete_habit),
    (re.compile(r"^/api/tasks/(\d+)$"), AppRequestHandler._delete_task),
    (re.compile(r"^/api/events/(\d+)$"), AppRequestHandler._delete_event),
    (re.compile(r"^/api/schedules/(\d+)$"), AppRequestHandler._delete_event),
    (re.compile(r"^/api/notes/(\d+)$"), AppRequestHandler._delete_note),
    (re.compile(r"^/api/resources/(\d+)$"), AppRequestHandler._delete_resource),
    (re.compile(r"^/api/courses/(\d+)$"), AppRequestHandler._delete_course),
    (re.compile(r"^/api/lecturers/(\d+)$"), AppRequestHandler._delete_lecturer),
    (re.compile(r"^/api/budgets/(\d+)$"), AppRequestHandler._delete_budget),
    (re.compile(r"^/api/expenses/(\d+)$"), AppRequestHandler._delete_expense),
    (re.compile(r"^/api/incomes/(\d+)$"), AppRequestHandler._delete_income),
    (re.compile(r"^/api/study-logs/(\d+)$"), AppRequestHandler._delete_study_log),
]


def run_server():
    """Initializes DB and runs Python's built-in HTTP server."""
    db.init_db()
    server_address = ("", PORT)
    httpd = http.server.HTTPServer(server_address, AppRequestHandler)
    print(f"==========================================================")
    print(f"🚀 Daily Rhythm App is running live on: http://localhost:{PORT}")
    print(f"==========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server gracefully.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()

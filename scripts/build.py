#!/usr/bin/env python3
"""Bundle the modular static assets into single files.

Why: the app shipped 13 CSS + 13 JS files served over HTTP/1.1 (Python's
http.server has no HTTP/2). Render-blocking CSS fans out into ~3 round-trip
waves on mobile before first paint. One bundle per type fixes it; the modular
files under static/css and static/js stay the source of truth.

Usage:
    python3 scripts/build.py

Regenerate after editing any module. If the *bundle content* changes, bump the
`?v=` query in both static/index.html and static/sw.js (Netlify serves
/css/* and /js/* with Cache-Control: immutable for a year, so the version
string is the only cache-buster).
"""

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Order matters: it mirrors the <link>/<script> order in static/index.html,
# which encodes the dependency order (UI/API first, App last).
CSS = [
    "landing", "variables", "base", "layout", "components", "dashboard",
    "habits_tasks", "schedule", "notes", "curriculum", "budget", "modals",
    "responsive",
]
JS = [
    "ui", "api", "auth", "dashboard", "habits", "tasks", "schedule", "notes",
    "curriculum", "budget", "command_palette", "timer", "app",
]


def bundle(folder: str, names: list[str], out_name: str) -> int:
    parts = []
    for name in names:
        path = os.path.join(ROOT, "static", folder, f"{name}.{folder}")
        with open(path, encoding="utf-8") as f:
            parts.append(f"/* ===== {name}.{folder} ===== */\n" + f.read())
    out = os.path.join(ROOT, "static", folder, out_name)
    blob = "\n\n".join(parts) + "\n"
    with open(out, "w", encoding="utf-8") as f:
        f.write(blob)
    return len(blob.encode("utf-8"))


if __name__ == "__main__":
    # bundle.* names avoid colliding with the source module static/js/app.js
    css_size = bundle("css", CSS, "bundle.css")
    js_size = bundle("js", JS, "bundle.js")
    print(f"static/css/bundle.css  {css_size / 1024:.1f} KB")
    print(f"static/js/bundle.js    {js_size / 1024:.1f} KB")
    print(f"Bundled {len(CSS)} CSS + {len(JS)} JS modules into 2 files.")

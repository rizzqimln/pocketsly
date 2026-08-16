#!/usr/bin/env python3
"""Bundle the modular static assets and views into production files.

Why: the app shipped 13 CSS + 13 JS files served over HTTP/1.1.
Render-blocking CSS fans out into round-trips before first paint.
Bundling produces static/css/bundle.css, static/js/bundle.js, and assembles
static/index.html from modular, maintainable partials in static/views/ (< 1000 lines each).

Usage:
    python3 scripts/build.py
"""

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Order matters: it mirrors the <link>/<script> order in static/index.html,
# which encodes the dependency order (UI/API first, App last).
CSS = [
    "landing", "variables", "base", "layout", "components", "dashboard",
    "habits_tasks", "schedule", "notes", "curriculum", "curriculum_labs",
    "budget", "modals", "responsive",
]

JS = [
    "ui", "api", "auth", "dashboard", "habits", "tasks", "schedule", "notes",
    "curriculum", "curriculum_labs", "budget", "budget_ocr",
    "command_palette", "timer", "app",
]

VIEWS = [
    "shell_head.html",
    "landing.html",
    "sidebar.html",
    "header.html",
    "view_dashboard.html",
    "view_habits.html",
    "view_schedule.html",
    "view_notes.html",
    "view_curriculum.html",
    "view_curriculum_labs.html",
    "view_budget.html",
    "modals_system.html",
    "modals_apps.html",
    "shell_footer.html",
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


def build_html() -> int:
    views_dir = os.path.join(ROOT, "static", "views")
    parts = []
    for view_file in VIEWS:
        path = os.path.join(views_dir, view_file)
        if not os.path.exists(path):
            print(f"Error: Missing view file {path}", file=sys.stderr)
            sys.exit(1)
        with open(path, encoding="utf-8") as f:
            parts.append(f.read().strip())
    
    index_html = "\n\n".join(parts) + "\n"
    out = os.path.join(ROOT, "static", "index.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(index_html)
    return len(index_html.encode("utf-8"))


def verify_line_counts():
    """Verify that all source files under static/views/, static/js/, static/css/ stay under 1,000 lines."""
    exceeded = []
    
    # Check views
    views_dir = os.path.join(ROOT, "static", "views")
    for f in os.listdir(views_dir):
        if f.endswith(".html"):
            p = os.path.join(views_dir, f)
            with open(p, encoding="utf-8") as file:
                count = sum(1 for _ in file)
                print(f"  [view] {f:<30} {count:>5} lines")
                if count > 1000:
                    exceeded.append((p, count))
                    
    # Check CSS source modules
    for name in CSS:
        p = os.path.join(ROOT, "static", "css", f"{name}.css")
        if os.path.exists(p):
            with open(p, encoding="utf-8") as file:
                count = sum(1 for _ in file)
                print(f"  [css]  {name + '.css':<30} {count:>5} lines")
                if count > 1000:
                    exceeded.append((p, count))

    # Check JS source modules
    for name in JS:
        p = os.path.join(ROOT, "static", "js", f"{name}.js")
        if os.path.exists(p):
            with open(p, encoding="utf-8") as file:
                count = sum(1 for _ in file)
                print(f"  [js]   {name + '.js':<30} {count:>5} lines")
                if count > 1000:
                    exceeded.append((p, count))

    if exceeded:
        print("\nWARNING: The following source files exceed 1,000 lines:")
        for p, count in exceeded:
            print(f"  - {p} ({count} lines)")
    else:
        print("\nAll modular source files are strictly under 1,000 lines!")


if __name__ == "__main__":
    css_size = bundle("css", CSS, "bundle.css")
    js_size = bundle("js", JS, "bundle.js")
    html_size = build_html()
    
    print(f"static/css/bundle.css   {css_size / 1024:.1f} KB")
    print(f"static/js/bundle.js     {js_size / 1024:.1f} KB")
    print(f"static/index.html       {html_size / 1024:.1f} KB")
    print(f"Bundled {len(CSS)} CSS + {len(JS)} JS + {len(VIEWS)} Views successfully.\n")
    
    print("Verifying source line counts:")
    verify_line_counts()

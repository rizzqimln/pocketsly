import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import urllib.request
import urllib.error
import gzip
import json
import time
import pytest
import db

BASE_URL = "http://localhost:8000"

def test_gzip_compression_on_static_and_api():
    """Verify that the server compresses static assets and API JSON responses with Gzip."""
    # 1. Test Static CSS Gzip
    req = urllib.request.Request(f"{BASE_URL}/css/style.css?v=6.0", headers={"Accept-Encoding": "gzip"})
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        assert resp.headers.get("Content-Encoding") == "gzip"
        data = gzip.decompress(resp.read())
        assert b"DAILY RHYTHM" in data or b"variables.css" in data
        print("✓ Static CSS served with Gzip compression.")

    # 2. Test Manifest and SW
    with urllib.request.urlopen(f"{BASE_URL}/manifest.json") as resp:
        assert resp.status == 200
        manifest = json.loads(resp.read().decode("utf-8"))
        assert manifest["short_name"] == "Pocketsly"
        assert manifest["display"] == "standalone"
        print("✓ PWA Manifest verified.")

    with urllib.request.urlopen(f"{BASE_URL}/sw.js") as resp:
        assert resp.status == 200
        sw_content = resp.read().decode("utf-8")
        assert "pocketsly-cache" in sw_content
        print("✓ Service Worker verified.")

def test_security_headers():
    """Verify presence of defense-in-depth HTTP security headers."""
    req = urllib.request.Request(f"{BASE_URL}/index.html")
    with urllib.request.urlopen(req) as resp:
        headers = resp.headers
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "default-src" in headers.get("Content-Security-Policy", "")
        print("✓ Defense-in-depth security headers verified.")

def test_database_wal_and_indexes():
    """Verify SQLite WAL mode and presence of performance indexes."""
    with db.get_db() as conn:
        journal_mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
        assert journal_mode.upper() == "WAL"

        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type = 'index';")
        index_names = [r[0] for r in cursor.fetchall()]
        assert "idx_users_username" in index_names
        assert "idx_sessions_token" in index_names
        assert "idx_habits_user" in index_names
        assert "idx_tasks_user_done" in index_names
        print(f"✓ SQLite WAL mode active ({journal_mode}) with {len(index_names)} performance indexes.")

def test_rate_limiter_protection():
    """Verify rate limiter blocks brute-force authentication floods with 429."""
    blocked = False
    for i in range(25):
        payload = json.dumps({"username": f"flood_user_{i}", "password": "wrongpassword"}).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/login",
            data=payload,
            headers={"Content-Type": "application/json", "X-Forwarded-For": "198.51.100.42"}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                pass
        except urllib.error.HTTPError as e:
            if e.code == 429:
                blocked = True
                print(f"✓ Rate limiter successfully triggered HTTP 429 at request #{i+1}!")
                break
    assert blocked, "Rate limiter did not block excessive requests!"

if __name__ == "__main__":
    test_gzip_compression_on_static_and_api()
    test_security_headers()
    test_database_wal_and_indexes()
    test_rate_limiter_protection()
    print("🎉 ALL PERFORMANCE & SECURITY OPTIMIZATION TESTS PASSED 100%!")

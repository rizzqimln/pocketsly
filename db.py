"""
DATABASE MODULE (db.py)
=======================
LEARN: This module manages interactions with the SQLite database using Python's 
built-in 'sqlite3' module.

Key Concepts:
1. Connection Management: Always close DB connections or use context managers ('with').
2. Parameterized Queries: Using '?' placeholders prevents SQL Injection attacks.
3. Row Factory: 'sqlite3.Row' allows accessing column values by name like Python dicts.
"""

import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "daily_app.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")


@contextmanager
def get_db():
    """
    Context manager for database connections with WAL mode and high-performance PRAGMAs.
    Usage:
        with get_db() as db:
            db.execute(...)
    LEARN: Context managers ('with' statement) automatically handle setup and cleanup.
    If an error occurs, it rolls back changes; otherwise, it commits transactions automatically.
    """
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    # Enable foreign key constraints and high-performance concurrency in SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA cache_size = -64000;")
    conn.execute("PRAGMA temp_store = MEMORY;")
    # Return rows as dict-like objects rather than raw tuples
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """
    Reads schema.sql and creates tables if they don't already exist.
    Called once when the server starts up.
    """
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Schema file not found at {SCHEMA_PATH}")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with get_db() as db:
        # executeScript handles multiple SQL statements separated by semicolons
        db.executescript(schema_sql)
        # Migration: add category column to resources if it doesn't exist
        try:
            db.execute("SELECT category FROM resources LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE resources ADD COLUMN category TEXT DEFAULT 'general'")
        # Migration: add progress column to courses if it doesn't exist
        try:
            db.execute("SELECT progress FROM courses LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE courses ADD COLUMN progress INTEGER DEFAULT 0")
        # Migration: add security_pin column to users if it doesn't exist
        try:
            db.execute("SELECT security_pin FROM users LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE users ADD COLUMN security_pin TEXT DEFAULT '123456'")
        # Migration: add email column to users if it doesn't exist
        try:
            db.execute("SELECT email FROM users LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE users ADD COLUMN email TEXT")
        # Migration: add phone column to users if it doesn't exist
        try:
            db.execute("SELECT phone FROM users LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        # Migration: add otp_code column to users if it doesn't exist
        try:
            db.execute("SELECT otp_code FROM users LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE users ADD COLUMN otp_code TEXT")
        # Migration: add otp_expires_at column to users if it doesn't exist
        try:
            db.execute("SELECT otp_expires_at FROM users LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE users ADD COLUMN otp_expires_at DATETIME")
        # Migration: add wallet column to incomes if it doesn't exist
        try:
            db.execute("SELECT wallet FROM incomes LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE incomes ADD COLUMN wallet TEXT DEFAULT 'Cash'")
        # Migration: add recurring column to incomes if it doesn't exist
        try:
            db.execute("SELECT recurring FROM incomes LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE incomes ADD COLUMN recurring TEXT DEFAULT 'none'")
        # Migration: add wallet column to expenses if it doesn't exist
        try:
            db.execute("SELECT wallet FROM expenses LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE expenses ADD COLUMN wallet TEXT DEFAULT 'Cash'")
        # Migration: add currency column to users if it doesn't exist
        try:
            db.execute("SELECT currency FROM users LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'IDR'")
        # Migration: add citation columns to resources if they don't exist
        try:
            db.execute("SELECT year FROM resources LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE resources ADD COLUMN year TEXT")
        try:
            db.execute("SELECT publisher FROM resources LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE resources ADD COLUMN publisher TEXT")
        try:
            db.execute("SELECT doi FROM resources LIMIT 1")
        except sqlite3.OperationalError:
            db.execute("ALTER TABLE resources ADD COLUMN doi TEXT")
    print("✓ Database initialized successfully.")


def query_all(sql, params=()):
    """Helper to run SELECT queries returning multiple rows as lists of dicts."""
    with get_db() as db:
        cursor = db.execute(sql, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def query_one(sql, params=()):
    """Helper to run SELECT queries returning a single row as a dict, or None."""
    with get_db() as db:
        cursor = db.execute(sql, params)
        row = cursor.fetchone()
        return dict(row) if row else None


def execute(sql, params=()):
    """
    Helper for INSERT, UPDATE, DELETE statements.
    Returns the lastrowid (useful for getting the ID of a newly inserted record).
    """
    with get_db() as db:
        cursor = db.execute(sql, params)
        return cursor.lastrowid

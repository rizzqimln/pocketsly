"""
DATABASE MODULE (db.py) — PostgreSQL
====================================
LEARN: This module manages interactions with the PostgreSQL database using the
'psycopg' driver (the de-facto standard PostgreSQL adapter for Python).

Key Concepts:
1. Connection Management: Always close DB connections or use context managers ('with').
2. Parameterized Queries: Using '%s' placeholders prevents SQL Injection attacks.
3. Row Factory: 'dict_row' returns rows as dicts so columns are accessed by name.

Production deployment (Supabase / Render / any Postgres host):
    export DATABASE_URL="postgresql://user:password@host:5432/database"
"""

import os
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row

# Supabase / any PostgreSQL connection string. Cloud hosts inject DATABASE_URL;
# local default assumes a Postgres on localhost for development.
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/pocketsly",
)
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")


@contextmanager
def get_db():
    """
    Context manager for PostgreSQL connections.
    Usage:
        with get_db() as db:
            db.execute(...)
    LEARN: Context managers ('with' statement) automatically handle setup and cleanup.
    If an error occurs, it rolls back changes; otherwise, it commits transactions automatically.
    """
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _column_exists(db, table: str, column: str) -> bool:
    """Returns True if a column exists in a table (used by schema migrations)."""
    try:
        db.execute(f"SELECT {column} FROM {table} LIMIT 1")
        return True
    except psycopg.errors.UndefinedColumn:
        return False


def init_db():
    """
    Applies schema.sql (CREATE TABLE IF NOT EXISTS) plus idempotent migrations
    for databases created by older schema versions. Called once at startup.
    """
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Schema file not found at {SCHEMA_PATH}")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with get_db() as db:
        # psycopg runs multi-statement scripts via PostgreSQL's simple query protocol
        db.execute(schema_sql)
        # Idempotent migrations: add columns added after the original schema
        migrations = [
            ("resources", "category", "TEXT DEFAULT 'general'"),
            ("courses", "progress", "INTEGER DEFAULT 0"),
            ("users", "security_pin", "TEXT DEFAULT '123456'"),
            ("users", "email", "TEXT"),
            ("users", "phone", "TEXT"),
            ("users", "otp_code", "TEXT"),
            ("users", "otp_expires_at", "TEXT"),
            ("incomes", "wallet", "TEXT DEFAULT 'Cash'"),
            ("incomes", "recurring", "TEXT DEFAULT 'none'"),
            ("expenses", "wallet", "TEXT DEFAULT 'Cash'"),
            ("users", "currency", "TEXT DEFAULT 'IDR'"),
            ("resources", "year", "TEXT"),
            ("resources", "publisher", "TEXT"),
            ("resources", "doi", "TEXT"),
        ]
        for table, column, column_ddl in migrations:
            if not _column_exists(db, table, column):
                db.execute(f"ALTER TABLE {table} ADD COLUMN {column} {column_ddl}")
    print("✓ Database initialized successfully.")


def query_all(sql, params=()):
    """Helper to run SELECT queries returning multiple rows as lists of dicts."""
    with get_db() as db:
        cursor = db.execute(sql, params)
        return cursor.fetchall()


def query_one(sql, params=()):
    """Helper to run SELECT queries returning a single row as a dict, or None."""
    with get_db() as db:
        cursor = db.execute(sql, params)
        row = cursor.fetchone()
        return dict(row) if row else None


def execute(sql, params=()):
    """
    Helper for INSERT, UPDATE, DELETE statements.
    Returns the cursor; the transaction commits when the context manager exits.
    """
    with get_db() as db:
        return db.execute(sql, params)


def insert(sql, params=()):
    """
    Helper for INSERT statements that need the new primary key back.
    Appends 'RETURNING id' so the ID is fetched in the same round-trip
    (the PostgreSQL equivalent of SQLite's cursor.lastrowid).
    """
    with get_db() as db:
        cursor = db.execute(sql + " RETURNING id", params)
        row = cursor.fetchone()
        return row["id"] if row else None

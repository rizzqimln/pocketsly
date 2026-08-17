"""
AUTHENTICATION & SECURITY MODULE (auth.py)
==========================================
LEARN: Security Fundamentals
1. Password Hashing: NEVER store plain-text passwords. We use PBKDF2 (Password-Based Key
   Derivation Function 2) with HMAC-SHA256 and 100,000 iterations + random salt.
2. Cryptographic Salt: A unique random string per user prevents Rainbow Table attacks.
3. Session Tokens: Cryptographically secure random tokens stored in database & HTTP cookies.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
import db

# Configurable session lifetime (e.g. 7 days)
SESSION_DURATION_DAYS = 7


def hash_password(password: str, salt_hex: str = None) -> tuple[str, str]:
    """
    Hashes a password using PBKDF2-HMAC-SHA256.
    If salt is not provided, a new random 16-byte salt is generated.
    Returns: (password_hash_hex, salt_hex)
    """
    if salt_hex is None:
        salt = os.urandom(16)
        salt_hex = salt.hex()
    else:
        salt = bytes.fromhex(salt_hex)

    # LEARN: pbkdf2_hmac takes (hash_name, password_bytes, salt_bytes, iterations)
    # 100,000 iterations makes brute-force attacks computationally expensive for attackers.
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return key.hex(), salt_hex


def register_user(username: str, password: str, email: str = None, phone: str = None, security_pin: str = "123456") -> dict:
    """
    Registers a new user with optional email and phone for account recovery.
    Returns dict with user details on success, or raises ValueError if validation fails.
    """
    username = username.strip().lower()
    if not username or len(username) < 3:
        raise ValueError("Username must be at least 3 characters long.")
    if not password or len(password) < 6:
        raise ValueError("Password must be at least 6 characters long.")

    email = email.strip().lower() if email else None
    phone = phone.strip() if phone else None
    security_pin = str(security_pin).strip() if security_pin else "123456"

    # Check if username exists
    existing = db.query_one("SELECT id FROM users WHERE username = %s", (username,))
    if existing:
        raise ValueError("Username is already taken.")

    # Hash password with a fresh salt
    pwd_hash, salt_hex = hash_password(password)

    user_id = db.insert(
        "INSERT INTO users (username, password_hash, salt, email, phone, security_pin) VALUES (%s, %s, %s, %s, %s, %s)",
        (username, pwd_hash, salt_hex, email, phone, security_pin)
    )

    return {"id": user_id, "username": username, "email": email, "phone": phone, "currency": "IDR"}


def login_user(username: str, password: str) -> str:
    """
    Authenticates user and returns a new session token string.
    Raises ValueError on invalid credentials.
    """
    username = username.strip().lower()
    user = db.query_one("SELECT * FROM users WHERE username = %s", (username,))
    if not user:
        raise ValueError("Invalid username or password.")

    # Hash the provided password with the stored salt
    pwd_hash, _ = hash_password(password, user["salt"])

    # Constant-time comparison prevents timing attacks
    if not secrets.compare_digest(pwd_hash, user["password_hash"]):
        raise ValueError("Invalid username or password.")

    # Generate cryptographically secure session token
    token = secrets.token_hex(32)
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = (now_utc + timedelta(days=SESSION_DURATION_DAYS)).strftime("%Y-%m-%d %H:%M:%S")

    db.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (%s, %s, %s)",
        (token, user["id"], expires_at)
    )

    return token


def request_password_otp(username_or_email: str) -> dict:
    """
    Generates a 6-digit OTP code for password reset and saves it to the user's record.
    The code is written to the server log (dev-only backend) and is NEVER returned
    in the API response.
    """
    query = username_or_email.strip().lower()
    if not query:
        raise ValueError("Username or Email is required to request OTP.")

    user = db.query_one("SELECT * FROM users WHERE LOWER(username) = %s OR LOWER(email) = %s", (query, query))
    if not user:
        raise ValueError("No account found with provided Username or Email.")

    # Generate 6-digit numeric OTP code
    otp_code = str(secrets.randbelow(900000) + 100000)
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    expires_at = (now_utc + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")

    db.execute(
        "UPDATE users SET otp_code = %s, otp_expires_at = %s WHERE id = %s",
        (otp_code, expires_at, user["id"])
    )

    user_email = user["email"] or f"{user['username']}@app.local"
    # Dev-only delivery: log the code. Do NOT echo it back to the client.
    print(f"[request-password-otp] recovery code for {user['username']}: {otp_code} (valid 15 min)")
    return {
        "success": True,
        "username": user["username"],
        "email": user_email,
        "message": f"OTP code sent to {user_email}"
    }


def reset_password(username: str, recovery_contact: str, new_password: str, otp_code: str = None) -> bool:
    """
    Resets user password after verifying the OTP code. OTP is mandatory; there is
    no recovery_contact / security_pin fallback (that path was removed — see
    remediation plan). Generates a fresh cryptographic salt, re-hashes with
    PBKDF2, and purges all active sessions.
    Raises ValueError on invalid OTP or weak new password.
    """
    username = username.strip().lower()
    if not username:
        raise ValueError("Username or Email is required.")

    user = db.query_one("SELECT * FROM users WHERE LOWER(username) = %s OR LOWER(email) = %s", (username, username))
    if not user:
        raise ValueError("Invalid account or recovery credentials.")

    provided_otp = str(otp_code).strip() if otp_code else ""
    stored_otp = (user["otp_code"] or "").strip()
    expires_str = user["otp_expires_at"]

    if not stored_otp or not expires_str:
        raise ValueError("No active OTP request found. Please request a new OTP.")

    expires = datetime.strptime(expires_str, "%Y-%m-%d %H:%M:%S")
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if now_utc > expires:
        raise ValueError("OTP code has expired. Please request a new code.")

    if not provided_otp or not secrets.compare_digest(provided_otp, stored_otp):
        raise ValueError("Invalid OTP code. Please check your email or request a new code.")

    new_password = str(new_password).strip()
    if not new_password or len(new_password) < 6:
        raise ValueError("New password must be at least 6 characters long.")

    # Generate fresh cryptographic salt & PBKDF2 hash
    pwd_hash, salt_hex = hash_password(new_password)

    # Update credentials in database & clear OTP
    db.execute(
        "UPDATE users SET password_hash = %s, salt = %s, otp_code = NULL, otp_expires_at = NULL WHERE id = %s",
        (pwd_hash, salt_hex, user["id"])
    )

    # Invalidate all active sessions for security
    db.execute("DELETE FROM sessions WHERE user_id = %s", (user["id"],))

    return True


def get_user_from_session(token: str) -> dict:
    """
    Validates a session token and returns user details if valid and not expired.
    Returns None if session is invalid or expired.
    """
    if not token:
        return None

    sql = """
        SELECT u.id, u.username, u.email, u.phone, u.currency, s.expires_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = %s
    """
    session = db.query_one(sql, (token,))
    if not session:
        return None

    # Check expiration
    expires = datetime.strptime(session["expires_at"], "%Y-%m-%d %H:%M:%S")
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if now_utc > expires:
        # Session expired - delete it
        db.execute("DELETE FROM sessions WHERE token = %s", (token,))
        return None

    return {
        "id": session["id"],
        "username": session["username"],
        "email": session["email"],
        "phone": session["phone"],
        "currency": session["currency"] or "IDR"
    }


def logout_session(token: str):
    """Deletes a session token from database on user logout."""
    if token:
        db.execute("DELETE FROM sessions WHERE token = %s", (token,))

/**
 * AUTHENTICATION & SECURITY MODULE (_auth.js)
 * ============================================
 * Uses standard Web Crypto API (crypto.subtle) for PBKDF2-HMAC-SHA256
 * and cryptographically secure random token generation.
 * 
 * 100% Vendor-neutral, zero external dependencies.
 */

import { queryOne, execute, insert } from './_db.js';

export const SESSION_DURATION_DAYS = 7;

// ── Web Crypto Helpers ────────────────────────────────────────────────────────

function bytesToHex(uint8Array) {
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time string equality check to prevent timing attacks.
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hashes a password using PBKDF2-HMAC-SHA256 (100,000 iterations).
 * @param {string} password 
 * @param {string|null} saltHex 
 * @returns {Promise<{ hash: string, salt: string }>}
 */
export async function hashPassword(password, saltHex = null) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const encodedPassword = new TextEncoder().encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    encodedPassword,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  return {
    hash: bytesToHex(new Uint8Array(derivedBits)),
    salt: bytesToHex(salt)
  };
}

/**
 * Formats a Date object as 'YYYY-MM-DD HH:MM:SS' in UTC.
 */
export function formatUtcDateTime(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

// ── Auth Operations ───────────────────────────────────────────────────────────

/**
 * Registers a new user account.
 */
export async function registerUser(db, { username, password, email, phone, security_pin }) {
  username = (username || '').trim().toLowerCase();
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanPhone = phone ? phone.trim() : null;
  const cleanPin = security_pin ? String(security_pin).trim() : '123456';

  const existing = await queryOne(db, 'SELECT id FROM users WHERE username = ?1', [username]);
  if (existing) {
    throw new Error('Username is already taken.');
  }

  const { hash, salt } = await hashPassword(password);
  const nowStr = formatUtcDateTime();

  const userId = await insert(
    db,
    'INSERT INTO users (username, password_hash, salt, email, phone, security_pin, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
    [username, hash, salt, cleanEmail, cleanPhone, cleanPin, nowStr]
  );

  return {
    id: userId,
    username,
    email: cleanEmail,
    phone: cleanPhone,
    currency: 'IDR'
  };
}

/**
 * Authenticates user credentials and creates a session token.
 */
export async function loginUser(db, username, password) {
  username = (username || '').trim().toLowerCase();
  const user = await queryOne(db, 'SELECT * FROM users WHERE username = ?1', [username]);
  if (!user) {
    throw new Error('Invalid username or password.');
  }

  const { hash } = await hashPassword(password, user.salt);
  if (!timingSafeEqual(hash, user.password_hash)) {
    throw new Error('Invalid username or password.');
  }

  // Generate 32-byte (64 hex chars) secure random token
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToHex(tokenBytes);

  const expiresDate = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const expiresAt = formatUtcDateTime(expiresDate);
  const nowStr = formatUtcDateTime();

  await execute(
    db,
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)',
    [token, user.id, nowStr, expiresAt]
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      currency: user.currency || 'IDR'
    }
  };
}

/**
 * Retrieves the authenticated user from a session cookie token.
 * Expired sessions are deleted on read so the sessions table stays tidy.
 */
export async function getUserFromSession(db, token) {
  if (!token) return null;
  const nowStr = formatUtcDateTime();

  const session = await queryOne(
    db,
    'SELECT s.expires_at, u.id, u.username, u.email, u.phone, u.currency FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?1',
    [token]
  );

  if (!session) return null;
  if (session.expires_at <= nowStr) {
    await execute(db, 'DELETE FROM sessions WHERE token = ?1', [token]);
    return null;
  }
  return {
    id: session.id,
    username: session.username,
    email: session.email,
    phone: session.phone,
    currency: session.currency || 'IDR'
  };
}

/**
 * Invalidates every session belonging to a user (used after a password change).
 */
export async function purgeUserSessions(db, userId) {
  await execute(db, 'DELETE FROM sessions WHERE user_id = ?1', [userId]);
}

/**
 * Logs out and revokes a session token.
 */
export async function logoutUser(db, token) {
  if (!token) return;
  await execute(db, 'DELETE FROM sessions WHERE token = ?1', [token]);
}

/**
 * Sends the OTP by email via the Brevo API when a provider is configured.
 * Returns true when the email was delivered.
 */
function parseSender(from) {
  const m = String(from || '').match(/^([^<]*)<([^>]+)>/);
  if (m) return { name: m[1].trim() || 'Pocketsly', email: m[2].trim() };
  return { name: 'Pocketsly', email: String(from || '').trim() };
}

async function sendOtpEmail(env, to, otpCode) {
  const apiKey = env?.BREVO_API_KEY;
  const from = env?.MAIL_FROM;
  if (!apiKey || !from || !to) return false;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      sender: parseSender(from),
      to: [{ email: to }],
      subject: 'Pocketsly password reset code',
      textContent: `Your Pocketsly verification code is ${otpCode}. It expires in 15 minutes.`
    })
  });
  return res.ok;
}

/**
 * Requests an OTP code for password recovery.
 * The code is sent to the user's email — it is NEVER returned in the response.
 */
export async function requestPasswordOtp(db, usernameOrEmail, env = {}) {
  const query = (usernameOrEmail || '').trim().toLowerCase();
  const user = await queryOne(
    db,
    'SELECT id, username, email FROM users WHERE username = ?1 OR email = ?2',
    [query, query]
  );

  if (!user) {
    throw new Error('Account with that username or email was not found.');
  }

  // 6-digit OTP
  const randomArr = new Uint32Array(1);
  crypto.getRandomValues(randomArr);
  const otpCode = String(100000 + (randomArr[0] % 900000));

  const expiresDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const expiresAt = formatUtcDateTime(expiresDate);

  await execute(
    db,
    'UPDATE users SET otp_code = ?1, otp_expires_at = ?2 WHERE id = ?3',
    [otpCode, expiresAt, user.id]
  );

  if (!user.email) {
    throw new Error('This account has no email on file, so a recovery code cannot be sent.');
  }

  const sent = await sendOtpEmail(env, user.email, otpCode);
  if (!sent) {
    throw new Error(
      'Email delivery is not configured. Set BREVO_API_KEY and MAIL_FROM in the Pages project to enable password recovery.'
    );
  }

  return {
    success: true,
    message: 'A recovery code was sent to your registered email (valid for 15 minutes).'
  };
}

/**
 * Resets user password using the OTP code.
 */
export async function resetPasswordWithOtp(db, { username, otp_code, new_password }) {
  const userQuery = (username || '').trim().toLowerCase();
  const user = await queryOne(
    db,
    'SELECT * FROM users WHERE username = ?1 OR email = ?2',
    [userQuery, userQuery]
  );

  if (!user) {
    throw new Error('User not found.');
  }

  if (!user.otp_code || !user.otp_expires_at) {
    throw new Error('No active OTP request found. Please request a new OTP.');
  }

  const nowStr = formatUtcDateTime();
  if (user.otp_expires_at < nowStr) {
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (!timingSafeEqual(String(user.otp_code).trim(), String(otp_code).trim())) {
    throw new Error('Invalid OTP code.');
  }

  if (!new_password || new_password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { hash, salt } = await hashPassword(new_password);

  await execute(
    db,
    'UPDATE users SET password_hash = ?1, salt = ?2, otp_code = NULL, otp_expires_at = NULL WHERE id = ?3',
    [hash, salt, user.id]
  );

  // Invalidate all existing sessions on password reset
  await purgeUserSessions(db, user.id);

  return {
    success: true,
    message: 'Password reset successfully! You can now log in.'
  };
}

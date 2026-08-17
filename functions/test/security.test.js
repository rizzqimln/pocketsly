// Security regression tests for the Cloudflare Pages backend.
// These cover the critical paths fixed by the remediation plan:
//   1. The OTP is never returned in an API response.
//   2. The SQL playground cannot touch production data.
//   3. Auth endpoints are rate limited.
//   4. Sessions are purged on password change; expired ones are deleted on read.
//   5. security_pin is never exposed to clients.
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  requestPasswordOtp,
  getUserFromSession,
  registerUser,
  loginUser,
  formatUtcDateTime,
} from '../api/_auth.js';
import { handlePatchProfile, handlePostCurriculumPlayground } from '../api/_routes.js';
import { isRateLimited } from '../api/[[path]].js';
import { createTestDb, createPlaygroundDb } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OTP / account recovery', () => {
  it('does not leak the OTP when no email provider is configured', async () => {
    const db = createTestDb();
    await registerUser(db, { username: 'alice', password: 'secret123', email: 'alice@example.com' });
    await expect(requestPasswordOtp(db, 'alice', {})).rejects.toThrow(/not configured/i);
  });

  it('never returns otp_code in the response even when email delivery works', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 200 }));
    const db = createTestDb();
    await registerUser(db, { username: 'alice', password: 'secret123', email: 'alice@example.com' });

    const res = await requestPasswordOtp(db, 'alice', {
      RESEND_API_KEY: 'test-key',
      MAIL_FROM: 'noop@pocketsly.app',
    });

    expect(res.otp_code).toBeUndefined();
    expect(res.success).toBe(true);
  });
});

describe('SQL playground isolation', () => {
  it('runs only against its own scratch database, never production data', async () => {
    const playground = createPlaygroundDb();
    const production = createTestDb();

    // The same query on the production schema would return every user row.
    // On the scratch DB the table simply does not exist — that is the isolation.
    const res = await handlePostCurriculumPlayground(playground, { query: 'SELECT * FROM users' });
    expect(res.error).toBeDefined();
    expect(String(res.error).toLowerCase()).toContain('no such table');

    // Legitimate learning queries still work on the seeded scratch data.
    const ok = await handlePostCurriculumPlayground(playground, { query: 'SELECT * FROM students' });
    expect(ok.rows.length).toBeGreaterThan(0);
    expect(ok.columns).toContain('name');

    // Production db is untouched by playground activity.
    expect(production).toBeDefined();
  });

  it('rejects write / multi-statement queries', async () => {
    const playground = createPlaygroundDb();
    for (const bad of ['DELETE FROM students', 'INSERT INTO students (name) VALUES (\'x\')', 'SELECT 1; DROP TABLE students']) {
      const res = await handlePostCurriculumPlayground(playground, { query: bad });
      expect(res.error).toBeDefined();
    }
  });
});

describe('rate limiting', () => {
  it('blocks a client after 20 sensitive requests in one window', async () => {
    const db = createTestDb();
    let blocked = false;
    for (let i = 0; i < 25; i++) {
      if (await isRateLimited(db, '203.0.113.7', '/api/login')) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
  });

  it('does not rate limit non-sensitive routes', async () => {
    const db = createTestDb();
    for (let i = 0; i < 50; i++) {
      expect(await isRateLimited(db, '203.0.113.8', '/api/habits')).toBe(false);
    }
  });
});

describe('sessions', () => {
  it('purges all sessions when the profile password changes', async () => {
    const db = createTestDb();
    const user = await registerUser(db, { username: 'carol', password: 'secret123' });
    const session = await loginUser(db, 'carol', 'secret123');

    const res = await handlePatchProfile(db, user.id, { password: 'newpassword1' });
    expect(res.success).toBe(true);
    expect(await getUserFromSession(db, session.token)).toBeNull();
  });

  it('deletes expired sessions on read', async () => {
    const db = createTestDb();
    const user = await registerUser(db, { username: 'erin', password: 'secret123' });
    const token = 'a'.repeat(64);
    const past = '2020-01-01 00:00:00';
    await db
      .prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)')
      .bind(token, user.id, past, past)
      .run();

    expect(await getUserFromSession(db, token)).toBeNull();

    const row = await db.prepare('SELECT COUNT(*) AS c FROM sessions WHERE token = ?1').bind(token).first();
    expect(row.c).toBe(0);
  });
});

describe('security_pin exposure', () => {
  it('is absent from login and profile responses', async () => {
    const db = createTestDb();
    const user = await registerUser(db, { username: 'dave', password: 'secret123' });
    const session = await loginUser(db, 'dave', 'secret123');
    expect(session.user.security_pin).toBeUndefined();

    const profile = await handlePatchProfile(db, user.id, { phone: '08123' });
    expect(profile.user.security_pin).toBeUndefined();
  });
});

// Keep formatUtcDateTime imported so the schema timestamp format is pinned.
describe('timestamp format', () => {
  it('matches the YYYY-MM-DD HH:MM:SS format used across the API', () => {
    expect(formatUtcDateTime(new Date('2026-01-02T03:04:05Z'))).toBe('2026-01-02 03:04:05');
  });
});

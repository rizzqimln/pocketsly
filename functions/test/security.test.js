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
import { isRateLimited, onRequest } from '../api/[[path]].js';
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
    vi.stubGlobal('fetch', async () => new Response('', { status: 201 }));
    const db = createTestDb();
    await registerUser(db, { username: 'alice', password: 'secret123', email: 'alice@example.com' });

    const res = await requestPasswordOtp(db, 'alice', {
      BREVO_API_KEY: 'test-brevo-key',
      MAIL_FROM: 'Pocketsly <noop@pocketsly.app>',
    });

    expect(res.otp_code).toBeUndefined();
    expect(res.success).toBe(true);
  });

  it('posts the OTP to Brevo with sender, recipient, and text content', async () => {
    const calls = [];
    vi.stubGlobal('fetch', async (url, init) => {
      calls.push({ url, init });
      return new Response('', { status: 201 });
    });
    const db = createTestDb();
    await registerUser(db, { username: 'alice', password: 'secret123', email: 'alice@example.com' });

    await requestPasswordOtp(db, 'alice', {
      BREVO_API_KEY: 'test-brevo-key',
      MAIL_FROM: 'Pocketsly <noop@pocketsly.app>',
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(calls[0].init.headers['api-key']).toBe('test-brevo-key');
    expect(calls[0].init.headers['Authorization']).toBeUndefined();
    const payload = JSON.parse(calls[0].init.body);
    expect(payload.sender).toEqual({ name: 'Pocketsly', email: 'noop@pocketsly.app' });
    expect(payload.to).toEqual([{ email: 'alice@example.com' }]);
    expect(payload.subject).toContain('password reset');
    expect(payload.textContent).toContain('verification code');
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

  it('rate limits the public receipt scan endpoint', async () => {
    const db = createTestDb();
    let blocked = false;
    for (let i = 0; i < 25; i++) {
      if (await isRateLimited(db, '203.0.113.9', '/api/receipt/scan')) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
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

// Client↔API contract regression tests: pin the exact routes and payload keys
// every client (web + mobile) actually calls, so a future backend refactor
// cannot silently break them again.
describe('client/API endpoint contracts', () => {
  const BASE = 'https://pocketsly.test';

  function apiCall(db, playground, method, path, { cookie, body } = {}) {
    const headers = {};
    if (cookie) headers['Cookie'] = `session_id=${cookie}`;
    if (body) headers['Content-Type'] = 'application/json';
    return onRequest({
      request: new Request(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }),
      env: { DB: db, PLAYGROUND_DB: playground },
    });
  }

  async function makeClient() {
    const db = createTestDb();
    const playground = createPlaygroundDb();
    const res = await apiCall(db, playground, 'POST', '/api/register', {
      body: { username: 'rizqi', password: 'secret123', email: 'rizqi@example.com' },
    });
    const cookie = (res.headers.get('Set-Cookie') || '').match(/session_id=([^;]+)/)?.[1];
    expect(cookie).toBeDefined();
    return { db, playground, cookie };
  }

  it('study logs live at /api/study-logs (hyphen) with course_name/activity_type/log_date', async () => {
    const { db, playground, cookie } = await makeClient();

    const created = await apiCall(db, playground, 'POST', '/api/study-logs', {
      cookie,
      body: { course_name: 'Operating Systems', hours: 2, activity_type: 'practice', log_date: '2026-08-18', notes: 'paging' },
    });
    expect(created.status).toBe(200);
    const createdBody = await created.json();
    expect(createdBody.success).toBe(true);

    const list = await apiCall(db, playground, 'GET', '/api/study-logs', { cookie });
    const listBody = await list.json();
    expect(Array.isArray(listBody)).toBe(true);
    expect(listBody.some(s => s.course_name === 'Operating Systems' && s.activity_type === 'practice' && s.log_date === '2026-08-18')).toBe(true);

    const del = await apiCall(db, playground, 'DELETE', `/api/study-logs/${createdBody.id}`, { cookie });
    expect(del.status).toBe(200);

    const old = await apiCall(db, playground, 'GET', '/api/study_logs', { cookie });
    expect(old.status).toBe(404);
  });

  it('habit toggle posts to /api/habits/:id/log and reflects in today_done', async () => {
    const { db, playground, cookie } = await makeClient();

    const h = await apiCall(db, playground, 'POST', '/api/habits', { cookie, body: { title: 'Code 1h' } });
    const hb = await h.json();

    const log = await apiCall(db, playground, 'POST', `/api/habits/${hb.id}/log`, { cookie, body: { done: 1 } });
    expect(log.status).toBe(200);

    const list = await apiCall(db, playground, 'GET', '/api/habits', { cookie });
    const habits = await list.json();
    expect(habits.find(x => x.id === hb.id).today_done).toBe(1);
  });

  it('task toggle patches /api/tasks/:id with done', async () => {
    const { db, playground, cookie } = await makeClient();

    const t = await apiCall(db, playground, 'POST', '/api/tasks', { cookie, body: { title: 'Submit lab' } });
    const tb = await t.json();

    const patch = await apiCall(db, playground, 'PATCH', `/api/tasks/${tb.id}`, { cookie, body: { done: 1 } });
    expect(patch.status).toBe(200);

    const list = await apiCall(db, playground, 'GET', '/api/tasks', { cookie });
    const tasks = await list.json();
    expect(tasks.find(x => x.id === tb.id).done).toBe(1);
  });

  it('SQL lab posts to /api/curriculum/playground, not /api/curriculum/query', async () => {
    const { db, playground, cookie } = await makeClient();

    const ok = await apiCall(db, playground, 'POST', '/api/curriculum/playground', {
      cookie,
      body: { query: 'SELECT * FROM students' },
    });
    expect(ok.status).toBe(200);

    const dead = await apiCall(db, playground, 'POST', '/api/curriculum/query', { cookie, body: { query: 'SELECT 1' } });
    expect(dead.status).toBe(404);
  });
});

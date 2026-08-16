/**
 * CLOUDFLARE PAGES EDGE API ROUTER (functions/api/[[path]].js)
 * =============================================================
 * 100% Native Serverless JavaScript Edge Router.
 * 
 * Replaces the Python backend entirely — runs directly on Cloudflare Edge
 * with Cloudflare D1 (Serverless SQLite) and Web Crypto API.
 */

import { initDb } from './_db.js';
import { getUserFromSession } from './_auth.js';
import * as routes from './_routes.js';

// ── Cookie Helpers ────────────────────────────────────────────────────────────

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

function buildSecurityHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...buildSecurityHeaders(),
      ...extraHeaders
    }
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ── Main Request Handler ──────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, ''); // Strip trailing slash
  const method = request.method.toUpperCase();

  // Handle CORS Preflight OPTIONS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Ensure D1 database binding is present
  const db = env.DB;
  if (!db) {
    return errorResponse('Cloudflare D1 Database binding (DB) is not configured. Please bind a D1 database named DB in your Cloudflare Pages dashboard.', 500);
  }

  // Idempotently initialize schema on request
  await initDb(db);

  // Extract Session Cookie and Authenticated User
  const cookies = parseCookies(request.headers.get('Cookie'));
  const sessionToken = cookies['session_id'] || null;
  const user = sessionToken ? await getUserFromSession(db, sessionToken) : null;

  // Extract Query Parameters
  const query = Object.fromEntries(url.searchParams.entries());

  // Parse JSON Body if applicable
  let body = {};
  if (method === 'POST' || method === 'PATCH') {
    try {
      const contentType = request.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      }
    } catch (e) {
      return errorResponse('Invalid JSON body', 400);
    }
  }

  try {
    // ── 1. PUBLIC ROUTES ────────────────────────────────────────────────────

    if (method === 'GET' && path === '/api/health') {
      return jsonResponse({ status: 'ok', service: 'cloudflare-d1-edge', version: '1.0.0', timestamp: Math.floor(Date.now() / 1000) });
    }

    if (method === 'GET' && path === '/api/session') {
      const res = await routes.handleSession(db, user);
      return jsonResponse(res);
    }

    if (method === 'POST' && path === '/api/register') {
      const res = await routes.handleRegister(db, body);
      const cookieVal = `session_id=${res.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}; Secure`;
      return jsonResponse({ success: true, user: res.user }, 200, { 'Set-Cookie': cookieVal });
    }

    if (method === 'POST' && path === '/api/login') {
      const res = await routes.handleLogin(db, body);
      const cookieVal = `session_id=${res.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}; Secure`;
      return jsonResponse({ success: true, user: res.user }, 200, { 'Set-Cookie': cookieVal });
    }

    if (method === 'POST' && path === '/api/logout') {
      const res = await routes.handleLogout(db, sessionToken);
      const cookieVal = `session_id=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      return jsonResponse(res, 200, { 'Set-Cookie': cookieVal });
    }

    if (method === 'POST' && path === '/api/request-otp') {
      const res = await routes.handleRequestOtp(db, body);
      return jsonResponse(res);
    }

    if (method === 'POST' && path === '/api/reset-password') {
      const res = await routes.handleResetPassword(db, body);
      return jsonResponse(res);
    }

    if (method === 'POST' && path === '/api/receipt/scan') {
      const res = await routes.handlePostReceiptScan(body);
      return jsonResponse(res);
    }

    // ── 2. AUTH GUARD FOR ALL SUBSEQUENT ROUTES ─────────────────────────────
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = user.id;

    // ── 3. GET ROUTES ───────────────────────────────────────────────────────
    if (method === 'GET') {
      if (path === '/api/dashboard') return jsonResponse(await routes.handleGetDashboard(db, userId));
      if (path === '/api/habits') return jsonResponse(await routes.handleGetHabits(db, userId));
      if (path === '/api/tasks') return jsonResponse(await routes.handleGetTasks(db, userId, query));
      if (path === '/api/events') return jsonResponse(await routes.handleGetEvents(db, userId));
      if (path === '/api/notes') return jsonResponse(await routes.handleGetNotes(db, userId));
      if (path === '/api/courses') return jsonResponse(await routes.handleGetCourses(db, userId));
      if (path === '/api/lecturers') return jsonResponse(await routes.handleGetLecturers(db, userId));
      if (path === '/api/study-logs') return jsonResponse(await routes.handleGetStudyLogs(db, userId));
      if (path === '/api/curriculum/schema') return jsonResponse(await routes.handleGetCurriculumSchema());
      if (path === '/api/budgets') return jsonResponse(await routes.handleGetBudgets(db, userId, query));
      if (path === '/api/expenses') return jsonResponse(await routes.handleGetExpenses(db, userId, query));
      if (path === '/api/incomes') return jsonResponse(await routes.handleGetIncomes(db, userId, query));
      if (path === '/api/budget/summary') return jsonResponse(await routes.handleGetBudgetSummary(db, userId, query));
      if (path === '/api/resources') return jsonResponse(await routes.handleGetResources(db, userId));
      if (path === '/api/backup/export') return jsonResponse(await routes.handleGetBackupExport(db, userId));

      // Regex / Param Routes
      const habitLogsMatch = path.match(/^\/api\/habits\/(\d+)\/logs$/);
      if (habitLogsMatch) {
        return jsonResponse(await routes.handleGetHabitLogs(db, userId, Number(habitLogsMatch[1])));
      }
    }

    // ── 4. POST ROUTES ──────────────────────────────────────────────────────
    if (method === 'POST') {
      if (path === '/api/habits') return jsonResponse(await routes.handlePostHabit(db, userId, body));
      if (path === '/api/tasks') return jsonResponse(await routes.handlePostTask(db, userId, body));
      if (path === '/api/events') return jsonResponse(await routes.handlePostEvent(db, userId, body));
      if (path === '/api/notes') return jsonResponse(await routes.handlePostNote(db, userId, body));
      if (path === '/api/courses') return jsonResponse(await routes.handlePostCourse(db, userId, body));
      if (path === '/api/lecturers') return jsonResponse(await routes.handlePostLecturer(db, userId, body));
      if (path === '/api/study-logs') return jsonResponse(await routes.handlePostStudyLog(db, userId, body));
      if (path === '/api/curriculum/playground') return jsonResponse(await routes.handlePostCurriculumPlayground(db, userId, body));
      if (path === '/api/budgets') return jsonResponse(await routes.handlePostBudget(db, userId, body));
      if (path === '/api/expenses') return jsonResponse(await routes.handlePostExpense(db, userId, body));
      if (path === '/api/incomes') return jsonResponse(await routes.handlePostIncome(db, userId, body));
      if (path === '/api/resources') return jsonResponse(await routes.handlePostResource(db, userId, body));
      if (path === '/api/backup/restore') return jsonResponse(await routes.handlePostBackupRestore(db, userId, body));

      // Param Routes
      const habitLogMatch = path.match(/^\/api\/habits\/(\d+)\/log$/);
      if (habitLogMatch) {
        return jsonResponse(await routes.handlePostHabitLog(db, userId, Number(habitLogMatch[1]), body));
      }
    }

    // ── 5. PATCH ROUTES ─────────────────────────────────────────────────────
    if (method === 'PATCH') {
      if (path === '/api/profile') return jsonResponse(await routes.handlePatchProfile(db, userId, body));

      const taskMatch = path.match(/^\/api\/tasks\/(\d+)$/);
      if (taskMatch) return jsonResponse(await routes.handlePatchTask(db, userId, Number(taskMatch[1]), body));

      const noteMatch = path.match(/^\/api\/notes\/(\d+)$/);
      if (noteMatch) return jsonResponse(await routes.handlePatchNote(db, userId, Number(noteMatch[1]), body));

      const courseMatch = path.match(/^\/api\/courses\/(\d+)$/);
      if (courseMatch) return jsonResponse(await routes.handlePatchCourse(db, userId, Number(courseMatch[1]), body));
    }

    // ── 6. DELETE ROUTES ────────────────────────────────────────────────────
    if (method === 'DELETE') {
      const habitMatch = path.match(/^\/api\/habits\/(\d+)$/);
      if (habitMatch) return jsonResponse(await routes.handleDeleteHabit(db, userId, Number(habitMatch[1])));

      const taskMatch = path.match(/^\/api\/tasks\/(\d+)$/);
      if (taskMatch) return jsonResponse(await routes.handleDeleteTask(db, userId, Number(taskMatch[1])));

      const eventMatch = path.match(/^\/api\/events\/(\d+)$/);
      if (eventMatch) return jsonResponse(await routes.handleDeleteEvent(db, userId, Number(eventMatch[1])));

      const noteMatch = path.match(/^\/api\/notes\/(\d+)$/);
      if (noteMatch) return jsonResponse(await routes.handleDeleteNote(db, userId, Number(noteMatch[1])));

      const courseMatch = path.match(/^\/api\/courses\/(\d+)$/);
      if (courseMatch) return jsonResponse(await routes.handleDeleteCourse(db, userId, Number(courseMatch[1])));

      const lecturerMatch = path.match(/^\/api\/lecturers\/(\d+)$/);
      if (lecturerMatch) return jsonResponse(await routes.handleDeleteLecturer(db, userId, Number(lecturerMatch[1])));

      const studyLogMatch = path.match(/^\/api\/study-logs\/(\d+)$/);
      if (studyLogMatch) return jsonResponse(await routes.handleDeleteStudyLog(db, userId, Number(studyLogMatch[1])));

      const budgetMatch = path.match(/^\/api\/budgets\/(\d+)$/);
      if (budgetMatch) return jsonResponse(await routes.handleDeleteBudget(db, userId, Number(budgetMatch[1])));

      const expenseMatch = path.match(/^\/api\/expenses\/(\d+)$/);
      if (expenseMatch) return jsonResponse(await routes.handleDeleteExpense(db, userId, Number(expenseMatch[1])));

      const incomeMatch = path.match(/^\/api\/incomes\/(\d+)$/);
      if (incomeMatch) return jsonResponse(await routes.handleDeleteIncome(db, userId, Number(incomeMatch[1])));

      const resourceMatch = path.match(/^\/api\/resources\/(\d+)$/);
      if (resourceMatch) return jsonResponse(await routes.handleDeleteResource(db, userId, Number(resourceMatch[1])));
    }

    return errorResponse(`Endpoint not found: ${method} ${path}`, 404);
  } catch (err) {
    console.error(`API Error [${method} ${path}]:`, err);
    return errorResponse(err.message || 'Internal Server Error', 400);
  }
}

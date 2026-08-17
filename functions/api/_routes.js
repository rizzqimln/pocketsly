/**
 * REST API ROUTE HANDLERS (_routes.js)
 * =====================================
 * Complete endpoint handlers matching all functionality in server.py.
 */

import { queryAll, queryOne, execute, insert, initPlaygroundDb } from './_db.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  requestPasswordOtp,
  resetPasswordWithOtp,
  purgeUserSessions,
  hashPassword,
  formatUtcDateTime
} from './_auth.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTodayString() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getCurrentMonthString() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

async function getBudgetSummaryData(db, userId, monthYear) {
  const incRow = await queryOne(
    db,
    "SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = ?1 AND substr(income_date, 1, 7) = ?2",
    [userId, monthYear]
  );
  const expRow = await queryOne(
    db,
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?1 AND substr(expense_date, 1, 7) = ?2",
    [userId, monthYear]
  );
  const budRow = await queryOne(
    db,
    "SELECT COALESCE(SUM(amount), 0) as total FROM budgets WHERE user_id = ?1 AND month_year = ?2",
    [userId, monthYear]
  );

  const totalIncome = incRow?.total || 0;
  const totalExpense = expRow?.total || 0;
  const totalBudget = budRow?.total || 0;

  return {
    month: monthYear,
    total_income: totalIncome,
    total_expense: totalExpense,
    total_budget: totalBudget,
    net_balance: totalIncome - totalExpense
  };
}

// ── Auth Handlers ─────────────────────────────────────────────────────────────

export async function handleSession(db, user) {
  if (user) {
    return { authenticated: true, user };
  }
  return { authenticated: false, user: null };
}

export async function handleRegister(db, body) {
  const user = await registerUser(db, body);
  const session = await loginUser(db, user.username, body.password);
  return {
    success: true,
    user: session.user,
    token: session.token
  };
}

export async function handleLogin(db, body) {
  const { username, password } = body;
  const session = await loginUser(db, username, password);
  return {
    success: true,
    user: session.user,
    token: session.token
  };
}

export async function handleLogout(db, token) {
  if (token) {
    await logoutUser(db, token);
  }
  return { success: true, message: 'Logged out successfully.' };
}

export async function handleRequestOtp(db, body, env = {}) {
  const { username, email } = body;
  return await requestPasswordOtp(db, username || email, env);
}

export async function handleResetPassword(db, body) {
  return await resetPasswordWithOtp(db, body);
}

export async function handlePatchProfile(db, userId, body) {
  const { username, email, phone, security_pin, currency, password } = body;
  const updates = [];
  const params = [];
  let paramIdx = 1;
  let passwordChanged = false;

  if (username !== undefined) {
    const cleanUser = username.trim().toLowerCase();
    const existing = await queryOne(db, 'SELECT id FROM users WHERE username = ?1 AND id != ?2', [cleanUser, userId]);
    if (existing) throw new Error('Username is already taken.');
    updates.push(`username = ?${paramIdx++}`);
    params.push(cleanUser);
  }

  if (email !== undefined) {
    updates.push(`email = ?${paramIdx++}`);
    params.push(email ? email.trim().toLowerCase() : null);
  }

  if (phone !== undefined) {
    updates.push(`phone = ?${paramIdx++}`);
    params.push(phone ? phone.trim() : null);
  }

  if (security_pin !== undefined) {
    updates.push(`security_pin = ?${paramIdx++}`);
    params.push(String(security_pin).trim());
  }

  if (currency !== undefined) {
    updates.push(`currency = ?${paramIdx++}`);
    params.push(currency.trim().toUpperCase());
  }

  if (password && password.length >= 6) {
    const { hash, salt } = await hashPassword(password);
    updates.push(`password_hash = ?${paramIdx++}`);
    params.push(hash);
    updates.push(`salt = ?${paramIdx++}`);
    params.push(salt);
    passwordChanged = true;
  }

  if (updates.length === 0) {
    return { success: true, message: 'No changes provided.' };
  }

  params.push(userId);
  await execute(db, `UPDATE users SET ${updates.join(', ')} WHERE id = ?${paramIdx}`, params);

  // A changed password invalidates every existing session (parity with OTP reset).
  if (passwordChanged) {
    await purgeUserSessions(db, userId);
  }

  const updatedUser = await queryOne(db, 'SELECT id, username, email, phone, currency FROM users WHERE id = ?1', [userId]);
  return { success: true, user: updatedUser };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function handleGetDashboard(db, userId) {
  const todayStr = getTodayString();
  const dayOfWeek = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const habits = await queryAll(
    db,
    `SELECT h.*,
      (SELECT done FROM habit_logs WHERE habit_id = h.id AND log_date = ?1) as today_done
     FROM habits h WHERE h.user_id = ?2 ORDER BY h.id ASC`,
    [todayStr, userId]
  );

  const tasks = await queryAll(
    db,
    `SELECT * FROM tasks WHERE user_id = ?1 AND (done = 0 OR due_date = ?2) ORDER BY done ASC, priority DESC, due_date ASC LIMIT 8`,
    [userId, todayStr]
  );

  const events = await queryAll(
    db,
    `SELECT e.*, c.name as course_name, l.name as lecturer_name
     FROM events e
     LEFT JOIN courses c ON e.course_id = c.id
     LEFT JOIN lecturers l ON e.lecturer_id = l.id
     WHERE e.user_id = ?1 AND e.day_of_week = ?2
     ORDER BY e.start_time ASC`,
    [userId, dayOfWeek]
  );

  const note = await queryOne(
    db,
    `SELECT * FROM notes WHERE user_id = ?1 AND substr(created_at, 1, 10) = ?2 ORDER BY updated_at DESC LIMIT 1`,
    [userId, todayStr]
  );

  const budgetSummary = await getBudgetSummaryData(db, userId, getCurrentMonthString());

  return {
    today: todayStr,
    habits,
    tasks,
    events,
    note,
    budget_summary: budgetSummary
  };
}

// ── Habits ────────────────────────────────────────────────────────────────────

export async function handleGetHabits(db, userId) {
  const todayStr = getTodayString();
  const habits = await queryAll(
    db,
    `SELECT h.*,
      (SELECT done FROM habit_logs WHERE habit_id = h.id AND log_date = ?1) as today_done
     FROM habits h WHERE h.user_id = ?2 ORDER BY h.id ASC`,
    [todayStr, userId]
  );

  // Attach 7-day matrix for each habit
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const pad = n => String(n).padStart(2, '0');
    dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }

  for (const habit of habits) {
    const logs = await queryAll(
      db,
      'SELECT log_date, done FROM habit_logs WHERE habit_id = ?1 AND log_date >= ?2 ORDER BY log_date ASC',
      [habit.id, dates[0]]
    );
    const logMap = Object.fromEntries(logs.map(l => [l.log_date, l.done]));
    habit.week_logs = dates.map(dt => ({ date: dt, done: logMap[dt] === 1 ? 1 : 0 }));
  }

  return habits;
}

export async function handleGetHabitLogs(db, userId, habitId) {
  return await queryAll(
    db,
    'SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE hl.habit_id = ?1 AND h.user_id = ?2 ORDER BY hl.log_date DESC',
    [habitId, userId]
  );
}

export async function handlePostHabit(db, userId, body) {
  const { title, icon = '✨', color = '#4F6DF5' } = body;
  if (!title || !title.trim()) throw new Error('Habit title is required.');
  const id = await insert(
    db,
    'INSERT INTO habits (user_id, title, icon, color) VALUES (?1, ?2, ?3, ?4)',
    [userId, title.trim(), icon, color]
  );
  return { success: true, id, title: title.trim(), icon, color };
}

export async function handlePostHabitLog(db, userId, habitId, body) {
  const { log_date = getTodayString(), done = 1 } = body;
  const habit = await queryOne(db, 'SELECT id FROM habits WHERE id = ?1 AND user_id = ?2', [habitId, userId]);
  if (!habit) throw new Error('Habit not found.');

  const existing = await queryOne(db, 'SELECT id FROM habit_logs WHERE habit_id = ?1 AND log_date = ?2', [habitId, log_date]);
  if (existing) {
    await execute(db, 'UPDATE habit_logs SET done = ?1 WHERE id = ?2', [done ? 1 : 0, existing.id]);
  } else {
    await insert(db, 'INSERT INTO habit_logs (habit_id, log_date, done) VALUES (?1, ?2, ?3)', [habitId, log_date, done ? 1 : 0]);
  }
  return { success: true, habit_id: habitId, log_date, done: done ? 1 : 0 };
}

export async function handleDeleteHabit(db, userId, habitId) {
  await execute(db, 'DELETE FROM habits WHERE id = ?1 AND user_id = ?2', [habitId, userId]);
  return { success: true };
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function handleGetTasks(db, userId, query) {
  let sql = 'SELECT * FROM tasks WHERE user_id = ?1';
  const params = [userId];

  if (query.status === 'pending') {
    sql += ' AND done = 0';
  } else if (query.status === 'completed') {
    sql += ' AND done = 1';
  }

  if (query.priority) {
    sql += ' AND priority = ?2';
    params.push(query.priority);
  }

  sql += ' ORDER BY done ASC, priority DESC, due_date ASC';
  return await queryAll(db, sql, params);
}

export async function handlePostTask(db, userId, body) {
  const { title, details = '', priority = 'medium', due_date = null } = body;
  if (!title || !title.trim()) throw new Error('Task title is required.');
  const id = await insert(
    db,
    'INSERT INTO tasks (user_id, title, details, priority, due_date, done) VALUES (?1, ?2, ?3, ?4, ?5, 0)',
    [userId, title.trim(), details, priority, due_date]
  );
  return { success: true, id, title: title.trim(), details, priority, due_date, done: 0 };
}

export async function handlePatchTask(db, userId, taskId, body) {
  const task = await queryOne(db, 'SELECT * FROM tasks WHERE id = ?1 AND user_id = ?2', [taskId, userId]);
  if (!task) throw new Error('Task not found.');

  const updates = [];
  const params = [];
  let idx = 1;

  if (body.done !== undefined) {
    updates.push(`done = ?${idx++}`);
    params.push(body.done ? 1 : 0);
  }
  if (body.title !== undefined) {
    updates.push(`title = ?${idx++}`);
    params.push(body.title.trim());
  }
  if (body.details !== undefined) {
    updates.push(`details = ?${idx++}`);
    params.push(body.details);
  }
  if (body.priority !== undefined) {
    updates.push(`priority = ?${idx++}`);
    params.push(body.priority);
  }
  if (body.due_date !== undefined) {
    updates.push(`due_date = ?${idx++}`);
    params.push(body.due_date);
  }

  if (updates.length > 0) {
    params.push(taskId, userId);
    await execute(db, `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?${idx++} AND user_id = ?${idx}`, params);
  }
  return { success: true };
}

export async function handleDeleteTask(db, userId, taskId) {
  await execute(db, 'DELETE FROM tasks WHERE id = ?1 AND user_id = ?2', [taskId, userId]);
  return { success: true };
}

// ── Events / Schedule ─────────────────────────────────────────────────────────

export async function handleGetEvents(db, userId) {
  return await queryAll(
    db,
    `SELECT e.*, c.name as course_name, l.name as lecturer_name
     FROM events e
     LEFT JOIN courses c ON e.course_id = c.id
     LEFT JOIN lecturers l ON e.lecturer_id = l.id
     WHERE e.user_id = ?1
     ORDER BY e.day_of_week ASC, e.start_time ASC`,
    [userId]
  );
}

export async function handlePostEvent(db, userId, body) {
  const { title, day_of_week, start_time, end_time, location = '', color = '#4F6DF5', course_id = null, lecturer_id = null } = body;
  if (!title || day_of_week === undefined || !start_time || !end_time) {
    throw new Error('Title, day of week, start time, and end time are required.');
  }
  const id = await insert(
    db,
    'INSERT INTO events (user_id, title, day_of_week, start_time, end_time, location, color, course_id, lecturer_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)',
    [userId, title.trim(), Number(day_of_week), start_time, end_time, location, color, course_id, lecturer_id]
  );
  return { success: true, id };
}

export async function handleDeleteEvent(db, userId, eventId) {
  await execute(db, 'DELETE FROM events WHERE id = ?1 AND user_id = ?2', [eventId, userId]);
  return { success: true };
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function handleGetNotes(db, userId) {
  return await queryAll(db, 'SELECT * FROM notes WHERE user_id = ?1 ORDER BY updated_at DESC', [userId]);
}

export async function handlePostNote(db, userId, body) {
  const { title, body: noteBody = '', mood = 'neutral' } = body;
  if (!title || !title.trim()) throw new Error('Note title is required.');
  const nowStr = formatUtcDateTime();
  const id = await insert(
    db,
    'INSERT INTO notes (user_id, title, body, mood, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
    [userId, title.trim(), noteBody, mood, nowStr, nowStr]
  );
  return { success: true, id, title: title.trim(), body: noteBody, mood };
}

export async function handlePatchNote(db, userId, noteId, body) {
  const note = await queryOne(db, 'SELECT id FROM notes WHERE id = ?1 AND user_id = ?2', [noteId, userId]);
  if (!note) throw new Error('Note not found.');

  const updates = [];
  const params = [];
  let idx = 1;

  if (body.title !== undefined) {
    updates.push(`title = ?${idx++}`);
    params.push(body.title.trim());
  }
  if (body.body !== undefined) {
    updates.push(`body = ?${idx++}`);
    params.push(body.body);
  }
  if (body.mood !== undefined) {
    updates.push(`mood = ?${idx++}`);
    params.push(body.mood);
  }

  updates.push(`updated_at = ?${idx++}`);
  params.push(formatUtcDateTime());

  params.push(noteId, userId);
  await execute(db, `UPDATE notes SET ${updates.join(', ')} WHERE id = ?${idx++} AND user_id = ?${idx}`, params);
  return { success: true };
}

export async function handleDeleteNote(db, userId, noteId) {
  await execute(db, 'DELETE FROM notes WHERE id = ?1 AND user_id = ?2', [noteId, userId]);
  return { success: true };
}

// ── Curriculum & Courses ──────────────────────────────────────────────────────

export async function handleGetCourses(db, userId) {
  return await queryAll(db, 'SELECT * FROM courses WHERE user_id = ?1 ORDER BY semester ASC, code ASC', [userId]);
}

export async function handlePostCourse(db, userId, body) {
  const { code, name, credits = 3, semester = 1, progress = 0 } = body;
  if (!code || !name) throw new Error('Course code and name are required.');
  const id = await insert(
    db,
    'INSERT INTO courses (user_id, code, name, credits, semester, progress) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
    [userId, code.trim().toUpperCase(), name.trim(), Number(credits), Number(semester), Number(progress)]
  );
  return { success: true, id };
}

export async function handlePatchCourse(db, userId, courseId, body) {
  const updates = [];
  const params = [];
  let idx = 1;

  if (body.code !== undefined) { updates.push(`code = ?${idx++}`); params.push(body.code.trim().toUpperCase()); }
  if (body.name !== undefined) { updates.push(`name = ?${idx++}`); params.push(body.name.trim()); }
  if (body.credits !== undefined) { updates.push(`credits = ?${idx++}`); params.push(Number(body.credits)); }
  if (body.semester !== undefined) { updates.push(`semester = ?${idx++}`); params.push(Number(body.semester)); }
  if (body.progress !== undefined) { updates.push(`progress = ?${idx++}`); params.push(Number(body.progress)); }

  if (updates.length > 0) {
    params.push(courseId, userId);
    await execute(db, `UPDATE courses SET ${updates.join(', ')} WHERE id = ?${idx++} AND user_id = ?${idx}`, params);
  }
  return { success: true };
}

export async function handleDeleteCourse(db, userId, courseId) {
  await execute(db, 'DELETE FROM courses WHERE id = ?1 AND user_id = ?2', [courseId, userId]);
  return { success: true };
}

export async function handleGetLecturers(db, userId) {
  return await queryAll(db, 'SELECT * FROM lecturers WHERE user_id = ?1 ORDER BY name ASC', [userId]);
}

export async function handlePostLecturer(db, userId, body) {
  const { name, email = '', office = '', phone = '' } = body;
  if (!name || !name.trim()) throw new Error('Lecturer name is required.');
  const id = await insert(
    db,
    'INSERT INTO lecturers (user_id, name, email, office, phone) VALUES (?1, ?2, ?3, ?4, ?5)',
    [userId, name.trim(), email.trim(), office.trim(), phone.trim()]
  );
  return { success: true, id };
}

export async function handleDeleteLecturer(db, userId, lecturerId) {
  await execute(db, 'DELETE FROM lecturers WHERE id = ?1 AND user_id = ?2', [lecturerId, userId]);
  return { success: true };
}

export async function handleGetStudyLogs(db, userId) {
  return await queryAll(db, 'SELECT * FROM study_logs WHERE user_id = ?1 ORDER BY log_date DESC, id DESC LIMIT 50', [userId]);
}

export async function handlePostStudyLog(db, userId, body) {
  const { course_name, hours, activity_type = 'practice', log_date = getTodayString(), notes = '' } = body;
  if (!course_name || !hours) throw new Error('Course name and hours are required.');
  const id = await insert(
    db,
    'INSERT INTO study_logs (user_id, course_name, hours, activity_type, log_date, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
    [userId, course_name.trim(), Number(hours), activity_type, log_date, notes]
  );
  return { success: true, id };
}

export async function handleDeleteStudyLog(db, userId, logId) {
  await execute(db, 'DELETE FROM study_logs WHERE id = ?1 AND user_id = ?2', [logId, userId]);
  return { success: true };
}

export async function handleGetCurriculumSchema() {
  return {
    courses: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'code', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'name', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'credits', type: 'INTEGER', pk: 0, notnull: 1 },
      { name: 'semester', type: 'INTEGER', pk: 0, notnull: 1 },
      { name: 'progress', type: 'INTEGER', pk: 0, notnull: 0 }
    ],
    lecturers: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'name', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'email', type: 'TEXT', pk: 0, notnull: 0 },
      { name: 'office', type: 'TEXT', pk: 0, notnull: 0 },
      { name: 'phone', type: 'TEXT', pk: 0, notnull: 0 }
    ],
    study_logs: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'course_name', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'hours', type: 'REAL', pk: 0, notnull: 1 },
      { name: 'activity_type', type: 'TEXT', pk: 0, notnull: 0 },
      { name: 'log_date', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'notes', type: 'TEXT', pk: 0, notnull: 0 }
    ],
    tasks: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'title', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'priority', type: 'INTEGER', pk: 0, notnull: 0 },
      { name: 'due_date', type: 'TEXT', pk: 0, notnull: 0 },
      { name: 'done', type: 'INTEGER', pk: 0, notnull: 0 }
    ],
    habits: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'name', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'streak', type: 'INTEGER', pk: 0, notnull: 0 },
      { name: 'category', type: 'TEXT', pk: 0, notnull: 0 }
    ],
    notes: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'title', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'body', type: 'TEXT', pk: 0, notnull: 0 },
      { name: 'mood', type: 'TEXT', pk: 0, notnull: 0 }
    ],
    expenses: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'category', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'amount', type: 'REAL', pk: 0, notnull: 1 },
      { name: 'expense_date', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'wallet', type: 'TEXT', pk: 0, notnull: 0 }
    ],
    incomes: [
      { name: 'id', type: 'INTEGER', pk: 1, notnull: 0 },
      { name: 'source', type: 'TEXT', pk: 0, notnull: 1 },
      { name: 'amount', type: 'REAL', pk: 0, notnull: 1 },
      { name: 'income_date', type: 'TEXT', pk: 0, notnull: 1 }
    ]
  };
}

export async function handlePostCurriculumPlayground(playgroundDb, body) {
  // The playground only runs against its own scratch D1 database
  // (PLAYGROUND_DB binding) — it can never touch production data.
  if (!playgroundDb) {
    throw new Error('PLAYGROUND_DB D1 binding is not configured. Add a second D1 database named PLAYGROUND_DB to the Pages project.');
  }
  await initPlaygroundDb(playgroundDb);

  const { query } = body;
  if (!query || !query.trim()) throw new Error('Query string is required.');
  const clean = query.trim().replace(/;+$/, '');

  // Safety filter: only allow read-only SELECT statements
  if (!/^SELECT\b/i.test(clean) || /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)\b/i.test(clean)) {
    return {
      error: 'Security Notice: Only read-only SELECT queries are permitted in the Live SQL Playground.'
    };
  }

  try {
    const results = await queryAll(playgroundDb, clean);
    const columns = results.length > 0 ? Object.keys(results[0]) : [];
    return {
      success: true,
      type: 'select',
      columns,
      rows: results,
      count: results.length,
      affected_rows: 0
    };
  } catch (err) {
    return {
      error: `SQL Execution Error: ${err.message}`
    };
  }
}

// ── Budget, Incomes & Expenses ────────────────────────────────────────────────

export async function handleGetBudgets(db, userId, query) {
  const month = query.month || getCurrentMonthString();
  return await queryAll(db, 'SELECT * FROM budgets WHERE user_id = ?1 AND month_year = ?2', [userId, month]);
}

export async function handlePostBudget(db, userId, body) {
  const { category, amount, month_year = getCurrentMonthString() } = body;
  if (!category || amount === undefined) throw new Error('Category and amount are required.');

  const existing = await queryOne(
    db,
    'SELECT id FROM budgets WHERE user_id = ?1 AND category = ?2 AND month_year = ?3',
    [userId, category.trim(), month_year]
  );

  if (existing) {
    await execute(db, 'UPDATE budgets SET amount = ?1 WHERE id = ?2', [Number(amount), existing.id]);
    return { success: true, id: existing.id, category: category.trim(), amount: Number(amount), month_year };
  } else {
    const id = await insert(
      db,
      'INSERT INTO budgets (user_id, category, amount, month_year) VALUES (?1, ?2, ?3, ?4)',
      [userId, category.trim(), Number(amount), month_year]
    );
    return { success: true, id, category: category.trim(), amount: Number(amount), month_year };
  }
}

export async function handleDeleteBudget(db, userId, budgetId) {
  await execute(db, 'DELETE FROM budgets WHERE id = ?1 AND user_id = ?2', [budgetId, userId]);
  return { success: true };
}

export async function handleGetExpenses(db, userId, query) {
  if (query.month) {
    return await queryAll(
      db,
      'SELECT * FROM expenses WHERE user_id = ?1 AND substr(expense_date, 1, 7) = ?2 ORDER BY expense_date DESC, id DESC',
      [userId, query.month]
    );
  }
  return await queryAll(db, 'SELECT * FROM expenses WHERE user_id = ?1 ORDER BY expense_date DESC, id DESC LIMIT 100', [userId]);
}

export async function handlePostExpense(db, userId, body) {
  const { category, amount, description = '', expense_date = getTodayString(), wallet = 'Cash' } = body;
  if (!category || amount === undefined) throw new Error('Category and amount are required.');
  const id = await insert(
    db,
    'INSERT INTO expenses (user_id, category, amount, description, expense_date, wallet) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
    [userId, category.trim(), Number(amount), description, expense_date, wallet]
  );
  return { success: true, id };
}

export async function handleDeleteExpense(db, userId, expenseId) {
  await execute(db, 'DELETE FROM expenses WHERE id = ?1 AND user_id = ?2', [expenseId, userId]);
  return { success: true };
}

export async function handleGetIncomes(db, userId, query) {
  if (query.month) {
    return await queryAll(
      db,
      'SELECT * FROM incomes WHERE user_id = ?1 AND substr(income_date, 1, 7) = ?2 ORDER BY income_date DESC, id DESC',
      [userId, query.month]
    );
  }
  return await queryAll(db, 'SELECT * FROM incomes WHERE user_id = ?1 ORDER BY income_date DESC, id DESC LIMIT 100', [userId]);
}

export async function handlePostIncome(db, userId, body) {
  const { source, amount, description = '', income_date = getTodayString(), wallet = 'Cash', recurring = 'none' } = body;
  if (!source || amount === undefined) throw new Error('Source and amount are required.');
  const id = await insert(
    db,
    'INSERT INTO incomes (user_id, source, amount, description, income_date, wallet, recurring) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
    [userId, source.trim(), Number(amount), description, income_date, wallet, recurring]
  );
  return { success: true, id };
}

export async function handleDeleteIncome(db, userId, incomeId) {
  await execute(db, 'DELETE FROM incomes WHERE id = ?1 AND user_id = ?2', [incomeId, userId]);
  return { success: true };
}

export async function handleGetBudgetSummary(db, userId, query) {
  const month = query.month || getCurrentMonthString();
  return await getBudgetSummaryData(db, userId, month);
}

// ── Academic Resources ────────────────────────────────────────────────────────

export async function handleGetResources(db, userId) {
  return await queryAll(
    db,
    'SELECT * FROM resources WHERE user_id = ?1 OR user_id IS NULL ORDER BY created_at DESC',
    [userId]
  );
}

export async function handlePostResource(db, userId, body) {
  const { title, author = '', resource_type = 'article', category = 'general', url_or_path = '', status = 'unread', notes = '', year = '', publisher = '', doi = '' } = body;
  if (!title || !title.trim()) throw new Error('Title is required.');
  const id = await insert(
    db,
    'INSERT INTO resources (user_id, title, author, resource_type, category, url_or_path, status, notes, year, publisher, doi) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)',
    [userId, title.trim(), author, resource_type, category, url_or_path, status, notes, year, publisher, doi]
  );
  return { success: true, id };
}

export async function handleDeleteResource(db, userId, resourceId) {
  await execute(db, 'DELETE FROM resources WHERE id = ?1 AND user_id = ?2', [resourceId, userId]);
  return { success: true };
}

// ── Backup Export / Restore ───────────────────────────────────────────────────

export async function handleGetBackupExport(db, userId) {
  const user = await queryOne(db, 'SELECT id, username, email, phone, currency FROM users WHERE id = ?1', [userId]);
  const habits = await queryAll(db, 'SELECT * FROM habits WHERE user_id = ?1', [userId]);
  const habitLogs = await queryAll(db, 'SELECT hl.* FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE h.user_id = ?1', [userId]);
  const tasks = await queryAll(db, 'SELECT * FROM tasks WHERE user_id = ?1', [userId]);
  const events = await queryAll(db, 'SELECT * FROM events WHERE user_id = ?1', [userId]);
  const notes = await queryAll(db, 'SELECT * FROM notes WHERE user_id = ?1', [userId]);
  const courses = await queryAll(db, 'SELECT * FROM courses WHERE user_id = ?1', [userId]);
  const lecturers = await queryAll(db, 'SELECT * FROM lecturers WHERE user_id = ?1', [userId]);
  const budgets = await queryAll(db, 'SELECT * FROM budgets WHERE user_id = ?1', [userId]);
  const expenses = await queryAll(db, 'SELECT * FROM expenses WHERE user_id = ?1', [userId]);
  const incomes = await queryAll(db, 'SELECT * FROM incomes WHERE user_id = ?1', [userId]);
  const studyLogs = await queryAll(db, 'SELECT * FROM study_logs WHERE user_id = ?1', [userId]);
  const resources = await queryAll(db, 'SELECT * FROM resources WHERE user_id = ?1', [userId]);

  return {
    version: '1.0',
    exported_at: formatUtcDateTime(),
    user,
    habits,
    habit_logs: habitLogs,
    tasks,
    events,
    notes,
    courses,
    lecturers,
    budgets,
    expenses,
    incomes,
    study_logs: studyLogs,
    resources
  };
}

export async function handlePostBackupRestore(db, userId, body) {
  const data = body.data || body;
  if (!data || typeof data !== 'object') throw new Error('Invalid backup data payload.');

  // Clean existing user domain data before restoring
  await execute(db, 'DELETE FROM habits WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM tasks WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM events WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM notes WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM courses WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM lecturers WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM budgets WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM expenses WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM incomes WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM resources WHERE user_id = ?1', [userId]);
  await execute(db, 'DELETE FROM study_logs WHERE user_id = ?1', [userId]);

  // 1. Habits & Habit Logs
  const habitIdMap = {};
  if (Array.isArray(data.habits)) {
    for (const h of data.habits) {
      const oldId = h.id;
      const newId = await insert(
        db,
        'INSERT INTO habits (user_id, title, icon, color) VALUES (?1, ?2, ?3, ?4)',
        [userId, h.title, h.icon || '✨', h.color || '#4F6DF5']
      );
      if (oldId !== undefined && oldId !== null) {
        habitIdMap[oldId] = newId;
      }
    }
  }

  if (Array.isArray(data.habit_logs)) {
    for (const hl of data.habit_logs) {
      const mappedHid = habitIdMap[hl.habit_id];
      if (mappedHid) {
        await execute(
          db,
          'INSERT OR IGNORE INTO habit_logs (habit_id, log_date, done) VALUES (?1, ?2, ?3)',
          [mappedHid, hl.log_date, hl.done !== undefined ? hl.done : 1]
        );
      }
    }
  }

  // 2. Tasks
  if (Array.isArray(data.tasks)) {
    for (const t of data.tasks) {
      await insert(
        db,
        'INSERT INTO tasks (user_id, title, details, priority, due_date, done) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        [userId, t.title, t.details || '', t.priority || 'medium', t.due_date || null, t.done ? 1 : 0]
      );
    }
  }

  // 3. Courses
  const courseIdMap = {};
  if (Array.isArray(data.courses)) {
    for (const c of data.courses) {
      const oldCid = c.id;
      const newCid = await insert(
        db,
        'INSERT INTO courses (user_id, code, name, credits, semester, progress) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        [userId, c.code || '', c.name || '', c.credits || 3, c.semester || 1, c.progress || 0]
      );
      if (oldCid !== undefined && oldCid !== null) {
        courseIdMap[oldCid] = newCid;
      }
    }
  }

  // 4. Lecturers
  const lecturerIdMap = {};
  if (Array.isArray(data.lecturers)) {
    for (const l of data.lecturers) {
      const oldLid = l.id;
      const newLid = await insert(
        db,
        'INSERT INTO lecturers (user_id, name, email, office, phone) VALUES (?1, ?2, ?3, ?4, ?5)',
        [userId, l.name || '', l.email || null, l.office || null, l.phone || null]
      );
      if (oldLid !== undefined && oldLid !== null) {
        lecturerIdMap[oldLid] = newLid;
      }
    }
  }

  // 5. Events
  if (Array.isArray(data.events)) {
    for (const e of data.events) {
      const mappedCid = courseIdMap[e.course_id] || null;
      const mappedLid = lecturerIdMap[e.lecturer_id] || null;
      await insert(
        db,
        'INSERT INTO events (user_id, title, day_of_week, start_time, end_time, location, color, course_id, lecturer_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)',
        [userId, e.title, e.day_of_week || 0, e.start_time || '09:00', e.end_time || '10:00', e.location || null, e.color || '#4F6DF5', mappedCid, mappedLid]
      );
    }
  }

  // 6. Notes
  if (Array.isArray(data.notes)) {
    for (const n of data.notes) {
      await insert(
        db,
        'INSERT INTO notes (user_id, title, body, mood) VALUES (?1, ?2, ?3, ?4)',
        [userId, n.title, n.body || '', n.mood || 'neutral']
      );
    }
  }

  // 7. Budgets
  if (Array.isArray(data.budgets)) {
    for (const b of data.budgets) {
      await execute(
        db,
        'INSERT INTO budgets (user_id, category, amount, month_year) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(user_id, category, month_year) DO UPDATE SET amount = excluded.amount',
        [userId, b.category, b.amount, b.month_year]
      );
    }
  }

  // 8. Expenses
  if (Array.isArray(data.expenses)) {
    for (const e of data.expenses) {
      await insert(
        db,
        'INSERT INTO expenses (user_id, category, amount, description, expense_date, wallet) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        [userId, e.category, e.amount, e.description || '', e.expense_date, e.wallet || 'Cash']
      );
    }
  }

  // 9. Incomes
  if (Array.isArray(data.incomes)) {
    for (const i of data.incomes) {
      await insert(
        db,
        'INSERT INTO incomes (user_id, source, amount, description, income_date, wallet, recurring) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
        [userId, i.source, i.amount, i.description || '', i.income_date, i.wallet || 'Cash', i.recurring || 'none']
      );
    }
  }

  // 10. Academic Resources
  if (Array.isArray(data.resources)) {
    for (const r of data.resources) {
      await insert(
        db,
        'INSERT INTO resources (user_id, title, author, resource_type, category, url_or_path, status, notes, year, publisher, doi) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)',
        [userId, r.title, r.author || '', r.resource_type || 'article', r.category || 'general', r.url_or_path || '', r.status || 'unread', r.notes || '', r.year || '', r.publisher || '', r.doi || '']
      );
    }
  }

  // 11. Study Logs
  if (Array.isArray(data.study_logs)) {
    for (const sl of data.study_logs) {
      await insert(
        db,
        'INSERT INTO study_logs (user_id, course_name, hours, activity_type, log_date, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        [userId, sl.course_name, sl.hours || 1.0, sl.activity_type || 'practice', sl.log_date, sl.notes || '']
      );
    }
  }

  return { success: true, message: 'Backup restored successfully.' };
}

// ── Receipt Scan Heuristic ───────────────────────────────────────────────────

export async function handlePostReceiptScan(body) {
  const text = (body.text || body.ocr_text || body.image || '').toString();
  let total = 0;
  let merchant = 'Store / Merchant';
  let date = getTodayString();
  let category = 'Food & Dining';

  // Smart regex extractor for total
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const totalKeywords = ['total', 'grand total', 'subtotal', 'jumlah', 'tagihan', 'bayar', 'amount', 'total bayar', 'total belanja', 'net total', 'debit', 'cash', 'tunai'];

  for (const line of lines) {
    if (totalKeywords.some(k => line.toLowerCase().includes(k))) {
      const cleanLine = line.replace(/(?:rp\.?|idr|usd|\$|€|£|¥)/gi, ' ').trim();
      const numMatch = cleanLine.match(/([0-9]+(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+)/);
      if (numMatch) {
        let valStr = numMatch[1].trim();
        if (/^\d{1,3}(?:[.]\d{3})+(?:,\d{2})$/.test(valStr)) {
          valStr = valStr.replace(/\./g, '').replace(',', '.');
        } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{2})$/.test(valStr)) {
          valStr = valStr.replace(/,/g, '');
        } else if (/^\d{1,3}(?:[.]\d{3})+$/.test(valStr)) {
          valStr = valStr.replace(/\./g, '');
        } else if (/^\d{1,3}(?:,\d{3})+$/.test(valStr)) {
          valStr = valStr.replace(/,/g, '');
        } else if (/^\d+,\d{2}$/.test(valStr)) {
          valStr = valStr.replace(',', '.');
        }
        const parsedNum = parseFloat(valStr);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          total = parsedNum;
          break;
        }
      }
    }
  }

  // Fallback if no total keyword line matched
  if (total === 0 && lines.length > 0) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const cleanLine = line.replace(/(?:rp\.?|idr|usd|\$|€|£|¥)/gi, ' ').trim();
      const numMatch = cleanLine.match(/([0-9]+(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+)/);
      if (numMatch) {
        let valStr = numMatch[1].trim();
        if (/^\d{1,3}(?:[.]\d{3})+$/.test(valStr)) valStr = valStr.replace(/\./g, '');
        else if (/^\d{1,3}(?:,\d{3})+$/.test(valStr)) valStr = valStr.replace(/,/g, '');
        const parsedNum = parseFloat(valStr);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          total = parsedNum;
          break;
        }
      }
    }
  }

  if (lines.length > 0) {
    for (const l of lines) {
      if (l.length > 2 && !/\d{4,}/.test(l) && !totalKeywords.some(k => l.toLowerCase().includes(k))) {
        merchant = l.substring(0, 40).replace(/[^a-zA-Z0-9\s&.-]/g, '').trim();
        break;
      }
    }
  }

  return {
    success: true,
    merchant,
    amount: total,
    date,
    category,
    data: {
      merchant,
      amount: total,
      date,
      category
    }
  };
}

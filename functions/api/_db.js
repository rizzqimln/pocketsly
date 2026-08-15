/**
 * DATABASE ABSTRACTION & D1 SCHEMA INITIALIZER (_db.js)
 * ======================================================
 * Operates on Cloudflare D1 (Serverless SQLite at the edge).
 * 
 * Features:
 * 1. Automatic & idempotent schema migration (CREATE TABLE IF NOT EXISTS).
 * 2. Prepared statements with parameterized bindings (?1, ?2, ...) to prevent SQL injection.
 * 3. Consistent helper wrappers: queryAll, queryOne, execute, insert.
 * 4. Automatic seeding of starter academic library resources for new databases.
 */

export const D1_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    security_pin TEXT DEFAULT '123456',
    otp_code TEXT,
    otp_expires_at TEXT,
    currency TEXT DEFAULT 'IDR',
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    icon TEXT DEFAULT '✨',
    color TEXT DEFAULT '#4F6DF5',
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    log_date TEXT NOT NULL,
    done INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    UNIQUE(habit_id, log_date),
    FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    details TEXT,
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    done INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    location TEXT,
    color TEXT DEFAULT '#4F6DF5',
    course_id INTEGER,
    lecturer_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY(lecturer_id) REFERENCES lecturers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    mood TEXT DEFAULT 'neutral',
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER DEFAULT 3,
    semester INTEGER DEFAULT 1,
    progress INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lecturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    office TEXT,
    phone TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    month_year TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, category, month_year)
);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    expense_date TEXT NOT NULL,
    wallet TEXT DEFAULT 'Cash',
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    author TEXT,
    resource_type TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    url_or_path TEXT,
    status TEXT DEFAULT 'unread',
    notes TEXT,
    year TEXT,
    publisher TEXT,
    doi TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_name TEXT NOT NULL,
    hours REAL NOT NULL,
    activity_type TEXT DEFAULT 'practice',
    log_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    income_date TEXT NOT NULL,
    wallet TEXT DEFAULT 'Cash',
    recurring TEXT DEFAULT 'none',
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_done ON tasks(user_id, done);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);
`;

export const DEFAULT_RESOURCES = [
  [null, "freeCodeCamp: Responsive Web Design", "freeCodeCamp", "article", "frontend", "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "Learn HTML5, CSS3, Flexbox, CSS Grid, and responsive web design principles."],
  [null, "The Odin Project: Foundations Course", "The Odin Project", "article", "frontend", "https://www.theodinproject.com/paths/foundations/courses/foundations", "Comprehensive introduction to Git, HTML, CSS, JavaScript, and backend setup."],
  [null, "W3Schools: Modern JavaScript & DOM Tutorials", "W3Schools", "article", "frontend", "https://www.w3schools.com/js/", "Interactive tutorials covering ES6+, DOM manipulation, events, and async JavaScript."],
  [null, "MDN Web Docs: Guide to Web APIs & Fetch", "MDN Web Docs", "article", "frontend", "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", "Official reference for CSS Layouts, Web APIs, Promises, and the Fetch API."],
  [null, "freeCodeCamp: Front End Development Libraries", "freeCodeCamp", "article", "frontend", "https://www.freecodecamp.org/learn/front-end-development-libraries/", "Master Bootstrap, Sass, JSX, React, and Redux state management."],
  [null, "freeCodeCamp: Relational Database & SQL", "freeCodeCamp", "article", "backend", "https://www.freecodecamp.org/learn/relational-database/", "Learn Bash, SQL, PostgreSQL, and database schema design using interactive terminals."],
  [null, "The Odin Project: NodeJS & Express Backend", "The Odin Project", "article", "backend", "https://www.theodinproject.com/paths/full-stack-javascript", "Advanced courses covering Node.js, Express, databases, REST APIs, and deployment."],
  [null, "W3Schools: SQL & Database Query Reference", "W3Schools", "article", "backend", "https://www.w3schools.com/sql/", "Learn SQL queries, INNER/LEFT JOINs, PRIMARY/FOREIGN KEY constraints, and indexes."],
  [null, "freeCodeCamp: Back End Development & APIs", "freeCodeCamp", "article", "backend", "https://www.freecodecamp.org/learn/back-end-development-and-apis/", "Build microservices, REST APIs, and handle HTTP requests with Node/Express."],
  [null, "freeCodeCamp: Scientific Computing with Python", "freeCodeCamp", "article", "backend", "https://www.freecodecamp.org/learn/scientific-computing-with-python/", "Master Python fundamentals, loops, functions, data structures, and algorithms."],
  [null, "The Odin Project: Git & GitHub Workflow", "The Odin Project", "article", "general", "https://www.theodinproject.com/lessons/foundations-git-basics", "Essential guide to version control, branching, pull requests, and commit conventions."],
  [null, "W3Schools: Fullstack Developer Roadmap", "W3Schools", "article", "general", "https://www.w3schools.com/whatis/", "Complete guide to web development technologies, system architecture, and fullstack tracks."]
];

let _initialized = false;

/**
 * Initializes the database schema and default seeds. Idempotent.
 * @param {D1Database} db 
 */
export async function initDb(db) {
  if (_initialized || !db) return;
  try {
    // Execute DDL statements in sequence
    const statements = D1_SCHEMA_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const batch = statements.map(sql => db.prepare(sql));
    await db.batch(batch);

    // Check if resources table has any global seeds
    const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM resources WHERE user_id IS NULL").first();
    if (countRes && countRes.cnt === 0) {
      const seedBatch = DEFAULT_RESOURCES.map(r => 
        db.prepare(
          "INSERT INTO resources (user_id, title, author, resource_type, category, url_or_path, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
        ).bind(r[0], r[1], r[2], r[3], r[4], r[5], r[6])
      );
      await db.batch(seedBatch);
    }
    _initialized = true;
  } catch (err) {
    console.error("D1 initDb error:", err);
  }
}

/**
 * Executes a SELECT query returning an array of row objects.
 * @param {D1Database} db 
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {Promise<any[]>}
 */
export async function queryAll(db, sql, params = []) {
  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const result = await stmt.all();
  return result.results || [];
}

/**
 * Executes a SELECT query returning a single row object or null.
 * @param {D1Database} db 
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {Promise<any|null>}
 */
export async function queryOne(db, sql, params = []) {
  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const row = await stmt.first();
  return row || null;
}

/**
 * Executes an INSERT/UPDATE/DELETE query.
 * @param {D1Database} db 
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {Promise<D1Result>}
 */
export async function execute(db, sql, params = []) {
  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  return await stmt.run();
}

/**
 * Executes an INSERT query and returns the newly generated ID.
 * @param {D1Database} db 
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {Promise<number|null>}
 */
export async function insert(db, sql, params = []) {
  const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
  const res = await stmt.run();
  return res.meta?.last_row_id ?? null;
}

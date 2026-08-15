-- =============================================================================
-- DATABASE SCHEMA: PostgreSQL DDL
-- =============================================================================
-- LEARN: DDL (Data Definition Language) defines tables, relationships, and types.
-- PostgreSQL is a production-grade relational database — this file is applied
-- automatically by db.init_db() on server start, or manually via the Supabase
-- SQL Editor.
--
-- Design notes:
--   * Dates/times are stored as TEXT in 'YYYY-MM-DD HH:MM:SS' (UTC) — the same
--     format the application has always used, so string comparisons sort
--     correctly and no timezone drift is introduced.
--   * Foreign keys are ALWAYS enforced in PostgreSQL (unlike SQLite, no PRAGMA
--     switch is needed).
--   * Money columns use DOUBLE PRECISION for simplicity; use NUMERIC if you
--     ever need exact decimal accounting.
-- =============================================================================

-- 1. USERS TABLE
-- Stores user credentials securely.
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,      -- UNIQUE constraint prevents duplicate accounts
    password_hash TEXT NOT NULL,       -- Stored as hexadecimal digest, NEVER plain text
    salt TEXT NOT NULL,                -- Per-user random salt for PBKDF2 hashing
    email TEXT,                        -- Email address for account recovery
    phone TEXT,                        -- Phone number for account recovery
    security_pin TEXT DEFAULT '123456', -- 4-8 digit recovery PIN (fallback)
    otp_code TEXT,                     -- 6-digit OTP code for password reset
    otp_expires_at TEXT,               -- OTP expiration timestamp
    currency TEXT DEFAULT 'IDR',       -- Preferred currency (e.g. IDR, USD, EUR, GBP, JPY, SGD, AUD, CAD, MYR)
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);

-- 2. SESSIONS TABLE
-- Stores active login sessions for cookie-based authentication.
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,            -- Random cryptographically secure token
    user_id BIGINT NOT NULL,          -- Foreign key linking session to user
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    expires_at TEXT NOT NULL,      -- Session expiration timestamp
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. HABITS TABLE
-- Daily routines that users want to complete regularly (e.g. "Read 20 mins", "Drink Water").
CREATE TABLE IF NOT EXISTS habits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    icon TEXT DEFAULT '✨',            -- Emoji icon for visual recognition
    color TEXT DEFAULT '#4F6DF5',       -- Hex color code for UI customization
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. HABIT_LOGS TABLE
-- Tracks completion of a specific habit on a specific date (YYYY-MM-DD).
-- Juxtaposing habit_id + date creates a completion log for heatmaps & streaks.
CREATE TABLE IF NOT EXISTS habit_logs (
    id BIGSERIAL PRIMARY KEY,
    habit_id BIGINT NOT NULL,
    log_date TEXT NOT NULL,             -- Formatted as 'YYYY-MM-DD'
    done INTEGER DEFAULT 1,             -- 1 = completed, 0 = uncompleted
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    UNIQUE(habit_id, log_date),        -- Prevents double-logging same habit on same day
    FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- 5. TASKS TABLE
-- Action items with priorities, due dates, and completion status.
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    details TEXT,                       -- Optional long description
    priority TEXT DEFAULT 'medium',     -- Priority: 'low', 'medium', 'high'
    due_date TEXT,                      -- Formatted as 'YYYY-MM-DD'
    done INTEGER DEFAULT 0,             -- 0 = pending, 1 = completed
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. EVENTS / SCHEDULE TABLE
-- Weekly timetable for classes, work blocks, or routines.
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,       -- 0 = Monday, 6 = Sunday (or 0=Sun, 6=Sat)
    start_time TEXT NOT NULL,           -- 'HH:MM' 24-hour format e.g. '09:00'
    end_time TEXT NOT NULL,             -- 'HH:MM' 24-hour format e.g. '10:30'
    location TEXT,                      -- e.g. 'Room 302' or 'Zoom'
    color TEXT DEFAULT '#4F6DF5',
    course_id BIGINT,                   -- Optional course link
    lecturer_id BIGINT,                 -- Optional lecturer link
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY(lecturer_id) REFERENCES lecturers(id) ON DELETE SET NULL
);

-- 7. NOTES TABLE
-- Daily reflections, quick ideas, or lecture notes.
CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    mood TEXT DEFAULT 'neutral',        -- Mood tracking: 'happy', 'productive', 'neutral', 'tired', 'stressed'
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    updated_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. COURSES (LECTURES) TABLE
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code TEXT NOT NULL,                 -- e.g. 'IF-101'
    name TEXT NOT NULL,                 -- e.g. 'Pemrograman Dasar'
    credits INTEGER DEFAULT 3,          -- SKS / Credit units
    semester INTEGER DEFAULT 1,
    progress INTEGER DEFAULT 0,         -- 0 to 100% completion
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. LECTURERS TABLE
CREATE TABLE IF NOT EXISTS lecturers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    office TEXT,                        -- e.g. 'Gedung C R.301'
    phone TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category TEXT NOT NULL,             -- e.g. 'Makanan', 'Transport', 'Buku'
    amount DOUBLE PRECISION NOT NULL,   -- Monthly budget limit
    month_year TEXT NOT NULL,           -- YYYY-MM
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, category, month_year)
);

-- 11. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    description TEXT,
    expense_date TEXT NOT NULL,         -- YYYY-MM-DD
    wallet TEXT DEFAULT 'Cash',
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. ACADEMIC RESOURCES (BOOKS/JOURNALS) TABLE
CREATE TABLE IF NOT EXISTS resources (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    resource_type TEXT NOT NULL,        -- 'book', 'pdf', 'docx', 'journal', 'article'
    category TEXT DEFAULT 'general',    -- 'frontend', 'backend', 'general'
    url_or_path TEXT,                   -- Link to asset or document
    status TEXT DEFAULT 'unread',       -- 'unread', 'reading', 'completed'
    notes TEXT,
    year TEXT,                          -- Publication year for academic citations
    publisher TEXT,                     -- Publisher or journal name
    doi TEXT,                           -- Digital Object Identifier or ISBN
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. STUDY & PERFORMANCE LOGS TABLE
CREATE TABLE IF NOT EXISTS study_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_name TEXT NOT NULL,
    hours DOUBLE PRECISION NOT NULL,
    activity_type TEXT DEFAULT 'practice',  -- 'theory', 'practice', 'exam', 'lecture'
    log_date TEXT NOT NULL,                -- YYYY-MM-DD
    notes TEXT,
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. INCOMES TABLE
CREATE TABLE IF NOT EXISTS incomes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source TEXT NOT NULL,               -- e.g. 'Allowance', 'Salary', 'Freelance', 'Scholarship'
    amount DOUBLE PRECISION NOT NULL,
    description TEXT,
    income_date TEXT NOT NULL,          -- YYYY-MM-DD
    wallet TEXT DEFAULT 'Cash',
    recurring TEXT DEFAULT 'none',
    created_at TEXT DEFAULT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- LEARN: Indexes speed up SELECT queries on frequently filtered and joined columns.
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_done ON tasks(user_id, done);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_day ON events(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_lecturers_user ON lecturers(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_user ON study_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes(user_id, income_date);

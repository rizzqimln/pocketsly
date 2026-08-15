/**
 * HABITS & ROUTINES MODULE (habits.js)
 * =====================================
 * LEARN: State Management, Data Structures & Streak Algorithms
 *
 * 1. Set for O(1) Lookups  — We store completed dates in a Set so we can
 *                             check `logSet.has(date)` in constant time,
 *                             instead of looping through an array each time.
 * 2. Async Loop Pitfall     — `await` inside a `for...of` loop runs each
 *                             request sequentially. For large lists, switch
 *                             to Promise.all() to run them in parallel.
 * 3. Streak Algorithm       — We walk backwards from today, stopping at the
 *                             first missing day. This is a simple but correct
 *                             streak-counting approach.
 * 4. Module-Scope SVGs      — Defined once (DRY) rather than re-created inside
 *                             every render() call.
 */

// ── Module-level constants ───────────────────────────────────────────────────
// LEARN: Defining SVGs here means they are created once when the script loads,
// not on every render() call. This reduces garbage collection pressure.
const HABIT_SVG = {
  flame: `<svg class="icon-svg" style="width:1em; height:1em; stroke:var(--accent-warning);" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.17-.58-1.61L12 11.5l-.92 1.39c-.36.44-.58 1-.58 1.61z"/><path d="M12 2c1.78 2.67 4 5.33 4 8.5a6 6 0 0 1-12 0c0-3.17 2.22-5.83 4-8.5l4-2z"/></svg>`,
  check: `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  close: `<svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

window.Habits = {
  habitsList: [],

  async load() {
    try {
      this.habitsList = await API.get('/api/habits');
      this.render();
    } catch (err) {
      UI.toast('Failed to load habits.', 'danger');
    }
  },

  /**
   * Generates the last 7 calendar days as { iso, dayName } objects.
   *
   * LEARN: We calculate dates in JavaScript by mutating a Date object with
   * setDate(). Subtracting i days from today gives us the last 7 days.
   *
   * @returns {{ iso: string, dayName: string }[]}
   */
  _getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        iso:     d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      });
    }
    return days;
  },

  /**
   * Calculates the current streak (consecutive completed days up to today).
   *
   * LEARN: We use a Set for O(1) date lookups. If we used Array.includes(),
   * each lookup would be O(n), making this O(n*m) for n habits, m days.
   *
   * @param {Set<string>} logSet  set of completed ISO date strings
   * @returns {number}            consecutive streak count
   */
  _calcStreak(logSet) {
    let streak = 0;
    const d = new Date();
    // Walk backwards from today until we find a missing day
    while (logSet.has(d.toISOString().split('T')[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  },

  async render() {
    const container = document.getElementById('habits-list-container');
    if (!container) return;

    if (this.habitsList.length === 0) {
      container.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h3>No Habits Added Yet</h3>
          <p class="text-muted" style="margin: 0.5rem 0 0 0;">Consistency starts small. Add a habit like "Read 20 mins" or "Drink 2L Water".</p>
        </div>
      `;
      return;
    }

    const last7Days = this._getLast7Days();

    // Fetch all habit logs in parallel for instant responsiveness
    const habitLogsList = await Promise.all(
      this.habitsList.map(h => API.get(`/api/habits/${h.id}/logs`).catch(() => []))
    );

    const cardsHtml = this.habitsList.map((habit, idx) => {
      const logs = habitLogsList[idx] || [];
      const logSet = new Set(logs.filter(l => l.done).map(l => l.log_date));
      const streak = this._calcStreak(logSet);

      return `
        <div class="habit-card">
          <div class="habit-header">
            <div class="habit-info">
              <div class="habit-icon" style="background-color: ${UI.esc(habit.color || '#7C3AED')}15; color: ${UI.esc(habit.color || '#7C3AED')}">
                ${UI.esc(habit.icon || 'H')}
              </div>
              <div>
                <div class="habit-title">${UI.esc(habit.title)}</div>
                <div class="habit-streak">${HABIT_SVG.flame} ${streak} Day Streak</div>
              </div>
            </div>
            <button class="btn-icon text-muted habit-del-btn" onclick="Habits.deleteHabit(${habit.id})" title="Delete habit" aria-label="Delete habit">
              ${HABIT_SVG.close}
            </button>
          </div>

          <!-- Mini 7-Day Heatmap -->
          <div class="heatmap-mini">
            ${last7Days.map(day => {
              const isDone = logSet.has(day.iso);
              return `<div class="heatmap-day ${isDone ? 'completed' : ''}" title="${day.iso}: ${isDone ? 'Completed' : 'Missed'}">${day.dayName}</div>`;
            }).join('')}
          </div>

          <button class="habit-toggle-btn ${habit.today_done ? 'done' : ''}"
                  onclick="Habits.toggleToday(${habit.id}, ${!habit.today_done})"
                  title="${habit.today_done ? 'Completed today (click to uncheck)' : 'Mark as done for today'}">
            ${habit.today_done ? `${HABIT_SVG.check} Completed Today` : 'Mark Complete'}
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = cardsHtml;
  },

  async toggleToday(habitId, done) {
    try {
      const todayStr = UI.getTodayStr();
      await API.post(`/api/habits/${habitId}/log`, { date: todayStr, done });
      UI.toast(done ? 'Habit completed!' : 'Habit status updated', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit and its history?')) return;
    try {
      await API.delete(`/api/habits/${habitId}`);
      UI.toast('Habit deleted.', 'info');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openCreateModal() {
    const formHtml = `
      <form id="create-habit-form">
        <div class="form-group">
          <label for="habit-title">Habit Name</label>
          <input type="text" id="habit-title" required placeholder="e.g. Read 20 pages, Morning stretch">
        </div>
        <div class="form-group">
          <label for="habit-icon">Icon Tag (1-2 characters)</label>
          <input type="text" id="habit-icon" value="H" required maxlength="3" placeholder="e.g. R, W, EX">
        </div>
        <div class="form-group">
          <label for="habit-color">Accent Color</label>
          <input type="color" id="habit-color" value="#7C3AED">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Create Habit</button>
      </form>
    `;

    UI.openModal('New Habit / Routine', formHtml);

    document.getElementById('create-habit-form').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('habit-title').value;
      const icon = document.getElementById('habit-icon').value;
      const color = document.getElementById('habit-color').value;

      try {
        await API.post('/api/habits', { title, icon, color });
        UI.closeModal();
        UI.toast('Habit created!', 'success');
        this.load();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  },

  openQuickAddMenu() {
    const html = `
      <div style="display: flex; flex-direction: column; gap: 0.85rem; padding: 0.5rem 0;">
        <button type="button" class="btn btn-outline btn-block" onclick="UI.closeModal(); Habits.openCreateModal();" style="display: flex; align-items: center; gap: 0.85rem; padding: 1rem; text-align: left; border-radius: var(--radius-lg); font-weight: 700; font-size: 0.95rem; background: var(--bg-surface-alt); border-color: var(--border-color);">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.15); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Daily Habit</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.15rem;">Track recurring daily routines & streaks</div>
          </div>
        </button>
        <button type="button" class="btn btn-outline btn-block" onclick="UI.closeModal(); Tasks.openCreateModal();" style="display: flex; align-items: center; gap: 0.85rem; padding: 1rem; text-align: left; border-radius: var(--radius-lg); font-weight: 700; font-size: 0.95rem; background: var(--bg-surface-alt); border-color: var(--border-color);">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(245, 158, 11, 0.15); color: #F59E0B; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Priority Task</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.15rem;">Add a one-time todo or urgent deadline</div>
          </div>
        </button>
      </div>
    `;
    UI.openModal('Quick Add to Planner', html);
  }
};

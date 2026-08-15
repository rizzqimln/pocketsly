/**
 * DASHBOARD VIEW MODULE (dashboard.js)
 * =====================================
 * LEARN: Aggregated Views & Dynamic Content Rendering
 *
 * 1. Promise.all()     — Fetches all data sources in parallel instead of
 *                        sequentially. This can be 3× faster when each
 *                        request takes ~300ms.
 * 2. .catch() per item — Wrapping individual items with .catch(() => null)
 *                        means a single failing API won't break the whole
 *                        dashboard load.
 * 3. Helper Extraction — _getTimeOfDay(), _getMotivationalQuote(), and
 *                        _renderEmptyState() keep each render method focused
 *                        on its own data domain (Single Responsibility).
 * 4. Template Literals — Backtick strings (`) support multi-line HTML and
 *                        ${expression} interpolation without concatenation.
 */

window.Dashboard = {

  /**
   * Maps the current hour to a time-of-day greeting word.
   *
   * LEARN: Extracting this into a pure helper (no side effects) makes it
   * independently testable and readable at the call site.
   *
   * @param {number} hour  current hour (0–23)
   * @returns {'morning'|'afternoon'|'evening'}
   */
  _getTimeOfDay(hour) {
    if (hour >= 17) return 'evening';
    if (hour >= 12) return 'afternoon';
    return 'morning';
  },

  /**
   * Picks a random motivational quote from a curated pool.
   *
   * LEARN: Math.floor(Math.random() * array.length) is the standard way to
   * pick a random array index in JavaScript.
   *
   * @returns {string}
   */
  _getMotivationalQuote() {
    const quotes = [
      'Take a deep breath. One step at a time.',
      "You're doing great! Keep it cozy today.",
      'Make today warm and productive.',
      'Remember to drink water and take small breaks.',
      'A steady flow beats a rushed sprint.',
      "Cozy vibes only. Let's make progress!",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  },

  /**
   * Generates a consistent empty-state HTML block for dashboard sections.
   *
   * LEARN: Extracting repeated HTML structures into a factory function (DRY)
   * reduces copy-paste bugs and makes it easy to restyle all empty states.
   *
   * @param {string} message   description text
   * @param {string} btnLabel  action button label
   * @param {string} btnAction inline onclick value
   * @returns {string}         HTML string
   */
  _renderEmptyState(message, btnLabel, btnAction) {
    return `
      <div style="text-align: center; padding: 1.5rem 0;">
        <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.88rem;">${message}</p>
        <button class="btn btn-outline btn-sm" onclick="${btnAction}">${btnLabel}</button>
      </div>
    `;
  },

  async load() {
    try {
      // LEARN: Promise.all([...]) fires all requests simultaneously. Without it,
      // three sequential awaits would take 3× the round-trip time.
      const [dashData, notesData, budgetData] = await Promise.all([
        API.get('/api/dashboard'),
        API.get('/api/notes').catch(() => []),
        API.get('/api/budget/summary').catch(() => null),
      ]);

      const effectiveBudget = budgetData || dashData?.budget_summary || null;

      this.toggleOnboarding(dashData, notesData, effectiveBudget);
      this.renderGreeting(dashData.date);
      this.renderStats(dashData, effectiveBudget);
      this.renderHabits(dashData.habits);
      this.renderTasks(dashData.tasks);
      this.renderNotes(notesData);
      this.renderEvents(dashData.events);
      this.renderBudget(effectiveBudget);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      UI.toast('Failed to load dashboard data.', 'danger');
    }
  },

  /**
   * Shows the first-run onboarding panel when the user has no data yet, and
   * hides it once any module has activity. Purely presentational.
   */
  toggleOnboarding(dashData, notesData, budgetData) {
    const panel = document.getElementById('dash-onboarding-panel');
    if (!panel) return;

    const hasHabits = (dashData?.habits?.length ?? 0) > 0;
    const hasTasks  = (dashData?.tasks?.length  ?? 0) > 0;
    const hasEvents = (dashData?.events?.length ?? 0) > 0;
    const hasNotes  = (notesData?.length ?? 0) > 0;
    const hasBudget = (budgetData?.total_income ?? 0) > 0 || (budgetData?.total_expense ?? 0) > 0;
    const isNewUser = !hasHabits && !hasTasks && !hasEvents && !hasNotes && !hasBudget;

    document.getElementById('view-dashboard')?.classList.toggle('new-user', isNewUser);
  },

  renderGreeting(dateStr) {
    const greetingEl = document.getElementById('dash-greeting');
    const dateEl     = document.getElementById('dash-date-str');

    if (greetingEl) {
      const timeOfDay  = this._getTimeOfDay(new Date().getHours());
      greetingEl.textContent = `Good ${timeOfDay}`;
    }

    if (dateEl) {
      const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const quote = this._getMotivationalQuote();
      dateEl.innerHTML = `${formattedDate} <span class="cozy-quote" style="display: block; margin-top: 0.35rem; font-style: italic; font-weight: 500; color: var(--primary-text); font-size: 0.88rem;">${quote}</span>`;
    }
  },

  renderStats(data, budgetData) {
    const habitCount = data.habits ? data.habits.length : 0;
    const completedHabits = data.habits ? data.habits.filter(h => h.today_done).length : 0;
    const pendingTasks = data.tasks ? data.tasks.length : 0;
    const eventCount = data.events ? data.events.length : 0;

    const habitValEl = document.getElementById('dash-kpi-habits-val');
    const habitSubEl = document.getElementById('dash-kpi-habits-sub');
    const taskValEl = document.getElementById('dash-kpi-tasks-val');
    const taskSubEl = document.getElementById('dash-kpi-tasks-sub');
    const eventValEl = document.getElementById('dash-kpi-events-val');
    const eventSubEl = document.getElementById('dash-kpi-events-sub');
    const budgetValEl = document.getElementById('dash-kpi-budget-val');
    const budgetSubEl = document.getElementById('dash-kpi-budget-sub');

    if (habitValEl) habitValEl.textContent = `${completedHabits} / ${habitCount}`;
    if (habitSubEl) {
      const pct = habitCount > 0 ? Math.round((completedHabits / habitCount) * 100) : 0;
      habitSubEl.textContent = `${pct}% Done`;
    }

    if (taskValEl) taskValEl.textContent = `${pendingTasks}`;
    if (taskSubEl) {
      taskSubEl.textContent = pendingTasks === 0 ? 'All Clear' : `${pendingTasks} Priority`;
    }

    if (eventValEl) eventValEl.textContent = `${eventCount}`;
    if (eventSubEl) {
      eventSubEl.textContent = eventCount === 0 ? 'Free Day' : `${eventCount} Scheduled`;
    }
    
    if (budgetValEl && budgetData) {
      const net = (budgetData.total_income || 0) - (budgetData.total_expense || 0);
      const isPositive = net >= 0;
      const formattedAmt = window.Budget ? window.Budget.formatCurrency(Math.abs(net)) : Math.abs(net).toLocaleString('en-US');
      budgetValEl.textContent = `${isPositive ? '+' : '-'} ${formattedAmt}`;
      budgetValEl.style.color = isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)';
      if (budgetSubEl) {
        budgetSubEl.textContent = isPositive ? 'Surplus' : 'Deficit';
        budgetSubEl.style.color = isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)';
        budgetSubEl.style.background = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      }
    }
  },

  renderHabits(habits) {
    const container = document.getElementById('dash-habits-list');
    if (!container) return;

    if (!habits || habits.length === 0) {
      container.innerHTML = this._renderEmptyState(
        'No habits added yet.',
        'Create your first habit &rarr;',
        'Habits.openCreateModal()'
      );
      return;
    }

    const checkIcon = `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${habits.map(h => `
          <div class="task-item" style="margin-bottom: 0; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div class="task-left" style="display: flex; align-items: center; gap: 0.65rem;">
              <div class="habit-icon" style="width: 32px; height: 32px; font-size: 0.85rem; background-color: ${UI.esc(h.color || '#7C3AED')}15; color: ${UI.esc(h.color || '#7C3AED')}">
                ${UI.esc(h.icon || 'H')}
              </div>
              <span class="task-title" style="font-weight: 600; font-size: 0.88rem;">${UI.esc(h.title)}</span>
            </div>
            <button class="habit-toggle-btn ${h.today_done ? 'done' : ''}" 
                    onclick="Dashboard.toggleHabit(${h.id}, ${!h.today_done})">
              ${h.today_done ? `${checkIcon} Done` : 'Check Off'}
            </button>
          </div>
        `).join('')}
      </div>
    `;
  },

  async toggleHabit(habitId, done) {
    try {
      const todayStr = UI.getTodayStr();
      await API.post(`/api/habits/${habitId}/log`, { date: todayStr, done });
      UI.toast(done ? 'Habit completed!' : 'Habit uncompleted', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  renderTasks(tasks) {
    const container = document.getElementById('dash-tasks-list');
    if (!container) return;

    if (!tasks || tasks.length === 0) {
      container.innerHTML = this._renderEmptyState(
        'All clear! No pending focus tasks.',
        'Add focus task &rarr;',
        'Tasks.openCreateModal()'
      );
      return;
    }

    const checkSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${tasks.map(t => `
          <div class="task-item" style="margin-bottom: 0; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div class="task-left" style="display: flex; align-items: center; gap: 0.75rem;">
              <div class="checkbox-custom ${t.done ? 'checked' : ''}" 
                   onclick="Dashboard.toggleTask(${t.id}, ${!t.done})">
                ${t.done ? checkSvg : ''}
              </div>
              <div class="task-details">
                <span class="task-title" style="font-weight: 600; font-size: 0.88rem;">${UI.esc(t.title)}</span>
                <div class="task-meta" style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.2rem;">
                  <span class="priority-badge priority-${t.priority}" style="font-size: 0.68rem;">${t.priority}</span>
                  ${t.due_date ? `<span style="font-size: 0.75rem; color: var(--text-muted);">Due ${UI.formatDate(t.due_date)}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async toggleTask(taskId, done) {
    try {
      await API.patch(`/api/tasks/${taskId}`, { done });
      UI.toast(done ? 'Task completed!' : 'Task reopened', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  renderNotes(notes) {
    const container = document.getElementById('dash-notes-preview');
    if (!container) return;

    if (!notes || notes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1rem 0;">
          <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.85rem;">No recent notes or reflections yet.</p>
          <button class="btn btn-outline btn-sm" onclick="Notes.startNewNote()">+ Write quick note</button>
        </div>
      `;
      return;
    }

    const recent = notes.slice(0, 3);
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${recent.map(n => `
          <div onclick="App.navigateTo('notes')" style="cursor: pointer; padding: 0.75rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); transition: all 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">${UI.esc(n.title || 'Untitled Note')}</span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">${UI.formatDate(n.updated_at || n.created_at)}</span>
            </div>
            <p class="text-muted" style="margin: 0; font-size: 0.8rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${UI.esc(n.body ? n.body.replace(/<[^>]*>?/gm, '') : 'No additional content...')}
            </p>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderEvents(events) {
    const container = document.getElementById('dash-events-list');
    if (!container) return;

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 0;">
          <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.85rem;">No classes or blocks scheduled today.</p>
          <button class="btn btn-outline btn-sm" onclick="Schedule.openCreateModal()">+ Add timetable block</button>
        </div>
      `;
      return;
    }

    const clockSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const mapSvg = `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.6rem;">
        ${events.map(e => `
          <div class="event-block" style="border-left-color: ${UI.esc(e.color || 'var(--primary)')}; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); background: var(--bg-surface-alt); border: 1px solid var(--border-color); border-left-width: 4px;">
            <div class="event-title" style="font-weight: 700; font-size: 0.88rem;">${UI.esc(e.title)}</div>
            <div class="event-time" style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.2rem;">
              ${clockSvg} ${UI.esc(e.start_time)} - ${UI.esc(e.end_time)}
              ${e.location ? ` &bull; ${mapSvg} ${UI.esc(e.location)}` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderBudget(budgetData) {
    const container = document.getElementById('dash-budget-summary');
    if (!container) return;

    if (!budgetData) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.25rem 0;">
          <p class="text-muted" style="margin-bottom: 0.75rem; font-size: 0.85rem;">No financial data logged this month.</p>
          <button class="btn btn-outline btn-sm" onclick="Budget.openLogModal('income')">+ Start Cashflow</button>
        </div>
      `;
      return;
    }

    const income = budgetData.total_income || 0;
    const expense = budgetData.total_expense || 0;
    const balance = income - expense;
    const isPositive = balance >= 0;

    const formattedBalance = window.Budget ? window.Budget.formatCurrency(Math.abs(balance)) : Math.abs(balance).toLocaleString('en-US');
    const formattedIncome = window.Budget ? window.Budget.formatCurrency(income) : income.toLocaleString('en-US');
    const formattedExpense = window.Budget ? window.Budget.formatCurrency(expense) : expense.toLocaleString('en-US');

    container.innerHTML = `
      <div>
        <div style="padding: 0.9rem 1rem; border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%); border: 1px solid var(--border-color); margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">Net Balance</span>
            <span class="stat-pill" style="background: ${isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)'}; font-size: 0.7rem;">
              ${isPositive ? '↗ Positive' : '↘ Deficit'}
            </span>
          </div>
          <div style="font-size: 1.35rem; font-weight: 800; color: ${isPositive ? 'var(--accent-success-strong)' : 'var(--accent-danger-strong)'}; margin-top: 0.25rem; letter-spacing: -0.02em;">
            ${isPositive ? '+' : '-'} ${formattedBalance}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <div style="background: rgba(16, 185, 129, 0.08); border-radius: var(--radius-md); padding: 0.6rem 0.75rem; border: 1px solid rgba(16, 185, 129, 0.2);">
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-success-strong); text-transform: uppercase; display: flex; align-items: center; gap: 0.3rem;">
              <span>↓</span> Income
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--accent-success-strong); margin-top: 0.2rem;">${formattedIncome}</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.08); border-radius: var(--radius-md); padding: 0.6rem 0.75rem; border: 1px solid rgba(239, 68, 68, 0.2);">
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--accent-danger-strong); text-transform: uppercase; display: flex; align-items: center; gap: 0.3rem;">
              <span>↑</span> Expense
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--accent-danger-strong); margin-top: 0.2rem;">${formattedExpense}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-outline btn-sm" onclick="Budget.openLogModal('income')" style="flex: 1; font-size: 0.78rem; padding: 0.4rem 0.5rem; justify-content: center;">+ Income</button>
          <button class="btn btn-outline btn-sm" onclick="Budget.openLogModal('expense')" style="flex: 1; font-size: 0.78rem; padding: 0.4rem 0.5rem; justify-content: center;">- Expense</button>
        </div>
      </div>
    `;
  },

  openLogCashFlowModal() {
    const html = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 0.25rem 0;">
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Budget.openLogModal('income');">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.15); color: #10B981; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">Log Income</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Record salary, allowance, or freelance revenue</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Budget.openLogModal('expense');">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.15); color: var(--accent-danger); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">Log Expense</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Track daily spending, food, bills &amp; books</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Habits.openCreateModal();">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.15); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Habit / Routine</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Track daily routines and streaks</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Tasks.openCreateModal();">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(245, 158, 11, 0.15); color: #F59E0B; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">New Priority Task</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Add a deadline or one-time todo</div>
          </div>
        </button>
        <button type="button" class="modal-option-card" onclick="UI.closeModal(); Notes.startNewNote();">
          <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.15); color: var(--primary-500); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </div>
          <div>
            <div style="color: var(--text-primary); font-size: 0.95rem; font-weight: 700;">Quick Journal Note</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-top: 0.1rem;">Capture thoughts, reflections &amp; ideas</div>
          </div>
        </button>
      </div>
    `;
    UI.openModal('Quick Actions & Log Cash Flow', html);
  }
};

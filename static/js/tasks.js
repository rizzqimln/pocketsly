/**
 * TASKS MODULE (tasks.js)
 * ========================
 * LEARN: Client-Side Filtering & Partial Updates
 *
 * 1. Client-Side Filter  — We fetch all tasks once, then filter the in-memory
 *                          array. This avoids a new API call on every filter
 *                          click, making the UI feel instant.
 * 2. PATCH vs PUT        — PATCH sends only the changed fields (e.g. `done`).
 *                          PUT replaces the whole resource. Always prefer PATCH
 *                          for partial updates to avoid unintended data loss.
 * 3. Guard Clause        — Returning early from render() when the container
 *                          doesn't exist prevents null-reference errors.
 * 4. Array.filter()      — Returns a new array without mutating the original.
 *                          We keep `tasksList` intact and filter on the fly.
 */

// ── Module-level SVG icons ─────────────────────────────────────────────────
const TASK_SVG = {
  check:    `<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  calendar: `<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  trash:    `<svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

window.Tasks = {
  tasksList: [],
  currentFilter: 'all',

  async load() {
    try {
      this.tasksList = await API.get('/api/tasks');
      this.initFilters();
      this.render();
    } catch (err) {
      UI.toast('Failed to load tasks.', 'danger');
    }
  },

  initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const counts = {
      all: this.tasksList.length,
      high: this.tasksList.filter(t => t.priority === 'high').length,
      pending: this.tasksList.filter(t => !t.done).length,
      completed: this.tasksList.filter(t => t.done).length,
    };

    filterBtns.forEach(btn => {
      const f = btn.getAttribute('data-filter');
      const count = counts[f] ?? 0;
      const label = f.charAt(0).toUpperCase() + f.slice(1);
      btn.innerHTML = `${label === 'Completed' ? 'Done' : label} <span class="filter-count" style="opacity:0.75; font-size:0.75rem; font-family:var(--font-mono); margin-left:3px;">(${count})</span>`;
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = f;
        this.render();
      };
    });
  },

  /**
   * Filters the task list by the current active filter.
   *
   * LEARN: Returning a new filtered array (not mutating tasksList) is the
   * "pure function" approach. It makes the filter logic easy to test and
   * trivial to reverse when the filter changes.
   *
   * @param {object[]} tasks   full task list
   * @param {string}   filter  'all' | 'high' | 'pending' | 'completed'
   * @returns {object[]}
   */
  _applyFilter(tasks, filter) {
    if (filter === 'high')      return tasks.filter(t => t.priority === 'high');
    if (filter === 'pending')   return tasks.filter(t => !t.done);
    if (filter === 'completed') return tasks.filter(t => t.done);
    return tasks; // 'all'
  },

  render() {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    // Update sidebar task counter
    const pendingCount = this.tasksList.filter(t => !t.done).length;
    const counterEl = document.getElementById('nav-counter-tasks');
    if (counterEl) {
      if (pendingCount > 0) {
        counterEl.textContent = pendingCount;
        counterEl.classList.remove('hidden');
      } else {
        counterEl.classList.add('hidden');
      }
    }

    this.initFilters();
    const visibleTasks = this._applyFilter(this.tasksList, this.currentFilter);

    if (visibleTasks.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <h3>No Tasks Found</h3>
          <p class="text-muted" style="margin: 0.5rem 0 0 0;">Clear filter or create a task to get started.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = visibleTasks.map(t => `
      <div class="task-item ${t.done ? 'done' : ''}">
        <div class="task-left">
          <div class="checkbox-custom ${t.done ? 'checked' : ''}"
               onclick="Tasks.toggleDone(${t.id}, ${!t.done})">
            ${t.done ? TASK_SVG.check : ''}
          </div>
          <div class="task-details">
            <span class="task-title">${UI.esc(t.title)}</span>
            ${t.details ? `<p class="text-muted" style="font-size: 0.85rem; margin-top: 0.2rem;">${UI.esc(t.details)}</p>` : ''}
            <div class="task-meta" style="margin-top: 0.4rem;">
              <span class="priority-badge priority-${t.priority}">${t.priority}</span>
              ${t.due_date ? `<span>${TASK_SVG.calendar} Due ${UI.formatDate(t.due_date)}</span>` : ''}
            </div>
          </div>
        </div>
        <button class="btn-icon text-muted" onclick="Tasks.deleteTask(${t.id})" title="Delete task">${TASK_SVG.trash}</button>
      </div>
    `).join('');
  },

  async toggleDone(taskId, done) {
    try {
      await API.patch(`/api/tasks/${taskId}`, { done });
      UI.toast(done ? 'Task marked completed!' : 'Task reopened', 'success');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    try {
      await API.delete(`/api/tasks/${taskId}`);
      UI.toast('Task deleted.', 'info');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openCreateModal() {
    const todayISO = UI.getTodayStr();
    const formHtml = `
      <form id="create-task-form">
        <div class="form-group">
          <label for="task-title">Task Title</label>
          <input type="text" id="task-title" required placeholder="e.g. Finish Calculus Chapter 4 assignment">
        </div>
        <div class="form-group">
          <label for="task-details">Details / Subtasks (Optional)</label>
          <textarea id="task-details" rows="3" placeholder="Add extra notes or steps..."></textarea>
        </div>
        <div class="form-group">
          <label for="task-priority">Priority Level</label>
          <select id="task-priority">
            <option value="low">Low Priority</option>
            <option value="medium" selected>Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
        <div class="form-group">
          <label for="task-due">Due Date</label>
          <input type="date" id="task-due" value="${todayISO}">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Add Task</button>
      </form>
    `;

    UI.openModal('New Focus Task', formHtml);

    document.getElementById('create-task-form').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title').value;
      const details = document.getElementById('task-details').value;
      const priority = document.getElementById('task-priority').value;
      const due_date = document.getElementById('task-due').value;

      try {
        await API.post('/api/tasks', { title, details, priority, due_date });
        UI.closeModal();
        UI.toast('Task added successfully!', 'success');
        this.load();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  }
};

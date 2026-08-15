/**
 * TIMETABLE & SCHEDULE MODULE (schedule.js)
 * ==========================================
 * LEARN: 2D Data Mapping for Weekly Schedules
 *
 * 1. Day-Index Mapping  — JavaScript's Date.getDay() returns 0=Sunday, 6=Saturday.
 *                          We normalise with (getDay() + 6) % 7 to get 0=Monday,
 *                          which matches how students think about their week.
 * 2. Mobile Day Switcher — On small screens, one day column fills the viewport.
 *                          We conditionally show/hide columns via CSS classes.
 * 3. insertBefore()      — Inserting the day-nav pill bar before the main container
 *                          (not inside it) keeps the layout flexible and avoids
 *                          nesting containers unnecessarily.
 * 4. Module-Scope Data   — DAYS and SCHEDULE_SVG defined once, reused every render.
 */

// ── Module-level constants ──────────────────────────────────────────────────
// LEARN: Defining DAYS at module scope means it is created once, not on every
// render() call. Object.freeze() makes it truly immutable (read-only).
const DAYS = Object.freeze([
  { id: 0, name: 'Monday',    short: 'Mon' },
  { id: 1, name: 'Tuesday',   short: 'Tue' },
  { id: 2, name: 'Wednesday', short: 'Wed' },
  { id: 3, name: 'Thursday',  short: 'Thu' },
  { id: 4, name: 'Friday',    short: 'Fri' },
  { id: 5, name: 'Saturday',  short: 'Sat' },
  { id: 6, name: 'Sunday',    short: 'Sun' },
]);

const SCHEDULE_SVG = {
  clock: `<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  map:   `<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  close: `<svg class="icon-svg" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

window.Schedule = {
  eventsList: [],
  // LEARN: (new Date().getDay() + 6) % 7 converts JS Sunday=0 to Monday=0.
  activeMobileDay: (new Date().getDay() + 6) % 7,
  viewMode: 'day', // 'day' or 'week' on mobile

  async load() {
    try {
      this.eventsList = await API.get('/api/events');
      this.render();
    } catch (err) {
      UI.toast('Failed to load schedule.', 'danger');
    }
  },

  setMobileDay(dayId) {
    this.activeMobileDay = dayId;
    this.viewMode = 'day';
    this.render();
  },

  toggleViewMode(mode) {
    this.viewMode = mode;
    this.render();
  },

  /**
   * Builds the mobile day-switcher pill bar HTML.
   *
   * LEARN: Extracting this into a helper keeps render() shorter and focused
   * on layout assembly, not pill rendering detail.
   *
   * @param {number} todayIndex  today's day index (0=Mon, 6=Sun)
   * @returns {string}           HTML string for the pill scroll container
   */
  _renderDayPills(todayIndex) {
    const pillsHtml = DAYS.map(d => {
      const count      = this.eventsList.filter(e => Number(e.day_of_week) === d.id).length;
      const isSelected = this.viewMode === 'day' && this.activeMobileDay === d.id;
      const isToday    = d.id === todayIndex;
      return `
        <button type="button" class="day-pill-btn ${isSelected ? 'active' : ''} ${isToday ? 'today-pill' : ''}"
                onclick="Schedule.setMobileDay(${d.id})">
          <span class="day-pill-name">${d.short}</span>
          ${count > 0 ? `<span class="day-pill-badge">${count}</span>` : ''}
          ${isToday    ? `<span class="day-pill-dot"></span>` : ''}
        </button>
      `;
    }).join('');

    return `
      <div class="timetable-pill-scroll" style="display: flex; align-items: center; gap: 0.35rem; width: 100%;">
        ${pillsHtml}
        <button type="button" class="day-pill-btn ${this.viewMode === 'week' ? 'active' : ''}" onclick="Schedule.toggleViewMode('week')">
          <span class="day-pill-name">All (Week)</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="Schedule.openCreateModal()" style="margin-left: auto; padding: 0.35rem 0.75rem; border-radius: var(--radius-full); font-weight: 700; white-space: nowrap; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;">
          <span>+</span> Block
        </button>
      </div>
    `;
  },

  render() {
    const container = document.getElementById('timetable-container');
    if (!container) return;

    // LEARN: (getDay() + 6) % 7 normalises JS's Sunday=0 to Monday=0.
    const todayIndex = (new Date().getDay() + 6) % 7;

    // Render or reuse the mobile day-switcher pill bar
    let daySelectorEl = document.getElementById('timetable-mobile-nav');
    if (!daySelectorEl) {
      daySelectorEl = document.createElement('div');
      daySelectorEl.id        = 'timetable-mobile-nav';
      daySelectorEl.className = 'timetable-mobile-nav';
      // LEARN: insertBefore(newEl, referenceEl) inserts before the reference node.
      // container.parentNode is the wrapper that holds both the nav and the grid.
      container.parentNode.insertBefore(daySelectorEl, container);
    }
    daySelectorEl.innerHTML = this._renderDayPills(todayIndex);

    let html = '';
    for (const day of DAYS) {
      const isToday       = day.id === todayIndex;
      const isMobileActive = this.viewMode === 'week' || this.activeMobileDay === day.id;
      const dayEvents     = this.eventsList.filter(e => Number(e.day_of_week) === day.id);

      html += `
        <div class="day-column ${isToday ? 'today' : ''} ${isMobileActive ? 'mobile-visible' : 'mobile-hidden'}" data-day="${day.id}">
          <div class="day-header">
            <span>${day.name}</span>
            ${isToday ? '<span class="today-tag">&bull; Today</span>' : ''}
          </div>
          <div class="day-events">
            ${dayEvents.length === 0 ? `
              <div class="empty-day-slot" onclick="Schedule.openCreateModalForDay(${day.id})" style="cursor: pointer; text-align: center; padding: 1.5rem 0.5rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md); transition: var(--transition-smooth); margin-top: 0.5rem;" title="Click to add a schedule block for ${day.name}">
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">+ Add block</span>
              </div>
            ` : ''}
            ${dayEvents.map(e => `
              <div class="event-block" style="border-left-color: ${UI.esc(e.color || '#7C3AED')}; margin-bottom: 0.5rem; position: relative;">
                <div class="event-title">${UI.esc(e.title)}</div>
                <div class="event-time">${SCHEDULE_SVG.clock} ${UI.esc(e.start_time)} - ${UI.esc(e.end_time)}</div>
                ${e.location ? `<div class="event-time">${SCHEDULE_SVG.map} ${UI.esc(e.location)}</div>` : ''}
                <button class="btn-icon" style="position: absolute; top: 4px; right: 4px; padding: 2px;"
                        onclick="Schedule.deleteEvent(${e.id})" title="Delete event">${SCHEDULE_SVG.close}</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  openCreateModalForDay(dayId) {
    this.openCreateModal(dayId);
  },

  async deleteEvent(eventId) {
    if (!confirm('Remove this schedule block?')) return;
    try {
      await API.delete(`/api/events/${eventId}`);
      UI.toast('Schedule block removed.', 'info');
      this.load();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openCreateModal(defaultDay = null) {
    const selectedDay = defaultDay !== null ? Number(defaultDay) : 0;
    const formHtml = `
      <form id="create-event-form">
        <div class="form-group">
          <label for="event-title">Title (Class or Session)</label>
          <input type="text" id="event-title" required placeholder="e.g. CS101 Lecture, Gym Focus Block">
        </div>
        <div class="form-group">
          <label for="event-day">Day of Week</label>
          <select id="event-day">
            <option value="0" ${selectedDay === 0 ? 'selected' : ''}>Monday</option>
            <option value="1" ${selectedDay === 1 ? 'selected' : ''}>Tuesday</option>
            <option value="2" ${selectedDay === 2 ? 'selected' : ''}>Wednesday</option>
            <option value="3" ${selectedDay === 3 ? 'selected' : ''}>Thursday</option>
            <option value="4" ${selectedDay === 4 ? 'selected' : ''}>Friday</option>
            <option value="5" ${selectedDay === 5 ? 'selected' : ''}>Saturday</option>
            <option value="6" ${selectedDay === 6 ? 'selected' : ''}>Sunday</option>
          </select>
        </div>
        <div style="display: flex; gap: 1rem;">
          <div class="form-group" style="flex: 1;">
            <label for="event-start">Start Time</label>
            <input type="time" id="event-start" value="09:00" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="event-end">End Time</label>
            <input type="time" id="event-end" value="10:30" required>
          </div>
        </div>
        <div class="form-group">
          <label for="event-loc">Location / Link (Optional)</label>
          <input type="text" id="event-loc" placeholder="e.g. Science Building Rm 204 or Zoom">
        </div>
        <div class="form-group">
          <label for="event-color">Color Identifier</label>
          <input type="color" id="event-color" value="#7C3AED">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Save to Timetable</button>
      </form>
    `;

    UI.openModal('Add Schedule Block', formHtml);

    document.getElementById('create-event-form').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('event-title').value;
      const day_of_week = document.getElementById('event-day').value;
      const start_time = document.getElementById('event-start').value;
      const end_time = document.getElementById('event-end').value;
      const location = document.getElementById('event-loc').value;
      const color = document.getElementById('event-color').value;

      try {
        await API.post('/api/events', { title, day_of_week, start_time, end_time, location, color });
        UI.closeModal();
        UI.toast('Schedule block added!', 'success');
        this.load();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  }
};

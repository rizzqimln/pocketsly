/**
 * COMMAND PALETTE MODULE (command_palette.js)
 * ============================================
 * LEARN: Spotlight Search & Keyboard Shortcut Architecture
 *
 * 1. Global Keyboard Hook — Listening to 'keydown' for (e.metaKey || e.ctrlKey) && e.key === 'k'
 *                           intercepts the standard browser shortcut to open the spotlight modal.
 * 2. Search Indexing      — Commands are structured with { id, title, category, icon, action, keywords }.
 * 3. Keyboard Navigation  — Up/Down arrows adjust activeIndex, and Enter executes the action.
 * 4. Micro-Interactions   — Highlighting search matches and closing seamlessly on Escape or backdrop click.
 */

const CommandPalette = {
  isOpen: false,
  activeIndex: 0,
  currentCategory: 'all',
  currentQuery: '',
  filteredItems: [],
  debounceTimer: null,

  onInputDebounced(val) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.filter(val);
    }, 60);
  },

  /** Static list of global system commands and view routes */
  getSystemCommands() {
    return [
      // ── Navigation ────────────────────────────────────────────────────────
      { id: 'nav-dash', title: 'Go to Dashboard', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>', action: () => window.App?.navigateTo('dashboard'), keywords: 'home stats overview' },
      { id: 'nav-habits', title: 'Go to Daily Planner (Habits & Tasks)', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', action: () => window.App?.navigateTo('habits'), keywords: 'habits tasks todos routine streak' },
      { id: 'nav-schedule', title: 'Go to Weekly Timetable', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>', action: () => window.App?.navigateTo('schedule'), keywords: 'timetable schedule classes calendar' },
      { id: 'nav-notes', title: 'Go to Journal & Notes', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.switchTab('notes'), 50); }, keywords: 'notes journal thoughts reflections study' },
      { id: 'nav-library', title: 'Go to Library & Academic Journals', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.switchTab('library'), 50); }, keywords: 'library journals books papers research articles reading' },
      { id: 'nav-curriculum', title: 'Go to Curriculum Lab & GPA', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', action: () => window.App?.navigateTo('curriculum'), keywords: 'curriculum lab gpa grade sql algorithms courses' },
      { id: 'nav-budget', title: 'Go to Monthly Budget Tracker', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>', action: () => window.App?.navigateTo('budget'), keywords: 'budget finance expenses income money cash' },
      { id: 'nav-profile', title: 'Open Profile Settings', category: 'Navigation', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', action: () => window.App?.openProfileSettings(), keywords: 'profile settings account password backup' },

      // ── Quick Actions ─────────────────────────────────────────────────────
      { id: 'act-habit', title: 'Create New Habit', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', action: () => window.Habits?.openCreateModal(), keywords: 'new habit routine create add' },
      { id: 'act-task', title: 'Create New Focus Task', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>', action: () => window.Tasks?.openCreateModal(), keywords: 'new task todo item priority' },
      { id: 'act-note', title: 'Create New Note', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.startNewNote(), 50); }, keywords: 'new note write journal' },
      { id: 'act-resource', title: 'Add Resource to Academic Library', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', action: () => { window.App?.navigateTo('notes'); setTimeout(() => window.Notes?.switchTab('library'), 50); }, keywords: 'new book paper journal resource library' },
      { id: 'act-block', title: 'Add Timetable Schedule Block', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', action: () => window.Schedule?.openCreateModal(), keywords: 'new event class block schedule' },
      { id: 'act-pomo', title: 'Open Pomodoro Focus Timer', category: 'Actions', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="15" y2="15"/></svg>', action: () => window.Timer?.openModal(), keywords: 'pomodoro timer focus clock study work' },
      { id: 'act-export-csv', title: 'Export Monthly Budget to CSV', category: 'Finance', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="12" x2="12" y2="3"/></svg>', action: () => window.Budget?.exportCSV(), keywords: 'export csv budget financial download spreadsheet' },
      { id: 'act-print-fin', title: 'Print Financial Summary Report', category: 'Finance', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>', action: () => window.Budget?.printReport(), keywords: 'print pdf budget financial ledger report' },
      { id: 'act-backup', title: 'Download JSON Data Backup', category: 'System', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>', action: () => window.App?.exportBackup(), keywords: 'backup export json save download data' },
      { id: 'act-theme', title: 'Toggle Light / Dark Theme', category: 'System', icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>', action: () => window.UI?.toggleTheme(), keywords: 'theme dark light mode switch appearance' },
    ];
  },

  init() {
    // Global hotkey listener (Cmd+K on Mac, Ctrl+K on Windows/Linux)
    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isK = e.key?.toLowerCase() === 'k' || e.code === 'KeyK';

      if (isCmdOrCtrl && isK) {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });
  },

  setCategory(cat) {
    this.currentCategory = cat;
    const pills = document.querySelectorAll('.palette-filter-pill');
    pills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-cat') === cat);
    });
    this.filter(this.currentQuery || '');
  },

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  },

  open() {
    this.isOpen = true;
    this.currentCategory = 'all';
    this.currentQuery = '';
    const pills = document.querySelectorAll('.palette-filter-pill');
    pills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-cat') === 'all');
    });
    const overlay = document.getElementById('command-palette-overlay');
    const input = document.getElementById('command-palette-input');
    if (overlay) {
      document.body.classList.add('modal-open');
      overlay.classList.remove('hidden');
    }
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }
    this.filter('');
  },

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('command-palette-overlay');
    if (overlay) {
      document.body.classList.remove('modal-open');
      overlay.classList.add('hidden');
    }
  },

  /** Filters available commands and user content by search query */
  filter(query) {
    this.currentQuery = query;
    const q = query.trim().toLowerCase();
    let commands = [...this.getSystemCommands()];

    // Add dynamic task search results
    if (window.Tasks?.tasksList) {
      window.Tasks.tasksList.forEach(t => {
        commands.push({
          id: `task-${t.id}`,
          title: `Task: ${t.title}`,
          category: 'Tasks',
          icon: t.done ? '<svg class="icon-svg" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' : '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>',
          action: () => {
            window.App?.navigateTo('habits');
          },
          keywords: `task ${t.title} ${t.priority || ''}`
        });
      });
    }

    // Add dynamic note search results
    if (window.Notes?.notesList) {
      window.Notes.notesList.forEach(n => {
        commands.push({
          id: `note-${n.id}`,
          title: `Note: ${n.title || 'Untitled'}`,
          category: 'Notes',
          icon: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
          action: () => {
            window.App?.navigateTo('notes');
            window.Notes?.selectNote(n.id);
          },
          keywords: `note ${n.title || ''} ${n.body || ''} ${n.mood || ''}`
        });
      });
    }

    // Apply category filter if not 'all'
    if (this.currentCategory && this.currentCategory !== 'all') {
      commands = commands.filter(item => item.category?.toLowerCase() === this.currentCategory.toLowerCase());
    }

    if (!q) {
      this.filteredItems = commands;
    } else {
      this.filteredItems = commands.filter(item => {
        const text = `${item.title} ${item.category} ${item.keywords || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    this.activeIndex = 0;
    this.render();
  },

  handleKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.filteredItems.length > 0) {
        this.activeIndex = (this.activeIndex + 1) % this.filteredItems.length;
        this.render();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.filteredItems.length > 0) {
        this.activeIndex = (this.activeIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
        this.render();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.executeActive();
    }
  },

  executeActive() {
    const item = this.filteredItems[this.activeIndex];
    if (item && item.action) {
      this.close();
      item.action();
    }
  },

  selectItem(index) {
    this.activeIndex = index;
    this.executeActive();
  },

  render() {
    const listEl = document.getElementById('command-palette-results');
    if (!listEl) return;

    if (this.filteredItems.length === 0) {
      listEl.innerHTML = `
        <div class="palette-empty" style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.88rem;">
          No matching commands or items found.
        </div>
      `;
      return;
    }

    // Group items by category
    const groups = {};
    this.filteredItems.forEach((item, idx) => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ item, globalIdx: idx });
    });

    let html = '';
    for (const [catName, entries] of Object.entries(groups)) {
      html += `<div class="palette-group-title">${UI.esc(catName)}</div>`;
      for (const { item, globalIdx } of entries) {
        const isSelected = globalIdx === this.activeIndex;
        html += `
          <div class="palette-item ${isSelected ? 'selected' : ''}" onclick="CommandPalette.selectItem(${globalIdx})" onmouseenter="CommandPalette.activeIndex = ${globalIdx}; CommandPalette.renderSelectedOnly();">
            <span class="palette-item-icon">${item.icon}</span>
            <span class="palette-item-title">${UI.esc(item.title)}</span>
            <span class="palette-item-cat">${UI.esc(item.category)}</span>
          </div>
        `;
      }
    }

    listEl.innerHTML = html;

    // Ensure selected item is scrolled into view
    const selectedEl = listEl.querySelector('.palette-item.selected');
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  },

  renderSelectedOnly() {
    const items = document.querySelectorAll('.palette-item');
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === this.activeIndex);
    });
  }
};

// Export to window for global invocation across modules
window.CommandPalette = CommandPalette;

// Initialize listener on DOM ready
document.addEventListener('DOMContentLoaded', () => CommandPalette.init());

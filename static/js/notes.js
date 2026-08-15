/**
 * JOURNAL & NOTES MODULE (notes.js)
 * ===================================
 * LEARN: Master-Detail Layouts, Real-Time Filtering & Mobile-First UX
 *
 * 1. Mobile List/Editor State — On mobile screens (<768px), notes behave like
 *                               Apple Notes: browsing a full card list, and
 *                               transitioning to full-width editor on tap.
 * 2. Real-Time Search & Tag Filter — Client-side fuzzy search across title & body.
 * 3. Live Word/Char Counter — Calculated on keyup/input in note-body-input.
 * 4. Active Selection State — `activeNoteId` is the single source of truth.
 */

const MOOD_LABELS = {
  productive: 'Productive',
  happy:      'Positive',
  neutral:    'General',
  tired:      'Review Later',
  stressed:   'Urgent',
};

window.Notes = {
  notesList: [],
  activeNoteId: null,
  filterMood: 'all',
  searchQuery: '',
  mobileView: 'list', // 'list' | 'editor'
  activeTab: 'notes', // 'notes' | 'library'
  resourcesList: [],
  resourceFilterCat: 'all',
  activeCitationResource: null,
  activeCitationStyle: 'apa',

  async load() {
    try {
      this.notesList = await API.get('/api/notes');
      this.initListeners();
      this.renderSidebar();

      // If library tab was active or if on desktop
      if (this.activeTab === 'library') {
        this.loadResources();
      }

      // On desktop, auto-select first note if none active
      if (window.innerWidth > 768) {
        if (this.notesList.length > 0 && !this.activeNoteId) {
          this.selectNote(this.notesList[0].id, false);
        } else if (this.notesList.length === 0) {
          this.clearEditor();
        }
      }
    } catch (err) {
      UI.toast('Failed to load notes.', 'danger');
    }
  },

  openLibrary() {
    App.navigateTo('notes');
    setTimeout(() => this.switchTab('library'), 50);
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    const notesTab = document.querySelector('.notes-main-tab[data-tab="notes"]');
    const libraryTab = document.querySelector('.notes-main-tab[data-tab="library"]');
    const notesPane = document.getElementById('notes-tab-editor-pane');
    const libraryPane = document.getElementById('notes-tab-library-pane');

    if (tabName === 'library') {
      notesTab?.classList.remove('active');
      libraryTab?.classList.add('active');
      notesPane?.classList.add('hidden');
      libraryPane?.classList.remove('hidden');
      this.loadResources();
    } else {
      libraryTab?.classList.remove('active');
      notesTab?.classList.add('active');
      libraryPane?.classList.add('hidden');
      notesPane?.classList.remove('hidden');
    }
  },

  async loadResources() {
    try {
      this.resourcesList = await API.get('/api/resources');
      this.renderResources();
    } catch (err) {
      console.warn('Failed to load academic resources:', err);
    }
  },

  filterResources(cat) {
    this.resourceFilterCat = cat;
    document.querySelectorAll('.resource-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
    this.renderResources();
  },

  renderResources() {
    const container = document.getElementById('notes-resources-list-container');
    if (!container) return;

    let items = this.resourcesList || [];
    if (this.resourceFilterCat !== 'all') {
      items = items.filter(r => (r.category || 'general').toLowerCase() === this.resourceFilterCat.toLowerCase());
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <div style="margin-bottom: 0.5rem; color: var(--text-muted); display: flex; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div style="font-weight: 700; font-size: 0.95rem;">No Academic Resources Found</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            ${this.resourceFilterCat !== 'all' ? 'No items under this category filter.' : 'Add your first book, research paper, or lecture link using the form on the left.'}
          </div>
        </div>
      `;
      return;
    }

    const typeIcons = {
      book: 'Online Book',
      journal: 'Research Journal',
      pdf: 'PDF Document',
      docx: 'DOCX File',
      article: 'Web Guide',
    };

    container.innerHTML = items.map(r => {
      const typeLabel = typeIcons[r.resource_type] || 'Document';
      const catLabel = r.category ? r.category.charAt(0).toUpperCase() + r.category.slice(1) : 'General';
      const dateStr = r.created_at ? UI.formatDate(r.created_at) : '';
      const yearBadge = r.year ? `<span style="display:inline-flex; align-items:center; gap:3px; background:rgba(124, 58, 237,0.08); color:var(--primary); padding:2px 7px; border-radius:4px; border:1px solid rgba(124, 58, 237,0.15); font-size:0.7rem; font-weight:700;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${UI.esc(r.year)}</span>` : '';
      const pubBadge = r.publisher ? `<span style="font-size:0.78rem; color:var(--text-secondary); font-weight:600;">• ${UI.esc(r.publisher)}</span>` : '';

      return `
        <div class="card resource-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.85rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap;">
                <span class="priority-badge priority-low" style="font-size: 0.7rem;">${UI.esc(typeLabel)}</span>
                <span class="priority-badge priority-medium" style="font-size: 0.7rem;">${UI.esc(catLabel)}</span>
                ${yearBadge}
                ${dateStr ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">${dateStr}</span>` : ''}
              </div>
              <h5 style="margin: 0; font-size: 1.02rem; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
                ${UI.esc(r.title)}
              </h5>
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem; flex-wrap: wrap;">
                ${r.author ? `<span style="font-size: 0.82rem; color: var(--text-secondary); font-weight: 700;">By ${UI.esc(r.author)}</span>` : ''}
                ${pubBadge}
                ${r.doi ? `<span style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--text-muted);">DOI: ${UI.esc(r.doi)}</span>` : ''}
              </div>
              ${r.notes ? `<p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.5rem 0 0; font-style: italic; line-height: 1.45;">"${UI.esc(r.notes)}"</p>` : ''}
            </div>

            <div class="resource-card-actions">
              <button type="button" class="btn btn-outline btn-sm" onclick="Notes.openCitationModal(${r.id})" style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; padding: 0.4rem 0.75rem; font-size: 0.8rem; border-color: var(--primary); color: var(--primary); background: var(--primary-light); min-height: 36px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Cite
              </button>
              ${r.url_or_path ? `
                <a href="${UI.esc(r.url_or_path)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; padding: 0.4rem 0.75rem; font-size: 0.8rem; min-height: 36px;">
                  Open ↗
                </a>
              ` : ''}
              <button class="btn-icon text-muted" onclick="Notes.deleteResource(${r.id})" title="Delete resource" style="padding: 6px; min-height: 36px; min-width: 36px; display: inline-flex; align-items: center; justify-content: center;">
                <svg class="icon-svg" viewBox="0 0 24 24" style="width: 16px; height: 16px; color: var(--accent-danger);"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  async handleAddResource(e) {
    e.preventDefault();
    const title = document.getElementById('notes-resource-title')?.value.trim();
    const author = document.getElementById('notes-resource-author')?.value.trim() || '';
    const year = document.getElementById('notes-resource-year')?.value.trim() || '';
    const publisher = document.getElementById('notes-resource-publisher')?.value.trim() || '';
    const doi = document.getElementById('notes-resource-doi')?.value.trim() || '';
    const resource_type = document.getElementById('notes-resource-type')?.value || 'book';
    const category = document.getElementById('notes-resource-category')?.value || 'general';
    const url_or_path = document.getElementById('notes-resource-url')?.value.trim() || '';
    const notes = document.getElementById('notes-resource-notes')?.value.trim() || '';

    if (!title) {
      UI.toast('Please enter a resource title.', 'warning');
      return;
    }

    try {
      await API.post('/api/resources', { title, author, year, publisher, doi, resource_type, category, url_or_path, notes });
      UI.toast('Academic resource added to Library!', 'success');
      document.getElementById('notes-add-resource-form')?.reset();
      this.loadResources();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteResource(id) {
    if (!confirm('Remove this resource from library?')) return;
    try {
      await API.delete(`/api/resources/${id}`);
      UI.toast('Resource removed from library.', 'info');
      this.loadResources();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  // ── CITATION GENERATOR ENGINE (APA 7, IEEE, MLA 9, BibTeX, Chicago, Harvard) ──
  openCitationModal(resourceId) {
    const resource = (this.resourcesList || []).find(r => r.id === resourceId);
    if (!resource) return;

    this.activeCitationResource = resource;
    const modal = document.getElementById('citation-modal');
    if (!modal) return;

    const titleEl = document.getElementById('citation-resource-title');
    const metaEl = document.getElementById('citation-resource-meta');
    if (titleEl) titleEl.textContent = resource.title;
    if (metaEl) {
      const parts = [];
      if (resource.author) parts.push(`Author: ${resource.author}`);
      if (resource.year) parts.push(`Year: ${resource.year}`);
      if (resource.publisher) parts.push(`Publisher: ${resource.publisher}`);
      if (resource.doi) parts.push(`DOI: ${resource.doi}`);
      metaEl.textContent = parts.length > 0 ? parts.join(' • ') : 'General Academic Resource';
    }

    this.switchCitationStyle(this.activeCitationStyle || 'apa');
    modal.classList.remove('hidden');
  },

  closeCitationModal() {
    const modal = document.getElementById('citation-modal');
    if (modal) modal.classList.add('hidden');
  },

  switchCitationStyle(style) {
    this.activeCitationStyle = style;
    document.querySelectorAll('.citation-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-style') === style);
    });

    const previewBox = document.getElementById('citation-preview-box');
    if (!previewBox || !this.activeCitationResource) return;

    const formatted = this._generateCitation(style, this.activeCitationResource, false);
    previewBox.innerHTML = formatted;
  },

  _generateCitation(style, r, plainText = false) {
    const author = r.author || 'Anonymous';
    const year = r.year || new Date().getFullYear();
    const title = r.title || 'Untitled Document';
    const publisher = r.publisher || 'Academic Press';
    const url = r.url_or_path || '';
    const doi = r.doi ? (r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`) : (url || '');

    switch (style) {
      case 'apa':
        // APA 7th Edition: Author, A. A. (Year). *Title*. Publisher. DOI
        if (plainText) {
          return `${author} (${year}). ${title}. ${publisher}.${doi ? ` ${doi}` : ''}`;
        }
        return `${UI.esc(author)} (${UI.esc(year)}). <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}.${doi ? ` <span style="color:var(--primary);">${UI.esc(doi)}</span>` : ''}`;

      case 'ieee':
        // IEEE: Author, "Title," Publisher, Year. [Online]. Available: URL
        if (plainText) {
          return `${author}, "${title}," ${publisher}, ${year}.${url ? ` [Online]. Available: ${url}` : ''}`;
        }
        return `${UI.esc(author)}, &ldquo;<em>${UI.esc(title)}</em>,&rdquo; ${UI.esc(publisher)}, ${UI.esc(year)}.${url ? ` [Online]. Available: <span style="color:var(--primary);">${UI.esc(url)}</span>` : ''}`;

      case 'mla':
        // MLA 9th Edition: Author. *Title*. Publisher, Year, URL.
        if (plainText) {
          return `${author}. ${title}. ${publisher}, ${year}${url ? `, ${url}` : ''}.`;
        }
        return `${UI.esc(author)}. <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}, ${UI.esc(year)}${url ? `, <span style="color:var(--primary);">${UI.esc(url)}</span>` : ''}.`;

      case 'bibtex': {
        // BibTeX @article or @book entry
        const citeKey = (author.split(/[\s,]+/)[0] + year + title.split(/\s+/)[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
        const entryType = (r.resource_type === 'journal' || r.resource_type === 'article') ? 'article' : 'book';
        const bib = `@${entryType}{${citeKey || 'ref1'},
  title = {${title}},
  author = {${author}},
  year = {${year}},
  publisher = {${publisher}}${doi ? `,\n  doi = {${r.doi}}` : ''}${url ? `,\n  url = {${url}}` : ''}
}`;
        if (plainText) return bib;
        return `<pre style="margin:0; font-family:var(--font-mono); font-size:0.85rem; color:var(--text-primary); white-space:pre-wrap;">${UI.esc(bib)}</pre>`;
      }

      case 'chicago':
        // Chicago 17th (Author-Date): Author. Year. *Title*. Publisher. DOI.
        if (plainText) {
          return `${author}. ${year}. ${title}. ${publisher}.${doi ? ` ${doi}.` : ''}`;
        }
        return `${UI.esc(author)}. ${UI.esc(year)}. <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}.${doi ? ` <span style="color:var(--primary);">${UI.esc(doi)}</span>.` : ''}`;

      case 'harvard':
        // Harvard: Author (Year) *Title*. Publisher. Available at: URL [Accessed date].
        if (plainText) {
          return `${author} (${year}) ${title}. ${publisher}.${url ? ` Available at: ${url}` : ''}`;
        }
        return `${UI.esc(author)} (${UI.esc(year)}) <em>${UI.esc(title)}</em>. ${UI.esc(publisher)}.${url ? ` Available at: <span style="color:var(--primary);">${UI.esc(url)}</span>` : ''}`;

      default:
        return `${author} (${year}). ${title}.`;
    }
  },

  copyCitation() {
    if (!this.activeCitationResource) return;
    const text = this._generateCitation(this.activeCitationStyle, this.activeCitationResource, true);
    navigator.clipboard.writeText(text).then(() => {
      UI.toast(`Copied ${this.activeCitationStyle.toUpperCase()} citation to clipboard!`, 'success');
    }).catch(() => {
      UI.toast('Failed to copy to clipboard.', 'danger');
    });
  },

  insertCitationToNote() {
    if (!this.activeCitationResource) return;
    const text = this._generateCitation(this.activeCitationStyle, this.activeCitationResource, true);
    
    // Switch to notes tab and editor
    this.closeCitationModal();
    this.switchTab('notes');

    const bodyInput = document.getElementById('note-body-input');
    if (bodyInput) {
      const current = bodyInput.value;
      bodyInput.value = current ? `${current}\n\n[Citation: ${text}]` : `[Citation: ${text}]\n\n`;
      bodyInput.focus();
      this.updateCounters();
      UI.toast('Citation appended to active note! Don\'t forget to click Save.', 'success');
    }
  },

  downloadBibtex() {
    if (!this.activeCitationResource) return;
    const bibContent = this._generateCitation('bibtex', this.activeCitationResource, true);
    const citeKey = (this.activeCitationResource.author?.split(/\s+/)[0] || 'citation') + (this.activeCitationResource.year || '');
    const blob = new Blob([bibContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${citeKey.toLowerCase().replace(/[^a-z0-9]/g, '') || 'citation'}.bib`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    UI.toast('BibTeX file downloaded (.bib)!', 'success');
  },

  initListeners() {
    const saveBtn   = document.getElementById('save-note-btn');
    const deleteBtn = document.getElementById('delete-note-btn');
    const bodyInput = document.getElementById('note-body-input');
    const searchIn  = document.getElementById('notes-search-input');
    const resForm   = document.getElementById('notes-add-resource-form');

    if (saveBtn)   saveBtn.onclick   = () => this.saveCurrentNote();
    if (deleteBtn) deleteBtn.onclick = () => this.deleteActiveNote();

    if (bodyInput) {
      bodyInput.oninput = () => this.updateCounters();
    }

    if (searchIn) {
      let debounceTimer = null;
      searchIn.oninput = (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.renderSidebar();
        }, 120);
      };
    }

    if (resForm) {
      resForm.onsubmit = (e) => this.handleAddResource(e);
    }
  },

  _getEditorEls() {
    return {
      titleInput: document.getElementById('note-title-input'),
      moodSelect: document.getElementById('note-mood-select'),
      bodyInput:  document.getElementById('note-body-input'),
      deleteBtn:  document.getElementById('delete-note-btn'),
      layoutEl:   document.getElementById('notes-main-layout'),
    };
  },

  updateCounters() {
    const bodyInput = document.getElementById('note-body-input');
    const counterEl = document.getElementById('note-word-count');
    if (!bodyInput || !counterEl) return;

    const text = bodyInput.value.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).length : 0;
    counterEl.textContent = `${words} words · ${chars} chars`;
  },

  setMoodFilter(mood) {
    this.filterMood = mood;
    document.querySelectorAll('.note-filter-pill').forEach(pill => {
      if (pill.getAttribute('data-mood') === mood) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    this.renderSidebar();
  },

  getFilteredNotes() {
    return this.notesList.filter(n => {
      const matchMood = this.filterMood === 'all' || (n.mood || 'neutral') === this.filterMood;
      const matchSearch = !this.searchQuery ||
        (n.title && n.title.toLowerCase().includes(this.searchQuery)) ||
        (n.body && n.body.toLowerCase().includes(this.searchQuery));
      return matchMood && matchSearch;
    });
  },

  renderSidebar() {
    const sidebarContainer = document.getElementById('notes-sidebar-list');
    if (!sidebarContainer) return;

    // Update sidebar notes counter
    const notesCount = this.notesList.length;
    const counterEl = document.getElementById('nav-counter-notes');
    if (counterEl) {
      if (notesCount > 0) {
        counterEl.textContent = notesCount;
        counterEl.classList.remove('hidden');
      } else {
        counterEl.classList.add('hidden');
      }
    }

    const filtered = this.getFilteredNotes();

    if (filtered.length === 0) {
      const isSearchOrFilter = Boolean(this.searchQuery || this.filterMood !== 'all');
      sidebarContainer.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1.25rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-lg); background: var(--bg-surface-alt);">
          <div class="empty-state-icon" style="width: 44px; height: 44px; margin: 0 auto 0.75rem auto; border-radius: var(--radius-full); background: rgba(124, 58, 237, 0.12); color: var(--primary); display: flex; align-items: center; justify-content: center;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="empty-state-title" style="font-weight: 800; font-size: 1rem; color: var(--text-primary);">${isSearchOrFilter ? 'No matching notes' : 'No notes yet'}</div>
          <div class="empty-state-desc" style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">
            ${isSearchOrFilter ? 'Try adjusting your search or tag filters.' : 'Capture your thoughts, study outlines, and daily reflections.'}
          </div>
          ${!isSearchOrFilter ? `
            <button type="button" class="btn btn-primary btn-sm d-inline-flex items-center gap-xs" onclick="Notes.startNewNote()" style="margin-top: 1rem; width: 100%; justify-content: center; min-height: 42px; font-weight: 700;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Create Your First Note
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    sidebarContainer.innerHTML = filtered.map(n => {
      const mood    = n.mood || 'neutral';
      const label   = MOOD_LABELS[mood] || mood;
      const dateStr = (n.updated_at || n.created_at)
        ? UI.formatDate(n.updated_at || n.created_at)
        : '';

      return `
        <div class="note-item ${n.id === this.activeNoteId ? 'active' : ''}" data-mood="${mood}" onclick="Notes.selectNote(${n.id}, true)">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.35rem;">
            <div class="note-item-title">${UI.esc(n.title || 'Untitled Note')}</div>
          </div>
          <div class="note-item-snippet">${UI.esc(n.body || 'No content yet...')}</div>
          <div class="note-item-meta">
            <span class="note-item-badge">${UI.esc(label)}</span>
            ${dateStr ? `<span class="note-item-date">${dateStr}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Selects a note.
   * @param {number} noteId
   * @param {boolean} switchToEditorOnMobile  whether to activate mobile editor view
   */
  selectNote(noteId, switchToEditorOnMobile = true) {
    this.activeNoteId = noteId;
    const note = this.notesList.find(n => n.id === noteId);
    if (!note) return;

    const { titleInput, moodSelect, bodyInput, deleteBtn } = this._getEditorEls();
    if (titleInput) titleInput.value = note.title || '';
    if (moodSelect) moodSelect.value = note.mood  || 'neutral';
    if (bodyInput)  bodyInput.value  = note.body  || '';
    if (deleteBtn)  deleteBtn.classList.remove('hidden');

    this.updateCounters();
    this.renderSidebar();

    if (switchToEditorOnMobile && window.innerWidth <= 768) {
      this.openEditorOnMobile();
    }
  },

  openEditorOnMobile() {
    this.mobileView = 'editor';
    const layout = document.getElementById('notes-main-layout');
    if (layout) {
      layout.classList.add('mobile-editor-active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  closeEditorOnMobile() {
    this.mobileView = 'list';
    const layout = document.getElementById('notes-main-layout');
    if (layout) {
      layout.classList.remove('mobile-editor-active');
    }
    this.renderSidebar();
  },

  clearEditor() {
    this.activeNoteId = null;
    const { titleInput, moodSelect, bodyInput, deleteBtn } = this._getEditorEls();
    if (titleInput) titleInput.value = '';
    if (moodSelect) moodSelect.value = 'neutral';
    if (bodyInput)  bodyInput.value  = '';
    if (deleteBtn)  deleteBtn.classList.add('hidden');
    this.updateCounters();
  },

  async saveCurrentNote() {
    const title = document.getElementById('note-title-input').value.trim() || 'Untitled Note';
    const mood = document.getElementById('note-mood-select').value;
    const body = document.getElementById('note-body-input').value;

    try {
      if (this.activeNoteId) {
        // Update existing note
        await API.patch(`/api/notes/${this.activeNoteId}`, { title, mood, body });
        UI.toast('Note updated!', 'success');
      } else {
        // Create new note
        const res = await API.post('/api/notes', { title, mood, body });
        this.activeNoteId = res.id;
        UI.toast('Note created!', 'success');
      }
      await this.load();

      // On mobile, keep in editor or return with smooth feedback
      if (window.innerWidth <= 768) {
        this.closeEditorOnMobile();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteActiveNote() {
    if (!this.activeNoteId) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await API.delete(`/api/notes/${this.activeNoteId}`);
      UI.toast('Note deleted.', 'info');
      this.activeNoteId = null;
      await this.load();

      if (window.innerWidth <= 768) {
        this.closeEditorOnMobile();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  startNewNote() {
    this.clearEditor();
    if (window.innerWidth <= 768) {
      this.openEditorOnMobile();
    }
    const titleInput = document.getElementById('note-title-input');
    if (titleInput) {
      setTimeout(() => titleInput.focus(), 100);
    }
  }
};

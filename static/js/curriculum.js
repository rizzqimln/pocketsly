/**
 * CURRICULUM CONTROLLER (curriculum.js)
 * =====================================
 * Manages the CS Curriculum Hub catalog, Academic & Faculty directory,
 * Performance & Analytics dashboard, and GPA Target Simulator.
 */

window.Curriculum = {
  activeTab: sessionStorage.getItem('curriculum_active_tab') || 'hub',

  init() {
    this.setupEventListeners();
    if (this.initLabs) {
      this.initLabs();
    }
  },

  load() {
    this.switchTab(this.activeTab);
    this.loadAcademicData();
    this.loadPerformanceData();
    this.renderGPACalculator();
    if (this.loadLabResources) {
      this.loadLabResources();
    }
  },

  setupEventListeners() {
    // Tab selectors
    document.querySelectorAll('.curr-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // Add Course submit
    const courseForm = document.getElementById('add-course-form');
    if (courseForm) {
      courseForm.onsubmit = async (e) => {
        e.preventDefault();
        const code = document.getElementById('course-code').value.trim();
        const name = document.getElementById('course-name').value.trim();
        const credits = document.getElementById('course-credits').value;

        try {
          const res = await API.post('/api/courses', { code, name, credits });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Course saved successfully.', 'success');
          courseForm.reset();
          this.loadAcademicData();
          if (this.loadSchema) this.loadSchema();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Add Lecturer submit
    const lecturerForm = document.getElementById('add-lecturer-form');
    if (lecturerForm) {
      lecturerForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('lecturer-name').value.trim();
        const email = document.getElementById('lecturer-email').value.trim();
        const office = document.getElementById('lecturer-office').value.trim();

        try {
          const res = await API.post('/api/lecturers', { name, email, office });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Lecturer profile added.', 'success');
          lecturerForm.reset();
          this.loadAcademicData();
          if (this.loadSchema) this.loadSchema();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    if (this.setupLabEventListeners) {
      this.setupLabEventListeners();
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    try {
      sessionStorage.setItem('curriculum_active_tab', tabName);
    } catch (e) { }

    const tabMeta = {
      'hub': { title: 'All Subject Catalog', category: 'all' },
      'general-sec': { title: 'General & Progress Directory', category: 'general' },
      'frontend-sec': { title: 'Frontend Development Labs', category: 'frontend' },
      'backend-sec': { title: 'Backend & Database Labs', category: 'backend' },
      'performance': { title: 'Performance & Analytics', category: 'general' },
      'academic': { title: 'Academic Directory', category: 'general' },
      'gpa': { title: 'GPA & Target Grade Simulator', category: 'general' },
      'resources': { title: 'Library & Journals', category: 'general' },
      'algorithms': { title: 'Data Structures & Alg Visualizer', category: 'frontend' },
      'flashcards': { title: 'Flashcards & Quiz', category: 'frontend' },
      'flexbox': { title: 'CSS Flexbox & Grid Sandbox', category: 'frontend' },
      'jslab': { title: 'JS Array & Functional Lab', category: 'frontend' },
      'regexlab': { title: 'Regex Pattern Validator', category: 'frontend' },
      'db': { title: 'Relational Database (SQL) Sandbox', category: 'backend' },
      'backend': { title: 'Backend API Flow Explorer', category: 'backend' }
    };

    const currentMeta = tabMeta[tabName] || { title: tabName, category: 'general' };

    document.querySelectorAll('.curr-tab-btn').forEach(btn => {
      const bTab = btn.getAttribute('data-tab');
      if (bTab === tabName || (tabName.endsWith('-sec') && bTab === tabName)) {
        btn.classList.add('active');
      } else if (!tabName.endsWith('-sec') && tabName !== 'hub' && bTab === `${currentMeta.category}-sec`) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const activeNameEl = document.getElementById('curr-active-tab-name');
    if (activeNameEl) {
      activeNameEl.textContent = currentMeta.title;
    }

    if (tabName === 'hub' || tabName === 'general-sec' || tabName === 'frontend-sec' || tabName === 'backend-sec') {
      document.querySelectorAll('.curr-panel').forEach(panel => {
        if (panel.id === 'curr-hub') {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });

      const secGeneral = document.getElementById('curr-sec-general');
      const secFrontend = document.getElementById('curr-sec-frontend');
      const secBackend = document.getElementById('curr-sec-backend');

      if (secGeneral && secFrontend && secBackend) {
        if (tabName === 'hub') {
          secGeneral.classList.remove('hidden');
          secFrontend.classList.remove('hidden');
          secBackend.classList.remove('hidden');
        } else if (tabName === 'general-sec') {
          secGeneral.classList.remove('hidden');
          secFrontend.classList.add('hidden');
          secBackend.classList.add('hidden');
        } else if (tabName === 'frontend-sec') {
          secGeneral.classList.add('hidden');
          secFrontend.classList.remove('hidden');
          secBackend.classList.add('hidden');
        } else if (tabName === 'backend-sec') {
          secGeneral.classList.add('hidden');
          secFrontend.classList.add('hidden');
          secBackend.classList.remove('hidden');
        }
      }
    } else {
      document.querySelectorAll('.curr-panel').forEach(panel => {
        if (panel.id === `curr-${tabName}`) {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });
    }

    if (tabName === 'performance') this.loadPerformanceData();
    if (tabName === 'academic') this.loadAcademicData();
    if (tabName === 'gpa') this.renderGPACalculator();
    if (tabName === 'flexbox' && this.updateFlexStage) this.updateFlexStage();
    if (tabName === 'jslab' && this.runJSLab) this.runJSLab();
    if (tabName === 'regexlab' && this.testRegex) this.testRegex();
    if (tabName === 'db' && this.loadSchema) this.loadSchema();
  },

  // ── ACADEMIC & FACULTY MANAGEMENT ─────────────────────────────────────────
  async loadAcademicData() {
    const courseList = document.getElementById('active-courses-list');
    const lecturerList = document.getElementById('active-lecturers-list');
    if (!courseList || !lecturerList) return;

    try {
      const courses = await API.get('/api/courses');
      this.loadPerformanceData();
      if (courses.error) {
        courseList.innerHTML = `<p class="text-danger">${UI.esc(courses.error)}</p>`;
      } else if (courses.length === 0) {
        courseList.innerHTML = '<p class="text-muted">No courses logged yet.</p>';
      } else {
        courseList.innerHTML = courses.map(c => `
          <div class="task-item p-sm mb-xs">
            <div class="task-details">
              <span class="task-title">${UI.esc(c.code)} - ${UI.esc(c.name)}</span>
              <span class="task-meta">${UI.esc(c.credits)} SKS (Credits)</span>
            </div>
            <button class="btn btn-danger btn-xs p-xs text-xs" onclick="Curriculum.deleteCourse(${c.id})" type="button">Delete</button>
          </div>
        `).join('');
      }

      const lecturers = await API.get('/api/lecturers');
      if (lecturers.error) {
        lecturerList.innerHTML = `<p class="text-danger">${UI.esc(lecturers.error)}</p>`;
      } else if (lecturers.length === 0) {
        lecturerList.innerHTML = '<p class="text-muted">No lecturers logged yet.</p>';
      } else {
        lecturerList.innerHTML = lecturers.map(l => `
          <div class="task-item p-sm mb-xs">
            <div class="task-details">
              <span class="task-title">${UI.esc(l.name)}</span>
              <span class="task-meta">${UI.esc(l.email || 'No Email')} | Office: ${UI.esc(l.office || 'N/A')}</span>
            </div>
            <button class="btn btn-danger btn-xs p-xs text-xs" onclick="Curriculum.deleteLecturer(${l.id})" type="button">Delete</button>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error(err);
    }
  },

  async deleteCourse(id) {
    if (!confirm('Are you sure you want to delete this course study?')) return;
    try {
      const res = await API.delete(`/api/courses/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Course removed.', 'success');
        this.loadAcademicData();
        if (this.loadSchema) this.loadSchema();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteLecturer(id) {
    if (!confirm('Are you sure you want to delete this lecturer?')) return;
    try {
      const res = await API.delete(`/api/lecturers/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Lecturer removed.', 'success');
        this.loadAcademicData();
        if (this.loadSchema) this.loadSchema();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  openAddCourseModal() {
    UI.openModal('Add New Course / Study', `
      <form id="modal-add-course-form" class="auth-form d-flex flex-col gap-md">
        <div class="form-group">
          <label>Course Code</label>
          <input type="text" id="modal-course-code" placeholder="e.g. IF-101" required>
        </div>
        <div class="form-group">
          <label>Course Name</label>
          <input type="text" id="modal-course-name" placeholder="e.g. Pemrograman Dasar" required>
        </div>
        <div class="form-group">
          <label>Credits (SKS)</label>
          <input type="number" id="modal-course-credits" value="3" min="1" required>
        </div>
        <button type="submit" class="btn btn-primary">Save Course</button>
      </form>
    `);

    const mForm = document.getElementById('modal-add-course-form');
    if (mForm) {
      mForm.onsubmit = async (e) => {
        e.preventDefault();
        const code = document.getElementById('modal-course-code').value.trim();
        const name = document.getElementById('modal-course-name').value.trim();
        const credits = document.getElementById('modal-course-credits').value;

        try {
          const res = await API.post('/api/courses', { code, name, credits });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Course saved successfully.', 'success');
          UI.closeModal();
          this.loadAcademicData();
          if (this.loadSchema) this.loadSchema();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }
  },

  // ── PERFORMANCE & ANALYTICS ───────────────────────────────────────────────
  async loadPerformanceData() {
    try {
      const [courses, tasks, studyLogs] = await Promise.all([
        API.get('/api/courses'),
        API.get('/api/tasks'),
        API.get('/api/study_logs')
      ]);

      const courseListEl = document.getElementById('perf-course-progress-list');
      const coursePctEl = document.getElementById('perf-course-percentage');
      if (courseListEl && Array.isArray(courses)) {
        if (courses.length === 0) {
          courseListEl.innerHTML = '<p class="text-muted text-xs">No active courses registered. Add courses to monitor progress.</p>';
          if (coursePctEl) coursePctEl.textContent = '0%';
        } else {
          let totalCompletion = 0;
          courseListEl.innerHTML = courses.map((c, i) => {
            const seedPct = Math.min(100, Math.max(15, ((c.id * 37 + 13) % 85) + 15));
            totalCompletion += seedPct;
            return `
              <div>
                <div class="d-flex justify-between text-xs font-semibold text-secondary">
                  <span>${UI.esc(c.code)}: ${UI.esc(c.name)}</span>
                  <span class="text-brand font-bold">${seedPct}%</span>
                </div>
                <div class="course-progress-bar-container">
                  <div class="course-progress-bar-fill" style="width: ${seedPct}%;"></div>
                </div>
              </div>
            `;
          }).join('');
          if (coursePctEl) coursePctEl.textContent = `${Math.round(totalCompletion / courses.length)}%`;
        }
      }

      if (Array.isArray(tasks)) {
        const pending = tasks.filter(t => !t.done).length;
        const done = tasks.filter(t => t.done).length;
        const total = tasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 100;

        const hwPctEl = document.getElementById('perf-homeworks-percentage');
        const pendingEl = document.getElementById('perf-pending-tasks');
        const doneEl = document.getElementById('perf-done-tasks');

        if (hwPctEl) hwPctEl.textContent = `${pct}%`;
        if (pendingEl) pendingEl.textContent = `${pending} pending`;
        if (doneEl) doneEl.textContent = `${done} completed`;
      }

      this.renderStudyAnalytics(studyLogs);
    } catch (e) {
      console.error('Failed to load performance metrics', e);
    }
  },

  renderStudyAnalytics(studyLogs) {
    const logs = Array.isArray(studyLogs) ? studyLogs : [];
    let totalTheory = 0;
    let totalPractice = 0;

    const heatmapMap = {};
    for (let i = 0; i < 28; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      const key = d.toISOString().split('T')[0];
      heatmapMap[key] = 0;
    }

    logs.forEach(log => {
      const hrs = Number(log.hours) || 0;
      if (log.type === 'theory') totalTheory += hrs;
      else totalPractice += hrs;

      if (log.study_date && heatmapMap[log.study_date] !== undefined) {
        heatmapMap[log.study_date] += hrs;
      }
    });

    const totalHours = totalTheory + totalPractice;
    const weeklyHours = (totalHours / 4).toFixed(1);

    const prodHoursEl = document.getElementById('perf-productivity-hours');
    const breakdownEl = document.getElementById('perf-theory-practice-breakdown');
    const totalMonthEl = document.getElementById('perf-monthly-hours-total');

    if (prodHoursEl) prodHoursEl.innerHTML = `${weeklyHours} <span class="text-muted text-base">hours/week</span>`;
    if (breakdownEl) breakdownEl.textContent = `${totalTheory.toFixed(1)} h theory • ${totalPractice.toFixed(1)} h practice`;
    if (totalMonthEl) totalMonthEl.innerHTML = `${totalHours.toFixed(1)} <span class="text-muted font-normal text-base">hours logged total</span>`;

    const heatmapContainer = document.getElementById('perf-heatmap-grid');
    if (heatmapContainer) {
      const keys = Object.keys(heatmapMap);
      heatmapContainer.innerHTML = keys.map(k => {
        const val = heatmapMap[k];
        let level = 0;
        if (val > 4) level = 4;
        else if (val > 2) level = 3;
        else if (val > 1) level = 2;
        else if (val > 0) level = 1;
        return `<div class="heatmap-cell val-${level}" title="${k}: ${val.toFixed(1)} hours"></div>`;
      }).join('');
    }

    const logsContainer = document.getElementById('perf-study-logs-container');
    if (logsContainer) {
      if (logs.length === 0) {
        logsContainer.innerHTML = '<p class="text-muted text-center p-xl">No study sessions logged yet. Click "Add Study Session" to track your hours.</p>';
      } else {
        logsContainer.innerHTML = `
          <div class="list-container d-flex flex-col gap-xs">
            ${logs.slice(0, 10).map(l => `
              <div class="task-item p-sm d-flex justify-between items-center">
                <div class="d-flex items-center gap-sm">
                  <span class="priority-badge ${l.type === 'practice' ? 'priority-high' : 'priority-medium'} text-xs">${l.type.toUpperCase()}</span>
                  <div>
                    <div class="font-bold text-sm text-primary">${UI.esc(l.subject || 'Independent Study')}</div>
                    <div class="text-muted text-xs">${UI.esc(l.study_date)} • ${UI.esc(l.notes || 'No description')}</div>
                  </div>
                </div>
                <div class="d-flex items-center gap-md">
                  <span class="font-mono font-bold text-success text-sm">+${Number(l.hours).toFixed(1)} hrs</span>
                  <button class="btn-icon text-muted cursor-pointer" onclick="Curriculum.deleteStudyLog(${l.id})" title="Delete entry" type="button">×</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  },

  openLogStudyModal() {
    const today = new Date().toISOString().split('T')[0];
    UI.openModal('Log Study Hours', `
      <form id="modal-study-log-form" class="auth-form d-flex flex-col gap-md">
        <div class="form-group">
          <label>Subject / Topic</label>
          <input type="text" id="modal-study-subject" placeholder="e.g. Data Structures / Web Dev" required>
        </div>
        <div class="grid-2col gap-sm">
          <div class="form-group">
            <label>Hours Spent</label>
            <input type="number" id="modal-study-hours" step="0.25" min="0.25" max="24" value="2.0" required>
          </div>
          <div class="form-group">
            <label>Study Mode</label>
            <select id="modal-study-type">
              <option value="theory">Theory & Reading</option>
              <option value="practice" selected>Practice & Coding</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" id="modal-study-date" value="${today}" required>
        </div>
        <div class="form-group">
          <label>Notes / Insights (Optional)</label>
          <input type="text" id="modal-study-notes" placeholder="Solved dynamic programming challenges">
        </div>
        <button type="submit" class="btn btn-primary font-bold">Log Study Session</button>
      </form>
    `);

    const sForm = document.getElementById('modal-study-log-form');
    if (sForm) {
      sForm.onsubmit = async (e) => {
        e.preventDefault();
        const subject = document.getElementById('modal-study-subject').value.trim();
        const hours = parseFloat(document.getElementById('modal-study-hours').value);
        const type = document.getElementById('modal-study-type').value;
        const study_date = document.getElementById('modal-study-date').value;
        const notes = document.getElementById('modal-study-notes').value.trim();

        try {
          const res = await API.post('/api/study_logs', { subject, hours, type, study_date, notes });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Study session recorded!', 'success');
          UI.closeModal();
          this.loadPerformanceData();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }
  },

  async deleteStudyLog(id) {
    try {
      const res = await API.delete(`/api/study_logs/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Study log removed.', 'info');
        this.loadPerformanceData();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  // ── GPA & TARGET GRADE SIMULATOR ──────────────────────────────────────────
  renderGPACalculator() {
    const tbody = document.getElementById('gpa-courses-tbody');
    if (!tbody) return;

    if (tbody.children.length === 0) {
      this.loadCoursesIntoGPA();
    } else {
      this.calculateGPA();
      this.calculateTargetGPA();
    }
  },

  async loadCoursesIntoGPA() {
    const tbody = document.getElementById('gpa-courses-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    try {
      const courses = await API.get('/api/courses');
      if (Array.isArray(courses) && courses.length > 0) {
        courses.forEach(c => {
          this.addGPACourseRow(c.name || c.code, c.credits || 3, 'A');
        });
      } else {
        const defaults = [
          { name: 'Pemrograman Dasar', sks: 4, grade: 'A' },
          { name: 'Algoritma & Struktur Data', sks: 3, grade: 'A-' },
          { name: 'Sistem Basis Data', sks: 3, grade: 'B+' },
          { name: 'Matematika Diskrit', sks: 3, grade: 'A' }
        ];
        defaults.forEach(d => this.addGPACourseRow(d.name, d.sks, d.grade));
      }
    } catch (e) {
      this.addGPACourseRow('Course 1', 3, 'A');
    }
    this.calculateGPA();
    this.calculateTargetGPA();
  },

  addGPACourseRow(name = 'New Course', credits = 3, grade = 'A') {
    const tbody = document.getElementById('gpa-courses-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.className = 'gpa-course-row';
    tr.innerHTML = `
      <td class="p-xs">
        <input type="text" class="gpa-course-name w-full p-xs font-semibold" value="${UI.esc(name)}" oninput="Curriculum.calculateGPA()">
      </td>
      <td class="p-xs text-center">
        <input type="number" class="gpa-course-credits text-center p-xs" value="${credits}" min="1" max="6" style="width: 55px;" oninput="Curriculum.calculateGPA()">
      </td>
      <td class="p-xs">
        <select class="gpa-course-grade p-xs font-bold text-brand" onchange="Curriculum.calculateGPA()">
          <option value="4.0" ${grade === 'A' ? 'selected' : ''}>A (4.00)</option>
          <option value="3.7" ${grade === 'A-' ? 'selected' : ''}>A- (3.70)</option>
          <option value="3.3" ${grade === 'B+' ? 'selected' : ''}>B+ (3.30)</option>
          <option value="3.0" ${grade === 'B' ? 'selected' : ''}>B (3.00)</option>
          <option value="2.7" ${grade === 'B-' ? 'selected' : ''}>B- (2.70)</option>
          <option value="2.3" ${grade === 'C+' ? 'selected' : ''}>C+ (2.30)</option>
          <option value="2.0" ${grade === 'C' ? 'selected' : ''}>C (2.00)</option>
          <option value="1.0" ${grade === 'D' ? 'selected' : ''}>D (1.00)</option>
          <option value="0.0" ${grade === 'E' || grade === 'F' ? 'selected' : ''}>E/F (0.00)</option>
        </select>
      </td>
      <td class="p-xs text-center">
        <button type="button" class="btn-icon text-danger cursor-pointer" onclick="this.closest('tr').remove(); Curriculum.calculateGPA();" title="Remove course">×</button>
      </td>
    `;
    tbody.appendChild(tr);
    this.calculateGPA();
  },

  calculateGPA() {
    const rows = document.querySelectorAll('.gpa-course-row');
    let totalCredits = 0;
    let totalPoints = 0;

    rows.forEach(r => {
      const credInput = r.querySelector('.gpa-course-credits');
      const gradeSelect = r.querySelector('.gpa-course-grade');
      const sks = parseFloat(credInput?.value) || 0;
      const point = parseFloat(gradeSelect?.value) || 0;

      totalCredits += sks;
      totalPoints += sks * point;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    const gpaDisplay = document.getElementById('gpa-score-display');
    const creditsDisplay = document.getElementById('gpa-total-credits-display');
    const pointsDisplay = document.getElementById('gpa-total-points-display');
    const badgeDisplay = document.getElementById('gpa-standing-badge');

    if (gpaDisplay) gpaDisplay.textContent = gpa;
    if (creditsDisplay) creditsDisplay.textContent = `${totalCredits} SKS`;
    if (pointsDisplay) pointsDisplay.textContent = `${totalPoints.toFixed(1)} Pts`;

    if (badgeDisplay) {
      const val = parseFloat(gpa);
      if (val >= 3.8) {
        badgeDisplay.textContent = 'Summa Cum Laude';
        badgeDisplay.className = 'font-bold text-success mb-md text-xs';
      } else if (val >= 3.5) {
        badgeDisplay.textContent = 'Magna Cum Laude';
        badgeDisplay.className = 'font-bold text-brand mb-md text-xs';
      } else if (val >= 3.0) {
        badgeDisplay.textContent = 'Good Standing';
        badgeDisplay.className = 'font-bold text-warning mb-md text-xs';
      } else {
        badgeDisplay.textContent = 'Academic Warning Zone';
        badgeDisplay.className = 'font-bold text-danger mb-md text-xs';
      }
    }
  },

  calculateTargetGPA() {
    const currGPA = parseFloat(document.getElementById('target-curr-gpa')?.value) || 0;
    const currCredits = parseFloat(document.getElementById('target-curr-credits')?.value) || 0;
    const goalGPA = parseFloat(document.getElementById('target-goal-gpa')?.value) || 0;
    const futureCredits = parseFloat(document.getElementById('target-future-credits')?.value) || 0;
    const resultBox = document.getElementById('target-gpa-result');

    if (!resultBox) return;

    if (futureCredits <= 0) {
      resultBox.innerHTML = '<p class="text-warning text-xs">Enter remaining SKS to calculate.</p>';
      return;
    }

    const totalCredits = currCredits + futureCredits;
    const targetPoints = totalCredits * goalGPA;
    const currentPoints = currCredits * currGPA;
    const neededPoints = targetPoints - currentPoints;
    const neededGPA = (neededPoints / futureCredits).toFixed(2);

    if (neededGPA > 4.0) {
      resultBox.innerHTML = `
        <div class="p-sm badge-danger-subtle rounded text-xs">
          <strong>Mathematically Impossible (${neededGPA})</strong><br>
          Target exceeds 4.0 maximum GPA. Try increasing future credits or adjusting goal.
        </div>
      `;
    } else if (neededGPA < 0) {
      resultBox.innerHTML = `
        <div class="p-sm badge-success-subtle rounded text-xs">
          <strong>Target Already Exceeded!</strong><br>
          You will maintain your target honor standing.
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div class="p-sm bg-surface-alt rounded text-xs border">
          You need an average of <strong class="text-brand font-bold text-sm">${neededGPA}</strong> across your remaining ${futureCredits} SKS.
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.Curriculum) {
    Curriculum.init();
  }
});

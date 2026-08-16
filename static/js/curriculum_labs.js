/**
 * CURRICULUM INTERACTIVE LABS (curriculum_labs.js)
 * ===============================================
 * Extends window.Curriculum with live execution sandboxes:
 * SQL Console, API Inspector, Sorting Visualizer, Quizzer, Flexbox Lab, JS Lab, and Regex Tester.
 */

(function () {
  if (!window.Curriculum) window.Curriculum = {};

  const labsMethods = {
    dbSchema: null,
    algoArray: [],
    sortingInProgress: false,
    quizIndex: 0,
    _flexBoxCount: 4,
    _currentJSMethod: 'map',

    quizQuestions: [
      {
        question: "Which of the following is correct regarding relational databases?",
        options: [
          "Tables cannot have foreign key relationships with each other.",
          "A Primary Key must be unique and cannot be NULL.",
          "SQLite does not support any constraints like UNIQUE or NOT NULL.",
          "SQL stands for Simple Query Language."
        ],
        answer: 1,
        explanation: "A Primary Key uniquely identifies each record in a table, and SQL stands for Structured Query Language."
      },
      {
        question: "In CSS Flexbox, which property aligns flex items along the main axis?",
        options: [
          "align-items",
          "justify-content",
          "flex-direction",
          "align-content"
        ],
        answer: 1,
        explanation: "'justify-content' aligns flex items along the main axis, while 'align-items' aligns them along the cross axis."
      },
      {
        question: "What is the time complexity of a Bubble Sort algorithm in its worst case?",
        options: [
          "O(n log n)",
          "O(1)",
          "O(n²)",
          "O(n)"
        ],
        answer: 2,
        explanation: "Bubble Sort compares adjacent elements and swaps them, leading to nested loop behavior resulting in O(n²) time complexity."
      },
      {
        question: "Which HTTP status code represents a successful resource creation in REST API design?",
        options: [
          "200 OK",
          "201 Created",
          "400 Bad Request",
          "404 Not Found"
        ],
        answer: 1,
        explanation: "The HTTP 201 Created status code indicates that the request has succeeded and led to the creation of a resource."
      },
      {
        question: "In SQL, what does a LEFT JOIN return?",
        options: [
          "Only rows that match in both tables.",
          "All rows from the left table, and matching rows from the right table.",
          "All rows from both tables regardless of match.",
          "Only records that have NULL primary keys."
        ],
        answer: 1,
        explanation: "A LEFT JOIN returns all records from the left table, and matching records from the right table. Non-matching right columns are NULL."
      },
      {
        question: "Which of the following describes a foreign key constraint?",
        options: [
          "It prevents passwords from being leaked.",
          "It speeds up SELECT queries on indexes.",
          "It links a column in one table to the primary key of another table to maintain referential integrity.",
          "It automatically hashes passwords during INSERTs."
        ],
        answer: 2,
        explanation: "A foreign key enforces referential integrity between two related tables in a relational database."
      },
      {
        question: "In Modern JavaScript (ES6+), what is the purpose of async/await?",
        options: [
          "To make JavaScript run synchronously on a single CPU core.",
          "To write asynchronous Promises in a clean, synchronous-looking format.",
          "To compile JavaScript into WebAssembly.",
          "To force DOM elements to re-render without CSS."
        ],
        answer: 1,
        explanation: "async/await acts as syntactic sugar over Promises, making asynchronous code easier to read and maintain."
      },
      {
        question: "In Python and SQLite, which technique is used to prevent SQL Injection vulnerability?",
        options: [
          "Executing queries with raw string concatenation.",
          "Using '?' query placeholders or parameterized SQL inputs.",
          "Running base64 encryption on every incoming query text.",
          "Turning off SQLite foreign key constraints."
        ],
        answer: 1,
        explanation: "Passing parameterized inputs with '?' prevents attackers from manipulating the structure of your queries."
      },
      {
        question: "What is the time complexity of Binary Search on a sorted array of size n?",
        options: [
          "O(n)",
          "O(log n)",
          "O(n log n)",
          "O(1)"
        ],
        answer: 1,
        explanation: "Binary search repeatedly divides the sorted search interval in half, yielding O(log n) time complexity."
      }
    ],

    initLabs() {
      this.generateAlgoArray();
    },

    loadLabResources() {
      this.loadSchema();
      this.loadQuizQuestion();
    },

    setupLabEventListeners() {
      // SQL Playground Run
      const runSqlBtn = document.getElementById('run-sql-btn');
      if (runSqlBtn) {
        runSqlBtn.onclick = () => this.runSQL();
      }

      const resetSqlBtn = document.getElementById('reset-sql-btn');
      if (resetSqlBtn) {
        resetSqlBtn.onclick = () => {
          const qInput = document.getElementById('sql-query-input');
          if (qInput) {
            qInput.value = '';
            qInput.focus();
          }
          document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
          const results = document.getElementById('sql-results-container');
          if (results) {
            results.innerHTML = '<p class="text-muted m-0 text-center p-2xl">Ready to execute. Pick a table above or write your SQL query.</p>';
          }
        };
      }

      // SQL Templates
      document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const sql = e.currentTarget.getAttribute('data-sql');
          const qInput = document.getElementById('sql-query-input');
          if (qInput) {
            qInput.value = sql;
            qInput.focus();
            this.runSQL();
          }
        });
      });

      // Backend Explorer triggers
      document.querySelectorAll('.backend-trigger-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.currentTarget.getAttribute('data-action');
          this.runBackendInspector(action);
        });
      });

      // Algo Visualizer
      const shuffleBtn = document.getElementById('algo-generate-arr');
      if (shuffleBtn) shuffleBtn.onclick = () => this.generateAlgoArray();

      const bubbleBtn = document.getElementById('algo-sort-bubble');
      if (bubbleBtn) bubbleBtn.onclick = () => this.bubbleSort();

      const quickBtn = document.getElementById('algo-sort-quick');
      if (quickBtn) quickBtn.onclick = () => this.startQuickSort();

      const speedInput = document.getElementById('algo-speed');
      const speedVal = document.getElementById('algo-speed-val');
      if (speedInput && speedVal) {
        speedInput.oninput = (e) => {
          speedVal.textContent = `${e.target.value}ms`;
        };
      }

      // Quiz Buttons
      const nextQuizBtn = document.getElementById('quiz-next-btn');
      if (nextQuizBtn) nextQuizBtn.onclick = () => this.nextQuiz();

      const quizBackBtn = document.getElementById('quiz-back-btn');
      if (quizBackBtn) {
        quizBackBtn.onclick = () => {
          const card3d = document.getElementById('quiz-card-3d');
          if (card3d) card3d.classList.toggle('flipped');
        };
      }
    },

    // ── 1. RELATIONAL DATABASE & SQL LAB ─────────────────────────────────────
    async loadSchema() {
      const viewer = document.getElementById('db-schema-viewer');
      if (!viewer) return;

      try {
        const schema = await API.get('/api/curriculum/schema');
        if (schema.error) {
          viewer.innerHTML = `<p class="text-danger">${UI.esc(schema.error)}</p>`;
          return;
        }
        this.dbSchema = schema;
        this.renderSchema(schema);
      } catch (err) {
        viewer.innerHTML = `<p class="text-danger">Failed to fetch database schema: ${UI.esc(err.message)}</p>`;
      }
    },

    renderSchema(schema) {
      const viewer = document.getElementById('db-schema-viewer');
      if (!viewer) return;

      const tables = Object.keys(schema);
      if (tables.length === 0) {
        viewer.innerHTML = '<p class="text-muted">No tables available in SQLite instance.</p>';
        return;
      }

      viewer.innerHTML = tables.map(tbl => `
        <div class="schema-table-item mb-sm p-sm rounded border bg-surface-alt">
          <div class="font-bold text-xs text-primary d-flex items-center gap-xs mb-xs">
            <span class="text-success font-mono">■</span> ${UI.esc(tbl)}
          </div>
          <div class="d-flex flex-col gap-xs">
            ${schema[tbl].map(col => `
              <div class="d-flex justify-between text-xs text-secondary font-mono">
                <span>${UI.esc(col.name)}</span>
                <span class="text-muted">${UI.esc(col.type || 'TEXT')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    },

    toggleSchemaCollapse() {
      const viewer = document.getElementById('db-schema-viewer');
      const btn = document.getElementById('schema-toggle-btn');
      if (!viewer || !btn) return;

      if (viewer.classList.contains('hidden')) {
        viewer.classList.remove('hidden');
        btn.textContent = 'Collapse';
      } else {
        viewer.classList.add('hidden');
        btn.textContent = 'Expand';
      }
    },

    insertSQLSymbol(symbol) {
      const qInput = document.getElementById('sql-query-input');
      if (!qInput) return;
      const start = qInput.selectionStart || 0;
      const end = qInput.selectionEnd || 0;
      const val = qInput.value;
      qInput.value = val.substring(0, start) + symbol + val.substring(end);
      qInput.focus();
      qInput.selectionStart = qInput.selectionEnd = start + symbol.length;
    },

    async runSQL() {
      const qInput = document.getElementById('sql-query-input');
      const resultsContainer = document.getElementById('sql-results-container');
      if (!qInput || !resultsContainer) return;

      const query = qInput.value.trim();
      if (!query) {
        UI.toast('Please enter a SQL query.', 'warning');
        return;
      }

      resultsContainer.innerHTML = '<p class="text-muted text-center p-lg font-mono text-xs">Executing SQLite query on server...</p>';

      try {
        const res = await API.post('/api/curriculum/query', { query });
        if (res.error) {
          resultsContainer.innerHTML = `
            <div class="p-md text-danger font-mono text-xs">
              <strong>Query Execution Error:</strong><br>${UI.esc(res.error)}
            </div>
          `;
          return;
        }

        if (res.rows && res.rows.length > 0) {
          const cols = Object.keys(res.rows[0]);
          resultsContainer.innerHTML = `
            <table class="w-full text-xs font-mono">
              <thead>
                <tr class="bg-surface-alt border-b">
                  ${cols.map(c => `<th class="p-xs text-left">${UI.esc(c)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${res.rows.map(r => `
                  <tr class="border-b hover-row">
                    ${cols.map(c => `<td class="p-xs">${UI.esc(String(r[c] !== null ? r[c] : 'NULL'))}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        } else {
          resultsContainer.innerHTML = '<p class="text-success text-center p-md font-mono text-xs">Query completed. 0 rows returned.</p>';
        }
      } catch (e) {
        resultsContainer.innerHTML = `<div class="p-md text-danger font-mono text-xs">Network error: ${UI.esc(e.message)}</div>`;
      }
    },

    // ── 2. BACKEND API FLOW EXPLORER ─────────────────────────────────────────
    async runBackendInspector(action) {
      const outputEl = document.getElementById('backend-inspector-output');
      if (!outputEl) return;

      outputEl.innerHTML = '<pre><code>Waiting for API server response...</code></pre>';
      let endpoint = '/api/session';

      switch (action) {
        case 'get-session': endpoint = '/api/session'; break;
        case 'get-tasks': endpoint = '/api/tasks'; break;
        case 'get-schema': endpoint = '/api/curriculum/schema'; break;
        case 'get-habits': endpoint = '/api/habits'; break;
        case 'get-notes': endpoint = '/api/notes'; break;
        case 'get-courses': endpoint = '/api/courses'; break;
        case 'get-incomes': endpoint = '/api/incomes'; break;
        case 'get-expenses': endpoint = '/api/expenses'; break;
        case 'get-budget-summary': endpoint = '/api/budget/summary'; break;
        default: endpoint = action.startsWith('/') ? action : `/api/${action}`;
      }

      try {
        const res = await API.get(endpoint);
        outputEl.innerHTML = `
          <div class="d-flex justify-between items-center mb-sm">
            <span class="priority-badge priority-low">GET ${UI.esc(endpoint)}</span>
            <span class="text-success font-bold font-mono text-xs">200 OK</span>
          </div>
          <pre class="m-0 font-mono text-xs"><code class="language-json">${UI.esc(JSON.stringify(res, null, 2))}</code></pre>
        `;
        UI.toast(`Inspected ${endpoint}`, 'info');
      } catch (e) {
        outputEl.innerHTML = `<pre class="text-danger">Failed: ${UI.esc(e.message)}</pre>`;
      }
    },

    // ── 3. ALGORITHM SORTING VISUALIZER ──────────────────────────────────────
    generateAlgoArray(size = 12) {
      this.algoArray = [];
      for (let i = 0; i < size; i++) {
        this.algoArray.push(Math.floor(Math.random() * 180) + 30);
      }
      this.renderAlgoBars();
      const logEl = document.getElementById('algo-steps-log');
      if (logEl) logEl.textContent = 'Array initialized. Click a sorting algorithm to start visual trace.';
    },

    renderAlgoBars(activeIndices = [], sortedIndices = []) {
      const container = document.getElementById('algo-bars-container');
      if (!container) return;

      container.innerHTML = '';
      this.algoArray.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.className = 'algo-bar';
        bar.style.height = `${val}px`;

        if (sortedIndices.includes(idx)) bar.classList.add('sorted');
        else if (activeIndices.includes(idx)) bar.classList.add('active');

        const label = document.createElement('span');
        label.className = 'algo-bar-label';
        label.textContent = val;
        bar.appendChild(label);
        container.appendChild(bar);
      });
    },

    sleep(ms) {
      const speedInput = document.getElementById('algo-speed');
      const delay = speedInput ? parseInt(speedInput.value) : ms;
      return new Promise(resolve => setTimeout(resolve, delay));
    },

    async bubbleSort() {
      if (this.sortingInProgress) return;
      this.sortingInProgress = true;
      const logEl = document.getElementById('algo-steps-log');
      let arr = this.algoArray;
      let len = arr.length;

      if (logEl) logEl.innerHTML = `<strong>Bubble Sort started:</strong> Comparing adjacent index elements...`;

      let sorted = [];
      for (let i = 0; i < len; i++) {
        for (let j = 0; j < len - i - 1; j++) {
          this.renderAlgoBars([j, j + 1], sorted);
          await this.sleep(120);

          if (arr[j] > arr[j + 1]) {
            let temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
            if (logEl) logEl.innerHTML = `Swapping index <strong>${j}</strong> (${arr[j + 1]}) and index <strong>${j + 1}</strong> (${arr[j]}).`;
            this.renderAlgoBars([j, j + 1], sorted);
            await this.sleep(120);
          }
        }
        sorted.push(len - i - 1);
      }

      this.renderAlgoBars([], Array.from({ length: len }, (_, i) => i));
      if (logEl) logEl.innerHTML = `<strong>Bubble Sort Completed!</strong> Entire array ordered in O(n²) time.`;
      this.sortingInProgress = false;
      UI.toast('Bubble Sort completed!', 'success');
    },

    async startQuickSort() {
      if (this.sortingInProgress) return;
      this.sortingInProgress = true;
      const logEl = document.getElementById('algo-steps-log');
      if (logEl) logEl.innerHTML = `<strong>Quick Sort started!</strong> Average Time Complexity: O(n log n).`;

      await this.quickSort(0, this.algoArray.length - 1);
      this.renderAlgoBars([], Array.from({ length: this.algoArray.length }, (_, i) => i));
      if (logEl) logEl.innerHTML = `<strong>Quick Sort Completed!</strong> Array partitioned and ordered.`;
      this.sortingInProgress = false;
      UI.toast('Quick Sort completed!', 'success');
    },

    async quickSort(low, high) {
      if (low < high) {
        const pi = await this.partition(low, high);
        await this.quickSort(low, pi - 1);
        await this.quickSort(pi + 1, high);
      }
    },

    async partition(low, high) {
      const arr = this.algoArray;
      const pivot = arr[high];
      let i = low - 1;
      const logEl = document.getElementById('algo-steps-log');

      for (let j = low; j < high; j++) {
        this.renderAlgoBars([j, high]);
        await this.sleep(100);

        if (arr[j] < pivot) {
          i++;
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
          if (logEl) logEl.innerHTML = `Partitioning with pivot <strong>${pivot}</strong>: Swapping index ${i} and ${j}.`;
          this.renderAlgoBars([i, j]);
          await this.sleep(100);
        }
      }

      const temp = arr[i + 1];
      arr[i + 1] = arr[high];
      arr[high] = temp;
      this.renderAlgoBars([i + 1, high]);
      await this.sleep(100);
      return i + 1;
    },

    // ── 4. FLASHCARDS & QUIZ CONTROLLER ──────────────────────────────────────
    loadQuizQuestion() {
      const q = this.quizQuestions[this.quizIndex];
      const qText = document.getElementById('quiz-question-text');
      const optBox = document.getElementById('quiz-options-box');
      const progressText = document.getElementById('quiz-progress-text');
      const card3d = document.getElementById('quiz-card-3d');

      if (card3d) card3d.classList.remove('flipped');
      if (progressText) progressText.textContent = `Question ${this.quizIndex + 1}/${this.quizQuestions.length}`;
      if (qText) qText.textContent = q.question;

      if (optBox) {
        optBox.innerHTML = q.options.map((opt, idx) => `
          <button class="quiz-opt-btn" onclick="Curriculum.answerQuiz(${idx})" type="button">
            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
            <span>${UI.esc(opt)}</span>
          </button>
        `).join('');
      }
    },

    answerQuiz(selectedIndex) {
      const q = this.quizQuestions[this.quizIndex];
      const isCorrect = selectedIndex === q.answer;
      const badge = document.getElementById('quiz-result-badge');
      const feedbackBox = document.getElementById('quiz-feedback-box');
      const card3d = document.getElementById('quiz-card-3d');

      if (badge) {
        badge.textContent = isCorrect ? 'Correct! ✓' : 'Incorrect ✗';
        badge.className = `quiz-badge ${isCorrect ? 'badge-success' : 'badge-danger'}`;
      }

      if (feedbackBox) {
        feedbackBox.innerHTML = `
          <p class="explanation-text m-0">${UI.esc(q.explanation)}</p>
          ${!isCorrect ? `<div class="wrong-alert">Correct Answer: <strong>${UI.esc(q.options[q.answer])}</strong></div>` : ''}
        `;
      }

      if (card3d) card3d.classList.add('flipped');
    },

    nextQuiz() {
      this.quizIndex = (this.quizIndex + 1) % this.quizQuestions.length;
      this.loadQuizQuestion();
    },

    // ── 5. CSS FLEXBOX & GRID VISUALIZER ────────────────────────────────────
    updateFlexStage() {
      const stage = document.getElementById('flex-interactive-stage');
      const dir = document.getElementById('flex-dir-select')?.value || 'row';
      const justify = document.getElementById('flex-justify-select')?.value || 'flex-start';
      const align = document.getElementById('flex-align-select')?.value || 'stretch';
      const wrap = document.getElementById('flex-wrap-select')?.value || 'nowrap';
      const gap = document.getElementById('flex-gap-slider')?.value || '12';
      const gapVal = document.getElementById('flex-gap-val');
      const snippet = document.getElementById('flex-css-snippet');

      if (gapVal) gapVal.textContent = `${gap}px`;

      if (stage) {
        stage.style.flexDirection = dir;
        stage.style.justifyContent = justify;
        stage.style.alignItems = align;
        stage.style.flexWrap = wrap;
        stage.style.gap = `${gap}px`;
      }

      if (snippet) {
        snippet.textContent = `.container {\n  display: flex;\n  flex-direction: ${dir};\n  justify-content: ${justify};\n  align-items: ${align};\n  flex-wrap: ${wrap};\n  gap: ${gap}px;\n}`;
      }
    },

    addFlexItem() {
      if (this._flexBoxCount >= 8) {
        UI.toast('Maximum 8 boxes reached.', 'info');
        return;
      }
      this._flexBoxCount++;
      const stage = document.getElementById('flex-interactive-stage');
      const badge = document.getElementById('flex-item-count-badge');
      if (stage) {
        const box = document.createElement('div');
        box.className = `flex-stage-box box-${((this._flexBoxCount - 1) % 6) + 1}`;
        box.innerHTML = `<span>Box ${this._flexBoxCount}</span>`;
        stage.appendChild(box);
      }
      if (badge) badge.textContent = `${this._flexBoxCount} Items`;
      this.updateFlexStage();
    },

    removeFlexItem() {
      if (this._flexBoxCount <= 1) {
        UI.toast('Minimum 1 box required.', 'info');
        return;
      }
      const stage = document.getElementById('flex-interactive-stage');
      const badge = document.getElementById('flex-item-count-badge');
      if (stage && stage.lastElementChild) {
        stage.removeChild(stage.lastElementChild);
        this._flexBoxCount--;
      }
      if (badge) badge.textContent = `${this._flexBoxCount} Items`;
      this.updateFlexStage();
    },

    copyFlexCSS() {
      const snippet = document.getElementById('flex-css-snippet')?.textContent || '';
      navigator.clipboard?.writeText(snippet).then(() => {
        UI.toast('CSS rules copied to clipboard!', 'success');
      }).catch(() => {
        UI.toast('Failed to copy.', 'warning');
      });
    },

    // ── 6. JS ARRAY & FUNCTIONAL LAB ────────────────────────────────────────
    selectJSMethod(method) {
      this._currentJSMethod = method;
      const pills = document.querySelectorAll('#js-method-pills .day-pill-btn');
      pills.forEach(p => {
        if (p.textContent.includes(method)) p.classList.add('active');
        else p.classList.remove('active');
      });

      const exprInput = document.getElementById('js-callback-expr');
      const presets = {
        map: 'x => x * 2',
        filter: 'x => x > 40',
        reduce: '(acc, curr) => acc + curr',
        find: 'x => x % 5 === 0',
        sort: '(a, b) => a - b'
      };
      if (exprInput && presets[method]) {
        exprInput.value = presets[method];
      }
      this.runJSLab();
    },

    runJSLab() {
      const rawArr = document.getElementById('js-input-array')?.value || '[]';
      const rawExpr = document.getElementById('js-callback-expr')?.value || 'x => x';
      const resultView = document.getElementById('js-lab-result-view');
      if (!resultView) return;

      try {
        const arr = JSON.parse(rawArr);
        if (!Array.isArray(arr)) throw new Error('Input must be a valid JSON array.');

        const fn = new Function(`return (${rawExpr})`)();
        let result;
        let explanation = '';

        if (this._currentJSMethod === 'map') {
          result = arr.map(fn);
          explanation = `Transformed each of the ${arr.length} elements using ${rawExpr}.`;
        } else if (this._currentJSMethod === 'filter') {
          result = arr.filter(fn);
          explanation = `Filtered ${arr.length} elements down to ${result.length} matching elements.`;
        } else if (this._currentJSMethod === 'reduce') {
          result = arr.reduce(fn);
          explanation = `Aggregated ${arr.length} elements into a single accumulated scalar value.`;
        } else if (this._currentJSMethod === 'find') {
          result = arr.find(fn);
          explanation = `Found first matching element: ${result !== undefined ? result : 'undefined'}`;
        } else if (this._currentJSMethod === 'sort') {
          result = [...arr].sort(fn);
          explanation = `Sorted ${arr.length} elements using custom comparator.`;
        }

        resultView.innerHTML = `
          <div class="d-flex flex-col gap-md">
            <div class="d-flex justify-between items-center flex-wrap gap-xs">
              <span class="font-bold text-success text-sm">Operation Successful</span>
              <span class="priority-badge priority-low font-mono text-xs">.${this._currentJSMethod}()</span>
            </div>
            <p class="text-muted text-xs m-0">${UI.esc(explanation)}</p>
            <div class="p-md rounded border bg-surface-alt">
              <div class="text-xs font-bold text-muted mb-xs">OUTPUT RESULT:</div>
              <pre class="font-mono text-sm font-bold text-brand m-0">${UI.esc(JSON.stringify(result, null, 2))}</pre>
            </div>
          </div>
        `;
      } catch (err) {
        resultView.innerHTML = `
          <div class="p-md rounded border text-danger bg-surface-alt">
            <span class="font-bold text-sm">Execution Error</span>
            <p class="font-mono text-xs text-secondary mt-xs m-0">${UI.esc(err.message)}</p>
          </div>
        `;
      }
    },

    // ── 7. REGEX PATTERN VALIDATOR LAB ──────────────────────────────────────
    setRegexPreset(preset) {
      const patternInput = document.getElementById('regex-pattern-input');
      const flagsInput = document.getElementById('regex-flags-input');
      const textInput = document.getElementById('regex-test-text');

      const presets = {
        email: {
          pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
          flags: 'gi',
          text: 'Contact support@pocketsly.edu or rizzqi.maulana@campus.ac.id for assistance.'
        },
        date: {
          pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b',
          flags: 'g',
          text: 'Upcoming semester deadlines: Midterm Exam on 2026-10-15 and Final Project submission on 2026-12-20.'
        },
        phone: {
          pattern: '(?:\\+62|08)[0-9]{8,12}',
          flags: 'g',
          text: 'Academic advisor mobile: +6281234567890 or student hotline 081987654321.'
        },
        hex: {
          pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
          flags: 'gi',
          text: 'Design tokens: primary #7C3AED, success #10B981, danger #EF4444, and white #FFF.'
        },
        nim: {
          pattern: '\\b(?:20|21|22|23|24|25|26)\\d{6,8}\\b',
          flags: 'g',
          text: 'Registered students: NIM 241011526, NIM 241011589, and NIM 231011902.'
        }
      };

      if (presets[preset]) {
        if (patternInput) patternInput.value = presets[preset].pattern;
        if (flagsInput) flagsInput.value = presets[preset].flags;
        if (textInput) textInput.value = presets[preset].text;
      }
      this.testRegex();
    },

    testRegex() {
      const pattern = document.getElementById('regex-pattern-input')?.value || '';
      const flags = document.getElementById('regex-flags-input')?.value || 'g';
      const text = document.getElementById('regex-test-text')?.value || '';
      const highlightOutput = document.getElementById('regex-highlight-output');
      const matchesList = document.getElementById('regex-matches-list');
      const badge = document.getElementById('regex-match-badge');

      if (!pattern) {
        if (highlightOutput) highlightOutput.textContent = text;
        if (badge) badge.textContent = '0 Matches';
        if (matchesList) matchesList.innerHTML = '';
        return;
      }

      try {
        const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
        const matches = [...text.matchAll(regex)];

        if (badge) {
          badge.textContent = `${matches.length} Match${matches.length === 1 ? '' : 'es'}`;
        }

        if (matches.length === 0) {
          if (highlightOutput) highlightOutput.textContent = text;
          if (matchesList) matchesList.innerHTML = '<p class="text-muted text-xs m-0">No matches found in test string.</p>';
          return;
        }

        let highlighted = '';
        let lastIndex = 0;
        for (const m of matches) {
          const matchStart = m.index;
          const matchEnd = matchStart + m[0].length;
          highlighted += UI.esc(text.substring(lastIndex, matchStart));
          highlighted += `<mark class="regex-match-pill">${UI.esc(m[0])}</mark>`;
          lastIndex = matchEnd;
        }
        highlighted += UI.esc(text.substring(lastIndex));
        if (highlightOutput) highlightOutput.innerHTML = highlighted;

        if (matchesList) {
          matchesList.innerHTML = `
            <div class="d-flex flex-col gap-xs">
              <span class="text-xs font-bold text-muted">CAPTURED MATCHES:</span>
              <div class="d-flex gap-xs flex-wrap">
                ${matches.map((m, idx) => `<span class="priority-badge text-xs font-mono">#${idx + 1}: ${UI.esc(m[0])}</span>`).join('')}
              </div>
            </div>
          `;
        }
      } catch (err) {
        if (highlightOutput) highlightOutput.innerHTML = `<span class="text-danger font-mono text-xs">Invalid Regex: ${UI.esc(err.message)}</span>`;
        if (badge) badge.textContent = 'Error';
      }
    }
  };

  Object.assign(window.Curriculum, labsMethods);
})();

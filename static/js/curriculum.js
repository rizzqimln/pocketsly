/**
 * CURRICULUM LAB CONTROLLER (curriculum.js)
 * ==========================================
 * LEARN: Complex Feature Modules & Real-Time UI Interactivity
 *
 * 1. sessionStorage       — Like localStorage but wiped when the browser tab
 *                           closes. Perfect for UI state (active tab) that
 *                           should not persist between sessions.
 * 2. Live SQL Sandbox     — We POST raw SQL to the server and render the JSON
 *                           response dynamically. No library needed.
 * 3. Sorting Visualiser   — setInterval() drives each animation step. We pause
 *                           between swaps to give the user time to see changes.
 * 4. Quiz State Machine   — quizIndex is the pointer. advanceQuiz() increments
 *                           it with modulo to wrap around the question bank.
 */

window.Curriculum = {
  activeTab: sessionStorage.getItem('curriculum_active_tab') || 'hub',
  dbSchema: null,
  algoArray: [],
  sortingInProgress: false,
  quizIndex: 0,
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
      question: "In CSS Flexbox (freeCodeCamp / W3Schools track), which property aligns flex items along the main axis?",
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
      question: "In SQL (The Odin Project / W3Schools track), what does a LEFT JOIN return?",
      options: [
        "Only rows that match in both tables.",
        "All rows from the left table, and matching rows from the right table.",
        "All rows from both tables regardless of match.",
        "Only records that have NULL primary keys."
      ],
      answer: 1,
      explanation: "A LEFT JOIN returns all records from the left table (table1), and the matched records from the right table (table2). If no match is found, NULL is returned for right table columns."
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
      explanation: "A foreign key is a column or group of columns in a relational database table that provides a link between data in two tables, enforcing referential integrity."
    },
    {
      question: "In Modern JavaScript (ES6+), what is the purpose of the async/await syntax?",
      options: [
        "To make JavaScript run synchronously on a single CPU core without an event loop.",
        "To write asynchronous Promises in a clean, synchronous-looking format.",
        "To automatically compile JavaScript into WebAssembly binary.",
        "To force DOM elements to re-render instantly without CSS."
      ],
      answer: 1,
      explanation: "async/await acts as syntactic sugar over Promises, making asynchronous code easier to read and maintain."
    },
    {
      question: "In Python and SQLite, which technique is used to prevent SQL Injection vulnerability?",
      options: [
        "Executing queries with raw string concatenation like `f'SELECT * FROM users WHERE name={name}'`",
        "Using '?' query placeholders or parameterized SQL inputs",
        "Running base64 encryption on every incoming query text",
        "Turning off SQLite foreign key constraints"
      ],
      answer: 1,
      explanation: "Passing parameterized inputs with '?' prevents attackers from manipulating the structure of your queries (SQL Injection)."
    },
    {
      question: "In Git Version Control (The Odin Project track), how do you create and switch to a new branch simultaneously?",
      options: [
        "git branch create <name>",
        "git checkout -b <name>",
        "git commit -m <name>",
        "git push origin <name>"
      ],
      answer: 1,
      explanation: "`git checkout -b <branch-name>` creates a new branch and immediately checks it out."
    },
    {
      question: "What is the primary difference between HTTP GET and POST requests?",
      options: [
        "GET is used to create server database records, while POST is read-only.",
        "GET requests parameters in the URL query string and should be idempotent, while POST sends data in the request body.",
        "GET encrypts data automatically, while POST is plain text.",
        "POST can only be sent over HTTP 1.0."
      ],
      answer: 1,
      explanation: "GET is designed to retrieve data without side effects (idempotent), whereas POST submits data to be processed in the request body."
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
      explanation: "Binary search repeatedly divides the search interval in half, yielding O(log n) time complexity. The array must be sorted."
    },
    {
      question: "In relational database design, what is the goal of Third Normal Form (3NF)?",
      options: [
        "To ensure all data is stored in a single flat table.",
        "To eliminate transitive functional dependencies where non-key attributes depend on other non-key attributes.",
        "To convert all numeric data types to string data types.",
        "To remove all primary keys from child tables."
      ],
      answer: 1,
      explanation: "3NF requires a table to be in 2NF and that all non-key columns depend only on the primary key, eliminating transitive dependencies."
    },
    {
      question: "In the CSS Box Model, setting `box-sizing: border-box` causes an element's specified width to include:",
      options: [
        "Only the inner content area.",
        "Content, padding, and border (excluding margin).",
        "Content and margin (excluding border and padding).",
        "Padding and margin (excluding border and content)."
      ],
      answer: 1,
      explanation: "`box-sizing: border-box` includes padding and borders in the element's total calculated width and height, preventing layout breakage."
    },
    {
      question: "In JavaScript's Event Loop, which tasks execute first when the current Call Stack becomes empty?",
      options: [
        "Macrotasks (e.g. setTimeout callbacks)",
        "Microtasks (e.g. Promise.then and queueMicrotask callbacks)",
        "setInterval timer executions",
        "Browser window resizing events"
      ],
      answer: 1,
      explanation: "The Microtask Queue is always drained completely before the event loop picks up the next task from the Macrotask (Callback) Queue."
    },
    {
      question: "Which Data Structure operates on a Last-In, First-Out (LIFO) principle?",
      options: [
        "Queue",
        "Stack",
        "Binary Search Tree",
        "Linked List"
      ],
      answer: 1,
      explanation: "A Stack operates on LIFO (Last-In, First-Out), where elements are pushed and popped from the top (e.g. call stack, undo history)."
    },
    {
      question: "What is the key difference between TCP and UDP at the Transport Layer?",
      options: [
        "TCP is connection-oriented and guarantees reliable, ordered packet delivery; UDP is connectionless and prioritized for low-latency streaming.",
        "UDP guarantees zero packet loss, whereas TCP does not.",
        "TCP only works over Wi-Fi, while UDP works over Ethernet.",
        "UDP encrypts all traffic by default, while TCP sends plaintext."
      ],
      answer: 0,
      explanation: "TCP uses three-way handshakes, acknowledgments, and retransmissions for reliable delivery. UDP is lightweight with no connection overhead."
    },
    {
      question: "How does creating an Index on a database column improve performance?",
      options: [
        "It compresses the database file to 10% of its size.",
        "It builds an auxiliary search structure (like a B-Tree) to speed up SELECT queries, with a trade-off in INSERT/UPDATE speed.",
        "It automatically prevents duplicate entries across all tables.",
        "It removes the need for Primary Keys."
      ],
      answer: 1,
      explanation: "Database indexes allow the query engine to locate rows in O(log n) time using B-Trees rather than scanning the entire table (full table scan)."
    },
    {
      question: "In Object-Oriented Programming (OOP), what is Polymorphism?",
      options: [
        "The ability to bundle data and methods into a single class entity.",
        "The ability for different classes to be treated as instances of the same parent class through a common interface.",
        "The process of copying class definitions into multiple files.",
        "The restriction of private member variables from external access."
      ],
      answer: 1,
      explanation: "Polymorphism allows objects of different subtypes to respond to the same method call with subclass-specific behavior."
    },
    {
      question: "Which of the following is the most effective defense against Cross-Site Scripting (XSS) in web applications?",
      options: [
        "Relying solely on HTTPS certificates.",
        "Context-aware HTML entity encoding and escaping user-supplied input before rendering to the DOM.",
        "Storing passwords in plaintext inside cookies.",
        "Disabling CSS animations across the client."
      ],
      answer: 1,
      explanation: "Sanitizing and encoding untrusted inputs into safe HTML entities prevents injected `<script>` tags from executing in the victim's browser."
    },
    {
      question: "What is the difference between HTTP 401 Unauthorized and HTTP 403 Forbidden status codes?",
      options: [
        "401 means the server crashed; 403 means the database is full.",
        "401 indicates unauthenticated access (login required); 403 indicates authentication succeeded but access is denied (insufficient permissions).",
        "401 is used for GET requests; 403 is used for POST requests.",
        "401 and 403 are identical and interchangeable in REST APIs."
      ],
      answer: 1,
      explanation: "401 Unauthorized means 'Who are you? Please provide valid credentials.' 403 Forbidden means 'I know who you are, but you do not have permission to view this resource.'"
    },
    {
      question: "In a Hash Table, what is the 'Separate Chaining' collision resolution technique?",
      options: [
        "Re-hashing the entire table every time a collision occurs.",
        "Storing all elements that hash to the same bucket in a linked list or dynamic array attached to that bucket.",
        "Overwriting the previous value silently.",
        "Dropping the key and throwing a runtime exception."
      ],
      answer: 1,
      explanation: "Separate Chaining handles hash collisions by maintaining a linked list of key-value pairs at each bucket index."
    },
    {
      question: "What does the 'A' in the database ACID transaction properties stand for?",
      options: [
        "Asynchronous",
        "Atomicity",
        "Availability",
        "Aggregation"
      ],
      answer: 1,
      explanation: "Atomicity ensures that all operations in a database transaction succeed or the entire transaction is rolled back (all-or-nothing)."
    },
    {
      question: "In Tree Traversal algorithms, which traversal visits the Left subtree, Current node, and Right subtree in that order?",
      options: [
        "Pre-order Traversal",
        "In-order Traversal",
        "Post-order Traversal",
        "Level-order Traversal"
      ],
      answer: 1,
      explanation: "In-order traversal visits Left -> Root -> Right. In a Binary Search Tree, In-order traversal visits all values in ascending sorted order."
    },
    {
      question: "In modern containerization (Docker), what is the difference between an Image and a Container?",
      options: [
        "An image is a running instance; a container is a read-only blueprint.",
        "An image is a read-only template with instructions for building; a container is a runnable, isolated instance of an image.",
        "Images can only run on Linux; containers can only run on Windows.",
        "There is no technical difference between them."
      ],
      answer: 1,
      explanation: "A Docker Image is an immutable snapshot of an application with its dependencies; a Docker Container is the live, isolated running process."
    },
    {
      question: "What is the purpose of the HTTP `ETag` response header?",
      options: [
        "To measure server temperature.",
        "To provide a unique content hash / fingerprint used by clients for conditional validation caching (`If-None-Match`).",
        "To force the browser to clear localStorage on every page load.",
        "To specify the email address of the server administrator."
      ],
      answer: 1,
      explanation: "An ETag (Entity Tag) is an identifier assigned to a specific version of a resource to enable efficient conditional HTTP caching (304 Not Modified)."
    }
  ],

  init() {
    this.setupEventListeners();
    this.generateAlgoArray();
  },

  load() {
    this.switchTab(this.activeTab);
    this.loadSchema();
    this.loadQuizQuestion();
    this.loadAcademicData();
    this.loadPerformanceData();
    this.renderGPACalculator();
  },

  setupEventListeners() {
    // Tab selectors
    document.querySelectorAll('.curr-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // SQL Playground Buttons
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
          results.innerHTML = '<p class="text-muted" style="margin: 0; text-align: center; padding: 1.5rem 0;">Ready to execute. Pick a table above or write your SQL query.</p>';
        }
      };
    }

    // SQL Playground templates
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

    // Backend Explorer buttons
    document.querySelectorAll('.backend-trigger-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.runBackendInspector(action);
      });
    });

    // Add Course submit
    const courseForm = document.getElementById('add-course-form');
    if (courseForm) {
      courseForm.onsubmit = async (e) => {
        e.preventDefault();
        const code    = document.getElementById('course-code').value.trim();
        const name    = document.getElementById('course-name').value.trim();
        const credits = document.getElementById('course-credits').value;

        try {
          // LEARN: Guard clause — return early on error instead of nesting in else
          const res = await API.post('/api/courses', { code, name, credits });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Course saved successfully.', 'success');
          courseForm.reset();
          this.loadAcademicData();
          this.loadSchema();
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
        const name   = document.getElementById('lecturer-name').value.trim();
        const email  = document.getElementById('lecturer-email').value.trim();
        const office = document.getElementById('lecturer-office').value.trim();

        try {
          const res = await API.post('/api/lecturers', { name, email, office });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Lecturer profile added.', 'success');
          lecturerForm.reset();
          this.loadAcademicData();
          this.loadSchema();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Algo buttons
    const shuffleBtn = document.getElementById('algo-generate-arr');
    if (shuffleBtn) {
      shuffleBtn.onclick = () => this.generateAlgoArray();
    }

    const bubbleBtn = document.getElementById('algo-sort-bubble');
    if (bubbleBtn) {
      bubbleBtn.onclick = () => this.bubbleSort();
    }

    const quickBtn = document.getElementById('algo-sort-quick');
    if (quickBtn) {
      quickBtn.onclick = () => this.startQuickSort();
    }

    // Algo Speed Slider
    const speedInput = document.getElementById('algo-speed');
    const speedVal = document.getElementById('algo-speed-val');
    if (speedInput && speedVal) {
      speedInput.oninput = (e) => {
        speedVal.textContent = `${e.target.value}ms`;
      };
    }

    // Quiz button
    const nextQuizBtn = document.getElementById('quiz-next-btn');
    if (nextQuizBtn) {
      nextQuizBtn.onclick = () => this.nextQuiz();
    }

    // Quiz Back Button (Toggle flip on click to see question/explanation again)
    const quizBackBtn = document.getElementById('quiz-back-btn');
    if (quizBackBtn) {
      quizBackBtn.onclick = () => {
        const card3d = document.getElementById('quiz-card-3d');
        if (card3d) card3d.classList.toggle('flipped');
      };
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;
    try {
      sessionStorage.setItem('curriculum_active_tab', tabName);
    } catch (e) { }

    // Map tab names to user-friendly titles and category groups
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
      'db': { title: 'Relational Database (SQL) Sandbox', category: 'backend' },
      'backend': { title: 'Backend API Flow Explorer', category: 'backend' }
    };

    const currentMeta = tabMeta[tabName] || { title: tabName, category: 'general' };

    // Update active tab buttons in topbar
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

    // Update breadcrumb indicator pill
    const activeNameEl = document.getElementById('curr-active-tab-name');
    if (activeNameEl) {
      activeNameEl.textContent = currentMeta.title;
    }

    // If switching to one of the 3 section filters, show the Hub and filter the 3 section blocks
    if (tabName === 'hub' || tabName === 'general-sec' || tabName === 'frontend-sec' || tabName === 'backend-sec') {
      document.querySelectorAll('.curr-panel').forEach(panel => {
        if (panel.id === 'curr-hub') {
          panel.classList.remove('hidden');
        } else {
          panel.classList.add('hidden');
        }
      });

      const secGen = document.getElementById('curr-sec-general');
      const secFront = document.getElementById('curr-sec-frontend');
      const secBack = document.getElementById('curr-sec-backend');

      if (tabName === 'hub') {
        if (secGen) secGen.style.display = 'block';
        if (secFront) secFront.style.display = 'block';
        if (secBack) secBack.style.display = 'block';
      } else if (tabName === 'general-sec') {
        if (secGen) secGen.style.display = 'block';
        if (secFront) secFront.style.display = 'none';
        if (secBack) secBack.style.display = 'none';
        if (secGen) secGen.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (tabName === 'frontend-sec') {
        if (secGen) secGen.style.display = 'none';
        if (secFront) secFront.style.display = 'block';
        if (secBack) secBack.style.display = 'none';
        if (secFront) secFront.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (tabName === 'backend-sec') {
        if (secGen) secGen.style.display = 'none';
        if (secFront) secFront.style.display = 'none';
        if (secBack) secBack.style.display = 'block';
        if (secBack) secBack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    // Show/hide specific view panels (e.g. curr-db, curr-performance, curr-algorithms)
    document.querySelectorAll('.curr-panel').forEach(panel => {
      if (panel.id === `curr-${tabName}`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    // Lazy load data on switch
    if (tabName === 'performance') {
      this.loadPerformanceData();
    } else if (tabName === 'algorithms') {
      if (!this.algoArray || this.algoArray.length === 0) {
        this.generateAlgoArray();
      } else {
        this.renderAlgoBars();
      }
    } else if (tabName === 'db') {
      this.loadSchema();
    } else if (tabName === 'academic') {
      this.loadAcademicData();
    } else if (tabName === 'resources') {
      window.App?.navigateTo('notes');
      setTimeout(() => window.Notes?.switchTab('library'), 50);
    } else if (tabName === 'flashcards') {
      this.loadQuizQuestion();
    } else if (tabName === 'gpa') {
      this.renderGPACalculator();
    } else if (tabName === 'flexbox') {
      this.updateFlexStage();
    } else if (tabName === 'jslab') {
      this.runJSLab();
    } else if (tabName === 'regexlab') {
      this.testRegex();
    }
  },

  // =========================================================================
  // 1. DATABASE SCHEMA VIEWER & SQL PLAYGROUND
  // =========================================================================

  async loadSchema(selectedTable = 'all') {
    const viewer = document.getElementById('db-schema-viewer');
    if (!viewer) return;

    try {
      const res = await API.get('/api/curriculum/schema');
      if (res.error) {
        viewer.innerHTML = `<p class="text-danger">Failed to load schema: ${UI.esc(res.error)}</p>`;
        return;
      }

      this.dbSchema = res;
      const tableNames = Object.keys(res).sort();

      let tabsHtml = `
        <div class="schema-tabs-bar" style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.85rem; padding-bottom: 0.6rem; border-bottom: 1px solid var(--border-color);">
          <button type="button" class="day-pill-btn ${selectedTable === 'all' ? 'active' : ''}" onclick="Curriculum.loadSchema('all')" style="padding: 0.2rem 0.55rem; font-size: 0.72rem;">All (${tableNames.length})</button>
          ${tableNames.map(t => `
            <button type="button" class="day-pill-btn ${selectedTable === t ? 'active' : ''}" onclick="Curriculum.loadSchema('${t}')" style="padding: 0.2rem 0.55rem; font-size: 0.72rem;">${UI.esc(t)}</button>
          `).join('')}
        </div>
      `;

      let tablesToRender = selectedTable === 'all' ? tableNames : [selectedTable];
      let tablesHtml = '';

      for (const table of tablesToRender) {
        const columns = res[table];
        if (!columns) continue;
        tablesHtml += `
          <div class="schema-table-box" style="margin-bottom: 0.85rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <h5 class="schema-table-title" style="margin: 0; display: inline-flex; align-items: center; gap: 0.35rem;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
                ${UI.esc(table)}
              </h5>
              <button type="button" class="btn btn-outline btn-sm" onclick="Curriculum.queryTable('${table}')" style="padding: 0.15rem 0.45rem; font-size: 0.7rem;">
                Query Table
              </button>
            </div>
            <table class="schema-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Key</th>
                </tr>
              </thead>
              <tbody>
                ${columns.map(c => `
                  <tr>
                    <td class="${c.pk ? 'text-primary font-bold' : ''}">${UI.esc(c.name)} ${c.pk ? '<span class="priority-badge priority-high" style="font-size:0.6rem; padding:1px 4px; margin-left:4px;">PK</span>' : ''}</td>
                    <td><code>${UI.esc(c.type)}</code></td>
                    <td>${c.pk ? 'PK' : (c.notnull ? 'NN' : '')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      viewer.innerHTML = tabsHtml + tablesHtml;
    } catch (e) {
      viewer.innerHTML = `<p class="text-danger">Failed to connect to backend: ${UI.esc(e.message)}</p>`;
    }
  },

  toggleSchemaCollapse() {
    const card = document.querySelector('.schema-card');
    const btn = document.getElementById('schema-toggle-btn');
    if (!card) return;
    const isCollapsed = card.classList.toggle('collapsed');
    if (btn) {
      btn.textContent = isCollapsed ? 'Expand Schema' : 'Collapse';
    }
  },

  /** Inserts SQL keywords / symbols at the current cursor position */
  insertSQLSymbol(symbol) {
    const input = document.getElementById('sql-query-input');
    if (!input) return;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const val = input.value;
    input.value = val.substring(0, start) + symbol + val.substring(end);
    const newPos = start + symbol.length;
    input.focus();
    input.setSelectionRange(newPos, newPos);
  },

  /** Populates SQL playground with query for selected table and runs it */
  queryTable(tableName) {
    const qInput = document.getElementById('sql-query-input');
    if (qInput) {
      qInput.value = `SELECT * FROM ${tableName} LIMIT 10;`;
      qInput.focus();
      this.runSQL();
    }
  },

  async runSQL() {
    const queryInput = document.getElementById('sql-query-input');
    const resultsContainer = document.getElementById('sql-results-container');
    if (!queryInput || !resultsContainer) return;

    const sql = queryInput.value.trim();
    if (!sql) {
      UI.toast('Please write a SQL query first.', 'warning');
      return;
    }

    resultsContainer.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
        <div style="display: inline-block; width: 18px; height: 18px; border: 2px solid var(--primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 0.5rem;"></div>
        <p style="margin: 0; font-size: 0.85rem;">Executing query against SQLite...</p>
      </div>
    `;

    const startTime = performance.now();

    try {
      const res = await API.post('/api/curriculum/playground', { query: sql });
      const elapsedMs = Math.round(performance.now() - startTime);

      if (res.error) {
        resultsContainer.innerHTML = `
          <div class="sql-error-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span class="error-badge" style="color: var(--accent-danger); font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                SQL Execution Error
              </span>
              <span style="font-size: 0.72rem; opacity: 0.75; font-family: var(--font-mono);">${elapsedMs}ms</span>
            </div>
            <pre style="margin: 0; white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.45;">${UI.esc(res.error)}</pre>
          </div>
        `;
        UI.toast('Query execution failed.', 'danger');
        return;
      }

      const rows = res.rows || (Array.isArray(res) ? res : []);
      const columns = res.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

      if (res.type === 'write') {
        resultsContainer.innerHTML = `
          <div class="sql-success-box" style="padding: 0.85rem 1rem; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #10B981; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.88rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                Query Executed Successfully
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${elapsedMs}ms</span>
            </div>
            <p style="margin: 0.35rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);"><strong>Affected rows:</strong> ${res.affected_rows || 0}</p>
          </div>
        `;
        UI.toast('Database updated successfully.', 'success');
        this.loadSchema(); // Reload tables in case keys or tables changed
      } else {
        if (!columns || columns.length === 0 || rows.length === 0) {
          const colsHeader = (columns && columns.length > 0)
            ? `<thead><tr>${columns.map(c => `<th>${UI.esc(c)}</th>`).join('')}</tr></thead>`
            : '';
          resultsContainer.innerHTML = `
            <div class="sql-success-box">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span class="priority-badge priority-medium" style="font-size: 0.75rem;">0 rows returned</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${elapsedMs}ms</span>
              </div>
              <div class="results-table-wrapper">
                <table class="results-table">
                  ${colsHeader}
                  <tbody>
                    <tr>
                      <td colspan="${(columns && columns.length) || 1}" style="text-align: center; color: var(--text-muted); padding: 1.5rem 1rem;">
                        Query executed successfully, but returned 0 rows.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `;
          return;
        }

        const headersHtml = columns.map(c => `<th>${UI.esc(c)}</th>`).join('');
        const rowsHtml = rows.map(row => {
          return `<tr>${columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) {
              return `<td><span class="null-tag">NULL</span></td>`;
            }
            return `<td>${UI.esc(String(val))}</td>`;
          }).join('')}</tr>`;
        }).join('');

        resultsContainer.innerHTML = `
          <div class="sql-success-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
              <span class="priority-badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 700; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                ${rows.length} rows returned
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${elapsedMs}ms</span>
            </div>
            <div class="results-table-wrapper">
              <table class="results-table">
                <thead>
                  <tr>${headersHtml}</tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `;
        UI.toast(`Query returned ${rows.length} rows.`, 'success');
      }
    } catch (e) {
      resultsContainer.innerHTML = `
        <div class="sql-error-box">
          <span class="error-badge" style="display: inline-flex; align-items: center; gap: 4px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Network / Server Error
          </span>
          <pre style="margin: 0; white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.82rem;">${UI.esc(e.message)}</pre>
        </div>
      `;
    }
  },

  // =========================================================================
  // 2. BACKEND API FLOW EXPLORER
  // =========================================================================

  async runBackendInspector(action) {
    const outputEl = document.getElementById('backend-inspector-output');
    if (!outputEl) return;

    outputEl.innerHTML = '<pre><code>Waiting for API server response...</code></pre>';
    let endpoint = '/api/session';
    let method = 'GET';

    switch (action) {
      case 'get-session':
        endpoint = '/api/session';
        break;
      case 'get-tasks':
        endpoint = '/api/tasks';
        break;
      case 'get-schema':
        endpoint = '/api/curriculum/schema';
        break;
      case 'get-habits':
        endpoint = '/api/habits';
        break;
      case 'get-notes':
        endpoint = '/api/notes';
        break;
      case 'get-courses':
        endpoint = '/api/courses';
        break;
      case 'get-incomes':
        endpoint = '/api/incomes';
        break;
      case 'get-expenses':
        endpoint = '/api/expenses';
        break;
      case 'get-budget-summary':
        endpoint = '/api/budget/summary';
        break;
      default:
        endpoint = action.startsWith('/') ? action : `/api/${action}`;
    }

    try {
      const res = await API.get(endpoint);
      const inspectorHtml = `
        <div class="inspector-meta">
          <span class="badge method-badge">${method}</span>
          <span class="endpoint-path">${UI.esc(endpoint)}</span>
          <span class="status-badge success">200 OK</span>
        </div>
        <hr class="inspector-divider">
        <div class="inspector-section">
          <h5>Request Configuration</h5>
          <pre><code class="language-js">fetch('${endpoint}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin' // Authenticated Session Cookie
})</code></pre>
        </div>
        <div class="inspector-section">
          <h5>JSON Response Body</h5>
          <pre><code class="language-json">${UI.esc(JSON.stringify(res, null, 2))}</code></pre>
        </div>
      `;
      outputEl.innerHTML = inspectorHtml;
      UI.toast(`Inspected API call to ${endpoint}`, 'info');
    } catch (e) {
      outputEl.innerHTML = `<pre><code class="text-danger">Failed: ${UI.esc(e.message)}</code></pre>`;
    }
  },

  // =========================================================================
  // 3. ACADEMIC & FACULTY MANAGEMENT

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
          <div class="task-item" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
            <div class="task-details">
              <span class="task-title">${UI.esc(c.code)} - ${UI.esc(c.name)}</span>
              <span class="task-meta">${UI.esc(c.credits)} SKS (Credits)</span>
            </div>
            <button class="btn btn-danger" onclick="Curriculum.deleteCourse(${c.id})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Delete</button>
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
          <div class="task-item" style="padding: 0.75rem 1rem; margin-bottom: 0.5rem;">
            <div class="task-details">
              <span class="task-title">${UI.esc(l.name)}</span>
              <span class="task-meta">${UI.esc(l.email || 'No Email')} | Office: ${UI.esc(l.office || 'N/A')}</span>
            </div>
            <button class="btn btn-danger" onclick="Curriculum.deleteLecturer(${l.id})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Delete</button>
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
        this.loadSchema();
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
        this.loadSchema();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  // =========================================================================
  // =========================================================================
  // 5. SORTING ALGORITHMS VISUALIZER
  // =========================================================================

  generateAlgoArray() {
    if (this.sortingInProgress) return;
    this.algoArray = [];
    for (let i = 0; i < 20; i++) {
      this.algoArray.push(Math.floor(Math.random() * 140) + 10);
    }
    this.renderAlgoBars();
    const logEl = document.getElementById('algo-steps-log');
    if (logEl) logEl.textContent = 'Array randomized! Click Bubble Sort or Quick Sort to visualize.';
  },

  renderAlgoBars(activeIndices = [], sortedIndices = []) {
    const container = document.getElementById('algo-bars-container');
    if (!container) return;

    container.innerHTML = '';
    this.algoArray.forEach((val, idx) => {
      const bar = document.createElement('div');
      bar.className = 'algo-bar';
      bar.style.height = `${val}px`;

      if (sortedIndices.includes(idx)) {
        bar.classList.add('sorted');
      } else if (activeIndices.includes(idx)) {
        bar.classList.add('active');
      }

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

    logEl.innerHTML = `<strong>Bubble Sort algorithm started!</strong> Best time complexity: O(n), Worst/Avg: O(n²). Comparing adjacent index blocks...`;

    let sorted = [];
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len - i - 1; j++) {
        this.renderAlgoBars([j, j + 1], sorted);
        await this.sleep(120);

        if (arr[j] > arr[j + 1]) {
          let temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          logEl.innerHTML = `Swapping index <strong>${j}</strong> (${arr[j + 1]}) and index <strong>${j + 1}</strong> (${arr[j]}) because ${arr[j + 1]} > ${arr[j]}.`;
          this.renderAlgoBars([j, j + 1], sorted);
          await this.sleep(120);
        }
      }
      sorted.push(len - i - 1);
    }

    this.renderAlgoBars([], Array.from({ length: len }, (_, i) => i));
    logEl.innerHTML = `<strong>Bubble Sort Completed!</strong> Entire array successfully ordered. Time: O(n²) worst-case execution completed.`;
    this.sortingInProgress = false;
    UI.toast('Bubble Sort completed!', 'success');
  },

  async startQuickSort() {
    if (this.sortingInProgress) return;
    this.sortingInProgress = true;
    const logEl = document.getElementById('algo-steps-log');
    logEl.innerHTML = `<strong>Quick Sort algorithm started!</strong> Average Time Complexity: O(n log n). Employs recursive Divide & Conquer approach via PIVOT choices.`;

    await this.quickSort(0, this.algoArray.length - 1);

    this.renderAlgoBars([], Array.from({ length: this.algoArray.length }, (_, i) => i));
    logEl.innerHTML = `<strong>Quick Sort Completed!</strong> Balanced divide-and-conquer strategy achieved O(n log n) efficiency.`;
    this.sortingInProgress = false;
    UI.toast('Quick Sort completed!', 'success');
  },

  async quickSort(low, high) {
    if (low < high) {
      let pi = await this.partition(low, high);
      await this.quickSort(low, pi - 1);
      await this.quickSort(pi + 1, high);
    }
  },

  async partition(low, high) {
    const logEl = document.getElementById('algo-steps-log');
    let arr = this.algoArray;
    let pivot = arr[high];
    logEl.innerHTML = `Choosing pivot element <strong>${pivot}</strong> at index ${high}. Partitioning subarray bounds...`;

    let i = (low - 1);

    for (let j = low; j < high; j++) {
      this.renderAlgoBars([j, high]);
      await this.sleep(150);

      if (arr[j] < pivot) {
        i++;
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
        logEl.innerHTML = `Element ${arr[i]} is smaller than pivot ${pivot}. Swapping to index ${i}.`;
        this.renderAlgoBars([i, j, high]);
        await this.sleep(150);
      }
    }

    let temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    logEl.innerHTML = `Placing pivot ${pivot} at its final sorted boundary index ${i + 1}.`;
    this.renderAlgoBars([i + 1, high]);
    await this.sleep(150);

    return i + 1;
  },

  // =========================================================================
  // 6. ROADMAP ACADEMIC QUIZZES / FLASHCARDS
  // =========================================================================

  loadQuizQuestion() {
    const qText = document.getElementById('quiz-question-text');
    const optionsBox = document.getElementById('quiz-options-box');
    const progressText = document.getElementById('quiz-progress-text');
    const card3d = document.getElementById('quiz-card-3d');

    if (!qText || !optionsBox || !progressText) return;

    // Ensure card is not flipped
    if (card3d) card3d.classList.remove('flipped');

    const currentQuiz = this.quizQuestions[this.quizIndex];
    qText.textContent = currentQuiz.question;
    progressText.textContent = `Question ${this.quizIndex + 1} of ${this.quizQuestions.length}`;

    optionsBox.innerHTML = '';
    currentQuiz.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + idx)}</span> <span class="opt-text">${UI.esc(opt)}</span>`;
      btn.onclick = () => this.checkQuizAnswer(idx);
      optionsBox.appendChild(btn);
    });
  },

  checkQuizAnswer(selectedIdx) {
    const currentQuiz = this.quizQuestions[this.quizIndex];
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const resultBadge = document.getElementById('quiz-result-badge');
    const card3d = document.getElementById('quiz-card-3d');

    if (!feedbackBox || !resultBadge || !card3d) return;

    const isCorrect = selectedIdx === currentQuiz.answer;

    if (isCorrect) {
      resultBadge.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Correct!`;
      resultBadge.className = 'quiz-badge badge-success d-inline-flex items-center justify-center gap-xs';
      feedbackBox.innerHTML = `<p class="explanation-text">${UI.esc(currentQuiz.explanation)}</p>`;
      UI.toast('Well done! Correct answer.', 'success');
    } else {
      resultBadge.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Incorrect`;
      resultBadge.className = 'quiz-badge badge-danger d-inline-flex items-center justify-center gap-xs';
      feedbackBox.innerHTML = `
        <p class="wrong-alert">You selected option <strong>${String.fromCharCode(65 + selectedIdx)}</strong></p>
        <p class="explanation-text"><strong>Correct Answer:</strong> ${UI.esc(currentQuiz.options[currentQuiz.answer])}</p>
        <p class="explanation-text" style="margin-top: 0.5rem;">${UI.esc(currentQuiz.explanation)}</p>
      `;
      UI.toast('Incorrect choice, review the explanation.', 'warning');
    }

    // Trigger flip transition
    card3d.classList.add('flipped');
  },

  nextQuiz() {
    this.quizIndex = (this.quizIndex + 1) % this.quizQuestions.length;
    this.loadQuizQuestion();
  },

  async loadPerformanceData() {
    try {
      const [coursesRes, tasksRes, habitsRes, studyLogsRes] = await Promise.all([
        API.get('/api/courses'),
        API.get('/api/tasks'),
        API.get('/api/habits'),
        API.get('/api/study-logs')
      ]);

      const courses = Array.isArray(coursesRes) ? coursesRes : [];
      const tasks = Array.isArray(tasksRes) ? tasksRes : [];
      const habits = Array.isArray(habitsRes) ? habitsRes : [];
      const studyLogs = Array.isArray(studyLogsRes) ? studyLogsRes : [];

      // 1. Course Complete Progress & List
      const progressList = document.getElementById('perf-course-progress-list');
      const percentageEl = document.getElementById('perf-course-percentage');
      if (progressList) {
        if (courses.length === 0) {
          if (percentageEl) percentageEl.textContent = '0%';
          progressList.innerHTML = `
            <div style="text-align: center; padding: 1rem; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
              <p class="text-muted" style="font-size: 0.8rem; margin: 0 0 0.5rem 0;">No courses added yet.</p>
              <button class="btn btn-outline btn-xs" onclick="Curriculum.openAddCourseModal()">+ Add Your First Course</button>
            </div>
          `;
        } else {
          const totalProg = courses.reduce((sum, c) => sum + (Number(c.progress) || 0), 0);
          const avgProg = Math.round(totalProg / courses.length);
          if (percentageEl) {
            percentageEl.textContent = `${avgProg}%`;
          }

          progressList.innerHTML = courses.map(c => {
            const prog = Number(c.progress) || 0;
            return `
              <div class="perf-course-row" style="background: var(--bg-surface-alt); padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;" title="${UI.esc(c.code)} - ${UI.esc(c.name)}">
                    ${UI.esc(c.code)}: ${UI.esc(c.name)}
                  </span>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="color: var(--primary);">${prog}%</span>
                    <button class="btn-icon" style="padding: 2px;" onclick="Curriculum.openEditProgressModal(${c.id}, ${prog}, '${UI.esc(c.name).replace(/'/g, "\\'")}')" title="Edit Progress">
                      <svg class="icon-svg" viewBox="0 0 24 24" style="width: 0.9em; height: 0.9em;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="btn-icon text-muted" style="padding: 2px;" onclick="Curriculum.deleteCourseFromPerf(${c.id})" title="Remove Course">
                      <svg class="icon-svg" viewBox="0 0 24 24" style="width: 0.9em; height: 0.9em;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
                <div class="course-progress-bar-container" style="height: 6px; background: var(--bg-hover); border-radius: var(--radius-full); overflow: hidden;">
                  <div class="course-progress-bar-fill" style="width: ${prog}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-400)); border-radius: var(--radius-full); transition: width 0.3s ease;"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // 2. Overall Productivity & Activity Heatmap
      const prodEl = document.getElementById('perf-productivity-hours');
      const breakdownEl = document.getElementById('perf-theory-practice-breakdown');
      const heatmapContainer = document.getElementById('perf-heatmap-grid');

      // Calculate hours from study logs in past 7 days (or total if recent)
      const now = new Date();
      const past7Days = new Date();
      past7Days.setDate(past7Days.getDate() - 7);

      let weeklyTheory = 0;
      let weeklyPractice = 0;
      let totalLoggedHours = 0;

      const dateHoursMap = {};

      studyLogs.forEach(log => {
        const hrs = Number(log.hours) || 0;
        totalLoggedHours += hrs;
        const logDate = new Date(log.log_date);
        dateHoursMap[log.log_date] = (dateHoursMap[log.log_date] || 0) + hrs;

        if (logDate >= past7Days) {
          if (log.activity_type === 'theory' || log.activity_type === 'lecture') {
            weeklyTheory += hrs;
          } else {
            weeklyPractice += hrs;
          }
        }
      });

      // If no study logs, estimate from completed tasks/habits
      let weeklyTotal = weeklyTheory + weeklyPractice;
      if (studyLogs.length === 0) {
        const completedTasksCount = tasks.filter(t => t.done === 1).length;
        let habitCount = 0;
        habits.forEach(h => { if (h.today_done) habitCount++; });
        weeklyTotal = Math.max(0, (completedTasksCount * 2) + habitCount);
        weeklyTheory = Math.round(weeklyTotal * 0.35);
        weeklyPractice = weeklyTotal - weeklyTheory;
      }

      if (prodEl) {
        prodEl.innerHTML = `${weeklyTotal} <span style="font-size: 1rem; font-weight: 500; color: var(--text-muted);">hours/week</span>`;
      }
      if (breakdownEl) {
        breakdownEl.innerHTML = `${weeklyTheory} h theory &bull; ${weeklyPractice} h practice`;
      }

      // Render 28-cell heatmap for past 4 weeks (28 days)
      if (heatmapContainer) {
        let heatmapHtml = '';
        for (let i = 27; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const iso = d.toISOString().split('T')[0];
          const hrs = dateHoursMap[iso] || 0;
          let valClass = 'val-0';
          if (hrs > 4) valClass = 'val-4';
          else if (hrs >= 3) valClass = 'val-3';
          else if (hrs >= 1.5) valClass = 'val-2';
          else if (hrs > 0) valClass = 'val-1';

          heatmapHtml += `<div class="heatmap-cell ${valClass}" title="${iso}: ${hrs} hours logged"></div>`;
        }
        heatmapContainer.innerHTML = heatmapHtml;
      }

      // 3. Tasks & Quiz Mastery
      const hwEl = document.getElementById('perf-homeworks-percentage');
      const pendingEl = document.getElementById('perf-pending-tasks');
      const doneEl = document.getElementById('perf-done-tasks');

      const doneTasks = tasks.filter(t => t.done === 1).length;
      const pendingTasks = tasks.length - doneTasks;

      if (pendingEl) pendingEl.textContent = `${pendingTasks} pending`;
      if (doneEl) doneEl.textContent = `${doneTasks} completed`;

      if (hwEl) {
        if (tasks.length === 0) {
          hwEl.textContent = '100%';
        } else {
          const pct = Math.round((doneTasks / tasks.length) * 100);
          hwEl.textContent = `${pct}%`;
        }
      }

      // 4. Study Logs List & Total Monthly Hours
      const totalHoursEl = document.getElementById('perf-monthly-hours-total');
      if (totalHoursEl) {
        totalHoursEl.innerHTML = `${totalLoggedHours.toFixed(1)} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">hours logged total</span>`;
      }

      const studyLogsContainer = document.getElementById('perf-study-logs-container');
      if (studyLogsContainer) {
        if (studyLogs.length === 0) {
          studyLogsContainer.innerHTML = `
            <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
              No study sessions logged yet. Click "Add Study Session" above to track your practice & theory hours.
            </div>
          `;
        } else {
          studyLogsContainer.innerHTML = `
            <table class="schema-table" style="width: 100%; font-size: 0.82rem;">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject / Course</th>
                  <th>Category</th>
                  <th>Hours</th>
                  <th>Notes</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${studyLogs.map(l => `
                  <tr>
                    <td style="white-space: nowrap; font-weight: 600;">${UI.esc(l.log_date)}</td>
                    <td style="font-weight: 700; color: var(--text-primary);">${UI.esc(l.course_name)}</td>
                    <td>
                      <span class="priority-badge ${l.activity_type === 'theory' ? 'priority-medium' : (l.activity_type === 'exam' ? 'priority-high' : 'priority-low')}" style="text-transform: capitalize; font-size: 0.7rem;">
                        ${UI.esc(l.activity_type || 'practice')}
                      </span>
                    </td>
                    <td style="font-weight: 700; color: #10B981;">${UI.esc(String(l.hours))} hrs</td>
                    <td class="text-muted">${UI.esc(l.notes || '-')}</td>
                    <td style="text-align: right;">
                      <button class="btn-icon text-muted" onclick="Curriculum.deleteStudyLog(${l.id})" title="Delete entry" style="padding: 2px;">
                        <svg class="icon-svg" viewBox="0 0 24 24" style="width: 0.9em; height: 0.9em;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      }

    } catch (e) {
      console.error("Error loading performance dashboard metrics:", e);
    }
  },

  openAddCourseModal() {
    const formHtml = `
      <form id="perf-add-course-form">
        <div class="form-group">
          <label for="perf-course-code">Course Code</label>
          <input type="text" id="perf-course-code" required placeholder="e.g. CS101, WEB-DEV">
        </div>
        <div class="form-group">
          <label for="perf-course-name">Course / Subject Name</label>
          <input type="text" id="perf-course-name" required placeholder="e.g. Frontend Web Architecture & UI">
        </div>
        <div style="display: flex; gap: 1rem;">
          <div class="form-group" style="flex: 1;">
            <label for="perf-course-credits">Credits (SKS)</label>
            <input type="number" id="perf-course-credits" min="1" max="10" value="3" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="perf-course-progress">Completion Progress (%)</label>
            <input type="number" id="perf-course-progress" min="0" max="100" value="50" required>
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">Save Course</button>
      </form>
    `;

    UI.openModal('Add Course / Subject', formHtml);

    document.getElementById('perf-add-course-form').onsubmit = async (e) => {
      e.preventDefault();
      const code = document.getElementById('perf-course-code').value.trim();
      const name = document.getElementById('perf-course-name').value.trim();
      const credits = parseInt(document.getElementById('perf-course-credits').value, 10);
      const progress = parseInt(document.getElementById('perf-course-progress').value, 10);

      try {
        const res = await API.post('/api/courses', { code, name, credits, progress });
        if (res.error) {
          UI.toast(res.error, 'danger');
        } else {
          UI.closeModal();
          UI.toast('Course added successfully!', 'success');
          this.loadPerformanceData();
          this.loadAcademicData();
        }
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  },

  openEditProgressModal(courseId, currentProgress, courseName) {
    const formHtml = `
      <form id="perf-edit-progress-form">
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
          Update completion progress for: <strong style="color: var(--text-primary);">${UI.esc(courseName)}</strong>
        </p>
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label for="perf-edit-slider" style="margin: 0;">Progress Percentage</label>
            <span id="perf-slider-val" style="font-weight: 800; font-size: 1.1rem; color: var(--primary);">${currentProgress}%</span>
          </div>
          <input type="range" id="perf-edit-slider" min="0" max="100" step="1" value="${currentProgress}" style="width: 100%;" oninput="document.getElementById('perf-slider-val').textContent = this.value + '%'">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Update Progress</button>
      </form>
    `;

    UI.openModal('Update Course Progress', formHtml);

    document.getElementById('perf-edit-progress-form').onsubmit = async (e) => {
      e.preventDefault();
      const progress = parseInt(document.getElementById('perf-edit-slider').value, 10);

      try {
        const res = await API.patch(`/api/courses/${courseId}`, { progress });
        if (res.error) {
          UI.toast(res.error, 'danger');
        } else {
          UI.closeModal();
          UI.toast('Course progress updated!', 'success');
          this.loadPerformanceData();
          this.loadAcademicData();
        }
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  },

  async deleteCourseFromPerf(courseId) {
    if (!confirm('Remove this course from your curriculum?')) return;
    try {
      await API.delete(`/api/courses/${courseId}`);
      UI.toast('Course removed.', 'info');
      this.loadPerformanceData();
      this.loadAcademicData();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  /** Opens the study-log form. prefill may carry { hours, notes } so other
      modules (e.g. the Focus Timer) can log completed sessions in one tap. */
  openLogStudyModal(prefill = {}) {
    const todayISO = UI.getTodayStr();
    const preHours = prefill.hours != null ? prefill.hours : 2.0;
    const preNotes = prefill.notes ? UI.esc(prefill.notes) : '';
    const formHtml = `
      <form id="perf-log-study-form">
        <div class="form-group">
          <label for="perf-log-course">Course / Subject Name</label>
          <input type="text" id="perf-log-course" required placeholder="e.g. Relational Database SQL, Data Structures Practice">
        </div>
        <div style="display: flex; gap: 1rem;">
          <div class="form-group" style="flex: 1;">
            <label for="perf-log-hours">Study Duration (Hours)</label>
            <input type="number" id="perf-log-hours" step="any" min="0.1" max="24" value="${preHours}" required>
          </div>
          <div class="form-group" style="flex: 1;">
            <label for="perf-log-type">Activity Category</label>
            <select id="perf-log-type">
              <option value="practice" selected>Practice / Coding</option>
              <option value="theory">Theory / Reading</option>
              <option value="exam">Exam Preparation</option>
              <option value="lecture">Lecture / Class</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="perf-log-date">Date</label>
          <input type="date" id="perf-log-date" value="${todayISO}" required>
        </div>
        <div class="form-group">
          <label for="perf-log-notes">Session Notes (Optional)</label>
          <input type="text" id="perf-log-notes" value="${preNotes}" placeholder="e.g. Built normalization schema, completed 3 DSA challenges">
        </div>
        <button type="submit" class="btn btn-primary btn-block">Add Study Session</button>
      </form>
    `;

    UI.openModal('Study Hours & Productivity', formHtml);

    document.getElementById('perf-log-study-form').onsubmit = async (e) => {
      e.preventDefault();
      const course_name = document.getElementById('perf-log-course').value.trim();
      const hours = parseFloat(document.getElementById('perf-log-hours').value);
      const activity_type = document.getElementById('perf-log-type').value;
      const log_date = document.getElementById('perf-log-date').value;
      const notes = document.getElementById('perf-log-notes').value.trim();

      try {
        const res = await API.post('/api/study-logs', { course_name, hours, activity_type, log_date, notes });
        if (res.error) {
          UI.toast(res.error, 'danger');
        } else {
          UI.closeModal();
          UI.toast('Study session added!', 'success');
          this.loadPerformanceData();
        }
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    };
  },

  async deleteStudyLog(logId) {
    if (!confirm('Delete this study session?')) return;
    try {
      await API.delete(`/api/study-logs/${logId}`);
      UI.toast('Study session deleted.', 'info');
      this.loadPerformanceData();
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  // =========================================================================
  // 7. GPA / GRADE CALCULATOR & TARGET SIMULATOR
  // =========================================================================
  gpaCourses: [
    { name: 'Pemrograman Dasar', credits: 3, grade: 'A' },
    { name: 'Basis Data Relasional', credits: 3, grade: 'A-' },
    { name: 'Struktur Data & Algoritma', credits: 4, grade: 'B+' },
    { name: 'Matematika Diskrit', credits: 3, grade: 'B' },
  ],

  GRADE_SCALE: {
    'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0, 'F': 0.0
  },

  calculateGPA() {
    let totalPoints = 0;
    let totalCredits = 0;

    this.gpaCourses.forEach(c => {
      const credits = Number(c.credits) || 0;
      const point = this.GRADE_SCALE[c.grade] ?? 0;
      totalPoints += credits * point;
      totalCredits += credits;
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0.0;
    return { gpa: gpa.toFixed(2), totalCredits, totalPoints: totalPoints.toFixed(1) };
  },

  async loadCoursesIntoGPA() {
    try {
      const courses = await API.get('/api/courses');
      if (courses && courses.length > 0) {
        this.gpaCourses = courses.map(c => ({
          name: c.name || c.code,
          credits: c.credits || 3,
          grade: 'A'
        }));
        this.renderGPACalculator();
        UI.toast('Imported enrolled academic courses into GPA calculator.', 'success');
      } else {
        UI.toast('No courses found in database. You can add courses directly below.', 'info');
      }
    } catch (e) {
      UI.toast('Failed to load courses for GPA calculator.', 'danger');
    }
  },

  addGPACourseRow(name = '', credits = 3, grade = 'A') {
    this.gpaCourses.push({ name, credits, grade });
    this.renderGPACalculator();
  },

  removeGPACourseRow(index) {
    if (this.gpaCourses.length <= 1) {
      UI.toast('At least one course is required in calculator.', 'warning');
      return;
    }
    this.gpaCourses.splice(index, 1);
    this.renderGPACalculator();
  },

  updateGPACourse(index, field, value) {
    if (this.gpaCourses[index]) {
      this.gpaCourses[index][field] = value;
      this.renderGPASummary();
    }
  },

  calculateTargetGPA() {
    const currentGPA = parseFloat(document.getElementById('target-curr-gpa')?.value) || 0;
    const currentCredits = parseFloat(document.getElementById('target-curr-credits')?.value) || 0;
    const targetGPA = parseFloat(document.getElementById('target-goal-gpa')?.value) || 0;
    const futureCredits = parseFloat(document.getElementById('target-future-credits')?.value) || 0;
    const resultEl = document.getElementById('target-gpa-result');

    if (!resultEl) return;

    if (futureCredits <= 0 || targetGPA <= 0) {
      resultEl.innerHTML = '<p class="text-muted" style="margin: 0.5rem 0;">Please enter your target GPA and remaining future credits.</p>';
      return;
    }

    const currentPoints = currentGPA * currentCredits;
    const totalCredits = currentCredits + futureCredits;
    const requiredTotalPoints = targetGPA * totalCredits;
    const neededPoints = requiredTotalPoints - currentPoints;
    const requiredFutureGPA = neededPoints / futureCredits;

    if (requiredFutureGPA > 4.0) {
      resultEl.innerHTML = `
        <div style="padding: 0.85rem 1rem; border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--accent-danger); font-size: 0.88rem;">
          <strong>Target Out of Range:</strong> Requires a <strong>${requiredFutureGPA.toFixed(2)}</strong> GPA on remaining ${futureCredits} credits (maximum possible is 4.00). Try taking more credit hours or adjusting your goal.
        </div>
      `;
    } else if (requiredFutureGPA <= 0) {
      resultEl.innerHTML = `
        <div style="padding: 0.85rem 1rem; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #10B981; font-size: 0.88rem;">
          <strong>Target Already Secured!</strong> Maintaining any passing grade will keep you above your goal.
        </div>
      `;
    } else {
      resultEl.innerHTML = `
        <div style="padding: 0.85rem 1rem; border-radius: var(--radius-md); background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.25); color: var(--primary); font-size: 0.88rem;">
          <strong>Target Plan:</strong> You need an average GPA of <strong>${requiredFutureGPA.toFixed(2)}</strong> across your next <strong>${futureCredits} SKS credits</strong> to graduate with a <strong>${targetGPA.toFixed(2)}</strong> cumulative GPA!
        </div>
      `;
    }
  },

  renderGPACalculator() {
    const tableBody = document.getElementById('gpa-courses-tbody');
    if (!tableBody) return;

    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E', 'F'];

    tableBody.innerHTML = this.gpaCourses.map((c, i) => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.5rem 0.5rem 0.5rem 0;">
          <input type="text" value="${UI.esc(c.name)}" placeholder="e.g. Algoritma"
                 oninput="Curriculum.updateGPACourse(${i}, 'name', this.value)"
                 style="width: 100%; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-surface);">
        </td>
        <td style="width: 80px; padding: 0.5rem;">
          <input type="number" value="${c.credits}" min="1" max="10"
                 oninput="Curriculum.updateGPACourse(${i}, 'credits', parseInt(this.value) || 0)"
                 style="width: 100%; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-surface); text-align: center;">
        </td>
        <td style="width: 120px; padding: 0.5rem;">
          <select onchange="Curriculum.updateGPACourse(${i}, 'grade', this.value)"
                  style="width: 100%; padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-surface); font-weight: 600;">
            ${grades.map(g => `<option value="${g}" ${g === c.grade ? 'selected' : ''}>${g} (${this.GRADE_SCALE[g].toFixed(1)})</option>`).join('')}
          </select>
        </td>
        <td style="width: 40px; text-align: center; padding: 0.5rem 0 0.5rem 0.5rem;">
          <button class="btn-icon text-muted" onclick="Curriculum.removeGPACourseRow(${i})" title="Remove course"
                  style="font-size: 1.1rem; line-height: 1;">&times;</button>
        </td>
      </tr>
    `).join('');

    this.renderGPASummary();
  },

  renderGPASummary() {
    const { gpa, totalCredits, totalPoints } = this.calculateGPA();
    const gpaValEl = document.getElementById('gpa-score-display');
    const gpaCreditsEl = document.getElementById('gpa-total-credits-display');
    const gpaPointsEl = document.getElementById('gpa-total-points-display');
    const gpaBadgeEl = document.getElementById('gpa-standing-badge');

    if (gpaValEl) gpaValEl.textContent = gpa;
    if (gpaCreditsEl) gpaCreditsEl.textContent = `${totalCredits} SKS`;
    if (gpaPointsEl) gpaPointsEl.textContent = `${totalPoints} Pts`;

    if (gpaBadgeEl) {
      const numGpa = parseFloat(gpa);
      if (numGpa >= 3.75) {
        gpaBadgeEl.textContent = 'Summa Cum Laude (High Distinction)';
        gpaBadgeEl.style.color = '#10B981';
      } else if (numGpa >= 3.5) {
        gpaBadgeEl.textContent = 'Magna Cum Laude (Distinction)';
        gpaBadgeEl.style.color = 'var(--primary)';
      } else if (numGpa >= 3.0) {
        gpaBadgeEl.textContent = 'Good Academic Standing';
        gpaBadgeEl.style.color = '#F59E0B';
      } else {
        gpaBadgeEl.textContent = 'Academic Advisory Zone';
        gpaBadgeEl.style.color = 'var(--accent-danger)';
      }
    }
  },

  // ── 8. CSS FLEXBOX & GRID VISUALIZER ─────────────────────────────────────
  _flexBoxCount: 4,

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

  // ── 9. JS FUNCTIONAL & ARRAY METHODS LAB ──────────────────────────────────
  _currentJSMethod: 'map',

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

      // Safely evaluate functional expression
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
            <span class="font-bold text-success text-sm d-flex items-center gap-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Operation Successful
            </span>
            <span class="priority-badge priority-low font-mono text-xs">.${this._currentJSMethod}()</span>
          </div>
          <p class="text-muted text-xs m-0">${UI.esc(explanation)}</p>
          <div class="p-md rounded" style="background: var(--bg-surface-alt); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
            <div class="text-xs font-bold text-muted mb-xs">OUTPUT RESULT:</div>
            <pre class="font-mono text-sm font-bold text-brand m-0">${UI.esc(JSON.stringify(result, null, 2))}</pre>
          </div>
        </div>
      `;
    } catch (err) {
      resultView.innerHTML = `
        <div class="p-md rounded" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-md);">
          <span class="font-bold text-danger text-sm">Execution Error</span>
          <p class="font-mono text-xs text-secondary mt-xs m-0">${UI.esc(err.message)}</p>
        </div>
      `;
    }
  },

  // ── 10. REGEX PATTERN VALIDATOR LAB ───────────────────────────────────────
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

      // Highlight in text
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

      // Render matched details
      if (matchesList) {
        matchesList.innerHTML = `
          <div class="d-flex flex-col gap-xs">
            <span class="text-xs font-bold text-muted">CAPTURED MATCHES:</span>
            <div class="d-flex gap-xs flex-wrap">
              ${matches.map((m, idx) => `<span class="priority-badge" style="background: var(--bg-surface-alt); border: 1px solid var(--border-color); font-family: var(--font-mono); font-size: 0.75rem;">#${idx + 1}: ${UI.esc(m[0])}</span>`).join('')}
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

document.addEventListener('DOMContentLoaded', () => {
  if (window.Curriculum) {
    Curriculum.init();
  }
});

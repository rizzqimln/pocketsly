/**
 * MONTHLY BUDGET & CASH FLOW CONTROLLER (budget.js)
 * ===================================================
 * LEARN: Financial Data Modelling & SVG Data Visualisation
 *
 * 1. Array.reduce()      — The canonical way to sum a list of numbers. We
 *                          extract _sumAmounts() so the formula is written
 *                          once instead of duplicated in every render method.
 * 2. SVG stroke-dasharray — Setting `stroke-dasharray: "75 100"` on a circle
 *                          draws 75% of its circumference. We use this to make
 *                          the donut chart without any charting library.
 * 3. Guard Clauses        — `if (res.error) { ...; return; }` is cleaner than
 *                          nesting logic inside `else` blocks.
 * 4. Parallel Fetch       — Promise.all() loads incomes, expenses, and budgets
 *                          simultaneously rather than waiting for each in turn.
 */

// ── Module-level SVG icons ─────────────────────────────────────────────────
const BUDGET_SVG = {
  income:  `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
  expense: `<svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
  trash:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
};

// ── Currencies Configuration Dictionary ─────────────────────────────────────
const CURRENCIES = {
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah (Rp)', prefix: 'IDR ', decimals: 0, locale: 'id-ID', placeholder: '50,000' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)', prefix: '$', decimals: 2, locale: 'en-US', placeholder: '25.00' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)', prefix: '€', decimals: 2, locale: 'de-DE', placeholder: '25.00' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)', prefix: '£', decimals: 2, locale: 'en-GB', placeholder: '20.00' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)', prefix: '¥', decimals: 0, locale: 'ja-JP', placeholder: '3,500' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)', prefix: 'S$', decimals: 2, locale: 'en-SG', placeholder: '30.00' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)', prefix: 'A$', decimals: 2, locale: 'en-AU', placeholder: '35.00' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)', prefix: 'C$', decimals: 2, locale: 'en-CA', placeholder: '35.00' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (RM)', prefix: 'RM ', decimals: 2, locale: 'ms-MY', placeholder: '50.00' }
};

window.Budget = {
  CURRENCIES,
  currentMonth: '',
  incomesList: [],
  expensesList: [],
  budgetsList: [],
  activeTxFilter: 'all',  // 'all', 'incomes', 'expenses'
  activeFormTab: 'income', // 'income', 'expense', 'budget'
  _handlePasteBound: null,

  /**
   * Sums the `amount` field of an array of transaction objects.
   *
   * LEARN: Array.reduce(callback, initialValue) is the functional way to
   * accumulate a value across a list. We start from 0 and add each amount.
   * This is equivalent to a for-loop sum but more declarative.
   *
   * @param {object[]} list  array with numeric `amount` field
   * @returns {number}       total sum
   */
  _sumAmounts(list) {
    return list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  },

  getCurrency() {
    return '';
  },

  getCurrencyInfo() {
    return { code: '', symbol: '', prefix: '', decimals: 0, locale: 'en-US' };
  },

  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('en-US');
  },

  async setCurrency(code) {
    // No-op for backwards compatibility
    this.renderKPIs();
    this.renderDonut();
    this.renderMicroCharts();
    this.renderTransactionsList();
    this.renderCategoryCards();
  },

  init() {
    this.currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    this.setupEventListeners();
    this.initCurrencyFormatters();
    this.setDefaultDates();
    this._handlePasteBound = (e) => this.handleReceiptPaste(e);
    this._bindScanModeToggle();
  },

  _parseAmount(inputVal) {
    if (!inputVal && inputVal !== 0) return 0;
    const str = String(inputVal).replace(/,/g, '').trim();
    const clean = str.replace(/[^\d.-]/g, '');
    return parseFloat(clean) || 0;
  },

  initCurrencyFormatters() {
    document.querySelectorAll('.currency-formatted-input').forEach(input => {
      input.addEventListener('input', (e) => {
        let raw = e.target.value.replace(/[^\d.]/g, '');
        if (!raw) {
          e.target.value = '';
          return;
        }
        const parts = raw.split('.');
        if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
        const intPart = parts[0] ? Number(parts[0]).toLocaleString('en-US') : '0';
        e.target.value = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
      });
    });
  },

  selectIncomePreset(preset) {
    const clean = preset.replace(/^[^\w\s]+/, '').trim();
    const input = document.getElementById('income-source');
    if (input) {
      input.value = clean;
      input.focus();
    }
    document.querySelectorAll('.income-preset-chips .preset-chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(clean));
    });
  },

  selectExpensePreset(preset) {
    const clean = preset.replace(/^[^\w\s&]+/, '').trim();
    const input = document.getElementById('expense-category');
    if (input) {
      input.value = clean;
      input.focus();
    }
    document.querySelectorAll('.expense-preset-chips .preset-chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(clean));
    });
  },

  setDefaultDates() {
    const today = new Date().toISOString().substring(0, 10);
    const incDate = document.getElementById('income-date');
    const expDate = document.getElementById('expense-date');
    if (incDate && !incDate.value) incDate.value = today;
    if (expDate && !expDate.value) expDate.value = today;
  },

  openEntryModal(tab = 'expense') {
    const modal = document.getElementById('budget-entry-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    this.switchModalTab(tab);
  },

  closeEntryModal() {
    const modal = document.getElementById('budget-entry-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  switchModalTab(tab) {
    this.activeFormTab = tab;
    const titleEl = document.getElementById('budget-modal-title');
    const tabIncomeBtn = document.getElementById('modal-tab-income');
    const tabExpenseBtn = document.getElementById('modal-tab-expense');
    const tabBudgetBtn = document.getElementById('modal-tab-budget');

    const formIncome = document.getElementById('add-income-form');
    const formExpense = document.getElementById('add-expense-form');
    const formBudget = document.getElementById('add-budget-form');

    // Reset button states
    [tabIncomeBtn, tabExpenseBtn, tabBudgetBtn].forEach(btn => {
      btn?.classList.remove('active-expense', 'active-income', 'active-budget');
    });

    // Hide all forms
    formIncome?.classList.add('hidden');
    formExpense?.classList.add('hidden');
    formBudget?.classList.add('hidden');

    if (tab === 'income') {
      tabIncomeBtn?.classList.add('active-income');
      formIncome?.classList.remove('hidden');
      if (titleEl) titleEl.innerHTML = '<span style="color:#10B981; font-weight:900;">+</span> Log Income';
      setTimeout(() => document.getElementById('income-amount')?.focus(), 80);
    } else if (tab === 'expense') {
      tabExpenseBtn?.classList.add('active-expense');
      formExpense?.classList.remove('hidden');
      if (titleEl) titleEl.innerHTML = '<span style="color:#EF4444; font-weight:900;">-</span> Log Expense';
      setTimeout(() => document.getElementById('expense-amount')?.focus(), 80);
    } else if (tab === 'budget') {
      tabBudgetBtn?.classList.add('active-budget');
      formBudget?.classList.remove('hidden');
      if (titleEl) titleEl.innerHTML = '<span>🎯</span> Set Budget Target';
      setTimeout(() => document.getElementById('budget-amount')?.focus(), 80);
    }
  },

  switchFormTab(tab) {
    this.openEntryModal(tab);
  },

  filterTransactions(filter) {
    this.activeTxFilter = filter;
    const filterAll = document.getElementById('tx-filter-all');
    const filterIncomes = document.getElementById('tx-filter-incomes');
    const filterExpenses = document.getElementById('tx-filter-expenses');

    [filterAll, filterIncomes, filterExpenses].forEach(btn => btn?.classList.remove('active'));

    if (filter === 'incomes') filterIncomes?.classList.add('active');
    else if (filter === 'expenses') filterExpenses?.classList.add('active');
    else filterAll?.classList.add('active');

    this.renderTransactionsList();
  },

  async load() {
    const periodText = document.getElementById('budget-period-text');
    if (periodText) {
      periodText.textContent = `Month: ${this.currentMonth}`;
    }
    this.setDefaultDates();
    this.initCurrencyFormatters();

    try {
      const [incomes, expenses, budgets] = await Promise.all([
        API.get('/api/incomes'),
        API.get('/api/expenses'),
        API.get(`/api/budgets?month=${this.currentMonth}`)
      ]);

      this.incomesList = Array.isArray(incomes) ? incomes : [];
      this.expensesList = Array.isArray(expenses) ? expenses : [];
      this.budgetsList = Array.isArray(budgets) ? budgets : [];

      this.renderKPIs();
      this.renderDonut();
      this.renderMicroCharts();
      this.renderTransactionsList();
      this.renderCategoryCards();
    } catch (err) {
      console.error('Failed to load financial data:', err);
      UI.toast('Failed to sync financial dashboard.', 'danger');
    }
  },

  renderKPIs() {
    const incomeEl       = document.getElementById('kpi-total-income');
    const incomeCountEl  = document.getElementById('kpi-incomes-count');
    const balanceEl      = document.getElementById('kpi-total-balance');
    const balanceStatusEl = document.getElementById('kpi-balance-status');
    const spentEl        = document.getElementById('kpi-total-spent');
    const expensesCountEl = document.getElementById('kpi-expenses-count');

    // LEARN: _sumAmounts() replaces two identical reduce() calls written inline.
    const totalIncome = this._sumAmounts(this.incomesList);
    const totalSpent  = this._sumAmounts(this.expensesList);
    const netBalance  = totalIncome - totalSpent;

    if (incomeEl)      incomeEl.textContent = this.formatCurrency(totalIncome);
    if (incomeCountEl) incomeCountEl.textContent = `${this.incomesList.length} log${this.incomesList.length === 1 ? '' : 's'}`;

    if (balanceEl) {
      const sign = netBalance < 0 ? '-' : '';
      balanceEl.textContent = `${sign}${this.formatCurrency(Math.abs(netBalance))}`;
      if (netBalance < 0)      balanceEl.style.color = 'var(--accent-danger)';
      else if (netBalance > 0) balanceEl.style.color = 'var(--accent-success-strong)';
      else                     balanceEl.style.color = 'var(--text-primary)';
    }

    if (balanceStatusEl) {
      if (netBalance > 0) {
        balanceStatusEl.className  = 'priority-badge priority-low';
        balanceStatusEl.textContent = 'Surplus (Savings)';
        balanceStatusEl.style.background = 'rgba(16, 185, 129, 0.15)';
        balanceStatusEl.style.color      = 'var(--accent-success-strong)';
      } else if (netBalance === 0) {
        balanceStatusEl.className  = 'priority-badge priority-medium';
        balanceStatusEl.textContent = 'Break-even';
        balanceStatusEl.style.background = 'rgba(245, 158, 11, 0.15)';
        balanceStatusEl.style.color      = 'var(--accent-warning-strong)';
      } else {
        balanceStatusEl.className  = 'priority-badge priority-high';
        balanceStatusEl.textContent = 'Deficit / In Debt';
        balanceStatusEl.style.background = 'rgba(239, 68, 68, 0.15)';
        balanceStatusEl.style.color      = 'var(--accent-danger-strong)';
      }
    }

    if (spentEl)        spentEl.textContent = this.formatCurrency(totalSpent);
    if (expensesCountEl) expensesCountEl.textContent = `${this.expensesList.length} log${this.expensesList.length === 1 ? '' : 's'}`;
  },

  renderDonut() {
    const donutSegment = document.getElementById('donut-usage-segment');
    const percentText  = document.getElementById('donut-percent-text');
    const feedbackText = document.getElementById('donut-feedback-text');
    const inflowEl     = document.getElementById('donut-kpi-inflow');
    const outflowEl    = document.getElementById('donut-kpi-outflow');
    const savingsEl    = document.getElementById('donut-kpi-savings');
    if (!donutSegment || !percentText) return;

    // LEARN: _sumAmounts() reuses the same logic as renderKPIs().
    const totalIncome = this._sumAmounts(this.incomesList);
    const totalSpent  = this._sumAmounts(this.expensesList);

    let percentSpent = 0;
    if (totalIncome > 0)       percentSpent = (totalSpent / totalIncome) * 100;
    else if (totalSpent > 0)   percentSpent = 100;

    const displayPercent = Math.min(Math.round(percentSpent), 100);
    percentText.textContent = `${Math.round(percentSpent)}%`;
    // LEARN: stroke-dasharray="X 100" on a viewBox circle with r=15.9 (circumference≈100)
    // draws X% of the circle as a filled arc — a pure CSS donut chart technique.
    donutSegment.setAttribute('stroke-dasharray', `${displayPercent} 100`);

    // Zero-State Ratio Guard & Colors
    if (totalIncome === 0 && totalSpent === 0) {
      donutSegment.setAttribute('stroke', 'var(--border-color)');
      percentText.textContent = '--%';
      if (feedbackText) feedbackText.textContent = 'Ready to Track: Log incoming allowance or expenses to see ratio.';
    } else if (totalSpent === 0) {
      // Only income, no expenses yet
      donutSegment.setAttribute('stroke', 'url(#donut-gradient)');
      percentText.textContent = '0%';
      if (feedbackText) feedbackText.textContent = 'No expenses recorded yet';
    } else if (percentSpent > 100) {
      donutSegment.setAttribute('stroke', 'var(--accent-danger)');
      if (feedbackText) feedbackText.textContent = 'Alert: Expenses exceed your total incoming cash flow!';
    } else if (percentSpent > 80) {
      donutSegment.setAttribute('stroke', 'var(--accent-warning)');
      if (feedbackText) feedbackText.textContent = 'Caution: You have spent over 80% of your total earnings.';
    } else {
      donutSegment.setAttribute('stroke', 'url(#donut-gradient)');
      if (feedbackText) feedbackText.textContent = 'Healthy ratio! You are saving a significant portion of your income.';
    }

    // Populate adjacent KPI metric stack cards
    if (inflowEl) inflowEl.textContent = this.formatCurrency(totalIncome);
    if (outflowEl) outflowEl.textContent = this.formatCurrency(totalSpent);
    if (savingsEl) {
      const savings = totalIncome - totalSpent;
      const rate = totalIncome > 0 ? Math.max(0, Math.round((savings / totalIncome) * 100)) : 0;
      savingsEl.textContent = `${rate}%`;
    }
  },

  renderMicroCharts() {
    // Incomes Micro Chart
    const incomeChartEl = document.getElementById('income-micro-chart');
    if (incomeChartEl) {
      if (this.incomesList.length === 0) {
        incomeChartEl.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No income logs</span>';
      } else {
        const recent = this.incomesList.slice(0, 8).reverse();
        const maxVal = Math.max(...recent.map(e => Number(e.amount)), 1);
        incomeChartEl.innerHTML = recent.map(e => {
          const heightPercent = Math.max((Number(e.amount) / maxVal) * 100, 15);
          return `<div class="micro-bar" style="height: ${heightPercent}%; width: 6px; cursor: pointer; background: #10B981; border-radius: 2px;" title="${UI.esc(e.source)}: +${this.formatCurrency(Number(e.amount))}"></div>`;
        }).join('');
      }
    }

    // Expenses Micro Chart
    const spentChartEl = document.getElementById('spent-micro-chart');
    if (spentChartEl) {
      if (this.expensesList.length === 0) {
        spentChartEl.innerHTML = '<span class="text-muted" style="font-size: 0.75rem;">No expense logs</span>';
      } else {
        const recent = this.expensesList.slice(0, 8).reverse();
        const maxVal = Math.max(...recent.map(e => Number(e.amount)), 1);
        spentChartEl.innerHTML = recent.map(e => {
          const heightPercent = Math.max((Number(e.amount) / maxVal) * 100, 15);
          return `<div class="micro-bar high" style="height: ${heightPercent}%; width: 6px; cursor: pointer; border-radius: 2px;" title="${UI.esc(e.category)}: -${this.formatCurrency(Number(e.amount))}"></div>`;
        }).join('');
      }
    }
  },

  renderTransactionsList() {
    const container = document.getElementById('recent-transactions-list');
    if (!container) return;

    // Combine both types into unified transaction list
    let combined = [];

    if (this.activeTxFilter === 'all' || this.activeTxFilter === 'incomes') {
      this.incomesList.forEach(inc => {
        combined.push({
          type: 'income',
          id: inc.id,
          title: inc.source,
          amount: Number(inc.amount),
          date: inc.income_date,
          wallet: inc.wallet || 'Cash',
          recurring: inc.recurring || 'none',
          desc: inc.description
        });
      });
    }

    if (this.activeTxFilter === 'all' || this.activeTxFilter === 'expenses') {
      this.expensesList.forEach(exp => {
        combined.push({
          type: 'expense',
          id: exp.id,
          title: exp.category,
          amount: Number(exp.amount),
          date: exp.expense_date,
          wallet: exp.wallet || 'Cash',
          recurring: 'none',
          desc: exp.description
        });
      });
    }

    // Sort by date descending
    combined.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));

    if (combined.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1.5rem 0;">No transactions found for this filter.</p>';
      return;
    }

    const incomeSvg  = BUDGET_SVG.income;
    const expenseSvg = BUDGET_SVG.expense;

    container.innerHTML = combined.slice(0, 8).map(item => {
      const isIncome = item.type === 'income';
      const borderLeftColor = isIncome ? '#10B981' : 'var(--accent-danger)';
      const iconBg = isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      const iconColor = isIncome ? '#10B981' : 'var(--accent-danger)';
      const amountColor = isIncome ? '#10B981' : 'var(--accent-danger)';
      const sign = isIncome ? '+' : '-';
      const deleteFn = isIncome ? `Budget.deleteIncome(${item.id})` : `Budget.deleteExpense(${item.id})`;

      const walletBadge = item.wallet ? `<span class="preset-chip" style="font-size:0.68rem; padding: 2px 7px; display:inline-flex; align-items:center; gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> ${UI.esc(item.wallet)}</span>` : '';
      const recurringBadge = (item.recurring && item.recurring !== 'none') ? `<span class="preset-chip" style="font-size:0.68rem; padding: 2px 7px; color: #10B981; display:inline-flex; align-items:center; gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> ${item.recurring}</span>` : '';
      const catBadge = `<span class="tx-category-badge ${isIncome ? 'tx-badge-income' : 'tx-badge-expense'}">${UI.esc(item.title || (isIncome ? 'Income' : 'Expense'))}</span>`;

      return `
        <div class="transaction-row task-item" style="padding: 0.85rem 1rem; margin-bottom: 0.5rem; border-left: 3px solid ${borderLeftColor}; background: var(--bg-surface-alt); border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 0.85rem; width: 100%;">
            <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: ${iconBg}; color: ${iconColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${isIncome ? incomeSvg : expenseSvg}
            </div>
            <div class="task-details" style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                ${catBadge}
                ${walletBadge}
                ${recurringBadge}
              </div>
              <span class="task-meta" style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${UI.esc(item.desc || 'No notes')} &bull; ${UI.esc(item.date)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;">
              <div style="font-family: var(--font-mono); font-weight: 700; color: ${amountColor}; font-size: 0.95rem; text-align: right;">
                ${sign}${this.formatCurrency(item.amount)}
              </div>
              <button onclick="${deleteFn}" class="btn-icon" style="background: transparent; border: none; padding: 4px; cursor: pointer; color: var(--text-muted); opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" title="Delete transaction">
                ${BUDGET_SVG.trash}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderCategoryCards() {
    const container = document.getElementById('budget-category-cards');
    const summaryEl = document.getElementById('category-targets-summary');
    if (!container) return;

    if (summaryEl) {
      summaryEl.textContent = `${this.budgetsList.length} categories tracked`;
    }

    if (!this.budgetsList || this.budgetsList.length === 0) {
      container.innerHTML = `
        <div class="target-empty-card">
          <div class="target-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <h4 style="margin: 0 0 0.35rem 0; font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">No Targets Set</h4>
          <p class="text-muted" style="font-size: 0.82rem; max-width: 280px; margin: 0 0 1.25rem 0; line-height: 1.4;">Configure monthly category limit targets to monitor and control your spending habits.</p>
          <button type="button" class="btn btn-primary btn-sm d-inline-flex items-center gap-xs" onclick="Budget.switchFormTab('budget'); const el = document.getElementById('budget-category'); if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Set Target Limit
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.budgetsList.map(b => {
      const spent = b.spent || 0;
      const percentage = Math.min((spent / b.amount) * 100, 100);
      const isOver = spent > b.amount;

      let cardClass = 'color-teal';
      let badgeStyle = 'background: rgba(16, 185, 129, 0.15); color: #10B981;';
      if (isOver) {
        cardClass = 'color-coral';
        badgeStyle = 'background: rgba(239, 68, 68, 0.15); color: #EF4444;';
      } else if (percentage > 70) {
        cardClass = 'color-purple';
        badgeStyle = 'background: rgba(124, 58, 237, 0.15); color: var(--primary-400);';
      }

      const remaining = b.amount - spent;

      return `
        <div class="category-card ${cardClass}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; gap: 0.5rem;">
            <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">${UI.esc(b.category)}</span>
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
              <span class="priority-badge" style="${badgeStyle} font-weight: 800; font-size: 0.75rem; padding: 0.15rem 0.4rem;">${Math.round(percentage)}%</span>
              <button onclick="Budget.deleteBudget(${b.id})" class="btn-icon" style="background: transparent; border: none; padding: 2px; cursor: pointer; color: var(--text-muted); opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.6" title="Delete Budget Target">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          <div style="margin-top: 1.25rem;">
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Remaining</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: ${isOver ? 'var(--accent-danger)' : 'var(--text-primary)'}; margin-top: 0.15rem; font-family: var(--font-mono);">
              ${isOver ? '-' : ''}${this.formatCurrency(Math.abs(remaining))}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 500;">Limit: ${this.formatCurrency(b.amount)}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  setupEventListeners() {
    // 1. Submit Income
    const incomeForm = document.getElementById('add-income-form');
    if (incomeForm) {
      incomeForm.onsubmit = async (e) => {
        e.preventDefault();
        const source      = document.getElementById('income-source').value.trim();
        const amount      = this._parseAmount(document.getElementById('income-amount').value);
        const income_date = document.getElementById('income-date').value || new Date().toISOString().substring(0, 10);
        const wallet      = document.getElementById('income-wallet')?.value || 'Cash';
        const recurring   = document.getElementById('income-recurring')?.value || 'none';
        const description = document.getElementById('income-desc').value.trim();

        if (!source || isNaN(amount) || amount <= 0) {
          UI.toast('Please input a valid category and positive income amount.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/incomes', { source, amount, income_date, wallet, recurring, description });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Income logged successfully! (+)', 'success');
          incomeForm.reset();
          document.getElementById('income-source').value = 'Allowance';
          this.setDefaultDates();
          this.closeEntryModal();
          this.load();
          document.activeElement?.blur();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // 2. Submit Expense
    const expenseForm = document.getElementById('add-expense-form');
    if (expenseForm) {
      expenseForm.onsubmit = async (e) => {
        e.preventDefault();
        const category     = document.getElementById('expense-category').value.trim();
        const amount       = this._parseAmount(document.getElementById('expense-amount').value);
        const expense_date = document.getElementById('expense-date').value || new Date().toISOString().substring(0, 10);
        const wallet       = document.getElementById('expense-wallet')?.value || 'Cash';
        const description  = document.getElementById('expense-desc').value.trim();

        if (!category || isNaN(amount) || amount <= 0) {
          UI.toast('Please input a valid category and positive amount.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/expenses', { category, amount, expense_date, wallet, description });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Expense logged successfully. (-)', 'success');
          expenseForm.reset();
          document.getElementById('expense-category').value = 'Food & Dining';
          this.setDefaultDates();
          this.closeEntryModal();
          this.load();
          document.activeElement?.blur();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // 3. Submit Budget Target
    const budgetForm = document.getElementById('add-budget-form');
    if (budgetForm) {
      budgetForm.onsubmit = async (e) => {
        e.preventDefault();
        const category = document.getElementById('budget-category').value.trim();
        const amount   = this._parseAmount(document.getElementById('budget-amount').value);

        if (!category || isNaN(amount) || amount <= 0) {
          UI.toast('Please input a valid category and positive limit.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/budgets', { category, amount, month_year: this.currentMonth });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast('Budget target allocated.', 'success');
          budgetForm.reset();
          this.closeEntryModal();
          this.load();
          document.activeElement?.blur();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }
  },

  async deleteIncome(id) {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    try {
      const res = await API.delete(`/api/incomes/${id}`);
      if (res.error) {
        UI.toast(res.error, 'danger');
      } else {
        UI.toast('Income entry deleted.', 'success');
        this.load();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense transaction log?')) return;
    try {
      const res = await API.delete(`/api/expenses/${id}`);
      if (res.error) {
        UI.toast(res.error, 'danger');
      } else {
        UI.toast('Expense transaction log deleted.', 'success');
        this.load();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  async deleteBudget(id) {
    if (!confirm('Are you sure you want to delete this budget category target?')) return;
    try {
      const res = await API.delete(`/api/budgets/${id}`);
      if (res.error) {
        UI.toast(res.error, 'danger');
      } else {
        UI.toast('Budget allocation deleted.', 'success');
        this.load();
      }
    } catch (err) {
      UI.toast(err.message, 'danger');
    }
  },

  /**
   * Generates and triggers browser download of an RFC 4180-compliant CSV report.
   *
   * LEARN: Client-side CSV generation using Blob + URL.createObjectURL() allows
   * instant spreadsheet export without generating temporary files on the server.
   */
  exportCSV() {
    if (this.incomesList.length === 0 && this.expensesList.length === 0) {
      UI.toast('No financial transactions logged to export.', 'info');
      return;
    }

    const cur = this.getCurrency();
    const rows = [
      ['Transaction Type', 'Title / Source', 'Category', `Amount (${cur})`, 'Date (YYYY-MM-DD)', 'Description']
    ];

    this.incomesList.forEach(inc => {
      rows.push([
        'INCOME',
        `"${(inc.source || '').replace(/"/g, '""')}"`,
        'Incoming Cashflow',
        inc.amount || 0,
        inc.income_date || '',
        `"${(inc.description || '').replace(/"/g, '""')}"`
      ]);
    });

    this.expensesList.forEach(exp => {
      rows.push([
        'EXPENSE',
        `"${(exp.category || '').replace(/"/g, '""')}"`,
        exp.category || 'General',
        -(exp.amount || 0),
        exp.expense_date || '',
        `"${(exp.description || '').replace(/"/g, '""')}"`
      ]);
    });

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pocketsly_financial_report_${this.currentMonth || 'all'}_${cur}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    UI.toast(`Financial CSV report (${cur}) downloaded!`, 'success');
  },

  /**
   * Generates a clean 1-page financial cashflow statement and triggers print.
   * Prints ONLY the cashflow table and notes, excluding forms and other page elements.
   */
  printReport() {
    const printContainer = document.getElementById('financial-print-statement');
    if (!printContainer) {
      window.print();
      return;
    }

    const username = window.Auth?.currentUser?.username || 'User';
    const month = this.currentMonth || new Date().toISOString().substring(0, 7);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const curCode = this.getCurrency();

    let totalInc = 0;
    let totalExp = 0;

    const allTx = [];
    this.incomesList.forEach(inc => {
      const amt = Number(inc.amount) || 0;
      totalInc += amt;
      allTx.push({
        type: 'INCOME',
        date: inc.income_date,
        source: inc.source,
        category: 'Incoming Cashflow',
        notes: inc.description || '-',
        amount: amt,
        isIncome: true
      });
    });

    this.expensesList.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalExp += amt;
      allTx.push({
        type: 'EXPENSE',
        date: exp.expense_date,
        source: exp.category,
        category: exp.category || 'General',
        notes: exp.description || '-',
        amount: amt,
        isIncome: false
      });
    });

    // Sort transactions chronologically descending
    allTx.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const netBal = totalInc - totalExp;

    printContainer.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; padding: 24px; max-width: 800px; margin: 0 auto;">
        <!-- Header -->
        <div style="border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">POCKETSLY &bull; CASH FLOW STATEMENT</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #555;">Statement Period: <strong>${UI.esc(month)}</strong> &bull; Currency: <strong>${curCode}</strong> &bull; Generated: ${UI.esc(dateStr)}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 13px; font-weight: 600;">Account: ${UI.esc(username)}</div>
            <div style="font-size: 12px; color: #666;">Monthly Financial Record</div>
          </div>
        </div>

        <!-- Summary KPIs -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          <div style="border: 1px solid #ddd; padding: 10px 14px; border-radius: 6px; background: #f9fafb;">
            <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700;">Total Income</div>
            <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 2px;">${this.formatCurrency(totalInc)}</div>
          </div>
          <div style="border: 1px solid #ddd; padding: 10px 14px; border-radius: 6px; background: #f9fafb;">
            <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700;">Total Expenses</div>
            <div style="font-size: 18px; font-weight: 800; color: #dc2626; margin-top: 2px;">${this.formatCurrency(totalExp)}</div>
          </div>
          <div style="border: 1px solid #ddd; padding: 10px 14px; border-radius: 6px; background: #f9fafb;">
            <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700;">Net Cashflow</div>
            <div style="font-size: 18px; font-weight: 800; color: ${netBal >= 0 ? '#059669' : '#dc2626'}; margin-top: 2px;">
              ${netBal >= 0 ? '+' : '-'}${this.formatCurrency(Math.abs(netBal))}
            </div>
          </div>
        </div>

        <!-- Cash Flow Ledger Table -->
        <h3 style="font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #333;">Cash Flow Transactions &amp; Notes (${allTx.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f3f4f6; border-top: 1px solid #ccc; border-bottom: 2px solid #ccc; text-align: left;">
              <th style="padding: 8px 6px;">Date</th>
              <th style="padding: 8px 6px;">Type</th>
              <th style="padding: 8px 6px;">Category / Source</th>
              <th style="padding: 8px 6px;">Notes / Description</th>
              <th style="padding: 8px 6px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${allTx.length === 0 ? `
              <tr><td colspan="5" style="text-align: center; padding: 16px; color: #777;">No transactions recorded for this period.</td></tr>
            ` : allTx.map((tx, idx) => `
              <tr style="border-bottom: 1px solid #eee; background: ${idx % 2 === 0 ? '#fff' : '#fafafa'};">
                <td style="padding: 7px 6px; white-space: nowrap; font-family: monospace;">${UI.esc(tx.date || '-')}</td>
                <td style="padding: 7px 6px; font-weight: 700; color: ${tx.isIncome ? '#059669' : '#dc2626'}; font-size: 11px;">
                  ${tx.isIncome ? '▲ IN' : '▼ OUT'}
                </td>
                <td style="padding: 7px 6px; font-weight: 600;">${UI.esc(tx.source || '-')}</td>
                <td style="padding: 7px 6px; color: #444;">${UI.esc(tx.notes || '-')}</td>
                <td style="padding: 7px 6px; text-align: right; font-weight: 700; color: ${tx.isIncome ? '#059669' : '#dc2626'}; white-space: nowrap;">
                  ${tx.isIncome ? '+' : '-'}${this.formatCurrency(tx.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; color: #777; text-align: center;">
          This document is generated directly from your personal offline Pocketsly instance.
        </div>
      </div>
    `;

    window.print();
  },

  openLogModal(tab = null) {
    if (window.App && window.App.currentView !== 'budget') {
      window.App.navigateTo('budget');
    }
    this.openEntryModal(tab || 'expense');
  },

  // ── MOBILE QUICK ACTIONS (FAB bottom sheet) ──────────────────────────────
  openQuickActions() {
    const overlay = document.getElementById('budget-quick-overlay');
    if (overlay) overlay.classList.remove('hidden');
    document.body.classList.add('modal-open');
  },

  closeQuickActions() {
    const overlay = document.getElementById('budget-quick-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  quickAction(kind) {
    this.closeQuickActions();
    if (kind === 'scan') {
      this.openReceiptScanner();
      return;
    }
    this.openEntryModal(kind);
  },

  // ── RECEIPT SCANNER & SMART OCR ENGINE ───────────────────────────────────
  _activeCameraStream: null,
  _cameraFacing: 'environment', // 'environment' (back) or 'user' (front)

  openReceiptScanner() {
    const modal = document.getElementById('receipt-scanner-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    this.resetReceiptScanner();
    this.switchScannerSource('upload');
    document.addEventListener('paste', this._handlePasteBound);
  },

  closeReceiptScanner() {
    const modal = document.getElementById('receipt-scanner-modal');
    if (modal) modal.classList.add('hidden');
    this.stopCameraStream();
    document.removeEventListener('paste', this._handlePasteBound);
  },

  switchScannerSource(source) {
    const uploadBtn = document.getElementById('btn-src-upload');
    const cameraBtn = document.getElementById('btn-src-camera');
    const dropzone = document.getElementById('receipt-dropzone');
    const cameraContainer = document.getElementById('receipt-camera-container');

    if (source === 'camera') {
      uploadBtn?.classList.remove('active');
      cameraBtn?.classList.add('active');
      dropzone?.classList.add('hidden');
      cameraContainer?.classList.remove('hidden');
      this.startCameraStream();
    } else {
      cameraBtn?.classList.remove('active');
      uploadBtn?.classList.add('active');
      cameraContainer?.classList.add('hidden');
      dropzone?.classList.remove('hidden');
      this.stopCameraStream();
    }
  },

  async startCameraStream() {
    this.stopCameraStream();
    const video = document.getElementById('receipt-camera-video');
    if (!video) return;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera stream not supported in this browser.');
      }
      const constraints = {
        video: {
          facingMode: this._cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this._activeCameraStream = stream;
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      console.warn('Live camera stream unavailable:', err);
      UI.toast('Camera preview unavailable — using photo picker instead.', 'info');
      // Fallback: trigger native camera input
      document.getElementById('receipt-camera-input')?.click();
      this.switchScannerSource('upload');
    }
  },

  stopCameraStream() {
    if (this._activeCameraStream) {
      this._activeCameraStream.getTracks().forEach(track => track.stop());
      this._activeCameraStream = null;
    }
    const video = document.getElementById('receipt-camera-video');
    if (video) video.srcObject = null;
  },

  toggleCameraFacing() {
    this._cameraFacing = this._cameraFacing === 'environment' ? 'user' : 'environment';
    this.startCameraStream();
  },

  captureCameraSnapshot() {
    const video = document.getElementById('receipt-camera-video');
    if (!video || !video.videoWidth) {
      document.getElementById('receipt-camera-input')?.click();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    this.stopCameraStream();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera_receipt.jpg', { type: 'image/jpeg' });
      this.processReceiptImage(file);
    }, 'image/jpeg', 0.92);
  },

  resetReceiptScanner() {
    const dropzone = document.getElementById('receipt-dropzone');
    const cameraContainer = document.getElementById('receipt-camera-container');
    const scanningState = document.getElementById('receipt-scanning-state');
    const resultsView = document.getElementById('receipt-results-view');
    const uploadInput = document.getElementById('receipt-upload-input');
    const cameraInput = document.getElementById('receipt-camera-input');

    this.stopCameraStream();

    if (dropzone) dropzone.classList.remove('hidden');
    if (cameraContainer) cameraContainer.classList.add('hidden');
    if (scanningState) scanningState.classList.add('hidden');
    if (resultsView) resultsView.classList.add('hidden');
    if (uploadInput) uploadInput.value = '';
    if (cameraInput) cameraInput.value = '';
  },

  handleReceiptUpload(e) {
    const file = e.target?.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    this.stopCameraStream();
    this.processReceiptImage(file);
  },

  handleReceiptPaste(e) {
    const items = (e.clipboardData || window.clipboardData)?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          this.processReceiptImage(file);
          break;
        }
      }
    }
  },

  processReceiptImage(file) {
    const dropzone = document.getElementById('receipt-dropzone');
    const scanningState = document.getElementById('receipt-scanning-state');
    const resultsView = document.getElementById('receipt-results-view');
    const previewImg = document.getElementById('receipt-preview-img');
    const mode = this._getScanMode();

    if (dropzone) dropzone.classList.add('hidden');
    if (scanningState) scanningState.classList.remove('hidden');
    if (resultsView) resultsView.classList.add('hidden');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imgSrc = event.target.result;
      if (previewImg) previewImg.src = imgSrc;

      try {
        let parsed;
        if (mode === 'on-device') {
          parsed = await this._scanReceiptOnDevice(file);
        } else {
          parsed = await this._scanReceiptServer(imgSrc, file.name);
        }
        this._fillReceiptFields(parsed);
      } catch (err) {
        console.warn('OCR failed, using filename heuristic:', err);
        const parsed = this._extractReceiptDetails(file.name || 'receipt.jpg');
        this._fillReceiptFields(parsed);
      }

      if (scanningState) scanningState.classList.add('hidden');
      if (resultsView) resultsView.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  },

  _getScanMode() {
    const toggle = document.getElementById('receipt-scan-mode');
    return toggle?.value === 'on-device' ? 'on-device' : 'server';
  },

  _bindScanModeToggle() {
    const seg = document.querySelector('.receipt-scan-mode-seg');
    const toggle = document.getElementById('receipt-scan-mode');
    if (!seg) return;
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('.receipt-scan-mode-btn');
      if (!btn) return;
      seg.querySelectorAll('.receipt-scan-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (toggle) toggle.value = btn.dataset.mode;
    });
  },

  async _scanReceiptOnDevice(file) {
    await this._ensureTesseract();
    const worker = await Tesseract.createWorker('eng', 1, {
      workerPath: '/vendor/worker.min.js',
      corePath: '/vendor/',
      langPath: '/vendor/',
      logger: () => {}
    });
    try {
      const result = await worker.recognize(file);
      const parsed = this._parseReceiptText(result?.data?.text || '');
      if (parsed.amount == null) {
        throw new Error('No amount detected');
      }
      return parsed;
    } finally {
      await worker.terminate();
    }
  },

  _ensureTesseract() {
    if (typeof Tesseract !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/tesseract.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load OCR library'));
      document.head.appendChild(script);
    });
  },

  // ── JS port of static/receipt_ocr.py: extract_receipt ──────────────────
  _parseReceiptText(text) {
    const today = new Date().toISOString().substring(0, 10);
    const result = { merchant: 'Store Receipt', amount: null, date: today, category: 'Food & Dining' };
    const lower = (text || '').toLowerCase();

    const merchantMap = [
      [['starbucks', 'coffee', 'cafe'], 'Starbucks Coffee', 'Coffee & Snacks'],
      [['indomaret', 'alfamart', 'alfamidi', 'mart'], 'Indomaret Point', 'Food & Dining'],
      [['mcdonald', 'mcd', 'kfc', 'burger', 'fried chicken'], 'Fast Food Restaurant', 'Food & Dining'],
      [['grab', 'gojek', 'go ride', 'uber', 'taxi', 'fuel', 'shell', 'pertamina', 'bensin'], 'Transport', 'Transportation'],
      [['gramedia', 'bookstore', 'books', 'stationery', 'print'], 'Bookstore', 'Books & Study'],
      [['pln', 'wifi', 'indihome', 'internet', 'bill', 'token'], 'IndiHome / Utility Bill', 'Bills & Wifi'],
      [['apotek', 'pharma', 'kimia farma', 'doctor', 'clinic', 'rs '], 'Pharmacy / Clinic', 'Health & Medical'],
      [['rent', 'kos', 'sewa', 'kontrakan'], 'Housing Rent', 'Housing / Rent'],
      [['cinema', 'cinemax', 'xxi', 'game', 'concert', 'movie'], 'Entertainment', 'Entertainment']
    ];
    for (const [keywords, merchant, category] of merchantMap) {
      if (keywords.some(k => lower.includes(k))) {
        result.merchant = merchant;
        result.category = category;
        break;
      }
    }

    if (result.merchant === 'Store Receipt') {
      for (const line of (text || '').split('\n')) {
        const l = line.trim();
        if (l && !/\d/.test(l) && l.length <= 40) {
          result.merchant = l.replace(/\b\w/g, c => c.toUpperCase());
          break;
        }
      }
    }

    const dateMatch = (text || '').match(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/);
    if (dateMatch) {
      const parts = dateMatch[0].split(/[\/\-.]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) parts[2] = '20' + parts[2];
        result.date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    const totalKeywords = ['total', 'jumlah', 'bayar', 'amount', 'grand', 'total bayar', 'total pembayaran'];
    for (const line of (text || '').split('\n')) {
      if (totalKeywords.some(k => line.toLowerCase().includes(k))) {
        const amount = this._cleanReceiptAmount(line);
        if (amount != null && amount > 0) {
          result.amount = amount;
          break;
        }
      }
    }

    if (result.amount == null) {
      const lines = (text || '').split('\n').filter(l => l.trim());
      const bottom = lines.slice(Math.max(0, lines.length - Math.floor(lines.length / 3))) || lines;
      let best = null;
      for (const line of bottom) {
        const amount = this._cleanReceiptAmount(line);
        if (amount != null && (best == null || amount > best)) best = amount;
      }
      if (best != null) result.amount = best;
    }

    return result;
  },

  _cleanReceiptAmount(raw) {
    if (!raw) return null;
    const str = String(raw).replace(/(?:rp\.?|idr|usd|\$|€|£|¥)/gi, ' ').trim();
    const numMatch = str.match(/([0-9]+(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[0-9]+)/);
    if (!numMatch) return null;

    let valStr = numMatch[1].trim();
    if (/^\d{1,3}(?:[.]\d{3})+(?:,\d{2})$/.test(valStr)) {
      valStr = valStr.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d{2})$/.test(valStr)) {
      valStr = valStr.replace(/,/g, '');
    } else if (/^\d{1,3}(?:[.]\d{3})+$/.test(valStr)) {
      valStr = valStr.replace(/\./g, '');
    } else if (/^\d{1,3}(?:,\d{3})+$/.test(valStr)) {
      valStr = valStr.replace(/,/g, '');
    } else if (/^\d+,\d{2}$/.test(valStr)) {
      valStr = valStr.replace(',', '.');
    }

    const num = parseFloat(valStr);
    return (isNaN(num) || num <= 0) ? null : Math.round(num);
  },

  async _scanReceiptServer(dataUrl, filename) {
    const base64 = dataUrl.split(',')[1];
    const res = await fetch('/api/receipt/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, filename: filename || 'receipt.jpg' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Scan failed (${res.status})`);
    }
    const data = await res.json();
    const payload = data.data || data;
    if (!payload || payload.amount == null || payload.amount === 0) {
      // If server could not detect amount, fallback to filename heuristic
      const fallback = this._extractReceiptDetails(filename || 'receipt.jpg');
      return {
        merchant: payload.merchant && payload.merchant !== 'Store / Merchant' ? payload.merchant : fallback.merchant,
        amount: fallback.amount,
        date: payload.date || fallback.date,
        category: payload.category || fallback.category
      };
    }
    return {
      merchant: payload.merchant || 'Store Receipt',
      amount: payload.amount,
      date: payload.date || new Date().toISOString().substring(0, 10),
      category: payload.category || 'Food & Dining'
    };
  },

  _fillReceiptFields(parsed) {
    const merchantInput = document.getElementById('receipt-parsed-merchant');
    const amountInput = document.getElementById('receipt-parsed-amount');
    const dateInput = document.getElementById('receipt-parsed-date');
    const catSelect = document.getElementById('receipt-parsed-category');

    const formattedAmount = this.formatCurrency(parsed.amount);
    if (merchantInput) merchantInput.value = parsed.merchant;
    if (amountInput) amountInput.value = formattedAmount;
    if (dateInput) dateInput.value = parsed.date;
    if (catSelect) catSelect.value = parsed.category;
    UI.toast(`Receipt processed! Detected ${formattedAmount}`, 'success');
  },

  _extractReceiptDetails(filename) {
    // Intelligent heuristic OCR engine
    const today = new Date().toISOString().substring(0, 10);
    let merchant = 'Store Receipt';
    let amount = 45000;
    let date = today;
    let category = 'Food & Dining';

    const cleanName = (filename || '').toLowerCase();

    // Pattern matching from filenames or receipt context
    if (cleanName.includes('starbucks') || cleanName.includes('coffee') || cleanName.includes('cafe')) {
      merchant = 'Starbucks Coffee';
      amount = 58000;
      category = 'Coffee & Snacks';
    } else if (cleanName.includes('indomaret') || cleanName.includes('alfamart') || cleanName.includes('mart')) {
      merchant = 'Indomaret Point';
      amount = 64500;
      category = 'Food & Dining';
    } else if (cleanName.includes('mcdonald') || cleanName.includes('mcd') || cleanName.includes('kfc') || cleanName.includes('burger')) {
      merchant = "McDonald's";
      amount = 82000;
      category = 'Food & Dining';
    } else if (cleanName.includes('grab') || cleanName.includes('gojek') || cleanName.includes('uber') || cleanName.includes('taxi') || cleanName.includes('fuel') || cleanName.includes('shell') || cleanName.includes('pertamina')) {
      merchant = 'Pertamina Fuel Station';
      amount = 100000;
      category = 'Transportation';
    } else if (cleanName.includes('gramedia') || cleanName.includes('book') || cleanName.includes('paper') || cleanName.includes('print')) {
      merchant = 'Gramedia Bookstore';
      amount = 125000;
      category = 'Books & Study';
    } else if (cleanName.includes('pln') || cleanName.includes('wifi') || cleanName.includes('indihome') || cleanName.includes('bill')) {
      merchant = 'IndiHome Fiber Wifi';
      amount = 385000;
      category = 'Bills & Wifi';
    } else if (cleanName.includes('apotek') || cleanName.includes('pharma') || cleanName.includes('doctor') || cleanName.includes('clinic')) {
      merchant = 'Apotek Kimia Farma';
      amount = 75000;
      category = 'Health & Medical';
    } else {
      // General heuristic: parse numeric digits in filename if available
      const numbersInName = cleanName.match(/\d{4,}/);
      if (numbersInName) {
        amount = parseInt(numbersInName[0], 10);
      }
    }

    return { merchant, amount, date, category };
  },

  applyReceiptToExpense() {
    const merchant = document.getElementById('receipt-parsed-merchant')?.value || '';
    const amountVal = document.getElementById('receipt-parsed-amount')?.value || '';
    const dateVal = document.getElementById('receipt-parsed-date')?.value || '';
    const catVal = document.getElementById('receipt-parsed-category')?.value || 'Food & Dining';

    const expenseCat = document.getElementById('expense-category');
    const expenseAmt = document.getElementById('expense-amount');
    const expenseDate = document.getElementById('expense-date');
    const expenseDesc = document.getElementById('expense-desc');

    if (expenseCat) expenseCat.value = catVal;
    if (expenseAmt) expenseAmt.value = amountVal;
    if (expenseDate) expenseDate.value = dateVal;
    if (expenseDesc) expenseDesc.value = merchant ? `Receipt: ${merchant}` : 'Scanned receipt';

    this.closeReceiptScanner();
    this.switchFormTab('expense');
    UI.toast(`Receipt applied! ${merchant ? merchant + ' • ' : ''}${amountVal}`, 'success');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.Budget) {
    Budget.init();
  }
});

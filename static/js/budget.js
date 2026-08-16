/**
 * MONTHLY BUDGET & CASH FLOW CONTROLLER (budget.js)
 * ===================================================
 * Manages financial accounting, cash flow KPIs, income/expense ledgers,
 * monthly category targets, CSV export, and print statements.
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
    if (this._initOCR) {
      this._initOCR();
    }
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
        const raw = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
        if (!raw) {
          e.target.value = '';
          return;
        }
        const num = parseInt(raw, 10);
        e.target.value = isNaN(num) ? '' : num.toLocaleString('en-US');
      });
    });
  },

  setDefaultDates() {
    const today = new Date().toISOString().substring(0, 10);
    const expDate = document.getElementById('expense-date');
    const incDate = document.getElementById('income-date');
    if (expDate && !expDate.value) expDate.value = today;
    if (incDate && !incDate.value) incDate.value = today;
  },

  async load() {
    const periodText = document.getElementById('budget-period-text');
    if (periodText) {
      const d = new Date();
      periodText.textContent = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    try {
      const [incRes, expRes, budRes] = await Promise.all([
        API.get('/api/incomes'),
        API.get('/api/expenses'),
        API.get('/api/budgets')
      ]);

      this.incomesList  = Array.isArray(incRes) ? incRes : [];
      this.expensesList = Array.isArray(expRes) ? expRes : [];
      this.budgetsList  = Array.isArray(budRes) ? budRes : [];

      this.renderKPIs();
      this.renderDonut();
      this.renderMicroCharts();
      this.renderTransactionsList();
      this.renderCategoryCards();
    } catch (e) {
      console.error('Failed to load budget data:', e);
      UI.toast('Failed to load budget ledger data.', 'danger');
    }
  },

  setupEventListeners() {
    // Expense form submit
    const expForm = document.getElementById('add-expense-form');
    if (expForm) {
      expForm.onsubmit = async (e) => {
        e.preventDefault();
        const amtInput = document.getElementById('expense-amount');
        const amount = this._parseAmount(amtInput?.value);
        const category = document.getElementById('expense-category')?.value.trim() || 'General';
        const expense_date = document.getElementById('expense-date')?.value;
        const wallet = document.getElementById('expense-wallet')?.value || 'Cash';
        const description = document.getElementById('expense-desc')?.value.trim() || '';

        if (!amount || amount <= 0) {
          UI.toast('Please enter a valid expense amount.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/expenses', {
            amount,
            category,
            expense_date,
            description: `${wallet ? '[' + wallet + '] ' : ''}${description}`.trim()
          });

          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast(`Expense of ${this.formatCurrency(amount)} recorded!`, 'success');
          if (amtInput) amtInput.value = '';
          const descEl = document.getElementById('expense-desc');
          if (descEl) descEl.value = '';
          this.closeEntryModal();
          await this.load();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Income form submit
    const incForm = document.getElementById('add-income-form');
    if (incForm) {
      incForm.onsubmit = async (e) => {
        e.preventDefault();
        const amtInput = document.getElementById('income-amount');
        const amount = this._parseAmount(amtInput?.value);
        const source = document.getElementById('income-source')?.value.trim() || 'Allowance';
        const income_date = document.getElementById('income-date')?.value;
        const wallet = document.getElementById('income-wallet')?.value || 'Cash';
        const recurring = document.getElementById('income-recurring')?.value || 'none';
        const description = document.getElementById('income-desc')?.value.trim() || '';

        if (!amount || amount <= 0) {
          UI.toast('Please enter a valid income amount.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/incomes', {
            amount,
            source,
            income_date,
            recurring,
            description: `${wallet ? '[' + wallet + '] ' : ''}${description}`.trim()
          });

          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast(`Income of +${this.formatCurrency(amount)} added!`, 'success');
          if (amtInput) amtInput.value = '';
          const descEl = document.getElementById('income-desc');
          if (descEl) descEl.value = '';
          this.closeEntryModal();
          await this.load();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }

    // Budget Target Limit submit
    const budForm = document.getElementById('add-budget-form');
    if (budForm) {
      budForm.onsubmit = async (e) => {
        e.preventDefault();
        const category = document.getElementById('budget-category')?.value.trim();
        const amount = this._parseAmount(document.getElementById('budget-amount')?.value);
        const month = this.currentMonth;

        if (!category || !amount || amount <= 0) {
          UI.toast('Please specify a category and positive target limit.', 'warning');
          return;
        }

        try {
          const res = await API.post('/api/budgets', { category, amount, month });
          if (res.error) { UI.toast(res.error, 'danger'); return; }
          UI.toast(`Target for "${category}" set to ${this.formatCurrency(amount)}`, 'success');
          budForm.reset();
          this.closeEntryModal();
          await this.load();
        } catch (err) {
          UI.toast(err.message, 'danger');
        }
      };
    }
  },

  // ── RENDER KPIs & SUMMARY METRICS ─────────────────────────────────────────
  renderKPIs() {
    const totalInc = this._sumAmounts(this.incomesList);
    const totalExp = this._sumAmounts(this.expensesList);
    const netBal   = totalInc - totalExp;

    const balEl    = document.getElementById('kpi-total-balance');
    const incEl    = document.getElementById('kpi-total-income');
    const expEl    = document.getElementById('kpi-total-spent');
    const statusEl = document.getElementById('kpi-balance-status');

    if (balEl) {
      balEl.textContent = (netBal >= 0 ? '+' : '-') + this.formatCurrency(Math.abs(netBal));
      balEl.style.color = netBal >= 0 ? 'var(--text-primary)' : 'var(--accent-danger)';
    }

    if (incEl) incEl.textContent = '+' + this.formatCurrency(totalInc);
    if (expEl) expEl.textContent = '-' + this.formatCurrency(totalExp);

    if (statusEl) {
      if (netBal > 0) {
        statusEl.textContent = 'Healthy Surplus';
        statusEl.className = 'priority-badge priority-low font-bold text-xs';
      } else if (netBal === 0 && totalInc === 0) {
        statusEl.textContent = 'No Transactions Yet';
        statusEl.className = 'priority-badge priority-medium font-bold text-xs';
      } else if (netBal === 0) {
        statusEl.textContent = 'Break-even';
        statusEl.className = 'priority-badge priority-medium font-bold text-xs';
      } else {
        statusEl.textContent = 'Deficit Spending';
        statusEl.className = 'priority-badge priority-high font-bold text-xs';
      }
    }
  },

  renderDonut() {
    const totalInc = this._sumAmounts(this.incomesList);
    const totalExp = this._sumAmounts(this.expensesList);

    const segment = document.getElementById('donut-usage-segment');
    const pctText = document.getElementById('donut-percent-text');
    const feedback = document.getElementById('donut-feedback-text');

    let pct = 0;
    if (totalInc > 0) {
      pct = Math.round((totalExp / totalInc) * 100);
    } else if (totalExp > 0) {
      pct = 100;
    }

    const cappedPct = Math.min(pct, 100);
    if (segment) {
      segment.setAttribute('stroke-dasharray', `${cappedPct} ${100 - cappedPct}`);
      segment.style.stroke = pct > 90 ? '#EF4444' : pct > 75 ? '#F59E0B' : 'var(--primary)';
    }

    if (pctText) {
      pctText.textContent = `${pct}% of income spent`;
    }

    if (feedback) {
      if (totalInc === 0 && totalExp === 0) {
        feedback.textContent = 'Ready to track: Log daily expenses or income.';
      } else if (pct <= 50) {
        feedback.textContent = `Great savings rate! Only ${pct}% of cashflow utilized this month.`;
      } else if (pct <= 80) {
        feedback.textContent = `Balanced budget: ${pct}% of earnings spent so far.`;
      } else if (pct <= 100) {
        feedback.textContent = `Warning: ${pct}% spent. Approaching your total income ceiling.`;
      } else {
        feedback.textContent = `Alert: Spending exceeds income by ${pct - 100}%. Review outgoing expenses.`;
      }
    }
  },

  renderMicroCharts() {
    // Micro sparkline visualizer
  },

  // ── TRANSACTIONS LEDGER & FILTERING ───────────────────────────────────────
  filterTransactions(filter) {
    this.activeTxFilter = filter;
    ['all', 'incomes', 'expenses'].forEach(f => {
      const btn = document.getElementById(`tx-filter-${f}`);
      if (btn) {
        if (f === filter) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });
    this.renderTransactionsList();
  },

  renderTransactionsList() {
    const listEl = document.getElementById('recent-transactions-list');
    if (!listEl) return;

    let items = [];
    if (this.activeTxFilter === 'all' || this.activeTxFilter === 'incomes') {
      this.incomesList.forEach(inc => {
        items.push({
          id: inc.id,
          type: 'income',
          title: inc.source || 'Income',
          date: inc.income_date,
          amount: Number(inc.amount),
          notes: inc.description || '',
          recurring: inc.recurring || 'none'
        });
      });
    }

    if (this.activeTxFilter === 'all' || this.activeTxFilter === 'expenses') {
      this.expensesList.forEach(exp => {
        items.push({
          id: exp.id,
          type: 'expense',
          title: exp.category || 'Expense',
          date: exp.expense_date,
          amount: Number(exp.amount),
          notes: exp.description || '',
          recurring: 'none'
        });
      });
    }

    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state p-xl text-center">
          <p class="text-muted m-0 text-sm">No transactions logged for this filter.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = items.map(it => {
      const isInc = it.type === 'income';
      const sign = isInc ? '+' : '-';
      const colorClass = isInc ? 'text-success' : 'text-danger';
      const badgeIcon = isInc ? BUDGET_SVG.income : BUDGET_SVG.expense;

      return `
        <div class="task-item transaction-row p-sm mb-xs d-flex justify-between items-center">
          <div class="d-flex items-center gap-sm">
            <span class="tx-badge ${isInc ? 'badge-inc' : 'badge-exp'}">${badgeIcon}</span>
            <div>
              <div class="font-bold text-sm text-primary">${UI.esc(it.title)}</div>
              <div class="text-muted text-xs">${UI.esc(it.date || 'Today')} ${it.notes ? '• ' + UI.esc(it.notes) : ''}</div>
            </div>
          </div>
          <div class="d-flex items-center gap-md">
            <span class="font-mono font-extrabold ${colorClass} text-sm">${sign}${this.formatCurrency(it.amount)}</span>
            <button class="btn-icon text-muted cursor-pointer" onclick="Budget.deleteTransaction('${it.type}', ${it.id})" title="Delete entry" type="button">
              ${BUDGET_SVG.trash}
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteTransaction(type, id) {
    if (!confirm(`Are you sure you want to remove this ${type} entry?`)) return;
    try {
      const endpoint = type === 'income' ? `/api/incomes/${id}` : `/api/expenses/${id}`;
      const res = await API.delete(endpoint);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Entry removed.', 'info');
        await this.load();
      }
    } catch (e) {
      UI.toast(e.message, 'danger');
    }
  },

  // ── CATEGORY TARGETS & LIMITS ─────────────────────────────────────────────
  renderCategoryCards() {
    const grid = document.getElementById('budget-category-cards');
    const summary = document.getElementById('category-targets-summary');
    if (!grid) return;

    if (this.budgetsList.length === 0) {
      if (summary) summary.textContent = '0 targets set';
      grid.innerHTML = `
        <div class="col-span-full text-center p-xl border rounded bg-surface-alt">
          <p class="text-muted text-sm m-0">No monthly category limits configured yet. Click "🎯 Set Target" above to allocate spending caps.</p>
        </div>
      `;
      return;
    }

    if (summary) summary.textContent = `${this.budgetsList.length} categories active`;

    grid.innerHTML = this.budgetsList.map(bud => {
      const catExpenses = this.expensesList.filter(e => (e.category || '').toLowerCase() === (bud.category || '').toLowerCase());
      const spent = this._sumAmounts(catExpenses);
      const limit = Number(bud.amount) || 1;
      const pct = Math.round((spent / limit) * 100);
      const remaining = limit - spent;

      let statusColor = 'var(--primary)';
      let statusBadge = 'On Track';
      let badgeClass = 'priority-low';

      if (pct >= 100) {
        statusColor = 'var(--accent-danger)';
        statusBadge = 'Exceeded';
        badgeClass = 'priority-high';
      } else if (pct >= 80) {
        statusColor = '#F59E0B';
        statusBadge = 'Warning (80%+)';
        badgeClass = 'priority-medium';
      }

      return `
        <div class="card p-md border rounded bg-surface-alt">
          <div class="d-flex justify-between items-start mb-sm">
            <div>
              <div class="font-bold text-sm text-primary">${UI.esc(bud.category)}</div>
              <span class="text-muted text-xs font-mono">${this.formatCurrency(spent)} of ${this.formatCurrency(limit)}</span>
            </div>
            <div class="d-flex items-center gap-xs">
              <span class="priority-badge ${badgeClass} text-xs">${statusBadge}</span>
              <button class="btn-icon text-muted cursor-pointer" onclick="Budget.deleteBudgetLimit(${bud.id})" title="Delete Target" type="button">×</button>
            </div>
          </div>
          <div class="course-progress-bar-container mb-xs">
            <div class="course-progress-bar-fill" style="width: ${Math.min(pct, 100)}%; background: ${statusColor};"></div>
          </div>
          <div class="d-flex justify-between text-xs text-muted mt-xs font-mono">
            <span>${pct}% used</span>
            <span class="${remaining >= 0 ? 'text-success' : 'text-danger'} font-bold">
              ${remaining >= 0 ? this.formatCurrency(remaining) + ' left' : this.formatCurrency(Math.abs(remaining)) + ' over'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  async deleteBudgetLimit(id) {
    if (!confirm('Remove this category limit?')) return;
    try {
      const res = await API.delete(`/api/budgets/${id}`);
      if (res.error) UI.toast(res.error, 'danger');
      else {
        UI.toast('Category limit deleted.', 'info');
        await this.load();
      }
    } catch (e) {
      UI.toast(e.message, 'danger');
    }
  },

  // ── MODAL WINDOW CONTROLS ────────────────────────────────────────────────
  openEntryModal(tab = 'expense') {
    const modal = document.getElementById('budget-entry-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    this.switchModalTab(tab);
    document.body.classList.add('modal-open');
  },

  closeEntryModal() {
    const modal = document.getElementById('budget-entry-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  },

  switchModalTab(tab) {
    this.activeFormTab = tab;
    ['expense', 'income', 'budget'].forEach(t => {
      const tabBtn = document.getElementById(`modal-tab-${t}`);
      const form = document.getElementById(`add-${t}-form`);
      if (tabBtn) {
        if (t === tab) tabBtn.classList.add(`active-${t}`);
        else tabBtn.classList.remove(`active-${t}`);
      }
      if (form) {
        if (t === tab) form.classList.remove('hidden');
        else form.classList.add('hidden');
      }
    });

    const titleEl = document.getElementById('budget-modal-title');
    if (titleEl) {
      if (tab === 'expense') titleEl.textContent = 'Log Outgoing Expense';
      else if (tab === 'income') titleEl.textContent = 'Log Incoming Cashflow';
      else titleEl.textContent = 'Set Monthly Category Limit';
    }
  },

  // ── EXPORT & PRINT STATEMENTS ─────────────────────────────────────────────
  exportCSV() {
    const rows = [
      ['Date', 'Type', 'Category / Source', 'Description / Account', 'Amount']
    ];

    this.incomesList.forEach(inc => {
      rows.push([
        inc.income_date || '',
        'INCOME',
        inc.source || '',
        inc.description || '',
        inc.amount || 0
      ]);
    });

    this.expensesList.forEach(exp => {
      rows.push([
        exp.expense_date || '',
        'EXPENSE',
        exp.category || '',
        exp.description || '',
        exp.amount || 0
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pocketsly_Cashflow_${this.currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    UI.toast('Exported cashflow ledger as CSV!', 'success');
  },

  printReport() {
    const printContainer = document.getElementById('financial-print-statement');
    if (!printContainer) return;

    let totalInc = this._sumAmounts(this.incomesList);
    let totalExp = this._sumAmounts(this.expensesList);
    const netBal = totalInc - totalExp;

    const allTx = [];
    this.incomesList.forEach(inc => {
      allTx.push({
        type: 'INCOME',
        date: inc.income_date,
        source: inc.source,
        notes: inc.description || '-',
        amount: Number(inc.amount) || 0,
        isIncome: true
      });
    });

    this.expensesList.forEach(exp => {
      allTx.push({
        type: 'EXPENSE',
        date: exp.expense_date,
        source: exp.category,
        notes: exp.description || '-',
        amount: Number(exp.amount) || 0,
        isIncome: false
      });
    });

    allTx.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    printContainer.innerHTML = `
      <div class="print-statement-box p-xl">
        <h2 class="m-0 text-xl font-bold">Pocketsly Financial Statement</h2>
        <p class="text-muted text-xs mb-lg">Statement Period: ${this.currentMonth}</p>
        <div class="d-flex gap-lg mb-lg">
          <div>Total Income: <strong class="text-success">+${this.formatCurrency(totalInc)}</strong></div>
          <div>Total Expense: <strong class="text-danger">-${this.formatCurrency(totalExp)}</strong></div>
          <div>Net Balance: <strong class="${netBal >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(netBal)}</strong></div>
        </div>
        <table class="w-full text-xs font-mono">
          <thead>
            <tr class="border-b">
              <th class="text-left p-xs">Date</th>
              <th class="text-left p-xs">Type</th>
              <th class="text-left p-xs">Category / Source</th>
              <th class="text-left p-xs">Notes</th>
              <th class="text-right p-xs">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${allTx.map(t => `
              <tr class="border-b">
                <td class="p-xs">${UI.esc(t.date || '-')}</td>
                <td class="p-xs font-bold ${t.isIncome ? 'text-success' : 'text-danger'}">${t.type}</td>
                <td class="p-xs">${UI.esc(t.source || '-')}</td>
                <td class="p-xs text-muted">${UI.esc(t.notes || '-')}</td>
                <td class="p-xs text-right font-bold">${t.isIncome ? '+' : '-'}${this.formatCurrency(t.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
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
      if (this.openReceiptScanner) this.openReceiptScanner();
      return;
    }
    this.openEntryModal(kind);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.Budget) {
    Budget.init();
  }
});

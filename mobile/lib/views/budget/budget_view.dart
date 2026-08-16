import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';
import 'budget_entry_sheet.dart';

class BudgetView extends StatefulWidget {
  const BudgetView({super.key});

  @override
  State<BudgetView> createState() => _BudgetViewState();
}

class _BudgetViewState extends State<BudgetView> {
  bool _isLoading = true;
  double _totalIncome = 0.0;
  double _totalExpense = 0.0;
  List<TransactionItem> _transactions = [];
  List<BudgetLimitItem> _limits = [];
  String _ledgerFilter = 'all'; // 'all', 'expense', 'income'

  @override
  void initState() {
    super.initState();
    _loadBudgetData();
  }

  Future<void> _loadBudgetData() async {
    setState(() => _isLoading = true);
    try {
      final incRes = await ApiClient.instance.get(ApiEndpoints.incomes);
      final expRes = await ApiClient.instance.get(ApiEndpoints.expenses);
      final budRes = await ApiClient.instance.get(ApiEndpoints.budgets);

      if (mounted) {
        _totalIncome = 0;
        _totalExpense = 0;
        final list = <TransactionItem>[];

        if (incRes is List) {
          for (var i in incRes) {
            final t = TransactionItem.fromJson(i, 'income');
            _totalIncome += t.amount;
            list.add(t);
          }
        }
        if (expRes is List) {
          for (var e in expRes) {
            final t = TransactionItem.fromJson(e, 'expense');
            _totalExpense += t.amount;
            list.add(t);
          }
        }

        list.sort((a, b) => b.date.compareTo(a.date));
        _transactions = list;

        if (budRes is List) {
          _limits = budRes.map((b) => BudgetLimitItem.fromJson(b)).toList();
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _deleteTransaction(TransactionItem t) async {
    if (t.isIncome) {
      await ApiClient.instance.delete(ApiEndpoints.income(t.id));
    } else {
      await ApiClient.instance.delete(ApiEndpoints.expense(t.id));
    }
    _loadBudgetData();
  }

  Future<void> _deleteBudgetLimit(BudgetLimitItem l) async {
    await ApiClient.instance.delete(ApiEndpoints.budget(l.id));
    _loadBudgetData();
  }

  void _openEntry(String tab) {
    BudgetEntrySheet.show(context, initialTab: tab, onSaved: _loadBudgetData);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryLight));
    }

    final balance = _totalIncome - _totalExpense;
    final usagePct = _totalIncome > 0
        ? ((_totalExpense / _totalIncome) * 100).clamp(0, 100).toInt()
        : (_totalExpense > 0 ? 100 : 0);

    final filteredTransactions = _transactions.where((t) {
      if (_ledgerFilter == 'income') return t.isIncome;
      if (_ledgerFilter == 'expense') return !t.isIncome;
      return true;
    }).toList();

    return RefreshIndicator(
      color: AppColors.primaryLight,
      backgroundColor: AppColors.bgSurface,
      onRefresh: _loadBudgetData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Cashflow Hero Balance Card (Reference 1 & 2) ───────────────────
          GlassCard(
            padding: const EdgeInsets.all(20),
            borderRadius: 22,
            gradient: AppColors.glassGradient,
            border: Border.all(color: AppColors.primaryLight.withAlpha(60), width: 1.2),
            glowColor: balance >= 0 ? AppColors.primaryLight : AppColors.danger,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'TOTAL NET BALANCE',
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: balance >= 0 ? AppColors.success.withAlpha(35) : AppColors.danger.withAlpha(35),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(
                          color: balance >= 0 ? AppColors.success.withAlpha(80) : AppColors.danger.withAlpha(80),
                        ),
                      ),
                      child: Text(
                        balance >= 0 ? 'Healthy Surplus' : 'Deficit Spending',
                        style: TextStyle(
                          color: balance >= 0 ? AppColors.success : AppColors.danger,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  '${balance >= 0 ? "+" : "-"}Rp ${balance.abs().toStringAsFixed(0)}',
                  style: TextStyle(
                    color: balance >= 0 ? AppColors.textPrimary : AppColors.danger,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 16),

                // Flow strip (Income vs Expense)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.bgSurfaceAlt,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Income', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(
                            '+Rp ${_totalIncome.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppColors.success, fontSize: 15, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      Container(height: 28, width: 1, color: AppColors.border),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Spent', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 2),
                          Text(
                            '-Rp ${_totalExpense.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppColors.danger, fontSize: 15, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Usage Progress Bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: usagePct / 100.0,
                    backgroundColor: AppColors.bgSurfaceAlt,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      usagePct > 85 ? AppColors.danger : (usagePct > 70 ? AppColors.warning : AppColors.primaryLight),
                    ),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$usagePct% of monthly earnings utilized',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── Quick Log Buttons ──────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _openEntry('expense'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.danger,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.remove_circle_outline_rounded, size: 18),
                  label: const Text('- Expense', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _openEntry('income'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.add_circle_outline_rounded, size: 18),
                  label: const Text('+ Income', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: () => _openEntry('budget'),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.all(13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.track_changes_rounded, color: Colors.white),
                tooltip: 'Set Target Limit',
              ),
            ],
          ),
          const SizedBox(height: 20),

          // ── Category Limits ────────────────────────────────────────────────
          if (_limits.isNotEmpty) ...[
            const Text(
              'CATEGORY SPENDING TARGETS',
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            ..._limits.map((l) {
              final spent = _transactions
                  .where((t) => !t.isIncome && t.categoryOrSource.toLowerCase() == l.category.toLowerCase())
                  .fold(0.0, (acc, cur) => acc + cur.amount);
              final pct = ((spent / (l.amount > 0 ? l.amount : 1)) * 100).clamp(0, 100).toInt();

              return GlassCard(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                borderRadius: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(l.category, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: AppColors.textPrimary)),
                        Row(
                          children: [
                            Text(
                              'Rp ${spent.toStringAsFixed(0)} / ${l.amount.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontFamily: 'monospace', fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(width: 6),
                            InkWell(
                              onTap: () => _deleteBudgetLimit(l),
                              child: const Icon(Icons.close_rounded, size: 16, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(99),
                      child: LinearProgressIndicator(
                        value: pct / 100.0,
                        backgroundColor: AppColors.bgSurfaceAlt,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          pct > 90 ? AppColors.danger : (pct > 70 ? AppColors.warning : AppColors.primaryLight),
                        ),
                        minHeight: 5,
                      ),
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: 16),
          ],

          // ── Recent Transactions Ledger ────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'TRANSACTION LEDGER',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
              Row(
                children: [
                  _buildLedgerFilterChip('all', 'All'),
                  const SizedBox(width: 4),
                  _buildLedgerFilterChip('expense', 'Expense'),
                  const SizedBox(width: 4),
                  _buildLedgerFilterChip('income', 'Income'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (filteredTransactions.isEmpty)
            const GlassCard(
              borderRadius: 18,
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(
                  child: Text('No transactions logged yet.', style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                ),
              ),
            )
          else
            ...filteredTransactions.map((t) => GlassCard(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              borderRadius: 16,
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: (t.isIncome ? AppColors.success : AppColors.danger).withAlpha(30),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      t.isIncome ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                      color: t.isIncome ? AppColors.success : AppColors.danger,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.description.isNotEmpty ? t.description : t.categoryOrSource,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: AppColors.textPrimary),
                        ),
                        Text(
                          '${t.date} • ${t.categoryOrSource}',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${t.isIncome ? "+" : "-"}Rp ${t.amount.toStringAsFixed(0)}',
                    style: TextStyle(
                      color: t.isIncome ? AppColors.success : AppColors.danger,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    onPressed: () => _deleteTransaction(t),
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.textMuted, size: 18),
                  ),
                ],
              ),
            )),
        ],
      ),
    );
  }

  Widget _buildLedgerFilterChip(String filter, String label) {
    final isSelected = _ledgerFilter == filter;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.bgSurfaceAlt,
      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textSecondary,
        fontSize: 10,
        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      onSelected: (_) => setState(() => _ledgerFilter = filter),
    );
  }
}

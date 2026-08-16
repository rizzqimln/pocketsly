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

  void _openEntry(String tab) {
    BudgetEntrySheet.show(context, initialTab: tab, onSaved: _loadBudgetData);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    final balance = _totalIncome - _totalExpense;
    final usagePct = _totalIncome > 0 ? ((_totalExpense / _totalIncome) * 100).clamp(0, 100).toInt() : (_totalExpense > 0 ? 100 : 0);

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.bgSurface,
      onRefresh: _loadBudgetData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Cashflow Hero Balance Card ─────────────────────────────────────
          GlassCard(
            padding: const EdgeInsets.all(20),
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
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: balance >= 0 ? AppColors.success.withOpacity(0.15) : AppColors.danger.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        balance >= 0 ? 'Healthy Surplus' : 'Deficit Spending',
                        style: TextStyle(
                          color: balance >= 0 ? AppColors.success : AppColors.danger,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${balance >= 0 ? "+" : "-"}Rp ${balance.abs().toStringAsFixed(0)}',
                  style: TextStyle(
                    color: balance >= 0 ? AppColors.textPrimary : AppColors.danger,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(height: 16),

                // Flow strip (Income vs Expense)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.bgSurfaceAlt,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Income', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          Text(
                            '+Rp ${_totalIncome.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppColors.success, fontSize: 14, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      Container(height: 24, width: 1, color: AppColors.border),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Spent', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                          Text(
                            '-Rp ${_totalExpense.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppColors.danger, fontSize: 14, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Usage Progress Bar
                LinearProgressIndicator(
                  value: usagePct / 100.0,
                  backgroundColor: AppColors.bgSurfaceAlt,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    usagePct > 85 ? AppColors.danger : (usagePct > 70 ? AppColors.warning : AppColors.primary),
                  ),
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(3),
                ),
                const SizedBox(height: 6),
                Text(
                  '$usagePct% of monthly earnings spent',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
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
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.remove_circle_outline_rounded, size: 18),
                  label: const Text('- Expense', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _openEntry('income'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.add_circle_outline_rounded, size: 18),
                  label: const Text('+ Income', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: () => _openEntry('budget'),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.all(12),
                ),
                icon: const Icon(Icons.track_changes_rounded, color: Colors.white),
                tooltip: 'Set Limit',
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
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(l.category, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary)),
                        Text('Rp ${spent.toStringAsFixed(0)} / ${l.amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontFamily: 'monospace')),
                      ],
                    ),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(
                      value: pct / 100.0,
                      backgroundColor: AppColors.bgSurfaceAlt,
                      valueColor: AlwaysStoppedAnimation<Color>(pct > 90 ? AppColors.danger : AppColors.primary),
                      minHeight: 5,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: 16),
          ],

          // ── Recent Transactions Ledger ────────────────────────────────────
          const Text(
            'TRANSACTION LEDGER',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          if (_transactions.isEmpty)
            const GlassCard(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: Text('No transactions logged yet.', style: TextStyle(color: AppColors.textMuted))),
              ),
            )
          else
            ..._transactions.map((t) => GlassCard(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: t.isIncome ? AppColors.success.withOpacity(0.15) : AppColors.danger.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      t.isIncome ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                      color: t.isIncome ? AppColors.success : AppColors.danger,
                      size: 16,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.categoryOrSource,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          '${t.date} ${t.description.isNotEmpty ? "• " + t.description : ""}',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${t.isIncome ? "+" : "-"}Rp ${t.amount.toStringAsFixed(0)}',
                    style: TextStyle(
                      color: t.isIncome ? AppColors.success : AppColors.danger,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            )),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/kpi_card.dart';

class DashboardView extends StatefulWidget {
  final VoidCallback onNavigateToBudget;
  final VoidCallback onNavigateToHabits;

  const DashboardView({
    super.key,
    required this.onNavigateToBudget,
    required this.onNavigateToHabits,
  });

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  bool _isLoading = true;
  int _pendingTasks = 0;
  int _completedTasks = 0;
  int _activeHabits = 0;
  double _balance = 0.0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final tasksRes = await ApiClient.instance.get(ApiEndpoints.tasks);
      final habitsRes = await ApiClient.instance.get(ApiEndpoints.habits);
      final incRes = await ApiClient.instance.get(ApiEndpoints.incomes);
      final expRes = await ApiClient.instance.get(ApiEndpoints.expenses);

      if (mounted) {
        if (tasksRes is List) {
          _pendingTasks = tasksRes.where((t) => t['done'] != 1 && t['done'] != true).length;
          _completedTasks = tasksRes.where((t) => t['done'] == 1 || t['done'] == true).length;
        }
        if (habitsRes is List) {
          _activeHabits = habitsRes.length;
        }

        double totalInc = 0;
        double totalExp = 0;
        if (incRes is List) {
          for (var i in incRes) {
            totalInc += (i['amount'] as num?)?.toDouble() ?? 0;
          }
        }
        if (expRes is List) {
          for (var e in expRes) {
            totalExp += (e['amount'] as num?)?.toDouble() ?? 0;
          }
        }
        _balance = totalInc - totalExp;
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.bgSurface,
      onRefresh: _loadDashboardData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Greeting Banner ────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E1B4B), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Welcome to Pocketsly 👋',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(color: AppColors.success.withOpacity(0.3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.cloud_done_rounded, color: AppColors.success, size: 14),
                          SizedBox(width: 4),
                          Text(
                            '24/7 Edge',
                            style: TextStyle(color: AppColors.success, fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Your daily routines, academic curriculum, and monthly cash flow synced at the edge.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── KPI Summary Cards ──────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: KpiCard(
                  title: 'Net Balance',
                  value: 'Rp ${_balance >= 0 ? '+' : ''}${_balance.toStringAsFixed(0)}',
                  subtitle: _balance >= 0 ? 'Surplus' : 'Deficit',
                  icon: Icons.account_balance_wallet_rounded,
                  iconColor: _balance >= 0 ? AppColors.success : AppColors.danger,
                  onTap: widget.onNavigateToBudget,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: KpiCard(
                  title: 'Tasks Active',
                  value: '$_pendingTasks / ${_pendingTasks + _completedTasks}',
                  subtitle: '$_completedTasks done',
                  icon: Icons.checklist_rounded,
                  iconColor: AppColors.primaryLight,
                  onTap: widget.onNavigateToHabits,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ── Quick Actions ──────────────────────────────────────────────────
          const Text(
            'QUICK SHORTCUTS',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          GlassCard(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildQuickBtn(Icons.add_shopping_cart_rounded, 'Log Expense', AppColors.danger, widget.onNavigateToBudget),
                _buildQuickBtn(Icons.savings_outlined, 'Add Income', AppColors.success, widget.onNavigateToBudget),
                _buildQuickBtn(Icons.check_circle_outline_rounded, 'Habit Check', AppColors.primaryLight, widget.onNavigateToHabits),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickBtn(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

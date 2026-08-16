import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/kpi_card.dart';
import '../../widgets/pomodoro_timer_dialog.dart';

class DashboardView extends StatefulWidget {
  final VoidCallback onNavigateToBudget;
  final VoidCallback onNavigateToHabits;
  final VoidCallback onNavigateToNotes;
  final VoidCallback onOpenProfile;

  const DashboardView({
    super.key,
    required this.onNavigateToBudget,
    required this.onNavigateToHabits,
    required this.onNavigateToNotes,
    required this.onOpenProfile,
  });

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  bool _isLoading = true;
  int _pendingTasks = 0;
  int _completedTasks = 0;
  int _activeHabitsCount = 0;
  int _completedHabitsToday = 0;
  double _balance = 0.0;
  double _totalIncome = 0.0;
  double _totalExpense = 0.0;
  List<TaskItem> _recentTasks = [];
  List<ScheduleItem> _todaySchedules = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  String _getTodayWeekdayName() {
    final days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final weekday = DateTime.now().weekday; // 1 = Mon, 7 = Sun
    return days[weekday - 1];
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final tasksRes = await ApiClient.instance.get(ApiEndpoints.tasks);
      final habitsRes = await ApiClient.instance.get(ApiEndpoints.habits);
      final incRes = await ApiClient.instance.get(ApiEndpoints.incomes);
      final expRes = await ApiClient.instance.get(ApiEndpoints.expenses);
      final schedRes = await ApiClient.instance.get(ApiEndpoints.schedules);

      if (mounted) {
        if (tasksRes is List) {
          final allTasks = tasksRes.map((t) => TaskItem.fromJson(t)).toList();
          _pendingTasks = allTasks.where((t) => !t.done).length;
          _completedTasks = allTasks.where((t) => t.done).length;
          _recentTasks = allTasks.take(3).toList();
        }

        if (habitsRes is List) {
          final allHabits = habitsRes.map((h) => HabitItem.fromJson(h)).toList();
          _activeHabitsCount = allHabits.length;
          _completedHabitsToday = allHabits.where((h) => h.completedToday).length;
        }

        _totalIncome = 0;
        _totalExpense = 0;
        if (incRes is List) {
          for (var i in incRes) {
            _totalIncome += (i['amount'] as num?)?.toDouble() ?? 0;
          }
        }
        if (expRes is List) {
          for (var e in expRes) {
            _totalExpense += (e['amount'] as num?)?.toDouble() ?? 0;
          }
        }
        _balance = _totalIncome - _totalExpense;

        if (schedRes is List) {
          final today = _getTodayWeekdayName().toLowerCase();
          _todaySchedules = schedRes
              .map((s) => ScheduleItem.fromJson(s))
              .where((s) => s.day.toLowerCase() == today)
              .toList();
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    final user = ApiClient.instance.currentUser;
    final displayName = user != null && user.username.isNotEmpty ? user.username : 'there';

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
              gradient: AppColors.heroGradient,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primary.withAlpha(80)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Welcome, $displayName 👋',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withAlpha(35),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(color: AppColors.success.withAlpha(80)),
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
                  'Your daily routines, academic curriculum, and monthly cash flow synced seamlessly.',
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
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: KpiCard(
                  title: 'Daily Habits',
                  value: '$_completedHabitsToday / $_activeHabitsCount',
                  subtitle: 'Completed today',
                  icon: Icons.local_fire_department_rounded,
                  iconColor: AppColors.warning,
                  onTap: widget.onNavigateToHabits,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: KpiCard(
                  title: 'Focus Timer',
                  value: 'Pomodoro',
                  subtitle: '25m session',
                  icon: Icons.timer_outlined,
                  iconColor: AppColors.cyan,
                  onTap: () => PomodoroTimerDialog.show(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // ── Quick Shortcuts ────────────────────────────────────────────────
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
                _buildQuickBtn(Icons.remove_circle_outline_rounded, 'Log Expense', AppColors.danger, widget.onNavigateToBudget),
                _buildQuickBtn(Icons.add_circle_outline_rounded, 'Add Income', AppColors.success, widget.onNavigateToBudget),
                _buildQuickBtn(Icons.check_circle_outline_rounded, 'Habit Matrix', AppColors.primaryLight, widget.onNavigateToHabits),
                _buildQuickBtn(Icons.note_add_outlined, 'Notes', AppColors.indigo, widget.onNavigateToNotes),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Today's Classes & Timetable ────────────────────────────────────
          if (_todaySchedules.isNotEmpty) ...[
            Text(
              "TODAY'S SCHEDULE (${_getTodayWeekdayName().toUpperCase()})",
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            ..._todaySchedules.map((s) => GlassCard(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  const Icon(Icons.school_outlined, color: AppColors.primaryLight, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.subject, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13)),
                        Text('${s.time} • Room: ${s.room.isEmpty ? "Online" : s.room}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            )),
            const SizedBox(height: 16),
          ],

          // ── Priority Tasks Preview ─────────────────────────────────────────
          if (_recentTasks.isNotEmpty) ...[
            const Text(
              'ACTIVE TASKS',
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            ..._recentTasks.map((t) => GlassCard(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Icon(
                    t.done ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                    color: t.done ? AppColors.success : AppColors.textMuted,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      t.title,
                      style: TextStyle(
                        color: t.done ? AppColors.textMuted : AppColors.textPrimary,
                        fontSize: 13,
                        decoration: t.done ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: t.priority == 'high' ? AppColors.danger.withAlpha(35) : AppColors.primary.withAlpha(35),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      t.priority.toUpperCase(),
                      style: TextStyle(
                        color: t.priority == 'high' ? AppColors.danger : AppColors.primaryLight,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildQuickBtn(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withAlpha(35),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

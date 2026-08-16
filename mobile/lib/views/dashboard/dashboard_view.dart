import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/kpi_card.dart';
import '../../widgets/capsule_progress_widget.dart';
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
    final weekday = DateTime.now().weekday;
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
          _recentTasks = allTasks.take(4).toList();
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
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryLight));
    }

    final user = ApiClient.instance.currentUser;
    final displayName = user != null && user.username.isNotEmpty ? user.username : 'Alex';
    final totalTasks = _pendingTasks + _completedTasks;
    final taskProgress = totalTasks > 0 ? (_completedTasks / totalTasks) : 0.0;
    final habitProgress = _activeHabitsCount > 0 ? (_completedHabitsToday / _activeHabitsCount) : 0.0;

    return RefreshIndicator(
      color: AppColors.primaryLight,
      backgroundColor: AppColors.bgSurface,
      onRefresh: _loadDashboardData,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        children: [
          // ── Hero Greeting Card (Reference 1 & 2) ──────────────────────────
          GlassCard(
            padding: const EdgeInsets.all(18),
            gradient: AppColors.heroGradient,
            borderRadius: 22,
            border: Border.all(color: AppColors.primaryLight.withAlpha(60), width: 1.2),
            glowColor: AppColors.primaryLight,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        // Avatar with glowing ring
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppColors.primaryGradient,
                            border: Border.all(color: Colors.white.withAlpha(180), width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryLight.withAlpha(150),
                                blurRadius: 12,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            displayName.isNotEmpty ? displayName[0].toUpperCase() : 'A',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello, $displayName 👋',
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.4,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: AppColors.success,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                const Text(
                                  'AI Study Flow Active',
                                  style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),

                    // Edge Status Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(50),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(color: AppColors.primaryLight.withAlpha(90), width: 1),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bolt_rounded, color: AppColors.primaryLight, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Level 4',
                            style: TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.bgSurfaceAlt.withAlpha(140),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.auto_awesome_rounded, color: AppColors.primaryLight, size: 16),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Your routines, curriculum, and budget are synchronized in real time.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 11.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ── KPI Cards (Net Balance & Active Tasks) ─────────────────────────
          Row(
            children: [
              Expanded(
                child: KpiCard(
                  title: 'Net Balance',
                  value: 'Rp ${_balance >= 0 ? '+' : ''}${_balance.toStringAsFixed(0)}',
                  subtitle: _balance >= 0 ? 'Surplus Flow' : 'Deficit',
                  icon: Icons.account_balance_wallet_rounded,
                  iconColor: _balance >= 0 ? AppColors.success : AppColors.danger,
                  badgeText: _balance >= 0 ? 'Healthy' : 'Warning',
                  badgeColor: _balance >= 0 ? AppColors.success : AppColors.danger,
                  onTap: widget.onNavigateToBudget,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: KpiCard(
                  title: 'Tasks Todo',
                  value: '$_pendingTasks active',
                  subtitle: '$_completedTasks completed',
                  icon: Icons.checklist_rounded,
                  iconColor: AppColors.primaryLight,
                  progress: taskProgress,
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
                  title: 'Habit Streaks',
                  value: '$_completedHabitsToday / $_activeHabitsCount',
                  subtitle: 'Done today',
                  icon: Icons.local_fire_department_rounded,
                  iconColor: AppColors.orange,
                  progress: habitProgress,
                  onTap: widget.onNavigateToHabits,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: KpiCard(
                  title: 'Pomodoro',
                  value: '25m Flow',
                  subtitle: 'Tap to start focus',
                  icon: Icons.timer_outlined,
                  iconColor: AppColors.cyan,
                  badgeText: 'Ready',
                  badgeColor: AppColors.cyan,
                  onTap: () => PomodoroTimerDialog.show(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // ── Learning Progress Tracker Capsules (Reference 2) ───────────────
          GlassCard(
            padding: const EdgeInsets.all(16),
            borderRadius: 20,
            child: CapsuleProgressWidget(
              title: 'Weekly Learning & Study Velocity',
              subtitle: 'Consistency breakdown across the week',
              items: [
                CapsuleProgressItem(
                  label: 'Mon',
                  topScore: 70,
                  count: 4,
                  unit: 'modules',
                  progress: 0.65,
                  primaryColor: AppColors.primaryLight,
                  backgroundColor: AppColors.pastelLavender.withAlpha(20),
                ),
                CapsuleProgressItem(
                  label: 'Tue',
                  topScore: 90,
                  count: 6,
                  unit: 'modules',
                  progress: 0.85,
                  primaryColor: AppColors.cyan,
                  backgroundColor: AppColors.pastelSky.withAlpha(20),
                ),
                CapsuleProgressItem(
                  label: 'Wed',
                  topScore: 100,
                  count: 8,
                  unit: 'modules',
                  progress: 1.0,
                  primaryColor: AppColors.success,
                  backgroundColor: AppColors.pastelMint.withAlpha(20),
                ),
                CapsuleProgressItem(
                  label: 'Today',
                  topScore: 85,
                  count: _completedHabitsToday + _completedTasks,
                  unit: 'done',
                  progress: (_completedHabitsToday + _completedTasks) / 10.0,
                  primaryColor: AppColors.orange,
                  backgroundColor: AppColors.pastelPeach.withAlpha(20),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Quick Action Shortcuts ─────────────────────────────────────────
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
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
            borderRadius: 18,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildQuickBtn(Icons.remove_circle_outline_rounded, 'Expense', AppColors.danger, widget.onNavigateToBudget),
                _buildQuickBtn(Icons.add_circle_outline_rounded, 'Income', AppColors.success, widget.onNavigateToBudget),
                _buildQuickBtn(Icons.check_circle_outline_rounded, 'Habit', AppColors.primaryLight, widget.onNavigateToHabits),
                _buildQuickBtn(Icons.auto_stories_outlined, 'Journal', AppColors.indigo, widget.onNavigateToNotes),
                _buildQuickBtn(Icons.settings_outlined, 'Server', AppColors.cyan, widget.onOpenProfile),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Today's Timetable (Reference 1 Study Sheet Cards) ───────────────
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
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              borderRadius: 16,
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(35),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.school_rounded, color: AppColors.primaryLight, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.subject,
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${s.time} • Room: ${s.room.isEmpty ? "Online" : s.room}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.bgSurfaceAlt,
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Text(
                      s.lecturer.isNotEmpty ? s.lecturer : 'Academic',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            )),
            const SizedBox(height: 16),
          ],

          // ── Active Tasks Preview (Reference 1 Study Sheet Pill Style) ───────
          if (_recentTasks.isNotEmpty) ...[
            const Text(
              'ACTIVE TASKS & ASSIGNMENTS',
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            ..._recentTasks.map((t) => GlassCard(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              borderRadius: 16,
              child: Row(
                children: [
                  Icon(
                    t.done ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                    color: t.done ? AppColors.success : AppColors.primaryLight,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      t.title,
                      style: TextStyle(
                        color: t.done ? AppColors.textMuted : AppColors.textPrimary,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        decoration: t.done ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: t.priority == 'high'
                          ? AppColors.danger.withAlpha(30)
                          : AppColors.primary.withAlpha(30),
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: t.priority == 'high'
                            ? AppColors.danger.withAlpha(70)
                            : AppColors.primaryLight.withAlpha(70),
                      ),
                    ),
                    child: Text(
                      t.priority.toUpperCase(),
                      style: TextStyle(
                        color: t.priority == 'high' ? AppColors.danger : AppColors.primaryLight,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
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
      borderRadius: BorderRadius.circular(14),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Column(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color.withAlpha(30),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withAlpha(60), width: 1),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

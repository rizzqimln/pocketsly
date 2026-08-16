import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';

class HabitsView extends StatefulWidget {
  const HabitsView({super.key});

  @override
  State<HabitsView> createState() => _HabitsViewState();
}

class _HabitsViewState extends State<HabitsView> {
  bool _isLoading = true;
  List<HabitItem> _habits = [];
  List<TaskItem> _tasks = [];
  final TextEditingController _taskController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final hRes = await ApiClient.instance.get(ApiEndpoints.habits);
      final tRes = await ApiClient.instance.get(ApiEndpoints.tasks);

      if (mounted) {
        if (hRes is List) {
          _habits = hRes.map((h) => HabitItem.fromJson(h)).toList();
        }
        if (tRes is List) {
          _tasks = tRes.map((t) => TaskItem.fromJson(t)).toList();
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _toggleHabit(HabitItem habit) async {
    await ApiClient.instance.post(ApiEndpoints.habitToggle(habit.id), {});
    _loadData();
  }

  Future<void> _toggleTask(TaskItem task) async {
    await ApiClient.instance.post(ApiEndpoints.taskToggle(task.id), {});
    _loadData();
  }

  Future<void> _addTask() async {
    final title = _taskController.text.trim();
    if (title.isEmpty) return;
    _taskController.clear();
    await ApiClient.instance.post(ApiEndpoints.tasks, {'title': title, 'priority': 'medium'});
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.bgSurface,
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Habit Tracker Routine Matrix ──────────────────────────────────
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'DAILY HABIT STREAKS',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
              Text(
                'Today',
                style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_habits.isEmpty)
            const GlassCard(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No daily habits configured yet.', style: TextStyle(color: AppColors.textMuted)),
                ),
              ),
            )
          else
            ..._habits.map((h) => GlassCard(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => _toggleHabit(h),
                    icon: Icon(
                      h.completedToday ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                      color: h.completedToday ? AppColors.success : AppColors.textMuted,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          h.name,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            decoration: h.completedToday ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        Text(
                          '${h.category} • ${h.streak} day streak 🔥',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )),

          const SizedBox(height: 20),

          // ── Tasks & Action List ───────────────────────────────────────────
          const Text(
            'TODO & HOMEWORK TASKS',
            style: TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _taskController,
                  decoration: const InputDecoration(
                    hintText: 'Add a new priority task...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onSubmitted: (_) => _addTask(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _addTask,
                style: IconButton.styleFrom(backgroundColor: AppColors.primary),
                icon: const Icon(Icons.add_rounded, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._tasks.map((t) => GlassCard(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Checkbox(
                  value: t.done,
                  activeColor: AppColors.primary,
                  checkColor: Colors.white,
                  onChanged: (_) => _toggleTask(t),
                ),
                Expanded(
                  child: Text(
                    t.title,
                    style: TextStyle(
                      color: t.done ? AppColors.textMuted : AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      decoration: t.done ? TextDecoration.lineThrough : null,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: t.priority == 'high' ? AppColors.danger.withOpacity(0.15) : AppColors.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    t.priority.toUpperCase(),
                    style: TextStyle(
                      color: t.priority == 'high' ? AppColors.danger : AppColors.primaryLight,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
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

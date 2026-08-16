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
  String _taskFilter = 'all'; // 'all', 'high', 'pending', 'completed'
  final TextEditingController _quickTaskController = TextEditingController();

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

  Future<void> _deleteHabit(HabitItem habit) async {
    await ApiClient.instance.delete(ApiEndpoints.habit(habit.id));
    _loadData();
  }

  Future<void> _toggleTask(TaskItem task) async {
    await ApiClient.instance.post(ApiEndpoints.taskToggle(task.id), {});
    _loadData();
  }

  Future<void> _deleteTask(TaskItem task) async {
    await ApiClient.instance.delete(ApiEndpoints.task(task.id));
    _loadData();
  }

  Future<void> _addQuickTask() async {
    final title = _quickTaskController.text.trim();
    if (title.isEmpty) return;
    _quickTaskController.clear();
    await ApiClient.instance.post(ApiEndpoints.tasks, {'title': title, 'priority': 'medium'});
    _loadData();
  }

  // ── Create Habit Modal ────────────────────────────────────────────────────
  void _openCreateHabitModal() {
    final nameController = TextEditingController();
    String selectedCategory = 'Morning Routine';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final bottomInset = MediaQuery.of(context).viewInsets.bottom;
            return Padding(
              padding: EdgeInsets.only(
                left: 18,
                right: 18,
                top: 12,
                bottom: bottomInset + 18,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.borderLight,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Create New Daily Habit',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(labelText: 'Habit Name', hintText: 'e.g. Read 20 pages CS book'),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.bgSurfaceAlt,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedCategory,
                        isExpanded: true,
                        dropdownColor: AppColors.bgSurfaceAlt,
                        items: const [
                          DropdownMenuItem(value: 'Morning Routine', child: Text('Morning Routine')),
                          DropdownMenuItem(value: 'Deep Work', child: Text('Deep Work / Coding')),
                          DropdownMenuItem(value: 'Study & Reading', child: Text('Study & Reading')),
                          DropdownMenuItem(value: 'Health & Fitness', child: Text('Health & Fitness')),
                          DropdownMenuItem(value: 'Night Routine', child: Text('Night Routine')),
                        ],
                        onChanged: (val) {
                          if (val != null) setSheetState(() => selectedCategory = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      final name = nameController.text.trim();
                      if (name.isEmpty) return;
                      Navigator.pop(ctx);
                      await ApiClient.instance.post(ApiEndpoints.habits, {
                        'name': name,
                        'category': selectedCategory,
                        'frequency': 'daily',
                        'target_days': 7,
                      });
                      _loadData();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Start Habit Streak', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // ── Create Task Modal ─────────────────────────────────────────────────────
  void _openCreateTaskModal() {
    final titleController = TextEditingController();
    String selectedPriority = 'medium';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final bottomInset = MediaQuery.of(context).viewInsets.bottom;
            return Padding(
              padding: EdgeInsets.only(
                left: 18,
                right: 18,
                top: 12,
                bottom: bottomInset + 18,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.borderLight,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Add Priority Task',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(labelText: 'Task Title', hintText: 'e.g. Finish Algorithms Homework 3'),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Text('Priority:', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
                      const SizedBox(width: 12),
                      Wrap(
                        spacing: 6,
                        children: [
                          _buildPriorityChip('high', 'High 🔴', selectedPriority, (p) => setSheetState(() => selectedPriority = p)),
                          _buildPriorityChip('medium', 'Med 🟣', selectedPriority, (p) => setSheetState(() => selectedPriority = p)),
                          _buildPriorityChip('low', 'Low 🟢', selectedPriority, (p) => setSheetState(() => selectedPriority = p)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      final title = titleController.text.trim();
                      if (title.isEmpty) return;
                      Navigator.pop(ctx);
                      final today = DateTime.now().toIso8601String().substring(0, 10);
                      await ApiClient.instance.post(ApiEndpoints.tasks, {
                        'title': title,
                        'priority': selectedPriority,
                        'due_date': today,
                      });
                      _loadData();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Add Task', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildPriorityChip(String value, String label, String current, ValueChanged<String> onSelected) {
    final isSelected = current == value;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500)),
      selected: isSelected,
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.bgSurfaceAlt,
      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
      onSelected: (_) => onSelected(value),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    final filteredTasks = _tasks.where((t) {
      if (_taskFilter == 'high') return t.priority.toLowerCase() == 'high';
      if (_taskFilter == 'pending') return !t.done;
      if (_taskFilter == 'completed') return t.done;
      return true;
    }).toList();

    return RefreshIndicator(
      color: AppColors.primary,
      backgroundColor: AppColors.bgSurface,
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Habit Tracker Header ──────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'DAILY HABIT STREAKS',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
              InkWell(
                onTap: _openCreateHabitModal,
                borderRadius: BorderRadius.circular(6),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Text(
                    '+ New Habit',
                    style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (_habits.isEmpty)
            GlassCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(Icons.check_circle_outline_rounded, color: AppColors.textMuted.withAlpha(100), size: 40),
                  const SizedBox(height: 8),
                  const Text('No daily habits configured yet.', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  const Text('Build consistency with daily routine streaks.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _openCreateHabitModal,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                    child: const Text('Add Habit'),
                  ),
                ],
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
                  IconButton(
                    onPressed: () => _deleteHabit(h),
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.textMuted, size: 18),
                  ),
                ],
              ),
            )),

          const SizedBox(height: 24),

          // ── Tasks & Action List Header ────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'TODO & HOMEWORK TASKS',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
              InkWell(
                onTap: _openCreateTaskModal,
                borderRadius: BorderRadius.circular(6),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Text(
                    '+ New Task',
                    style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Task Filter Buttons
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildTaskFilterPill('all', 'All'),
                _buildTaskFilterPill('high', 'High Priority'),
                _buildTaskFilterPill('pending', 'Pending'),
                _buildTaskFilterPill('completed', 'Done'),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Quick Task Input Bar
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _quickTaskController,
                  decoration: const InputDecoration(
                    hintText: 'Add a new priority task...',
                    contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                  onSubmitted: (_) => _addQuickTask(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _addQuickTask,
                style: IconButton.styleFrom(backgroundColor: AppColors.primary),
                icon: const Icon(Icons.add_rounded, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (filteredTasks.isEmpty)
            GlassCard(
              padding: const EdgeInsets.all(20),
              child: Center(
                child: Text('No tasks found in this view.', style: TextStyle(color: AppColors.textMuted.withAlpha(180), fontSize: 13)),
              ),
            )
          else
            ...filteredTasks.map((t) => GlassCard(
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
                      color: t.priority == 'high' ? AppColors.danger.withAlpha(35) : AppColors.primary.withAlpha(35),
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
                  IconButton(
                    onPressed: () => _deleteTask(t),
                    icon: const Icon(Icons.close_rounded, color: AppColors.textMuted, size: 16),
                  ),
                ],
              ),
            )),
        ],
      ),
    );
  }

  Widget _buildTaskFilterPill(String filter, String label) {
    final isSelected = _taskFilter == filter;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        selectedColor: AppColors.primary,
        backgroundColor: AppColors.bgSurfaceAlt,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : AppColors.textSecondary,
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        ),
        side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
        onSelected: (_) => setState(() => _taskFilter = filter),
      ),
    );
  }
}

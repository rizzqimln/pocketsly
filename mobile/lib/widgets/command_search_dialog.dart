import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/network/api_client.dart';
import '../core/network/api_endpoints.dart';
import '../core/models/models.dart';

class CommandSearchDialog extends StatefulWidget {
  final Function(int tabIndex) onNavigate;
  final VoidCallback onOpenProfile;
  final VoidCallback onOpenQuickEntry;

  const CommandSearchDialog({
    super.key,
    required this.onNavigate,
    required this.onOpenProfile,
    required this.onOpenQuickEntry,
  });

  static Future<void> show(
    BuildContext context, {
    required Function(int tabIndex) onNavigate,
    required VoidCallback onOpenProfile,
    required VoidCallback onOpenQuickEntry,
  }) {
    return showDialog(
      context: context,
      builder: (ctx) => CommandSearchDialog(
        onNavigate: onNavigate,
        onOpenProfile: onOpenProfile,
        onOpenQuickEntry: onOpenQuickEntry,
      ),
    );
  }

  @override
  State<CommandSearchDialog> createState() => _CommandSearchDialogState();
}

class _CommandSearchDialogState extends State<CommandSearchDialog> {
  final TextEditingController _queryController = TextEditingController();
  List<TaskItem> _tasks = [];
  List<NoteItem> _notes = [];
  List<ScheduleItem> _schedules = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSearchData();
  }

  Future<void> _fetchSearchData() async {
    try {
      final tRes = await ApiClient.instance.get(ApiEndpoints.tasks);
      final nRes = await ApiClient.instance.get(ApiEndpoints.notes);
      final sRes = await ApiClient.instance.get(ApiEndpoints.schedules);

      if (mounted) {
        if (tRes is List) _tasks = tRes.map((t) => TaskItem.fromJson(t)).toList();
        if (nRes is List) _notes = nRes.map((n) => NoteItem.fromJson(n)).toList();
        if (sRes is List) _schedules = sRes.map((s) => ScheduleItem.fromJson(s)).toList();
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final q = _queryController.text.trim().toLowerCase();

    final matchedTasks = _tasks.where((t) => t.title.toLowerCase().contains(q)).take(3).toList();
    final matchedNotes = _notes.where((n) => n.title.toLowerCase().contains(q) || n.content.toLowerCase().contains(q)).take(3).toList();
    final matchedSchedules = _schedules.where((s) => s.subject.toLowerCase().contains(q) || s.room.toLowerCase().contains(q)).take(3).toList();

    return Dialog(
      backgroundColor: AppColors.bgSurfaceElevated,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: AppColors.border),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Search Input Header
            Row(
              children: [
                const Icon(Icons.search_rounded, color: AppColors.primaryLight, size: 22),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _queryController,
                    autofocus: true,
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
                    decoration: const InputDecoration(
                      hintText: 'Search tasks, notes, courses, actions...',
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
                if (_queryController.text.isNotEmpty)
                  IconButton(
                    onPressed: () => setState(() => _queryController.clear()),
                    icon: const Icon(Icons.clear_rounded, size: 18, color: AppColors.textMuted),
                  ),
              ],
            ),
            const Divider(color: AppColors.border, height: 20),

            // Search Content / Quick Actions
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 380),
              child: _isLoading
                  ? const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator(color: AppColors.primaryLight)))
                  : SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // ── Quick Actions ─────────────────────────────────
                          const Text('QUICK ACTIONS', style: TextStyle(color: AppColors.textMuted, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                          const SizedBox(height: 6),
                          _buildActionTile(Icons.add_circle_outline_rounded, 'Log Income or Expense', AppColors.success, () {
                            Navigator.pop(context);
                            widget.onOpenQuickEntry();
                          }),
                          _buildActionTile(Icons.check_circle_outline_rounded, 'Open Habits & Daily Routines', AppColors.primaryLight, () {
                            Navigator.pop(context);
                            widget.onNavigate(1);
                          }),
                          _buildActionTile(Icons.school_outlined, 'Open CS Curriculum & Labs', AppColors.cyan, () {
                            Navigator.pop(context);
                            widget.onNavigate(4);
                          }),
                          _buildActionTile(Icons.settings_outlined, 'Server Configuration & Profile', AppColors.warning, () {
                            Navigator.pop(context);
                            widget.onOpenProfile();
                          }),

                          // ── Matched Tasks ─────────────────────────────────
                          if (matchedTasks.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            const Text('TASKS', style: TextStyle(color: AppColors.textMuted, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                            const SizedBox(height: 6),
                            ...matchedTasks.map((t) => _buildResultTile(Icons.checklist_rounded, t.title, t.priority.toUpperCase(), AppColors.primaryLight, () {
                              Navigator.pop(context);
                              widget.onNavigate(1);
                            })),
                          ],

                          // ── Matched Notes ─────────────────────────────────
                          if (matchedNotes.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            const Text('NOTES & REFLECTIONS', style: TextStyle(color: AppColors.textMuted, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                            const SizedBox(height: 6),
                            ...matchedNotes.map((n) => _buildResultTile(Icons.edit_note_rounded, n.title, n.mood, AppColors.indigo, () {
                              Navigator.pop(context);
                              widget.onNavigate(3);
                            })),
                          ],

                          // ── Matched Timetable ─────────────────────────────
                          if (matchedSchedules.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            const Text('CLASSES & SCHEDULE', style: TextStyle(color: AppColors.textMuted, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
                            const SizedBox(height: 6),
                            ...matchedSchedules.map((s) => _buildResultTile(Icons.event_note_rounded, s.subject, '${s.day} ${s.time}', AppColors.orange, () {
                              Navigator.pop(context);
                              widget.onNavigate(2);
                            })),
                          ],
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTile(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: color.withAlpha(30), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700))),
            const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildResultTile(IconData icon, String title, String subtitle, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 8),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: color.withAlpha(30), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                  Text(subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10.5)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

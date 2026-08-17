import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';

class ScheduleView extends StatefulWidget {
  const ScheduleView({super.key});

  @override
  State<ScheduleView> createState() => _ScheduleViewState();
}

class _ScheduleViewState extends State<ScheduleView> {
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  String _selectedDay = 'Monday';
  bool _isLoading = true;
  List<ScheduleItem> _schedules = [];

  @override
  void initState() {
    super.initState();
    _loadSchedule();
  }

  Future<void> _loadSchedule() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.instance.get(ApiEndpoints.schedules);
      if (mounted && res is List) {
        _schedules = res.map((s) => ScheduleItem.fromJson(s)).toList();
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _deleteSchedule(ScheduleItem item) async {
    await ApiClient.instance.delete(ApiEndpoints.schedule(item.id));
    _loadSchedule();
  }

  // ── Add Class / Event Modal ───────────────────────────────────────────────
  void _openAddScheduleModal() {
    final subjectController = TextEditingController();
    final timeController = TextEditingController(text: '08:00 - 10:00');
    final roomController = TextEditingController();
    final lecturerController = TextEditingController();
    String day = _selectedDay;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
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
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.borderLight,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Add Class / Lecture to Timetable',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: subjectController,
                    decoration: const InputDecoration(labelText: 'Subject / Course Name', hintText: 'e.g. Data Structures & Algorithms'),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppColors.bgSurfaceAlt,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: day,
                              isExpanded: true,
                              dropdownColor: AppColors.bgSurfaceAlt,
                              items: _days.map((d) => DropdownMenuItem(value: d, child: Text(d, style: const TextStyle(fontSize: 13)))).toList(),
                              onChanged: (val) {
                                if (val != null) setSheetState(() => day = val);
                              },
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: timeController,
                          decoration: const InputDecoration(labelText: 'Time Slot', hintText: '08:00 - 10:00'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: roomController,
                    decoration: const InputDecoration(labelText: 'Room / Venue (Optional)', hintText: 'e.g. Lab 304 or Zoom'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: lecturerController,
                    decoration: const InputDecoration(labelText: 'Lecturer / Professor (Optional)', hintText: 'e.g. Dr. Alan Turing'),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      final subj = subjectController.text.trim();
                      if (subj.isEmpty) return;
                      Navigator.pop(ctx);

                      final timeParts = timeController.text.split('-');
                      final startTime = timeParts.isNotEmpty ? timeParts[0].trim() : '08:00';
                      final endTime = timeParts.length > 1 ? timeParts[1].trim() : '10:00';
                      final dayMap = {
                        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
                        'Friday': 4, 'Saturday': 5, 'Sunday': 6,
                      };
                      final dayIdx = dayMap[day] ?? 1;

                      await ApiClient.instance.post(ApiEndpoints.schedules, {
                        'title': subj,
                        'subject': subj,
                        'day': day,
                        'day_of_week': dayIdx,
                        'time': timeController.text.trim(),
                        'start_time': startTime,
                        'end_time': endTime,
                        'room': roomController.text.trim(),
                        'location': roomController.text.trim(),
                        'lecturer': lecturerController.text.trim(),
                      });
                      _loadSchedule();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Add Lecture to Schedule', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _schedules.where((s) => s.day.toLowerCase() == _selectedDay.toLowerCase()).toList();

    return Column(
      children: [
        // ── Day Selector Horizontal Scroll ──────────────────────────────────
        Container(
          height: 44,
          margin: const EdgeInsets.symmetric(vertical: 8),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            itemCount: _days.length,
            itemBuilder: (context, index) {
              final d = _days[index];
              final isSelected = d == _selectedDay;
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text(d),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.bgSurfaceAlt,
                  side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                    fontSize: 11.5,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                  ),
                  onSelected: (_) => setState(() => _selectedDay = d),
                ),
              );
            },
          ),
        ),

        // ── Header Bar ──────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$_selectedDay Schedule'.toUpperCase(),
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
              ),
              InkWell(
                onTap: _openAddScheduleModal,
                borderRadius: BorderRadius.circular(6),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Text(
                    '+ Add Lecture',
                    style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── Schedule List ───────────────────────────────────────────────────
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primaryLight))
              : RefreshIndicator(
                  color: AppColors.primaryLight,
                  onRefresh: _loadSchedule,
                  child: filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.event_busy_rounded, color: AppColors.textMuted.withAlpha(120), size: 48),
                              const SizedBox(height: 12),
                              Text(
                                'No lectures scheduled on $_selectedDay',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                              ),
                              const SizedBox(height: 14),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  ElevatedButton.icon(
                                    onPressed: _openAddScheduleModal,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    icon: const Icon(Icons.add_rounded, size: 16),
                                    label: const Text('Add Lecture', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                                  ),
                                  if (ApiClient.instance.currentUser == null) ...[
                                    const SizedBox(width: 8),
                                    OutlinedButton.icon(
                                      onPressed: () async {
                                        await ApiClient.instance.loginAsDemoUser();
                                        _loadSchedule();
                                      },
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(color: AppColors.primaryLight),
                                        foregroundColor: AppColors.primaryLight,
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      icon: const Icon(Icons.auto_awesome_rounded, size: 16),
                                      label: const Text('Try Demo', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) {
                            final item = filtered[index];
                            return GlassCard(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(16),
                              borderRadius: 18,
                              child: Row(
                                children: [
                                  Container(
                                    width: 4,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      gradient: AppColors.primaryGradient,
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.subject,
                                          style: const TextStyle(
                                            color: AppColors.textPrimary,
                                            fontSize: 15,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${item.time} • Room: ${item.room.isEmpty ? "Online" : item.room}',
                                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                        ),
                                        if (item.lecturer.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            'Lecturer: ${item.lecturer}',
                                            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withAlpha(30),
                                      borderRadius: BorderRadius.circular(99),
                                      border: Border.all(color: AppColors.primaryLight.withAlpha(50)),
                                    ),
                                    child: Text(
                                      item.room.isNotEmpty ? item.room : 'Online',
                                      style: const TextStyle(color: AppColors.primaryLight, fontSize: 10, fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  IconButton(
                                    onPressed: () => _deleteSchedule(item),
                                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.textMuted, size: 18),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
        ),
      ],
    );
  }
}

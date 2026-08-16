import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../widgets/glass_card.dart';

class CoursesManagerView extends StatefulWidget {
  const CoursesManagerView({super.key});

  @override
  State<CoursesManagerView> createState() => _CoursesManagerViewState();
}

class _CoursesManagerViewState extends State<CoursesManagerView> {
  bool _isLoading = true;
  List<CourseItem> _courses = [];
  List<StudyLogItem> _studyLogs = [];

  @override
  void initState() {
    super.initState();
    _loadCoursesAndLogs();
  }

  Future<void> _loadCoursesAndLogs() async {
    setState(() => _isLoading = true);
    try {
      final cRes = await ApiClient.instance.get(ApiEndpoints.courses);
      final sRes = await ApiClient.instance.get(ApiEndpoints.studyLogs);

      if (mounted) {
        if (cRes is List) {
          _courses = cRes.map((c) => CourseItem.fromJson(c)).toList();
        }
        if (sRes is List) {
          _studyLogs = sRes.map((s) => StudyLogItem.fromJson(s)).toList();
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  void _openAddCourseModal() {
    final titleController = TextEditingController();
    final codeController = TextEditingController();
    final creditsController = TextEditingController(text: '3');
    final lecturerController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (ctx) {
        final bottomInset = MediaQuery.of(context).viewInsets.bottom;
        return Padding(
          padding: EdgeInsets.only(left: 18, right: 18, top: 12, bottom: bottomInset + 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(width: 44, height: 4, decoration: BoxDecoration(color: AppColors.borderLight, borderRadius: BorderRadius.circular(99))),
              ),
              const SizedBox(height: 14),
              const Text('Add Academic Course / Subject', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Course Title', hintText: 'e.g. Distributed Systems')),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: TextField(controller: codeController, decoration: const InputDecoration(labelText: 'Code', hintText: 'CS-401'))),
                  const SizedBox(width: 8),
                  Expanded(child: TextField(controller: creditsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Credits SKS', hintText: '3'))),
                ],
              ),
              const SizedBox(height: 10),
              TextField(controller: lecturerController, decoration: const InputDecoration(labelText: 'Lecturer / Professor', hintText: 'Dr. Leslie Lamport')),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  final title = titleController.text.trim();
                  if (title.isEmpty) return;
                  Navigator.pop(ctx);
                  await ApiClient.instance.post(ApiEndpoints.courses, {
                    'name': title,
                    'title': title,
                    'code': codeController.text.trim(),
                    'credits': int.tryParse(creditsController.text) ?? 3,
                    'lecturer': lecturerController.text.trim(),
                  });
                  _loadCoursesAndLogs();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Add Course', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openLogStudyModal() {
    int? selectedCourseId = _courses.isNotEmpty ? _courses.first.id : null;
    final hoursController = TextEditingController(text: '2.0');
    final topicController = TextEditingController();

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
              padding: EdgeInsets.only(left: 18, right: 18, top: 12, bottom: bottomInset + 18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(width: 44, height: 4, decoration: BoxDecoration(color: AppColors.borderLight, borderRadius: BorderRadius.circular(99))),
                  ),
                  const SizedBox(height: 14),
                  const Text('Log Study Session Hours', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  if (_courses.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.bgSurfaceAlt, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int>(
                          value: selectedCourseId,
                          isExpanded: true,
                          dropdownColor: AppColors.bgSurfaceAlt,
                          items: _courses.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name, style: const TextStyle(fontSize: 13)))).toList(),
                          onChanged: (val) {
                            if (val != null) setSheetState(() => selectedCourseId = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                  TextField(controller: hoursController, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Study Duration (Hours)', hintText: '2.0')),
                  const SizedBox(height: 10),
                  TextField(controller: topicController, decoration: const InputDecoration(labelText: 'Topic / Material Covered', hintText: 'Raft Consensus Algorithm & Paper Review')),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      final hours = double.tryParse(hoursController.text) ?? 1.0;
                      Navigator.pop(ctx);
                      final today = DateTime.now().toIso8601String().substring(0, 10);
                      await ApiClient.instance.post(ApiEndpoints.studyLogs, {
                        'course_id': selectedCourseId,
                        'hours': hours,
                        'notes': topicController.text.trim(),
                        'date': today,
                      });
                      _loadCoursesAndLogs();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Save Study Log', style: TextStyle(fontWeight: FontWeight.w800)),
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
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryLight));
    }

    final totalHours = _studyLogs.fold(0.0, (acc, cur) => acc + cur.hours);
    final totalCredits = _courses.fold(0, (acc, cur) => acc + cur.credits);

    return RefreshIndicator(
      color: AppColors.primaryLight,
      onRefresh: _loadCoursesAndLogs,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Academic Overview Strip ───────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  borderRadius: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Courses', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${_courses.length} ($totalCredits SKS)', style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  borderRadius: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Study Time Logged', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${totalHours.toStringAsFixed(1)} hrs', style: const TextStyle(color: AppColors.primaryLight, fontSize: 16, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ── Courses Section Header ────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('ACTIVE COURSES & CURRICULUM', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
              InkWell(
                onTap: _openAddCourseModal,
                child: const Text('+ Add Course', style: TextStyle(color: AppColors.primaryLight, fontSize: 12, fontWeight: FontWeight.w800)),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (_courses.isEmpty)
            GlassCard(
              padding: const EdgeInsets.all(24),
              borderRadius: 18,
              child: Column(
                children: [
                  const Icon(Icons.school_outlined, size: 36, color: AppColors.textMuted),
                  const SizedBox(height: 8),
                  const Text('No courses enrolled yet.', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  ElevatedButton(onPressed: _openAddCourseModal, child: const Text('Add First Course')),
                ],
              ),
            )
          else
            ..._courses.map((c) => GlassCard(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              borderRadius: 16,
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(color: AppColors.primary.withAlpha(30), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.menu_book_rounded, color: AppColors.primaryLight, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(c.name, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14)),
                        Text('${c.code.isNotEmpty ? "${c.code} • " : ""}${c.credits} SKS${c.lecturer.isNotEmpty ? " • ${c.lecturer}" : ""}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11.5)),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () async {
                      await ApiClient.instance.delete(ApiEndpoints.course(c.id));
                      _loadCoursesAndLogs();
                    },
                    icon: const Icon(Icons.delete_outline_rounded, color: AppColors.textMuted, size: 18),
                  ),
                ],
              ),
            )),

          const SizedBox(height: 20),

          // ── Study Session Logs Header ─────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('STUDY SESSION LOGS', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
              InkWell(
                onTap: _openLogStudyModal,
                child: const Text('+ Log Hours', style: TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.w800)),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (_studyLogs.isEmpty)
            const GlassCard(
              padding: EdgeInsets.all(20),
              borderRadius: 16,
              child: Center(child: Text('No study sessions logged yet.', style: TextStyle(color: AppColors.textMuted, fontSize: 12))),
            )
          else
            ..._studyLogs.map((s) => GlassCard(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              borderRadius: 16,
              child: Row(
                children: [
                  const Icon(Icons.timer_outlined, color: AppColors.success, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s.courseName.isNotEmpty ? s.courseName : 'Independent Study', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 13.5)),
                        Text('${s.date} • ${s.notes.isNotEmpty ? s.notes : "Focus session"}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      ],
                    ),
                  ),
                  Text('${s.hours}h', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w800, fontSize: 14)),
                ],
              ),
            )),
        ],
      ),
    );
  }
}

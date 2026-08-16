import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../widgets/glass_card.dart';

class AcademicFacultyView extends StatefulWidget {
  const AcademicFacultyView({super.key});

  @override
  State<AcademicFacultyView> createState() => _AcademicFacultyViewState();
}

class _AcademicFacultyViewState extends State<AcademicFacultyView> {
  bool _isLoading = true;
  List<dynamic> _courses = [];
  List<dynamic> _lecturers = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final cRes = await ApiClient.instance.get(ApiEndpoints.courses);
      final lRes = await ApiClient.instance.get(ApiEndpoints.lecturers);
      if (mounted) {
        if (cRes is List) _courses = cRes;
        if (lRes is List) _lecturers = lRes;
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  void _openAddCourseModal() {
    final codeController = TextEditingController();
    final nameController = TextEditingController();
    final creditsController = TextEditingController(text: '3');
    final lecturerController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      builder: (ctx) {
        final bottomInset = MediaQuery.of(ctx).viewInsets.bottom;
        return Padding(
          padding: EdgeInsets.only(left: 18, right: 18, top: 12, bottom: bottomInset + 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.borderLight, borderRadius: BorderRadius.circular(99))),
              ),
              const SizedBox(height: 12),
              const Text('Add Academic Course', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              TextField(controller: codeController, decoration: const InputDecoration(labelText: 'Course Code', hintText: 'e.g. CS201')),
              const SizedBox(height: 8),
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Course Name', hintText: 'e.g. Data Structures & Algorithms')),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: TextField(controller: creditsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Credits (SKS)'))),
                  const SizedBox(width: 8),
                  Expanded(child: TextField(controller: lecturerController, decoration: const InputDecoration(labelText: 'Lecturer Name'))),
                ],
              ),
              const SizedBox(height: 14),
              ElevatedButton(
                onPressed: () async {
                  final name = nameController.text.trim();
                  if (name.isEmpty) return;
                  Navigator.pop(ctx);
                  await ApiClient.instance.post(ApiEndpoints.courses, {
                    'code': codeController.text.trim(),
                    'name': name,
                    'credits': int.tryParse(creditsController.text) ?? 3,
                    'lecturer': lecturerController.text.trim(),
                  });
                  _loadData();
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                child: const Text('Add Course', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openAddLecturerModal() {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final officeController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      builder: (ctx) {
        final bottomInset = MediaQuery.of(ctx).viewInsets.bottom;
        return Padding(
          padding: EdgeInsets.only(left: 18, right: 18, top: 12, bottom: bottomInset + 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.borderLight, borderRadius: BorderRadius.circular(99))),
              ),
              const SizedBox(height: 12),
              const Text('Add Faculty Lecturer', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Lecturer Full Name', hintText: 'e.g. Prof. Donald Knuth')),
              const SizedBox(height: 8),
              TextField(controller: emailController, decoration: const InputDecoration(labelText: 'Email Address', hintText: 'knuth@university.edu')),
              const SizedBox(height: 8),
              TextField(controller: officeController, decoration: const InputDecoration(labelText: 'Office Location / Hours', hintText: 'Building B, Room 402')),
              const SizedBox(height: 14),
              ElevatedButton(
                onPressed: () async {
                  final name = nameController.text.trim();
                  if (name.isEmpty) return;
                  Navigator.pop(ctx);
                  await ApiClient.instance.post(ApiEndpoints.lecturers, {
                    'name': name,
                    'email': emailController.text.trim(),
                    'office': officeController.text.trim(),
                  });
                  _loadData();
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                child: const Text('Add Lecturer', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Courses Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'REGISTERED ACADEMIC COURSES',
                style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
              ),
              InkWell(
                onTap: _openAddCourseModal,
                child: const Text('+ Add Course', style: TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_courses.isEmpty)
            const GlassCard(child: Text('No courses registered.', style: TextStyle(color: AppColors.textMuted)))
          else
            ..._courses.map((c) => GlassCard(
              margin: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${c["code"] ?? ""} - ${c["name"] ?? ""}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      Text('${c["credits"] ?? 3} SKS (Credits) • ${c["lecturer"] ?? "Department"}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.primary.withAlpha(40), borderRadius: BorderRadius.circular(6)),
                    child: const Text('Active', style: TextStyle(color: AppColors.primaryLight, fontSize: 10, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            )),

          const SizedBox(height: 20),

          // Lecturers Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'FACULTY & LECTURERS',
                style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
              ),
              InkWell(
                onTap: _openAddLecturerModal,
                child: const Text('+ Add Lecturer', style: TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_lecturers.isEmpty)
            const GlassCard(child: Text('No lecturers recorded.', style: TextStyle(color: AppColors.textMuted)))
          else
            ..._lecturers.map((l) => GlassCard(
              margin: const EdgeInsets.only(bottom: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l['name'] ?? 'Lecturer', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text('${l["email"] ?? "No Email"} • Office: ${l["office"] ?? "N/A"}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            )),
        ],
      ),
    );
  }
}

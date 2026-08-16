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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'REGISTERED ACADEMIC COURSES',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
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
                    Text('${c["credits"] ?? 3} SKS (Credits)', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                  child: const Text('Active', style: TextStyle(color: AppColors.primaryLight, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          )),

        const SizedBox(height: 20),
        const Text(
          'FACULTY & LECTURERS',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
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
    );
  }
}

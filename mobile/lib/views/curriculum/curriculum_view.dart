import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../widgets/glass_card.dart';

class CurriculumView extends StatefulWidget {
  const CurriculumView({super.key});

  @override
  State<CurriculumView> createState() => _CurriculumViewState();
}

class _CurriculumViewState extends State<CurriculumView> {
  final TextEditingController _sqlController = TextEditingController(text: "SELECT * FROM tasks LIMIT 5;");
  String _sqlResult = "Ready to execute SQL query on serverless D1...";
  bool _isExecutingSql = false;

  Future<void> _runSQL() async {
    final query = _sqlController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isExecutingSql = true;
      _sqlResult = "Executing query at Cloudflare Edge...";
    });

    try {
      final res = await ApiClient.instance.post(ApiEndpoints.curriculumQuery, {'query': query});
      if (mounted) {
        if (res['error'] != null) {
          setState(() => _sqlResult = "Error:\n${res['error']}");
        } else if (res['rows'] is List && (res['rows'] as List).isNotEmpty) {
          final rows = res['rows'] as List;
          setState(() => _sqlResult = "Success (${rows.length} rows):\n${rows.join('\n')}");
        } else {
          setState(() => _sqlResult = "Query executed successfully. 0 rows returned.");
        }
      }
    } catch (e) {
      if (mounted) setState(() => _sqlResult = "Network failure: $e");
    } finally {
      if (mounted) setState(() => _isExecutingSql = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── Catalog Header ───────────────────────────────────────────────────
        const Text(
          'CS CURRICULUM & INTERACTIVE LABS',
          style: TextStyle(
            color: AppColors.textMuted,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 12),

        // ── 1. Live Cloudflare D1 SQL Sandbox ────────────────────────────────
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.storage_rounded, color: AppColors.primaryLight, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Relational Database (SQL) Sandbox',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Executes live SQL queries on your serverless Cloudflare D1 database.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _sqlController,
                maxLines: 3,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 13, color: AppColors.textPrimary),
                decoration: const InputDecoration(
                  hintText: 'Enter SQL (e.g. SELECT * FROM habits;)',
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Wrap(
                    spacing: 6,
                    children: [
                      _buildPresetSql('tasks', 'SELECT * FROM tasks LIMIT 5;'),
                      _buildPresetSql('habits', 'SELECT * FROM habits;'),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: _isExecutingSql ? null : _runSQL,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                    icon: _isExecutingSql
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.play_arrow_rounded, size: 16),
                    label: const Text('Run SQL', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.bgMain,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  _sqlResult,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // ── 2. DSA Sorting Visualizer Card ──────────────────────────────────
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.bar_chart_rounded, color: AppColors.info, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Data Structures & Algorithm Visualizer',
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Interactive Bubble Sort & Quick Sort step tracer with O(n log n) analysis.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 12),
              Container(
                height: 80,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.bgMain,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _buildBar(40, AppColors.primary),
                    _buildBar(70, AppColors.primaryLight),
                    _buildBar(25, AppColors.success),
                    _buildBar(60, AppColors.primary),
                    _buildBar(90, AppColors.info),
                    _buildBar(35, AppColors.warning),
                    _buildBar(80, AppColors.primaryLight),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPresetSql(String label, String query) {
    return InkWell(
      onTap: () => _sqlController.text = query,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.bgSurfaceAlt,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppColors.border),
        ),
        child: Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
      ),
    );
  }

  Widget _buildBar(double height, Color color) {
    return Container(
      width: 16,
      height: height,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

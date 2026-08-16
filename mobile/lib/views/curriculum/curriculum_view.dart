import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import 'academic_faculty_view.dart';
import 'performance_analytics_view.dart';
import 'backend_inspector_view.dart';
import 'flexbox_sandbox_view.dart';
import 'regex_validator_view.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../widgets/glass_card.dart';

class CurriculumView extends StatefulWidget {
  const CurriculumView({super.key});

  @override
  State<CurriculumView> createState() => _CurriculumViewState();
}

class _CurriculumViewState extends State<CurriculumView> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<String> _tabs = [
    'SQL D1 Sandbox',
    'Backend API Flow',
    'CSS Flexbox',
    'Regex Validator',
    'Academic Faculty',
    'Velocity & GPA',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Sub-navigation horizontal scroll tabs ────────────────────────────
        Container(
          height: 48,
          margin: const EdgeInsets.only(top: 8),
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorSize: TabBarIndicatorSize.tab,
            indicator: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(10),
            ),
            labelColor: Colors.white,
            unselectedLabelColor: AppColors.textSecondary,
            dividerColor: Colors.transparent,
            tabs: _tabs.map((t) => Tab(text: t)).toList(),
          ),
        ),

        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildSqlSandboxTab(),
              const BackendInspectorView(),
              const FlexboxSandboxView(),
              const RegexValidatorView(),
              const AcademicFacultyView(),
              const PerformanceAnalyticsView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSqlSandboxTab() {
    return const _SqlD1SandboxComponent();
  }
}

class _SqlD1SandboxComponent extends StatefulWidget {
  const _SqlD1SandboxComponent();

  @override
  State<_SqlD1SandboxComponent> createState() => _SqlD1SandboxComponentState();
}

class _SqlD1SandboxComponentState extends State<_SqlD1SandboxComponent> {
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
        if (res is Map && res['error'] != null) {
          setState(() => _sqlResult = "Error:\n${res['error']}");
        } else if (res is Map && res['rows'] is List && (res['rows'] as List).isNotEmpty) {
          final rows = res['rows'] as List;
          setState(() => _sqlResult = "Success (${rows.length} rows returned):\n${rows.join('\n')}");
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
        const Text(
          'SERVERLESS CLOUDFLARE D1 (SQL) SANDBOX',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Executes live queries against Cloudflare D1 Serverless SQLite Edge DB.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _sqlController,
                maxLines: 3,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 13, color: AppColors.textPrimary),
                decoration: const InputDecoration(hintText: 'Enter SQL query...'),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Wrap(
                    spacing: 6,
                    children: [
                      _buildPreset('tasks', 'SELECT * FROM tasks LIMIT 5;'),
                      _buildPreset('habits', 'SELECT * FROM habits;'),
                      _buildPreset('budgets', 'SELECT * FROM budgets;'),
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
                    label: const Text('Run', style: TextStyle(fontWeight: FontWeight.w700)),
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
      ],
    );
  }

  Widget _buildPreset(String label, String q) {
    return InkWell(
      onTap: () => _sqlController.text = q,
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
}

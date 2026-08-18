import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/design_system.dart';
import 'interactive_quiz_view.dart';
import 'sorting_visualizer_view.dart';
import 'courses_manager_view.dart';
import 'academic_faculty_view.dart';
import 'backend_inspector_view.dart';
import 'flexbox_sandbox_view.dart';
import 'regex_validator_view.dart';
import 'performance_analytics_view.dart';
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

  // Labels WITHOUT emoji (moved to content headers for a11y)
  final List<String> _tabs = [
    'CS Quizzer',
    'Sort Visualizer',
    'Courses & Study',
    'SQL D1 Sandbox',
    'Backend API Flow',
    'CSS Flexbox',
    'Regex Validator',
    'Academic Faculty',
    'Performance',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Sub-navigation horizontal scroll tabs ────────────────────────────
        Container(
          height: 48,
          margin: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.xs),
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorSize: TabBarIndicatorSize.tab,
            indicator: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            labelColor: Colors.white,
            unselectedLabelColor: AppSemanticColors.textMuted,
            dividerColor: Colors.transparent,
            labelStyle: AppTypography.button,
            unselectedLabelStyle: AppTypography.button.copyWith(
              color: AppSemanticColors.textMuted,
            ),
            tabs: _tabs.map((t) => Tab(text: t)).toList(),
          ),
        ),

        Expanded(
          // Keep alive so quiz progress, SQL results, sort animations persist
          child: TabBarView(
            controller: _tabController,
            children: [
              _KeepAliveWrapper(child: const InteractiveQuizView()),
              _KeepAliveWrapper(child: const SortingVisualizerView()),
              _KeepAliveWrapper(child: const CoursesManagerView()),
              _KeepAliveWrapper(child: const _SqlD1SandboxComponent()),
              _KeepAliveWrapper(child: const BackendInspectorView()),
              _KeepAliveWrapper(child: const FlexboxSandboxView()),
              _KeepAliveWrapper(child: const RegexValidatorView()),
              _KeepAliveWrapper(child: const AcademicFacultyView()),
              _KeepAliveWrapper(child: const PerformanceAnalyticsView()),
            ],
          ),
        ),
      ],
    );
  }
}

/// Wrapper to preserve state when tabs are off-screen
class _KeepAliveWrapper extends StatefulWidget {
  final Widget child;
  const _KeepAliveWrapper({required this.child});

  @override
  State<_KeepAliveWrapper> createState() => _KeepAliveWrapperState();
}

class _KeepAliveWrapperState extends State<_KeepAliveWrapper> with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin
    return widget.child;
  }
}

class _SqlD1SandboxComponent extends StatefulWidget {
  const _SqlD1SandboxComponent();

  @override
  State<_SqlD1SandboxComponent> createState() => _SqlD1SandboxComponentState();
}

class _SqlD1SandboxComponentState extends State<_SqlD1SandboxComponent> {
  final TextEditingController _sqlController = TextEditingController(text: 'SELECT * FROM tasks LIMIT 5;');
  String _sqlResult = 'Ready to execute SQL query on serverless D1...';
  bool _isExecutingSql = false;

  Future<void> _runSQL() async {
    final query = _sqlController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isExecutingSql = true;
      _sqlResult = 'Executing query at Cloudflare Edge...';
    });

    try {
      final res = await ApiClient.instance.post(ApiEndpoints.curriculumQuery, {'query': query});
      if (mounted) {
        if (res is Map && res['error'] != null) {
          setState(() => _sqlResult = 'Error:\n${res['error']}');
        } else if (res is Map && res['rows'] is List && (res['rows'] as List).isNotEmpty) {
          final rows = res['rows'] as List;
          setState(() => _sqlResult = 'Success (${rows.length} rows returned):\n${rows.join('\n')}');
        } else {
          setState(() => _sqlResult = 'Query executed successfully. 0 rows returned.');
        }
      }
    } catch (e) {
      if (mounted) setState(() => _sqlResult = 'Network failure: $e');
    } finally {
      if (mounted) setState(() => _isExecutingSql = false);
    }
  }

  @override
  void dispose() {
    _sqlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screenPadding),
      children: [
        Text(
          'SERVERLESS CLOUDFLARE D1 (SQL) SANDBOX',
          style: AppTypography.overline.copyWith(color: AppSemanticColors.textMuted),
        ),
        const SizedBox(height: AppSpacing.xs),
        GlassCard(
          borderRadius: AppSpacing.radiusLg,
          padding: const EdgeInsets.all(AppSpacing.cardPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Executes live queries against Cloudflare D1 Serverless SQLite Edge DB.',
                style: AppTypography.bodySmall.copyWith(color: AppSemanticColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.md),

              // SQL Editor
              TextField(
                controller: _sqlController,
                maxLines: 3,
                style: AppTypography.mono.copyWith(color: AppSemanticColors.textPrimary),
                decoration: AppInputStyles.base(
                  label: 'SQL Query',
                  hint: 'Enter SQL query...',
                  prefixIcon: Icon(Icons.code, size: 20, color: AppSemanticColors.textMuted),
                ).copyWith(
                  alignLabelWithHint: true,
                  contentPadding: const EdgeInsets.all(AppSpacing.md),
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // Preset Chips (Material for ripple, 48px touch target)
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.sm,
                children: [
                  _buildPresetChip('tasks', 'SELECT * FROM tasks LIMIT 5;'),
                  _buildPresetChip('habits', 'SELECT * FROM habits;'),
                  _buildPresetChip('budgets', 'SELECT * FROM budgets;'),
                  _buildPresetChip('events', 'SELECT * FROM events;'),
                  _buildPresetChip('notes', 'SELECT * FROM notes;'),
                ],
              ),
              const SizedBox(height: AppSpacing.md),

              // Run Button
              SizedBox(
                width: double.infinity,
                height: AppSpacing.minTouchTarget,
                child: ElevatedButton.icon(
                  onPressed: _isExecutingSql ? null : _runSQL,
                  style: AppButtonStyles.primary(),
                  icon: _isExecutingSql
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.play_arrow_rounded, size: 18),
                  label: Text(_isExecutingSql ? 'Running...' : 'Run Query'),
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // Result Output
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppSemanticColors.bgMain,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                  border: Border.all(color: AppSemanticColors.border, width: 1),
                ),
                child: SelectableText(
                  _sqlResult,
                  style: AppTypography.mono.copyWith(
                    color: AppSemanticColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Material-wrapped preset chip with 48px touch target and ripple
  Widget _buildPresetChip(String label, String query) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _sqlController.text = query,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xs,
          ),
          constraints: const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          decoration: BoxDecoration(
            color: AppSemanticColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: AppSemanticColors.border, width: 1),
          ),
          child: Center(
            child: Text(
              label,
              style: AppTypography.caption.copyWith(
                color: AppColors.primaryLight,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
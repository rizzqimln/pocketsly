import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/design_system.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/kpi_card.dart';

class PerformanceAnalyticsView extends StatefulWidget {
  const PerformanceAnalyticsView({super.key});

  @override
  State<PerformanceAnalyticsView> createState() => _PerformanceAnalyticsViewState();
}

class _PerformanceAnalyticsViewState extends State<PerformanceAnalyticsView> {
  final double _currentGpa = 3.75;
  double _targetGpa = 3.85;
  final double _currentCredits = 64;
  final double _nextSemesterCredits = 20;

  double get _requiredNextGpa {
    final totalTargetPoints = _targetGpa * (_currentCredits + _nextSemesterCredits);
    final currentPoints = _currentGpa * _currentCredits;
    final requiredPoints = totalTargetPoints - currentPoints;
    return (requiredPoints / _nextSemesterCredits).clamp(0.0, 4.0);
  }

  @override
  Widget build(BuildContext context) {
    final canAchieve = _requiredNextGpa <= 4.0;
    final statusColor = canAchieve ? AppSemanticColors.success : AppSemanticColors.danger;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screenPadding),
      children: [
        Text(
          'STUDY VELOCITY & ACADEMIC KPIS',
          style: AppTypography.overline.copyWith(color: AppSemanticColors.textMuted),
        ),
        const SizedBox(height: AppSpacing.md),

        Row(
          children: [
            Expanded(
              child: KpiCard(
                title: 'Weekly Focus',
                value: '24.5 hrs',
                subtitle: '+12% vs last week',
                icon: Icons.timer_outlined,
                iconColor: AppColors.primaryLight,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: KpiCard(
                title: 'Cumulative GPA',
                value: '3.75 / 4.0',
                subtitle: "Dean's Honor List",
                icon: Icons.school_outlined,
                iconColor: AppSemanticColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),

        // ── GPA Target Simulator ─────────────────────────────────────────────
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.calculate_outlined, color: AppSemanticColors.warning, size: 20),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    'GPA Target Simulator',
                    style: AppTypography.subheading.copyWith(color: AppSemanticColors.textPrimary),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Current GPA: ${_currentGpa.toStringAsFixed(2)} (${_currentCredits.toInt()} Credits earned)',
                style: AppTypography.bodySmall.copyWith(color: AppSemanticColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.md),
              Slider(
                value: _targetGpa,
                min: 3.0,
                max: 4.0,
                divisions: 20,
                activeColor: AppSemanticColors.primary,
                label: _targetGpa.toStringAsFixed(2),
                onChanged: (val) => setState(() => _targetGpa = val),
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Target GPA: ${_targetGpa.toStringAsFixed(2)}',
                    style: AppTypography.bodyLarge.copyWith(
                      color: AppSemanticColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withAlpha(35),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                    ),
                    child: Text(
                      'Need ${_requiredNextGpa.toStringAsFixed(2)} GPA next semester',
                      style: AppTypography.caption.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
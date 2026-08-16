import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
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
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'STUDY VELOCITY & ACADEMIC KPIS',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        const Row(
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
            SizedBox(width: 8),
            Expanded(
              child: KpiCard(
                title: 'Cumulative GPA',
                value: '3.75 / 4.0',
                subtitle: "Dean's Honor List",
                icon: Icons.school_outlined,
                iconColor: AppColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // ── GPA Target Simulator ─────────────────────────────────────────────
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.calculate_outlined, color: AppColors.warning, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'GPA Target Simulator',
                    style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary, fontSize: 15),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Current GPA: ${_currentGpa.toStringAsFixed(2)} (${_currentCredits.toInt()} Credits earned)',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              Slider(
                value: _targetGpa,
                min: 3.0,
                max: 4.0,
                divisions: 20,
                activeColor: AppColors.primary,
                label: _targetGpa.toStringAsFixed(2),
                onChanged: (val) => setState(() => _targetGpa = val),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Target GPA: ${_targetGpa.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _requiredNextGpa <= 4.0 ? AppColors.success.withAlpha(35) : AppColors.danger.withAlpha(35),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Need ${_requiredNextGpa.toStringAsFixed(2)} GPA next semester',
                      style: TextStyle(
                        color: _requiredNextGpa <= 4.0 ? AppColors.success : AppColors.danger,
                        fontSize: 11,
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

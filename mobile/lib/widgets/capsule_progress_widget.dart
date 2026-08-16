import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

class CapsuleProgressItem {
  final String label; // e.g. 'Mon', 'May'
  final int topScore; // e.g. 70
  final int count; // e.g. 23
  final String unit; // e.g. 'tasks', 'lessons', 'hrs'
  final double progress; // 0.0 to 1.0
  final Color primaryColor;
  final Color backgroundColor;

  const CapsuleProgressItem({
    required this.label,
    required this.topScore,
    required this.count,
    this.unit = 'tasks',
    required this.progress,
    this.primaryColor = AppColors.primaryLight,
    this.backgroundColor = AppColors.bgSurfaceAlt,
  });
}

/// Modern Vertical Capsule Progress Widget (Inspired by Reference 2)
class CapsuleProgressWidget extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<CapsuleProgressItem> items;

  const CapsuleProgressWidget({
    super.key,
    required this.title,
    this.subtitle,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ],
            ),
            const Icon(Icons.more_horiz_rounded, color: AppColors.textMuted, size: 20),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: items.map((item) => _buildCapsuleColumn(item)).toList(),
        ),
      ],
    );
  }

  Widget _buildCapsuleColumn(CapsuleProgressItem item) {
    return Column(
      children: [
        // Outer Capsule Container
        Container(
          width: 72,
          height: 140,
          decoration: BoxDecoration(
            color: item.backgroundColor,
            borderRadius: BorderRadius.circular(36),
            border: Border.all(color: AppColors.border, width: 1),
          ),
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              // Filled Progress Pill
              FractionallySizedBox(
                heightFactor: item.progress.clamp(0.15, 1.0),
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: item.primaryColor,
                    borderRadius: BorderRadius.circular(36),
                  ),
                ),
              ),

              // Top badge circle
              Positioned(
                top: 8,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: Color(0xFF1E293B),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '${item.topScore}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),

              // Count & Unit text inside bottom of capsule
              Positioned(
                bottom: 12,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${item.count}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      item.unit,
                      style: TextStyle(
                        color: Colors.white.withAlpha(200),
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Label (e.g. Month or Day)
        Text(
          item.label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

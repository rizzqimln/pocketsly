import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/design_system.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback? onQuickAction;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
    this.onQuickAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(
        left: AppSpacing.md,
        right: AppSpacing.md,
        bottom: AppSpacing.xs,
        top: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: AppSemanticColors.bgMain,
        border: Border(
          top: BorderSide(
            color: AppSemanticColors.border.withAlpha(20),
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          decoration: BoxDecoration(
            color: AppSemanticColors.bgSurfaceElevated,
            borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
            border: Border.all(color: AppSemanticColors.border, width: 1),
            boxShadow: AppElevation.level2,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildNavItem(0, Icons.grid_view_rounded, 'Home'),
              _buildNavItem(1, Icons.check_circle_outline_rounded, 'Habits'),
              _buildNavItem(2, Icons.calendar_today_rounded, 'Schedule'),

              // Elevated Center Quick Action (+) Button
              if (onQuickAction != null)
                GestureDetector(
                  onTap: onQuickAction,
                  child: Container(
                    width: 52,
                    height: 52,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primaryLight.withAlpha(120),
                          blurRadius: 16,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.add_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                ),

              _buildNavItem(3, Icons.auto_stories_outlined, 'Notes'),
              _buildNavItem(4, Icons.terminal_rounded, 'Labs'),
              _buildNavItem(5, Icons.account_balance_wallet_outlined, 'Budget'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isActive = currentIndex == index;
    return Expanded(
      child: InkWell(
        onTap: () => onTabSelected(index),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: isActive ? AppSemanticColors.primary.withAlpha(45) : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            border: isActive
                ? Border.all(
                    color: AppSemanticColors.primaryLight.withAlpha(80),
                    width: 1,
                  )
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  icon,
                  size: isActive ? 26 : 24,
                  color: isActive
                      ? AppSemanticColors.primaryLight
                      : AppSemanticColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 150),
                style: AppTypography.caption.copyWith(
                  color: isActive
                      ? AppSemanticColors.primaryLight
                      : AppSemanticColors.textMuted,
                  fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                ),
                child: Text(label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
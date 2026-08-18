import 'package:flutter/material.dart';

/// Central Design System Spacing & Layout Tokens
/// Based on 4px baseline grid for visual rhythm
class AppSpacing {
  AppSpacing._();

  // Base unit (4px)
  static const double unit = 4.0;

  // Spacing scale
  static const double xs = unit;        // 4px
  static const double sm = unit * 2;    // 8px
  static const double md = unit * 3;    // 12px
  static const double lg = unit * 4;    // 16px
  static const double xl = unit * 5;    // 20px
  static const double xxl = unit * 6;   // 24px
  static const double xxxl = unit * 8;  // 32px

  // Border radius scale
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 20.0;
  static const double radiusXxl = 28.0;

  // Component-specific
  static const double cardPadding = lg;      // 16px
  static const double modalPadding = xl;     // 20px
  static const double screenPadding = lg;    // 16px
  static const double navHeight = 72.0;      // Standard bottom nav
  static const double minTouchTarget = 48.0; // Material min
}

/// Central Design System Typography Scale
/// Consistent type ramp with semantic roles
class AppTypography {
  AppTypography._();

  static const String fontFamily = 'Inter';

  // Headings
  static const TextStyle h1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w800,
    height: 1.2,
    letterSpacing: -0.5,
  );

  static const TextStyle h2 = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    height: 1.3,
    letterSpacing: -0.3,
  );

  static const TextStyle h3 = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    height: 1.35,
    letterSpacing: -0.2,
  );

  // Subheadings
  static const TextStyle subheading = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.4,
    letterSpacing: 0.1,
  );

  static const TextStyle sectionLabel = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w700,
    height: 1.3,
    letterSpacing: 0.8,
  );

  // Body text
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  static const TextStyle body = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.45,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  static const TextStyle overline = TextStyle(
    fontSize: 10,
    fontWeight: FontWeight.w500,
    height: 1.3,
    letterSpacing: 1.0,
  );

  // Button text
  static const TextStyle buttonLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w700,
    height: 1.2,
  );

  static const TextStyle button = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    height: 1.2,
  );

  // Input text
  static const TextStyle input = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  static const TextStyle inputLabel = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    height: 1.3,
  );

  // Data / mono
  static const TextStyle mono = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    fontFamily: 'JetBrainsMono',
    height: 1.5,
  );
}

/// Central Design System Semantic Color Roles
/// Single source of truth for what each color MEANS
class AppSemanticColors {
  AppSemanticColors._();

  // Status - NEVER repurpose these for arbitrary badges
  static const Color success = Color(0xFF10B981);   // Completed, saved, online
  static const Color danger = Color(0xFFEF4444);    // Error, destructive, offline
  static const Color warning = Color(0xFFF59E0B);   // Pending, caution, needs action
  static const Color info = Color(0xFF38BDF8);      // Neutral info, tips

  // Extended semantic colors for specific UI purposes
  static const Color cyan = Color(0xFF06B6D4);      // Cyan - export, secondary actions
  static const Color orange = Color(0xFFF97316);    // Orange - restore, warnings

  // Interactive
  static const Color primary = Color(0xFF7C3AED);       // Primary actions
  static const Color primaryLight = Color(0xFF8B5CF6);  // Hover/focus states
  static const Color primaryDark = Color(0xFF5B21B6);   // Pressed state

  // Surfaces
  static const Color bgMain = Color(0xFF090D16);
  static const Color bgSurface = Color(0xFF111827);
  static const Color bgSurfaceElevated = Color(0xFF1A2234);
  static const Color bgSurfaceAlt = Color(0xFF1F293D);

  // Text hierarchy
  static const Color textPrimary = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
  static const Color textInverse = Color(0xFF0F172A);

  // Borders
  static const Color border = Color(0x1FFFFFFF);
  static const Color borderFocus = Color(0xFF8B5CF6);
  static const Color borderError = Color(0xFFEF4444);
}

/// Semantic button styles - single source of truth
class AppButtonStyles {
  static ButtonStyle primary() => ElevatedButton.styleFrom(
        backgroundColor: AppSemanticColors.primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: AppSemanticColors.primary.withAlpha(80),
        disabledForegroundColor: Colors.white.withAlpha(120),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        minimumSize: const Size(AppSpacing.minTouchTarget, AppSpacing.minTouchTarget),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        elevation: 0,
        shadowColor: AppSemanticColors.primary.withAlpha(60),
        textStyle: AppTypography.buttonLarge,
      );

  static ButtonStyle secondary() => OutlinedButton.styleFrom(
        foregroundColor: AppSemanticColors.primaryLight,
        disabledForegroundColor: AppSemanticColors.primaryLight.withAlpha(100),
        side: const BorderSide(color: AppSemanticColors.primaryLight, width: 1.5),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        minimumSize: const Size(AppSpacing.minTouchTarget, AppSpacing.minTouchTarget),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        textStyle: AppTypography.button,
      );

  static ButtonStyle danger() => ElevatedButton.styleFrom(
        backgroundColor: AppSemanticColors.danger.withAlpha(25),
        foregroundColor: AppSemanticColors.danger,
        disabledBackgroundColor: AppSemanticColors.danger.withAlpha(15),
        disabledForegroundColor: AppSemanticColors.danger.withAlpha(100),
        side: BorderSide(color: AppSemanticColors.danger.withAlpha(80)),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        minimumSize: const Size(AppSpacing.minTouchTarget, AppSpacing.minTouchTarget),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        textStyle: AppTypography.button,
      );

  static ButtonStyle ghost() => TextButton.styleFrom(
        foregroundColor: AppSemanticColors.textSecondary,
        disabledForegroundColor: AppSemanticColors.textMuted,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        minimumSize: const Size(AppSpacing.minTouchTarget, AppSpacing.minTouchTarget),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        textStyle: AppTypography.button,
      );
}

/// Semantic input decoration - consistent across the app
class AppInputStyles {
  static InputDecoration base({
    required String label,
    String? hint,
    Widget? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      labelStyle: AppTypography.inputLabel.copyWith(color: AppSemanticColors.textSecondary),
      hintStyle: AppTypography.input.copyWith(color: AppSemanticColors.textMuted),
      floatingLabelStyle: AppTypography.inputLabel.copyWith(color: AppSemanticColors.primaryLight),
      filled: true,
      fillColor: AppSemanticColors.bgSurfaceAlt,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        borderSide: BorderSide(color: AppSemanticColors.border, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        borderSide: const BorderSide(color: AppSemanticColors.borderFocus, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        borderSide: const BorderSide(color: AppSemanticColors.borderError, width: 1.5),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        borderSide: const BorderSide(color: AppSemanticColors.borderError, width: 2),
      ),
    );
  }

  static InputDecoration error({
    required String label,
    String? hint,
    required String errorText,
    Widget? prefixIcon,
  }) {
    final decoration = base(
      label: label,
      hint: hint,
      prefixIcon: prefixIcon,
    );
    return decoration.copyWith(
      errorText: errorText,
      errorStyle: AppTypography.caption.copyWith(color: AppSemanticColors.danger),
      errorMaxLines: 2,
    );
  }
}

/// Consistent card elevations
class AppElevation {
  AppElevation._();

  static const List<BoxShadow> level1 = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> level2 = [
    BoxShadow(
      color: Color(0x24000000),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> level3 = [
    BoxShadow(
      color: Color(0x2E000000),
      blurRadius: 24,
      offset: Offset(0, 8),
    ),
    BoxShadow(
      color: Color(0x14000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static List<BoxShadow> glow(Color color, {double blur = 20, double spread = 1}) => [
        BoxShadow(
          color: color.withAlpha(45),
          blurRadius: blur,
          spreadRadius: spread,
        ),
      ];
}
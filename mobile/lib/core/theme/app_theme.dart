import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';
import 'design_system.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppSemanticColors.bgMain,
      colorScheme: const ColorScheme.dark(
        primary: AppSemanticColors.primary,
        onPrimary: Colors.white,
        secondary: AppSemanticColors.primaryLight,
        surface: AppSemanticColors.bgSurface,
        onSurface: AppSemanticColors.textPrimary,
        error: AppSemanticColors.danger,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme,
      ).copyWith(
        displayLarge: AppTypography.h1.copyWith(color: AppSemanticColors.textPrimary),
        displayMedium: AppTypography.h2.copyWith(color: AppSemanticColors.textPrimary),
        displaySmall: AppTypography.h3.copyWith(color: AppSemanticColors.textPrimary),
        headlineLarge: AppTypography.h1.copyWith(color: AppSemanticColors.textPrimary),
        headlineMedium: AppTypography.h2.copyWith(color: AppSemanticColors.textPrimary),
        headlineSmall: AppTypography.h3.copyWith(color: AppSemanticColors.textPrimary),
        titleLarge: AppTypography.subheading.copyWith(color: AppSemanticColors.textPrimary),
        titleMedium: AppTypography.subheading.copyWith(color: AppSemanticColors.textPrimary),
        titleSmall: AppTypography.sectionLabel.copyWith(color: AppSemanticColors.textPrimary),
        bodyLarge: AppTypography.bodyLarge.copyWith(color: AppSemanticColors.textPrimary),
        bodyMedium: AppTypography.body.copyWith(color: AppSemanticColors.textSecondary),
        bodySmall: AppTypography.bodySmall.copyWith(color: AppSemanticColors.textMuted),
        labelLarge: AppTypography.buttonLarge.copyWith(color: Colors.white),
        labelMedium: AppTypography.button.copyWith(color: Colors.white),
        labelSmall: AppTypography.caption.copyWith(color: AppSemanticColors.textMuted),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppSemanticColors.bgMain,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: AppTypography.h3,
      ),
      cardTheme: CardThemeData(
        color: AppSemanticColors.bgSurface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          side: const BorderSide(color: AppSemanticColors.border, width: 1),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppSemanticColors.bgSurface,
        modalBackgroundColor: AppSemanticColors.bgSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusXxl)),
        ),
        elevation: 24,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppSemanticColors.bgSurfaceAlt,
        disabledColor: AppSemanticColors.bgSurfaceAlt,
        selectedColor: AppSemanticColors.primary,
        secondarySelectedColor: AppSemanticColors.primaryLight,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(99),
          side: const BorderSide(color: AppSemanticColors.border, width: 1),
        ),
        labelStyle: AppTypography.caption.copyWith(
          color: AppSemanticColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
        secondaryLabelStyle: AppTypography.caption.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
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
          borderSide: const BorderSide(color: AppSemanticColors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          borderSide: const BorderSide(color: AppSemanticColors.borderFocus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          borderSide: const BorderSide(color: AppSemanticColors.borderError, width: 1.5),
        ),
        hintStyle: AppTypography.input.copyWith(color: AppSemanticColors.textMuted),
        labelStyle: AppTypography.inputLabel.copyWith(color: AppSemanticColors.textSecondary),
        floatingLabelStyle: AppTypography.inputLabel.copyWith(color: AppSemanticColors.primaryLight),
        errorStyle: AppTypography.caption.copyWith(color: AppSemanticColors.danger),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: AppButtonStyles.primary(),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: AppButtonStyles.secondary(),
      ),
      textButtonTheme: TextButtonThemeData(
        style: AppButtonStyles.ghost(),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppSemanticColors.primary,
        foregroundColor: Colors.white,
        elevation: 8,
        focusElevation: 12,
        hoverElevation: 10,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        extendedPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.md,
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppSemanticColors.bgSurface,
        elevation: 24,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        ),
        titleTextStyle: AppTypography.h3.copyWith(color: AppSemanticColors.textPrimary),
        contentTextStyle: AppTypography.body.copyWith(color: AppSemanticColors.textSecondary),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppSemanticColors.bgSurfaceElevated,
        contentTextStyle: AppTypography.body.copyWith(color: AppSemanticColors.textPrimary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        behavior: SnackBarBehavior.floating,
        elevation: 8,
      ),
      dividerTheme: DividerThemeData(
        color: AppSemanticColors.border,
        thickness: 1,
        space: AppSpacing.lg,
      ),
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.xs,
        ),
        titleTextStyle: AppTypography.bodyLarge.copyWith(color: AppSemanticColors.textPrimary),
        subtitleTextStyle: AppTypography.bodySmall.copyWith(color: AppSemanticColors.textSecondary),
        iconColor: AppSemanticColors.textSecondary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
      ),
      tabBarTheme: TabBarThemeData(
        labelStyle: AppTypography.button,
        unselectedLabelStyle: AppTypography.button.copyWith(color: AppSemanticColors.textMuted),
        labelColor: AppSemanticColors.primary,
        unselectedLabelColor: AppSemanticColors.textMuted,
        indicator: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: AppSemanticColors.primary,
              width: 3,
            ),
          ),
        ),
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: Colors.transparent,
      ),
    );
  }
}
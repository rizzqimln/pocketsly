import 'package:flutter/material.dart';

/// Central Design System Color Tokens matching Modern UI/UX References
class AppColors {
  AppColors._();

  // ── Background Surfaces (Deep Violet / Space Mesh) ─────────────────────────
  static const Color bgMain = Color(0xFF090D16);
  static const Color bgSurface = Color(0xFF111827);
  static const Color bgSurfaceElevated = Color(0xFF1A2234);
  static const Color bgSurfaceAlt = Color(0xFF1F293D);
  static const Color bgSurfaceHover = Color(0xFF28354E);
  static const Color bgCardGlass = Color(0xCC111827);

  // ── Text & Content ────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // ── Primary Brand Accents (Vibrant Violet / Indigo Spectrum) ───────────────
  static const Color primary = Color(0xFF7C3AED);
  static const Color primaryLight = Color(0xFF8B5CF6);
  static const Color primaryViolet = Color(0xFF6C5CE7);
  static const Color primaryDark = Color(0xFF5B21B6);
  static const Color primaryGlow = Color(0x667C3AED);

  // ── Soft Modern Pastel Tokens (Reference 2: Learning Tracker) ──────────────
  static const Color pastelLavender = Color(0xFFEDE9FE);
  static const Color pastelLavenderText = Color(0xFF6D28D9);
  static const Color pastelMint = Color(0xFFD1FAE5);
  static const Color pastelMintText = Color(0xFF047857);
  static const Color pastelPeach = Color(0xFFFEF3C7);
  static const Color pastelPeachText = Color(0xFFB45309);
  static const Color pastelRose = Color(0xFFFCE7F3);
  static const Color pastelRoseText = Color(0xFFBE185D);
  static const Color pastelSky = Color(0xFFE0F2FE);
  static const Color pastelSkyText = Color(0xFF0369A1);

  // ── Functional & Bento Color Accents ───────────────────────────────────────
  static const Color success = Color(0xFF10B981); // Emerald (Done / Income)
  static const Color danger = Color(0xFFEF4444);  // Coral Rose (Expense / Urgent)
  static const Color warning = Color(0xFFF59E0B); // Warm Amber
  static const Color info = Color(0xFF38BDF8);    // Sky Blue
  static const Color cyan = Color(0xFF06B6D4);    // Cyan
  static const Color pink = Color(0xFFEC4899);    // Pink
  static const Color indigo = Color(0xFF6366F1);  // Indigo
  static const Color orange = Color(0xFFF97316);  // Orange / Flame

  // ── Borders & Outlines ────────────────────────────────────────────────────
  static const Color border = Color(0x1FFFFFFF);      // 12% white
  static const Color borderLight = Color(0x2EFFFFFF); // 18% white
  static const Color borderFocus = Color(0xFF8B5CF6);
  static const Color borderGlow = Color(0x4D8B5CF6);

  // ── Gradients ─────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF8B5CF6), Color(0xFF6C5CE7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF2E1065), Color(0xFF1E1B4B), Color(0xFF0F172A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient assistantGradient = LinearGradient(
    colors: [Color(0xFF7C3AED), Color(0xFF4F46E5), Color(0xFF2563EB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient floatingDockGradient = LinearGradient(
    colors: [Color(0xF0111827), Color(0xF01A2234)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient expenseGradient = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient incomeGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF059669)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassGradient = LinearGradient(
    colors: [Color(0xCC1A2234), Color(0x99111827)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient orangeFlameGradient = LinearGradient(
    colors: [Color(0xFFF97316), Color(0xFFEA580C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

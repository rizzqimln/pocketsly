import 'package:flutter/material.dart';

/// Central Design System Color Tokens matching Pocketsly Web
class AppColors {
  AppColors._();

  // ── Background Surfaces ───────────────────────────────────────────────────
  static const Color bgMain = Color(0xFF0B0F19);
  static const Color bgSurface = Color(0xFF0F172A);
  static const Color bgSurfaceAlt = Color(0xFF1E293B);
  static const Color bgSurfaceHover = Color(0xFF24344D);
  static const Color bgCardGlass = Color(0xB20F172A);

  // ── Text & Content ────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // ── Primary Brand Accents (Violet / Indigo Spectrum) ──────────────────────
  static const Color primary = Color(0xFF7C3AED);
  static const Color primaryLight = Color(0xFF8B5CF6);
  static const Color primaryDark = Color(0xFF6D28D9);
  static const Color primaryGlow = Color(0x597C3AED);

  // ── Functional & Bento Color Accents ───────────────────────────────────────
  static const Color success = Color(0xFF10B981); // Emerald (Income / Done)
  static const Color danger = Color(0xFFEF4444);  // Rose / Coral (Expense / Urgent)
  static const Color warning = Color(0xFFF59E0B); // Amber
  static const Color info = Color(0xFF38BDF8);    // Sky Blue
  static const Color cyan = Color(0xFF06B6D4);    // Cyan
  static const Color pink = Color(0xFFEC4899);    // Pink
  static const Color indigo = Color(0xFF6366F1);  // Indigo

  // ── Borders & Outlines ────────────────────────────────────────────────────
  static const Color border = Color(0x1AFFFFFF);      // 10% white
  static const Color borderLight = Color(0x26FFFFFF); // 15% white
  static const Color borderFocus = Color(0xFF7C3AED);

  // ── Gradients ─────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF1E1B4B), Color(0xFF0F172A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
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
    colors: [Color(0xCC0F172A), Color(0x991E293B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

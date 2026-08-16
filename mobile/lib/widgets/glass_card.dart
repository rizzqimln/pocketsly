import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

/// Glassmorphic Card Container with subtle gradient and border glow
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final BoxBorder? border;
  final Color? color;
  final Gradient? gradient;
  final Color? glowColor;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.borderRadius = 18,
    this.border,
    this.color,
    this.gradient,
    this.glowColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBorder = border ?? Border.all(color: AppColors.border, width: 1);
    final List<BoxShadow> shadows = [
      const BoxShadow(
        color: Color(0x24000000),
        blurRadius: 16,
        offset: Offset(0, 4),
      ),
      if (glowColor != null)
        BoxShadow(
          color: glowColor!.withAlpha(45),
          blurRadius: 20,
          spreadRadius: 1,
        ),
    ];

    Widget card = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: gradient == null ? (color ?? AppColors.bgSurface) : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: effectiveBorder,
        boxShadow: shadows,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          splashColor: AppColors.primaryLight.withAlpha(30),
          highlightColor: AppColors.primary.withAlpha(20),
          child: card,
        ),
      );
    }
    return card;
  }
}

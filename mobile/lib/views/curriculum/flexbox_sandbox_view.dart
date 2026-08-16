import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/glass_card.dart';

class FlexboxSandboxView extends StatefulWidget {
  const FlexboxSandboxView({super.key});

  @override
  State<FlexboxSandboxView> createState() => _FlexboxSandboxViewState();
}

class _FlexboxSandboxViewState extends State<FlexboxSandboxView> {
  MainAxisAlignment _justifyContent = MainAxisAlignment.center;
  CrossAxisAlignment _alignItems = CrossAxisAlignment.center;
  Axis _direction = Axis.horizontal;
  int _itemCount = 3;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'CSS FLEXBOX VISUALIZER SANDBOX',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        // ── Controls ────────────────────────────────────────────────────────
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Flex Controls:', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildChip('row', _direction == Axis.horizontal, () => setState(() => _direction = Axis.horizontal)),
                  _buildChip('column', _direction == Axis.vertical, () => setState(() => _direction = Axis.vertical)),
                  _buildChip('justify: center', _justifyContent == MainAxisAlignment.center, () => setState(() => _justifyContent = MainAxisAlignment.center)),
                  _buildChip('justify: space-between', _justifyContent == MainAxisAlignment.spaceBetween, () => setState(() => _justifyContent = MainAxisAlignment.spaceBetween)),
                  _buildChip('align: center', _alignItems == CrossAxisAlignment.center, () => setState(() => _alignItems = CrossAxisAlignment.center)),
                  _buildChip('+ Add Item', false, () => setState(() => _itemCount = (_itemCount % 5) + 1)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // ── Preview Viewport ────────────────────────────────────────────────
        Container(
          height: 220,
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.bgMain,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.primary.withOpacity(0.4), width: 1.5),
          ),
          child: Flex(
            direction: _direction,
            mainAxisAlignment: _justifyContent,
            crossAxisAlignment: _alignItems,
            children: List.generate(_itemCount, (i) => Container(
              width: 50,
              height: 50,
              margin: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [BoxShadow(color: AppColors.primaryGlow, blurRadius: 8)],
              ),
              alignment: Alignment.center,
              child: Text('${i + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
            )),
          ),
        ),
      ],
    );
  }

  Widget _buildChip(String label, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.bgSurfaceAlt,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

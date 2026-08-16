import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/glass_card.dart';

class RegexValidatorView extends StatefulWidget {
  const RegexValidatorView({super.key});

  @override
  State<RegexValidatorView> createState() => _RegexValidatorViewState();
}

class _RegexValidatorViewState extends State<RegexValidatorView> {
  final TextEditingController _regexController = TextEditingController(text: r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
  final TextEditingController _testController = TextEditingController(text: 'student@university.ac.id');
  bool _isMatch = true;

  void _validate() {
    try {
      final reg = RegExp(_regexController.text);
      setState(() {
        _isMatch = reg.hasMatch(_testController.text);
      });
    } catch (_) {
      setState(() => _isMatch = false);
    }
  }

  void _loadPreset(String pattern, String sample) {
    _regexController.text = pattern;
    _testController.text = sample;
    _validate();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'REGEX PATTERN TESTER & VALIDATOR',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Preset Patterns:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _buildPresetChip('Email', r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', 'dev@pocketsly.com'),
                  _buildPresetChip('Date (YYYY-MM-DD)', r'^\d{4}-\d{2}-\d{2}$', '2026-08-16'),
                  _buildPresetChip('Hex Color', r'^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$', '#7C3AED'),
                  _buildPresetChip('Phone (+62)', r'^(\+62|62|0)8[1-9][0-9]{6,10}$', '081234567890'),
                ],
              ),
              const SizedBox(height: 12),
              const Text('Regular Expression Pattern:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              TextField(
                controller: _regexController,
                onChanged: (_) => _validate(),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 13, color: AppColors.primaryLight),
              ),
              const SizedBox(height: 12),
              const Text('Test String Input:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              TextField(
                controller: _testController,
                onChanged: (_) => _validate(),
                style: const TextStyle(fontFamily: 'monospace', fontSize: 13, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _isMatch ? AppColors.success.withAlpha(35) : AppColors.danger.withAlpha(35),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _isMatch ? AppColors.success : AppColors.danger),
                ),
                child: Row(
                  children: [
                    Icon(_isMatch ? Icons.check_circle_rounded : Icons.cancel_rounded, color: _isMatch ? AppColors.success : AppColors.danger, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _isMatch ? 'MATCH FOUND! The string matches the regular expression.' : 'NO MATCH. The string failed to match the pattern.',
                        style: TextStyle(color: _isMatch ? AppColors.success : AppColors.danger, fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPresetChip(String label, String pattern, String sample) {
    return InkWell(
      onTap: () => _loadPreset(pattern, sample),
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.bgSurfaceAlt,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppColors.border),
        ),
        child: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
      ),
    );
  }
}

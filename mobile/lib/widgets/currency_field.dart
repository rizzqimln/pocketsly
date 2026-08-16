import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/theme/app_colors.dart';

class CurrencyField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final List<int> quickPresets;
  final ValueChanged<double>? onChanged;

  const CurrencyField({
    super.key,
    required this.controller,
    this.label = 'Amount',
    this.quickPresets = const [10000, 25000, 50000, 100000],
    this.onChanged,
  });

  @override
  State<CurrencyField> createState() => _CurrencyFieldState();
}

class _CurrencyFieldState extends State<CurrencyField> {
  final NumberFormat _formatter = NumberFormat('#,###', 'en_US');

  void _formatInput(String value) {
    final clean = value.replaceAll(',', '').replaceAll(RegExp(r'[^\d]'), '');
    if (clean.isEmpty) {
      widget.controller.value = const TextEditingValue(text: '');
      widget.onChanged?.call(0.0);
      return;
    }
    final num = int.tryParse(clean) ?? 0;
    final formatted = _formatter.format(num);

    widget.controller.value = TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
    widget.onChanged?.call(num.toDouble());
  }

  void _addQuick(int delta) {
    final raw = widget.controller.text.replaceAll(',', '').replaceAll(RegExp(r'[^\d]'), '');
    final current = int.tryParse(raw) ?? 0;
    final updated = current + delta;
    final formatted = _formatter.format(updated);

    widget.controller.value = TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
    widget.onChanged?.call(updated.toDouble());
  }

  void _clear() {
    widget.controller.value = const TextEditingValue(text: '');
    widget.onChanged?.call(0.0);
  }

  String _formatChipLabel(int val) {
    if (val >= 1000000) return '+${val ~/ 1000000}M';
    if (val >= 1000) return '+${val ~/ 1000}k';
    return '+$val';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: AppColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: const Text(
                  'Rp',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Expanded(
                child: TextField(
                  controller: widget.controller,
                  keyboardType: TextInputType.number,
                  onChanged: _formatInput,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'monospace',
                  ),
                  decoration: const InputDecoration(
                    hintText: '0',
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    contentPadding: EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            ...widget.quickPresets.map((preset) => InkWell(
              onTap: () => _addQuick(preset),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.bgSurfaceAlt,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  _formatChipLabel(preset),
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            )),
            InkWell(
              onTap: _clear,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.danger.withAlpha(25),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.danger.withAlpha(70)),
                ),
                child: const Text(
                  'Clear',
                  style: TextStyle(
                    color: AppColors.danger,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

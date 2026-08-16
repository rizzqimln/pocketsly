import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../widgets/currency_field.dart';

class BudgetEntrySheet extends StatefulWidget {
  final String initialTab; // 'expense', 'income', 'budget'
  final VoidCallback onSaved;

  const BudgetEntrySheet({
    super.key,
    this.initialTab = 'expense',
    required this.onSaved,
  });

  static Future<void> show(BuildContext context, {String initialTab = 'expense', required VoidCallback onSaved}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      builder: (context) => BudgetEntrySheet(
        initialTab: initialTab,
        onSaved: onSaved,
      ),
    );
  }

  @override
  State<BudgetEntrySheet> createState() => _BudgetEntrySheetState();
}

class _BudgetEntrySheetState extends State<BudgetEntrySheet> {
  late String _activeTab;
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _categoryController = TextEditingController(text: 'Food & Dining');
  final TextEditingController _descController = TextEditingController();
  String _wallet = 'Cash';
  bool _isSubmitting = false;

  final List<String> _expensePresets = [
    'Food & Dining',
    'Transportation',
    'Books & Tools',
    'Entertainment',
    'Housing & Utilities',
    'Groceries',
  ];

  final List<String> _incomePresets = [
    'Allowance',
    'Part-time Salary',
    'Freelance Work',
    'Scholarship Grant',
    'Gifts & Other',
  ];

  @override
  void initState() {
    super.initState();
    _activeTab = widget.initialTab;
    if (_activeTab == 'income') {
      _categoryController.text = 'Allowance';
    }
  }

  Future<void> _submit() async {
    final rawAmount = _amountController.text.replaceAll(',', '').replaceAll(RegExp(r'[^\d]'), '');
    final amount = double.tryParse(rawAmount) ?? 0.0;

    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    final today = DateTime.now().toIso8601String().substring(0, 10);

    try {
      if (_activeTab == 'expense') {
        await ApiClient.instance.post(ApiEndpoints.expenses, {
          'amount': amount,
          'category': _categoryController.text.trim(),
          'expense_date': today,
          'description': '[$_wallet] ${_descController.text.trim()}'.trim(),
        });
      } else if (_activeTab == 'income') {
        await ApiClient.instance.post(ApiEndpoints.incomes, {
          'amount': amount,
          'source': _categoryController.text.trim(),
          'income_date': today,
          'recurring': 'none',
          'description': '[$_wallet] ${_descController.text.trim()}'.trim(),
        });
      } else {
        await ApiClient.instance.post(ApiEndpoints.budgets, {
          'category': _categoryController.text.trim(),
          'amount': amount,
          'month': today.substring(0, 7),
        });
      }

      if (mounted) {
        Navigator.pop(context);
        widget.onSaved();
      }
    } catch (_) {}
    if (mounted) setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final presets = _activeTab == 'income' ? _incomePresets : _expensePresets;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: bottomInset + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Drag Handle Pill ────────────────────────────────────────────
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.borderLight,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // ── Modal Header & Tab Switcher ──────────────────────────────────
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.bgSurfaceAlt,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  _buildTabBtn('expense', '- Expense', AppColors.danger),
                  _buildTabBtn('income', '+ Income', AppColors.success),
                  _buildTabBtn('budget', '🎯 Target Limit', AppColors.primary),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ── Amount Input with Quick Increment Chips ──────────────────────
            CurrencyField(
              controller: _amountController,
              label: _activeTab == 'income' ? 'Income Amount' : 'Amount Spent',
              quickPresets: _activeTab == 'income'
                  ? const [100000, 500000, 1000000, 2500000]
                  : const [10000, 25000, 50000, 100000],
            ),
            const SizedBox(height: 12),

            // ── Category Input & Preset Chips ────────────────────────────────
            Text(
              _activeTab == 'income' ? 'Source' : 'Category',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _categoryController,
              decoration: InputDecoration(
                hintText: _activeTab == 'income' ? 'e.g. Allowance, Salary' : 'e.g. Food & Dining, Transportation',
              ),
            ),
            const SizedBox(height: 8),

            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: presets.map((p) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: InkWell(
                      onTap: () => setState(() => _categoryController.text = p),
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _categoryController.text == p ? AppColors.primary.withAlpha(40) : AppColors.bgSurfaceAlt,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: _categoryController.text == p ? AppColors.primary : AppColors.border),
                        ),
                        child: Text(
                          p,
                          style: TextStyle(
                            color: _categoryController.text == p ? AppColors.primaryLight : AppColors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),

            // ── Wallet / Account Selector ───────────────────────────────────
            if (_activeTab != 'budget') ...[
              const Text(
                'Account / Wallet',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppColors.bgSurfaceAlt,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _wallet,
                    isExpanded: true,
                    dropdownColor: AppColors.bgSurfaceAlt,
                    items: const [
                      DropdownMenuItem(value: 'Cash', child: Text('Cash in Hand')),
                      DropdownMenuItem(value: 'Bank Transfer', child: Text('Bank Account')),
                      DropdownMenuItem(value: 'E-Wallet', child: Text('E-Wallet (GoPay/OVO/Dana)')),
                      DropdownMenuItem(value: 'Card', child: Text('Debit / Credit Card')),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _wallet = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Notes (Optional)',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _descController,
                decoration: const InputDecoration(hintText: 'e.g. Lunch with classmates'),
              ),
              const SizedBox(height: 16),
            ],

            // ── Submit Button ───────────────────────────────────────────────
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: _activeTab == 'expense'
                    ? AppColors.danger
                    : _activeTab == 'income'
                        ? AppColors.success
                        : AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 4,
              ),
              child: _isSubmitting
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(
                      _activeTab == 'expense'
                          ? '- Log Expense'
                          : _activeTab == 'income'
                              ? '+ Log Income'
                              : '🎯 Allocate Limit',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabBtn(String tab, String label, Color activeColor) {
    final isActive = _activeTab == tab;
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _activeTab = tab;
            if (tab == 'income') _categoryController.text = 'Allowance';
            if (tab == 'expense') _categoryController.text = 'Food & Dining';
          });
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? activeColor : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isActive ? Colors.white : AppColors.textSecondary,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

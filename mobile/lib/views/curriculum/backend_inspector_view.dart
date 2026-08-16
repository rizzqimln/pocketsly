import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_endpoints.dart';
import '../../widgets/glass_card.dart';

class BackendInspectorView extends StatefulWidget {
  const BackendInspectorView({super.key});

  @override
  State<BackendInspectorView> createState() => _BackendInspectorViewState();
}

class _BackendInspectorViewState extends State<BackendInspectorView> {
  String _selectedEndpoint = '/api/session';
  String _responseJson = 'Select an endpoint and tap Send Request to inspect JSON flow...';
  bool _isLoading = false;
  int _statusCode = 200;

  final List<String> _endpoints = [
    '/api/session',
    '/api/tasks',
    '/api/habits',
    '/api/schedules',
    '/api/notes',
    '/api/incomes',
    '/api/expenses',
    '/api/budgets',
  ];

  Future<void> _fetchEndpoint() async {
    setState(() {
      _isLoading = true;
      _responseJson = 'Fetching response from Cloudflare edge...';
    });

    final url = '${ApiEndpoints.baseUrl}${_selectedEndpoint.replaceFirst('/api', '')}';
    final res = await ApiClient.instance.get(url);

    if (mounted) {
      setState(() {
        _isLoading = false;
        _statusCode = res is Map && res.containsKey('error') ? 400 : 200;
        _responseJson = const JsonEncoder.withIndent('  ').convert(res);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'BACKEND REST API FLOW INSPECTOR',
          style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        GlassCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.success.withAlpha(40),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('GET', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w800, fontSize: 12)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.bgSurfaceAlt,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedEndpoint,
                          isExpanded: true,
                          dropdownColor: AppColors.bgSurfaceAlt,
                          items: _endpoints.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontFamily: 'monospace', fontSize: 13)))).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedEndpoint = val);
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _fetchEndpoint,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Send', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Response Payload (JSON):', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _statusCode == 200 ? AppColors.success.withAlpha(35) : AppColors.danger.withAlpha(35),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text('Status: $_statusCode OK', style: TextStyle(color: _statusCode == 200 ? AppColors.success : AppColors.danger, fontSize: 10, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.bgMain,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  _responseJson,
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.textPrimary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

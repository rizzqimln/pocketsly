import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

class PomodoroTimerDialog extends StatefulWidget {
  const PomodoroTimerDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      builder: (context) => const PomodoroTimerDialog(),
    );
  }

  @override
  State<PomodoroTimerDialog> createState() => _PomodoroTimerDialogState();
}

class _PomodoroTimerDialogState extends State<PomodoroTimerDialog> {
  String _mode = 'pomodoro'; // 'pomodoro' (25m), 'short_break' (5m), 'long_break' (15m)
  int _totalSeconds = 25 * 60;
  int _secondsLeft = 25 * 60;
  int _completedCycles = 0;
  bool _isRunning = false;
  Timer? _timer;
  String _selectedIntent = 'Deep Focus 🎯';

  final List<String> _intents = [
    'Deep Focus 🎯',
    'Coding Lab 💻',
    'Revision 📚',
    'Problem Solving ⚡',
  ];

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _setMode(String mode) {
    _timer?.cancel();
    setState(() {
      _mode = mode;
      _isRunning = false;
      if (mode == 'pomodoro') {
        _totalSeconds = 25 * 60;
      } else if (mode == 'short_break') {
        _totalSeconds = 5 * 60;
      } else {
        _totalSeconds = 15 * 60;
      }
      _secondsLeft = _totalSeconds;
    });
  }

  void _toggleTimer() {
    if (_isRunning) {
      _timer?.cancel();
      setState(() => _isRunning = false);
    } else {
      setState(() => _isRunning = true);
      _timer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (_secondsLeft > 0) {
          setState(() => _secondsLeft--);
        } else {
          t.cancel();
          setState(() {
            _isRunning = false;
            if (_mode == 'pomodoro') {
              _completedCycles++;
            }
          });
        }
      });
    }
  }

  void _resetTimer() {
    _timer?.cancel();
    setState(() {
      _isRunning = false;
      _secondsLeft = _totalSeconds;
    });
  }

  String _formatTime(int sec) {
    final mins = (sec ~/ 60).toString().padLeft(2, '0');
    final secs = (sec % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    final progress = _totalSeconds > 0 ? (_totalSeconds - _secondsLeft) / _totalSeconds : 0.0;

    return Dialog(
      backgroundColor: AppColors.bgSurfaceElevated,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withAlpha(35),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.timer_outlined, color: AppColors.primaryLight, size: 20),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Focus & Flow Studio',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded, color: AppColors.textMuted, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Intent Selector Tags
            SizedBox(
              height: 32,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: _intents.map((intent) {
                  final isSelected = _selectedIntent == intent;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: InkWell(
                      onTap: () => setState(() => _selectedIntent = intent),
                      borderRadius: BorderRadius.circular(99),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primary.withAlpha(50) : AppColors.bgSurfaceAlt,
                          borderRadius: BorderRadius.circular(99),
                          border: Border.all(
                            color: isSelected ? AppColors.primaryLight : AppColors.border,
                          ),
                        ),
                        child: Text(
                          intent,
                          style: TextStyle(
                            color: isSelected ? AppColors.primaryLight : AppColors.textSecondary,
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 14),

            // Mode Selector Pills
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.bgSurfaceAlt,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  _buildModeChip('pomodoro', 'Focus (25m)'),
                  _buildModeChip('short_break', 'Break (5m)'),
                  _buildModeChip('long_break', 'Long (15m)'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Glowing Circular Progress Countdown
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: (_isRunning ? AppColors.primaryLight : Colors.transparent).withAlpha(40),
                        blurRadius: 24,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  width: 150,
                  height: 150,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 8,
                    backgroundColor: AppColors.bgSurfaceAlt,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatTime(_secondsLeft),
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 34,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'monospace',
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _isRunning ? 'Active Flow' : 'Ready to Start',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Controls
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: _toggleTimer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _isRunning ? AppColors.warning : AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: Icon(_isRunning ? Icons.pause_rounded : Icons.play_arrow_rounded, size: 20),
                  label: Text(_isRunning ? 'Pause Flow' : 'Start Focus', style: const TextStyle(fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 10),
                OutlinedButton(
                  onPressed: _resetTimer,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Icon(Icons.refresh_rounded, size: 18),
                ),
              ],
            ),
            const SizedBox(height: 14),

            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.local_fire_department_rounded, color: AppColors.orange, size: 16),
                const SizedBox(width: 4),
                Text(
                  'Completed Cycles: $_completedCycles',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeChip(String mode, String label) {
    final isActive = _mode == mode;
    return Expanded(
      child: InkWell(
        onTap: () => _setMode(mode),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isActive ? Colors.white : AppColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

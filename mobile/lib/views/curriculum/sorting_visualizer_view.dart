import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/glass_card.dart';

class SortingVisualizerView extends StatefulWidget {
  const SortingVisualizerView({super.key});

  @override
  State<SortingVisualizerView> createState() => _SortingVisualizerViewState();
}

class _SortingVisualizerViewState extends State<SortingVisualizerView> {
  List<int> _numbers = [];
  int _activeComparingA = -1;
  int _activeComparingB = -1;
  bool _isSorting = false;
  int _comparisons = 0;
  int _swaps = 0;
  String _selectedAlgo = 'Bubble Sort'; // 'Bubble Sort', 'Selection Sort', 'Insertion Sort'
  int _speedMs = 120; // Lower is faster

  final int _arraySize = 14;

  @override
  void initState() {
    super.initState();
    _generateRandomArray();
  }

  void _generateRandomArray() {
    if (_isSorting) return;
    final rng = Random();
    setState(() {
      _numbers = List.generate(_arraySize, (_) => rng.nextInt(85) + 15);
      _activeComparingA = -1;
      _activeComparingB = -1;
      _comparisons = 0;
      _swaps = 0;
    });
  }

  Future<void> _startSort() async {
    if (_isSorting) return;
    setState(() {
      _isSorting = true;
      _comparisons = 0;
      _swaps = 0;
    });

    if (_selectedAlgo == 'Bubble Sort') {
      await _bubbleSort();
    } else if (_selectedAlgo == 'Selection Sort') {
      await _selectionSort();
    } else {
      await _insertionSort();
    }

    if (mounted) {
      setState(() {
        _isSorting = false;
        _activeComparingA = -1;
        _activeComparingB = -1;
      });
    }
  }

  Future<void> _bubbleSort() async {
    final n = _numbers.length;
    for (int i = 0; i < n - 1; i++) {
      for (int j = 0; j < n - i - 1; j++) {
        if (!mounted) return;
        setState(() {
          _activeComparingA = j;
          _activeComparingB = j + 1;
          _comparisons++;
        });
        await Future.delayed(Duration(milliseconds: _speedMs));

        if (_numbers[j] > _numbers[j + 1]) {
          setState(() {
            final temp = _numbers[j];
            _numbers[j] = _numbers[j + 1];
            _numbers[j + 1] = temp;
            _swaps++;
          });
          await Future.delayed(Duration(milliseconds: _speedMs));
        }
      }
    }
  }

  Future<void> _selectionSort() async {
    final n = _numbers.length;
    for (int i = 0; i < n - 1; i++) {
      int minIdx = i;
      for (int j = i + 1; j < n; j++) {
        if (!mounted) return;
        setState(() {
          _activeComparingA = minIdx;
          _activeComparingB = j;
          _comparisons++;
        });
        await Future.delayed(Duration(milliseconds: _speedMs));

        if (_numbers[j] < _numbers[minIdx]) {
          minIdx = j;
        }
      }

      if (minIdx != i) {
        setState(() {
          final temp = _numbers[i];
          _numbers[i] = _numbers[minIdx];
          _numbers[minIdx] = temp;
          _swaps++;
        });
        await Future.delayed(Duration(milliseconds: _speedMs));
      }
    }
  }

  Future<void> _insertionSort() async {
    final n = _numbers.length;
    for (int i = 1; i < n; i++) {
      int key = _numbers[i];
      int j = i - 1;

      while (j >= 0 && _numbers[j] > key) {
        if (!mounted) return;
        setState(() {
          _activeComparingA = j;
          _activeComparingB = j + 1;
          _comparisons++;
          _numbers[j + 1] = _numbers[j];
          _swaps++;
        });
        await Future.delayed(Duration(milliseconds: _speedMs));
        j = j - 1;
      }
      _numbers[j + 1] = key;
      setState(() {});
    }
  }

  Map<String, String> _getComplexityInfo() {
    switch (_selectedAlgo) {
      case 'Bubble Sort':
        return {
          'timeBest': 'O(n)',
          'timeAvg': 'O(n²)',
          'timeWorst': 'O(n²)',
          'space': 'O(1)',
          'desc': 'Repeatedly swaps adjacent elements if they are in wrong order. Simple, in-place, and stable.'
        };
      case 'Selection Sort':
        return {
          'timeBest': 'O(n²)',
          'timeAvg': 'O(n²)',
          'timeWorst': 'O(n²)',
          'space': 'O(1)',
          'desc': 'Finds minimum element from unsorted part and puts it at the beginning. Minimizes swaps.'
        };
      case 'Insertion Sort':
      default:
        return {
          'timeBest': 'O(n)',
          'timeAvg': 'O(n²)',
          'timeWorst': 'O(n²)',
          'space': 'O(1)',
          'desc': 'Builds the sorted array one item at a time. Extremely efficient for small or partially sorted datasets.'
        };
    }
  }

  @override
  Widget build(BuildContext context) {
    final info = _getComplexityInfo();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── Algorithm Selector Tabs ─────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: ['Bubble Sort', 'Selection Sort', 'Insertion Sort'].map((algo) {
              final isSelected = _selectedAlgo == algo;
              return Expanded(
                child: InkWell(
                  onTap: _isSorting
                      ? null
                      : () {
                          setState(() => _selectedAlgo = algo);
                          _generateRandomArray();
                        },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      algo.split(' ').first,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 14),

        // ── Bar Visualization Canvas ────────────────────────────────────────
        GlassCard(
          padding: const EdgeInsets.all(16),
          borderRadius: 20,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withAlpha(30),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text('Comparisons: $_comparisons', style: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.orange.withAlpha(30),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text('Swaps: $_swaps', style: const TextStyle(color: AppColors.orange, fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  Text(
                    _isSorting ? '⚡ Sorting...' : 'Idle',
                    style: TextStyle(
                      color: _isSorting ? AppColors.success : AppColors.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Animated Bars Graph
              SizedBox(
                height: 160,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: _numbers.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final val = entry.value;
                    final isComparing = idx == _activeComparingA || idx == _activeComparingB;

                    Color barColor = AppColors.primaryLight;
                    if (isComparing) {
                      barColor = AppColors.orange;
                    }

                    return Flexible(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        height: (val / 100) * 150,
                        decoration: BoxDecoration(
                          color: barColor,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                          boxShadow: isComparing
                              ? [
                                  BoxShadow(
                                    color: AppColors.orange.withAlpha(150),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  ),
                                ]
                              : null,
                        ),
                        alignment: Alignment.bottomCenter,
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 2),
                          child: Text(
                            '$val',
                            style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // ── Controls (Start Sort, Randomize, Speed) ──────────────────────────
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isSorting ? null : _startSort,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.play_arrow_rounded, size: 20),
                label: Text(_isSorting ? 'Sorting...' : 'Run ${_selectedAlgo.split(' ').first}', style: const TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
            const SizedBox(width: 10),
            OutlinedButton.icon(
              onPressed: _isSorting ? null : _generateRandomArray,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.border),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.shuffle_rounded, size: 18),
              label: const Text('Randomize', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Speed Selector
        GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          borderRadius: 14,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Animation Speed:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
              Row(
                children: [
                  _buildSpeedChip(250, 'Slow'),
                  const SizedBox(width: 4),
                  _buildSpeedChip(120, 'Normal'),
                  const SizedBox(width: 4),
                  _buildSpeedChip(40, 'Fast'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // ── Big-O Complexity Metric Cards ───────────────────────────────────
        const Text('ALGORITHM COMPLEXITY & SPECS', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildMetricCard('Best Time', info['timeBest']!, AppColors.success)),
            const SizedBox(width: 8),
            Expanded(child: _buildMetricCard('Worst Time', info['timeWorst']!, AppColors.danger)),
            const SizedBox(width: 8),
            Expanded(child: _buildMetricCard('Space', info['space']!, AppColors.cyan)),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.bgSurfaceAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Text(
            info['desc']!,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
          ),
        ),
      ],
    );
  }

  Widget _buildSpeedChip(int speed, String label) {
    final isSelected = _speedMs == speed;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.bgSurface,
      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
      labelStyle: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500, color: isSelected ? Colors.white : AppColors.textSecondary),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      onSelected: (_) => setState(() => _speedMs = speed),
    );
  }

  Widget _buildMetricCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.bgSurfaceAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Column(
        children: [
          Text(title, style: const TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w900, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}

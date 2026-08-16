import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'core/network/api_client.dart';
import 'widgets/bottom_nav_bar.dart';
import 'views/dashboard/dashboard_view.dart';
import 'views/habits/habits_view.dart';
import 'views/schedule/schedule_view.dart';
import 'views/notes/notes_view.dart';
import 'views/curriculum/curriculum_view.dart';
import 'views/budget/budget_view.dart';
import 'views/budget/budget_entry_sheet.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.bgSurface,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  await ApiClient.instance.init();
  runApp(const PocketslyApp());
}

class PocketslyApp extends StatelessWidget {
  const PocketslyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pocketsly',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const MainShellScreen(),
    );
  }
}

class MainShellScreen extends StatefulWidget {
  const MainShellScreen({super.key});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _currentTabIndex = 0;

  final List<String> _viewTitles = [
    'Daily Overview',
    'Habit Matrix & Tasks',
    'Timetable Schedule',
    'Journal & Library',
    'CS Curriculum & Labs',
    'Monthly Budget Planner',
  ];

  void _onTabSelected(int index) {
    setState(() => _currentTabIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final views = [
      DashboardView(
        onNavigateToBudget: () => _onTabSelected(5),
        onNavigateToHabits: () => _onTabSelected(1),
      ),
      const HabitsView(),
      const ScheduleView(),
      const NotesView(),
      const CurriculumView(),
      const BudgetView(),
    ];

    return Scaffold(
      backgroundColor: AppColors.bgMain,
      appBar: AppBar(
        title: Row(
          children: [
            // Glowing brand dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryLight.withOpacity(0.6),
                    blurRadius: 8,
                    spreadRadius: 2,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'Pocketsly',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 18,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                _viewTitles[_currentTabIndex].split(' ').first.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {
              BudgetEntrySheet.show(context, onSaved: () {
                setState(() {});
              });
            },
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primaryLight),
            tooltip: 'Quick Entry',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(
        index: _currentTabIndex,
        children: views,
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentTabIndex,
        onTabSelected: _onTabSelected,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/design_system.dart';
import 'core/network/api_client.dart';
import 'core/models/models.dart';
import 'widgets/bottom_nav_bar.dart';
import 'widgets/pomodoro_timer_dialog.dart';
import 'widgets/command_search_dialog.dart';
import 'views/auth/auth_profile_sheet.dart';
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
      systemNavigationBarColor: AppSemanticColors.bgMain,
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
  int _refreshKey = 0;

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

  void _refreshAllViews() {
    setState(() {
      _refreshKey++;
    });
  }

  void _openAuthProfile() {
    AuthProfileSheet.show(context, onStateChanged: _refreshAllViews);
  }

  @override
  Widget build(BuildContext context) {
    final views = [
      DashboardView(
        key: ValueKey('dash_$_refreshKey'),
        onNavigateToBudget: () => _onTabSelected(5),
        onNavigateToHabits: () => _onTabSelected(1),
        onNavigateToNotes: () => _onTabSelected(3),
        onOpenProfile: _openAuthProfile,
      ),
      HabitsView(key: ValueKey('habits_$_refreshKey')),
      ScheduleView(key: ValueKey('schedule_$_refreshKey')),
      NotesView(key: ValueKey('notes_$_refreshKey')),
      CurriculumView(key: ValueKey('curr_$_refreshKey')),
      BudgetView(key: ValueKey('budget_$_refreshKey')),
    ];

    return Scaffold(
      backgroundColor: AppSemanticColors.bgMain,
      appBar: AppBar(
        titleSpacing: AppSpacing.md,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryLight.withAlpha(180),
                    blurRadius: 8,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Pocketsly',
              style: AppTypography.h3.copyWith(
                color: AppSemanticColors.textPrimary,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(40),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: AppColors.primaryLight.withAlpha(60)),
              ),
              child: Text(
                _viewTitles[_currentTabIndex].split(' ').first.toUpperCase(),
                style: AppTypography.overline.copyWith(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
        actions: [
          // Global Quick Search
          IconButton(
            onPressed: () => CommandSearchDialog.show(
              context,
              onNavigate: _onTabSelected,
              onOpenProfile: _openAuthProfile,
              onOpenQuickEntry: () => BudgetEntrySheet.show(context, onSaved: _refreshAllViews),
            ),
            padding: const EdgeInsets.all(AppSpacing.sm),
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            icon: const Icon(Icons.search_rounded, size: 20),
            tooltip: 'Global Quick Search',
          ),
          // Pomodoro Focus Timer Icon
          IconButton(
            onPressed: () => PomodoroTimerDialog.show(context),
            padding: const EdgeInsets.all(AppSpacing.sm),
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            icon: const Icon(Icons.timer_outlined, size: 20),
            tooltip: 'Pomodoro Focus Timer',
          ),
          const SizedBox(width: AppSpacing.xs),
          // User Profile & Login Button
          ValueListenableBuilder<UserModel?>(
            valueListenable: ApiClient.instance.currentUserNotifier,
            builder: (context, user, _) {
              final isAuth = user != null;
              final isDemo = user?.id == 999;
              return InkWell(
                onTap: _openAuthProfile,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xs,
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isAuth
                              ? (isDemo ? AppSemanticColors.warning : AppSemanticColors.primary)
                              : AppSemanticColors.bgSurfaceAlt,
                          border: Border.all(
                            color: isAuth
                                ? (isDemo ? AppSemanticColors.warning : AppSemanticColors.primaryLight)
                                : AppSemanticColors.border,
                            width: 1.5,
                          ),
                          boxShadow: isAuth
                              ? [
                                  BoxShadow(
                                    color: (isDemo
                                            ? AppSemanticColors.warning
                                            : AppSemanticColors.primaryLight)
                                        .withAlpha(100),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  ),
                                ]
                              : null,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          isAuth
                              ? (user.username.isNotEmpty
                                  ? user.username[0].toUpperCase()
                                  : 'U')
                              : '?',
                          style: AppTypography.caption.copyWith(
                            color: isAuth ? Colors.white : AppSemanticColors.textSecondary,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      if (!isAuth) ...[
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          'Sign In',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.primaryLight,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
      body: IndexedStack(
        index: _currentTabIndex,
        children: views,
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentTabIndex,
        onTabSelected: _onTabSelected,
        onQuickAction: () {
          BudgetEntrySheet.show(context, onSaved: _refreshAllViews);
        },
      ),
    );
  }
}
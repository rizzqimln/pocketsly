/// Cloudflare 24/7 Edge Server & API Endpoint Definitions
class ApiEndpoints {
  ApiEndpoints._();

  /// 24/7 Serverless Edge Production Base URL (Cloudflare Pages + D1)
  static const String productionBaseUrl = 'https://pocketsly.pages.dev/api';

  /// Local Development Base URL (Python server or local proxy)
  static const String localBaseUrl = 'http://10.0.2.2:8000/api'; // Android emulator localhost

  /// Active Base URL
  static String baseUrl = productionBaseUrl;

  // ── Authentication ────────────────────────────────────────────────────────
  static String get login => '$baseUrl/login';
  static String get register => '$baseUrl/register';
  static String get logout => '$baseUrl/logout';
  static String get session => '$baseUrl/session';
  static String get profile => '$baseUrl/profile';

  // ── Tasks & Habits ────────────────────────────────────────────────────────
  static String get tasks => '$baseUrl/tasks';
  static String task(int id) => '$baseUrl/tasks/$id';
  static String taskToggle(int id) => '$baseUrl/tasks/$id/toggle';

  static String get habits => '$baseUrl/habits';
  static String habit(int id) => '$baseUrl/habits/$id';
  static String habitToggle(int id) => '$baseUrl/habits/$id/toggle';

  // ── Schedule & Notes ──────────────────────────────────────────────────────
  static String get schedules => '$baseUrl/schedules';
  static String schedule(int id) => '$baseUrl/schedules/$id';

  static String get notes => '$baseUrl/notes';
  static String note(int id) => '$baseUrl/notes/$id';
  static String get resources => '$baseUrl/resources';

  // ── Academic & Curriculum ─────────────────────────────────────────────────
  static String get courses => '$baseUrl/courses';
  static String course(int id) => '$baseUrl/courses/$id';
  static String get lecturers => '$baseUrl/lecturers';
  static String get studyLogs => '$baseUrl/study_logs';
  static String get curriculumSchema => '$baseUrl/curriculum/schema';
  static String get curriculumQuery => '$baseUrl/curriculum/query';

  // ── Monthly Budget & Cash Flow ────────────────────────────────────────────
  static String get incomes => '$baseUrl/incomes';
  static String income(int id) => '$baseUrl/incomes/$id';

  static String get expenses => '$baseUrl/expenses';
  static String expense(int id) => '$baseUrl/expenses/$id';

  static String get budgets => '$baseUrl/budgets';
  static String budget(int id) => '$baseUrl/budgets/$id';

  static String get receiptScan => '$baseUrl/receipt/scan';
}

/// Cloudflare 24/7 Edge Server & Local API Endpoint Definitions
class ApiEndpoints {
  ApiEndpoints._();

  /// 24/7 Serverless Edge Production Base URL (Cloudflare Pages + D1)
  static const String productionBaseUrl = 'https://pocketsly.pages.dev/api';

  /// Android Emulator Loopback Base URL (Python server on host machine)
  static const String emulatorBaseUrl = 'http://10.0.2.2:8000/api';

  /// Localhost / iOS Simulator / Desktop Base URL
  static const String localhostBaseUrl = 'http://127.0.0.1:8000/api';

  /// Local Development Base URL alias for backwards compatibility
  static const String localBaseUrl = emulatorBaseUrl;

  /// Active Base URL
  static String baseUrl = productionBaseUrl;

  /// Helper to sanitize and normalize server base URLs entered by the user
  static String normalizeBaseUrl(String input) {
    String trimmed = input.trim();
    if (trimmed.isEmpty) return productionBaseUrl;

    // Auto prepend scheme if missing
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      if (trimmed.startsWith('localhost') || trimmed.startsWith('10.') || trimmed.startsWith('192.') || trimmed.startsWith('127.')) {
        trimmed = 'http://$trimmed';
      } else {
        trimmed = 'https://$trimmed';
      }
    }

    // Strip trailing slash
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }

    // Ensure /api suffix exists
    if (!trimmed.endsWith('/api')) {
      trimmed = '$trimmed/api';
    }

    return trimmed;
  }

  // ── Diagnostics & Health ──────────────────────────────────────────────────
  static String get health => '$baseUrl/health';

  // ── Authentication ────────────────────────────────────────────────────────
  static String get login => '$baseUrl/login';
  static String get register => '$baseUrl/register';
  static String get logout => '$baseUrl/logout';
  static String get session => '$baseUrl/session';
  static String get profile => '$baseUrl/profile';
  static String get requestOtp => '$baseUrl/request-otp';
  static String get resetPassword => '$baseUrl/reset-password';

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
  static String resource(int id) => '$baseUrl/resources/$id';

  // ── Academic & Curriculum ─────────────────────────────────────────────────
  static String get courses => '$baseUrl/courses';
  static String course(int id) => '$baseUrl/courses/$id';
  static String get lecturers => '$baseUrl/lecturers';
  static String lecturer(int id) => '$baseUrl/lecturers/$id';
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
  static String get backupExport => '$baseUrl/backup/export';
  static String get backupImport => '$baseUrl/backup/import';
}

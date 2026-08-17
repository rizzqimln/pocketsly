import 'package:flutter_test/flutter_test.dart';
import 'package:pocketsly_mobile/core/models/models.dart';
import 'package:pocketsly_mobile/core/network/api_endpoints.dart';

void main() {
  group('Pocketsly Models Serialization Tests', () {
    test('UserModel serialization', () {
      final json = {
        'id': 1,
        'username': 'alex_student',
        'email': 'alex@example.com',
        'phone': '+62812345678',
        'currency': 'IDR',
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 1);
      expect(user.username, 'alex_student');
      expect(user.email, 'alex@example.com');
      expect(user.currency, 'IDR');

      final out = user.toJson();
      expect(out['username'], 'alex_student');
      expect(out['currency'], 'IDR');
    });

    test('NoteItem with mood serialization', () {
      final json = {
        'id': 10,
        'title': 'Operating Systems Lecture',
        'body': 'Virtual memory paging and TLB caching concepts.',
        'mood': 'productive',
        'tags': 'productive',
        'updated_at': '2026-08-16',
      };
      final note = NoteItem.fromJson(json);
      expect(note.id, 10);
      expect(note.title, 'Operating Systems Lecture');
      expect(note.content, 'Virtual memory paging and TLB caching concepts.');
      expect(note.mood, 'productive');
      expect(note.updatedAt, '2026-08-16');

      final out = note.toJson();
      expect(out['mood'], 'productive');
    });

    test('TaskItem and HabitItem serialization', () {
      final taskJson = {
        'id': 5,
        'title': 'Homework 2',
        'done': 1,
        'priority': 'high',
        'due_date': '2026-08-17',
      };
      final task = TaskItem.fromJson(taskJson);
      expect(task.done, true);
      expect(task.priority, 'high');

      final habitJson = {
        'id': 3,
        'title': 'Code 1 Hour',
        'today_done': 1,
        'week_logs': [
          {'date': '2026-08-11', 'done': 0},
          {'date': '2026-08-12', 'done': 0},
          {'date': '2026-08-13', 'done': 1},
          {'date': '2026-08-14', 'done': 1},
          {'date': '2026-08-15', 'done': 1},
          {'date': '2026-08-16', 'done': 1},
          {'date': '2026-08-17', 'done': 1},
        ],
      };
      final habit = HabitItem.fromJson(habitJson);
      expect(habit.name, 'Code 1 Hour');
      expect(habit.streak, 5);
      expect(habit.completedToday, true);

      final noStreak = HabitItem.fromJson({
        'id': 4,
        'title': 'Meditate',
        'today_done': 0,
        'week_logs': [
          {'date': '2026-08-17', 'done': 1},
        ],
      });
      expect(noStreak.completedToday, false);
      expect(noStreak.streak, 1);
    });

    test('TransactionItem and BudgetLimitItem serialization', () {
      final expJson = {
        'id': 101,
        'amount': 25000,
        'category': 'Food & Dining',
        'expense_date': '2026-08-16',
        'description': '[Cash] Lunch with classmates',
      };
      final tx = TransactionItem.fromJson(expJson, 'expense');
      expect(tx.isIncome, false);
      expect(tx.amount, 25000.0);
      expect(tx.categoryOrSource, 'Food & Dining');

      final limit = BudgetLimitItem.fromJson({
        'id': 1,
        'category': 'Food & Dining',
        'amount': 1500000,
        'month_year': '2026-08',
      });
      expect(limit.amount, 1500000.0);
      expect(limit.category, 'Food & Dining');
      expect(limit.month, '2026-08');
    });

    test('ScheduleItem day mapping matches backend (0=Monday)', () {
      final monday = ScheduleItem.fromJson({
        'id': 1,
        'day_of_week': 0,
        'time': '08:00 - 10:00',
        'subject': 'Operating Systems',
        'room': 'Lab 3',
        'lecturer': 'Prof. Dewi',
      });
      expect(monday.day, 'Monday');

      final sunday = ScheduleItem.fromJson({
        'id': 2,
        'day_of_week': 6,
        'time': '13:00 - 15:00',
        'subject': 'AI Ethics',
        'room': 'R205',
        'lecturer': 'Dr. Budi',
      });
      expect(sunday.day, 'Sunday');
    });
  });

  group('ApiEndpoints Verification', () {
    test('Endpoints build correct URLs', () {
      expect(ApiEndpoints.login, '${ApiEndpoints.baseUrl}/login');
      expect(ApiEndpoints.register, '${ApiEndpoints.baseUrl}/register');
      expect(ApiEndpoints.task(42), '${ApiEndpoints.baseUrl}/tasks/42');
      expect(ApiEndpoints.note(7), '${ApiEndpoints.baseUrl}/notes/7');
      expect(ApiEndpoints.expense(99), '${ApiEndpoints.baseUrl}/expenses/99');
    });
  });
}

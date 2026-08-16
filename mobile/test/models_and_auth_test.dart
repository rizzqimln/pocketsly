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
        'content': 'Virtual memory paging and TLB caching concepts.',
        'mood': 'productive',
        'tags': 'productive',
        'updated_at': '2026-08-16',
      };
      final note = NoteItem.fromJson(json);
      expect(note.id, 10);
      expect(note.title, 'Operating Systems Lecture');
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
        'name': 'Code 1 Hour',
        'category': 'Deep Work',
        'streak': 12,
        'completed_today': true,
      };
      final habit = HabitItem.fromJson(habitJson);
      expect(habit.streak, 12);
      expect(habit.completedToday, true);
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
        'month': '2026-08',
      });
      expect(limit.amount, 1500000.0);
      expect(limit.category, 'Food & Dining');
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

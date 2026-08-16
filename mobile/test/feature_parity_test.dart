import 'package:flutter_test/flutter_test.dart';
import 'package:pocketsly_mobile/core/models/models.dart';
import 'package:pocketsly_mobile/views/curriculum/interactive_quiz_view.dart';

void main() {
  group('Feature Parity & Model Unit Tests', () {
    test('QuizQuestion model data integrity', () {
      const q = QuizQuestion(
        question: 'What is O(1) complexity?',
        options: ['Constant', 'Linear', 'Quadratic', 'Logarithmic'],
        answer: 0,
        explanation: 'Constant time operations execute in fixed time regardless of input size.',
      );

      expect(q.question, isNotEmpty);
      expect(q.options.length, 4);
      expect(q.answer, 0);
      expect(q.explanation, contains('Constant'));
    });

    test('CourseItem and StudyLogItem serialization', () {
      final courseJson = {
        'id': 10,
        'title': 'Operating Systems',
        'code': 'CS-302',
        'credits': 4,
        'lecturer': 'Dr. Andrew Tanenbaum',
      };
      final course = CourseItem.fromJson(courseJson);
      expect(course.id, 10);
      expect(course.name, 'Operating Systems');
      expect(course.credits, 4);

      final logJson = {
        'id': 101,
        'course_id': 10,
        'course_name': 'Operating Systems',
        'hours': 3.5,
        'notes': 'Process Scheduling and Threads',
        'date': '2026-08-16',
      };
      final log = StudyLogItem.fromJson(logJson);
      expect(log.id, 101);
      expect(log.hours, 3.5);
      expect(log.notes, contains('Scheduling'));
    });

    test('Receipt Text Total Amount Extraction regex test', () {
      const receiptText = "SUPERMARKET\nOat Milk Rp 42.000\nBread Rp 25.000\nTOTAL: Rp 67.000";
      final totalReg = RegExp(r'(?:total|amount|due|rp)[\s:]*(?:rp\.?)?\s*([0-9.,]+)', caseSensitive: false);
      double extracted = 0.0;

      for (final line in receiptText.split('\n')) {
        final match = totalReg.firstMatch(line);
        if (match != null) {
          final raw = match.group(1)!.replaceAll('.', '').replaceAll(',', '');
          final p = double.tryParse(raw);
          if (p != null && p > extracted) extracted = p;
        }
      }

      expect(extracted, 67000.0);
    });
  });
}

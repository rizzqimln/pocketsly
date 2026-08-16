/// Task Item Model
class TaskItem {
  final int id;
  final String title;
  final bool done;
  final String priority;
  final String dueDate;

  TaskItem({
    required this.id,
    required this.title,
    required this.done,
    this.priority = 'medium',
    this.dueDate = '',
  });

  factory TaskItem.fromJson(Map<String, dynamic> json) {
    return TaskItem(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      done: json['done'] == 1 || json['done'] == true,
      priority: json['priority'] as String? ?? 'medium',
      dueDate: json['due_date'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'done': done ? 1 : 0,
    'priority': priority,
    'due_date': dueDate,
  };
}

/// Habit Item Model
class HabitItem {
  final int id;
  final String name;
  final String category;
  final int streak;
  final bool completedToday;

  HabitItem({
    required this.id,
    required this.name,
    this.category = 'Daily',
    this.streak = 0,
    this.completedToday = false,
  });

  factory HabitItem.fromJson(Map<String, dynamic> json) {
    return HabitItem(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      category: json['category'] as String? ?? 'Daily',
      streak: json['streak'] as int? ?? 0,
      completedToday: json['completed_today'] == true || json['completed_today'] == 1,
    );
  }
}

/// Timetable / Schedule Item Model
class ScheduleItem {
  final int id;
  final String day;
  final String time;
  final String subject;
  final String room;
  final String lecturer;

  ScheduleItem({
    required this.id,
    required this.day,
    required this.time,
    required this.subject,
    this.room = '',
    this.lecturer = '',
  });

  factory ScheduleItem.fromJson(Map<String, dynamic> json) {
    return ScheduleItem(
      id: json['id'] as int? ?? 0,
      day: json['day'] as String? ?? 'Monday',
      time: json['time'] as String? ?? '08:00 - 10:00',
      subject: json['subject'] as String? ?? '',
      room: json['room'] as String? ?? '',
      lecturer: json['lecturer'] as String? ?? '',
    );
  }
}

/// Note Item Model
class NoteItem {
  final int id;
  final String title;
  final String content;
  final String tags;
  final String updatedAt;

  NoteItem({
    required this.id,
    required this.title,
    required this.content,
    this.tags = '',
    this.updatedAt = '',
  });

  factory NoteItem.fromJson(Map<String, dynamic> json) {
    return NoteItem(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      tags: json['tags'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
    );
  }
}

/// Academic Resource / Journal Model
class ResourceItem {
  final int id;
  final String title;
  final String author;
  final String type;
  final String category;
  final String url;
  final String summary;

  ResourceItem({
    required this.id,
    required this.title,
    this.author = '',
    this.type = 'article',
    this.category = 'frontend',
    this.url = '',
    this.summary = '',
  });

  factory ResourceItem.fromJson(Map<String, dynamic> json) {
    return ResourceItem(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      author: json['author'] as String? ?? '',
      type: json['type'] as String? ?? 'article',
      category: json['category'] as String? ?? 'frontend',
      url: json['url'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
    );
  }
}

/// Transaction (Income & Expense) Model
class TransactionItem {
  final int id;
  final String type; // 'income' or 'expense'
  final double amount;
  final String categoryOrSource;
  final String date;
  final String description;

  TransactionItem({
    required this.id,
    required this.type,
    required this.amount,
    required this.categoryOrSource,
    required this.date,
    this.description = '',
  });

  bool get isIncome => type == 'income';

  factory TransactionItem.fromJson(Map<String, dynamic> json, String type) {
    return TransactionItem(
      id: json['id'] as int? ?? 0,
      type: type,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      categoryOrSource: (type == 'income' ? json['source'] : json['category']) as String? ?? 'General',
      date: (type == 'income' ? json['income_date'] : json['expense_date']) as String? ?? '',
      description: json['description'] as String? ?? '',
    );
  }
}

/// Budget Monthly Category Limit Target Model
class BudgetLimitItem {
  final int id;
  final String category;
  final double amount;
  final String month;

  BudgetLimitItem({
    required this.id,
    required this.category,
    required this.amount,
    required this.month,
  });

  factory BudgetLimitItem.fromJson(Map<String, dynamic> json) {
    return BudgetLimitItem(
      id: json['id'] as int? ?? 0,
      category: json['category'] as String? ?? 'General',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      month: json['month'] as String? ?? '',
    );
  }
}

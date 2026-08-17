/// User Profile Model
class UserModel {
  final int id;
  final String username;
  final String email;
  final String phone;
  final String currency;

  UserModel({
    required this.id,
    required this.username,
    this.email = '',
    this.phone = '',
    this.currency = 'IDR',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int? ?? 0,
      username: json['username'] as String? ?? 'User',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      currency: json['currency'] as String? ?? 'IDR',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'email': email,
    'phone': phone,
    'currency': currency,
  };
}

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
    final weekLogs = json['week_logs'] as List? ?? [];
    var streak = 0;
    for (final entry in weekLogs.reversed) {
      final e = entry as Map<String, dynamic>;
      if (e['done'] == 1 || e['done'] == true) {
        streak++;
      } else {
        break;
      }
    }
    return HabitItem(
      id: json['id'] as int? ?? 0,
      name: json['title'] as String? ?? (json['name'] as String? ?? ''),
      category: json['category'] as String? ?? '',
      streak: streak,
      completedToday: json['today_done'] == 1 || json['today_done'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': name,
    'category': category,
    'streak': streak,
    'completed_today': completedToday,
  };
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
    String dayStr = 'Monday';
    final rawDay = json['day_of_week'] ?? json['day'];
    if (rawDay is int || rawDay is num) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      final idx = (rawDay as num).toInt();
      if (idx >= 0 && idx < days.length) {
        dayStr = days[idx];
      }
    } else if (rawDay is String && rawDay.isNotEmpty) {
      dayStr = rawDay;
    }

    String timeStr = '08:00 - 10:00';
    if (json['time'] is String && (json['time'] as String).isNotEmpty) {
      timeStr = json['time'] as String;
    } else if (json['start_time'] != null) {
      timeStr = '${json['start_time']} - ${json['end_time'] ?? ""}';
    }

    return ScheduleItem(
      id: json['id'] as int? ?? 0,
      day: dayStr,
      time: timeStr,
      subject: json['subject'] as String? ?? (json['title'] as String? ?? ''),
      room: json['room'] as String? ?? (json['location'] as String? ?? ''),
      lecturer: json['lecturer'] as String? ?? (json['lecturer_name'] as String? ?? ''),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'day': day,
    'time': time,
    'subject': subject,
    'room': room,
    'lecturer': lecturer,
  };
}

/// Note Item Model
class NoteItem {
  final int id;
  final String title;
  final String content;
  final String tags;
  final String mood;
  final String updatedAt;

  NoteItem({
    required this.id,
    required this.title,
    required this.content,
    this.tags = '',
    this.mood = 'neutral',
    this.updatedAt = '',
  });

  factory NoteItem.fromJson(Map<String, dynamic> json) {
    return NoteItem(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      content: json['body'] as String? ?? (json['content'] as String? ?? ''),
      tags: json['tags'] as String? ?? '',
      mood: json['mood'] as String? ?? 'neutral',
      updatedAt: json['updated_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'content': content,
    'tags': tags,
    'mood': mood,
    'updated_at': updatedAt,
  };
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
      type: json['resource_type'] as String? ?? (json['type'] as String? ?? 'article'),
      category: json['category'] as String? ?? 'frontend',
      url: json['url_or_path'] as String? ?? (json['url'] as String? ?? ''),
      summary: json['notes'] as String? ?? (json['summary'] as String? ?? ''),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'author': author,
    'type': type,
    'category': category,
    'url': url,
    'summary': summary,
  };
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
      month: json['month_year'] as String? ?? (json['month'] as String? ?? ''),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'category': category,
    'amount': amount,
    'month': month,
  };
}

/// Course Item Model
class CourseItem {
  final int id;
  final String code;
  final String name;
  final int credits;
  final String lecturer;
  final double progress;

  CourseItem({
    required this.id,
    required this.code,
    required this.name,
    this.credits = 3,
    this.lecturer = '',
    this.progress = 0.0,
  });

  factory CourseItem.fromJson(Map<String, dynamic> json) {
    return CourseItem(
      id: json['id'] as int? ?? 0,
      code: json['code'] as String? ?? '',
      name: (json['name'] as String?) ?? (json['title'] as String? ?? ''),
      credits: (json['credits'] as num?)?.toInt() ?? 3,
      lecturer: json['lecturer'] as String? ?? '',
      progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Lecturer Directory Item Model
class LecturerItem {
  final int id;
  final String name;
  final String email;
  final String office;
  final String department;

  LecturerItem({
    required this.id,
    required this.name,
    this.email = '',
    this.office = '',
    this.department = 'Computer Science',
  });

  factory LecturerItem.fromJson(Map<String, dynamic> json) {
    return LecturerItem(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      office: json['office'] as String? ?? '',
      department: json['department'] as String? ?? 'Computer Science',
    );
  }
}

/// Study Session Log Item Model
class StudyLogItem {
  final int id;
  final int? courseId;
  final String courseName;
  final double hours;
  final String notes;
  final String date;

  StudyLogItem({
    required this.id,
    this.courseId,
    this.courseName = '',
    this.hours = 1.0,
    this.notes = '',
    this.date = '',
  });

  factory StudyLogItem.fromJson(Map<String, dynamic> json) {
    return StudyLogItem(
      id: json['id'] as int? ?? 0,
      courseId: json['course_id'] as int?,
      courseName: json['course_name'] as String? ?? (json['course_title'] as String? ?? ''),
      hours: (json['hours'] as num?)?.toDouble() ?? 1.0,
      notes: json['notes'] as String? ?? '',
      date: json['date'] as String? ?? (json['log_date'] as String? ?? ''),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'course_id': courseId,
    'course_name': courseName,
    'hours': hours,
    'notes': notes,
    'date': date,
  };
}

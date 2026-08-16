import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/glass_card.dart';

class QuizQuestion {
  final String question;
  final List<String> options;
  final int answer;
  final String explanation;

  const QuizQuestion({
    required this.question,
    required this.options,
    required this.answer,
    required this.explanation,
  });
}

class InteractiveQuizView extends StatefulWidget {
  const InteractiveQuizView({super.key});

  @override
  State<InteractiveQuizView> createState() => _InteractiveQuizViewState();
}

class _InteractiveQuizViewState extends State<InteractiveQuizView> {
  int _currentIndex = 0;
  int? _selectedOption;
  bool _answered = false;
  int _score = 0;
  bool _quizCompleted = false;

  final List<QuizQuestion> _questions = const [
    QuizQuestion(
      question: "Which of the following is correct regarding relational databases?",
      options: [
        "Tables cannot have foreign key relationships with each other.",
        "A Primary Key must be unique and cannot be NULL.",
        "SQLite does not support any constraints like UNIQUE or NOT NULL.",
        "SQL stands for Simple Query Language."
      ],
      answer: 1,
      explanation: "A Primary Key uniquely identifies each record in a table, and SQL stands for Structured Query Language.",
    ),
    QuizQuestion(
      question: "In CSS Flexbox, which property aligns flex items along the main axis?",
      options: [
        "align-items",
        "justify-content",
        "flex-direction",
        "align-content"
      ],
      answer: 1,
      explanation: "'justify-content' aligns flex items along the main axis, while 'align-items' aligns them along the cross axis.",
    ),
    QuizQuestion(
      question: "What is the time complexity of a Bubble Sort algorithm in its worst case?",
      options: [
        "O(n log n)",
        "O(1)",
        "O(n²)",
        "O(n)"
      ],
      answer: 2,
      explanation: "Bubble Sort compares adjacent elements and swaps them, leading to nested loop behavior resulting in O(n²) time complexity.",
    ),
    QuizQuestion(
      question: "Which HTTP status code represents a successful resource creation in REST API design?",
      options: [
        "200 OK",
        "201 Created",
        "400 Bad Request",
        "404 Not Found"
      ],
      answer: 1,
      explanation: "The HTTP 201 Created status code indicates that the request has succeeded and led to the creation of a new resource.",
    ),
    QuizQuestion(
      question: "In SQL, what does a LEFT JOIN return?",
      options: [
        "Only rows that match in both tables.",
        "All rows from the left table, and matching rows from the right table.",
        "All rows from both tables regardless of match.",
        "Only records that have NULL primary keys."
      ],
      answer: 1,
      explanation: "A LEFT JOIN returns all records from the left table, and matching records from the right table. Non-matching right columns are NULL.",
    ),
    QuizQuestion(
      question: "Which of the following describes a foreign key constraint?",
      options: [
        "It prevents passwords from being leaked.",
        "It speeds up SELECT queries on indexes.",
        "It links a column in one table to the primary key of another table to maintain referential integrity.",
        "It automatically hashes passwords during INSERTs."
      ],
      answer: 2,
      explanation: "A foreign key enforces referential integrity between two related tables in a relational database.",
    ),
    QuizQuestion(
      question: "In Modern JavaScript (ES6+), what is the purpose of async/await?",
      options: [
        "To make JavaScript run synchronously on a single CPU core.",
        "To write asynchronous Promises in a clean, synchronous-looking format.",
        "To compile JavaScript into WebAssembly.",
        "To force DOM elements to re-render without CSS."
      ],
      answer: 1,
      explanation: "async/await acts as syntactic sugar over Promises, making asynchronous code easier to read and maintain.",
    ),
    QuizQuestion(
      question: "In Python and SQLite, which technique is used to prevent SQL Injection vulnerability?",
      options: [
        "Executing queries with raw string concatenation.",
        "Using parameterized queries (? or %s placeholders) to separate SQL code from user inputs.",
        "Encoding SQL queries in base64 before executing.",
        "Turning off database transactions."
      ],
      answer: 1,
      explanation: "Parameterized queries ensure that user inputs are treated strictly as data parameters rather than executable SQL code.",
    ),
  ];

  void _selectOption(int index) {
    if (_answered) return;
    setState(() {
      _selectedOption = index;
      _answered = true;
      if (index == _questions[_currentIndex].answer) {
        _score++;
      }
    });
  }

  void _nextQuestion() {
    if (_currentIndex < _questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedOption = null;
        _answered = false;
      });
    } else {
      setState(() {
        _quizCompleted = true;
      });
    }
  }

  void _restartQuiz() {
    setState(() {
      _currentIndex = 0;
      _selectedOption = null;
      _answered = false;
      _score = 0;
      _quizCompleted = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_quizCompleted) {
      final percentage = ((_score / _questions.length) * 100).toInt();
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GlassCard(
            padding: const EdgeInsets.all(24),
            borderRadius: 22,
            gradient: AppColors.heroGradient,
            border: Border.all(color: AppColors.primaryLight.withAlpha(80)),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withAlpha(50),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primaryLight, width: 2),
                  ),
                  child: const Icon(Icons.emoji_events_rounded, color: AppColors.orange, size: 36),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Quiz Completed! 🎉',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Text(
                  'You scored $_score out of ${_questions.length} ($percentage%)',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 18),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: _score / _questions.length,
                    minHeight: 8,
                    backgroundColor: AppColors.bgSurfaceAlt,
                    valueColor: AlwaysStoppedAnimation<Color>(percentage >= 75 ? AppColors.success : AppColors.primaryLight),
                  ),
                ),
                const SizedBox(height: 22),
                ElevatedButton.icon(
                  onPressed: _restartQuiz,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Retake CS Quiz', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ],
            ),
          ),
        ],
      );
    }

    final q = _questions[_currentIndex];
    final progress = (_currentIndex + 1) / _questions.length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Progress & Score Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'QUESTION ${_currentIndex + 1} OF ${_questions.length}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(35),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: AppColors.primaryLight.withAlpha(60)),
              ),
              child: Text(
                'Score: $_score',
                style: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 6,
            backgroundColor: AppColors.bgSurfaceAlt,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
          ),
        ),
        const SizedBox(height: 16),

        // Question Card
        GlassCard(
          padding: const EdgeInsets.all(18),
          borderRadius: 20,
          child: Text(
            q.question,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w800,
              height: 1.4,
            ),
          ),
        ),
        const SizedBox(height: 14),

        // Options List
        ...List.generate(q.options.length, (index) {
          final isSelected = _selectedOption == index;
          final isCorrect = index == q.answer;
          Color borderColor = AppColors.border;
          Color bgColor = AppColors.bgSurface;
          Color textColor = AppColors.textPrimary;

          if (_answered) {
            if (isCorrect) {
              borderColor = AppColors.success;
              bgColor = AppColors.success.withAlpha(30);
              textColor = AppColors.success;
            } else if (isSelected) {
              borderColor = AppColors.danger;
              bgColor = AppColors.danger.withAlpha(30);
              textColor = AppColors.danger;
            }
          } else if (isSelected) {
            borderColor = AppColors.primaryLight;
            bgColor = AppColors.primary.withAlpha(40);
          }

          return GlassCard(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            borderRadius: 16,
            border: Border.all(color: borderColor, width: isSelected || (_answered && isCorrect) ? 1.5 : 1),
            color: bgColor,
            onTap: () => _selectOption(index),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: _answered && isCorrect
                        ? AppColors.success
                        : (_answered && isSelected ? AppColors.danger : AppColors.bgSurfaceAlt),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    String.fromCharCode(65 + index),
                    style: TextStyle(
                      color: _answered && (isCorrect || isSelected) ? Colors.white : AppColors.textSecondary,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    q.options[index],
                    style: TextStyle(color: textColor, fontSize: 13.5, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          );
        }),

        // Explanation Banner (when answered)
        if (_answered) ...[
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.bgSurfaceAlt,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline_rounded, color: AppColors.primaryLight, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    q.explanation,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _nextQuestion,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: Text(
              _currentIndex < _questions.length - 1 ? 'Next Question →' : 'View Results 🎉',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ],
    );
  }
}

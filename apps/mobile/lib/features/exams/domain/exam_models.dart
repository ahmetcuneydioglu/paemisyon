// Deneme (randevulu canlı sınav) domain modelleri — ortak /exams API (Doc 18).

import '../../quiz/domain/quiz_models.dart';

enum ExamState { upcoming, active, ended }

ExamState _stateFrom(String s) => switch (s) {
      'upcoming' => ExamState.upcoming,
      'active' => ExamState.active,
      _ => ExamState.ended,
    };

class ExamAttemptRef {
  final String id;
  final String status; // in_progress | completed | abandoned
  const ExamAttemptRef({required this.id, required this.status});

  factory ExamAttemptRef.fromJson(Map<String, dynamic> j) =>
      ExamAttemptRef(id: j['id'] as String, status: j['status'] as String);
}

class ExamListItem {
  final String id;
  final String title;
  final String? description;
  final DateTime startAt;
  final DateTime endAt;
  final int durationMinutes;
  final int questionCount;
  final bool isPremium;
  final bool questionsOpenAfterEnd;
  final ExamState state;
  final int participantCount;
  final double? avgScore;
  final ExamAttemptRef? myAttempt;

  const ExamListItem({
    required this.id,
    required this.title,
    this.description,
    required this.startAt,
    required this.endAt,
    required this.durationMinutes,
    required this.questionCount,
    required this.isPremium,
    required this.questionsOpenAfterEnd,
    required this.state,
    required this.participantCount,
    this.avgScore,
    this.myAttempt,
  });

  factory ExamListItem.fromJson(Map<String, dynamic> j) => ExamListItem(
        id: j['id'] as String,
        title: j['title'] as String,
        description: j['description'] as String?,
        startAt: DateTime.parse(j['startAt'] as String),
        endAt: DateTime.parse(j['endAt'] as String),
        durationMinutes: j['durationMinutes'] as int,
        questionCount: j['questionCount'] as int,
        isPremium: j['isPremium'] as bool? ?? false,
        questionsOpenAfterEnd: j['questionsOpenAfterEnd'] as bool? ?? true,
        state: _stateFrom(j['state'] as String),
        participantCount: j['participantCount'] as int? ?? 0,
        avgScore: (j['avgScore'] as num?)?.toDouble(),
        myAttempt: j['myAttempt'] != null
            ? ExamAttemptRef.fromJson(j['myAttempt'] as Map<String, dynamic>)
            : null,
      );
}

/// /exams/:id/start yanıtı — oturum + sabitlenmiş sorular + verilmiş cevaplar.
class StartedExam {
  final String sessionId; // = attemptId
  final String examId;
  final String title;
  final DateTime endsAt; // küresel pencere bitişi
  final bool liveAnswerReveal;
  final List<QuizQuestion> questions;
  final Map<String, String> givenAnswers; // questionId -> selectedOptionId

  const StartedExam({
    required this.sessionId,
    required this.examId,
    required this.title,
    required this.endsAt,
    required this.liveAnswerReveal,
    required this.questions,
    required this.givenAnswers,
  });

  factory StartedExam.fromJson(Map<String, dynamic> j) {
    final given = <String, String>{};
    for (final a in (j['givenAnswers'] as List<dynamic>? ?? const [])) {
      final m = a as Map<String, dynamic>;
      final sel = m['selectedOptionId'] as String?;
      if (sel != null) given[m['questionId'] as String] = sel;
    }
    return StartedExam(
      sessionId: j['sessionId'] as String,
      examId: j['examId'] as String,
      title: j['title'] as String,
      endsAt: DateTime.parse(j['endsAt'] as String),
      liveAnswerReveal: j['liveAnswerReveal'] as bool? ?? false,
      questions: (j['questions'] as List<dynamic>)
          .map((e) => QuizQuestion.fromJson(e as Map<String, dynamic>))
          .toList(),
      givenAnswers: given,
    );
  }
}

/// İnceleme sorusu — doğru cevap + kullanıcının seçimi (yalnız bitince gelir).
class ReviewQuestion {
  final int order;
  final String questionId;
  final String stem;
  final String? explanation;
  final List<ReviewOption> options;
  final String? selectedOptionId;

  const ReviewQuestion({
    required this.order,
    required this.questionId,
    required this.stem,
    this.explanation,
    required this.options,
    this.selectedOptionId,
  });

  factory ReviewQuestion.fromJson(Map<String, dynamic> j) => ReviewQuestion(
        order: j['order'] as int,
        questionId: j['questionId'] as String,
        stem: j['stem'] as String,
        explanation: j['explanation'] as String?,
        options: (j['options'] as List<dynamic>)
            .map((e) => ReviewOption.fromJson(e as Map<String, dynamic>))
            .toList(),
        selectedOptionId: j['selectedOptionId'] as String?,
      );
}

class ReviewOption {
  final String id;
  final String label;
  final String text;
  final bool isCorrect;
  const ReviewOption({
    required this.id,
    required this.label,
    required this.text,
    required this.isCorrect,
  });

  factory ReviewOption.fromJson(Map<String, dynamic> j) => ReviewOption(
        id: j['id'] as String,
        label: j['label'] as String,
        text: j['text'] as String,
        isCorrect: j['isCorrect'] as bool? ?? false,
      );
}

class AttemptResult {
  final String attemptId;
  final String examId;
  final String examTitle;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int blankCount;
  final double? score; // NET
  final int? durationSeconds;
  final List<ReviewQuestion> review;

  const AttemptResult({
    required this.attemptId,
    required this.examId,
    required this.examTitle,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.blankCount,
    this.score,
    this.durationSeconds,
    required this.review,
  });

  factory AttemptResult.fromJson(Map<String, dynamic> j) {
    final exam = j['exam'] as Map<String, dynamic>;
    return AttemptResult(
      attemptId: j['attemptId'] as String,
      examId: exam['id'] as String,
      examTitle: exam['title'] as String,
      totalQuestions: j['totalQuestions'] as int,
      correctCount: j['correctCount'] as int,
      wrongCount: j['wrongCount'] as int,
      blankCount: j['blankCount'] as int,
      score: (j['score'] as num?)?.toDouble(),
      durationSeconds: j['durationSeconds'] as int?,
      review: (j['review'] as List<dynamic>? ?? const [])
          .map((e) => ReviewQuestion.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ExamRankRow {
  final int rank;
  final String displayName;
  final int correctCount;
  final int wrongCount;
  final int blankCount;
  final double score;
  final int? durationSeconds;
  final bool isMe;

  const ExamRankRow({
    required this.rank,
    required this.displayName,
    required this.correctCount,
    required this.wrongCount,
    required this.blankCount,
    required this.score,
    this.durationSeconds,
    required this.isMe,
  });

  factory ExamRankRow.fromJson(Map<String, dynamic> j) => ExamRankRow(
        rank: j['rank'] as int,
        displayName: j['displayName'] as String? ?? 'Kullanıcı',
        correctCount: j['correctCount'] as int? ?? 0,
        wrongCount: j['wrongCount'] as int? ?? 0,
        blankCount: j['blankCount'] as int? ?? 0,
        score: (j['score'] as num?)?.toDouble() ?? 0,
        durationSeconds: j['durationSeconds'] as int?,
        isMe: j['isMe'] as bool? ?? false,
      );
}

class ExamLeaderboard {
  final bool available;
  final DateTime endAt;
  final List<ExamRankRow> top;
  final ExamRankRow? me;

  const ExamLeaderboard({
    required this.available,
    required this.endAt,
    required this.top,
    this.me,
  });

  factory ExamLeaderboard.fromJson(Map<String, dynamic> j) => ExamLeaderboard(
        available: j['available'] as bool? ?? false,
        endAt: DateTime.parse(j['endAt'] as String),
        top: (j['top'] as List<dynamic>? ?? const [])
            .map((e) => ExamRankRow.fromJson(e as Map<String, dynamic>))
            .toList(),
        me: j['me'] != null
            ? ExamRankRow.fromJson(j['me'] as Map<String, dynamic>)
            : null,
      );
}

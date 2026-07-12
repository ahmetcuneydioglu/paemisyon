// Quiz domain modelleri (Doc 7 §4.4, Doc 10 §2.5).

class QuizOption {
  final String id;
  final String label;
  final String text;
  const QuizOption({required this.id, required this.label, required this.text});

  factory QuizOption.fromJson(Map<String, dynamic> j) => QuizOption(
      id: j['id'] as String,
      label: j['label'] as String,
      text: j['text'] as String);
}

class QuizQuestion {
  final String questionId;
  final String versionId;
  final String stem;
  final String? mediaUrl;
  final List<QuizOption> options;

  const QuizQuestion({
    required this.questionId,
    required this.versionId,
    required this.stem,
    this.mediaUrl,
    required this.options,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> j) => QuizQuestion(
        questionId: j['questionId'] as String,
        versionId: j['versionId'] as String,
        stem: j['stem'] as String,
        mediaUrl: j['mediaUrl'] as String?,
        options: (j['options'] as List<dynamic>)
            .map((e) => QuizOption.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class StartedSession {
  final String sessionId;
  final String mode;
  final List<QuizQuestion> questions;

  const StartedSession(
      {required this.sessionId, required this.mode, required this.questions});

  factory StartedSession.fromJson(Map<String, dynamic> j) => StartedSession(
        sessionId: j['sessionId'] as String,
        mode: j['mode'] as String,
        questions: (j['questions'] as List<dynamic>)
            .map((e) => QuizQuestion.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Cevap yanıtı: practice'te dolu (isCorrect/correctOptionId/explanation),
/// exam'de yalnızca recorded=true (doğru cevap sızmaz).
class AnswerFeedback {
  final bool? isCorrect;
  final String? correctOptionId;
  final String? explanation;
  final String? legalReference;

  const AnswerFeedback(
      {this.isCorrect,
      this.correctOptionId,
      this.explanation,
      this.legalReference});

  factory AnswerFeedback.fromJson(Map<String, dynamic> j) => AnswerFeedback(
        isCorrect: j['isCorrect'] as bool?,
        correctOptionId: j['correctOptionId'] as String?,
        explanation: j['explanation'] as String?,
        legalReference: j['legalReference'] as String?,
      );
}

class QuizResult {
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int blankCount;
  final double score;
  final int durationSeconds;

  const QuizResult({
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.blankCount,
    required this.score,
    required this.durationSeconds,
  });

  factory QuizResult.fromJson(Map<String, dynamic> j) => QuizResult(
        totalQuestions: j['totalQuestions'] as int,
        correctCount: j['correctCount'] as int,
        wrongCount: j['wrongCount'] as int,
        blankCount: j['blankCount'] as int,
        score: (j['score'] as num).toDouble(),
        durationSeconds: j['durationSeconds'] as int,
      );
}

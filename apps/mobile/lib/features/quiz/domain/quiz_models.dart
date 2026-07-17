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

  /// Deneme sınavı süresi (sn) — exam modunda dolu; sayaç bundan çalışır.
  final int? plannedDurationSeconds;
  final List<QuizQuestion> questions;

  const StartedSession({
    required this.sessionId,
    required this.mode,
    this.plannedDurationSeconds,
    required this.questions,
  });

  factory StartedSession.fromJson(Map<String, dynamic> j) => StartedSession(
        sessionId: j['sessionId'] as String,
        mode: j['mode'] as String,
        plannedDurationSeconds: j['plannedDurationSeconds'] as int?,
        questions: (j['questions'] as List<dynamic>)
            .map((e) => QuizQuestion.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Deneme karnesinde konu bazlı kırılım satırı.
class TopicScore {
  final String topicName;
  final int correct;
  final int total;
  const TopicScore(
      {required this.topicName, required this.correct, required this.total});

  factory TopicScore.fromJson(Map<String, dynamic> j) => TopicScore(
        topicName: j['topicName'] as String,
        correct: j['correct'] as int,
        total: j['total'] as int,
      );
}

/// Cevap yanıtı: practice'te dolu (isCorrect/correctOptionId/explanation),
/// exam'de yalnızca recorded=true (doğru cevap sızmaz).
class AnswerFeedback {
  final bool? isCorrect;
  final String? correctOptionId;
  final String? explanation;
  final String? legalReference;

  /// Soru kaynağı (örn. "30 Kasım 2025 Adalet Bakanlığı GYS") — sunucu,
  /// panel ayarı kapalıysa null gönderir (istemci kural bilmez).
  final String? source;

  const AnswerFeedback(
      {this.isCorrect,
      this.correctOptionId,
      this.explanation,
      this.legalReference,
      this.source});

  factory AnswerFeedback.fromJson(Map<String, dynamic> j) => AnswerFeedback(
        isCorrect: j['isCorrect'] as bool?,
        correctOptionId: j['correctOptionId'] as String?,
        explanation: j['explanation'] as String?,
        legalReference: j['legalReference'] as String?,
        source: j['source'] as String?,
      );
}

/// Oturum bitince yeni kazanılan rozet (Doc 19) — sonuç ekranında kutlanır.
class EarnedBadge {
  final String key;
  final String name;
  final String description;
  const EarnedBadge({
    required this.key,
    required this.name,
    required this.description,
  });

  factory EarnedBadge.fromJson(Map<String, dynamic> j) => EarnedBadge(
        key: j['key'] as String,
        name: j['name'] as String,
        description: j['description'] as String? ?? '',
      );
}

class QuizResult {
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int blankCount;
  final double score;
  final int durationSeconds;
  final String? mode;

  /// Ders denemesinde konu bazlı karne (null = konu oturumu).
  final List<TopicScore>? topicBreakdown;

  /// Bu tamamlamayla kazanılan rozetler (Doc 19) — boş olabilir.
  final List<EarnedBadge> earnedBadges;

  const QuizResult({
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.blankCount,
    required this.score,
    required this.durationSeconds,
    this.mode,
    this.topicBreakdown,
    this.earnedBadges = const [],
  });

  factory QuizResult.fromJson(Map<String, dynamic> j) => QuizResult(
        totalQuestions: j['totalQuestions'] as int,
        correctCount: j['correctCount'] as int,
        wrongCount: j['wrongCount'] as int,
        blankCount: j['blankCount'] as int,
        score: (j['score'] as num).toDouble(),
        durationSeconds: j['durationSeconds'] as int,
        mode: j['mode'] as String?,
        topicBreakdown: (j['topicBreakdown'] as List<dynamic>?)
            ?.map((e) => TopicScore.fromJson(e as Map<String, dynamic>))
            .toList(),
        earnedBadges: (j['earnedBadges'] as List<dynamic>? ?? const [])
            .map((e) => EarnedBadge.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// AI koç açıklaması (Doc 24 §4 Faz 2).
class AiExplanation {
  final String text;
  final bool cached;

  /// Free kullanıcıda bugün kalan hak; premium/önbellekte null.
  final int? remainingToday;

  const AiExplanation(
      {required this.text, required this.cached, this.remainingToday});

  factory AiExplanation.fromJson(Map<String, dynamic> j) => AiExplanation(
        text: j['text'] as String,
        cached: j['cached'] as bool? ?? false,
        remainingToday: j['remainingToday'] as int?,
      );
}

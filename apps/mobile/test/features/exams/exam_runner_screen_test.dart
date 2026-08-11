import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/exams/data/exams_repository.dart';
import 'package:paemisyon/features/exams/domain/exam_models.dart';
import 'package:paemisyon/features/exams/presentation/exam_runner_screen.dart';
import 'package:paemisyon/features/quiz/data/quiz_repository.dart';
import 'package:paemisyon/features/quiz/domain/quiz_models.dart';

/// Canlı deneme oynatıcısı regresyonu: ekran açılır, şıklar DOKUNULABİLİR,
/// seçim sunucuya yazılır (kullanıcı raporu: "ekran donuk, soru seçilemiyor").
class _FakeExams extends ExamsRepository {
  _FakeExams() : super(Dio());

  @override
  Future<StartedExam> start(String examId) async => StartedExam(
        sessionId: 's1',
        examId: examId,
        title: 'Test Denemesi',
        endsAt: DateTime.now().add(const Duration(minutes: 30)),
        liveAnswerReveal: false,
        questions: [
          for (var i = 0; i < 3; i++)
            QuizQuestion(
              questionId: 'q$i',
              versionId: 'v$i',
              stem: 'Soru $i kökü',
              options: [
                for (final l in ['A', 'B', 'C', 'D'])
                  QuizOption(id: 'q$i$l', label: l, text: 'Şık $l'),
              ],
            ),
        ],
        givenAnswers: const {},
      );
}

class _FakeQuiz extends QuizRepository {
  _FakeQuiz() : super(Dio());
  final answered = <String>[];

  @override
  Future<AnswerFeedback> answer(
    String sessionId, {
    required String questionId,
    required String versionId,
    String? selectedOptionId,
    int? timeSpentMs,
  }) async {
    answered.add('$questionId:$selectedOptionId');
    return const AnswerFeedback();
  }
}

void main() {
  testWidgets('deneme açılır ve şık seçimi çalışır', (tester) async {
    final quiz = _FakeQuiz();
    await tester.pumpWidget(ProviderScope(
      overrides: [
        examsRepositoryProvider.overrideWithValue(_FakeExams()),
        quizRepositoryProvider.overrideWithValue(quiz),
      ],
      child: MaterialApp(
        theme: AppTheme.light,
        home: const ExamRunnerScreen(examId: 'e1'),
      ),
    ));
    await tester.pump(); // start() future
    await tester.pump(const Duration(seconds: 1)); // sayaç ilk tik

    expect(find.textContaining('Soru 0 kökü'), findsWidgets);
    // Şık dokunulabilir mi? (kullanıcı raporu: donuk ekran)
    await tester.tap(find.text('Şık B').first);
    await tester.pump();
    expect(quiz.answered, contains('q0:q0B'));
  });
}

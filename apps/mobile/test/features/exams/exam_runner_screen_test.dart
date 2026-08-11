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

/// Canlı deneme oynatıcısı: ekran açılır, şıklar DOKUNULABİLİR (donma
/// regresyonu), optik form navigatörü soruya atlar, bayrak işaretlenir.
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

  @override
  Future<({int active, int completed})> presence(String examId) async =>
      (active: 7, completed: 0);
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
  // Sayaç saniyede bir setState ettiği için pumpAndSettle ASLA dinginleşmez;
  // animasyonlar açık süre pump'larıyla ilerletilir.
  Future<void> settle(WidgetTester tester) async {
    for (var i = 0; i < 6; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  Future<_FakeQuiz> pumpRunner(WidgetTester tester) async {
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
    await tester.pump(const Duration(seconds: 1)); // sayaç + nabız ilk tik
    return quiz;
  }

  testWidgets('deneme açılır, şık seçimi çalışır, ilk cevapta ilerler',
      (tester) async {
    final quiz = await pumpRunner(tester);
    expect(find.textContaining('Soru 0 kökü'), findsOneWidget);
    expect(find.text('SORU 1 / 3'), findsOneWidget);

    await tester.tap(find.text('Şık B').first);
    await tester.pump();
    expect(quiz.answered, contains('q0:q0B'));

    // İlk cevaptan sonra otomatik sonraki soruya geçer (220 ms + animasyon).
    await settle(tester);
    expect(find.text('SORU 2 / 3'), findsOneWidget);
  });

  testWidgets('optik form navigatörü doluluk gösterir ve soruya atlar',
      (tester) async {
    await pumpRunner(tester);
    // 1. soruyu cevapla → sayaç 1/3 olur, otomatik 2. soruya geçer.
    await tester.tap(find.text('Şık A').first);
    await settle(tester);
    expect(find.text('1/3 dolu'), findsOneWidget);

    // Navigatörü aç, 3. soruya atla.
    await tester.tap(find.text('1/3 dolu'));
    await settle(tester);
    expect(find.text('Optik form'), findsOneWidget);
    expect(find.textContaining('dolu 1 · bayraklı 0 · boş 2'), findsOneWidget);
    await tester.tap(find.text('3'));
    await settle(tester);
    expect(find.text('SORU 3 / 3'), findsOneWidget);
  });

  testWidgets('bayrak işaretlenir ve sayaçta görünür', (tester) async {
    await pumpRunner(tester);
    await tester.tap(find.byTooltip('Emin değilim'));
    await settle(tester);
    expect(find.text('emin değilim'), findsOneWidget); // kart rozeti
    expect(find.text('· ⚑1'), findsOneWidget); // alt kumanda sayacı
  });
}

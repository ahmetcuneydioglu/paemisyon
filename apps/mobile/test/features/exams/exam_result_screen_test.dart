import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/exams/data/exams_repository.dart';
import 'package:paemisyon/features/exams/domain/exam_models.dart';
import 'package:paemisyon/features/exams/presentation/exam_result_screen.dart';

/// Deneme sonucu derin analizi (weble eşlik): kıyas satırı + konu kırılımı
/// (kaybettirenler üstte) + süre şeridi render olur.
const _result = AttemptResult(
  attemptId: 'a1',
  examId: 'e1',
  examTitle: 'PAEM Deneme 1',
  totalQuestions: 10,
  correctCount: 6,
  wrongCount: 3,
  blankCount: 1,
  score: 5.25,
  durationSeconds: 600,
  topicBreakdown: [
    AttemptTopicRow(
        topicId: 't1',
        topicName: 'Anayasa',
        correct: 4,
        wrong: 0,
        blank: 0,
        total: 4),
    AttemptTopicRow(
        topicId: 't2',
        topicName: 'PVSK',
        correct: 2,
        wrong: 3,
        blank: 1,
        total: 6),
  ],
  timing: [
    AttemptTiming(order: 1, timeSpentMs: 10000, status: 'correct'),
    AttemptTiming(order: 2, timeSpentMs: 45000, status: 'wrong'),
    AttemptTiming(order: 3, timeSpentMs: 8000, status: 'blank'),
  ],
  review: [],
);

void main() {
  testWidgets('kıyas + konu kırılımı + süre şeridi görünür', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        examAttemptProvider('a1').overrideWith((ref) async => _result),
        attemptDeltaProvider('a1').overrideWith((ref) async => 1.5),
      ],
      child: MaterialApp(
          theme: AppTheme.light, home: const ExamResultScreen(attemptId: 'a1')),
    ));
    await tester.pumpAndSettle();

    expect(find.text('geçen denemeden +1.50 net'), findsOneWidget);
    expect(find.text('KONU KIRILIMI — KAYBETTİRENLER ÜSTTE'), findsOneWidget);
    // Kayıp net = 3×1,25 + 1 = 4,75; kayıplı satırda "Kapat" butonu var.
    expect(find.textContaining('kayıp −4.75 net'), findsOneWidget);
    expect(find.text('Kapat'), findsOneWidget); // Anayasa kayıpsız → buton yok
    expect(find.text('SÜRE YÖNETİMİ'), findsOneWidget);
    // En yavaş soru işaretlenir (S2, 45 sn).
    expect(find.textContaining('En çok zaman yiyen: S2 (45 sn)'), findsOneWidget);
  });

  testWidgets('kıyas yoksa satır gizli; koyu tema hatasız', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        examAttemptProvider('a1').overrideWith((ref) async => _result),
        attemptDeltaProvider('a1').overrideWith((ref) async => null),
      ],
      child: MaterialApp(
          theme: AppTheme.dark, home: const ExamResultScreen(attemptId: 'a1')),
    ));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.textContaining('geçen denemeden'), findsNothing);
  });
}

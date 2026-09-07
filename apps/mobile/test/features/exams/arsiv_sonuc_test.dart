import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/exams/data/exams_repository.dart';
import 'package:paemisyon/features/exams/domain/exam_models.dart';
import 'package:paemisyon/features/exams/presentation/exam_result_screen.dart';

/// Arşivden çözülen sınav (çıkmış sınav dâhil) DENEME KARNESİNE düşer
/// (7 Eyl 2026 kullanıcı bildirimi): genel tur sonucu yalnız yanlışların
/// kökünü listeleyip "yanlış turu" öneriyordu; 100 soruluk bir sınavı
/// bitiren aday kendi doğru ve yanlışlarını tek tek görebilmeli.

AttemptResult _sonuc({required bool isArchive}) => AttemptResult(
      attemptId: 'a1',
      isArchive: isArchive,
      examId: 'e1',
      examTitle: '2025 PAEM 9',
      totalQuestions: 3,
      correctCount: 2,
      wrongCount: 1,
      blankCount: 0,
      score: 1.75,
      durationSeconds: 600,
      review: const [
        ReviewQuestion(
          order: 1,
          questionId: 'q1',
          stem: 'Birinci sorunun kökü',
          options: [
            ReviewOption(id: 'o1', label: 'A', text: 'A şıkkı', isCorrect: true),
            ReviewOption(id: 'o2', label: 'B', text: 'B şıkkı', isCorrect: false),
          ],
          selectedOptionId: 'o2',
          explanation: 'Çünkü kanun böyle diyor.',
        ),
      ],
    );

Future<void> _pump(WidgetTester tester, AttemptResult r) async {
  await tester.pumpWidget(ProviderScope(
    overrides: [
      examAttemptProvider('a1').overrideWith((ref) async => r),
      attemptDeltaProvider('a1').overrideWith((ref) async => null),
    ],
    child: MaterialApp(
      theme: AppTheme.light,
      home: const ExamResultScreen(attemptId: 'a1'),
    ),
  ));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('arşiv sonucunda soru soru cevap incelemesi görünür',
      (tester) async {
    await _pump(tester, _sonuc(isArchive: true));
    expect(find.text('Cevap İncelemesi'), findsOneWidget);
    expect(find.textContaining('Birinci sorunun kökü'), findsWidgets);
  });

  testWidgets('arşivde "Sıralama" düğmesi çizilmez', (tester) async {
    // Çıkmış sınavın canlı penceresi hiç açılmadı; o tablo kalıcı olarak boş.
    await _pump(tester, _sonuc(isArchive: true));
    expect(find.text('Sıralama'), findsNothing);
    expect(find.text('Denemeler'), findsOneWidget);
  });

  testWidgets('canlı denemede "Sıralama" düğmesi durur', (tester) async {
    await _pump(tester, _sonuc(isArchive: false));
    expect(find.text('Sıralama'), findsOneWidget);
  });

  test('isArchive alanı gelmezse canlı sayılır (eski sunucu)', () {
    final r = AttemptResult.fromJson(const {
      'attemptId': 'a1',
      'exam': {'id': 'e1', 'title': 'x'},
      'totalQuestions': 1,
      'correctCount': 1,
      'wrongCount': 0,
      'blankCount': 0,
    });
    expect(r.isArchive, isFalse);
  });

  test('isArchive alanı okunur', () {
    final r = AttemptResult.fromJson(const {
      'attemptId': 'a1',
      'isArchive': true,
      'exam': {'id': 'e1', 'title': 'x'},
      'totalQuestions': 1,
      'correctCount': 1,
      'wrongCount': 0,
      'blankCount': 0,
    });
    expect(r.isArchive, isTrue);
  });
}

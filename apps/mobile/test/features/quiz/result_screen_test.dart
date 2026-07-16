import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/quiz/domain/quiz_models.dart';
import 'package:paemisyon/features/quiz/presentation/result_screen.dart';

void main() {
  Widget app(QuizResult r, {ThemeData? theme}) => MaterialApp(
        theme: theme ?? AppTheme.light,
        home: ResultScreen(result: r),
      );

  const withWrongs = QuizResult(
    totalQuestions: 15,
    correctCount: 12,
    wrongCount: 3,
    blankCount: 0,
    score: 80,
    durationSeconds: 845,
  );

  testWidgets('skor başlığı + koç yorumu + yanlış CTA render olur',
      (tester) async {
    await tester.pumpWidget(app(withWrongs));
    await tester.pumpAndSettle();
    expect(find.text('12/15'), findsOneWidget);
    // Koç yorumu rakamla konuşur (Doc 26 §1.1) ve tekrar kuyruğunu söyler.
    expect(find.textContaining('3 yanlışını yarınki tekrar kuyruğuna'),
        findsOneWidget);
    expect(find.text('Yanlışları incele (3)'), findsOneWidget);
    expect(find.text("Bugün'e dön"), findsOneWidget);
  });

  testWidgets('hatasız seansta yanlış CTA yok, kutlama ölçülü', (tester) async {
    const perfect = QuizResult(
      totalQuestions: 10,
      correctCount: 10,
      wrongCount: 0,
      blankCount: 0,
      score: 100,
      durationSeconds: 300,
    );
    await tester.pumpWidget(app(perfect, theme: AppTheme.dark));
    await tester.pumpAndSettle();
    expect(find.text('10/10'), findsOneWidget);
    expect(find.textContaining('Hatasız seans'), findsOneWidget);
    expect(find.textContaining('Yanlışları incele'), findsNothing);
  });
}

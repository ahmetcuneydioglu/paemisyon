import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/coach/data/coach_repository.dart';
import 'package:paemisyon/features/coach/domain/coach_models.dart';
import 'package:paemisyon/features/me/presentation/home_screen.dart';

/// Regresyon: Home dashboard'u telefon boyutunda HATASIZ render edilmeli.
/// (ListView içindeki Row'da stretch → "BoxConstraints forces an infinite
/// height" → boş ekran hatası bir daha yaşanmasın.)
void main() {
  CoachBrief data({bool premium = false, bool onboarded = true}) => CoachBrief(
        displayName: 'Ahmet',
        onboardingCompleted: onboarded,
        preferredModuleName: 'PAEM',
        isPremium: premium,
        goal: 15,
        answered: 5,
        streakCurrent: 3,
        streakLongest: 7,
        streakAtRisk: false,
        primaryAction: const CoachCta(label: 'Çalışmaya Başla', route: '/quiz'),
        primaryActionType: 'default',
        cards: const [],
        totalSolved: 120,
        totalSessions: 14,
        accuracy: 78,
        nextBadge: null,
        weeklyActiveDays: 3,
        weeklyGoalDays: 5,
      );

  Widget wrap(CoachBrief d) {
    final router = GoRouter(routes: [
      GoRoute(path: '/', builder: (c, s) => const HomeScreen()),
      GoRoute(
          path: '/onboarding',
          builder: (c, s) => const Scaffold(body: Text('onboarding-ekrani'))),
    ]);
    return ProviderScope(
      overrides: [
        coachBriefProvider.overrideWith((ref) => Future.value(d)),
      ],
      child: MaterialApp.router(theme: AppTheme.light, routerConfig: router),
    );
  }

  testWidgets('free kullanıcı: dashboard hatasız render + limit barı + CTA',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556); // iPhone boyutu
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap(data()));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(tester.takeException(), isNull, reason: 'layout istisnası olmamalı');
    expect(find.textContaining('Hedef: PAEM'), findsOneWidget);
    expect(find.text('5/15'), findsOneWidget);
    expect(find.text('Çalışmaya Başla'), findsOneWidget);
    expect(find.text('Sınırsız soru için Premium'), findsOneWidget);
    expect(find.text('%78'), findsOneWidget);
  });

  testWidgets('premium kullanıcı: yükseltme CTA alanı yok', (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap(data(premium: true)));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(tester.takeException(), isNull);
    expect(find.text('5/15'), findsOneWidget);
    expect(find.text('Sınırsız soru için Premium'), findsNothing);
  });

  testWidgets('onboarding tamamlanmamışsa yönlendirir', (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap(data(onboarded: false)));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pump(const Duration(seconds: 1));

    expect(find.text('onboarding-ekrani'), findsOneWidget);
  });
}

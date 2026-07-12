import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:paemisyon/features/me/data/me_repository.dart';
import 'package:paemisyon/features/me/domain/dashboard_data.dart';
import 'package:paemisyon/features/me/presentation/home_screen.dart';

/// Regresyon: Home dashboard'u telefon boyutunda HATASIZ render edilmeli.
/// (ListView içindeki Row'da stretch → "BoxConstraints forces an infinite
/// height" → boş ekran hatası bir daha yaşanmasın.)
void main() {
  DashboardData data({bool premium = false, bool onboarded = true}) =>
      DashboardData(
        displayName: 'Ahmet',
        onboardingCompleted: onboarded,
        preferredModuleName: 'PAEM',
        isPremium: premium,
        currentStreak: 3,
        longestStreak: 7,
        answeredToday: 5,
        dailyLimit: premium ? null : 15,
        totalSolved: 120,
        totalSessions: 14,
        accuracy: 78,
      );

  Widget wrap(DashboardData d) {
    final router = GoRouter(routes: [
      GoRoute(path: '/', builder: (c, s) => const HomeScreen()),
      GoRoute(path: '/onboarding', builder: (c, s) => const Scaffold(body: Text('onboarding-ekrani'))),
    ]);
    return ProviderScope(
      overrides: [
        dashboardProvider.overrideWith((ref) => Future.value(d)),
      ],
      child: MaterialApp.router(routerConfig: router),
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
    expect(find.text('5 / 15 soru'), findsOneWidget);
    expect(find.text('Çalışmaya Başla'), findsOneWidget);
    expect(find.text('Sınırsız soru için Premium'), findsOneWidget);
    expect(find.text('%78'), findsOneWidget);
  });

  testWidgets('premium kullanıcı: sınırsız rozeti, CTA yok', (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap(data(premium: true)));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(tester.takeException(), isNull);
    expect(find.text('Sınırsız'), findsOneWidget);
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

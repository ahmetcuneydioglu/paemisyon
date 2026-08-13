import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:paemisyon/features/intro/intro_prefs.dart';
import 'package:paemisyon/features/intro/presentation/intro_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// First-launch tanıtımı (onaylı konsept): 5 sayfa, Devam/Atla, kalıcı bayrak.
void main() {
  // Hero'larda sürekli (repeat) animasyonlar var — pumpAndSettle asla
  // durulmaz; sınırlı pump kullanılır.
  Future<void> settle(WidgetTester tester) async {
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 700));
  }

  late List<String> visited;

  Widget wrap() {
    final router = GoRouter(
      initialLocation: '/intro',
      routes: [
        GoRoute(path: '/intro', builder: (c, s) => const IntroScreen()),
        GoRoute(
            path: '/auth/login',
            builder: (c, s) {
              visited.add('/auth/login');
              return const Scaffold(body: Text('LOGIN'));
            }),
        GoRoute(
            path: '/auth/register',
            builder: (c, s) {
              visited.add('/auth/register');
              return const Scaffold(body: Text('REGISTER'));
            }),
      ],
    );
    return ProviderScope(
      overrides: [introSeenProvider.overrideWith((ref) => false)],
      child: MaterialApp.router(routerConfig: router),
    );
  }

  setUp(() {
    visited = [];
    SharedPreferences.setMockInitialValues({});
    // Küçük telefonda taşma regresyonunu da yakala.
    TestWidgetsFlutterBinding.instance.platformDispatcher.views.first;
  });

  testWidgets('5 sayfa Devam Et ile gezilir; sonda İlk Devriyene Çık → kayıt',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap());
    await settle(tester);

    expect(find.textContaining('Hedefin belli'), findsOneWidget);
    expect(find.text('Atla'), findsOneWidget);

    for (var i = 0; i < 4; i++) {
      await tester.tap(find.text('Devam Et'));
      await settle(tester);
    }
    // Son sayfa: CTA ürün diliyle; Atla yerine "Zaten hesabım var".
    expect(find.text('İlk Devriyene Çık'), findsOneWidget);
    expect(find.text('Devam Et'), findsNothing);
    expect(find.text('Zaten hesabım var'), findsOneWidget);

    await tester.tap(find.text('İlk Devriyene Çık'));
    await settle(tester);
    expect(visited, ['/auth/register']);

    // Bayrak kalıcı: bir daha gösterilmeyecek.
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool(kIntroSeenKey), isTrue);
  });

  testWidgets('Atla → giriş + bayrak yazılır (tanıtıma hapsolma yok)',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap());
    await settle(tester);

    await tester.tap(find.text('Atla'));
    await settle(tester);

    expect(visited, ['/auth/login']);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool(kIntroSeenKey), isTrue);
  });

  testWidgets('küçük ekranda (SE) taşma yok', (tester) async {
    tester.view.physicalSize = const Size(750, 1334); // iPhone SE @2x
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap());
    await settle(tester);
    expect(tester.takeException(), isNull);

    for (var i = 0; i < 4; i++) {
      await tester.tap(find.text('Devam Et'));
      await settle(tester);
      expect(tester.takeException(), isNull);
    }
  });
}

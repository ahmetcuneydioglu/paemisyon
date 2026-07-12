import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:paemisyon/core/offline/connectivity_provider.dart';
import 'package:paemisyon/shared/widgets/offline_banner.dart';

/// Sprint 5'te eklenen uygulama kabuğu (MaterialApp.builder: Column + OfflineBanner
/// + Expanded) rota geçişlerinde layout kırıyor mu? Telefonda görülen
/// "RenderBox was not laid out / Null check operator" hatasının reprodüksiyonu.
void main() {
  Widget shell({required bool online}) {
    final router = GoRouter(
      routes: [
        GoRoute(
          path: '/',
          builder: (c, s) => Scaffold(
            appBar: AppBar(title: const Text('Ana')),
            body: Center(
              child: ElevatedButton(
                onPressed: () => c.push('/liste'),
                child: const Text('git'),
              ),
            ),
          ),
        ),
        GoRoute(
          path: '/liste',
          builder: (c, s) => Scaffold(
            appBar: AppBar(title: const Text('Liste')),
            body: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: 5,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) =>
                  Card(child: ListTile(title: Text('Öğe $i'))),
            ),
          ),
        ),
      ],
    );
    return ProviderScope(
      overrides: [
        connectivityProvider.overrideWith((ref) => Stream.value(online)),
      ],
      child: MaterialApp.router(
        routerConfig: router,
        builder: (context, child) => Column(
          children: [
            const OfflineBanner(),
            Expanded(child: child ?? const SizedBox.shrink()),
          ],
        ),
      ),
    );
  }

  testWidgets('çevrimiçi: rota geçişi + ListView hatasız', (tester) async {
    await tester.pumpWidget(shell(online: true));
    await tester.pumpAndSettle();
    await tester.tap(find.text('git'));
    await tester.pumpAndSettle();
    expect(find.text('Öğe 0'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('çevrimdışı (banner görünür): rota geçişi + ListView hatasız',
      (tester) async {
    await tester.pumpWidget(shell(online: false));
    await tester.pumpAndSettle();
    expect(find.text('Çevrimdışısın'), findsOneWidget);
    await tester.tap(find.text('git'));
    await tester.pumpAndSettle();
    expect(find.text('Öğe 0'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

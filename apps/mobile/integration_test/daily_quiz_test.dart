import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:paemisyon/main.dart' as app;

/// Günün Quizi akışı (kullanıcının 'tıklayınca hiçbir aksiyon almıyor' şikâyeti):
/// Home'daki kart tıklanınca quiz açılıyor mu, ilk soru + şıklar + Onayla geliyor mu,
/// bir şık seçilip Onayla'ya basılınca geri bildirim (Sonraki) çıkıyor mu?
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<void> settle(WidgetTester tester, [int seconds = 3]) async {
    for (var i = 0; i < seconds * 4; i++) {
      await tester.pump(const Duration(milliseconds: 250));
    }
  }

  Future<void> waitFor(WidgetTester tester, Finder finder,
      {int timeoutSeconds = 25}) async {
    for (var i = 0; i < timeoutSeconds * 4; i++) {
      await tester.pump(const Duration(milliseconds: 250));
      if (finder.evaluate().isNotEmpty) return;
    }
    final visible = find
        .byType(Text)
        .evaluate()
        .map((e) => (e.widget as Text).data)
        .whereType<String>()
        .take(25)
        .toList();
    fail('Zaman aşımı: $finder yok. Ekrandakiler: $visible');
  }

  testWidgets('Günün Quizi kartı → tıkla → quiz açılır → cevap → geri bildirim',
      (tester) async {
    app.main();
    final first = find.byWidgetPredicate((w) =>
        w is Text &&
        (w.data == 'Giriş yap' ||
            w.data == 'Devam Et' ||
            w.data == 'Çalışmaya Başla'));
    await waitFor(tester, first, timeoutSeconds: 30);
    await settle(tester, 1);

    if (find.text('Giriş yap').evaluate().isNotEmpty) {
      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'test@paemisyon.com');
      await tester.enterText(fields.at(1), 'Paemisyon2026!');
      await tester.tap(find.text('Giriş yap'));
      await settle(tester, 3);
    }
    await settle(tester, 2);
    if (find.text('Devam Et').evaluate().isNotEmpty) {
      await tester.tap(find.text('PAEM').first);
      await settle(tester, 1);
      await tester.tap(find.text('Devam Et'));
    }

    // Günün Quizi kartı görünmeli (bugün çözülmediyse tıklanabilir).
    await waitFor(tester, find.text('Günün Quizi'));

    // Zaten çözülmüşse akış test edilemez — testi anlamlı tut.
    final playedToday =
        find.text('Bugünkünü çözdün — yarın yenisi seni bekliyor!').evaluate().isNotEmpty;
    expect(playedToday, isFalse,
        reason: 'Test öncesi daily oturumu temizlenmeliydi.');

    // ── TIKLA ── (kullanıcının 'aksiyon almıyor' dediği yer)
    await tester.tap(find.text('Günün Quizi'));
    await waitFor(tester, find.text('Onayla')); // quiz açıldı + practice akışı

    // Şık seç (ilk kart) + Onayla → geri bildirim (Sonraki).
    final options = find.byType(Card);
    expect(options, findsWidgets, reason: 'Şıklar kart olarak render olmalı');
    await tester.tap(options.first);
    await settle(tester, 1);
    await tester.tap(find.text('Onayla'));
    await waitFor(tester, find.text('Sonraki')); // geri bildirim geldi → ilerlenebilir

    // Başardık: kart tıklanıyor, quiz açılıyor, cevap + geri bildirim çalışıyor.
  });
}

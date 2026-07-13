import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:paemisyon/main.dart' as app;

/// Kritik akış E2E'si (Doc 13 S9): gerçek uygulama + gerçek backend ile
/// giriş → (onboarding) → katalog → modül. Skeleton animasyonu sonsuz olduğu
/// için pumpAndSettle DEĞİL sabit pump kullanılır.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Her istisnayı ANINDA konsola bas — kök neden kaybolmasın.
  final originalOnError = FlutterError.onError;
  var errorCount = 0;
  FlutterError.onError = (details) {
    errorCount++;
    if (errorCount <= 3) {
      // İlk 3 istisnanın tam izi yeter; gerisi tekrar.
      debugPrint('════ İSTİSNA #$errorCount ════');
      debugPrint(details.exceptionAsString());
      debugPrint(details.stack.toString().split('\n').take(15).join('\n'));
    }
    originalOnError?.call(details);
  };

  /// Sabit süreli bekleme (animasyonlar sonsuz olabilir).
  Future<void> settle(WidgetTester tester, [int seconds = 3]) async {
    for (var i = 0; i < seconds * 4; i++) {
      await tester.pump(const Duration(milliseconds: 250));
    }
  }

  /// Bulana kadar bekle (ağ/token tazeleme gecikmelerine dayanıklı).
  Future<void> waitFor(WidgetTester tester, Finder finder,
      {int timeoutSeconds = 20}) async {
    for (var i = 0; i < timeoutSeconds * 4; i++) {
      await tester.pump(const Duration(milliseconds: 250));
      if (finder.evaluate().isNotEmpty) return;
    }
    // Teşhis: ekranda o an ne var?
    final visible = find
        .byType(Text)
        .evaluate()
        .map((e) => (e.widget as Text).data)
        .whereType<String>()
        .take(20)
        .toList();
    fail('Zaman aşımı: $finder bulunamadı ($timeoutSeconds sn). Ekrandakiler: $visible');
  }

  testWidgets('giriş → onboarding → katalog → modül aç', (tester) async {
    app.main();

    // ── İlk anlamlı ekranı bekle: login / onboarding / home.
    // (Ölü oturumda interceptor otomatik signOut yapar → login GEÇ gelebilir.)
    final firstScreen = find.byWidgetPredicate((w) =>
        w is Text &&
        (w.data == 'Giriş yap' ||
            w.data == 'Devam Et' ||
            w.data == 'Çalışmaya Başla'));
    await waitFor(tester, firstScreen, timeoutSeconds: 30);
    await settle(tester, 1);

    // ── Giriş (oturum yoksa / düşmüşse) ──
    if (find.text('Giriş yap').evaluate().isNotEmpty) {
      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'test@paemisyon.com');
      await tester.enterText(fields.at(1), 'Paemisyon2026!');
      await tester.tap(find.text('Giriş yap'));
      await settle(tester, 3);
    }

    // ── Onboarding çıktıysa hedef seç ──
    await settle(tester, 2);
    if (find.text('Devam Et').evaluate().isNotEmpty) {
      await tester.tap(find.text('PAEM').first);
      await settle(tester, 1);
      await tester.tap(find.text('Devam Et'));
    }

    // ── Home (token tazeleme/ağ gecikmesine dayanıklı bekleme) ──
    await waitFor(tester, find.text('Çalışmaya Başla'));

    // ── Kataloğa git ──
    await tester.tap(find.text('Çalışmaya Başla'));
    await waitFor(tester, find.text('Kategoriler'));
    await waitFor(tester, find.text('PAEM')); // liste yüklenene dek bekle

    // ── Bir sınava (modüle) tıkla → dersler ──
    await tester.tap(find.text('PAEM').first);
    await waitFor(tester, find.text('Genel Mevzuat'));

    // ── Boş modül de kırılmamalı ──
    await settle(tester, 1); // geçiş animasyonu bitsin (cache ile anında yükleniyor)
    await tester.pageBack();
    await waitFor(tester, find.text('POMEM'));
    await tester.tap(find.text('POMEM'));
    await waitFor(tester, find.text('Bu modülde henüz ders yok.'));

    debugPrint('════ TOPLAM İSTİSNA: $errorCount ════');
  });
}

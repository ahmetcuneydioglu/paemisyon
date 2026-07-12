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

  testWidgets('giriş → onboarding → katalog → modül aç', (tester) async {
    app.main();
    await settle(tester, 4);

    // ── Giriş (oturum yoksa) ──
    if (find.text('Giriş yap').evaluate().isNotEmpty) {
      final fields = find.byType(TextField);
      await tester.enterText(fields.at(0), 'test@paemisyon.com');
      await tester.enterText(fields.at(1), 'Paemisyon2026!');
      await tester.tap(find.text('Giriş yap'));
      await settle(tester, 6);
    }

    // ── Onboarding çıktıysa hedef seç ──
    if (find.text('Devam Et').evaluate().isNotEmpty) {
      await tester.tap(find.text('PAEM').first);
      await settle(tester, 1);
      await tester.tap(find.text('Devam Et'));
      await settle(tester, 5);
    }

    expect(find.text('Çalışmaya Başla'), findsOneWidget,
        reason: 'Home ekranı yüklenmeli');

    // ── Kataloğa git ──
    await tester.tap(find.text('Çalışmaya Başla'));
    await settle(tester, 4);
    expect(find.text('Kategoriler'), findsOneWidget,
        reason: 'Modül listesi açılmalı');

    // ── HATA REPRO: bir sınava (modüle) tıkla ──
    await tester.tap(find.text('PAEM').first);
    await settle(tester, 4);
    expect(find.text('Anayasa Hukuku'), findsOneWidget,
        reason: 'PAEM dersleri listelenmeli');

    // ── Boş modül de kırılmamalı ──
    await tester.pageBack();
    await settle(tester, 2);
    await tester.tap(find.text('POMEM'));
    await settle(tester, 4);
    expect(find.text('Bu modülde henüz ders yok.'), findsOneWidget,
        reason: 'Boş modül dostça boş durum göstermeli');

    debugPrint('════ TOPLAM İSTİSNA: $errorCount ════');
  });
}

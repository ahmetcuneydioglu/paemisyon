import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/exams/data/calisma_kaydi.dart';
import 'package:paemisyon/features/exams/data/cikmis_sinav_repository.dart';
import 'package:paemisyon/features/exams/domain/cikmis_sinav_models.dart';
import 'package:paemisyon/features/exams/presentation/cikmis_calisma_screen.dart';

/// Çalışma modu (Doc 36 §4): dokunuş = cevap, doğrusu ve açıklaması ANINDA
/// aynı ekranda, cevaptan sonra şıklar kilitli.

CikmisSoru _soru({
  required int sira,
  bool iptal = false,
  String dogru = 'A',
  String? aciklama = 'Çünkü kanun böyle diyor.',
}) =>
    CikmisSoru(
      sira: sira,
      iptal: iptal,
      ders: 'Polis Mevzuatı',
      konu: 'ETK',
      kok: '$sira numaralı sorunun kökü',
      siklar: [
        for (final h in ['A', 'B'])
          CikmisSik(harf: h, metin: '$h şıkkı', dogru: h == dogru),
      ],
      aciklama: aciklama,
    );

CikmisSinavDetay _detay(List<CikmisSoru> sorular) => CikmisSinavDetay(
      ozet: const CikmisSinavOzet(
        slug: 'paem-9-2025',
        ad: '2025 PAEM 9',
        kurum: 'Polis Akademisi Başkanlığı',
        donem: 9,
        tur: CikmisSinavTuru.resmi,
        examId: 'e1',
      ),
      sorular: sorular,
    );

Future<void> _pump(WidgetTester tester, CikmisSinavDetay d) async {
  await tester.pumpWidget(ProviderScope(
    overrides: [
      cikmisSinavDetayProvider('paem-9-2025').overrideWith((ref) async => d),
    ],
    child: MaterialApp(
      theme: AppTheme.light,
      home: const CikmisCalismaScreen(slug: 'paem-9-2025'),
    ),
  ));
  await tester.pumpAndSettle();
}

void main() {
  // Çalışma ilerlemesi cihazda saklanıyor; her test temiz kayıtla başlar.
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('cevaptan önce açıklama gizli, sonra görünür', (tester) async {
    await _pump(tester, _detay([_soru(sira: 1)]));

    expect(find.text('1 numaralı sorunun kökü'), findsOneWidget);
    expect(find.text('Çünkü kanun böyle diyor.'), findsNothing);
    expect(find.text('Henüz cevaplamadın'), findsOneWidget);

    await tester.tap(find.text('B şıkkı'));
    await tester.pumpAndSettle();

    expect(find.text('Çünkü kanun böyle diyor.'), findsOneWidget);
    expect(find.text('1 cevap · 0 doğru'), findsOneWidget);
  });

  testWidgets('cevaptan sonra şıklar kilitlenir — deneye deneye bulunmaz',
      (tester) async {
    await _pump(tester, _detay([_soru(sira: 1)]));

    await tester.tap(find.text('B şıkkı')); // yanlış
    await tester.pumpAndSettle();
    await tester.tap(find.text('A şıkkı')); // doğruyu sonradan seçmeye çalış
    await tester.pumpAndSettle();

    // Sayaç değişmedi: ilk cevap kayıtta kaldı.
    expect(find.text('1 cevap · 0 doğru'), findsOneWidget);
  });

  testWidgets('doğru cevap sayaca yazılır', (tester) async {
    await _pump(tester, _detay([_soru(sira: 1)]));
    await tester.tap(find.text('A şıkkı'));
    await tester.pumpAndSettle();
    expect(find.text('1 cevap · 1 doğru'), findsOneWidget);
  });

  testWidgets('iptal edilen soru rozetlenir ve sayaca girmez', (tester) async {
    // Sınavda iptal edilen soru puanlanmadı; bizim sayacımız da onu
    // saymaz — yoksa aday kendi netini olduğundan yüksek görür.
    await _pump(tester, _detay([_soru(sira: 1, iptal: true)]));

    expect(find.text('Sınavda iptal edildi'), findsOneWidget);
    await tester.tap(find.text('A şıkkı'));
    await tester.pumpAndSettle();
    expect(find.text('Henüz cevaplamadın'), findsOneWidget);
  });

  testWidgets('açıklaması olmayan soruda kutu çizilmez', (tester) async {
    await _pump(tester, _detay([_soru(sira: 1, aciklama: null)]));
    await tester.tap(find.text('A şıkkı'));
    await tester.pumpAndSettle();
    expect(find.text('Açıklama'), findsNothing);
  });

  testWidgets('son soruda "Sonraki soru" yerine kapanış metni çıkar',
      (tester) async {
    await _pump(tester, _detay([_soru(sira: 1)]));
    await tester.tap(find.text('A şıkkı'));
    await tester.pumpAndSettle();

    expect(find.text('Sonraki soru'), findsNothing);
    expect(find.textContaining('Son soruydu'), findsOneWidget);
  });

  testWidgets('ızgaradan soruya atlanır', (tester) async {
    await _pump(
        tester, _detay([_soru(sira: 1), _soru(sira: 2), _soru(sira: 3)]));

    expect(find.text('Soru 1 / 3'), findsOneWidget);
    await tester.tap(find.byTooltip('Soruya git'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('3'));
    await tester.pumpAndSettle();

    expect(find.text('Soru 3 / 3'), findsOneWidget);
    expect(find.text('3 numaralı sorunun kökü'), findsOneWidget);
  });

  testWidgets('önceki ilerleme geri gelir ve ilk cevapsız sorudan devam eder',
      (tester) async {
    // Ekrandan çıkıp dönen aday sıfırdan başlıyordu (7 Eyl 2026 bildirimi).
    SharedPreferences.setMockInitialValues({
      CalismaKaydi.anahtar('paem-9-2025'): CalismaKaydi.kodla({1: 'A', 2: 'B'}),
    });
    await _pump(
        tester, _detay([_soru(sira: 1), _soru(sira: 2), _soru(sira: 3)]));
    await tester.pumpAndSettle();

    expect(find.text('Soru 3 / 3'), findsOneWidget);
    expect(find.text('2 cevap · 1 doğru'), findsOneWidget);
  });

  testWidgets('işaretlenen şık cihaza yazılır', (tester) async {
    await _pump(tester, _detay([_soru(sira: 7)]));
    await tester.tap(find.text('B şıkkı'));
    await tester.pumpAndSettle();
    expect(await CalismaKaydi.oku('paem-9-2025'), {7: 'B'});
  });

  testWidgets('sıfırlama kaydı siler ve başa döner', (tester) async {
    SharedPreferences.setMockInitialValues({
      CalismaKaydi.anahtar('paem-9-2025'): CalismaKaydi.kodla({1: 'A'}),
    });
    await _pump(tester, _detay([_soru(sira: 1), _soru(sira: 2)]));
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Baştan başla'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sıfırla'));
    await tester.pumpAndSettle();

    expect(find.text('Henüz cevaplamadın'), findsOneWidget);
    expect(await CalismaKaydi.oku('paem-9-2025'), isEmpty);
  });

  testWidgets('kayıt yokken "Baştan başla" düğmesi çizilmez', (tester) async {
    await _pump(tester, _detay([_soru(sira: 1)]));
    expect(find.byTooltip('Baştan başla'), findsNothing);
  });
}

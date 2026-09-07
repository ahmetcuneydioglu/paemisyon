import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/exams/data/cikmis_sinav_repository.dart';
import 'package:paemisyon/features/exams/domain/cikmis_sinav_models.dart';
import 'package:paemisyon/features/exams/presentation/cikmis_sinav_screen.dart';
import 'package:paemisyon/features/exams/presentation/cikmis_sinavlar_screen.dart';

/// Vitrin ve dönem ekranı (Doc 36). Sınanan asıl şey dürüstlük çerçevesi:
/// "çıkmış sınav" ile "konu analizi" ekranda AYRIŞIR ve analiz dönemine
/// çözme kapısı açılmaz.

const _resmi = CikmisSinavOzet(
  slug: 'paem-9-2025',
  ad: '2025 PAEM 9. Dönem İlk Derece Amirlik Eğitimi Yazılı Sınavı',
  kurum: 'Polis Akademisi Başkanlığı',
  donem: 9,
  tur: CikmisSinavTuru.resmi,
  soruSayisi: 100,
  examId: 'e1',
  dersDagilimi: [
    DersDagilimi(ders: 'Genel Kültür ve Analitik Düşünme', adet: 30),
    DersDagilimi(ders: 'Polis Mevzuatı', adet: 10),
  ],
);

const _analiz = CikmisSinavOzet(
  slug: 'paem-7-2022',
  ad: '2022 PAEM 7. Dönem Sınavı',
  kurum: 'Polis Akademisi Başkanlığı',
  donem: 7,
  tur: CikmisSinavTuru.analiz,
  soruSayisi: 100,
  dersDagilimi: [DersDagilimi(ders: 'Ceza Hukuku', adet: 10)],
);

CikmisSoru get _soru => const CikmisSoru(
      sira: 1,
      iptal: false,
      ders: 'Polis Mevzuatı',
      konu: 'ETK',
      kok: 'Soru kökü',
      siklar: [CikmisSik(harf: 'A', metin: 'A şıkkı', dogru: true)],
    );

void main() {
  testWidgets('vitrin: iki tür rozetiyle ayrışır', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        cikmisSinavlarProvider.overrideWith((ref) async => [_resmi, _analiz]),
      ],
      child: MaterialApp(
          theme: AppTheme.light, home: const CikmisSinavlarScreen()),
    ));
    await tester.pumpAndSettle();

    // Tarih verilmediği için kısa ad yılsız kalır; yıl biçimi model
    // testinde ('PAEM 9 · 2025') sınanıyor.
    expect(find.text('PAEM 9'), findsOneWidget);
    expect(find.text('PAEM 7'), findsOneWidget);
    expect(find.text('Çıkmış sınav'), findsOneWidget);
    expect(find.text('Konu analizi'), findsOneWidget);
    expect(find.text('100 soru · cevaplı ve açıklamalı'), findsOneWidget);
    expect(find.text('Sınav yayımlanmadı — yalnız konu dağılımı'),
        findsOneWidget);
  });

  testWidgets('vitrin boşsa boş durum çizilir', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [cikmisSinavlarProvider.overrideWith((ref) async => [])],
      child: MaterialApp(
          theme: AppTheme.light, home: const CikmisSinavlarScreen()),
    ));
    await tester.pumpAndSettle();
    expect(find.text('Henüz yayımlanmış çıkmış sınav yok.'), findsOneWidget);
  });

  testWidgets('resmî dönem: iki mod da açılır', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        cikmisSinavDetayProvider('paem-9-2025').overrideWith(
          (ref) async =>
              CikmisSinavDetay(ozet: _resmi, sorular: [_soru], kapaliSoru: 99),
        ),
      ],
      child: MaterialApp(
        theme: AppTheme.light,
        home: const CikmisSinavScreen(slug: 'paem-9-2025'),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Sınav gibi çöz'), findsOneWidget);
    expect(find.text('Çalışma modu'), findsOneWidget);
    // Eksik soru sessizce yutulmaz.
    expect(find.textContaining('99 sorusu henüz hazırlık aşamasında'),
        findsOneWidget);
    expect(find.text('Konu dağılımı'), findsOneWidget);
  });

  testWidgets('motora bağlı değilse "Sınav gibi çöz" çizilmez', (tester) async {
    // Ölü düğme kullanıcıyı hataya sürükler: sunucu zaten reddederdi.
    await tester.pumpWidget(ProviderScope(
      overrides: [
        cikmisSinavDetayProvider('paem-9-2025').overrideWith(
          (ref) async => CikmisSinavDetay(
            ozet: const CikmisSinavOzet(
              slug: 'paem-9-2025',
              ad: 'x',
              kurum: 'y',
              tur: CikmisSinavTuru.resmi,
            ),
            sorular: [_soru],
          ),
        ),
      ],
      child: MaterialApp(
        theme: AppTheme.light,
        home: const CikmisSinavScreen(slug: 'paem-9-2025'),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Sınav gibi çöz'), findsNothing);
    expect(find.text('Çalışma modu'), findsOneWidget);
  });

  testWidgets('analiz dönemi: mod yok, uyarı var', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        cikmisSinavDetayProvider('paem-7-2022').overrideWith(
          (ref) async =>
              const CikmisSinavDetay(ozet: _analiz, sorular: []),
        ),
      ],
      child: MaterialApp(
        theme: AppTheme.dark,
        home: const CikmisSinavScreen(slug: 'paem-7-2022'),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Sınav gibi çöz'), findsNothing);
    expect(find.text('Çalışma modu'), findsNothing);
    expect(find.textContaining('resmî kitapçığı yayımlanmadı'), findsOneWidget);
    expect(find.text('Konu dağılımı'), findsOneWidget);
  });
}

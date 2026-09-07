import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/exams/data/cikmis_sinav_repository.dart';
import 'package:paemisyon/features/exams/domain/cikmis_sinav_models.dart';
import 'package:paemisyon/features/exams/domain/exam_models.dart';
import 'package:paemisyon/features/exams/presentation/exams_list_screen.dart';

/// Denemeler sekmesindeki "Çıkmış sınavlar" giriş kartı (Doc 36).
///
/// Kart, deneme listesinin İÇİNDE bir bölüm değil kendi ekranına açılan kapı:
/// çıkmış sınavlar her zaman açıktır ve "Canlı → Sıradaki → Geçmiş"
/// hiyerarşisine karışırsa aday hangisinin canlı olduğunu ayırt edemez.

const _resmi = CikmisSinavOzet(
  slug: 'paem-9-2025',
  ad: '2025 PAEM 9',
  kurum: 'Polis Akademisi Başkanlığı',
  donem: 9,
  tur: CikmisSinavTuru.resmi,
  soruSayisi: 100,
  examId: 'e1',
);

const _analiz = CikmisSinavOzet(
  slug: 'paem-7-2022',
  ad: '2022 PAEM 7',
  kurum: 'Polis Akademisi Başkanlığı',
  donem: 7,
  tur: CikmisSinavTuru.analiz,
  soruSayisi: 100,
);

Future<void> _pump(
  WidgetTester tester,
  List<CikmisSinavOzet> cikmis, {
  ThemeData? theme,
}) async {
  await tester.pumpWidget(ProviderScope(
    overrides: [
      examsScreenDataProvider.overrideWith(
        (ref) async => (<ExamListItem>[], <String, AttemptResult>{}),
      ),
      cikmisSinavlarProvider.overrideWith((ref) async => cikmis),
    ],
    child: MaterialApp(
      theme: theme ?? AppTheme.light,
      home: const ExamsListScreen(),
    ),
  ));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('kart çözülebilir dönemleri ve soru sayısını özetler',
      (tester) async {
    await _pump(tester, [_resmi, _analiz]);

    expect(find.text('Çıkmış sınavlar'), findsOneWidget);
    // Yalnız motora bağlı dönemler sayılır: konu analizi "gerçek soru" değil.
    expect(
      find.textContaining('PAEM 9 · 100 gerçek soru'),
      findsOneWidget,
    );
  });

  testWidgets('yalnız analiz dönemi varsa dil değişir', (tester) async {
    await _pump(tester, [_analiz]);
    expect(find.textContaining('gerçek soru'), findsNothing);
    expect(find.textContaining('konu dağılımı'), findsOneWidget);
  });

  testWidgets('liste boşsa kart hiç çizilmez — boşluğa açılan kapı olmaz',
      (tester) async {
    await _pump(tester, []);
    expect(find.text('Çıkmış sınavlar'), findsNothing);
    // Deneme ekranının kendisi yine çalışır.
    expect(find.text('Bana özel deneme'), findsOneWidget);
  });

  testWidgets('koyu temada hatasız çizilir', (tester) async {
    await _pump(tester, [_resmi], theme: AppTheme.dark);
    expect(find.text('Çıkmış sınavlar'), findsOneWidget);
  });
}

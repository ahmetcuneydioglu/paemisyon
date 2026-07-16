import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/shared/widgets/component_gallery.dart';
import 'package:paemisyon/shared/widgets/focus_sheet.dart';
import 'package:paemisyon/shared/widgets/option_row.dart';

Widget _app(Widget child, {ThemeData? theme}) =>
    MaterialApp(theme: theme ?? AppTheme.light, home: child);

void main() {
  group('Component galerisi (duman testi — kabul kriteri: iki tema)', () {
    testWidgets('açık temada tüm bileşenler hatasız render olur',
        (tester) async {
      await tester.pumpWidget(_app(const ComponentGallery()));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Bugün Çalış'), findsOneWidget);
      // Kaynak etiketi (SourceTag) listede aşağıda — kaydırarak doğrula.
      await tester.scrollUntilVisible(find.text('2019 PAEM'), 400,
          scrollable: find.byType(Scrollable).first);
      expect(find.text('2019 PAEM'), findsOneWidget);
    });

    testWidgets('koyu temada tüm bileşenler hatasız render olur',
        (tester) async {
      await tester
          .pumpWidget(_app(const ComponentGallery(), theme: AppTheme.dark));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Bugün Çalış'), findsOneWidget);
    });
  });

  group('OptionRow', () {
    testWidgets('dokunma geri çağrısı çalışır ve durumlar ayrışır',
        (tester) async {
      var tapped = false;
      await tester.pumpWidget(_app(Scaffold(
        body: Column(children: [
          OptionRow(
              label: 'A',
              text: 'Deneme şıkkı',
              onTap: () => tapped = true),
          const OptionRow(
              label: 'B', text: 'Doğru', state: OptionRowState.correct),
          const OptionRow(
              label: 'C', text: 'Yanlış', state: OptionRowState.wrongPick),
        ]),
      )));
      await tester.tap(find.text('Deneme şıkkı'));
      expect(tapped, isTrue);
      // Renk tek başına anlam taşımaz: doğru/yanlış ikonla da verilir.
      expect(find.byIcon(Icons.check_circle_rounded), findsOneWidget);
      expect(find.byIcon(Icons.cancel_rounded), findsOneWidget);
    });
  });

  group('FocusSheet', () {
    testWidgets('seçim yapıp başlatınca seçilen id döner', (tester) async {
      String? result;
      await tester.pumpWidget(_app(Scaffold(
        body: Builder(
          builder: (context) => FilledButton(
            onPressed: () async {
              result = await showFocusSheet(
                context,
                selectedId: 'coach',
                options: const [
                  FocusOption(id: 'coach', label: 'Koç seçsin'),
                  FocusOption(id: 'wrongs', label: 'Sadece yanlışlarım'),
                ],
              );
            },
            child: const Text('Aç'),
          ),
        ),
      )));
      await tester.tap(find.text('Aç'));
      await tester.pumpAndSettle();
      expect(find.text('Bugün neye odaklanalım?'), findsOneWidget);
      // Kalıcılık notu sabittir (Doc 25 §5 — odak geçicidir).
      expect(find.textContaining('yarın koça döner'), findsOneWidget);

      await tester.tap(find.text('Sadece yanlışlarım'));
      await tester.pump();
      await tester.tap(find.text('Seansı başlat'));
      await tester.pumpAndSettle();
      expect(result, 'wrongs');
    });
  });
}

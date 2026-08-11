import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/coach/data/coach_repository.dart';
import 'package:paemisyon/features/coach/domain/coach_models.dart';
import 'package:paemisyon/features/me/presentation/badges_screen.dart';

const _collection = BadgeCollection(
  earnedCount: 2,
  totalCount: 4,
  items: [
    BadgeItem(
        key: 'first_session',
        name: 'İlk Adım',
        description: 'İlk quiz oturumunu tamamla',
        earned: true),
    BadgeItem(
        key: 'streak_7',
        name: '7 Gün Seri',
        description: '7 gün üst üste çalış',
        earned: true),
    BadgeItem(
        key: 'exam_5',
        name: 'Deneme Ustası',
        description: '5 canlı deneme tamamla',
        earned: false),
    BadgeItem(
        key: 'accuracy_70',
        name: 'Keskin Nişancı',
        description: '100+ soruda %70 doğruluğa ulaş',
        earned: false),
  ],
);

Widget _app({ThemeData? theme}) => ProviderScope(
      overrides: [
        badgesProvider.overrideWith((ref) async => _collection),
      ],
      child: MaterialApp(
          theme: theme ?? AppTheme.light, home: const BadgesScreen()),
    );

void main() {
  testWidgets('rozet koleksiyonu: sayaç + kazanılan ve kilitli hücreler',
      (tester) async {
    await tester.pumpWidget(_app());
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('2/4'), findsOneWidget);
    expect(find.text('İlk Adım'), findsOneWidget);
    expect(find.text('Deneme Ustası'), findsOneWidget);
    // Kilitli rozetlerde kilit ikonu (2 adet).
    expect(find.byIcon(Icons.lock_rounded), findsNWidgets(2));
  });

  testWidgets('koyu temada hatasız render olur', (tester) async {
    await tester.pumpWidget(_app(theme: AppTheme.dark));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('7 Gün Seri'), findsOneWidget);
  });
}

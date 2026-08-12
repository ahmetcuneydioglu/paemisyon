import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/billing/data/billing_repository.dart';
import 'package:paemisyon/features/billing/domain/billing_plan.dart';
import 'package:paemisyon/features/billing/presentation/paywall_screen.dart';
import 'package:paemisyon/features/me/data/me_repository.dart';
import 'package:paemisyon/features/me/domain/me_profile.dart';
import 'package:paemisyon/shared/widgets/contact_channels.dart';

/// Regresyon (fiyatlandırma değişikliği): satılan tek plan mağazaya BAĞLI DEĞİL
/// (storeProductId* NULL). Eskiden bu durumda "Mağazada bulunamadı" hatası
/// çıkıyor ve "Satın Al" butonu kalıcı olarak devre dışı kalıyordu — kullanıcının
/// premium alma yolu yoktu. Manuel akış (Telegram/Instagram) bunun yerine gelir.
class _FakeBillingRepository implements BillingRepository {
  _FakeBillingRepository(this._plans);
  final List<BillingPlan> _plans;

  @override
  Future<List<BillingPlan>> getPlans() async => _plans;

  @override
  Future<void> verifyPurchase({
    required String transactionJws,
    String platform = 'apple',
  }) async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  const quarterly = BillingPlan(
    key: 'quarterly',
    name: '3 Aylık Premium',
    price: '499.99',
    currency: 'TRY',
    period: 'quarterly',
    // Mağaza ürünü YOK — ödeme manuel yürür.
  );

  const profile = MeProfile(
    id: 'u1',
    email: 'ahmet@example.com',
    roles: [],
    isPremium: false,
  );

  Widget wrap(List<BillingPlan> plans) => ProviderScope(
        overrides: [
          billingRepositoryProvider
              .overrideWithValue(_FakeBillingRepository(plans)),
          // /me stub: e-posta eşleştirme satırı için (ağa çıkılmaz).
          meProvider.overrideWith((ref) => Future.value(profile)),
        ],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const PaywallScreen(),
        ),
      );

  Future<void> settle(WidgetTester tester) async {
    await tester.pump(); // FutureProvider/istek
    await tester.pump(const Duration(milliseconds: 100));
  }

  testWidgets('manuel plan: çıkmaz sokak yok — iletişim kanalları gösterilir',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap(const [quarterly]));
    await settle(tester);

    expect(tester.takeException(), isNull);

    // 1) Ölü uç YOK: hata metni ve devre dışı "Satın Al" butonu görünmemeli.
    expect(find.text('Mağazada bulunamadı'), findsNothing);
    expect(find.text('Satın Al'), findsNothing);

    // 2) Yerine manuel akış: 3 adım + iki kanal butonu.
    expect(find.textContaining('Nasıl premium olurum?'), findsOneWidget);
    expect(find.textContaining('1. adım'), findsOneWidget);
    expect(find.textContaining('2. adım'), findsOneWidget);
    expect(find.textContaining('3. adım'), findsOneWidget);
    expect(find.textContaining('Telegram'), findsWidgets);
    expect(find.textContaining('Instagram'), findsWidgets);

    // 3) Kanal butonları GERÇEKTEN tıklanabilir (onPressed != null) — eski
    //    ekranın asıl kusuru "buton var ama ölü" olmasıydı.
    final channels = find.byType(ContactChannels);
    expect(channels, findsOneWidget);
    final telegramBtn = tester.widget<FilledButton>(
      find
          .descendant(of: channels, matching: find.byType(FilledButton))
          .first,
    );
    expect(telegramBtn.onPressed, isNotNull,
        reason: 'Telegram butonu devre dışı olmamalı');

    // 4) a11y: kanal adı + kullanıcı adı ekran okuyucuya tek etiket olarak gider.
    expect(find.bySemanticsLabel('Telegram @paemvemisyon'), findsOneWidget);
    expect(find.bySemanticsLabel('Instagram @paemvemisyon'), findsOneWidget);

    // 5) Eşleştirme için hesap e-postası gösterilir.
    expect(find.textContaining('ahmet@example.com'), findsOneWidget);
  });

  testWidgets('manuel plan: sözleşme metni otomatik yenilemeyi VAAT ETMEZ',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap(const [quarterly]));
    await settle(tester);

    // Web Kullanım Koşulları ile çelişen eski beyan bir daha dönmesin.
    expect(find.textContaining('otomatik yenilenir'), findsNothing);
    expect(find.textContaining('App Store ayarlarından iptal'), findsNothing);
    expect(find.textContaining('Otomatik yenileme yok'), findsOneWidget);

    // "Geri yükle" mağaza eylemidir — manuel akışta anlamsız.
    expect(find.text('Geri yükle'), findsNothing);
  });

  testWidgets(
      'iOS: Apple 3.1.1 — manuel satın alma akışı GİZLİ, premium değeri görünür',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    // iOS derlemesini taklit et. (Override, framework invariant kontrolünden
    // önce sıfırlanmalı — teardown geç kalır; gövdenin sonunda sıfırlanır.)
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;

    await tester.pumpWidget(wrap(const [quarterly]));
    await settle(tester);
    expect(tester.takeException(), isNull);

    // Harici satın almaya YÖNLENDİRME hiçbir biçimde görünmemeli.
    expect(find.textContaining('Nasıl premium olurum?'), findsNothing);
    expect(find.textContaining('1. adım'), findsNothing);
    expect(find.byType(ContactChannels), findsNothing);
    expect(find.textContaining('Telegram'), findsNothing);
    expect(find.textContaining('Instagram'), findsNothing);
    expect(find.textContaining('bize yeniden yazarsın'), findsNothing);
    expect(find.textContaining('çayı parasına'), findsNothing); // fiyat teşviki
    expect(find.textContaining('499,99'), findsNothing); // fiyat-CTA yok

    // Ama premium DEĞERİ tanıtılır + erişim modeli açıklanır (satış değil).
    expect(find.text('Koçunun tam beynini aç'), findsOneWidget);
    expect(find.text('Sınırsız soru'), findsOneWidget);
    expect(find.textContaining('aynı hesapla giriş yaptığın her yerde'),
        findsOneWidget);

    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('fiyat TR biçiminde ve dönem etiketiyle gösterilir',
      (tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(wrap(const [quarterly]));
    await settle(tester);

    // "499.99 TRY" değil: "499,99 TL / 3 ay" (web formatPrice ile aynı).
    expect(find.textContaining('499,99 TL'), findsOneWidget);
    expect(find.textContaining('3 ay'), findsWidgets);
  });

  group('BillingPlan biçimlendirme', () {
    test('priceLabel TR ondalık ayracı ve para birimi sonekini kullanır', () {
      expect(quarterly.priceLabel, '499,99 TL');
    });

    test('monthlyEquivalentLabel 3 aylık pakette aylık karşılığı verir', () {
      expect(quarterly.monthlyEquivalentLabel, '166,66 TL');
    });

    test('aylık planda aylık karşılık gösterilmez', () {
      const monthly = BillingPlan(
        key: 'monthly',
        name: 'Aylık',
        price: '149.99',
        currency: 'TRY',
        period: 'monthly',
      );
      expect(monthly.monthlyEquivalentLabel, isNull);
    });

    test('mağaza ürünü olmayan plan manuel akıştadır', () {
      expect(quarterly.isStoreManaged, isFalse);
    });
  });
}

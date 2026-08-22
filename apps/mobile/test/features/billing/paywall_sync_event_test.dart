import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:paemisyon/core/theme/app_theme.dart';
import 'package:paemisyon/features/billing/data/billing_repository.dart';
import 'package:paemisyon/features/billing/data/purchase_sync_service.dart';
import 'package:paemisyon/features/billing/domain/billing_plan.dart';
import 'package:paemisyon/features/billing/domain/verify_result.dart';
import 'package:paemisyon/features/billing/presentation/paywall_screen.dart';
import 'package:paemisyon/features/me/data/me_repository.dart';
import 'package:paemisyon/features/me/domain/me_profile.dart';

/// REGRESYON (kullanıcı raporu): paywall açıkken ekranın altından ardı ardına
/// "Premium etkin! 🎉" ve "Satın alma doğrulanamadı" toast'ları yağıyordu.
///
/// Kökü: işlem kuyruğunu ekran dinliyordu; her bitirilmemiş işlem için ayrı
/// toast çıkıyor, ekran ilk başarıda kapanınca kalan işlemler bitirilemiyor ve
/// her açılışta yeniden teslim ediliyordu. Kuyruk artık uygulama seviyesinde
/// (PurchaseSyncService) ve ekrana TUR başına tek sonuç düşüyor; kullanıcı
/// başlatmadıysa hiç düşmüyor.
class _FakeSync implements PurchaseSyncService {
  final _ctrl = StreamController<PurchaseSyncEvent>.broadcast();

  @override
  Stream<PurchaseSyncEvent> get events => _ctrl.stream;

  void emit(PurchaseSyncEvent e) => _ctrl.add(e);

  @override
  Future<void> buy(ProductDetails product) async {}

  @override
  Future<void> restore() async {}

  @override
  void start() {}

  @override
  void dispose() => _ctrl.close();

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _FakeBillingRepository implements BillingRepository {
  @override
  Future<List<BillingPlan>> getPlans() async => const [
        BillingPlan(
          key: 'quarterly',
          name: '3 Aylık Premium',
          price: '499.99',
          currency: 'TRY',
          period: 'quarterly',
        ),
      ];

  @override
  Future<VerifyResult> verifyPurchase({
    required String transactionJws,
    required String platform,
    String? productId,
  }) async =>
      const VerifyResult(isPremium: true);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  const profile = MeProfile(
    id: 'u1',
    email: 'ahmet@example.com',
    roles: [],
    isPremium: false,
  );

  Future<_FakeSync> pumpPaywall(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1179, 2556);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    final sync = _FakeSync();
    await tester.pumpWidget(ProviderScope(
      overrides: [
        purchaseSyncServiceProvider.overrideWithValue(sync),
        billingRepositoryProvider.overrideWithValue(_FakeBillingRepository()),
        meProvider.overrideWith((ref) => Future.value(profile)),
      ],
      child: MaterialApp(theme: AppTheme.light, home: const PaywallScreen()),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    return sync;
  }

  testWidgets('açılışta kendiliğinden gelen kuyruk turu SESSİZDİR', (t) async {
    final sync = await pumpPaywall(t);

    // Kullanıcı hiçbir şeye dokunmadı; arka planda 5 eski işlem doğrulandı.
    sync.emit(const PurchaseSyncEvent(
      premiumGranted: false,
      verified: 5,
      failed: 2,
      flow: PurchaseFlow.none,
      error: 'Ürün bir plana eşlenmedi',
    ));
    await t.pump();
    await t.pump(const Duration(milliseconds: 50));

    expect(find.byType(SnackBar), findsNothing,
        reason: 'arka plan senkronu kullanıcıya toast göstermemeli');
  });

  testWidgets('kullanıcı başlattı + premium açıldı → tek başarı toast\'ı',
      (t) async {
    final sync = await pumpPaywall(t);

    sync.emit(const PurchaseSyncEvent(
      premiumGranted: true,
      verified: 3, // üç işlem doğrulandı ama TEK toast
      failed: 0,
      flow: PurchaseFlow.buy,
    ));
    await t.pump();
    await t.pump(const Duration(milliseconds: 50)); // SnackBar giriş animasyonu

    expect(find.text('Premium etkin! 🎉'), findsOneWidget);
    expect(find.byType(SnackBar), findsOneWidget);
  });

  testWidgets('doğrulandı ama premium yok → yanıltıcı başarı mesajı VERİLMEZ',
      (t) async {
    final sync = await pumpPaywall(t);

    // Süresi dolmuş/iade edilmiş işlem: sunucu 200 döner ama isPremium=false.
    // Eski kod cevaba bakmadan "Premium etkin 🎉" diyordu.
    sync.emit(const PurchaseSyncEvent(
      premiumGranted: false,
      verified: 1,
      failed: 0,
      flow: PurchaseFlow.buy,
    ));
    await t.pump();
    await t.pump(const Duration(milliseconds: 50));

    expect(find.text('Premium etkin! 🎉'), findsNothing);
    expect(find.text('Bu hesapta aktif bir premium bulunamadı.'), findsOneWidget);
  });

  testWidgets('kullanıcı başlattı + hata → tek hata toast\'ı', (t) async {
    final sync = await pumpPaywall(t);

    sync.emit(const PurchaseSyncEvent(
      premiumGranted: false,
      verified: 0,
      failed: 4, // dört işlem patladı ama TEK toast
      flow: PurchaseFlow.buy,
      error: 'Satın alma doğrulanamadı.',
    ));
    await t.pump();
    await t.pump(const Duration(milliseconds: 50));

    expect(find.byType(SnackBar), findsOneWidget);
    expect(find.text('Satın alma doğrulanamadı.'), findsOneWidget);
  });

  testWidgets('satın alma iptali (sonuçsuz tur) → toast YOK, sessiz sıfırlama',
      (t) async {
    final sync = await pumpPaywall(t);

    // Kullanıcı Play/App Store ödeme sayfasını kapattı: batch boş biter.
    // Olay yine yayınlanır (yükleniyor durumu sıfırlansın) ama toast çıkmaz.
    sync.emit(const PurchaseSyncEvent(
      premiumGranted: false,
      verified: 0,
      failed: 0,
      flow: PurchaseFlow.buy,
    ));
    await t.pump();
    await t.pump(const Duration(milliseconds: 50));

    expect(find.byType(SnackBar), findsNothing,
        reason: 'iptal eden kullanıcıya hata toast\'ı gösterilmez');
  });

  testWidgets('geri yükleme boş döndü → kullanıcı bilgilendirilir', (t) async {
    final sync = await pumpPaywall(t);

    sync.emit(const PurchaseSyncEvent(
      premiumGranted: false,
      verified: 0,
      failed: 0,
      flow: PurchaseFlow.restore,
    ));
    await t.pump();
    await t.pump(const Duration(milliseconds: 50));

    expect(find.text('Bu hesapta geri yüklenecek satın alma bulunamadı.'),
        findsOneWidget);
  });

  testWidgets('ödeme mağazada onay bekliyor → bekleme mesajı', (t) async {
    final sync = await pumpPaywall(t);

    sync.emit(const PurchaseSyncEvent(
      premiumGranted: false,
      verified: 0,
      failed: 0,
      pending: 1,
      flow: PurchaseFlow.buy,
    ));
    await t.pump();
    await t.pump(const Duration(milliseconds: 50));

    expect(
        find.text(
            'Ödemen onay bekliyor — tamamlanınca premium kendiliğinden açılır.'),
        findsOneWidget);
  });
}

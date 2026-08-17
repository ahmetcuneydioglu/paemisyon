import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/error/failure.dart';
import '../../me/data/me_repository.dart';
import 'billing_repository.dart';

/// Bir StoreKit teslimat turunun (batch) SONUCU — ekrana tek toast düşsün diye
/// işlem başına değil, tur başına üretilir.
class PurchaseSyncEvent {
  /// Sunucu bu turda premium'u açtı mı?
  final bool premiumGranted;

  /// Doğrulanan işlem sayısı (premium açılmasa da — ör. süresi dolmuş abonelik).
  final int verified;

  /// Başarısız işlem sayısı.
  final int failed;

  /// Gösterilecek hata (varsa).
  final String? error;

  /// Kullanıcı bu turu kendisi mi başlattı (Satın Al / Geri Yükle)? Açılışta
  /// kendiliğinden gelen kuyruk temizliği SESSİZ olmalı — eski hatanın kökü
  /// buydu: her açılışta kuyruktaki işlemler toast yağmuruna dönüşüyordu.
  final bool userInitiated;

  const PurchaseSyncEvent({
    required this.premiumGranted,
    required this.verified,
    required this.failed,
    required this.userInitiated,
    this.error,
  });
}

/// StoreKit/Play işlem kuyruğunun TEK sahibi (Doc 15).
///
/// Neden ekran değil de uygulama seviyesi: `purchaseStream` yalnızca
/// "bitirilmemiş" (unfinished) işlemleri tekrar tekrar teslim eder. Dinleyici
/// paywall ekranındayken ekran kapanınca abonelik iptal oluyor, işlemler
/// bitirilemiyor ve her paywall açılışında yeniden teslim ediliyordu. Kuyruk
/// tek bir yerden, ekranın ömründen bağımsız yönetilir.
///
/// Kurallar:
/// - Her işlem EN FAZLA bir kez doğrulanır (purchaseID ile tekilleştirme).
/// - Doğrulanan / kalıcı geçersiz işlem KAPATILIR (yoksa sonsuza dek geri gelir).
/// - Geçici hatada (ağ/oturum/5xx) işlem AÇIK bırakılır — ödeme kaybolmasın.
class PurchaseSyncService {
  PurchaseSyncService(this._ref);

  final Ref _ref;
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _sub;
  final Set<String> _verified = <String>{};
  final StreamController<PurchaseSyncEvent> _events =
      StreamController<PurchaseSyncEvent>.broadcast();

  /// Sıradaki turun kullanıcı tarafından başlatılıp başlatılmadığı.
  bool _userInitiated = false;

  Stream<PurchaseSyncEvent> get events => _events.stream;

  /// Uygulama açılışında bir kez çağrılır; kuyruk sessizce temizlenir.
  void start() {
    _sub ??= _iap.purchaseStream.listen(
      _onBatch,
      onError: (Object e) => _emit(
        const PurchaseSyncEvent(
          premiumGranted: false,
          verified: 0,
          failed: 1,
          userInitiated: false,
          error: 'Mağaza bağlantısında sorun oluştu.',
        ),
      ),
    );
  }

  /// Satın alma başlat. Abonelik de ömürlük de `buyNonConsumable` ile alınır
  /// (in_app_purchase: tüketilebilir OLMAYAN her ürün bu yoldan geçer).
  Future<void> buy(ProductDetails product) async {
    _userInitiated = true;
    await _iap.buyNonConsumable(purchaseParam: PurchaseParam(productDetails: product));
  }

  Future<void> restore() async {
    _userInitiated = true;
    await _iap.restorePurchases();
  }

  Future<void> _onBatch(List<PurchaseDetails> purchases) async {
    final initiated = _userInitiated;
    _userInitiated = false;

    var granted = false;
    var verified = 0;
    var failed = 0;
    String? error;

    for (final p in purchases) {
      switch (p.status) {
        case PurchaseStatus.pending:
          continue; // sonuç ayrı bir turda gelir
        case PurchaseStatus.canceled:
          await _finish(p);
          continue;
        case PurchaseStatus.error:
          failed++;
          error ??= p.error?.message;
          await _finish(p); // kalıcı: kuyruğu tıkamasın
          continue;
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          break;
      }

      final id = p.purchaseID ?? p.verificationData.serverVerificationData;
      if (_verified.contains(id)) {
        await _finish(p); // bu oturumda zaten doğrulandı
        continue;
      }

      // Oturum yoksa doğrulama 401 alır; işlemi kapatmak ödemeyi kaybettirir.
      // Açık bırakılır, kullanıcı giriş yapınca "Geri Yükle" ile geri gelir.
      if (Supabase.instance.client.auth.currentSession == null) {
        failed++;
        error ??= 'Satın almayı tanımlamak için giriş yapmalısın.';
        continue;
      }

      try {
        final r = await _ref
            .read(billingRepositoryProvider)
            .verifyPurchase(transactionJws: p.verificationData.serverVerificationData);
        _verified.add(id);
        verified++;
        if (r.isPremium) granted = true;
        await _finish(p);
      } on PurchaseVerifyFailure catch (e) {
        failed++;
        error ??= e.message;
        if (e.permanent) await _finish(p);
        debugPrint('[billing] doğrulama hatası (kalıcı=${e.permanent}): ${e.message}');
      } catch (e) {
        failed++;
        error ??= 'Satın alma doğrulanamadı.';
        debugPrint('[billing] beklenmeyen doğrulama hatası: $e');
      }
    }

    if (granted) _ref.invalidate(meProvider); // premium anında yansısın
    if (verified > 0 || failed > 0) {
      _emit(PurchaseSyncEvent(
        premiumGranted: granted,
        verified: verified,
        failed: failed,
        userInitiated: initiated,
        error: error,
      ));
    }
  }

  Future<void> _finish(PurchaseDetails p) async {
    if (!p.pendingCompletePurchase) return;
    try {
      await _iap.completePurchase(p);
    } catch (e) {
      debugPrint('[billing] işlem kapatılamadı: $e');
    }
  }

  void _emit(PurchaseSyncEvent e) {
    if (!_events.isClosed) _events.add(e);
  }

  void dispose() {
    _sub?.cancel();
    _events.close();
  }
}

final purchaseSyncServiceProvider = Provider<PurchaseSyncService>((ref) {
  final s = PurchaseSyncService(ref);
  ref.onDispose(s.dispose);
  return s;
});

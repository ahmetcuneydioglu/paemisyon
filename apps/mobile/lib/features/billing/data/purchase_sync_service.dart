import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/error/failure.dart';
import '../../me/data/me_repository.dart';
import 'billing_repository.dart';

/// Kullanıcının bir teslimat turunu hangi eylemle başlattığı. [none] = açılışta
/// kendiliğinden gelen kuyruk temizliği (sessiz kalmalı).
enum PurchaseFlow { none, buy, restore }

/// Bir StoreKit teslimat turunun (batch) SONUCU — ekrana tek toast düşsün diye
/// işlem başına değil, tur başına üretilir.
class PurchaseSyncEvent {
  /// Sunucu bu turda premium'u açtı mı?
  final bool premiumGranted;

  /// Doğrulanan işlem sayısı (premium açılmasa da — ör. süresi dolmuş abonelik).
  final int verified;

  /// Başarısız işlem sayısı.
  final int failed;

  /// Mağazada onay bekleyen (pending) işlem sayısı — sonuç ayrı turda gelir.
  final int pending;

  /// Gösterilecek hata (varsa).
  final String? error;

  /// Turu başlatan eylem. Kullanıcı başlatmadıysa ([PurchaseFlow.none])
  /// açılıştaki kuyruk temizliğidir ve SESSİZ kalmalı — eski hatanın kökü
  /// buydu: her açılışta kuyruktaki işlemler toast yağmuruna dönüşüyordu.
  final PurchaseFlow flow;

  const PurchaseSyncEvent({
    required this.premiumGranted,
    required this.verified,
    required this.failed,
    required this.flow,
    this.pending = 0,
    this.error,
  });

  /// Kullanıcı bu turu kendisi mi başlattı (Satın Al / Geri Yükle)?
  bool get userInitiated => flow != PurchaseFlow.none;
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

  /// Sıradaki turu başlatan kullanıcı eylemi (varsa).
  PurchaseFlow _flow = PurchaseFlow.none;

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
          flow: PurchaseFlow.none,
          error: 'Mağaza bağlantısında sorun oluştu.',
        ),
      ),
    );
  }

  /// Satın alma başlat. Abonelik de ömürlük de `buyNonConsumable` ile alınır
  /// (in_app_purchase: tüketilebilir OLMAYAN her ürün bu yoldan geçer).
  Future<void> buy(ProductDetails product) async {
    _flow = PurchaseFlow.buy;
    await _iap.buyNonConsumable(purchaseParam: PurchaseParam(productDetails: product));
  }

  Future<void> restore() async {
    _flow = PurchaseFlow.restore;
    await _iap.restorePurchases();
  }

  Future<void> _onBatch(List<PurchaseDetails> purchases) async {
    final flow = _flow;
    _flow = PurchaseFlow.none;

    var granted = false;
    var verified = 0;
    var failed = 0;
    var pending = 0;
    String? error;

    for (final p in purchases) {
      switch (p.status) {
        case PurchaseStatus.pending:
          pending++;
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
        final r = await _ref.read(billingRepositoryProvider).verifyPurchase(
              // Her iki mağazada da doğrulama verisi buradan gelir: Apple'da
              // imzalı işlem (JWS), Play'de satın alma jetonu.
              transactionJws: p.verificationData.serverVerificationData,
              platform: Platform.isAndroid ? 'google' : 'apple',
              productId: p.productID,
            );
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
    // Kullanıcı başlattıysa tur SONUÇSUZ da olsa olay yayınlanır: Play/StoreKit
    // sayfası iptal edilince ya da geri yüklemede satın alma çıkmayınca batch
    // "0 doğrulanan, 0 hatalı" biter; olay gitmezse ekran sonsuza dek
    // "yükleniyor"da takılı kalıyordu.
    if (verified > 0 || failed > 0 || flow != PurchaseFlow.none) {
      _emit(PurchaseSyncEvent(
        premiumGranted: granted,
        verified: verified,
        failed: failed,
        pending: pending,
        flow: flow,
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

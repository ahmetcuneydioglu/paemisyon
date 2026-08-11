import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../../core/constants/contact.dart';
import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/contact_channels.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../me/data/me_repository.dart';
import '../data/billing_repository.dart';
import '../domain/billing_plan.dart';

/// Premium paywall (Doc 15). İki satın alma yolu desteklenir:
///
/// - **Mağaza planı** (`storeProductId*` dolu) — StoreKit akışı; imzalı işlem
///   (JWS) SUNUCUYA doğrulatılır, istemci "premium'um" diyemez.
/// - **Manuel plan** (`storeProductId*` NULL) — ödeme Telegram/Instagram üzerinden
///   elle yürür; hesabı ekip açar. Bugün satılan 3 aylık paket bu yoldadır.
///
/// Plan mağazaya bağlı değilken "Mağazada bulunamadı" hatası ve ölü buton
/// GÖSTERİLMEZ: bu bir hata değil, ürünün kasıtlı satış modelidir.
class PaywallScreen extends ConsumerStatefulWidget {
  const PaywallScreen({super.key});

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  /// Tembel: mağaza planı yoksa StoreKit/Play hiç uyandırılmaz.
  InAppPurchase get _iap => InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _sub;

  List<BillingPlan>? _plans;
  Map<String, ProductDetails> _products = {};
  bool _iapAvailable = true;
  String? _loadError;
  String? _buyingKey; // satın alınmakta olan planın key'i

  /// Mağaza akışına ait UI (geri yükle, mağaza uyarısı) yalnız mağaza planı
  /// varken anlamlıdır.
  bool get _hasStorePlans => _plans?.any((p) => p.isStoreManaged) ?? false;

  @override
  void initState() {
    super.initState();
    // purchaseStream aboneliği planlar geldikten SONRA, yalnız mağaza planı
    // varsa kurulur (_load içinde) — manuel akışta mağaza kanalına dokunulmaz.
    _load();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loadError = null);
    try {
      final plans = await ref.read(billingRepositoryProvider).getPlans();
      // Mağaza planı yoksa StoreKit'e hiç dokunma: manuel akışta mağaza
      // erişilemez olması bir sorun değil.
      final ids =
          plans.map((p) => p.storeProductId).whereType<String>().toSet();
      var available = false;
      final products = <String, ProductDetails>{};
      if (ids.isNotEmpty) {
        // Mağaza akışı var: bekleyen/geri yüklenen işlemleri dinlemeye başla.
        _sub ??= _iap.purchaseStream.listen(
          _onPurchases,
          onError: (e) => _fail('Mağaza hatası: $e'),
        );
        available = await _iap.isAvailable();
        if (available) {
          final resp = await _iap.queryProductDetails(ids);
          for (final pd in resp.productDetails) {
            products[pd.id] = pd;
          }
        }
      }
      if (!mounted) return;
      setState(() {
        _plans = plans;
        _products = products;
        _iapAvailable = available;
      });
    } catch (e) {
      if (mounted) {
        setState(() =>
            _loadError = e is Failure ? e.message : 'Planlar yüklenemedi.');
      }
    }
  }

  Future<void> _buy(BillingPlan plan) async {
    final pd = _products[plan.storeProductId];
    if (pd == null) {
      _snack('Bu ürün mağazada bulunamadı.');
      return;
    }
    setState(() => _buyingKey = plan.key);
    try {
      await _iap.buyNonConsumable(
          purchaseParam: PurchaseParam(productDetails: pd));
    } catch (e) {
      _fail('Satın alma başlatılamadı: $e');
    }
  }

  Future<void> _onPurchases(List<PurchaseDetails> purchases) async {
    for (final p in purchases) {
      switch (p.status) {
        case PurchaseStatus.pending:
          break; // gösterge _buyingKey ile
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          await _verify(p);
          break;
        case PurchaseStatus.error:
          _fail(p.error?.message ?? 'Satın alma başarısız.');
          break;
        case PurchaseStatus.canceled:
          if (mounted) setState(() => _buyingKey = null);
          break;
      }
      if (p.pendingCompletePurchase) {
        await _iap.completePurchase(p);
      }
    }
  }

  Future<void> _verify(PurchaseDetails p) async {
    try {
      final jws = p.verificationData.serverVerificationData;
      await ref
          .read(billingRepositoryProvider)
          .verifyPurchase(transactionJws: jws);
      ref.invalidate(meProvider); // premium durumu tazelensin
      if (mounted) {
        _snack('Premium etkin! 🎉');
        context.pop();
      }
    } catch (e) {
      _fail(e is Failure ? e.message : 'Satın alma doğrulanamadı.');
    } finally {
      if (mounted) setState(() => _buyingKey = null);
    }
  }

  void _fail(String m) {
    _snack(m);
    if (mounted) setState(() => _buyingKey = null);
  }

  void _snack(String m) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Premium'),
        actions: [
          // Mağaza planı yokken "geri yükle" anlamsız — hiç gösterme.
          if (_hasStorePlans)
            TextButton(
              onPressed: _iapAvailable ? () => _iap.restorePurchases() : null,
              child: const Text('Geri yükle'),
            ),
        ],
      ),
      body: _loadError != null
          ? ErrorStateView(message: _loadError!, onRetry: _load)
          : _plans == null
              ? const Padding(
                  padding: EdgeInsets.all(AppSpacing.xl),
                  child: Column(children: [
                    LoadingSkeleton(height: 96),
                    SizedBox(height: AppSpacing.lg),
                    LoadingSkeleton(height: 96),
                  ]),
                )
              : _content(),
    );
  }

  Widget _content() {
    final tokens = context.tokens;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Doc 24 §11: premium "daha çok soru" değil, KOÇUN TAM BEYNİ.
          Text('Koçunun tam beynini aç',
              style: AppTypography.title.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Ücretsiz katman gerçek antrenman verir; Premium, seni tanıyan '
            'antrenörün tamamıdır.',
            style: AppTypography.body.copyWith(color: tokens.inkSoft),
          ),
          const SizedBox(height: AppSpacing.lg),
          _valueRow(Icons.all_inclusive_rounded, 'Sınırsız soru',
              'Koç seni hiçbir gün durdurmaz.'),
          _valueRow(Icons.psychology_rounded, 'Süresiz tekrar hafızası',
              'Yanlışların asla unutulmaz — tam akıllı tekrar motoru.'),
          _valueRow(Icons.auto_awesome_rounded, 'Sınırsız AI açıklaması',
              '"Neden bu şık değil?" — istediğin kadar sor.'),
          _valueRow(Icons.shield_rounded, 'Haftada 3 seri sigortası',
              'Vardiya dostu: nöbet gecesi serini yakmaz.'),
          _valueRow(Icons.lock_open_rounded, 'Tüm premium konular',
              'Müfredatın tamamı, kilitsiz.'),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Bir dershanenin günlük çayı parasına — seni tanıyan antrenör.',
            style: AppTypography.caption.copyWith(color: tokens.inkSoft),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.lg),
          if (_hasStorePlans && !_iapAvailable)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.lg),
              child: Text(
                'Mağaza şu an kullanılamıyor. Cihazda App Store hesabı / StoreKit yapılandırması gerekli.',
                style: TextStyle(color: tokens.danger),
              ),
            ),
          ..._plans!.map(
            (p) => p.isStoreManaged ? _storePlanCard(p) : _manualPlanSection(p),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            _hasStorePlans
                ? 'Abonelik dönem sonunda otomatik yenilenir; App Store ayarlarından iptal edebilirsin.'
                : 'Otomatik yenileme yok, iptal edilecek abonelik yok. Süre bitince '
                    'hesabın kendiliğinden ücretsiz katmana döner; devam etmek '
                    'istersen bize yeniden yazarsın.',
            style: AppTypography.caption.copyWith(color: tokens.inkSoft),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _valueRow(IconData icon, String title, String sub) {
    final tokens = context.tokens;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 22, color: tokens.brand),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: AppTypography.label.copyWith(color: tokens.ink)),
                Text(sub,
                    style:
                        AppTypography.caption.copyWith(color: tokens.inkSoft)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Fiyat başlığı — her iki akışta ortak.
  Widget _priceHeader(BillingPlan plan, {required String priceText}) {
    final tokens = context.tokens;
    final period = plan.periodLabel;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(plan.name, style: AppTypography.heading.copyWith(color: tokens.ink)),
        const SizedBox(height: 2),
        Text.rich(
          TextSpan(
            text: priceText,
            style: AppTypography.title.copyWith(color: tokens.ink),
            children: [
              if (period.isNotEmpty)
                TextSpan(
                  text: ' / $period',
                  style: AppTypography.body.copyWith(color: tokens.inkSoft),
                ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Mağaza akışı (ileride tekrar kullanılabilir) ──────────────────────────

  Widget _storePlanCard(BillingPlan plan) {
    final pd = _products[plan.storeProductId];
    // Mağaza fiyatı yerelleştirilmiş gelir; yoksa backend fiyatına düş.
    final priceText = pd?.price ?? plan.priceLabel;
    final inStore = pd != null;
    final busy = _buyingKey == plan.key;
    final anyBusy = _buyingKey != null;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _priceHeader(plan, priceText: priceText),
                    if (!inStore && _iapAvailable)
                      Padding(
                        padding: const EdgeInsets.only(top: AppSpacing.xs),
                        child: Text('Mağazada bulunamadı',
                            style: AppTypography.caption
                                .copyWith(color: context.tokens.danger)),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              FilledButton(
                onPressed: (!inStore || anyBusy) ? null : () => _buy(plan),
                child: busy
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Satın Al'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Manuel akış (Telegram/Instagram) ──────────────────────────────────────

  /// Web'deki `/premium` akışının aynısı: fiyat kartı → 3 adım → kanallar.
  Widget _manualPlanSection(BillingPlan plan) {
    final tokens = context.tokens;
    final monthly = plan.monthlyEquivalentLabel;
    // Hesap e-postası eşleştirme için gerekli; yüklenmemişse satır düşürülür.
    final email = ref.watch(meProvider).valueOrNull?.email;

    final steps = <({String title, String body})>[
      (
        title: 'Bize yaz',
        body: 'Telegram (${AppContact.telegram.handle}) veya Instagram '
            '(${AppContact.instagram.handle}) üzerinden mesaj at, '
            '"${plan.name}" de.',
      ),
      (
        title: 'Ödemeyi yap',
        body: 'Ödeme bilgilerini mesajda paylaşıyoruz. Ödemeni yapıp dekontu '
            'gönderiyorsun.',
      ),
      (
        title: 'Hesabın açılır',
        body: 'Hesabını elimizle premium yapıyoruz. Aynı hesapla giriş yaptığın '
            'her yerde geçerli olur.',
      ),
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm, vertical: 3),
                    decoration: BoxDecoration(
                      color: tokens.brand.withValues(alpha: 0.12),
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusFull),
                    ),
                    child: Text('TEK PAKET',
                        style: AppTypography.caption
                            .copyWith(color: tokens.brand)),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  _priceHeader(plan, priceText: plan.priceLabel),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    monthly != null
                        ? 'Ayda $monthly — tek seferlik ödeme, otomatik yenileme yok'
                        : 'Tek seferlik ödeme, otomatik yenileme yok',
                    style: AppTypography.caption.copyWith(color: tokens.inkSoft),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('Nasıl premium olurum?',
              style: AppTypography.heading.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Uygulama içi satın alma yok. Ödemeyi doğrudan bizimle yapıyorsun, '
            'hesabını elimizle açıyoruz.',
            style: AppTypography.body.copyWith(color: tokens.inkSoft),
          ),
          const SizedBox(height: AppSpacing.lg),
          for (final (i, s) in steps.indexed) _stepRow(i + 1, s.title, s.body),
          const SizedBox(height: AppSpacing.sm),
          const ContactChannels(),
          if (email != null && email.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            Text(
              'Yazarken hesap e-postanı da ilet: $email — premiumu bu hesaba '
              'tanımlıyoruz.',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget _stepRow(int n, String title, String body) {
    final tokens = context.tokens;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Adım numarası dekoratiftir: sıra bilgisi başlık metninde de var.
          ExcludeSemantics(
            child: Container(
              width: 26,
              height: 26,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: tokens.surfaceAlt,
                shape: BoxShape.circle,
                border: Border.all(color: tokens.line),
              ),
              child: Text('$n',
                  style: AppTypography.label.copyWith(color: tokens.brand)),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$n. adım — $title',
                    style: AppTypography.label.copyWith(color: tokens.ink)),
                const SizedBox(height: 2),
                Text(body,
                    style:
                        AppTypography.body.copyWith(color: tokens.inkSoft)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

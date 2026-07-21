import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../me/data/me_repository.dart';
import '../data/billing_repository.dart';
import '../domain/billing_plan.dart';

/// Premium paywall (Doc 15). Satın alma StoreKit üzerinden başlar; imzalı işlem
/// (JWS) SUNUCUYA doğrulatılır — istemci "premium'um" diyemez. Başarıda /me tazelenir.
class PaywallScreen extends ConsumerStatefulWidget {
  const PaywallScreen({super.key});

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _sub;

  List<BillingPlan>? _plans;
  Map<String, ProductDetails> _products = {};
  bool _iapAvailable = true;
  String? _loadError;
  String? _buyingKey; // satın alınmakta olan planın key'i

  @override
  void initState() {
    super.initState();
    _sub = _iap.purchaseStream.listen(
      _onPurchases,
      onError: (e) => _fail('Mağaza hatası: $e'),
    );
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
      final available = await _iap.isAvailable();
      final products = <String, ProductDetails>{};
      if (available) {
        final ids =
            plans.map((p) => p.storeProductIdIos).whereType<String>().toSet();
        if (ids.isNotEmpty) {
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
    final pd = _products[plan.storeProductIdIos];
    if (pd == null) {
      _snack('Bu ürün mağazada bulunamadı.');
      return;
    }
    setState(() => _buyingKey = plan.key);
    try {
      await _iap.buyNonConsumable(purchaseParam: PurchaseParam(productDetails: pd));
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
      await ref.read(billingRepositoryProvider).verifyPurchase(transactionJws: jws);
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
          _valueRow(Icons.all_inclusive_rounded,
              'Sınırsız soru', 'Koç seni hiçbir gün durdurmaz.'),
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
          if (!_iapAvailable)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.lg),
              child: Text(
                'Mağaza şu an kullanılamıyor. Cihazda App Store hesabı / StoreKit yapılandırması gerekli.',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          ..._plans!.map(_planCard),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Abonelik dönem sonunda otomatik yenilenir; App Store ayarlarından iptal edebilirsin.',
            style: Theme.of(context).textTheme.bodySmall,
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

  Widget _planCard(BillingPlan plan) {
    final pd = _products[plan.storeProductIdIos];
    final priceText = pd?.price ??
        (plan.price != null ? '${plan.price} ${plan.currency}' : '—');
    final periodText = switch (plan.period) {
      'yearly' => '/yıl',
      'quarterly' => '/3 ay',
      'monthly' => '/ay',
      _ => '',
    };
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
                    Text(plan.name,
                        style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 2),
                    Text('$priceText$periodText',
                        style: Theme.of(context).textTheme.bodyLarge),
                    if (!inStore && _iapAvailable)
                      Text('Mağazada bulunamadı',
                          style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(context).colorScheme.error)),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              FilledButton(
                onPressed:
                    (!inStore || anyBusy) ? null : () => _buy(plan),
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
}

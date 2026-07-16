import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Sınırsız soru, tüm içerik',
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Premium ile günlük soru sınırı kalkar, tüm premium konular açılır.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.xl),
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

  Widget _planCard(BillingPlan plan) {
    final pd = _products[plan.storeProductIdIos];
    final priceText = pd?.price ??
        (plan.price != null ? '${plan.price} ${plan.currency}' : '—');
    final periodText = plan.period == 'yearly'
        ? '/yıl'
        : plan.period == 'monthly'
            ? '/ay'
            : '';
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

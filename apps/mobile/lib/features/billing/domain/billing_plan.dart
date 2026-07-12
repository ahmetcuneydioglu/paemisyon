/// Satın alınabilir plan (Doc 15). Fiyat backend'den bilgi amaçlı gelir;
/// asıl fiyat mağazadan (StoreKit ProductDetails) okunur.
class BillingPlan {
  final String key;
  final String name;
  final String? price;
  final String currency;
  final String? period; // monthly | yearly
  final String? storeProductIdIos;

  const BillingPlan({
    required this.key,
    required this.name,
    required this.currency,
    this.price,
    this.period,
    this.storeProductIdIos,
  });

  factory BillingPlan.fromJson(Map<String, dynamic> j) => BillingPlan(
        key: j['key'] as String,
        name: j['name'] as String,
        price: j['price'] as String?,
        currency: j['currency'] as String? ?? 'TRY',
        period: j['period'] as String?,
        storeProductIdIos: j['storeProductIdIos'] as String?,
      );
}

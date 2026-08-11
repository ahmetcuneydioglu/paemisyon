import 'dart:io' show Platform;

/// Satılabilir plan (Doc 15).
///
/// Bir plan iki yoldan biriyle satılır:
/// - **Mağaza planı** — `storeProductId*` dolu; ödeme StoreKit/Play üzerinden
///   yürür, fiyat mağazadan (ProductDetails) okunur.
/// - **Manuel plan** — `storeProductId*` NULL; ödeme Telegram/Instagram üzerinden
///   elle yürür, fiyat backend'den okunur ([priceLabel]).
class BillingPlan {
  final String key;
  final String name;
  final String? price;
  final String currency;
  final String? period; // monthly | quarterly | yearly
  final String? storeProductIdIos;
  final String? storeProductIdAndroid;

  const BillingPlan({
    required this.key,
    required this.name,
    required this.currency,
    this.price,
    this.period,
    this.storeProductIdIos,
    this.storeProductIdAndroid,
  });

  factory BillingPlan.fromJson(Map<String, dynamic> j) => BillingPlan(
        key: j['key'] as String,
        name: j['name'] as String,
        price: j['price'] as String?,
        currency: j['currency'] as String? ?? 'TRY',
        period: j['period'] as String?,
        storeProductIdIos: j['storeProductIdIos'] as String?,
        storeProductIdAndroid: j['storeProductIdAndroid'] as String?,
      );

  /// Çalışılan platformun mağaza ürün kimliği (yoksa null).
  String? get storeProductId => Platform.isIOS || Platform.isMacOS
      ? storeProductIdIos
      : storeProductIdAndroid;

  /// Ödeme mağazadan mı yürüyor? false ise manuel akış gösterilir.
  bool get isStoreManaged => storeProductId != null;

  /// Dönem → ay sayısı; bilinmeyen dönem null.
  static const Map<String, int> _periodMonths = {
    'monthly': 1,
    'quarterly': 3,
    'yearly': 12,
  };

  static const Map<String, String> _currencySuffix = {
    'TRY': 'TL',
    'USD': '\$',
    'EUR': '€',
  };

  String get _suffix => _currencySuffix[currency] ?? currency;

  /// "499.99" + TRY → "499,99 TL" (TR ondalık ayracı, para birimi sonda).
  /// Web `formatPrice` ile aynı çıktı.
  String get priceLabel {
    final raw = price;
    if (raw == null) return '—';
    final n = num.tryParse(raw);
    return n == null ? '$raw $_suffix' : '${_fixed(n)} $_suffix';
  }

  /// Dönem etiketi — "3 ay", "ay", "yıl". Bilinmeyen dönemde boş.
  String get periodLabel => switch (period) {
        'yearly' => 'yıl',
        'quarterly' => '3 ay',
        'monthly' => 'ay',
        _ => '',
      };

  /// Çok aylık planda aylık karşılık ("166,66 TL"); tek ay/bilinmeyen dönemde null.
  String? get monthlyEquivalentLabel {
    final months = _periodMonths[period ?? ''];
    final n = price != null ? num.tryParse(price!) : null;
    if (months == null || months < 2 || n == null) return null;
    return '${_fixed(n / months)} $_suffix';
  }

  static String _fixed(num n) => n.toStringAsFixed(2).replaceAll('.', ',');
}

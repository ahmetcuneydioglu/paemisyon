import 'dart:async';

import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, TargetPlatform;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:url_launcher/url_launcher.dart';

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
import '../data/purchase_sync_service.dart';
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
///
/// MAĞAZA POLİTİKASI (Apple 3.1.1 + Google Play Ödeme Politikası): mobil
/// uygulamada dijital içeriğin harici satın alınmasına YÖNLENDİRME
/// (Telegram/Instagram, ödeme adımları, "bize yaz", fiyat-CTA) yasaktır. Bu
/// yüzden iOS ve Android derlemelerinde manuel satın alma bölümü GİZLENİR;
/// premium yalnız DEĞERİYLE tanıtılır (çok platformlu servis istisnası:
/// kullanıcı web'den alıp aynı hesapla uygulamada kullanır). Web sürdürür.
class PaywallScreen extends ConsumerStatefulWidget {
  const PaywallScreen({super.key});

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  /// Tembel: mağaza planı yoksa StoreKit/Play hiç uyandırılmaz.
  InAppPurchase get _iap => InAppPurchase.instance;

  /// İşlem kuyruğunu bu ekran DEĞİL, uygulama seviyesindeki servis yönetir
  /// (bkz. PurchaseSyncService). Ekran yalnız sonucu dinler.
  StreamSubscription<PurchaseSyncEvent>? _sub;

  List<BillingPlan>? _plans;
  Map<String, ProductDetails> _products = {};
  bool _iapAvailable = true;
  String? _loadError;
  String? _buyingKey; // satın alınmakta olan planın key'i
  String? _selectedKey; // paket seçici — varsayılan yıllık

  /// Mağaza akışına ait UI (geri yükle, mağaza uyarısı) yalnız mağaza planı
  /// varken anlamlıdır.
  bool get _hasStorePlans => _plans?.any((p) => p.isStoreManaged) ?? false;

  @override
  void initState() {
    super.initState();
    // Sonuç akışı: satın alma/geri yükleme turları burada tek toast'a düşer.
    _sub = ref.read(purchaseSyncServiceProvider).events.listen(_onSyncEvent);
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
        available = await _iap.isAvailable();
        if (available) {
          final resp = await _iap.queryProductDetails(ids);
          for (final pd in resp.productDetails) {
            // Android'de bir abonelik, her base plan / teklif (offer)
            // kombinasyonu için AYNI id ile ayrı ProductDetails üretir. Map'e
            // körlemesine yazmak "son gelen teklif" gibi rastgele bir seçim
            // yapar; deterministik olarak EN DÜŞÜK fiyatlı teklif tutulur
            // (tanıtım fiyatı varsa kullanıcı lehine olan).
            final cur = products[pd.id];
            if (cur == null || pd.rawPrice < cur.rawPrice) {
              products[pd.id] = pd;
            }
          }
        }
      }
      if (!mounted) return;
      setState(() {
        _plans = plans;
        _products = products;
        _iapAvailable = available;
        // Varsayılan seçim: yıllık (yoksa ilk mağaza planı).
        final store = plans.where((p) => p.isStoreManaged).toList();
        _selectedKey = store.isEmpty
            ? null
            : store
                .firstWhere((p) => p.period == 'yearly', orElse: () => store.first)
                .key;
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
      await ref.read(purchaseSyncServiceProvider).buy(pd);
    } catch (e) {
      _fail('Satın alma başlatılamadı: $e');
    }
  }

  Future<void> _restore() async {
    setState(() => _buyingKey = _selectedKey);
    try {
      await ref.read(purchaseSyncServiceProvider).restore();
    } catch (e) {
      _fail('Geri yükleme başlatılamadı: $e');
    }
  }

  /// Kuyruk servisinden gelen TUR sonucu. Kullanıcı başlatmadıysa (açılışta
  /// kendiliğinden yapılan kuyruk temizliği) hiçbir şey gösterilmez.
  void _onSyncEvent(PurchaseSyncEvent e) {
    if (!mounted) return;
    setState(() => _buyingKey = null);
    if (e.premiumGranted) {
      _snack('Premium etkin! 🎉');
      // Kapatılabiliyorsa kapat: paywall'a derin bağlantıyla doğrudan
      // gelinmişse geri gidilecek sayfa yoktur, koşulsuz pop çökertir.
      final router = GoRouter.maybeOf(context);
      if (router != null && router.canPop()) router.pop();
      return;
    }
    if (!e.userInitiated) return; // sessiz senkron
    if (e.failed > 0) {
      _snack(e.error ?? 'Satın alma doğrulanamadı.');
    } else if (e.pending > 0) {
      // Ödeme mağazada onay bekliyor (ör. banka onayı): sonuç ayrı turda gelir.
      _snack('Ödemen onay bekliyor — tamamlanınca premium kendiliğinden açılır.');
    } else if (e.verified > 0) {
      // Doğrulandı ama premium açılmadı: süresi dolmuş/iade edilmiş işlem.
      _snack('Bu hesapta aktif bir premium bulunamadı.');
    } else if (e.flow == PurchaseFlow.restore) {
      // Geri yükleme hiçbir satın alma getirmedi — sessiz kalınırsa kullanıcı
      // butonun çalışmadığını sanır.
      _snack('Bu hesapta geri yüklenecek satın alma bulunamadı.');
    }
    // flow == buy + sonuçsuz tur: kullanıcı mağaza sayfasını iptal etti —
    // toast gerekmez, yalnız yükleniyor durumu sıfırlanır.
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

  /// Genel destek e-postası (iOS'ta satın alma yerine). launchUrl başarısızsa
  /// (posta uygulaması yok) kullanıcı sessiz kalmasın diye adres kopyalanabilir
  /// biçimde snackbar'da gösterilir.
  Future<void> _openSupport() async {
    final uri = Uri.parse(AppContact.email.url);
    try {
      final ok =
          await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok) _snack('E-posta: ${AppContact.email.handle}');
    } catch (_) {
      _snack('E-posta: ${AppContact.email.handle}');
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
              onPressed: _iapAvailable ? _restore : null,
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
    // MAĞAZA POLİTİKALARI: hem Apple 3.1.1 hem Google Play Ödeme Politikası,
    // uygulama içi dijital içerik için harici ödemeye YÖNLENDİRMEYİ yasaklar.
    // Bu yüzden manuel akış (Telegram/Instagram + adımlar) ve fiyat imalı
    // teşvik her iki mağaza uygulamasında da gizlenir; web'de sürer.
    final hideManualPurchase = defaultTargetPlatform == TargetPlatform.iOS ||
        defaultTargetPlatform == TargetPlatform.android;
    // Mağaza metinleri platforma göre: Android kullanıcısına App Store /
    // StoreKit'ten söz etmek hem yanlış talimat hem Play politika riskidir.
    final isAndroid = defaultTargetPlatform == TargetPlatform.android;
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
          // Fiyat imalı teşvik yalnız iOS-dışında (Apple 3.1.1 temkini).
          if (!hideManualPurchase) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Bir dershanenin günlük çayı parasına — seni tanıyan antrenör.',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          if (_hasStorePlans && !_iapAvailable)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.lg),
              child: Text(
                isAndroid
                    ? 'Mağaza şu an kullanılamıyor. Cihazda Google Play ve oturum açılmış bir Google hesabı gerekli.'
                    : 'Mağaza şu an kullanılamıyor. Cihazda App Store hesabı / StoreKit yapılandırması gerekli.',
                style: TextStyle(color: tokens.danger),
              ),
            ),
          // Mağaza planları paket seçici olarak; mağazaya bağlı ama bu
          // platformda ID'si olmayan plan hiç gösterilmez. Manuel plan
          // (hiçbir mağazaya bağlı olmayan) iOS'ta gizli.
          if (_hasStorePlans) _packageSelector(),
          ..._plans!.where((p) => !p.hasStoreBinding).map((p) =>
              hideManualPurchase ? const SizedBox.shrink() : _manualPlanSection(p)),
          const SizedBox(height: AppSpacing.xl),
          if (_hasStorePlans) ...[
            // Mağaza abonelik metadata kuralı (Apple + Google Play): otomatik
            // yenileme koşulları + koşullar/gizlilik bağlantıları paywall'da
            // görünür olmalı. Metin, kullanıcının GERÇEK mağazasını söyler.
            Text(
              isAndroid
                  ? 'Yıllık abonelik, dönem sonunda iptal edilmedikçe Google Play '
                      'hesabından otomatik yenilenir. Aboneliği Google Play > '
                      'Ödemeler ve abonelikler > Abonelikler bölümünden istediğin '
                      'an iptal edebilirsin. Ömürlük paket tek seferlik ödemedir, '
                      'yenilenmez.'
                  : 'Yıllık abonelik, dönem bitiminden en az 24 saat önce iptal '
                      'edilmedikçe App Store hesabından otomatik yenilenir. Aboneliği '
                      'App Store > Abonelikler bölümünden istediğin an iptal '
                      'edebilirsin. Ömürlük paket tek seferlik ödemedir, yenilenmez.',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              textAlign: TextAlign.center,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextButton(
                  onPressed: () =>
                      launchUrl(Uri.parse('https://paemisyon.com/kosullar')),
                  child: const Text('Kullanım Koşulları'),
                ),
                Text('·',
                    style:
                        AppTypography.caption.copyWith(color: tokens.inkSoft)),
                TextButton(
                  onPressed: () =>
                      launchUrl(Uri.parse('https://paemisyon.com/gizlilik')),
                  child: const Text('Gizlilik Politikası'),
                ),
              ],
            ),
          ] else
            Text(
              hideManualPurchase
                  // iOS: satın alma yolu/yönlendirme YOK — yalnız erişim modeli.
                  ? 'Premium, hesabına tanımlıdır — aynı hesapla giriş yaptığın '
                      'her yerde geçerli olur.'
                  : 'Otomatik yenileme yok, iptal edilecek abonelik yok. Süre bitince '
                      'hesabın kendiliğinden ücretsiz katmana döner; devam etmek '
                      'istersen bize yeniden yazarsın.',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              textAlign: TextAlign.center,
            ),
          // iOS: satın alma yönlendirmesi yerine GENEL müşteri desteği (Apple
          // 3.1.1: destek serbest, satın alma CTA'sı değil). Kullanıcı buradan
          // premium dahil her konuda ekibe ulaşır. (Android/web'de zaten manuel
          // akıştaki kanallar var; orada tekrarlanmaz.)
          if (hideManualPurchase) ...[
            const SizedBox(height: AppSpacing.lg),
            Center(
              child: TextButton.icon(
                onPressed: _openSupport,
                icon: Icon(AppContact.email.icon,
                    size: 18, color: tokens.brand),
                label: Text(
                  'Soruların için: ${AppContact.email.handle}',
                  style: AppTypography.label.copyWith(color: tokens.brand),
                ),
              ),
            ),
          ],
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

  // ── Mağaza akışı: paket seçici ────────────────────────────────────────────

  /// İki paketli seçici (yıllık ön seçili) + tek CTA + geri yükle.
  Widget _packageSelector() {
    final tokens = context.tokens;
    final store = _plans!.where((p) => p.isStoreManaged).toList();
    final selected = store.firstWhere(
      (p) => p.key == _selectedKey,
      orElse: () => store.first,
    );
    final selectedInStore = _products[selected.storeProductId] != null;
    final busy = _buyingKey != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...store.map((p) => _packageCard(p, isSelected: p.key == selected.key)),
        const SizedBox(height: AppSpacing.sm),
        FilledButton(
          onPressed: (!selectedInStore || busy) ? null : () => _buy(selected),
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
          ),
          child: _buyingKey != null
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : Text(
                  selected.isLifetime
                      ? 'Ömürlük Premium Al'
                      : 'Yıllık Premium Başlat',
                  style: AppTypography.label,
                ),
        ),
        if (!selectedInStore && _iapAvailable)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.xs),
            child: Text('Bu paket mağazada bulunamadı.',
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(color: tokens.danger)),
          ),
        TextButton(
          onPressed: _iapAvailable ? _restore : null,
          child: const Text('Satın alımları geri yükle'),
        ),
      ],
    );
  }

  Widget _packageCard(BillingPlan plan, {required bool isSelected}) {
    final tokens = context.tokens;
    final pd = _products[plan.storeProductId];
    // Mağaza fiyatı yerelleştirilmiş gelir; yoksa backend fiyatına düş.
    final priceText = pd?.price ?? plan.priceLabel;
    final monthly = plan.monthlyEquivalentLabel;
    final badge = plan.isLifetime ? null : 'EN AVANTAJLI';
    final subtitle = plan.isLifetime
        ? 'Tek ödeme — ömür boyu premium'
        : monthly != null
            ? 'Ayda $monthly\'ye denk gelir'
            : 'Yılda bir yenilenir';

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Material(
        color: isSelected ? tokens.brand.withValues(alpha: 0.06) : tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          onTap: () => setState(() => _selectedKey = plan.key),
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              border: Border.all(
                color: isSelected ? tokens.brand : tokens.line,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isSelected
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_off_rounded,
                  color: isSelected ? tokens.brand : tokens.inkSoft,
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(plan.name,
                                style: AppTypography.label
                                    .copyWith(color: tokens.ink)),
                          ),
                          if (badge != null) ...[
                            const SizedBox(width: AppSpacing.sm),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.sm, vertical: 2),
                              decoration: BoxDecoration(
                                color: tokens.brand,
                                borderRadius: BorderRadius.circular(
                                    AppSpacing.radiusFull),
                              ),
                              child: Text(badge,
                                  style: AppTypography.caption.copyWith(
                                      color: tokens.surface,
                                      fontWeight: FontWeight.w700)),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(subtitle,
                          style: AppTypography.caption
                              .copyWith(color: tokens.inkSoft)),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(priceText,
                        style:
                            AppTypography.heading.copyWith(color: tokens.ink)),
                    if (!plan.isLifetime)
                      Text('/ yıl',
                          style: AppTypography.caption
                              .copyWith(color: tokens.inkSoft)),
                  ],
                ),
              ],
            ),
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

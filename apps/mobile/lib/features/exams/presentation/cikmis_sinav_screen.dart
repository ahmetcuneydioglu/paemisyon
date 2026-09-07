import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../data/calisma_kaydi.dart';
import '../data/cikmis_sinav_repository.dart';
import '../domain/cikmis_sinav_models.dart';

/// Bir çıkmış sınav dönemi (Doc 36 §4) — iki mod ve konu dağılımı.
///
/// Modlar kasıtlı olarak ayrı:
///   Sınav gibi çöz — mevcut arşiv motoru (sabit set, süreli, net). Sıralamaya
///                    girmez; resmî sıralama randevulu denemelerin hakkı.
///   Çalışma modu   — soru soru, cevabı anında, açıklamasıyla. Süre yok.
/// Aynı düğmeye iki iş yaptırmak, adayın hangi ölçümün "gerçek" olduğunu
/// ayırt edememesi demekti.
class CikmisSinavScreen extends ConsumerWidget {
  final String slug;
  const CikmisSinavScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(cikmisSinavDetayProvider(slug));
    return Scaffold(
      appBar: AppBar(title: const Text('Çıkmış Sınav')),
      body: data.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: const [
            LoadingSkeleton(height: 96),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 72),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 72),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 160),
          ],
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Sınav yüklenemedi.',
          onRetry: () => ref.invalidate(cikmisSinavDetayProvider(slug)),
        ),
        data: (d) => _Govde(detay: d),
      ),
    );
  }
}

class _Govde extends ConsumerWidget {
  final CikmisSinavDetay detay;
  const _Govde({required this.detay});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    // Çalışma modu ilerlemesi cihazda saklanıyor; kartta göstermezsek aday
    // kaldığı yerden devam edebileceğini bilmez.
    final calisilan =
        ref.watch(calismaIlerlemeProvider(detay.ozet.slug)).valueOrNull ?? 0;
    final o = detay.ozet;
    final resmi = o.tur == CikmisSinavTuru.resmi;
    final toplam = o.dersDagilimi.fold<int>(0, (t, d) => t + d.adet);

    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xxl),
      children: [
        Text(o.ad, style: AppTypography.title.copyWith(color: tokens.ink)),
        const SizedBox(height: AppSpacing.xs),
        Text(
          [
            o.kurum,
            if (o.tarih != null) _tarihMetni(o.tarih!),
          ].join(' · '),
          style: AppTypography.caption.copyWith(color: tokens.inkSoft),
        ),
        if (o.ozet != null && o.ozet!.trim().isNotEmpty) ...[
          const SizedBox(height: AppSpacing.md),
          Text(o.ozet!,
              style: AppTypography.body.copyWith(color: tokens.inkSoft)),
        ],

        // ── Modlar ──
        //
        // Sıra kullanıcının durumuna göre: yarım sınav varsa devam etmek,
        // bitirdiyse sonucunu görmek öne çıkar. Eskiden ekran durumu hiç
        // bilmiyordu ve sınavı bitirmiş biri "Sınav gibi çöz"e dokununca
        // SESSİZCE sıfırdan yeni sınav başlıyordu (7 Eyl 2026 bildirimi).
        // Tekrar çözmek meşru bir ihtiyaç ama bilerek seçilmeli.
        if (resmi && detay.sorular.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.xl),
          if (o.examId != null) ...[
            if (detay.devamEden != null)
              _ModKarti(
                ikon: Icons.play_circle_outline_rounded,
                baslik: 'Kaldığın yerden devam et',
                aciklama: _devamMetni(detay.devamEden!),
                vurgulu: true,
                onTap: () => _sinavaGir(context, o),
              )
            else if (detay.benimSonucum != null) ...[
              _ModKarti(
                ikon: Icons.assessment_outlined,
                baslik: 'Sonucunu gör',
                aciklama: _sonucMetni(detay.benimSonucum!),
                vurgulu: true,
                onTap: () => context
                    .push('/denemeler/sonuc/${detay.benimSonucum!.attemptId}'),
              ),
              _ModKarti(
                ikon: Icons.replay_rounded,
                baslik: 'Tekrar çöz',
                aciklama:
                    'Aynı sorular, süre tutarak baştan. Önceki sonucun '
                    'silinmez; en iyisi burada görünür.',
                onTap: () => _sinavaGir(context, o),
              ),
            ] else
              _ModKarti(
                ikon: Icons.timer_outlined,
                baslik: 'Sınav gibi çöz',
                aciklama:
                    'Aynı sorular, süre tutarak. Netini görürsün; yanlışların '
                    'çalışma defterine düşer. Sıralamaya girmez.',
                vurgulu: true,
                onTap: () => _sinavaGir(context, o),
              ),
          ],
          _ModKarti(
            ikon: Icons.menu_book_outlined,
            baslik: calisilan > 0 ? 'Çalışmaya devam et' : 'Çalışma modu',
            aciklama: calisilan > 0
                ? '$calisilan/${detay.sorular.length} soru işaretlenmiş. '
                    'Kaldığın yerden devam edersin; süre yok.'
                : 'Soru soru, süre yok. Cevabı işaretle, doğrusunu ve neden '
                    'doğru olduğunu hemen gör.',
            onTap: () async {
              await context.push('/denemeler/cikmis/${o.slug}/calis');
              ref.invalidate(calismaIlerlemeProvider(o.slug));
            },
          ),
        ],

        // Eksik soru sessizce yutulmaz: aday "100 soru" beklerken 97 görürse
        // bunun bir sebebi olduğunu bilmeli.
        if (detay.kapaliSoru > 0) ...[
          const SizedBox(height: AppSpacing.md),
          _Not(
            'Bu dönemin ${detay.kapaliSoru} sorusu henüz hazırlık aşamasında ve '
            'burada görünmüyor.',
          ),
        ],
        if (detay.iptalSayisi > 0) ...[
          const SizedBox(height: AppSpacing.sm),
          _Not(
            'Sınavda iptal edilen ${detay.iptalSayisi} soru çalışma modunda '
            'işaretli olarak yer alır; puanlamaya katılmaz.',
          ),
        ],
        if (!resmi) ...[
          const SizedBox(height: AppSpacing.lg),
          const _Not(
            'Bu dönemin resmî kitapçığı yayımlanmadı. Aşağıdaki dağılım sınava '
            'girenlerin beyanından derlendi ve yaklaşıktır — soru metinleri '
            'yoktur.',
          ),
        ],

        // ── Konu dağılımı ──
        if (o.dersDagilimi.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.xl),
          Text('Konu dağılımı',
              style: AppTypography.heading.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.md),
          for (final d in o.dersDagilimi)
            _DagilimSatiri(ders: d, toplam: toplam == 0 ? 1 : toplam),
        ],
      ],
    );
  }

  void _sinavaGir(BuildContext context, CikmisSinavOzet o) => context.push(
        '/quiz',
        extra: {'archiveExamId': o.examId, 'topicName': o.ad, 'mode': 'exam'},
      );

  static String _devamMetni(CikmisDevamEden d) {
    final kalan = d.kalanSaniye;
    final sure = kalan == null
        ? ''
        : kalan <= 0
            ? ' · süre doldu'
            : ' · ${(kalan / 60).ceil()} dk kaldı';
    return '${d.cevaplanan}/${d.toplamSoru} soru cevaplandı$sure. '
        'Süre ilk başlangıçtan işliyor.';
  }

  static String _sonucMetni(CikmisSonucum r) {
    final net = r.score != null ? ' · Net ${r.score!.toStringAsFixed(2)}' : '';
    return 'Bu sınavı çözdün: ${r.correctCount} doğru, ${r.wrongCount} yanlış, '
        '${r.blankCount} boş$net. Soru soru incele.';
  }

  static const _aylar = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık', // ignore: require_trailing_commas
  ];

  static String _tarihMetni(DateTime d) =>
      '${d.day} ${_aylar[d.month - 1]} ${d.year}';
}

class _ModKarti extends StatelessWidget {
  final IconData ikon;
  final String baslik;
  final String aciklama;
  final bool vurgulu;
  final VoidCallback onTap;

  const _ModKarti({
    required this.ikon,
    required this.baslik,
    required this.aciklama,
    required this.onTap,
    this.vurgulu = false,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Semantics(
      button: true,
      label: baslik,
      child: PressableScale(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: vurgulu ? tokens.brand.withValues(alpha: 0.06) : null,
            border: Border.all(
              color: vurgulu ? tokens.brand.withValues(alpha: 0.45) : tokens.line,
            ),
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm + 2),
                decoration: BoxDecoration(
                  color: tokens.brand.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: Icon(ikon, color: tokens.brand),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(baslik,
                        style:
                            AppTypography.label.copyWith(color: tokens.ink)),
                    const SizedBox(height: 2),
                    Text(aciklama,
                        style: AppTypography.caption
                            .copyWith(color: tokens.inkSoft)),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.xs),
              Icon(Icons.chevron_right_rounded, color: tokens.inkSoft),
            ],
          ),
        ),
      ),
    );
  }
}

class _Not extends StatelessWidget {
  final String metin;
  const _Not(this.metin);

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: tokens.surfaceAlt,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, size: 16, color: tokens.inkSoft),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(metin,
                style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
          ),
        ],
      ),
    );
  }
}

class _DagilimSatiri extends StatelessWidget {
  final DersDagilimi ders;
  final int toplam;
  const _DagilimSatiri({required this.ders, required this.toplam});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final oran = (ders.adet / toplam).clamp(0.0, 1.0);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(ders.ders,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.body.copyWith(color: tokens.ink)),
              ),
              const SizedBox(width: AppSpacing.sm),
              Text('${ders.adet}',
                  style: AppTypography.label.copyWith(color: tokens.inkSoft)),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            child: LinearProgressIndicator(
              value: oran,
              minHeight: 6,
              backgroundColor: tokens.surfaceAlt,
              valueColor: AlwaysStoppedAnimation<Color>(tokens.brand),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../data/cikmis_sinav_repository.dart';
import '../domain/cikmis_sinav_models.dart';

/// Çıkmış sınavlar vitrini (Doc 36 §4) — webdeki /paem-cikmis-sorular'ın
/// uygulamadaki karşılığı.
///
/// Neden Denemeler listesinin İÇİNDE bir bölüm değil de ayrı ekran: deneme
/// listesi randevulu denemelerin yeri ve "Canlı → Sıradaki → Geçmiş"
/// hiyerarşisi üstünde duruyor. Her zaman açık duran çıkmış sınavlar o
/// hiyerarşiye karışırsa aday hangisinin canlı olduğunu ayırt edemez —
/// sunucu tarafında da aynı karar var (exams.service.list, `pastExam: null`).
class CikmisSinavlarScreen extends ConsumerWidget {
  const CikmisSinavlarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(cikmisSinavlarProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Çıkmış Sınav Soruları')),
      body: data.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: const [
            LoadingSkeleton(height: 132),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 132),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 132),
          ],
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Çıkmış sınavlar yüklenemedi.',
          onRetry: () => ref.invalidate(cikmisSinavlarProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const EmptyStateView(
              icon: Icons.history_edu_outlined,
              message: 'Henüz yayımlanmış çıkmış sınav yok.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(cikmisSinavlarProvider),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm,
                  AppSpacing.lg, AppSpacing.xxl),
              itemCount: list.length + 1,
              itemBuilder: (context, i) {
                if (i == 0) return const _Intro();
                final s = list[i - 1];
                return StaggeredReveal(
                  index: i,
                  child: _DonemKarti(sinav: s),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _Intro extends StatelessWidget {
  const _Intro();

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Text(
        'Polis Akademisi’nin yayımladığı gerçek sınavlar. Süre tutarak sınav '
        'gibi çözebilir ya da soru soru, açıklamalarıyla çalışabilirsin.',
        style: AppTypography.body.copyWith(color: tokens.inkSoft),
      ),
    );
  }
}

/// Dönem kartı: rozet + dağılım özeti. Rozet alt yazıya GİZLENMEZ (Doc 36 §1)
/// — "konu analizi"ni "çıkmış soru" diye sunmak bankanın varlık nedenini
/// harcamak olur.
class _DonemKarti extends StatelessWidget {
  final CikmisSinavOzet sinav;
  const _DonemKarti({required this.sinav});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final resmi = sinav.tur == CikmisSinavTuru.resmi;
    final ilkUc = sinav.dersDagilimi.take(3).toList();

    return Semantics(
      button: true,
      label: '${sinav.kisaAd}, ${resmi ? 'çıkmış sınav' : 'konu analizi'}',
      child: PressableScale(
        onTap: () => context.push('/denemeler/cikmis/${sinav.slug}'),
        child: Container(
          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            border: Border.all(color: tokens.line),
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      sinav.kisaAd,
                      style: AppTypography.heading.copyWith(color: tokens.ink),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  if (sinav.isPremium) ...[
                    const _PremiumRozeti(),
                    const SizedBox(width: AppSpacing.xs),
                  ],
                  _TurRozeti(resmi: resmi),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                sinav.ad,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                resmi
                    ? '${sinav.soruSayisi ?? 0} soru · cevaplı ve açıklamalı'
                    : 'Sınav yayımlanmadı — yalnız konu dağılımı',
                style: AppTypography.label.copyWith(
                  color: resmi ? tokens.ink : tokens.inkSoft,
                ),
              ),
              if (ilkUc.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.xs,
                  runSpacing: AppSpacing.xs,
                  children: [
                    for (final d in ilkUc) _DersCipi(ders: d),
                    if (sinav.dersDagilimi.length > ilkUc.length)
                      _DersCipi(
                        ders: DersDagilimi(
                          ders: '+${sinav.dersDagilimi.length - ilkUc.length} ders',
                          adet: 0,
                        ),
                        sayiGoster: false,
                      ),
                  ],
                ),
              ],
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Text(
                    sinav.cozulebilir ? 'Çöz ve çalış' : 'Dağılımı gör',
                    style: AppTypography.label.copyWith(color: tokens.brand),
                  ),
                  Icon(Icons.chevron_right_rounded,
                      size: 18, color: tokens.brand),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TurRozeti extends StatelessWidget {
  final bool resmi;
  const _TurRozeti({required this.resmi});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final fg = resmi ? tokens.success : tokens.inkSoft;
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: AppSpacing.xs / 2),
      decoration: BoxDecoration(
        color: fg.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(resmi ? Icons.verified_rounded : Icons.insights_rounded,
              size: 13, color: fg),
          const SizedBox(width: AppSpacing.xs),
          Text(resmi ? 'Çıkmış sınav' : 'Konu analizi',
              style: AppTypography.caption
                  .copyWith(color: fg, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _PremiumRozeti extends StatelessWidget {
  const _PremiumRozeti();

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: AppSpacing.xs / 2),
      decoration: BoxDecoration(
        color: tokens.accentStreak.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_rounded, size: 13, color: tokens.accentStreak),
          const SizedBox(width: AppSpacing.xs),
          Text('Premium',
              style: AppTypography.caption.copyWith(
                  color: tokens.accentStreak, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _DersCipi extends StatelessWidget {
  final DersDagilimi ders;
  final bool sayiGoster;
  const _DersCipi({required this.ders, this.sayiGoster = true});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: AppSpacing.xs / 2),
      decoration: BoxDecoration(
        color: tokens.surfaceAlt,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      child: Text(
        sayiGoster ? '${ders.ders} ${ders.adet}' : ders.ders,
        style: AppTypography.caption.copyWith(color: tokens.inkSoft),
      ),
    );
  }
}

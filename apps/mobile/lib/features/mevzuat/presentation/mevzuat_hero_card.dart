import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../data/mevzuat_repository.dart';

/// Bugün ekranı Mevzuat vitrini (Doc 29 — "ikiz hero"): navy hero ÇÖZ der,
/// bu mor kart OKU der. Quiz hero'sunun ~yarısı yükseklikte, kendi renk
/// dünyasında; ana eylem duruma göre akıllıdır:
///   okuma yarım kaldıysa → "Kaldığın yerden devam et",
///   yoksa → arama kapısı.
/// Altta hızlı çipler: kaydedilen maddeler > öne çıkan kanunlar.
class MevzuatHeroCard extends ConsumerWidget {
  const MevzuatHeroCard({super.key});

  // Sabit marka dünyası (navy hero ile aynı ilke — token DEĞİL): iki temada
  // da aynı derin menekşe. Navy'nin kardeşi: ÇÖZ mavi, OKU menekşe.
  static const _violetTop = Color(0xFF4A3F8F);
  static const _violetMid = Color(0xFF362E6E);
  static const _violetDeep = Color(0xFF221E4E);
  static const _lilac = Color(0xFFBFB3F2); // yumuşak metin (softInk eşi)

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progress =
        ref.watch(readingProgressProvider).valueOrNull ?? const [];
    final bookmarks =
        ref.watch(articleBookmarksProvider).valueOrNull ?? const [];
    final laws = ref.watch(mevzuatListProvider).valueOrNull ?? const [];
    final continueItem = progress.isNotEmpty ? progress.first : null;

    // Çipler: kaydedilenler öncelikli; yoksa soru sayısına göre öne çıkanlar.
    final chips = bookmarks.isNotEmpty
        ? [
            for (final b in bookmarks.take(4))
              (
                label: '${b.lawShort} m.${b.no}',
                route:
                    '/mevzuat/${b.lawSlug}/oku?madde=${Uri.encodeComponent(b.no)}',
              ),
          ]
        : [
            for (final l in ([...laws.where((l) => l.readable)]
                  ..sort((a, b) => b.questionCount.compareTo(a.questionCount)))
                .take(4))
              (label: l.displayShort, route: '/mevzuat/${l.slug}'),
          ];

    return PressableScale(
      onTap: () => context.push('/mevzuat'),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg + 4),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [_violetTop, _violetMid, _violetDeep],
            stops: [0, .55, 1],
          ),
          boxShadow: [
            BoxShadow(
              color: _violetDeep.withValues(alpha: .35),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              Container(
                width: 30,
                height: 30,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .12),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: const Icon(Icons.balance_rounded,
                    size: 17, color: _lilac),
              ),
              const SizedBox(width: AppSpacing.sm + 2),
              Text('Mevzuat Merkezi',
                  style: AppTypography.heading
                      .copyWith(color: Colors.white)),
              const Spacer(),
              const Icon(Icons.chevron_right_rounded, color: _lilac),
            ]),
            const SizedBox(height: AppSpacing.md),
            // ── Ana eylem: devam > arama ──
            if (continueItem != null)
              _actionRow(
                context,
                icon: Icons.auto_stories_rounded,
                title: 'Kaldığın yerden devam et',
                subtitle:
                    '${continueItem.lawShort} · Madde ${continueItem.no}',
                onTap: () => context.push(
                    '/mevzuat/${continueItem.lawSlug}/oku?madde=${Uri.encodeComponent(continueItem.no)}'),
              )
            else
              _actionRow(
                context,
                icon: Icons.search_rounded,
                title: 'Kanun, madde veya kavram ara',
                subtitle: '"cmk 90" · "zor kullanma" · "pvsk"',
                onTap: () => context.push('/mevzuat/ara'),
              ),
            if (chips.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              SizedBox(
                height: 30,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: chips.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (context, i) {
                    final c = chips[i];
                    return Semantics(
                      button: true,
                      label: c.label,
                      child: Material(
                        color: Colors.white.withValues(alpha: .08),
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusFull),
                        child: InkWell(
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusFull),
                          onTap: () => context.push(c.route),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(
                                  AppSpacing.radiusFull),
                              border: Border.all(
                                  color:
                                      Colors.white.withValues(alpha: .22)),
                            ),
                            padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.md,
                                vertical: AppSpacing.xs),
                            child: Text(
                              c.label,
                              style: AppTypography.label.copyWith(
                                  color: Colors.white, fontSize: 12),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _actionRow(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Semantics(
      button: true,
      label: '$title — $subtitle',
      excludeSemantics: true,
      child: Material(
        color: Colors.white.withValues(alpha: .10),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border:
                  Border.all(color: Colors.white.withValues(alpha: .16)),
            ),
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md, vertical: AppSpacing.sm + 4),
            child: Row(children: [
              Icon(icon, size: 22, color: _lilac),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: AppTypography.label.copyWith(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700)),
                    const SizedBox(height: 1),
                    Text(subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.caption
                            .copyWith(color: _lilac)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_rounded,
                  size: 18, color: _lilac),
            ]),
          ),
        ),
      ),
    );
  }
}

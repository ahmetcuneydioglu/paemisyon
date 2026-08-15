import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final progress =
        ref.watch(readingProgressProvider).valueOrNull ?? const [];
    final bookmarks =
        ref.watch(articleBookmarksProvider).valueOrNull ?? const [];
    final laws = ref.watch(mevzuatListProvider).valueOrNull ?? const [];

    final base = tokens.accentAtlas;
    final deep = Color.lerp(base, Colors.black, .38)!;
    final soft = Colors.white.withValues(alpha: .78);
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
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [base, deep],
          ),
          boxShadow: [
            BoxShadow(
              color: deep.withValues(alpha: .30),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              const Icon(Icons.balance_rounded,
                  size: 20, color: Colors.white),
              const SizedBox(width: AppSpacing.sm),
              Text('Mevzuat Merkezi',
                  style: AppTypography.heading
                      .copyWith(color: Colors.white)),
              const Spacer(),
              Icon(Icons.chevron_right_rounded, color: soft),
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
                        color: Colors.white.withValues(alpha: .14),
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusFull),
                        child: InkWell(
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusFull),
                          onTap: () => context.push(c.route),
                          child: Padding(
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
        color: Colors.white.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md, vertical: AppSpacing.sm + 2),
            child: Row(children: [
              Icon(icon, size: 22, color: Colors.white),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: AppTypography.label.copyWith(
                            color: Colors.white, fontSize: 14)),
                    const SizedBox(height: 1),
                    Text(subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.caption.copyWith(
                            color: Colors.white.withValues(alpha: .75))),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_rounded,
                  size: 18, color: Colors.white.withValues(alpha: .8)),
            ]),
          ),
        ),
      ),
    );
  }
}

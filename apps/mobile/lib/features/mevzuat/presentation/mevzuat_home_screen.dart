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
import '../data/mevzuat_repository.dart';

/// Mevzuat Merkezi ana sayfası (Doc 29 §6): arama + devam + kaydedilenler +
/// son okunanlar + sınavlarda öne çıkanlar + tür grupları.
/// Boş bölgeler GÖRÜNMEZ — yeni kullanıcıya sade bir arama sayfası kalır.
class MevzuatHomeScreen extends ConsumerWidget {
  const MevzuatHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final list = ref.watch(mevzuatListProvider);
    final progress = ref.watch(readingProgressProvider).valueOrNull ?? const [];
    final bookmarks = ref.watch(articleBookmarksProvider).valueOrNull ?? const [];

    return Scaffold(
      appBar: AppBar(title: const Text('Mevzuat')),
      body: list.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(children: [
            LoadingSkeleton(height: 52),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 96),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 96),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Mevzuat yüklenemedi.',
          onRetry: () => ref.invalidate(mevzuatListProvider),
        ),
        data: (items) {
          final published = items.where((l) => l.articleCount > 0).toList();
          final featured = [...published]
            ..sort((a, b) => b.questionCount.compareTo(a.questionCount));
          var i = 0;
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(mevzuatListProvider);
              ref.invalidate(readingProgressProvider);
              ref.invalidate(articleBookmarksProvider);
            },
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.xxl),
              children: [
                StaggeredReveal(
                  index: i++,
                  child: Text(
                    'Polislik ve sınavlarda ihtiyaç duyduğun hükme saniyeler içinde ulaş.',
                    style: AppTypography.body.copyWith(color: tokens.inkSoft),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                // ── Arama kapısı — dokununca arama ekranı (klavye açık) ──
                StaggeredReveal(
                  index: i++,
                  child: _SearchEntry(
                      onTap: () => context.push('/mevzuat/ara')),
                ),
                // ── Kaldığın yerden devam ──
                if (progress.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xl),
                  StaggeredReveal(
                    index: i++,
                    child: _ContinueCard(
                      item: progress.first,
                      onTap: () => _openReader(
                          context, progress.first.lawSlug, progress.first.no),
                    ),
                  ),
                ],
                // ── Kaydedilenler ──
                if (bookmarks.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xl),
                  StaggeredReveal(
                      index: i++,
                      child: _sectionHeader(context, 'KAYDEDİLENLER')),
                  const SizedBox(height: AppSpacing.sm),
                  StaggeredReveal(
                    index: i++,
                    child: SizedBox(
                      height: 36,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: bookmarks.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(width: AppSpacing.sm),
                        itemBuilder: (context, bi) {
                          final b = bookmarks[bi];
                          return ActionChip(
                            avatar: Icon(Icons.bookmark_rounded,
                                size: 15, color: tokens.brand),
                            label: Text('${b.lawShort} m.${b.no}'),
                            labelStyle: AppTypography.label
                                .copyWith(color: tokens.ink, fontSize: 12),
                            onPressed: () =>
                                _openReader(context, b.lawSlug, b.no),
                          );
                        },
                      ),
                    ),
                  ),
                ],
                // ── Son okunanlar ──
                if (progress.length > 1) ...[
                  const SizedBox(height: AppSpacing.xl),
                  StaggeredReveal(
                      index: i++,
                      child: _sectionHeader(context, 'SON OKUNANLAR')),
                  const SizedBox(height: AppSpacing.sm),
                  for (final p in progress.skip(1).take(3))
                    StaggeredReveal(
                      index: i++,
                      child: ListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        leading: Icon(Icons.history_rounded,
                            size: 20, color: tokens.inkSoft),
                        title: Text('${p.lawShort} — Madde ${p.no}',
                            style: AppTypography.body
                                .copyWith(color: tokens.ink, fontSize: 14)),
                        trailing: Icon(Icons.chevron_right_rounded,
                            size: 18, color: tokens.inkSoft),
                        onTap: () => _openReader(context, p.lawSlug, p.no),
                      ),
                    ),
                ],
                // ── Sınavlarda öne çıkanlar (soru sayısına göre) ──
                if (featured.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xl),
                  StaggeredReveal(
                      index: i++,
                      child:
                          _sectionHeader(context, 'SINAVLARDA ÖNE ÇIKANLAR')),
                  const SizedBox(height: AppSpacing.sm),
                  for (final l in featured.take(6))
                    StaggeredReveal(
                      index: i++,
                      child: _LegislationTile(
                        item: l,
                        onTap: () => context.push('/mevzuat/${l.slug}'),
                      ),
                    ),
                ],
                // ── Tür grupları (gelecek türler bilgi mimarisinde görünür) ──
                const SizedBox(height: AppSpacing.xl),
                StaggeredReveal(
                    index: i++, child: _sectionHeader(context, 'TÜM MEVZUAT')),
                const SizedBox(height: AppSpacing.sm),
                StaggeredReveal(
                  index: i++,
                  child: Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: [
                      _TypeChip(
                        label: 'Kanunlar',
                        count: published.where((l) => l.type == 'kanun').length,
                        enabled: true,
                        onTap: () => _showAll(context, published
                            .where((l) => l.type == 'kanun')
                            .toList()),
                      ),
                      _TypeChip(
                        label: 'Yönetmelikler',
                        count: published
                            .where((l) => l.type == 'yonetmelik')
                            .length,
                        enabled: published
                            .any((l) => l.type == 'yonetmelik'),
                        onTap: () => _showAll(context, published
                            .where((l) => l.type == 'yonetmelik')
                            .toList()),
                      ),
                      const _TypeChip(label: 'CBK', count: 0, enabled: false),
                      const _TypeChip(
                          label: 'Genelgeler', count: 0, enabled: false),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  static void _openReader(BuildContext context, String slug, String no) =>
      context.push('/mevzuat/$slug/oku?madde=${Uri.encodeComponent(no)}');

  void _showAll(BuildContext context, List<LegislationSummary> items) {
    if (items.isEmpty) return;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        builder: (ctx, controller) => ListView.builder(
          controller: controller,
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.xl),
          itemCount: items.length,
          itemBuilder: (ctx, i) => _LegislationTile(
            item: items[i],
            onTap: () {
              Navigator.pop(ctx);
              context.push('/mevzuat/${items[i].slug}');
            },
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(BuildContext context, String label) => Text(label,
      style: AppTypography.caption
          .copyWith(color: context.tokens.inkSoft, letterSpacing: .8));
}

class _SearchEntry extends StatelessWidget {
  final VoidCallback onTap;
  const _SearchEntry({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Semantics(
      button: true,
      label: 'Kanun, madde veya konu ara',
      child: Material(
        color: tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          onTap: onTap,
          child: Container(
            height: 52,
            padding:
                const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            decoration: BoxDecoration(
              border: Border.all(color: tokens.line),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            child: Row(children: [
              Icon(Icons.search_rounded, color: tokens.inkSoft),
              const SizedBox(width: AppSpacing.sm),
              Text('Kanun, madde veya konu ara…',
                  style:
                      AppTypography.body.copyWith(color: tokens.inkSoft)),
            ]),
          ),
        ),
      ),
    );
  }
}

class _ContinueCard extends StatelessWidget {
  final ReadingProgressItem item;
  final VoidCallback onTap;
  const _ContinueCard({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return PressableScale(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: tokens.accentAtlas.withValues(alpha: .08),
          border: Border.all(color: tokens.accentAtlas.withValues(alpha: .4)),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Row(children: [
          Icon(Icons.auto_stories_rounded,
              size: 26, color: tokens.accentAtlas),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Kaldığın yerden devam et',
                    style: AppTypography.label.copyWith(color: tokens.ink)),
                const SizedBox(height: 2),
                Text('${item.lawName} · Madde ${item.no}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.caption
                        .copyWith(color: tokens.inkSoft)),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: tokens.inkSoft),
        ]),
      ),
    );
  }
}

class _LegislationTile extends StatelessWidget {
  final LegislationSummary item;
  final VoidCallback onTap;
  const _LegislationTile({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: PressableScale(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: tokens.surface,
            border: Border.all(color: tokens.line),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: Row(children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: tokens.brand.withValues(alpha: .08),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Text(
                item.number ?? '§',
                style: AppTypography.label
                    .copyWith(color: tokens.brand, fontSize: 12),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.body.copyWith(
                          color: tokens.ink, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(
                    [
                      '${item.articleCount} madde',
                      if (item.questionCount > 0)
                        '${item.questionCount} soru çıkmış',
                    ].join(' · '),
                    style: AppTypography.caption
                        .copyWith(color: tokens.inkSoft),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: tokens.inkSoft),
          ]),
        ),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final int count;
  final bool enabled;
  final VoidCallback? onTap;
  const _TypeChip(
      {required this.label,
      required this.count,
      required this.enabled,
      this.onTap});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return ActionChip(
      label: Text(enabled ? '$label ($count)' : '$label · yakında'),
      labelStyle: AppTypography.label.copyWith(
        fontSize: 12,
        color: enabled ? tokens.ink : tokens.inkSoft.withValues(alpha: .6),
      ),
      onPressed: enabled ? onTap : null,
      disabledColor: tokens.surfaceAlt,
    );
  }
}

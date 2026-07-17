import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/heat_bar.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';

/// Madde Atlası — FETİH HARİTASI (Doc 25 §4, Doc 24 §10 fikir 2):
/// kanunu madde madde temizleme. Madde çipine dokun → o maddeden seans;
/// maddenin tüm soruları en az bir kez doğru çözülünce madde "fethedilir".
class AtlasScreen extends ConsumerWidget {
  final String topicId;
  final String topicName;
  const AtlasScreen({super.key, required this.topicId, required this.topicName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final atlas = ref.watch(atlasProvider(topicId));
    return Scaffold(
      appBar: AppBar(title: const Text('Madde Atlası')),
      body: atlas.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(children: [
            LoadingSkeleton(height: 120),
            SizedBox(height: AppSpacing.md),
            LoadingSkeleton(height: 200),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Atlas yüklenemedi.',
          onRetry: () => ref.invalidate(atlasProvider(topicId)),
        ),
        data: (a) => a.articles.isEmpty
            ? EmptyStateView(
                icon: Icons.map_rounded,
                message:
                    '$topicName için etiketli madde henüz yok — sorular '
                    'madde etiketi aldıkça harita burada belirir.',
              )
            : _Body(atlas: a),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  final TopicAtlas atlas;
  const _Body({required this.atlas});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final total = atlas.articles.length;
    final hottest = atlas.articles
        .map((a) => a.questionCount)
        .fold<int>(1, (m, c) => c > m ? c : m);
    final sortedByHeat = [...atlas.articles]
      ..sort((a, b) => b.questionCount.compareTo(a.questionCount));

    Future<void> startArticleSession(AtlasArticle art) async {
      await context.push('/quiz', extra: {
        'topicId': atlas.topicId,
        'topicName': '${atlas.topicName} · m.${art.no}',
        'mode': 'practice',
        'articleNo': art.no,
        'count': art.questionCount.clamp(1, 10),
      });
      ref.invalidate(atlasProvider(atlas.topicId));
    }

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text(atlas.topicName,
            style: AppTypography.heading.copyWith(color: tokens.ink)),
        const SizedBox(height: AppSpacing.md),

        // ── Fetih özeti ──
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: tokens.accentAtlas.withValues(alpha: 0.08),
            border: Border.all(color: tokens.accentAtlas),
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Fetih haritan — ${atlas.conqueredCount}/$total madde temiz',
                style: AppTypography.label.copyWith(color: tokens.ink),
              ),
              const SizedBox(height: AppSpacing.sm),
              // Madde çipleri: fethedilen dolu, kısmî yarı, dokunulmamış boş.
              Wrap(
                spacing: AppSpacing.xs,
                runSpacing: AppSpacing.xs,
                children: [
                  for (final art in atlas.articles)
                    _ArticleChip(
                      article: art,
                      onTap: () => startArticleSession(art),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Maddeye dokun → o maddeden seans. Tüm soruları doğru '
                'çözülen madde fethedilir.',
                style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Isı listesi: en çok soru çıkan maddeler ──
        Text('EN ÇOK SORU ÇIKAN MADDELER',
            style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
        const SizedBox(height: AppSpacing.sm),
        for (final art in sortedByHeat)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.xs),
            child: HeatBar(
              label: 'm.${art.no}',
              count: art.questionCount,
              ratio: art.questionCount / hottest,
              onTap: () => startArticleSession(art),
            ),
          ),
      ],
    );
  }
}

/// Madde çipi: fetih durumuna göre üç hal — dolu / kısmî / boş.
class _ArticleChip extends StatelessWidget {
  final AtlasArticle article;
  final VoidCallback onTap;
  const _ArticleChip({required this.article, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final partial = !article.conquered && article.clearedCount > 0;
    final bg = article.conquered
        ? tokens.accentAtlas
        : partial
            ? tokens.accentAtlas.withValues(alpha: 0.25)
            : tokens.surface;
    final fg = article.conquered ? tokens.surface : tokens.ink;

    return Semantics(
      button: true,
      label:
          'Madde ${article.no}: ${article.clearedCount}/${article.questionCount} soru temiz'
          '${article.conquered ? ", fethedildi" : ""}',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        child: Container(
          constraints: const BoxConstraints(
              minWidth: AppSpacing.minTouchTarget,
              minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md, vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: bg,
            border: Border.all(
                color: article.conquered || partial
                    ? tokens.accentAtlas
                    : tokens.line),
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          alignment: Alignment.center,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('m.${article.no}',
                  style: AppTypography.label.copyWith(color: fg)),
              Text('${article.clearedCount}/${article.questionCount}',
                  style: AppTypography.caption.copyWith(
                      color: article.conquered
                          ? tokens.surface
                          : tokens.inkSoft)),
            ],
          ),
        ),
      ),
    );
  }
}

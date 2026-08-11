import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../coach/data/coach_repository.dart';
import '../../coach/domain/coach_models.dart';

/// Rozet koleksiyonu (Doc 28 P2-12) — web'deki /me/badges vitrininin mobil eşi.
/// Kilitli rozetler soluk ama GÖRÜNÜR: hedef, motivasyonun parçasıdır
/// (Doc 24 §5 — "sıradaki rozet" çekim gücü). Kazanılanlarda tarih künyesi.
class BadgesScreen extends ConsumerWidget {
  const BadgesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badges = ref.watch(badgesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Rozetlerim')),
      body: badges.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(children: [
            LoadingSkeleton(height: 60),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 300),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Rozetler yüklenemedi.',
          onRetry: () => ref.invalidate(badgesProvider),
        ),
        data: (c) => _Body(collection: c),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  final BadgeCollection collection;
  const _Body({required this.collection});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          sliver: SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: tokens.surfaceAlt,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              ),
              child: Row(
                children: [
                  Icon(Icons.military_tech_rounded,
                      color: tokens.accentStreak, size: 28),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Text(
                      collection.earnedCount == 0
                          ? 'İlk rozetin çok yakın — bir seans yeter.'
                          : '${collection.totalCount} rozetin ${collection.earnedCount} tanesi sende.',
                      style: AppTypography.body.copyWith(color: tokens.ink),
                    ),
                  ),
                  Text(
                    '${collection.earnedCount}/${collection.totalCount}',
                    style: AppTypography.heading
                        .copyWith(color: tokens.accentStreak),
                  ),
                ],
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.xl),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 190,
              mainAxisSpacing: AppSpacing.sm,
              crossAxisSpacing: AppSpacing.sm,
              childAspectRatio: 0.95,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, i) => _BadgeCell(badge: collection.items[i]),
              childCount: collection.items.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _BadgeCell extends StatelessWidget {
  final BadgeItem badge;
  const _BadgeCell({required this.badge});

  IconData get _icon {
    final k = badge.key;
    if (k.startsWith('streak')) return Icons.local_fire_department_rounded;
    if (k.contains('exam')) return Icons.assignment_turned_in_rounded;
    if (k.startsWith('accuracy')) return Icons.gps_fixed_rounded;
    return Icons.task_alt_rounded; // solved ailesi + first_session
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final earned = badge.earned;
    final accent = earned ? tokens.accentStreak : tokens.inkSoft;
    final semantics = earned
        ? '${badge.name} rozeti kazanıldı. ${badge.description}'
        : '${badge.name} rozeti kilitli. ${badge.description}';
    return Semantics(
      label: semantics,
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: earned
              ? Color.alphaBlend(
                  tokens.accentStreak.withValues(alpha: 0.08), tokens.surface)
              : tokens.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
              color: earned
                  ? tokens.accentStreak.withValues(alpha: 0.45)
                  : tokens.line),
        ),
        child: Opacity(
          opacity: earned ? 1 : 0.6,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(_icon, size: 34, color: accent),
                  if (!earned)
                    Positioned(
                      right: -6,
                      bottom: -2,
                      child: Icon(Icons.lock_rounded,
                          size: 14, color: tokens.inkSoft),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(badge.name,
                  textAlign: TextAlign.center,
                  style: AppTypography.label.copyWith(color: tokens.ink)),
              const SizedBox(height: AppSpacing.xs),
              Text(
                earned && badge.earnedAt != null
                    ? _date(badge.earnedAt!)
                    : badge.description,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _date(DateTime d) =>
    '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';

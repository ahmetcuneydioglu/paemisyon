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
import '../../../shared/widgets/primary_button.dart';
import '../data/review_repository.dart';

/// Tekrar (Doc 12 §8 + Doc 28 P0-⑤): Yanlışlarım / Favoriler — artık CANLI:
/// listeden tur başlar (review reçetesi / fromBookmarks), favoriden çıkarılır.
class ReviewScreen extends StatelessWidget {
  const ReviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Tekrar'),
          bottom: const TabBar(
            tabs: [Tab(text: 'Yanlışlarım'), Tab(text: 'Favoriler')],
          ),
        ),
        body: const TabBarView(
          children: [
            _ReviewList(wrong: true),
            _ReviewList(wrong: false),
          ],
        ),
      ),
    );
  }
}

class _ReviewList extends ConsumerWidget {
  final bool wrong;
  const _ReviewList({required this.wrong});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = wrong ? wrongAnswersProvider : bookmarksProvider;
    final data = ref.watch(provider);
    final tokens = context.tokens;

    Future<void> startSession(int itemCount) async {
      await context.push('/quiz', extra: {
        'topicName': wrong ? 'Yanlış Turu' : 'Favorilerim',
        'mode': wrong ? 'review' : 'practice',
        if (!wrong) 'fromBookmarks': true,
        'count': itemCount.clamp(1, 20),
      });
      // Tur sonrası kuyruklar değişir (doğru çözülen yanlış düşer).
      ref.invalidate(wrongAnswersProvider);
      ref.invalidate(bookmarksProvider);
    }

    return data.when(
      loading: () => ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: const [
          LoadingSkeleton(height: 56),
          SizedBox(height: AppSpacing.sm),
          LoadingSkeleton(height: 56)
        ],
      ),
      error: (e, _) => ErrorStateView(
        message: e is Failure ? e.message : 'Yüklenemedi.',
        onRetry: () => ref.invalidate(provider),
      ),
      data: (list) => list.isEmpty
          ? EmptyStateView(
              icon: wrong
                  ? Icons.check_circle_rounded
                  : Icons.bookmark_border_rounded,
              message: wrong
                  ? 'Açık yanlışın yok — kuyruk temiz. Yeni yanlışlar '
                      'çözüldükçe burada birikir, doğru çözünce düşer.'
                  : 'Henüz favori sorun yok. Tur içinde ⭐ ile işaretle, '
                      'burada koleksiyonun olsun.',
            )
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(provider),
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  // ── Birincil eylem: listeden tur (Doc 28 P0-⑤) ──
                  PrimaryButton(
                    label: wrong
                        ? 'Yanlış turunu başlat (${list.length})'
                        : 'Favorilerden tur (${list.length})',
                    onPressed: () => startSession(list.length),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.sm),
                    child: Text(
                      wrong
                          ? 'Doğru çözdüğün soru kuyruktan düşer — kaybolmaz, çözülür.'
                          : 'Yıldızını kaldırmak listeden çıkarır.',
                      style: AppTypography.caption
                          .copyWith(color: tokens.inkSoft),
                    ),
                  ),
                  for (final it in list)
                    Padding(
                      padding:
                          const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: Card(
                        margin: EdgeInsets.zero,
                        child: ListTile(
                          title: Text(it.stem ?? '(soru)',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis),
                          subtitle: Text([
                            if (it.topicName != null) it.topicName!,
                            if (wrong && it.wrongCount != null)
                              '${it.wrongCount}x yanlış',
                          ].join(' · ')),
                          trailing: wrong
                              ? null
                              : IconButton(
                                  tooltip: 'Favoriden çıkar',
                                  icon: Icon(Icons.star_rounded,
                                      color: tokens.accentStreak),
                                  onPressed: () =>
                                      _removeBookmark(context, ref, it),
                                ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Future<void> _removeBookmark(
      BuildContext context, WidgetRef ref, ReviewItem it) async {
    try {
      await ref.read(reviewRepositoryProvider).removeBookmark(it.questionId);
      ref.invalidate(bookmarksProvider);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Çıkarılamadı, tekrar dene.')),
        );
      }
    }
  }
}

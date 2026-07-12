import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/review_repository.dart';

/// Tekrar (Doc 12 §8): Yanlışlarım / Favoriler sekmeleri.
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
    return data.when(
      loading: () => ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
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
                  ? 'Henüz yanlışın yok, harika!'
                  : 'Henüz favori sorun yok.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: list.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, i) {
                final it = list[i];
                return Card(
                  child: ListTile(
                    title: Text(it.stem ?? '(soru)',
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                    subtitle: Text([
                      if (it.topicName != null) it.topicName!,
                      if (wrong && it.wrongCount != null)
                        '${it.wrongCount}x yanlış',
                    ].join(' · ')),
                  ),
                );
              },
            ),
    );
  }
}

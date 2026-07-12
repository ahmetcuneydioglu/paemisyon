import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/progress_repository.dart';

/// İlerleme ekranı (Doc 12 §7): özet istatistik + streak + konu bazlı mastery.
class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(progressSummaryProvider);
    final topics = ref.watch(topicProgressProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('İlerlemem')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(progressSummaryProvider);
          ref.invalidate(topicProgressProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: [
            summary.when(
              loading: () => const LoadingSkeleton(height: 120),
              error: (e, _) => ErrorStateView(
                message: e is Failure ? e.message : 'Yüklenemedi.',
                onRetry: () => ref.invalidate(progressSummaryProvider),
              ),
              data: (s) => _SummaryCard(summary: s),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Konu ilerlemesi',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: AppSpacing.sm),
            topics.when(
              loading: () => const LoadingSkeleton(height: 60),
              error: (e, _) => const SizedBox.shrink(),
              data: (list) => list.isEmpty
                  ? const EmptyStateView(
                      icon: Icons.insights_rounded,
                      message:
                          'Henüz veri yok. Bir quiz çöz, ilerlemen burada görünsün.',
                    )
                  : Column(children: list.map(_topicTile).toList()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _topicTile(TopicProgressItem t) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(t.topicName)),
                Text('%${t.mastery}'),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppSpacing.xs),
              child:
                  LinearProgressIndicator(value: t.mastery / 100, minHeight: 6),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text('${t.correctCount}/${t.solvedCount} doğru',
                style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final ProgressSummary summary;
  const _SummaryCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _stat(context, '🔥 ${summary.currentStreak}', 'Seri'),
                _stat(context, '%${summary.accuracy}', 'İsabet'),
                _stat(context, '${summary.totalSolved}', 'Çözülen'),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '${summary.totalSessions} oturum · en uzun seri ${summary.longestStreak}',
              style: TextStyle(color: scheme.outline, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(BuildContext context, String value, String label) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.headlineSmall),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

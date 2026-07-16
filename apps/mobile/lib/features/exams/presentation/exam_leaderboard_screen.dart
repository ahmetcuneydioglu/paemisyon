import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/exams_repository.dart';
import '../domain/exam_models.dart';

/// Deneme sıralaması (Doc 18 §2.5) — pencere kapanmadan kapalı; NET'e göre.
class ExamLeaderboardScreen extends ConsumerWidget {
  final String examId;
  const ExamLeaderboardScreen({super.key, required this.examId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(examLeaderboardProvider(examId));
    return Scaffold(
      appBar: AppBar(title: const Text('Sınav Sıralaması')),
      body: data.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(children: [
            LoadingSkeleton(height: 56),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 56),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Sıralama yüklenemedi.',
          onRetry: () => ref.invalidate(examLeaderboardProvider(examId)),
        ),
        data: (lb) {
          if (!lb.available) {
            return const EmptyStateView(
              icon: Icons.lock_clock_rounded,
              message:
                  'Sıralama, sınav süresi dolduktan sonra açılır.\nBiraz sonra tekrar bak.',
            );
          }
          if (lb.top.isEmpty) {
            return const EmptyStateView(
              icon: Icons.emoji_events_outlined,
              message: 'Bu denemeye henüz kimse katılmadı.',
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  itemCount: lb.top.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.xs),
                  itemBuilder: (context, i) => _RankTile(row: lb.top[i]),
                ),
              ),
              if (lb.me != null && !lb.top.any((r) => r.isMe))
                _MyRank(row: lb.me!),
            ],
          );
        },
      ),
    );
  }
}

class _RankTile extends StatelessWidget {
  final ExamRankRow row;
  const _RankTile({required this.row});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final medal = switch (row.rank) {
      1 => '🥇',
      2 => '🥈',
      3 => '🥉',
      _ => null,
    };
    return Card(
      color: row.isMe ? scheme.primaryContainer : null,
      child: ListTile(
        dense: true,
        leading: SizedBox(
          width: 36,
          child: Center(
            child: medal != null
                ? Text(medal, style: const TextStyle(fontSize: 20))
                : Text('#${row.rank}', style: Theme.of(context).textTheme.titleSmall),
          ),
        ),
        title: Text(row.isMe ? '${row.displayName} (sen)' : row.displayName,
            maxLines: 1, overflow: TextOverflow.ellipsis,
            style: row.isMe ? const TextStyle(fontWeight: FontWeight.w700) : null),
        subtitle: Text('D ${row.correctCount} · Y ${row.wrongCount} · B ${row.blankCount}'),
        trailing: Text('${row.score.toStringAsFixed(2)} net',
            style: Theme.of(context).textTheme.titleSmall),
      ),
    );
  }
}

class _MyRank extends StatelessWidget {
  final ExamRankRow row;
  const _MyRank({required this.row});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(AppSpacing.lg),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: scheme.primaryContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Text('🎯'),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text('Senin sıran: #${row.rank}',
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: scheme.onPrimaryContainer)),
            ),
            Text('${row.score.toStringAsFixed(2)} net',
                style: TextStyle(fontWeight: FontWeight.w700, color: scheme.onPrimaryContainer)),
          ],
        ),
      ),
    );
  }
}

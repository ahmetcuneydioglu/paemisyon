import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/list_row_stat.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/mastery_bar.dart';
import '../data/progress_repository.dart';

/// Performans (Doc 25 bölge 4): tek bakışta durum + KONU HARİTASI —
/// ders bazlı gruplu güç/zaaf haritası; satıra dokun → kapatma seansı.
class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final summary = ref.watch(progressSummaryProvider);
    final topics = ref.watch(topicProgressProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Performans')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(progressSummaryProvider);
          ref.invalidate(topicProgressProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            summary.when(
              loading: () => const LoadingSkeleton(height: 120),
              error: (e, _) => ErrorStateView(
                message: e is Failure ? e.message : 'Yüklenemedi.',
                onRetry: () => ref.invalidate(progressSummaryProvider),
              ),
              data: (s) => _SummaryCard(summary: s),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text('KONU HARİTASI',
                style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
            const SizedBox(height: AppSpacing.xs),
            Text('Zayıf konular üstte — dokun, kapatma seansı başlasın.',
                style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
            const SizedBox(height: AppSpacing.sm),
            topics.when(
              loading: () => const LoadingSkeleton(height: 60),
              error: (e, _) => const SizedBox.shrink(),
              data: (list) => list.isEmpty
                  ? const EmptyStateView(
                      icon: Icons.insights_rounded,
                      message:
                          'Harita ilk seansla başlar — çözdükçe güç ve zaaf burada belirir.',
                    )
                  : _TopicMap(items: list),
            ),
          ],
        ),
      ),
    );
  }
}

/// Ders bazlı gruplu harita. Liste mastery artan sırada gelir (zayıf önce);
/// derslerin ilk görülme sırası korunur — en zayıf konusu olan ders üstte.
class _TopicMap extends ConsumerWidget {
  final List<TopicProgressItem> items;
  const _TopicMap({required this.items});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final byCourse = <String, List<TopicProgressItem>>{};
    for (final t in items) {
      byCourse.putIfAbsent(t.courseName, () => []).add(t);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final entry in byCourse.entries) ...[
          Padding(
            padding: const EdgeInsets.only(
                top: AppSpacing.md, bottom: AppSpacing.xs),
            child: Text(entry.key,
                style: AppTypography.label.copyWith(color: tokens.ink)),
          ),
          Container(
            decoration: BoxDecoration(
              color: tokens.surface,
              border: Border.all(color: tokens.line),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            ),
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Column(
              children: [
                for (final t in entry.value)
                  ListRowStat(
                    title: t.topicName,
                    subtitle: '${t.correctCount}/${t.solvedCount} doğru',
                    trailing: SizedBox(
                      width: 100,
                      child: MasteryBar(value: t.mastery / 100),
                    ),
                    onTap: () => context.push('/quiz', extra: {
                      'topicId': t.topicId,
                      'topicName': t.topicName,
                      'mode': 'practice',
                      'count': 10,
                    }).then((_) {
                      ref.invalidate(topicProgressProvider);
                      ref.invalidate(progressSummaryProvider);
                    }),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final ProgressSummary summary;
  const _SummaryCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: tokens.surface,
        border: Border.all(color: tokens.line),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
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
            '${summary.totalSessions} oturum · en uzun seri ${summary.longestStreak} gün',
            style: AppTypography.caption.copyWith(color: tokens.inkSoft),
          ),
        ],
      ),
    );
  }

  Widget _stat(BuildContext context, String value, String label) {
    final tokens = context.tokens;
    return Column(
      children: [
        Text(value,
            style:
                AppTypography.display.copyWith(fontSize: 24, color: tokens.ink)),
        Text(label,
            style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
      ],
    );
  }
}

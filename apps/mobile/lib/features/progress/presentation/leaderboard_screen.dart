import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/leaderboard_repository.dart';

/// Liderlik tablosu (Doc 13 V1): günlük/aylık, puan = doğru cevap sayısı.
/// Moral bozmayan ton (Doc 12): sıralaman ne olursa olsun teşvik edici.
class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Sıralama'),
          bottom: const TabBar(tabs: [Tab(text: 'Bugün'), Tab(text: 'Bu Ay')]),
        ),
        body: const TabBarView(
          children: [
            _Board(period: 'daily'),
            _Board(period: 'monthly'),
          ],
        ),
      ),
    );
  }
}

class _Board extends ConsumerWidget {
  final String period;
  const _Board({required this.period});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(leaderboardProvider(period));
    return data.when(
      loading: () => ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: const [
          LoadingSkeleton(height: 56),
          SizedBox(height: AppSpacing.sm),
          LoadingSkeleton(height: 56),
          SizedBox(height: AppSpacing.sm),
          LoadingSkeleton(height: 56),
        ],
      ),
      error: (e, _) => ErrorStateView(
        message: e is Failure ? e.message : 'Yüklenemedi.',
        onRetry: () => ref.invalidate(leaderboardProvider(period)),
      ),
      data: (board) => Column(
        children: [
          Expanded(
            child: board.top.isEmpty
                ? const EmptyStateView(
                    icon: Icons.emoji_events_outlined,
                    message:
                        'Henüz kimse puan almadı.\nİlk sırayı kapma şansı — soru çözmeye başla!',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    itemCount: board.top.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.xs),
                    itemBuilder: (context, i) =>
                        _Row(row: board.top[i], context: context),
                  ),
          ),
          // Kendi durumun — listede olmasan da her zaman görünür.
          SafeArea(
            top: false,
            child: Container(
              margin: const EdgeInsets.all(AppSpacing.lg),
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Text('🎯'),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(
                      board.myRank != null
                          ? 'Senin sıran: #${board.myRank} · ${board.myPoints} puan'
                          : 'Henüz puanın yok — bir soru çöz, tabloya gir!',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color:
                                Theme.of(context).colorScheme.onPrimaryContainer,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final LeaderboardRow row;
  final BuildContext context;
  const _Row({required this.row, required this.context});

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
                : Text('#${row.rank}',
                    style: Theme.of(context).textTheme.titleSmall),
          ),
        ),
        title: Text(
          row.isMe ? '${row.displayName} (sen)' : row.displayName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: row.isMe ? const TextStyle(fontWeight: FontWeight.w700) : null,
        ),
        trailing: Text('${row.points} puan',
            style: Theme.of(context).textTheme.titleSmall),
      ),
    );
  }
}

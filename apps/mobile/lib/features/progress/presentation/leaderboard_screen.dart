import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/leaderboard_repository.dart';

/// Liderlik tablosu (Doc 13 V1 + Doc 28 P2-13): Bugün/Bu Ay (günlük puan) +
/// Genel (deneme ortalaması, podyumlu). Moral bozmayan ton (Doc 12): sıran ne
/// olursa olsun "sen" satırı teşvik eder, suçlamaz.
class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Sıralama'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Bugün'),
            Tab(text: 'Bu Ay'),
            Tab(text: 'Genel'),
          ]),
        ),
        body: const TabBarView(
          children: [
            _Board(period: 'daily'),
            _Board(period: 'monthly'),
            _GlobalBoard(),
          ],
        ),
      ),
    );
  }
}

// ── Günlük/aylık: puan = doğru cevap sayısı ──

class _Board extends ConsumerWidget {
  final String period;
  const _Board({required this.period});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(leaderboardProvider(period));
    return data.when(
      loading: () => const _BoardSkeleton(),
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
                    itemBuilder: (context, i) => _RankRow(
                      rank: board.top[i].rank,
                      displayName: board.top[i].displayName,
                      avatarUrl: board.top[i].avatarUrl,
                      isMe: board.top[i].isMe,
                      trailing: '${board.top[i].points} puan',
                    ),
                  ),
          ),
          _MeBar(
            text: board.myRank != null
                ? 'Senin sıran: #${board.myRank} · ${board.myPoints} puan'
                : 'Henüz puanın yok — bir soru çöz, tabloya gir!',
          ),
        ],
      ),
    );
  }
}

// ── Genel: deneme ortalaması, podyum + sticky ben (Doc 28 P2-13) ──

class _GlobalBoard extends ConsumerWidget {
  const _GlobalBoard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(globalLeaderboardProvider);
    return data.when(
      loading: () => const _BoardSkeleton(),
      error: (e, _) => ErrorStateView(
        message: e is Failure ? e.message : 'Yüklenemedi.',
        onRetry: () => ref.invalidate(globalLeaderboardProvider),
      ),
      data: (board) {
        if (board.top.isEmpty) {
          return const EmptyStateView(
            icon: Icons.emoji_events_outlined,
            message:
                'Genel sıralama, canlı denemelerle oluşur.\nİlk denemene katıl, tabloyu başlat!',
          );
        }
        final podium = board.top.take(3).toList();
        final rest = board.top.skip(3).toList();
        return Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  _Podium(rows: podium),
                  const SizedBox(height: AppSpacing.lg),
                  for (final r in rest) ...[
                    _RankRow(
                      rank: r.rank,
                      displayName: r.displayName,
                      avatarUrl: r.avatarUrl,
                      isMe: r.isMe,
                      trailing: r.avgScore.toStringAsFixed(2),
                      subtitle: '${r.attempts} deneme',
                    ),
                    const SizedBox(height: AppSpacing.xs),
                  ],
                ],
              ),
            ),
            _MeBar(
              text: board.me != null
                  ? 'Senin sıran: #${board.me!.rank} · ort. ${board.me!.avgScore.toStringAsFixed(2)} net'
                  : 'Bir canlı denemeye katıl, genel tabloya gir!',
            ),
          ],
        );
      },
    );
  }
}

/// İlk 3 podyumu: 2-1-3 dizilimi, birinci yükseltilmiş.
class _Podium extends StatelessWidget {
  final List<GlobalLeaderboardRow> rows;
  const _Podium({required this.rows});

  @override
  Widget build(BuildContext context) {
    final first = rows.isNotEmpty ? rows[0] : null;
    final second = rows.length > 1 ? rows[1] : null;
    final third = rows.length > 2 ? rows[2] : null;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
            child: second == null
                ? const SizedBox.shrink()
                : _PodiumCell(row: second, height: 96, medal: '🥈')),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
            child: first == null
                ? const SizedBox.shrink()
                : _PodiumCell(row: first, height: 124, medal: '🥇')),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
            child: third == null
                ? const SizedBox.shrink()
                : _PodiumCell(row: third, height: 80, medal: '🥉')),
      ],
    );
  }
}

class _PodiumCell extends StatelessWidget {
  final GlobalLeaderboardRow row;
  final double height;
  final String medal;
  const _PodiumCell(
      {required this.row, required this.height, required this.medal});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final initial = row.displayName.trim().isNotEmpty
        ? row.displayName.trim()[0].toUpperCase()
        : '?';
    return Semantics(
      label:
          '${row.rank}. sıra: ${row.displayName}, ortalama ${row.avgScore.toStringAsFixed(2)} net',
      excludeSemantics: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(medal, style: const TextStyle(fontSize: 22)),
          const SizedBox(height: AppSpacing.xs),
          CircleAvatar(
            radius: 20,
            backgroundColor: row.isMe ? tokens.brand : tokens.surfaceAlt,
            foregroundImage:
                row.avatarUrl != null ? NetworkImage(row.avatarUrl!) : null,
            child: Text(initial,
                style: AppTypography.heading.copyWith(
                    color: row.isMe ? tokens.surface : tokens.ink)),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            row.isMe ? '${row.displayName} (sen)' : row.displayName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: AppTypography.label.copyWith(color: tokens.ink),
          ),
          const SizedBox(height: AppSpacing.xs),
          Container(
            height: height,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Color.alphaBlend(
                  tokens.accentStreak.withValues(alpha: row.rank == 1 ? 0.30 : 0.15),
                  tokens.surfaceAlt),
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppSpacing.radiusMd)),
            ),
            alignment: Alignment.center,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(row.avgScore.toStringAsFixed(2),
                    style: AppTypography.heading.copyWith(color: tokens.ink)),
                Text('NET ORT.',
                    style: AppTypography.caption
                        .copyWith(color: tokens.inkSoft, fontSize: 9)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Ortak parçalar ──

class _RankRow extends StatelessWidget {
  final int rank;
  final String displayName;
  final String? avatarUrl;
  final bool isMe;
  final String trailing;
  final String? subtitle;
  const _RankRow({
    required this.rank,
    required this.displayName,
    this.avatarUrl,
    required this.isMe,
    required this.trailing,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final medal = switch (rank) { 1 => '🥇', 2 => '🥈', 3 => '🥉', _ => null };
    return Container(
      constraints: const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      decoration: BoxDecoration(
        color: isMe
            ? Color.alphaBlend(
                tokens.brand.withValues(alpha: 0.10), tokens.surface)
            : tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: isMe ? tokens.brand : tokens.line),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 36,
            child: Center(
              child: medal != null
                  ? Text(medal, style: const TextStyle(fontSize: 20))
                  : Text('#$rank',
                      style:
                          AppTypography.label.copyWith(color: tokens.inkSoft)),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          CircleAvatar(
            radius: 14,
            backgroundColor: tokens.surfaceAlt,
            foregroundImage:
                avatarUrl != null ? NetworkImage(avatarUrl!) : null,
            child: Text(
              displayName.trim().isNotEmpty
                  ? displayName.trim()[0].toUpperCase()
                  : '?',
              style: AppTypography.label.copyWith(color: tokens.ink),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isMe ? '$displayName (sen)' : displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.body.copyWith(
                      color: tokens.ink,
                      fontWeight: isMe ? FontWeight.w700 : FontWeight.w400),
                ),
                if (subtitle != null)
                  Text(subtitle!,
                      style: AppTypography.caption
                          .copyWith(color: tokens.inkSoft)),
              ],
            ),
          ),
          Text(trailing,
              style: AppTypography.label.copyWith(color: tokens.ink)),
        ],
      ),
    );
  }
}

/// Alt sabit "sen" çubuğu — listede görünmesen de durumun her zaman ekranda.
class _MeBar extends StatelessWidget {
  final String text;
  const _MeBar({required this.text});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(AppSpacing.lg),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: Color.alphaBlend(
              tokens.brand.withValues(alpha: 0.12), tokens.surface),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(color: tokens.brand.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Text('🎯'),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(text,
                  style: AppTypography.label.copyWith(color: tokens.ink)),
            ),
          ],
        ),
      ),
    );
  }
}

class _BoardSkeleton extends StatelessWidget {
  const _BoardSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: const [
        LoadingSkeleton(height: 56),
        SizedBox(height: AppSpacing.sm),
        LoadingSkeleton(height: 56),
        SizedBox(height: AppSpacing.sm),
        LoadingSkeleton(height: 56),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_motion.dart';
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
            // Genel = tüm zamanların puanı: soru çözen HERKES listededir.
            // (Deneme-ortalaması tablosu deneme detayında yaşıyor.)
            _Board(period: 'all'),
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
      data: (board) {
        final top3 = board.top.take(3).toList();
        final rest = board.top.skip(3).toList();
        return Column(
          children: [
            Expanded(
              child: board.top.isEmpty
                  ? const EmptyStateView(
                      icon: Icons.emoji_events_outlined,
                      message:
                          'Henüz kimse puan almadı.\nİlk sırayı kapma şansı — soru çözmeye başla!',
                    )
                  : ListView(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      children: [
                        _Podium(entries: [
                          for (final r in top3)
                            _PodiumEntry(
                              rank: r.rank,
                              displayName: r.displayName,
                              avatarUrl: r.avatarUrl,
                              isMe: r.isMe,
                              valueLabel: '${r.points} puan',
                            ),
                        ]),
                        const SizedBox(height: AppSpacing.lg),
                        for (final r in rest) ...[
                          _RankRow(
                            rank: r.rank,
                            displayName: r.displayName,
                            avatarUrl: r.avatarUrl,
                            isMe: r.isMe,
                            trailing: '${r.points} puan',
                          ),
                          const SizedBox(height: AppSpacing.xs),
                        ],
                      ],
                    ),
            ),
            _MeBar(
              text: board.myRank != null
                  ? 'Senin sıran: #${board.myRank} · ${board.myPoints} puan'
                  : 'Henüz puanın yok — bir soru çöz, tabloya gir!',
            ),
          ],
        );
      },
    );
  }
}

/// Podyum satırı görünüm modeli — puan da net ortalaması da olabilir.
class _PodiumEntry {
  final int rank;
  final String displayName;
  final String? avatarUrl;
  final bool isMe;
  final String valueLabel;
  const _PodiumEntry({
    required this.rank,
    required this.displayName,
    this.avatarUrl,
    required this.isMe,
    required this.valueLabel,
  });
}

/// İlk 3 podyumu: 2-1-3 dizilimi, birinci yükseltilmiş; arkada yumuşak
/// ışıma, sütunlar degrade "kürsü" olarak yükselerek belirir.
class _Podium extends StatelessWidget {
  final List<_PodiumEntry> entries;
  const _Podium({required this.entries});

  // Kürsü paletleri (açık→koyu degrade): altın, buz mavisi, mercan.
  // İki temada da doygun kalır — yüzeye alpha karışımı yapılmaz.
  static const gold = (top: Color(0xFFFFD976), bottom: Color(0xFFF3A93C));
  static const silver = (top: Color(0xFFD4E2F6), bottom: Color(0xFF93B4E0));
  static const bronze = (top: Color(0xFFFFC7A6), bottom: Color(0xFFEF8B5A));

  @override
  Widget build(BuildContext context) {
    final first = entries.isNotEmpty ? entries[0] : null;
    final second = entries.length > 1 ? entries[1] : null;
    final third = entries.length > 2 ? entries[2] : null;
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        // Şampiyon ışıması — birincinin arkasında yumuşak altın hale.
        Positioned.fill(
          child: IgnorePointer(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.55),
                  radius: 0.9,
                  colors: [
                    gold.bottom.withValues(alpha: .18),
                    gold.bottom.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
                child: second == null
                    ? const SizedBox.shrink()
                    : _PodiumCell(
                        row: second,
                        height: 96,
                        palette: silver,
                        delayMs: 120)),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
                child: first == null
                    ? const SizedBox.shrink()
                    : _PodiumCell(
                        row: first, height: 136, palette: gold, delayMs: 0)),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
                child: third == null
                    ? const SizedBox.shrink()
                    : _PodiumCell(
                        row: third,
                        height: 78,
                        palette: bronze,
                        delayMs: 220)),
          ],
        ),
      ],
    );
  }
}

class _PodiumCell extends StatefulWidget {
  final _PodiumEntry row;
  final double height;
  final ({Color top, Color bottom}) palette;
  final int delayMs;
  const _PodiumCell({
    required this.row,
    required this.height,
    required this.palette,
    required this.delayMs,
  });

  @override
  State<_PodiumCell> createState() => _PodiumCellState();
}

class _PodiumCellState extends State<_PodiumCell> {
  bool _revealed = false;

  @override
  void initState() {
    super.initState();
    // Kademeli yükselme: 1. hemen, 2. ve 3. kısa gecikmeyle.
    Future.delayed(Duration(milliseconds: widget.delayMs), () {
      if (mounted) setState(() => _revealed = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final row = widget.row;
    final pal = widget.palette;
    final initial = row.displayName.trim().isNotEmpty
        ? row.displayName.trim()[0].toUpperCase()
        : '?';
    final reduce = AppMotion.reduceMotion;
    final targetH = (_revealed || reduce) ? widget.height : 0.0;

    return Semantics(
      label: '${row.rank}. sıra: ${row.displayName}, ${row.valueLabel}',
      excludeSemantics: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar: madalya renkli degrade halka + "sen" vurgusu.
          AnimatedOpacity(
            duration: AppMotion.respect(AppMotion.standard),
            opacity: (_revealed || reduce) ? 1 : 0,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [pal.top, pal.bottom],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: pal.bottom.withValues(alpha: .35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: CircleAvatar(
                    radius: row.rank == 1 ? 26 : 21,
                    backgroundColor: tokens.surface,
                    foregroundImage: row.avatarUrl != null
                        ? NetworkImage(row.avatarUrl!)
                        : null,
                    child: Text(initial,
                        style: AppTypography.heading
                            .copyWith(color: tokens.ink)),
                  ),
                ),
                const SizedBox(height: AppSpacing.xs + 2),
                Text(
                  row.isMe ? '${row.displayName} (sen)' : row.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: AppTypography.label.copyWith(
                    color: tokens.ink,
                    fontWeight:
                        row.isMe ? FontWeight.w800 : FontWeight.w600,
                  ),
                ),
                Text(
                  row.valueLabel,
                  style: AppTypography.caption.copyWith(color: tokens.inkSoft),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          // Kürsü: degrade sütun, üstte cam parlaması, büyük sıra numarası.
          AnimatedContainer(
            duration: AppMotion.respect(AppMotion.celebrate),
            curve: AppMotion.standardCurve,
            height: targetH,
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [pal.top, pal.bottom],
              ),
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppSpacing.radiusMd)),
              boxShadow: [
                BoxShadow(
                  color: pal.bottom.withValues(alpha: .30),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppSpacing.radiusMd)),
              child: Stack(
                children: [
                  // Üst kenar parlaması — kürsüye hacim hissi verir.
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 10,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.white.withValues(alpha: .45),
                            Colors.white.withValues(alpha: 0),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: OverflowBox(
                      maxHeight: double.infinity,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('✦ ✦ ✦',
                              style: TextStyle(
                                  fontSize: 8,
                                  letterSpacing: 1,
                                  color:
                                      Colors.white.withValues(alpha: .75))),
                          Text(
                            '${row.rank}',
                            style: TextStyle(
                              fontSize: row.rank == 1 ? 40 : 30,
                              height: 1.05,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              shadows: [
                                Shadow(
                                  color:
                                      pal.bottom.withValues(alpha: .6),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                        ],
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

// ── Ortak parçalar ──

class _RankRow extends StatelessWidget {
  final int rank;
  final String displayName;
  final String? avatarUrl;
  final bool isMe;
  final String trailing;
  const _RankRow({
    required this.rank,
    required this.displayName,
    this.avatarUrl,
    required this.isMe,
    required this.trailing,
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

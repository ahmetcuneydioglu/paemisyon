import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../data/leaderboard_repository.dart';

/// Lider tahtası önizlemesi (Bugün ekranı vitrini): günün ilk 3'ü + "sen"
/// satırı + kovalamaca cümlesi. Dokununca tam sıralamaya gider.
///
/// Ton (Doc 12): moral bozmaz — sıra ne olursa olsun mesaj teşvik eder.
/// Yardımcı karttır: hata durumunda ekranı kirletmez, sessizce gizlenir.
class LeaderboardPreviewCard extends ConsumerWidget {
  final VoidCallback onTap;

  /// Sıralama dönemi — varsayılan 'today': günlük yarış her gün sıfırlanır,
  /// yeni kullanıcı için de kazanılabilirdir (genel sıralama ezer).
  final String period;

  const LeaderboardPreviewCard({
    super.key,
    required this.onTap,
    this.period = 'today',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final data = ref.watch(leaderboardProvider(period));

    return data.when(
      loading: () => const Padding(
        padding: EdgeInsets.only(top: AppSpacing.xs),
        child: LoadingSkeleton(height: 140),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (board) {
        final me = board.me;
        final top3 = board.top.take(3).toList();
        final meInTop3 = top3.any((r) => r.isMe);

        return Padding(
          padding: const EdgeInsets.only(top: AppSpacing.xs),
          child: Semantics(
            button: true,
            label: _semanticsLabel(board),
            child: PressableScale(
              onTap: onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                decoration: BoxDecoration(
                  color: tokens.surface,
                  border: Border.all(color: tokens.line),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.emoji_events_rounded,
                            size: 18, color: tokens.accentStreak),
                        const SizedBox(width: AppSpacing.sm),
                        Text('LİDER TAHTASI · BUGÜN',
                            style: AppTypography.caption
                                .copyWith(color: tokens.inkSoft)),
                        const Spacer(),
                        Icon(Icons.chevron_right_rounded,
                            size: 18, color: tokens.inkSoft),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    if (top3.isEmpty)
                      Padding(
                        padding:
                            const EdgeInsets.only(bottom: AppSpacing.xs),
                        child: Text(
                          'Tahta bugün bomboş — ilk sırayı kapma şansı!',
                          style: AppTypography.body
                              .copyWith(color: tokens.ink, fontSize: 13),
                        ),
                      )
                    else ...[
                      for (final r in top3) _row(context, r),
                      // "Sen" ilk 3'te değilse: ayraç + vurgulu satırın.
                      if (!meInTop3 && me != null && me.rank > 0) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              vertical: AppSpacing.xs),
                          child: Text('⋯',
                              style: AppTypography.caption
                                  .copyWith(color: tokens.inkSoft)),
                        ),
                        _meRow(context, me),
                      ],
                    ],
                    const SizedBox(height: AppSpacing.xs),
                    _chaseLine(context, board),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _row(BuildContext context, LeaderboardRow r) {
    final tokens = context.tokens;
    // Madalya renkleri: 1 altın (amber token'ı), 2 gümüş, 3 bronz.
    final medal = switch (r.rank) {
      1 => tokens.accentStreak,
      2 => tokens.inkSoft,
      _ => const Color(0xFFB0793F),
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        children: [
          SizedBox(
            width: 22,
            child: Text('${r.rank}.',
                style: AppTypography.label
                    .copyWith(color: medal, fontWeight: FontWeight.w800)),
          ),
          Expanded(
            child: Text(
              r.isMe ? '${r.displayName} (sen)' : r.displayName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.body.copyWith(
                color: tokens.ink,
                fontSize: 13,
                fontWeight: r.isMe ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
          Text('${r.points} puan',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
        ],
      ),
    );
  }

  Widget _meRow(BuildContext context, LeaderboardMe me) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
      decoration: BoxDecoration(
        color: tokens.brand.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text('${me.rank}.',
                style: AppTypography.label.copyWith(
                    color: tokens.brand, fontWeight: FontWeight.w800)),
          ),
          Expanded(
            child: Text('Sen',
                style: AppTypography.body.copyWith(
                    color: tokens.ink,
                    fontSize: 13,
                    fontWeight: FontWeight.w700)),
          ),
          Text('${me.points} puan',
              style: AppTypography.label.copyWith(color: tokens.brand)),
        ],
      ),
    );
  }

  /// Kovalamaca cümlesi — kartın itici gücü. İsme ek TAKMAZ (Türkçe ünlü
  /// uyumu riskine girmez): "Önünde Ayşe var — fark 4 doğru".
  Widget _chaseLine(BuildContext context, LeaderboardData board) {
    final tokens = context.tokens;
    final me = board.me;
    final (String text, Color color) = switch (me) {
      null || LeaderboardMe(rank: 0) => (
          'Bugün 1 soru çöz, tahtaya adını yazdır.',
          tokens.brand,
        ),
      LeaderboardMe(rank: 1) => (
          'Zirvedesin — burayı kimseye kaptırma! 🏆',
          tokens.success,
        ),
      LeaderboardMe(:final pointsToNext, :final nextName)
          when pointsToNext != null && nextName != null =>
        pointsToNext == 0
            ? ('$nextName ile berabersin — 1 doğruyla öne geç!', tokens.brand)
            : (
                'Önünde $nextName var — fark sadece $pointsToNext doğru.',
                tokens.brand,
              ),
      _ => ('Her doğru cevap seni yukarı taşır.', tokens.brand),
    };
    return Row(
      children: [
        Icon(Icons.trending_up_rounded, size: 15, color: color),
        const SizedBox(width: AppSpacing.xs),
        Expanded(
          child: Text(
            text,
            maxLines: 2,
            style: AppTypography.caption
                .copyWith(color: color, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  String _semanticsLabel(LeaderboardData board) {
    final me = board.me;
    final mine = me != null && me.rank > 0
        ? 'Senin sıran ${me.rank}, ${me.points} puan.'
        : 'Bugün henüz puanın yok.';
    return 'Lider tahtası, bugün. $mine Tam sıralamayı aç.';
  }
}

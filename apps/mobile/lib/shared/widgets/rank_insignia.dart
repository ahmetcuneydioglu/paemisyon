import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Rütbe arması (Doc 24 §5, Doc 26 §4 ikinci dalga): seviye + ad +
/// sonraki rütbeye ilerleme. Meslek dili — çocuksu rozet değil.
/// Kabul kriterleri: iki tema ✓ · son rütbe (next yok) ✓ · a11y ✓ · ≥44pt ✓.
class RankInsignia extends StatelessWidget {
  final int level;
  final String name;
  final int score;

  /// 0-1; son rütbede 1 ver.
  final double progressToNext;
  final String? nextName;

  /// Sonraki rütbeye kalan puan (nextName varsa gösterilir).
  final int? pointsToNext;
  final VoidCallback? onTap;

  const RankInsignia({
    super.key,
    required this.level,
    required this.name,
    required this.score,
    required this.progressToNext,
    this.nextName,
    this.pointsToNext,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final semanticsLabel = nextName != null
        ? 'Rütbe: $name, seviye $level. $nextName rütbesine $pointsToNext puan kaldı.'
        : 'Rütbe: $name — en yüksek seviye.';

    return Semantics(
      label: semanticsLabel,
      button: onTap != null,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
          constraints:
              const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: tokens.surface,
            border: Border.all(color: tokens.line),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: Row(
            children: [
              // Arma: seviye yıldızı — brand zeminli daire.
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: tokens.brand.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text('$level',
                    style: AppTypography.heading.copyWith(color: tokens.brand)),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: AppTypography.label.copyWith(color: tokens.ink)),
                    const SizedBox(height: AppSpacing.xs),
                    ClipRRect(
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusFull),
                      child: LinearProgressIndicator(
                        value: progressToNext,
                        minHeight: 5,
                        backgroundColor: tokens.line,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(tokens.brand),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      nextName != null
                          ? 'Sıradaki: $nextName · $pointsToNext puan kaldı'
                          : 'En yüksek rütbe — Komiserlik Kapısı senin.',
                      style: AppTypography.caption
                          .copyWith(color: tokens.inkSoft),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

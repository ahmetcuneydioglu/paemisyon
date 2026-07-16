import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Seans/deneme sonucu başlığı (Doc 26 §4 #9): display skor + alt etiket.
/// Skor sıfat değil rakamla konuşur (ton rehberi §1.1).
class SessionResultHeader extends StatelessWidget {
  /// "12/15" veya "62,25 net".
  final String score;
  final String subtitle;

  const SessionResultHeader({
    super.key,
    required this.score,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Semantics(
      header: true,
      label: 'Sonuç: $score — $subtitle',
      excludeSemantics: true,
      child: Column(
        children: [
          Text(score,
              style: AppTypography.display.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.xs),
          Text(subtitle,
              style: AppTypography.label.copyWith(color: tokens.inkSoft)),
        ],
      ),
    );
  }
}

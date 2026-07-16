import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Seri rozeti (Doc 26 §4 #4). `atRisk` durumunda warning diline geçer —
/// kayıp dili yalnız seri/süre için kullanılır (Doc 26 §1.4).
class StreakBadge extends StatelessWidget {
  final int days;
  final bool atRisk;

  const StreakBadge({super.key, required this.days, this.atRisk = false});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final bg = atRisk
        ? tokens.warning.withValues(alpha: 0.15)
        : tokens.accentStreak.withValues(alpha: 0.12);
    final fg = atRisk ? tokens.warning : tokens.accentStreak;

    return Semantics(
      label: atRisk
          ? '$days günlük seri — bugün risk altında'
          : '$days günlük seri',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: AppSpacing.xs + 2),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(atRisk ? '⚠️' : '🔥', style: const TextStyle(fontSize: 13)),
            const SizedBox(width: AppSpacing.xs),
            Text('$days gün',
                style: AppTypography.label.copyWith(color: fg)),
          ],
        ),
      ),
    );
  }
}

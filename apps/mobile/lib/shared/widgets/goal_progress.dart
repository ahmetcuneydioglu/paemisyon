import 'package:flutter/material.dart';

import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';
import 'micro_interactions.dart';

/// Günlük hedef ilerlemesi (Doc 26 §4 #3): çubuk + `8/20` etiketi.
/// Hedef tamamlanınca `celebrate` animasyonuyla onay işareti gelir —
/// kutlama yalnız gerçek dönüm noktasında (Doc 26 §3.4).
class GoalProgress extends StatelessWidget {
  final int answered;
  final int goal;
  final String label;

  const GoalProgress({
    super.key,
    required this.answered,
    required this.goal,
    this.label = 'Bugünkü hedef',
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final done = goal > 0 && answered >= goal;
    final ratio = goal > 0 ? answered / goal : 0.0;

    return Semantics(
      label: '$label: $goal soruda $answered tamamlandı',
      excludeSemantics: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: AppTypography.label.copyWith(color: tokens.inkSoft)),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (done)
                    AnimatedScale(
                      scale: 1,
                      duration: AppMotion.respect(AppMotion.celebrate),
                      curve: AppMotion.celebrateCurve,
                      child: Padding(
                        padding: const EdgeInsets.only(right: AppSpacing.xs),
                        child: Icon(Icons.check_circle_rounded,
                            size: 16, color: tokens.success),
                      ),
                    ),
                  Text(
                    '$answered/$goal soru',
                    style: AppTypography.label.copyWith(
                        color: done ? tokens.success : tokens.ink),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          AnimatedFillBar(
            value: ratio,
            color: done ? tokens.success : tokens.accentSession,
            height: 8,
          ),
        ],
      ),
    );
  }
}

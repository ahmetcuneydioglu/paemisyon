import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Madde ısı çubuğu (Doc 26 §4 #12) — "en çok soru çıkan maddeler" satırı.
/// Atlas accent ailesini kullanır; oran en sıcak maddeye göre normalize edilir.
class HeatBar extends StatelessWidget {
  /// "m.16" gibi madde etiketi.
  final String label;
  final int count;

  /// 0..1 — en sıcak maddeye göre normalize oran.
  final double ratio;
  final VoidCallback? onTap;

  const HeatBar({
    super.key,
    required this.label,
    required this.count,
    required this.ratio,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final r = ratio.clamp(0.0, 1.0);
    // En sıcak %60+ dolu vurgu rengiyle, gerisi soluk tonla çizilir.
    final hot = r >= 0.6;

    return Semantics(
      button: onTap != null,
      label: '$label maddesi, $count soru',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        child: Container(
          constraints:
              const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
          child: Row(
            children: [
              SizedBox(
                width: 52,
                child: Text(label,
                    style: AppTypography.label.copyWith(color: tokens.ink)),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: 0.08 + r * 0.92,
                    child: Container(
                      height: 10,
                      decoration: BoxDecoration(
                        color: hot
                            ? tokens.accentAtlas
                            : tokens.accentAtlas.withValues(alpha: 0.35),
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusSm / 2),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              SizedBox(
                width: 28,
                child: Text('$count',
                    textAlign: TextAlign.right,
                    style:
                        AppTypography.label.copyWith(color: tokens.inkSoft)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';
import 'micro_interactions.dart';

/// Hakimiyet çubuğu (Doc 26 §4 #10). Renk eşiği: <%40 danger, <%60 warning,
/// üstü success. Renk tek başına anlam taşımaz — yüzde etiketi her zaman var.
class MasteryBar extends StatelessWidget {
  /// 0..1
  final double value;
  final bool showLabel;

  const MasteryBar({super.key, required this.value, this.showLabel = true});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final v = value.clamp(0.0, 1.0);
    final color = v < 0.40
        ? tokens.danger
        : v < 0.60
            ? tokens.warning
            : tokens.success;
    final pct = (v * 100).round();

    return Semantics(
      label: 'Hakimiyet yüzde $pct',
      excludeSemantics: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Expanded(child: AnimatedFillBar(value: v, color: color, height: 6)),
          if (showLabel) ...[
            const SizedBox(width: AppSpacing.sm),
            SizedBox(
              width: 38,
              child: Text('%$pct',
                  textAlign: TextAlign.right,
                  style: AppTypography.label.copyWith(color: color)),
            ),
          ],
        ],
      ),
    );
  }
}

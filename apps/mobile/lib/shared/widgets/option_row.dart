import 'package:flutter/material.dart';

import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Şık satırı (Doc 26 §4 #5) — Seans ve Deneme Oynatıcı'nın çekirdeği.
/// Doğru/yanlış renk değişimi ANINDA verilir (Doc 26 §3.4 — öğrenme anında
/// gecikme olmaz); yalnız dokunma geri bildirimi `quick` animasyonludur.
/// Renk tek başına anlam taşımaz: durum ikonla da verilir (Doc 26 §5).
enum OptionRowState { idle, selected, correct, wrongPick, dimmed }

class OptionRow extends StatelessWidget {
  /// Şık harfi: "A", "B"…
  final String label;
  final String text;
  final OptionRowState state;
  final VoidCallback? onTap;

  const OptionRow({
    super.key,
    required this.label,
    required this.text,
    this.state = OptionRowState.idle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;

    final (Color border, Color bg, IconData? icon, Color? iconColor) =
        switch (state) {
      OptionRowState.idle => (tokens.line, tokens.surface, null, null),
      OptionRowState.selected => (tokens.brand, tokens.surface, null, null),
      OptionRowState.correct => (
          tokens.success,
          Color.alphaBlend(tokens.success.withValues(alpha: 0.12), tokens.surface),
          Icons.check_circle_rounded,
          tokens.success,
        ),
      OptionRowState.wrongPick => (
          tokens.danger,
          Color.alphaBlend(tokens.danger.withValues(alpha: 0.10), tokens.surface),
          Icons.cancel_rounded,
          tokens.danger,
        ),
      OptionRowState.dimmed => (tokens.line, tokens.surface, null, null),
    };

    final semanticState = switch (state) {
      OptionRowState.correct => ' — doğru cevap',
      OptionRowState.wrongPick => ' — senin seçimin, yanlış',
      OptionRowState.selected => ' — seçili',
      _ => '',
    };

    return Semantics(
      inMutuallyExclusiveGroup: true,
      selected: state == OptionRowState.selected,
      label: '$label şıkkı: $text$semanticState',
      excludeSemantics: true,
      child: Opacity(
        opacity: state == OptionRowState.dimmed ? 0.55 : 1,
        child: Material(
          color: bg,
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            child: AnimatedContainer(
              duration: AppMotion.respect(AppMotion.quick),
              curve: AppMotion.quickCurve,
              constraints:
                  const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md, vertical: AppSpacing.md),
              decoration: BoxDecoration(
                border: Border.all(
                  color: border,
                  width: state == OptionRowState.idle ||
                          state == OptionRowState.dimmed
                      ? 1
                      : 1.5,
                ),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$label)',
                      style: AppTypography.body.copyWith(
                          fontWeight: FontWeight.w700, color: tokens.ink)),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(text,
                        style:
                            AppTypography.body.copyWith(color: tokens.ink)),
                  ),
                  if (icon != null) ...[
                    const SizedBox(width: AppSpacing.sm),
                    Icon(icon, size: 18, color: iconColor),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

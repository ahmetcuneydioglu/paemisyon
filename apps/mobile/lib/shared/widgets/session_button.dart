import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// "Bugün Çalış" hero eylemi + sessiz Odak ucu (Doc 26 §4 #2, Doc 25 §5).
/// Odak ucu hero'yu gölgelemez: küçük, alt satırda, tek dokunuşla FocusSheet açar.
class SessionButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;

  /// Örn. "Odak: Koç seçiyor" — null ise Odak ucu gizlenir.
  final String? focusLabel;
  final VoidCallback? onFocusTap;

  const SessionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.focusLabel,
    this.onFocusTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton(
          onPressed: onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: tokens.brand,
            foregroundColor: tokens.surface,
            minimumSize: const Size.fromHeight(56),
          ),
          child: Text(label),
        ),
        if (focusLabel != null)
          Semantics(
            button: true,
            label: '$focusLabel — odak seç',
            child: TextButton.icon(
              onPressed: onFocusTap,
              style: TextButton.styleFrom(
                foregroundColor: tokens.inkSoft,
                minimumSize: const Size(0, AppSpacing.minTouchTarget),
                textStyle: AppTypography.label,
              ),
              icon: Text(focusLabel!,
                  style: AppTypography.label.copyWith(color: tokens.inkSoft)),
              label:
                  Icon(Icons.expand_more_rounded, size: 16, color: tokens.inkSoft),
            ),
          ),
      ],
    );
  }
}

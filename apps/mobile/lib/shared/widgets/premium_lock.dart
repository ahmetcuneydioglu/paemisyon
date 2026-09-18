import 'package:flutter/material.dart';

import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';

/// Premium rozeti — "bu içerik/hak Premium'a ait" işareti (Doc 46).
///
/// Tasarım sistemi bileşeni: tek ekrana özel değil, varyantlarla genelleştirdi.
/// `compact` liste satırının sonunda sessiz durur, `solid` kart içinde dikkat
/// çeker. Kilit ikonu dekoratiftir; anlamı taşıyan metin ekran okuyucuya
/// ulaşır (Semantics) — renk ve ikon tek başına anlam taşımaz.
class PremiumLockBadge extends StatelessWidget {
  final String label;
  final bool solid;

  const PremiumLockBadge({super.key, this.label = 'Premium', this.solid = false});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final fg = solid ? tokens.ink : tokens.inkSoft;
    return Semantics(
      label: '$label — kilitli',
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          color: solid
              ? tokens.inkSoft.withValues(alpha: 0.12)
              : Colors.transparent,
          border: solid
              ? null
              : Border.all(color: Theme.of(context).colorScheme.outlineVariant),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ExcludeSemantics(
              child: Icon(Icons.lock_rounded, size: 13, color: fg),
            ),
            const SizedBox(width: 4),
            ExcludeSemantics(
              child: Text(
                label,
                style: AppTypography.caption
                    .copyWith(color: fg, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

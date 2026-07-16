import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';
import 'micro_interactions.dart';

/// Koç kartı (Doc 26 §4 #1) — Bugün ekranının ve sonuç ekranlarının yapı taşı.
/// `hero`: günün tek doğru eylemi (vurgulu); `support`: destek kartları.
/// Ton rehberi (Doc 26 §1): tek mesaj + tek eylem; ikon en fazla 1 durum işareti.
enum CoachCardVariant { hero, support }

class CoachCard extends StatelessWidget {
  final CoachCardVariant variant;

  /// Durum işareti (emoji: 🔥 🔁 ⚠️ 🏆 …) — cümle içinde emoji kullanılmaz.
  final String? leading;
  final String title;
  final String? body;
  final String? ctaLabel;
  final VoidCallback? onCta;

  /// Kartın tamamına dokunma (CTA'sız yönlendirme kartları için).
  final VoidCallback? onTap;

  const CoachCard({
    super.key,
    this.variant = CoachCardVariant.support,
    this.leading,
    required this.title,
    this.body,
    this.ctaLabel,
    this.onCta,
    this.onTap,
  }) : assert(ctaLabel == null || onCta != null,
            'ctaLabel verildiyse onCta zorunludur');

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final isHero = variant == CoachCardVariant.hero;

    final card = Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: isHero
            ? Color.alphaBlend(tokens.brand.withValues(alpha: 0.06), tokens.surface)
            : tokens.surface,
        borderRadius:
            BorderRadius.circular(isHero ? AppSpacing.radiusLg : AppSpacing.radiusMd),
        border: Border.all(
          color: isHero ? tokens.brand : tokens.line,
          width: isHero ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (leading != null) ...[
                Text(leading!, style: const TextStyle(fontSize: 20)),
                const SizedBox(width: AppSpacing.sm),
              ],
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.heading.copyWith(color: tokens.ink),
                ),
              ),
            ],
          ),
          if (body != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(body!,
                style: AppTypography.body.copyWith(color: tokens.inkSoft)),
          ],
          if (ctaLabel != null) ...[
            const SizedBox(height: AppSpacing.md),
            isHero
                ? SizedBox(
                    width: double.infinity,
                    child: FilledButton(onPressed: onCta, child: Text(ctaLabel!)),
                  )
                : Align(
                    alignment: Alignment.centerLeft,
                    child: OutlinedButton(
                      onPressed: onCta,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: tokens.ink,
                        side: BorderSide(color: tokens.ink, width: 1.5),
                        minimumSize: const Size(0, AppSpacing.minTouchTarget),
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusSm),
                        ),
                        textStyle: AppTypography.label,
                      ),
                      child: Text(ctaLabel!),
                    ),
                  ),
          ],
        ],
      ),
    );

    if (onTap == null) return card;
    return Semantics(
      button: true,
      label: title,
      child: PressableScale(onTap: onTap, child: card),
    );
  }
}

import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';
import 'source_tag.dart';

/// Açıklama kutusu (Doc 26 §4 #6) — cevaptan hemen sonra AYNI ekranda.
/// Yanlış→madde köprüsü öğren-dene-yanıl-anla döngüsünün kalbidir (Doc 25).
class ExplanationBox extends StatelessWidget {
  final String explanation;
  final String? source;

  /// "İlgili madde: PVSK m.16" köprüsü.
  final String? articleLabel;
  final VoidCallback? onArticleTap;

  const ExplanationBox({
    super.key,
    required this.explanation,
    this.source,
    this.articleLabel,
    this.onArticleTap,
  }) : assert(articleLabel == null || onArticleTap != null,
            'articleLabel verildiyse onArticleTap zorunludur');

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.surfaceAlt,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Açıklama',
              style: AppTypography.label.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.xs),
          Text(explanation,
              style: AppTypography.body.copyWith(color: tokens.ink)),
          if (articleLabel != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Semantics(
              button: true,
              label: articleLabel,
              child: InkWell(
                onTap: onArticleTap,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.menu_book_outlined,
                          size: 16, color: tokens.accentAtlas),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        articleLabel!,
                        style: AppTypography.label
                            .copyWith(color: tokens.accentAtlas),
                      ),
                      Icon(Icons.chevron_right_rounded,
                          size: 16, color: tokens.accentAtlas),
                    ],
                  ),
                ),
              ),
            ),
          ],
          if (source != null) ...[
            const SizedBox(height: AppSpacing.sm),
            SourceTag(text: source!),
          ],
        ],
      ),
    );
  }
}

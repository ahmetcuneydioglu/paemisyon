import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Soru görseli (Doc 28 P2-16) — kök ile şıklar arasında; tur oynatıcı,
/// deneme oynatıcı ve cevap incelemesi aynı bileşeni kullanır.
/// Yüklenirken iskelet zemin; kırık URL ekranı bozmaz (sessiz uyarı kutusu).
class QuestionMedia extends StatelessWidget {
  final String url;
  const QuestionMedia({super.key, required this.url});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Semantics(
      label: 'Soru görseli',
      image: true,
      excludeSemantics: true,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 260),
          child: Image.network(
            url,
            width: double.infinity,
            fit: BoxFit.contain,
            loadingBuilder: (context, child, progress) => progress == null
                ? child
                : Container(
                    height: 160,
                    color: tokens.surfaceAlt,
                    alignment: Alignment.center,
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: tokens.inkSoft),
                    ),
                  ),
            errorBuilder: (context, error, stack) => Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              color: tokens.surfaceAlt,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.broken_image_outlined,
                      size: 18, color: tokens.inkSoft),
                  const SizedBox(width: AppSpacing.xs),
                  Text('Görsel yüklenemedi',
                      style: AppTypography.caption
                          .copyWith(color: tokens.inkSoft)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

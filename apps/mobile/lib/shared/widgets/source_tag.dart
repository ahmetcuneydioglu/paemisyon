import 'package:flutter/material.dart';

import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Kaynak etiketi — "2019 PAEM" (Doc 26 §4 #7).
/// Sorunun gerçek/kaynaklı olduğunun kanıtı; soru gösterilen HER yerde bulunur.
class SourceTag extends StatelessWidget {
  final String text;

  const SourceTag({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Semantics(
      label: 'Kaynak: $text',
      excludeSemantics: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 1),
            child:
                Icon(Icons.verified_outlined, size: 12, color: tokens.inkSoft),
          ),
          const SizedBox(width: 4),
          // Uzun etiketler taşmaz: gerekirse 2 satıra sarar, sonra kısaltılır.
          Flexible(
            child: Text(
              text.toUpperCase(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
            ),
          ),
        ],
      ),
    );
  }
}

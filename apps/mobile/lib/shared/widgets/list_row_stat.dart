import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Liste satırı (Doc 26 §4 #11): başlık + sağda değer/istatistik.
/// Ders detay, performans ve ayarlar listelerinin ortak satırı.
class ListRowStat extends StatelessWidget {
  final String title;
  final String? subtitle;

  /// Sağ taraf: MasteryBar, pil, metin… ne verilirse.
  final Widget? trailing;
  final VoidCallback? onTap;

  const ListRowStat({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Semantics(
      button: onTap != null,
      label: subtitle == null ? title : '$title — $subtitle',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Container(
            constraints:
                const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xs, vertical: AppSpacing.sm + 2),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: tokens.line)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(title,
                          style:
                              AppTypography.body.copyWith(color: tokens.ink)),
                      if (subtitle != null)
                        Text(subtitle!,
                            style: AppTypography.caption
                                .copyWith(color: tokens.inkSoft)),
                    ],
                  ),
                ),
                if (trailing != null) ...[
                  const SizedBox(width: AppSpacing.md),
                  trailing!,
                ],
                if (onTap != null)
                  Icon(Icons.chevron_right_rounded,
                      size: 18, color: tokens.inkSoft),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

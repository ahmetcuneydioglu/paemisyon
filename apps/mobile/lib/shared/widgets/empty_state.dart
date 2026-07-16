import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Dostça boş durum (Doc 26 §4 #15). "Boş ekran bile kaliteli görünsün":
/// ikon + tek cümle + (varsa) TEK eylem. Placeholder yasak — boş durum da
/// tasarlanmış bir durumdur.
class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyStateView({
    super.key,
    this.icon = Icons.inbox_rounded,
    required this.message,
    this.actionLabel,
    this.onAction,
  }) : assert(actionLabel == null || onAction != null,
            'actionLabel verildiyse onAction zorunludur');

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: tokens.inkSoft),
            const SizedBox(height: AppSpacing.lg),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTypography.body.copyWith(color: tokens.inkSoft),
            ),
            if (actionLabel != null) ...[
              const SizedBox(height: AppSpacing.lg),
              FilledButton(
                onPressed: onAction,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, AppSpacing.minTouchTarget),
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                ),
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

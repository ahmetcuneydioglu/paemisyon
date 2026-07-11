import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';

/// Dostça boş durum (Doc 12 §12). "Boş ekran bile kaliteli görünsün".
class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String message;

  const EmptyStateView({
    super.key,
    this.icon = Icons.inbox_rounded,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: Theme.of(context).colorScheme.outline),
            const SizedBox(height: AppSpacing.md),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }
}

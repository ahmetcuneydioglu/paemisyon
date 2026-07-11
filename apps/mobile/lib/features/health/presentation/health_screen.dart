import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/health_repository.dart';
import '../domain/health_status.dart';

/// Walking skeleton ekranı: mobil ↔ backend bağlantısını uçtan uca kanıtlar.
/// (Gerçek ana ekran Sprint 7'de gelir; bu geçici doğrulama ekranı.)
class HealthScreen extends ConsumerWidget {
  const HealthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final health = ref.watch(healthProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Paemisyon')),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Center(
          child: health.when(
            loading: () => const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LoadingSkeleton(height: 24, width: 180),
                SizedBox(height: AppSpacing.md),
                LoadingSkeleton(height: 16),
                SizedBox(height: AppSpacing.sm),
                LoadingSkeleton(height: 16),
              ],
            ),
            error: (err, _) => ErrorStateView(
              message: err is Failure ? err.message : 'Bir hata oluştu.',
              onRetry: () => ref.invalidate(healthProvider),
            ),
            data: (status) => _HealthCard(
              status: status,
              onRefresh: () => ref.invalidate(healthProvider),
            ),
          ),
        ),
      ),
    );
  }
}

class _HealthCard extends StatelessWidget {
  final HealthStatus status;
  final VoidCallback onRefresh;

  const _HealthCard({required this.status, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              status.isDatabaseUp
                  ? Icons.check_circle_rounded
                  : Icons.error_rounded,
              size: 48,
              color: status.isDatabaseUp ? scheme.primary : scheme.error,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Backend bağlantısı kuruldu',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text('Servis: ${status.service} · v${status.version}'),
            Text('Veritabanı: ${status.database}'),
            const SizedBox(height: AppSpacing.lg),
            PrimaryButton(label: 'Yenile', onPressed: onRefresh),
          ],
        ),
      ),
    );
  }
}

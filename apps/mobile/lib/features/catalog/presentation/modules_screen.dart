import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/catalog_repository.dart';

/// Katalog kökü: modül listesi (PAEM, POMEM...). Doc 12 §4a.
class ModulesScreen extends ConsumerWidget {
  const ModulesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final modules = ref.watch(modulesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Kategoriler')),
      body: modules.when(
        loading: () => const _SkeletonList(),
        error: (err, _) => ErrorStateView(
          message: err is Failure ? err.message : 'Yüklenemedi.',
          onRetry: () => ref.invalidate(modulesProvider),
        ),
        data: (list) => ListView.separated(
          padding: const EdgeInsets.all(AppSpacing.md),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
          itemBuilder: (context, i) {
            final m = list[i];
            return Card(
              child: ListTile(
                title: Text(m.name),
                subtitle: m.description != null ? Text(m.description!) : null,
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () =>
                    context.push('/catalog/module/${m.id}', extra: m.name),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _SkeletonList extends StatelessWidget {
  const _SkeletonList();
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (_, __) => const LoadingSkeleton(height: 64),
    );
  }
}

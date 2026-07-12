import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/catalog_repository.dart';

/// Bir modülün dersleri (Doc 12 §4b).
class CoursesScreen extends ConsumerWidget {
  final String moduleId;
  final String moduleName;
  const CoursesScreen(
      {super.key, required this.moduleId, required this.moduleName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courses = ref.watch(coursesProvider(moduleId));
    return Scaffold(
      appBar: AppBar(title: Text(moduleName)),
      body: courses.when(
        loading: () => const _Skeleton(),
        error: (err, _) => ErrorStateView(
          message: err is Failure ? err.message : 'Yüklenemedi.',
          onRetry: () => ref.invalidate(coursesProvider(moduleId)),
        ),
        data: (list) => list.isEmpty
            ? const EmptyStateView(message: 'Bu modülde henüz ders yok.')
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: list.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, i) {
                  final c = list[i];
                  return Card(
                    child: ListTile(
                      title: Text(c.name),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push('/catalog/course/${c.id}',
                          extra: c.name),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();
  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (_, __) => const LoadingSkeleton(height: 56),
      );
}

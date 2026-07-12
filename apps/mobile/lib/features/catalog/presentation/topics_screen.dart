import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/catalog_repository.dart';

/// Bir dersin konuları — premium kilit rozetiyle (Doc 12 §4c).
class TopicsScreen extends ConsumerWidget {
  final String courseId;
  final String courseName;
  const TopicsScreen(
      {super.key, required this.courseId, required this.courseName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topics = ref.watch(topicsProvider(courseId));
    return Scaffold(
      appBar: AppBar(title: Text(courseName)),
      body: topics.when(
        loading: () => const _Skeleton(),
        error: (err, _) => ErrorStateView(
          message: err is Failure ? err.message : 'Yüklenemedi.',
          onRetry: () => ref.invalidate(topicsProvider(courseId)),
        ),
        data: (list) => list.isEmpty
            ? const EmptyStateView(message: 'Bu derste henüz konu yok.')
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.md),
                itemCount: list.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: AppSpacing.sm),
                itemBuilder: (context, i) {
                  final t = list[i];
                  return Card(
                    child: ListTile(
                      title: Text(t.name),
                      trailing: t.isPremium
                          ? const Icon(Icons.lock_rounded, size: 18)
                          : const Icon(Icons.chevron_right_rounded),
                      onTap: () {
                        // Quiz Sprint 3'te. Şimdilik bilgi.
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              t.isPremium
                                  ? '"${t.name}" premium (Sprint 6). Quiz motoru Sprint 3.'
                                  : '"${t.name}" — quiz motoru Sprint 3.',
                            ),
                          ),
                        );
                      },
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
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (_, __) => const LoadingSkeleton(height: 56),
      );
}

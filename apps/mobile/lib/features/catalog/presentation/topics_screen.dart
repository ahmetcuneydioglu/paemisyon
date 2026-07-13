import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/catalog_repository.dart';

/// Bir dersin konuları + ders geneli deneme sınavı girişi (Doc 12 §4c-5).
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
            : ListView(
                padding: const EdgeInsets.all(AppSpacing.md),
                children: [
                  // ── Ders geneli deneme sınavı (konular karışık, süreli) ──
                  Card(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    child: ListTile(
                      leading: Icon(Icons.timer_rounded,
                          color:
                              Theme.of(context).colorScheme.onPrimaryContainer),
                      title: const Text('Deneme Sınavı'),
                      subtitle:
                          const Text('20 soru · süreli · sonuçlar sınav sonunda'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push('/quiz', extra: {
                        'courseId': courseId,
                        'topicName': '$courseName Denemesi',
                        'mode': 'exam',
                        'count': 20,
                      }),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  ...list.map(
                    (t) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: Card(
                        child: ListTile(
                          title: Text(t.name),
                          trailing: t.isPremium
                              ? const Icon(Icons.lock_rounded, size: 18)
                              : const Icon(Icons.chevron_right_rounded),
                          onTap: () {
                            if (t.isPremium) {
                              context.push('/paywall');
                            } else {
                              _showModeSheet(context, t.id, t.name);
                            }
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  /// Konuya dokununca mod seçimi: alıştırma (anında geri bildirim) /
  /// konu denemesi (süreli, cevaplar sonda).
  void _showModeSheet(BuildContext context, String topicId, String topicName) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(topicName,
                  style: Theme.of(ctx).textTheme.titleMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
            ),
            const SizedBox(height: AppSpacing.sm),
            ListTile(
              leading: const Icon(Icons.school_rounded),
              title: const Text('Alıştırma'),
              subtitle: const Text('Her sorudan sonra doğru cevap ve açıklama'),
              onTap: () {
                Navigator.pop(ctx);
                context.push('/quiz', extra: {
                  'topicId': topicId,
                  'topicName': topicName,
                  'mode': 'practice',
                });
              },
            ),
            ListTile(
              leading: const Icon(Icons.timer_rounded),
              title: const Text('Konu Denemesi'),
              subtitle: const Text('Süreli · cevaplar sınav sonunda'),
              onTap: () {
                Navigator.pop(ctx);
                context.push('/quiz', extra: {
                  'topicId': topicId,
                  'topicName': '$topicName Denemesi',
                  'mode': 'exam',
                });
              },
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
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

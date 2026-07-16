import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/accent_palette.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../data/catalog_repository.dart';

/// Bir modülün dersleri (Doc 12 §4b). Üstteki kimlik bloğu hedef kartından
/// Hero ile uçar (Doc 20) — "yolu seçtim" hissini geçişin kendisi verir.
class CoursesScreen extends ConsumerWidget {
  final String moduleId;
  final String moduleName;
  final String? moduleKey;
  const CoursesScreen({
    super.key,
    required this.moduleId,
    required this.moduleName,
    this.moduleKey,
  });

  ({IconData icon, Color fg}) _identity(BuildContext context) {
    final pal = AccentPalette.of(context);
    final scheme = Theme.of(context).colorScheme;
    return switch (moduleKey) {
      'paem' => (icon: Icons.local_police_rounded, fg: pal.accentText),
      'misyon' => (icon: Icons.security_rounded, fg: pal.liveFg),
      _ => (icon: Icons.school_rounded, fg: scheme.onSurfaceVariant),
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courses = ref.watch(coursesProvider(moduleId));
    final id = _identity(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Dersler')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hedef kartından uçan kimlik bloğu (aynı Hero tag'i).
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg, AppSpacing.xs, AppSpacing.lg, AppSpacing.sm),
            child: Hero(
              tag: 'module-$moduleId',
              child: Material(
                type: MaterialType.transparency,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(id.icon, size: 28, color: id.fg),
                    const SizedBox(width: AppSpacing.sm),
                    Text(moduleName,
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: courses.when(
              loading: () => const _Skeleton(),
              error: (err, _) => ErrorStateView(
                message: err is Failure ? err.message : 'Yüklenemedi.',
                onRetry: () => ref.invalidate(coursesProvider(moduleId)),
              ),
              data: (list) => list.isEmpty
                  ? const EmptyStateView(message: 'Bu modülde henüz ders yok.')
                  : ListView.separated(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      itemCount: list.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, i) {
                        final c = list[i];
                        // Bölüm başlığı dersten farklıysa alt satırda göster
                        // (Doc 21: örn. "Anayasa ve İdare Hukuku" bölümü).
                        final showSection =
                            c.sectionName != null && c.sectionName != c.name;
                        return StaggeredReveal(
                          index: i,
                          child: Card(
                            child: ListTile(
                              title: Text(c.name),
                              subtitle: showSection
                                  ? Text(c.sectionName!)
                                  : null,
                              trailing: c.weightPercent != null &&
                                      c.weightPercent! > 0
                                  ? _WeightBadge(percent: c.weightPercent!)
                                  : const Icon(Icons.chevron_right_rounded),
                              onTap: () => context.push(
                                  '/catalog/course/${c.id}',
                                  extra: c.name),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Dersin sınavdaki ağırlık yüzdesi (Doc 21) — "% N" rozeti.
class _WeightBadge extends StatelessWidget {
  final int percent;
  const _WeightBadge({required this.percent});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: scheme.secondaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text('%$percent',
          style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: scheme.onSecondaryContainer)),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();
  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (_, __) => const LoadingSkeleton(height: 56),
      );
}

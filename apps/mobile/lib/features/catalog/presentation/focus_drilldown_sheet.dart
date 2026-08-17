import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/mastery_bar.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';

/// Odak drill-down hedefi: konu YA DA ders geneli (Doc 28 P2-17).
class FocusTarget {
  final String? topicId;
  final String? courseId;
  final String name;
  const FocusTarget({this.topicId, this.courseId, required this.name});
}

/// Odak sheet'inin "Ders / konu seç" dalı (Doc 28 P2-17) — katalog ekranına
/// fırlatmak yerine AYNI sheet akışında ders → konu inişi; seçim turu
/// başlatır. Sheet kapatılırsa null döner.
Future<FocusTarget?> showFocusDrillDown(
  BuildContext context, {
  String? moduleId,
}) {
  return showModalBottomSheet<FocusTarget>(
    context: context,
    isScrollControlled: true,
    builder: (context) => _DrillDownBody(moduleId: moduleId),
  );
}

class _DrillDownBody extends ConsumerStatefulWidget {
  final String? moduleId;
  const _DrillDownBody({this.moduleId});

  @override
  ConsumerState<_DrillDownBody> createState() => _DrillDownBodyState();
}

class _DrillDownBodyState extends ConsumerState<_DrillDownBody> {
  CourseItem? _course; // null = ders seviyesi; dolu = konu seviyesi

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.lg),
        child: ConstrainedBox(
          constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(context).height * 0.7),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: tokens.line,
                    borderRadius:
                        BorderRadius.circular(AppSpacing.radiusFull),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  if (_course != null)
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded),
                      tooltip: 'Derslere dön',
                      onPressed: () => setState(() => _course = null),
                    ),
                  Expanded(
                    child: Text(
                      _course == null ? 'Hangi ders?' : _course!.name,
                      style:
                          AppTypography.heading.copyWith(color: tokens.ink),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Flexible(
                child: AnimatedSwitcher(
                  duration: AppMotion.respect(AppMotion.standard),
                  switchInCurve: AppMotion.standardCurve,
                  child: _course == null
                      ? _CourseLevel(
                          key: const ValueKey('courses'),
                          moduleId: widget.moduleId,
                          onPick: (c) => setState(() => _course = c),
                        )
                      : _TopicLevel(
                          key: ValueKey(_course!.id),
                          course: _course!,
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CourseLevel extends ConsumerWidget {
  final String? moduleId;
  final ValueChanged<CourseItem> onPick;
  const _CourseLevel({super.key, this.moduleId, required this.onPick});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Tercih edilen modül yoksa ilk modüle düş (onboarding'de mutlaka seçilir).
    final modules = ref.watch(modulesProvider);
    return modules.when(
      loading: () => const _SheetSkeleton(),
      error: (_, __) => const _SheetError(),
      data: (list) {
        if (list.isEmpty) return const _SheetError();
        final mid = moduleId ?? list.first.id;
        final courses = ref.watch(coursesProvider(mid));
        return courses.when(
          loading: () => const _SheetSkeleton(),
          error: (_, __) => const _SheetError(),
          data: (items) => ListView.separated(
            shrinkWrap: true,
            itemCount: items.length,
            separatorBuilder: (_, __) =>
                const SizedBox(height: AppSpacing.xs),
            itemBuilder: (context, i) =>
                _SheetRow(
              title: items[i].name,
              subtitle: items[i].sectionName,
              trailing: Icon(Icons.chevron_right_rounded,
                  size: 18, color: context.tokens.inkSoft),
              onTap: () => onPick(items[i]),
            ),
          ),
        );
      },
    );
  }
}

class _TopicLevel extends ConsumerWidget {
  final CourseItem course;
  const _TopicLevel({super.key, required this.course});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final topics = ref.watch(topicsProvider(course.id));
    return topics.when(
      loading: () => const _SheetSkeleton(),
      error: (_, __) => const _SheetError(),
      data: (data) => ListView(
        shrinkWrap: true,
        children: [
          // Ders geneli: koç karışımı bu dersin konularından kurar.
          _SheetRow(
            title: 'Dersin tamamı — karışık',
            subtitle: 'Koç bu dersin konularından karıştırır',
            trailing:
                Icon(Icons.shuffle_rounded, size: 18, color: tokens.brand),
            emphasized: true,
            onTap: () => Navigator.of(context).pop(
                FocusTarget(courseId: course.id, name: course.name)),
          ),
          const SizedBox(height: AppSpacing.xs),
          for (final t in data.topics) ...[
            _SheetRow(
              title: t.name,
              trailing: t.mastery != null
                  ? SizedBox(
                      width: 72,
                      child:
                          MasteryBar(value: t.mastery! / 100, showLabel: false),
                    )
                  : null,
              onTap: () => Navigator.of(context)
                  .pop(FocusTarget(topicId: t.id, name: t.name)),
            ),
            const SizedBox(height: AppSpacing.xs),
          ],
        ],
      ),
    );
  }
}

class _SheetRow extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final bool emphasized;
  final VoidCallback onTap;
  const _SheetRow({
    required this.title,
    this.subtitle,
    this.trailing,
    this.emphasized = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Material(
      color: emphasized
          ? Color.alphaBlend(
              tokens.brand.withValues(alpha: 0.06), tokens.surface)
          : tokens.surface,
      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        child: Container(
          constraints:
              const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md, vertical: AppSpacing.sm + 2),
          decoration: BoxDecoration(
            border: Border.all(
                color: emphasized ? tokens.brand : tokens.line,
                width: emphasized ? 1.5 : 1),
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: AppTypography.body.copyWith(
                            color: tokens.ink,
                            fontWeight: emphasized
                                ? FontWeight.w600
                                : FontWeight.w400)),
                    if (subtitle != null)
                      Text(subtitle!,
                          style: AppTypography.caption
                              .copyWith(color: tokens.inkSoft)),
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: AppSpacing.sm),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SheetSkeleton extends StatelessWidget {
  const _SheetSkeleton();
  @override
  Widget build(BuildContext context) => const Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          LoadingSkeleton(height: 48),
          SizedBox(height: AppSpacing.xs),
          LoadingSkeleton(height: 48),
          SizedBox(height: AppSpacing.xs),
          LoadingSkeleton(height: 48),
        ],
      );
}

class _SheetError extends StatelessWidget {
  const _SheetError();
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Text('Liste yüklenemedi — bağlantını kontrol edip tekrar dene.',
            style: AppTypography.body
                .copyWith(color: context.tokens.inkSoft)),
      );
}

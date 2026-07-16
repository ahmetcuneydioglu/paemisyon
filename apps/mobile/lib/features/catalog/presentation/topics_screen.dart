import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/mastery_bar.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';

/// Ders detay — ÖĞRENME MERKEZİ (Doc 25 wireframe 05): dersin tek yaşayan
/// mekânı. Kişisel katman en üstte (hakimiyet + açık yanlışlar), konular
/// hakimiyet çubuklarıyla, "bu dersten seans" tek dokunuş.
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
        data: (course) => course.topics.isEmpty
            ? const EmptyStateView(message: 'Bu derste henüz konu yok.')
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(topicsProvider(courseId)),
                child: _Body(
                    courseId: courseId, courseName: courseName, course: course),
              ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  final String courseId;
  final String courseName;
  final CourseTopics course;
  const _Body(
      {required this.courseId, required this.courseName, required this.course});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // ── Kişisel katman: senin durumun (wireframe 05 not 1) ──
        Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: Color.alphaBlend(
                tokens.brand.withValues(alpha: 0.06), tokens.surface),
            border: Border.all(color: tokens.brand, width: 1.5),
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Hakimiyetin',
                      style: AppTypography.label
                          .copyWith(color: tokens.inkSoft)),
                  Text(
                    course.mastery != null ? '%${course.mastery}' : 'yeni ders',
                    style: AppTypography.heading.copyWith(color: tokens.ink),
                  ),
                ],
              ),
              if (course.mastery != null) ...[
                const SizedBox(height: AppSpacing.sm),
                MasteryBar(value: course.mastery! / 100, showLabel: false),
              ],
              const SizedBox(height: AppSpacing.xs),
              Text(
                course.solvedCount > 0
                    ? '${course.solvedCount} soru çözdün'
                        '${course.unresolvedWrongCount > 0 ? ' · ${course.unresolvedWrongCount} açık yanlışın var' : ''}'
                    : 'Bu derste henüz soru çözmedin — ilk seansla harita başlar.',
                style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              ),
              const SizedBox(height: AppSpacing.md),
              FilledButton(
                onPressed: () => _startCourseSession(context, ref),
                child: const Text('Bu dersten seans başlat'),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // ── Ders geneli deneme (süreli) — ikincil eylem ──
        OutlinedButton.icon(
          onPressed: () => context.push('/quiz', extra: {
            'courseId': courseId,
            'topicName': '$courseName Denemesi',
            'mode': 'exam',
            'count': 20,
          }),
          style: OutlinedButton.styleFrom(
            foregroundColor: tokens.ink,
            side: BorderSide(color: tokens.ink, width: 1.5),
            minimumSize: const Size.fromHeight(AppSpacing.minTouchTarget + 4),
          ),
          icon: const Icon(Icons.timer_rounded, size: 18),
          label: const Text('Ders denemesi — 20 soru, süreli'),
        ),
        const SizedBox(height: AppSpacing.lg),

        Text('KONULAR',
            style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
        const SizedBox(height: AppSpacing.sm),
        ...course.topics.map((t) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _topicCard(context, t),
            )),
      ],
    );
  }

  /// "Bu dersten seans": ders geneli alıştırma — Odak'ın ders kapısı (Doc 25 §5).
  void _startCourseSession(BuildContext context, WidgetRef ref) {
    context.push('/quiz', extra: {
      'courseId': courseId,
      'topicName': courseName,
      'mode': 'practice',
      'count': 10,
    }).then((_) {
      if (context.mounted) ref.invalidate(topicsProvider(courseId));
    });
  }

  /// Konu kartı: hakimiyet çubuklu satır; alt konusu varsa açılır liste.
  Widget _topicCard(BuildContext context, TopicItem t) {
    if (t.children.isEmpty) return _TopicRow(topic: t, onTap: _rowTap(context, t));
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ExpansionTile(
        title: Text(t.name, style: AppTypography.body),
        subtitle: Text('${t.children.length} alt konu',
            style: AppTypography.caption
                .copyWith(color: context.tokens.inkSoft)),
        childrenPadding: const EdgeInsets.only(bottom: AppSpacing.xs),
        children: [
          for (final c in t.children)
            Padding(
              padding: const EdgeInsets.only(left: AppSpacing.lg),
              child: _TopicRow(topic: c, onTap: _rowTap(context, c)),
            ),
        ],
      ),
    );
  }

  VoidCallback _rowTap(BuildContext context, TopicItem t) =>
      () => t.isPremium
          ? context.push('/paywall')
          : _showModeSheet(context, t.id, t.name);

  /// Konuya dokununca mod seçimi: alıştırma / konu denemesi.
  void _showModeSheet(BuildContext context, String topicId, String topicName) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
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

/// Konu satırı: ad + hakimiyet çubuğu (çözüm yoksa "yeni" rozeti).
class _TopicRow extends StatelessWidget {
  final TopicItem topic;
  final VoidCallback onTap;
  const _TopicRow({required this.topic, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
          constraints:
              const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          child: Row(
            children: [
              Expanded(
                child: Text(topic.name,
                    style: AppTypography.body.copyWith(color: tokens.ink)),
              ),
              const SizedBox(width: AppSpacing.md),
              if (topic.isPremium)
                Icon(Icons.lock_rounded, size: 18, color: tokens.inkSoft)
              else if (topic.mastery != null)
                SizedBox(
                  width: 96,
                  child: MasteryBar(value: topic.mastery! / 100),
                )
              else
                Text('yeni',
                    style:
                        AppTypography.caption.copyWith(color: tokens.inkSoft)),
              Icon(Icons.chevron_right_rounded,
                  size: 18, color: tokens.inkSoft),
            ],
          ),
        ),
      ),
    );
  }
}

class _Skeleton extends StatelessWidget {
  const _Skeleton();
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: const [
          LoadingSkeleton(height: 150),
          SizedBox(height: AppSpacing.md),
          LoadingSkeleton(height: 48),
          SizedBox(height: AppSpacing.lg),
          LoadingSkeleton(height: 56),
          SizedBox(height: AppSpacing.sm),
          LoadingSkeleton(height: 56),
          SizedBox(height: AppSpacing.sm),
          LoadingSkeleton(height: 56),
        ],
      );
}

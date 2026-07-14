import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/exams_repository.dart';
import '../domain/exam_models.dart';

/// Denemeler listesi (Doc 18) — randevulu canlı sınavlar; web ile aynı /exams.
class ExamsListScreen extends ConsumerWidget {
  const ExamsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exams = ref.watch(examsListProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Denemeler')),
      body: exams.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: const [
            LoadingSkeleton(height: 96),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 96),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 96),
          ],
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Denemeler yüklenemedi.',
          onRetry: () => ref.invalidate(examsListProvider),
        ),
        data: (list) => list.isEmpty
            ? const EmptyStateView(
                icon: Icons.event_note_rounded,
                message: 'Şu an yayında deneme yok.\nYenileri eklendiğinde burada görünecek.',
              )
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(examsListProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, i) => _ExamCard(exam: list[i]),
                ),
              ),
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final ExamListItem exam;
  const _ExamCard({required this.exam});

  String _date(DateTime d) {
    final l = d.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(l.day)}.${two(l.month)}.${l.year}';
  }

  String _range() {
    String hm(DateTime d) {
      final l = d.toLocal();
      return '${l.hour.toString().padLeft(2, '0')}:${l.minute.toString().padLeft(2, '0')}';
    }

    return '${hm(exam.startAt)} – ${hm(exam.endAt)}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(exam.title, style: theme.textTheme.titleMedium),
                ),
                if (exam.isPremium)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text('Premium',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onPrimaryContainer)),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '${_date(exam.startAt)} · $_range · ${exam.questionCount} soru · ${exam.durationMinutes} dk',
              style: theme.textTheme.bodySmall,
            ),
            Text(
              'Katılım: ${exam.participantCount}'
              '${exam.avgScore != null ? ' · Ort. net: ${exam.avgScore!.toStringAsFixed(2)}' : ''}',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: AppSpacing.sm),
            _actions(context),
          ],
        ),
      ),
    );
  }

  Widget _actions(BuildContext context) {
    // Eski 3 durumlu mantık (Doc 18 §3).
    switch (exam.state) {
      case ExamState.upcoming:
        return const _StateChip(label: 'Sınav Başlamadı', color: Colors.orange);
      case ExamState.active:
        if (exam.myAttempt?.status == 'completed') {
          return _ActionButton(
            label: 'Sonucum',
            color: Colors.red,
            onTap: () => context.push('/denemeler/sonuc/${exam.myAttempt!.id}'),
          );
        }
        return _ActionButton(
          label: exam.myAttempt != null ? 'Devam Et' : 'Sınavı Başlat',
          color: Colors.green,
          onTap: () => context.push('/denemeler/${exam.id}'),
        );
      case ExamState.ended:
        return Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.xs,
          children: [
            _ActionButton(
              label: 'Sıralama',
              color: Colors.orange,
              onTap: () => context.push('/denemeler/${exam.id}/siralama'),
            ),
            if (exam.myAttempt != null)
              _ActionButton(
                label: 'Sonucum',
                color: Colors.red,
                onTap: () =>
                    context.push('/denemeler/sonuc/${exam.myAttempt!.id}'),
              )
            else
              const _StateChip(label: 'Sınav Bitti', color: Colors.grey),
          ],
        );
    }
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionButton({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => FilledButton(
        style: FilledButton.styleFrom(
          backgroundColor: color,
          visualDensity: VisualDensity.compact,
        ),
        onPressed: onTap,
        child: Text(label),
      );
}

class _StateChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StateChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
      );
}

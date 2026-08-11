import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/explanation_box.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/option_row.dart';
import '../../../shared/widgets/question_media.dart';
import '../data/exams_repository.dart';
import '../domain/exam_models.dart';

/// Deneme sonucu + inceleme (Doc 18 §2.4, Doc 28 P1-9). Puan = NET.
/// İnceleme, seans oynatıcıyla AYNI dili konuşur: OptionRow durumları
/// (correct/wrongPick/dimmed) + ExplanationBox — ham renk kullanılmaz.
class ExamResultScreen extends ConsumerWidget {
  final String attemptId;
  const ExamResultScreen({super.key, required this.attemptId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = ref.watch(examAttemptProvider(attemptId));
    return Scaffold(
      appBar: AppBar(title: const Text('Sınav Sonucu')),
      body: result.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(children: [
            LoadingSkeleton(height: 160),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 200),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Sonuç yüklenemedi.',
          onRetry: () => ref.invalidate(examAttemptProvider(attemptId)),
        ),
        data: (r) => _Body(result: r),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  final AttemptResult result;
  const _Body({required this.result});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        _ScoreCard(result: result),
        const SizedBox(height: AppSpacing.lg),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () =>
                    context.push('/denemeler/${result.examId}/siralama'),
                child: const Text('Sıralama'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: FilledButton(
                onPressed: () => context.go('/denemeler'),
                child: const Text('Denemeler'),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        Text('Cevap İncelemesi',
            style: AppTypography.heading
                .copyWith(color: context.tokens.ink)),
        const SizedBox(height: AppSpacing.xs),
        ...result.review.map((q) => _ReviewTile(q: q)),
        const SizedBox(height: AppSpacing.xl),
      ],
    );
  }
}

/// Sonuç kartı: net puan büyük (display), altında Doğru/Yanlış/Boş rozetleri.
/// Renkli zemin yerine renkli SAYI — iki temada da kontrast korunur.
class _ScoreCard extends StatelessWidget {
  final AttemptResult result;
  const _ScoreCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: tokens.surfaceAlt,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        children: [
          Text(result.examTitle,
              textAlign: TextAlign.center,
              style: AppTypography.heading.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.md),
          Text(result.score?.toStringAsFixed(2) ?? '—',
              style: AppTypography.display.copyWith(color: tokens.brand)),
          Text('NET PUAN',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              _StatCell(
                  label: 'Doğru',
                  value: result.correctCount,
                  color: tokens.success),
              const SizedBox(width: AppSpacing.sm),
              _StatCell(
                  label: 'Yanlış',
                  value: result.wrongCount,
                  color: tokens.danger),
              const SizedBox(width: AppSpacing.sm),
              _StatCell(
                  label: 'Boş',
                  value: result.blankCount,
                  color: tokens.warning),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _StatCell(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Expanded(
      child: Semantics(
        label: '$label: $value',
        excludeSemantics: true,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: Color.alphaBlend(
                color.withValues(alpha: 0.10), tokens.surface),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: color.withValues(alpha: 0.35)),
          ),
          child: Column(
            children: [
              Text('$value',
                  style: AppTypography.title.copyWith(color: color)),
              const SizedBox(height: 2),
              Text(label,
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final ReviewQuestion q;
  const _ReviewTile({required this.q});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final blank = q.selectedOptionId == null;
    return Container(
      margin: const EdgeInsets.only(top: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('${q.order}. ${q.stem}',
              style: AppTypography.heading.copyWith(color: tokens.ink)),
          if (q.mediaUrl != null) ...[
            const SizedBox(height: AppSpacing.md),
            QuestionMedia(url: q.mediaUrl!),
          ],
          const SizedBox(height: AppSpacing.md),
          for (final o in q.options) ...[
            OptionRow(
              label: o.label,
              text: o.text,
              state: o.isCorrect
                  ? OptionRowState.correct
                  : q.selectedOptionId == o.id
                      ? OptionRowState.wrongPick
                      : OptionRowState.dimmed,
            ),
            const SizedBox(height: AppSpacing.xs),
          ],
          if (blank)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xs),
              child: Text('Bu soruyu boş bıraktın.',
                  style: AppTypography.label.copyWith(color: tokens.warning)),
            ),
          if (q.explanation != null && q.explanation!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            ExplanationBox(explanation: q.explanation!, source: q.source),
          ] else if (q.source != null && q.source!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xs),
              child: Text('Kaynak: ${q.source}',
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft)),
            ),
        ],
      ),
    );
  }
}

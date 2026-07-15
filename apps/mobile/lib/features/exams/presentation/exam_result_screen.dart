import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/exams_repository.dart';
import '../domain/exam_models.dart';

/// Deneme sonucu + inceleme (Doc 18 §2.4). Puan = NET. İnceleme renkleri web ile
/// aynı: doğru=yeşil, seçilen-yanlış=kırmızı; altında açıklama.
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
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(children: [
            LoadingSkeleton(height: 90),
            SizedBox(height: AppSpacing.md),
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
      padding: EdgeInsets.zero,
      children: [
        _Tiles(result: result),
        Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
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
        ),
        const Divider(),
        Padding(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0),
          child: Text('Cevap İncelemesi',
              style: Theme.of(context).textTheme.titleMedium),
        ),
        ...result.review.map((q) => _ReviewTile(q: q)),
        const SizedBox(height: AppSpacing.lg),
      ],
    );
  }
}

class _Tiles extends StatelessWidget {
  final AttemptResult result;
  const _Tiles({required this.result});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final tiles = [
      ('Puan (Net)', result.score?.toStringAsFixed(2) ?? '—', scheme.primary),
      ('Doğru', '${result.correctCount}', Colors.green),
      ('Yanlış', '${result.wrongCount}', Colors.red),
      ('Boş', '${result.blankCount}', Colors.amber.shade700),
    ];
    return Container(
      color: scheme.primary,
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            child: Text(result.examTitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold)),
          ),
          Row(
            children: tiles
                .map((t) => Expanded(
                      child: Container(
                        color: t.$3,
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                        child: Column(
                          children: [
                            Text(t.$2,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold)),
                            const SizedBox(height: 2),
                            Text(t.$1,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 12)),
                          ],
                        ),
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final ReviewQuestion q;
  const _ReviewTile({required this.q});

  @override
  Widget build(BuildContext context) {
    final blank = q.selectedOptionId == null;
    return Card(
      margin: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('${q.order}. ${q.stem}',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: AppSpacing.sm),
            ...q.options.map((o) {
              final chosen = q.selectedOptionId == o.id;
              Color? bg;
              // Vurgusuz şıklar tema metin rengini alır (dark mode okunur kalır).
              Color fg = Theme.of(context).colorScheme.onSurface;
              if (o.isCorrect) {
                bg = Colors.green;
                fg = Colors.white;
              } else if (chosen) {
                bg = Colors.red;
                fg = Colors.white;
              }
              return Container(
                margin: const EdgeInsets.only(bottom: AppSpacing.xs),
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: bg,
                  border: Border.all(
                      color: bg ?? Theme.of(context).colorScheme.outlineVariant),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Text('${o.label})  ',
                        style: TextStyle(fontWeight: FontWeight.bold, color: fg)),
                    Expanded(child: Text(o.text, style: TextStyle(color: fg))),
                  ],
                ),
              );
            }),
            if (blank)
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Text('Bu soruyu boş bıraktın.',
                    style: TextStyle(fontSize: 12, color: Colors.blue, fontWeight: FontWeight.w600)),
              ),
            if (q.explanation != null && q.explanation!.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: AppSpacing.xs),
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  border: const Border(left: BorderSide(color: Colors.green, width: 4)),
                ),
                child: Text('Açıklama: ${q.explanation}',
                    style: Theme.of(context).textTheme.bodySmall),
              ),
            if (q.source != null && q.source!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: AppSpacing.xs),
                child: Text('Kaynak: ${q.source}',
                    style: Theme.of(context).textTheme.bodySmall),
              ),
          ],
        ),
      ),
    );
  }
}

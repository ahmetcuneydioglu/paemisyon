import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/primary_button.dart';
import '../domain/quiz_models.dart';

/// Oturum sonucu (Doc 12 §6). Motive edici; zayıf konu yapıcı dille.
class ResultScreen extends StatelessWidget {
  final QuizResult result;
  const ResultScreen({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final mins = result.durationSeconds ~/ 60;
    final secs = result.durationSeconds % 60;
    return Scaffold(
      appBar:
          AppBar(title: const Text('Sonuç'), automaticallyImplyLeading: false),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Icon(Icons.emoji_events_rounded, size: 56, color: scheme.primary),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Oturum tamamlandı 🎉',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Skor: %${result.score.toStringAsFixed(0)}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: AppSpacing.lg),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _Stat(
                          label: 'Doğru',
                          value: result.correctCount,
                          color: scheme.primary),
                      _Stat(
                          label: 'Yanlış',
                          value: result.wrongCount,
                          color: scheme.error),
                      _Stat(
                          label: 'Boş',
                          value: result.blankCount,
                          color: scheme.outline),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Süre: ${mins}dk ${secs}sn · ${result.totalQuestions} soru',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              // ── Deneme karnesi: konu bazlı kırılım (ders denemesinde) ──
              if (result.topicBreakdown != null &&
                  result.topicBreakdown!.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                Expanded(
                  child: Card(
                    child: ListView(
                      padding: const EdgeInsets.all(AppSpacing.sm),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          child: Text('Konu Karnesi',
                              style: Theme.of(context).textTheme.titleSmall),
                        ),
                        ...result.topicBreakdown!.map(
                          (t) => ListTile(
                            dense: true,
                            title: Text(t.topicName,
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                            trailing: Text(
                              '${t.correct}/${t.total}',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: t.correct == t.total
                                    ? scheme.primary
                                    : t.correct * 2 >= t.total
                                        ? null
                                        : scheme.error,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
              ] else
                const Spacer(),
              PrimaryButton(
                  label: 'Ana sayfaya dön', onPressed: () => context.go('/')),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _Stat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('$value',
            style: Theme.of(context)
                .textTheme
                .headlineMedium
                ?.copyWith(color: color)),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

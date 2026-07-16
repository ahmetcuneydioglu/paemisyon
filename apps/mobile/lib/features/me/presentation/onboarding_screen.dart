import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../catalog/domain/catalog_models.dart';
import '../data/me_repository.dart';

final _modulesProvider = FutureProvider.autoDispose<List<ModuleItem>>(
  (ref) => ref.watch(catalogRepositoryProvider).getModules(),
);

/// Günlük süre → soru hedefi eşlemesi (Doc 24 Gün 0 kurulumu).
const _goalOptions = [
  (minutes: 15, goal: 10, label: '~15 dk / gün', sub: 'Nöbet arası tempo'),
  (minutes: 30, goal: 20, label: '~30 dk / gün', sub: 'Dengeli tempo (önerilen)'),
  (minutes: 60, goal: 40, label: '60+ dk / gün', sub: 'Yoğun hazırlık'),
];

/// Onboarding (Doc 24 Gün 0 — "3 sorudan fazlası sorulmaz"):
/// 1) Hangi sınav? 2) Sınav tarihi (biliyorsa) 3) Günde kaç dakika?
/// Ardından İlk Devriye: 10 soruluk karışık seviye tespiti → teşhis karnesi.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _step = 0;
  String? _moduleId;
  DateTime? _examDate;
  bool _dateSkipped = false;
  int _goal = 20;
  bool _busy = false;

  bool get _canContinue => switch (_step) {
        0 => _moduleId != null,
        1 => _examDate != null || _dateSkipped,
        _ => true,
      };

  Future<void> _finish({required bool startPatrol}) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(meRepositoryProvider).completeOnboarding(
            _moduleId!,
            targetExamDate: _examDate,
            dailyGoal: _goal,
          );
      ref.invalidate(dashboardProvider);
      if (!mounted) return;
      if (startPatrol) {
        // İlk Devriye: kapsamsız karışık 10 soru — teşhis, test değil.
        context.go('/');
        await context.push('/quiz', extra: {
          'topicName': 'İlk Devriye',
          'mode': 'practice',
          'count': 10,
        });
      } else {
        context.go('/');
      }
    } on Failure catch (f) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(f.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _examDate ?? now.add(const Duration(days: 90)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 730)),
      helpText: 'Hedef sınav tarihi',
    );
    if (picked != null) {
      setState(() {
        _examDate = picked;
        _dateSkipped = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.sm),
              // Adım göstergesi
              Row(
                children: [
                  for (var i = 0; i < 3; i++) ...[
                    Expanded(
                      child: AnimatedContainer(
                        duration: AppMotion.respect(AppMotion.quick),
                        height: 4,
                        decoration: BoxDecoration(
                          color: i <= _step ? tokens.brand : tokens.line,
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusFull),
                        ),
                      ),
                    ),
                    if (i < 2) const SizedBox(width: AppSpacing.xs),
                  ],
                ],
              ),
              const SizedBox(height: AppSpacing.xl),
              Expanded(
                child: AnimatedSwitcher(
                  duration: AppMotion.respect(AppMotion.standard),
                  switchInCurve: AppMotion.standardCurve,
                  child: switch (_step) {
                    0 => _StepExam(
                        key: const ValueKey(0),
                        selected: _moduleId,
                        onSelect: (id) => setState(() => _moduleId = id),
                      ),
                    1 => _StepDate(
                        key: const ValueKey(1),
                        date: _examDate,
                        skipped: _dateSkipped,
                        onPick: _pickDate,
                        onSkip: () => setState(() {
                          _dateSkipped = true;
                          _examDate = null;
                        }),
                      ),
                    _ => _StepGoal(
                        key: const ValueKey(2),
                        goal: _goal,
                        onSelect: (g) => setState(() => _goal = g),
                      ),
                  },
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              if (_step < 2)
                PrimaryButton(
                  label: 'Devam Et',
                  onPressed:
                      _canContinue ? () => setState(() => _step++) : null,
                )
              else ...[
                PrimaryButton(
                  label: "İlk Devriye'ye çık (10 soru)",
                  loading: _busy,
                  onPressed: () => _finish(startPatrol: true),
                ),
                TextButton(
                  onPressed: _busy ? null : () => _finish(startPatrol: false),
                  child: Text('Şimdilik geç',
                      style:
                          AppTypography.label.copyWith(color: tokens.inkSoft)),
                ),
              ],
              if (_step > 0)
                TextButton(
                  onPressed: _busy ? null : () => setState(() => _step--),
                  child: Text('Geri',
                      style:
                          AppTypography.label.copyWith(color: tokens.inkSoft)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Adım 1: Hangi sınav? ──

class _StepExam extends ConsumerWidget {
  final String? selected;
  final ValueChanged<String> onSelect;
  const _StepExam({super.key, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final modules = ref.watch(_modulesProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Hangi sınava hazırlanıyorsun?',
            style: AppTypography.title.copyWith(color: tokens.ink)),
        const SizedBox(height: AppSpacing.xs),
        Text('Koçun her şeyi bu hedefe göre kurar.',
            style: AppTypography.body.copyWith(color: tokens.inkSoft)),
        const SizedBox(height: AppSpacing.lg),
        Expanded(
          child: modules.when(
            loading: () => const Column(children: [
              LoadingSkeleton(height: 72),
              SizedBox(height: AppSpacing.sm),
              LoadingSkeleton(height: 72),
            ]),
            error: (e, _) => ErrorStateView(
              message: e is Failure ? e.message : 'Modüller yüklenemedi.',
              onRetry: () => ref.invalidate(_modulesProvider),
            ),
            data: (list) => ListView.separated(
              itemCount: list.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, i) {
                final m = list[i];
                final isSelected = m.id == selected;
                return PressableScale(
                  onTap: () => onSelect(m.id),
                  child: Container(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    decoration: BoxDecoration(
                      color: tokens.surface,
                      border: Border.all(
                        color: isSelected ? tokens.brand : tokens.line,
                        width: isSelected ? 1.5 : 1,
                      ),
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSelected
                              ? Icons.radio_button_checked_rounded
                              : Icons.radio_button_off_rounded,
                          color:
                              isSelected ? tokens.brand : tokens.inkSoft,
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(m.name,
                                  style: AppTypography.heading
                                      .copyWith(color: tokens.ink)),
                              if (m.description != null)
                                Text(m.description!,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppTypography.caption
                                        .copyWith(color: tokens.inkSoft)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

// ── Adım 2: Sınav tarihi ──

class _StepDate extends StatelessWidget {
  final DateTime? date;
  final bool skipped;
  final VoidCallback onPick;
  final VoidCallback onSkip;
  const _StepDate({
    super.key,
    required this.date,
    required this.skipped,
    required this.onPick,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Sınav tarihin belli mi?',
            style: AppTypography.title.copyWith(color: tokens.ink)),
        const SizedBox(height: AppSpacing.xs),
        Text(
            'Tarihi bilirsek koç son 30 günde sınav moduna, son 3 günde dinlenmeye geçirir.',
            style: AppTypography.body.copyWith(color: tokens.inkSoft)),
        const SizedBox(height: AppSpacing.xl),
        OutlinedButton.icon(
          onPressed: onPick,
          style: OutlinedButton.styleFrom(
            foregroundColor: tokens.ink,
            side: BorderSide(
                color: date != null ? tokens.brand : tokens.line,
                width: date != null ? 1.5 : 1),
            minimumSize: const Size.fromHeight(56),
          ),
          icon: const Icon(Icons.event_rounded, size: 20),
          label: Text(
            date != null
                ? '${date!.day}.${date!.month}.${date!.year}'
                : 'Tarih seç',
            style: AppTypography.heading,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        OutlinedButton(
          onPressed: onSkip,
          style: OutlinedButton.styleFrom(
            foregroundColor: skipped ? tokens.brand : tokens.inkSoft,
            side: BorderSide(
                color: skipped ? tokens.brand : tokens.line,
                width: skipped ? 1.5 : 1),
            minimumSize: const Size.fromHeight(AppSpacing.minTouchTarget + 4),
          ),
          child: const Text('Henüz belli değil'),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text('Sonradan Profil → Ayarlar\'dan değiştirebilirsin.',
            style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
      ],
    );
  }
}

// ── Adım 3: Günlük süre → hedef ──

class _StepGoal extends StatelessWidget {
  final int goal;
  final ValueChanged<int> onSelect;
  const _StepGoal({super.key, required this.goal, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Günde ne kadar vakit ayırabilirsin?',
            style: AppTypography.title.copyWith(color: tokens.ink)),
        const SizedBox(height: AppSpacing.xs),
        Text(
            'Vardiyalı hayata küçük hedef iyi gelir — istediğin an artırırız.',
            style: AppTypography.body.copyWith(color: tokens.inkSoft)),
        const SizedBox(height: AppSpacing.xl),
        for (final o in _goalOptions) ...[
          PressableScale(
            onTap: () => onSelect(o.goal),
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: tokens.surface,
                border: Border.all(
                  color: goal == o.goal ? tokens.brand : tokens.line,
                  width: goal == o.goal ? 1.5 : 1,
                ),
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
              child: Row(
                children: [
                  Icon(
                    goal == o.goal
                        ? Icons.radio_button_checked_rounded
                        : Icons.radio_button_off_rounded,
                    color: goal == o.goal ? tokens.brand : tokens.inkSoft,
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(o.label,
                            style: AppTypography.heading
                                .copyWith(color: tokens.ink)),
                        Text(o.sub,
                            style: AppTypography.caption
                                .copyWith(color: tokens.inkSoft)),
                      ],
                    ),
                  ),
                  Text('${o.goal} soru',
                      style: AppTypography.label
                          .copyWith(color: tokens.inkSoft)),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Sırada: İlk Devriye — 10 soruluk kısa bir tur. Not için değil, '
          'nereden başlayacağımızı görmek için.',
          style: AppTypography.caption.copyWith(color: tokens.inkSoft),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../catalog/domain/catalog_models.dart';
import '../data/me_repository.dart';

final _modulesProvider = FutureProvider.autoDispose<List<ModuleItem>>(
  (ref) => ref.watch(catalogRepositoryProvider).getModules(),
);

/// Onboarding (Doc 11 §2): hoş geldin + hedef sınav seçimi. İlk girişte bir kez;
/// profilden değiştirilebilir.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  String? _selected;
  bool _busy = false;

  Future<void> _continue() async {
    if (_selected == null || _busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(meRepositoryProvider).completeOnboarding(_selected!);
      ref.invalidate(dashboardProvider);
      if (mounted) context.go('/');
    } on Failure catch (f) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(f.message)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final modules = ref.watch(_modulesProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Text('Hoş geldin! 👋', style: theme.textTheme.headlineMedium),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Hangi sınava hazırlanıyorsun? Ana ekranını hedefine göre düzenleyelim.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: AppSpacing.xl),
              Expanded(
                child: modules.when(
                  loading: () => const Column(children: [
                    LoadingSkeleton(height: 72),
                    SizedBox(height: AppSpacing.sm),
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
                      final selected = m.id == _selected;
                      return Card(
                        color: selected
                            ? theme.colorScheme.primaryContainer
                            : null,
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.lg,
                              vertical: AppSpacing.xs),
                          leading: Icon(
                            selected
                                ? Icons.radio_button_checked_rounded
                                : Icons.radio_button_off_rounded,
                            color: theme.colorScheme.primary,
                          ),
                          title: Text(m.name,
                              style: theme.textTheme.titleMedium),
                          subtitle: m.description != null
                              ? Text(m.description!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis)
                              : null,
                          onTap: () => setState(() => _selected = m.id),
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              PrimaryButton(
                label: 'Devam Et',
                loading: _busy,
                onPressed: _selected == null ? null : _continue,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

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
import '../domain/catalog_models.dart';

/// Hedef seçim ekranı (Doc 20) — liste DEĞİL, eğitim yolu seçimi.
/// Onaylı tasarım A: iki eşit büyük hedef kartı; kayıtlı hedef "Hedefin"
/// rozetiyle işaretli; karttan derslere Hero geçişi. Modül sayısı veriden
/// gelir — 3. modül açılırsa ekran kod değişmeden üç karta iner.
class ModulesScreen extends ConsumerWidget {
  const ModulesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final modules = ref.watch(modulesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Hedefini Seç')),
      body: modules.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.md),
          child: Column(
            children: [
              Expanded(child: LoadingSkeleton(height: double.infinity)),
              SizedBox(height: AppSpacing.md),
              Expanded(child: LoadingSkeleton(height: double.infinity)),
            ],
          ),
        ),
        error: (err, _) => ErrorStateView(
          message: err is Failure ? err.message : 'Yüklenemedi.',
          onRetry: () => ref.invalidate(modulesProvider),
        ),
        data: (list) => list.isEmpty
            ? const EmptyStateView(
                icon: Icons.school_rounded,
                message: 'Şu an açık bir çalışma alanı yok.',
              )
            : _GoalCards(modules: list),
      ),
    );
  }
}

class _GoalCards extends StatelessWidget {
  final List<ModuleItem> modules;
  const _GoalCards({required this.modules});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // ≤3 modül: kartlar ekranı eşit paylaşır (yol seçimi hissi).
    // Daha fazlası (gelecek): kaydırılabilir listeye düşer.
    final fillsScreen = modules.length <= 3;

    final header = Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.xs, AppSpacing.xs, AppSpacing.xs, AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Hangi sınava hazırlanıyorsun?',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text('Seçimini istediğin zaman değiştirebilirsin.',
              style: theme.textTheme.bodySmall),
        ],
      ),
    );

    final cards = [
      for (final (i, m) in modules.indexed)
        StaggeredReveal(index: i, child: _GoalCard(module: m)),
    ];

    if (!fillsScreen) {
      return ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          header,
          for (final c in cards) ...[
            SizedBox(height: 180, child: c),
            const SizedBox(height: AppSpacing.md),
          ],
        ],
      );
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            header,
            for (final (i, c) in cards.indexed) ...[
              if (i > 0) const SizedBox(height: AppSpacing.md),
              Expanded(child: c),
            ],
          ],
        ),
      ),
    );
  }
}

/// Modül kimliği: anahtar → ikon + renk dünyası (PAEM mavi, Misyon teal).
({IconData icon, Color bg, Color border, Color fg}) _identityOf(
    BuildContext context, ModuleItem m) {
  final pal = AccentPalette.of(context);
  final scheme = Theme.of(context).colorScheme;
  return switch (m.key) {
    'paem' => (
        icon: Icons.local_police_rounded,
        bg: pal.heroBg,
        border: pal.heroBorder,
        fg: pal.accentText,
      ),
    'misyon' => (
        icon: Icons.security_rounded,
        bg: pal.liveBg,
        border: pal.liveFg.withValues(alpha: 0.4),
        fg: pal.liveFg,
      ),
    _ => (
        icon: Icons.school_rounded,
        bg: scheme.surfaceContainerHighest,
        border: scheme.outlineVariant,
        fg: scheme.onSurfaceVariant,
      ),
  };
}

class _GoalCard extends StatelessWidget {
  final ModuleItem module;
  const _GoalCard({required this.module});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final pal = AccentPalette.of(context);
    final id = _identityOf(context, module);

    // Meta satırı: soru sayısı her zaman; doğruluk yalnız geçmişi varsa.
    final meta = [
      '${module.questionCount} soru',
      if (module.accuracy != null) '%${module.accuracy} doğruluk',
    ].join(' · ');

    return PressableScale(
      onTap: () => context.push(
        '/catalog/module/${module.id}',
        extra: {'name': module.name, 'key': module.key},
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md + 4),
        decoration: BoxDecoration(
          color: id.bg,
          border: Border.all(color: id.border),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        child: Stack(
          children: [
            if (module.isPreferred)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: pal.accent,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text('Hedefin',
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Colors.white)),
                ),
              ),
            Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero: derslere geçişte ikon + isim bloğu uçar ("yol seçildi" hissi).
                Hero(
                  tag: 'module-${module.id}',
                  child: Material(
                    type: MaterialType.transparency,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(id.icon, size: 34, color: id.fg),
                        const SizedBox(width: AppSpacing.sm + 2),
                        Text(module.name,
                            style: theme.textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
                if (module.description != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(module.description!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium),
                ],
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: Text(meta, style: theme.textTheme.bodySmall),
                    ),
                    Icon(Icons.arrow_forward_rounded, size: 20, color: id.fg),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

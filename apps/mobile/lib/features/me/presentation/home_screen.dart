import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/me_repository.dart';
import '../domain/dashboard_data.dart';

/// Home / Dashboard (Sprint 7, Doc 12 §4): selamlama + streak + günlük ilerleme +
/// genel istatistik + hızlı erişim. Tek istek: GET /me/dashboard.
/// Onboarding tamamlanmamışsa hedef seçimine yönlendirir (Doc 11 §2).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dash = ref.watch(dashboardProvider);

    // İlk giriş: hedef sınav seçilmemişse onboarding'e götür.
    ref.listen(dashboardProvider, (prev, next) {
      final d = next.valueOrNull;
      if (d != null && !d.onboardingCompleted) {
        context.go('/onboarding');
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Paemisyon'),
        actions: [
          IconButton(
            tooltip: 'Profil & Ayarlar',
            icon: const Icon(Icons.person_rounded),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: dash.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LoadingSkeleton(height: 28, width: 180),
              SizedBox(height: AppSpacing.md),
              LoadingSkeleton(height: 96),
              SizedBox(height: AppSpacing.md),
              LoadingSkeleton(height: 96),
              SizedBox(height: AppSpacing.md),
              LoadingSkeleton(height: 56),
            ],
          ),
        ),
        error: (err, _) => ErrorStateView(
          message: err is Failure ? err.message : 'Dashboard yüklenemedi.',
          onRetry: () => ref.invalidate(dashboardProvider),
        ),
        data: (d) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(dashboardProvider),
          child: _Dashboard(data: d),
        ),
      ),
    );
  }
}

class _Dashboard extends StatelessWidget {
  final DashboardData data;
  const _Dashboard({required this.data});

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 6) return 'İyi geceler';
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final name = (data.displayName?.trim().isNotEmpty ?? false)
        ? data.displayName!.trim()
        : null;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        // ── Selamlama ──
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name != null ? '$_greeting, $name' : _greeting,
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    data.preferredModuleName != null
                        ? 'Hedef: ${data.preferredModuleName} · Bugün de bir adım ileri.'
                        : 'Bugün de bir adım ileri.',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            if (data.isPremium)
              Chip(
                avatar: Icon(Icons.workspace_premium_rounded,
                    size: 18, color: theme.colorScheme.primary),
                label: const Text('Premium'),
                visualDensity: VisualDensity.compact,
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Günlük ilerleme + streak ──
        // NOT: ListView çocukları sonsuz yükseklik alır; Row'da doğrudan
        // CrossAxisAlignment.stretch kullanmak layout'u çökertir (telefonda
        // görülen "boş ekran" hatası). Eş boy kart için IntrinsicHeight doğru araç.
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: _TodayCard(data: data)),
              const SizedBox(width: AppSpacing.md),
              _StreakCard(
                  current: data.currentStreak, longest: data.longestStreak),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),

        // ── Genel istatistik ──
        Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.md, horizontal: AppSpacing.sm),
            child: Row(
              children: [
                _Stat(label: 'Çözülen', value: '${data.totalSolved}'),
                _divider(context),
                _Stat(label: 'Doğruluk', value: '%${data.accuracy}'),
                _divider(context),
                _Stat(label: 'Oturum', value: '${data.totalSessions}'),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Ana aksiyon ──
        FilledButton.icon(
          style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md)),
          onPressed: () => context.push('/catalog'),
          icon: const Icon(Icons.play_arrow_rounded),
          label: const Text('Çalışmaya Başla'),
        ),
        const SizedBox(height: AppSpacing.md),

        // ── Hızlı erişim ──
        Row(
          children: [
            Expanded(
              child: _QuickAction(
                icon: Icons.insights_rounded,
                label: 'İlerlemem',
                onTap: () => context.push('/progress'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _QuickAction(
                icon: Icons.refresh_rounded,
                label: 'Tekrar',
                onTap: () => context.push('/review'),
              ),
            ),
          ],
        ),

        // ── Premium CTA (yalnızca free) ──
        if (!data.isPremium) ...[
          const SizedBox(height: AppSpacing.lg),
          Card(
            color: theme.colorScheme.primaryContainer,
            child: ListTile(
              leading: Icon(Icons.workspace_premium_rounded,
                  color: theme.colorScheme.onPrimaryContainer),
              title: const Text('Sınırsız soru için Premium'),
              subtitle: const Text('Günlük sınırı kaldır, tüm içeriğe eriş.'),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.push('/paywall'),
            ),
          ),
        ],
      ],
    );
  }

  Widget _divider(BuildContext context) => Container(
        width: 1,
        height: 32,
        color: Theme.of(context).colorScheme.outlineVariant,
      );
}

/// Bugünkü soru kullanımı: free'de limit bar'ı, premium'da sınırsız rozeti.
class _TodayCard extends StatelessWidget {
  final DashboardData data;
  const _TodayCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final limit = data.dailyLimit;
    final progress =
        limit == null ? null : (data.answeredToday / limit).clamp(0.0, 1.0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bugün', style: theme.textTheme.labelMedium),
            const SizedBox(height: AppSpacing.xs),
            Text(
              limit == null
                  ? '${data.answeredToday} soru'
                  : '${data.answeredToday} / $limit soru',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            if (progress != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(value: progress, minHeight: 6),
              )
            else
              Row(
                children: [
                  Icon(Icons.all_inclusive_rounded,
                      size: 16, color: theme.colorScheme.primary),
                  const SizedBox(width: 4),
                  Text('Sınırsız', style: theme.textTheme.bodySmall),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _StreakCard extends StatelessWidget {
  final int current;
  final int longest;
  const _StreakCard({required this.current, required this.longest});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Seri', style: theme.textTheme.labelMedium),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                const Text('🔥', style: TextStyle(fontSize: 20)),
                const SizedBox(width: 4),
                Text('$current gün', style: theme.textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text('Rekor: $longest', style: theme.textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  const _Stat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        children: [
          Text(value, style: theme.textTheme.titleLarge),
          const SizedBox(height: 2),
          Text(label, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickAction(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Column(
            children: [
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: AppSpacing.xs),
              Text(label),
            ],
          ),
        ),
      ),
    );
  }
}

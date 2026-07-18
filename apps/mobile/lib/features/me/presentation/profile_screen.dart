import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/rank_insignia.dart';
import '../../coach/data/coach_repository.dart';
import '../../coach/domain/coach_models.dart';
import '../data/me_repository.dart';
import '../domain/me_profile.dart';

/// Kullanıcının kimliği, çalışma özeti ve ilerleme vitrini.
/// Düzenlenebilir hesap alanları ayrı ayarlar ekranında tutulur.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            tooltip: 'Profil ayarları',
            onPressed: () => context.push('/profile/settings'),
          ),
        ],
      ),
      body: me.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(children: [
            LoadingSkeleton(height: 112),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 190),
          ]),
        ),
        error: (error, _) => ErrorStateView(
          message: error is Failure ? error.message : 'Profil yüklenemedi.',
          onRetry: () => ref.invalidate(meProvider),
        ),
        data: (profile) => _ProfileBody(profile: profile),
      ),
    );
  }
}

class _ProfileBody extends ConsumerWidget {
  final MeProfile profile;
  const _ProfileBody({required this.profile});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final brief = ref.watch(coachBriefProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(meProvider);
        ref.invalidate(coachBriefProvider);
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    child: Text(
                      (profile.displayName?.trim().isNotEmpty ?? false)
                          ? profile.displayName!.trim()[0].toUpperCase()
                          : '?',
                      style: theme.textTheme.titleLarge,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.lg),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(profile.displayName ?? 'Kullanıcı',
                            style: theme.textTheme.titleMedium),
                        const SizedBox(height: AppSpacing.xs),
                        Text(profile.email,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall),
                        const SizedBox(height: AppSpacing.xs),
                        Row(children: [
                          Icon(
                            profile.emailVerified
                                ? Icons.verified_rounded
                                : Icons.info_outline_rounded,
                            size: 16,
                            color: profile.emailVerified
                                ? theme.colorScheme.primary
                                : theme.colorScheme.error,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Text(
                            profile.emailVerified
                                ? 'E-posta doğrulandı'
                                : 'E-posta doğrulanmadı',
                            style: theme.textTheme.labelSmall,
                          ),
                        ]),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_rounded),
                    tooltip: 'Profili düzenle',
                    onPressed: () => context.push('/profile/settings'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _PlanCard(profile: profile),
          const SizedBox(height: AppSpacing.lg),
          brief.when(
            loading: () => const LoadingSkeleton(height: 176),
            error: (_, __) => Card(
              child: ListTile(
                leading: const Icon(Icons.refresh_rounded),
                title: const Text('İlerleme özeti yüklenemedi'),
                subtitle: const Text('Yeniden denemek için dokun.'),
                onTap: () => ref.invalidate(coachBriefProvider),
              ),
            ),
            data: (value) => _ProgressSummary(brief: value),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text('Hızlı erişim', style: theme.textTheme.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          Card(
            child: Column(children: [
              _Shortcut(
                icon: Icons.insights_rounded,
                title: 'İlerlemem',
                subtitle: 'Başarı oranı, seri ve konu performansı',
                onTap: () => context.push('/progress'),
              ),
              const Divider(height: 1),
              _Shortcut(
                icon: Icons.assignment_rounded,
                title: 'Denemelerim',
                subtitle: 'Deneme sınavları ve sonuçlar',
                onTap: () => context.push('/denemeler'),
              ),
              const Divider(height: 1),
              _Shortcut(
                icon: Icons.settings_rounded,
                title: 'Hesap ve çalışma ayarları',
                subtitle: 'Hedef, günlük plan, şifre ve hesap işlemleri',
                onTap: () => context.push('/profile/settings'),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final MeProfile profile;
  const _PlanCard({required this.profile});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(children: [
          Icon(
            profile.isPremium
                ? Icons.workspace_premium_rounded
                : Icons.shield_outlined,
            color: profile.isPremium
                ? theme.colorScheme.primary
                : theme.colorScheme.outline,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.isPremium ? 'Premium plan' : 'Ücretsiz plan',
                    style: theme.textTheme.titleSmall),
                Text(
                  profile.isPremium
                      ? (profile.validUntil == null
                          ? 'Süresiz erişim'
                          : '${_date(profile.validUntil!)} tarihine kadar')
                      : 'Günlük kullanım sınırları geçerli',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          if (!profile.isPremium)
            TextButton(
              onPressed: () => context.push('/paywall'),
              child: const Text('Yükselt'),
            ),
        ]),
      ),
    );
  }
}

class _ProgressSummary extends StatelessWidget {
  final CoachBrief brief;
  const _ProgressSummary({required this.brief});

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      if (brief.rank != null)
        RankInsignia(
          level: brief.rank!.level,
          name: brief.rank!.name,
          score: brief.rank!.score,
          progressToNext: brief.rank!.progressToNext,
          nextName: brief.rank!.next?.name,
          pointsToNext: brief.rank!.next == null
              ? null
              : brief.rank!.next!.minScore - brief.rank!.score,
          onTap: () => context.push('/leaderboard'),
        ),
      if (brief.rank != null) const SizedBox(height: AppSpacing.md),
      Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
          child: Row(children: [
            _Metric(value: '${brief.totalSolved}', label: 'Çözülen'),
            _Metric(value: '%${brief.accuracy}', label: 'Başarı'),
            _Metric(value: '${brief.streakCurrent}', label: 'Günlük seri'),
          ]),
        ),
      ),
      if (brief.nextBadge != null) ...[
        const SizedBox(height: AppSpacing.md),
        Card(
          child: ListTile(
            leading: const Icon(Icons.military_tech_rounded),
            title: Text('${brief.nextBadge!.name} rozeti'),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: AppSpacing.sm),
              child: LinearProgressIndicator(
                value: brief.nextBadge!.target == 0
                    ? 0
                    : brief.nextBadge!.progress / brief.nextBadge!.target,
              ),
            ),
            trailing:
                Text('${brief.nextBadge!.progress}/${brief.nextBadge!.target}'),
          ),
        ),
      ],
    ]);
  }
}

class _Metric extends StatelessWidget {
  final String value;
  final String label;
  const _Metric({required this.value, required this.label});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Semantics(
          label: '$label: $value',
          child: Column(children: [
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: AppSpacing.xs),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ]),
        ),
      );
}

class _Shortcut extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _Shortcut({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => ListTile(
        minVerticalPadding: AppSpacing.md,
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      );
}

String _date(DateTime date) =>
    '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';

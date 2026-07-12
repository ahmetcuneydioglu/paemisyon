import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../auth/data/auth_repository.dart';
import '../data/me_repository.dart';
import '../domain/me_profile.dart';

/// Giriş sonrası Home (Sprint 7'de zenginleşir). Korumalı /me'yi çağırır →
/// Supabase login → token → NestJS guard → provisioning zincirini kanıtlar.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paemisyon'),
        actions: [
          IconButton(
            tooltip: 'Çıkış yap',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: me.when(
          loading: () => const Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LoadingSkeleton(height: 24, width: 160),
              SizedBox(height: AppSpacing.md),
              LoadingSkeleton(height: 16),
            ],
          ),
          error: (err, _) => ErrorStateView(
            message: err is Failure ? err.message : 'Profil yüklenemedi.',
            onRetry: () => ref.invalidate(meProvider),
          ),
          data: (profile) => _ProfileCard(profile: profile),
        ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  final MeProfile profile;
  const _ProfileCard({required this.profile});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Center(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.verified_user_rounded,
                  size: 48, color: scheme.primary),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Giriş başarılı',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(profile.email),
              Text('Roller: ${profile.roles.join(", ")}'),
              Text('Premium: ${profile.isPremium ? "evet" : "hayır"}'),
              const SizedBox(height: AppSpacing.lg),
              PrimaryButton(
                label: 'Kategorilere göz at',
                onPressed: () => context.push('/catalog'),
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.push('/progress'),
                      child: const Text('İlerlemem'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => context.push('/review'),
                      child: const Text('Tekrar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

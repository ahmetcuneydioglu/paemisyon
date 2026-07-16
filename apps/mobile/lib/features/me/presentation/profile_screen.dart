import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../auth/data/auth_repository.dart';
import '../data/me_repository.dart';
import '../domain/me_profile.dart';

/// Profil & Ayarlar (Doc 13 S7): isim, hedef sınav, abonelik, çıkış,
/// KVKK hesap silme (App Store zorunluluğu — geri alınamaz).
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(meProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profil & Ayarlar')),
      body: me.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(children: [
            LoadingSkeleton(height: 80),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 200),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Profil yüklenemedi.',
          onRetry: () => ref.invalidate(meProvider),
        ),
        data: (p) => _ProfileBody(profile: p),
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
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        // ── Kimlik kartı ──
        Card(
          child: ListTile(
            leading: CircleAvatar(
              child: Text(
                (profile.displayName?.isNotEmpty ?? false)
                    ? profile.displayName![0].toUpperCase()
                    : '?',
              ),
            ),
            title: Text(profile.displayName ?? 'Kullanıcı'),
            subtitle: Text(profile.email),
            trailing: IconButton(
              icon: const Icon(Icons.edit_rounded),
              tooltip: 'İsmi düzenle',
              onPressed: () => _editName(context, ref),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Abonelik ──
        Card(
          child: ListTile(
            leading: Icon(Icons.workspace_premium_rounded,
                color: profile.isPremium
                    ? theme.colorScheme.primary
                    : theme.colorScheme.outline),
            title: Text(profile.isPremium ? 'Premium' : 'Ücretsiz plan'),
            subtitle: Text(profile.isPremium
                ? (profile.validUntil != null
                    ? 'Bitiş: ${_date(profile.validUntil!)}'
                    : 'Süresiz')
                : 'Günlük soru sınırı geçerli'),
            trailing:
                profile.isPremium ? null : const Icon(Icons.chevron_right_rounded),
            onTap: profile.isPremium ? null : () => context.push('/paywall'),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Hedef sınav ──
        Card(
          child: ListTile(
            leading: const Icon(Icons.flag_rounded),
            title: const Text('Hedef sınav'),
            subtitle: Text(profile.preferredModuleName ?? 'Seçilmedi'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/onboarding'),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),

        // ── Çıkış ──
        OutlinedButton.icon(
          icon: const Icon(Icons.logout_rounded),
          label: const Text('Çıkış yap'),
          onPressed: () => ref.read(authRepositoryProvider).signOut(),
        ),
        const SizedBox(height: AppSpacing.xl),

        // ── KVKK hesap silme ──
        Text('Tehlikeli bölge', style: theme.textTheme.labelMedium),
        const SizedBox(height: AppSpacing.xs),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: theme.colorScheme.error,
            side: BorderSide(color: theme.colorScheme.error.withValues(alpha: 0.5)),
          ),
          icon: const Icon(Icons.delete_forever_rounded),
          label: const Text('Hesabımı kalıcı olarak sil'),
          onPressed: () => _confirmDelete(context, ref),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Hesabın ve kişisel verilerin KVKK kapsamında kalıcı olarak silinir. Bu işlem geri alınamaz.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }

  String _date(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';

  Future<void> _editName(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController(text: profile.displayName ?? '');
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('İsmini düzenle'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLength: 50,
          decoration: const InputDecoration(labelText: 'Görünen isim'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Vazgeç')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
    if (name == null || name.isEmpty || name == profile.displayName) return;
    try {
      await ref.read(meRepositoryProvider).updateDisplayName(name);
      ref.invalidate(meProvider);
      ref.invalidate(dashboardProvider);
    } on Failure catch (f) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(f.message)));
      }
    }
  }

  /// Çift onay: önce uyarı, sonra "SİL" yazarak teyit (yanlışlıkla silme imkânsız).
  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final first = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.warning_amber_rounded),
        title: const Text('Hesabını silmek üzeresin'),
        content: const Text(
            'Tüm ilerlemen, istatistiklerin ve aboneliğin kalıcı olarak silinir. '
            'Bu işlem geri alınamaz.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Vazgeç')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Devam et'),
          ),
        ],
      ),
    );
    if (first != true || !context.mounted) return;

    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Onay için SİL yaz'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'SİL'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Vazgeç')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () =>
                Navigator.pop(ctx, controller.text.trim().toUpperCase() == 'SİL'),
            child: const Text('Hesabı Sil'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(meRepositoryProvider).deleteAccount();
      // Yerel oturumu kapat → router login'e atar.
      await ref.read(authRepositoryProvider).signOut();
    } on Failure catch (f) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(f.message)));
      }
    }
  }
}

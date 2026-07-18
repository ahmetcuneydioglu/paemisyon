import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../auth/data/auth_repository.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../coach/data/coach_repository.dart';
import '../data/me_repository.dart';
import '../domain/me_profile.dart';

class ProfileSettingsScreen extends ConsumerWidget {
  const ProfileSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(meProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profil ve Ayarlar')),
      body: profile.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(children: [LoadingSkeleton(height: 180)]),
        ),
        error: (error, _) => ErrorStateView(
          message: error is Failure ? error.message : 'Ayarlar yüklenemedi.',
          onRetry: () => ref.invalidate(meProvider),
        ),
        data: (value) => _SettingsForm(key: ValueKey(value.id), profile: value),
      ),
    );
  }
}

class _SettingsForm extends ConsumerStatefulWidget {
  final MeProfile profile;
  const _SettingsForm({super.key, required this.profile});

  @override
  ConsumerState<_SettingsForm> createState() => _SettingsFormState();
}

class _SettingsFormState extends ConsumerState<_SettingsForm> {
  late final TextEditingController _name;
  late String? _moduleId;
  late int _goal;
  late DateTime? _examDate;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.profile.displayName ?? '');
    _moduleId = widget.profile.preferredModuleId;
    _goal = widget.profile.dailyGoal;
    _examDate = widget.profile.targetExamDate;
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().length < 2 || _moduleId == null || _busy) return;
    setState(() => _busy = true);
    try {
      await ref.read(meRepositoryProvider).updateProfile(
            displayName: _name.text,
            preferredModuleId: _moduleId!,
            dailyGoal: _goal,
            targetExamDate: _examDate,
          );
      ref.invalidate(meProvider);
      ref.invalidate(dashboardProvider);
      ref.invalidate(coachBriefProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profil ve hedeflerin güncellendi.')),
        );
      }
    } on Failure catch (failure) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
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
    if (picked != null) setState(() => _examDate = picked);
  }

  Future<void> _changePassword() async {
    final first = TextEditingController();
    final second = TextEditingController();
    final password = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Şifre değiştir'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
              controller: first,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Yeni şifre')),
          const SizedBox(height: AppSpacing.sm),
          TextField(
              controller: second,
              obscureText: true,
              decoration:
                  const InputDecoration(labelText: 'Yeni şifre tekrar')),
        ]),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Vazgeç')),
          FilledButton(
              onPressed: () => Navigator.pop(
                  ctx,
                  first.text == second.text && first.text.length >= 8
                      ? first.text
                      : ''),
              child: const Text('Değiştir')),
        ],
      ),
    );
    first.dispose();
    second.dispose();
    if (password == null || password.isEmpty || !mounted) return;
    try {
      await ref.read(authRepositoryProvider).updatePassword(password);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Şifren değiştirildi.')));
      }
    } on AuthException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final modules = ref.watch(modulesProvider);
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
                labelText: 'Görünen ad', border: OutlineInputBorder())),
        const SizedBox(height: AppSpacing.lg),
        modules.when(
          loading: () => const LoadingSkeleton(height: 56),
          error: (_, __) => const Text('Hedef sınavlar yüklenemedi.'),
          data: (items) => DropdownButtonFormField<String>(
            initialValue: _moduleId,
            decoration: const InputDecoration(
                labelText: 'Hedef sınav', border: OutlineInputBorder()),
            items: items
                .map((item) =>
                    DropdownMenuItem(value: item.id, child: Text(item.name)))
                .toList(),
            onChanged: (value) => setState(() => _moduleId = value),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Hedef sınav tarihi'),
          subtitle: Text(_examDate == null
              ? 'Belli değil'
              : '${_examDate!.day.toString().padLeft(2, '0')}.${_examDate!.month.toString().padLeft(2, '0')}.${_examDate!.year}'),
          trailing: Wrap(children: [
            if (_examDate != null)
              IconButton(
                  onPressed: () => setState(() => _examDate = null),
                  icon: const Icon(Icons.close_rounded),
                  tooltip: 'Tarihi temizle'),
            IconButton(
                onPressed: _pickDate,
                icon: const Icon(Icons.calendar_month_rounded),
                tooltip: 'Tarih seç')
          ]),
        ),
        const SizedBox(height: AppSpacing.md),
        Text('Günlük hedef: $_goal soru',
            style: Theme.of(context).textTheme.titleSmall),
        Slider(
            value: _goal.toDouble(),
            min: 5,
            max: 100,
            divisions: 19,
            label: '$_goal',
            onChanged: (value) => setState(() => _goal = value.round())),
        const SizedBox(height: AppSpacing.lg),
        FilledButton.icon(
            onPressed: _busy ? null : _save,
            icon: const Icon(Icons.save_rounded),
            label: Text(_busy ? 'Kaydediliyor…' : 'Değişiklikleri kaydet')),
        const SizedBox(height: AppSpacing.xl),
        const Divider(),
        ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.password_rounded),
            title: const Text('Şifre değiştir'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: _changePassword),
        ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.logout_rounded),
            title: const Text('Çıkış yap'),
            onTap: () => ref.read(authRepositoryProvider).signOut()),
        const Divider(),
        ListTile(
            contentPadding: EdgeInsets.zero,
            textColor: Theme.of(context).colorScheme.error,
            iconColor: Theme.of(context).colorScheme.error,
            leading: const Icon(Icons.delete_forever_rounded),
            title: const Text('Hesabımı kalıcı olarak sil'),
            subtitle: const Text(
                'Kişisel bilgiler anonimleştirilir ve giriş erişimin kapatılır.'),
            onTap: () => _confirmDelete(context, ref)),
      ],
    );
  }
}

Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
  final controller = TextEditingController();
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      icon: const Icon(Icons.warning_amber_rounded),
      title: const Text('Hesabını silmek üzeresin'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text(
            'Kişisel bilgilerin anonimleştirilir, giriş erişimin kapatılır ve aboneliğin sonlandırılır. Bu işlem geri alınamaz.'),
        const SizedBox(height: AppSpacing.lg),
        TextField(
            controller: controller,
            decoration:
                const InputDecoration(labelText: 'Onaylamak için SİL yaz')),
      ]),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Vazgeç')),
        FilledButton(
            onPressed: () => Navigator.pop(
                ctx, controller.text.trim().toUpperCase() == 'SİL'),
            child: const Text('Hesabı sil')),
      ],
    ),
  );
  controller.dispose();
  if (confirmed != true || !context.mounted) return;
  try {
    await ref.read(meRepositoryProvider).deleteAccount();
    await ref.read(authRepositoryProvider).signOut();
  } on Failure catch (failure) {
    if (context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message)));
    }
  }
}

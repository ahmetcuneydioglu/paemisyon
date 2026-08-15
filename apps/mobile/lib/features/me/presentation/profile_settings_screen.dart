import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/error/failure.dart';
import '../../../core/notifications/notification_service.dart';
import '../../../core/notifications/push_service.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/theme_mode_provider.dart';
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
    // Kapanış animasyonu bitmeden dispose = '_dependents.isEmpty' çökmesi.
    Future.delayed(const Duration(milliseconds: 400), () {
      first.dispose();
      second.dispose();
    });
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

        // ── Görünüm (Doc 28 P1-11): web'in Oto/Açık/Koyu anahtarının eşi ──
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.brightness_6_rounded),
          title: const Text('Görünüm'),
          trailing: Consumer(builder: (context, ref, _) {
            final mode = ref.watch(themeModeProvider);
            return SegmentedButton<ThemeMode>(
              showSelectedIcon: false,
              style: SegmentedButton.styleFrom(
                  visualDensity: VisualDensity.compact),
              segments: const [
                ButtonSegment(
                    value: ThemeMode.system, label: Text('Oto')),
                ButtonSegment(
                    value: ThemeMode.light, label: Text('Açık')),
                ButtonSegment(value: ThemeMode.dark, label: Text('Koyu')),
              ],
              selected: {mode},
              onSelectionChanged: (s) =>
                  ref.read(themeModeProvider.notifier).set(s.first),
            );
          }),
        ),
        const Divider(),

        // ── Günlük hatırlatıcı (Doc 28 P1-7): varsayılan KAPALI; açarken
        // sistem izni istenir. Hedef dolduysa o gün bildirim gelmez. ──
        Consumer(builder: (context, ref, _) {
          final reminder = ref.watch(reminderSettingsProvider);
          return Column(children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              secondary: const Icon(Icons.notifications_active_outlined),
              title: const Text('Günlük hatırlatıcı'),
              subtitle: const Text(
                  'Hedefini doldurmadıysan akşam kısa bir hatırlatma gelir.'),
              value: reminder.enabled,
              onChanged: (v) async {
                final ok = await ref
                    .read(reminderSettingsProvider.notifier)
                    .setEnabled(v);
                if (!context.mounted) return;
                if (!ok && v) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text(
                          'Bildirim izni verilmedi. Ayarlar > Bildirimler\'den açabilirsin.')));
                } else if (ok && v) {
                  // Kur-doğrulama: kaç bildirim zamanlandı, kullanıcı görsün.
                  final n = await ref
                      .read(notificationServiceProvider)
                      .pendingCount();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: Text(
                            '✅ $n bildirim kuruldu — ilki bugün/yarın saat '
                            '${ref.read(reminderSettingsProvider).time.format(context)}.')));
                  }
                }
              },
            ),
            if (reminder.enabled)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const SizedBox(width: 24),
                title: const Text('Hatırlatma saati'),
                subtitle: Text(reminder.time.format(context)),
                trailing: const Icon(Icons.schedule_rounded),
                onTap: () async {
                  final picked = await showTimePicker(
                      context: context, initialTime: reminder.time);
                  if (picked != null) {
                    await ref
                        .read(reminderSettingsProvider.notifier)
                        .setTime(picked);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text(
                              '✅ Hatırlatma saati ${picked.format(context)} olarak kuruldu.')));
                    }
                  }
                },
              ),
          ]);
        }),
        const Divider(),

        // ── Yasal + destek (App Store gereklilikleri — Doc 28 P1-11) ──
        ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Gizlilik Politikası (KVKK)'),
            trailing: const Icon(Icons.open_in_new_rounded, size: 18),
            onTap: () => _openWeb('https://paemisyon.com/gizlilik')),
        ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.description_outlined),
            title: const Text('Kullanım Koşulları'),
            trailing: const Icon(Icons.open_in_new_rounded, size: 18),
            onTap: () => _openWeb('https://paemisyon.com/kosullar')),
        ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.help_outline_rounded),
            title: const Text('SSS ve Destek'),
            subtitle: const Text('destek@paemisyon.com'),
            trailing: const Icon(Icons.open_in_new_rounded, size: 18),
            onTap: () => _openWeb('https://paemisyon.com/sss')),
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
            onTap: () async {
              // Push token'ı bu cihazdan sök (KVKK) — sonra oturumu kapat.
              await ref.read(pushServiceProvider).unregister();
              await ref.read(authRepositoryProvider).signOut();
            }),
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
  // Kapanış animasyonu bitmeden dispose = '_dependents.isEmpty' çökmesi.
  Future.delayed(const Duration(milliseconds: 400), controller.dispose);
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

/// Dış bağlantı aç (yasal sayfalar web'de tek kaynak — kopya metin tutulmaz).
Future<void> _openWeb(String url) async {
  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
}

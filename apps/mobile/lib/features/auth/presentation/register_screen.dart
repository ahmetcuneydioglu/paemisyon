import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/auth_repository.dart';
import 'auth_scaffold.dart';
import 'social_sign_in_buttons.dart';

/// Kayıt — girişle aynı görsel dil: sosyal önce (doğrulama e-postası
/// gerektirmez), e-posta formu ikinci yol.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().length < 2) {
      setState(() => _error = 'Ad soyad en az 2 karakter olmalı.');
      return;
    }
    if (_password.text.length < 8) {
      setState(() => _error = 'Şifre en az 8 karakter olmalı.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _info = null;
    });
    try {
      final res = await ref
          .read(authRepositoryProvider)
          .signUp(_email.text.trim(), _password.text, _name.text.trim());
      if (res.session == null) {
        // E-posta onayı açık → oturum yok. Kullanıcıyı bilgilendir.
        setState(() => _info =
            'Hesabın oluşturuldu. E-postana gelen bağlantıyla doğrula, sonra giriş yap.');
      }
      // Oturum döndüyse router redirect'i Home'a yönlendirir.
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Kayıt yapılamadı, tekrar dene.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    try {
      await ref
          .read(authRepositoryProvider)
          .resendConfirmation(_email.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Doğrulama e-postası yeniden gönderildi.')));
    } on AuthException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return AuthScaffold(
      title: 'Hedefe ilk adım',
      subtitle: 'Hesabını oluştur — koçun seni bekliyor.',
      children: [
        // Sosyal önce: tek dokunuş, e-posta doğrulaması gerekmez.
        const SocialSignInButtons(),
        const SizedBox(height: AppSpacing.xl),
        const AuthDivider(label: 'ya da e-postayla'),
        const SizedBox(height: AppSpacing.xl),
        TextField(
          controller: _name,
          textCapitalization: TextCapitalization.words,
          autofillHints: const [AutofillHints.name],
          textInputAction: TextInputAction.next,
          decoration: authFieldDecoration(context,
              label: 'Ad soyad', icon: Icons.person_outline_rounded),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          autofillHints: const [AutofillHints.email],
          textInputAction: TextInputAction.next,
          decoration: authFieldDecoration(context,
              label: 'E-posta', icon: Icons.mail_outline_rounded),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _password,
          obscureText: _obscure,
          autofillHints: const [AutofillHints.newPassword],
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _loading ? null : _submit(),
          decoration: authFieldDecoration(
            context,
            label: 'Şifre (en az 8 karakter)',
            icon: Icons.lock_outline_rounded,
            suffix: IconButton(
              tooltip: _obscure ? 'Şifreyi göster' : 'Şifreyi gizle',
              icon: Icon(
                  _obscure
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  size: 20),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        if (_error != null) ...[
          AuthErrorBanner(_error!),
          const SizedBox(height: AppSpacing.md),
        ],
        if (_info != null) ...[
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: tokens.success.withValues(alpha: .10),
              borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              border:
                  Border.all(color: tokens.success.withValues(alpha: .35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Icon(Icons.mark_email_read_outlined,
                      size: 18, color: tokens.success),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text(_info!,
                        style: AppTypography.caption
                            .copyWith(color: tokens.success)),
                  ),
                ]),
                TextButton(
                  onPressed: _loading ? null : _resend,
                  child: const Text('E-postayı yeniden gönder'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
        ],
        PrimaryButton(label: 'Kayıt ol', loading: _loading, onPressed: _submit),
        const SizedBox(height: AppSpacing.lg),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Zaten hesabın var mı?',
                style: AppTypography.body.copyWith(color: tokens.inkSoft)),
            TextButton(
              onPressed: () => context.go('/auth/login'),
              child: const Text('Giriş yap'),
            ),
          ],
        ),
      ],
    );
  }
}

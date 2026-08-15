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

/// Giriş (Doc 27 kimlik kabuğu): sosyal-önce düzen — Apple/Google üstte
/// (kullanıcıların çoğunluğu için tek dokunuş), e-posta ikinci yol.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .signInWithPassword(_email.text.trim(), _password.text);
      // Başarılıysa router auth-state redirect'i Home'a yönlendirir.
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Giriş yapılamadı, tekrar dene.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _forgotPassword() async {
    final controller = TextEditingController(text: _email.text.trim());
    final email = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Şifreni yenile'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          decoration: const InputDecoration(labelText: 'E-posta'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Vazgeç')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: const Text('Bağlantı gönder')),
        ],
      ),
    );
    // Kapanış animasyonu bitmeden dispose = '_dependents.isEmpty' çökmesi.
    Future.delayed(const Duration(milliseconds: 400), controller.dispose);
    if (email == null || email.isEmpty || !mounted) return;
    try {
      await ref.read(authRepositoryProvider).requestPasswordReset(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Bu adresle bir hesap varsa yenileme bağlantısı gönderildi.'),
        ));
      }
    } on AuthException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return AuthScaffold(
      title: 'Tekrar hoş geldin',
      subtitle: 'Koçun ve ilerlemen seni bekliyor.',
      children: [
        // Sosyal önce: tek dokunuşla giriş (web'le aynı hesap).
        const SocialSignInButtons(),
        const SizedBox(height: AppSpacing.xl),
        const AuthDivider(label: 'ya da e-postayla'),
        const SizedBox(height: AppSpacing.xl),
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
          autofillHints: const [AutofillHints.password],
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => _loading ? null : _submit(),
          decoration: authFieldDecoration(
            context,
            label: 'Şifre',
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
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: _loading ? null : _forgotPassword,
            child: const Text('Şifremi unuttum'),
          ),
        ),
        if (_error != null) ...[
          AuthErrorBanner(_error!),
          const SizedBox(height: AppSpacing.md),
        ],
        PrimaryButton(label: 'Giriş yap', loading: _loading, onPressed: _submit),
        const SizedBox(height: AppSpacing.lg),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Hesabın yok mu?',
                style: AppTypography.body.copyWith(color: tokens.inkSoft)),
            TextButton(
              onPressed: () => context.go('/auth/register'),
              child: const Text('Kayıt ol'),
            ),
          ],
        ),
      ],
    );
  }
}
